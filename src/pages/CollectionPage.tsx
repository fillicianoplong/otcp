import { ColumnTable } from '../ui/ColumnTable.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import type { TableColumn } from '../ui/tableColumns.ts';

const COLLECTION_COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'qty', label: 'Qty' },
  { id: 'set', label: 'Set' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'condition', label: 'Condition' },
  { id: 'purchase', label: 'Purchase price' },
  { id: 'market', label: 'Market price' },
];

export function CollectionPage() {
  return (
    <PageContainer className="flex flex-col gap-4">
      <PageTitle>Collection</PageTitle>
      <ColumnTable
        tableId="collection"
        label="Collection"
        columns={COLLECTION_COLUMNS}
        emptyLabel="Nothing in your collection yet."
      />
    </PageContainer>
  );
}
