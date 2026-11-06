/**
 * **The hidden Wind Waker chapter** (`exp-windwaker`, number 32; branches `exp-windwaker` and `ch-waker`; **FFX-2 only**, AGENTS.md rule 14): hidden chapter 24's Valefor fight, opened by the typed word `waker` and drawn in the
 * style of Wind Waker HD.
 *
 * What this file pins:
 *
 * 1. **It is a hidden experiment, not a chapter**: registered with the experiments (`chapters-experiments.ts`), in neither `CHAPTERS` nor `CHAPTER_IDS` (every count stays nineteen), number 32,
 *    `experimental` (its attempts, clears and time go to the experiments' store, never the save), pause metadata in `UNLISTED_CHAPTER_META` with the EXP numeral, FFX-2 in the tactics' game table.
 * 2. **It is chapter 24's encounter, by reference**: the same party build, formation, scripts, music, Sensor line and card words; only the id, the number, the scene key and the title are its own. **No battle data of its
 *    own** (AGENTS.md rule 6). Chapter 24's own record is untouched.
 * 3. **The determinism proof**: the seeded FFX-2 engine, played through the app's own path with the shipped autopilot line, makes exactly chapter 24's event log on every seed tried.
 * 4. **Its scene**: a real scene row, a canon row (FFX-2), the backdrop file chapter 24's plate (so the board, the prep wash and the cutscenes find a picture), the side table with its row.
 * 5. **The models are local files that ship**: `public/models-exp/` is gitignored (the repo is public), `tools/dist-filter.mjs` names `models-exp/windwaker/**` as shipped (and leaves every other experiment's models out), and
 *    `tools/ww/ww-models.json` lists exactly the eleven files the chapter loads (`tests/unit/ww-models-tool.test.ts`).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import type { Command } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { contentReport, ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { EXP_WINDWAKER, EXP_WINDWAKER_TEXT } from '../../../src/data/chapter-exp-windwaker.ts';
import { EXP_WINDWAKER_META } from '../../../src/data/chapter-meta-exp-windwaker.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_VALEFOR_BESAID } from '../../../src/data/chapter-ffx2-valefor-besaid.ts';
import { DJOSE_CHAMBER_PLATE } from '../../../src/data/ixion-plates.ts';
import { EXP_WINDWAKER_ID, EXP_WINDWAKER_SCENE, WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../../../src/data/windwaker-ids.ts';
import { PYREFLY_CANON, pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, PARTY_SLOTS, WW_BOSS_ID, WW_PARTY_IDS } from '../../../src/engine/ww3d/layout.ts';
import { EXPERIMENT_SCENE_ENTRIES, EXPERIMENT_SCENE_FACTORIES } from '../../../src/scenes/experiment-scenes.ts';
import { EXP_WINDWAKER_SCENE_ENTRY, EXP_WINDWAKER_SLOTS, paintedForced } from '../../../src/scenes/exp-windwaker-stage.ts';
import { SCENE_FACTORIES, getScene, isPlaceholderScene, sceneKeys } from '../../../src/scenes/index.ts';
import { isUnshippedPublicFile } from '../../../tools/dist-filter.mjs';
import { playChain } from '../helpers/ffx2ChainPlay.ts';

const chapter = getChapter(EXP_WINDWAKER_ID)!;
const base = FFX2_VALEFOR_BESAID;

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  it('is registered with the experiments and not with the nineteen: number 32, FFX-2, experimental, on its own scene', () => {
    expect(chapter).toBeDefined();
    expect(chapter).toBe(EXP_WINDWAKER);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('exp-windwaker');
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('exp-windwaker');
    expect((CHAPTER_IDS as readonly string[]).includes('exp-windwaker')).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect([chapter.id, chapter.number, chapter.game, chapter.experimental, chapter.sceneKey]).toEqual(['exp-windwaker', 32, 'ffx2', true, 'exp-windwaker-stage']);
    expect([EXP_WINDWAKER_ID, EXP_WINDWAKER_SCENE]).toEqual(['exp-windwaker', 'exp-windwaker-stage']); // the no-import ids module says what the record says
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length); // every number is its own
  });

  it('wears the working title, labelled as one, awaiting Bailey\'s pick', () => {
    expect(chapter.title).toBe('Valefor at Besaid (Wind Waker)');
    expect(EXP_WINDWAKER_TEXT.title).toBe(chapter.title);
    expect(chapter.title).not.toBe(base.title);
  });

  it('its pause metadata is the hidden one: EXP, chapter 24\'s objectives, tip, quote and snapshots, found by id and not among the listed nineteen', () => {
    const meta = getChapterMeta('exp-windwaker')!;
    const parent = getChapterMeta('ffx2-valefor-besaid')!;
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === 'exp-windwaker')).toBe(meta);
    expect(meta).toBe(EXP_WINDWAKER_META);
    expect(CHAPTER_META.map((m) => m.id as string)).not.toContain('exp-windwaker');
    expect([meta.numeral, meta.title, meta.gameLabel]).toEqual(['EXP', chapter.title, 'FFX-2']);
    for (const key of ['subtitle', 'location', 'blurb', 'heroArt', 'heroArtFallback', 'quote', 'handwritten', 'objectives', 'tip', 'snapshots', 'focalCharacterId', 'musicKeys'] as const) {
      expect(meta[key], key).toBe(parent[key]);
    }
  });

  it('is FFX-2 in the tactics\' game table (so the advisor and the guide never read it as FFX)', () => {
    expect(CHAPTER_GAME['exp-windwaker']).toBe('ffx2');
    expect(CHAPTER_GAME['ffx2-valefor-besaid']).toBe('ffx2');
  });
});

describe('it is chapter 24\'s encounter, by reference', () => {
  it('shares the build, the formation, the scripts, the music, the Sensor lines and the card words with chapter 24', () => {
    for (const key of ['game', 'buildRef', 'enemyGroupRef', 'scriptsRef', 'music', 'sensorTexts', 'subtitle', 'location', 'blurb', 'thumbnailKey'] as const) {
      expect(chapter[key], key).toBe(base[key]);
    }
    const mine = setupForChapter(chapter, 3);
    const theirs = setupForChapter(base, 3);
    expect(mine.party).toBe(theirs.party);
    expect(mine.enemies).toBe(theirs.enemies);
    expect(mine.triggers).toEqual(theirs.triggers);
    expect(mine).toEqual(theirs);
  });

  it('keeps the existing party and boss: Yuna, Rikku and Paine in chapter 24\'s dresspheres against Valefor, no data of its own', () => {
    const members = (chapter.buildRef as { members: Array<{ id: string; currentDressphere: string }> }).members;
    expect(members.map((m) => [m.id, m.currentDressphere])).toEqual([['yuna', 'white-mage'], ['rikku', 'dark-knight'], ['paine', 'warrior']]);
    expect(members.map((m) => m.id)).toEqual([...WW_PARTY_IDS]); // the model files are named for them
    expect(chapter.enemyGroupRef.enemies.map((e) => e.id)).toEqual(['x2-valefor']);
    expect(chapter.enemyGroupRef.enemies[0]!.id).toBe(WW_BOSS_ID);
  });

  it('leaves chapter 24 as it was: its id, number 24, its own scene, hidden, not this chapter', () => {
    expect([base.id, base.number, base.sceneKey, base.title, base.experimental]).toEqual(['ffx2-valefor-besaid', 24, DJOSE_CHAMBER_PLATE, 'Valefor', true]);
    expect(getChapter('ffx2-valefor-besaid')).toBe(base);
    expect(getChapterMeta('ffx2-valefor-besaid')!.title).toBe('Valefor');
  });
});

// ---------------------------------------------------------- the determinism proof

/** Each fight is played once: the proof and its control share the logs. */
const played = new Map<string, ReturnType<typeof playChain>>();
const play = (c: typeof chapter, seed: number): ReturnType<typeof playChain> => {
  const key = `${c.id}:${seed}`;
  if (!played.has(key)) played.set(key, playChain(c, seed, 'bench'));
  return played.get(key)!;
};

