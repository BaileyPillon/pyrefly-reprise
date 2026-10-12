/**
 * FFX's three item reactions: Auto-Potion, Auto-Med and Auto-Phoenix, and the "can this character act" test they share.
 *
 * **Game case: FFX only** (FFX-2 has its own auto-abilities in its own exe). Source: FFX.exe, Steam build 25501027, SHA-256
 * 0537B2A1...686D; the note `FFX-G02` sections 3.8 and 3.9 and `FFX-G05` section 4.2 (private working notes). Pure and deterministic:
 * none of these functions draws a random number. Each one is proven against the game's own machine code run in an emulator
 * (`tests/unit/parity-ffx-reaction-items.test.ts`, vectors in `tests/fixtures/parity/ffx/reaction_items.json`); the engine runs
 * them through `../adapt/reactions.ts` (re-parity RC4, lane F).
 *
 * Exe addresses (all FFX.exe):
 * - 0x007b24a0  Can-act (a character that is not stoned, Confused, Berserk, asleep or ejected; and, as asked, in battle, not
 *               Provoked, not Threatened). It does NOT look at the Death bit: a character reduced to 0 HP by a hit that has not yet
 *               been through the death check still passes.
 * - 0x007b2850  Auto-Potion:  HP <= floor(max HP / 2), no Auto-Potion record of this character waiting, Can-act, then the first of
 *               Potion, Hi-Potion, X-Potion that is in stock.
 * - 0x007b2510  Auto-Med:     a Poison, Zombie, Darkness or Silence that this hit newly inflicted and equipment does not give, no
 *               Auto-Med record of this character waiting, Can-act; Remedy first when two or more are new, otherwise Antidote,
 *               Holy Water, Eye Drops, Echo Screens in that order, then Remedy as the last resort.
 * - 0x007b27b0  Auto-Phoenix: the first able holder in slot order (party, then aeons) uses a Phoenix Down on the victim.
 *
 * The functions answer with the request the game queues (an index into the item list below and the queue priority) or `null`.
 * Paying the stock, queueing and executing it are the engine's business (`../reactions.ts`).
 */

/** Permanent-status word bits Can-act reads (`Chr+0x606`). */
export const PERM_CONFUSE = 0x100;
export const PERM_BERSERK = 0x200;
export const PERM_PROVOKE = 0x400;
export const PERM_THREATEN = 0x800;

/** What Can-act reads of one character. */
export interface CanActFacts {
  /** Stoned flag (`Chr+0xdce`): Petrify landed. */
  stoned: boolean;
  /** The permanent-status word (only the Confuse, Berserk, Provoke and Threaten bits are read). */
  perm: number;
  /** The Sleep counter is non-zero. */
  asleep: boolean;
  /** The Eject bit of the extra-status word. */
  ejected: boolean;
  /** The "in battle" byte (`Chr+0xdc8`) is non-zero. */
  inBattleByte: boolean;
}

/**
 * `pp_BtlCanAct(chr, inBattle, notProvoked, notThreatened)` (0x007b24a0). Every reaction asks it with all three flags set, which is
 * the default here. The Death bit is not tested.
 */
export function reactionCanAct(f: CanActFacts, inBattle = true, notProvoked = true, notThreatened = true): boolean {
  if (f.stoned) return false;
  if ((f.perm & (PERM_CONFUSE | PERM_BERSERK)) !== 0) return false;
  if (f.asleep) return false;
  if (f.ejected) return false;
  if (inBattle && !f.inBattleByte) return false;
  if (notProvoked && (f.perm & PERM_PROVOKE) !== 0) return false;
  if (notThreatened && (f.perm & PERM_THREATEN) !== 0) return false;
  return true;
}

/** The request a reaction queues: which item of its list, and the queue priority (smaller runs first). */
export interface ItemRequest {
  /** Index into the reaction's item list ({@link POTION_LIST}, {@link MED_LIST}). */
  index: number;
  priority: number;
}

/** Priority bases: the queue sorts by the whole byte, the high nibble names the class (one record per class per character). */
export const MED_PRIORITY = 0x10;
export const POTION_PRIORITY = 0x20;
export const PHOENIX_PRIORITY = 0x30;
export const LIFE_PRIORITY = 0x40;

/** Auto-Potion's items, tried in this order (the first one in stock is used); priority `0x20 + 1 + index`. */
export const POTION_LIST = ['potion', 'hi-potion', 'x-potion'] as const;
/** Auto-Med's items by the status they answer, then Remedy; priority `0x10 + 1 + index`. */
export const MED_LIST = ['antidote', 'holy-water', 'eye-drops', 'echo-screen', 'remedy'] as const;
/** The index of Remedy in {@link MED_LIST}. */
export const REMEDY_INDEX = 4;

