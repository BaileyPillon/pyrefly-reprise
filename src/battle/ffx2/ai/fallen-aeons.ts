/**
 * Shiva and Anima on the Road to the Farplane (Chapter XI), and the action counter (AC) the fallen aeons share.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI-FFX2-b (2026-10-10): Shiva and Anima follow the game's own scripts**, `m167` and `m169`
 * (`research/re-ffx2-ai-fallen-trema.md` sections 2 and 4, rows F1 to F3 and A1), read in our own words. The counter is the
 * script's gauge: it rises on the aeon's own polls and **on every result applied to her** (the reaction entry,
 * {@link AiScript.onResult}: each strike that lands, each miss, each status-only or zero-damage result, from anyone but herself,
 * while the guard holds), not once per party action as the first build had it. The old readings of "attacked" (FA8 a and b) are
 * answered by the script and gone from Shiva and Anima; {@link attackedHooks} and {@link AC_TRIGGER_FLAG} stay for Ixion's script,
 * which has not been read yet (lane AI-FFX2-c).
 *
 * **Timers** (kept in their current units; for the W4 merge): none of Shiva's or Anima's script rules is a clock. The moves'
 * recoveries and charges are the rows' (note section 8) and the engine's per-move values until W4 wires the records:
 * Shiva's Chain Attack recovers in 0 (the follow-up polls come straight away), which this file's data row now says.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { pickGirl, reactionGuard, scriptMod } from './script-rolls.ts';

/** AI memory key for the action counter. */
export const AC = 'ac';
/** The Overdrive threshold, every aeon [§4]. */
export const AC_OVERDRIVE = 100;
/** Anima's Pain count (AI memory), and the `script-trigger` name emitted as she picks her third. */
const PAINS = 'pains';
export const ANIMA_THIRD_PAIN = 'anima-third-pain';
/** Shiva's chain counter (AI memory): 0 none, 1 and 2 the follow-ups still to come. */
export const SHIVA_CHAIN = 'chain';

/** The flag the bench flips to measure FA8 b (Ixion's script still reads it; Shiva's and Anima's no longer do). */
export const AC_TRIGGER_FLAG = 'fallenAeonsAcTrigger';

export function acOf(unit: Ffx2Unit): number {
  return mem(unit, AC);
}

export function bumpAc(unit: Ffx2Unit, by: number): void {
  setMem(unit, AC, mem(unit, AC) + by);
}

function readsDamaged(ctx: AiContext): boolean {
  return ctx.flags[AC_TRIGGER_FLAG] === 'damaged';
}

/**
 * "+N when attacked", under whichever FA8 reading is in force: once per party action aimed at the unit, or once per landed
 * damage. **Ixion's script only** (Shiva, Anima and the Sisters now count results, which is the game's rule).
 */
export function attackedHooks(by: number): Pick<AiScript, 'onTargeted' | 'onDamaged'> {
  return {
    onTargeted(ctx) {
      if (!readsDamaged(ctx)) bumpAc(ctx.self, by);
    },
    onDamaged(ctx, _source, amount) {
      if (readsDamaged(ctx) && amount > 0) bumpAc(ctx.self, by);
    },
  };
}

/** A random living party member, or nobody (Ixion's pick; the aeons here use {@link pickGirl}). */
export function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/**
 * The reaction entry of Shiva and Anima (`m167.src:160-167`, `m169.src:119-126`): the guard holds (not from herself, not while
 * stopped, asleep, petrified, confused, berserk or ejected) -> the counter gains `by`. One call per result (1.2).
 */
export function resultGauge(by: number): Pick<AiScript, 'onResult'> {
  return {
    onResult(ctx, source) {
      if (reactionGuard(ctx.self, source)) bumpAc(ctx.self, by);
    },
  };
}

