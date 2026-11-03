/**
 * **The glyph platforms** (FFX only; the hidden Spectral Keeper chapter; `research/re-ffx-spectral-keeper.md` sections 2 to 5): where each of the front line stands, which platforms are free, the Keeper's "platform in front",
 * the hit counter and the live mines, and the Move command. Pure, deterministic, no DOM [AGENTS.md hard rule 1].
 *
 * ## What the game does
 *
 * Every actor has a **Position** byte (property 29): 1 to 6 are the ring's platforms, 7 is the aeon rock. A Circle (monster file `m146`) stands for each platform; the Circle of an occupied platform is untargetable, and a Circle is
 * only ever targetable by **Move** (RE 3 item 4). Move costs the character's turn at rank 3 (RE 3 item 5); the Warp hop writes the new Position at its end, and the vacated platform is free again. A KO keeps its platform; an
 * Eject frees it; a Switch hands the platform to the member coming in (RE 3 item 6, "probably" for the hand-over: the swap routine copies the position bytes).
 *
 * ## How this engine holds it
 *
 * - **State is `state.flags`** (`plat.*`, the keys of `./ai/spectral-keeper-rules.ts`), like the aeon duel's, so a rebuilt runtime, a fork and the advisor's dry runs see the same battle. Nothing is added to the contract's combatant.
 * - **A free platform is a platform nobody on the front line stands on.** The game flips the Circle's targetable bit; here "occupied" is read from the three active members (a KO'd member still holds its platform, an Ejected one
 *   does not: `onField`), so the two can never disagree. A ticking mine does not make a platform unavailable: a character can Move onto it (RE 3 item 4).
 * - **The Circles are combatants that are never targetable** (`flags.untargetable`, so no ordinary command, no `all-enemies` and no random pick ever reaches one), never part of the victory (`nonCombatant`), and have no turn
 *   while idle (`ordersOnly`). The Move row lists the free ones itself ({@link moveRows}) and {@link moveTrigger} does what the Circle's `onTargeted` does in the game.
 * - **The clock still counts an idle Circle** (`adapt/ctb.ts` through {@link isIdleCycler}): its counter cycles to the stored base, which is what makes a mine's fuse "between one tick and one full base" (RE 5.4). Arming a Circle
 *   only gives it turns; its next time at 0 is the blast.
 */

import type { AvailableCommand, CombatantId, EnemyGroupDef, FFXCombatant, TriggerCommand } from '../common/types.ts';
import { type Ctx, onField, rtOf, tryActor } from './state.ts';
import {
  ARMED_PREFIX,
  AT_PREFIX,
  CIRCLE_IDS,
  CIRCLE_SCRIPT,
  CIRCLE_SCRIPT_AGI,
  COUNT_FLAG,
  FIRST_STRIKE_FLAG,
  FRONT_FLAG,
  FRONT_START,
  KEEPER_ROWS,
  MINES_FLAG,
  RING_FLAG,
  RING_PLATFORMS,
  ROCK_PLATFORM,
  START_PLATFORMS,
} from './ai/spectral-keeper-rules.ts';
import { scriptIdOf } from './ai/hooks.ts';
import { heldPlatform, occupiedPlatforms, standingIds } from './platformOccupancy.ts'; // the state-only half (who holds a platform), shared with the stage's painted glyphs

/** Is this battle one that runs the glyph platforms (its formation said so at set-up)? */
export function ringActive(ctx: Ctx): boolean {
  return ctx.state.flags[RING_FLAG] === true;
}

const atKey = (id: CombatantId): string => AT_PREFIX + id;
const armedKey = (id: CombatantId): string => ARMED_PREFIX + id;

/** The platform a character stands on (1 to 6, 7 for the rock), or `undefined` when it has none (a benched member, an aeon). */
export function platformOf(ctx: Ctx, id: CombatantId): number | undefined {
  return heldPlatform(ctx.state.flags, id);
}

/** Put a character on a platform. */
export function setPlatform(ctx: Ctx, id: CombatantId, platform: number): void {
  ctx.state.flags[atKey(id)] = platform;
}

/** The platform number a Circle stands for (`spectral-circle-3` is 3), or `undefined` for anything else. */
export function circlePlatform(id: CombatantId): number | undefined {
  const index = (CIRCLE_IDS as readonly string[]).indexOf(id);
  return index < 0 ? undefined : index + 1;
}

/** The Circle of a platform number. */
export function circleOf(ctx: Ctx, platform: number): FFXCombatant | undefined {
  const id = CIRCLE_IDS[platform - 1];
  return id === undefined ? undefined : tryActor(ctx, id);
}

/** Is this combatant one of the formation's Circles (by its script, so a clone of the data still counts)? */
export function isCircle(c: FFXCombatant): boolean {
  return scriptIdOf(c) === CIRCLE_SCRIPT;
}

