/**
 * **Rikku's Dark Knight subject config stays self-consistent** (the rig program, 2026-10-18; FFX-2 ONLY: the Dark Knight dressphere is an FFX-2 costume, `characters/rikku-dark-knight/*`, fielded by chapters
 * 4, 5, 11, 15 and 16 and the hidden 20, 23, 24 and 26). No art is read: only `tools/rig/subjects/rikku-dark-knight.json`, its hook file and the lane registry. What the gate will demand of the rig the
 * pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something that would only fail after a fit: every painted pose
 * is marked, every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent before it, the sword hangs from the hand, and the one painting
 * with no sword (the item pose) hides it by a v2 key instead of shrinking it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SUBJECT_PATH = 'tools/rig/subjects/rikku-dark-knight.json';
const cfg = JSON.parse(readFileSync(SUBJECT_PATH, 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown> };
  build: { bones: [string, string | null, [number, number]][]; hidden?: string[]; chains?: Record<string, { part: string; parent: string; n: number }>; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[]; chain?: string; name?: string }>; landmarks: Record<string, [string, [number, number]]> };
  fit: { mirror?: string[]; fixed?: string[]; offsets?: string[]; scales?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; hide?: string[]; show?: string[] }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> }; chains?: { bones: string[]; follow: string }[] };
};
const registry = JSON.parse(readFileSync('tools/rig/lane/lane-subjects.json', 'utf8')) as { subjects: Record<string, { actor: string; game: string; chapter: { door: string; id: string }; poses: string[]; track: Record<string, unknown>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Rikku Dark Knight in (the four `twirl-*` frames are dressphere-change frames, exempt from the pose gate and never a fight pose). */
const PAINTED = ['attack', 'cast', 'critical', 'follow', 'hurt', 'item', 'ko', 'ready', 'sleep', 'victory'];

describe('the Rikku Dark Knight subject config', () => {
  it('names the subject, its costume (her idle) and the hook file', () => {
    expect(cfg.subject).toBe('rikku-dark-knight');
    expect(cfg.costume.pose).toBe('idle');
    expect(cfg.scale).toBe(2);
    expect(cfg.hooks).toBeTruthy();
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
  });

  it('has a skin for every part, a draw order and a priority that name the same parts', () => {
    const order = cfg.cut.order;
    expect(new Set(order).size).toBe(order.length);
    expect(Object.keys(cfg.cut.parts).sort()).toEqual([...order].sort());
    expect([...cfg.cut.priority].sort()).toEqual([...order].sort());
    for (const part of order) expect(cfg.build.skin[part], `${part} has a skin`).toBeTruthy();
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

  it('has a head landmark, a foot landmark per boot (the planted-feet check) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head).toBeTruthy();
    expect(lm.soleL?.[0]).toBe('footL');
    expect(lm.soleR?.[0]).toBe('footR');
    expect(lm.tip?.[0], 'the sword point is the sword bone\'s').toBe('sword');
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
      // sleep marks no sole: its boots stand 46 px above the ground row that the SWORD's point sets, and the planted-feet rule would hold a boot mark 46 px off the row the key keeps its feet on
      expect(Object.keys(marks!).length, `${pose} marks the head and at least one more landmark`).toBeGreaterThanOrEqual(pose === 'sleep' ? 2 : 3);
    }
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns only painted poses and authors only painted poses (idle is the costume, never either)', () => {
    for (const pose of [...(cfg.fit.mirror ?? []), ...(cfg.authored ?? [])]) expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
  });

  it('lets the KO lie down (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko');
  });

  it('hangs the sword from the hand (a prop that follows the grip), behind every body part, and hides it in the one painting that has none (v2)', () => {
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    expect(bone('sword')?.[1]).toBe('hand');
    expect(cfg.cut.order[0], 'the sword is the rearmost part').toBe('sword');
    expect(cfg.build.skin.sword).toMatchObject({ type: 'rigid', bone: 'sword' });
    expect(cfg.fit.keys?.item?.hide, 'the item painting draws a potion, no sword').toEqual(['sword']);
    expect(cfg.landmarks.item?.tip, 'an item key marks no sword point').toBeUndefined();
    for (const pose of PAINTED.filter((p) => p !== 'item')) expect(cfg.landmarks[pose]?.tip, `${pose} marks the sword's point`).toBeTruthy();
  });

  it('cuts the skirt into a column and a train and hangs both from the hips (the hanging-panel recipe)', () => {
    const order = cfg.cut.order;
    expect(order).toContain('train');
    expect(order.indexOf('train'), 'the train is drawn behind the column, so it can tuck under it').toBeLessThan(order.indexOf('skirt'));
    const bone = (n: string) => cfg.build.bones.find((b) => b[0] === n);
    expect(bone('skirtL')?.[2]).toEqual(bone('skirtR')?.[2]);
    expect(bone('train')?.[1], 'the train hangs from the left of the skirt and swings with it').toBe('skirtL');
    expect(cfg.build.skin.skirt).toMatchObject({ type: 'hook', name: 'skirt' });
    expect(cfg.build.skin.train).toMatchObject({ type: 'hook', name: 'train' });
    const hook = readFileSync(`tools/rig/subjects/${cfg.hooks}`, 'utf8');
    expect(hook).toContain('def skin_skirt');
    expect(hook).toContain('def skin_train');
  });

  it('puts a cap of the leg\'s own pixels on every knee and hip, rigid on the bone of the joint it covers (a bent chain-skinned leg opens a wedge the gate watches)', () => {
    const hook = readFileSync(`tools/rig/subjects/${cfg.hooks}`, 'utf8');
    for (const [cap, bone] of [['kneeL', 'shinL'], ['kneeR', 'shinR'], ['hipL', 'thighL'], ['hipR', 'thighR']] as const) {
      expect(cfg.cut.order, `${cap} is a part`).toContain(cap);
      expect(cfg.build.skin[cap], `${cap} is rigid on ${bone}`).toMatchObject({ type: 'rigid', bone });
      expect(hook, `the hook cuts ${cap}`).toContain(`"${cap}"`);
      const leg = cap.endsWith('L') ? 'legL' : 'legR';
      expect(cfg.cut.order.indexOf(cap), `${cap} is drawn over ${leg}`).toBeGreaterThan(cfg.cut.order.indexOf(leg));
    }
    expect(hook).toContain('def cut_parts');
  });

  it('puts the sword\'s pivot outside the sword (a prop\'s pivot is not a joint of the body: the gate skips it) and lets the fit turn the sword end for end', () => {
    const sword = cfg.build.bones.find((b) => b[0] === 'sword')!;
    expect(sword[2][1], 'above the pommel (the sword part starts near row 51)').toBeLessThan(51);
  });

  it('is in the lane registry as an FFX-2 subject fielded by a hidden FFX-2 chapter that starts her in Dark Knight', () => {
    const r = registry.subjects['rikku-dark-knight'];
    expect(r).toBeTruthy();
    expect(r!.game, 'the Dark Knight dressphere is FFX-2 only').toBe('ffx2');
    expect(r!.actor).toBe('rikku');
    expect(r!.chapter).toEqual({ door: 'valefor', id: 'ffx2-valefor-besaid' });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on one of the three sheets').toEqual([...PAINTED].sort());
    expect(r!.sheets).toHaveLength(3);
  });
});
