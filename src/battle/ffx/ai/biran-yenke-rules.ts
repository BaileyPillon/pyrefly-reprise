/**
 * **Biran and Yenke Ronso: the rules** their two scripts use (FFX only; the hidden Biran and Yenke chapter, `docs/plans/ch-biran-yenke-review.md`).
 *
 * **Source: the game's own files**, `research/re-ffx-biran-yenke.md` ("RE section n"; `[bytes]`, read from the two monster files, not run: RE section 9). Nothing here is a stand-in except where a line says so.
 *
 * - **Sides** (RE sections 4 and 5.3): the formation has two start areas, the two sides of the arena. Both brothers start in Area 0 (`[inferred]`: the Area property's initial value was not read, RE section 9
 *   item 4). **Bulldoze swaps the user's side** (`AreaToMoveTo` is written when the script queues it; here the side flips when the script chooses it, the action runs in the same step). "Same side" = equal Area.
 * - **Half HP** (RE 5.2, 5.3): on a turn start, while the brother lives and the half-HP state is idle, HP **below max HP / 2** (integer, strict) arms it; on his next turn he spends it on **his own Ronso Rage**
 *   (Biran Mighty Guard, Yenke White Wind), **on both brothers when they stand on the same side, otherwise on himself**, and the Rage gate for Lancet opens (`ronso-rage.ts`). A brother who dies first cancels it.
 * - **A brother dies** (RE 5.2 to 5.4): the survivor's half-HP action is cancelled for good and **Biran's STR becomes `floor(STR / 4) x 5` and he queues Berserk on himself (so Bulldoze every turn, no more Thunder or
 *   Blizzard); Yenke's MAG becomes `floor(MAG / 4) x 5` and he queues Haste on himself (repeating each turn until it is on) with AGI := Kimahri's AGI - 4**; the cycle then goes on.
 * - **The defence swap** (RE 5.6): when Kimahri's command targets one brother, and the partner lives, the command is **physical**, the two brothers are on the same side, and (the quirk) **the command is Kimahri's
 *   plain Attack**: the partner's **DEF becomes 254 and Sentinel goes on until that partner is next hit**; his `onHit` releases it (DEF back to 30, Sentinel off). Jump, Thrust Kick and the Rages never trigger it, and
 *   Lancet, items and spells are not physical. The quirk rests on the executable's resolver bytes, not on a run (RE 5.6, section 9 item 2); built as the note reads.
 *
 * **The one random draw** (RE 5.7): every non-lethal hit event on a brother takes one draw of the script stream (stream 2), `v12 := GetRandomValue() mod 100`, which in the game only picks a line of dialogue
 * (`onBrotherHit`). The dialogue is not shown (no script text, no new content: the driver's decision) but the draw is kept, so the stream stands where the game's does. The turn scripts draw nothing.
 *
 * **Not modelled, and why** (listed in the handoff): the brothers' dialogue (the draw above is kept); event 7's extra side flip for a Berserk Biran (nothing reads his side once Yenke has fallen: the
 * half-HP action is cancelled and the defence swap needs a living partner); the camera's side words. (The question whether the game's default monster Attack is Bulldoze is answered, by the RE session's last pass:
 * a Berserk monster's default attack is its record's forced-action word, Biran's is Bulldoze, so Berserk's x3/2 applies; a Berserk Biran swings the engine's generic Attack here, whose numbers equal Bulldoze's and
 * which already takes the x3/2 as the default attack, so nothing changes: `research/re-ffx-targeting.md` section 3, FFX-G04, FFX-H02, `research/re-ffx-damage.md`.)
 *
 * The battle layer does not import `src/data`, so the ids are copied here and `tests/unit/chapters/biran-yenke-data.test.ts` pins that the copies agree with the data.
 */

import type { FFXCombatant, StatusInstance } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { ATTACK_ABILITY_ID } from '../registry.ts';
import { queuedKey } from '../ronso-rage.ts';
import { fiveQuarters } from './biran-yenke-stats.ts';
import type { UsedCommand } from './hooks.ts';
import { scriptMod } from './script-random.ts';
import type { AiContext } from './types.ts';
import { num } from './types.ts';

export const BIRAN_ID = 'biran-ronso' as const;
export const YENKE_ID = 'yenke-ronso' as const;
export const BIRAN_SCRIPT = 'biran-ronso' as const;
export const YENKE_SCRIPT = 'yenke-ronso' as const;
export const KIMAHRI_ID = 'kimahri' as const;

/** The brothers' own moves (`data/ffx/enemies/biran-yenke-abilities.ts`) and the party rows the scripts borrow (`thunder`, `blizzard`, `haste`: RE section 6). */
export const BULLDOZE = 'ronso-bulldoze' as const;
export const FIRE_BREATH = 'ronso-fire-breath' as const;
export const AQUA_BREATH = 'ronso-aqua-breath' as const;
export const BERSERK_SELF = 'ronso-berserk' as const;
export const BIRAN_MIGHTY_GUARD = 'biran-mighty-guard' as const;
export const YENKE_WHITE_WIND = 'yenke-white-wind' as const;

