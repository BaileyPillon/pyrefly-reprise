/**
 * The party for the hidden **Penance** chapter (FFX only; `../../chapter-penance.ts`; `docs/plans/ch-penance-review.md` section 4): the endgame party that meets Penance and its two Arms on the Fahrenheit's deck. **Every number in
 * this file is an `[estimate]`** (AGENTS.md rule 6) **except the Celestial weapon rows (`./celestial-weapons.ts`, `weapon.bin`) and the caps**: no source gives a typical party for this fight, and the guides' only statements are what
 * they ask for (Jegged, GamerGuides, eip.gg, Game8: stats at the caps, Celestial weapons, a short list of armour abilities). This file is **the difficulty lever** (the other, the bag, is in it too); **no boss number is touched.**
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up | **Tidus, Yuna, Rikku** on the field; Auron, Wakka, Kimahri, Lulu on the bench | the guides' actions, not a named trio: Quick Hit (Tidus) for every attack on the body, Dispel after each Immolation (Yuna), Ultra NulAll and Quick Pockets (Rikku): Jegged, Game8, eip.gg `[W]`. Lulu is out of the field because every black spell is elemental and the three absorb all five elements. **A driver's call** (the alternative: Tidus, Auron, Rikku) |
 * | Stats | HP 9,999, MP 999, the seven other stats 255 | Jegged Stat Maxing (`./mirror-aeons.ts` `ENDGAME_CAPS`) `[estimate]` for the whole party at the caps, `[W]` for the cap |
 * | Luck | **85** | Jegged: about 85 in total is enough that plain attacks never miss `[W]` (the arms have Evasion 120) |
 * | Armour | Auto-Haste, Auto-Protect, Auto-Potion, Defense +20 percent on all seven; **no Ribbon, no Break HP Limit** | Jegged `[W]` (neither Break HP Limit nor Ribbon is needed). Auto-Haste is Slow-proof; with Auto-Protect, Defense +20 percent and five Cheers an Immolation is 7,453 to 8,416 against a 9,999-HP member (RE 4.2) |
 * | Weapons | The seven **Celestial weapons** (formula 0x11 to 0x13, Break Damage Limit built in) | Jegged, Game8, eip.gg, GamerGuides `[W]`; the rows are `[bytes]` (`./celestial-weapons.ts`) |
 * | Aeons | the five story aeons; **Yojimbo, Anima and the Magus Sisters are left out** | the Dream's End default "assume absent". A landed Zanmato ends the fight (it needs no Death roll) at about one Pay in four at 1,000,000 gil, which would make Yojimbo a coin flip around the arms. **A driver's call, his to overturn** |
 * | Rikku's Overdrive | full at the start | `[estimate]`: the guides open the fight with a Nul-All Mix (Ultra NulAll: Healing Spring and Hypello Potion); here Hyper NulAll (Lunar Curtain and Mana Spring: five Cheers and Focus and the four Nuls on everyone) |
 * | Bag | Dream's End's bag with the weaker Potions out (so Auto-Potion reaches for an X-Potion), X-Potions, Phoenix Downs and Soft raised, Three Stars, and the two ingredients of Hyper NulAll (Lunar Curtain and Mana Spring). Ultra NulAll (Healing Spring and Hypello Potion) is not offered: the engine has no Hypello Potion item, so the opening Mix is Hyper NulAll (the four Nuls and five Cheers and Focus on everyone) | Jegged `[W]`; the counts are `[estimate]` (the bench's lever) |
 *
 * The **Break HP Limit variant** (HP 99,999; eip.gg and the GameFAQs boards) is the bench's second lever (`tests/unit/helpers/penanceBot.ts`), not a shipped build.
 */

import type { AeonBuild, AutoAbilityId, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { dreamsEndBuild } from './dreams-end.ts';
import { ENDGAME_CAPS, mirrorAeonsBuild } from './mirror-aeons.ts';
import { celestialWeapon } from './celestial-weapons.ts';

/** Luck of the whole party: Jegged says about 85 in total makes plain attacks never miss `[W]`; the number is the guide's, the placement on every member is ours. */
export const PENANCE_LUCK = 85;
/** Jegged's four armour abilities. */
export const PENANCE_ARMOR: readonly AutoAbilityId[] = ['auto-haste', 'auto-protect', 'auto-potion', 'defense-20'];
/** The skills the guides ask for that Dream's End withholds: Quick Hit (Tidus). */
const EXTRA_SKILLS: Readonly<Record<string, readonly string[]>> = { tidus: ['quick-hit'] };

/** The bag's counts (`[estimate]`): the lever of the bench besides the roster. A superboss run carries full stacks (99 is the game's own cap per item); the stock of X-Potions is what Auto-Potion draws on. */
export const PENANCE_BAG: Readonly<Record<string, number>> = {
  'x-potion': 99, // the item cap: Auto-Potion spends one on every hit that takes a member under half (three per Obliteration), so the stock is the fight's clock
  'phoenix-down': 99,
  'mega-phoenix': 10,
  remedy: 20,
  soft: 20,
  'holy-water': 4,
  ether: 20,
  'turbo-ether': 20,
  elixir: 4,
  'stamina-tonic': 2,
  'three-stars': 6,
  'lunar-curtain': 4,
  'mana-spring': 4,
};

function penanceMember(m: FFXMemberBuild): FFXMemberBuild {
  const out = structuredClone(m);
  out.stats = { ...ENDGAME_CAPS, luck: PENANCE_LUCK, maxHp: ENDGAME_CAPS.hp, maxMp: ENDGAME_CAPS.mp };
  out.hp = ENDGAME_CAPS.hp;
  out.mp = ENDGAME_CAPS.mp;
  out.equipment.weapon = celestialWeapon(out.id) ?? out.equipment.weapon;
  out.equipment.armor = { ...out.equipment.armor, slots: 4, autoAbilities: [...PENANCE_ARMOR] };
  out.learnedAbilityIds = [...new Set([...out.learnedAbilityIds, ...(EXTRA_SKILLS[out.id] ?? [])])];
  if (out.id === 'rikku') out.overdrive = { ...out.overdrive, gauge: 100 }; // Hyper NulAll is her Overdrive (a Mix): full for the opening
  return out;
}

/** The five story aeons, at the endgame's stats (the Mirror Aeons chapter's derivation); Yojimbo, Anima and the Sisters are not in the list. */
function storyAeons(): AeonBuild[] {
  const story = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'];
  return mirrorAeonsBuild.aeons.filter((a) => story.includes(a.id)).map((a) => structuredClone(a));
}

export const penanceBuild: FFXPartyBuild = {
  game: 'ffx',
  members: dreamsEndBuild.members.map(penanceMember),
  activeSlots: ['tidus', 'yuna', 'rikku'],
  reserve: ['auron', 'wakka', 'kimahri', 'lulu'],
  aeons: storyAeons(),
  inventory: Object.entries(PENANCE_BAG).map(([itemId, count]) => ({ itemId, count })),
  gil: 50_000,
  sphereInventory: {},
};

export default penanceBuild;
