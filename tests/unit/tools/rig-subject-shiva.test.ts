/**
 * **Shiva's subject config stays self-consistent** (the rig program, rig-aeons lane, 2026-10-19; FFX ONLY: Shiva is an FFX aeon, `characters/shiva/*`; the idle's gown is the costume, cast and hurt are the same gown bent,
 * attack, KO and Overdrive are other drawings and so authored; it is the possessed Shiva of Chapter III link 5 and the summon of ten more chapters). No art is read: only `tools/rig/subjects/shiva.json`, its hook file,
 * its keys and the lane registry. What the gate demands of the rig the pipeline makes from it is proved by the gate itself (`node tools/rig-gate.mjs`); what this proves is that the config cannot drift into something that
 * fails only after a fit: every painted pose is marked, every mark names a landmark the build makes, every part has a skin and a place in the draw order, every bone has its parent first, and nothing in a key can scale a
 * head (the whole point of the rig: hurt and KO keep the idle's size).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
const cfg = JSON.parse(readFileSync('tools/rig/subjects/shiva.json', 'utf8')) as {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; priority: string[]; parts: Record<string, unknown>; ops: { op: string; back?: string; front?: string; px?: number }[] };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[]; joints?: unknown[] }>; landmarks: Record<string, [string, Pt]> };
  fit: { mirror?: string[]; offsets?: string[]; offset_limit?: Record<string, [number, number]>; scales?: Record<string, [number, number]>; limits?: Record<string, [number, number]>; keys?: Record<string, { planted?: boolean; init?: Record<string, number> }> };
  landmarks: Record<string, Record<string, unknown>>;
  authored?: string[];
  motion?: { idle?: { bones: Record<string, unknown> } };
};
const registry = JSON.parse(readFileSync('tools/rig/lane/lane-subjects.json', 'utf8')) as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: unknown; poses: string[]; track: Record<string, string | string[]>; sheets?: [string, string[]][] }> };

/** The base poses the game paints Shiva in. */
const PAINTED = ['attack', 'cast', 'hurt', 'ko', 'overdrive'];

