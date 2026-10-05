/**
 * Chapter 6, the Leblanc Syndicate (Chateau Leblanc): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). The FFX-2 encounter guide has no boss box for the
 * Chateau's three fights, only the walkthrough's paragraphs under "Hidden Passageway" (it calls each
 * fight easy and gives no HP, moves or loot table), so this page holds those paragraphs in our own
 * words and in their order and nothing more (layout: `../doc-types.ts`);
 * `research/jegged-encounter-guides-ffx2.md` section 4 holds the page. The Garment Grid it names as a
 * reward and the trip back to the Celsius are not in this game.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_LEBLANC_DOC: GuideDoc = {
  id: 'ffx2-leblanc',
  game: 'ffx2',
  bossIds: ['leblanc', 'logos', 'ormi', 'logos-room', 'ormi-logos-room', 'ormi-entrance', 'dr-goon', 'fem-goon'],
  blocks: [
    {
      t: 'head',
      at: ['leblanc', 'logos', 'ormi', 'logos-room', 'ormi-logos-room', 'ormi-entrance', 'dr-goon', 'fem-goon'],
      title: 'Hidden Passageway',
    },
    {
      t: 'p',
      text: 'Go into the Hidden Passageway. Ormi and some Syndicate members soon ambush you, but they are extremely easy to beat. Follow the passage to the Save Sphere and save.',
    },
    {
      t: 'p',
      text: 'A second ambush, by Logos and Ormi, comes later, and they are extremely easy again; they seem not to have levelled while Yuna, Rikku and Paine earned all that EXP.',
    },
    {
      t: 'p',
      text: 'The last fight is against Leblanc, Ormi and Logos. Like the Syndicate fights before it, it needs no elaborate strategy and is very easy.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: 'Charm Bangle',
      text: 'It is easy to miss because it is a one-time fight, but Logos drops a very useful item: the Charm Bangle, which gives No Encounters and stops random battles.',
    },
    {
      t: 'p',
      text: 'Using it this early is generally not advised, since your characters need the EXP, but now you have it in your toolkit.',
    },
    {
      t: 'p',
      text: 'When the fight ends, the mission is over and Leblanc teams her Syndicate up with the Gullwings, who share a goal. You receive the Reassembled Sphere key item.',
    },
  ],
};
