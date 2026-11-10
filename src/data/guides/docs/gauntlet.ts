/**
 * The hidden Gauntlet chapter (the Monster Arena's nine creations in the Calm Lands): the guide's pages for these nine fights, one page each in play order.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. **The strategy follows Jegged's Monster Arena pages** (Original creations: Earth Eater and the Ultima Buster; the area creations' pages), in our own words, and it is the line `docs/handoff/ch-gauntlet.md` plays on the
 * real engine (the bench: the nine-act chain 200 of 200). Where a written page and the file differ the file wins (`research/re-ffx-monster-arena-creations.md` sections 3 and 6): the Ultima Buster's Arms grow back, the
 * Head can cancel its own Contamination, and Earth Eater's two turns lying down are best spent striking it, not waiting. Every figure is the game's own (the HP, the Steal and the Drops are the records' and the pages print
 * what the chapter pays).
 *
 * **Not modelled, so not promised:** the arena's capture counts and its stacked first-win prizes (this build pays the file's drops only), the gear each creation drops, and Neslug's death scene.
 */

import type { GuideDoc } from '../doc-types.ts';

export const GAUNTLET_DOC: GuideDoc = {
  id: 'gauntlet',
  game: 'ffx',
  bossIds: ['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster'],
  blocks: [
    // --- 1 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['cactuar-king'], title: 'Cactuar King', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '100,000' },
    {
      t: 'p',
      text: "The arena's smallest creation and the one that kills fastest. Fire, ice, lightning, water and holy do nothing to it, and most of its turns are Needles that kill.",
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'Most turns it throws Needles at one of you, 99,999 or 10,000, and either kills. Some turns it rests, and the third rest makes it run away: the act then starts again.',
    },
    { t: 'p', text: 'Every blow it feels is answered with another 10,000 Needles. Fewer, larger blows draw fewer.' },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Send an aeon in first. The Needles fall on whoever stands in the front line, and with an aeon out that is the aeon alone.',
        'Strike with the aeon, and use its Overdrive when the gauge is full: one hit event, one answer.',
        'Stand up whoever falls with a Phoenix Down.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Chocobo Wing x2 (common)', 'Designer Wallet (rare)'] },
    { t: 'list', label: 'Drops', items: ['Blessed Gem x3 (common)', 'Dark Matter (rare)'] },

    // --- 2 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['don-tonberry'], title: 'Don Tonberry', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '480,000' },
    {
      t: 'p',
      text: 'A king among Tonberries, with a lantern and a knife. It walks in over four steps, and anyone who strikes it on the way pays for it.',
    },
    { t: 'h3', text: 'Karma' },
    {
      t: 'p',
      text: 'While it walks in, a blow draws Karma on the one who struck: every foe that member has killed, times a hundred. On this party that is always a death. The first blow after each step is free.',
    },
    {
      t: 'p',
      text: 'With an aeon out it casts Voodoo from its first turn instead. Once it has arrived it counters nothing and only attacks.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Guard until the fourth step is done, then strike. After that it counters nothing.',
        'An aeon in the front line is the other answer: it takes Voodoo in your place.',
        'Stand up whoever Karma takes with a Phoenix Down.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Candle of Life x2 (common)', 'Designer Wallet (rare)'] },
    { t: 'list', label: 'Drops', items: ['Farplane Wind x3 (common)', 'Dark Matter (rare)'] },

    // --- 3 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['jormungand'], title: 'Jormungand', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '520,000' },
    {
      t: 'p',
      text: 'A great serpent. Its Cold Stare turns one of you to stone, and its next Attack shatters the stone. It takes no ailment but a Break or Slow.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'With nobody petrified it picks Attack, Cold Stare or Space-Time Vorpal at random. If one of you is stone, it Attacks that one. With an aeon out it only attacks and stares.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Strike at once. About six capped blows empty it, which is before its turn comes on this party.',
        'Wear Ribbon or carry a Soft against the stare.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Petrify Grenade x4 (common)', 'Three Stars (rare)'] },
    { t: 'list', label: 'Drops', items: ['Supreme Gem x2 (common)', 'Dark Matter (rare)'] },

    // --- 4 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['earth-eater'], title: 'Earth Eater', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,300,000' },
    {
      t: 'p',
      text: 'A heavy brute in armour that divides plain blows by three. It begins with Reflect on, and it falls over once it has taken enough.',
    },
    { t: 'h3', text: 'Standing' },
    {
      t: 'p',
      text: 'Each turn it either Attacks or throws two Megaton Punches. Every blow it feels while it stands is answered with one more Megaton Punch, which kills outright.',
    },
    { t: 'h3', text: 'Lying down' },
    {
      t: 'p',
      text: 'Once what it has taken adds up past 100,000 it falls, its armour off, and gets up on its third turn. Each blow it takes lying is answered by a Flare it casts at itself; its Reflect throws that onto one of you.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Let Auron strike alone while it stands. His Piercing weapon ignores the armour, and fewer blows draw fewer punches.',
        'When it falls, everyone strikes: the armour is off, and the Flare it throws back is small beside the blows.',
        'Keep Phoenix Downs for the punch.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Lv. 1 Key Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Fortune Sphere (common)', 'Dark Matter (rare)'] },

    // --- 5 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['greater-sphere'], title: 'Greater Sphere', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,500,000' },
    {
      t: 'p',
      text: "Spherimorph's puzzle at a larger scale. It starts weak to one of fire, ice, lightning and water, and it absorbs the other three and holy.",
    },
    { t: 'h3', text: 'What it answers' },
    {
      t: 'p',
      text: 'A plain blow draws an Ultima on all of you. An Overdrive draws a Hydraulic Press, which kills whoever is already wounded. The spell it is weak to shifts it into another element.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Strike with plain blows. The Ultima it answers with is small on this party.',
        'Spend no Overdrive on it. The gauges carry from act to act, so a full one is a trap here.',
        'Keep everyone healed: a Press finishes the wounded.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Return Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Luck Sphere (common)', 'Dark Matter (rare)'] },

    // --- 6 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['catastrophe'], title: 'Catastrophe', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '2,200,000' },
    {
      t: 'p',
      text: 'A vast thorned monster in armour. It rests one turn and clouds the air the next, and once it is hurt past a fifth it changes.',
    },
    { t: 'h3', text: 'Its change' },
    {
      t: 'p',
      text: 'Below four fifths of its health the armour comes off and it grows faster. It then cycles Toxic Spray on the one with the most health, Demi on all of you, and Hundred Thorns on all of you.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        "Strike first with Auron's Piercing weapon: the armour divides every other plain blow until it changes.",
        'After the change plain blows take it whole. Heal after a Demi.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Lv. 2 Key Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Designer Wallet (common)', 'Dark Matter (rare)'] },

    // --- 7 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['thuban'], title: "Th'uban", tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '3,000,000' },
    {
      t: 'p',
      text: "A robed giant crowned in rainbow light. It wears the Sanctuary Keeper's shape and none of its tricks: no heal, no Reflect, no sweep.",
    },
    { t: 'h3', text: 'Its round' },
    {
      t: 'p',
      text: 'Four turns: an Attack on the one with the most health, Rainbow on all of you, a buff on itself, then Convergence on one of you. Convergence kills, and Shell does not save its target.',
    },
    {
      t: 'p',
      text: 'Every wound it takes is answered by a Condemn on all of you, which strips the buffs you hold. Slow it, and it hastes itself.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Hit hard and early. About thirty-one blows empty it, and it is slow.',
        'Keep Phoenix Downs for the one Convergence takes, and recast the buffs Condemn strips.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Teleport Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ["Underdog's Secret (common)", 'Dark Matter (rare)'] },

    // --- 8 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['neslug'], title: 'Neslug', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '4,000,000' },
    {
      t: 'p',
      text: 'A bulky slug that hides in a shell. Above half it attacks the one with the most MP, throws a Megaton, or slimes all of you. Slime breaks your Magic Defense, and a second one hits very hard.',
    },
    { t: 'h3', text: 'The shell' },
    {
      t: 'p',
      text: 'Below half it hides: physical blows do nothing, it regenerates, and it casts Curaga on itself until it is above three quarters. Below a quarter the shell breaks and it speeds up.',
    },
    { t: 'p', text: 'Magic and Overdrives go through the shell. Nothing in the menus of Tidus, Yuna and Auron is magic, so the party needs Lulu.' },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        "Switch Lulu in at the start and cast Doublecast every turn: two spells in one action, and the shell does not stop magic.",
        'Keep everyone healed. The shell stops steel and nothing else.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Friend Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Pendulum (common)', 'Dark Matter (rare)'] },

    // --- 9 ------------------------------------------------------------------------------------------------------------------------------------------------------------
    { t: 'head', at: ['ultima-buster'], title: 'Ultima Buster', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '5,000,000' },
    {
      t: 'p',
      text: 'A towering machine with a Head and two Arms of its own. It casts Ultima on three of its turns in four, and the Arms stand between you and its body.',
    },
    { t: 'h3', text: 'The Arms' },
    {
      t: 'p',
      text: 'While an Arm lives, a physical blow at the body barely scratches it. Spells and Overdrives are not touched. Each Arm falls in a couple of blows, and they grow back on the body\'s third or fourth turn after both are down.',
    },
    { t: 'h3', text: 'The Head' },
    {
      t: 'p',
      text: 'The Head runs a three-turn round: the body Attacks, the Head shakes, the body casts Contamination (Zombie, Poison, Confuse and Slow). A damaging blow on the Head while it shakes sets the round back.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        "Switch Lulu in at the start: her spells ignore the Arms.",
        'Anyone who still strikes hits an Arm first, and the body only when both are down.',
        'Keep everyone healed: Ultima falls on all three of you.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit (common)", 'Lv. 3 Key Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Winning Formula (common)', 'Dark Matter (rare)'] },
  ],
};

export default GAUNTLET_DOC;
