/**
 * Drive the Luca Opener (Logos and Ormi, then Leblanc, on the docks of Luca; the hidden FFX-2 chapter) headlessly, through both links, with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in
 * for a player; it is an input to a measurement, never game data, and nothing here tunes a boss (rule 6; `docs/plans/ch-debut-review.md` section 8).
 *
 * - **advisor**: the shipped move advisor's tactic (`src/engine/tactics/ffx2-luca-opener.ts`, the line the guide teaches): Rikku steals from each enemy once, everyone strikes Logos, then Ormi, then Leblanc; Yuna the Songstress
 *   dances; a Potion for a girl who is low; a Phoenix Down for a girl who is down.
 * - **ormiFirst**: the naive line, but Ormi is struck before Logos (the order the advisor line avoids): Logos lives long enough to have his Potion thrown, so this is the line that exercises it.
 * - **idle**: nobody does anything (every girl defends); the enemies' scripts show unhindered. Pair it with `maxEnemyActions`.
 * - **naive**: the same girls with no answers: everyone strikes the first living enemy (the Songstress dances once and then only defends), nobody steals, nobody heals.
 *
 * The chain goes through the app's own seam (`setupForNextLink`), so the second link opens on Yuna's Songstress template, at full HP and MP, with the bag as the first link left it. The what-if builds are measurement inputs only.
 */

import type { BattleEvent, BattleResult, BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { lucaOpenerBuild, lucaOpenerSongstressBuild } from '../../../src/data/ffx2/builds/luca-opener.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { lucaLeblancGroup, lucaLogosOrmiGroup } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import { LUCA_ORMI_ATTACK_ID } from '../../../src/data/ffx2/enemies/luca-opener-abilities.ts';
import { LUCA_OPENER_BODY_IDS, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from '../../../src/data/luca-opener-ids.ts';
import { ffx2LucaOpener } from '../../../src/engine/tactics/ffx2-luca-opener.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; alive: boolean; removed?: boolean; stats: { maxHp: number } };

export type LucaLine = 'advisor' | 'naive' | 'ormiFirst' | 'idle';

const ENEMY_ORDER: readonly string[] = LUCA_OPENER_BODY_IDS;
/** Ormi before Logos: the order the advisor line avoids. */
const ORMI_FIRST: readonly string[] = [X2_LUCA_ORMI_ID, X2_LUCA_LOGOS_ID, X2_LUCA_LEBLANC_ID];

/** Enemy actions that have finished in the engine's current link. */
function enemyActionsDone(engine: FFX2Engine): number {
  let n = 0;
  for (const e of engine.state().log as readonly Ev[]) if (e.type === 'action-end' && e.actorId !== undefined && ENEMY_ORDER.includes(e.actorId)) n += 1;
  return n;
}

function foesUp(engine: FFX2Engine, order: readonly string[] = ENEMY_ORDER): string[] {
  const all = engine.state().combatants as unknown as Record<string, Unit>;
  return order.filter((id) => all[id]?.side === 'enemy' && all[id].alive);
}

/** The naive line: strike the first living enemy, nothing else. */
function naiveTurn(d: Input, engine: FFX2Engine, order: readonly string[] = ENEMY_ORDER): Command | null {
  const first = foesUp(engine, order)[0];
  const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (attack && first !== undefined) return { ...attack.command, targets: [first] } as Command;
  const dance = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && (c.command as { id: string }).id === 'x2-songstress-darkness-dance');
  if (dance && first !== undefined) return { ...dance.command, targets: [first] } as Command;
  return null;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => ENEMY_ORDER.includes(t)) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface LucaRun {
  /** The last link's outcome, or undefined when the budget ran out. */
  outcome: string | undefined;
  /** Links begun (1 or 2). */
  links: number;
  /** Links won. */
  won: number;
  /** Logic steps across both links. */
  ticks: number;
  /** Their actions by ability id. */
  moves: Record<string, number>;
  /** Their actions in order (ability ids), both links. */
  order: string[];
  /** Where each of Ormi's shield throws went, in order. */
  pitchVictims: string[];
  /** Where each of Leblanc's Thunders went, in order. */
  thunderVictims: string[];
  partyTurns: number;
  /** Girls knocked out, counted per KO event. */
  kos: number;
  /** Steals begun by Rikku (any target). */
  steals: number;
  /** Logos' Potions that started AFTER Ormi had fallen (the script's test reads a fallen body as 0 HP and queues it anyway; the engine turns the heal onto a living friend, so it mends nobody who needed it). Counted within `moves[potion]`. */
  potionsAtFallenOrmi: number;
  /** Logos' Potions that mended Ormi: a negative `damage` (a heal) on Ormi's id. At most one a run. */
  potionsOnOrmi: number;
  /** Damage the three took in all (HP lost). */
  damageTaken: number;
  /** Every link's full event log, in order. */
  logs: BattleEvent[][];
  /** The state after each link. */
  states: BattleState[];
  /** The result the engine gave each link that ended. */
  results: BattleResult[];
}

export interface LucaDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  /** Act 1's party; the second link's template is derived from it unless `songstress` is given. */
  build?: FFX2PartyBuild;
  /** The second link's party template (Yuna the Songstress). */
  songstress?: FFX2PartyBuild;
  /** Trigger list handed to the engine (the chapter's `mid`), for a flow test. */
  triggers?: BattleSetup['triggers'];
  /** Stop after the first link (a victory there ends the run). */
  firstLinkOnly?: boolean;
  /** Begin at the second link (Leblanc, Yuna the Songstress) as a fresh fight, the way a retry of that link or a test of it opens. */
  startAtLink2?: boolean;
  /** Stop (outcome undefined) once the enemies have finished this many actions in the link being played. */
  maxEnemyActions?: number;
  /** Called after the first link's init, to set a unit's HP or the like (a rig, not a chapter). */
  rig?: (engine: FFX2Engine) => void;
  /** `state.flags` set after init of link 1. */
  flags?: Record<string, number | string | boolean>;
}

