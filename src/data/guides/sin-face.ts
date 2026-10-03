/**
 * Chapter XVIII — Sin: the Face [research/ffx-sin.md §5.4, §8 rows 8 and 9].
 *
 * Written against the tactic in `src/engine/tactics/sin-face.ts`: every `labels` entry below is a row that
 * file asks for.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: a CTB turn clock that ends in a
 * scripted Game Over, the airship's pull, Armor Break, aeons. Nothing here is true of FFX-2.
 *
 * The RULES and the NEXT line (`./lines/sin-face.ts`) follow the FFX encounter guide the project
 * settled on (D-350, `research/jegged-encounter-guides-ffx-b.md` §7); `cite` names the research section
 * behind each mechanic and is never rendered. **The clock's length is our estimate** (S-1, D-266/D-280):
 * the research holds the 12th or the 13th turn, the chapter uses the 13th until the Steam check settles
 * it, and the page says "the 12th or 13th" rather than the guide's own longer count. The `hints` below
 * are the move advisor's borrowed sentences for the chapter tactic's pick: the panel does not read them.
 *
 * Listed with its chapter on 2026-09-29 (D-279), through `./index.ts`'s `GUIDES`.
 */

import type { ChapterGuide } from './types.ts';
import { SIN_FACE_LINE } from './lines/sin-face.ts';

export const SIN_FACE_GUIDE: ChapterGuide = {
  id: 'sin-face',
  title: 'Sin: the Face',
  bossIds: ['overdrive-sin'],

  rules: [
    {
      text: "Sin's turns are the clock. Three turns pulling the ship in, then the mouth opens, and when it is fully open Giga-Graviton ends the fight: no Auto-Life or aeon saves you. It lands on Sin's 12th or 13th turn, so beat it before the 12th.",
      short: "Beat it before Sin's 12th turn",
      cite: 'ffx-sin §5.4, §3.4, §10 S-1',
    },
    {
      text: 'While it is out of reach, only Wakka and magic hit it. Spend the first turns on Hastega and Cheer, and bring Wakka and Lulu in to deal the damage: those turns cost nothing the clock can take back.',
      short: 'Out of reach: Hastega, Cheer, Wakka and Lulu',
      cite: 'ffx-sin §5.4, §8 row 8',
    },
    {
      text: "Armor Break it the moment it is in reach, and Mental Break it so Lulu's Firaga hits about half again as hard. Then everything at it: Overdrives too, since nothing is worth saving past the clock.",
      short: 'Armor and Mental Break at once, then burst',
      cite: 'ffx-sin §4.2, §8 rows 1 and 8',
    },
    {
      text: 'Every sixth hit on it (every third from an aeon) draws Gaze, one status on the whole party at a 30% chance: Petrify, Confuse or Zombie. Carry the cures, and any Ward blocks it completely.',
      short: 'Gaze answers hits; carry cures, Wards block it',
      cite: 'ffx-sin §5.4, §8 row 9',
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
      text: "Lulu's Firaga is the burst's steadiest damage; keep her casting",
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
  line: SIN_FACE_LINE,
};

export default SIN_FACE_GUIDE;
