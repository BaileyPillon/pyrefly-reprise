/**
 * `tools/swap-classes.mjs` (lane L1, MF-01 and MF-05): the swap classes, the INTERLUDE (ready>idle then idle>X within 150 ms) and the stance reading, over synthetic swaps in the shape of continuity.json.
 * The numbers it must give on the real runs (release 64 Chapter IV: 59 interludes, 514 of 931 ghost frames) were checked by hand against the swaps audit; this pins the arithmetic.
 */
import { describe, expect, it } from 'vitest';
// @ts-expect-error a plain .mjs tool
import { analyse, findInterludes, interludeSummary, priceStance, swapClass } from '../../tools/swap-classes.mjs';

interface Sw {
  id: number;
  figure: string;
  fromPose: string;
  toPose: string;
  tMs: number;
  counted?: boolean;
  ghost?: { frames: number; ms: number; severity: number };
  notShowing?: boolean;
}
let id = 0;
const sw = (figure: string, fromPose: string, toPose: string, tMs: number, frames = 3): Sw => ({ id: ++id, figure, fromPose, toPose, tMs, counted: true, ghost: { frames, ms: frames * 17, severity: 0.25 } });

describe('swapClass: the player\'s words', () => {
  it('names the stance, the cause and the return swaps', () => {
    expect(swapClass({ fromPose: 'idle', toPose: 'ready' })).toBe('Stance up (idle to ready)');
    expect(swapClass({ fromPose: 'ready', toPose: 'idle' })).toBe('Stance down (ready to idle)');
    expect(swapClass({ fromPose: 'attack', toPose: 'follow' })).toBe('Strike follow-through (attack to follow)');
    expect(swapClass({ fromPose: 'follow', toPose: 'idle' })).toBe('Return home (follow to idle)');
    expect(swapClass({ fromPose: 'idle', toPose: 'hurt' })).toBe('Hurt (hit lands)');
    expect(swapClass({ fromPose: 'hurt', toPose: 'idle' })).toBe('Hurt recovery');
    expect(swapClass({ fromPose: 'ready', toPose: 'cast' })).toBe('Cast begins (ready to cast)');
    expect(swapClass({ fromPose: 'idle', toPose: 'cast' })).toBe('Cast begins (idle to cast)');
    expect(swapClass({ fromPose: 'idle', toPose: 'critical' })).toBe('Critical (to low-HP stance)');
    expect(swapClass({ rig: true, fromPose: 'a', toPose: 'b' })).toBe('RIG key flip (boss)');
  });
});

describe('the interlude: ready>idle then idle>X within 150 ms', () => {
  it('finds the attack triple, the cast and the item, whichever X; not two separate turns', () => {
    const swaps = [
      sw('rikku', 'idle', 'ready', 1000),
      sw('rikku', 'ready', 'idle', 5000), sw('rikku', 'idle', 'ready', 5100), // the flicker's halves, 100 ms apart
      sw('yuna', 'ready', 'idle', 6000), sw('yuna', 'idle', 'cast', 6117), // ready, idle, cast
      sw('yuna', 'ready', 'idle', 9000), sw('yuna', 'idle', 'item', 9118),
      sw('paine', 'ready', 'idle', 12000), sw('paine', 'idle', 'ready', 15300), // two real turns 3.3 s apart: not an interlude
    ];
    const found = findInterludes(swaps, 150);
    expect(found.map((f: { figure: string; to: string }) => `${f.figure}>${f.to}`)).toEqual(['rikku>ready', 'yuna>cast', 'yuna>item']);
    expect(found[0].gapMs).toBe(100);
    expect(found.every((f: { counted: boolean }) => f.counted)).toBe(true);
    const sum = interludeSummary(found, { battleSeconds: 60, totalGhostFrames: swaps.length * 3 });
    expect(sum).toMatchObject({ count: 3, perMinute: 3, ghostFrames: 18, byTo: { ready: 1, cast: 1, item: 1 } });
  });

  it('a swap belongs to one interlude at most, and another figure\'s swap in between does not join them', () => {
    const swaps = [sw('a', 'ready', 'idle', 0), sw('b', 'idle', 'cast', 50), sw('a', 'idle', 'ready', 120)];
    const found = findInterludes(swaps, 150);
    expect(found).toHaveLength(1);
    expect(found[0].figure).toBe('a');
  });
});

describe('the stance reading and the price of MF-05', () => {
  const run = () => {
    id = 0;
    const swaps = [
      sw('tidus', 'idle', 'ready', 1000, 4), // the menu opens
      sw('tidus', 'ready', 'attack', 4000, 0), // the strike opens on the ready painting
      sw('tidus', 'attack', 'follow', 4800, 0),
      sw('yuna', 'idle', 'ready', 6000, 4),
      sw('yuna', 'ready', 'cast', 9000, 3),
      sw('yuna', 'cast', 'idle', 9800, 3),
      sw('kimahri', 'idle', 'ready', 12000, 4),
      sw('kimahri', 'ready', 'idle', 14000, 3), // the menu was left: after-action
    ];
    return analyse({ chapter: 'x', game: 'ffx', summary: { battleSeconds: 60 }, swaps }, 'synthetic');
  };

  it('reads the menu, the wind-up and the after-action from the neighbours', () => {
    const r = run();
    const by = (k: string) => r.stanceRows.find((s: { reading: string }) => s.reading === k);
    expect(by('menu').swaps).toBe(3);
    expect(by('after-action').swaps).toBe(1);
    expect(r.swaps.find((s: Sw) => s.id === 1).stance).toBe('menu'); // the strike follows 3 s later: not a wind-up
  });

  it('a wind-up is an idle>ready right before the figure\'s own ready>attack', () => {
    id = 0;
    const r = analyse({ chapter: 'x', summary: { battleSeconds: 60 }, swaps: [sw('a', 'idle', 'ready', 1000), sw('a', 'ready', 'attack', 1200)] }, 's');
    expect(r.swaps[0].stance).toBe('wind-up');
  });

  it('prices V1b as all the stance swaps gone and V1a as the same less one blend per strike on ready', () => {
    const p = priceStance(run());
    // stance swaps: 3 up (4,4,4 frames) + 1 down (3) = 15 frames; one strike on ready; the mean up is 4 frames
    expect(p.stanceSwaps).toBe(4);
    expect(p.strikesOnReady).toBe(1);
    expect(p.v1b.removes.ghostFramesPerMin).toBe(15);
    expect(p.v1a.removes.ghostFramesPerMin).toBe(11);
    expect(p.v1b.chapterAfterFramesPerMin).toBe(p.v1a.chapterAfterFramesPerMin - 4);
  });
});
