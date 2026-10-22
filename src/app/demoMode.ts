/**
 * DEMO MODE (release 60, the conference demo build; Bailey, 2026-10-20 ~11:00 EDT, decision 157c: "Demo mode: party moves first (Recommended)").
 *
 * An opt-in switch for a person showing the game on a stage: `?demo=1` on the address (kept in `sessionStorage` for the tab, so a reload keeps it; `?demo=0` clears it). It changes ONE thing:
 * **which seed a fresh attempt of a demo chapter fights on.** The rules, the engines, every number and every roll are the game's; the seed only picks which of the fight's own rolls come up
 * (`runSeed.ts` says the same of the ordinary fresh seed). Outside demo mode nothing here runs and the seeds are exactly what they were (a fresh draw, a retry adding 1000).
 *
 * - **Chapter I, Seymour Flux (FFX only): the party acts first.** Seeds 7, 10 and 12, found by the RE audit and verified on the engine (`tests/unit/demo-mode.test.ts`): the party's first command
 *   menu (Tidus) opens before any enemy has acted, with nobody down, and the intended line then wins all three. Seed 7 is the cleanest (no one is knocked out for the whole fight). A fresh attempt takes
 *   the next of the three, and a retry inside the run takes the one after that, so a booth that shows the fight again and again does not show the same one.
 * - **Chapter IV, Bahamut (FFX-2 only): a clean win in about two minutes.** Seed 56, picked on the engine at Wait with the shipped line: a win at 98.1 s of engine time, no girl falls, and
 *   the least damage taken of the fastest seeds (5,466 in all), with Bahamut's one Mega Flare in it. A person playing at Wait adds menu time, which lands the fight in the 2 to 3 minutes of a demo slot.
 *
 * **The booth's polish (R61, Bailey, 2026-10-20, "I demo my game in a week at a huge gaming conference"; both games, presentation only, no rule or number moves):**
 * - **No first-run teaching cards.** In demo mode `coachState.shouldShow` answers false for every surface (Auron's briefing, the guided first run's three cards, every first-use line, the Sphere Grid explainer) and the guide never arms.
 *   Skipped, not "once per session": the demo runs in one tab for a whole day, so "once" would hand the card to the first visitor and take it from the other hundred, and a holding FFX card is a dead screen
 *   until a press. Bailey stands beside the visitor and is the guide (`docs/BOOTH-SCRIPT.md`). Nothing is written to the save for a card that was not shown, so the save stays as clean as it began.
 * - **A win goes straight back.** One implementation, r61-flow's (`app/demo/demoFlow.ts`, `demoBoard.ts`): a demo fight runs with no party prep and no story scene before or after it, the results panel is the last
 *   thing, and the 2-card picker opens with its cursor on the OTHER fight, so the next visitor's first press starts the other one (r61-booth's first version of this, a win-only memory in this file, was dropped when the lanes merged).
 *
 * `window.__pyrefly.demoMode()` reads and sets the switch. A seed the caller names (`RunChapterOptions.seed`, the debug API's `gotoChapter`) or pins (`setSeed`) always wins over this.
 * Pure but for the address and the tab's storage, both read through try/catch (a blocked store is a demo mode that does not persist, nothing more); no `three`.
 */

/** The seeds a demo chapter's fresh attempts take in turn (chapter id to seeds). Verified in `tests/unit/demo-mode.test.ts`. */
export const DEMO_SEEDS: Readonly<Record<string, readonly number[]>> = {
  'seymour-flux': [7, 10, 12],
  'ffx2-bahamut': [56],
};

const KEY_ON = 'pyrefly.demo';
const KEY_RUNS = 'pyrefly.demo.runs.';

/** The seeds of a demo chapter, or null for any other chapter. */
export function demoSeedsOf(chapterId: string): readonly number[] | null {
  return Object.prototype.hasOwnProperty.call(DEMO_SEEDS, chapterId) ? DEMO_SEEDS[chapterId]! : null;
}

/** The seed of the n-th fresh attempt (0 first) of a demo chapter, or null when the chapter has none. Pure. */
export function demoSeedAt(chapterId: string, n: number): number | null {
  const seeds = demoSeedsOf(chapterId);
  if (!seeds || seeds.length === 0) return null;
  const i = ((Math.trunc(n) % seeds.length) + seeds.length) % seeds.length;
  return seeds[i]!;
}

/**
 * The seed of attempt number `attempt` (0 = the run's first) of a run whose first seed was `firstSeed`. In demo mode and on a demo chapter whose table holds `firstSeed`, a retry takes the next seed of
 * the table; anywhere else it is the game's `firstSeed + attempt * 1000`. Pure but for {@link demoModeOn}.
 */
export function attemptSeed(chapterId: string, firstSeed: number, attempt: number): number {
  const seeds = demoModeOn() ? demoSeedsOf(chapterId) : null;
  const at = seeds ? seeds.indexOf(firstSeed) : -1;
  if (!seeds || at < 0) return firstSeed + attempt * 1000;
  return seeds[(at + attempt) % seeds.length]!;
}

/** What the address and the tab's store say, pure: `on`, and what to write back (`'1'` to remember, `null` to forget, `undefined` to leave it). */
export function readDemoFlag(search: string | undefined, stored: string | null): { on: boolean; remember: '1' | null | undefined } {
  let value: string | null = null;
  try {
    value = search === undefined ? null : new URLSearchParams(search).get('demo');
  } catch {
    value = null;
  }
  if (value === '1') return { on: true, remember: '1' };
  if (value === '0') return { on: false, remember: null };
  return { on: stored === '1', remember: undefined };
}

function store(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

let forced: boolean | null = null;

/** Tests and `window.__pyrefly.demoMode(on)`: force the switch (`null` reads the address again). */
export function setDemoMode(on: boolean | null): void {
  forced = on;
}

/** True while demo mode is on for this tab: `?demo=1` on the address (remembered for the tab), or remembered from earlier. Off in a page that never asked, and off where there is no page. */
export function demoModeOn(): boolean {
  if (forced !== null) return forced;
  const s = store();
  let stored: string | null = null;
  try {
    stored = s?.getItem(KEY_ON) ?? null;
  } catch {
    stored = null;
  }
  const r = readDemoFlag(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''), stored);
  try {
    if (r.remember === '1') {
      if (stored !== '1') s?.setItem(KEY_ON, '1'); // once: a per-frame caller (the battle HUD asks every frame) must not write the tab's store 60 times a second
    }
    else if (r.remember === null) s?.removeItem(KEY_ON);
  } catch {
    /* a blocked store: demo mode just does not outlive the page */
  }
  return r.on;
}

/**
 * The first seed of a fresh attempt of `chapterId` in demo mode: the next of the chapter's table, counted per tab (so reloads and fresh attempts rotate), or null when demo mode is off or the chapter has
 * no table (the caller then draws as it always did).
 */
export function nextDemoRunSeed(chapterId: string): number | null {
  if (!demoModeOn() || demoSeedsOf(chapterId) === null) return null;
  const s = store();
  let n = 0;
  try {
    n = Number.parseInt(s?.getItem(KEY_RUNS + chapterId) ?? '0', 10) || 0;
    s?.setItem(KEY_RUNS + chapterId, String(n + 1));
  } catch {
    n = 0;
  }
  return demoSeedAt(chapterId, n);
}
