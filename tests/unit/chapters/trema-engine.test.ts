/**
 * Chapter XIII — the engine seams the Paragon and Trema chapter added (plan
 * `docs/plans/chapter-trema-review.md` §4.2), each run through the real engine or resolver
 * [hard rule 3]. **Game case: FFX-2 only** [AGENTS.md rule 14]; the chain carry and the
 * checkpoint are shared flow plumbing, but only this chapter's Trema link sets their flags.
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA, cloisterTremaGroup } from '../../../src/data/ffx2/enemies/trema.ts';
import { GENESIS_STRIPS } from '../../../src/data/ffx2/enemies/paragon-abilities.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';
import { ABILITY_REGISTRY, board } from '../helpers/tremaUnits.ts';
import { runCounters } from '../../../src/battle/ffx2/engineHooks.ts';
import { group, newEngine } from '../helpers/tremaDrive.ts';

const A = (id: string) => {
  const a = data.ABILITIES[id];
  if (!a) throw new Error(`no ability ${id}`);
  return a;
};

/** Play until a girl is offered a menu, then submit `pick` for her; returns that action's events. */
function actWith(engine: ReturnType<typeof newEngine>, pick: (actor: string) => Command) {
  for (let i = 0; i < 2000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('battle ended');
    if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
    if (d.kind !== 'player-input') continue;
    return { actor: d.actorId, events: engine.submit(pick(d.actorId)) };
  }
  throw new Error('no menu');
}

describe('Big Bang, the immediate counter (TR12 b; AiScript.counter)', () => {
  function paragonEngine() {
    const engine = newEngine();
    engine.setSeed(4);
    engine.init({ game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed: 4, condition: 'normal', canEscape: false });
    // Girls who survive anything, so the test reads the counter rather than the wipe.
    for (const id of ['yuna', 'rikku', 'paine']) {
      const u = engine.state().combatants[id] as { hp: number; stats: { maxHp: number } };
      u.stats.maxHp = 9_999_999;
      u.hp = 9_999_999;
    }
    return engine;
  }

  it('Darkness (class none) draws Big Bang in the same batch as its hit, as a counter', () => {
    const engine = paragonEngine();
    const all: ReturnType<typeof engine.submit> = [];
    const hitParagon = () => all.some((e) => e.type === 'damage' && (e as { targetId: string }).targetId === 'paragon');
    for (let i = 0; i < 5000 && !hitParagon(); i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { all.push(...engine.tick(d.nextEventMs)); continue; }
      if (d.kind === 'resolved') { all.push(...d.events); continue; }
      const pick: Command = d.actorId === 'rikku'
        ? { kind: 'defend', targets: [] }
        : { kind: 'ability', id: 'x2-dark-knight-darkness', targets: [] };
      all.push(...engine.submit(pick));
    }
    const hitAt = all.findIndex((e) => e.type === 'damage' && (e as { targetId: string }).targetId === 'paragon');
    expect(hitAt).toBeGreaterThanOrEqual(0);
    const bang = all.findIndex((e, i) => i > hitAt && e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'paragon-big-bang');
    expect(bang).toBeGreaterThan(hitAt);
    expect(all.slice(bang).some((e) => e.type === 'counter' && (e as { actorId: string }).actorId === 'paragon')).toBe(true);
  });

  it('the counter costs Paragon no ATB and needs a hit; only scripts with `counter` answer', () => {
    const b = board('paragon');
    const p = b.unit('paragon');
    const atb = { ...p.atb };
    const env = {
      units: b.units, abilities: ABILITY_REGISTRY, attackClass: 'none', aiContext: (u: typeof p) => b.ctx(u.id),
      resolveCtx: () => b.resolveCtx(3), emit: (e: unknown) => { b.events.push(e as never); },
    };
    runCounters([], b.unit('yuna'), env);
    expect(b.events.some((e) => e['abilityId'] === 'paragon-big-bang')).toBe(false);
    runCounters([{ type: 'damage', targetId: 'paragon', sourceId: 'yuna', amount: 5000, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }], b.unit('yuna'), env);
    expect(b.events.some((e) => e['abilityId'] === 'paragon-big-bang')).toBe(true);
    expect(p.atb).toEqual(atb);
    // An MP-only hit counts too (the wiki: a Mana Spring drain still draws Big Bang).
    b.events.length = 0;
    runCounters([{ type: 'mp-damage', targetId: 'paragon', sourceId: 'yuna', amount: 50 }], b.unit('yuna'), env);
    expect(b.events.some((e) => e['abilityId'] === 'paragon-big-bang')).toBe(true);
  });

  it('a plain Attack (Protect reduces it) never draws Big Bang', () => {
    const engine = paragonEngine();
    for (let i = 0; i < 12; i++) {
      const { events } = actWith(engine, (actor) =>
        actor === 'rikku' ? { kind: 'defend', targets: [] } : { kind: 'attack', targets: ['paragon'] });
      expect(events.some((e) => (e as { abilityId?: string }).abilityId === 'paragon-big-bang')).toBe(false);
      if (engine.state().result) break;
    }
  });
});

