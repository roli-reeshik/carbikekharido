/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8FA",
        ink: "#0F1419",
        highway: {
          DEFAULT: "#0D2137",
          light: "#1A3A5C",
          dark: "#081828",
        },
        marigold: {
          DEFAULT: "#F5A623",
          dark: "#D4890A",
          light: "#FFD080",
        },
        teal: {
          DEFAULT: "#0E7C7B",
          light: "#14A5A3",
          dark: "#095C5B",
        },
        coral: {
          DEFAULT: "#E85D4C",
          light: "#FF7A6B",
        },
        line: "#E2E6EB",
        surface: "#FFFFFF",
        sell: {
          primary: "#1E3A5F",
          accent: "#FF6B35",
          emerald: "#2D7A6B",
        },
        obsidian: {
          DEFAULT: "#0B0B0B",
          950: "#050505",
          900: "#0B0B0B",
          850: "#0F0F0F",
          800: "#141414",
          750: "#1A1A1A",
          700: "#222222",
          600: "#2C2C2C",
          500: "#444444",
          border: "rgba(255, 255, 255, 0.09)",
          glow: "rgba(255, 255, 255, 0.04)",
        },
        supercar: {
          DEFAULT: "#F5A623",
          amber: "#F5A623",
          flame: "#FF4500",
          gold: "#D4AF37",
          glow: "rgba(245, 166, 35, 0.25)",
        },
        superbike: {
          DEFAULT: "#00F5D4",
          cyan: "#00F5D4",
          neon: "#00E5FF",
          electric: "#0E7C7B",
          glow: "rgba(0, 245, 212, 0.25)",
        },
      },
      letterSpacing: {
        cinematic: "0.2em",
        wide: "0.15em",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,20,25,0.06), 0 4px 16px rgba(15,20,25,0.04)",
        "card-hover": "0 4px 12px rgba(15,20,25,0.08), 0 12px 32px rgba(15,20,25,0.06)",
        nav: "0 2px 20px rgba(15,20,25,0.08)",
        glow: "0 0 40px rgba(245,166,35,0.15)",
        "obsidian-card": "0 10px 30px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)",
        "obsidian-glow-amber": "0 0 45px -5px rgba(245,166,35,0.25), 0 0 0 1px rgba(245,166,35,0.3)",
        "obsidian-glow-cyan": "0 0 45px -5px rgba(0,245,212,0.25), 0 0 0 1px rgba(0,245,212,0.3)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0D2137 0%, #1A3A5C 50%, #0E7C7B 100%)",
        "accent-gradient": "linear-gradient(135deg, #F5A623 0%, #E85D4C 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
        "obsidian-glass": "linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(11,11,11,0.95) 100%)",
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "slide-in": "slideIn 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
