/**
 * The five aeons Dream's End leaves out, and the two states the engine asks of a build that owns Yojimbo or the Magus Sisters (the hidden Last Summoning chapter, hidden chapter 28; **FFX only** [AGENTS.md rule 14]:
 * aeons exist only in FFX). Everything the chapter's build adds to `dreamsEndBuild` is in this file, so every estimate is in one place and labelled.
 *
 * **Stats** (the player's own aeons, which the possessed copies then copy): `research/ffx-combat-core.md` section 6.4.3's inside-Sin block, N = 360 (tier 11), for Anima, Yojimbo, Cindy, Sandy and Mindy, the block
 * Dream's End's five aeons already take (`./late-aeon-rows.ts`). `[estimate]` in that document's own sense: mechanically derived from `[verified: 3 sources]` constants and its declared Yuna profile. (HP MP STR DEF MAG MDEF
 * AGI EVA ACC LUCK; Yojimbo has no MP.)
 *
 * **Estimates and choices of ours, each named** (the sources give none of them, except Yojimbo's two starting values, which are the game's own):
 *  - {@link YOJIMBO_START}: his starting compatibility **128, the game's own starting value (read at boot, 2026-10-17: before any save was loaded, FFX itself wrote compatibility 128 and hire answer 2)** (`FFXPartyBuild.yojimbo`, the
 *    RE session's `docs/handoff/re-parity-ffx-yojimbo-sisters.md`; the image holds 0 because the game writes it at boot; a community save pack (not the owner's: 107 saves, downloaded 2026-09-26) agreed: every slot from 1 to 84 reads 128
 *    before recruitment); and his **hire answer 1, a player's Cavern answer** (the three replies the haggle offers are 0, 1 and 2; the game's own starting value, the one a Yojimbo never hired through the scene has, is **2**,
 *    read at boot on 2026-10-17, and Chapter XXVII uses it). **Chapter 28 keeps 1 on purpose: it is a choice of ours, which reply a player gave, and the two chapters are NOT aligned, because aligning moves a chapter's Zanmato odds and no source picks
 *    between two legal player histories.** The party's **gil 50,000** is Dream's End's own `[estimate]`.
 *  - {@link SISTERS_START}: each Sister's starting motivation **50**, the middle of 0 to 100. The engine's note says "UNSOURCED" and the chapter labels it; it moves the chance of the orders the Sisters' menu offers
 *    and the Combine powers roll (`200 + motivation` of 256).
 *  - The extra aeons' **starting Overdrive gauges**: Dream's End's five carry `research/ffx-seymour-flux.md` section 7.9.2's values (60, 55, 50, 55, 70), which name no gauge for the others. An aeon's gauge
 *    carries from battle to battle and falls to 0 only when the aeon is defeated, so an unused aeon would hold whatever the story left; nothing sources that. **Anima and Yojimbo start empty** (the fight fills
 *    Anima's; Yojimbo's Pay needs none) and **the three Sisters start full** ({@link SISTERS_START_GAUGE}, `[estimate]`): the engine's Combine powers is offered only while all three of their own stored gauges
 *    are full (a Grand Summon's temporary gauge does not count), and the engine can fill them only through the gains an aeon already has, because the seven other orders that would build them are not carried out
 *    yet (the RE lane FFX-K's `docs/handoff/re-parity-ffx-yojimbo-sisters.md`, open item 1, whose advice for a chapter that owns the Sisters is to start them full). Combine spends the bar.
 */

import type { AeonBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { AEONS } from '../aeons/index.ts';
import { type AeonStatRow, withRow } from './gagazet-aeon-arms.ts';

/** §6.4.3, Braska's Final Aeon / Yu Yevon, inside Sin, N = 360 (tier 11): the five aeons Dream's End leaves out. */
export const INSIDE_SIN_OPTIONAL_ROWS: Readonly<Record<string, AeonStatRow>> = {
  anima: { hp: 4288, mp: 112, str: 100, def: 66, mag: 52, mdef: 56, agi: 21, eva: 32, acc: 38, luck: 17 },
  yojimbo: { hp: 2601, mp: 0, str: 84, def: 71, mag: 37, mdef: 56, agi: 21, eva: 89, acc: 64, luck: 17 },
  cindy: { hp: 7070, mp: 132, str: 82, def: 89, mag: 50, mdef: 68, agi: 24, eva: 32, acc: 38, luck: 17 },
  sandy: { hp: 5808, mp: 91, str: 134, def: 69, mag: 56, mdef: 68, agi: 24, eva: 28, acc: 47, luck: 17 },
  mindy: { hp: 4105, mp: 164, str: 63, def: 63, mag: 65, mdef: 68, agi: 29, eva: 36, acc: 43, luck: 17 },
};

/** Yojimbo's starting state: compatibility 128 (the game's own starting value, read at boot, 2026-10-17) and hire answer 1, a player's Cavern answer (the game's own start is 2; Chapter XXVII uses it, this chapter keeps 1). See the file header. */
export const YOJIMBO_START: NonNullable<FFXPartyBuild['yojimbo']> = { compatibility: 128, hireAnswer: 1 };

/** The Sisters' starting state: every motivation 50 (`[estimate]`: the middle of 0 to 100; unsourced). See the file header. */
export const SISTERS_START: NonNullable<FFXPartyBuild['sisters']> = { motivation: { cindy: 50, sandy: 50, mindy: 50 } };

/** The Sisters' starting stored gauge: full (`[estimate]`; the file header says why). */
export const SISTERS_START_GAUGE = 100;

/** One extra aeon: its stat row, its starting gauge (empty unless given), and the abilities and Overdrive its catalog entry lists (`../aeons/index.ts`). */
function extraAeon(id: string, name: string, abilityIds: string[], overdriveIds: string[], gauge = 0): AeonBuild {
  const row = INSIDE_SIN_OPTIONAL_ROWS[id]!;
  return withRow(
    {
      id,
      name,
      spriteKey: AEONS[id]?.spriteKey ?? id, // the catalogue's art: Yojimbo is `yojimbo-cavern`, the approved painting (D-054), as in Chapter XXVII
      stats: { ...row, maxHp: row.hp, maxMp: row.mp },
      hp: row.hp,
      mp: row.mp,
      overdriveGauge: gauge,
      abilityIds: [...abilityIds, 'shield', 'boost'],
      overdriveIds,
    },
    row,
  );
}

/**
 * Anima, Yojimbo, Cindy, Sandy and Mindy, in the list's order, each a fresh object. Yojimbo's and the Sisters' own menus are the engine's (`battle/ffx/aeon-commands.ts`: Pay and Dismiss; the orders and Dismiss), so the
 * ability ids they carry here are their catalog entries' and only matter to the places that read a build's list (the party prep, the Sensor).
 */
export function optionalAeons(): AeonBuild[] {
  return [
    extraAeon('anima', 'Anima', ['pain'], ['oblivion']),
    extraAeon('yojimbo', 'Yojimbo', ['daigoro', 'kozuka', 'wakizashi-single', 'wakizashi-multi'], ['zanmato']),
    extraAeon('cindy', 'Cindy', ['camisade'], ['delta-attack'], SISTERS_START_GAUGE),
    extraAeon('sandy', 'Sandy', ['razzia'], ['delta-attack'], SISTERS_START_GAUGE),
    extraAeon('mindy', 'Mindy', ['passado'], ['delta-attack'], SISTERS_START_GAUGE),
  ];
}
