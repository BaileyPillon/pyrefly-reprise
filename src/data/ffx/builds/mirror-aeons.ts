/**
 * The party for the hidden **Mirror Aeons** chapter (FFX only; `../../chapter-mirror-aeons.ts`): the endgame party that meets the Dark Magus Sisters and Dark Yojimbo, with **Yojimbo and the Magus Sisters in Yuna's
 * summon list** beside the five story aeons. **Every number in this file is an `[estimate]`** (AGENTS.md rule 6): no source gives a typical endgame party, and the guides' only statements are "fully levelled, best
 * gear, stats near the cap" (`research/ffx-mirror-aeons.md` section 4). This file is **one of the two difficulty levers** (`docs/plans/ch-mirror-aeons-review.md` section 3; the other is which of the game's own
 * formations each act uses), and the lever the bench turns before it touches anything else. **No boss number is touched.**
 *
 * ## What the preset is, and the source of each choice
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up | Tidus, Yuna, Auron on the field; Wakka, Lulu, Kimahri, Rikku on the bench | `./dreams-end.ts`'s trio, the repository's endgame party (the guides name Quick Hit (Tidus) and Auto-Life (Yuna) among the skills they ask for) |
 * | Stats | every member at the caps: HP 9,999, MP 999, the seven other stats 255 | Jegged Stat Maxing (the caps), GamerGuides ("250 to 255 by now"), StrategyWiki ("maxed out stats") `[estimate]` |
 * | Luck | `ENDGAME_LUCK` = 60 | Jegged: raise it as far as is reasonable, it is "not required"; no source gives a number `[estimate]` |
 * | Armour | Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon on all seven | Jegged Best Armor: Auto-Haste and Auto-Phoenix "must have", Auto-Protect and Ribbon "strong" `[estimate]` |
 * | Weapons | Break Damage Limit and the strength or magic tiers; First Strike on Tidus and on Yuna | the guides assume Break Damage Limit (the Dark Aeons' own loot lists it; 1.6 to 3 million HP is out of reach at 9,999 a hit: RE section 8); StrategyWiki lists First Strike for Dark Yojimbo `[estimate]` |
 * | Yuna's aeons | `aeonStatsFromYuna` (`./endgame-aeons.ts`) on this Yuna at 600 battles (tier 19, the last) | `research/ffx-combat-core.md` section 6.4 `[verified: 3 sources]`; RE section 5.5 (G08): "the last tier (600 battles and over)" |
 * | The aeons | Valefor, Ifrit, Ixion, Shiva, Bahamut, **Yojimbo, Cindy, Sandy, Mindy**; **Anima is left out**, as `./dreams-end.ts` leaves it | the brief; Anima's Oblivion is the guides' favourite answer and would swamp the mirror, so adding it is a lever for the bench `[estimate]` |
 * | Yojimbo's hire answer | `YOJIMBO_HIRE_ANSWER` = 2 (the third option, "to defeat the most powerful of enemies") | Jegged Cavern; G08 section 3.5 |
 * | Yojimbo's starting compatibility | `YOJIMBO_START_COMPATIBILITY` = 128 | **the files hold no start value** (RE section 5.5, G08 section 3); "the community says 128" `[estimate]` |
 * | Gil | `ENDGAME_GIL` = 1,500,000 (Yojimbo is paid from it each time he acts) | StrategyWiki speaks of paying "upwards of 2 million" `[estimate]` |
 * | Bag | `./dreams-end.ts`'s bag (Phoenix Downs, X-Potions, Remedies, Holy Water, Elixir ...) less the Candle of Life, a Doom-kill route that belongs to Yu Yevon alone | the repository's endgame bag `[estimate]` |
 * | Gauges | the members keep their Dream's End gauges; the five story aeons keep theirs; **the four new aeons start at 0** | `./late-aeon-rows.ts`; the Dark Sisters start full in the trio (RE section 4.2), Yuna's do not `[estimate]` |
 *
 * `YOJIMBO_HIRE_ANSWER` and `YOJIMBO_START_COMPATIBILITY` are read by the engine's Yojimbo rules once the reverse-engineering session wires them (`battle/ffx/ai/dark-aeons-seams.ts`); nothing reads them today.
 */

