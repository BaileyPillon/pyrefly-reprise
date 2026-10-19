/**
 * **Lulu's subject config stays self-consistent** (the rig program, 2026-10-18; FFX only: Lulu is an FFX figure, `characters/lulu/*`). No art is read: only
 * `tools/rig/subjects/lulu.json` and its hook file. What the gate will demand of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what
 * this proves is that the config cannot drift into something that would only fail after a six-minute fit: every painted pose is marked, every mark names a landmark the build makes,
 * every part has a skin and a place in the draw order, every bone has its parent before it, and the lists of authored and turned poses name painted poses.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SUBJECT_PATH = 'tools/rig/subjects/lulu.json';
const cfg = JSON.parse(readFileSync(SUBJECT_PATH, 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown> };
  build: { bones: [string, string | null, [number, number]][]; chains?: Record<string, { part: string; parent: string; n: number }>; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[]; chain?: string; name?: string }>; landmarks: Record<string, [string, [number, number]]> };
  fit: { mirror?: string[]; fixed?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> }; chains?: { bones: string[]; follow: string }[] };
};

/** The poses the game paints Lulu in (`public/art/characters/lulu/*.png`, FFX: chapters 1 to 3 and the hidden chapters that field her). */
const FRONT_POSES = ['defend', 'od-fury'];
const PAINTED = ['attack', 'cast', 'critical', 'defend', 'follow', 'hurt', 'item', 'ko', 'od-fury', 'ready', 'sleep', 'victory'];

