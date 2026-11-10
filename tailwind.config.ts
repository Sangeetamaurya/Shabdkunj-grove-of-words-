import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF4E8",
          50: "#FDFBF7",
          100: "#FAF4E8",
          200: "#F4EBD9",
          300: "#EADDC4",
        },
        paper: {
          DEFAULT: "#FFFDF7",
          light: "#FFFFFB",
          muted: "#F7F2E7",
        },
        brown: {
          DEFAULT: "#3B2A1E",
          text: "#3B2A1E",
          muted: "#7A6552",
          light: "#A48F7B",
          dark: "#2A1D14",
        },
        wood: {
          top: "#8B5E3C",
          edge: "#5E3B22",
          dark: "#462B17",
          shadow: "rgba(70, 43, 23, 0.35)",
        },
        accent: {
          DEFAULT: "#B4532A",
          hover: "#8F3F1C",
          light: "#D87247",
          subtle: "#F5E6DD",
        },
        navy: {
          DEFAULT: "#182631",
          card: "#1B2E3D",
          light: "#2A4154",
          dark: "#101B24",
        },
        border: {
          DEFAULT: "#E6D9C3",
          light: "#F0E7D8",
          dark: "#D6C4A9",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(59, 42, 30, 0.08), 0 2px 6px -1px rgba(59, 42, 30, 0.04)",
        "warm-md": "0 8px 30px -4px rgba(59, 42, 30, 0.12), 0 4px 10px -2px rgba(59, 42, 30, 0.06)",
        "warm-lg": "0 20px 40px -8px rgba(59, 42, 30, 0.18), 0 8px 16px -4px rgba(59, 42, 30, 0.08)",
        "shelf": "0 14px 24px -6px rgba(59, 42, 30, 0.25), 0 4px 8px -2px rgba(59, 42, 30, 0.15)",
        "spine": "-2px 4px 12px rgba(30, 20, 10, 0.25), inset 2px 0 4px rgba(255, 255, 255, 0.15)",
        "spine-hover": "-4px 12px 24px rgba(30, 20, 10, 0.35), inset 2px 0 6px rgba(255, 255, 255, 0.25)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
