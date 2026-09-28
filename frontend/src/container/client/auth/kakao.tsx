import KakaoCallBack from "@/component/client/auth/kakaoCallback";
import Modal from "@/component/client/ui/feedback/modal";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Kakao = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [disabledOpen, setDisabledOpen] = useState(false);

  const handleConfirm = () => navigate("/");

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg">
        {/* 로그인 처리 중 스피너 */}
        {isLoading && (
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4" />
        )}
      </div>

      {/* 비활성 계정(403) 안내 */}
      <Modal
        open={disabledOpen}
        onClose={handleConfirm}
        title="현재 계정이 비활성화 상태입니다."
        description={
          <>
            로그인 권한이 필요하신 경우 관리자에게 문의해 주세요.
            <br />
            관리자 이메일 : example@email.com
          </>
        }
        buttonCount={1}
        primaryText="확인"
        onPrimary={handleConfirm}
        icon={
          <div className="bg-bg-sub p-3 rounded-full h-12 w-12 shrink-0 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-text-sub" />
          </div>
        }
      />

      <KakaoCallBack
        apiURL="api/auth/kakao"
        onSuccess={() => {}}
        redirectURL="/"
        onError={(error) => {
          setIsLoading(false);
          if (error.status === 403) setDisabledOpen(true);
        }}
      />
    </>
  );
};

export default Kakao;
