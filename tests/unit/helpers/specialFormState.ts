/**
 * A real form-up engine for the Special look's tests, and the recorded bursts the presenter-layer tests replay (FFX-2 only: the three Special dresspheres exist only in
 * FFX-2; the `specialDressUp` switch is OFF in every build and ON here).
 *
 * Created by step A and imported by the later steps (C1, C2, D1, D2): nobody writes a second copy. It builds on `specialDrive.ts` (`openSpecial`, `walkTo`), the girl's own walk
 * along her real Garment Grid to the offer of her Special, so the form cases run the real engine and never a hand-built combatant.
 *
 * What it holds:
 *  - {@link chapterIV}: Chapter IV's party with the Specials as the build gives them (Full Throttle added to Paine's owned list: a rig, the build gives it to her in Chapter V),
 *    optionally with every part's whole ladder learned (`masteredLearned`);
 *  - {@link FORM_GIRLS}: the three girls, their Specials and their two parts in the order the tracker uses (RIGHT part, then LEFT part);
 *  - {@link formUp}: a girl in her Special: the walk done and the Special Dress Up row picked, with the burst the engine returned for that pick;
 *  - {@link captureBursts}: the ten recorded logs (`tests/fixtures/specials/logs/*.json`), eight from the engine and two hand-written literals named `*-synthetic`.
 *
 * Why a fall is captured through the real damage path: `fell(u)` (the rig of `ffx2-special-form-edges.test.ts`) sets `hp = 0` and emits NO `ko` event; `immortal` lays `invincible` on the
 * girls so nothing lands; a spent Auto-Life emits `status-remove` then `revive` and no `ko`; and with all three parts down the engine's `settleForms` does nothing ("read as a defeat"), so
 * that log ends in `defeat`. So the main's invincibility and Auto-Life are taken off, her HP is set to 1, and the foe's own action does the rest.
 */

import type { BattleEvent, Command, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FORMS, masteredLearned } from '../../../src/battle/ffx2/special/forms.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { bahamutGroup } from '../../../src/data/ffx2/enemies/bahamut.ts';
import { openSpecial, partsPolicy, specialRow, unit, walkTo, type Input } from './specialDrive.ts';

export { bahamutGroup };

/** The three girls, their Specials and the two parts of each, in the tracker's order: the RIGHT part (`FORMS[special].pods[0]`), then the LEFT. */
export const FORM_GIRLS = [
  { girl: 'yuna', special: 'floral-fallal', parts: ['floral-fallal-right-pistil', 'floral-fallal-left-pistil'] },
  { girl: 'rikku', special: 'machina-maw', parts: ['machina-maw-smasher-r', 'machina-maw-crusher-l'] },
  { girl: 'paine', special: 'full-throttle', parts: ['full-throttle-right', 'full-throttle-left'] },
] as const;
export type FormGirlId = (typeof FORM_GIRLS)[number]['girl'];

/** Chapter IV's party with the Specials as the build gives them (Full Throttle added to Paine's owned list: a rig), optionally mastered. */
export function chapterIV(mastered = false): FFX2PartyBuild {
  const build = structuredClone(bevelleBuild);
  const paine = build.members[2]!;
  if (!paine.owned.includes('full-throttle')) paine.owned.push('full-throttle');
  if (mastered) {
    for (const m of build.members) {
      const form = Object.values(FORMS).find((f) => f.girl === m.id);
      if (form) Object.assign(m.abilitiesLearned, masteredLearned(form));
    }
  }
  return build;
}

export interface FormUp {
  engine: FFX2Engine;
  state: ReturnType<FFX2Engine['state']>;
  snapshot: ReturnType<FFX2Engine['gaugeSnapshot']>;
  /** The log of the burst the engine returned for the Special Dress Up pick (starts with the `spherechange` carrying `special`). */
  entry: BattleEvent[];
}