describe('the determinism proof: exp-windwaker plays to exactly the event log of ffx2-valefor-besaid', () => {
  // The engine reads its abilities and its enemies' AI from the registries the app fills at start (`playChain`: "the caller has run `registerBattleContent`"). Without them Valefor is the engine's stub: on seed 1 she takes
  // 45 no-op actions and never harms the party (93 turns), and "the same log as chapter 24" would be a proof about two stubs. The review of 2026-11-02 (MAJ-1) found this file did not register.
  beforeAll(async () => {
    await registerBattleContent();
  });

  it('is played with the real Valefor, not the engine stub: the content is registered and she acts about a dozen times, not 45', async () => {
    expect(contentReport().abilitiesFfx2, 'the FFX-2 abilities are registered').toBeGreaterThan(0);
    const mine = await play(chapter, 1);
    expect(mine.outcome).toBe('victory');
    expect(mine.enemyActions, 'the real AI acts a handful of times (12 on seed 1); the stub 45').toBeGreaterThan(5);
    expect(mine.enemyActions).toBeLessThan(30);
    expect(mine.engineTurns, 'the real fight is 53 turns on seed 1; the stub 93').toBeLessThan(80);
  }, 240_000);

  for (const seed of [1, 2]) {
    it(`seed ${seed}: the same outcome, the same engine turns and the same event log (one digest), through the app's own path`, async () => {
      const mine = await play(chapter, seed);
      const theirs = await play(base, seed);
      expect(mine.engineTurns, 'a whole fight was played').toBeGreaterThan(5);
      expect(mine).toEqual(theirs);
    }, 240_000);
  }

  it('is a proof that can fail: a different seed is a different log', async () => {
    expect((await play(chapter, 1)).digest).not.toBe((await play(chapter, 2)).digest);
  }, 240_000);

  // The defeat path (the review of 2026-11-02 checked one seed by hand): the party starts at 1 HP and only attacks, so Valefor's real moves fell all three girls; the two chapters must fall the same way.
  /** One fight to its end with the party at 1 HP and the attack-only fallback; the outcome, the engine turns, the party's knock-outs and the digest of the whole log. */
  function playDefeat(c: typeof chapter, seed: number): { outcome: string; turns: number; partyKos: number; digest: string } {
    const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    const setup = setupForChapter(c, seed);
    engine.setSeed(setup.seed);
    engine.init(setup);
    for (const m of Object.values(engine.state().combatants)) if (m.side === 'party') (m as { hp: number }).hp = 1;
    for (let i = 0; i < 40_000; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'resolved') continue;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind === 'battle-over') {
        const state = engine.state();
        const partyKos = state.log.filter((e) => e.type === 'ko' && state.combatants[e.targetId]?.side === 'party').length;
        return { outcome: String(d.result.outcome), turns: d.result.turns, partyKos, digest: createHash('sha1').update(JSON.stringify(state.log)).digest('hex') };
      }
      const row = d.commands.find((r) => r.enabled && r.command.kind === 'attack') ?? d.commands.find((r) => r.enabled);
      const target = row?.validTargets[0];
      engine.submit((row ? { ...row.command, targets: target ? [target] : [] } : { kind: 'defend', targets: [] }) as Command);
    }
    return { outcome: 'unresolved', turns: 0, partyKos: 0, digest: '' };
  }

  it('seed 1, a defeat: the party at 1 HP falls to Valefor, all three girls, and the log is chapter 24\'s to the byte', () => {
    const mine = playDefeat(chapter, 1);
    expect(mine.outcome).toBe('defeat');
    expect(mine.partyKos).toBe(3);
    expect(mine).toEqual(playDefeat(base, 1));
  }, 240_000);
});

