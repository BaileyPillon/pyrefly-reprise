/**
 * A scripted player for the hidden Spectral Keeper chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the ch-keeper review's major 2; the paper
 * preflight's T10: "a bench of scripted lines"). Test-only; it reads the same menus a player does (`Input.commands`) and the platform flags the engine publishes (`plat.*`).
 *
 * A policy is four switches: whether the bot heals, dodges (steps out of the sweep zone and off a lit glyph), fires Overdrives, and summons aeons. None of it is a claim about the best line; a policy that wins would be a
 * lower bound on "winnable" and a policy that loses proves nothing alone. `tests/unit/chapters/spectral-keeper-measure.test.ts` runs a fixed set and pins the measured line.
 */

import type { BattleEngine, BattleEvent, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { frontTrio } from '../../../src/battle/ffx/platforms.ts';
import { KEEPER, actor, circleId, defend, flags, log, newEngine, row, type Input } from './keeperDrive.ts';

export interface BotPolicy {
  readonly name: string;
  /** Never acts: everyone defends. */
  readonly idle?: boolean;
  /** Heal a front-liner under 45 percent (Yuna's Cure family, then a potion) and stand a KO'd one up (Phoenix Down). */
  readonly heal: boolean;
  /** Step out of the sweep zone (the platform in front and its two neighbours) and off a lit glyph, onto a free platform outside both. */
  readonly dodge: boolean;
  /** Fire an Overdrive at the Keeper whenever the menu offers one. */
  readonly overdrive: boolean;
  /** Yuna summons an aeon (the first one the menu offers, Bahamut first) whenever none is out; the aeon attacks, and fires its Overdrive when it can. */
  readonly aeons: boolean;
}

export const POLICIES: readonly BotPolicy[] = [
  { name: 'defend only', idle: true, heal: false, dodge: false, overdrive: false, aeons: false },
  { name: 'attack only', heal: false, dodge: false, overdrive: false, aeons: false },
  { name: 'attack, heal, overdrive', heal: true, dodge: false, overdrive: true, aeons: false },
  { name: 'dodge, heal, overdrive', heal: true, dodge: true, overdrive: true, aeons: false },
  { name: 'aeons, heal', heal: true, dodge: false, overdrive: true, aeons: true },
  { name: 'aeons, dodge, heal', heal: true, dodge: true, overdrive: true, aeons: true },
];

export interface BotRun {
  readonly policy: string;
  readonly seed: number;
  readonly outcome: 'victory' | 'defeat' | 'stalled';
  /** Damage dealt to the Keeper, of its 52,000. */
  readonly dealt: number;
  readonly decisions: number;
  /** The payout the engine reported (0 on a defeat). */
  readonly gil: number;
  readonly ap: number;
  /** The Keeper's own actions by kind (`keeper-attack-all` sweeps, tails, mines). */
  readonly keeperActs: Readonly<Record<string, number>>;
  /** Front-line members who went down, by what struck last (`sweep`, `tail`, `mine`, `other`). */
  readonly downBy: Readonly<Record<string, number>>;
}

/** The three on the field now (an aeon is never one of them: `aeonId` names it). */
const frontOf = (engine: BattleEngine): string[] => [...engine.state().activeIds];
const HEAL_ITEMS = ['x-potion', 'hi-potion', 'mega-potion', 'potion'] as const;

const platformOf = (engine: BattleEngine, id: string): number | undefined => {
  const v = flags(engine)[`plat.at.${id}`];
  return typeof v === 'number' ? v : undefined;
};
const armedPlatforms = (engine: BattleEngine): Set<number> => {
  const out = new Set<number>();
  for (let p = 1; p <= 7; p++) if (flags(engine)[`plat.armed.${circleId(p)}`] === true) out.add(p);
  return out;
};

/** One command for `d`, by the policy. */
export function choose(engine: BattleEngine, d: Input, policy: BotPolicy): Command {
  const front3 = frontOf(engine);
  const isFront = front3.includes(d.actorId);
  const standingFront = front3.map((id) => actor(engine, id));

  if (policy.idle) return defend();

  // An aeon at the controls: its Overdrive, else its Attack.
  if (!isFront) return row(d, 'overdrive', undefined, KEEPER) ?? row(d, 'attack', undefined, KEEPER) ?? defend();

  if (policy.heal) {
    const down = standingFront.find((c) => !c.alive);
    if (down) {
      const pd = row(d, 'item', 'phoenix-down', down.id);
      if (pd) return pd;
    }
    const hurt = standingFront.filter((c) => c.alive && c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (hurt) {
      const cure = row(d, 'ability', 'curaga', hurt.id) ?? row(d, 'ability', 'cura', hurt.id) ?? row(d, 'ability', 'cure', hurt.id);
      if (cure) return cure;
      for (const item of HEAL_ITEMS) {
        const it = row(d, 'item', item, hurt.id);
        if (it) return it;
      }
    }
  }

  if (policy.aeons && d.actorId === 'yuna') {
    if (engine.state().aeonId === null) {
      for (const aeon of ['bahamut', 'shiva', 'ixion', 'ifrit', 'valefor']) {
        const s = row(d, 'summon', aeon);
        if (s) return s;
      }
    }
  }

  if (policy.dodge) {
    const mine = platformOf(engine, d.actorId);
    const front = flags(engine)['plat.front'];
    const zone = new Set<number>(typeof front === 'number' ? frontTrio(front) : []);
    const armed = armedPlatforms(engine);
    if (mine !== undefined && (zone.has(mine) || armed.has(mine))) {
      const options = d.commands.filter((c) => c.enabled && c.command.kind === 'trigger' && 'id' in c.command && c.command.id === 'move').flatMap((c) => c.validTargets);
      const safe = options.filter((id) => {
        const p = Number(id.slice(id.lastIndexOf('-') + 1));
        return p <= 6 && !zone.has(p) && !armed.has(p);
      });
      const pick = safe[0] ?? options.filter((id) => !armed.has(Number(id.slice(id.lastIndexOf('-') + 1))))[0];
      if (pick) return row(d, 'trigger', 'move', pick) ?? defend();
    }
  }

  if (policy.overdrive) {
    const od = row(d, 'overdrive', undefined, KEEPER);
    if (od) return od;
  }
  return row(d, 'attack', undefined, KEEPER) ?? defend();
}

/** Play one battle with the policy and no god mode. */
export function playBot(seed: number, policy: BotPolicy, party: FFXPartyBuild = zanarkandBuild, maxDecisions = 500): BotRun {
  const engine = newEngine(seed, party);
  const opening = frontOf(engine);
  let decisions = 0;
  let outcome: BotRun['outcome'] = 'stalled';
  let gil = 0;
  let ap = 0;
  for (let i = 0; i < 20_000 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
      gil = d.result.gil;
      ap = d.result.ap;
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    const cmd = choose(engine, d, policy);
    const before = log(engine).length;
    engine.submit(cmd);
    // A refused command leaves the turn open (no event is written): fall back to defending so the loop always moves on.
    if (log(engine).length === before) engine.submit(defend());
  }
  const events = log(engine) as readonly BattleEvent[];
  const keeperActs: Record<string, number> = {};
  for (const e of events) if (e.type === 'action-start' && e.actorId === KEEPER) keeperActs[e.abilityId ?? e.command.kind] = (keeperActs[e.abilityId ?? e.command.kind] ?? 0) + 1;
  const downBy: Record<string, number> = {};
  let lastAbility = '';
  for (const e of events) {
    if (e.type === 'action-start') lastAbility = e.abilityId ?? e.command.kind;
    if (e.type === 'ko' && opening.includes(e.targetId)) {
      const kind = lastAbility === 'keeper-attack-all' ? 'sweep' : lastAbility === 'keeper-mine-blast' ? 'mine' : lastAbility === 'keeper-berserk-tail' ? 'tail' : 'other';
      downBy[kind] = (downBy[kind] ?? 0) + 1;
    }
  }
  const keeper = actor(engine, KEEPER);
  return { policy: policy.name, seed, outcome, dealt: keeper.stats.maxHp - keeper.hp, decisions, gil, ap, keeperActs, downBy };
}

/** The build with every member's HP (current and maximum) multiplied by `k`: a what-if for the options table, never a shipped build (rule 6). */
export function partyWithHp(k: number): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    members: zanarkandBuild.members.map((m) => ({ ...m, hp: Math.round(m.hp * k), stats: { ...m.stats, hp: Math.round(m.stats.hp * k), maxHp: Math.round(m.stats.maxHp * k) } })),
  };
}
