/**
 * The integration of the motion lanes "core", "feel" and "fx" (branch demo-motion-int; both games; Chapter I and Chapter IV only): the ONE shared chapter gate, the motion sounds on core's marks
 * (the lunge on the strike's wind-up end, the smear on the cut, the landing of a leap), the fx beat's claim on a blow, the FFX-2 menu rule on feel's stop, the gather of an Overdrive's opening and
 * the Tidus T1/T2 art server. The lanes' own test files stay as they were; this file only proves what the merge added.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame, paceFactor } from '../../../src/engine/pace.ts';
import { DEMO_CHAPTERS, demoChapter, isDemoChapter, packDemo, queryWord, setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { curvesChapter, curvesOn, setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { feelChapter, inFeelChapter, resetFeelForTests, setFeelChapter, setFeelPack } from '../../../src/engine/feel/FeelSwitch.ts';
import { fxChapter, fxNewOn, fxPieceOn, setFxChapter, setFxMode, setFxPiece } from '../../../src/engine/spellfx/FxSwitch.ts';
import { setMenuHold } from '../../../src/engine/motion/MenuHold.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { resetSmearLog } from '../../../src/engine/motion/SmearLog.ts';
import { setMotionBeatSink, type MotionBeat } from '../../../src/engine/feel/MotionBeats.ts';
import { bigBlowClaimed, claimBigBlow } from '../../../src/engine/feel/BlowClaim.ts';
import { planHit, SPECTACLE_TUNING, type HitInfo, type SpectacleFlags } from '../../../src/engine/fx/c/SpectacleRules.ts';
import { SHORT_STOP_FINISHER_MS } from '../../../src/engine/feel/HitStopShort.ts';
import { PUNCH_FRACTION } from '../../../src/engine/feel/PunchCurve.ts';
import { GATHER, gather, installFxWiring } from '../../../src/engine/motion/FxWiring.ts';
import { fxBeat, fxMotionHooks, setFxMotionHooks } from '../../../src/engine/spellfx/FxMotionAdapter.ts';
import { MASTER_CODE, SWITCHES, allNew, boardState, flipAll, normaliseCode, switchOfCode } from '../../../src/app/demo/switchboardModel.ts';
import { switchboardWanted, tidusAsked } from '../../../src/app/demo/switchboard.ts';
import { feelConfigured } from '../../../src/engine/feel/FeelSwitch.ts';
import { tidusFile, variantOf } from '../../../tools/vite-art-variant.mjs';
import { readFileSync } from 'node:fs';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setDemoChapter(undefined);
  setCurvesMode(null);
  setSmearStyle(null);
  setMomentsMode(null);
  setFxMode(null);
  setFxPiece(null);
  resetFeelForTests();
  setMotionBeatSink(null);
  setMenuHold(null);
  setFxMotionHooks({});
  resetSmearLog();
  setPaceGame('other');
  reset();
});

describe('one chapter gate for every lane', () => {
  it('the three lanes\' setters write the same variable, whichever lane names the chapter', () => {
    setCurvesChapter('seymour-flux');
    expect(feelChapter()).toBe('seymour-flux');
    expect(fxChapter()).toBe('seymour-flux');
    setFeelChapter('ffx2-bahamut');
    expect(curvesChapter()).toBe('ffx2-bahamut');
    expect(fxChapter()).toBe('ffx2-bahamut');
    setFxChapter(undefined);
    expect(demoChapter()).toBeUndefined();
    expect(inFeelChapter()).toBe(false);
    expect(feelChapter()).toBeNull();
  });
  it('the table is the two demo chapters and a gate is on in them only', () => {
    expect(Object.keys(DEMO_CHAPTERS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux']);
    for (const [id, on] of [['seymour-flux', true], ['ffx2-bahamut', true], ['yunalesca', false], ['tourist-trap', false]] as const) {
      setDemoChapter(id);
      setFxMode('new');
      setCurvesMode('new');
      setFeelPack(true);
      expect([isDemoChapter(id), curvesOn(), fxNewOn(), inFeelChapter()]).toEqual([on, on, on, on]);
    }
  });
  it('the one pack reader: ?pack=demo, case and spaces tolerated, nothing else; an unreadable address is no address', () => {
    expect(packDemo('?pack=demo')).toBe(true);
    expect(packDemo('?a=1&pack= DEMO ')).toBe(true);
    expect(packDemo('?pack=demos')).toBe(false);
    expect(packDemo('')).toBe(false);
    expect(packDemo(undefined)).toBe(false);
    expect(queryWord('?smear=Blur', 'smear')).toBe('blur');
  });
});

describe('the motion sounds ride core\'s marks', () => {
  const beats: MotionBeat[] = [];
  beforeEach(() => {
    beats.length = 0;
    setMotionBeatSink((b) => void beats.push(b));
  });
  function figure(side: 'party' | 'enemy' = 'party'): Actor {
    const a = new PaintedActor({ name: 'auron', worldHeight: side === 'party' ? 1.82 : 4.1, side, breathe: false, sway: false, shadow: false });
    a.adoptPoses({ idle: painting('auron', 'idle'), attack: painting('auron', 'attack') }, 'idle');
    a.position.set(-2, 0, 0);
    return a;
  }
  const step = (a: Actor, ms: number, frame = 1000 / 120): void => {
    for (let i = 0; i < Math.round(ms / frame); i++) a.update(frame / 1000);
  };

  it('a strike reports ONE lunge beat as its wind-up ends, aimed at the fastest frame, in on-screen ms', () => {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const a = figure();
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    expect(beats).toHaveLength(0); // wind-up: nothing yet
    step(a, 400);
    const lunges = beats.filter((b) => b.kind === 'lunge');
    expect(lunges).toHaveLength(1);
    const b = lunges[0]!;
    expect(b.strength).toBeCloseTo(1.4 / 2.4, 5);
    expect(b.atMs).toBeGreaterThan(40);
    expect(b.atMs).toBeLessThan(250 * paceFactor('action')); // inside the travel
    expect(b.ms).toBeGreaterThan(200);
    expect(b.heft).toBeLessThan(0.05); // a party member
  });
  it('a boss\'s strike is heavier: its beat carries a heft near 1', () => {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const a = figure('enemy');
    void a.strike({ distance: 2, game: 'ffx', timeScale: 1, arc: true });
    step(a, 500);
    expect(beats.find((b) => b.kind === 'lunge')!.heft).toBeGreaterThan(0.7);
  });
  it('a leap reports its landing once, with its squash over the 6 percent cap, and a leap that is cut short never lands', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('new');
    const a = figure();
    void a.leap(0.42, 400, { land: 0.04 });
    step(a, 300);
    expect(beats.filter((b) => b.kind === 'land')).toHaveLength(0);
    step(a, 400);
    const lands = beats.filter((b) => b.kind === 'land');
    expect(lands).toHaveLength(1);
    expect(lands[0]!.strength).toBeCloseTo(0.04 / 0.06, 5);
    beats.length = 0;
    const b = figure();
    void b.leap(0.42, 400);
    step(b, 100);
    b.dispose(); // the actor goes before it lands
    step(b, 600);
    expect(beats.filter((x) => x.kind === 'land')).toHaveLength(0);
  });
  it('with no sink (the switch off, every other build) nothing is reported and the strike is the same', () => {
    setMotionBeatSink(null);
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const a = figure();
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    step(a, 400);
    expect(beats).toHaveLength(0);
  });
});

describe('the fx beat claims a blow; the feel rules give it the finisher\'s stop and punch once', () => {
  const flags = (feel: SpectacleFlags['feel'], extra: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, feel, ...extra });
  const blow = (extra: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 3, big: false, magic: false, speed: 'normal', ...extra });

  it('a claimed first blow of a three-blow Overdrive: 4 frames and 0.03 under ?hitstop=short and ?punch=new; an unclaimed one gets none', () => {
    const f = flags({ punch: 'new', stop: 'short' });
    expect(planHit('ffx', blow({ big: true }), f).freezeMs).toBe(0); // the middle of a flurry: feel's own rule is silent
    const claimed = planHit('ffx', blow({ big: true, fxBig: true }), f);
    expect(claimed.freezeMs).toBe(SHORT_STOP_FINISHER_MS);
    expect(claimed.kick).toBe(PUNCH_FRACTION.finisher);
  });
  it('a claim changes nothing with feel on today\'s or off (the claim is the feel rules\' to read)', () => {
    const t = planHit('ffx', blow({ big: true, fxBig: true }), flags({ punch: 'today', stop: 'today' }));
    const u = planHit('ffx', blow({ big: true }), flags({ punch: 'today', stop: 'today' }));
    expect({ ...t }).toEqual({ ...u });
    const off = planHit('ffx', blow({ big: true, fxBig: true }), flags({ punch: 'off', stop: 'off' }));
    expect([off.freezeMs, off.kick]).toEqual([0, 0]);
  });
  it('REDUCE MOTION, a fast playback speed and an open FFX-2 command menu stop it', () => {
    const f = { punch: 'new', stop: 'short' } as const;
    expect(planHit('ffx', blow({ big: true, fxBig: true }), flags(f, { reduceMotion: true })).freezeMs).toBe(0);
    expect(planHit('ffx', blow({ big: true, fxBig: true, speed: 'fast' }), flags(f)).freezeMs).toBe(0);
    const menu = planHit('ffx2', blow({ big: true, fxBig: true, menuOpen: true }), flags(f));
    expect([menu.freezeMs, menu.kick]).toEqual([0, 0]);
  });
  it('the short stop alone holds no frame over an open FFX-2 menu, and holds it without one', () => {
    const f = flags({ punch: 'today', stop: 'short' });
    const crit = { crit: true, hitCount: 1 };
    expect(planHit('ffx2', blow({ ...crit, menuOpen: true }), f).freezeMs).toBe(0);
    expect(planHit('ffx2', blow({ ...crit }), f).freezeMs).toBeGreaterThan(0);
    expect(SPECTACLE_TUNING.ffx2.freezeHeavyMs).toBeGreaterThan(0);
  });
  it('the claim is per damage event', () => {
    const e = {};
    expect(bigBlowClaimed(e)).toBe(false);
    claimBigBlow(e);
    expect(bigBlowClaimed(e)).toBe(true);
    expect(bigBlowClaimed({})).toBe(false);
  });
});

describe('the fx pieces: nothing new begins over an open FFX-2 command menu', () => {
  it('fxPieceOn is false while the menu holds, true when it opens no more, and the painted finish (fxNewOn) is not held', () => {
    setFxChapter('ffx2-bahamut');
    setFxMode('new');
    expect(fxPieceOn('bosses')).toBe(true);
    setMenuHold(() => true);
    expect(fxPieceOn('bosses')).toBe(false);
    expect(fxPieceOn('slab')).toBe(false);
    expect(fxNewOn()).toBe(true);
    setMenuHold(() => false);
    expect(fxPieceOn('openings')).toBe(true);
  });
});

describe('the Overdrive opening gathers with the core lane\'s leap', () => {
  it('registered at boot: an od-open beat leaps the actor with the gather\'s shape for the aura\'s build, only with the curves on', () => {
    const calls: Array<{ h: number; ms: number; shape: unknown }> = [];
    const actor = { leap: (h: number, ms: number, shape?: unknown) => (calls.push({ h, ms, shape }), Promise.resolve()), position: { y: 0 }, headPoint: () => ({ y: 1.8 }) };
    installFxWiring();
    expect(Object.keys(fxMotionHooks())).toEqual(['anticipate']); // the stop, the punch and the rumble are the feel rules' (the claim); no smear to ride
    setDemoChapter('seymour-flux');
    fxBeat('od-open', 'tidus', { ms: 1200, actor });
    expect(calls).toHaveLength(0); // curves off: today's opening
    setCurvesMode('new');
    fxBeat('od-open', 'tidus', { ms: 1200, actor });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.ms).toBe(1200);
    expect(calls[0]!.h).toBeCloseTo(1.8 * GATHER.rise, 5);
    expect(calls[0]!.shape).toMatchObject({ anticipation: GATHER.anticipation, crouch: GATHER.crouch });
    gather(undefined, 1000); // no actor: nothing, no throw
    gather({}, 1000);
    expect(calls).toHaveLength(1);
  });
  it('REDUCE MOTION still gathers (the beat passes calm and the movement hooks stay); no actor given is a no-op', () => {
    const calls: number[] = [];
    setFxMotionHooks({ anticipate: (_id, ms) => void calls.push(ms) });
    fxBeat('od-open', 'tidus', { calm: true, ms: 900 });
    expect(calls).toEqual([900]);
  });
});

describe('the playtest switchboard', () => {
  it('is wanted only with ?pack=demo AND ?switchboard=1', () => {
    expect(switchboardWanted('?demo=1&pack=demo&switchboard=1')).toBe(true);
    expect(switchboardWanted('?pack=demo')).toBe(false);
    expect(switchboardWanted('?switchboard=1')).toBe(false);
    expect(switchboardWanted('?pack=demo&switchboard=0')).toBe(false);
    expect(switchboardWanted('')).toBe(false);
  });
  it('the key map: unique codes, none that the game uses', () => {
    const codes = [...SWITCHES.map((s) => s.code), MASTER_CODE, 'Equal'];
    expect(new Set(codes).size).toBe(codes.length);
    const input = readFileSync('src/app/Input.ts', 'utf8');
    for (const c of codes) expect(input).not.toContain(`${c}:`); // not in Input's KEY_MAP
    expect(SWITCHES.map((s) => s.key).join('')).toBe('1234567' + ',.' + '89' + '/' + '-' + ';' + '\\' + "'"); // r63-play added the apostrophe (the party rim, last); integration 2 added `,` (the real clips) and `.` (the party rigs) after the curves; lane pro-look added `/` (the pro look) before the shadow key; the pro-camera lane added `;` (the directed camera); the pro staging added the backslash key (lane "pro-staging"), last
    expect(normaliseCode('Numpad3')).toBe('Digit3');
    expect(switchOfCode('Numpad1')?.name).toBe('smear');
    expect(switchOfCode('KeyZ')).toBeUndefined();
  });
  it('with the pack: every piece starts new; the smear cycles paint, blur, off; the others flip between new and today', () => {
    setFeelPack(true);
    setCurvesMode('new');
    setFxMode('new');
    setSmearStyle('paint');
    const name = (n: string): ReturnType<typeof switchOfCode> => SWITCHES.find((s) => s.name === n);
    expect(name('smear')!.flip!()).toBe('blur');
    expect(name('smear')!.flip!()).toBe('off');
    expect(name('smear')!.flip!()).toBe('paint');
    expect(name('punch')!.flip!()).toBe('today');
    expect(feelConfigured().punch).toBe('today');
    expect(name('punch')!.flip!()).toBe('new');
    expect(name('stop')!.flip!()).toBe('today');
    expect(name('rumble')!.flip!()).toBe('off');
    expect(name('sounds')!.flip!()).toBe('off');
    expect(name('fx')!.flip!()).toBe('today');
    expect(name('curves')!.flip!()).toBe('today');
    expect(name('shadow')!.flip!()).toBe('today');
    expect(boardState().filter((s) => s.isNew).map((s) => s.name)).toEqual(['smear', 'punch']);
  });
  it('the master key: all new goes to all today\'s and back; blur survives a trip through "all new" only if it was blur', () => {
    setFeelPack(true);
    setCurvesMode('new');
    setFxMode('new');
    setSmearStyle('blur');
    setMomentsMode('new');
    SWITCHES.find((s) => s.name === 'moments')!.flip!(); // one piece off: the master turns everything ON
    expect(allNew()).toBe(false);
    expect(flipAll()).toBe(true);
    expect(allNew()).toBe(true);
    expect(boardState().find((s) => s.name === 'smear')!.value).toBe('blur');
    expect(flipAll()).toBe(false);
    expect(boardState().every((s) => !s.isNew)).toBe(true);
    expect(flipAll()).toBe(true);
    expect(boardState().find((s) => s.name === 'smear')!.value).toBe('paint');
  });
  it('the Tidus the address or the cookie asks for', () => {
    expect(tidusAsked('?tidus=t2', '')).toBe('t2');
    expect(tidusAsked('', 'a=1; pyrefly_tidus=t2')).toBe('t2');
    expect(tidusAsked('?tidus=t1', 'pyrefly_tidus=t2')).toBe('t1'); // the address wins
    expect(tidusAsked('', '')).toBe('t1');
  });
});

describe('the Tidus art server (vite.demo.config.ts)', () => {
  it('serves a plain file name inside characters/tidus and nothing else', () => {
    expect(tidusFile('/art/characters/tidus/idle.png')).toBe('idle.png');
    expect(tidusFile('/art/characters/tidus/idle@2x.png')).toBe('idle@2x.png');
    expect(tidusFile('/art/characters/tidus/../auron/idle.png')).toBeNull();
    expect(tidusFile('/art/characters/tidus/a%2F..%2Fb.png')).toBeNull();
    expect(tidusFile('/art/characters/auron/idle.png')).toBeNull();
    expect(tidusFile('/art/characters/tidus/sub/idle.png')).toBeNull();
  });
  it('T1 unless the address or the cookie says T2', () => {
    expect(variantOf('/', undefined)).toBe('t1');
    expect(variantOf('/?demo=1&tidus=t2', undefined)).toBe('t2');
    expect(variantOf('/art/characters/tidus/idle.png', 'x=1; pyrefly_tidus=t2')).toBe('t2');
    expect(variantOf('/?tidus=t1', 'pyrefly_tidus=t2')).toBe('t1');
  });
});

describe('the smear\'s whoosh is asked for on the cut', () => {
  const N = 48;
  const mask = (solid: (col: number, row: number) => boolean): { w: number; h: number; bits: Uint8Array } => {
    const bits = new Uint8Array(N * N);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = solid(c, r) ? 1 : 0;
    return { w: N, h: N, bits };
  };
  it('a big change on a moving figure in a demo chapter reports ONE smear beat at half the window; at rest, or with the smear off, none', () => {
    const beats: MotionBeat[] = [];
    setMotionBeatSink((b) => void beats.push(b));
    const make = (): Actor => {
      const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
      a.adoptPoses({ idle: painting('yuna', 'idle', { silhouette: mask((c) => c < N / 2) }), attack: painting('yuna', 'attack', { silhouette: mask((c) => c >= N / 2) }) }, 'idle');
      a.position.set(-2, 0, 0);
      return a;
    };
    const frame = 1000 / 120;
    const swap = (a: Actor, moving: boolean): void => {
      if (moving) {
        void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
        for (let i = 0; i < 30; i++) a.update(frame / 1000);
      }
      beats.length = 0;
      a.setPose('attack');
      for (let i = 0; i < 40; i++) a.update(frame / 1000);
    };
    setCurvesChapter('seymour-flux');
    setSmearStyle('paint');
    swap(make(), true);
    const smears = beats.filter((b) => b.kind === 'smear');
    expect(smears).toHaveLength(1);
    expect(smears[0]!.atMs).toBeGreaterThan(5);
    expect(smears[0]!.atMs).toBeLessThan(40);
    expect(smears[0]!.strength).toBeGreaterThan(0.3);
    swap(make(), false); // at rest: today's blend
    expect(beats.filter((b) => b.kind === 'smear')).toHaveLength(0);
    setSmearStyle('off');
    swap(make(), true);
    expect(beats.filter((b) => b.kind === 'smear')).toHaveLength(0);
  });
});

describe('the claim through the real presenter: the blow reaches the spectacle port marked, once', () => {
  type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never;
  function rig(): { play: (e: Array<Seq<BattleEvent>>) => Promise<unknown>; seen: Array<Record<string, unknown>> } {
    const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], ['seymour-flux', 'mortiorchis']);
    stage.vfx.land = (_at, o) => (o.deco ? 0 : 200);
    const seen: Array<Record<string, unknown>> = [];
    (stage as unknown as { fx: unknown }).fx = { enabled: () => true, hit: (o: Record<string, unknown>) => (seen.push({ ...o }), { freezeMs: 0, shook: false }) };
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve() });
    return { seen, play: (events) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)) };
  }
  const dmg = (target: string, hit: number, count: number, source: string): Seq<BattleEvent> => ({ type: 'damage', targetId: target, sourceId: source, amount: 500, element: 'none', crit: false, hitIndex: hit, hitCount: count });
  const od: Array<Seq<BattleEvent>> = [
    { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['seymour-flux'] },
    dmg('seymour-flux', 0, 3, 'tidus'),
    dmg('seymour-flux', 1, 3, 'tidus'),
    dmg('seymour-flux', 2, 3, 'tidus'),
    { type: 'action-end', actorId: 'tidus' },
  ];

  it('an Overdrive\'s first blow carries fxBig and no other blow does; a boss\'s headline move once per action', async () => {
    setFxChapter('seymour-flux');
    setFxMode('new');
    const a = rig();
    await a.play(od);
    expect(a.seen.map((o) => o['fxBig'] === true)).toEqual([true, false, false]);
    const b = rig();
    const boss: Array<Seq<BattleEvent>> = [{ type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId: 'cross-cleave', abilityName: 'Cross Cleave', targets: ['tidus', 'yuna', 'kimahri'] }];
    for (const t of ['tidus', 'yuna', 'kimahri']) boss.push(dmg(t, 0, 1, 'mortiorchis'));
    boss.push({ type: 'action-end', actorId: 'mortiorchis' });
    await b.play(boss);
    expect(b.seen.map((o) => o['fxBig'] === true)).toEqual([true, false, false]);
  });
  it('with the new effects off, or outside the demo chapters, no blow is claimed', async () => {
    setFxChapter('seymour-flux');
    setFxMode('today');
    const a = rig();
    await a.play(od);
    expect(a.seen).toHaveLength(3);
    expect(a.seen.every((o) => o['fxBig'] === undefined)).toBe(true);
    setFxChapter('yunalesca');
    setFxMode('new');
    const b = rig();
    await b.play(od);
    expect(b.seen.every((o) => o['fxBig'] === undefined)).toBe(true);
  });
});
