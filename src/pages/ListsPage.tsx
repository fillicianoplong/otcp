import { ColumnTable } from '../ui/ColumnTable.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import type { TableColumn } from '../ui/tableColumns.ts';

const LIST_COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'qty', label: 'Qty' },
  { id: 'set', label: 'Set' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'purchase', label: 'Purchase price' },
  { id: 'market', label: 'Market price' },
];

export function ListsPage() {
  return (
    <PageContainer className="flex flex-col gap-4">
      <PageTitle>Lists</PageTitle>
      <ColumnTable
        tableId="lists"
        label="Lists"
        columns={LIST_COLUMNS}
        emptyLabel="No lists yet."
      />
    </PageContainer>
  );
}
