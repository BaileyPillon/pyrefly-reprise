/**
 * The PRO CAMERA's director (`src/engine/procam/ProDirector.ts`, lane "pro-camera"): which beat gets which shot in Chapter I (FFX) and Chapter IV (FFX-2), when it declines, and that every
 * shot it plays is the real one laid on the live figures. Run against fakes: a stage whose figures stand at the Gagazet and Bevelle slots, and a camera whose `pro` is the real layer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { resetProCamForTests, setCastShot, setProCam } from '../../../src/engine/procam/ProCamSwitch.ts';
import { ProDirector } from '../../../src/engine/procam/ProDirector.ts';
import { ProLayer } from '../../../src/engine/procam/ProLayer.ts';
import { actionKills } from '../../../src/engine/procam/ProBurst.ts';
import { setCameraPreset } from '../../../src/engine/CameraPreset.ts';
import type { ActorHandle, BattleStage, CameraPort } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAction, ShotCtx, ShotDirector, ShotSubject } from '../../../src/engine/ShotDirector.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import type { Pose } from '../../../src/engine/procam/ProTypes.ts';

type Side = 'party' | 'enemy' | 'aeon';
interface Fig {
  side: Side;
  x: number;
  z: number;
  h: number;
  art?: string;
}

const GAGAZET: Record<string, Fig> = {
  tidus: { side: 'party', x: -1.55, z: 1.55, h: 1.75 },
  yuna: { side: 'party', x: -2.95, z: 0.25, h: 1.604 },
  kimahri: { side: 'party', x: -1.05, z: -1.05, h: 2.139 },
  'seymour-flux': { side: 'enemy', x: 1.95, z: -2.45, h: 4.1 },
  mortiorchis: { side: 'enemy', x: 1.8, z: -7, h: 2 },
};
const BEVELLE: Record<string, Fig> = {
  yuna: { side: 'party', x: -2.05, z: 1.45, h: 1.75 },
  rikku: { side: 'party', x: -1.3, z: 0.1, h: 1.6 },
  paine: { side: 'party', x: -0.9, z: -1.5, h: 1.8 },
  bahamut: { side: 'enemy', x: 1.05, z: -5.8, h: 3.5 },
};

const actorOf = (f: Fig): ActorHandle =>
  ({
    get position() {
      return { x: f.x, y: 0, z: f.z }; // live: the figure runs and the camera reads where he is now
    },
    headPoint: () => ({ x: f.x, y: f.h * 0.92, z: f.z }),
    centerPoint: () => ({ x: f.x, y: f.h * 0.52, z: f.z }),
  }) as unknown as ActorHandle;

function world(figs: Record<string, Fig>): { stage: BattleStage; camera: CameraPort & { layer: ProLayer; held: boolean; punch: ReturnType<typeof vi.fn> }; figs: Record<string, Fig> } {
  const layer = new ProLayer();
  layer.step(0.016, { pos: [0, 3, 9.5], look: [0, 1.4, -1], fov: 32, roll: 0 }, 16 / 9); // the layer has seen a frame: a real camera has
  const camera = {
    layer,
    held: false,
    punch: vi.fn(() => Promise.resolve()),
    get pro() {
      return camera.held ? undefined : layer;
    },
    get holding() {
      return camera.held;
    },
    rigNames: ['idle'],
    rigName: 'idle',
  } as unknown as CameraPort & { layer: ProLayer; held: boolean; punch: ReturnType<typeof vi.fn> };
  const stage = {
    camera,
    actor: (id: string) => (figs[id] ? actorOf(figs[id]!) : undefined),
    sideOf: (id: string) => figs[id]?.side,
    staged: () => Object.keys(figs),
    artOf: (id: string) => figs[id]?.art ?? id,
  } as unknown as BattleStage;
  return { stage, camera, figs };
}

/** The director as BattleMoments sees it: through the interface. */
const dir = (s: BattleStage): ShotDirector => new ProDirector(s);

