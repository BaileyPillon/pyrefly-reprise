/**
 * CAMERA LAB (branch camera-lab; a test harness, D-318): the pure parts.
 * - the grammar: which shot each beat asks for, per style and per game;
 * - the cut rules: FFX-2 never cuts while a menu is open, holds, one cut per beat, yields;
 * - the geometry: the 180-degree rule, the painted set, the hero in the left third, nobody in the way;
 * - the presenter-facing camera: framing passes only while the lab yields.
 * Game case (rule 14): both games, as a test.
 */
import { describe, expect, it } from 'vitest';
import { shotForBeat, type GrammarContext } from '../../src/engine/lab/shotChoice.ts';
import { LabDirectorCore, MIN_HOLD_MS, TARGET_DEBOUNCE_MS, type LabDirectorCoreOptions } from '../../src/engine/lab/LabDirectorCore.ts';
import { DEFAULT_LAB_SWITCHES, type LabBeat, type LabSwitches, type ShotRequest } from '../../src/engine/lab/LabTypes.ts';
import {
  blocked,
  clampToBand,
  coverOf,
  headingOf,
  floorDir,
  ndcOf,
  onViewerSide,
  reflectAcross,
  viewFor,
  type LabFigure,
  type LabStageView,
} from '../../src/engine/lab/labGeometry.ts';
import { partyCentre, solveShot } from '../../src/engine/lab/labShots.ts';
import { LAB_CHAPTERS, STYLE_TUNING, isBigAbility } from '../../src/engine/lab/labChapters.ts';
import { LabCamera } from '../../src/engine/lab/LabCamera.ts';
import type { CameraPort } from '../../src/engine/BattlePresenterPorts.ts';

const ctx = (over: Partial<GrammarContext> = {}): GrammarContext => ({
  game: 'ffx',
  style: 'persona',
  targetCut: true,
  bossId: 'boss',
  allPartyRear: true,
  ...over,
});
const kind = (a: ShotRequest | 'keep'): string => (a === 'keep' ? 'keep' : a.kind);