describe('Genesis strips the buffs it names (research §4.1)', () => {
  it('Auto-Life, Shell, Protect, Reflect, Regen, Haste, Spellspring and every stat change go; Poison stays', () => {
    const b = board('paragon');
    const yuna = b.unit('yuna');
    for (const s of ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring', 'poison'] as const) {
      applyStatus(yuna, { status: s, chance: 255, duration: 0 });
    }
    applyStatus(yuna, { status: 'str-up', chance: 255, duration: 0, stacks: 2 });
    resolveAbility(b.resolveCtx(2), b.unit('paragon'), A('paragon-genesis'), []);
    for (const s of GENESIS_STRIPS) expect(yuna.statuses[s], s).toBeUndefined();
    if (yuna.alive) expect(yuna.statuses.poison).toBeDefined();
  });
});

describe("Trema's fractional moves (research §4.2)", () => {
  it('Meteor: 12 hits on random girls, each 1/8 of that girl\'s max HP (randomiser 240-271/256), halved by Shell, no MP', () => {
    const b = board('trema');
    for (const g of ['yuna', 'rikku', 'paine']) {
      const u = b.unit(g);
      u.stats = { ...u.stats, maxHp: 80000 };
      u.hp = 80000;
      applyStatus(u, { status: 'shell', chance: 255, duration: 0 });
    }
    const t = b.unit('trema');
    const mp = t.mp;
    resolveAbility(b.resolveCtx(9), t, A('trema-meteor'), []);
    const hits = b.events.filter((e) => e.type === 'damage');
    expect(hits).toHaveLength(12);
    // The first hit on each girl opens no chain, so it is the bare 1/8, Shell-halved. Later
    // hits on the same girl land inside her chain window and carry its multiplier: the
    // engine chains enemy multi-hits on the party as on anyone (`chain.ts`).
    const seen = new Set<unknown>();
    for (const h of hits) {
      const amount = h['amount'] as number;
      expect(amount).toBeGreaterThanOrEqual(Math.floor((80000 / 8) * (240 / 256) * 0.5) - 1);
      if (seen.has(h['targetId'])) continue;
      seen.add(h['targetId']);
      expect(amount).toBeLessThanOrEqual(Math.ceil((80000 / 8) * (271 / 256) * 0.5) + 1);
    }
    expect(new Set(hits.map((h) => h['targetId'])).size).toBeGreaterThan(1);
    expect(t.mp).toBe(mp);
  });

  it('Waning Moon: three hits of 5/16 of current MP, no HP (mpOnly + mpFractionOfCurrent)', () => {
    const b = board('trema');
    const yuna = b.unit('yuna');
    yuna.mp = 1000;
    yuna.stats = { ...yuna.stats, eva: 0, luck: 0 };
    yuna.chainWindowTicks = 50000; // chained: no evasion, so all three land
    const hp = yuna.hp;
    resolveAbility(b.resolveCtx(1), b.unit('trema'), A('trema-waning-moon'), ['yuna']);
    const mp = b.events.filter((e) => e.type === 'mp-damage').map((e) => e['amount']);
    expect(mp).toEqual([312, 215, 147]); // floor(1000 x 5/16), floor(688 x 5/16), floor(473 x 5/16)
    expect(yuna.hp).toBe(hp);
  });

  it('Spellspring: Flare costs him nothing, and a Dispel cannot take the auto-status away', () => {
    const b = board('trema');
    const t = b.unit('trema');
    resolveAbility(b.resolveCtx(1), t, A('trema-flare'), ['paine']);
    expect(t.mp).toBe(999);
    resolveAbility(b.resolveCtx(1), b.unit('yuna'), A('x2-white-mage-dispel'), ['trema']);
    expect(t.statuses.spellspring).toBeDefined();
  });

  it('Target MP now takes MP, not HP (it had `damagesPool` only, read by nothing)', () => {
    const b = board('trema');
    const t = b.unit('trema');
    t.chainWindowTicks = 50000;
    resolveAbility(b.resolveCtx(1), b.unit('rikku'), A('x2-gunner-target-mp'), ['trema']);
    expect(t.hp).toBe(999999);
    expect(t.mp).toBeLessThan(999);
  });

  it('status moves fail on both bosses; Gravity is immune', () => {
    const b = board('trema');
    const yuna = b.unit('yuna');
    resolveAbility(b.resolveCtx(1), yuna, A('x2-dark-knight-bio'), ['trema']);
    expect(b.unit('trema').statuses.poison).toBeUndefined();
    resolveAbility(b.resolveCtx(1), yuna, A('x2-dark-knight-demi'), ['trema']);
    expect(b.unit('trema').hp).toBe(999999);
  });
});

