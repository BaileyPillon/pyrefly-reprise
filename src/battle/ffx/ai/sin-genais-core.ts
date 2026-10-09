/**
 * **Sinspawn Genais and Sin's Core: the two rotations and their `onHit` hooks** (Sin, link 3; re-parity AI lane C, **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 6 (m139 and m138 in `ssbt02_00`); the constants, the shell, the
 * setup and the liveness hook are in `./sin-genais-core-rules.ts`.
 *
 * **Genais's turn** (rows D-23 to D-25): in the shell above 12,000 HP the exit dummy (its first turn), in the shell otherwise Sigh;
 * out of the shell below 10,000 HP the enter dummy (the Venom count restarts), else Venom on one living member (a draw only
 * with two or more), Venom, Thrashing. **The Core's turn**: it first rebuilds its stored score (`coreScore`, the script's
 * `preTurn`); charged, Gravija on the front line and Genais; else the charge dummy while Genais is shelled or dead, "inactive"
 * while it is out.
 *
 * **Genais's `onHit`** (D-26, D-27): in the shell every hit event but the Core's Gravija is answered with Cura on itself, a miss
 * and a status-only action included; out of it a command whose damage-formula byte is 3 is answered with Waterga on the attacker.
 * **The Core's `onHit`** (D-28, D-29, D-30): a magical-type command absorbed by Genais (out of its shell) raises no event at all
 * and shows "Magic absorbed."; otherwise two draws (`mod maxHP`, then `mod 8`), the stored score lowered by 3, Negation if the
 * second is under it (its own event is swallowed), else a counter if the first is above the Core's HP.
 */

import type { Command } from '../../common/types.ts';
import { blockedBySilence } from '../abilities.ts';
import { damageTypeOf } from '../hit-event.ts';
import { type HitEvent, registerHitScript } from '../hit-hooks.ts';
import { livingEnemies, livingFriendlies, tryActor } from '../state.ts';
import { gameMod, gameRandom, randomLiving } from './game-rolls.ts';
import { frontIds, react, reactionAim } from './hit-gates.ts';
import { isFormulaThree } from './command-formula.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import {
  SIN_CORE_COUNTER_STEP, SIN_CORE_ELEMENT_CYCLE, SIN_CORE_GATHERS, SIN_CORE_GRAVIJA, SIN_CORE_GUARD, SIN_CORE_INACTIVE,
  SIN_CORE_NEGATION, SIN_CORE_SCORE, SIN_CORE_SCRIPT, SIN_CORE_STATE, SIN_GENAIS_CURA, SIN_GENAIS_ID, SIN_GENAIS_SCRIPT,
  SIN_GENAIS_SHELL_IN, SIN_GENAIS_SHELL_OUT, SIN_GENAIS_SIGH, SIN_GENAIS_THRASHING, SIN_GENAIS_VENOM, SIN_GENAIS_WATERGA,
  SIN_MAGIC_ABSORBED,
} from './sin-ids.ts';
import {
  GENAIS_ENTER_BELOW, GENAIS_EXIT_ABOVE, SIN_CORE_NEGATION_ON, SIN_GENAIS_STEP, VENOM_BEFORE_THRASHING, coreAbsorbsMagic, coreState,
  coreStateAfterGravija, genaisAlive, genaisShelled, setShell, syncGenaisCoreLiveness,
} from './sin-genais-core-rules.ts';
import { coreScore, publishNegationTaken } from './sin-negation.ts';

export * from './sin-genais-core-rules.ts';

/** `damageTypeOf`'s answer for a magical command (the low two bits of the record's damage flags). */
const MAGICAL_TYPE = 2;

/** One Genais turn (note 6.2). */
export function genaisAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  syncGenaisCoreLiveness(ctx);
  if (genaisShelled(ctx)) {
    if (self.hp > GENAIS_EXIT_ABOVE) {
      setShell(ctx, self, false);
      return use(ai, SIN_GENAIS_SHELL_OUT, [self.id]);
    }
    return use(ai, SIN_GENAIS_SIGH, []);
  }
  if (self.hp < GENAIS_ENTER_BELOW) {
    setShell(ctx, self, true);
    return use(ai, SIN_GENAIS_SHELL_IN, [self.id]);
  }
  const venoms = num(ctx.state.flags, SIN_GENAIS_STEP, 0);
  if (venoms < VENOM_BEFORE_THRASHING) {
    ctx.state.flags[SIN_GENAIS_STEP] = venoms + 1;
    const victim = randomLiving(ctx);
    return use(ai, SIN_GENAIS_VENOM, victim === undefined ? [] : [victim.id]);
  }
  ctx.state.flags[SIN_GENAIS_STEP] = 0;
  return use(ai, SIN_GENAIS_THRASHING, []);
}

