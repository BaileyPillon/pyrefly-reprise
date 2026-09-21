/**
 * The move advisor's two promises to the player, as assertions.
 *
 * Both of these were broken on the live build (88e5b64) and both were reported
 * from the couch rather than by a test, which is why this file exists:
 *
 *  1. **Everything on the card is something the acting character can press,
 *     right now, on the menu in front of them.** Chapter 1 recommended "Poison
 *     Fang → Seymour Flux" on a Tidus turn and the player's reasonable reading
 *     was that the card had handed him somebody else's move. (It had not —
 *     Poison Fang is a thrown item in his own Items list — but the card said
 *     nothing about *where* the row lived, so there was no way to tell a legal
 *     suggestion from an illegal one.) {@link ownedRow} is now the gate, and
 *     the property test below replays every chapter, under the shipped tactics
 *     and under random legal play, checking every suggestion against the
 *     decision's own command list.
 *  2. **A downed healer is not invisible.** The same card ignored Yuna at
 *     0/1500 HP, because a revive was priced at a flat 3,000 against ~2,000 per
 *     boss hit. It is priced from the board now (`advisor-revive.ts`), and the
 *     scenario tests at the bottom are Bailey's exact board: Tidus acting, Yuna
 *     down, Phoenix Downs in stock — with and without a telegraphed re-kill.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEngine,
  BattleState,
  Command,
  CombatantId,
  Decision,
  FFX2PartyBuild,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { FFX2Engine, abilityRegistryFrom, dressphereRegistryFrom, garmentGridRegistryFrom, itemRegistryFrom } from '../../src/battle/ffx2/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { seymourFluxGroup } from '../../src/data/ffx/enemies/seymour-flux.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import {
  type AdvisorIntent,
  type AdvisorOptions,
  abilityOwner,
  buildAdvisorView,
  metaRowFor,
  ownedRow,
} from '../../src/engine/tactics/advisor.ts';
import {
  capabilityLoss,
  reviveRisk,
  reviveValue,
} from '../../src/engine/tactics/advisor-revive.ts';

// --------------------------------------------------------------- the engines

function ffxContent(): FFXContentRegistry {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  return content;
}

/** FFX-2's registries, built the way `BattleScreenContent.ffx2EngineOptions` builds them. */
function ffx2Options() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
  };
}

interface Rig {
  engine: BattleEngine;
  options: AdvisorOptions;
}

/** One chapter's engine and the registries its advisor needs. */
function rigFor(chapterId: string, seed: number): Rig {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`${chapterId} is not a chapter`);
  const setup = {
    game: chapter.game,
    party: chapter.buildRef as FFXPartyBuild | FFX2PartyBuild,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed,
    condition: 'normal' as const,
    canEscape: false,
  };
  if (chapter.game === 'ffx') {
    const content = ffxContent();
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup);
    return { engine, options: { ffxContent: content } };
  }
  const opts = ffx2Options();
  const engine = new FFX2Engine({ ...opts, minigames: false });
  engine.setSeed(seed);
  engine.init(setup);
  return { engine, options: { ffx2: { abilities: opts.abilities, items: opts.items } } };
}

// -------------------------------------------------------------- the property

