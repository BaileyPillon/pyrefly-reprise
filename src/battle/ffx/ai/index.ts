/**
 * AI script registry.
 *
 * Importing this module registers every rotation the three FFX chapters need.
 * `EnemyForm.aiScriptId` wins over `EnemyFields.aiScriptId`, so a boss can
 * change behaviour on a form change without swapping combatants
 * [ffx-combat-core §12.2].
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingEnemies, livingFriendlies, tryActor } from '../state.ts';
import { type AiContext, aiContextFor, getAiScript } from './types.ts';
import { consumeSeymourTalk, seymourTalkAvailable } from './seymour-flux.ts';
import { bfaTalkState, consumeBfaTalk } from './braskas-final-aeon.ts';
import {
  SEYMOUR_MACALANIA_SCRIPT,
  GUADO_GUARDIAN_SCRIPT,
  ANIMA_MACALANIA_SCRIPT,
  consumeMacalaniaTalk,
  macalaniaTalkAvailable,
} from './seymour-anima-macalania.ts';
import { consumeNatusTalk, isNatusScript, natusTalkAvailable } from './seymour-natus-rules.ts';
import {
  ORDER_CANCEL,
  ORDER_CLOSE_IN,
  ORDER_PULL_BACK,
  airshipOrderAvailable,
  airshipOrderDisabledReason,
  cancelAirshipOrder,
  queueAirshipOrder,
} from './evrae-rules.ts';

import './seymour-flux.ts';
import './yunalesca.ts';
import './braskas-final-aeon.ts';
import './yu-pagoda.ts';
import './possessed-aeons.ts';
import './possessed-sisters.ts'; // the hidden Last Summoning chapter (FFX only): the three possessed Magus Sisters in one battle
import './yu-yevon.ts';
import './seymour-anima-macalania.ts';
import './evrae.ts';
import './yojimbo.ts';
import './seymour-natus.ts';
import './seymour-omnis.ts';
import './isaaru.ts';
import './sin-scripts.ts';
import './sinspawn-gui.ts'; // the hidden Sinspawn Gui chapter (FFX only): the body, the head and the arms
import './biran-yenke.ts'; // the hidden Biran and Yenke chapter (FFX only): the two Ronso

export * from './types.ts';
export { consumeSeymourTalk, seymourTalkAvailable, fluxPhase } from './seymour-flux.ts';
export { yunalescaCounter, yunalescaEntryAction } from './yunalesca.ts';
export { bfaTalkCharges, bfaTalkState, consumeBfaTalk } from './braskas-final-aeon.ts';
export { YU_YEVON_CURAGA_THRESHOLD } from './yu-yevon.ts';
export {
  MAC_ACT,
  MAC_ANIMA_SUMMONED,
  MAC_ELEMENT_STEP,
  MAC_HAS_POTIONS,
  applyMacalaniaSetup,
  consumeMacalaniaTalk,
  macalaniaAct,
  macalaniaNextElement,
  macalaniaTalkAvailable,
  runMacalaniaPhaseHooks,
} from './seymour-anima-macalania.ts';
export * from './evrae.ts';
export * from './yojimbo.ts';
export * from './seymour-natus.ts';
export * from './seymour-omnis.ts';
export * from './isaaru.ts';

/** True for any of the three actors in the Macalania formation. */
function isMacalaniaScript(script: string): boolean {
  return (
    script === SEYMOUR_MACALANIA_SCRIPT ||
    script === GUADO_GUARDIAN_SCRIPT ||
    script === ANIMA_MACALANIA_SCRIPT
  );
}

/** The boss a Trigger Command is aimed at: the living non-part enemy. */
function triggerHost(ctx: Ctx): FFXCombatant | undefined {
  return ctx.state.enemyIds
    .map((id) => tryActor(ctx, id))
    .find((c): c is FFXCombatant => c !== undefined && isAlive(c) && !c.flags.isPart);
}

/**
 * Run the **Talk** Trigger Command for whoever submitted it.
 *
 * Talk is one menu row with two entirely different, entirely encounter-owned
 * effects, so the dispatch is on the boss standing opposite:
 *
 * - **Braska's Final Aeon** — sets a flag his next turn answers: the pending Overdrive
 *   is cancelled, the gauge cleared and the turn lost (nothing happens to the gauge
 *   when Talk is used); **two charges, battle-wide**, offered a deliberately inert
 *   third time [ffx-bfa-yu-yevon §1.6, §7.3; re-ffx-ai-yunalesca-bfa §3.6].
 * - **Seymour Flux** — Kimahri +10 Strength, Yuna +10 Magic Defense, **once per
 *   character** [ffx-seymour-flux §4.7].
 *
 * Returns false when the command had no effect, so the executor can say so
 * instead of eating a turn in silence.
 */
