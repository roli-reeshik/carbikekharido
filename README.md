# CarBikeKharido.com — Module 1 + Backend + Homepage

Anonymous-first identity (Module 1), a real MySQL backend (users, sessions,
catalog, used listings, orders/transactions), and a redesigned homepage —
bilingual (English/Hindi), covering cars and bikes.

## 1. Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **MySQL** or **MariaDB**, installed locally. On Windows, the easiest path
  is [MySQL Installer for Windows](https://dev.mysql.com/downloads/installer/)
  (pick "MySQL Server" — the full Workbench isn't required). MariaDB is a
  drop-in equivalent if you already have it.

## 2. Set up the database (one-time)

Open a terminal (Command Prompt/PowerShell on Windows) and connect as root
(you'll be prompted for the password — `RK516821rk@`):

```bash
mysql -u root -p
```

Create the database:

```sql
CREATE DATABASE carbikekharido CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Load the schema and (optional) seed data:

```bash
mysql -u root -p carbikekharido < db/schema.sql
mysql -u root -p carbikekharido < db/seed.sql
```

`db/schema.sql` and `db/seed.sql` have both been run and verified against a
live MySQL-compatible server while building this, including the orders/
transactions flow end-to-end — see "What's been tested" below.

*(Optional, recommended if this ever goes beyond your own machine: also
run the `CREATE USER 'cbd_app'@'localhost' ...` / `GRANT` statements from
`.env.example`'s comments, then point `.env.local` at that user instead of
root. Not required for local dev — skip it for now if you just want this
running.)*

## 3. Configure the app

This is already configured for you: `.env.local` is included, pointed at
your local root account:

```
DB_USER=root
DB_PASSWORD=RK516821rk@
```

No copying or editing needed — `npm install && npm run dev` will connect
immediately, provided your local MySQL root password matches the above.

**Worth knowing**: this is fine for local, single-developer work, which is
what this is right now. If this project ever gets shared with a team,
committed somewhere public, or deployed anywhere beyond your own machine,
switch the app's connection back to a scoped user instead of root — the
app only ever needs privileges on the `carbikekharido` database, never full
server access. `.env.example` still documents that scoped-user setup
(`cbd_app`) as the recommended path for that point; swapping is just
re-pointing `DB_USER`/`DB_PASSWORD` in `.env.local`, nothing in the code
changes either way.

`.env.local` is already in `.gitignore`, so it won't get committed if you
put this project under git.

## 4. Install and run

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

## What's new since the Module 1 demo

### Real backend (was: browser localStorage / server memory)

| Before (demo) | Now |
|---|---|
| OTP in server memory, lost on restart | `otp_verifications` table, hashed codes, durable |
| Auth token made up client-side | Real `sessions` table, server-issued UUID, revocable |
| No concept of a purchase | `orders` + `transactions` + `order_status_history` tables |
| No user record | `users` row created lazily, only after first OTP verification |

The **shape of the auth API didn't change** — `RegistrationModal.tsx` still
calls `POST /api/auth` with the same `{ step, phone, code }` body it always
did. Swapping the backing store from memory to MySQL was contained entirely
to `src/lib/db/*` and the route handler.

### Orders & transactions

- `POST /api/orders` — creates an order (new-vehicle booking or used-vehicle
  purchase; same table, `orderType` discriminator). Requires
  `Authorization: Bearer <session-token>` — creating an order is a purchase
  action, never something an anonymous visitor can do.
- `GET /api/orders` — lists the authenticated user's orders with their
  latest transaction status (via the `v_order_summary` view).
- `GET /api/orders/[id]` — a single order's status, scoped to its owner.
- `src/lib/db/ordersRepo.ts` also exposes `recordTransaction()` and
  `updateOrderStatus()` for wiring in a real payment gateway later — see
  "Adding a real payment gateway" below.

### Redesigned homepage

The old single-column demo page is now a full homepage structured around
an original **"journey rail"** layout — a dashed route-line down the page
with a milestone at each real stage of buying a vehicle: **Explore → Compare
→ Verify → Own**. This isn't decorative — it's the literal sequence a buyer
moves through, so the PRD-derived content sections have a spine instead of
being stacked carousels:

- **Explore**: hero search + city selector, budget browse pills, brand
  strip, popular vehicles (car/bike toggle)
- **Compare**: comparison-tool teaser
- **Verify**: the four consumer-trust differentiators (anonymous browsing,
  vehicle history report, price-lock, lead consent) + a live, slider-driven
  EMI calculator (computed client-side — no API call needed for an
  indicative estimate)
- **Own**: blog/news teaser

Palette and type are deliberately not the generic "AI-default" look (warm
cream + serif, or near-black + neon) — see the comments at the top of
`tailwind.config.js` and `globals.css` for the specific choices and why.
**One thing to do on your machine**: the font stack currently falls back to
system fonts, because this sandbox can't reach `fonts.googleapis.com`. Swap
in real webfonts (Space Grotesk for display, Noto Sans + Noto Sans
Devanagari for body, IBM Plex Mono for numbers) via `next/font/google` in
`layout.tsx` once you're building with normal internet access — it's a
few lines, commented in `globals.css`.

## What's been tested (in the sandbox this was built in)

Everything below was run against a live MySQL-compatible server, not just
compiled:

- `db/schema.sql` applies cleanly; all foreign keys and the
  `chk_order_target` CHECK constraint (an order must reference exactly one
  of `vehicle_id` / `listing_id`) were verified to work, including
  confirming a malformed insert is correctly rejected.
- `db/seed.sql` populates cities, brands, vehicles, and a sample price row.
- Full OTP flow — send → verify → lazy user creation → session issued —
  tested via HTTP against the running Next.js dev server and a real
  database, not mocked.
- `POST /api/orders` tested both unauthenticated (correctly returns 401)
  and authenticated (creates the order, writes status history, returns
  the order number).
- `npm run build` passes with no type errors across all pages and API
  routes.

## Adding a real payment gateway

`transactions.gateway` and `transactions.gateway_reference` are there so a
provider (Razorpay, Cashfree, etc.) plugs in without a schema change:

1. On order creation, call the gateway to create a payment intent/order.
2. Call `recordTransaction({ orderId, type: "booking_amount", amount, gateway: "razorpay", gatewayReference: intentId, status: "initiated" })`.
3. On the gateway's webhook confirming payment, update that transaction's
   status and call `updateOrderStatus(orderId, "paid", "system")`.

No new tables needed for a second gateway later — just a different
`gateway` value on the same `transactions` row shape.

## Folder structure

```
carbikekharido/
├── db/
│   ├── schema.sql        — full MySQL schema, tested
│   └── seed.sql          — sample cities/brands/vehicles
├── src/
│   ├── app/
│   │   ├── api/auth/route.ts       — OTP send/verify (MySQL-backed)
│   │   ├── api/orders/route.ts     — create + list orders
│   │   ├── api/orders/[id]/route.ts — single order status
│   │   └── page.tsx                — redesigned homepage
│   ├── components/
│   │   ├── auth/           — AuthGateProvider, RegistrationModal
│   │   └── home/           — Hero, StageSection, BudgetExplorer, BrandStrip,
│   │                          CompareTeaser, TrustStrip, EmiTeaser, NewsTeaser
│   └── lib/
│       ├── db/             — pool.ts, usersRepo, sessionsRepo, otpRepo, ordersRepo
│       ├── i18n/           — EN/HI dictionaries + useLanguage() hook
│       ├── auth/           — smsProvider.ts (swap-in point for a real SMS vendor)
│       ├── intent.ts       — the defined list of registration-triggering actions
│       ├── vehicles.ts     — demo catalog data (stands in for Module 2's real catalog)
│       └── homeContent.ts  — demo budget buckets / brands / news teasers
├── .env.example
└── package.json
```

## New/Used toggle

The hero search card now has a New/Used toggle above the Cars/Bikes
toggle, and it's wired to actually filter — not just a label. `Vehicle`
in `src/lib/vehicles.ts` now carries a `condition: "new" | "used"` field;
`page.tsx` holds that as state and passes it down to both the "Popular"
grid and the `MostSearched` tabs. Demo data includes a few used listings
(with odometer/owner-count in the spec line instead of a trim
description, since that's what a used buyer actually needs first) so
toggling changes what's visible. This stands in for Module 4's real
`used_vehicle_listings` table — swapping the demo array for a real query
is the same shape of change as Module 2's catalog (see "Next steps").

## Free, legal vehicle images — now wired into the homepage

`src/lib/commonsImage.ts` + `src/components/home/VehiclePhoto.tsx` implement
the full ranked fallback for vehicle imagery, and both the "Popular this
week" cards (`VehicleCard.tsx`) and the "Most Searched" tabs
(`MostSearched.tsx`) now use it instead of the bare illustration:

1. **`vehicle.officialImageUrl`**, if you've set one — for a manufacturer
   press-kit photo or a dealer/seller's own upload (the two licensed,
   no-cost sources that can't be automated generically; once you have a
   real photo from either, paste its URL into that vehicle's data and
   it's used directly, no attribution needed since it's assumed to carry
   its own agreed terms).
2. **Wikimedia Commons**, automatically, if no override is set — a free
   library of Creative-Commons-licensed vehicle photos. When one is
   found, attribution renders underneath automatically; that's a license
   requirement, not a design choice, so don't strip it out.
3. **The original illustration**, as the permanent fallback when neither
   of the above turns up anything — so nothing ever breaks or shows a
   dead image.

Dealer-contributed photos (path 3 from the original list) aren't a
separate thing to build — once Module 4's real used-listings flow exists,
a seller's uploaded photos become that vehicle's `officialImageUrl`
automatically, same mechanism as a press photo.

Note: this was written and reviewed carefully but the Wikimedia API
domain wasn't reachable from the sandbox this project was built in, so
the live Commons lookup hasn't been tested end-to-end — verify it on
your machine first. If it doesn't behave as expected, everything still
falls back to the illustration cleanly either way, so the homepage won't
break regardless.

## Vehicle imagery — how to add real photos legitimately

The homepage currently uses original illustrated placeholders
(`src/components/home/VehicleIllustration.tsx`) instead of real vehicle
photos. That's deliberate, not a placeholder-for-later-that-I-forgot:
manufacturer photography is copyrighted, and scraping it from OEM or
competitor sites isn't something this project does. Two legitimate paths
to real photos, both standard in the industry:

1. **Manufacturer press/media kits** — most automakers (Maruti Suzuki,
   Tata, Mahindra, Hero, Honda, etc.) run a media/press site with
   downloadable vehicle imagery explicitly licensed for editorial and
   marketplace use. Request access per brand; usage terms vary.
2. **A paid automotive data provider** — this is what CarDekho/CarWale
   actually run on. A data provider licenses vehicle specs, pricing, and
   photography as one bundled feed, refreshed as new models launch, so
   you're not managing image rights per-vehicle yourself.

Either way, swapping placeholders for real photos only touches
`VehicleIllustration.tsx`'s call sites — the component contract (pass a
`vehicleType`/`bodyType`, get back a visual) stays the same if you
replace it with an `<img>` pointed at a licensed image URL.

## Sponsored ad banner

`src/components/home/AdBanner.tsx` is a working rotating sponsored-slot
component — the actual mechanism, not a mockup. `src/lib/adCreatives.ts`
holds entirely fictional placeholder advertiser content (not a
reproduction of any real ad or trademark). Swap that file's contents for
real booked creatives once you have advertisers; the component doesn't
need to change. It's already labeled "Sponsored" per PRD Module 3's rule
that sponsored content is always visually distinguished from organic
listings.

## Vehicle detail page — merged in from two standalone demos

Two throwaway reference projects built earlier in this project's history
are now merged into the real app, rather than living as separate repos:

- **The proxy pattern** (originally demoed against CarQuery/MarketCheck,
  which don't cover Indian vehicles at all) → `/api/vehicle-details`
  (`src/app/api/vehicle-details/route.ts`), now backed by the real
  `vehicles` / `vehicle_specs` / `vehicle_images` tables via
  `src/lib/db/vehiclesRepo.ts`, through the same `mysql2` pool every
  other repo file in this project uses.
- **The premium dark-mode configurator UI** → `/vehicle` page
  (`src/app/vehicle/page.tsx` + `VehicleDetailView.tsx`), styled by
  `src/styles/vehicle-detail.css`. Every selector in that stylesheet is
  namespaced under `.vehicle-detail-theme`, so it's imported globally
  without touching the homepage's existing navy/marigold/teal theme at
  all — the two design languages coexist on different routes.
- **The Indian-market data shape** (Lakh/Crore pricing, ARAI mileage,
  EV-aware fields) — `src/lib/currency.ts`'s `formatIndianPrice()`, with
  the rounding-boundary bug found during the standalone demo's testing
  already fixed here too.

The car/bike accent switch that was a manual toggle in the standalone
demo is now data-driven: `VehicleDetailView` sets `--accent`/`--accent-soft`
based on the actual vehicle's `vehicleType` from the database — no
toggle needed, since the page already knows what it's showing.

### New tables

`db/schema.sql` gained one table, `vehicle_images` (vehicle_id, image_url,
sort_order) — additive only, safe to re-run against an existing database.
`db/seed.sql` now seeds ARAI mileage/ground clearance/transmission specs
and sample images for two of the four seeded vehicles (Swift, Splendor+),
deliberately leaving Nexon EV and Activa 6G without image rows so the
placeholder-fallback path has something real to demonstrate, not just a
theoretical code path.

### Wiring on the homepage

`VehicleCard`'s "View details" button is now a real `<Link>` to
`/vehicle?brand=...&model=...&variant=...` for any demo vehicle that has
`brand`/`modelName`/`variantName` set (currently the 4 vehicles matching
the DB seed — see `src/lib/vehicles.ts`). Demo vehicles without that
mapping (Thar, Fronx, and all used-condition listings) keep the old
plain, non-linking button — the same as before this integration, not a
regression.

### What's been tested

- Fresh schema + seed load cleanly against a live MySQL-compatible
  server (`vehicle_images` table, its foreign key, and the new spec
  rows all applied without error).
- `/api/vehicle-details` tested for Swift VXi (real images) and Nexon EV
  (correctly falls back to placeholder, `displacementCc: null`,
  `araiMileageUnit: "km/charge"`).
- `/vehicle` page tested for a valid vehicle (renders the dark theme,
  badge, hero zone), a wrong variant (shows the real `availableVariants`
  message, not a crash), and missing query params (shows a clear message
  rather than erroring).
- Homepage confirmed still rendering correctly, with exactly the 2
  expected real `/vehicle` links present (Swift, Nexon EV) among the
  default "car" filter view — Thar/Fronx correctly have no link since
  they aren't in the DB seed yet.
- `npm run build` passes with no type errors across all 8 routes
  (the two new ones: `/vehicle` and `/api/vehicle-details`).

## Next steps

- Wire `src/lib/vehicles.ts` and `homeContent.ts` up to the real `vehicles`
  / `brands` tables via `src/lib/db` (they're demo arrays right now).
- Add the remaining PRD modules' tables (dealer CRM, reviews, blog posts,
  vehicle history reports) to `db/schema.sql` following the same patterns
  already established (one table per concept, a discriminator column
  instead of parallel tables where car/bike or new/used differ).
- Add a real SMS provider in `src/lib/auth/smsProvider.ts` and a real
  payment gateway per the section above.
