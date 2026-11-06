/**
 * A scripted player for the hidden Penance chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the plan's section 9; the Chapter XXVII bench's method,
 * `docs/plans/ch-mirror-aeons-bench.md`). Test-only. It reads what a player reads (the menu's rows, the party's statuses, the turn list's next entries, the HP bars, whether an arm is standing and how long until it returns) and
 * never the hidden counter.
 *
 * A **line** is a few switches on a common skeleton: the priorities of one actor's turn are fixed (cure a Petrified member, stand up a fallen one, Dispel an Armor-Broken one, heal the hurt, Dispel Penance's Regen, Cheer),
 * and what is left goes into the offense, whose target is the line's arm control. The lines:
 *
 * - **advisor**: Jegged's and the guides' play: the change is the signal, from then on at least one arm must be down at every one of Penance's turns, so an arm is hit whenever the arms standing at Penance's next two turns
 *   would be none, and the body otherwise; Dispel on whoever Immolation broke; Dispel on Penance's Regen; five Cheers on everyone first; Quick Hit for the damage.
 * - **no-arms**: the same, but the arms are never struck (what a player does who has not read the guides).
 * - **arms-only**: the same, but only the arms are struck.
 * - **careless**: Attack the first enemy that is standing, heal nobody, cure nothing.
 * - **sustain**, **sustain-left** (the fix pass): what the first measurement left untried. Rikku opens with Mighty G (Shell, Protect and Haste on everyone), Yuna keeps Shell up (it halves Tera Graviton) and leads the
 *   heals with Curaga, the others use an Elixir, Mega-Potion or X-Potion on whoever is under 40 percent, and the offense is the arm lock (or the Left Arm only, the caster of Tera Graviton).
 *
 * The build is a parameter (the plan's second lever): the shipped party, the Ribbon variant (GamerGuides' four armour abilities), the Break HP Limit variant (HP 99,999; eip.gg), or a hand-built one.
 */

