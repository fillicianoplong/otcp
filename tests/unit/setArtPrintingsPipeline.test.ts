import { describe, expect, it } from 'vitest';

import {
  buildSetArtPrintings,
  officialArtworksForPrinting,
  parseOfficialArtworkImages,
  parseOfficialPrintings,
  type OfficialPrintingRow,
} from '../../pipeline/setArtPrintings.ts';

function packRow(artwork: number, setCode: string, packName: string, rarity: string): string {
  return `
    <div class="t_row  pack_iid_${artwork}">
      <div class="inside">
        <div class="time">2020-01-01</div>
        <div class="card_img"><img id="update_list_card_image_${artwork}" alt="${artwork}" class=""></div>
        <div class="flex_1 contents " >
          <div class="card_number">
            ${setCode}
          </div>
          <div class="pack_name flex_1" >
            ${packName}
          </div>
        </div>
        <div class="icon rarity">
          <div class="lr_icon rid_5"><p>SE</p><span style="color:#e86d6d; ">
            ${rarity}
          </span></div>
        </div><!-- .icon -->
      </div>
    </div>`;
}

const page = `
  ${packRow(1, 'MFC-000', 'MAGICIAN&#039;S FORCE', 'Secret Rare')}
  ${packRow(4, 'LART-EN019', 'The Lost Art Promotion', 'Ultra Rare')}
  ${packRow(2, 'RA03-EN123', 'QUARTER CENTURY BONANZA', 'Platinum Secret Rare')}
  ${packRow(5, 'RA03-EN123', 'QUARTER CENTURY BONANZA', 'Quarter Century Secret Rare')}
  <script>
    $('#update_list_card_image_1').attr('src', '/yugiohdb/get_image.action?type=2&cid=4766&ciid=1&enc=abc');
    $('#update_list_card_image_4').attr('src', '/yugiohdb/get_image.action?type=2&cid=4766&ciid=4&enc=abc');
  </script>`;

describe('set art printings builder', () => {
  it('reads each printing and its artwork number from the card page', () => {
    expect(parseOfficialPrintings(page)).toEqual([
      { setCode: 'MFC-000', packName: "MAGICIAN'S FORCE", rarity: 'Secret Rare', artwork: 1 },
      {
        setCode: 'LART-EN019',
        packName: 'The Lost Art Promotion',
        rarity: 'Ultra Rare',
        artwork: 4,
      },
      {
        setCode: 'RA03-EN123',
        packName: 'QUARTER CENTURY BONANZA',
        rarity: 'Platinum Secret Rare',
        artwork: 2,
      },
      {
        setCode: 'RA03-EN123',
        packName: 'QUARTER CENTURY BONANZA',
        rarity: 'Quarter Century Secret Rare',
        artwork: 5,
      },
    ]);
    expect(parseOfficialArtworkImages(page).get(4)).toBe(
      '/yugiohdb/get_image.action?type=2&cid=4766&ciid=4&enc=abc',
    );
  });

  it('matches printings by set code, rarity, region code, and set name', () => {
    const rows: OfficialPrintingRow[] = [
      ...parseOfficialPrintings(page),
      { setCode: 'LOB-EN005', packName: 'LEGEND OF BLUE EYES', rarity: 'Ultra Rare', artwork: 2 },
      {
        setCode: 'GFP2-EN177',
        packName: 'GHOSTS FROM THE PAST: THE 2ND HAUNTING',
        rarity: 'Ghost Rare',
        artwork: 1,
      },
    ];
    const printing = (setCode: string, setName = '', setRarity = '') => ({
      setCode,
      setName,
      setRarity,
    });
    expect(officialArtworksForPrinting(rows, printing('MFC-000'))).toEqual([1]);
    expect(
      officialArtworksForPrinting(rows, printing('RA03-EN123', '', 'Quarter Century Secret Rare')),
    ).toEqual([5]);
    expect(officialArtworksForPrinting(rows, printing('RA03-EN123'))).toEqual([2, 5]);
    expect(officialArtworksForPrinting(rows, printing('LOB-E003'))).toEqual([2]);
    expect(
      officialArtworksForPrinting(
        rows,
        printing('GTP2-EN177', 'Ghosts From the Past: The 2nd Haunting'),
      ),
    ).toEqual([1]);
    expect(officialArtworksForPrinting(rows, printing('TYP1-EN002', 'Thank You Pack'))).toBe(
      undefined,
    );
  });

  it('builds the table from reviewed artworks and reports what it could not map', () => {
    const { file, report } = buildSetArtPrintings(
      [
        {
          id: 38033121,
          name: 'Dark Magician Girl',
          artIds: [38033121, 38033124],
          sets: [
            { setCode: 'MFC-000', setName: "Magician's Force", setRarity: 'Secret Rare' },
            {
              setCode: 'LART-EN019',
              setName: 'The Lost Art Promotion 2020 G',
              setRarity: 'Ultra Rare',
            },
            {
              setCode: 'RA03-EN123',
              setName: 'Quarter Century Bonanza',
              setRarity: 'Platinum Secret Rare',
            },
            { setCode: 'FL1-EN002', setName: 'Forbidden Legacy', setRarity: 'Secret Rare' },
            { setCode: 'TYP1-EN002', setName: 'Thank You Pack', setRarity: 'Common' },
          ],
        },
      ],
      new Map([[38033121, parseOfficialPrintings(page)]]),
      {
        artworks: {
          '38033121': {
            name: 'Dark Magician Girl',
            konamiId: 4766,
            ciid: { '1': 38033121, '2': null, '4': 38033124, '5': 38033124 },
          },
        },
        printings: { '38033121': { name: 'Dark Magician Girl', sets: { 'FL1-EN002': 38033124 } } },
      },
    );
    expect(file.sets).toEqual([
      "Magician's Force",
      'The Lost Art Promotion 2020 G',
      'Forbidden Legacy',
    ]);
    expect(file.cards['38033121']).toEqual([
      ['MFC-000', 0, 38033121, 0],
      ['LART-EN019', 1, 38033124, 1],
      ['FL1-EN002', 2, 38033124, 0],
    ]);
    expect(report.mapped).toBe(3);
    expect(report.unmapped.map((entry) => [entry.setCode, entry.reason])).toEqual([
      ['RA03-EN123', 'art-not-in-app'],
      ['TYP1-EN002', 'not-listed'],
    ]);
  });
});
