/**
 * Re-parity AI lane FFX-2 a: the Vegnagun Tail, Leg and Nodes follow the game's own scripts (rows T1, T2, L1, L2, N1 to N3 of
 * `research/re-ffx2-ai-bahamut-vegnagun.md` section 10). **FFX-2 only** (Chapter V, links 1 and 2). The decision tables, row by
 * row, on the shipped scripts with a scripted random stream.
 *
 * Reproduced from the note: the Leg's sequence from the first poll (`1 . 1 . . 1 . V 1 . . . 1 1 V 1 . 1 1 . V`, then `1 1 1 V`
 * for ever) and, over every value of `random()`, the shares of its three status moves.
 */

import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { nodeColour, syncNodeImmunity } from '../../src/battle/ffx2/index.ts';
import { notifyEnemiesDamaged } from '../../src/battle/ffx2/engineHooks.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { sceneWeights, SCENES } from '../../src/battle/ffx2/ai/script-rolls.ts';
import type { EventDraft } from '../../src/battle/ffx2/internal.ts';
import { aimOf, giveStatus, RANDOM_MAX, scriptHarness, SEARCH_MAX, triggerNames, type ScriptHarness } from './helpers/ffx2AiScripted.ts';

/** The first poll of a fresh script for each of the 65,536 values `random()` can return, tallied by the command it chose. */
function tallyRaw(make: () => ScriptHarness): Record<string, number> {
  const h = make();
  const counts: Record<string, number> = {};
  for (let raw = 0; raw <= RANDOM_MAX; raw += 1) {
    h.ctx.self.aiMemory = {};
    h.rng.reset();
    h.rng.feed(raw);
    const c = h.poll();
    const id = c && 'id' in c ? c.id : 'none';
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

const tail = () => aiUnit('vegnagun-tail', 'enemy', 34200);
const leg = () => aiUnit('vegnagun-leg', 'enemy', 18220);

describe('Tail: the opening, the quarter-HP sweep, then Tail Beam [T1, T2]', () => {
  it('opens with a voice, then Noli Me Tangere, then Tail Beam for ever', () => {
    const h = scriptHarness(tail(), 'vegnagun-tail');
    expect(h.run(6)).toEqual([null, 'noli-me-tangere', 'tail-beam', 'tail-beam', 'tail-beam', 'tail-beam']);
    expect(triggerNames(h.emitted)).toEqual(['farplane-voice-braska']);
  });

  it('sweeps once more below a quarter of his HP, strictly below, and then speaks on a poll of its own', () => {
    const t = tail();
    const h = scriptHarness(t, 'vegnagun-tail');
    h.run(2); // the voice and the opening sweep
    t.hp = 8550; // 34,200 / 4: not below
    expect(h.run(1)).toEqual(['tail-beam']);
    t.hp = 8549;
    expect(h.run(1)).toEqual(['noli-me-tangere']);
    expect(triggerNames(h.emitted)).not.toContain('vegnagun-tail-quarter'); // the Jecht line is the poll after the sweep
    expect(h.run(1)).toEqual([null]);
    expect(triggerNames(h.emitted)).toContain('vegnagun-tail-quarter');
    expect(h.run(3)).toEqual(['tail-beam', 'tail-beam', 'tail-beam']);
  });

  it('does the opening sweep first even when he starts below a quarter, and the quarter sweep is only after it', () => {
    const t = tail();
    t.hp = 100;
    const h = scriptHarness(t, 'vegnagun-tail');
    expect(h.run(5)).toEqual([null, 'noli-me-tangere', 'noli-me-tangere', null, 'tail-beam']);
  });

  it('has no half-HP sweep: between a half and a quarter he only beams', () => {
    const t = tail();
    const h = scriptHarness(t, 'vegnagun-tail');
    h.run(2);
    t.hp = 12000;
    expect(h.run(12).every((id) => id === 'tail-beam')).toBe(true);
  });

  it('runs a target search the sweeps throw away, which draws when two or more girls stand', () => {
    const h = scriptHarness(tail(), 'vegnagun-tail');
    h.poll(); // the voice
    h.poll(); // the opening sweep
    expect(h.rng.calls).toEqual([[0, SEARCH_MAX]]);
    const alone = scriptHarness(tail(), 'vegnagun-tail');
    alone.girls[1]!.alive = false;
    alone.girls[2]!.alive = false;
    alone.run(2);
    expect(alone.rng.calls).toEqual([]);
  });

  it('aims Tail Beam by the near-weighted search of its own scene, first slot owning the extra value', () => {
    const total = sceneWeights(SCENES.tail, [0, 1, 2]).reduce((s, w) => s + w, 0);
    const pick = (raw: number) => {
      const h = scriptHarness(tail(), 'vegnagun-tail');
      h.run(2);
      h.rng.reset();
      h.rng.feed(raw);
      return aimOf(h.poll())[0];
    };
    expect(pick(0)).toBe('yuna');
    expect(pick(total - 1)).toBe('paine');
  });
});

describe('Leg: voices, the fourth non-voice poll, and the status move [L1, L2]', () => {
  /** The note's sequence from the first poll, then `1 1 1 V` for ever. */
  const SEQUENCE = ['1', '.', '1', '.', '.', '1', '.', 'V', '1', '.', '.', '.', '1', '1', 'V', '1', '.', '1', '1', '.', 'V'];
  const forever = (n: number) => SEQUENCE.concat(Array.from({ length: n }, (_, i) => (i % 4 === 3 ? 'V' : '1')));

  it('reproduces the note\'s sequence: status move 1, voice ., Vita Brevis V', () => {
    const h = scriptHarness(leg(), 'vegnagun-leg');
    const symbol = (id: string | null) => (id === null ? '.' : id === 'vita-brevis' ? 'V' : '1');
    expect(h.run(40).map(symbol)).toEqual(forever(19));
  });

  it('makes polls 2, 4, 5, 7, 10, 11, 12, 17 and 20 voice lines, by Jecht, Jecht, Auron, Braska, Jecht, Braska, Auron, Auron, Braska', () => {
    const h = scriptHarness(leg(), 'vegnagun-leg');
    h.run(30);
    const voices = h.emitted.filter((e) => e.type === 'script-trigger') as unknown as Array<{ name: string; payload: { poll: number; speaker: string } }>;
    expect(voices.map((v) => v.name)).toEqual(Array(9).fill('farplane-voice'));
    expect(voices.map((v) => v.payload.poll)).toEqual([2, 4, 5, 7, 10, 11, 12, 17, 20]);
    expect(voices.map((v) => v.payload.speaker)).toEqual(['jecht', 'jecht', 'auron', 'braska', 'jecht', 'braska', 'auron', 'auron', 'braska']);
  });

  it('rolls random() % 4 for the status move: Break 25 %, Berserk 25 %, Slow 50 %, over every value', () => {
    const counts = tallyRaw(() => scriptHarness(leg(), 'vegnagun-leg')); // poll 1 is a status move
    expect(counts).toEqual({ 'leg-break': 16384, 'leg-berserk': 16384, 'leg-slow': 32768 });
  });

  it('draws the roll (16-bit) first and then one search (31-bit) among the girls who lack the status', () => {
    const h = scriptHarness(leg(), 'vegnagun-leg', [], [0]); // Break
    giveStatus(h.girls[0]!, 'petrify');
    const move = h.poll();
    expect(move && 'id' in move ? move.id : null).toBe('leg-break');
    expect(h.rng.calls).toEqual([[0, RANDOM_MAX], [0, SEARCH_MAX]]);
    expect(aimOf(move)[0]).not.toBe('yuna');
  });

  it('uses Absorb on any living girl, by the same search, when every girl already has the rolled status (the Break fallback too)', () => {
    for (const [raw, status] of [[0, 'petrify'], [1, 'berserk'], [2, 'slow']] as const) {
      const h = scriptHarness(leg(), 'vegnagun-leg', [], [raw]);
      for (const g of h.girls) giveStatus(g, status);
      const move = h.poll();
      expect(move && 'id' in move ? move.id : null).toBe('leg-absorb');
      expect(h.rng.calls).toEqual([[0, RANDOM_MAX], [0, SEARCH_MAX]]); // the empty first search drew nothing
    }
  });

  it('casts Vita Brevis on the fourth non-voice poll and starts the count again', () => {
    const h = scriptHarness(leg(), 'vegnagun-leg');
    const chosen = h.run(21); // the 21st poll is the third Vita Brevis of the note's sequence
    expect(chosen[20]).toBe('vita-brevis');
    expect(h.ctx.self.aiMemory?.['turn']).toBe(0);
  });
});

describe('Nodes: three colours, five polls, hits [N1, N2, N3]', () => {
  const nodeOf = (id: string) => aiUnit(id, 'enemy', 300000, id === 'node-a' ? 1 : id === 'node-b' ? 2 : 3);

  it('starts A red, B green and C yellow, before any of them acts', () => {
    expect([nodeOf('node-a'), nodeOf('node-b'), nodeOf('node-c')].map(nodeColour)).toEqual(['red', 'green', 'yellow']);
  });

  it('is Null Physical while red and Null Magic while yellow from its first poll, and neither while green', () => {
    for (const [id, status] of [['node-a', 'null-physical'], ['node-b', null], ['node-c', 'null-magic']] as const) {
      const node = nodeOf(id);
      const h = scriptHarness(node, 'vegnagun-node', [leg()]);
      h.poll();
      expect(node.statuses['null-physical'] !== undefined).toBe(status === 'null-physical');
      expect(node.statuses['null-magic'] !== undefined).toBe(status === 'null-magic');
    }
    const fresh = nodeOf('node-a');
    syncNodeImmunity(fresh);
    expect(fresh.statuses['null-physical']).toBeDefined();
  });

  it('acts four times in a colour and changes on the fifth poll, which goes on to act in the new colour', () => {
    const node = nodeOf('node-a');
    const h = scriptHarness(node, 'vegnagun-node', [leg()]);
    const colours: string[] = [];
    for (let i = 0; i < 13; i++) {
      h.poll();
      colours.push(nodeColour(node));
    }
    expect(colours).toEqual([
      'red', 'red', 'red', 'red',
      'green', 'green', 'green', 'green',
      'yellow', 'yellow', 'yellow', 'yellow',
      'red',
    ]);
  });

  it('counts every damaging hit toward the change, one for each separate result', () => {
    const node = nodeOf('node-a');
    const h = scriptHarness(node, 'vegnagun-node', [leg()]);
    h.run(2); // poll counter 2
    aiScriptFor('vegnagun-node').onDamaged?.(h.ctx, 'yuna', 120, 3); // a three-hit blow: +3 makes 5
    h.poll(); // 5 + 1: the colour changes
    expect(nodeColour(node)).toBe('green');
  });

  it('is told the hits of an action by the engine hook: one per HP-damaging result, none for a hit that deals nothing', () => {
    const node = nodeOf('node-a');
    (node as { enemy?: unknown }).enemy = { aiScriptId: 'vegnagun-node' }; // the engine finds the script by this id
    const h = scriptHarness(node, 'vegnagun-node', [leg()]);
    const told: Array<[number, number | undefined]> = [];
    const script = aiScriptFor('vegnagun-node');
    const original = script.onDamaged;
    script.onDamaged = (ctx, source, amount, hits) => {
      told.push([amount, hits]);
      original?.(ctx, source, amount, hits);
    };
    try {
      const hit = (amount: number): EventDraft =>
        ({ type: 'damage', targetId: 'node-a', sourceId: 'rikku', amount, element: 'none', crit: false, hitIndex: 0, hitCount: 2 }) as EventDraft;
      notifyEnemiesDamaged([hit(40), hit(0), hit(60)], h.girls[1]!, [node, ...h.girls], () => h.ctx);
      expect(told).toEqual([[100, 2]]);
      notifyEnemiesDamaged([hit(0)], h.girls[1]!, [node, ...h.girls], () => h.ctx);
      expect(told).toEqual([[100, 2]]); // nothing told for a result of 0
    } finally {
      script.onDamaged = original;
    }
  });

  it('red rolls random() % 2: Dies Irae on the party or a Missile at one girl, uniformly picked', () => {
    const roll = (raw: number, pick = 0) => {
      const h = scriptHarness(nodeOf('node-a'), 'vegnagun-node', [leg()], [raw, pick]);
      const c = h.poll();
      return { id: c && 'id' in c ? c.id : null, aim: aimOf(c), calls: h.rng.calls.length };
    };
    expect(roll(0)).toEqual({ id: 'dies-irae', aim: [], calls: 1 });
    expect(roll(1, 1)).toEqual({ id: 'missile', aim: ['rikku'], calls: 2 });
    expect(roll(3, 2).aim).toEqual(['paine']);
  });

  it('green rolls random() % 5: Regen, Shell, Protect on the Leg, and Cura on it for 3 and 4 (20 / 20 / 20 / 40 percent)', () => {
    const counts = tallyRaw(() => scriptHarness(nodeOf('node-b'), 'vegnagun-node', [leg()]));
    expect(counts).toEqual({ 'node-regen': 13108, 'node-shell': 13107, 'node-protect': 13107, cura: 26214 });
  });

  it('yellow rolls random() % 5: Flare at one girl, Firaga, Waterga, Thundaga, Blizzaga on the party (20 percent each)', () => {
    const counts = tallyRaw(() => scriptHarness(nodeOf('node-c'), 'vegnagun-node', [leg()]));
    expect(counts).toEqual({ flare: 13108, firaga: 13107, waterga: 13107, thundaga: 13107, blizzaga: 13107 });
  });

  it('casts its green support on the Leg, never on itself, and does nothing without one', () => {
    const node = nodeOf('node-b');
    const alone = scriptHarness(node, 'vegnagun-node');
    expect(alone.poll()).toBeNull();
  });
});
