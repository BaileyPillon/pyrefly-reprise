// @vitest-environment jsdom
/**
 * The Last Summoning (the hidden chapter 28; Yu Yevon takes the player's aeons one at a time): the chapter as the app sees it. **FFX only.**
 *
 * What this pins: the registration (hidden, number 28, nowhere in the eighteen, found by `getChapter`, its pause metadata and objectives, its scene, its music and its departures), the experiments' store (attempts
 * and clears never touch the save), the story (linted, attributed, in the cast, short, auto-advancing, Yu Yevon silent), the guide card and document (cited, found only on this chapter's own board, Chapter III's
 * own untouched) and the advisor's line (Chapter III's for the ordinary turns, and the four additions).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { SaveStore } from '../../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../../src/app/screens/frontend/chapterProgress.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, recordExperimentClear, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import type { BattleEngine, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { LAST_SUMMONING, LAST_SUMMONING_TEXT } from '../../../src/data/chapter-last-summoning.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { buildLastSummoningParty, lastSummoningBuild } from '../../../src/data/ffx/builds/last-summoning.ts';
import { lastSummoningGroup, lastSummoningOpener } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../../src/data/ffx/index.ts';
import { LAST_SUMMONING_ID, LAST_SUMMONING_SCENE, OFFERING_KEYS, type OfferingKey, TAKEN_REASON, linkGroupId, possessedIdsOf, yuYevonGroupId } from '../../../src/data/ffx/last-summoning-ids.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS, docForChapter } from '../../../src/data/guides/docs/index.ts';
import { LAST_SUMMONING_GUIDE } from '../../../src/data/guides/last-summoning.ts';
import { braskasFinalAeon } from '../../../src/engine/tactics/braskas-final-aeon.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { tacticFor, TACTICS } from '../../../src/engine/tactics/index.ts';
import { AEON_CALL_ORDER, COMBINE_ID, LAST_SUMMONING_BOSS_IDS, SISTER_BODY_IDS, SURE_WAKIZASHI, lastSummoning, paymentFor } from '../../../src/engine/tactics/last-summoning.ts';
import { CHAPTER_GAME, LOCK_REASON_PREFIX, onLastSummoningBoard } from '../../../src/engine/tactics/lookup.ts';
import { AEON_LOCK_REASON_PREFIX } from '../../../src/battle/ffx/aeon-duel.ts';
import { ORDERS, ORDER_IDS, PAY_ABILITY_ID } from '../../../src/battle/ffx/aeon-commands.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { pyreflyCanonFor, pyreflyDissolves } from '../../../src/engine/pyreflyCanon.ts';
import { getScene, getSceneFactory, sceneKeys } from '../../../src/scenes/index.ts';
import { LAST_SUMMONING_ENEMY_SPOTS, LAST_SUMMONING_FIGURE_HEIGHTS, LAST_SUMMONING_SLOTS } from '../../../src/scenes/last-summoning.ts';
import { DREAMS_END_SLOTS } from '../../../src/scenes/dreams-end.ts';
import { MAX_SAY_CHARS, lintScript } from '../../../src/story/dsl.ts';
import type { SpeakerId, Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { lastSummoningScripts as S } from '../../../src/story/scripts/last-summoning.ts';
import { docForState } from '../../../src/ui/common/guideDoc.ts';
import { aeonMenuRows } from '../../../src/engine/PayRows.ts';
import { ALL_KEYS, firstLinkSetup, newEngine } from '../helpers/lastSummoningDrive.ts';

// ----------------------------------------------------------------------------------------------------------------------------------------- registration

describe('the chapter is registered, hidden, and nowhere in the eighteen', () => {
  it('is found by id, FFX, an experiment numbered 28, in EXPERIMENT_CHAPTERS and neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(getChapter(LAST_SUMMONING_ID)).toBe(LAST_SUMMONING);
    expect(LAST_SUMMONING).toMatchObject({ id: 'last-summoning', game: 'ffx', number: 28, experimental: true, sceneKey: LAST_SUMMONING_SCENE });
    expect(EXPERIMENT_CHAPTERS).toContain(LAST_SUMMONING);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(LAST_SUMMONING_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(LAST_SUMMONING_ID)).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(19); // the eighteen and Mirror Aeons, listed 2026-10-15
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length); // every hidden number is its own
  });

  it("is the placeholder opener behind the first offering, the full-roster party, our scripts and Dream's End's own cues; the card's words carry no number", () => {
    expect(LAST_SUMMONING.enemyGroupRef).toBe(lastSummoningOpener);
    expect(LAST_SUMMONING.scriptsRef).toBe(S);
    expect(LAST_SUMMONING.buildRef).toBe(lastSummoningBuild);
    expect(LAST_SUMMONING.music).toEqual({ scene: 'scene-dreams-end', battle: 'boss-yu-yevon', victory: 'victory-ffx' });
    for (const key of Object.values(LAST_SUMMONING.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
    expect(Object.values(LAST_SUMMONING_TEXT).join(' ')).not.toMatch(/\d/);
  });

  it('gives a Sensor line to every body the chain fields, the twins and the Pagodas and Yu Yevon', () => {
    const fielded = new Set<string>();
    for (const key of OFFERING_KEYS) for (const e of lastSummoningGroup(linkGroupId([key]))!.enemies) fielded.add(e.id);
    for (const e of lastSummoningGroup(yuYevonGroupId([...ALL_KEYS]))!.enemies) fielded.add(e.id);
    expect([...fielded].sort()).toEqual(Object.keys(LAST_SUMMONING.sensorTexts).sort());
    for (const text of Object.values(LAST_SUMMONING.sensorTexts)) expect(text.length).toBeGreaterThan(10);
  });

  it('has pause metadata with the EXP numeral, three objectives the evaluator answers, and shipped art only', () => {
    const meta = getChapterMeta(LAST_SUMMONING_ID)!;
    expect(meta).toMatchObject({ id: LAST_SUMMONING_ID, gameLabel: 'FFX', numeral: 'EXP', title: LAST_SUMMONING_TEXT.title, focalCharacterId: 'yuna' });
    expect(meta.objectives.map((o) => o.rule)).toEqual([{ kind: 'link-reached', link: 4 }, { kind: 'link-reached', link: 9 }, { kind: 'victory' }]);
    for (const k of meta.musicKeys) expect(hasTrack(k), k).toBe(true);
    for (const s of meta.snapshots) expect(s.image).toMatch(/^(backdrops|characters)\/[a-z0-9-]+(\/idle)?\.png$/);
    expect(meta.snapshots.map((s) => s.image)).toEqual(['backdrops/dreams-end.png', 'characters/yu-yevon/idle.png', 'characters/yojimbo/idle.png']);
    expect(meta.quote.text).toBe('I am saying goodbye.'); // a line Yuna speaks in the pre scene
    expect(S.pre.some((s) => s.type === 'say' && s.who === 'yuna' && s.text === meta.quote.text)).toBe(true);
  });

  it("has a scene: Dream's End's plate, lights and rigs with the aeons Chapter III never fields staged, a pyreflies canon row, and bodies that stay", () => {
    expect(sceneKeys()).toContain(LAST_SUMMONING_SCENE);
    const entry = getScene(LAST_SUMMONING_SCENE)!;
    expect(entry.placeholder).toBe(false);
    expect(entry.slots).toBe(LAST_SUMMONING_SLOTS);
    expect(getSceneFactory(LAST_SUMMONING_SCENE)).toBeTypeOf('function');
    // The party and the Pagodas keep Dream's End's staging; the new bodies are added to it.
    expect(LAST_SUMMONING_SLOTS.party).toEqual(DREAMS_END_SLOTS.party);
    expect(LAST_SUMMONING_SLOTS.partyHeight).toBe(DREAMS_END_SLOTS.partyHeight);
    for (const id of ['possessed-yojimbo', 'possessed-anima', 'possessed-cindy', 'possessed-sandy', 'possessed-mindy']) {
      expect(LAST_SUMMONING_ENEMY_SPOTS[id], id).toBeDefined();
      expect(LAST_SUMMONING_FIGURE_HEIGHTS[id], id).toBeGreaterThan(1.5);
      expect(LAST_SUMMONING_SLOTS.enemySpots?.[id], id).toEqual(LAST_SUMMONING_ENEMY_SPOTS[id]);
    }
    // Chapter III's own scene is untouched.
    expect(getChapter('braskas-final-aeon')!.sceneKey).toBe('dreams-end');
    expect(getScene('dreams-end')!.slots).not.toBe(LAST_SUMMONING_SLOTS);
    expect(Object.keys(getScene('dreams-end')!.slots.enemySpots ?? {})).not.toContain('possessed-cindy');
    expect(pyreflyCanonFor(LAST_SUMMONING_SCENE)).toMatchObject({ game: 'ffx', verdict: 'attested' });
  });

  it('the Sisters stand in a row that clears the HUD: Sandy in the middle and nearer, Cindy left and back, Mindy right and forward', () => {
    const [cx] = LAST_SUMMONING_ENEMY_SPOTS['possessed-cindy']!;
    const [sx, , sz] = LAST_SUMMONING_ENEMY_SPOTS['possessed-sandy']!;
    const [mx, , mz] = LAST_SUMMONING_ENEMY_SPOTS['possessed-mindy']!;
    expect(cx).toBeLessThan(sx);
    expect(sx).toBeLessThan(mx);
    expect(mz).toBeGreaterThan(sz); // Mindy is nearer the camera than Sandy (a larger z is nearer)
  });

  it('departs as Chapter III’s twins do: every twin, the Sisters and the possessed Yojimbo among them, is sent like a fiend (no new departure kind; the aeon Yojimbo’s recall is the player’s own and is not these)', () => {
    for (const id of ['possessed-valefor', 'possessed-anima', 'possessed-yojimbo', 'possessed-cindy', 'possessed-sandy', 'possessed-mindy', 'yu-yevon']) {
      expect(departureKindOf(id), id).toBe(departureKindOf('possessed-valefor'));
      expect(pyreflyDissolves(id), id).toBe(pyreflyDissolves('possessed-valefor'));
    }
    expect(departureKindOf('possessed-valefor')).toBe('dissolve');
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the store

describe("an experiment, not a chapter: the board, the experiments' store and the save", () => {
  const WITH_CARD = { experiments: EXPERIMENT_CHAPTERS.filter((c) => c.id === LAST_SUMMONING_ID) } as const;
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has no card by default; handed in, it is the last FFX card, labelled EXP', () => {
    expect(buildChapterTiles(save)).toHaveLength(19);
    const tiles = buildChapterTiles(save, WITH_CARD);
    expect(tiles).toHaveLength(20);
    const last = tiles.find((t) => t.id === LAST_SUMMONING_ID)!;
    expect(tiles.filter((t) => t.game === 'ffx').at(-1)).toBe(last);
    expect(last).toMatchObject({ id: LAST_SUMMONING_ID, numeral: 'EXP', title: LAST_SUMMONING_TEXT.title, game: 'ffx', sceneKey: LAST_SUMMONING_SCENE, playable: true });
  });

  it("keeps its attempts and clears in the experiments' store and writes nothing to the save", () => {
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt(LAST_SUMMONING_ID);
    experimentProgress.recordClear(LAST_SUMMONING_ID, 1_200_000, 40);
    expect(experimentRecord(LAST_SUMMONING_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 1_200_000 });
    expect(Object.keys(JSON.parse(store[EXPERIMENTS_KEY]!))).toEqual([LAST_SUMMONING_ID]);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(save.snapshot().chapters[LAST_SUMMONING_ID]).toBeUndefined();
    expect(window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '').not.toContain(LAST_SUMMONING_ID);
  });

  it("shows the cleared ribbon from the experiments' store, never from the save, and no part of 'N of 18'", () => {
    const card = (): { cleared: boolean } => buildChapterTiles(save, WITH_CARD).find((t) => t.id === LAST_SUMMONING_ID)!;
    expect(card().cleared).toBe(false);
    recordExperimentClear(LAST_SUMMONING_ID, 99_000);
    expect(card().cleared).toBe(true);
    expect(save.isCleared(LAST_SUMMONING_ID)).toBe(false);
    const progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect([progress.beaten, progress.total]).toEqual([0, 19]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the story

describe('the story: our own words, attributed, linted, short, auto-advancing, and Yu Yevon never speaks', () => {
  const CAST = new Set<SpeakerId>(['yuna', 'auron', 'tidus', 'lulu', 'rikku', 'kimahri']);
  const scripts = (): Array<readonly [string, StoryScript]> => [['pre', S.pre], ['post', S.post], ...Object.entries(S.midScripts).map(([id, s]) => [`mid:${id}`, s] as const)];
  const flat = (script: readonly Step[]): Step[] => script.flatMap((s) => (s.type === 'parallel' ? flat(s.steps) : s.type === 'ifFlag' ? [s, ...flat(s.then), ...flat(s.else ?? [])] : [s]));
  const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => flat(script).filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

  it('lints clean, with a scene before the first offering ending in the fight and a scene before the results; no quips', () => {
    for (const [name, script] of scripts()) expect(lintScript(script), name).toEqual([]);
    expect(S.pre.at(-1)!.type).toBe('battleStart');
    expect(S.post.some((s) => s.type === 'results')).toBe(true);
    expect(S.victoryQuips).toEqual({});
  });

  it('is spoken only by the party of Dream’s End and its friends; the Yu Yevon never speaks (writing bible 1.13) and no line is empty or over the cap', () => {
    for (const [name, script] of scripts()) {
      for (const step of flat(script)) {
        if (step.type === 'say') {
          expect(CAST.has(step.who), `${name}: ${String(step.who)}`).toBe(true);
          expect(step.who as string).not.toBe('yu-yevon');
        }
      }
      for (const l of lines(script)) {
        expect(l.text.length, name).toBeGreaterThan(0);
        expect(l.text.length, name).toBeLessThanOrEqual(MAX_SAY_CHARS);
      }
    }
  });

  it('is short: eleven lines before the first offering, six after Yu Yevon, one or two for each arrival and fall', () => {
    expect(lines(S.pre)).toHaveLength(11);
    expect(lines(S.post).length).toBeGreaterThanOrEqual(5);
    expect(lines(S.post).length).toBeLessThanOrEqual(8);
    for (const [id, script] of Object.entries(S.midScripts)) expect(lines(script).length, id).toBeLessThanOrEqual(4);
  });

  it('has a trigger for every mid script, id equal to script, each on an enemy the chain fields, once only', () => {
    const fielded = new Set(Object.keys(LAST_SUMMONING.sensorTexts));
    expect(S.mid.map((t) => t.id).sort()).toEqual(Object.keys(S.midScripts).sort());
    expect(new Set(S.mid.map((t) => t.id)).size).toBe(S.mid.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(t.once, t.id).toBe(true);
      expect(fielded.has((t.when as { who: string }).who), `${t.id} watches ${(t.when as { who: string }).who}`).toBe(true);
    }
  });

  it('says one arrival and one fall for every aeon, whatever the order (the three Sisters fall one line each)', () => {
    for (const key of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo']) {
      expect(S.midScripts[`${key}-enters`], key).toBeDefined();
      expect(S.midScripts[`${key}-falls`], key).toBeDefined();
    }
    for (const id of ['sisters-enter', 'cindy-falls', 'sandy-falls', 'mindy-falls', 'yu-yevon-arrives']) expect(S.midScripts[id], id).toBeDefined();
  });

  it('keeps every mid-battle script inside the budget, every say on an auto, and nothing in one that can wedge it', () => {
    for (const [id, script] of Object.entries(S.midScripts)) {
      expect(blockingSteps(script), id).toEqual([]);
      expect(scriptDurationMs(script, MID_LINE_HOLD_MS), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(script), id).toBe(MID_SCRIPT_BUDGET_MS);
    }
  });

  it('says nothing of an order: no line of an arrival or a fall names first, second or last', () => {
    const all = Object.values(S.midScripts).flatMap((s) => lines(s)).map((l) => l.text).join(' ');
    expect(all).not.toMatch(/\b(second|third|fourth|fifth|sixth|seventh|eighth|last one|final one)\b/i);
  });

  it('quotes nothing of the game and names no source', () => {
    const all = scripts().flatMap(([, s]) => lines(s)).map((l) => l.text).join(' ');
    expect(all).not.toMatch(/§|\bffx2?-|re-ffx|research\//i);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the guide, found only here

type Input = Extract<Decision, { kind: 'player-input' }>;

function inputFor(engine: BattleEngine, who: string): Input {
  for (let i = 0; i < 600; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      if (d.actorId === who) return d;
      engine.submit({ kind: 'defend', targets: [] });
    } else if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error(`no input for ${who}`);
}

async function lastSummoningEngine(order: readonly OfferingKey[], seed = 1): Promise<BattleEngine> {
  const { setup } = await firstLinkSetup(order, seed);
  return newEngine(setup);
}

/** The same first link with the three Sisters' stored gauges spent (what Combine leaves): the engine offers them nothing but Dismiss. */
async function spentSistersEngine(seed: number): Promise<BattleEngine> {
  const { setup } = await firstLinkSetup(['valefor'], seed);
  const party = buildLastSummoningParty();
  for (const a of party.aeons) if (['cindy', 'sandy', 'mindy'].includes(a.id)) a.overdriveGauge = 0;
  return newEngine({ ...setup, party });
}