/** A girl in her Special, on the real engine: `openSpecial` on Chapter IV with the girls kept alive, the walk to the offer, the offer's row picked. */
export function formUp(girl: FormGirlId, opts: { seed?: number; mastered?: boolean; immortal?: boolean } = {}): FormUp {
  const engine = openSpecial({ build: chapterIV(opts.mastered ?? false), group: bahamutGroup, seed: opts.seed ?? 1, immortal: opts.immortal ?? true });
  const walk = walkTo(engine, girl, { immortal: opts.immortal ?? true });
  if (walk.input === null) throw new Error(`${girl}: the walk never reached the offer of her Special`);
  const row = specialRow(walk.input);
  if (!row) throw new Error(`${girl}: no Special Dress Up row on the decision`);
  const entry = [...engine.submit(row.command)];
  return { engine, state: engine.state(), snapshot: engine.gaugeSnapshot(), entry };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The recorded logs
// ---------------------------------------------------------------------------------------------------------------------------------

/** The state a log is read with: the active ids and, per combatant, its side and the one `aiMemory` key the tracker reads (`sdspParked`, only where true). */
export interface LogState {
  activeIds: string[];
  combatants: Record<string, { side: string; aiMemory?: { sdspParked: true } }>;
}
/** One recorded burst (or run of bursts). `seed`, `girl` and `source` say how it was made; the tracker test reads `events` and `state`. */
export interface FormLog {
  girl: string;
  seed: number;
  source: 'engine' | 'synthetic';
  events: BattleEvent[];
  state: LogState;
}

export function stateOf(engine: FFX2Engine): LogState {
  const s = engine.state();
  const combatants: LogState['combatants'] = {};
  for (const [id, c] of Object.entries(s.combatants)) {
    if (c.side !== 'party') continue;
    const parked = (c as unknown as { aiMemory?: Record<string, unknown> }).aiMemory?.['sdspParked'] === true;
    combatants[id] = { side: c.side, ...(parked ? { aiMemory: { sdspParked: true as const } } : {}) };
  }
  return { activeIds: [...s.activeIds], combatants };
}

const logLength = (engine: FFX2Engine): number => engine.state().log.length;
const logSince = (engine: FFX2Engine, from: number): BattleEvent[] => structuredClone(engine.state().log.slice(from)) as BattleEvent[]; // a copy: the engine keeps editing the objects it logged
const logTail = (engine: FFX2Engine, from: number): readonly BattleEvent[] => engine.state().log.slice(from);

/** Step the engine from where it stands until `stop` says the events so far are enough, the battle is over, or the budget runs out. Every player-input is answered by `policy`. */
function driveFoe(engine: FFX2Engine, policy: (d: Input, engine: FFX2Engine) => Command, stop: (events: readonly BattleEvent[]) => boolean, budget = 800): void {
  const from = logLength(engine);
  for (let i = 0; i < budget; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      engine.tick(1); // flushes what the end left pending
      return;
    }
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') engine.submit(policy(d, engine));
    if (stop(logTail(engine, from))) return;
  }
}

const defend = (): Command => ({ kind: 'defend', targets: [] });
const hasFall = (events: readonly BattleEvent[], girl: string, special: string): boolean => {
  const ko = events.findIndex((e) => e.type === 'ko' && e.targetId === girl);
  return ko >= 0 && events.slice(ko).some((e) => e.type === 'spherechange' && e.who === girl && e.from === special && e.special === undefined);
};

/** Take the protections off a unit so the foe's own action can knock it out: no Invincible, no Auto-Life, and `hp` as given. */
function exposed(engine: FFX2Engine, id: string, hp: number, keepAutoLife = false): void {
  const u = unit(engine, id);
  delete u.statuses['invincible'];
  if (!keepAutoLife) delete u.statuses['auto-life'];
  u.hp = hp;
}

const formOf = (girl: FormGirlId) => FORM_GIRLS.find((g) => g.girl === girl)!;

/** The entry burst of a girl's Special. */
export function captureEntry(girl: FormGirlId, seed = 1): FormLog {
  const up = formUp(girl, { seed });
  return { girl, seed, source: 'engine', events: structuredClone(up.entry), state: stateOf(up.engine) };
}

