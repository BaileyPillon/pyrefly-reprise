/**
 * **The hidden Fayth chapter** (`exp-fayth`, chapter 22; branch `fayth-3d`; **FFX only**, AGENTS.md rule 14): Evrae on the Fahrenheit's deck, Chapter VIII's encounter, opened by the typed word
 * `fayth` and fought with FFX's own battle camera (D-632; today the camera is Chapter VIII's, the director on the scene being a stub).
 *
 * What this file pins:
 *
 * 1. **It is a hidden experiment, not a chapter**: registered with the experiments (`chapters-experiments.ts`), in neither `CHAPTERS` nor `CHAPTER_IDS` (so every count stays eighteen), number 22,
 *    `experimental` (its attempts, clears and time go to the experiments' store, never the save), pause metadata in `UNLISTED_CHAPTER_META` with the EXP numeral.
 * 2. **It is Chapter VIII's encounter, by reference**: the same party build, formation, scripts, music, Sensor line and card words; only the id, the number, the scene key and the title are its own.
 *    Chapter VIII's own record, scene and metadata are untouched.
 * 3. **The determinism proof**: the seeded FFX engine plays `exp-fayth` to exactly Chapter VIII's event log, event for event, on every seed tried (the shipped autopilot line, as the Leblanc preview's
 *    proof does for Chapter VI).
 * 4. **Its scene**: `exp-fayth-deck` is a real scene (a factory, a row with the deck's slots, a pyrefly canon row citing the Evrae research), and the hidden chapters' scene rows that moved to the side
 *    table (`scenes/experiment-scenes.ts`) are all still registered, unchanged.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { EXP_LEBLANC_SCENE } from '../../../src/data/art/artNamespace.ts';
import { EXP_FAYTH, EXP_FAYTH_TEXT } from '../../../src/data/chapter-exp-fayth.ts';
import { EXP_FAYTH_META } from '../../../src/data/chapter-meta-exp-fayth.ts';
import { EVRAE_META } from '../../../src/data/chapter-meta-evrae.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EVRAE_AIRSHIP, EXPERIMENT_CHAPTERS, getChapter, type Chapter } from '../../../src/data/encounters.ts';
import { EXPERIMENT_GROUNDS_PLATE } from '../../../src/data/experiment-plates.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { EXP_FAYTH_ID, EXP_FAYTH_SCENE } from '../../../src/data/ffx/exp-fayth-ids.ts';
import { MUSHROOM_ROCK_SCENE } from '../../../src/data/ffx/sinspawn-gui-ids.ts';
import { GAGAZET_RONSO_SCENE } from '../../../src/data/ffx/biran-yenke-ids.ts';
import { TOURIST_TRAP_SCENE } from '../../../src/data/tourist-trap-ids.ts';
import { ANGRA_MAINYU_SCENE } from '../../../src/data/angra-mainyu-ids.ts';
import { MIRROR_AEONS_SCENE } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { LAST_SUMMONING_SCENE } from '../../../src/data/ffx/last-summoning-ids.ts';
import { EXP_YRP_SCENE } from '../../../src/data/yrp-ids.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { PYREFLY_CANON, pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../../src/scenes/evrae-airship-deck.ts';
import { EXPERIMENT_SCENE_ENTRIES, EXPERIMENT_SCENE_FACTORIES } from '../../../src/scenes/experiment-scenes.ts';
import { SCENE_FACTORIES, getScene, getSceneFactory, isPlaceholderScene, sceneKeys } from '../../../src/scenes/index.ts';

const chapter = getChapter(EXP_FAYTH_ID)!;

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  it('is registered with the experiments and not with the eighteen: number 22, FFX, experimental, on its own scene', () => {
    expect(chapter).toBe(EXP_FAYTH);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('exp-fayth');
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('exp-fayth');
    expect((CHAPTER_IDS as readonly string[]).includes('exp-fayth')).toBe(false);
    expect([chapter.id, chapter.number, chapter.game, chapter.experimental, chapter.sceneKey]).toEqual(['exp-fayth', 22, 'ffx', true, 'exp-fayth-deck']);
    expect([EXP_FAYTH_ID, EXP_FAYTH_SCENE]).toEqual(['exp-fayth', 'exp-fayth-deck']); // the no-import ids module says what the record says
  });

  it('wears the working title, awaiting Bailey\'s pick', () => {
    expect(chapter.title).toBe('Evrae, FFX Camera (Experimental)');
    expect(EXP_FAYTH_TEXT.title).toBe(chapter.title);
  });

  it('its pause metadata is the hidden one: EXP, Chapter VIII\'s objectives, tip, quote and snapshots by reference, found by id and not among the listed eighteen', () => {
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === 'exp-fayth')).toBe(EXP_FAYTH_META);
    expect(getChapterMeta('exp-fayth')).toBe(EXP_FAYTH_META);
    expect(CHAPTER_META.map((m) => m.id as string)).not.toContain('exp-fayth');
    expect(EXP_FAYTH_META.numeral).toBe('EXP');
    expect(EXP_FAYTH_META.title).toBe(chapter.title);
    for (const key of ['subtitle', 'location', 'blurb', 'heroArt', 'heroArtFallback', 'quote', 'handwritten', 'objectives', 'tip', 'snapshots', 'focalCharacterId', 'musicKeys'] as const) {
      expect(EXP_FAYTH_META[key], key).toBe(EVRAE_META[key]);
    }
  });
});

describe('it is Chapter VIII\'s encounter, by reference', () => {
  it('shares the build, the formation, the scripts, the music, the Sensor lines and the card words with Chapter VIII', () => {
    for (const key of ['game', 'buildRef', 'enemyGroupRef', 'scriptsRef', 'music', 'sensorTexts', 'subtitle', 'location', 'blurb', 'thumbnailKey'] as const) {
      expect(chapter[key], key).toBe(EVRAE_AIRSHIP[key]);
    }
    const mine = setupForChapter(chapter, 3);
    const theirs = setupForChapter(EVRAE_AIRSHIP, 3);
    expect(mine.party).toBe(theirs.party);
    expect(mine.enemies).toBe(theirs.enemies);
    expect(mine.triggers).toEqual(theirs.triggers);
    expect(mine).toEqual(theirs);
  });

  it('leaves Chapter VIII as it was: its id, number 8, its own scene, listed, not an experiment, and its metadata', () => {
    expect([EVRAE_AIRSHIP.id, EVRAE_AIRSHIP.number, EVRAE_AIRSHIP.sceneKey, EVRAE_AIRSHIP.title, EVRAE_AIRSHIP.experimental]).toEqual(['evrae-airship', 8, 'evrae-airship-deck', 'Evrae', undefined]);
    expect(CHAPTERS).toContain(EVRAE_AIRSHIP);
    expect(getChapter('evrae-airship')).toBe(EVRAE_AIRSHIP);
    expect([EVRAE_META.id, EVRAE_META.numeral, EVRAE_META.title]).toEqual(['evrae-airship', 'VIII', 'Evrae']);
    expect(CHAPTER_META.find((m) => m.id === 'evrae-airship')).toBe(EVRAE_META);
  });
});

// ---------------------------------------------------------- the determinism proof

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

/** One whole fight of `c`, from its own setup, answering every menu with the shipped autopilot line (`intendedStrategy`), like the Leblanc preview's proof; the outcome and every event, hashed. */
function play(c: Chapter, seed: number): { outcome: string; events: number; hash: string } {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupForChapter(c, seed));
  let outcome = 'unresolved';
  for (let i = 0; i < 40_000; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String(d.result.outcome);
      break;
    }
    if (d.kind !== 'player-input') continue;
    const fallback: Command = { kind: 'defend', targets: [] };
    engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback);
  }
  const log = engine.state().log;
  return { outcome, events: log.length, hash: createHash('sha256').update(JSON.stringify(log)).digest('hex').slice(0, 16) };
}

