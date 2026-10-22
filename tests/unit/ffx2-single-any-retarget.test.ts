/**
 * **A skill whose target is gone re-aims inside that target's own side, never across (re-parity x2-retarget; FFX-2 only).**
 *
 * The defect (demo audit of Chapter IV, `docs/handoff/re-parity-x2-retarget-fix.md`): Paine's Armor Break is a `single-any` row, queued at Bahamut before the last blow.
 * With the boss down by the time it lands, `resolveTargets` fell to every living unit of both sides, which with the foes gone is only the girls, and the skill hit Yuna,
 * Rikku or Paine herself (48 of 200 Wait fights, 23 of 200 Active, 77 of 200 at zero decision time; a girl was knocked out in 2 and 3 of them). The game's re-validation rebuilds a
 * gone target from the opposing side of the caster and, with nobody left there, leaves the command alone and plays it with hits that do nothing (`research/re-ffx2-ai-leblanc-den-ixion.md`
 * section 1.12, run on the live exe); no source aims it at the other side. `single-enemy` and `single-ally` already kept to their own side; `single-any` now keeps to the side of the
 * target it was given. An empty target list (a script's placeholder) is unchanged: the engine's stand-in still draws from everyone.
 *
 * Every claim is run through the real resolver and the real chapter (hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { AUX_STREAM } from '../../src/battle/common/streams.ts';
import { abilityRegistryFrom, FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { EventDraft, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';
import { resolveTargets } from '../../src/battle/ffx2/targeting.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import type { BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const ANY = { targeting: 'single-any' as const, flags: [] as never[] };

function down(u: Ffx2Unit): Ffx2Unit {
  u.hp = 0;
  u.alive = false;
  return u;
}

/** Paine, Yuna and Rikku against Bahamut and one more foe, as a Chapter IV board with a second body. */
function board(): { paine: Ffx2Unit; yuna: Ffx2Unit; rikku: Ffx2Unit; boss: Ffx2Unit; imp: Ffx2Unit; all: Ffx2Unit[] } {
  const paine = aiUnit('paine', 'party', 3000, 2);
  const yuna = aiUnit('yuna', 'party', 3000, 0);
  const rikku = aiUnit('rikku', 'party', 3000, 1);
  const boss = aiUnit('bahamut', 'enemy', 8400, 0);
  const imp = aiUnit('imp', 'enemy', 900, 1);
  return { paine, yuna, rikku, boss, imp, all: [yuna, rikku, paine, boss, imp] };
}

describe('single-any: a foe target that is gone re-aims among the foes, or falls to nothing', () => {
  it('Bahamut down, a second foe standing: the second foe on every seed, never a girl', () => {
    for (const seed of SEEDS) {
      const b = board();
      down(b.boss);
      const t = resolveTargets(b.all, b.paine, ANY, ['bahamut'], makeFfx2Rng(seed));
      expect(t.map((u) => u.id)).toEqual(['imp']);
    }
  });

  it('every foe down: nothing is targeted on any seed (a fizzle), and no random draw is spent', () => {
    for (const seed of SEEDS) {
      const b = board();
      down(b.boss);
      down(b.imp);
      const rng = makeFfx2Rng(seed);
      const taps: number[] = [];
      rng.tap = (stream) => taps.push(stream);
      expect(resolveTargets(b.all, b.paine, ANY, ['bahamut'], rng)).toEqual([]);
      expect(taps).toEqual([]);
    }
  });

  it('a foe that left the battle (removed or hidden) counts as gone: still nothing, never a girl', () => {
    const removed = board();
    removed.boss.removed = true;
    removed.imp.removed = true;
    expect(resolveTargets(removed.all, removed.paine, ANY, ['bahamut'], makeFfx2Rng(4))).toEqual([]);
    const hidden = board();
    hidden.boss.flags.hidden = true;
    down(hidden.imp);
    expect(resolveTargets(hidden.all, hidden.paine, ANY, ['bahamut'], makeFfx2Rng(4))).toEqual([]);
  });

  it('a second foe standing costs exactly one engine-side draw, as before (the only draw the fix removes is the all-foes-gone one)', () => {
    const b = board();
    down(b.boss);
    const rng = makeFfx2Rng(9);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    resolveTargets(b.all, b.paine, ANY, ['bahamut'], rng);
    expect(taps).toEqual([AUX_STREAM]);
  });

  it('Armor Break itself: aimed at a fallen Bahamut with only the girls left it plays out and does nothing, to anyone', () => {
    const registry = abilityRegistryFrom(Object.values(data.ABILITIES));
    const armorBreak = registry.get('x2-warrior-armor-break');
    expect(armorBreak?.targeting).toBe('single-any');
    for (const seed of SEEDS) {
      const b = board();
      down(b.boss);
      down(b.imp);
      const events: EventDraft[] = [];
      const ctx: ResolveContext = { units: b.all, abilities: registry, rng: makeFfx2Rng(seed), emit: (e) => events.push(e), breaksDamageLimit: () => false };
      expect(resolveAbility(ctx, b.paine, armorBreak!, ['bahamut'])).toBe(0);
      expect(events).toEqual([]);
      for (const g of [b.yuna, b.rikku, b.paine]) {
        expect(g.hp).toBe(3000);
        expect(g.statuses['def-down']).toBeUndefined();
      }
    }
  });

  it('Armor Break with the boss down and another foe standing lands on that foe, and on no girl', () => {
    const registry = abilityRegistryFrom(Object.values(data.ABILITIES));
    const armorBreak = registry.get('x2-warrior-armor-break')!;
    for (const seed of SEEDS.slice(0, 10)) {
      const b = board();
      down(b.boss);
      b.paine.stats.acc = 255;
      const events: EventDraft[] = [];
      const ctx: ResolveContext = { units: b.all, abilities: registry, rng: new SeededRng(seed), emit: (e) => events.push(e), breaksDamageLimit: () => false };
      resolveAbility(ctx, b.paine, armorBreak, ['bahamut']);
      const on = (id: string) => events.filter((e) => (e as { targetId?: string }).targetId === id && (e.type === 'damage' || e.type === 'miss')).length;
      expect(on('imp')).toBeGreaterThan(0);
      expect(on('yuna') + on('rikku') + on('paine')).toBe(0);
    }
  });

  it('control: the boss standing is hit as named, a living named target is never re-aimed', () => {
    const b = board();
    expect(resolveTargets(b.all, b.paine, ANY, ['bahamut'], makeFfx2Rng(2)).map((u) => u.id)).toEqual(['bahamut']);
    expect(resolveTargets(b.all, b.paine, ANY, ['yuna'], makeFfx2Rng(2)).map((u) => u.id)).toEqual(['yuna']);
  });
});