const subj = (id: string, figs: Record<string, Fig>): ShotSubject => ({ id, side: figs[id]?.side });

function mk(_figs: Record<string, Fig>, camera: CameraPort, over: Partial<ShotCtx> = {}): ShotCtx {
  return { camera, speed: 'normal', skipping: false, ms: (b: number) => b, reducedMotion: false, ...over } as ShotCtx;
}

function open(w: ReturnType<typeof world>, d: ShotDirector, who: string, kind: string, targets: string[], info: Partial<ShotAction> = {}, over: Partial<ShotCtx> = {}): boolean | Promise<boolean> {
  const ctx: ActionShot = { ...mk(w.figs, w.camera, over), actor: subj(who, w.figs), targets: targets.map((t) => subj(t, w.figs)), action: { kind, ...info } };
  return d.actionOpen!(ctx);
}

function hit(w: ReturnType<typeof world>, d: ShotDirector, who: string, kind: string, target: string, info: Partial<ShotAction> = {}, extra: Partial<ImpactShot> = {}): boolean {
  const ctx: ImpactShot = { ...mk(w.figs, w.camera), actor: subj(who, w.figs), action: { kind, ...info }, target: subj(target, w.figs), hitIndex: 0, heavy: false, ...extra };
  return d.impact!(ctx);
}

function close(w: ReturnType<typeof world>, d: ShotDirector, who: string, kind: string): boolean | Promise<boolean> {
  const ctx: ActorShot = { ...mk(w.figs, w.camera), actor: subj(who, w.figs), action: { kind } };
  return d.actionClose!(ctx);
}

const REST: Pose = { pos: [0, 3.05, 9.5], look: [0.15, 1.35, -1.2], fov: 32, roll: 0 };
const frames = (l: ProLayer, n: number, dt = 1 / 60): void => {
  for (let i = 0; i < n; i++) l.step(dt, REST, 16 / 9);
};

beforeEach(() => {
  resetProCamForTests('?pack=demo');
  setCameraPreset('calm');
  setDemoChapter('seymour-flux');
});
afterEach(() => {
  resetProCamForTests();
  setDemoChapter(undefined);
  setCameraPreset('calm');
});

describe('when it declines (the beat then plays as it does today)', () => {
  it('with the switch off, or outside the two demo chapters', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    setProCam(false);
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    setProCam(undefined);
    setDemoChapter('yunalesca');
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    expect(hit(w, d, 'tidus', 'attack', 'seymour-flux')).toBe(false);
    expect(close(w, d, 'tidus', 'attack')).toBe(false);
    expect(w.camera.layer.active).toBe(false);
  });
  it('at fast-forward skip, on the upright phone, under the steady and originals presets, and under an FFX-2 command menu', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'], {}, { skipping: true })).toBe(false);
    w.camera.layer.step(0.016, REST, 0.46); // an upright phone
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    w.camera.layer.step(0.016, REST, 16 / 9);
    setCameraPreset('steady');
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    setCameraPreset('originals');
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    setCameraPreset('calm');
    w.camera.held = true;
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(false);
    w.camera.held = false;
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'])).toBe(true);
  });
  it('the opening, a turn start and the telegraph and form-change holds are never taken', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    expect(d.battleStart?.({ ...mk(w.figs, w.camera), partyIds: [], boss: subj('seymour-flux', w.figs), bossName: 'Seymour Flux' })).toBe(false);
    expect(d.turnStart?.({ ...mk(w.figs, w.camera), actor: subj('tidus', w.figs) })).toBe(false);
    expect(d.telegraph).toBeUndefined();
    expect(d.formChange).toBeUndefined();
  });
});