describe('camera lab grammar', () => {
  it('FFX turns open on the actor; FFX-2 menus on one master', () => {
    expect(kind(shotForBeat({ kind: 'turn', actorId: 'tidus' }, ctx()))).toBe('hero');
    expect(kind(shotForBeat({ kind: 'turn', actorId: 'yuna' }, ctx({ game: 'ffx2' })))).toBe('party-shoulder');
    expect(kind(shotForBeat({ kind: 'menu-master' }, ctx({ game: 'ffx2', allPartyRear: false })))).toBe('party-front');
  });

  it('skill list and target pick: Persona keeps the frame, Clair Obscur cuts (FFX only)', () => {
    const list = { kind: 'skill-list', actorId: 'tidus', open: true } as const;
    expect(kind(shotForBeat(list, ctx()))).toBe('keep');
    expect(kind(shotForBeat(list, ctx({ style: 'clair' })))).toBe('hero-close');
    expect(kind(shotForBeat(list, ctx({ style: 'clair', game: 'ffx2' })))).toBe('keep');
    const aim = { kind: 'target', actorId: 'tidus', targetId: 'boss', enemy: true, level: 'top' } as const;
    expect(kind(shotForBeat(aim, ctx()))).toBe('keep');
    expect(kind(shotForBeat(aim, ctx({ style: 'clair' })))).toBe('target');
    expect(kind(shotForBeat(aim, ctx({ style: 'clair', targetCut: false })))).toBe('keep');
    expect(kind(shotForBeat({ ...aim, targetId: 'yuna', enemy: false }, ctx({ style: 'clair' })))).toBe('keep');
  });

  it('actions: lunge, caster, item, enemy turn per style, big attacks and victory', () => {
    const act = (pose: string, side: 'party' | 'enemy' = 'party', big = false) =>
      shotForBeat({ kind: 'action', actorId: side === 'enemy' ? 'boss' : 'tidus', side, pose, targets: [side === 'enemy' ? 'tidus' : 'boss'], big }, ctx());
    expect(kind(act('attack'))).toBe('lunge-side');
    expect(kind(act('cast'))).toBe('caster-low');
    expect(kind(act('item'))).toBe('item-close');
    expect(kind(act('defend'))).toBe('keep');
    expect(kind(act('cast', 'enemy'))).toBe('enemy-front');
    expect(kind(shotForBeat({ kind: 'action', actorId: 'boss', side: 'enemy', pose: 'cast', targets: [], big: false }, ctx({ style: 'clair' })))).toBe('enemy-behind-party');
    // Without rear paintings the lens stays off the party's backs.
    expect(kind(shotForBeat({ kind: 'action', actorId: 'boss', side: 'enemy', pose: 'cast', targets: [], big: false }, ctx({ style: 'clair', allPartyRear: false })))).toBe('enemy-front');
    expect(kind(act('cast', 'enemy', true))).toBe('colossus');
    expect(kind(act('attack', 'party', true))).toBe('colossus');
    const clairHit = shotForBeat({ kind: 'action', actorId: 'tidus', side: 'party', pose: 'attack', targets: ['boss'], big: false }, ctx({ style: 'clair' }));
    expect(clairHit !== 'keep' && clairHit.slowOnHit && clairHit.drift).toBe(true);
    expect(kind(shotForBeat({ kind: 'victory', finisher: 'tidus' }, ctx()))).toBe('victory');
    expect(kind(shotForBeat({ kind: 'after-action' }, ctx()))).toBe('keep');
    expect(kind(shotForBeat({ kind: 'after-action' }, ctx({ game: 'ffx2' })))).toBe('party-shoulder');
  });

  it('a blow on several enemies is framed on the boss when the boss is among them', () => {
    const big = shotForBeat({ kind: 'action', actorId: 'bahamut-aeon', side: 'aeon', pose: 'attack', targets: ['mortiorchis', 'boss'], big: true }, ctx());
    expect(big !== 'keep' && big.kind === 'colossus' && big.subject).toBe('boss');
    const hit = shotForBeat({ kind: 'action', actorId: 'tidus', side: 'party', pose: 'attack', targets: ['mortiorchis'], big: false }, ctx());
    expect(hit !== 'keep' && hit.target).toBe('mortiorchis');
  });

  it('names the boss specials', () => {
    expect(isBigAbility(LAB_CHAPTERS['ffx2-bahamut'], 'mega-flare', null)).toBe(true);
    expect(isBigAbility(LAB_CHAPTERS['ffx2-bahamut'], null, 'Mega Flare')).toBe(true);
    expect(isBigAbility(LAB_CHAPTERS['seymour-flux'], 'attack', 'Attack')).toBe(false);
  });
});

function makeCore(game: 'ffx' | 'ffx2', sw: Partial<LabSwitches> = {}, speed = 1) {
  let now = 0;
  const switches: LabSwitches = { ...DEFAULT_LAB_SWITCHES, ...sw };
  const opts: LabDirectorCoreOptions = {
    game,
    now: () => now,
    switches: () => switches,
    speedScale: () => speed,
    bossId: () => 'boss',
    allPartyRear: () => true,
    sideOf: (id) => (id === 'boss' || id === 'mortiorchis' ? 'enemy' : 'party'),
    bigAbility: (id) => id === 'mega-flare',
  };
  const core = new LabDirectorCore(opts);
  const cuts: string[] = [];
  const tick = (ms = 16): void => {
    now += ms;
    const c = core.due();
    if (c) cuts.push(`${c.shot.kind}:${c.shot.subject ?? '-'}@${now}`);
  };
  const beat = (b: LabBeat): void => {
    core.beat(b);
    tick(0);
  };
  return { core, cuts, tick, beat, advance: (ms: number) => { for (let t = 0; t < ms; t += 16) tick(16); } };
}

const action = (actorId: string, pose: string, side: 'party' | 'enemy', targets: string[], abilityId: string | null = null): LabBeat => ({
  kind: 'action', actorId, side, pose, targets, commandKind: pose === 'attack' ? 'attack' : 'ability', abilityId, abilityName: null,
});

