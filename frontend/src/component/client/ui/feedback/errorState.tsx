import { AlertCircle, RotateCw } from "lucide-react";

import Button from "@/component/client/ui/form/button";
import { ApiError } from "@/hooks/common/useAPI";

interface ErrorStateProps {
  /** 제목 (기본: "불러오지 못했습니다") */
  title?: string;
  /** 설명. 없으면 error 가 ApiError 일 때 서버 message 를 보여 준다 */
  description?: string;
  /** useGet 의 error 를 그대로 넘기면 된다 */
  error?: unknown;
  /** 다시 시도 (보통 useGet 의 refetch) */
  onRetry?: () => void;
  className?: string;
}

/**
 * 조회 실패 화면
 *
 * 목록 · 상세를 불러오지 못했을 때 그 영역 자리에 보여 준다.
 * 저장 · 삭제 실패는 이 컴포넌트가 아니라 Toast · Modal 로 알린다.
 *
 * @example
 * const { data, isLoading, error, refetch } = useGet<Notice[]>("api/notice", ["notice"]);
 * if (isLoading) return <PageSkeleton variant="table" />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 */
const ErrorState = ({
  title = "불러오지 못했습니다",
  description,
  error,
  onRetry,
  className = "",
}: ErrorStateProps) => {
  const message =
    description ??
    (error instanceof ApiError ? error.message : "잠시 후 다시 시도해 주세요.");

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-bg-card px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
        <AlertCircle className="h-5 w-5 text-error" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-main">{title}</p>
        <p className="text-xs text-text-sub select-text">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="sub2"
          size="sm"
          leftIcon={<RotateCw className="h-4 w-4" />}
          onClick={onRetry}
        >
          다시 시도
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
