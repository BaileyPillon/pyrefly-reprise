/**
 * **Bahamut's subject config stays self-consistent** (the rig program, rig-aeons-2 lane, 2026-10-19; FFX ONLY: Bahamut is an FFX aeon, `characters/bahamut/*`, one costume across idle, attack, cast, hurt and KO;
 * it is the possessed Bahamut of Chapter III and the summon of nine more chapters). No art is read: only `tools/rig/subjects/bahamut.json`, its hook file, its keys and the lane registry. What the gate demands of
 * the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something that fails only after a fit: every painted pose is
 * marked, every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent first, and nothing in a key can scale a head, a body or a tail
 * (the whole point of the rig: hurt and KO keep the idle's size).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
const cfg = JSON.parse(readFileSync('tools/rig/subjects/bahamut.json', 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; polys: Record<string, Pt[]>; ops: { op: string; back?: string; front?: string; part?: string; px?: number; zone?: { poly?: string } }[] };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[] }>; landmarks: Record<string, [string, Pt]> };
  fit: { mirror?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; init?: Record<string, number>; scales?: Record<string, [number, number]> }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> } };
};
const registry = JSON.parse(readFileSync('tools/rig/lane/lane-subjects.json', 'utf8')) as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: unknown; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Bahamut in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];
/** Bones a key may never scale: the head and the spine (the size jump the rig removes), the arm and the tail. Wings and the leg may stretch (the attack painting is drawn nearer the camera than the idle). */
const NEVER_SCALED = /^(head|chest|pelvis|armL\d|tail\d)$/;

