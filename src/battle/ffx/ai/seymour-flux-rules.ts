/**
 * **Chapter I, Seymour Flux and the Mortiorchis: the shared state and the one table both actors read.**
 *
 * Source: the game's own scripts, `research/re-ffx-ai-seymour.md` section 2 (re-parity; D-01 to D-08).
 * **Game case: FFX only** [AGENTS.md rule 14]: the two scripts, their hooks and their numbers belong
 * to this one FFX fight.
 *
 * ## One cycle state, not a memory of who acted
 *
 * The two actors share a single state `s` (1 to 6, starting at 1). Flux acts on the odd steps of
 * the first cycle (Lance, Lance, Dispel) and the Mortiorchis's turn is answered, by Flux's own
 * `onTargeted`, on the even ones (Full-Life, Full-Life, Cross Cleave). An actor whose turn comes
 * while `s` has the other parity **wastes it and leaves `s` alone**; nothing remembers who acted
 * last (D-01). The Mortiorchis never attacks on its own: its turn queues a dummy "Command 150" on
 * Flux, and Flux's reaction to that command is {@link fluxOnCommand150}, which we evaluate in place
 * (the mount stays the actor of record, as it is on screen, with Flux's stats: `statsFrom`).
 *
 * | Flag | Meaning | Written by |
 * |---|---|---|
 * | `seymour.cycle` | `s`, 1 to 6 | the two actors' turns, Flux's Reflect line |
 * | `seymour.phase` | 0, 1 (below 75 %), 2 (below 50 %: the second cycle) | Flux's `onHit` |
 * | `seymour.protectLine`, `seymour.reflectLine` | 52,500 and 35,000; **0 once fired** (one shot each, D-04) | Flux's `onHit` |
 * | `seymour.delayFlag` | 255 while a Delay punishment is armed (D-05) | the mount's `onHit` |
 * | `mortiorchis.reviveHp` | what the mount comes back at: 4,000, 3,000, 2,000, 1,000, 1,000 (D-06) | the mount's `onHit` |
 *
 * All of it lives on `BattleState.flags`, which the advisor's forecast and the HUD can read.
 */

import type { AbilityId, Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, livingFriendlies, rtOf, tryActor } from '../state.ts';
import { type AiContext, use } from './types.ts';
import { pickMatching } from './script-random.ts';

export const FLUX_ID = 'seymour-flux';
export const MORTIORCHIS_ID = 'mortiorchis';

export const CYCLE = 'seymour.cycle';
export const PHASE = 'seymour.phase';
export const PROTECT_LINE = 'seymour.protectLine';
export const REFLECT_LINE = 'seymour.reflectLine';
export const DELAY_FLAG = 'seymour.delayFlag';
export const REVIVE_HP = 'mortiorchis.reviveHp';

/** The mount's first revive value: its private variable at battle start. */
export const MORTIORCHIS_FIRST_REVIVE_HP = 4000;

/** The two Delay commands the mount answers: Delay Attack (0x3006) and Delay Buster (0x3007). */
export const DELAY_COMMAND_IDS: readonly AbilityId[] = ['delay-attack', 'delay-buster'];