/** The three front-line members, in slot order, who still stand on the field (an Ejected member has left; a KO'd one is still on its platform). */
function standing(ctx: Ctx): FFXCombatant[] {
  return standingIds(ctx.state).map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
}

/** The front-line member standing on a platform, if any (the first in slot order). */
export function occupantAt(ctx: Ctx, platform: number): FFXCombatant | undefined {
  return standing(ctx).find((c) => platformOf(ctx, c.id) === platform);
}

/** The ring Circles whose platform nobody holds, in platform order: the legal targets of Move (a ticking mine's platform included). */
export function freeCircleIds(ctx: Ctx): CombatantId[] {
  const held = occupiedPlatforms(ctx.state); // the same answer the stage's painted glyphs read (`platformOccupancy.ts`)
  const out: CombatantId[] = [];
  for (let p = 1; p <= RING_PLATFORMS; p++) {
    const circle = circleOf(ctx, p);
    if (circle !== undefined && onField(circle) && !held.has(p)) out.push(circle.id);
  }
  return out;
}

/** The platform in front and its two neighbours (mod 6): the Keeper's sweep zone (RE 3 item 7: 3 is 3, 4, 2; 6 is 6, 1, 5). */
export function frontTrio(front: number): readonly [number, number, number] {
  const wrap = (p: number): number => ((((p - 1) % RING_PLATFORMS) + RING_PLATFORMS) % RING_PLATFORMS) + 1;
  return [wrap(front), wrap(front + 1), wrap(front - 1)];
}

/** The platform in front right now. */
export function frontPlatform(ctx: Ctx): number {
  const value = ctx.state.flags[FRONT_FLAG];
  return typeof value === 'number' ? value : FRONT_START;
}

/** The living members of the three active slots who stand on the platforms in front (RE 4.5 item 5): the sweep's targets, in slot order. */
export function sweepTargets(ctx: Ctx): CombatantId[] {
  const zone = frontTrio(frontPlatform(ctx));
  return standing(ctx)
    .filter((c) => c.alive && !c.statuses['ko'] && zone.includes(platformOf(ctx, c.id) ?? 0))
    .map((c) => c.id);
}

// ---------------------------------------------------------------------------
// The hit counter and the mines
// ---------------------------------------------------------------------------

/** The Keeper's hit counter (RE 4.2 v23). */
export function hitCount(ctx: Ctx): number {
  const value = ctx.state.flags[COUNT_FLAG];
  return typeof value === 'number' ? value : 0;
}

export function setHitCount(ctx: Ctx, value: number): void {
  ctx.state.flags[COUNT_FLAG] = value;
}

/** The mines live right now (RE 4.2 v0). */
export function minesLive(ctx: Ctx): number {
  const value = ctx.state.flags[MINES_FLAG];
  return typeof value === 'number' ? value : 0;
}

export function setMinesLive(ctx: Ctx, value: number): void {
  ctx.state.flags[MINES_FLAG] = value;
}

/** Is this Circle armed (given turns)? */
export function isArmed(ctx: Ctx, id: CombatantId): boolean {
  return ctx.state.flags[armedKey(id)] === true;
}

/** Give a Circle turns and a place on the CTB bar (the Keeper's lay, RE 4.3 rule 2): its counter is not touched, so it blows the next time it reaches 0. */
export function armCircle(ctx: Ctx, id: CombatantId): void {
  ctx.state.flags[armedKey(id)] = true;
  rtOf(ctx, id).ordersOnly = false;
}

/** Take the turns away again after the blast (RE 5.3 rule 4): the Circle goes back to cycling out of sight. */
export function disarmCircle(ctx: Ctx, id: CombatantId): void {
  ctx.state.flags[armedKey(id)] = false;
  rtOf(ctx, id).ordersOnly = true;
}

/** The unarmed ring Circles in platform order, whether or not anybody stands on them: the pool of the Keeper's mine picker (RE 4.3 rule 2, "including untargetable"). */
export function unarmedRing(ctx: Ctx): FFXCombatant[] {
  const out: FFXCombatant[] = [];
  for (let p = 1; p <= RING_PLATFORMS; p++) {
    const circle = circleOf(ctx, p);
    if (circle !== undefined && !isArmed(ctx, circle.id)) out.push(circle);
  }
  return out;
}

/**
 * An unarmed Circle: the clock still counts it, but it gets no turn (the game's `GetsTurns := 0`). `adapt/ctb.ts` reads this in three places: it takes part in the clock, it is handed to the scheduler kernel with
 * `getsTurns: false` (so its counter resets to the stored base each time it reaches 0), and a counter of 0 is shown to the clock as that base.
 */
