/**
 * Fallback ability table, part 1: the shared actions and Bahamut.
 *
 * **This is scaffolding, not the data file.** `src/data/ffx2/abilities` is
 * owned by the FFX-2 data agent and is still a stub, so the engine ships the
 * boss moves it needs to actually run — transcribed from the research with the
 * same citations a data file would carry. Inject an `AbilityRegistry` and this
 * table is only consulted for ids that registry does not know.
 *
 * Damage-constant conventions [ffx2-combat-core §2.9]:
 * - `fixed` is `power * 50` then the step-7 roll, so Noli Me Tangere's published
 *   "constant 1250, randomised 1,171-1,323" is `power: 25`.
 * - `percent-total` / `percent-current` / `fractional` take **sixteenths**, so
 *   Tail Beam's "5/16 of max HP" is `power: 5` and Impulse's 3/8 is `power: 6`.
 * - `magic` takes the constant `C` consumed at step 2 as `C^2 / 64`.
 *
 * Part 2 — the Vegnagun chain and Shuyin — is in `abilities-vegnagun.ts`.
 */

import type { AbilityDef } from '../common/types.ts';
import {
  ENEMY_ATTACK_CONSTANT,
  CHARGE_VALUE_LONG,
  MEGA_FLARE_CONSTANT,
} from './constants.ts';

export type Seed = Partial<AbilityDef> &
  Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting'>;

/** Fill in the defaults every FFX-2 ability shares. */
export function def(seed: Seed): AbilityDef {
  return {
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    element: [],
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ...seed,
  };
}

/** Status ids stripped by the game's several buff-wipes. */
export const BUFF_WIPE = ['shell', 'protect', 'reflect', 'regen', 'haste'] as const;

/** The shared actions plus Bahamut's twelve-action loop. */
export const CORE_ABILITIES: AbilityDef[] = [
  // --- generic -------------------------------------------------------------
  def({
    id: 'attack',
    name: 'Attack',
    category: 'attack',
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    flags: ['crit-eligible', 'affected-by-darkness', 'inherits-weapon-properties'],
  }),
  /** Flavour turns consume an ATB slot and do nothing. [ffx2-vegnagun-shuyin §5] */
  def({
    id: 'farplane-voice',
    name: '',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'self',
  }),

  // --- Bahamut [ffx2-bahamut §2] ------------------------------------------
  def({
    id: 'bahamut-curse',
    name: 'Curse',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    // X-2 Curse = "cannot spherechange". It is NOT the FFX Curse. §2.3
    statusEffects: [{ status: 'curse', chance: 254, duration: 0 }],
    // Not evadable — see the `canMiss` note on `impulse` below. §2.2
    canMiss: false,
  }),
  def({
    id: 'impulse',
    name: 'Impulse',
    // 3/8 of *current* HP, magic-typed so Shell halves it and Magic Break
    // scales it. Randomised by step 7 — do not hard-code 0.375. §2.3
    power: 6,
    formula: 'percent-current',
    damageType: 'magical',
    targeting: 'all-enemies',
    /**
     * **Cannot be evaded.** §2.2's action table gives Impulse and Mega Flare
     * `Targets: All 3` with no accuracy term, and §1.1 is explicit that the
     * evadable move is the *physical* one: "the sourced description of
     * Bahamut's physical attack as evadable" is the whole reason his Accuracy
     * is implemented as 0, and Thief's Evasion 19 is called "the only
     * dressphere that meaningfully dodges **him**" — singular, the Attack.
     * `src/data/ffx2/enemies/bahamut-abilities.ts` already carries
     * `canMiss: false` on all three; this fallback table did not, and the AI
     * script (`ai/bahamut.ts`) submits the engine-side ids, so the data
     * record's flag was never the one consulted. Measured on seed 1 before the
     * fix: `{"type":"miss","targetId":"yuna","sourceId":"bahamut","reason":
     * "evaded"}` on an Impulse — a free save the real fight does not give.
     * The guard tests `canMiss !== false`, so the flag must be present and
     * literally `false` [docs/CONTRACT-CHANGES.md, 2026-09-17 `ffx2-bahamut`].
     */
    canMiss: false,
  }),
  def({
    id: 'bahamut-countdown',
    name: 'Countdown',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'self',
  }),
  def({
    id: 'mega-flare',
    name: 'Mega Flare',
    // C = 24, solved against both published damage reports. §2.3 `[estimate]`
    power: MEGA_FLARE_CONSTANT,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_LONG,
    flags: ['always-break-damage-limit'],
    // Party-wide magic, not evadable — see `impulse` above. §2.2
    canMiss: false,
  }),
];
