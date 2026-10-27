// @vitest-environment jsdom
/**
 * **FFX-2 turn-start interlude, MF-01 of the motion-fluidity plan** (lane L1; FFX-2 only, AGENTS.md rule 14; no look change, ON by default).
 *
 * post-flicker held a girl's menu `ready` through the turn start into her own ATTACK (`ffx2-ready-hold.test.ts`). The other 37 interludes of Chapter IV were her own spell (31) and item (5):
 * `ready, idle` for 90 ms, then `cast`, two dissolves in 0.2 s. `KeyPoses.readyCarriesIntoCastOrItem` extends the hold to them: the pose she opens on replaces `ready` with one blend.
 *
 * Two layers: the beat on its own with a stand-in stage (every case that must NOT hold), and the real `FFX2Engine`, chapter 4 data and the real presenter, whose pose calls are read back.
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
import { readyCarriesIntoCastOrItem } from '../../src/engine/KeyPoses.ts';
import { setInterludeMode } from '../../src/engine/motion/SwapSwitch.ts';
import { setMotionMode } from '../../src/engine/PoseSwap.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

afterEach(() => {
  setInterludeMode(null);
  setMotionMode(null);
});

type Ev = Extract<BattleEvent, { type: 'turn-start' | 'action-start' }>;
const turn = (actorId: string): Ev => ({ seq: 0, type: 'turn-start', actorId, turn: 1, elapsedTicks: 0 }) as Ev;
const action = (actorId: string, kind: string, extra: Record<string, unknown> = {}): Ev =>
  ({ seq: 1, type: 'action-start', actorId, command: { kind, targets: ['bahamut'], ...extra }, targets: ['bahamut'] }) as unknown as Ev;

interface Opts {
  ffx2?: boolean;
  shows?: string;
  own?: string[];
  reduce?: boolean;
  burst?: Ev[];
  side?: 'party' | 'enemy';
}

function beat(o: Opts = {}) {
  const set: string[] = [];
  const actor = { pose: o.shows ?? 'ready', setPose(p: string) { set.push(p); this.pose = p; } };
  const burst = o.burst ?? [turn('yuna'), action('yuna', 'ability', { id: 'fire' })];
  const ctx = {
    sleep: () => Promise.resolve(),
    moments: { reducedMotion: o.reduce === true, shots: { ffx2Framing: o.ffx2 !== false }, turnStart: () => Promise.resolve() },
    stage: { paints: (_id: string, p: string) => (o.own ?? ['ready', 'attack', 'cast', 'item']).includes(p), actor: () => actor, sideOf: () => o.side ?? 'party' },
    deps: {},
    burst: { events: burst, at: 0 },
  } as unknown as EventCtx;
  return { ctx, set, actor, run: () => turnStart(ctx, 'yuna') };
}

describe('the turn start leaves a ready girl on ready when her own spell or item opens next', () => {
  it('holds for a spell and for an item when she has the painting of it', async () => {
    for (const kind of ['ability', 'item']) {
      const b = beat({ burst: [turn('yuna'), action('yuna', kind, { id: 'x' })] });
      expect(readyCarriesIntoCastOrItem(b.ctx, 'yuna'), kind).toBe(true);
      await b.run();
      expect(b.set, kind).toEqual([]);
      expect(b.actor.pose).toBe('ready');
    }
  });

  it('does not hold for a defend, a summon, a dressphere change or an Overdrive (they keep today\'s idle)', async () => {
    for (const kind of ['defend', 'summon', 'spherechange']) {
      const b = beat({ burst: [turn('yuna'), action('yuna', kind, { id: 'x' })] });
      await b.run();
      expect(b.set, kind).toEqual(['idle']);
    }
  });

  it('does not hold without her painting of that pose (it would resolve to the idle anyway), nor under REDUCE MOTION', async () => {
    const noCast = beat({ own: ['ready', 'attack'] });
    await noCast.run();
    expect(noCast.set).toEqual(['idle']);
    const noItem = beat({ own: ['ready', 'cast'], burst: [turn('yuna'), action('yuna', 'item', { id: 'x' })] });
    await noItem.run();
    expect(noItem.set).toEqual(['idle']);
    const reduced = beat({ reduce: true });
    await reduced.run();
    expect(reduced.set).toEqual(['idle']);
  });

  it('does not hold outside FFX-2, for a foe, for another figure\'s action, when she is not on ready, or with nothing behind the turn start', async () => {
    const ffx = beat({ ffx2: false });
    await ffx.run();
    expect(ffx.set).toEqual(['idle']);
    const foe = beat({ side: 'enemy' });
    await foe.run();
    expect(foe.set).toEqual(['idle']);
    const other = beat({ burst: [turn('yuna'), action('paine', 'ability', { id: 'x' })] });
    await other.run();
    expect(other.set).toEqual(['idle']);
    for (const shows of ['idle', 'hurt', 'cast']) {
      const b = beat({ shows });
      await b.run();
      expect(b.set, shows).toEqual(['idle']);
    }
    const alone = beat({ burst: [turn('yuna')] });
    await alone.run();
    expect(alone.set).toEqual(['idle']);
  });

  it('?interlude=attack is post-flicker\'s attack-only hold: a spell keeps ready, idle, cast', async () => {
    setInterludeMode('attack');
    const b = beat();
    expect(readyCarriesIntoCastOrItem(b.ctx, 'yuna')).toBe(false);
    await b.run();
    expect(b.set).toEqual(['idle']);
  });

  it('?motion=classic brings back the old turn start, spells included (post-flicker comparison word)', async () => {
    setMotionMode('classic');
    const b = beat();
    expect(readyCarriesIntoCastOrItem(b.ctx, 'yuna')).toBe(false);
    await b.run();
    expect(b.set).toEqual(['idle']);
  });
});

// ------------------------------------------------------------------------------------- the real engine and the real presenter

class PaintingStage extends FakeStage {
  constructor(party: CombatantId[], enemies: CombatantId[], private readonly own: readonly string[]) {
    super(party, enemies);
  }
  paints(id: CombatantId, pose: string): boolean {
    return this.sideOf(id) === 'party' && this.own.includes(pose);
  }
}

interface Played {
  poses: Array<{ pose: string; id: string; at: number }>;
  asked: CombatantId[];
  answered: Array<{ id: CombatantId; kind: string }>;
}

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

const posesOf = (p: Played, id: string): string[] => p.poses.filter((x) => x.id === id).map((x) => x.pose);

/** Every `ready, idle, X` among one figure's consecutive pose calls: the interlude, read from the calls (the harness reads it from the frames). */
function interludes(p: Played): Array<{ id: string; to: string; gapMs: number }> {
  const out: Array<{ id: string; to: string; gapMs: number }> = [];
  for (const id of new Set(p.poses.map((x) => x.id))) {
    const mine = p.poses.filter((x) => x.id === id);
    for (let i = 0; i + 2 < mine.length; i++) {
      if (mine[i]!.pose === 'ready' && mine[i + 1]!.pose === 'idle') out.push({ id, to: mine[i + 2]!.pose, gapMs: mine[i + 2]!.at - mine[i + 1]!.at });
    }
  }
  return out;
}

