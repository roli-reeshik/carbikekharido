/**
 * Puppeteer scraper for OLX India vehicle listings.
 *
 * Selectors may need updates when OLX changes markup — see OLX_SELECTORS below.
 */
import type { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from "puppeteer";
import type { ScrapedListing } from "../scrapedListing.types";
import { saveAggregatedListings, writeScrapeLog } from "../aggregatedListingRepo";
import { ImageDownloader } from "../imageDownloader";
import type { CreateAggregatedImageInput } from "../persistence.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const OLX_SELECTORS = {
  listingCard: '[data-aut-id="itemBox"], li[data-aut-id="itemBox"], div[data-aut-id="itemBox"]',
  title: '[data-aut-id="itemTitle"]',
  price: '[data-aut-id="itemPrice"]',
  location: '[data-aut-id="item-location"], [data-aut-id="item-location"] span',
  image: "img[src], picture img",
  link: 'a[href*="/item/"], a[href*="/ad/"]',
  mileage: '[data-aut-id="item-details"], .item-details',
} as const;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

const CITY_SLUGS: Record<string, string> = {
  delhi: "delhi",
  mumbai: "mumbai",
  bangalore: "bangalore",
  bengaluru: "bangalore",
  chennai: "chennai",
  hyderabad: "hyderabad",
  pune: "pune",
};

