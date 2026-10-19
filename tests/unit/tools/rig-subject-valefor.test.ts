/**
 * **Valefor's subject config stays self-consistent** (the rig program, 2026-10-19; FFX ONLY: Valefor is an FFX aeon, `characters/valefor/*`; the same painting set is also the FFX-2 hidden chapter
 * "Valefor at Besaid"'s enemy, by sprite key, which is why the recorder's registry entry uses that chapter). No art is read: only `tools/rig/subjects/valefor.json`, its hook file and the lane
 * registry. What the gate demands of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something
 * that fails only after a fit: every painted pose is marked, every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent first, and
 * nothing in a key can scale a head (the whole point of the rig: hurt and KO keep the idle's size).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cfg = JSON.parse(readFileSync('tools/rig/subjects/valefor.json', 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; ops: { op: string; back?: string; front?: string }[] };
  build: { bones: [string, string | null, [number, number]][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[] }>; landmarks: Record<string, [string, [number, number]]> };
  fit: { mirror?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; init?: Record<string, number> }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> } };
};
const registry = JSON.parse(readFileSync('tools/rig/lane/lane-subjects.json', 'utf8')) as { subjects: Record<string, { actor: string; game: string; chapter: { door: string; id: string }; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Valefor in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];

describe('the Valefor subject config', () => {
  it('names the subject, its costume (the idle) and the hook file', () => {
    expect(cfg.subject).toBe('valefor');
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

  it('draws the body in front of the wing, plume, tail, legs and neck, and the head in front of all (so a bent joint hides under the body)', () => {
    const o = cfg.cut.order;
    for (const behind of ['tail', 'wing', 'plume', 'legF', 'legN', 'neck']) expect(o.indexOf(behind), `${behind} is behind the body`).toBeLessThan(o.indexOf('body'));
    expect(o.indexOf('head')).toBe(o.length - 1);
    expect(o.indexOf('legF'), 'the far leg is behind the near leg').toBeLessThan(o.indexOf('legN'));
    expect(o.indexOf('tail'), 'the tail is behind the plume that lies on it').toBeLessThan(o.indexOf('plume'));
    // every part that is behind another and can move away from it gains the front part's pixels under the seam
    const under = new Set(cfg.cut.ops.filter((x) => x.op === 'skirt').map((x) => `${x.back}<${x.front}`));
    for (const pair of ['neck<body', 'neck<head', 'wing<body', 'plume<body', 'tail<plume', 'tail<body', 'legN<body', 'legF<body', 'legF<legN']) expect(under.has(pair), `${pair} underlap`).toBe(true);
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

  it('has a spring-free wing (three bones), a long plume (three) and a curled tail (six), each its own chain', () => {
    for (const [part, bones] of Object.entries({
      wing: ['wingA', 'wingB', 'wingC'], plume: ['plume0', 'plume1', 'plume2'], tail: ['tail0', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5'],
      neck: ['neck0', 'neck1'], legN: ['thighN', 'shinN', 'footN'], legF: ['thighF', 'shinF', 'footF'],
    })) expect(cfg.build.skin[part]?.bones, part).toEqual(bones);
    expect(cfg.build.skin.head).toMatchObject({ type: 'rigid', bone: 'head' });
  });

  it('never scales a head or a wing in a key: the fit may scale only the legs (a size that follows the painting is the jump the rig removes)', () => {
    expect(Object.keys(cfg.fit.scales ?? {}).sort()).toEqual(['shinF', 'shinN', 'thighF', 'thighN']);
    for (const [, [lo, hi]] of Object.entries(cfg.fit.scales ?? {})) {
      expect(lo).toBeGreaterThanOrEqual(0.9);
      expect(hi).toBeLessThanOrEqual(1.15);
    }
    for (const k of Object.values(cfg.fit.keys ?? {})) for (const name of Object.keys(k.init ?? {})) expect(/^(head|neck\d|wing[ABC])\.s$/.test(name), `${name} would scale a head, neck or wing`).toBe(false);
  });

  it('has a head landmark, a foot landmark per foot (the planted-feet check) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head).toBeTruthy();
    expect(lm.toeN?.[0]).toBe('footN');
    expect(lm.toeF?.[0]).toBe('footF');
    expect(lm.wingTip?.[0]).toBe('wingC');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) {
      for (const [name, pt] of Object.entries(marks)) {
        expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
        expect(Array.isArray(pt) && pt.length === 2 && (pt as number[]).every(Number.isFinite), `${pose}.${name} is [x, y]`).toBe(true);
      }
    }
  });

  it('marks every painted pose (the gate refuses a painted key with no landmarks): the head, the beak, a foot and the wing tip at least', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      for (const name of ['head', 'beak', 'toeN', 'wingTip']) expect(marks![name], `${pose} marks ${name}`).toBeTruthy();
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

  it('is in the lane registry as the sprite `valefor`, recorded in the hidden chapter where it is the one enemy', () => {
    const r = registry.subjects.valefor;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('x2-valefor');
    expect(r!.chapter).toEqual({ door: 'valefor', id: 'ffx2-valefor-besaid' });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Valefor keys (tools/rig/subjects/valefor.keys.json: the keys the gated rig was exported from)', () => {
  const keys = JSON.parse(readFileSync('tools/rig/subjects/valefor.keys.json', 'utf8')) as Record<string, { bones: Record<string, { rot?: number; sx?: number; sy?: number }>; source: string; planted?: boolean }>;

  it('has a key for every painted pose, the KO and the Overdrive authored and the other three read from their paintings', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['attack', 'cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/valefor/${pose}`);
    expect(cfg.authored).toEqual(['ko', 'overdrive']);
    expect(keys.ko!.planted).toBe(false);
    expect(keys.overdrive!.planted).toBe(false);
  });

  it('never scales the head, the neck or the wing in any key: the creature keeps the idle\'s size in hurt and KO (only the legs may stretch, within 0.9 to 1.15)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        if (/^(head|neck\d|wing[ABC]|chest|pelvis|tail\d|plume\d)$/.test(bone)) expect(t.sx === undefined && t.sy === undefined, `${pose}.${bone} is not scaled`).toBe(true);
        else if (t.sx !== undefined) {
          expect(t.sx, `${pose}.${bone}`).toBeGreaterThanOrEqual(0.9);
          expect(t.sx, `${pose}.${bone}`).toBeLessThanOrEqual(1.15);
        }
      }
    }
  });
});
