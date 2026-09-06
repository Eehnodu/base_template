// 역할: 테이블 본문. 데이터 행과 rowCount 를 맞추기 위한 빈 행을 그린다
import type { Column } from "./table";

interface TableBodyProps {
  columns: Column[];
  data: any[];
  rowSizeClass: string;
  striped: boolean;
  rowCount?: number;
  onRowClick?: (row: any) => void;
}

const TableBody = ({
  columns,
  data,
  rowSizeClass,
  striped,
  rowCount,
  onRowClick,
}: TableBodyProps) => {
  // rowCount 보다 데이터가 적으면 빈 행을 채워 페이지 전환 시 표 높이가 흔들리지 않게 한다
  const target = rowCount && rowCount > 0 ? rowCount : data.length;
  const emptyCount = Math.max(0, target - data.length);

  return (
    <tbody>
      {data.map((row, index) => {
        const stripedClass =
          striped && index % 2 === 1 ? "bg-bg-sub" : "bg-bg-card";
        return (
          <tr
            key={`row-${index}`}
            className={`${rowSizeClass} ${stripedClass}`}
            onClick={() => {
              if (onRowClick) onRowClick(row);
            }}
          >
            {columns.map((col) => {
              const alignClass =
                col.align === "center"
                  ? "text-center"
                  : col.align === "right"
                    ? "text-right"
                    : "text-left";

              return (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 align-middle text-text-main ${alignClass} ${index < data.length - 1 ? "border-b border-line" : ""}`}
                >
                  {col.render ? col.render(row) : ((row as any)[col.key] ?? "")}
                </td>
              );
            })}
          </tr>
        );
      })}

      {emptyCount > 0 &&
        Array.from({ length: emptyCount }).map((_, i) => (
          <tr key={`empty-${i}`} className={rowSizeClass}>
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-2.5 bg-bg-card">
                &nbsp;
              </td>
            ))}
          </tr>
        ))}
    </tbody>
  );
};

export default TableBody;
