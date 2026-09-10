// 역할: Kakao 콜백 처리. code 를 서버에 넘겨 세션 쿠키를 받고 Context 를 갱신한다
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../common/useAPI";
import { parseUserInfo } from "../common/getCookie";
import { useAuth } from "../common/useAuth";

interface KakaoProps {
  onSuccess?: (data) => void;
  onError?: (error) => void;
  autoRun?: boolean;
  redirectURL: string;
  apiURL: string;
}

/**
 * Kakao OAuth2 로그인 콜백 처리 컴포넌트
 *
 * URL 쿼리 파라미터의 `code` 값을 읽어 Kakao 인증을 처리하고,
 * 지정된 API 엔드포인트(`apiURL`)로 로그인 요청을 보낸 뒤
 * 성공 시 `redirectURL`로 이동합니다.
 *
 * @param onSuccess 로그인 성공 시 호출되는 콜백 (API 응답 데이터 전달)
 * @param onError 로그인 실패 시 호출되는 콜백 (에러 객체 전달)
 * @param autoRun 컴포넌트 마운트 시 자동 실행 여부 (기본값: true)
 * @param redirectURL 로그인 성공 후 이동할 경로
 * @param apiURL 카카오 로그인 API endpoint (예: "/auth/kakao")
 *
 * @example
 * <KakaoCallBack
 *   apiURL="auth/kakao"
 *   redirectURL="/dashboard"
 *   onSuccess={(data) => console.log("로그인 성공:", data)}
 *   onError={(err) => console.error("로그인 실패:", err)}
 * />
 */
const KakaoCallBack = ({
  onSuccess,
  onError,
  autoRun = true,
  redirectURL,
  apiURL,
}: KakaoProps) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const code = new URL(document.location.toString()).searchParams.get("code");
  const device_info = navigator.userAgent;

  const kakaoLogin = usePost(apiURL);
  const kakaoLoginAction = async () => {
    if (!code) return;
    try {
      const data = await kakaoLogin.mutateAsync({ code, device_info });
      const updatedUser = parseUserInfo();
      setUser(updatedUser);
      onSuccess?.(data);
      navigate(redirectURL, { replace: true });
    } catch (err) {
      onError?.(err);
    }
  };

  useEffect(() => {
    if (autoRun) kakaoLoginAction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return null;
};

export default KakaoCallBack;
