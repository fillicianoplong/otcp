import { describe, expect, it, vi } from 'vitest';

import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../pipeline/constants.ts';
import { logYgoprodeckDropCounts } from '../../pipeline/logDropCounts.ts';
import { mapYgoprodeckResponse } from '../../pipeline/mapYgoprodeck.ts';
import { isYgoprodeckPlaceholderRow } from '../../pipeline/placeholderFilter.ts';
import type { YgoApiCard } from '../../pipeline/ygoprodeckTypes.ts';
import placeholderFixture from '../fixtures/pipeline/ygoprodeck-placeholder-and-no-set.json';

describe('placeholder catalog filter', () => {
  it('drops the "???" placeholder row', () => {
    const placeholder = placeholderFixture.data[0] as YgoApiCard;
    expect(isYgoprodeckPlaceholderRow(placeholder)).toBe(true);
  });

  it('keeps a real card with no sets', () => {
    const noSetCard = placeholderFixture.data[1] as YgoApiCard;
    expect(isYgoprodeckPlaceholderRow(noSetCard)).toBe(false);

    const { cards, dropped } = mapYgoprodeckResponse(
      placeholderFixture.data as YgoApiCard[],
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(dropped.placeholder).toBe(1);
    expect(dropped.unsupported).toBe(0);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.name).toBe('Obelisk the Tormentor');
    expect(cards[0]?.sets).toEqual([]);
  });

  it('logs how many rows were dropped and why', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logYgoprodeckDropCounts({ unsupported: 0, placeholder: 1 });

    expect(logSpy).toHaveBeenCalledWith(
      'DataPipeline: dropped 1 placeholder row(s) (denylist or placeholder profile text)',
    );

    logSpy.mockRestore();
  });
});
