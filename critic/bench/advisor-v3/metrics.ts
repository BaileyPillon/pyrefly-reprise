/**
 * **Advisor v3 scorecard: what one card got wrong at one decision.** Five readings,
 * each measured with the engines' own resolution (`simulate*Command`, pure copies)
 * and the advisor's own forecast (`forecastFromState`), never by reading the
 * advisor's code:
 *
 *  1. **Duplicate advice** (FFX-2 only: only ATB has a command in flight while another
 *     menu is open [research/ffx2-combat-core.md §1.1]; FFX's CTB resolves a command
 *     before the next turn opens, so an FFX board never carries one). A command is
 *     *pending* when another girl has it on her charge bar (`atb.charging`) or the
 *     engine holds it for a chain lock (`FFX2Engine.heldCommand()`). The card's top
 *     row is a **duplicate** when it is a support move (no damage to enemies, no
 *     status on an enemy) and every effect it has is already on its way: each ally it
 *     heals is healed to full by the pending commands, each ally it raises is being
 *     raised, each ally status it grants or cures is being granted or cured. **Same
 *     move** is the looser reading Bailey's words name ("it shouldn't still tell me to
 *     mega potion"): a support top row with the same kind and id as a pending one.
 *  2. **Missed revive**: an active ally is down, nothing pending raises them, a row on
 *     this menu would (simulated), and the card's top row raises nobody. Counted
 *     overall and **while the party is losing** (living party HP fraction below the
 *     enemies' HP fraction).
 *  3. **Not on the menu**: no enabled row of the top command's kind and id (and
 *     switch member / Change destination), or a row this game's window does not paint
 *     (`pressable`). **Bad aim**: the row exists but does not offer the aimed target
 *     (a self-only meta row excepted, `metaRowFor`).
 *  4. **Lethal-save miss**: the forecast says the enemy's next action kills a living
 *     ally, some row on this menu would keep them alive (`evaluate`'s
 *     `saves-from-lethal`, the advisor's own proof), and the top row does not.
 *
 * Game case: **both**, except reading 1, which is **FFX-2 only** and reads zero on
 * every FFX board by construction.
 */

import type { AvailableCommand, BattleState, Command, CombatantId } from '../../../src/battle/common/types.ts';
import type { SimOutcome } from '../../../src/battle/ffx/simulate.ts';
import { simulateFFXCommand } from '../../../src/battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../../src/battle/ffx2/simulate.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { metaRowFor, type AdvisorOptions, type AdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { pressable } from '../../../src/engine/tactics/advisor-menu.ts';
import { sameChange } from '../../../src/engine/tactics/advisor-change.ts';
import { evaluate } from '../../../src/engine/tactics/advisor-eval.ts';
import { forecastFromState } from '../../../src/engine/tactics/advisor-forecast.ts';
import type { DecisionContext } from './drive.ts';

/** Most simulations one decision's readings may spend. */
const MAX_SIMS = 160;

export interface Pending { actorId: CombatantId; command: Command; held: boolean }

export interface DecisionObs {
  pending: number;
  dupStrict: boolean;
  dupSame: boolean;
  /** `"<pending id> -> <top id>"`, for the census. */
  dupWhat: string;
  down: number;
  raiseOnMenu: boolean;
  topRaises: boolean;
  runnerUpRaises: boolean;
  noteShown: boolean;
  losing: boolean;
  missedRevive: boolean;
  notOnMenu: boolean;
  badAim: boolean;
  lethalThreat: boolean;
  savable: boolean;
  lethalMiss: boolean;
}

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');