/** The private state of the two scripts (RE 5.2): the cycle step `v8`, the partner-dead flag `v9`, the half-HP state `v10`, and the side. */
export const V8_STEP = 'cycleStep';
export const V9_PARTNER_DEAD = 'partnerDead';
export const V10_HALF_HP = 'halfHp';
export const AREA = 'area';
/** `v10`: idle, armed (pending), spent or cancelled. `v9`: set. */
export const IDLE = 0;
export const PENDING = 128;
export const SPENT = 255;

/** The brothers' Defense after the swap is released (the record's 30), and while a partner stands guard. */
export const BASE_DEF = 30;
export const GUARD_DEF = 254;

/** The Kimahri Rage each brother casts at half HP (the lesson's Rage), and the move that stands for it. */
export const OWN_RAGE: Readonly<Record<string, { rage: string; move: string }>> = {
  [BIRAN_ID]: { rage: 'mighty-guard', move: BIRAN_MIGHTY_GUARD },
  [YENKE_ID]: { rage: 'white-wind', move: YENKE_WHITE_WIND },
};

type Memory = Record<string, number | string | boolean>;

export function partnerOf(ctx: Ctx, self: FFXCombatant): FFXCombatant | undefined {
  if (self.id === BIRAN_ID) return tryActor(ctx, YENKE_ID);
  if (self.id === YENKE_ID) return tryActor(ctx, BIRAN_ID);
  return undefined;
}

/** The brother's side (Area 0 or 1). */
export function areaOf(ctx: Ctx, c: FFXCombatant): number {
  return num(rtOf(ctx, c.id).ai, AREA, 0);
}

/** True while both brothers stand on the same side. */
export function sameSide(ctx: Ctx, a: FFXCombatant, b: FFXCombatant): boolean {
  return areaOf(ctx, a) === areaOf(ctx, b);
}

/** The battle flag `ronso.gate.<brother>`: 1 once that brother has queued his half-HP Rage, so Lancet may now offer his Mighty Guard or White Wind. For the guide and the advisor. */
export const GATE_FLAG_PREFIX = 'ronso.gate.';

/** The battle flag the guide's hints and the advisor read (`BattleState.flags`): 1 while both brothers stand on the same side, 0 while they are apart. */
export const SAME_SIDE_FLAG = 'ronso.sameSide';

/** Publish whether the brothers stand together (the opening, and after every Bulldoze). Nothing in the engine reads it back: it is for the guide and the advisor. */
export function publishSides(ctx: Ctx): void {
  const biran = tryActor(ctx, BIRAN_ID);
  const yenke = tryActor(ctx, YENKE_ID);
  if (biran !== undefined && yenke !== undefined) ctx.state.flags[SAME_SIDE_FLAG] = sameSide(ctx, biran, yenke) ? 1 : 0;
}

/** Bulldoze: the user's side flips (RE 5.3: Area 0 to 1 and back; the action is queued after the write). */
export function swapSide(ctx: Ctx, self: FFXCombatant): void {
  rtOf(ctx, self.id).ai[AREA] = areaOf(ctx, self) === 0 ? 1 : 0;
  publishSides(ctx);
}

/** Kimahri, the one living party member (no draw: one candidate). */
export function kimahriOf(ctx: Ctx): FFXCombatant | undefined {
  return tryActor(ctx, KIMAHRI_ID);
}

/**
 * A turn start (RE 5.2): arm the half-HP action, or react to the partner's death. Both are once-only states in the script's own memory.
 * The partner-dead reaction raises STR (Biran) or MAG (Yenke) by `floor(x / 4) x 5` at once and cancels any pending half-HP action for good.
 */
export function preTurnRules(ctx: Ctx, self: FFXCombatant): void {
  const partner = partnerOf(ctx, self);
  if (partner === undefined) return;
  const memory = rtOf(ctx, self.id).ai;
  const partnerAlive = isAlive(partner);
  if (partnerAlive && num(memory, V10_HALF_HP) === IDLE && self.hp < Math.trunc(self.stats.maxHp / 2)) {
    memory[V10_HALF_HP] = PENDING;
  }
  if (!partnerAlive && num(memory, V9_PARTNER_DEAD) === 0) {
    memory[V9_PARTNER_DEAD] = 128;
    memory[V10_HALF_HP] = SPENT; // cancels a pending half-HP action and forbids a future one
    if (self.id === BIRAN_ID) self.stats.str = fiveQuarters(self.stats.str);
    else self.stats.mag = fiveQuarters(self.stats.mag);
  }
}

/** The half-HP action, when it is pending: spend it, open the Rage gate, and name who it covers (both on the same side, else only the caster). Undefined when nothing is pending. */
export function takeHalfHpAction(ctx: Ctx, self: FFXCombatant, memory: Memory): { move: string; targets: string[] } | undefined {
  const own = OWN_RAGE[self.id];
  const partner = partnerOf(ctx, self);
  if (own === undefined || partner === undefined || num(memory, V10_HALF_HP) !== PENDING) return undefined;
  memory[V10_HALF_HP] = SPENT;
  memory[queuedKey(own.rage)] = true; // the Lancet gate opens when he QUEUES it, not when it resolves (RE section 7)
  ctx.state.flags[`${GATE_FLAG_PREFIX}${self.id}`] = 1; // for the guide and the advisor (the engine reads the memory above, not this flag)
  const together = isAlive(partner) && sameSide(ctx, self, partner);
  return { move: own.move, targets: together ? [self.id, partner.id] : [self.id] };
}

