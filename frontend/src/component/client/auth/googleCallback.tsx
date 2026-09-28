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

    let stateObj: { next?: string; isPopup?: boolean } = {};
    try {
      if (rawState) stateObj = JSON.parse(decodeURIComponent(rawState));
    } catch {
      // state 가 없거나 깨져 있으면 기본값(일반 로그인, 메인 이동)으로 진행한다
      stateObj = {};
    }

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
