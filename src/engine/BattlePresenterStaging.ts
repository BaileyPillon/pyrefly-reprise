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
import type { PlaybackSpeed } from './BattlePresenterPorts.ts';
import { actionOfBlow, type ActingAction } from './BattlePresenterSpellFx.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { menuBlocks } from './KeySlots.ts';
import { stagingGame, stagingPieceOn } from './pro/staging/StagingSwitch.ts';
import { bigMoveOf, type BigMove, type StageFacts, type StagingPort } from './pro/staging/StagingPort.ts';
import type { DemoGame } from './motion/DemoGate.ts';
import { SPECIAL_HOLD_CAP_MS } from './spellfx/SpellFxSpecials.ts';
import { realVictoryOf } from './motion/RealMotion.ts';
import { FREEZE_HOLD_MS, STAND_DOWN_MIN_MS, cheerHoldMs } from './pro/staging/EndingPlan.ts';
import { setDefeatNote } from './pro/staging/DefeatNote.ts';

/** The port, when the piece is on and a layer is mounted; null otherwise. */
export function stagingPort(ctx: EventCtx, piece: 'breath' | 'ending' | 'opening'): StagingPort | null {
  const port = ctx.deps?.staging ?? null;
  if (port === null || ctx.speed() === 'skip' || !stagingPieceOn(piece)) return null;
  return port;
}

/** How the cue should play: the game, the speed's factor, REDUCE MOTION, REDUCE FLASHES. */
export function stageFacts(ctx: EventCtx): StageFacts {
  return factsFor(ctx.speed(), ctx.moments?.reducedMotion === true, ctx.moments?.reducedFlashes === true, menuBlocks(ctx)); // asked as the look begins, like every FFX-2 look (`motion/MenuHold.ts`)
}

/** The same from the three answers themselves (`BattleMoments` has no event context). */
export function factsFor(speed: PlaybackSpeed, calm: boolean, tame: boolean, menu = false): StageFacts {
  return { game: stagingGame(), scale: SPEED_SCALE[speed] || 1, calm, tame, ...(menu ? { menu: true } : {}) };
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

/**
 * The move a `charge` event's name announces, in this game. FFX's Mortiorchis announces Total Annihilation in two captions, `Auto-Attack Mode` (stage 1) and `Ready To Annihilate` (stage 2, the mount's last turn before it;
 * `battle/ffx/ai/seymour-flux-rules.ts#announceCharge`); FFX-2's Bahamut counts `5`, `4`, `3`, `2`, `1` (stage 2 from `2`; `battle/ffx2/ai/bahamut.ts#countdownTurn`) before Mega Flare. Only the "imminent" captions name the move: the
 * first FFX caption (`Auto-Attack Mode`) and the numbers above `2` do not.
 */
export function moveOfName(name: string | undefined, game: DemoGame = stagingGame()): BigMove | null {
  const n = (name ?? '').trim().toLowerCase();
  if (game === 'ffx') return n === 'ready to annihilate' || n === 'total annihilation' ? 'total-annihilation' : null;
  return n === '2' || n === '1' || n === 'mega flare' ? 'mega-flare' : null;
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

/**
 * How long before Total Annihilation's first blow its tell begins, ms: the move's own start. Its effect says it lands only 0.26 s after the first damage event (`vfx.land`: the wind-up before that event is the presenter's own, about a second),
 * so FFX's tell runs from the action's start, not from the effect's: the book's real frames measure the first hit about 1.26 s after the move starts (`boss-attack-intro/NOTES.md`), minus the action's opening. [ours] FFX-2's Mega Flare tells from the
 * first blow, where the effect's own 1.45 s lead-in is the tell.
 */
export const FFX_TA_LEAD_MS = 1100;

/** `action-start`: a boss's big move begins. FFX's Total Annihilation tells from here (see {@link FFX_TA_LEAD_MS}). */
export function stageMark(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || ctx.stage.sideOf(event.actorId) !== 'enemy') return;
  const move = bigMoveOf(event.abilityId, stagingGame());
  if (move === null) return;
  begin(ctx, port, move, event.actorId);
  if (move === 'total-annihilation' && ctx.acting !== undefined && told.get(ctx) !== ctx.acting.serial) {
    told.set(ctx, ctx.acting.serial);
    port.breath({ ...stageFacts(ctx), kind: 'tell', move, name: NAME_OF[move], attacker: event.actorId, party: partyOf(ctx), msToBlow: FFX_TA_LEAD_MS * (SPEED_SCALE[ctx.speed()] || 1) });
  }
}

/** `charge`: FFX's ladder reaches "imminent" (the move lands next turn): the marker goes on and stays while the party acts. FFX-2's countdown is marked at the action's own start. */
export function stageCharge(ctx: EventCtx, event: Extract<BattleEvent, { type: 'charge' }>): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || event.stage !== 2) return;
  const move = moveOfName(event.name);
  if (move !== null) begin(ctx, port, move, event.enemyId);
}

