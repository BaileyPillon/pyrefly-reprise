/**
 * Chapter XI (Fallen Aeons) ship layer: the pause card, the guide, the tactic and the departures.
 * The tactic is proved by **running the engine** with it (AGENTS.md rule 3): it is the benches'
 * intended line written as a tactic, so it must win about as often as that line does.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleSetup, BattleState, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { FALLEN_AEONS_META } from '../../../src/data/chapter-meta-fallen-aeons.ts';
import { FFX2_FALLEN_AEONS_SHIPPED } from '../../../src/data/chapter-fallen-aeons-ship.ts';
import { FFX2_FALLEN_AEONS_GUIDE } from '../../../src/data/guides/ffx2-fallen-aeons.ts';
import { GUIDES, guideForChapter, rulesOnClock } from '../../../src/data/guides/index.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { WAIT_SPLIT_HABIT_RULE } from '../../../src/data/guides/ffx2-wait-habit.ts';
import { FALLEN_AEONS_BOSS_IDS, ffx2FallenAeons } from '../../../src/engine/tactics/ffx2-fallen-aeons.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { CHAPTER_GAME, guideTitle } from '../../../src/engine/tactics/lookup.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { LINES, driveLink } from '../helpers/fallenAeonsDrive.ts';

const art = (p: string): boolean => existsSync(resolve('public/art', p));

describe('the pause card', () => {
  it('is listed (2026-09-26), numbered XI, with the installed hero plate B', () => {
    expect(getChapterMeta('ffx2-fallen-aeons')).toBe(FALLEN_AEONS_META);
    expect(UNLISTED_CHAPTER_META).not.toContain(FALLEN_AEONS_META);
    expect(CHAPTER_META).toContain(FALLEN_AEONS_META);
    expect(FALLEN_AEONS_META).toMatchObject({ numeral: 'XI', gameLabel: 'FFX-2', title: 'Fallen Aeons', location: 'Road to the Farplane' });
    expect(FALLEN_AEONS_META.heroArt).toBe('pause/ch11-ffx2-fallen-aeons');
    expect(art(`${FALLEN_AEONS_META.heroArt}.png`)).toBe(true);
    expect(art(FALLEN_AEONS_META.heroArtFallback)).toBe(true);
  });

  it('shows only installed art, names the chain\'s links, and carries FA15\'s music', () => {
    for (const s of FALLEN_AEONS_META.snapshots) expect(art(s.image), s.image).toBe(true);
    expect(FALLEN_AEONS_META.objectives.map((o) => o.rule)).toEqual([
      { kind: 'link-reached', link: 2 },
      { kind: 'link-reached', link: 3 },
      { kind: 'victory' },
    ]);
    expect(FALLEN_AEONS_META.musicKeys).toEqual([
      FFX2_FALLEN_AEONS_SHIPPED.music.scene,
      FFX2_FALLEN_AEONS_SHIPPED.music.battle,
      FFX2_FALLEN_AEONS_SHIPPED.music.victory,
    ]);
  });

  it('the quote is a line the story plays', async () => {
    const { ffx2FallenAeonsScripts: s } = await import('../../../src/story/scripts/ffx2-fallen-aeons.ts');
    const lines = [s.pre, s.post, ...Object.values(s.midScripts)].flat().filter((x) => x.type === 'say').map((x) => (x as { text: string }).text);
    expect(lines).toContain(FALLEN_AEONS_META.quote.text);
  });
});

describe('the guide', () => {
  it('is registered for the chapter, FFX-2, and lists the same five ids the tactic does', () => {
    expect(guideForChapter('ffx2-fallen-aeons')).toBe(FFX2_FALLEN_AEONS_GUIDE);
    expect(GUIDES).toContain(FFX2_FALLEN_AEONS_GUIDE);
    expect(CHAPTER_GAME['ffx2-fallen-aeons']).toBe('ffx2');
    expect([...FFX2_FALLEN_AEONS_GUIDE.bossIds]).toEqual([...FALLEN_AEONS_BOSS_IDS]);
  });

  it('carries the Wait-split habit line exactly as main ships it, first, under Wait only', () => {
    expect(FFX2_FALLEN_AEONS_GUIDE.clockRules?.wait).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(WAIT_SPLIT_HABIT_RULE.text).toBe('Pick a command at once. Until you do, the clock still runs.');
    expect(rulesOnClock(FFX2_FALLEN_AEONS_GUIDE, 'wait')[0]).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(rulesOnClock(FFX2_FALLEN_AEONS_GUIDE, 'active')).toEqual(FFX2_FALLEN_AEONS_GUIDE.rules);
  });

  it('3 to 5 rules, each with a one-line short; every sentence cited in the corpus form', () => {
    const g = FFX2_FALLEN_AEONS_GUIDE;
    expect(g.rules.length).toBeGreaterThanOrEqual(3);
    expect(g.rules.length).toBeLessThanOrEqual(5);
    for (const r of g.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
    const cite = /^ffx2-fallen-aeons §/;
    for (const r of [...g.rules, ...g.hints, ...g.phases]) expect(r.cite).toMatch(cite);
  });

  it('never tells the player to use Holy: this preset learns none', () => {
    const words = [...FFX2_FALLEN_AEONS_GUIDE.rules.map((r) => r.text), ...FFX2_FALLEN_AEONS_GUIDE.hints.map((h) => h.text)].join(' ');
    expect(words).not.toMatch(/Holy/);
  });

  it('the headline names the standing link: Shiva, the Magus Sisters, Anima', () => {
    const board = (ids: string[]): Pick<BattleState, 'combatants'> => ({
      combatants: Object.fromEntries(ids.map((id) => [id, { id, side: 'enemy', removed: false, hp: 100 }])) as never,
    });
    expect(guideTitle(board(['x2-shiva']), FFX2_FALLEN_AEONS_GUIDE)).toBe('Shiva');
    expect(guideTitle(board(['mindy']), FFX2_FALLEN_AEONS_GUIDE)).toBe('Magus Sisters');
    expect(guideTitle(board(['x2-anima']), FFX2_FALLEN_AEONS_GUIDE)).toBe('Anima');
  });

  it('an FFX board with its own Shiva or Anima never finds this guide or tactic', () => {
    for (const id of ['shiva', 'anima']) {
      const state = { game: 'ffx', combatants: { [id]: { id, side: 'enemy' } } } as unknown as BattleState;
      expect(guideForState(state), id).toBeNull();
      expect(tacticFor({ state: () => state } as never), id).toBeNull();
    }
    for (const id of FALLEN_AEONS_BOSS_IDS) {
      const state = { game: 'ffx2', combatants: { [id]: { id, side: 'enemy' } }, enemyIds: [id] } as unknown as BattleState;
      expect(guideForState(state)?.id, id).toBe('ffx2-fallen-aeons');
      expect(tacticFor({ state: () => state } as never), id).toBe(ffx2FallenAeons);
    }
  });
});

describe('the departures', () => {
  it('the five keep the house dissolve (research is silent; Chapter IV\'s Bahamut precedent)', () => {
    for (const id of FALLEN_AEONS_BOSS_IDS) expect(departureKindOf(id), id).toBe('dissolve');
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
    game: 'ffx2', party: farplaneBuild, enemies: data.ENEMY_GROUPS_BY_ID[linkId]!, triggers: [], seed, condition: 'normal', canEscape: false,
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
    const picked = ffx2FallenAeons(d.actorId, d.commands as AvailableCommand[], engine);
    if (picked) {
      picks++;
      const row = d.commands.find((c) => c.command.kind === picked.kind && ('id' in c.command ? (c.command as { id: string }).id === (picked as { id?: string }).id : true));
      const label = row?.label.toLowerCase() ?? '';
      if (FFX2_FALLEN_AEONS_GUIDE.hints.some((h) => h.when.labels?.some((l) => l.toLowerCase() === label))) explained++;
    }
    engine.submit(picked ?? fallback(d));
  }
  return { outcome: undefined, picks, explained };
}

describe('the tactic, by running the engine (bench speed, 20 seeds a link)', () => {
  const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
  const cases = [
    [ROAD_SHIVA, LINES.shivaIntended],
    [ROAD_SISTERS, LINES.sistersDarknessDispel],
    [ROAD_ANIMA, LINES.animaIntended],
  ] as const;

  it.each(cases)('%s: wins about as often as the intended line, and every pick is one the guide explains', (link, line) => {
    let tactic = 0;
    let bench = 0;
    let picks = 0;
    let explained = 0;
    for (const seed of SEEDS) {
      const run = tacticLink(link, seed);
      if (run.outcome === 'victory') tactic++;
      picks += run.picks;
      explained += run.explained;
      if (driveLink(link, line, seed).outcome === 'victory') bench++;
    }
    console.info(`[fallen-aeons tactic] ${link}: tactic ${tactic}/${SEEDS.length}, intended line ${bench}/${SEEDS.length}; ${explained}/${picks} picks explained`);
    expect(picks).toBeGreaterThan(0);
    expect(explained).toBe(picks);
    // The same line, counted a little differently (her guard turns come from the link's log): within 5 in 20.
    expect(Math.abs(tactic - bench)).toBeLessThanOrEqual(5);
  }, 120_000);
});
