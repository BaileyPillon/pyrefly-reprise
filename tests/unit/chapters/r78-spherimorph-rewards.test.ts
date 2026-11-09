/**
 * **Release 78, R77-1 (FFX only; hidden chapter 41): Spherimorph pays exactly its record, on every seed; the "347 and 985 gil, 422 and 1,197 AP" the focused review read were the results page mid-roll.**
 *
 * The review of release 77 (6429ff15e) read the results text of Spherimorph twice ("GIL 347, AP 422 x3", then "GIL 985, AP 1,197 x3", both "OVERKILL x1") against the data's 4,000 gil and 3,240 AP (4,860 on an
 * overkill; `research/re-ffx-spherimorph.md` 1.3), and filed a payout path "not traced". Traced here on the real engine, then on the page:
 *
 *  - **The engine pays the record, deterministically.** A kill pays 4,000 gil and 3,240 AP, a Lv. 2 Key Sphere; an overkill pays 4,860 AP and two Key Spheres, gil unchanged (the note: gil is not doubled by an overkill). The
 *    amount depends on the overkill and on nothing else: not the seed, not the killer, not the line. This is checked over forty seeds and both branches.
 *  - **The page was reading a count that had not finished rolling.** The results ledger rolls its counts up over `COUNT_UP_MS` of the screen's own clock (and longer in wall time on a slow frame; the review's GPU was shared), so
 *    the text read 1.5 seconds after the screen appeared is a fraction `p` of each amount. The two readings are ONE `p` each: gil 347 / 4,000 = 0.08675 and AP 422 / 4,860 = 0.0868; gil 985 / 4,000 = 0.2463 and AP 1,197 / 4,860 =
 *    0.2463 (and the review's own screenshot, taken a moment before the second text read, shows 464 and 563: p 0.116). A payout bug would not scale gil and AP by the same fraction. Omega Ruins' 50,217 and 15,217 are
 *    0.3043 of its 165,000 AP and 50,000 gil, the same thing.
 *
 * The fix is the cause, never the number: the page now carries each count's settled amount (`data-final`), and the screen's snapshot says what was paid and how far the roll is (`tests/unit/r78-results-roll.test.ts`).
 * Game case: FFX only for the chapter's payout (Spherimorph exists only in FFX); the page attribute is shared plumbing (both games; `data-final` adds no pixel).
 */
import { describe, expect, it } from 'vitest';
import { spherimorph } from '../../../src/data/ffx/enemies/spherimorph.ts';
import { SM, defend, inputFor, newEngine, setState, sm, spell } from '../helpers/spherimorphDrive.ts';

type Engine = ReturnType<typeof newEngine>;
type Result = Extract<ReturnType<Engine['nextDecision']>, { kind: 'battle-over' }>['result'];

/** Leave Spherimorph on 100 HP with the fire weakness set, have Lulu cast `id` on it, and play on to the result. */
function killWith(seed: number, id: 'fire' | 'fira'): Result {
  const engine = newEngine(seed);
  setState(engine, 0);
  sm(engine).hp = 100;
  engine.submit(spell(inputFor(engine, 'lulu'), id)!);
  for (let i = 0; i < 100; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result;
    if (d.kind === 'player-input') engine.submit(defend());
  }
  throw new Error(`seed ${seed}: no result`);
}

describe('the record (RE 1.3) is what the data holds', () => {
  it('4,000 gil, 3,240 AP, 4,860 AP on an overkill, a threshold of 2,000: the figures the review expected', () => {
    const rewards = spherimorph().rewards;
    expect([rewards.gil, rewards.ap, rewards.apOverkill, rewards.overkillThreshold]).toEqual([4_000, 3_240, 4_860, 2_000]);
  });
});

describe('the engine pays it exactly, on every seed (FFX only)', () => {
  it('a Fire on its weakness (not an overkill) pays 4,000 gil, 3,240 AP and one Lv. 2 Key Sphere on forty seeds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = killWith(seed, 'fire');
      expect(r.outcome, `seed ${seed}`).toBe('victory');
      expect(r.overkilled, `seed ${seed}`).toEqual([]);
      expect([r.gil, r.ap], `seed ${seed}`).toEqual([4_000, 3_240]);
      expect(r.drops, `seed ${seed}`).toEqual([{ itemId: 'lv-2-key-sphere', count: 1 }]);
    }
  });

  it('a Fira on its weakness pays 4,860 AP and two Key Spheres when the blow reaches 2,000 (an overkill) and 3,240 and one when it does not; the gil is 4,000 either way; the AP is a function of the overkill alone', () => {
    const seen = { overkill: 0, plain: 0 };
    for (let seed = 1; seed <= 40; seed++) {
      const r = killWith(seed, 'fira');
      expect(r.outcome, `seed ${seed}`).toBe('victory');
      expect(r.gil, `seed ${seed}`).toBe(4_000);
      if (r.overkilled.includes(SM)) {
        seen.overkill++;
        expect([r.ap, r.drops], `seed ${seed}`).toEqual([4_860, [{ itemId: 'lv-2-key-sphere', count: 2 }]]);
      } else {
        seen.plain++;
        expect([r.ap, r.drops], `seed ${seed}`).toEqual([3_240, [{ itemId: 'lv-2-key-sphere', count: 1 }]]);
      }
    }
    expect(seen.overkill, 'both branches are exercised: some seed overkills').toBeGreaterThan(0);
    expect(seen.plain, 'both branches are exercised: some seed does not').toBeGreaterThan(0);
  });

  it('the same seed pays the same twice (the amounts have no random part)', () => {
    for (const seed of [3, 11, 29]) expect(killWith(seed, 'fira')).toEqual(killWith(seed, 'fira'));
  });
});
