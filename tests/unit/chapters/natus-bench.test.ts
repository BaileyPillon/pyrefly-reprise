/**
 * **Seymour Natus — the seeded bench.** Win rates across 200 seeds for sourced
 * lines and for a credibly wrong one, on the real engine, the real data and
 * the Highbridge build (`src/data/ffx/builds/highbridge.ts`).
 *
 * **Measure, never tune** (`docs/plans/chapter-natus-review.md` §9, the
 * `boss-side-fix-needs-measured-options` rule): this file prints the numbers
 * and pins only that every battle ends; it pins no target rate. If a line is
 * unwinnable, the answer is measured options for Bailey, never a weaker boss.
 *
 * What every number rests on, said out loud:
 * - **The party is `[estimate]`** by construction: the midpoint of the Evrae
 *   and Gagazet presets, Yuna from the lower half of the Gagazet row
 *   (highbridge.ts rules 1-4).
 * - **B2-B5 as Bailey picked them:** Tidus / Yuna / Kimahri open, Bahamut
 *   full and the other aeons partial, no Reflect on Yuna, Chapter VIII's bag.
 * - **The element order and Natus-moves-first are our reading** (N-1, N-2).
 *
 * The lines (research §6.3):
 * - **intended** — the guide's brute-force line with the aeon burst: Talk for
 *   Tidus, Yuna and Auron (strategy 4, +10 Strength nearly triples a hit into
 *   Defense 0); Yuna Shells the three (strategy 4); Kimahri hands his turn to
 *   Auron; Yuna summons Bahamut once for his full-gauge Mega Flare (strategy
 *   3), then heals; a petrified member gets a Soft at once (strategy 4); Tidus
 *   and Auron hit Natus; nobody Hastes.
 * - **poison-wait** — strategy 1: Kimahri hands his turn to Lulu, Lulu casts
 *   Bio until it lands, Yuna Shells the three, then the party only keeps
 *   itself alive and never hits Natus, so phase 1 lasts the whole fight.
 * - **provoke-reflect** — strategy 2: Kimahri hands his turn to Rikku and Yuna
 *   hers to Auron; Tidus Provokes Natus, Rikku keeps Reflect on Tidus, Tidus
 *   and Auron (after Talk) hit Natus, items for upkeep (a Cura would bounce),
 *   while Natus's single-target spells bounce off the provoker. No aeons.
 * - **drain-farm** — strategy 6: Talk as in the intended line, then Tidus and
 *   Auron (Kimahri's swap) kill Mortibody over and over, so each Mortibsorption
 *   drains Natus for 4,000 / 3,000 / 2,000 / 1,000; Yuna Shells and heals.
 * - **credibly wrong** — Tidus Hastes all three (the habit the fight
 *   punishes: Desperado), then all three swing at Natus; no Talk, no aeon,
 *   the same upkeep as the others.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import type { FFXPartyBuild } from '../../../src/battle/common/types.ts';

const SEEDS = 200;

/**
 * **A measured option, not the shipped party.** The same Highbridge kit (lists,
 * gear, bag, aeons, line-up) with every member's Sphere Grid stats raised to
 * the research's **upper bound**, the Gagazet preset — the bound the Yojimbo
 * chapter ships at. Measured so Bailey can see what the preset choice costs;
 * nothing here changes the boss (the `boss-side-fix-needs-measured-options`
 * rule).
 */
const upperBound: FFXPartyBuild = {
  ...highbridgeBuild,
  members: highbridgeBuild.members.map((m) => {
    const top = gagazetBuild.members.find((g) => g.id === m.id)!;
    const hp = m.equipment.armor.autoAbilities.includes('hp-10') ? Math.floor((top.stats.hp * 110) / 100) : top.stats.hp;
    return { ...m, stats: { ...top.stats, maxHp: hp, maxMp: top.stats.mp }, hp, mp: top.stats.mp };
  }),
};
type Party = 'preset' | 'upper';
const NATUS = 'seymour-natus';
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Line = 'intended' | 'poison-wait' | 'provoke-reflect' | 'drain-farm' | 'wrong';
const LINES: readonly Line[] = ['intended', 'poison-wait', 'provoke-reflect', 'drain-farm', 'wrong'];
const MORT = 'mortibody';
interface Outcome { outcome: string; turns: number; phase: number; desperados: number; shatters: number; banishes: number; drains: number; bounced: number; poisoned: boolean; natusHp: number }

const defend: Command = { kind: 'defend', targets: [] };

