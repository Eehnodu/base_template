// 역할: 사용자 화면 공통 레이아웃. 로그인 상태일 때만 /me 를 조회해 하위 라우트에 Outlet context 로 전달
import { useGet } from "@/hooks/common/useAPI";
import { UserDetail } from "@/types/user";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/common/useAuth";

const ClientLayOut = () => {
  const { user, isLoading } = useAuth();
  // enabled 를 user 존재로 묶어 비로그인 상태에서 401 → refresh 시도가 반복되지 않게 한다
  const { data: meData } = useGet<UserDetail>("api/user/me", ["me"], !!user);

  if (isLoading) {
    return (
      <div className="w-full h-[100svh] flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gray-100 relative">
        <main className="flex w-full h-full flex-col">
          <Outlet context={{ user, meData }} />
        </main>
      </div>
    </>
  );
};
export default ClientLayOut;
