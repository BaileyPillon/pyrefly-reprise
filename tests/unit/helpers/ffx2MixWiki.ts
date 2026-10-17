/**
 * The wiki's Mix algorithm, restated from the repo's research as an INDEPENDENT oracle for the FFX-2 Mix recipe kernel (re-parity RC9, lane X2-G; **FFX-2 only**).
 *
 * `research/ffx2-combat-core.md` section 3.11 gives Mix as a Priority and Type lookup: Step 1 (the smaller Priority number is the primary item; on a tie the first
 * pick is), Step 2 (opposite elements of equal Priority make plain Damage), Step 3 (the blend table: primary Type x secondary Type -> outcome Type), Step 4 (outcome Type x the
 * PRIMARY's Priority -> the result's name), Step 5 (every item's Priority and Type) and Step 6 (the reference implementation). The checked note FFX2-G06 section 8 measured
 * it against the game's own function: it reproduces the game on **4,622 of the 4,624 ordered pairs**; the two it misses are the Hero Drink picked FIRST with the Poison Fang or the
 * Candle of Life (the game has no blend entry for class 17 with class 15, so the tie goes to the first item).
 *
 * This file imports nothing from the kernel, the adapters or the engine: it is the public wiki's rules typed again, so the kernel's tables (read from the exe) are checked
 * against a source that never saw them. It returns the result's NAME; the kernel test derives the name-to-command bijection from the pairs themselves.
 */

/** The wiki's Types. */
export type WikiType =
  | 'Fire' | 'Ice' | 'Lightning' | 'Water' | 'Gravity' | 'Holy' | 'Restorative' | 'Reviving' | 'Curative' | 'Curtain' | 'StarCurtain'
  | 'Haste' | 'Spring' | 'Stamina' | 'Mana' | 'Status' | 'Damage' | 'HeroDrink' | 'DarkMatter' | 'DispelTonic';

/** The game's class number of each wiki Type (FFX2-G06 section 4.2: the Dispel Tonic is class 8 at level 3, Dark Matter class 17 at level 4, the Hero Drink class 17 at level 1). */
export const WIKI_TYPE_CLASS: Readonly<Record<WikiType, number>> = {
  Fire: 0, Ice: 1, Lightning: 2, Water: 3, Gravity: 4, Holy: 5, Restorative: 6, Reviving: 7, Curative: 8, Curtain: 9, StarCurtain: 10,
  Haste: 11, Spring: 12, Stamina: 13, Mana: 14, Status: 15, Damage: 16, HeroDrink: 17, DarkMatter: 17, DispelTonic: 8,
};

export interface WikiItem {
  name: string;
  /** 1 (best) to 4. */
  priority: number;
  type: WikiType;
}

const w = (name: string, priority: number, type: WikiType): WikiItem => ({ name, priority, type });

/**
 * The 68 items in the order of the game's item table (rows 0x2000 to 0x2043), with the wiki's Priority and Type (Step 5). The names by position are the note's own label [I];
 * the wiki lists 67 items, the table has 68 rows, and the row the wiki omits is one of the four Greens rows (all four are Restorative at Priority 3 here).
 */
