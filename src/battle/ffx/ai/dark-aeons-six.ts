/**
 * **The six other Dark Aeons' scripts** (FFX only; the hidden Dark Aeons chapter, number 34): Dark Valefor (m334), Dark Ifrit (m335), Dark Ixion (m336, two scripts), Dark Shiva (m337), Dark Bahamut (m338) and Dark Anima
 * (m339), as the game's own bytecode runs them (`research/re-ffx-dark-aeons-six.md` 4, "RE six n": read from the files and run in the earlier lanes' interpreter with exact tallies over all 65,536 random results).
 * **No number here is ours**; they live with their sources in `./dark-aeons-six-rules.ts`. The scripts only choose moves and move gauges; the rows (the game's command records word for word) are
 * `src/data/ffx/enemies/dark-aeons-six-abilities.ts`.
 *
 * Every script is "gauge test, then a draw, then the gauge gain" (the same machine as Dark Yojimbo's, `./dark-aeons.ts`):
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | gauge 100 or more | the gauge is written 0 (nothing is added afterwards), then the aeon's **Overdrive** on the whole front line (Aerospark in the first Ixion fight: one living member) |
 * | 2 | otherwise | the aeon's ordinary move, picked by the draw its row of the table in `./dark-aeons-six-rules.ts` names (none for Ifrit, the first Ixion and Bahamut) |
 * | 3 | after an ordinary move | the gauge gains the aeon's per-turn step |
 *
 * **The hit events** (RE six 3): one per action that reaches the aeon; the gain and the counters are gated by `isCounterattackAllowed()` (`./hit-gates.ts#counterAllowed`) **except Dark Anima's +5, which has no gate** (a party
 * counter-attack pays it). Dark Ifrit and the first Dark Ixion answer every allowed hit event with their Attack on the attacker (a free action, a miss and a Steal included); Dark Bahamut counts allowed hits in a private
 * counter and throws Impulse on the whole front line on the fifth, which resets the counter. **A counter never triggers another counter** (the engine's older rule, which RE six 3 shows is the game's own gate), and an aeon
 * with 0 HP left after the hit queues nothing (the game's queue drops it: its owner cannot act).
 *
 * **Not modelled:** the camera work of the formation scripts and the presentation writes of the monster set-ups (death animation, floating, "Tough", model scale: RE six 4), which are the presenter's.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, rtOf } from '../state.ts';
import { setGauge } from '../overdrive.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed, frontIds, react } from './hit-gates.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { queueReaction } from './hooks.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import { IMPULSE_COUNTER, IMPULSE_EVERY, SIX_DRAW_MODULO, SIX_GAINS, SIX_GAUGE_FULL, SIX_ROWS as ROW, SIX_SCRIPTS, type SixGain } from './dark-aeons-six-rules.ts';

export * from './dark-aeons-six-rules.ts';

/** The Overdrive gauge of a combatant (0 when it has none). */
const gaugeOf = (c: FFXCombatant): number => c.overdrive?.gauge ?? 0;

/** `findMatchingChr` over the front line: one random living, targetable character (a draw only with two or more), as the row's one target. */
function victim(ai: AiContext, row: string): Command {
  const target = randomLiving(ai.ctx);
  return use(ai, row, target === undefined ? [] : [target.id]);
}

/** One whole turn: the Overdrive when the gauge is full (written 0, nothing added), else the ordinary move and then the per-turn step. */
function turn(ai: AiContext, gain: SixGain, overdrive: (ai: AiContext) => Command, ordinary: (ai: AiContext) => Command): Command {
  const { ctx, self } = ai;
  if (gaugeOf(self) >= SIX_GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    return overdrive(ai);
  }
  const command = ordinary(ai);
  setGauge(ctx, self, gaugeOf(self) + gain.perTurn, 'attacking');
  return command;
}

const group = (row: string) => (ai: AiContext): Command => use(ai, row, []);
const one = (row: string) => (ai: AiContext): Command => victim(ai, row);

// ---------------------------------------------------------------------------
// The turns (RE six 4.1 to 4.6)
// ---------------------------------------------------------------------------

