/**
 * **Sin, links 1 to 3** (Chapter XVII, "Sin: the Fins and the Core"): every id and
 * `state.flags` key the Sin packages share, so the Fins (package F), Genais and
 * the Core (package G), the story, tactic and HUD layer (package P) and the bench
 * (package B) work on disjoint files against one set of names
 * (`docs/plans/sin-two-chapters-plan.md` §2.2, §7).
 *
 * **Constants and types only.** No logic lives here, and nothing here imports a
 * module with logic, so any Sin file may import it without a cycle.
 *
 * Ids are duplicated from the data files on purpose: `src/battle/**` must not
 * import `src/data/**` (the content arrives through the registry). The tests pin
 * the two copies equal (`tests/unit/chapters/sin-data.test.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3].
 */

import type { CombatantId } from '../../common/types.ts';

// ---------------------------------------------------------------------------
// Chapters (src/data/chapter-sin-*.ts)
// ---------------------------------------------------------------------------

/** Chapter XVII, links 1 to 3 on one party state (D-270). */
export const SIN_FINS_CORE_CHAPTER_ID = 'sin-fins-core';
/** Chapter XVIII, link 4 (Overdrive Sin), renamed from the branch-only `sin` (plan §1.4). */
export const SIN_FACE_CHAPTER_ID = 'sin-face';

// ---------------------------------------------------------------------------
// Combatants (research header: `left_fin` = [left_fin, cid], `right_fin` =
// [right_fin, cid], `sin_core` = [sinspawn_genais, sin_2], `[decompiled]`)
// ---------------------------------------------------------------------------

/** `m136`, bestiary #168. */
export const SIN_LEFT_FIN_ID = 'left-fin';
/** `m137`, bestiary #169. */
export const SIN_RIGHT_FIN_ID = 'right-fin';
/** `m139`, bestiary #170. */
export const SIN_GENAIS_ID = 'sinspawn-genais';
/** `m138` ("Sin" in the table), bestiary #171. */
export const SIN_CORE_ID = 'sin-core';
/** `m149`, the invisible third combatant of both Fin formations (§2.5). The id `cid` ranks last in the CTB tie-break. */
export const SIN_CID_ID = 'cid';

/** The two Fins, in link order. */
export const SIN_FIN_IDS: readonly CombatantId[] = [SIN_LEFT_FIN_ID, SIN_RIGHT_FIN_ID];

// ---------------------------------------------------------------------------
// Formations (`EnemyGroupDef.id`), chained by `nextGroupId`
// ---------------------------------------------------------------------------

export const SIN_LEFT_FIN_GROUP_ID = 'sin-left-fin';
export const SIN_RIGHT_FIN_GROUP_ID = 'sin-right-fin';
export const SIN_GENAIS_CORE_GROUP_ID = 'sin-genais-core';

// ---------------------------------------------------------------------------
// AI script ids (registered by `sin-fins.ts` and `sin-genais-core.ts`)
// ---------------------------------------------------------------------------

export const SIN_LEFT_FIN_SCRIPT = 'sin-left-fin';
export const SIN_RIGHT_FIN_SCRIPT = 'sin-right-fin';
export const SIN_GENAIS_SCRIPT = 'sinspawn-genais';
export const SIN_CORE_SCRIPT = 'sin-core';
/** Cid in the Fin fights: orders only, no missiles (§2.5, S-19). Not Evrae's `cid-fahrenheit`. */
export const SIN_CID_SCRIPT = 'cid-fahrenheit-sin';

// ---------------------------------------------------------------------------
// Ability ids (the rows in src/data/ffx/enemies/sin-*-abilities.ts)
// ---------------------------------------------------------------------------

/** §3.1 6:146 — NEAR, Strength 28, whole party, strong Delay. */
export const SIN_FIN_RAM = 'sin-fin-ram';
/** §3.1 6:147 — FAR, Strength 34, whole party. */
export const SIN_FIN_SMACK = 'sin-fin-smack';
/** §3.1 6:144 / 6:182 — the charged Gravija, 75 % of current HP. */
export const SIN_FIN_GRAVIJA = 'sin-fin-gravija';
/** §3.1 6:166 / 6:184 — a charged Gravija resolving at FAR: no damage (the dodge). */
export const SIN_FIN_GRAVIJA_FAR = 'sin-fin-gravija-far';
/** §3.1 6:145 — Negation at NEAR, both sides. */
export const SIN_FIN_NEGATION = 'sin-fin-negation';
/** §3.1 6:167 — Negation at FAR, the Fin only. */
export const SIN_FIN_NEGATION_FAR = 'sin-fin-negation-far';
/** §3.1 6:168 / 6:186 — "Core gathers energy." (the Fins' Gravija telegraph). */
export const SIN_FIN_GATHERS = 'sin-fin-gathers';
/** §3.1 6:188 — "Sin remains motionless." (a skipped turn). */
export const SIN_MOTIONLESS = 'sin-motionless';

