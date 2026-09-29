// @vitest-environment jsdom
/**
 * The FF7 purist review's repairs (2026-09-27), FF7 only plus the shared
 * plumbing they touch: the raised camera and the party's diagonal, no turn
 * rings, the melee run and the boss's stand-in moves through the presenter's
 * `actionMotion` port, the three warnings held as one block, the Limit gauge
 * rising with its blow, numerals kept off the band, the edge labels covering
 * whole fields, phone B's names once and the FF7 results rows' missing tags.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';

import { Ff7ActionMotion, FF7_ENEMY_MOVES } from '../../src/app/screens/BattleScreenFf7Motion.ts';
import { presenterGameDeps } from '../../src/app/screens/BattleScreenGameDeps.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import type { BattleEvent, CombatantId } from '../../src/battle/common/types.ts';
import type { Ff7Engine } from '../../src/battle/ff7/index.ts';
import { FF7_GUARD_SCORPION } from '../../src/data/chapter-ff7-guard-scorpion.ts';
import { sector1ReactorBuild } from '../../src/data/ff7/index.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { bracketAnimations, dialogueHud } from '../../src/engine/BattlePresenterAnimating.ts';
import type { ActionMotionPort, ActionStartEvent, MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import type { Point3 } from '../../src/engine/BattlePresenterPorts.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import * as S from '../../src/scenes/sector1-reactor-staging.ts';
import { Ff7BattleHud } from '../../src/ui/ff7/Ff7BattleHud.ts';
import { Ff7HelpLine } from '../../src/ui/ff7/Ff7HelpLine.ts';
import { ff7Geometry } from '../../src/ui/ff7/ff7Geometry.ts';
import { namesWindowHtml } from '../../src/ui/ff7/Ff7PartyRows.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

// ------------------------------------------------------------------ camera

/** The fixed rig as a three.js camera at `w` x `h`. */
function camera(w: number, h: number): PerspectiveCamera {
  const rig = S.sector1RigsFor(w / h).idle;
  const cam = new PerspectiveCamera(rig.fov, w / h, 0.1, 200);
  cam.position.set(...(rig.position as [number, number, number]));
  cam.lookAt(new Vector3(...(rig.lookAt as [number, number, number])));
  cam.updateMatrixWorld();
  return cam;
}

const screenY = (cam: PerspectiveCamera, p: [number, number, number], h: number): number => ((1 - new Vector3(...p).project(cam).y) / 2) * h;
const screenX = (cam: PerspectiveCamera, p: [number, number, number], w: number): number => ((new Vector3(...p).project(cam).x + 1) / 2) * w;

describe('the raised fixed camera, sides switched (review items 1 and 3; D-262)', () => {
  const W = 1600;
  const H = 900;
  const cam = camera(W, H);
  const band = ff7Geometry(W, H).bandL.y;
  const figures: Array<[string, [number, number, number], number]> = [
    ['cloud front', S.rowSpot(0, 'front'), S.SECTOR1_HEIGHTS.cloud],
    ['barret front', S.rowSpot(1, 'front'), S.SECTOR1_HEIGHTS.barret],
    ['cloud back', S.rowSpot(0, 'back'), S.SECTOR1_HEIGHTS.cloud],
    ['barret back', S.rowSpot(1, 'back'), S.SECTOR1_HEIGHTS.barret],
    ['guard scorpion', [...S.SECTOR1_BOSS_SPOT], S.SECTOR1_HEIGHTS['guard-scorpion']],
  ];

  it('looks down on the floor: every fighter stands whole above the band at 16:9, head under the message window', () => {
    expect(band / H).toBeCloseTo(0.71, 2);
    const msgBottom = ff7Geometry(W, H).msg.y + ff7Geometry(W, H).msg.h;
    for (const [name, p, height] of figures) {
      const feet = screenY(cam, p, H);
      const head = screenY(cam, [p[0], height, p[2]], H);
      expect(feet, name).toBeLessThan(band - 15); // the contact shadow clears the band too
      expect(head, name).toBeGreaterThan(msgBottom);
    }
    const pitch = MathUtils.radToDeg(Math.atan2(S.SECTOR1_CAMERA.position[1] - S.SECTOR1_CAMERA.lookAt[1], S.SECTOR1_CAMERA.position[2]));
    expect(pitch).toBeCloseTo(S.SECTOR1_PITCH_DEG, 6);
  });

  it('stands Barret upstage-left of Cloud, both on the left of the frame, so they read as a diagonal', () => {
    const [cloud, barret] = [S.rowSpot(0, 'front'), S.rowSpot(1, 'front')];
    expect(barret[2]).toBeLessThan(cloud[2] - 1); // Barret upstage
    const dy = screenY(cam, cloud, H) - screenY(cam, barret, H);
    const dx = screenX(cam, cloud, W) - screenX(cam, barret, W);
    expect(dy).toBeGreaterThan(30);
    expect(dx).toBeGreaterThan(120);
    expect(screenX(cam, cloud, W)).toBeLessThan(W / 2);
    expect(screenX(cam, [...S.SECTOR1_BOSS_SPOT], W)).toBeGreaterThan(W / 2);
  });

  it('squares the painting to the view, covers the frame and sets its bottom edge on the frame bottom', () => {
    const p = S.sector1Backdrop(W / H);
    const plateH = (p.width * S.SECTOR1_PLATE.h) / S.SECTOR1_PLATE.w;
    const up = new Vector3(0, Math.cos(p.pitch), -Math.sin(p.pitch));
    const centre = new Vector3(0, p.centreY, p.distance);
    const bottom = centre.clone().addScaledVector(up, -plateH / 2);
    const top = centre.clone().addScaledVector(up, plateH / 2);
    expect(screenY(cam, [bottom.x, bottom.y, bottom.z], H) / H).toBeCloseTo(1, 3);
    expect(screenY(cam, [top.x, top.y, top.z], H)).toBeLessThan(0);
    const left = centre.clone().add(new Vector3(-p.width / 2, 0, 0));
    expect(screenX(cam, [left.x, left.y, left.z], W)).toBeLessThan(0);
  });

  it('switches the turn rings off for FF7 only', () => {
    expect(S.SECTOR1_STAGING.turnRings).toBe(false);
    expect(stagingOf(S.SECTOR1_STAGING).turnRings).toBe(false);
    expect(stagingOf({ holdParty: true })).not.toHaveProperty('turnRings');
  });
});

