import { LucideIcon } from "lucide-react";

interface BaseLinkItem {
  label: string;
  to: string;
  icon?: LucideIcon;
  number?: number;
  end?: boolean;
}

interface AdminLinkItem extends BaseLinkItem {
  type: "link";
}

interface AdminGroupItem {
  type: "group";
  title: string;
  icon?: LucideIcon;
  children: BaseLinkItem[];
}

export type AdminMenuItem = AdminLinkItem | AdminGroupItem;

export interface SubLinkProps extends BaseLinkItem {
  nested?: boolean;
  collapsed?: boolean;
}

interface GroupItemProps {
  title: string;
  children: BaseLinkItem[];
  icon?: LucideIcon;
}

export interface GroupProps {
  item: GroupItemProps;
  collapsed?: boolean;
}

// ======================================
// 페이지 별 Props
export interface AdminSidebarProps {
  collapsed: boolean;
  adminMenu: AdminMenuItem[];
  onToggleSidebar: () => void;
}

export interface AdminHeaderProps {
  getTitleByPath: (pathname: string) => string;
}