/** True once the partner has fallen and this brother has not yet reacted to it with his own command (Berserk for Biran, Haste for Yenke). */
export function partnerDeadAndUnanswered(ai: AiContext): boolean {
  return num(ai.memory, V9_PARTNER_DEAD) === 128;
}

/** The cycle: Biran Thunder, Bulldoze, Blizzard, Bulldoze; Yenke Fire Breath, Aqua Breath, Bulldoze (RE 5.3). A step that is a Bulldoze swaps the user's side first. */
export const CYCLE: Readonly<Record<string, readonly string[]>> = {
  [BIRAN_ID]: ['thunder', BULLDOZE, 'blizzard', BULLDOZE],
  [YENKE_ID]: [FIRE_BREATH, AQUA_BREATH, BULLDOZE],
};

// ---------------------------------------------------------------------------
// The defence swap (RE 5.6)
// ---------------------------------------------------------------------------

/** A fresh status that lasts until the script removes it (254, as every status with no counter of its own). */
function scriptStatus(id: 'sentinel'): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** `partner` stands guard: DEF 254 and Sentinel on until he is next hit. */
export function raiseGuard(ctx: Ctx, partner: FFXCombatant): void {
  partner.stats.def = GUARD_DEF;
  if (partner.statuses['sentinel'] === undefined) {
    const inst = scriptStatus('sentinel');
    partner.statuses['sentinel'] = inst;
    ctx.emit({ type: 'status-add', targetId: partner.id, status: 'sentinel', instance: { ...inst } });
  }
}

/** The release, after the hit: DEF back to 30 and Sentinel off (RE 5.7). */
export function releaseGuard(ctx: Ctx, self: FFXCombatant): void {
  self.stats.def = BASE_DEF;
  if (self.statuses['sentinel'] !== undefined) removeStatus(ctx, self, 'sentinel', 'expired');
}

/** The brother hears a command name him, before any damage: the six gates of RE 5.6, then the partner's guard. */
export function onBrotherTargeted(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void {
  const partner = partnerOf(ctx, self);
  if (partner === undefined || !isAlive(partner)) return; // 1. the partner lives
  if (used.def.damageType !== 'physical') return; // 2. physical (Lancet, items, spells never)
  if (used.def.id !== ATTACK_ABILITY_ID) return; // 3. the quirk: only Kimahri's plain Attack passes (Jump, Thrust Kick and the Rages fail)
  if (!sameSide(ctx, self, partner)) return; // 6. the two brothers stand on the same side
  raiseGuard(ctx, partner); // the hit brother is not changed
}

/** `v12`, the roll of the last non-lethal hit (RE 5.7). It starts at 200 and only the game's dialogue reads it (`v12 > 50` plays the line on a release), which this chapter does not show. */
export const V12_LAST_ROLL = 'lastRoll';
export const V12_START = 200;

/** The roll stored by the last non-lethal hit on `c`, or the script's starting 200 before any. */
export function lastRoll(ctx: Ctx, c: FFXCombatant): number {
  return num(rtOf(ctx, c.id).ai, V12_LAST_ROLL, V12_START);
}

/**
 * The brother was hit (once per action per target, after the hit and before the death check; RE 5.7).
 *
 * - **HP 0 (this action killed him):** Sentinel off, nothing more (the final lines are dialogue only). No draw. **The test is his HP, not `isAlive`**: a lethal hit holds the KO (`DamageEventInfo.holdKo`, `hit-apply.ts`) until
 *   after this hook, so a brother killed by the blow reaches it at HP 0 and still `alive` with no `ko` status, and `isAlive` would send every lethal blow down the living branch below (found by the RE session's last pass).
 * - **HP above 0:** if his Sentinel is on, the release (DEF back to 30, Sentinel off) -- **only then**: the script writes DEF only on that branch (the RE review, 2026-10-14). Then, always on this branch,
 *   `v12 := GetRandomValue() mod 100`: **one draw of the shared script stream (stream 2) per non-lethal hit event**. The stored value only ever chose a line of dialogue, which is not shown (the driver's
 *   decision: no dialogue), but the draw is kept so the stream stands where the game's does.
 */
export function onBrotherHit(ctx: Ctx, self: FFXCombatant): void {
  const sentinel = self.statuses['sentinel'] !== undefined;
  if (self.hp <= 0) {
    if (sentinel) removeStatus(ctx, self, 'sentinel', 'expired');
    return;
  }
  if (sentinel) releaseGuard(ctx, self);
  rtOf(ctx, self.id).ai[V12_LAST_ROLL] = scriptMod(ctx, 100);
}
