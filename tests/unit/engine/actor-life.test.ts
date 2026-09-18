import { describe, expect, it } from 'vitest';

import {
  ActorLife,
  ATTACK_BEATS,
  ATTACK_IMPACT,
  attackOffset,
  clampYawToCamera,
  cuesFor,
  facingForSide,
  INTERIM_YAW_DEG,
  interimYawFor,
  lifeStateForPose,
  MAX_YAW_OFF_CAMERA_DEG,
  mirrorFor,
  nextLifeState,
  parseArtFacing,
  POSTURES,
  resolvePoseName,
  wrapDegrees,
  type ArtFacing,
  type LifeState,
} from '../../../src/engine/BattlePresenterActors.ts';

describe('facing', () => {
  it('turns party and aeons toward +x and enemies toward -x', () => {
    expect(facingForSide('party')).toBe(1);
    expect(facingForSide('aeon')).toBe(1);
    expect(facingForSide('enemy')).toBe(-1);
    expect(facingForSide(undefined)).toBe(1);
  });

  /**
   * The whole point of the change: under the new contract (party art painted
   * facing right, enemy art painted facing left) nothing is mirrored, because
   * every painting already faces the way its side fights.
   */
  it('never mirrors art that already faces the right way', () => {
    expect(mirrorFor('right', 1)).toBe(1);
    expect(mirrorFor('left', -1)).toBe(1);
  });

  it('mirrors only art that faces the wrong way for its side', () => {
    expect(mirrorFor('right', -1)).toBe(-1);
    expect(mirrorFor('left', 1)).toBe(-1);
  });

  it('leaves frontal and undeclared art alone, whichever way the body turns', () => {
    for (const want of [1, -1] as const) {
      expect(mirrorFor('front', want)).toBe(1);
      expect(mirrorFor('auto', want)).toBe(1);
      expect(mirrorFor(undefined, want)).toBe(1);
    }
  });

  it('reads the sidecar field, and ignores anything else', () => {
    expect(parseArtFacing('right')).toBe('right');
    expect(parseArtFacing('LEFT')).toBe('left');
    expect(parseArtFacing('front')).toBe('front');
    expect(parseArtFacing('sideways')).toBeUndefined();
    expect(parseArtFacing(1)).toBeUndefined();
    expect(parseArtFacing(undefined)).toBeUndefined();
  });

  /**
   * `docs/handoff/art3-contract.md` §1 writes `none` for art that is not
   * turned. Falling through to `auto` would happen to behave the same today,
   * but only by accident — say it properly, so a later change to what `auto`
   * assumes cannot start flipping every frontal painting in the roster.
   */
  it("reads the art pipeline's own spelling for untuned art", () => {
    for (const spelling of ['none', 'NONE', 'straight-on', ' straight ', 'centre']) {
      expect(parseArtFacing(spelling)).toBe('front');
    }
    expect(mirrorFor(parseArtFacing('none'), -1)).toBe(1);
  });

  it('is its own inverse: flipping the body flips the plane', () => {
    for (const art of ['right', 'left'] as ArtFacing[]) {
      expect(mirrorFor(art, 1) * mirrorFor(art, -1)).toBe(-1);
    }
  });
});

/**
 * The interim turn: until the roster is re-rendered three-quarter, the plane
 * itself is yawed toward the enemy so a straight-on painting is not meeting the
 * player's eye in the middle of a fight.
 */
