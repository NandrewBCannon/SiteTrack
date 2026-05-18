import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        steel: "#516171",
        safety: "#F7B32B",
        signal: "#1E88E5",
        mint: "#2FBF71",
        coral: "#EF6F6C"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23, 32, 42, 0.08), 0 8px 30px rgba(23, 32, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
