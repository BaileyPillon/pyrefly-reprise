import { describe, expect, it, vi } from 'vitest';
import { Group, Object3D, Scene } from 'three';
import { isActor, Roster } from '../../src/engine/fx/mix/roster.ts';

/**
 * The MAX mix's roster of painted figures (r38-restage CHECK, B2). It used to be rescanned on a 0.5 s timer only, so a figure that arrived mid-fight (a
 * Switch, a summoned aeon) stood on the stage's own slot until the next scan and then stepped into the chapter's slot in one frame (traced: the stage
 * added Wakka at t, the mix's list took him 163 ms later, and his first write moved him +0.35 world units). Now the list is stale the moment a figure
 * is added to the scene or leaves it.
 */
const figure = (name: string, facing = 1): Object3D => {
  const o = new Object3D();
  o.name = name;
  Object.assign(o, { worldHeight: 1.8, slots: [], poseUrls: {}, facing });
  return o;
};
const names = (r: readonly Object3D[]): string[] => r.map((o) => o.name);

describe('Roster', () => {
  it('reads a painted figure by the three properties the mix always read', () => {
    expect(isActor(figure('a'))).toBe(true);
    expect(isActor(new Object3D())).toBe(false);
  });

  it('has a figure added to the scene in the very next update, with no wait for the timer', () => {
    const scene = new Scene();
    scene.add(figure('tidus'), figure('yuna'));
    const roster = new Roster(scene);
    expect(names(roster.update(0.016))).toEqual(['tidus', 'yuna']);
    // 16 ms later (a frame), a Switch brings Wakka in: the old timer (0.5 s) would not have looked yet.
    scene.add(figure('wakka'));
    expect(names(roster.update(0.016))).toEqual(['tidus', 'yuna', 'wakka']);
  });

  it('drops a figure that leaves the scene at once', () => {
    const scene = new Scene();
    const yuna = figure('yuna');
    scene.add(figure('tidus'), yuna);
    const roster = new Roster(scene);
    roster.update(0.016);
    scene.remove(yuna);
    expect(names(roster.update(0.016))).toEqual(['tidus']);
  });

  it('does not rescan the scene for a child that is not a figure (a hit effect, a particle burst)', () => {
    const scene = new Scene();
    scene.add(figure('tidus'));
    const roster = new Roster(scene);
    roster.update(0.016);
    const traverse = vi.spyOn(scene, 'traverse');
    for (let i = 0; i < 20; i++) {
      const fx = new Object3D();
      scene.add(fx);
      roster.update(0.005);
      scene.remove(fx);
      roster.update(0.005);
    }
    expect(traverse).not.toHaveBeenCalled(); // 40 updates, 0.2 s: no scan for 40 effects, the timer's own is not due yet
    roster.update(0.5);
    expect(traverse).toHaveBeenCalledTimes(1);
  });

  it('keeps the timer as the net for a figure added deeper in the graph', () => {
    const scene = new Scene();
    scene.add(figure('tidus'));
    const roster = new Roster(scene);
    roster.update(0.016);
    const group = new Group();
    scene.add(group);
    group.add(figure('aeon')); // the scene hears about the group, not about its child
    expect(names(roster.update(0.016))).toEqual(['tidus']);
    expect(names(roster.update(0.5))).toEqual(['tidus', 'aeon']);
  });

  it('stops listening when disposed', () => {
    const scene = new Scene();
    scene.add(figure('tidus'));
    const roster = new Roster(scene);
    roster.update(0.016);
    roster.dispose();
    expect(roster.actors).toEqual([]);
    const traverse = vi.spyOn(scene, 'traverse');
    scene.add(figure('wakka')); // no listener left to mark the list stale
    roster.update(0.016);
    expect(traverse).toHaveBeenCalledTimes(1); // only because the list was emptied by dispose (nothing to read), not because of the new child
    expect(names(roster.update(0.016))).toEqual(['tidus', 'wakka']);
  });

  it('works on a stub scene with no events (the timer alone)', () => {
    const stub = { traverse: (fn: (o: Object3D) => void) => fn(figure('tidus')) } as unknown as Object3D;
    const roster = new Roster(stub);
    expect(names(roster.update(0.016))).toEqual(['tidus']);
    expect(() => roster.dispose()).not.toThrow();
  });
});
