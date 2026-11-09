/**
 * A scripted player for the hidden Wendigo chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the preflight's section 9; the Sanctuary
 * Keeper's bench method, `docs/handoff/ch-sanctuary-keeper.md` section 6). Test-only. It reads what a player reads (the menu's rows, the statuses on the icons, the HP bars, the "Steal succeeded" message) and never the
 * script's flags or the cycle.
 *
 * A **line** is a few switches on a common skeleton. The skeleton's priorities are fixed: stand a fallen member up (Phoenix Down), cure what stops a person acting (Esuna), heal the hurt (Cure, or an item when Yuna
 * cannot), and what is left goes into the line's own plan. The lines:
 *
 * - **careless**: Attack with everyone (the front line's own Attack on Wendigo); heal nobody, cure nothing (what a player does who has not read the guides).
 * - **plain**: the skeleton and Attack, no plan.
 * - **advisor**: the guides' play with the Macalania preset's tools: Rikku steals from both Guardians first (their potions, Eye Drops and drops end), Tidus makes way for Wakka, whose Dark Attack blinds Wendigo (Berserk,
 *   which the Guardians put on it themselves, and Darkness together leave it almost harmless: a Berserk Wendigo throws only the plain Attack, and Darkness takes its accuracy down), Yuna puts Protect on each member, then the
 *   Guardians are killed and Wendigo is worn down with the strongest hitters; an aeon is summoned when the arms are up.
 * - **ablations**: the advisor with one piece removed, to see which pieces move the result.
 *
 * The line-up is a parameter (the preflight's CW3: Tidus, Yuna, Rikku, or Tidus, Auron, Rikku).
 */

import type { BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { wendigoBuild } from '../../../src/data/ffx/builds/wendigo.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, actor, defend, flags, has, newEngine, row, wendigo, type Input } from './wendigoDrive.ts';

export interface Line {
  readonly name: string;
  /** Attack Wendigo and do nothing else. */
  readonly careless?: boolean;
  /** The skeleton's care: raise the fallen, cure, heal. */
  readonly care: boolean;
  /** Rikku throws a Petrify Grenade (it reaches both Guardians) first thing: they cast no Berserk, no Eye Drops, no potions and no last shields. */
  readonly petrify: boolean;
  /** Rikku steals from each Guardian that is still up (the fallback when the grenade is spent or missed). */
  readonly steal: boolean;
  /** Auron comes in and breaks Wendigo's Power (halves every blow it throws). */
  readonly powerBreak: boolean;
  /** Wakka comes in and blinds Wendigo (a rolled punch then misses about nine times in ten; the Double Punch and the Counter Punch ignore it). */
  readonly blind: boolean;
  /** Yuna puts Protect on each member. */
  readonly protect: boolean;
  /** Nobody swings physically while Wendigo's arms are up (a physical hit is answered by the Counter Punch) unless an aeon is out. */
  readonly stance: boolean;
  /** Kill the Guardians that are still up before Wendigo. */
  readonly killGuardians: boolean;
  /** Yuna summons an aeon while the arms are up (it silences the counter). */
  readonly aeon: boolean;
}

const FULL: Line = { name: 'advisor', care: true, petrify: true, steal: true, powerBreak: true, blind: true, protect: true, stance: true, killGuardians: true, aeon: false };

export const LINES: Readonly<Record<string, Line>> = {
  careless: { name: 'careless', careless: true, care: false, petrify: false, steal: false, powerBreak: false, blind: false, protect: false, stance: false, killGuardians: false, aeon: false },
  plain: { name: 'plain', care: true, petrify: false, steal: false, powerBreak: false, blind: false, protect: false, stance: false, killGuardians: false, aeon: false },
  advisor: FULL,
  'no-petrify': { ...FULL, name: 'no-petrify', petrify: false },
  'no-steal': { ...FULL, name: 'no-steal', petrify: false, steal: false },
  'no-power-break': { ...FULL, name: 'no-power-break', powerBreak: false },
  'no-blind': { ...FULL, name: 'no-blind', blind: false },
  'no-protect': { ...FULL, name: 'no-protect', protect: false },
  'front-line-only': { ...FULL, name: 'front-line-only', powerBreak: false, blind: false },
  'no-stance': { ...FULL, name: 'no-stance', stance: false },
  aeon: { ...FULL, name: 'aeon', aeon: true },
};

/** A build with another front line (the bench is the other four of the seven, in the preset's order). */
export function buildWith(front: readonly [string, string, string]): FFXPartyBuild {
  const seven = ['tidus', 'yuna', 'rikku', 'wakka', 'auron', 'lulu', 'kimahri'];
  return { ...wendigoBuild, activeSlots: [...front], reserve: seven.filter((id) => !front.includes(id)) };
}

export type Outcome = 'victory' | 'defeat' | 'stalled';

export interface Run {
  readonly line: string;
  readonly seed: number;
  readonly outcome: Outcome;
  readonly decisions: number;
  readonly ticks: number;
  /** Wendigo's HP when the run ended. */
  readonly hp: number;
  /** The lowest HP Wendigo reached. */
  readonly lowestHp: number;
  /** Wendigo's actions by row (`punch`, `haymaker`, `attack`, `counter`, `raise`, `lower`), from the log. */
  readonly wendigoActs: Readonly<Record<string, number>>;
  /** The party's KOs (a member falling), counted from the log. */
  readonly koCount: number;
}

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;
const HEAL_ITEMS = ['x-potion', 'hi-potion', 'potion'] as const;

/** Has a Steal been tried on this Guardian? (A player remembers his own turn; the log is the same fact.) One try each: a miss is not repeated. */
function stolen(engine: BattleEngine, id: string): boolean {
  const log = engine.state().log as ReadonlyArray<{ type: string; abilityId?: string; targets?: readonly string[] }>;
  return log.some((e) => e.type === 'action-start' && e.abilityId === 'steal' && (e.targets ?? []).includes(id));
}

/** A member needs a heal when the next ordinary hit could be the last: under 55 percent of his maximum. */
function needsHeal(c: FFXCombatant): boolean {
  return alive(c) && c.hp < c.stats.maxHp * 0.55;
}

/** The switch row that brings `inId` onto the field for `outId`, if it is offered. */
function switchFor(d: Input, outId: string, inId: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command as { extra: { outId: string; inId: string } }).extra.outId === outId && (c.command as { extra: { outId: string; inId: string } }).extra.inId === inId);
  return r ? r.command : null;
}

