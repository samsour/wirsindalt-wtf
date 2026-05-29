import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#D8E6F0",       // light periwinkle — the wallpaper
        surface: "#EEF5FA",  // slightly lighter for cards
        ink: {
          DEFAULT: "#1A2A42", // deep navy — the signature ink
          muted: "#4B6480",
          faint: "#8AA2B8",
        },
        line: {
          DEFAULT: "#B8CCE0",
          strong: "#98B4CC",
        },
        accent: {
          DEFAULT: "#C42828", // Blaubär red — the sweater
          soft: "#FDEAEA",
          mid: "#D96060",
        },
        warm: {
          DEFAULT: "#C49A60", // anchor rope amber
          soft: "#F5EBDB",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
      },
    },
  },
} satisfies Config;