describe('camera lab cut rules', () => {
  it('the battle opens yielded: the presenter keeps its opening until the first beat', () => {
    const t = makeCore('ffx');
    expect(t.core.yielding).toBe(true);
    t.beat({ kind: 'yield', reason: 'opening' });
    t.advance(500);
    expect(t.cuts).toEqual([]);
    t.beat({ kind: 'menu-open', actorId: 'tidus' });
    expect(t.core.yielding).toBe(false);
    expect(t.cuts.map((c) => c.split('@')[0])).toEqual(['hero:tidus']);
  });

  it('FFX-2 never cuts while a menu is open: the master lands as it opens, an enemy acts under it on the master', () => {
    const t = makeCore('ffx2', { style: 'clair' });
    t.beat({ kind: 'menu-open', actorId: 'yuna' });
    expect(t.cuts).toEqual(['party-shoulder:-@0']);
    t.beat(action('boss', 'cast', 'enemy', ['yuna'], 'mega-flare'));
    t.beat({ kind: 'impact', targetId: 'yuna', hitIndex: 0, heavy: true });
    t.beat({ kind: 'action-end' });
    t.core.menuLevel('sub');
    t.core.target({ id: 'boss', enemy: true });
    t.core.refresh();
    t.advance(3000);
    expect(t.cuts).toEqual(['party-shoulder:-@0']);
    expect(t.core.takeSlow()).toBe(false);
    // Her command: the menu closes, her action cuts, and the master comes back after it.
    t.beat({ kind: 'menu-close', actorId: 'yuna' });
    t.beat(action('yuna', 'cast', 'party', ['boss']));
    expect(t.cuts[1]).toMatch(/^caster-low:yuna@/);
    t.beat({ kind: 'action-end' });
    expect(t.cuts[2]).toMatch(/^party-shoulder/);
  });

  it('FFX: one cut per beat, the spell pair waits out the hold, and a new beat cuts at once', () => {
    const t = makeCore('ffx');
    t.beat({ kind: 'menu-open', actorId: 'yuna' });
    t.advance(300);
    t.beat({ kind: 'menu-close', actorId: 'yuna' });
    t.beat(action('yuna', 'cast', 'party', ['boss']));
    expect(t.cuts.at(-1)).toMatch(/^caster-low:yuna@/);
    const castAt = Number(t.cuts.at(-1)!.split('@')[1]);
    t.advance(400);
    t.beat({ kind: 'impact', targetId: 'boss', hitIndex: 0, heavy: false });
    expect(t.cuts.length).toBe(2); // not yet: the caster shot holds 1.2 s
    t.advance(MIN_HOLD_MS);
    expect(t.cuts.length).toBe(3);
    const at = Number(t.cuts[2]!.split('@')[1]);
    expect(t.cuts[2]).toMatch(/^impact-wide:boss/);
    expect(at - castAt).toBeGreaterThanOrEqual(MIN_HOLD_MS);
    t.beat({ kind: 'impact', targetId: 'boss', hitIndex: 1, heavy: false });
    t.advance(200);
    expect(t.cuts.length).toBe(3); // a later hit never cuts
    t.beat({ kind: 'action-end' });
    t.beat(action('boss', 'attack', 'enemy', ['tidus']));
    expect(t.cuts.at(-1)).toMatch(/^enemy-front:boss/); // a new beat may cut at once
  });

  it('an attack holds through the hit; Clair Obscur owes one slow-down', () => {
    const t = makeCore('ffx', { style: 'clair' });
    t.beat({ kind: 'menu-open', actorId: 'tidus' });
    t.beat({ kind: 'menu-close', actorId: 'tidus' });
    t.beat(action('tidus', 'attack', 'party', ['boss']));
    t.beat({ kind: 'impact', targetId: 'boss', hitIndex: 0, heavy: false });
    t.advance(2000);
    expect(t.cuts.map((c) => c.split('@')[0])).toEqual(['hero:tidus', 'lunge-side:tidus']);
    expect(t.core.takeSlow()).toBe(true);
    expect(t.core.takeSlow()).toBe(false);
  });

  it('Clair Obscur FFX: skill list and target cuts, debounced; Persona keeps the hero shot', () => {
    const t = makeCore('ffx', { style: 'clair' });
    t.beat({ kind: 'menu-open', actorId: 'tidus' });
    t.core.menuLevel('sub');
    t.tick(0);
    expect(t.cuts.at(-1)).toMatch(/^hero-close:tidus/);
    t.core.target({ id: 'boss', enemy: true });
    t.tick(0);
    expect(t.cuts.at(-1)).toMatch(/^hero-close/); // still settling
    t.core.target({ id: 'mortiorchis', enemy: true });
    t.advance(TARGET_DEBOUNCE_MS + 32);
    expect(t.cuts.at(-1)).toMatch(/^target:mortiorchis/);
    expect(t.cuts.filter((c) => c.startsWith('target:boss'))).toEqual([]); // the quick pass over the boss never cut
    const p = makeCore('ffx', { style: 'persona' });
    p.beat({ kind: 'menu-open', actorId: 'tidus' });
    p.core.menuLevel('sub');
    p.core.target({ id: 'boss', enemy: true });
    p.advance(500);
    expect(p.cuts.map((c) => c.split('@')[0])).toEqual(['hero:tidus']);
  });

  it('yields to an authored moment until its next beat, and nothing cuts at skip speed', () => {
    const t = makeCore('ffx');
    t.beat({ kind: 'menu-open', actorId: 'tidus' });
    t.beat({ kind: 'telegraph', enemyId: 'boss', stage: 2, name: 'Total Annihilation' });
    expect(t.core.yielding).toBe(true);
    t.beat({ kind: 'action-end' });
    t.advance(500);
    expect(t.cuts.length).toBe(1);
    t.beat({ ...action('boss', 'cast', 'enemy', ['tidus']), abilityName: 'Total Annihilation' } as LabBeat);
    expect(t.cuts.at(-1)).toMatch(/^colossus:boss/); // the telegraphed attack is the big one
    const s = makeCore('ffx', {}, 0);
    s.beat({ kind: 'menu-open', actorId: 'tidus' });
    s.beat(action('tidus', 'attack', 'party', ['boss']));
    s.advance(2000);
    expect(s.cuts).toEqual([]);
  });

  it('victory cuts to the last party member who acted', () => {
    const t = makeCore('ffx2');
    t.beat(action('paine', 'attack', 'party', ['boss']));
    t.beat({ kind: 'action-end' });
    t.beat({ kind: 'victory' });
    expect(t.cuts.at(-1)).toMatch(/^victory:paine/);
  });
});

