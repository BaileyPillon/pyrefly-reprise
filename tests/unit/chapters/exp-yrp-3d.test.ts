/**
 * **The hidden 3D Bahamut chapter** (`exp-yrp-3d`, chapter 29; branch `exp-yrp-3d`; **FFX-2 only**, AGENTS.md rule 14): Chapter IV's fight, opened by the typed word `yrp` and drawn as a real 3D scene.
 *
 * What this file pins:
 *
 * 1. **It is a hidden experiment, not a chapter**: registered with the experiments (`chapters-experiments.ts`), in neither `CHAPTERS` nor `CHAPTER_IDS` (every count stays nineteen), number 29, `experimental`
 *    (its attempts, clears and time go to the experiments' store, never the save), pause metadata in `UNLISTED_CHAPTER_META` with the EXP numeral, FFX-2 in the tactics' game table.
 * 2. **It is Chapter IV's encounter, by reference**: the same party build, formation, scripts, music, Sensor line and card words; only the id, the number, the scene key and the title are its own. **No battle data of its
 *    own** (AGENTS.md rule 6). Chapter IV's own record is untouched.
 * 3. **The determinism proof**: the seeded FFX-2 engine, played through the app's own path with the shipped autopilot line, makes exactly Chapter IV's event log on every seed tried.
 * 4. **Mega Flare is the id the director takes**: the real engine's `action-start` for Bahamut's finisher carries an id in `MEGA_FLARE_IDS`, so frame C's camera does fire in a played fight.
 * 5. **Its scene**: a real scene row, a canon row (FFX-2, the chamber's), the backdrop file Chapter IV's plate, the side table with its ten rows in order.
 */
import { describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2EngineOptions } from '../../../src/app/screens/BattleScreenContent.ts';
import type { BattleEvent, BattleState, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { backdropFileOf, EXP_LEBLANC_SCENE } from '../../../src/data/art/artNamespace.ts';
import { EXP_YRP_TEXT } from '../../../src/data/chapter-exp-yrp-3d.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, FFX2_BAHAMUT, getChapter } from '../../../src/data/encounters.ts';
import { EXP_YRP_ID, EXP_YRP_SCENE, YRP_MODEL_DIR } from '../../../src/data/yrp-ids.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { PYREFLY_CANON, pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { MEGA_FLARE_IDS } from '../../../src/engine/yrp3d/director.ts';
import { EXPERIMENT_SCENE_ENTRIES, EXPERIMENT_SCENE_FACTORIES } from '../../../src/scenes/experiment-scenes.ts';
import { EXP_YRP_SCENE_ENTRY, EXP_YRP_SLOTS } from '../../../src/scenes/exp-yrp-3d-stage.ts';
import { SCENE_FACTORIES, getScene, isPlaceholderScene, sceneKeys } from '../../../src/scenes/index.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';

const chapter = getChapter(EXP_YRP_ID)!;

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  it('is registered with the experiments and not with the nineteen: number 29, FFX-2, experimental, on its own scene', () => {
    expect(chapter).toBeDefined();
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('exp-yrp-3d');
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('exp-yrp-3d');
    expect((CHAPTER_IDS as readonly string[]).includes('exp-yrp-3d')).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect([chapter.id, chapter.number, chapter.game, chapter.experimental, chapter.sceneKey]).toEqual(['exp-yrp-3d', 29, 'ffx2', true, 'exp-yrp-3d-stage']);
    expect([EXP_YRP_ID, EXP_YRP_SCENE]).toEqual(['exp-yrp-3d', 'exp-yrp-3d-stage']); // the no-import ids module says what the record says
    expect(YRP_MODEL_DIR).toBe('models-exp/yrp');
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length); // every number is its own
  });

  it('wears the working title, awaiting Bailey\'s pick', () => {
    expect(chapter.title).toBe('Bahamut, in 3D (Experimental)');
    expect(EXP_YRP_TEXT.title).toBe(chapter.title);
  });

  it('its pause metadata is the hidden one: EXP, Chapter IV\'s objectives, tip, quote and snapshots, found by id and not among the listed nineteen', () => {
    const meta = getChapterMeta('exp-yrp-3d')!;
    const base = getChapterMeta('ffx2-bahamut')!;
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === 'exp-yrp-3d')).toBe(meta);
    expect(CHAPTER_META.map((m) => m.id as string)).not.toContain('exp-yrp-3d');
    expect([meta.numeral, meta.title, meta.gameLabel]).toEqual(['EXP', chapter.title, 'FFX-2']);
    for (const key of ['subtitle', 'location', 'blurb', 'heroArt', 'heroArtFallback', 'quote', 'handwritten', 'objectives', 'tip', 'snapshots', 'focalCharacterId', 'musicKeys', 'victoryPose'] as const) {
      expect(meta[key], key).toBe(base[key]);
    }
  });

  it('is FFX-2 in the tactics\' game table (so the advisor and the guide never read it as FFX)', () => {
    expect(CHAPTER_GAME['exp-yrp-3d']).toBe('ffx2');
    expect(CHAPTER_GAME['ffx2-bahamut']).toBe('ffx2');
  });
});