/** Skeleton step: stand a fallen member up, cure what stops a person acting, heal the hurt. */
function care(engine: BattleEngine, d: Input): Command | null {
  const party = front(engine);
  const down = party.find((c) => !alive(c));
  if (down) return row(d, 'item', 'phoenix-down', down.id) ?? row(d, 'ability', 'life', down.id);
  const me = party.find((c) => c.id === d.actorId);
  const canCast = me !== undefined && !has(me, 'silence');
  for (const c of party) {
    if (alive(c) && (has(c, 'berserk') || has(c, 'confuse') || has(c, 'silence') || has(c, 'darkness'))) {
      const cure = (canCast && row(d, 'ability', 'esuna', c.id)) || row(d, 'item', 'remedy', c.id);
      if (cure) return cure;
    }
  }
  const hurt = party.filter(needsHeal).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = (canCast && (row(d, 'ability', 'cura', hurt.id) ?? row(d, 'ability', 'cure', hurt.id))) || HEAL_ITEMS.map((i) => row(d, 'item', i, hurt.id)).find((c) => c !== null) || null;
    if (heal) return heal;
  }
  return null;
}

/** The target of a plain swing: a living, unpetrified Guardian first when the line kills them (A, then B), else Wendigo. */
function strikeTarget(engine: BattleEngine, line: Line): string {
  if (line.killGuardians) {
    for (const id of [GUARDIAN_A, GUARDIAN_B]) {
      const g = actor(engine, id);
      if (alive(g) && !has(g, 'petrify')) return id;
    }
  }
  return WENDIGO;
}

