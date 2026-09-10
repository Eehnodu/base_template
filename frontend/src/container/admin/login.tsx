// 역할: 관리자 로그인 페이지. 이미 세션이 있으면 대시보드로 보낸다
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePost, useRefreshToken } from "@/hooks/common/useAPI";
import { parseUserInfo, refreshExp } from "@/hooks/common/getCookie";
import { LoginRequest, LoginResponse } from "@/types/admin/login";
import LoginVisual from "@/component/admin/layout/login/loginVisual";
import LoginForm from "@/component/admin/layout/login/loginForm";
import LoginErrorModal from "@/component/admin/modal/loginErrorModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const user = parseUserInfo("admin");
  const isRefresh = refreshExp("admin");
  const refresh = useRefreshToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const loginMutation = usePost<LoginRequest, LoginResponse>("api/auth/login");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password, type: "admin" },
      {
        onSuccess: () => {
          navigate("/admin");
        },
        onError: () => {
          setErrorModal(true);
        },
      }
    );
  };

  // 로그인 쿠키가 살아 있는 상태로 다시 들어오면 갱신 후 바로 /admin 으로
  useEffect(() => {
    if (user && isRefresh) {
      refresh()
        .then(() => {
          window.location.reload();
        })
        .catch(() => { });
      navigate("/admin");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-bg flex font-sans overflow-hidden text-text-main">
      <LoginVisual />
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPw={showPw}
        setShowPw={setShowPw}
        onSubmit={onSubmit}
      />

      <LoginErrorModal open={errorModal} onClose={() => setErrorModal(false)} />
    </div>
  );
};

export default LoginPage;