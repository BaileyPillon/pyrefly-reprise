/**
 * Chapter XI — the fallen aeons on the Road to the Farplane (FFX-2): engine,
 * data and AI. Mechanic units pinned to `research/ffx2-fallen-aeons.md` rows
 * (plan `docs/plans/chapter-fallen-aeons-review.md` §9). **Game case: FFX-2
 * only** [AGENTS.md rule 14]; the registration block is the "both" plumbing.
 *
 * Every claim here is run, not grepped [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { FFX2Engine, abilityRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import { resolveAbility, type ResolveContext } from '../../../src/battle/ffx2/resolve.ts';
import { notifyEnemiesTargeted, notifyEnemiesDamaged, payStatusClocks } from '../../../src/battle/ffx2/engineHooks.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { AC, AC_TRIGGER_FLAG } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { DELTA_DISARMED_FLAG } from '../../../src/battle/ffx2/ai/magus-sisters.ts';
import { aiHarness, aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { AiContext, EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import * as ffxData from '../../../src/data/ffx/index.ts';
import {
  FALLEN_AEONS_CHAIN_ORDER,
  ROAD_ANIMA,
  ROAD_SHIVA,
  ROAD_SISTERS,
  x2Anima,
  x2Shiva,
} from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { cindy, mindy, sandy } from '../../../src/data/ffx2/enemies/magus-sisters.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));

function ability(id: string): AbilityDef {
  const found = REGISTRY.get(id);
  if (!found) throw new Error(`${id} missing from the shipped ability table`);
  return found;
}

function ctxFor(units: Ffx2Unit[], seed = 1): { ctx: ResolveContext; events: EventDraft[] } {
  const events: EventDraft[] = [];
  return {
    ctx: { units, abilities: REGISTRY, rng: new SeededRng(seed), emit: (e) => events.push(e), breaksDamageLimit: () => false },
    events,
  };
}

function girlsAt(hp: number, mp: number): Ffx2Unit[] {
  return ['yuna', 'rikku', 'paine'].map((id, i) => {
    const u = aiUnit(id, 'party', 5000, i);
    u.hp = hp;
    u.mp = mp;
    return u;
  });
}

/** A context for one sister, sharing units, rng and flags with the others. */
function sisterCtx(base: AiContext, self: Ffx2Unit): AiContext {
  return { ...base, self };
}

function sisterUnits(): { sandy: Ffx2Unit; cindy: Ffx2Unit; mindy: Ffx2Unit } {
  const s = aiUnit('sandy', 'enemy', 10330, 0);
  const c = aiUnit('cindy', 'enemy', 12240, 1);
  const m = aiUnit('mindy', 'enemy', 9788, 2);
  for (const u of [s, c, m]) u.enemy = { aiScriptId: 'magus-sisters', formIndex: 0, forms: [], rewards: sandy.rewards };
  return { sandy: s, cindy: c, mindy: m };
}

// ---------------------------------------------------------------------------

