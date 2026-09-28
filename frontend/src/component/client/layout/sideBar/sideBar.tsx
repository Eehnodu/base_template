import GroupLink from "./groupLink";
import SubLink from "./subLink";
import Logo from "@/assets/profile.png";
import { LogOut, SidebarCloseIcon, SidebarOpenIcon } from "lucide-react";
import { usePost } from "@/hooks/common/useAPI";
import { useAuth } from "@/hooks/common/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClientSidebarProps } from "@/types/client/sidebar";
import Modal from "@/component/client/ui/feedback/modal";
import { APP_NAME } from "@/constants/app";

const Sidebar = ({ collapsed, menu, onToggleSidebar }: ClientSidebarProps) => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  /* 접힘 · 펼침 전환(300ms) 중에는 hover 로 뜨는 토글을 숨긴다.
     접는 순간 마우스가 아직 헤더 위에 있어 반대쪽 아이콘이 잠깐 비치던 문제 */
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 320);
    return () => window.clearTimeout(timer);
  }, [collapsed]);

  const logoutMutation = usePost<void, void>("api/auth/logout");

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        setLogoutModalOpen(false);
        navigate("/");
      },
    });
  };

  return (
    <aside
      className={`
        h-screen flex flex-col overflow-hidden border-r border-line transition-all duration-300 ease-in-out
        bg-bg text-text-main
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      <div className="flex h-full flex-col">
        {/* 헤더 영역 */}
        <div className="group flex h-16 items-center flex-shrink-0 border-b border-line relative overflow-hidden text-text-main">
          <div className="relative flex items-center justify-center w-16 h-full shrink-0 z-10">
            <img
              src={Logo}
              alt="Profile"
              className={`h-6 w-6 object-contain transition-opacity duration-200
        ${collapsed && !transitioning ? "group-hover:opacity-0" : "opacity-100"}`}
            />

            {collapsed && !transitioning && (
              <div
                onClick={onToggleSidebar}
                className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <SidebarOpenIcon className="w-4 h-4" />
              </div>
            )}
          </div>

          <div
            className={`
    absolute left-14 transition-all duration-300 ease-in-out
    ${collapsed ? "opacity-0 -translate-x-2 invisible" : "opacity-100 translate-x-0 visible"}
  `}
          >
            <h1 className="text-xl font-bold whitespace-nowrap tracking-tight">
              {APP_NAME}
            </h1>
          </div>

          {!collapsed && !transitioning && (
            <div
              onClick={onToggleSidebar}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <SidebarCloseIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* 메뉴 리스트 */}
        <nav className="flex-1 overflow-y-auto px-2 py-6">
          <div className="flex flex-col gap-y-1">
            {menu.map((item, idx) =>
              item.type === "link" ? (
                <SubLink
                  key={`${item.to}-${idx}`}
                  {...item}
                  collapsed={collapsed}
                />
              ) : (
                <GroupLink
                  key={`${item.title}-${idx}`}
                  item={item}
                  collapsed={collapsed}
                />
              ),
            )}
          </div>
        </nav>

        {/* 프로필 + 로그아웃 (로그인한 경우만) */}
        {user && (
          <div className="flex-shrink-0 border-t border-line overflow-hidden">
            <div className="group flex items-center h-[62px] relative">
              <div className="flex items-center justify-center w-16 shrink-0">
                <div className="w-8 h-8 rounded-full bg-bg-sub flex items-center justify-center text-text-main font-bold text-xs shrink-0">
                  {user.user_nickname?.[0]?.toUpperCase() ?? "U"}
                </div>
              </div>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "opacity-0 w-0" : "opacity-100 w-full"}`}
              >
                <p className="text-xs font-bold text-text-main truncate w-28">
                  {user.user_nickname}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className={`shrink-0 text-text-sub hover:text-error transition-colors duration-200 flex items-center justify-center ${
                  collapsed
                    ? "absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 group-hover:bg-bg-hover"
                    : "mr-3 p-1.5"
                }`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="로그아웃"
        description="로그아웃 하시겠습니까?"
        buttonCount={2}
        primaryText="로그아웃"
        primaryVariant="danger"
        onPrimary={handleLogout}
        secondaryText="취소"
        onSecondary={() => setLogoutModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
