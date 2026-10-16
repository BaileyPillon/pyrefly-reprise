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
 * | Line-up | **Tidus, Yuna, Lulu** on the field; Auron, Wakka, Kimahri, Rikku on the bench | `./dreams-end.ts`'s seven, the repository's endgame party. **Lulu takes Auron's place because of Dark Mindy:** her Evasion is 240 (RE section 2), and the engine lands 0 of 55 physical blows of this party on her (measured, `docs/handoff/ch-mirror-aeons.md`); a spell never misses (GamerGuides and StrategyWiki both send a mage: Doublecast Flare or Ultima). The guides also name Quick Hit (Tidus) and Auto-Life (Yuna) among the skills they ask for |
 * | Stats | every member at the caps: HP 9,999, MP 999, the seven other stats 255 | Jegged Stat Maxing (the caps), GamerGuides ("250 to 255 by now"), StrategyWiki ("maxed out stats") `[estimate]` |
 * | Luck | `ENDGAME_LUCK` = 60 | Jegged: raise it as far as is reasonable, it is "not required"; no source gives a number `[estimate]` |
 * | Armour | Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon on all seven | Jegged Best Armor: Auto-Haste and Auto-Phoenix "must have", Auto-Protect and Ribbon "strong" `[estimate]` |
 * | Weapons | Break Damage Limit and the strength or magic tiers; First Strike on Tidus and on Yuna | the guides assume Break Damage Limit (the Dark Aeons' own loot lists it; 1.6 to 3 million HP is out of reach at 9,999 a hit: RE section 8); StrategyWiki lists First Strike for Dark Yojimbo `[estimate]` |
 * | Yuna's aeons | `aeonStatsFromYuna` (`./endgame-aeons.ts`) on this Yuna at 600 battles (tier 19, the last) | `research/ffx-combat-core.md` section 6.4 `[verified: 3 sources]`; RE section 5.5 (G08): "the last tier (600 battles and over)" |
 * | The aeons | Valefor, Ifrit, Ixion, Shiva, Bahamut, **Yojimbo, Cindy, Sandy, Mindy**; **Anima is left out**, as `./dreams-end.ts` leaves it | the brief; Anima's Oblivion is the guides' favourite answer and would swamp the mirror, so adding it is a lever for the bench `[estimate]` |
 * | Yojimbo's hire answer | `YOJIMBO_HIRE_ANSWER` = 2 (the third option, "to defeat the most powerful of enemies") | Jegged Cavern; G08 section 3.5 |
 * | Yojimbo's starting compatibility | `YOJIMBO_START_COMPATIBILITY` = 128 | **strongly indicated by the owner's saves, live confirmation pending** (the game's files hold no start value: RE section 5.5, G08 section 3; the community also says 128) `[estimate]` until it is confirmed live |
 * | Gil | `ENDGAME_GIL` = 1,500,000 (Yojimbo is paid from it each time he acts) | StrategyWiki speaks of paying "upwards of 2 million" `[estimate]` |
 * | Bag | `./dreams-end.ts`'s bag (Phoenix Downs, X-Potions, Remedies, Holy Water, Elixir ...) less the Candle of Life, a Doom-kill route that belongs to Yu Yevon alone | the repository's endgame bag `[estimate]` |
 * | Gauges | the members keep their Dream's End gauges; the five story aeons keep theirs; **Yojimbo starts at 0 and Yuna's three Magus Sisters at 100** | `./late-aeon-rows.ts`; the Sisters' menu offers Combine powers only while all three bars are full; **RE's follow-up (4256d209a) carries out all seven other orders now**, so a bar can be filled in the fight, and the full start is the bench's lever to re-read (0 is the other end) `[estimate]` |
 * | The Sisters' start motivation | `SISTERS_START_MOTIVATION` = 50 each | **an estimate: RE marks it unsourced** (`FFXPartyBuild.sisters`); it sets Combine powers' chance (200 plus motivation, always from 56 up) and the order menu's rolls |
 * | Phoenix Downs | `ENDGAME_PHOENIX_DOWNS` = 17 | the bench's lever (`docs/plans/ch-mirror-aeons-bench.md`); **set by the bench on the final engine (2026-10-16): 74 percent with Pay on, 70 with Yojimbo never sent in** `[estimate]` |
 *
 * `YOJIMBO_HIRE_ANSWER` and `YOJIMBO_START_COMPATIBILITY` are read by the engine's Yojimbo rules (re-parity lane FFX-K: `FFXPartyBuild.yojimbo`, required for a build that lists him); a chain carries the compatibility and the gil
 * through `state.flags` and nothing persists them across sessions (that would be save data), so every run starts from these values.
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
/**
 * **The Phoenix Downs in the bag, the bench's main lever** (`docs/plans/ch-mirror-aeons-bench.md`; `[estimate]`: no source gives a stock). Every KO of a member costs one (the armour's Auto-Phoenix uses one on the fallen, and
 * the line's revives use the rest), so this number is the clock of Act I: with the repository's endgame bag's 10 the pair is lost four times in five, from 20 up it is won nineteen times in twenty, and **17 is the value at
 * which the whole chapter (both acts, the advisor's line) is won about seven times in ten**, the plan's target. The other items keep the repository's endgame bag's counts (`./dreams-end.ts`): none of them limits a fight
 * (Yuna heals with her spells), which the bench also measured.
 *
 * **The table of record (2026-10-16)** was run on the engine with RE's follow-up merged (`494b2f2fb`/`53ce98a05`: the group Zanmato, the seven orders, the group Delta Attack) and equals the first run of 2026-10-15 to the seed: 14, 15, 16, 17, 18
 * and 19 Phoenix Downs win the whole chapter 44, 55, 66, **74**, 79 and 83 percent of the time with the advisor's line (400 seeds), and 41, 52, 63, **70**, 77 and 80 with Yojimbo never sent in, so 17 sits on the target for the line that never pays
 * and inside the band for the one that does (`docs/plans/ch-mirror-aeons-bench.md`).
 */
export const ENDGAME_PHOENIX_DOWNS = 17;
/** Party gil: Yojimbo is paid from it (`[estimate]`; StrategyWiki speaks of paying "upwards of 2 million"). */
export const ENDGAME_GIL = 1_500_000;
/** The hire answer 0 to 2 the player gave at the Fayth: 2, the third option (Jegged Cavern; G08 section 3.5). */
export const YOJIMBO_HIRE_ANSWER = 2;
/** Yojimbo's starting compatibility, 0 to 255: the game's files hold no start value (RE section 5.5); 128 is **strongly indicated by the owner's saves, live confirmation pending** (the community also says 128). `[estimate]` until it is confirmed live. */
export const YOJIMBO_START_COMPATIBILITY = 128;
/**
 * Each Magus Sister's motivation at the start of the battle, 0 to 100 (`Chr+0x6e1`): **UNSOURCED**. The reverse-engineering session's engine asks a build for it and has no default (`FFXPartyBuild.sisters`; its note says the
 * start value is "not in the note at all"), so this is **our estimate, labelled so**: the middle of the range. It matters little: the Combine powers order succeeds with the chance `200 + motivation` out of 256 (every
 * value from 56 up always succeeds; 50 succeeds 250 times in 256), and a success adds 10, a failure takes 10. `[estimate]` until the value is read from the game; the bench measures it as one more party lever.
 */
export const SISTERS_START_MOTIVATION = 50;
/**
 * The Overdrive gauge Yuna's Magus Sisters start the chapter at, 0 to 100 (a lever of the difficulty bench). **Full, `[estimate]`**. It was chosen when only the Combine powers order worked (the seven others were not carried out), and
 * Combine powers is only offered when all three gauges are full, so a Sister who came onto the field with an empty gauge could do nothing but leave. **RE's follow-up (4256d209a) carries out all eight orders**, so a bar can now be
 * filled in the fight (each order's action applies its own gain pair) and a start at 0 is playable: whether to keep the full start is the bench's call, not made here. Full gauges also make the mirror: the Dark Sisters start the trio at 100 (RE note 2.5).
 * The five story aeons keep their Dream's End gauges.
 */
export const SISTERS_START_GAUGE = 100;
/** Yojimbo's gauge at the start: 0 (his menu is Pay and Dismiss). **A full gauge raises the chance that a Pay buys Zanmato** (+20 to the roll's motivation: RE's lane handoff section 10.4, 17 in 64 for a 100,000 Pay at compatibility 128 against 0 in 64 without it), and **a landed Zanmato now ends a Dark Aeon fight** (every legal foe of the group dies whatever its Death resistance, afda2d451), so the start is a lever of the bench, not a detail. `[estimate]` */
export const YOJIMBO_START_GAUGE = 0;

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

/** The skills the guides ask for that Dream's End withholds: Quick Hit (Tidus), Auto-Life (Yuna) (StrategyWiki's preparation lists), and Lulu's Flare and Ultima (the guides' answer to a high-Evasion Dark Mindy; Dream's End withholds both). */
const EXTRA_SKILLS: Readonly<Record<string, readonly string[]>> = { tidus: ['quick-hit'], yuna: ['auto-life'], lulu: ['flare', 'ultima'] };

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

/** The five story aeons keep Dream's End's gauges; Yojimbo starts at `YOJIMBO_START_GAUGE` and the Sisters at `SISTERS_START_GAUGE`. */
function endgameAeons(): AeonBuild[] {
  const gauges = new Map(dreamsEndBuild.aeons.map((a) => [a.id, a.overdriveGauge]));
  const story = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'].map((id) => derivedAeon(id, gauges.get(id) ?? 0));
  const optional = PLAYER_MIRROR_AEONS.map((id) => derivedAeon(id, id === 'yojimbo' ? YOJIMBO_START_GAUGE : SISTERS_START_GAUGE));
  return [...story, ...optional];
}

export const mirrorAeonsBuild: FFXPartyBuild = {
  game: 'ffx',
  members: dreamsEndBuild.members.map(endgameMember),
  activeSlots: ['tidus', 'yuna', 'lulu'],
  reserve: ['auron', 'wakka', 'kimahri', 'rikku'],
  aeons: endgameAeons(),
  // The player's Yojimbo and Magus Sisters own rules in the engine (re-parity lane FFX-K: a build that lists them MUST say how they start, or `buildBattle` throws).
  yojimbo: { compatibility: YOJIMBO_START_COMPATIBILITY, hireAnswer: YOJIMBO_HIRE_ANSWER },
  sisters: { motivation: { cindy: SISTERS_START_MOTIVATION, sandy: SISTERS_START_MOTIVATION, mindy: SISTERS_START_MOTIVATION } },
  inventory: dreamsEndBuild.inventory.filter((e) => e.itemId !== 'candle-of-life').map((e) => ({ ...e, ...(e.itemId === 'phoenix-down' ? { count: ENDGAME_PHOENIX_DOWNS } : {}) })),
  gil: ENDGAME_GIL,
  sphereInventory: {},
};

export default mirrorAeonsBuild;