/** The line's plan for this actor, or null to fall through to a swing. */
function plan(engine: BattleEngine, d: Input, line: Line): Command | null {
  const me = d.actorId;
  const w = wendigo(engine);
  const party = front(engine).filter(alive);
  const bench = engine.state().reserveIds.map((id) => actor(engine, id)).filter((c) => c.alive && c.hp > 0); // the bench is off the field (removed), not down
  const benchHas = (id: string): boolean => bench.some((c) => c.id === id);
  const inFront = (id: string): boolean => party.some((c) => c.id === id);
  const armsUp = flags(engine)['wendigo.arms'] === true;
  const aeonOut = Boolean(engine.state().aeonId);
  const guardians = [GUARDIAN_A, GUARDIAN_B].map((id) => actor(engine, id)).filter((g) => alive(g) && !has(g, 'petrify'));
  const canCast = !has(actor(engine, me), 'silence');
  const needBreak = line.powerBreak && !has(w, 'power-break') && (inFront('auron') || benchHas('auron'));
  const needBlind = line.blind && !has(w, 'darkness') && (inFront('wakka') || benchHas('wakka'));

  // 1. Rikku opens: one Petrify Grenade reaches both Guardians; the fallback is a Steal from each that is still up.
  if (me === 'rikku') {
    for (const g of guardians) {
      if (line.petrify) {
        const grenade = row(d, 'item', 'petrify-grenade', g.id);
        if (grenade) return grenade;
      }
      if (line.steal && !stolen(engine, g.id)) {
        const steal = row(d, 'ability', 'steal', g.id);
        if (steal) return steal;
      }
    }
  }
  // 2. The two fighters make way: Tidus for Auron (Power Break), Rikku, once her opening is done, for Wakka (Dark Attack). A switched-in member acts at once.
  if (needBreak && !inFront('auron') && me === 'tidus') {
    const sw = switchFor(d, me, 'auron');
    if (sw) return sw;
  }
  if (needBlind && !inFront('wakka') && (me === 'rikku' || (me === 'tidus' && !(needBreak && !inFront('auron'))))) {
    const spent = me !== 'rikku' || guardians.length === 0 || !(line.petrify || line.steal);
    if (spent) {
      const sw = switchFor(d, me, 'wakka');
      if (sw) return sw;
    }
  }
  if (me === 'auron' && needBreak) {
    const brk = row(d, 'ability', 'power-break', WENDIGO);
    if (brk && !(line.stance && armsUp && !aeonOut)) return brk;
  }
  if (me === 'wakka' && needBlind) {
    const dark = row(d, 'ability', 'dark-attack', WENDIGO);
    if (dark && !(line.stance && armsUp && !aeonOut)) return dark;
  }
  // 3. Yuna: an aeon while the arms are up (when the line does), then Protect on each member.
  if (me === 'yuna' && canCast) {
    if (line.aeon && armsUp && !aeonOut) {
      const summon = row(d, 'summon', 'ixion') ?? row(d, 'summon', 'ifrit');
      if (summon) return summon;
    }
    if (line.protect) {
      const open = party.find((c) => !has(c, 'protect'));
      if (open) {
        const cast = row(d, 'ability', 'protect', open.id);
        if (cast) return cast;
      }
    }
  }
  // 4. The stance: with the arms up and no aeon out, a physical hit is answered by the Counter Punch, so nobody swings; the others wait.
  if (line.stance && armsUp && !aeonOut && me !== 'yuna') return defend();
  return null;
}

/** One command for `d`, by the line. */
export function choose(engine: BattleEngine, d: Input, line: Line): Command {
  const target = line.careless ? WENDIGO : strikeTarget(engine, line);
  const strike = row(d, 'attack', undefined, target) ?? row(d, 'attack', undefined, WENDIGO) ?? defend();
  if (line.careless) return strike;
  const tended = line.care ? care(engine, d) : null;
  if (tended) return tended;
  return plan(engine, d, line) ?? strike;
}

/** The aeon in front is in the way of nothing: while one holds the field only it takes commands, and a dismiss ends it when the fight is calm. */
export function play(seed: number, line: Line, party: FFXPartyBuild = wendigoBuild, maxDecisions = 1500, chooser: (engine: BattleEngine, d: Input) => Command = (e, d) => choose(e, d, line)): Run {
  const engine = newEngine(seed, party);
  let decisions = 0;
  let lowest = wendigo(engine).hp;
  let outcome: Outcome = 'stalled';
  for (let i = 0; i < maxDecisions * 8 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    lowest = Math.min(lowest, wendigo(engine).hp);
    engine.submit(chooser(engine, d));
  }
  const state = engine.state();
  const events = state.log as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; targetId?: string; command?: { kind: string } }>;
  const acts: Record<string, number> = {};
  for (const e of events) {
    if (e.type !== 'action-start' || e.actorId !== WENDIGO) continue;
    const key = e.abilityId ?? e.command?.kind ?? '?';
    acts[key] = (acts[key] ?? 0) + 1;
  }
  const koCount = events.filter((e) => e.type === 'ko' && e.targetId !== undefined && !['wendigo', GUARDIAN_A, GUARDIAN_B].includes(e.targetId)).length;
  return { line: line.name, seed, outcome, decisions, ticks: state.ticks, hp: wendigo(engine).hp, lowestHp: lowest, wendigoActs: acts, koCount };
}

/** The share of `runs` that are victories, as a percentage with one decimal. */
export function winRate(runs: readonly Run[]): number {
  return runs.length === 0 ? 0 : Math.round((runs.filter((r) => r.outcome === 'victory').length / runs.length) * 1000) / 10;
}

/** `play` over seeds `first` to `first + seeds - 1`. */
export function bench(line: Line, seeds: number, party: FFXPartyBuild = wendigoBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(play(s, line, party));
  return runs;
}

/** The line the game ships (`src/engine/tactics/wendigo.ts`), played the way the card and the auto-battler play it: the registered tactic, and where it has no opinion the generic ladder, and a Defend if that has none either. */
export const TACTIC_LINE: Line = { ...FULL, name: 'tactic' };
export function playTactic(seed: number, party: FFXPartyBuild = wendigoBuild): Run {
  return play(seed, TACTIC_LINE, party, 1500, (engine, d) => (intendedStrategy(d.actorId, d.commands, engine) as Command | null) ?? defend());
}
/** `playTactic` over seeds `first` to `first + seeds - 1`. */
export function benchTactic(seeds: number, party: FFXPartyBuild = wendigoBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(playTactic(s, party));
  return runs;
}