/** Chapter III's own possessed Valefor battle: the same enemy ids, none of this chapter's locks. */
function chapterThreeEngine(seed = 1): BattleEngine {
  const chapter = getChapter('braskas-final-aeon')!;
  const group = FFX_GROUPS['possessed-valefor']!;
  return newEngine({ ...setupForChapter(chapter, seed), enemies: group });
}

describe('the guide and the move advisor are found only on this chapter’s own board', () => {
  it('the lock reason prefix and the words are the engine’s own', () => {
    expect(LOCK_REASON_PREFIX).toBe(AEON_LOCK_REASON_PREFIX);
    expect(TAKEN_REASON).toBe('Taken by Yu Yevon');
    expect(CHAPTER_GAME['last-summoning']).toBe('ffx');
    expect(getChapter('last-summoning')!.game).toBe('ffx');
  });

  it('knows its board by the "Taken by Yu Yevon" lock, and by nothing else', async () => {
    expect(onLastSummoningBoard({})).toBe(false);
    expect(onLastSummoningBoard({ flags: {} })).toBe(false);
    expect(onLastSummoningBoard({ flags: { [`${LOCK_REASON_PREFIX}bahamut`]: 'Mirror of Grothia' } })).toBe(false);
    expect(onLastSummoningBoard({ flags: { [`${LOCK_REASON_PREFIX}bahamut`]: TAKEN_REASON } })).toBe(true);
    expect(onLastSummoningBoard((await lastSummoningEngine(['ifrit'])).state())).toBe(true);
    expect(onLastSummoningBoard(chapterThreeEngine().state())).toBe(false);
  });

  it('puts the card and the document ahead of Chapter III’s, over the same enemy ids', () => {
    expect(GUIDES.findIndex((g) => g.id === 'last-summoning')).toBeLessThan(GUIDES.findIndex((g) => g.id === 'braskas-final-aeon'));
    expect(GUIDE_DOCS.findIndex((d) => d.id === 'last-summoning')).toBeLessThan(GUIDE_DOCS.findIndex((d) => d.id === 'braskas-final-aeon'));
    expect(TACTICS.findIndex((t) => t.chapterId === 'last-summoning')).toBeLessThan(TACTICS.findIndex((t) => t.chapterId === 'braskas-final-aeon'));
    expect([...LAST_SUMMONING_GUIDE.bossIds].sort()).toEqual([...(GUIDES.find((g) => g.id === 'braskas-final-aeon')!.bossIds)].filter((id) => id !== 'braskas-final-aeon').sort());
    expect([...LAST_SUMMONING_BOSS_IDS].sort()).toEqual([...LAST_SUMMONING_GUIDE.bossIds].sort());
  });

  it('on this chapter’s board: its card, its document, its tactic; on Chapter III’s, Chapter III’s own', async () => {
    for (const order of [['valefor'], ['sisters'], ['yojimbo', 'anima']] as OfferingKey[][]) {
      const e = await lastSummoningEngine(order);
      expect(guideForState(e.state())?.id, order.join()).toBe('last-summoning');
      expect(docForState(e.state())?.id, order.join()).toBe('last-summoning');
      expect(tacticFor(e), order.join()).toBe(lastSummoning);
    }
    const three = chapterThreeEngine();
    expect(guideForState(three.state())?.id).toBe('braskas-final-aeon');
    expect(docForState(three.state())?.id).toBe('braskas-final-aeon');
    expect(tacticFor(three)).toBe(braskasFinalAeon);
  });

  it('is found for Yu Yevon’s link too, and for none of the twins once only a Pagoda is left of a Chapter III board', async () => {
    const { setup } = await firstLinkSetup(['valefor'], 1);
    const yu = newEngine({ ...setup, enemies: lastSummoningGroup(yuYevonGroupId([...ALL_KEYS]))! });
    expect(guideForState(yu.state())?.id).toBe('last-summoning');
    expect(tacticFor(yu)).toBe(lastSummoning);
  });

  it('shows the Sisters under one headline, the aeon of the link under another, and Yu Yevon under his own', async () => {
    const sisters = await lastSummoningEngine(['sisters']);
    expect(LAST_SUMMONING_GUIDE.linkTitles!['possessed-cindy']).toBe('The Magus Sisters');
    expect(new Set(SISTER_BODY_IDS.map((id) => LAST_SUMMONING_GUIDE.linkTitles![id]))).toEqual(new Set(['The Magus Sisters']));
    expect(sisters.state().combatants['possessed-mindy']!.side).toBe('enemy');
    expect(LAST_SUMMONING_GUIDE.linkTitles!['yu-yevon']).toBe('Yu Yevon');
  });
});