describe('single-any: an ally target that is gone re-aims among the allies, or falls to nothing (the same rule from the other side)', () => {
  it('Yuna down, Rikku and Paine standing: one of them on every seed, never a foe and never the fallen girl', () => {
    for (const seed of SEEDS) {
      const b = board();
      down(b.yuna);
      const t = resolveTargets(b.all, b.paine, ANY, ['yuna'], makeFfx2Rng(seed));
      expect(t).toHaveLength(1);
      expect(['rikku', 'paine']).toContain(t[0]!.id);
    }
  });

  it('all three girls down with foes standing: nothing, never a foe', () => {
    for (const seed of SEEDS) {
      const b = board();
      down(b.yuna);
      down(b.rikku);
      down(b.paine);
      // the caster is a foe here; the girls' side is empty, so the named girl's side is empty: nothing at all
      expect(resolveTargets(b.all, b.imp, ANY, ['yuna'], makeFfx2Rng(seed))).toEqual([]);
    }
  });

  it('a row that may target the dead keeps the fallen girl it names (a revive aimed at her still finds her)', () => {
    const b = board();
    down(b.yuna);
    const t = resolveTargets(b.all, b.paine, { targeting: 'single-any', flags: ['can-target-dead'] }, ['yuna'], makeFfx2Rng(3));
    expect(t.map((u) => u.id)).toEqual(['yuna']);
  });
});

describe('single-any: what the fix leaves alone', () => {
  it('an empty target list is still the engine stand-in over everyone who can be hit, both sides', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const b = board();
      for (const u of resolveTargets(b.all, b.paine, ANY, [], makeFfx2Rng(seed))) seen.add(u.id);
    }
    expect([...seen].sort()).toEqual(['bahamut', 'imp', 'paine', 'rikku', 'yuna']);
  });

  it('an id that names no unit at all has no side to keep to and falls to everyone, as before', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const b = board();
      for (const u of resolveTargets(b.all, b.paine, ANY, ['nobody'], makeFfx2Rng(seed))) seen.add(u.id);
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it('single-enemy and single-ally keep their own rule (the opposing side, the caster\'s side)', () => {
    const b = board();
    down(b.boss);
    down(b.imp);
    expect(resolveTargets(b.all, b.paine, { targeting: 'single-enemy', flags: [] }, ['bahamut'], makeFfx2Rng(1))).toEqual([]);
    const c = board();
    down(c.yuna);
    expect(['rikku', 'paine']).toContain(resolveTargets(c.all, c.paine, { targeting: 'single-ally', flags: [] }, ['yuna'], makeFfx2Rng(1))[0]!.id);
  });
});

// The real chapter. Seeds that hit a girl with Armor Break after Bahamut fell in the engine before the fix: bench (zero decision time) 2 and 4 (onto another girl), 3 and 7 (onto herself);
// human (the Wait split, 1.5 s a menu) 1 and 5 (onto Yuna; seed 5 knocked her out).
type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

async function playChapterIV(seed: number, pace: 'bench' | 'human'): Promise<Readonly<BattleState>> {
  await registerBattleContent();
  const chapter = getChapter('ffx2-bahamut');
  if (!chapter) throw new Error('Chapter IV missing');
  const setup = setupForChapter(chapter, seed);
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  for (let i = 0; i < 60_000; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') return engine.state() as Readonly<BattleState>;
    if (pace === 'human') {
      engine.setMenuLevel('top');
      engine.tick(500, { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
      engine.tick(1000, { throughInput: true });
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  throw new Error(`seed ${seed} never ended`);
}

describe('Chapter IV through the real engine: no girl is ever struck by a girl\'s skill, and the fight is still won', () => {
  const CASES: Array<['bench' | 'human', number]> = [['bench', 2], ['bench', 4], ['bench', 3], ['bench', 7], ['human', 1], ['human', 5]];
  for (const [pace, seed] of CASES) {
    it(`${pace} seed ${seed}`, async () => {
      const state = await playChapterIV(seed, pace);
      const side = (id?: string) => (id ? state.combatants[id]?.side : undefined);
      const girl = (id?: string) => side(id) === 'party' || side(id) === 'aeon';
      const struck = state.log.filter(
        (e) => (e.type === 'damage' || e.type === 'miss') && 'sourceId' in e && girl(e.sourceId) && girl(e.targetId) && (e.type === 'miss' || e.amount > 0),
      );
      expect(struck).toEqual([]);
      const bossKo = state.log.findIndex((e) => e.type === 'ko' && side(e.targetId) === 'enemy');
      expect(bossKo).toBeGreaterThan(0);
      expect(state.log.slice(bossKo).some((e) => e.type === 'ko' && girl(e.targetId))).toBe(false);
      expect(state.log.some((e) => e.type === 'victory')).toBe(true);
    }, 120_000);
  }
});
