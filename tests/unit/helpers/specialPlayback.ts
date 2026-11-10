/**
 * The replay rig of the FFX-2 Special look's presenter tests (step C2; FFX-2 only: the three Special dresspheres exist only in FFX-2): the recorded bursts of
 * `tests/fixtures/specials/logs/*.json` played through the REAL `BattlePresenter` over `FakeStage`, `FakeHud` and a recording clock.
 *
 * `FakeEngine` is an FFX CTB script and cannot serve, so {@link ScriptedFfx2Engine} is an FFX-2 stand-in that holds one mutable state (the log's, with the flag on) and
 * hands the fixture bursts out in order. A test that only needs `play()` calls {@link rig} and `play(rig, events)`: the rig seeds the presenter's live state with
 * `syncHud` and names the engine to the presenter (`queuedEngine`), which is what `syncFullHud` and `atbMode` read.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BattleEvent, BattleState, Command, CombatantId } from '../../../src/battle/common/types.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { PresenterDeps } from '../../../src/engine/BattlePresenterPorts.ts';
import { FakeHud, FakeStage } from './FakeStage.ts';

export interface LogFile {
  girl: string;
  seed: number;
  source: string;
  events: BattleEvent[];
  state: { activeIds: string[]; combatants: Record<string, { side: string; aiMemory?: Record<string, unknown> }> };
}

export const loadLog = (name: string): LogFile => JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'fixtures', 'specials', 'logs', `${name}.json`), 'utf8')) as LogFile;

const GIRLS = ['yuna', 'rikku', 'paine'];

/** The log's state as the presenter reads it: the flag on, every combatant with the pools `captureVitals` needs, the girls on slots 0 to 2. */
export function stateOf(log: LogFile['state'], flags: Record<string, boolean> = { specialDressUp: true }): BattleState {
  const combatants: Record<string, unknown> = {};
  for (const [id, c] of Object.entries(log.combatants)) {
    combatants[id] = { id, name: id, side: c.side, slot: Math.max(0, GIRLS.indexOf(id)), spriteKey: id, hp: 100, mp: 10, alive: true, removed: false, flags: {}, stats: { maxHp: 100, maxMp: 10 }, statuses: {}, ...(c.aiMemory ? { aiMemory: c.aiMemory } : {}) };
  }
  return { game: 'ffx2', combatants, activeIds: [...log.activeIds], reserveIds: [], enemyIds: [], aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0, flags } as unknown as BattleState;
}

/** An FFX-2 engine that plays what it is given: `state()` is one mutable object, `nextDecision` hands the bursts out in order and then the end. */
export class ScriptedFfx2Engine {
  private s: BattleState;
  private next = 0;
  constructor(private readonly bursts: BattleEvent[][], state: BattleState, private readonly result: 'victory' | 'defeat' = 'victory') {
    this.s = state;
  }
  state(): BattleState { return this.s; }
  use(state: BattleState): void { this.s = state; }
  nextDecision(): { kind: 'resolved'; events: BattleEvent[] } | { kind: 'battle-over'; result: 'victory' | 'defeat' } {
    return this.next < this.bursts.length ? { kind: 'resolved', events: this.bursts[this.next++]! } : { kind: 'battle-over', result: this.result };
  }
  gaugeSnapshot(): { elapsedMs: number; bars: never[] } { return { elapsedMs: 0, bars: [] }; }
  atbMode(): 'wait' | 'active' { return 'wait'; }
  tick(): never { throw new Error('ScriptedFfx2Engine: tick'); }
  /** What `submit` answers: set it to hand out a burst for a command (the presenter's submit-side path); unset, `submit` throws as it always did. */
  onSubmit: ((command: Command) => BattleEvent[]) | null = null;
  submit(command: Command): BattleEvent[] {
    if (!this.onSubmit) throw new Error('ScriptedFfx2Engine: submit');
    return this.onSubmit(command);
  }
}

export interface Rig {
  presenter: BattlePresenter;
  stage: FakeStage;
  hud: FakeHud;
  engine: ScriptedFfx2Engine;
  /** Every sleep the presenter asked for, in ms as the presenter scaled them. */
  sleeps: number[];
  clock: { t: number };
  /** Make `log`'s state the engine's (the flag on) and reseed the presenter from it. */
  use(log: LogFile, flags?: Record<string, boolean>): void;
  /** Play `events` as one burst. */
  play(events: readonly BattleEvent[]): ReturnType<BattlePresenter['play']>;
}

export function rig(first: LogFile, deps: Partial<PresenterDeps> = {}, stageIn?: FakeStage): Rig {
  const stage = stageIn ?? new FakeStage([...GIRLS], ['bahamut']);
  const hud = new FakeHud();
  const clock = { t: 0 };
  const sleeps: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    hud,
    sleep: (ms) => {
      sleeps.push(ms);
      clock.t += ms;
      return Promise.resolve();
    },
    now: () => clock.t,
    ...deps,
  });
  const engine = new ScriptedFfx2Engine([], stateOf(first.state));
  const r: Rig = {
    presenter, stage, hud, engine, sleeps, clock,
    use(log, flags) {
      engine.use(stateOf(log.state, flags));
      presenter.syncHud(engine as never);
      (presenter as unknown as { queuedEngine: unknown }).queuedEngine = engine;
    },
    play: (events) => presenter.play([...events]),
  };
  r.use(first);
  return r;
}

/** The ids of a log's three-part form for `girl`: main, right, left. */
export const partsOf = (log: LogFile): [CombatantId, CombatantId, CombatantId] => log.state.activeIds.slice(0, 3) as [CombatantId, CombatantId, CombatantId];
