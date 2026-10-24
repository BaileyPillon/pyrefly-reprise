/**
 * Auron's first-command line, keyed by chapter (release 62, PR-0487; FFX only: Auron is FFX's voice, FFX-2's Rikku lines are untouched).
 *
 * Release 61 reworded the line from "He moves after you. Not before. Use it." to "He strikes first. Weather it, then hit back." (Bailey, 2026-10-21, decision 168c), because the old line
 * was false at Chapter I's first menu in 75 of 100 seeds. The coach keys a line by MECHANIC (`CoachLayer.ts`, so a first-timer who picks any chapter is taught the same thing), and the
 * reworded line then showed at the first menu of every FFX chapter, where it is false in six of them (round 28's deep review of release 61). Whether an enemy has already acted when the first
 * command menu opens is a fact of the chapter's own opening (its first-turn order and its ambushes), so the line is now picked by chapter:
 *
 * - **"He strikes first..."** (`TURN_ORDER_ENEMY_FIRST`): Chapter I (`seymour-flux`), as Bailey picked. An enemy acts before the first menu in 75 of 100 seeds there.
 * - **"He moves after you..."** (`TURN_ORDER_PARTY_FIRST`): the chapters where the party opens in every seed: no enemy acts before the first menu in 100 of 100 seeds (the engine, below).
 * - **No line**: every other chapter. Yunalesca (37 of 100) and Braska's Final Aeon (92 of 100) are mixed, so neither line is true; Anima, Yojimbo, Via Purifico, Sin Face and the Biran / Yenke
 *   fight open with the enemy in every seed, where the first line would be true, and are left without a line on purpose (the brief for this release: Chapter I gets the new line, the others the
 *   old line where it is true, or none; one entry below flips each of them). The guide's third step is Auron's line (`firstRunGuide.ts`), so a chapter with no line does not run it.
 *
 * Measured (the engine, `setupForChapter(chapter, seed)` for seeds 1 to 100, the first `player-input` decision; an `action-start` already in the log means an enemy acted first;
 * `tests/unit/r62-auron-turn-order-tip.test.ts` runs the same count on 20 seeds and fails if a shown line stops being true):
 * `seymour-flux` 75, `yunalesca` 37, `braskas-final-aeon` 92, `seymour-anima-macalania` 100, `evrae-airship` 0, `yojimbo-cavern` 100, `seymour-natus` 0, `seymour-omnis` 0, `isaaru-via-purifico` 100,
 * `sin-fins-core` 0, `sin-face` 100, `mirror-aeons` 0, `sinspawn-gui` 0, `exp-fayth` 0, `biran-yenke` 100, `last-summoning` 0.
 *
 * Layering: data and a pure function; no DOM.
 */

/** Chapter I's line: an enemy has acted before the first menu in most seeds (Bailey's pick, decision 168c). */
export const TURN_ORDER_ENEMY_FIRST = '“He strikes first. Weather it, then hit back.”';
/** The line the first menu carried before release 61: true where the party opens. */
export const TURN_ORDER_PARTY_FIRST = '“He moves after you. Not before. Use it.”';

/** The chapters that show a line, and which. A chapter not listed shows none. */
export const TURN_ORDER_LINES: Readonly<Record<string, string>> = {
  'seymour-flux': TURN_ORDER_ENEMY_FIRST,
  'evrae-airship': TURN_ORDER_PARTY_FIRST,
  'seymour-natus': TURN_ORDER_PARTY_FIRST,
  'seymour-omnis': TURN_ORDER_PARTY_FIRST,
  'sin-fins-core': TURN_ORDER_PARTY_FIRST,
  'mirror-aeons': TURN_ORDER_PARTY_FIRST,
  'sinspawn-gui': TURN_ORDER_PARTY_FIRST,
  'exp-fayth': TURN_ORDER_PARTY_FIRST,
  'last-summoning': TURN_ORDER_PARTY_FIRST,
};

/** The line Auron says at `chapterId`'s first command menu, or null when the chapter shows none. */
export function turnOrderBodyFor(chapterId: string): string | null {
  return TURN_ORDER_LINES[chapterId] ?? null;
}
