/**
 * **Advisor v4, attached to one FFX battle** (docs/handoff/advisor-v4.md). Called once, by the
 * battle screen, beside `attachEnemyIntent`.
 *
 * It starts a background search whenever the next board is fixed, by listening on this one engine
 * instance's own calls (the presenter and the chain call them; nothing about them changes):
 *
 *  - `init` (a battle's or a link's start), for the first menu;
 *  - `submit`, unless an Overdrive picker is now pending (the player's input decides that one; the
 *    re-submit with the result starts the search);
 *  - `backOutOfMinigame` that returned the turn to the menu.
 *
 * The budget follows the device: `mini` on a phone (the upright phone layout or a coarse pointer),
 * `lean` on a desktop. The worker is terminated when the HUD unmounts.
 *
 * Off (returns `null`) for FFX-2 and FF7, when `ADVISOR_V4_FFX` is off, with no HUD card, or where
 * there is no `Worker` (tests, old browsers): the card is then v3's, exactly as before.
 *
 * Game case: FFX only (AGENTS.md rule 14: FFX-2 stays on v3, `ADVISOR_V4_FFX2`).
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, GameId } from '../../battle/common/types.ts';
import { FFXEngine } from '../../battle/ffx/index.ts';
import { advisorV4On } from '../../engine/tactics/advisor-v4/switch.ts';
import type { MoveAdvisorLookAhead } from '../../ui/common/MoveAdvisor.ts';
import { PHONE_BATTLE_QUERY } from '../../ui/common/phoneBattle.ts';
import { AdvisorV4Host, type HostOptions, type WorkerLike } from './host.ts';

/** The search's time cap, in ms (the worker stops there; the host kills a silent one a second later). */
export const V4_CAP_MS = 15_000;

interface CardOwner {
  moveAdvisor?: { setLookAhead?: (s: MoveAdvisorLookAhead | null) => void };
  unmount?: () => void;
}

function onPhone(): boolean {
  try {
    return window.matchMedia(PHONE_BATTLE_QUERY).matches || window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function spawnWorker(): WorkerLike | null {
  if (typeof Worker === 'undefined') return null;
  try {
    return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'advisor-v4' }) as unknown as WorkerLike;
  } catch {
    return null;
  }
}

/** The Overdrive picker is pending: the turn waits on the player's input, not on the engine. */
const pickerPending = (events: readonly BattleEvent[]): boolean => events.some((e) => e.type === 'minigame-request');

export function attachAdvisorV4(
  hud: unknown,
  engine: BattleEngine | null,
  game: GameId,
  options: Partial<HostOptions> = {},
): AdvisorV4Host | null {
  const owner = hud as CardOwner | null;
  const card = owner?.moveAdvisor;
  if (!engine || !(engine instanceof FFXEngine) || !card?.setLookAhead || !advisorV4On(game)) return null;
  const host = new AdvisorV4Host({ spawn: spawnWorker, budget: onPhone() ? 'mini' : 'lean', capMs: V4_CAP_MS, ...options });
  host.bind(engine);

  const submit = engine.submit.bind(engine);
  engine.submit = (command: Command): BattleEvent[] => {
    const events = submit(command);
    if (!pickerPending(events) && !engine.state().result) host.boardFixed();
    return events;
  };
  const init = engine.init.bind(engine);
  engine.init = (setup: BattleSetup): void => {
    init(setup);
    host.boardFixed();
  };
  const backOut = engine.backOutOfMinigame.bind(engine);
  engine.backOutOfMinigame = (): boolean => {
    const back = backOut();
    if (back) host.boardFixed();
    return back;
  };
  const unmount = owner?.unmount?.bind(owner);
  if (owner && unmount) {
    owner.unmount = (): void => {
      host.dispose();
      card.setLookAhead?.(null);
      unmount();
    };
  }
  card.setLookAhead(host);
  (globalThis as { __pyreflyAdvisorV4?: AdvisorV4Host }).__pyreflyAdvisorV4 = host;
  host.boardFixed();
  return host;
}
