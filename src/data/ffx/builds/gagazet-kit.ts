/**
 * The Mt. Gagazet preset's five story aeons as shipped, and its bag, moved out of `gagazet.ts` unchanged (house
 * rule 7: that file was over 400 lines; PR-0179 needs the shipped rows on their own, so Chapter X
 * can keep D-186's Bahamut under arm b). **Game case: FFX only** (FFX-2 has no summons).
 */

import type { AeonBuild, InventoryEntry } from '../../../battle/common/types.ts';

/**
 * §7.3, §7.6, §7.7.1 [estimate scaling over a verified anchor]. §7.3's own
 * aeon row is a single flat "4,000-7,000 HP" band for all five aeons,
 * authored without the Ultimania battle-count cross-reference that
 * `research/ffx-yunalesca.md` §12 later applies — cross-checking the two
 * documents shows §7.3's band is **higher** than Yunalesca §12's decoded
 * N=270-299 table (1,341-2,542 HP) despite Mt. Gagazet coming chronologically
 * *earlier* in the game, which cannot be right (aeon stats only grow with
 * battle count). This file resolves the conflict in favour of the
 * Ultimania-anchored source: each aeon's Gagazet stats are the §12
 * N=270-299 figure scaled to roughly an early-game battle count (~0.55x HP/MP,
 * ~0.8x everything else, rounded), which keeps every stat monotonically
 * increasing from Mt. Gagazet -> Zanarkand Dome -> Dream's End as the real
 * growth curve requires. Luck has no published figure at any story point
 * and is held at a flat `[estimate]`.
 */
function aeon(
  id: AeonBuild['id'],
  name: string,
  hp: number,
  mp: number,
  str: number,
  def: number,
  mag: number,
  mdef: number,
  agi: number,
  eva: number,
  acc: number,
  abilityIds: string[],
  overdriveIds: string[],
  overdriveGauge: number,
): AeonBuild {
  return {
    id,
    name,
    spriteKey: id,
    stats: { hp, mp, str, def, mag, mdef, agi, luck: 5, eva, acc, maxHp: hp, maxMp: mp }, // luck [estimate]
    hp,
    mp,
    // §7.9.2, "Aeon gauges — the part §7.9 omitted entirely" [estimate for the
    // six values; the mechanisms verified: 2 sources]. Corrected from a flat 0
    // on 2026-09-17. The old value's note — "Seymour Banishes a summon after
    // one turn, so the aeon list mostly matters for that beat" — is the exact
    // reading §7.9.2 exists to overturn: because Banish leaves the aeon
    // **exactly one turn**, a full gauge is the difference between a summon
    // that Overdrives and a summon that does nothing but stall, and §6 row 15
    // ("summon every aeon with a full Overdrive gauge") is one of the three
    // named win conditions. §7.9.2 also fixes the budget the encounter is to
    // be balanced against — "2 full aeon Overdrives + 1 full character
    // Overdrive (Kimahri's Mighty Guard) + ~3 more aeon Overdrives reachable
    // inside the fight" — which a party of five empty aeons cannot produce.
    // Aeon gauges persist between battles and reset only when that aeon is
    // defeated (§7.9.2 opening note).
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

/**
 * The five story aeons as shipped (PR-0179: an invented ~0.55x of a later table). Chapter X's
 * Bahamut is taken from here, before any arm (`highbridge.ts`), so arm b keeps D-186's row there.
 */
export const GAGAZET_SHIPPED_AEONS: AeonBuild[] = [
  aeon('valefor', 'Valefor', 738, 24, 22, 31, 34, 34, 15, 22, 12, ['sonic-wings'], ['energy-ray'], 100), // §7.9.2 "the oldest aeon, used casually since Besaid... Full by default."
  aeon('ifrit', 'Ifrit', 988, 23, 23, 38, 33, 30, 14, 11, 12, ['meteor-strike'], ['hellfire'], 75), // §7.9.2 "used regularly on the Gagazet approach"
  aeon('ixion', 'Ixion', 983, 25, 24, 34, 32, 42, 12, 12, 13, ['aerospark'], ['thors-hammer'], 60), // §7.9.2
  aeon('shiva', 'Shiva', 878, 26, 22, 22, 37, 34, 22, 35, 12, ['heavenly-strike'], ['diamond-dust'], 50), // §7.9.2
  aeon('bahamut', 'Bahamut', 1398, 35, 26, 35, 29, 41, 15, 23, 12, ['impulse'], ['mega-flare'], 100), // §7.9.2 "authored as full on purpose" — the only native Break Damage Limit in the chapter
];

/** §7.8 [estimate] — typical inventory, includes the two Mega-Potions found on the mountain. */
export const GAGAZET_INVENTORY: InventoryEntry[] = [
  { itemId: 'potion', count: 45 },
  { itemId: 'hi-potion', count: 30 },
  { itemId: 'x-potion', count: 4 },
  { itemId: 'mega-potion', count: 4 },
  { itemId: 'phoenix-down', count: 30 },
  { itemId: 'mega-phoenix', count: 2 },
  { itemId: 'holy-water', count: 7 },
  { itemId: 'remedy', count: 3 },
  { itemId: 'soft', count: 10 },
  { itemId: 'antidote', count: 10 },
  { itemId: 'eye-drops', count: 10 },
  { itemId: 'echo-screen', count: 10 },
  { itemId: 'ether', count: 5 },
  { itemId: 'turbo-ether', count: 1 },
  { itemId: 'elixir', count: 2 },
  { itemId: 'al-bhed-potion', count: 17 },
  { itemId: 'grenade', count: 17 },
  { itemId: 'frag-grenade', count: 4 },
  { itemId: 'fire-gem', count: 10 },
  { itemId: 'ice-gem', count: 10 },
  { itemId: 'lightning-gem', count: 10 },
  { itemId: 'water-gem', count: 10 },
  { itemId: 'poison-fang', count: 5 },
  { itemId: 'light-curtain', count: 6 },
  { itemId: 'lunar-curtain', count: 6 },
  { itemId: 'star-curtain', count: 6 },
  { itemId: 'healing-water', count: 4 },
];
