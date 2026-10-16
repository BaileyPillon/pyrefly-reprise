/**
 * FFX-2's party gauges while the fight is ending (r50-rc; **FFX-2 only**: FFX has no ATB bar and no commit window).
 *
 * When the last blow lands the engine lets the spells already in flight run out before it builds the result (`battle/ffx2/end-window.ts`: 1.5 to 4.5 seconds, 3 on every Chapter XIII
 * loss), and in that time nobody can take a turn (`nextActor` offers no one, `inputValid` is false). The bars kept counting regardless: a girl whose cast had just fired filled to READY and
 * shimmered, an idle girl's bar climbed toward a command that cannot be given. A clock counting down to nothing.
 *
 * While the engine's mark is on the state (`battle/ffx2/end-flag.ts`) a bar that is **not charging** is drawn as it stood the first time it was drawn in the ending, and **not ready**; a bar that is
 * **charging** is the spell in flight and goes on filling to the end of its cast, as the spells themselves do. When the end lapses (a revive landed inside the window and the fight goes on) the
 * mark is gone and every bar is live again. Nothing is added to the screen: no label, no icon, no new element.
 *
 * Presentation only: the engine's gauges are not touched, and this reads no clock of its own.
 */

import type { AtbSnapshot, BattleState, CombatantId } from '../../battle/common/types.ts';
import { fightEnding } from '../../battle/ffx2/end-flag.ts';

type Bar = AtbSnapshot['bars'][number];

export class EndHold {
  /** The bars held since the fight began ending, one per girl who is not casting. */
  private readonly held = new Map<CombatantId, Bar>();

  /** The bar to draw for `id`: the live one, or its held copy while the fight is ending and she is not casting. */
  bar(state: Pick<BattleState, 'flags'> | null | undefined, id: CombatantId, live: Bar | null): Bar | null {
    if (!fightEnding(state)) {
      if (this.held.size > 0) this.held.clear(); // the end lapsed (or never began): every bar is live again
      return live;
    }
    if (!live) return live;
    if (live.charge !== null) {
      this.held.delete(id); // a spell in flight: its bar is the spell's, and it runs to the end of the cast
      return live;
    }
    let held = this.held.get(id);
    if (!held) {
      held = { ...live, ready: false }; // frozen where it stood, and no READY shimmer for a turn that cannot come
      this.held.set(id, held);
    }
    return held;
  }
}
