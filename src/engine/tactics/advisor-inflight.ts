/**
 * **Commands already on their way** (advisor v3, FFX-2 only).
 *
 * Bailey, 2026-09-27: *"if i select mega potion for example and executed that command then it
 * needs to know that the mega potion is in progress so it shouldn't still tell me to mega
 * potion."* FFX-2's ATB opens the next girl's menu while the first girl's command is still on its
 * purple charge bar, or held for a chain lock [research/ffx2-combat-core.md §1.1, §1.3, §1.7;
 * `FFX2Engine.heldCommand()`]. The v2 card saw those commands (`./advisor-committed.ts`) but read
 * HP as it stands: Chapter V seed 1, Paine charging Mega-Potion, Yuna at 218 / 2 488 with +1 992 on
 * its way, and the card told Yuna "Mega-Potion -> the party" [docs/plans/advisor-v3-method-check.md
 * §1].
 *
 * So the card now ranks on the **projected board**: the battle as it will stand once the commands
 * in flight have landed. "In progress" is not "done" — measured, an enemy acts before the pending
 * command lands in 42 of 111 samples on Chapter V and 242 of 552 on Chapter VI (§5) — so the
 * projection is not arithmetic on the HP bars. It is the engine itself: a **fork** of the battle
 * (`FFX2Engine.fork`, its own random stream), the clock run with the deciding girl's menu open
 * until every charging and held command of the other girls has resolved **or the next enemy
 * moves**, whichever is first ({@link projectBoard} says why it stops there). What landed is on
 * the board the card ranks; what did not is still in flight there, where the committed reading
 * sees it. {@link ./advisor-v3.ts#repeatsInFlight} reads the real board's list, landed or not.
 *
 * A first cut ran on through the enemy's turns and ranked on the worse of two sampled futures: on
 * Chapter V (10 seeds) it lost 2 runs v2 won, once telling a girl a sampled Tail Beam had KO'd to
 * raise herself. Stopping at the enemy won 10 of 10 there.
 *
 * ## Which game, and what it never does
 *
 * **FFX-2 only** [AGENTS.md rule 14]. FFX is CTB: a chosen command resolves before the next turn
 * opens [research/ffx-combat-core.md §1.1], so an FFX board never has anything in flight and
 * {@link inFlight} is empty there by construction. FF7 has no advisor.
 *
 * **Never the real battle** [AGENTS.md rule 1]. The fork is a separate engine with its own
 * `SeededRng`; the live engine is only read (`state()`, `heldCommand()`), so the battle's log and
 * random stream are byte-identical with the advisor on or off (`tests/unit/advisor-v3.test.ts`).
 * Work is bounded by counts, never a wall clock, so the same board always gets the same advice.
 */

import type { BattleEvent, BattleState, CombatantId, Command } from '../../battle/common/types.ts';
import type { QueuedCommand } from './advisor-committed.ts';

/** The part of a forked FFX-2 engine the projection drives. `FFX2Engine` satisfies it. */
export interface ForkedBattle {
  state(): Readonly<BattleState>;
  setAtbMode(mode: 'wait' | 'active'): void;
  setMenuLevel(level: 'top' | 'deep'): void;
  tick(ms: number, opts?: { throughInput?: boolean }): readonly BattleEvent[];
  inputValid(actorId: CombatantId): boolean;
  heldCommand(): QueuedCommand | null;
  /** The girl whose menu is open answers it (`./advisor-lethal.ts` presses a row on a fork). */
  submit(command: Command): readonly BattleEvent[];
}

/** A live FFX-2 engine the card may read and fork (never drive). `FFX2Engine` satisfies it. */
export interface InFlightSource {
  state(): Readonly<BattleState>;
  heldCommand(): QueuedCommand | null;
  fork(seed: number): ForkedBattle;
}

/** One command another girl has chosen that has not landed yet. */
export interface InFlight {
  actorId: CombatantId;
  command: Command;
  /** Held for a chain lock (PR-0076) rather than on the charge bar. */
  held: boolean;
}

/** The board the card ranks on, and what the projection saw on the way there. */
export interface Projection {
  state: BattleState;
  pending: readonly InFlight[];
  /** A held command still waiting at the end of the chosen sample (not yet on its board). */
  stillHeld: readonly QueuedCommand[];
  /** An enemy moved before everything in flight had landed (the projection stopped there). */
  enemyActedFirst: boolean;
}

