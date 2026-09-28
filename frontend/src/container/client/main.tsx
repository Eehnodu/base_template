import GoogleLoginBtn from "@/component/client/auth/googleLogin";
import GoogleLoginPopup from "@/component/client/auth/googleLoginPopup";
import KakaoLoginBtn from "@/component/client/auth/kakaoLogin";

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