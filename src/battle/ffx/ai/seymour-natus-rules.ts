/**
 * **Chapter X — Seymour Natus and Mortibody: the numbers and the state the two scripts share.**
 *
 * Source (re-parity): the game's own scripts, `research/re-ffx-ai-seymour.md` section 4 (m126 Natus, m127
 * Mortibody; D-19 to D-23, with D-06 for the mount's revive). This replaces the authored version built from the wiki
 * and `research/ffx-seymour-natus-highbridge.md` and Bailey's B6-B10 answers of 2026-09-24 ("I'll go with your
 * recommendations for all"): those adopted estimates for what no source then settled (the element order, who moves
 * first, a Desperado ladder "not built", his own reflected spells), and the scripts now settle all of it. The list of
 * decisions the scripts replace is in `docs/handoff/re-parity-ai-seymour.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every key below lives under `natus.` or `mortibody.` on
 * `BattleState.flags`, so the advisor's forecast (which rebuilds a runtime from the state alone) sees it, and every
 * function is a no-op unless the Natus formation is on the board.
 *
 * ## The phase is recomputed from his HP at every hit, and can go back down
 *
 * His `onHit` (once per action per target, after the last hit record, before the death check) sets the phase from his
 * HP: **below 24,000: phase 1** (Break) and, if he has no Protect and has not cast his one, a Protect on himself;
 * **below the third-phase line** (12,000; 18,000 once it has been reached): **phase 2** (Flare); 24,000 or more:
 * **phase 0**, again. It does not matter who hit him: his own spell bounced by a Reflect, the Mortibsorption drain.
 * A Poison tick does not reach it (no `postPoison` hook), so Poison carrying him past a line changes nothing until
 * the next real hit. The flag below stores the phase the way this project always has, 1 to 3: the game's 0 to 2 plus 1.
 */

import type { CombatantId, ElementId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, tryActor } from '../state.ts';

/** Ids mirrored from `src/data/ffx/enemies/seymour-natus.ts` (the tests pin them equal). */
export const NATUS_ID = 'seymour-natus';
export const MORTIBODY_ID = 'mortibody';
export const NATUS_SCRIPT = 'seymour-natus';
export const MORTIBODY_SCRIPT = 'mortibody';

/** The lines, from his max HP of 36,000: `floor(max / 3) * 2`, `floor(max / 3)`, `floor(max / 2)`. */
export const PHASE_1_BELOW = 24_000;
export const PHASE_2_BELOW = 12_000;
/** Once phase 2 has been reached, its line moves here: he stays in it until he is back at 18,000. */
export const PHASE_2_BELOW_AFTER = 18_000;

/** Mortibody's first revive value (the script's private variable at battle start). */
export const MORTIBODY_FIRST_REVIVE_HP = 4000;

/** Battle-scoped state, on `BattleState.flags`. */
export const NATUS_PHASE = 'natus.phase';
/** The spell-set index, 0 to 3: **Natus** casts the set at the index and advances it; Mortibody reads it. */
export const NATUS_ELEMENT_STEP = 'natus.elementStep';
/** The phase-2 line: 12,000 at first, 18,000 after it has been reached. */
export const NATUS_PHASE_2_LINE = 'natus.phase2Line';
/** Set once his one Protect has been queued. */
export const NATUS_PROTECT_FIRED = 'natus.protectCountered';
export const MORTIBODY_REVIVE_HP = 'mortibody.reviveHp';
/** Count of Talk lines spent, per character: `natus.talked.<id>`. */
const TALKED = 'natus.talked.';

type Element4 = Extract<ElementId, 'fire' | 'ice' | 'lightning' | 'water'>;

/** The spell sets, in the script's index order: **Ice, Thunder, Water, Fire**. */
export const NATUS_ELEMENT_ORDER: readonly Element4[] = ['ice', 'lightning', 'water', 'fire'];

/** Mortibody's tier-1 row per element. */
export const MORTIBODY_TIER_ONE: Readonly<Record<Element4, string>> = {
  ice: 'mortibody-blizzard',
  lightning: 'mortibody-thunder',
  water: 'mortibody-water',
  fire: 'mortibody-fire',
};

/** Natus's Multi-ra row per element. */
export const NATUS_MULTI_RA: Readonly<Record<Element4, string>> = {
  ice: 'natus-multi-blizzara',
  lightning: 'natus-multi-thundara',
  water: 'natus-multi-watera',
  fire: 'natus-multi-fira',
};

export const NATUS_BREAK_ID = 'natus-break';
export const NATUS_FLARE_ID = 'natus-flare';
export const MORTIBODY_CLAW_ID = 'mortibody-shattering-claw';
export const MORTIBODY_DESPERADO_ID = 'mortibody-desperado';
export const MORTIBODY_CURA_ID = 'mortibody-cura';

