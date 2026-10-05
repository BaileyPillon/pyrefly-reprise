/**
 * Lady Luck's reels — the pay table [ffx2-combat-core §3.12, verified: 2 sources].
 *
 * **These are not Wakka's Slots**, and nothing here is ported from
 * `src/battle/ffx/reels.ts`. FFX's reels match a symbol *anywhere* and always
 * fire something; X-2's are read **left to right**, pay on three tiers, and
 * punish everything else:
 *
 * | Stopped reels | Tier | Pays |
 * |---|---|---|
 * | X - X - X | `three` | the set's top result for that symbol |
 * | X - X - any (slots 1+2) | `pair` | the mid result — **Cherry and the three suit symbols only** |
 * | Cherry - any - any | `cherry` | the weakest result |
 * | anything else | `dud` | **Dud**: 75% of current HP off the spinner's whole party, ignoring defence |
 *
 * §3.12's table has no pair column for Red 7 or BAR, so `red7-red7-x` and
 * `bar-bar-x` are Duds; that is the source's table, not an omission here.
 *
 * "Every reel payload resolves to an existing ability or item and therefore
 * inherits that entry's constant" [§2.9.1, Lady Luck block] — so a payout is an
 * **ability id**, and the numbers stay in that ability's own record. The reel
 * is free: the payload's MP cost is not charged, and "all effects from one spin
 * share a single charge bar" [§3.12], so its charge time is not run either.
 *
 * **Item Reels and Random Reels are not here on purpose.** §3.12 tabulates
 * them, but neither command is shipped (`dresspheres/lady-luck.ts` lists Attack
 * and Magic Reels only) and most of their payloads — Megalixir+, Mighty Guard+,
 * Supreme Gem, Blessed Gem, CONGRATS! — have no record to resolve to. A table
 * nothing can reach is dead data; `tests/unit/ffx2-lady-luck-reels.test.ts`
 * fails if a reel command is ever added without its table.
 *
 * The engine never imports this file. `abilities/lady-luck.ts` copies each
 * table onto its reel command's `extra`, which is how it reaches both
 * `src/battle/ffx2/reels.ts` (through the ability registry) and the overlay
 * (`minigame-request.params.symbols`, which `ui/ffx2/LadyLuckReels.ts` already
 * reads).
 */

import type { AbilityId } from '../../battle/common/types.ts';

/** The reel sets that are shipped commands. */
export type LadyLuckReelSet = 'attack' | 'magic';

export interface LadyLuckReelTable {
  /** The six symbols on every reel of this set: Red 7, BAR, Cherry and the set's own three. */
  symbols: readonly string[];
  /** Three of a kind, by symbol. */
  three: Readonly<Record<string, AbilityId>>;
  /** The same symbol in slots 1 and 2. No entry means that pair does not pay. */
  pair: Readonly<Record<string, AbilityId>>;
  /** A Cherry in slot 1 and nothing better. */
  cherry: AbilityId;
  /** Everything else. */
  dud: AbilityId;
  /**
   * Payloads that are *for* the spinner's own side. The reel is aimed before
   * it is spun (`Tgt: 1 / any`), so a Cura can be rolled while pointing at the
   * boss; the engine re-aims these at her party and everything else at the
   * enemy. §3.12 is silent on that case — this is the project's rule, chosen
   * so a spin is never worse than its own pay table says.
   */
  friendly: readonly AbilityId[];
}

/** §2.3: "Dud (any Lady Luck reel failure) — special gravity damage removing 75% of current HP from the whole party". */
export const LADY_LUCK_DUD_ID: AbilityId = 'x2-lady-luck-dud';

export const LADY_LUCK_REELS: Readonly<Record<LadyLuckReelSet, LadyLuckReelTable>> = {
  // Shin-Zantetsu / Excalibur / Cripple / Delay Buster (Sword) / Fireworks (Helmet) / Intimidate (Paw)
  // Clean Slate / Power Break (Sword) / Magicide (Helmet) / Eject (Paw) — Armor Break
  attack: {
    symbols: ['red7', 'bar', 'cherry', 'sword', 'helmet', 'paw'],
    three: {
      red7: 'x2-samurai-shin-zantetsu',
      bar: 'x2-warrior-excalibur',
      cherry: 'x2-berserker-cripple',
      sword: 'x2-warrior-delay-buster',
      helmet: 'x2-samurai-fireworks',
      paw: 'x2-berserker-intimidate',
    },
    pair: {
      cherry: 'x2-samurai-clean-slate',
      sword: 'x2-warrior-power-break',
      helmet: 'x2-samurai-magicide',
      paw: 'x2-berserker-eject',
    },
    cherry: 'x2-warrior-armor-break',
    dud: LADY_LUCK_DUD_ID,
    friendly: ['x2-samurai-clean-slate'],
  },
  // Ultima / Black Sky / Flare / Demi (Skull) / Firaga (Hat) / Auto-Life (Staff)
  // Bio / Break (Skull) / Thundara (Hat) / Esuna (Staff) — Cura
  magic: {
    symbols: ['red7', 'bar', 'cherry', 'skull', 'hat', 'staff'],
    three: {
      red7: 'x2-shared-ultima',
      bar: 'x2-dark-knight-black-sky',
      cherry: 'x2-shared-flare',
      skull: 'x2-dark-knight-demi',
      hat: 'x2-black-mage-firaga',
      staff: 'x2-lady-luck-reel-auto-life',
    },
    pair: {
      cherry: 'x2-dark-knight-bio',
      skull: 'x2-dark-knight-break',
      hat: 'x2-black-mage-thundara',
      staff: 'x2-white-mage-esuna',
    },
    cherry: 'x2-white-mage-cura',
    dud: LADY_LUCK_DUD_ID,
    friendly: ['x2-lady-luck-reel-auto-life', 'x2-white-mage-esuna', 'x2-white-mage-cura'],
  },
};

/** The `extra` a reel command carries: its set, the overlay's strip, and the table itself. */
export function reelExtra(set: LadyLuckReelSet): Record<string, unknown> {
  const table = LADY_LUCK_REELS[set];
  return { reelSet: set, symbols: [...table.symbols], payTable: table };
}
