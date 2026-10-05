/**
 * Chapter 10, Seymour Natus (Highbridge): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for this boss in our
 * own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx-b.md`
 * section 3 holds the page and every difference. HP, Steal and Drops are the numbers this game uses
 * (it awards no drop here: the item has no record yet). Three claims on that page are left out
 * because our research says the game does otherwise: a direct hit draws a counter-spell, Nul spells
 * call Desperado, and Magic Break works on Natus and Mortibody.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SEYMOUR_NATUS_DOC: GuideDoc = {
  id: 'seymour-natus',
  game: 'ffx',
  bossIds: ['seymour-natus', 'mortibody'],
  blocks: [
    {
      t: 'p',
      text: "Save and restock from O'aka, then run along the walkway to begin the fight with Maester Seymour. A second Save Sphere waits at the far end of the Highbridge.",
    },
    {
      t: 'p',
      text: 'Fighting Seymour Natus gets far easier if Yuna has Reflect, so level her on the Highbridge against random fiends until she learns it.',
    },
    {
      t: 'p',
      text: 'Wear any armour with Stone Ward or Stoneproof, and check that Lulu already has Bio.',
    },
    { t: 'head', at: ['seymour-natus', 'mortibody'], title: 'Seymour Natus', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'Still elemental, but now in multi-casts. Weakened, he petrifies with Break and then uses the non-elemental Flare.',
    },
    { t: 'field', label: 'HP', value: '36,000' },
    {
      t: 'p',
      text: 'Seymour Natus has two parts you can target, Natus and Mortibody. Natus is Seymour himself; Mortibody is the small alien arm on his left. The fight has three phases, each with its own pattern.',
    },
    {
      t: 'p',
      text: 'Mortibody casts Desperado throughout, which strips helpful statuses (Haste, Protect, Shell, Reflect) from the party. It happens automatically when three of your party share one status, so spread statuses carefully.',
    },
    { t: 'lead', text: 'Phase 1' },
    {
      t: 'p',
      text: 'In Phase 1 Mortibody only casts basic spells, cycling through the elements. Natus follows soon after with a Multi-cast double of the same element.',
    },
    {
      t: 'p',
      text: "Yuna's Nul spells (NulBlaze, NulShock, NulTide, NulFrost) could block that damage if cast between the two attacks, but fitting her turn there is tricky, even if it can be done.",
    },
    { t: 'p', text: 'Just keep attacking until the phase ends, once you have dealt 24,000 damage.' },
    { t: 'lead', text: 'Phase 2 (when Natus drops under 24,000 HP)' },
    {
      t: 'p',
      text: 'Natus starts the phase by putting Protect on himself, which Dispel removes if you have it. He also begins casting Break on single characters, which petrifies them.',
    },
    {
      t: 'p',
      text: "Mortibody's Shattering Claw destroys a petrified character it hits, removing them for good, so use a Soft or Yuna's Esuna on Petrify immediately.",
    },
    { t: 'lead', text: 'Phase 3 (when Natus drops under 12,000 HP)' },
    {
      t: 'p',
      text: 'Now Seymour casts Flare at party members for about 2,500 HP apiece, and Mortibody starts casting Cura on Natus, which makes the last 12,000 HP a slog.',
    },
    {
      t: 'p',
      text: 'Reflect on Natus sends those Cura spells onto one of your party instead, which makes the fight far easier.',
    },
    { t: 'lead', text: 'Some additional notes:' },
    {
      t: 'p',
      text: 'Attacking Mortibody is an option. Each time you kill it, Mortibsorption takes 4,000 HP from Natus and revives it; the amount then drops to 3,000, then 2,000, and finally stays at 1,000.',
    },
    {
      t: 'p',
      text: 'Taking Natus down in 1,000-HP slices still beats dealing with his Flare. If your characters have Reflect, attack Natus directly instead.',
    },
    {
      t: 'ul',
      items: [
        "Summoning an aeon does little, since Natus uses Banish at once. Yuna's Grand Summon can still give you a quick aeon Overdrive.",
        'Yuna’s Talk, one of the Trigger Commands, raises her Magic Defense when used on Seymour, which helps a lot; Tidus and Auron can Talk to him too, for a Strength boost.',
      ],
    },
    { t: 'lead', text: 'Strategy:' },
    {
      t: 'ul',
      items: [
        'Reflect on Yuna makes this fight much easier. If you have trouble, level her on the Highbridge until she learns it, and put Reflect on every character for the last phase.',
        'Haste only two party members: Mortibody uses Desperado, which removes all positive statuses, whenever all three are Hasted. Do this before putting Reflect on the party, or the Haste will reflect onto Natus.',
        'Have Lulu cast Bio on Seymour very early. The fight is slow, so the poison has time to add up.',
        'Without Reflect, Shell should go on just two of the party, cast by Yuna.',
        'Put Reflect (or Shell, if you lack it) on Natus himself so that Mortibody cannot heal him much with Cura.',
        'Advanced: make sure every character lands at least one attack on Mortibody or Natus, so all of them earn AP.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Tetra Elemental (x2) (common)', 'Tetra Elemental (x3) (rare)'] },
    { t: 'list', label: 'Drops', items: ['None'] },
  ],
};
