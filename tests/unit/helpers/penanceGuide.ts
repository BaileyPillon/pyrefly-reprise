/**
 * The **guide line** of the Penance bench (FFX only; the hidden Penance chapter; test-only; fix pass 2): a scripted player that plays the guides' strategy as closely as the engine allows, and nothing the guides do not say.
 * It reads what a player reads (the menu's rows, the party's statuses, HP and MP, the turn list as a rank-3 forecast of the next 40 turns, each arm's remaining HP, and the clock until a downed arm is back) and never the hidden
 * counter; it never writes to the engine (every command goes through `submit`). It has no reaction time. Measured in `penance-measure.test.ts` and `docs/handoff/ch-penance.md` section 5.1 (55 of 100 on the shipped party).
 *
 * **Where each rule comes from** (`docs/handoff/ch-penance.md` section 5.1 has the full list with the pages):
 * - Cheer five times through Rikku's Nul-All Mix at once (Jegged, GamerGuides, Game8, eip.gg; the engine has no Hypello Potion item, so the Mix is Hyper NulAll, not Ultra NulAll); Three Stars so Quick Hit, Dispel, Esuna and Curaga
 *   cost nothing after Immolation and Judgment Day empty the MP (Jegged, Game8, eip.gg). **Three Stars is the keystone: the line wins none without it.**
 * - **The arms never get a turn** (Game8, eip.gg, Jegged): each arm takes six Celestial hits, five of them whenever there is room and the sixth *just before it acts* (eip.gg, Game8), the two arms never killed together so
 *   they do not come back together (Jegged's gap, eip.gg); the Left Arm first (GamerGuides, Jegged: Tera Graviton) or the Right Arm first (Game8) is the `first` option. The body takes every turn the arms can spare (Game8: attack
 *   Penance only when the arms cannot act first); Quick Hit for every blow of Tidus (Jegged, GamerGuides, Game8, eip.gg); Tidus's Energy Rain when it reaches the body and an arm at once.
 * - Phase 2: Dispel anyone Immolation hit before the next blow (all four), Dispel Penance's Haste at once (eip.gg, GamerGuides) and Mighty Guard's Regen (Jegged, GamerGuides); a standing arm at each of Penance's turns is the
 *   Judgment Day rule (all four), so the arm that can be killed in time is killed before Penance's next turn.
 * - Soft or Esuna on a Petrified member (GamerGuides: Stoneproof; the others cure), a Phoenix Down on a fallen one, X-Potions (Auto-Potion does most of it).
 */