describe('interimYawFor', () => {
  it('turns the party toward +x and the fiends toward -x', () => {
    expect(interimYawFor('front', 1)).toBeCloseTo(INTERIM_YAW_DEG, 6);
    expect(interimYawFor('front', -1)).toBeCloseTo(-INTERIM_YAW_DEG, 6);
  });

  /**
   * The rule that stops the interim fighting the fix. v3 art is *painted* at
   * ~45 degrees; yawing the plane on top of that carries it round into the flat
   * profile `art3-contract.md` §1 rejects, and loses the face with it.
   */
  it('leaves art that was painted turned exactly where it is', () => {
    for (const want of [1, -1] as const) {
      expect(interimYawFor('right', want)).toBe(0);
      expect(interimYawFor('left', want)).toBe(0);
    }
  });

  /**
   * The divergence from {@link mirrorFor}, and the reason the round has any
   * effect at all: everything in `public/art/characters/` that has not been
   * re-rendered is straight-on and says nothing about it, so an undeclared
   * painting has to be treated as "not turned yet" here, even though the mirror
   * treats the same silence as "already correct, do not flip".
   */
  it('turns frontal art and art that declares nothing', () => {
    for (const art of ['front', 'auto', undefined] as (ArtFacing | undefined)[]) {
      expect(interimYawFor(art, 1)).toBeCloseTo(INTERIM_YAW_DEG, 6);
      expect(interimYawFor(art, -1)).toBeCloseTo(-INTERIM_YAW_DEG, 6);
    }
    expect(interimYawFor(parseArtFacing('none'), 1)).toBeCloseTo(INTERIM_YAW_DEG, 6);
    expect(interimYawFor(parseArtFacing('right'), 1)).toBe(0);
  });

  it('takes whatever angle it is handed, and 0 turns it off', () => {
    expect(interimYawFor('front', 1, 30)).toBeCloseTo(30, 6);
    expect(interimYawFor('front', -1, 30)).toBeCloseTo(-30, 6);
    expect(interimYawFor('front', 1, 0)).toBe(0);
    expect(interimYawFor('front', 1, Number.NaN)).toBe(0);
  });

  it('is symmetric: the two sides turn the same amount, opposite ways', () => {
    expect(interimYawFor('front', 1) + interimYawFor('front', -1)).toBeCloseTo(0, 6);
  });
});

