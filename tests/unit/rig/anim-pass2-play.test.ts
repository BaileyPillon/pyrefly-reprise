/**
 * Pass 2's animator on its own (`RigAnimator.ts`; plumbing for both games): a cast or an item kept in its looping hold stays there and glows more until it is let go, one not kept open releases by itself
 * at the clip's own time, an item for the user plays the glow clip and one for an ally the orb clip, the strike lands on the lunge's apex, `lead('end')` is pass 2's only, and the hit-stop is 30 ms
 * for a weak blow and 80 for a strong one.
 */
import { describe, expect, it } from 'vitest';
import { markTime } from '../../../src/engine/rig/anim/AnimClip.ts';
import { buildLibrary2, LULU_RE, STRIKE_RUN_MS } from '../../../src/engine/rig/anim/AnimLibrary2.ts';
import { frameMs } from '../../../src/engine/rig/anim/AnimRE.ts';
import { STYLE_B, STYLE_P2 } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import { animator, frame, near, run } from './anim-pass2-fixture.ts';

describe('the animator with pass 2\'s clips', () => {
  it('a cast kept open stays in its hold for seconds, glowing more, and let go it releases once and goes on to its end', () => {
    const a = animator();
    a.an.request('cast', 'idle', a.work, a.vel);
    a.an.begin('cast', a.work, a.vel);
    a.an.keepHolding(true);
    const c = a.an.compiled('cast')!;
    const holdAt = markTime(c, 'hold');
    const ev1 = run(a, holdAt + 3000);
    expect(ev1).toContain('hold');
    expect(ev1).not.toContain('release'); // kept open: the spell has not left
    expect(a.an.holding).toBeGreaterThan(2500);
    const g1 = a.an.charge;
    expect(g1).toBeGreaterThan(0.8); // the glow built through the hold
    a.an.release();
    const ev2 = run(a, 2500);
    expect(ev2.filter((e) => e === 'release')).toHaveLength(1);
    expect(ev2).toContain('end');
    expect(ev2.indexOf('release')).toBeLessThan(ev2.indexOf('end'));
    expect(a.an.charge).toBeLessThan(0.1); // the glow flashed out
  });
  it('a cast not kept open releases by itself after the shortest stay, at the clip\'s own release time', () => {
    const a = animator();
    a.an.request('cast', 'idle', a.work, a.vel);
    a.an.begin('cast', a.work, a.vel);
    const c = a.an.compiled('cast')!;
    const lead0 = a.an.lead('cast');
    near(lead0, markTime(c, 'release'), 1);
    let at = -1;
    for (let i = 0; i < 400 && at < 0; i++) {
      a.an.step(frame(), a.work, a.vel);
      if (a.an.drain().includes('release')) at = i;
    }
    near((at + 1) * (1000 / 60), markTime(c, 'release'), 17);
  });
  it('an item begun for the user plays the self clip, one for an ally the ally clip; the leads differ by the flight and the wait', () => {
    const ally = animator();
    ally.an.request('item', 'idle', ally.work, ally.vel);
    ally.an.begin('item', ally.work, ally.vel, false);
    expect(ally.an.usedOnSelf).toBe(false);
    expect(ally.an.playing).toBe('item');
    const self = animator();
    self.an.request('item', 'idle', self.work, self.vel); // the request comes first, as the presenter's setPose
    self.an.begin('item', self.work, self.vel, true);
    expect(self.an.usedOnSelf).toBe(true);
    expect(self.an.playing).toBe('itemSelf');
    const la = ally.an.lead('item');
    const ls = self.an.lead('item');
    const ca = ally.an.compiled('item')!;
    const cs = self.an.compiled('itemSelf')!;
    near(la, markTime(ca, 'release') + STYLE_P2.p2!.orbFlight, 1);
    near(ls, markTime(cs, 'release') + STYLE_P2.p2!.selfWait, 1);
    expect(la).toBeGreaterThan(ls);
  });
  it('the strike lands on the lunge\'s apex to within a frame; lead(\'end\') is what is left of the game\'s end signal (pass 2 only)', () => {
    const a = animator();
    a.an.begin('attack', a.work, a.vel);
    const coil = a.an.lead('attack');
    near(coil, frameMs(20) - STRIKE_RUN_MS, 1);
    run(a, coil + 5);
    a.an.drain();
    a.an.lunge(LUNGE_MS, ATTACK_IMPACT);
    let frameOfContact = -1;
    for (let i = 1; i <= 60 && frameOfContact < 0; i++) {
      a.an.step(frame(), a.work, a.vel);
      if (a.an.drain().includes('contact')) frameOfContact = i;
    }
    expect(Math.abs(frameOfContact - (LUNGE_MS * ATTACK_IMPACT) / (1000 / 60))).toBeLessThanOrEqual(1.5);
    near(a.an.lead('end'), frameMs(34), 40); // contact to the end signal
    const old = animator(STYLE_B);
    old.an.begin('attack', old.work, old.vel);
    expect(old.an.lead('end')).toBe(-1);
  });
  it('hit-stop: 30 ms for a weak blow and 80 for a strong one, first and last hit only; the camera punch is bigger for a strong one', () => {
    const weak = animator();
    weak.an.begin('attack', weak.work, weak.vel);
    const p0 = weak.an.beat('contact', 0, 1, false).punch;
    const strong = animator();
    strong.an.begin('attack', strong.work, strong.vel);
    const p1 = strong.an.beat('contact', 0, 1, true).punch;
    expect(p1).toBeGreaterThan(p0);
    // frozen time: step with a clock and watch how long the clip's time stays put
    const frozenFor = (a: ReturnType<typeof animator>): number => {
      let n = 0;
      const t0 = a.an.lead('attack');
      for (let i = 0; i < 20; i++) {
        a.an.step(frame(), a.work, a.vel);
        if (a.an.lead('attack') === t0) n++;
        else break;
      }
      return n * (1000 / 60);
    };
    expect(frozenFor(weak)).toBeLessThanOrEqual(34);
    expect(frozenFor(strong)).toBeGreaterThanOrEqual(66);
    const mid = animator();
    mid.an.begin('attack', mid.work, mid.vel);
    mid.an.beat('contact', 1, 3, true); // a middle hit of three: no hit-stop
    mid.an.step(frame(), mid.work, mid.vel);
    const t1 = mid.an.lead('attack');
    mid.an.step(frame(), mid.work, mid.vel);
    expect(mid.an.lead('attack')).toBeLessThan(t1);
  });
  it('pass 1\'s styles are as they were: no hold, no end lead, a vial-era library', () => {
    const a = animator(STYLE_B);
    expect(a.an.lib.itemSelf).toBeUndefined();
    expect(a.an.compiled('cast')!.sustain).toBeNull();
    const lib = buildLibrary2(STYLE_P2, {}, {}, LULU_RE);
    expect(lib.extra).toBeDefined();
  });
});
