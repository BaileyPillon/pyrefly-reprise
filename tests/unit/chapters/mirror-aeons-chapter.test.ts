// @vitest-environment jsdom
/**
 * Mirror Aeons (the Dark Magus Sisters, then Dark Yojimbo, against Yuna's own Magus Sisters and Yojimbo; the hidden chapter 27): the chapter as the app sees it. **FFX only.**
 *
 * What this pins: the registration (hidden, number 27, nowhere in the eighteen, found by `getChapter`, its pause metadata, its two-plate scene, its music and the departure of Dark Yojimbo), the experiments' store
 * (attempts and clears never touch the save), the story (linted, attributed, the seam wired to the `all-ko` trigger), the guide card and document (cited, tied to the tactic's rows) and the advisor's line.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../../src/app/screens/frontend/chapterProgress.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, recordExperimentClear, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { MIRROR_AEONS, MIRROR_AEONS_ID, MIRROR_AEONS_TEXT } from '../../../src/data/chapter-mirror-aeons.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { darkAeonsGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID, MIRROR_ACT_I, MIRROR_ACT_I_PLATE, MIRROR_ACT_II_PLATE, MIRROR_AEONS_SCENE, MIRROR_SEAM } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { MIRROR_AEONS_GUIDE } from '../../../src/data/guides/mirror-aeons.ts';
import { MIRROR_AEONS_BOSS_IDS, mirrorAeons } from '../../../src/engine/tactics/mirror-aeons.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';
import { getScene, getSceneFactory, sceneKeys } from '../../../src/scenes/index.ts';
import { MIRROR_ENEMY_SPOTS, MIRROR_FIGURE_HEIGHTS, MIRROR_SLOTS } from '../../../src/scenes/mirror-aeons.ts';
import { MUSHROOM_PLATE_LOOK, MUSHROOM_SLOTS } from '../../../src/scenes/mushroom-rock-road.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, PRESENTER_BUDGET_MS, SEAM_BUDGET_MS, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { mirrorAeonsScripts } from '../../../src/story/scripts/mirror-aeons.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

const SISTER_IDS = [DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID];

// ----------------------------------------------------------------------------------------------------------------------------------------- registration

describe('the chapter is registered, hidden, and nowhere in the eighteen', () => {
  it('is found by id, FFX, an experiment numbered 27, in EXPERIMENT_CHAPTERS and neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(getChapter(MIRROR_AEONS_ID)).toBe(MIRROR_AEONS);
    expect(MIRROR_AEONS).toMatchObject({ id: 'mirror-aeons', game: 'ffx', number: 27, experimental: true, sceneKey: MIRROR_AEONS_SCENE });
    expect(EXPERIMENT_CHAPTERS).toContain(MIRROR_AEONS);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(MIRROR_AEONS_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(MIRROR_AEONS_ID)).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length);
  });

  it("is Act I's formation (the trio) chained to Act II's, our scripts and the generic boss cue then Yojimbo's own; the card's words carry no number", () => {
    expect(MIRROR_AEONS.enemyGroupRef).toBe(darkAeonsGroupOf(MIRROR_ACT_I));
    expect(MIRROR_AEONS.scriptsRef).toBe(mirrorAeonsScripts);
    expect(MIRROR_AEONS.buildRef).toBe(mirrorAeonsBuild);
    expect(MIRROR_AEONS.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-challenge', phase2: 'boss-yojimbo', victory: 'victory-ffx' });
    for (const key of Object.values(MIRROR_AEONS.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
    expect(Object.keys(MIRROR_AEONS.sensorTexts).sort()).toEqual([DARK_CINDY_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID].sort());
    expect(Object.values(MIRROR_AEONS_TEXT).join(' ')).not.toMatch(/\d/);
  });

  it('has pause metadata with the EXP numeral, three objectives the evaluator answers, and shipped art only', () => {
    const meta = getChapterMeta(MIRROR_AEONS_ID)!;
    expect(meta).toMatchObject({ id: MIRROR_AEONS_ID, gameLabel: 'FFX', numeral: 'EXP', title: MIRROR_AEONS_TEXT.title, focalCharacterId: 'yuna' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['parts-downed', 'link-reached', 'victory']);
    expect((meta.objectives[0]!.rule as unknown as { targetIds: string[] }).targetIds).toEqual(SISTER_IDS);
    expect(meta.objectives[1]!.rule).toEqual({ kind: 'link-reached', link: 2 });
    for (const k of meta.musicKeys) expect(hasTrack(k), k).toBe(true);
    for (const s of meta.snapshots) expect(s.image).toMatch(/^(backdrops|characters)\/[a-z0-9-]+(\/idle)?\.png$/);
    expect(meta.snapshots.map((s) => s.image)).toEqual(['backdrops/mushroom-rock-road.png', 'characters/cindy/idle.png', 'characters/yojimbo/idle.png']);
  });

  it('has a scene: the Mushroom Rock Road stage with this chapter\'s staging, whose swap knows the Cavern\'s plate; a canon row; Dark Yojimbo\'s body stays and the sisters dissolve', () => {
    expect(sceneKeys()).toContain(MIRROR_AEONS_SCENE);
    const entry = getScene(MIRROR_AEONS_SCENE)!;
    expect(entry.placeholder).toBe(false);
    expect(entry.slots).toBe(MIRROR_SLOTS);
    expect(getSceneFactory(MIRROR_AEONS_SCENE)).toBeTypeOf('function');
    expect(MIRROR_SLOTS.party).toEqual(MUSHROOM_SLOTS.party); // the road's party spots
    expect(Object.keys(MIRROR_ENEMY_SPOTS).sort()).toEqual([DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID].sort());
    expect(Object.keys(MIRROR_FIGURE_HEIGHTS).sort()).toEqual(Object.keys(MIRROR_ENEMY_SPOTS).sort());
    expect(MIRROR_SLOTS.enemySpots).toBe(MIRROR_ENEMY_SPOTS);
    expect(MUSHROOM_PLATE_LOOK[MIRROR_ACT_I_PLATE]).toMatchObject({ floorRow: 0.5 }); // the first plate is the scene's own key, `mushroom-rock-road`
    expect(MUSHROOM_PLATE_LOOK[MIRROR_ACT_II_PLATE]).toMatchObject({ floorRow: 0.95 }); // the Cavern's own floor row (CAVERN_PLATE)
    expect(pyreflyCanonFor(MIRROR_AEONS_SCENE)).toMatchObject({ game: 'ffx', verdict: 'unattested' });
    expect(departureKindOf(DARK_YOJIMBO_ID)).toBe('body');
    for (const id of SISTER_IDS) expect(departureKindOf(id)).toBe('dissolve');
  });

  it('the Mushroom Rock Road scene itself is untouched for Sinspawn Gui: its two looks, its slots and its enemy spots', () => {
    expect(Object.keys(MUSHROOM_PLATE_LOOK).sort()).toEqual(['cavern-stolen-fayth', 'mushroom-rock-road-ruined', 'mushroom-rock-road'].sort());
    expect(Object.keys(MUSHROOM_SLOTS.enemySpots ?? {}).sort()).toEqual(['sinspawn-gui', 'sinspawn-gui-2', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right', 'sinspawn-gui-head']);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the store

describe("an experiment, not a chapter: the board, the experiments' store and the save", () => {
  const WITH_CARD = { experiments: EXPERIMENT_CHAPTERS.filter((c) => c.id === MIRROR_AEONS_ID) } as const;
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has no card by default; handed in, it is an FFX card labelled EXP', () => {
    expect(buildChapterTiles(save)).toHaveLength(18);
    const tiles = buildChapterTiles(save, WITH_CARD);
    expect(tiles).toHaveLength(19);
    expect(tiles.find((t) => t.id === MIRROR_AEONS_ID)).toMatchObject({ id: MIRROR_AEONS_ID, numeral: 'EXP', title: MIRROR_AEONS_TEXT.title, game: 'ffx', sceneKey: MIRROR_AEONS_SCENE, playable: true });
  });

  it("keeps its attempts and clears in the experiments' store and writes nothing to the save", () => {
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt(MIRROR_AEONS_ID);
    experimentProgress.recordClear(MIRROR_AEONS_ID, 480_000, 40);
    expect(experimentRecord(MIRROR_AEONS_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 480_000 });
    expect(Object.keys(JSON.parse(store[EXPERIMENTS_KEY]!))).toEqual([MIRROR_AEONS_ID]);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(save.snapshot().chapters[MIRROR_AEONS_ID]).toBeUndefined();
    expect(window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '').not.toContain(MIRROR_AEONS_ID);
  });

  it("shows the cleared ribbon from the experiments' store, never from the save, and no part of 'N of 18'", () => {
    const card = (): { cleared: boolean } => buildChapterTiles(save, WITH_CARD).find((t) => t.id === MIRROR_AEONS_ID)!;
    expect(card().cleared).toBe(false);
    recordExperimentClear(MIRROR_AEONS_ID, 99_000);
    expect(card().cleared).toBe(true);
    expect(save.isCleared(MIRROR_AEONS_ID)).toBe(false);
    const progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect([progress.beaten, progress.total]).toEqual([0, 18]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the story

describe('the story: our own words, attributed, linted, short; the seam is wired to the sisters\' fall', () => {
  const S = mirrorAeonsScripts;
  const speakers = new Set(['tidus', 'yuna', 'auron', 'wakka', 'lulu']);
  const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

  it('lints clean: a scene before the fight and one before the results; two mid-battle scripts, each trigger naming a script that exists', () => {
    expect(lintScript(S.pre)).toEqual([]);
    expect(lintScript(S.post)).toEqual([]);
    expect(S.pre.at(-1)!.type).toBe('battleStart');
    expect(S.post.at(-1)!.type).toBe('results');
    expect(S.victoryQuips).toEqual({});
    expect(Object.keys(S.midScripts).sort()).toEqual([MIRROR_SEAM, 'dark-yojimbo-ready'].sort());
    for (const trigger of S.mid) {
      expect(S.midScripts[trigger.script], trigger.id).toBeDefined();
      expect(lintScript(S.midScripts[trigger.script]!), trigger.id).toEqual([]);
    }
  });

  it('the seam fires on the all-ko of the three sisters, once; the callout on Dark Yojimbo\'s gauge; the seam ends on a white flash that hides the plate swap', () => {
    const seam = S.mid.find((t) => t.id === MIRROR_SEAM)!;
    expect(seam).toMatchObject({ once: true, script: MIRROR_SEAM });
    expect(seam.when).toEqual({ type: 'all-ko', ids: SISTER_IDS });
    expect(S.mid.find((t) => t.id === 'dark-yojimbo-ready')!.when).toEqual({ type: 'overdrive', who: DARK_YOJIMBO_ID });
    const steps = S.midScripts[MIRROR_SEAM]!;
    expect(steps.some((s) => s.type === 'flash' || s.type === 'fade')).toBe(true);
    expect(steps.filter((s) => s.type === 'flash').length).toBeGreaterThanOrEqual(1);
  });

  it("the seam fits the seam budget and the callout the interrupt budget, and the runner's deadline stays under the presenter's abandon time", () => {
    const seam = S.midScripts[MIRROR_SEAM]!;
    const callout = S.midScripts['dark-yojimbo-ready']!;
    expect(scriptDurationMs(seam)).toBeLessThanOrEqual(SEAM_BUDGET_MS);
    expect(scriptDurationMs(callout)).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    expect(midBattleDeadlineMs(seam)).toBeLessThan(PRESENTER_BUDGET_MS);
    expect(midBattleDeadlineMs(callout)).toBe(MID_SCRIPT_BUDGET_MS);
  });

  it('is short and spoken only by the party; the post scene is the cavern', () => {
    expect(lines(S.pre)).toHaveLength(8);
    expect(lines(S.post)).toHaveLength(8);
    for (const script of [S.pre, S.post]) for (const l of lines(script)) if (l.type === 'say') expect(speakers.has(l.who), String(l.who)).toBe(true);
    expect(S.post.some((s) => s.type === 'backdrop' && (s as unknown as { key?: string; plate?: string }).key === MIRROR_ACT_II_PLATE || JSON.stringify(s).includes(MIRROR_ACT_II_PLATE))).toBe(true);
  });

  it('quotes nothing of the game and names no source', () => {
    const all = [...lines(S.pre), ...lines(S.post), ...Object.values(S.midScripts).flatMap((m) => lines(m))].map((l) => l.text).join(' ');
    expect(all).not.toMatch(/§|\bffx2?-|re-ffx/i);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the guide and the tactic

describe('the guide card and document, and the line they teach', () => {
  const cite = /^(ffx|re-ffx|jegged)-[a-z0-9-]+( §|;|$)/;

  it('the card is registered under the chapter id and all four Dark Aeons, and every sentence it prints is cited in the corpus form', () => {
    expect(GUIDES.find((g) => g.id === MIRROR_AEONS_ID)).toBe(MIRROR_AEONS_GUIDE);
    expect(MIRROR_AEONS_GUIDE.bossIds).toEqual([DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID, DARK_YOJIMBO_ID]);
    for (const r of MIRROR_AEONS_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of MIRROR_AEONS_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of MIRROR_AEONS_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
  });

  it('says what the files and the engine say: an aeon takes the big move, a blade cannot find Mindy, blades for Cindy and Sandy, Zanmato a long shot; and no number', () => {
    const text = MIRROR_AEONS_GUIDE.rules.map((r) => r.text).join(' ');
    expect(text).toMatch(/Send an aeon in before the big move/);
    expect(text).toMatch(/Auto-Life does not turn either/);
    expect(text).toMatch(/Blades for Cindy and Sandy, spells for Mindy/);
    expect(text).toMatch(/Zanmato|long shot/);
    expect(text).not.toMatch(/\d/);
  });

  it('the document names the pools the records hold, the Steal and the Drops, and is registered; Mindy\'s page says a blade almost never finds her', () => {
    const doc = docForChapter(MIRROR_AEONS_ID)!;
    expect(doc).toMatchObject({ id: MIRROR_AEONS_ID, game: 'ffx', bossIds: [DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID, DARK_YOJIMBO_ID] });
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.filter((l) => l.label === 'Drops').map((l) => l.items)).toEqual([['Dark Matter (common)', 'Master Sphere (rare)'], ['Dark Matter (common)', 'Master Sphere (rare)']]);
    expect(lists.filter((l) => l.label === 'Steal')[1]!.items).toEqual(['Stamina Tonic x2 (common)', 'Elixir (rare)']);
    const fields = doc.blocks.filter((b) => b.t === 'field' && b.label === 'HP').map((b) => (b as unknown as { value: string }).value);
    expect(fields).toEqual(['3,000,000', '2,500,000', '2,000,000', '1,600,000']);
    expect(JSON.stringify(doc)).toMatch(/almost impossible to hit with a blade/);
  });

  it('every label a hint speaks to is a row the tactic asks for', () => {
    const asked = ['Quick Hit', 'Potion', 'Hi-Potion', 'X-Potion', 'Dismiss', 'Ultima', 'Flare', 'Thundaga', 'Firaga', 'Blizzaga', 'Waterga'];
    for (const h of MIRROR_AEONS_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });
});

describe('the tactic: an aeon for the big move, blades for Cindy and Sandy, a spell for Mindy, potions under 45 percent', () => {
  /** Advance, defending, to `who`'s input. */
  function inputOf(engine: ReturnType<typeof H.newEngine>, who: string): H.Input {
    for (let i = 0; i < 12; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') throw new Error('over');
      if (d.kind !== 'player-input') continue;
      if (d.actorId === who) return d;
      engine.submit(H.defend());
    }
    throw new Error(`no input for ${who}`);
  }

  it('is registered for all four Dark Aeons under the chapter id and reaches the engine through the lookup', () => {
    expect(MIRROR_AEONS_BOSS_IDS).toEqual([DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID, DARK_YOJIMBO_ID]);
    expect(tacticFor(H.newEngine(1))).toBe(mirrorAeons);
    expect(tacticFor(H.newEngine(1, H.ACT_II_GROUP))).toBe(mirrorAeons);
  });

  it('Tidus (First Strike, so first) swings Quick Hit at Cindy: the sister every blade finds', () => {
    const e = H.newEngine(1);
    const d = H.nextInput(e);
    expect(d.actorId).toBe('tidus');
    expect(mirrorAeons('tidus', d.commands, e)).toMatchObject({ kind: 'ability', targets: [DARK_CINDY_ID] });
  });

  it('Yuna sends the sturdiest aeon in on the first turn of the trio (every gauge is full), Cindy', () => {
    const e = H.newEngine(1);
    const d = inputOf(e, 'yuna');
    const pick = mirrorAeons('yuna', d.commands, e);
    expect(pick).toMatchObject({ kind: 'summon', id: 'cindy' });
  });

  it('Lulu casts her strongest spell at Mindy, the sister a blade cannot touch', () => {
    const e = H.newEngine(1);
    const d = inputOf(e, 'lulu');
    const pick = mirrorAeons('lulu', d.commands, e);
    expect(pick).toMatchObject({ kind: 'ability', targets: [DARK_MINDY_ID] });
    expect(['ultima', 'flare']).toContain((pick as { id: string }).id);
  });

  it('heals a member under 45 percent before anything else, and revives the fallen first of all', () => {
    const e = H.newEngine(1);
    const d = H.nextInput(e);
    const tidus = e.state().combatants['tidus'] as FFXCombatant;
    tidus.hp = Math.floor(tidus.stats.maxHp * 0.3);
    expect(mirrorAeons('tidus', d.commands, e)).toMatchObject({ kind: 'item', targets: ['tidus'] });
    tidus.hp = 0;
    tidus.alive = false;
    const again = mirrorAeons('yuna', d.commands, e);
    expect(again).not.toBeNull();
  });

  it('in Act II every blow is aimed at Dark Yojimbo, never the dog', () => {
    const e = H.newEngine(1, H.ACT_II_GROUP);
    const d = H.nextInput(e);
    const pick = mirrorAeons(d.actorId, d.commands, e)!;
    expect((pick as { targets: string[] }).targets).toEqual([DARK_YOJIMBO_ID]);
  });

  it('an aeon on the field attacks a Dark Aeon (or goes home when the danger has passed and it is low)', () => {
    const e = H.newEngine(2);
    const d = inputOf(e, 'yuna');
    const summon = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Cindy')!;
    e.submit({ ...summon.command, targets: [] });
    const next = H.nextInput(e);
    expect(next.actorId).toBe('cindy');
    const pick = mirrorAeons('cindy', next.commands, e);
    expect(pick).not.toBeNull();
    expect((pick as { targets: string[] }).targets.every((t) => MIRROR_AEONS_BOSS_IDS.includes(t))).toBe(true);
  });
});
