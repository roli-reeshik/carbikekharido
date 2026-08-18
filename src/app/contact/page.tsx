"use client";

import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-highway/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-highway">
            Get in Touch
          </span>
          <h1 className="mt-3 font-display text-3xl font-black text-ink sm:text-4xl">
            Contact Support &amp; Dealership Services
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Have questions about a listing, valuation, or dealership partnership? Our concierge team is here to assist.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2 space-y-6 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <div>
              <h3 className="font-display font-bold text-ink">Headquarters</h3>
              <p className="mt-1 text-sm text-ink/60">
                DLF Cyber City, Tower 10B<br />
                Gurugram, Haryana 122002<br />
                India
              </p>
            </div>

            <div className="border-t border-line pt-4">
              <h3 className="font-display font-bold text-ink">Direct Support</h3>
              <p className="mt-1 text-sm text-ink/60">support@carbikekharido.com</p>
              <p className="text-sm font-mono text-highway font-bold mt-1">+91 1800 200 8899</p>
            </div>

            <div className="border-t border-line pt-4">
              <h3 className="font-display font-bold text-ink">Hours of Operation</h3>
              <p className="mt-1 text-xs text-ink/60">Mon - Sat: 9:00 AM - 8:00 PM IST</p>
              <p className="text-xs text-ink/60">Sunday: 10:00 AM - 4:00 PM IST</p>
            </div>
          </div>

          <div className="md:col-span-3 rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                  ✓
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">Message Received!</h3>
                <p className="mt-2 text-sm text-ink/60">
                  Thank you for reaching out. An automotive specialist will respond to {formData.email || "your email"} within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 btn-secondary text-xs"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-highway"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="mt-1 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-highway"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Inquiry about Dealership Listings"
                    className="mt-1 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-highway"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we assist you?"
                    className="mt-1 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-highway resize-none"
                  />
                </div>

                <button type="submit" className="w-full btn-primary mt-2">
                  Submit Inquiry →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
