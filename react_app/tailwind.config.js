import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyan: colors.cyan,
        sky: colors.sky,
        fuchsia: colors.fuchsia,
        lime: colors.lime,
        emerald: colors.emerald,
        rose: colors.rose,
        violet: colors.violet,
        amber: colors.amber,
        teal: colors.teal,
        purple: colors.purple,
        indigo: colors.indigo,

        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",

        card: "var(--color-card)",
        "card-foreground": "var(--color-card-foreground)",
        popover: "var(--color-popover)",
        "popover-foreground": "var(--color-popover-foreground)",

        muted: "var(--color-muted)",
        "muted-foreground": "var(--color-muted-foreground)",

        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",

        secondary: "var(--color-secondary)",
        "secondary-foreground": "var(--color-secondary-foreground)",

        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",

        success: "var(--color-success)",
        "success-foreground": "var(--color-success-foreground)",

        warning: "var(--color-warning)",
        "warning-foreground": "var(--color-warning-foreground)",

        error: "var(--color-error)",
        "error-foreground": "var(--color-error-foreground)",

        destructive: "var(--color-destructive)",
        "destructive-foreground": "var(--color-destructive-foreground)",

        "brand-indigo": "var(--color-brand-indigo)",
        "brand-indigo-foreground": "var(--color-brand-indigo-foreground)",

        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",

        surface: "var(--color-surface)",
        "surface-foreground": "var(--color-surface-foreground)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/line-clamp"),

  ],

};