describe('the Lulu subject config', () => {
  it('names the subject, its costume (her idle) and the hook file', () => {
    expect(cfg.subject).toBe('lulu');
    expect(cfg.costume.pose).toBe('idle');
    expect(cfg.scale).toBe(2);
    expect(cfg.hooks).toBeTruthy();
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
  });

  it('has a skin for every part, a draw order and a priority that name the same parts', () => {
    const order = cfg.cut.order;
    expect(new Set(order).size).toBe(order.length);
    expect(Object.keys(cfg.cut.parts).sort()).toEqual([...order].sort());
    expect(Object.keys(cfg.build.skin).sort()).toEqual([...order].sort());
    expect([...cfg.cut.priority].sort()).toEqual([...order].sort());
  });

  it('lists every bone after its parent and every skin on bones that exist', () => {
    const seen = new Set<string>();
    for (const [name, parent] of cfg.build.bones) {
      if (parent !== null) expect(seen.has(parent), `${name}'s parent ${parent} comes first`).toBe(true);
      seen.add(name);
    }
    for (const [prefix, c] of Object.entries(cfg.build.chains ?? {})) {
      expect(seen.has(c.parent), `chain ${prefix} hangs from ${c.parent}`).toBe(true);
      expect(cfg.cut.order).toContain(c.part);
      for (let i = 0; i < c.n; i++) seen.add(`${prefix}${i}`);
    }
    for (const [part, s] of Object.entries(cfg.build.skin)) {
      if (s.type === 'rigid') expect(seen.has(s.bone ?? ''), `${part} is rigid to ${s.bone}`).toBe(true);
      if (s.type === 'chain') {
        for (const b of s.bones ?? []) expect(seen.has(b), `${part} is skinned to ${b}`).toBe(true);
        expect(s.joints?.length, `${part} needs one more joint than bones`).toBe((s.bones?.length ?? 0) + 1);
      }
      if (s.type === 'auto') expect(Object.keys(cfg.build.chains ?? {})).toContain(s.chain);
    }
    for (const name of [...(cfg.fit.fixed ?? []), ...(cfg.fit.offsets ?? []), ...Object.keys(cfg.fit.scales ?? {})]) expect(seen.has(name), `fit names bone ${name}`).toBe(true);
    for (const name of Object.keys(cfg.motion?.idle?.bones ?? {})) expect(seen.has(name), `the idle sways bone ${name}`).toBe(true);
    for (const c of cfg.motion?.chains ?? []) for (const b of [...c.bones, c.follow]) expect(seen.has(b), `a lag chain names bone ${b}`).toBe(true);
  });

  it('has a head landmark, a foot landmark (the planted-feet check) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head).toBeTruthy();
    expect(Object.keys(lm).some((n) => /^(feet|foot|toe|heel|sole)/.test(n))).toBe(true);
    for (const [pose, marks] of Object.entries(cfg.landmarks)) {
      if (pose.startsWith('_')) continue;
      for (const [name, pt] of Object.entries(marks)) {
        expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
        expect(Array.isArray(pt) && pt.length === 2 && (pt as number[]).every(Number.isFinite), `${pose}.${name} is [x, y]`).toBe(true);
      }
    }
  });

  it('marks every painted pose (the gate refuses a painted key with no landmarks), the head first', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      expect(marks!.headCenter, `${pose} marks the head`).toBeTruthy();
      // a front-view pose (pass 2) is a front painting cut in as one part: its hands and its doll are that painting's pixels, not bones the gate can ask for, so it marks the head alone
      expect(Object.keys(marks!).length, `${pose} marks at least the head and one more part`).toBeGreaterThanOrEqual(FRONT_POSES.includes(pose) ? 1 : 2);
    }
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns only painted poses and authors only painted poses (idle is the costume, never either)', () => {
    for (const pose of [...(cfg.fit.mirror ?? []), ...(cfg.authored ?? [])]) {
      expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
    }
    // The three paintings that face LEFT (bust and arm toward the left of the picture, braids on the right): the rig faces right.
    expect([...(cfg.fit.mirror ?? [])].sort()).toEqual(['attack', 'ready', 'victory']);
  });

  it('lets the KO lie down (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko');
  });

  it('cuts the skirt into a column and a train and hangs both from the hips (pass 2)', () => {
    const order = cfg.cut.order;
    expect(order).toContain('train');
    expect(order.indexOf('train'), 'the train is drawn behind the column, so it can tuck under it').toBeLessThan(order.indexOf('skirt'));
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    // the two flare bones swing about the hips (row 620), not scale about the hem
    for (const n of ['skirtL', 'skirtR']) expect(bone(n)?.[2][1], `${n} swings about the hips`).toBe(620);
    expect(bone('train')?.[1], 'the train hangs from the left of the skirt and swings with it').toBe('skirtL');
    expect(cfg.build.skin.train?.type).toBe('hook');
    expect(cfg.fit.scales?.skirtL).toBeUndefined();
    expect(cfg.fit.scales?.skirtR).toBeUndefined();
  });

  it('gives the head and the collar shell bones, so a front key can hide them without touching the head bone the gate reads (pass 2)', () => {
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    expect(bone('headS')?.[1]).toBe('head');
    expect(bone('chestS')?.[1]).toBe('chest');
    expect(cfg.build.skin.head?.bone).toBe('headS');
    expect(cfg.build.skin.shoulders?.bone).toBe('chestS');
    expect(cfg.build.chains?.braid?.parent).toBe('headS');
    expect(cfg.build.landmarks.head?.[0], 'the gate reads the size of the head bone').toBe('head');
  });

  it('keeps each front part on a two-bone chain under the root, magnified by the chain (pass 2)', () => {
    const bones = cfg.build.bones;
    const byName = new Map(bones.map((b) => [b[0], b]));
    for (const f of ['fdef', 'fod']) {
      const a = byName.get(`${f}1`);
      const b = byName.get(`${f}2`);
      expect(a?.[1], `${f}1 hangs from the root (a body joint the hole test watches is a bone whose neighbours are parts)`).toBe('root');
      expect(b?.[1]).toBe(`${f}1`);
      expect(b?.[2], 'one joint for the whole chain').toEqual(a?.[2]);
      expect(cfg.fit.fixed ?? []).toEqual(expect.arrayContaining([`${f}1`, `${f}2`]));
    }
    const hook = readFileSync(`tools/rig/subjects/${cfg.hooks}`, 'utf8');
    const speck = Number(/FRONT_S = ([0-9.]+)/.exec(hook)?.[1]);
    expect(speck, 'the speck factor is what two bones can magnify (the gate takes a scale of at most 4 a bone)').toBeLessThanOrEqual(4 ** 2);
    for (const pose of FRONT_POSES) expect(hook, `the hook cuts ${pose}`).toContain(`pose="${pose}"`);
  });

  it('puts the KO at a smaller root scale, with the head scaled back up so the gate head band holds (pass 2)', () => {
    const k = (cfg.fit.keys?.ko ?? {}) as { scales?: Record<string, [number, number]> };
    const root = k.scales?.root?.[0] ?? 1;
    const head = k.scales?.head?.[0] ?? 1;
    expect(root, 'under 0.75 the hole disc of the pelvis joint is no longer covered').toBeGreaterThanOrEqual(0.75);
    expect(root * head, 'the gate head band is 0.85 to 1.15 of the idle head').toBeGreaterThanOrEqual(0.85);
    expect(root * head).toBeLessThanOrEqual(1.15);
  });
});
