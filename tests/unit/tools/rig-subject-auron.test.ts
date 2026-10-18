/**
 * **Auron's subject config stays self-consistent** (the rig program, 2026-10-18; FFX only: Auron is an FFX figure, `characters/auron/*`; his paintings have no `defend` and no `od-fury`, so there is no
 * front-view part). No art is read: only `tools/rig/subjects/auron.json` and its hook file. What the gate will demand of the rig the pipeline makes from it is proved by the gate itself
 * (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something that would only fail after a five-minute fit: every painted pose is marked (head, the sword-hand's fist, the sword's
 * hilt and tip), every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent before it, and the lists of authored and turned poses name painted poses.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SUBJECT_PATH = 'tools/rig/subjects/auron.json';
const cfg = JSON.parse(readFileSync(SUBJECT_PATH, 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown> };
  build: { bones: [string, string | null, [number, number]][]; chains?: Record<string, { part: string; parent: string; n: number }>; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[]; chain?: string; name?: string }>; landmarks: Record<string, [string, [number, number]]> };
  fit: { limits?: Record<string, [number, number]>; mirror?: string[]; fixed?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; scales?: Record<string, [number, number]> }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> }; chains?: { bones: string[]; follow: string }[] };
};

/** The poses the game paints Auron in (`public/art/characters/auron/*.png`, FFX: chapters 2 and 3, the Sin and Garden of Pain chapters and the hidden Sinspawn Gui chapter field him). He has NO defend and NO od-fury painting. */
const PAINTED = ['attack', 'cast', 'critical', 'follow', 'hurt', 'item', 'ko', 'ready', 'sleep', 'victory'];

describe('the Auron subject config', () => {
  it('names the subject, its costume (his idle) and the hook file', () => {
    expect(cfg.subject).toBe('auron');
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
    for (const [part, s] of Object.entries(cfg.build.skin)) {
      if (s.type === 'rigid') expect(seen.has(s.bone ?? ''), `${part} is rigid to ${s.bone}`).toBe(true);
      if (s.type === 'chain') {
        for (const b of s.bones ?? []) expect(seen.has(b), `${part} is skinned to ${b}`).toBe(true);
        expect(s.joints?.length, `${part} needs one more joint than bones`).toBe((s.bones?.length ?? 0) + 1);
      }
    }
    for (const name of [...(cfg.fit.fixed ?? []), ...(cfg.fit.offsets ?? []), ...Object.keys(cfg.fit.scales ?? {})]) expect(seen.has(name), `fit names bone ${name}`).toBe(true);
    for (const name of Object.keys(cfg.motion?.idle?.bones ?? {})) expect(seen.has(name), `the idle sways bone ${name}`).toBe(true);
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

  it('marks every painted pose (the gate refuses a painted key with no landmarks): the head, the sword hand and both ends of the sword', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      for (const name of ['headCenter', 'fist', 'swordHilt', 'swordTip']) expect(marks![name], `${pose} marks ${name}`).toBeTruthy();
    }
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns only painted poses and authors only painted poses (idle is the costume, never either)', () => {
    for (const pose of [...(cfg.fit.mirror ?? []), ...(cfg.authored ?? [])]) {
      expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
    }
    // the paintings that face LEFT (the head, and the sword's hilt-to-tip direction, run opposite to the idle's): the rig faces right
    for (const pose of ['attack', 'item', 'victory']) expect(cfg.fit.mirror, pose).toContain(pose);
  });

  it('lets the KO lie down (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko');
  });

  it('has no front-view part: Auron has no defend and no od-fury painting to cut one from', () => {
    for (const part of cfg.cut.order) expect(part, 'a part named for a front pose').not.toMatch(/^f(def|od)/);
    expect(cfg.cut.order).not.toContain('fdef');
  });

  it('hangs the lower coat from the hips (the skirt treatment): a column and a tail, both swinging about the hips, never trailing from the hem', () => {
    const order = cfg.cut.order;
    expect(order.indexOf('tail'), 'the tail is drawn behind the coat, so it can tuck under it').toBeLessThan(order.indexOf('coat'));
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    for (const n of ['coatL', 'coatR']) {
      expect(bone(n)?.[2][1], `${n} swings about the hips (row 620), not the hem`).toBe(620);
      expect(bone(n)?.[1], `${n} hangs from the pelvis, so the coat follows the hips when a key bends or lowers them (hung from the root, a joint left behind at the old hips opened holes in the bent poses)`).toBe('pelvis');
    }
    // the coat may swing out (positive) but not in past a few degrees: swung in about the hips, the tail's tip drops under the soles and the gate reads the tail as the feet
    expect(cfg.fit.limits?.coatL?.[0]).toBeGreaterThanOrEqual(-5);
    expect(bone('tail')?.[1], 'the tail hangs from the left of the coat and swings with it').toBe('coatL');
    expect(cfg.build.skin.coat?.type).toBe('hook');
    expect(cfg.build.skin.tail?.type).toBe('hook');
    expect(cfg.fit.scales?.coatL).toBeUndefined();
    expect(cfg.fit.scales?.coatR).toBeUndefined();
    const hook = readFileSync(`tools/rig/subjects/${cfg.hooks}`, 'utf8');
    expect(hook).toContain('def skin_coat');
    expect(hook).toContain('def skin_tail');
  });

  it('makes the sword a landmarked prop: a bone of its own that a key can carry to the other hand, scale and turn (his idle holds it in one hand, the paintings hold it in either, sheathed or drawn)', () => {
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    expect(bone('sword')?.[1], 'the sword hangs from the root, like Lulu\'s doll, so a key can move it to either hand').toBe('root');
    expect(cfg.fit.offsets).toContain('sword');
    const range = cfg.fit.scales?.sword;
    expect(range, 'the painted sword is 0.4 to 1.5 times the idle\'s').toBeTruthy();
    expect(range![0]).toBeLessThanOrEqual(0.5);
    expect(range![1]).toBeGreaterThanOrEqual(1.5);
    for (const part of ['sword', 'blade']) expect(cfg.build.skin[part]?.bone, `${part} rides the sword bone`).toBe('sword');
    const lm = cfg.build.landmarks;
    expect(lm.swordHilt?.[0]).toBe('sword');
    expect(lm.swordTip?.[0]).toBe('sword');
    expect(lm.fist?.[0], 'the gate reads the sword hand on the hand bone').toBe('hand');
    expect(cfg.cut.order.indexOf('blade'), 'the hidden length of the blade is drawn behind the coat').toBeLessThan(cfg.cut.order.indexOf('torso'));
    expect(cfg.cut.order.indexOf('sword'), 'the glove is drawn over the handle').toBeLessThan(cfg.cut.order.indexOf('glove'));
  });

  it('puts the KO at a smaller root scale, with the head scaled back up so the gate head band holds', () => {
    const k = cfg.fit.keys?.ko ?? {};
    const root = k.scales?.root?.[0] ?? 1;
    const head = k.scales?.head?.[0] ?? 1;
    const spine = k.scales?.spine?.[0] ?? 1;
    expect(root, 'under 0.75 the hole disc of the pelvis joint is no longer covered').toBeGreaterThanOrEqual(0.75);
    expect(root * head * spine, 'the gate head band is 0.85 to 1.15 of the idle head (the head inherits the spine and the root)').toBeGreaterThanOrEqual(0.85);
    expect(root * head * spine).toBeLessThanOrEqual(1.15);
  });
});
