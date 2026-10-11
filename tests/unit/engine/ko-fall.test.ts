/**
 * FA-1, FA-2 and FA-3 (visual-and-feel pass, 2026-10-10; PR-0378; both games): the pure half of how a KO plays and how a revive mirrors it (`KoFall.ts`).
 *
 * The decision ({@link koMode}) is a table of plain facts; the clock ({@link KoRun}) is stepped frame by frame the way the stage steps it, with the field
 * clock a hit-stop zeroes and the real clock it never does. What the capped cross promises (the lesser painting never above 0.382, a snap is never one
 * frame) is checked at 30, 60, 120 and 144 fps and at random phases, the way `pose-blend.test.ts` checks the pose blend.
 */
import { describe, expect, it } from 'vitest';
import {
  KO_BUCKLE_MS,
  KO_CROSS_MS,
  KO_LEAN,
  PUFFS,
  PUFF_FALL,
  PUFF_LIFE_MS,
  PUFF_REVIVE,
  REVIVE_MS,
  RISE_MS,
  canTopple,
  fallRun,
  koFallOff,
  koMode,
  puffAt,
  reviveRun,
  type KoFacts,
  type KoRun,
} from '../../../src/engine/KoFall.ts';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TIMING } from '../../../src/engine/BattlePresenterEvents.ts';

const facts = (over: Partial<KoFacts> = {}): KoFacts => ({ rm: false, samePlane: false, samePainting: false, fromProne: false, toProne: true, name: 'tidus', partySide: true, ...over });

describe('koMode: how a KO plays', () => {
  it('a human-scale party figure with a lying KO painting topples (FA-2, option B)', () => {
    for (const name of ['tidus', 'yuna', 'rikku-thief', 'paine-warrior', 'kimahri']) expect(koMode(facts({ name })), name).toBe('topple');
  });

  it('a KO painting that does not lie down crosses over after the buckle, it is never cut (FA-1)', () => {
    expect(koMode(facts({ name: 'anima', partySide: false, toProne: false }))).toBe('buckle-cross');
    expect(koMode(facts({ name: 'x2-anima', partySide: false, toProne: false }))).toBe('buckle-cross');
    expect(koMode(facts({ name: 'yu-pagoda', partySide: false, toProne: true }))).toBe('buckle-cross'); // a pagoda's wide painting is not a body
    expect(koMode(facts({ toProne: false }))).toBe('buckle-cross'); // a party figure whose KO painting stands
  });

  it('machines and statues never topple, whatever shape their KO painting has; colossi and foes buckle and cross', () => {
    for (const name of ['vegnagun-leg', 'vegnagun-body', 'sin-left-fin', 'overdrive-sin', 'yu-pagoda']) expect(koMode(facts({ name, partySide: false })), name).toBe('buckle-cross');
    for (const name of ['braskas-final-aeon-1', 'seymour-natus', 'bahamut', 'ffx2-bahamut', 'ixion', 'evrae']) expect(koMode(facts({ name })), name).toBe('buckle-cross');
    expect(canTopple('tidus', false)).toBe(false); // a foe
    expect(canTopple('tidus', true)).toBe(true);
  });

  it('the from.scale.prone branch crosses at once: a standing painting already flagged prone (Vegnagun tail, Overdrive Sin) was a plain cut and the two largest jerks of round 23', () => {
    expect(koMode(facts({ name: 'vegnagun-tail', partySide: false, fromProne: true }))).toBe('cross');
    expect(koMode(facts({ name: 'overdrive-sin', partySide: false, fromProne: true, toProne: false }))).toBe('cross');
  });

  it('REDUCE MOTION is a short cross with no movement (the page default), for every figure', () => {
    for (const toProne of [true, false]) for (const partySide of [true, false]) expect(koMode(facts({ rm: true, toProne, partySide })), `${toProne} ${partySide}`).toBe('cross');
  });

  it('a KO with no painting of its own keeps what it had: nothing to play, or the buckle and a flip (two layers of one painting would dim for a moment)', () => {
    expect(koMode(facts({ samePlane: true }))).toBe('cut');
    expect(koMode(facts({ samePainting: true }))).toBe('flip');
    expect(koMode(facts({ samePainting: true, rm: true }))).toBe('cut');
    expect(koMode(facts({ samePlane: true, rm: true }))).toBe('cut');
  });
});

