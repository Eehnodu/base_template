import { MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/hooks/common/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-bg-hover hover:text-text-main"
    >
      {theme === "dark" ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  );
};

export default ThemeToggle;