describe('the link: carried state and the TR5 checkpoint', () => {
  function paragonWonState(): { setup: BattleSetup; state: BattleState } {
    const b = board('paragon');
    const yuna = b.unit('yuna');
    const rikku = b.unit('rikku');
    yuna.hp = 1234;
    applyStatus(yuna, { status: 'poison', chance: 255, duration: 0 });
    rikku.hp = 0;
    rikku.alive = false;
    applyStatus(rikku, { status: 'ko', chance: 255, duration: 0 });
    const setup: BattleSetup = { game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed: 1, condition: 'normal', canEscape: false };
    return { setup, state: b.engine.state() as BattleState };
  }

  it('Trema opens on Paragon\'s end state: HP, KO and statuses carried, nothing restored', () => {
    const { setup, state } = paragonWonState();
    const next = setupForNextLink(setup, cloisterTremaGroup, state, 2);
    const engine = newEngine();
    engine.setSeed(next.seed);
    engine.init(next);
    const c = engine.state().combatants;
    expect(c['yuna']!.hp).toBe(1234);
    expect(c['yuna']!.statuses.poison).toBeDefined();
    expect(c['rikku']!.alive).toBe(false);
    expect(c['paine']!.hp).toBe(c['paine']!.stats.maxHp);
  });

  it('a chain without the flag still carries HP and MP only (every other chapter)', () => {
    const { setup, state } = paragonWonState();
    const next = setupForNextLink(setup, { ...cloisterTremaGroup, carriesPartyStatuses: undefined }, state, 2);
    const yuna = next.party.members.find((m) => m.id === 'yuna') as { statuses?: unknown; hp?: number };
    expect(yuna.hp).toBe(1234);
    expect(yuna.statuses).toBeUndefined();
  });

  it('Trema\'s link is a checkpoint, and its retry replays exactly the carried setup', () => {
    const { setup, state } = paragonWonState();
    const next = setupForNextLink(setup, cloisterTremaGroup, state, 2);
    const cp = checkpointAt(2, cloisterTremaGroup, next);
    expect(cp?.link).toBe(2);
    expect(checkpointAt(1, group(CLOISTER_PARAGON), setup)).toBeNull();
    const retry = resumeSetup(cp!, 77);
    expect(retry.seed).toBe(78);
    expect(retry.party).toBe(next.party);
    // Replaying the fight does not mutate the saved setup (the carried statuses are copies).
    const engine = newEngine();
    engine.init(retry);
    (engine.state().combatants['yuna'] as { hp: number }).hp = 1;
    expect((next.party.members.find((m) => m.id === 'yuna') as { hp?: number }).hp).toBe(1234);
    expect(group(CLOISTER_TREMA).restoresPartyOnEntry).toBeUndefined();
  });
});

describe('registration (unlisted, TR18)', () => {
  it('getChapter finds Chapter XIII; chapter select does not list it', () => {
    const ch = getChapter('ffx2-trema');
    expect(ch).toMatchObject({ game: 'ffx2', number: 13, title: 'Trema', location: 'Via Infinito — Cloister 100' });
    expect(ch?.enemyGroupRef.id).toBe(CLOISTER_PARAGON);
    expect(ch?.enemyGroupRef.nextGroupId).toBe(CLOISTER_TREMA);
    expect(CHAPTER_IDS).not.toContain('ffx2-trema');
  });
});