describe('clampYawToCamera', () => {
  /** Camera azimuth from a figure, in the same frame as a yaw: `atan2(dx, dz)`. */
  const azimuth = (figure: [number, number], camera: [number, number]): number =>
    (Math.atan2(camera[0] - figure[0], camera[1] - figure[1]) * 180) / Math.PI;

  /**
   * The numbers this has to survive: Mt. Gagazet (chapter 1), from
   * `src/scenes/gagazet.ts`. Every battle rig sits near the field's centre
   * line, so a 26-degree turn lands well inside the band and **nothing is
   * clamped** — which is the point. If this test starts failing, a rig has
   * swung far enough round the side that the interim turn is being given up,
   * and the capture will show it.
   */
  const GAGAZET = {
    rigs: {
      idle: [0, 9.5],
      action: [0.25, 8.85],
      party: [-1.6, 6.5],
      enemy: [1.5, 5.9],
      victory: [-1.9, 6.9],
    } as Record<string, [number, number]>,
    party: [
      [-1.55, 1.55],
      [-2.95, 0.25],
      [-1.05, -1.05],
    ] as [number, number][],
    boss: [1.95, -2.45] as [number, number],
  };

  it('leaves the turn alone at every chapter-1 rig', () => {
    for (const [name, cam] of Object.entries(GAGAZET.rigs)) {
      for (const slot of GAGAZET.party) {
        const yaw = interimYawFor('front', 1);
        expect(clampYawToCamera(yaw, azimuth(slot, cam)), `party at ${name}`).toBeCloseTo(yaw, 6);
      }
      const enemyYaw = interimYawFor('front', -1);
      expect(clampYawToCamera(enemyYaw, azimuth(GAGAZET.boss, cam)), `boss at ${name}`).toBeCloseTo(
        enemyYaw,
        6,
      );
    }
  });

  it('keeps the plane within the allowed band when it can', () => {
    for (let cam = -180; cam <= 180; cam += 3) {
      for (const yaw of [26, -26, 40, -40]) {
        const out = clampYawToCamera(yaw, cam);
        const reachable = Math.abs(wrapDegrees(cam)) <= Math.abs(yaw) + MAX_YAW_OFF_CAMERA_DEG;
        if (reachable && Math.sign(wrapDegrees(cam)) === Math.sign(yaw)) {
          expect(Math.abs(out - wrapDegrees(cam))).toBeLessThanOrEqual(MAX_YAW_OFF_CAMERA_DEG + 1e-9);
        }
      }
    }
  });

  /**
   * Both halves of the bound. A fiend that turned *toward* +x to keep its plane
   * square to a camera that had swung round behind the party would be facing
   * away from the people hitting it: a worse lie than a flat cut-out. And a
   * camera swinging the other way must not turn a 26-degree interim into a
   * 60-degree one — that is the profile the art contract rejects.
   */
  it('never turns the figure the wrong way, or further than it was asked to', () => {
    for (let cam = -180; cam <= 180; cam += 1) {
      for (const yaw of [26, -26]) {
        const out = clampYawToCamera(yaw, cam);
        expect(Math.abs(out)).toBeLessThanOrEqual(Math.abs(yaw) + 1e-9);
        expect(out * yaw).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it('gives the turn up entirely when the camera is round the far side', () => {
    // Camera 80 degrees off to the figure's left, party member turning right:
    // any turn at all takes the plane further toward edge-on.
    expect(clampYawToCamera(26, -80)).toBe(0);
    expect(clampYawToCamera(-26, 80)).toBe(0);
  });

  it('keeps as much of the turn as the camera allows', () => {
    // Band is [-15, +5]; the largest turn of a -26 yaw that stays inside it.
    expect(clampYawToCamera(-26, -5, 10)).toBeCloseTo(-15, 6);
    expect(clampYawToCamera(26, 5, 10)).toBeCloseTo(15, 6);
  });

  it('holds the full turn when the camera is already past it', () => {
    expect(clampYawToCamera(26, 90)).toBeCloseTo(26, 6);
    expect(clampYawToCamera(-26, -90)).toBeCloseTo(-26, 6);
  });

  it('passes a flat plane and a broken azimuth through unchanged', () => {
    expect(clampYawToCamera(0, 40)).toBe(0);
    expect(clampYawToCamera(26, Number.NaN)).toBe(26);
    expect(clampYawToCamera(Number.NaN, 0)).toBe(0);
  });
});

describe('wrapDegrees', () => {
  it('measures a camera behind the figure the short way round', () => {
    expect(wrapDegrees(190)).toBeCloseTo(-170, 6);
    expect(wrapDegrees(-190)).toBeCloseTo(170, 6);
    expect(wrapDegrees(540)).toBeCloseTo(180, 6);
    expect(wrapDegrees(26)).toBeCloseTo(26, 6);
    expect(wrapDegrees(0)).toBe(0);
  });
});

describe('lifeStateForPose', () => {
  it('folds the action poses into one state', () => {
    for (const pose of ['attack', 'cast', 'item']) {
      expect(lifeStateForPose(pose)).toBe('act');
    }
  });

  it('maps the rest of the pose vocabulary', () => {
    expect(lifeStateForPose('idle')).toBe('idle');
    expect(lifeStateForPose('ready')).toBe('ready');
    expect(lifeStateForPose('defend')).toBe('guard');
    expect(lifeStateForPose('hurt')).toBe('hurt');
    expect(lifeStateForPose('ko')).toBe('down');
    expect(lifeStateForPose('victory')).toBe('victory');
  });

  it('treats a pose it has never heard of as standing there', () => {
    expect(lifeStateForPose('turn-away')).toBe('idle');
  });
});

describe('resolvePoseName', () => {
  const has = (...loaded: string[]) => (pose: string): boolean => loaded.includes(pose);

  it('uses the real painting when there is one', () => {
    expect(resolvePoseName('victory', has('idle', 'victory'))).toBe('victory');
  });

  it('falls back down the chain rather than dropping the call', () => {
    expect(resolvePoseName('victory', has('idle'))).toBe('idle');
    expect(resolvePoseName('cast', has('idle', 'attack'))).toBe('attack');
    expect(resolvePoseName('ko', has('idle', 'hurt'))).toBe('hurt');
  });

  it('returns null when the subject has nothing at all', () => {
    expect(resolvePoseName('idle', has())).toBeNull();
  });
});

describe('cuesFor', () => {
  it('fires nothing when the state has not changed', () => {
    expect(cuesFor('idle', 'idle')).toEqual([]);
  });

  it('falls on the way down and rises on the way back', () => {
    expect(cuesFor('idle', 'down')).toContain('fall');
    expect(cuesFor('act', 'down')).toContain('fall');
    expect(cuesFor('down', 'idle')).toContain('rise');
    expect(cuesFor('down', 'idle')).not.toContain('fall');
  });

  it('steps in when the turn comes round and hops on a win', () => {
    expect(cuesFor('idle', 'ready')).toEqual(['step']);
    expect(cuesFor('idle', 'victory')).toEqual(['hop']);
  });

  it('flinches on a hit, but never on a body that is already down', () => {
    expect(cuesFor('ready', 'hurt')).toEqual(['flinch']);
    expect(cuesFor('down', 'hurt')).not.toContain('flinch');
  });
});

describe('nextLifeState', () => {
  const states: LifeState[] = ['idle', 'ready', 'act', 'guard', 'hurt', 'down', 'victory'];

  it('passes every state through untouched from anywhere but the floor', () => {
    for (const from of states) {
      for (const to of states) {
        if (from === 'down' && to === 'hurt') continue;
        expect(nextLifeState(from, to)).toBe(to);
      }
    }
  });

  it('will not let a body on the ground flinch', () => {
    expect(nextLifeState('down', 'hurt')).toBe('down');
  });

  it('still lets a body on the ground be revived', () => {
    for (const to of ['idle', 'ready', 'act', 'guard', 'victory'] as LifeState[]) {
      expect(nextLifeState('down', to)).toBe(to);
    }
  });
});

describe('ActorLife', () => {
  const settle = (life: ActorLife, seconds = 2): void => {
    for (let i = 0; i < seconds * 60; i++) life.update(1 / 60);
  };

  it('starts idle, square on its feet', () => {
    const life = new ActorLife();
    expect(life.state).toBe('idle');
    expect(life.posture.lean).toBe(0);
    expect(life.posture.ring).toBe(0);
  });

  it('reports a transition once, and nothing on a repeat', () => {
    const life = new ActorLife();
    expect(life.set('ready')?.cues).toEqual(['step']);
    expect(life.set('ready')).toBeNull();
  });

  it('leans forward and lights the ring when it is their turn', () => {
    const life = new ActorLife();
    life.set('ready');
    settle(life);
    expect(life.posture.lean).toBeCloseTo(POSTURES.ready.lean, 3);
    expect(life.posture.ring).toBeGreaterThan(0.9);
  });

  it('puts the ring out when the turn passes', () => {
    const life = new ActorLife();
    life.set('ready');
    settle(life);
    life.set('idle');
    settle(life);
    expect(life.posture.ring).toBeLessThan(0.05);
  });

  it('leaves the ring alone while the fighter is being hit', () => {
    const life = new ActorLife();
    life.set('act');
    settle(life);
    const lit = life.posture.ring;
    life.set('hurt');
    settle(life, 0.5);
    expect(life.posture.ring).toBeCloseTo(lit, 2);
  });

  it('braces the other way to guard: back, low and holding still', () => {
    const life = new ActorLife();
    life.set('guard');
    settle(life);
    expect(life.posture.lean).toBeLessThan(0);
    expect(life.posture.crouch).toBeGreaterThan(0);
    expect(life.posture.breathe).toBeLessThan(1);
  });

  it('all but stops breathing once it is down', () => {
    const life = new ActorLife();
    life.set('down');
    settle(life);
    expect(life.posture.breathe).toBeLessThan(0.2);
    expect(life.posture.tilt).toBeGreaterThan(0.1);
  });

  it('eases rather than snapping, unless asked to snap', () => {
    const eased = new ActorLife();
    eased.set('down');
    eased.update(1 / 60);
    expect(eased.posture.tilt).toBeGreaterThan(0);
    expect(eased.posture.tilt).toBeLessThan(POSTURES.down.tilt * 0.5);

    const snapped = new ActorLife();
    snapped.set('down', { immediate: true });
    expect(snapped.posture.tilt).toBeCloseTo(POSTURES.down.tilt, 6);
  });

  it('settles to the same posture whatever the framerate', () => {
    const fast = new ActorLife();
    const slow = new ActorLife();
    fast.set('ready');
    slow.set('ready');
    for (let i = 0; i < 120; i++) fast.update(1 / 120);
    for (let i = 0; i < 20; i++) slow.update(1 / 20);
    expect(fast.posture.lean).toBeCloseTo(slow.posture.lean, 2);
  });

  /**
   * A stray area attack landing on a party member who is already KO'd. The
   * pose call still arrives; what must not happen is the body sitting up to
   * wince — and, worse, `cuesFor` reading that as leaving `down` and playing
   * the revive rise on a character who is still dead.
   */
  it('refuses to be hurt once it is down, and plays no rise for trying', () => {
    const life = new ActorLife();
    life.set('down');
    settle(life);
    expect(life.set('hurt')).toBeNull();
    expect(life.state).toBe('down');
    settle(life, 0.5);
    expect(life.posture.tilt).toBeCloseTo(POSTURES.down.tilt, 3);
  });

  it('gets back up when it is actually revived', () => {
    const life = new ActorLife();
    life.set('down', { immediate: true });
    const change = life.set('idle');
    expect(change?.cues).toContain('rise');
    settle(life);
    expect(life.posture.tilt).toBeLessThan(POSTURES.down.tilt * 0.05);
  });

  it('reaches every state it is asked for', () => {
    const states: LifeState[] = ['idle', 'ready', 'act', 'guard', 'hurt', 'down', 'victory'];
    const life = new ActorLife();
    for (const s of states) {
      life.set(s);
      expect(life.state).toBe(s);
      settle(life, 0.2);
      expect(Number.isFinite(life.posture.lean)).toBe(true);
    }
  });
});

describe('attackOffset', () => {
  it('starts and finishes at home', () => {
    expect(attackOffset(0)).toBe(0);
    expect(attackOffset(-0.2)).toBe(0);
    expect(attackOffset(1)).toBe(0);
    expect(attackOffset(1.4)).toBe(0);
  });

  it('peaks exactly once, on the strike', () => {
    expect(attackOffset(ATTACK_IMPACT)).toBeCloseTo(1, 6);
    for (let t = 0; t <= 1; t += 0.01) {
      expect(attackOffset(t)).toBeLessThanOrEqual(1.000001);
    }
  });

  it('never goes backwards on the way in', () => {
    let previous = -1;
    for (let t = 0; t <= ATTACK_IMPACT; t += 0.005) {
      const v = attackOffset(t);
      expect(v).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = v;
    }
  });

  /**
   * The point of the shape: it is step, *pause*, strike — not a drift. The hold
   * has to be visibly stiller than the step that precedes it and the strike
   * that follows, or the move reads as sliding into the enemy.
   */
  it('holds still between the step and the strike', () => {
    const { step, hold, strike } = ATTACK_BEATS;
    const speed = (a: number, b: number): number => Math.abs(attackOffset(b) - attackOffset(a)) / (b - a);
    const stepSpeed = speed(0, step * 0.5);
    const holdSpeed = speed(step + hold * 0.1, step + hold * 0.9);
    const strikeSpeed = speed(step + hold, step + hold + strike);
    expect(holdSpeed).toBeLessThan(stepSpeed * 0.25);
    expect(holdSpeed).toBeLessThan(strikeSpeed * 0.25);
  });

  it('gets most of the way there on the first quick step', () => {
    expect(attackOffset(ATTACK_BEATS.step)).toBeGreaterThan(0.8);
  });

  it('comes home smoothly, with no snap on the last frame', () => {
    expect(attackOffset(0.98)).toBeLessThan(0.02);
  });
});
