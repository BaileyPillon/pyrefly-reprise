/**
 * **The FFX party-stature table** (`src/data/ffx/party-stature.ts`, r3941-heights; FFX only).
 *
 * The table is the one place the heroes' relative heights live, so these tests pin what has to stay true when someone refines a
 * number: all seven heroes are there and no one else, Tidus is exactly 1 (his size is the party's shared height, untouched), the
 * ratios are the ones the research note prints, each is the model-unit top over Tidus's while the basis is the bind pose, the wiki
 * column is only for comparison, and an id that is not one of the seven is 1.
 *
 * Game case: FFX only [AGENTS.md rule 14]. The table is not read for FFX-2 (see `tests/unit/engine/party-stature.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CHARACTER_IDS } from '../../src/data/ffx/ids.ts';
import { FFX_PARTY_STATURE, FFX_STATURE_BASIS, TIDUS_TOP, ffxPartyStature } from '../../src/data/ffx/party-stature.ts';

/** The brief's table (D:/Tools/rea/FINDINGS.md section H, ratios to Tidus's silhouette top), copied in on purpose: the table must still say this. */
const DATAMINED = { tidus: 1.0, yuna: 0.911, auron: 1.062, kimahri: 1.211, wakka: 1.201, lulu: 0.99, rikku: 0.911 } as const;
/** The FF Wiki's heights in cm (`research/visual-bible.md` section 0.4, single source; Lulu barefoot). */
const WIKI_CM = { tidus: 175, yuna: 161, auron: 183, kimahri: 204, wakka: 188, lulu: 167, rikku: 157 } as const;

describe('FFX party stature: the table', () => {
  it('has the seven heroes and no one else', () => {
    expect(Object.keys(FFX_PARTY_STATURE).sort()).toEqual([...CHARACTER_IDS].sort());
    expect(CHARACTER_IDS).toHaveLength(7);
  });

  it("is the datamined ratios, to the digit, with Tidus at exactly 1 so his size is the party's shared height", () => {
    for (const id of CHARACTER_IDS) expect(FFX_PARTY_STATURE[id].ratio, id).toBe(DATAMINED[id]);
    expect(FFX_PARTY_STATURE.tidus.ratio).toBe(1);
    expect(ffxPartyStature('tidus')).toBe(1);
  });

  it('keeps every ratio in a sane band: nobody is half a head off the wiki, nobody is a different species', () => {
    for (const id of CHARACTER_IDS) {
      const { ratio, wiki } = FFX_PARTY_STATURE[id];
      expect(ratio, id).toBeGreaterThan(0.85);
      expect(ratio, id).toBeLessThan(1.3);
      // Wakka is the known outlier (his hair is in the model's top, not in the wiki's body height): 0.13 over.
      expect(Math.abs(ratio - wiki), id).toBeLessThan(id === 'wakka' ? 0.13 : 0.05);
    }
  });

  it("is the model-unit top over Tidus's while the basis is the bind pose (a typo in either number fails here)", () => {
    expect(FFX_STATURE_BASIS).toBe('bind-pose');
    expect(FFX_PARTY_STATURE.tidus.top).toBe(TIDUS_TOP);
    for (const id of CHARACTER_IDS) expect(Math.abs(FFX_PARTY_STATURE[id].top / TIDUS_TOP - FFX_PARTY_STATURE[id].ratio), id).toBeLessThan(0.0006);
  });

  it("keeps the wiki column as the wiki's centimetres over Tidus's 175, comparison only", () => {
    for (const id of CHARACTER_IDS) expect(Math.abs(WIKI_CM[id] / WIKI_CM.tidus - FFX_PARTY_STATURE[id].wiki), id).toBeLessThan(0.0006);
  });

  it('looks a hero up by id and gives 1 to anyone else, without throwing', () => {
    expect(ffxPartyStature('kimahri')).toBe(1.211);
    expect(ffxPartyStature('wakka')).toBe(1.201);
    for (const id of ['seymour', 'paine', 'valefor', 'yojimbo', '', 'constructor', '__proto__', 'toString']) expect(ffxPartyStature(id), id).toBe(1);
  });

  it('is the research note\'s table: every applied ratio in section 3 reads as the table says', () => {
    const note = readFileSync(new URL('../../research/ffx-character-heights.md', import.meta.url), 'utf8');
    const section = note.slice(note.indexOf('## 3. The numbers'), note.indexOf('## 4.'));
    for (const id of CHARACTER_IDS) {
      const name = id[0]!.toUpperCase() + id.slice(1);
      const row = section.split('\n').find((l) => l.startsWith(`| ${name} |`));
      expect(row, `${name} row`).toBeDefined();
      const cells = row!.split('|').map((c) => c.trim());
      // | Name | model | top | ratio | applied |
      expect(Number(cells[3]), `${name} top`).toBe(FFX_PARTY_STATURE[id].top);
      expect(Number(cells[4]), `${name} ratio`).toBe(FFX_PARTY_STATURE[id].ratio);
      expect(Number(cells[5]), `${name} applied`).toBe(FFX_PARTY_STATURE[id].ratio);
    }
  });
});
