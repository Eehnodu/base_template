import type { AdminMenuItem } from "@/types/admin/sidebar";

// 메뉴 항목 구조(link · group)는 admin 사이드바와 같다
export type ClientMenuItem = AdminMenuItem;

export interface ClientSidebarProps {
  collapsed: boolean;
  menu: ClientMenuItem[];
  onToggleSidebar: () => void;
}
