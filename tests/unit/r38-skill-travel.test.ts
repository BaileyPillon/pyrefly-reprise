/**
 * r38-motion SKILL TRAVEL (D-354; both games, presentation only): a spell, skill or shot leaves its caster at the
 * action's first blow, and the blow's numeral and HP rows wait for it. These are the rules the browser pass cannot
 * show one at a time: what flies, when it leaves, what is held and for how long, and every way the look stays off
 * (REDUCE MOTION, skip, an open FFX-2 command menu, a switched-off look, a stage that declines).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { AbilityFacts, MomentsPort, PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { setEyeCandyProvider } from '../../src/engine/fx/eyeCandyFlags.ts';
import { blowHeld, FLIGHT_MS, flightKind, planSkill } from '../../src/engine/motion/SkillTravel.ts';
import { motionAllowed } from '../../src/engine/motion/MotionGate.ts';
import { FakeHud, FakeStage } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
type Ev = Unsequenced<BattleEvent>;

afterEach(() => {
  eyeCandy.setSub('skilltravel', true);
  eyeCandy.setSub('runin', true);
  setEyeCandyProvider(null);
});

const cast = (actorId: string, abilityId: string, targets: string[]): Ev => ({ type: 'action-start', actorId, command: { kind: 'ability', id: abilityId, targets } as never, abilityId, abilityName: abilityId, targets });
const blow = (targetId: string, sourceId: string | undefined, amount = 700, hitIndex = 0, hitCount = 1): Ev =>
  ({ type: 'damage', targetId, ...(sourceId ? { sourceId } : {}), amount, element: 'lightning', crit: false, hitIndex, hitCount }) as Ev;
const end = (actorId: string): Ev => ({ type: 'action-end', actorId });

const FACTS: Record<string, AbilityFacts> = {
  thunder: { damageType: 'magical', formula: 'magic' },
  cure: { damageType: 'magical', formula: 'healing' },
  'power-break': { damageType: 'physical', formula: 'strength' },
  'x2-dark-knight-darkness': { damageType: 'other', formula: 'piercing-strength' },
  'x2-gunner-shoot': { damageType: 'physical', formula: 'strength' },
};

interface Rig {
  log: string[];
  travels: Array<{ from: string; to: string; kind: string; ms: number }>;
  play(events: Ev[]): Promise<unknown>;
  presenter: BattlePresenter;
  stage: FakeStage;
  /** Resolve every flight now (the layer's clock reached the landing). */
  land(): void;
}

function setup(o: { speed?: PlaybackSpeed; reduce?: boolean; ffx2?: boolean; spectacle?: boolean; decline?: boolean; mark?: number; longRange?: string[]; strikeAfter?: number } = {}): Rig {
  const log: string[] = [];
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['seymour-flux', 'mortiorchis']);
  (stage as unknown as { fx?: { enabled(): boolean } }).fx = o.spectacle === false ? undefined : { enabled: () => true };
  const travels: Rig['travels'] = [];
  const pending: Array<() => void> = [];
  stage.vfx.travel = (from, to, p) => {
    if (o.decline) return { ms: 0, landed: Promise.resolve() };
    travels.push({ from, to, kind: p.kind, ms: p.ms });
    log.push(`travel:${from}>${to}:${p.kind}`);
    return { ms: p.ms, landed: new Promise<void>((res) => pending.push(() => (log.push(`landed:${to}`), res()))) };
  };
  stage.vfx.canTravel = () => o.decline !== true;
  let strikeIn = o.strikeAfter ?? 0; // effect-clock ms still to run before the spell's strike is drawn
  stage.vfx.land = (at) => (log.push(`land:${at}`), o.mark ?? 420);
  stage.vfx.markIn = () => {
    const left = strikeIn;
    strikeIn = Math.max(0, strikeIn - 40);
    return left;
  };
  const moments: MomentsPort = {
    letterbox: async () => undefined,
    nameSlab: async () => undefined,
    vignette: () => undefined,
    clear: () => undefined,
    reduceMotion: () => o.reduce === true,
  };
  const hud = new FakeHud();
  hud.onEvent = (e) => {
    log.push(`hud:${e.type}${e.type === 'damage' || e.type === 'miss' ? `:${(e as { targetId: string }).targetId}` : ''}`);
  };
  const presenter = new BattlePresenter({
    stage,
    hud,
    moments,
    abilityFacts: (id) => FACTS[id],
    // A flight takes one sleep of the game's own length, the way the layer's clock would: resolved by `land()` below.
    sleep: async (ms) => {
      if (ms > 0) log.push(`sleep:${Math.round(ms)}`);
      // Every wait lets the flights that were launched land, as the frames between would.
      if (pending.length) for (const f of pending.splice(0)) f();
    },
    actionMotion: o.longRange
      ? { open: () => undefined, close: () => undefined, longRange: (id: string) => o.longRange!.includes(id) }
      : null,
  });
  presenter.moments.shots.ffx2Framing = o.ffx2 === true;
  if (o.speed) presenter.setSpeed(o.speed);
  return {
    log,
    travels,
    stage,
    presenter,
    play: (events) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)),
    land: () => void pending.splice(0).forEach((f) => f()),
  };
}

