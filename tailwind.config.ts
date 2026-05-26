import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF7",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B6B66",
          faint: "#A8A8A0",
        },
        line: {
          DEFAULT: "#E8E6DF",
          strong: "#D4D2C9",
        },
        accent: {
          DEFAULT: "#2D5F3F",
          soft: "#E8F0E9",
          mid: "#7AAD8B",
        },
        warm: {
          DEFAULT: "#C9774A",
          soft: "#FAEDE3",
        },
        // Heatmap scale
        heat: {
          0: "#F4F2EC",
          1: "#EBEFE6",
          2: "#D7E2D4",
          3: "#ADCBAE",
          4: "#7AAD8B",
          5: "#4E8666",
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
