/**
 * FFX party stature: how tall each of the seven heroes stands next to Tidus, in battle (r3941-heights).
 *
 * **Game case: FFX only.** The FFX-2 girls are not in this table: their HD models are not yet mapped to a girl or a
 * dressphere (`research/ffx-character-heights.md` section 7), and FFX-2's Yuna and Rikku share these ids but not this
 * game, so the stage looks a hero up only in an FFX battle (`src/engine/PartyStature.ts`).
 *
 * **This is the only place the numbers live.** The battle stage multiplies a party member's world height by `ratio`
 * (Tidus is 1, so his size is exactly what it was) and scales the contact shadow and turn ring with it. A better
 * measurement is a change to a `ratio` below and nothing else: no code reads any other field.
 *
 * Source of every number below: `research/ffx-character-heights.md` section 3 (the method, the build, the model ids, the
 * wiki comparison, the bind-pose caveat). In short: the silhouette top of each hero's Steam HD Remaster model, hair and
 * horn included, in the bind pose, divided by Tidus's. Tag `[datamined: FFX HD Remaster build 25501027, bind pose, one
 * reader]`; the lane's report is `D:/Tools/rea/FINDINGS.md` section H, outside the repo. No game file or mesh data is in the
 * repo, only these ratios and the model-unit tops they are made from.
 *
 * Pure data: no DOM, no `three`, no import but a type.
 */

import type { CharacterId } from './ids.ts';

/** What the numbers are a ratio of. `'battle-stance'` replaces it once the live in-battle idle heights (PCSX2) are read. */
export const FFX_STATURE_BASIS: 'bind-pose' | 'battle-stance' = 'bind-pose';

/** Tidus's silhouette top in model units, the denominator of every `ratio` while the basis is the bind pose. */
export const TIDUS_TOP = 18.15;

export interface PartyStature {
  /**
   * Standing height as a multiple of Tidus's. **The only field the build reads.** Three places, as in the research note.
   */
  readonly ratio: number;
  /**
   * The silhouette top of the hero's HD model, bind pose, hair and horn included, in the engine's model units
   * (`research/ffx-character-heights.md` section 3). Provenance for `ratio`, not read by the build.
   */
  readonly top: number;
  /**
   * The FF Wiki's published height as a multiple of Tidus's 175 cm (`research/visual-bible.md` section 0.4, single
   * source; Lulu is her barefoot 167 cm). Comparison only, never applied.
   */
  readonly wiki: number;
}

/**
 * The seven heroes, keyed by `CharacterId`. Every `ratio` is `top / TIDUS_TOP` to three places while the basis is the
 * bind pose (`tests/unit/ffx-party-stature.test.ts` checks it); when a battle-stance reading replaces one, change
 * `FFX_STATURE_BASIS` and the number, and say so in the research note.
 */
export const FFX_PARTY_STATURE: Readonly<Record<CharacterId, PartyStature>> = {
  // Every row's source: research/ffx-character-heights.md section 3 (the lane's table, FINDINGS.md section H), tag [datamined: FFX HD Remaster
  // build 25501027, bind pose, one reader]; the wiki figure is section 4 / research/visual-bible.md section 0.4 [single source], comparison only.
  tidus: { ratio: 1, top: 18.15, wiki: 1 }, // c001, the reference: 18.15 model units; wiki 175 cm
  yuna: { ratio: 0.911, top: 16.53, wiki: 0.92 }, // c002; wiki 161 cm
  auron: { ratio: 1.062, top: 19.28, wiki: 1.046 }, // c003; wiki 183 cm
  kimahri: { ratio: 1.211, top: 21.98, wiki: 1.166 }, // c004, horn included; wiki 204 cm
  wakka: { ratio: 1.201, top: 21.8, wiki: 1.074 }, // c005, hair included: +0.127 over the wiki, the largest gap (note section 4); wiki 188 cm
  lulu: { ratio: 0.99, top: 17.97, wiki: 0.954 }, // c006, hair included; wiki 167 cm barefoot (173 cm in heels would be 0.989)
  rikku: { ratio: 0.911, top: 16.54, wiki: 0.897 }, // c007; wiki 157 cm
};

/**
 * A hero's standing height as a multiple of Tidus's, or 1 for an id that is not one of the seven (Seymour, an aeon, a
 * fiend, an FFX-2 girl who is not in this table): a figure the table does not name keeps the party's shared height.
 */
export function ffxPartyStature(id: string): number {
  const row = (FFX_PARTY_STATURE as Readonly<Record<string, PartyStature | undefined>>)[id];
  return row?.ratio ?? 1;
}
