// @vitest-environment jsdom
/**
 * Mirror Aeons (the Dark Magus Sisters, then Dark Yojimbo, against Yuna's own Magus Sisters and Yojimbo; Chapter XXVII, LISTED 2026-10-15 on Bailey's word): the chapter as the app sees it. **FFX only.**
 *
 * What this pins: the registration (listed, number 27, the last of the nineteen, found by `getChapter`, its pause metadata, its two-plate scene, its music and the departure of Dark Yojimbo), the board and the save
 * (a card, "of 19", attempts and clears recorded in the save like every listed chapter's, nothing in the experiments' store), the story (linted, attributed, the seam wired to the `all-ko` trigger), the guide card and document (cited, tied to the tactic's rows) and the advisor's line.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../../src/app/screens/frontend/chapterProgress.ts';
import { setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { MIRROR_AEONS, MIRROR_AEONS_ID, MIRROR_AEONS_TEXT } from '../../../src/data/chapter-mirror-aeons.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { darkAeonsGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID, MIRROR_ACT_I, MIRROR_ACT_I_PLATE, MIRROR_ACT_II_PLATE, MIRROR_AEONS_SCENE, MIRROR_SEAM, sistersGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { MIRROR_AEONS_GUIDE } from '../../../src/data/guides/mirror-aeons.ts';
import { MIRROR_AEONS_BOSS_IDS, PAY_GIL, SHIELD_AT_GAUGE, deltaThisRound, mirrorAeons } from '../../../src/engine/tactics/mirror-aeons.ts';
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

describe('the chapter is registered and LISTED: the last of the nineteen', () => {
  it('is found by id, FFX, numbered 27, no experiment, in CHAPTERS and CHAPTER_IDS (last) and in no experiments list', () => {
    expect(getChapter(MIRROR_AEONS_ID)).toBe(MIRROR_AEONS);
    expect(MIRROR_AEONS).toMatchObject({ id: 'mirror-aeons', game: 'ffx', number: 27, sceneKey: MIRROR_AEONS_SCENE });
    expect(MIRROR_AEONS.experimental, 'a listed chapter is no experiment').toBeUndefined();
    expect(CHAPTERS[CHAPTERS.length - 1]).toBe(MIRROR_AEONS);
    expect(CHAPTER_IDS[CHAPTER_IDS.length - 1]).toBe(MIRROR_AEONS_ID);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(EXPERIMENT_CHAPTERS).not.toContain(MIRROR_AEONS);
  });

  it("is Act I's formation (the pair) chained to Act II's, our scripts and the generic boss cue then Yojimbo's own; the card's words carry no number", () => {
    expect(MIRROR_AEONS.enemyGroupRef).toBe(darkAeonsGroupOf(MIRROR_ACT_I));
    expect(MIRROR_AEONS.scriptsRef).toBe(mirrorAeonsScripts);
    expect(MIRROR_AEONS.buildRef).toBe(mirrorAeonsBuild);
    expect(MIRROR_AEONS.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-challenge', phase2: 'boss-yojimbo', victory: 'victory-ffx' });
    for (const key of Object.values(MIRROR_AEONS.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
    expect(Object.keys(MIRROR_AEONS.sensorTexts).sort()).toEqual([DARK_CINDY_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID].sort());
    expect(Object.values(MIRROR_AEONS_TEXT).join(' ')).not.toMatch(/\d/);
  });

  it('has pause metadata with the numeral XXVII, three objectives the evaluator answers, and shipped art only', () => {
    const meta = getChapterMeta(MIRROR_AEONS_ID)!;
    expect(meta).toMatchObject({ id: MIRROR_AEONS_ID, gameLabel: 'FFX', numeral: 'XXVII', title: MIRROR_AEONS_TEXT.title, focalCharacterId: 'yuna' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['parts-downed', 'link-reached', 'victory']);
    expect((meta.objectives[0]!.rule as unknown as { targetIds: string[] }).targetIds).toEqual([DARK_SANDY_ID, DARK_MINDY_ID]); // the pair
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

describe('a listed chapter: the board and the save, like every other, and nothing in the experiments\' store', () => {
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has a card by default: an FFX card numbered XXVII, the last of its group, playable and unbeaten', () => {
    const tiles = buildChapterTiles(save);
    expect(tiles).toHaveLength(19);
    expect(tiles.find((t) => t.id === MIRROR_AEONS_ID)).toMatchObject({ id: MIRROR_AEONS_ID, numeral: 'XXVII', title: MIRROR_AEONS_TEXT.title, game: 'ffx', sceneKey: 'mushroom-rock-road', playable: true, cleared: false });
    const ffx = tiles.filter((t) => t.game === 'ffx');
    expect(ffx[ffx.length - 1]!.id).toBe(MIRROR_AEONS_ID);
  });

  it('keeps its attempts, clears and best time in the save under its id, with the same fields as any chapter, and writes nothing to the experiments\' store', () => {
    save.recordAttempt(MIRROR_AEONS_ID);
    save.recordClear(MIRROR_AEONS_ID, 480_000, 40);
    expect(save.chapter(MIRROR_AEONS_ID)).toMatchObject({ attempts: 1, cleared: true, bestTimeMs: 480_000, bestTurns: 40 });
    expect(Object.keys(save.snapshot().chapters)).toEqual([MIRROR_AEONS_ID]);
    expect(store, 'the experiments\' store is untouched').toEqual({});
  });

  it('shows the cleared ribbon from the save and counts in "N of 19"', () => {
    const card = (): { cleared: boolean } => buildChapterTiles(save).find((t) => t.id === MIRROR_AEONS_ID)!;
    expect(card().cleared).toBe(false);
    save.recordClear(MIRROR_AEONS_ID, 99_000, 30);
    expect(card().cleared).toBe(true);
    expect(save.isCleared(MIRROR_AEONS_ID)).toBe(true);
    const progress = boardProgress(buildChapterTiles(save), 0);
    expect([progress.beaten, progress.total]).toEqual([1, 19]);
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

  it('says what the files and the engine say: an aeon takes the big move, a blade cannot find Mindy, blades for Sandy, Zanmato a real chance; and no number', () => {
    const text = MIRROR_AEONS_GUIDE.rules.map((r) => r.text).join(' ');
    expect(text).toMatch(/Send an aeon in before the big move/);
    expect(text).toMatch(/Auto-Life does not turn it/);
    expect(text).toMatch(/Blades for Sandy, spells for Mindy/);
    expect(text).toMatch(/Zanmato is a real chance/);
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
    const asked = ['Quick Hit', 'Potion', 'Hi-Potion', 'X-Potion', 'Dismiss', 'Ultima', 'Flare', 'Thundaga', 'Firaga', 'Blizzaga', 'Waterga', 'Curaga', 'Cura', 'Cure', 'Auto-Life', 'Cheer', 'Pay', 'Combine for the Delta Attack'];
    for (const h of MIRROR_AEONS_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });
});

describe('the tactic: the shield for the big move, the heal, Auto-Life and Cheer, blades for Sandy, a spell for Mindy', () => {
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
  const TRIO = sistersGroupId('kino00_70');
  const fighter = (e: ReturnType<typeof H.newEngine>, id: string): FFXCombatant => e.state().combatants[id] as FFXCombatant;

  it('is registered for all four Dark Aeons under the chapter id and reaches the engine through the lookup', () => {
    expect(MIRROR_AEONS_BOSS_IDS).toEqual([DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID, DARK_YOJIMBO_ID]);
    expect(tacticFor(H.newEngine(1))).toBe(mirrorAeons);
    expect(tacticFor(H.newEngine(1, H.ACT_II_GROUP))).toBe(mirrorAeons);
  });

  it("Tidus swings Quick Hit at Cindy when she is there (a blade always finds her) and at Sandy in the pair; Mindy is the spells' sister", () => {
    const trio = H.newEngine(1, TRIO);
    expect(mirrorAeons('tidus', H.nextInput(trio).commands, trio)).toMatchObject({ kind: 'ability', id: 'quick-hit', targets: [DARK_CINDY_ID] });
    const pair = H.newEngine(1);
    const d = H.nextInput(pair);
    expect(d.actorId).toBe('tidus');
    expect(mirrorAeons('tidus', d.commands, pair)).toMatchObject({ kind: 'ability', id: 'quick-hit', targets: [DARK_SANDY_ID] });
  });

  it('Lulu casts her strongest spell at Mindy, the sister a blade cannot touch', () => {
    const e = H.newEngine(1);
    const pick = mirrorAeons('lulu', inputOf(e, 'lulu').commands, e);
    expect(pick).toMatchObject({ kind: 'ability', targets: [DARK_MINDY_ID] });
    expect(['ultima', 'flare']).toContain((pick as { id: string }).id);
  });

  it('against the faithful trio Yuna sends in her own Sisters on her first turn (the Delta Attack is forecast from the full gauges); in the pair she does not summon at all', () => {
    const trio = H.newEngine(1, TRIO);
    expect(mirrorAeons('yuna', inputOf(trio, 'yuna').commands, trio)).toMatchObject({ kind: 'summon', id: 'cindy' });
    const pair = H.newEngine(1);
    const pick = mirrorAeons('yuna', inputOf(pair, 'yuna').commands, pair)!;
    expect(pick.kind).not.toBe('summon');
  });

  it('the Delta Attack forecast runs the round on the gauges: Mindy and Sandy gain 20 before Cindy, so 80, 80 and 100 is a Delta Attack this round, 60 is not, a dead Sister never', () => {
    const sisters = (m: number, s: number, c: number): FFXCombatant[] =>
      ([['dark-mindy', m], ['dark-sandy', s], ['dark-cindy', c]] as const).map(([id, g]) => ({ id, overdrive: { gauge: g } }) as unknown as FFXCombatant);
    expect(deltaThisRound(sisters(100, 100, 100))).toBe(true);
    expect(deltaThisRound(sisters(80, 80, 100))).toBe(true);
    expect(deltaThisRound(sisters(60, 80, 100))).toBe(false);
    expect(deltaThisRound(sisters(80, 80, 80))).toBe(false);
    expect(deltaThisRound(sisters(100, 40, 100)), 'Mindy at 100 with the trio not ready throws Mega Graviton and drops out of step').toBe(false);
    expect(deltaThisRound(sisters(100, 100, 100).slice(1))).toBe(false);
  });

  it("heals a member under 60 percent with Yuna's spell, lets the others keep swinging unless they are under a quarter (or Yuna is down), and revives the fallen first of all", () => {
    const e = H.newEngine(1);
    const d = inputOf(e, 'yuna');
    const tidus = fighter(e, 'tidus');
    tidus.hp = Math.floor(tidus.stats.maxHp * 0.3);
    expect(mirrorAeons('yuna', d.commands, e)).toMatchObject({ kind: 'ability', id: 'curaga', targets: ['tidus'] });
    expect(mirrorAeons('tidus', d.commands, e)).not.toMatchObject({ kind: 'item' });
    tidus.hp = Math.floor(tidus.stats.maxHp * 0.2);
    expect(mirrorAeons('tidus', d.commands, e)).toMatchObject({ kind: 'item', targets: ['tidus'] });
    tidus.hp = 0;
    tidus.alive = false;
    expect(mirrorAeons('yuna', d.commands, e)).toMatchObject({ kind: 'item', id: 'phoenix-down', targets: ['tidus'] });
  });

  it('Yuna puts Auto-Life on whoever lacks it before she attacks; against Dark Yojimbo Tidus builds five stacks of Cheer first, and against the Sisters he does not', () => {
    const e = H.newEngine(1, H.ACT_II_GROUP);
    expect(mirrorAeons('yuna', inputOf(e, 'yuna').commands, e)).toMatchObject({ kind: 'ability', id: 'auto-life' });
    const f = H.newEngine(1, H.ACT_II_GROUP);
    const tidus = H.nextInput(f);
    expect(mirrorAeons('tidus', tidus.commands, f)).toMatchObject({ kind: 'ability', id: 'cheer', targets: ['tidus'] });
    const pair = H.newEngine(1);
    expect(mirrorAeons('tidus', H.nextInput(pair).commands, pair)).not.toMatchObject({ id: 'cheer' });
  });

  it('in Act II every blow is aimed at Dark Yojimbo, never the dog', () => {
    const e = H.newEngine(1, H.ACT_II_GROUP);
    const pick = mirrorAeons('lulu', inputOf(e, 'lulu').commands, e)!;
    expect((pick as { targets: string[] }).targets).toEqual([DARK_YOJIMBO_ID]);
  });

  it("Dark Yojimbo's gauge within a round of full sends the mirror in, Yuna's own Yojimbo, who is paid while the blow is next and goes home once it has passed", () => {
    // Dark Yojimbo may act before the summoned aeon's first turn: take the first seed on which Yojimbo's own menu opens.
    let e = H.newEngine(1, H.ACT_II_GROUP);
    let out: H.Input | undefined;
    for (let seed = 1; seed <= 20 && out?.actorId !== 'yojimbo'; seed++) {
      e = H.newEngine(seed, H.ACT_II_GROUP);
      const d = inputOf(e, 'yuna');
      expect(mirrorAeons('yuna', d.commands, e)).not.toMatchObject({ kind: 'summon' });
      fighter(e, DARK_YOJIMBO_ID).overdrive!.gauge = SHIELD_AT_GAUGE;
      const summon = mirrorAeons('yuna', d.commands, e);
      expect(summon).toMatchObject({ kind: 'summon', id: 'yojimbo' });
      e.submit({ ...summon!, targets: [] } as Command);
      out = H.nextInput(e);
    }
    if (out === undefined) throw new Error('no menu');
    expect(out.actorId).toBe('yojimbo');
    expect(mirrorAeons('yojimbo', out.commands, e)).toMatchObject({ kind: 'ability', id: 'yojimbo-pay', gilSpent: PAY_GIL });
    fighter(e, DARK_YOJIMBO_ID).overdrive!.gauge = 0;
    expect(mirrorAeons('yojimbo', out.commands, e)).toMatchObject({ kind: 'dismiss' });
  });

  it("Yuna's Sisters Combine when the menu offers it (their gauges start full) and leave when it does not", () => {
    const e = H.newEngine(2);
    const d = inputOf(e, 'yuna');
    const summon = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Cindy')!;
    e.submit({ ...summon.command, targets: [] });
    const next = H.nextInput(e);
    expect(['cindy', 'sandy', 'mindy']).toContain(next.actorId);
    expect(mirrorAeons(next.actorId, next.commands, e)).toMatchObject({ kind: 'ability', id: 'sister-order-combine' });
    const without = next.commands.filter((c) => !(c.command.kind === 'ability' && c.command.id === 'sister-order-combine'));
    expect(mirrorAeons(next.actorId, without, e)).toMatchObject({ kind: 'dismiss' });
  });
});
