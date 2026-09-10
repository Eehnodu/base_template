// 역할: 서버가 심은 JS 가독 쿠키(user_info, refresh_exp) 파싱
const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]*)`));
  return match ? match[2].trim() : undefined;
};

export const parseUserInfo = (authType: "user" | "admin" = "user") => {
  const prefix = authType === "admin" ? "admin_" : "user_";
  const cookie = getCookie(`${prefix}user_info`);
  if (!cookie) return null;

  try {
    // 서버가 JSON → base64 로 넣은 값. atob 결과는 latin1 바이트열이라
    // TextDecoder 로 UTF-8 복원해야 한글 닉네임이 깨지지 않는다
    const binary = atob(cookie.replace(/^"|"$/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("쿠키 파싱 실패:", e);
    return null;
  }
};

// refresh_exp 쿠키는 refresh 토큰과 같은 수명. 존재 여부만으로 "아직 갱신 가능한 세션인지" 판단한다
export const refreshExp = (type: string = "user") => {
  let prefix = "user_";
  if (type == "admin") {
    prefix = "admin_";
  }
  const cookie = getCookie(`${prefix}refresh_exp`);
  if (!cookie) return false;
  return true;
};
