/**
 * **Yu Yevon follows his own script** (re-parity, AI lane B; FFX only; Chapter III, link 7).
 *
 * The decision tables are `research/re-ffx-ai-yunalesca-bfa.md` section 6 (m176 in `sins07_10`); the engine rules they rely
 * on are section 1.1 (`onHit` once per target per sub-action, before the death check), 1.4 (a scripted group hits exactly
 * the actors in its mask) and 1.6 (`LastDamageTakenHP`). Rows V1 to V5 of the note's section 9:
 *
 *   V1 only his very first turn is idle: Gravija follows every turn, not every other
 *   V2 Gravija's group is the front line plus himself; his Pagodas are not in it
 *   V3 Osmose is one single-target action on each of Character #1 to #3 who is alive, then Ultima on the next turn
 *   V4 a counter follows every sub-action that dealt him HP damage, whoever dealt it but himself (a Doublecast is two)
 *   V5 a Pagoda's Power Wave on a Zombie Yu Yevon is 1,500 damage: it counts, and the Curaga it draws heals him
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { chooseAiCommand, dealDamage, resolveAbility } from '../../src/battle/ffx/index.ts';
import { drainReactions } from '../../src/battle/ffx/hit-hooks.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const BOSS = 'yu-yevon';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);
const PARTY = ['tidus', 'yuna', 'auron'];
const COUNTER = 'yy.curagaCount';

type Fight = LiveBattle & { boss: FFXCombatant; rng: ScriptedRng; mem: Record<string, number | string | boolean> };

function fight(): Fight {
  const live = liveBattle(BOSS);
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, boss: live.at(BOSS), rng, mem: rtOf(live.ctx, BOSS).ai };
}

/** One attack from Tidus that damages him. */
const swing = (t: Fight, who = 'tidus'): void => void resolveAbility(t.ctx, t.at(who), t.ctx.content.ability('attack')!, [BOSS]);

/** The `damage` events since `from`, as target ids. */
const damaged = (events: readonly BattleEvent[], from = 0): string[] => [
  ...new Set(events.slice(from).filter((e) => e.type === 'damage').map((e) => (e.type === 'damage' ? e.targetId : ''))),
];

describe('his turn (V1 to V3; m176 f2 @0x0107)', () => {
  it('lets his very first turn pass with nothing queued, then casts Gravija on every turn after it (V1)', () => {
    const t = fight();
    expect(chooseAiCommand(t.ctx, t.boss)).toBeNull();
    for (let i = 0; i < 6; i++) expect(idOf(chooseAiCommand(t.ctx, t.boss)), `turn ${i + 2}`).toBe('gravija');
    expect(t.rng.calls, 'his turn rolls nothing').toEqual([]);
  });

  it('aims Gravija at the front line and himself (V2)', () => {
    const t = fight();
    chooseAiCommand(t.ctx, t.boss);
    expect(targetsOf(chooseAiCommand(t.ctx, t.boss))).toEqual([...PARTY, BOSS]);
  });

  it('hurts exactly that group when it resolves: the party and Yu Yevon, not his Pagodas (V2)', () => {
    const t = fight();
    const gravija = t.ctx.content.ability('gravija')!;
    resolveAbility(t.ctx, t.boss, gravija, [...PARTY, BOSS]);
    expect(damaged(t.events).sort()).toEqual([...PARTY, BOSS].sort());
    for (const pagoda of ['yu-pagoda-left', 'yu-pagoda-right']) expect(t.at(pagoda).hp, pagoda).toBe(5_000);
  });

  it('casts Osmose on the seventh counter’s next turn: one action at each of Character #1 to #3 who is alive (V3)', () => {
    const t = fight();
    chooseAiCommand(t.ctx, t.boss);
    t.mem[COUNTER] = 6;
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'six is not enough').toBe('gravija');
    t.mem[COUNTER] = 7;
    t.at('auron').alive = false;
    const osmose = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(osmose), targetsOf(osmose)]).toEqual(['osmose', ['tidus', 'yuna']]);
  });

  it('resolves that Osmose on each of the three, one after another, and nobody else', () => {
    const t = fight();
    const osmose = t.ctx.content.ability('osmose')!;
    resolveAbility(t.ctx, t.boss, osmose, PARTY);
    const drained = t.events.filter((e) => e.type === 'mp-damage').map((e) => (e.type === 'mp-damage' ? e.targetId : ''));
    expect(drained).toEqual(PARTY);
  });

  it('then casts Ultima on the front line and starts counting again from 0; counters in between are wasted (V3)', () => {
    const t = fight();
    chooseAiCommand(t.ctx, t.boss);
    t.mem[COUNTER] = 7;
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('osmose');
    for (let i = 0; i < 3; i++) swing(t); // counters between the Osmose turn and the Ultima turn
    expect(t.mem[COUNTER]).toBe(10);
    const ultima = chooseAiCommand(t.ctx, t.boss);
    expect([idOf(ultima), targetsOf(ultima)]).toEqual(['ultima', PARTY]);
    expect(t.mem[COUNTER], 'only the Ultima turn resets it').toBe(0);
    expect(idOf(chooseAiCommand(t.ctx, t.boss)), 'and the turn after is Gravija again').toBe('gravija');
  });

  it('reaches the Osmose after exactly seven damaging actions, through real hits', () => {
    const t = fight();
    chooseAiCommand(t.ctx, t.boss);
    for (let i = 0; i < 6; i++) swing(t);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('gravija');
    swing(t);
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('osmose');
  });
});

