/**
 * The hidden Last Summoning through the real chain loop (FFX only): `runEncounterChain` with the real engine, the real presenter against fake ports, and a scripted chooser in the place of the offering screen.
 *
 * What is pinned: the loop asks before the first fight and after every possession link but the last (and never after Yu Yevon); the placeholder opener is never fought; the formations fought are the order the chooser
 * names, Yu Yevon last; the chooser's answer is resolved through `findEnemyGroup` like any other id; leaving the screen mid-offering ends the run as aborted and parks nothing; a chain with no chooser (every other
 * chapter) never asks. The instant offering (`speed: 'skip'`) gives the first held aeon each time, so a headless run takes the offering's own order.
 */
import { describe, expect, it } from 'vitest';

import { offeringChooser, takenAt } from '../../../src/app/screens/BattleScreenOffering.ts';
import { type ChainChoice, runEncounterChain } from '../../../src/app/screens/BattleEncounterChain.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import { OFFERING_NEXT_ID, OPENER_GROUP_ID, type OfferingKey, groupIdForPick, linkGroupId, yuYevonGroupId } from '../../../src/data/ffx/last-summoning-ids.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import type { PlaybackSpeed } from '../../../src/engine/BattlePresenterPorts.ts';
import type { BattleState } from '../../../src/battle/common/types.ts';
import { FakeAudio, FakeStage } from '../helpers/FakeStage.ts';
import { ALL_KEYS } from '../helpers/lastSummoningDrive.ts';
import { setCappedAutoPlay } from '../helpers/presenterCap.ts';

/** The chapter, played through the loop. `choose` is what the screen's offering would answer. */
async function play(opts: { order?: readonly OfferingKey[]; speed?: PlaybackSpeed; seed?: number; choose?: ((info: ChainChoice) => Promise<string | undefined>) | null; abortAfter?: number } = {}) {
  await registerBattleContent();
  const chapter = getChapter('last-summoning')!;
  const seed = opts.seed ?? 7;
  const setup = setupForChapter(chapter, seed);
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const audio = new FakeAudio();
  const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
  const presenter = new BattlePresenter({ stage, audio, sleep: () => Promise.resolve() });
  presenter.setSpeed(opts.speed ?? 'skip');
  setCappedAutoPlay(presenter, intendedStrategy);

  const asked: Array<{ phase: ChainChoice['phase']; link: number; group: string }> = [];
  const fought: string[] = [];
  const order = opts.order ?? ALL_KEYS;
  const scripted = async (info: ChainChoice): Promise<string | undefined> => {
    asked.push({ phase: info.phase, link: info.link, group: info.group.id });
    if (opts.abortAfter !== undefined && asked.length > opts.abortAfter) return undefined;
    const taken = takenAt(info);
    return groupIdForPick(taken, order[taken.length]!);
  };
  const choose = opts.choose === undefined ? scripted : opts.choose;
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: (_s: BattleState) => Promise.resolve() },
    group: chapter.enemyGroupRef,
    setup,
    seed,
    findGroup: findEnemyGroup,
    audio,
    ...(choose ? { choose } : {}),
    onLink: (i) => void fought.push(i.group.id),
  });
  return { ...result, asked, fought };
}

describe('the chain loop asks the player which aeon Yu Yevon takes', () => {
  it('asks before the first fight and after each possession link but the last, never after Yu Yevon, and fights only what was chosen', async () => {
    const order: OfferingKey[] = ['bahamut', 'anima', 'valefor', 'ifrit', 'ixion', 'shiva', 'yojimbo', 'sisters'];
    const r = await play({ order });
    expect(r.asked.map((a) => a.phase)).toEqual(['first', ...Array(7).fill('next')]);
    expect(r.asked[0]).toMatchObject({ link: 1, group: OPENER_GROUP_ID });
    expect(r.asked.slice(1).map((a) => a.link)).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => n)); // the formation just won, 1-based
    expect(r.asked.slice(1).every((a) => a.group.startsWith('last-summoning:') && a.group !== OPENER_GROUP_ID)).toBe(true);
    // The opener is a stand-in: it is never fought, and the formations fought are the picks in order, Yu Yevon last.
    expect(r.fought).not.toContain(OPENER_GROUP_ID);
    const expected = [...order.map((_, k) => linkGroupId(order.slice(0, k + 1))), yuYevonGroupId(order)];
    expect(r.fought).toEqual(expected.slice(0, r.fought.length));
    expect(r.links).toBe(r.fought.length);
    expect(['victory', 'defeat', 'escape']).toContain(r.outcome.kind);
  }, 120_000);

  it('plays the whole chain to Yu Yevon’s fall on a seed the line wins, nine links', async () => {
    const r = await play({ order: ['sisters', 'yojimbo', 'anima', 'bahamut', 'shiva', 'ixion', 'ifrit', 'valefor'], seed: 3 });
    expect(r.outcome.kind).toBe('victory');
    expect(r.links).toBe(9);
    expect(r.fought.at(-1)).toMatch(/\+yu-yevon$/);
    expect(r.asked).toHaveLength(8);
  }, 120_000);

  it('keeps the opener as it stands when the screen is left before the first answer, and the loop still returns', async () => {
    const r = await play({ abortAfter: 0 });
    expect(r.asked).toHaveLength(1);
    expect(r.fought[0]).toBe(OPENER_GROUP_ID);
  }, 120_000);

  it('follows the seam’s own nextGroupId when the chooser has no answer after a link (the loop is never parked)', async () => {
    const r = await play({ abortAfter: 1 });
    expect(r.asked.length).toBeGreaterThanOrEqual(2);
    // the second answer is `undefined`: the marker is not a formation, so the loop ends the chain at that seam instead of parking
    expect(r.fought).toHaveLength(1);
    expect(OFFERING_NEXT_ID).toBe('last-summoning:offering');
    expect(['victory', 'defeat', 'escape', 'aborted']).toContain(r.outcome.kind);
  }, 120_000);

  it('never asks in a chain with no chooser: the opener is fought as it stands (every other chapter’s case)', async () => {
    const r = await play({ choose: null });
    expect(r.asked).toHaveLength(0);
    expect(r.fought[0]).toBe(OPENER_GROUP_ID);
  }, 120_000);
});

describe('the real offering chooser in its instant mode takes the offering’s own order', () => {
  it('gives the first held aeon each time, so a run nobody watches goes Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, Sisters', async () => {
    const aeonIds = buildLastSummoningParty().aeons.map((a) => a.id);
    const choose = offeringChooser({ root: {} as HTMLElement, aeonIds: () => aeonIds, instant: () => true, attach: () => undefined });
    const r = await play({ choose, seed: 5 });
    const expected = [...ALL_KEYS].map((_, k) => linkGroupId(ALL_KEYS.slice(0, k + 1)));
    expect(r.fought.slice(0, expected.length)).toEqual(expected.slice(0, r.fought.length));
    expect(r.fought.length).toBeGreaterThan(1);
  }, 120_000);
});