describe('the real FFX-2 engine and presenter: a girl who casts from her menu', () => {
  it('goes from the menu\'s ready straight into the cast: no ready, idle, cast', async () => {
    const p = await play(10, ['ready', 'attack', 'follow', 'cast', 'item']);
    expect(p.answered.some((a) => a.id === 'yuna' && a.kind === 'ability')).toBe(true); // not a vacuous run
    expect(interludes(p)).toEqual([]);
    const yuna = posesOf(p, 'yuna').join(' ');
    expect(yuna).toContain('ready cast');
    expect(yuna).not.toContain('ready idle cast');
  });

  it('with ?interlude=attack the same fight is post-flicker\'s: the spell still goes ready, idle, cast', async () => {
    setInterludeMode('attack');
    const p = await play(10, ['ready', 'attack', 'follow', 'cast', 'item']);
    expect(posesOf(p, 'yuna').join(' ')).toContain('ready idle cast');
    expect(interludes(p).filter((i) => i.to === 'cast').length).toBeGreaterThan(0);
  });

  it('under REDUCE MOTION nothing changes: ready, idle, then the spell', async () => {
    const p = await play(10, ['ready', 'attack', 'follow', 'cast', 'item'], true);
    expect(posesOf(p, 'yuna').join(' ')).toContain('ready idle cast');
  });

  it('a girl with no cast painting is not held (today\'s sequence)', async () => {
    const p = await play(10, ['ready', 'attack', 'follow']);
    expect(posesOf(p, 'yuna').join(' ')).toContain('ready idle cast');
  });
});
