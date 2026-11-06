/**
 * The hidden Omega Ruins chapter as the app sees it (FFX only; number 43, the typed word `weapon`): the registration (experiment-class, hidden, not in `CHAPTERS` or `CHAPTER_IDS`, found by `getChapter`, listed in
 * `EXPERIMENT_CHAPTERS`), its pause metadata, its scene, its music (existing cues by reference), its three-act chain, its unique number, the card's words (no number in them) and the absence of every listed chapter's counts.
 */
import { describe, expect, it } from 'vitest';

import { hasTrack } from '../../../src/audio/tracks/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { OMEGA_RUINS, OMEGA_RUINS_TEXT } from '../../../src/data/chapter-omega-ruins.ts';
import { UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { OMEGA_RUINS_META } from '../../../src/data/chapter-meta-omega-ruins.ts';
import { omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { nemesisGroup, omegaWeaponGroup, ultimaWeaponGroup } from '../../../src/data/ffx/enemies/weapons-groups.ts';
import { NEMESIS_ID, OMEGA_RUINS_CHAPTER_ID, OMEGA_RUINS_SCENE, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { omegaRuinsScripts } from '../../../src/story/scripts/omega-ruins.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { pyreflyCanonFor } from '../../../src/engine/pyreflyCanon.ts';

describe('the chapter is registered, hidden and experiment-class', () => {
  it('is found by id, FFX, numbered 43, an experiment, in EXPERIMENT_CHAPTERS and in neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(getChapter(OMEGA_RUINS_CHAPTER_ID)).toBe(OMEGA_RUINS);
    expect(OMEGA_RUINS).toMatchObject({ id: 'omega-ruins', game: 'ffx', number: 43, experimental: true, sceneKey: OMEGA_RUINS_SCENE });
    expect(EXPERIMENT_CHAPTERS).toContain(OMEGA_RUINS);
    expect(CHAPTERS).not.toContain(OMEGA_RUINS);
    expect((CHAPTER_IDS as readonly string[]).includes(OMEGA_RUINS_CHAPTER_ID)).toBe(false);
    expect(UNLISTED_CHAPTERS).not.toContain(OMEGA_RUINS);
  });

  it('its number is unique among every chapter\'s (hidden chapters included)', () => {
    const all = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.number !== 0);
    expect(all.filter((c) => c.number === 43).map((c) => c.id)).toEqual(['omega-ruins']);
  });

  it('is Ultima Weapon\'s formation chained on to Omega Weapon\'s and Nemesis\'s, our scripts, the Mirror Aeons party with the three levers, and the Dome\'s bed with the two stand-in boss cues', () => {
    expect(OMEGA_RUINS.enemyGroupRef).toBe(ultimaWeaponGroup);
    expect(ultimaWeaponGroup.nextGroupId).toBe(omegaWeaponGroup.id);
    expect(omegaWeaponGroup.nextGroupId).toBe(nemesisGroup.id);
    expect(OMEGA_RUINS.scriptsRef).toBe(omegaRuinsScripts);
    expect(OMEGA_RUINS.buildRef).toBe(omegaRuinsBuild);
    expect(OMEGA_RUINS.music).toEqual({ scene: 'scene-zanarkand-dome', battle: 'boss-challenge', phase2: 'boss-yu-yevon', victory: 'victory-ffx' });
    for (const key of Object.values(OMEGA_RUINS.music)) expect(hasTrack(key as string), `${key} is one of our tracks`).toBe(true);
  });

  it('carries the sensor texts of the three bodies, duplicated from the records', () => {
    expect(Object.keys(OMEGA_RUINS.sensorTexts).sort()).toEqual([NEMESIS_ID, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID].sort());
    for (const g of [ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup]) expect(OMEGA_RUINS.sensorTexts[g.enemies[0]!.id], g.id).toBe(g.enemies[0]!.sensorText);
  });

  it('the card\'s words carry no number', () => {
    expect(Object.values(OMEGA_RUINS_TEXT).join(' ')).not.toMatch(/\d/);
  });
});

describe('the pause metadata', () => {
  it('is found by id among the unlisted records, EXP, FFX, three objectives of rules the evaluator answers, a tip no longer than the prep band, and the music the chapter plays', () => {
    expect(getChapterMeta(OMEGA_RUINS_CHAPTER_ID)).toBe(OMEGA_RUINS_META);
    expect(UNLISTED_CHAPTER_META).toContain(OMEGA_RUINS_META);
    expect(OMEGA_RUINS_META).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', heroArt: 'pause/ch43-omega-ruins', title: 'The Omega Ruins' });
    expect(OMEGA_RUINS_META.objectives.map((o) => o.rule.kind)).toEqual(['link-reached', 'link-reached', 'victory']);
    expect(OMEGA_RUINS_META.tip.length).toBeLessThanOrEqual(120);
    expect(OMEGA_RUINS_META.tip).not.toMatch(/\d/);
    for (const key of OMEGA_RUINS_META.musicKeys) expect(hasTrack(key), key).toBe(true);
    for (const s of OMEGA_RUINS_META.snapshots) expect(s.image).toMatch(/^(backdrops|characters)\//);
  });
});

describe('the stage and the departure', () => {
  it('has a registered scene with a factory, and a canon row', () => {
    expect(getScene(OMEGA_RUINS_SCENE)?.placeholder).toBe(false);
    expect(getSceneFactory(OMEGA_RUINS_SCENE)).toBeTypeOf('function');
    expect(pyreflyCanonFor(OMEGA_RUINS_SCENE)).toMatchObject({ game: 'ffx' });
  });

  it('the bodies take the default departure (dissolve): the files give Ultima Weapon and Omega Weapon the death animation "Boss" (the body stays) and Nemesis "Fiend" (it dissipates), and the faithful "body" departure for the two Weapons needs the shared departure and entrance tables (the handoff names it as owed)', () => {
    for (const id of [ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID]) expect(departureKindOf(id), id).toBe('dissolve');
  });
});
