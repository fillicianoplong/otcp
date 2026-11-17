import { ColumnHeader } from './ColumnHeader.tsx';
import {
  tableBodyClass,
  tableCellClass,
  tableClass,
  tableHeadClass,
  tableWrapClass,
} from './classes.ts';
import { orderedVisibleTableColumns, type TableColumn } from './tableColumns.ts';
import { useTableColumnSetup } from './useTableColumnVisibility.ts';

/** A table with header menus for its columns and an empty body. */
export function ColumnTable({
  tableId,
  label,
  columns,
  emptyLabel,
}: {
  tableId: string;
  label: string;
  columns: readonly TableColumn[];
  emptyLabel: string;
}) {
  const { visibility, order, setVisibility, setOrder } = useTableColumnSetup(tableId, columns);
  const shown = orderedVisibleTableColumns(columns, visibility, order);

  return (
    <div className="flex flex-col gap-2">
      <div className={tableWrapClass}>
        <table aria-label={label} className={tableClass}>
          <thead className={tableHeadClass}>
            <tr>
              {shown.map((column) => (
                <ColumnHeader
                  key={column.id}
                  column={column}
                  columns={columns}
                  visibility={visibility}
                  order={order}
                  onVisibilityChange={setVisibility}
                  onOrderChange={setOrder}
                />
              ))}
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            <tr>
              <td colSpan={Math.max(shown.length, 1)} className={`${tableCellClass} text-text-2`}>
                {emptyLabel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
