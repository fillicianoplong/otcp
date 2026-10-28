import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from './site';

describe('site', () => {
  it('names the project OTCP', () => {
    expect(SITE_NAME).toBe('OTCP');
    expect(SITE_TITLE).toBe('OTCP — Open TCG Project');
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it('exposes the shell routes', () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(['Home', 'About']);
    expect(NAV_ITEMS.map((item) => item.to)).toEqual(['/', '/about']);
  });
});
