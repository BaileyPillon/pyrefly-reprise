/**
 * **Biran and Yenke's rules** (the hidden Biran and Yenke chapter; **FFX only** [AGENTS.md rule 14]). Source: `research/ffx-biran-yenke.md` ("§n").
 *
 * - **The opening** (§2.2): the battle writes HP, Strength, Magic and Agility on both Ronso from Kimahri's own stats (`./biran-yenke-stats.ts`) **before** the first turn order is
 *   drawn (the Agility offsets would mean nothing otherwise), puts both on row 0 and gives both the guarding stance.
 * - **The guarding** (§4.4): while the two stand on the same row, each holds **Sentinel** as a standing stance (a permanent instance, which the start-of-turn stance tick leaves
 *   alone, as it leaves one the gear gives: `adapt/status.ts#givenExtraWord`). The engine's own Cover (`kernel/cover.ts`, the game's `pp_BtlFindCover`) steps the partner in for
 *   any single-target physical blow aimed at the other, and the stance halves it (`kernel/modifiers.ts#defendSentinelMod`): Kimahri's Attack lands on the wrong Ronso at half
 *   damage, a quarter under Mighty Guard's Protect. Spells, Lancet, items and every Ronso Rage are not physical, so they are never covered or halved. **Bulldoze moves its user to
 *   the other row**; while the rows differ, or once one has fallen, neither holds the stance. The stance is our model of "they guard each other" (§12 question 1: the script's own
 *   stance is not read); {@link GUARD_STANCE} is the switch.
 * - **Lancet** (§4.5): what each Ronso teaches, in order; the last of each only after he has used it.
 *
 * State lives where every script's does: each Ronso's row and the once-only flags in `BattleState.flags`, so a forked or restored battle carries it.
 */

import type { BattleState, FFXCombatant, StatusId, StatusInstance } from '../../common/types.ts';
import { baseCtb } from '../math.ts';
import { chrBaseCtb } from '../kernel/ctb.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { queueEmit } from './hooks.ts';
import { type KimahriNumbers, type RonsoNumbers, biranNumbers, yenkeNumbers } from './biran-yenke-stats.ts';

export * from './biran-yenke-stats.ts';

// ---------------------------------------------------------------------------------------------- ids

/** Ids, mirrored from `data/ffx/biran-yenke-ids.ts` (the battle layer does not import the data layer; `tests/unit/chapters/biran-yenke-data.test.ts` pins that the two agree). */
export const BIRAN_ID = 'biran-ronso';
export const YENKE_ID = 'yenke-ronso';
export const BIRAN_SCRIPT = 'biran-ronso';
export const YENKE_SCRIPT = 'yenke-ronso';
export const KIMAHRI_ID = 'kimahri';

export const RONSO_BULLDOZE_ID = 'ronso-bulldoze';
export const YENKE_FIRE_BREATH_ID = 'yenke-fire-breath';
export const YENKE_AQUA_BREATH_ID = 'yenke-aqua-breath';
export const BIRAN_BERSERK_ID = 'biran-berserk';
export const BIRAN_MIGHTY_GUARD_ID = 'biran-mighty-guard';
export const BIRAN_MIGHTY_GUARD_SELF_ID = 'biran-mighty-guard-self';
export const YENKE_WHITE_WIND_ID = 'yenke-white-wind';
export const YENKE_WHITE_WIND_SELF_ID = 'yenke-white-wind-self';

// ---------------------------------------------------------------------------------------------- rows and the guarding (§4.4)

/** The stance the two hold while together: Sentinel, the game's "guard allies while in defensive stance" (Cover plus half damage). */
export const GUARD_STANCE: StatusId = 'sentinel';

/** Battle flag: a Ronso's row, 0 where he started and 1 after an odd number of his own Bulldozes. */
export const rowFlag = (id: string): string => `ronso.row.${id}`;

/** A Ronso on the field, alive or not. */
export function ronso(ctx: Pick<Ctx, 'state'>, id: string): FFXCombatant | undefined {
  return ctx.state.combatants[id] as FFXCombatant | undefined;
}

/** True when this battle is the Ronso duel. */
export function isRonsoDuel(state: Readonly<BattleState>): boolean {
  return state.combatants[BIRAN_ID] !== undefined && state.combatants[YENKE_ID] !== undefined;
}

/** A Ronso's row (0 or 1). */
export function rowOf(ctx: Pick<Ctx, 'state'>, id: string): number {
  return Number(ctx.state.flags[rowFlag(id)] ?? 0) === 1 ? 1 : 0;
}

/** Bulldoze moved its user to the other row (§4.4). */
export function switchRow(ctx: Pick<Ctx, 'state'>, id: string): void {
  ctx.state.flags[rowFlag(id)] = rowOf(ctx, id) === 1 ? 0 : 1;
}

/** Both stand, on the same row: they guard each other. */
export function together(ctx: Pick<Ctx, 'state'>): boolean {
  const b = ronso(ctx, BIRAN_ID);
  const y = ronso(ctx, YENKE_ID);
  return b !== undefined && y !== undefined && isAlive(b) && isAlive(y) && rowOf(ctx, BIRAN_ID) === rowOf(ctx, YENKE_ID);
}

