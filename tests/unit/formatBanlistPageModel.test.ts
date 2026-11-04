import { describe, expect, it } from 'vitest';

import sampleDataset from '../../public/data/datasets/sample-dev.json';
import { buildFormatBanlistPageModel } from '../../src/format/formatBanlistPageModel.ts';
import { getFormatById } from '../../src/format/formatCatalog.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const sampleCards = sampleDataset.cards as YugiohCard[];

describe('buildFormatBanlistPageModel', () => {
  it('shows Speed Duel pool preview tiles when no restricted cards are in the sample catalog', () => {
    const format = getFormatById('speed-duel');
    expect(format).toBeDefined();
    const model = buildFormatBanlistPageModel(format!, sampleCards);
    expect(model.sections.every((section) => section.cards.length === 0)).toBe(true);
    expect(model.poolPreview?.heading).toBe('Speed Duel pool');
    expect(model.poolPreview?.cards.length).toBeGreaterThan(0);
  });
});