describe('data, carried from research §3 (rule 6)', () => {
  it('ships every §3 headline number exactly', () => {
    expect([x2Shiva.stats.maxHp, sandy.stats.maxHp, cindy.stats.maxHp, mindy.stats.maxHp, x2Anima.stats.maxHp])
      .toEqual([14800, 10330, 12240, 9788, 36000]);
    expect([x2Shiva.level, sandy.level, cindy.level, mindy.level, x2Anima.level]).toEqual([41, 45, 46, 44, 43]);
    expect(x2Shiva.stats).toMatchObject({ str: 69, mag: 58, def: 74, mdef: 183, agi: 119, eva: 58, luck: 6, acc: 0 });
    expect(cindy.stats).toMatchObject({ def: 172, mdef: 133, eva: 4 });
    expect(mindy.stats).toMatchObject({ eva: 76, luck: 4 });
    expect(x2Anima.stats).toMatchObject({ str: 32, mag: 33, def: 84, mdef: 42, agi: 133, eva: 0, luck: 5 });
  });

  it('Shiva: Fire weak, Ice absorb, and the Breaks and Slow land; the Sisters and Anima refuse them', () => {
    expect(x2Shiva.affinities).toMatchObject({ fire: 'weak', ice: 'absorb', gravity: 'immune' });
    expect(x2Shiva.immunities['str-down']).toBeUndefined();
    expect(x2Shiva.immunities.slow).toBeUndefined();
    expect(x2Shiva.immunities.stop).toBe(255);
    for (const e of [sandy, cindy, mindy, x2Anima]) {
      expect(e.immunities['str-down']).toBe(255);
      expect(e.immunities['mdef-down']).toBe(255);
      expect(e.immunities.slow).toBe(255);
      expect(e.immunities.reflect).toBe(255);
    }
    expect(x2Anima.affinities).toMatchObject({ fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist', holy: 'weak' });
  });

  it('the Sisters share one per-enemy script, since the FFX-2 setup ignores the group id (Review R2)', () => {
    expect([sandy.aiScriptId, cindy.aiScriptId, mindy.aiScriptId]).toEqual(['magus-sisters', 'magus-sisters', 'magus-sisters']);
    expect(aiScriptFor('magus-sisters').id).toBe('magus-sisters');
    expect(aiScriptFor('x2-shiva').id).toBe('x2-shiva');
    expect(aiScriptFor('x2-anima').id).toBe('x2-anima');
  });

  it('no id collides with the FFX Shiva and Anima (FA-G7)', () => {
    const ffxIds = new Set(Object.values(ffxData.ENEMY_GROUPS_BY_ID).flatMap((g) => [...g.enemies, ...(g.parts ?? [])].map((e) => e.id)));
    for (const id of ['x2-shiva', 'sandy', 'cindy', 'mindy', 'x2-anima']) expect(ffxIds.has(id)).toBe(false);
    for (const g of FALLEN_AEONS_CHAIN_ORDER) expect(ffxData.ENEMY_GROUPS_BY_ID[g]).toBeUndefined();
  });

  it('magic, fractional and constant moves never miss; physical ones roll (hard rule 5)', () => {
    for (const id of ['x2-shiva-blizzaga', 'x2-shiva-heavenly-strike', 'x2-shiva-diamond-dust', 'x2-anima-stare',
      'x2-anima-pain', 'x2-sandy-razzia', 'x2-cindy-demi', 'x2-mindy-passado', 'x2-mindy-firaga', 'x2-magus-delta-attack']) {
      expect(ability(id).canMiss, id).toBe(false);
    }
    for (const id of ['x2-shiva-kick', 'x2-shiva-triple-attack', 'x2-sandy-attack', 'x2-cindy-camisade', 'x2-anima-oblivion']) {
      expect(ability(id).canMiss, id).not.toBe(false);
    }
  });
});

describe('registration: registered, reachable, unlisted', () => {
  it('getChapter finds Chapter XI; chapter select does not list it', () => {
    const ch = getChapter('ffx2-fallen-aeons');
    expect(ch?.game).toBe('ffx2');
    expect(ch?.number).toBe(11);
    expect(ch?.title).toBe('Fallen Aeons');
    expect(ch?.location).toBe('Road to the Farplane');
    expect(ch?.buildRef).toBe(farplaneBuild);
    expect(ch?.enemyGroupRef.id).toBe(ROAD_SHIVA);
    expect(CHAPTER_IDS).not.toContain('ffx2-fallen-aeons');
    expect(CHAPTERS.some((c) => c.id === 'ffx2-fallen-aeons')).toBe(false);
  });

  it('three links in the sourced order, a Save Sphere before links 2 and 3, no escape, one aeon cue', () => {
    const groups = FALLEN_AEONS_CHAIN_ORDER.map((id) => data.ENEMY_GROUPS_BY_ID[id]!);
    expect(groups.map((g) => g.nextGroupId)).toEqual([ROAD_SISTERS, ROAD_ANIMA, undefined]);
    expect(groups.map((g) => g.restoresPartyOnEntry === true)).toEqual([false, true, true]);
    expect(groups.every((g) => g.canEscape === false)).toBe(true);
    expect(groups.every((g) => g.musicCues?.[0]?.track === 'boss-ffx2-aeon')).toBe(true);
  });
});

describe('FA-G1 and FA-G2: the two new effects', () => {
  it('Delta Attack leaves every girl at exactly 1 HP and 0 MP, and cannot kill', () => {
    const party = girlsAt(3000, 200);
    party[2]!.hp = 1;
    const user = aiUnit('sandy', 'enemy');
    const { ctx, events } = ctxFor([user, ...party]);
    resolveAbility(ctx, user, ability('x2-magus-delta-attack'), []);
    expect(party.map((g) => [g.hp, g.mp, g.alive])).toEqual([[1, 0, true], [1, 0, true], [1, 0, true]]);
    const dmg = events.filter((e) => e.type === 'damage') as Array<Extract<BattleEvent, { type: 'damage' }>>;
    expect(dmg.map((e) => e.amount)).toEqual([2999, 2999, 0]);
    expect(events.some((e) => e.type === 'ko')).toBe(false);
  });

  it('Heavenly Strike halves current MP exactly and takes about half of current HP', () => {
    const girl = girlsAt(4000, 301)[0]!;
    const user = aiUnit('x2-shiva', 'enemy');
    user.level = 41;
    girl.immunities = { stop: 255 }; // keep the rider out of this measurement
    const { ctx } = ctxFor([user, girl]);
    resolveAbility(ctx, user, ability('x2-shiva-heavenly-strike'), [girl.id]);
    expect(girl.mp).toBe(301 - Math.floor(301 / 2));
    // 8/16 of current HP through the shared fractional path, x the step-7 randomiser (240..271)/256.
    const taken = 4000 - girl.hp;
    expect(taken).toBeGreaterThanOrEqual(Math.floor(2000 * 240 / 256));
    expect(taken).toBeLessThanOrEqual(Math.ceil(2000 * 271 / 256));
  });

  it('Absorb drains 3/16 of current MP into Cindy', () => {
    const girl = girlsAt(4000, 160)[0]!;
    const user = aiUnit('cindy', 'enemy');
    user.mp = 100;
    const { ctx } = ctxFor([user, girl]);
    resolveAbility(ctx, user, ability('x2-cindy-absorb'), [girl.id]);
    expect(girl.mp).toBe(160 - 30);
    expect(user.mp).toBe(130);
  });

  it('Pain takes one level of six stats, and a second Pain stacks it', () => {
    const girl = girlsAt(4000, 100)[0]!;
    const user = aiUnit('x2-anima', 'enemy');
    user.level = 43;
    const { ctx } = ctxFor([user, girl], 3);
    resolveAbility(ctx, user, ability('x2-anima-pain'), [girl.id]);
    resolveAbility(ctx, user, ability('x2-anima-pain'), [girl.id]);
    for (const s of ['str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down'] as const) {
      expect(girl.statuses[s]?.stacks, s).toBe(2);
    }
  });

  it('Oblivion lands 16 blows on random girls', () => {
    const party = girlsAt(5000, 0);
    const user = aiUnit('x2-anima', 'enemy');
    user.stats.acc = 0;
    const { ctx, events } = ctxFor([user, ...party], 9);
    resolveAbility(ctx, user, ability('x2-anima-oblivion'), []);
    const blows = events.filter((e) => (e.type === 'damage' || e.type === 'miss') && (e as { sourceId?: string }).sourceId === 'x2-anima');
    expect(blows).toHaveLength(16);
  });
});

describe('Shiva\'s action counter (§4.1)', () => {
  it('AC 0-64: Kick 1/2, Blizzaga 1/4, Heavenly Strike 1/4; +3 on each of her own actions', () => {
    const counts: Record<string, number> = {};
    const shiva = aiUnit('x2-shiva', 'enemy');
    const h = aiHarness(shiva, [], 'x2-shiva', 11);
    for (let i = 0; i < 4000; i++) {
      shiva.aiMemory = { [AC]: 0 };
      const id = h.run(1)[0]!;
      counts[id] = (counts[id] ?? 0) + 1;
      expect(shiva.aiMemory[AC]).toBe(3);
    }
    expect(Object.keys(counts).sort()).toEqual(['x2-shiva-blizzaga', 'x2-shiva-heavenly-strike', 'x2-shiva-kick']);
    expect(counts['x2-shiva-kick']! / 4000).toBeCloseTo(0.5, 1);
    expect(counts['x2-shiva-blizzaga']! / 4000).toBeCloseTo(0.25, 1);
  });

  it('AC 65-99 swaps Kick for Blizzaga 1/2 and Triple Attack 1/4', () => {
    const shiva = aiUnit('x2-shiva', 'enemy');
    const h = aiHarness(shiva, [], 'x2-shiva', 12);
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      shiva.aiMemory = { [AC]: 65 };
      seen.add(h.run(1)[0]!);
    }
    expect([...seen].sort()).toEqual(['x2-shiva-blizzaga', 'x2-shiva-heavenly-strike', 'x2-shiva-triple-attack']);
  });

  it('34 of her own turns with no hits reach 100, then Diamond Dust and back to 0', () => {
    const shiva = aiUnit('x2-shiva', 'enemy');
    const h = aiHarness(shiva, [], 'x2-shiva', 13);
    const ids = h.run(35);
    expect(ids.slice(0, 34)).not.toContain('x2-shiva-diamond-dust');
    expect(ids[34]).toBe('x2-shiva-diamond-dust');
    expect(shiva.aiMemory?.[AC]).toBe(0);
  });
});

describe('"when attacked" (FA8, a sourced conflict)', () => {
  function hitDrafts(kind: 'miss' | 'damage' | 'immune'): EventDraft[] {
    if (kind === 'damage') return [{ type: 'damage', targetId: 'x2-shiva', sourceId: 'rikku', amount: 300, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }];
    return [{ type: 'miss', targetId: 'x2-shiva', sourceId: 'rikku', reason: kind === 'miss' ? 'evaded' : 'immune' }];
  }

  it('reading a (shipped): every party action aimed at her adds 5, a miss and an immune hit included', () => {
    for (const kind of ['miss', 'immune', 'damage'] as const) {
      const shiva = aiUnit('x2-shiva', 'enemy');
      shiva.enemy = { aiScriptId: 'x2-shiva', formIndex: 0, forms: [], rewards: x2Shiva.rewards };
      const rikku = aiUnit('rikku', 'party');
      const h = aiHarness(shiva, [], 'x2-shiva');
      const at = (u: Ffx2Unit) => ({ ...h.ctx, self: u });
      notifyEnemiesTargeted(hitDrafts(kind), rikku, [shiva, rikku], at);
      notifyEnemiesDamaged(hitDrafts(kind), rikku, [shiva, rikku], at);
      expect(shiva.aiMemory?.[AC], kind).toBe(5);
    }
  });

  it('reading b (the bench switch): only landed damage adds 5', () => {
    for (const [kind, want] of [['miss', 0], ['damage', 5]] as const) {
      const shiva = aiUnit('x2-shiva', 'enemy');
      shiva.enemy = { aiScriptId: 'x2-shiva', formIndex: 0, forms: [], rewards: x2Shiva.rewards };
      const rikku = aiUnit('rikku', 'party');
      const h = aiHarness(shiva, [], 'x2-shiva');
      h.flags[AC_TRIGGER_FLAG] = 'damaged';
      const at = (u: Ffx2Unit) => ({ ...h.ctx, self: u });
      notifyEnemiesTargeted(hitDrafts(kind), rikku, [shiva, rikku], at);
      notifyEnemiesDamaged(hitDrafts(kind), rikku, [shiva, rikku], at);
      expect(shiva.aiMemory?.[AC] ?? 0, kind).toBe(want);
    }
  });

  it('an enemy action never counts as her being attacked', () => {
    const shiva = aiUnit('x2-shiva', 'enemy');
    shiva.enemy = { aiScriptId: 'x2-shiva', formIndex: 0, forms: [], rewards: x2Shiva.rewards };
    const h = aiHarness(shiva, [], 'x2-shiva');
    notifyEnemiesTargeted(hitDrafts('damage'), shiva, [shiva], (u) => ({ ...h.ctx, self: u }));
    expect(shiva.aiMemory?.[AC] ?? 0).toBe(0);
  });
});

describe('the Magus Sisters (§4.2)', () => {
  function harness(seed = 21) {
    const s = sisterUnits();
    const h = aiHarness(s.sandy, [s.cindy, s.mindy], 'magus-sisters', seed);
    const script = aiScriptFor('magus-sisters');
    const turn = (u: Ffx2Unit): Command | null => script.decide(sisterCtx(h.ctx, u));
    return { ...s, h, script, turn };
  }

  it('Delta Attack needs all three alive and every counter at 100; it resets all three', () => {
    const t = harness();
    t.sandy.aiMemory = { [AC]: 100 };
    t.cindy.aiMemory = { [AC]: 100 };
    t.mindy.aiMemory = { [AC]: 99 };
    expect((t.turn(t.sandy) as { id: string }).id).not.toBe('x2-magus-delta-attack');
    t.mindy.aiMemory = { [AC]: 100 };
    expect((t.turn(t.mindy) as { id: string }).id).toBe('x2-magus-delta-attack');
    expect([t.sandy, t.cindy, t.mindy].map((u) => u.aiMemory?.[AC])).toEqual([0, 0, 0]);
  });

  it('the first kill disarms it for good', () => {
    const t = harness();
    t.mindy.alive = false;
    t.mindy.hp = 0;
    for (const u of [t.sandy, t.cindy]) u.aiMemory = { [AC]: 500 };
    t.script.onTurnResolved?.(sisterCtx(t.h.ctx, t.sandy), t.sandy);
    expect(t.h.flags[DELTA_DISARMED_FLAG]).toBe(true);
    for (let i = 0; i < 50; i++) {
      for (const u of [t.sandy, t.cindy]) expect((t.turn(u) as { id: string }).id).not.toBe('x2-magus-delta-attack');
    }
  });

  it('Cindy guards on turn 1, runs Action 1 on turns 2-8, and guards again on turn 9 (SinirothX)', () => {
    const t = harness();
    const ids: string[] = [];
    for (let i = 0; i < 17; i++) {
      t.cindy.aiMemory = { ...t.cindy.aiMemory, [AC]: 0 };
      ids.push((t.turn(t.cindy) as { id: string }).id);
    }
    const guards = ids.map((id, i) => (id === 'x2-cindy-not-so-mighty-guard' ? i + 1 : 0)).filter(Boolean);
    expect(guards).toEqual([1, 9, 17]);
    expect(new Set(ids.filter((id) => id !== 'x2-cindy-not-so-mighty-guard'))).toEqual(
      new Set(['x2-cindy-camisade', 'x2-cindy-absorb', 'x2-cindy-demi', 'x2-cindy-regen']),
    );
  });

  it('White Highwind only when all three are alive and below 1/4', () => {
    const t = harness();
    t.cindy.aiMemory = { turn: 1 };
    for (const u of [t.sandy, t.cindy, t.mindy]) u.hp = Math.floor(u.stats.maxHp / 4) - 1;
    expect((t.turn(t.cindy) as { id: string }).id).toBe('x2-cindy-white-highwind');
    t.sandy.hp = t.sandy.stats.maxHp;
    for (let i = 0; i < 30; i++) {
      t.cindy.aiMemory = { turn: 1 };
      expect((t.turn(t.cindy) as { id: string }).id).not.toBe('x2-cindy-white-highwind');
    }
  });

  it('+5 when her turn passes, +5 more for Cindy\'s Absorb, +5 when a Regen tick heals her', () => {
    const t = harness(4);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      t.cindy.aiMemory = { turn: 1, [AC]: 0 };
      const id = (t.turn(t.cindy) as { id: string }).id;
      seen.add(id);
      expect(t.cindy.aiMemory[AC], id).toBe(id === 'x2-cindy-absorb' ? 10 : 5);
    }
    expect(seen.has('x2-cindy-absorb')).toBe(true);

    t.sandy.aiMemory = { [AC]: 0 };
    t.sandy.hp = 5000;
    applyStatus(t.sandy, { status: 'regen', chance: 254, duration: 0 });
    const { ctx } = ctxFor([t.sandy]);
    let heals = 0;
    for (let i = 0; i < 400 && heals === 0; i++) {
      const before = t.sandy.hp;
      payStatusClocks([t.sandy], 50, () => undefined, ctx, (u) => sisterCtx(t.h.ctx, u));
      if (t.sandy.hp > before) heals += 1;
    }
    expect(heals).toBe(1);
    expect(t.sandy.aiMemory[AC]).toBe(5);
  });
});

