import type { Config } from "tailwindcss";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./domain/**/*.{js,ts,jsx,tsx}",
  ],
  // @ts-expect-error — safelist not yet in type defs for v4
  safelist: ["btn-accent", "btn-primary", "btn-secondary"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent, #2563eb)",
      },
    },
  },
} satisfies Config;

export default config;
