import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    colors: {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      white: "#17352a",
      black: "#ffffff",
      zinc: {
        50: "#f8faf9",
        100: "#eef2ef",
        200: "#e1e7e2",
        300: "#cbd5cd",
        400: "#77847c",
        500: "#647168",
        600: "#526057",
        700: "#3e4a42",
        800: "#29352d",
        900: "#18231d"
      },
      cyan: {
        200: "#2f7d63",
        300: "#2f7d63",
        400: "#1f6b52"
      },
      fuchsia: {
        300: "#5267b8",
        400: "#4056a1"
      },
      pink: {
        200: "#9a4d73",
        300: "#9a4d73",
        400: "#873d65",
        500: "#7d365d"
      },
      purple: {
        300: "#6f61a8",
        500: "#66539e"
      },
      blue: {
        500: "#3566a8"
      },
      emerald: {
        100: "#e8f5ed",
        200: "#18794e",
        300: "#18794e",
        400: "#18794e"
      },
      amber: {
        100: "#fff6e5",
        200: "#9a5b13",
        300: "#9a5b13"
      },
      red: {
        100: "#fff0ee",
        200: "#b23a31",
        300: "#b23a31",
        400: "#a8322a",
        500: "#972d26"
      }
    },
    extend: {
      colors: {
        court: {
          black: "#f3f6f3",
          panel: "#ffffff",
          elevated: "#f7f9f7",
          line: "#dce4de"
        },
        tier: {
          opal: "#06B6D4",
          pinkDiamond: "#EC4899",
          diamond: "#3B82F6",
          amethyst: "#A855F7",
          ruby: "#EF4444",
          bronze: "#9CA3AF"
        }
      },
      boxShadow: {
        opal: "0 1px 2px rgba(20, 45, 35, 0.08)",
        panel: "0 1px 2px rgba(20, 45, 35, 0.06), 0 8px 24px rgba(20, 45, 35, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;