/** The standing stance, as a gear-given (permanent) instance: the start-of-turn tick leaves it, and nothing dispels it. */
function stanceInstance(): StatusInstance {
  return { id: GUARD_STANCE, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
}

/** How {@link refreshGuard} reports a change: at once, after the action in progress (a Bulldoze that has just moved its user), or not at all (the setup). */
export type GuardReport = 'now' | 'after-action' | 'quiet';

/**
 * Bring the two stances in line with the rows: both on while the two stand together, both off otherwise. Called at the start of every Ronso turn, when a Bulldoze moves its user
 * (the change shows once the blow has landed), and when a command names a Ronso (before any damage, so the Cover of that very action sees it). A fall between those points is caught
 * by the next of them, which always comes before the next blow can be aimed.
 */
export function refreshGuard(ctx: Ctx, report: GuardReport = 'now'): void {
  const pair = [ronso(ctx, BIRAN_ID), ronso(ctx, YENKE_ID)].filter((c): c is FFXCombatant => c !== undefined);
  if (pair.length < 2) return;
  const emit = (event: Parameters<Ctx['emit']>[0]): void => {
    if (report === 'now') ctx.emit(event);
    else if (report === 'after-action') queueEmit(ctx, event);
  };
  if (together(ctx)) {
    if (pair.every((c) => has(c, GUARD_STANCE))) return;
    for (const c of pair) {
      if (has(c, GUARD_STANCE)) continue;
      const inst = stanceInstance();
      c.statuses[GUARD_STANCE] = inst;
      emit({ type: 'status-add', targetId: c.id, status: GUARD_STANCE, instance: { ...inst } });
    }
    emit({ type: 'message', text: 'Biran and Yenke close ranks', kind: 'system' });
    return;
  }
  let dropped = false;
  for (const c of pair) {
    if (!has(c, GUARD_STANCE)) continue;
    if (report === 'now') removeStatus(ctx, c, GUARD_STANCE, 'expired');
    else {
      delete c.statuses[GUARD_STANCE];
      emit({ type: 'status-remove', targetId: c.id, status: GUARD_STANCE, reason: 'expired' });
    }
    dropped = true;
  }
  if (dropped && pair.every((c) => isAlive(c))) emit({ type: 'message', text: 'Biran and Yenke stand apart', kind: 'system' });
}

// ---------------------------------------------------------------------------------------------- what Lancet teaches (§4.5)

/**
 * What each Ronso can teach, in the order he teaches it (ascending command order, `[inferred]`: every source lists them so). The last of each is taught only after the Ronso
 * has used it himself (`[search: 4 sources]`).
 */
export const BIRAN_TEACHES: readonly string[] = ['self-destruct', 'thrust-kick', 'doom', 'mighty-guard'];
export const YENKE_TEACHES: readonly string[] = ['fire-breath', 'stone-breath', 'aqua-breath', 'white-wind'];
/** The Rage each Ronso must use before he can teach it. */
export const AFTER_USE: Readonly<Record<string, string>> = { [BIRAN_ID]: 'mighty-guard', [YENKE_ID]: 'white-wind' };

/** Battle flag: true once this Ronso has used his low-HP Rage (Mighty Guard or White Wind). */
export const usedRageFlag = (id: string): string => `ronso.usedRage.${id}`;

/** The Rage this Ronso would teach Kimahri now (the first of his list Kimahri does not know, the after-use one only after use), or null. */
export function rageToTeach(ctx: Pick<Ctx, 'state'>, self: FFXCombatant, known: readonly string[]): string | null {
  const list = self.id === BIRAN_ID ? BIRAN_TEACHES : self.id === YENKE_ID ? YENKE_TEACHES : [];
  const afterUse = AFTER_USE[self.id];
  const used = ctx.state.flags[usedRageFlag(self.id)] === true;
  for (const rage of list) {
    if (known.includes(rage)) continue;
    if (rage === afterUse && !used) continue;
    return rage;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------- the opening (§2.2, §4.4)

/** Write one Ronso's numbers (HP to full) and the CTB values his Agility gives (the actor runtime caches them). */
function writeNumbers(ctx: Ctx, c: FFXCombatant, n: RonsoNumbers): void {
  c.stats.str = n.str;
  c.stats.mag = n.mag;
  c.stats.agi = n.agi;
  c.stats.hp = n.hp;
  c.stats.maxHp = n.hp;
  c.hp = n.hp;
  const form = c.enemy?.forms[0];
  if (form) form.hp = n.hp;
  const rt = rtOf(ctx, c.id);
  rt.base = baseCtb(n.agi);
  rt.icv = chrBaseCtb(n.agi);
}

/** Kimahri's four numbers as the battle reads them, from the combatant. */
export function kimahriNumbersOf(c: FFXCombatant): KimahriNumbers {
  return { str: c.stats.str, mag: c.stats.mag, hp: c.hp, agi: c.stats.agi };
}

/**
 * The battle's opening for the Ronso duel: the two Ronso's numbers from Kimahri's (§2.2), both on row 0, both holding the stance (§4.4). Runs **before** the opening turn order is
 * drawn (`setup.ts`), so the Agility it writes is the one the order reads. A no-op in every other battle. Nothing is emitted (setup events never reach the presenter).
 */
export function applyRonsoSetup(ctx: Ctx): void {
  if (!isRonsoDuel(ctx.state)) return;
  const kimahri = tryActor(ctx, KIMAHRI_ID);
  const biran = ronso(ctx, BIRAN_ID);
  const yenke = ronso(ctx, YENKE_ID);
  if (!biran || !yenke) return;
  if (kimahri) {
    const k = kimahriNumbersOf(kimahri);
    writeNumbers(ctx, biran, biranNumbers(k));
    writeNumbers(ctx, yenke, yenkeNumbers(k));
  }
  ctx.state.flags[rowFlag(BIRAN_ID)] = 0;
  ctx.state.flags[rowFlag(YENKE_ID)] = 0;
  ctx.state.flags[usedRageFlag(BIRAN_ID)] = false;
  ctx.state.flags[usedRageFlag(YENKE_ID)] = false;
  refreshGuard(ctx, 'quiet');
}