describe('the card and the document: cited, in the corpus form, and tied to the line', () => {
  const cite = /^(ffx|re-ffx)-[a-z0-9-]+ §/;

  it('every sentence the card prints is cited in the corpus form', () => {
    for (const r of LAST_SUMMONING_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of LAST_SUMMONING_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of LAST_SUMMONING_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    expect(LAST_SUMMONING_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(LAST_SUMMONING_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of LAST_SUMMONING_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(52);
  });

  it('says what the game does and no more: the twin is a copy at full HP, the lock, the flat 9,999, one Sister down means no Delta Attack, Doom or a blow bigger than what is left', () => {
    const text = LAST_SUMMONING_GUIDE.rules.map((r) => r.text).join(' ');
    expect(text).toMatch(/copy of your own/);
    expect(text).toMatch(/greyed out/);
    expect(text).toMatch(/flat 9,999 on everyone at the front/);
    expect(text).toMatch(/Fell her first/);
    expect(text).toMatch(/Cindy keeps it going/);
    expect(text).toMatch(/Doom from a Candle of Life/);
    expect(text).not.toMatch(/Daigoro is|plain Attack of Yojimbo|Death at/);
  });

  it('every label a hint speaks to is a row the line asks for (its own, or Chapter III’s in these fights)', () => {
    const asked = ['Pay', 'Combine', 'Combine for the Delta Attack', 'Phoenix Down', 'Mega Phoenix', 'Life', 'Full-Life', 'Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion', 'Protect', 'Ether', 'Turbo Ether', 'Elixir', 'Candle of Life', 'Defend'];
    for (const h of LAST_SUMMONING_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('the document is found for the chapter, lists the chapter’s ids, opens on each fight and prints no HP of the twins', () => {
    const doc = docForChapter(LAST_SUMMONING_ID)!;
    expect(doc).toMatchObject({ id: LAST_SUMMONING_ID, game: 'ffx', onlyWhenFlag: { prefix: 'aeonDuel.reason:', value: TAKEN_REASON } });
    expect([...doc.bossIds].sort()).toEqual([...LAST_SUMMONING_GUIDE.bossIds].sort());
    const fields = doc.blocks.filter((b) => b.t === 'field') as Array<{ label: string }>;
    expect(fields.filter((f) => /HP$/.test(f.label))).toEqual([]);
    const anchors = new Set(doc.blocks.flatMap((b) => b.at ?? []));
    for (const id of doc.bossIds) expect(anchors.has(id), id).toBe(true);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the advisor

describe('the advisor: Chapter III’s line, with Yojimbo’s payment, the Sisters’ Combine, Cindy first in the Sisters’ fight, and an aeon when Yuna is free', () => {
  it('pays Yojimbo the smallest power of two that reaches a motivation of 63, or the largest the purse allows', () => {
    expect(SURE_WAKIZASHI).toBe(63);
    // compatibility 128: 12 from the compatibility, so 51 must come from 4n: n = 13, paid = 2^15
    expect(paymentFor(50_000, 128)).toBe(32_768);
    expect(paymentFor(40_000, 128)).toBe(32_768);
    expect(paymentFor(20_000, 128)).toBe(16_384); // the purse cannot reach it: the largest power of two it holds
    expect(paymentFor(32_767, 128)).toBe(16_384);
    expect(paymentFor(200_000, 255)).toBe(2 ** 12); // 25 + 4n >= 63: n = 10
    expect(paymentFor(7, 128)).toBe(7);
    expect(paymentFor(0, 128)).toBe(0);
    for (const gil of [8, 100, 1_000, 5_000, 99_999]) {
      const paid = paymentFor(gil, 128);
      expect(paid).toBeLessThanOrEqual(gil);
      expect(Number.isInteger(Math.log2(paid))).toBe(true);
    }
  });

  it('asks Yojimbo for a Pay with that payment on his own turn, and the engine accepts it', async () => {
    const e = await lastSummoningEngine(['valefor'], 3);
    const yuna = inputFor(e, 'yuna');
    const call = yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo')!;
    e.submit({ ...call.command, targets: [] });
    const turn = inputFor(e, 'yojimbo');
    const pay = lastSummoning('yojimbo', turn.commands, e) as Extract<Command, { kind: 'ability' }>;
    expect(pay).toMatchObject({ kind: 'ability', id: PAY_ABILITY_ID, targets: [] });
    expect(pay.gilSpent).toBe(paymentFor(e.state().flags['yojimbo:gil'] as number, e.state().flags['yojimbo:compatibility'] as number));
    expect(pay.gilSpent).toBe(32_768);
    e.submit(pay);
    const events = e.state().log;
    expect(events.some((ev) => ev.type === 'action-start' && ev.actorId === 'yojimbo' && ev.abilityName === 'Pay')).toBe(true);
    expect(e.state().flags['yojimbo:gil']).toBe(50_000 - 32_768);
  });

  it('calls Combine on a Sister’s turn when the game’s menu offers it, and the Delta Attack lands', async () => {
    // no gauge is set by hand: the roster starts the three Sisters full (the engine offers Combine only while all three of their stored gauges are full; RE open item 1) and Anima and Yojimbo empty
    const party = buildLastSummoningParty();
    expect(party.aeons.filter((a) => ['cindy', 'sandy', 'mindy'].includes(a.id)).map((a) => a.overdriveGauge)).toEqual([100, 100, 100]);
    expect(party.aeons.filter((a) => ['anima', 'yojimbo'].includes(a.id)).map((a) => a.overdriveGauge)).toEqual([0, 0]);
    const e = await lastSummoningEngine(['valefor'], 4);
    const yuna = inputFor(e, 'yuna');
    const call = yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'cindy')!;
    e.submit({ ...call.command, targets: [] });
    expect(e.state().aeonIds).toEqual(['cindy', 'sandy', 'mindy']);
    const turn = inputFor(e, e.state().aeonIds![0]!);
    const pick = lastSummoning(turn.actorId, turn.commands, e);
    expect(pick).toMatchObject({ kind: 'ability', id: 'sister-order-combine' });
    expect(COMBINE_ID).toBe('sister-order-combine');
    expect(ORDER_IDS).toContain(COMBINE_ID);
    // The engine's row keeps the RE lane's name (its tests pin the banner's `abilityName`); a person's menu gets the short one from the presenter's `PayRows.ts` (the live line's own pass, Chapter XXVII's), which this chapter shares.
    const engineRow = turn.commands.find((c) => c.command.kind === 'ability' && c.command.id === COMBINE_ID)!;
    expect(engineRow.label).toBe('Combine for the Delta Attack');
    expect(ORDERS.find((o) => o.id === COMBINE_ID)!.label).toBe(engineRow.label);
    const menuRow = aeonMenuRows(turn.commands, e.state().flags['yojimbo:gil'] as number | undefined).find((c) => c.command.kind === 'ability' && c.command.id === COMBINE_ID)!;
    expect(menuRow).toMatchObject({ label: 'Combine', enabled: true, command: engineRow.command });
    e.submit(pick!);
    expect(e.state().log.some((ev) => ev.type === 'action-start' && ev.abilityId === 'delta-attack')).toBe(true);
    expect(e.state().log.some((ev) => ev.type === 'action-start' && ev.abilityName === 'Combine for the Delta Attack')).toBe(true);
  });

  it('sends a Sister’s turn without Combine to Dismiss: the line uses Combine and none of her other orders (the engine carries all eight out since RE’s follow-up; a player may use them)', async () => {
    const e = await spentSistersEngine(5);
    const yuna = inputFor(e, 'yuna');
    const call = yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'cindy')!;
    e.submit({ ...call.command, targets: [] });
    const turn = inputFor(e, e.state().aeonIds![0]!);
    expect(turn.commands.some((c) => c.command.kind === 'ability' && c.command.id === COMBINE_ID)).toBe(false); // the bar is spent, so no Combine is offered
    expect(turn.commands.some((c) => c.enabled && c.command.kind === 'ability')).toBe(true); // the other orders are the player’s to use
    expect(lastSummoning(turn.actorId, turn.commands, e)).toMatchObject({ kind: 'dismiss' });
  });

  it('aims a swing in the Sisters’ fight at Cindy while she stands, then at the Sister with the least HP, and leaves a single Sister alone', async () => {
    const e = await lastSummoningEngine(['sisters'], 6);
    const hp = (id: string, v: number): void => void ((e.state().combatants[id] as FFXCombatant).hp = v);
    const swingOf = (): Command | null => {
      const turn = inputFor(e, 'tidus');
      return lastSummoning('tidus', turn.commands, e);
    };
    hp('possessed-mindy', 3000);
    hp('possessed-sandy', 900);
    hp('possessed-cindy', 5000);
    expect(swingOf()?.targets).toEqual(['possessed-cindy']); // Cindy first (she mends, drains and calls the Delta Attack), whoever has less HP
    hp('possessed-cindy', 100);
    expect(swingOf()?.targets).toEqual(['possessed-cindy']);
    const cindy = e.state().combatants['possessed-cindy'] as FFXCombatant;
    cindy.hp = 0;
    cindy.alive = false; // Cindy has fallen: now the Sister with the least HP left
    hp('possessed-sandy', 900);
    hp('possessed-mindy', 3000);
    expect(swingOf()?.targets).toEqual(['possessed-sandy']);
    hp('possessed-mindy', 100);
    expect(swingOf()?.targets).toEqual(['possessed-mindy']);
  });

  it('shows no card on the menus of Yuna’s own Yojimbo and Sisters (Chapter XXVII’s rule, `advisor-aeons.ts`), while the line still pays Yojimbo and sends a Sister without Combine home', async () => {
    const e = await lastSummoningEngine(['valefor'], 8);
    const yuna = inputFor(e, 'yuna');
    e.submit({ ...yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo')!.command, targets: [] });
    const turn = inputFor(e, 'yojimbo');
    expect(buildAdvisorView(e.state(), { actorId: turn.actorId, commands: turn.commands })).toBeNull(); // a card that says nothing is better than one the simulation cannot price
    expect(lastSummoning('yojimbo', turn.commands, e)).toMatchObject({ kind: 'ability', id: PAY_ABILITY_ID });

    const sisters = await spentSistersEngine(9);
    const call = inputFor(sisters, 'yuna').commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'cindy')!;
    sisters.submit({ ...call.command, targets: [] });
    const sturn = inputFor(sisters, sisters.state().aeonIds![0]!);
    expect(buildAdvisorView(sisters.state(), { actorId: sturn.actorId, commands: sturn.commands })).toBeNull();
    expect(lastSummoning(sturn.actorId, sturn.commands, sisters)).toMatchObject({ kind: 'dismiss' });
  });

  it('leaves Chapter III’s own link to Chapter III’s line, command for command', async () => {
    const e = chapterThreeEngine(7);
    const turn = inputFor(e, 'tidus');
    expect(tacticFor(e)).toBe(braskasFinalAeon);
    expect(braskasFinalAeon!('tidus', turn.commands, e)).toEqual(braskasFinalAeon!('tidus', turn.commands, e));
  });

  it('keeps the call order to labels the Summon list can show, the Sisters under their one row, "Magus Sisters" (the game’s label; one row stands for the three)', () => {
    expect(AEON_CALL_ORDER).toEqual(['Bahamut', 'Anima', 'Magus Sisters', 'Ixion', 'Shiva', 'Ifrit', 'Valefor', 'Yojimbo']);
    expect(new Set(AEON_CALL_ORDER).size).toBe(8);
    for (const key of OFFERING_KEYS) expect(AEON_CALL_ORDER.map((l) => l.toLowerCase().replace('magus sisters', 'sisters'))).toContain(key);
    expect(possessedIdsOf('sisters')).toEqual(SISTER_BODY_IDS);
  });
});
