/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows Jegged's Chapter 5 Djose Temple encounter guide in our own words and in its order (layout: `../doc-types.ts`):
 * the mission and the preparation, then the fight. `research/ffx2-experiment.md` section 9 holds the plan and every difference. Enemy, HP, Steal and Drop are the numbers this
 * game uses: 18,324 at every level, Turbo Ether (one, or two as the rare steal) and an Elixir. The dig for the machine's parts, the repair manuals and the Primer and trophy notes
 * are left out: the game this chapter plays has two fixed fights (the prototype, then the machine rebuilt to the limit) and no dig. Auto-Life, which that guide names as the second
 * answer to Lifeslicer, is left out too: no Garment Grid in this game's data grants it, so the one answer given is the Phoenix Down. The Gun Mage note follows the Den's Mortar note.
 *
 * The panel opens at the top for the prototype and on the rebuilt machine's page once it stands.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_EXPERIMENT_DOC: GuideDoc = {
  id: 'ffx2-masterpiece-theatre',
  game: 'ffx2',
  bossIds: ['x2-experiment-prototype', 'x2-experiment'],
  blocks: [
    {
      t: 'p',
      text: 'The Machine Faction has made the temple its workshop and built a weapon to take on Vegnagun. It dares you to break it. You fight it twice: a bare prototype first, then the machine rebuilt to the limit.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: 'Gun Mage Blue Bullet',
      text: 'The rebuilt machine uses Annihilator, a Blue Bullet for Gun Mages. This is the only place in the story to learn it, and a Gun Mage has to survive being hit by it.',
    },
    { t: 'lead', text: 'Preparation:' },
    {
      t: 'p',
      text: 'There is no complex strategy here. Bring well-levelled girls who can take a hit and deal plenty of damage quickly, with Dark Knights for the extra Strength and Defense.',
    },
    {
      t: 'p',
      text: 'Carry Phoenix Downs, Mega Phoenix and Mega-Potions. A White Mage or an Alchemist who can heal the whole party is worth more than another attacker.',
    },
    { t: 'head', at: ['x2-experiment-prototype'], title: 'The Experiment', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'The prototype is barely a machine. It only strikes, one girl at a time, and almost every hit gets through its Defense.',
    },
    {
      t: 'p',
      text: 'Put Protect up, keep everyone healthy and win. Do not expect that to be the end of it: the Faction promises to rebuild it.',
    },
    { t: 'head', at: ['x2-experiment'], title: 'The Experiment, Rebuilt', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Rebuilt, it hits hard, shrugs off most damage and uses every attack it has. Its HP is the same as before; nothing else is.',
    },
    {
      t: 'p',
      text: 'Open with Protect on all three girls, then put your Dark Knights on Darkness. It ignores Defense, which is the one thing this machine has plenty of.',
    },
    { t: 'p', text: 'The machine works through one fixed order, over and over:' },
    {
      t: 'ul',
      items: [
        '“Rocket Launcher”: ten hits, each on a random girl, so one girl can take several',
        'A plain strike on one girl',
        '“Rocket Launcher” again, then another plain strike',
        '“Lifeslicer”: takes one girl’s HP to nothing, and neither Protect nor Shell stops it',
        '“Annihilator”: magic on the whole party, with a short delay on each girl',
        'One last plain strike, then back to the top',
      ],
    },
    {
      t: 'p',
      text: 'Heal after every volley and keep a Phoenix Down in hand. Lifeslicer cannot be blocked, only undone.',
    },
    {
      t: 'p',
      text: 'Put Shell up before the Annihilator. It takes a long time to wind up, so you can see it coming, and Shell halves what it does.',
    },
    {
      t: 'p',
      text: 'Break abilities and status effects do nothing to it, so spend your turns on damage and healing.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Experiment', hp: '18,324', steal: 'Turbo Ether', drop: 'Elixir' }],
    },
  ],
};
