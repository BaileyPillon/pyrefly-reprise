// @vitest-environment jsdom
/**
 * **FFX-2 ready hold** (post-conference motion plan, step 2 "the flicker"; FFX-2 only, AGENTS.md rule 14).
 *
 * Under the ATB the girl's own command menu is open when she is asked (`BattlePresenter.chooseCommand` puts her on the `ready` painting). Her answer comes back as one burst,
 * `turn-start, action-start, ...` (`FFX2Engine.submit` -> `beginTurn` -> `performCommand`). The turn start used to reset her to `idle` (`BattlePresenterBeats.turnStart`) and the action's own
 * wind-up (`actionStart`: `windUp ? 'ready'`) put `ready` back about 90 ms later, so Chapter IV showed ready, idle, ready, attack: 22 times in one 6.3 minute fight, 295 of its 931 ghost frames.
 * The fix (`KeyPoses.readyCarriesIntoWindUp`) leaves her on `ready` when the very next event is her own action and that action opens on the wind-up anyway.
 * FFX is not touched: its turn start comes in a burst of its own, before the menu, with no action behind it.
 *
 * Two layers: the beat on its own with a stand-in stage (every case that must NOT hold is pinned), and the real `FFX2Engine`, chapter 4 data and the real presenter, whose pose calls are read back.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { turnStart } from '../../src/engine/BattlePresenterBeats.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { readyCarriesIntoWindUp, windUpOpens } from '../../src/engine/KeyPoses.ts';
import { setMotionMode } from '../../src/engine/PoseSwap.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

// ---------------------------------------------------------------------------------------------------------- the beat on its own

type Ev = Extract<BattleEvent, { type: 'turn-start' | 'action-start' }>;
const turn = (actorId: string): Ev => ({ seq: 0, type: 'turn-start', actorId, turn: 1, elapsedTicks: 0 }) as Ev;
const action = (actorId: string, kind: string, extra: Record<string, unknown> = {}): Ev =>
  ({ seq: 1, type: 'action-start', actorId, command: { kind, targets: ['bahamut'], ...extra }, targets: ['bahamut'] }) as unknown as Ev;

interface Opts {
  /** The game: the presenter sets `ffx2Framing` for an ATB engine only. */
  ffx2?: boolean;
  /** The painting the figure shows when the turn starts. */
  shows?: string;
  /** Paintings the figure has of its own. */
  own?: string[];
  reduce?: boolean;
  /** The events of the burst and which one is the turn start. */
  burst?: Ev[];
  /** A port that owns the wind-up (FF7's runner). */
  owns?: boolean;
  /** Who the figure is on the stage (`party` unless a foe is asked for). */
  side?: 'party' | 'enemy';
}

function beat(o: Opts = {}) {
  const set: string[] = [];
  const actor = { pose: o.shows ?? 'ready', setPose(p: string) { set.push(p); this.pose = p; } };
  const burst = o.burst ?? [turn('rikku'), action('rikku', 'attack')];
  const ctx = {
    sleep: () => Promise.resolve(),
    moments: { reducedMotion: o.reduce === true, shots: { ffx2Framing: o.ffx2 !== false }, turnStart: () => Promise.resolve() },
    stage: { paints: (_id: string, p: string) => (o.own ?? ['ready', 'attack']).includes(p), actor: () => actor, sideOf: () => o.side ?? 'party' },
    deps: { actionMotion: o.owns ? { ownsWindUp: () => true } : undefined },
    burst: { events: burst, at: 0 },
  } as unknown as EventCtx;
  return { ctx, set, actor, run: () => turnStart(ctx, 'rikku') };
}

afterEach(() => setMotionMode(null)); // the page switch is module state: every test reads the address again (no ?motion= in jsdom: the default, smooth)

