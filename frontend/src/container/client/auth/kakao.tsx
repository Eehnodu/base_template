// 역할: Kakao OAuth 리다이렉트 콜백 페이지. 코드 교환은 KakaoCallBack 에 맡기고 로딩·차단 안내만 그린다
import KakaoCallBack from "@/hooks/auth/kakaoCallback";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Kakao = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ismodal, setismodal] = useState<boolean>(false);
  const openmodal = () => {
    setismodal(true);
  };
  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
        {/* 로딩 스피너 */}
        {isLoading && (
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
        )}
        {ismodal && (
          <>
            <div className="fixed inset-0 flex items-center justify-center z-[49] bg-[#070707]/60 backdrop-blur-sm">
              <div className="w-[300px] h-[220px] bg-white py-5 border border-[#E5E7EB] rounded-2xl flex flex-col justify-around items-center">
                <div className="bg-[#F5F5F5] p-3 rounded-full">
                  <AlertTriangle className="text-[#737373]" />
                </div>

                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[#171717] text-[16px] font-medium">
                    현재 계정이 비활성화 상태입니다.
                  </span>
                  <div className="flex flex-col text-center">
                    <span className="text-[#737373] text-xs">
                      로그인 권한이 필요하신 경우 관리자에게 문의해 주세요.
                    </span>
                    <span className="text-[#737373] text-xs">
                      관리자 이메일 : example@email.com
                    </span>
                  </div>
                </div>

                <div className="flex flex-row w-full justify-center gap-2 font-medium text-sm">
                  <button
                    className="w-32 bg-gradient-to-r from-[#3730A5] to-[#6366F1] text-white rounded-xl py-2 px-4"
                    onClick={() => navigate("/")}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <KakaoCallBack
        apiURL="api/auth/kakao"
        onSuccess={() => {}}
        redirectURL="/"
        onError={(error) => {
          setIsLoading(false);
          // 403 은 비활성(active=false) 계정. 나머지 오류는 스피너만 멈춘다
          if (error.status == 403) openmodal();
        }}
      />
    </>
  );
};

export default Kakao;