const MAX_DECISIONS = 20_000;

type Ev = BattleEvent & { actorId?: string; abilityId?: string; targets?: string[]; targetId?: string; amount?: number };

/** A copy of `build` with the three girls at `levels`. */
export function atLevels(build: FFX2PartyBuild, levels: readonly [number, number, number]): FFX2PartyBuild {
  const copy = structuredClone(build);
  copy.members.forEach((m, i) => {
    m.level = levels[i] ?? m.level;
  });
  return copy;
}

/** Both links' party templates at the same three levels: the pair a what-if hands the drive. */
export function templatesAt(levels: readonly [number, number, number]): { build: FFX2PartyBuild; songstress: FFX2PartyBuild } {
  return { build: atLevels(lucaOpenerBuild, levels), songstress: atLevels(lucaOpenerSongstressBuild, levels) };
}

/** One chapter run (link 1, then link 2 through the app's seam), one line, one seed. */
export function driveLuca(line: LucaLine, seed: number, opts: LucaDriveOptions = {}): LucaRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const build = opts.build ?? lucaOpenerBuild;
  const songstress = opts.songstress ?? (opts.build !== undefined ? atLevels(lucaOpenerSongstressBuild, opts.build.members.map((m) => m.level) as [number, number, number]) : lucaOpenerSongstressBuild);
  let group: EnemyGroupDef = opts.startAtLink2 === true ? { ...lucaLeblancGroup, partyBuildRef: songstress } : lucaLogosOrmiGroup;
  let setup: BattleSetup = { game: 'ffx2', party: opts.startAtLink2 === true ? songstress : build, enemies: group, triggers: opts.triggers ?? [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  opts.rig?.(engine);
  const run: LucaRun = { outcome: undefined, links: 1, won: 0, ticks: 0, moves: {}, order: [], pitchVictims: [], thunderVictims: [], partyTurns: 0, kos: 0, steals: 0, potionsAtFallenOrmi: 0, potionsOnOrmi: 0, damageTaken: 0, logs: [], states: [], results: [] };
  const decisionMs = opts.decisionMs ?? 0;

  const closeLink = (outcome: string | undefined): void => {
    const state = engine.state() as BattleState;
    run.ticks += state.ticks;
    run.states.push(state);
    const log = [...state.log] as BattleEvent[];
    run.logs.push(log);
    let ormiDown = false;
    for (const e of log as readonly Ev[]) {
      if (e.type === 'damage' && e.targetId === X2_LUCA_ORMI_ID && (e.amount ?? 0) < 0) run.potionsOnOrmi += 1;
      if (e.type === 'ko' && e.targetId === X2_LUCA_ORMI_ID) ormiDown = true;
      if (e.type === 'action-start' && e.actorId === X2_LUCA_LOGOS_ID && e.abilityId === 'x2-luca-logos-potion' && ormiDown) run.potionsAtFallenOrmi += 1;
      if (e.type === 'action-start') {
        if (e.actorId !== undefined && ENEMY_ORDER.includes(e.actorId) && e.abilityId !== undefined) {
          run.moves[e.abilityId] = (run.moves[e.abilityId] ?? 0) + 1;
          run.order.push(e.abilityId);
          if (e.abilityId === 'x2-luca-ormi-pirouette-pitch' && e.targets?.[0] !== undefined) run.pitchVictims.push(e.targets[0]);
          if (e.abilityId === 'x2-luca-leblanc-thunder' && e.targets?.[0] !== undefined) run.thunderVictims.push(e.targets[0]);
        } else if (e.actorId !== undefined) {
          run.partyTurns += 1;
          if (e.actorId === 'rikku' && e.abilityId === 'x2-thief-steal') run.steals += 1;
        }
      }
      if (e.type === 'ko' && e.targetId !== undefined && !ENEMY_ORDER.includes(e.targetId)) run.kos += 1;
      if (e.type === 'damage' && e.targetId !== undefined && !ENEMY_ORDER.includes(e.targetId) && (e.amount ?? 0) > 0) run.damageTaken += e.amount ?? 0;
    }
    run.outcome = outcome;
  };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.results.push(d.result);
      closeLink(d.result.outcome);
      if (d.result.outcome !== 'victory') return run;
      run.won += 1;
      if (opts.firstLinkOnly === true || group.nextGroupId === undefined) return run;
      const base = ENEMY_GROUPS_BY_ID[group.nextGroupId];
      if (base === undefined) return run;
      const next: EnemyGroupDef = base.partyBuildRef !== undefined ? { ...base, partyBuildRef: songstress } : base;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + run.links);
      group = next;
      run.links += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.topMs !== undefined && opts.topMs > 0) {
      engine.setMenuLevel('top');
      engine.tick(Math.min(opts.topMs, decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    if (opts.maxEnemyActions !== undefined && enemyActionsDone(engine) >= opts.maxEnemyActions) break;
    const picked = line === 'idle' ? null : line === 'advisor' ? ffx2LucaOpener(d.actorId, d.commands, engine) : naiveTurn(d, engine, line === 'ormiFirst' ? ORMI_FIRST : ENEMY_ORDER);
    engine.submit(line === 'idle' ? { kind: 'defend', targets: [] } : (picked ?? fallback(d)));
  }
  closeLink(undefined);
  return run;
}

/** The moves of each fighter, by ability id (the names a test reads). */
export const LUCA_MOVES = {
  ormiAttack: LUCA_ORMI_ATTACK_ID,
  pitch: 'x2-luca-ormi-pirouette-pitch',
  pistol: 'x2-luca-logos-pistol',
  potion: 'x2-luca-logos-potion',
  leblancAttack: 'x2-luca-leblanc-attack',
  thunder: 'x2-luca-leblanc-thunder',
} as const;

export { lucaLeblancGroup, lucaLogosOrmiGroup, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID };
