/**
 * **The expressive-keys pilot's subject config (Bahamut, rig-expressive lane, 2026-10-19; FFX ONLY: Bahamut is an FFX aeon, `characters/bahamut/*`; the rig stays OFF).** `tools/rig/subjects/bahamut-x.json` is
 * Bahamut's config plus format v2 variants cut from the attack and hurt PAINTINGS by `tools/rig/rig_vcut.py`: the head (with its neck stub) scaled so its mesh is the idle head's area, and the two wings. No art is
 * read here; the gate proves what the rig does. This holds the config to what the lane decided: nothing but the variants and the keys that show them differs from `bahamut.json` (so the cut, the skeleton and the skin
 * are the ones that passed), every variant is cut from the painting of the pose whose key shows it and registered to that key, the head never changes size, the KO and the Overdrive keep their idle images, and a
 * wing's bones are never scaled in the hurt key.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Pt = [number, number];
interface FromPainting { pose: string; poly: Pt[]; cutline?: Pt[][]; register: string; scale?: number; scaleArea?: number; anchor?: Pt; skin?: string; bone?: string; tex?: number; feather?: number; fill?: number[][] }
interface Cfg {
  subject: string;
  build: { variants?: Record<string, Record<string, { from_painting: FromPainting }>> } & Record<string, unknown>;
  fit: { keys: Record<string, { image?: Record<string, string> } & Record<string, unknown>> } & Record<string, unknown>;
  [k: string]: unknown;
}
const read = (f: string): Cfg => JSON.parse(readFileSync(f, 'utf8')) as Cfg;
const x = read('tools/rig/subjects/bahamut-x.json');
const base = read('tools/rig/subjects/bahamut.json');
const keys = JSON.parse(readFileSync('tools/rig/subjects/bahamut-x.keys.json', 'utf8')) as Record<string, { bones: Record<string, { rot?: number; sx?: number; sy?: number }> }>;

const strip = (c: Cfg): unknown => {
  const o = JSON.parse(JSON.stringify(c)) as Cfg;
  delete o['_lane'];
  delete o.build.variants;
  for (const k of Object.values(o.fit.keys)) delete k.image;
  return o;
};

describe('the Bahamut expressive-keys config', () => {
  it('is Bahamut\'s own config for everything but the variants and the keys that show them', () => {
    expect(x.subject).toBe('bahamut');
    expect(strip(x)).toEqual(strip(base));
  });

  it('cuts a variant of the head and of each wing from the attack and the hurt painting, each registered to the key of that pose', () => {
    const v = x.build.variants ?? {};
    expect(Object.keys(v).sort()).toEqual(['head', 'wingL', 'wingR']);
    for (const [part, byName] of Object.entries(v)) {
      expect(Object.keys(byName).sort(), part).toEqual(['attack', 'hurt']);
      for (const [name, { from_painting: f }] of Object.entries(byName)) {
        expect(f.pose, `${part}:${name}`).toBe(name);
        expect(f.register, `${part}:${name}`).toBe(name);
        expect(f.poly.length, `${part}:${name} polygon`).toBeGreaterThanOrEqual(3);
        // the registered key shows exactly this variant
        expect(x.fit.keys[name]?.image?.[part], `${name} key shows ${part}`).toBe(name);
      }
    }
  });

  it('shows variants only in the attack and the hurt keys: the KO, the Overdrive and the cast keep the idle\'s images', () => {
    for (const [pose, k] of Object.entries(x.fit.keys)) {
      if (pose === 'attack' || pose === 'hurt') expect(Object.keys(k.image ?? {}).sort(), pose).toEqual(['head', 'wingL', 'wingR']);
      else expect(k.image, pose).toBeUndefined();
    }
  });

  it('draws the head at the idle head\'s mesh area (the size rule: the head does not change size between keys) and skins a wing\'s variant along the wing\'s own chain', () => {
    const v = x.build.variants ?? {};
    for (const name of ['attack', 'hurt']) {
      // the mesh area is 1.018 of the idle head's and the opaque pixels 0.98: both inside the 3 percent the head may differ by
      expect(v['head']?.[name]?.from_painting.scaleArea).toBeGreaterThanOrEqual(0.97);
      expect(v['head']?.[name]?.from_painting.scaleArea).toBeLessThanOrEqual(1.03);
      expect(v['head']?.[name]?.from_painting.anchor?.length).toBe(2); // grown in place about the head, so the landmark stays where the painting has it
      for (const wing of ['wingL', 'wingR']) {
        const f = v[wing]?.[name]?.from_painting;
        expect(f?.skin, `${wing}:${name}`).toBe('chain');
        expect(f?.tex ?? 1, `${wing}:${name} stays inside the texel budget at half size`).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('never scales a head, the spine, an arm or a tail in any key, and a wing only in the attack key (the hurt wings are placed by the variants, not by size)', () => {
    for (const [pose, k] of Object.entries(keys)) {
      for (const [bone, t] of Object.entries(k.bones)) {
        const scaled = (t.sx ?? 1) !== 1 || (t.sy ?? 1) !== 1;
        if (/^(head|chest|pelvis|armL\d|tail\d)$/.test(bone)) expect(scaled, `${pose} ${bone}`).toBe(false);
        if (/^wing/.test(bone) && pose !== 'attack') expect(scaled, `${pose} ${bone}`).toBe(false);
      }
    }
  });
});
