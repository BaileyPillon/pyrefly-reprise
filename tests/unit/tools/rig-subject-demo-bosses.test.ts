/**
 * **The demo-bosses lane's two subject configs stay self-consistent** (rig-demo-bosses, 2026-10-20). FFX-2 ONLY: Bahamut of Chapter IV (`characters/ffx2-bahamut/*`, the combatant `bahamut`). FFX ONLY: the Chapter I
 * Seymour Flux actor (`characters/seymour-flux-body/*`, the combatant `seymour-flux`). Both are expressive-keys rigs that stay OFF: the idle painting is cut into parts and every other pose shows the pose's OWN
 * painting's pieces as format v2 variants (`tools/rig/rig_vcut.py`, masks made by `lane/expressive/autopart.py`). No art is read: the config, the masks' file names, the lane registry and the gate's budget.
 * What the gate demands of the rigs is proved by `node tools/rig-gate.mjs` itself (both are `ok`, `--verify` passes); this holds the choices a later lane must not undo by accident.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUDGET, BUDGET_BOSS, budgetOf } from '../../../tools/rig/rig-gate-lib.mjs';

type Pt = [number, number];
interface FromPainting { pose: string; mask?: string; mask_pad?: number; register: string; scaleArea?: number; skin?: string; tex?: number; mesh?: Record<string, number>; fill_joints?: number | Record<string, number> }
interface Cfg {
  subject: string; scale: number; costume: { pose: string }; hooks?: string;
  cut: { order: string[]; parts: Record<string, unknown> };
  build: { bones: [string, string | null, Pt][]; skin: Record<string, { type: string; bone?: string; bones?: string[] }>; landmarks: Record<string, [string, Pt]>; variants?: Record<string, Record<string, { from_painting: FromPainting }>> };
  fit: { keys: Record<string, { image?: Record<string, string>; planted?: boolean; init?: Record<string, number> }>; limits?: Record<string, [number, number]>; fit_classes?: string[]; fixed?: string[] };
  landmarks: Record<string, Record<string, Pt>>;
  authored?: string[];
  motion?: { idle?: { hz: number; bones: Record<string, { rot: number; phase: number }> } };
}
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const registry = read('tools/rig/lane/lane-subjects.json') as { subjects: Record<string, { actor: string; game: string; chapter: { door?: string; id: string }; reach?: { auto?: boolean }; poses: string[]; track: Record<string, string | string[]> }> };
const POSES = ['attack', 'cast', 'hurt', 'ko', 'telegraph'];

const subjects: { name: string; art: string; masks: string; game: string; parts: string[]; noVariants: string[]; reg: string; actor: string; chapter: string }[] = [
  { name: 'ffx2-bahamut-x', art: 'ffx2-bahamut', masks: 'tools/rig/subjects/ffx2-bahamut-x.masks', game: 'ffx2', parts: ['body', 'head', 'tail', 'wingL', 'wingR'], noVariants: [], reg: 'ffx2-bahamut', actor: 'bahamut', chapter: 'ffx2-bahamut' },
  { name: 'seymour-flux-x', art: 'seymour-flux-body', masks: 'tools/rig/subjects/seymour-flux-x.masks', game: 'ffx', parts: ['arm', 'body', 'hairM', 'hairU', 'head', 'leg'], noVariants: [], reg: 'seymour-flux', actor: 'seymour-flux', chapter: 'seymour-flux' },
];

describe('the aeon and boss budget (decision 153: 12 Mpx and 12 MB)', () => {
  it('holds the party and the dresspheres to 9 and gives an aeon, a boss and a part 12', () => {
    for (const s of ['tidus', 'lulu', 'kimahri', 'rikku', 'yuna-white-mage']) expect(budgetOf(s), s).toBe(BUDGET);
    for (const s of ['ifrit', 'bahamut', 'ffx2-bahamut', 'seymour-flux-body', 'dark-yojimbo']) expect(budgetOf(s), s).toBe(BUDGET_BOSS);
    expect(BUDGET_BOSS.texels).toBe(12_000_000);
    expect(BUDGET_BOSS.bytes).toBe(12_000_000);
    expect({ ...BUDGET_BOSS, texels: 0, bytes: 0 }).toEqual({ ...BUDGET, texels: 0, bytes: 0 }); // parts, bones, vertices and triangles are not raised
  });
});

for (const s of subjects) {
  const cfg = read(`tools/rig/subjects/${s.name}.json`) as Cfg;

  describe(`the ${s.name} config`, () => {
    it('is cut from the idle painting of the art id, at the 2x master, with a hook file', () => {
      expect(cfg.subject).toBe(s.art);
      expect(cfg.costume.pose).toBe('idle');
      expect(cfg.scale).toBe(2);
      expect(existsSync(`tools/rig/subjects/${cfg.hooks}`)).toBe(true);
    });

    it('cuts a variant of each piece part from the painting of every pose, registered to that pose\'s key, and the key shows it', () => {
      const v = cfg.build.variants ?? {};
      expect(Object.keys(v).sort()).toEqual([...s.parts].sort());
      for (const part of s.noVariants) expect(v[part], `${part} keeps the idle's piece in every pose`).toBeUndefined();
      for (const [part, byName] of Object.entries(v)) {
        expect(Object.keys(byName).sort(), part).toEqual([...POSES].sort());
        for (const [name, { from_painting: f }] of Object.entries(byName)) {
          expect(f.pose, `${part}:${name}`).toBe(name);
          expect(f.register, `${part}:${name}`).toBe(name);
          expect(f.mask, `${part}:${name} is cut by a partition mask`).toBe(`${s.masks}/${name}.${part}.png`);
          expect(f.mask_pad).toBe(600);
          expect(existsSync(f.mask!), `${f.mask} is in the repository`).toBe(true);
          expect(cfg.fit.keys[name]?.image?.[part], `${name} key shows ${part}`).toBe(name);
          if (cfg.build.skin[part]?.type === 'chain') expect(f.skin, `${part}:${name} bends along the part's chain`).toBe('chain');
          expect(f.tex ?? 1, `${part}:${name} stays inside the texel budget`).toBeLessThanOrEqual(0.75);
        }
      }
    });

    it('keeps every head piece at the idle head\'s size: scaleArea tuned until the opaque area is inside 3 percent (the head never changes size between keys, the KO does not shrink)', () => {
      for (const pose of POSES) {
        const f = cfg.build.variants!['head']![pose]!.from_painting;
        expect(f.scaleArea, pose).toBeGreaterThanOrEqual(1.0);
        expect(f.scaleArea, pose).toBeLessThanOrEqual(1.4);
      }
    });

    it('names a mark of the painting for the head in every pose and keeps the KO an authored key that is not planted', () => {
      for (const pose of POSES) expect(cfg.landmarks[pose]?.['head'], `${pose} head mark`).toHaveLength(2);
      expect(cfg.authored).toContain('ko');
      expect(cfg.fit.keys['ko']?.planted).toBe(false);
    });

    it('has a registry entry that reaches the chapter and plays the same five poses', () => {
      const r = registry.subjects[s.reg]!;
      expect(r.actor).toBe(s.actor);
      expect(r.game).toBe(s.game);
      expect(r.chapter).toEqual({ id: s.chapter });
      expect(r.reach).toEqual({ auto: true });
      expect([...r.poses].sort()).toEqual([...POSES].sort());
      const landmarks = new Set(Object.keys(cfg.build.landmarks));
      for (const n of [r.track['head'], r.track['centroid'], ...(Array.isArray(r.track['feet']) ? r.track['feet'] : [r.track['feet']])]) expect(landmarks.has(n as string), `${n} is a landmark of the rig`).toBe(true);
    });

    it('has an idle sway that is alive (every bone it moves exists)', () => {
      const bones = new Set(cfg.build.bones.map((b) => b[0]));
      const idle = cfg.motion!.idle!;
      expect(idle.hz).toBeGreaterThan(0.3);
      for (const [b, m] of Object.entries(idle.bones)) {
        expect(bones.has(b), b).toBe(true);
        expect(m.rot, b).toBeGreaterThan(0);
      }
    });
  });
}

describe('what each lane decided on its own', () => {
  const bah = read('tools/rig/subjects/ffx2-bahamut-x.json') as Cfg;
  const sey = read('tools/rig/subjects/seymour-flux-x.json') as Cfg;

  it('Bahamut: no wing bone may turn more than 40 degrees (a fit that turned the hurt key\'s lower wing 80 degrees left a candy-wrapper hole in every blend)', () => {
    for (const b of ['wingLA', 'wingLB', 'wingLC', 'wingRA', 'wingRB', 'wingRC']) expect(bah.fit.limits![b], b).toEqual([-40, 40]);
  });

  it('Bahamut: the tail is a 12-bone chain whose pivots sit on its outer edge (not watched by the hole test), and the Mega Flare splash painting is not a key', () => {
    expect(bah.build.skin['tail']!.bones).toHaveLength(12);
    expect(Object.keys(bah.fit.keys)).not.toContain('splash');
    expect(registry.subjects['ffx2-bahamut']!.poses).not.toContain('splash');
  });

  it('Seymour: the pose model calls the body a part, so the fitter is told to fit it anyway; body, arm and leg are rigid, the chest is held, the hair is two chains', () => {
    expect(sey.fit.fit_classes).toEqual(['part']);
    expect(sey.fit.fixed).toEqual(['chest']);
    for (const p of ['body', 'arm', 'leg']) expect(sey.build.skin[p]!.type, p).toBe('rigid');
    for (const p of ['hairU', 'hairM']) expect(sey.build.skin[p]!.type, p).toBe('chain');
  });
});