describe('what flies', () => {
  it('sends a spell from its caster at the first blow on a foe, not at action-start', async () => {
    const r = setup();
    await r.play([cast('yuna', 'thunder', ['seymour-flux']), blow('seymour-flux', 'yuna'), end('yuna')]);
    expect(r.travels).toEqual([{ from: 'yuna', to: 'seymour-flux', kind: 'orb', ms: FLIGHT_MS.orb }]);
    const t = r.log.indexOf('travel:yuna>seymour-flux:orb');
    expect(t).toBeGreaterThan(r.log.indexOf('sleep:380')); // after the opening wait (TIMING.actionStart), at the blow
  });

  it('sends one shot at each foe an all-foes spell names', async () => {
    const r = setup();
    await r.play([cast('yuna', 'thunder', ['seymour-flux', 'mortiorchis']), blow('seymour-flux', 'yuna'), blow('mortiorchis', 'yuna'), end('yuna')]);
    expect(r.travels.map((t) => t.to)).toEqual(['seymour-flux', 'mortiorchis']);
  });

  it('draws a Darkness as a beam and a long-range physical attack as a tracer; a melee skill flies nothing', async () => {
    const ctx = (longRange: string[]) => setup({ longRange, ffx2: true });
    const beam = ctx([]);
    await beam.play([cast('rikku', 'x2-dark-knight-darkness', ['seymour-flux']), blow('seymour-flux', 'rikku'), end('rikku')]);
    expect(beam.travels.map((t) => t.kind)).toEqual(['beam']);

    const melee = ctx([]);
    await melee.play([cast('paine', 'power-break', ['seymour-flux']), blow('seymour-flux', 'paine'), end('paine')]);
    expect(melee.travels).toEqual([]);

    const shot = ctx(['yuna']);
    await shot.play([{ type: 'action-start', actorId: 'yuna', command: { kind: 'attack', targets: ['seymour-flux'] } as never, targets: ['seymour-flux'] }, blow('seymour-flux', 'yuna'), end('yuna')]);
    expect(shot.travels.map((t) => t.kind)).toEqual(['tracer']);
    // ... and a short-range girl's plain attack runs in instead (RUN-IN), so nothing flies
    const runner = ctx([]);
    await runner.play([{ type: 'action-start', actorId: 'paine', command: { kind: 'attack', targets: ['seymour-flux'] } as never, targets: ['seymour-flux'] }, blow('seymour-flux', 'paine'), end('paine')]);
    expect(runner.travels).toEqual([]);
  });

  it('never flies a heal or a self buff, and a pure status with no blow has no release', async () => {
    const r = setup();
    await r.play([cast('yuna', 'cure', ['rikku']), blow('rikku', 'yuna', -500), end('yuna')]);
    await r.play([cast('yuna', 'thunder', ['yuna']), end('yuna')]);
    await r.play([cast('yuna', 'thunder', ['seymour-flux']), { type: 'status-add', targetId: 'seymour-flux', status: 'slow' } as Ev, end('yuna')]);
    expect(r.travels).toEqual([]);
  });

  it('flies an enemy caster at the party too', async () => {
    const r = setup();
    await r.play([cast('seymour-flux', 'thunder', ['yuna']), blow('yuna', 'seymour-flux'), end('seymour-flux')]);
    expect(r.travels).toEqual([{ from: 'seymour-flux', to: 'yuna', kind: 'orb', ms: FLIGHT_MS.orb }]);
  });
});

