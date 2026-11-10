/**
 * The party for the hidden **Gauntlet** chapter (FFX only; chapter 54): the endgame party that meets the Monster Arena creations, **derived from the Dark Aeons preset** (`./dark-aeons.ts`, itself the Mirror Aeons preset
 * with a different line-up; **every number in both is an `[estimate]` and says so**) with the two changes the preflight asks for (`docs/plans/ch-gauntlet-review.md` section 4, picks GA4 and GA5). **No boss number is
 * touched**: this file and the order of the acts are the chapter's difficulty levers, and the bench turns the party's levers before anything else (AGENTS.md rule 15).
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up (GA4: "row 34's endgame party, Switch open") | **Tidus, Yuna and Auron** on the field; Lulu, Wakka, Kimahri and Rikku on the bench; Switch open (no formation of the chapter closes it: `lineUp` and `noSwitch` are unset) | `./dark-aeons.ts`; the Ultima Buster's arms gate physical blows only (RE n 3.1), so Lulu and her magic are the bench's first swap there |
 * | **One Piercing weapon** (GA4) | **Auron's** weapon: `piercing` replaces his Strength +5 | Earth Eater, Catastrophe and the Ultima Buster's Head and Arms are Armored (RE n 1) and the Ultima Buster's body is made so while an Arm lives; Piercing is the sourced answer to Armored, and Auron's weapon is the heaviest physical blow of the line-up (`./dark-aeons.ts`). `[estimate]`: which member |
 * | **Kills, for Karma** (GA5) | **500 kills each**, all seven members | Karma is the target's kill count x 100 (RE n 3.9, formula 22); no source gives a typical endgame count, so 500 is our `[estimate]`, flagged: lethal at any value above 99 (`kills x 100 >= 9,999`) and capped at 99,999; the alternative (0) would take Don Tonberry's teeth |
 * | Everything else | the Dark Aeons preset's, unchanged | HP 9,999, MP 999, every other stat 255, Luck 60, Evasion 255, Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon, Break Damage Limit on every weapon, First Strike on Tidus and Yuna, 17 Phoenix Downs, 1,500,000 gil, Yojimbo (compatibility 128, hire answer 2) and the Sisters, the nine aeons and Anima |
 *
 * **Findings of stage 1 that are levers for the later tiers, not changes made here** (`docs/handoff/ch-gauntlet.md`, F1 and F2): the Ribbon is no Death ward in this engine (Earth Eater's Megaton Punch, tier 2, kills the member it
 * lands on; a `deathproof` armour stops it at the price of a slot), and Evasion 255 plus Luck 60 makes the two accuracy-2 Attacks (Neslug's, Jormungand's) miss every time. The bench of the tier that meets them decides.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { darkAeonsBuild } from './dark-aeons.ts';

/** The kill count each member starts with, for Karma (preflight GA5). `[estimate]`: no source gives a typical endgame count. */
export const GAUNTLET_KILLS_PER_MEMBER = 500;
/** The member whose weapon is the one Piercing weapon (preflight GA4). `[estimate]` */
export const GAUNTLET_PIERCING_MEMBER = 'auron';

/** Auron's weapon with Piercing in place of Strength +5 (the other three slots as the Dark Aeons preset has them). */
function piercingWeapon(m: FFXMemberBuild): FFXMemberBuild['equipment'] {
  const weapon = m.equipment.weapon;
  const abilities = (weapon.autoAbilities ?? []).map((a) => (a === 'strength-5' ? ('piercing' as const) : a));
  return { ...m.equipment, weapon: { ...weapon, autoAbilities: abilities } };
}

export const gauntletBuild: FFXPartyBuild = {
  ...darkAeonsBuild,
  members: darkAeonsBuild.members.map((m) => ({
    ...m,
    kills: GAUNTLET_KILLS_PER_MEMBER,
    ...(m.id === GAUNTLET_PIERCING_MEMBER ? { equipment: piercingWeapon(m) } : {}),
  })),
};

export default gauntletBuild;
