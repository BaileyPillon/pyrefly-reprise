/**
 * PR-0267 (critic round 17, FFX only): a FAILED Bushido must not earn the §5.2
 * remaining-time bonus.
 *
 * `research/ffx-combat-core.md` §5.5: "Failure (timer expiry) resolves the
 * (Fail) row", and the bonus exists because the sequence "completes early"
 * (`timeRemaining = 4000 - msElapsedWhenLastInputLanded`). A failed sequence
 * never completes, so its timeRemaining is 0. Before this fix the engine read
 * the UI's `timeRemainingMs` whatever `success` said, and the UI (which ends
 * the attempt on the first wrong press, visual-bible §3.11.2) sent the time
 * left on the clock: a wrong first press at 3.9 s out-damaged a correct
 * sequence finished with 2.5 s left (critic round 17: 3,617 against 3,192).
 *
 * Every assertion runs the engine or the minigame logic. Nothing is grepped.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, timingBonusFrom } from '../../src/battle/ffx/index.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { resolveAuronSequence } from '../../src/ui/ffx/minigames/logic.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;
type Seq = { success: boolean; correctInputs: number; timeRemainingMs: number };

const FANG = AURON['dragon-fang']!;

function content(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), FANG]);
  return reg;
}

function odSetup() {
  return setup({
    party: party({
      members: [
        member({ id: 'tidus' }),
        member({
          id: 'auron',
          overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['dragon-fang'] },
        }),
        member({ id: 'yuna' }),
      ],
      activeSlots: ['tidus', 'auron', 'yuna'],
    }),
    enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
  });
}

function driveTo(engine: ReturnType<typeof createFFXEngine>, who: string): PlayerInput {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'player-input') {
      if (d.actorId === who) return d;
      engine.submit({ kind: 'attack', targets: ['dummy'] });
      continue;
    }
    break;
  }
  throw new Error(`${who} never got a turn`);
}

/** Auron's Dragon Fang damage on the same seeded board for one minigame outcome. */
function fangDamage(sequence: Seq): number {
  const engine = createFFXEngine({ content: content() });
  engine.setSeed(1);
  engine.init(odSetup());
  driveTo(engine, 'auron');
  const cmd: Command = { kind: 'overdrive', id: 'dragon-fang', targets: ['dummy'], extra: { kind: 'auron-sequence', sequence } };
  const events: BattleEvent[] = [];
  for (let i = 0; i < 5 && !events.some((e) => e.type === 'action-end'); i++) events.push(...engine.submit(cmd));
  const hit = events.find((e) => e.type === 'damage' && e.sourceId === 'auron');
  if (!hit || hit.type !== 'damage') throw new Error('Dragon Fang dealt no damage');
  return hit.amount;
}

describe('PR-0267: a failed Bushido earns no timing bonus [ffx-combat-core §5.2, §5.5]', () => {
  it('the Fail row deals the same damage whatever the clock showed when the attempt ended', () => {
    const expired = fangDamage({ success: false, correctInputs: 3, timeRemainingMs: 0 });
    const wrongPressEarly = fangDamage({ success: false, correctInputs: 0, timeRemainingMs: 3900 });
    const wrongPressLate = fangDamage({ success: false, correctInputs: 0, timeRemainingMs: 335 });
    expect(wrongPressEarly).toBe(expired);
    expect(wrongPressLate).toBe(expired);
  });

  it('a correct sequence out-damages every failure, and a faster one out-damages a slower one', () => {
    const worstFail = fangDamage({ success: false, correctInputs: 0, timeRemainingMs: 3900 });
    const fast = fangDamage({ success: true, correctInputs: 8, timeRemainingMs: 2500 });
    const slow = fangDamage({ success: true, correctInputs: 8, timeRemainingMs: 500 });
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(worstFail);
  });

  it('timingBonusFrom credits time remaining only to a completed sequence', () => {
    const fail: MinigameResult = { kind: 'auron-sequence', sequence: { success: false, correctInputs: 0, timeRemainingMs: 3900 } };
    const ok: MinigameResult = { kind: 'auron-sequence', sequence: { success: true, correctInputs: 8, timeRemainingMs: 2500 } };
    expect(timingBonusFrom(fail, FANG)).toEqual({ timeRemainingMs: 0, timerMs: 4000 });
    expect(timingBonusFrom(ok, FANG)).toEqual({ timeRemainingMs: 2500, timerMs: 4000 });
  });

  it('the minigame reports no time remaining for a sequence ended by a wrong press', () => {
    const r = resolveAuronSequence({ sequenceLength: 8, correctInputs: 0, elapsedMs: 100, timerMs: 4000 });
    expect(r.success).toBe(false);
    expect(r.timeRemainingMs).toBe(0);
  });
});
