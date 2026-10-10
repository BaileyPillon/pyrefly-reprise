/**
 * **Sinspawn Gui's rules, as the game's own scripts run them** (the hidden Sinspawn Gui chapter; **FFX only** [AGENTS.md rule 14]).
 * `research/re-ffx-ai-gui.md` ("RE §n") read the three monster scripts (m117 body, m160 head, m161 arm) and the two formation scripts (`kino02_00`, `kino03_10`) in the game's own files and ran
 * them in two independent interpreters (4,000 seeds a case); every number below is theirs. Facts only: no script text and no code from the game is reproduced.
 *
 * | Part | What it does | RE |
 * |---|---|---|
 * | body (actor 20) | Attack, Attack, Demi, then alternating; an extra random step once under the acceleration line; **the arms' shield** on a physical command while an arm lives | §5.2, §5.4 |
 * | head (21) | never attacks: a three-turn cycle (relay for Thunder, a warning turn, relay for Venom) through the body; damage during the warning cancels the Venom | §5.3 |
 * | arms (22, 23) | no turns; 800 HP, Armored; regrow together on the body's 3rd or 4th turn once both are down, and pay their AP and gil again for every death | §5.5, §3.3 |
 *
 * The state a script keeps is the game's own private variables, kept where the engine keeps every script's: the body's `v12` (Attack / Demi counter) and `v13` (regrowth counter) and the head's `v3`
 * (its cycle state) in `ActorRuntime.ai`, and the shared battle variable `[04]` (the relay selector) and the fight number in `BattleState.flags`, so a forked or restored battle carries all of it.
 */

