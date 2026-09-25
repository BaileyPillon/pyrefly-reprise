/**
 * Chapter XV — the four options for Bailey are built and **OFF**
 * (`docs/plans/den-of-woe-options-2026-09-25.md`). **FFX-2 only.**
 *
 * With every switch at Bailey's pick the chapter is the ship layer's chapter: the Chapter V kit
 * itself, no retry checkpoint, the guide and tactic with the Lightfall prep. Each option, turned
 * on through its factory, does what the sheet says, and the tactic it gives is proved by running
 * the engine (AGENTS.md rule 3): it plays the bench's line for that option, and the guide it goes
 * with explains every pick.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import {
  DEN_OF_WOE_HERO_DRINKS, DEN_OF_WOE_HERO_DRINKS_OPTION, DEN_OF_WOE_LEVEL_BONUS, DEN_OF_WOE_LEVEL_BONUS_OPTION,
  denOfWoeBuild, denOfWoeKit,
} from '../../../src/data/ffx2/builds/den-of-woe.ts';
import {
  DEN_BARALAI, DEN_NOOJ, DEN_OF_WOE_RETRY_FROM_LINK, denBaralaiGroup, denGippalGroup, denNoojGroup, withRetryFromLink,
} from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { DEN_OF_WOE_LIGHTFALL_PREP, FFX2_DEN_OF_WOE_GUIDE, denOfWoeGuide } from '../../../src/data/guides/ffx2-den-of-woe.ts';
import type { ChapterGuide } from '../../../src/data/guides/types.ts';
import { FFX2_DEN_OF_WOE } from '../../../src/data/chapter-ffx2-den-of-woe.ts';
import { FFX2_DEN_OF_WOE_SHIPPED } from '../../../src/data/chapter-den-of-woe-ship.ts';
import { checkpointAt } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { makeDenOfWoeTactic, ffx2DenOfWoe } from '../../../src/engine/tactics/ffx2-den-of-woe.ts';
import type { Tactic } from '../../../src/engine/tactics/common.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { LINES, driveLink, type LineOptions } from '../helpers/denOfWoeDrive.ts';

const setupOf = (party: FFX2PartyBuild, linkId: string, seed = 1): BattleSetup => ({
  game: 'ffx2', party, enemies: data.ENEMY_GROUPS_BY_ID[linkId]!, triggers: [], seed, condition: 'normal', canEscape: false,
});

describe("every switch is at Bailey's pick", () => {
  it('GP5 a and GP6 a: the chapter fights with the Chapter V kit itself', () => {
    expect(DEN_OF_WOE_HERO_DRINKS).toBe(0);
    expect(DEN_OF_WOE_LEVEL_BONUS).toBe(0);
    expect(denOfWoeKit).toBe(farplaneBuild);
    expect(FFX2_DEN_OF_WOE.buildRef).toBe(farplaneBuild);
    expect(FFX2_DEN_OF_WOE_SHIPPED.buildRef).toBe(farplaneBuild);
    expect(farplaneBuild.inventory.some((i) => i.itemId === 'x2-hero-drink')).toBe(false);
  });

  it('GP4 (built as a): no link is a retry checkpoint, so a loss retries from Baralai', () => {
    expect(DEN_OF_WOE_RETRY_FROM_LINK).toBe(false);
    for (const [i, g] of [denBaralaiGroup, denGippalGroup, denNoojGroup].entries()) {
      expect('checkpointOnEntry' in g, g.id).toBe(false);
      expect(checkpointAt(i + 1, g, setupOf(farplaneBuild, g.id)), g.id).toBeNull();
      expect(data.ENEMY_GROUPS_BY_ID[g.id], g.id).toBe(g);
    }
  });

  it('M1 (off): the guide and tactic keep the Lightfall prep; no Hero Drink hint', () => {
    expect(DEN_OF_WOE_LIGHTFALL_PREP).toBe(true);
    const labels = FFX2_DEN_OF_WOE_GUIDE.hints.map((h) => `${(h.when.labels ?? h.when.kinds ?? []).join('/')}@${h.when.bossId ?? ''}`);
    expect(labels).toContain('Curaga@shade-nooj');
    expect(labels).toContain('attack@shade-nooj');
    expect(labels.some((l) => l.startsWith('Hero Drink'))).toBe(false);
    expect(FFX2_DEN_OF_WOE_GUIDE.rules.at(-1)!.text).toContain('Phoenix Down');
  });
});

describe('each option, turned on through its factory', () => {
  it('GP6 b and GP5 b: the kit gains the Hero Drinks and the levels, and the preset is untouched', () => {
    const both = denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS_OPTION, DEN_OF_WOE_LEVEL_BONUS_OPTION);
    expect(both.inventory.find((i) => i.itemId === 'x2-hero-drink')?.count).toBe(3);
    expect(both.members.map((m) => m.level)).toEqual(farplaneBuild.members.map((m) => m.level + 8));
    expect(farplaneBuild.members.map((m) => m.level)).toEqual([46, 48, 50]);
    expect(denOfWoeBuild(3, 0).members).toBe(farplaneBuild.members);
    expect(denOfWoeBuild(0, 8).inventory).toBe(farplaneBuild.inventory);
  });

  it('GP4 b: Gippal and Nooj become checkpoints that replay the state the party entered on', () => {
    const entry = setupOf(farplaneBuild, DEN_NOOJ, 7);
    const cp = checkpointAt(3, withRetryFromLink(denNoojGroup), entry);
    expect(cp?.link).toBe(3);
    expect(cp?.setup).toBe(entry);
    expect(checkpointAt(2, withRetryFromLink(denGippalGroup), entry)?.link).toBe(2);
    expect(checkpointAt(1, withRetryFromLink(denBaralaiGroup), entry)).toBeNull(); // link 1 is the start anyway
  });

  it('M1 on and GP6 b: the guide drops the two prep hints and teaches the Hero Drink', () => {
    const g = denOfWoeGuide({ lightfallPrep: false, heroDrinks: 3 });
    const noojHints = g.hints.filter((h) => h.when.bossId === 'shade-nooj');
    expect(noojHints.map((h) => (h.when.labels ?? h.when.kinds)![0])).toEqual(['Hero Drink', 'Mega Phoenix']);
    expect(g.rules.at(-1)!.text).toContain('Hero Drink');
    expect(g.rules.at(-1)!.short).toBe(FFX2_DEN_OF_WOE_GUIDE.rules.at(-1)!.short);
  });
});

// ------------------------------------------------------------- the tactics, run

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command;
}

interface TacticRun { outcome: string | undefined; picks: number; explained: number; drinks: number; noojSwings: number }

function tacticLink(tactic: Tactic, guide: ChapterGuide, party: FFX2PartyBuild, linkId: string, seed: number): TacticRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setupOf(party, linkId, seed));
  const run: TacticRun = { outcome: undefined, picks: 0, explained: 0, drinks: 0, noojSwings: 0 };
  for (let i = 0; i < 40_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { ...run, outcome: d.result.outcome };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const picked = tactic(d.actorId, d.commands as AvailableCommand[], engine);
    if (picked) {
      run.picks++;
      const id = (picked as { id?: string }).id;
      if (id === 'x2-hero-drink') run.drinks++;
      const darkness = d.commands.some((c) => c.enabled && (c.command as { id?: string }).id === 'x2-dark-knight-darkness');
      if (picked.kind === 'attack' && linkId === DEN_NOOJ && darkness) run.noojSwings++;
      const row = d.commands.find((c) => c.command.kind === picked.kind && ('id' in c.command ? (c.command as { id: string }).id === id : true));
      const label = row?.label.toLowerCase() ?? '';
      if (guide.hints.some((h) => h.when.labels?.some((l) => l.toLowerCase() === label) || h.when.kinds?.includes(picked.kind as never))) run.explained++;
    }
    engine.submit(picked ?? fallback(d));
  }
  return run;
}

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function compare(o: { prep: boolean; drinks: number }, linkId: string): { tactic: TacticRun[]; bench: number } {
  const party = denOfWoeBuild(o.drinks, 0);
  const guide = denOfWoeGuide({ lightfallPrep: o.prep, heroDrinks: o.drinks });
  const tactic = makeDenOfWoeTactic({ lightfallPrep: o.prep });
  const line: LineOptions = { ...(o.prep ? LINES.intended : LINES.noPrep), heroDrink: o.drinks > 0 };
  const runs = SEEDS.map((s) => tacticLink(tactic, guide, party, linkId, s));
  const bench = SEEDS.filter((s) => driveLink(linkId, line, s, { party }).outcome === 'victory').length;
  return { tactic: runs, bench };
}

describe('the option tactics, by running the engine (bench speed, 20 seeds)', () => {
  it('the shipped tactic is the factory at the switch', () => {
    const a = SEEDS.slice(0, 5).map((s) => tacticLink(ffx2DenOfWoe, FFX2_DEN_OF_WOE_GUIDE, farplaneBuild, DEN_NOOJ, s));
    const b = SEEDS.slice(0, 5).map((s) => tacticLink(makeDenOfWoeTactic({ lightfallPrep: true }), FFX2_DEN_OF_WOE_GUIDE, farplaneBuild, DEN_NOOJ, s));
    expect(a).toEqual(b);
  }, 120_000);

  it.each([
    ['M1: no prep', { prep: false, drinks: 0 }],
    ['GP6 b: Hero Drinks, with the prep', { prep: true, drinks: 3 }],
    ['GP6 b + M1: Hero Drinks, no prep', { prep: false, drinks: 3 }],
  ] as const)('%s, on Nooj: plays the line and the guide explains every pick', (_, o) => {
    const { tactic, bench } = compare(o, DEN_NOOJ);
    const wins = tactic.filter((r) => r.outcome === 'victory').length;
    const picks = tactic.reduce((n, r) => n + r.picks, 0);
    expect(picks).toBeGreaterThan(0);
    expect(tactic.reduce((n, r) => n + r.explained, 0)).toBe(picks);
    expect(Math.abs(wins - bench)).toBeLessThanOrEqual(5);
    if (o.drinks > 0) expect(tactic.reduce((n, r) => n + r.drinks, 0)).toBeGreaterThan(0);
    if (!o.prep) expect(tactic.reduce((n, r) => n + r.noojSwings, 0)).toBe(0);
  }, 180_000);

  it('M1: without the prep, Baralai is fought exactly as shipped (the prep is Nooj only)', () => {
    const a = SEEDS.slice(0, 5).map((s) => tacticLink(ffx2DenOfWoe, FFX2_DEN_OF_WOE_GUIDE, farplaneBuild, DEN_BARALAI, s));
    const b = SEEDS.slice(0, 5).map((s) => tacticLink(makeDenOfWoeTactic({ lightfallPrep: false }), FFX2_DEN_OF_WOE_GUIDE, farplaneBuild, DEN_BARALAI, s));
    expect(b.map((r) => r.outcome)).toEqual(a.map((r) => r.outcome));
    expect(b.map((r) => r.picks)).toEqual(a.map((r) => r.picks));
  }, 120_000);
});
