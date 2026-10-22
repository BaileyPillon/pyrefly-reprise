/**
 * Motion pass, lane "core": the fixes the adversarial review of tip 078d4cb65 asked for (MAJOR-1 to MAJOR-3 and the minors).
 *
 * - MAJOR-1: the staged figures' normal maps are fetched and pinned early, and the cache cap is raised, ONLY when a new piece is on in a demo chapter; with everything off (the default, and every
 *   chapter but I and IV) staging is what it always was. Pins are counted per figure, not one flag per map.
 * - MAJOR-2: a heavy body's strike lands later, so its sound is asked for later (Seymour Flux's swing led his blow by 116 ms).
 * - MAJOR-3 (D-357, FFX-2: nothing plays over an open command menu): the cast lift and the stand-down. (The smear's cut and flash, the rig's window and the knock-out are pinned in
 *   `motion-core-smear-actor`, `rig-smear-window` and `motion-core-moments`.)
 * - minor: a fourth concurrent leap settles the oldest one's promise and marks but does not stop its arc (no lift pops away).
 *
 * Game case: all of it is shared plumbing (both games); the menu rule is FFX-2 only in effect (`KeySlots.menuBlocks`).
 */
import { Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import { lookState } from '../../../src/engine/look/LookState.ts';
import { pinnedRelightCount, prefetchRelight, relightStats, unpinRelight } from '../../../src/engine/look/relight/FigureRelight.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { newMotionOn } from '../../../src/engine/motion/NewMotionGate.ts';
import { menuHolds, setMenuHold } from '../../../src/engine/motion/MenuHold.ts';
import { liftCaster } from '../../../src/engine/motion/CurveBeats.ts';
import { standDownParty } from '../../../src/engine/motion/MomentBeats.ts';
import { CurveDriver } from '../../../src/engine/motion/CurveDriver.ts';
import { PROFILES, defaultPaceFactor } from '../../../src/engine/motion/StrikeCurve.ts';
import { heftOf } from '../../../src/engine/motion/ActorCurves.ts';
import { STRIKE_BEAT_MS, strikeBeatNow } from '../../../src/engine/StrikeBeat.ts';
import { noteSfxEvent, playCue } from '../../../src/engine/BattlePresenterSfx.ts';

let armedBefore = false;
beforeEach(() => {
  armedBefore = lookState.armed;
  setPaceGame('ffx');
  setPace('steady');
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, _url: string, onLoad?: (t: Texture) => void): Texture {
    const t = new Texture();
    onLoad?.(t);
    return t;
  } as never);
});
afterEach(() => {
  lookState.armed = armedBefore;
  vi.restoreAllMocks();
  setMenuHold(null);
  setMomentsMode(null);
  setSmearStyle(null);
  setCurvesMode(null);
  setCurvesChapter(undefined);
  setPaceGame('other');
  reset();
});

// ------------------------------------------------------------------------------------------ MAJOR-1
describe('newMotionOn: the one question the supporting plumbing asks', () => {
  it('is false by default and with only a chapter named; true for any one piece in a demo chapter; false again in any other chapter', () => {
    expect(newMotionOn()).toBe(false);
    setCurvesChapter('seymour-flux');
    expect(newMotionOn()).toBe(false);
    setCurvesMode('new');
    expect(newMotionOn()).toBe(true);
    setCurvesMode('today');
    expect(newMotionOn()).toBe(false);
    setSmearStyle('blur');
    expect(newMotionOn()).toBe(true);
    setSmearStyle('off');
    setMomentsMode('new');
    expect(newMotionOn()).toBe(true);
    setCurvesChapter('ffx2-bahamut');
    expect(newMotionOn()).toBe(true);
    setCurvesChapter('tourist-trap');
    expect(newMotionOn()).toBe(false);
  });
});

function stage(name: string, poses = ['idle', 'attack', 'follow']): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const map: Record<string, ReturnType<typeof painting>> = {};
  for (const p of poses) map[p] = painting('auron', p, {}, `/art/characters/${name}/${p}.png`); // a record the fixture knows, a URL of its own so no test finds another's maps cached
  a.adoptPoses(map, 'idle');
  return a;
}

