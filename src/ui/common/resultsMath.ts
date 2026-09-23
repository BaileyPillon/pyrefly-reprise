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
import { portraitCrop, portraitImgHtml } from './portrait.ts';
import { coverCropBox } from './coverCrop.ts';

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
  /**
   * FFX-2 only: the dressphere she fought this battle in, so the row's face
   * can climb the same `-x2`/dressphere ladder the pause screen's party strip
   * and the battle HUD rows use ({@link partyFaceHtml} in
   * `ui/common/partyFace.ts`). Undefined for an FFX row — one portrait per id
   * is already the right answer there.
   */
  dressphere?: string;
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
      dressphere: member.currentDressphere,
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
  // One entry per item: the engines list a drop per enemy, so a formation of
  // look-alikes printed the same name three times and wrapped the ITEMS row
  // into the party list (Macalania, critic pass on 62b4927). Both games.
  const counts = new Map<BattleResult['drops'][number]['itemId'], number>();
  for (const d of drops) counts.set(d.itemId, (counts.get(d.itemId) ?? 0) + d.count);
  return [...counts]
    .map(([id, count]) => itemLabel(id) + (count > 1 ? ` \u00d7${count}` : ''))
    .join(', ');
}

// The ledger's and the party list's density, and the ITEMS row's size.
export { ITEMS_LONG_CHARS, ledgerValueClass, resultsDensity, type ResultsDensity } from './resultsLayout.ts';

/**
 * The victory wedge's portrait frame — the box `.rres__hero-frame` is sized
 * to in `results.css` — in the screen's own 640x360 design units.
 *
 * PR-0078, twice. First the `<img>` had a fixed height and `width: auto`, so
 * intrinsic-ratio sizing landed it anywhere and a win showed one eye. The first
 * fix boxed it in a 220-unit frame that ended at x 584, which kept the head but
 * drew a hard vertical edge through the hair and left a black band down the
 * right (release-09 verifier). The approved tile
 * (`docs/screenshots/mockups/A-results.jpg`) runs the painting **full-bleed**:
 * from the wedge's own leading edge to the stage's right edge, top to bottom.
 * So the frame is the wedge's bounding box — `.rres__ink`'s polygon starts at
 * 48% (307.2) at the bottom — and the wedge's clip, not the frame, cuts the
 * diagonal. It runs 42 units past the stage's bottom edge so a close-cropped
 * portrait (Rikku X-2, eye gap 0.34 of the image) bleeds off the bottom the way
 * the tile's shoulder does, instead of being pushed up into the crown.
 */
export const RESULTS_HERO_FRAME = { left: 307.2, top: -17.78, width: 332.8, height: 420 } as const;

/**
 * Where the face sits in that frame, read off the approved tile at 1440x810:
 * the eyes' midpoint at x ~1168 (519 units, so 0.636 of the frame) and an
 * eye-to-eye distance of ~200px (89 units, 0.27 of the frame). The eye line
 * sits at 0.40 of the 420-unit frame = stage y 150, where the first fix had it.
 * The always-covers clamp wins over eyeX: most portraits put the eyes at
 * 0.33-0.48 of the image, so the face lands at x 456-519, still clear of the
 * diagonal (the wedge's edge is at x 359 on the eye line).
 */
export const RESULTS_HERO_FACE = { ipd: 0.27, eyeX: 0.636, eyeY: 0.4 } as const;

/**
 * Where a leader's face-crop portrait (`art/portraits/<id>.png`,
 * `src/ui/common/face-crops.json`) is placed inside {@link RESULTS_HERO_FRAME}
 * — the same measured-eye-line geometry {@link faceImgHtml} uses for a square
 * tile ({@link coverCropBox} is its non-square generalisation).
 */
export function resultsHeroBox(id: string): { left: number; top: number; width: number; height: number } {
  return coverCropBox(portraitCrop(id), RESULTS_HERO_FRAME.width, RESULTS_HERO_FRAME.height, RESULTS_HERO_FACE);
}

/**
 * The victory portrait's markup: the face-cropped `<img>` inside `.rres__hero-frame`
 * (PR-0078). Moved here from `ResultsScreen.ts` (house rule 7). `manualCrop: true` is
 * load-bearing: without it `refineFaceCrop`'s DOM sweep adopts this `<img>` on its next
 * frame and overwrites the box with its square-tile percentage math.
 */
export function victoryHeroHtml(leader: string): string {
  const box = resultsHeroBox(leader);
  const style =
    `position:absolute;left:${box.left.toFixed(2)}px;top:${box.top.toFixed(2)}px;` +
    `width:${box.width.toFixed(2)}px;height:${box.height.toFixed(2)}px;max-width:none;object-fit:fill`;
  const img = portraitImgHtml(leader, '', { style, manualCrop: true }).replace('<img ', '<img class="rres__hero" ');
  return img ? `<div class="rres__hero-frame">${img}</div>` : '';
}
