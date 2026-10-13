/**
 * **Chapter II (Yunalesca), re-parity RC6: Wakka takes Tidus's place in Form III** (FFX only; Zombie, Hellbiter and Mega Death are FFX's).
 *
 * Bailey, 2026-10-12 (to the question whether to accept the KO rule that dropped Chapter II from 476 to 398 wins of 500 and rework our line later):
 * "I'll go with all of your recommendations". The rework: on his first turn in Form III, Tidus hands the turn to Wakka (`yunalesca-bench.ts`). The
 * line rests on three facts of the preset, pinned here, and plays one switch per fight, pinned on real seeds. The rates (453 and 457 wins of 500
 * against 398 and 405, and every candidate that did not pay) are measured by `re-parity-rc6-ch2-ladder.test.ts` and written up in
 * `docs/handoff/re-parity-rc6-ch2.md`; `strategy-chapter2.test.ts` keeps the forty-seed bar.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { YUNALESCA_GUIDE } from '../../src/data/guides/yunalesca.ts';
import { YUNALESCA_DOC } from '../../src/data/guides/docs/yunalesca.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { CARRIER, SWAPS_OUT, zombieCarrierSwap } from '../../src/engine/tactics/yunalesca-bench.ts';

const armour = (build: FFXPartyBuild, id: string): readonly string[] => {
  const m = build.members.find((x) => x.id === id);
  return m?.equipment?.armor?.autoAbilities ?? [];
};

describe('the three facts of the preset the rule rests on', () => {
  it('Tidus, Yuna and Auron wear Zombie Ward; Wakka wears none and carries a Death Ward', () => {
    for (const id of ['tidus', 'yuna', 'auron']) expect(armour(zanarkandBuild, id), id).toContain('zombie-ward');
    expect(armour(zanarkandBuild, CARRIER)).not.toContain('zombie-ward');
    expect(armour(zanarkandBuild, CARRIER)).toContain('death-ward');
  });

  it('Wakka starts on the bench and Tidus on the field', () => {
    expect(zanarkandBuild.activeSlots).toContain(SWAPS_OUT);
    expect(zanarkandBuild.reserve).toContain(CARRIER);
  });
});

describe('zombieCarrierSwap', () => {
  const row = (inId: string, enabled = true): AvailableCommand =>
    ({ command: { kind: 'switch', targets: [], extra: { outId: 'tidus', inId } }, label: inId, category: 'special', mpCost: 0, rank: 3, enabled, validTargets: [] }) as AvailableCommand;
  const attack = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, rank: 3, enabled: true, validTargets: ['yunalesca'] } as unknown as AvailableCommand;

  it('is Tidus\'s switch to Wakka in Form III, and nothing before it, for anyone else, or when the row is off', () => {
    const rows = [attack, row('kimahri'), row('wakka')];
    const swap = zombieCarrierSwap('tidus', rows, 2);
    expect(swap).toMatchObject({ kind: 'switch', extra: { outId: 'tidus', inId: 'wakka' } });
    expect(zombieCarrierSwap('tidus', rows, 0)).toBeNull();
    expect(zombieCarrierSwap('tidus', rows, 1)).toBeNull();
    expect(zombieCarrierSwap('auron', rows, 2)).toBeNull();
    expect(zombieCarrierSwap('yuna', rows, 2)).toBeNull();
    expect(zombieCarrierSwap('tidus', [attack, row('wakka', false)], 2)).toBeNull();
    expect(zombieCarrierSwap('tidus', [attack, row('kimahri')], 2)).toBeNull();
  });
});

function playOut(seed: number): { switches: Array<{ outId: string; inId: string; form: number; turnsIntoForm: number }>; won: boolean; wakkaOnField: boolean } {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca']!, triggers: [], seed, condition: 'normal', canEscape: false });
  let won = false;
  for (let i = 0; i < 30_000; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') { won = d.result.outcome === 'victory'; break; }
    if (d.kind !== 'player-input') continue;
    const cmd: Command = intendedStrategy(d.actorId, d.commands, engine) ?? ({ kind: 'defend', targets: [] } as Command);
    engine.submit(cmd);
  }
  const state = engine.state();
  const switches: Array<{ outId: string; inId: string; form: number; turnsIntoForm: number }> = [];
  let form = 0;
  let turnsIntoForm = 0;
  for (const e of state.log) {
    if (e.type === 'form-change' && e.enemyId === 'yunalesca') { form = e.formIndex; turnsIntoForm = 0; }
    if (e.type === 'turn-start' && e.actorId !== 'yunalesca') turnsIntoForm += 1;
    if (e.type === 'switch') switches.push({ outId: e.outId, inId: e.inId, form, turnsIntoForm });
  }
  return { switches, won, wakkaOnField: state.activeIds.includes('wakka') };
}

describe('the shipped line on real seeds', () => {
  it('plays exactly one switch a fight, Tidus for Wakka, after the form changed to the third, and never before', () => {
    let fights = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const r = playOut(seed);
      fights += 1;
      expect(r.switches, `seed ${seed}`).toHaveLength(1);
      const s = r.switches[0]!;
      expect(s, `seed ${seed}`).toMatchObject({ outId: 'tidus', inId: 'wakka', form: 2 });
      // his first turn of the form: the party has had no more than a few turns since the entry Mega Death
      expect(s.turnsIntoForm, `seed ${seed}`).toBeLessThanOrEqual(6);
    }
    expect(fights).toBe(12);
  });

  it('Wakka is on the field at the end of a fight the line wins, and the line wins most of these seeds', () => {
    let wins = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const r = playOut(seed);
      if (r.won) { wins += 1; expect(r.wakkaOnField, `seed ${seed}`).toBe(true); }
    }
    expect(wins).toBeGreaterThanOrEqual(9);
  });
});

describe('the guide says what the line does', () => {
  it('has a rule, a hint on the switch and a phase note that name Wakka, and the page carries the paragraphs', () => {
    expect(YUNALESCA_GUIDE.rules.some((r) => /Wakka/.test(r.text) && /Zombie Ward/.test(r.text))).toBe(true);
    const hint = YUNALESCA_GUIDE.hints.find((h) => h.when.kinds?.includes('switch'));
    expect(hint?.text).toMatch(/Wakka/);
    expect(YUNALESCA_GUIDE.phases.find((p) => p.formIndex === 2)?.note).toMatch(/Wakka/);
    const blocks = YUNALESCA_DOC.blocks.filter((b) => b.t === 'p').map((b) => ('text' in b ? b.text : ''));
    expect(blocks.some((t) => /swap Wakka in for Tidus/.test(t) && /Zombie Ward/.test(t))).toBe(true);
    expect(blocks.some((t) => /knock-out takes a character's Zombie away/.test(t))).toBe(true);
  });
});
