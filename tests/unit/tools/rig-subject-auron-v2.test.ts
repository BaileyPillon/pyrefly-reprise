/**
 * **Auron's pass 2 config stays self-consistent** (the rig program, 2026-10-18; FFX only: Auron is an FFX figure). No art is read: only `tools/rig/subjects/auron-v2.json` and its two Python modules.
 * What the gate will demand of the rig is proved by the gate itself; what this proves is that the config cannot drift into something that fails only after a fit: every variant a key swaps in is cut by a
 * spec, every spec names a pose with a painting and marks that become landmarks the key expects, the idle's limbs a key hides are parts that exist, the blade's grey fill is gone, and the keys that hang the
 * idle's arm (or its empty sleeve) behind the body say so in `layers`, which is what keeps the shoulder and elbow joints under the gate's hole watch covered.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type KeyCfg = { image?: Record<string, string>; hide?: string[]; show?: string[]; layers?: Record<string, number>; free?: string[]; limits?: Record<string, [number, number]> };
type Spec = { part: string; variant: string; pose: string; d: number; bone: string; include: unknown[]; marks?: Record<string, [number, number]>; defringe?: boolean };
const cfg = JSON.parse(readFileSync('tools/rig/subjects/auron-v2.json', 'utf8')) as {
  subject: string; hooks: string; cut: { order: string[]; parts: Record<string, unknown> };
  build: { skin: Record<string, unknown>; landmarks: Record<string, [string, [number, number]]> };
  fit: { foot_landmarks?: string[]; keys: Record<string, KeyCfg> };
  landmarks: Record<string, Record<string, [number, number]>>;
  authored: string[];
  variants_cut: Record<string, Spec>;
};

const POSES = ['attack', 'cast', 'critical', 'follow', 'hurt', 'item', 'ko', 'ready', 'sleep', 'victory'];

describe('the Auron pass 2 subject config', () => {
  it('is Auron\'s art id under its own config name, with its own hook module, and has no blade fill', () => {
    expect(cfg.subject).toBe('auron');
    expect(cfg.hooks).toBe('auron_v2_hooks.py');
    expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
    expect(existsSync('tools/rig/subjects/auron_variants.py')).toBe(true);
    expect(cfg.cut.order).not.toContain('blade');
    expect(Object.keys(cfg.cut.parts)).not.toContain('blade');
    expect(Object.keys(cfg.build.skin)).not.toContain('blade');
  });

  it('cuts every variant a key swaps in, and no variant a key does not', () => {
    const cut = new Set(Object.values(cfg.variants_cut).map((s) => `${s.part}:${s.variant}`));
    for (const [k, s] of Object.entries(cfg.variants_cut)) expect(k, 'the spec is keyed part:variant').toBe(`${s.part}:${s.variant}`);
    const swapped = new Set<string>();
    for (const [pose, k] of Object.entries(cfg.fit.keys)) for (const [part, v] of Object.entries(k.image ?? {})) { swapped.add(`${part}:${v}`); expect(cut.has(`${part}:${v}`), `${pose} swaps ${part}:${v}, which no spec cuts`).toBe(true); }
    for (const c of cut) expect(swapped.has(c), `${c} is cut but no key swaps it in (dead data the gate refuses)`).toBe(true);
  });

  it('puts each spec on a painted pose, rigid on the root, with marks the pose expects', () => {
    for (const s of Object.values(cfg.variants_cut)) {
      expect(['armX', 'swordX']).toContain(s.part);
      expect(POSES).toContain(s.pose);
      expect(s.bone).toBe('root');
      expect(s.include.length).toBeGreaterThan(0);
      expect(s.d).toBeGreaterThanOrEqual(1);
      for (const [name, [x, y]] of Object.entries(s.marks ?? {})) {
        const expected = cfg.landmarks[s.pose]?.[`${name}${s.pose[0]!.toUpperCase()}${s.pose.slice(1)}`];
        expect(expected, `${s.pose} expects ${name}${s.pose} (the variant's landmark)`).toBeTruthy();
        // the spec's marks are the pose's expected marks (1x px) in the painting's @2x px
        expect([x / 2, y / 2]).toEqual(expected);
      }
    }
  });

  it('hides only parts that exist, hides the idle glove, sword and scabbard where a variant carries them, and keeps the foot landmark the fit reads', () => {
    const parts = new Set([...cfg.cut.order, 'armX', 'swordX']);
    for (const [pose, k] of Object.entries(cfg.fit.keys)) {
      for (const h of [...(k.hide ?? []), ...(k.show ?? []), ...Object.keys(k.image ?? {}), ...Object.keys(k.layers ?? {})]) expect(parts.has(h), `${pose} names part ${h}`).toBe(true);
      if (Object.keys(k.image ?? {}).length) for (const h of ['glove', 'sword', 'saya']) expect(k.hide, `${pose} brings its own limb or prop: the idle's ${h} goes`).toContain(h);
    }
    expect(cfg.fit.keys.ko?.hide).toContain('saya'); // the KO's stray scabbard bar
    expect(cfg.fit.foot_landmarks).toEqual(['toe']); // `feet` is on the root and never moves: a key that floats would not be seen
  });

  it('hangs the idle arm behind the body wherever a variant brings the whole arm', () => {
    for (const pose of ['attack', 'ready']) {
      const k = cfg.fit.keys[pose]!;
      expect(k.image?.armX, `${pose} brings its arm`).toBeTruthy();
      expect(k.hide ?? [], `${pose} keeps the idle's armR shown (its joints stay covered)`).not.toContain('armR');
      expect(k.layers?.armR, `${pose} draws the idle's armR behind the coat`).toBeLessThan(2);
      expect(k.limits?.upperarm, `${pose} hangs it (a fixed angle)`).toEqual([90, 90]);
    }
  });

  it('keeps every painted pose authored and marked (the gate waives the overlap, never the landmarks)', () => {
    expect([...cfg.authored].sort()).toEqual([...POSES].sort());
    for (const pose of POSES) expect(cfg.landmarks[pose]?.headCenter, `${pose} marks the head`).toBeTruthy();
  });
});
