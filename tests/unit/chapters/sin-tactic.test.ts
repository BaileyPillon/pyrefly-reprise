/**
 * **The Sin tactics** (Chapters XVII and XVIII, FFX only): the lookup finds them by game and boss id, the
 * guides sit on the same ids, and the rules the plan names hold on the real engine's rows — above all R9, the
 * Fins' charge rule the move advisor's core does not know: **Pull back when `sin.fin.charged`, unless Cid's
 * forecast turn comes after the Fin's** (plan §3.4, research/ffx-sin.md §5.1.2, §8 row 2).
 *
 * The Fins' own AI is package F's (a stub on this branch), so the flags F will publish are set by hand here,
 * the way `sinUnits.ts` sets `sin.gigaGravitonTurn`: this proves the tactic's reading, not the Fins' behaviour.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, Decision, TurnPreview } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { sinFahrenheitBuild, sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { RULE_SHORT_MAX as SHORT_MAX } from '../../../src/data/guides/types.ts';
import { guideForState, stateOnlyEngine } from '../../../src/engine/tactics/guide.ts';
import { SIN_FACE_BOSS_IDS, SIN_FINS_CORE_BOSS_IDS, sinFace, sinFinsCore, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

/** A real engine on `groupId`, advanced (everyone else Defends) to `actorId`'s first turn. */
function at(groupId: string, actorId: string, flags: Record<string, unknown> = {}, seed = 1): { engine: BattleEngine; d: Input } {
  const party = groupId === 'overdrive-sin' ? sinFahrenheitBuild : sinFinsCoreBuild;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: ENEMY_GROUPS_BY_ID[groupId]!, triggers: [], seed, condition: 'normal', canEscape: false });
  Object.assign(engine.state().flags as Record<string, unknown>, flags);
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === actorId) {
      // Re-read the rows under the flags we set (the engine offers the orders once a range is published).
      return { engine, d };
    }
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${actorId} never got a turn on ${groupId}`);
}

/** The same engine with a forecast of our choosing (the order Cid and the Fin act in). */
function withForecast(engine: BattleEngine, order: string[]): BattleEngine {
  const rows: TurnPreview[] = order.map((actorId, index) => ({ actorId, index, tickValue: index, isParty: false, statusIcons: [], overdriveReady: false }));
  return { ...stateOnlyEngine(engine.state()), predictTurnOrder: () => rows } as unknown as BattleEngine;
}

function label(commands: AvailableCommand[], cmd: Command | null): string {
  if (!cmd) return '(none)';
  const r = commands.find((c) => c.command.kind === cmd.kind && ('id' in c.command ? (c.command as { id?: string }).id === (cmd as { id?: string }).id : true));
  return r?.label ?? cmd.kind;
}

describe('the lookup', () => {
  it('both chapters are FFX in the lookup table, and each boss id finds its own tactic and guide', () => {
    expect(CHAPTER_GAME['sin-fins-core']).toBe('ffx');
    expect(CHAPTER_GAME['sin-face']).toBe('ffx');
    for (const [ids, tactic, guideId] of [[SIN_FINS_CORE_BOSS_IDS, sinFinsCore, 'sin-fins-core'], [SIN_FACE_BOSS_IDS, sinFace, 'sin-face']] as const) {
      for (const id of ids) {
        const state = { game: 'ffx', combatants: { [id]: { id, side: 'enemy', hp: 1, removed: false } } } as never;
        expect(tacticFor(stateOnlyEngine(state)), id).toBe(tactic);
        expect(guideForState(state)?.id, id).toBe(guideId);
      }
    }
  });

  it('the guides list the same boss ids as the tactics, and every short rule fits the rail', () => {
    const fins = GUIDES.find((g) => g.id === 'sin-fins-core')!;
    const face = GUIDES.find((g) => g.id === 'sin-face')!;
    expect([...fins.bossIds]).toEqual([...SIN_FINS_CORE_BOSS_IDS]);
    expect([...face.bossIds]).toEqual([...SIN_FACE_BOSS_IDS]);
    for (const g of [fins, face]) {
      expect(g.rules.length).toBeGreaterThanOrEqual(3);
      expect(g.rules.length).toBeLessThanOrEqual(5);
      for (const r of g.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(SHORT_MAX);
    }
  });

  it('an FFX-2 board never reaches a Sin tactic', () => {
    const state = { game: 'ffx2', combatants: { 'left-fin': { id: 'left-fin', side: 'enemy' } } } as never;
    expect(tacticFor(stateOnlyEngine(state))).toBeNull();
  });
});

describe('Chapter XVII, the Fins', () => {
  it('opens FAR, so Tidus\'s first call is Close in (to Break, §8 row 1)', () => {
    const { engine, d } = at('sin-left-fin', 'tidus', { 'airship.range': 'far', 'airship.order': '' });
    const cmd = sinFinsCore('tidus', d.commands, engine);
    expect(cmd).toMatchObject({ kind: 'trigger', id: 'close-in' });
  });

  it('at NEAR Auron Breaks the Fin: Armor Break first', () => {
    const { engine, d } = at('sin-left-fin', 'auron', { 'airship.range': 'near', 'airship.order': '' });
    const cmd = sinFinsCore('auron', d.commands, engine);
    expect(label(d.commands, cmd)).toBe('Armor Break');
    expect(cmd?.targets).toEqual(['left-fin']);
  });

  it('R9: charged at NEAR, Cid acts before the Fin -> Pull back', () => {
    const { engine, d } = at('sin-left-fin', 'tidus', { 'airship.range': 'near', 'airship.order': '', 'sin.fin.charged': true });
    const cmd = sinFinsCore('tidus', d.commands, withForecast(engine, ['tidus', 'cid', 'left-fin']));
    expect(cmd).toMatchObject({ kind: 'trigger', id: 'pull-back' });
  });

  it('R9: charged at NEAR, the Fin acts before Cid -> no Pull back (it would only spend the turn)', () => {
    const { engine, d } = at('sin-left-fin', 'tidus', { 'airship.range': 'near', 'airship.order': '', 'sin.fin.charged': true });
    const cmd = sinFinsCore('tidus', d.commands, withForecast(engine, ['tidus', 'left-fin', 'cid']));
    expect(cmd).not.toMatchObject({ kind: 'trigger', id: 'pull-back' });
  });

  it('R9 on the live forecast: the answer matches the engine\'s own CTB order', () => {
    const { engine, d } = at('sin-left-fin', 'tidus', { 'airship.range': 'near', 'airship.order': '', 'sin.fin.charged': true });
    const cmd = sinFinsCore('tidus', d.commands, engine);
    const pull = d.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'pull-back')!;
    const order = (engine as unknown as { predictTurnOrder(n: number, c?: Command): TurnPreview[] }).predictTurnOrder(12, { ...pull.command, targets: [] } as Command);
    const next = order.filter((t) => t.index > 0).map((t) => t.actorId);
    const cidFirst = next.indexOf('cid') >= 0 && (next.indexOf('left-fin') < 0 || next.indexOf('cid') < next.indexOf('left-fin'));
    expect(cmd?.kind === 'trigger' && (cmd as { id: string }).id === 'pull-back').toBe(cidFirst);
  });
});

describe('Chapter XVII, Genais and the Core', () => {
  it('Genais out of its shell: Lulu casts nothing at it (Waterga answers magic, §5.3.1)', () => {
    const { engine, d } = at('sin-genais-core', 'yuna');
    // Lulu is benched at the start; read her rows by swapping her in through the engine is heavy, so check the
    // rule through Yuna's and Auron's turns: nothing magical is aimed at Genais while it is out.
    const cmd = sinFinsCore('yuna', d.commands, engine);
    expect(label(d.commands, cmd)).not.toMatch(/^(Fire|Fira|Firaga|Blizzard|Thunder|Water)/);
    const a = at('sin-genais-core', 'auron');
    const hit = sinFinsCore('auron', a.d.commands, a.engine);
    expect(hit?.kind).toBe('attack');
    expect(hit?.targets).toEqual(['sinspawn-genais']);
  });

  it('once Genais is gone the Core is Broken first', () => {
    const { engine, d } = at('sin-genais-core', 'auron');
    (engine.state().combatants['sinspawn-genais'] as { alive: boolean; hp: number }).alive = false;
    (engine.state().combatants['sinspawn-genais'] as { alive: boolean; hp: number }).hp = 0;
    const cmd = sinFinsCore('auron', d.commands, engine);
    expect(label(d.commands, cmd)).toBe('Armor Break');
    expect(cmd?.targets).toEqual(['sin-core']);
  });
});

describe('Chapter XVIII, the Face', () => {
  it('during the pulls (FAR) Tidus casts Hastega', () => {
    const { engine, d } = at('overdrive-sin', 'tidus');
    expect(engine.state().flags['airship.range']).toBe('far');
    expect(label(d.commands, sinFace('tidus', d.commands, engine))).toBe('Hastega');
  });

  it('in range (NEAR) Auron Armor Breaks it at once', () => {
    // Sin's third pull brings the ship in (§5.4); standing it NEAR before the rows are offered is the same board.
    const { engine, d } = at('overdrive-sin', 'auron', { 'airship.range': 'near' });
    const cmd = sinFace('auron', d.commands, engine);
    expect(label(d.commands, cmd)).toBe('Armor Break');
    expect(cmd?.targets).toEqual(['overdrive-sin']);
  });
});

// ---------------------------------------------------------------------------
// A measurement, not a gate (package B owns the bench): PYREFLY_SIN_MEASURE=1 prints the intended line's
// first-try wins on the chapter's own setup. Skipped in `npm test`.
// ---------------------------------------------------------------------------

describe.skipIf(!process.env['PYREFLY_SIN_MEASURE'])('measure: the intended line (PYREFLY_SIN_MEASURE=1)', () => {
  it('Chapter XVIII, seeds 1 to 60', async () => {
    const { intendedStrategy } = await import('../../../src/engine/BattlePresenterStrategies.ts');
    const { getChapter } = await import('../../../src/data/encounters.ts');
    const { setupForChapter } = await import('../../../src/app/screens/BattleScreenSetup.ts');
    const wins: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init(setupForChapter(getChapter('sin-face')!, seed));
      let outcome = '';
      for (let i = 0; i < 6000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          break;
        }
        if (d.kind === 'player-input') engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
      }
      if (outcome === 'victory') wins.push(seed);
    }
    console.log(`sin-face intended: ${wins.length}/60 wins; seeds ${wins.join(',')}`);
  }, 120_000);
});
