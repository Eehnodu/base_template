import TableHeader from "./tableHeader";
import TableBody from "./tableBody";

export type Size = "sm" | "md" | "lg";
export type Align = "left" | "center" | "right";

// 행 데이터는 화면마다 모양이 달라 필드를 자유롭게 읽을 수 있게 둔다
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRow = Record<string, any>;

export interface Column {
  key: string;
  header: string;
  width?: string;
  align?: Align;
  render?: (row: TableRow) => React.ReactNode;
  icon?: React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: TableRow[];
  size?: Size;
  striped?: boolean;
  className?: string;
  onRowClick?: (row: TableRow) => void;
  rowCount?: number;
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
