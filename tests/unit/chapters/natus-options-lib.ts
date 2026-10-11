/**
 * Shared play loop for the Chapter X option benches (`natus-options-*.test.ts`; `docs/handoff/re-parity-chx-options.md`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. It plays Chapter X exactly the way the RE-parity measurement harness
 * does (`tests/unit/ffx-parity-measure.test.ts`): the app's own `setupForChapter`, the real party build and the real
 * formation, minigames auto-resolved, one engine seeded from the setup. A line is a function from a menu to a command;
 * the shipped line is `intendedStrategy` (which finds the registered tactic the way the game does), a candidate is
 * `makeSeymourNatus(line)` with the same fallbacks. **Measure, never tune**: nothing here changes a boss or a party number.
 */

import type { AvailableCommand, BattleEngine, BattleEvent, BattleState, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { SEYMOUR_NATUS } from '../../../src/data/chapter-seymour-natus.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import type { NatusLineId } from '../../../src/data/guides/natus-line.ts';
import { makeNatusTactic } from '../../../src/engine/tactics/seymour-natus.ts';
import { NATUS_LINES, type NatusLine } from '../../../src/engine/tactics/seymour-natus-lines.ts';

export const NATUS = 'seymour-natus';
export const MORTIBODY = 'mortibody';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** A line: the command for this menu, or null for "no opinion" (the harness then plays its own fallback). */
export type Line = (actorId: string, commands: AvailableCommand[], engine: BattleEngine) => Command | null;

/** The shipped line, found the way the game finds it. */
export const shippedLine: Line = (a, c, e) => intendedStrategy(a, c, e as never);

/** A line by id (`NATUS_LINES`), or by id plus knob overrides (`{ ...NATUS_LINES[base], ...knobs }`): the bench's way to measure a dial the game does not offer. */
export function lineById(id: NatusLineId, knobs: Partial<NatusLine> = {}): Line {
  const tactic = makeNatusTactic({ ...NATUS_LINES[id], ...knobs });
  return (a, c, e) => tactic(a, c, e);
}

/** What the measurement harness plays when the strategy has no pick: the first enabled Attack, else the first enabled row. */
export function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

export interface Played {
  seed: number;
  outcome: string;
  /** Decisions the line was asked for. */
  partyTurns: number;
  engineTurns: number;
  log: readonly BattleEvent[];
  /** The party's commands in order: [actorId, kind, id|'', target ids], one per party turn. */
  picks: Array<{ actor: string; kind: string; id: string; targets: string[]; natusHp: number; seq: number }>;
  final: Readonly<BattleState>;
  /** HP, max HP and Magic Defense of every party member when the battle opened (a copy). */
  start: Record<string, { hp: number; maxHp: number; mdef: number }>;
  /** The three active slots when the battle opened. */
  startActive: string[];
}

let registered = false;

/** Play Chapter X on one seed with `line`; every battle ends or is reported `unresolved`. */
export async function playChapterX(seed: number, line: Line): Promise<Played> {
  if (!registered) {
    await registerBattleContent();
    registered = true;
    // Ablation only (the old cadence): PYREFLY_CHX_FLARE_RANK=5 puts Flare back at the rank our data carried before re-parity W2.
    const rank = Number(process.env['PYREFLY_CHX_FLARE_RANK'] ?? '');
    const flare = ALL_ABILITIES.find((a) => a.id === 'natus-flare');
    if (Number.isFinite(rank) && rank > 0 && flare) flare.rank = rank;
  }
  const setup = setupForChapter(SEYMOUR_NATUS, seed);
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const startActive = [...engine.state().activeIds];
  const start: Played['start'] = {};
  for (const c of Object.values(engine.state().combatants)) {
    if (c.side === 'party') start[c.id] = { hp: c.hp, maxHp: c.stats.maxHp, mdef: c.stats.mdef };
  }
  let outcome = 'unresolved';
  let engineTurns = 0;
  let partyTurns = 0;
  const picks: Played['picks'] = [];
  for (let step = 0; step < 200_000; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      engineTurns = d.result.turns;
      outcome = String(d.result.outcome);
      break;
    }
    partyTurns += 1;
    const cmd = line(d.actorId, d.commands, engine as never) ?? fallback(d);
    const natus = engine.state().combatants[NATUS] as FFXCombatant | undefined;
    picks.push({
      actor: d.actorId,
      kind: cmd.kind,
      id: 'id' in cmd && typeof cmd.id === 'string' ? cmd.id : '',
      targets: [...(cmd.targets ?? [])],
      natusHp: natus?.hp ?? 0,
      seq: engine.state().log.length,
    });
    engine.submit(cmd);
  }
  const final = engine.state() as Readonly<BattleState>;
  return { seed, outcome, partyTurns, engineTurns, log: final.log, picks, final, start, startActive };
}

/** Wins of `seeds` for `line`, plus the mean party turns and mean party KOs of the whole run (the harness's own columns). */
export async function measure(line: Line, seeds: readonly number[]): Promise<{ wins: number; losses: number; unresolved: number; meanPartyTurns: number; meanPartyKos: number; perSeed: string }> {
  let wins = 0;
  let losses = 0;
  let unresolved = 0;
  let turns = 0;
  let kos = 0;
  let perSeed = '';
  for (const seed of seeds) {
    const p = await playChapterX(seed, line);
    turns += p.partyTurns;
    for (const e of p.log) {
      if (e.type !== 'ko') continue;
      const side = p.final.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') kos += 1;
    }
    if (p.outcome === 'victory') { wins += 1; perSeed += 'W'; } else if (p.outcome === 'defeat') { losses += 1; perSeed += 'L'; } else { unresolved += 1; perSeed += 'U'; }
  }
  const n = Math.max(1, seeds.length);
  return { wins, losses, unresolved, meanPartyTurns: Math.round((turns / n) * 10) / 10, meanPartyKos: Math.round((kos / n) * 10) / 10, perSeed };
}

/** Seeds from `PYREFLY_CHX_SEEDS`: a range `1-500` or a list `1,7,42`; the default is 1 to 12. */
export function seedsFromEnv(spec: string | undefined = process.env['PYREFLY_CHX_SEEDS']): number[] {
  if (!spec) return Array.from({ length: 12 }, (_, i) => i + 1);
  const range = /^(\d+)-(\d+)$/.exec(spec);
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  return spec.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}
