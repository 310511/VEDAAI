import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F1EB",
        surface: "#FFFCF7",
        ink: "#1A1814",
        muted: "#6B6560",
        subtle: "#9C958D",
        border: "#E3DDD3",
        "border-strong": "#C9C1B4",
        accent: "#1B4D4A",
        "accent-hover": "#153D3A",
        "accent-soft": "#E2EEED",
        "accent-muted": "#5A8A86",
        success: "#2D6A4F",
        "success-soft": "#E8F3EC",
        warning: "#B45309",
        "warning-soft": "#FEF3E2",
        danger: "#B91C1C",
        "danger-soft": "#FEF2F2",
        processing: "#1E4A7A",
        "processing-soft": "#E8EEF5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26, 24, 20, 0.04), 0 4px 16px rgba(26, 24, 20, 0.06)",
        lift: "0 8px 24px rgba(26, 24, 20, 0.1)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
