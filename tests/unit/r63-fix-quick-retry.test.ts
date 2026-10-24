// @vitest-environment jsdom
/**
 * R63-PLAY, the overnight fix of the skeptic's m4 (the quick retry; both games; demo mode): a retried demo fight opens hurried and its stage is built behind the defeat card.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { demoQuickRetry } from '../../src/app/demo/demoDefeat.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
void src;
void vi;

// ------------------------------------------------------------------------------------------------ Q: the quick retry

describe('Q: a retried demo fight opens hurried', () => {
  it('from the second attempt on, for a demo fight in demo mode only', () => {
    setDemoMode(true);
    try {
      expect(demoQuickRetry('seymour-flux', 0)).toBe(false);
      expect(demoQuickRetry('seymour-flux', 1)).toBe(true);
      expect(demoQuickRetry('ffx2-bahamut', 2)).toBe(true);
      expect(demoQuickRetry('gagazet', 1)).toBe(false); // not a demo fight
      setDemoMode(false);
      expect(demoQuickRetry('seymour-flux', 1)).toBe(false); // not demo mode
    } finally {
      setDemoMode(null);
    }
  });

  it('the flow arms it and builds the stage behind the defeat card', () => {
    const flow = src('src/app/screens/BattleScreenFlow.ts');
    expect(flow).toContain('if (demoQuickRetry(id, attempt)) openingHurry = true;');
    expect(flow).toContain('warmDemoFights(this.app, [chapter.id], { light: true })');
    expect(src('src/app/demo/demoWarm.ts')).toContain("'pro-defeat'");
  });
});


import { retryWarmSwitchedOff } from '../../src/app/demo/demoWarm.ts';

describe('Q: the retry stage behind the defeat card has an off switch', () => {
  it('?retrywarm=off turns it off (the hurried opening alone is then the quick retry), nothing else does', () => {
    expect(retryWarmSwitchedOff('?demo=1')).toBe(false);
    expect(retryWarmSwitchedOff('?demo=1&retrywarm=off')).toBe(true);
    expect(retryWarmSwitchedOff('?demowarm=off')).toBe(false);
    expect(src('src/app/screens/BattleScreenFlow.ts')).toContain('!retryWarmSwitchedOff()');
  });
});