describe('it is Chapter IV\'s encounter, by reference', () => {
  it('shares the build, the formation, the scripts, the music, the Sensor lines and the card words with Chapter IV', () => {
    for (const key of ['game', 'buildRef', 'enemyGroupRef', 'scriptsRef', 'music', 'sensorTexts', 'subtitle', 'location', 'blurb', 'thumbnailKey'] as const) {
      expect(chapter[key], key).toBe(FFX2_BAHAMUT[key]);
    }
    const mine = setupForChapter(chapter, 3);
    const theirs = setupForChapter(FFX2_BAHAMUT, 3);
    expect(mine.party).toBe(theirs.party);
    expect(mine.enemies).toBe(theirs.enemies);
    expect(mine.triggers).toEqual(theirs.triggers);
    expect(mine).toEqual(theirs);
  });

  it('keeps the existing party and boss: Yuna, Rikku and Paine in Chapter IV\'s dresspheres against Bahamut, no data of its own', () => {
    const members = (chapter.buildRef as { members: Array<{ id: string; currentDressphere: string }> }).members;
    expect(members.map((m) => [m.id, m.currentDressphere])).toEqual([['yuna', 'white-mage'], ['rikku', 'dark-knight'], ['paine', 'warrior']]);
    expect(chapter.enemyGroupRef.enemies.map((e) => e.id)).toEqual(['bahamut']);
  });

  it('leaves Chapter IV as it was: its id, number 4, its own scene, listed, not an experiment', () => {
    expect([FFX2_BAHAMUT.id, FFX2_BAHAMUT.number, FFX2_BAHAMUT.sceneKey, FFX2_BAHAMUT.title, FFX2_BAHAMUT.experimental]).toEqual(['ffx2-bahamut', 4, 'bevelle-underground', 'Bahamut', undefined]);
    expect(CHAPTERS).toContain(FFX2_BAHAMUT);
    expect(getChapter('ffx2-bahamut')).toBe(FFX2_BAHAMUT);
    expect(getChapterMeta('ffx2-bahamut')!.numeral).toBe('IV');
  });
});

// ---------------------------------------------------------- the determinism proof

describe('the determinism proof: exp-yrp-3d plays to exactly the event log of ffx2-bahamut', () => {
  for (const seed of [1, 2, 3]) {
    it(`seed ${seed}: the same outcome, the same engine turns and the same event log (one digest), through the app's own path`, async () => {
      const mine = await playChain(chapter, seed, 'bench');
      const theirs = await playChain(FFX2_BAHAMUT, seed, 'bench');
      expect(mine.engineTurns, 'a whole fight was played').toBeGreaterThan(5);
      expect(mine).toEqual(theirs);
    }, 120_000);
  }

  it('is a proof that can fail: a different seed is a different log', async () => {
    expect((await playChain(chapter, 1, 'bench')).digest).not.toBe((await playChain(chapter, 2, 'bench')).digest);
  }, 120_000);
});

