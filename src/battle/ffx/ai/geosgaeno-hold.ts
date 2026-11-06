/**
 * **The swallow-hold** (FFX only; the hidden Flooded Ways chapter): what Geosgaeno does to the character it swallows and what the character is left with, from the game's own script
 * (`research/re-ffx-geosgaeno-evrae-altana.md` 4.1, "RE 4.1"; read from `m109` and run in the earlier lanes' interpreter with exact tallies).
 *
 * | Moment | What happens |
 * |---|---|
 * | **Swallow** | the victim is **out of the fight**: untargetable, and every command but one is disabled for them (Attack, White and Black Magic, Item, Skill, Special, Weapon, Armor and their Overdrive: RE 4.1, 33 command-lock calls). They are **given Struggle**; **Defend stays** (the script does not list it). Geosgaeno **copies their statuses** (below) and banners print which moved |
 * | **The victim's turn** | Struggle (a piercing weapon strike at Geosgaeno) or Defend. A Struggle's hit is what Geosgaeno answers: its maximum HP is set to the victim's **current HP**, Regurgitate hits **the victim alone** for that (a KO) and nobody else is hurt |
 * | **Geosgaeno's next turn** | it **spits the victim out**: the victim is targetable again, their commands return, Struggle is taken away; its maximum HP is set to the victim's current HP **minus 1** and Regurgitate (formula 16: the user's maximum HP, no variance) hits the **whole front line, the victim included**; the victim is left at 1 HP, anyone at or below the number is KO'd. Its maximum HP is put back after the action |
 * | **Killing it while it holds someone** | the death blow: 9,999 to the whole front line, the held one included |
 *
 * **The status copy** (RE 4.1 postTurn, on the turn Swallow is queued): the **ailments** Zombie, Poison, the four Breaks, Silence and Darkness (set to 2 turns) are **moved** (Geosgaeno gains them whatever its own immunities say, the
 * victim loses them); the **buffs** Shell, Protect, Reflect (10 turns each), the four Nuls (1 charge), Regen (10), Haste (10, clears Slow) and Slow (10, clears Haste) are **copied** (the victim keeps them, but loses a Slow); Confuse is lost.
 * Sleep is tested and ignored.
 *
 * **Where this engine differs from the game (rule 6: said, not tuned).** (1) The game rewrites Geosgaeno's maximum HP around the Regurgitate and restores it in its post-turn handler; so does this
 * ({@link rewriteMaxHp}, {@link settleMaxHp}, which `engine-end.ts#afterAction` calls once the command and its reactions have resolved). (2) **After a Struggle the hold ends** (the victim is gone, their turn answered): the
 * script's own next-turn spit-out is not run on an empty stomach (`[inferred]`: the note ran the Struggle, not the turn after; run live check L2). (3) The death blow is dealt as damage to each member of the front line
 * directly (as `scripted.ts#mortibsorption` deals its transfer), not as a queued command, because a dead monster's queued command is dropped by the reaction drain.
 */

import type { AvailableCommand, Command, FFXCombatant, StatusId } from '../../common/types.ts';
import { type Ctx, abilityOf, has, isAlive, tryActor } from '../state.ts';
import { DEFEND_ABILITY_ID } from '../registry.ts';
import { removeStatus } from '../statuses.ts';
import { dealDamage } from '../hp.ts';
import { frontLine } from './game-rolls.ts';
import {
  COPIED_BUFFS,
  COPIED_BUFF_TURNS,
  DEATH_REGURGITATE,
  FLOODED_ROWS,
  GEOSGAENO_ID,
  GEO_V4,
  HOLD_FLAG,
  MOVED_AILMENTS,
  MOVED_SHORT_TURNS,
  STOMACH_SAVED_MAX,
  heldId,
  heldMember,
} from './flooded-ways-rules.ts';

/** The party's front line that can be hit now: alive and on the field (the held member included: they are alive, only untargetable). */
export function hitByRegurgitate(ctx: Ctx): FFXCombatant[] {
  return frontLine(ctx).filter((c) => isAlive(c));
}

// ---------------------------------------------------------------------------
// The maximum-HP rewrite
// ---------------------------------------------------------------------------

/** Set Geosgaeno's maximum HP to `amount` for the Regurgitate that is about to run (the amount is the hit's damage: formula 16 is the user's maximum HP times 10 over 10). */
export function rewriteMaxHp(ctx: Ctx, geo: FFXCombatant, amount: number): void {
  const saved = ctx.state.flags[STOMACH_SAVED_MAX];
  if (typeof saved !== 'number' || saved <= 0) ctx.state.flags[STOMACH_SAVED_MAX] = geo.stats.maxHp;
  geo.stats.maxHp = Math.max(0, amount);
}

/** Put Geosgaeno's maximum HP back (the game's post-turn handler). A no-op when nothing was rewritten. */
export function settleMaxHp(ctx: Ctx): void {
  const saved = ctx.state.flags[STOMACH_SAVED_MAX];
  if (typeof saved !== 'number' || saved <= 0) return;
  const geo = tryActor(ctx, GEOSGAENO_ID);
  if (geo !== undefined) geo.stats.maxHp = saved;
  ctx.state.flags[STOMACH_SAVED_MAX] = 0;
}

// ---------------------------------------------------------------------------
// Swallowing and releasing
// ---------------------------------------------------------------------------

