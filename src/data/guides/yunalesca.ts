/**
 * Chapter 2 — Yunalesca, in the Zanarkand Dome [research/ffx-yunalesca.md §10].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The RULES and phase notes and the NEXT line
 * (`./lines/yunalesca.ts`) follow the FFX encounter guide the project settled on (D-350,
 * `research/jegged-encounter-guides-ffx-a.md` Chapter 2); `cite` names the research section that
 * backs each mechanic and is never rendered. The `hints` below are the move advisor's borrowed
 * sentences for the chapter tactic's pick (`src/engine/tactics/yunalesca.ts`): the panel does not
 * read them.
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
import { YUNALESCA_LINE } from './lines/yunalesca.ts';

export const YUNALESCA_GUIDE: ChapterGuide = {
  id: 'yunalesca',
  title: 'Yunalesca',
  bossIds: ['yunalesca'],

  rules: [
    {
      text: 'Form I answers every blow: Blind for a physical hit, Silence for a spell. Put Reflect on the party, Yuna first so she cannot be Silenced, and the counters bounce back at her. Cure any Blind or Silence that lands with Eye Drops, an Echo Screen, Esuna or a Remedy.',
      short: 'Reflect first; cure Blind and Silence',
      cite: 'ffx-yunalesca §5.1, §10.4',
    },
    {
      text: 'Keep one Zombie in Forms II and III. Hellbiter turns the party into Zombies, and Mega Death at the start of Form III kills everyone who is not one. Never cure the last Zombie.',
      short: 'Always keep at least one Zombie',
      cite: 'ffx-yunalesca §10.1, §10.2',
    },
    {
      text: 'Her Cura and Curaga hurt a Zombie, so heal a worn one the Holy Water way: cure it, heal it next turn, and let her next Hellbiter zombify it again.',
      short: 'Holy Water a worn Zombie, then heal it',
      cite: 'ffx-yunalesca §10.2',
    },
    {
      text: 'Dispel her Regen off your people. On a Zombie, Regen is damage rather than healing.',
      short: 'Dispel her Regen off your party',
      cite: 'ffx-yunalesca §10.5, §7.1',
    },
    {
      text: 'Hold every aeon for Form III and fire its Overdrive on arrival. Her Mind Blast Curses an aeon on its first step, and a Cursed aeon cannot use an Overdrive.',
      short: 'Aeons wait for Form III; Overdrive at once',
      cite: 'ffx-yunalesca §10.6',
    },
  ],

  hints: [
    {
      when: { labels: ['Holy Water', 'Remedy'], targetHas: 'zombie' },
      text: 'Cure {target} now — but only because somebody else is still carrying the Zombie that survives Mega Death',
      cite: 'ffx-yunalesca §10.1, §10.2',
    },
    {
      when: { labels: ['Eye Drops'] },
      text: 'Blind is her Form I counter to every landed physical hit, and it takes physical accuracy down to base/10 — the measured run blinded itself out of the fight, 18 hits to 21 misses',
      cite: 'ffx-yunalesca §5.1',
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
      text: 'Haste buys the turns the Holy Water rhythm needs: cure, heal, and still be standing when the next Hellbiter lands',
      cite: 'ffx-yunalesca §10.2, §6',
    },
    {
      when: { labels: ['Defend'] },
      text: 'Hold the turn rather than spend it — the supporter is banking a Grand Summon for Form III, where an aeon Overdrive is worth most',
      cite: 'ffx-yunalesca §10.6',
    },
    {
      when: { labels: ['Phoenix Down', 'Life', 'Mega Phoenix', 'Full-Life'] },
      text: 'Stand {target} up — and single-target only while anyone living is a Zombie, because a revival effect kills a living Zombie outright',
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
      note: 'She answers every blow: Blind for a physical hit, Silence for a spell, Sleep for anything else. Reflect on the party sends them back at her; cure whatever lands.',
      cite: 'ffx-yunalesca §5.1, §10.4',
    },
    {
      formIndex: 1,
      label: 'Form II',
      note: 'Hellbiter turns the party into Zombies and her cures hurt them. Keep at least one Zombie standing, and Dispel her Regen off your people.',
      cite: 'ffx-yunalesca §5.2, §10.1',
    },
    {
      formIndex: 2,
      label: 'Form III',
      note: 'Mega Death opens the form and comes back on her cycle, and only a Zombie lives through it. Keep a Zombie, and bring the aeons in now.',
      cite: 'ffx-yunalesca §5.3, §10.6',
    },
  ],
  line: YUNALESCA_LINE,
};
