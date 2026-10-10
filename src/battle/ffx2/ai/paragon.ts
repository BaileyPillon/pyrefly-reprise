/**
 * Paragon, Chapter XIII link 1 (Cloister 100 of the Via Infinito), the **normal form**. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI-FFX2-b (2026-10-10): the game's own script**, `m152` worker 1 (`research/re-ffx2-ai-fallen-trema.md` section 5,
 * rows P1 to P6), read in our own words:
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | the Big Bang flag is up | flag down; Big Bang on all the party; the alternation does **not** advance |
 * | 2 | else the alternation flag is 0 | flag 1; `random() mod 4`: 0 Attack (poison), 1 Attack (poison and confuse), 2 Attack (itchy), 3 Attack (pierce), each on one living girl |
 * | 3 | else | flag 0; `random() mod 2`: 0 Attack (drain) on a living girl, 1 Genesis on all the party |
 *
 * **What sets the Big Bang flag** (P2): the reaction entry reads the attacker's current command and its damage type
 * (`flags_damage & 3`); physical-only or magical-only does nothing, a command with **neither bit** sets the flag. There is no
 * guard and no HP test, so a miss, a status-only or a zero-damage result counts, and so does any attacker. That is Darkness,
 * Charon, Scan, Libra, Steal, the Pilfers, Mix, items, Spare Change and about eighty more rows; attacks and spells have a bit
 * and do not. The flag is one flag: however many results set it, Big Bang is cast once.
 *
 * **When Big Bang comes** (P1) is an owner decision, so the build keeps it: Bailey took TR12 = b on 2026-09-25 (D-146/TR12), an
 * **immediate** counter that resolves right after the party's action, off Paragon's ATB (`engineHooks.ts#runPartyActionAnswers`).
 * The script's own is `'next-poll'`: the flag waits for Paragon's next poll and Big Bang **replaces the move that was due**, once,
 * so Big Bang never lands between two of his moves. Both are built; {@link PARAGON_OPTIONS} picks, the default is Bailey's.
 *
 * **Not built** (listed in `docs/handoff/re-parity-ai-ffx2-b.md`): the near-weighted target search of the single-target
 * Attacks (P3: weights by distance and facing, about 42 / 29 / 29 percent at the start formation; the engine has no battle
 * geometry, so the pick is uniform); the exact MP check (P5, kept as TR4 = b decided: a drained Paragon, MP 0, casts no Genesis and no
 * Big Bang); the stat bytes (P6: MDEF 89 against our 88 is TR8 = a's call, and W3 left every stat byte as authored).
 *
 * **Timers** (kept in their current units; for the W4 merge): Attack recovery 100 = 5,291 units (56 steps, 1.87 s), the Itchy
 * Attack 60 = 3,174 (34 steps, 1.13 s), Genesis and Big Bang charge 120 = 6,349 (67 steps, 2.24 s) and recovery 80 = 4,232 (45
 * steps, 1.50 s); none of them is a script rule.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { damageBits, pickGirl, scriptMod } from './script-rolls.ts';

const STEP = 'paragonStep';
/** AI memory: the Big Bang flag (1 up). Set only under {@link PARAGON_OPTIONS.bigBangTiming} `'next-poll'`. */
export const BIG_BANG_FLAG = 'paragonBigBang';

/** The script's four plain Attacks in its own order: `random() mod 4` = 0, 1, 2, 3. */
const NORMAL_ATTACKS = [
  'paragon-attack-poison',
  'paragon-attack-confuse',
  'paragon-attack-itchy',
  'paragon-attack-pierce',
] as const;

/**
 * Paragon's choices that the owner has made (so they stay as decided) but the script answers differently.
 * - `bigBangTiming`: `'immediate'` is TR12 = b (Bailey, D-146); `'next-poll'` is the script (P1).
 */
export const PARAGON_OPTIONS = {
  bigBangTiming: 'immediate' as 'immediate' | 'next-poll',
};

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** Drained: International / HD, the wiki's reading (TR4 = b). */
export function paragonDrained(ctx: AiContext): boolean {
  return ctx.self.mp <= 0;
}

function bigBang(ctx: AiContext): Command | null {
  if (!paragonDrained(ctx)) return use('paragon-big-bang', []);
  ctx.emit({ type: 'message', text: 'Paragon has no MP left for Big Bang.', kind: 'system' });
  return null;
}

export const paragonScript: AiScript = {
  id: 'paragon',
  decide(ctx) {
    const self = ctx.self;
    if (mem(self, BIG_BANG_FLAG) === 1) {
      setMem(self, BIG_BANG_FLAG, 0);
      return bigBang(ctx); // replaces the move that was due; the alternation does not advance
    }
    const step = mem(self, STEP);
    setMem(self, STEP, step === 0 ? 1 : 0);
    if (step === 0) {
      const id = NORMAL_ATTACKS[scriptMod(ctx, 4)] ?? NORMAL_ATTACKS[0];
      return use(id, pickGirl(ctx));
    }
    if (scriptMod(ctx, 2) === 1) {
      if (!paragonDrained(ctx)) return use('paragon-genesis', []);
      ctx.emit({ type: 'message', text: 'Paragon has no MP left for Genesis.', kind: 'system' });
      return null;
    }
    return use('paragon-attack-drain', pickGirl(ctx));
  },
  /** The reaction entry: a result from a command with neither damage bit raises the flag (P2); the next poll answers (`'next-poll'`). */
  onResult(ctx, source, ability) {
    if (PARAGON_OPTIONS.bigBangTiming !== 'next-poll') return;
    if (damageBits(ability, source) === 0) setMem(ctx.self, BIG_BANG_FLAG, 1);
  },
  /** TR12 = b: after any party action that put a result on him with a command of neither bit, Big Bang resolves at once. */
  onPartyAction(ctx, actor, action) {
    if (PARAGON_OPTIONS.bigBangTiming !== 'immediate' || !action.aimedAtSelf || action.abilityId === undefined) return null;
    const ability = ctx.ability(action.abilityId);
    if (!ability || damageBits(ability, actor) !== 0) return null;
    if (paragonDrained(ctx)) return null;
    return use('paragon-big-bang', []);
  },
};