/** What Auto-Potion reads. HP values are the game's 32-bit words and compare unsigned (an HP of 0 qualifies, a negative one does not). */
export interface AutoPotionInput {
  hp: number;
  maxHp: number;
  /** An Auto-Potion record of this character is already waiting in the queue. */
  classBlocked: boolean;
  canAct: boolean;
  /** Stock of Potion, Hi-Potion and X-Potion. */
  stock: readonly [number, number, number];
}

/** `pp_BtlAutoPotion` (0x007b2850). */
export function autoPotion(i: AutoPotionInput): ItemRequest | null {
  if (((i.maxHp >>> 1) >>> 0) < i.hp >>> 0) return null;
  if (i.classBlocked) return null;
  if (!i.canAct) return null;
  for (let k = 0; k < POTION_LIST.length; k++) {
    if ((i.stock[k] as number) > 0) return { index: k, priority: POTION_PRIORITY + 1 + k };
  }
  return null;
}

/** What Auto-Med reads. The "old" values are the live ones before this hit's statuses were copied back (0 = was absent). */
export interface AutoMedInput {
  /** Poison and Zombie bits of the permanent word now, and the Darkness and Silence counters now. */
  poison: boolean;
  zombie: boolean;
  darkness: number;
  silence: number;
  oldPoison: number;
  oldZombie: number;
  oldDarkness: number;
  oldSilence: number;
  /** The same four statuses given by equipment (the equipment words): those never count as new. */
  eqPoison: boolean;
  eqZombie: boolean;
  eqDarkness: boolean;
  eqSilence: boolean;
  classBlocked: boolean;
  canAct: boolean;
  /** Stock of Antidote, Holy Water, Eye Drops, Echo Screens and Remedy ({@link MED_LIST} order). */
  stock: readonly [number, number, number, number, number];
}

/** `pp_BtlAutoMed` (0x007b2510). */
export function autoMed(i: AutoMedInput): ItemRequest | null {
  if (i.classBlocked) return null;
  const fresh = [
    i.poison && i.oldPoison === 0 && !i.eqPoison,
    i.zombie && i.oldZombie === 0 && !i.eqZombie,
    i.darkness !== 0 && i.oldDarkness === 0 && !i.eqDarkness,
    i.silence !== 0 && i.oldSilence === 0 && !i.eqSilence,
  ];
  const count = fresh.filter(Boolean).length;
  if (count === 0) return null;
  if (!i.canAct) return null;
  if (count >= 2 && (i.stock[REMEDY_INDEX] as number) > 0) return { index: REMEDY_INDEX, priority: MED_PRIORITY + 1 + REMEDY_INDEX };
  for (let k = 0; k < 4; k++) {
    if (fresh[k] === true && (i.stock[k] as number) > 0) return { index: k, priority: MED_PRIORITY + 1 + k };
  }
  if ((i.stock[REMEDY_INDEX] as number) > 0) return { index: REMEDY_INDEX, priority: MED_PRIORITY + 1 + REMEDY_INDEX };
  return null;
}

/** One possible rescuer, in slot order. */
export interface PhoenixCandidate {
  /** The dead flag (`Chr+0xdcc`) is set. */
  dead: boolean;
  /** Wears Auto-Phoenix (bit 12 of the first auto-ability word). */
  holds: boolean;
  canAct: boolean;
}

/**
 * `pp_BtlAutoPhoenix` (0x007b27b0): the victim's death by HP loss, with no Auto-Life to take it. The rescuer is the FIRST candidate in
 * slot order who is not dead, holds Auto-Phoenix and can act; the answer is its index in `candidates`. A party or aeon victim needs at
 * least one Phoenix Down in stock (its candidates are slots 0 to 0x13); a monster victim needs none (its candidates are the monster
 * slots 0x14 to 0x1b). No second try with Mega Phoenix. The victim is never excluded here: its own dead flag does that.
 */
export function autoPhoenix(victimMonster: boolean, stock: number, candidates: readonly PhoenixCandidate[]): number | null {
  if (!victimMonster && stock < 1) return null;
  for (let k = 0; k < candidates.length; k++) {
    const c = candidates[k] as PhoenixCandidate;
    if (!c.dead && c.holds && c.canAct) return k;
  }
  return null;
}
