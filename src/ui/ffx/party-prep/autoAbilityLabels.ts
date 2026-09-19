/**
 * FFX's own names for the auto-abilities on a weapon or a piece of armour.
 *
 * `AutoAbilityId` is a kebab-case internal id (`strength-10`, `zombie-ward`,
 * `sos-nulblaze`). The Equipment tab was printing those ids straight onto a
 * player-facing surface — `strength-10`, `hp-10`, `zombie-ward`, three lines
 * from the Items tab that the same round had already routed through
 * `itemLabel()` (critic pass 1 on `ffx3-ffx2-hud-prep`, finding 4). This is the
 * Equipment tab's `itemLabel()`.
 *
 * **These are transcriptions, not derivations.** A `kebab -> Title Case`
 * helper gets a handful of them right and the rest wrong: FFX writes the
 * percentage families as `Strength +10%` (not "Strength 10"), the magic
 * defence family as `Magic Def +5%`, the counter as `Evade & Counter`, the
 * auto-status family hyphenated (`Auto-Haste`) but the SOS family not
 * (`SOS Haste`), the elemental nulls in medial caps (`SOS NulBlaze`), the
 * strike/touch/proof families as one closed word (`Zombiestrike`,
 * `Deathtouch`, `Stoneproof`) but the ward family as two (`Zombie Ward`), and
 * the AP converter with an arrow (`Overdrive -> AP`). So every id is written
 * out.
 *
 * The map is typed `Record<AutoAbilityId, string>`, so adding an id to the
 * union without naming it here fails `tsc` rather than leaking a raw id back
 * onto the screen.
 *
 * **FFX only.** FFX-2 has no auto-abilities — its equivalent is the accessory
 * table plus dressphere skillsets, which `ui/ffx2/party-prep/panels.ts` names
 * through `abilityName()` and `accessoryEffect()` of its own.
 */
import type { AutoAbilityId } from '../../../battle/common/types.ts';

