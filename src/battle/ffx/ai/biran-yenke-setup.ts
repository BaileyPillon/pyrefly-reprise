/**
 * **The opening scene of the Biran and Yenke battle** (FFX only; `research/re-ffx-biran-yenke.md` section 3): the formation's start hook overwrites both brothers' HP, STR, MAG, AGI and MDF from Kimahri's
 * (`./biran-yenke-stats.ts#ronsoStatsFromKimahri`, one pure function). Called once from `setup.ts#buildBattle`; a no-op in every other battle (it needs both brothers and Kimahri).
 *
 * The record numbers the monsters carry (`data/ffx/enemies/biran-yenke.ts`: HP 9,999, STR 25, MAG 30, MDF 10, AGI 32) are the game's placeholders and stay in the data as they are; this is the overwrite.
 * Which numbers the game reads from Kimahri at that moment (his current battle values including gear and boosts, his current HP) is not proved (RE section 9 item 5): the engine's own combatant values
 * at the battle's start are read here, so a Kimahri who enters hurt makes weaker brothers, as the formula says.
 */

import type { FFXCombatant } from '../../common/types.ts';
import { type Ctx, tryActor } from '../state.ts';
import { type BrotherNumbers, ronsoStatsFromKimahri } from './biran-yenke-stats.ts';
import { BIRAN_ID, KIMAHRI_ID, YENKE_ID, publishSides } from './biran-yenke-rules.ts';

/** Write one brother's derived numbers onto his combatant (and his form's HP, as the possessed aeons' mirror does). */
function write(c: FFXCombatant, n: BrotherNumbers): void {
  c.stats = { ...c.stats, hp: n.hp, maxHp: n.hp, str: n.str, mag: n.mag, agi: n.agi, mdef: n.mdef };
  c.hp = n.hp;
  const form = c.enemy?.forms[0];
  if (form !== undefined) form.hp = n.hp;
}

/** The brothers' stats from Kimahri's, at the battle's start (a no-op unless the formation holds both brothers and Kimahri stands in the party). */
export function applyBiranYenkeSetup(ctx: Ctx): void {
  const biran = tryActor(ctx, BIRAN_ID);
  const yenke = tryActor(ctx, YENKE_ID);
  const kimahri = tryActor(ctx, KIMAHRI_ID);
  if (biran === undefined || yenke === undefined || kimahri === undefined || kimahri.side !== 'party') return;
  const derived = ronsoStatsFromKimahri({ str: kimahri.stats.str, mag: kimahri.stats.mag, agi: kimahri.stats.agi, hp: kimahri.hp });
  write(biran, derived.biran);
  write(yenke, derived.yenke);
  publishSides(ctx); // both start in Area 0: together (RE section 4, `[inferred]`)
}
