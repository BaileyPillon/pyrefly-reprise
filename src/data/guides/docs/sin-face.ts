/**
 * Chapter 18, Sin: the Face (Overdrive Sin): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide's boss page for
 * Overdrive Sin in our own words and in its order (layout: `../doc-types.ts`);
 * `research/jegged-encounter-guides-ffx-b.md` section 7 holds the page and every difference. HP, Steal
 * and Drops are the numbers this game uses, and so is the clock: the page says about sixteen turns,
 * the game ends the fight on Sin's twelfth (the game's own script: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md`
 * section 7.2, which settled `research/ffx-sin.md` S-1; it read "the thirteenth, our estimate" until CH-XVIII, re-parity),
 * so that is the number printed. The preparation paragraph sits at the foot of the previous boss's page there and is
 * this fight's preparation, so it opens this page. The party starts in armour with all three Wards (`sinFaceBuild`).
 */

import type { GuideDoc } from '../doc-types.ts';

export const SIN_FACE_DOC: GuideDoc = {
  id: 'sin-face',
  game: 'ffx',
  bossIds: ['overdrive-sin'],
  blocks: [
    {
      t: 'p',
      text: "Level up on the Sphere Grid and refill whatever you've run low on. Before the next fight, put each character in armour with these abilities:",
    },
    {
      t: 'ul',
      items: ['Stoneproof or Stone Ward', 'Confuseproof or Confuse Ward', 'Zombieproof or Zombie Ward'],
    },
    {
      t: 'p',
      text: 'Another option is customizing equipment with Auto-Med, which uses a Remedy automatically when a status ailment hits; it costs 20 Remedies.',
    },
    {
      t: 'p',
      text: 'Also carry a stock of Remedies for use during the battle. It is optional, but it eases the fight a lot.',
    },
    { t: 'head', at: ['overdrive-sin'], title: 'Overdrive Sin (the Head)', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'It drags the airship in while it gathers its power for the ultimate terror, Giga-Graviton. Stop it before it wipes everyone out!',
    },
    { t: 'field', label: 'HP', value: '140,000' },
    {
      t: 'p',
      text: 'This battle runs on a clock: on its twelfth turn Sin uses its Overdrive, Giga-Graviton, an attack that ends the game on the spot.',
    },
    {
      t: 'p',
      text: 'The bar above its head shows how near it is to firing. Summoning an aeon will not save you, so you must deal all 140,000 damage before then.',
    },
    {
      t: 'p',
      text: 'Sin begins too far away to hit and slowly drifts into melee range. Spend the early turns buffing with Cheer, Luck and the like, and Tidus should put Hastega on everyone.',
    },
    { t: 'p', text: 'Lulu or Wakka in the party can do damage even while Sin is distant.' },
    {
      t: 'p',
      text: 'Auron should use Armor Break as soon as Sin is close enough. Rikku can get the same Armor Break by Mixing a pair of items (two Power Spheres, say, or two Ability Spheres) into a Frag Grenade.',
    },
    {
      t: 'p',
      text: 'Once Sin is close to the ship it starts attacking, so be ready for Petrify, Confuse and Zombie.',
    },
    { t: 'list', label: 'Steal', items: ['Ether (common)', 'Supreme Gem (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 3 Key Sphere'] },
  ],
};
