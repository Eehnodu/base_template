// 역할: 쿠키의 user_info 를 읽어 로그인 사용자를 전역 Context 로 제공

import { useEffect, useState, ReactNode } from "react";
import { parseUserInfo } from "@/hooks/common/getCookie";
import { AuthContext } from "@/hooks/common/useAuth";
import { UserInfo } from "@/types/user";

/**
 * 쿠키에 저장된 사용자 정보를 읽어서
 * 현재 로그인한 유저(user)와 로딩 상태(isLoading)를 전역 Context로 제공
 *
 * 서버 요청 없이 쿠키만 읽는다. 토큰 검증은 API 호출 시 서버가 하고, 여기서는 화면 표시용 정보만 든다.
 * isLoading 은 첫 렌더에서 user 가 null 인 순간 로그인 페이지로 튕기지 않게 하기 위한 것
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const web = parseUserInfo();
        setUser(web ?? null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
