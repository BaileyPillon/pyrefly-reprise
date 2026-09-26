/**
 * CTB — Conditional Turn-Based turn order [ffx-combat-core §1].
 *
 * Every actor owns one integer counter; the lowest acts next. After acting the
 * counter grows by `baseCTB(agility) * rank`, halved under Haste and doubled
 * under Slow, and then the whole field is normalised by subtracting the new
 * minimum so "elapsed ticks" is well defined — which is what Regen is paid on.
 */

import type {
  Command,
  CombatantId,
  FFXCombatant,
  StatusId,
  TurnPreview,
} from '../common/types.ts';
import { baseCtb, icvVariance, idiv } from './math.ts';
import { letterTagsOf } from './letterTags.ts';
import {
  type Ctx,
  commandAbility,
  enemies,
  friendlies,
  has,
  inTurnQueue,
  onField,
  rankOf,
  rtOf,
  tryActor,
} from './state.ts';

/**
 * CTB tie-break priority when counters are equal [ffx-combat-core §1.6]:
 * Tidus -> Yuna -> Auron -> Kimahri -> Wakka -> Lulu -> Rikku -> the player's
 * aeon -> Cindy -> Sandy -> Mindy -> enemies -> Cid.
 */
const CHARACTER_PRIORITY: readonly string[] = [
  'tidus',
  'yuna',
  'auron',
  'kimahri',
  'wakka',
  'lulu',
  'rikku',
];

const MAGUS_PRIORITY: readonly string[] = ['cindy', 'sandy', 'mindy'];

/** Lower sorts earlier. */
export function tieBreakRank(ctx: Ctx, c: FFXCombatant): number {
  const charIndex = CHARACTER_PRIORITY.indexOf(c.id);
  if (charIndex >= 0) return charIndex;
  if (c.side === 'aeon') {
    const magus = MAGUS_PRIORITY.indexOf(c.id);
    return magus >= 0 ? 8 + magus : 7;
  }
  if (c.id === 'cid') return 1000;
  // Among enemies: formation order, which is boss-first then numbered ascending.
  const enemyIndex = ctx.state.enemyIds.indexOf(c.id);
  return 100 + (enemyIndex >= 0 ? enemyIndex : c.slot);
}

/**
 * Actors currently in the CTB queue.
 *
 * Membership is {@link inTurnQueue}, **not** {@link canAct}: §1.1's rule is
 * "living, non-Eject, non-Petrify". A sleeping or Threatened actor still owns a
 * counter and still reaches the front of the queue — it just loses the turn
 * when it gets there, which is the only place Sleep's duration is paid
 * [ffx-combat-core §1.1, §4.1].
 *
 * An actor marked `ActorRuntime.ordersOnly` is **on the field but owns no
 * counter**: Yojimbo's dog acts only when Yojimbo's own turn orders it
 * (`orders.ts`) [ffx-yojimbo §2.5]. Unset on every other actor, so every other
 * battle's queue is unchanged. FFX only.
 */
export function queueMembers(ctx: Ctx): FFXCombatant[] {
  return [...friendlies(ctx), ...enemies(ctx)].filter(
    (c) => onField(c) && inTurnQueue(c) && ctx.rt.actors.get(c.id)?.ordersOnly !== true,
  );
}

/**
 * Recovery in ticks for an action of this rank.
 *
 * `recovery = baseCTB(agility) * rank`, then `floor(/2)` under Haste or `x2`
 * under Slow [ffx-combat-core §1.1, §1.4].
 */
export function recoveryTicks(c: FFXCombatant, rank: number): number {
  let recovery = baseCtb(c.stats.agi) * Math.max(1, rank);
  if (has(c, 'haste')) recovery = idiv(recovery, 2);
  else if (has(c, 'slow')) recovery = recovery * 2;
  return recovery;
}

/** Subtract the field minimum from every counter; return how much was removed. */
export function normalise(ctx: Ctx): number {
  const members = queueMembers(ctx);
  if (members.length === 0) return 0;
  let min = Infinity;
  for (const c of members) {
    const v = rtOf(ctx, c.id).ctb;
    if (v < min) min = v;
  }
  if (!Number.isFinite(min) || min <= 0) return 0;
  for (const c of members) rtOf(ctx, c.id).ctb -= min;
  return min;
}

