"use client";

import { SiteLayout } from "@/components/layout/SiteLayout";

export default function CareersPage() {
  const openings = [
    { title: "Senior Full Stack Engineer (Next.js / Node)", location: "Gurugram / Remote", dept: "Engineering" },
    { title: "Automotive Data & Specs Analyst", location: "Bangalore / Hybrid", dept: "Catalog & Research" },
    { title: "Dealership Partner Success Lead", location: "Mumbai / On-site", dept: "Operations" },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <span className="inline-block rounded-full bg-highway/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-highway">
          Join the Crew
        </span>
        <h1 className="mt-3 font-display text-3xl font-black text-ink sm:text-4xl">
          Build the Future of Indian Automotive Tech
        </h1>
        <p className="mt-2 text-sm text-ink/60 max-w-xl">
          We are engineers, gearheads, and designers crafting high-performance, anonymous-first vehicle intelligence tools.
        </p>

        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-bold text-ink">Current Openings</h2>
          {openings.map((job) => (
            <div key={job.title} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm hover:border-highway transition">
              <div>
                <span className="text-xs font-mono text-highway font-semibold uppercase">{job.dept}</span>
                <h3 className="text-base font-bold text-ink mt-0.5">{job.title}</h3>
                <p className="text-xs text-ink/50 mt-1">{job.location}</p>
              </div>
              <a
                href="mailto:careers@carbikekharido.com"
                className="btn-secondary text-xs shrink-0 self-start sm:self-center"
              >
                Apply via Email →
              </a>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