function give(ctx: Ctx, to: FFXCombatant, id: StatusId, turns: number | null): void {
  const instance = { id, turnsRemaining: turns, ticksRemaining: null, charges: id.startsWith('nul') ? 1 : null, stacks: 0, permanent: false };
  to.statuses[id] = instance;
  ctx.emit({ type: 'status-add', targetId: to.id, status: id, instance: { ...instance } });
}

/** The post-turn transfer (RE 4.1): the ailments move to Geosgaeno, the buffs are copied. Returns the statuses Geosgaeno gained, for the banners. */
export function copyStatuses(ctx: Ctx, geo: FFXCombatant, victim: FFXCombatant): StatusId[] {
  const gained: StatusId[] = [];
  for (const id of MOVED_AILMENTS) {
    if (!has(victim, id)) continue;
    const short = id === 'silence' || id === 'darkness';
    give(ctx, geo, id, short ? MOVED_SHORT_TURNS : (victim.statuses[id]?.turnsRemaining ?? null));
    removeStatus(ctx, victim, id, 'cured');
    gained.push(id);
  }
  for (const id of COPIED_BUFFS) {
    if (!has(victim, id)) continue;
    give(ctx, geo, id, id.startsWith('nul') ? null : COPIED_BUFF_TURNS);
    gained.push(id);
    if (id === 'haste' && has(geo, 'slow')) removeStatus(ctx, geo, 'slow', 'cured');
    if (id === 'slow') {
      if (has(geo, 'haste')) removeStatus(ctx, geo, 'haste', 'cured');
      removeStatus(ctx, victim, 'slow', 'cured'); // the victim's Slow is removed
    }
  }
  if (has(victim, 'confuse')) removeStatus(ctx, victim, 'confuse', 'cured'); // the victim also loses Confuse
  return gained;
}

/** Swallow `victim`: the hold, the untargetable mark, the status copy and the banners (RE 4.1). */
export function swallowVictim(ctx: Ctx, geo: FFXCombatant, victim: FFXCombatant): void {
  ctx.state.flags[HOLD_FLAG] = victim.id;
  victim.flags.untargetable = true;
  ctx.emit({ type: 'message', text: `${victim.name} is swallowed`, kind: 'story' });
  for (const id of copyStatuses(ctx, geo, victim)) ctx.emit({ type: 'message', text: `${geo.name} gains ${id.replace(/-/g, ' ')}`, kind: 'status' });
}

/** The hold ends: the victim is targetable again and their commands return (the hold flag is what refuses them). */
export function releaseHold(ctx: Ctx): void {
  const victim = heldMember(ctx);
  if (victim !== undefined) delete victim.flags.untargetable;
  ctx.state.flags[HOLD_FLAG] = '';
}

/** The death blow (RE 4.1 onDeath): 9,999 to the whole front line, the held one included, while somebody is inside. Returns true when it was dealt. */
export function deathBlow(ctx: Ctx, geo: FFXCombatant): boolean {
  if (heldId(ctx) === undefined) return false;
  const victims = hitByRegurgitate(ctx);
  ctx.emit({ type: 'message', text: `${geo.name} bursts`, kind: 'story' });
  releaseHold(ctx);
  for (const c of victims) dealDamage(ctx, c, DEATH_REGURGITATE, { sourceId: geo.id, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
  ctx.state.flags[GEO_V4] = 0;
  return true;
}

// ---------------------------------------------------------------------------
// The held character's menu
// ---------------------------------------------------------------------------

/** The held character's menu (Struggle and Defend only), or `null` for everyone else, whose menu is the ordinary one. Called first by `commands.ts#menuRows`. */
export function heldMenuRows(ctx: Ctx, user: FFXCombatant): AvailableCommand[] | null {
  if (heldId(ctx) !== user.id) return null;
  const geo = tryActor(ctx, GEOSGAENO_ID);
  const rows: AvailableCommand[] = [];
  const struggle = abilityOf(ctx, FLOODED_ROWS.struggle);
  if (struggle !== undefined) {
    const ready = geo !== undefined && isAlive(geo);
    const row: AvailableCommand = {
      command: { kind: 'ability', id: struggle.id, targets: [] },
      label: struggle.name,
      category: 'special',
      mpCost: 0,
      rank: struggle.rank ?? 3,
      enabled: ready,
      validTargets: ready ? [geo.id] : [],
      targeting: 'single-enemy',
      help: 'Strike from the inside. You fall, and the rest of the party is spared the spit-out.',
    };
    if (!ready) row.disabledReason = 'No target';
    rows.push(row);
  }
  const defend = abilityOf(ctx, DEFEND_ABILITY_ID);
  if (defend !== undefined) {
    rows.push({ command: { kind: 'defend', targets: [] }, label: defend.name, category: defend.category, mpCost: 0, rank: defend.rank ?? 3, enabled: true, validTargets: [] });
  }
  return rows;
}

/** Does the hold refuse this submitted command? Everything but Struggle and Defend is disabled for the held character (RE 4.1); `engine.ts#submit` asks through `formation-commands.ts#commandRefused`. */
export function heldRefuses(ctx: Ctx, user: FFXCombatant, command: Command): boolean {
  if (heldId(ctx) !== user.id) return false;
  if (command.kind === 'defend') return false;
  return !(command.kind === 'ability' && command.id === FLOODED_ROWS.struggle);
}
