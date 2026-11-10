/**
 * The hidden Gauntlet chapter as a chapter (FFX only; chapter 54, the word `gauntlet`; stage 5 of the lane): its record, its card, its absence from every list without the word, its stage and the stand-ins that make every
 * act render and play, the withdrawal card's line, and the first menu's turn order. The engine and the rules are the other stages' files (`gauntlet-*.test.ts`); the door is `gauntlet-door.test.ts` and
 * `gauntlet-board.test.ts`; the story, `gauntlet-story.test.ts`; the guide, `gauntlet-guide.test.ts`.
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { withdrawLineFrom, STALEMATE_LINE } from '../../../src/app/screens/withdrawal.ts';
import { GOT_AWAY_LINE } from '../../../src/battle/ffx/ai/gauntlet-end.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { GAUNTLET, GAUNTLET_TEXT } from '../../../src/data/chapter-gauntlet.ts';
import { GAUNTLET_META } from '../../../src/data/chapter-meta-gauntlet.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { GAUNTLET_GROUPS } from '../../../src/data/ffx/enemies/gauntlet-groups.ts';
import { GAUNTLET_ACTS, GAUNTLET_CREATURES, GAUNTLET_PLATE, GAUNTLET_SCENE, GAUNTLET_SPRITE, GAUNTLET_CATASTROPHE_FORM2_SPRITE, type GauntletCombatantId } from '../../../src/data/ffx/gauntlet-ids.ts';
import { SCENE_BACKDROP_FILE } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { GAUNTLET_HEIGHTS, GAUNTLET_SLOTS, GAUNTLET_SPOTS, GAUNTLET_STAGED_BODIES, buildGauntletScene } from '../../../src/scenes/gauntlet.ts';
import { TURN_ORDER_PARTY_FIRST, turnOrderBodyFor } from '../../../src/ui/coach/turnOrderLine.ts';
import { tipFit } from '../helpers/prepTipBand.ts';
import { log, newEngine, nextInput } from '../helpers/gauntletDrive.ts';

const ALL_NINE = [...GAUNTLET_CREATURES];

describe('the record', () => {
  it('is the hidden FFX chapter 54, an experiment (no save, no board), found by getChapter and registered with the other hidden chapters', () => {
    expect(getChapter('gauntlet')).toBe(GAUNTLET);
    expect(GAUNTLET).toMatchObject({ id: 'gauntlet', game: 'ffx', number: 54, experimental: true, sceneKey: GAUNTLET_SCENE, thumbnailKey: 'chapter-gauntlet' });
    expect(EXPERIMENT_CHAPTERS).toContain(GAUNTLET);
    expect(EXPERIMENT_CHAPTERS.at(-1)).toBe(GAUNTLET);
  });

  it('numbers no other chapter 54, and names the party, the first act and the scripts of the chapter', () => {
    const all = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];
    expect(all.filter((c) => c.number === 54).map((c) => c.id)).toEqual(['gauntlet']);
    expect(GAUNTLET.buildRef).toBe(gauntletBuild);
    expect(GAUNTLET.enemyGroupRef).toBe(GAUNTLET_GROUPS[0]);
    expect(GAUNTLET.sensorTexts).toEqual({}); // every body is immune to Scan and Sensor
  });

  it('walks the nine acts in order from the first group, each naming the next, the last paying the whole chain', () => {
    const walked: string[] = [];
    let group = GAUNTLET.enemyGroupRef as { id: string; nextGroupId?: string; poolsChainSpoils?: boolean };
    for (let i = 0; i < 12 && group; i++) {
      walked.push(group.id);
      group = ENEMY_GROUPS_BY_ID[group.nextGroupId ?? ''] as typeof group;
    }
    expect(walked).toEqual(GAUNTLET_ACTS.map((a) => a.groupId));
    expect(walked).toHaveLength(9);
    expect(ENEMY_GROUPS_BY_ID[walked[8]!]).toMatchObject({ poolsChainSpoils: true });
    expect(ENEMY_GROUPS_BY_ID[walked[0]!]).toHaveProperty('nextGroupId');
  });

  it("GA13: Escape and Flee are off in every act (the formations set neither: the field's flag, unsourced), a Normal start, and the file says unsourced", () => {
    for (const a of GAUNTLET_ACTS) {
      const g = ENEMY_GROUPS_BY_ID[a.groupId]!;
      expect(g.canEscape, a.groupId).toBe(false);
      expect((g as { start?: unknown; startType?: unknown }).startType, `${a.groupId} starts normally`).toBeUndefined();
    }
  });
});

describe('absent without the word', () => {
  it('is on no list of the listed chapters: not in CHAPTERS, CHAPTER_IDS, the unlisted chapters, the listed metadata', () => {
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('gauntlet');
    expect((CHAPTER_IDS as readonly string[]).includes('gauntlet')).toBe(false);
    expect(UNLISTED_CHAPTERS.map((c) => c.id as string)).not.toContain('gauntlet');
    expect(CHAPTER_META.map((m) => m.id as string)).not.toContain('gauntlet');
  });

  it('its metadata is found by id among the unlisted chapters only', () => {
    expect(UNLISTED_CHAPTER_META).toContain(GAUNTLET_META);
    expect(getChapterMeta('gauntlet')).toBe(GAUNTLET_META);
  });

  it('every chapter that carries the numeral EXP is hidden: this one says EXP and FFX', () => {
    expect(GAUNTLET_META).toMatchObject({ numeral: 'EXP', gameLabel: 'FFX', id: 'gauntlet' });
  });
});

describe('the card lines (GA7 and GA8)', () => {
  it("says the arena's own unlock rule in one line, and that every act is open here", () => {
    const [first] = GAUNTLET_TEXT.blurb.split(/(?<=\.)\s/);
    expect(first).toMatch(/opens its creations one by one to whoever has caught enough fiends/);
    expect(first).toMatch(/every door is already open/);
  });

  it("names the game's stacked prize as not in this build, in one line", () => {
    const [, second] = GAUNTLET_TEXT.blurb.split(/(?<=\.)\s/);
    expect(second).toMatch(/stacked prize/);
    expect(second).toMatch(/is not in this build/);
  });

  it('the blurb is two sentences, the subtitle two to four words, and no number is printed on the card', () => {
    expect((GAUNTLET_TEXT.blurb.match(/[.!?](?:\s|$)/g) ?? []).length).toBe(2);
    const words = GAUNTLET_TEXT.subtitle.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(2);
    expect(words).toBeLessThanOrEqual(4);
    for (const s of [GAUNTLET_TEXT.title, GAUNTLET_TEXT.subtitle, GAUNTLET_TEXT.blurb]) expect(s).not.toMatch(/\d/);
    expect(GAUNTLET_META.blurb).toBe(GAUNTLET_TEXT.blurb);
  });

  it('the pause tab: a quote under 18 words that is Auron\'s pre-scene line, a handwritten aside of 4 to 6 words, three objectives that match the act table, a tip that fits the prep card', () => {
    expect(GAUNTLET_META.quote.text.split(/\s+/).length).toBeLessThan(18);
    expect(GAUNTLET_META.quote).toEqual({ text: 'Smallest first. The worst last.', speaker: 'Auron' });
    const aside = GAUNTLET_META.handwritten.split(/\s+/).length;
    expect(aside).toBeGreaterThanOrEqual(4);
    expect(aside).toBeLessThanOrEqual(6);
    expect(GAUNTLET_META.objectives).toHaveLength(3);
    expect(new Set(GAUNTLET_META.objectives.map((o) => o.id)).size).toBe(3);
    const links = GAUNTLET_META.objectives.flatMap((o) => (o.rule.kind === 'link-reached' ? [o.rule.link] : []));
    expect(links).toEqual([4, 7]);
    expect(GAUNTLET_ACTS[3]!.creature).toBe('earth-eater'); // the second tier's first act
    expect(GAUNTLET_ACTS[6]!.creature).toBe('thuban'); // the third tier's first act
    expect(GAUNTLET_META.objectives[2]!.rule.kind).toBe('victory');
    const fit = tipFit(GAUNTLET_META, 1600, 900);
    expect(fit.fits, JSON.stringify(fit)).toBe(true);
    expect(fit.lines).toBeLessThanOrEqual(5);
    expect(GAUNTLET_META.tip.length).toBeLessThanOrEqual(170);
  });

  it('the pause tab shows the plate that stands in and two members of the party, no stand-in creature', () => {
    expect(GAUNTLET_META.heroArtFallback).toBe(`backdrops/${GAUNTLET_PLATE}.png`);
    const images = GAUNTLET_META.snapshots.map((s) => s.image);
    expect(images).toEqual(['backdrops/zanarkand-dome.png', 'characters/lulu/idle.png', 'characters/auron/idle.png']);
    for (const stand of Object.values(GAUNTLET_SPRITE)) for (const img of images) expect(img).not.toContain(`/${stand}/`);
    expect(GAUNTLET_META.heroArt).toBe('pause/ch54-gauntlet'); // owed to the art lane (GA10 and GA11 wait for Bailey's picks)
  });
});

describe('the stage (a stand-in: the Zanarkand Dome, preflight GA11 option (c))', () => {
  it('is registered as a scene row and a factory, and the plate is the Dome\'s', () => {
    expect(getScene(GAUNTLET_SCENE)).toMatchObject({ key: GAUNTLET_SCENE, slots: GAUNTLET_SLOTS, placeholder: false });
    expect(getSceneFactory(GAUNTLET_SCENE)).toBe(buildGauntletScene);
    expect(SCENE_BACKDROP_FILE[GAUNTLET_SCENE]).toBe(GAUNTLET_PLATE);
    expect(GAUNTLET_PLATE).toBe('zanarkand-dome');
    for (const a of GAUNTLET_ACTS) expect(ENEMY_GROUPS_BY_ID[a.groupId]!.plate, a.groupId).toBe(GAUNTLET_PLATE);
    expect(PYREFLY_CANON[GAUNTLET_SCENE]).toMatchObject({ game: 'ffx' });
  });

  it('stages every combatant of the chapter, the nine bodies and the Ultima Buster\'s three parts, at a spot and a height', () => {
    const ids: GauntletCombatantId[] = [...ALL_NINE, 'ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right'];
    expect([...GAUNTLET_STAGED_BODIES]).toEqual(ALL_NINE);
    for (const id of ids) {
      expect(GAUNTLET_SPOTS[id], id).toHaveLength(3);
      expect(GAUNTLET_HEIGHTS[id], id).toBeGreaterThan(0.5);
      expect(GAUNTLET_HEIGHTS[id], id).toBeLessThanOrEqual(3.6); // what the Dome's rigs frame (it stages its own boss at 2.9)
    }
    expect(Object.keys(GAUNTLET_SPOTS).sort()).toEqual([...ids].sort());
    // The four of the Ultima Buster's formation stand apart, so no part is drawn on its body.
    const four = ['ultima-buster', 'ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right'].map((id) => GAUNTLET_SPOTS[id as GauntletCombatantId].join(','));
    expect(new Set(four).size).toBe(4);
    expect(GAUNTLET_SLOTS.enemy).toHaveLength(4);
  });

  it('every creature draws an existing painting (the art lane owes the real ones), and the Catastrophe\'s second form the first\'s', () => {
    const art = new URL('../../../public/art/characters/', import.meta.url);
    if (!existsSync(art)) return; // a tree without the art mirror: the data test pins the keys
    for (const [id, key] of Object.entries(GAUNTLET_SPRITE)) expect(existsSync(new URL(`${key}/idle.png`, art)), `${id} draws ${key}`).toBe(true);
    expect(GAUNTLET_CATASTROPHE_FORM2_SPRITE).toBe(GAUNTLET_SPRITE.catastrophe);
  });

  it('the chapter\'s music is cues that exist: the Dome\'s bed, the generic boss cue, Yojimbo\'s for the last act, the FFX fanfare', () => {
    expect(GAUNTLET.music).toEqual({ scene: 'scene-zanarkand-dome', battle: 'boss-challenge', phase2: 'boss-yojimbo', victory: 'victory-ffx' });
    const cues = GAUNTLET_GROUPS.map((g) => g.musicCues?.[0]?.track);
    expect(cues).toEqual([...Array<string>(8).fill('boss-challenge'), 'boss-yojimbo']);
    expect(GAUNTLET_META.musicKeys).toEqual(['scene-zanarkand-dome', 'boss-challenge', 'boss-yojimbo', 'victory-ffx']);
  });
});

describe('the withdrawal card prints the engine\'s own line when the Cactuar King leaves', () => {
  const msg = (text: string): BattleEvent => ({ type: 'message', text, kind: 'system' }) as unknown as BattleEvent;

  it('reads "The Cactuar King got away!" from the end of the log, and still the stalemate line', () => {
    expect(GOT_AWAY_LINE).toBe('The Cactuar King got away!');
    expect(withdrawLineFrom([msg('The Cactuar King got away!'), { type: 'battle-end', outcome: 'escape' } as unknown as BattleEvent])).toBe(GOT_AWAY_LINE);
    expect(withdrawLineFrom([msg(STALEMATE_LINE)])).toBe(STALEMATE_LINE);
  });

  it('prints nothing for any other system line or a non-system one (only the engine\'s own words are ever shown)', () => {
    expect(withdrawLineFrom([msg('Tidus was ejected!')])).toBeNull();
    expect(withdrawLineFrom([{ type: 'message', text: GOT_AWAY_LINE, kind: 'flavour' } as unknown as BattleEvent])).toBeNull();
    expect(withdrawLineFrom(undefined)).toBeNull();
  });
});

describe('the first menu (the coach line)', () => {
  it('Auron\'s "He moves after you" line is true at act 1: the party opens in 100 of 100 seeds', () => {
    expect(turnOrderBodyFor('gauntlet')).toBe(TURN_ORDER_PARTY_FIRST);
    let enemyFirst = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const engine = newEngine(seed, 'cactuar-king');
      nextInput(engine);
      const state = engine.state();
      if (log(engine).some((e) => e.type === 'action-start' && state.combatants[e.actorId]?.side === 'enemy')) enemyFirst++;
    }
    expect(enemyFirst).toBe(0);
  });
});
