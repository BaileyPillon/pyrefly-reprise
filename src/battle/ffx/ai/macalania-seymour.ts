/**
 * **Seymour at Macalania Temple, as his own script runs him** (m124; re-parity;
 * `research/re-ffx-ai-seymour.md` sections 3.4 and 3.5; D-09, D-11, D-13, D-17). **Game case: FFX only.**
 *
 * ## His turn (`onTurn`)
 *
 * | # | Condition (in order) | Action |
 * |---|---|---|
 * | 1 | Anima is out | nothing (he has no turns then, the engine never asks) |
 * | 2 | his first turn | **Shell** on himself, a real turn |
 * | 3 | otherwise | the spell set at the index, which **advances before anything is cast**: Ice, Thunder, Water, Fire |
 * | 4 | (every turn from here) the party pair is worked out and its draws spent ({@link pickPartyPair}) | |
 * | 5 | an aeon is out | the **-ga** spell on it |
 * | 6 | Anima has fallen (act three) | the **Multi-** spell as **two commands**, one at each slot of the pair |
 * | 7 | otherwise | the **-ra** spell on a random living member |
 *
 * ## What reaches him (`onTargeted`, `onHit`, `postPoison`)
 *
 * * `onTargeted`: a command whose damage type is **physical** puts the **Guard** on a Guado Guardian (a coin, 48.97 %
 *   for Guardian A; a sleeper is skipped; with one Guardian left it is that one). The engine's cover routine then
 *   hands a single-target physical blow to a Guard holder that can act (`targeting.ts#coverOf`).
 * * `onHit` (after the action's last hit on him, **before the death check**) and `postPoison` (after his own
 *   poison tick, which skips the "lost HP" test): while Anima has not come, **HP 0 or HP at or below 3,000 summons
 *   her** (`./macalania-acts.ts`). The script lets a lethal hit through and puts him back on his feet, so nothing
 *   needs a damage cap or an HP floor.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, livingFriendlies, rtOf, tryActor } from '../state.ts';
import { type AiContext, use } from './types.ts';
import { DAMAGE_PHYSICAL, commandDamageType } from './command-class.ts';
import { type ScriptHooks, type UsedCommand, registerScriptHooks } from './hooks.ts';
import { pickMatching, scriptCoin } from './script-random.ts';
import { pickPartyPair } from './slot-pair.ts';
import { summonAnima } from './macalania-acts.ts';
import {
  GA_SPELL,
  GUARDIAN_IDS,
  MAC_SHELLED,
  MULTI_SPELL,
  RA_SPELL,
  SEYMOUR_MACALANIA_SCRIPT,
  SUMMON_HP_THRESHOLD,
  macalaniaAct,
  nextElement,
} from './macalania-rules.ts';

export const seymourMacalaniaAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  if (macalaniaAct(ctx) === 2) return null;
  if (ctx.state.flags[MAC_SHELLED] !== true) {
    ctx.state.flags[MAC_SHELLED] = true;
    return use(ai, 'shell', [ai.self.id]);
  }

  const element = nextElement(ctx);
  const pair = pickPartyPair(ctx, 'macalania'); // the draws the script spends whether or not it uses the pair

  // Exactly one aeon on the field: his -ga spell on it, even when it absorbs the element (the front line is the aeon).
  if (ctx.state.aeonId) {
    const aeon = pickMatching(ctx, livingFriendlies(ctx));
    return use(ai, GA_SPELL[element], aeon ? [aeon.id] : []);
  }
  if (macalaniaAct(ctx) === 3) return use(ai, MULTI_SPELL[element], pair ? [pair[0], pair[1]] : []);
  const victim = pickMatching(ctx, livingFriendlies(ctx));
  return use(ai, RA_SPELL[element], victim ? [victim.id] : []);
};

/** The Guardians standing, in actor order (A, then B). */
function standingGuardians(ctx: Ctx): FFXCombatant[] {
  return GUARDIAN_IDS.map((id) => tryActor(ctx, id)).filter((g): g is FFXCombatant => g !== undefined && isAlive(g));
}

/** Put the Guard on `g` unless it is asleep; true when it was marked. */
function guard(ctx: Ctx, g: FFXCombatant): boolean {
  if (has(g, 'sleep')) return false;
  rtOf(ctx, g.id).guardMark = true;
  return true;
}

function onSeymourTargeted(ctx: Ctx, _self: FFXCombatant, used: UsedCommand): void {
  const present = standingGuardians(ctx);
  if (present.length === 0) return;
  if (commandDamageType(used.def, used.user) !== DAMAGE_PHYSICAL) return;
  const [a, b] = [tryActor(ctx, GUARDIAN_IDS[0]), tryActor(ctx, GUARDIAN_IDS[1])];
  if (present.length === 1) {
    // "Guardian A if it stands, else B", and nothing at all when the one that stands is asleep.
    if (a && isAlive(a)) guard(ctx, a);
    else if (b) guard(ctx, b);
    return;
  }
  if (!a || !b) return;
  if (scriptCoin(ctx)) {
    if (!guard(ctx, a)) guard(ctx, b);
  } else if (!guard(ctx, b)) guard(ctx, a);
}

/**
 * The summon test of rows 1 to 4: act one only; HP 0 (a lethal hit: the script writes max HP and HP to 6,000 first)
 * or HP at or below the line. Inclusive, unlike Flux's strict lines.
 */
function summonDue(ctx: Ctx, seymour: FFXCombatant): void {
  if (macalaniaAct(ctx) !== 1) return;
  if (seymour.hp <= SUMMON_HP_THRESHOLD) summonAnima(ctx, seymour);
}

registerScriptHooks(SEYMOUR_MACALANIA_SCRIPT, {
  holdsDeath: true,
  onTargeted: (ctx, self, used) => onSeymourTargeted(ctx, self, used),
  // `onHit` stops when the action took no HP; `postPoison` does not.
  onHit: (ctx, self, _used, report) => {
    if (report.lostHp) summonDue(ctx, self);
  },
  postPoison: (ctx, self) => summonDue(ctx, self),
} satisfies ScriptHooks);

