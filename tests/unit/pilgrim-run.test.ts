/**
 * **The Pilgrimage's pure layer** (prototype, FFX only; Bailey, 2026-10-18, decision 122): the road, the boon draw, the run state machine and where a run is kept.
 *
 * Pinned here, with no screen and no engine: every stop is an existing chapter in story order; the draw is seeded and deterministic and offers three distinct boons of the sourced pool; the run
 * walks fight, boons, road, fight and ends on a loss, the finale's win or leaving; a boon lasts one fight; and a run is kept **outside `SaveData`** (the experiments' record and a sibling key).
 *
 * Game case: FFX only (the road is FFX's); the machine and the store are game-neutral.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { getChapter } from '../../src/data/encounters.ts';
import { BOON_POOL, OFFER_SIZE, boonById, drawOffers, isBoonId, seededRandom } from '../../src/app/pilgrim/boons.ts';
import { FIRST_STOP, PILGRIM_FIRST_CHAPTER, ROUTE, ROUTE_LENGTH, STOPS, isFinale, stopById, stopsAt, tierOf } from '../../src/app/pilgrim/route.ts';
import { chooseRoad, currentStop, elapsedMs, finishFight, isBetterRun, leaveRun, newRun, nextOptions, pickBoon, reached, summarize, type RunState } from '../../src/app/pilgrim/runState.ts';
import { PILGRIM_EXPERIMENT_ID, PILGRIM_KEY, readPilgrim, recordRunEnd, recordRunStart, setPilgrimStorageForTests } from '../../src/app/pilgrim/runStore.ts';
import { EXPERIMENTS_KEY, experimentRecord, readExperiments, setExperimentStorageForTests } from '../../src/app/experiments/experimentRecords.ts';

/** Win the fight in front of the player, take the first offer(s), and walk to the first option of the next tier. */
function winAndWalk(run: RunState, now = 0, choose = 0): RunState {
  let r = finishFight(run, 'victory', now);
  while (r.phase === 'boons') r = pickBoon(r, 0);
  if (r.phase === 'road') r = chooseRoad(r, nextOptions(r)[choose]!.id);
  return r;
}

