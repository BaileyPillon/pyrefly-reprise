/**
 * The hidden Sinspawn Gui chapter (Mushroom Rock Road, the Ridge): the guide's two pages for these fights.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide's two Gui pages in our own words and in their order (layout: `../doc-types.ts`); `research/ffx-sinspawn-gui.md`
 * section 13 holds what the guide says and every difference. Where the game's own rows differ, the number or the rule printed is the game's (rule 6, `research/re-ffx-ai-gui.md`):
 *
 * - **No element is better** against any part (RE section 3.1), so the guide's Fire advice is left out;
 * - the body goes **Attack, Attack, Demi**, not the guide's two alternating (RE section 5.2), and hurries once it is under a third of its HP in the first fight and from the start of the second;
 * - the head is stopped only by a hit that does damage (a Scan reaches it and does nothing; Lancet drains HP, so it counts), RE section 5.3;
 * - **Power Break** lands on the body and halves the damage of its Attack: the guide does not say it, the rows do (RE section 3.2), so it is the one addition, and it is in the plan.
 *
 * **The party's numbers are not on these pages**: the party at the Ridge is an estimate (`data/ffx/builds/mushroom-rock.ts`). **Not modelled, so not promised:** the equipment the second body drops,
 * and the farm the arms' regrowth allows (neither is mentioned).
 */

import type { GuideDoc } from '../doc-types.ts';

export const SINSPAWN_GUI_DOC: GuideDoc = {
  id: 'sinspawn-gui',
  game: 'ffx',
  bossIds: ['sinspawn-gui', 'sinspawn-gui-2'],
  blocks: [
    { t: 'head', at: ['sinspawn-gui'], title: 'Sinspawn Gui', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value: 'A guarded monster. Its arms turn physical blows aside, and its head stirs before it spits Venom.',
    },
    { t: 'field', label: 'HP', value: '12,000' },
    {
      t: 'p',
      text: 'Gui is four parts in one: a body, a head and two arms. Only the body has to fall for you to win. The head and the arms are there to make that hard.',
    },
    { t: 'h3', text: 'Head' },
    {
      t: 'p',
      text: 'The head works through the body: it calls Thunder, then shakes, then calls Venom, a heavy hit with Poison on one of you. When it starts to shake, hit it and the Venom never comes.',
    },
    {
      t: 'p',
      text: "Melee cannot reach it. Lulu's spells, Wakka's attack and Kimahri's Lancet can, and any of them that does damage stops the Venom.",
    },
    { t: 'h3', text: 'Arms' },
    {
      t: 'p',
      text: 'The arms never attack. While either one stands, every physical blow aimed at the body is turned away. Spells, Overdrives and Lancet are not stopped.',
    },
    {
      t: 'p',
      text: 'Bring both arms down before you go for the body. Auron\'s and Kimahri\'s weapons cut through their armor, and a spell will do. They grow back a few turns after both have fallen, and you cannot prevent it.',
    },
    { t: 'h3', text: 'Body' },
    {
      t: 'p',
      text: 'The body strikes twice and then casts Demi on all three of you, and keeps that rhythm. It hurries once it is under a third of its HP. Both hurt, so keep someone ready to heal.',
    },
    {
      t: 'p',
      text: 'Power Break lands on the body and halves the damage of its strikes. Auron should cast it first, so he belongs in the party.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Cast Haste on everyone with Tidus and stack Cheer and Focus early.',
        'Auron opens with Power Break on the body.',
        'Bring the arms down with Lulu\'s spells and with Auron\'s and Kimahri\'s weapons.',
        'When the head shakes, hit it with a spell or Wakka\'s attack.',
        'With both arms down, hit the body with everything you have, Overdrives included, before they return.',
        'Swap Yuna in to heal. Let each of your characters act at least once so that all of them earn AP.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Potion (common)', 'Potion (rare)'] },
    { t: 'list', label: 'Drops', items: ['None'] },

    { t: 'head', at: ['sinspawn-gui-2'], title: 'Sinspawn Gui (Round 2)', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '6,000' },
    {
      t: 'p',
      text: 'The second fight starts as soon as the first ends, with the same four parts and the damage you took still on you. Your party is Yuna, Auron and Seymour, and you cannot switch.',
    },
    {
      t: 'p',
      text: 'Everything is weaker this time: the body has half the HP and hits far lighter, and the head has only 1,000. Its Demi comes more often from the very first turn.',
    },
    {
      t: 'p',
      text: 'Seymour is yours to command. His spells pass the arms\' shield, and one Fira takes the head or an arm down in a single cast.',
    },
    {
      t: 'p',
      text: 'His Overdrive, Requiem, hits every part at once and nothing shields it. It fills as he is hurt rather than as he fights.',
    },
    {
      t: 'p',
      text: 'Have Seymour cast Fira on the body, and on the head the moment it shakes. Auron brings the arms down so his strikes count, and Yuna keeps all three of you standing.',
    },
    { t: 'list', label: 'Steal', items: ['Potion (common)', 'Potion (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 1 Key Sphere x3'] },
  ],
};

export default SINSPAWN_GUI_DOC;
