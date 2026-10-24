/**
 * The fixes after the adversarial review of lane "fx" (motion pass; `docs/handoff/motion-fx.md` "After the review"). The presenter and the real spell layer run on a virtual clock (every presenter
 * sleep steps the layer), against the fake stage:
 *
 * - M1: a boss move's numeral and HP row wait for the new effect's mark, with SKILL TRAVEL open or closed (before: the number came 0.3 to 1.0 s before the strike, or before the effect started).
 * - M2: FFX-2 only: Bahamut's and Rikku's long moves start their effect with the cast, and a status move waits for nothing (the ATB does not tick while the presenter plays).
 * - m1 (the orb trail's length at every frame rate), m2 (Curse's dim with overlapping actions), m4 (the switch off resolves as it did), m5 (no slab on a plain Attack), m6 (a copy's painted finish
 *   keeps its seed when another copy ends).
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { STATUS_WAIT_FFX2_MS, STATUS_WAIT_MS } from '../../src/engine/BattlePresenterBossFx.ts';
import { OrbFlourish } from '../../src/engine/fx/ItemOrbFlourish.ts';
import { ANNIHILATE_MARKS, ATROPHY_MARK, CLEAVE_MARK, FLARE_MARK } from '../../src/engine/spellfx/effects-painted-flux.ts';
import { DARKNESS_MARK, IMPULSE_MARK } from '../../src/engine/spellfx/effects-painted-bahamut.ts';
import { FULLLIFE_MARK } from '../../src/engine/spellfx/effects-painted-spirit.ts';
import { fxGame, setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { fxShare } from '../../src/engine/spellfx/FxPerfGuard.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { isPlainAttack } from '../../src/ui/ffx2/NameSlab.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  setFxMode(null);
  setFxChapter(undefined);
  fxShare.particles = fxShare.trails = 1;
});

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
type Ev = Unsequenced<BattleEvent>;

const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  tidus: { x: 300, y: 380, w: 160, h: 280 },
  yuna: { x: 480, y: 420, w: 150, h: 270 },
  kimahri: { x: 220, y: 450, w: 170, h: 290 },
  rikku: { x: 300, y: 430, w: 150, h: 270 },
  paine: { x: 150, y: 470, w: 150, h: 270 },
  'seymour-flux': { x: 1000, y: 200, w: 300, h: 420 },
  mortiorchis: { x: 960, y: 260, w: 380, h: 420 },
  bahamut: { x: 980, y: 160, w: 360, h: 460 },
};
const P1 = ['tidus', 'yuna', 'kimahri'];
const P4 = ['yuna', 'rikku', 'paine'];
const CHAPTER = { ffx: 'seymour-flux', ffx2: 'ffx2-bahamut' } as const;

const act = (actor: string, ab: string, name: string, targets: string[], kind = 'ability'): Ev =>
  ({ type: 'action-start', actorId: actor, command: { kind, id: ab } as never, abilityId: ab, abilityName: name, targets }) as Ev;
const dmg = (target: string, source: string | undefined, amount: number, hitIndex = 0, hitCount = 1): Ev =>
  ({ type: 'damage', targetId: target, ...(source ? { sourceId: source } : {}), amount, element: 'none', crit: false, hitIndex, hitCount }) as Ev;
const status = (target: string, st: string, source?: string): Ev => ({ type: 'status-add', targetId: target, ...(source ? { sourceId: source } : {}), status: st, instance: {} as never }) as Ev;
const end = (actor: string): Ev => ({ type: 'action-end', actorId: actor }) as Ev;

interface Run {
  /** When the HUD was shown each damaging blow (ms), and the clock of the effect on the screen then (id and seconds). */
  hud: Array<{ target: string; ms: number; fx: Array<{ id: string; t: number }> }>;
  total: number;
  lands: Array<{ at: string; deco: boolean; action: number | undefined; ability: string | undefined; ms: number }>;
  stage: FakeStage;
  layer: SpellFxLayer;
}

