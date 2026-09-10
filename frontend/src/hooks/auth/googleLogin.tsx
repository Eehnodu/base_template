// 역할: Google 로그인 버튼(리다이렉트 방식). 인증 페이지로 이동시키고 콜백은 /google/login 이 받는다
import google from "@/assets/client/login/google.svg";

interface GoogleLoginBtnProps {
  client_id?: string;
  redirect_uri?: string;
  scopeParam?: string;
  className?: string;
}

const client_id_env = import.meta.env.VITE_APP_PUBLIC_GOOGLE_CLIENT_ID;
const redirect_uri_env = import.meta.env.VITE_APP_PUBLIC_GOOGLE_REDIRECT_URI;

const GoogleLoginBtn = ({
  client_id = client_id_env,
  redirect_uri = redirect_uri_env,
  scopeParam = "openid email profile",
  className = "",
}: GoogleLoginBtnProps) => {
  const handleClick = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get("next");

    // next 가 있으면 state 에 실어 콜백에서 그 경로로 복귀한다
    const stateObj = next ? { next, isPopup: true } : {};
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const scopeQuery = scopeParam ? `&scope=${encodeURIComponent(scopeParam)}` : "";

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(
      redirect_uri
    )}&response_type=code&access_type=offline${scopeQuery}&state=${state}`;
  };

  return (
    <button
      className={`flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm ${className}`}
      onClick={handleClick}
    >
      <img src={google} alt="google login" className="w-5 h-5" />
      <span className="font-semibold text-slate-700 text-sm">Google로 로그인</span>
    </button>
  );
};

export default GoogleLoginBtn;