/**
 * Chapter XIII kit **option 4: NightMare185's line-up** against the *normal* Paragon, built and
 * **switched OFF** (`TREMA_KIT_OPTION = 'nightmare-kit'` in `src/data/chapter-ffx2-trema.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: NightMare185, *Via Infinito FAQ* v3.2 (US),
 * GameFAQs FAQ 27609, "Strategy 3", **`[single source]`** (the FF Wiki's "Normal" strategy
 * paraphrases it, so the two count once): "tested ... in 10 battles with Paragon and they have all
 * worked out"; research `ffx2-trema.md` §12.3. The only Catnip-free clear of the normal form found.
 * **It changes TR10** (three Dark Knights, no Alchemist), so it needs Bailey's word twice over.
 *
 * - **Line-up:** Dark Knights on Valiant Lustre, each wearing **only an Oath Veil and a Crystal
 *   Bangle**, and **99 Megalixirs**. Rikku as a Dark Knight wears the Chapter 4 and 5 painting
 *   (`rikku-dark-knight`); Lv 99 and every Dark Knight ability mastered, as the other two.
 * - **The Trema half** pairs it with his Strategy 2 items: Twin or Three Stars (Three here), Chocobo
 *   Wings, a Soul Spring, then "two Darkness and one Mega-Potion a turn". Counts are `[estimate]`:
 *   the source gives none but the Megalixirs'. Strategy 2's Crystal Gloves cannot be worn: nothing
 *   changes equipment between the links (research §1.1, `[verified: 5 sources]`).
 *
 * **Modelled** (engine items and accessories only): Oath Veil (MDef +60, `battle/ffx2/accessories.ts`),
 * Crystal Bangle (+100 % max HP), Valiant Lustre (+60 / +60 with all four gates, `garment-grids/late.ts`),
 * Megalixir, Mega-Potion, Three Stars, Soul Spring, Chocobo Wing (Haste on all). His "if Itchy lands on
 * everyone, all three spherechange" works since method check E2.
 * **Not modelled:** the 9,999 max-HP cap without Break HP Limit (trema-bench bug #4; the Bangle gives a
 * Lv 99 Dark Knight 10,710 here, which flatters the line); whether three girls may wear one Valiant
 * Lustre at once (open, as for `'sourced-kit'`: his own plural "Dark Knights on Valiant Lustre" is the
 * only word on it); the play itself (a Megalixir every turn from one girl, plain Attacks from two,
 * never Darkness on Paragon) is a bench line's job, not the build's.
 */

import type { FFX2MemberBuild, FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

const LUSTRE = { id: 'valiant-lustre', nodePosition: 0, passedGates: [], wornThisBattle: [] };
const ACCESSORIES = ['oath-veil', 'crystal-bangle']; // "only an Oath Veil and a Crystal Bangle" [single source]

function preset(id: string): FFX2MemberBuild {
  const m = viaInfinitoBuild.members.find((x) => x.id === id);
  if (!m) throw new Error(`via-infinito preset has no ${id}`);
  return m;
}

/** The Dark Knight abilities the preset's two Dark Knights have mastered (`via-infinito.ts`). */
const DARK_KNIGHT = preset('yuna').abilitiesLearned['dark-knight'];

function darkKnight(id: string): FFX2MemberBuild {
  const m = preset(id);
  const alreadyOne = m.currentDressphere === 'dark-knight';
  return {
    ...m,
    ...(alreadyOne ? {} : {
      spriteKey: `${id}-dark-knight`,
      currentDressphere: 'dark-knight',
      owned: ['dark-knight', ...m.owned.filter((d) => d !== 'dark-knight')],
      abilitiesLearned: { ...m.abilitiesLearned, ...(DARK_KNIGHT ? { 'dark-knight': { ...DARK_KNIGHT, learned: [...DARK_KNIGHT.learned] } } : {}) },
    }),
    accessories: [...ACCESSORIES],
    garmentGrid: { ...LUSTRE },
  };
}

/** NightMare185's Strategy 3 kit, three Dark Knights. OFF: needs Bailey's word over TR10 and TR11 a. */
export const viaInfinitoNightmareKitBuild: FFX2PartyBuild = {
  ...viaInfinitoBuild,
  members: [darkKnight('yuna'), darkKnight('rikku'), darkKnight('paine')],
  inventory: [
    { itemId: 'x2-megalixir', count: 99 }, // "99 Megalixirs" [single source]
    { itemId: 'x2-mega-potion', count: 99 }, // Trema: "one Mega-Potion a turn"; count [estimate] (the stack's limit)
    { itemId: 'x2-three-stars', count: 2 }, // Trema: Twin or Three Stars; count [estimate]
    { itemId: 'x2-chocobo-wing', count: 2 }, // Trema: Chocobo Wings; count [estimate]
    { itemId: 'x2-soul-spring', count: 2 }, // Trema: Soul Spring; count [estimate]
  ],
};
