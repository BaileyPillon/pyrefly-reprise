/**
 * Chapter 2, Yunalesca, three forms: her turn and her `onHit`, read from her own script
 * (`research/re-ffx-ai-yunalesca-bfa.md` section 2, m130 in `dome06_00`; **FFX only**).
 *
 * The script keeps its state in numbered slots, and so do we, under the names the note uses:
 *
 * | slot | meaning |
 * |---|---|
 * | `priv0004` (v2) | in-form counter: Form I a toggle, Forms II and III a step index |
 * | `priv0008` (v3) | the sub-cycle that runs while an aeon is out |
 * | `priv000C` (v4) | the actor she picked on her own last turn (starts as Tidus, actor 0) |
 * | `priv002C` (v12) | a transformation waiting for its entry turn: 1 = I to II, 2 = II to III |
 * | `formIndex` (v0, v1) | the form she is in |
 *
 * Things that are easy to get wrong and that the fight turns on:
 * - In Form II the counter v2 **advances on every aeon turn too** (both aeon actions fall into the shared "+1" join), so
 *   an aeon that stood for a turn has already spent the guaranteed-heal turn (row Y1). Form III's aeon branch does not
 *   touch v2: a summoned aeon postpones its Mega Death without erasing its place.
 * - The Zombie weighting counts the three **slots** (Character #1 to #3), KO'd or off the field or not.
 * - The Form I Blind and Silence counters test the status of the target she picked **last turn**, not the attacker's.
 * - The counters run for every sub-action that reached her (a miss or a hit for 0 too), from anyone but herself, and a
 *   form's killing blow is a transformation instead of a counter (rows Y3 to Y5).
 * - Every target pick draws only with two or more candidates, in ascending actor order (`game-rolls.ts`).
 */

