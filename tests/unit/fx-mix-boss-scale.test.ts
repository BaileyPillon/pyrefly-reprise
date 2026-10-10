import { afterEach, describe, expect, it, vi } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { cameraAt, figBox, figOf, subjectId, type Actor, type Pose } from '../../src/engine/fx/mix/geometry.ts';
import { classify, MULTIPART, scaleHeld, scaleTarget } from '../../src/engine/fx/mix/masters.ts';
import { FRACS, holdEarly, lockOf, phaseLayout, scaleKey, sizedIds, sizingOf, stepOf, stepsFor, viewOf, type ScaleLock } from '../../src/engine/fx/mix/scaleLock.ts';
import { Staging } from '../../src/engine/fx/mix/staging.ts';

/**
 * r392-boss-scale (Bailey, 2026-10-06: "About 1.15x the party" for Yojimbo until a real FFX screenshot settles it; "Yojimbo looks huge compared to the
 * party": the live 39.1 build drew him 1.33 times the party at the first menu and 0.96 at Yuna's, the plan choosing another BOSS SCALE step at each menu).
 *
 * Game case: Yojimbo's target and his held size are FFX only (Chapter IX); the lock (one size per phase of a link) is shared plumbing, both games (it
 * reaches FFX-2's Bahamut, which jumped 563, 416, 581 px between menus). The picture itself (the sizes at every menu, by real keys, at three window sizes)
 * is measured in a browser: `docs/handoff/r392-boss-scale.md`. Here: the numbers, that no other boss is sized differently on a first plan, and the lock.
 */

afterEach(() => vi.unstubAllGlobals());

// ---- a stage of billboards ---------------------------------------------------------------------------------------------------------------------

/** A painted figure as the mix reads it: a billboard whose content quad is `h` tall and a quarter of that either side of its feet, in group space. */
const actor = (name: string, facing: number, x: number, z: number, h: number): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { worldHeight: number }).worldHeight = h;
  a.position.set(x, 0, z);
  a.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(-h * 0.25, 0, 0).applyMatrix4(a.matrixWorld);
    q[1].set(h * 0.25, 0, 0).applyMatrix4(a.matrixWorld);
    q[2].set(h * 0.25, h, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-h * 0.25, h, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};

/** Chapter IX's stage (`scenes/cavern-stolen-fayth.ts`): Lulu, Kimahri, Yuna 1.75 tall on their slots, Yojimbo 2.55 on his; today's idle rig. */
const IDLE: Pose = { pos: new Vector3(0, 5.1, 17.6), look: new Vector3(0.6, 1.8, 0), fov: 28 };
const cavern = (): { party: Actor[]; yojimbo: Actor; actors: Actor[] } => {
  const party = [actor('lulu', 1, -1.11, 4.95, 1.75), actor('kimahri', 1, -0.2, 4.45, 1.75), actor('yuna', 1, 1.18, 5.03, 1.75)];
  const yojimbo = actor('yojimbo', -1, 2.75, -2.0, 2.55);
  return { party, yojimbo, actors: [...party, yojimbo] };
};

/** What the screen shows (the report's way: each figure's painted box through the camera, px): the boss over the party's mean. */
const screenRatio = (actors: readonly Actor[], pose: Pose, W: number, H: number, boss: Actor): number => {
  const cam = cameraAt(pose, W / H);
  const h = (a: Actor): number => {
    const b = figBox(figOf(a), cam, W, H);
    return b.b - b.t;
  };
  const party = actors.filter((a) => a.facing >= 0);
  return h(boss) / (party.reduce((s, a) => s + h(a), 0) / party.length);
};

const size = (staging: Staging, actors: readonly Actor[], pose: Pose, W: number, H: number, opts = {}): void => {
  staging.clearPlan();
  staging.planScale(actors, pose.pos, scaleTarget, 0, { held: scaleHeld, view: viewOf(pose, { width: W, height: H }), ...opts });
  staging.apply(actors, true);
};

// ---- the numbers ---------------------------------------------------------------------------------------------------------------------------------

