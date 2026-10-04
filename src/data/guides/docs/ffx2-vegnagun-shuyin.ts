/**
 * Chapter 5, the Vegnagun chain and Shuyin (Heart of the Farplane): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide's five boss pages
 * (Tail, Leg and Nodes, Core and Bulwarks, Head and Redoubts, Shuyin) in our own words and in their
 * order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx2.md` section 3 holds the
 * pages and every difference. Enemy, HP, Steal and Drop are the numbers this game uses, and so is
 * Nemo Ante Mortem Beatus's damage (the page's observed 700 to 1,500 is a buffed spread; the game's
 * own figure is printed). The page's claim that Protect halves Noli Me Tangere is left out: in this
 * game Noli is a fixed hit that no buff touches (`research/ffx2-vegnagun-shuyin.md` section 3.1).
 * The Nodes' row is this game's too: 300,000 HP and the common Megalixir (the page's rare Hero Drink slot
 * has no rate in our data and is not awarded, `src/data/ffx2/enemies/vegnagun-leg.ts`).
 *
 * The panel opens on the page for the link on the field.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_VEGNAGUN_SHUYIN_DOC: GuideDoc = {
  id: 'ffx2-vegnagun-shuyin',
  game: 'ffx2',
  bossIds: ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin'],
  blocks: [
    {
      t: 'p',
      text: 'Climbing Vegnagun is easy; you barely need a map to reach each fight in order. The Tail comes first and needs no preparation.',
    },
    { t: 'head', at: ['vegnagun-tail'], title: 'Vegnagun (Tail)', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'As said above, there is not much to prepare, and little strategy is needed. The Tail serves as a gateway and a check on your gear and levels for the battles ahead.',
    },
    {
      t: 'p',
      text: 'If its attacks are too much for you to survive, reload an earlier save and level up a little first.',
    },
    { t: 'p', text: 'It has just two attacks:' },
    {
      t: 'ul',
      items: [
        '“Tail Beam,” its ordinary attack, takes 31.25% of the target’s maximum HP',
        '“Noli Me Tangere” does 1,250 damage to everyone',
      ],
    },
    {
      t: 'p',
      text: 'The Tail idles on its first turn, then opens with Noli Me Tangere and uses it once more below 25% HP. Survive those two and the fight is easy.',
    },
    {
      t: 'p',
      text: 'Dark Knight dresspheres help: many Tail attacks take a percentage of HP, but a bigger HP pool gives whoever heals (White Mage or Alchemist) longer to respond.',
    },
    { t: 'p', text: 'Dark Knights also hit hard with ordinary attacks and with Darkness.' },
    {
      t: 'loot',
      rows: [
        {
          enemy: 'Vegnagun (Tail)',
          hp: '34,200',
          steal: 'X-Potion x4 (common), X-Potion x6 (rare)',
          drop: 'Megalixir',
        },
      ],
    },
    {
      t: 'p',
      text: 'Carry on up the path toward Vegnagun. Before the top, protect the party against Berserk with accessories such as Ribbons.',
    },
    {
      t: 'p',
      text: 'Elemental affinity accessories (Tetra Guard, Tetra Bracelet, Tetra Band) also cut incoming damage. Ahead, the Leblanc Syndicate is already fighting Vegnagun’s Leg and its “nodes”.',
    },
    { t: 'head', at: ['vegnagun-leg'], title: 'Vegnagun (Leg) and Node A/B/C', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Four targets here: the Leg, your main target, and three Nodes high up on the body. The Leg’s attacks:',
    },
    {
      t: 'ul',
      items: [
        '“Vita Brevis”: damage to every party member and a long delay on their next turns',
        '“Break”: Petrification',
        '“Berserk”: Berserk',
        '“Slow”: Slow',
        '“Absorb”: steals HP and MP from a target',
      ],
    },
    {
      t: 'p',
      text: 'Now the Nodes (A, B and C). What a Node does depends on its colour, and it cycles through three colours in order as it acts or gets hit:',
    },
    { t: 'lead', text: 'Red:' },
    {
      t: 'ul',
      items: ['“Missile” hits one target twice', '“Dies Irae” strikes all three girls at random, up to 9 hits'],
    },
    { t: 'lead', text: 'Green:' },
    { t: 'ul', items: ['Cura, Regen, Shell or Protect on the Leg'] },
    { t: 'lead', text: 'Yellow:' },
    { t: 'ul', items: ['Firaga, Blizzaga, Thundaga or Waterga on all targets', 'Flare on one target'] },
    {
      t: 'p',
      text: 'Hitting the Nodes will not switch them off; it only changes their colour, and none is a good one for you: they either damage the party or heal the Leg. Put your effort into taking the Leg down fast.',
    },
    {
      t: 'p',
      text: 'Protect and Shell on the party reduce damage, and a Dispel Tonic on the Leg clears the buffs a Green Node gives it.',
    },
    {
      t: 'p',
      text: 'The Nodes have far too much HP to kill. This is a war of attrition: can you out-damage the Leg before four enemies’ damage overwhelms you?',
    },
    {
      t: 'loot',
      rows: [
        {
          enemy: 'Vegnagun (Leg)',
          hp: '18,220',
          steal: 'Elixir (common), Elixir x2 (rare)',
          drop: 'Mythril Bangle',
        },
        {
          enemy: 'Node A/B/C',
          hp: '300,000',
          steal: 'Megalixir (common), Megalixir x2 (rare)',
          drop: 'Megalixir (common)',
        },
      ],
    },
    {
      t: 'p',
      text: 'Keep climbing toward Ormi and Logos. Before the next fight, guard against Petrification and Poison. Past them you join Nooj, Gippal and Leblanc, who are already fighting Vegnagun’s Core.',
    },
    { t: 'head', at: ['vegnagun-body'], title: 'Vegnagun (Core) and Left/Right Bulwarks', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Jecht’s voice explains the mechanic soon after the fight starts. The Bulwarks react to an attack on the Core depending on how it was made. Their replies:',
    },
    {
      t: 'table',
      head: ['Your Attack Type', 'Bulwark Response'],
      rows: [
        ['Physical', 'Damage worth 31.25% of a character’s maximum HP'],
        ['Magical', 'A drain of 18.75% of a character’s maximum MP'],
        ['Special', 'Both at once: 18.75% of maximum HP in damage, plus 18.75% of maximum MP drained'],
      ],
    },
    { t: 'lead', text: 'Core:' },
    {
      t: 'ul',
      items: [
        '“Charge Core”: three charges must pass before “Memento Mori” becomes available',
        '“Memento Mori”: heavy magic damage to the whole party',
        'Full Life, used whenever a Bulwark has been KO’d',
      ],
    },
    { t: 'lead', text: 'Bulwark Retaliation Attacks:' },
    {
      t: 'p',
      text: 'Those are the Bulwarks’ answers to attacks. They also act on their own turns:',
    },
    { t: 'p', text: 'The Left Bulwark casts harmful spells at your party:' },
    { t: 'ul', items: ['Break', 'Bio', 'Doom', 'Dispel'] },
    { t: 'p', text: 'The Right Bulwark buffs itself and its two allies, the Left Bulwark and the Core:' },
    { t: 'ul', items: ['Regen', 'Shell', 'Protect'] },
    {
      t: 'p',
      text: 'The easiest way to beat the Core is to take out both Bulwarks first and keep them down most of the fight. They have only 3,000 HP each, and multi-target attacks such as a Dark Knight’s Darkness make it easier.',
    },
    {
      t: 'p',
      text: 'Protect or Shell on the party is pointless, since the Left Bulwark’s Dispel strips them, but a Warrior’s Armor Break on the Core raises the damage it takes over the fight.',
    },
    { t: 'p', text: 'Memento Mori is the toughest attack. Ideally it never gets used.' },
    {
      t: 'p',
      text: 'If it does, switch to a White Mage and have her quickly cast Shell on the party, to improve your odds against the heavy magic damage (assuming it is not dispelled first).',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Vegnagun (Core)', hp: '33,040', steal: 'Turbo Ether', drop: 'Megalixir' },
        {
          enemy: 'Left Bulwark',
          hp: '3,000',
          steal: 'Phoenix Down (common), L-Bomb (rare)',
          drop: 'Mega-Potion (common), X-Potion (rare)',
        },
        {
          enemy: 'Right Bulwark',
          hp: '3,000',
          steal: 'Phoenix Down (common), L-Bomb (rare)',
          drop: 'Mega-Potion (common), X-Potion (rare)',
        },
      ],
    },
    { t: 'head', at: ['vegnagun-head'], title: 'Vegnagun (Head) and Right/Left Redoubts', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'A hidden timer runs this fight: once Shuyin has spoken seven times, the cannon goes off and the fight ends in a Game Over.',
    },
    {
      t: 'p',
      text: 'There is plenty of time even for low-level characters, so the timer rarely matters.',
    },
    { t: 'p', text: 'Here is what each of the three targets can do:' },
    { t: 'lead', text: 'Head:' },
    {
      t: 'ul',
      items: [
        '“Pallida Mors”: about 1,200 magic damage to one target, used only while the Head cannot be targeted',
        '“Nemo Ante Mortem Beatus”: roughly 1,490 to 1,685 magic damage',
        '“Mors Certa”: 250 magic damage plus Silence, Darkness and Poison',
        '“Odi Et Amo”: 16 hits spread across the party, about 1,000 in all, and it can strip buffs such as Shell, Protect, Reflect, Regen, Haste and stat boosts',
        '“Acta Est Fabula”: fully revives both Redoubts',
      ],
    },
    { t: 'lead', text: 'Right Redoubt:' },
    {
      t: 'ul',
      items: [
        '“Lacrimosa”: about 100 physical damage to one target',
        '“Blind”: inflicts Darkness',
        '“Break”: inflicts Petrification',
        '“Flare”: magic damage to one target',
      ],
    },
    { t: 'lead', text: 'Left Redoubt:' },
    {
      t: 'ul',
      items: [
        '“Lacrimosa”: drains one target’s MP',
        '“Slow”: inflicts Slow',
        '“Dispel”: removes buffs from the target',
        '“Demi”: takes 25% of each target’s current HP',
      ],
    },
    {
      t: 'p',
      text: 'Two phases. In the first, the Head cannot be attacked until both Redoubts are down (do not let one revive the other).',
    },
    {
      t: 'p',
      text: 'The second phase starts when you first KO both: the Head uses Acta Est Fabula to bring them back, and from then on it can be targeted.',
    },
    {
      t: 'p',
      text: 'In phase two, use attacks that hit every target, like a Dark Knight’s Darkness, since it pierces physical and magic defense alike. If you KO a Redoubt, the Head spends its turns reviving it instead of attacking.',
    },
    {
      t: 'p',
      text: 'The Head/Shuyin uses Nemo Ante Mortem Beatus, its strongest attack, four times, at 80%, 60%, 40% and 20% HP. Be ready to recover by keeping everyone above 1,500 HP, and keep a White Mage or Alchemist on hand.',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Vegnagun (Head)', hp: '38,420', steal: 'Megalixir', drop: 'None' },
        {
          enemy: 'Right Redoubt',
          hp: '2,500',
          steal: 'Phoenix Down (common), Mega Phoenix (rare)',
          drop: 'None',
        },
        {
          enemy: 'Left Redoubt',
          hp: '2,500',
          steal: 'Phoenix Down (common), Mega Phoenix (rare)',
          drop: 'None',
        },
      ],
    },
    { t: 'head', at: ['shuyin'], title: 'Shuyin', tag: 'Final Boss Battle' },
    {
      t: 'p',
      text: 'The last fight of the game is more spectacle than strategy. His attacks look great and hit hard, and the job is to ride out the big ones while whittling his HP.',
    },
    { t: 'p', text: 'His moves, many of them lifted from Tidus’s attacks in Final Fantasy X:' },
    {
      t: 'ul',
      items: ['Normal attack', '“Spinning Cut”', '“Run & Slash”', '“Terror of Zanarkand”', '“Force Rain”'],
    },
    { t: 'p', text: 'It is worth watching every one of them before you finish the fight.' },
    {
      t: 'loot',
      rows: [{ enemy: 'Shuyin', hp: '23,850', steal: 'Hero Drink', drop: 'None' }],
    },
  ],
};
