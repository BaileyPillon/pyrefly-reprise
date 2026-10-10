/**
 * Re-parity AI lane FFX-2 a: the Vegnagun Body (the Core) and its two Bulwarks follow the game's own scripts (rows C1 to C4 of
 * `research/re-ffx2-ai-bahamut-vegnagun.md` section 10). **FFX-2 only** (Chapter V, link 3). The decision tables, row by row, on the
 * shipped scripts with a scripted random stream.
 *
 * The Core's log reads the damage type bits of the command a girl ran, which the engine keeps per performer; here `abilityPerformedBy`
 * is answered by the test so the classification can be driven by hand.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { classifyDamageBits } from '../../src/battle/ffx2/ai/vegnagun-body.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { aimOf, giveStatus, RANDOM_MAX, scriptHarness, SEARCH_MAX, type ScriptHarness } from './helpers/ffx2AiScripted.ts';

/** What each unit "last performed", answered to the script in place of the engine's own record. */
const performed = vi.hoisted(() => new Map<string, string>());
vi.mock('../../src/battle/ffx2/execute.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/battle/ffx2/execute.ts')>()),
  abilityPerformedBy: (unit: { id: string }) => performed.get(unit.id),
}));

beforeEach(() => performed.clear());

const core = () => aiUnit('vegnagun-body', 'enemy', 33040, 0);
const right = () => aiUnit('bulwark-r', 'enemy', 3000, 1);
const left = () => aiUnit('bulwark-l', 'enemy', 3000, 2);

/** A Core with both Bulwarks beside it, its first (voice) poll already taken. */
function liveCore(): { h: ScriptHarness; r: ReturnType<typeof right>; l: ReturnType<typeof left> } {
  const r = right();
  const l = left();
  const h = scriptHarness(core(), 'vegnagun-body', [r, l]);
  h.run(1); // the opening voice
  return { h, r, l };
}

/** A command row with `bits` in its damage word, for the log to classify. */
function withBits(id: string, bits: number): AbilityDef {
  const base = defaultAbilities.get('noli-me-tangere') as AbilityDef;
  return { ...base, id, ffx2Record: { ...(base.ffx2Record as NonNullable<AbilityDef['ffx2Record']>), flagsDamage: bits } };
}

describe('the Core: voices [C1]', () => {
  it('speaks on its first poll, then charges three times and fires Memento Mori', () => {
    const r = right();
    const l = left();
    const h = scriptHarness(core(), 'vegnagun-body', [r, l]);
    expect(h.run(9)).toEqual([null, 'charge-core', 'charge-core', 'charge-core', 'memento-mori', 'charge-core', 'charge-core', 'charge-core', 'memento-mori']);
  });

  it('speaks once when a girl has hit a Bulwark', () => {
    const { h, r } = liveCore();
    h.run(1); // a charge
    aiScriptFor('vegnagun-bulwark').onTargeted?.({ ...h.ctx, self: r }, 'yuna');
    expect(h.flags['coreBulwarkHit']).toBe(1);
    expect(h.run(2)).toEqual([null, 'charge-core']);
  });

  it('speaks on three polls after four answers, then forces the count to 8 and goes on in the same poll', () => {
    const { h } = liveCore();
    h.flags['coreAnswers'] = 4;
    expect(h.run(5)).toEqual([null, null, null, 'charge-core', 'charge-core']);
    expect(h.flags['coreAnswers']).toBe(8);
  });

  it('speaks on two polls after its third Memento Mori, then forces the shot count to 8 and goes on', () => {
    const { h } = liveCore();
    expect(h.run(12).filter((id) => id === 'memento-mori')).toHaveLength(3); // three cycles of Charge x3 and Memento Mori
    expect(h.run(3)).toEqual([null, null, 'charge-core']);
    expect(h.ctx.self.aiMemory?.['shots']).toBe(8);
  });
});