/** Step a run at `fps`: one call per frame, the field clock and the real one given (a hit-stop frame is `field: 0`). Returns the pose of every frame, the first being the one the KO was called in. */
function play(run: KoRun, fps: number, ms: number, freeze: (i: number) => boolean = () => false): Array<KoRun['pose']> {
  const frame = 1000 / fps;
  const rows: Array<KoRun['pose']> = [run.pose];
  for (let i = 0; i * frame < ms; i++) {
    run.step(freeze(i) ? 0 : frame, frame);
    rows.push(run.pose);
  }
  return rows;
}

const lesser = (p: { out: number; inn: number }): number => Math.min(p.out, p.inn);

describe('?kofall=off: a same-build A/B against what the game did before FA-1', () => {
  it('reproduces the old decision exactly: a cut for REDUCE MOTION, no change of plane or a standing painting already prone; the buckle and a flip for everything else', () => {
    for (const rm of [false, true]) for (const samePlane of [false, true]) for (const fromProne of [false, true]) for (const toProne of [false, true]) {
      const old = rm || samePlane || fromProne ? 'cut' : 'flip';
      expect(koMode(facts({ legacy: true, rm, samePlane, fromProne, toProne })), `${rm} ${samePlane} ${fromProne} ${toProne}`).toBe(old);
    }
    expect(koMode(facts({ legacy: true, name: 'tidus' }))).toBe('flip'); // a party figure with a lying painting: no topple
  });

  it('is read from the address, and is off in a test (no location)', () => {
    expect(koFallOff()).toBe(false);
    const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
    try {
      expect(koFallOff()).toBe(true);
    } finally {
      if (was) Object.defineProperty(globalThis, 'location', was);
      else delete (globalThis as { location?: unknown }).location;
    }
    expect(koFallOff()).toBe(false);
  });
});

