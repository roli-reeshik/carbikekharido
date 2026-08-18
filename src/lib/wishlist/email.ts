/**
 * Email delivery for price alerts and wishlist digests.
 * Uses Resend HTTP API when RESEND_API_KEY is set; otherwise logs (dev).
 */

export interface EmailResult {
  sent: boolean;
  logged: boolean;
  error?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CarBikeKharido <alerts@carbikekharido.com>";

  if (!key) {
    console.log(`[wishlist-email] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, " ").slice(0, 500)}`);
    return { sent: false, logged: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[wishlist-email]", err);
      return { sent: false, logged: false, error: err };
    }
    return { sent: true, logged: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    return { sent: false, logged: false, error: msg };
  }
}

export function priceDropEmailHtml(opts: {
  userName: string | null;
  brand: string;
  model: string;
  oldPrice: number;
  newPrice: number;
  listingUrl: string;
}): string {
  const savings = opts.oldPrice - opts.newPrice;
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1E3A5F">Price drop alert 🎉</h2>
      <p>Hi ${opts.userName ?? "there"},</p>
      <p>A vehicle on your wishlist just dropped in price:</p>
      <p><strong>${opts.brand} ${opts.model}</strong></p>
      <p style="font-size:20px;color:#FF6B35"><s>₹${opts.oldPrice.toLocaleString("en-IN")}</s> → <strong>₹${opts.newPrice.toLocaleString("en-IN")}</strong></p>
      <p>You save <strong>₹${savings.toLocaleString("en-IN")}</strong>!</p>
      <p><a href="${opts.listingUrl}" style="background:#FF6B35;color:white;padding:10px 20px;text-decoration:none;border-radius:6px">View listing</a></p>
    </div>
  `;
}

export function wishlistDigestEmailHtml(opts: {
  userName: string | null;
  items: { brand: string; model: string; price: number; city: string; url: string }[];
}): string {
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.brand} ${i.model}</td><td style="padding:8px;border-bottom:1px solid #eee">₹${i.price.toLocaleString("en-IN")}</td><td style="padding:8px;border-bottom:1px solid #eee">${i.city}</td><td style="padding:8px;border-bottom:1px solid #eee"><a href="${i.url}">View</a></td></tr>`
    )
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto">
      <h2 style="color:#1E3A5F">Your saved vehicles</h2>
      <p>Hi ${opts.userName ?? "there"}, here's your wishlist digest (${opts.items.length} listings):</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
  `;
}
