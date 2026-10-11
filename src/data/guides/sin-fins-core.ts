/**
 * Chapter XVII — Sin: the Fins and the Core [research/ffx-sin.md].
 *
 * Written against the tactic in `src/engine/tactics/sin-fins-core.ts`: every `labels` entry below is a row
 * that file asks for, so a hint fires for the command the player is being told to press.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: CTB, Cid's Trigger Command, the
 * airship range, Armor and Mental Break. Nothing here is true of FFX-2.
 *
 * **The Negation score and how Genais leaves its shell are the game's own script now**
 * [research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md §5.3 and §6.2, rows D-21 to D-24]. They replaced one guide's
 * formula built as named settings (S-12) and our reading of the in-game Scan text (S-2), which the page used to
 * label as estimates; the Fins opening far away (S-8) is the script's too (§5.1). The Haste, Protect and Cura
 * claims below are as they were: the script agrees with each.
 *
 * Listed with its chapter on 2026-09-29 (D-279): the panel finds it by the four
 * boss ids once the chapter runs, through `./index.ts`'s `GUIDES`.
 */

import type { ChapterGuide } from './types.ts';

export const SIN_FINS_CORE_GUIDE: ChapterGuide = {
  id: 'sin-fins-core',
  title: 'Sin: the Fins and the Core',
  bossIds: ['left-fin', 'right-fin', 'sinspawn-genais', 'sin-core'],
  linkTitles: {
    'left-fin': 'Left Fin',
    'right-fin': 'Right Fin',
    'sinspawn-genais': 'Sinspawn Genais',
    'sin-core': "Sin's Core",
  },

  rules: [
    {
      text: 'Distance buys safety, not damage. Cid fires no missiles here, so FAR only keeps the Fin quiet and turns its Gravija aside; at FAR only Wakka and magic reach.',
      short: 'FAR is safety, not damage',
      cite: 'ffx-sin §4, §2.5 (S-19)',
    },
    {
      text: 'When the core on the fin glows, Gravija follows on its next turn: three quarters of everyone\'s current HP. It cannot kill, but the next swing can. Pull back first, and only if Cid acts before the Fin does.',
      short: 'Core glows: pull back if Cid acts first',
      cite: 'ffx-sin §5.1.2, §3.1, §8 row 2',
    },
    {
      text: 'Armor Break opens every link. Close in, Break, then pull back. Up close, a hit can set off Negation, which wipes your buffs and the Breaks. The game scores what is on you (Shell and Reflect 1 each per member; Haste 3, 4 or 5 for one, two or three members; Protect 1 on the first member, 2 on the third, nothing on the middle one), plus 2 for Armor Break and 1 for Mental Break on the Fin, takes off 3 and rolls the rest: 1 in 16 a point on the Left Fin, 1 in 12 on the Right.',
      short: 'Break up close, then pull back',
      cite: 'ffx-sin §8 rows 1 and 3, §5.1.3; re-ffx-ai-evrae-yojimbo-isaaru-sin §5.3, D-21, D-22',
    },
    {
      text: 'Genais guards the Core: while it lives, blades cannot reach the Core, and while it is out of its shell, magic aimed at the Core is absorbed. It starts the fight shelled and comes out on its first turn. Hit it with physicals until it shells (a spell draws Waterga), then Fire into the shell. Healed above 12,000, it comes out again on its next turn.',
      short: 'Genais first: physicals, then Fire',
      cite: 'ffx-sin §5.3.1, §2.2, §8 row 4; re-ffx-ai-evrae-yojimbo-isaaru-sin §6.1, §6.2, §6.5, D-23, D-24',
    },
    {
      text: 'Nothing heals between links. HP, MP and every status carry from the Left Fin to the Core, so heal before the kill, not after it.',
      short: 'No rest between links: heal before the kill',
      cite: 'ffx-sin §1.2',
    },
  ],

  hints: [
    {
      when: { labels: ['Pull back', 'Pull Back'], flags: { 'sin.fin.charged': true } },
      text: 'The core is charged: Cid pulls the ship out before the Fin acts, and the Gravija lands on empty air',
      cite: 'ffx-sin §5.1.2, §8 row 2',
    },
    {
      when: { labels: ['Pull back', 'Pull Back'] },
      text: 'The Breaks are on: back out, where the Fin mostly sits still and Wakka and Lulu keep working',
      cite: 'ffx-sin §5.1.1, §8 row 1',
    },
    {
      when: { labels: ['Close in', 'Close In'] },
      text: 'Bring the ship in for the Breaks: Armor Break and Mental Break do not reach from FAR',
      cite: 'ffx-sin §4, §8 row 1',
    },
    {
      when: { labels: ['Armor Break'] },
      text: 'Every physical swing after this lands harder, and every link has the same answer',
      cite: 'ffx-sin §2.3, §8 row 1',
    },
    {
      when: { labels: ['Mental Break'] },
      text: "Opens it to Lulu's spells. At FAR a Mentally Broken Fin may cleanse itself, which only costs it the Breaks",
      cite: 'ffx-sin §5.1.3, §8 row 1',
    },
    {
      when: { labels: ['Protect'] },
      text: 'Protect on the middle member, where Negation does not count it',
      cite: 'ffx-sin §5.1.3, §8 row 3',
    },
    {
      when: { labels: ['Haste'] },
      text: 'Haste on one member only: each Haste on the party raises the chance of Negation',
      cite: 'ffx-sin §5.1.3, §8 row 3',
    },
    {
      when: { labels: ['Firaga', 'Fira', 'Fire'], targetId: 'sinspawn-genais', flags: { 'sin.genais.shelled': true } },
      text: 'Genais is weak to Fire, and inside its shell it cannot answer a spell with Waterga',
      cite: 'ffx-sin §2.2, §5.3.1',
    },
    {
      when: { kinds: ['attack'], targetId: 'sinspawn-genais' },
      text: 'Physicals only while Genais is out of its shell: every spell aimed at it draws Waterga on the caster',
      cite: 'ffx-sin §5.3.1, §8 row 4',
    },
    {
      when: { labels: ['Thundaga', 'Blizzaga', 'Firaga', 'Waterga', 'Thundara', 'Blizzara', 'Fira', 'Watera'] },
      text: 'Magic reaches at either range, and nothing on Sin is weak or resistant to it except Genais',
      cite: 'ffx-sin §2.2, §4',
    },
    {
      when: { labels: ['Curaga', 'Pray', 'Al Bhed Potion'] },
      text: 'Gravija and Thrashing hit everyone: bring the party back up before the next swing',
      cite: 'ffx-sin §3.1, §3.2',
    },
    {
      when: { labels: ['Soft', 'Esuna', 'Remedy'] },
      text: 'A member out of the fight costs more than one turn spent curing',
      cite: 'ffx-sin §7.3 item 5',
    },
  ],

  watch: [
    {
      name: 'Core gathers energy.',
      payload: "Gravija: three quarters of everyone's current HP",
      advice: 'Pull back if Cid acts before the Fin; otherwise heal after it lands',
      cite: 'ffx-sin §5.1.2, §3.1',
    },
    {
      // The same telegraph if the engine names the charge without the stop.
      name: 'Core gathers energy',
      payload: "Gravija: three quarters of everyone's current HP",
      advice: 'Pull back if Cid acts before the Fin; otherwise heal after it lands',
      cite: 'ffx-sin §5.1.2, §3.1',
    },
  ],

  phases: [
    {
      bossId: 'right-fin',
      belowHpFraction: 0.25,
      label: 'LATCHED - IT SWINGS EVERY NEAR TURN',
      note: 'Below 16,250 HP the Right Fin attacks on every NEAR turn, and at FAR after three hits. Healing it back does not undo it.',
      cite: 'ffx-sin §5.2',
    },
    {
      bossId: 'sinspawn-genais',
      belowHpFraction: 0.5,
      label: 'GENAIS SHELLS ON ITS NEXT TURN',
      note: 'At half HP it goes into its shell: armoured, Cura on every hit, and the Core wakes to charge Gravija.',
      cite: 'ffx-sin §5.3.1, §5.3.2',
    },
    {
      bossId: 'sin-core',
      label: "SIN'S CORE",
      note: 'Killing the Core ends the fight, even with Genais still standing. Once Genais falls, the Core charges Gravija on its own.',
      cite: 'ffx-sin §5.3.2',
    },
  ],
};

export default SIN_FINS_CORE_GUIDE;