/** The action serial each presenter has told once: a group move (Mega Flare on three girls) asks the effect once per target, but its tell is the first blow's alone. */
const told = new WeakMap<EventCtx, number>();

/** The first blow's effect begins and says it lands in `ms`: the tell. */
export function stageTell(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined, ms: number): void {
  const port = stagingPort(ctx, 'breath');
  if (!port || a === undefined || (event.hitIndex ?? 0) !== 0 || ms <= 0 || ctx.stage.sideOf(a.actorId) !== 'enemy') return;
  const move = bigMoveOf(a.abilityId, stagingGame());
  if (move === null || told.get(ctx) === a.serial) return;
  told.set(ctx, a.serial);
  begin(ctx, port, move, a.actorId);
  const msToBlow = Math.min(ms, SPECIAL_HOLD_CAP_MS) * (SPEED_SCALE[ctx.speed()] || 1);
  port.breath({ ...stageFacts(ctx), kind: 'tell', move, name: NAME_OF[move], attacker: a.actorId, party: partyOf(ctx), msToBlow });
}

/** The effect's mark has landed: the blow. Once per move (a move's later blows do not flash again). */
const blown = new WeakMap<EventCtx, string>();
export function stageBlow(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined): void {
  const port = stagingPort(ctx, 'breath');
  const l = live.get(ctx);
  if (!port || a === undefined || l === undefined || l.attacker !== a.actorId || bigMoveOf(a.abilityId, stagingGame()) !== l.move) return; // the attacker's other moves (Impulse between the countdown numbers) are not the blow
  const key = `${a.serial}`;
  if (blown.get(ctx) === key) return;
  blown.set(ctx, key);
  port.breath({ ...stageFacts(ctx), kind: 'blow', move: l.move, attacker: l.attacker });
  void event;
}

/**
 * The wash lifts. `'action'`: an action of the attacker has ended; it lifts only if that action IS the staged move (FFX-2's Bahamut acts between the countdown numbers, and the marker waits through those:
 * the first browser run of the real fight lifted at the first Impulse). `'ko'`: the attacker fell, whatever it was doing.
 */
export function stageLift(ctx: EventCtx, endedId: CombatantId | null | undefined, how: 'action' | 'ko' = 'ko'): void {
  const l = live.get(ctx);
  if (l === undefined || endedId === null || endedId === undefined || l.attacker !== endedId) return;
  if (how === 'action' && bigMoveOf(actionOfBlow(ctx, endedId)?.abilityId, stagingGame()) !== l.move) return;
  live.delete(ctx);
  blown.delete(ctx);
  const port = ctx.deps?.staging ?? null;
  port?.breath({ ...stageFacts(ctx), kind: 'lift' });
}

// ------------------------------------------------------------------ the ending

/** What ended up held on the field for a freeze: option C's hit-stop clock (the feel lane's), when BATTLE SPECTACLE is on (`FxStagePort.freeze`). */
interface Freezable {
  enabled(): boolean;
  freeze?(ms: number): void;
}

/** The foe the last blow felled, per presenter (the title names it). */
const felled = new WeakMap<EventCtx, CombatantId>();
/** One freeze per fight: the killing blow of a chain's last link. */
const frozen = new WeakSet<EventCtx>();

/** The foe's latest move, per presenter: the defeat card names it ("Felled by Total Annihilation"). */
const foeMove = new WeakMap<EventCtx, string>();

/** `action-start` by a foe: remember its move's name for the defeat card. */
export function noteFoeMove(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): void {
  if (!stagingPort(ctx, 'ending') || ctx.stage.sideOf(event.actorId) !== 'enemy' || !event.abilityName) return;
  foeMove.set(ctx, event.abilityName);
}

/**
 * A foe is KO'd. If it is the last of the fight (a `victory` follows in this burst and no later link chains on), the frame HOLDS on the killing blow: the layer flashes, rings and takes the HUD out, the field's clock
 * is stopped, the presenter waits. Returns the wait (a promise) or undefined; the caller awaits it before the foe is sent. REDUCE MOTION holds nothing (the freeze is one of the four things it turns off) but the
 * flash, a glow, still opens the beat.
 */