/** The actor whose turn is next, honouring the tie-break table. */
export function nextActor(ctx: Ctx): FFXCombatant | undefined {
  const members = queueMembers(ctx);
  if (members.length === 0) return undefined;
  let best: FFXCombatant | undefined;
  let bestCtb = Infinity;
  let bestRank = Infinity;
  for (const c of members) {
    const ctb = rtOf(ctx, c.id).ctb;
    const rank = tieBreakRank(ctx, c);
    if (ctb < bestCtb || (ctb === bestCtb && rank < bestRank)) {
      best = c;
      bestCtb = ctb;
      bestRank = rank;
    }
  }
  return best;
}

/** Charge an actor for the action it just took. */
export function chargeTurn(ctx: Ctx, id: CombatantId, rank: number): void {
  const c = tryActor(ctx, id);
  if (!c) return;
  rtOf(ctx, id).ctb += recoveryTicks(c, rank);
}

/**
 * Delay [ffx-combat-core §1.5]. Applied to the **target's** counter using the
 * **target's** base ticks. Enemies flagged `immune-to-delay` and Threatened
 * actors ignore both strengths.
 */
export function applyDelay(ctx: Ctx, targetId: CombatantId, strength: 'weak' | 'strong'): boolean {
  const c = tryActor(ctx, targetId);
  if (!c) return false;
  if (c.immunityFlags.includes('immune-to-delay')) return false;
  if (has(c, 'threaten')) return false;
  const base = baseCtb(c.stats.agi);
  rtOf(ctx, targetId).ctb += strength === 'weak' ? idiv(base * 3, 2) : base * 3;
  return true;
}

/**
 * Haste and Slow do not only change future recovery — applying one moves the
 * target's **current** counter at once [ffx-combat-core §1.4]. Haste uses the
 * `ctb` formula at base 8 with `heals` (halve the wait); Slow uses base 16
 * without it (double the wait).
 */
export function onHasteApplied(ctx: Ctx, targetId: CombatantId): void {
  const rt = rtOf(ctx, targetId);
  rt.ctb -= idiv(rt.ctb * 8, 16);
}

/** Slow adds 100% of the current counter. */
export function onSlowApplied(ctx: Ctx, targetId: CombatantId): void {
  const rt = rtOf(ctx, targetId);
  rt.ctb += idiv(rt.ctb * 16, 16);
}

/** A revived character re-enters with a rank-3 delay [ffx-combat-core §1.6]. */
export function onRevived(ctx: Ctx, targetId: CombatantId): void {
  const c = tryActor(ctx, targetId);
  if (!c) return;
  rtOf(ctx, targetId).ctb = baseCtb(c.stats.agi) * 3;
}

/**
 * Opening counters [ffx-combat-core §1.9].
 *
 * Normal condition draws a jitter of `[0, ICV_VARIANCE[agi]]` off the nominal
 * `baseCTB * 3` for party members, and pushes enemies 0-10% *slower*.
 * `first-strike` keeps a character at 0 in every condition.
 */
export function seedInitialCtb(ctx: Ctx, condition: 'normal' | 'preemptive' | 'ambush' | 'scripted'): void {
  const draw = (c: FFXCombatant, isParty: boolean): number => {
    const base = baseCtb(c.stats.agi);
    if (condition === 'scripted') return isParty ? base * 3 : base * 3;
    if (condition === 'preemptive') return isParty ? 0 : base * 3;
    if (condition === 'ambush') return isParty ? base * 3 : 0;
    if (isParty) {
      const jitter = ctx.rng.int(0, icvVariance(c.stats.agi));
      return base * 3 - jitter;
    }
    return idiv(base * 3 * 100, 100 - ctx.rng.int(0, 10));
  };

  for (const c of friendlies(ctx)) {
    const hasFirstStrike =
      c.equipment !== undefined &&
      (c.equipment.weapon.autoAbilities.includes('first-strike') ||
        c.equipment.armor.autoAbilities.includes('first-strike'));
    let value = hasFirstStrike ? 0 : draw(c, true);
    if (value > 0 && has(c, 'haste')) value = idiv(value, 2);
    rtOf(ctx, c.id).ctb = value;
  }
  for (const c of enemies(ctx)) {
    rtOf(ctx, c.id).ctb = draw(c, false);
  }
  normalise(ctx);
}

// ---------------------------------------------------------------------------
// Turn forecast [ffx-combat-core §1.6, visual-bible §3.2]
// ---------------------------------------------------------------------------