describe('the turn start leaves a ready figure on ready when her attack opens on the wind-up', () => {
  it('holds: FFX-2, showing ready, next event her own attack, the wind-up painted', async () => {
    const b = beat();
    expect(readyCarriesIntoWindUp(b.ctx, 'rikku')).toBe(true);
    await b.run();
    expect(b.set).toEqual([]);
    expect(b.actor.pose).toBe('ready');
  });

  it('does not hold when the action is not an attack on the wind-up: a cast, an item, a defend, a foe, another figure, nothing behind the turn start', async () => {
    for (const kind of ['ability', 'item', 'defend', 'summon']) {
      const b = beat({ burst: [turn('rikku'), action('rikku', kind, { id: 'x' })] });
      await b.run();
      expect(b.set, kind).toEqual(['idle']);
    }
    const other = beat({ burst: [turn('rikku'), action('paine', 'attack')] });
    await other.run();
    expect(other.set).toEqual(['idle']);
    const alone = beat({ burst: [turn('rikku')] });
    await alone.run();
    expect(alone.set).toEqual(['idle']);
    const foe = beat({ side: 'enemy' });
    await foe.run();
    expect(foe.set).toEqual(['idle']); // the menu's ready is a party figure's: a foe is never held
  });

  it('does not hold outside the ATB (FFX, FF7 keep today)', async () => {
    const b = beat({ ffx2: false });
    expect(readyCarriesIntoWindUp(b.ctx, 'rikku')).toBe(false);
    await b.run();
    expect(b.set).toEqual(['idle']);
  });

  it('does not hold when the figure is not on ready (it keeps today: idle is put up)', async () => {
    for (const shows of ['idle', 'hurt', 'follow', 'attack']) {
      const b = beat({ shows });
      await b.run();
      expect(b.set, shows).toEqual(['idle']);
    }
  });

  it('does not hold without the wind-up painting, under REDUCE MOTION, or when the port owns the wind-up', async () => {
    const noReady = beat({ own: ['attack'] });
    await noReady.run();
    expect(noReady.set).toEqual(['idle']);
    const reduced = beat({ reduce: true });
    await reduced.run();
    expect(reduced.set).toEqual(['idle']);
    const owned = beat({ owns: true });
    await owned.run();
    expect(owned.set).toEqual(['idle']);
  });

  it('?motion=classic brings the old turn start back (the comparison word): ready, idle, then the action; smooth and the default hold', async () => {
    setMotionMode('classic');
    const old = beat();
    expect(readyCarriesIntoWindUp(old.ctx, 'rikku')).toBe(false);
    await old.run();
    expect(old.set).toEqual(['idle']);
    setMotionMode('smooth');
    const held = beat();
    await held.run();
    expect(held.set).toEqual([]);
    setMotionMode(null);
    expect(readyCarriesIntoWindUp(beat().ctx, 'rikku')).toBe(true);
  });

  it('windUpOpens is the one rule both readers share: the wind-up leads unless a port owns it or the figure has no ready or REDUCE MOTION is on', () => {
    const attack = action('rikku', 'attack') as Extract<BattleEvent, { type: 'action-start' }>;
    expect(windUpOpens(beat().ctx, attack, 'attack')).toBe(true);
    expect(windUpOpens(beat().ctx, attack, 'cast')).toBe(false); // only an attack opens on the wind-up
    expect(windUpOpens(beat({ owns: true }).ctx, attack, 'attack')).toBe(false);
    expect(windUpOpens(beat({ own: ['attack'] }).ctx, attack, 'attack')).toBe(false);
    expect(windUpOpens(beat({ reduce: true }).ctx, attack, 'attack')).toBe(false);
  });

  it('is false with no burst (an event played alone) and for an unknown figure', () => {
    const b = beat();
    (b.ctx as { burst?: unknown }).burst = undefined;
    expect(readyCarriesIntoWindUp(b.ctx, 'rikku')).toBe(false);
    const gone = beat();
    (gone.ctx.stage as unknown as { actor: () => unknown }).actor = () => undefined;
    expect(readyCarriesIntoWindUp(gone.ctx, 'rikku')).toBe(false);
  });
});

// ------------------------------------------------------------------------------------- the real engine and the real presenter

/** A stage whose girls paint the wind-up and the strike (the release 64 key paintings), so the wind-up leads. */
class PaintingStage extends FakeStage {
  constructor(party: CombatantId[], enemies: CombatantId[], private readonly own: readonly string[]) {
    super(party, enemies);
  }
  paints(id: CombatantId, pose: string): boolean {
    return this.sideOf(id) === 'party' && this.own.includes(pose);
  }
}

interface Played {
  /** Every pose call in order, with the virtual clock (ms) it was made at. */
  poses: Array<{ pose: string; id: string; at: number }>;
  /** The girls the HUD was asked about. */
  asked: CombatantId[];
  /** What each answer was: `attack` or another kind. */
  answered: Array<{ id: CombatantId; kind: string }>;
}

