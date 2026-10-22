/**
 * **Spathi's subject config stays self-consistent** (the rig program, rig-aeons-2 lane, 2026-10-19; FFX ONLY: Spathi is Isaaru's Bahamut in Chapter XIV link 3, `characters/spathi/*`, the silhouette twin of
 * Bahamut: the same cut, bones, marks and keys moved by the registration of its canvases onto Bahamut's, `lane.py twin`). No art is read: only `tools/rig/subjects/spathi.json`, Bahamut's, the keys and the lane
 * registry. What the gate demands of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the twin cannot drift from its base by accident:
 * every coordinate of the cut moved by the registration (Pterya's canvases sat 60 px off Valefor's and a blind copy tore every part), the one thing it does differently on purpose is named (its underlaps leave the
 * sea-green glow alone), and nothing in a key can scale a head, the spine, an arm or a tail.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
type Cfg = {
  subject: string; scale: number; costume: { pose: string }; hooks?: string; _twin_of?: string; _twin_shift?: Record<string, [number, number, number]>;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; polys: Record<string, Pt[]>; ops: { op: string; back?: string; front?: string; px?: number; zone?: unknown }[] };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: Pt[] }>; landmarks: Record<string, [string, Pt]> };
  fit: { mirror?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]> };
  landmarks: Record<string, Record<string, Pt>>;
  authored?: string[];
};
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const cfg = read('tools/rig/subjects/spathi.json') as Cfg;
const base = read('tools/rig/subjects/bahamut.json') as Cfg;
const registry = read('tools/rig/lane/lane-subjects.json') as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: unknown; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Spathi in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];
const mv = ([x, y]: Pt): Pt => [x + 60, y + 60];
/** Spathi's paintings carry a sea-green glow (alpha 0.1 to 0.5 round the whole figure). A skirt copies the front part's pixels under the back part, and the glow's pixels were copied with them: drawn once a part,
 * the glow stacked three deep at the jaw gap (alpha over 0.5 where the painting has 0.3), which showed as bright blobs in the game and made the gate's joint disc at the wing root reach a one-pixel seam of it
 * (5 to 9 transparent pixels in hurt and three blends). So every skirt of the twin takes only the pixels that are not that glow: teal, green over red, green over blue. */
const GLOW = { colour: { r_minus_g_lt: -0.2, g_minus_b_gt: 0.0, val_gt: 0.4 } };

