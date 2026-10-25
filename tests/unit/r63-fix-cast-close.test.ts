/**
 * R63-PLAY, the overnight fix of the skeptic's m3 (FFX only: the caster close shots are Chapter I's, retail camera programs): an ally cast's close shot keeps the whole group clear of the HUD's party plates.
 * The skeptic's Hastega frame (Tidus's team buff pushes in on him) stood Yuna and Kimahri where the slim party cards cut them off at the hips. The fit now holds the caster and the party members who stand
 * with her inside the victory frame's rectangle (`VICTORY_SAFE` about `VICTORY_AT`: clear of the plates and of the turn-order column), as the victory shot always did.
 */
import { describe, expect, it } from 'vitest';
import { castPlay, VICTORY_AT, VICTORY_SAFE } from '../../src/engine/procam/ProPlays.ts';
import type { PlayEnv, Timing } from '../../src/engine/procam/ProPlays.ts';

const timing: Timing = { ms: (n) => n, rate: 1 };

function env(positions: Record<string, [number, number, number]>, sides: Record<string, 'party' | 'enemy'>): PlayEnv {
  const actor = (id: string) => (positions[id] ? ({ position: { x: positions[id]![0], y: positions[id]![1], z: positions[id]![2] } } as never) : undefined);
  return {
    stage: {
      actor,
      sideOf: (id: string) => sides[id],
      artOf: (id: string) => id,
      staged: () => Object.keys(positions),
    } as never,
    still: false,
    game: () => 'ffx',
    dice: () => 0,
    fo: (ids: string[]) => ids,
    fitId: (id: string) => id,
    bossOf: (f: string) => f,
    spot: () => ({ actor: [-1.55, 0, 1.55], target: [-1.55, 0, 1.55], height: 1.75 }),
  } as unknown as PlayEnv;
}

const SIDES = { tidus: 'party', yuna: 'party', kimahri: 'party', seymour: 'enemy' } as const;
const POS = { tidus: [-1.55, 0, 1.55], yuna: [-2.95, 0, 0.25], kimahri: [-1.05, 0, -1.05], seymour: [1.95, 0, -2.45] } as Record<string, [number, number, number]>;
const ctx = (id: string) => ({ actor: { id }, targets: [], action: { kind: 'cast', ability: 'hastega' } }) as never;

describe('an ally cast keeps the party clear of the HUD plates', () => {
  it('Hastega (the party): the caster and the members who stand with him are fitted inside the victory frame', () => {
    const play = castPlay(env(POS, SIDES), ctx('tidus'), 'tidus', timing)!;
    expect(play).not.toBeNull();
    expect(play.run.fit?.ids).toEqual(['tidus', 'yuna', 'kimahri']);
    expect(play.run.fit?.safe).toEqual(VICTORY_SAFE);
    expect(play.run.fit?.to).toEqual(VICTORY_AT);
  });

  it('a cast on a foe is framed as it always was (the caster and the foe, no frame for the HUD)', () => {
    const play = castPlay(env(POS, SIDES), ctx('tidus'), 'seymour', timing)!;
    expect(play.run.fit?.ids).toEqual(['tidus', 'seymour']);
    expect(play.run.fit?.to).toBeUndefined();
  });

  it('a member far from the caster is not held in the frame (the victory\'s own 4.5 m)', () => {
    const far = { ...POS, kimahri: [9, 0, -9] } as Record<string, [number, number, number]>;
    const play = castPlay(env(far, SIDES), ctx('tidus'), 'tidus', timing)!;
    expect(play.run.fit?.ids).toEqual(['tidus', 'yuna']);
  });
});
