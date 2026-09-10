// 역할: Google 콜백 처리. URL 의 code 를 서버에 넘겨 쿠키 세션을 만들고, 팝업이면 부모 창에 알린 뒤 닫는다
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { baseURL } from "@/hooks/common/useAPI";

interface GoogleCallbackProps {
  apiURL: string;
  redirectURL: string;
  onSuccess: () => void;
  onError: (error: { status?: number; message?: string }) => void;
}

const GoogleCallback = ({ apiURL, redirectURL, onSuccess, onError }: GoogleCallbackProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const rawState = params.get("state");

    if (!code) {
      onError({ message: "code 없음" });
      return;
    }

    // state 에는 로그인 후 돌아갈 next 와 팝업 여부를 JSON 으로 실어 보냈다. 파싱 실패는 무시하고 기본 경로로
    let stateObj: { next?: string; isPopup?: boolean } = {};
    try {
      if (rawState) stateObj = JSON.parse(decodeURIComponent(rawState));
    } catch {}

    const exchange = async () => {
      try {
        const response = await fetch(`${baseURL}/${apiURL}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          onError({ status: response.status });
          return;
        }

        // 팝업 모드: 부모 창에 성공을 알리고 스스로 닫는다. origin 을 명시해 다른 사이트가 메시지를 못 받게 한다
        if (stateObj.isPopup && window.opener) {
          window.opener.postMessage({ type: "GOOGLE_LOGIN_SUCCESS", next: stateObj.next }, window.location.origin);
          window.close();
        } else {
          onSuccess();
          navigate(stateObj.next || redirectURL);
        }
      } catch {
        onError({ message: "네트워크 오류" });
      }
    };

    exchange();
  }, []);

  return null;
};

export default GoogleCallback;