describe('KoRun: the clock of a fall', () => {
  it('FFX plays 220 ms of buckle, then 75 ms of cross, and is done by 295 ms; FFX-2 is 170 and 75 (the existing tempos, VP-1001-49)', () => {
    for (const [game, hold] of [['ffx', 220], ['ffx2', 170]] as const) {
      expect(KO_BUCKLE_MS[game]).toBe(hold);
      const run = fallRun('buckle-cross', game)!;
      const rows = play(run, 60, 600);
      const holdFrames = rows.filter((r) => r.phase === 'hold').length;
      const crossFrames = rows.filter((r) => r.phase === 'cross').length;
      expect(holdFrames, `${game} hold frames`).toBe(Math.ceil(hold / (1000 / 60) - 1e-9)); // the call frame, then the hold up to the frame its end falls in
      expect(crossFrames, `${game} cross frames`).toBeGreaterThanOrEqual(4);
      expect(crossFrames).toBeLessThanOrEqual(5);
      expect(run.done).toBe(true);
      expect(rows.at(-1)).toMatchObject({ phase: 'done', out: 0, inn: 1 });
      // the whole of it ends within one frame of hold + 75
      const ended = rows.findIndex((r) => r.phase === 'done') * (1000 / 60);
      expect(ended).toBeGreaterThanOrEqual(hold + KO_CROSS_MS - 1e-6);
      expect(ended).toBeLessThan(hold + KO_CROSS_MS + 1000 / 60 + 1e-6);
    }
  });

  it('the hold shows the standing painting alone; the buckle ramps to its full at the end of the hold and stays there while the standing painting fades out', () => {
    const run = fallRun('buckle-cross', 'ffx')!;
    const rows = play(run, 60, 400);
    for (const r of rows.filter((x) => x.phase === 'hold')) expect(r).toMatchObject({ out: 1, inn: 0 });
    const holds = rows.filter((x) => x.phase === 'hold');
    for (let i = 1; i < holds.length; i++) expect(holds[i]!.buckle).toBeGreaterThanOrEqual(holds[i - 1]!.buckle);
    for (const r of rows.filter((x) => x.phase === 'cross')) expect(r).toMatchObject({ buckle: 1, lean: KO_LEAN });
    expect(rows.at(-1)).toMatchObject({ buckle: 0, lean: 0 });
  });

  it('the cross is on the REAL clock: a hit-stop that holds the field in the middle of it does not hold the cross; one in the hold holds the hold', () => {
    // a freeze across the cross: field 0 for 6 frames after the hold ends
    const a = fallRun('buckle-cross', 'ffx')!;
    const frames: number[] = [];
    for (let i = 0; i < 40; i++) {
      const crossing = a.pose.phase === 'cross';
      a.step(crossing ? 0 : 1000 / 60, 1000 / 60); // the field is frozen for the whole cross
      frames.push(a.pose.phase === 'cross' ? a.pose.inn : -1);
    }
    expect(a.done).toBe(true);
    // the cross still ran: its incoming painting rose every frame it was up
    const up = frames.filter((x) => x >= 0);
    for (let i = 1; i < up.length; i++) expect(up[i]!).toBeGreaterThan(up[i - 1]!);
    // a freeze in the hold holds the buckle where it stands
    const b = fallRun('buckle-cross', 'ffx')!;
    b.step(1000 / 60, 1000 / 60);
    const before = b.pose.buckle;
    for (let i = 0; i < 5; i++) b.step(0, 1000 / 60);
    expect(b.pose.buckle).toBe(before);
    expect(b.pose.phase).toBe('hold');
  });

  it('the lesser painting never shows more than 0.382 at any frame rate or phase, and a cross is never one frame (a snap): at least 2 frames at or under 60 fps, 1 at 30', () => {
    let seed = 7;
    const rnd = (): number => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (const fps of [30, 60, 120, 144]) {
      let minFrames = Infinity;
      for (let k = 0; k < 250; k++) {
        const run = fallRun(k % 2 ? 'buckle-cross' : 'cross', k % 3 ? 'ffx' : 'ffx2')!;
        const frame = 1000 / fps;
        // a random phase: the first step is a fraction of a frame long
        run.step(frame * rnd(), frame * rnd());
        let blend = 0;
        let prev = run.pose;
        for (let i = 0; i < 80 && !run.done; i++) {
          run.step(frame, frame);
          const p = run.pose;
          expect(lesser(p), `${fps} fps`).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
          expect(p.out).toBeLessThanOrEqual(prev.out + 1e-12);
          if (p.phase === 'cross' && p.out > 0.02 && p.inn > 0.02) blend++;
          prev = p;
        }
        minFrames = Math.min(minFrames, blend);
        expect(run.done).toBe(true);
      }
      expect(minFrames, `${fps} fps`).toBeGreaterThanOrEqual(fps <= 30 ? 1 : fps <= 60 ? 2 : 4);
    }
  });

  it('cross mode (REDUCE MOTION, a prone standing painting) has no hold at all: the first frame is already crossing, nothing buckles, nothing tips, no puff', () => {
    const run = fallRun('cross', 'ffx')!;
    run.step(1000 / 60, 1000 / 60);
    expect(run.pose.phase).toBe('cross');
    const rows = play(run, 60, 200);
    for (const r of rows) expect(r).toMatchObject({ buckle: 0, lean: 0, tip: 0 });
    expect(run.takePuff()).toBeNull();
    expect(run.done).toBe(true);
  });

  it('flip mode keeps the old KO exactly: the buckle, then the one-frame hand-over, no cross', () => {
    const run = fallRun('flip', 'ffx2')!;
    const rows = play(run, 60, 400);
    expect(rows.filter((r) => r.phase === 'cross')).toHaveLength(0);
    const donePhase = rows.findIndex((r) => r.phase === 'done');
    expect(rows[donePhase - 1]!.out).toBe(1);
    expect(rows[donePhase]).toMatchObject({ out: 0, inn: 1 });
    expect(fallRun('cut', 'ffx')).toBeNull();
  });

  it('only a topple tips the standing painting: quadIn up to the end of the hold, fully tipped while it crosses', () => {
    const t = fallRun('topple', 'ffx')!;
    const rows = play(t, 60, 400);
    const holds = rows.filter((r) => r.phase === 'hold');
    for (let i = 1; i < holds.length; i++) expect(holds[i]!.tip).toBeGreaterThanOrEqual(holds[i - 1]!.tip);
    expect(holds[0]!.tip).toBe(0);
    expect(holds.at(-1)!.tip).toBeGreaterThan(0.85);
    for (const r of rows.filter((x) => x.phase === 'cross')) expect(r.tip).toBe(1);
    for (const mode of ['buckle-cross', 'cross', 'flip'] as const) for (const r of play(fallRun(mode, 'ffx')!, 60, 400)) expect(r.tip, mode).toBe(0);
  });

  it('the puff goes up once, when the cross begins, and only for a topple', () => {
    const run = fallRun('topple', 'ffx')!;
    let taken = 0;
    let at = -1;
    for (let i = 0; i < 40; i++) {
      run.step(1000 / 60, 1000 / 60);
      const p = run.takePuff();
      if (p !== null) {
        taken++;
        at = i;
        expect(p).toBe(PUFF_FALL);
        expect(run.pose.phase).toBe('cross');
      }
    }
    expect(taken).toBe(1);
    expect(at * (1000 / 60)).toBeGreaterThanOrEqual(KO_BUCKLE_MS.ffx - 1000 / 60);
    for (const mode of ['buckle-cross', 'cross', 'flip'] as const) {
      const r = fallRun(mode, 'ffx')!;
      for (let i = 0; i < 40; i++) {
        r.step(1000 / 60, 1000 / 60);
        expect(r.takePuff(), mode).toBeNull();
      }
    }
  });
});

