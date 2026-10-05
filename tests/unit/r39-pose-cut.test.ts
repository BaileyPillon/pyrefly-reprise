/**
 * Round 21, PR-0367 (FFX only; Chapter VIII's Evrae): a pose crossfade drew Evrae with two heads at half strength (its hurt throws the
 * head back, its attack puts it aside; the body is the same pixels), so the scene names Evrae's art as one that cuts between poses. The party
 * on the same deck keeps its crossfade; FF7's whole-scene `poseCut` is untouched.
 */
import { describe, expect, it } from 'vitest';
import { posesCut } from '../../src/engine/PoseCut.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../src/scenes/evrae-airship-deck.ts';
import { SECTOR1_SLOTS } from '../../src/scenes/sector1-reactor.ts';
import { GARDEN_OF_PAIN_SLOTS } from '../../src/scenes/garden-of-pain.ts';

describe('which figures cut between poses', () => {
  it('none by default (the house crossfade), the whole scene when it says so, only the named art when it names some', () => {
    expect(posesCut(undefined, undefined, 'evrae')).toBe(false);
    expect(posesCut(true, undefined, 'tidus')).toBe(true);
    expect(posesCut(undefined, ['evrae'], 'evrae')).toBe(true);
    expect(posesCut(undefined, ['evrae'], 'tidus')).toBe(false);
    expect(posesCut(undefined, [], 'evrae')).toBe(false);
  });

  it('the staging a scene publishes carries the list through', () => {
    expect(stagingOf({ poseCutArt: ['evrae'] }).poseCutArt).toEqual(['evrae']);
    expect('poseCutArt' in stagingOf({})).toBe(false);
  });

  it('Chapter VIII\'s deck names Evrae and nobody else; the party keeps its crossfade', () => {
    expect(EVRAE_AIRSHIP_DECK_SLOTS.poseCutArt).toEqual(['evrae']);
    expect(EVRAE_AIRSHIP_DECK_SLOTS.poseCut).toBeUndefined();
    for (const party of ['tidus', 'wakka', 'rikku', 'yuna', 'auron', 'kimahri', 'lulu']) expect(posesCut(EVRAE_AIRSHIP_DECK_SLOTS.poseCut, EVRAE_AIRSHIP_DECK_SLOTS.poseCutArt, party)).toBe(false);
    expect(posesCut(EVRAE_AIRSHIP_DECK_SLOTS.poseCut, EVRAE_AIRSHIP_DECK_SLOTS.poseCutArt, 'evrae')).toBe(true);
  });

  it('other scenes are as they were: FF7 cuts for every figure, the Garden of Pain for none', () => {
    expect(SECTOR1_SLOTS.poseCut).toBe(true);
    expect(posesCut(GARDEN_OF_PAIN_SLOTS.poseCut, GARDEN_OF_PAIN_SLOTS.poseCutArt, 'seymour-omnis')).toBe(false);
  });
});