// -------------------------------------------------------------------- its scene

describe('its scene', () => {
  it('is a real scene: a factory of its own, a row with the published slots, not a placeholder, and chapter 24\'s plate behind the board', () => {
    const entry = getScene('exp-windwaker-stage')!;
    expect(entry).toBe(EXP_WINDWAKER_SCENE_ENTRY);
    expect(entry).toMatchObject({ key: 'exp-windwaker-stage', placeholder: false });
    expect(entry.slots).toBe(EXP_WINDWAKER_SLOTS);
    expect(isPlaceholderScene('exp-windwaker-stage')).toBe(false);
    expect(SCENE_FACTORIES['exp-windwaker-stage']).toBeTypeOf('function');
    expect(SCENE_FACTORIES['exp-windwaker-stage']).not.toBe(SCENE_FACTORIES[DJOSE_CHAMBER_PLATE]);
    expect(sceneKeys()).toContain('exp-windwaker-stage');
    expect(backdropFileOf('exp-windwaker-stage')).toBe(DJOSE_CHAMBER_PLATE);
    expect(backdropFileOf(DJOSE_CHAMBER_PLATE)).toBe(DJOSE_CHAMBER_PLATE);
  });

  it('publishes the lab\'s staging: the party\'s three slots and Valefor\'s spot, held, with the heights', () => {
    expect(EXP_WINDWAKER_SLOTS.party).toEqual(PARTY_SLOTS.slice(0, 3).map((s) => [...s]));
    expect(EXP_WINDWAKER_SLOTS.enemy).toEqual(ENEMY_SLOTS.map((s) => [...s]));
    expect(EXP_WINDWAKER_SLOTS.enemy[0]).toEqual([...BOSS_SPOT]);
    expect(EXP_WINDWAKER_SLOTS).toMatchObject({ partyHeight: PARTY_HEIGHT, enemyHeight: BOSS_HEIGHT, holdParty: true });
    expect(EXP_WINDWAKER_SLOTS.enemySpots).toEqual({ [WW_BOSS_ID]: [...BOSS_SPOT] });
    expect(EXP_WINDWAKER_SLOTS.figureHeights).toEqual({ [WW_BOSS_ID]: BOSS_HEIGHT });
  });

  it('has a pyrefly canon row (FFX-2, unattested: no source describes the room or names particles in it)', () => {
    const row = pyreflyCanonFor('exp-windwaker-stage')!;
    expect(row).toMatchObject({ game: 'ffx2', verdict: 'unattested' });
    expect(row.cite).toBe(PYREFLY_CANON['exp-windwaker-stage']!.cite);
    expect(row.cite).toMatch(/no source describes Besaid/);
  });

  it('is the row of the hidden chapters\' side table just before the anime chapter\'s (the last since 2026-11-06), which keeps every other row in order', () => {
    expect(EXPERIMENT_SCENE_ENTRIES.at(-2)).toBe(EXP_WINDWAKER_SCENE_ENTRY);
    expect(Object.keys(EXPERIMENT_SCENE_FACTORIES)).toContain('exp-windwaker-stage');
  });

  it('plays chapter 24\'s own scene for the comparison with `?ww=painted`, and the 3D one for anything else', () => {
    expect(paintedForced('?ww=painted')).toBe(true);
    expect(paintedForced('')).toBe(false);
    expect(paintedForced('?ww=classic')).toBe(false);
    expect(paintedForced('?ww=hd')).toBe(false);
  });
});

