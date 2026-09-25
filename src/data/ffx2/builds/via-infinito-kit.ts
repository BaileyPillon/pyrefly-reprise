/**
 * Chapter XIII **kit options**: the sourced clear's equipment, built as data and **switched OFF**.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Bailey picked **TR11 a** (only the kit the engine
 * modelled, `./via-infinito.ts`); these rows go beyond it, so they need Bailey's word (rule 10) and
 * the chapter ships `TREMA_KIT_OPTION = 'tr11-a'` (`../../chapter-ffx2-trema.ts`). They exist so
 * the question can be asked with measured numbers (`docs/plans/trema-bench.md`, "Kit options").
 * TR10's line-up is kept exactly: Yuna and Paine Dark Knights, Rikku Alchemist, Lv 99.
 *
 * **`'sourced-kit'`** is Split_Infinity's own clear (GameFAQs FAQ 26832, G0648 / G0649; method
 * check S1–S6; `research/ffx2-trema.md` §5 "what players actually bring", `[verified: 3 sources]`):
 * - **Defense Bracer** (Auto-Wall) and **Rabite's Foot** on both Dark Knights; **Adamantite**
 *   (Def and MDef +120, HP +100 %, Agi −30, Auto-Wall; one copy in the game) and Rabite's Foot on
 *   the Alchemist (`battle/ffx2/kit.ts`, `accessories.ts`);
 * - the **Valiant Lustre** grid (Equip Def / MDef +20, four gates +20 each, `garment-grids/late.ts`)
 *   on all three girls. **Open:** a Garment Grid may be one item that one girl wears at a time;
 *   only the wiki's plural "Dark Knights" says otherwise (`[single source]`). `'sourced-kit-one-lustre'`
 *   is the answer if it is one girl's: Yuna wears it, Paine keeps The End, Rikku First Steps;
 * - the bag: **99 Megalixirs and 99 Mega-Potions** (Split's stock, `[single source]`), a **Stamina
 *   Tonic** (with a Megalixir at the start, the wiki's normal-Paragon advice), a **Soul Spring** to
 *   drain Trema's MP ("all his MP are gone"), **Three Stars** (Spellspring: Darkness costs no HP),
 *   and TR11 a's Curtains and Remedies. The counts of the last five are `[estimate]`.
 *
 * **`'sourced-kit-ribbon'`** adds the one **Ribbon** the game gives (Bevelle Underground plate puzzle;
 * "most players have 0–1", `ffx2-vegnagun-shuyin.md` §6.7) on the healer, in place of her Rabite's
 * Foot: the wiki's normal-Paragon advice is Ribbon against Itchy (method check S8).
 *
 * Not here, because nothing sources them or the engine lacks them: Oversoul Paragon (TR7), Mix
 * (Dark Matter's Invincible, Chocobo Wing's Final Wall), Phoenix Downs (not in Split's list).
 */

import type { FFX2MemberBuild, FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

/** The kits the chapter can be built with. `'tr11-a'` is Bailey's pick and the shipped default. */
export type TremaKitOption = 'tr11-a' | 'sourced-kit' | 'sourced-kit-one-lustre' | 'sourced-kit-ribbon';

export const TREMA_KIT_OPTIONS: readonly TremaKitOption[] = ['tr11-a', 'sourced-kit', 'sourced-kit-one-lustre', 'sourced-kit-ribbon'];

const LUSTRE = { id: 'valiant-lustre', nodePosition: 0, passedGates: [], wornThisBattle: [] };

function member(id: string): FFX2MemberBuild {
  const m = viaInfinitoBuild.members.find((x) => x.id === id);
  if (!m) throw new Error(`via-infinito preset has no ${id}`);
  return m;
}

function kitMember(id: string, accessories: string[], lustre: boolean): FFX2MemberBuild {
  const m = member(id);
  return { ...m, accessories, garmentGrid: lustre ? { ...LUSTRE } : { ...m.garmentGrid } };
}

const SOURCED_BAG: FFX2PartyBuild['inventory'] = [
  { itemId: 'x2-megalixir', count: 99 }, // Split_Infinity G0648 [single source]
  { itemId: 'x2-mega-potion', count: 99 }, // same
  { itemId: 'x2-stamina-tonic', count: 2 }, // [estimate] count
  { itemId: 'x2-soul-spring', count: 2 }, // [estimate] count
  { itemId: 'x2-three-stars', count: 2 }, // [estimate] count
  { itemId: 'x2-light-curtain', count: 10 }, // TR11 a
  { itemId: 'x2-lunar-curtain', count: 10 }, // TR11 a
  { itemId: 'x2-remedy', count: 10 }, // TR11 a
];

function sourcedKit(lustreOn: readonly string[], healerSecond: string): FFX2PartyBuild {
  return {
    ...viaInfinitoBuild,
    members: [
      kitMember('yuna', ['defense-bracer', "rabite's-foot"], lustreOn.includes('yuna')),
      kitMember('rikku', ['adamantite', healerSecond], lustreOn.includes('rikku')),
      kitMember('paine', ['defense-bracer', "rabite's-foot"], lustreOn.includes('paine')),
    ],
    inventory: SOURCED_BAG,
  };
}

const ALL_THREE = ['yuna', 'rikku', 'paine'];

/** Split_Infinity's kit, Valiant Lustre on all three. OFF: needs Bailey's word over TR11 a. */
export const viaInfinitoSourcedKitBuild: FFX2PartyBuild = sourcedKit(ALL_THREE, "rabite's-foot");
/** The same with one Valiant Lustre (Yuna's). OFF. */
export const viaInfinitoOneLustreKitBuild: FFX2PartyBuild = sourcedKit(['yuna'], "rabite's-foot");
/** The same as `'sourced-kit'` with the one Ribbon on Rikku. OFF. */
export const viaInfinitoRibbonKitBuild: FFX2PartyBuild = sourcedKit(ALL_THREE, 'ribbon');

/** The party build for a kit option. */
export function tremaBuildFor(option: TremaKitOption): FFX2PartyBuild {
  switch (option) {
    case 'sourced-kit': return viaInfinitoSourcedKitBuild;
    case 'sourced-kit-one-lustre': return viaInfinitoOneLustreKitBuild;
    case 'sourced-kit-ribbon': return viaInfinitoRibbonKitBuild;
    case 'tr11-a':
    default: return viaInfinitoBuild;
  }
}
