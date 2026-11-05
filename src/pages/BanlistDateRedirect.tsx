import { Navigate, useParams } from 'react-router';

import { formatDetailPathForBanlistDate } from '../format/formatCatalog.ts';

/** Legacy `/banlists/:effectiveDate` → matching playable format detail. */
export function BanlistDateRedirect() {
  const { effectiveDate } = useParams();
  return <Navigate to={formatDetailPathForBanlistDate(effectiveDate)} replace />;
}
