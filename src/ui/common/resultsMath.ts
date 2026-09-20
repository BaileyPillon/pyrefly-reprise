/**
 * Pure formatting/selection helpers for `ResultsScreen`, kept DOM-free so they
 * are unit-testable (`tests/unit/ui-common-results.test.ts`).
 */

import type { BattleResult } from '../../battle/common/types.ts';
import { apForLevel } from '../../battle/ffx/results.ts';
import type { Chapter } from '../../data/encounters.ts';
import { ITEMS as FFX_ITEMS } from '../../data/ffx/index.ts';
import {
  ABILITIES as FFX2_ABILITIES,
  ITEMS as FFX2_ITEMS,
  STANDARD_DRESSPHERES,
} from '../../data/ffx2/index.ts';

/** `mm:ss` clear time, per the results-panel convention in `visual-bible.md` §3.8. */
export function formatClearTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Tabular-figure-friendly thousands separator for gil/AP counters. */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Chapters whose Results screen must suppress the light victory-quip register
 * [writing-bible §5.4]: E1, E2 and E4 (Bahamut, chapter 4, suppresses the
 * *entire* flourish — see {@link isSilentResultsChapter} — this set also
 * covers it so a caller checking "should this feel grim" gets one answer).
 */
export const GRIM_CHAPTER_IDS: ReadonlySet<string> = new Set([
  'seymour-flux',
  'yunalesca',
  'ffx2-bahamut',
]);

export function isGrimChapter(chapterId: string): boolean {
  return GRIM_CHAPTER_IDS.has(chapterId);
}

/**
 * Chapter 4 (Bahamut) uniquely suppresses the entire results flourish — no
 * victory pose, no fanfare, no quips [writing-bible §5.4, `dsl.ts` `ResultsStep.silent`].
 */
export function isSilentResultsChapter(chapterId: string): boolean {
  return chapterId === 'ffx2-bahamut';
}

/**
 * Pick one line from a chapter's `victoryQuips[memberId]` list. Deterministic
 * by default (index 0) so the screenshot tool and e2e stay byte-stable;
 * pass a different `index` (e.g. a battle-seeded roll) for variety.
 */
export function pickVictoryQuip(lines: readonly string[] | undefined, index = 0): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  const i = ((index % lines.length) + lines.length) % lines.length;
  return lines[i];
}

/** Whether `timeMs` beats the previously recorded best (or there was none). */
export function isNewBest(previousBestMs: number | null, timeMs: number): boolean {
  return previousBestMs === null || timeMs < previousBestMs;
}

/**
 * FFX credits full AP to every active party member on a win, not a split of
 * a pool [visual-bible §3.8's results-panel example: every row reads the same
 * `AP +36`]. This just fans `result.ap` out to the given member ids.
 */
export function apPerMember(totalAp: number, memberIds: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of memberIds) out[id] = totalAp;
  return out;
}

/**
 * A drop's display name: the registries first (both games'), then a
 * title-cased id. The results ledger sets these as a printed list
 * ("Elixir, Level 3 Key Sphere"), so a raw `level-3-key-sphere` would show.
 */
