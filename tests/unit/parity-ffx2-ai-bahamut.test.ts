/**
 * Re-parity AI lane FFX-2 a: Bahamut follows the game's own script (rows B1 to B5, B7 of
 * `research/re-ffx2-ai-bahamut-vegnagun.md` section 10). **FFX-2 only** (Chapter IV). The decision table, row by row, on the
 * shipped script with a scripted random stream, then through the engine.
 *
 * What stays a timer row until lane W4 (`docs/handoff/re-parity-ai-ffx2-a.md`): the countdown is 5 steps of 150 AI polls
 * (750 polls, 25.03 s of running clock) in the game and five Bahamut turns here, so these tests pin the turn counts, not the seconds.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { aiUnit, bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { BAHAMUT_COUNTDOWN_START, BAHAMUT_POLLS_PER_COUNTDOWN_STEP } from '../../src/battle/ffx2/index.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { aimOf, giveStatus, scriptHarness, SEARCH_MAX } from './helpers/ffx2AiScripted.ts';

const bahamut = () => aiUnit('bahamut', 'enemy', 8400);
const harness = (values: readonly number[] = [], fallback = 0) => scriptHarness(bahamut(), 'ffx2-bahamut', [], values, fallback);

/** Raw search values that pick Yuna, Rikku and Paine in the Bahamut scene (631 / 349 / 349: r = 0..631, 632..980, 981..1328). */
const YUNA = 0;
const RIKKU = 700;
const PAINE = 1328;

const COUNTDOWN = [null, null, null, null, null];
const CYCLE = ['attack', 'attack', 'attack', 'impulse', 'impulse', ...COUNTDOWN, 'mega-flare'];

describe('B1: Curse once, at the very first action', () => {
  it('opens with Curse on one girl without it, chosen by the near-weighted search', () => {
    for (const [raw, who] of [[YUNA, 'yuna'], [RIKKU, 'rikku'], [PAINE, 'paine']] as const) {
      const h = harness([raw]);
      const first = h.poll();
      expect(first && 'id' in first ? first.id : null).toBe('bahamut-curse');
      expect(aimOf(first)).toEqual([who]);
      expect(h.rng.drawsOf(SEARCH_MAX)).toBe(1);
    }
  });

  it('never casts it again: a hundred polls hold exactly one Curse', () => {
    const h = harness();
    expect(h.run(100).filter((id) => id === 'bahamut-curse')).toHaveLength(1);
  });

  it('skips a girl who already carries Curse', () => {
    const h = harness([YUNA]);
    giveStatus(h.girls[0]!, 'curse');
    expect(aimOf(h.poll())).toEqual(['rikku']); // the search sees Rikku and Paine, and a raw of 0 takes the first
  });

  it('goes on to the rotation in the same poll when every girl already has Curse', () => {
    const h = harness();
    for (const g of h.girls) giveStatus(g, 'curse');
    const first = h.poll();
    expect(first && 'id' in first ? first.id : null).toBe('attack');
    expect(h.run(99).filter((id) => id === 'bahamut-curse')).toHaveLength(0); // the flag is spent on that first poll
    expect(h.ctx.self.aiMemory?.['firstCurse']).toBe(1);
  });
});

describe('B2: six actions a cycle', () => {
  it('runs Curse, then Attack x3, Impulse x2, the countdown and Mega Flare, then Attack again with no Curse', () => {
    const chosen = harness().run(1 + CYCLE.length * 3);
    expect(chosen).toEqual(['bahamut-curse', ...CYCLE, ...CYCLE, ...CYCLE]);
  });

  it('counts five countdown turns and then casts, whatever his HP, statuses or the party\'s do', () => {
    const h = harness();
    h.ctx.self.hp = 1;
    giveStatus(h.ctx.self, 'slow');
    giveStatus(h.ctx.self, 'haste');
    expect(h.run(1 + CYCLE.length * 2)).toEqual(['bahamut-curse', ...CYCLE, ...CYCLE]);
  });

  it('aims Impulse and Mega Flare at the whole party', () => {
    const h = harness();
    const commands = Array.from({ length: 1 + CYCLE.length }, () => h.poll());
    for (const c of commands) if (c && 'id' in c && (c.id === 'impulse' || c.id === 'mega-flare')) expect(c.targets).toEqual([]);
  });

  it('carries the game\'s row for Impulse (no damage-type bit: Shell and Protect never apply, B7) and for Mega Flare (magical only)', () => {
    expect((defaultAbilities.get('impulse')?.ffx2Record?.flagsDamage ?? 0) & 3).toBe(0);
    expect((defaultAbilities.get('mega-flare')?.ffx2Record?.flagsDamage ?? 0) & 3).toBe(2);
    expect(defaultAbilities.get('mega-flare')?.ffx2Record?.power).toBe(14);
  });
});

