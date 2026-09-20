/**
 * **The status rows must not lie about who is alive.** Critic round 03 #9
 * (BLOCKER, "a panel gives the player wrong information"), pinned.
 *
 * Measured live on Build A (`critic/rounds/round-03/b-ko2.mjs`, `ko2.json`,
 * sampled every 200 ms): the engine had logged `{type:'ko', targetId:'yuna'}`
 * while the rendered party row still read `Yuna 711 / 1500` **in living
 * colours for 2145 ms**, and the 789 damage numeral was on screen at 1901 ms
 * while the row still read 1500/1500 — it did not reach 711 until 6395 ms, a
 * 4.5 s lag behind its own hit.
 *
 * The cause was not a queue backlog and not a hold time. `BattlePresenter` has
 * no queue: it awaits one event's animation, then the next. The only `syncHud`
 * in the loop ran **after a whole burst had finished animating**, so for the
 * entire length of a command — `action-start → damage → ko → action-end →
 * message` — the HUD was still drawing the numbers from before the command.
 *
 * ## How this file measures it
 *
 * A fake clock: `sleep(ms)` advances a counter and resolves immediately, so a
 * whole real battle plays in microseconds while every beat still "takes" its
 * real duration. `HudPort.onEvent` is called by the presenter immediately
 * before it plays an event, so it stamps each event's start; every `sync` and
 * `syncVitals` stamps what the rows were showing at that moment. The lag of an
 * event is then *presentation time minus impact time*, in the presenter's own
 * milliseconds — the same quantity `ko2.json` sampled live.
 *
 * The bound is **250 ms at normal speed** (the brief's number; the shortest
 * beat the table holds a frame for is `TIMING.hitStop` at 85 ms, so 250 leaves
 * room for a beat to be entered and still fail on a burst-sized lag).
 *
 * Every one of these assertions fails on the code before
 * `BattlePresenterVitals.ts`: the observed KO lag there is the remainder of the
 * burst, 700–3000 fake-clock ms.
 *
 * ## Which game
 *
 * **Both.** This is shared playback plumbing — one `BattlePresenter` drives
 * FFX's CTB engine and FFX-2's ATB engine through the same `play()` — so
 * AGENTS.md rule 14 / `critic/CHECKS.md` CHK-020 make it a "both" change, and
 * the whole suite below runs twice: Chapter 1 (Seymour Flux, FFX) and
 * Chapter 4 (Bahamut, FFX-2), against the shipped data layer and the real
 * engines. Nothing here is game-specific, and the last test asserts that: the
 * bound holds with the *same* number for both engines, so a future fix that
 * only reached one game would turn this file red.
 */

import { describe, expect, it } from 'vitest';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  TurnPreview,
} from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import {
  FakeAudio,
  FakeCutscenes,
  FakeDamageNumbers,
  FakeMessageBar,
  FakeStage,
} from './helpers/FakeStage.ts';

/** The bound from the brief: a row may trail its own hit by this much, no more. */
const LAG_BOUND_MS = 250;

/** Hard stop, so a battle that will not end cannot hang the suite. */
const MAX_EVENTS = 6_000;

// --------------------------------------------------------------- the clock

interface Clock {
  now: number;
  sleep(ms: number): Promise<void>;
}

/**
 * A clock that never actually waits.
 *
 * The presenter has already scaled `ms` by the playback speed and `timeScale`
 * by the time it reaches here, so `now` is presentation milliseconds at the
 * speed the battle is being played at — which at `'normal'` is wall-clock ms.
 */
function fakeClock(): Clock {
  const clock: Clock = {
    now: 0,
    sleep(ms: number): Promise<void> {
      clock.now += ms;
      return Promise.resolve();
    },
  };
  return clock;
}

// ------------------------------------------------------------------ the HUD

/** One combatant's displayed numbers at one instant. */
interface Shown {
  hp: number;
  alive: boolean;
}

interface Observation {
  at: number;
  /** `'sync'` = the full end-of-burst render; `'vitals'` = the per-hit one. */
  kind: 'sync' | 'vitals';
  rows: Map<CombatantId, Shown>;
}

