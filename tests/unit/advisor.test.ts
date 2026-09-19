/**
 * The move advisor's **reasoning half** (`src/engine/tactics/advisor.ts`).
 *
 * The card makes two claims to the player, and this file is both of them as
 * assertions, driven through real engines on real chapter data:
 *
 *  1. *"This is the move the chapter was designed around."* — whenever the
 *     shipped tactic has an opinion and the row is legal, the advisor's top
 *     suggestion is that command. It is the same guarantee
 *     `tests/unit/strategy-guide.test.ts` makes for the guide's NEXT line, and
 *     it is what stops the advisor and the auto-battler from teaching different
 *     fights.
 *  2. *"These numbers came from the engine."* — the estimator is covered in
 *     `tests/unit/advisor-simulate.test.ts`; what is checked here is that the
 *     scorer does not undo it: a wasteful move is ranked below a useful one,
 *     a heal aimed at a Zombie is recognised as damage, and a party switch
 *     carries a penalty big enough that it is rare.
 *
 * DOM, the N key and the SaveData preference are in
 * `tests/unit/ui-move-advisor.test.ts` — this file never touches a document.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleState,
  Command,
  CombatantId,
  Decision,
} from '../../src/battle/common/types.ts';
import { CORE_ABILITIES, FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import {
  SWITCH_PENALTY,
  buildAdvisorView,
  describeAbility,
  scoreOutcome,
  statusLabel,
  switchValue,
} from '../../src/engine/tactics/advisor.ts';
import { onTheMenu } from '../../src/engine/tactics/advisor-menu.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';

const MAX_DECISIONS = 500;

function newFfxEngine(groupId: string, seed: number, party = gagazetBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return { engine, content };
}

/** The two commands compared, reduced to what the player would actually press. */
function shape(c: Command | null): string {
  if (!c) return '(declined)';
  const id = 'id' in c ? String((c as { id?: unknown }).id) : '';
  return `${c.kind}:${id}:${[...c.targets].join(',')}`;
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

interface Walk {
  decisions: number;
  advised: number;
  /** Decisions where the tactic had an opinion and the card's top row differed. */
  mismatches: string[];
  /** Decisions whose top suggestion was a party switch. */
  switches: number;
  /** Decisions that showed a second suggestion. */
  pairs: number;
  /** Suggestions that carried a damage or healing figure. */
  withNumbers: number;
  /** Labels of the suggestions that carried no figure, in order. */
  bare: string[];
  /**
   * Decisions the tactic answered with a row **FFX's command window does not
   * paint** — today, Defend. See {@link walk}.
   */
  offMenuTactics: string[];
}

/**
 * Drive one whole battle, asking the advisor at every open decision.
 *
 * The battle is played by the shipped tactic (falling back to the first legal
 * row), so the boards the advisor is asked about are the ones a player
 * following the guide actually reaches.
 *
 * **One documented exception to "the card's top row is the tactic".** The
 * tactic may name a row the *player's command window does not paint*, and then
 * the card has to decline it: FFX's menu drops `defend` outright
 * (`ui/ffx/CommandMenuLogic.ts:98` — it is a base action reached by an
 * affordance, not an entry in the list) and no affordance is wired yet, so
 * there is no key in the game that presses it. Chapter 2's line uses Defend on
 * purpose and with numbers behind it (`tactics/yunalesca.ts:213`, 150 wins
 * against 131), which makes this a *menu* gap rather than a tactic to argue
 * with — but the card may not answer "what do I press" with something the
 * player cannot press. Those decisions are counted here instead of counted
 * against, and `docs/handoff/fix3-advisor.md` carries the request to the FFX
 * HUD track.
 */
function walk(groupId: string, seed: number, party = gagazetBuild): Walk {
  const { engine, content } = newFfxEngine(groupId, seed, party);
  const out: Walk = { decisions: 0, advised: 0, mismatches: [], switches: 0, pairs: 0, withNumbers: 0, bare: [], offMenuTactics: [] };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const decision: Decision = engine.nextDecision();
    if (decision.kind === 'battle-over') break;
    if (decision.kind !== 'player-input') continue;

    out.decisions += 1;
    const state: Readonly<BattleState> = engine.state();
    const view = buildAdvisorView(state, decision, { ffxContent: content });
    const tactic = recommendedCommand(state, decision);

    if (view) {
      out.advised += 1;
      const top = view.suggestions[0]!;
      if (top.isSwitch) out.switches += 1;
      if (view.suggestions.length > 1) out.pairs += 1;
      if (top.estimate) out.withNumbers += 1;
      else out.bare.push(top.label);
      expect(view.actorId).toBe(decision.actorId);
      // A switch at the top must always carry a runner-up.
      if (top.isSwitch) expect(view.suggestions.length).toBe(2);
      if (tactic && shape(top.command) !== shape(tactic)) {
        if (onTheMenu(state.game, tactic)) {
          out.mismatches.push(`${decision.actorId}: card ${shape(top.command)} vs tactic ${shape(tactic)}`);
        } else {
          out.offMenuTactics.push(`${decision.actorId}: ${shape(tactic)}`);
        }
      }
      // Whatever else the card does, it never names the unpressable row.
      for (const s of view.suggestions) expect(s.command.kind).not.toBe('defend');
    }

    const chosen = tactic ?? fallback(decision.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }
  return out;
}

describe('buildAdvisorView — agreement with the shipped tactic', () => {
  it('tops the card with the chapter line in Chapter 1, at several seeds', () => {
    for (const seed of [1, 2, 3]) {
      const result = walk('seymour-flux', seed);
      expect(result.decisions).toBeGreaterThan(5);
      expect(result.advised).toBe(result.decisions);
      expect(result.mismatches).toEqual([]);
    }
  });

  it('tops the card with the chapter line in Chapter 2', () => {
    const result = walk('yunalesca', 5, zanarkandBuild);
    expect(result.decisions).toBeGreaterThan(5);
    expect(result.mismatches).toEqual([]);
  });

  /**
   * Chapter 2's line stalls with Defend, and FFX's command window has no Defend
   * row — so on those decisions the card answers with the best row that *is* on
   * the stack rather than with a move the player has no key for. See
   * {@link walk}'s note; the menu gap itself is the FFX HUD track's.
   */
  it('declines a chapter line the FFX command window does not paint', () => {
    const result = walk('yunalesca', 5, zanarkandBuild);
    expect(result.offMenuTactics.length).toBeGreaterThan(0);
    for (const entry of result.offMenuTactics) expect(entry).toContain('defend:');
    // And the decisions it did decline still got advice, not silence.
    expect(result.advised).toBe(result.decisions);
  });

  /**
   * The real invariant is not a ratio — it is that **nothing that could carry a
   * number goes without one.**
   *
   * The ratio was the assertion until 2026-09-19, at `withNumbers > advised /
   * 2`, and the intended Chapter 1 line quietly grew out of it. Measured on
   * seed 4 at that date: 24 advised, 10 numbered, and every single one of the
   * fourteen without a figure is a row that genuinely has no damage or healing
   * to report — Hastega, Mighty Guard, five Summons, three Cheers, a Light
   * Curtain, Haste, and the two §4.7 Talk triggers that became executable in
   * the same pass (critic round 02 #12). A card that printed a number on
   * Hastega would be inventing one.
   *
   * So the ratio keeps a floor, loose enough not to be a tripwire for the
   * chapter's own shape, and the sharp assertion moved to the list: a top
   * suggestion with no figure must be a row from that family.
   *
   * **For the advisor track:** the open question this exposed is whether a
   * summon or a party buff should carry a *forecast* of its own — "Bahamut,
   * ~9,100 next turn", "Mighty Guard, halves the 2,400 coming" — rather than
   * nothing. That is a card-design call, not a bug, and it is written up in
   * `docs/handoff/builda-combat.md`.
   */
  const NUMBERLESS = new Set([
    'Hastega',
    'Haste',
    'Mighty Guard',
    'Cheer',
    'Light Curtain',
    'Lunar Curtain',
    'Protect',
    'Shell',
    'Talk',
    'Defend',
    'Bahamut',
    'Valefor',
    'Ifrit',
    'Ixion',
    'Shiva',
  ]);

  it('puts a number on everything that has one', () => {
    const result = walk('seymour-flux', 4);
    const unexplained = result.bare.filter((label) => !NUMBERLESS.has(label));
    expect(unexplained, 'a row with damage or healing to report must report it').toEqual([]);
    expect(result.withNumbers).toBeGreaterThan(result.advised / 4);
  });

  it('almost never leads with a party switch', () => {
    const result = walk('seymour-flux', 6);
    expect(result.switches).toBeLessThanOrEqual(result.decisions / 4);
  });
});

describe('buildAdvisorView — the shape of a suggestion', () => {
  it('fills in every field the card prints', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 9);
    let view = null;
    for (let i = 0; i < 40 && !view; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      view = buildAdvisorView(engine.state(), d, { ffxContent: content });
      if (!view) engine.submit(fallback(d.commands)!);
    }
    expect(view).not.toBeNull();
    const top = view!.suggestions[0]!;
    expect(top.label.length).toBeGreaterThan(0);
    expect(top.effect.length).toBeGreaterThan(0);
    expect(top.reason.length).toBeGreaterThan(0);
    expect(top.mpCost).toBeGreaterThanOrEqual(0);
    expect(top.critChance).toBeGreaterThanOrEqual(0);
    expect(['tactic', 'simulated']).toContain(top.source);
    if (top.estimate) {
      expect(top.estimate.min).toBeLessThanOrEqual(top.estimate.mid);
      expect(top.estimate.mid).toBeLessThanOrEqual(top.estimate.max);
    }
  });

  it('returns null when the decision offers nothing legal', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 3);
    let decision: Decision = engine.nextDecision();
    for (let i = 0; i < 40 && decision.kind !== 'player-input'; i++) decision = engine.nextDecision();
    expect(decision.kind).toBe('player-input');
    if (decision.kind !== 'player-input') return;
    const empty = { actorId: decision.actorId, commands: [] };
    expect(buildAdvisorView(engine.state(), empty, { ffxContent: content })).toBeNull();
  });
});

