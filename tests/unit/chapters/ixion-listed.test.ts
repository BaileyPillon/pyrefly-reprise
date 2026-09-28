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
import { DJOSE_BACKDROP, DJOSE_IXION_ID, DJOSE_IXION_SPOT, DJOSE_PLATE_FRAMES, DJOSE_SPOTS, djoseCentreY } from '../../../src/scenes/djose-chamber.ts';
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

describe('the plates: the recommended options, provisional until Bailey picks, one line each to swap', () => {
  it('the Chamber and the Abyss are options C2 and the repaired A1 under provisional keys; the wake is the approved Chapter 4 plate', () => {
    expect([DJOSE_CHAMBER_PLATE, DJOSE_ABYSS_PLATE, DJOSE_WAKE_PLATE]).toEqual([
      'djose-chamber-provisional', 'farplane-abyss-provisional', 'bevelle-underground',
    ]);
    // Bailey picked both on 2026-09-28 (D-273; approved-hashes.json bailey:2026-09-28-ixion-scenes), but the files
    // keep their original -provisional names (a rename would churn the manifest), so isIxionStandIn's suffix test
    // still reads true for both — it is a filename check, not an approval check.
    expect([isIxionStandIn(DJOSE_CHAMBER_PLATE), isIxionStandIn(DJOSE_ABYSS_PLATE), isIxionStandIn(DJOSE_WAKE_PLATE)]).toEqual([true, true, false]);
    expect(FFX2_IXION_DJOSE.sceneKey).toBe(DJOSE_CHAMBER_PLATE);
  });

  it('every Chamber option has its own framing; on C2 Ixion stands on the floor right of the pit, not on its rim', () => {
    for (const key of ['ffx2-djose-chamber-standin', 'ffx2-djose-chamber-provisional', 'djose-chamber-provisional']) {
      expect(DJOSE_PLATE_FRAMES[key], key).toBeDefined();
    }
    expect(DJOSE_BACKDROP).toBe(DJOSE_PLATE_FRAMES[DJOSE_CHAMBER_PLATE]);
    // Measured headless at 1600x900, 2000x1012 and 390x844 against a gridded copy of C2 (handoff): staging, ours.
    expect(DJOSE_PLATE_FRAMES['djose-chamber-provisional']!.ixion).toEqual([4.2, 0, -6.0]);
    expect(DJOSE_SPOTS[DJOSE_IXION_ID]).toEqual(DJOSE_BACKDROP.ixion ?? DJOSE_IXION_SPOT);
    // The other plates keep the standard spot.
    expect(DJOSE_PLATE_FRAMES['ffx2-djose-chamber-provisional']!.ixion).toBeUndefined();
    expect(DJOSE_IXION_SPOT).toEqual([1.0, 0, -6.0]);
  });

  it('IXS-1: on an upright phone C2 sits 4.5 lower, so Ixion stands on lit stone, not the dark slab; desktop unchanged', () => {
    const c2 = DJOSE_PLATE_FRAMES['djose-chamber-provisional']!;
    // Measured headless at 390x844 (handoff fixes-r28): the phone's idle camera stands at z about 23.
    expect(djoseCentreY(true, c2)).toBe(-2.2);
    expect(djoseCentreY(false, c2)).toBe(2.3);
    expect(c2.ixion).toEqual([4.2, 0, -6.0]); // the same spot on both
    // A plate without a phone row keeps its own centre on the phone.
    const c1 = DJOSE_PLATE_FRAMES['ffx2-djose-chamber-provisional']!;
    expect(djoseCentreY(true, c1)).toBe(c1.centreY);
  });

  it.skipIf(!existsSync(join(ART, 'backdrops', 'farplane.png')))('options and stand-ins are on disk, say so in their sidecars; the picked two are locked, the rest are locked nowhere', () => {
    // Bailey picked C2 and the repaired A1 on 2026-09-28 (D-273): those two are now approved and locked under
    // bailey:2026-09-28-ixion-scenes in approved-hashes.json. The unpicked C1, the unrepaired A1 and both stand-ins
    // stay unapproved and unlocked, same as before.
    const pickedKeys = [DJOSE_CHAMBER_PLATE, DJOSE_ABYSS_PLATE];
    const unpickedKeys = ['ffx2-djose-chamber-provisional', 'ffx2-abyss-provisional', 'ffx2-djose-chamber-standin', 'ffx2-abyss-standin'];
    for (const key of pickedKeys) {
      expect(existsSync(join(ART, 'backdrops', `${key}.png`)), key).toBe(true);
      const side = JSON.parse(readFileSync(join(ART, 'backdrops', `${key}.json`), 'utf8')) as { status: string; notApproved: boolean };
      expect(side.notApproved, key).toBe(false);
      expect(side.status, key).toMatch(/^approved/);
      expect(HASHES.includes(key), key).toBe(true);
      expect(LOCKED.includes(key), key).toBe(false);
    }
    for (const key of unpickedKeys) {
      expect(existsSync(join(ART, 'backdrops', `${key}.png`)), key).toBe(true);
      const side = JSON.parse(readFileSync(join(ART, 'backdrops', `${key}.json`), 'utf8')) as { status: string; notApproved: boolean };
      expect(side.notApproved, key).toBe(true);
      expect(side.status, key).toMatch(key.endsWith('-standin') ? /^PROVISIONAL$/ : /^OPTION \(provisional, awaiting Bailey's pick\)$/);
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
