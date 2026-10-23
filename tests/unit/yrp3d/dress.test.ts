/**
 * **The dresspheres as models, the pure part** (`src/engine/yrp3d/dress.ts`, `dressReach.ts`, `dressSwap.ts` and the dress clip map in `clipMap.ts`; the hidden 3D Bahamut chapter, FFX-2 only). Held without a renderer:
 *
 * 1. **The manifest** (`dress/index.json`): read into entries, starters and lookups; a malformed entry is left out, a manifest with nothing usable is no manifest, a missing `starts` falls back to Chapter IV's build.
 * 2. **Which model a dressphere is**: the file to load (HD where the folder has it and the page wants it, else the base one), the folder and manifest URLs, `?dress=off`.
 * 3. **Which dressphere the battle says**: `yuna-white-mage` is `white-mage` (the presenter's art id, which the stage keeps on the actor), through any art namespace and path; a bare `yuna` or another girl's id names none.
 * 4. **The dressphere clip map**: one model per file, `poses` at the top, with the roles of the single-model map; a pose with a malformed entry is left out; a file with no `poses` falls back to the clip names.
 * 5. **Which dresspheres a girl can change into next** (the engine's own grid): Chapter IV's build gives each girl her two neighbours on the ring, and after a change her new node's.
 * 6. **The swap's clock**: the light goes up, the swap happens once at the peak with the model in hand, the light falls off; the peak holds for a model that is late, a model that never comes cancels, and a swap can run again.
 */
import { describe, expect, it } from 'vitest';

import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { dressPlansFor, plansFromDressClipMap } from '../../../src/engine/yrp3d/clipMap.ts';
import { DEFAULT_STARTS, DRESS_SUBDIR, dressDirOf, dressFileUrl, dressFiles, dressIndexUrl, dressModelFile, dressOff, dressOfArt, isGirl, parseDressIndex } from '../../../src/engine/yrp3d/dress.ts';
import { reachFor } from '../../../src/engine/yrp3d/dressReach.ts';
import { DressSwap, LIGHT, SWAP } from '../../../src/engine/yrp3d/dressSwap.ts';

