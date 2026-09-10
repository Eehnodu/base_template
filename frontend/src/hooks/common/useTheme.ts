// 역할: 라이트/다크 테마 상태. html.dark 클래스와 localStorage 로 유지한다
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const readTheme = (): Theme => {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // 전환 중에는 트랜지션을 꺼서 요소마다 색이 따로 바뀌는 깜빡임을 막는다
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");

  window.setTimeout(() => root.classList.remove("theme-switching"), 0);
};

/**
 * 라이트/다크 테마 훅
 *
 * - `html` 에 `dark` 클래스를 붙였다 뗀다 (tailwind darkMode: "class")
 * - 선택값은 localStorage 에 저장되고, 없으면 OS 설정을 따른다
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
};
