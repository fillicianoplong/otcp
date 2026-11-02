import notices from '../data/notices.json';

type NoticeDependency = {
  name: string;
  version: string;
  license: string;
  link: string;
};

const dependencies = notices.dependencies as NoticeDependency[];

const YGOPRODECK_API_GUIDE_URL = 'https://ygoprodeck.com/api-guide/';

const externalLinkClassName =
  'text-heading underline decoration-border underline-offset-2 hover:decoration-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

export function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-heading">About</h1>
        <p className="text-base text-text">
          OTCP is a Yu-Gi-Oh! card reference for searching cards, formats, decks, and collections.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="about-notices-libraries-heading">
        <div className="space-y-2">
          <h2 id="about-notices-libraries-heading" className="text-lg font-semibold text-heading">
            Notices
          </h2>
          <p className="text-base text-text">
            Third-party open-source libraries shipped with this app and their licenses.
          </p>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full border-collapse text-left text-sm text-text">
            <thead className="border-b border-border bg-surface-2 text-heading">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Package
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Version
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  License
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dep) => (
                <tr key={dep.name} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 font-medium text-heading">{dep.name}</td>
                  <td className="px-3 py-2">{dep.version}</td>
                  <td className="px-3 py-2">{dep.license}</td>
                  <td className="px-3 py-2">
                    <a href={dep.link} className={externalLinkClassName}>
                      {dep.name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="about-notices-card-data-heading">
        <h2 id="about-notices-card-data-heading" className="text-lg font-semibold text-heading">
          Card data and images
        </h2>
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
    </div>
  );
}

/** @deprecated Route moved to AboutPage at /about. */
export const NoticesPage = AboutPage;
