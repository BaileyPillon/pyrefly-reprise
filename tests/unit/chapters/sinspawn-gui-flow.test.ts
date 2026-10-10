/**
 * **The hidden Sinspawn Gui chapter through the real chain loop** (`runEncounterChain`, the real FFX engine, the real `BattlePresenter` and the shipped advisor line, against fake ports; FFX only):
 * the two fights chain with no results screen between them, the seam plays between them, the spoils are paid together, the second fight is the retry checkpoint, and a hopeless retry
 * opens with the three restored.
 */

import { describe, expect, it } from 'vitest';

import type { BattleSetup } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { checkpointAt, hopelessAt, resumeSetup, standingIn } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { cueForGroup, runEncounterChain, type EncounterChainResult } from '../../../src/app/screens/BattleEncounterChain.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { sinspawnGuiGroup1, sinspawnGuiGroup2 } from '../../../src/data/ffx/enemies/sinspawn-gui.ts';
import { GUI_SEAM } from '../../../src/story/scripts/sinspawn-gui.ts';
import { FakeAudio, FakeCutscenes, FakeStage } from '../helpers/FakeStage.ts';
import { setCappedAutoPlay } from '../helpers/presenterCap.ts';

const chapter = getChapter('sinspawn-gui')!;

/** Plays the chain from `startLink` on `setup`, the advisor's line answering every menu. */
async function play(seed: number, opts: { startLink?: number; setup?: BattleSetup } = {}): Promise<{ result: EncounterChainResult; music: string[]; scripts: unknown[]; restaged: number }> {
  await registerBattleContent();
  const first = opts.setup ?? setupForChapter(chapter, seed);
  const group = (opts.startLink ?? 1) > 1 ? first.enemies : chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(first.seed);
  engine.init(first);
  const audio = new FakeAudio();
  const cutscenes = new FakeCutscenes();
  const stage = new FakeStage(
    first.party.members.map((m) => m.id),
    chapter.enemyGroupRef.enemies.map((e) => e.id),
  );
  const presenter = new BattlePresenter({ stage, audio, sleep: () => Promise.resolve(), cutscenes, midScripts: chapter.scriptsRef.midScripts });
  presenter.setSpeed('skip');
  setCappedAutoPlay(presenter, intendedStrategy);
  let restaged = 0;
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: () => { restaged++; return Promise.resolve(); } },
    group,
    setup: first,
    seed,
    startLink: opts.startLink ?? 1,
    findGroup: findEnemyGroup,
    audio,
  });
  return { result, music: audio.music, scripts: cutscenes.played, restaged };
}

describe('the chain: two fights, no results screen between them', () => {
  it('the advisor\'s line wins both on a fixed seed, and the chain fought two formations, re-staged once', async () => {
    const { result, restaged } = await play(1);
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(2);
    expect(restaged).toBe(1);
  });

  it('the seam plays once, between the fights (Concept A: a white-out and three lines), and the head\'s callout beside it', async () => {
    const { scripts } = await play(1);
    const seam = chapter.scriptsRef.midScripts[GUI_SEAM]!;
    expect(scripts.filter((s) => s === seam)).toHaveLength(1);
    expect(scripts.length).toBeGreaterThanOrEqual(1);
  });

  it('the Ridge is scored by the dread theme and the guest hour by Seymour\'s own, each from the formation\'s own cue', async () => {
    expect(cueForGroup(chapter, sinspawnGuiGroup1, 'first').track).toBe('boss-dread');
    expect(cueForGroup(chapter, sinspawnGuiGroup2, 'next').track).toBe('boss-seymour');
    const { music } = await play(1);
    expect(music[0]).toBe('boss-dread');
    expect(music).toContain('boss-seymour');
    expect(music.filter((cue) => cue === 'boss-dread')).toHaveLength(1);
  });

  it('the spoils are paid together: both bodies\' gil, the Key Spheres, and a row for everyone who fought in either fight', async () => {
    const { result } = await play(1);
    if (result.outcome.kind !== 'victory') throw new Error('not won');
    const r = result.outcome.result;
    expect(r.gil).toBeGreaterThanOrEqual(2_000); // the first body's 1,000 and the second's 1,000, and every part that died
    expect(r.ap).toBeGreaterThanOrEqual(400); // the first body's; the second pays none
    expect(r.drops.filter((d) => d.itemId === 'lv-1-key-sphere').reduce((n, d) => n + d.count, 0)).toBeGreaterThanOrEqual(3);
    const rows = Object.keys(r.turnsTaken ?? {});
    for (const id of ['tidus', 'auron', 'lulu']) expect(rows, id).toContain(id); // the first fight's party, who are not in the second
    expect(rows).not.toContain('seymour'); // a guest has no row
  });

  it('the second fight is the retry checkpoint, entered on the party the first one ended with', async () => {
    const { result } = await play(1);
    expect(result.checkpoint).not.toBeNull();
    expect(result.checkpoint!.link).toBe(2);
    expect(result.checkpoint!.group.id).toBe('sinspawn-gui-2');
    expect(checkpointAt(1, sinspawnGuiGroup1, setupForChapter(chapter, 1))).toBeNull(); // link 1 is the chapter's own start
  });
});

