/**
 * A floor ring's painting (`FloorDecal`, `src/engine/PartAnchors.ts`): the hidden Spectral Keeper's glyph platforms and aeon rock draw a painting in place of
 * their ring where the art is installed (r75-boss-art). **FFX only** (the Keeper is FFX's); the plumbing is inert for every anchor without a decal and for a stage
 * that gives `PartRings` no loader. Pure three.js, no renderer; the loader is injected, so no file is read.
 */
import { describe, expect, it } from 'vitest';
import { Color, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Texture } from 'three';
import { LIT_RING_COLOUR, PartRings, decalStateOf, type DecalLoader, type FloorDecal, type PartAnchor } from '../../../src/engine/PartAnchors.ts';
import { SPECTRAL_ARMED_FLAG_PREFIX, SPECTRAL_CIRCLE_IDS, SPECTRAL_GLYPH_DECALS, SPECTRAL_ROCK_DECAL } from '../../../src/data/ffx/spectral-keeper-ids.ts';
import { AT_PREFIX, ARMED_PREFIX } from '../../../src/battle/ffx/ai/spectral-keeper-rules.ts';
import { platformFlagOf } from '../../../src/battle/ffx/platformOccupancy.ts';
import { SPECTRAL_KEEPER_PART_ANCHORS } from '../../../src/scenes/spectral-keeper.ts';

const camera = new PerspectiveCamera();
const parent = { x: 1, y: 0, z: -5, height: 3 };
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const DECAL: FloorDecal = { unlit: 'art/decals/u.png', occupied: 'art/decals/o.png', mined: 'art/decals/m.png', standing: { platform: 3 } };
const anchor = (decal: FloorDecal | undefined, litFlag = 'plat.armed.c3'): PartAnchor => ({ mode: 'overhead', offset: [0.5, 0, 1], floorRing: { radius: 0.8, litFlag, ...(decal ? { decal } : {}) } });

/** A loader that answers with one texture per path (`null` for a path in `missing`), and remembers them. */
function loaderOf(missing: string[] = []): { load: DecalLoader; textures: Map<string, Texture>; asked: string[] } {
  const textures = new Map<string, Texture>();
  const asked: string[] = [];
  const load: DecalLoader = async (path) => {
    asked.push(path);
    if (missing.includes(path)) return null;
    const t = new Texture();
    textures.set(path, t);
    return t;
  };
  return { load, textures, asked };
}

/**
 * A battle state in the shape the engine keeps it for the glyphs: three active members on the field (Tidus, Yuna, Auron, as the Keeper's formation opens) and the ring's Circle, and the flags given. The glyph reads who stands
 * where from the active, on-field members' `plat.at.<member>` flags (`platformOccupancy.ts`), not from the raw flags alone; `gone` takes members off the field (an Eject).
 */
const FRONT = ['tidus', 'yuna', 'auron'] as const;
const state = (flags: Record<string, unknown>, gone: readonly string[] = []): NonNullable<Parameters<PartRings['sync']>[1]> => ({
  activeIds: [...FRONT],
  combatants: {
    c3: { alive: true, statuses: {} },
    ...Object.fromEntries(FRONT.map((id) => [id, { id, alive: true, removed: false, statuses: gone.includes(id) ? { eject: {} } : {} }])),
  } as never,
  flags: flags as never,
});
const ringOf = (root: Group): Mesh => root.children.find((m) => m.name === 'part-ring:c3') as Mesh;
const decalOf = (root: Group): Mesh | undefined => root.children.find((m) => m.name === 'part-decal:c3') as Mesh | undefined;
const frames = (rings: PartRings, flags: Record<string, unknown>, n = 12): void => {
  for (let i = 0; i < n; i++) {
    rings.sync('c3', state(flags));
    rings.update(0.25, () => parent, camera);
  }
};