describe('Chapter I (FFX): the real shots and the moves', () => {
  it('a plain attack gets the Expedition 33-style move: it leans toward the exchange, follows the lunge, takes the contact, and glides home at the close', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'], { commandKind: 'attack' })).toBe(true);
    const l = w.camera.layer;
    expect(l.runId).toBe('attack.tidus');
    frames(l, 60);
    const pushed = l.pose!;
    expect(pushed.pos[2]).toBeLessThan(REST.pos[2] - 0.8); // the eye leaned in
    expect(pushed.look[0]).toBeGreaterThan(REST.look[0]); // and the aim toward the boss's side
    const before = l.pose!.pos[2];
    expect(hit(w, d, 'tidus', 'attack', 'seymour-flux')).toBe(true);
    frames(l, 8);
    expect(l.pose!.pos[2]).toBeLessThan(before - 0.02); // the contact settle pushes a little more
    expect(close(w, d, 'tidus', 'attack')).toBe(true);
    frames(l, 90);
    expect(l.active).toBe(false);
  });
  it('the move follows the attacker: the aim slides with him as he runs in', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'tidus', 'attack', ['seymour-flux']);
    frames(w.camera.layer, 60);
    const home = w.camera.layer.pose!.look[0];
    w.figs['tidus']!.x += 3;
    frames(w.camera.layer, 4);
    expect(w.camera.layer.pose!.look[0]).toBeGreaterThan(home + 0.5);
  });
  it('a caster gets the real caster close shot, variant 2 by default, laid on his feet', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    expect(open(w, d, 'yuna', 'cast', ['tidus'], { abilityId: 'cure', commandKind: 'ability' })).toBe(true);
    expect(w.camera.layer.runId).toBe('cast.start.yuna.ally#2');
    frames(w.camera.layer, 90);
    const p = w.camera.layer.pose!;
    // the real key: the eye is a metre or two from Yuna, at her chest height, not at the wide master
    expect(Math.hypot(p.pos[0] - GAGAZET['yuna']!.x, p.pos[2] - GAGAZET['yuna']!.z)).toBeLessThan(6);
    expect(p.pos[1]).toBeLessThan(2.6);
  });
  it('?castshot= picks the variant, and a foe target reads the foe group', () => {
    setCastShot(0);
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'tidus', 'cast', ['seymour-flux'], { abilityId: 'haste', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('cast.start.tidus#0');
  });
  it('an item gets the same close shot', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'tidus', 'item', ['tidus'], { commandKind: 'item' });
    expect(w.camera.layer.runId).toBe('cast.start.tidus#2');
  });
  it('a black-magic landing replaces the start orbit at the first blow; white magic keeps it', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'kimahri', 'cast', ['seymour-flux'], { abilityId: 'fire', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('cast.start.kimahri#2');
    expect(hit(w, d, 'kimahri', 'cast', 'seymour-flux', { abilityId: 'fire' }, { element: 'fire' })).toBe(true);
    expect(w.camera.layer.runId).toMatch(/^cast\.launch\.fire\.lulu#\d$/);
    const w2 = world(GAGAZET);
    const d2 = dir(w2.stage);
    open(w2, d2, 'yuna', 'cast', ['tidus'], { abilityId: 'cure' });
    hit(w2, d2, 'yuna', 'cast', 'tidus', { abilityId: 'cure' }, { element: 'none' });
    expect(w2.camera.layer.runId).toBe('cast.start.yuna.ally#2');
  });
  it('a killing blow: the push along the run, then the real tilted close shot at the blow', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'tidus', 'attack', ['seymour-flux'], { commandKind: 'attack', lethal: true });
    expect(w.camera.layer.runId).toBe('finisher.run.tidus');
    frames(w.camera.layer, 50);
    expect(hit(w, d, 'tidus', 'attack', 'seymour-flux', {}, { lethal: true })).toBe(true);
    expect(w.camera.layer.runId).toBe('finisher.blow.tidus');
    frames(w.camera.layer, 12);
    const p = w.camera.layer.pose!;
    expect(p.fov).toBeLessThan(40); // the real long lens
  });
  it('a blow that does not kill never starts the killing-blow shot', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'tidus', 'attack', ['seymour-flux'], { lethal: false });
    hit(w, d, 'tidus', 'attack', 'seymour-flux', {}, { lethal: true }); // a lethal flag with no run-up: nothing to cut from
    expect(w.camera.layer.runId).toBe('attack.tidus');
  });
  it('Seymour\'s Flare: his real start shot, then his real launch shot on the first blow', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    d.battleStart?.({ ...mk(w.figs, w.camera), partyIds: [], boss: subj('seymour-flux', w.figs), bossName: 'Seymour Flux' });
    open(w, d, 'seymour-flux', 'cast', ['tidus'], { abilityId: 'flare-self', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('enemy.start.flare.v0#0');
    hit(w, d, 'seymour-flux', 'cast', 'tidus', { abilityId: 'flare-self' });
    expect(w.camera.layer.runId).toMatch(/^enemy\.launch\.flare#\d$/);
  });
  it('Total Annihilation, by Mortiorchis: Seymour\'s start shot, then the authored low frame', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    d.battleStart?.({ ...mk(w.figs, w.camera), partyIds: [], boss: subj('seymour-flux', w.figs), bossName: 'Seymour Flux' });
    open(w, d, 'mortiorchis', 'cast', ['tidus'], { abilityId: 'total-annihilation', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('enemy.start.total-annihilation.v0#0');
    hit(w, d, 'mortiorchis', 'cast', 'tidus', { abilityId: 'total-annihilation' });
    expect(w.camera.layer.runId).toBe('launch.total-annihilation');
    frames(w.camera.layer, 120);
    const p = w.camera.layer.pose!;
    expect(p.pos[1]).toBeLessThan(1.5); // a low frame
    expect(p.roll).toBeLessThan(0); // with the dutch tilt
  });
  it('Cross Cleave has no start shot in the real game: its launch shot is the authored low frame', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'seymour-flux', 'attack', ['tidus'], { abilityId: 'cross-cleave' });
    expect(w.camera.layer.active).toBe(false);
    hit(w, d, 'seymour-flux', 'attack', 'tidus', { abilityId: 'cross-cleave' });
    expect(w.camera.layer.runId).toBe('launch.cross-cleave');
  });
  it('an unlisted boss move that is a plain attack gets the attack move; one that is not an attack gets nothing', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'seymour-flux', 'attack', ['tidus'], { abilityId: 'lance-of-atrophy' });
    expect(w.camera.layer.runId).toBe('attack.seymour-flux');
    const w2 = world(GAGAZET);
    const d2 = dir(w2.stage);
    open(w2, d2, 'mortiorchis', 'cast', ['seymour-flux'], { abilityId: 'mortibsorption' });
    expect(w2.camera.layer.active).toBe(false);
  });
  it('an Overdrive opens on the real skill-start close shot', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    const ctx: ActionShot = { ...mk(w.figs, w.camera), actor: subj('tidus', w.figs), targets: [subj('seymour-flux', w.figs)], action: { kind: 'overdrive', name: 'Slice & Dice' } };
    expect(d.overdriveStart?.(ctx)).toBe(true);
    expect(w.camera.layer.runId).toBe('skill.start.tidus#2');
    expect(d.overdriveEnd?.({ ...mk(w.figs, w.camera), actor: subj('tidus', w.figs) })).toBe(true);
  });
  it('the victory is the real close-up of the last party actor to act', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    d.battleStart?.({ ...mk(w.figs, w.camera), partyIds: [], boss: subj('seymour-flux', w.figs), bossName: 'Seymour Flux' });
    open(w, d, 'kimahri', 'attack', ['seymour-flux']);
    close(w, d, 'kimahri', 'attack');
    frames(w.camera.layer, 100);
    expect(d.victory?.(mk(w.figs, w.camera))).toBe(true);
    expect(w.camera.layer.runId).toBe('victory.kimahri#0');
  });
  it('only the owner of the camera ends its shot: another action\'s close leaves it', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'yuna', 'cast', ['tidus']);
    close(w, d, 'tidus', 'attack');
    expect(w.camera.layer.runId).toBe('cast.start.yuna.ally#2');
    close(w, d, 'yuna', 'cast');
    frames(w.camera.layer, 90);
    expect(w.camera.layer.active).toBe(false);
  });
});

