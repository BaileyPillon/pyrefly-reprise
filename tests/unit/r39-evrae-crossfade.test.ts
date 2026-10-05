/**
 * Release 39 HOLD fix R39F-02 (FFX only; Chapter VIII's Evrae): Evrae changes pose by crossfade again, as on live release 38.
 *
 * PR-0367 (9ff5760f) had made each of its pose changes a hard cut, so a hit no longer drew two heads at half strength. The continuity harness
 * (CHK-027, D-424: at most 0.25 snaps a minute) counted that as 107 snaps in 5.5 minutes, 19.5 a minute against live's 0.46, so the cut was
 * reverted for release 39. Whether Evrae gets the cut back, a short hold, or an authored in-between pose is Bailey's call (the pose-continuity
 * decision); nothing here picks a third behaviour. This pins the crossfade until that is decided, and FF7's whole-scene cut as it was.
 */
import { describe, expect, it } from 'vitest';
import { stagingOf } from '../../src/scenes/types.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../src/scenes/evrae-airship-deck.ts';
import { SECTOR1_SLOTS } from '../../src/scenes/sector1-reactor.ts';

describe('Evrae crossfades between its poses again (R39F-02)', () => {
  it('the Chapter VIII deck names no pose cut, for Evrae or for the party', () => {
    for (const slots of [EVRAE_AIRSHIP_DECK_SLOTS, stagingOf(EVRAE_AIRSHIP_DECK_SLOTS)]) {
      expect('poseCut' in slots).toBe(false);
      expect('poseCutArt' in slots).toBe(false);
    }
  });

  it('FF7\'s film scenes still cut between their painted keys (the one scene switch that is left)', () => {
    expect(SECTOR1_SLOTS.poseCut).toBe(true);
  });
});
