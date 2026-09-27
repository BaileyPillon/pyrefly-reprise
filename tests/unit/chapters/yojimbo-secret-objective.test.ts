// @vitest-environment jsdom
/**
 * **Chapter IX's secret objective** (P-2 option (b) of
 * `docs/plans/yojimbo-faithfulness-2026-09-26.md`; Bailey, 2026-09-26: "I'll
 * go with all of your recommendations").
 *
 * The chapter card's Doom row reads "???" until Doom lands or the player
 * loses once. Kimahri arrives without Doom (P-1), so the loss is the reveal,
 * and the row then states a fact about the real game (a Ghost in this cave
 * teaches Kimahri Doom by Lancet, research §5.3 row 1), not a step this fight
 * offers. Proved on the evaluator, the prep card's list and the real
 * `GameFlow`'s defeat, RETRY and prep path.
 *
 * **Game case:** the chapter is FFX only; the hidden-row mechanism is shared
 * plumbing (both), and no other chapter sets `hideUntilLoss`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../../src/app/App.ts';
import { pinRunSeed } from '../../../src/app/runSeed.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { Screen } from '../../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../../src/app/screens/BattleScreen.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { YOJIMBO_META } from '../../../src/data/chapter-meta-yojimbo.ts';
import { CAVERN_DOOM_PREP } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { objectivesHtml } from '../../../src/ui/common/chapterPanel.ts';
import { evaluateObjectives } from '../../../src/ui/common/chapterObjectives.ts';
import {
  HIDDEN_OBJECTIVE_LABEL,
  chapterLostOnce,
  noteChapterLost,
  resetObjectiveReveals,
} from '../../../src/ui/common/objectiveReveal.ts';

const ID = 'yojimbo-cavern';
const FACT = 'In the game, a Ghost teaches Doom';
const words = (t: string) => t.trim().split(/\s+/).length;
const empty = { log: [] as BattleEvent[], state: null, links: 1 };

beforeEach(() => resetObjectiveReveals());
afterEach(() => resetObjectiveReveals());

describe('the rows (P-1 not-learned, P-2 (b))', () => {
  it('Doom row is the one secret; the other two teach the race and the win', () => {
    expect(CAVERN_DOOM_PREP).toBe('not-learned');
    const [doom, zanmato, win] = YOJIMBO_META.objectives;
    expect(doom).toMatchObject({ id: 'doom-yojimbo', label: FACT, hideUntilLoss: true });
    expect(zanmato).toMatchObject({ label: 'Let an aeon take Zanmato', rule: { kind: 'survived-ability', ability: 'yojimbo-zanmato' } });
    expect(win).toMatchObject({ label: 'Defeat Yojimbo', rule: { kind: 'victory' } });
    expect(zanmato.hideUntilLoss).toBeUndefined();
    for (const o of YOJIMBO_META.objectives) expect(words(o.label), o.label).toBeLessThanOrEqual(7);
  });

  it('no other chapter hides a row', () => {
    for (const meta of CHAPTER_META.filter((m) => m.id !== ID)) {
      expect(meta.objectives.some((o) => o.hideUntilLoss), meta.id).toBe(false);
    }
  });

  it('the tip teaches the race: the gauge, Zanmato at 100 and the aeon, with no word of Doom', () => {
    expect(YOJIMBO_META.tip).toMatch(/gauge/);
    expect(YOJIMBO_META.tip).toMatch(/100/);
    expect(YOJIMBO_META.tip).toMatch(/aeon/);
    expect(YOJIMBO_META.tip).not.toMatch(/doom|ghost|lancet/i);
  });
});

describe('the evaluator and the card', () => {
  it('reads "???" before a loss, and the fact after one', () => {
    const before = evaluateObjectives(YOJIMBO_META.objectives, empty);
    expect(before[0]).toMatchObject({ label: HIDDEN_OBJECTIVE_LABEL, done: false, secret: true });
    expect(before[1]!.label).toBe('Let an aeon take Zanmato');
    expect(before[1]!.secret).toBeUndefined();
    const after = evaluateObjectives(YOJIMBO_META.objectives, { ...empty, lostOnce: true });
    expect(after[0]).toMatchObject({ label: FACT, secret: true });
  });

  it('a secret row that is met shows its label with no loss (Doom landed on the preloaded party)', () => {
    const log = [
      { type: 'action-start', actorId: 'kimahri', abilityId: 'doom', seq: 0 },
      { type: 'action-end', actorId: 'kimahri', seq: 1 },
    ] as unknown as BattleEvent[];
    const rows = evaluateObjectives(YOJIMBO_META.objectives, { log, state: null, links: 1 });
    expect(rows[0]).toMatchObject({ label: FACT, done: true });
  });

  it('the prep card lists "???" until the chapter is lost once in this session', () => {
    const meta = getChapterMeta(ID)!;
    expect(objectivesHtml(meta)).toContain(HIDDEN_OBJECTIVE_LABEL);
    expect(objectivesHtml(meta)).not.toContain('Ghost');
    noteChapterLost(ID);
    expect(chapterLostOnce(ID)).toBe(true);
    expect(objectivesHtml(meta)).toContain(FACT);
    expect(objectivesHtml(meta)).not.toContain(HIDDEN_OBJECTIVE_LABEL);
  });
});

// ---------------------------------------------------------------------------
// The real flow: defeat -> RETRY -> prep shows the row
// ---------------------------------------------------------------------------

const prepCards: string[] = [];
let endings: Array<'victory' | 'defeat'> = [];
let choices: Array<'retry' | 'chapter-select'> = [];

class Done<T> extends Screen implements FlowScreen<T> {
  readonly done: Promise<T>;
  constructor(readonly name: string, value: T) {
    super();
    this.done = Promise.resolve(value);
  }
}

class ScriptedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const outcome = endings.shift() ?? 'defeat';
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome,
      result: outcome === 'victory' ? ({ turns: 9, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
      elapsedMs: 1,
      links: 1,
      preview: false,
    });
  }
}

class FakeApp {
  readonly uiRoot = document.createElement('div');
  readonly save = new SaveStore();
  readonly flow = new GameFlow(this as unknown as App);
  current: Screen | null = null;
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    if (this.current) await this.current.exit();
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

describe('GameFlow: a loss reveals the row on the RETRY path', () => {
  beforeEach(() => {
    pinRunSeed(1);
    prepCards.length = 0;
    resetFlowScreens();
    registerFlowScreens({
      partyPrep: ({ chapter }) => {
        prepCards.push(objectivesHtml(getChapterMeta(chapter.id)!));
        return new Done('party-prep', true);
      },
      battle: (opts) => new ScriptedBattle(opts),
      results: (opts) => {
        if (opts.outcome === 'defeat') opts.onChoice?.(choices.shift() ?? 'chapter-select');
        return new Done('results', undefined);
      },
    });
  });
  afterEach(() => {
    resetFlowScreens();
    pinRunSeed(null);
  });

  it('first prep: "???"; lose, RETRY; the second prep shows the fact', async () => {
    endings = ['defeat', 'victory'];
    choices = ['retry'];
    const app = new FakeApp();
    await app.flow.runChapter(ID, { skipCutscenes: true, speed: 'skip' });
    expect(prepCards).toHaveLength(2);
    expect(prepCards[0]).toContain(HIDDEN_OBJECTIVE_LABEL);
    expect(prepCards[1]).toContain(FACT);
    expect(chapterLostOnce(ID)).toBe(true);
  });

  it('a win with no loss keeps it hidden', async () => {
    endings = ['victory'];
    const app = new FakeApp();
    await app.flow.runChapter(ID, { skipCutscenes: true, speed: 'skip' });
    expect(chapterLostOnce(ID)).toBe(false);
  });
});