export const WIKI_ROWS: readonly WikiItem[] = [
  w('Potion', 4, 'Restorative'), w('Hi-Potion', 3, 'Restorative'), w('X-Potion', 2, 'Restorative'), w('Mega-Potion', 2, 'Restorative'),
  w('Ether', 3, 'Restorative'), w('Turbo Ether', 2, 'Restorative'), w('Phoenix Down', 4, 'Reviving'), w('Mega Phoenix', 3, 'Reviving'),
  w('Elixir', 2, 'Restorative'), w('Megalixir', 1, 'Restorative'), w('Antidote', 4, 'Curative'), w('Soft', 4, 'Curative'),
  w('Eye Drops', 4, 'Curative'), w('Echo Screen', 4, 'Curative'), w('Holy Water', 4, 'Holy'), w('Remedy', 3, 'Curative'),
  w('Budget Grenade', 4, 'Damage'), w('Grenade', 3, 'Damage'), w('L-Bomb', 2, 'Damage'), w('S-Bomb', 3, 'Damage'),
  w('M-Bomb', 3, 'Damage'), w('Sleep Grenade', 3, 'Status'), w('Silence Grenade', 3, 'Status'), w('Dark Grenade', 3, 'Status'),
  w('Petrify Grenade', 3, 'Status'), w('Bomb Fragment', 4, 'Fire'), w('Bomb Core', 3, 'Fire'), w('Fire Gem', 2, 'Fire'),
  w('Antarctic Wind', 4, 'Ice'), w('Arctic Wind', 3, 'Ice'), w('Ice Gem', 2, 'Ice'), w('Electro Marble', 4, 'Lightning'),
  w('Lightning Marble', 3, 'Lightning'), w('Lightning Gem', 2, 'Lightning'), w('Fish Scale', 4, 'Water'), w('Dragon Scale', 3, 'Water'),
  w('Water Gem', 2, 'Water'), w('Shadow Gem', 3, 'Gravity'), w('Shining Gem', 2, 'Damage'), w('Blessed Gem', 2, 'Holy'),
  w('Supreme Gem', 1, 'Damage'), w('Poison Fang', 4, 'Status'), w('Silver Hourglass', 3, 'Status'), w('Gold Hourglass', 2, 'Status'),
  w('Candle of Life', 4, 'Status'), w('Farplane Shadow', 3, 'Status'), w('Dark Matter', 1, 'DarkMatter'), w('Chocobo Feather', 3, 'Haste'),
  w('Chocobo Wing', 1, 'Haste'), w('Lunar Curtain', 3, 'Curtain'), w('Light Curtain', 3, 'Curtain'), w('Star Curtain', 3, 'StarCurtain'),
  w('Healing Spring', 2, 'Restorative'), w('Mana Spring', 4, 'Spring'), w('Stamina Spring', 4, 'Spring'), w('Soul Spring', 3, 'Spring'),
  w('Dispel Tonic', 2, 'DispelTonic'), w('Stamina Tablet', 2, 'Stamina'), w('Mana Tablet', 2, 'Mana'), w('Stamina Tonic', 1, 'Stamina'),
  w('Mana Tonic', 1, 'Mana'), w('Twin Stars', 2, 'Gravity'), w('Three Stars', 2, 'Gravity'), w('Hero Drink', 4, 'HeroDrink'),
  w('Gysahl Greens', 3, 'Restorative'), w('Sylkis Greens', 3, 'Restorative'), w('Mimett Greens', 3, 'Restorative'), w('Pahsana Greens', 3, 'Restorative'),
];

/** Step 4: outcome Type x the primary's Priority (1, 2, 3, 4) -> the result's name; null is "unreachable". */
const RESULT: Readonly<Record<string, readonly [string | null, string | null, string | null, string | null]>> = {
  Damage: ['Sunburst', 'Cluster Bomb', 'Potato Masher', 'Pineapple'],
  Fire: ['Burning Soul', 'Burning Soul', 'Firestorm', 'Heat Blaster'],
  Ice: ['Winter Storm', 'Winter Storm', 'Icefall', 'Snow Flurry'],
  Lightning: ['Lightning Bolt', 'Lightning Bolt', 'Rolling Thunder', 'Thunderbolt'],
  Water: ['Tidal Wave', 'Tidal Wave', 'Flash Flood', 'Waterfall'],
  Holy: ['White Hole', 'White Hole', 'Archangel', 'Archangel'],
  Gravity: ['Black Hole', 'Black Hole', 'Nega Burst', 'Nega Burst'],
  'Damage Status': ['Hazardous Shell', 'Hazardous Shell', 'Blaster Mine', 'Blaster Mine'],
  'Fire Status': ['Abaddon Flame', 'Abaddon Flame', 'Brimstone', 'Brimstone'],
  'Ice Status': ['Krysta', 'Krysta', 'Black Ice', 'Black Ice'],
  'Lightning Status': ['Thunderblast', 'Thunderblast', 'Electroshock', 'Electroshock'],
  'Water Status': ['Dark Rain', 'Dark Rain', 'Aqua Toxin', 'Aqua Toxin'],
  'Gravity Status': ['Grand Slam', 'Grand Slam', 'Tallboy', 'Tallboy'],
  Reviving: ['Fantasy Phoenix', 'Final Phoenix', 'Final Phoenix', 'Mega Phoenix'],
  Restorative: ['Final Elixir', 'Ultra Potion', 'Mega-Potion', 'Hi-Potion'],
  Curative: [null, null, 'Panacea', 'Remedy'],
  Absorb: ['Soul Sea', 'Soul Sea', 'Soul Spring', 'Soul Spring'],
  Stamina: ['Mega Cocktail', 'Mega Vitality', null, null],
  Mana: ['Mega Cocktail', 'Mega Mana', null, null],
  Haste: ['Final Wall', null, 'Chocobo Wing', null],
  Wall: [null, null, 'Wall', null],
  'Hi-Wall': [null, null, 'Hi-Wall', null],
  Drink: ['Miracle Drink', null, null, 'Hero Drink'],
  'Ultra Cure': [null, 'Ultra Cure', null, null],
};

const OPPOSITE: Partial<Record<WikiType, WikiType>> = { Fire: 'Ice', Ice: 'Fire', Lightning: 'Water', Water: 'Lightning' };

