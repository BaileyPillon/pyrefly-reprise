/**
 * The end of an FFX turn and the end of a battle, split out of `engine.ts` (advisor v4,
 * 2026-09-28) so the facade is back under the 400-line house limit [AGENTS.md rule 7]. No
 * behaviour changed: `tests/unit/ffx-engine-golden.test.ts` pins every FFX chapter's whole-chain
 * log from before the split.
 *
 * Game case: FFX only (the CTB facade's own helpers).
 */

import type { BattleEvent, BattleResult, Command, FFXCombatant } from '../common/types.ts';
import { type Ctx, type EventInput, commandAbility, has, isAlive, rtOf, tryActor } from './state.ts';
import { executeCommand } from './execute.ts';
import { collectReactions, onTurnEnd } from './ticks.ts';
import { collectSignals, evaluateTriggers } from './triggers.ts';
import { collectBossCounters, runMortibsorptionIfDown } from './ai/reactions.ts';
import { drainScriptReactions } from './ai/reaction-drain.ts';
import { runMacalaniaPhaseHooks } from './ai/seymour-anima-macalania.ts';
import { counterInputs } from './counter-inputs.ts';
import { aeonDuelLost, dismissAeon } from './aeons.ts';
import { buildBattleResult, scriptedGameOver } from './results.ts';

/** What the end-of-turn helpers need from the facade. */
export interface EndHooks {
  ctx: Ctx;
  /** The facade's own emitter (assigns `seq`, fills the buffer). */
  push(event: EventInput): void;
  /** Events emitted since the current `submit` / `nextDecision` began. */
  buffer: readonly BattleEvent[];
  /** The link after this one, for the result (`BattleSetup.enemies.nextGroupId`). */
  nextGroupId: string | undefined;
}

/**
 * Turns without a new low on the enemy side's total HP before the battle is
 * called a stalemate and ended.
 *
 * Deliberately far beyond any real fight: the longest intended line in the
 * project wins Chapter 3's first link in ~195 turns, and every canonical route
 * out of Yu Yevon reaches a new minimum inside a handful of his own turns. It
 * exists for the case the research itself describes as unlosable
 * [ffx-bfa-yu-yevon §2.3 "Cannot lose"], where without it the only way out is
 * the pause menu.
 */
const STALEMATE_TURNS = 400;

/** Reactions, counters, ticks, triggers and the end check. */
export function afterAction(
  h: EndHooks,
  actor: FFXCombatant,
  actionEvents: readonly BattleEvent[],
  command?: Command,
  damageDealt = 0,
): void {
  const ctx = h.ctx;
  void damageDealt;

  // Who this action damaged, landed a status on, or pushed into a new form.
  const { damaged, counterable } = counterInputs(actor.id, actionEvents);

  // The Mortiorchis never dies; it drains Seymour and comes back smaller.
  runMortibsorptionIfDown(ctx);

  // Macalania's act transitions fire from a **hit**, not from a turn: he
  // summons the moment his HP reaches 3,000, and Anima is dismissed the
  // moment hers reaches 0 [ffx-seymour-anima-macalania §5.2, §5.3]. A no-op
  // in every other battle.
  runMacalaniaPhaseHooks(ctx);

  // (Evrae's 1/3-HP self-Haste is an `onHit` hook now, `ai/evrae-counters.ts`: it runs for every action that reaches him,
  // a missed Guided Missiles included, so no phase hook is run from here any more.)

  // From here to the end of the turn every free action is a reaction: the boss scripts' queued reactions (`ai/hooks.ts`,
  // drained below), the older boss counters and the equipment reactions. A script that keeps the engine's old rule, a
  // counter never triggers another counter (AI lane B's Yunalesca and Yu Yevon: `ai/hit-script.ts#queueCounter`), asks for
  // nothing while this is set; the scripts of the other lane chain on purpose and never read it. AI lane C's scripts
  // (Evrae, Yojimbo, Isaaru's aeons, the Fins, Genais and the Core, Sin's face) are gated by `ai/hit-gates.ts#counterAllowed`,
  // which reads the same flag: a hit that is itself a reaction moves their counters and asks for nothing.
  ctx.rt.inReaction = true;

  // Boss counters fire from the hit hook and cost no turn.
  if (command) {
    const def = commandAbility(ctx, command);
    if (def) {
      for (const counter of collectBossCounters(ctx, actor, def, counterable)) {
        const counterActor = tryActor(ctx, counter.actorId);
        if (!counterActor || !isAlive(counterActor)) continue;
        h.push({
          type: 'counter',
          actorId: counter.actorId,
          targetId: actor.id,
          abilityId: counter.command.kind === 'ability' ? counter.command.id : 'attack',
          cause: counter.cause,
        });
        executeCommand(ctx, counterActor, counter.command, true);
      }
    }
    // The reactions the boss scripts' hooks queued while the action resolved (re-parity, `ai/hooks.ts`), oldest first.
    drainScriptReactions(h);

    // Equipment reactions: Counterattack, Auto-Potion, Auto-Med, Auto-Phoenix.
    if (def) {
      for (const reaction of collectReactions(ctx, actor, def, damaged)) {
        const reactor = tryActor(ctx, reaction.actorId);
        if (!reactor) continue;
        h.push({
          type: 'counter',
          actorId: reaction.actorId,
          targetId: reaction.targetId,
          abilityId: reaction.abilityId,
          cause: reaction.cause,
        });
        const isItem = ctx.content.item(reaction.abilityId) !== undefined;
        executeCommand(
          ctx,
          reactor,
          isItem
            ? { kind: 'item', id: reaction.abilityId, targets: [reaction.targetId] }
            : { kind: 'attack', targets: [reaction.targetId] },
          true,
        );
      }
    }
  }

  drainScriptReactions(h); // what the equipment reactions set off
  ctx.rt.inReaction = false;
  onTurnEnd(ctx, actor);
  drainScriptReactions(h); // what the turn's poison tick set off (a postPoison hook)
  rtOf(ctx, actor.id).turnsTaken += 1;
  if (actor.side === 'enemy') ctx.rt.lastEnemyActorId = actor.id;
  ctx.rt.currentActorId = null;

  // An aeon that ran out of HP hands the field back; it is not a wipe.
  const aeonId = ctx.state.aeonId;
  if (aeonId) {
    const aeon = tryActor(ctx, aeonId);
    if (aeon && !isAlive(aeon)) dismissAeon(ctx, 'ko');
  }

  evaluateTriggers(ctx, collectSignals(h.buffer));
  checkEnd(h);
}