describe('the numeral and the HP rows wait for the landing (the critic\'s blocker)', () => {
  it('shows the HUD its blow only after the shot has landed and the effect has drawn its strike', async () => {
    const r = setup({ strikeAfter: 120 });
    await r.play([cast('yuna', 'thunder', ['seymour-flux']), blow('seymour-flux', 'yuna'), end('yuna')]);
    const at = (s: string): number => r.log.indexOf(s);
    expect(at('hud:damage:seymour-flux')).toBeGreaterThan(at('travel:yuna>seymour-flux:orb'));
    expect(at('hud:damage:seymour-flux')).toBeGreaterThan(at('landed:seymour-flux'));
    expect(at('hud:damage:seymour-flux')).toBeGreaterThan(at('land:seymour-flux'));
    // the strike's own clock (120 ms left, polled 40 ms at a time) is waited out before the HUD hears of it
    expect(r.log.slice(at('land:seymour-flux'), at('hud:damage:seymour-flux')).filter((x) => x === 'sleep:40')).toHaveLength(3);
    // and the HUD still hears of it exactly once
    expect(r.log.filter((x) => x === 'hud:damage:seymour-flux')).toHaveLength(1);
  });

  it('without the look the HUD hears of the blow first, as today', async () => {
    const r = setup({ spectacle: false });
    await r.play([cast('yuna', 'thunder', ['seymour-flux']), blow('seymour-flux', 'yuna'), end('yuna')]);
    expect(r.travels).toEqual([]);
    expect(r.log.indexOf('hud:damage:seymour-flux')).toBeLessThan(r.log.indexOf('land:seymour-flux'));
  });

  it('holds every hit of a multi-hit action and a miss', async () => {
    const r = setup();
    await r.play([
      cast('yuna', 'thunder', ['seymour-flux']),
      blow('seymour-flux', 'yuna', 100, 0, 2),
      blow('seymour-flux', 'yuna', 100, 1, 2),
      { type: 'miss', targetId: 'seymour-flux', sourceId: 'yuna', reason: 'evaded' } as Ev,
      end('yuna'),
    ]);
    const lands = r.log.indexOf('landed:seymour-flux');
    const huds = r.log.map((x, i) => (x.startsWith('hud:damage') || x.startsWith('hud:miss') ? i : -1)).filter((i) => i >= 0);
    expect(huds).toHaveLength(3);
    expect(huds.every((i) => i > lands)).toBe(true);
  });

  it('Darkness: its HP cost on the caster shows at once and its blow on the foe is held', async () => {
    const r = setup({ ffx2: true });
    await r.play([cast('rikku', 'x2-dark-knight-darkness', ['seymour-flux']), blow('rikku', 'rikku', 12499), blow('seymour-flux', 'rikku', 462), end('rikku')]);
    const at = (s: string): number => r.log.indexOf(s);
    expect(at('hud:damage:rikku')).toBeLessThan(at('travel:rikku>seymour-flux:beam')); // the cost is raised before the beam leaves (as today)
    expect(at('travel:rikku>seymour-flux:beam')).toBeLessThan(at('hud:damage:seymour-flux'));
    expect(at('landed:seymour-flux')).toBeLessThan(at('hud:damage:seymour-flux'));
  });

  it('a blow that names no striker (an HP cost, a tick) belongs to no plan, even while another action is open under ATB', async () => {
    // Yuna's action opened after Rikku's, so the presenter's `acting` points at her when Rikku's cost (no sourceId) is played: it must not send Yuna's shot.
    const r = setup({ ffx2: true });
    await r.play([
      cast('rikku', 'x2-dark-knight-darkness', ['seymour-flux']),
      cast('yuna', 'thunder', ['seymour-flux']),
      blow('rikku', undefined, 12499),
      blow('seymour-flux', 'yuna', 700),
      end('yuna'),
      blow('seymour-flux', 'rikku', 462),
      end('rikku'),
    ]);
    const at = (s: string): number => r.log.indexOf(s);
    // Each shot left at its own action's blow, from its own caster; the cost launched nothing, and was shown at once as today.
    expect(r.travels.map((t) => `${t.from}>${t.to}:${t.kind}`)).toEqual(['yuna>seymour-flux:orb', 'rikku>seymour-flux:beam']);
    expect(at('hud:damage:rikku')).toBeLessThan(at('travel:yuna>seymour-flux:orb'));
  });

  it('adds no wait of its own: the flight rides the spell\'s wait, so the sleeps are the same with and without it', async () => {
    const sleepsOf = async (spectacle: boolean): Promise<number> => {
      const r = setup({ spectacle });
      await r.play([cast('yuna', 'thunder', ['seymour-flux']), blow('seymour-flux', 'yuna'), end('yuna')]);
      return r.log.filter((x) => x.startsWith('sleep:')).reduce((s, x) => s + Number(x.slice(6)), 0);
    };
    expect(await sleepsOf(true)).toBe(await sleepsOf(false));
  });
});

