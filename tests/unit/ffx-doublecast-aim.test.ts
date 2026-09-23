/**
 * **PR-0125: Doublecast is aimed at the enemy, never at Lulu.**
 *
 * Critic round 09 found that FFX's Doublecast, entered through the real
 * command menu, asked for no spell and no target and cast Firaga twice on Lulu
 * herself: the row carries `targeting: 'self'`, `validTargets: ['lulu']` and no
 * `wrappedId`, `resolveTargetMode` read one valid target as a finished aim, and
 * the engine's fallback spell went where it was told. Seeds 1 and 7 KO'd her
 * from 5,700 HP; seed 42 halved her. The chapter 3 advisor recommended the row
 * about 25 times an attempt.
 *
 * Sources: `research/ffx-combat-core.md` §7.4 row 41 — Doublecast is *"Two Blk
 * Magic casts at a fixed rank 3"*, MP *"0 (+ both spells' MP)"* — and
 * `research/ffx-bfa-yu-yevon.md` §4.2 (*"Doublecast + Firaga/Thundaga"*,
 * `[verified: 2 sources]`), whose §3.4.1 example is two Firaga damage
 * instances on the boss in one action.
 *
 * The first test is the round's own probe
 * (`critic/rounds/round-09/combat-5ddfde3/probe-doublecast.test.ts`) made
 * permanent: the row submitted exactly as the HUD's target resolution offers
 * it, which is what the engine's safety net (`battle/ffx/doublecast.ts
 * aimFor`) now catches. The rest pin the path the menu takes after the fix —
 * the Black Magic list, the spell's own target step, `wrappedId` — and the
 * card that tells the player to take it.
 *
 * **FFX only** [AGENTS.md rule 14]: Doublecast is Lulu's FFX ability and
 * `dreams-end` (chapter 3) is the only build that grants it.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { resolveTargetMode, wrapCommand, wrappedGroup } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

type Ev = Record<string, unknown>;
type Engine = ReturnType<typeof createFFXEngine>;

const SEEDS = [1, 7, 42] as const;

function engineFor(seed: number, content = new FFXContentRegistry()): Engine {
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.setSeed(seed);
  e.init({
    game: 'ffx',
    party: dreamsEndBuild,
    enemies: ENEMY_GROUPS_BY_ID['braskas-final-aeon']!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return e;
}

function isDoublecast(c: AvailableCommand): boolean {
  return c.enabled && c.command.kind === 'ability' && (c.command as { id?: string }).id === 'doublecast';
}

/**
 * The probe's own line to Lulu's first Doublecast: Auron swaps her in, and
 * everyone else attacks a Yu Pagoda. Returns the engine parked on her decision.
 */
function toLulusDoublecast(seed: number): { engine: Engine; decision: Decision & { kind: 'player-input' }; row: AvailableCommand } {
  const e = engineFor(seed);
  for (let i = 0; i < 400; i++) {
    const d = e.nextDecision() as Decision;
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const row = d.commands.find(isDoublecast);
    if (d.actorId === 'lulu' && row) return { engine: e, decision: d, row };
    if (d.actorId === 'auron' && !e.state().activeIds.includes('lulu')) {
      const sw = d.commands.find(
        (c) => c.enabled && c.command.kind === 'switch' && (c.command as { extra?: { inId?: string } }).extra?.inId === 'lulu',
      );
      e.submit((sw?.command ?? { kind: 'switch', targets: [], extra: { outId: 'auron', inId: 'lulu' } }) as Command);
      continue;
    }
    const atk = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    const t = atk?.validTargets.find((x) => x.startsWith('yu-pagoda')) ?? atk?.validTargets[0];
    e.submit((atk ? { ...atk.command, targets: t ? [t] : [] } : { kind: 'defend', targets: [] }) as Command);
  }
  throw new Error(`seed ${seed}: never reached Lulu's Doublecast`);
}

function outcome(engine: Engine, events: Ev[]) {
  const enemyIds = new Set(engine.state().enemyIds);
  const start = events.find((x) => x['type'] === 'action-start') as { targets: string[]; abilityName?: string } | undefined;
  return {
    start,
    enemyIds,
    selfDamage: events
      .filter((x) => x['type'] === 'damage' && x['targetId'] === 'lulu' && x['sourceId'] === 'lulu')
      .map((x) => x['amount']),
    luluKo: events.some((x) => x['type'] === 'ko' && x['targetId'] === 'lulu'),
    misses: events.filter((x) => x['type'] === 'miss' && x['sourceId'] === 'lulu'),
    hitsOnFoes: events.filter(
      (x) => x['type'] === 'damage' && x['sourceId'] === 'lulu' && enemyIds.has(String(x['targetId'])),
    ),
  };
}

