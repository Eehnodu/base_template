import { SubLinkProps } from "@/types/admin/sidebar";
import { Link, useLocation } from "react-router-dom";

const SubLink = ({
  to,
  label,
  nested = false,
  collapsed = false,
  icon: Icon,
  number: Numbers,
  end = false,
}: SubLinkProps) => {
  const { pathname } = useLocation();

  const getIsActive = () => {
    if (pathname === to) return true;
    if (end) return false;
    if (pathname.startsWith(to)) {
      const suffix = pathname.replace(to, "");
      const isSubMenuPath = /^\/[a-zA-Z]/.test(suffix);
      return !isSubMenuPath;
    }

    return false;
  };

  const isActive = getIsActive();
  const base = "flex items-center rounded-lg select-none transition-colors duration-200 h-[44px] w-full overflow-hidden gap-3";
  const paddingClass = nested && !collapsed ? "pl-8 pr-3" : "pl-4 pr-3";

  return (
    <Link
      to={to}
      className={`${base} ${paddingClass} ${isActive
        ? "bg-white/10 text-white font-medium text-sm"
        : "text-neutral-400 hover:bg-white/5 hover:text-white/90 text-sm"
        }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"}`}>
        {label}
      </span>
      {Numbers !== undefined && Numbers > 0 && (
        <div className={`ml-auto flex items-center justify-center w-6 h-6 rounded-full bg-white/5 transition-all duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`}>
          <span className="text-[10px] font-bold">{Numbers}</span>
        </div>
      )}
    </Link>
  );
};

export default SubLink;