// ------------------------------------------------------------------ motion

class MovingActor extends FakeActor {
  moves: Point3[] = [];
  lunges: number[] = [];
  override async moveTo(p?: Point3): Promise<void> {
    if (p) {
      this.moves.push({ ...p });
      Object.assign(this.position, p);
    }
  }
  override async lunge(distance?: number): Promise<void> {
    this.lunges.push(distance ?? 0);
    await super.lunge();
  }
}

class MotionStage extends FakeStage {
  constructor() {
    super([], []);
    const put = (id: string, side: 'party' | 'enemy', p: [number, number, number]): void => {
      const a = new MovingActor(id, this.calls);
      Object.assign(a.position, { x: p[0], y: p[1], z: p[2] });
      this.actors.set(id, a);
      this.sides.set(id, side);
    };
    put('cloud', 'party', S.rowSpot(0, 'front'));
    put('barret', 'party', S.rowSpot(1, 'front'));
    put('guard-scorpion', 'enemy', [...S.SECTOR1_BOSS_SPOT]);
  }
  mover(id: string): MovingActor {
    return this.actors.get(id) as MovingActor;
  }
}

const start = (actorId: CombatantId, abilityId: string, targets: CombatantId[], kind = 'ability'): ActionStartEvent =>
  ({ seq: 0, type: 'action-start', actorId, command: { kind, id: abilityId, targets }, abilityId, abilityName: abilityId, targets }) as never;

