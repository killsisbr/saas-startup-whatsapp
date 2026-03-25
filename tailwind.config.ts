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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "rgb(102, 94, 246)",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "rgb(18, 19, 21)",
          muted: "rgb(28, 29, 31)",
        },
        border: "rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "gradient-neon": "linear-gradient(90deg, #665EF6 0%, #8D84F7 100%)",
        "gradient-card": "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)",
      },
      boxShadow: {
        "neon": "0 0 20px rgba(102, 94, 246, 0.4)",
      }
    },
  },
  plugins: [],
};
export default config;