/** Dark Valefor (RE six 4.1): one draw modulo 4; 0 Energy Ray on all, 1 Sonic Wings on one, 2 and 3 Attack on one. */
export const valeforTurn = (ai: AiContext): Command =>
  turn(ai, SIX_GAINS.valefor, group(ROW.energyBlast), (a) => {
    const draw = gameMod(a.ctx, SIX_DRAW_MODULO.valefor);
    return draw === 0 ? use(a, ROW.energyRay, []) : draw === 1 ? victim(a, ROW.sonicWings) : victim(a, ROW.valeforAttack);
  });

/** Dark Ifrit (RE six 4.2): Meteor Strike on one, every ordinary turn, no draw; Hellfire on all at a full gauge. */
export const ifritTurn = (ai: AiContext): Command => turn(ai, SIX_GAINS.ifrit, group(ROW.hellfire), one(ROW.meteorStrike));

/** Dark Ixion, first fight (RE six 4.3): Thundaja on one, every ordinary turn, no draw; Aerospark on one at a full gauge. */
export const ixion1Turn = (ai: AiContext): Command => turn(ai, SIX_GAINS.ixion1, one(ROW.aerospark), one(ROW.thundaja));

/** Dark Ixion, second fight (RE six 4.3): one draw modulo 3; 0 Aerospark, 1 and 2 Attack, both on one; Thor's Hammer on all at a full gauge. */
export const ixion2Turn = (ai: AiContext): Command =>
  turn(ai, SIX_GAINS.ixion2, group(ROW.thorsHammer), (a) => (gameMod(a.ctx, SIX_DRAW_MODULO.ixion2) === 0 ? victim(a, ROW.aerospark) : victim(a, ROW.ixionAttack2)));

/** Dark Shiva (RE six 4.4): one draw modulo 3; 0 Heavenly Strike, 1 and 2 Attack, both on one; Diamond Dust on all at a full gauge. */
export const shivaTurn = (ai: AiContext): Command =>
  turn(ai, SIX_GAINS.shiva, group(ROW.diamondDust), (a) => (gameMod(a.ctx, SIX_DRAW_MODULO.shiva) === 0 ? victim(a, ROW.heavenlyStrike) : victim(a, ROW.shivaAttack)));

/** Dark Bahamut (RE six 4.5): Attack on one, every ordinary turn, no draw; Mega Flare on all at a full gauge. */
export const bahamutTurn = (ai: AiContext): Command => turn(ai, SIX_GAINS.bahamut, group(ROW.megaFlare), one(ROW.ifritAttack));

/** Dark Anima (RE six 4.6): one draw modulo 3; 0 Mega Graviton on all, 1 Pain on one, 2 Attack on one; Oblivion on all at a full gauge. */
export const animaTurn = (ai: AiContext): Command =>
  turn(ai, SIX_GAINS.anima, group(ROW.oblivion), (a) => {
    const draw = gameMod(a.ctx, SIX_DRAW_MODULO.anima);
    return draw === 0 ? use(a, ROW.megaGraviton, []) : draw === 1 ? victim(a, ROW.pain) : victim(a, ROW.animaAttack);
  });

// ---------------------------------------------------------------------------
// The hit events (RE six 3 and 4)
// ---------------------------------------------------------------------------

/** The gain of an allowed hit event; false when the gate refused it (no counter either). */
function gainOnHit(event: HitEvent, perHit: number): boolean {
  const { ctx, target } = event;
  if (!counterAllowed(ctx, target)) return false;
  setGauge(ctx, target, gaugeOf(target) + perHit, 'targeted');
  return true;
}

/** An ability command aimed at `targets`, or the plain Attack while the row is not registered (a half-written table must not crash a battle). */
function commandOf(ctx: Ctx, id: string, targets: string[]): Command {
  return ctx.content.ability(id) ? { kind: 'ability', id, targets } : { kind: 'attack', targets };
}

