/**
 * **Which party commands cannot reach a foe one hop away** (re-parity, AI lane C; **FFX only**; row D-32, which settles S-28).
 *
 * `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 1.3 (read in FFX.exe, 0x799690 and 0x791fa0): a command can pick a
 * target when its *reach* is at least the target's `BattleDistance`. The reach of a command is 0 to 3, taken from its record:
 *
 * | Reach | Party commands |
 * |---|---|
 * | 0 | every melee and weapon command, the physical Overdrives of Tidus, Auron and Kimahri, Kimahri's other Ronso Rages, the plain Attacks of the melee aeons |
 * | 1 | the aeon Overdrives Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Zanmato and Delta Attack, Spare Change, Fire Breath |
 * | 2 | Use and every item, Wakka's four reels, Rikku's Mix recipes, Seed Cannon, Valefor's Energy Blast and Energy Ray, the gunner shots |
 * | 3 | every spell, Lancet, Scan, the Special commands (Cheer, Aim ...), Valefor's, Anima's and Mindy's Attacks, the aeons' other specials |
 *
 * plus the one exception: a command whose record carries the weapon usage bit counts as 3 when its user is Wakka, Valefor or
 * Anima (that is the engine's `rangedWeapon` mark, which `targeting.ts#reachesFoesAtRange` already asks first).
 *
 * The engine's two airship distances (`airship.range`, 'near' = 0 and 'far' = 3) are decided there by the old category gate
 * (Evrae's research section 4.3). **Overdrive Sin has a third, 1** (`airship.distance`, after his second pull): there every
 * command of reach 1 or more lands and only the reach-0 ones do not, which is all this module has to know. The ids are the
 * game's own command ids (numbers only), read from its command table.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the airship distance is an FFX mechanic. Nothing here is read by `src/battle/ffx2/**`.
 */

import type { AbilityDef } from '../common/types.ts';
import { COMMAND_TARGET_WORD } from './kernel/command-reach-table.ts';
import { commandReach } from './kernel/legal-set.ts';

/** The party and aeon commands of reach 0: they need the target at distance 0. */
export const REACH_ZERO_COMMANDS: ReadonlySet<number> = new Set([
  0x3000, // Attack
  0x3006, 0x3007, // Delay Attack, Delay Buster
  0x3008, 0x3009, 0x300a, 0x300b, // Sleep, Silence, Dark, Zombie Attack
  0x300c, 0x300d, 0x300e, 0x300f, // Sleep, Silence, Dark Buster, Triple Foul
  0x3010, 0x3011, 0x3012, 0x3013, // Power, Magic, Armor, Mental Break
  0x3014, 0x3015, 0x3016, // Mug, Quick Hit, Steal
  0x3025, 0x3026, 0x302a, // Threaten, Provoke, Bribe
  0x3058, 0x3059, // Pilfer Gil, Full Break
  0x305a, 0x305b, 0x305c, 0x305d, 0x305e, 0x305f, // Extract and Nab moves, Quick Pockets
  0x3060, 0x3061, 0x3062, 0x3063, 0x3064, 0x3065, 0x3066, 0x3067, 0x3068, // Tidus's and Auron's physical Overdrives, Kimahri's Jump
  0x306b, 0x306c, 0x306d, 0x306e, 0x3070, 0x3071, 0x3072, 0x3073, // Kimahri's other Ronso Rages
  0x30cf, 0x30d2, 0x30d5, 0x30d8, // Ifrit, Ixion, Shiva, Bahamut: the plain Attack
  0x30dd, 0x30de, // Oblivion, Daigoro
  0x30e4, 0x30e5, 0x30e6, 0x30e7, 0x30e9, 0x30ff, // the Magus Sisters: Cindy's and Sandy's Attacks, Camisade, Razzia, Passado
  0x30eb, 0x30ec, 0x30ed, 0x30ee,
]);

/**
 * True when `def` needs its target at distance 0. Every item and Use are reach 2; an ability with no game record is assumed
 * melee (the old FAR gate's answer for it).
 */
export function isReachZero(def: AbilityDef): boolean {
  if (def.category === 'item') return false;
  const id = def.record?.id;
  return id === undefined ? true : REACH_ZERO_COMMANDS.has(id);
}

/**
 * **The reach of a command, 0 to 3** (`pp_BtlCommandReach`, VA 0x00799690; re-parity RC9 lane FFX-G slice G-c). The two bits at 7 and 8 of the record's target
 * word (`Cmd+0x1a`), except that a command whose record carries the bit 0x200 has reach 3 for the three actors 4, 8 and 13 (Wakka, Valefor and Anima) and no
 * others. A command can pick a target when its reach is at least the target's BattleDistance, or when the target is the user (`kernel/legal-set.ts`).
 *
 * The word comes from the game's command table by record id (`kernel/command-reach-table.ts`). An ability with no game record is ours (a test rig's, or the two
 * wrappers `NO_COMMAND_RECORD` lists) and takes the word of the game's command it stands for: an item is an item (reach 2), a spell is a spell (reach 3), a physical
 * command is the plain Attack (reach 0, and 3 for Wakka, Valefor and Anima). `userSlot` is the user's game actor number (`ai/script-random.ts#actorNumber`),
 * `undefined` for a user the game has no slot for.
 */
export function reachOf(def: AbilityDef, userSlot: number | undefined): number {
  const id = def.record?.id;
  const word = (id === undefined ? undefined : COMMAND_TARGET_WORD.get(id)) ?? standInWord(def);
  return commandReach(userSlot ?? 0xff, { b1a: word & 0xff, b1b: word >> 8, misc: 0, b20: 0, hits: 0 });
}

/** The target word of the game's command an ability with no record of its own stands for: Potion (reach 2), Fire (reach 3) or Attack (reach 0, the 0x200 bit). */
function standInWord(def: AbilityDef): number {
  if (def.category === 'item') return 0x0531;
  return def.damageType === 'magical' ? 0x0db3 : 0x0633;
}
