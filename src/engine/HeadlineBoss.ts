/**
 * The boss the running link DECLARES (`EnemyGroupDef.bossId`, PR-0243), for the one reader that sees the battle only as a stream of `BattleState`s: the F1 boss ribbon (`ui/hudf1/HudF1.ts`).
 *
 * Why a module and not a `HudPort` method: the battle-start card (`BattleScreenCard`), the opening caption (`BattlePresenter.openOn`) and the preload all get the declared boss as an argument,
 * but the ribbon sits inside `HudF1`, behind `FFXBattleHud` / `FFX2BattleHud` (1,400 lines and more each) and the coach wrapper (`CoachedHud`, which has dropped an optional `HudPort` method six times already:
 * "the same wrapper hole a sixth time"). The chain runner and the presenter's `run` already hold the declared boss of THE LINK THAT IS PLAYING (a chain re-enters `run` per formation, each with its own), so
 * they name it here as the link begins and the ribbon reads it at every sync. `headlineEnemy` falls back to the first visible non-part enemy when the declared one is not on the field, so a stale value
 * (a HUD that outlives its presenter, a test that never ran one) can only ever match an id that is not in the state: it names nothing.
 *
 * Booth review of `booth-ffx-b3a` (2026-10-30), MAJOR 1: Chapter VII's formation stages Guado Guardian A in slot 0 and declares Seymour; the ribbon asked `headlineEnemy(state)` with no declared boss
 * and printed the Guardian until the summon removed the Guardians. Game case: shared plumbing (both games); only a formation that declares a `bossId` can differ: Chapter VII, and the formations of Biran and
 * Yenke, the Mirror aeons, the Last Summoning, Sinspawn Gui and FFX-2's Tourist Trap, none of which is on `DemoGate.TREATED_CHAPTERS`, so the F1 HUD draws for them only when a switch (`?hud=f1`) forces it.
 *
 * Pure: no DOM, no `three`, no randomness (AGENTS.md hard rule 1).
 */

let declared: string | undefined;

/**
 * `BattleEncounterChain`, as each link is set up and BEFORE the link's first HUD sync (that sync happens before `run`, so a ribbon synced then would still name the last link's boss), and `BattlePresenter.run`
 * again as the link begins (any other caller): the formation's declared boss, or `undefined` when it declares none (which also clears the last link's).
 */
export function setHeadlineBoss(id: string | undefined): void {
  declared = id;
}

/** The declared boss of the link that is playing, or `undefined`: the second argument of `headlineEnemy`. */
export function headlineBoss(): string | undefined {
  return declared;
}
