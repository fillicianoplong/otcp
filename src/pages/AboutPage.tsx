import notices from '../data/notices.json';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { TableToolbar } from '../ui/TableToolbar.tsx';
import { isTableColumnVisible, type TableColumn } from '../ui/tableColumns.ts';
import { useTableColumnVisibility } from '../ui/useTableColumnVisibility.ts';

type NoticeDependency = {
  name: string;
  version: string;
  license: string;
  link: string;
};

const dependencies = notices.dependencies as NoticeDependency[];

const YGOPRODECK_API_GUIDE_URL = 'https://ygoprodeck.com/api-guide/';

const NOTICE_COLUMNS: readonly TableColumn[] = [
  { id: 'package', label: 'Package', locked: true },
  { id: 'version', label: 'Version' },
  { id: 'license', label: 'License' },
  { id: 'link', label: 'Link' },
];

const externalLinkClassName =
  'text-heading underline decoration-border underline-offset-2 hover:decoration-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

export function AboutPage() {
  const [columnVisibility, setColumnVisibility] = useTableColumnVisibility(
    'about-notices',
    NOTICE_COLUMNS,
  );
  const showColumn = (id: string) =>
    isTableColumnVisible(
      NOTICE_COLUMNS.find((column) => column.id === id) ?? NOTICE_COLUMNS[0]!,
      columnVisibility,
    );

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-2">
        <PageTitle>About</PageTitle>
        <p className="text-base text-text">
          OTCP is a Yu-Gi-Oh! card reference for searching cards, formats, decks, and collections.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="about-notices-libraries-heading">
        <div className="space-y-2">
          <SectionHeader id="about-notices-libraries-heading" size="section">
            Notices
          </SectionHeader>
          <p className="text-base text-text">
            Third-party open-source libraries shipped with this app and their licenses.
          </p>
        </div>
        <TableToolbar
          columns={NOTICE_COLUMNS}
          visibility={columnVisibility}
          onVisibilityChange={setColumnVisibility}
        />
        <div className="min-w-0 overflow-x-auto rounded-md border border-border">
          <table className="min-w-full border-collapse text-left text-sm text-text">
            <thead className="border-b border-border bg-surface-2 text-heading">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Package
                </th>
                {showColumn('version') ? (
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Version
                  </th>
                ) : null}
                {showColumn('license') ? (
                  <th scope="col" className="px-3 py-2 font-semibold">
                    License
                  </th>
                ) : null}
                {showColumn('link') ? (
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Link
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dep) => (
                <tr key={dep.name} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 font-medium text-heading">{dep.name}</td>
                  {showColumn('version') ? <td className="px-3 py-2">{dep.version}</td> : null}
                  {showColumn('license') ? <td className="px-3 py-2">{dep.license}</td> : null}
                  {showColumn('link') ? (
                    <td className="px-3 py-2">
                      <a href={dep.link} className={externalLinkClassName}>
                        {dep.name}
                      </a>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="about-notices-card-data-heading">
        <SectionHeader id="about-notices-card-data-heading" size="section">
          Card data and images
        </SectionHeader>
        <p className="text-base text-text">
          Card data, market prices, and set information come from{' '}
          <a
            href={YGOPRODECK_API_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClassName}
          >
            YGOPRODeck
          </a>
          . Card images are from YGOPRODeck too; this site re-hosts them so pages load faster.
        </p>
        <p className="text-base text-text">
          Yu-Gi-Oh! card names, text, and artwork are owned by Konami. OTCP is an unofficial fan
          project and is not affiliated with or endorsed by Konami or YGOPRODeck.
        </p>
      </section>
    </PageContainer>
  );
}

/** @deprecated Route moved to AboutPage at /about. */
export const NoticesPage = AboutPage;