const MANIFEST = {
  version: 1,
  starts: { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' },
  entries: [
    { girl: 'yuna', dress: 'white-mage', folder: 'yuna-white-mage', hd: true, weapons: 1, tier: 'a' },
    { girl: 'yuna', dress: 'gunner', folder: 'yuna-gunner', hd: true, weapons: 2, tier: 'b' },
    { girl: 'yuna', dress: 'samurai', folder: 'yuna-samurai', hd: false, weapons: 1, tier: 'c' },
    { girl: 'rikku', dress: 'dark-knight', folder: 'rikku-dark-knight', hd: true, weapons: 1, tier: 'a' },
    { girl: 'paine', dress: 'warrior', folder: 'paine-warrior', hd: true, weapons: 1, tier: 'a' },
  ],
};

describe('the manifest', () => {
  it('reads the entries, the starters and the lookups', () => {
    const index = parseDressIndex(MANIFEST)!;
    expect(index.entries).toHaveLength(5);
    expect(index.starts).toEqual({ yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' });
    expect(index.has('yuna', 'gunner')).toBe(true);
    expect(index.has('rikku', 'gunner')).toBe(false);
    expect(index.get('yuna', 'samurai')).toEqual({ girl: 'yuna', dress: 'samurai', folder: 'yuna-samurai', hd: false, weapons: 1, tier: 'c' });
    expect(index.get('paine', 'samurai')).toBeNull();
    expect(index.dresses('yuna')).toEqual(['white-mage', 'gunner', 'samurai']);
    expect(index.dresses('rikku')).toEqual(['dark-knight']);
  });

  it('leaves a malformed entry out and is no manifest at all when nothing usable is left', () => {
    const index = parseDressIndex({ entries: [{ girl: 'bahamut', dress: 'x', folder: 'x' }, { girl: 'yuna', dress: '', folder: 'y' }, 'nope', null, { girl: 'yuna', dress: 'gunner', folder: 'yuna-gunner' }] })!;
    expect(index.entries).toEqual([{ girl: 'yuna', dress: 'gunner', folder: 'yuna-gunner', hd: false, weapons: 0, tier: '' }]);
    for (const bad of [null, undefined, 3, 'x', [], {}, { entries: 'no' }, { entries: [] }, { entries: [{ girl: 'zidane', dress: 'thief', folder: 'z' }] }]) expect(parseDressIndex(bad), JSON.stringify(bad)).toBeNull();
  });

  it("falls back to Chapter IV's starters for a missing `starts`, or a start the manifest has no model for", () => {
    expect(DEFAULT_STARTS).toEqual({ yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' });
    expect(parseDressIndex({ ...MANIFEST, starts: undefined })!.starts).toEqual(DEFAULT_STARTS);
    expect(parseDressIndex({ ...MANIFEST, starts: { ...MANIFEST.starts, yuna: 'psychic' } })!.starts.yuna).toBe('white-mage');
    expect(parseDressIndex({ ...MANIFEST, starts: { ...MANIFEST.starts, yuna: 'gunner' } })!.starts.yuna).toBe('gunner');
  });

  it('knows the three girls and not Bahamut', () => {
    expect(['yuna', 'rikku', 'paine'].every(isGirl)).toBe(true);
    expect(isGirl('bahamut')).toBe(false);
    expect(isGirl('lulu')).toBe(false);
  });
});

describe('which model a dressphere is', () => {
  const index = parseDressIndex(MANIFEST)!;
  const white = index.get('yuna', 'white-mage')!;
  const samurai = index.get('yuna', 'samurai')!;

  it('is the armed anims file: the HD one where the folder has it and the page wants it, else the base one', () => {
    expect(dressFiles(white)).toEqual({ anims: 'yuna-white-mage/anims.glb', hdAnims: 'yuna-white-mage/hd/anims.glb', clipmap: 'yuna-white-mage/clipmap.json' });
    expect(dressFiles(samurai).hdAnims).toBeNull();
    expect(dressModelFile(white, true)).toBe('yuna-white-mage/hd/anims.glb');
    expect(dressModelFile(white, false)).toBe('yuna-white-mage/anims.glb');
    expect(dressModelFile(samurai, true)).toBe('yuna-samurai/anims.glb');
  });

  it("is found under the models folder's dress directory, and the manifest beside it", () => {
    expect(DRESS_SUBDIR).toBe('dress');
    expect(dressDirOf('models-exp/yrp')).toBe('models-exp/yrp/dress');
    expect(dressDirOf('models-exp/yrp/')).toBe('models-exp/yrp/dress');
    expect(dressIndexUrl('/', 'models-exp/yrp/dress')).toBe('/models-exp/yrp/dress/index.json');
    expect(dressFileUrl('/play', 'models-exp/yrp/dress', 'yuna-white-mage/clipmap.json')).toBe('/play/models-exp/yrp/dress/yuna-white-mage/clipmap.json');
  });

  it('is turned off by ?dress=off and by nothing else', () => {
    expect(dressOff('?dress=off')).toBe(true);
    expect(dressOff('?frame=a&dress=off')).toBe(true);
    for (const q of ['', '?', '?dress=on', '?dress=', '?dresses=off', '?models=base']) expect(dressOff(q), q).toBe(false);
  });
});

describe("which dressphere the battle says: the dressphere in the actor's art id", () => {
  it('reads it off `<girl>-<dressphere>`, through an art namespace and a path', () => {
    expect(dressOfArt('yuna', 'yuna-white-mage')).toBe('white-mage');
    expect(dressOfArt('yuna', 'yuna-floral-fallal')).toBe('floral-fallal');
    expect(dressOfArt('rikku', 'rikku-machina-maw')).toBe('machina-maw');
    expect(dressOfArt('paine', 'paine-full-throttle')).toBe('full-throttle');
    expect(dressOfArt('yuna', 'art/characters/yuna-gunner')).toBe('gunner');
    expect(dressOfArt('yuna', 'exp-leblanc-yuna-gunner')).toBe('gunner');
  });

  it('names none for a bare id, another girl, or nothing', () => {
    for (const art of ['yuna', 'yuna-', 'rikku-thief', 'bahamut', '', undefined, null]) expect(dressOfArt('yuna', art as string), String(art)).toBeNull();
  });
});

describe("a dressphere's own clip map", () => {
  const map = {
    poses: {
      idle: { play: 'loop', clips: ['SEQ_001A10F8'] },
      attack: { play: 'start,hold,finish', clips: ['ATTACK1_00', 'ATTACK1_01', 'ATTACK1_02'] },
      cast: { play: 'start,hold,finish', clips: ['MAGIC2_00', 'MAGIC2_01', 'MAGIC2_02'] },
      hurt: { play: 'once', clips: ['DMG1'] },
      run: { play: 'start,loop', clips: ['RUN_00', 'RUN_01'] },
      ko: { play: 'fall,hold', clips: [] },
      victory: { play: 7, clips: ['WIN_00'] },
    },
  };

  it('reads the poses at its top, the roles of the single-model map, and leaves a malformed pose out (and the poses no battle pose asks for)', () => {
    const plans = plansFromDressClipMap(map)!;
    expect(plans.idle).toEqual({ enter: [], hold: 'SEQ_001A10F8', exit: [] });
    expect(plans.attack).toEqual({ enter: ['ATTACK1_00'], hold: 'ATTACK1_01', exit: ['ATTACK1_02'] });
    expect(plans.hurt).toEqual({ enter: ['DMG1'], hold: null, exit: [] });
    expect(plans.ko, 'no clips').toBeUndefined();
    expect(plans.victory, 'a play that is not a string').toBeUndefined();
    expect(Object.keys(plans)).not.toContain('run');
    expect(plansFromDressClipMap({})).toBeNull();
    expect(plansFromDressClipMap(null)).toBeNull();
  });

  it("keeps only what the file's clips can play, and builds from the names when there is no map", () => {
    const names = ['SEQ_001A10F8', 'ATTACK1_00', 'ATTACK1_01', 'ATTACK1_02', 'DMG1'];
    const plans = dressPlansFor(map, names);
    expect(Object.keys(plans).sort()).toEqual(['attack', 'hurt', 'idle']); // the cast's clips are not in the file
    const byName = dressPlansFor(null, ['APPEAR_00', 'DMG1']);
    expect(byName.idle?.hold).toBe('APPEAR_00');
    expect(byName.hurt).toBeDefined();
    expect(dressPlansFor(map, ['ATTACK1_00']), 'no idle clip: no rig').toEqual({});
  });
});

describe('which dresspheres a girl can change into next (the engine\'s own grid, over Chapter IV\'s build)', () => {
  const reach = reachFor(bevelleBuild.members);

  it('is her two neighbours on the ring from the node she stands on', () => {
    expect(reach('yuna', 'white-mage').sort()).toEqual(['black-mage', 'gunner']);
    expect(reach('rikku', 'dark-knight').sort()).toEqual(['black-mage', 'gunner']);
    expect(reach('paine', 'warrior').sort()).toEqual(['black-mage', 'gunner']);
  });

  it('moves with her: after a change, the new node\'s neighbours (which include the one she left)', () => {
    expect(reach('yuna', 'gunner').sort()).toEqual(['thief', 'white-mage']);
    expect(reach('yuna', 'black-mage').sort()).toEqual(['warrior', 'white-mage']);
  });

  it('reaches nothing from a dressphere that is not on her grid, or for a girl the build lacks', () => {
    expect(reach('yuna', 'floral-fallal')).toEqual([]);
    expect(reachFor([])('yuna', 'white-mage')).toEqual([]);
  });
});

describe("the swap's clock", () => {
  const run = (swap: DressSwap, seconds: number, step = 1 / 60): Array<{ light: number; swap: boolean }> => Array.from({ length: Math.round(seconds / step) }, () => swap.update(step));

  it('lights up, swaps once at the peak with the model in hand, and the light falls off the new model', () => {
    const s = new DressSwap();
    expect(s.active).toBe(false);
    expect(s.update(0.1)).toEqual({ light: 0, swap: false });
    s.start();
    s.ready(true);
    expect(s.active).toBe(true);
    const frames = run(s, SWAP.up + SWAP.down + 0.2);
    const at = frames.findIndex((f) => f.swap);
    expect(at, 'the swap frame').toBeGreaterThanOrEqual(Math.floor(SWAP.up * 60) - 1);
    expect(at).toBeLessThanOrEqual(Math.ceil(SWAP.up * 60) + 1);
    expect(frames.filter((f) => f.swap)).toHaveLength(1);
    expect(frames[at]!.light).toBe(1);
    for (let i = 1; i < at; i++) expect(frames[i]!.light).toBeGreaterThanOrEqual(frames[i - 1]!.light); // up
    for (let i = at + 2; i < frames.length; i++) expect(frames[i]!.light).toBeLessThanOrEqual(frames[i - 1]!.light); // down
    expect(frames.at(-1)!.light).toBe(0);
    expect(s.active).toBe(false);
    expect(s.done).toBe(true);
  });

  it('holds the light at the peak for a model that is late, and swaps when it comes', () => {
    const s = new DressSwap();
    s.start();
    const early = run(s, SWAP.up + 0.5);
    expect(early.every((f) => !f.swap)).toBe(true);
    expect(early.at(-1)!.light).toBe(1);
    s.ready(true);
    expect(s.update(0.016).swap).toBe(true);
  });

  it('cancels with the light falling when the model never comes, or does not within the wait', () => {
    const never = new DressSwap();
    never.start();
    never.ready(false);
    const a = run(never, SWAP.up + SWAP.down + 0.2);
    expect(a.some((f) => f.swap)).toBe(false);
    expect(never.active).toBe(false);
    expect(never.done).toBe(false);
    const late = new DressSwap();
    late.start();
    const b = run(late, SWAP.up + SWAP.wait + SWAP.down + 0.3);
    expect(b.some((f) => f.swap)).toBe(false);
    expect(late.active).toBe(false);
  });

  it('can run again after it ends, and the light is a bright accent that REDUCE FLASHES softens', () => {
    const s = new DressSwap();
    s.start();
    s.ready(true);
    run(s, 1);
    expect(s.active).toBe(false);
    s.start();
    s.ready(true);
    expect(run(s, 1).filter((f) => f.swap)).toHaveLength(1);
    expect(LIGHT.peak).toBeGreaterThan(0.5);
    expect(LIGHT.peak).toBeLessThan(1);
    expect(LIGHT.bleach).toBeGreaterThan(1); // the whole figure goes toward white, not only her edge
    expect(LIGHT.soft).toBeLessThan(0.5);
    expect(SWAP.up + SWAP.down).toBeLessThan(0.6); // short and clean: well inside the presenter's 420 ms flash and sleep
  });
});