describe('the staged figures\' normal maps (review MAJOR-1: the live game\'s staging must not change with the switches off)', () => {
  it('with every new piece off, a look-armed chapter stages as it always has: nothing pinned early, only the shown pose\'s map is asked for', () => {
    lookState.armed = true;
    setCurvesChapter('seymour-flux'); // a demo chapter, but no switch is on
    const pins = pinnedRelightCount();
    const asked = relightStats.requested;
    const a = stage('offfig');
    expect(pinnedRelightCount()).toBe(pins);
    expect(relightStats.requested - asked).toBeLessThanOrEqual(1);
    a.dispose();
    expect(pinnedRelightCount()).toBe(pins);
  });

  it('with a new piece on in a demo chapter, every pose\'s map is fetched and pinned at staging, and disposal lets them go', () => {
    lookState.armed = true;
    setCurvesChapter('ffx2-bahamut');
    setSmearStyle('paint');
    const pins = pinnedRelightCount();
    const asked = relightStats.requested;
    const a = stage('onfig');
    expect(pinnedRelightCount()).toBe(pins + 3);
    expect(relightStats.requested - asked).toBe(3);
    a.adoptPoses({ idle: painting('auron', 'idle', {}, '/art/characters/onfig/idle.png') }, 'idle'); // staged again: the same map is not counted twice
    expect(pinnedRelightCount()).toBe(pins + 3);
    a.dispose();
    expect(pinnedRelightCount()).toBe(pins);
  });

  it('a look-less chapter never prefetches, whatever the address says', () => {
    lookState.armed = false;
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const asked = relightStats.requested;
    stage('nolook');
    expect(relightStats.requested).toBe(asked);
  });

  it('a map two live figures share stays pinned until the last of them lets go', () => {
    lookState.armed = true;
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const pins = pinnedRelightCount();
    const a = stage('twin');
    const b = stage('twin');
    expect(pinnedRelightCount()).toBe(pins + 3); // three maps, each held by two figures
    a.dispose();
    expect(pinnedRelightCount()).toBe(pins + 3);
    b.dispose();
    expect(pinnedRelightCount()).toBe(pins);
  });
});

