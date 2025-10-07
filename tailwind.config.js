import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";
const { TinyColor } = require("@ctrl/tinycolor");

const green = {
  50: "#f3fbf2",
  100: "#e3f8e0",
  200: "#c7f0c2",
  300: "#9ae392",
  400: "#65cd5b",
  500: "#319527",
  600: "#287421",
  700: "#245c1f",
  800: "#1e4c1b",
  900: "#0b290a",
};

function genPalette(base) {
  const c = new TinyColor(base);
  return {
    DEFAULT: c.toHexString(),
    light: c.lighten(30).toHexString(),
    dark: c.darken(30).toHexString(),
    muted: c.desaturate(20).toHexString(),
    50: green[50],
    100: green[100],
    200: green[200],
    300: green[300],
    400: green[400],
    500: green[500],
    600: green[600],
    700: green[700],
    800: green[800],
    900: green[900],
    950: green[950],
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      screens: {
        xs: "475px", // thêm breakpoint mới
      },
      ringColor: {
        DEFAULT: "#c7f0c2",
      },
      colors: {
        // Keep existing shadcn/ui colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Add custom colors from Laravel project
        primary: genPalette("#319527"), // brand color
        gray: {
          600: "#585858",
          700: "#3C3C3C",
        },
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        inter: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontSize: "1.45rem",
              fontWeight: "700",
              lineHeight: "1.3",
              marginTop: "1em",
              marginBottom: "0.5em",
            },
            h2: {
              fontSize: "1.25rem",
              fontWeight: "700",
              lineHeight: "1.3",
              marginTop: "1em",
              marginBottom: "0.5em",
            },
            h3: {
              fontSize: "1.1rem",
              fontWeight: "700",
              lineHeight: "1.3",
              marginTop: "1em",
              marginBottom: "0.5em",
            },
            hr: {
              borderColor: "#919191", // màu xám nhạt
            },
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },

  plugins: [
    forms,
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};
