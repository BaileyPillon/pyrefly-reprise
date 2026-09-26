/**
 * Chapter XV (the Den of Woe) ship layer: the pause card, the guide, the tactic, the departures and
 * the shades' paintings. The tactic is proved by **running the engine** with it (AGENTS.md rule 3):
 * it is the bench's line written as a tactic, so it must win about as often as that line. As shipped
 * (Bailey's pick, 2026-09-26) that is the line without the Lightfall prep, with the Hero Drink, on the
 * shipped kit (3 Hero Drinks, +8 levels, both `[estimate]`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleSetup, BattleState, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ, shadeBaralai, shadeGippal, shadeNooj } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { DEN_OF_WOE_META } from '../../../src/data/chapter-meta-den-of-woe.ts';
import { FFX2_DEN_OF_WOE_SHIPPED } from '../../../src/data/chapter-den-of-woe-ship.ts';
import { DEN_OF_WOE_BOSS_IDS, FFX2_DEN_OF_WOE_GUIDE } from '../../../src/data/guides/ffx2-den-of-woe.ts';
import { GUIDES, guideForChapter, rulesOnClock } from '../../../src/data/guides/index.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { WAIT_SPLIT_HABIT_RULE } from '../../../src/data/guides/ffx2-wait-habit.ts';
import { ffx2DenOfWoe } from '../../../src/engine/tactics/ffx2-den-of-woe.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { CHAPTER_GAME, guideTitle } from '../../../src/engine/tactics/lookup.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { LINES, driveLink, type LineOptions } from '../helpers/denOfWoeDrive.ts';
import { DEN_OF_WOE_LIGHTFALL_PREP } from '../../../src/data/guides/ffx2-den-of-woe.ts';
import { DEN_OF_WOE_HERO_DRINKS } from '../../../src/data/ffx2/builds/den-of-woe.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';

const art = (p: string): boolean => existsSync(resolve('public/art', p));
/** The shipped kit and the bench line the shipped switches name (Bailey's pick: no prep, the Hero Drink). */
const SHIPPED_KIT = FFX2_DEN_OF_WOE_SHIPPED.buildRef as FFX2PartyBuild;
const SHIPPED_LINE: LineOptions = { ...(DEN_OF_WOE_LIGHTFALL_PREP ? LINES.intended : LINES.noPrep), heroDrink: DEN_OF_WOE_HERO_DRINKS > 0 };

describe('the pause card', () => {
  it('is registered unlisted, numbered XV, with the installed hero plate B', () => {
    expect(getChapterMeta('ffx2-den-of-woe')).toBe(DEN_OF_WOE_META);
    expect(UNLISTED_CHAPTER_META).toContain(DEN_OF_WOE_META);
    expect(CHAPTER_META.some((m) => m.id === 'ffx2-den-of-woe')).toBe(false);
    expect(DEN_OF_WOE_META.numeral).toBe('XV');
    expect(DEN_OF_WOE_META.gameLabel).toBe('FFX-2');
    expect(DEN_OF_WOE_META.title).toBe(FFX2_DEN_OF_WOE_SHIPPED.title);
    expect(art(`${DEN_OF_WOE_META.heroArt}.png`)).toBe(true);
    expect(art(DEN_OF_WOE_META.heroArtFallback)).toBe(true);
  });

  it("shows only installed art, names the chain's links, and carries GP16's music", () => {
    for (const s of DEN_OF_WOE_META.snapshots) expect(art(s.image), s.image).toBe(true);
    expect(DEN_OF_WOE_META.objectives.map((o) => o.rule)).toEqual([
      { kind: 'link-reached', link: 2 },
      { kind: 'link-reached', link: 3 },
      { kind: 'victory' },
    ]);
    const m = FFX2_DEN_OF_WOE_SHIPPED.music;
    expect([...DEN_OF_WOE_META.musicKeys]).toEqual([m.scene, m.battle, m.victory]);
  });

  it('the quote is a line the story plays', async () => {
    const { ffx2DenOfWoeScripts: s } = await import('../../../src/story/scripts/ffx2-den-of-woe.ts');
    const lines = [s.pre, s.post, ...Object.values(s.midScripts)].flat().filter((x) => x.type === 'say').map((x) => (x as { text: string }).text);
    expect(lines).toContain(DEN_OF_WOE_META.quote.text);
  });
});

describe("the shades' paintings", () => {
  it('each shade names its installed painting (O-1 B; Nooj on his idle alone, D-182)', () => {
    for (const [def, key] of [[shadeBaralai, 'baralai-shade'], [shadeGippal, 'gippal-shade'], [shadeNooj, 'nooj-shade']] as const) {
      expect(def.spriteKey, def.id).toBe(key);
      expect(art(`characters/${key}/idle.png`), key).toBe(true);
    }
    expect(art('backdrops/den-of-woe.png')).toBe(true);
  });
});

