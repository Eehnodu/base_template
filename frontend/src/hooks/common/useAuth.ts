// 역할: AuthContext 정의와 접근 훅. Provider 밖에서 쓰면 바로 에러를 내 잘못된 트리 구성을 조기에 잡는다
import { AuthContextType } from "@/types/auth";
import { createContext, useContext } from "react";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