import type { BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { predictTurnOrder } from '../../../src/battle/ffx/turnQueue.ts';
import { ARMS, LEFT_ARM, PENANCE, RIGHT_ARM, actor, ctxOf, defend, flags, row, type Input } from './penanceDrive.ts';

export interface GuideOptions {
  readonly name: string;
  /** Which arm goes first when both stand and neither is more urgent: GamerGuides and Jegged (Tera Graviton) say the Left, Game8 the Right. */
  readonly first: 'left' | 'right';
  /** Keep the finishing blows for the last party turns before an arm acts (eip.gg, Game8) and so stagger the two arms. */
  readonly hold: boolean;
  /** Party turns kept in hand before an arm's action (variance and a missed blow). */
  readonly margin: number;
  /** Three Stars on the first calm turn (Jegged, Game8, eip.gg). */
  readonly threeStars: boolean;
  /** Tidus's Energy Rain when it reaches the body and at least one arm and kills neither. */
  readonly rain: boolean;
  /** Dispel Penance's Haste and Mighty Guard's Regen (eip.gg, GamerGuides, Jegged). */
  readonly dispelPenance: boolean;
  /** Esuna or Remedy on Sleep, Silence, Darkness, Poison (the guides name these ailments; none says "cure them"). */
  readonly cureAilments: boolean;
  /** Phase 2: a standing arm must be down at each of Penance's turns (the Judgment Day rule), so the arm that can fall in time is struck. */
  readonly judgmentGuard: boolean;
  /** When the arms cannot both be saved, the one named in `first` is the one that falls (GamerGuides, Game8) and not the one that acts sooner. */
  readonly triage: boolean;
  /** Phase 2: keep one party turn in hand for each of Penance's turns before an arm acts (the Dispel after Immolation; all four guides). */
  readonly reserve: boolean;
  /** Heal a member under half before striking a critical arm when Penance acts first. */
  readonly healFirst: boolean;
  /** Extra (no guide says it): Rikku, her Mix spent, is swapped for Auron, whose Celestial weapon counters (eip.gg names the counter weapons). */
  readonly swapAuron?: boolean;
  /** Extra (no guide says it): Defend when Penance acts before this member's next turn and he is under 60 percent. */
  readonly defend?: boolean;
}

export const GUIDE_DEFAULT: GuideOptions = { name: 'guide', first: 'left', hold: true, margin: 1, threeStars: true, rain: true, dispelPenance: true, cureAilments: true, judgmentGuard: true, triage: true, reserve: true, healFirst: true };

const HIT = 99_999;
const has = (c: FFXCombatant, s: string): boolean => (c.statuses as Record<string, unknown>)[s] !== undefined;
const stacksOf = (c: FFXCombatant, s: string): number => ((c.statuses as Record<string, { stacks?: number } | undefined>)[s]?.stacks ?? 0);
const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const MIXES = new WeakMap<object, number>();
const MIXES_IN_BAG = 4;

/** Can this member take a turn (asleep and Petrified members lose theirs)? */
const canAct = (c: FFXCombatant): boolean => c.alive && !c.removed && !has(c, 'sleep') && !has(c, 'petrify') && !has(c, 'stop');

interface ArmPlan { id: string; need: number; idx: number; party: number }

/** Where each standing arm's next turn sits in the turn list, how many hits it still needs, and how many party turns come before it (this one included). */
function armPlans(engine: BattleEngine, rows: ReturnType<typeof predictTurnOrder>): ArmPlan[] {
  const out: ArmPlan[] = [];
  for (const id of ARMS) {
    const a = actor(engine, id);
    if (!a.alive) continue;
    const idx = rows.findIndex((r) => r.actorId === id);
    if (idx < 0) continue;
    const need = Math.max(1, Math.ceil(a.hp / HIT) + (has(a, 'regen') ? 1 : 0));
    const party = rows.slice(0, idx).filter((r) => r.isParty && canAct(actor(engine, r.actorId))).length;
    out.push({ id, need, idx, party });
  }
  return out;
}

/** The arm this turn must go to, or null when the turn can go elsewhere without an arm acting; `critical` = no turn to spare at all. */
function armCall(engine: BattleEngine, o: GuideOptions, rows: ReturnType<typeof predictTurnOrder>): { target: string | null; critical: boolean } {
  const plans = armPlans(engine, rows).sort((a, b) => a.idx - b.idx || (a.id === (o.first === 'left' ? LEFT_ARM : RIGHT_ARM) ? -1 : 1));
  if (plans.length === 0) return { target: null, critical: false };
  const margin = o.hold ? o.margin : Math.max(o.margin, 99);
  const phase2 = flags(engine)['pen.phase'] === 1;
  let sum = 0;
  let violated: ArmPlan | null = null;
  let critical = false;
  let infeasible = false;
  for (const p of plans) {
    sum += p.need;
    const support = o.reserve && phase2 ? rows.slice(0, p.idx).filter((r) => r.actorId === PENANCE).length : 0; // Immolation breaks a member's armour at each of Penance's turns: a Dispel is owed
    if (p.party - 1 < sum + margin + support) violated ??= plans[0] ?? p;
    if (p.party - 1 < sum) critical = true;
    if (p.party < sum) infeasible = true;
  }
  // Both arms cannot be saved (the opening: the party has about eight turns before the first arm acts): the arm the guides fear more is the one that falls (GamerGuides: the Left Arm, Mega-Graviton; Game8: the Right Arm), if it can fall in time.
  if (o.triage && infeasible && plans.length >= 2) {
    const preferred = plans.find((p) => p.id === (o.first === 'left' ? LEFT_ARM : RIGHT_ARM));
    const pick = preferred && preferred.party >= preferred.need ? preferred : (plans.find((p) => p.party >= p.need) ?? plans[0]!);
    return { target: pick.id, critical: true };
  }
  // The Judgment Day rule (phase 2): an arm must be down at each of Penance's turns. An arm that is up at the next one is a standing arm or one that is due back before it; with both up, a standing arm falls before it.
  if (o.judgmentGuard && flags(engine)['pen.phase'] === 1) {
    const pIdx = rows.findIndex((r) => r.actorId === PENANCE);
    const pTick = pIdx >= 0 ? (rows[pIdx]?.tickValue ?? 0) : 0;
    const upAtPenance = ARMS.filter((id) => actor(engine, id).alive || returnsIn(engine, id) <= pTick);
    if (pIdx >= 0 && upAtPenance.length === 2 && plans.length >= 1) {
      const before = rows.slice(0, pIdx).filter((r) => r.isParty && canAct(actor(engine, r.actorId))).length;
      const g = [...plans].sort((a, b) => a.need - b.need)[0]!;
      const owed = g.need + plans.filter((p) => p !== g && p.idx < pIdx).reduce((a, p) => a + p.need, 0);
      const supportP = o.reserve ? 1 : 0; // the Dispel owed after the last Immolation
      if (before - 1 < owed + o.margin + supportP) {
        violated ??= g;
        if (before - 1 < owed) critical = true;
        const urgent = plans.filter((p) => p.idx < pIdx || p === g).sort((a, b) => a.idx - b.idx)[0] ?? g;
        return { target: urgent.id, critical };
      }
    }
  }
  return { target: violated ? violated.id : null, critical };
}

/** Ticks until an arm that is down is due back, or 0 for one that stands (the Yu Pagodas' timer; a player reads it off the turn list when the arm reappears). */
function returnsIn(engine: BattleEngine, armId: string): number {
  if (actor(engine, armId).alive) return 0;
  const due = ctxOf(engine).rt.pendingPartRevivals.find((p) => p.id === armId);
  return due === undefined ? Number.POSITIVE_INFINITY : Math.max(0, due.atTicks - engine.state().ticks);
}

/** The first row of `ids` the actor can use on `target`. */
function firstRow(d: Input, kind: Command['kind'], ids: readonly string[], target?: string): Command | null {
  for (const id of ids) {
    const r = row(d, kind, id, target);
    if (r) return r;
  }
  return null;
}

/** The guide line's command for `d`. */
export function guideTurn(engine: BattleEngine, d: Input, o: GuideOptions): Command {
  const me = actor(engine, d.actorId);
  const party = front(engine);
  const rows = predictTurnOrder(ctxOf(engine), 40);
  const penance = actor(engine, PENANCE);
  const phase2 = flags(engine)['pen.phase'] === 1;

  // 0. The Mix: Rikku's Hyper NulAll at the start and again for any member who lost his Cheers (a fallen member loses them).
  if (me.id === 'rikku') {
    const mix = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.command.id === 'mix');
    const used = MIXES.get(engine) ?? 0;
    const lacking = party.filter((c) => c.alive && stacksOf(c, 'cheer') < 5).length;
    if (mix && used < MIXES_IN_BAG && lacking >= (used === 0 ? 1 : 2)) {
      MIXES.set(engine, used + 1);
      return { kind: 'overdrive', id: 'mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['lunar-curtain', 'mana-spring'], resultAbilityId: 'mix-hyper-nul-all' } } };
    }
  }

  if (o.swapAuron && me.id === 'rikku' && (MIXES.get(engine) ?? 0) >= 1 && (me.overdrive?.gauge ?? 0) < 100) {
    const auron = actor(engine, 'auron');
    if (auron.alive && !engine.state().activeIds.includes('auron')) return { kind: 'switch', targets: [], extra: { outId: 'rikku', inId: 'auron' } };
  }

  const call = armCall(engine, o, rows);
  const aim = (id: string): Command | null => (me.id === 'tidus' ? row(d, 'ability', 'quick-hit', id) : null) ?? row(d, 'attack', undefined, id);

  // 1a. A member who the next blow of Penance would kill is healed before the arm is struck, when Penance acts first (GamerGuides: heal before Penance moves; the sets without Auto-Potion need it).
  if (o.healFirst && call.critical && call.target) {
    const pIdx = rows.findIndex((r) => r.actorId === PENANCE);
    const aIdx = rows.findIndex((r) => r.actorId === call.target);
    const weak = party.filter((c) => c.alive && !has(c, 'petrify') && c.hp < c.stats.maxHp * 0.5).sort((a, b) => a.hp - b.hp)[0];
    if (weak && pIdx >= 0 && pIdx < aIdx) {
      const heal = (me.id === 'yuna' ? firstRow(d, 'ability', ['curaga', 'cura'], weak.id) : null) ?? firstRow(d, 'item', ['x-potion', 'mega-potion', 'elixir'], weak.id);
      if (heal) return heal;
    }
  }
  // 1. An arm about to act with no turn to spare: nothing else matters.
  if (call.critical && call.target) {
    const hit = aim(call.target);
    if (hit) return hit;
  }

  // 2. What a player does first when the arms can wait: stone, the fallen, Armor Break, Penance's Regen and Haste, other ailments, wounds, Three Stars.
  const stone = party.find((c) => has(c, 'petrify'));
  if (stone) {
    const cure = firstRow(d, 'item', ['soft', 'remedy'], stone.id) ?? row(d, 'ability', 'esuna', stone.id);
    if (cure) return cure;
  }
  const fallen = party.find((c) => !c.alive && !c.removed);
  if (fallen) {
    const pd = row(d, 'item', 'phoenix-down', fallen.id);
    if (pd) return pd;
  }
  if (me.id === 'yuna') {
    const broken = party.filter((c) => c.alive && (has(c, 'armor-break') || has(c, 'mental-break'))).sort((a, b) => a.hp - b.hp)[0];
    if (broken) {
      const dispel = row(d, 'ability', 'dispel', broken.id);
      if (dispel) return dispel;
    }
    if (o.dispelPenance && (has(penance, 'regen') || (phase2 && has(penance, 'haste')))) {
      const dispel = row(d, 'ability', 'dispel', PENANCE);
      if (dispel) return dispel;
    }
  }
  if (o.cureAilments) {
    const sick = party.find((c) => c.alive && ['sleep', 'silence', 'darkness', 'poison'].some((s) => has(c, s)));
    if (sick) {
      const cure = me.id === 'yuna' ? row(d, 'ability', 'esuna', sick.id) : row(d, 'item', 'remedy', sick.id);
      if (cure) return cure;
    }
  }
  const hurt = party.filter((c) => c.alive && c.hp < c.stats.maxHp * 0.5).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = (me.id === 'yuna' ? firstRow(d, 'ability', ['curaga', 'cura'], hurt.id) : null) ?? firstRow(d, 'item', ['x-potion', 'mega-potion', 'elixir'], hurt.id);
    if (heal) return heal;
  }
  if (!call.target && o.threeStars && !party.some((c) => has(c, 'mp-cost-zero'))) {
    const stars = row(d, 'item', 'three-stars');
    if (stars) return stars;
  }

  // 3. The arms the turn is owed to.
  if (call.target) {
    const hit = aim(call.target);
    if (hit) return hit;
  }

  if (o.defend && !call.target && me.hp < me.stats.maxHp * 0.6) {
    const pIdx = rows.findIndex((r) => r.actorId === PENANCE);
    const mine = rows.findIndex((r, i) => i > 0 && r.actorId === me.id);
    if (pIdx >= 0 && (mine < 0 || pIdx < mine)) return defend();
  }

  // 4. The body: Energy Rain when it reaches an arm as well, Quick Hit, or a plain Attack.
  if (me.id === 'tidus' && o.rain) {
    const standing = armPlans(engine, rows);
    const rain = row(d, 'overdrive', 'energy-rain');
    if (rain && standing.length >= 1 && standing.every((p) => p.need >= 2)) return { ...rain, targets: [] };
  }
  return aim(PENANCE) ?? row(d, 'attack', undefined, PENANCE) ?? defend();
}

