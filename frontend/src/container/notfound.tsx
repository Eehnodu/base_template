import { useNavigate } from "react-router-dom";
import Button from "@/component/admin/ui/form/button";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
      <div className="text-center flex flex-col items-center gap-6">
        <h1 className="text-[200px] font-extrabold text-text-main leading-none">
          404
        </h1>

        <h2 className="text-3xl font-bold text-text-main">
          페이지를 찾을 수 없어요
        </h2>

        <p className="text-text-sub max-w-md mx-auto">
          찾고 있는 페이지가 삭제되었거나 주소가 변경된 것 같아요.
        </p>

        <Button variant="main" onClick={() => navigate("/")}>
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
