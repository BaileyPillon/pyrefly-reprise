/**
 * **Ifrit's subject config stays self-consistent** (the rig program, rig-aeons lane, 2026-10-19; FFX ONLY: Ifrit is an FFX aeon, `characters/ifrit/*`, one costume across idle, attack, cast, hurt and KO;
 * it is the possessed Ifrit of Chapter III link 3 and the summon of eleven more chapters). No art is read: only `tools/rig/subjects/ifrit.json`, its hook file, its keys and the lane registry. What the gate
 * demands of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something that fails only after a fit:
 * every painted pose is marked, every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent first, and nothing in a key can scale a head
 * (the whole point of the rig: hurt and KO keep the idle's size).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
const cfg = JSON.parse(readFileSync('tools/rig/subjects/ifrit.json', 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; ops: { op: string; back?: string; front?: string; px?: number }[] };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[] }>; landmarks: Record<string, [string, Pt]> };
  fit: { mirror?: string[]; offsets?: string[]; offset_limit?: Record<string, [number, number]>; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; init?: Record<string, number> }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> } };
};
const registry = JSON.parse(readFileSync('tools/rig/lane/lane-subjects.json', 'utf8')) as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: unknown; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Ifrit in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];

describe('the Ifrit subject config', () => {
  it('names the subject, its costume (the idle) and the hook file', () => {
    expect(cfg.subject).toBe('ifrit');
    expect(cfg.costume.pose).toBe('idle');
    expect(cfg.scale).toBe(2);
    expect(cfg.hooks).toBeTruthy();
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
  });

  it('has a skin for every part, and a draw order and a priority that name the same parts', () => {
    const order = cfg.cut.order;
    expect(new Set(order).size).toBe(order.length);
    expect(Object.keys(cfg.cut.parts).sort()).toEqual([...order].sort());
    expect([...cfg.cut.priority].sort()).toEqual([...order].sort());
    for (const part of order) expect(cfg.build.skin[part], `${part} has a skin`).toBeTruthy();
  });

  it('draws the head in front of all, the body in front of the legs and tails, the near leg in front of the far leg (so a bent joint hides under the body)', () => {
    const o = cfg.cut.order;
    expect(o).toEqual(['tailU', 'tailL', 'armF', 'legF', 'legN', 'body', 'head']);
    // every part that is behind another and can move away from it gains the front part's pixels under the seam
    const under = new Set(cfg.cut.ops.filter((x) => x.op === 'skirt').map((x) => `${x.back}<${x.front}`));
    for (const pair of ['body<head', 'tailL<body', 'tailU<tailL', 'tailU<body', 'armF<head', 'armF<body', 'armF<legF', 'legF<legN', 'legF<body', 'legN<body']) expect(under.has(pair), `${pair} underlap`).toBe(true);
  });

  it('lists every bone after its parent and every skin on bones that exist', () => {
    const seen = new Set<string>();
    for (const [name, parent] of cfg.build.bones) {
      if (parent !== null) expect(seen.has(parent), `${name}'s parent ${parent} comes first`).toBe(true);
      seen.add(name);
    }
    for (const [part, s] of Object.entries(cfg.build.skin)) {
      if (s.type === 'rigid') expect(seen.has(s.bone ?? ''), `${part} is rigid to ${s.bone}`).toBe(true);
      if (s.type === 'chain') {
        for (const b of s.bones ?? []) expect(seen.has(b), `${part} is skinned to ${b}`).toBe(true);
        expect(s.joints?.length, `${part} needs one more joint than bones`).toBe((s.bones?.length ?? 0) + 1);
      }
    }
    for (const name of [...(cfg.fit.offsets ?? []), ...Object.keys(cfg.fit.scales ?? {}), ...Object.keys(cfg.fit.limits ?? {})]) expect(seen.has(name), `fit names bone ${name}`).toBe(true);
    for (const name of Object.keys(cfg.motion?.idle?.bones ?? {})) expect(seen.has(name), `the idle sways bone ${name}`).toBe(true);
  });

  it('has a spine chain (pelvis, chest), a rigid head, a far arm, two legs of three bones and two tails of three, each its own chain', () => {
    for (const [part, bones] of Object.entries({
      body: ['pelvis', 'chest'], armF: ['armF0', 'armF1', 'armF2'], legN: ['thighN', 'shinN', 'footN'], legF: ['thighF', 'shinF', 'footF'],
      tailL: ['tailL0', 'tailL1', 'tailL2'], tailU: ['tailU0', 'tailU1', 'tailU2'],
    })) expect(cfg.build.skin[part]?.bones, part).toEqual(bones);
    expect(cfg.build.skin.head).toMatchObject({ type: 'rigid', bone: 'head' });
  });

  it('never scales a head or a body in a key: the fit may scale only the leg bones, and the head may only move a little (a size that follows the painting is the jump the rig removes)', () => {
    expect(Object.keys(cfg.fit.scales ?? {}).sort()).toEqual(['shinF', 'shinN', 'thighF', 'thighN']);
    for (const [, [lo, hi]] of Object.entries(cfg.fit.scales ?? {})) {
      expect(lo).toBeGreaterThanOrEqual(0.9);
      expect(hi).toBeLessThanOrEqual(1.15);
    }
    for (const k of Object.values(cfg.fit.keys ?? {})) for (const name of Object.keys(k.init ?? {})) expect(/^(head|chest|pelvis|arm[A-Z]\d|tail[LU]\d)\.s$/.test(name), `${name} would scale a head, body, arm or tail`).toBe(false);
    // the head may translate (the lunge) but only as far as the 60 px skirt of head pixels under the body can cover (a bigger one opened a hole at the neck in every blend)
    expect(cfg.fit.offset_limit?.head).toEqual([0.06, 0.06]);
    expect(cfg.cut.ops.find((x) => x.op === 'skirt' && x.back === 'body' && x.front === 'head')?.px).toBe(60);
  });

  it('has a head landmark (the eye), a foot landmark per foot (the planted-feet check) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head?.[0]).toBe('head');
    expect(lm.toeN?.[0]).toBe('footN');
    expect(lm.toeF?.[0]).toBe('footF');
    expect(lm.handF?.[0]).toBe('armF2');
    expect(lm.tailU?.[0]).toBe('tailU2');
    expect(lm.tailL?.[0]).toBe('tailL2');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) {
      for (const [name, pt] of Object.entries(marks)) {
        expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
        expect(Array.isArray(pt) && pt.length === 2 && (pt as number[]).every(Number.isFinite), `${pose}.${name} is [x, y]`).toBe(true);
      }
    }
  });

  it('marks every painted pose (the gate refuses a painted key with no landmarks): a foot, the far hand and the upper tail at least', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      for (const name of ['toeN', 'handF']) expect(marks![name], `${pose} marks ${name}`).toBeTruthy();
    }
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns nothing (every painting faces the idle\'s way, left) and authors only painted poses', () => {
    expect(cfg.fit.mirror ?? []).toEqual([]);
    for (const pose of cfg.authored ?? []) expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
  });

  it('lets the KO and the Overdrive leave the floor (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko' || pose === 'overdrive');
  });

  it('is in the lane registry as the possessed Ifrit of Chapter III link 3 (a listed chapter, reached by fighting links 1 and 2)', () => {
    const r = registry.subjects.ifrit;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('possessed-ifrit');
    expect(r!.game).toBe('ffx');
    expect(r!.chapter).toEqual({ id: 'braskas-final-aeon' });
    expect(r!.reach).toEqual({ auto: true });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip, r!.track.hand]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Ifrit keys (tools/rig/subjects/ifrit.keys.json: the keys the gated rig was exported from)', () => {
  const keys = JSON.parse(readFileSync('tools/rig/subjects/ifrit.keys.json', 'utf8')) as Record<string, { bones: Record<string, { rot?: number; sx?: number; sy?: number }>; source: string; planted?: boolean }>;

  it('has a key for every painted pose, the KO and the Overdrive authored and the other three read from their paintings', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['attack', 'cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/ifrit/${pose}`);
    expect(cfg.authored).toEqual(['ko', 'overdrive']);
    expect(keys.ko!.planted).toBe(false);
    expect(keys.overdrive!.planted).toBe(false);
  });

  it('never scales the head, the spine, an arm or a tail in any key: the creature keeps the idle\'s size in hurt and KO (only the legs may stretch, within 0.9 to 1.15)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        if (/^(head|chest|pelvis|arm[A-Z]\d|tail[LU]\d)$/.test(bone)) expect(t.sx === undefined && t.sy === undefined, `${pose}.${bone} is not scaled`).toBe(true);
        else if (t.sx !== undefined) {
          expect(t.sx, `${pose}.${bone}`).toBeGreaterThanOrEqual(0.9);
          expect(t.sx, `${pose}.${bone}`).toBeLessThanOrEqual(1.15);
        }
      }
    }
  });
});