/** The exit burst: the girl's one Change row inside the form (back to the dress she stood on), picked. */
export function captureExit(girl: FormGirlId, seed = 1): FormLog {
  const up = formUp(girl, { seed });
  const d = driveToInput(up.engine, girl);
  const back = d.commands.filter((c) => c.command.kind === 'spherechange');
  if (back.length !== 1) throw new Error(`${girl}: expected one Change row inside the form, found ${back.length}`);
  const from = logLength(up.engine);
  up.engine.submit(back[0]!.command);
  return { girl, seed, source: 'engine', events: logSince(up.engine, from), state: stateOf(up.engine) };
}

/** Step (answering other decisions with Defend) to the next decision of `actor`. */
function driveToInput(engine: FFX2Engine, actor: string): Input {
  for (let i = 0; i < 800; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') {
      if (d.actorId === actor) return d;
      engine.submit(defend());
    }
  }
  throw new Error(`${actor}: no decision within the budget`);
}

/** The main body falls for good while a part stands: protections off, HP 1, the foe's action does the rest. Null when this seed does not produce `ko{main}` then `spherechange` out. */
export function captureFallStanding(girl: FormGirlId, seed: number): FormLog | null {
  const up = formUp(girl, { seed });
  const { special } = formOf(girl);
  exposed(up.engine, girl, 1);
  const from = logLength(up.engine);
  driveFoe(up.engine, () => defend(), (ev) => hasFall(ev, girl, special));
  const events = logSince(up.engine, from);
  return hasFall(events, girl, special) ? { girl, seed, source: 'engine', events, state: stateOf(up.engine) } : null;
}

/** The main body is knocked out and Auto-Life brings her back: `status-remove auto-life` (consumed), then `revive` with the cause `auto-life`, and no `ko`. */
export function captureAutoLife(girl: FormGirlId, seed: number): FormLog | null {
  const up = formUp(girl, { seed });
  exposed(up.engine, girl, 1, true);
  const from = logLength(up.engine);
  driveFoe(up.engine, () => defend(), (ev) => ev.some((e) => e.type === 'revive' && e.targetId === girl && e.cause === 'auto-life'));
  const events = logSince(up.engine, from);
  const revived = events.some((e) => e.type === 'revive' && e.targetId === girl && e.cause === 'auto-life');
  return revived ? { girl, seed, source: 'engine', events, state: stateOf(up.engine) } : null;
}

/** All three parts go down and the log ends in `defeat` with no `spherechange` out. Null when this seed knocks the main out while a part stands. */
export function captureDefeat(girl: FormGirlId, seed: number): FormLog | null {
  const up = formUp(girl, { seed });
  for (const id of up.engine.state().activeIds) exposed(up.engine, id, 1);
  const from = logLength(up.engine);
  driveFoe(up.engine, () => defend(), (ev) => ev.some((e) => e.type === 'defeat'));
  const events = logSince(up.engine, from);
  const ended = events.some((e) => e.type === 'defeat') && !events.some((e) => e.type === 'spherechange');
  return ended ? { girl, seed, source: 'engine', events, state: stateOf(up.engine) } : null;
}

/** A part falls and a Revival row raises it: `ko{part}` then `revive{part}`, the main untouched. Null when this seed does not produce both. */
export function capturePartRaised(girl: FormGirlId, seed: number): FormLog | null {
  const up = formUp(girl, { seed, mastered: true });
  const [right, left] = formOf(girl).parts;
  for (const id of [right, left]) exposed(up.engine, id, 1);
  const policy = partsPolicy('bahamut');
  const from = logLength(up.engine);
  const raised = (ev: readonly BattleEvent[]): boolean => {
    const ko = ev.findIndex((e) => e.type === 'ko' && (e.targetId === right || e.targetId === left));
    return ko >= 0 && ev.slice(ko).some((e) => e.type === 'revive' && (e.targetId === right || e.targetId === left));
  };
  driveFoe(up.engine, (d, engine) => policy(d, engine), raised);
  const events = logSince(up.engine, from);
  return raised(events) && !events.some((e) => e.type === 'spherechange') ? { girl, seed, source: 'engine', events, state: stateOf(up.engine) } : null;
}

