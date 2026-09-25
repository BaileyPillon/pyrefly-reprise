// @vitest-environment jsdom
/**
 * **The Wait split's habit line in the Chapter V and VI guides** (decision sheet 2026-09-25
 * item 3, C: *"Open a list at once. On the top list, the clock still runs."*; Bailey: *"I'll go
 * with all your recommendations"*). **FFX-2 only** (AGENTS.md rule 14). Keyed to the X-2 clock:
 * shown first under Wait's split (the default), never under Active or the old whole-menu hold,
 * never in an FFX guide, and not yet in Chapter XI, which has no guide (the sheet: it gets the
 * line when its guide is written).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SaveStore } from '../../src/app/SaveData.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { GUIDES, rulesOnClock, FFX2_LEBLANC_GUIDE, FFX2_VEGNAGUN_SHUYIN_GUIDE } from '../../src/data/guides/index.ts';
import { RULE_SHORT_MAX as SHORT_MAX } from '../../src/data/guides/types.ts';
import { WAIT_SPLIT_HABIT_RULE } from '../../src/data/guides/ffx2-wait-habit.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

function boardOf(groupId: string, party: FFX2PartyBuild) {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no ${groupId}`);
  engine.setSeed(1);
  engine.init({ game: 'ffx2', party, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  return engine.state();
}

const CASES = [
  ['Chapter V', FFX2_VEGNAGUN_SHUYIN_GUIDE, boardOf(VEGNAGUN_CHAIN_ORDER[0]!, farplaneBuild)],
  ['Chapter VI', FFX2_LEBLANC_GUIDE, boardOf(LEBLANC_CHAIN_ORDER[0]!, chateauBuild)],
] as const;

describe('the rule itself', () => {
  it('is the sheet\'s draft, verbatim, cites §1.5 and fits the compact rail', () => {
    expect(WAIT_SPLIT_HABIT_RULE.text).toBe('Pick a command at once. Until you do, the clock still runs.');
    expect(WAIT_SPLIT_HABIT_RULE.cite).toBe('ffx2-combat-core §1.5');
    expect(WAIT_SPLIT_HABIT_RULE.short.length).toBeLessThanOrEqual(SHORT_MAX);
  });

  it('only Chapters V and VI carry it; no FFX guide carries a clock rule', () => {
    const carriers = GUIDES.filter((g) => g.clockRules).map((g) => g.id);
    expect(carriers.sort()).toEqual([FFX2_LEBLANC_GUIDE.id, FFX2_VEGNAGUN_SHUYIN_GUIDE.id].sort());
  });
});

describe.each(CASES)('%s', (_name, guide, state) => {
  it('under Wait\'s split it leads the RULES; the standing 3-5 rules follow unchanged', () => {
    const rules = rulesOnClock(guide, 'wait');
    expect(rules[0]).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(rules.slice(1)).toEqual(guide.rules);
    expect(guide.rules.length).toBeLessThanOrEqual(5);
  });

  it('under Active and under the whole-menu hold it is absent (false or useless there)', () => {
    expect(rulesOnClock(guide, 'active')).toBe(guide.rules);
    expect(rulesOnClock(guide, 'hold')).toBe(guide.rules);
  });

  it('the guide view on a real engine board follows the clock, Wait split by default', () => {
    expect(buildGuideView(state, null)?.chapterId).toBe(guide.id);
    expect(buildGuideView(state, null)?.rules[0]).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(buildGuideView(state, null, 'active')?.rules).not.toContain(WAIT_SPLIT_HABIT_RULE);
    expect(buildGuideView(state, null, 'hold')?.rules).not.toContain(WAIT_SPLIT_HABIT_RULE);
  });
});

describe('the panel reads the player\'s X-2 clock from the save', () => {
  let store: SaveStore;
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    store = new SaveStore('pyrefly-test-wait-habit', {
      get length() { return mem.size; },
      clear: () => mem.clear(),
      getItem: (k: string) => mem.get(k) ?? null,
      key: (i: number) => [...mem.keys()][i] ?? null,
      removeItem: (k: string) => void mem.delete(k),
      setItem: (k: string, v: string) => void mem.set(k, v),
    } as Storage);
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function panelText(): string {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({ game: 'ffx2', anchors: { top: 44, bottom: 34 } });
    guide.mount(stage);
    guide.setVisible(true);
    guide.sync(CASES[0][2]);
    const text = stage.textContent ?? '';
    guide.unmount();
    return text;
  }

  it('Wait (the default): the line is on the panel; Active: it is not', () => {
    store.setSettings({ ffx2Atb: 'wait' });
    expect(panelText()).toContain(WAIT_SPLIT_HABIT_RULE.text);
    store.setSettings({ ffx2Atb: 'active' });
    expect(panelText()).not.toContain(WAIT_SPLIT_HABIT_RULE.text);
  });
});
