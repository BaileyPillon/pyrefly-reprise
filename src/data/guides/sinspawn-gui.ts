/**
 * The hidden Sinspawn Gui chapter, the Ridge of Mushroom Rock Road (Operation Mi'ihen)
 * [research/ffx-sinspawn-gui.md, research/re-ffx-ai-gui.md "RE §n"].
 *
 * Written against the tactic in `src/engine/tactics/sinspawn-gui.ts`: every hint below explains a row that file asks for (Power Break, Haste, Cheer, the
 * spells and the Overdrive, Cure and the items, Esuna, the swing at an arm), so each line says why the command the player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Gui, its arms' shield, Seymour as a guest in the party and the Ridge exist only in FFX; no FFX-2 file reads this one.
 *
 * Sourced facts only, and **the party's numbers are not here**: the party at the Ridge is an estimate (`data/ffx/builds/mushroom-rock.ts`, "[estimate]"), so no line below quotes
 * a hit or an HP of ours. Every number is the game's own row: the body's 12,000 and 6,000 HP, the head's 4,000 and 1,000, the arms' 800 (RE §3.1), the cycle of the head and the cancel
 * (RE §5.3), the arms' shield and their regrowth in three or four body turns (RE §5.4, §5.5), Power Break landing on the body only (RE §3.2) and halving the user's physical damage
 * (ffx-combat-core §2.10), and Seymour's list and Requiem (RE §7.3, §7.4). The line follows the FFX encounter guide's two Gui sections in order (research §13) and differs where the
 * game's data does (rule 6): no element is better against any part (the guide's Fire advice is left out); a Fire does not kill the head, a Fira does; and Power Break, which the
 * guide does not mention, is the strongest single turn of the first fight. **Not modelled, so not promised:** the farm the arms' regrowth allows is never mentioned, the piece of
 * equipment the second body drops is not given, and no line promises the Overkill reward (the engine's overkill rule is not the guide's "558 HP").
 */

import type { ChapterGuide } from './types.ts';

/** The two bodies (`src/data/ffx/sinspawn-gui-ids.ts`): the first fight's, then the second's. The head and the arms are parts of whichever stands. */
export const SINSPAWN_GUI_GUIDE_IDS = ['sinspawn-gui', 'sinspawn-gui-2'] as const;

const BODIES = SINSPAWN_GUI_GUIDE_IDS;
const ARMS = ['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'] as const;
const HEAD = 'sinspawn-gui-head';

