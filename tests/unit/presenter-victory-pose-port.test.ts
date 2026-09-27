/**
 * B2 part 1: A-4's `victoryPose` port (both games' plumbing; the values are
 * per chapter and land in B5's chapter-meta). `'pose'` is today's behaviour
 * and the default; `'hold'` is the sources' "keep the battle stance"
 * (research/ffx-vs-ffx2-presentation.md §2.1 Zanarkand, §2.2 Bahamut, Shuyin,
 * Trema).
 */

import { describe, expect, it } from 'vitest';
import { victoryPoseOf, VICTORY_POSES } from '../../src/engine/VictoryPose.ts';

describe('victoryPose port', () => {
  it('defaults to pose when the screen passes nothing', () => {
    expect(victoryPoseOf({})).toBe('pose');
    expect(victoryPoseOf({ victoryPose: undefined })).toBe('pose');
  });

  it('passes both values through', () => {
    expect(victoryPoseOf({ victoryPose: 'pose' })).toBe('pose');
    expect(victoryPoseOf({ victoryPose: 'hold' })).toBe('hold');
    expect(VICTORY_POSES).toEqual(['pose', 'hold']);
  });

  it('reads anything else as the default, never as hold', () => {
    expect(victoryPoseOf({ victoryPose: 'HOLD' as never })).toBe('pose');
    expect(victoryPoseOf({ victoryPose: null as never })).toBe('pose');
  });
});
