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
 * preset above** (`./gagazet.ts`, Chapter I, `ffx-seymour-flux.md` §7.3).
 *
 * **Bailey, 2026-09-24 ("I'll go with all your recommendations"): the party
 * sits at the upper bound**: the Gagazet preset's stat cells, the same cells
 * Chapter IX ships (`./yojimbo-cavern.ts`, `research/ffx-yojimbo.md` §5.2
 * "as the upper bound").
 * The midpoint first built here measured the intended line at 8/200 wins; the
 * upper bound measured it at 116/200 (`docs/plans/chapter-natus-review.md`,
 * "Decisions"). **The boss is never tuned**; only the party estimate moved,
 * inside the range the research gives.
 *
 * 1. **All seven members, Yuna included:** every Sphere Grid stat (HP, MP,
 *    Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy)
 *    is the Gagazet preset's own cell, copied (`atTheTop`). No cell is
 *    hand-set, and **every cell keeps the `[estimate]` label `gagazet.ts` gives
 *    it** (`ffx-seymour-flux.md` §7.3, C-11). Yuna's earlier "lower half of the
 *    Gagazet row" rule (§6.2) is superseded by the same pick: the Gagazet row
 *    is its top end. Like Chapter IX, the party is, if anything, a little
 *    strong for this point, and the bench says so. **One cell inverts:**
 *    Rikku's MP (and max MP) is Gagazet's 115, below Chapter VIII's 130
 *    (`fahrenheit.ts`, the stated lower bound), so for that cell alone the
 *    "upper bound" sits under the lower one. Kept as copied (no source settles
 *    it; the pick was "the cells Chapter IX ships"), disclosed for Bailey.
 * 2. **Only the stats move.** Lists, gear, gauges, line-up, aeons and bag stay
 *    what rules 3 and 4 and Bailey's B2 to B5 below make them; nothing Gagazet
 *    teaches or sells comes with the stats.
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

/** The Sphere Grid stats rule 1 copies (luck, eva and acc included). */
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

/**
 * Rule 1: the Gagazet preset's Sphere Grid stats, copied cell for cell (each
 * `[estimate]` in `gagazet.ts`), on this member's own Chapter VIII (Yuna:
 * Chapter VII) gear, lists and gauge. `maxHp` applies the carried armour's
 * `hp-10`, as both presets do.
 */
function atTheTop(carried: FFXPartyBuild, id: string): FFXMemberBuild {
  const m = structuredClone(member(carried, id));
  const high = member(gagazetBuild, id);
  const stats = { ...m.stats } as StatBlock;
  for (const k of GRID_STATS) stats[k] = high.stats[k];
  stats.maxHp = geared(stats.hp, m);
  stats.maxMp = stats.mp;
  m.stats = stats;
  m.hp = stats.maxHp;
  m.mp = stats.maxMp;
  m.learnedAbilityIds = m.learnedAbilityIds.filter((a) => !AIRSHIP_ONLY.includes(a));
  // B4 = b: no Reflect on Yuna. Chapter VII's list already has none; asserted by the test.
  if (id === 'yuna') m.learnedAbilityIds = m.learnedAbilityIds.filter((a) => a !== 'reflect');
  if (TALKERS.includes(id) && !m.learnedAbilityIds.includes('talk')) m.learnedAbilityIds.push('talk');
  return m;
}

/** The six Chapter VIII members carry Chapter VIII's kit (rules 3 and 4). */
const party = (id: string): FFXMemberBuild => atTheTop(fahrenheitBuild, id);
/** Yuna carries Chapter VII's kit: Chapter VIII had no Yuna (rules 3 and 4, B4). */
const yuna = (): FFXMemberBuild => atTheTop(macalaniaBuild, 'yuna');

function aeons(): FFXPartyBuild['aeons'] {
  const early = macalaniaBuild.aeons.map((a) => structuredClone(a));
  const bahamut = gagazetBuild.aeons.find((a) => a.id === 'bahamut');
  if (!bahamut) throw new Error('highbridge: no Bahamut row in the Gagazet preset');
  return [...early, { ...structuredClone(bahamut), overdriveGauge: BAHAMUT_GAUGE }];
}

export const highbridgeBuild: FFXPartyBuild = {
  game: 'ffx',
  // Rule 1: every stat cell is the Gagazet preset's, `[estimate]` as there.
  members: [party('tidus'), yuna(), party('kimahri'), party('auron'), party('wakka'), party('lulu'), party('rikku')],
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