/** The statuses Mortibody's Desperado test counts, one point each per active slot (Protect and Regen are not counted). */
export const DESPERADO_COUNTED = ['shell', 'haste', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost'] as const;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** True when the Natus formation is on the board at all. */
export function natusPresent(ctx: Ctx): boolean {
  return tryActor(ctx, NATUS_ID) !== undefined && ctx.state.enemyIds.includes(NATUS_ID);
}

/** The stored phase, 1 to 3 (the game's 0 to 2 plus 1). */
export function natusPhase(ctx: Pick<Ctx, 'state'>): 1 | 2 | 3 {
  const v = ctx.state.flags[NATUS_PHASE];
  return v === 2 || v === 3 ? v : 1;
}

/** The game's phase variable, 0 to 2: what both scripts switch on. */
export function natusScriptPhase(ctx: Pick<Ctx, 'state'>): 0 | 1 | 2 {
  return (natusPhase(ctx) - 1) as 0 | 1 | 2;
}

/** The spell-set index (0 to 3). */
export function natusElementStep(ctx: Pick<Ctx, 'state'>): number {
  const v = ctx.state.flags[NATUS_ELEMENT_STEP];
  return typeof v === 'number' ? ((v % 4) + 4) % 4 : 0;
}

/** The element at the index, without moving it: what Mortibody casts now and what Natus casts next. */
export function rotationElement(ctx: Pick<Ctx, 'state'>): Element4 {
  return NATUS_ELEMENT_ORDER[natusElementStep(ctx)] as Element4;
}

/** Natus's step: the element at the index, **then** the index moves on. */
export function castRotationElement(ctx: Pick<Ctx, 'state'>): Element4 {
  const step = natusElementStep(ctx);
  ctx.state.flags[NATUS_ELEMENT_STEP] = (step + 1) % 4;
  return NATUS_ELEMENT_ORDER[step] as Element4;
}

/** The phase-2 line in force. */
export function phase2Line(ctx: Pick<Ctx, 'state'>): number {
  const v = ctx.state.flags[NATUS_PHASE_2_LINE];
  return typeof v === 'number' ? v : PHASE_2_BELOW;
}

/**
 * Mortibody's **Desperado test** (m127 @0x1ab to 0x429), the ladder that D-082 left unbuilt while no source named
 * it. Each of the three active slots scores one point for each of Shell, Haste, Reflect and the four Nul spells it
 * wears (Protect and Regen do not count). The threshold is `GetRandomValue() mod 4 + 4` (4 to 7), one lower in
 * Natus's phase 2, and **0 when all three slots have Haste**. Desperado when the total reaches it. The draw is
 * spent every turn this runs, before the Haste override.
 */
export function desperadoScore(ctx: Ctx): { total: number; allHasted: boolean } {
  let total = 0;
  let hasted = 0;
  for (let i = 0; i < 3; i++) {
    const id = ctx.state.activeIds[i];
    const c = id === undefined ? undefined : tryActor(ctx, id);
    if (!c) continue;
    for (const status of DESPERADO_COUNTED) if (has(c, status)) total += 1;
    if (has(c, 'haste')) hasted += 1;
  }
  return { total, allHasted: hasted === 3 };
}

// ---------------------------------------------------------------------------
// Talk — this fight's own table [§6.2, verified: 4 sources]
// ---------------------------------------------------------------------------

/**
 * **Tidus +10 Strength, Auron +10 Strength, Yuna +10 Magic Defense**, once
 * each, for the battle. Natus-only: Macalania is Tidus / Yuna / Wakka and Flux
 * is Kimahri / Yuna — "do not share one table" (research §6.2). Stat points,
 * not a status, for the reason `seymour-flux.ts` gives (the cubic Strength
 * term reads real points). The formation script has no turn-start toggling for Natus.
 */
export const NATUS_TALK_BONUS: Readonly<Record<string, { readonly stat: 'str' | 'mdef'; readonly amount: number; readonly label: string }>> = {
  tidus: { stat: 'str', amount: 10, label: 'Strength' },
  auron: { stat: 'str', amount: 10, label: 'Strength' },
  yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
};

/** True for either actor of the Natus formation. */
export function isNatusScript(script: string): boolean {
  return script === NATUS_SCRIPT || script === MORTIBODY_SCRIPT;
}

/** Who still has a Talk line left, for the menu. */
export function natusTalkAvailable(ctx: Ctx, talkerId: CombatantId): boolean {
  if (!(talkerId in NATUS_TALK_BONUS)) return false;
  return ctx.state.flags[`${TALKED}${talkerId}`] !== true;
}

/** Spend `talker`'s one line. Returns false when there is nothing to say. */
export function consumeNatusTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = NATUS_TALK_BONUS[talker.id];
  if (!bonus || !natusTalkAvailable(ctx, talker.id)) return false;
  ctx.state.flags[`${TALKED}${talker.id}`] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({ type: 'message', text: `${talker.name}: +${bonus.amount} ${bonus.label}`, kind: 'story' });
  return true;
}