describe('BOSS SCALE targets (FFX Chapter IX only for Yojimbo)', () => {
  it("Yojimbo's is 1.15 (Bailey's pick); Evrae and Bahamut keep the target they had; Natus and Braska's Final Aeon have none any more", () => {
    expect(scaleTarget('yojimbo')).toBe(1.15);
    expect(scaleTarget('yojimbo-cavern')).toBe(1.15);
    expect(scaleTarget('evrae')).toBe(2.4);
    expect(scaleTarget('bahamut')).toBe(2.0);
    expect(scaleTarget('ffx2-bahamut')).toBe(2.0);
    // r3942-giants-ffx (FFX only, Chapters X and III; Bailey, 2026-10-08, "all of your recommendations"): their scenes draw them at the sizes he picked (Natus 4.455, the aeon 6.919), which BOSS SCALE
    // no longer grows (it was 2.2 for both): `docs/handoff/r3942-giants-ffx.md`, "What needs the framing engine".
    for (const id of ['seymour-natus', 'braskas-final-aeon', 'yunalesca', 'seymour-flux', 'vegnagun-tail', 'overdrive-sin', 'mortibody', 'daigoro', 'ginnem', 'isaaru']) expect(scaleTarget(id)).toBeNull();
  });

  it('only Yojimbo is held: the colossi keep their steps', () => {
    expect(scaleHeld('yojimbo')).toBe(true);
    for (const id of ['seymour-natus', 'braskas-final-aeon', 'evrae', 'bahamut', 'ffx2-bahamut', 'yunalesca', 'vegnagun', 'sin-fins-core']) expect(scaleHeld(id)).toBe(false);
  });

  it('Yojimbo is still a colossus fight (his master, his clearance) and Vegnagun and Sin stay unsized', () => {
    expect(classify(['yojimbo', 'ginnem', 'daigoro'])).toBe('colossus');
    expect(sizedIds([actor('tidus', 1, 0, 5, 1.75), actor('vegnagun-tail', -1, 0, 0, 8), actor('overdrive-sin', -1, 0, 0, 9)])).toEqual([]);
    expect(MULTIPART.test('vegnagun-tail') && MULTIPART.test('overdrive-sin')).toBe(true);
  });
});

// ---- Yojimbo on the screen -----------------------------------------------------------------------------------------------------------------------

describe('Yojimbo holds 1.15 times the party mean on screen (Chapter IX\'s stage, today\'s idle rig)', () => {
  it('is 0.99 times at his drawn scale (2.55 against 1.75, 6.7 units further from the camera) and 1.15 once sized', () => {
    const s = cavern();
    expect(screenRatio(s.actors, IDLE, 1600, 900, s.yojimbo)).toBeCloseTo(0.99, 1); // the 39.1 build's "plan not landed" picture: 224 px against 225
    const staging = new Staging();
    size(staging, s.actors, IDLE, 1600, 900);
    expect(staging.plan.get(s.yojimbo)!.k).toBeGreaterThan(1.1);
    expect(staging.plan.get(s.yojimbo)!.k).toBeLessThan(1.2);
    expect(screenRatio(s.actors, IDLE, 1600, 900, s.yojimbo)).toBeCloseTo(1.15, 2);
  });

  it('reads the same at 1280x720, 1600x900 and 2560x1440 (one world, one aspect; the HUD does not enter)', () => {
    const ratios = [[1280, 720], [1600, 900], [2560, 1440]].map(([W, H]) => {
      const s = cavern();
      size(new Staging(), s.actors, IDLE, W!, H!);
      return screenRatio(s.actors, IDLE, W!, H!, s.yojimbo);
    });
    for (const r of ratios) expect(r).toBeCloseTo(1.15, 2);
  });

  it('is read as the picture shows it (the painted box through the camera), not by distance: 1.15 where the distance reading says 1.17', () => {
    const s = cavern();
    const byDistance = new Staging();
    byDistance.planScale(s.actors, IDLE.pos, scaleTarget, 0, { held: scaleHeld });
    const shown = new Staging();
    shown.planScale(s.actors, IDLE.pos, scaleTarget, 0, { held: scaleHeld, view: viewOf(IDLE, { width: 1600, height: 900 }) });
    expect(byDistance.plan.get(s.yojimbo)!.k).not.toBeCloseTo(shown.plan.get(s.yojimbo)!.k, 3);
    byDistance.apply(s.actors, true);
    expect(screenRatio(s.actors, IDLE, 1600, 900, s.yojimbo)).not.toBeCloseTo(1.15, 2); // the distance reading lands a few percent off the number
  });

  it('only ever grows: a Yojimbo who already reads taller than 1.15 keeps his drawn scale', () => {
    const s = cavern();
    s.yojimbo.position.set(2.75, 0, 3.0); // stood up against the party
    const staging = new Staging();
    size(staging, s.actors, IDLE, 1600, 900);
    expect(staging.plan.size).toBe(0);
  });

  it('takes the full target whatever the step says (a held boss needs no step down), and a boss that is not held still takes only the step', () => {
    const s = cavern();
    const staging = new Staging();
    for (const frac of [1, 0.45, 0]) {
      staging.clearPlan();
      staging.planScale(s.actors, IDLE.pos, scaleTarget, frac, { held: scaleHeld, view: viewOf(IDLE, { width: 1600, height: 900 }) });
      expect(staging.plan.get(s.yojimbo)!.k).toBeCloseTo(1.15, 1);
    }
    const evrae = [...s.party, actor('evrae', -1, 2.75, -2.0, 2.55)]; // a sized colossus that is not held (Natus was this case's colossus until his entry was retired, r3942-giants-ffx)
    const full = new Staging();
    full.planScale(evrae, IDLE.pos, scaleTarget, 1, { held: scaleHeld });
    const half = new Staging();
    half.planScale(evrae, IDLE.pos, scaleTarget, 0.45, { held: scaleHeld });
    expect(full.plan.get(evrae[3]!)!.k).toBeCloseTo(2.44, 2); // measured on this stage: Evrae's 2.4 target takes his 2.55 drawn height to 2.44 times it
    expect(half.plan.get(evrae[3]!)!.k).toBeCloseTo(1 + (full.plan.get(evrae[3]!)!.k - 1) * 0.45, 6);
  });
});