describe('the Shiva subject config', () => {
  it('names the subject, its costume (the idle) and the hook file', () => {
    expect(cfg.subject).toBe('shiva');
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

  it('draws the head in front of all, the raised arm and the near leg in front of the body, the hair behind everything (so a bent joint hides under the body)', () => {
    const o = cfg.cut.order;
    expect(o).toEqual(['hair', 'legB', 'train', 'armD', 'body', 'legF', 'armU', 'head']);
    const under = new Set(cfg.cut.ops.filter((x) => x.op === 'skirt').map((x) => `${x.back}<${x.front}`));
    for (const pair of ['hair<head', 'hair<body', 'hair<armD', 'legB<train', 'legB<legF', 'train<body', 'train<legF', 'armD<body', 'body<head', 'body<armU', 'legF<body', 'armU<head']) expect(under.has(pair), `${pair} underlap`).toBe(true);
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

  it('has a spine chain (pelvis, chest), a rigid head, two arms of three bones, two legs of three, a hair chain of four and a train chain of four, each its own chain', () => {
    for (const [part, bones] of Object.entries({
      body: ['pelvis', 'chest'], armU: ['armU0', 'armU1', 'armU2'], armD: ['armD0', 'armD1', 'armD2'], legF: ['thighF', 'shinF', 'footF'], legB: ['thighB', 'shinB', 'footB'],
      hair: ['hair0', 'hair1', 'hair2', 'hair3'], train: ['train0', 'train1', 'train2', 'train3'],
    })) expect(cfg.build.skin[part]?.bones, part).toEqual(bones);
    expect(cfg.build.skin.head).toMatchObject({ type: 'rigid', bone: 'head' });
  });

  it('never scales a head or a body in a key: the fit may scale only the leg bones (a size that follows the painting is the jump the rig removes)', () => {
    expect(Object.keys(cfg.fit.scales ?? {}).sort()).toEqual(['shinB', 'shinF', 'thighB', 'thighF']);
    for (const [, [lo, hi]] of Object.entries(cfg.fit.scales ?? {})) {
      expect(lo).toBeGreaterThanOrEqual(0.9);
      expect(hi).toBeLessThanOrEqual(1.15);
    }
    for (const k of Object.values(cfg.fit.keys ?? {})) for (const name of Object.keys(k.init ?? {})) expect(/^(head|chest|pelvis|arm[UD]\d|hair\d|train\d)\.s$/.test(name), `${name} would scale a head, body, arm, hair or train`).toBe(false);
    expect(cfg.fit.offsets).toEqual(['pelvis']);
  });

  it('has a head landmark (the eye), a foot landmark per foot (the planted-feet check) and the landmarks the marks name', () => {
    const lm = cfg.build.landmarks;
    expect(lm.head?.[0]).toBe('head');
    expect(lm.toeN?.[0]).toBe('footF');
    expect(lm.toeF?.[0]).toBe('footB');
    expect(lm.handD?.[0]).toBe('armD2');
    expect(lm.hairTip?.[0]).toBe('hair3');
    for (const [pose, marks] of Object.entries(cfg.landmarks)) {
      for (const [name, pt] of Object.entries(marks)) {
        expect(lm[name], `${pose} marks ${name}, which the build does not make`).toBeTruthy();
        expect(Array.isArray(pt) && pt.length === 2 && (pt as number[]).every(Number.isFinite), `${pose}.${name} is [x, y]`).toBe(true);
      }
    }
  });

  it('marks every painted pose (the gate refuses a painted key with no landmarks): the head and the near foot at least', () => {
    for (const pose of PAINTED) {
      const marks = cfg.landmarks[pose];
      expect(marks, `${pose} has marks`).toBeTruthy();
      expect(marks!.head, `${pose} marks the head`).toBeTruthy();
      expect(marks!.toeN, `${pose} marks the near foot`).toBeTruthy();
    }
    expect(Object.keys(cfg.landmarks).filter((k) => !k.startsWith('_') && !PAINTED.includes(k))).toEqual([]);
  });

  it('turns nothing (every painting faces the idle\'s way, left) and authors only painted poses', () => {
    expect(cfg.fit.mirror ?? []).toEqual([]);
    for (const pose of cfg.authored ?? []) expect(PAINTED, `${pose} is a painted pose`).toContain(pose);
  });

  it('lets the KO (lying down) and the Overdrive (floating) leave the floor (not planted) and nothing else', () => {
    for (const [pose, k] of Object.entries(cfg.fit.keys ?? {})) expect(k.planted === false, pose).toBe(pose === 'ko' || pose === 'overdrive');
  });

  it('is in the lane registry as the possessed Shiva of Chapter III link 5 (a listed chapter, reached by fighting links 1 to 4)', () => {
    const r = registry.subjects.shiva;
    expect(r).toBeTruthy();
    expect(r!.actor).toBe('possessed-shiva');
    expect(r!.game).toBe('ffx');
    expect(r!.chapter).toEqual({ id: 'braskas-final-aeon' });
    expect(r!.reach).toEqual({ auto: true });
    expect([...r!.poses].sort()).toEqual([...PAINTED].sort());
    const sheeted = (r!.sheets ?? []).flatMap(([, g]) => g);
    expect([...sheeted].sort(), 'every pose is on a sheet').toEqual([...PAINTED].sort());
    for (const name of [r!.track.head, ...(r!.track.feet as string[]), r!.track.centroid, r!.track.tip, r!.track.hand]) expect(cfg.build.landmarks[name as string], `the tracker reads ${name}`).toBeTruthy();
  });
});

describe('the Ifrit keys (tools/rig/subjects/shiva.keys.json: the keys the gated rig was exported from)', () => {
  const keys = JSON.parse(readFileSync('tools/rig/subjects/shiva.keys.json', 'utf8')) as Record<string, { bones: Record<string, { rot?: number; sx?: number; sy?: number }>; source: string; planted?: boolean }>;

  it('has a key for every painted pose, the attack, the KO and the Overdrive authored (other drawings) and cast and hurt read from their paintings', () => {
    expect(Object.keys(keys).sort()).toEqual([...PAINTED].sort());
    for (const pose of ['cast', 'hurt']) expect(keys[pose]!.source, pose).toBe(`characters/shiva/${pose}`);
    expect(cfg.authored).toEqual(['attack', 'ko', 'overdrive']);
    expect(keys.ko!.planted).toBe(false);
    expect(keys.overdrive!.planted).toBe(false);
  });

  it('never scales the head, the spine, an arm, the hair or the train in any key: the creature keeps the idle\'s size in hurt and KO (only the legs may stretch, within 0.9 to 1.15)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        if (/^(head|chest|pelvis|arm[UD]\d|hair\d|train\d)$/.test(bone)) expect(t.sx === undefined && t.sy === undefined, `${pose}.${bone} is not scaled`).toBe(true);
        else if (t.sx !== undefined) {
          expect(t.sx, `${pose}.${bone}`).toBeGreaterThanOrEqual(0.9);
          expect(t.sx, `${pose}.${bone}`).toBeLessThanOrEqual(1.15);
        }
      }
    }
  });
});
