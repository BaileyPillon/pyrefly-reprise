/**
 * What the strategy guide's line reads off a battle: the board (who is deciding, the party as the fight
 * sees it, the boss, the rows the character may press), the conditions a step may ask for
 * (`LineWhen`), and where a step aims (`LineAim`). Split out of `./guide-line.ts`, which turns
 * steps into picks, so each file stays under the house limit.
 *
 * Reads the battle state and the decision's rows and nothing else: no tactic, no advisor, no
 * `intendedStrategy`. `tests/unit/guide-line-separation.test.ts` pins that.
 *
 * **Game case: both** [AGENTS.md rule 14]: the conditions name statuses and flags either game has;
 * FFX has no Defend row on its menu, FFX-2 keeps it, and `playableHere` says so.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  BattleState,
  CombatantId,
  EnemyFields,
} from '../../battle/common/types.ts';
import type { ChapterGuide } from '../../data/guides/types.ts';
import type { LineAim, LineWhen } from '../../data/guides/line-types.ts';
import { activeCharges, type GuideDecision } from './guide.ts';

// ------------------------------------------------------------------- board

export const alive = (c: AnyCombatant | undefined): c is AnyCombatant => c !== undefined && c.alive && !c.removed;
export const hasStatus = (c: AnyCombatant | undefined, status: string): boolean =>
  c !== undefined && (c.statuses as Record<string, unknown>)[status] !== undefined;
export const frac = (c: AnyCombatant): number => c.hp / Math.max(1, c.stats.maxHp);
const stacksOf = (c: AnyCombatant, status: string): number =>
  (c.statuses as Record<string, { stacks?: number } | undefined>)[status]?.stacks ?? 0;

export interface Board {
  state: Readonly<BattleState>;
  decision: GuideDecision;
  actor: AnyCombatant | undefined;
  /** The party as the fight sees it: the aeon alone while one is out, else the three actives (KO'd included). */
  field: AnyCombatant[];
  /** The chapter's boss: its first listed id that is standing, else the first foe that can be aimed at. */
  boss: AnyCombatant | undefined;
  /** Rows the character may play right now. */
  rows: AvailableCommand[];
  /** Names of the telegraphs that are live, lower-cased. */
  charges: string[];
}

export function readBoard(state: Readonly<BattleState>, guide: ChapterGuide, decision: GuideDecision): Board {
  const ids = state.aeonId ? [state.aeonId] : state.activeIds;
  const field = ids.map((id) => state.combatants[id]).filter((c): c is AnyCombatant => c !== undefined);
  const foes = Object.values(state.combatants).filter(
    (c) => c.side === 'enemy' && alive(c) && !c.flags.untargetable && !c.flags.hidden,
  );
  let boss: AnyCombatant | undefined;
  for (const id of guide.bossIds) {
    const c = state.combatants[id];
    if (c && c.side === 'enemy' && alive(c) && !c.flags.hidden && !c.flags.untargetable) {
      boss = c;
      break;
    }
  }
  boss ??= foes[0];
  return {
    state,
    decision,
    actor: state.combatants[decision.actorId],
    field,
    boss,
    rows: decision.commands.filter((r) => r.enabled && playableHere(state, r)),
    charges: activeCharges(state).map((c) => c.name.trim().toLowerCase()),
  };
}

/**
 * FFX's command window has no Defend row (`src/ui/ffx/CommandMenuLogic.ts`), so a line must never
 * name it there; FFX-2 keeps it on the menu.
 */
function playableHere(state: Readonly<BattleState>, row: AvailableCommand): boolean {
  return !(state.game !== 'ffx2' && row.command.kind === 'defend');
}

// -------------------------------------------------------------- conditions

/** Was `foe`'s latest `action-start` this ability? False when it has not acted yet. */
function lastActionWas(state: Readonly<BattleState>, foe: CombatantId, ability: string): boolean {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i] as { type: string; actorId?: string; abilityId?: string };
    if (e.type === 'action-start' && e.actorId === foe) return e.abilityId === ability;
  }
  return false;
}