// ---- no other boss is sized differently by a first plan ------------------------------------------------------------------------------------------

/** `Staging.planScale` as it was before this lane (copied; only `this.plan` swapped for the argument): the oracle for "the other bosses are unchanged". */
function planScaleBefore(plan: Map<Actor, { k: number; dx: number }>, actors: readonly Actor[], camPos: Vector3, target: (id: string) => number | null, frac = 1): void {
  const party = actors.filter((a) => a.facing >= 0);
  if (!party.length) return;
  const persp = (a: Actor): number => {
    const f = figOf(a);
    return f.h / Math.abs(a.scale.y || 1) / Math.max(0.5, f.feet.distanceTo(camPos));
  };
  const pMean = party.reduce((s, a) => s + persp(a), 0) / party.length;
  for (const a of actors) {
    if (a.facing >= 0) continue;
    const id = subjectId(a);
    const t = target(id);
    if (t === null || MULTIPART.test(id)) continue;
    const ratio = persp(a) / pMean;
    const k = 1 + (Math.min(2.6, Math.max(1, t / Math.max(0.05, ratio))) - 1) * frac;
    if (Math.abs(k - 1) < 0.04) continue;
    const p = plan.get(a) ?? { k: 1, dx: 0 };
    p.k = k;
    plan.set(a, p);
  }
}

describe('a first plan sizes every boss but Yojimbo exactly as before this lane', () => {
  // a seeded run of scenes: a party of three or four, one boss of each kind at a random place, a random step
  let seed = 7;
  const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const bosses = ['seymour-natus', 'braskas-final-aeon', 'evrae', 'bahamut', 'ffx2-bahamut', 'yunalesca', 'mortibody', 'vegnagun-tail'];

  it('gives the same factor for Natus, Braska\'s Final Aeon, Evrae, Bahamut and the unsized, over 200 scenes and every step', () => {
    for (let n = 0; n < 200; n++) {
      const party = Array.from({ length: 3 + Math.floor(rnd() * 2) }, (_, i) => actor(`p${i}`, 1, -2 + i * 1.3 + rnd() * 0.4, 4 + rnd() * 2, 1.6 + rnd() * 0.3));
      const boss = actor(bosses[Math.floor(rnd() * bosses.length)]!, -1, rnd() * 4, -8 + rnd() * 8, 2 + rnd() * 5);
      const actors = [...party, boss];
      const frac = [1, 0.7, 0.45, 0.25, 0][Math.floor(rnd() * 5)]!;
      const cam = new Vector3(rnd() * 2 - 1, 3 + rnd() * 3, 15 + rnd() * 6);
      const before = new Map<Actor, { k: number; dx: number }>();
      planScaleBefore(before, actors, cam, scaleTarget, frac);
      const after = new Staging();
      after.planScale(actors, cam, scaleTarget, frac);
      const named = (m: ReadonlyMap<Actor, { k: number; dx: number }>): [string, number, number][] => [...m].map(([a, p]) => [a.name, p.k, p.dx]);
      expect(named(after.plan)).toEqual(named(before));
      const withOpts = new Staging();
      withOpts.planScale(actors, cam, scaleTarget, frac, { held: scaleHeld, locked: null, view: viewOf({ pos: cam, look: new Vector3(0.6, 1.8, 0), fov: 28 }, { width: 1600, height: 900 }) }); // the options a plan passes
      expect(named(withOpts.plan)).toEqual(named(before));
    }
  });
});

