/**
 * Chapter 2 — Yunalesca, three forms [ffx-yunalesca §5].
 *
 * The decompiled AI keeps its state in numbered script slots; we keep the same
 * names so the research reads straight onto the code:
 *
 * | slot | meaning |
 * |---|---|
 * | `priv0004` | in-form cycle counter (Form I: a toggle; II/III: a step index) |
 * | `priv0008` | anti-aeon sub-cycle index |
 * | `priv000C` | the target she picked on her own last turn |
 *
 * Two things that are easy to get wrong and that the fight depends on:
 * - While an aeon is out, `priv0004` is **frozen**, not advanced. Summoning
 *   *postpones* a Mega Death; it never deletes one [§5.3].
 * - The Zombie weighting counts **slots**, not living characters — a KO'd but
 *   still zombified member keeps suppressing Hellbiter [§15.2 #29].
 */

import type { Command, DamageType } from '../../common/types.ts';
import { has, isAlive, tryActor } from '../state.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const CYCLE = 'priv0004';
const AEON_CYCLE = 'priv0008';
const LAST_TARGET = 'priv000C';
/** Pending transformation: 1 = I->II, 2 = II->III. Set by `advanceForm`. */
const PENDING = 'priv002C';

/** Random living active party member. */
function randomLiving(ai: AiContext): string[] {
  const pool = ai.ctx.state.activeIds.filter((id) => {
    const c = tryActor(ai.ctx, id);
    return c !== undefined && isAlive(c);
  });
  return pool.length > 0 ? [ai.ctx.rng.pick(pool)] : [];
}

