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

/** Tidus's silhouette top in model units, the denominator of every datamined ratio while the basis is the bind pose. */
export const TIDUS_TOP = 18.15;

export interface PartyStature {
  /**
   * What the stage multiplies the party's shared height by for this hero, so his standing height next to Tidus's. **The only field
   * the build reads.** Three places, as in the research note. It is the datamined ratio (`top / TIDUS_TOP`) for six of the seven;
   * Kimahri's differs, and says why in `note`.
   */
  readonly ratio: number;
  /**
   * The datamined ratio of the hero's own top (`top / TIDUS_TOP`), where `ratio` is not it. Absent: `ratio` is the datamined one.
   * Provenance only, not read by the build.
   */
  readonly datamined?: number;
  /**
   * Why `ratio` is not the datamined one (`research/ffx-character-heights.md` section 5a). Present exactly where `datamined` is.
   */
  readonly note?: string;
  /**
   * The silhouette top of the hero's HD model, bind pose, hair and horn included, in the engine's model units
   * (`research/ffx-character-heights.md` section 3). Provenance for the datamined ratio, not read by the build.
   */
  readonly top: number;
  /**
   * The FF Wiki's published height as a multiple of Tidus's 175 cm (`research/visual-bible.md` section 0.4, single
   * source; Lulu is her barefoot 167 cm). Comparison only, never applied.
   */
  readonly wiki: number;
}

/**
 * The seven heroes, keyed by `CharacterId`. While the basis is the bind pose, the datamined ratio of every row is `top / TIDUS_TOP` to
 * three places (`tests/unit/ffx-party-stature.test.ts` checks it), and `ratio` is that number for six of the seven; Kimahri's is the
 * factor that puts his body there (his `datamined` and `note`). When a battle-stance reading replaces one, change `FFX_STATURE_BASIS`
 * and the number, and say so in the research note.
 */
export const FFX_PARTY_STATURE: Readonly<Record<CharacterId, PartyStature>> = {
  // Every row's source: research/ffx-character-heights.md section 3 (the lane's table, FINDINGS.md section H), tag [datamined: FFX HD Remaster
  // build 25501027, bind pose, one reader]; the wiki figure is section 4 / research/visual-bible.md section 0.4 [single source], comparison only.
  tidus: { ratio: 1, top: 18.15, wiki: 1 }, // c001, the reference: 18.15 model units; wiki 175 cm
  yuna: { ratio: 0.911, top: 16.53, wiki: 0.92 }, // c002; wiki 161 cm
  auron: { ratio: 1.062, top: 19.28, wiki: 1.046 }, // c003; wiki 183 cm
  // c004, horn included; wiki 204 cm. APPLIED 1.304, not his datamined 1.211 (Bailey, 2026-10-07, "real body height"): the build multiplies the whole approved idle, and
  // Kimahri's idle is cropped at his SPEAR TIP, 8.2 percent of the painting above his mane (the other six are cropped at their hair; Tidus's at a pommel 1.1 percent above his),
  // so 1.211 would leave his mane at 1.124 of Tidus's hair. 1.304 = 1.211 x (Tidus's body share of his painting, 0.9749) / (Kimahri's, 0.9052): his mane at 1.211 (note section 5a).
  kimahri: {
    ratio: 1.304,
    datamined: 1.211,
    note: "his idle's top pixel is the spear tip, 8.2 percent of the painting above his mane; 1.304 puts his body, not his spear, at 1.211 of Tidus's",
    top: 21.98,
    wiki: 1.166,
  },
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