// ---- the lock --------------------------------------------------------------------------------------------------------------------------------------

describe('a boss is sized once per phase of a link (the lock)', () => {
  /** Three menu states of one fight: the leaning member, where the camera stands, and so how the party's mean reads from today's rig. */
  const states = (): { party: Actor[]; boss: Actor; cam: Vector3 }[] =>
    [0, 1, 2].map((lean) => {
      const party = [actor('tidus', 1, -1.1, 5, 1.75), actor('yuna', 1, -0.2, 4.5, 1.75), actor('rikku', 1, 1.2, 5, 1.75)];
      party[lean]!.position.z += 0.9; // the member whose menu it is steps toward the camera
      party[lean]!.scale.setScalar(1.12);
      return { party, boss: actor('ffx2-bahamut', -1, 2, 0, 5), cam: new Vector3(0, 2 + lean * 0.4, 9.3 + lean * 0.2) };
    });

  it('control: without a lock the same three states size the same boss three ways (the jump the 39.1 build showed)', () => {
    const ks = states().map(({ party, boss, cam }) => {
      const st = new Staging();
      st.planScale([...party, boss], cam, scaleTarget, 1);
      return st.plan.get(boss)?.k ?? 1;
    });
    expect(Math.max(...ks) - Math.min(...ks)).toBeGreaterThan(0.03);
  });

  it('with the lock the first state sets, every state plays the same factor, whatever the step, the camera or the lean', () => {
    const [first, ...rest] = states();
    const st = new Staging();
    st.planScale([...first!.party, first!.boss], first!.cam, scaleTarget, 1);
    const lock = lockOf('phase', 1, st.plan, [...first!.party, first!.boss]);
    const k0 = st.plan.get(first!.boss)!.k;
    expect(lock.k.get('ffx2-bahamut')).toBe(k0);
    for (const { party, boss, cam } of rest) {
      for (const frac of [1, 0.45, 0]) {
        const next = new Staging();
        next.planScale([...party, boss], cam, scaleTarget, frac, { locked: lock.k });
        expect(next.plan.get(boss)!.k).toBe(k0);
      }
    }
  });

  it('a boss locked at the drawn scale stays at it (no growth later), and a boss the lock does not name is sized as ever', () => {
    const party = [actor('tidus', 1, -1.1, 5, 1.75)];
    const boss = actor('ffx2-bahamut', -1, 2, 0, 5);
    const other = actor('evrae', -1, 3, -3, 5); // another sized colossus (Natus's entry is retired: r3942-giants-ffx)
    const st = new Staging();
    st.planScale([...party, boss, other], new Vector3(0, 2, 9.3), scaleTarget, 1, { locked: new Map([['ffx2-bahamut', 1]]) });
    expect(st.plan.has(boss)).toBe(false);
    expect(st.plan.get(other)!.k).toBeCloseTo(2.21, 2); // measured: Evrae's 2.4 target on a 5-unit figure at this stage
  });

  it('stepsFor: a held boss takes one step; a phase with a lock plays the step it has (none after today\'s rig); otherwise every step, as ever', () => {
    const yoj = [actor('tidus', 1, 0, 5, 1.75), actor('yojimbo', -1, 2, -2, 2.55), actor('daigoro', -1, 1, -2, 0.7)];
    const bah = [actor('paine', 1, 0, 5, 1.75), actor('ffx2-bahamut', -1, 2, 0, 5)];
    const lock = (frac: number | null): ScaleLock => ({ key: 'k', frac, k: new Map([['ffx2-bahamut', 1.4]]) });
    expect(stepsFor(null, yoj)).toEqual([1]);
    expect(stepsFor(lock(0.45), yoj)).toEqual([1]);
    expect(stepsFor(null, bah)).toEqual([...FRACS]);
    expect(stepsFor(lock(null), bah)).toEqual([...FRACS]); // only the held bosses are sized so far
    expect(stepsFor(lock(1), bah)).toEqual([1]);
    expect(stepsFor(lock(0.45), bah)).toEqual([0.45]);
    expect(stepsFor(lock(0), bah)).toEqual([0]);
    expect(stepsFor(lock(-1), bah)).toEqual([]); // today's rig won the first plan: the drawn scale all phase
    expect(stepsFor(null, [actor('tidus', 1, 0, 5, 1.75), actor('vegnagun-tail', -1, 0, 0, 8)])).toEqual([...FRACS]); // nothing sized: the search as ever
  });

  it("stepOf: a later plan that falls back to today's rig leaves the phase's step standing, so the colossus master is tried again at the size the phase plays", () => {
    const lock = (frac: number | null): ScaleLock => ({ key: 'k', frac, k: new Map() });
    expect(stepOf(null, 0.45)).toBe(0.45); // the first plan: whatever it chose
    expect(stepOf(null, -1)).toBe(-1); // the first plan chose today's rig: that is the phase's size
    expect(stepOf(lock(1), -1)).toBe(1);
    expect(stepOf(lock(0.25), -1)).toBe(0.25);
    expect(stepOf(lock(1), 0.7)).toBe(0.7); // a colossus candidate under the lock can only be the locked step; any other is the pin's own
    expect(stepOf(lock(-1), -1)).toBe(-1);
    expect(stepOf(lock(null), -1)).toBe(-1); // only the held bosses were sized so far
  });

  it("phaseLayout: the layout, TEXT SIZE and whether the table pins the master make up a phase's layout (a size set under a pin is not one an unpinned plan may keep)", () => {
    const stubText = (v: string | undefined): void => {
      vi.stubGlobal('document', { documentElement: { dataset: v === undefined ? {} : { textSize: v } } });
    };
    stubText(undefined);
    const plain = phaseLayout('ffx|false|1600x900', false);
    expect(phaseLayout('ffx|false|1600x900', true)).not.toBe(plain); // Natus's pin, then a plan the pin does not play
    expect(phaseLayout('ffx|false|2560x1440', false)).not.toBe(plain); // a resized window
    stubText('100');
    expect(phaseLayout('ffx|false|1600x900', false)).toBe(plain); // the default size is the same as none
    stubText('115');
    expect(phaseLayout('ffx|false|1600x900', false)).not.toBe(plain); // a card that grows leaves the table's place
    stubText('130');
    expect(phaseLayout('ffx|false|1600x900', false)).not.toBe(phaseLayout('ffx|false|1600x900', true));
  });

  it('the phase key follows the sized bosses, today\'s resting rig and the layout, and is null with nothing sized', () => {
    const yoj = [actor('tidus', 1, 0, 5, 1.75), actor('yojimbo', -1, 2, -2, 2.55)];
    const a = scaleKey(yoj, IDLE, 'ffx|false|1600x900');
    expect(a).not.toBeNull();
    expect(scaleKey(yoj, IDLE, 'ffx|false|1600x900')).toBe(a);
    expect(scaleKey(yoj, IDLE, 'ffx|false|2560x1440')).not.toBe(a); // a resized window
    expect(scaleKey(yoj, { ...IDLE, pos: new Vector3(0, 5.1, 14) }, 'ffx|false|1600x900')).not.toBe(a); // the scene re-registered its rig (Evrae's range)
    expect(scaleKey([...yoj, actor('evrae', -1, 3, -3, 5)], IDLE, 'ffx|false|1600x900')).not.toBe(a); // another sized boss arrived
    expect(scaleKey([...yoj, actor('seymour-natus', -1, 3, -3, 5)], IDLE, 'ffx|false|1600x900')).toBe(a); // Natus is not sized any more (r3942-giants-ffx): his arrival is no new phase
    expect(scaleKey([...yoj, actor('daigoro', -1, 3, -3, 0.7)], IDLE, 'ffx|false|1600x900')).toBe(a); // an unsized fiend does not make a new phase
    expect(scaleKey([actor('tidus', 1, 0, 5, 1.75), actor('vegnagun-tail', -1, 0, 0, 8)], IDLE, 'x')).toBeNull();
    expect(scaleKey([actor('tidus', 1, 0, 5, 1.75)], IDLE, 'x')).toBeNull();
  });

  it('lockOf keeps each sized boss\'s factor (1 for one the plan left at its drawn scale), and only the held ones when asked', () => {
    const party = actor('tidus', 1, 0, 5, 1.75);
    const yoj = actor('yojimbo', -1, 2, -2, 2.55);
    const bah = actor('ffx2-bahamut', -1, 3, -1, 5);
    const dai = actor('daigoro', -1, 1, -2, 0.7);
    const plan = new Map([[yoj, { k: 1.16 }], [dai, { k: 3 }]]);
    const all = lockOf('p', 0.25, plan, [party, yoj, bah, dai]);
    expect([...all.k]).toEqual([['yojimbo', 1.16], ['ffx2-bahamut', 1]]);
    expect(all.frac).toBe(0.25);
    const held = lockOf('p', null, plan, [party, yoj, bah, dai], scaleHeld);
    expect([...held.k]).toEqual([['yojimbo', 1.16]]);
    expect(held.frac).toBeNull();
  });

  it('sizingOf: the held, locked and shown options on the desktop, none on the upright phone (it keeps today\'s rig and its own fit)', () => {
    const lock: ScaleLock = { key: 'p', frac: 1, k: new Map([['yojimbo', 1.16]]) };
    const d = sizingOf(lock, IDLE, { width: 1600, height: 900 }, false);
    expect(d.held).toBe(scaleHeld);
    expect(d.locked).toBe(lock.k);
    expect(d.view?.W).toBe(1600);
    expect(sizingOf(null, IDLE, { width: 1600, height: 900 }, false).locked).toBeNull();
    expect(sizingOf(lock, IDLE, { width: 390, height: 844 }, true)).toEqual({});
  });
});

