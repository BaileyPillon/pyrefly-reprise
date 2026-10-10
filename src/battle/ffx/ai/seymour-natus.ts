/**
 * **Chapter X — Seymour Natus and Mortibody**, the Highbridge of Bevelle, as the game's own scripts run them
 * (m126 and m127; re-parity; `research/re-ffx-ai-seymour.md` section 4). **Game case: FFX only.**
 *
 * ## Natus's turn (`onTurn`)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | an aeon is in the battle | **Banish** on it, at once (no count of its turns) |
 * | 2 | phase 0 | the **Multi-ra** at the spell-set index, **then the index advances**, as two commands at two party slots (the pair, `./slot-pair.ts`) |
 * | 3 | phase 1 | **Break** on a random living member |
 * | 4 | phase 2 | **Flare** on a random living member |
 *
 * Provoked, every one of them goes to the provoker instead (he keeps control when Provoked; the engine redirects it).
 * The index is **Natus's**: Mortibody only reads it, so Natus first gives Ice and Mortibody then Thunder.
 *
 * ## Mortibody's turn (`onTurn`)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | an aeon is in the battle | nothing |
 * | 2 | the Desperado test ({@link desperadoScore}) reaches its threshold | **Desperado** on the front line |
 * | 3 | Natus phase 1 | **Shattering Claw** on a random living member |
 * | 4 | Natus phase 2 | **Cura** on Natus |
 * | 5 | Natus phase 0 | a random pick (spent, unused), then the **tier-1 spell at the index** on the whole front line |
 *
 * ## What reaches them (`onHit`, before the death check)
 *
 * * Natus: the phase is recomputed from his HP (see `./seymour-natus-rules.ts`); the first time he is under 24,000
 *   with no Protect he queues one on himself.
 * * Mortibody: at 0 HP its script sets HP and max HP to the revive value (4,000, then 3,000, 2,000, 1,000, 1,000...)
 *   and queues **Mortibsorption** on Natus, which drains that value from him, unless he is already down
 *   (`./mount-revive.ts`, the same rule as Chapter I's mount).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, livingFriendlies } from '../state.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { type ScriptHooks, type UsedCommand, queueReaction, registerScriptHooks } from './hooks.ts';
import { reviveMount } from './mount-revive.ts';
import { pickMatching, scriptMod } from './script-random.ts';
import { pickPartyPair } from './slot-pair.ts';
import {
  MORTIBODY_CLAW_ID,
  MORTIBODY_CURA_ID,
  MORTIBODY_DESPERADO_ID,
  MORTIBODY_FIRST_REVIVE_HP,
  MORTIBODY_REVIVE_HP,
  MORTIBODY_SCRIPT,
  MORTIBODY_TIER_ONE,
  NATUS_BREAK_ID,
  NATUS_FLARE_ID,
  NATUS_ID,
  NATUS_MULTI_RA,
  NATUS_PHASE,
  NATUS_PHASE_2_LINE,
  NATUS_PROTECT_FIRED,
  NATUS_SCRIPT,
  PHASE_1_BELOW,
  PHASE_2_BELOW_AFTER,
  castRotationElement,
  desperadoScore,
  natusScriptPhase,
  phase2Line,
  rotationElement,
} from './seymour-natus-rules.ts';

export * from './seymour-natus-rules.ts';

/** One Seymour Natus turn. */
export function seymourNatusAi(ai: AiContext): Command | null {
  const ctx = ai.ctx;

  // An aeon in the battle: Banish it. The engine's Banish bypasses the aeon's Eject immunity, which the script clears first.
  if (ctx.state.aeonId) {
    const aeon = pickMatching(ctx, livingFriendlies(ctx));
    return use(ai, 'banish', aeon ? [aeon.id] : []);
  }

  switch (natusScriptPhase(ctx)) {
    case 0: {
      const element = castRotationElement(ctx); // the index advances in this very step
      const pair = pickPartyPair(ctx, 'natus'); // the draws the script spends, and the two slots
      return use(ai, NATUS_MULTI_RA[element], pair ? [pair[0], pair[1]] : []);
    }
    case 1: {
      const victim = pickMatching(ctx, livingFriendlies(ctx));
      return use(ai, NATUS_BREAK_ID, victim ? [victim.id] : []);
    }
    case 2: {
      const victim = pickMatching(ctx, livingFriendlies(ctx));
      return use(ai, NATUS_FLARE_ID, victim ? [victim.id] : []);
    }
  }
}

/** One Mortibody turn. */
export function mortibodyAi(ai: AiContext): Command | null {
  const ctx = ai.ctx;
  if (ctx.state.aeonId) return null;

  // Desperado: every turn spends this draw, and the Haste-on-all-three override comes after it.
  const { total, allHasted } = desperadoScore(ctx);
  let threshold = scriptMod(ctx, 4) + 4;
  if (natusScriptPhase(ctx) === 2) threshold -= 1;
  if (allHasted) threshold = 0;
  if (total >= threshold) return use(ai, MORTIBODY_DESPERADO_ID, []);

  switch (natusScriptPhase(ctx)) {
    case 1: {
      const victim = pickMatching(ctx, livingFriendlies(ctx));
      return use(ai, MORTIBODY_CLAW_ID, victim ? [victim.id] : []);
    }
    case 2:
      return use(ai, MORTIBODY_CURA_ID, [NATUS_ID]);
    case 0:
    default:
      pickMatching(ctx, livingFriendlies(ctx)); // the pick is stored and never read; it still draws
      return use(ai, MORTIBODY_TIER_ONE[rotationElement(ctx)], []);
  }
}

function onNatusHit(ctx: Ctx, natus: FFXCombatant): void {
  const hp = natus.hp;
  if (hp >= PHASE_1_BELOW) {
    ctx.state.flags[NATUS_PHASE] = 1; // phase 0 in the game's numbering: a heal above the line takes him back
    return;
  }
  ctx.state.flags[NATUS_PHASE] = 2;
  if (!has(natus, 'protect') && ctx.state.flags[NATUS_PROTECT_FIRED] !== true) {
    ctx.state.flags[NATUS_PROTECT_FIRED] = true;
    queueReaction(ctx, natus.id, { kind: 'ability', id: 'protect', targets: [natus.id] }, { keepsControl: true });
  }
  if (hp < phase2Line(ctx)) {
    ctx.state.flags[NATUS_PHASE] = 3;
    ctx.state.flags[NATUS_PHASE_2_LINE] = PHASE_2_BELOW_AFTER;
  }
}

function onMortibodyHit(ctx: Ctx, mount: FFXCombatant, used: UsedCommand): void {
  if (mount.hp <= 0) reviveMount(ctx, mount, NATUS_ID, MORTIBODY_REVIVE_HP, MORTIBODY_FIRST_REVIVE_HP, used.user.id);
}

registerScriptHooks(NATUS_SCRIPT, { onHit: (ctx, self) => onNatusHit(ctx, self) } satisfies ScriptHooks);
registerScriptHooks(MORTIBODY_SCRIPT, {
  holdsDeath: true,
  onHit: (ctx, self, used) => onMortibodyHit(ctx, self, used),
} satisfies ScriptHooks);

registerAiScript(NATUS_SCRIPT, seymourNatusAi);
registerAiScript(MORTIBODY_SCRIPT, mortibodyAi);