export const SINSPAWN_GUI_GUIDE: ChapterGuide = {
  id: 'sinspawn-gui',
  title: 'Sinspawn Gui',
  bossIds: [...SINSPAWN_GUI_GUIDE_IDS],

  rules: [
    {
      text: 'Only the body has to fall. The head and the two arms can be left alone: the battle ends when the body does. Everything else is about making the body easy to hit.',
      short: 'Only the body has to fall',
      cite: 'ffx-sinspawn-gui §4.7; re-ffx-ai-gui §1, §9 G-02',
    },
    {
      text: 'While an arm stands, the body shrugs off every physical blow. Spells, Overdrives and Lancet get through. Bring both arms down first; they grow back together a few turns after both have fallen.',
      short: 'Arms first: they shield the body',
      cite: 'ffx-sinspawn-gui §4.5, §4.6; re-ffx-ai-gui §5.4, §5.5, §9 G-08, G-10',
    },
    {
      text: 'The head runs a three-turn cycle: Thunder, then a turn where it shakes, then Venom. Hit it while it shakes, with a spell, Wakka or Seymour, and the Venom never comes. Melee cannot reach it.',
      short: 'Hit the head while it shakes',
      cite: 'ffx-sinspawn-gui §4.3; re-ffx-ai-gui §4, §5.3, §9 G-07, G-09',
    },
    {
      text: 'Power Break lands on the body and nowhere else here, and it halves the damage its Attack does. Auron should open with it. Haste and Cheer early help the rest of the party keep up.',
      short: 'Auron: Power Break the body first',
      cite: 'ffx-sinspawn-gui §2.3; re-ffx-ai-gui §3.2; ffx-combat-core §2.10',
    },
    {
      text: 'The second fight is the same four parts, much weaker: the body has half the HP and the head a quarter. Seymour is yours to command, and his spells pass the arms\' shield.',
      short: 'Second fight: Seymour\'s spells pass the shield',
      cite: 'ffx-sinspawn-gui §4.7, §5.2; re-ffx-ai-gui §2.3, §7.3, §9 G-03',
    },
  ],

  hints: [
    { when: { labels: ['Power Break'], targetId: BODIES[0] }, text: 'Power Break lands on the body and halves the damage of its Attack', cite: 'ffx-sinspawn-gui §2.3; re-ffx-ai-gui §3.2; ffx-combat-core §2.10' },
    { when: { labels: ['Power Break'], targetId: BODIES[1] }, text: 'Power Break lands on the body and halves the damage of its Attack', cite: 'ffx-sinspawn-gui §2.3; re-ffx-ai-gui §3.2; ffx-combat-core §2.10' },
    { when: { labels: ['Haste'] }, text: 'Haste {target}: the body is slow and hits hard, so the party wants more turns of its own', cite: 'ffx-sinspawn-gui §13, §6.4' },
    { when: { labels: ['Cheer'] }, text: 'Cheer for the party while the body is fresh: each stack adds Strength', cite: 'ffx-sinspawn-gui §13, §6.4' },
    { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up: one blow from the body can put a caster down', cite: 'ffx-sinspawn-gui §3.3; re-ffx-ai-gui §4, §8' },
    { when: { labels: ['Esuna', 'Antidote'] }, text: 'Clear the Poison from the Venom off {target}', cite: 'ffx-sinspawn-gui §3.1; re-ffx-ai-gui §4' },
    { when: { labels: ['Cure', 'Cura', 'Hi-Potion', 'Potion'] }, text: 'Top {target} up: the body\'s Attack and Demi come on a steady rhythm', cite: 'ffx-sinspawn-gui §4.4; re-ffx-ai-gui §5.2' },
    {
      when: { targetId: HEAD, flags: { 'gui.headState': 3 } },
      text: 'The head has shaken: this hit on it stops the Venom',
      cite: 'ffx-sinspawn-gui §4.3; re-ffx-ai-gui §5.3, §9 G-07',
    },
    { when: { kinds: ['attack'], targetId: ARMS[0] }, text: 'The arms shield the body from physical blows: bring them down first', cite: 'ffx-sinspawn-gui §4.5; re-ffx-ai-gui §5.4, §9 G-08' },
    { when: { kinds: ['attack'], targetId: ARMS[1] }, text: 'The arms shield the body from physical blows: bring them down first', cite: 'ffx-sinspawn-gui §4.5; re-ffx-ai-gui §5.4, §9 G-08' },
    { when: { labels: ['Fire', 'Thunder', 'Blizzard', 'Water'], targetId: ARMS[0] }, text: 'A spell on an arm: nothing shields it, and it takes the arm down for a few turns', cite: 'ffx-sinspawn-gui §4.5, §4.6; re-ffx-ai-gui §5.4, §5.5' },
    { when: { labels: ['Fire', 'Thunder', 'Blizzard', 'Water'], targetId: ARMS[1] }, text: 'A spell on an arm: nothing shields it, and it takes the arm down for a few turns', cite: 'ffx-sinspawn-gui §4.5, §4.6; re-ffx-ai-gui §5.4, §5.5' },
    { when: { actorId: 'seymour', labels: ['Fira', 'Fire'] }, text: 'Seymour\'s spells pass the arms\' shield, and a Fira takes the head or an arm in one cast', cite: 'ffx-sinspawn-gui §5.2; re-ffx-ai-gui §7.3, §8' },
    { when: { actorId: 'seymour', kinds: ['overdrive'] }, text: 'Requiem hits every part at once and nothing shields it: his gauge fills as he is hurt', cite: 'ffx-sinspawn-gui §5.4; re-ffx-ai-gui §7.4' },
    { when: { kinds: ['overdrive'] }, text: 'An Overdrive goes through the arms\' shield: spend it on the body', cite: 'ffx-sinspawn-gui §4.5; re-ffx-ai-gui §5.4, Q-4' },
    { when: { kinds: ['attack'], targetId: BODIES[0] }, text: 'Both arms are down: the body takes the full blow, until they grow back', cite: 'ffx-sinspawn-gui §4.6; re-ffx-ai-gui §5.5' },
    { when: { kinds: ['attack'], targetId: BODIES[1] }, text: 'Both arms are down: the body takes the full blow, until they grow back', cite: 'ffx-sinspawn-gui §4.6; re-ffx-ai-gui §5.5' },
    { when: { kinds: ['defend'] }, text: 'Nothing to mend this turn', cite: 'ffx-sinspawn-gui §4.4; re-ffx-ai-gui §5.2' },
  ],

  watch: [
    {
      name: 'Shaking',
      payload: 'On its next turn the head makes the body cast Venom: heavy damage and Poison on one of the party',
      advice: 'Hit the head before its turn comes: a spell, Wakka\'s weapon or Seymour\'s Fira. A hit that does damage stops it',
      cite: 'ffx-sinspawn-gui §4.3; re-ffx-ai-gui §5.3',
    },
  ],

  phases: [
    {
      bossId: 'sinspawn-gui',
      label: 'THE RIDGE',
      note: 'Four parts: the body, the head and two arms that never act. Arms down, then the body; the head matters only while it shakes.',
      cite: 'ffx-sinspawn-gui §4.2 to §4.6; re-ffx-ai-gui §2.2, §5.2 to §5.5',
    },
    {
      bossId: 'sinspawn-gui-2',
      label: 'THE GUEST HOUR',
      note: 'Yuna, Auron and Seymour, no bench and no Switch. The body has half the HP, and its Demi comes more often from the first turn.',
      cite: 'ffx-sinspawn-gui §4.7; re-ffx-ai-gui §2.3, §5.2, §7',
    },
  ],
};

export default SINSPAWN_GUI_GUIDE;
