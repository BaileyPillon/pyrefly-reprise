/**
 * THE CLEANER BATTLE HUD (release 61, the conference demo; Bailey, 2026-10-21, decision 169j: "a cleaner demo HUD: command menu, HP bars and the advisor's one-line tip; guide and intent panels start hidden, one
 * key to show"; both games, demo mode only; Chapter I is FFX, Chapter IV is FFX-2).
 *
 * What a visitor sees in a demo fight: the command menu, the HP and MP plates, and the advisor's **one line** (the NEXT BEST MOVE card with the lead move only: who, what, to whom). The strategy guide and the
 * enemy-move read-out (the "intent" slab) start folded to their chips, and **G** and **E** still open them (and **N** the advisor, as ever).
 *
 * Three small seams, all inert outside demo mode (except the panels' start state, which the F1 HUD also sets: r64, {@link demoPanelStart}):
 *  - {@link demoPanelStart}: the start state of a panel (`readVisible`/`writeVisible`). The panels read the saved switch when they are built, which is the visitor's before them; in demo mode they start
 *    as the booth wants them and a visitor's G, E or N is kept for that fight and is **not written to the save**, so Bailey's own switches are never left changed by a stranger. FFX's read-out already opens
 *    folded in every fight (`FFXBattleHud`), and Chapter I's guide already starts folded (`SceneStaging.guideFolded`); this makes it the same for FFX-2 and for every chapter.
 *  - {@link markDemoHud}: the `demo-hud` class on the battle screen's root, which `demo.css` reads to take the advisor card down to its one line.
 *  - Nothing in the engines, the advisor's numbers or the guide's text changes: the card prints the same first line it always printed.
 */

import { demoModeOn } from '../demoMode.ts';
import { hudF1On } from '../../ui/hudf1/HudF1Switch.ts';

/** The panels the demo HUD sets. */
export type DemoPanel = 'guide' | 'intent' | 'advisor';

/** Which of them start shown: the advisor (as its one line), and neither of the other two. */
export const DEMO_PANEL_SHOWN: Readonly<Record<DemoPanel, boolean>> = { guide: false, intent: false, advisor: true };

/**
 * The options that give a panel its demo start state, or `{}` outside demo mode. Spread into a `StrategyGuide`, `EnemyIntentPanel` or `MoveAdvisor` options object: `readVisible` answers the booth's choice,
 * `writeVisible` swallows the visitor's answer.
 */
export function demoPanelStart(panel: DemoPanel): { readVisible?: () => boolean; writeVisible?: (on: boolean) => void } {
  if (demoModeOn()) {
    const shown = DEMO_PANEL_SHOWN[panel];
    return { readVisible: () => shown, writeVisible: () => undefined };
  }
  return f1PanelStart(panel);
}

/**
 * THE F1 HUD'S INTEL RULE (r64 declutter, Bailey 2026-10-23 decisions 191 to 193, "Less on screen": "Enemy details, guide and tips are behind X (Intel)"; 2026-10-24 "you make the calls"; both games, presentation only).
 * While the F1 HUD is the one drawing (`hudF1On()`: the pack is on in Chapter I or Chapter IV, at TEXT SIZE 100), the guide and the enemy-move read-out start FOLDED at every fight, on the public address as well as the booth's
 * (the booth already did): a first visit, a saved "guide ON" and a fresh profile all open on the same five groups. G and E still open them for that fight; the answer is kept for the fight only and is NOT written to the save, so the
 * player's own switches (the pause menu's STRATEGY GUIDE row) are still what every other chapter reads. The advisor keeps its own setting: the F1 cue is read from its card. The HUDs build their panels in a field initialiser, after
 * the battle screen has named the chapter (`BattleScreen`: `setCurvesChapter` before `createHud`), so `hudF1On()` is already true or false here. With `?pack=off`, `?hud=today` or another chapter it answers false and nothing changes.
 */
function f1PanelStart(panel: DemoPanel): { readVisible?: () => boolean; writeVisible?: (on: boolean) => void } {
  if (panel === 'advisor' || !hudF1On()) return {};
  return { readVisible: () => false, writeVisible: () => undefined };
}

/** Does the demo HUD show the advisor as its one-row tip? True in demo mode. FFX takes the tip from its own solver (`advisorStrip.ts`, the folded guide's fallback); FFX-2's card is cut to its first line by `demo.css`. */
export function demoAdvisorOneLine(): boolean {
  return demoModeOn();
}

/** The class on the battle screen's root that `demo.css` reads. */
export const DEMO_HUD_CLASS = 'demo-hud';

/** Mark a battle screen's root as a demo fight's. A no-op outside demo mode. */
export function markDemoHud(root: HTMLElement): void {
  if (demoModeOn()) root.classList.add(DEMO_HUD_CLASS);
}
