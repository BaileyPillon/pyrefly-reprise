/**
 * A figure that leaves some other way than being sent never draws a `ko`
 * painting (fix12 presenter): Evrae's `ko.png` is outside the approved set
 * (docs/target/approved-hashes.json chapter:evrae:2026-09-23) and its defeat is
 * the fall (D-031), so its `ko` pose points at the approved `hurt` painting.
 */

import { describe, expect, it } from 'vitest';
import { departurePoses } from '../../src/engine/BattlePresenterDepartures.ts';
import { resolvePoseName } from '../../src/engine/BattlePresenterActors.ts';

const EVRAE = {
  idle: '/art/characters/evrae/idle.png',
  attack: '/art/characters/evrae/idle.png',
  cast: '/art/characters/evrae/idle.png',
  hurt: '/art/characters/evrae/hurt.png',
  ko: '/art/characters/evrae/ko.png',
};

describe('departurePoses', () => {
  it("points Evrae's ko at its hurt painting, so ko.png is never drawn or fetched", () => {
    const out = departurePoses('evrae', EVRAE);
    expect(out.ko).toBe(EVRAE.hurt);
    expect(Object.values(out).some((u) => u.endsWith('/ko.png'))).toBe(false);
    // Every other pose is untouched.
    expect({ ...out, ko: EVRAE.ko }).toEqual(EVRAE);
    // And a `setPose('ko')` still resolves to a pose name the actor has.
    expect(resolvePoseName('ko', (p) => p in out)).toBe('ko');
  });

  it('falls back to idle when there is no hurt painting (a yielding figure)', () => {
    const out = departurePoses('ormi', { idle: '/art/characters/ormi/idle.png', ko: '/art/characters/ormi/ko.png' });
    expect(out.ko).toBe('/art/characters/ormi/idle.png');
  });

  it('leaves a dissolving fiend and a party member alone', () => {
    const fiend = { idle: 'a/idle.png', hurt: 'a/hurt.png', ko: 'a/ko.png' };
    expect(departurePoses('yu-pagoda-left', fiend)).toBe(fiend);
    expect(departurePoses('tidus', fiend)).toBe(fiend);
  });

  it("keeps Seymour's own ko painting if he ever has one: a body lies down (D-046)", () => {
    const map = { idle: 's/idle.png', hurt: 's/hurt.png', ko: 's/ko.png' };
    expect(departurePoses('seymour-macalania', map)).toBe(map);
  });

  it('does not add a ko pose to a map that has none', () => {
    const map = { idle: 'e/idle.png', hurt: 'e/hurt.png' };
    expect(departurePoses('evrae', map)).toBe(map);
  });
});
