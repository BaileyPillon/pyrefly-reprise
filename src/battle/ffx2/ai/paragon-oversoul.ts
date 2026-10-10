/**
 * **Oversoul Paragon**, Chapter XIII link 1, **option 1 (TR7 b), shipped 2026-09-25**. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI-FFX2-b (2026-10-10): the game's own script**, `o152` (worker 0 of Paragon's package), read in our own words
 * (`research/re-ffx2-ai-fallen-trema.md` section 6, rows O1 to O14). It replaces the first build, which was SinirothX's dump
 * (research `ffx2-trema.md` 12.2) with every gap a named estimate.
 *
 * ## The answer state, set by the reaction entry (6.2)
 *
 * Every result applied to it ({@link AiScript.onResult}) sets the idle clock back and then, by who caused it: a girl's heal or
 * buff command (the 11 of `oversoul-lists.ts`) -> state 3 "Demi"; a girl's command on the 32-command copy list -> state 1 "copy"
 * (the girl and the command are remembered); any other command of a girl -> state 2 "normal"; anyone else (a monster, Paragon
 * himself: his own drain) -> state 2 with no girl. Only the **last** result before his next poll counts, and **nothing is answered
 * at once**: the answer is made on his next poll. A heal that lands on a girl produces no result on him, so only a heal or buff
 * aimed **at Paragon** starts the Demi loop.
 *
 * ## The action entry, in the order the script tests (6.1)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | HP / max HP (32-bit float) < 0.1 | HP row B |
 * | 2 | HP / max HP < 0.4 | HP row A |
 * | 3 | MP = 0 | `random() mod 2`: 0 Osmose, 1 Attack, each on a uniform girl |
 * | 4 | state 0 | the idle branch: past the idle limit, Dispel if anyone is Reflected, else `random() mod 3`: 0 Judgment (girl), 1 Genesis, 2 Big Bang |
 * | 5 | state 2 | state 0; Attack on a uniform girl |
 * | 6 | state 3 | Demi on all the party; **state stays 3** |
 * | 7 | state 1, no remembered girl | as 5 |
 * | 8 | state 1 | state 0; the remembered command at the remembered girl **alone** (an all-party spell too) |
 *
 * HP row A: Reflect on any girl -> Dispel on all; MP 0 -> row 3; else `random() mod 8`: 0 Firaga, 1 Thundaga, 2 Blizzaga, 3 Waterga
 * (all the party), 4 to 7 Attack (girl). HP row B: Reflect -> Dispel; MP 0 -> row 3; **once per fight** Final Impact (the script's
 * macro also draws and discards one target search, one draw when two or more girls live); then `random() mod 5`: 0 Ultima, 1 Holy
 * (girl), 2 Judgment (girl), 3 Genesis, 4 Big Bang. The ratio is a 32-bit float tested strictly: with 210,000 HP "below 10 percent"
 * is 20,999 HP or less, "below 40 percent" is 83,999 or less.
 *
 * ## What stays as the owner decided
 *
 * Bailey adopted this option on 2026-09-25 (D-151) as a fiend that **waits to be hit**. The script acts on its HP and its MP **on
 * every poll, hit or not** (rows 1 to 3 come before the answer states), so the build keeps the decision: with
 * {@link OVERSOUL_ESTIMATES}`.lowHpActsEveryTurn` false (the default) rows 1 to 3 are only reached once it has a reason to act, a
 * pending answer or the idle limit. Setting it true is the game's own rule (O4 and O12); it is listed for Bailey.
 *
 * ## Timers (kept in their current units; for the W4 merge)
 *
 * The idle limit is the script's 1,200 idle polls (the 1,201st acts), 40.04 s of running clock at the measured 29.97 logic steps
 * a second. This build keeps `idleSeconds` = 20 and counts it in engine ticks since the last result or the last idle action: moving
 * it onto the game's poll count is a structural change that waits for Bailey (`docs/plans/re-parity-ai-review.md` section 3).
 * The first poll spends no turn on the switch to the Oversoul block (O14): the "Paragon oversouls!" line plays and the poll goes on.
 */

