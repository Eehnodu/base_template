// 역할: 사이드바 그룹 메뉴. 펼침 토글과, 접힌 사이드바에서 hover 시 고정 위치 플라이아웃
import { GroupProps } from "@/types/admin/sidebar";
import SubLink from "./subLink";
import { useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";

const GroupLink = ({ item, collapsed }: GroupProps) => {
  const { pathname } = useLocation();

  const isChildActive = item.children.some((child) => {
    if (child.end) return pathname === child.to;
    return pathname.startsWith(child.to);
  });

  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const iconRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = item?.icon;

  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  // 아이콘에서 플라이아웃으로 마우스를 옮기는 사이 잠깐 벗어나도 닫히지 않게 100ms 지연
  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setHovered(false), 100);
  };

  // 사이드바가 overflow-hidden 이라 안에 그릴 수 없다. fixed 로 빼고 아이콘의 화면 좌표를 top 으로 쓴다
  const handleMouseEnter = () => {
    cancelHide();
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setFlyoutTop(rect.top);
    }
    setHovered(true);
  };

  return (
    <div className="pb-2 text-left">
      <div
        ref={iconRef}
        onMouseEnter={collapsed ? handleMouseEnter : undefined}
        onMouseLeave={collapsed ? scheduleHide : undefined}
      >
        <button
          type="button"
          onClick={collapsed ? undefined : () => setOpen((prev) => !prev)}
          className={`w-full flex items-center h-[44px] pl-4 pr-3 gap-3 overflow-hidden text-sm font-medium transition-colors duration-200 rounded-lg
          ${collapsed ? "cursor-default" : "cursor-pointer"}
          ${isChildActive ? "text-text-main" : "text-text-sub hover:bg-bg-hover hover:text-text-main"}`}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"}`}>
            {item?.title}
          </span>
          <div className={`flex-1 h-px bg-line transition-all duration-300 ease-in-out ${collapsed ? "opacity-0" : "opacity-100"}`} />
          <ChevronDownIcon
            className={`h-3 w-3 shrink-0 transition-all duration-300 ease-in-out ${open ? "rotate-0" : "-rotate-90"} ${collapsed ? "opacity-0" : "opacity-100"}`}
          />
        </button>
      </div>

      <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${!collapsed && open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        {item?.children.map((link) => (
          <SubLink
            key={link.to}
            {...link}
            nested
            collapsed={collapsed}
          />
        ))}
      </div>

      {collapsed && hovered && (
        <div
          className="fixed z-50 bg-bg-card border border-line rounded-lg py-1 min-w-[160px] shadow-lg"
          style={{ top: flyoutTop, left: 68 }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <div className="px-3 py-1.5 text-xs font-medium text-text-sub whitespace-nowrap">
            {item.title}
          </div>
          {item.children.map((link) => (
            <SubLink
              key={link.to}
              {...link}
              collapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupLink;