/** §3.2 6:151. */
export const SIN_GENAIS_VENOM = 'sin-genais-venom';
/** §3.2 6:152. */
export const SIN_GENAIS_THRASHING = 'sin-genais-thrashing';
/** §3.2 6:150. */
export const SIN_GENAIS_SIGH = 'sin-genais-sigh';
/** §3.2 3:76 — the counter to magic, on the caster. */
export const SIN_GENAIS_WATERGA = 'sin-genais-waterga';
/** §3.2 3:44 — the in-shell counter, on itself. */
export const SIN_GENAIS_CURA = 'sin-genais-cura';
/** §3.2 6:154. */
export const SIN_GENAIS_SHELL_IN = 'sin-genais-shell-in';
/** §3.2 6:153. */
export const SIN_GENAIS_SHELL_OUT = 'sin-genais-shell-out';
/** §3.2 6:155 — "Magic absorbed." (a spell aimed at the Core while Genais lives). */
export const SIN_MAGIC_ABSORBED = 'sin-magic-absorbed';

/** §3.3 6:189. */
export const SIN_CORE_INACTIVE = 'sin-core-inactive';
/** §3.3 6:196. */
export const SIN_CORE_GATHERS = 'sin-core-gathers';
/** §3.3 6:148 — targeting `all`: the party, and Genais when it is out of its shell. */
export const SIN_CORE_GRAVIJA = 'sin-core-gravija';
/** §3.3 6:197 — "Counter All". */
export const SIN_CORE_NEGATION = 'sin-core-negation';
/** §3.3 6:57 to 6:60 — the counter cycle, in this order. */
export const SIN_CORE_FIRE = 'sin-core-fire';
export const SIN_CORE_BLIZZARD = 'sin-core-blizzard';
export const SIN_CORE_THUNDER = 'sin-core-thunder';
export const SIN_CORE_WATER = 'sin-core-water';
/** §3.3 [verified: 3 sources]: Fire, Blizzard, Thunder, Water, in that order. */
export const SIN_CORE_ELEMENT_CYCLE: readonly string[] = [SIN_CORE_FIRE, SIN_CORE_BLIZZARD, SIN_CORE_THUNDER, SIN_CORE_WATER];

// ---------------------------------------------------------------------------
// `state.flags` keys the HUD, the story triggers, the tactic and the bench read
// (every key prefixed `sin.`; `sin.turn` alone marks Overdrive Sin's battle)
// ---------------------------------------------------------------------------

/** Party targetings of the Fin since it last attacked (§5.1.1; an aeon counts 2, S-27). Package F writes it. */
export const SIN_FIN_HITS = 'sin.fin.hits';
/** The Fin's regular NEAR actions toward the charge (§5.1.2). Package F. */
export const SIN_FIN_REGULAR_ACTS = 'sin.fin.regularActs';
/** True between "Core gathers energy." and the Gravija that follows (§5.1.2). Package F. */
export const SIN_FIN_CHARGED = 'sin.fin.charged';
/** The Right Fin's below-16,250 latch (§5.2). Package F. */
export const SIN_FIN_LATCHED = 'sin.fin.latched';
/**
 * What the last Negation removed, per combatant: `Record<CombatantId, StatusId[]>`
 * (§11 item 4: the HUD must show what Negation took, and its mercy, the cured
 * Poison, Petrify, Slow and Darkness). Shared by F (the Fins) and G (the Core).
 */
export const SIN_NEGATION_TAKEN = 'sin.negation.lastTaken';
/** True while Genais is in its shell (§5.3.1). Package G. */
export const SIN_GENAIS_SHELLED = 'sin.genais.shelled';
/** The Core's state, one of {@link SIN_CORE_STATES} (§5.3.2). Package G. */
export const SIN_CORE_STATE = 'sin.core.state';
/** The next step of the Core's F, B, T, W counter cycle (§3.3). Package G. */
export const SIN_CORE_COUNTER_STEP = 'sin.core.counterStep';
/** True once the Core is down: `markSinRuntime` then marks Genais a non-combatant (§5.3.2 item 5). Package G. */
export const SIN_CORE_DOWN = 'sin.core.down';

/** `inactive` (Genais out), `charging` (gathering), `ready` (Gravija next), `free` (Genais dead). */
export const SIN_CORE_STATES = ['inactive', 'charging', 'ready', 'free'] as const;
export type SinCoreState = (typeof SIN_CORE_STATES)[number];

// ---------------------------------------------------------------------------
// The counter shape the Sin collectors return (`sin-counters.ts`)
// ---------------------------------------------------------------------------

/**
 * One free action a Sin collector asks `reactions.ts#collectBossCounters` to
 * queue. `targets` is the aim: omitted or empty, the engine's own resolution
 * picks (a random party member for a `single-enemy` row). Waterga names the
 * caster here (§3.2 "the caster", `[verified: 4 sources]`; plan REVIEW
 * must-change 1).
 */
export interface SinCounter {
  actorId: CombatantId;
  abilityId: string;
  cause: string;
  targets?: CombatantId[];
}
