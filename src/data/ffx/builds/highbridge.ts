/**
 * Chapter X party build — the Highbridge of Bevelle, straight after the Via
 * Purifico (Seymour Natus).
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — FFX's seven guardians, CTB
 * bench and aeons.
 *
 * ## Where the numbers come from
 *
 * No source gives stats for this point (`research/ffx-seymour-natus-highbridge.md`
 * §6.2). The research names the bounds: **the Evrae preset below**
 * (`./fahrenheit.ts`, Chapter VIII, the fight just before) and **the Gagazet
 * preset above** (`./gagazet.ts`, Chapter I). The plan (§3) says derive between
 * them, so every stat cell here is computed by one stated rule and **every
 * cell is `[estimate]`**, as both presets label their own:
 *
 * 1. **The six Chapter VIII members:** each Sphere Grid stat is the **midpoint**
 *    of the two presets, rounded (`midway`). No cell is hand-set.
 * 2. **Yuna** is missing from the Evrae table; §6.2 says take her "from the
 *    lower half of the Gagazet row" (`ffx-seymour-flux.md` §7.3). Each cell is
 *    the middle of that lower half — a quarter of the way up the range
 *    (`lowerHalf`), rounded.
 * 3. **Equipment is Chapter VIII's, carried forward** — Rin's gear, not the
 *    Gagazet shop's (Wantz sells on the mountain, §7.7). That carries **Rikku's
 *    Stone Ward** (fahrenheit.ts C-14; the plan's §3 "carry forward",
 *    recommended and adopted — the review flagged it as a difficulty call, see
 *    the report) and Yuna's Chapter VII gear. `maxHp` applies the armour's own
 *    `hp-10`, as both presets do.
 * 4. **Overdrive gauges persist between battles** (`ffx-seymour-flux.md`
 *    §7.9.2 [verified: 2 sources]), so each character's gauge is carried from
 *    the last preset that had them: Chapter VIII for the six, Chapter VII
 *    (`./macalania.ts`) for Yuna.
 *
 * ## Bailey's answers (2026-09-24, "I'll go with your recommendations for all")
 *
 * - **B2 = a:** opening line-up **Tidus, Yuna, Kimahri** — the formation's
 *   `forced_party "tyk"` `[single source: decompile]` (N-11) and the turn-back
 *   scene; every switch legal from turn one.
 * - **B3 = b:** **Bahamut full** (the Isaaru duel just before fills him,
 *   research §6.2 `[derived from GameFAQs + wiki]`); the other four at a
 *   partial `[estimate]` — carried from Chapter VII by the persistence rule,
 *   because Chapter VIII had no Yuna and no aeons: Valefor 90, Ifrit 60,
 *   Ixion 60, **Shiva 0** (Chapter VII's rule-bound 0, never used since).
 * - **B4 = b:** **Yuna does not know Reflect** (Jegged: a normal Yuna levels on
 *   the bridge to learn it `[single source]`); Rikku keeps the Reflect Chapter
 *   VIII gave her, so the Reflect lines stay reachable.
 * - **B5 = a:** **Chapter VIII's inventory carried forward**, Softs included
 *   (12, fahrenheit.ts §9.5 `[estimate]`). O'aka XXIII sells on the bridge
 *   (§6.2 [verified: 3 sources]) but his list is unsourced, so nothing is added.
 *
 * ## What changes from the Chapter VIII lists, and why
 *
 * - **Talk** for Tidus, Auron and Yuna: this fight's Trigger Command table
 *   (§6.2 [verified: 4 sources]). Kimahri, Wakka, Lulu and Rikku have no line.
 * - **Pull Back / Close In** come off Tidus and Rikku: they are the
 *   *Fahrenheit*'s orders to Cid, Chapter VIII only.
 * - **Yuna's list is Chapter VII's** (`./macalania.ts`) plus Talk: no Reflect
 *   (B4), and none of what the Gagazet preset adds later (Curaga, Dispel,
 *   Haste) — unsourced for this point, so not granted.
 * - Nothing Gagazet teaches (Mighty Guard, White Wind) is present: the
 *   Chapter VIII lists never had it.
 *
 * Aeons: Valefor, Ifrit, Ixion, Shiva and **Bahamut** (obtained in Bevelle
 * Temple this same visit), no Anima, Magus Sisters or Yojimbo (§6.2
 * [verified: 2 sources]). The first four keep Chapter VII's `[derived]` rows;
 * Bahamut's only row is Chapter I's.
 */

import type { FFXMemberBuild, FFXPartyBuild, StatBlock } from '../../../battle/common/types.ts';
import { fahrenheitBuild } from './fahrenheit.ts';
import { gagazetBuild } from './gagazet.ts';
import { macalaniaBuild } from './macalania.ts';

/** The *Fahrenheit*'s orders to Cid [ffx-evrae-airship §4.2]: Chapter VIII only. */
const AIRSHIP_ONLY: readonly string[] = ['pull-back', 'close-in'];

