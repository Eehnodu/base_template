// 역할: 관리자 공통 레이아웃 + 인증 가드. 세션이 없으면 refresh 를 시도하고, 안 되면 로그인으로 보낸다
import { parseUserInfo, refreshExp } from "@/hooks/common/getCookie";
import { useRefreshToken } from "@/hooks/common/useAPI";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "@/component/admin/layout/sideBar/sideBar";
import { AdminMenuItem } from "@/types/admin/sidebar";
import { LucideIcon } from "lucide-react";
import AdminHeader from "@/component/admin/layout/header/header";
import {
  ChartColumnIcon,
  UsersIcon,
} from "lucide-react";

// 사이드바 메뉴 정의. 헤더 제목도 이 배열에서 파생되므로 메뉴를 추가하면 헤더는 자동으로 따라온다
const adminMenu: AdminMenuItem[] = [
  {
    type: "link",
    label: "대시보드",
    to: "/admin",
    icon: ChartColumnIcon,
  },
  {
    type: "group",
    title: "그룹 관리",
    icon: UsersIcon,
    children: [
      {
        label: "고객사별 통계",
        to: "/admin/group",
        icon: UsersIcon,
      },
    ],
  },
];

const routeConfig: Record<
  string,
  { label: string; icon: LucideIcon | undefined }
> = adminMenu.reduce(
  (acc, item) => {
    if (item.type === "link") {
      acc[item.to] = { label: item.label, icon: item.icon };
    } else {
      item.children.forEach((child) => {
        acc[child.to] = { label: child.label, icon: child.icon };
      });
    }
    return acc;
  },
  {} as Record<string, { label: string; icon: LucideIcon | undefined }>,
);

const getHeaderInfoByPath = (pathname: string) => {
  // 긴 경로부터 매칭해 /admin/group 이 /admin 에 먹히지 않게 한다
  const key = Object.keys(routeConfig)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));

  return (
    (key && routeConfig[key]) || {
      label: "관리자 도구",
      icon: null,
    }
  );
};

const AdminLayout = () => {
  const user = parseUserInfo("admin");
  const isRefresh = refreshExp("admin");
  const refresh = useRefreshToken();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // user_info 는 사라졌지만 refresh_exp 가 남아 있으면 access 만 만료된 상태.
    // 조용히 갱신한 뒤 새로고침해 쿠키를 다시 읽는다
    if (!user && isRefresh) {
      refresh()
        .then(() => {
          window.location.reload();
        })
        .catch(() => {
          navigate("/admin/login");
        });
      return;
    }

    if (!user || user.auth_type !== "admin") {
      navigate("/admin/login");
    }
  }, [user, isRefresh, navigate, refresh]);

  // 리다이렉트 전 관리자 화면이 잠깐 보이는 것을 막는다
  if (!user || user.auth_type !== "admin") {
    return null;
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-full bg-bg text-text-main">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        adminMenu={adminMenu}
        onToggleSidebar={handleToggleSidebar}
      />

      <main className="flex h-screen flex-1 flex-col min-w-0">
        <AdminHeader getHeaderInfoByPath={getHeaderInfoByPath} />
        <section className="relative flex-1 p-4 py-6 min-h-0">
          <div className="w-full h-full min-h-0 overflow-y-auto scrollbar-hide">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