describe('the determinism proof: exp-fayth plays to exactly the event log of evrae-airship', () => {
  for (const seed of [1, 2, 3, 4]) {
    it(`seed ${seed}: the same outcome, the same number of events and the same event log, event for event`, () => {
      const mine = play(chapter, seed);
      const theirs = play(EVRAE_AIRSHIP, seed);
      expect(mine.outcome, 'the fight ended').not.toBe('unresolved');
      expect(mine.events, 'a whole fight was played').toBeGreaterThan(100);
      expect(mine).toEqual(theirs);
    });
  }

  it('is a proof that can fail: a different seed is a different log', () => {
    expect(play(chapter, 1).hash).not.toBe(play(chapter, 2).hash);
  });
});

// -------------------------------------------------------------------- its scene

describe('its scene', () => {
  it('is a real scene: a factory of its own, a row with the deck\'s slots (so Chapter VIII\'s heights and pins hold), not a placeholder', () => {
    const entry = getScene('exp-fayth-deck')!;
    expect(entry).toMatchObject({ key: 'exp-fayth-deck', placeholder: false });
    expect(entry.slots).toBe(EVRAE_AIRSHIP_DECK_SLOTS);
    expect(isPlaceholderScene('exp-fayth-deck')).toBe(false);
    expect(getSceneFactory('exp-fayth-deck')).toBeTypeOf('function');
    expect(getSceneFactory('exp-fayth-deck')).not.toBe(getSceneFactory('evrae-airship-deck'));
    expect(sceneKeys()).toContain('exp-fayth-deck');
  });

  it('has a pyrefly canon row (FFX, open sky) that cites the Evrae research', () => {
    const row = pyreflyCanonFor('exp-fayth-deck')!;
    expect(row).toMatchObject({ game: 'ffx', verdict: 'absent' });
    expect(row.cite).toMatch(/research\/ffx-evrae-airship\.md/);
    expect(row.cite).toBe(PYREFLY_CANON['exp-fayth-deck']!.cite);
  });

  it('the hidden chapters\' scenes moved to the side table are all still registered, row for row, with the factories they had', () => {
    const keys = [EXPERIMENT_GROUNDS_PLATE, EXP_LEBLANC_SCENE, MUSHROOM_ROCK_SCENE, EXP_FAYTH_SCENE, TOURIST_TRAP_SCENE, GAGAZET_RONSO_SCENE, ANGRA_MAINYU_SCENE, MIRROR_AEONS_SCENE, LAST_SUMMONING_SCENE, EXP_YRP_SCENE]; // the 3D Bahamut's chamber (FFX-2, 2026-10-19) is the last row; the Tourist Trap's cavern (FFX-2, 2026-10-14) is the fifth row, the Mountain Gate (FFX, Biran and Yenke, 2026-10-14) the sixth, Angra Mainyu's desert (FFX-2, 2026-10-14) the seventh, Mirror Aeons' two-plate stage (FFX, 2026-10-15) the eighth
    expect(EXPERIMENT_SCENE_ENTRIES.map((e) => e.key)).toEqual(keys);
    expect(Object.keys(EXPERIMENT_SCENE_FACTORIES).sort()).toEqual([...keys].sort());
    for (const key of keys) {
      expect(getScene(key), key).toBe(EXPERIMENT_SCENE_ENTRIES.find((e) => e.key === key));
      expect(getScene(key)!.placeholder, key).toBe(false);
      expect(SCENE_FACTORIES[key], key).toBe(EXPERIMENT_SCENE_FACTORIES[key]);
      expect(pyreflyCanonFor(key), `${key} keeps its pyrefly canon row`).toBeDefined();
    }
    // Their titles and games are the ones they were registered with.
    expect(getScene(EXP_LEBLANC_SCENE)!.title).toBe('Chateau Leblanc — the Last Room (new art)');
    expect(getScene(EXPERIMENT_GROUNDS_PLATE)!.title).toBe("Djose Temple — the Machine Faction's grounds");
    expect(getScene(MUSHROOM_ROCK_SCENE)!.title).toBe("Mushroom Rock Road — Operation Mi'ihen");
  });
});