describe('the guide', () => {
  it('is registered for the chapter, FFX-2, and lists the three shades the tactic does', () => {
    expect(guideForChapter('ffx2-den-of-woe')).toBe(FFX2_DEN_OF_WOE_GUIDE);
    expect(GUIDES).toContain(FFX2_DEN_OF_WOE_GUIDE);
    expect(CHAPTER_GAME['ffx2-den-of-woe']).toBe('ffx2');
    expect([...FFX2_DEN_OF_WOE_GUIDE.bossIds]).toEqual(['shade-baralai', 'shade-gippal', 'shade-nooj']);
  });

  it('carries the Wait-split habit line exactly as main ships it, first, under Wait only', () => {
    expect(FFX2_DEN_OF_WOE_GUIDE.clockRules?.wait).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(WAIT_SPLIT_HABIT_RULE.text).toBe('Pick a command at once. Until you do, the clock still runs.');
    expect(rulesOnClock(FFX2_DEN_OF_WOE_GUIDE, 'wait')[0]).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(rulesOnClock(FFX2_DEN_OF_WOE_GUIDE, 'active')).toEqual(FFX2_DEN_OF_WOE_GUIDE.rules);
  });

  it('3 to 5 rules, each with a one-line short; every sentence cited in the corpus form', () => {
    const g = FFX2_DEN_OF_WOE_GUIDE;
    expect(g.rules.length).toBeGreaterThanOrEqual(3);
    expect(g.rules.length).toBeLessThanOrEqual(5);
    for (const r of g.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
    for (const r of [...g.rules, ...g.hints, ...g.phases]) expect(r.cite).toMatch(/^ffx2-gippal-den-of-woe §/);
  });

  it('the headline names the standing shade', () => {
    const board = (ids: string[]): Pick<BattleState, 'combatants'> => ({
      combatants: Object.fromEntries(ids.map((id) => [id, { id, side: 'enemy', removed: false, hp: 100 }])) as never,
    });
    expect(guideTitle(board(['shade-baralai']), FFX2_DEN_OF_WOE_GUIDE)).toBe('Baralai');
    expect(guideTitle(board(['shade-gippal']), FFX2_DEN_OF_WOE_GUIDE)).toBe('Gippal');
    expect(guideTitle(board(['shade-nooj']), FFX2_DEN_OF_WOE_GUIDE)).toBe('Nooj');
  });

  it('an FFX-2 board with a shade finds this guide and tactic; an FFX board never does', () => {
    for (const id of DEN_OF_WOE_BOSS_IDS) {
      const x2 = { game: 'ffx2', combatants: { [id]: { id, side: 'enemy' } }, enemyIds: [id] } as unknown as BattleState;
      expect(guideForState(x2)?.id, id).toBe('ffx2-den-of-woe');
      expect(tacticFor({ state: () => x2 } as never), id).toBe(ffx2DenOfWoe);
      const ffx = { game: 'ffx', combatants: { [id]: { id, side: 'enemy' } }, enemyIds: [id] } as unknown as BattleState;
      expect(guideForState(ffx), id).toBeNull();
      expect(tacticFor({ state: () => ffx } as never), id).toBeNull();
    }
  });
});

describe('the departures', () => {
  it('the three keep the house pyrefly dissolve (the shades are "fused with pyreflies", research C-3; no other exit is sourced)', () => {
    for (const id of DEN_OF_WOE_BOSS_IDS) expect(departureKindOf(id), id).toBe('dissolve');
  });
});

// --------------------------------------------------------------- the tactic, run

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** One link driven by the tactic alone, at bench speed; also counts the rows it picked that the guide explains. */
function tacticLink(linkId: string, seed: number): { outcome: string | undefined; picks: number; explained: number } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const setup: BattleSetup = {
    game: 'ffx2', party: SHIPPED_KIT, enemies: data.ENEMY_GROUPS_BY_ID[linkId]!, triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  let picks = 0;
  let explained = 0;
  for (let i = 0; i < 40_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, picks, explained };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const picked = ffx2DenOfWoe(d.actorId, d.commands as AvailableCommand[], engine);
    if (picked) {
      picks++;
      const row = d.commands.find((c) => c.command.kind === picked.kind && ('id' in c.command ? (c.command as { id: string }).id === (picked as { id?: string }).id : true));
      const label = row?.label.toLowerCase() ?? '';
      const g = FFX2_DEN_OF_WOE_GUIDE;
      if (g.hints.some((h) => h.when.labels?.some((l) => l.toLowerCase() === label) || h.when.kinds?.includes(picked.kind as never))) explained++;
    }
    engine.submit(picked ?? fallback(d));
  }
  return { outcome: undefined, picks, explained };
}

describe('the tactic, by running the engine (bench speed, 20 seeds a link)', () => {
  const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
  const cases = [DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ] as const;

  it.each(cases)('%s: wins about as often as the shipped line, and every pick is one the guide explains', (link) => {
    let tactic = 0;
    let bench = 0;
    let picks = 0;
    let explained = 0;
    for (const seed of SEEDS) {
      const run = tacticLink(link, seed);
      if (run.outcome === 'victory') tactic++;
      picks += run.picks;
      explained += run.explained;
      if (driveLink(link, SHIPPED_LINE, seed, { party: SHIPPED_KIT }).outcome === 'victory') bench++;
    }
    console.info(`[den tactic] ${link}: tactic ${tactic}/${SEEDS.length}, shipped line ${bench}/${SEEDS.length}; ${explained}/${picks} picks explained`);
    expect(picks).toBeGreaterThan(0);
    expect(explained).toBe(picks);
    expect(Math.abs(tactic - bench)).toBeLessThanOrEqual(5);
  }, 120_000);
});
