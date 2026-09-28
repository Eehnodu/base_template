// src/context/AuthProvider.tsx

import { useEffect, useState, ReactNode } from "react";
import { parseUserInfo } from "@/hooks/common/getCookie";
import { AuthContext } from "@/hooks/common/useAuth";
import { UserInfo } from "@/types/user";

/**
 * 쿠키에 저장된 사용자 정보를 읽어서
 * 현재 로그인한 유저(user)와 로딩 상태(isLoading)를 전역 Context로 제공
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
