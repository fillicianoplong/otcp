import { Link } from 'react-router';

import {
  formatDetailPath,
  listFormatsNewestFirst,
  type FormatDefinition,
} from '../format/formatCatalog.ts';
import { writeFormatPreference } from '../format/formatPreference.ts';

function FormatCatalogRow({ format }: { format: FormatDefinition }) {
  const selectFormat = () => {
    writeFormatPreference(format.id);
  };

  return (
    <li>
      <Link
        to={formatDetailPath(format.id)}
        onClick={selectFormat}
        className="flex min-h-[var(--touch-min)] items-center rounded-md border border-border bg-surface px-4 py-3 text-base font-semibold text-heading transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
      >
        {format.name}
      </Link>
    </li>
  );
}

export function FormatsPage() {
  const formats = listFormatsNewestFirst();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-heading">Formats</h1>
        <p className="text-sm text-text-2">Open a format to see its ban list and card pool.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {formats.map((format) => (
          <FormatCatalogRow key={format.id} format={format} />
        ))}
      </ul>
    </div>
  );
}