// ------------------------------------------------------------------ geometry

const f = (id: string, x: number, z: number, side: LabFigure['side'] = 'party', height = 1.82, y = 0): LabFigure => ({
  id, pos: { x, y, z }, height, side, standing: true, hasRear: side !== 'enemy',
});

function chapterView(id: 'seymour-flux' | 'ffx2-bahamut', over: Partial<LabStageView> = {}): LabStageView {
  const ch = LAB_CHAPTERS[id];
  const party = ch.partySlots.map((s, i) => f(ch.expectParty[i]!, s[0], s[2]));
  const enemies = Object.entries(ch.enemyPins).map(([eid, s]) => f(eid, s[0], s[2], 'enemy', eid === 'mortiorchis' ? 2.6 : 4.1, s[1]));
  const boss = enemies[0]!.id;
  return {
    figures: [...party, ...enemies],
    bossId: boss,
    aspect: 16 / 9,
    viewer: { x: 0, y: 3.05, z: 9.5 },
    idleRig: { position: [0, 3.05, 9.5], lookAt: [0.15, 1.35, -1.2], fov: 32 },
    partyShoulder: ch.partyShoulder,
    band: ch.band,
    ...over,
  };
}

describe('camera lab geometry', () => {
  it('the 180-degree rule: reflection lands on the viewer side', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 0, z: -8 };
    const viewer = { x: 0, y: 3, z: 10 };
    const wrong = { x: -6, y: 1, z: -6 };
    expect(onViewerSide(wrong, a, b, viewer)).toBe(false);
    expect(onViewerSide(reflectAcross(wrong, a, b), a, b, viewer)).toBe(true);
  });

  it('turns a rig back inside the painted set', () => {
    const rig = clampToBand({ position: [10, 1, 0], lookAt: [0, 1, -1], fov: 30 }, 30);
    const h = headingOf(floorDir({ x: rig.position[0], y: 0, z: rig.position[2] }, { x: 0, y: 0, z: -1 }));
    expect(Math.abs(h)).toBeLessThanOrEqual(30.01);
  });

  for (const id of ['seymour-flux', 'ffx2-bahamut'] as const) {
    for (const style of ['persona', 'clair'] as const) {
      it(`${id} ${style}: each hero shot frames its actor on the left, the boss readable, nobody in the way, on the viewer side`, () => {
        const view = chapterView(id);
        const boss = view.figures.find((x) => x.id === view.bossId)!;
        for (const actor of view.figures.filter((x) => x.side === 'party')) {
          const rig = solveShot({ kind: 'hero', subject: actor.id, target: boss.id, drift: false, slowOnHit: false }, view, STYLE_TUNING[style]);
          const cam = { x: rig.position[0], y: rig.position[1], z: rig.position[2] };
          const torso = ndcOf(rig, { x: actor.pos.x, y: actor.height * 0.55, z: actor.pos.z }, view.aspect);
          const bossChest = ndcOf(rig, { x: boss.pos.x, y: boss.pos.y + 2, z: boss.pos.z }, view.aspect);
          expect(torso.x, `${actor.id} torso x`).toBeLessThan(-0.1);
          expect(torso.x, `${actor.id} torso x`).toBeGreaterThan(-0.95);
          expect(bossChest.x, `${actor.id}: boss x`).toBeGreaterThan(-0.3);
          expect(bossChest.x, `${actor.id}: boss x`).toBeLessThan(1.0);
          expect(bossChest.depth).toBeGreaterThan(0);
          expect(onViewerSide(cam, partyCentre(view), boss.pos, view.viewer), `${actor.id} viewer side`).toBe(true);
          expect(blocked(cam, actor.pos, view.figures, new Set([actor.id])), `${actor.id} blocked`).toBe(false);
          expect(Math.abs(headingOf(floorDir(cam, { x: rig.lookAt[0], y: 0, z: rig.lookAt[2] })))).toBeLessThanOrEqual(view.band + 0.6);
          expect(viewFor(actor, cam, boss.pos), `${actor.id} painting`).toBe('rear');
          expect(coverOf(rig, boss, view.figures, new Set([actor.id]), view.aspect), `${actor.id}: boss covered`).toBeLessThan(0.25);
        }
        const behind = solveShot({ kind: 'enemy-behind-party', subject: boss.id, target: null, drift: false, slowOnHit: false }, view, STYLE_TUNING[style]);
        expect(coverOf(behind, boss, view.figures, new Set(), view.aspect), 'enemy turn: boss covered').toBeLessThan(0.25);
      });
    }

    it(`${id}: every other shot stays on the viewer side and inside the set`, () => {
      const view = chapterView(id);
      const boss = view.figures.find((x) => x.id === view.bossId)!;
      const lead = view.figures.find((x) => x.side === 'party')!;
      const kinds = ['hero-close', 'target', 'lunge-side', 'caster-low', 'impact-wide', 'item-close', 'enemy-front', 'enemy-behind-party', 'colossus', 'victory', 'party-shoulder'] as const;
      for (const k of kinds) {
        const enemyShot = k === 'target' || k === 'enemy-front' || k === 'enemy-behind-party' || k === 'colossus';
        const req: ShotRequest = { kind: k, subject: enemyShot ? boss.id : lead.id, target: enemyShot ? lead.id : boss.id, drift: false, slowOnHit: false };
        for (const style of ['persona', 'clair'] as const) {
          const rig = solveShot(req, view, STYLE_TUNING[style]);
          const cam = { x: rig.position[0], y: rig.position[1], z: rig.position[2] };
          expect(onViewerSide(cam, partyCentre(view), boss.pos, view.viewer), `${k} ${style} viewer side`).toBe(true);
          expect(Math.abs(headingOf(floorDir(cam, { x: rig.lookAt[0], y: 0, z: rig.lookAt[2] }))), `${k} ${style} band`).toBeLessThanOrEqual(view.band + 0.6);
        }
      }
    });
  }

  it('a figure without a rear painting keeps its front one, and its hero shot comes round to the side', () => {
    const view = chapterView('ffx2-bahamut');
    const yuna = { ...view.figures[0]!, hasRear: false };
    const figures = [yuna, ...view.figures.slice(1)];
    const boss = figures.find((x) => x.id === 'bahamut')!;
    const rig = solveShot({ kind: 'hero', subject: yuna.id, target: 'bahamut', drift: false, slowOnHit: false }, { ...view, figures }, STYLE_TUNING.persona);
    const cam = { x: rig.position[0], y: rig.position[1], z: rig.position[2] };
    expect(viewFor(yuna, cam, boss.pos)).toBe('front');
    const withRear = solveShot({ kind: 'hero', subject: yuna.id, target: 'bahamut', drift: false, slowOnHit: false }, view, STYLE_TUNING.persona);
    const look = floorDir({ x: withRear.position[0], y: 0, z: withRear.position[2] }, yuna.pos);
    const lookSide = floorDir(cam, yuna.pos);
    const face = floorDir(yuna.pos, boss.pos);
    expect(lookSide.x * face.x + lookSide.z * face.z).toBeLessThan(look.x * face.x + look.z * face.z); // further round from behind
  });

  it('a downed figure and an enemy always show the front painting', () => {
    const cam = { x: -2, y: 1, z: 6 };
    expect(viewFor({ ...f('tidus', -1.3, 1.5), standing: false }, cam, { x: 3.5, y: 0, z: -7.6 })).toBe('front');
    expect(viewFor(f('boss', 3.5, -7.6, 'enemy'), cam, { x: 0, y: 0, z: 0 })).toBe('front');
  });
});

