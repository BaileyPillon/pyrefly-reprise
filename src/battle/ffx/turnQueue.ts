/**
 * CTB — Conditional Turn-Based turn order [ffx-combat-core §1], run by the game's own kernels (re-parity W2; FFX only).
 *
 * Every combatant owns one BYTE counter that the clock counts down; the one at 0 acts, ties go by the game's key
 * (higher Agility first among the party and the aeons, then the monsters in formation order). After an action the counter
 * grows by `HasteSlow(tickSpeed(AGI) * max(rank, 1))`. The arithmetic is `kernel/ctb*.ts` (proven against FFX.exe in
 * `tests/unit/parity-ffx-ctb.test.ts`); `./adapt/ctb.ts` hands it the engine's combatants and this file is the engine's
 * API over it. Regen's payout is the holder's own tick counter (`ActorRuntime.regenTicks`), counted by the same clock.
 */

import type { Command, CombatantId, FFXCombatant, StatusId, TurnPreview } from '../common/types.ts';
import { tieKey } from './kernel/ctb.ts';
import { letterTagsOf } from './letterTags.ts';
import {
  advanceClock,
  charge,
  nextReady,
  openingCtb,
  recoveryOf,
  reviveCounter,
} from './adapt/ctb.ts';
import { slotOf } from './adapt/slots.ts';
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
 * The key the game sorts the ready characters by, smaller first: `(255 - AGI) * 256 + slot` for a party member or an
 * aeon (higher Agility first, equal Agility to the lower slot) and `slot + 0x10000` for a monster, so every party member and
 * aeon goes before every monster and the monsters go in formation order [`kernel/ctb.ts#tieKey`, VA 0x0078f000].
 */
export function tieBreakRank(ctx: Ctx, c: FFXCombatant): number {
  return tieKey(slotOf(ctx, c), c.stats.agi);
}

/**
 * Actors currently in the CTB queue.
 *
 * Membership is {@link inTurnQueue}, **not** {@link canAct}: §1.1's rule is
 * "living, non-Eject, non-Petrify". A sleeping actor still owns a counter and
 * still reaches the front of the queue — it just loses the turn when it gets
 * there, which is the only place Sleep's duration is paid [ffx-combat-core §1.1,
 * §4.1]. (A Threatened one loses nothing: its counter was moved when the Threaten
 * landed, and the pair is released at the start of the next turn of either end.)
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

/** Recovery in ticks for an action of this rank: `HasteSlow(tickSpeed(AGI) * max(rank, 1))`, clamped to 0..255 [VA 0x0078d1d0]. */
export function recoveryTicks(c: FFXCombatant, rank: number): number {
  return recoveryOf(c, rank);
}

/**
 * Run the clock until somebody is ready; return the ticks that took. (It used to subtract the field's minimum; the game
 * counts every counter down instead, and the result for the characters who take part is the same.)
 */
export function advance(ctx: Ctx): number {
  return advanceClock(ctx);
}

/** The actor whose turn is next: the first ready character in the game's order. */
export function nextActor(ctx: Ctx): FFXCombatant | undefined {
  return nextReady(ctx);
}

/** Charge an actor for the action it just took. */
export function chargeTurn(ctx: Ctx, id: CombatantId, rank: number): void {
  const c = tryActor(ctx, id);
  if (!c) return;
  charge(ctx, c, rank);
}

/** A revived character re-enters with the counter stored at battle start [VA 0x0078d530]. */
export function onRevived(ctx: Ctx, targetId: CombatantId): void {
  const c = tryActor(ctx, targetId);
  if (!c) return;
  reviveCounter(ctx, c);
}

/** Opening counters [VA 0x0078ded0]; see {@link openingCtb}. */
export function seedInitialCtb(ctx: Ctx, condition: 'normal' | 'preemptive' | 'ambush' | 'scripted'): void {
  openingCtb(ctx, condition);
}

// ---------------------------------------------------------------------------
// Turn forecast [ffx-combat-core §1.6, visual-bible §3.2]
// ---------------------------------------------------------------------------

/**
 * Statuses worth a pip in the CTB list, most alarming first. Exported (fb-0929) so the party plate
 * (`ui/ffx/statusPips.ts`) draws its pips in the same order and never drops a Zombie off the end.
 */
export const ICON_PRIORITY: readonly StatusId[] = [
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