/**
 * The free Attack at the combatant that hit (`performCommand` from inside `onHit`); nothing when the aeon is down after the hit.
 * Through `./hit-gates.ts#react`, the engine's `performCommand` rule: an aeon with a reaction already waiting drops the second
 * one, so a Doublecast (two hit events in one action) gets one answer, as the Evrae and Sin scripts do (review finding, 2026-11-06).
 */
function answerWith(event: HitEvent, row: string): void {
  const { ctx, target, attacker } = event;
  if (target.hp <= 0) return;
  react(ctx, target, attacker.id, commandOf(ctx, row, [attacker.id]));
}

/** Dark Valefor: +15 on an allowed hit. No counter. */
export function valeforHit(event: HitEvent): void {
  gainOnHit(event, SIX_GAINS.valefor.perHit);
}

/** Dark Ifrit: his Attack on the attacker on an allowed hit, then +5 (a miss and a Steal draw it too). */
export function ifritHit(event: HitEvent): void {
  if (!counterAllowed(event.ctx, event.target)) return;
  answerWith(event, ROW.ifritAttack);
  gainOnHit(event, SIX_GAINS.ifrit.perHit);
}

/** Dark Ixion, first fight: his Attack (Sleep, Armor Break, Mental Break; it can miss) on the attacker on an allowed hit, then +10. */
export function ixion1Hit(event: HitEvent): void {
  if (!counterAllowed(event.ctx, event.target)) return;
  answerWith(event, ROW.ixionAttack1);
  gainOnHit(event, SIX_GAINS.ixion1.perHit);
}

/** Dark Ixion, second fight: +10 on an allowed hit. No counter. */
export function ixion2Hit(event: HitEvent): void {
  gainOnHit(event, SIX_GAINS.ixion2.perHit);
}

/** Dark Shiva: +10 on an allowed hit. No counter. */
export function shivaHit(event: HitEvent): void {
  gainOnHit(event, SIX_GAINS.shiva.perHit);
}

/** Dark Bahamut: a private counter counts allowed hits; the fifth resets it and throws Impulse on the whole front line; every allowed hit adds 10. */
export function bahamutHit(event: HitEvent): void {
  const { ctx, target, attacker } = event;
  if (!counterAllowed(ctx, target)) return;
  const memory = rtOf(ctx, target.id).ai;
  const hits = num(memory, IMPULSE_COUNTER, 0) + 1;
  if (hits >= IMPULSE_EVERY) {
    memory[IMPULSE_COUNTER] = 0;
    if (target.hp > 0) queueReaction(ctx, target.id, commandOf(ctx, ROW.impulse, frontIds(ctx)), { keepsControl: true, byId: attacker.id });
  } else {
    memory[IMPULSE_COUNTER] = hits;
  }
  setGauge(ctx, target, gaugeOf(target) + SIX_GAINS.bahamut.perHit, 'targeted');
}

/** Dark Anima: +5 on every hit event, **ungated** (a party counter-attack pays it). No counter. */
export function animaHit(event: HitEvent): void {
  setGauge(event.ctx, event.target, gaugeOf(event.target) + SIX_GAINS.anima.perHit, 'targeted');
}

registerAiScript(SIX_SCRIPTS.valefor, valeforTurn);
registerHitScript(SIX_SCRIPTS.valefor, valeforHit);
registerAiScript(SIX_SCRIPTS.ifrit, ifritTurn);
registerHitScript(SIX_SCRIPTS.ifrit, ifritHit);
registerAiScript(SIX_SCRIPTS.ixion1, ixion1Turn);
registerHitScript(SIX_SCRIPTS.ixion1, ixion1Hit);
registerAiScript(SIX_SCRIPTS.ixion2, ixion2Turn);
registerHitScript(SIX_SCRIPTS.ixion2, ixion2Hit);
registerAiScript(SIX_SCRIPTS.shiva, shivaTurn);
registerHitScript(SIX_SCRIPTS.shiva, shivaHit);
registerAiScript(SIX_SCRIPTS.bahamut, bahamutTurn);
registerHitScript(SIX_SCRIPTS.bahamut, bahamutHit);
registerAiScript(SIX_SCRIPTS.anima, animaTurn);
registerHitScript(SIX_SCRIPTS.anima, animaHit);