import type { BattleEngine, BattleEvent, Command, FFXCombatant, FFXMemberBuild, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { predictTurnOrder } from '../../../src/battle/ffx/turnQueue.ts';
import { penanceBuild } from '../../../src/data/ffx/builds/penance.ts';
import { ARMS, LEFT_ARM, PENANCE, RIGHT_ARM, actor, ctxOf, defend, flags, log, newEngine, row, type Input } from './penanceDrive.ts';

export interface PenancePolicy {
  readonly name: string;
  /** Attack the first living enemy and do nothing else: no heals, no cures. */
  readonly careless?: boolean;
  /** Which arm control the offense follows. */
  readonly arms: 'lock' | 'dance' | 'never' | 'only' | 'left';
  /** Cure Petrify, stand up the fallen, Dispel the Armor-Broken, heal the hurt. */
  readonly care: boolean;
  /** Dispel Penance's Regen (Yuna). */
  readonly dispelRegen: boolean;
  /** Tidus's Cheer until everyone has five. */
  readonly cheer: boolean;
  /** The sustain play (fix pass): Rikku opens with Mighty G (Shell, Protect and Haste on everyone for the fight), Yuna keeps Shell up and heals first (Curaga), the others use an Elixir, Mega-Potion or X-Potion on whoever is under 40 percent. */
  readonly sustain?: boolean;
}

export const LINES: Readonly<Record<string, PenancePolicy>> = {
  /** The guides' play: the arms are the killers, so a standing arm is struck before anything else (an arm that returns does not act for a turn: it can be killed again first); the body gets what is left. */
  advisor: { name: 'advisor', arms: 'lock', care: true, dispelRegen: true, cheer: true },
  /** The body first; an arm only when the arms standing at Penance's next two turns would be none (the Judgment Day rule and nothing else). */
  'body-first': { name: 'body-first', arms: 'dance', care: true, dispelRegen: true, cheer: true },
  'no-arms': { name: 'no-arms', arms: 'never', care: true, dispelRegen: true, cheer: true },
  'arms-only': { name: 'arms-only', arms: 'only', care: true, dispelRegen: true, cheer: true },
  /** What the first measurement left untried (section 5 of the handoff): the lock with Shell kept up against Tera Graviton (it halves it) and the heals led by Yuna. */
  sustain: { name: 'sustain', arms: 'lock', care: true, dispelRegen: true, cheer: false, sustain: true },
  /** The same, striking only the Left Arm (Tera Graviton's caster) and the body: the Right Arm is left to act. */
  'sustain-left': { name: 'sustain-left', arms: 'left', care: true, dispelRegen: true, cheer: false, sustain: true },
  careless: { name: 'careless', careless: true, arms: 'never', care: false, dispelRegen: false, cheer: false },
};

export interface PenanceRun {
  readonly line: string;
  readonly seed: number;
  readonly outcome: 'victory' | 'defeat' | 'escape' | 'stalled';
  readonly decisions: number;
  /** The clock when it ended, in CTB ticks. */
  readonly ticks: number;
  /** Penance's HP when it ended. */
  readonly hp: number;
  readonly changed: boolean;
  readonly judgmentDays: number;
  readonly armDeaths: number;
  /** Party members who went down, by the action that struck last. */
  readonly downBy: Readonly<Record<string, number>>;
  readonly shattered: number;
}

/** The sustain lines heal a member who is under this share of his maximum. */
const SUSTAIN_HEAL_AT = 0.55;
const HEAL_ITEMS = ['mega-potion', 'x-potion', 'hi-potion', 'potion'] as const;

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const has = (c: FFXCombatant, s: string): boolean => (c.statuses as Record<string, unknown>)[s] !== undefined;
const stacksOf = (c: FFXCombatant, s: string): number => ((c.statuses as Record<string, { stacks?: number } | undefined>)[s]?.stacks ?? 0);

/** How many Hyper NulAll Mixes each battle has spent (the bag holds the ingredients for `MIXES_IN_BAG`: a fifth would be a wasted turn). */
const MIXES_USED = new WeakMap<object, number>();
const MIXES_IN_BAG = 4;

/** Ticks until each enemy-side part's next turn comes round, from the turn list a player sees (the first row is the actor on the clock now, with its counter). */
function penanceTurns(engine: BattleEngine): { p1: number; p2: number } {
  const rows = predictTurnOrder(ctxOf(engine), 24);
  const mine = rows.filter((r) => r.actorId === PENANCE);
  const p1 = mine[0]?.tickValue ?? 9;
  const p2 = mine[1]?.tickValue ?? p1 + 9;
  return { p1, p2 };
}

/** Ticks until an arm that is down is due back, or 0 for one that stands. */
function returnsIn(engine: BattleEngine, armId: string): number {
  if (actor(engine, armId).alive) return 0;
  const due = ctxOf(engine).rt.pendingPartRevivals.find((p) => p.id === armId);
  return due === undefined ? Number.POSITIVE_INFINITY : Math.max(0, due.atTicks - engine.state().ticks);
}

/** The arm to strike under the advisor's control, or null when the body is the target. */
function armToStrike(engine: BattleEngine): string | null {
  const { p1, p2 } = penanceTurns(engine);
  const up = ARMS.filter((a) => actor(engine, a).alive);
  if (up.length === 0) return null;
  const downAt = (t: number): number => ARMS.filter((a) => returnsIn(engine, a) > t).length;
  if (downAt(p1) > 0 && downAt(p2) > 0) return null; // an arm is down at both of the next turns: the body can have this action
  const sorted = [...up].sort((a, b) => actor(engine, a).hp - actor(engine, b).hp);
  return sorted[0] ?? null;
}

/** The target of an attack, by the line. */
function offenseTarget(engine: BattleEngine, policy: PenancePolicy): string {
  const changed = flags(engine)['pen.phase'] === 1;
  if (policy.arms === 'never') return PENANCE;
  if (policy.arms === 'only') return ARMS.find((a) => actor(engine, a).alive) ?? PENANCE;
  if (policy.arms === 'left') return actor(engine, LEFT_ARM).alive ? LEFT_ARM : PENANCE;
  if (policy.arms === 'lock') {
    // The Left Arm first (Tera Graviton takes three quarters of everyone's life and Dooms them), then the Right.
    const standing = [LEFT_ARM, RIGHT_ARM].filter((a) => actor(engine, a).alive);
    return standing[0] ?? PENANCE;
  }
  if (!changed) return PENANCE;
  return armToStrike(engine) ?? PENANCE;
}

/** A member is hurt enough to heal when the next blow could kill him: under the biggest ordinary hit (about 8,600 against a 9,999-HP member in the shipped armour), or under 62 percent of a 99,999-HP one. */
export function needsHeal(c: FFXCombatant): boolean {
  if (c.stats.maxHp > 20_000) return c.hp < c.stats.maxHp * 0.62;
  return c.hp < 8_600 && c.hp < c.stats.maxHp;
}

/** One command for `d`, by the line. */
export function choose(engine: BattleEngine, d: Input, policy: PenancePolicy): Command {
  const me = d.actorId;
  const party = front(engine);
  const target = (id: string): string => id;

  if (policy.careless) {
    const first = [PENANCE, RIGHT_ARM, LEFT_ARM].find((id) => actor(engine, id).alive) ?? PENANCE;
    return row(d, 'attack', undefined, first) ?? defend();
  }

  if (policy.sustain) return sustainTurn(engine, d, policy);

  // The opener: Rikku's Hyper NulAll (Lunar Curtain and Mana Spring) when her Overdrive is full: the four Nuls and five Cheers and Focus on everyone, in one action.
  if (policy.cheer && me === 'rikku') {
    const mix = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.command.id === 'mix');
    const used = MIXES_USED.get(engine) ?? 0;
    if (mix && used < MIXES_IN_BAG && !party.every((c) => stacksOf(c, 'cheer') >= 5)) {
      MIXES_USED.set(engine, used + 1);
      return { kind: 'overdrive', id: 'mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['lunar-curtain', 'mana-spring'], resultAbilityId: 'mix-hyper-nul-all' } } };
    }
  }

  if (policy.care) {
    const stone = party.find((c) => has(c, 'petrify'));
    if (stone) {
      const soft = row(d, 'item', 'soft', stone.id);
      if (soft) return soft;
      const esuna = row(d, 'ability', 'esuna', stone.id);
      if (esuna) return esuna;
    }
    const fallen = party.find((c) => !c.alive && !c.removed);
    if (fallen) {
      const pd = row(d, 'item', 'phoenix-down', fallen.id);
      if (pd) return pd;
    }
    if (me === 'yuna') {
      const broken = party.filter((c) => c.alive && has(c, 'armor-break')).sort((a, b) => a.hp - b.hp)[0];
      if (broken) {
        const dispel = row(d, 'ability', 'dispel', broken.id);
        if (dispel) return dispel;
      }
    }
    const hurt = party.filter((c) => c.alive && needsHeal(c)).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (hurt) {
      if (me === 'yuna') {
        const cure = row(d, 'ability', 'curaga', hurt.id) ?? row(d, 'ability', 'cura', hurt.id);
        if (cure) return cure;
      }
      for (const item of HEAL_ITEMS) {
        const it = row(d, 'item', item, hurt.id);
        if (it) return it;
      }
    }
  }

  if (policy.dispelRegen && me === 'yuna' && has(actor(engine, PENANCE), 'regen')) {
    const dispel = row(d, 'ability', 'dispel', PENANCE);
    if (dispel) return dispel;
  }

  if (policy.cheer && me === 'tidus') {
    const needy = party.filter((c) => c.alive && stacksOf(c, 'cheer') < 5).sort((a, b) => stacksOf(a, 'cheer') - stacksOf(b, 'cheer'))[0];
    if (needy) {
      const cheer = row(d, 'ability', 'cheer', needy.id);
      if (cheer) return cheer;
    }
  }

  const goal = target(offenseTarget(engine, policy));
  if (me === 'tidus' && policy.cheer) {
    const rain = row(d, 'overdrive', 'energy-rain');
    if (rain) return { ...rain, targets: [] };
  }
  if (me === 'tidus') {
    const hit = row(d, 'ability', 'quick-hit', goal);
    if (hit) return hit;
  }
  return row(d, 'attack', undefined, goal) ?? row(d, 'attack', undefined, PENANCE) ?? defend();
}

/** The sustain lines' turn: stand up the fallen, Mighty G on a party without Shell, Yuna's Dispel on Penance's Regen then her heals then Shell, the others' potions under 40 percent, then the offense by the line's arm control. */
function sustainTurn(engine: BattleEngine, d: Input, policy: PenancePolicy): Command {
  const me = d.actorId;
  const party = front(engine);
  const fraction = (c: FFXCombatant): number => c.hp / c.stats.maxHp;
  const fallen = party.find((c) => !c.alive && !c.removed);
  const pd = fallen ? row(d, 'item', 'phoenix-down', fallen.id) : null;
  if (pd) return pd;
  const shell = party.filter((c) => c.alive && !has(c, 'shell'));
  const mix = me === 'rikku' ? d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.command.id === 'mix') : undefined;
  const used = MIXES_USED.get(engine) ?? 0;
  if (mix && used < MIXES_IN_BAG && shell.length >= 2) {
    MIXES_USED.set(engine, used + 1);
    return { kind: 'overdrive', id: 'mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['remedy', 'lunar-curtain'], resultAbilityId: 'mix-mighty-g' } } };
  }
  const hurt = party.filter((c) => c.alive && fraction(c) < SUSTAIN_HEAL_AT).sort((a, b) => fraction(a) - fraction(b))[0];
  if (me === 'yuna') {
    const dispel = has(actor(engine, PENANCE), 'regen') ? row(d, 'ability', 'dispel', PENANCE) : null;
    if (dispel) return dispel;
    const cure = hurt ? (row(d, 'ability', 'curaga', hurt.id) ?? row(d, 'ability', 'cura', hurt.id)) : null;
    if (cure) return cure;
    const first = shell[0];
    const ward = first ? row(d, 'ability', 'shell', first.id) : null;
    if (ward) return ward;
  } else if (hurt && fraction(hurt) < 0.4) {
    for (const item of ['elixir', 'mega-potion', 'x-potion'] as const) {
      const it = row(d, 'item', item, hurt.id);
      if (it) return it;
    }
  }
  const goal = offenseTarget(engine, policy);
  const quick = me === 'tidus' ? row(d, 'ability', 'quick-hit', goal) : null;
  return quick ?? row(d, 'attack', undefined, goal) ?? row(d, 'attack', undefined, PENANCE) ?? defend();
}

/** Play one battle with the line and no god mode. */
export function playPenance(seed: number, policy: PenancePolicy, party: FFXPartyBuild = penanceBuild, maxDecisions = 4_000): PenanceRun {
  const engine = newEngine(seed, party);
  const opening = engine.state().activeIds.slice();
  let decisions = 0;
  let outcome: PenanceRun['outcome'] = 'stalled';
  for (let i = 0; i < 80_000 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : d.result.outcome === 'defeat' ? 'defeat' : 'escape';
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    const before = log(engine).length;
    engine.submit(choose(engine, d, policy));
    if (log(engine).length === before) engine.submit(defend()); // a refused command leaves the turn open: always move on
  }
  const events = log(engine) as readonly BattleEvent[];
  const downBy: Record<string, number> = {};
  let last = '';
  let judgmentDays = 0;
  let armDeaths = 0;
  let shattered = 0;
  for (const e of events) {
    if (e.type === 'action-start') {
      last = e.abilityId ?? e.command.kind;
      if (e.actorId === PENANCE && e.abilityId === 'penance-judgment-day') judgmentDays++;
    }
    if (e.type === 'ko' && opening.includes(e.targetId)) downBy[last] = (downBy[last] ?? 0) + 1;
    if (e.type === 'part-destroyed' && (ARMS as readonly string[]).includes(e.partId)) armDeaths++;
    if (e.type === 'status-add' && e.status === 'eject' && opening.includes(e.targetId)) shattered++;
  }
  return {
    line: policy.name,
    seed,
    outcome,
    decisions,
    ticks: engine.state().ticks,
    hp: actor(engine, PENANCE).hp,
    changed: flags(engine)['pen.phase'] === 1,
    judgmentDays,
    armDeaths,
    downBy,
    shattered,
  };
}

// ---------------------------------------------------------------------------
// The party levers (the plan's section 9): the guides' own variants of the one preset
// ---------------------------------------------------------------------------

/** A copy of the shipped party with every member's armour abilities replaced. */
export function withArmor(abilities: readonly string[], base: FFXPartyBuild = penanceBuild): FFXPartyBuild {
  return {
    ...base,
    members: base.members.map((m): FFXMemberBuild => ({ ...structuredClone(m), equipment: { ...structuredClone(m.equipment), armor: { ...m.equipment.armor, autoAbilities: [...abilities] as never } } })),
  };
}

/** GamerGuides' four: Ribbon, Auto-Haste, Auto-Protect, Auto-Potion (Ribbon stands for Petrify, Doom, Sleep, Silence, Darkness, Slow, Poison and the rest it covers). */
export const RIBBON_ARMOR = ['auto-haste', 'auto-protect', 'auto-potion', 'ribbon'] as const;

/** The Break HP Limit variant (eip.gg, the GameFAQs boards): HP 99,999 in place of the Defense +20 percent slot. */
export function breakHpLimitBuild(base: FFXPartyBuild = penanceBuild): FFXPartyBuild {
  const b = withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'break-hp-limit'], base);
  for (const m of b.members) {
    m.stats = { ...m.stats, hp: 99_999, maxHp: 99_999 };
    m.hp = 99_999;
  }
  return b;
}