import type { AbilityDef, Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { TICK_RATE_BASE } from '../constants.ts';
import { discardPick, girlsInSlotOrder, pickGirl, scriptMod } from './script-rolls.ts';
import { oversoulCommandClass } from './oversoul-lists.ts';

/**
 * The values of the first build's research gaps that still matter. The game's script answered most of them; each line says which
 * way. Change one line to measure another reading.
 */
export const OVERSOUL_ESTIMATES = {
  /**
   * Unread since W3: its Attack rolls the game's accuracy race (row 0x41da, the Oversoul block's ACC 95 and Luck 16), not a flat
   * rate. Kept as the record of what the FAQs said (D-151 named "the 50 percent hit rate" an estimate).
   */
  physicalHitPercent: 50,
  /**
   * **Structural, waits for Bailey.** Seconds of engine time before an untouched Paragon acts. The script's limit is 1,200 idle
   * polls = 40.04 s of running clock at 29.97 steps a second; 20 s was SinirothX's reading. Counted since the last result.
   */
  idleSeconds: 20,
  /** The first HP line: strictly below 4/10 of max HP, in 32-bit float (O3, as the game). */
  magicBelow: 4 / 10,
  /** The second HP line: strictly below 1/10 of max HP. */
  finalBelow: 1 / 10,
  /** Final Impact's hits: 14 (row 0x41c4, O5). */
  finalImpactHits: 14,
  /** Final Impact carries the physical bit, so Protect halves it (O5, as the row). */
  finalImpactReducible: true,
  /** The -aga spells hit all the party, with no all-targets halving (O13, as the game). */
  agaOnAll: true,
  /** Its Attack carries no status (row 0x41da, O11, as the game). */
  attackItchy: false,
  /**
   * **Owner decision (D-151: it waits to be hit): false.** The script's rows 1 to 3 (HP below 10 and 40 percent, MP 0) act on
   * every poll, hit or not (O4, O12). False keeps the build's reading: they are reached only when it has a reason to act.
   */
  lowHpActsEveryTurn: false,
  /** The record's thinking byte is never read (O15). */
  thinkingPeriod: 0,
};

/** AI memory keys (exported for the tests). */
export const K = {
  oversouled: 'osOversouled',
  quiet: 'osQuietSince',
  state: 'osState',
  attacker: 'osAttacker',
  command: 'osCommand',
  finalUsed: 'osFinalUsed',
} as const;

/** The answer state (`o152.src` variable): 0 nothing, 1 copy, 2 normal, 3 Demi. */
export const OS_NOTHING = 0;
export const OS_COPY = 1;
export const OS_NORMAL = 2;
export const OS_DEMI = 3;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

function anyReflected(ctx: AiContext): boolean {
  return ctx.party().some((u) => Boolean(u.statuses.reflect));
}

/** `HP / max HP < line`, in 32-bit floats and strictly (the script compares floats). */
export function hpBelow(unit: Ffx2Unit, line: number): boolean {
  return Math.fround(Math.fround(unit.hp) / Math.fround(Math.max(1, unit.stats.maxHp))) < Math.fround(line);
}

/** Start the idle count again (any result, or an idle action). */
function stir(ctx: AiContext): void {
  setMem(ctx.self, K.quiet, ctx.ticks);
}

function idleElapsed(ctx: AiContext): boolean {
  return ctx.ticks - mem(ctx.self, K.quiet) >= OVERSOUL_ESTIMATES.idleSeconds * TICK_RATE_BASE;
}

/** Row 3: MP is 0 -> `random() mod 2`: 0 Osmose, 1 Attack, each on a uniform girl. */
function mpZeroTurn(ctx: AiContext): Command {
  const id = scriptMod(ctx, 2) === 0 ? 'x2-shared-osmose' : 'paragon-os-attack';
  return use(id, pickGirl(ctx));
}

/** HP row A (below 40 percent). */
function hpRowA(ctx: AiContext): Command {
  if (anyReflected(ctx)) return use('paragon-os-dispel', []);
  if (ctx.self.mp <= 0) return mpZeroTurn(ctx);
  const roll = scriptMod(ctx, 8);
  const aga = ['paragon-os-firaga', 'paragon-os-thundaga', 'paragon-os-blizzaga', 'paragon-os-waterga'][roll];
  if (aga !== undefined) return use(aga, OVERSOUL_ESTIMATES.agaOnAll ? [] : pickGirl(ctx));
  return use('paragon-os-attack', pickGirl(ctx));
}

/** HP row B (below 10 percent). */
function hpRowB(ctx: AiContext): Command {
  const self = ctx.self;
  if (anyReflected(ctx)) return use('paragon-os-dispel', []);
  if (self.mp <= 0) return mpZeroTurn(ctx);
  if (self.aiMemory?.[K.finalUsed] !== true) {
    setMem(self, K.finalUsed, true);
    discardPick(ctx, girlsInSlotOrder(ctx)); // the script's macro draws a target search and throws it away
    return use('paragon-os-final-impact', []);
  }
  const roll = scriptMod(ctx, 5);
  if (roll === 0) return use('paragon-os-ultima', []);
  if (roll === 1) return use('paragon-os-holy', pickGirl(ctx));
  if (roll === 2) return use('paragon-os-judgement', pickGirl(ctx));
  return use(roll === 3 ? 'paragon-genesis' : 'paragon-big-bang', []);
}

/** Row 4: the idle branch, past the idle limit. */
function idleTurn(ctx: AiContext): Command {
  if (anyReflected(ctx)) return use('paragon-os-dispel', []);
  const roll = scriptMod(ctx, 3);
  if (roll === 0) return use('paragon-os-judgement', pickGirl(ctx));
  return use(roll === 1 ? 'paragon-genesis' : 'paragon-big-bang', []);
}

/** Rows 7 and 8: the remembered command at the remembered girl alone. */
function copyTurn(ctx: AiContext): Command {
  const self = ctx.self;
  const attacker = typeof self.aiMemory?.[K.attacker] === 'string' ? (self.aiMemory[K.attacker] as string) : '';
  const commandId = typeof self.aiMemory?.[K.command] === 'string' ? (self.aiMemory[K.command] as string) : '';
  if (attacker === '' || commandId === '') return use('paragon-os-attack', pickGirl(ctx));
  return { kind: 'ability', id: commandId, targets: [attacker], exactTargets: true };
}

export const paragonOversoulScript: AiScript = {
  id: 'paragon-oversoul',
  decide(ctx) {
    const self = ctx.self;
    if (self.aiMemory?.[K.oversouled] !== true) {
      setMem(self, K.oversouled, true);
      stir(ctx); // the idle count starts at his first poll
      ctx.emit({ type: 'message', text: 'Paragon oversouls!', kind: 'system' }); // the beat plays; it costs no turn (O14)
    }
    const state = mem(self, K.state);
    const elapsed = idleElapsed(ctx);
    if (!OVERSOUL_ESTIMATES.lowHpActsEveryTurn && state === OS_NOTHING) {
      // It waits to be hit (D-151): untouched and inside the idle limit it does nothing, whatever its HP and MP; once the limit
      // passes it acts once (rows 1 to 4 below) and the count starts again, like the idle branch it takes the place of.
      if (!elapsed) return null;
      stir(ctx);
    }
    if (hpBelow(self, OVERSOUL_ESTIMATES.finalBelow)) return hpRowB(ctx);
    if (hpBelow(self, OVERSOUL_ESTIMATES.magicBelow)) return hpRowA(ctx);
    if (self.mp <= 0) return mpZeroTurn(ctx);
    if (state === OS_NOTHING) {
      if (!elapsed) return null; // the script waits one step and polls again
      stir(ctx); // (a second stir when the gate above already took it)
      return idleTurn(ctx);
    }
    if (state === OS_DEMI) return use('paragon-os-demi', []); // the state stays until another result lands
    setMem(self, K.state, OS_NOTHING);
    if (state === OS_COPY) return copyTurn(ctx);
    return use('paragon-os-attack', pickGirl(ctx));
  },
  onResult(ctx, source, ability: AbilityDef) {
    const self = ctx.self;
    stir(ctx);
    if (source.side !== 'party' || source.id === self.id) {
      setMem(self, K.state, OS_NORMAL); // a monster's, or his own drain's: no girl to answer
      setMem(self, K.attacker, '');
      return;
    }
    const kind = oversoulCommandClass(ability.id);
    if (kind === 'heal-buff') {
      setMem(self, K.state, OS_DEMI);
    } else if (kind === 'copy') {
      setMem(self, K.state, OS_COPY);
      setMem(self, K.attacker, source.id);
      setMem(self, K.command, ability.id);
    } else {
      setMem(self, K.state, OS_NORMAL);
    }
  },
};
