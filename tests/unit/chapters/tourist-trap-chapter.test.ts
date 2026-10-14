// @vitest-environment jsdom
/**
 * Tourist Trap (the optional FFX-2 mission, Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter): the chapter as the app sees it. **FFX-2 only.**
 *
 * What this pins: the registration (hidden, number 23, nowhere in the eighteen, found by `getChapter`, its pause metadata, its scene and music), the experiments' store (attempts and clears
 * never touch the save), the story (linted, attributed, the two callouts reach real moves), the guide card and document (cited, tied to the tactic's labels) and the tactic's line, including
 * the turn after Zanmato (a Mega-Potion from the bag before any spell: everyone is at 1 MP).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { AC } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../../src/app/screens/frontend/chapterProgress.ts';
import {
  EXPERIMENTS_KEY,
  experimentProgress,
  experimentRecord,
  recordExperimentClear,
  setExperimentStorageForTests,
} from '../../../src/app/experiments/experimentRecords.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_TOURIST_TRAP, TOURIST_TRAP_ID, TOURIST_TRAP_TEXT } from '../../../src/data/chapter-ffx2-tourist-trap.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { TOURIST_TRAP_PLATE, TOURIST_TRAP_SCENE } from '../../../src/data/tourist-trap-ids.ts';
import { cavernYojimboGroup, X2_DAIGORO_ID, X2_YOJIMBO_ID } from '../../../src/data/ffx2/enemies/tourist-trap.ts';
import { YOJIMBO_ACTIONS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { FFX2_TOURIST_TRAP_GUIDE } from '../../../src/data/guides/ffx2-tourist-trap.ts';
import { ffx2TouristTrap, TOURIST_TRAP_BOSS_IDS } from '../../../src/engine/tactics/ffx2-tourist-trap.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';
import { getScene, getSceneFactory, sceneKeys } from '../../../src/scenes/index.ts';
import { DAIGORO_FIGURE_HEIGHT, TOURIST_TRAP_GIRLS_MEAN, TOURIST_TRAP_SLOTS, YOJIMBO_FIGURE_HEIGHT } from '../../../src/scenes/tourist-trap-cavern.ts';
import { DJOSE_PARTY_HEIGHT } from '../../../src/scenes/djose-chamber.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import { ffx2TouristTrapScripts } from '../../../src/story/scripts/ffx2-tourist-trap.ts';
import { MID_SCRIPT_BUDGET_MS, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

// ----------------------------------------------------------------------------------------------------------------------------------------- registration

describe('the chapter is registered, hidden, and nowhere in the eighteen', () => {
  it('is found by id, FFX-2, an experiment numbered 23, in EXPERIMENT_CHAPTERS and neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(getChapter(TOURIST_TRAP_ID)).toBe(FFX2_TOURIST_TRAP);
    expect(FFX2_TOURIST_TRAP).toMatchObject({ id: 'ffx2-tourist-trap', game: 'ffx2', number: 23, experimental: true, sceneKey: TOURIST_TRAP_SCENE });
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_TOURIST_TRAP);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(TOURIST_TRAP_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(TOURIST_TRAP_ID)).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect(new Set(EXPERIMENT_CHAPTERS.map((c) => c.number)).size).toBe(EXPERIMENT_CHAPTERS.length); // every hidden number is its own
  });

  it('is the one formation, the Chapter 3 preset, our scripts and the sourced music', () => {
    expect(FFX2_TOURIST_TRAP.enemyGroupRef).toBe(cavernYojimboGroup);
    expect(FFX2_TOURIST_TRAP.scriptsRef).toBe(ffx2TouristTrapScripts);
    const build = FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild;
    expect(build.game).toBe('ffx2');
    expect(build.members.map((m) => [m.id, m.level])).toEqual([['yuna', 32], ['rikku', 33], ['paine', 34]]); // the Chapter 3 preset, an estimate (research is silent)
    expect(FFX2_TOURIST_TRAP.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-fallen-aeons', victory: 'victory-ffx2' });
    for (const key of Object.values(FFX2_TOURIST_TRAP.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
    expect(cavernYojimboGroup.musicCues?.[0]?.track).toBe('boss-ffx2-fallen-aeons');
    expect(Object.keys(FFX2_TOURIST_TRAP.sensorTexts)).toEqual([X2_YOJIMBO_ID]);
  });

  it('has pause metadata with the EXP numeral, three objectives that mean something in this fight, and approved art only', () => {
    const meta = getChapterMeta(TOURIST_TRAP_ID)!;
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ id: TOURIST_TRAP_ID, gameLabel: 'FFX-2', numeral: 'EXP', title: TOURIST_TRAP_TEXT.title });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['status-cured', 'survived-ability', 'victory']);
    expect(meta.objectives[0]!.rule).toEqual({ kind: 'status-cured', status: 'poison' });
    const zan = meta.objectives[1]!.rule as { ability: string };
    expect(zan.ability).toBe(YOJIMBO_ACTIONS.zanmato);
    expect(ABILITIES[zan.ability], 'the objective names a real move').toBeDefined();
    for (const k of meta.musicKeys) expect(hasTrack(k), k).toBe(true);
    for (const s of meta.snapshots) expect(s.image).toMatch(/^(backdrops|characters)\/[a-z0-9-]+(\/idle)?(\.png|[a-z-]*\.png)$/);
    expect(meta.snapshots.map((s) => s.image)).toEqual([`backdrops/${TOURIST_TRAP_PLATE}.png`, 'characters/yojimbo-cavern/idle.png', 'characters/daigoro/idle.png']);
  });

  it("has a scene: Chapter IX's approved plate under the FFX-2 camera, both figures staged at their models' ratio to the girls, and a pyreflies canon row", () => {
    expect(sceneKeys()).toContain(TOURIST_TRAP_SCENE);
    const entry = getScene(TOURIST_TRAP_SCENE)!;
    expect(entry.placeholder).toBe(false);
    expect(entry.slots).toBe(TOURIST_TRAP_SLOTS);
    expect(getSceneFactory(TOURIST_TRAP_SCENE)).toBeTypeOf('function');
    expect(TOURIST_TRAP_PLATE).toBe('cavern-stolen-fayth'); // the FFX Chapter IX plate, read in place: no copy and no new art
    expect(TOURIST_TRAP_SLOTS.party).toHaveLength(3);
    expect(TOURIST_TRAP_SLOTS.partyHeight).toBe(DJOSE_PARTY_HEIGHT);
    expect(Object.keys(TOURIST_TRAP_SLOTS.enemySpots ?? {}).sort()).toEqual([X2_DAIGORO_ID, X2_YOJIMBO_ID].sort());
    expect(TOURIST_TRAP_SLOTS.figureHeights?.[X2_YOJIMBO_ID]).toBe(YOJIMBO_FIGURE_HEIGHT);
    expect(TOURIST_TRAP_SLOTS.figureHeights?.[X2_DAIGORO_ID]).toBe(DAIGORO_FIGURE_HEIGHT);
    expect(YOJIMBO_FIGURE_HEIGHT / DJOSE_PARTY_HEIGHT).toBeCloseTo(27.101 / TOURIST_TRAP_GIRLS_MEAN, 2); // 1.53 times the girls
    expect(DAIGORO_FIGURE_HEIGHT / DJOSE_PARTY_HEIGHT).toBeCloseTo(7.972 / TOURIST_TRAP_GIRLS_MEAN, 2); // 0.45 times the girls
    expect(pyreflyCanonFor(TOURIST_TRAP_SCENE)).toMatchObject({ game: 'ffx2', verdict: 'unattested' });
    // The FFX scene is untouched: Chapter IX still uses its own key and its own slots.
    expect(getScene('cavern-stolen-fayth')!.slots).not.toBe(TOURIST_TRAP_SLOTS);
    expect(getChapter('yojimbo-cavern')!.sceneKey).toBe('cavern-stolen-fayth');
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the store

describe("an experiment, not a chapter: the board, the experiments' store and the save", () => {
  const WITH_CARD = { experiments: EXPERIMENT_CHAPTERS.filter((c) => c.id === TOURIST_TRAP_ID) } as const;
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has no card by default; handed in, it is the last FFX-2 card, after the eighteen, labelled EXP', () => {
    expect(buildChapterTiles(save)).toHaveLength(18);
    const last = buildChapterTiles(save, WITH_CARD).at(-1)!;
    expect(last).toMatchObject({ id: TOURIST_TRAP_ID, numeral: 'EXP', title: TOURIST_TRAP_TEXT.title, game: 'ffx2', sceneKey: TOURIST_TRAP_SCENE, playable: true });
  });

  it("keeps its attempts and clears in the experiments' store and writes nothing to the save", () => {
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt(TOURIST_TRAP_ID);
    experimentProgress.recordAttempt(TOURIST_TRAP_ID);
    experimentProgress.recordClear(TOURIST_TRAP_ID, 321_000, 40);
    expect(experimentRecord(TOURIST_TRAP_ID)).toMatchObject({ attempts: 2, clears: 1, bestTimeMs: 321_000 });
    expect(Object.keys(JSON.parse(store[EXPERIMENTS_KEY]!))).toEqual([TOURIST_TRAP_ID]);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(save.snapshot().chapters[TOURIST_TRAP_ID]).toBeUndefined();
    expect(window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '').not.toContain(TOURIST_TRAP_ID);
  });

  it("shows the cleared ribbon from the experiments' store, never from the save, and no part of 'N of 18'", () => {
    expect(buildChapterTiles(save, WITH_CARD).at(-1)!.cleared).toBe(false);
    recordExperimentClear(TOURIST_TRAP_ID, 99_000);
    expect(buildChapterTiles(save, WITH_CARD).at(-1)!.cleared).toBe(true);
    expect(save.isCleared(TOURIST_TRAP_ID)).toBe(false);
    const progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect([progress.beaten, progress.total]).toEqual([0, 18]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the story

describe('the story: our own words, attributed, linted, and the callouts reach real moves', () => {
  const S = ffx2TouristTrapScripts;
  const speakers = new Set(['none', 'yuna-x2', 'rikku-x2', 'paine']);
  const linesOf = (script: readonly unknown[]): Array<{ speaker: string; text: string }> =>
    (script as Array<{ kind?: string; type?: string; speaker?: string; text?: string }>).filter((s) => typeof s.text === 'string' && typeof s.speaker === 'string').map((s) => ({ speaker: s.speaker!, text: s.text! }));

  it('lints clean in the pre, the post and both mid scripts', () => {
    for (const [name, script] of [['pre', S.pre], ['post', S.post], ...Object.entries(S.midScripts ?? {})] as Array<[string, never]>) expect(lintScript(script), name).toEqual([]);
  });

  it('every spoken line has an attributed speaker the game has a portrait for (or the narration plate), and no line quotes a retail line', () => {
    for (const script of [S.pre, S.post, ...Object.values(S.midScripts ?? {})]) {
      for (const line of linesOf(script)) {
        expect(speakers.has(line.speaker), `${line.speaker}: ${line.text}`).toBe(true);
        expect(line.text.length).toBeGreaterThan(2);
      }
    }
    const all = [S.pre, S.post, ...Object.values(S.midScripts ?? {})].flatMap((s) => linesOf(s).map((l) => l.text)).join(' ');
    expect(all).not.toMatch(/§|\bffx2?-/i);
  });

  it('the two mid-battle triggers name the real moves and real scripts, once each, and fit the mid-script budget', () => {
    expect(S.mid?.map((t) => t.id)).toEqual(['first-kozuka', 'first-zanmato']);
    for (const t of S.mid ?? []) {
      expect(t.once).toBe(true);
      const when = t.when as { type: string; who: string; ability: string };
      expect(when).toMatchObject({ type: 'ability-used', who: X2_YOJIMBO_ID });
      expect(ABILITIES[when.ability], `${t.id} names a real move`).toBeDefined();
      const script = S.midScripts?.[t.script as string];
      expect(script, t.script).toBeDefined();
      expect(scriptDurationMs(script!)).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(script!)).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS + 3_000);
    }
    expect(Object.keys(S.midScripts ?? {}).sort()).toEqual(['first-kozuka', 'first-zanmato']);
  });

  it('opens with the field bed and ends its pre on the battle start; its post opens on the results tally', () => {
    const kinds = (script: readonly unknown[]): string[] => (script as Array<{ kind?: string; type?: string }>).map((s) => s.kind ?? s.type ?? '?');
    expect(kinds(S.pre)[0]).toMatch(/music/);
    expect(kinds(S.pre).at(-1)).toMatch(/battle/i);
    expect(kinds(S.post)[0]).toMatch(/result/i);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- the guide and the tactic

describe('the guide card and document, and the line they teach', () => {
  const cite = /^(ffx|ffx2)-[a-z0-9-]+ §/;
  it('the card is registered under the chapter id and the one boss id, and every sentence it prints is cited in the corpus form', () => {
    expect(GUIDES.find((g) => g.id === TOURIST_TRAP_ID)).toBe(FFX2_TOURIST_TRAP_GUIDE);
    expect(FFX2_TOURIST_TRAP_GUIDE.bossIds).toEqual([X2_YOJIMBO_ID]);
    for (const r of FFX2_TOURIST_TRAP_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of FFX2_TOURIST_TRAP_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of FFX2_TOURIST_TRAP_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    expect(FFX2_TOURIST_TRAP_GUIDE.clockRules?.wait, 'the Wait habit line leads the rules under Wait').toBeDefined();
  });

  it('says what the research says and no more: the 14th turn, a Mega-Potion first, Kozuka poisons, Daigoro cannot be targeted', () => {
    const text = FFX2_TOURIST_TRAP_GUIDE.rules.map((r) => r.text).join(' ');
    expect(text).toMatch(/fourteenth/);
    expect(text).toMatch(/Mega-Potion/);
    expect(text).toMatch(/Kozuka/);
    expect(text).toMatch(/Daigoro cannot be targeted/);
    expect(text).not.toMatch(/Jegged says|according to Jegged/i); // his page for this mission was not read: the card says whose strategy it follows in its source note
    expect(text).not.toMatch(/reflect/i); // the wiki's Reflect immunity is not in the game's row
  });

  it('the document has the boss page, the loot row and the rows the game gives, and is registered', () => {
    const doc = docForChapter(TOURIST_TRAP_ID)!;
    expect(doc).toMatchObject({ id: TOURIST_TRAP_ID, game: 'ffx2', bossIds: [X2_YOJIMBO_ID] });
    const loot = doc.blocks.find((b) => b.t === 'loot') as unknown as { rows: Array<{ enemy: string; hp: string; steal: string; drop: string }> };
    expect(loot.rows).toEqual([{ enemy: 'Yojimbo', hp: '22,000', steal: 'Power Wrist', drop: 'Recovery Bracer' }]);
    expect(doc.blocks.some((b) => b.t === 'head' && ((b as unknown as { at?: readonly string[] }).at ?? []).includes(X2_YOJIMBO_ID))).toBe(true);
  });

  it('every label a hint speaks to is a row the tactic asks for', () => {
    const asked = ['Darkness', 'Protect', 'Esuna', 'Remedy', 'Phoenix Down', 'Life', 'Mega-Potion', 'Curaga', 'Cura', 'Hi-Potion', 'Ether', 'Pray'];
    for (const h of FFX2_TOURIST_TRAP_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });
});

const PROTECT = { id: 'protect', turnsRemaining: null, ticksRemaining: 99_999_999, charges: null, stacks: 0, permanent: false } as never;

describe("the tactic: Protect first, a heal from the bag the turn after Zanmato, Esuna for the Poison, Darkness for the Knights", () => {
  function engineAt(ac: number): FFX2Engine {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(3);
    engine.init({ game: 'ffx2', party: FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild, enemies: cavernYojimboGroup, triggers: [], seed: 3, condition: 'normal', canEscape: false });
    (engine.state().combatants[X2_YOJIMBO_ID] as unknown as Ffx2Unit).aiMemory = { [AC]: ac };
    return engine;
  }
  /** The next menu of `who`, the others defending. */
  function menuOf(engine: FFX2Engine, who: string) {
    for (let i = 0; i < 4000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') throw new Error('the battle ended');
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') {
        if (d.actorId === who) return d;
        engine.submit({ kind: 'defend', targets: [] });
      }
    }
    throw new Error('no menu');
  }

  it('is registered for the one boss id under the chapter id, and gives way (null) when Yojimbo is not on the field', () => {
    expect(TOURIST_TRAP_BOSS_IDS).toEqual([X2_YOJIMBO_ID]);
    const engine = engineAt(0);
    expect(tacticFor(engine)).toBe(ffx2TouristTrap);
    const dead = engineAt(0);
    const d = menuOf(dead, 'yuna'); // a real menu first: with Yojimbo down the battle is over and there is no next one
    (dead.state().combatants[X2_YOJIMBO_ID] as unknown as { alive: boolean }).alive = false;
    expect(ffx2TouristTrap('yuna', d.commands, dead)).toBeNull();
  });

  it('opens with Protect for the party (nobody is hurt) and sends the Dark Knights to Darkness', () => {
    const engine = engineAt(0);
    const yuna = menuOf(engine, 'yuna');
    expect(ffx2TouristTrap('yuna', yuna.commands, engine)).toMatchObject({ kind: 'ability', id: 'x2-white-mage-protect' });
    const rikku = menuOf(engine, 'rikku');
    expect(ffx2TouristTrap('rikku', rikku.commands, engine)).toMatchObject({ kind: 'ability', id: 'x2-dark-knight-darkness' });
  });

  it('the turn after Zanmato (everyone at 1 HP and 1 MP) is a Mega-Potion from the bag, not a spell and not an Ether', () => {
    const engine = engineAt(100);
    for (const id of ['yuna', 'rikku', 'paine']) (engine.state().combatants[id]!.statuses as Record<string, unknown>)['protect'] = PROTECT;
    // Let Yojimbo's first poll (Zanmato) land while the girls defend, then ask Yuna.
    let guard = 0;
    while (guard++ < 4000 && !engine.state().log.some((e) => e.type === 'action-end' && (e as { actorId?: string }).actorId === X2_YOJIMBO_ID)) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
    }
    for (const id of ['yuna', 'rikku', 'paine']) expect([engine.state().combatants[id]!.hp, engine.state().combatants[id]!.mp], id).toEqual([1, 1]);
    const yuna = menuOf(engine, 'yuna');
    const pick = ffx2TouristTrap('yuna', yuna.commands, engine);
    expect(pick, 'Yuna asks for a bag heal').toMatchObject({ kind: 'item', id: 'x2-mega-potion' });
  });

  it('cures a poisoned girl with Esuna (a Remedy when Esuna is out of reach), after the party heal and before anything else', () => {
    const engine = engineAt(0);
    for (const id of ['yuna', 'rikku', 'paine']) (engine.state().combatants[id]!.statuses as Record<string, unknown>)['protect'] = PROTECT;
    (engine.state().combatants['rikku']!.statuses as Record<string, unknown>)['poison'] = { id: 'poison', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    const yuna = menuOf(engine, 'yuna');
    expect(ffx2TouristTrap('yuna', yuna.commands, engine)).toMatchObject({ kind: 'ability', id: 'x2-white-mage-esuna', targets: ['rikku'] });
    const noEsuna = yuna.commands.map((c) => (c.command.kind === 'ability' && (c.command as { id: string }).id === 'x2-white-mage-esuna' ? { ...c, enabled: false } : c));
    expect(ffx2TouristTrap('yuna', noEsuna, engine)).toMatchObject({ kind: 'item', id: 'x2-remedy', targets: ['rikku'] });
  });
});