export function itemLabel(itemId: string): string {
  const def = FFX_ITEMS[itemId] ?? FFX2_ITEMS[itemId];
  if (def) return def.name;
  return itemId
    .split('-')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// ---------------------------------------------------------------- clear time

/**
 * FFX's engine only advances `BattleResult.elapsedMs` inside `wait` effects and
 * it never emits one, so an FFX clear reports `elapsedMs: 0` and the panel used
 * to print `RESULTS · 0:00` after a 14 s fight. The wall clock the BattleScreen
 * measures (`BattleScreenResult.elapsedMs`) is the real number; these constants
 * only back the last-resort conversion from the tick counter, which both
 * engines always fill in.
 *
 * FFX-2's tick rate is exact (`TICK_RATE_BASE = 3000` ticks per second,
 * `ffx2-combat-core §1.2`). FFX's CTB tick has no wall-clock definition, so
 * the rate below is measured: a 21-turn chapter-1 fight played at `fast` ran
 * 106 ticks in 34.6 s of wall clock (~326 ms/tick), and normal speed is
 * slower again. It is an **estimate**, used only when no real clock exists.
 */
export const FFX_MS_PER_TICK = 400;
export const FFX2_MS_PER_TICK = 1000 / 3000;

/**
 * A wall clock under this is not a play session — it is an automated run at
 * `speed: 'skip'`, where every animation wait collapses to zero and a whole
 * chapter resolves in a few hundred milliseconds. Reporting `0:00` for it is
 * true but useless, so the estimate takes over.
 */
export const MIN_PLAUSIBLE_WALL_CLOCK_MS = 1000;

/**
 * How long the encounter took, in milliseconds, preferring real clocks:
 * the presenter's wall clock, then the engine's own battle clock, then the
 * tick counter converted at this game's rate.
 */
export function clearTimeMs(
  result: { elapsedMs: number; elapsedTicks: number },
  wallClockMs?: number,
  game: 'ffx' | 'ffx2' = 'ffx',
): number {
  if (wallClockMs !== undefined && wallClockMs >= MIN_PLAUSIBLE_WALL_CLOCK_MS) {
    return Math.round(wallClockMs);
  }
  if (result.elapsedMs >= MIN_PLAUSIBLE_WALL_CLOCK_MS) return Math.round(result.elapsedMs);
  const perTick = game === 'ffx2' ? FFX2_MS_PER_TICK : FFX_MS_PER_TICK;
  return Math.max(0, Math.round((result.elapsedTicks || 0) * perTick));
}

// -------------------------------------------------------------- member rows

/** One line of the per-member spoils list. */
export interface ResultsMemberRow {
  id: string;
  name: string;
  /** AP in FFX, EXP in FFX-2 — {@link ResultsMemberRow.awardUnit} says which. */
  award: number;
  awardUnit: 'AP' | 'EXP';
  /** Sphere Levels (FFX) or Levels (FFX-2) gained this battle. */
  levelDelta: number;
  levelUnit: 'S.Lv' | 'Lv';
  /**
   * The second line: where this member's progression now stands. FFX prints
   * the Sphere Level and the AP banked toward the next one; FFX-2 prints the
   * dressphere that earned the AP and the ability it is paying for
   * [ffx-combat-core §10.1, ffx2-combat-core §3.0].
   */
  detail: string;
}

/** `Cura 60/80 AP`-style progress toward the next unlearned ability. */
function dressphereDetail(
  dressphereId: string,
  learned: readonly string[],
  bankedAp: number,
): string {
  const def = STANDARD_DRESSPHERES[dressphereId as keyof typeof STANDARD_DRESSPHERES];
  const label = (def?.name ?? itemLabel(dressphereId)).toUpperCase();
  if (!def) return label;
  const known = new Set(learned);
  const next = def.abilities.find((a) => a.apCost > 0 && !known.has(a.abilityId));
  if (!next) return `${label} · MASTERED`;
  const name = FFX2_ABILITIES[next.abilityId]?.name ?? itemLabel(next.abilityId);
  const paid = Math.min(bankedAp, next.apCost);
  return `${label} · ${name.toUpperCase()} ${formatNumber(paid)}/${formatNumber(next.apCost)} AP`;
}

/** `S.LV 18 · 12/95 AP` — where the grid stands once this battle's AP is banked. */
function sphereGridDetail(sLv: number, bankedAp: number, levelsGained: number): string {
  let rest = bankedAp;
  for (let i = 0; i < levelsGained; i++) rest -= apForLevel(sLv + i);
  const now = sLv + levelsGained;
  return `S.LV ${now} · ${formatNumber(Math.max(0, rest))}/${formatNumber(apForLevel(now))} AP`;
}

/**
 * The per-member rows for a finished battle: every member who fought in FFX,
 * all three girls in FFX-2. Pure, so `tests/unit` can assert the progression
 * arithmetic without a DOM.
 *
 * FFX **used to** always list `build.activeSlots` — the pre-battle roster —
 * while `result.sphereLevelsGained` (`src/battle/ffx/results.ts`) is keyed
 * by whoever actually earned AP this battle per ffx-combat-core.md §10.1's
 * rule (took at least one full turn; not KO'd or petrified at the end). The
 * two disagreeing was round 03's gate major: a member switched out mid-battle
 * still got a row with full AP and no S.Lv gain (because their id was not a
 * `sphereLevelsGained` key), while a member switched *in* who leveled up
 * never got a row at all (their id was not in the pre-battle `activeSlots`).
 * The fix for that (commit 67e0a41) made the row set **come from**
 * `sphereLevelsGained`'s keys, which introduced round 04's regression
 * (PR-0003): §10.1 only says who *earns AP*, nothing about who is *listed*,
 * so a defeat (the whole active party KO'd) zeroed `sphereLevelsGained`
 * entirely and the ledger printed no member rows at all, and a victory with
 * one member KO'd at the end silently dropped them from the list.
 *
 * The row set is now the roster — `build.activeSlots` plus any reserve
 * member who **took a turn**, ordered active-then-reserve for a stable row
 * order — and `sphereLevelsGained` is read only to decide each row's own
 * AP/S.Lv: a member the sourced rule excludes still gets a row, with 0 AP
 * and no Sphere Level badge, exactly as FFX-2's screen (and FFX itself)
 * already does for a KO'd or benched member.
 *
 * The first pass at this (round 04, first repair) read "took a turn" as
 * "is a `sphereLevelsGained` key", which the verifier refuted: that key set
 * is AP eligibility (`earnedAp`'s doc in `results.ts`), which *also* excludes
 * anyone KO'd or petrified at the end — so a reserve member who switched in,
 * fought, and was KO'd before the battle ended (Chapter 1, seeds 3/8/12,
 * Auron) had no `sphereLevelsGained` entry and so no row at all, the exact
 * defect this fix is named after. `result.turnsTaken` (`results.ts`,
 * `BattleResult` per `docs/CONTRACT-CHANGES.md`) tracks turn participation on
 * its own, so the row set now unions reserve members from **either** set:
 * `sphereLevelsGained` (earned AP) or `turnsTaken` (acted at all).
 *
 * **FFX-2 only** has one build.members loop below, unaffected by this: it
 * is not a chained-switch roster, and `result.levelsGained` was already
 * keyed the same way `build.members` is read.
 */
export function buildMemberRows(
  chapter: Chapter | undefined,
  result: BattleResult,
): ResultsMemberRow[] {
  const build = chapter?.buildRef;
  if (!build) return [];

  if (build.game === 'ffx') {
    const earnedIds = new Set(Object.keys(result.sphereLevelsGained));
    const actedIds = new Set(Object.keys(result.turnsTaken ?? {}));
    const listedIds = new Set([...earnedIds, ...actedIds]);
    const known = [...build.activeSlots, ...build.reserve.filter((id) => listedIds.has(id))];
    for (const id of listedIds) if (!known.includes(id)) known.push(id);
    return known.map((id) => {
      const member = build.members.find((m) => m.id === id);
      const eligible = earnedIds.has(id);
      const sLv = member?.sphereGrid.sLv ?? 0;
      const levelDelta = eligible ? (result.sphereLevelsGained[id] ?? 0) : 0;
      const banked = (member?.sphereGrid.ap ?? 0) + (eligible ? result.ap : 0);
      return {
        id,
        name: member?.name ?? id,
        award: eligible ? result.ap : 0,
        awardUnit: 'AP' as const,
        levelDelta,
        levelUnit: 'S.Lv' as const,
        detail: sphereGridDetail(sLv, banked, levelDelta),
      };
    });
  }

  return build.members.map((member) => {
    const progress = member.abilitiesLearned[member.currentDressphere];
    const banked = (progress?.ap ?? 0) + result.ap;
    return {
      id: member.id,
      name: member.name,
      award: result.exp,
      awardUnit: 'EXP' as const,
      levelDelta: result.levelsGained?.[member.id] ?? 0,
      levelUnit: 'Lv' as const,
      detail: dressphereDetail(member.currentDressphere, progress?.learned ?? [], banked),
    };
  });
}

/**
 * Who stands in the results wedge: FFX's first active slot, FFX-2's first
 * party member. Independent of `buildMemberRows`' row set on purpose (PR-0003)
 * — a defeat or a KO'd leader must still show *someone's* fallen pose, and
 * reading the leader off `rows[0]` broke the moment a row could be missing or
 * reordered by AP eligibility.
 */
export function leaderId(chapter: Chapter | undefined): string | undefined {
  const build = chapter?.buildRef;
  if (!build) return undefined;
  return build.game === 'ffx' ? build.activeSlots[0] : build.members[0].id;
}

/** The drops as one printed list: `Elixir, Phoenix Down ×2`. */
export function dropsLabel(drops: BattleResult['drops']): string {
  return drops
    .map((d) => itemLabel(d.itemId) + (d.count > 1 ? ` \u00d7${d.count}` : ''))
    .join(', ');
}