describe('the road', () => {
  it('has four tiers, a fork at stops 2 and 3, and the finale last: every stop is an existing FFX chapter', () => {
    expect(ROUTE.map((tier) => tier.length)).toEqual([1, 2, 2, 1]);
    expect(ROUTE_LENGTH).toBe(4);
    expect(STOPS.map((s) => s.chapter)).toEqual(['seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'mirror-aeons', 'braskas-final-aeon']);
    for (const stop of STOPS) {
      const chapter = getChapter(stop.chapter);
      expect(chapter, stop.chapter).toBeDefined();
      expect(chapter!.game, stop.chapter).toBe('ffx');
      expect(chapter!.title, stop.chapter).toBe(stop.title);
      expect(chapter!.experimental, `${stop.chapter} is a listed chapter, not a hidden experiment`).toBeUndefined();
    }
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
    expect(FIRST_STOP.chapter).toBe(PILGRIM_FIRST_CHAPTER);
  });

  it('keeps the story order (Macalania, then Evrae or Yojimbo, then Natus) and marks only the Mirror Aeons as the Elite, which pays two boons and has a fixed party', () => {
    const numbers = (tier: number): number[] => stopsAt(tier).map((s) => getChapter(s.chapter)!.number);
    expect(numbers(0)).toEqual([7]);
    expect(numbers(1)).toEqual([8, 9]);
    expect(numbers(2)).toEqual([10, 27]);
    expect(STOPS.filter((s) => s.elite).map((s) => s.id)).toEqual(['mirror']);
    expect(stopById('mirror')).toMatchObject({ pays: 2, fixedParty: true });
    expect(STOPS.filter((s) => !s.elite && s.id !== 'braska').every((s) => s.pays === 1)).toBe(true);
    expect(stopById('braska').pays).toBe(0);
    expect(isFinale('braska')).toBe(true);
    expect(isFinale('natus')).toBe(false);
    expect(tierOf('yojimbo')).toBe(1);
  });
});

describe('the boon pool and its draw', () => {
  it('is ten rows, each a real FFX item or auto-ability with a source, or the one labelled NEW', () => {
    expect(BOON_POOL.map((b) => b.id)).toEqual(['light-curtain', 'lunar-curtain', 'star-curtain', 'healing-spring', 'stamina-tablet', 'mega-phoenix', 'auto-haste', 'auto-regen', 'auto-phoenix', 'overdrive-charged']);
    expect(BOON_POOL.filter((b) => b.isNew).map((b) => b.id)).toEqual(['overdrive-charged']);
    for (const b of BOON_POOL) {
      expect(b.src.length, b.id).toBeGreaterThan(10);
      expect(b.fx.length, b.id).toBeGreaterThan(10);
      if (b.effect.kind === 'item') expect(b.src, b.id).toMatch(/src\/data\/ffx\/items\/.*combat-core 8\.2/);
      if (b.effect.kind === 'auto-ability') expect(b.src, b.id).toMatch(/combat-core 9/);
      if (b.isNew) expect(b.src, b.id).toMatch(/^NEW, ours/);
    }
    expect(boonById('auto-regen').effect).toMatchObject({ kind: 'auto-ability', ability: 'auto-regen' });
    expect(isBoonId('auto-haste')).toBe(true);
    expect(isBoonId('free-win')).toBe(false);
  });

  it('offers three distinct boons, the same three for the same seed and pick, and a different set for another pick or seed', () => {
    const a = drawOffers(1234, 0);
    expect(a).toHaveLength(OFFER_SIZE);
    expect(new Set(a).size).toBe(OFFER_SIZE);
    expect(drawOffers(1234, 0)).toEqual(a);
    const sets = new Set<string>();
    for (let pick = 0; pick < 12; pick++) for (const seed of [1, 2, 3, 99, 5000]) sets.add(drawOffers(seed, pick).join(','));
    expect(sets.size).toBeGreaterThan(20);
    for (const seed of [1, 7, 4242]) for (const pick of [0, 1, 2, 3]) for (const id of drawOffers(seed, pick)) expect(isBoonId(id)).toBe(true);
  });

  it('never offers a boon the fight already holds, and every pool row can be drawn', () => {
    for (let pick = 0; pick < 30; pick++) {
      const held = drawOffers(77, pick);
      for (const id of drawOffers(77, pick + 100, held)) expect(held).not.toContain(id);
    }
    const seen = new Set<string>();
    for (let pick = 0; pick < 200; pick++) for (const id of drawOffers(31, pick)) seen.add(id);
    expect(seen.size).toBe(BOON_POOL.length);
  });

  it('uses a seeded generator, never Math.random', () => {
    const a = seededRandom(5);
    const b = seededRandom(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededRandom(6)()).not.toBe(seededRandom(5)());
  });
});

describe('the run state machine', () => {
  it('starts on the first stop with nothing in the pack and the fight next', () => {
    const run = newRun(9, 1_000);
    expect(run).toMatchObject({ phase: 'fight', road: ['macalania'], won: 0, pack: [], used: [], owed: 0, end: null });
    expect(currentStop(run).id).toBe('macalania');
    expect(reached(run)).toBe(1);
  });

  it('walks fight, boons, road, fight: a win pays one pick, the pick fills the pack, the road is chosen from the next tier', () => {
    let run = newRun(42, 0);
    run = finishFight(run, 'victory', 10);
    expect(run).toMatchObject({ phase: 'boons', won: 1, owed: 1 });
    expect(run.offers).toEqual(drawOffers(42, 0));
    const taken = run.offers[1]!;
    run = pickBoon(run, 1);
    expect(run).toMatchObject({ phase: 'road', pack: [taken], owed: 0, offers: [] });
    expect(nextOptions(run).map((s) => s.id)).toEqual(['evrae', 'yojimbo']);
    run = chooseRoad(run, 'yojimbo');
    expect(run).toMatchObject({ phase: 'fight', road: ['macalania', 'yojimbo'], pack: [taken] });
    expect(reached(run)).toBe(2);
  });

  it('a boon lasts ONE fight: the pack is spent into used when the fight ends, and the next fight starts with an empty one', () => {
    let run = winAndWalk(newRun(5, 0));
    expect(run.pack).toHaveLength(1);
    const first = run.pack[0]!;
    run = finishFight(run, 'victory', 20);
    expect(run.pack).toEqual([]);
    expect(run.used).toEqual([first]);
    run = pickBoon(run, 0);
    expect(run.pack).toHaveLength(1);
    expect(run.used).toEqual([first]);
  });

  it('the Elite pays two picks: two draws that never repeat, and both land in the pack of the finale', () => {
    let run = newRun(11, 0);
    run = winAndWalk(run, 1); // Macalania, on to Evrae
    run = winAndWalk(run, 2, 0); // Evrae, on to the third tier
    expect(currentStop(run).id).toBe('natus');
    let elite = finishFight(winAndWalk(newRun(11, 0), 1), 'victory', 2); // Evrae won: one pick owed
    while (elite.phase === 'boons') elite = pickBoon(elite, 0);
    elite = chooseRoad(elite, 'mirror');
    expect(currentStop(elite)).toMatchObject({ id: 'mirror', elite: true });
    elite = finishFight(elite, 'victory', 3);
    expect(elite).toMatchObject({ phase: 'boons', owed: 2 });
    elite = pickBoon(elite, 0);
    expect(elite).toMatchObject({ phase: 'boons', owed: 1 });
    expect(elite.offers).not.toContain(elite.pack[0]);
    expect(elite.offers).toHaveLength(OFFER_SIZE);
    elite = pickBoon(elite, 1);
    expect(elite).toMatchObject({ phase: 'road', owed: 0 });
    expect(elite.pack).toHaveLength(2);
    expect(new Set(elite.pack).size).toBe(2);
    expect(nextOptions(elite).map((s) => s.id)).toEqual(['braska']);
  });

  it('ends on a loss (lost), on the finale\'s win (won) and on leaving (left); an ended run does not move', () => {
    let run = winAndWalk(newRun(3, 0), 5);
    const lost = finishFight(run, 'defeat', 99);
    expect(lost).toMatchObject({ phase: 'over', end: 'lost', won: 1, endedAt: 99, pack: [] });
    expect(lost.used).toHaveLength(1);
    expect(finishFight(lost, 'victory', 120)).toBe(lost);
    expect(pickBoon(lost, 0)).toBe(lost);
    expect(chooseRoad(lost, 'evrae')).toBe(lost);
    expect(leaveRun(lost, 130)).toBe(lost);

    run = newRun(3, 0);
    for (let stop = 0; stop < ROUTE_LENGTH - 1; stop++) run = winAndWalk(run, stop);
    expect(currentStop(run).id).toBe('braska');
    const won = finishFight(run, 'victory', 500);
    expect(won).toMatchObject({ phase: 'over', end: 'won', won: ROUTE_LENGTH });
    expect(summarize(won, 600)).toMatchObject({ cleared: true, reached: 4, total: 4, won: 4, timeMs: 500 });

    const left = leaveRun(winAndWalk(newRun(3, 0)), 40);
    expect(left).toMatchObject({ phase: 'over', end: 'left' });
    expect(finishFight(newRun(3, 0), 'left', 7)).toMatchObject({ end: 'left', endedAt: 7 });
  });

  it('refuses a call out of turn: a pick with no offers, a road before the picks are done, a stop that is not on the next tier', () => {
    const fighting = newRun(8, 0);
    expect(pickBoon(fighting, 0)).toBe(fighting);
    expect(chooseRoad(fighting, 'evrae')).toBe(fighting);
    const boons = finishFight(fighting, 'victory', 0);
    expect(chooseRoad(boons, 'evrae')).toBe(boons);
    expect(pickBoon(boons, 7)).toBe(boons);
    const road = pickBoon(boons, 0);
    expect(chooseRoad(road, 'natus')).toBe(road);
    expect(chooseRoad(road, 'mirror')).toBe(road);
    expect(finishFight(road, 'victory', 0)).toBe(road);
  });

  it('is deterministic: the same seed and the same choices give the same run', () => {
    const play = (): RunState => winAndWalk(winAndWalk(winAndWalk(newRun(2024, 0), 1), 2), 3);
    expect(play()).toEqual(play());
    expect(winAndWalk(newRun(2024, 0)).pack).toEqual(winAndWalk(newRun(2024, 0)).pack);
  });

  it('counts time from the start to the end, and a better run is more fights won, or the same and faster when both cleared', () => {
    const run = finishFight(newRun(1, 1_000), 'defeat', 61_000);
    expect(elapsedMs(run, 999_999)).toBe(60_000);
    expect(elapsedMs(newRun(1, 1_000), 3_500)).toBe(2_500);
    const a = { won: 3, cleared: false, timeMs: 100 };
    expect(isBetterRun(a, null)).toBe(true);
    expect(isBetterRun({ ...a, won: 4 }, a)).toBe(true);
    expect(isBetterRun({ ...a, won: 2 }, a)).toBe(false);
    expect(isBetterRun({ ...a, timeMs: 50 }, a)).toBe(false);
    expect(isBetterRun({ won: 4, cleared: true, timeMs: 50 }, { won: 4, cleared: true, timeMs: 90 })).toBe(true);
    expect(isBetterRun({ won: 4, cleared: true, timeMs: 90 }, { won: 4, cleared: true, timeMs: 50 })).toBe(false);
  });
});

/** An in-memory storage that records every key written. */
function memory(): { storage: Pick<Storage, 'getItem' | 'setItem'>; written: Map<string, string> } {
  const written = new Map<string, string>();
  return { written, storage: { getItem: (k) => written.get(k) ?? null, setItem: (k, v) => void written.set(k, v) } };
}

describe('where a run is kept: outside SaveData', () => {
  afterEach(() => {
    setPilgrimStorageForTests(undefined);
    setExperimentStorageForTests(undefined);
  });

  it('writes only the sibling key and the experiments\' key, never the save\'s', () => {
    const { storage, written } = memory();
    setPilgrimStorageForTests(storage);
    setExperimentStorageForTests(storage);
    recordRunStart(1);
    let run = newRun(1, 0);
    run = winAndWalk(run, 10);
    recordRunEnd(summarize(finishFight(run, 'defeat', 30), 30), 31);
    expect([...written.keys()].sort()).toEqual([EXPERIMENTS_KEY, PILGRIM_KEY].sort());
    expect(written.has('pyrefly-reprise:save:v1')).toBe(false);
    expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([PILGRIM_EXPERIMENT_ID]);
    expect(experimentRecord(PILGRIM_EXPERIMENT_ID)).toMatchObject({ attempts: 1, clears: 0, bestTimeMs: null });
  });

  it('keeps the best run: a deeper run replaces it, a shallower one does not, and the last run is always the last', () => {
    const { storage } = memory();
    setPilgrimStorageForTests(storage);
    setExperimentStorageForTests(storage);
    const three = { ...summarize(finishFight(winAndWalk(winAndWalk(newRun(4, 0), 1), 2), 'defeat', 50), 50) };
    const kept = recordRunEnd(three, 100);
    expect(kept).toMatchObject({ newBest: true, previousBest: null });
    expect(readPilgrim().best).toMatchObject({ won: 2, reached: 3, cleared: false, finishedAt: 100 });
    const worse = recordRunEnd(summarize(finishFight(newRun(4, 0), 'defeat', 9), 9), 200); // won nothing
    expect(worse.newBest).toBe(false);
    expect(worse.previousBest).toMatchObject({ won: 2 });
    expect(readPilgrim().best).toMatchObject({ won: 2, finishedAt: 100 });
    expect(readPilgrim().last).toMatchObject({ won: 0, finishedAt: 200 });
  });

  it('a finale win is a clear in both records, with its time as the best clear time', () => {
    const { storage } = memory();
    setPilgrimStorageForTests(storage);
    setExperimentStorageForTests(storage);
    recordRunStart(1);
    let run = newRun(6, 0);
    for (let i = 0; i < ROUTE_LENGTH - 1; i++) run = winAndWalk(run, i);
    const won = finishFight(run, 'victory', 4_000);
    const kept = recordRunEnd(summarize(won, 4_000), 4_001);
    expect(kept.newBest).toBe(true);
    expect(readPilgrim()).toMatchObject({ runs: 1, clears: 1, best: { cleared: true, won: 4, timeMs: 4_000 } });
    expect(experimentRecord(PILGRIM_EXPERIMENT_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 4_000 });
    expect(Object.keys(readExperiments())).toEqual([PILGRIM_EXPERIMENT_ID]);
  });

  it('reads an empty record on missing, blocked or corrupt storage, and a failing write does not throw', () => {
    setPilgrimStorageForTests(null);
    setExperimentStorageForTests(null);
    expect(readPilgrim()).toMatchObject({ runs: 0, clears: 0, best: null, last: null });
    expect(() => recordRunStart(1)).not.toThrow();
    expect(() => recordRunEnd(summarize(finishFight(newRun(1, 0), 'defeat', 2), 2), 3)).not.toThrow();
    setPilgrimStorageForTests({ getItem: () => '{not json', setItem: () => { throw new Error('full'); } });
    expect(readPilgrim()).toMatchObject({ runs: 0, best: null });
    expect(() => recordRunEnd(summarize(finishFight(newRun(1, 0), 'defeat', 2), 2), 3)).not.toThrow();
    setPilgrimStorageForTests({ getItem: () => JSON.stringify({ runs: -3, clears: 'x', best: { won: 2.7, reached: 0, cleared: 'yes', timeMs: -5 }, last: 4 }), setItem: () => undefined });
    expect(readPilgrim()).toMatchObject({ runs: 0, clears: 0, best: { won: 2, reached: 1, cleared: false, timeMs: 0 }, last: null });
  });
});

describe('a run that won nothing', () => {
  afterEach(() => {
    setPilgrimStorageForTests(undefined);
    setExperimentStorageForTests(undefined);
  });

  it('is kept as the last run but is never the best, even when there is no best yet', () => {
    const { storage } = memory();
    setPilgrimStorageForTests(storage);
    setExperimentStorageForTests(storage);
    const kept = recordRunEnd(summarize(finishFight(newRun(2, 0), 'defeat', 5), 5), 10);
    expect(kept).toMatchObject({ newBest: false, previousBest: null });
    expect(readPilgrim()).toMatchObject({ best: null, last: { won: 0, reached: 1 } });
  });
});
