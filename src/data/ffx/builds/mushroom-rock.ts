/**
 * Party build — **Mushroom Rock Road, the Ridge** (the hidden Sinspawn Gui chapter; FFX only; `research/re-ffx-ai-gui.md` "RE §n", `research/ffx-sinspawn-gui.md` §6).
 *
 * The party is Tidus, Yuna, Auron, Kimahri, Wakka and Lulu: **Rikku is not in the party yet** (Operation Mi'ihen's guardians are those six; research §6.1 `[verified: 2 sources]`), and the aeons are
 * **Valefor and Ifrit** (Ixion comes at Djose, after). Link 1 opens on a line-up of ours with Switch open; link 2's formation forces Yuna, Seymour and Auron and closes the bench
 * (`data/ffx/enemies/sinspawn-gui.ts`, `EnemyGroupDef.lineUp`), so Seymour is NOT in this build: he joins the roster at that link and no earlier screen shows him.
 *
 * ## Where the numbers come from: no source gives them, so one stated method, `[estimate]`
 *
 * **No source gives the party's stats, Sphere Grid state or gear at the Ridge** (RE §11 item 9: "player data, not in the files"; research §6.3, Q-14). The two ends are known:
 *
 * - **the start of the game**, the game's own base record of each character (the party table, `ply_save.bin` rows 0 to 5, read by the reverse-engineering lane; HP, MP, Strength, Defense, Magic,
 *   Magic Defense, Agility, Luck, Evasion, Accuracy), `[game table]`;
 * - **Macalania**, the repo's own preset two story areas later (`./macalania.ts`, a published range's midpoint), `[estimate]`.
 *
 * The Ridge is in between, so **every stat is the midpoint of the two**, rounded down, the same "midpoint of the range" rule the Macalania and Highbridge presets state. It is a middle
 * guess, not a measurement, and the chapter says so; the human-pace bench (`tests/unit/chapters/sinspawn-gui-bench.test.ts`) measures what it makes of the fight, and **the boss is never tuned**:
 * if the party estimate has to move, it moves inside this range. Sphere Level is the same midpoint of the start row's used levels and Macalania's 18.
 *
 * **Kits** carry only what the cited guides name for this fight (Jegged, research §13) and the start commands: Tidus Cheer and Haste, Lulu the four tier-one spells and Focus (the answers to the head), Yuna Cure
 * and Esuna (Venom's Poison), Kimahri Lancet (reaches the head), Wakka's weapon (reaches the head), Auron and Kimahri's **Piercing weapons** (the game's weapon records carry Piercing for both: the arms'
 * answer, RE §3.3). Everything else Macalania teaches is not here yet. **Items** are half of Macalania's counts, for the items sold by now. All `[estimate]`.
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild, InventoryEntry, StatBlock } from '../../../battle/common/types.ts';
import { macalaniaBuild } from './macalania.ts';

/** The ten Sphere Grid stats (everything in a `StatBlock` but the two ceilings). */
type Grid = Pick<StatBlock, 'hp' | 'mp' | 'str' | 'def' | 'mag' | 'mdef' | 'agi' | 'luck' | 'eva' | 'acc'>;
const GRID: readonly (keyof Grid)[] = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'];

/** The game's start-of-game base record, party table rows 0 to 5 (`[game table]`: `ply_save.bin`; RE note's reader `plysave.mjs`). */
export const START_RECORDS: Readonly<Record<string, Grid & { slvUsed: number }>> = {
  tidus: { hp: 520, mp: 12, str: 15, def: 10, mag: 5, mdef: 5, agi: 10, luck: 18, eva: 10, acc: 10, slvUsed: 0 },
  yuna: { hp: 475, mp: 84, str: 5, def: 5, mag: 20, mdef: 20, agi: 10, luck: 17, eva: 30, acc: 3, slvUsed: 2 },
  auron: { hp: 1030, mp: 33, str: 20, def: 15, mag: 5, mdef: 5, agi: 5, luck: 17, eva: 5, acc: 3, slvUsed: 12 },
  kimahri: { hp: 644, mp: 78, str: 16, def: 15, mag: 17, mdef: 5, agi: 6, luck: 18, eva: 5, acc: 5, slvUsed: 6 },
  wakka: { hp: 618, mp: 10, str: 14, def: 10, mag: 10, mdef: 5, agi: 7, luck: 19, eva: 5, acc: 25, slvUsed: 2 },
  lulu: { hp: 380, mp: 92, str: 5, def: 8, mag: 20, mdef: 30, agi: 5, luck: 17, eva: 40, acc: 3, slvUsed: 2 },
};

const midpoint = (a: number, b: number): number => Math.floor((a + b) / 2);

