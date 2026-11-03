/**
 * **The Spectral Keeper's scripts** (FFX only; the hidden Spectral Keeper chapter): the Keeper (monster file `m129`) and its seven Circles (`m146`), as the game's own bytecode runs them
 * (`research/re-ffx-spectral-keeper.md` sections 3 to 5, "RE section n": read from the files, not run). **No number here is ours but the mine's fuse base** (`./spectral-keeper-rules.ts`, `[estimate]`, 84). The state they
 * read and write is `../platforms.ts`; the rows are `data/ffx/enemies/spectral-keeper-abilities.ts`.
 *
 * ## The Keeper's turn (RE 4.3 and 4.4), in this order
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 0 | an aeon is out | the hit counter gains 1 (the game counts turns, not only hits, because an aeon's hits are rarer than its turns) |
 * | 1 | the counter is 4 or more **and** no mine is live | **Glyph Mine**: the counter is reset; two random unarmed ring Circles (one draw each along the platforms in order, `game-rolls.ts#pickActor`) are armed and aimed together; with an aeon out the rock's Circle is armed alone |
 * | 2 | otherwise, no aeon out | **Berserk Tail** (power 16, Berserk 50) on its Provoker, else one random living front-line character (one stream-4 draw when two or more live); the target's platform becomes "the platform in front" |
 * | 3 | otherwise, an aeon out | the plain **Attack** (power 24) on its Provoker, else a random living aeon; the tail and the front are not touched |
 *
 * With the counter at 4 or more and a mine live it falls through to the tail and **does not reset** (RE 4.3 rule 1): the counter stays above 4 until the mines are gone.
 *
 * ## When it is hit (RE 4.5), once per action per target, in this order
 *
 * 1. Dead: nothing. A command whose damage class has no HP (Scan, a buff, a support command): **stop, no count, no sweep.**
 * 2. A damaging hit (the HP it lost, before the clamp, above 0): the counter gains 1. A miss, a heal and a zero-damage HP command add nothing.
 * 3. An aeon out: the counter gains 1 more, a plain Attack is queued at a random living aeon, stop (no sweep).
 * 4. Otherwise **the sweep**: Attack All (power 32) on every living member of the three active slots who stands on the platform in front or one of its two neighbours.
 *
 * A six-hit Overdrive is one action and so one hit event (one sweep, not six). A hit that is itself a reaction (a counter-attack, an Auto-Potion) still counts but queues nothing (RE 4.5 last paragraph).
 *
 * ## A Circle (RE 5)
 *
 * Idle: no turns, the clock cycles its counter to the stored base. **Armed** (given turns by the Keeper): its own turn is the blast. It kills the member standing on its platform at that moment (Death 255, a fraction of the
 * maximum at full power, so Deathproof does not help) or fizzles on an empty platform; a ground mine fizzles when an aeon is out, and the rock's Circle blasts a random living aeon, and fizzles with none out. After its turn it
 * is disarmed and the live-mine count goes down by one.
 *
 * ## What this file does not model
 *
 * The Keeper's Self-Destruct branch (RE 4.5 item 4, Kimahri's Self-Destruct frees character 3's platform): unreachable with the sourced party, whose Kimahri has no such command. The turning to face the tail's target (a presentation
 * row, RE section 7 row 14). The unreachable Absorb block (RE 4.7). The sweep's Circle stand-ins for an empty platform (the group holds the Circle itself, which the Attack All cannot hurt: it draws no result here).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, aeonsOut, has, isAlive, targetable, tryActor } from '../state.ts';
import { pickActor, randomLiving } from './game-rolls.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { queueReaction, registerScriptHooks, type HitReport, type UsedCommand } from './hooks.ts';
import {
  AEON_HIT_EXTRA,
  AEON_TURN_GAIN,
  CIRCLE_IDS,
  CIRCLE_SCRIPT,
  COUNT_TO_ARM,
  FRONT_FLAG,
  KEEPER_ROWS,
  KEEPER_SCRIPT,
  RING_MINES_PER_LAY,
  ROCK_MINES_PER_LAY,
  ROCK_PLATFORM,
} from './spectral-keeper-rules.ts';
import {
  armCircle,
  circleOf,
  circlePlatform,
  disarmCircle,
  frontPlatform,
  hitCount,
  minesLive,
  occupantAt,
  platformOf,
  setHitCount,
  setMinesLive,
  sweepTargets,
  unarmedRing,
} from '../platforms.ts';

export * from './spectral-keeper-rules.ts';

/** Is an aeon holding the field? (Then the front line is the aeon alone.) */
function aeonOut(ctx: Ctx): boolean {
  return aeonsOut(ctx).length > 0;
}

/** The Keeper's Provoker, if it has one still standing: its tail and its Attack go there without a draw (RE 4.3 rule 3). */
function provoker(ctx: Ctx, self: FFXCombatant): FFXCombatant | undefined {
  if (!has(self, 'provoke')) return undefined;
  const source = self.statuses['provoke']?.sourceId;
  const found = source === undefined ? undefined : tryActor(ctx, source);
  return found !== undefined && isAlive(found) && targetable(found) ? found : undefined;
}

/** The victim of the tail or the Attack: the Provoker, else a random living front-line character. */
function victimOf(ai: AiContext): FFXCombatant | undefined {
  return provoker(ai.ctx, ai.self) ?? randomLiving(ai.ctx);
}

