/**
 * Chapter 8, Evrae over the Fahrenheit: the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for this boss in our
 * own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx-a.md`
 * Chapter 8 holds the page and every difference. HP, Steal and Drops are the numbers this game uses.
 */

import type { GuideDoc } from '../doc-types.ts';

export const EVRAE_DOC: GuideDoc = {
  id: 'evrae-airship',
  game: 'ffx',
  bossIds: ['evrae'],
  blocks: [
    {
      t: 'p',
      text: 'Most players find Evrae one of the most troublesome bosses in the game. Your levels and style matter, but it is worth preparing well regardless.',
    },
    {
      t: 'p',
      text: 'Wear Stoneproof or Stone Ward armour and Poisonproof or Poison Ward armour if you have any. A proof ability removes the chance of that status entirely; a Ward only lowers it, so it can still land.',
    },
    {
      t: 'p',
      text: 'You can add these wards to armour you own: 30 Softs from Rin give Stone Ward in an open slot, 30 Antidotes give Poison Ward, and armour with two open slots can take both.',
    },
    {
      t: 'p',
      text: 'Make sure Wakka and Rikku are properly equipped, because they will carry this fight. Lulu is an option too if she is among your higher-level characters.',
    },
    {
      t: 'p',
      text: 'In the final room (the one with the Save Sphere), talk to the Al Bhed standing on the left for four Al Bhed Potions, then go through the gates at the back to start.',
    },
    { t: 'head', at: ['evrae'], title: 'Evrae, Guardian Wyrm of Bevelle', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'High Magic Defense and no elemental weakness. Repeated melee hits make it exhale Poison Breath. Have Cid move the ship away and he fires Guided Missiles.',
    },
    { t: 'field', label: 'HP', value: '32,000' },
    { t: 'lead', text: 'The mechanics of the fight:' },
    {
      t: 'p',
      text: 'Evrae is a flying wyrm, and the fight takes place outside the Fahrenheit as you approach Bevelle. Cid takes your orders: on his turn the ship either moves closer to Evrae or pulls farther away.',
    },
    {
      t: 'p',
      text: 'Up close, Evrae can use Stone Gaze, which may petrify, and Poison Breath, which may poison. That is why the armour above matters.',
    },
    {
      t: 'p',
      text: 'While the ship is far off, Cid fires Guided Missiles (Salvos) on his own, at most 3 times in total.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'p',
      text: "Begin by pulling the ship away. Tidus uses Cheer to raise the team's Strength and Defense; it stacks up to 5 times, and there is plenty of time for that while the ship is distant.",
    },
    { t: 'p', text: 'Wakka keeps attacking all fight long, because his shots reach Evrae from any distance.' },
    {
      t: 'p',
      text: 'From far away Evrae hits weakly, so retreat whenever you need to catch your breath. It also gives Cid time for his Guided Missiles, which hurt a lot.',
    },
    {
      t: 'p',
      text: "Rikku's Use command with Al Bhed Potions heals the team and clears Poison and Petrify. Her Overdrive, Mix, can also produce Mighty G or Super Mighty G.",
    },
    {
      t: 'p',
      text: "Mighty G puts Protect and Shell on everyone, cutting all of Evrae's damage; Super Mighty G also grants Haste and Regen. Rikku's Overdrive section lists the items needed.",
    },
    {
      t: 'p',
      text: 'Rikku is the best healer here, so field Wakka, Rikku and Tidus, and swap Lulu in for Tidus if you want more damage.',
    },
    {
      t: 'p',
      text: 'Tidus can Slow or Slowga Evrae to get more turns. At 1/3 HP, though, Evrae starts casting Haste on itself, which cancels any Slow, and it casts Haste again at once if you re-Slow it.',
    },
    {
      t: 'p',
      text: "Cheer makes Wakka's ordinary attacks hit Evrae very hard. Keep at it until it goes down.",
    },
    { t: 'list', label: 'Steal', items: ['Water Gem'] },
    { t: 'list', label: 'Drops', items: ['Blk Magic Sphere'] },
  ],
};
