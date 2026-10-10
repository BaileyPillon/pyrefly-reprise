/**
 * Seymour's **Requiem**, the Overdrive he has as the guest of the hidden Sinspawn Gui chapter's second fight (FFX only; `research/re-ffx-ai-gui.md` section 7.4).
 *
 * The game's own command record 0x30E3 (the battle kernel's command table, FFX Steam HD build 25501027, read field by field): user 7 only (Seymour, the party actor after Rikku),
 * **formula 3 (magic against Magic Defense), power 40, one hit, all enemies, rank 4, Overdrive cost 100**, damage type magical (Shell halves it), can crit (and the equipment's crit
 * bonus), **no piercing flag on the command** (the RE note reads that as "an Armored arm takes a third", but the game's Armored rule also exempts a user with the Pierce auto-ability, and Seymour's staff carries Piercing: `kernel/modifiers.ts#armoredMod`, so every command he casts pierces and the arm takes it in full), no element, no status, hit calculation 0 (always hits), reach 3 (it can target Gui's head). The gauge is Seymour's own:
 * mode Stoic, start 0, max 100, filled only as monsters hurt him (the engine's own Stoic rule, the same code as any party member's).
 *
 * It is a plain command: **no timed input** (`minigame` absent), like an aeon's Overdrive, so the menu offers it when the gauge is full and the engine resolves it on the spot.
 * The record's flag words are in `../command-records/player.ts`. Numbers only; the banner and animation keys are ours.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  requiem: {
    id: 'requiem',
    name: 'Requiem',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4, // record rank 4: 40 ticks of recovery at Seymour's Agility 20
    power: 40,
    formula: 'magic',
    damageType: 'magical',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // hit calculation 0: always hits (rule 5: every Overdrive always hits)
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'adds-equipment-crit', 'shatter'],
    shatterChance: 30, // the record's shatter byte
    canReflect: false,
    animationKey: 'overdrive-requiem',
    sfxKey: 'sfx-requiem',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-requiem', guestOverdrive: true },
  },
};

export default ABILITIES;
