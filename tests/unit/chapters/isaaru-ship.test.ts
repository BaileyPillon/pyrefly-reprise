/**
 * Chapter XIV (Isaaru) ship layer: the registered record, the scene, the story, the pause card,
 * the guide and the tactic. The story's triggers and the tactic are proved by **running the
 * engine** through the whole chain (AGENTS.md rule 3), not by reading the data.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, Command } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { UNLISTED_CHAPTERS } from '../../../src/data/chapters-unlisted.ts';
import { ISAARU_SCENE_KEY, ISAARU_VIA_PURIFICO_SHIPPED } from '../../../src/data/chapter-isaaru-ship.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { ISAARU_META } from '../../../src/data/chapter-meta-isaaru.ts';
import { ISAARU_GROUPS } from '../../../src/data/ffx/enemies/isaaru.ts';
import { ISAARU_GUIDE } from '../../../src/data/guides/ffx-isaaru.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { SCENE_FACTORIES, isPlaceholderScene } from '../../../src/scenes/index.ts';
import { VIA_AEON_SPOT, VIA_ISAARU_SPOT, VIA_PURIFICO_SLOTS, viaRenderAspect, viaRigsFor } from '../../../src/scenes/via-purifico.ts';
import { PHONE_BATTLE_QUERY } from '../../../src/ui/common/phoneBattle.ts';
import { lintScript, type StoryScript } from '../../../src/story/dsl.ts';
import { ISAARU_SEAMS, ISAARU_STORY_IDS, isaaruScripts } from '../../../src/story/scripts/ffx-isaaru.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { isaaruViaPurifico } from '../../../src/engine/tactics/ffx-isaaru.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { LINKS, content, defend, setupFor } from '../helpers/isaaruUnits.ts';

const art = (p: string): boolean => existsSync(new URL(`../../../public/art/${p}`, import.meta.url));

describe('the registered record', () => {
  it('is reachable by id and listed (2026-09-25), with the ship layer on', () => {
    expect(getChapter('isaaru-via-purifico')).toBe(ISAARU_VIA_PURIFICO_SHIPPED);
    expect(UNLISTED_CHAPTERS).not.toContain(ISAARU_VIA_PURIFICO_SHIPPED);
    expect(CHAPTERS.at(-1)).toBe(ISAARU_VIA_PURIFICO_SHIPPED);
    expect(ISAARU_VIA_PURIFICO_SHIPPED.sceneKey).toBe('via-purifico');
    expect(ISAARU_VIA_PURIFICO_SHIPPED.scriptsRef).toBe(isaaruScripts);
  });

  it('the pause card is listed too, with hero plate B and art that exists', () => {
    expect(UNLISTED_CHAPTER_META).not.toContain(ISAARU_META);
    expect(CHAPTER_META.at(-1)).toBe(ISAARU_META);
    expect(getChapterMeta('isaaru-via-purifico')).toBe(ISAARU_META);
    expect(ISAARU_META).toMatchObject({ numeral: 'XIV', gameLabel: 'FFX', heroArt: 'pause/ch14-isaaru-via-purifico' });
    expect(art('pause/ch14-isaaru-via-purifico.png')).toBe(true);
    expect(art(ISAARU_META.heroArtFallback)).toBe(true);
    for (const s of ISAARU_META.snapshots) expect(art(s.image), s.image).toBe(true);
  });
});

describe('the scene and the art (INSTALLED.md "Owed")', () => {
  it('registers the Via Purifico with a factory, on the installed plate', () => {
    expect(isPlaceholderScene(ISAARU_SCENE_KEY)).toBe(false);
    expect(SCENE_FACTORIES[ISAARU_SCENE_KEY]).toBeTypeOf('function');
    expect(art('backdrops/via-purifico.png')).toBe(true);
  });

  it('every enemy points at its own installed painting, never a roster aeon (I-G6)', () => {
    for (const g of ISAARU_GROUPS) {
      for (const e of g.enemies) {
        expect(art(`characters/${e.spriteKey}/idle.png`), e.spriteKey).toBe(true);
        expect(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']).not.toContain(e.spriteKey);
      }
    }
  });

  it('stages Isaaru right of his aeon and nearer the camera, clear of Pterya\'s wing', () => {
    expect(VIA_ISAARU_SPOT[0] - VIA_AEON_SPOT[0]).toBeGreaterThanOrEqual(1.5);
    expect(VIA_ISAARU_SPOT[2] - VIA_AEON_SPOT[2]).toBeGreaterThanOrEqual(3);
    expect(VIA_ISAARU_SPOT[2]).toBeGreaterThan(VIA_AEON_SPOT[2]);
    expect(VIA_PURIFICO_SLOTS.enemySpots?.['isaaru']).toEqual(VIA_ISAARU_SPOT);
  });

  it('an upright phone under the phone battle HUD takes the wide rigs: the render is 16:9 (FOC16-05\'s rule)', () => {
    const win = (w: number, h: number, phoneHud: boolean) => ({
      innerWidth: w,
      innerHeight: h,
      matchMedia: (q: string) => ({ matches: phoneHud && q === PHONE_BATTLE_QUERY }) as MediaQueryList,
    });
    expect(viaRenderAspect(win(390, 844, true))).toBeCloseTo(16 / 9, 6);
    expect(viaRenderAspect(win(1600, 900, false))).toBeCloseTo(16 / 9, 6);
    expect(viaRenderAspect(win(1280, 960, false))).toBeCloseTo(4 / 3, 6);
    expect(viaRigsFor(viaRenderAspect(win(390, 844, true))).idle.fov).toBe(32);
  });

  it('his aeons leave by the engine\'s dissolve (B19); Isaaru never falls (B8)', () => {
    for (const id of ['grothia', 'pterya', 'spathi']) expect(departureKindOf(id)).toBe('dissolve');
  });
});

describe('the story', () => {
  const all: StoryScript[] = [isaaruScripts.pre, isaaruScripts.post, ...Object.values(isaaruScripts.midScripts)];

  it('lints clean, and its ids are the data\'s', () => {
    for (const s of all) expect(lintScript(s)).toEqual([]);
    const ids = new Set(ISAARU_GROUPS.flatMap((g) => g.enemies.map((e) => e.id)));
    for (const id of Object.values(ISAARU_STORY_IDS)) expect(ids.has(id), id).toBe(true);
    for (const t of isaaruScripts.mid) expect(isaaruScripts.midScripts[t.script], t.script).toBeDefined();
  });

  it('the seams and the Hellfire warning fire on the real engine, played by the shipped tactic', () => {
    let setup: BattleSetup = { ...setupFor('isaaru-grothia', 3), triggers: [...isaaruScripts.mid] };
    const fired: string[] = [];
    for (let n = 0; n < LINKS.length; n++) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init(setup);
      for (let i = 0; i < 6000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(isaaruViaPurifico(d.actorId, [...d.commands], engine) ?? (defend() as Command));
      }
      const log = engine.state().log as readonly BattleEvent[];
      for (const e of log) if (e.type === 'script-trigger') fired.push((e as { name: string }).name);
      const r = engine.state().result;
      if (r?.outcome !== 'victory' || !r.nextGroupId) break;
      setup = setupForNextLink(setup, ENEMY_GROUPS_BY_ID[r.nextGroupId]!, engine.state(), 3 + n + 1);
    }
    expect(fired).toContain('grothia-ready');
    expect(fired).toContain(ISAARU_SEAMS.pterya);
    expect(fired).toContain(ISAARU_SEAMS.spathi);
  });
});

describe('the guide and the tactic', () => {
  it('both find the chapter on its board, link by link; the guide\'s short rules fit the panel', () => {
    for (const link of LINKS) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init(setupFor(link, 1));
      expect(tacticFor(engine), link).toBe(isaaruViaPurifico);
      expect(guideForState(engine.state())?.id, link).toBe('isaaru-via-purifico');
    }
    for (const r of ISAARU_GUIDE.rules) expect(r.short.length).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });
});
