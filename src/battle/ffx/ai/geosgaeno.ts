/**
 * **Geosgaeno's script** (FFX only; the hidden Flooded Ways chapter): the optional second fight in the Baaj Temple (monster file `m109`, formation `bjyt02_02`), as the game's own bytecode runs it
 * (`research/re-ffx-geosgaeno-evrae-altana.md` 4.1, "RE 4.1": read from the file and run in the earlier lanes' interpreter with exact tallies over all 65,536 random results). **No number here is ours**; they live with
 * their sources in `./flooded-ways-rules.ts`. The hold it builds is `./geosgaeno-hold.ts`; the rows are `data/ffx/enemies/flooded-ways-abilities.ts`.
 *
 * ## The turn (RE 4.1), by its private slot `v4`
 *
 * | Slot | Condition | Action |
 * |---|---|---|
 * | 0 to 2 | punches so far | `v4` +1; one random living front-line member takes **Stone Punch**, or, **strictly below half HP** (16,383), a draw modulo 100 above 30 makes it **KO Punch** (69 percent: 45,200 of 65,536) |
 * | 3 | the swallow | a random living member **who does not have Doom** is **swallowed** (`v4` := 255); if every living member has Doom, KO Punch on a random one and nothing is swallowed |
 * | 255 | someone inside | the spit-out: `v4` := a draw modulo 2 (so **3 punches follow if even, 2 if odd**); the victim comes out; Regurgitate on the whole front line for **the victim's HP minus 1** |
 *
 * ## When it is hit (RE 4.1)
 *
 * **Struggle** (the held character's strike): the hold ends and Regurgitate hits the victim alone for their own current HP, which KOs them and spares everyone else. **A kill with someone inside** is the death blow: 9,999 to the
 * whole front line. Nothing else it hears changes anything.
 */

import type { Command } from '../../common/types.ts';
import { type Ctx, has, isAlive } from '../state.ts';
import { gameMod, livingFrontLine, pickActor, randomLiving } from './game-rolls.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { queueReaction } from './hooks.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import { deathBlow, hitByRegurgitate, releaseHold, rewriteMaxHp, swallowVictim } from './geosgaeno-hold.ts';
import { DEATH_BLOW_FLAG } from './flooded-ways-end.ts';
import {
  FLOODED_ROWS,
  FLOODED_SCRIPTS,
  GEOSGAENO_HALF_LINE,
  GEO_V4,
  KO_PUNCH_ABOVE,
  PUNCHES_BEFORE_SWALLOW,
  SPIT_DRAW_MODULO,
  V4_HOLDING,
  hasDoom,
  heldMember,
} from './flooded-ways-rules.ts';

function v4Of(ctx: Ctx): number {
  return num(ctx.state.flags, GEO_V4, 0);
}

/** One punch: Stone Punch, or below half HP a KO Punch on a draw above 30 (RE 4.1; one stream-2 draw per turn once below half). */
function punch(ai: AiContext, victimId: string): Command {
  const { ctx, self } = ai;
  if (self.hp < GEOSGAENO_HALF_LINE && gameMod(ctx, 100) > KO_PUNCH_ABOVE) return use(ai, FLOODED_ROWS.koPunch, [victimId]);
  return use(ai, FLOODED_ROWS.stonePunch, [victimId]);
}

/** The spit-out turn (RE 4.1 state 3). */
function spitOut(ai: AiContext): Command {
  const { ctx, self } = ai;
  ctx.state.flags[GEO_V4] = gameMod(ctx, SPIT_DRAW_MODULO);
  const victim = heldMember(ctx);
  const amount = victim === undefined ? 0 : Math.max(0, victim.hp - 1); // the victim's current HP minus 1 (a victim at 0 or 1 HP adds nothing)
  releaseHold(ctx);
  rewriteMaxHp(ctx, self, amount);
  return use(ai, FLOODED_ROWS.regurgitate, hitByRegurgitate(ctx).map((c) => c.id));
}

/** Geosgaeno's turn (RE 4.1). */
export function geosgaenoTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const v4 = v4Of(ctx);
  if (v4 === V4_HOLDING) return spitOut(ai);
  if (v4 < PUNCHES_BEFORE_SWALLOW) {
    ctx.state.flags[GEO_V4] = v4 + 1;
    const target = randomLiving(ctx);
    return target === undefined ? null : punch(ai, target.id);
  }
  // The swallow: a living member without Doom; if there is none, a KO Punch on a random one and nothing is swallowed.
  const victim = pickActor(ctx, livingFrontLine(ctx).filter((c) => !hasDoom(c)));
  if (victim === undefined) {
    const any = randomLiving(ctx);
    return any === undefined ? null : use(ai, FLOODED_ROWS.koPunch, [any.id]);
  }
  ctx.state.flags[GEO_V4] = V4_HOLDING;
  swallowVictim(ctx, self, victim);
  return use(ai, FLOODED_ROWS.swallow, [victim.id]);
}

/** Geosgaeno's `onHit` (RE 4.1): the Struggle's answer, and the death blow. */
export function geosgaenoHit(event: HitEvent): void {
  const { ctx, target: geo, def } = event;
  const victim = heldMember(ctx);
  if (victim === undefined) return;
  if (geo.hp <= 0) {
    // Killed with someone inside: the death blow, before the KO is settled (the hook holds the death).
    if (deathBlow(ctx, geo)) ctx.state.flags[DEATH_BLOW_FLAG] = true;
    return;
  }
  if (def.id !== FLOODED_ROWS.struggle) return;
  // Struggle: the maximum HP becomes the victim's current HP (not minus 1) and Regurgitate hits the victim alone; the hold ends with them.
  rewriteMaxHp(ctx, geo, victim.hp);
  releaseHold(ctx);
  ctx.state.flags[GEO_V4] = gameMod(ctx, SPIT_DRAW_MODULO);
  if (isAlive(victim) && !has(geo, 'threaten')) {
    queueReaction(ctx, geo.id, { kind: 'ability', id: FLOODED_ROWS.regurgitate, targets: [victim.id] }, { forced: true, keepsControl: true, byId: victim.id });
  }
}

registerAiScript(FLOODED_SCRIPTS.geosgaeno, geosgaenoTurn);
registerHitScript(FLOODED_SCRIPTS.geosgaeno, geosgaenoHit, { managesHp: true });