/** Play events through the real presenter and the real layer on a virtual clock. `travel` false closes SKILL TRAVEL, as an open FFX-2 command menu does. */
async function run(game: 'ffx' | 'ffx2', mode: 'new' | 'today', events: Ev[], travel = false): Promise<Run> {
  setFxMode(mode);
  setFxChapter(CHAPTER[game]);
  const layer = new SpellFxLayer({ game, rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full', chapterId: CHAPTER[game] });
  const stage = game === 'ffx' ? new FakeStage(P1, ['seymour-flux', 'mortiorchis']) : new FakeStage(P4, ['bahamut']);
  let vt = 0;
  const hud: Run['hud'] = [];
  const lands: Run['lands'] = [];
  Object.assign(stage.vfx, {
    land: (t: string, o: Parameters<SpellFxLayer['land']>[1]) => {
      const ms = layer.land(t, o);
      lands.push({ at: t, deco: o.deco === true, action: o.action, ability: o.abilityId, ms });
      return ms;
    },
    canTravel: (a: string | undefined, f: string) => travel && layer.canFly(a, f),
    travel: (f: string, t: string, o: Parameters<SpellFxLayer['fly']>[2]) => layer.fly(f, t, o),
    markIn: (t: string, a: number) => layer.markIn(t, a),
    pendingLand: (t: string, a: number) => layer.pendingLand(t, a),
    impact: () => Promise.resolve(),
  });
  const presenter = new BattlePresenter({
    stage,
    hud: { onEvent: (e: BattleEvent) => void (e.type === 'damage' && e.amount > 0 && e.sourceId && hud.push({ target: e.targetId, ms: vt, fx: layer.snapshot().running.map((r) => ({ id: r.id, t: r.t })) })) },
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    sleep: (ms: number) => {
      vt += ms;
      layer.update(ms / 1000);
      layer.drawList();
      return Promise.resolve();
    },
  } as never);
  await presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { hud, total: vt, lands, stage, layer };
}

/** The effect clock of the named effect when the HUD showed blow `i`. */
const clockOf = (r: Run, i: number, id: string): number => r.hud[i]!.fx.find((f) => f.id === id)?.t ?? NaN;

describe('M1: a boss move\'s numeral waits for the new effect\'s mark, shot or no shot', () => {
  const cases: Array<[string, string, Ev[], string, number]> = [
    ['Lance of Atrophy', 'atrophy', [act('seymour-flux', 'lance-of-atrophy', 'Lance of Atrophy', ['tidus']), dmg('tidus', 'seymour-flux', 600), end('seymour-flux')], 'tidus', ATROPHY_MARK],
    ['Full-Life', 'fulllife', [act('mortiorchis', 'full-life', 'Full-Life', ['tidus']), dmg('tidus', 'mortiorchis', 900), end('mortiorchis')], 'tidus', FULLLIFE_MARK],
    ['Flare', 'flare', [act('seymour-flux', 'flare-self', 'Flare', ['kimahri']), dmg('kimahri', 'seymour-flux', 1200), end('seymour-flux')], 'kimahri', FLARE_MARK],
    ['Cross Cleave', 'cleave', [act('mortiorchis', 'cross-cleave', 'Cross Cleave', ['yuna']), dmg('yuna', 'mortiorchis', 2667), end('mortiorchis')], 'yuna', CLEAVE_MARK],
  ];
  for (const travel of [false, true]) {
    for (const [name, fx, events, target, mark] of cases) {
      it(`${name}: the HUD is shown the blow at the effect's mark (SKILL TRAVEL ${travel ? 'open' : 'closed'})`, async () => {
        const r = await run('ffx', 'new', events, travel);
        expect(r.hud).toHaveLength(1);
        expect(r.hud[0]!.target).toBe(target);
        const t = clockOf(r, 0, fx);
        expect(t).toBeGreaterThanOrEqual(mark - 0.02); // not before the strike (before: 0.014, the first frame)
        expect(t).toBeLessThan(mark + 0.12);
      });
    }
  }

  it('Total Annihilation: each of the five blows of a target is shown at its own mark', async () => {
    const events: Ev[] = [act('mortiorchis', 'total-annihilation', 'Total Annihilation', P1), ...[0, 1, 2, 3, 4].flatMap((k) => P1.map((t) => dmg(t, 'mortiorchis', 640, k, 5))), end('mortiorchis')];
    const r = await run('ffx', 'new', events);
    expect(r.hud.length).toBe(15);
    const first = r.hud.filter((h) => h.target === 'tidus');
    expect(first).toHaveLength(5);
    first.forEach((h, k) => expect(h.fx.find((f) => f.id === 'annihilate')!.t, `blow ${k}`).toBeGreaterThanOrEqual(ANNIHILATE_MARKS[k]! - 0.02));
    expect(first[0]!.fx.find((f) => f.id === 'annihilate')!.t).toBeLessThan(ANNIHILATE_MARKS[1]!); // the first blow is not held for the fifth's mark
  });

  it('Chapter IV, menu open or closed: Darkness and Impulse are shown at their marks (Impulse\'s three girls each at their own)', async () => {
    for (const travel of [false, true]) {
      const dark = await run('ffx2', 'new', [act('rikku', 'x2-dark-knight-darkness', 'Darkness', ['bahamut']), dmg('rikku', undefined, 120), dmg('bahamut', 'rikku', 3912), end('rikku')], travel);
      expect(dark.hud).toHaveLength(1); // the HP cost on the caster has no striker and shows at once, as before
      expect(clockOf(dark, 0, 'darkness')).toBeGreaterThanOrEqual(DARKNESS_MARK - 0.02);
      expect(clockOf(dark, 0, 'darkness')).toBeLessThan(DARKNESS_MARK + 0.06); // at the strike: the HP cost on Rikku does not make the foe's numeral wait 240 ms more (browser: 1.065 before)
      expect(dark.lands.some((l) => l.at === 'rikku'), 'the cost blow does not land the effect').toBe(false);
      const imp = await run('ffx2', 'new', [act('bahamut', 'impulse', 'Impulse', []), ...P4.map((t) => dmg(t, 'bahamut', 520)), end('bahamut')], travel); // the engine's Impulse names no target at its start
      expect(imp.hud).toHaveLength(3);
      const clocks = imp.hud.map((_, i) => clockOf(imp, i, 'impulse'));
      expect(clocks[0]!).toBeGreaterThanOrEqual(IMPULSE_MARK - 0.02);
      expect(clocks[1]!).toBeGreaterThan(clocks[0]!);
      expect(clocks[2]!).toBeGreaterThan(clocks[1]!);
    }
  });

  it('with the new effects off the blow is shown as it was: at the start of its event (SKILL TRAVEL closed)', async () => {
    const r = await run('ffx', 'today', [act('seymour-flux', 'lance-of-atrophy', 'Lance of Atrophy', ['tidus']), dmg('tidus', 'seymour-flux', 600), end('seymour-flux')]);
    expect(r.hud).toHaveLength(1);
    expect(r.hud[0]!.ms).toBeLessThanOrEqual(900); // 380 ms of action start plus the telegraph; no wait for any effect
    expect(r.layer.snapshot().running.every((f) => !f.fresh)).toBe(true);
  });

  it('in a chapter that is not a demo chapter the switch is off, and so is the hold', async () => {
    setFxMode('new');
    setFxChapter('evrae');
    const layer = new SpellFxLayer({ game: 'ffx', rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });
    expect(fxGame()).toBeUndefined();
    expect(layer.land('tidus', { abilityId: 'lance-of-atrophy', action: 1, sourceId: 'seymour-flux', targets: ['tidus'] })).toBeGreaterThanOrEqual(0);
    expect(layer.snapshot().running.every((f) => !f.fresh)).toBe(true);
  });
});

describe('M2: FFX-2 starts a long boss move with the cast and a status move waits for nothing', () => {
  const darkness: Ev[] = [act('rikku', 'x2-dark-knight-darkness', 'Darkness', ['bahamut']), dmg('rikku', undefined, 120), dmg('bahamut', 'rikku', 3912), end('rikku')];
  const impulse: Ev[] = [act('bahamut', 'impulse', 'Impulse', []), ...P4.map((t) => dmg(t, 'bahamut', 520)), end('bahamut')]; // the engine's Impulse (all-enemies) names no target at its start; the pre-roll takes the other team's figures
  const curse: Ev[] = [act('bahamut', 'bahamut-curse', 'Curse', ['paine']), status('paine', 'curse', 'bahamut'), end('bahamut')];

  it('Darkness, Impulse and Curse start their effect at the action start, as decoration under the action\'s own number', async () => {
    for (const [events, fx] of [[darkness, 'darkness'], [impulse, 'impulse'], [curse, 'curse']] as const) {
      const r = await run('ffx2', 'new', events);
      const first = r.lands[0]!;
      expect(first.deco, fx).toBe(true);
      expect(first.action).toBeDefined();
      expect(r.lands.slice(1).every((l) => !l.deco && l.action === first.action), `${fx}: the blows find the copy by the action`).toBe(true);
    }
  });

  it('the presenter waits for what is left of the lead-in: Darkness adds nothing, Impulse at most 450 ms, over today (they added 620 and 800)', async () => {
    const dToday = await run('ffx2', 'today', darkness);
    const dNew = await run('ffx2', 'new', darkness);
    expect(dNew.total - dToday.total).toBeLessThanOrEqual(50);
    const iToday = await run('ffx2', 'today', impulse);
    const iNew = await run('ffx2', 'new', impulse);
    expect(iNew.total - iToday.total).toBeLessThanOrEqual(450);
  });

  it('a status move waits for nothing in FFX-2 (Curse, Haste, Shell) and 250 ms in FFX', async () => {
    expect(STATUS_WAIT_FFX2_MS).toBe(0);
    const cases: Array<[Ev[]]> = [[curse], [[act('yuna', 'x2-shared-haste', 'Haste', ['rikku']), status('rikku', 'haste', 'yuna'), end('yuna')]], [[act('yuna', 'x2-white-mage-shell', 'Shell', ['rikku']), status('rikku', 'shell', 'yuna'), end('yuna')]]];
    for (const [events] of cases) {
      const a = await run('ffx2', 'today', events);
      const b = await run('ffx2', 'new', events);
      expect(b.total).toBe(a.total);
    }
    const haste: Ev[] = [act('yuna', 'haste', 'Haste', ['tidus']), status('tidus', 'haste'), end('yuna')];
    const t = await run('ffx', 'today', haste);
    const n = await run('ffx', 'new', haste);
    expect(n.total - t.total).toBe(STATUS_WAIT_MS);
  });

  it('FFX (turn-based) gets no pre-roll, and a switched-off run asks for none', async () => {
    const flare = await run('ffx', 'new', [act('seymour-flux', 'flare-self', 'Flare', ['kimahri']), dmg('kimahri', 'seymour-flux', 1200), end('seymour-flux')]);
    expect(flare.lands.some((l) => l.deco)).toBe(false);
    const off = await run('ffx2', 'today', darkness);
    expect(off.lands.some((l) => l.deco)).toBe(false);
  });
});

describe('a group effect never takes its caster into the group', () => {
  it('a blow on the caster (the HP cost of a move) does not pull the effect centre toward her', () => {
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const layer = new SpellFxLayer({ game: 'ffx2', rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });
    layer.land('bahamut', { abilityId: 'x2-dark-knight-darkness', action: 7, sourceId: 'rikku', targets: ['bahamut'], deco: true });
    layer.land('rikku', { abilityId: 'x2-dark-knight-darkness', action: 7, sourceId: 'rikku', targets: ['bahamut'] });
    layer.land('bahamut', { abilityId: 'x2-dark-knight-darkness', action: 7, sourceId: 'rikku', targets: ['bahamut'] });
    const copies = (layer as unknown as { running: Array<{ id: string; groupIds: string[] }> }).running.filter((r) => r.id === 'darkness');
    expect(copies).toHaveLength(1);
    expect(copies[0]!.groupIds).toEqual(['bahamut']);
  });
});

describe('m2: Curse darkens the girl even when another action started in between', () => {
  it('finds the action by its caster, not by the latest one started', async () => {
    const startCurse = act('bahamut', 'bahamut-curse', 'Curse', ['yuna']);
    const girl = act('rikku', 'x2-white-mage-cure', 'Cure', ['paine']);
    const seen: number[] = [];
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const stage = new FakeStage(P4, ['bahamut']);
    stage.vfx.land = (_at, o) => (o.deco ? 0 : 400);
    stage.actors.get('yuna')!.setBrightness = ((v: number) => void seen.push(v)) as never;
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve() } as never);
    const evs = [startCurse, girl, status('yuna', 'curse', 'bahamut'), end('rikku'), end('bahamut')];
    await presenter.play(evs.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(seen).toEqual([0.78]);
  });
});

describe('m6: a copy\'s painted finish keeps its seed when another copy ends', () => {
  it('the ring seeds of a Cure on Yuna are the same before and after an earlier Haste on Tidus ends', () => {
    setFxMode('new');
    setFxChapter('seymour-flux');
    const layer = new SpellFxLayer({ game: 'ffx', rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });
    layer.land('tidus', { abilityId: 'haste', action: 1, targets: ['tidus'], status: true });
    let t = 0;
    let landed = false;
    const seen = new Set<string>();
    let hasteEnded = false;
    let ringsBeforeEnd = 0;
    let ringsAfterEnd = 0;
    for (let i = 0; i < 300; i++) {
      layer.update(0.01);
      t += 0.01;
      if (!landed && t >= 0.5) {
        layer.land('yuna', { abilityId: 'cure', action: 2, targets: ['yuna'], heal: true });
        landed = true;
      }
      const running = layer.snapshot().running;
      if (landed && !running.some((r) => r.id === 'haste')) hasteEnded = true;
      const list = layer.drawList();
      const rings = (list?.items ?? []).filter((it) => it.shape === 1 && it.x > 400 && it.x < 700 && (it.paint ?? 0) > 0);
      for (const r of rings) seen.add((r.seed ?? 0).toFixed(3));
      if (hasteEnded) ringsAfterEnd += rings.length;
      else ringsBeforeEnd += rings.length;
    }
    expect(hasteEnded, 'the Haste ended while the Cure was still on screen').toBe(true);
    expect(ringsBeforeEnd, 'rings were drawn while the Haste ran').toBeGreaterThan(0);
    expect(ringsAfterEnd, 'and after it ended').toBeGreaterThan(0);
    expect(seen.size, `the Cure's rings keep their two seeds; seen: ${[...seen].join(' ')}`).toBeLessThanOrEqual(2); // before the fix the Haste's end moved both (75.564 and 38.513 became 79.206 and 42.155)
  });

  it('two layers draw the same seeds for the same run (the seed comes from the layer, not a global)', () => {
    const seedsOf = (): number[] => {
      setFxMode('new');
      setFxChapter('seymour-flux');
      const layer = new SpellFxLayer({ game: 'ffx', rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });
      layer.land('yuna', { abilityId: 'cure', action: 1, targets: ['yuna'], heal: true });
      layer.update(0.3);
      return (layer.drawList()?.items ?? []).map((i) => i.seed ?? 0);
    };
    expect(seedsOf()).toEqual(seedsOf());
  });
});

describe('m1: the item toss\'s comet trail is as long at every frame rate', () => {
  it('spans 0.233 s of the orb\'s travel at 30, 60, 90, 120, 144 and 240 Hz', () => {
    for (const hz of [30, 60, 90, 120, 144, 240]) {
      const f = new OrbFlourish();
      const fx = { phase: 'flight', orbAt: { x: 0, y: 0, z: 0 }, lightNow: { tone: 'heal' } } as never as Parameters<OrbFlourish['update']>[1];
      const dt = 1 / hz;
      let t = 0;
      for (let i = 0; i < Math.round(0.6 * hz); i++) {
        t += dt;
        (fx as unknown as { orbAt: { x: number } }).orbAt.x = 10 * t;
        f.update(dt, fx, null);
      }
      const hist = (f as unknown as { hist: Array<{ x: number }> }).hist;
      const span = (hist[0]!.x - hist[hist.length - 1]!.x) / 10;
      expect(span, `${hz} Hz`).toBeCloseTo(0.233, 2);
    }
  });
});

describe('m5: no name slab on a plain Attack', () => {
  it('Bahamut\'s Attack (an ability command with the id attack) is a plain attack; Impulse is not', () => {
    const plain = act('bahamut', 'attack', 'Attack', ['yuna']) as Extract<BattleEvent, { type: 'action-start' }>;
    const imp = act('bahamut', 'impulse', 'Impulse', P4) as Extract<BattleEvent, { type: 'action-start' }>;
    expect(isPlainAttack(plain)).toBe(true);
    expect(isPlainAttack(imp)).toBe(false);
  });
});

describe('fxGame', () => {
  it('names the game of the demo chapter and nothing elsewhere', () => {
    setFxChapter('seymour-flux');
    expect(fxGame()).toBe('ffx');
    setFxChapter('ffx2-bahamut');
    expect(fxGame()).toBe('ffx2');
    setFxChapter('evrae');
    expect(fxGame()).toBeUndefined();
    setFxChapter(undefined);
    expect(fxGame()).toBeUndefined();
  });
});
