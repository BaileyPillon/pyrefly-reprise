/**
 * **Yunalesca follows her own script** (re-parity, AI lane B; FFX only; Chapter II).
 *
 * The decision tables are `research/re-ffx-ai-yunalesca-bfa.md` section 2 (m130 in `dome06_00`); the engine rule they rely on is
 * section 1.1, `onHit` once per target per sub-action before the death check. Rows Y1 to Y6 of the note's section 9:
 *
 *   Y1 Form II's counter advances on aeon turns   Y2 target picks draw only with two or more candidates, ties are drawn
 *   Y3 Form I counters by the command's damage type (a command that is both gets nothing)
 *   Y4 the Form I gate reads her own last target, Tidus before she has picked anyone
 *   Y5 a counter follows every sub-action that reached her, missed or for 0 included
 *   Y6 a Doublecast whose first cast ends a form loses its second
 *
 * Plus the tallies the note's interpreter produced (Form II heals 40% of the time with one Zombie; the exact figure from all
 * 65,536 draws), the front-line targets of her anti-aeon moves, and the multi-hit rule (a form's leftover hits are discarded).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import {
  advanceForm,
  aiContextFor,
  chooseAiCommand,
  dismissAeon,
  registerHitScript,
  resolveAbility,
  summonAeon,
} from '../../src/battle/ffx/index.ts';
import { yunalescaCounter } from '../../src/battle/ffx/ai/index.ts';
import { damageTypeOf } from '../../src/battle/ffx/ai/hit-script.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, groupOf, liveBattle, queuedCounters } from './helpers/aiScript.ts';
import { giveStatus } from './helpers/ffxStatus.ts';

/** A battle in which the boss is in the given form with the entry turn already taken. */
function bossIn(form: number): LiveBattle & { mem: Record<string, number | string | boolean>; boss: FFXCombatant; rng: ScriptedRng } {
  const live = liveBattle('yunalesca');
  const boss = live.at('yunalesca');
  for (let i = 0; i < form; i++) advanceForm(live.ctx, boss);
  const mem = live.ctx.rt.actors.get('yunalesca')!.ai;
  mem['priv002C'] = 0; // the entry turn is its own test
  mem['priv0004'] = 0;
  mem['priv0008'] = 0;
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, mem, boss, rng };
}

const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);
const PARTY = ['tidus', 'yuna', 'auron'];

describe('Yunalesca Form I (m130 @0x02A8)', () => {
  it('alternates Dispelling Slap on a random living actor with Absorb on the one with the most HP', () => {
    const t = bossIn(0);
    t.at('tidus').hp = 100;
    t.at('yuna').hp = 900;
    t.at('auron').hp = 500;
    t.rng.feed(2); // the pick: index 2 of the three, in ascending actor order (Tidus, Yuna, Auron)
    const slap = chooseAiCommand(t.ctx, t.boss);
    expect(idOf(slap)).toBe('dispelling-slap');
    expect(targetsOf(slap)).toEqual(['auron']);
    expect(t.rng.calls).toEqual([[0, 2]]);
    expect(t.mem['priv000C']).toBe('auron');

    t.rng.calls.length = 0;
    const absorb = chooseAiCommand(t.ctx, t.boss);
    expect(idOf(absorb)).toBe('absorb');
    expect(targetsOf(absorb)).toEqual(['yuna']);
    expect(t.rng.calls, 'a single actor with the most HP is no draw').toEqual([]);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('dispelling-slap');
  });

  it('draws only with two or more candidates, in ascending actor order, and draws a tie for the most HP (Y2)', () => {
    const t = bossIn(0);
    t.at('tidus').hp = 700;
    t.at('yuna').hp = 100;
    t.at('auron').hp = 700; // Tidus and Auron tie
    t.mem['priv0004'] = 1; // Absorb's turn
    t.rng.feed(1);
    const absorb = chooseAiCommand(t.ctx, t.boss);
    expect(targetsOf(absorb)).toEqual(['auron']);
    expect(t.rng.calls).toEqual([[0, 1]]);

    // KO'd actors are not candidates; one survivor is no draw at all.
    t.at('tidus').alive = false;
    t.at('tidus').statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.at('auron').alive = false;
    t.at('auron').statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.rng.calls.length = 0;
    t.mem['priv0004'] = 0;
    expect(targetsOf(chooseAiCommand(t.ctx, t.boss))).toEqual(['yuna']);
    expect(t.rng.calls).toEqual([]);
  });
});

