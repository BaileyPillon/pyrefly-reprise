import { describe, expect, it } from 'vitest';
import { ATTACK_BEATS, ATTACK_IMPACT, attackOffset, reachOffset } from '../../src/engine/BattlePresenterActors.ts';
import { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { TweenGroup } from '../../src/engine/Tween.ts';

/**
 * r391-reach: a strike carried beyond the house lunge to reach its target moves the extra distance on an eased step (`reachOffset`); the house part keeps `attackOffset`
 * to the frame. Both games (shared plumbing): every number here is the move's own timing, none of it a game rule.
 */

describe('reachOffset: the attack beats with the step eased in and out', () => {
  it('shares every beat but the step with attackOffset: the same hold, strike and settle, the same end of the step, the same impact, to the digit', () => {
    const stepEnd = ATTACK_BEATS.step;
    for (let t = stepEnd; t <= 1.2; t += 0.003) expect(reachOffset(t)).toBeCloseTo(attackOffset(t), 12);
    expect(reachOffset(ATTACK_IMPACT)).toBeCloseTo(1, 12);
    expect(reachOffset(0)).toBe(0);
    expect(reachOffset(1)).toBe(0);
    expect(reachOffset(-0.3)).toBe(0);
  });

  it('never goes backwards on the way in, and never over the peak', () => {
    let prev = -1;
    for (let t = 0; t <= ATTACK_IMPACT; t += 0.002) {
      const v = reachOffset(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(v).toBeLessThanOrEqual(1 + 1e-12);
      prev = v;
    }
  });

  it('has no kick: its first frames of the step (a 60 fps frame is 3.8 percent of the 440 ms move) travel far less than the cubic-out step the house lunge makes', () => {
    const frame = 1000 / 60 / 440;
    expect(attackOffset(frame)).toBeGreaterThan(0.1);
    expect(reachOffset(frame)).toBeLessThan(0.06);
    expect(reachOffset(frame)).toBeLessThan(attackOffset(frame) / 5);
    // and the most it travels in one frame during the step is under the house lunge's first frame
    let worst = 0;
    for (let t = 0; t + frame <= ATTACK_BEATS.step; t += 0.001) worst = Math.max(worst, reachOffset(t + frame) - reachOffset(t));
    expect(worst).toBeLessThan(attackOffset(frame));
  });
});

describe('PaintedActor.lunge: the house part on attackOffset, the rest on reachOffset', () => {
  /** An actor with only what `lunge` touches: the tween group and the offset it writes. */
  function lungeActor(): { actor: PaintedActor; tweens: TweenGroup; offset: () => number } {
    const actor = Object.create(PaintedActor.prototype) as Record<string, unknown>;
    const tweens = new TweenGroup();
    actor['tweens'] = tweens;
    actor['lungeOffset'] = 0;
    return { actor: actor as unknown as PaintedActor, tweens, offset: () => actor['lungeOffset'] as number };
  }
  const at = (ms: number, total = 440): number => ms / total;

  it('is the old lunge to the digit when the whole distance is the house lunge (the default, and every call that passes no house part)', () => {
    for (const house of [undefined, 3]) {
      const { actor, tweens, offset } = lungeActor();
      void actor.lunge(3, 440, undefined, house);
      let elapsed = 0;
      for (const ms of [20, 60, 114, 200, 255]) {
        tweens.update((ms - elapsed) / 1000);
        elapsed = ms;
        expect(offset()).toBeCloseTo(3 * attackOffset(at(ms)), 6);
      }
    }
  });

  it('splits a carried strike: house 1.4 as today and the 1.6 beyond it on the eased step, and the sum lands on the full distance at the apex', () => {
    const { actor, tweens, offset } = lungeActor();
    void actor.lunge(3, 440, undefined, 1.4);
    let elapsed = 0;
    for (const ms of [17, 34, 60, 114, 200, 255]) {
      tweens.update((ms - elapsed) / 1000);
      elapsed = ms;
      expect(offset()).toBeCloseTo(1.4 * attackOffset(at(ms)) + 1.6 * reachOffset(at(ms)), 6);
    }
    expect(offset()).toBeCloseTo(3, 3); // the apex (0.58 of 440 ms is 255.2 ms)
    // the first frame moves the house lunge's first frame and almost none of the extra
    const first = lungeActor();
    void first.actor.lunge(3, 440, undefined, 1.4);
    first.tweens.update(1 / 60);
    const houseOnly = lungeActor();
    void houseOnly.actor.lunge(1.4, 440);
    houseOnly.tweens.update(1 / 60);
    expect(first.offset() - houseOnly.offset()).toBeLessThan(0.1);
    expect(first.offset()).toBeLessThan(0.6 * 3 * attackOffset(1 / 60 / 0.44)); // well under what the old step makes of 3 units (0.97)
  });

  it('a house part over the distance (a strike that needs no more) is the house lunge alone', () => {
    const { actor, tweens, offset } = lungeActor();
    void actor.lunge(1.4, 440, undefined, 2.5);
    tweens.update(0.1);
    expect(offset()).toBeCloseTo(1.4 * attackOffset(at(100)), 6);
  });
});