// ------------------------------------------------------------------ the presenter's camera

describe('camera lab presenter camera', () => {
  function fake(): { port: CameraPort; calls: string[] } {
    const calls: string[] = [];
    let rig = 'idle';
    const port: CameraPort = {
      rigNames: ['idle', 'enemy'],
      get rigName() {
        return rig;
      },
      moveTo: async (r, ms) => void (calls.push(`move:${r}:${ms}`), (rig = r)),
      snapTo: (r) => void (calls.push(`snap:${r}`), (rig = r)),
      shake: (a) => void calls.push(`shake:${a}`),
      punch: async () => void calls.push('punch'),
      push: async () => void calls.push('push'),
      release: async (ms) => void calls.push(`release:${ms}`),
      roll: async () => void calls.push('roll'),
    };
    return { port, calls };
  }

  it('swallows the presenter framing between yields, and lands a yield first move as a cut', async () => {
    let yielding = false;
    const { port, calls } = fake();
    const cam = new LabCamera(port, { yielding: () => yielding });
    await cam.moveTo('enemy', 600);
    await cam.push(0.1, 400);
    await cam.roll(-4, 300);
    cam.shake(0.08, 200);
    cam.shake(0.2, 300);
    cam.hold(true);
    expect(cam.holding).toBe(true);
    expect(calls).toEqual(['shake:0.1']); // only a heavy shake, at half strength
    yielding = true;
    await cam.moveTo('enemy', 600);
    await cam.moveTo('idle', 600);
    expect(calls.slice(1)).toEqual(['release:0', 'snap:enemy', 'move:idle:600']);
  });
});
