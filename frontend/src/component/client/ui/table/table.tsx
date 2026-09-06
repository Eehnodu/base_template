// 역할: 컬럼 정의 기반 테이블. rowCount 를 주면 빈 행을 채워 페이지마다 높이가 일정하게 유지된다
import TableHeader from "./tableHeader";
import TableBody from "./tableBody";

export type Size = "sm" | "md" | "lg";
export type Align = "left" | "center" | "right";

export interface Column {
  key: string;
  header: string;
  width?: string;
  align?: Align;
  render?: (row: any) => React.ReactNode;
  icon?: React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  size?: Size;
  striped?: boolean;
  className?: string;
  onRowClick?: (row: any) => void;
  rowCount?: number; // 고정 행 수. 데이터가 적으면 빈 행으로 채운다
  icon?: React.ReactNode;
}

const sizeStyles: Record<Size, string> = {
  sm: "text-xs h-8",
  md: "text-sm h-10",
  lg: "text-base h-12",
};

const Table = ({
  columns,
  data,
  size = "md",
  striped = false,
  className = "",
  onRowClick,
  rowCount,
}: TableProps) => {
  const rowSizeClass = sizeStyles[size];
  const isEmpty = data.length === 0;

  return (
    <div className={`relative w-full overflow-x-auto flex flex-col ${className}`}>
      <table className="table-fixed w-full border-collapse overflow-hidden bg-bg-card rounded-b-xl">
        <TableHeader columns={columns} rowSizeClass={rowSizeClass} />
        <TableBody
          columns={columns}
          data={data}
          rowSizeClass={rowSizeClass}
          striped={striped}
          rowCount={rowCount}
          onRowClick={onRowClick}
        />
      </table>

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-text-sub">데이터가 없습니다.</span>
        </div>
      )}
    </div>
  );
};

export default Table;