describe('scoreOutcome — the canon-aware penalties', () => {
  it('scores a heal aimed at a Zombie below the same heal on a clean ally', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 2);
    let decision: Decision = engine.nextDecision();
    for (let i = 0; i < 60 && decision.kind !== 'player-input'; i++) decision = engine.nextDecision();
    if (decision.kind !== 'player-input') return;

    // Put a Zombie on one member of a copy of the board, then ask the scorer
    // about the same Potion aimed at each of them.
    const state = JSON.parse(JSON.stringify(engine.state())) as BattleState;
    const [cleanId, zombieId] = state.activeIds;
    if (!cleanId || !zombieId) return;
    for (const id of [cleanId, zombieId]) {
      const c = state.combatants[id]!;
      c.hp = Math.max(1, Math.floor(c.stats.maxHp / 3));
    }
    state.combatants[zombieId]!.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };

    const potion = decision.commands.find((c) => c.command.kind === 'item' && /potion/i.test(c.label));
    if (!potion) return;
    const score = (target: CombatantId): number => {
      const command = { ...potion.command, targets: [target] } as Command;
      const outcome = simulateFFXCommand(state, decision.actorId, command, { roll: 'mid', content });
      expect(outcome).not.toBeNull();
      return scoreOutcome(state, outcome!, { command, def: outcome!.ability }).score;
    };

    expect(score(zombieId)).toBeLessThan(score(cleanId));
  });

  it('names the Zombie in the warning it attaches', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 2);
    let decision: Decision = engine.nextDecision();
    for (let i = 0; i < 60 && decision.kind !== 'player-input'; i++) decision = engine.nextDecision();
    if (decision.kind !== 'player-input') return;
    const state = JSON.parse(JSON.stringify(engine.state())) as BattleState;
    const zombieId = state.activeIds[0]!;
    const zombie = state.combatants[zombieId]!;
    zombie.hp = Math.max(1, Math.floor(zombie.stats.maxHp / 3));
    zombie.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    const potion = decision.commands.find((c) => c.command.kind === 'item' && /potion/i.test(c.label));
    if (!potion) return;
    const command = { ...potion.command, targets: [zombieId] } as Command;
    const outcome = simulateFFXCommand(state, decision.actorId, command, { roll: 'mid', content })!;
    const { warning } = scoreOutcome(state, outcome, { command, def: outcome.ability });
    expect(warning).toMatch(/Zombie/i);
    expect(warning).toContain(zombie.name);
  });
});