/**
 * A HUD that draws nothing and records everything it was told to draw.
 *
 * It reads exactly what a status row reads — `state.combatants[id].hp` and
 * `.alive` — so an assertion here is an assertion about the pixels.
 */
class RecordingHud implements HudPort {
  readonly observations: Observation[] = [];
  /**
   * Every event, stamped the instant before it is played, with what the rows
   * were showing at that instant and where the observation log had reached.
   *
   * Both of those matter: the presenter renders the rows for an event *at the
   * same clock reading* the event started on (there is no sleep in between,
   * which is the whole point), so "what was on screen before this hit" has to
   * be taken by position in the log, not by timestamp.
   */
  readonly starts: Array<{
    at: number;
    obs: number;
    before: Map<CombatantId, Shown>;
    event: BattleEvent;
  }> = [];
  private readonly current = new Map<CombatantId, Shown>();
  private events = 0;

  constructor(
    private readonly clock: Clock,
    private readonly onOverrun: () => void,
  ) {}

  mount(): void {}
  unmount(): void {}

  sync(state: BattleState): void {
    this.record(state, 'sync');
  }

  syncVitals(state: BattleState): void {
    this.record(state, 'vitals');
  }

  onEvent(event: BattleEvent): void {
    this.starts.push({
      at: this.clock.now,
      obs: this.observations.length,
      before: new Map(this.current),
      event,
    });
    this.events += 1;
    if (this.events > MAX_EVENTS) this.onOverrun();
  }

  async chooseCommand(): Promise<Command> {
    throw new Error('RecordingHud: the run is auto-played; no menu should open');
  }
  async openMinigame(): Promise<never> {
    throw new Error('RecordingHud: minigames are auto-resolved in this run');
  }
  setVisible(): void {}
  setProjector(): void {}

  private record(state: BattleState, kind: Observation['kind']): void {
    const rows = new Map<CombatantId, Shown>();
    for (const id of Object.keys(state.combatants) as CombatantId[]) {
      const c = state.combatants[id];
      if (!c) continue;
      const shown: Shown = { hp: c.hp, alive: c.alive };
      rows.set(id, shown);
      this.current.set(id, shown);
    }
    this.observations.push({ at: this.clock.now, kind, rows });
  }

  /**
   * How long after an event started the rows first satisfied `pred` for `id`,
   * counting only what was drawn from that event onward. `Infinity` if the rows
   * never said it at all.
   */
  lagUntil(
    start: { at: number; obs: number },
    id: CombatantId,
    pred: (s: Shown) => boolean,
  ): number {
    for (let i = start.obs; i < this.observations.length; i += 1) {
      const o = this.observations[i]!;
      const row = o.rows.get(id);
      if (row && pred(row)) return o.at - start.at;
    }
    return Infinity;
  }
}

// --------------------------------------------------------------- the engines

function ffxEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['seymour-flux'];
  if (!group) throw new Error('the seymour-flux group is missing from the FFX data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party: gagazetBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

function ffx2Engine(seed: number) {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  const group = ffx2data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('the ffx2-bahamut group is missing from the FFX-2 data layer');
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: bevelleBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

// ------------------------------------------------------------------ the run

interface Run {
  hud: RecordingHud;
  clock: Clock;
  finalState: BattleState;
}

/** Auto-play one real encounter through the real presenter on the fake clock. */
async function playChapter(game: 'ffx' | 'ffx2', seed: number): Promise<Run> {
  const engine = game === 'ffx' ? ffxEngine(seed) : ffx2Engine(seed);
  const state = engine.state();
  const stage = new FakeStage([...state.activeIds], [...state.enemyIds]);
  const clock = fakeClock();
  let presenter: BattlePresenter | null = null;
  const hud = new RecordingHud(clock, () => presenter?.abort());
  presenter = new BattlePresenter({
    stage,
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: (ms) => clock.sleep(ms),
  });
  presenter.setAutoPlay(intendedStrategy);
  await presenter.run(engine as never);
  return { hud, clock, finalState: engine.state() };
}

// ------------------------------------------------------------------ the case

const CHAPTERS: Array<{ label: string; game: 'ffx' | 'ffx2'; seed: number }> = [
  { label: 'Chapter 1 — Seymour Flux (FFX, CTB)', game: 'ffx', seed: 20260920 },
  { label: 'Chapter 4 — Bahamut (FFX-2, ATB)', game: 'ffx2', seed: 20260920 },
];

describe.each(CHAPTERS)('presentation keeps up with the engine — $label', ({ game, seed }) => {
  it('paints a KO on the row within 250 ms of the ko event, never 2145 ms later', async () => {
    const { hud } = await playChapter(game, seed);

    const kos = hud.starts.filter((s) => s.event.type === 'ko');
    expect(kos.length).toBeGreaterThan(0);

    const late = kos
      .map((s) => {
        const id = (s.event as Extract<BattleEvent, { type: 'ko' }>).targetId;
        return { id, lag: hud.lagUntil(s, id, (row) => !row.alive) };
      })
      .filter((l) => l.lag > LAG_BOUND_MS);

    expect(late.map((l) => `${l.id} drawn alive for ${l.lag} ms after its ko event`)).toEqual([]);
  });

  it('a KO\'d character is never drawn with hit points left', async () => {
    const { hud } = await playChapter(game, seed);

    const kos = hud.starts.filter((s) => s.event.type === 'ko');
    const wrong = kos
      .map((s) => {
        const id = (s.event as Extract<BattleEvent, { type: 'ko' }>).targetId;
        return { id, lag: hud.lagUntil(s, id, (row) => row.hp === 0) };
      })
      .filter((x) => x.lag > LAG_BOUND_MS);

    // This is literally the "Yuna 711 / 1500 in living colours" reading.
    expect(wrong.map((w) => `${w.id} still showed hit points ${w.lag} ms after its ko`)).toEqual([]);
  });

  it('moves the bar with the blow: every damage event lands on the row within 250 ms', async () => {
    const { hud } = await playChapter(game, seed);

    const hits = hud.starts.filter(
      (s) => s.event.type === 'damage' && (s.event as Extract<BattleEvent, { type: 'damage' }>).amount > 0,
    );
    expect(hits.length).toBeGreaterThan(10);

    const late: string[] = [];
    for (const start of hits) {
      const dmg = start.event as Extract<BattleEvent, { type: 'damage' }>;
      const before = start.before.get(dmg.targetId);
      // A target already at 0, or one the rows have not drawn yet (an enemy
      // that joined mid-fight), carries no claim about a bar moving.
      if (!before || before.hp === 0) continue;
      // `amount` is the signed HP delta the engine applied (types.ts), so this
      // is the event's own arithmetic, not the presenter's.
      const want = Math.max(0, before.hp - dmg.amount);
      const lag = hud.lagUntil(start, dmg.targetId, (row) => row.hp === want);
      if (lag > LAG_BOUND_MS) late.push(`${dmg.targetId} -${dmg.amount} shown ${lag} ms late`);
    }

    expect(late.slice(0, 5)).toEqual([]);
  });

  it('does not accumulate lag: turn 40 is as prompt as turn 5', async () => {
    const { hud } = await playChapter(game, seed);

    // Bucket every visible event by the turn it played on, using the engine's
    // own `turn-start` events as the boundary.
    let turn = 0;
    const lagByTurn = new Map<number, number[]>();
    for (const start of hud.starts) {
      const event = start.event;
      if (event.type === 'turn-start') turn = event.turn;
      if (event.type !== 'damage' && event.type !== 'ko') continue;
      const before = start.before.get(event.targetId);
      if (!before) continue;
      const want =
        event.type === 'ko'
          ? (s: Shown) => !s.alive
          : (s: Shown) => s.hp === Math.max(0, before.hp - event.amount);
      const lag = hud.lagUntil(start, event.targetId, want);
      if (!Number.isFinite(lag)) continue;
      const bucket = lagByTurn.get(turn) ?? [];
      bucket.push(lag);
      lagByTurn.set(turn, bucket);
    }

    const turns = [...lagByTurn.keys()].sort((a, b) => a - b);
    expect(turns.length).toBeGreaterThan(5);
    const worst = (t: number): number => Math.max(...(lagByTurn.get(t) ?? [0]));

    // Early and late in the same fight, measured the same way. The brief asks
    // for turn 5 and turn 40; a chapter that ends before turn 40 is measured at
    // its own last turn instead, which is the same claim.
    const early = turns.find((t) => t >= 5) ?? turns[0]!;
    const late = [...turns].reverse().find((t) => t >= 40) ?? turns[turns.length - 1]!;
    expect(worst(early)).toBeLessThanOrEqual(LAG_BOUND_MS);
    expect(worst(late)).toBeLessThanOrEqual(LAG_BOUND_MS);

    // And the whole fight, so a single bad turn in the middle cannot hide.
    const all = [...lagByTurn.values()].flat();
    expect(Math.max(...all)).toBeLessThanOrEqual(LAG_BOUND_MS);
  });

  it('never runs ahead of the engine either, and ends agreeing with it exactly', async () => {
    const { hud, finalState } = await playChapter(game, seed);

    const last = hud.observations[hud.observations.length - 1];
    expect(last).toBeTruthy();
    const mismatched: string[] = [];
    for (const id of Object.keys(finalState.combatants) as CombatantId[]) {
      const c = finalState.combatants[id];
      const row = last!.rows.get(id);
      if (!c || !row) continue;
      if (row.hp !== c.hp || row.alive !== c.alive) {
        mismatched.push(`${id}: row ${row.hp}/${row.alive} vs engine ${c.hp}/${c.alive}`);
      }
    }
    expect(mismatched).toEqual([]);

    // Running *early* is the same lie pointing the other way: a character must
    // not be drawn dead before the blow that kills them has been played. For
    // every ko event, the rows must still have shown that combatant alive at
    // the instant before it started.
    const tooEarly: string[] = [];
    for (const start of hud.starts) {
      const event = start.event;
      if (event.type !== 'ko') continue;
      const before = start.before.get(event.targetId);
      if (before && !before.alive) {
        tooEarly.push(`${event.targetId} was drawn dead before its ko event`);
      }
    }
    expect(tooEarly).toEqual([]);
  });
});

describe('the fix is shared plumbing, not a game-specific rule (AGENTS.md rule 14)', () => {
  it('both engines drive the same per-hit row update through the same port', async () => {
    const ffx = await playChapter('ffx', 20260920);
    const ffx2 = await playChapter('ffx2', 20260920);

    // The per-hit path (`syncVitals`) is exercised in both games — not a branch
    // one of them takes and the other does not.
    const perHit = (r: Run): number => r.hud.observations.filter((o) => o.kind === 'vitals').length;
    expect(perHit(ffx)).toBeGreaterThan(0);
    expect(perHit(ffx2)).toBeGreaterThan(0);

    // And the ordinary end-of-burst sync still happens in both: the per-hit
    // render is additive, and it is the full sync that re-grounds the
    // projection in the engine's own numbers.
    const full = (r: Run): number => r.hud.observations.filter((o) => o.kind === 'sync').length;
    expect(full(ffx)).toBeGreaterThan(0);
    expect(full(ffx2)).toBeGreaterThan(0);
  });

  it('a HUD that does not implement the per-hit render still plays a whole battle', async () => {
    // `syncVitals` is optional on `HudPort` (every mock screen and test double
    // wants the old behaviour). A presenter handed one must not throw.
    const engine = ffxEngine(20260920);
    const state = engine.state();
    const clock = fakeClock();
    const seen: number[] = [];
    const hud: HudPort = {
      mount() {},
      unmount() {},
      sync(s: BattleState, _p: TurnPreview[] | AtbSnapshot) {
        seen.push(s.log.length);
      },
      onEvent() {},
      async chooseCommand(_a: CombatantId, _c: AvailableCommand[]): Promise<Command> {
        throw new Error('auto-played');
      },
      async openMinigame(): Promise<never> {
        throw new Error('auto-resolved');
      },
      setVisible() {},
      setProjector() {},
    };
    const presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: (ms) => clock.sleep(ms),
    });
    presenter.setAutoPlay(intendedStrategy);

    const outcome = await presenter.run(engine as never);

    expect(['victory', 'defeat', 'aborted']).toContain(outcome.kind);
    expect(seen.length).toBeGreaterThan(0);
  });
});
