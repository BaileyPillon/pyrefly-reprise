/**
 * **Yojimbo — the seeded bench.** Win rates across 200 seeds for the intended
 * line and for a credibly wrong one, on the real engine, the real data and the
 * Cavern build (`src/data/ffx/builds/yojimbo-cavern.ts`).
 *
 * **Measure, never tune** (`docs/plans/chapter-yojimbo-review.md` §9, the
 * `boss-side-fix-needs-measured-options` rule): this file prints the numbers
 * and pins only their order — the intended line beats the wrong one — never a
 * target rate. If a line turns out unwinnable, the answer is measured options
 * for Bailey, not a weaker boss.
 *
 * Two things every number here rests on, both said out loud:
 * - **The party is the research's upper bound** (the Gagazet preset minus what
 *   Gagazet teaches, §5.2), so these rates are, if anything, generous.
 * - **The odds inside each gauge band are our estimate** (B2: an even split),
 *   so the rates move when Bailey's pick or a source replaces it.
 *
 * The lines (research §5.3, the four sourced strategies):
 * - **intended** — Kimahri opens with Doom (strategy 1); Lulu casts Fira every
 *   turn (strategy 4: Magic Defense 0 against Defense 80); Yuna keeps the party
 *   up and summons an aeon in front of Zanmato once the gauge reads 80 or more
 *   (strategy 3); nobody else feeds the gauge.
 * - **magic race** — the same, without Doom: strategies 2, 3 and 4 only.
 * - **credibly wrong** — every member swings the physical Attack at him every
 *   turn, Yuna heals when someone is low, no Doom, no aeon: the habit every
 *   earlier chapter rewards, and the one this fight punishes (many small hits
 *   fill the gauge; Defense 80 halves them).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';

const SEEDS = 200;
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Line = 'intended' | 'magic-race' | 'wrong';
interface Outcome { outcome: string; turns: number; zanmatos: number; doomKill: boolean }

const defend: Command = { kind: 'defend', targets: [] };

function row(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

/** Yuna's upkeep, shared by every line: revive, then heal the lowest under 45 %. */
function upkeep(engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command | null {
  const st = engine.state();
  const party = st.activeIds.map((id) => st.combatants[id] as FFXCombatant);
  const down = party.find((c) => c.hp <= 0);
  if (down) {
    if (actorId === 'yuna' && row(commands, 'ability', 'life')?.validTargets.includes(down.id)) return { kind: 'ability', id: 'life', targets: [down.id] };
    if (row(commands, 'item', 'phoenix-down')?.validTargets.includes(down.id)) return { kind: 'item', id: 'phoenix-down', targets: [down.id] };
  }
  if (actorId !== 'yuna') return null;
  const low = party.filter((c) => c.hp > 0 && c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp);
  if (low.length >= 2 && row(commands, 'ability', 'curaga')) return { kind: 'ability', id: 'curaga', targets: [low[0]!.id] };
  if (low.length >= 1 && row(commands, 'ability', 'cura')) return { kind: 'ability', id: 'cura', targets: [low[0]!.id] };
  return null;
}

function choose(line: Line, engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command {
  const st = engine.state();
  const y = st.combatants['yojimbo'] as FFXCombatant;
  const gauge = y.overdrive?.gauge ?? 0;

  // An aeon on the field is there to stand in front of Zanmato.
  if (st.aeonId === actorId) return line === 'wrong' ? { kind: 'attack', targets: ['yojimbo'] } : defend;

  const care = upkeep(engine, actorId, commands);
  if (care) return care;

  if (line === 'wrong') {
    return row(commands, 'attack')?.validTargets.includes('yojimbo') ? { kind: 'attack', targets: ['yojimbo'] } : defend;
  }

  if (actorId === 'kimahri' && line === 'intended' && y.statuses['doom'] === undefined && row(commands, 'overdrive', 'doom')) {
    return { kind: 'overdrive', id: 'doom', targets: ['yojimbo'] };
  }
  if (actorId === 'lulu' && row(commands, 'ability', 'fira')) return { kind: 'ability', id: 'fira', targets: ['yojimbo'] };
  if (actorId === 'yuna' && gauge >= 80) {
    for (const aeon of ['bahamut', 'ifrit', 'ixion', 'shiva', 'valefor']) {
      if (row(commands, 'summon', aeon)) return { kind: 'summon', id: aeon, targets: [] };
    }
  }
  return defend;
}

function play(line: Line, seed: number): Outcome {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: yojimboCavernBuild, enemies: ENEMY_GROUPS_BY_ID['yojimbo-cavern']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  for (let i = 0; i < 6000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit(choose(line, engine, d.actorId, d.commands));
  }
  const st = engine.state();
  const log = st.log;
  return {
    outcome: st.result?.outcome ?? 'unfinished',
    turns: st.turn,
    zanmatos: log.filter((e) => e.type === 'action-start' && e.abilityId === 'yojimbo-zanmato').length,
    doomKill: log.some((e) => e.type === 'status-remove' && e.targetId === 'yojimbo' && e.status === 'doom'),
  };
}

function bench(line: Line): { wins: number; outcomes: Record<string, number>; meanTurns: number; zanmatoRate: number; doomKills: number } {
  const outcomes: Record<string, number> = {};
  let wins = 0, turns = 0, zanmatos = 0, doomKills = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = play(line, seed);
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
    if (r.outcome === 'victory') wins++;
    turns += r.turns;
    zanmatos += r.zanmatos;
    if (r.doomKill) doomKills++;
  }
  return { wins, outcomes, meanTurns: turns / SEEDS, zanmatoRate: zanmatos / SEEDS, doomKills };
}

describe(`Yojimbo — win rates across ${SEEDS} seeds (measured, not tuned)`, () => {
  type Bench = ReturnType<typeof bench>;
  let results: Record<Line, Bench>;
  beforeAll(() => {
    results = { intended: bench('intended'), 'magic-race': bench('magic-race'), wrong: bench('wrong') };
    // The report the chapter's review and Bailey read. Printed on every run.
    for (const [line, r] of Object.entries(results)) {
      console.log(
        `[yojimbo bench] ${line.padEnd(10)} wins ${r.wins}/${SEEDS} (${((100 * r.wins) / SEEDS).toFixed(1)} %)` +
          ` outcomes ${JSON.stringify(r.outcomes)} mean turns ${r.meanTurns.toFixed(1)}` +
          ` Zanmatos/battle ${r.zanmatoRate.toFixed(2)} Doom kills ${r.doomKills}`,
      );
    }
  }, 180_000);

  it('every battle ends (no stalemate, no runaway loop)', () => {
    for (const r of Object.values(results)) expect(r.outcomes['unfinished'] ?? 0).toBe(0);
  });

  it('the intended line beats the credibly wrong one', () => {
    expect(results.intended.wins).toBeGreaterThan(results.wrong.wins);
  });

  it('Doom is how the intended line wins, and the wrong line eats Zanmato', () => {
    expect(results.intended.doomKills).toBeGreaterThan(0);
    expect(results.wrong.zanmatoRate).toBeGreaterThan(results.intended.zanmatoRate);
  });
});
