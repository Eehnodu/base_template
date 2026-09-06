// 역할: 테이블 본문. 데이터 행과 rowCount 를 맞추기 위한 빈 행을 그린다
import type { Column } from "./table";

/**
 * TableBody 컴포넌트 Props
 *
 * @property columns       테이블 컬럼 정보 배열
 * @property data          렌더링할 실제 데이터 배열
 * @property rowSizeClass  테이블 행 높이/텍스트 크기 클래스 (Table 컴포넌트에서 계산해 전달)
 * @property striped       줄무늬(지브라) 스타일 적용 여부
 * @property rowCount      고정 행 수. 데이터가 적으면 빈 행으로 채운다
 * @property onRowClick    각 행 클릭 시 호출되는 콜백
 */
interface TableBodyProps {
  columns: Column[];
  data: any[];
  rowSizeClass: string;
  striped: boolean;
  rowCount?: number;
  onRowClick?: (row: any) => void;
}

/**
 * TableBody 컴포넌트
 *
 * - 컬럼 정의(columns)에 따라 각 셀을 렌더링
 * - render 속성이 있는 경우 커스텀 렌더링 적용
 * - striped 옵션이 true면 홀수 행에 배경색 적용
 * - onRowClick이 전달되면 각 행 클릭 가능
 *
 * @example 기본 사용
 * ```tsx
 * <TableBody
 *   columns={columns}
 *   data={rows}
 *   rowSizeClass="text-sm h-10"
 *   striped
 * />
 * ```
 */
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
                  className={`px-3 py-2.5 align-middle ${alignClass} ${index < data.length - 1 ? "border-b border-line" : ""}`}
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
