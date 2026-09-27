import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { entrySituationFor } from '../../src/app/screens/entrySituation.ts';

/**
 * A-2's call site (iteration 2 B5; the line written out in docs/handoff/iter2-b2.md):
 * the flow plays the battle entry by situation instead of the swirl.
 * Game case: both (FFX blur or shatter, FFX-2 shatter; the implosion stays OFF).
 */
describe('entrySituationFor', () => {
  const withScene = { scriptsRef: { pre: [{}] } };
  const noScene = { scriptsRef: { pre: [] } };
  it('a first attempt out of a played scene is a scene entry', () => {
    expect(entrySituationFor(0, {}, withScene)).toBe('scene');
  });
  it('a retry is a retry', () => {
    expect(entrySituationFor(1, {}, withScene)).toBe('retry');
  });
  it('skipped scenes, or no scene at all, are skipped', () => {
    expect(entrySituationFor(0, { skipCutscenes: true }, withScene)).toBe('skipped');
    expect(entrySituationFor(0, {}, noScene)).toBe('skipped');
    expect(entrySituationFor(0, {}, {})).toBe('skipped');
  });
});

describe('the flow calls playBattleEntry, never the implosion', () => {
  const src = readFileSync('src/app/screens/BattleScreenFlow.ts', 'utf8');
  it('runChapter enters through playBattleEntry', () => {
    expect(src).toMatch(/await playBattleEntry\(this\.app\.uiRoot, \{/);
    expect(src).toMatch(/situation: entrySituationFor\(attempt, opts, chapter\)/);
  });
  it('passes no implosion seam', () => {
    expect(src).not.toMatch(/implosion:\s*true/);
  });
});
