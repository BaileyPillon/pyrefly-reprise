/**
 * The case the fix was written for, on the real FFX engine and the real presenter: Chapter III's Yu Pagoda Curse lands Poison, Sleep,
 * Silence, Darkness and Curse on a party member, and the death check (RC5, lane FFX-D) then takes all five in the same action (in the
 * last link, the Yu Yevon fight, where the fayth's permanent Auto-Life answers the death check with a revive). The engine emits five
 * `status-add`s and, a few events later, five `status-remove`s with reason `ko`; they used to play as five flashes, five cues, five
 * message lines and 5 x (220 + 88) ms, about 1.5 s, in front of the revive.
 *
 * The chapter is played link by link the way `BattleScreen` plays it (one presenter per formation, `setupForNextLink` between), and the
 * oracle is the requirement restated over each link's own log, not `koWipedStatuses`: a `status-add` that a `status-remove` with reason
 * `ko` of the same status on the same target follows before the action's window ends. The presenter's HUD must never hear those events
 * and must still hear every other status event. (The 440-run scan behind the figure of 145 pairs is in the commit message.)
 * Game case: both (shared presenter); the pair is FFX's today.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, StatusId } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeHud, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

/** What the Curse lands on one party member. */
const CURSE: StatusId[] = ['poison', 'sleep', 'silence', 'darkness', 'curse'];

/**
 * One formation of the chapter, played to its end: the engine's log, and the `seq`s the HUD was told. The log also holds what `init`
 * emitted (the permanent Auto-Life grants) before the first burst, which no presenter is ever handed: the span that was played runs from
 * `firstTold` to `lastTold`.
 */
interface Link {
  log: readonly BattleEvent[];
  told: ReadonlySet<number>;
  firstTold: number;
  lastTold: number;
}

/** Chapter III link by link, each played by the intended strategy through a fresh presenter, as the screen chains them. */
async function chapterThree(seed: number): Promise<Link[]> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === 'braskas-final-aeon')!;
  let setup = setupForChapter(chapter, seed);
  let group = chapter.enemyGroupRef;
  const links: Link[] = [];
  for (let n = 1; n <= 12; n++) {
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const state = engine.state();
    const hud = new FakeHud();
    const presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: () => Promise.resolve(),
    });
    presenter.setAutoPlay((actorId, commands, e) => intendedStrategy(actorId, commands, e));
    const outcome = await presenter.run(engine as never, { moreLinks: group.nextGroupId !== undefined });
    const told = new Set(hud.events.map((e) => e.seq));
    links.push({ log: engine.state().log, told, firstTold: Math.min(...told), lastTold: Math.max(...told) });
    if (outcome.kind !== 'victory' || !group.nextGroupId) break;
    const next = await findEnemyGroup(group.nextGroupId);
    if (!next) break;
    setup = setupForNextLink(setup, next, engine.state(), seed + n);
    group = next;
  }
  return links;
}

/** The status events the same action's KO wipe takes, by `seq`: the adds, and the removals (reason ko) that take them. */
function wipedSeqs(log: readonly BattleEvent[]): Map<number, StatusId> {
  const out = new Map<number, StatusId>();
  let landed = new Map<string, BattleEvent[]>();
  for (const e of log) {
    if (e.type === 'action-start' || e.type === 'action-end' || e.type === 'turn-start') landed = new Map();
    else if (e.type === 'status-add') landed.set(`${e.targetId}/${e.status}`, [...(landed.get(`${e.targetId}/${e.status}`) ?? []), e]);
    else if (e.type === 'status-remove') {
      const adds = landed.get(`${e.targetId}/${e.status}`);
      landed.delete(`${e.targetId}/${e.status}`);
      if (e.reason !== 'ko' || !adds) continue;
      for (const a of adds) out.set(a.seq, e.status);
      out.set(e.seq, e.status);
    }
  }
  return out;
}

describe("Chapter III's Curse on a party member the death check takes", () => {
  // The presenter logs one line per mid-battle script this test does not register (the chapter's story beats are not under test).
  beforeAll(() => void vi.spyOn(console, 'info').mockImplementation(() => undefined));
  afterAll(() => vi.restoreAllMocks());

  it('plays none of its five pairs, and still shows every other status event of the fight', async () => {
    let found = 0;
    for (let seed = 1; seed <= 40 && found === 0; seed++) {
      for (const { log, told, firstTold, lastTold } of await chapterThree(seed)) {
        const wiped = wipedSeqs(log);
        const landed = new Set([...wiped.values()]);
        if (!CURSE.every((s) => landed.has(s))) continue; // this link's Curse took nobody
        found = seed;

        expect(wiped.size).toBeGreaterThanOrEqual(10); // five adds and five removals at the least
        for (const seq of wiped.keys()) expect(told.has(seq), `seq ${seq} is a status the wipe took in its own action: the HUD must not hear it`).toBe(false);
        const others = log.filter((e) => (e.type === 'status-add' || e.type === 'status-remove') && !wiped.has(e.seq) && e.seq > firstTold && e.seq < lastTold);
        expect(others.length).toBeGreaterThan(0);
        for (const e of others) expect(told.has(e.seq), `seq ${e.seq} (${e.type}) is an ordinary status event: the HUD must hear it`).toBe(true);
      }
    }
    expect(found, 'no seed of 1 to 40 landed the Curse on a party member the death check took; the case this test pins has gone').toBeGreaterThan(0);
  }, 300_000);
});
