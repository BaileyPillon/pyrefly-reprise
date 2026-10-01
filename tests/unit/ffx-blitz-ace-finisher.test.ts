/**
 * od2 (FFX only): a successful Blitz Ace ends with its "Last Hit" finisher; a
 * failed one does not.
 *
 * `research/ffx-combat-core.md` §5.3, table `[verified: 2 sources]`: Blitz Ace,
 * rows "99 + 274 / 238", rank "7 (fail 6)", success "4 × 8, then a final 24 × 1
 * (row 274 "Last Hit")", fail "4 × 8". The 8 + 1 hit count is `[single
 * source]` (§11 C14).
 *
 * Before this fix `extra.finisherPower` / `finisherHits` were read by nothing,
 * so a success dealt only the 4 × 8 volley (484 on this board), exactly what a
 * fail dealt, and the fail came back sooner (rank 6): the fail was strictly
 * better. Every damage assertion runs the real engine.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, FFXCombatant, MinigameResult } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFXContentRegistry, buildBattle, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { finisherRow, rowFromExtra } from '../../src/battle/ffx/overdriveShape.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

const ACE = TIDUS['blitz-ace']!;
const od = (id: string) => ({ gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [id] });
const board = (def: AbilityDef) =>
  setup({
    party: party({ members: [member({ id: 'tidus', overdrive: od(def.id) }), member({ id: 'auron' }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
    enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
  });
const timing = (success: boolean, timeRemainingMs = 0): MinigameResult => ({ kind: 'tidus-timing', timing: { success, timeRemainingMs, timerMs: 2200 } });

function fire(def: AbilityDef, result: MinigameResult): { amounts: number[]; misses: number; tick: number } {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  engine.init(board(def));
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input' || d.actorId === 'tidus') break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result };
  const events: BattleEvent[] = [];
  for (let i = 0; i < 5 && !events.some((e) => e.type === 'action-end'); i++) events.push(...engine.submit(cmd));
  const tick = engine.predictTurnOrder(30).find((p) => p.actorId === 'tidus')?.tickValue ?? -1;
  return {
    amounts: events.flatMap((e) => (e.type === 'damage' && e.sourceId === 'tidus' ? [e.amount] : [])),
    misses: events.filter((e) => e.type === 'miss').length,
    tick,
  };
}
const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

describe('Blitz Ace: success = 4 x 8 then the 24 x 1 "Last Hit"; fail = 4 x 8 [§5.3]', () => {
  it('a success lands 8 volley hits and then one finisher hit at about 6x a volley hit (24 / 4 DmgCon)', () => {
    const ok = fire(ACE, timing(true));
    expect(ok.amounts).toHaveLength(9);
    expect(ok.misses).toBe(0); // hard rule 5: Overdrives never miss, the finisher included
    const volley = ok.amounts.slice(0, 8);
    const ratio = ok.amounts[8]! / (total(volley) / 8);
    expect(ratio).toBeGreaterThan(5.4);
    expect(ratio).toBeLessThan(6.6);
  });

  it('a fail lands the 8 volley hits and no finisher, and deals strictly less than a success', () => {
    const ok = fire(ACE, timing(true));
    const bad = fire(ACE, timing(false));
    expect(bad.amounts).toHaveLength(8);
    expect(bad.amounts).toEqual(ok.amounts.slice(0, 8)); // the same volley, the same RNG draws
    expect(total(ok.amounts)).toBeGreaterThan(total(bad.amounts));
    expect(bad.tick).toBeLessThan(ok.tick); // rank 6 against 7, unchanged
  });

  it('the §5.2 bonus scales the finisher with the volley on a success, and a fail with time on the clock earns none', () => {
    const slow = fire(ACE, timing(true, 0));
    const fast = fire(ACE, timing(true, 1100));
    expect(fast.amounts[8]!).toBeGreaterThan(slow.amounts[8]!);
    expect(fire(ACE, timing(false, 2100)).amounts).toEqual(fire(ACE, timing(false, 0)).amounts);
  });

  it('the other Swordplay rows carry no finisher: a success is unchanged', () => {
    for (const def of [TIDUS['spiral-cut']!, TIDUS['slice-and-dice']!, TIDUS['energy-rain']!]) {
      expect(finisherRow(def)).toBeUndefined();
      expect(fire(def, timing(true)).amounts).toHaveLength(def.hits * 1);
    }
  });

  it('the finisher counts the target once per action (a per-targeting gauge or counter is not paid twice)', () => {
    const reg = new FFXContentRegistry();
    reg.addAbilities([attackAbility(), ACE]);
    const ctx = buildBattle(board(ACE), new SeededRng(1), reg, () => {});
    const rt = ctx.rt.actors.get('dummy')!;
    rt.countsPartyTargetings = true;
    const tidus = ctx.state.combatants['tidus'] as FFXCombatant;
    executeCommand(ctx, tidus, { kind: 'overdrive', id: 'blitz-ace', targets: ['dummy'], extra: timing(true) }, true);
    expect(rt.partyTargetings).toBe(1);
  });
});

describe('finisherRow', () => {
  it('builds row 274 from the record: 24 x 1, canMiss false, the rest of the success record', () => {
    const last = finisherRow(ACE)!;
    expect(last).toMatchObject({ id: 'blitz-ace', power: 24, hits: 1, rank: 7, canMiss: false, targeting: 'single-enemy' });
    expect(last.extra?.['finisherPower']).toBeUndefined();
    expect(ACE.extra?.['finisherPower']).toBe(24); // the record itself is not mutated
    expect(finisherRow(rowFromExtra(ACE, 'fail')!)).toBeUndefined(); // the fail row has none
  });
});
