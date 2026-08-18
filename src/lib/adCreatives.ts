export interface AdCreative {
  id: string;
  advertiserName: string; // fictional placeholder advertiser
  headline: { en: string; hi: string };
  subtext: { en: string; hi: string };
  ctaLabel: { en: string; hi: string };
  accent: string; // hex, per-creative accent so rotating banners don't look identical
}

/**
 * Placeholder ad creatives — entirely fictional advertisers/copy, not a
 * reproduction of any real manufacturer's ad or trademark. This is the
 * actual mechanism (a rotating, clearly-labeled sponsored slot); swap
 * these objects for real booked creatives once you have advertisers,
 * without touching AdBanner.tsx itself.
 */
export const AD_CREATIVES: AdCreative[] = [
  {
    id: "ad-1",
    advertiserName: "Summit Motors",
    headline: { en: "Festive season, festive pricing", hi: "त्योहारी सीज़न, त्योहारी कीमतें" },
    subtext: {
      en: "Limited-period offers across the SUV range at your nearest dealership",
      hi: "अपने नज़दीकी डीलरशिप पर SUV रेंज पर सीमित समय के ऑफर",
    },
    ctaLabel: { en: "View offers", hi: "ऑफर देखें" },
    accent: "#C77F1E",
  },
  {
    id: "ad-2",
    advertiserName: "Northline Two-Wheelers",
    headline: { en: "Zero down payment, this week only", hi: "इस हफ़्ते, ज़ीरो डाउन पेमेंट" },
    subtext: { en: "Ride home your next scooter or commuter bike today", hi: "आज ही अपनी नई स्कूटर या कम्यूटर बाइक घर लाएँ" },
    ctaLabel: { en: "Check eligibility", hi: "पात्रता जांचें" },
    accent: "#2C948E",
  },
];
