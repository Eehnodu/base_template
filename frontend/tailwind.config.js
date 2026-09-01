/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Admin 버튼 색상 (다크모드에서 자동 전환)
        main: {
          DEFAULT: "rgb(var(--btn-main) / <alpha-value>)",
          hover:   "rgb(var(--btn-main-hover) / <alpha-value>)",
          active:  "rgb(var(--btn-main-active) / <alpha-value>)",
        },
        sub1: {
          DEFAULT: "rgb(var(--btn-sub1) / <alpha-value>)",
          hover:   "rgb(var(--btn-sub1-hover) / <alpha-value>)",
          active:  "rgb(var(--btn-sub1-active) / <alpha-value>)",
        },
        sub2: {
          DEFAULT: "rgb(var(--btn-sub2) / <alpha-value>)",
          hover:   "rgb(var(--btn-sub2-hover) / <alpha-value>)",
          active:  "rgb(var(--btn-sub2-active) / <alpha-value>)",
        },

        // CSS 변수 기반 시맨틱 토큰 (다크모드 자동 전환)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          light:   "rgb(var(--primary-light) / <alpha-value>)",
          dark:    "rgb(var(--primary-dark) / <alpha-value>)",
        },
        bg: {
          DEFAULT:  "rgb(var(--bg) / <alpha-value>)",
          card:     "rgb(var(--bg-card) / <alpha-value>)",
          sub:      "rgb(var(--bg-sub) / <alpha-value>)",
          hover:    "rgb(var(--bg-hover) / <alpha-value>)",
          active:   "rgb(var(--bg-active) / <alpha-value>)",
          disabled: "rgb(var(--bg-disabled) / <alpha-value>)",
        },
        text: {
          main:        "rgb(var(--text-main) / <alpha-value>)",
          sub:         "rgb(var(--text-sub) / <alpha-value>)",
          disabled:    "rgb(var(--text-disabled) / <alpha-value>)",
          placeholder: "rgb(var(--text-placeholder) / <alpha-value>)",
          inverse:     "rgb(var(--text-inverse) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong:  "rgb(var(--border-strong) / <alpha-value>)",
          focus:   "rgb(var(--border-focus) / <alpha-value>)",
        },
        input: {
          bg:     "rgb(var(--input-bg) / <alpha-value>)",
          border: "rgb(var(--input-border) / <alpha-value>)",
        },
        point: {
          green: "rgb(var(--point-green) / <alpha-value>)",
          red:   "rgb(var(--point-red) / <alpha-value>)",
          amber: "rgb(var(--point-amber) / <alpha-value>)",
          blue:  "rgb(var(--point-blue) / <alpha-value>)",
        },
        success: { DEFAULT: "rgb(var(--point-green) / <alpha-value>)", bg: "rgb(var(--success-bg) / <alpha-value>)" },
        error:   { DEFAULT: "rgb(var(--point-red) / <alpha-value>)",   bg: "rgb(var(--error-bg) / <alpha-value>)" },
        warning: { DEFAULT: "rgb(var(--point-amber) / <alpha-value>)", bg: "rgb(var(--warning-bg) / <alpha-value>)" },
        info:    { DEFAULT: "rgb(var(--point-blue) / <alpha-value>)",  bg: "rgb(var(--info-bg) / <alpha-value>)" },
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        surface: { raised: "rgb(var(--surface-raised) / <alpha-value>)" },
        skeleton: {
          base:  "rgb(var(--skeleton-base) / <alpha-value>)",
          shine: "rgb(var(--skeleton-shine) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