// ----------------------------------------------------- Mega Flare is the id the director takes

/** One fight of `chapter` on `seed` with the shipped autopilot line, the whole event log. */
function playLog(seed: number): BattleEvent[] {
  const engine = new FFX2Engine(ffx2EngineOptions());
  engine.init(setupForChapter(chapter, seed));
  for (let i = 0; i < 40_000; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const fallback: Command = { kind: 'defend', targets: [] };
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback);
  }
  return [...(engine.state() as Readonly<BattleState>).log];
}

describe('Mega Flare in a played fight', () => {
  it('the engine\'s action for Bahamut\'s finisher carries an id the director takes, and only Bahamut opens it', () => {
    const log = playLog(1);
    const starts = log.filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start');
    const megas = starts.filter((e) => e.abilityId !== undefined && MEGA_FLARE_IDS.includes(String(e.abilityId)));
    expect(megas.length, 'the autopilot line reaches Mega Flare').toBeGreaterThanOrEqual(1);
    for (const e of megas) expect(e.actorId).toBe('bahamut');
    const bahamutIds = new Set(starts.filter((e) => e.actorId === 'bahamut').map((e) => String(e.abilityId)));
    expect(bahamutIds.size, 'Bahamut uses several moves; only one is the finisher').toBeGreaterThan(1);
  }, 120_000);
});

// -------------------------------------------------------------------- its scene

describe('its scene', () => {
  it('is a real scene: a factory of its own, a row with the published slots, not a placeholder, and Chapter IV\'s plate behind it', () => {
    const entry = getScene('exp-yrp-3d-stage')!;
    expect(entry).toBe(EXP_YRP_SCENE_ENTRY);
    expect(entry).toMatchObject({ key: 'exp-yrp-3d-stage', placeholder: false });
    expect(entry.slots).toBe(EXP_YRP_SLOTS);
    expect(isPlaceholderScene('exp-yrp-3d-stage')).toBe(false);
    expect(SCENE_FACTORIES['exp-yrp-3d-stage']).toBeTypeOf('function');
    expect(SCENE_FACTORIES['exp-yrp-3d-stage']).not.toBe(SCENE_FACTORIES['bevelle-underground']);
    expect(sceneKeys()).toContain('exp-yrp-3d-stage');
    expect(backdropFileOf('exp-yrp-3d-stage')).toBe('bevelle-underground');
    expect(backdropFileOf('bevelle-underground')).toBe('bevelle-underground');
  });

  it('has a pyrefly canon row (FFX-2, the chamber\'s: machina, not spirits)', () => {
    const row = pyreflyCanonFor('exp-yrp-3d-stage')!;
    expect(row).toMatchObject({ game: 'ffx2', verdict: 'absent' });
    expect(row.cite).toBe(PYREFLY_CANON['exp-yrp-3d-stage']!.cite);
    expect(row.cite).toMatch(/Machina, not spirits/);
    expect(pyreflyCanonFor('bevelle-underground')!.verdict).toBe(row.verdict);
  });

  it('is the last row of the hidden chapters\' side table, which keeps every other row in order', () => {
    expect(EXPERIMENT_SCENE_ENTRIES.at(-1)).toBe(EXP_YRP_SCENE_ENTRY);
    expect(Object.keys(EXPERIMENT_SCENE_FACTORIES)).toContain('exp-yrp-3d-stage');
    expect(EXPERIMENT_SCENE_ENTRIES.map((e) => e.key)).toContain(EXP_LEBLANC_SCENE);
    expect(EXPERIMENT_SCENE_ENTRIES).toHaveLength(10);
  });
});
