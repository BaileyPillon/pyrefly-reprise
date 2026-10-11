/**
 * Chapter XVIII — Sin: the Face [research/ffx-sin.md §5.4, §8 rows 8 and 9].
 *
 * Written against the tactic in `src/engine/tactics/sin-face.ts`: every `labels` entry below is a row that
 * file asks for.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: a CTB turn clock that ends in a
 * scripted Game Over, the airship's pull, Armor Break, aeons. Nothing here is true of FFX-2.
 *
 * **The clock is the game's own twelve turns.** The sources disagreed (the 12th or the 13th, S-1, D-266/D-280); the
 * game's script settles it: Giga-Graviton is Sin's 12th turn, three pulls and eight mouth turns before it
 * (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 7.2; re-parity AI lane C, D-31). Rewritten from "our
 * estimate, the 13th" by CH-XVIII (re-parity, Bailey 2026-10-09: "Ship 12, retune our line later (Recommended)").
 *
 * **The line and the party follow it** (`src/engine/tactics/sin-face.ts`, `sinFaceBuild` in
 * `src/data/ffx/builds/sin-fahrenheit.ts`): Lulu Doublecasts Firaga, and the party wears the three Wards the
 * sources and this guide's own page ask for.
 *
 * Listed with its chapter on 2026-09-29 (D-279), through `./index.ts`'s `GUIDES`.
 */

import type { ChapterGuide } from './types.ts';

export const SIN_FACE_GUIDE: ChapterGuide = {
  id: 'sin-face',
  title: 'Sin: the Face',
  bossIds: ['overdrive-sin'],

  rules: [
    {
      text: "Sin's turns are the clock. Three turns pulling the ship in, eight more while the mouth opens, and on its twelfth turn Giga-Graviton ends the fight: no Auto-Life or aeon saves you. The game's own script fixes the twelfth.",
      short: "Beat it before Sin's 12th turn",
      cite: 'ffx-sin §5.4, §3.4 (the twelfth: re-ffx-ai-evrae-yojimbo-isaaru-sin §7.2)',
    },
    {
      text: 'During the three pulls only Wakka and magic reach. Bring Wakka and Lulu in, and spend the other turns on Hastega and Cheer: they cost nothing the clock can take back.',
      short: 'The pulls: Wakka and Lulu in, Hastega, Cheer',
      cite: 'ffx-sin §5.4, §8 row 8',
    },
    {
      text: 'Armor Break the moment it is in range, then everything at it: Overdrives too, since nothing is worth saving past the clock.',
      short: 'Armor Break at once, then burst',
      cite: 'ffx-sin §8 row 8',
    },
    {
      text: 'Lulu is most of the damage: she Doublecasts Firaga on every turn she can pay for two, and drinks an Ether when she cannot. A Mental Break from Auron opens Sin to both casts.',
      short: 'Lulu Doublecasts Firaga; Ether to refill',
      cite: 'ffx-sin §6.2, §8 row 8 (Doublecast is hers here: ffx-bfa-yu-yevon §4.2)',
    },
    {
      text: 'Every sixth hit on it (every third from an aeon) draws Gaze, one status on the whole party at a 30% chance: Petrify, Confuse or Zombie. Any Ward blocks it completely, and the party starts with all three.',
      short: 'Gaze answers hits; Wards block it',
      cite: 'ffx-sin §1.2, §5.4, §8 row 9',
    },
  ],

  hints: [
    {
      when: { labels: ['Hastega', 'Haste'] },
      text: 'More party turns inside the same clock: the clock counts only Sin\'s turns',
      cite: 'ffx-sin §5.4, §8 row 8',
    },
    {
      when: { labels: ['Cheer'] },
      text: 'A pull turn nobody can swing in, spent on damage for the melee window',
      cite: 'ffx-sin §8 row 8',
    },
    {
      when: { kinds: ['switch'] },
      text: 'Only Wakka and magic reach during the pulls; in range, Auron brings the Breaks. A switch costs no turn',
      cite: 'ffx-sin §5.4, §8 row 8',
    },
    {
      when: { labels: ['Armor Break'] },
      text: 'It is in range now: one Break makes every swing left in the clock land harder',
      cite: 'ffx-sin §8 row 8',
    },
    {
      when: { labels: ['Mental Break'] },
      text: "Opens it to Lulu's Firaga for the rest of the clock",
      cite: 'ffx-sin §2.3, §8 row 8',
    },
    {
      when: { kinds: ['overdrive'] },
      text: 'Nothing is worth holding past the clock',
      cite: 'ffx-sin §8 row 8',
    },
    {
      when: { labels: ['Doublecast'] },
      text: 'Two Firagas for one turn: the most damage Lulu has, at twice the MP, and magic reaches through the pulls',
      cite: 'ffx-bfa-yu-yevon §4.2, ffx-sin §5.4',
    },
    {
      when: { labels: ['Firaga', 'Fira'] },
      text: 'Magic reaches through the pulls, and Sin has no element to avoid',
      cite: 'ffx-sin §2.2, §5.4',
    },
    {
      when: { labels: ['Soft', 'Remedy'] },
      text: 'Gaze took a member out, petrified or confused: bring them back before the clock runs further',
      cite: 'ffx-sin §5.4, §7.3 item 5',
    },
    {
      when: { labels: ['Holy Water'] },
      text: 'Gaze zombified a member: healing would hurt them now',
      cite: 'ffx-sin §5.4, §7.3 item 5',
    },
    {
      when: { labels: ['X-Potion', 'Hi-Potion', 'Phoenix Down', 'Mega Phoenix'] },
      text: 'One member down or nearly down costs more of the clock than a turn spent on them',
      cite: 'ffx-sin §5.4, §7.3 item 5',
    },
    {
      when: { labels: ['Ether', 'Turbo Ether'] },
      text: "Lulu's Doublecast Firagas are the burst's steadiest damage; refill her before she cannot pay for two",
      cite: 'ffx-sin §8 row 8',
    },
  ],

  watch: [],

  phases: [
    {
      label: 'THE CLOCK',
      note: 'Three pulls, then the mouth opens in stages. When it is fully open, Giga-Graviton is next.',
      cite: 'ffx-sin §5.4',
    },
  ],
};

export default SIN_FACE_GUIDE;