describe('holdEarly: a held boss takes its size before the first plan lands', () => {
  const rect = { width: 1600, height: 900 };

  it('does nothing until the figures stand still, nothing for a fight with no held boss, and nothing for a fight with no sized boss', () => {
    const s = cavern();
    const staging = new Staging();
    expect(holdEarly(staging, s.actors, IDLE, rect, 'L', null, false)).toBeNull();
    expect(s.yojimbo.scale.y).toBe(1);
    const evrae = [...s.party, actor('evrae', -1, 2.75, -2, 2.55)];
    expect(holdEarly(staging, evrae, IDLE, rect, 'L', null, true)).toBeNull(); // sized, not held: the plan decides
    expect(evrae[3]!.scale.y).toBe(1);
    const other = [...s.party, actor('mortibody', -1, 2.75, -2, 2.55)];
    expect(holdEarly(staging, other, IDLE, rect, 'L', null, true)).toBeNull();
    expect(other[3]!.scale.y).toBe(1);
  });

  it('sizes him at the first calm frame, keeps him there every frame, and hands the first plan a lock to play (no pop when the plan lands)', () => {
    const s = cavern();
    const staging = new Staging();
    const lock = holdEarly(staging, s.actors, IDLE, rect, 'L', null, true)!;
    expect(lock.frac).toBeNull();
    const k = lock.k.get('yojimbo')!;
    expect(k).toBeGreaterThan(1.1);
    expect(s.yojimbo.scale.y).toBeCloseTo(k, 9);
    expect(screenRatio(s.actors, IDLE, 1600, 900, s.yojimbo)).toBeCloseTo(1.15, 2);
    // later frames: the lock is the one given, not asked again (the figures are sized now: a second reading would read the grown boss and still agree)
    for (let i = 0; i < 5; i++) expect(holdEarly(staging, s.actors, IDLE, rect, 'L', lock, false)).toBe(lock);
    expect(s.yojimbo.scale.y).toBeCloseTo(k, 9);
    // the stage re-scales him (an arrival's own tween): the share goes on top of it again
    s.yojimbo.scale.setScalar(0.5);
    holdEarly(staging, s.actors, IDLE, rect, 'L', lock, false);
    expect(s.yojimbo.scale.y).toBeCloseTo(0.5 * k, 9);
    // the first plan plays the same factor as it stands
    const plan = new Staging();
    plan.planScale([...s.party, s.yojimbo], IDLE.pos, scaleTarget, 1, { held: scaleHeld, locked: lock.k });
    expect(plan.plan.get(s.yojimbo)!.k).toBe(k);
  });

  it('forgets a lock that belongs to another phase (the scene moved its rig, the window changed) and reads the figures again', () => {
    const s = cavern();
    const staging = new Staging();
    const first = holdEarly(staging, s.actors, IDLE, rect, 'L', null, true)!;
    const moved: Pose = { ...IDLE, pos: new Vector3(0, 5.1, 14.5) };
    const next = holdEarly(staging, s.actors, moved, rect, 'L', first, true)!;
    expect(next.key).not.toBe(first.key);
  });
});