describe('decalStateOf: which picture shows', () => {
  const ring = { litFlag: 'plat.armed.c3', decal: DECAL };
  it('the plain picture with no state, no flags, or nobody on it', () => {
    expect(decalStateOf(undefined, ring)).toBe('unlit');
    expect(decalStateOf(null, ring)).toBe('unlit');
    expect(decalStateOf(state({}), ring)).toBe('unlit');
    expect(decalStateOf(state({ 'plat.at.tidus': 2, 'plat.at.yuna': 5 }), ring)).toBe('unlit');
  });
  it('the occupied picture while a member on the field stands on THIS platform (the flag value is the platform number)', () => {
    expect(decalStateOf(state({ 'plat.at.auron': 3 }), ring)).toBe('occupied');
    expect(decalStateOf(state({ 'plat.at.auron': 4 }), ring)).toBe('unlit');
    expect(decalStateOf(state({ 'something.else': 3 }), ring)).toBe('unlit');
  });
  it('a flag alone is not a member standing there: a benched member\'s stale flag, and an Ejected member\'s, leave the plain picture (the engine says the platform is free)', () => {
    expect(decalStateOf(state({ 'plat.at.wakka': 3 }), ring), 'wakka is not on the front line').toBe('unlit');
    expect(decalStateOf(state({ 'plat.at.auron': 3 }, ['auron']), ring), 'auron was Ejected').toBe('unlit');
    expect(decalStateOf(state({ 'plat.at.auron': 3 }), ring)).toBe('occupied');
  });
  it('the mine\'s picture while the ring is lit, whoever stands on it (a member can Move onto a ticking mine)', () => {
    expect(decalStateOf(state({ 'plat.armed.c3': true }), ring)).toBe('mined');
    expect(decalStateOf(state({ 'plat.armed.c3': true, 'plat.at.auron': 3 }), ring)).toBe('mined');
    expect(decalStateOf(state({ 'plat.armed.c3': false, 'plat.at.auron': 3 }), ring)).toBe('occupied');
  });
  it('a decal with no `standing` never shows occupied; a ring with no lit flag is never mined', () => {
    expect(decalStateOf(state({ 'plat.at.auron': 3 }), { litFlag: 'x', decal: { unlit: 'u' } })).toBe('unlit');
    expect(decalStateOf(state({ 'plat.armed.c3': true }), { decal: DECAL })).toBe('unlit');
  });
});

