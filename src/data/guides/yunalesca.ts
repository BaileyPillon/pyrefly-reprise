/**
 * Chapter 2 — Yunalesca, in the Zanarkand Dome [research/ffx-yunalesca.md §10].
 *
 * The one chapter where the obvious play is the losing one. §10.1 is
 * categorical: enter Form III with at least one active member **still
 * zombified**, because that character is the only thing that survives Mega
 * Death and can stand the other two back up. A guide that told the player to
 * cure every Zombie would be teaching the failure mode the encounter exists to
 * punish, so the Holy Water hints below are all conditional on the state the
 * tactic reads, never on the status alone.
 */

import type { ChapterGuide } from './types.ts';

export const YUNALESCA_GUIDE: ChapterGuide = {
  id: 'yunalesca',
  title: 'Yunalesca',
  bossIds: ['yunalesca'],

  rules: [
    {
      text: 'Keep one Zombie. Form III opens with Mega Death, and a zombified member is immune to it — cure all three and the active party is wiped from full health. Never cure the last Zombie while a Mega Death is due: cure, heal, then let the next Hellbiter re-apply it. A knock-out takes the Zombie away too, so a raised ally is a plain target again until Hellbiter lands on him.',
      short: 'Keep one Zombie alive for Mega Death',
      cite: 'ffx-yunalesca §10.1, §10.2, §15.2',
    },
    {
      text: "For Form III, bring Wakka in for Tidus. Tidus, Yuna and Auron wear Zombie Ward, which blocks about half of every Hellbiter; Wakka wears none, so Hellbiter always zombifies him, and his Death Ward gives a plain Wakka an even chance against Mega Death. Tidus has already cast Hastega and Cheer by then.",
      short: 'Form III: Wakka replaces Tidus as the Zombie carrier',
      cite: 'ffx-yunalesca §10.1, §10.8, §10.10; re-ffx-ai-yunalesca-bfa §2.12',
    },
    {
      text: 'Dispel her Regen off your Zombies — healing damages a Zombie, so her Regen is a slow execution rather than a gift.',
      short: 'Dispel her Regen off your Zombies',
      cite: 'ffx-yunalesca §10.5, §7.1',
    },
    {
      text: 'Form I is a Darkness fight: she answers every physical action that reaches her, a miss included, with Blind, unless the member she last picked is already blind; Darkness drops physical accuracy to base/10. Cure it or stop swinging.',
      short: 'Form I answers every physical action with Blind',
      cite: 'ffx-yunalesca §5.1, ffx-combat-core §4.2; re-ffx-ai-yunalesca-bfa §2.9',
    },
    {
      text: 'Summon only in Form III, and Overdrive on arrival. Aeons postpone Mega Death rather than dying to it, but Mind Blast Curses them on step one and a Cursed aeon can never Overdrive.',
      short: 'Summon only in Form III, Overdrive on arrival',
      cite: 'ffx-yunalesca §10.6',
    },
  ],

  hints: [
    {
      when: { kinds: ['switch'] },
      text: 'Wakka takes Tidus’s turn: Hellbiter lands on him every time, where Zombie Ward turns away about half of the Hellbiters aimed at Tidus, Yuna and Auron, and the Zombie is what lives through Mega Death',
      cite: 'ffx-yunalesca §10.1, §10.10; re-ffx-ai-yunalesca-bfa §2.12',
    },
    {
      when: { labels: ['Holy Water', 'Remedy'], targetHas: 'zombie' },
      text: 'Cure {target} now — but only because somebody else is still carrying the Zombie that survives Mega Death',
      cite: 'ffx-yunalesca §10.1, §10.2',
    },
    {
      when: { labels: ['Eye Drops'] },
      text: 'Blind is her Form I counter to every physical action that reaches her, a miss included, and it takes physical accuracy down to base/10 — the measured run blinded itself out of the fight, 18 hits to 21 misses',
      cite: 'ffx-yunalesca §5.1; re-ffx-ai-yunalesca-bfa §2.9',
    },
    {
      when: { labels: ['Dispel'] },
      text: 'Regen on a Zombie is damage, not healing — strip it before it ticks them down',
      cite: 'ffx-yunalesca §10.5, §7.1',
    },
    {
      when: { labels: ['Esuna'] },
      text: 'Clear the ailment: Esuna does not touch Zombie, so it can never strip the member who is meant to survive Mega Death',
      cite: 'ffx-yunalesca §7.1, ffx-combat-core §4.2',
    },
    {
      when: { labels: ['Reflect'] },
      text: 'Reflect on the actives nullifies her Form I Blind, Silence and Sleep counters outright, and bounces her Cura and Regen back at her',
      cite: 'ffx-yunalesca §10.4, §8',
    },
    {
      when: { labels: ['Hastega'] },
      text: 'Haste buys the turns the Holy Water rhythm needs: cure, heal, and still be standing when the next Hellbiter lands. Cast it before Reflect goes up, never through it: do not Haste a Reflecting character',
      cite: 'ffx-yunalesca §10.2, §6; re-ffx-targeting (Hastega bounces off Reflect)',
    },
    {
      when: { labels: ['Defend'] },
      text: 'Hold the turn rather than spend it — the supporter is banking a Grand Summon for Form III, where an aeon Overdrive is worth most',
      cite: 'ffx-yunalesca §10.6',
    },
    {
      when: { labels: ['Phoenix Down', 'Life', 'Mega Phoenix', 'Full-Life'] },
      text: 'Stand {target} up — he returns plain, not zombified, until the next Hellbiter lands; and single-target only while anyone living is a Zombie, because a revival effect kills a living Zombie outright',
      cite: 'ffx-yunalesca §7.1, §15.2',
    },
    {
      when: { labels: ['Curaga', 'Cura', 'X-Potion', 'Hi-Potion'] },
      text: 'Heal {target} clear of the next Hellbiter — she opens Form III on Mega Death and a member at half HP never reaches it',
      cite: 'ffx-yunalesca §5.3, §4.2',
    },
    {
      when: { kinds: ['summon'] },
      text: 'An aeon is a Mega Death delay, not a Mega Death victim — her turn takes the aeon branch and the human step counter freezes where it stands',
      cite: 'ffx-yunalesca §10.6',
    },
    {
      when: { kinds: ['overdrive'] },
      text: 'Spend it now: Mind Blast is step one of her aeon cycle and it Curses, and a Cursed aeon can never Overdrive',
      cite: 'ffx-yunalesca §10.6',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Swing — she has no Defense trick, and the fight is decided by whether the party is still standing, not by the damage race',
      cite: 'ffx-yunalesca §2.1',
    },
  ],

  watch: [],

  phases: [
    {
      formIndex: 0,
      label: 'Form I',
      note: 'She answers every physical action that reaches her with Blind and every spell with Silence, misses included, and an item or special with Sleep; the Blind and the Silence are skipped while the member she last picked already has it. Cure the counter or stop swinging; summoning here is a net loss, because Absorb heals her.',
      cite: 'ffx-yunalesca §5.1, §10.6; re-ffx-ai-yunalesca-bfa §2.9',
    },
    {
      formIndex: 1,
      label: 'Form II',
      note: 'Hellbiter is party-wide Zombie. Let it land on somebody and leave them zombified — that member is the one who survives the Mega Death that opens Form III.',
      cite: 'ffx-yunalesca §5.2, §10.1',
    },
    {
      formIndex: 2,
      label: 'Form III',
      note: 'Mega Death opens the form and recurs on her cycle. Only a Zombie survives it. Wakka takes Tidus’s place here, because Hellbiter always lands on him. Aeons postpone it and Overdrive on arrival, before Mind Blast Curses them.',
      cite: 'ffx-yunalesca §5.3, §10.6',
    },
  ],
};
