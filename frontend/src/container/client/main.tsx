import GoogleLoginBtn from "@/hooks/auth/googleLogin";
import GoogleLoginPopup from "@/hooks/auth/googleLoginPopup";
import KakaoLoginBtn from "@/hooks/auth/kakaoLogin";

const ClientMain = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <GoogleLoginBtn />
      <GoogleLoginPopup />
      <KakaoLoginBtn />
    </div>
  );
};

export default ClientMain;