/** Victory / defeat / escape. Returns true when the battle is over. */
export function checkEnd(h: EndHooks): boolean {
  const ctx = h.ctx;
  if (ctx.state.result) return true;

  const bosses = ctx.state.enemyIds
    .map((id) => tryActor(ctx, id))
    .filter((c): c is FFXCombatant => c !== undefined);
  // A non-combatant (Cid, `ActorRuntime.nonCombatant`) never blocks victory [ffx-evrae-airship §2.1].
  const nonCombatants = bosses.filter((c) => ctx.rt.actors.get(c.id)?.nonCombatant === true);
  const fighters = nonCombatants.length > 0 && nonCombatants.length < bosses.length
    ? bosses.filter((c) => !nonCombatants.includes(c))
    : bosses;
  const primary = fighters.filter((c) => !c.flags.isPart);
  const relevant = primary.length > 0 ? primary : fighters;
  if (relevant.every((c) => !isAlive(c))) {
    finish(h, 'victory');
    return true;
  }

  // A lost aeon duel (Chapter XIV, I-G3 / B11) or a scripted Game Over (Overdrive Sin, ffx-sin §3.4), before the stalemate watch.
  if (aeonDuelLost(ctx) || scriptedGameOver(ctx)) { finish(h, 'defeat'); return true; }

  // **Stalemate.** A battle that can be neither won nor lost has to end, or the only way out is the
  // pause menu [critic round 02 #17].
  //
  // Progress is a **new minimum** on the enemy side's total HP. Yu Yevon answers every damaging
  // action with a 9,999 Curaga, the two Pagodas add ~4,500 between his turns, and the party's
  // permanent fayth Auto-Life makes defeat impossible, so a party out of Candles sits there for ever —
  // measured at 25,364 turns with the boss parked on 6,001 of 99,999. His own Gravija meanwhile takes
  // 75% of everybody's current HP every cycle, which is why "some HP moved" is not the test: HP moves
  // constantly in precisely the fight that is stuck.
  //
  // This takes nothing away from him. Every canonical route out — Doom, the Zombie inversion, Reflect
  // on him, Poison at 10% of 99,999, and the Gravija attrition that ends at 1 HP — reaches a new
  // minimum long inside the window [ffx-bfa-yu-yevon §3.5]. The longest intended line in the project,
  // Chapter 3's first link, wins in ~195 turns.
  const enemyHp = relevant.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
  if (enemyHp < ctx.rt.progress.bestEnemyHp) {
    ctx.rt.progress = { bestEnemyHp: enemyHp, atTurn: ctx.state.turn };
  } else if (ctx.state.turn - ctx.rt.progress.atTurn >= STALEMATE_TURNS) {
    ctx.emit({ type: 'message', text: 'The battle cannot be won from here.', kind: 'system' });
    // `'escape'`, because the party withdraws: `BattleResult['outcome']` has
    // three members and this is the one that means "over, not beaten".
    finish(h, 'escape');
    return true;
  }

  // An aeon holding the field keeps the party alive by definition.
  if (ctx.state.aeonId === null) {
    // A guest in the party (`FFXGuestSpec`, the hidden Sinspawn Gui chapter's Seymour) is not the player's to lose: unless the data says the battle goes on
    // while only he stands (`keepsPartyAlive`), he does not count as standing. Nobody else has a `guest`, so no other battle reads this.
    const standing = ctx.state.activeIds
      .map((id) => tryActor(ctx, id))
      .filter((c): c is FFXCombatant => c !== undefined && isAlive(c) && !has(c, 'petrify') && (c.guest === undefined || c.guest.keepsPartyAlive === true));
    if (standing.length === 0) {
      const escaped = ctx.state.activeIds.every((id) => {
        const c = tryActor(ctx, id);
        return c !== undefined && has(c, 'eject');
      });
      finish(h, escaped ? 'escape' : 'defeat');
      return true;
    }
  }
  return false;
}

export function finish(h: EndHooks, outcome: BattleResult['outcome']): void {
  const ctx = h.ctx;
  if (ctx.state.result) return;
  const result = buildBattleResult(ctx, outcome, h.nextGroupId);
  ctx.state.result = result;
  ctx.rt.finished = true;
  h.push(outcome === 'victory' ? { type: 'victory', result } : { type: 'defeat', result });
}
