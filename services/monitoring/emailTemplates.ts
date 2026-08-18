import type { AlertDetails, AlertPayload } from "./types";

const BRAND = "#1E3A5F";
const ACCENT = "#FF6B35";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailRows(details?: AlertDetails): string {
  if (!details) return "";
  const rows = Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#666">${esc(k)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><code>${esc(String(v))}</code></td></tr>`
    )
    .join("");
  if (!rows) return "";
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">${rows}</table>`;
}

export function alertEmailHtml(payload: AlertPayload): string {
  const severityColor =
    payload.severity === "critical" ? "#dc2626" : payload.severity === "warning" ? "#d97706" : BRAND;

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:${BRAND};padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px">CarBikeKharido Scraping Alert</h1>
    </div>
    <div style="padding:24px">
      <span style="display:inline-block;background:${severityColor};color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 10px;border-radius:4px">${esc(payload.severity)}</span>
      <span style="margin-left:8px;font-size:12px;color:#888">${esc(payload.type.replace(/_/g, " "))}</span>
      <h2 style="margin:16px 0 8px;color:${BRAND};font-size:20px">${esc(payload.subject)}</h2>
      <p style="margin:0;color:#333;line-height:1.6">${esc(payload.message)}</p>
      ${detailRows(payload.details)}
      <p style="margin-top:24px">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/scraping" style="background:${ACCENT};color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600">Open dashboard</a>
      </p>
      <p style="margin-top:20px;font-size:12px;color:#999">${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;
}

export function slackAlertBlocks(payload: AlertPayload) {
  const emoji =
    payload.severity === "critical" ? ":rotating_light:" : payload.severity === "warning" ? ":warning:" : ":information_source:";

  const fields = payload.details
    ? Object.entries(payload.details)
        .slice(0, 8)
        .map(([k, v]) => ({ type: "mrkdwn" as const, text: `*${k}:*\n${v}` }))
    : [];

  return {
    text: `${emoji} ${payload.subject}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${payload.subject}`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.message },
      },
      ...(fields.length
        ? [{ type: "section", fields: fields.slice(0, 10) }]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Type:* ${payload.type} · *Severity:* ${payload.severity}`,
          },
        ],
      },
    ],
  };
}