describe('switchValue and the switch penalty', () => {
  it('prices an ordinary switch well below the penalty', () => {
    const { engine } = newFfxEngine('seymour-flux', 1);
    for (let i = 0; i < 40; i++) {
      const d = engine.nextDecision();
      if (d.kind !== 'player-input') continue;
      const state = engine.state();
      const outId = state.activeIds[0]!;
      const inId = state.reserveIds[0];
      if (!inId) return;
      const command: Command = { kind: 'switch', targets: [], extra: { outId, inId } };
      expect(switchValue(state, command)).toBeLessThan(SWITCH_PENALTY);
      return;
    }
  });

  it('prices a switch above the penalty when the slot cannot act', () => {
    const { engine } = newFfxEngine('seymour-flux', 1);
    for (let i = 0; i < 40; i++) {
      const d = engine.nextDecision();
      if (d.kind !== 'player-input') continue;
      const state = JSON.parse(JSON.stringify(engine.state())) as BattleState;
      const outId = state.activeIds[0]!;
      const inId = state.reserveIds[0];
      if (!inId) return;
      const out = state.combatants[outId]!;
      out.alive = false;
      out.hp = 0;
      for (const status of ['petrify', 'confuse'] as const) {
        out.statuses[status] = {
          id: status,
          turnsRemaining: null,
          ticksRemaining: null,
          charges: null,
          stacks: 0,
          permanent: false,
        };
      }
      const command: Command = { kind: 'switch', targets: [], extra: { outId, inId } };
      expect(switchValue(state, command)).toBeGreaterThan(SWITCH_PENALTY);
      return;
    }
  });
});

describe('the words', () => {
  it('title-cases a hyphenated status id', () => {
    expect(statusLabel('power-break')).toBe('Power Break');
    expect(statusLabel('zombie')).toBe('Zombie');
  });

  it('describes an ability from its own record', () => {
    const potion = ALL_ABILITIES.find((a) => a.flags.includes('heals') && a.game === 'ffx');
    expect(potion).toBeDefined();
    expect(describeAbility(potion!)).toMatch(/Restores HP|Revives/);

    const attack = CORE_ABILITIES.find((a) => a.id === 'attack');
    expect(attack).toBeDefined();
    expect(describeAbility(attack!).toLowerCase()).toContain('physical');
  });

  it('prefers a row’s own help text when the menu wrote one', () => {
    const attack = CORE_ABILITIES.find((a) => a.id === 'attack')!;
    const row = {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: [],
      help: 'Swing the sword.',
    } as unknown as AvailableCommand;
    expect(describeAbility(attack, row)).toBe('Swing the sword.');
  });
});