export function isIdleCycler(ctx: Ctx, c: FFXCombatant): boolean {
  return ringActive(ctx) && c.side === 'enemy' && isCircle(c) && !isArmed(ctx, c.id);
}

// ---------------------------------------------------------------------------
// Set-up
// ---------------------------------------------------------------------------

/**
 * Before the opening counters: the formation's First Strike for the whole front line (RE 2.2 item 6). Called from `setup.ts` ahead of `seedInitialCtb`; `adapt/ctb.ts#openingCtb` reads the flag through {@link hasFrontFirstStrike}.
 * A no-op for every formation that does not say so.
 */
export function markFirstStrike(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.frontLineFirstStrike === true) ctx.state.flags[FIRST_STRIKE_FLAG] = true;
}

/** Does the formation give this combatant First Strike (an active member of a formation that gave it to the front line)? */
export function hasFrontFirstStrike(ctx: Ctx, c: FFXCombatant): boolean {
  return ctx.state.flags[FIRST_STRIKE_FLAG] === true && ctx.state.activeIds.includes(c.id);
}

/**
 * After the opening counters (the game's monster scripts write after them, RE 5.4): the front line on platforms 1, 2 and 3, the Keeper's "in front" at 2, no hits counted, no mine live, and the Circles set up as the script
 * leaves them: never part of the victory, no turn while idle, Agility 8 (the stored base already came from the record's 0). A no-op for every formation without `platformRing`.
 */
export function applyPlatformSetup(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.platformRing !== true) return;
  const flags = ctx.state.flags;
  flags[RING_FLAG] = true;
  flags[FRONT_FLAG] = FRONT_START;
  flags[COUNT_FLAG] = 0;
  flags[MINES_FLAG] = 0;
  ctx.state.activeIds.forEach((id, slot) => setPlatform(ctx, id, START_PLATFORMS[slot] ?? slot + 1));
  for (const id of CIRCLE_IDS) {
    const circle = tryActor(ctx, id);
    if (circle === undefined) continue;
    const rt = rtOf(ctx, id);
    rt.ordersOnly = true;
    rt.nonCombatant = true;
    circle.stats.agi = CIRCLE_SCRIPT_AGI;
    flags[armedKey(id)] = false;
  }
}

/** A Switch hands the outgoing member's platform to the member coming in (the swap routine copies the position bytes, RE 3 item 6). A no-op outside the ring. */
export function handOverPlatform(ctx: Ctx, outId: CombatantId, inId: CombatantId): void {
  if (!ringActive(ctx)) return;
  const platform = platformOf(ctx, outId);
  if (platform !== undefined) setPlatform(ctx, inId, platform);
}

// ---------------------------------------------------------------------------
// Move
// ---------------------------------------------------------------------------

/** The Move row of one party member (RE 2.2 item 3: all seven characters, the bench included, have it): `undefined` outside the ring, for an aeon, and for an enemy. */
export function moveRows(ctx: Ctx, user: FFXCombatant): AvailableCommand[] {
  if (!ringActive(ctx) || user.side !== 'party') return [];
  const targets = freeCircleIds(ctx);
  const row: AvailableCommand = {
    command: { kind: 'trigger', id: KEEPER_ROWS.move, targets: [] },
    label: 'Move',
    category: 'special',
    mpCost: 0,
    rank: 3,
    enabled: targets.length > 0 && platformOf(ctx, user.id) !== undefined,
    validTargets: targets,
    targeting: 'single-enemy',
    help: 'Step to a free glyph. It costs the turn.',
  };
  if (!row.enabled) row.disabledReason = 'No free glyph';
  return [row];
}

/**
 * What the Circle's `onTargeted` does when Move aims at it (RE 3 item 3): the mover's platform becomes the Circle's, the old one is free, the mover faces the new platform and hops. Returns false when the aim is not a legal one
 * (not a ring Circle, an occupied platform, a mover with no platform), so the executor says so and the turn is spent, as for any refused trigger.
 */
export function moveTo(ctx: Ctx, mover: FFXCombatant, command?: TriggerCommand): boolean {
  if (!ringActive(ctx) || mover.side !== 'party') return false;
  const from = platformOf(ctx, mover.id);
  const aim = command?.targets[0];
  const to = aim === undefined ? undefined : circlePlatform(aim);
  if (from === undefined || to === undefined || to > RING_PLATFORMS || occupantAt(ctx, to) !== undefined) return false;
  setPlatform(ctx, mover.id, to);
  ctx.emit({ type: 'platform', who: mover.id, from, to });
  ctx.emit({ type: 'message', text: `${mover.name} steps to glyph ${to}`, kind: 'story' });
  return true;
}

/** True when the platform is the aeon rock. */
export function isRock(platform: number): boolean {
  return platform === ROCK_PLATFORM;
}