describe('Anima (§4.3)', () => {
  it('4/5 Stare, 1/5 Pain, +5 a turn, Oblivion at 100 and back to 0', () => {
    const anima = aiUnit('x2-anima', 'enemy');
    const h = aiHarness(anima, [], 'x2-anima', 31);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      anima.aiMemory = { [AC]: 0 };
      const id = h.run(1)[0]!;
      counts[id] = (counts[id] ?? 0) + 1;
      expect(anima.aiMemory[AC]).toBe(5);
    }
    expect(counts['x2-anima-pain']! / 5000).toBeCloseTo(0.2, 1);
    anima.aiMemory = { [AC]: 100 };
    expect(h.run(1)[0]).toBe('x2-anima-oblivion');
    expect(anima.aiMemory[AC]).toBe(0);
  });
});

describe('FA2: the Save Sphere between links', () => {
  it('link 2 opens at full HP and MP with a KO\'d girl standing; link 1 does not restore', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    const first = { game: 'ffx2' as const, party: farplaneBuild, enemies: data.ENEMY_GROUPS_BY_ID[ROAD_SHIVA]!, triggers: [], seed: 5, condition: 'normal' as const, canEscape: false };
    engine.init(first);
    const state = engine.state();
    const yuna = state.combatants['yuna']!;
    const rikku = state.combatants['rikku']!;
    (yuna as { hp: number }).hp = 0;
    (rikku as { hp: number; mp: number }).hp = 17;
    (rikku as { mp: number }).mp = 0;
    const next = setupForNextLink(first, data.ENEMY_GROUPS_BY_ID[ROAD_SISTERS]!, state, 6);
    expect(next.party.members.find((m) => m.id === 'rikku')?.hp).toBe(17); // the chain carries...
    engine.init(next);
    const after = engine.state().combatants;
    for (const id of ['yuna', 'rikku', 'paine']) {
      const g = after[id]!;
      expect(g.hp, id).toBe(g.stats.maxHp); // ...and the Save Sphere restores
      expect(g.mp, id).toBe(g.stats.maxMp);
      expect(g.alive, id).toBe(true);
    }
    // A link without the flag keeps what it is handed (today's chain rule).
    const plain = { ...next, enemies: { ...data.ENEMY_GROUPS_BY_ID[ROAD_SISTERS]!, restoresPartyOnEntry: false } };
    engine.init(plain);
    expect(engine.state().combatants['rikku']!.hp).toBe(17);
  });
});
