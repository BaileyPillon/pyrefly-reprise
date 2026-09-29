/**
 * PR-0215 (Bailey's pick B, D-249): the results card after an FFX stalemate. The Defeat panel as it
 * is, the caption's ending reads WITHDREW in place of FELL, and the engine's own line ("The battle
 * cannot be won from here.") sits where a victory card puts its quip. The stalemate rule is FFX only;
 * the card is a shared screen. `withdrawLineFrom` reads the line from the engine's log, so a
 * withdrawal with no stalemate (every member ejected) gets the caption and no line.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { resultsCaptionHtml, desktopPageHtml, type ResultsPageModel } from '../../src/ui/common/resultsPage.ts';
import { STALEMATE_LINE, withdrawLineFrom } from '../../src/app/screens/withdrawal.ts';

const model = (over: Partial<ResultsPageModel>): ResultsPageModel => ({
  victory: false,
  silent: false,
  heading: 'Defeat',
  clock: '25:01',
  tags: [],
  quip: undefined,
  ledger: [],
  rows: [],
  progress: 1,
  actionIndex: 0,
  ...over,
});

describe('the withdrawal card (PR-0215, option B)', () => {
  it('the caption ends WITHDREW, a defeat still FELL, a win CLEARED', () => {
    expect(resultsCaptionHtml('Inside Sin', false, true)).toContain('WITHDREW');
    expect(resultsCaptionHtml('Inside Sin', false)).toContain('FELL');
    expect(resultsCaptionHtml('Inside Sin', true)).toContain('CLEARED');
  });

  it('the engine line prints in the quip slot, escaped, and only when given', () => {
    const html = desktopPageHtml(model({ note: STALEMATE_LINE }));
    expect(html).toContain('rres__quip rres__quip--note');
    expect(html).toContain('The battle cannot be won from here.');
    expect(desktopPageHtml(model({}))).not.toContain('rres__quip');
  });

  it('reads the line from the log only when the engine emitted it', () => {
    const log = [
      { type: 'turn-start', actorId: 'tidus' },
      { type: 'message', text: STALEMATE_LINE, kind: 'system' },
      { type: 'battle-end', outcome: 'escape' },
    ] as unknown as BattleEvent[];
    expect(withdrawLineFrom(log)).toBe(STALEMATE_LINE);
    expect(withdrawLineFrom([{ type: 'message', text: 'Tidus was ejected!', kind: 'system' }] as unknown as BattleEvent[])).toBeNull();
    expect(withdrawLineFrom(undefined)).toBeNull();
  });

  it('the line is the FFX engine own words, character for character', () => {
    // The stalemate check moved with checkEnd into engine-end.ts when advisor v4 split the facade (514b7e0b).
    const engine = readFileSync('src/battle/ffx/engine-end.ts', 'utf8');
    expect(engine).toContain(`text: '${STALEMATE_LINE}'`);
  });
});