/** The fork's own seed: fixed, so the same board always projects the same way. */
const SEARCH_SEED = 0x5eed_0001;
/** One clock step of the projection, real ms. */
const STEP_MS = 100;
/** The projection gives up after this much real time: a command still charging then stays pending. */
const HORIZON_MS = 8_000;

/** Every command another active girl has on her charge bar, plus the held ones passed in. */
export function inFlight(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  held: readonly QueuedCommand[],
): InFlight[] {
  if (state.game !== 'ffx2') return [];
  const out: InFlight[] = [];
  for (const id of state.activeIds) {
    if (id === actorId) continue;
    const c = state.combatants[id] as { alive?: boolean; atb?: { charging?: { commandRef?: Command } | null } } | undefined;
    const command = c?.alive !== false ? c?.atb?.charging?.commandRef : undefined;
    if (command) out.push({ actorId: id, command, held: false });
  }
  for (const q of held) {
    if (q.actorId === actorId || !state.activeIds.includes(q.actorId)) continue;
    if (state.combatants[q.actorId]?.alive === false) continue;
    out.push({ actorId: q.actorId, command: q.command, held: true });
  }
  return out;
}

function stillPending(fork: ForkedBattle, p: InFlight): boolean {
  if (p.held) return fork.heldCommand()?.actorId === p.actorId;
  const c = fork.state().combatants[p.actorId] as { alive?: boolean; atb?: { charging?: unknown } } | undefined;
  return c !== undefined && c.alive !== false && (c.atb?.charging ?? null) !== null;
}

/** An enemy moved: it started an action, or a charged one of its own hit somebody. */
function enemyMoved(s: Readonly<BattleState>, e: BattleEvent): boolean {
  if (e.type === 'action-start') return s.combatants[e.actorId]?.side === 'enemy';
  if (e.type === 'damage') return e.sourceId !== undefined && s.combatants[e.sourceId]?.side === 'enemy';
  return false;
}

function started(source: InFlightSource, seed: number): ForkedBattle {
  const fork = source.fork(seed);
  // The fork's clock runs with her menu open whatever the Config mode: a projection of when the
  // commands land, not of how long the player reads the menu.
  fork.setAtbMode('active');
  fork.setMenuLevel('top');
  return fork;
}

/**
 * The board once everything in flight has landed **or the next enemy moves, whichever comes
 * first**; `null` when nothing is in flight or the source is not this board (its event counter
 * differs: the card was handed a stale state).
 *
 * Why it stops at the enemy: past that point the board is a guess about the enemy's roll, and a
 * guess the card then ranks on (a sampled Tail Beam that KOs the girl choosing, and a card telling
 * her to raise herself). Up to it, it is what is already decided. A command that has not landed by
 * then stays in flight on the returned board, where the committed reading still sees its cures,
 * raises and item use (`./advisor-committed.ts`), and the forecast prices the enemy's move on the
 * HP the landed commands leave.
 */
export function projectBoard(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  source: InFlightSource,
  pending: readonly InFlight[],
): Projection | null {
  if (pending.length === 0) return null;
  if (source.state().nextSeq !== state.nextSeq) return null;
  const seed = SEARCH_SEED;
  let fork = started(source, seed);
  const waiting = new Set(pending);
  let steps = 0;
  let enemyActedFirst = false;
  while (steps * STEP_MS < HORIZON_MS && waiting.size > 0) {
    const events = fork.tick(STEP_MS, { throughInput: true });
    if (events.some((e) => enemyMoved(fork.state(), e))) {
      enemyActedFirst = true;
      break;
    }
    steps += 1;
    for (const p of [...waiting]) if (!stillPending(fork, p)) waiting.delete(p);
    if (fork.state().result || !fork.inputValid(actorId)) break;
  }
  if (enemyActedFirst) {
    // Replay the same seed to the step before the enemy moved: a fork is deterministic.
    fork = started(source, seed);
    for (let i = 0; i < steps; i++) fork.tick(STEP_MS, { throughInput: true });
  }
  if (fork.state().combatants[actorId]?.alive === false) return null;
  // A charging or held hit finished the battle (or this link) inside the projection: there is no
  // enemy left to rank against, and inventory carries to the next link, so the v2 reading stands
  // rather than a card spending a Megalixir on a won fight (adversarial check FM2).
  if (fork.state().result) return null;
  const held = fork.heldCommand();
  return {
    state: fork.state() as BattleState,
    pending,
    stillHeld: held ? [held] : [],
    enemyActedFirst,
  };
}