describe("FF7's action motion (review items 4 and 5)", () => {
  const ctx = (stage: MotionStage, speed: MotionCtx['speed'] = 'normal'): MotionCtx => ({ stage, speed, sleep: noSleep });

  it('runs Cloud (Buster Sword) to a strike point in front of Guard Scorpion and back home; Barret (Long Range) fires from his spot', async () => {
    const motion = Ff7ActionMotion.forBuild(sector1ReactorBuild);
    const stage = new MotionStage();
    const home = { ...stage.mover('cloud').position };
    await motion.open(start('cloud', 'attack', ['guard-scorpion'], 'attack'), ctx(stage));
    const strike = stage.mover('cloud').moves[0]!;
    expect(strike.x).toBeCloseTo(S.strikeSpot()[0], 6); // just in front of the rifles' tips
    expect(strike.x).toBeLessThan(S.SECTOR1_BOSS_SPOT[0] - S.SECTOR1_BOSS_FRONT);
    expect(strike.x).toBeGreaterThan(home.x + 1.5); // a run to the right, toward the boss, not a step
    expect(motion.away('cloud')).toBe(true);
    await motion.close('cloud', ctx(stage));
    expect(stage.mover('cloud').moves[1]).toEqual(home);
    expect(motion.away('cloud')).toBe(false);

    await motion.open(start('barret', 'attack', ['guard-scorpion'], 'attack'), ctx(stage));
    await motion.open(start('cloud', 'bolt', ['guard-scorpion']), ctx(stage)); // magic: no run
    await motion.close('barret', ctx(stage));
    expect(stage.mover('barret').moves).toEqual([]);
    expect(stage.mover('cloud').moves).toHaveLength(2);
  });

  it('Braver runs too (physical, Buster Sword); a heal on a party member does not', async () => {
    const motion = Ff7ActionMotion.forBuild(sector1ReactorBuild);
    const stage = new MotionStage();
    await motion.open(start('cloud', 'braver', ['guard-scorpion'], 'limit'), ctx(stage));
    expect(stage.mover('cloud').moves).toHaveLength(2); // the run, then the leap on toward the boss (phase-3 repair item 13)
    await motion.close('cloud', ctx(stage));
    await motion.open(start('cloud', 'cure', ['barret']), ctx(stage));
    expect(stage.mover('cloud').moves).toHaveLength(3); // the run home; the heal adds none
  });

  it('gives the boss a stand-in lunge or recoil for Rifle, Scorpion Tail and Tail Laser, nothing for Search Scope', async () => {
    const motion = Ff7ActionMotion.forBuild(sector1ReactorBuild);
    const stage = new MotionStage();
    for (const id of ['rifle', 'scorpion-tail', 'tail-laser', 'search-scope', 'raise-tail']) await motion.open(start('guard-scorpion', id, ['cloud']), ctx(stage));
    expect(stage.mover('guard-scorpion').lunges).toEqual([FF7_ENEMY_MOVES['rifle']!.distance, FF7_ENEMY_MOVES['scorpion-tail']!.distance, FF7_ENEMY_MOVES['tail-laser']!.distance]);
    expect(stage.mover('guard-scorpion').moves).toEqual([]);
  });

  it('is built for FF7 only: FFX and FFX-2 deps carry no motion port', () => {
    expect(presenterGameDeps('ff7', sector1ReactorBuild).actionMotion).toBeInstanceOf(Ff7ActionMotion);
    expect(presenterGameDeps('ffx', { game: 'ffx', members: [] })).not.toHaveProperty('actionMotion');
    expect(presenterGameDeps('ffx2', { game: 'ffx2', members: [] })).not.toHaveProperty('actionMotion');
  });

  it('the presenter opens the motion before the wind-up and closes it before the idle pose', async () => {
    const stage = new MotionStage();
    const port: ActionMotionPort = {
      open: (e) => void stage.calls.push(`motion:open:${e.actorId}`),
      close: (id) => void stage.calls.push(`motion:close:${id}`),
    };
    const presenter = new BattlePresenter({ stage, sleep: noSleep, actionMotion: port });
    await presenter.play([
      start('cloud', 'attack', ['guard-scorpion'], 'attack'),
      { seq: 1, type: 'damage', targetId: 'guard-scorpion', sourceId: 'cloud', amount: 40, crit: false, hitIndex: 0, hitCount: 1 } as never,
      { seq: 2, type: 'action-end', actorId: 'cloud' } as never,
    ]);
    const c = stage.calls;
    expect(c.indexOf('motion:open:cloud')).toBeGreaterThan(-1);
    expect(c.indexOf('motion:open:cloud')).toBeLessThan(c.indexOf('lunge:cloud'));
    expect(c.indexOf('motion:close:cloud')).toBeGreaterThan(c.indexOf('lunge:cloud'));
    expect(c.indexOf('motion:close:cloud')).toBeLessThan(c.lastIndexOf('pose=idle:cloud'));
  });
});

// ------------------------------------------------------------------ dialogue, gauges, marks