function num(ctx: Pick<Ctx, 'state'>, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** `s`, the shared cycle state (1 to 6). */
export function fluxCycle(ctx: Pick<Ctx, 'state'>): number {
  return num(ctx, CYCLE, 1);
}

export function setFluxCycle(ctx: Pick<Ctx, 'state'>, s: number): void {
  ctx.state.flags[CYCLE] = s;
}

/** The game's phase variable: 0 at the start, 1 below 75 %, 2 below 50 %. */
export function fluxPhaseNumber(ctx: Pick<Ctx, 'state'>): 0 | 1 | 2 {
  const v = num(ctx, PHASE, 0);
  return v === 2 ? 2 : v === 1 ? 1 : 0;
}

/**
 * The second cycle is running (`phase-B`): Flare, Total Annihilation. Everything before the 50 % line is
 * the first cycle. Kept for the intent panel and the advisor, which have always asked "1 or 2".
 */
export function fluxPhase(ctx: Pick<Ctx, 'state'>): 1 | 2 {
  return fluxPhaseNumber(ctx) === 2 ? 2 : 1;
}

/** The two HP lines Flux answers with Protect and Reflect: `floor(maxHP / 4) * 3` and `floor(maxHP / 2)`, until each fires. */
export function fluxLine(ctx: Pick<Ctx, 'state'>, flux: FFXCombatant, which: 'protect' | 'reflect'): number {
  const max = flux.stats.maxHp;
  return which === 'protect'
    ? num(ctx, PROTECT_LINE, Math.floor(max / 4) * 3)
    : num(ctx, REFLECT_LINE, Math.floor(max / 2));
}

/** The mount's next revive value. */
export function mortiorchisReviveHp(ctx: Pick<Ctx, 'state'>): number {
  return num(ctx, REVIVE_HP, MORTIORCHIS_FIRST_REVIVE_HP);
}

/** What Flux does in answer to the dummy Command 150 (the mount's turn, or its Delay punishment). */
export type Command150Outcome =
  | { kind: 'slowga' }
  | { kind: 'full-life' }
  | { kind: 'cross-cleave' }
  | { kind: 'ready' }
  | { kind: 'total-annihilation' }
  | { kind: 'nothing' };

/**
 * **Flux's reaction to Command 150** (`research/re-ffx-ai-seymour.md` table 2.4, m142 `onTargeted`
 * @0x403 to 0x519). Rows in order; each moves `s` as the table says. Evaluated in place for the
 * mount's turn and for its Delay punishment, which is where the game queues the same command.
 */
export function fluxOnCommand150(ctx: Pick<Ctx, 'state'>): Command150Outcome {
  if (num(ctx, DELAY_FLAG, 0) === 255) {
    ctx.state.flags[DELAY_FLAG] = 0;
    return { kind: 'slowga' };
  }
  const s = fluxCycle(ctx);
  if (fluxPhaseNumber(ctx) !== 2) {
    if (s === 2 || s === 4) {
      setFluxCycle(ctx, s + 1);
      return { kind: 'full-life' };
    }
    if (s === 6) {
      setFluxCycle(ctx, 1);
      return { kind: 'cross-cleave' };
    }
    return { kind: 'nothing' };
  }
  if (s === 2) {
    setFluxCycle(ctx, 3);
    return { kind: 'ready' };
  }
  if (s === 4) {
    setFluxCycle(ctx, 1);
    return { kind: 'total-annihilation' };
  }
  return { kind: 'nothing' };
}

// ---------------------------------------------------------------------------
// Targets, in the picker's terms
// ---------------------------------------------------------------------------

/** `Frontline`: the party members on the field, or the aeon alone while one is out. */
export function fluxFrontline(ctx: Ctx): FFXCombatant[] {
  return livingFriendlies(ctx);
}

/** A random living Frontline member (the game's picker: no draw below two candidates). */
export function randomLiving(ctx: Ctx): FFXCombatant | undefined {
  return pickMatching(ctx, fluxFrontline(ctx));
}

/** Full-Life's aim: a random living member that is Zombie; if there is none, a random living member. */
export function fullLifeTarget(ctx: Ctx): FFXCombatant | undefined {
  const living = fluxFrontline(ctx);
  const zombies = living.filter((c) => has(c, 'zombie'));
  return pickMatching(ctx, zombies.length > 0 ? zombies : living);
}

/** A turn that does nothing: say so, so the player can see the turn went by (the game plays a caption or nothing). */
export function wasteTurn(ai: AiContext, text: string): null {
  ai.ctx.emit({ type: 'message', text, kind: 'telegraph' });
  return null;
}

// ---------------------------------------------------------------------------
// The telegraph
// ---------------------------------------------------------------------------

/**
 * The notice that Total Annihilation is coming. The game shows two captions: the first when the
 * Reflect line is crossed (the second cycle begins), the second on the mount's Special 1 turn.
 * Our telegraph is the `charge` event the CTB list, the banner and the intent panel already read.
 */
export function announceCharge(ctx: Ctx, mount: FFXCombatant, name: 'Auto-Attack Mode' | 'Ready To Annihilate'): void {
  const stage: 1 | 2 = name === 'Auto-Attack Mode' ? 1 : 2;
  const turnsLeft = stage === 1 ? 1 : 0;
  rtOf(ctx, mount.id).charge = { name, turnsLeft, stage };
  ctx.emit({ type: 'charge', enemyId: mount.id, name, turnsLeft, stage });
  ctx.emit({ type: 'message', text: `${mount.name} enters ${name}`, kind: 'telegraph' });
}

/** The mount, if it is on the board. */
export function mountOf(ctx: Ctx): FFXCombatant | undefined {
  return tryActor(ctx, MORTIORCHIS_ID);
}

/** Build the mount's command for an outcome that has one. */
export function mountCommand(ai: AiContext, outcome: Command150Outcome): Command | null {
  const ctx = ai.ctx;
  switch (outcome.kind) {
    case 'full-life': {
      const target = fullLifeTarget(ctx);
      return use(ai, 'full-life', target ? [target.id] : []);
    }
    case 'cross-cleave':
      return use(ai, 'cross-cleave', fluxFrontline(ctx).map((c) => c.id));
    case 'total-annihilation':
      return use(ai, 'total-annihilation', fluxFrontline(ctx).map((c) => c.id));
    default:
      return null;
  }
}
