import "@/styles/vehicle-detail.css";

/**
 * Font links are rendered here rather than in the root layout, so the
 * homepage keeps its existing system-font fallback untouched (see
 * globals.css's notes on why — this sandbox can't reach
 * fonts.googleapis.com to test next/font/google, so a plain <link> tag
 * fetched at runtime in the browser is used instead, same approach as
 * the standalone demo this was ported from). Next.js automatically
 * hoists <link>/<meta>/<title> rendered anywhere in the tree up to
 * <head>, so this works from a nested layout without needing its own
 * <html>/<head>.
 */
export default function VehicleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
