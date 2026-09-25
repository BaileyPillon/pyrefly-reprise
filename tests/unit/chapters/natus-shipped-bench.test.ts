/**
 * Chapter X — the **shipped tactic's** bench: the registered line
 * (`src/engine/tactics/seymour-natus.ts`, found the way the game finds it, through
 * `intendedStrategy` and `tacticFor`) on the registered chapter record (`SEYMOUR_NATUS`: its build
 * and its formation), 200 seeds, beside one credibly wrong line (Haste all three, then swing).
 * **FFX only** [AGENTS.md rule 14]. **Measure, never tune** (`docs/plans/chapter-natus-review.md`
 * §9, the `boss-side-fix-needs-measured-options` rule): the table goes to
 * `docs/plans/natus-bench.md`; nothing here pins a target rate or touches the boss.
 *
 * The wrong line is the research's strategy 7 turned around [§4.3, verified: 3 sources]: Tidus
 * Hastes every active member he can, then everyone swings at Natus; upkeep (Soft, revive, heal)
 * and the aeon's turn are the shipped tactic's, so the only difference is the Haste habit.
 * Beside them, for Bailey only, the research's own strategy 7 (Haste only two: Tidus and Auron).
 *
 * **Measured 2026-09-25, not acted on:** on top of the shipped line, Hasting all three wins
 * *more* seeds than the shipped line itself (153 against 116 of 200), though it calls
 * Desperado about twice a battle. The research's thesis "Haste on all three is punished" holds
 * only against a line with no Talk, aeon or Shell (`natus-bench.test.ts`'s wrong line, 0 of
 * 200). The cause is not claimed (rule 3) and the boss is not touched; it is reported in
 * `docs/plans/natus-bench.md` for Bailey. This file pins only what is true either way.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { SEYMOUR_NATUS } from '../../../src/data/chapter-seymour-natus.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { seymourNatus, tacticFor } from '../../../src/engine/tactics/index.ts';

const SEEDS = 200;
const NATUS = 'seymour-natus';
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Pick = (actorId: string, commands: AvailableCommand[], engine: BattleEngine) => Command;
const defend: Command = { kind: 'defend', targets: [] };

/** The shipped line, as the presenter's auto-battle and the advisor reach it. */
const shipped: Pick = (a, c, e) => intendedStrategy(a, c, e) ?? defend;

/** Strategy 7 turned around: Tidus Hastes every active member first, then the shipped line swings. */
const hasteAll: Pick = (a, c, e) => {
  const cmd = shipped(a, c, e);
  if (a !== 'tidus' || cmd.kind !== 'attack') return cmd;
  const st = e.state();
  const bare = st.activeIds
    .map((id) => st.combatants[id] as FFXCombatant)
    .find((m) => !m.removed && m.hp > 0 && m.statuses.haste === undefined);
  const row = c.find((r) => r.enabled && r.command.kind === 'ability' && 'id' in r.command && r.command.id === 'haste');
  return bare && row?.validTargets.includes(bare.id) ? { kind: 'ability', id: 'haste', targets: [bare.id] } : cmd;
};

/** Strategy 7 as the research gives it [§6.3 #7]: Tidus Hastes only Tidus and Auron, never a third. */
const hasteTwo: Pick = (a, c, e) => {
  const cmd = shipped(a, c, e);
  if (a !== 'tidus' || cmd.kind !== 'attack') return cmd;
  const st = e.state();
  const active = st.activeIds.map((id) => st.combatants[id] as FFXCombatant).filter((m) => !m.removed);
  if (active.filter((m) => m.statuses.haste !== undefined).length >= 2) return cmd;
  const bare = active.find((m) => (m.id === 'tidus' || m.id === 'auron') && m.hp > 0 && m.statuses.haste === undefined);
  const row = c.find((r) => r.enabled && r.command.kind === 'ability' && 'id' in r.command && r.command.id === 'haste');
  return bare && row?.validTargets.includes(bare.id) ? { kind: 'ability', id: 'haste', targets: [bare.id] } : cmd;
};

interface Tally { wins: number; unfinished: number; turns: number; phase3: number; desperados: number; shatters: number; banishes: number; natusHp: number }

function play(pick: Pick, seed: number, t: Tally, onEngine?: (e: BattleEngine) => void): void {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: SEYMOUR_NATUS.buildRef as FFXPartyBuild, enemies: SEYMOUR_NATUS.enemyGroupRef,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  onEngine?.(engine);
  for (let i = 0; i < 8000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit(pick(d.actorId, d.commands, engine));
  }
  const st = engine.state();
  const outcome = st.result?.outcome;
  if (outcome === 'victory') t.wins += 1;
  if (outcome === undefined) t.unfinished += 1;
  t.turns += st.turn;
  if (st.flags['natus.phase'] === 3) t.phase3 += 1;
  t.desperados += st.log.filter((e) => e.type === 'action-start' && e.abilityId === 'mortibody-desperado').length;
  t.shatters += st.log.filter((e) => e.type === 'message' && e.text.endsWith(' shatters')).length;
  t.banishes += st.log.filter((e) => e.type === 'action-start' && e.abilityId === 'banish').length;
  t.natusHp += (st.combatants[NATUS] as FFXCombatant).hp;
}

function bench(pick: Pick): Tally {
  const t: Tally = { wins: 0, unfinished: 0, turns: 0, phase3: 0, desperados: 0, shatters: 0, banishes: 0, natusHp: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) play(pick, seed, t);
  return t;
}

function row(name: string, t: Tally): string {
  const pct = ((100 * t.wins) / SEEDS).toFixed(1);
  return `| ${name} | ${t.wins}/${SEEDS} (${pct} %) | ${(t.turns / SEEDS).toFixed(1)} | ${t.phase3} | ${(t.desperados / SEEDS).toFixed(2)} | ${(t.shatters / SEEDS).toFixed(2)} | ${t.banishes} | ${Math.round(t.natusHp / SEEDS)} |`;
}

describe(`Chapter X as shipped: the registered tactic on the chapter record, ${SEEDS} seeds (measured, not tuned)`, () => {
  let intended: Tally;
  let wrong: Tally;
  let two: Tally;

  it('the game finds the shipped tactic on this board (FFX, Natus on the enemy side)', () => {
    let found: unknown = null;
    play(shipped, 1, { wins: 0, unfinished: 0, turns: 0, phase3: 0, desperados: 0, shatters: 0, banishes: 0, natusHp: 0 }, (e) => {
      found = tacticFor(e);
    });
    expect(found).toBe(seymourNatus);
  });

  it('intended line and the Haste-all-three line: every battle ends', () => {
    intended = bench(shipped);
    wrong = bench(hasteAll);
    two = bench(hasteTwo);
    console.log(['| Line | Wins | Mean turns | Reached phase 3 | Desperados / battle | Shatters / battle | Banishes | Natus HP left (mean) |',
      '|---|---:|---:|---:|---:|---:|---:|---:|', row('Shipped tactic (intended)', intended), row('Haste all three, then swing (wrong)', wrong),
      row('Haste only Tidus and Auron (strategy 7)', two)].join('\n'));
    expect(intended.unfinished).toBe(0);
    expect(wrong.unfinished).toBe(0);
    expect(two.unfinished).toBe(0);
  }, 900_000);

  it('the shipped line wins and never calls Desperado; Hasting all three calls it, Hasting two never does', () => {
    expect(intended.wins).toBeGreaterThan(0);
    expect(intended.desperados).toBe(0);
    expect(wrong.desperados).toBeGreaterThan(0);
    expect(two.desperados).toBe(0);
    expect(intended.banishes).toBeGreaterThan(0);
  });
});
