/**
 * **The FFX party-stature table** (`src/data/ffx/party-stature.ts`, r3941-heights; FFX only).
 *
 * The table is the one place the heroes' relative heights live, so these tests pin what has to stay true when someone refines a
 * number: all seven heroes are there and no one else, Tidus is exactly 1 (his size is the party's shared height, untouched), the
 * ratios are the ones the research note prints, each datamined ratio is the model-unit top over Tidus's while the basis is the bind
 * pose, Kimahri alone is applied at the factor that puts his body (not his spear tip) at his datamined height, the wiki column is
 * only for comparison, and an id that is not one of the seven is 1.
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
/** How much of each approved idle painting (feet row to top row) the hero's own body fills: Tidus's top row is his sword pommel and Kimahri's his spear tip (research note section 5a, measured on the approved idles). */
const BODY_OF_PAINTING = { tidus: 0.9749, kimahri: 0.9052 } as const;
/** The datamined ratio of a row: what the lane measured, whatever the build applies. */
const datamined = (id: (typeof CHARACTER_IDS)[number]): number => FFX_PARTY_STATURE[id].datamined ?? FFX_PARTY_STATURE[id].ratio;

describe('FFX party stature: the table', () => {
  it('has the seven heroes and no one else', () => {
    expect(Object.keys(FFX_PARTY_STATURE).sort()).toEqual([...CHARACTER_IDS].sort());
    expect(CHARACTER_IDS).toHaveLength(7);
  });

  // While the basis is the bind pose the table must still be the brief's datamined numbers. A refinement that changes the basis (the live battle-stance
  // readings from PCSX2) changes the table, `FFX_STATURE_BASIS` and the note's table together, and this one pin steps aside; every other test below stays.
  it.runIf(FFX_STATURE_BASIS === 'bind-pose')("is the datamined ratios, to the digit, while the basis is the bind pose", () => {
    for (const id of CHARACTER_IDS) expect(datamined(id), id).toBe(DATAMINED[id]);
  });

  it("applies the datamined ratio for six heroes and, for Kimahri alone, the factor that puts his BODY there (his idle's top pixel is his spear tip)", () => {
    expect(CHARACTER_IDS.filter((id) => FFX_PARTY_STATURE[id].datamined !== undefined)).toEqual(['kimahri']);
    expect(CHARACTER_IDS.filter((id) => FFX_PARTY_STATURE[id].note !== undefined)).toEqual(['kimahri']);
    for (const id of CHARACTER_IDS) if (id !== 'kimahri') expect(FFX_PARTY_STATURE[id].ratio, id).toBe(datamined(id));
    expect(FFX_PARTY_STATURE.kimahri.ratio).toBe(1.304);
    // 1.211 x (Tidus's body share of his painting) / (Kimahri's): his mane at 1.211 of Tidus's hair, which a plain 1.211 would leave at 1.124 (note section 5a).
    const factor = (datamined('kimahri') * BODY_OF_PAINTING.tidus) / BODY_OF_PAINTING.kimahri;
    expect(Math.abs(FFX_PARTY_STATURE.kimahri.ratio - factor)).toBeLessThan(0.001);
    expect(FFX_PARTY_STATURE.kimahri.note).toMatch(/spear tip/);
  });

  it("has Tidus at exactly 1, whatever the basis, so his size is the party's shared height", () => {
    expect(FFX_PARTY_STATURE.tidus.ratio).toBe(1);
    expect(ffxPartyStature('tidus')).toBe(1);
  });

  it('keeps every ratio in a sane band: nobody is half a head off the wiki, nobody is a different species', () => {
    for (const id of CHARACTER_IDS) {
      const { ratio, wiki } = FFX_PARTY_STATURE[id];
      expect(ratio, id).toBeGreaterThan(0.85);
      expect(ratio, id).toBeLessThan(1.35);
      // The datamined ratio against the wiki's (what Kimahri's applied factor is not about). Wakka is the known outlier (his hair is in the model's top, not in the wiki's body height): 0.13 over.
      expect(Math.abs(datamined(id) - wiki), id).toBeLessThan(id === 'wakka' ? 0.13 : 0.05);
    }
  });

  it.runIf(FFX_STATURE_BASIS === 'bind-pose')("is the model-unit top over Tidus's while the basis is the bind pose (a typo in either number fails here)", () => {
    expect(FFX_PARTY_STATURE.tidus.top).toBe(TIDUS_TOP);
    for (const id of CHARACTER_IDS) expect(Math.abs(FFX_PARTY_STATURE[id].top / TIDUS_TOP - datamined(id)), id).toBeLessThan(0.0006);
  });

  it("keeps the wiki column as the wiki's centimetres over Tidus's 175, comparison only", () => {
    for (const id of CHARACTER_IDS) expect(Math.abs(WIKI_CM[id] / WIKI_CM.tidus - FFX_PARTY_STATURE[id].wiki), id).toBeLessThan(0.0006);
  });

  it('looks a hero up by id and gives 1 to anyone else, without throwing', () => {
    expect(ffxPartyStature('kimahri')).toBe(1.304);
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
      expect(Number(cells[4]), `${name} ratio`).toBe(datamined(id));
      expect(Number(cells[5]), `${name} applied`).toBe(FFX_PARTY_STATURE[id].ratio);
    }
  });
});