export function applyTalkTrigger(ctx: Ctx, talker: FFXCombatant): boolean {
  const boss = triggerHost(ctx);
  if (!boss) return false;
  const script = activeScriptId(boss) ?? boss.id;
  if (script === 'seymour-flux' || script === 'mortiorchis') return consumeSeymourTalk(ctx, talker);
  // **Macalania has its OWN table** — Tidus / Yuna / Wakka, not Flux's
  // Kimahri / Yuna. `research/ffx-seymour-anima-macalania.md` §13 row 4 calls
  // a shared table a major defect; the Trigger Command master table lists a
  // different set for every Seymour form.
  if (isMacalaniaScript(script)) return consumeMacalaniaTalk(ctx, talker);
  // **Natus has its own table too** — Tidus / Auron +10 Strength, Yuna +10
  // Magic Defense [ffx-seymour-natus-highbridge §6.2, verified: 4 sources].
  if (isNatusScript(script)) return consumeNatusTalk(ctx, talker);
  if (isBfaScript(script)) return consumeBfaTalk(aiContextFor(ctx, boss));
  return false;
}

/** True when the Talk row is on offer right now [§4.7, §1.6; Braska's Final Aeon: `bfaTalkState`]. */
export function talkAvailable(ctx: Ctx, talker: FFXCombatant): boolean {
  const boss = triggerHost(ctx);
  if (!boss) return false;
  const script = activeScriptId(boss) ?? boss.id;
  if (script === 'seymour-flux' || script === 'mortiorchis') return seymourTalkAvailable(ctx, talker.id);
  if (isMacalaniaScript(script)) return macalaniaTalkAvailable(ctx, talker.id);
  if (isNatusScript(script)) return natusTalkAvailable(ctx, talker.id);
  if (isBfaScript(script)) return bfaTalkState(ctx.state.flags) === 'open';
  return false;
}

function isBfaScript(script: string): boolean {
  return script.startsWith('bfa') || script === 'braskas-final-aeon';
}

/** Why Talk is greyed: Braska's Final Aeon's waiting Talk says so, every other greyed Talk has nothing left to say. */
function talkDisabledReason(ctx: Ctx): string {
  const boss = triggerHost(ctx);
  const script = boss ? (activeScriptId(boss) ?? boss.id) : '';
  return isBfaScript(script) && bfaTalkState(ctx.state.flags) === 'pending' ? 'Waiting for his turn' : 'Nothing left to say';
}

// ---------------------------------------------------------------------------
// Trigger Command dispatch
// ---------------------------------------------------------------------------

/**
 * One Trigger Command id, and everything both ends of the engine need for it.
 *
 * Until the Evrae chapter there was exactly one trigger in the project, so
 * `commands.ts` and `execute.ts` each hard-coded `id === 'talk'` and every
 * other id fell through to "nothing happened". `TriggerCommand.id` has always
 * been an arbitrary string [types.ts], so the fix is a table rather than a
 * contract change [preflight §4.2 E-4].
 *
 * `apply` returns false when the command had no effect, so the executor can say
 * so instead of eating a turn in silence.
 */
export interface TriggerHandler {
  available: (ctx: Ctx, user: FFXCombatant) => boolean;
  apply: (ctx: Ctx, user: FFXCombatant) => boolean;
  /** Why the menu row is greyed when `available` is false (a function when the reason depends on the state). */
  disabledReason: string | ((ctx: Ctx, user: FFXCombatant) => string);
  /** What the banner says when a submitted trigger is refused. */
  rejectedMessage: (user: FFXCombatant) => string;
}