describe('Yunalesca Form II (m130 @0x02F2)', () => {
  it('heals on the turn after the change with Cura if GetRandomValue mod 100 > 50 (51), else Regen (50)', () => {
    for (const [roll, spell] of [[51, 'cura'], [50, 'regen']] as const) {
      const t = bossIn(1);
      t.rng.feed(0, roll);
      const command = chooseAiCommand(t.ctx, t.boss);
      expect(idOf(command)).toBe(spell);
      expect(targetsOf(command)).toEqual(['tidus']);
      expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff]]);
      expect(t.mem['priv0004'], 'v2 := 1, then the join adds 1').toBe(2);
    }
  });

  it('weighs Hellbiter against a heal as 30 x Zombie slots + 10 percent, target first, spell second (note 2.8)', () => {
    const t = bossIn(1);
    t.mem['priv0004'] = 2;
    giveStatus(t.at('tidus'), 'zombie');
    // One Zombie slot: the heal wins below 40 and Hellbiter from 40.
    t.rng.feed(1, 39, 51);
    const heal = chooseAiCommand(t.ctx, t.boss);
    expect(idOf(heal)).toBe('cura');
    expect(targetsOf(heal)).toEqual(['yuna']);
    t.rng.calls.length = 0;
    t.rng.feed(1, 40);
    const hellbiter = chooseAiCommand(t.ctx, t.boss);
    expect(idOf(hellbiter)).toBe('hellbiter');
    expect(targetsOf(hellbiter), 'Hellbiter is the whole front line').toEqual(PARTY);
    expect(t.rng.calls, 'the target draw is spent even when Hellbiter wins').toEqual([[0, 2], [0, 0xffff]]);
    expect(t.mem['priv0004']).toBe(4);
  });

  it('counts Zombie on the three SLOTS, so a KO’d Zombie still suppresses Hellbiter', () => {
    const t = bossIn(1);
    t.mem['priv0004'] = 2;
    for (const id of PARTY) giveStatus(t.at(id), 'zombie');
    t.at('auron').alive = false;
    t.rng.feed(0, 99, 0); // the highest roll still heals: 99 < 30 x 3 + 10
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('regen');
  });

  it('advances the in-form counter on aeon turns too, so the guaranteed heal is already spent when the aeon leaves (Y1)', () => {
    const t = bossIn(1);
    summonAeon(t.ctx, 'yuna', 'valefor');
    const first = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(first), targetsOf(first), t.mem['priv0008'], t.mem['priv0004']]).toEqual(['absorb', ['valefor'], 255, 1]);
    const second = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(second), targetsOf(second), t.mem['priv0008'], t.mem['priv0004']]).toEqual(['hellbiter', ['valefor'], 0, 2]);
    dismissAeon(t.ctx, 'command');
    t.rng.feed(0, 99); // not 0: a weighted turn, so Hellbiter can come
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('hellbiter');
  });
});

describe('Yunalesca Form III (m130 @0x043A)', () => {
  it('runs weighted, weighted, Mind Blast, weighted, Mega Death; the weight is 20 x Zombie slots + 10', () => {
    const t = bossIn(2);
    const order: string[] = [];
    for (let i = 0; i < 10; i++) {
      t.rng.set(0, 99); // a high roll: Hellbiter on a weighted turn (Mind Blast and Mega Death draw nothing)
      const command = chooseAiCommand(t.ctx, t.boss);
      order.push(idOf(command));
      if (idOf(command) === 'mega-death' || idOf(command) === 'mind-blast') expect(targetsOf(command)).toEqual(PARTY);
    }
    expect(order).toEqual([
      'hellbiter', 'hellbiter', 'mind-blast', 'hellbiter', 'mega-death',
      'hellbiter', 'hellbiter', 'mind-blast', 'hellbiter', 'mega-death',
    ]);
    expect(t.mem['priv0004']).toBe(0);

    giveStatus(t.at('tidus'), 'zombie');
    t.rng.set(0, 29, 51); // one Zombie slot: the heal wins below 30
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('curaga');
    t.rng.set(0, 30);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('hellbiter');
  });

  it('aims the aeon ring at the aeon on the field: Mind Blast with Curse, Absorb, Osmose, Absorb, and leaves v2 alone', () => {
    const t = bossIn(2);
    t.mem['priv0004'] = 4; // a Mega Death is next
    summonAeon(t.ctx, 'yuna', 'shiva');
    const ring = [0, 1, 2, 3, 4].map(() => {
      const command = chooseAiCommand(t.ctx, t.boss);
      return `${idOf(command)}>${targetsOf(command).join(',')}`;
    });
    expect(ring).toEqual([
      'mind-blast-aeon>shiva', 'absorb>shiva', 'osmose>shiva', 'absorb>shiva', 'mind-blast-aeon>shiva',
    ]);
    expect(t.mem['priv0004'], 'postponed, not deleted').toBe(4);
    dismissAeon(t.ctx, 'command');
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('mega-death');
  });
});