const LABELS: Record<AutoAbilityId, string> = {
  // information / turn order
  sensor: 'Sensor',
  'first-strike': 'First Strike',
  initiative: 'Initiative',
  piercing: 'Piercing',
  // offence / defence percentage families
  'strength-3': 'Strength +3%',
  'strength-5': 'Strength +5%',
  'strength-10': 'Strength +10%',
  'strength-20': 'Strength +20%',
  'magic-3': 'Magic +3%',
  'magic-5': 'Magic +5%',
  'magic-10': 'Magic +10%',
  'magic-20': 'Magic +20%',
  'defense-3': 'Defense +3%',
  'defense-5': 'Defense +5%',
  'defense-10': 'Defense +10%',
  'defense-20': 'Defense +20%',
  'magic-def-3': 'Magic Def +3%',
  'magic-def-5': 'Magic Def +5%',
  'magic-def-10': 'Magic Def +10%',
  'magic-def-20': 'Magic Def +20%',
  // pools
  'hp-5': 'HP +5%',
  'hp-10': 'HP +10%',
  'hp-20': 'HP +20%',
  'hp-30': 'HP +30%',
  'mp-5': 'MP +5%',
  'mp-10': 'MP +10%',
  'mp-20': 'MP +20%',
  'mp-30': 'MP +30%',
  'break-hp-limit': 'Break HP Limit',
  'break-mp-limit': 'Break MP Limit',
  'break-damage-limit': 'Break Damage Limit',
  // MP economy
  'one-mp-cost': 'One MP Cost',
  'half-mp-cost': 'Half MP Cost',
  'magic-booster': 'Magic Booster',
  alchemy: 'Alchemy',
  // counters
  counterattack: 'Counterattack',
  'evade-and-counter': 'Evade & Counter',
  'magic-counter': 'Magic Counter',
  'auto-potion': 'Auto-Potion',
  'auto-med': 'Auto-Med',
  'auto-phoenix': 'Auto-Phoenix',
  // permanent statuses
  'auto-haste': 'Auto-Haste',
  'auto-protect': 'Auto-Protect',
  'auto-shell': 'Auto-Shell',
  'auto-regen': 'Auto-Regen',
  'auto-reflect': 'Auto-Reflect',
  // SOS statuses
  'sos-haste': 'SOS Haste',
  'sos-protect': 'SOS Protect',
  'sos-shell': 'SOS Shell',
  'sos-regen': 'SOS Regen',
  'sos-reflect': 'SOS Reflect',
  'sos-nulblaze': 'SOS NulBlaze',
  'sos-nulfrost': 'SOS NulFrost',
  'sos-nulshock': 'SOS NulShock',
  'sos-nultide': 'SOS NulTide',
  'sos-overdrive': 'SOS Overdrive',
  // weapon status strikes
  stonestrike: 'Stonestrike',
  deathstrike: 'Deathstrike',
  zombiestrike: 'Zombiestrike',
  poisonstrike: 'Poisonstrike',
  sleepstrike: 'Sleepstrike',
  silencestrike: 'Silencestrike',
  darkstrike: 'Darkstrike',
  slowstrike: 'Slowstrike',
  // ...touch variants
  stonetouch: 'Stonetouch',
  deathtouch: 'Deathtouch',
  zombietouch: 'Zombietouch',
  poisontouch: 'Poisontouch',
  sleeptouch: 'Sleeptouch',
  silencetouch: 'Silencetouch',
  darktouch: 'Darktouch',
  slowtouch: 'Slowtouch',
  // proofs
  stoneproof: 'Stoneproof',
  deathproof: 'Deathproof',
  zombieproof: 'Zombieproof',
  poisonproof: 'Poisonproof',
  sleepproof: 'Sleepproof',
  silenceproof: 'Silenceproof',
  darkproof: 'Darkproof',
  slowproof: 'Slowproof',
  confuseproof: 'Confuseproof',
  berserkproof: 'Berserkproof',
  curseproof: 'Curseproof',
  // wards
  'stone-ward': 'Stone Ward',
  'death-ward': 'Death Ward',
  'zombie-ward': 'Zombie Ward',
  'poison-ward': 'Poison Ward',
  'sleep-ward': 'Sleep Ward',
  'silence-ward': 'Silence Ward',
  'dark-ward': 'Dark Ward',
  'slow-ward': 'Slow Ward',
  'confuse-ward': 'Confuse Ward',
  'berserk-ward': 'Berserk Ward',
  'curse-ward': 'Curse Ward',
  ribbon: 'Ribbon',
  'aeon-ribbon': 'Aeon Ribbon',
  // elemental weapon / armour
  firestrike: 'Firestrike',
  icestrike: 'Icestrike',
  lightningstrike: 'Lightningstrike',
  waterstrike: 'Waterstrike',
  'fire-ward': 'Fire Ward',
  'ice-ward': 'Ice Ward',
  'lightning-ward': 'Lightning Ward',
  'water-ward': 'Water Ward',
  fireproof: 'Fireproof',
  iceproof: 'Iceproof',
  lightningproof: 'Lightningproof',
  waterproof: 'Waterproof',
  'fire-eater': 'Fire Eater',
  'ice-eater': 'Ice Eater',
  'lightning-eater': 'Lightning Eater',
  'water-eater': 'Water Eater',
  // overdrive / reward
  'double-overdrive': 'Double Overdrive',
  'triple-overdrive': 'Triple Overdrive',
  'overdrive-to-ap': 'Overdrive → AP',
  'double-ap': 'Double AP',
  'triple-ap': 'Triple AP',
  'no-ap': 'No AP',
  capture: 'Capture',
  'no-encounters': 'No Encounters',
  gillionaire: 'Gillionaire',
  'hp-stroll': 'HP Stroll',
  'mp-stroll': 'MP Stroll',
  'master-thief': 'Master Thief',
  pickpocket: 'Pickpocket',
};

/**
 * The player-facing name for an auto-ability id.
 *
 * Falls back to the id itself only if one is somehow passed that is not in the
 * union at runtime (data loaded from JSON, say) — a visible raw id is still
 * better than an empty chip, and `tsc` already prevents it for typed callers.
 */
export function autoAbilityLabel(id: AutoAbilityId): string {
  return LABELS[id] ?? id;
}

/** Every id this module names — the test's completeness check reads it. */
export const AUTO_ABILITY_IDS = Object.keys(LABELS) as AutoAbilityId[];