export function applies(w: LineWhen | undefined, b: Board): boolean {
  if (!w) return true;
  const living = b.field.filter(alive);
  if (w.actor && !w.actor.includes(b.decision.actorId)) return false;
  if (w.partyHas !== undefined) {
    const n = living.filter((c) => hasStatus(c, w.partyHas!)).length;
    if (n < (w.partyHasAtLeast ?? 1)) return false;
  }
  if (w.partyLacks !== undefined) {
    const n = living.filter((c) => !hasStatus(c, w.partyLacks!)).length;
    if (n < (w.partyLacksAtLeast ?? 1)) return false;
  }
  if (w.partyLacksAll !== undefined && living.some((c) => hasStatus(c, w.partyLacksAll!))) return false;
  if (w.actorHas !== undefined && !hasStatus(b.actor, w.actorHas)) return false;
  if (w.actorLacks !== undefined && hasStatus(b.actor, w.actorLacks)) return false;
  if (w.bossHas !== undefined && !hasStatus(b.boss, w.bossHas)) return false;
  if (w.bossLacks !== undefined && (!b.boss || hasStatus(b.boss, w.bossLacks))) return false;
  if (w.bossBelowHp !== undefined && (!b.boss || frac(b.boss) > w.bossBelowHp)) return false;
  if (w.bossAboveHp !== undefined && (!b.boss || frac(b.boss) <= w.bossAboveHp)) return false;
  if (w.anyBelowHp !== undefined) {
    const x = w.anyBelowHp;
    if (!living.some((c) => !hasStatus(c, 'zombie') && frac(c) < x)) return false;
  }
  if (w.bossMpFrom !== undefined && (!b.boss || b.boss.mp < w.bossMpFrom)) return false;
  if (w.bossGaugeFrom !== undefined) {
    const gauge = (b.boss as { overdrive?: { gauge: number } } | undefined)?.overdrive?.gauge;
    if (gauge === undefined || gauge < w.bossGaugeFrom) return false;
  }
  if (w.zombieBelowHp !== undefined) {
    const x = w.zombieBelowHp;
    if (!living.some((c) => hasStatus(c, 'zombie') && frac(c) < x)) return false;
  }
  if (w.anyBelowHpAbs !== undefined) {
    const x = w.anyBelowHpAbs;
    if (!living.some((c) => !hasStatus(c, 'zombie') && c.hp < x)) return false;
  }
  if (w.downed !== undefined) {
    const down = b.field.some((c) => !c.alive && !c.removed);
    if (down !== w.downed) return false;
  }
  if (w.downedAtLeast !== undefined && b.field.filter((c) => !c.alive && !c.removed).length < w.downedAtLeast) return false;
  if (w.charging) {
    const live = (n: string): boolean => (n === '#' ? b.charges.some((c) => /^\d+$/.test(c)) : b.charges.includes(n.toLowerCase()));
    if (!w.charging.some(live)) return false;
  }
  if (w.actorStacksBelow) {
    if (!b.actor || stacksOf(b.actor, w.actorStacksBelow.status) >= w.actorStacksBelow.count) return false;
  }
  if (w.allStacksBelow) {
    const { status, count } = w.allStacksBelow;
    if (living.some((c) => stacksOf(c, status) >= count)) return false;
  }
  if (w.turnFrom !== undefined && b.state.turn < w.turnFrom) return false;
  if (w.turnTo !== undefined && b.state.turn > w.turnTo) return false;
  if (w.formIndex !== undefined || w.formFrom !== undefined) {
    const form = b.boss ? ((b.boss as { enemy?: Partial<EnemyFields> }).enemy?.formIndex ?? 0) : -1;
    if (w.formIndex !== undefined && form !== w.formIndex) return false;
    if (w.formFrom !== undefined && form < w.formFrom) return false;
  }
  if (w.bossId !== undefined) {
    const c = b.state.combatants[w.bossId];
    if (!(c && c.side === 'enemy' && alive(c))) return false;
  }
  if (w.foeGone && w.foeGone.some((id) => alive(b.state.combatants[id]) && b.state.combatants[id]!.side === 'enemy')) return false;
  if (w.foeLastAction && !lastActionWas(b.state, w.foeLastAction.foe, w.foeLastAction.ability)) return false;
  if (w.aeonOut !== undefined && (b.state.aeonId !== null) !== w.aeonOut) return false;
  if (w.flags) {
    for (const [key, value] of Object.entries(w.flags)) {
      if (b.state.flags[key] !== value) return false;
    }
  }
  for (const [key, value] of Object.entries(w.flagsNot ?? {})) {
    if (b.state.flags[key] === value) return false;
  }
  for (const [key, { mod, is }] of Object.entries(w.flagMod ?? {})) {
    const v = b.state.flags[key];
    if (typeof v !== 'number' || v % mod !== is) return false;
  }
  for (const [key, { value, atLeast }] of Object.entries(w.flagListAtLeast ?? {})) {
    const list = String(b.state.flags[key] ?? '').split(',');
    if (list.filter((x) => x === value).length < atLeast) return false;
  }
  for (const [key, min] of Object.entries(w.flagFrom ?? {})) {
    const v = b.state.flags[key];
    if (typeof v !== 'number' || v < min) return false;
  }
  for (const [key, max] of Object.entries(w.flagBelow ?? {})) {
    const v = b.state.flags[key];
    if (typeof v === 'number' && v >= max) return false;
  }
  return true;
}