describe('the entry turn after a transformation (m130 @0x0210, @0x024B)', () => {
  it('is Metamorphosis then Hellbiter (I to II) or Mega Death (II to III) on the front line, and leaves v2 at 0', () => {
    const t = bossIn(0);
    advanceForm(t.ctx, t.boss);
    expect(t.mem['priv002C']).toBe(1);
    const one = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(one), targetsOf(one), t.mem['priv002C'], t.mem['priv0004']]).toEqual(['hellbiter', PARTY, 0, 0]);
    expect(t.events.some((e) => e.type === 'message' && e.text.includes('Metamorphosis'))).toBe(true);
    t.rng.feed(0, 99);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'the next turn is the guaranteed heal case, v2 = 0').toMatch(/^(cura|regen)$/);

    advanceForm(t.ctx, t.boss);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('mega-death');
  });
});

describe('Yunalesca counters (m130 @0x05EE)', () => {
  const ai = (t: ReturnType<typeof bossIn>) => aiContextFor(t.ctx, t.boss);

  it('Form I: Blind for a physical command, Silence for a magical one, Sleep for neither, nothing for both (Y3)', () => {
    const t = bossIn(0);
    expect(idOf(yunalescaCounter(ai(t), 'auron', 1))).toBe('blind-counter');
    expect(idOf(yunalescaCounter(ai(t), 'auron', 2))).toBe('silence-counter');
    expect(idOf(yunalescaCounter(ai(t), 'auron', 0))).toBe('sleep-counter');
    expect(yunalescaCounter(ai(t), 'auron', 3)).toBeNull();
    expect(targetsOf(yunalescaCounter(ai(t), 'auron', 1))).toEqual(['auron']);
  });

  it('Form I: the gate reads the target she picked last turn, Tidus before she has picked anyone (Y4)', () => {
    const t = bossIn(0);
    giveStatus(t.at('tidus'), 'darkness', { turnsRemaining: 3 });
    expect(yunalescaCounter(ai(t), 'auron', 1), 'Tidus (actor 0) is blind, so no Blind counter').toBeNull();
    expect(idOf(yunalescaCounter(ai(t), 'auron', 2))).toBe('silence-counter');
    t.mem['priv000C'] = 'yuna'; // she last aimed at Yuna, who is not blind
    expect(idOf(yunalescaCounter(ai(t), 'auron', 1))).toBe('blind-counter');
    giveStatus(t.at('yuna'), 'silence', { turnsRemaining: 3 });
    expect(yunalescaCounter(ai(t), 'auron', 2), 'Yuna is silenced').toBeNull();
    expect(idOf(yunalescaCounter(ai(t), 'auron', 0)), 'Sleep has no gate').toBe('sleep-counter');
  });

  it('Form II answers when GetRandomValue mod 100 > 50 (51 of 100, 48.97% in all), Form III always', () => {
    const t = bossIn(1);
    t.rng.feed(51, 50);
    expect(idOf(yunalescaCounter(ai(t), 'auron', 1))).toBe('dispelling-slap');
    expect(yunalescaCounter(ai(t), 'auron', 1)).toBeNull();
    expect(t.rng.calls).toEqual([[0, 0xffff], [0, 0xffff]]);

    const f3 = bossIn(2);
    expect(idOf(yunalescaCounter(aiContextFor(f3.ctx, f3.boss), 'auron', 0))).toBe('dispelling-slap');
    expect(f3.rng.calls).toEqual([]);
  });

  it('reads the damage type from the command’s record: attack is physical, Fire magical, a potion neither', () => {
    const t = bossIn(0);
    const tidus = t.at('tidus');
    const of = (id: string): number => {
      const def = t.ctx.content.ability(id) ?? t.ctx.content.itemEffect(id);
      if (!def) throw new Error(`no ability ${id}`);
      return damageTypeOf(def, tidus);
    };
    expect(of('attack')).toBe(1);
    expect(of('fire')).toBe(2);
    expect(of('potion')).toBe(0);
  });
});