function row(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

function party(engine: BattleEngine): FFXCombatant[] {
  const st = engine.state();
  return st.activeIds.map((id) => st.combatants[id] as FFXCombatant).filter((c) => !c.removed);
}

/** Shared by every line: Soft a petrified member, revive, then heal the lowest under 45 %. */
function upkeep(engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command | null {
  const members = party(engine);
  const stone = members.find((c) => c.statuses.petrify !== undefined);
  if (stone && row(commands, 'item', 'soft')?.validTargets.includes(stone.id)) return { kind: 'item', id: 'soft', targets: [stone.id] };
  const down = members.find((c) => c.hp <= 0 && c.statuses.petrify === undefined);
  if (down) {
    if (actorId === 'yuna' && row(commands, 'ability', 'life')?.validTargets.includes(down.id)) return { kind: 'ability', id: 'life', targets: [down.id] };
    if (row(commands, 'item', 'phoenix-down')?.validTargets.includes(down.id)) return { kind: 'item', id: 'phoenix-down', targets: [down.id] };
  }
  const low = members.filter((c) => c.hp > 0 && c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp);
  const target = low[0];
  if (!target) return null;
  if (actorId === 'yuna' && row(commands, 'ability', 'cura')?.validTargets.includes(target.id)) return { kind: 'ability', id: 'cura', targets: [target.id] };
  if (row(commands, 'item', 'hi-potion')?.validTargets.includes(target.id)) return { kind: 'item', id: 'hi-potion', targets: [target.id] };
  return null;
}

/** Strategy 4's Shell: Yuna puts it on the first active member without it. */
function shell(engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command | null {
  if (actorId !== 'yuna') return null;
  const bare = party(engine).find((c) => c.hp > 0 && c.statuses.shell === undefined && c.statuses.petrify === undefined);
  return bare && row(commands, 'ability', 'shell')?.validTargets.includes(bare.id) ? { kind: 'ability', id: 'shell', targets: [bare.id] } : null;
}

function talk(commands: readonly AvailableCommand[]): Command | null {
  const t = commands.find((c) => c.enabled && c.command.kind === 'trigger' && 'id' in c.command && c.command.id === 'talk');
  return t ? t.command : null;
}

function switchTo(commands: readonly AvailableCommand[], inId: string): Command | null {
  const s = commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === inId);
  return s ? s.command : null;
}

function hit(commands: readonly AvailableCommand[]): Command {
  return row(commands, 'attack')?.validTargets.includes(NATUS) ? { kind: 'attack', targets: [NATUS] } : defend;
}

/** The aeons in the order the relay sends them: Bahamut's full gauge first (B3), then the rest. */
const RELAY = ['bahamut', 'valefor', 'ifrit', 'ixion', 'shiva'];

/** Yuna's next summon, if any aeon is left to send (an aeon Banished or KO'd is spent). */
function nextSummon(engine: BattleEngine, commands: readonly AvailableCommand[]): Command | null {
  const sent = new Set(engine.state().log.filter((e) => e.type === 'summon').map((e) => (e as { aeonId: string }).aeonId));
  for (const id of RELAY) if (!sent.has(id) && row(commands, 'summon', id)) return { kind: 'summon', id, targets: [] };
  return null;
}

function choose(line: Line, engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command {
  const st = engine.state();
  const natus = st.combatants[NATUS] as FFXCombatant;

  if (line === 'provoke-reflect') return provokeReflect(engine, actorId, commands, natus);
  if (st.aeonId === actorId) {
    if (line === 'poison-wait') {
      // Stall without touching Natus: the phase must not move.
      const guard = row(commands, 'ability', 'shield');
      return guard ? guard.command : defend;
    }
    const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive');
    if (od && line === 'intended') return { ...od.command, targets: od.validTargets.includes(NATUS) ? [NATUS] : [] } as Command;
    return hit(commands);
  }

  if (line === 'wrong') {
    const care = upkeep(engine, actorId, commands);
    if (care) return care;
    if (actorId === 'tidus') {
      const unhasted = party(engine).find((c) => c.hp > 0 && c.statuses.haste === undefined);
      if (unhasted && row(commands, 'ability', 'haste')?.validTargets.includes(unhasted.id)) return { kind: 'ability', id: 'haste', targets: [unhasted.id] };
    }
    return hit(commands);
  }

  // Both sourced lines: Yuna opens the relay (strategy 3); the aeons hold the
  // field while the party sets up behind them.
  if (actorId === 'yuna') {
    const summon = nextSummon(engine, commands);
    if (summon) return summon;
  }
  const care = upkeep(engine, actorId, commands);
  if (care) return care;

  if (line === 'poison-wait') {
    if (actorId === 'kimahri') return switchTo(commands, 'lulu') ?? defend;
    if (actorId === 'lulu' && natus.statuses.poison === undefined && row(commands, 'ability', 'bio')?.validTargets.includes(NATUS)) {
      return { kind: 'ability', id: 'bio', targets: [NATUS] };
    }
    const sh = shell(engine, actorId, commands);
    if (sh) return sh;
    return talk(commands) ?? defend;
  }

  // intended and drain-farm
  const t = talk(commands);
  if (t) return t;
  if (actorId === 'kimahri') return switchTo(commands, 'auron') ?? hit(commands);
  if (actorId === 'yuna') {
    const sh = shell(engine, actorId, commands);
    if (sh) return sh;
    const hurt = party(engine).filter((c) => c.hp > 0 && c.hp < c.stats.maxHp * 0.7).sort((a, b) => a.hp - b.hp)[0];
    if (hurt && row(commands, 'ability', 'cura')?.validTargets.includes(hurt.id)) return { kind: 'ability', id: 'cura', targets: [hurt.id] };
    return defend;
  }
  if (line === 'drain-farm') {
    return row(commands, 'attack')?.validTargets.includes(MORT) ? { kind: 'attack', targets: [MORT] } : hit(commands);
  }
  return hit(commands);
}

/**
 * Strategy 2 [research §6.3 #2, single source: GameFAQs]: Provoke on Natus,
 * Reflect on the provoker, and the damage dealers keep hitting. Kimahri hands
 * his turn to Rikku (the Reflect caster, B4), Yuna hers to Auron (Talk, then
 * swing); Tidus Provokes, then swings too. Items only for upkeep: a Cura on the
 * Reflected provoker would bounce.
 */
function provokeReflect(engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[], natus: FFXCombatant): Command {
  if (actorId === 'kimahri') return switchTo(commands, 'rikku') ?? defend;
  if (actorId === 'yuna') return switchTo(commands, 'auron') ?? defend;
  const tidus = engine.state().combatants['tidus'] as FFXCombatant;
  const stone = party(engine).find((c) => c.statuses.petrify !== undefined);
  if (stone && row(commands, 'item', 'soft')?.validTargets.includes(stone.id)) return { kind: 'item', id: 'soft', targets: [stone.id] };
  const down = party(engine).find((c) => c.hp <= 0 && c.statuses.petrify === undefined);
  if (down && row(commands, 'item', 'phoenix-down')?.validTargets.includes(down.id)) return { kind: 'item', id: 'phoenix-down', targets: [down.id] };
  if (actorId === 'tidus' && natus.statuses.provoke === undefined && row(commands, 'ability', 'provoke')?.validTargets.includes(NATUS)) {
    return { kind: 'ability', id: 'provoke', targets: [NATUS] };
  }
  if (actorId === 'rikku' && tidus.hp > 0 && tidus.statuses.reflect === undefined && row(commands, 'ability', 'reflect')?.validTargets.includes('tidus')) {
    return { kind: 'ability', id: 'reflect', targets: ['tidus'] };
  }
  const low = party(engine).filter((c) => c.hp > 0 && c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (low && row(commands, 'item', 'hi-potion')?.validTargets.includes(low.id)) return { kind: 'item', id: 'hi-potion', targets: [low.id] };
  if (actorId === 'auron') return talk(commands) ?? hit(commands);
  return actorId === 'rikku' ? defend : hit(commands);
}

function play(line: Line, seed: number, which: Party = 'preset'): Outcome {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: which === 'upper' ? upperBound : highbridgeBuild, enemies: ENEMY_GROUPS_BY_ID['seymour-natus']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  for (let i = 0; i < 8000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit(choose(line, engine, d.actorId, d.commands));
  }
  const st = engine.state();
  const log = st.log;
  const phase = st.flags['natus.phase'];
  return {
    outcome: st.result?.outcome ?? 'unfinished',
    turns: st.turn,
    phase: typeof phase === 'number' ? phase : 1,
    desperados: log.filter((e) => e.type === 'action-start' && e.abilityId === 'mortibody-desperado').length,
    shatters: log.filter((e) => e.type === 'message' && e.text.endsWith(' shatters')).length,
    banishes: log.filter((e) => e.type === 'action-start' && e.abilityId === 'banish').length,
    drains: log.filter((e) => e.type === 'message' && e.text === 'Mortibody uses Mortibsorption').length,
    bounced: log.filter((e) => e.type === 'damage' && e.sourceId === NATUS && e.targetId === NATUS).length,
    poisoned: log.some((e) => e.type === 'status-add' && e.targetId === NATUS && e.status === 'poison'),
    natusHp: (st.combatants[NATUS] as FFXCombatant).hp,
  };
}

interface Bench {
  wins: number;
  outcomes: Record<string, number>;
  meanTurns: number;
  phase3: number;
  desperadoRate: number;
  shatterRate: number;
  banishes: number;
  drains: number;
  poisoned: number;
  /** Natus's own spells that landed on him (bounced off a Reflected member), summed over the seeds. */
  reflectedOntoNatus: number;
  meanNatusHp: number;
}

function bench(line: Line, which: Party = 'preset'): Bench {
  const outcomes: Record<string, number> = {};
  let wins = 0, turns = 0, phase3 = 0, desperados = 0, shatters = 0, banishes = 0, drains = 0, bounced = 0, poisoned = 0, natusHp = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = play(line, seed, which);
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
    if (r.outcome === 'victory') wins++;
    turns += r.turns;
    if (r.phase === 3) phase3++;
    desperados += r.desperados;
    shatters += r.shatters;
    banishes += r.banishes;
    drains += r.drains;
    bounced += r.bounced;
    if (r.poisoned) poisoned++;
    natusHp += r.natusHp;
  }
  return {
    wins, outcomes, meanTurns: turns / SEEDS, phase3, desperadoRate: desperados / SEEDS, shatterRate: shatters / SEEDS,
    banishes, drains, poisoned, reflectedOntoNatus: bounced, meanNatusHp: natusHp / SEEDS,
  };
}

describe(`Seymour Natus — win rates across ${SEEDS} seeds (measured, not tuned)`, () => {
  let results: Record<Line, Bench>;
  let upper: Record<Line, Bench>;
  beforeAll(() => {
    results = Object.fromEntries(LINES.map((l) => [l, bench(l)])) as Record<Line, Bench>;
    upper = Object.fromEntries(LINES.map((l) => [l, bench(l, 'upper')])) as Record<Line, Bench>;
    // The report the chapter's review and Bailey read. Printed on every run.
    const rows: [string, Bench][] = [
      ...Object.entries(results).map(([k, v]) => [`preset ${k}`, v] as [string, Bench]),
      ...Object.entries(upper).map(([k, v]) => [`upper  ${k}`, v] as [string, Bench]),
    ];
    for (const [line, r] of rows) {
      console.log(
        `[natus bench] ${line.padEnd(18)} wins ${r.wins}/${SEEDS} (${((100 * r.wins) / SEEDS).toFixed(1)} %)` +
          ` outcomes ${JSON.stringify(r.outcomes)} mean turns ${r.meanTurns.toFixed(1)}` +
          ` reached phase 3 ${r.phase3} Desperados/battle ${r.desperadoRate.toFixed(2)}` +
          ` shatters/battle ${r.shatterRate.toFixed(2)} Banishes ${r.banishes} drains ${r.drains}` +
          ` bounced onto Natus ${r.reflectedOntoNatus} Natus poisoned ${r.poisoned} Natus HP left (mean) ${Math.round(r.meanNatusHp)}`,
      );
    }
  }, 300_000);

  it('every battle ends (no runaway loop)', () => {
    for (const r of [...Object.values(results), ...Object.values(upper)]) expect(r.outcomes['unfinished'] ?? 0).toBe(0);
  });

  it('the wrong line is the one that calls Desperado; Poison-and-wait never leaves phase 1 by its own hand', () => {
    expect(results.wrong.desperadoRate).toBeGreaterThan(0);
    expect(results.intended.desperadoRate).toBe(0);
    expect(results['poison-wait'].desperadoRate).toBe(0);
    expect(results['poison-wait'].phase3).toBe(0);
  });

  it('the intended line beats the credibly wrong one, on the shipped preset and at the upper bound', () => {
    expect(results.intended.wins).toBeGreaterThan(results.wrong.wins);
    expect(upper.intended.wins).toBeGreaterThan(upper.wrong.wins);
  });

  it('the two added sourced lines do what they say: Provoke + Reflect bounces his spells onto him, the farm drains him', () => {
    expect(results['provoke-reflect'].reflectedOntoNatus).toBeGreaterThan(0);
    expect(results['drain-farm'].drains).toBeGreaterThan(0);
    expect(results['provoke-reflect'].desperadoRate).toBe(0);
  });

  it('the intended line summons Bahamut and Natus Banishes him after his one turn', () => {
    expect(results.intended.banishes).toBeGreaterThan(0);
  });
});
