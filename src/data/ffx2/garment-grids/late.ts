/**
 * Garment Grids added by Chapter 3-5 (the Farplane build)
 * [ffx2-combat-core §4.3 "Added in Chapter 3-5"].
 */

import type { GarmentGridDef } from './types.ts';

export const lateGarmentGrids: GarmentGridDef[] = [
  {
    id: 'pride-of-the-sword',
    name: 'Pride of the Sword',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Use Swordplay abilities', grantsAbilityIds: ['x2-warrior-power-break'] },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: {
          description: 'STR +15 per gate passed; Swordplay wait down (-40% CT)',
          statBonus: { str: 15 },
          perGatePassed: true,
        },
      },
    ],
    obtained: 'Ch.3, "Protect the Agency" (Macalania).',
    citation: 'ffx2-combat-core.md §1.3, §4.1, §4.3 [verified: 2 sources]',
  },
  {
    id: 'blood-of-the-beast',
    name: 'Blood of the Beast',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Use Instinct abilities', grantsAbilityIds: ['x2-berserker-cripple'] },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: {
          description: 'STR +15 per gate passed; Instinct wait down (-40% CT)',
          statBonus: { str: 15 },
          perGatePassed: true,
        },
      },
    ],
    obtained: 'Ch.3, New Yevon path, Bevelle Limbo (Pacce).',
    citation: 'ffx2-combat-core.md §1.3, §4.1, §4.3 [verified: 2 sources]',
  },
  {
    id: 'chaos-maelstrom',
    name: 'Chaos Maelstrom',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Use Arcana abilities', grantsAbilityIds: ['x2-dark-knight-death'] },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: {
          description: 'MAG +15 per gate passed; Arcana wait down (-40% CT)',
          statBonus: { mag: 15 },
          perGatePassed: true,
        },
      },
    ],
    obtained: 'Ch.3/5, find 13 Squatter monkeys in Kilika woods.',
    citation: 'ffx2-combat-core.md §1.3, §4.1, §4.3 [verified: 2 sources]',
  },
  {
    id: 'black-tabard',
    name: 'Black Tabard',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Use Black Magic abilities', grantsAbilityIds: ['x2-black-mage-firaga'] },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: {
          description: 'MAG +15 per gate passed; Black Magic wait down (-40% CT)',
          statBonus: { mag: 15 },
          perGatePassed: true,
        },
      },
    ],
    obtained: 'Ch.4, complete SM12 (Moonflow).',
    citation: 'ffx2-combat-core.md §1.3, §4.1, §4.3 [verified: 2 sources]',
  },
  {
    id: 'tempered-will',
    name: 'Tempered Will',
    nodeCount: 5,
    gateColours: ['red', 'green'],
    gateEffects: [
      { gates: ['green'], effect: { description: 'Double HP', autoAbilityTags: ['double-hp'] } },
      { gates: ['red'], effect: { description: 'Double MP', autoAbilityTags: ['double-mp'] } },
    ],
    obtained: 'Ch.5, Guadosalam (Tromell, several prerequisites). Recommended default for the finale.',
    citation: 'ffx2-combat-core.md §4.3, §6.6 [verified: 2 sources]',
  },
  {
    id: 'tricks-of-the-trade',
    name: 'Tricks of the Trade',
    nodeCount: 6,
    gateColours: ['red', 'green', 'yellow'],
    gateEffects: [
      { gates: ['red'], effect: { description: 'Black Magic wait down', autoAbilityTags: ['black-magic-wait-down'] } },
      { gates: ['yellow'], effect: { description: 'White Magic wait down', autoAbilityTags: ['white-magic-wait-down'] } },
      { gates: ['green'], effect: { description: 'Arcana wait down', autoAbilityTags: ['arcana-wait-down'] } },
    ],
    obtained: 'Ch.5, Episode Complete for Kilika.',
    citation: 'ffx2-combat-core.md §4.3 [verified: 2 sources]',
  },
  {
    id: 'font-of-power',
    name: 'Font of Power',
    nodeCount: 4,
    gateColours: ['red', 'blue', 'yellow'],
    equip: { description: 'Half MP Cost', autoAbilityTags: ['half-mp-cost'] },
    gateEffects: [
      // Source text reads "MAG +15 on G/Y/B" against a grid whose own header lists only R B Y gates
      // [ffx2-combat-core §4.3] — treated as a transcription slip and corrected to R/Y/B here.
      { gates: ['red'], effect: { description: 'MAG +15', statBonus: { mag: 15 } } },
      { gates: ['yellow'], effect: { description: 'MAG +15', statBonus: { mag: 15 } } },
      { gates: ['blue'], effect: { description: 'MAG +15', statBonus: { mag: 15 } } },
      {
        gates: ['red', 'yellow', 'blue'],
        effect: { description: 'One MP Cost', autoAbilityTags: ['one-mp-cost'] },
      },
    ],
    obtained: 'Ch.5, Fiend Colony dungeon (Mi\'ihen). Makes Ultima/Flare spam sustainable.',
    citation: 'ffx2-combat-core.md §4.3, §7.3 [verified: 2 sources]',
  },
  {
    id: 'flash-of-steel',
    name: 'Flash of Steel',
    nodeCount: 5,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'STR +20, MAG +20', statBonus: { str: 20, mag: 20 } },
    gateEffects: [
      { gates: ['yellow'], effect: { description: 'STR +20', statBonus: { str: 20 } } },
      { gates: ['red'], effect: { description: 'STR +20', statBonus: { str: 20 } } },
      { gates: ['blue'], effect: { description: 'MAG +20', statBonus: { mag: 20 } } },
      { gates: ['green'], effect: { description: 'MAG +20', statBonus: { mag: 20 } } },
    ],
    obtained: 'Ch.5, Argent Inc. at Lv5 publicity. The best pure-offence grid at up to +80/+80.',
    citation: 'ffx2-combat-core.md §4.3, §6.6 [verified: 2 sources]',
  },
  {
    id: 'scourgebane',
    name: 'Scourgebane',
    nodeCount: 5,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    gateEffects: [
      { gates: ['green'], effect: { description: 'Sleepproof + Poisonproof', autoAbilityTags: ['sleepproof', 'poisonproof'] } },
      { gates: ['red'], effect: { description: 'Silenceproof + Darkproof', autoAbilityTags: ['silenceproof', 'darkproof'] } },
      { gates: ['yellow'], effect: { description: 'Confuseproof + Berserkproof', autoAbilityTags: ['confuseproof', 'berserkproof'] } },
      { gates: ['blue'], effect: { description: 'Curseproof + Itchyproof', autoAbilityTags: ['curseproof', 'itchyproof'] } },
    ],
    obtained: 'Ch.5, Episode Complete in Bevelle. The "poor man\'s Ribbon."',
    citation: 'ffx2-combat-core.md §4.3, §6.6 [verified: 2 sources]',
  },
  {
    id: 'disaster-in-bloom',
    name: 'Disaster in Bloom',
    nodeCount: 5,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    gateEffects: [
      { gates: ['green'], effect: { description: 'Sleeptouch', autoAbilityTags: ['sleeptouch'] } },
      { gates: ['red'], effect: { description: 'Silencetouch', autoAbilityTags: ['silencetouch'] } },
      { gates: ['yellow'], effect: { description: 'Darktouch', autoAbilityTags: ['darktouch'] } },
      { gates: ['blue'], effect: { description: 'Poisontouch', autoAbilityTags: ['poisontouch'] } },
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'Stonetouch', autoAbilityTags: ['stonetouch'] },
      },
    ],
    obtained: 'Ch.5, Open Air Inc. at Lv5 publicity.',
    citation: 'ffx2-combat-core.md §4.3 [verified: 2 sources]',
  },
  {
    id: 'immortal-soul',
    name: 'Immortal Soul',
    nodeCount: 4,
    gateColours: ['red', 'green', 'yellow'],
    equip: { description: 'Use Life, Use Cure', grantsAbilityIds: ['x2-white-mage-life', 'x2-white-mage-cure'] },
    gateEffects: [
      { gates: ['green'], effect: { description: 'Use Cura', grantsAbilityIds: ['x2-white-mage-cura'] } },
      { gates: ['yellow'], effect: { description: 'Use Curaga', grantsAbilityIds: ['x2-white-mage-curaga'] } },
      {
        gates: ['red', 'green', 'yellow'],
        effect: { description: 'Use Full-Life', grantsAbilityIds: ['x2-white-mage-full-life'] },
      },
    ],
    obtained: 'Ch.5, defeat Dark Anima.',
    citation: 'ffx2-combat-core.md §4.3 [verified: 2 sources]',
  },
  {
    id: 'conflagration',
    name: 'Conflagration',
    nodeCount: 4,
    gateColours: ['red', 'green', 'blue'],
    equip: { description: 'Use Black Magic abilities', grantsAbilityIds: ['x2-black-mage-firaga'] },
    gateEffects: [
      {
        gates: ['red', 'blue', 'green'],
        effect: { description: 'Use Flare', grantsAbilityIds: ['x2-shared-flare'] },
      },
    ],
    obtained: 'Ch.5, Lian & Ayde chain (Gagazet).',
    citation: 'ffx2-combat-core.md §4.3, §3.6 [verified: 2 sources]',
  },
  {
    id: 'megiddo',
    name: 'Megiddo',
    nodeCount: 5,
    gateColours: ['red', 'green', 'yellow'],
    gateEffects: [
      {
        gates: ['red', 'green', 'yellow'],
        effect: { description: 'Use Ultima', grantsAbilityIds: ['x2-shared-ultima'] },
      },
    ],
    obtained: 'Ch.5, reach the Farplane Abyss via all five temple routes. One of only two routes to Ultima.',
    citation: 'ffx2-combat-core.md §3.6, §3.12, §4.3, §7.3 [verified: 2 sources]',
  },
  {
    id: 'bitter-farewell',
    name: 'Bitter Farewell',
    nodeCount: 5,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Use Death, Use Doom', grantsAbilityIds: ['x2-dark-knight-death', 'x2-dark-knight-doom'] },
    gateEffects: [
      { gates: ['green'], effect: { description: 'Deathproof', autoAbilityTags: ['deathproof'] } },
      { gates: ['green', 'red'], effect: { description: 'Deathtouch', autoAbilityTags: ['deathtouch'] } },
      { gates: ['yellow'], effect: { description: 'Doomproof', autoAbilityTags: ['doomproof'] } },
      { gates: ['yellow', 'blue'], effect: { description: 'Doomtouch', autoAbilityTags: ['doomtouch'] } },
    ],
    obtained: 'Ch.2, Macalania Hypello after the musicians sidequest.',
    citation: 'ffx2-combat-core.md §4.3 [verified: 2 sources]',
  },
  {
    id: 'covenant-of-growth',
    name: 'Covenant of Growth',
    nodeCount: 5,
    gateColours: ['blue', 'yellow'],
    gateEffects: [
      { gates: ['blue'], effect: { description: 'Double AP', autoAbilityTags: ['double-ap'] } },
      { gates: ['yellow'], effect: { description: 'Double EXP', autoAbilityTags: ['double-exp'] } },
    ],
    obtained: 'Ch.5, beat Frailea in the Cactuar Hollow cact-war.',
    citation: 'ffx2-combat-core.md §4.3, §6.7 [verified: 2 sources]',
  },
  {
    id: 'the-end',
    name: 'The End',
    nodeCount: 5,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'Break HP Limit', autoAbilityTags: ['break-hp-limit'] },
    gateEffects: [
      {
        gates: ['green', 'red'],
        effect: { description: 'Break Damage Limit', autoAbilityTags: ['break-damage-limit'] },
      },
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'Use Finale', grantsAbilityIds: ['x2-shared-finale'] },
      },
    ],
    obtained: 'Ch.5, Oversoul every Oversoul-able fiend, then talk to Shinra.',
    citation: 'ffx2-combat-core.md §2.4, §4.3 [verified: 2 sources]',
  },
  {
    // Gate effects added from the game's plate row 44 (re-parity RC9 follow-up D1; FFX2-G09 §4.2 conditions, §4.3 plates 34 to 45 "one ability at every gate"; research/re-ffx2-dressphere.md D10; row 0x602c):
    // Magic +15 on each of the conditions 1 to 4 (ability 0x808b, so it pays per gate crossed) and the White Magic wait-down on condition 100 (every gate crossed, ability 0x8081): the pairs Black Tabard's row
    // pays for Black Magic. The wait-down is its own entry on all four colours, tagged with the existing 'wait-down' auto-ability tag, which the adapter reads as the engine's -40% CT (on every cast of the girl:
    // `atb-engine.ts#castTime`, the engine's documented approximation, the same one Tricks of the Trade's tags get); it is not folded into the per-gate entry as the +15 grids above do in their description,
    // because that entry would switch it on after the first gate. Not added (Rule 6): the row's always-on pair, the White Magic command (0x3024): no ability id of ours is provable from the row.
    id: 'white-signet',
    name: 'White Signet',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'MAG +15 per gate passed', statBonus: { mag: 15 }, perGatePassed: true },
      },
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'White Magic wait down', autoAbilityTags: ['white-magic-wait-down'] },
      },
    ],
    obtained: 'A 6-node SDSP host, included for completeness [ids.ts note].',
    citation:
      'ffx2-combat-core.md §3.15 (SIX_NODE_GRID_IDS) [single source]; gate effects from the game\'s plate row 44, FFX2-G09 §4.2, §4.3 and re-ffx2-dressphere.md D10 [verified: the game\'s own files]',
  },
  {
    // Corrected from the game's plate row 39 and card 39 (follow-up D1; FFX2-G09 §4.1 shape 6 dressphere nodes + 4 gate nodes, §4.3 plates 34 to 45; row 0x6027): 6 nodes (the data said 4); Luck +30 always on
    // (the row's Luck byte) and Luck +30 on each of the conditions 1 to 4 (ability 0x8094, one ability at every gate, so it pays per gate crossed). The four effects the data listed (Luck +30 on red, Dismissal,
    // Butterfingers, Evasion +50; research/ffx2-vegnagun-shuyin.md §6.6) are not in the row and are removed [data fact: the row's eight pairs]. All four gates pay the same, so their colours are labels no number depends on.
    id: 'ray-of-hope',
    name: 'Ray of Hope',
    nodeCount: 6,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'LUCK +30', statBonus: { luck: 30 } },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'LUCK +30 per gate passed', statBonus: { luck: 30 }, perGatePassed: true },
      },
    ],
    obtained: 'Per-gate stat bonus grid; used in the Hero Drink farm [ffx2-vegnagun-shuyin §6.6].',
    citation:
      'ffx2-vegnagun-shuyin.md §6.6 [single source]; nodes, equip and gate effects from the game\'s plate row 39, FFX2-G09 §4.1, §4.3 [verified: the game\'s own files]',
  },
  {
    // Corrected from the game's plate row 35 and card 35 (follow-up D1; FFX2-G09 §4.1 shape 4 + 4, §4.3 plates 34 to 45; row 0x6023): 4 nodes (the data said 5); Magic +10 always on (kept) and Magic +15 on each of
    // the conditions 1 to 4 (ability 0x808b: pays per gate crossed, as Stonehewn's Defense does). The data listed no gate effect. The four colours are labels (all four gates pay the same).
    id: 'seething-cauldron',
    name: 'Seething Cauldron',
    nodeCount: 4,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'MAG +10', statBonus: { mag: 10 } },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'MAG +15 per gate passed', statBonus: { mag: 15 }, perGatePassed: true },
      },
    ],
    obtained: 'Ch.2, Moonflow, "YRP, the Scalpers Three".',
    citation:
      'ffx2-bahamut.md §4.5 [single source]; nodes and gate effects from the game\'s plate row 35, FFX2-G09 §4.1, §4.3 [verified: the game\'s own files]',
  },
  {
    // Corrected from the game's plate row 34 and card 34 (follow-up D1; FFX2-G09 §4.1 shape 4 + 4, §4.3 plates 34 to 45; row 0x6022): 4 nodes (the data said 5); Strength +10 always on (kept) and Strength +15 on each of
    // the conditions 1 to 4 (ability 0x808a: pays per gate crossed). The data listed no gate effect. The four colours are labels (all four gates pay the same).
    id: 'strength-of-one',
    name: 'Strength of One',
    nodeCount: 4,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'STR +10', statBonus: { str: 10 } },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'STR +15 per gate passed', statBonus: { str: 15 }, perGatePassed: true },
      },
    ],
    obtained: 'Calm Lands Ruins chocobo dispatch (random), alongside Mounted Assault.',
    citation:
      'ffx2-bahamut.md §4.5 [single source]; nodes and gate effects from the game\'s plate row 34, FFX2-G09 §4.1, §4.3 [verified: the game\'s own files]',
  },
  {
    // Corrected from the game's plate row 38 and card 38 (follow-up D1; FFX2-G09 §4.1 shape 4 + 4, §4.3 plates 34 to 45; row 0x6026): the always-on effect is Agility +5 (the row's Agility byte; the data said Magic +10)
    // and Agility +5 on each of the conditions 1 to 4 (ability 0x8093: pays per gate crossed). The data listed no gate effect. Nodes (4) were right. The four colours are labels (all four gates pay the same).
    id: 'howling-wind',
    name: 'Howling Wind',
    nodeCount: 4,
    gateColours: ['red', 'green', 'blue', 'yellow'],
    equip: { description: 'AGI +5', statBonus: { agi: 5 } },
    gateEffects: [
      {
        gates: ['red', 'green', 'blue', 'yellow'],
        effect: { description: 'AGI +5 per gate passed', statBonus: { agi: 5 }, perGatePassed: true },
      },
    ],
    obtained: 'Ch.3, uncommon field find.',
    citation:
      'ids.ts [single source]; equip and gate effects from the game\'s plate row 38, FFX2-G09 §4.1, §4.3 [verified: the game\'s own files]',
  },
  {
    // Chapter XIII's sourced kit option only (docs/plans/trema-winnability-method-check.md S2); no
    // shipped build equips it. Equip DEF +20 / MDEF +20; the Yellow and Blue gates DEF +20 each, Red
    // and Green MDEF +20 each: +60 / +60 with all four [verified: 2 sources: ffx2-vegnagun-shuyin
    // §6.6 "Stacks to +60/+60"; FF Wiki *Garment Grid* revid 3998878, Equip and Gates columns]. That
    // table's fifth column ("Moogle Cureja, Defense +30, Magic Defense +30") is headed **Creature
    // Abilities**: what a captured fiend gets, not the girls, so it is not a four-gate bonus (the
    // method check read +90 / +90; corrected here). Node count is not published: 5, like the other
    // DEF/MDEF grids, [estimate]; gates in the order Y, B, R, G round the ring (topology [estimate]).
    id: 'valiant-lustre',
    name: 'Valiant Lustre',
    nodeCount: 5,
    gateColours: ['yellow', 'blue', 'red', 'green'],
    equip: { description: 'DEF +20, MDEF +20', statBonus: { def: 20, mdef: 20 } },
    gateEffects: [
      { gates: ['yellow'], effect: { description: 'DEF +20', statBonus: { def: 20 } } },
      { gates: ['blue'], effect: { description: 'DEF +20', statBonus: { def: 20 } } },
      { gates: ['red'], effect: { description: 'MDEF +20', statBonus: { mdef: 20 } } },
      { gates: ['green'], effect: { description: 'MDEF +20', statBonus: { mdef: 20 } } },
    ],
    obtained: 'Ch.5, Thunder Plains: defeat Humbaba ("A Fallen Genius?").',
    citation: 'ffx2-vegnagun-shuyin.md §6.6 + FF Wiki Garment Grid revid 3998878 [verified: 2 sources]',
  },
];

export default lateGarmentGrids;
