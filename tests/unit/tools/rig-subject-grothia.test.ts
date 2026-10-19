/**
 * **Grothia's subject config stays self-consistent** (the rig program, rig-aeons-2 lane, 2026-10-19; FFX ONLY: Grothia is Isaaru's Ifrit in Chapter XIV link 1, `characters/grothia/*`, the silhouette twin of
 * Ifrit: the same cut, bones, marks and keys moved by the registration of its canvases onto Ifrit's, `lane.py twin`). No art is read: only `tools/rig/subjects/grothia.json`, Ifrit's, the keys and the lane
 * registry. What the gate demands of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the twin cannot drift from its base by accident:
 * every coordinate of the cut moved by the registration (Pterya's canvases sat 60 px off Valefor's and a blind copy tore every part), and nothing in a key can scale a head, a body, an arm or a tail.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
type Cfg = {
  subject: string; scale: number; costume: { pose: string }; hooks?: string; _twin_of?: string; _twin_shift?: Record<string, [number, number, number]>;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; polys: Record<string, Pt[]>; ops: { op: string; back?: string; front?: string; px?: number }[] };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: Pt[] }>; landmarks: Record<string, [string, Pt]> };
  fit: { mirror?: string[]; offsets?: string[]; offset_limit?: Record<string, [number, number]>; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; init?: Record<string, number> }> };
  landmarks: Record<string, Record<string, Pt>>;
  authored?: string[];
};
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const cfg = read('tools/rig/subjects/grothia.json') as Cfg;
const base = read('tools/rig/subjects/ifrit.json') as Cfg;
const registry = read('tools/rig/lane/lane-subjects.json') as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: unknown; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Grothia in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];

describe('the Grothia subject config (a registered twin of Ifrit)', () => {
  it('names the subject, its costume (the idle), the twin\'s base and the hook file', () => {
    expect(cfg.subject).toBe('grothia');
    expect(cfg._twin_of).toBe('ifrit');
    expect(cfg.costume.pose).toBe('idle');
    expect(cfg.scale).toBe(2);
    expect(cfg.hooks).toBeTruthy();
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
  });

  it('is registered: its canvases sit 60 px from Ifrit\'s in every pose, and the cut, the bones, the skins and the landmarks were all moved by that', () => {
    for (const pose of ['idle', ...PAINTED]) {
      const s = cfg._twin_shift?.[pose];
      expect(s, `${pose} has a registration`).toBeTruthy();
      expect([s![0], s![1]], pose).toEqual([60, 60]);
      expect(s![2], `${pose} silhouettes agree`).toBeGreaterThan(0.99);
    }
    const mv = ([x, y]: Pt): Pt => [x + 60, y + 60];
    for (const [name, pts] of Object.entries(base.cut.polys)) expect(cfg.cut.polys[name], name).toEqual(pts.map(mv));
    const bones = Object.fromEntries(cfg.build.bones.map((b) => [b[0], b[2]]));
    for (const [name, , pos] of base.build.bones) expect(bones[name], name).toEqual(mv(pos));
    for (const [part, s] of Object.entries(base.build.skin)) if (s.joints) expect(cfg.build.skin[part]!.joints, `${part} joints`).toEqual(s.joints.map(mv));
    for (const [name, [bone, pt]] of Object.entries(base.build.landmarks)) expect(cfg.build.landmarks[name], name).toEqual([bone, mv(pt)]);
    for (const [pose, marks] of Object.entries(base.landmarks)) for (const [name, pt] of Object.entries(marks)) expect(cfg.landmarks[pose]![name], `${pose}.${name}`).toEqual(mv(pt as Pt));
  });

  it('keeps Ifrit\'s draw order, underlaps, bones and limits (the same creature)', () => {
    expect(cfg.cut.order).toEqual(base.cut.order);
    expect(cfg.cut.priority).toEqual(base.cut.priority);
    expect(cfg.cut.ops).toEqual(base.cut.ops);
    expect(cfg.build.bones.map((b) => [b[0], b[1]])).toEqual(base.build.bones.map((b) => [b[0], b[1]]));
    expect(cfg.fit.limits).toEqual(base.fit.limits);
    expect(cfg.fit.scales).toEqual(base.fit.scales);
    expect(cfg.authored).toEqual(['ko', 'overdrive']);
    // a head may move at most as far as the 60 px skirt of head pixels under the body covers
    expect(cfg.fit.offset_limit?.head).toEqual([0.06, 0.06]);
    expect(cfg.cut.ops.find((x) => x.op === 'skirt' && x.back === 'body' && x.front === 'head')?.px).toBe(60);
  });

  it('has a skin for every part and a head landmark, both feet and the landmarks the marks name', () => {
    for (const part of cfg.cut.order) expect(cfg.build.skin[part], `${part} has a skin`).toBeTruthy();
    const lm = cfg.build.landmarks;
    expect(lm.head?.[0]).toBe('head');
    expect(lm.toeN?.[0]).toBe('footN');
    expect(lm.toeF?.[0]).toBe('footF');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) for (const name of Object.keys(marks)) expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
    for (const pose of PAINTED) expect(cfg.landmarks[pose], `${pose} has marks`).toBeTruthy();
  });

  it('is in the lane registry as Isaaru\'s first link in Chapter XIV (a listed chapter, on the field at the first menu: no reach)', () => {
    const r = registry.subjects.grothia;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('grothia');
    expect(r!.game).toBe('ffx');
    expect(r!.chapter).toEqual({ id: 'isaaru-via-purifico' });
    expect(r!.reach).toBeUndefined();
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip, r!.track.hand]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Grothia keys (tools/rig/subjects/grothia.keys.json: Ifrit\'s keys, claims dropped, sources renamed)', () => {
  const keys = read('tools/rig/subjects/grothia.keys.json') as Record<string, { bones: Record<string, { rot?: number; dx?: number; dy?: number; sx?: number; sy?: number }>; source: string; planted?: boolean; fit?: unknown }>;
  const ifrit = read('tools/rig/subjects/ifrit.keys.json') as typeof keys;

  it('has a key for every painted pose, read from Grothia\'s own paintings, with every bone transform Ifrit\'s and no recorded claim', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['attack', 'cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/grothia/${pose}`);
    for (const pose of PAINTED) {
      expect(keys[pose]!.bones, pose).toEqual(ifrit[pose]!.bones);
      expect(keys[pose]!.fit, `${pose} carries no claim`).toBeUndefined();
    }
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