export function simulateFor(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  options: AdvisorOptions,
): SimOutcome | null {
  try {
    if (state.game === 'ffx2') {
      return simulateFFX2Command(state, actorId, command, {
        roll: 'mid',
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
    }
    return simulateFFXCommand(state, actorId, command, { roll: 'mid', ...(options.ffxContent ? { content: options.ffxContent } : {}) });
  } catch {
    return null;
  }
}

/** Every command in flight for another girl: on a charge bar, or held (FFX-2 only). */
export function pendingCommands(ctx: DecisionContext): Pending[] {
  const { state, decision } = ctx;
  if (state.game !== 'ffx2') return [];
  const out: Pending[] = [];
  for (const id of state.activeIds) {
    if (id === decision.actorId) continue;
    const c = state.combatants[id] as { alive?: boolean; atb?: { charging?: { commandRef?: Command } | null } } | undefined;
    const cmd = c?.alive !== false ? c?.atb?.charging?.commandRef : undefined;
    if (cmd) out.push({ actorId: id, command: cmd, held: false });
  }
  const held = (ctx.engine as unknown as FFX2Engine).heldCommand?.() ?? null;
  if (held && held.actorId !== decision.actorId) out.push({ actorId: held.actorId, command: held.command, held: true });
  return out;
}

const isAlly = (s: Readonly<BattleState>, id: CombatantId): boolean => s.combatants[id]?.side !== 'enemy';

function supportOnly(s: Readonly<BattleState>, o: SimOutcome): boolean {
  if (o.damageToEnemies > 0) return false;
  if (o.statusChanges.some((c) => c.applied && !isAlly(s, c.targetId))) return false;
  const heals = Object.entries(o.hpDelta).some(([id, d]) => d < 0 && isAlly(s, id));
  return heals || o.revives.length > 0 || o.statusChanges.some((c) => isAlly(s, c.targetId));
}

function duplicate(s: Readonly<BattleState>, top: SimOutcome, pend: SimOutcome[]): boolean {
  if (!supportOnly(s, top)) return false;
  const raised = new Set(pend.flatMap((p) => p.revives));
  const buffs = new Set(pend.flatMap((p) => p.statusChanges.filter((c) => c.applied).map((c) => `${c.targetId}:${c.status}`)));
  const cures = new Set(pend.flatMap((p) => p.statusChanges.filter((c) => !c.applied).map((c) => `${c.targetId}:${c.status}`)));
  if (!top.revives.every((id) => raised.has(id))) return false;
  for (const c of top.statusChanges) {
    if (!isAlly(s, c.targetId)) continue;
    if (!(c.applied ? buffs : cures).has(`${c.targetId}:${c.status}`)) return false;
  }
  for (const [id, d] of Object.entries(top.hpDelta)) {
    if (d >= 0 || !isAlly(s, id) || top.revives.includes(id)) continue;
    const u = s.combatants[id];
    if (!u || u.alive === false) continue;
    const missing = u.stats.maxHp - u.hp;
    const coming = pend.reduce((n, p) => n + Math.max(0, -(p.hpDelta[id] ?? 0)), 0);
    if (coming < missing) return false;
  }
  return true;
}

/** Enabled, paintable rows, each aimed at every target it offers (bounded). */
function candidates(ctx: DecisionContext, filter?: (row: AvailableCommand, t: CombatantId | null) => boolean): Command[] {
  const out: Command[] = [];
  for (const row of ctx.decision.commands) {
    if (!row.enabled || row.wrapsCategory) continue;
    const k = row.command.kind;
    if (k === 'escape' || k === 'switch' || k === 'spherechange') continue;
    if (!pressable(ctx.state, row.command)) continue;
    const aims: Array<CombatantId | null> = row.validTargets.length === 0 ? [null] : row.validTargets.slice(0, 8);
    for (const t of aims) {
      if (filter && !filter(row, t)) continue;
      out.push({ ...row.command, targets: t ? [t] : [] } as Command);
      if (out.length >= MAX_SIMS) return out;
    }
  }
  return out;
}

function hpFraction(s: Readonly<BattleState>, side: 'party' | 'enemy'): number {
  let hp = 0;
  let max = 0;
  const ids = side === 'party'
    ? s.activeIds
    : Object.keys(s.combatants).filter((id) => s.combatants[id]!.side === 'enemy' && !s.combatants[id]!.removed);
  for (const id of ids) {
    const u = s.combatants[id];
    if (!u) continue;
    max += u.stats.maxHp;
    hp += u.alive === false ? 0 : Math.max(0, u.hp);
  }
  return max > 0 ? hp / max : 0;
}

function menuCheck(ctx: DecisionContext, cmd: Command): { notOnMenu: boolean; badAim: boolean } {
  const id = idOf(cmd);
  const inId = (cmd as { extra?: { inId?: string } }).extra?.inId;
  const row = ctx.decision.commands.find((r) => {
    if (!r.enabled || r.command.kind !== cmd.kind || idOf(r.command) !== id) return false;
    if (cmd.kind === 'spherechange') return sameChange(r.command, cmd);
    if (cmd.kind === 'switch') return (r.command as { extra?: { inId?: string } }).extra?.inId === inId;
    return true;
  });
  if (!row || !pressable(ctx.state, cmd)) return { notOnMenu: true, badAim: false };
  const targets = (cmd.targets ?? []) as readonly CombatantId[];
  const aimed = targets.every((t) => row.validTargets.includes(t)) || metaRowFor(ctx.decision.commands, ctx.decision.actorId, cmd) !== null;
  return { notOnMenu: false, badAim: !aimed };
}

/** Every reading for one decision, given the card the live HUD would have shown. */
export function observe(ctx: DecisionContext, view: AdvisorView | null): DecisionObs {
  const { state, decision, advisorOptions: opt } = ctx;
  const top = view?.suggestions[0]?.command ?? null;
  const topOut = top ? simulateFor(state, decision.actorId, top, opt) : null;
  const obs: DecisionObs = {
    pending: 0, dupStrict: false, dupSame: false, dupWhat: '', down: 0, raiseOnMenu: false, topRaises: false,
    runnerUpRaises: false, noteShown: (view?.note ?? '') !== '', losing: false, missedRevive: false,
    notOnMenu: false, badAim: false, lethalThreat: false, savable: false, lethalMiss: false,
  };
  // 1. Duplicates.
  const pend = pendingCommands(ctx);
  obs.pending = pend.length;
  const pendOut = pend.map((p) => simulateFor(state, p.actorId, p.command, opt)).filter((o): o is SimOutcome => o !== null);
  if (top && topOut && pend.length > 0) {
    obs.dupStrict = duplicate(state, topOut, pendOut);
    obs.dupSame = supportOnly(state, topOut) && pend.some((p) => p.command.kind === top.kind && idOf(p.command) === idOf(top));
    if (obs.dupStrict || obs.dupSame) obs.dupWhat = `${pend.map((p) => idOf(p.command) || p.command.kind).join('+')} -> ${idOf(top) || top.kind}`;
  }
  // 2. Revives.
  const raisedByPending = new Set(pendOut.flatMap((o) => o.revives));
  const down = state.activeIds.filter((id) => state.combatants[id]?.alive === false && !raisedByPending.has(id));
  obs.down = down.length;
  if (down.length > 0) {
    obs.losing = hpFraction(state, 'party') < hpFraction(state, 'enemy');
    obs.topRaises = (topOut?.revives ?? []).some((id) => down.includes(id));
    const second = view?.suggestions[1]?.command;
    const secondOut = second ? simulateFor(state, decision.actorId, second, opt) : null;
    obs.runnerUpRaises = (secondOut?.revives ?? []).some((id) => down.includes(id));
    for (const c of candidates(ctx, (_row, t) => t !== null && down.includes(t))) {
      const o = simulateFor(state, decision.actorId, c, opt);
      if (o && o.revives.some((id) => down.includes(id))) {
        obs.raiseOnMenu = true;
        break;
      }
    }
    obs.missedRevive = obs.raiseOnMenu && !obs.topRaises;
  }
  // 3. The menu.
  if (top) Object.assign(obs, menuCheck(ctx, top));
  // 4. Lethal saves.
  const intent = forecastFromState(state, opt);
  const lethal = (intent?.estimate?.perTarget ?? []).filter((p) => {
    const u = state.combatants[p.targetId];
    return u && u.side !== 'enemy' && u.alive !== false && (p.lethal || p.amount >= u.hp);
  });
  if (lethal.length > 0) {
    obs.lethalThreat = true;
    const saves = (cmd: Command, out: SimOutcome | null): boolean =>
      evaluate(state, decision.actorId, cmd, out, [], intent).facts.some((f) => f.kind === 'saves-from-lethal');
    const topSaves = top ? saves(top, topOut) : false;
    if (!topSaves) {
      for (const c of candidates(ctx)) {
        if (saves(c, simulateFor(state, decision.actorId, c, opt))) {
          obs.savable = true;
          break;
        }
      }
    } else obs.savable = true;
    obs.lethalMiss = obs.savable && !topSaves;
  }
  return obs;
}
