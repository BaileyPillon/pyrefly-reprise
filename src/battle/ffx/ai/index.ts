/**
 * AI script registry.
 *
 * Importing this module registers every rotation the three FFX chapters need.
 * `EnemyForm.aiScriptId` wins over `EnemyFields.aiScriptId`, so a boss can
 * change behaviour on a form change without swapping combatants
 * [ffx-combat-core §12.2].
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingFriendlies, tryActor } from '../state.ts';
import { type AiContext, aiContextFor, getAiScript } from './types.ts';
import { consumeSeymourTalk, seymourTalkAvailable } from './seymour-flux.ts';
import { consumeBfaTalk } from './braskas-final-aeon.ts';
import {
  SEYMOUR_MACALANIA_SCRIPT,
  GUADO_GUARDIAN_SCRIPT,
  ANIMA_MACALANIA_SCRIPT,
  consumeMacalaniaTalk,
  macalaniaTalkAvailable,
} from './seymour-anima-macalania.ts';
import { consumeNatusTalk, isNatusScript, natusTalkAvailable } from './seymour-natus-rules.ts';
import {
  ORDER_CLOSE_IN,
  ORDER_PULL_BACK,
  airshipOrderAvailable,
  queueAirshipOrder,
} from './evrae-rules.ts';

import './seymour-flux.ts';
import './yunalesca.ts';
import './braskas-final-aeon.ts';
import './yu-yevon.ts';
import './seymour-anima-macalania.ts';
import './evrae.ts';
import './yojimbo.ts';
import './seymour-natus.ts';

export * from './types.ts';
export { seymourDelayCounter, seymourThresholdCounters, consumeSeymourTalk, seymourTalkAvailable, fluxPhase } from './seymour-flux.ts';
export { yunalescaCounter, yunalescaEntryAction } from './yunalesca.ts';
export { bfaTalkCharges, consumeBfaTalk } from './braskas-final-aeon.ts';
export { yuYevonCounter, YU_YEVON_CURAGA_THRESHOLD } from './yu-yevon.ts';
export {
  MACALANIA_ASSUMPTIONS,
  MAC_ACT,
  MAC_ANIMA_SUMMONED,
  MAC_ELEMENT_STEP,
  MAC_HAS_POTIONS,
  applyMacalaniaSetup,
  consumeMacalaniaTalk,
  macalaniaAct,
  macalaniaGuardianCounter,
  macalaniaNextElement,
  macalaniaTalkAvailable,
  runMacalaniaPhaseHooks,
} from './seymour-anima-macalania.ts';
export * from './evrae.ts';
export * from './yojimbo.ts';
export * from './seymour-natus.ts';

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
 * - **Braska's Final Aeon** — zeroes his Overdrive gauge and costs him his next
 *   turn; **two charges, battle-wide**, offered a deliberately inert third time
 *   [ffx-bfa-yu-yevon §1.6, §7.3].
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
  if (script.startsWith('bfa') || script === 'braskas-final-aeon') {
    return consumeBfaTalk(aiContextFor(ctx, boss));
  }
  return false;
}

/** True when submitting Talk right now would do something [§4.7, §1.6]. */
export function talkAvailable(ctx: Ctx, talker: FFXCombatant): boolean {
  const boss = triggerHost(ctx);
  if (!boss) return false;
  const script = activeScriptId(boss) ?? boss.id;
  if (script === 'seymour-flux' || script === 'mortiorchis') return seymourTalkAvailable(ctx, talker.id);
  if (isMacalaniaScript(script)) return macalaniaTalkAvailable(ctx, talker.id);
  if (isNatusScript(script)) return natusTalkAvailable(ctx, talker.id);
  if (script.startsWith('bfa') || script === 'braskas-final-aeon') {
    const used = ctx.state.flags['bfa.talkUsed'];
    return typeof used === 'number' ? used < 2 : true;
  }
  return false;
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
  /** Why the menu row is greyed when `available` is false. */
  disabledReason: string;
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
      // Braska's Final Aeon keeps his gauge on the actor; the script's own
      // mirror is zeroed inside `consumeBfaTalk` [ffx-bfa-yu-yevon §1.6].
      const boss = triggerHost(ctx);
      if (boss?.overdrive && boss.overdrive.gauge > 0) {
        const from = boss.overdrive.gauge;
        boss.overdrive.gauge = 0;
        ctx.emit({ type: 'overdrive-gauge', who: boss.id, from, to: 0, cause: 'talk' });
      }
      return true;
    },
    // §1.6's third Talk is offered and deliberately inert; say so rather than
    // spending a turn in silence, which reads as a broken button.
    disabledReason: 'Nothing left to say',
    rejectedMessage: (user) => `${user.name} has nothing left to say`,
  },
  /**
   * **Evrae, on the *Fahrenheit*** — the two orders to Cid
   * [research/ffx-evrae-airship.md §4.2, verified: 3 sources for who may issue
   * them]. Two ids rather than one id with a payload, deliberately:
   * `TriggerCommand` has no `extra` field and adding one would be a contract
   * change for no gain.
   *
   * The order does **not** move the ship. It is queued, last order wins, and
   * Cid flies it on his next turn in place of a missile volley.
   */
  [ORDER_PULL_BACK]: {
    available: (ctx, user) => airshipOrderAvailable(ctx, user.id),
    apply: (ctx, user) => sayOrder(ctx, user, ORDER_PULL_BACK, 'pull back'),
    disabledReason: 'Not your call',
    rejectedMessage: (user) => `${user.name} cannot give that order`,
  },
  [ORDER_CLOSE_IN]: {
    available: (ctx, user) => airshipOrderAvailable(ctx, user.id),
    apply: (ctx, user) => sayOrder(ctx, user, ORDER_CLOSE_IN, 'close in'),
    disabledReason: 'Not your call',
    rejectedMessage: (user) => `${user.name} cannot give that order`,
  },
};

/**
 * Queue an Evrae order and **say** it was queued, for the reason Talk says it
 * spoke: an order changes nothing on the field until Cid's next turn, so
 * without a line the row produced only `action-start` / `action-end` and read
 * as a broken button (`tests/unit/trigger-commands.test.ts`, found when the
 * chapter was registered). Placeholder copy, like the engine's other three
 * airship messages [docs/handoff/chapter-evrae-engine.md "Owed"]. FFX only.
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

/** The script id in force for this combatant right now. */
export function activeScriptId(self: FFXCombatant): string | undefined {
  const enemy = self.enemy;
  if (!enemy) return undefined;
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
  // an auto-attack [ffx-combat-core §4.2].
  const targets = livingFriendlies(ctx);
  return { kind: 'attack', targets: targets.length > 0 ? [ctx.rng.pick(targets).id] : [] };
}
