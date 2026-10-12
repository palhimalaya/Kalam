import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--bg)",
        elev: "var(--bg-elev)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        accentink: "var(--accent-ink)",
        good: "var(--good)",
        bad: "var(--bad)",
        warn: "var(--warn)",
      },
      fontFamily: {
        sans: ["Segoe UI", "Noto Sans", "system-ui", "sans-serif"],
        serif: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(28, 25, 21, 0.04), 0 12px 32px rgba(28, 25, 21, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
