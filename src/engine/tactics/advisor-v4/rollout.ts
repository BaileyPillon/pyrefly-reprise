/**
 * **Advisor v4: one simulated future.** Press a candidate on a private fork of the battle, then
 * play on with a cheap default policy (the chapter's own line) until the chapter ends or the
 * horizon runs out, and say how good the board it reached is (`./value.ts`).
 *
 * FFX (CTB): nothing moves while a menu is open [research/ffx-combat-core.md §1.1], so a fork is
 * pressed and advanced turn by turn; the turn order is the engine's own.
 *
 * FFX-2 (ATB): the fork runs at the house human pace the scorecard measures at (Wait split, 0.5 s
 * on the top list with the clock running, 1.0 s held), so a command charges, the enemy moves on
 * its own clock and a menu can close under the girl, as in the real run
 * [research/ffx2-combat-core.md §1.1, §1.3].
 *
 * **Never the real battle** [AGENTS.md rule 1]: forks only (`FFXEngine.fork`, `FFX2Engine.fork`),
 * each with its own random stream; the live engine is only read. The next link of a chain is built
 * by the caller's `nextLink` (the screen's own `setupForNextLink`): the engine layer does not
 * import the app.
 *
 * Moved from the prototype (`critic/bench/advisor-v4/rollout.ts`, which re-exports it).
 *
 * Game case: **both**; the pace half is FFX-2 only.
 */

import type { AvailableCommand, BattleEngine, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../battle/common/types.ts';
import type { FFXEngine } from '../../../battle/ffx/index.ts';
import type { FFX2Engine } from '../../../battle/ffx2/index.ts';
import { intendedStrategy } from '../../BattlePresenterStrategies.ts';
import { leafValue, terminalValue, type ValueWeights } from './value.ts';

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** A battle the search may fork: either engine. */
export type Forkable = FFXEngine | FFX2Engine;

/**
 * The house human pace for FFX-2 (the live default, Wait split): 0.5 s on the top list with the
 * clock running, 1.0 s held in a submenu (`docs/plans/fallen-aeons-bench.md`). Measurement
 * inputs, never game data.
 */
export const HUMAN_PACE = { topMs: 500, heldMs: 1000 } as const;

/** The first enabled Attack, else the first enabled row, aimed at its first target. */
export function fallbackCommand(d: Input): Command {
  const row: AvailableCommand | undefined =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface Future {
  /** The value of the board this future reached, in [0, 1] (1 = the link won). */
  value: number;
  /** `'victory'`, `'defeat'`, ... or `'horizon'` when it stopped short. */
  end: string;
  /** Player decisions the default policy made after the candidate. */
  decisions: number;
  /** False when the engine refused the candidate itself (no events, nothing held). */
  pressed: boolean;
}

/** Builds the next link's setup from the board the last one ended on (`setupForNextLink`). */
export type NextLink = (previous: BattleSetup, next: EnemyGroupDef, state: BattleState, seed: number) => BattleSetup;

/** The chain from the decision's link on: this link's setup and every later link's group. */
export interface Chain {
  setup: BattleSetup;
  next: readonly EnemyGroupDef[];
  nextLink: NextLink;
}

export interface RolloutConfig {
  /** Player decisions the default policy plays after the candidate before the leaf is valued. */
  horizon: number;
  weights: ValueWeights;
  /**
   * Play on through the chain's later links (the screen's own carry), so a won link is not
   * mistaken for a won chapter. Without it a link victory is terminal.
   */
  chain?: Chain | null;
  /** The fork's sample seed: later links are seeded from it (their own random futures). */
  sampleSeed?: number;
}

/** The chapter's own line, the default policy (0.1 to 0.3 ms a decision, measured). */
export function linePolicy(engine: BattleEngine, d: Input): Command {
  return intendedStrategy(d.actorId, d.commands, engine as never) ?? fallbackCommand(d);
}

function isX2(e: Forkable, state: Readonly<BattleState>): e is FFX2Engine {
  return state.game === 'ffx2' && 'tick' in e;
}

/**
 * One FFX-2 menu at the house pace: the clock runs 0.5 s on the top list and 1.0 s held; `false`
 * when the menu closed under her (the drive counts that as a lost decision).
 */
function paceMenu(e: FFX2Engine, actorId: string): boolean {
  e.setMenuLevel('top');
  e.tick(HUMAN_PACE.topMs, { throughInput: true });
  e.setMenuLevel('deep');
  if (!e.inputValid(actorId)) return false;
  e.tick(HUMAN_PACE.heldMs, { throughInput: true });
  return e.inputValid(actorId);
}

/**
 * Press `first` for `actorId` on `fork` (which stands at that girl's open menu, exactly where the
 * live engine stands), then play the line for `cfg.horizon` decisions.
 *
 * `root` is the live board the decision was read on: the leaf is valued against it (the damage
 * race needs where the race started).
 */
export function rollout(fork: Forkable, root: Readonly<BattleState>, actorId: string, first: Command, cfg: RolloutConfig): Future {
  const x2 = isX2(fork, root) ? fork : null;
  if (x2 && !paceMenu(x2, actorId)) {
    // The menu closed before she could press anything: every candidate shares this future.
    return play(fork, root, cfg, true);
  }
  const events = fork.submit(first);
  const held = x2?.heldCommand() ?? null;
  if (events.length === 0 && !held && !fork.state().result) {
    return { value: 0, end: 'refused', decisions: 0, pressed: false };
  }
  return play(fork, root, cfg, true);
}

function play(fork: Forkable, root: Readonly<BattleState>, cfg: RolloutConfig, pressed: boolean): Future {
  const x2 = isX2(fork, root) ? fork : null;
  const chain = cfg.chain ?? null;
  let setup = chain?.setup ?? null;
  let linksAhead = chain?.next.length ?? 0;
  let won = 0;
  let n = 0;
  for (let step = 0; step < 400_000; step++) {
    const d = fork.nextDecision();
    if (d.kind === 'waiting') {
      x2?.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'resolved') continue;
    if (d.kind === 'battle-over') {
      if (d.result.outcome === 'victory' && chain && setup && won < chain.next.length) {
        // The next link, exactly as the screen builds it from the board this one ended on.
        const next = chain.nextLink(setup, chain.next[won]!, fork.state() as BattleState, ((cfg.sampleSeed ?? 1) + 101 * (won + 1)) >>> 0);
        fork.setSeed(next.seed);
        fork.init(next);
        setup = next;
        won += 1;
        linksAhead -= 1;
        continue;
      }
      return { value: terminalValue(fork.state(), d.result.outcome, cfg.weights), end: d.result.outcome, decisions: n, pressed };
    }
    if (n >= cfg.horizon) break;
    n += 1;
    const pick = linePolicy(fork, d);
    if (x2 && !paceMenu(x2, d.actorId)) continue;
    fork.submit(pick);
  }
  const rootAhead = chain?.next.length ?? 0;
  return { value: leafValue(root, fork.state(), { rootAhead, leafAhead: linksAhead }, cfg.weights), end: 'horizon', decisions: n, pressed };
}