describe('KoRun: the revive mirrors the fall', () => {
  it('a revive with travel is the cross, then the rise from the toppled pose: 395 ms, inside TIMING.revive, so the menu is never delayed (FA-3)', () => {
    expect(REVIVE_MS).toBe(KO_CROSS_MS + RISE_MS);
    expect(REVIVE_MS).toBe(395);
    expect(REVIVE_MS).toBeLessThan(TIMING.revive);
    for (const fps of [30, 60, 144]) {
      const run = reviveRun(true);
      const rows = play(run, fps, 700);
      const ended = rows.findIndex((r) => r.phase === 'done') * (1000 / fps);
      expect(ended, `${fps} fps`).toBeGreaterThanOrEqual(REVIVE_MS - 1e-6);
      expect(ended, `${fps} fps`).toBeLessThan(REVIVE_MS + 1000 / fps + 1e-6);
      expect(ended).toBeLessThan(TIMING.revive);
    }
  });

  it('the cross is the same capped one (the lying painting 1 - s out, the standing one s squared in) with the standing painting already fully toppled and buckled; the rise then comes back upright, fast first', () => {
    const run = reviveRun(true);
    const rows = play(run, 60, 600);
    const cross = rows.filter((r) => r.phase === 'cross');
    expect(cross.length).toBeGreaterThanOrEqual(4);
    for (const r of cross) {
      expect(r).toMatchObject({ tip: 1, buckle: 1 });
      expect(lesser(r)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
    }
    const rise = rows.filter((r) => r.phase === 'rise');
    for (const r of rise) expect(r).toMatchObject({ out: 0, inn: 1 });
    for (let i = 1; i < rise.length; i++) expect(rise[i]!.tip).toBeLessThanOrEqual(rise[i - 1]!.tip);
    // quadOut mirrored: more than half the way up in the first third of the rise
    expect(rise[Math.floor(rise.length / 3)]!.tip).toBeLessThan(0.5);
    expect(rise.at(-1)!.tip).toBeLessThan(0.02);
    expect(rows.at(-1)).toMatchObject({ phase: 'done', tip: 0, buckle: 0 });
  });

  it('a revive with no travel (REDUCE MOTION, a figure that never topples) is only the short cross, 75 ms, and moves nothing', () => {
    const run = reviveRun(false);
    const rows = play(run, 60, 300);
    expect(rows.filter((r) => r.phase === 'rise')).toHaveLength(0);
    for (const r of rows) expect(r).toMatchObject({ tip: expect.any(Number), buckle: expect.any(Number) });
    for (const r of rows.filter((x) => x.phase === 'cross')) expect(r).toMatchObject({ tip: 0, buckle: 0 });
    expect(run.takePuff()).toBeNull();
    const ended = rows.findIndex((r) => r.phase === 'done') * (1000 / 60);
    expect(ended).toBeGreaterThanOrEqual(KO_CROSS_MS - 1e-6);
    expect(ended).toBeLessThan(KO_CROSS_MS + 1000 / 60 + 1e-6);
  });

  it('the revive puff is the small one, and it goes up as the run starts', () => {
    const run = reviveRun(true);
    expect(run.takePuff()).toBe(PUFF_REVIVE);
    expect(run.takePuff()).toBeNull();
    expect(PUFF_REVIVE).toBeLessThan(PUFF_FALL);
  });

  it('the rise runs on the field clock (a hit-stop holds it) and the cross on the real one', () => {
    const run = reviveRun(true);
    for (let i = 0; i < 6; i++) run.step(0, 1000 / 60); // the cross runs with the field frozen
    expect(run.pose.phase).toBe('rise');
    const e = run.pose.tip;
    for (let i = 0; i < 5; i++) run.step(0, 1000 / 60);
    expect(run.pose.tip).toBe(e);
    run.step(1000 / 60, 1000 / 60);
    expect(run.pose.tip).toBeLessThan(e);
  });
});

describe('the dust puff', () => {
  it('six puffs, each with its own delay; one is nothing before its delay and nothing after its life', () => {
    expect(PUFFS).toHaveLength(6);
    expect(puffAt(-1, 0, 1)).toBeNull();
    expect(puffAt(PUFFS[1]!.delay - 1, 1, 1)).toBeNull();
    expect(puffAt(PUFFS[1]!.delay + 1, 1, 1)).not.toBeNull();
    for (let i = 0; i < PUFFS.length; i++) expect(puffAt(PUFFS[i]!.delay + PUFF_LIFE_MS + 1, i, 1)).toBeNull();
    expect(puffAt(10, 99, 1)).toBeNull();
  });

  it('a puff grows, drifts up and fades: radius and rise only increase over its life, alpha only falls, and a smaller size is smaller throughout', () => {
    for (let i = 0; i < PUFFS.length; i++) {
      let last: NonNullable<ReturnType<typeof puffAt>> | null = null;
      for (let age = PUFFS[i]!.delay; age <= PUFFS[i]!.delay + PUFF_LIFE_MS; age += 20) {
        const p = puffAt(age, i, 1)!;
        const small = puffAt(age, i, PUFF_REVIVE)!;
        expect(small.radius).toBeLessThan(p.radius);
        expect(small.rise).toBeLessThan(p.rise + 1e-12);
        if (last) {
          expect(p.radius).toBeGreaterThanOrEqual(last.radius);
          expect(p.rise).toBeGreaterThanOrEqual(last.rise);
          expect(p.alpha).toBeLessThanOrEqual(last.alpha);
        }
        expect(p.alpha).toBeLessThanOrEqual(0.34 + 1e-12);
        last = p;
      }
    }
  });
});
