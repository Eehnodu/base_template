import { type LucideIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

import ThemeToggle from "./themeToggle";

interface HeaderProps {
  getHeaderInfoByPath: (path: string) => {
    label: string;
    icon: LucideIcon | null;
  };
}

const Header = ({ getHeaderInfoByPath }: HeaderProps) => {
  const { pathname } = useLocation();
  const { label, icon: Icon } = getHeaderInfoByPath(pathname);

  return (
    <header className="flex h-16 items-center gap-3 px-8 border-b border-line shrink-0 bg-bg-card">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg-sub">
        {Icon ? (
          <Icon className="h-4 w-4 text-text-sub" />
        ) : (
          <div className="h-1 w-1 rounded-full bg-text-sub" />
        )}
      </div>
      <span className="font-bold text-text-main">{label}</span>

      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
