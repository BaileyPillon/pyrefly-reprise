/**
 * The party for the hidden **Belgemine's Challenge** chapter (FFX only; `../../chapter-belgemine.ts`): **Yuna alone** and **all ten of her aeons** (the five story aeons, Anima, Yojimbo and the three Magus Sisters), against the
 * eight aeons of Belgemine's at the Remiem Temple. **Every number in this file is an `[estimate]`** (AGENTS.md rule 6): no source gives Yuna's stats or her aeons' at Remiem. The guides' one statement is "how easy or hard things are
 * depends solely on how well you built Yuna" (RE 6), so this file is **the difficulty lever** (`docs/plans/ch-belgemine-review.md` BD2: "the party preset is the lever, never a duel row"). **No boss number is touched.**
 *
 * ## The three presets, and the one that ships
 *
 * | Tier | Yuna | Her aeons | What the files and the bench say |
 * |---|---|---|---|
 * | `'zanarkand'` | Chapter II's Yuna (HP 2,450, MAG 38, the Zanarkand Dome profile, N = 300) | `research/ffx-combat-core.md` section 6.4.3's Zanarkand Dome block, **all ten rows** (`AEON_CANONICAL_STATS.yunalesca`, `[estimate]` mechanically derived from `[verified: 3 sources]` constants): Valefor 1,674 HP to Cindy 6,200 | the preflight's recommendation (RE 6: enemy moves hit for 15 to 340 percent of an aeon's HP). **The bench: the first six duels are won, but Anima 57 percent and the Magus Sisters 6, the chain 4 percent: a wall** |
 * | `'sin'` | Chapter III's Yuna (HP 5,130, the end of the story, N = 360) | the same section's **third block**, "inside Sin" (`AEON_CANONICAL_STATS['braskas-final-aeon']`), all ten rows: Valefor 1,886 HP to Cindy 7,070. **The last sourced canonical block, the Yuna of the story's end** | **the bench: the advisor's line wins the chain 98 percent (Anima 100, the Sisters 100), the careless line 42**: the shipped tier |
 * | `'endgame'` | the Mirror Aeons Yuna at the caps | the same formula at 600 battles (`aeonStatsFromYuna`): 13,897 to 43,827 HP, Defense and Magic Defense 255 | every enemy move under 250 (RE 6): a walkover (the careless line wins every duel) |
 *
 * `BELGEMINE_TIER` is the shipped one, **chosen by the bench** (`docs/handoff/ch-belgemine.md`, `tests/unit/chapters/belgemine-bench.test.ts`, 100 seeds a cell): the driver's pick under Bailey's delegation, his to overturn; the other tiers are one constant away. **Neither named band is exactly met** (the Mirror Aeons precedent: the advisor's line 60 to 80 percent for the chain, a careless line under 20): 98 and 42 are the nearest of the three sourced blocks, and a fraction of an aeon's HP would be an invented lever.
 *
 * ## What is the same in both
 *
 * - **Yuna alone** (`activeSlots: ['yuna']`, no reserve): the duels have no other party member (RE 5). Her Grand Summon gauge starts full; she is whole at every act's entry (the chain's `restoresPartyOnEntry`).
 * - **All ten aeons owned from the start** (BD4); the aeon the enemy holds is locked per act (`lockedAeons`). Yojimbo's two starting values are the game's own (hire answer 2, compatibility 128: `./mirror-aeons.ts`), and the Sisters start
 *   at motivation 50 and gauge 100 as the Mirror Aeons preset has them (`[estimate]`).
 * - **The gauges carry from act to act** (a Save Sphere does not touch a gauge; BD3 as built), the five story aeons starting at Chapter II's, Anima and Yojimbo at 0.
 * - The bag is Chapter II's (an aeon has no Items row and Yuna's menu is Summon only, so nothing in it is used).
 */

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { AEONS, AEON_CANONICAL_STATS } from '../aeons/index.ts';
import { aeonStatsFromYuna } from './endgame-aeons.ts';
import { ENDGAME_BATTLES, ENDGAME_YUNA, SISTERS_START_GAUGE, SISTERS_START_MOTIVATION, YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY, YOJIMBO_START_GAUGE, mirrorAeonsBuild } from './mirror-aeons.ts';
import { dreamsEndBuild } from './dreams-end.ts';
import { zanarkandBuild } from './zanarkand.ts';

export type BelgemineTier = 'zanarkand' | 'sin' | 'endgame';

/** The shipped tier: set by the bench (`docs/handoff/ch-belgemine.md`). */
export const BELGEMINE_TIER: BelgemineTier = 'sin';