describe('PartRings with a decal painting', () => {
  it('draws the ring until the painting has loaded, then the painting in its place (the ring hides)', async () => {
    const root = new Group();
    const { load } = loaderOf();
    const rings = new PartRings(root, load);
    rings.add('c3', anchor(DECAL));
    expect(root.children.length).toBe(1); // the ring only, while the file is on its way
    frames(rings, {});
    expect(ringOf(root).visible).toBe(true);
    await flush();
    expect(root.children.length).toBe(2);
    frames(rings, {});
    const decal = decalOf(root)!;
    expect(decal.visible).toBe(true);
    expect(ringOf(root).visible).toBe(false);
    expect(decal.rotation.x).toBeCloseTo(-Math.PI / 2, 5); // flat on the floor, like the ring
    expect(decal.position.x).toBeCloseTo(parent.x + 0.5, 5);
    expect(decal.position.z).toBeCloseTo(parent.z + 1, 5);
    expect(decal.position.y).toBeLessThan(ringOf(root).position.y); // under the ring
    expect(rings.snapshot()[0]!.decal).toEqual({ state: 'unlit', visible: true });
  });

  it('takes the occupied picture while a member stands there and the mine\'s while it is armed, then settles back', async () => {
    const root = new Group();
    const { load, textures } = loaderOf();
    const rings = new PartRings(root, load);
    rings.add('c3', anchor(DECAL));
    await flush();
    const mapOf = (): Texture | null => (decalOf(root)!.material as MeshBasicMaterial).map;
    frames(rings, {});
    expect(mapOf()).toBe(textures.get('art/decals/u.png'));
    frames(rings, { 'plat.at.auron': 3 });
    expect(mapOf()).toBe(textures.get('art/decals/o.png'));
    expect(rings.snapshot()[0]!.decal!.state).toBe('occupied');
    frames(rings, { 'plat.at.auron': 3, 'plat.armed.c3': true });
    expect(mapOf()).toBe(textures.get('art/decals/m.png'));
    expect(ringOf(root).visible).toBe(false); // the mine's picture is the tell: no amber ring on top of it
    frames(rings, {});
    expect(mapOf()).toBe(textures.get('art/decals/u.png'));
  });

  it('fades with the part (a KO\'d Circle) and with a parent that has gone, like its ring', async () => {
    const root = new Group();
    const rings = new PartRings(root, loaderOf().load);
    rings.add('c3', anchor(DECAL));
    await flush();
    frames(rings, {});
    expect(decalOf(root)!.visible).toBe(true);
    rings.update(5, () => undefined, camera);
    expect(decalOf(root)!.visible).toBe(false);
    expect(ringOf(root).visible).toBe(false);
  });

  it('keeps the ring when the plain picture has no file, or the loader fails: a tree without the art plays as before', async () => {
    for (const make of [() => loaderOf(['art/decals/u.png']).load, (): DecalLoader => async () => { throw new Error('404'); }]) {
      const root = new Group();
      const rings = new PartRings(root, make());
      rings.add('c3', anchor(DECAL));
      await flush();
      expect(root.children.length).toBe(1);
      frames(rings, {});
      expect(ringOf(root).visible).toBe(true);
      expect(rings.snapshot()[0]!.decal).toBeUndefined();
    }
  });

  it('with no loader no decal is ever drawn (the unit suite, a stage with no art)', async () => {
    const root = new Group();
    const rings = new PartRings(root);
    rings.add('c3', anchor(DECAL));
    await flush();
    expect(root.children.length).toBe(1);
  });

  it('a missing occupied or mined picture shows the plain one; a lit decal with no mine picture (the rock) brings the amber ring back over it', async () => {
    const root = new Group();
    const { load, textures } = loaderOf();
    const rings = new PartRings(root, load);
    rings.add('c3', anchor({ unlit: 'art/decals/rock.png' }));
    await flush();
    const mapOf = (): Texture | null => (decalOf(root)!.material as MeshBasicMaterial).map;
    frames(rings, {});
    expect(ringOf(root).visible).toBe(false);
    frames(rings, { 'plat.armed.c3': true }, 40);
    expect(mapOf()).toBe(textures.get('art/decals/rock.png'));
    expect(ringOf(root).visible).toBe(true);
    expect(((ringOf(root).material as MeshBasicMaterial).color).getHex()).toBe(new Color(LIT_RING_COLOUR).getHex());
  });

  it('a ring removed before its file arrives gets no painting, and a removed one takes its plane away', async () => {
    const root = new Group();
    const rings = new PartRings(root, loaderOf().load);
    rings.add('c3', anchor(DECAL));
    rings.remove('c3');
    await flush();
    expect(root.children.length).toBe(0);
    rings.add('c3', anchor(DECAL));
    await flush();
    expect(root.children.length).toBe(2);
    rings.remove('c3');
    expect(root.children.length).toBe(0);
  });

  it('replacing a ring (`add` again) drops the old painting and loads the new one', async () => {
    const root = new Group();
    const { load, asked } = loaderOf();
    const rings = new PartRings(root, load);
    rings.add('c3', anchor(DECAL));
    await flush();
    rings.add('c3', anchor({ unlit: 'art/decals/other.png' }));
    await flush();
    expect(root.children.filter((m) => m.name === 'part-decal:c3').length).toBe(1);
    expect(asked).toContain('art/decals/other.png');
  });
});

describe('the Spectral Keeper\'s anchors use it', () => {
  it('platforms 1 to 6 carry the glyph in three states and their own platform number; the rock carries its one stone', () => {
    SPECTRAL_CIRCLE_IDS.forEach((id, i) => {
      const a = SPECTRAL_KEEPER_PART_ANCHORS[id]!;
      expect(a.mode).toBe('overhead');
      const ring = a.mode === 'overhead' ? a.floorRing! : undefined;
      expect(ring?.decal, id).toBeDefined();
      if (i < 6) {
        expect(ring!.decal, id).toEqual({ ...SPECTRAL_GLYPH_DECALS, standing: { platform: i + 1 } });
      } else {
        expect(ring!.decal, id).toEqual({ unlit: SPECTRAL_ROCK_DECAL });
      }
    });
  });

  it('the armed-flag prefix is the battle layer\'s (a copy that drifted would leave a mine unlit); the occupied picture has no copy of its own: it reads the engine\'s `platformOccupancy.ts`, whose flag is AT_PREFIX', () => {
    expect(SPECTRAL_ARMED_FLAG_PREFIX).toBe(ARMED_PREFIX);
    expect(platformFlagOf('auron')).toBe(AT_PREFIX + 'auron');
  });

  it('every decal path is an art path under art/decals/ (the stage resolves it with artUrl)', () => {
    for (const p of [...Object.values(SPECTRAL_GLYPH_DECALS), SPECTRAL_ROCK_DECAL]) expect(p).toMatch(/^art\/decals\/[a-z0-9-]+\.png$/);
  });
});
