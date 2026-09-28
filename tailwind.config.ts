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
        pantone: {
          yellow: "#F5EFC6",  // Transparent Yellow base
          cream: "#FAF8ED",   // Soft editorial background
          red: "#4D0E12",      // Sceptre Red accent
          blue: "#A5BCD6",     // Cerulean Blue highlight
          soil: "#4A2E27",     // Potting Soil secondary text
          java: "#231815",     // Java Brown primary dark text / border
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;