/** Step 3: the outcome Type of a primary Type and a secondary Type. */
function blend(primary: WikiType, secondary: WikiType): string {
  switch (primary) {
    case 'Restorative': return secondary === 'Reviving' ? 'Reviving' : 'Restorative';
    case 'Reviving': return 'Reviving';
    case 'Curative': return 'Curative';
    case 'Damage': return 'Damage';
    case 'Fire':
    case 'Ice':
    case 'Lightning':
    case 'Water':
      if (secondary === 'Holy') return 'Holy';
      if (secondary === 'Status') return `${primary} Status`;
      if (OPPOSITE[primary] === secondary) return 'Damage';
      return primary;
    case 'Holy': return 'Holy';
    case 'Gravity':
      if (secondary === 'Holy') return 'Holy';
      return secondary === 'Status' ? 'Gravity Status' : 'Gravity';
    case 'Status':
      if (secondary === 'Fire' || secondary === 'Ice' || secondary === 'Lightning' || secondary === 'Water' || secondary === 'Gravity') return `${secondary} Status`;
      return 'Damage Status';
    case 'Stamina':
      if (secondary === 'Status') return 'Damage Status';
      return secondary === 'Mana' ? 'Absorb' : 'Stamina';
    case 'Mana':
      if (secondary === 'Status') return 'Damage Status';
      return secondary === 'Stamina' ? 'Absorb' : 'Mana';
    case 'Haste': return secondary === 'Status' ? 'Damage Status' : 'Haste';
    case 'Curtain': return secondary === 'Status' ? 'Damage Status' : 'Wall';
    case 'StarCurtain': return secondary === 'Status' ? 'Damage Status' : 'Hi-Wall';
    case 'Spring': return secondary === 'Status' ? 'Damage Status' : 'Absorb';
    case 'HeroDrink': return secondary === 'Status' ? 'Damage Status' : 'Drink';
    case 'DispelTonic': return 'Ultra Cure';
    case 'DarkMatter': return 'Drink';
  }
}

/**
 * The wiki's result for picking item row `first`, then item row `second` (Steps 1 to 4 and the reference implementation of Step 6): the result's name, or null when the wiki's
 * table has a blank for that outcome and Priority.
 */
export function wikiMix(first: number, second: number): string | null {
  const a = WIKI_ROWS[first] as WikiItem;
  const b = WIKI_ROWS[second] as WikiItem;
  let primary = a;
  let secondary = b;
  if (b.priority < a.priority) {
    primary = b;
    secondary = a;
  }
  // Step 2 as the reference implementation has it: opposite elements of EQUAL Priority cancel into plain Damage at that Priority.
  if (a.priority === b.priority && OPPOSITE[a.type] === b.type) return (RESULT['Damage'] as readonly (string | null)[])[a.priority - 1] ?? null;
  const outcome = blend(primary.type, secondary.type);
  return (RESULT[outcome] as readonly (string | null)[])[primary.priority - 1] ?? null;
}

/** The wiki against a recipe function over every ordered pair of the 68 items (the function takes item ids, 0x2000 + row). */
export interface WikiAgreement {
  /** The command id each wiki result name stands for: the command most pairs with that name make. */
  names: Map<number, string>;
  /** The ordered pairs where the function does not make the command the wiki's name stands for. */
  exceptions: Array<{ first: number; second: number; wiki: string; game: number }>;
  /** Pairs where the wiki's table has a blank cell (it says these are unreachable). */
  blanks: number;
  pairs: number;
}

export function wikiAgreement(recipe: (first: number, second: number) => number): WikiAgreement {
  const votes = new Map<string, Map<number, number>>();
  const all: Array<{ first: number; second: number; wiki: string; game: number }> = [];
  let blanks = 0;
  for (let i = 0; i < WIKI_ROWS.length; i++) {
    for (let j = 0; j < WIKI_ROWS.length; j++) {
      const wiki = wikiMix(i, j);
      if (wiki === null) { blanks++; continue; }
      const game = recipe(0x2000 + i, 0x2000 + j);
      all.push({ first: i, second: j, wiki, game });
      const per = votes.get(wiki) ?? new Map<number, number>();
      per.set(game, (per.get(game) ?? 0) + 1);
      votes.set(wiki, per);
    }
  }
  const canonical = new Map<string, number>();
  for (const [name, per] of votes) {
    let best = -1;
    let bestCount = -1;
    for (const [command, count] of per) if (count > bestCount) { best = command; bestCount = count; }
    canonical.set(name, best);
  }
  const names = new Map<number, string>();
  for (const [name, command] of canonical) names.set(command, name);
  const exceptions = all.filter((p) => canonical.get(p.wiki) !== p.game);
  return { names, exceptions, blanks, pairs: all.length };
}
