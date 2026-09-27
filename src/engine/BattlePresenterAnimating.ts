/**
 * Tell an engine when an action's animation is on screen (FF7 only in effect).
 *
 * FF7's three ATB modes differ by what the clock does **during** an animation
 * [research/ff7-battle-core.md §2.5]: Recommended and Wait hold it, Active runs
 * every gauge (nothing executes until the animation ends), a Summon holds even
 * Active. The FF7 engine takes that as `setAnimating(on)` (`src/battle/ff7/engine.ts`).
 * This brackets every burst the presenter plays with it: `true` before the first
 * event, `false` when the burst is over (also when it throws or is abandoned).
 *
 * Shared plumbing (both + FF7): it only wraps a presenter whose engine offers
 * `setAnimating`, which neither the FFX nor the FFX-2 engine does, so their
 * presenters are left exactly as they were (`tests/unit/ff7-integration.test.ts`).
 */

import type { BattleEvent } from '../battle/common/types.ts';
import type { PlayResult } from './BattlePresenterPorts.ts';

/** The slice of an engine this needs, structurally. */
export interface AnimatingEngine {
  setAnimating(on: boolean, opts?: { summon?: boolean }): void;
}

/** The slice of the presenter this wraps. */
export interface PlayingPresenter {
  play(events: BattleEvent[]): Promise<PlayResult>;
}

/**
 * A HUD that queues battle dialogue and can say when it has all been shown
 * (FF7's top window, `Ff7BattleHud.dialogueShown`).
 */
export interface DialogueHud {
  dialogueShown(): Promise<void>;
}

/** Whether `hud` can hold playback on its dialogue. */
export function dialogueHud(hud: unknown): DialogueHud | null {
  const h = hud as Partial<DialogueHud> | null | undefined;
  return h && typeof h.dialogueShown === 'function' ? (h as DialogueHud) : null;
}

/** Whether `engine` wants to hear about animations. */
export function animatingEngine(engine: unknown): AnimatingEngine | null {
  const e = engine as Partial<AnimatingEngine> | null;
  return e && typeof e.setAnimating === 'function' ? (e as AnimatingEngine) : null;
}

/**
 * Wrap `presenter.play` (the instance's own property, so every internal
 * `this.play` and the Active pump's `play` go through it) for an engine with
 * `setAnimating`. Returns whether it wrapped. A burst with no events is not an
 * animation and passes straight through.
 *
 * With a {@link DialogueHud}, a burst that said a line of dialogue (a `story`
 * message) also holds, still animating, until the HUD has shown every line:
 * FF7's battle dialogue is part of the action that says it (Guard Scorpion's
 * three warnings belong to Raise Tail, research/ff7-guard-scorpion.md §5.1), so
 * no other action may come between its lines.
 */
export function bracketAnimations(presenter: PlayingPresenter, engine: unknown, hud?: unknown): boolean {
  const e = animatingEngine(engine);
  if (!e) return false;
  const dialogue = dialogueHud(hud);
  const play = presenter.play.bind(presenter);
  presenter.play = async (events: BattleEvent[]): Promise<PlayResult> => {
    if (events.length === 0) return play(events);
    e.setAnimating(true);
    try {
      const res = await play(events);
      if (dialogue && events.some((ev) => ev.type === 'message' && ev.kind === 'story')) await dialogue.dialogueShown();
      return res;
    } finally {
      e.setAnimating(false);
    }
  };
  return true;
}