describe('the cache cap follows the pins (56 as it always was with nothing pinned, 112 with the new motion staging)', () => {
  /** A fresh copy of the cache (the module keeps it in a closure), with the look armed. */
  async function fresh(): Promise<{ look: typeof import('../../../src/engine/look/relight/FigureRelight.ts'); armed: () => void }> {
    vi.resetModules();
    const look = await import('../../../src/engine/look/relight/FigureRelight.ts');
    const { lookState: ls } = await import('../../../src/engine/look/LookState.ts');
    return { look, armed: () => void (ls.armed = true) };
  }
  const url = (i: number): string => `/art/characters/capfig${i}/idle.png`;
  const bind = async (look: typeof import('../../../src/engine/look/relight/FigureRelight.ts'), i: number): Promise<void> => {
    const { ShaderMaterial } = await import('three');
    look.bindRelight(new ShaderMaterial({ uniforms: {} }), url(i), 1);
  };

  it('nothing pinned: the 57th map pushes the oldest out (the cap is 56)', async () => {
    const { look, armed } = await fresh();
    armed();
    for (let i = 0; i < 56; i++) await bind(look, i);
    const requested = look.relightStats.requested;
    await bind(look, 0); // still cached
    expect(look.relightStats.requested).toBe(requested);
    await bind(look, 56);
    await bind(look, 57);
    await bind(look, 1); // went out when the cache passed 56
    expect(look.relightStats.requested).toBe(requested + 3);
  });

  it('with a pin held the cap is 112: 100 other maps stay cached', async () => {
    const { look, armed } = await fresh();
    armed();
    const held = new Set<string>();
    look.prefetchRelight('/art/characters/pinned/idle.png', 1, false, held);
    expect(look.pinnedRelightCount()).toBe(1);
    for (let i = 0; i < 100; i++) await bind(look, i);
    const requested = look.relightStats.requested;
    for (let i = 0; i < 100; i++) await bind(look, i);
    expect(look.relightStats.requested).toBe(requested); // none was evicted
    look.unpinRelight(held);
    expect(look.pinnedRelightCount()).toBe(0);
  });

  it('prefetchRelight counts a figure\'s hold once, and unpinning a held map twice does not go below zero', async () => {
    const { look, armed } = await fresh();
    armed();
    const a = new Set<string>();
    const b = new Set<string>();
    look.prefetchRelight('/art/characters/share/idle.png', 1, false, a);
    look.prefetchRelight('/art/characters/share/idle.png', 1, false, a);
    look.prefetchRelight('/art/characters/share/idle.png', 1, false, b);
    expect(look.pinnedRelightCount()).toBe(1);
    look.unpinRelight(a);
    expect(look.pinnedRelightCount()).toBe(1); // b still holds it
    look.unpinRelight(b);
    look.unpinRelight(b);
    expect(look.pinnedRelightCount()).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------ MAJOR-2
describe('the strike\'s sound follows the blow of a heavy body (review MAJOR-2)', () => {
  it('off, every body\'s beat is today\'s; on, a boss\'s is the party\'s stretched by its heft, up to x1.3', () => {
    expect(strikeBeatNow(1)).toBe(STRIKE_BEAT_MS);
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const p = PROFILES.ffx;
    const party = strikeBeatNow();
    expect(party).toBe(Math.round((p.windupMs + p.travelMs) / defaultPaceFactor('ffx')));
    expect(strikeBeatNow(0)).toBe(party);
    expect(strikeBeatNow(1)).toBe(Math.round(((p.windupMs + p.travelMs) * 1.3) / defaultPaceFactor('ffx')));
    expect(strikeBeatNow(0.5)).toBeGreaterThan(party);
    expect(strikeBeatNow(0.5)).toBeLessThan(strikeBeatNow(1));
  });

  it('the actor publishes the heft its strike runs with', () => {
    const boss = new PaintedActor({ name: 'seymour-flux', worldHeight: 4.1, side: 'enemy', breathe: false, sway: false, shadow: false });
    const girl = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    expect((girl as unknown as { strikeHeft(): number }).strikeHeft()).toBe(0);
    expect((boss as unknown as { strikeHeft(): number }).strikeHeft()).toBe(heftOf(4.1));
    expect(heftOf(4.1)).toBe(1);
  });

  it('the cue asks for its peak on THIS actor\'s contact: the party at +400 ms, Seymour Flux at +520 ms (steady pace)', () => {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const hefts: Record<string, number> = { tidus: 0, 'seymour-flux': 1 };
    const asked: Array<{ beatMs?: number }> = [];
    const mk = (id: string): never =>
      ({
        actingId: id,
        speed: () => 'normal',
        deps: { audio: { playSfx: (_k: string, o: { beatMs?: number }) => asked.push(o) }, sfxVoice: () => ({ key: 'swing', events: ['swing-flux'] }) },
        stage: { actor: (who: string) => ({ strikeHeft: () => hefts[who] ?? 0 }) },
      }) as never;
    const party = mk('tidus');
    noteSfxEvent(party, { type: 'action-start', seq: 0, actorId: 'tidus', command: { kind: 'attack' } } as never);
    playCue(party, 'attack');
    const boss = mk('seymour-flux');
    noteSfxEvent(boss, { type: 'action-start', seq: 1, actorId: 'seymour-flux', command: { kind: 'attack' } } as never);
    playCue(boss, 'attack');
    expect(asked).toHaveLength(2);
    expect(asked[0]!.beatMs).toBeCloseTo(400, 0);
    expect(asked[1]!.beatMs).toBeCloseTo(520, 0);
    expect(asked[1]!.beatMs! - asked[0]!.beatMs!).toBeGreaterThan(100); // the 116 ms the review measured
  });

  it('a context with no stage at all (a test double of the sound hookup) still gets its cue: the stage is only asked for the heft', () => {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const asked: Array<{ beatMs?: number }> = [];
    const c = {
      actingId: 'x',
      speed: () => 'normal',
      deps: { audio: { playSfx: (_k: string, o: { beatMs?: number }) => asked.push(o) }, sfxVoice: () => ({ key: 'swing', events: ['swing'] }) },
    } as never;
    expect(() => playCue(c, 'attack')).not.toThrow();
    expect(asked).toHaveLength(1);
    expect(asked[0]!.beatMs).toBeGreaterThan(0);
  });

  it('an actor with no heft to report (a test double, FF7) asks for the party\'s beat', () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('new');
    const asked: Array<{ beatMs?: number }> = [];
    const mk = (actor: object): never =>
      ({
        actingId: 'x',
        speed: () => 'normal',
        deps: { audio: { playSfx: (_k: string, o: { beatMs?: number }) => asked.push(o) }, sfxVoice: () => ({ key: 'swing', events: ['swing'] }) },
        stage: { actor: () => actor },
      }) as never;
    playCue(mk({}), 'attack');
    playCue(mk({ strikeHeft: () => 0 }), 'attack');
    playCue(mk({ strikeHeft: () => 1 }), 'attack');
    expect(asked[0]!.beatMs).toBeGreaterThan(0);
    expect(asked[0]!.beatMs).toBe(asked[1]!.beatMs);
    expect(asked[2]!.beatMs).toBeGreaterThan(asked[1]!.beatMs!);
  });
});

// ------------------------------------------------------------------------------------------ MAJOR-3
/** A presenter context of an FFX-2 battle with (or without) a command menu open. */
const ffx2Ctx = (menu: boolean, actor: object): never =>
  ({
    speed: () => 'normal',
    deps: {},
    menuOpen: () => menu,
    moments: { shots: { ffx2Framing: true } },
    stage: { actor: () => actor, staged: () => ['a', 'b'], sideOf: () => 'party' },
  }) as never;

describe('nothing new plays over an open FFX-2 command menu (D-357)', () => {
  it('MenuHold: no probe holds nothing; the probe answers; one that throws holds nothing', () => {
    expect(menuHolds()).toBe(false);
    setMenuHold(() => true);
    expect(menuHolds()).toBe(true);
    setMenuHold(() => {
      throw new Error('boom');
    });
    expect(menuHolds()).toBe(false);
    setMenuHold(null);
    expect(menuHolds()).toBe(false);
  });

  it('the cast lift is not started over an open menu, and is started with it shut; FFX never has a menu to wait for', () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('new');
    const lifts: number[] = [];
    const caster = { position: { x: 0, y: 0, z: 0 }, headPoint: () => ({ x: 0, y: 1.8, z: 0 }), liftTo: (h: number) => lifts.push(h) };
    liftCaster(ffx2Ctx(true, caster), 'yuna' as never);
    expect(lifts).toEqual([]);
    liftCaster(ffx2Ctx(false, caster), 'yuna' as never);
    expect(lifts).toHaveLength(1);
    const ffx = { speed: () => 'normal', deps: {}, menuOpen: () => true, moments: { shots: { ffx2Framing: false } }, stage: { actor: () => caster } } as never;
    liftCaster(ffx, 'tidus' as never);
    expect(lifts).toHaveLength(2);
  });

  it('the stand-down is not played over an open menu', () => {
    setCurvesChapter('ffx2-bahamut');
    setMomentsMode('new');
    const stood: string[] = [];
    const actor = { standDown: () => void stood.push('x') };
    expect(standDownParty(ffx2Ctx(true, actor))).toBe(false);
    expect(stood).toEqual([]);
    expect(standDownParty(ffx2Ctx(false, actor))).toBe(true);
    expect(stood).toHaveLength(2);
  });
});

// ------------------------------------------------------------------------------------------ minor: concurrent leaps
describe('a fourth concurrent leap (review minor)', () => {
  it('settles the oldest one\'s promise and marks, but its arc keeps flying: its lift does not pop away mid-flight', async () => {
    const d = new CurveDriver();
    let fired = 0;
    let resolved = false;
    void d.leap(0.3, 400, { marks: [{ u: 0.9, fn: () => fired++ }] }).then(() => (resolved = true));
    for (let i = 0; i < 33; i++) d.advance(4); // 132 ms in: well off the floor
    const before = d.out.lift;
    expect(before).toBeGreaterThan(0.05);
    for (let i = 0; i < 3; i++) void d.leap(0, 400); // three more, none of them lifting
    d.advance(4);
    expect(fired).toBe(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(true);
    expect(d.out.lift).toBeGreaterThan(before * 0.9); // still in the air, not zero
    let last = d.out.lift;
    for (let i = 0; i < 200; i++) {
      d.advance(4);
      expect(Math.abs(d.out.lift - last)).toBeLessThan(0.02); // no frame jumps
      last = d.out.lift;
    }
    expect(d.out.lift).toBe(0);
  });

  it('a runaway pile (nine at once) is cut, oldest first, and still settles every promise', async () => {
    const d = new CurveDriver();
    let settled = 0;
    for (let i = 0; i < 9; i++) void d.leap(0.1, 400).then(() => settled++);
    for (let i = 0; i < 4; i++) await Promise.resolve();
    expect(settled).toBeGreaterThanOrEqual(6); // all but the newest three are settled
    for (let i = 0; i < 400; i++) d.advance(4);
    for (let i = 0; i < 4; i++) await Promise.resolve();
    expect(settled).toBe(9);
    expect(d.out.lift).toBe(0);
  });
});

describe('prefetchRelight without a holder', () => {
  it('is one pin per call, as before (and unpinning the URL once per call lets it go)', () => {
    lookState.armed = true;
    const pins = pinnedRelightCount();
    const url = prefetchRelight('/art/characters/plainpin/idle.png', 1)!;
    prefetchRelight('/art/characters/plainpin/idle.png', 1);
    expect(pinnedRelightCount()).toBe(pins + 1);
    unpinRelight([url]);
    expect(pinnedRelightCount()).toBe(pins + 1); // two calls, two holds
    unpinRelight([url]);
    expect(pinnedRelightCount()).toBe(pins);
  });
});