describe('REDUCE MOTION and the playback speed', () => {
  it('plays no move on a plain attack and holds every real shot as a cut in and a cut out', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    expect(open(w, d, 'tidus', 'attack', ['seymour-flux'], {}, { reducedMotion: true })).toBe(true);
    expect(w.camera.layer.active).toBe(false);
    expect(open(w, d, 'yuna', 'cast', ['tidus'], {}, { reducedMotion: true })).toBe(true);
    expect(w.camera.layer.runId).toBe('cast.start.yuna.ally#2');
    const l = w.camera.layer;
    frames(l, 4);
    const a = l.pose!;
    frames(l, 120);
    const b = l.pose!;
    expect(b.pos).toEqual(a.pos); // held: it does not move
    expect(b.fov).toBe(a.fov);
  });
  it('fast-forward runs the shot faster and shortens its blends', () => {
    const w = world(GAGAZET);
    const d = dir(w.stage);
    open(w, d, 'yuna', 'cast', ['tidus'], {}, { ms: (b: number) => b * 0.32, speed: 'fast' });
    frames(w.camera.layer, 4);
    expect(w.camera.layer.clock).toBeGreaterThan(4 * (1000 / 60) * 3); // 1 / 0.32 times as fast
  });
});

describe('Chapter IV (FFX-2): the auto camera, with pushes only on specials and Mega Flare', () => {
  beforeEach(() => {
    setDemoChapter('ffx2-bahamut');
  });
  it('installs the group follower at the first turn and glides toward the real candidate; held under a menu it returns to the rig', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    d.turnStart?.({ ...mk(w.figs, w.camera), actor: subj('yuna', w.figs) });
    const l = w.camera.layer;
    l.setBoxes(() => ({ x0: -9, x1: -8, y0: 0, y1: 1, z0: 0, z1: 1 })); // far off to one side: nothing to fit
    frames(l, 20);
    const first = l.pose!;
    frames(l, 400);
    const settled = l.pose!;
    expect(settled.pos).not.toEqual(REST.pos); // it moved toward the candidate
    expect(settled.pos[1]).toBeGreaterThan(REST.pos[1]); // a higher angle than the rest
    expect(Math.hypot(settled.pos[0] - first.pos[0], settled.pos[2] - first.pos[2])).toBeGreaterThan(0);
    w.camera.held = true;
    frames(l, 600);
    const back = l.pose!;
    expect(Math.hypot(back.pos[0] - REST.pos[0], back.pos[1] - REST.pos[1], back.pos[2] - REST.pos[2])).toBeLessThan(0.15);
  });
  it('the eye never moves faster than the cap', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    d.turnStart?.({ ...mk(w.figs, w.camera), actor: subj('yuna', w.figs) });
    const l = w.camera.layer;
    l.setBoxes(() => null);
    let prev = l.step(1 / 60, REST, 16 / 9)!.pose.pos;
    let top = 0;
    for (let i = 0; i < 900; i++) {
      const p = l.step(1 / 60, REST, 16 / 9)!.pose.pos;
      top = Math.max(top, Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]) * 60);
      prev = p;
    }
    expect(top).toBeLessThanOrEqual(2.4);
  });
  it('a plain attack gets the lighter move; a special gets the push; Mega Flare gets the low pull', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    d.turnStart?.({ ...mk(w.figs, w.camera), actor: subj('rikku', w.figs) });
    open(w, d, 'paine', 'attack', ['bahamut']);
    expect(w.camera.layer.runId).toBe('attack.paine');
    close(w, d, 'paine', 'attack');
    open(w, d, 'rikku', 'cast', ['bahamut'], { abilityId: 'x2-dark-knight-darkness', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('special.rikku');
    close(w, d, 'rikku', 'cast');
    open(w, d, 'bahamut', 'cast', ['yuna'], { abilityId: 'mega-flare', commandKind: 'ability' });
    expect(w.camera.layer.runId).toBe('mega-flare');
  });
  it('which skills are specials: the skills of the non-mage dresspheres; a mage spell and an attack are not', () => {
    const probe = (ability: string, kind: string): string | null => {
      const w = world(BEVELLE);
      const d = dir(w.stage);
      open(w, d, 'rikku', kind, ['bahamut'], { abilityId: ability, commandKind: 'ability' });
      return w.camera.layer.runId;
    };
    expect(probe('x2-warrior-power-break', 'cast')).toBe('special.rikku');
    expect(probe('x2-dark-knight-charon', 'cast')).toBe('special.rikku');
    expect(probe('x2-white-mage-cure', 'cast')).toBeNull();
    expect(probe('x2-black-mage-fire', 'cast')).toBeNull();
    expect(probe('x2-dark-knight-attack', 'attack')).toBe('attack.rikku');
  });
  it('a spell or an item has no shot of its own: the follower frames it', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    open(w, d, 'yuna', 'cast', ['rikku'], { abilityId: 'x2-white-mage-cure', commandKind: 'ability' });
    expect(w.camera.layer.active).toBe(false);
    open(w, d, 'yuna', 'item', ['rikku'], { commandKind: 'item' });
    expect(w.camera.layer.active).toBe(false);
  });
  it('a plain attack does not displace a bigger shot that already holds the camera', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    open(w, d, 'bahamut', 'cast', ['yuna'], { abilityId: 'mega-flare' });
    open(w, d, 'paine', 'attack', ['bahamut']);
    expect(w.camera.layer.runId).toBe('mega-flare');
    close(w, d, 'paine', 'attack'); // a different action's close
    expect(w.camera.layer.runId).toBe('mega-flare');
  });
  it('the impact is taken (no cut to the target while a bar is live) and the victory is declined', () => {
    const w = world(BEVELLE);
    const d = dir(w.stage);
    open(w, d, 'paine', 'attack', ['bahamut']);
    expect(hit(w, d, 'paine', 'attack', 'bahamut')).toBe(true);
    expect(d.victory?.(mk(w.figs, w.camera))).toBe(false);
    expect(w.camera.layer.active).toBe(false);
  });
});

