import { CardCatalogView } from '../catalog/CardCatalogView';

export function SearchPage() {
  const headingId = 'search-heading';

  return (
    <div className="flex flex-col gap-6">
      <h1 id={headingId} className="text-2xl font-semibold text-heading">
        Search
      </h1>
      <CardCatalogView headingId={headingId} />
    </div>
  );
}
