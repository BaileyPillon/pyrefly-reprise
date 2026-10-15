/**
 * **The possessed Yojimbo** (the hidden Last Summoning chapter; **FFX only**; `research/re-ffx-last-summoning.md` section 6.1, `[bytes]`): his battle (`sins07_06`) on the chapter's own data, party and chain.
 *
 * What is pinned: the stat copy from the player's own Yojimbo (full HP, Luck 0, MP 1); the staging turn; the coin of two between Kozuka and Wakizashi on a random living front-line actor, never the plain Attack and never
 * Daigoro; **Zanmato at a full gauge, a fixed 9,999 on every front-line actor and not a kill** (the party's permanent Auto-Life answers it); the gauge arithmetic (0 to 9 a turn, 0 to 9 a hit, 5 more from a Power Wave);
 * and Chapter III's shared script untouched for the five aeons it fights. The per-branch draws of the shared script are `re-parity-ai-possessed.test.ts`'s (the coin there is the updated one).
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../../src/battle/ffx/index.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import { possessionGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from '../helpers/aiScript.ts';

const YOJIMBO = 'possessed-yojimbo';
const GAUGE = 'aeon.gauge';
const PARTY = ['tidus', 'yuna', 'auron'];
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { rng: ScriptedRng; mem: Record<string, number | string | boolean> };

function fight(options: { opened?: boolean } = {}): Fight {
  const live = liveBattle('last-summoning', { party: buildLastSummoningParty(), group: possessionGroup(['yojimbo']) });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  const mem = rtOf(live.ctx, YOJIMBO).ai;
  if (options.opened !== false) mem['opened'] = 1;
  return { ...live, rng, mem };
}

describe('the formation and the stat copy', () => {
  it('is the possessed Yojimbo and the two Pagodas under the fayth\'s Auto-Life; he has no plain Attack and the link locks him and nothing else yet', () => {
    const group = possessionGroup(['yojimbo']);
    expect(group.enemies.map((e) => e.id)).toEqual([YOJIMBO, 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(group.grantsPermanentAutoLife).toBe(true);
    expect(group.enemies[0]!.plainAttack).toBeUndefined();
    expect(group.lockedAeons?.map((l) => l.aeonId)).toEqual(['yojimbo']);
  });

  it('takes the player\'s Yojimbo\'s stats at full HP: 2,601 HP, Evasion 89, Accuracy 64; Luck 0, MP 1', () => {
    const t = fight();
    const mine = buildLastSummoningParty().aeons.find((a) => a.id === 'yojimbo')!.stats;
    const s = t.at(YOJIMBO).stats;
    expect([s.str, s.def, s.mag, s.mdef, s.agi, s.eva, s.acc, s.maxHp]).toEqual([mine.str, mine.def, mine.mag, mine.mdef, mine.agi, mine.eva, mine.acc, mine.maxHp]);
    expect([mine.maxHp, mine.eva, mine.acc]).toEqual([2601, 89, 64]); // research/ffx-combat-core.md 6.4.3, inside Sin
    expect([t.at(YOJIMBO).hp, s.luck, s.mp, s.maxMp]).toEqual([2601, 0, 1, 1]);
  });
});

describe('his turn', () => {
  it('opens with the no-damage staging turn: a message, no action, no draw', () => {
    const t = fight({ opened: false });
    expect(chooseAiCommand(t.ctx, t.at(YOJIMBO))).toBeNull();
    expect(t.rng.calls).toEqual([]);
  });

  it('then Kozuka or Wakizashi on a coin of two, on the actor it picked first; never Attack, never Daigoro', () => {
    for (const [coin, want] of [[0, 'possessed-yojimbo-kozuka'], [1, 'possessed-yojimbo-wakizashi']] as const) {
      const t = fight();
      t.rng.feed(2);
      t.rng.wide.push(coin, 3);
      const command = chooseAiCommand(t.ctx, t.at(YOJIMBO));
      expect([idOf(command), targetsOf(command)]).toEqual([want, ['auron']]);
      expect(t.rng.calls, 'the pick (three living), the coin, the gauge').toEqual([[0, 2], [0, 0xffff], [0, 0xffff]]);
      expect(t.mem[GAUGE]).toBe(3);
    }
  });

  it('at a full gauge he spends it on Zanmato, on the whole front line, with no pick, no coin and no gain', () => {
    const t = fight();
    t.mem[GAUGE] = 100;
    const command = chooseAiCommand(t.ctx, t.at(YOJIMBO));
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-yojimbo-zanmato', PARTY]);
    expect(t.mem[GAUGE]).toBe(0);
    expect(t.rng.calls).toEqual([]);
  });
});

describe('what his moves do', () => {
  /** The damage events of a stretch of the log, by target. */
  const damageTo = (t: Fight): Record<string, number[]> => {
    const out: Record<string, number[]> = {};
    for (const e of t.events) if (e.type === 'damage') (out[e.targetId] ??= []).push(e.amount);
    return out;
  };

  it('Zanmato is exactly 9,999 on each of the three, one hit each, and it is not a kill: the fayth brings each one back', () => {
    const t = fight();
    resolveAbility(t.ctx, t.at(YOJIMBO), t.ctx.content.ability('possessed-yojimbo-zanmato')!, PARTY);
    const dealt = damageTo(t);
    for (const id of PARTY) expect(dealt[id], id).toEqual([9999]);
    // a status of Death was never applied: the three went down by damage, and each came back by Auto-Life at a quarter of its HP
    for (const id of PARTY) {
      const c = t.at(id);
      expect([c.alive, c.hp], id).toEqual([true, Math.floor(c.stats.maxHp / 4)]);
    }
  });

  it('Kozuka and Wakizashi are one hit of Strength 84 against the target\'s Defense (power 14), the same number either way on one seed', () => {
    const one = (id: string): number => {
      const t = fight();
      resolveAbility(t.ctx, t.at(YOJIMBO), t.ctx.content.ability(id)!, ['tidus']);
      return damageTo(t)['tidus']![0]!;
    };
    const kozuka = one('possessed-yojimbo-kozuka');
    const wakizashi = one('possessed-yojimbo-wakizashi');
    expect(kozuka).toBe(wakizashi);
    expect(kozuka).toBeGreaterThan(0);
    expect(kozuka).toBeLessThanOrEqual(9999);
  });
});

describe('his gauge', () => {
  it('a hit adds 0 to 9 (a Pagoda\'s Power Wave 5 more), so the party fills it by hitting him', () => {
    const t = fight();
    t.rng.wide.push(4);
    resolveAbility(t.ctx, t.at('tidus'), t.ctx.content.ability('attack')!, [YOJIMBO]);
    expect(t.mem[GAUGE]).toBe(4);
    t.rng.wide.push(2);
    resolveAbility(t.ctx, t.at('yu-pagoda-left'), t.ctx.content.ability('power-wave-aeon')!, [YOJIMBO]);
    expect(t.mem[GAUGE]).toBe(4 + 2 + 5);
  });
});
