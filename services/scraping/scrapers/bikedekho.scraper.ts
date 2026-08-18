/**
 * Scrapes structured two-wheeler specifications from BikeDekho model pages.
 *
 * Unlike the OLX scraper this uses plain `fetch` rather than Puppeteer: the
 * specs are server-rendered into `window.__INITIAL_STATE__`, so there is no
 * client-side rendering to wait for. That makes a full 992-model pass cheap
 * enough to run weekly.
 */
import { writeScrapeLog } from "../aggregatedListingRepo";
import { parseBikeSpecPage } from "../bikeSpecs/parse";
import type { BikeSpecScrapeResult } from "../bikeSpecs/types";

const SOURCE = "bikedekho";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
];

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_RETRIES = 3;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MIN_DELAY_MS = 1200;
const DEFAULT_MAX_DELAY_MS = 2600;

/**
 * A model whose specs we want. Deliberately decoupled from `CatalogModel` so
 * the scraper can be driven from a catalog index, a database, or a test list.
 */
export interface BikeSpecTarget {
  modelId: string;
  brandSlug: string;
  modelSlug: string;
  modelName: string;
  sourceUrl: string;
}

export interface BikeSpecScrapeProgress {
  completed: number;
  total: number;
  succeeded: number;
  failed: number;
}

export interface BikeDekhoScraperOptions {
  concurrency?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  onProgress?: (p: BikeSpecScrapeProgress) => void | Promise<void>;
}

export interface BikeSpecBatchResult {
  results: BikeSpecScrapeResult[];
  failures: { modelId: string; reason: string }[];
}

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export class BikeDekhoSpecScraper {
  private readonly concurrency: number;
  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly onProgress?: BikeDekhoScraperOptions["onProgress"];

  constructor(opts: BikeDekhoScraperOptions = {}) {
    this.concurrency = Math.max(1, opts.concurrency ?? DEFAULT_CONCURRENCY);
    this.minDelayMs = opts.minDelayMs ?? DEFAULT_MIN_DELAY_MS;
    this.maxDelayMs = opts.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.onProgress = opts.onProgress;
  }

  private randomDelay(): Promise<void> {
    const ms = this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs);
    return sleep(ms);
  }

  /** Fetch with a hard timeout so one hung request cannot stall a batch. */
  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": randomUserAgent(),
          "Accept-Language": "en-IN,en;q=0.9",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Scrape a single model. Returns null when the page has no parseable state,
   * which is expected for discontinued models whose pages have been stripped.
   */
  async scrapeModel(target: BikeSpecTarget): Promise<BikeSpecScrapeResult | null> {
    let lastErr: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const html = await this.fetchHtml(target.sourceUrl);
        const parsed = parseBikeSpecPage(html);
        if (!parsed) return null;

        return {
          modelId: target.modelId,
          brandSlug: target.brandSlug,
          modelSlug: target.modelSlug,
          modelName: target.modelName,
          sourceUrl: target.sourceUrl,
          source: SOURCE,
          spec: parsed.spec,
          rawSpecs: parsed.rawSpecs,
          completeness: parsed.completeness,
        };
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES) await sleep(1000 * 2 ** (attempt - 1));
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /**
   * Scrape many models with bounded concurrency.
   *
   * Individual failures are collected rather than thrown so that a handful of
   * dead model pages cannot abort a run over ~992 targets.
   */
  async scrapeMany(targets: BikeSpecTarget[]): Promise<BikeSpecBatchResult> {
    const results: BikeSpecScrapeResult[] = [];
    const failures: { modelId: string; reason: string }[] = [];
    const total = targets.length;
    let cursor = 0;
    let completed = 0;

    await writeScrapeLog(
      "info",
      `Starting bike spec scrape for ${total} models`,
      { concurrency: this.concurrency },
      SOURCE
    );

    const worker = async () => {
      for (;;) {
        const index = cursor++;
        if (index >= total) return;
        const target = targets[index];

        try {
          const result = await this.scrapeModel(target);
          if (result) results.push(result);
          else failures.push({ modelId: target.modelId, reason: "no parseable state" });
        } catch (err) {
          failures.push({
            modelId: target.modelId,
            reason: err instanceof Error ? err.message : String(err),
          });
        }

        completed++;
        if (this.onProgress && (completed % 10 === 0 || completed === total)) {
          await this.onProgress({
            completed,
            total,
            succeeded: results.length,
            failed: failures.length,
          });
        }

        await this.randomDelay();
      }
    };

    await Promise.all(Array.from({ length: Math.min(this.concurrency, total) }, worker));

    await writeScrapeLog(
      "info",
      "Bike spec scrape finished",
      { total, succeeded: results.length, failed: failures.length },
      SOURCE
    );

    return { results, failures };
  }
}

export { SOURCE as BIKEDEKHO_SOURCE };