describe('his reaction (V4, V5; m176 f3 @0x01AF)', () => {
  const reactions = (t: Fight) => t.ctx.rt.reactions ?? [];

  it('answers an action that damaged him with a Curaga on himself, and counts it', () => {
    const t = fight();
    swing(t);
    expect(reactions(t)).toHaveLength(1);
    const [reaction] = reactions(t);
    expect([reaction?.actorId, reaction?.targetId, reaction ? idOf(reaction.command) : '', reaction ? targetsOf(reaction.command) : []]).toEqual([BOSS, BOSS, 'curaga', [BOSS]]);
    expect(t.mem[COUNTER]).toBe(1);
  });

  it('counts one per action, not per hit: a twelve-hit action is one counter', () => {
    const t = fight();
    const volley = ability({ id: 'volley', name: 'volley', category: 'skill', formula: 'fixed-no-variance', power: 1, damageType: 'physical', hits: 12, canMiss: false, targeting: 'single-enemy' });
    resolveAbility(t.ctx, t.at('tidus'), volley, [BOSS]);
    expect(t.mem[COUNTER]).toBe(1);
    expect(reactions(t)).toHaveLength(1);
  });

  it('ignores a heal, a miss and a hit that did 0, and never answers his own Gravija or a Curaga', () => {
    const t = fight();
    t.boss.hp = 50_000;
    resolveAbility(t.ctx, t.at('yuna'), t.ctx.content.ability('cure')!, [BOSS]);
    expect(t.mem[COUNTER], 'a heal is negative damage').toBeUndefined();

    resolveAbility(t.ctx, t.at('tidus'), ability({ id: 'poke', name: 'poke', category: 'skill', targeting: 'single-enemy', canMiss: false }), [BOSS]);
    expect(t.mem[COUNTER], 'nothing was dealt').toBeUndefined();

    resolveAbility(t.ctx, t.boss, t.ctx.content.ability('gravija')!, [...PARTY, BOSS]);
    resolveAbility(t.ctx, t.boss, t.ctx.content.ability('curaga')!, [BOSS]);
    expect(t.mem[COUNTER], 'his own actions, whatever they do to him').toBeUndefined();
    expect(reactions(t)).toHaveLength(0);
  });

  it('answers nothing that did not come through a hit event: a Poison tick is a plain damage', () => {
    const t = fight();
    dealDamage(t.ctx, t.boss, 9_999, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    expect(t.mem[COUNTER]).toBeUndefined();
    expect(reactions(t)).toHaveLength(0);
  });

  it('counts a Doublecast as two actions (two sub-actions, two hit events)', () => {
    const t = fight();
    const doublecast = ability({
      id: 'doublecast-test', name: 'Doublecast', category: 'skill', targeting: 'self', hits: 0, canMiss: false,
      extra: { castsTwoBlackMagicSpells: true },
    });
    const bolt: AbilityDef = ability({
      id: 'bolt-test', name: 'Bolt', category: 'blackmagic', formula: 'fixed-no-variance', power: 10, damageType: 'magical',
      targeting: 'single-enemy', canMiss: false,
    });
    t.ctx.content.addAbilities([doublecast, bolt]);
    t.at('tidus').learnedAbilityIds.push('bolt-test');
    executeCommand(t.ctx, t.at('tidus'), { kind: 'ability', id: 'doublecast-test', targets: [BOSS], wrappedId: 'bolt-test' }, true);
    expect(t.mem[COUNTER]).toBe(2);
    expect(reactions(t)).toHaveLength(2);
  });

  it('still counts when he cannot answer (the queue refuses him, the counter has already gone up)', () => {
    const t = fight();
    t.boss.statuses['threaten'] = { id: 'threaten', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    swing(t);
    expect(t.mem[COUNTER]).toBe(1);
    expect(reactions(t)).toHaveLength(0);
  });

  it('a Pagoda’s Power Wave strips his Reflect; on a healthy Yu Yevon it heals and is not counted', () => {
    const t = fight();
    t.boss.hp = 40_000;
    t.boss.statuses['reflect'] = { id: 'reflect', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    resolveAbility(t.ctx, t.at('yu-pagoda-left'), t.ctx.content.ability('power-wave-aeon')!, [BOSS]);
    expect(t.boss.statuses['reflect'], 'Reflect stripped').toBeUndefined();
    expect(t.boss.hp, 'and the heal landed').toBe(41_500);
    expect(t.mem[COUNTER], 'a heal does not count').toBeUndefined();
  });

  it('on a Zombie Yu Yevon the same Power Wave is 1,500 damage: it counts, and the Curaga it draws then heals him (V5)', () => {
    const t = fight();
    t.boss.hp = 40_000;
    t.boss.statuses['zombie'] = { id: 'zombie', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    resolveAbility(t.ctx, t.at('yu-pagoda-left'), t.ctx.content.ability('power-wave-aeon')!, [BOSS]);
    expect(t.boss.hp, 'the heal was inverted into damage').toBe(38_500);
    expect(t.boss.statuses['zombie'], 'and the Zombie is stripped by his own hook').toBeUndefined();
    expect(t.mem[COUNTER]).toBe(1);
    const [reaction] = drainReactions(t.ctx);
    expect(reaction && idOf(reaction.command)).toBe('curaga');
    t.ctx.rt.inReaction = true;
    executeCommand(t.ctx, t.boss, reaction!.command, true);
    expect(t.boss.hp, 'Zombie gone, so the Curaga heals').toBeGreaterThan(38_500);
  });
});
