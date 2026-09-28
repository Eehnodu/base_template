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
  const key = Object.keys(routeConfig)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));

  return (
    (key && { ...routeConfig[key], icon: routeConfig[key].icon ?? null }) || {
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
