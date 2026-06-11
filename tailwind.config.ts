import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.12)",
      },
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          700: "#c2410c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
