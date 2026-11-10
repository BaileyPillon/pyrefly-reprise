/**
 * Party build — **Luca, the Number 4 Dock** (the hidden Oblitzerator chapter; FFX only; `research/re-ffx-oblitzerator-crane.md` sections 2 and 5, `docs/plans/ch-oblitzerator-review.md` section 4, picks OB2 and OB3).
 *
 * The party is **Tidus, Lulu and Kimahri**, three in front and nobody on the bench: the formation holds three party entries and no more, **Yuna has been taken at the docks**, Wakka is with the team and Auron joins
 * later (the guides: Gamer Guides names the three, Jegged and Samurai Gamers name Tidus and Lulu). There is no aeon (the formation's one aeon entry is unused without Yuna).
 *
 * ## Where the numbers come from: no source gives them, so one stated method, `[estimate]`
 *
 * **No source gives the party's stats, Sphere Grid state or gear at the Luca dock, and no preset of this repository stands at this point** (the earliest FFX presets are the Ridge's and the Temple's). The two ends are known, as at
 * the Ridge (`./mushroom-rock.ts`, whose method this file follows):
 *
 * - **the start of the game**, the game's own base record of each character (`START_RECORDS`, `[game table]`);
 * - **Macalania**, the repo's own preset (`./macalania.ts`, `[estimate]`), stop 10 of the road (Besaid 1, Kilika 2, **Luca 3**, Mi'ihen 4 ... Macalania 10).
 *
 * Luca is stop 3, so **every stat is 3/10 of the way from the first to the second, rounded down** (the Ridge's rule is the midpoint at stop 5 of 10: `./mushroom-rock.ts`). Tidus 709 HP, STR 16, AGI 13; Lulu 521 HP, MAG 24, MDEF 31;
 * Kimahri 810 HP, STR 17, DEF 15. **The raw start records are the lower bound** (Tidus 520, Lulu 380, Kimahri 644 HP): the bench (`tests/unit/chapters/oblitzerator-bench.test.ts`) runs the fight on both builds and reports them.
 * It is a guess and the chapter says so; the human-pace bench measures what it makes of the fight, and **the boss is never tuned**: if the party estimate has to move, it moves inside this range (the build fraction, the bag).
 * Sphere Level is the same fraction of the start row's used levels and Macalania's 18.
 *
 * **Kits** carry only what the cited guides and the research name for this fight and the start commands: Tidus **Cheer and Haste** (his start commands) and, from the formation, the Trigger Command **Use crane**
 * (`battle/ffx/ai/luca-crane.ts`); Lulu the four tier-one spells (**Thunder** is the whole of the crane and the Oblitzerator's weakness; Fire, Blizzard and Water are resisted and are there for the careless line) and
 * **no Focus** (`[estimate]`: leave out); Kimahri nothing but his spear (his Lancet is a magic-formula command and the Jump a physical one: neither is needed, and the research names neither). **Items** `[estimate]`: Potions (10),
 * Phoenix Downs (2), **Eye Drops (3) and Echo Screens (3)** (the guides' cures for the two balls), Antidotes (2). All `[estimate]`.
 */

import type { FFXMemberBuild, FFXPartyBuild, InventoryEntry, StatBlock } from '../../../battle/common/types.ts';
import { macalaniaBuild } from './macalania.ts';
import { START_RECORDS } from './mushroom-rock.ts';

/** The three in front, in slot order (the party list of the formation). */
export const LUCA_FRONT_LINE = ['tidus', 'lulu', 'kimahri'] as const;

/** The stop of the road: Luca is the third of ten (Besaid 1 ... Macalania 10), so the fraction is 3/10. */
export const LUCA_STOP = 3;
export const LUCA_STOPS = 10;

/** The ten Sphere Grid stats (everything in a `StatBlock` but the two ceilings). */
type Grid = Pick<StatBlock, 'hp' | 'mp' | 'str' | 'def' | 'mag' | 'mdef' | 'agi' | 'luck' | 'eva' | 'acc'>;
const GRID: readonly (keyof Grid)[] = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'];

/** `from` moved `stop / stops` of the way to `to`, rounded down. */
export function along(from: number, to: number, stop: number = LUCA_STOP, stops: number = LUCA_STOPS): number {
  return Math.floor(from + ((to - from) * stop) / stops);
}

type Kit = { learned: string[]; weapon: FFXMemberBuild['equipment']['weapon']; overdrive: string[] };

/** Macalania's member with its stats moved `stop / stops` of the way from the game's start record. The kit, gear and gauge are set by the caller. */
function atTheDock(id: keyof typeof START_RECORDS, kit: Kit, stop: number): FFXMemberBuild {
  const high = macalaniaBuild.members.find((m) => m.id === id);
  const start = START_RECORDS[id];
  if (!high || !start) throw new Error(`luca: ${id} missing from a source record`);
  const grid = Object.fromEntries(GRID.map((k) => [k, along(start[k], high.stats[k], stop)])) as Grid;
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
    sphereGrid: { position: `${id}-sphere-luca`, activatedNodeIds: [], sLv: along(start.slvUsed, 18, stop), ap: 0, spheres: {} },
  };
}

const weapon = (name: string): FFXMemberBuild['equipment']['weapon'] => ({ name, slots: 1, autoAbilities: [], bonusCrit: 3 });

function members(stop: number): FFXMemberBuild[] {
  return [
    atTheDock('tidus', { learned: ['cheer', 'haste'], weapon: weapon('Sword'), overdrive: ['spiral-cut'] }, stop), // his start commands; Use crane comes from the formation
    atTheDock('lulu', { learned: ['fire', 'blizzard', 'thunder', 'water'], weapon: weapon('Doll'), overdrive: ['fury'] }, stop), // the four tier-one spells; no Focus
    atTheDock('kimahri', { learned: [], weapon: weapon('Spear'), overdrive: [] }, stop), // his spear alone: Lancet is a magic-formula command, and the research names no Kimahri skill
  ];
}

/** The bag, `[estimate]`: the potions and the two cures for the balls, in the counts of the preflight (section 4). */
const BAG: readonly InventoryEntry[] = [
  { itemId: 'potion', count: 10 },
  { itemId: 'phoenix-down', count: 2 },
  { itemId: 'eye-drops', count: 3 },
  { itemId: 'echo-screen', count: 3 },
  { itemId: 'antidote', count: 2 },
];

/** The party at `stop` of ten stops on the road (3 is the shipped Luca; 0 is the raw start records, the lower bound the bench also runs). */
export function lucaBuildAt(stop: number): FFXPartyBuild {
  return {
    game: 'ffx',
    members: members(stop),
    activeSlots: [...LUCA_FRONT_LINE],
    reserve: [],
    aeons: [], // Yuna is not in the party, and the formation's one aeon entry is unused
    inventory: BAG.map((e) => ({ ...e })),
    gil: 0, // nothing here is for sale or spent
    sphereInventory: {},
  };
}

/** The shipped build: stop 3 of 10. */
export const lucaBuild: FFXPartyBuild = lucaBuildAt(LUCA_STOP);

export default lucaBuild;