/** Macalania's member, with its stats pulled to the midpoint between the game's start record and Macalania's own. The kit, gear and gauge are set by the caller. */
function atTheRidge(id: keyof typeof START_RECORDS, kit: { learned: string[]; weapon: FFXMemberBuild['equipment']['weapon']; overdrive: string[] }): FFXMemberBuild {
  const high = macalaniaBuild.members.find((m) => m.id === id);
  const start = START_RECORDS[id];
  if (!high || !start) throw new Error(`mushroom-rock: ${id} missing from a source record`);
  const grid = Object.fromEntries(GRID.map((k) => [k, midpoint(start[k], high.stats[k])])) as Grid;
  const stats: StatBlock = { ...grid, maxHp: grid.hp, maxMp: grid.mp };
  return {
    id: high.id,
    name: high.name,
    spriteKey: high.spriteKey,
    portraitKey: high.portraitKey,
    stats,
    hp: stats.maxHp,
    mp: stats.maxMp,
    learnedAbilityIds: kit.learned,
    equipment: { weapon: kit.weapon, armor: { name: 'Armguard', slots: 1, autoAbilities: [] } },
    overdrive: { gauge: 20, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: kit.overdrive }, // gauge [estimate]: a fifth, neither empty nor ready
    sphereGrid: { position: `${id}-sphere-ridge`, activatedNodeIds: [], sLv: midpoint(start.slvUsed, 18), ap: 0, spheres: {} },
  };
}

const weapon = (name: string, abilities: FFXMemberBuild['equipment']['weapon']['autoAbilities'] = []): FFXMemberBuild['equipment']['weapon'] => ({ name, slots: 1, autoAbilities: abilities, bonusCrit: 3 });

function members(): FFXMemberBuild[] {
  return [
    atTheRidge('tidus', { learned: ['cheer', 'haste'], weapon: weapon('Sword'), overdrive: ['spiral-cut'] }), // Jegged: Tidus's Haste on everyone, Cheer early
    atTheRidge('yuna', { learned: ['cure', 'esuna'], weapon: weapon('Rod'), overdrive: ['grand-summon'] }), // Jegged: swap Yuna in to heal; Esuna answers Venom's Poison
    atTheRidge('auron', { learned: ['power-break', 'armor-break'], weapon: weapon('Katana', ['piercing']), overdrive: ['dragon-fang'] }), // Piercing: the weapon record's (RE §3.3); Armor Break lands on the arms (RE §3.2)
    atTheRidge('kimahri', { learned: ['lancet'], weapon: weapon('Spear', ['piercing', 'sensor']), overdrive: [] }), // the spear's two abilities are its record's; Lancet reaches the head
    atTheRidge('wakka', { learned: ['dark-attack'], weapon: weapon('Blitzball'), overdrive: ['element-reels'] }), // Wakka's weapon reaches the head (`rangedWeapon`, applied at setup)
    atTheRidge('lulu', { learned: ['fire', 'blizzard', 'thunder', 'water', 'focus', 'scan'], weapon: weapon('Doll'), overdrive: ['fury'] }), // Jegged: Lulu's spells; they reach the head
  ];
}

/** An aeon of Macalania's, its Sphere-Grid-driven stats scaled by Yuna's own midpoint-over-Macalania ratio (the game derives an aeon's stats from its summoner's). `[estimate]` */
function aeonAtTheRidge(source: AeonBuild, ratio: number): AeonBuild {
  const scaled = (n: number): number => Math.max(1, Math.floor(n * ratio));
  const stats: StatBlock = {
    ...source.stats,
    hp: scaled(source.stats.hp),
    mp: scaled(source.stats.mp),
    str: scaled(source.stats.str),
    def: scaled(source.stats.def),
    mag: scaled(source.stats.mag),
    mdef: scaled(source.stats.mdef),
    maxHp: scaled(source.stats.maxHp),
    maxMp: scaled(source.stats.maxMp),
  };
  return { ...structuredClone(source), stats, hp: stats.maxHp, mp: stats.maxMp, overdriveGauge: 0 };
}

function aeons(yunaAtRidgeHp: number, yunaAtMacalaniaHp: number): AeonBuild[] {
  const ratio = yunaAtRidgeHp / yunaAtMacalaniaHp;
  return ['valefor', 'ifrit'].map((id) => {
    const source = macalaniaBuild.aeons.find((a) => a.id === id);
    if (!source) throw new Error(`mushroom-rock: ${id} missing from the Macalania preset`);
    return aeonAtTheRidge(source, ratio);
  });
}

/** Half of Macalania's counts (rounded up) for the items on sale by Mi'ihen; the rest of its bag is later. */
const EARLY_ITEMS = ['potion', 'hi-potion', 'phoenix-down', 'antidote', 'eye-drops', 'echo-screen', 'soft'] as const;
function inventory(): InventoryEntry[] {
  return EARLY_ITEMS.flatMap((itemId) => {
    const row = macalaniaBuild.inventory.find((e) => e.itemId === itemId);
    return row ? [{ itemId, count: Math.ceil(row.count / 2) }] : [];
  });
}

function build(): FFXPartyBuild {
  const roster = members();
  const yuna = roster.find((m) => m.id === 'yuna');
  const yunaHigh = macalaniaBuild.members.find((m) => m.id === 'yuna');
  if (!yuna || !yunaHigh) throw new Error('mushroom-rock: Yuna missing');
  return {
    game: 'ffx',
    members: roster,
    // Link 1's opening three, a choice of ours (Switch is open): Piercing for the arms (Auron), a spell that reaches the head (Lulu) and Haste (Tidus), with Yuna, Wakka and Kimahri on the bench.
    activeSlots: ['tidus', 'auron', 'lulu'],
    reserve: ['yuna', 'wakka', 'kimahri'],
    aeons: aeons(yuna.stats.maxHp, yunaHigh.stats.maxHp),
    inventory: inventory(),
    gil: 0, // nothing here is for sale or spent
    sphereInventory: {},
  };
}

export const mushroomRockBuild: FFXPartyBuild = build();
export default mushroomRockBuild;
