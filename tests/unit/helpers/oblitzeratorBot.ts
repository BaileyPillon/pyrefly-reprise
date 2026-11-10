/**
 * A scripted player for the hidden Oblitzerator chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the preflight's section 8; the Wendigo and
 * Sanctuary Keeper benches' method). Test-only. It reads what a player reads (the menu's rows, the statuses on the icons, the HP bars) and the crane's state through the debug flags a stage would draw (the crane's state is
 * on the screen as the line "activated"), and never the script's counters.
 *
 * A **line** is a few switches on a common skeleton. The skeleton's priorities are fixed: stand a fallen member up (Phoenix Down), heal the hurt (a Potion), and what is left goes into the line's own plan. A ball's Darkness or Silence
 * lasts through its victim's next turn (the game's order, `research/re-ffx-oblitzerator-crane.md` section 10), so only the lines with `cure` spend a turn on Echo Screens and Eye Drops. The lines:
 *
 * - **careless**: Attack with everyone (the front line's own Attack on the Oblitzerator, Lulu's staff included); heal nobody, cure nothing (what a player does who has not read the guides).
 * - **naive**: the same, but Lulu casts Thunder (its weakness) at the machine; still no care at all. No crane.
 * - **slog**: the skeleton's care plus the sensible slog: Tidus and Kimahri attack the machine, Lulu casts Thunder at it. No crane. No cure.
 * - **slog-cure**: the slog, and a turn spent on an Echo Screen for a Silenced Lulu or Eye Drops for a Darkened member (what the guides advise) before anything else of the line's.
 * - **crane** (the advisor, the line the game ships in `src/engine/tactics/oblitzerator.ts`): the care; Tidus hastes Lulu once; Lulu casts Thunder at the crane three times; Tidus uses the crane; anyone finishes.
 * - **ablations** of the crane line: no care; no Haste; Lulu casts the wrong spells at the crane (Fire, Blizzard, Water: nothing wakes it); Lulu never casts Thunder at the crane (so Use crane is tried unpowered and the
 *   rest swing).
 *
 * The party is a parameter (the build fraction of the preflight's OB3: stop 3 of ten is shipped, stop 0 is the raw start records).
 */

import type { BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { lucaBuild } from '../../../src/data/ffx/builds/luca.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { CRANE, OBLITZERATOR, USE_CRANE, actor, defend, flags, has, newEngine, oblitzerator, row, type Input } from './oblitzeratorDrive.ts';

export interface Line {
  readonly name: string;
  /** Attack the Oblitzerator and do nothing else (Lulu swings her staff). */
  readonly careless?: boolean;
  /** The skeleton's care: raise the fallen, heal the hurt. */
  readonly care: boolean;
  /** After the care: cure a Silenced Lulu (Echo Screen) or a Darkened member (Eye Drops), the statuses a ball leaves. */
  readonly cure?: boolean;
  /** The crane line: Lulu's Thunder at the crane, Tidus's Use crane, then a swing. False: nobody names the crane. */
  readonly crane: boolean;
  /** Tidus hastes Lulu once, before anything else of his. */
  readonly haste: boolean;
  /** Lulu casts the first-tier spells that are not Thunder at the crane instead of Thunder (nothing wakes it). */
  readonly wrongSpells?: boolean;
  /** Lulu casts Thunder at the machine instead of swinging (the slog). */
  readonly lulusThunder: boolean;
}

const CRANE_LINE: Line = { name: 'crane', care: true, crane: true, haste: true, lulusThunder: false };

export const LINES: Readonly<Record<string, Line>> = {
  careless: { name: 'careless', careless: true, care: false, crane: false, haste: false, lulusThunder: false },
  naive: { name: 'naive', care: false, crane: false, haste: false, lulusThunder: true },
  slog: { name: 'slog', care: true, crane: false, haste: false, lulusThunder: true },
  'slog-cure': { name: 'slog-cure', care: true, cure: true, crane: false, haste: false, lulusThunder: true },
  crane: CRANE_LINE,
  'crane-no-care': { ...CRANE_LINE, name: 'crane-no-care', care: false },
  'crane-no-haste': { ...CRANE_LINE, name: 'crane-no-haste', haste: false },
  'wrong-spells': { ...CRANE_LINE, name: 'wrong-spells', wrongSpells: true },
  'no-thunder': { ...CRANE_LINE, name: 'no-thunder', crane: false, lulusThunder: false },
};

export type Outcome = 'victory' | 'defeat' | 'stalled';

export interface Run {
  readonly line: string;
  readonly seed: number;
  readonly outcome: Outcome;
  /** Player decisions taken. */
  readonly decisions: number;
  readonly ticks: number;
  /** The Oblitzerator's HP when the run ended, and the lowest it reached. */
  readonly hp: number;
  readonly lowestHp: number;
  /** Blitzball Rushes thrown, and balls drawn back (the `counter` events of the Oblitzerator), from the log. */
  readonly rushes: number;
  readonly balls: number;
  /** The party's KOs (a member falling), counted from the log. */
  readonly koCount: number;
  /** The crane's state at the end (0 dark, 1 powered, 2 spent). */
  readonly crane: number;
}

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** Skeleton step: stand a fallen member up, heal the hurt. */
function care(engine: BattleEngine, d: Input): Command | null {
  const party = front(engine);
  const down = party.find((c) => !alive(c));
  if (down) return row(d, 'item', 'phoenix-down', down.id);
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) return row(d, 'item', 'potion', hurt.id);
  return null;
}