describe('the Bahamut subject config', () => {
  it('names the subject, its costume (the idle) and the hook file', () => {
    expect(cfg.subject).toBe('bahamut');
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

  it('draws the head in front of all, the body in front of the wings, leg, arm and tail, the wings behind the arm and the tail behind the wings (so a bent joint hides under the body)', () => {
    const o = cfg.cut.order;
    expect(o).toEqual(['tail', 'wingL', 'wingR', 'leg', 'armL', 'body', 'head']);
    // every part that is behind another and can move away from it gains the front part's pixels under the seam
    const under = new Set(cfg.cut.ops.filter((x) => x.op === 'skirt').map((x) => `${x.back}<${x.front}`));
    for (const pair of ['body<head', 'wingL<body', 'wingL<armL', 'wingL<head', 'wingR<body', 'wingR<head', 'tail<body', 'leg<body', 'armL<body']) expect(under.has(pair), `${pair} underlap`).toBe(true);
  });

  it('carries the tail on behind the leg, the far wing and the big wing\'s struts (the tail is one thing: where a front part hides it, it is extended with its own colours)', () => {
    const ext = cfg.cut.ops.filter((x) => x.op === 'extend' && x.part === 'tail').map((x) => x.zone?.poly);
    expect(ext.sort()).toEqual(['tailA_zone', 'tailB_zone', 'tailC_zone', 'tailD_zone']);
    for (const z of ext) expect(cfg.cut.polys[z as string]?.length, `${z} is a polygon`).toBeGreaterThanOrEqual(4);
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

  it('has a spine chain (pelvis, chest), a rigid head, a leg of three bones, an arm of three, two wings of three and a tail of ten, each its own chain', () => {
    for (const [part, bones] of Object.entries({
      body: ['pelvis', 'chest'], leg: ['thighN', 'shinN', 'footN'], armL: ['armL0', 'armL1', 'armL2'], wingL: ['wingLA', 'wingLB', 'wingLC'], wingR: ['wingRA', 'wingRB', 'wingRC'],
      tail: ['tail0', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6', 'tail7', 'tail8', 'tail9'],
    })) expect(cfg.build.skin[part]?.bones, part).toEqual(bones);
    expect(cfg.build.skin.head).toMatchObject({ type: 'rigid', bone: 'head' });
  });

  it('never scales a head, the spine, an arm or a tail in a key: the fit may scale the leg, and the wings in the attack key only (a size that follows the painting is the jump the rig removes)', () => {
    const scales = cfg.fit.scales ?? {};
    expect(Object.keys(scales).sort()).toEqual(['shinN', 'thighN', 'wingLA', 'wingRA']);
    // the leg may stretch within 0.9 to 1.15; a wing is fixed at 1 unless a key names a range
    for (const n of ['thighN', 'shinN']) {
      expect(scales[n]![0]).toBeGreaterThanOrEqual(0.9);
      expect(scales[n]![1]).toBeLessThanOrEqual(1.15);
    }
    for (const n of ['wingLA', 'wingRA']) expect(scales[n]).toEqual([1, 1]);
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) {
      for (const [n, [lo, hi]] of Object.entries(k.scales ?? {})) {
        expect(pose, `${n} is scaled only in the attack key`).toBe('attack');
        expect(lo).toBeGreaterThanOrEqual(0.9);
        expect(hi).toBeLessThanOrEqual(1.25);
      }
      for (const name of Object.keys(k.init ?? {})) expect(/^(head|chest|pelvis|armL\d|tail\d)\.s$/.test(name), `${pose}: ${name} would scale a head, spine, arm or tail`).toBe(false);
    }
  });

  it('has a head landmark, a foot landmark, a loop landmark (the lowest thick part of the silhouette is the tail\'s loop, which the gate reads as the stance) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head?.[0]).toBe('head');
    expect(lm.toeN?.[0]).toBe('footN');
    expect(lm.soleLoop?.[0]).toBe('tail4');
    expect(lm.handL?.[0]).toBe('armL2');
    expect(lm.wingLTip?.[0]).toBe('wingLC');
    expect(lm.wingRTip?.[0]).toBe('wingRA');
    expect(lm.tailTip?.[0]).toBe('tail9');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) {
      for (const [name, pt] of Object.entries(marks)) {
        expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
        expect(Array.isArray(pt) && pt.length === 2 && (pt as number[]).every(Number.isFinite), `${pose}.${name} is [x, y]`).toBe(true);
      }
    }
  });

  it('marks every painted pose (the gate refuses a painted key with no landmarks): the head, a foot and both wings at least, and the loop of every standing pose', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      for (const name of ['head', 'toeN']) expect(marks![name], `${pose} marks ${name}`).toBeTruthy();
    }
    for (const pose of ['attack', 'cast', 'hurt']) for (const name of ['wingLTip', 'wingRTip', 'handL', 'tailTip', 'soleLoop']) expect(cfg.landmarks[pose]![name], `${pose} marks ${name}`).toBeTruthy();
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns nothing (every painting faces the idle\'s way, left) and authors only painted poses', () => {
    expect(cfg.fit.mirror ?? []).toEqual([]);
    for (const pose of cfg.authored ?? []) expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
    expect(cfg.authored).toEqual(['ko', 'overdrive']);
  });

  it('lets the KO and the Overdrive leave the floor (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko' || pose === 'overdrive');
  });

  it('is in the lane registry as the possessed Bahamut of Chapter III (a listed chapter, reached by fighting the earlier links)', () => {
    const r = registry.subjects.bahamut;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('possessed-bahamut');
    expect(r!.game).toBe('ffx');
    expect(r!.chapter).toEqual({ id: 'braskas-final-aeon' });
    expect(r!.reach).toEqual({ auto: true });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip, r!.track.hand]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Bahamut keys (tools/rig/subjects/bahamut.keys.json: the keys the gated rig was exported from)', () => {
  const keys = JSON.parse(readFileSync('tools/rig/subjects/bahamut.keys.json', 'utf8')) as Record<string, { bones: Record<string, { rot?: number; sx?: number; sy?: number }>; source: string; planted?: boolean }>;

  it('has a key for every painted pose, the KO and the Overdrive authored and the other three read from their paintings', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['attack', 'cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/bahamut/${pose}`);
    expect(keys.ko!.planted).toBe(false);
    expect(keys.overdrive!.planted).toBe(false);
  });

  it('never scales the head, the spine, the arm or the tail in any key, and a wing only in the attack key: the creature keeps the idle\'s size in hurt and KO (the leg may stretch, within 0.9 to 1.15)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        if (NEVER_SCALED.test(bone)) expect(t.sx === undefined && t.sy === undefined, `${pose}.${bone} is not scaled`).toBe(true);
        else if (/^wing[LR]\d?[ABC]$/.test(bone)) {
          if (t.sx !== undefined) {
            expect(pose, `${bone} is scaled only in the attack key`).toBe('attack');
            expect(t.sx).toBeGreaterThanOrEqual(0.9);
            expect(t.sx).toBeLessThanOrEqual(1.25);
          }
        } else if (t.sx !== undefined) {
          expect(t.sx, `${pose}.${bone}`).toBeGreaterThanOrEqual(0.9);
          expect(t.sx, `${pose}.${bone}`).toBeLessThanOrEqual(1.15);
        }
      }
    }
  });
});