const TRIGGERS: Readonly<Record<string, TriggerHandler>> = {
  /** Seymour Flux, Braska's Final Aeon, Macalania — see {@link applyTalkTrigger}. */
  talk: {
    available: (ctx, user) => talkAvailable(ctx, user),
    apply: (ctx, user) => {
      if (!applyTalkTrigger(ctx, user)) return false;
      // A Trigger Command that lands must *say* it landed. Braska's Final Aeon's
      // charge is often spent while his gauge already reads 0, and without this
      // the whole action produced nothing but `action-start` and `action-end` —
      // a row that works and looks broken.
      ctx.emit({ type: 'message', text: `${user.name} speaks`, kind: 'story' });
      // A boss that keeps its gauge on the actor (not Braska's Final Aeon, whose gauge is on the flag bag and is
      // cleared when his next turn starts, `ai/braskas-final-aeon.ts`).
      const boss = triggerHost(ctx);
      if (boss?.overdrive && boss.overdrive.gauge > 0) {
        const from = boss.overdrive.gauge;
        boss.overdrive.gauge = 0;
        ctx.emit({ type: 'overdrive-gauge', who: boss.id, from, to: 0, cause: 'talk' });
      }
      return true;
    },
    // Braska's Final Aeon (re-parity row B7, Bailey 2026-10-09 "Yes, match the game"): the row is greyed while a Talk waits on his
    // next turn, and the third Talk is offered and only speaks (`rejectedMessage`), after which the row is spent. Say so rather
    // than spending a turn in silence, which reads as a broken button.
    disabledReason: (ctx) => talkDisabledReason(ctx),
    rejectedMessage: (user) => `${user.name} has nothing left to say`,
  },
  /**
   * **Evrae, on the *Fahrenheit*** — the three orders to Cid
   * [research/ffx-evrae-airship.md §4.2, verified: 3 sources for who may issue
   * them]. One id each rather than one id with a payload, deliberately:
   * `TriggerCommand` has no `extra` field and adding one would be a contract
   * change for no gain.
   *
   * The order does **not** move the ship. It is queued and Cid flies it on his next turn in place of a missile volley.
   * Only the one on offer is available ({@link orderOnOffer}): Pull back at NEAR, Close in at FAR, Cancel while one stands.
   */
  [ORDER_PULL_BACK]: orderHandler(ORDER_PULL_BACK, (ctx, user) => sayOrder(ctx, user, ORDER_PULL_BACK, 'pull back')),
  [ORDER_CLOSE_IN]: orderHandler(ORDER_CLOSE_IN, (ctx, user) => sayOrder(ctx, user, ORDER_CLOSE_IN, 'close in')),
  [ORDER_CANCEL]: orderHandler(ORDER_CANCEL, (ctx, user) => {
    if (!cancelAirshipOrder(ctx, user)) return false;
    ctx.emit({ type: 'message', text: `${user.name} cancels the order`, kind: 'story' });
    return true;
  }),
};

/** One of the three airship orders: available while it is the one on offer, and the reason says why not. */
function orderHandler(orderId: string, apply: TriggerHandler['apply']): TriggerHandler {
  return {
    available: (ctx, user) => airshipOrderAvailable(ctx, user.id, orderId),
    apply,
    disabledReason: (ctx, user) => airshipOrderDisabledReason(ctx, user.id, orderId),
    rejectedMessage: (user) => `${user.name} cannot give that order`,
  };
}

/**
 * Queue an Evrae order and **say** it was queued, for the reason Talk says it
 * spoke: an order changes nothing on the field until Cid's next turn, so
 * without a line the row produced only `action-start` / `action-end` and read
 * as a broken button (`tests/unit/trigger-commands.test.ts`, found when the
 * chapter was registered). Placeholder copy, like the engine's other airship
 * messages [docs/handoff/chapter-evrae-engine.md "Owed"]. FFX only.
 */
function sayOrder(ctx: Ctx, user: FFXCombatant, orderId: string, words: string): boolean {
  if (!queueAirshipOrder(ctx, user, orderId)) return false;
  ctx.emit({ type: 'message', text: `${user.name} orders Cid to ${words}`, kind: 'story' });
  return true;
}

/** The handler for a `TriggerCommand.id`, or `undefined` for an unknown id. */
export function triggerHandler(id: string): TriggerHandler | undefined {
  return TRIGGERS[id];
}

/** Every registered trigger id, for the tests and the debug API. */
export function registeredTriggerIds(): string[] {
  return Object.keys(TRIGGERS).sort();
}

/**
 * The script id in force for this combatant right now. A guest in the party (`FFXGuestSpec`, FFX only) has no `enemy` block; his script
 * is the one his build names.
 */
export function activeScriptId(self: FFXCombatant): string | undefined {
  const enemy = self.enemy;
  if (!enemy) return self.guest?.aiScriptId;
  const form = enemy.forms[enemy.formIndex];
  return form?.aiScriptId ?? enemy.aiScriptId;
}

/**
 * Pick an action for an AI-controlled combatant.
 *
 * Falls back to a plain Attack when no script is registered for the id, so a
 * data file that names a rotation the engine has not implemented still plays
 * rather than crashing.
 */
export function chooseAiCommand(ctx: Ctx, self: FFXCombatant): Command | null {
  const id = activeScriptId(self);
  const script = id ? getAiScript(id) : undefined;
  const ai: AiContext = aiContextFor(ctx, self);
  if (script) return script(ai);

  // Confused actors attack a random target on either side; Berserk restricts to
  // an auto-attack [ffx-combat-core §4.2]. An enemy's fallback aims at the party's side, as it always did;
  // a guest in the party (an AI guest with no script) aims at the enemy side, never at his own.
  const targets = self.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
  // An unscripted combatant: no script, so no game draw to match. The pick is an engine stand-in on the engine-side stream.
  return { kind: 'attack', targets: targets.length > 0 ? [ctx.rng.aux.pick(targets).id] : [] };
}