/** One Core turn (note 6.4), after the `preTurn` that rebuilds the stored score. */
export function sinCoreAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  syncGenaisCoreLiveness(ctx);
  ctx.state.flags[SIN_CORE_SCORE] = coreScore(ctx, self);
  const state = coreState(ctx);
  if (state === 'ready') {
    ctx.state.flags[SIN_CORE_STATE] = coreStateAfterGravija(ctx);
    const genais = tryActor(ctx, SIN_GENAIS_ID);
    return use(ai, SIN_CORE_GRAVIJA, [...frontIds(ctx), ...(genais !== undefined && genaisAlive(ctx) ? [genais.id] : [])]);
  }
  if (state === 'charging' || state === 'free') {
    ctx.state.flags[SIN_CORE_STATE] = 'ready';
    return use(ai, SIN_CORE_GATHERS, [self.id]);
  }
  // Genais out of its shell: the Core waits.
  return use(ai, SIN_CORE_INACTIVE, [self.id]);
}

/** Genais's `onHit` (m139 f4 @0x278). */
function genaisHit(event: HitEvent): void {
  const { ctx, target: genais, attacker, def } = event;
  const ai = aiContextFor(ctx, genais);
  if (genaisShelled(ctx)) {
    if (def.id === SIN_CORE_GRAVIJA) return;
    const cura = ctx.content.ability(SIN_GENAIS_CURA);
    if (!cura || blockedBySilence(genais, cura)) return;
    react(ctx, genais, genais.id, use(ai, SIN_GENAIS_CURA, [genais.id]));
    return;
  }
  if (!isFormulaThree(def, attacker)) return;
  const waterga = ctx.content.ability(SIN_GENAIS_WATERGA);
  if (!waterga || blockedBySilence(genais, waterga)) return;
  react(ctx, genais, attacker.id, use(ai, SIN_GENAIS_WATERGA, [attacker.id]));
}

/** The Core's `onHit` (m138 f5 @0x460). */
function coreHit(event: HitEvent): void {
  const { ctx, target: core, attacker, def } = event;
  const flags = ctx.state.flags;
  const ai = aiContextFor(ctx, core);

  // The absorbed spell was replaced before it resolved: no hit event, so no roll, no decay and no counter (D-30). The game's
  // `onTargeted` reads the command's own damage type (the low bits of its record, 2 = magical) and runs for a command attempted
  // AT the Core; the Core's own scripted Negation is performed, not attempted, so it is never replaced and its event reaches the
  // guard below (the note's "swallows the Core's own hit event", 6.5; the corner is open, B: handoff).
  if (attacker.side !== 'enemy' && damageTypeOf(def, attacker) === MAGICAL_TYPE && coreAbsorbsMagic(ctx)) {
    const genais = tryActor(ctx, SIN_GENAIS_ID);
    if (genais) react(ctx, genais, reactionAim(ctx, attacker), use(aiContextFor(ctx, genais), SIN_MAGIC_ABSORBED, [genais.id]));
    return;
  }

  // Its own Negation raised this event; this swallows it.
  if (flags[SIN_CORE_GUARD] === true) {
    flags[SIN_CORE_GUARD] = false;
    return;
  }

  const above = gameRandom(ctx) % core.stats.maxHp; // v7, drawn first
  const roll = gameMod(ctx, 8); // v10
  const score = Math.max(0, num(flags, SIN_CORE_SCORE, 0) - 3);
  flags[SIN_CORE_SCORE] = score;

  if (roll < score && flags[SIN_CORE_NEGATION_ON] !== false) {
    flags[SIN_CORE_GUARD] = true;
    publishNegationTaken(ctx, [...livingFriendlies(ctx), ...livingEnemies(ctx)]); // the front line, the Core, and Genais while it lives
    react(ctx, core, reactionAim(ctx, attacker), use(ai, SIN_CORE_NEGATION, []));
    return;
  }
  if (core.hp < above) {
    const step = num(flags, SIN_CORE_COUNTER_STEP, 0) % SIN_CORE_ELEMENT_CYCLE.length;
    flags[SIN_CORE_COUNTER_STEP] = (step + 1) % SIN_CORE_ELEMENT_CYCLE.length;
    react(ctx, core, reactionAim(ctx, attacker), use(ai, SIN_CORE_ELEMENT_CYCLE[step]!, []));
  }
}

registerAiScript(SIN_GENAIS_SCRIPT, genaisAi);
registerAiScript(SIN_CORE_SCRIPT, sinCoreAi);
registerHitScript(SIN_GENAIS_SCRIPT, genaisHit);
registerHitScript(SIN_CORE_SCRIPT, coreHit);
