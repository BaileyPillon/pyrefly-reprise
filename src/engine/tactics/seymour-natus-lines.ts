/**
 * Chapter X's lines as data: what each line changes in the shipped tactic (`./seymour-natus.ts`), and nothing else.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The switch is `NATUS_LINE` (`src/data/guides/natus-line.ts`); this file holds the
 * knobs each id turns. `shipped` is the line Bailey picked on 2026-09-25 and is the tactic exactly as it was before the
 * options were built (the unit test `natus-line-switch.test.ts` pins it seed by seed). Every other line only moves the knobs
 * below or sends Kimahri's slot through the detour (`./seymour-natus-detours.ts`) or plays the mirror (`./seymour-natus-mirror.ts`).
 *
 * Nothing here touches a boss number, Natus's script, the Flare rank, enemy data or the party preset.
 */

import type { NatusLineId } from '../../data/guides/natus-line.ts';
import type { DetourPlan } from './seymour-natus-detours.ts';

export interface NatusLine {
  /**
   * Which aeons Yuna sends: `all` is the shipped relay (Bahamut, then Valefor, Ifrit, Ixion and Shiva, each for its one turn before the
   * Banish); `bahamut` sends only the one whose Overdrive gauge arrives full (research §6.3 row 3: "aeons with full gauges").
   */
  relay: 'all' | 'bahamut';
  /** Heal the lowest active member under this fraction of max HP: Cura from Yuna, else a Hi-Potion (shipped 0.45). */
  healUnder: number;
  /** Yuna's top-up Cura, once the three are Shelled (shipped 0.7). */
  topUpUnder: number;
  /**
   * Yuna puts Shell on a member who lacks it **before** she heals, unless somebody is under a quarter of their HP.
   * The shipped line heals first and Shells with what is left of her turns, so the Flare finds most of the party bare.
   */
  shellBeforeHeal: boolean;
  /** A petrified member gets the Al Bhed Potion (the whole party +1,000 HP and Petrify, Poison and Silence off) when the bag has one, else a Soft. */
  alBhedForStone: boolean;
  /** Tidus and Auron spend a full Overdrive on Natus (the shipped line never does; the aeon's Overdrive is already used). */
  partyOverdrives: boolean;
  /** Kimahri's slot opens with Bio and/or Reflect on Natus before Auron comes in; null = straight to Auron (shipped). */
  detour: DetourPlan | null;
  /** The mirror line (Provoke and Reflect) replaces everything else. */
  mirror: boolean;
}

const SHIPPED: NatusLine = {
  relay: 'all',
  healUnder: 0.45,
  topUpUnder: 0.7,
  shellBeforeHeal: false,
  alBhedForStone: false,
  partyOverdrives: false,
  detour: null,
  mirror: false,
};

export const NATUS_LINES: Readonly<Record<NatusLineId, NatusLine>> = {
  shipped: SHIPPED,
  bahamut: { ...SHIPPED, relay: 'bahamut' },
  // reflect = bahamut + Rikku's Reflect on Natus: the ladder shipped, bahamut, reflect, mirror adds one thing at each step.
  reflect: { ...SHIPPED, relay: 'bahamut', detour: { bio: false, reflectNatus: true } },
  mirror: { ...SHIPPED, mirror: true },
};