describe('Yunalesca’s onHit through the engine (hit events)', () => {
  /** A physical volley of `hits` blows of 9,999, to take a form down in one action. */
  function volley(hits: number, id = 'big-volley'): AbilityDef {
    return ability({
      id, name: id, category: 'skill', formula: 'fixed-no-variance', power: 200, damageType: 'physical',
      hits, canMiss: false, targeting: 'single-enemy',
    });
  }

  it('counters a hit that damages her, queued at the attacker and answered after the action (Y5)', () => {
    const t = bossIn(0);
    t.rng.feed(0);
    resolveAbility(t.ctx, t.at('tidus'), t.ctx.content.ability('attack')!, ['yunalesca']);
    expect(queuedCounters(t.ctx)).toHaveLength(1);
    const [reaction] = queuedCounters(t.ctx);
    expect([reaction?.actorId, reaction?.targetId, reaction ? idOf(reaction.command) : '']).toEqual(['yunalesca', 'tidus', 'blind-counter']);
  });

  it('counters a hit that misses and a hit that does nothing, which the damage-event collector never saw (Y5)', () => {
    const missed = bossIn(0);
    giveStatus(missed.at('auron'), 'darkness', { turnsRemaining: 3 });
    missed.rng.feed(100, 100, 100); // every percent roll 100: the Darkness-reduced chance never gets there
    resolveAbility(missed.ctx, missed.at('auron'), missed.ctx.content.ability('attack')!, ['yunalesca']);
    expect(missed.events.some((e) => e.type === 'miss')).toBe(true);
    expect(missed.events.some((e) => e.type === 'damage')).toBe(false);
    expect(queuedCounters(missed.ctx).map((r) => idOf(r.command))).toEqual(['blind-counter']);

    const nothing = bossIn(0);
    const status = ability({ id: 'poke', name: 'poke', category: 'skill', targeting: 'single-enemy', canMiss: false });
    resolveAbility(nothing.ctx, nothing.at('yuna'), status, ['yunalesca']);
    expect(queuedCounters(nothing.ctx).map((r) => idOf(r.command))).toEqual(['sleep-counter']);
  });

  it('queues nothing for her own action, while a reaction is resolving, or when she cannot act', () => {
    const own = bossIn(0);
    resolveAbility(own.ctx, own.boss, own.ctx.content.ability('cura')!, ['yunalesca']);
    expect(queuedCounters(own.ctx)).toEqual([]);

    const chained = bossIn(0);
    chained.ctx.rt.inReaction = true;
    resolveAbility(chained.ctx, chained.at('tidus'), chained.ctx.content.ability('attack')!, ['yunalesca']);
    expect(queuedCounters(chained.ctx)).toEqual([]);

    const stopped = bossIn(0);
    stopped.boss.statuses['threaten'] = { id: 'threaten', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    resolveAbility(stopped.ctx, stopped.at('tidus'), stopped.ctx.content.ability('attack')!, ['yunalesca']);
    expect(queuedCounters(stopped.ctx)).toEqual([]);
  });

  it('discards the rest of a multi-hit action when a form falls, and changes form once, after the last hit', () => {
    const t = bossIn(0);
    resolveAbility(t.ctx, t.at('tidus'), volley(12), ['yunalesca']);
    expect(t.boss.enemy?.formIndex).toBe(1);
    expect(t.boss.hp, 'the next form arrives whole, not short by the leftover hits').toBe(48000);
    expect(t.boss.stats.maxHp).toBe(48000);
    const hits = t.events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === 'yunalesca');
    expect(hits).toHaveLength(12);
    const changes = t.events.filter((e) => e.type === 'form-change');
    expect(changes).toHaveLength(1);
    expect(changes[0]!.seq).toBeGreaterThan(hits[11]!.seq);
    expect(queuedCounters(t.ctx), 'the blow that ends a form is not countered').toEqual([]);
  });

  it('kills her for real when the last form falls, after the action’s hits (the hook leaves 0 HP alone)', () => {
    const t = bossIn(2);
    t.boss.hp = 5000;
    const before = t.events.length;
    resolveAbility(t.ctx, t.at('tidus'), volley(3), ['yunalesca']);
    expect([t.boss.alive, t.boss.hp]).toEqual([false, 0]);
    const during = t.events.slice(before);
    expect(during.filter((e) => e.type === 'damage' || e.type === 'ko').map((e) => e.type)).toEqual(['damage', 'damage', 'damage', 'ko']);
    expect(during.some((e) => e.type === 'form-change')).toBe(false);
  });

  it('cancels the second cast of a Doublecast when the first ends a form, and lets it land otherwise (Y6)', () => {
    const doublecast = ability({
      id: 'doublecast-test', name: 'Doublecast', category: 'skill', targeting: 'self', hits: 0, canMiss: false,
      extra: { castsTwoBlackMagicSpells: true },
    });
    const bolt = ability({
      id: 'bolt-test', name: 'Bolt', category: 'blackmagic', formula: 'fixed-no-variance', power: 200, damageType: 'magical',
      targeting: 'single-enemy', canMiss: false,
    });
    const cast = (hp: number): { hits: number; formIndex: number; hp: number } => {
      const t = bossIn(0);
      t.ctx.content.addAbilities([doublecast, bolt]);
      t.at('tidus').learnedAbilityIds.push('bolt-test');
      t.boss.hp = hp;
      executeCommand(t.ctx, t.at('tidus'), { kind: 'ability', id: 'doublecast-test', targets: ['yunalesca'], wrappedId: 'bolt-test' }, true);
      const hits = t.events.filter((e) => e.type === 'damage' && e.targetId === 'yunalesca').length;
      return { hits, formIndex: t.boss.enemy?.formIndex ?? -1, hp: t.boss.hp };
    };
    expect(cast(5000), 'the first cast ends Form I, the second is cancelled').toEqual({ hits: 1, formIndex: 1, hp: 48000 });
    expect(cast(20000), 'a first cast that leaves her standing is followed by the second').toEqual({ hits: 2, formIndex: 0, hp: 20000 - 2 * 9999 });
  });

  it('hands a hook LastDamageTakenHP with the overkill, a miss as 0 and a heal as negative', () => {
    registerHitScript('test-last-damage', (event) => {
      seen.push([event.lastDamage, event.affectsHp ? 1 : 0]);
    });
    const seen: Array<[number, number]> = [];
    const group = groupOf('yunalesca');
    const enemy = group.enemies[0]!;
    enemy.forms = [{ name: 'Dummy', spriteKey: 'yunalesca-1', hp: 100, aiScriptId: 'test-last-damage' }];
    enemy.aiScriptId = 'test-last-damage';
    enemy.hp = 100;
    enemy.stats = { ...enemy.stats, hp: 100, maxHp: 100 };
    const t = liveBattle('yunalesca', { group });
    resolveAbility(t.ctx, t.at('tidus'), volley(2), ['yunalesca']);
    expect(seen.pop()).toEqual([2 * 9999, 1]);
    const dummy = t.at('yunalesca');
    dummy.hp = 40;
    dummy.alive = true;
    delete dummy.statuses['ko'];
    resolveAbility(t.ctx, t.at('yuna'), t.ctx.content.ability('cure')!, ['yunalesca']);
    const [healed] = seen;
    expect(healed![0]).toBeLessThan(0);
    expect(healed![1]).toBe(1);
  });
});