/** Skeleton step after the care, for the lines with `cure`: Echo Screen for a Silenced Lulu, Eye Drops for a Darkened member (the icons are what a player reads). */
function cure(engine: BattleEngine, d: Input): Command | null {
  const lulu = actor(engine, 'lulu');
  if (alive(lulu) && has(lulu, 'silence')) {
    const echo = row(d, 'item', 'echo-screen', lulu.id);
    if (echo) return echo;
  }
  const blind = front(engine).find((c) => alive(c) && has(c, 'darkness'));
  if (blind) {
    const drops = row(d, 'item', 'eye-drops', blind.id);
    if (drops) return drops;
  }
  return null;
}

/** The line's plan for this actor, or null to fall through to a swing. */
function plan(engine: BattleEngine, d: Input, line: Line): Command | null {
  const me = d.actorId;
  const crane = (flags(engine)['oblitzerator.crane'] as number | undefined) ?? 0;
  const lifted = flags(engine)['oblitzerator.ended'] === true;
  const canCast = !has(actor(engine, me), 'silence');
  if (line.crane && !lifted) {
    if (crane === 1 && me === 'tidus') {
      const use = row(d, 'trigger', USE_CRANE, CRANE);
      if (use) return use;
    }
    if (crane === 0) {
      if (me === 'lulu' && canCast) {
        const spells = line.wrongSpells ? ['fire', 'blizzard', 'water'] : ['thunder'];
        for (const s of spells) {
          const cast = row(d, 'ability', s, CRANE);
          if (cast) return cast;
        }
      }
      const lulu = actor(engine, 'lulu');
      if (me === 'tidus' && line.haste && alive(lulu) && !has(lulu, 'haste')) {
        const haste = row(d, 'ability', 'haste', 'lulu');
        if (haste) return haste;
      }
      return defend(); // nobody swings at the machine while the crane is dark
    }
    if (crane === 1) return defend();
  }
  if (line.lulusThunder && me === 'lulu' && canCast) {
    const cast = row(d, 'ability', 'thunder', OBLITZERATOR);
    if (cast) return cast;
  }
  return null;
}

/** One command for `d`, by the line. */
export function choose(engine: BattleEngine, d: Input, line: Line): Command {
  const strike = row(d, 'attack', undefined, OBLITZERATOR) ?? defend();
  if (line.careless) return strike;
  const tended = line.care ? care(engine, d) : null;
  if (tended) return tended;
  const cured = line.cure === true ? cure(engine, d) : null;
  if (cured) return cured;
  return plan(engine, d, line) ?? strike;
}

/** Play one fight by `chooser` (the line by default) to its end or `maxDecisions`. */
export function play(seed: number, line: Line, party: FFXPartyBuild = lucaBuild, maxDecisions = 1500, chooser: (engine: BattleEngine, d: Input) => Command = (e, d) => choose(e, d, line)): Run {
  const engine = newEngine(seed, party);
  let decisions = 0;
  let lowest = oblitzerator(engine).hp;
  let outcome: Outcome = 'stalled';
  for (let i = 0; i < maxDecisions * 8 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : d.result.outcome === 'defeat' ? 'defeat' : 'stalled';
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    lowest = Math.min(lowest, oblitzerator(engine).hp);
    engine.submit(chooser(engine, d));
  }
  const state = engine.state();
  const events = state.log as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; targetId?: string }>;
  const rushes = events.filter((e) => e.type === 'action-start' && e.actorId === OBLITZERATOR && e.abilityId === 'blitzball-rush').length;
  const balls = events.filter((e) => e.type === 'counter' && e.actorId === OBLITZERATOR).length;
  const koCount = events.filter((e) => e.type === 'ko' && e.targetId !== undefined && ['tidus', 'lulu', 'kimahri'].includes(e.targetId)).length;
  return {
    line: line.name,
    seed,
    outcome,
    decisions,
    ticks: state.ticks,
    hp: oblitzerator(engine).hp,
    lowestHp: lowest,
    rushes,
    balls,
    koCount,
    crane: (state.flags['oblitzerator.crane'] as number | undefined) ?? 0,
  };
}

/** The share of `runs` that are victories, as a percentage with one decimal. */
export function winRate(runs: readonly Run[]): number {
  return runs.length === 0 ? 0 : Math.round((runs.filter((r) => r.outcome === 'victory').length / runs.length) * 1000) / 10;
}

/** `play` over seeds `first` to `first + seeds - 1`. */
export function bench(line: Line, seeds: number, party: FFXPartyBuild = lucaBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(play(s, line, party));
  return runs;
}

/** The line the game ships (`src/engine/tactics/oblitzerator.ts`), played the way the card and the auto-battler play it: the registered tactic, and where it has no opinion the generic ladder, and a Defend if that has none either. */
export const TACTIC_LINE: Line = { ...CRANE_LINE, name: 'tactic' };
export function playTactic(seed: number, party: FFXPartyBuild = lucaBuild): Run {
  return play(seed, TACTIC_LINE, party, 1500, (engine, d) => (intendedStrategy(d.actorId, d.commands, engine) as Command | null) ?? defend());
}
/** `playTactic` over seeds `first` to `first + seeds - 1`. */
export function benchTactic(seeds: number, party: FFXPartyBuild = lucaBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(playTactic(s, party));
  return runs;
}