describe('the Core: Memento Mori, revives, charges [the existing cycle, kept]', () => {
  it('revives the Right Bulwark before the Left, and a revive takes the place of a charge', () => {
    const { h, r, l } = liveCore();
    h.run(1); // one charge banked
    r.alive = false;
    l.alive = false;
    const revive = h.poll();
    expect(revive && 'id' in revive ? [revive.id, ...aimOf(revive)] : null).toEqual(['full-life', 'bulwark-r']);
    expect(h.ctx.self.aiMemory?.['actionCount']).toBe(1); // the charge count did not move
    r.alive = true;
    expect(aimOf(h.poll())).toEqual(['bulwark-l']);
  });

  it('cannot let a revive replace the shot: at three charges Memento Mori comes first', () => {
    const { h, r } = liveCore();
    h.run(3);
    r.alive = false;
    expect(h.run(1)).toEqual(['memento-mori']);
  });

  it('telegraphs the charge with a countdown the HUD can draw', () => {
    const { h } = liveCore();
    h.run(4);
    const charges = h.emitted.filter((e) => e.type === 'charge');
    expect(charges.map((c) => (c as { turnsLeft: number }).turnsLeft)).toEqual([2, 1, 0, 0]);
  });
});

describe('the Core\'s log [C4]: who and what kind, last one wins', () => {
  it('reads the command row\'s damage type bits: physical only, magical only, anything else', () => {
    expect(classifyDamageBits(0x1)).toBe('protect-reducible');
    expect(classifyDamageBits(0x2)).toBe('shell-reducible');
    expect(classifyDamageBits(0x3)).toBe('none'); // both bits
    expect(classifyDamageBits(0x0)).toBe('none'); // neither bit: items, the percent and Overdrive-style commands
    expect(classifyDamageBits(0x25)).toBe('protect-reducible'); // only the low two bits count
  });

  function logged(abilityId: string, bits: number, who = 'yuna') {
    const { h } = liveCore();
    h.ctx.ability = (id) => (id === abilityId ? withBits(abilityId, bits) : defaultAbilities.get(id));
    performed.set(who, abilityId);
    aiScriptFor('vegnagun-body').onTargeted?.(h.ctx, who);
    return { who: h.flags['coreLogWho'], kind: h.flags['coreLogClass'] };
  }

  it('logs a physical-only command as the Protect-reducible kind and a magical-only one as the Shell-reducible kind', () => {
    expect(logged('sword', 1)).toEqual({ who: 'yuna', kind: 'protect-reducible' });
    expect(logged('spell', 2, 'rikku')).toEqual({ who: 'rikku', kind: 'shell-reducible' });
  });

  it('logs a command with both bits or neither as the third kind', () => {
    expect(logged('both', 3).kind).toBe('none');
    expect(logged('neither', 0, 'paine')).toEqual({ who: 'paine', kind: 'none' });
  });

  it('ignores a monster\'s action', () => {
    const { h, r } = liveCore();
    aiScriptFor('vegnagun-body').onTargeted?.(h.ctx, r.id);
    expect(h.flags['coreLogWho']).toBeUndefined();
  });
});