/**
 * Of the seeds 1 to 8, the one whose log is SHORTEST among those that produce the case (ties: the lowest seed). The plan said "the first"; the first seed's foe spends many
 * actions before the blow that lands, so its log is a hundred-odd events of turns, and a fixture that small tests the same thing and reads better.
 */
export function bestSeed(make: (seed: number) => FormLog | null): FormLog {
  let best: FormLog | null = null;
  for (let seed = 1; seed <= 8; seed++) {
    const log = make(seed);
    if (log && (best === null || log.events.length < best.events.length)) best = log;
  }
  if (best === null) throw new Error('no seed of 1 to 8 produced the case');
  return best;
}

/** Hand-written bursts for what the engine rigs emit no event for (a heal or a status on a part): named `*-synthetic`. */
export function syntheticLogs(): Record<'heal-on-part-synthetic' | 'status-on-part-synthetic', FormLog> {
  const parts = formOf('yuna').parts;
  const state = (): LogState => ({ activeIds: ['yuna', ...parts], combatants: { yuna: { side: 'party' }, [parts[0]]: { side: 'party' }, [parts[1]]: { side: 'party' }, rikku: { side: 'party', aiMemory: { sdspParked: true } }, paine: { side: 'party', aiMemory: { sdspParked: true } } } });
  const heal = { type: 'heal', targetId: parts[0], sourceId: 'yuna', amount: 120, abilityId: 'x2-floral-fallal-white-pollen' } as unknown as BattleEvent;
  const status = { type: 'status-add', targetId: parts[1], sourceId: 'bahamut', status: 'poison', instance: { id: 'poison', turnsRemaining: null, ticksRemaining: 900, charges: null, stacks: 1, permanent: false } } as unknown as BattleEvent;
  return {
    'heal-on-part-synthetic': { girl: 'yuna', seed: 0, source: 'synthetic', events: [heal], state: state() },
    'status-on-part-synthetic': { girl: 'yuna', seed: 0, source: 'synthetic', events: [status], state: state() },
  };
}

/**
 * The ten recorded logs, by fixture name. `seeds` pins the seed of each engine case (the files record it); absent, the shortest log of the seeds 1 to 8 that produce the case is kept.
 * Cases: entry per girl, the exit, a fall with a part standing, a defeat with every part down, Auto-Life on the main, a part knocked out and raised, and the two synthetic bursts.
 */
export function captureBursts(seeds: Partial<Record<string, number>> = {}): Record<string, FormLog> {
  const pick = (name: string, make: (seed: number) => FormLog | null): FormLog => {
    const seed = seeds[name];
    if (seed === undefined) return bestSeed(make);
    const log = make(seed);
    if (!log) throw new Error(`${name}: seed ${seed} no longer produces the case`);
    return log;
  };
  return {
    'entry-yuna': captureEntry('yuna', seeds['entry-yuna'] ?? 1),
    'entry-rikku': captureEntry('rikku', seeds['entry-rikku'] ?? 1),
    'entry-paine': captureEntry('paine', seeds['entry-paine'] ?? 1),
    'exit-yuna': captureExit('yuna', seeds['exit-yuna'] ?? 1),
    'fall-part-standing': pick('fall-part-standing', (s) => captureFallStanding('yuna', s)),
    'defeat-all-parts-down': pick('defeat-all-parts-down', (s) => captureDefeat('yuna', s)),
    'autolife-main': pick('autolife-main', (s) => captureAutoLife('yuna', s)),
    'part-falls-raised': pick('part-falls-raised', (s) => capturePartRaised('yuna', s)),
    ...syntheticLogs(),
  };
}