describe('the Spathi subject config (a registered twin of Bahamut)', () => {
  it('names the subject, its costume (the idle), the twin\'s base and the hook file', () => {
    expect(cfg.subject).toBe('spathi');
    expect(cfg._twin_of).toBe('bahamut');
    expect(cfg.costume.pose).toBe('idle');
    expect(cfg.scale).toBe(2);
    expect(cfg.hooks).toBeTruthy();
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
  });

  it('is registered: its canvases sit 60 px from Bahamut\'s in every pose, and the cut, the bones, the skins and the landmarks were all moved by that ', () => {
    for (const pose of ['idle', ...PAINTED]) {
      const s = cfg._twin_shift?.[pose];
      expect(s, `${pose} has a registration`).toBeTruthy();
      expect([s![0], s![1]], pose).toEqual([60, 60]);
      expect(s![2], `${pose} silhouettes agree`).toBeGreaterThan(0.99);
    }
    for (const [name, pts] of Object.entries(base.cut.polys)) expect(cfg.cut.polys[name], name).toEqual(pts.map(mv));
    const bones = Object.fromEntries(cfg.build.bones.map((b) => [b[0], b[2]]));
    for (const [name, , pos] of base.build.bones) expect(bones[name], name).toEqual(mv(pos));
    for (const [part, s] of Object.entries(base.build.skin)) {
      if (!s.joints) continue;
      expect(cfg.build.skin[part]!.joints, `${part} joints`).toEqual(s.joints.map(mv));
    }
    for (const [name, [bone, pt]] of Object.entries(base.build.landmarks)) expect(cfg.build.landmarks[name], name).toEqual([bone, mv(pt)]);
    for (const [pose, marks] of Object.entries(base.landmarks)) for (const [name, pt] of Object.entries(marks)) expect(cfg.landmarks[pose]![name], `${pose}.${name}`).toEqual(mv(pt as Pt));
  });

  it('keeps Bahamut\'s draw order, underlaps, tail extensions, bones and limits (the same creature)', () => {
    expect(cfg.cut.order).toEqual(base.cut.order);
    expect(cfg.cut.priority).toEqual(base.cut.priority);
    // the same underlaps and tail extensions, but every skirt leaves the glow alone
    expect(cfg.cut.ops).toEqual(base.cut.ops.map((o) => (o.op === 'skirt' ? { ...o, zone: { not: GLOW } } : o)));
    expect(cfg.build.bones.map((b) => [b[0], b[1]])).toEqual(base.build.bones.map((b) => [b[0], b[1]]));
    expect(cfg.fit.limits).toEqual(base.fit.limits);
    expect(cfg.fit.scales).toEqual(base.fit.scales);
    expect(cfg.authored).toEqual(['ko', 'overdrive']);
  });

  it('has a skin for every part and a head landmark, a foot, the loop and the landmarks the marks name', () => {
    for (const part of cfg.cut.order) expect(cfg.build.skin[part], `${part} has a skin`).toBeTruthy();
    const lm = cfg.build.landmarks;
    expect(lm.head?.[0]).toBe('head');
    expect(lm.toeN?.[0]).toBe('footN');
    expect(lm.soleLoop?.[0]).toBe('tail4');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) for (const name of Object.keys(marks)) expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
    for (const pose of PAINTED) expect(cfg.landmarks[pose], `${pose} has marks`).toBeTruthy();
  });

  it('is in the lane registry as Isaaru\'s third link in Chapter XIV (a listed chapter, reached by fighting links 1 and 2)', () => {
    const r = registry.subjects.spathi;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('spathi');
    expect(r!.game).toBe('ffx');
    expect(r!.chapter).toEqual({ id: 'isaaru-via-purifico' });
    expect(r!.reach).toEqual({ auto: true });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip, r!.track.hand]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Spathi keys (tools/rig/subjects/spathi.keys.json: Bahamut\'s keys, claims dropped, sources renamed)', () => {
  const keys = read('tools/rig/subjects/spathi.keys.json') as Record<string, { bones: Record<string, { rot?: number; dx?: number; dy?: number; sx?: number; sy?: number }>; source: string; planted?: boolean; fit?: unknown }>;
  const bahamut = read('tools/rig/subjects/bahamut.keys.json') as typeof keys;

  it('has a key for every painted pose, read from Spathi\'s own paintings, with every bone transform Bahamut\'s and no recorded claim', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['attack', 'cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/spathi/${pose}`);
    for (const pose of PAINTED) {
      expect(keys[pose]!.bones, pose).toEqual(bahamut[pose]!.bones);
      expect(keys[pose]!.fit, `${pose} carries no claim`).toBeUndefined();
    }
    expect(keys.ko!.planted).toBe(false);
    expect(keys.overdrive!.planted).toBe(false);
  });

  it('never scales the head, the spine, the arm or the tail in any key, and a wing only in the attack key (the leg may stretch, within 0.9 to 1.15)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        if (/^(head|chest|pelvis|armL\d|tail\d)$/.test(bone)) expect(t.sx === undefined && t.sy === undefined, `${pose}.${bone} is not scaled`).toBe(true);
        else if (/^wing[LR][ABC]$/.test(bone)) {
          if (t.sx !== undefined) expect(pose, `${bone} is scaled only in the attack key`).toBe('attack');
        } else if (t.sx !== undefined) {
          expect(t.sx, `${pose}.${bone}`).toBeGreaterThanOrEqual(0.9);
          expect(t.sx, `${pose}.${bone}`).toBeLessThanOrEqual(1.15);
        }
      }
    }
  });
});