/** Shiva's three rows that use the plain Chain Attack, Heavenly Strike, Blizzaga and Attack. */
const KICK = 'x2-shiva-kick';
const BLIZZAGA = 'x2-shiva-blizzaga';
const HEAVENLY_STRIKE = 'x2-shiva-heavenly-strike';
/** Chain Attack (row 0x4100). The community calls the three polls "Triple Attack"; the ability keeps that name. */
const CHAIN_ATTACK = 'x2-shiva-triple-attack';
const DIAMOND_DUST = 'x2-shiva-diamond-dust';

/**
 * Shiva, `m167` (the order the script tests; `research/re-ffx2-ai-fallen-trema.md` 2.1):
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | chain counter = 2 | counter 0; Chain Attack on a uniform living girl |
 * | 2 | chain counter = 1 | counter 2; Chain Attack on a uniform living girl |
 * | 3 | counter >= 100 (before any addition) | counter 0; Diamond Dust on all the party |
 * | 4 | else counter + 3, and the new counter >= 65 | `random() mod 4`: 0 Heavenly Strike; 1 chain counter 1 and Chain Attack; 2 or 3 Blizzaga |
 * | 5 | else (new counter < 65) | `random() mod 4`: 0 Heavenly Strike; 1 Blizzaga; 2 or 3 Attack |
 *
 * Each move is aimed at a uniform living girl, drawn after the roll. The three Chain Attacks are three separate polls with
 * their own targets and no counter gain after the first (F1); the late table is chosen on the counter **after** adding 3 (F2);
 * every result applied to her adds 5 (F3).
 */
export const x2ShivaScript: AiScript = {
  id: 'x2-shiva',
  decide(ctx) {
    const self = ctx.self;
    const chain = mem(self, SHIVA_CHAIN);
    if (chain === 2) {
      setMem(self, SHIVA_CHAIN, 0);
      return use(CHAIN_ATTACK, pickGirl(ctx));
    }
    if (chain === 1) {
      setMem(self, SHIVA_CHAIN, 2);
      return use(CHAIN_ATTACK, pickGirl(ctx));
    }
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      return use(DIAMOND_DUST, []);
    }
    bumpAc(self, 3);
    const roll = scriptMod(ctx, 4);
    if (acOf(self) >= 65) {
      if (roll === 0) return use(HEAVENLY_STRIKE, pickGirl(ctx));
      if (roll === 1) {
        setMem(self, SHIVA_CHAIN, 1);
        return use(CHAIN_ATTACK, pickGirl(ctx));
      }
      return use(BLIZZAGA, pickGirl(ctx));
    }
    if (roll === 0) return use(HEAVENLY_STRIKE, pickGirl(ctx));
    if (roll === 1) return use(BLIZZAGA, pickGirl(ctx));
    return use(KICK, pickGirl(ctx));
  },
  ...resultGauge(5),
};

/**
 * Anima, `m169` (`research/re-ffx2-ai-fallen-trema.md` 4):
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | counter >= 100 | counter 0; Oblivion on all the party |
 * | 2 | else counter + 5; `random() mod 5` = 0 | Pain on a uniform living girl (20 %) |
 * | 3 | = 1 to 4 | Anima Attack on a uniform living girl (80 %) |
 *
 * Every result applied to her adds 5, under the same guard as Shiva's (F3). Oblivion adds nothing: the counter is reset first.
 */
export const x2AnimaScript: AiScript = {
  id: 'x2-anima',
  decide(ctx) {
    const self = ctx.self;
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      return use('x2-anima-oblivion', []);
    }
    bumpAc(self, 5);
    if (scriptMod(ctx, 5) === 0) {
      // Count her Pains; the third gets Yuna's callout (FA16 a; `src/story/scripts/ffx2-fallen-aeons.ts`).
      const pains = mem(self, PAINS) + 1;
      setMem(self, PAINS, pains);
      if (pains === 3) ctx.emit({ type: 'script-trigger', name: ANIMA_THIRD_PAIN, payload: { who: self.id } });
      return use('x2-anima-pain', pickGirl(ctx));
    }
    return use('x2-anima-stare', pickGirl(ctx));
  },
  ...resultGauge(5),
};

