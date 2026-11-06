/**
 * **The six other Dark Aeons' Overdrives on the real engine** (FFX only; the hidden Dark Aeons chapter): the second half of the T0 checks of `docs/plans/ch-dark-aeons-review.md`, split from
 * `./dark-aeons-six-engine.test.ts` for the 400-line house rule. Each Overdrive is a clock (a KO on a person; Auto-Life or an aeon is the answer; Aerospark and Dark Shiva's Attack take Auto-Life away, the
 * rest leave it), and nothing of the chapter touches any other formation.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, FFXCombatant } from '../../../src/battle/common/types.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_ROWS as ROW } from '../../../src/data/ffx/enemies/dark-aeons-six-abilities.ts';
import { DARK_SIX_LINKS, type DarkSixKey } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import * as H from '../helpers/darkAeonsDrive.ts';

const BOSS: Record<DarkSixKey, string> = { valefor: 'dark-valefor', ifrit: 'dark-ifrit', 'ixion-1': 'dark-ixion', 'ixion-2': 'dark-ixion-2', shiva: 'dark-shiva', anima: 'dark-anima', bahamut: 'dark-bahamut' };

const boss = (e: BattleEngine, key: DarkSixKey): FFXCombatant => H.actor(e, BOSS[key]);

describe('the Overdrives are the clocks (T0): each KOs a 9,999-HP person; Auto-Life or an aeon is the answer; Aerospark and Dark Shiva\'s Attack take Auto-Life away, the rest leave it', () => {
  /** Gauge 100, the party defends until the aeon acts; the damage each member took from that one action. */
  function overdriveOn(key: DarkSixKey, party = darkAeonsBuild, seed = 11, defended = true): { damage: Record<string, number>; engine: BattleEngine; row: string } {
    const engine = H.newEngine(seed, key, party);
    boss(engine, key).overdrive!.gauge = 100;
    const isOverdrive = (a: string): boolean => a !== ROW.ifritAttack && a !== ROW.ixionAttack1;
    for (let i = 0; i < 60; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit(defended ? H.defend() : (H.row(d, 'item', 'hi-potion', d.actorId) ?? H.defend())); // a Hi-Potion on oneself: an action that is neither a defence nor a blow on the aeon
      if (H.actions(H.log(engine), BOSS[key]).some(isOverdrive)) break;
    }
    const events = H.log(engine);
    const startIdx = events.findIndex((e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === BOSS[key] && isOverdrive((e as { abilityId?: string }).abilityId ?? ''));
    const damage: Record<string, number> = {};
    for (const e of events.slice(startIdx + 1)) {
      if (e.type === 'action-end') break;
      if (e.type === 'damage') damage[e.targetId] = (damage[e.targetId] ?? 0) + e.amount;
    }
    return { damage, engine, row: H.actions(events, BOSS[key]).find(isOverdrive) ?? '' };
  }

  it('every group Overdrive is at least a KO on a person (9,999 or more to each member of the front line, undefended); Aerospark, which picks one, does about half of its 12,252 through Auto-Protect: no KO on its own', () => {
    for (const link of DARK_SIX_LINKS) {
      const { damage, row } = overdriveOn(link.key, darkAeonsBuild, 11, false);
      const people = Object.entries(damage).filter(([id]) => ['tidus', 'yuna', 'auron'].includes(id));
      if (link.key === 'ixion-1') {
        expect(row).toBe(ROW.aerospark);
        expect(people).toHaveLength(1);
        expect(people[0]![1], 'Aerospark through Auto-Protect').toBeGreaterThan(4_000);
        expect(people[0]![1]).toBeLessThan(9_999);
        continue;
      }
      expect(people.length, `${link.key} ${row}`).toBe(3);
      for (const [id, d] of people) expect(d, `${link.key} ${row} on ${id}`).toBeGreaterThanOrEqual(9_999);
    }
  });

  it('with no Auto-Life and nobody left to rescue (Auto-Phoenix needs a living holder), a group Overdrive is the end of the battle', () => {
    const { engine } = overdriveOn('shiva');
    expect(engine.nextDecision().kind).toBe('battle-over');
  });

  it('Mega Flare, Oblivion, Diamond Dust and Thor\'s Hammer leave Auto-Life: a party with Auto-Life on all three stands up again (the cast Auto-Life is spent, the battle goes on)', () => {
    for (const key of ['bahamut', 'anima', 'shiva', 'ixion-2'] as const) {
      const engine = H.newEngine(12, key);
      for (const id of ['tidus', 'yuna', 'auron']) {
        const a = H.actor(engine, id);
        a.statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
      }
      boss(engine, key).overdrive!.gauge = 100;
      let revived = 0;
      for (let i = 0; i < 60 && H.actions(H.log(engine), BOSS[key]).length === 0; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(H.defend());
      }
      for (const e of H.log(engine) as Array<BattleEvent & { cause?: string }>) if (e.type === 'revive' && e.cause === 'auto-life') revived++;
      expect(revived, `${key}: all three came back`).toBe(3);
      expect(engine.nextDecision().kind, key).not.toBe('battle-over');
    }
  });

  it('Dark Shiva\'s plain Attack and Aerospark strip Auto-Life from the one they hit', () => {
    for (const [key, row] of [['shiva', ROW.shivaAttack], ['ixion-1', ROW.aerospark]] as const) {
      const engine = H.newEngine(13, key);
      for (const id of ['tidus', 'yuna', 'auron']) H.actor(engine, id).statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
      if (key === 'ixion-1') boss(engine, key).overdrive!.gauge = 100;
      let acted = false;
      for (let i = 0; i < 80 && !acted; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(H.defend());
        acted = H.actions(H.log(engine), BOSS[key]).includes(row);
      }
      expect(acted, `${key} used ${row}`).toBe(true);
      const hitIds = (H.log(engine) as Array<Extract<BattleEvent, { type: 'action-start' }>>).filter((e) => e.type === 'action-start' && e.abilityId === row).flatMap((e) => e.targets);
      const stripped = hitIds.filter((id) => H.actor(engine, id).statuses['auto-life'] === undefined);
      expect(stripped.length, `${key}: the target lost Auto-Life`).toBeGreaterThan(0);
    }
  });
});