describe('the Bulwarks [C2, C3]', () => {
  function bulwarks(): { h: ScriptHarness; body: ReturnType<typeof core>; r: ReturnType<typeof right>; l: ReturnType<typeof left> } {
    const body = core();
    const l = left();
    const r = right();
    const h = scriptHarness(r, 'vegnagun-bulwark', [body, l]);
    return { h, body, r, l };
  }
  it('picks its single target before anything else, on every poll: a search, then random() % 4, then a search again', () => {
    const { h } = bulwarks();
    h.poll();
    expect(h.rng.calls).toEqual([[0, SEARCH_MAX], [0, RANDOM_MAX], [0, SEARCH_MAX]]);
  });

  it('answers a physical hit with Physical attack detected on the whole party and spends the log', () => {
    const { h } = bulwarks();
    h.flags['coreLogWho'] = 'yuna';
    h.flags['coreLogClass'] = 'protect-reducible';
    const c = h.poll();
    expect(c && 'id' in c ? c.id : null).toBe('physical-attack-detected');
    expect(aimOf(c)).toEqual([]); // all of the party, not the logged girl alone
    expect(h.flags['coreLogWho']).toBeUndefined();
    expect(h.flags['coreLogClass']).toBeUndefined();
    expect(h.flags['coreAnswers']).toBe(1);
  });

  it('answers a magical hit with Magical attack detected on the whole party', () => {
    const { h } = bulwarks();
    h.flags['coreLogWho'] = 'rikku';
    h.flags['coreLogClass'] = 'shell-reducible';
    const c = h.poll();
    expect(c && 'id' in c ? c.id : null).toBe('magical-attack-detected');
    expect(aimOf(c)).toEqual([]);
  });

  it('answers the third kind with Hostile activity detected on the logged girl if she is up, else a uniform living girl', () => {
    const up = bulwarks();
    up.h.flags['coreLogWho'] = 'paine';
    up.h.flags['coreLogClass'] = 'none';
    const c = up.h.poll();
    expect(c && 'id' in c ? c.id : null).toBe('hostile-activity-detected');
    expect(aimOf(c)).toEqual(['paine']);
    expect(up.h.rng.calls).toEqual([]); // she is up: no search at all

    const down = bulwarks();
    down.h.girls[2]!.alive = false;
    down.h.flags['coreLogWho'] = 'paine';
    down.h.flags['coreLogClass'] = 'none';
    down.h.rng.feed(1);
    expect(aimOf(down.h.poll())).toEqual(['rikku']); // a uniform pick over Yuna and Rikku, raw 1
  });

  it('lets one Bulwark answer a strike: the other, polling after it, finds the log empty and idles', () => {
    const { h, r, l } = bulwarks();
    h.flags['coreLogWho'] = 'yuna';
    h.flags['coreLogClass'] = 'protect-reducible';
    h.poll();
    const second = scriptHarness(l, 'vegnagun-bulwark', [core(), r]);
    Object.assign(second.flags, h.flags); // the same battle-local variables
    const idle = second.poll();
    expect(['leg-break', 'bulwark-doom', 'bulwark-bio', 'dispel']).toContain(idle && 'id' in idle ? idle.id : '');
  });

  it('idles on Shell 25 %, Protect 25 % and Regen 50 % for the Right, one uniform living monster each time', () => {
    const { h, body, l } = bulwarks();
    const counts: Record<string, number> = {};
    for (let raw = 0; raw <= RANDOM_MAX; raw += 1) {
      h.rng.reset();
      h.rng.feed(0, raw, 0); // the target search, random() % 4, the spell's target search
      const c = h.poll();
      const id = c && 'id' in c ? c.id : 'none';
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts).toEqual({ 'node-shell': 16384, 'node-protect': 16384, 'node-regen': 32768 });
    // The spell lands on a monster of the link, oneself included: Body, Right and Left in slot order.
    const picks = [0, 1, 2].map((raw) => {
      h.rng.reset();
      h.rng.feed(0, 0, raw);
      return aimOf(h.poll())[0];
    });
    expect(picks).toEqual([body.id, 'bulwark-r', l.id]);
  });

  it('idles on Break, Doom, Bio and Dispel for the Left, 25 % each, at one uniform living girl', () => {
    const l = left();
    const h = scriptHarness(l, 'vegnagun-bulwark', [core(), right()]);
    const counts: Record<string, number> = {};
    for (let raw = 0; raw <= RANDOM_MAX; raw += 1) {
      h.rng.reset();
      h.rng.feed(0, raw, 2);
      const c = h.poll();
      const id = c && 'id' in c ? c.id : 'none';
      counts[id] = (counts[id] ?? 0) + 1;
      expect(aimOf(c)).toEqual(['paine']); // one girl, not the party
    }
    expect(counts).toEqual({ 'leg-break': 16384, 'bulwark-doom': 16384, 'bulwark-bio': 16384, dispel: 16384 });
    expect(defaultAbilities.get('bulwark-bio')?.targeting).toBe('single-enemy');
    expect(defaultAbilities.get('bulwark-doom')?.targeting).toBe('single-enemy');
  });

  it('notes a girl\'s hit on a Bulwark for the Core, and not a monster\'s', () => {
    const { h, r } = bulwarks();
    aiScriptFor('vegnagun-bulwark').onTargeted?.({ ...h.ctx, self: r }, 'bulwark-l');
    expect(h.flags['coreBulwarkHit']).toBeUndefined();
    aiScriptFor('vegnagun-bulwark').onTargeted?.({ ...h.ctx, self: r }, 'paine');
    expect(h.flags['coreBulwarkHit']).toBe(1);
  });

  it('counts a Petrified girl as alive, so she is still a candidate', () => {
    const l = left();
    const h = scriptHarness(l, 'vegnagun-bulwark', [core(), right()]);
    giveStatus(h.girls[0]!, 'petrify');
    h.rng.feed(0, 0, 0);
    expect(aimOf(h.poll())).toEqual(['yuna']);
  });
});