describe('the interpreter’s tallies and the exact odds of the weighted step', () => {
  /** How often the weighted step of a form heals, over all 65,536 values of the 16-bit draw. */
  function healShare(form: 1 | 2, zombies: number): number {
    const t = bossIn(form);
    for (const id of PARTY.slice(0, zombies)) giveStatus(t.at(id), 'zombie');
    const first = form === 1 ? 2 : 0; // a weighted turn
    let heals = 0;
    for (let r = 0; r <= 0xffff; r++) {
      t.mem['priv0004'] = first;
      t.mem['priv0008'] = 0;
      t.rng.set(0, r, 51);
      if (idOf(chooseAiCommand(t.ctx, t.boss)) !== 'hellbiter') heals += 1;
    }
    return heals / 65536;
  }

  it('Form II heals 10.01, 40.03, 70.02 and 100 percent with 0 to 3 Zombie slots (all 65,536 draws)', () => {
    const shares = [0, 1, 2, 3].map((z) => healShare(1, z));
    expect(shares.map((s) => Math.round(s * 10000) / 100)).toEqual([10.01, 40.03, 70.02, 100]);
  });

  it('Form III heals 10.01, 30.03, 50.03 and 70.02 percent', () => {
    const shares = [0, 1, 2, 3].map((z) => healShare(2, z));
    expect(shares.map((s) => Math.round(s * 10000) / 100)).toEqual([10.01, 30.03, 50.03, 70.02]);
  });

  it('reproduces the interpreter’s Form II tally with one Zombie (40.31 percent, exact 40.03) on the engine’s own stream', () => {
    const t = bossIn(1);
    giveStatus(t.at('tidus'), 'zombie');
    t.ctx.rng = new SeededRng(20261008);
    const n = 40000;
    let heals = 0;
    for (let i = 0; i < n; i++) {
      t.mem['priv0004'] = 2;
      if (idOf(chooseAiCommand(t.ctx, t.boss)) !== 'hellbiter') heals += 1;
    }
    const share = heals / n;
    const sigma = Math.sqrt((0.4003 * 0.5997) / n);
    expect(Math.abs(share - 0.4003)).toBeLessThan(4 * sigma);
    expect(Math.abs(share - 0.4031)).toBeLessThan(4 * sigma + 0.0028); // the note’s tally is itself a sample
  });
});