describe('absence (T6): nothing of the chapter touches any other formation', () => {
  it("Mirror Aeons' Dark Yojimbo keeps his own gauge tag and queues none of these rows; the Spectral Keeper and a Sisters formation carry none of the six's set-up", () => {
    const yojimbo = H.engineOnGroup('mirror-yojimbo-nagi05_71', 1);
    expect(H.actor(yojimbo, 'dark-yojimbo').overdrive?.enemyGaugeRules).toBe('dark-aeons');
    for (let i = 0; i < 12; i++) {
      const d = H.nextInput(yojimbo);
      yojimbo.submit(H.row(d, 'attack', undefined, 'dark-yojimbo') ?? H.defend());
    }
    const abilityIds = ([...H.log(yojimbo)] as Array<{ abilityId?: string }>).flatMap((e) => (typeof e.abilityId === 'string' ? [e.abilityId] : []));
    expect(abilityIds.filter((a) => a.startsWith('dark6-'))).toEqual([]);
    for (const id of ['mirror-sisters-kino01_72', 'spectral-keeper']) {
      const engine = H.engineOnGroup(id, 1);
      for (const enemyId of engine.state().enemyIds) expect(H.actor(engine, enemyId).overdrive?.enemyGaugeRules, id).not.toBe('dark-aeons-six');
    }
  });

  it('is deterministic: the same seed gives the same log, a different seed another', () => {
    const run = (seed: number): string => JSON.stringify(H.playOne(seed, 'ifrit', H.careless, 400).events.map((e) => [e.type, (e as { actorId?: string }).actorId, (e as { abilityId?: string }).abilityId]));
    expect(run(21)).toBe(run(21));
    expect(run(21)).not.toBe(run(22));
  });
});
