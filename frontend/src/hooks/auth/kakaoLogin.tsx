// 역할: Kakao 로그인 버튼. 카카오 인증 페이지로 리다이렉트
import React from "react";
import kakao from "@/assets/client/login/kakao.svg";

interface KakaoLoginBtnProps {
  client_id?: string;
  redirect_uri?: string;
  scopeParam?: string;
  className?: string;
  children?: React.ReactNode;
}

const client_id_env = import.meta.env.VITE_APP_PUBLIC_KAKAO_REST_API_KEY;
const redirect_uri_env = import.meta.env.VITE_APP_PUBLIC_KAKAO_REDIRECT_URI;

/**
 * Kakao OAuth2 로그인 버튼 컴포넌트
 *
 * 카카오 인증 페이지(`https://kauth.kakao.com/oauth/authorize`)로
 * 리다이렉트 시켜주는 버튼입니다.
 *
 * @param client_id 카카오 REST API 키 (Kakao Developers에서 발급)
 * @param redirect_uri 로그인 후 리다이렉트될 URI (Kakao Developers에 등록 필요)
 * @param scopeParam 요청할 권한 스코프 (예: "profile_nickname,account_email")
 * @param className 버튼에 적용할 CSS 클래스
 * @param children 버튼 안에 표시할 내용 (텍스트/아이콘 등)
 *
 * @example
 * <KakaoLoginBtn
 *   client_id="카카오RESTAPI키"
 *   redirect_uri="http://localhost:3000/auth/kakao/callback"
 *   scopeParam="profile_nickname,account_email"
 *   className="bg-yellow-400 text-black px-4 py-2 rounded"
 * >
 *   카카오로 로그인
 * </KakaoLoginBtn>
 */
const KakaoLoginBtn = ({
  client_id = client_id_env,
  redirect_uri = redirect_uri_env,
  scopeParam,
}: KakaoLoginBtnProps) => {
  const kakaoAuth = () => {
    const scopeQuery = scopeParam ? `&scope=${scopeParam}` : "";
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code${scopeQuery}&lang=ko`;
    window.location.href = url;
  };

  return (
    <button
      className="relative bg-[#FEE500] flex flex-row w-[300px] py-3 rounded-lg items-center justify-center text-black font-semibold"
      onClick={() => kakaoAuth()}
    >
      <img src={kakao} alt="kakao login" className="absolute w-5 h-5 left-10" />
      <span>카카오 로그인</span>{" "}
    </button>
  );
};

export default KakaoLoginBtn;
