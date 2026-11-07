/**
 * **The Flooded Ways' first area is not pulsed to the plate it opens on** (r76c review, MINOR 3; shared plumbing, both games; in use FFX only). The chapter's first link names `FLOODED_PLATES.area1`, the plate the scene already
 * shows, so the battle screen put a 900 ms white pulse over the opening and rebuilt the painting plane for a swap that changed nothing. `swapLinkPlate` (`app/screens/BattleScreenPlate.ts`, the block that was inline in
 * `BattleScreenEncounter.onLink`) now skips both for a scene that reports the plate showing (`LoadedScene.plateKey`). Every other scene has no `plateKey` and pulses and swaps for every plate a link names, as before.
 */
import { describe, expect, it, vi } from 'vitest';
import { linkPlateOwed, PLATE_PULSE_MS, swapLinkPlate } from '../../../src/app/screens/BattleScreenPlate.ts';
import { FLOODED_LINKS, FLOODED_PLATE, FLOODED_PLATES } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { DARK_SIX_LINKS } from '../../../src/data/ffx/dark-aeons-six-ids.ts';

/** A scene double that remembers the plate it shows, as the Via Purifico stage does. */
function reportingScene(opening: string) {
  let shown = opening;
  const swaps: string[] = [];
  return {
    swaps,
    swapBackdrop: vi.fn(async (key: string): Promise<void> => {
      swaps.push(key);
      shown = key;
    }),
    plateKey: (): string => shown,
  };
}

/** A scene double with no `plateKey`, like every scene but the flooded one. */
function plainScene() {
  const swaps: string[] = [];
  return { swaps, swapBackdrop: vi.fn(async (key: string): Promise<void> => void swaps.push(key)) };
}

function ports() {
  const flashes: Array<[string, number]> = [];
  const hudCalls: boolean[] = [];
  return {
    flashes,
    hudCalls,
    stage: { screenFlash: (colour: string, ms: number): void => void flashes.push([colour, ms]) },
    hud: { setVisible: (v: boolean): void => void hudCalls.push(v) },
  };
}

describe('the Flooded Ways\' links and the plate the scene opens on', () => {
  it('opens on the first area\'s plate, which is the first link\'s own: the case the pulse used to cover for nothing', () => {
    expect(FLOODED_PLATE).toBe(FLOODED_PLATES.area1);
    expect(FLOODED_LINKS[0]!.plate).toBe(FLOODED_PLATE);
    for (const link of FLOODED_LINKS.slice(1)) expect(link.plate, `${link.key} is another plate`).not.toBe(FLOODED_PLATE);
  });

  it('the first link owes no pulse and no swap; each later link owes both', async () => {
    const scene = reportingScene(FLOODED_PLATE);
    const p = ports();
    expect(swapLinkPlate({ scene, ...p, group: { plate: FLOODED_LINKS[0]!.plate } })).toBe(false);
    expect(p.flashes).toEqual([]);
    expect(scene.swaps).toEqual([]);
    for (const link of FLOODED_LINKS.slice(1)) {
      expect(swapLinkPlate({ scene, ...p, group: { plate: link.plate } }), link.key).toBe(true);
      await Promise.resolve();
    }
    expect(scene.swaps).toEqual(FLOODED_LINKS.slice(1).map((l) => l.plate));
    expect(p.flashes).toEqual(FLOODED_LINKS.slice(1).map(() => ['#ffffff', PLATE_PULSE_MS]));
  });

  it('a retry from a later link builds a fresh scene on the first plate, so that link still swaps; a retry from the first link does not', () => {
    for (const [i, link] of FLOODED_LINKS.entries()) {
      const fresh = reportingScene(FLOODED_PLATE);
      expect(linkPlateOwed(fresh, link.plate), `${link.key} on a fresh scene`).toBe(i > 0);
    }
  });

  it('a second link naming the plate now showing is not pulsed either (the scene follows each swap)', async () => {
    const scene = reportingScene(FLOODED_PLATE);
    const p = ports();
    expect(swapLinkPlate({ scene, ...p, group: { plate: FLOODED_PLATES.area2 } })).toBe(true);
    await Promise.resolve();
    expect(swapLinkPlate({ scene, ...p, group: { plate: FLOODED_PLATES.area2 } })).toBe(false);
    expect(p.flashes).toHaveLength(1);
  });
});

