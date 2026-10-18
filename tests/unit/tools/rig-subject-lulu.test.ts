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
      expect(Object.keys(marks!).length, `${pose} marks at least the head and one more part`).toBeGreaterThanOrEqual(2);
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
});
