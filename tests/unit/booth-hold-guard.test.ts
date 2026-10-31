/**
 * THE HOLD GUARD (release 69, review of `booth-ffx-yunalesca`, finding m1; both games, shared plumbing; tests only).
 *
 * The lane for Chapter II found that the smear planner rides on the TREATED list whenever the swap scope does not include the chapter (`SmearDirector.swap` reads `swapsInScope() ? smearStyle() : smearStyleNow()`), so a chapter
 * that is both in `DemoGate.TREATED_CHAPTERS` and in `SwapSwitch.SCOPE_EXCEPTIONS` gets the planner's cuts back by the side door (the very swaps the exception exists to keep out) unless its `PIECE_HOLDS` row holds `smear`. Chapter II
 * holds it by hand. The other three exceptions (`evrae-airship`, `sin-face`, `ffx2-ixion-djose`) are chapters the rollout reaches next, and the only safeguard was a sentence in a handoff note; this file makes the class impossible
 * to forget: the next chapter that is both listed and excepted fails here until its hold row names the exception.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { TREATED_CHAPTERS, isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { SCOPE_EXCEPTIONS, scopeExcepted, swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setSmearStyle, smearOn } from '../../src/engine/motion/SmearSwitch.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setSmearStyle(null);
  setCurvesMode(null);
});

/** Every chapter the treatment reaches that the swap scope leaves at release 67's look. */
const bothListed = (): string[] => Object.keys(TREATED_CHAPTERS).filter((id) => scopeExcepted(id));

describe('a treated chapter that the swap scope leaves at release 67 also holds the smear planner', () => {
  it('for every id in TREATED_CHAPTERS that SCOPE_EXCEPTIONS names, PIECE_HOLDS holds `smear`, names the exception and says what lifts it', () => {
    setTreatedScope('all');
    for (const id of bothListed()) {
      const reason = treatedHold(id, 'smear');
      expect(reason, `${id} is treated and a swap-scope exception: its PIECE_HOLDS row must hold 'smear'`).toBeDefined();
      expect(reason, id).toMatch(/SCOPE_EXCEPTIONS/);
      expect(reason, id).toMatch(/Lifts when/);
      expect(isTreatedChapter(id, 'smear'), id).toBe(false);
    }
  });

  it('and the planner is really off there: the swap scope leaves the chapter out, the smear style is asked for, and it still does not play', () => {
    setTreatedScope('all');
    setCurvesMode('real-snappy');
    setSmearStyle('paint');
    for (const id of bothListed()) {
      setDemoChapter(id);
      expect(swapsInScope(), id).toBe(false);
      expect(smearOn(), id).toBe(false);
    }
  });

  it('is not vacuous: Chapter II is on both lists today, and the exception table has entries', () => {
    expect(bothListed()).toContain('yunalesca');
    expect(Object.keys(SCOPE_EXCEPTIONS).length).toBeGreaterThan(0);
  });
});