describe('PR-0125 acceptance: the row as the HUD resolves it (the round 09 probe)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: action-start targets are enemies and Lulu takes no damage from herself`, () => {
      const { engine, row } = toLulusDoublecast(seed);
      // Exactly what the probe submits: the row's own target resolution.
      const res = resolveTargetMode(row);
      const targets = 'targets' in res ? res.targets : [];
      const hpBefore = engine.state().combatants['lulu']!.hp;
      const events = engine.submit({ ...row.command, targets } as Command) as unknown as Ev[];
      const o = outcome(engine, events);

      expect(o.start, 'no action-start').toBeDefined();
      expect(o.start!.targets.length).toBeGreaterThan(0);
      for (const t of o.start!.targets) expect(o.enemyIds.has(t), `aimed at ${t}`).toBe(true);
      expect(o.selfDamage).toEqual([]);
      expect(o.luluKo).toBe(false);
      expect(engine.state().combatants['lulu']!.hp).toBe(hpBefore);
    });
  }
});

describe('the menu path after the fix: Doublecast > spell > enemy target', () => {
  it('the Doublecast row declares the Black Magic list it opens', () => {
    const { decision, row } = toLulusDoublecast(1);
    expect(row.wrapsCategory).toBe('blackmagic');
    const group = wrappedGroup(row, decision.commands)!;
    expect(group.label).toBe('Doublecast');
    // Exactly the Black Magic rows the engine offers Lulu, each with its own
    // legality, and never the wrapper itself.
    const blackMagic = decision.commands.filter((c) => c.category === 'blackmagic');
    expect(group.items).toEqual(blackMagic);
    expect(group.items.map((c) => c.label)).toContain('Firaga');
    expect(group.items).not.toContain(row);
  });

  for (const seed of SEEDS) {
    it(`seed ${seed}: Firaga at the boss lands twice on the boss, never misses, never on Lulu`, () => {
      const { engine, decision, row } = toLulusDoublecast(seed);
      const group = wrappedGroup(row, decision.commands)!;
      const firaga = group.items.find((c) => c.label === 'Firaga')!;
      // The spell's own target step: pick one of its enemies.
      const step = resolveTargetMode(firaga);
      expect(step.mode).toBe('choose');
      const candidates = step.mode === 'choose' ? step.candidates : [];
      expect(candidates).toContain('braskas-final-aeon');
      expect(candidates).not.toContain('lulu');
      const cmd = wrapCommand(row, firaga, ['braskas-final-aeon']);
      expect(cmd).toEqual({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['braskas-final-aeon'] });

      const events = engine.submit(cmd) as unknown as Ev[];
      const o = outcome(engine, events);
      expect(o.start!.targets).toEqual(['braskas-final-aeon']);
      expect(o.start!.abilityName).toBe('Doublecast: Firaga');
      expect(o.selfDamage).toEqual([]);
      // Two casts, both on the boss, and magic never misses [AGENTS.md hard
      // rule 5]: the wrapped spell resolves from its own record.
      expect(ABILITIES['firaga']!.canMiss).toBe(false);
      expect(o.misses).toEqual([]);
      expect(o.hitsOnFoes.map((x) => x['targetId'])).toEqual(['braskas-final-aeon', 'braskas-final-aeon']);
    });
  }

  it('is deterministic: the same seed and the same commands give the same events', () => {
    const run = (): unknown[] => {
      const { engine, row } = toLulusDoublecast(7);
      return engine.submit({ ...row.command, targets: ['lulu'] } as Command) as unknown as unknown[];
    };
    expect(run()).toEqual(run());
  });
});

describe('the chapter 3 card names the spell and the enemy the menu will ask for', () => {
  it('every Doublecast the card offers carries wrappedId and an enemy aim, and says which spell', () => {
    let offered = 0;
    for (const seed of [1, 2, 3]) {
      clearAdvisorCache();
      // The card simulates with the live registry, as the HUD passes it.
      const content = new FFXContentRegistry();
      const e = engineFor(seed, content);
      for (let i = 0; i < 600 && offered < 12; i++) {
        const d = e.nextDecision() as Decision;
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const state = e.state();
        const view = buildAdvisorView(state, d, { ffxContent: content });
        for (const s of view?.suggestions ?? []) {
          const id = (s.command as { id?: string }).id;
          if (s.command.kind !== 'ability' || id !== 'doublecast') continue;
          offered += 1;
          const wrappedId = (s.command as { wrappedId?: string }).wrappedId;
          expect(wrappedId, 'the card named no spell').toBeDefined();
          expect(s.label).toBe(`Doublecast: ${ABILITIES[wrappedId!]!.name}`);
          expect(s.command.targets.length).toBeGreaterThan(0);
          for (const t of s.command.targets) expect(state.enemyIds, `card aimed Doublecast at ${t}`).toContain(t);
          expect(s.targetId).not.toBe(d.actorId);
        }
        const chosen = intendedStrategy(d.actorId, d.commands, e as never);
        e.submit((chosen ?? { kind: 'defend', targets: [] }) as Command);
      }
    }
    // The chapter's line doublecasts often; if this ever reads 0 the check
    // above proved nothing and the fixture needs a longer run.
    expect(offered).toBeGreaterThan(0);
  }, 120_000);
});