describe('every way the look stays off, and the blow shows as it does today', () => {
  const none = async (r: Rig): Promise<void> => {
    await r.play([cast('yuna', 'thunder', ['seymour-flux']), blow('seymour-flux', 'yuna'), end('yuna')]);
    expect(r.travels).toEqual([]);
    expect(r.log.indexOf('hud:damage:seymour-flux')).toBeLessThan(r.log.indexOf('land:seymour-flux'));
  };
  it('under REDUCE MOTION', () => none(setup({ reduce: true })));
  it('in skip playback', () => none(setup({ speed: 'skip' })));
  it('when the stage declines (LOW EFFECTS, a special)', () => none(setup({ decline: true })));
  it('with the BATTLE SPECTACLE look off on the EYE CANDY page', () => {
    setEyeCandyProvider((k) => k !== 'battleSpectacle');
    return none(setup());
  });
  it('with its own switch off (`?fxsub=-skilltravel`)', () => {
    eyeCandy.setSub('skilltravel', false);
    return none(setup());
  });
});

/** A bare context for the gate: the FFX-2 menu rule cannot be reached through `BattlePresenter.play` without opening a real menu. */
function bareCtx(o: { ffx2: boolean; menu: boolean }): EventCtx {
  return {
    stage: { fx: { enabled: () => true }, sideOf: (id: string) => (id === 'boss' ? 'enemy' : 'party'), vfx: { travel: () => ({ ms: 100, landed: Promise.resolve() }), canTravel: () => true } },
    deps: { abilityFacts: (id: string) => FACTS[id] },
    moments: { reducedMotion: false, shots: { ffx2Framing: o.ffx2 } },
    speed: () => 'normal',
    menuOpen: () => o.menu,
    reveal: async () => undefined,
  } as unknown as EventCtx;
}

describe('the FFX-2 menu rule: nothing plays over an open command menu', () => {
  it('closes the gate for FFX-2 while a menu is open, and only then', () => {
    expect(motionAllowed(bareCtx({ ffx2: true, menu: true }), 'skilltravel')).toBe(false);
    expect(motionAllowed(bareCtx({ ffx2: true, menu: true }), 'runin')).toBe(false);
    expect(motionAllowed(bareCtx({ ffx2: true, menu: false }), 'skilltravel')).toBe(true);
    expect(motionAllowed(bareCtx({ ffx2: false, menu: true }), 'skilltravel')).toBe(true); // FFX has no ATB menus to speak of
  });

  it('is asked at the release, so a menu that opens after action-start still stops the shot', () => {
    const planned = bareCtx({ ffx2: true, menu: false });
    const start = { type: 'action-start', seq: 0, actorId: 'yuna', command: { kind: 'ability', id: 'thunder', targets: ['boss'] }, abilityId: 'thunder', targets: ['boss'] } as unknown as Extract<BattleEvent, { type: 'action-start' }>;
    planSkill(planned, start, 'cast');
    let menu = true;
    (planned as { menuOpen: () => boolean }).menuOpen = () => menu;
    const hit = { type: 'damage', seq: 1, targetId: 'boss', sourceId: 'yuna', amount: 10, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as BattleEvent;
    expect(blowHeld(planned, hit)).toBe(false);
    // the plan is decided once, at the first blow: a later blow of the same action keeps the answer
    menu = false;
    expect(blowHeld(planned, { ...hit, seq: 2 } as BattleEvent)).toBe(false);
  });

  it('flightKind: spells are orbs, Darkness a beam, a melee skill nothing', () => {
    const ctx = bareCtx({ ffx2: true, menu: false });
    const ev = (id: string): Extract<BattleEvent, { type: 'action-start' }> => ({ type: 'action-start', seq: 0, actorId: 'yuna', command: { kind: 'ability', id } as never, abilityId: id, targets: ['boss'] }) as never;
    expect(flightKind(ctx, ev('thunder'), 'cast')).toBe('orb');
    expect(flightKind(ctx, ev('x2-dark-knight-darkness'), 'cast')).toBe('beam');
    expect(flightKind(ctx, ev('power-break'), 'cast')).toBeNull();
    expect(flightKind(ctx, ev('thunder'), 'attack')).toBeNull();
  });
});