export function stageFreeze(ctx: EventCtx, id: CombatantId): Promise<void> | undefined {
  const port = stagingPort(ctx, 'ending');
  if (!port || ctx.moreLinks === true) return undefined;
  // the last foe of the fight: a victory follows in this burst (FFX), or no other foe stands on the field (FFX-2's ATB emits the victory from a later tick, so the burst of the killing blow does not hold it)
  const b = ctx.burst;
  const victoryNext = b !== undefined && b.events.slice(b.at + 1).some((e) => e.type === 'victory');
  const lastFoe = !ctx.stage.staged().some((other) => other !== id && ctx.stage.sideOf(other) === 'enemy');
  if (!victoryNext && !lastFoe) return undefined;
  felled.set(ctx, id);
  if (frozen.has(ctx)) return undefined;
  const facts = stageFacts(ctx);
  if (facts.menu === true) return undefined; // FFX-2: a command menu is open as the killing blow lands: nothing plays over it (D-357); the title still comes with the victory
  frozen.add(ctx);
  const hold = facts.calm ? 0 : FREEZE_HOLD_MS;
  port.ending({ ...facts, kind: 'freeze', boss: id, holdMs: hold });
  if (hold <= 0) return undefined;
  const fx = (ctx.stage as { fx?: Freezable }).fx;
  if (fx?.enabled() === true) fx.freeze?.(hold * facts.scale);
  return ctx.sleep(hold);
}

/** The cheer's length for FFX: the longest real clip among the party (`data/motion/realMotion.ts` `poseMs`, PROVEN: Tidus 3,666.7 ms), at least `floor`. */
function cheerFloorMs(ctx: EventCtx, floor: number): number {
  const lengths = partyOf(ctx).map((id) => realVictoryOf('ffx', ctx.stage.artOf?.(id) ?? id)?.poseMs);
  return cheerHoldMs(lengths, floor);
}

/**
 * The victory beat: the quiet title, and the hold the cheer needs. `kind` is the chapter's own: `'pose'` (FFX: the party cheers; the hold is the real clip's) or `'hold'` (FFX-2 Chapter IV: the sources withhold the pose, the
 * fanfare and the quip after Bahamut, so nothing is celebrated: the party stands, the title is quiet and the silent pull-back is the transition into the results). Returns the least ms the beat must hold (0 when not staged).
 */
export function stageVictory(ctx: EventCtx, kind: 'pose' | 'hold', floor: number): number {
  const port = stagingPort(ctx, 'ending');
  if (!port) return 0;
  const facts = stageFacts(ctx);
  const boss = felled.get(ctx);
  port.ending({ ...facts, kind: 'title', boss: boss ?? '' });
  if (kind === 'pose') return cheerFloorMs(ctx, floor);
  const hold = Math.max(floor, STAND_DOWN_MIN_MS);
  const pullMs = 1200;
  void ctx.sleep(hold - pullMs - 150).then(() => {
    port.ending({ ...stageFacts(ctx), kind: 'pullback', ms: pullMs });
    ctx.stage.camera.push?.(-0.05, pullMs * facts.scale)?.catch(() => undefined); // a quiet draw back into the results: a transition, not a pose
  });
  return hold;
}

/** The last party member falls: the scene stays under a light dim and a caption drops in; the card is the flow's overlay. True when the staging took the defeat's grade (the caller then skips today's black flash). */
export function stageFall(ctx: EventCtx): boolean {
  const port = stagingPort(ctx, 'ending');
  if (!port) return false;
  const facts = stageFacts(ctx);
  setDefeatNote({ ...(foeMove.has(ctx) ? { cause: foeMove.get(ctx)! } : {}) });
  port.ending({ ...facts, kind: 'fall', party: partyOf(ctx) });
  return true;
}

// ----------------------------------------------------------------- the openings

/** `spherechange` (FFX-2 only): the HUD's flourish plays as it always did; its name plate is made readable (a pearl plate) for as long as it shows. */
export function stageChange(ctx: EventCtx, event: Extract<BattleEvent, { type: 'spherechange' }>): void {
  const port = stagingPort(ctx, 'opening');
  if (!port || stagingGame() !== 'ffx2') return;
  const gate = event.gatesCrossed[event.gatesCrossed.length - 1];
  port.opening({ ...stageFacts(ctx), kind: 'change', actor: event.who, dress: event.to, gate });
}

/**
 * Does the pro staging replace the splash cut-in (option C6: a sunburst and a cream ribbon with the name, the big banner of today's Overdrive opening and of Mega Flare's start) for this action? Only while the piece that
 * replaces it is on and the layer is there: an FFX Overdrive with the `opening` piece, Total Annihilation or Mega Flare with the `breath` piece. With the staging off the splash plays as it always did.
 */
export function stagingTakesSplash(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>, kind: 'overdrive' | 'special' | 'other'): boolean {
  if (kind === 'overdrive') return stagingPort(ctx, 'opening') !== null && stagingGame() === 'ffx';
  return kind === 'special' && stagingPort(ctx, 'breath') !== null && ctx.stage.sideOf(event.actorId) === 'enemy' && bigMoveOf(event.abilityId, stagingGame()) !== null;
}
