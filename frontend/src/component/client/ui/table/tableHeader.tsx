import type { Column } from "./table";

interface TableHeaderProps {
  columns: Column[];
  rowSizeClass: string;
}

const TableHeader = ({ columns, rowSizeClass }: TableHeaderProps) => {
  return (
    <thead className="bg-bg-sub border-t border-b border-line">
      <tr className={rowSizeClass}>
        {columns.map((col) => {
          const alignClass =
            col.align === "center"
              ? "text-center justify-center"
              : col.align === "right"
                ? "text-right justify-end"
                : "text-left justify-start";

          return (
            <th
              key={col.key}
              className="px-3 py-2 font-medium text-text-sub border-b border-line"
              style={col.width ? { width: col.width } : undefined}
            >
              <div className={`flex items-center gap-1 ${alignClass}`}>
                <span>{col.header}</span>
                {col.icon && (
                  <span className="text-text-sub">{col.icon}</span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHeader;
