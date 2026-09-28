/**
 * Chapter XVI, Ixion at Djose, as listed on 2026-09-27: the plates (stand-ins, one-line swap), the pause card,
 * the guide and tactic, the story (verbatim lines, speakers, the Abyss and wake plates, the whistles, music), and
 * the tactic winning at bench speed. **FFX-2 only** [AGENTS.md rule 14]; the listing is shared plumbing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import type { SayStep, Step } from '../../../src/story/dsl.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { FFX2_IXION_DJOSE } from '../../../src/data/chapter-ffx2-ixion-djose.ts';
import { DJOSE_ABYSS_PLATE, DJOSE_CHAMBER_PLATE, DJOSE_WAKE_PLATE, isIxionStandIn } from '../../../src/data/ixion-plates.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { djoseIxionGroup } from '../../../src/data/ffx2/enemies/ixion-djose.ts';
import { TACTICS } from '../../../src/engine/tactics/index.ts';
import { ffx2IxionDjose } from '../../../src/engine/tactics/ffx2-ixion-djose.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { SFX } from '../../../src/audio/sfx/index.ts';
import { AI_EMITTED_TRIGGERS, STORY_CHAPTERS } from '../../../src/story/registry.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { CutsceneRunner, createNoopPorts } from '../../../src/story/runner/CutsceneRunner.ts';
import {
  IXION_AI_TRIGGERS,
  IXION_WHISTLE_FLAG,
  IXION_WHISTLE_LABEL,
  TEXT_ONLY,
  ffx2IxionDjoseScripts,
} from '../../../src/story/scripts/ffx2-ixion-djose.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const ROOT = join(__dirname, '..', '..', '..');
const ART = join(ROOT, 'public', 'art');
const HASHES = readFileSync(join(ROOT, 'docs', 'target', 'approved-hashes.json'), 'utf8');
const LOCKED = readFileSync(join(ROOT, 'docs', 'target', 'judge-locked-hashes.json'), 'utf8');
const { pre, post } = ffx2IxionDjoseScripts;

describe('the plates: stand-ins until the painting round, one line each to swap', () => {
  it('the Chamber and the Abyss are the named stand-ins; the wake is the approved Chapter 4 plate', () => {
    expect([DJOSE_CHAMBER_PLATE, DJOSE_ABYSS_PLATE, DJOSE_WAKE_PLATE]).toEqual([
      'ffx2-djose-chamber-standin', 'ffx2-abyss-standin', 'bevelle-underground',
    ]);
    expect([isIxionStandIn(DJOSE_CHAMBER_PLATE), isIxionStandIn(DJOSE_ABYSS_PLATE), isIxionStandIn(DJOSE_WAKE_PLATE)]).toEqual([true, true, false]);
    expect(FFX2_IXION_DJOSE.sceneKey).toBe(DJOSE_CHAMBER_PLATE);
  });

  it.skipIf(!existsSync(join(ART, 'backdrops', 'farplane.png')))('the stand-ins are on disk, say PROVISIONAL and are locked in no list', () => {
    for (const key of [DJOSE_CHAMBER_PLATE, DJOSE_ABYSS_PLATE]) {
      expect(existsSync(join(ART, 'backdrops', `${key}.png`)), key).toBe(true);
      const side = JSON.parse(readFileSync(join(ART, 'backdrops', `${key}.json`), 'utf8')) as { status: string; notApproved: boolean };
      expect([side.status, side.notApproved]).toEqual(['PROVISIONAL', true]);
      expect(HASHES.includes(key), key).toBe(false);
      expect(LOCKED.includes(key), key).toBe(false);
    }
    const hero = JSON.parse(readFileSync(join(ART, 'pause', 'ch16-ffx2-ixion-djose-standin.json'), 'utf8')) as { status: string };
    expect(hero.status).toBe('PROVISIONAL');
    expect(HASHES.includes('ch16-ffx2-ixion-djose')).toBe(false);
  });
});

describe('the listing', () => {
  it('Chapter XVI, FFX-2, after Chapter XV; its card, pause card, guide and tactic all name it', () => {
    expect(getChapter('ffx2-ixion-djose')?.number).toBe(16);
    expect(CHAPTERS.filter((c) => c.game === 'ffx2').map((c) => c.number)).toEqual([4, 5, 6, 11, 13, 15, 16]);
    const meta = getChapterMeta('ffx2-ixion-djose')!;
    expect([meta.numeral, meta.gameLabel, meta.heroArt]).toEqual(['XVI', 'FFX-2', 'pause/ch16-ffx2-ixion-djose-standin']);
    expect(GUIDES.find((g) => g.id === 'ffx2-ixion-djose')?.bossIds).toEqual(['x2-ixion']);
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-ixion-djose').map((t) => [t.bossId, t.tactic])).toEqual([['x2-ixion', ffx2IxionDjose]]);
    expect(STORY_CHAPTERS['ffx2-ixion-djose']).toBe(ffx2IxionDjoseScripts);
    expect(AI_EMITTED_TRIGGERS['ffx2-ixion-djose']).toEqual([...IXION_AI_TRIGGERS]);
    expect(ffx2IxionDjoseScripts.midScripts['ixion-recharge']).toEqual([]);
  });

  it('music: the battle is the house aeon cue (the sourced mood of "Aeons"); every cue the chapter names exists', () => {
    expect(FFX2_IXION_DJOSE.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-aeon', victory: 'victory-ffx2' });
    const cues = [...pre, ...post].filter((s): s is Extract<Step, { type: 'music' }> => s.type === 'music').map((s) => s.track);
    expect(cues).toEqual(['scene-bevelle-underground', null, 'scene-farplane', 'scene-bevelle-underground']);
    for (const c of [...cues, ...Object.values(FFX2_IXION_DJOSE.music)]) if (c) expect(hasTrack(c), c).toBe(true);
    expect(Object.keys(SFX)).toContain('whistle-answer');
  });
});

describe('the story', () => {
  const says = [...pre, ...post].filter((s): s is SayStep => s.type === 'say');

  it('passes the house lint', () => {
    expect(lintScript(pre)).toEqual([]);
    expect(lintScript(post)).toEqual([]);
  });

  it('quotes the game only where the research does: three lines, verbatim', () => {
    const text = says.map((s) => `${s.who}: ${s.text}`);
    expect(text).toContain("rikku-x2: This can't be happening.");
    expect(text).toContain("yuna-x2: I'm all alone.");
    expect(text).toContain('gippal: Take care of things topside.');
    expect(pre.at(-2)).toMatchObject({ type: 'say', who: 'rikku-x2', text: "This can't be happening." });
    const src = readFileSync(join(ROOT, 'src', 'story', 'scripts', 'ffx2-ixion-djose.ts'), 'utf8');
    expect(src.match(/\/\/ VERBATIM/g)).toHaveLength(3);
  });

  it('speakers: Shuyin, Baralai and Gippal with approved portraits; Nooj text-only (his portrait is not approved)', () => {
    for (const who of ['shuyin', 'baralai', 'gippal']) {
      expect(says.some((s) => s.who === who), who).toBe(true);
      expect(HASHES.includes(`public/art/portraits/${who}.png`) || HASHES.includes(`portrait:${who}`), who).toBe(true);
    }
    const nooj = says.filter((s) => s.who === 'nooj');
    expect(nooj.length).toBeGreaterThan(0);
    for (const s of nooj) expect(s.portrait).toBe(TEXT_ONLY);
    expect(existsSync(join(ART, 'portraits', `${TEXT_ONLY}.png`))).toBe(false);
  });

  it('the plates change after the results: the Abyss before the first whistle, the Bevelle Underground after the fourth', () => {
    const results = post.findIndex((s) => s.type === 'results');
    const plates = post.map((s, i) => [s, i] as const).filter(([s]) => s.type === 'backdrop');
    expect(plates.map(([s]) => (s as { key: string }).key)).toEqual([DJOSE_ABYSS_PLATE, DJOSE_WAKE_PLATE]);
    const choices = post.map((s, i) => [s, i] as const).filter(([s]) => s.type === 'choice').map(([, i]) => i);
    expect(results).toBe(0);
    expect(plates[0]![1]).toBeGreaterThan(results);
    expect(plates[0]![1]).toBeLessThan(choices[0]!);
    expect(plates[1]![1]).toBeGreaterThan(choices.at(-1)!);
    expect(pre.some((s) => s.type === 'backdrop')).toBe(false);
  });

  it('the whistle beat: four one-press prompts, each answered by the whistle cue and a light', () => {
    const choices = post.filter((s): s is Extract<Step, { type: 'choice' }> => s.type === 'choice');
    expect(choices).toHaveLength(4);
    for (const c of choices) expect(c.options).toEqual([{ label: IXION_WHISTLE_LABEL, value: choices.indexOf(c) + 1 }]);
    expect(post.filter((s) => s.type === 'sfx' && (s as { key: string }).key === 'whistle-answer')).toHaveLength(4);
  });

  it('plays through the runner: both plates, four whistles, the flag at 4; a skipped scene ends in the same state', async () => {
    for (const skip of [false, true]) {
      const plates: string[] = [];
      const sfx: string[] = [];
      const runner = new CutsceneRunner(createNoopPorts({ backdrop: (key) => void plates.push(key), sfx: (k) => void sfx.push(k) }));
      if (skip) runner.skip();
      const first = await runner.run(post);
      expect(first.type).toBe('results');
      const rest = await runner.run(post, undefined, { from: first.resumeAt });
      expect(rest.type).toBe('end');
      expect(plates, `skip ${skip}`).toEqual([DJOSE_ABYSS_PLATE, DJOSE_WAKE_PLATE]);
      expect(sfx.filter((k) => k === 'whistle-answer')).toHaveLength(4);
      expect(runner.getFlag(IXION_WHISTLE_FLAG)).toBe(4);
    }
  });
});

describe('the tactic wins the fight at bench speed', () => {
  it('20 seeds, the chapter preset, the formation as built (3 s action time): at least 18 wins', () => {
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(seed);
      engine.init({ game: 'ffx2', party: djoseBuild, enemies: djoseIxionGroup, triggers: [], seed, condition: 'normal', canEscape: false });
      for (let i = 0; i < 40_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          if (d.result.outcome === 'victory') wins++;
          break;
        }
        if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
        if (d.kind !== 'player-input') continue;
        const pick = ffx2IxionDjose(d.actorId, d.commands, engine);
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
        engine.submit(pick ?? ({ ...row!.command, targets: ['x2-ixion'] } as Command));
      }
    }
    expect(wins).toBeGreaterThanOrEqual(18);
  }, 60_000);
});