/** Play the real fight until `answers` commands have been answered. Everyone attacks the first foe, except Yuna, who casts the first spell the menu offers. */
async function play(answers: number, own: readonly string[], reduceMotion = false): Promise<Played> {
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'active' }));
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  const state = engine.state();
  let clock = 0;
  const stage = new PaintingStage([...state.activeIds], [...state.enemyIds], own);
  const played: Played = { poses: [], asked: [], answered: [] };
  const calls = stage.calls;
  const push = calls.push.bind(calls);
  calls.push = (...items: string[]): number => {
    for (const c of items) {
      const m = /^pose=([^:]+):(.+)$/.exec(c);
      if (m) played.poses.push({ pose: m[1]!, id: m[2]!, at: clock });
    }
    return push(...items);
  };
  const hud: HudPort = {
    mount() {},
    unmount() {},
    sync() {},
    syncGauges() {},
    setVisible() {},
    setProjector() {},
    setAtbMode() {},
    onMenuLevel: () => () => undefined,
    openMinigame: () => new Promise<never>(() => undefined),
    chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
      played.asked.push(actorId);
      const row =
        actorId === 'yuna'
          ? commands.find((c) => c.enabled && c.command.kind === 'ability' && c.validTargets.length > 0) ?? commands.find((c) => c.enabled && c.command.kind === 'attack')
          : commands.find((c) => c.enabled && c.command.kind === 'attack');
      if (!row || played.answered.length >= answers) return new Promise<Command>(() => undefined);
      played.answered.push({ id: actorId, kind: row.command.kind });
      return Promise.resolve({ ...row.command, targets: [row.validTargets[0]!] } as Command);
    },
    onEvent(_event: BattleEvent) {},
  };
  const presenter = new BattlePresenter({
    stage,
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    ...(reduceMotion ? { moments: { letterbox: async () => undefined, nameSlab: async () => undefined, vignette: () => undefined, clear: () => undefined, reduceMotion: () => true } } : {}),
    sleep: (ms) => {
      clock += ms;
      return Promise.resolve();
    },
    now: () => clock,
  } as ConstructorParameters<typeof BattlePresenter>[0]);
  void presenter.run(engine);
  for (let i = 0; i < 600_000 && !(played.answered.length >= answers && played.asked.length > answers + 1); i++) await Promise.resolve();
  return played;
}

/** The poses one figure was given, in order. */
const posesOf = (p: Played, id: string): string[] => p.poses.filter((x) => x.id === id).map((x) => x.pose);

/** Every ready, idle, ready among consecutive pose calls of one figure: the flicker, read from the calls (the harness reads it from the frames). */
function flickers(p: Played): Array<{ id: string; at: number; gapMs: number }> {
  const out: Array<{ id: string; at: number; gapMs: number }> = [];
  for (const id of new Set(p.poses.map((x) => x.id))) {
    const mine = p.poses.filter((x) => x.id === id);
    for (let i = 0; i + 2 < mine.length; i++) {
      if (mine[i]!.pose === 'ready' && mine[i + 1]!.pose === 'idle' && mine[i + 2]!.pose === 'ready') out.push({ id, at: mine[i + 1]!.at, gapMs: mine[i + 2]!.at - mine[i + 1]!.at });
    }
  }
  return out;
}

describe('the real FFX-2 engine and presenter: a girl who attacks from her menu', () => {
  it('goes from the menu\'s ready straight into the attack: no ready, idle, ready', async () => {
    const p = await play(8, ['ready', 'attack', 'follow']);
    const attacks = p.answered.filter((a) => a.kind === 'attack');
    expect(attacks.length).toBeGreaterThanOrEqual(3); // not a vacuous run
    expect(flickers(p)).toEqual([]);
    // and the strike still plays: every attacking girl ends on follow, then idle (nothing else about her sequence changed)
    for (const id of new Set(attacks.map((a) => a.id))) {
      const seq = posesOf(p, id);
      expect(seq.join(' '), id).toContain('ready ready follow idle');
    }
  });

  it('a spell still goes ready, idle, cast: the hold is for the attack that opens on the wind-up only', async () => {
    const p = await play(10, ['ready', 'attack', 'follow']);
    expect(p.answered.some((a) => a.id === 'yuna' && a.kind === 'ability')).toBe(true);
    const yuna = posesOf(p, 'yuna').join(' ');
    expect(yuna).toContain('ready idle cast');
  });

  it('under REDUCE MOTION nothing changes: ready, idle, then the attack (no wind-up leads, so no hold)', async () => {
    const p = await play(8, ['ready', 'attack', 'follow'], true);
    expect(flickers(p)).toEqual([]);
    const rikku = posesOf(p, 'rikku').join(' ');
    expect(rikku).toContain('ready idle attack');
  });

  it('a girl with no wind-up painting is not held either (today\'s sequence)', async () => {
    const p = await play(8, ['attack', 'follow']);
    const rikku = posesOf(p, 'rikku').join(' ');
    expect(rikku).toContain('ready idle attack');
  });
});