/** The frontline actor with the **highest current HP** [§5.1, decompile offset 02AB]. */
function highestHp(ai: AiContext): string[] {
  const aeonId = ai.ctx.state.aeonId;
  const pool = (aeonId ? [aeonId] : ai.ctx.state.activeIds)
    .map((id) => tryActor(ai.ctx, id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined && isAlive(c));
  if (pool.length === 0) return [];
  let best = pool[0];
  for (const c of pool) if (best && c.hp > best.hp) best = c;
  return best ? [best.id] : [];
}

/** Random living frontline actor — the aeon when one holds the field. */
function randomFrontline(ai: AiContext): string[] {
  const aeonId = ai.ctx.state.aeonId;
  if (aeonId) return [aeonId];
  return randomLiving(ai);
}

/** How many of the three **slots** carry Zombie, KO'd members included. */
function zombieSlots(ai: AiContext): number {
  let count = 0;
  for (const id of ai.ctx.state.activeIds) {
    const c = tryActor(ai.ctx, id);
    if (c && has(c, 'zombie')) count++;
  }
  return count;
}

/**
 * The shared weighted step: `P(heal) = (weight * zombieSlots + 10) / 100`.
 *
 * The RNG draws happen in the decompile's order — target first, then the
 * heal-vs-Hellbiter roll, then the spell choice — and the **target roll is
 * consumed even when Hellbiter wins**, which matters for replay parity.
 */
function weightedStep(ai: AiContext, weightPerZombie: number, healSpell: string): Command {
  const target = randomLiving(ai);
  if (target[0] !== undefined) ai.memory[LAST_TARGET] = target[0];
  const weight = weightPerZombie * zombieSlots(ai) + 10;
  const roll = ai.ctx.rng.int(0, 99);
  if (roll < weight) {
    // `rand()%100 > 50` over a uniform [0,99] is 49% Cura / 51% Regen.
    const spell = ai.ctx.rng.int(0, 99) > 50 ? healSpell : 'regen';
    return use(ai, spell, target);
  }
  return use(ai, 'hellbiter', ai.ctx.state.activeIds.slice());
}

/**
 * Form I — human, 24 000 HP.
 *
 * Strict alternation, no aeon branch exists: `priv0004` toggles and her first
 * action is always Dispelling Slap [§5.1].
 */
export const yunalescaFormOne = (ai: AiContext): Command | null => {
  const toggle = num(ai.memory, CYCLE, 0);
  ai.memory[CYCLE] = toggle === 0 ? 1 : 0;
  if (toggle === 0) {
    const target = randomLiving(ai);
    if (target[0] !== undefined) ai.memory[LAST_TARGET] = target[0];
    return use(ai, 'dispelling-slap', target);
  }
  const target = highestHp(ai);
  if (target[0] !== undefined) ai.memory[LAST_TARGET] = target[0];
  return use(ai, 'absorb', target);
};

/**
 * Form II — serpent skirt, 48 000 HP.
 *
 * The turn after the transformation is a **guaranteed heal**: the transition
 * reset `priv0004` to 0 and case 0 has no Hellbiter branch at all [§5.2].
 */
export const yunalescaFormTwo = (ai: AiContext): Command | null => {
  if (ai.ctx.state.aeonId) {
    const step = num(ai.memory, AEON_CYCLE, 0);
    if (step === 0) {
      ai.memory[AEON_CYCLE] = 255;
      return use(ai, 'absorb', randomFrontline(ai));
    }
    ai.memory[AEON_CYCLE] = 0;
    return use(ai, 'hellbiter', ai.ctx.state.activeIds.slice());
  }

  const step = num(ai.memory, CYCLE, 0);
  if (step === 0) {
    ai.memory[CYCLE] = 2;
    const target = randomLiving(ai);
    if (target[0] !== undefined) ai.memory[LAST_TARGET] = target[0];
    return use(ai, ai.ctx.rng.int(0, 99) > 50 ? 'cura' : 'regen', target);
  }
  ai.memory[CYCLE] = step + 1;
  return weightedStep(ai, 30, 'cura');
};

/**
 * Form III — medusa face, 60 000 HP.
 *
 * A five-step ring: two weighted steps, a forced Mind Blast, one more weighted
 * step, then Mega Death — whose case **assigns** 0 rather than incrementing,
 * which is what closes the ring [§5.3].
 */
export const yunalescaFormThree = (ai: AiContext): Command | null => {
  if (ai.ctx.state.aeonId) {
    const step = num(ai.memory, AEON_CYCLE, 0);
    ai.memory[AEON_CYCLE] = (step + 1) % 4;
    if (step === 0) return use(ai, 'mind-blast-aeon', ai.ctx.state.activeIds.slice());
    if (step === 2) return use(ai, 'osmose', ai.ctx.state.activeIds.slice());
    return use(ai, 'absorb', randomFrontline(ai));
  }

  const step = num(ai.memory, CYCLE, 0);
  if (step === 2) {
    ai.memory[CYCLE] = 3;
    return use(ai, 'mind-blast', ai.ctx.state.activeIds.slice());
  }
  if (step === 4) {
    ai.memory[CYCLE] = 0;
    return use(ai, 'mega-death', ai.ctx.state.activeIds.slice());
  }
  ai.memory[CYCLE] = step + 1;
  return weightedStep(ai, 20, 'curaga');
};

/** Dispatch on the live form index, so one `aiScriptId` covers the whole fight. */
export const yunalescaAi = (ai: AiContext): Command | null => {
  // A pending transformation outranks everything, **including the aeon test**:
  // the first turn after a form change is Metamorphosis plus its entry action,
  // fired through an aeon if one is out [§1.3 step B, §2.0 precedence 1].
  const pending = num(ai.memory, PENDING, 0);
  if (pending !== 0) {
    const entry = yunalescaEntryAction(ai, pending);
    if (entry) return entry;
  }

  const form = ai.self.enemy?.formIndex ?? 0;
  if (form === 0) return yunalescaFormOne(ai);
  if (form === 1) return yunalescaFormTwo(ai);
  return yunalescaFormThree(ai);
};

/**
 * Her counters [§5.1, §5.2, §5.3]. Counters fire from the hit hook, cost 0 CTB
 * ticks and never consult a rank.
 *
 * Form I answers by the incoming damage type, behind the original game's own
 * gate bug: the Blind and Silence branches test **`priv000C`** — the target she
 * picked on her *own* last turn — rather than the attacker. Keeping one party
 * member blinded therefore shuts off her Blind counter entirely. Reproduce it.
 */
export function yunalescaCounter(ai: AiContext, attackerId: string, damageType: DamageType): Command | null {
  const form = ai.self.enemy?.formIndex ?? 0;
  if (attackerId === ai.self.id) return null;

  if (form === 0) {
    const lastTargetId = ai.memory[LAST_TARGET];
    const lastTarget = typeof lastTargetId === 'string' ? tryActor(ai.ctx, lastTargetId) : undefined;
    if (damageType === 'physical') {
      if (lastTarget && has(lastTarget, 'darkness')) return null;
      return use(ai, 'blind-counter', [attackerId]);
    }
    if (damageType === 'magical') {
      if (lastTarget && has(lastTarget, 'silence')) return null;
      return use(ai, 'silence-counter', [attackerId]);
    }
    // The Sleep branch has no gate at all.
    return use(ai, 'sleep-counter', [attackerId]);
  }

  if (form === 1) {
    // `rand()%100 > 50` — 49%, not 50%.
    if (ai.ctx.rng.int(0, 99) > 50) return use(ai, 'dispelling-slap', [attackerId]);
    return null;
  }
  // Form III counters every eligible hit, unconditionally.
  return use(ai, 'dispelling-slap', [attackerId]);
}

/**
 * The entry action fired on the turn a transformation lands [§1.3 step B].
 *
 * I -> II is Metamorphosis 1 then **Hellbiter** on the whole party; II -> III is
 * Metamorphosis 2 then **Mega Death**. It is a real scheduled turn (rank 3), it
 * clears the pending flag, and it does **not** advance `priv0004` — the cycle
 * counter is 0 going in and 0 coming out, which is what makes Form II's next
 * turn the guaranteed heal and Form III's next turn step 2 of its ring.
 */
export function yunalescaEntryAction(ai: AiContext, newForm: number): Command | null {
  ai.memory[PENDING] = 0;
  ai.memory[CYCLE] = 0;
  ai.memory[AEON_CYCLE] = 0;
  const party = ai.ctx.state.activeIds.slice();
  if (newForm === 1) {
    ai.ctx.emit({ type: 'message', text: `${ai.self.name} uses Metamorphosis`, kind: 'ability' });
    return use(ai, 'hellbiter', party);
  }
  if (newForm === 2) {
    ai.ctx.emit({ type: 'message', text: `${ai.self.name} uses Metamorphosis`, kind: 'ability' });
    return use(ai, 'mega-death', party);
  }
  return null;
}

registerAiScript('yunalesca', yunalescaAi);
registerAiScript('yunalesca-form-1', yunalescaAi);
registerAiScript('yunalesca-form-2', yunalescaAi);
registerAiScript('yunalesca-form-3', yunalescaAi);
