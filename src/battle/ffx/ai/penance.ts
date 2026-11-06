/**
 * **Penance's scripts** (FFX only; the hidden Penance chapter): Penance (monster file `m344`) and its Right and Left Arms (`m345`, `m346`), as the game's own bytecode runs them (`research/re-ffx-penance.md` section 5,
 * "RE n": read from the files and run in the earlier lanes' interpreter). **No number here is ours but the arm's return, 12 ticks** (`[derived]` from the CTB kernel, `./penance-rules.ts`). The rules and their sources are
 * `./penance-rules.ts`; the rows are `data/ffx/enemies/penance-abilities.ts`.
 *
 * ## Penance's turn (RE 5.2)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | phase 1 (HP still at three quarters or more) | **Obliteration** on the whole front line; no counter |
 * | 2 | phase 2, the counter below 20, or 20 or more with an arm down | the counter gains 1, then **Immolation** on one random living member (one stream-4 draw when two or more live) |
 * | 3 | phase 2, the counter (after its +1) 20 or more, **both arms up** | the counter goes to 0; **Judgment Day** on the whole front line |
 *
 * ## When Penance is hit (RE 5.2), once per action per target
 *
 * Only a damaging one counts (the HP it lost, before the clamp, above 0; a heal, a miss and a zero-damage action change nothing). In phase 1, the first one that leaves it **strictly below three quarters** of its
 * maximum is the change: it uses **Separation** on itself, **Protect comes off**, it is **Hasted for one turn**, and the painting changes to the split figure (a `form-change` event: the engine's own form change would
 * hand it fresh HP). In phase 2 every damaging action that reaches it adds 1 to the counter.
 *
 * ## An arm (RE 5.3)
 *
 * Each turn it counts the turn; **turn 1** writes Strength and Agility 255, **turn 2 on** writes them again and takes Haste for one turn; then one stream-2 roll, `mod 3`:
 *
 * | Roll | Right Arm | Left Arm |
 * |---|---|---|
 * | 0 | Attack (power 36, **Petrify**) on one random living member | the dispelling Attack (power 36) on one random living member |
 * | 1 | Calamity (Poison, the four Breaks, Silence, Darkness, Curse) on one random living member | **Tera Graviton** (three quarters of everyone's maximum HP; Sleep, Silence, Darkness, Slow, Doom) on the front line |
 * | 2 | if Penance has Regen the Attack again, else **Mighty Guard** (Shell, Protect, Regen) on Penance, itself and the Left Arm while it stands | if a living member is not Slowed **Slowga** on the front line, else the dispelling Attack on one random living member |
 *
 * **When an arm dies** with Penance alive it acts out Atrophy and is re-initialised from its record: full HP, the statuses gone, Strength 200 and Agility 150 again, its turn count 0, hidden and untargetable. It
 * returns **`ARM_RETURN_TICKS` (12) after its death** (the game's re-initialised counter, then one Regeneration turn that makes it whole), by the engine's part-revival timer (`hp.ts#resolveDuePartRevivals`), and acts the
 * turn after. Each death pays its AP and drop (`hp.ts#koActor`). With Penance dead an arm just falls. A Doom death is a death like any other (`ScriptHooks.onDeath`).
 *
 * **When Penance dies** it forces its own Death and both arms fall with it (no return, and, as the engine reads RE 7, no second payment: the arms are taken off the field without a loot roll).
 */

import type { Command, EnemyGroupDef, FFXCombatant, StatusId } from '../../common/types.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { scheduleRevivalAt } from '../hp.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import { type HitReport, type ScriptHooks, type UsedCommand, queueEmit, queueReaction, registerScriptHooks } from './hooks.ts';
import {
  ARM_BUFFED_STAT,
  ARM_RECORD_AGI,
  ARM_RECORD_STR,
  ARM_RETURN_TICKS,
  ARM_ROLL_MODULO,
  HASTE_TURNS,
  JUDGMENT_COUNTER,
  MEM_TURNS,
  PENANCE_GROUP_ID,
  PENANCE_ID,
  PENANCE_LEFT_ARM_ID,
  PENANCE_LEFT_ARM_SCRIPT,
  PENANCE_RIGHT_ARM_ID,
  PENANCE_RIGHT_ARM_SCRIPT,
  PENANCE_ROWS,
  PENANCE_SCRIPT,
  PENANCE_SPLIT_SPRITE,
  PEN_COUNTER_FLAG,
  PEN_PHASE_FLAG,
  armsOf,
  bothArmsUp,
  changeLine,
  counterOf,
  penanceBody,
  phaseOf,
  setCounter,
} from './penance-rules.ts';

