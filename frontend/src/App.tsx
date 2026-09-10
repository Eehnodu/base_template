// 역할: 루트 라우터. QueryClient → AuthProvider → Router 순으로 감싼다
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./context/AuthProvider";
import NotFoundPage from "./container/notfound";
import AdminLogin from "./container/admin/login";
import AdminLayout from "./container/admin/layout";
import AdminMain from "./container/admin/main";
import AdminGroup from "./container/admin/group";
import ClientLayOut from "./container/client/layout";
import ClientMain from "./container/client/main";
import Google from "./container/client/auth/google";
import Kakao from "./container/client/auth/kakao";

// QueryClient 는 앱 전체에서 하나만 쓴다. 컴포넌트 안에서 만들면 리렌더마다 캐시가 새로 생긴다
const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<ClientLayOut />}>
                <Route path="/" element={<ClientMain />} />
                <Route path="/kakao/login" element={<Kakao />} />
                <Route path="/google/login" element={<Google />} />
              </Route>

              {/* 관리자 로그인은 인증 가드(AdminLayout) 밖에 둔다. 나머지 /admin/* 은 레이아웃이 세션을 확인 */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminMain />} />
                <Route path="/admin/group" element={<AdminGroup />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
