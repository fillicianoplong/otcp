import { describe, expect, it } from 'vitest';

import {
  buildFormatDetailFacts,
  poolNotIncludedFromExclusionNote,
  shortBanListLabel,
} from '../../src/format/formatDetailFacts.ts';
import { formatCatalogOptionAriaLabel } from '../../src/format/FormatCatalogNameLabel.tsx';
import { getFormatById, listFormats } from '../../src/format/formatCatalog.ts';

describe('poolNotIncludedFromExclusionNote', () => {
  it('strips the Excludes prefix for the Not included row', () => {
    expect(poolNotIncludedFromExclusionNote('Excludes Cybernetic Revolution')).toBe(
      'Cybernetic Revolution',
    );
  });
});

describe('buildFormatDetailFacts', () => {
  it('builds GOAT structured rows from catalog and snapshot data', () => {
    const format = getFormatById('goat');
    expect(format).toBeDefined();
    const facts = buildFormatDetailFacts(format!);
    expect(facts.description).toContain('Goat Control');
    expect(facts.description).not.toContain('April 2005');
    expect(facts.banList).toEqual({
      effectiveDate: '2005-04-01',
      listName: 'April 2005 TCG',
      historyPath: '/formats/goat',
    });
    expect(facts.cardPool).toEqual({
      cardsReleasedBy: '2005-08-31',
      latestSet: 'Dark Beginning 2',
      latestSetQuery: 'Dark Beginning 2',
      notIncluded: 'Cybernetic Revolution',
      notIncludedQuery: 'Cybernetic Revolution',
    });
    expect(facts.sourceLinks).toEqual([
      {
        label: 'GoatFormat.com',
        href: 'https://www.goatformat.com/cardpool.html',
      },
      {
        label: 'Ban list reference',
        href: 'https://yugipedia.com/wiki/April_2005_Lists',
      },
      {
        label: 'Format Library',
        href: 'https://formatlibrary.com/formats/goat',
      },
      {
        label: 'Goat Control',
        href: 'https://yugipedia.com/wiki/Goat_Control',
      },
    ]);
  });

  it('builds Edison structured rows', () => {
    const format = getFormatById('edison');
    expect(format).toBeDefined();
    const facts = buildFormatDetailFacts(format!);
    expect(facts.description).toContain('Jeff Jones');
    expect(facts.cardPool?.cardsReleasedBy).toBe('2010-04-16');
    expect(facts.cardPool?.latestSet).toBe('Duelist Pack: Kaiba');
    expect(facts.cardPool?.notIncluded).toBe('Duelist Revolution');
    expect(facts.banList?.listName).toBe('March 2010 TCG');
    expect(facts.sourceLinks[0]?.href).toContain('edisonformat.net');
  });

  it('omits pool rows for Advanced and keeps a Konami source link', () => {
    const format = getFormatById('advanced');
    expect(format).toBeDefined();
    const facts = buildFormatDetailFacts(format!);
    expect(facts.cardPool).toBeNull();
    expect(facts.banList?.effectiveDate).toBe('2026-02-02');
    expect(facts.sourceLinks[0]?.href).toContain('yugioh-card.com/en/limited');
  });

  it('builds Speed Duel structured rows from Konami sources', () => {
    const format = getFormatById('speed-duel');
    expect(format).toBeDefined();
    const facts = buildFormatDetailFacts(format!);
    expect(facts.description).toContain('January 2019');
    expect(facts.banList?.listName).toBe('July 2026 Speed Duel');
    expect(facts.banList?.effectiveDate).toBeUndefined();
    expect(facts.cardPool?.cardsReleasedBy).toBe('2024-12-13');
    expect(facts.cardPool?.latestSet).toBe('Battle City Finals');
    expect(facts.cardPool?.latestSetQuery).toBe('Speed Duel: Battle City Finals');
    expect(facts.cardPool?.notIncluded).toBe('No Speed Duel symbol');
    expect(facts.cardPool?.notIncludedQuery).toBeNull();
    expect(facts.sourceLinks).toHaveLength(2);
    expect(facts.sourceLinks[0]?.href).toContain('speed-duel-forbidden-limited-list');
    expect(facts.sourceLinks[1]?.href).toContain('Speed_Duel_Guide');
  });
});

describe('shortBanListLabel', () => {
  it('keeps month, year, and region for every format', () => {
    const labelPattern =
      /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4} (TCG|OCG|Speed Duel|Genesys)$/;

    expect(shortBanListLabel('April 2005 TCG Forbidden/Limited List')).toBe('April 2005 TCG');
    expect(shortBanListLabel('March 2011 Lists (TCG)')).toBe('March 2011 TCG');
    expect(shortBanListLabel('current TCG Forbidden & Limited List', '2026-02-02')).toBe(
      'February 2026 TCG',
    );

    for (const format of listFormats()) {
      const facts = buildFormatDetailFacts(format);
      const label = facts.banList?.listName ?? facts.genesysDetail?.banListName;
      expect(label, format.id).toMatch(labelPattern);
    }
  });
});

describe('formatCatalogOptionAriaLabel', () => {
  it('uses the format name only', () => {
    expect(formatCatalogOptionAriaLabel('Advanced')).toBe('Advanced');
  });
});