/** A legal command, chosen at random from the rows the engine actually offered. */
function randomLegal(commands: AvailableCommand[], rng: SeededRng): Command | null {
  const rows = commands.filter(
    (c) => c.enabled && c.command.kind !== 'escape' && (c.validTargets.length > 0 || c.command.kind !== 'attack'),
  );
  if (rows.length === 0) return null;
  const row = rows[rng.int(0, rows.length - 1)]!;
  const target = row.validTargets[rng.int(0, Math.max(0, row.validTargets.length - 1))];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

function firstLegal(commands: AvailableCommand[]): Command | null {
  const row = commands.find((c) => c.enabled);
  if (!row) return null;
  return { ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command;
}

/** What the card named, in the form the player would press it. */
function shape(c: Command): string {
  const id = 'id' in c ? String((c as { id?: unknown }).id) : '';
  return `${c.kind}:${id}:${[...c.targets].join(',')}`;
}

interface Replay {
  decisions: number;
  advised: number;
  /** Suggestions the acting character could not actually have pressed. */
  illegal: string[];
}

/**
 * Replay one chapter, asking the advisor at every open decision and checking
 * every row it printed against that decision's own command list.
 */
function replay(chapterId: string, seed: number, play: 'intended' | 'random', budget: number): Replay {
  const { engine, options } = rigFor(chapterId, seed);
  const rng = new SeededRng(seed * 7919 + 13);
  const out: Replay = { decisions: 0, advised: 0, illegal: [] };

  const tick = (engine as { tick?: (ms: number) => unknown }).tick?.bind(engine);
  for (let i = 0; i < budget * 40 && out.decisions < budget; i++) {
    const decision: Decision = engine.nextDecision();
    if (decision.kind === 'battle-over') break;
    // X-2 runs on an ATB clock: nobody is ready until it is advanced.
    if (decision.kind === 'waiting') {
      if (!tick) break;
      tick(Math.max(1, decision.nextEventMs));
      continue;
    }
    if (decision.kind !== 'player-input') continue;
    out.decisions += 1;

    const state: Readonly<BattleState> = engine.state();
    const view = buildAdvisorView(state, decision, options);
    if (view) {
      out.advised += 1;
      expect(view.actorId).toBe(decision.actorId);
      expect(view.actorName).toBe(state.combatants[decision.actorId]?.name);
      for (const s of view.suggestions) {
        // **The promise is about the row, not about the aim.** `ownedRow` holds
        // every suggestion to the row's own `validTargets`, which is right for
        // a spell and wrong for a **meta command**: Lulu's Doublecast is offered
        // as `validTargets: ['lulu']` because pressing it opens the two spells
        // that pick the enemy, and the chapter's line accordingly aims it at the
        // boss. Refusing that aim threw Chapter 3's line away on every Lulu
        // turn — measured 2026-09-21, forty seeds: a card-follower won 0 of 40
        // against the chapter line's 39 [`advisor.ts#metaRowFor`,
        // `critic/bench/advisor-v2/`]. So a meta row counts as owned, and
        // everything the player's promise rests on is still checked: the row is
        // on this decision's list, it is enabled, and it is this actor's.
        const owned =
          ownedRow(decision.commands, s.command) ??
          metaRowFor(decision.commands, decision.actorId, s.command);
        if (owned === null) {
          out.illegal.push(`${chapterId}/${play}/${decision.actorId}: ${s.label} (${shape(s.command)})`);
        } else if (!owned.enabled) {
          out.illegal.push(`${chapterId}/${play}/${decision.actorId}: ${s.label} is greyed out`);
        }
      }
      // A switch at the top always carries a runner-up: "switch" alone is not
      // an answer to "what do I press".
      if (view.suggestions[0]?.isSwitch) expect(view.suggestions.length).toBe(2);
      expect(view.suggestions.length).toBeLessThanOrEqual(2);
    }

    const chosen =
      play === 'intended'
        ? (recommendedCommand(state, decision) ?? randomLegal(decision.commands, rng))
        : randomLegal(decision.commands, rng);
    const command = chosen ?? firstLegal(decision.commands);
    if (!command) break;
    try {
      engine.submit(command);
    } catch {
      break;
    }
  }
  return out;
}

describe('the card never names a move the acting character cannot press', () => {
  // 300 decisions per chapter, split across the shipped tactics and random
  // legal play so the boards are not only the ones the guide walks through.
  for (const chapter of CHAPTERS) {
    it(`holds across ${chapter.id}, intended and random, 300+ decisions`, () => {
      const illegal: string[] = [];
      let decisions = 0;
      let advised = 0;
      // Seeds until the budget is met: a chapter that ends in fifteen turns
      // needs more runs than one that goes eighty, and hard-coding a seed count
      // per chapter would rot the first time a tactic got faster.
      for (let seed = 1; seed <= 40 && decisions < 300; seed++) {
        for (const play of ['intended', 'random'] as const) {
          const r = replay(chapter.id, seed, play, 60);
          decisions += r.decisions;
          advised += r.advised;
          illegal.push(...r.illegal);
        }
      }
      expect(decisions).toBeGreaterThanOrEqual(300);
      expect(advised).toBeGreaterThan(decisions / 2);
      expect(illegal).toEqual([]);
    }, 120_000);
  }
});

// ---------------------------------------------------------- Bailey's board

/** Chapter 1, mid-fight, with the board forced to the one on the screenshot. */
function baileysBoard(seed = 1): {
  state: BattleState;
  decision: { actorId: CombatantId; commands: AvailableCommand[] };
  options: AdvisorOptions;
} {
  const content = ffxContent();
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: gagazetBuild,
    enemies: seymourFluxGroup,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  for (let i = 0; i < 80; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'tidus') {
      // Yuna face-down at 0/1500, exactly as the screenshot has her.
      const state = structuredClone(engine.state()) as BattleState;
      const yuna = state.combatants['yuna']!;
      yuna.hp = 0;
      yuna.alive = false;
      return {
        state,
        decision: { actorId: d.actorId, commands: d.commands },
        options: { ffxContent: content },
      };
    }
    const next = recommendedCommand(engine.state(), d) ?? firstLegal(d.commands);
    if (!next) break;
    engine.submit(next);
  }
  throw new Error('no Tidus decision inside 80 steps');
}

/** A forecast that says the boss is about to zombify whoever is raised. */
function lanceOfAtrophyOn(targetId: CombatantId): AdvisorIntent {
  return {
    enemyName: 'Seymour Flux',
    moveName: 'Lance of Atrophy',
    abilityId: 'lance-of-atrophy',
    actsNext: true,
    turnsAway: 0,
    estimate: { perTarget: [{ targetId, lethal: true, amount: 9999 }] },
    charge: null,
  };
}

describe('a downed healer is not invisible — Bailey’s board', () => {
  it('offers a revive first or second, with a reason in plain words', () => {
    const { state, decision, options } = baileysBoard();
    const view = buildAdvisorView(state, decision, options);
    expect(view).not.toBeNull();

    const revive = view!.suggestions.find((s) => /phoenix|life/i.test(s.label));
    expect(revive, `card offered ${view!.suggestions.map((s) => s.label).join(', ')}`).toBeDefined();
    // First or second — never buried.
    expect(view!.suggestions.indexOf(revive!)).toBeLessThan(2);
    // Player words, not research: it says what the party lost, names nobody's
    // section number, and does not mention a chapter line.
    expect(revive!.reason).toMatch(/Yuna/);
    expect(revive!.reason).not.toMatch(/§|ffx-|row \d/i);
    expect(revive!.menu).toBe('Items');
    expect(view!.note).toBe('');
  });

  it('prices that revive above anything Tidus can throw, and below a kill', () => {
    const { state } = baileysBoard();
    const value = reviveValue(state, 'yuna');
    // An ordinary boss hit in this chapter is worth ~650-2,600 to the scorer.
    expect(value).toBeGreaterThan(3_000);
    // And it must never out-argue finishing the boss (`BOSS_KILL_VALUE`).
    expect(value).toBeLessThan(20_000);
  });

  it('names the four systems the party loses while she is down', () => {
    const { state } = baileysBoard();
    const lost = capabilityLoss(state, 'yuna');
    expect(lost).toContain('revival');
    expect(lost).toContain('healing');
    expect(lost).toContain('cleansing');
    expect(lost).toContain('warding');
    // Tidus still has Hastega, so the party has not lost Haste.
    expect(lost).not.toContain('hasting');
    // A downed Wakka costs the party nothing it cannot do without.
    expect(capabilityLoss(state, 'wakka')).toEqual([]);
  });

  it('never recommends a revive the acting character does not carry', () => {
    const { state, decision, options } = baileysBoard();
    const view = buildAdvisorView(state, decision, options)!;
    for (const s of view.suggestions) {
      expect(ownedRow(decision.commands, s.command), `${s.label} is not on Tidus's menu`).not.toBeNull();
    }
  });

  it('explains the wait instead of raising her into a telegraphed re-kill', () => {
    const { state, decision, options } = baileysBoard();
    const intent = () => lanceOfAtrophyOn('yuna');
    const view = buildAdvisorView(state, decision, { ...options, intent });
    expect(view).not.toBeNull();

    // One plain sentence, naming the move and when to spend the turn instead.
    expect(view!.note).toMatch(/Lance of Atrophy/);
    expect(view!.note).toMatch(/Yuna/);
    expect(view!.note).not.toMatch(/§|ffx-/i);
    // And the revive is no longer the runner-up.
    expect(view!.suggestions.some((s) => /phoenix|life/i.test(s.label))).toBe(false);
  });

  it('drops the revive’s value when the raise walks into that hit', () => {
    const { state } = baileysBoard();
    const safe = reviveValue(state, 'yuna');
    const unsafe = reviveValue(state, 'yuna', lanceOfAtrophyOn('yuna'));
    expect(unsafe).toBeLessThan(safe / 3);
    expect(reviveRisk(state, 'yuna', lanceOfAtrophyOn('yuna'))?.kind).toBe('aimed');
    expect(reviveRisk(state, 'yuna', null)).toBeNull();
  });

  it('waits on a body that is still a Zombie', () => {
    const { state } = baileysBoard();
    state.combatants['yuna']!.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    const risk = reviveRisk(state, 'yuna');
    expect(risk?.kind).toBe('zombie');
    expect(risk?.sentence).toMatch(/cure the Zombie first/i);
  });
});

describe('ownedRow', () => {
  it('refuses a row this actor was not offered, and one that is greyed out', () => {
    const { decision } = baileysBoard();
    const fang = decision.commands.find((c) => c.label === 'Poison Fang')!;
    // Poison Fang really is on Tidus's own Items list — that is the answer to
    // the report, and the card now says "in Items" so the player can see it.
    expect(ownedRow(decision.commands, { ...fang.command, targets: ['seymour-flux'] } as Command)).not.toBeNull();

    // Kimahri's Ronso Rage is not, and never becomes, one of Tidus's rows.
    const rage = { kind: 'overdrive', id: 'mighty-guard', targets: [] } as unknown as Command;
    expect(ownedRow(decision.commands, rage)).toBeNull();

    // Nor is a legal row aimed at a target it cannot reach.
    const cheer = decision.commands.find((c) => c.label === 'Cheer')!;
    expect(ownedRow(decision.commands, { ...cheer.command, targets: ['seymour-flux'] } as Command)).toBeNull();

    // Nor a disabled one.
    const off: AvailableCommand[] = decision.commands.map((c) => ({ ...c, enabled: false }));
    expect(ownedRow(off, { ...fang.command, targets: ['seymour-flux'] } as Command)).toBeNull();
  });
});

describe('abilityOwner — who to hand the turn to', () => {
  // `handOff` is defensive: no shipped tactic can return a row it was not
  // handed, so the path is unreachable through `buildAdvisorView` today. Its
  // one piece of judgement — *who* actually owns the move — is testable, and is
  // what would be wrong first if a future tactic ever went off-menu.
  it('finds the living member who knows the move, and nobody for a shared one', () => {
    const { state } = baileysBoard();
    const mightyGuard = { kind: 'overdrive', id: 'mighty-guard', targets: [] } as unknown as Command;
    expect(abilityOwner(state, mightyGuard, 'tidus')?.id).toBe('kimahri');

    // Yuna is on the floor on this board, so her Curaga has no living owner.
    const curaga = { kind: 'ability', id: 'curaga', targets: [] } as unknown as Command;
    expect(abilityOwner(state, curaga, 'tidus')).toBeNull();

    // And an idless row (Attack, Defend, a switch) never names an owner.
    expect(abilityOwner(state, { kind: 'attack', targets: [] } as unknown as Command, 'tidus')).toBeNull();
  });
});