import type { AeonBuild, AutoAbilityId, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { AEONS } from '../aeons/index.ts';
import { PLAYER_MIRROR_AEONS } from '../mirror-aeons-ids.ts';
import { dreamsEndBuild } from './dreams-end.ts';
import { type YunaStats, aeonStatsFromYuna } from './endgame-aeons.ts';

/** The caps (Jegged Stat Maxing): HP 9,999, MP 999, every other stat 255. `[estimate]`: the whole party at the caps. */
export const ENDGAME_CAPS = { hp: 9_999, mp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255 } as const;
/** Luck of the whole party: no source gives a number (Jegged: raise it as far as is reasonable, not required). `[estimate]` */
export const ENDGAME_LUCK = 60;
/** The battle count the aeons' stats are derived at: tier 19, the last (G08 / RE section 5.5). */
export const ENDGAME_BATTLES = 600;
/** Party gil: Yojimbo is paid from it (`[estimate]`; StrategyWiki speaks of paying "upwards of 2 million"). */
export const ENDGAME_GIL = 1_500_000;
/** The hire answer 0 to 2 the player gave at the Fayth: 2, the third option (Jegged Cavern; G08 section 3.5). */
export const YOJIMBO_HIRE_ANSWER = 2;
/** Yojimbo's starting compatibility: the files do not hold it; the community says 128 (RE section 5.5). `[estimate]` */
export const YOJIMBO_START_COMPATIBILITY = 128;

/** Yuna's ten stats as the aeon formula reads them. */
export const ENDGAME_YUNA: YunaStats = { ...ENDGAME_CAPS, luck: ENDGAME_LUCK };

/** Jegged Best Armor: the must-haves and the strong ones, in the four slots every endgame armour has. `[estimate]` */
export const ENDGAME_ARMOR: readonly AutoAbilityId[] = ['auto-haste', 'auto-phoenix', 'auto-protect', 'ribbon'];

/** Each member's weapon abilities (four slots). Break Damage Limit on all (the guides' assumption); First Strike on Tidus and Yuna. `[estimate]` */
export const ENDGAME_WEAPONS: Readonly<Record<string, readonly AutoAbilityId[]>> = {
  tidus: ['break-damage-limit', 'strength-20', 'strength-10', 'first-strike'],
  yuna: ['first-strike', 'break-damage-limit', 'magic-20', 'magic-10'],
  auron: ['break-damage-limit', 'strength-20', 'strength-10', 'strength-5'],
  wakka: ['break-damage-limit', 'strength-20', 'strength-10', 'strength-5'],
  lulu: ['break-damage-limit', 'magic-20', 'magic-booster', 'one-mp-cost'],
  kimahri: ['break-damage-limit', 'strength-20', 'strength-10', 'strength-5'],
  rikku: ['break-damage-limit', 'strength-20', 'strength-10', 'strength-5'],
};

/** The skills the guides ask for that Dream's End withholds: Quick Hit (Tidus), Auto-Life (Yuna) (StrategyWiki's preparation lists). */
const EXTRA_SKILLS: Readonly<Record<string, readonly string[]>> = { tidus: ['quick-hit'], yuna: ['auto-life'] };

function endgameMember(m: FFXMemberBuild): FFXMemberBuild {
  const out = structuredClone(m);
  out.stats = { ...ENDGAME_CAPS, luck: ENDGAME_LUCK, maxHp: ENDGAME_CAPS.hp, maxMp: ENDGAME_CAPS.mp };
  out.hp = ENDGAME_CAPS.hp;
  out.mp = ENDGAME_CAPS.mp;
  out.equipment.weapon = { ...out.equipment.weapon, slots: 4, autoAbilities: [...(ENDGAME_WEAPONS[out.id] ?? ENDGAME_WEAPONS.auron!)] };
  out.equipment.armor = { ...out.equipment.armor, slots: 4, autoAbilities: [...ENDGAME_ARMOR] };
  out.learnedAbilityIds = [...new Set([...out.learnedAbilityIds, ...(EXTRA_SKILLS[out.id] ?? [])])];
  return out;
}

/** The ability ids an aeon's menu carries, as the catalogue gives them (the late builds' shape: the Special, then Shield and Boost; Yojimbo his four attacks; the Sisters Nul-All). */
function aeonAbilityIds(id: string): string[] {
  const def = AEONS[id];
  if (def === undefined) throw new Error(`mirror-aeons: no aeon '${id}' in the catalogue`);
  const attacks = Array.isArray(def.attackAbilityId) ? def.attackAbilityId : [];
  return [...attacks, ...(def.specialAbilityId !== null ? [def.specialAbilityId] : []), ...(def.isMagusSister === true ? ['nul-all-aeon'] : []), 'shield', 'boost'];
}

/** One aeon row from the formula on this Yuna, HP and MP full. */
function derivedAeon(id: string, gauge: number): AeonBuild {
  const def = AEONS[id]!;
  const s = aeonStatsFromYuna(id, ENDGAME_YUNA, ENDGAME_BATTLES);
  return {
    id,
    name: def.name,
    spriteKey: id,
    stats: { ...s, maxHp: s.hp, maxMp: s.mp },
    hp: s.hp,
    mp: s.mp,
    overdriveGauge: gauge,
    abilityIds: aeonAbilityIds(id),
    overdriveIds: [...def.overdriveAbilityIds],
  };
}

/** The five story aeons keep Dream's End's gauges; Yojimbo and the Sisters start at 0. */
function endgameAeons(): AeonBuild[] {
  const gauges = new Map(dreamsEndBuild.aeons.map((a) => [a.id, a.overdriveGauge]));
  const story = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'].map((id) => derivedAeon(id, gauges.get(id) ?? 0));
  const optional = PLAYER_MIRROR_AEONS.map((id) => derivedAeon(id, 0));
  return [...story, ...optional];
}

export const mirrorAeonsBuild: FFXPartyBuild = {
  game: 'ffx',
  members: dreamsEndBuild.members.map(endgameMember),
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: ['wakka', 'lulu', 'kimahri', 'rikku'],
  aeons: endgameAeons(),
  inventory: dreamsEndBuild.inventory.filter((e) => e.itemId !== 'candle-of-life').map((e) => ({ ...e })),
  gil: ENDGAME_GIL,
  sphereInventory: {},
};

export default mirrorAeonsBuild;
