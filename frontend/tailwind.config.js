/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        primary: ["'IBM Plex Sans'", "-apple-system", "sans-serif"],
        secondary: ["'Azeret Mono'", "monospace"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      colors: {
        // MoltForge palette
        forge: {
          bg: "#050505",
          surface: "#0A0A0A",
          "surface-hi": "#121212",
          border: "#27272A",
          cyan: "#22D3EE",
          "cyan-hover": "#06B6D4",
          amber: "#F59E0B",
          success: "#10B981",
          error: "#EF4444",
          "text-primary": "#FAFAFA",
          "text-secondary": "#A1A1AA",
          "text-muted": "#52525B",
        },
        // Shadcn CSS variable based colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px -5px rgba(34, 211, 238, 0.4)",
        "glow-amber": "0 0 20px -5px rgba(245, 158, 11, 0.4)",
        "card": "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 4px 6px -1px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at 50% 40%, rgba(34, 211, 238, 0.12) 0%, rgba(5, 5, 5, 0) 65%)",
        "beam-cyan": "linear-gradient(to right, transparent, #22D3EE, transparent)",
        "beam-amber": "linear-gradient(to right, transparent, #F59E0B, transparent)",
        "grid-pattern": "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "48px 48px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
