/**
 * Pass 2 of the animation prototype (`?anim=proto&style=P2`; `AnimRE.ts`, `AnimHold.ts`, `AnimLibrary2.ts`, `LuluAnim2.ts`; FFX only for the numbers, plumbing for both games): the clock is Lulu's frame
 * counts at 30 fps from the game's motion data, a cast and an item are start -> looping hold -> release, the hold can be kept open by the engine and lets go, and a KO folds down with its lowest point on
 * the floor and its feet pinned while she kneels. (The animator's own behaviour is `anim-pass2-play.test.ts`.) Lulu's real rig (read only, `D:/pyrefly-art-rigs/lulu-v2`) is used where the disk has it.
 */
import { describe, expect, it } from 'vitest';
import { compileClip, markTime, sampleClip, type ClipRig } from '../../../src/engine/rig/anim/AnimClip.ts';
import { HoldTrack, HOLD_MAX_MS, RESID_MS, swingAt } from '../../../src/engine/rig/anim/AnimHold.ts';
import { libraryFor, STRIKE_RUN_MS } from '../../../src/engine/rig/anim/AnimLibrary2.ts';
import { frameMs, LULU_ATTACK, LULU_CAST, LULU_ITEM, LULU_REACT } from '../../../src/engine/rig/anim/AnimRE.ts';
import { animFromQuery, STYLE_A, STYLE_B, STYLE_P2, STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import { measurer } from '../../../tools/rig/lane/anim-measure.mjs';
import { fixture, HAVE_RIG, LULU_V2, luluRig, near } from './anim-pass2-fixture.ts';

describe('the game\'s clock (AnimRE.ts)', () => {
  it('a frame is 1/30 s', () => {
    near(frameMs(1), 33.333, 0.001);
    near(frameMs(30), 1000, 1e-9);
  });
  it('Lulu\'s tables are the research note\'s (section 2): attack 20 / 54 / 60, cast 45+28 / 49+15 / 55+20, item 22 + 37 / 33, hurt 50, KO 65 with the floor at 37, victory 118 + 30', () => {
    expect(LULU_ATTACK).toEqual({ hit: 20, end: 54, total: 60 });
    expect(LULU_CAST.map((c) => [c.start, c.hit])).toEqual([[45, 28], [49, 15], [55, 20]]);
    expect(LULU_CAST.map((c) => c.loop)).toEqual([24, 23, 30]);
    expect(LULU_CAST.map((c) => c.end)).toEqual([43, 48, 90]);
    expect(LULU_ITEM.start).toBe(22);
    expect(LULU_ITEM.ally.hit).toBe(37);
    expect(LULU_ITEM.self.hit).toBe(33);
    expect(LULU_ITEM.loop).toBe(50);
    expect(LULU_REACT).toEqual({ hurt: 50, ko: 65, koFloor: 37, victory: 118, victoryLoop: 30 });
  });
  it('the strike\'s run-up to its contact is the lunge\'s apex (LUNGE_MS x ATTACK_IMPACT)', () => {
    near(STRIKE_RUN_MS, LUNGE_MS * ATTACK_IMPACT, 1);
  });
});

describe('the style', () => {
  it('P2 is B\'s look: the same overshoot, settle, stretch, secondary motion and braid', () => {
    expect(STYLES.P2).toBe(STYLE_P2);
    for (const k of ['overshoot', 'settle', 'stretch', 'secondary', 'braid', 'easeAct'] as const) expect(STYLE_P2[k]).toEqual(STYLE_B[k]);
    expect(STYLE_P2.p2).toBeDefined();
    expect(STYLE_A.p2).toBeUndefined();
    expect(STYLE_B.p2).toBeUndefined();
  });
  it('hit-stop: a weak blow 0 to 30 ms, a strong one 50 to 80 (the research notes)', () => {
    const p = STYLE_P2.p2!;
    expect(p.hitStopWeak).toBeLessThanOrEqual(30);
    expect(p.hitStopStrong).toBeGreaterThanOrEqual(50);
    expect(p.hitStopStrong).toBeLessThanOrEqual(80);
  });
  it('the query: style=P2, and cast=2|3 picks the cast type', () => {
    expect(animFromQuery('?anim=proto&style=P2')).toBe(STYLE_P2);
    expect(animFromQuery('?anim=proto&style=p2&cast=3')?.p2?.castType).toBe(3);
    expect(animFromQuery('?anim=proto&style=P2&cast=9')).toBe(STYLE_P2);
    expect(animFromQuery('?anim=proto&style=B&cast=3')).toBe(STYLE_B);
  });
});

describe('the hold track (AnimHold.ts)', () => {
  const rig = (): ClipRig => {
    const d = fixture();
    return { boneIndex: d.boneIndex, roots: d.roots, keys: compileKeys(d), channels: d.bones.length * 5 };
  };
  const clip = () => compileClip(rig(), { name: 't', key: 'cast', segments: [{ pose: { base: 'cast' }, ms: 200 }, { pose: { base: 'cast' }, ms: 0, hold: 500, sustain: { pose: { base: 'item' }, period: 400, grow: 0.5, growMs: 300 }, charge: 0.4 }, { pose: { base: 'idle' }, ms: 300, mark: 'release', charge: 0 }] });

  it('the swing is 0 at the start and at every period, 1 half a period in', () => {
    near(swingAt(400, 0), 0, 1e-12);
    near(swingAt(400, 200), 1, 1e-12);
    near(swingAt(400, 400), 0, 1e-12);
    near(swingAt(400, 800), 0, 1e-9);
  });
  it('compiles the hold: where it starts, its shortest stay, its period, and the marks after it include the stay', () => {
    const c = clip();
    expect(c.sustain).not.toBeNull();
    expect(c.sustain!.start).toBe(200);
    expect(c.sustain!.min).toBe(500);
    expect(c.sustain!.period).toBe(400);
    expect(markTime(c, 'release')).toBe(1000); // 200 of start, 500 of stay, 300 of release
    expect(c.total).toBe(1000);
  });
  it('left open the clip\'s time stops at the end of the shortest stay and the swing goes on; released it goes on at once', () => {
    const c = clip();
    const h = new HoldTrack();
    h.open = true;
    let t = 0;
    for (let i = 0; i < 90; i++) t = h.advance(c, t + 16.667, 16.667); // 1.5 s
    expect(t).toBeLessThan(700); // never past the end of the shortest stay (200 + 500)
    expect(t).toBeGreaterThan(699.9);
    expect(h.h).toBeGreaterThan(1200); // the hold clock kept running
    expect(h.passed).toBe(false);
    h.release();
    t = h.advance(c, t + 16.667, 16.667);
    expect(h.passed).toBe(true);
    expect(t).toBeGreaterThan(700);
  });
  it('left alone (not open) the clip leaves the hold after the shortest stay', () => {
    const c = clip();
    const h = new HoldTrack();
    let t = 0;
    for (let i = 0; i < 60; i++) t = h.advance(c, t + 16.667, 16.667);
    expect(h.passed).toBe(true);
    expect(t).toBeGreaterThan(900);
  });
  it('the swing\'s last value fades out over RESID_MS after the hold (the release does not jump) and is gone after', () => {
    const c = clip();
    const h = new HoldTrack();
    let t = 0;
    while (!h.passed) t = h.advance(c, t + 16.667, 16.667);
    const w0 = h.weight(c, t);
    h.advance(c, t + RESID_MS / 2, RESID_MS / 2);
    const w1 = h.weight(c, t);
    h.advance(c, t + RESID_MS * 2, RESID_MS * 2);
    const w2 = h.weight(c, t);
    expect(w1).toBeLessThanOrEqual(w0);
    expect(w2).toBe(0);
  });
  it('a hold the engine never releases lets go at HOLD_MAX_MS', () => {
    const c = clip();
    const h = new HoldTrack();
    h.open = true;
    let t = 0;
    for (let i = 0; i < Math.ceil((HOLD_MAX_MS + 600) / 16.667); i++) t = h.advance(c, t + 16.667, 16.667);
    expect(h.passed).toBe(true);
  });
  it('the glow a hold builds approaches its `grow` and the segment\'s own level is the floor', () => {
    const c = clip();
    const h = new HoldTrack();
    h.h = 0;
    near(h.charge(c, 1), 0.4, 1e-9);
    h.h = 3000;
    near(h.charge(c, 1), 0.4 + 0.5, 0.01);
    near(h.charge(c, 2), 0, 1e-9);
  });
});

describe('pass 2\'s clips on Lulu: the game\'s frame counts', () => {
  const real = HAVE_RIG ? it : it.skip;
  real('the attack: wind-up + the strike\'s run-up = 20 frames to the hit, the end signal 34 frames later, the clip 54 (and 6 more to idle)', () => {
    const rig = luluRig();
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const w = compileClip(rig, lib.windup);
    const s = compileClip(rig, lib.strike);
    near(markTime(w, 'coiled') + markTime(s, 'contact'), frameMs(20), 0.5);
    near(markTime(s, 'end') - markTime(s, 'contact'), frameMs(34), 0.5);
    near(markTime(w, 'coiled') + markTime(s, 'end'), frameMs(54), 0.5);
    near(compileClip(rig, lib.recover('attack')).total, frameMs(6), 0.5);
  });
  real.each([0, 1, 2] as const)("cast type index %i: the hold begins at the start clip's length, the spell leaves at start + stay + the release clip's hit frame, the clip ends at the game's end frame", (i) => {
    const rig = luluRig();
    const c = LULU_CAST[i]!;
    const lib = libraryFor({ ...STYLE_P2, p2: { ...STYLE_P2.p2!, castType: (i + 1) as 1 | 2 | 3 } }, LULU_ACCENTS, LULU.p2);
    const k = compileClip(rig, lib.cast);
    near(markTime(k, 'hold'), frameMs(c.start), 0.5);
    near(k.sustain!.min, STYLE_P2.p2!.castDwell, 1e-9);
    near(k.sustain!.period, frameMs(c.loop), 0.5);
    near(markTime(k, 'release'), frameMs(c.start + c.hit) + STYLE_P2.p2!.castDwell, 0.5);
    near(markTime(k, 'end') - markTime(k, 'release'), frameMs(c.end - c.hit), 0.5);
  });
  real('the item: the orb leaves at 22 + 37 frames (an ally) or 22 + 33 (the user) plus the stay, the hold loops 50 frames, no clip names a vial', () => {
    const rig = luluRig();
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const a = compileClip(rig, lib.item);
    const s = compileClip(rig, lib.itemSelf!);
    near(markTime(a, 'release'), frameMs(22 + 37) + STYLE_P2.p2!.itemDwell, 0.5);
    near(markTime(s, 'release'), frameMs(22 + 33) + STYLE_P2.p2!.itemDwell, 0.5);
    near(a.sustain!.period, frameMs(50), 0.5);
    near(markTime(a, 'end') - markTime(a, 'release'), frameMs(64 - 37), 0.5);
    near(markTime(s, 'end') - markTime(s, 'release'), frameMs(56 - 33), 0.5);
    expect(lib.leads.item.offsetMs).toBe(STYLE_P2.p2!.orbFlight);
    expect(lib.leads.itemSelf!.offsetMs).toBe(STYLE_P2.p2!.selfWait);
  });
  real('the KO: 65 frames, the floor on frame 37; the hurt clip is a recoil that holds, its recovery the rest of the 50 frames', () => {
    const rig = luluRig();
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const k = compileClip(rig, lib.ko);
    near(k.total, frameMs(65), 0.5);
    near(markTime(k, 'ground'), frameMs(37), 0.5);
    const rec = compileClip(rig, lib.recover('hurt')).total;
    expect(rec).toBeGreaterThan(1000); // the game's 50 frames are mostly the getting up
    expect(rec).toBeLessThanOrEqual(frameMs(50));
  });
  real('every clip ends on the key it names, nothing is non-finite, and the victory clip is an open loop of 118 frames to the loop', () => {
    const rig = luluRig();
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    for (const def of [lib.windup, lib.strike, lib.cast, lib.item, lib.itemSelf!, lib.hurt, lib.ko, lib.victory]) {
      const c = compileClip(rig, def);
      const out = new Float64Array(rig.channels);
      sampleClip(c, c.total + 5, rig.keys.get('idle')!, out);
      expect(out.every(Number.isFinite)).toBe(true);
    }
    const v = compileClip(rig, lib.victory);
    expect(v.open).toBe(true);
    near(v.total, frameMs(118), 1);
    near(v.sustain!.period, frameMs(30), 0.5);
  });
});

describe('the KO folds down onto the floor (Lulu\'s rig, measured)', () => {
  const real = HAVE_RIG ? it : it.skip;
  real('its lowest point stays within 50 px of the floor from the first frame to the last, and her feet stay put from the strike to the end of the kneel', async () => {
    const m = await measurer(LULU_V2);
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const c = compileClip(m.rig, lib.ko);
    const out = new Float64Array(m.rig.channels);
    const idle = m.rig.keys.get('idle')!;
    let worst = 0;
    const feetX: number[] = [];
    for (let t = 0; t <= c.total; t += 1000 / 60) {
      sampleClip(c, t, idle, out);
      const r = m.pose(out);
      worst = Math.max(worst, Math.abs(r.low - m.baselineY));
      if (t >= frameMs(3) && t <= frameMs(17)) feetX.push(r.feet![0]);
    }
    expect(worst).toBeLessThanOrEqual(50);
    expect(Math.max(...feetX) - Math.min(...feetX)).toBeLessThan(15); // pinned while she buckles and kneels
    sampleClip(c, c.total + 1, idle, out);
    const end = m.pose(out);
    const key = m.pose(m.rig.keys.get('ko')!);
    near(end.low, key.low, 0.01); // the clip ends exactly on the KO key
    near(end.left, key.left, 0.01);
  });
  real('the knees bend: at the kneel her head is lower than standing by a ninth of her height or more while her feet have not moved', async () => {
    const m = await measurer(LULU_V2);
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const c = compileClip(m.rig, lib.ko);
    const out = new Float64Array(m.rig.channels);
    sampleClip(c, frameMs(17), m.rig.keys.get('idle')!, out);
    const kneel = m.pose(out);
    const stand = m.pose(m.rig.keys.get('idle')!);
    expect(kneel.top - stand.top).toBeGreaterThan(2330 / 9);
    expect(Math.abs(kneel.feet![0] - stand.feet![0])).toBeLessThan(60);
  });
  real('a hit bends the knees and straightens again: the head drops at the recoil, and the recovery stands her up on the idle exactly', async () => {
    const m = await measurer(LULU_V2);
    const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
    const h = compileClip(m.rig, lib.hurt);
    const out = new Float64Array(m.rig.channels);
    sampleClip(h, h.total, m.rig.keys.get('idle')!, out);
    const bent = m.pose(out);
    const stand = m.pose(m.rig.keys.get('idle')!);
    expect(bent.top).toBeGreaterThan(stand.top + 150);
    const r = compileClip(m.rig, lib.recover('hurt'));
    const back = new Float64Array(m.rig.channels);
    sampleClip(r, r.total + 1, out, back);
    near(m.pose(back).top, stand.top, 0.01);
  });
});
