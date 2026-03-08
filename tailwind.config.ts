import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'risk-green': '#22c55e',
        'risk-yellow': '#eab308',
        'risk-orange': '#f97316',
        'risk-red': '#dc2626',
        'risk-dark-red': '#991b1b',
        'surface': '#000000',
        'surface-card': '#0a0a0a',
      },
    },
  },
  plugins: [],
};
export default config;
