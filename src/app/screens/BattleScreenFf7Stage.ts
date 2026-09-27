/**
 * **FF7's staging in a real battle: the rows and Guard Scorpion's two forms.**
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Reached only through
 * `attachStageHook` for a chapter whose game is `'ff7'` (the hidden Guard
 * Scorpion experiment); no FFX or FFX-2 chapter calls it.
 *
 * What the stage cannot do on its own, and this does, reading the engine's
 * state every frame (presentation only; it never writes the state):
 *
 * - **Rows.** A member's `ff7.row` is where the engine keeps FF7's Change
 *   (`src/battle/ff7/resolve.ts`). The front row stands nearer the enemy and
 *   the back row further right [research/ff7-battle-staging.md §5, derived];
 *   when a member's row flips, they step to the other row's spot
 *   (`rowSpot`, `src/scenes/sector1-reactor-staging.ts`). The step's length and
 *   timing are our estimate.
 * - **The raised tail.** The engine's Raise Tail and Drop Tail are
 *   `form-change` events whose `spriteKey` is the form's painting, so the
 *   presenter's own form-change beat already swaps `ff7-guard-scorpion` and
 *   `ff7-guard-scorpion-tail-up` under its flash. The two cut-outs are
 *   centred differently in their shared source frame, so while the raised one
 *   shows, the figure stands `bossArtShift` to the right, which keeps the body
 *   still; the shift lands on the frame the painting swaps (read back from the
 *   stage), not when the engine decides.
 */

import type { AnyCombatant, BattleState, CombatantId } from '../../battle/common/types.ts';
import type { Ff7Combatant } from '../../battle/common/types-ff7.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { bossArtShift, rowSpot, SECTOR1_BOSS_ID, SECTOR1_BOSS_SPOT, type Ff7RowName } from '../../scenes/sector1-reactor-staging.ts';
import type { AirshipBattleHook, AirshipSceneHandles } from './BattleScreenAirship.ts';

/** How long a Change step takes, ms. Our estimate. */
export const FF7_ROW_STEP_MS = 360;

function ff7Row(c: AnyCombatant | undefined): Ff7RowName | null {
  const row = (c as Ff7Combatant | undefined)?.ff7?.row;
  return row === 'front' || row === 'back' ? row : null;
}

/** The FF7 staging hook's state, exposed for the tests and the debug harness. */
export class Ff7StageDirector {
  private readonly rows = new Map<CombatantId, Ff7RowName>();
  private bossArt: string | null = null;

  constructor(private readonly stage: PaintedStage) {}

  /** Put everyone where the state says, at once (the battle's first frame). */
  place(state: BattleState | null | undefined): void {
    this.follow(state, 0);
  }

  /** Follow the engine: step a member whose row changed, shift the boss when its painting changed. */
  sync(state: BattleState | null | undefined): void {
    this.follow(state, FF7_ROW_STEP_MS);
  }

  /** The row each party member was last staged in. */
  stagedRow(id: CombatantId): Ff7RowName | undefined {
    return this.rows.get(id);
  }

  private follow(state: BattleState | null | undefined, ms: number): void {
    if (!state) return;
    for (const id of state.activeIds) {
      const c = state.combatants[id];
      const row = ff7Row(c);
      const actor = this.stage.actor(id);
      if (!c || !row || !actor || this.rows.get(id) === row) continue;
      this.rows.set(id, row);
      const [x, y, z] = rowSpot(c.slot, row);
      if (ms <= 0) actor.position.set(x, y, z);
      else void actor.moveTo({ x, y, z }, ms);
    }
    const art = this.stage.snapshot().find((s) => s.id === SECTOR1_BOSS_ID)?.art ?? null;
    const boss = this.stage.actor(SECTOR1_BOSS_ID);
    if (art && boss && art !== this.bossArt) {
      this.bossArt = art;
      boss.position.x = SECTOR1_BOSS_SPOT[0] + bossArtShift(art);
    }
  }
}

/** Wire FF7's staging into a staged battle. The scene handles are unused: the stage holds every figure. */
export async function attachFf7Staging(
  _loaded: AirshipSceneHandles,
  stage: PaintedStage,
  state: BattleState | null,
): Promise<AirshipBattleHook | null> {
  const director = new Ff7StageDirector(stage);
  director.place(state);
  return {
    sync: (s) => director.sync(s),
    dispose: () => {},
  };
}
