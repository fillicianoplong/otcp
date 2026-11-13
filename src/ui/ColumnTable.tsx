import {
  tableBodyClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableWrapClass,
} from './classes.ts';
import { TableToolbar } from './TableToolbar.tsx';
import { visibleTableColumns, type TableColumn } from './tableColumns.ts';
import { useTableColumnVisibility } from './useTableColumnVisibility.ts';

/** A table with the shared column picker and an empty body. */
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
  const [visibility, setVisibility] = useTableColumnVisibility(tableId, columns);
  const shown = visibleTableColumns(columns, visibility);

  return (
    <div className="flex flex-col gap-2">
      <TableToolbar columns={columns} visibility={visibility} onVisibilityChange={setVisibility} />
      <div className={tableWrapClass}>
        <table aria-label={label} className={tableClass}>
          <thead className={tableHeadClass}>
            <tr>
              {shown.map((column) => (
                <th key={column.id} scope="col" className={tableHeadCellClass}>
                  {column.label}
                </th>
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
