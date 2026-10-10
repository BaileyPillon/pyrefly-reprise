/**
 * The setup of the possession fights (re-parity, AI lane B; **FFX only**): what a possessed aeon copies from the player's own,
 * and the opening turn order of `sins07_*` (`research/re-ffx-ai-yunalesca-bfa.md` sections 5.3 and 5.4).
 *
 * **What it copies** (row A3): the monster's init reads the party aeon's Strength, Defense, Magic, Magic Defense, Agility,
 * Evasion, Accuracy and maximum HP, and sets its HP to that maximum. Its Luck stays the record's 0 and its MP the record's 1
 * (the engine used to copy all of it and force Luck to 1). Its affinities, status resistances and moves are its own data's
 * (`data/ffx/enemies/braskas-final-aeon.ts`): Ifrit absorbs Fire, Ixion Thunder, Shiva Ice, all are immune to Slow (row A4).
 *
 * **The opening** (row A8): the possessed actor has First Strike and CTB 0, both Pagodas start at CTB 24, and Character #1 to #3
 * each gain CTB + 1 from the battle's start hook, + 1 more from the aeon's own init. The note takes the two writes to both run
 * before the first turn, so +2 (inferred); Yu Yevon's battle has the hook alone (+1), writes his Pagodas' CTB to 24 and never
 * writes his own.
 */

import type { FFXCombatant, FFXPartyBuild } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';

/** Copy the party aeon's stats onto the possessed one (a no-op for every other enemy). */
export function mirrorPossessedAeon(c: FFXCombatant, party: FFXPartyBuild): void {
  if (!c.id.startsWith('possessed-')) return;
  const aeonId = c.id.slice('possessed-'.length);
  const build = party.aeons.find((a) => a.id === aeonId);
  if (!build) return;
  c.stats = { ...build.stats, luck: 0, mp: 1, maxMp: 1 };
  c.hp = build.stats.maxHp;
  c.mp = 1;
  c.alive = c.hp > 0;
  const form = c.enemy?.forms[0];
  if (form) form.hp = build.stats.maxHp;
}

/**
 * The opening counters of a possession fight and of Yu Yevon's, after the engine seeded the usual ones (the game's 26 fixed
 * opening draws, re-parity W2). The counters are the game's bytes and the clock counts each down, so the script's writes stand
 * as they are (nothing is rebased; a counter pushed back is clamped at 255).
 */
export function applyPossessionOpening(ctx: Ctx): void {
  const enemies = ctx.state.enemyIds.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
  const aeon = enemies.find((c) => c.flags.isPart !== true && c.id.startsWith('possessed-'));
  const yuYevon = enemies.find((c) => c.id === 'yu-yevon');
  if (aeon === undefined && yuYevon === undefined) return;
  if (aeon !== undefined) rtOf(ctx, aeon.id).ctb = 0;
  for (const part of enemies.filter((c) => c.flags.isPart === true)) rtOf(ctx, part.id).ctb = 24;
  for (const id of ctx.state.activeIds) rtOf(ctx, id).ctb = Math.min(255, rtOf(ctx, id).ctb + (aeon !== undefined ? 2 : 1));
}