export * from './penance-rules.ts';

/** Put a temporal status on a combatant for `turns` of its own turns, with its `status-add` event (the script's direct write; a status already on is overwritten, as the game's write is). */
function grantStatus(ctx: Ctx, target: FFXCombatant, status: StatusId, turns: number): void {
  const instance = { id: status, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  target.statuses[status] = instance;
  ctx.emit({ type: 'status-add', targetId: target.id, status, instance: { ...instance } });
}

// ---------------------------------------------------------------------------
// Penance
// ---------------------------------------------------------------------------

/** One Penance turn (RE 5.2). */
export function penanceTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  if (phaseOf(ctx) === 0) return use(ai, PENANCE_ROWS.obliteration, []); // phase 1: nothing but Obliteration, no counter
  const counter = counterOf(ctx) + 1;
  setCounter(ctx, counter);
  if (counter >= JUDGMENT_COUNTER && bothArmsUp(ctx)) {
    setCounter(ctx, 0);
    return use(ai, PENANCE_ROWS.judgmentDay, []);
  }
  const victim = randomLiving(ctx);
  return use(ai, PENANCE_ROWS.immolation, victim === undefined ? [] : [victim.id]);
}

/** The change (RE 5.2): Separation on itself, Protect off, Haste for a turn, the split painting. */
function enterPhase2(ctx: Ctx, self: FFXCombatant): void {
  ctx.state.flags[PEN_PHASE_FLAG] = 1;
  queueReaction(ctx, self.id, { kind: 'ability', id: PENANCE_ROWS.separation, targets: [self.id] }, { forced: true, keepsControl: true });
  removeStatus(ctx, self, 'protect', 'cured');
  grantStatus(ctx, self, 'haste', HASTE_TURNS);
  self.spriteKey = PENANCE_SPLIT_SPRITE;
  queueEmit(ctx, { type: 'form-change', enemyId: self.id, formIndex: 1, name: self.name, spriteKey: PENANCE_SPLIT_SPRITE }); // after the Separation scene: the lower half falls away and the painting follows
}

/** Penance hears the action's hits (RE 5.2). */
function penanceOnHit(ctx: Ctx, self: FFXCombatant, _used: UsedCommand, report: HitReport): void {
  if (report.lastDamage <= 0 || self.hp <= 0) return; // only a damaging hit, and not the one that kills it
  if (phaseOf(ctx) === 0) {
    if (self.hp < changeLine(self.stats.maxHp)) enterPhase2(ctx, self);
    return;
  }
  setCounter(ctx, counterOf(ctx) + 1);
}

/** Penance dies: it forces its own Death and takes both arms with it (RE 5.2). The arms are taken off the field without a loot roll or a return. */
function penanceOnDeath(ctx: Ctx, self: FFXCombatant): void {
  ctx.emit({ type: 'message', text: `${self.name} falls`, kind: 'story' });
  for (const arm of armsOf(ctx)) {
    ctx.rt.pendingPartRevivals = ctx.rt.pendingPartRevivals.filter((p) => p.id !== arm.id);
    if (!isAlive(arm)) continue;
    arm.hp = 0;
    arm.alive = false;
    arm.removed = true;
    arm.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    ctx.emit({ type: 'ko', targetId: arm.id });
    ctx.emit({ type: 'part-destroyed', partId: arm.id, ownerId: self.id });
  }
}

// ---------------------------------------------------------------------------
// The arms
// ---------------------------------------------------------------------------

/** An arm's start-of-turn writes (RE 5.3): the count, Strength and Agility 255, and from the second turn Haste for one turn. Returns the count. */
function armTurnStart(ai: AiContext): number {
  const { ctx, self, memory } = ai;
  const turns = num(memory, MEM_TURNS) + 1;
  memory[MEM_TURNS] = turns;
  self.stats.str = ARM_BUFFED_STAT;
  self.stats.agi = ARM_BUFFED_STAT;
  if (turns >= 2) grantStatus(ctx, self, 'haste', HASTE_TURNS);
  return turns;
}

/** One victim for a single-target row: a random living member (RE 5.3 uses `findMatchingChr` over the front line). */
function aimed(ai: AiContext, row: string): Command {
  const victim = randomLiving(ai.ctx);
  return use(ai, row, victim === undefined ? [] : [victim.id]);
}

