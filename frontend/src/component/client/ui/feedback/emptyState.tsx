import { type ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** 예: "등록된 공지가 없습니다" */
  title: string;
  /** 다음 행동 안내. 예: "오른쪽 위 버튼으로 첫 공지를 등록해 보세요." */
  description?: string;
  /** 기본: Inbox 아이콘 */
  icon?: ReactNode;
  /** 예: <Button>공지 등록</Button> */
  action?: ReactNode;
  className?: string;
}

/**
 * 빈 상태 화면
 *
 * 조회는 성공했지만 보여 줄 데이터가 없을 때 쓴다.
 * 검색 결과가 없을 때는 title 을 "검색 결과가 없습니다" 처럼 상황에 맞게 바꾼다.
 * Table 은 자체 빈 상태("데이터가 없습니다")가 있으니 표 밖의 목록 · 카드 · 상세 영역에 쓴다.
 */
const EmptyState = ({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-sub text-text-sub">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-main">{title}</p>
        {description && <p className="text-xs text-text-sub">{description}</p>}
      </div>
      {action}
    </div>
  );
};

export default EmptyState;