const PAGE_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const SCROLL_PAUSE_MS = 1200;
const RATE_LIMIT_MIN_MS = 2000;
const RATE_LIMIT_MAX_MS = 5000;

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(): Promise<void> {
  const ms = RATE_LIMIT_MIN_MS + Math.random() * (RATE_LIMIT_MAX_MS - RATE_LIMIT_MIN_MS);
  return new Promise((r) => setTimeout(r, ms));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildOlxUrl(city: string, category: "cars" | "bikes" = "cars"): string {
  const slug = CITY_SLUGS[city.toLowerCase()] ?? city.toLowerCase();
  if (category === "bikes") {
    return `https://www.olx.in/motorcycles_c81?location=${slug}`;
  }
  return `https://www.olx.in/cars-${slug}/`;
}

function parsePriceInr(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function extractExternalId(url: string): string {
  const m = url.match(/\/(\d{8,})(?:\/|$|\?)/) ?? url.match(/iid-(\d+)/);
  return m?.[1] ?? Buffer.from(url).toString("base64url").slice(0, 24);
}

// ---------------------------------------------------------------------------
// OLXScraper
// ---------------------------------------------------------------------------

export class OLXScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private category: "cars" | "bikes" = "cars";
  private readonly imageDownloader: ImageDownloader;

  constructor(opts?: { category?: "cars" | "bikes" }) {
    if (opts?.category) this.category = opts.category;
    this.imageDownloader = new ImageDownloader({
      source: "olx",
      onProgress: (p) => {
        if (p.completed % 5 === 0 || p.completed === p.total) {
          console.info(`[OLXScraper] images ${p.completed}/${p.total} (${p.failed} failed)`);
        }
      },
    });
  }

  /** Launch headless Chromium with sandbox-friendly flags. */
  async initialize(): Promise<void> {
    if (this.browser) return;

    await writeScrapeLog("info", "Launching Puppeteer browser");

    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1366, height: 900 });
    await this.page.setUserAgent(randomUserAgent());
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-IN,en;q=0.9",
    });
  }

  private async getPage(): Promise<Page> {
    if (!this.page) throw new Error("Scraper not initialized — call initialize() first");
    return this.page;
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await writeScrapeLog("warn", `${label} attempt ${attempt}/${MAX_RETRIES} failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
        if (attempt < MAX_RETRIES) await sleep(1000 * 2 ** (attempt - 1));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private async autoScroll(page: Page, maxScrolls = 15): Promise<void> {
    let previousHeight = 0;
    for (let i = 0; i < maxScrolls; i++) {
      const height = await page.evaluate(() => document.body.scrollHeight);
      if (height === previousHeight && i > 2) break;
      previousHeight = height;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(SCROLL_PAUSE_MS);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Navigate to OLX city page, scroll for AJAX listings, parse cards.
   */
  async scrapeListings(city: string, limit = 100): Promise<ScrapedListing[]> {
    const page = await this.getPage();
    const url = buildOlxUrl(city, this.category);

    await writeScrapeLog("info", `Scraping ${url}`, { city, limit });

    await this.withRetry("page.goto", async () => {
      await page.setUserAgent(randomUserAgent());
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
      await page.waitForSelector(OLX_SELECTORS.listingCard, { timeout: PAGE_TIMEOUT_MS }).catch(() => null);
    });

    await this.autoScroll(page);

    const cards = await page.$$(OLX_SELECTORS.listingCard);
    await writeScrapeLog("info", `Found ${cards.length} listing cards on page`, { city });

    const results: ScrapedListing[] = [];
    const seen = new Set<string>();

    for (const card of cards) {
      if (results.length >= limit) break;

      try {
        const parsed = await this.parseListingData(card, city);
        if (!parsed || seen.has(parsed.externalId)) continue;
        seen.add(parsed.externalId);
        results.push(parsed);

        if (results.length % 10 === 0) {
          await writeScrapeLog("info", `Parsed ${results.length} listings`, { city });
        }

        await randomDelay();
      } catch (err) {
        await writeScrapeLog("warn", "parseListingData failed for card", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }

  /**
   * Extract listing fields from a search-result card element.
   */
  async parseListingData(
    element: ElementHandle<Element>,
    city: string
  ): Promise<ScrapedListing | null> {
    const category = this.category;
    const selectors = OLX_SELECTORS;

    const raw = await element.evaluate(
      (el, sel) => {
        const q = (s: string) => el.querySelector(s);
        const qt = (s: string) => q(s)?.textContent?.trim() ?? "";

        const linkEl = el.querySelector(sel.link) as HTMLAnchorElement | null;
        const href = linkEl?.href ?? "";
        if (!href) return null;

        const imgEls = Array.from(el.querySelectorAll(sel.image)) as HTMLImageElement[];
        const imageUrls = [
          ...new Set(
            imgEls
              .map((img) => img.src || img.getAttribute("data-src") || "")
              .filter((u) => u.startsWith("http"))
          ),
        ];

        const title = qt(sel.title) || linkEl?.getAttribute("title") || "";
        const priceText = qt(sel.price);
        const location = qt(sel.location);
        const details = qt(sel.mileage);

        let mileage: string | undefined;
        let condition: string | undefined;
        if (details) {
          const km = details.match(/([\d,]+)\s*km/i);
          if (km) mileage = km[0];
          if (/excellent|good|fair|new/i.test(details)) condition = details;
        }

        return { href, title, priceText, location, imageUrls, mileage, condition };
      },
      selectors
    );

    if (!raw?.href || !raw.title) return null;

    const priceInr = parsePriceInr(raw.priceText);
    if (priceInr < 1000) return null;

    const listingUrl = raw.href.startsWith("http") ? raw.href : `https://www.olx.in${raw.href}`;
    const externalId = extractExternalId(listingUrl);

    return {
      externalId,
      sourceWebsite: "olx",
      title: raw.title,
      priceInr,
      imageUrls: raw.imageUrls,
      location: raw.location || city,
      mileage: raw.mileage,
      condition: raw.condition,
      sellerName: undefined,
      listingUrl,
      city: city.toLowerCase(),
      category,
    };
  }

  /**
   * Download images, compress, upload to Supabase. Retries each URL up to 3 times.
   */
  async downloadImages(urls: string[], externalId: string): Promise<string[]> {
    if (!urls.length) return [];
    const uploaded = await this.imageDownloader.downloadImages(urls.slice(0, 10), externalId);
    return uploaded.map((u) => u.publicUrl);
  }

  /**
   * Upsert listings + images into aggregated_listings tables.
   * Skips re-upload when image URLs are already on Supabase.
   */
  async saveToDatabase(listings: ScrapedListing[]): Promise<{
    created: number;
    updated: number;
    imagesDownloaded: number;
  }> {
    const imageMap = new Map<string, CreateAggregatedImageInput[]>();
    let imagesDownloaded = 0;

    for (const listing of listings) {
      if (!listing.imageUrls.length) continue;

      const needsUpload = listing.imageUrls.some(
        (u) => !u.includes("supabase") && !u.includes("vehicle-listings")
      );

      try {
        if (needsUpload) {
          const uploaded = await this.imageDownloader.downloadImages(
            listing.imageUrls.slice(0, 10),
            listing.externalId
          );
          imagesDownloaded += uploaded.length;
          if (uploaded.length) {
            imageMap.set(
              listing.externalId,
              uploaded.map((img) => ({
                url: img.publicUrl,
                thumbnailUrl: img.thumbnailUrl,
                order: img.order,
                quality: img.quality,
              }))
            );
            listing.imageUrls = uploaded.map((u) => u.publicUrl);
          }
        } else {
          imageMap.set(
            listing.externalId,
            listing.imageUrls.map((url, order) => ({ url, order, quality: 80 }))
          );
        }
      } catch (err) {
        await writeScrapeLog("warn", "Image upload batch failed", {
          externalId: listing.externalId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const stats = await saveAggregatedListings(listings, imageMap);
    await writeScrapeLog("info", "Saved listings to database", { ...stats, imagesDownloaded });
    return { ...stats, imagesDownloaded };
  }

  /** Full pipeline: scrape → images → DB. */
  async run(city: string, limit = 100): Promise<{
    listings: ScrapedListing[];
    listingsScraped: number;
    imagesDownloaded: number;
    created: number;
    updated: number;
  }> {
    await this.initialize();
    try {
      const listings = await this.scrapeListings(city, limit);
      const { created, updated, imagesDownloaded } = await this.saveToDatabase(listings);

      return {
        listings,
        listingsScraped: listings.length,
        imagesDownloaded,
        created,
        updated,
      };
    } finally {
      await this.close();
    }
  }

  /** Release browser memory. */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close().catch(() => null);
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close().catch(() => null);
        this.browser = null;
      }
      await writeScrapeLog("info", "Browser closed");
    } catch (err) {
      await writeScrapeLog("warn", "Error closing browser", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export { buildOlxUrl, parsePriceInr, extractExternalId };
