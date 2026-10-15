/**
 * XK-petrify (re-parity RC8, lane X2-K; **FFX-2 only**): in `results.ts`, a Petrified, not-dead enemy counts as defeated, as a Petrified girl already stops counting as
 * standing (PR-0145). The game's evaluation (exe 0x0061ef70, FFX2-G10 section 10.1, 20,000 harness vectors) requires every monster that is in the battle, present, not dead
 * and not Death to be Petrified for the battle to be won: "monsters that are all petrified count as defeated".
 *
 * Expectations are written from that rule. The engine-level sweep over every combination of states is in `parity-ffx2-end-window.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { battleOutcome, emptyState } from '../../src/battle/ffx2/results.ts';

function world(): { girls: Ffx2Unit[]; foes: Ffx2Unit[]; part: Ffx2Unit; all: Ffx2Unit[] } {
  const girls = [aiUnit('yuna', 'party', 500, 0), aiUnit('rikku', 'party', 500, 1), aiUnit('paine', 'party', 500, 2)];
  const foes = [aiUnit('m0', 'enemy', 900, 0), aiUnit('m1', 'enemy', 900, 1)];
  const part = aiUnit('node', 'enemy', 300_000, 2);
  part.flags.isPart = true;
  return { girls, foes, part, all: [...girls, ...foes, part] };
}

const petrify = (u: Ffx2Unit): void => {
  u.statuses['petrify'] = { id: 'petrify', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
};

describe('XK-petrify: a Petrified enemy is defeated', () => {
  it('a Petrified last enemy ends the fight in a victory', () => {
    const w = world();
    expect(battleOutcome(w.all, emptyState())).toBeNull();
    w.foes[0]!.alive = false;
    w.foes[0]!.hp = 0;
    expect(battleOutcome(w.all, emptyState())).toBeNull(); // the other still stands
    petrify(w.foes[1]!);
    expect(battleOutcome(w.all, emptyState())).toBe('victory');
  });

  it('a Petrified enemy beside a standing one does not end it; neither does a part, Petrified or not', () => {
    const w = world();
    petrify(w.foes[0]!);
    expect(battleOutcome(w.all, emptyState())).toBeNull();
    petrify(w.foes[1]!);
    expect(battleOutcome(w.all, emptyState())).toBe('victory'); // the part (300,000 HP, alive, not stone) never gates
    delete w.foes[1]!.statuses['petrify'];
    petrify(w.part);
    expect(battleOutcome(w.all, emptyState())).toBeNull();
  });

  it('Petrified girls and Petrified enemies together: the party falls first (the evaluation looks at the party before the monsters)', () => {
    const w = world();
    for (const g of w.girls) petrify(g);
    for (const f of w.foes) petrify(f);
    expect(battleOutcome(w.all, emptyState())).toBe('defeat');
  });
});