describe('the three warnings are one block (review item 6)', () => {
  it('an action name never cuts a line of dialogue; dialogueShown resolves after the last line has had its time', async () => {
    const layer = document.createElement('div');
    const line = new Ff7HelpLine(layer, () => ff7Geometry(1600, 900));
    let done = false;
    line.say('“Barret, be careful!', false, true);
    line.say("“Attack while it's tail's up!", false, true);
    line.say('“It’s gonna counterattack with its laser.', false, true);
    void line.dialogueShown().then(() => (done = true));
    line.say('Bolt', true); // an action name arriving mid-dialogue waits its turn
    expect(line.shown).toBe('“Barret, be careful!');
    for (let i = 0; i < 2; i++) line.update(3);
    await Promise.resolve();
    expect(done).toBe(false);
    expect(line.shown).toBe('“It’s gonna counterattack with its laser.'); // no name between line 2 and line 3
    line.update(3); // the third line has shown its time
    await Promise.resolve();
    expect(done).toBe(true);
    expect(line.shown).toBe('Bolt');
  });

  it('the bracket holds the burst that said dialogue, still animating, until the HUD has shown it', async () => {
    const engine = (await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, 1))) as Ff7Engine;
    let release: () => void = () => {};
    const hud = { dialogueShown: () => new Promise<void>((r) => (release = r)) };
    expect(dialogueHud(hud)).toBe(hud);
    const presenter = { play: async (_events: BattleEvent[]) => ({ dropped: 0 }) };
    bracketAnimations(presenter, engine, hud);
    let finished = false;
    const p = presenter.play([{ seq: 0, type: 'message', text: 'x', kind: 'story' } as never] as BattleEvent[]).then(() => (finished = true));
    await Promise.resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    expect(engine.animating()).toBe(true);
    release();
    await p;
    expect(engine.animating()).toBe(false);
    // A burst with no dialogue does not wait on the HUD.
    await presenter.play([{ seq: 1, type: 'message', text: 'Locked On Target', kind: 'system' } as never]);
  });
});

describe('HUD repairs', () => {
  it("keeps a member's Limit gauge where the last sync left it until that member's own limit-gauge event (item 13)", async () => {
    const engine = (await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, 1))) as Ff7Engine;
    const hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }) });
    hud.mount(document.body);
    hud.sync(engine.state(), engine.gaugeSnapshot());
    const before = hud.inspect().rows.find((r) => r.id === 'barret')!.limit;
    const later = structuredClone(engine.state()) as never as { combatants: Record<string, { ff7: { limit: { gauge: number } } }> };
    later.combatants['barret']!.ff7.limit.gauge = 255; // the burst's end state: full
    hud.syncVitals(later as never);
    expect(hud.inspect().rows.find((r) => r.id === 'barret')!.limit).toBe(before);
    hud.onEvent({ seq: 1, type: 'limit-gauge', actorId: 'barret', value: 255, level: 1, ready: true } as never);
    expect(hud.inspect().rows.find((r) => r.id === 'barret')!.limitReady).toBe(true);
    hud.unmount();
  });

  it('keeps a numeral one numeral height above the band even when the figure projects onto it (item 2)', () => {
    const hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }) });
    hud.mount(document.body);
    hud.setProjector(() => ({ x: 1300, y: 700 })); // a chest that projects onto the band
    hud.onEvent({ seq: 1, type: 'damage', targetId: 'cloud', amount: 76, crit: false, hitIndex: 0, hitCount: 1 } as never);
    hud.numeralLanded('cloud');
    hud.update(0.5);
    const el = document.querySelector<HTMLElement>('.ff7-dmg')!;
    const g = ff7Geometry(1600, 900);
    expect(parseFloat(el.style.top) + g.dmgCap).toBeLessThanOrEqual(g.bandL.y - g.dmgCap + 1);
    hud.unmount();
  });

  it('draws Change and Defend over whole fields on a desktop (item 12)', () => {
    const hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }) });
    hud.mount(document.body);
    const cmd = (kind: string) => ({ command: { kind, targets: [] }, label: kind, category: kind, mpCost: 0, enabled: true, validTargets: [] }) as never;
    void hud.chooseCommand('cloud', [cmd('attack'), cmd('defend'), cmd('row-change')]);
    const g = ff7Geometry(1600, 900);
    const rect = (name: string) => document.querySelector<HTMLElement>(`[data-win="${name}"]`);
    hud.commandMenu.press('right');
    const defend = rect('edge-defend');
    expect(defend).not.toBeNull();
    expect(parseFloat(defend!.style.left) + parseFloat(defend!.style.width)).toBeGreaterThanOrEqual(g.right.maxEnd);
    hud.commandMenu.press('left');
    hud.commandMenu.press('left');
    const change = rect('edge-change');
    expect(parseFloat(change!.style.left)).toBeLessThanOrEqual(g.bandL.x + 1);
    hud.unmount();
  });

  it('shows each name once on phone B, in its status row (item 16)', () => {
    const rows = [{ id: 'cloud', name: 'Cloud', hp: 1, maxHp: 1, mp: 1, maxMp: 1, hpLow: false, limit: 0, limitReady: false, limitMode: 'normal', time: 0, timeFull: false, barrier: 0, mbarrier: 0 }] as never;
    expect(namesWindowHtml(ff7Geometry(390, 844, 'b'), rows)).not.toContain('Cloud');
    expect(namesWindowHtml(ff7Geometry(390, 844, 'a'), rows)).toContain('Cloud');
    expect(namesWindowHtml(ff7Geometry(1600, 900), rows)).toContain('Cloud');
  });
});