describe('B3, B4: the countdown (a timer row: five steps of 150 polls in the game, five turns here)', () => {
  it('has the game\'s five steps of 150 polls', () => {
    expect(BAHAMUT_COUNTDOWN_START).toBe(5);
    expect(BAHAMUT_POLLS_PER_COUNTDOWN_STEP).toBe(150);
    expect(BAHAMUT_COUNTDOWN_START * BAHAMUT_POLLS_PER_COUNTDOWN_STEP).toBe(750);
  });

  it('shows 5, 4, 3, 2 on four of the five silent turns and 1 with the cast: five numbers, no 0', () => {
    const h = harness();
    h.run(1 + 5 + 5 + 1); // Curse, A A A I I, the five countdown turns, the cast
    const charges = h.emitted.filter((e) => e.type === 'charge') as Array<{ name: string; turnsLeft: number; stage: number }>;
    expect(charges.map((c) => c.name)).toEqual(['5', '4', '3', '2', '1']);
    expect(charges.map((c) => c.turnsLeft)).toEqual([4, 3, 2, 1, 0]); // turns until the cast
    expect(charges.map((c) => c.stage)).toEqual([1, 1, 1, 2, 2]);
  });

  it('keeps the first turn after the second Impulse silent, as the first step shows nothing until it ends', () => {
    const h = harness();
    h.run(1 + 5 + 1); // up to and including the first countdown turn
    expect(h.emitted.filter((e) => e.type === 'charge')).toHaveLength(0);
  });

  it('shows the number on the encounter flags for the HUD, and clears it with the first Attack of the next cycle', () => {
    const h = harness();
    h.run(1 + 5 + 3); // the countdown turns 1 to 3
    expect(h.flags['bahamutCountdown']).toBe(4);
    h.run(3); // turns 4, 5 and the cast
    expect(h.flags['bahamutCountdown']).toBe(1);
    h.run(1); // the first Attack of the next cycle
    expect(h.flags['bahamutCountdown']).toBe(0);
  });
});

describe('B5: Attack goes to a girl without Poison, by the near-weighted search', () => {
  it('never hits a poisoned girl while another stands unpoisoned', () => {
    const h = harness();
    giveStatus(h.girls[0]!, 'poison');
    h.run(1); // Curse
    const targets = new Set<string>();
    for (let i = 0; i < 300; i++) {
      h.rng.feed((i * 7) % 1329);
      const c = h.poll();
      if (c && 'id' in c && c.id === 'attack') for (const t of aimOf(c)) targets.add(t);
    }
    expect(targets.has('yuna')).toBe(false);
    expect(targets.size).toBeGreaterThan(0);
  });

  it('weights the unpoisoned pair by their own weights, not the three\'s', () => {
    // Rikku and Paine alone: 349 and 349, so r = 0..349 is Rikku and 350..697 is Paine.
    const pick = (raw: number) => {
      const h = harness([RIKKU]); // the Curse poll draws first
      giveStatus(h.girls[0]!, 'poison');
      h.poll();
      h.rng.feed(raw);
      return aimOf(h.poll())[0];
    };
    expect(pick(0)).toBe('rikku');
    expect(pick(349)).toBe('rikku');
    expect(pick(350)).toBe('paine');
    expect(pick(697)).toBe('paine');
  });

  it('falls back to any living girl, by the same search, when all are poisoned', () => {
    const h = harness();
    for (const g of h.girls) giveStatus(g, 'poison');
    h.poll(); // Curse
    h.rng.calls.length = 0;
    h.rng.feed(PAINE);
    const attack = h.poll();
    expect(aimOf(attack)).toEqual(['paine']);
    expect(h.rng.drawsOf(SEARCH_MAX)).toBe(1); // the empty first search drew nothing, the second drew once
  });

  it('spends no draw when one girl is left', () => {
    const h = harness();
    h.girls[1]!.alive = false;
    h.girls[2]!.alive = false;
    h.poll(); // Curse on the only candidate
    const attack = h.poll();
    expect(aimOf(attack)).toEqual(['yuna']);
    expect(h.rng.calls).toHaveLength(0);
  });
});

describe('through the engine', () => {
  function bahamutActions(seed: number, wanted: number): string[] {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(seed));
    const ids: string[] = [];
    const seen = new Set<number>();
    for (let i = 0; i < 20_000 && ids.length < wanted; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      let events: BattleEvent[] = [];
      if (d.kind === 'waiting') events = engine.tick(d.nextEventMs);
      else if (d.kind === 'resolved') events = d.events;
      else events = engine.submit({ kind: 'defend', targets: [] });
      for (const e of events) {
        if (e.type === 'action-start' && e.actorId === 'bahamut' && !seen.has(e.seq)) {
          seen.add(e.seq);
          ids.push(e.abilityId ?? '?');
        }
      }
    }
    return ids;
  }

  it('plays Curse once and then the six-action cycle on the live engine', () => {
    const ids = bahamutActions(3, 8);
    expect(ids.slice(0, 7)).toEqual(['bahamut-curse', 'attack', 'attack', 'attack', 'impulse', 'impulse', 'mega-flare']);
    expect(ids.slice(7).filter((id) => id === 'bahamut-curse')).toEqual([]);
  });
});