/** Lay two mines on the ring (RE 4.3 rule 2): the counter resets, two Circles are picked and given turns, the pair is aimed with Glyph Mine. */
function layRingMines(ai: AiContext): Command {
  const { ctx } = ai;
  setHitCount(ctx, 0);
  const pool = unarmedRing(ctx);
  const picked: FFXCombatant[] = [];
  for (let k = 0; k < RING_MINES_PER_LAY; k++) {
    const circle = pickActor(ctx, pool.filter((c) => !picked.includes(c)));
    if (circle !== undefined) picked.push(circle);
  }
  for (const circle of picked) armCircle(ctx, circle.id);
  setMinesLive(ctx, picked.length);
  return use(ai, KEEPER_ROWS.mine, picked.map((c) => c.id));
}

/** Lay the aeon's one mine (RE 4.4): the rock's Circle, given turns. */
function layRockMine(ai: AiContext): Command {
  const { ctx } = ai;
  setHitCount(ctx, 0);
  const rock = circleOf(ctx, ROCK_PLATFORM);
  if (rock !== undefined) armCircle(ctx, rock.id);
  setMinesLive(ctx, ROCK_MINES_PER_LAY);
  return use(ai, KEEPER_ROWS.mine, rock === undefined ? [] : [rock.id]);
}

/** One Keeper turn (RE 4.3, 4.4). */
export function keeperTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const aeon = aeonOut(ctx);
  if (aeon) setHitCount(ctx, hitCount(ctx) + AEON_TURN_GAIN);
  if (hitCount(ctx) >= COUNT_TO_ARM && minesLive(ctx) === 0) return aeon ? layRockMine(ai) : layRingMines(ai);
  const victim = victimOf(ai);
  if (victim === undefined) return null;
  if (aeon) return use(ai, KEEPER_ROWS.aeonAttack, [victim.id]);
  ctx.state.flags[FRONT_FLAG] = platformOf(ctx, victim.id) ?? frontPlatform(ctx); // the tail's target is the new "platform in front" (RE 3 item 7)
  return use(ai, KEEPER_ROWS.tail, [victim.id]);
}

/** The Keeper hears it was hit (RE 4.5). */
function keeperOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void {
  if (self.hp <= 0 || !self.alive) return; // dead: nothing
  if (!report.affectsHp) return; // Scan, a buff, a support command: no count and no sweep
  if (report.lastDamage > 0) setHitCount(ctx, hitCount(ctx) + 1);
  const reaction = ctx.rt.inReaction === true; // a counter-attack or an Auto-item still counts, but the Keeper's answer to it is dropped (RE 4.5)
  if (aeonOut(ctx)) {
    setHitCount(ctx, hitCount(ctx) + AEON_HIT_EXTRA);
    const target = reaction ? undefined : randomLiving(ctx);
    if (target !== undefined) queueReaction(ctx, self.id, { kind: 'ability', id: KEEPER_ROWS.aeonAttack, targets: [target.id] }, { keepsControl: true, byId: used.user.id });
    return;
  }
  const targets = sweepTargets(ctx);
  if (targets.length > 0 && !reaction) queueReaction(ctx, self.id, { kind: 'ability', id: KEEPER_ROWS.sweep, targets }, { keepsControl: true, byId: used.user.id });
}

registerAiScript(KEEPER_SCRIPT, keeperTurn);
registerScriptHooks(KEEPER_SCRIPT, { onHit: keeperOnHit });

// ---------------------------------------------------------------------------
// The Circles
// ---------------------------------------------------------------------------

/** The member a ring mine would kill: the last living one of characters 1 to 3 whose platform is the Circle's (RE 5.3 rule 3), or none. */
function occupantOfRingMine(ctx: Ctx, platform: number): FFXCombatant | undefined {
  const occupant = occupantAt(ctx, platform);
  if (occupant === undefined || !isAlive(occupant)) return undefined;
  // `occupantAt` returns the first in slot order; the game's walk keeps the last living one that matches (two on one platform cannot happen by Move).
  let last: FFXCombatant | undefined;
  for (const id of ctx.state.activeIds) {
    const c = tryActor(ctx, id);
    if (c !== undefined && isAlive(c) && platformOf(ctx, c.id) === platform) last = c;
  }
  return last;
}

/** A Circle's turn: the blast, or the fizzle (RE 5.3). The Circle is disarmed here and the live-mine count goes down by one. */
export function circleTurn(ai: AiContext): Command {
  const { ctx, self } = ai;
  const platform = circlePlatform(self.id) ?? 0;
  const aeon = aeonOut(ctx);
  let victim: FFXCombatant | undefined;
  if (platform === ROCK_PLATFORM) victim = aeon ? randomLiving(ctx) : undefined;
  else victim = aeon ? undefined : occupantOfRingMine(ctx, platform);
  disarmCircle(ctx, self.id);
  setMinesLive(ctx, Math.max(0, minesLive(ctx) - 1));
  return victim === undefined ? use(ai, KEEPER_ROWS.fizzle, [self.id]) : use(ai, KEEPER_ROWS.blast, [victim.id]);
}

/** A Circle hears Glyph Mine reach it: the glyph lights (RE 5.2). Presentation only here; the arming was done by the Keeper's turn. */
function circleOnTargeted(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void {
  if (used.def.id !== KEEPER_ROWS.mine) return;
  const platform = circlePlatform(self.id);
  ctx.emit({ type: 'message', text: platform === ROCK_PLATFORM ? 'The rock flares' : `Glyph ${platform ?? ''} flares`, kind: 'story' });
}

registerAiScript(CIRCLE_SCRIPT, circleTurn);
registerScriptHooks(CIRCLE_SCRIPT, { onTargeted: circleOnTargeted });

/** The ids of the formation's Circles, for the tests. */
export const CIRCLES: readonly string[] = CIRCLE_IDS;