describe('a hopeless retry opens with the three restored (FFX\'s use of the rule Trema\'s link introduced)', () => {
  /** The second fight's entry the way the chain builds it, with the first fight's carried HP set by `hp`. */
  function entryWith(hp: Record<string, number>): BattleSetup {
    const first = setupForChapter(chapter, 3);
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.init(first);
    const entry = setupForNextLink(first, sinspawnGuiGroup2, engine.state(), 4);
    for (const m of entry.party.members) if (hp[m.id] !== undefined) (m as { hp: number }).hp = hp[m.id]!;
    return entry;
  }

  it('standing counts the three the link opens on, not the six carried: a healthy entry has three, Seymour joins fresh', () => {
    expect(standingIn(entryWith({}), sinspawnGuiGroup2)).toBe(3);
    expect(standingIn(entryWith({ yuna: 0 }), sinspawnGuiGroup2)).toBe(2);
    expect(standingIn(entryWith({ yuna: 0, auron: 0 }), sinspawnGuiGroup2)).toBe(1); // Seymour alone
    expect(standingIn(entryWith({ tidus: 0, lulu: 0, kimahri: 0 }), sinspawnGuiGroup2)).toBe(3); // the fallen who are not in the second fight do not count
  });

  it('with two of the three standing the retry replays the entry as it was; with fewer it restores', () => {
    const ok = entryWith({ yuna: 0 });
    expect(hopelessAt(sinspawnGuiGroup2, ok)).toBe(false);
    const keep = resumeSetup(checkpointAt(2, sinspawnGuiGroup2, ok)!, 100);
    expect(keep.enemies.restoresPartyOnEntry).toBeUndefined();
    const bad = entryWith({ yuna: 0, auron: 0 });
    expect(hopelessAt(sinspawnGuiGroup2, bad)).toBe(true);
    const restored = resumeSetup(checkpointAt(2, sinspawnGuiGroup2, bad)!, 100);
    expect(restored.enemies.restoresPartyOnEntry).toBe(true);
    expect(restored.seed).toBe(101);
    expect(sinspawnGuiGroup2.restoresPartyOnEntry).toBeUndefined(); // the shared record is untouched
  });

  it('the engine opens the restored retry with Yuna, Seymour and Auron up at full HP and MP, and no status', () => {
    const bad = entryWith({ yuna: 0, auron: 0 });
    const retry = resumeSetup(checkpointAt(2, sinspawnGuiGroup2, bad)!, 100);
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.init(retry);
    const st = engine.state();
    expect(st.activeIds).toEqual(['yuna', 'seymour', 'auron']);
    for (const id of st.activeIds) {
      const c = st.combatants[id]!;
      expect([c.hp, c.mp], id).toEqual([c.stats.maxHp, c.stats.maxMp]);
      expect(Object.keys(c.statuses), id).not.toContain('ko');
    }
  });

  it('a retry from the wrecked entry is winnable with the advisor\'s line (the chain resumed at link 2)', async () => {
    const bad = entryWith({ yuna: 0, auron: 0 });
    const retry = resumeSetup(checkpointAt(2, sinspawnGuiGroup2, bad)!, 7);
    const { result } = await play(7, { startLink: 2, setup: retry });
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(2);
  });
});