import type { Command } from '../../common/types.ts';
import { advanceForm } from '../forms.ts';
import { has, tryActor } from '../state.ts';
import {
  canQueue, frontLine, gameMod, highestHpLiving, randomLiving, zombieSlots,
} from './game-rolls.ts';
import { type HitEvent, damageTypeOf, queueCounter, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';

const CYCLE = 'priv0004';
const AEON_CYCLE = 'priv0008';
const LAST_TARGET = 'priv000C';
/** Pending transformation: 1 = I->II, 2 = II->III. Set by `forms.ts#advanceForm`. */
const PENDING = 'priv002C';
/** Her v4 before she has picked anyone: actor 0. */
const FIRST_TARGET = 'tidus';

/** The front line as a target list (`-14`): the aeon alone while one holds the field. */
function frontIds(ai: AiContext): string[] {
  return frontLine(ai.ctx).map((c) => c.id);
}

/** Remember the actor she aimed at (v4); none when the pick found nobody. */
function aimAt(ai: AiContext, id: string | undefined): void {
  ai.memory[LAST_TARGET] = id ?? '';
}

/**
 * The shared weighted step of Forms II and III: pick the target first, roll the heal against `weight x Zombie slots + 10`,
 * then a second roll chooses the spell; otherwise Hellbiter on the front line. The target draw is spent even when
 * Hellbiter wins [note section 2.8].
 */
function weightedStep(ai: AiContext, weightPerZombie: number, healSpell: string): Command | null {
  const target = randomLiving(ai.ctx);
  aimAt(ai, target?.id);
  const heals = gameMod(ai.ctx, 100) < weightPerZombie * zombieSlots(ai.ctx) + 10;
  if (!heals) return use(ai, 'hellbiter', frontIds(ai));
  const spell = gameMod(ai.ctx, 100) > 50 ? healSpell : 'regen';
  return target ? use(ai, spell, [target.id]) : null;
}

/** Form I, human, 24,000 HP: strict alternation; no aeon branch exists. */
export const yunalescaFormOne = (ai: AiContext): Command | null => {
  const toggle = num(ai.memory, CYCLE, 0);
  ai.memory[CYCLE] = toggle === 0 ? 1 : 0;
  if (toggle === 0) {
    const target = randomLiving(ai.ctx);
    aimAt(ai, target?.id);
    return target ? use(ai, 'dispelling-slap', [target.id]) : null;
  }
  const target = highestHpLiving(ai.ctx);
  aimAt(ai, target?.id);
  return target ? use(ai, 'absorb', [target.id]) : null;
};

/**
 * Form II, serpent skirt, 48,000 HP. The turn after the transformation is a guaranteed heal (v2 is 0 and that case has no
 * Hellbiter branch); the aeon branch alternates Absorb and Hellbiter and, unlike Form III's, advances v2.
 */
export const yunalescaFormTwo = (ai: AiContext): Command | null => {
  const step = num(ai.memory, CYCLE, 0);
  if (ai.ctx.state.aeonId) {
    const aeonStep = num(ai.memory, AEON_CYCLE, 0);
    ai.memory[CYCLE] = step + 1;
    if (aeonStep === 0) {
      ai.memory[AEON_CYCLE] = 255;
      const target = randomLiving(ai.ctx);
      aimAt(ai, target?.id);
      return target ? use(ai, 'absorb', [target.id]) : null;
    }
    ai.memory[AEON_CYCLE] = 0;
    return use(ai, 'hellbiter', frontIds(ai));
  }
  if (step === 0) {
    const target = randomLiving(ai.ctx);
    aimAt(ai, target?.id);
    ai.memory[CYCLE] = 2; // v2 := 1, then the join's +1
    const spell = gameMod(ai.ctx, 100) > 50 ? 'cura' : 'regen';
    return target ? use(ai, spell, [target.id]) : null;
  }
  ai.memory[CYCLE] = step + 1;
  return weightedStep(ai, 30, 'cura');
};

/**
 * Form III, medusa face, 60,000 HP. With no aeon: weighted, weighted, Mind Blast, weighted, Mega Death, and again (v2 runs
 * 0 to 4; the Mega Death case assigns 0, which closes the ring). With an aeon out: a four-step ring on v3 that leaves v2 alone.
 */
export const yunalescaFormThree = (ai: AiContext): Command | null => {
  if (ai.ctx.state.aeonId) {
    const aeonStep = num(ai.memory, AEON_CYCLE, 0);
    ai.memory[AEON_CYCLE] = (aeonStep + 1) % 4;
    if (aeonStep === 0) return use(ai, 'mind-blast-aeon', frontIds(ai));
    if (aeonStep === 2) return use(ai, 'osmose', frontIds(ai));
    const target = randomLiving(ai.ctx);
    aimAt(ai, target?.id);
    return target ? use(ai, 'absorb', [target.id]) : null;
  }
  const step = num(ai.memory, CYCLE, 0);
  if (step === 4) {
    ai.memory[CYCLE] = 0;
    return use(ai, 'mega-death', frontIds(ai));
  }
  if (step === 2) {
    ai.memory[CYCLE] = 3;
    return use(ai, 'mind-blast', frontIds(ai));
  }
  ai.memory[CYCLE] = step + 1;
  return weightedStep(ai, 20, 'curaga');
};

/** Dispatch on the live form index, so one `aiScriptId` covers the whole fight. */
export const yunalescaAi = (ai: AiContext): Command | null => {
  // A pending transformation outranks everything, the aeon test included: Metamorphosis, then its entry action.
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
 * The entry turn after a transformation [note section 2.4]: Metamorphosis on herself, then Hellbiter (I to II) or Mega Death
 * (II to III) on the whole front line, two sub-actions of one turn. Only v12 is cleared; the counters were reset by the
 * transformation, and the turn does not advance v2.
 */
export function yunalescaEntryAction(ai: AiContext, newForm: number): Command | null {
  ai.memory[PENDING] = 0;
  if (newForm !== 1 && newForm !== 2) return null;
  ai.ctx.emit({ type: 'message', text: `${ai.self.name} uses Metamorphosis`, kind: 'ability' });
  return use(ai, newForm === 1 ? 'hellbiter' : 'mega-death', frontIds(ai));
}

/**
 * What she answers a hit with [note section 2.9]. `damageType` is the low two bits of the command's damage flags
 * (0 neither, 1 physical, 2 magical, 3 both).
 *
 * Form I: Blind for a physical command and Silence for a magical one, each only if the status is not already on the
 * target she picked **last turn**; Sleep for a command that is neither (no gate); a command that is both gets nothing.
 * Form II: Dispelling Slap when `GetRandomValue mod 100 > 50` (48.97%). Form III: Dispelling Slap always.
 */
export function yunalescaCounter(ai: AiContext, attackerId: string, damageType: number): Command | null {
  const form = ai.self.enemy?.formIndex ?? 0;
  if (form === 1) return gameMod(ai.ctx, 100) > 50 ? use(ai, 'dispelling-slap', [attackerId]) : null;
  if (form >= 2) return use(ai, 'dispelling-slap', [attackerId]);
  const remembered = ai.memory[LAST_TARGET];
  const gate = tryActor(ai.ctx, typeof remembered === 'string' ? remembered : FIRST_TARGET);
  if (damageType === 1 && !(gate && has(gate, 'darkness'))) return use(ai, 'blind-counter', [attackerId]);
  if (damageType === 2 && !(gate && has(gate, 'silence'))) return use(ai, 'silence-counter', [attackerId]);
  if (damageType === 0) return use(ai, 'sleep-counter', [attackerId]);
  return null;
}

/**
 * Her `onHit` (m130 f4 @0x05EE), once per sub-action that reached her. HP at 0: the next form (scene 0, the CTB writes of
 * `forms.ts#advanceForm`), no counter; Form III at 0 is her death, which the engine settles after the hook. Otherwise,
 * unless the last attacker is herself, the counter above is queued at the attacker.
 */
function yunalescaHit(event: HitEvent): void {
  const { ctx, target: boss, attacker, def } = event;
  if (boss.hp === 0) {
    const form = boss.enemy?.formIndex ?? 0;
    if (form < 2 && advanceForm(ctx, boss)) ctx.rt.formDiedAtSeq = ctx.state.nextSeq; // for a Doublecast's second cast
    return;
  }
  if (attacker.id === boss.id) return;
  const ai = aiContextFor(ctx, boss);
  const command = yunalescaCounter(ai, attacker.id, damageTypeOf(def, attacker));
  if (command && canQueue(boss)) queueCounter(ctx, { actorId: boss.id, targetId: attacker.id, command });
}

registerAiScript('yunalesca', yunalescaAi);
registerAiScript('yunalesca-form-1', yunalescaAi);
registerAiScript('yunalesca-form-2', yunalescaAi);
registerAiScript('yunalesca-form-3', yunalescaAi);
for (const id of ['yunalesca', 'yunalesca-form-1', 'yunalesca-form-2', 'yunalesca-form-3']) {
  registerHitScript(id, yunalescaHit, { managesHp: true });
}
