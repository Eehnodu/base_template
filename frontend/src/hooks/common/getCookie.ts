import { UserInfo } from "@/types/user";

const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]*)`));
  return match ? match[2].trim() : undefined;
};

export const parseUserInfo = (
  authType: "user" | "admin" = "user",
): UserInfo | null => {
  const prefix = authType === "admin" ? "admin_" : "user_";
  const cookie = getCookie(`${prefix}user_info`);
  if (!cookie) return null;

  try {
    const binary = atob(cookie.replace(/^"|"$/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("쿠키 파싱 실패:", e);
    return null;
  }
};

export const refreshExp = (type: string = "user") => {
  let prefix = "user_";
  if (type == "admin") {
    prefix = "admin_";
  }
  const cookie = getCookie(`${prefix}refresh_exp`);
  if (!cookie) return false;
  return true;
};