/** Statuses worth a pip in the CTB list, most alarming first. */
const ICON_PRIORITY: readonly StatusId[] = [
  'ko',
  'petrify',
  'zombie',
  'doom',
  'curse',
  'confuse',
  'berserk',
  'sleep',
  'silence',
  'poison',
  'darkness',
  'slow',
  'haste',
  'auto-life',
  'reflect',
  'regen',
  'protect',
  'shell',
  'shield',
  'boost',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
];

/** At most three status pips, in {@link ICON_PRIORITY} order. */
export function statusIconsFor(c: FFXCombatant): StatusId[] {
  const out: StatusId[] = [];
  for (const s of ICON_PRIORITY) {
    if (has(c, s)) out.push(s);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * The duplicate-enemy letters for the CTB tile, cached per battle. The rule
 * itself is `./letterTags.ts` (shared with the advisor card and the strategy
 * panel, PR-0208).
 *
 * **Assigned once per battle, from the formation's roster.** The first cut read
 * the *live* field, so when one of Chapter 3's two Yu Pagodas died the group
 * fell below two and the survivor silently became plain "Yu Pagoda" (round 04
 * PR-0023). The roster holds every enemy record whether standing, dead or sent,
 * so the map is recomputed only if the roster itself grows, never as one dies.
 *
 * FFX only: FFX-2's ATB HUD builds its rows elsewhere and is untouched.
 */
function letterTags(ctx: Ctx): ReadonlyMap<CombatantId, string> {
  const roster = ctx.state.enemyIds;
  const cached = ctx.rt.letterTags;
  if (cached && cached.rosterSize === roster.length) return cached.tags;
  const tags = letterTagsOf(ctx.state);
  ctx.rt.letterTags = { rosterSize: roster.length, tags };
  return tags;
}

function letterTagFor(ctx: Ctx, c: FFXCombatant): string | undefined {
  if (c.side !== 'enemy') return undefined;
  return letterTags(ctx).get(c.id);
}

function overdriveReady(c: FFXCombatant): boolean {
  if (has(c, 'curse')) return false;
  const od = c.overdrive;
  if (!od) return false;
  const temp = c.aeon?.temporaryOverdrive;
  return (temp !== null && temp !== undefined && temp >= 100) || od.gauge >= 100;
}

function previewRow(ctx: Ctx, c: FFXCombatant, tickValue: number, index: number): TurnPreview {
  const charge = rtOf(ctx, c.id).charge;
  const row: TurnPreview = {
    actorId: c.id,
    tickValue,
    index,
    isParty: c.side !== 'enemy',
    statusIcons: statusIconsFor(c),
    overdriveReady: overdriveReady(c),
  };
  const letter = letterTagFor(ctx, c);
  if (letter !== undefined) row.letterTag = letter;
  if (c.portraitKey !== undefined) row.portraitKey = c.portraitKey;
  if (charge) row.chargeStage = charge.stage;
  return row;
}

/**
 * The next `n` turns, ascending by tick value.
 *
 * The forecast assumes every actor uses a **rank-3** action; passing
 * `previewCommand` re-runs it with that command's rank applied to the actor
 * who is acting now. It is a projection, not a promise
 * [ffx-combat-core §1.6].
 */
export function predictTurnOrder(ctx: Ctx, n: number, previewCommand?: Command): TurnPreview[] {
  const members = queueMembers(ctx);
  if (members.length === 0 || n <= 0) return [];

  const counters = new Map<CombatantId, number>();
  for (const c of members) counters.set(c.id, rtOf(ctx, c.id).ctb);

  let previewRank: number | null = null;
  if (previewCommand) {
    const def = commandAbility(ctx, previewCommand);
    previewRank = def ? rankOf(def) : previewCommand.kind === 'escape' ? 1 : 3;
  }

  const out: TurnPreview[] = [];
  let first = true;
  for (let i = 0; i < n; i++) {
    let best: FFXCombatant | undefined;
    let bestCtb = Infinity;
    let bestRank = Infinity;
    for (const c of members) {
      const ctb = counters.get(c.id) ?? 0;
      const rank = tieBreakRank(ctx, c);
      if (ctb < bestCtb || (ctb === bestCtb && rank < bestRank)) {
        best = c;
        bestCtb = ctb;
        bestRank = rank;
      }
    }
    if (!best) break;
    out.push(previewRow(ctx, best, bestCtb, i));
    const rank = first && previewRank !== null ? previewRank : 3;
    counters.set(best.id, bestCtb + recoveryTicks(best, rank));
    first = false;
  }
  return out;
}
