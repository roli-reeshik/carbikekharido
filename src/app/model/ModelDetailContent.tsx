"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ModelSectionNav, type ModelSectionTab } from "@/components/model/ModelSectionNav";
import { OFFERS } from "@/lib/homeContent";
import { formatLakh } from "@/lib/vehicles";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";

interface VariantRow {
  id: string;
  variantSlug: string;
  variantName: string;
  fuelType?: string;
  priceOnRoad?: number;
  exShowroomPrice?: number;
  mileage?: string;
  specs?: string;
}

interface ModelInfo {
  id: string;
  category: "car" | "ev" | "bike" | "scooter";
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
  sourceUrl: string;
  minPrice?: number;
  maxPrice?: number;
  fuelTypes: string[];
  variants: VariantRow[];
}

interface RivalInfo {
  model: { id: string; modelName: string; brandName: string; category: string };
  minPrice?: number;
  maxPrice?: number;
  fuelTypes: string[];
  mileage?: string;
  variantCount: number;
  imageUrl?: string;
}

interface ModelDetail {
  model: ModelInfo;
  imageUrl?: string;
  rivals: RivalInfo[];
  moreFromBrand: { id: string; modelName: string }[];
}

const SECTION_TABS: ModelSectionTab[] = [
  { id: "overview", label: "Overview" },
  { id: "specs", label: "Specs" },
  { id: "price", label: "Price" },
  { id: "expert-review", label: "Expert Review" },
  { id: "compare", label: "Compare", hasDropdown: true },
  { id: "news", label: "News" },
  { id: "reviews", label: "User Reviews" },
  { id: "mileage", label: "Mileage" },
  { id: "videos", label: "Videos" },
  { id: "used-cars", label: "Used Cars" },
  { id: "faqs", label: "Q&A" },
];

const COLOR_OPTIONS = [
  { name: "Daytona Grey", hex: "#4A4D52", bgClass: "bg-[#4A4D52]" },
  { name: "Flame Red", hex: "#D72638", bgClass: "bg-[#D72638]" },
  { name: "Foliage Green", hex: "#2E5A44", bgClass: "bg-[#2E5A44]" },
  { name: "Ocean Blue", hex: "#1B4965", bgClass: "bg-[#1B4965]" },
  { name: "Calgary White", hex: "#F4F4F9", bgClass: "bg-[#F4F4F9]" },
  { name: "Starlight Black", hex: "#1C1C1E", bgClass: "bg-[#1C1C1E]" },
  { name: "Pure Grey", hex: "#8E9095", bgClass: "bg-[#8E9095]" },
];

const MAJOR_CITIES_PRICE = [
  { city: "Bangalore", price: "₹8.96 - 17.81 Lakh*" },
  { city: "Mumbai", price: "₹8.60 - 17.04 Lakh*" },
  { city: "Pune", price: "₹8.63 - 17.14 Lakh*" },
  { city: "Hyderabad", price: "₹8.84 - 17.53 Lakh*" },
  { city: "Chennai", price: "₹8.76 - 17.67 Lakh*" },
  { city: "New Delhi", price: "₹8.25 - 16.50 Lakh*" },
  { city: "Lucknow", price: "₹8.40 - 16.85 Lakh*" },
  { city: "Kolkata", price: "₹8.45 - 16.90 Lakh*" },
];

const TRENDING_CARS_POPULAR = [
  { name: "Tata Punch", price: "₹5.70 - 10.67 Lakh*", image: "/assets/vehicles/tata-nexon.jpg" },
  { name: "Tata Sierra", price: "₹11.49 - 21.29 Lakh*", image: "/assets/vehicles/mahindra-xuv700.jpg" },
  { name: "Tata Harrier", price: "₹12.89 - 25.49 Lakh*", image: "/assets/vehicles/tata-harrier.jpg" },
  { name: "Tata Safari", price: "₹13.40 - 26.76 Lakh*", image: "/assets/vehicles/hyundai-creta.jpg" },
  { name: "Tata Curvv", price: "₹9.76 - 19.16 Lakh*", image: "/assets/vehicles/mahindra-thar.jpg" },
];

const POPULAR_SUVS = [
  { name: "Mahindra Scorpio N", price: "₹13.69 - 25.49 Lakh*", image: "/assets/vehicles/mahindra-scorpio.jpg" },
  { name: "Maruti Suzuki Brezza", price: "₹7.40 - 13.71 Lakh*", image: "/assets/vehicles/maruti-brezza.jpg" },
  { name: "Mahindra Thar", price: "₹10.32 - 17.89 Lakh*", image: "/assets/vehicles/mahindra-thar.jpg" },
  { name: "Hyundai Creta", price: "₹10.73 - 19.86 Lakh*", image: "/assets/vehicles/hyundai-creta.jpg" },
  { name: "Maruti Suzuki FRONX", price: "₹6.85 - 11.98 Lakh*", image: "/assets/vehicles/maruti-fronx.jpg" },
];

const POPULAR_EVS = [
  { name: "Maruti Suzuki eVitara", price: "₹15.99 - 20.21 Lakh*" },
  { name: "Tata Punch EV", price: "₹9.69 - 14.79 Lakh*" },
  { name: "Tata Tiago EV", price: "₹6.99 - 9.99 Lakh*" },
  { name: "Mahindra BE 6", price: "₹18.90 - 28.49 Lakh*" },
  { name: "Mahindra XEV 9e", price: "₹21.90 - 31.25 Lakh*" },
];

function shortModelLabel(modelName: string, brandName: string): string {
  const stripped = modelName.replace(new RegExp(`^${brandName}\\s+`, "i"), "").trim();
  return (stripped || modelName).toUpperCase();
}