describe('the burst helper', () => {
  const ev = (o: unknown): BattleEvent => o as BattleEvent;
  it('finds the KO of a foe inside one action, and stops at the action\'s end', () => {
    const events = [ev({ type: 'action-start' }), ev({ type: 'damage', targetId: 'boss' }), ev({ type: 'ko', targetId: 'boss' }), ev({ type: 'action-end' })];
    expect(actionKills({ events, at: 0 }, (id) => id === 'boss')).toBe(true);
    expect(actionKills({ events, at: 0 }, () => false)).toBe(false);
    expect(actionKills({ events: [ev({ type: 'action-start' }), ev({ type: 'action-end' }), ev({ type: 'ko', targetId: 'boss' })], at: 0 }, () => true)).toBe(false);
    expect(actionKills(undefined, () => true)).toBe(false);
  });
  it('of two blows on one target only the last is the killing one', () => {
    const events = [ev({ type: 'action-start' }), ev({ type: 'damage', targetId: 'boss' }), ev({ type: 'damage', targetId: 'boss' }), ev({ type: 'ko', targetId: 'boss' })];
    expect(actionKills({ events, at: 1 }, () => false, 'boss')).toBe(false);
    expect(actionKills({ events, at: 2 }, () => false, 'boss')).toBe(true);
  });
});