import type { AbilityDef, BattleState, CombatantId, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { restorePart } from '../hp.ts';
import { type ActorRuntime, type Ctx, isAlive } from '../state.ts';

/** Ids, mirrored from `data/ffx/sinspawn-gui-ids.ts` (the battle layer does not import the data layer; `tests/unit/chapters/sinspawn-gui-data.test.ts` pins that the two agree). */
export const GUI_BODY_SCRIPT = 'sinspawn-gui';
export const GUI_HEAD_SCRIPT = 'sinspawn-gui-head';
export const GUI_ARM_SCRIPT = 'sinspawn-gui-arm';
export const GUI_BODY_2_ID = 'sinspawn-gui-2';
export const GUI_HEAD_ID = 'sinspawn-gui-head';
export const GUI_ARM_IDS: readonly string[] = ['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'];
/** The head's relay command and Venom (`data/ffx/enemies/sinspawn-gui-abilities.ts`). */
export const GUI_SPECIAL_1_ID = 'gui-special-1';
export const GUI_VENOM_ID = 'gui-venom';

/** Shared battle variable `[04]`: the head's relay selector, 1 for Thunder and 2 for Venom (the head writes it, the body clears it). */
export const GUI_RELAY = 'gui.relay';
/** Which fight this is, 1 or 2 (the game's `battle[0x20]`). */
export const GUI_FIGHT = 'gui.fight';
/** The body's acceleration line `v11`: fight 1 `max HP / 3` (4,000), fight 2 the record's max HP read before the script overwrites it (12,000), so always on (RE §2.3). */
export const GUI_ACCEL_LINE = 'gui.accelLine';
/** The head's cycle state 1, 2 or 3, mirrored where a reader (the advisor, the HUD) can see it without the head's private memory; 3 is "it has shaken and the Venom is next". */
export const GUI_HEAD_STATE_FLAG = 'gui.headState';
/** AP and gil of a part's earlier deaths, banked when it grows back and paid with the battle's rewards (`results.ts#collectRewards`; RE §3.3). */
export const BANKED_AP = 'rewards.bankedAp';
export const BANKED_GIL = 'rewards.bankedGil';

/** The body `v12`: how many of its turns since the last Demi (a Demi at 2 or more). */
export const MEM_ATTACKS = 'attacks';
/** The body `v13`: body turns spent with both arms down. */
export const MEM_REGROW = 'regrow';
/** The head `v3`: 1 (relay Thunder), 2 (the warning turn), 3 (relay Venom). */
export const MEM_HEAD_STATE = 'state';

/** The shield's Defense, `DEF := 100` for one command (RE §5.4). Without the shield the body's Defense is the record's 0, which reads 1 in play. */
export const SHIELD_DEF = 100;
export const BARE_DEF = 1;

/** The body that is on the field in this battle (either fight), or undefined. */
export function guiBody(ctx: Pick<Ctx, 'state'>): FFXCombatant | undefined {
  for (const id of ctx.state.enemyIds) {
    const c = ctx.state.combatants[id] as FFXCombatant | undefined;
    if (c?.enemy?.aiScriptId === GUI_BODY_SCRIPT) return c;
  }
  return undefined;
}

/** True for the second fight's body. */
export function isSecondFight(body: FFXCombatant): boolean {
  return body.id === GUI_BODY_2_ID;
}

/** The arms, as combatants (both, alive or not). */
export function guiArms(ctx: Pick<Ctx, 'state'>): FFXCombatant[] {
  return GUI_ARM_IDS.map((id) => ctx.state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);
}

/** True when both arms are down (`GetBattleActorStatus` of actors 22 and 23: not in the battle). */
export function bothArmsDown(ctx: Pick<Ctx, 'state'>): boolean {
  const arms = guiArms(ctx);
  return arms.length > 0 && arms.every((a) => !isAlive(a));
}

/** True when at least one arm stands. */
export function anArmLives(ctx: Pick<Ctx, 'state'>): boolean {
  return guiArms(ctx).some((a) => isAlive(a));
}

/**
 * Does the arms' shield catch this command? Only a command that **affects HP and carries the physical damage flag** (the game's type 1; type 3 would too, and no command has it), read off the
 * command's own record: the 44 physical party commands (Attack, the Delay, Sleep, Silence, Dark and Zombie Attacks and Busters, Triple Foul, the four Breaks, Full Break, Mug, Quick Hit, the Extract
 * moves, Nab Gil, the aeons' own attacks). Every spell and healing (type 2), every Overdrive, Lancet, Steal, Provoke and Threaten (type 0) and every item goes straight through (RE §5.4).
 */
export function shieldCatches(def: AbilityDef, user: FFXCombatant): boolean {
  const record = resolveCommand(def, user).record;
  const affectsHp = (record.damageClass & 1) !== 0;
  const type = record.flagsDamage & 3;
  return affectsHp && (type === 1 || type === 3);
}

/** `DEF := 100, Armored := on, Defend := on` for the one command being resolved (silently: nothing about the shield is a status the player sees). */
export function raiseShield(c: FFXCombatant): void {
  c.stats.def = SHIELD_DEF;
  if (!c.immunityFlags.includes('armored')) c.immunityFlags.push('armored');
  if (c.statuses['defend'] === undefined) c.statuses['defend'] = { id: 'defend', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** The shield down again: Defense back to the record's, Armored and Defend off (the script clears them first thing in `onTargeted` and again in `onHit`). */
export function clearShield(c: FFXCombatant): void {
  c.stats.def = BARE_DEF;
  c.immunityFlags = c.immunityFlags.filter((f) => f !== 'armored');
  delete c.statuses['defend'];
}

/** The AP and gil of a part's death, banked when it grows back: an arm that is killed again pays again (RE §3.3). */
function bankPartDeath(ctx: Ctx, part: FFXCombatant): void {
  const rewards = part.enemy?.rewards;
  if (!rewards) return;
  const overkilled = ctx.rt.overkilled.includes(part.id);
  const ap = overkilled ? rewards.apOverkill : rewards.ap;
  ctx.state.flags[BANKED_AP] = Number(ctx.state.flags[BANKED_AP] ?? 0) + ap;
  ctx.state.flags[BANKED_GIL] = Number(ctx.state.flags[BANKED_GIL] ?? 0) + rewards.gil;
  if (overkilled) ctx.rt.overkilled = ctx.rt.overkilled.filter((id) => id !== part.id); // its next death is judged afresh
}

/**
 * The formation script's regrowth scene (RE §5.5): both arms are re-initialised from the monster record at full HP with their statuses cleared and are back in the battle. Each arm's earlier
 * death is paid first. Unless the body is already down, which nothing here checks: a dead body ends the battle before its next turn.
 */
export function regrowArms(ctx: Ctx): void {
  for (const arm of guiArms(ctx)) {
    if (isAlive(arm)) continue;
    bankPartDeath(ctx, arm);
    restorePart(ctx, arm.id, arm.enemy?.forms[0]?.hp ?? 800); // the record's 800, a fresh body
    arm.statuses = {};
  }
  ctx.emit({ type: 'message', text: "Sinspawn Gui's arms grow back", kind: 'system' });
}

/** The head's actors: whoever the engine should treat specially, marked on the runtime (no CTB turn for an arm; Wakka's weapon reaches the head). Readable from the state alone, so a rebuilt runtime can re-apply it. */
export function markGuiRuntime(state: Readonly<BattleState>, actors: ReadonlyMap<CombatantId, ActorRuntime>): void {
  if (typeof state.flags[GUI_FIGHT] !== 'number') return;
  for (const id of GUI_ARM_IDS) {
    const rt = actors.get(id);
    if (rt) rt.ordersOnly = true; // the arms never take a turn and are hidden from the CTB list (RE §3.1)
  }
  const wakka = actors.get('wakka');
  if (wakka) wakka.rangedWeapon = true; // "Wakka's Attack 3": his weapon commands reach the head (RE §4, reach 0x799690)
}

/** The opening state: the fight number and the body's acceleration line, then the runtime marks. Nothing is emitted (setup events never reach the presenter). */
export function applyGuiSetup(ctx: Ctx): void {
  const body = guiBody(ctx);
  if (!body) return;
  const second = isSecondFight(body);
  ctx.state.flags[GUI_FIGHT] = second ? 2 : 1;
  ctx.state.flags[GUI_ACCEL_LINE] = second ? 12_000 : Math.floor(body.stats.maxHp / 3);
  ctx.state.flags[GUI_RELAY] = 0;
  ctx.state.flags[GUI_HEAD_STATE_FLAG] = 1;
  markGuiRuntime(ctx.state, ctx.rt.actors);
}
