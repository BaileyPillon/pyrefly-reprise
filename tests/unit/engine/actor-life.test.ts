import { describe, expect, it } from 'vitest';

import {
  ActorLife,
  ATTACK_BEATS,
  ATTACK_IMPACT,
  attackOffset,
  cuesFor,
  facingForSide,
  lifeStateForPose,
  mirrorFor,
  nextLifeState,
  parseArtFacing,
  POSTURES,
  resolvePoseName,
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
