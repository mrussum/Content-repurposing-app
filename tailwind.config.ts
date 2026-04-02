import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "bg-base":     "var(--bg-base)",
        "bg-surface":  "var(--bg-surface)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-input":    "var(--bg-input)",
        // Borders
        "border-subtle":  "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-hover":   "var(--border-hover)",
        // Text
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",
        "text-ghost":     "var(--text-ghost)",
        // Accent
        accent:        "var(--accent)",
        "accent-dim":  "var(--accent-dim)",
        "accent-border":"var(--accent-border)",
        // Semantic
        success: "var(--success)",
        error:   "var(--error)",
        warning: "var(--warning)",
        info:    "var(--info)",
      },
      fontFamily: {
        syne:  ["Syne", "sans-serif"],
        sans:  ["DM Sans", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "14px",
        md: "10px",
        sm: "8px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.3" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.3s ease-out",
        "scale-in":       "scale-in 0.2s ease-out",
        "pulse-dot":      "pulse-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
