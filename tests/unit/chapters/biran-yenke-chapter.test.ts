// @vitest-environment jsdom
/**
 * Biran and Yenke (Kimahri's solo trial at the Mountain Gate; the hidden chapter): the chapter as the app sees it. **FFX only.**
 *
 * What this pins: the registration (hidden, number 25, nowhere in the eighteen, found by `getChapter`, its pause metadata, its scene, its music and its brothers' departures), the experiments' store
 * (attempts and clears never touch the save), the story (linted, attributed, short, no barks), the guide card and document (cited, tied to the tactic's rows) and the advisor's line.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { SaveStore } from '../../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../../src/app/screens/frontend/chapterProgress.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, recordExperimentClear, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { BIRAN_YENKE, BIRAN_YENKE_ID, BIRAN_YENKE_TEXT } from '../../../src/data/chapter-biran-yenke.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { BIRAN_ID, GAGAZET_RONSO_SCENE, YENKE_ID } from '../../../src/data/ffx/biran-yenke-ids.ts';
import { kimahriTrialBuild } from '../../../src/data/ffx/builds/kimahri-trial.ts';
import { biranYenkeGroup } from '../../../src/data/ffx/enemies/biran-yenke.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { BIRAN_YENKE_GUIDE } from '../../../src/data/guides/biran-yenke.ts';
import { biranYenke, BIRAN_YENKE_BOSS_IDS } from '../../../src/engine/tactics/biran-yenke.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { pyreflyCanonFor, pyreflyDissolves } from '../../../src/engine/pyreflyCanon.ts';
import { getScene, getSceneFactory, sceneKeys } from '../../../src/scenes/index.ts';
import { GAGAZET_RONSO_SLOTS } from '../../../src/scenes/gagazet-ronso.ts';
import { GAGAZET_STAGING } from '../../../src/scenes/gagazet-giants.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { biranYenkeScripts } from '../../../src/story/scripts/biran-yenke.ts';
import * as H from '../helpers/ronsoDrive.ts';

// ----------------------------------------------------------------------------------------------------------------------------------------- registration

describe('the chapter is registered, hidden, and nowhere in the eighteen', () => {
  it('is found by id, FFX, an experiment numbered 25, in EXPERIMENT_CHAPTERS and neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(getChapter(BIRAN_YENKE_ID)).toBe(BIRAN_YENKE);
    expect(BIRAN_YENKE).toMatchObject({ id: 'biran-yenke', game: 'ffx', number: 25, experimental: true, sceneKey: GAGAZET_RONSO_SCENE });
    expect(EXPERIMENT_CHAPTERS).toContain(BIRAN_YENKE);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(BIRAN_YENKE_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(BIRAN_YENKE_ID)).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length); // every hidden number is its own
  });

  it("is the one formation, Kimahri alone, our scripts and the generic boss cue; the card's words carry no number", () => {
    expect(BIRAN_YENKE.enemyGroupRef).toBe(biranYenkeGroup);
    expect(BIRAN_YENKE.scriptsRef).toBe(biranYenkeScripts);
    expect(BIRAN_YENKE.buildRef).toBe(kimahriTrialBuild);
    expect(BIRAN_YENKE.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-challenge', victory: 'victory-ffx' });
    for (const key of Object.values(BIRAN_YENKE.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
    expect(Object.keys(BIRAN_YENKE.sensorTexts).sort()).toEqual([BIRAN_ID, YENKE_ID].sort());
    expect(Object.values(BIRAN_YENKE_TEXT).join(' ')).not.toMatch(/\d/);
  });

  it('has pause metadata with the EXP numeral, three objectives the evaluator answers, and shipped art only', () => {
    const meta = getChapterMeta(BIRAN_YENKE_ID)!;
    expect(meta).toMatchObject({ id: BIRAN_YENKE_ID, gameLabel: 'FFX', numeral: 'EXP', title: BIRAN_YENKE_TEXT.title, focalCharacterId: 'kimahri' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['boss-hp-below', 'parts-downed', 'victory']);
    expect(meta.objectives[0]!.rule).toEqual({ kind: 'boss-hp-below', fraction: 0.5 });
    expect((meta.objectives[1]!.rule as unknown as { targetIds: string[] }).targetIds).toEqual([BIRAN_ID, YENKE_ID]);
    for (const k of meta.musicKeys) expect(hasTrack(k), k).toBe(true);
    for (const s of meta.snapshots) expect(s.image).toMatch(/^(backdrops|characters)\/[a-z0-9-]+(\/idle)?\.png$/);
    expect(meta.snapshots.map((s) => s.image)).toEqual(['backdrops/gagazet.png', 'characters/biran-ronso/idle.png', 'characters/yenke-ronso/idle.png']);
  });

  it("has a scene: Chapter I's Mt. Gagazet with this fight's staging (the brothers pinned at the Ronso height, Kimahri on the first slot), a pyreflies canon row, and bodies that stay", () => {
    expect(sceneKeys()).toContain(GAGAZET_RONSO_SCENE);
    const entry = getScene(GAGAZET_RONSO_SCENE)!;
    expect(entry.placeholder).toBe(false);
    expect(entry.slots).toBe(GAGAZET_RONSO_SLOTS);
    expect(getSceneFactory(GAGAZET_RONSO_SCENE)).toBeTypeOf('function');
    expect(GAGAZET_RONSO_SLOTS.party).toHaveLength(3);
    expect(Object.keys(GAGAZET_RONSO_SLOTS.enemySpots ?? {}).sort()).toEqual([BIRAN_ID, YENKE_ID].sort());
    expect(GAGAZET_RONSO_SLOTS.figureHeights?.[BIRAN_ID]).toBeCloseTo(1.82 * 1.211, 2);
    expect(GAGAZET_RONSO_SLOTS.figureHeights?.[BIRAN_ID]).toBe(GAGAZET_RONSO_SLOTS.figureHeights?.[YENKE_ID]);
    expect(pyreflyCanonFor(GAGAZET_RONSO_SCENE)).toMatchObject({ game: 'ffx', verdict: 'unattested' });
    // Chapter I's scene is untouched: its key, its slots, its giants.
    expect(getChapter('seymour-flux')!.sceneKey).toBe('gagazet');
    expect(getScene('gagazet')!.slots).not.toBe(GAGAZET_RONSO_SLOTS);
    expect(Object.keys(GAGAZET_STAGING.enemySpots).sort()).toEqual(['mortiorchis', 'seymour-flux']);
    // The brothers are beaten living people: their bodies stay, and nothing dissolves into pyreflies.
    for (const id of [BIRAN_ID, YENKE_ID]) {
      expect(departureKindOf(id)).toBe('body');
      expect(pyreflyDissolves(id)).toBe(false);
    }
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the store

describe("an experiment, not a chapter: the board, the experiments' store and the save", () => {
  const WITH_CARD = { experiments: EXPERIMENT_CHAPTERS.filter((c) => c.id === BIRAN_YENKE_ID) } as const;
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has no card by default; handed in, it is the last FFX card but Mirror Aeons, labelled EXP', () => {
    expect(buildChapterTiles(save)).toHaveLength(19);
    const tiles = buildChapterTiles(save, WITH_CARD);
    expect(tiles).toHaveLength(20); // the nineteen listed cards (Mirror Aeons, XXVII, since 2026-10-15) and the one handed in
    const last = tiles.find((t) => t.id === BIRAN_YENKE_ID)!;
    // Cards sort by number: this one is 25, so it follows Sin: the Face (XVIII) and comes just before Mirror Aeons (XXVII, listed 2026-10-15), which is the last FFX card.
    const ffxCards = tiles.filter((t) => t.game === 'ffx');
    expect(ffxCards.at(-2)).toBe(last);
    expect(ffxCards.at(-1)).toMatchObject({ id: 'mirror-aeons', numeral: 'XXVII' });
    expect(last).toMatchObject({ id: BIRAN_YENKE_ID, numeral: 'EXP', title: BIRAN_YENKE_TEXT.title, game: 'ffx', sceneKey: GAGAZET_RONSO_SCENE, playable: true });
  });

  it("keeps its attempts and clears in the experiments' store and writes nothing to the save: a Rage learned in the fight leaves no trace", () => {
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt(BIRAN_YENKE_ID);
    experimentProgress.recordAttempt(BIRAN_YENKE_ID);
    experimentProgress.recordClear(BIRAN_YENKE_ID, 210_000, 30);
    expect(experimentRecord(BIRAN_YENKE_ID)).toMatchObject({ attempts: 2, clears: 1, bestTimeMs: 210_000 });
    expect(Object.keys(JSON.parse(store[EXPERIMENTS_KEY]!))).toEqual([BIRAN_YENKE_ID]);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(save.snapshot().chapters[BIRAN_YENKE_ID]).toBeUndefined();
    expect(window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '').not.toContain(BIRAN_YENKE_ID);
  });

  it("shows the cleared ribbon from the experiments' store, never from the save, and no part of 'N of 19'", () => {
    const card = (): { cleared: boolean } => buildChapterTiles(save, WITH_CARD).find((t) => t.id === BIRAN_YENKE_ID)!;
    expect(card().cleared).toBe(false);
    recordExperimentClear(BIRAN_YENKE_ID, 99_000);
    expect(card().cleared).toBe(true);
    expect(save.isCleared(BIRAN_YENKE_ID)).toBe(false);
    const progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect([progress.beaten, progress.total]).toEqual([0, 19]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the story

describe('the story: our own words, attributed, linted, short, and no barks', () => {
  const S = biranYenkeScripts;
  const speakers = new Set(['kimahri', 'biran', 'yenke']);
  const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

  it('lints clean; a scene before the fight and a scene before the results; no quips, no mid-battle script (the brothers have no barks)', () => {
    expect(lintScript(S.pre)).toEqual([]);
    expect(lintScript(S.post)).toEqual([]);
    expect(S.pre.at(-1)!.type).toBe('battleStart');
    expect(S.post.at(-1)!.type).toBe('results');
    expect(S.victoryQuips).toEqual({});
    expect(S.mid).toEqual([]);
    expect(S.midScripts).toEqual({});
  });

  it('is short (five lines, then four) and spoken only by Kimahri and the two brothers; Kimahri speaks once in each scene, after a silence, in the third person', () => {
    expect(lines(S.pre)).toHaveLength(5);
    expect(lines(S.post)).toHaveLength(3);
    for (const script of [S.pre, S.post]) {
      for (const l of lines(script)) if (l.type === 'say') expect(speakers.has(l.who), String(l.who)).toBe(true);
      const kim = script.map((s, i) => [s, i] as const).filter(([s]) => s.type === 'say' && s.who === 'kimahri');
      expect(kim).toHaveLength(1);
      const [, at] = kim[0]!;
      expect(script[at - 1]!.type, 'a silence (a beat, which the DSL writes as a wait step) before Kimahri speaks').toBe('wait');
      expect((kim[0]![0] as { text: string }).text).toMatch(/^Kimahri /);
    }
  });

  it('quotes nothing of the game and names no source', () => {
    const all = [...lines(S.pre), ...lines(S.post)].map((l) => l.text).join(' ');
    expect(all).not.toMatch(/§|\bffx2?-|re-ffx/i);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the guide and the tactic

describe('the guide card and document, and the line they teach', () => {
  const cite = /^(ffx|re-ffx)-[a-z0-9-]+ §/;

  it('the card is registered under the chapter id and both brothers, and every sentence it prints is cited in the corpus form', () => {
    expect(GUIDES.find((g) => g.id === BIRAN_YENKE_ID)).toBe(BIRAN_YENKE_GUIDE);
    expect(BIRAN_YENKE_GUIDE.bossIds).toEqual([BIRAN_ID, YENKE_ID]);
    for (const r of BIRAN_YENKE_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of BIRAN_YENKE_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of BIRAN_YENKE_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
  });

  it("says what the game does and no more: one Rage a Lancet, the half-HP gate, the guard only for the plain Attack and only together, learn Biran's first; and no number of the brothers'", () => {
    const text = BIRAN_YENKE_GUIDE.rules.map((r) => r.text).join(' ');
    expect(text).toMatch(/one Ronso Rage a cast/);
    expect(text).toMatch(/after that brother has called his own, at half his strength/);
    expect(text).toMatch(/plain Attack on one only makes the other stand guard/);
    expect(text).toMatch(/Learn what Biran carries before Yenke falls/);
    expect(text).toMatch(/never offers Mighty Guard/); // true under the note and under Jegged (the handoff holds the disagreement, not the page)
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/Berserk Biran (cannot|can still)|according to|Jegged says/i);
  });

  it('the document has the boss header, the stat lines, the strategy, the Steal and the Drops the data holds, and is registered', () => {
    const doc = docForChapter(BIRAN_YENKE_ID)!;
    expect(doc).toMatchObject({ id: BIRAN_YENKE_ID, game: 'ffx', bossIds: [BIRAN_ID, YENKE_ID] });
    expect(doc.blocks.some((b) => b.t === 'head' && ((b as unknown as { at?: readonly string[] }).at ?? []).includes(BIRAN_ID))).toBe(true);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Lv. 3 Key Sphere (common)', 'Lv. 3 Key Sphere x2 (rare)']);
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Return Sphere (common)', 'Friend Sphere (rare)']);
    expect(JSON.stringify(doc)).not.toMatch(/9,999|4,500|1,500|3,208|2,406/); // no number of the brothers' is printed: their stats are set from Kimahri's at the start
  });

  it('every label a hint speaks to is a row the tactic asks for', () => {
    const asked = ['Lancet', 'Fire Breath', 'Aqua Breath', 'Thrust Kick', 'Jump', 'Potion', 'Hi-Potion', 'X-Potion'];
    for (const h of BIRAN_YENKE_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });
});

describe('the tactic: potions under 45 percent, a Rage the moment the gauge allows, Lancet whoever can teach, the plain Attack only when apart', () => {
  it('is registered for both brothers under the chapter id and reaches the engine through the lookup', () => {
    expect(BIRAN_YENKE_BOSS_IDS).toEqual([BIRAN_ID, YENKE_ID]);
    const e = H.newEngine(1);
    expect(tacticFor(e)).toBe(biranYenke);
  });

  it('Lancets Biran first on a fresh Kimahri (the gauge is 45: no Rage yet), then Yenke, while they can teach', () => {
    const e = H.newEngine(1);
    const input = H.nextInput(e);
    const pick = biranYenke(H.KIM, input.commands, e);
    expect(pick).toMatchObject({ kind: 'ability', id: 'lancet', targets: [BIRAN_ID] });
  });

  it('spends a ready Rage on both brothers with a breath once Kimahri has one, never Self-Destruct, Doom or Stone Breath', () => {
    const e = H.newEngine(1);
    const k = H.actor(e, H.KIM);
    k.overdrive!.unlockedOverdriveIds.push('self-destruct', 'doom', 'stone-breath', 'fire-breath');
    k.overdrive!.gauge = 100;
    const input = H.nextInput(e);
    expect(biranYenke(H.KIM, input.commands, e)).toMatchObject({ kind: 'overdrive', id: 'fire-breath' });
    k.overdrive!.unlockedOverdriveIds.length = 0;
    k.overdrive!.unlockedOverdriveIds.push('self-destruct', 'doom', 'stone-breath');
    const only = H.nextInput(e);
    const never = biranYenke(H.KIM, only.commands, e);
    expect(never?.kind === 'overdrive' ? never.id : null).toBeNull(); // a Lancet or an Attack instead
  });

  it('heals first when Kimahri is under 45 percent and a potion covers what is missing', () => {
    const e = H.newEngine(1);
    const input = H.nextInput(e, false);
    const k = H.actor(e, H.KIM);
    k.hp = Math.trunc(k.stats.maxHp * 0.3);
    const pick = biranYenke(H.KIM, input.commands, e);
    expect(pick).toMatchObject({ kind: 'item', targets: [H.KIM] });
  });

  it('swings only while the brothers are apart; together it falls back to Lancet (not physical, so nobody stands guard)', () => {
    const e = H.newEngine(1);
    const k = H.actor(e, H.KIM);
    k.overdrive!.unlockedOverdriveIds.push('thrust-kick', 'self-destruct', 'doom', 'fire-breath', 'aqua-breath', 'stone-breath');
    // Everything Biran and Yenke can teach is known; Mighty Guard and White Wind are still gated.
    const together = H.nextInput(e);
    H.flags(e)[H.SAME_SIDE] = 1;
    expect(biranYenke(H.KIM, together.commands, e)).toMatchObject({ kind: 'ability', id: 'lancet' });
    H.flags(e)[H.SAME_SIDE] = 0;
    expect(biranYenke(H.KIM, together.commands, e)).toMatchObject({ kind: 'attack' });
  });
});