// -------------------------------------------------------------------- aim

/**
 * The legal target a step's aim asks for, `null` when the row needs no target, `undefined` when
 * the aim cannot be met on this board (the step is then skipped).
 */
export function aimAt(aim: LineAim | undefined, row: AvailableCommand, b: Board): CombatantId | null | undefined {
  const legal = row.validTargets;
  if (legal.length === 0) return null;
  const pool = (ids: readonly CombatantId[]): AnyCombatant[] =>
    ids.map((id) => b.state.combatants[id]).filter((c): c is AnyCombatant => c !== undefined);
  const legalAllies = (): AnyCombatant[] =>
    pool(legal).filter((c) => (c.side === 'party' || c.side === 'aeon') && !c.removed);
  const legalFoes = (): AnyCombatant[] => pool(legal).filter((c) => c.side === 'enemy' && alive(c));

  if (aim === undefined || aim === 'boss') {
    const foes = legalFoes();
    if (foes.length === 0) return aim === undefined ? legal[0] : undefined;
    if (b.boss && foes.some((c) => c.id === b.boss!.id)) return b.boss.id;
    return foes.reduce((best, c) => (frac(c) < frac(best) ? c : best)).id;
  }
  if (aim === 'weakest') {
    const allies = legalAllies().filter((c) => alive(c) && !hasStatus(c, 'zombie'));
    if (allies.length === 0) return undefined;
    return allies.reduce((best, c) => (frac(c) < frac(best) ? c : best)).id;
  }
  if (aim === 'downed') return legalAllies().find((c) => !c.alive)?.id;
  if (aim === 'self') return legal.includes(b.decision.actorId) ? b.decision.actorId : undefined;
  if (aim === 'first') return legal[0];
  if ('has' in aim) {
    const carrying = legalAllies().filter((c) => alive(c) && hasStatus(c, aim.has) && (aim.and === undefined || hasStatus(c, aim.and)));
    if (carrying.length === 0) return undefined;
    return (aim.lowest ? carrying.reduce((best, c) => (frac(c) < frac(best) ? c : best)) : carrying[0])!.id;
  }
  // `foes` is tested before `lacks`: `{ foes, lacks }` carries both keys, and means the foe-side one.
  if ('foes' in aim) {
    for (const id of aim.foes) {
      const foe = b.state.combatants[id];
      if (legal.includes(id) && alive(foe) && (aim.lacks === undefined || !hasStatus(foe, aim.lacks))) return id;
    }
    return undefined;
  }
  if ('lacks' in aim) {
    const lacking = legalAllies().filter((c) => alive(c) && !hasStatus(c, aim.lacks));
    return (lacking.find((c) => c.id === aim.prefer) ?? lacking[0])?.id;
  }
  if ('foesLowest' in aim || 'foesHighest' in aim) {
    const lowest = 'foesLowest' in aim;
    const ids = 'foesLowest' in aim ? aim.foesLowest : aim.foesHighest;
    const standing = pool(ids.filter((id) => legal.includes(id))).filter(alive);
    if (standing.length === 0) return undefined;
    return standing.reduce((best, c) => ((lowest ? c.hp < best.hp : c.hp > best.hp) ? c : best)).id;
  }
  if ('parts' in aim) {
    const parts = legalFoes().filter((c) => c.flags.isPart);
    if (parts.length === 0) return undefined;
    const low = aim.parts === 'lowest';
    return parts.reduce((best, c) => ((low ? c.hp < best.hp : c.hp > best.hp) ? c : best)).id;
  }
  if ('listed' in aim) {
    const at = String(b.state.flags[aim.listed.key] ?? '').split(',').indexOf(aim.listed.value);
    const id = at >= 0 ? aim.listed.ids[at] : undefined;
    return id !== undefined && legal.includes(id) && alive(b.state.combatants[id]) ? id : undefined;
  }
  if ('foeHas' in aim) return legalFoes().find((c) => hasStatus(c, aim.foeHas))?.id;
  return legalFoes().find((c) => !hasStatus(c, aim.foeLacks))?.id;
}
