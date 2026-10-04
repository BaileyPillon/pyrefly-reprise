/**
 * Chapter 13, Paragon and Trema (Via Infinito, the last cloister): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide's two boss pages
 * (Paragon, Trema) and the preparation above them in our own words and in their order (layout:
 * `../doc-types.ts`); `research/jegged-encounter-guides-ffx2.md` section 6 holds the pages and every
 * difference. Enemy, HP, Steal and Drop are the numbers this game uses: the chapter ships Oversoul
 * Paragon, whose HP is 210,000 (the page's table gives the normal form's 200,000), and one Dark Matter
 * as each fight's drop. The page's Judgment is the game's Judgement.
 *
 * The panel opens at the top for Paragon and on Trema's page once Trema stands.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_TREMA_DOC: GuideDoc = {
  id: 'ffx2-trema',
  game: 'ffx2',
  bossIds: ['paragon', 'trema'],
  blocks: [
    {
      t: 'p',
      text: 'This is the lowest floor of the Via Infinito. Two bosses wait here: Paragon first, then Trema straight after with no break in between.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: 'Paragon Oversoul',
      text: 'Trigger Paragon in its Oversouled form, which is recommended. If you have worked through the bestiary you may already have done so; otherwise it is not hard.',
    },
    {
      t: 'p',
      text: 'Paragon belongs to the Weapon family with Ultima Weapon and Omega Weapon. Defeat ten of them in total, then flee from the next one when it triggers an Oversoul.',
    },
    {
      t: 'p',
      text: 'Ultima Weapons turn up on floors 47 to 49 and Omega Weapons on floors 75 to 79. The Oversoul Enemies page under Tips and Tricks has more.',
    },
    {
      t: 'p',
      text: 'To prepare, level your characters well, have their best dresspheres (Mascot above all), and carry strong accessories (Invincible, Crystal Bangle, Rabite’s Foot, Shining Bracer, Defense Bracer).',
    },
    {
      t: 'p',
      text: 'Equipping the Higher Power Garment Grid is also recommended: it gives Break HP Limit, and pushing through each of its gates adds the Break Damage Limit Auto-Ability.',
    },
    { t: 'head', at: ['paragon'], title: 'Paragon', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'As noted above, face Paragon in its Oversoul form, which is actually easier. Until it falls under 40% HP it leaves you alone unless you provoke it.',
    },
    {
      t: 'p',
      text: 'That leaves time to recover between hits, heal damage, and get Break Damage Limit going from the very first turn.',
    },
    { t: 'p', text: 'In its normal form it uses:' },
    {
      t: 'ul',
      items: [
        'An ordinary attack (can inflict Poison, Itchy, Confusion, Ignore Defense or Absorb HP)',
        '“Genesis”: cone-shaped magic damage that strips helpful statuses such as Auto-Life, Protect, Shell, Reflect, Regen and Haste',
        '“Big Bang”: up to 25,000 damage, used only as a counter to special attacks that bypass Protect and Shell',
      ],
    },
    { t: 'p', text: 'In its Oversoul form it uses:' },
    {
      t: 'ul',
      items: [
        'An ordinary attack with no status effects',
        'Demi, if you use healing abilities',
        '“Judgement”: magic damage to one party member',
        '“Genesis” and “Big Bang” if 20 seconds pass without an attack from you (same effects as above)',
      ],
    },
    {
      t: 'p',
      text: 'The main point is to leave this fight ready for the harder battle with Trema. Using the Higher Power grid, cycle every girl through the dresspheres.',
    },
    {
      t: 'p',
      text: 'Avoid magic, MP Absorb, Supernova and every Arcana except Black Sky: Paragon fires them straight back at whoever used them.',
    },
    {
      t: 'p',
      text: 'You will probably just have to grind through it. A party of two Dark Knights and an Alchemist remains viable, as does one of three Mascots.',
    },
    {
      t: 'p',
      text: 'You can also use the idle time at the start to drink Stamina Tonics, which lift HP for the remainder of the battle, and to put up status buffs.',
    },
    {
      t: 'loot',
      rows: [
        {
          enemy: 'Paragon',
          hp: '210,000',
          steal: 'Supreme Gem (common), Supreme Gem x2 (rare)',
          drop: 'Dark Matter',
        },
      ],
    },
    {
      t: 'p',
      text: 'A short cutscene follows Paragon’s defeat and leads straight into the next fight. Your party starts it in the condition it ended this one, so mind low HP or MP.',
    },
    { t: 'head', at: ['trema'], title: 'Trema', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Trema has two hard things going for him: heavy damage output and a ridiculous HP pool, 999,999. It is a long fight however strong your attacks are.',
    },
    { t: 'p', text: 'His attacks include:' },
    {
      t: 'ul',
      items: [
        '“Dying Star”: three physical hits on one target',
        '“Falling Leaf”: three weak physical hits on one target, right after Dying Star',
        '“Thundering Wave”: three physical hits on one target, right after Falling Leaf',
        '“Choking Mist”: three attacks plus Poison',
        '“Beguiling Mire”: three hits plus Stop',
        '“Waning Moon”: drains MP',
        'Demi',
        'Flare',
        'Meteor',
        'Ultima',
      ],
    },
    {
      t: 'p',
      text: 'He picks at random, except that Falling Leaf and Thundering Wave always follow a Dying Star. He also casts Meteor at 50% HP and again at 25%, and Ultima once he is under 16%.',
    },
    {
      t: 'p',
      text: 'It is nothing but an onslaught of damage, with no surprises and nothing complicated about the pattern.',
    },
    {
      t: 'p',
      text: 'Have one girl heal the others all the time, use Stamina Tonic to keep everyone’s HP extra high, and use buffs such as Protect and Shell to cut damage.',
    },
    {
      t: 'p',
      text: 'Mostly it is a level and gear check, with a bit of luck involved. If you are struggling, keep levelling your characters.',
    },
    {
      t: 'loot',
      rows: [
        {
          enemy: 'Trema',
          hp: '999,999',
          steal: 'Ether (common), Turbo Ether x2 (rare)',
          drop: 'Dark Matter',
        },
      ],
    },
  ],
};