/** Yuna's Grand Summon gauge at the start: full (the preflight's section 4; she arrives ready to call the first aeon with its Overdrive). */
export const BELGEMINE_YUNA_GAUGE = 100;

/** The ten aeons, in the Summon list's order. */
export const BELGEMINE_AEON_IDS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy'] as const;

/** The ability ids an aeon's menu carries (the late builds' shape: the Special, then Shield and Boost; Yojimbo his four attacks; the Sisters Nul-All). */
function aeonAbilityIds(id: string): string[] {
  const def = AEONS[id];
  if (def === undefined) throw new Error(`belgemine: no aeon '${id}' in the catalogue`);
  const attacks = Array.isArray(def.attackAbilityId) ? def.attackAbilityId : [];
  return [...attacks, ...(def.specialAbilityId !== null ? [def.specialAbilityId] : []), ...(def.isMagusSister === true ? ['nul-all-aeon'] : []), 'shield', 'boost'];
}

/** The gauge an aeon starts at: Yojimbo 0, the Sisters 100 (the Mirror preset's), Anima 0, the five story aeons Chapter II's. */
function startGauge(id: string): number {
  if (id === 'yojimbo') return YOJIMBO_START_GAUGE;
  if (id === 'cindy' || id === 'sandy' || id === 'mindy') return SISTERS_START_GAUGE;
  return zanarkandBuild.aeons.find((a) => a.id === id)?.overdriveGauge ?? 0;
}

/** One aeon row from the tier's stats, HP and MP full. */
function aeonRow(id: string, tier: BelgemineTier): AeonBuild {
  const def = AEONS[id]!;
  const s =
    tier !== 'endgame'
      ? (() => {
          const c = AEON_CANONICAL_STATS[tier === 'zanarkand' ? 'yunalesca' : 'braskas-final-aeon'][id];
          if (c === undefined) throw new Error(`belgemine: no canonical row for '${id}'`);
          const { baseCtb: _baseCtb, ...stats } = c; // the CTB base is derived from Agility by the engine
          return stats;
        })()
      : aeonStatsFromYuna(id, ENDGAME_YUNA, ENDGAME_BATTLES);
  return {
    id,
    name: def.name,
    spriteKey: def.spriteKey, // the catalogue's art: Yojimbo is `yojimbo-cavern`, the approved painting; every other aeon's art is its id
    stats: { ...s, maxHp: s.hp, maxMp: s.mp },
    hp: s.hp,
    mp: s.mp,
    overdriveGauge: startGauge(id),
    abilityIds: aeonAbilityIds(id),
    overdriveIds: [...def.overdriveAbilityIds],
  };
}

/** Yuna, whole, her Grand Summon gauge full. The Zanarkand tier is Chapter II's Yuna; the endgame tier is the Mirror Aeons' at the caps. */
function yunaFor(tier: BelgemineTier): FFXMemberBuild {
  const source = (tier === 'zanarkand' ? zanarkandBuild : tier === 'sin' ? dreamsEndBuild : mirrorAeonsBuild).members.find((m) => m.id === 'yuna');
  if (source === undefined) throw new Error('belgemine: no Yuna in the source preset');
  const out = structuredClone(source);
  out.hp = out.stats.maxHp;
  out.mp = out.stats.maxMp;
  out.overdrive = { ...out.overdrive, gauge: BELGEMINE_YUNA_GAUGE };
  return out;
}

/** The party of a tier. */
export function belgemineBuildOf(tier: BelgemineTier): FFXPartyBuild {
  return {
    game: 'ffx',
    members: [yunaFor(tier)],
    activeSlots: ['yuna'],
    reserve: [],
    aeons: BELGEMINE_AEON_IDS.map((id) => aeonRow(id, tier)),
    // The player's Yojimbo and Magus Sisters own rules in the engine: a build that lists them MUST say how they start, or `buildBattle` throws.
    yojimbo: { compatibility: YOJIMBO_START_COMPATIBILITY, hireAnswer: YOJIMBO_HIRE_ANSWER },
    sisters: { motivation: { cindy: SISTERS_START_MOTIVATION, sandy: SISTERS_START_MOTIVATION, mindy: SISTERS_START_MOTIVATION } },
    inventory: zanarkandBuild.inventory.map((e) => ({ ...e })),
    gil: zanarkandBuild.gil,
    sphereInventory: {},
  };
}

export const belgemineBuild: FFXPartyBuild = belgemineBuildOf(BELGEMINE_TIER);

export default belgemineBuild;
