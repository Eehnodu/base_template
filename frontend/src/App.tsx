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