describe('every other scene is unchanged: no plateKey, so every named plate pulses and swaps', () => {
  it('a plain scene flashes and swaps for a link whatever plate it names, even the one it opened on', async () => {
    const scene = plainScene();
    const p = ports();
    expect(linkPlateOwed(scene, 'mushroom-rock-road-ruined')).toBe(true);
    expect(swapLinkPlate({ scene, ...p, group: { plate: 'mushroom-rock-road-ruined' } })).toBe(true);
    expect(swapLinkPlate({ scene, ...p, group: { plate: 'mushroom-rock-road-ruined' } })).toBe(true);
    await Promise.resolve();
    expect(scene.swaps).toEqual(['mushroom-rock-road-ruined', 'mushroom-rock-road-ruined']);
    expect(p.flashes).toEqual([['#ffffff', 900], ['#ffffff', 900]]);
  });

  it('the Dark Aeons\' links (a plain scene, one plate per link, Ixion twice on one plate) all pulse and swap as they did', async () => {
    const scene = plainScene();
    const p = ports();
    for (const link of DARK_SIX_LINKS) expect(swapLinkPlate({ scene, ...p, group: { plate: link.plate, restoresAeonsOnEntry: true } }), link.key).toBe(true);
    await Promise.resolve();
    expect(scene.swaps).toEqual(DARK_SIX_LINKS.map((l) => l.plate));
    expect(p.flashes).toHaveLength(DARK_SIX_LINKS.length);
  });

  it('a group that names no plate, a scene that cannot swap, and a missing scene do nothing', () => {
    const p = ports();
    const scene = plainScene();
    expect(swapLinkPlate({ scene, ...p, group: {} })).toBe(false);
    expect(swapLinkPlate({ scene: {}, ...p, group: { plate: 'x' } })).toBe(false);
    expect(swapLinkPlate({ scene: null, ...p, group: { plate: 'x' } })).toBe(false);
    expect(swapLinkPlate({ scene: undefined, ...p, group: { plate: 'x' } })).toBe(false);
    expect(p.flashes).toEqual([]);
    expect(scene.swaps).toEqual([]);
  });

  it('works with no stage and no HUD yet (a scene entered before either exists)', async () => {
    const scene = plainScene();
    expect(swapLinkPlate({ scene, stage: null, hud: null, group: { plate: 'x', restoresAeonsOnEntry: true } })).toBe(true);
    await Promise.resolve();
    expect(scene.swaps).toEqual(['x']);
  });
});

describe('the fresh-fight HUD is taken off the screen under the pulse and put back once the plate is in (unchanged)', () => {
  it('hides the HUD at once for a link that restores the aeons, and shows it again when the swap settles', async () => {
    const scene = reportingScene(FLOODED_PLATE);
    const p = ports();
    swapLinkPlate({ scene, ...p, group: { plate: FLOODED_PLATES.area3, restoresAeonsOnEntry: true } });
    expect(p.hudCalls).toEqual([false]);
    await new Promise((r) => setTimeout(r, 0));
    expect(p.hudCalls).toEqual([false, true]);
  });

  it('leaves the HUD alone for a link that does not restore the aeons', async () => {
    const scene = reportingScene(FLOODED_PLATE);
    const p = ports();
    swapLinkPlate({ scene, ...p, group: { plate: FLOODED_PLATES.area3 } });
    await new Promise((r) => setTimeout(r, 0));
    expect(p.hudCalls).toEqual([]);
  });

  it('a link that owes no swap does not touch the HUD even when it restores the aeons', async () => {
    const scene = reportingScene(FLOODED_PLATE);
    const p = ports();
    swapLinkPlate({ scene, ...p, group: { plate: FLOODED_PLATE, restoresAeonsOnEntry: true } });
    await new Promise((r) => setTimeout(r, 0));
    expect(p.hudCalls).toEqual([]);
    expect(p.flashes).toEqual([]);
  });
});