/** The group Mighty Guard reaches: Penance, this arm, and the Left Arm while it stands (RE 5.3: "all monsters", minus the Left Arm while it is down). */
function mightyGuardGroup(ctx: Ctx): string[] {
  return [PENANCE_ID, PENANCE_RIGHT_ARM_ID, PENANCE_LEFT_ARM_ID].filter((id) => {
    const c = tryActor(ctx, id);
    return c !== undefined && isAlive(c);
  });
}

/** One Right Arm turn (RE 5.3). */
export function rightArmTurn(ai: AiContext): Command | null {
  armTurnStart(ai);
  const roll = gameMod(ai.ctx, ARM_ROLL_MODULO);
  if (roll === 0) return aimed(ai, PENANCE_ROWS.armAttack);
  if (roll === 1) return aimed(ai, PENANCE_ROWS.calamity);
  const penance = penanceBody(ai.ctx);
  if (penance !== undefined && has(penance, 'regen')) return aimed(ai, PENANCE_ROWS.armAttack); // Penance already regenerates: no second Mighty Guard
  return use(ai, PENANCE_ROWS.mightyGuard, mightyGuardGroup(ai.ctx));
}

/** One Left Arm turn (RE 5.3). */
export function leftArmTurn(ai: AiContext): Command | null {
  armTurnStart(ai);
  const roll = gameMod(ai.ctx, ARM_ROLL_MODULO);
  if (roll === 0) return aimed(ai, PENANCE_ROWS.dispellingAttack);
  if (roll === 1) return use(ai, PENANCE_ROWS.teraGraviton, []);
  if (livingFrontLine(ai.ctx).some((c) => !has(c, 'slow'))) return use(ai, PENANCE_ROWS.slowga, []); // somebody is free to be slowed
  return aimed(ai, PENANCE_ROWS.dispellingAttack);
}

/**
 * An arm dies (RE 5.3). With Penance alive: Atrophy (a line), the arm is re-initialised at its death as the game does (Strength and Agility back to the record, the turn count 0, the overkill mark of the life that ended
 * forgotten), and its return is armed `ARM_RETURN_TICKS` ahead with its full HP. `koActor` has already cleared its statuses, paid its loot and hidden it (`isPart`: removed, so untargetable and off the clock).
 * With Penance dead: Atrophy only.
 */
function armOnDeath(ctx: Ctx, self: FFXCombatant): void {
  ctx.emit({ type: 'message', text: `${self.name} withers`, kind: 'story' });
  const penance = penanceBody(ctx);
  if (penance === undefined || !isAlive(penance)) return;
  self.stats.str = ARM_RECORD_STR;
  self.stats.agi = ARM_RECORD_AGI;
  self.mp = self.stats.maxMp;
  rtOf(ctx, self.id).ai[MEM_TURNS] = 0;
  ctx.rt.overkilled = ctx.rt.overkilled.filter((id) => id !== self.id);
  scheduleRevivalAt(ctx, self.id, ctx.state.ticks + ARM_RETURN_TICKS, self.stats.maxHp);
}

registerAiScript(PENANCE_SCRIPT, penanceTurn);
registerScriptHooks(PENANCE_SCRIPT, { onHit: penanceOnHit, onDeath: penanceOnDeath } satisfies ScriptHooks);
registerAiScript(PENANCE_RIGHT_ARM_SCRIPT, rightArmTurn);
registerAiScript(PENANCE_LEFT_ARM_SCRIPT, leftArmTurn);
registerScriptHooks(PENANCE_RIGHT_ARM_SCRIPT, { onDeath: armOnDeath } satisfies ScriptHooks);
registerScriptHooks(PENANCE_LEFT_ARM_SCRIPT, { onDeath: armOnDeath } satisfies ScriptHooks);

/**
 * The opening state of the Penance battle (called once from `setup.ts#buildBattle`; a no-op in every battle whose group is not this one): **Penance starts with Protect on** (its automatic status, RE 3), the phase
 * and the counter at 0. Nothing is emitted (setup events never reach the presenter); the status is on the body, so the turn list and the status pips read it from the state.
 */
export function applyPenanceSetup(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.id !== PENANCE_GROUP_ID) return;
  const body = tryActor(ctx, PENANCE_ID);
  if (body === undefined) return;
  ctx.state.flags[PEN_PHASE_FLAG] = 0;
  ctx.state.flags[PEN_COUNTER_FLAG] = 0;
  body.statuses['protect'] = { id: 'protect', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}
