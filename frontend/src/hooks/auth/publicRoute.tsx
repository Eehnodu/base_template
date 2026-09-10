// 역할: 비로그인 전용 라우트 가드. 이미 로그인한 사용자는 redirectTo 로 보낸다
import { Navigate } from "react-router-dom";
import { useAuth } from "../common/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({
  children,
  redirectTo = "/",
}: PublicRouteProps) => {
  const { user, isLoading } = useAuth();

  // 로딩 중에는 빈 화면을 유지해 로그인 폼이 잠깐 보였다 사라지는 깜빡임을 막는다
  if (isLoading) {
    return <div className="w-full h-screen bg-white" />;
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};