export default function ModelDetailContent() {
  const searchParams = useSearchParams();
  const modelId = searchParams.get("id") || "";
  const brandParam = searchParams.get("brand") || "";
  const modelParam = searchParams.get("model") || "";
  const variantParam = searchParams.get("variant") || "";

  const [detail, setDetail] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Interactive UI states
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeSpecTab, setActiveSpecTab] = useState<"key" | "highlights">("key");
  const [variantFuelFilter, setVariantFuelFilter] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState("New Delhi");
  const [userReviewTab, setUserReviewTab] = useState<"all" | "looks" | "comfort" | "mileage" | "safety">("all");
  const [userReviewSort, setUserReviewSort] = useState<"latest" | "helpful" | "critical">("helpful");
  const [newsTab, setNewsTab] = useState<"latest" | "articles" | "roadtest">("latest");
  const [trendingTab, setTrendingTab] = useState<"popular" | "upcoming">("popular");
  const [saved, setSaved] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({ r1: 42, r2: 28, r3: 35 });
  const [votedSet, setVotedSet] = useState<Record<string, boolean>>({});

  // Interactive Modals
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [show360Modal, setShow360Modal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionSent, setQuestionSent] = useState(false);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const queryParams = new URLSearchParams();
    if (modelId) queryParams.set("id", modelId);
    if (brandParam) queryParams.set("brand", brandParam);
    if (modelParam) queryParams.set("model", modelParam);
    if (variantParam) queryParams.set("variant", variantParam);

    fetch(`/api/catalog/model?${queryParams.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ModelDetail | null) => {
        if (cancelled) return;
        if (data?.model) {
          setDetail(data);
          setSaved(isWishlisted(data.model.id));
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modelId, brandParam, modelParam, variantParam]);

  function handleWishlist() {
    if (!detail) return;
    const next = toggleWishlist(detail.model.id);
    setSaved(next.includes(detail.model.id));
  }

  function handleHelpful(reviewId: string) {
    if (votedSet[reviewId]) return;
    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
    setVotedSet((prev) => ({ ...prev, [reviewId]: true }));
  }

  const { model, imageUrl, rivals } = detail || {};
  const isBike = model?.category === "bike" || model?.category === "scooter";
  const modelTabLabel = model ? shortModelLabel(model.modelName, model.brandName) : "OVERVIEW";

  const visibleVariants = useMemo(() => {
    if (!model) return [];
    if (variantFuelFilter === "all") return model.variants;
    return model.variants.filter((v) => (v.fuelType || "").toLowerCase() === variantFuelFilter.toLowerCase());
  }, [model, variantFuelFilter]);

  const fuelTypesList = useMemo(() => {
    if (!model) return ["petrol"];
    return [...new Set(model.variants.map((v) => v.fuelType).filter(Boolean) as string[])];
  }, [model]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-6 w-48 animate-pulse rounded bg-line" />
          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-96 animate-pulse rounded-2xl bg-line" />
              <div className="h-64 animate-pulse rounded-2xl bg-line" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-48 animate-pulse rounded-2xl bg-line" />
              <div className="h-64 animate-pulse rounded-2xl bg-line" />
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !model) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-5xl">🚗</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Vehicle Not Found</h1>
          <p className="mt-2 text-sm text-ink/60">
            We couldn&apos;t load the details for this vehicle. Browse our full catalog below.
          </p>
          <Link href="/search" className="btn-primary mt-6 inline-block px-8 py-3 text-sm">
            Browse All Cars & Bikes
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const minPriceFormatted = model.minPrice ? formatLakh(model.minPrice) : "₹ 7.40 Lakh";
  const maxPriceFormatted = model.maxPrice ? formatLakh(model.maxPrice) : "₹ 14.30 Lakh";
  const mainPhotoUrl = imageUrl || (isBike ? "/assets/vehicles/ducati-v4r.jpg" : "/assets/vehicles/ferrari-sf90.jpg");

  return (
    <SiteLayout>
      {/* ------------------------------------------------------------- */}
      {/* 1. Top Breadcrumb Trail                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-line bg-paper/60 py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-ink/50">
            <Link href="/" className="hover:text-highway">Home</Link>
            <span>›</span>
            <Link href={`/search?type=${isBike ? "bike" : "car"}`} className="hover:text-highway">
              {isBike ? "New Bikes" : "New Cars"}
            </Link>
            <span>›</span>
            <Link href={`/search?brand=${encodeURIComponent(model.brandSlug)}`} className="hover:text-highway">
              {model.brandName}
            </Link>
            <span>›</span>
            <span className="font-semibold text-ink">{model.modelName}</span>
          </nav>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Top Hero Section (Gallery + Price Card)                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-surface py-6 sm:py-8 border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Vehicle Image Gallery Box with Color Switcher */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-line bg-paper shadow-sm group">
                {/* Main Vehicle Image */}
                <div className="relative aspect-[16/10] w-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainPhotoUrl}
                    alt={model.modelName}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Floating Action Badges on Image (CarDekho Style) */}
                  <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 z-10">
                    <button
                      onClick={() => setShowPhotosModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black"
                    >
                      <span>📷</span> 124 Photos
                    </button>
                    <a
                      href="#videos"
                      className="flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black"
                    >
                      <span>▶</span> Shorts
                    </a>
                    <button
                      onClick={() => setSelectedColor((prev) => (prev + 1) % COLOR_OPTIONS.length)}
                      className="flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black"
                    >
                      <span>🎨</span> 16 Colors
                    </button>
                    <button
                      onClick={() => setShow360Modal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-highway px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
                    >
                      <span>🔄</span> 360° View
                    </button>
                  </div>
                </div>

                {/* Interactive Color Switcher Strip */}
                <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink/60">Color:</span>
                    <span className="text-xs font-bold text-ink">{COLOR_OPTIONS[selectedColor].name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c, idx) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(idx)}
                        title={c.name}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          selectedColor === idx ? "border-highway scale-125 shadow-sm" : "border-line hover:scale-110"
                        } ${c.bgClass}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Vehicle Title, Pricing & CTAs */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                      {model.modelName}
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mt-0.5">
                      {model.brandName} · {model.category === "ev" ? "Electric Vehicle" : isBike ? "Two-Wheeler" : "Passenger Vehicle"}
                    </p>
                  </div>

                  {/* Share & Wishlist buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWishlist}
                      title="Save to wishlist"
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface transition ${
                        saved ? "text-coral border-coral/30 shadow-sm" : "text-ink/40 hover:text-coral hover:border-coral"
                      }`}
                    >
                      {saved ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: model.modelName, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }}
                      title="Share vehicle"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink/40 transition hover:text-highway hover:border-highway"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Rating Bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                    ★ 4.6
                  </span>
                  <a href="#reviews" className="text-xs font-medium text-ink/60 hover:text-highway underline">
                    864 Reviews
                  </a>
                  <span className="text-xs text-ink/30">·</span>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="text-xs font-semibold text-highway hover:underline"
                  >
                    Rate &amp; Win ₹1000
                  </button>
                </div>
              </div>

              {/* Short Description Quote */}
              <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                {model.modelName} is an all-rounder in the truest sense. {isBike ? "This machine delivers visceral road presence, smooth gearshifts, and high reliability." : "This vehicle offers high safety, spacious cabin ergonomics, and supreme ride comfort for Indian roads."}
              </p>

              {/* Price & Offers Callout Card */}
              <div className="rounded-2xl border border-line bg-paper p-5 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl sm:text-3xl font-mono font-extrabold text-highway">
                      {minPriceFormatted} - {maxPriceFormatted}
                    </p>
                    <button
                      onClick={() => setShowPriceModal(true)}
                      className="text-xs font-bold text-highway hover:underline"
                    >
                      Get On-Road Price
                    </button>
                  </div>
                  <p className="text-[11px] text-ink/50 mt-0.5">
                    *Ex-Showroom Price in <span className="font-semibold text-ink">{selectedCity}</span> ✎
                  </p>
                </div>

                {/* Signature CarDekho Orange CTA Button */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowOffersModal(true)}
                    className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F5A623] py-3.5 px-6 font-display text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    View August Offers
                  </button>
                  <p className="text-center text-[11px] font-medium text-coral flex items-center justify-center gap-1">
                    <span>⚡</span> Hurry up to lock festive offers!
                  </p>
                </div>
              </div>

              {/* Quick Spec Highlights Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="rounded-xl border border-line bg-surface p-2.5 text-center">
                  <p className="text-[10px] text-ink/45 uppercase font-medium">Fuel Types</p>
                  <p className="text-xs font-bold text-ink capitalize truncate mt-0.5">
                    {fuelTypesList.join(", ") || "Petrol"}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface p-2.5 text-center">
                  <p className="text-[10px] text-ink/45 uppercase font-medium">Mileage</p>
                  <p className="text-xs font-bold text-ink truncate mt-0.5">
                    {model.variants.find((v) => v.mileage)?.mileage || "18.5 kmpl"}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface p-2.5 text-center">
                  <p className="text-[10px] text-ink/45 uppercase font-medium">Variants</p>
                  <p className="text-xs font-bold text-ink truncate mt-0.5">
                    {model.variants.length} Options
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface p-2.5 text-center">
                  <p className="text-[10px] text-ink/45 uppercase font-medium">Waiting</p>
                  <p className="text-xs font-bold text-emerald-600 truncate mt-0.5">
                    2-4 Weeks
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Sticky In-Page Navigation Bar                              */}
      {/* ------------------------------------------------------------- */}
      <ModelSectionNav tabs={SECTION_TABS} modelLabel={modelTabLabel} />

      {/* ------------------------------------------------------------- */}
      {/* 4. Main Two-Column Layout (Left Content 70% / Right 30%)      */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT MAIN CONTENT COLUMN (70% Width)                      */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* ---------------- A. KEY SPECS & FEATURES ---------------- */}
            <section id="specs" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="font-display text-xl font-bold text-ink">
                  {model.modelName} specs &amp; features
                </h2>
                <div className="flex rounded-lg bg-paper p-1 border border-line text-xs font-semibold">
                  <button
                    onClick={() => setActiveSpecTab("key")}
                    className={`px-3 py-1 rounded-md transition ${activeSpecTab === "key" ? "bg-highway text-white shadow-sm" : "text-ink/60"}`}
                  >
                    Key Specifications
                  </button>
                  <button
                    onClick={() => setActiveSpecTab("highlights")}
                    className={`px-3 py-1 rounded-md transition ${activeSpecTab === "highlights" ? "bg-highway text-white shadow-sm" : "text-ink/60"}`}
                  >
                    Highlights
                  </button>
                </div>
              </div>

              {/* 2-Column Key Metrics Grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">⚙ Engine</span>
                  <span className="font-semibold text-ink">{isBike ? "349 cc - 650 cc" : "1199 cc - 1497 cc"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">📐 Ground Clearance</span>
                  <span className="font-semibold text-ink">{isBike ? "170 mm" : "208 mm"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">⚡ Power</span>
                  <span className="font-semibold text-ink">{isBike ? "20.2 - 47 bhp" : "99 - 118.27 bhp"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">🔩 Torque</span>
                  <span className="font-semibold text-ink">{isBike ? "27 - 52 Nm" : "170 Nm - 260 Nm"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">💺 Seating Capacity</span>
                  <span className="font-semibold text-ink">{isBike ? "2 Persons" : "5 Seats"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">🚗 Drive Type</span>
                  <span className="font-semibold text-ink">{isBike ? "Chain Drive" : "FWD"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">🛡 Safety Rating</span>
                  <span className="font-semibold text-emerald-600">5 Star (Global NCAP)</span>
                </div>
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <span className="text-ink/60 flex items-center gap-2">⛽ ARAI Mileage</span>
                  <span className="font-semibold text-ink">{model.variants.find((v) => v.mileage)?.mileage || "18.5 kmpl"}</span>
                </div>
              </div>

              <div className="mt-5 text-right">
                <a href="#variants" className="text-xs font-bold text-highway hover:underline flex items-center justify-end gap-1">
                  View All Specs and Features <span>›</span>
                </a>
              </div>
            </section>

            {/* ---------------- B. PRICE & VARIANTS TABLE ---------------- */}
            <section id="price" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  {model.modelName} price
                </h2>
                <p className="text-xs text-ink/60 mt-1">
                  {model.modelName} variants starting at {minPriceFormatted}. Available in petrol, diesel, and CNG options.
                </p>
              </div>

              {/* Variant Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {["all", "petrol", "diesel", "cng"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setVariantFuelFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                        variantFuelFilter === f
                          ? "bg-highway text-white shadow-sm"
                          : "bg-paper text-ink/60 hover:text-ink"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-ink/60">
                  <span className="font-medium">City:</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-ink"
                  >
                    {MAJOR_CITIES_PRICE.map((c) => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variants Rows */}
              <div className="space-y-3">
                {visibleVariants.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-paper/40 p-4 transition hover:bg-paper/80"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-ink">{v.variantName}</h3>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          2 months waiting
                        </span>
                      </div>
                      <p className="text-xs text-ink/50">{v.specs || "1199 cc, Manual, Petrol, 17.44 kmpl"}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="font-mono text-base font-bold text-highway">
                          {v.priceOnRoad ? formatLakh(v.priceOnRoad) : minPriceFormatted}
                        </p>
                        <button
                          onClick={() => setShowPriceModal(true)}
                          className="text-[10px] font-bold text-highway hover:underline"
                        >
                          Get On-Road Price
                        </button>
                      </div>

                      <button
                        onClick={() => setShowOffersModal(true)}
                        className="rounded-lg border border-coral bg-coral/5 px-4 py-2 text-xs font-bold text-coral transition hover:bg-coral hover:text-white"
                      >
                        View August Offers
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Variants Video Explainer Banner */}
              <div className="rounded-xl border border-line bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white font-bold text-sm shrink-0">
                    ▶
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-coral">Video Guide</p>
                    <p className="text-sm font-semibold">2026 {model.modelName} Variants Explained | KONSA variant best hai?</p>
                  </div>
                </div>
                <a
                  href="#videos"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 shrink-0"
                >
                  Watch Video
                </a>
              </div>
            </section>

            {/* ---------------- C. EXPERT REVIEW ---------------- */}
            <section id="expert-review" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {model.modelName} Expert Review
                  </h2>
                  <p className="text-xs text-ink/50 mt-0.5">Extensively road-tested and verified by Auto Experts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-highway text-white font-bold text-lg">
                    ★ 4.1
                  </span>
                </div>
              </div>

              {/* Aspect Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs font-bold text-ink">4.0 ★</p>
                  <p className="text-[10px] uppercase text-ink/50 mt-1">Exterior</p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs font-bold text-ink">3.5 ★</p>
                  <p className="text-[10px] uppercase text-ink/50 mt-1">Interior</p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs font-bold text-ink">4.0 ★</p>
                  <p className="text-[10px] uppercase text-ink/50 mt-1">Features</p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs font-bold text-emerald-600">5.0 ★</p>
                  <p className="text-[10px] uppercase text-ink/50 mt-1">Safety</p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs font-bold text-ink">4.0 ★</p>
                  <p className="text-[10px] uppercase text-ink/50 mt-1">Drive Experience</p>
                </div>
              </div>

              {/* Expert Verdict Box */}
              <div className="rounded-xl border-l-4 border-highway bg-paper p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-highway">Expert Verdict</p>
                <p className="mt-1 text-xs sm:text-sm text-ink/80 leading-relaxed italic">
                  &ldquo;With its chic looks and modern features, the {model.modelName} is a very likeable car with potential to be the segment leader. Ride quality is supple, ergonomics are on point, and safety scores are top-tier.&rdquo;
                </p>
              </div>

              {/* Good Things & Could Be Better Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span>✔</span> Good Things
                  </p>
                  <ul className="text-xs text-ink/80 space-y-1.5 list-disc pl-4">
                    <li>Futuristic design with animated LED DRLs &amp; full-LED projector setup</li>
                    <li>Plush ride quality, 208mm high ground clearance for rough roads</li>
                    <li>Punchy turbo-petrol &amp; frugal diesel with smooth AMT/DCT options</li>
                    <li>5-Star Global NCAP safety with 6 standard airbags</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <span>⚠</span> Could Be Better
                  </p>
                  <ul className="text-xs text-ink/80 space-y-1.5 list-disc pl-4">
                    <li>Rear door bottle holder space could be slightly wider</li>
                    <li>AMT can feel slightly hesitant during aggressive overtakes</li>
                    <li>Fit and finish could be improved in the lower cabin trims</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ---------------- D. COMPARISON WITH SIMILAR VEHICLES ---------------- */}
            <section id="compare" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {model.modelName} comparison with similar {isBike ? "bikes" : "cars"}
                  </h2>
                  <p className="text-xs text-ink/50 mt-0.5">Compare specs, prices, and features side-by-side</p>
                </div>
                <Link href="/compare" className="text-xs font-bold text-highway hover:underline">
                  Full Compare Tool →
                </Link>
              </div>

              {/* Multi-Rival Comparison Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-line bg-paper/60 text-left">
                      <th className="p-3 font-semibold text-ink/50">Parameter</th>
                      <th className="p-3 font-bold text-highway bg-highway/5">{model.modelName}</th>
                      {rivals && rivals.slice(0, 4).map((r) => (
                        <th key={r.model.id} className="p-3 font-bold text-ink">
                          {r.model.modelName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">Price</td>
                      <td className="p-3 font-bold text-highway bg-highway/5">{minPriceFormatted}</td>
                      {rivals && rivals.slice(0, 4).map((r) => (
                        <td key={r.model.id} className="p-3 font-semibold text-ink">
                          {r.minPrice ? formatLakh(r.minPrice) : "₹ 7.40 Lakh*"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">User Rating</td>
                      <td className="p-3 font-bold text-emerald-600 bg-highway/5">★ 4.6</td>
                      {rivals && rivals.slice(0, 4).map((r, i) => (
                        <td key={r.model.id} className="p-3 text-ink">★ {(4.3 + (i * 0.1)).toFixed(1)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">Fuel Type</td>
                      <td className="p-3 font-semibold text-ink bg-highway/5">Petrol / Diesel / CNG</td>
                      {rivals && rivals.slice(0, 4).map((r) => (
                        <td key={r.model.id} className="p-3 text-ink">Petrol / Diesel</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">Mileage</td>
                      <td className="p-3 font-bold text-ink bg-highway/5">17.01 - 24.08 kmpl</td>
                      {rivals && rivals.slice(0, 4).map((r) => (
                        <td key={r.model.id} className="p-3 text-ink">{r.mileage || "18.2 kmpl"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">Safety (NCAP)</td>
                      <td className="p-3 font-bold text-emerald-600 bg-highway/5">5 Star (GNCAP)</td>
                      {rivals && rivals.slice(0, 4).map((r, i) => (
                        <td key={r.model.id} className="p-3 text-ink">{i === 1 ? "5 Star" : "4 Star"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-ink/60 font-medium">Compare Action</td>
                      <td className="p-3 bg-highway/5 font-semibold text-ink/40">Currently Viewing</td>
                      {rivals && rivals.slice(0, 4).map((r) => (
                        <td key={r.model.id} className="p-3">
                          <Link
                            href={`/compare?v1=${encodeURIComponent(model.id)}&v2=${encodeURIComponent(r.model.id)}`}
                            className="font-bold text-highway hover:underline"
                          >
                            {modelTabLabel} vs {r.model.modelName.split(" ").pop()} →
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---------------- E. NEWS & ROAD TEST ARTICLES ---------------- */}
            <section id="news" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="font-display text-xl font-bold text-ink">
                  {model.modelName} news &amp; updates
                </h2>
                <div className="flex rounded-lg bg-paper p-1 border border-line text-xs font-semibold">
                  <button
                    onClick={() => setNewsTab("latest")}
                    className={`px-3 py-1 rounded-md transition ${newsTab === "latest" ? "bg-highway text-white shadow-sm" : "text-ink/60"}`}
                  >
                    Latest News
                  </button>
                  <button
                    onClick={() => setNewsTab("articles")}
                    className={`px-3 py-1 rounded-md transition ${newsTab === "articles" ? "bg-highway text-white shadow-sm" : "text-ink/60"}`}
                  >
                    Must Read
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-line bg-paper overflow-hidden group">
                  <div className="aspect-video w-full bg-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/vehicles/tata-nexon.jpg"
                      alt="News 1"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] font-bold text-coral uppercase">Comparison</span>
                    <h4 className="font-display text-xs font-bold text-ink line-clamp-2 group-hover:text-highway">
                      2026 Brezza vs {model.modelName}: Does The New Facelift Give Brezza The Edge?
                    </h4>
                    <p className="text-[10px] text-ink/40">By Auto Team · Aug 10, 2026</p>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-paper overflow-hidden group">
                  <div className="aspect-video w-full bg-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/vehicles/hyundai-creta.jpg"
                      alt="News 2"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] font-bold text-highway uppercase">Electric Tech</span>
                    <h4 className="font-display text-xs font-bold text-ink line-clamp-2 group-hover:text-highway">
                      Looking For An EV? Here&apos;s Why {model.modelName} EV Long Range Stands Out
                    </h4>
                    <p className="text-[10px] text-ink/40">By Tech Desk · Aug 08, 2026</p>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-paper overflow-hidden group">
                  <div className="aspect-video w-full bg-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/vehicles/mahindra-xuv700.jpg"
                      alt="News 3"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">New Launch</span>
                    <h4 className="font-display text-xs font-bold text-ink line-clamp-2 group-hover:text-highway">
                      {model.modelName} Camo Edition Launched With Exclusive Foliage Green
                    </h4>
                    <p className="text-[10px] text-ink/40">By Newsroom · Aug 06, 2026</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------- F. USER REVIEWS & RATINGS ---------------- */}
            <section id="reviews" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-black text-ink">4.6</span>
                    <span className="text-amber-500 text-lg">★★★★★</span>
                    <span className="text-xs text-ink/50">(Based on 864 User Reviews)</span>
                  </div>
                  <p className="text-xs text-ink/60 mt-0.5">Verified Indian Owners &amp; Drivers</p>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="rounded-xl border border-highway bg-highway/5 px-4 py-2 text-xs font-bold text-highway hover:bg-highway hover:text-white transition"
                >
                  Write a Review &amp; Win ₹1000
                </button>
              </div>

              {/* Tag filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All (863)" },
                  { id: "looks", label: "Looks (240)" },
                  { id: "comfort", label: "Comfort (320)" },
                  { id: "mileage", label: "Mileage (229)" },
                  { id: "safety", label: "Safety (185)" },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setUserReviewTab(tag.id as any)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      userReviewTab === tag.id
                        ? "bg-highway text-white shadow-sm"
                        : "bg-paper text-ink/60 hover:text-ink"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Reviews Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-xl border border-line bg-paper/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">5 ★</span>
                    <span className="text-[10px] text-ink/40">Aug 13, 2026</span>
                  </div>
                  <h4 className="font-display text-xs font-bold text-ink">Low Budget Perfect Vehicle</h4>
                  <p className="text-xs text-ink/70 line-clamp-4">
                    The {model.modelName} is too good. It gives a lot of feature in low variant. It gives good performance as well. In India, its a good choice for family.
                  </p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink/50">
                    <span>Dakshweta, Delhi</span>
                    <button
                      onClick={() => handleHelpful("r1")}
                      className={`flex items-center gap-1 hover:text-highway ${votedSet["r1"] ? "text-highway font-bold" : ""}`}
                    >
                      👍 {helpfulVotes["r1"]}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-paper/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">4.7 ★</span>
                    <span className="text-[10px] text-ink/40">Aug 12, 2026</span>
                  </div>
                  <h4 className="font-display text-xs font-bold text-ink">Bohat Hi Accha Lga Mujhe</h4>
                  <p className="text-xs text-ink/70 line-clamp-4">
                    Bohat hi accha lga mujhe iska comfort. Suspension bohot accha hai. Long rides me fatigue bilkul nahi hota. Mileage on highway is impressive.
                  </p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink/50">
                    <span>Rahul Kumar, Pune</span>
                    <button
                      onClick={() => handleHelpful("r2")}
                      className={`flex items-center gap-1 hover:text-highway ${votedSet["r2"] ? "text-highway font-bold" : ""}`}
                    >
                      👍 {helpfulVotes["r2"]}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-paper/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">5 ★</span>
                    <span className="text-[10px] text-ink/40">Aug 10, 2026</span>
                  </div>
                  <h4 className="font-display text-xs font-bold text-ink">Killer Looks, 5 Star Safety</h4>
                  <p className="text-xs text-ink/70 line-clamp-4">
                    Total value for money. Iska futuristic front look aur road presence bohot killer lagta hai. Build quality solid hai and confidence aati hai drive karne me.
                  </p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink/50">
                    <span>Alok Yadav, Lucknow</span>
                    <button
                      onClick={() => handleHelpful("r3")}
                      className={`flex items-center gap-1 hover:text-highway ${votedSet["r3"] ? "text-highway font-bold" : ""}`}
                    >
                      👍 {helpfulVotes["r3"]}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------- G. MILEAGE BREAKDOWN ---------------- */}
            <section id="mileage" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-ink">
                {model.modelName} mileage
              </h2>
              <p className="text-xs text-ink/60">
                The {model.modelName} mileage is 17.01 to 24.08 kmpl. The Diesel models have mileage range between 23.23 kmpl to 24.08 kmpl.
              </p>

              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-paper text-ink/60 text-left border-b border-line">
                    <tr>
                      <th className="p-3 font-semibold">Fuel Type</th>
                      <th className="p-3 font-semibold">Transmission</th>
                      <th className="p-3 font-semibold text-right">ARAI Mileage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td className="p-3 font-medium text-ink">Diesel</td>
                      <td className="p-3 text-ink/70">Automatic</td>
                      <td className="p-3 font-mono font-bold text-highway text-right">24.08 kmpl</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-ink">Diesel</td>
                      <td className="p-3 text-ink/70">Manual</td>
                      <td className="p-3 font-mono font-bold text-highway text-right">23.23 kmpl</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-ink">Petrol</td>
                      <td className="p-3 text-ink/70">Manual</td>
                      <td className="p-3 font-mono font-bold text-highway text-right">17.44 kmpl</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-ink">Petrol</td>
                      <td className="p-3 text-ink/70">Automatic</td>
                      <td className="p-3 font-mono font-bold text-highway text-right">17.18 kmpl</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-ink">CNG</td>
                      <td className="p-3 text-ink/70">Manual</td>
                      <td className="p-3 font-mono font-bold text-highway text-right">24.08 km/kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---------------- H. VIDEOS & SHORTS ---------------- */}
            <section id="videos" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-ink">
                {model.modelName} videos &amp; shorts
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { title: "Design Or Execution?", tag: "Walkaround", bg: "from-blue-900 to-indigo-950" },
                  { title: "Bull Marks!", tag: "Crash Test", bg: "from-amber-900 to-stone-900" },
                  { title: "How Safe Is The Tata Nexon?", tag: "Safety", bg: "from-emerald-950 to-teal-900" },
                  { title: "Pressing Park While Driving?", tag: "Feature Test", bg: "from-rose-950 to-neutral-900" },
                ].map((v, i) => (
                  <div
                    key={i}
                    className={`relative aspect-[9/14] rounded-xl overflow-hidden bg-gradient-to-br ${v.bg} p-3 flex flex-col justify-between text-white shadow-sm cursor-pointer group hover:scale-[1.02] transition`}
                  >
                    <span className="self-start rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase backdrop-blur-sm">
                      {v.tag}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 self-center backdrop-blur-md group-hover:scale-110 transition">
                      ▶
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{v.title}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">Shorts · 58s</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------------- I. RECOMMENDED USED VEHICLES ---------------- */}
            <section id="used-cars" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="font-display text-xl font-bold text-ink">
                  Recommended used {model.modelName} in {selectedCity}
                </h2>
                <Link href="/vehicles/buy" className="text-xs font-bold text-highway hover:underline">
                  View All Used →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: `${model.modelName} Pure Plus S AMT`, price: "₹8.23 Lakh", kms: "7,502 km · Petrol", year: 2025 },
                  { name: `${model.modelName} Smart Plus`, price: "₹6.79 Lakh", kms: "24,000 km · Petrol", year: 2025 },
                  { name: `${model.modelName} Creative CNG`, price: "₹9.79 Lakh", kms: "11,400 km · CNG", year: 2025 },
                ].map((car, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-paper overflow-hidden group">
                    <div className="aspect-video w-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mainPhotoUrl}
                        alt={car.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <h4 className="font-display text-xs font-bold text-ink truncate">{car.name}</h4>
                        <p className="font-mono text-sm font-bold text-highway">{car.price}</p>
                        <p className="text-[10px] text-ink/50">{car.kms}</p>
                      </div>
                      <Link
                        href="/vehicles/buy"
                        className="block text-center rounded-lg border border-coral py-1.5 text-xs font-bold text-coral hover:bg-coral hover:text-white transition"
                      >
                        View Seller Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------------- J. ARE YOU CONFUSED? Q&A BOX ---------------- */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-paper via-surface to-paper p-6 shadow-sm space-y-3">
              <h3 className="font-display text-lg font-bold text-ink">Are you confused?</h3>
              <p className="text-xs text-ink/60">Ask anything about {model.modelName} &amp; get answer in 48 hours from verified auto experts.</p>
              
              {questionSent ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
                  ✔ Your question has been submitted! Our auto experts will review and answer it shortly.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Write your question here (e.g. Which variant gives highest mileage?)"
                    className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs text-ink placeholder:text-ink/40 focus:border-highway focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (questionText.trim()) setQuestionSent(true);
                    }}
                    className="rounded-xl bg-highway px-5 py-2.5 text-xs font-bold text-white hover:brightness-110"
                  >
                    Ask Question
                  </button>
                </div>
              )}
            </div>

            {/* ---------------- K. QUESTIONS & ANSWERS (FAQS) ---------------- */}
            <section id="faqs" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-ink">
                {model.modelName} Questions &amp; Answers
              </h2>

              <div className="space-y-2">
                {[
                  {
                    q: `What is the exact on-road price of ${model.modelName}?`,
                    a: `The on-road price of ${model.modelName} starts from ${minPriceFormatted} for the base model and goes up to ${maxPriceFormatted} for the top-spec variant in ${selectedCity}. On-road prices include Ex-showroom cost, RTO registration, and comprehensive 1+3 year insurance.`,
                  },
                  {
                    q: `What are the latest August offers available on ${model.modelName}?`,
                    a: `Current festive offers on ${model.modelName} include corporate benefits up to ₹25,000, exchange bonus up to ₹20,000, and special finance rates starting from 8.99% per annum.`,
                  },
                  {
                    q: `Which is better, ${model.modelName} or its rivals?`,
                    a: `${model.modelName} excels in safety with a 5-Star Global NCAP rating, class-leading 208mm ground clearance, and punchy engine options. If road presence, high ground clearance, and cabin safety are your priorities, ${model.modelName} is the top choice.`,
                  },
                  {
                    q: `What will the EMI or down payment for ${model.modelName}?`,
                    a: `For a 20% down payment on the base model, monthly EMI starts at approximately ₹16,500 to ₹19,591 per month at 9.8% interest for a 48 to 60 month loan tenure.`,
                  },
                  {
                    q: `What is the real-world mileage of ${model.modelName}?`,
                    a: `In city driving conditions, petrol variants return 13-15 kmpl while diesel variants achieve 18-20 kmpl. On highways, petrol returns 17-18 kmpl and diesel easily exceeds 23 kmpl.`,
                  },
                  {
                    q: `What are the colour options available for ${model.modelName}?`,
                    a: `${model.modelName} is offered in 7 dual-tone and monotone shades: Daytona Grey, Flame Red, Foliage Green, Ocean Blue, Calgary White, Pure Grey, and Starlight Black.`,
                  },
                ].map((item, index) => (
                  <div key={index} className="rounded-xl border border-line bg-paper/40 overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left font-display text-xs sm:text-sm font-bold text-ink hover:text-highway transition"
                    >
                      <span>Q: {item.q}</span>
                      <span className="text-ink/40 text-base">{openFaqIndex === index ? "−" : "+"}</span>
                    </button>
                    {openFaqIndex === index && (
                      <div className="p-4 pt-0 text-xs text-ink/70 leading-relaxed border-t border-line/40">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDEBAR COLUMN (30% Width)                          */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Calculate EMI Widget */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">Calculate EMI</p>
                  <p className="text-xs text-ink/60">Your monthly EMI</p>
                </div>
                <span className="text-xs font-bold text-highway hover:underline cursor-pointer">Edit EMI</span>
              </div>

              <div>
                <p className="font-mono text-2xl font-black text-highway">₹ 19,591</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Interest calculated at 9.8% for 48 months</p>
              </div>

              <Link
                href="/emi-calculator"
                className="block text-center rounded-xl bg-paper border border-line py-2.5 text-xs font-bold text-ink hover:border-highway hover:text-highway transition shadow-sm"
              >
                View EMI Offers
              </Link>
            </div>

            {/* 2. Download Brochure Widget */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm shrink-0">
                  PDF
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">{model.modelName} brochure</h4>
                  <p className="text-[11px] text-ink/50 mt-0.5">Download brochure for detailed info of specs, features &amp; prices.</p>
                </div>
              </div>

              <button
                onClick={() => setShowBrochureModal(true)}
                className="w-full rounded-xl border border-highway py-2.5 text-xs font-bold text-highway hover:bg-highway hover:text-white transition"
              >
                Download Brochure
              </button>
            </div>

            {/* 3. Festive / August Offers Card */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-coral px-2 py-0.5 text-[10px] font-bold text-white uppercase">Special Deal</span>
                <span className="text-[10px] font-bold text-coral">17 days left</span>
              </div>
              <h4 className="font-display text-sm font-bold text-ink">{model.modelName} Offers</h4>
              <p className="text-xs text-ink/70">Benefits On {model.modelName} Diesel &amp; Petrol up to ₹45,000.</p>
              <button
                onClick={() => setShowOffersModal(true)}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F5A623] py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-sm transition"
              >
                View Complete Offers
              </button>
            </div>

            {/* 4. Tech / Promotional Ad Card */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold tracking-widest text-white/60">CARBIKEKHARIDO VIP</span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-mono">AD</span>
              </div>
              <h4 className="font-display text-base font-bold">Fast Doorstep Delivery &amp; Test Drive</h4>
              <p className="text-xs text-white/70">Book a home test drive for {model.modelName} at your convenience.</p>
              <button
                onClick={() => setShowOffersModal(true)}
                className="w-full rounded-xl bg-white text-slate-900 py-2.5 text-xs font-bold hover:bg-white/90 transition"
              >
                Book Home Test Drive
              </button>
            </div>

            {/* 5. City Price Breakdown Table ("Price in India") */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-3">
              <h4 className="font-display text-sm font-bold text-ink">{model.modelName} price in India</h4>
              <div className="divide-y divide-line text-xs">
                {MAJOR_CITIES_PRICE.map((cp) => (
                  <div key={cp.city} className="flex items-center justify-between py-2">
                    <span className="text-ink/60">{cp.city}</span>
                    <span className="font-mono font-bold text-ink">{cp.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Trending Vehicles (Popular / Upcoming Tabs) */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h4 className="font-display text-sm font-bold text-ink">Trending {model.brandName} Cars</h4>
                <div className="flex rounded-md bg-paper p-0.5 border border-line text-[10px] font-semibold">
                  <button
                    onClick={() => setTrendingTab("popular")}
                    className={`px-2 py-0.5 rounded transition ${trendingTab === "popular" ? "bg-highway text-white" : "text-ink/60"}`}
                  >
                    Popular
                  </button>
                  <button
                    onClick={() => setTrendingTab("upcoming")}
                    className={`px-2 py-0.5 rounded transition ${trendingTab === "upcoming" ? "bg-highway text-white" : "text-ink/60"}`}
                  >
                    Upcoming
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {TRENDING_CARS_POPULAR.map((tc, idx) => (
                  <Link
                    key={idx}
                    href={`/search?q=${encodeURIComponent(tc.name)}`}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:text-highway transition">{tc.name}</p>
                      <p className="font-mono text-[11px] font-semibold text-highway">{tc.price}</p>
                    </div>
                    <span className="text-ink/30 text-xs">›</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 7. Popular SUV Cars */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
              <h4 className="font-display text-sm font-bold text-ink">Popular SUV Cars</h4>
              <div className="space-y-3">
                {POPULAR_SUVS.map((suv, idx) => (
                  <Link
                    key={idx}
                    href={`/search?q=${encodeURIComponent(suv.name)}`}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:text-highway transition">{suv.name}</p>
                      <p className="font-mono text-[11px] font-semibold text-highway">{suv.price}</p>
                    </div>
                    <span className="text-ink/30 text-xs">›</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 8. Popular Electric Cars */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
              <h4 className="font-display text-sm font-bold text-ink">Popular Electric Vehicles</h4>
              <div className="space-y-3">
                {POPULAR_EVS.map((ev, idx) => (
                  <Link
                    key={idx}
                    href={`/search?q=${encodeURIComponent(ev.name)}`}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:text-highway transition">{ev.name}</p>
                      <p className="font-mono text-[11px] font-semibold text-highway">{ev.price}</p>
                    </div>
                    <span className="text-ink/30 text-xs">›</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: On-Road Price Breakdown Modal                        */}
      {/* ------------------------------------------------------------- */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">On-Road Price Breakdown</h3>
                <p className="text-xs text-ink/50">{model.modelName} ({selectedCity})</p>
              </div>
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <span className="text-ink/60">Ex-Showroom Price</span>
                <span className="font-mono font-bold text-ink">{minPriceFormatted}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <span className="text-ink/60">RTO Registration &amp; Road Tax</span>
                <span className="font-mono text-ink">₹ 74,500</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <span className="text-ink/60">Comprehensive Insurance (1+3 Yrs)</span>
                <span className="font-mono text-ink">₹ 38,200</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <span className="text-ink/60">Fastag &amp; Essential Kit</span>
                <span className="font-mono text-ink">₹ 2,500</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-highway font-bold text-sm">
                <span className="text-highway">Total Estimated On-Road</span>
                <span className="font-mono text-highway">
                  {model.minPrice ? formatLakh(Math.round(model.minPrice * 1.14)) : "₹ 8.55 Lakh*"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPriceModal(false);
                setShowOffersModal(true);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F5A623] py-3 text-xs font-bold text-white hover:brightness-110 shadow-sm"
            >
              Claim Price Discounts &amp; Offers
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Offers & Test Drive Modal                           */}
      {/* ------------------------------------------------------------- */}
      {showOffersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">August Festive Offers</h3>
                <p className="text-xs text-ink/50">Unlock exclusive dealership discounts for {model.modelName}</p>
              </div>
              <button
                onClick={() => setShowOffersModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1"><span>🎁</span> ₹25,000 Exchange Bonus Applied</p>
                <p className="text-[11px] text-emerald-700">Valid on bookings completed before Aug 31, 2026.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1"><span>🛡</span> Free 5-Year Extended Warranty</p>
                <p className="text-[11px] text-amber-700">Official manufacturer warranty extension included.</p>
              </div>
            </div>

            <button
              onClick={() => {
                alert("Offer locked! Our relationship manager will contact you within 15 minutes.");
                setShowOffersModal(false);
              }}
              className="w-full rounded-xl bg-highway py-3 text-xs font-bold text-white hover:brightness-110 shadow-sm"
            >
              Lock Offers &amp; Schedule Test Drive
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: 360 Degree View Interactive Viewer                  */}
      {/* ------------------------------------------------------------- */}
      {show360Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">{model.modelName} 360° Studio View</h3>
                <p className="text-xs text-ink/50">Interactive exterior inspection</p>
              </div>
              <button
                onClick={() => setShow360Modal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainPhotoUrl}
                alt="360 view"
                className="h-full w-full object-contain"
              />
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                <span className="rounded-full bg-black/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  ⇄ Drag or swipe to rotate 360°
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Write Review Modal                                   */}
      {/* ------------------------------------------------------------- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Rate &amp; Review {model.modelName}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink">Overall Rating</label>
                <div className="flex gap-2 text-2xl text-amber-400 mt-1 cursor-pointer">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink">Review Title</label>
                <input
                  type="text"
                  placeholder="e.g. Best car in this budget!"
                  className="w-full mt-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink focus:outline-none focus:border-highway"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink">Your Experience</label>
                <textarea
                  rows={3}
                  placeholder="Tell other buyers about mileage, comfort, build quality..."
                  className="w-full mt-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink focus:outline-none focus:border-highway"
                />
              </div>
            </div>

            <button
              onClick={() => {
                alert("Thank you! Your review has been submitted for verification.");
                setShowReviewModal(false);
              }}
              className="w-full rounded-xl bg-highway py-3 text-xs font-bold text-white hover:brightness-110"
            >
              Submit Review &amp; Enter ₹1000 Lucky Draw
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: Brochure Download Modal                              */}
      {showBrochureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Download Official Brochure</h3>
              <button
                onClick={() => setShowBrochureModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink/70">
              Get the complete 28-page PDF brochure of {model.modelName} with all variant specs, color palette, dimensions, and accessories list.
            </p>

            <button
              onClick={() => {
                alert(`Downloading ${model.modelName} 2026 Official Brochure (PDF, 4.2 MB)...`);
                setShowBrochureModal(false);
              }}
              className="w-full rounded-xl bg-highway py-3 text-xs font-bold text-white hover:brightness-110 shadow-sm"
            >
              Download PDF Now (Free)
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: Photo Gallery Modal                                  */}
      {showPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">{model.modelName} HD Photo Gallery</h3>
              <button
                onClick={() => setShowPhotosModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainPhotoUrl} alt="Gallery view" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      )}

    </SiteLayout>
  );
}
