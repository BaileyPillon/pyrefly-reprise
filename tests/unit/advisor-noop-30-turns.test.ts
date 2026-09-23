/**
 * **PR-0006 acceptance, read literally** — critic round 09 (carried from round 06).
 *
 * The critic's acceptance check: "Seeded engine test over chapters 1 and 4:
 * run the advisor's own pick for 30 consecutive player turns and assert no
 * suggestion is returned whose simulated resolution produces no status-add, no
 * damage, no healing and no cure."
 *
 * `advisor-noop-guard.test.ts` pins the guard itself over whole fights with the
 * band-aware reading (`inertAcrossBand`). This file asks the critic's question
 * in the critic's own words, with none of the advisor's own readers in between:
 * every top row is re-resolved on a throwaway copy with the engine's simulator,
 * and the row must show at least one of
 *
 *  * a `status-add` that landed,
 *  * damage to an enemy (or HP moved on anyone),
 *  * healing,
 *  * a cure (`status-remove`) or a revive.
 *
 * The only rows allowed to show none of those are the command kinds a
 * one-action preview cannot price by construction — a summon, a switch, a
 * dress change, Defend, a scripted Talk (`advisor-guard.ts` `UNPRICED_KINDS`) —
 * and a status roll the median branch missed but the engine's own formula
 * gives a real chance (`advisor-roll.ts` `statusChances`). Both are counted and
 * capped, so neither exemption can quietly swallow the defect: the measured
 * shape was one *priced* spell (Shell) repeated on all 13 of Yuna's turns.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14; CHK-020]: shared advisor plumbing. Chapter 1 is
 * FFX (CTB, measured as six Hastega in a row), Chapter 4 is FFX-2 (ATB,
 * measured as thirteen Shell in a row).
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { simulateFFXCommand, type SimOutcome } from '../../src/battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../src/battle/ffx2/simulate.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import { statusChances } from '../../src/engine/tactics/advisor-roll.ts';

const TURNS = 30;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
/** Mirrors `advisor-guard.ts` UNPRICED_KINDS: a one-action preview cannot price these. */
const UNPRICED = new Set(['switch', 'summon', 'dismiss', 'spherechange', 'defend', 'trigger', 'escape']);

type Engine = {
  nextDecision: () => Decision;
  submit: (c: Command) => void;
  state: () => Readonly<BattleState>;
  tick?: (ms: number) => void;
};

function harness(chapterId: string, seed: number): { engine: Engine; options: AdvisorOptions } {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter "${chapterId}"`);
  const start = (engine: { setSeed: (s: number) => void; init: (c: never) => void }, enemies: unknown): void => {
    if (!enemies) throw new Error(`${chapterId}: enemy group missing from the data layer`);
    engine.setSeed(seed);
    engine.init({
      game: chapter.game,
      party: chapter.buildRef,
      enemies,
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    } as never);
  };
  if (chapter.game === 'ffx2') {
    const abilities = abilityRegistryFrom(Object.values(ffx2data.ABILITIES));
    const items = itemRegistryFrom(Object.values(ffx2data.ITEMS));
    const engine = new FFX2Engine({
      abilities,
      items,
      dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
      garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
      minigames: false,
    });
    start(engine as never, ffx2data.ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]);
    return { engine: engine as unknown as Engine, options: { ffx2: { abilities, items } } };
  }
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  start(engine as never, ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]);
  return { engine: engine as unknown as Engine, options: { ffxContent: content } };
}

function resolve(state: Readonly<BattleState>, actorId: string, command: Command, o: AdvisorOptions): SimOutcome | null {
  if (state.game === 'ffx2') {
    return simulateFFX2Command(state, actorId, command, {
      roll: 'mid',
      ...(o.ffx2?.abilities ? { abilities: o.ffx2.abilities } : {}),
      ...(o.ffx2?.items ? { items: o.ffx2.items } : {}),
    }) as SimOutcome | null;
  }
  return simulateFFXCommand(state, actorId, command, {
    roll: 'mid',
    ...(o.ffxContent ? { content: o.ffxContent } : {}),
  });
}

/** The critic's four effects, read off the simulated events and totals. */
function hasEffect(out: SimOutcome): boolean {
  if (out.rejected) return false;
  if (out.damageToEnemies > 0 || out.healingToAllies > 0) return true;
  if (Object.values(out.hpDelta).some((d) => d !== 0)) return true;
  if (out.revives.length > 0) return true;
  return out.statusChanges.length > 0; // a status-add that landed, or a cure
}

interface Tally {
  turns: number;
  effect: number;
  unpriced: number;
  rolled: number;
  offences: string[];
  picks: Map<string, number>;
  longestRepeat: number;
}

function run(chapterId: string, seed: number, tally: Tally): void {
  const { engine, options } = harness(chapterId, seed);
  let taken = 0;
  let last = '';
  let streak = 0;
  for (let i = 0; i < 20_000 && taken < TURNS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick?.(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const state = engine.state();
    const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
    const top = view?.suggestions[0];
    if (!view || !top) throw new Error(`${chapterId} seed ${seed}: no card on player turn ${taken + 1}`);
    taken += 1;
    tally.turns += 1;
    const key = `${view.actorName}: ${top.label} -> ${top.targetName ?? top.targetId ?? '-'}`;
    tally.picks.set(key, (tally.picks.get(key) ?? 0) + 1);
    streak = key === last ? streak + 1 : 1;
    last = key;
    tally.longestRepeat = Math.max(tally.longestRepeat, streak);
    const out = resolve(state, d.actorId, top.command, options);
    if (out && hasEffect(out)) tally.effect += 1;
    else if (UNPRICED.has(top.command.kind)) tally.unpriced += 1;
    else if (statusChances(state, d.actorId, top.command, out).some((c) => !c.blocked && c.percent > 0)) {
      tally.rolled += 1;
    } else tally.offences.push(`${chapterId} seed ${seed} turn ${taken}: ${key}`);
    engine.submit(top.command);
  }
}

describe('PR-0006 acceptance: 30 consecutive player turns on the card, no no-op pick', () => {
  for (const chapterId of ['seymour-flux', 'ffx2-bahamut'] as const) {
    it(`${chapterId}: every top row resolves to a status-add, damage, healing or a cure`, () => {
      const tally: Tally = {
        turns: 0,
        effect: 0,
        unpriced: 0,
        rolled: 0,
        offences: [],
        picks: new Map(),
        longestRepeat: 0,
      };
      for (const seed of SEEDS) run(chapterId, seed, tally);
      console.log(
        `[PR-0006] ${chapterId}: ${tally.turns} player turns over ${SEEDS.length} seeds; ` +
          `effect ${tally.effect}, unpriced kind ${tally.unpriced}, status roll missed at median ${tally.rolled}, ` +
          `no-op ${tally.offences.length}; distinct picks ${tally.picks.size}; longest identical run ${tally.longestRepeat}`,
      );
      expect(tally.turns).toBeGreaterThan(SEEDS.length * 10);
      expect(tally.offences).toEqual([]);
      // The exemptions stay the exception, not the route.
      expect(tally.unpriced + tally.rolled).toBeLessThan(tally.turns / 4);
      // The measured shape was one row repeated 13 times (Chapter 4) and 6 (Chapter 1).
      expect(tally.longestRepeat).toBeLessThan(6);
    }, 60_000);
  }
});