// ------------------------------------------------- the models are local files that ship

describe('the models are local files that the build ships', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));

  it('keeps the model, prop and temple folders under public/models-exp/windwaker and ships them in every build (Chapter 32, 2026-11-02)', () => {
    for (const dir of [WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR]) expect(dir.startsWith('models-exp/windwaker')).toBe(true);
    for (const rel of ['yuna', 'rikku', 'paine', 'valefor'].map((n) => `${WW_MODEL_DIR}/${n}.glb`)) expect(isUnshippedPublicFile(rel), rel).toBe(false);
    for (const rel of ['pistol', 'dagger', 'sword'].map((n) => `${WW_PROP_DIR}/${n}.glb`)) expect(isUnshippedPublicFile(rel), rel).toBe(false);
    for (const rel of ['wall', 'door', 'brazier', 'pillar'].map((n) => `${WW_TEMPLE_DIR}/${n}.glb`)) expect(isUnshippedPublicFile(rel), rel).toBe(false);
    // an allow-list: another experiment's models (one whose folder no set names) still stay out of every build. The 3D Bahamut's own set (Chapter 31) ships since ch-yrp, beside this folder (r74 integration:
    // `yrp/yuna.glb` is one of its 43 files, `yrp/bahamut-ai.glb` is not)
    expect(isUnshippedPublicFile('models-exp/some-new-experiment/yuna.glb')).toBe(true);
    expect(isUnshippedPublicFile('models-exp/yrp/yuna.glb')).toBe(false);
    expect(isUnshippedPublicFile('models-exp/yrp/bahamut-ai.glb')).toBe(true);
  });

  it('is gitignored: the repo is public and the files are large', () => {
    const ignore = readFileSync(join(root, '.gitignore'), 'utf8').split(/\r?\n/);
    expect(ignore).toContain('public/models-exp/');
  });
});
