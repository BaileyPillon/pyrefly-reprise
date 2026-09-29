/**
 * **Sin's two chapters, as listed on 2026-09-29** (D-279: the driver's picks, which Bailey delegated): Chapter XVII
 * "Sin: the Fins and the Core" and Chapter XVIII "Sin: the Face". The board, the pause card, the story registry, the
 * guide and tactic, the scenes over the picked plates (with the fallback to Evrae's deck), the card plates, the
 * jukebox, and the picked paintings wired by their keys: the Fins' NEAR / FAR / charged staging, Genais's shell,
 * the Core's charge and the head's five mouth stages, each falling back to the stage's silhouette when the files are
 * not installed. **FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]; the listing is shared plumbing.
 */
import { Group, Vector3 } from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { CHAPTER_IDS, CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { SIN_FINS_CORE } from '../../../src/data/chapter-sin-fins-core.ts';
import { SIN_FACE } from '../../../src/data/chapter-sin-face.ts';
import { guideForChapter } from '../../../src/data/guides/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { PLATE_COMPOSITIONS } from '../../../src/app/screens/frontend/chapterPlates.ts';
import { getScene, getSceneFactory, isPlaceholderScene } from '../../../src/scenes/index.ts';
import { SIN_BEVELLE_PLATE, SIN_FLIGHT_PLATE } from '../../../src/scenes/evrae-airship-sin.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../../src/scenes/evrae-airship-deck.ts';
import { AirshipRangeDirector, keepUpright } from '../../../src/scenes/evrae-airship-director.ts';
import { LEFT_FIN_SUBJECT, RIGHT_FIN_SUBJECT, evraeSubject, rangeSubjectFor } from '../../../src/scenes/evrae-airship-subjects.ts';
import { EVRAE_WORLD_HEIGHT, RANGE_STAGING, farWorldWidth } from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { OVERDRIVE_SIN_PLACEMENT, followSinPoses, restPoseMap } from '../../../src/app/screens/BattleScreenSinPoses.ts';
import { AI_EMITTED_TRIGGERS, CHAIN_SEAMS, STORY_CHAPTERS } from '../../../src/story/registry.ts';
import { SIN_FINS_CORE_SEAMS, sinFinsCoreScripts } from '../../../src/story/scripts/sin-fins-core.ts';
import { sinFaceScripts } from '../../../src/story/scripts/sin-face.ts';
import { hasTrack } from '../../../src/audio/tracks/index.ts';

const SIN = ['sin-fins-core', 'sin-face'] as const;

afterEach(() => resetArtManifest());

/** A manifest listing the picked Sin paintings as `INSTALL.md` stages them (the 32 images' subjects). */
function sinManifest(): ArtManifest {
  const subject = (states: string[]) => ({ states: [...states].sort(), portrait: false, facing: 'front' as const });
  return {
    version: 1,
    generatedAt: 'test',
    subjects: {
      'sin-left-fin': subject(['idle', 'idle-near', 'idle-far', 'charge-near', 'charge-far']),
      'sin-right-fin': subject(['idle', 'idle-near', 'idle-far', 'charge-near', 'charge-far']),
      'sinspawn-genais': subject(['idle', 'shell']),
      'sin-core': subject(['idle', 'charge']),
      'overdrive-sin': subject(['idle', 'stage-0', 'stage-1', 'stage-2', 'stage-3', 'stage-4']),
    },
    portraits: ['left-fin', 'right-fin', 'sinspawn-genais', 'sin-core', 'overdrive-sin'],
    backdrops: [SIN_FLIGHT_PLATE, SIN_BEVELLE_PLATE, 'sin-back'],
    pause: ['ch17-sin-fins-core', 'ch18-sin-face'],
    pause2x: ['ch17-sin-fins-core', 'ch18-sin-face'],
    title: [],
    title2x: [],
  } as ArtManifest;
}
/** The same manifest before the install: no Sin subject at all. */
function bareManifest(): ArtManifest {
  return { ...sinManifest(), subjects: {}, backdrops: [], pause: [], pause2x: [] } as ArtManifest;
}

describe('the listing (plan §6, the Ixion listing 925ec32a as the template)', () => {
  it('both are listed after Chapter XVI, as XVII and XVIII, FFX, in CHAPTERS, CHAPTER_IDS and CHAPTER_META', () => {
    expect(CHAPTER_IDS.slice(-3)).toEqual(['ffx2-ixion-djose', ...SIN]);
    expect(CHAPTERS.slice(-2)).toEqual([SIN_FINS_CORE, SIN_FACE]);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toEqual(['ff7-guard-scorpion']);
    expect([SIN_FINS_CORE.number, SIN_FACE.number, SIN_FINS_CORE.game, SIN_FACE.game]).toEqual([17, 18, 'ffx', 'ffx']);
    expect(CHAPTER_META.slice(-2).map((m) => [m.id, m.numeral, m.gameLabel])).toEqual([
      ['sin-fins-core', 'XVII', 'FFX'],
      ['sin-face', 'XVIII', 'FFX'],
    ]);
    for (const id of SIN) expect(getChapter(id)?.id).toBe(id);
  });

  it('the story registry holds both, with the two fin seams on the seam budget and no AI-emitted names', () => {
    expect(STORY_CHAPTERS['sin-fins-core']).toBe(sinFinsCoreScripts);
    expect(STORY_CHAPTERS['sin-face']).toBe(sinFaceScripts);
    expect(CHAIN_SEAMS['sin-fins-core']).toEqual([...SIN_FINS_CORE_SEAMS]);
    expect(CHAIN_SEAMS['sin-face']).toEqual([]);
    expect([AI_EMITTED_TRIGGERS['sin-fins-core'], AI_EMITTED_TRIGGERS['sin-face']]).toEqual([[], []]);
  });

  it('the guide, the tactic lookup and the card plates find both by id', () => {
    for (const id of SIN) {
      expect(guideForChapter(id)?.id).toBe(id);
      expect(CHAPTER_GAME[id]).toBe('ffx');
    }
    expect(PLATE_COMPOSITIONS['sin-fins-core']!.layers.map((l) => l.key)).toEqual(['sin-left-fin']);
    expect(PLATE_COMPOSITIONS['sin-face']!.layers.map((l) => l.key)).toEqual(['overdrive-sin']);
  });

  it('the pause card names the picked plates, with an existing portrait as the fallback, and the jukebox rows are real tracks (stand-ins, labelled)', () => {
    expect(getChapterMeta('sin-fins-core')).toMatchObject({ heroArt: 'pause/ch17-sin-fins-core', heroArtFallback: 'portraits/tidus.png' });
    expect(getChapterMeta('sin-face')).toMatchObject({ heroArt: 'pause/ch18-sin-face', heroArtFallback: 'portraits/yuna.png' });
    for (const id of SIN) {
      const meta = getChapterMeta(id)!;
      for (const key of meta.musicKeys) expect(hasTrack(key), key).toBe(true);
      const music = getChapter(id)!.music;
      for (const key of [music.scene, music.battle, music.victory]) expect(key && hasTrack(key), String(key)).toBe(true);
    }
  });
});

describe('the scenes: the deck over the picked plates (D-279), falling back to Evrae\'s painting', () => {
  it('each chapter names its plate; both keys are real factories on the deck\'s slots, with a canon row', () => {
    expect([SIN_FINS_CORE.sceneKey, SIN_FACE.sceneKey]).toEqual([SIN_FLIGHT_PLATE, SIN_BEVELLE_PLATE]);
    for (const key of [SIN_FLIGHT_PLATE, SIN_BEVELLE_PLATE]) {
      expect(getSceneFactory(key), key).toBeTypeOf('function');
      expect(isPlaceholderScene(key)).toBe(false);
      expect(getScene(key)?.slots).toBe(EVRAE_AIRSHIP_DECK_SLOTS);
      expect(PYREFLY_CANON[key]).toMatchObject({ game: 'ffx', verdict: 'absent' });
    }
  });
});

// ---------------------------------------------------------------------------
// The Fins on the range director
// ---------------------------------------------------------------------------

function fakeDeck(): AirshipDeck {
  return { group: new Group(), layers: [], wind: 1, setHaze(): void {}, update(): void {}, dispose(): void {} } as unknown as AirshipDeck;
}
const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };

function fakeActor() {
  const loads: Array<Record<string, string>> = [];
  const actor = {
    pose: 'idle',
    u: { rimStrength: { value: 0.7 } },
    extents: { maxExtent: 2.2, minExtent: 0.5, proneAspect: 1.15 },
    lifeState: 'alive',
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    poseSize: [10, 5] as [number, number],
    setAlpha(): void {},
    async loadPoses(map: Record<string, string>): Promise<void> {
      loads.push({ ...map });
    },
  };
  return { actor, loads, idle: (): string => loads[loads.length - 1]?.['idle'] ?? '' };
}
async function settle(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
const finFlags = (range: 'near' | 'far', charged: boolean) => ({ flags: { 'airship.range': range, 'sin.fin.charged': charged } });

describe('the Fins, Fin A (D-279), staged by the range director', () => {
  it('the Fin ids pick their own subjects; Evrae keeps its own numbers exactly', () => {
    expect(rangeSubjectFor('left-fin')).toBe(LEFT_FIN_SUBJECT);
    expect(rangeSubjectFor('right-fin')).toBe(RIGHT_FIN_SUBJECT);
    expect([LEFT_FIN_SUBJECT.artId, RIGHT_FIN_SUBJECT.artId]).toEqual(['sin-left-fin', 'sin-right-fin']);
    const evrae = evraeSubject();
    expect(rangeSubjectFor('evrae')).toMatchObject({ artId: 'evrae', nearScale: 1, upright: false, strict: false });
    expect(evrae.farWidth).toBe(farWorldWidth(EVRAE_WORLD_HEIGHT));
    expect(evrae.spot).toEqual({ near: RANGE_STAGING.near.evrae, far: RANGE_STAGING.far.evrae });
    expect(evrae.charge).toEqual({ near: 'breath-charge' });
  });

  it('a painted Fin stands at its painted spot and size, upright, and shows its lit core at either range while charged', async () => {
    setArtManifest(sinManifest());
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const { actor, idle } = fakeActor();
    await director.bindEvrae(actor as never, 'left-fin');
    expect(actor.extents.proneAspect).toBe(Number.POSITIVE_INFINITY);
    expect(idle()).toMatch(/characters\/sin-left-fin\/idle\.png$/);
    expect(actor.position.toArray()).toEqual([...LEFT_FIN_SUBJECT.spot.near]);
    expect(actor.scale.x).toBeCloseTo(LEFT_FIN_SUBJECT.nearScale, 6);

    director.sync(finFlags('near', true));
    await settle();
    expect(idle()).toMatch(/sin-left-fin\/charge-near\.png$/);

    director.setRange('far', { immediate: true });
    await settle();
    expect(idle()).toMatch(/sin-left-fin\/charge-far\.png$/);
    expect(actor.position.toArray()).toEqual([...LEFT_FIN_SUBJECT.spot.far]);
    expect(actor.scale.x).toBeCloseTo(LEFT_FIN_SUBJECT.farWidth / actor.poseSize[0], 6);

    director.sync(finFlags('far', false));
    await settle();
    expect(idle()).toMatch(/sin-left-fin\/idle-far\.png$/);
  });

  it('a Fin whose paintings are not installed keeps Evrae\'s spots and sizes and asks for no charge painting', async () => {
    setArtManifest(bareManifest());
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const { actor, loads } = fakeActor();
    await director.bindEvrae(actor as never, 'right-fin');
    expect(actor.position.toArray()).toEqual([...RANGE_STAGING.near.evrae]);
    expect(actor.scale.x).toBe(1);
    director.sync(finFlags('near', true));
    await settle();
    expect(loads.flatMap((m) => Object.values(m)).some((u) => /charge/.test(u))).toBe(false);
    expect(actor.extents.proneAspect).toBe(1.15);
  });

  it('keepUpright only ever widens the prone threshold of the actor it is handed', () => {
    const { actor } = fakeActor();
    keepUpright(actor as never);
    expect(actor.extents.proneAspect).toBe(Number.POSITIVE_INFINITY);
    expect(() => keepUpright({} as never)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Genais, the Core and the head, by their flags
// ---------------------------------------------------------------------------

function fakeStage(ids: string[]) {
  const actors = new Map(ids.map((id) => [id, fakeActor()] as const));
  return { actors, stage: { actor: (id: string) => actors.get(id)?.actor as never } };
}
const board = (ids: string[], flags: Record<string, unknown>) =>
  ({ game: 'ffx', flags, combatants: Object.fromEntries(ids.map((id) => [id, { id, side: 'enemy', removed: false }])) }) as never;

describe('Genais A, Core A and head C follow the engine (D-279)', () => {
  it('restPoseMap puts the state in the idle slot and every unpainted slot, and nothing when it is not installed', () => {
    expect(restPoseMap('sin-core', 'charge', ['charge', 'idle'])).toEqual({
      idle: expect.stringMatching(/sin-core\/charge\.png$/),
      attack: expect.stringMatching(/sin-core\/charge\.png$/),
      cast: expect.stringMatching(/sin-core\/charge\.png$/),
      hurt: expect.stringMatching(/sin-core\/charge\.png$/),
    });
    expect(restPoseMap('sin-core', 'charge', [])).toBeNull();
    expect(restPoseMap('sin-core', 'charge', null)).toBeNull();
  });

  it('link 3: Genais rests in its shell and the Core on its glow while the flags say so, and back after', async () => {
    setArtManifest(sinManifest());
    const ids = ['sinspawn-genais', 'sin-core'];
    const { actors, stage } = fakeStage(ids);
    const follow = followSinPoses(stage);
    follow.sync(board(ids, { 'sin.genais.shelled': false, 'sin.core.state': 'inactive' }));
    await settle();
    expect(actors.get('sinspawn-genais')!.idle()).toMatch(/sinspawn-genais\/idle\.png$/);
    expect(actors.get('sinspawn-genais')!.actor.extents.proneAspect).toBe(Number.POSITIVE_INFINITY);
    follow.sync(board(ids, { 'sin.genais.shelled': true, 'sin.core.state': 'charging' }));
    await settle();
    expect(actors.get('sinspawn-genais')!.idle()).toMatch(/sinspawn-genais\/shell\.png$/);
    expect(actors.get('sin-core')!.idle()).toMatch(/sin-core\/charge\.png$/);
    follow.sync(board(ids, { 'sin.genais.shelled': false, 'sin.core.state': 'free' }));
    await settle();
    expect(actors.get('sinspawn-genais')!.idle()).toMatch(/sinspawn-genais\/idle\.png$/);
    expect(actors.get('sin-core')!.idle()).toMatch(/sin-core\/idle\.png$/);
  });

  it('link 4: the head shows stage-<mouth> and stands at its painted framing for the range', async () => {
    setArtManifest(sinManifest());
    const { actors, stage } = fakeStage(['overdrive-sin']);
    const follow = followSinPoses(stage);
    const head = actors.get('overdrive-sin')!;
    follow.sync(board(['overdrive-sin'], { 'sin.mouthStage': 0, 'airship.range': 'far' }));
    await settle();
    expect(head.idle()).toMatch(/overdrive-sin\/stage-0\.png$/);
    expect(head.actor.position.toArray()).toEqual([...OVERDRIVE_SIN_PLACEMENT.far.spot]);
    expect(head.actor.scale.x).toBeCloseTo(OVERDRIVE_SIN_PLACEMENT.far.height / EVRAE_WORLD_HEIGHT, 6);
    follow.sync(board(['overdrive-sin'], { 'sin.mouthStage': 3, 'airship.range': 'near' }));
    await settle();
    expect(head.idle()).toMatch(/overdrive-sin\/stage-3\.png$/);
    expect(head.actor.position.toArray()).toEqual([...OVERDRIVE_SIN_PLACEMENT.near.spot]);
    const before = head.loads.length;
    follow.sync(board(['overdrive-sin'], { 'sin.mouthStage': 3, 'airship.range': 'near' }));
    await settle();
    expect(head.loads).toHaveLength(before); // nothing changed, nothing reloaded
  });

  it('before the install nothing is loaded, moved or resized: the stage\'s silhouettes stay as they were', async () => {
    setArtManifest(bareManifest());
    const ids = ['sinspawn-genais', 'sin-core', 'overdrive-sin'];
    const { actors, stage } = fakeStage(ids);
    const follow = followSinPoses(stage);
    follow.sync(board(ids, { 'sin.genais.shelled': true, 'sin.core.state': 'ready', 'sin.mouthStage': 4, 'airship.range': 'near' }));
    await settle();
    for (const id of ids) {
      const a = actors.get(id)!;
      expect(a.loads, id).toHaveLength(0);
      expect(a.actor.position.toArray()).toEqual([0, 0, 0]);
      expect(a.actor.scale.x).toBe(1);
      expect(a.actor.extents.proneAspect).toBe(1.15);
    }
  });

  it('every other battle is untouched: no Sin id on the board, no call', async () => {
    setArtManifest(sinManifest());
    const { actors, stage } = fakeStage(['evrae']);
    followSinPoses(stage).sync(board(['evrae'], { 'airship.range': 'near', 'sin.mouthStage': 2 }));
    await settle();
    expect(actors.get('evrae')!.loads).toHaveLength(0);
  });
});
