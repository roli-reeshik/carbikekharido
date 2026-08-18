"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminFetch,
  adminPost,
  getAdminToken,
  setAdminToken,
} from "@/lib/dashboard/adminApi";
import type {
  DashboardAlert,
  DashboardErrorLog,
  DashboardJobRow,
  ExtendedDashboardSnapshot,
} from "@/lib/dashboard/types";
import type { ScrapeCity, ScrapeJobType, ScrapeVehicleCategory } from "@services/scraping/types";

const POLL_MS = 10_000;

const JOB_TYPES: ScrapeJobType[] = ["olx_scrape", "cars24_scrape", "cardekho_scrape", "spinny_scrape"];
const CITIES: ScrapeCity[] = ["delhi", "mumbai", "bangalore", "chennai", "hyderabad", "pune"];

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function formatRemaining(ms: number | null): string {
  if (ms == null) return "Estimating…";
  if (ms < 60000) return `< 1 min`;
  return `~${Math.ceil(ms / 60000)} min left`;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "SUCCESS" || status === "completed"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "FAILED" || status === "failed"
        ? "bg-red-500/20 text-red-400"
        : status === "RUNNING" || status === "active"
          ? "bg-blue-500/20 text-blue-400"
          : "bg-zinc-500/20 text-zinc-400";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-zinc-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export default function ScrapingDashboard() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState<ExtendedDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<DashboardAlert[]>([]);
  const [seenAlertIds, setSeenAlertIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<DashboardJobRow | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortCol, setSortCol] = useState<"date" | "source" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [newJob, setNewJob] = useState({
    jobType: "olx_scrape" as ScrapeJobType,
    city: "delhi" as ScrapeCity,
    category: "cars" as ScrapeVehicleCategory,
  });
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAdminToken());
    setTokenInput(getAdminToken());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await adminFetch<ExtendedDashboardSnapshot>("/api/queue/dashboard");
      setData(snapshot);

      const newAlerts = (snapshot.alerts ?? []).filter((a) => !seenAlertIds.has(a.id));
      if (newAlerts.length) {
        setToasts((prev) => [...newAlerts, ...prev].slice(0, 5));
        setSeenAlertIds((prev) => {
          const next = new Set(prev);
          newAlerts.forEach((a) => next.add(a.id));
          return next;
        });
      }

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [seenAlertIds]);

  useEffect(() => {
    if (!token && process.env.NODE_ENV !== "development") return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [token, refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowAddJob(true);
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
      if (e.key === "Escape") {
        setShowAddJob(false);
        setSelectedJob(null);
        setShowShortcuts(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function saveToken() {
    setAdminToken(tokenInput.trim());
    setToken(tokenInput.trim());
    setLoading(true);
    await refresh();
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      await adminPost("/api/monitoring/alerts", { action: "acknowledge", alertId });
      setToasts((t) => t.filter((a) => a.id !== alertId));
      await refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Ack failed");
    }
  }

  async function togglePause() {
    if (!data) return;
    try {
      await adminPost("/api/queue/control", { action: data.queue.paused ? "resume" : "pause" });
      setActionMsg(data.queue.paused ? "Queue resumed" : "Queue paused");
      await refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Action failed");
    }
  }

  async function clearQueue() {
    if (!confirm("Clear all waiting jobs from the queue?")) return;
    try {
      await adminPost("/api/queue/control", { action: "clear", includeFailed: false });
      setActionMsg("Queue cleared");
      await refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Clear failed");
    }
  }

  async function addJob() {
    try {
      const res = await fetch("/api/queue/enqueue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      const json = (await res.json()) as { ok?: boolean; jobId?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Enqueue failed");
      setActionMsg(`Job enqueued: ${json.jobId}`);
      setShowAddJob(false);
      await refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Enqueue failed");
    }
  }

  async function retryJob(job: DashboardJobRow) {
    const id = job.bullJobId ?? job.id;
    try {
      await adminPost(`/api/queue/jobs/${encodeURIComponent(id)}`, { action: "retry" });
      setActionMsg(`Retrying job ${id}`);
      await refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Retry failed");
    }
  }

  function downloadLogs() {
    const t = getAdminToken();
    fetch("/api/queue/control?download=1&limit=500", {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `scrape-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setActionMsg("Log download failed — check admin token"));
  }

  const filteredJobs = useMemo(() => {
    if (!data) return [];
    let rows = [...data.jobHistory];
    if (statusFilter !== "all") rows = rows.filter((j) => j.status === statusFilter);
    if (sourceFilter !== "all") rows = rows.filter((j) => j.source === sourceFilter);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortCol === "source") cmp = a.source.localeCompare(b.source);
      if (sortCol === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, statusFilter, sourceFilter, sortCol, sortDir]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  if (!token && process.env.NODE_ENV !== "development") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <h1 className="font-display text-2xl font-bold">Scraping dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">Enter admin token (CRON_SECRET)</p>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          placeholder="Bearer token"
        />
        <button
          type="button"
          onClick={saveToken}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
        >
          Continue
        </button>
      </div>
    );
  }

  const current = data?.currentJobs[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-50 sm:text-3xl">Scraping monitor</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time queue · polls every 10s
            {data?.fetchedAt && (
              <span className="ml-2 text-zinc-600">Updated {new Date(data.fetchedAt).toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={refresh} className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700">
            ↻ Refresh
          </button>
          <button type="button" onClick={() => setShowAddJob(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
            + Add job
          </button>
          <button type="button" onClick={togglePause} className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700">
            {data?.queue.paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button type="button" onClick={clearQueue} className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20">
            Clear queue
          </button>
          <button type="button" onClick={downloadLogs} className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700">
            ↓ Logs
          </button>
          <button type="button" onClick={() => setShowShortcuts(true)} className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-700">
            ?
          </button>
        </div>
      </header>

      {actionMsg && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          {actionMsg}
          <button type="button" className="ml-3 underline" onClick={() => setActionMsg(null)}>
            dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={refresh}>
            retry
          </button>
        </div>
      )}

      {/* Dashboard alerts banner */}
      {(data?.alerts?.length ?? 0) > 0 && (
        <section className="mb-6 space-y-2">
          {data!.alerts!.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                alert.severity === "critical"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              <div>
                <span className="mr-2 text-xs font-bold uppercase">{alert.type.replace(/_/g, " ")}</span>
                {alert.message}
              </div>
              <button
                type="button"
                onClick={() => acknowledgeAlert(alert.id)}
                className="shrink-0 text-xs font-semibold underline opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl"
          >
            <p className="text-xs font-bold uppercase text-amber-400">{toast.type.replace(/_/g, " ")}</p>
            <p className="mt-1 text-sm text-zinc-200">{toast.message}</p>
            <button
              type="button"
              onClick={() => {
                acknowledgeAlert(toast.id);
                setToasts((t) => t.filter((x) => x.id !== toast.id));
              }}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>

      {loading && !data ? (
        <p className="text-zinc-500">Loading dashboard…</p>
      ) : data ? (
        <>
          {/* Queue stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Pending" value={String(data.queue.pending)} sub={data.queue.paused ? "PAUSED" : "active"} />
            <StatCard label="Active" value={String(data.queue.active)} />
            <StatCard label="Completed" value={String(data.queue.completed)} />
            <StatCard label="Failed" value={String(data.queue.failed)} />
            <StatCard label="Delayed" value={String(data.queue.delayed)} />
          </div>

          {/* Today stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <StatCard label="Listings today" value={String(data.stats.listingsToday)} />
            <StatCard label="Images today" value={String(data.stats.imagesDownloadedToday)} />
            <StatCard label="Storage used" value={`${data.stats.storageUsedGb} GB`} sub="estimated" />
            <StatCard label="Success rate" value={`${data.stats.successRatePercent}%`} sub="7 days" />
            <StatCard label="Avg processing" value={`${data.stats.avgProcessingMinutes} min`} />
            {data.monitoring && (
              <StatCard
                label="Est. cost"
                value={`$${data.monitoring.estimatedCostUsd}`}
                sub={`${data.monitoring.errorRatePercent}% err (24h)`}
              />
            )}
          </div>

          {/* Current job */}
          {current && (
            <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Current job</h2>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-100">
                    {current.source.toUpperCase()} · {current.city} · {current.category}
                  </p>
                  <p className="text-xs text-zinc-500">ID {current.jobId}</p>
                </div>
                <p className="text-sm text-zinc-400">{formatRemaining(current.estimatedRemainingMs)}</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, current.progress)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-500">
                <span>{current.progress}%</span>
                <span>
                  {current.listingsScraped} listings · {current.imagesDownloaded} images
                </span>
              </div>
            </section>
          )}

          {/* Charts */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Success rate by day</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                    labelStyle={{ color: "#fafafa" }}
                  />
                  <Line type="monotone" dataKey="successRate" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Success %" />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Avg processing (min)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                  />
                  <Bar dataKey="avgProcessingMinutes" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          {/* Job history */}
          <section className="mb-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Job history</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                >
                  <option value="all">All statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="RUNNING">Running</option>
                  <option value="PENDING">Pending</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                >
                  <option value="all">All sources</option>
                  {[...new Set(data.jobHistory.map((j) => j.source))].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                    <th className="cursor-pointer px-4 py-3 hover:text-zinc-300" onClick={() => toggleSort("date")}>
                      Date {sortCol === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-zinc-300" onClick={() => toggleSort("source")}>
                      Source {sortCol === "source" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-zinc-300" onClick={() => toggleSort("status")}>
                      Status {sortCol === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-3">Listings</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-800/40"
                      onClick={() => setSelectedJob(job)}
                    >
                      <td className="px-4 py-3 text-zinc-400">{new Date(job.date).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-200">{job.source}</span>
                        {job.city && <span className="ml-1 text-zinc-500">· {job.city}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{job.listingsScraped}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDuration(job.durationMs)}</td>
                      <td className="px-4 py-3 text-zinc-400">{job.errorsEncountered || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Error log */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Error log</h2>
            <div className="space-y-2">
              {data.errorLogs.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent errors</p>
              ) : (
                data.errorLogs.map((log) => (
                  <ErrorLogRow
                    key={log.id}
                    log={log}
                    expanded={expandedError === log.id}
                    onToggle={() => setExpandedError(expandedError === log.id ? null : log.id)}
                    onRetry={() => {
                      const failed = data.jobHistory.find((j) => j.status === "FAILED" && j.source === log.source);
                      if (failed) retryJob(failed);
                    }}
                  />
                ))
              )}
            </div>
          </section>
        </>
      ) : null}

      {/* Job detail modal */}
      {selectedJob && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/60" aria-label="Close" onClick={() => setSelectedJob(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-zinc-100">Job details</h3>
              <button type="button" onClick={() => setSelectedJob(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="ID" value={selectedJob.bullJobId ?? selectedJob.id} />
              <Row label="Type" value={selectedJob.jobType} />
              <Row label="Source" value={selectedJob.source} />
              <Row label="Location" value={`${selectedJob.city ?? "—"} / ${selectedJob.category ?? "—"}`} />
              <Row label="Status" value={selectedJob.status} />
              <Row label="Listings" value={String(selectedJob.listingsScraped)} />
              <Row label="Images" value={String(selectedJob.imagesDownloaded)} />
              <Row label="Duration" value={formatDuration(selectedJob.durationMs)} />
              <Row label="Date" value={new Date(selectedJob.date).toLocaleString()} />
            </dl>
            {selectedJob.errorLog && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-red-400">
                {selectedJob.errorLog}
              </pre>
            )}
            {selectedJob.status === "FAILED" && (
              <button
                type="button"
                onClick={() => retryJob(selectedJob)}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Retry job
              </button>
            )}
          </div>
        </>
      )}

      {/* Add job modal */}
      {showAddJob && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/60" aria-label="Close" onClick={() => setShowAddJob(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="font-semibold">Add scrape job</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-zinc-500">
                Source
                <select
                  value={newJob.jobType}
                  onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value as ScrapeJobType })}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_scrape", "")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-500">
                City
                <select
                  value={newJob.city}
                  onChange={(e) => setNewJob({ ...newJob, city: e.target.value as ScrapeCity })}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-500">
                Category
                <select
                  value={newJob.category}
                  onChange={(e) => setNewJob({ ...newJob, category: e.target.value as ScrapeVehicleCategory })}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                >
                  <option value="cars">Cars</option>
                  <option value="bikes">Bikes</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={addJob} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Enqueue
              </button>
              <button type="button" onClick={() => setShowAddJob(false)} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Shortcuts help */}
      {showShortcuts && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowShortcuts(false)} aria-label="Close" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="font-semibold">Keyboard shortcuts</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">R</kbd> Refresh
              </li>
              <li>
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">P</kbd> Pause / resume queue
              </li>
              <li>
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">N</kbd> New job
              </li>
              <li>
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">?</kbd> This help
              </li>
              <li>
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">Esc</kbd> Close modals
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-mono text-zinc-200">{value}</dd>
    </div>
  );
}

function ErrorLogRow({
  log,
  expanded,
  onToggle,
  onRetry,
}: {
  log: DashboardErrorLog;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
      >
        <div className="min-w-0 flex-1">
          <span className={`mr-2 text-xs font-bold uppercase ${log.level === "error" ? "text-red-400" : "text-amber-400"}`}>
            {log.level}
          </span>
          <span className="text-zinc-300">{log.message}</span>
        </div>
        <span className="shrink-0 text-xs text-zinc-600">{new Date(log.timestamp).toLocaleString()}</span>
      </button>
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">Source: {log.source}</p>
          {log.meta && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-900 p-2 text-xs text-zinc-400">{log.meta}</pre>
          )}
          {log.level === "error" && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Retry related job
            </button>
          )}
        </div>
      )}
    </div>
  );
}