/** This fight's Talk table [ffx-seymour-natus-highbridge §6.2, verified: 4 sources]. */
const TALKERS: readonly string[] = ['tidus', 'auron', 'yuna'];

/** B3 = b: Bahamut arrives full from the Isaaru duel [§6.2]. */
const BAHAMUT_GAUGE = 100;

/** The Sphere Grid stats the midpoint rule covers (luck, eva and acc included). */
const GRID_STATS = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const;

function member(build: FFXPartyBuild, id: string): FFXMemberBuild {
  const m = build.members.find((x) => x.id === id);
  if (!m) throw new Error(`highbridge: ${id} missing from a source preset`);
  return m;
}

/** `hp-10` on the armour raises max HP by 10 % (both presets apply it this way). */
function geared(hp: number, m: FFXMemberBuild): number {
  return m.equipment.armor.autoAbilities.includes('hp-10') ? Math.floor((hp * 110) / 100) : hp;
}

/** Rule 1: the midpoint of the Evrae and Gagazet presets, per stat. */
function midway(id: string): FFXMemberBuild {
  const low = member(fahrenheitBuild, id);
  const high = member(gagazetBuild, id);
  const m = structuredClone(low);
  const stats = { ...m.stats } as StatBlock;
  for (const k of GRID_STATS) stats[k] = Math.round((low.stats[k] + high.stats[k]) / 2);
  stats.maxHp = geared(stats.hp, m);
  stats.maxMp = stats.mp;
  m.stats = stats;
  m.hp = stats.maxHp;
  m.mp = stats.maxMp;
  m.learnedAbilityIds = m.learnedAbilityIds.filter((a) => !AIRSHIP_ONLY.includes(a));
  if (TALKERS.includes(id) && !m.learnedAbilityIds.includes('talk')) m.learnedAbilityIds.push('talk');
  return m;
}

/**
 * Rule 2: Yuna from the lower half of the Gagazet row (`ffx-seymour-flux.md`
 * §7.3): each cell is `lo + (hi - lo) / 4`, rounded — HP 1,200-1,800 → 1,350,
 * MP 220-320 → 245, STR 12-18 → 14, DEF 10-16 → 12, MAG 32-42 → 35,
 * MDEF 34-44 → 37, AGI 12-18 → 14, Luck 17 (a point value), EVA 30-36 → 32,
 * ACC 8-14 → 10. Gear, gauge and list from Chapter VII (rules 3 and 4, B4).
 */
function yuna(): FFXMemberBuild {
  const m = structuredClone(member(macalaniaBuild, 'yuna'));
  const lowerHalf = (lo: number, hi: number): number => Math.round(lo + (hi - lo) / 4);
  const hp = lowerHalf(1_200, 1_800);
  const mp = lowerHalf(220, 320);
  m.stats = {
    hp,
    mp,
    str: lowerHalf(12, 18),
    def: lowerHalf(10, 16),
    mag: lowerHalf(32, 42),
    mdef: lowerHalf(34, 44),
    agi: lowerHalf(12, 18),
    luck: 17,
    eva: lowerHalf(30, 36),
    acc: lowerHalf(8, 14),
    maxHp: geared(hp, m),
    maxMp: mp,
  };
  m.hp = m.stats.maxHp;
  m.mp = m.stats.maxMp;
  // B4 = b: no Reflect. Chapter VII's list already has none; asserted by the test.
  m.learnedAbilityIds = m.learnedAbilityIds.filter((a) => a !== 'reflect');
  if (!m.learnedAbilityIds.includes('talk')) m.learnedAbilityIds.push('talk');
  return m;
}

function aeons(): FFXPartyBuild['aeons'] {
  const early = macalaniaBuild.aeons.map((a) => structuredClone(a));
  const bahamut = gagazetBuild.aeons.find((a) => a.id === 'bahamut');
  if (!bahamut) throw new Error('highbridge: no Bahamut row in the Gagazet preset');
  return [...early, { ...structuredClone(bahamut), overdriveGauge: BAHAMUT_GAUGE }];
}

export const highbridgeBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [midway('tidus'), yuna(), midway('kimahri'), midway('auron'), midway('wakka'), midway('lulu'), midway('rikku')],
  // B2 = a: Tidus, Yuna, Kimahri (`forced_party "tyk"`, N-11).
  activeSlots: ['tidus', 'yuna', 'kimahri'],
  reserve: ['auron', 'wakka', 'lulu', 'rikku'],
  aeons: aeons(),
  // B5 = a: Chapter VIII's inventory and gil, carried forward.
  inventory: fahrenheitBuild.inventory.map((e) => ({ ...e })),
  gil: fahrenheitBuild.gil,
  sphereInventory: {}, // [estimate] — assumed spent building the stat blocks above
};

export default highbridgeBuild;
