"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { VehicleHubPayload } from "@/lib/db/vehicleHubRepo";
import { getAuthToken } from "@/lib/session";
import { useAuthGate } from "@/components/auth/AuthGateProvider";
import { INTENT_ACTIONS } from "@/lib/intent";

type TabId = "specs" | "reviews" | "experts" | "blog";

const TABS: { id: TabId; label: string }[] = [
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews & Q&A" },
  { id: "experts", label: "Ask an Expert" },
  { id: "blog", label: "Related Editions" },
];

function formatSpecKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Cc", "CC")
    .replace("Mm", "mm")
    .replace("Kmpl", "kmpl");
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="hub-stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(Math.round(value))}
      <span className="hub-stars-dim">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function VehicleHubWorkspace({ variantId }: { variantId: number }) {
  const { requireAuth } = useAuthGate();
  const [activeTab, setActiveTab] = useState<TabId>("specs");
  const [hub, setHub] = useState<VehicleHubPayload | null>(null);
  const [seoJsonLd, setSeoJsonLd] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);

  const loadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/vehicles/${variantId}/hub`);
      if (!res.ok) throw new Error("Failed to load vehicle hub");
      const data = await res.json();
      setHub(data);
      setSeoJsonLd(data.seo?.jsonLd ?? null);
    } catch {
      setError("Could not load vehicle data. Ensure the editorial migration has been applied.");
    } finally {
      setLoading(false);
    }
  }, [variantId]);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  // Hydrate Schema.org JSON-LD for organic search (Module 16 SEO requirement).
  useEffect(() => {
    if (!seoJsonLd) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "vehicle-hub-jsonld";
    script.textContent = JSON.stringify(seoJsonLd);
    const existing = document.getElementById("vehicle-hub-jsonld");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [seoJsonLd]);

  async function submitQuestion() {
    requireAuth(INTENT_ACTIONS.POST_REVIEW_OR_QUESTION, async () => {
      setSubmitting(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`/api/v1/vehicles/${variantId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ questionText }),
        });
        if (!res.ok) throw new Error("submit_failed");
        setQuestionText("");
        await loadHub();
      } catch {
        setError("Could not post your question. Please try again.");
      } finally {
        setSubmitting(false);
      }
    });
  }

  async function bookConsultation(expertId: number, slotId: number) {
    requireAuth(INTENT_ACTIONS.BOOK_EXPERT_CONSULTATION, async () => {
      setBookingMsg(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`/api/v1/vehicles/${variantId}/consultations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ expertId, slotId, meetingType: "voice" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "booking_failed");
        setBookingMsg("Consultation booked! You'll receive a callback confirmation shortly.");
        await loadHub();
      } catch {
        setBookingMsg("That slot was just taken or booking failed. Pick another slot.");
      }
    });
  }

  function shareArticle(slug: string, title: string) {
    const url = `${window.location.origin}/news/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      setBookingMsg("Link copied to clipboard.");
    }
  }

  return (
    <section className="hub-workspace reveal" style={{ animationDelay: "0.35s" }}>
      <nav className="hub-tabs" role="tablist" aria-label="Vehicle information">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`hub-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "reviews" && hub?.reviews.totalCount ? (
              <span className="hub-tab-badge">{hub.reviews.totalCount}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="hub-panel" role="tabpanel">
        {loading && <p className="hub-status">Loading workspace…</p>}
        {error && !loading && <p className="hub-status is-error">{error}</p>}
        {bookingMsg && <p className="hub-status is-success">{bookingMsg}</p>}

        {!loading && hub && activeTab === "specs" && (
          <div className="hub-specs-layout">
            <div className="hub-pricing-card">
              <p className="hub-section-label">Pricing</p>
              <p className="hub-price-hero">{hub.specs.pricing.exShowroomLabel}</p>
              <p className="hub-price-sub">Ex-showroom</p>
              {hub.specs.pricing.onRoadTotal && (
                <>
                  <p className="hub-price-onroad">{hub.specs.pricing.onRoadTotal}</p>
                  <p className="hub-price-sub">On-road · {hub.specs.pricing.onRoadCity}</p>
                </>
              )}
              {hub.offers.length > 0 && (
                <div className="hub-offers-list">
                  <p className="hub-section-label">Active offers</p>
                  {hub.offers.map((o) => (
                    <div key={o.id} className="hub-offer-pill">
                      <span>{o.title}</span>
                      <span className="hub-offer-valid">till {o.validTill}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hub-spec-group">
              <p className="hub-section-label">Mechanical</p>
              <div className="hub-spec-grid">
                {Object.entries(hub.specs.core).map(([k, v]) => (
                  <div key={k} className="hub-spec-cell">
                    <span className="hub-spec-key">{formatSpecKey(k)}</span>
                    <span className="hub-spec-val">
                      {k === "arai_mileage" && hub.specs.core.arai_mileage_unit
                        ? `${v} ${hub.specs.core.arai_mileage_unit}`
                        : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(hub.specs.dimensions).length > 0 && (
              <div className="hub-spec-group">
                <p className="hub-section-label">Dimensions</p>
                <div className="hub-spec-grid">
                  {Object.entries(hub.specs.dimensions).map(([k, v]) => (
                    <div key={k} className="hub-spec-cell">
                      <span className="hub-spec-key">{formatSpecKey(k)}</span>
                      <span className="hub-spec-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(hub.specs.safety).length > 0 && (
              <div className="hub-spec-group">
                <p className="hub-section-label">Safety</p>
                <div className="hub-spec-grid">
                  {Object.entries(hub.specs.safety).map(([k, v]) => (
                    <div key={k} className="hub-spec-cell">
                      <span className="hub-spec-key">{formatSpecKey(k)}</span>
                      <span className="hub-spec-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && hub && activeTab === "reviews" && (
          <div className="hub-reviews-layout">
            {hub.reviews.averageRating && (
              <div className="hub-rating-summary">
                <span className="hub-rating-big">{hub.reviews.averageRating}</span>
                <StarRating value={hub.reviews.averageRating} />
                <p className="hub-rating-meta">
                  {hub.reviews.totalCount} reviews · {hub.reviews.verifiedCount} verified owners
                </p>
              </div>
            )}

            <div className="hub-review-feed">
              {hub.reviews.items.map((r) => (
                <article key={r.id} className="hub-review-card">
                  <div className="hub-review-head">
                    <StarRating value={r.rating} />
                    {r.isVerifiedOwner && <span className="hub-verified-badge">✓ Verified Owner</span>}
                  </div>
                  <h3 className="hub-review-title">{r.title}</h3>
                  <p className="hub-review-body">{r.body}</p>
                  <p className="hub-review-meta">
                    {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </article>
              ))}
              {hub.reviews.items.length === 0 && (
                <p className="hub-empty">No reviews yet. Be the first verified owner to share your experience.</p>
              )}
            </div>

            <div className="hub-qa-section">
              <p className="hub-section-label">Community Q&A</p>
              {hub.qa.questions.map((q) => (
                <div key={q.id} className="hub-qa-card">
                  <p className="hub-qa-q">{q.questionText}</p>
                  <p className="hub-qa-meta">Asked by {q.authorName}</p>
                  {q.answers.map((a) => (
                    <div key={a.id} className="hub-qa-answer">
                      <p>{a.answerText}</p>
                      <p className="hub-qa-meta">
                        {a.authorName}
                        {a.isVerifiedOwner && " · Verified Owner"}
                        {a.isExpertResponse && " · Expert"}
                      </p>
                    </div>
                  ))}
                </div>
              ))}

              {hub.qa.expertLog.length > 0 && (
                <div className="hub-expert-log">
                  <p className="hub-section-label">Expert SLA Responses</p>
                  {hub.qa.expertLog.map((l) => (
                    <div key={l.id} className="hub-sla-card">
                      <p className="hub-sla-expert">{l.expertName}</p>
                      <p>{l.responseText}</p>
                      <p className="hub-qa-meta">
                        SLA: {new Date(l.slaDeadline).toLocaleString("en-IN")} · {l.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="hub-question-form">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask the community about this variant…"
                  rows={3}
                  className="hub-textarea"
                />
                <button
                  className="hub-cta"
                  disabled={submitting || questionText.trim().length < 10}
                  onClick={submitQuestion}
                >
                  {submitting ? "Posting…" : "Post question"}
                </button>
                <p className="hub-form-hint">Sign-in required. Verified-owner answers are badge-labelled.</p>
              </div>
            </div>
          </div>
        )}

        {!loading && hub && activeTab === "experts" && (
          <div className="hub-experts-layout">
            {hub.experts.items.map((expert) => (
              <div key={expert.id} className="hub-expert-card">
                <div className="hub-expert-head">
                  <div className="hub-expert-avatar">{expert.name[0]}</div>
                  <div>
                    <h3 className="hub-expert-name">{expert.name}</h3>
                    <p className="hub-expert-title">{expert.title}</p>
                    <p className="hub-expert-rating">★ {expert.rating} · SLA {expert.slaResponseHours}h</p>
                  </div>
                  <p className="hub-expert-fee">₹{expert.consultationFeeInr}</p>
                </div>
                {expert.bio && <p className="hub-expert-bio">{expert.bio}</p>}
                <div className="hub-expert-tags">
                  {expert.specializations.map((s) => (
                    <span key={s} className="hub-tag">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="hub-section-label">Available slots</p>
                <div className="hub-slot-grid">
                  {expert.availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      className="hub-slot-btn"
                      onClick={() => bookConsultation(expert.id, slot.id)}
                    >
                      {new Date(slot.slotStart).toLocaleString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                  {expert.availableSlots.length === 0 && (
                    <p className="hub-empty">No open slots — check back tomorrow.</p>
                  )}
                </div>
              </div>
            ))}
            {hub.experts.items.length === 0 && (
              <p className="hub-empty">No experts tagged for this vehicle type yet.</p>
            )}
          </div>
        )}

        {!loading && hub && activeTab === "blog" && (
          <div className="hub-blog-grid">
            {hub.editorial.articles.map((article) => (
              <article key={article.id} className="hub-blog-card">
                <div className="hub-blog-thumb">📰</div>
                <div className="hub-blog-body">
                  <h3 className="hub-blog-title">
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h3>
                  {article.excerpt && <p className="hub-blog-excerpt">{article.excerpt}</p>}
                  <p className="hub-blog-meta">
                    {article.authorName} · {article.readTimeMinutes} min read
                    {article.publishedAt &&
                      ` · ${new Date(article.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                  </p>
                  <div className="hub-blog-actions">
                    <Link href={`/news/${article.slug}`} className="hub-link">
                      Read →
                    </Link>
                    <button
                      className="hub-link"
                      onClick={() => shareArticle(article.slug, article.title)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {hub.editorial.articles.length === 0 && (
              <p className="hub-empty">No related articles tagged for this model yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
