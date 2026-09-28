import google from "@/assets/client/login/google.svg";
import { useAuth } from "@/hooks/common/useAuth";
import { parseUserInfo } from "@/hooks/common/getCookie";

interface GoogleLoginPopupProps {
  client_id?: string;
  redirect_uri?: string;
  scopeParam?: string;
  className?: string;
  text?: string;
}

const client_id_env = import.meta.env.VITE_APP_PUBLIC_GOOGLE_CLIENT_ID;
const redirect_uri_env = import.meta.env.VITE_APP_PUBLIC_GOOGLE_REDIRECT_URI;

const GoogleLoginPopup = ({
  client_id = client_id_env,
  redirect_uri = redirect_uri_env,
  scopeParam = "openid email profile",
  className = "",
  text = "Google 계정으로 로그인",
}: GoogleLoginPopupProps) => {
  const { setUser } = useAuth();

  const handlePopupLogin = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get("next") || "/";

    const stateObj = { next, isPopup: true };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const scopeQuery = `&scope=${encodeURIComponent(scopeParam)}`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(
      redirect_uri,
    )}&response_type=code&access_type=offline${scopeQuery}&state=${state}`;

    const width = 800;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    window.open(
      authUrl,
      "googleLoginPopup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
    );

    // 팝업창으로부터 메시지 수신 리스너
    const handleMessage = (event: MessageEvent) => {
      // 보안: 현재 도메인과 일치하는지 확인
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_LOGIN_SUCCESS") {
        const updatedUser = parseUserInfo();
        setUser(updatedUser);

        // 리스너 제거 및 페이지 이동
        window.removeEventListener("message", handleMessage);
        window.location.href = event.data.next || "/";
      }
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <button
      className={`flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-line bg-bg-card hover:bg-bg-hover transition-all active:scale-[0.98] ${className}`}
      onClick={handlePopupLogin}
    >
      <img src={google} alt="google login" className="w-4 h-4" />
      <span className="font-semibold text-text-main text-sm">{text}</span>
    </button>
  );
};

export default GoogleLoginPopup;