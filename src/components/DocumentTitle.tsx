import { useEffect } from 'react';
import { SITE_NAME, SITE_TITLE } from '../site';

export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title === SITE_NAME ? SITE_TITLE : `${title} — ${SITE_NAME}`;
  }, [title]);

  return null;
}
