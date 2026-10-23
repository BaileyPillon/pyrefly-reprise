/**
 * The presenter's half of the PRO STAGING (lane "pro-staging"; the switch, the four pieces and the game case are in `pro/staging/StagingSwitch.ts`; the picture is the DOM layer's, `ui/common/proStage/`). Small beats
 * the presenter's handlers call, each a no-op unless the staging is on in a demo chapter and its piece is on, and a port (`deps.staging`) is there to draw it. Same rules as the other beat modules: no `three`, no DOM,
 * ports only; nothing here waits on the layer (a hold the presenter needs is its own `ctx.sleep`).
 *
 * The held breath (a boss's big blow: Total Annihilation, FFX only; Mega Flare, FFX-2 only):
 *  - {@link stageMark}: the move begins (`action-start`) or, in FFX, its ladder reaches "imminent" (`charge`): a small name and a rim under the boss, kept while the party acts;
 *  - {@link stageTell}: the first blow's effect starts (`awaitSpellLanding`): the arena drains toward ivory over the effect's own lead-in, the HUD sinks, a ring gathers, light flows in;
 *  - {@link stageBlow}: the effect's mark lands (the same beat feel's hit-stop, punch and rumble fire on): the core flashes and Mega Flare's flood opens around the party;
 *  - {@link stageLift}: the action ends: the wash lifts and the HUD returns.
 * None of them adds a millisecond to the move: the tell is the lead-in the effect already has.
 */
import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import type { ActingAction } from './BattlePresenterSpellFx.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { stagingGame, stagingPieceOn } from './pro/staging/StagingSwitch.ts';
import { bigMoveOf, type BigMove, type StageFacts, type StagingPort } from './pro/staging/StagingPort.ts';
import { SPECIAL_HOLD_CAP_MS } from './spellfx/SpellFxSpecials.ts';

/** The port, when the piece is on and a layer is mounted; null otherwise. */
export function stagingPort(ctx: EventCtx, piece: 'breath' | 'ending' | 'opening'): StagingPort | null {
  const port = ctx.deps.staging ?? null;
  if (port === null || ctx.speed() === 'skip' || !stagingPieceOn(piece)) return null;
  return port;
}

/** How the cue should play: the game, the speed's factor, REDUCE MOTION, REDUCE FLASHES. */
export function stageFacts(ctx: EventCtx): StageFacts {
  return { game: stagingGame(), scale: SPEED_SCALE[ctx.speed()] || 1, calm: ctx.moments?.reducedMotion === true, tame: ctx.moments?.reducedFlashes === true };
}

/** The party's ids on the field now (the aeon counts as the party). */
function partyOf(ctx: EventCtx): string[] {
  return ctx.stage.staged().filter((id) => {
    const side = ctx.stage.sideOf(id);
    return side === 'party' || side === 'aeon';
  });
}

/** The foe-side figures other than the attacker: they stand with it (Seymour on Mortiorchis) and keep their colour. */
function companionsOf(ctx: EventCtx, attacker: CombatantId): string[] {
  return ctx.stage.staged().filter((id) => id !== attacker && ctx.stage.sideOf(id) === 'enemy');
}

/** What is staged now, per presenter: the move, its attacker, the action's serial. */
const live = new WeakMap<EventCtx, { move: BigMove; attacker: CombatantId; name: string }>();

/** A move's display name, as the layer sets it small under the boss. */
const NAME_OF: Readonly<Record<BigMove, string>> = { 'total-annihilation': 'Total Annihilation', 'mega-flare': 'Mega Flare' };

/** The ladder's own name for a move (`charge` events carry the name, not the id). */
export function moveOfName(name: string | undefined): BigMove | null {
  const n = (name ?? '').trim().toLowerCase();
  if (n === 'total annihilation') return 'total-annihilation';
  if (n === 'mega flare') return 'mega-flare';
  return null;
}

function begin(ctx: EventCtx, port: StagingPort, move: BigMove, attacker: CombatantId): void {
  const facts = stageFacts(ctx);
  if (bigMoveOf(move, facts.game) === null) return; // the move is the other game's (never staged here)
  const was = live.get(ctx);
  if (was?.move === move && was.attacker === attacker) return; // already marked
  live.set(ctx, { move, attacker, name: NAME_OF[move] });
  setCompanions(port, companionsOf(ctx, attacker));
  port.breath({ ...facts, kind: 'mark', move, name: NAME_OF[move], attacker, party: partyOf(ctx) });
}

/** The layer keeps the foe-side figures that keep colour with the attacker (an optional method: a port without it draws the attacker alone). */
function setCompanions(port: StagingPort, ids: readonly string[]): void {
  (port as { setCompanions?: (ids: readonly string[]) => void }).setCompanions?.(ids);
}

/** `action-start`: a boss's big move begins. */
export function stageMark(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || ctx.stage.sideOf(event.actorId) !== 'enemy') return;
  const move = bigMoveOf(event.abilityId, stagingGame());
  if (move !== null) begin(ctx, port, move, event.actorId);
}

/** `charge`: FFX's ladder reaches "imminent" (the move lands next turn): the marker goes on and stays while the party acts. FFX-2's countdown is marked at the action's own start. */
export function stageCharge(ctx: EventCtx, event: Extract<BattleEvent, { type: 'charge' }>): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || event.stage !== 2) return;
  const move = moveOfName(event.name);
  if (move !== null) begin(ctx, port, move, event.enemyId);
}

/** The first blow's effect begins and says it lands in `ms`: the tell. */
export function stageTell(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined, ms: number): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || a === undefined || (event.hitIndex ?? 0) !== 0 || ms <= 0 || ctx.stage.sideOf(a.actorId) !== 'enemy') return;
  const move = bigMoveOf(a.abilityId, stagingGame());
  if (move === null) return;
  begin(ctx, port, move, a.actorId);
  const msToBlow = Math.min(ms, SPECIAL_HOLD_CAP_MS) * (SPEED_SCALE[ctx.speed()] || 1);
  port.breath({ ...stageFacts(ctx), kind: 'tell', move, name: NAME_OF[move], attacker: a.actorId, party: partyOf(ctx), msToBlow });
}

/** The effect's mark has landed: the blow. Once per move (a move's later blows do not flash again). */
const blown = new WeakMap<EventCtx, string>();
export function stageBlow(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined): void {
  const port = stagingPort(ctx, 'breath');
  const l = live.get(ctx);
  if (!port || a === undefined || l === undefined || l.attacker !== a.actorId) return;
  const key = `${a.serial}`;
  if (blown.get(ctx) === key) return;
  blown.set(ctx, key);
  port.breath({ ...stageFacts(ctx), kind: 'blow', move: l.move, attacker: l.attacker });
  void event;
}

/** An action has ended: if it was the staged move's, the wash lifts. */
export function stageLift(ctx: EventCtx, endedId: CombatantId | null | undefined): void {
  const l = live.get(ctx);
  if (l === undefined || endedId === null || endedId === undefined || l.attacker !== endedId) return;
  live.delete(ctx);
  blown.delete(ctx);
  const port = ctx.deps.staging ?? null;
  port?.breath({ ...stageFacts(ctx), kind: 'lift' });
}
