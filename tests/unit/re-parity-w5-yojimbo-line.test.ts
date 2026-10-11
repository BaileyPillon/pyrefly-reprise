/**
 * **Chapter IX, Yojimbo: our line after the summoner keeps her Summon's recovery** (re-parity W5, 2026-10-10; FFX only, the chapter is FFX's).
 *
 * Bailey's pick, 2026-10-10: "Keep 1:1, rework our line (Recommended)": the game charges the summoner the full recovery of her Summon and
 * does not give it back when the aeon leaves (`research/re-ffx-overdrive-steal-aeons.md` section 4.7, row A3). The shipped line called an
 * aeon at gauge 80, after any heal, and counted on Yuna acting again at once to call the next when the first fell to his ordinary attacks;
 * with the game's rule it won 307 of 500 seeds (488 before). The reworked line calls the aeon on the turn his gauge reads 96, before any
 * revive or heal; it wins 495 of 500 (holdout 491 of 500). Nothing about Yojimbo, the party or the aeons changed.
 *
 * What this file pins, and what it leaves to the measurement in `docs/handoff/re-parity-w5.md`:
 *  - the order of Yuna's choices at the gauge (95 is not a summon, 96 is, and a body on the floor does not hold it back);
 *  - the old line, frozen here, against the new one on the same seeds (the new one wins clearly more; the exact rates are the handoff's);
 *  - the guide's rule and hint say 96 and nothing else about when.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import { guideForChapter } from '../../src/data/guides/index.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { activeParty, aim, has, hpFraction, revive, row } from '../../src/engine/tactics/common.ts';
import { yojimboCavern } from '../../src/engine/tactics/index.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: yojimboCavernBuild, enemies: ENEMY_GROUPS_BY_ID['yojimbo-cavern']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  return engine;
}

const bossOf = (engine: BattleEngine): FFXCombatant => engine.state().combatants['yojimbo'] as FFXCombatant;

/** The line as it shipped until this batch: the aeon at gauge 80, after the revive and the heal (frozen here for the comparison). */
function oldLine(actorId: string, commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const state = engine.state();
  const boss = bossOf(engine);
  const defend = (): Command | null => {
    const r = commands.find((c) => c.enabled && c.command.kind === 'defend');
    return r ? aim(r) : null;
  };
  if (state.aeonId === actorId) return defend();
  const party = activeParty(engine);
  const back = revive(commands, party);
  if (back) return back;
  if (actorId === 'yuna') {
    const low = party.filter((c) => c.alive && hpFraction(c) < 0.45).sort((a, b) => hpFraction(a) - hpFraction(b));
    const first = low[0];
    if (first) {
      const heal = low.length >= 2 ? row(commands, ['Curaga', 'Cura'], first.id) : row(commands, ['Cura', 'Curaga'], first.id);
      if (heal) return aim(heal, first.id);
    }
  }
  if (actorId === 'kimahri' && !has(boss, 'doom')) {
    const doom = row(commands, ['Doom'], 'yojimbo');
    if (doom && doom.command.kind === 'overdrive') return aim(doom, 'yojimbo');
  }
  if (actorId === 'lulu') {
    const spell = row(commands, ['Fira', 'Blizzara', 'Thundara', 'Watera'], 'yojimbo');
    if (spell) return aim(spell, 'yojimbo');
  }
  if (actorId === 'yuna' && (boss.overdrive?.gauge ?? 0) >= 80) {
    for (const label of ['Bahamut', 'Ifrit', 'Ixion', 'Shiva', 'Valefor']) {
      const s = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === label);
      if (s) return aim(s);
    }
  }
  return defend();
}

function play(seed: number, line: (a: string, c: AvailableCommand[], e: BattleEngine) => Command | null): boolean {
  const engine = newEngine(seed);
  for (let i = 0; i < 6000; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return engine.state().result?.outcome === 'victory';
    if (d.kind !== 'player-input') continue;
    engine.submit(line(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
  }
  return false;
}

type YunaDecision = Extract<Decision, { kind: 'player-input' }>;

/** A real decision of Yuna's with somebody on the floor and a raise on her menu: the board where the order of her choices shows. */
function yunaWithSomeoneDown(): { engine: BattleEngine; d: YunaDecision } {
  for (let seed = 1; seed <= 40; seed += 1) {
    const engine = newEngine(seed);
    for (let i = 0; i < 6000; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const down = activeParty(engine).some((c) => !c.alive);
      if (d.actorId === 'yuna' && down && revive(d.commands, activeParty(engine)) !== null) return { engine, d };
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
    }
  }
  throw new Error('no decision of Yuna with somebody down in seeds 1 to 40');
}

describe('Chapter IX: Yuna calls the aeon on the turn the gauge reads 96', () => {
  it('95 is not a summon, 96 is, and a body on the floor does not hold the summon back', () => {
    const { engine, d } = yunaWithSomeoneDown();
    const boss = bossOf(engine);

    boss.overdrive!.gauge = 95;
    const before = yojimboCavern('yuna', d.commands, engine);
    expect(before?.kind, 'at 95 she raises').not.toBe('summon');
    expect(before?.kind === 'item' || before?.kind === 'ability', 'a raise is an item or a spell').toBe(true);

    for (const gauge of [96, 99, 100]) {
      boss.overdrive!.gauge = gauge;
      const pick = yojimboCavern('yuna', d.commands, engine);
      expect(pick?.kind, `at ${gauge} she summons`).toBe('summon');
    }
  });

  it('the summon is the first aeon of the order (Bahamut), and only Yuna makes it', () => {
    const { engine, d } = yunaWithSomeoneDown();
    bossOf(engine).overdrive!.gauge = 98;
    const pick = yojimboCavern('yuna', d.commands, engine);
    expect(pick?.kind).toBe('summon');
    expect((pick as Extract<Command, { kind: 'summon' }>).id).toBe('bahamut');
    for (const other of ['lulu', 'kimahri']) {
      const o = yojimboCavern(other, d.commands, engine);
      expect(o?.kind, `${other} never summons`).not.toBe('summon');
    }
  });

  it('wins clearly more seeds than the line it replaces, on the same 24 seeds', () => {
    let wins = 0;
    let oldWins = 0;
    for (let seed = 1; seed <= 24; seed += 1) {
      if (play(seed, (a, c, e) => yojimboCavern(a, c, e))) wins += 1;
      if (play(seed, oldLine)) oldWins += 1;
    }
    // Printed for the handoff; the pin is the order and a floor, never a tuned rate.
    console.log(`[yojimbo W5] new line ${wins}/24, old line ${oldWins}/24`);
    expect(wins, 'the reworked line').toBeGreaterThanOrEqual(20);
    expect(wins - oldWins, 'against the line it replaces').toBeGreaterThanOrEqual(4);
  }, 180_000);
});

describe('Chapter IX: the guide says when', () => {
  const guide = guideForChapter('yojimbo-cavern')!;

  it('the aeon rule and the summon hint name the gauge, 96, and never the old 80', () => {
    const rule = guide.rules.find((r) => r.text.startsWith('Call the aeon late'))!;
    expect(rule, 'the aeon rule exists').toBeDefined();
    expect(rule.text).toMatch(/\b96\b/);
    expect(rule.text).toMatch(/waits a long time/);
    expect(rule.short).toMatch(/96/);
    const hint = guide.hints.find((h) => h.when.kinds?.includes('summon'))!;
    expect(hint.text).toMatch(/\b96\b/);
    for (const text of [rule.text, rule.short, hint.text]) expect(text, 'the old summon gauge is gone').not.toMatch(/\b80\b/);
  });
});
