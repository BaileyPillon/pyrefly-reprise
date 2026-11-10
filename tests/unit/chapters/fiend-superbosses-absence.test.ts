// @vitest-environment jsdom
/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53, the word `legion`): without the word the chapter is on no list, and its machinery is absent from every other battle. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **No list**: not the board's tiles or cards, not `CHAPTERS`, `CHAPTER_IDS`, `UNLISTED_CHAPTERS`, not the listed pause metadata; it is in `EXPERIMENT_CHAPTERS` and the unlisted metadata, and a clear goes to the experiments' store.
 * 2. **No other battle gets its scripts, enemies or abilities**: the five script ids and the eight enemy ids are named by this chapter's two groups and by no other group of either game; the `x2-fs-` ability ids are used by
 *    no other chapter's data; for every other FFX-2 group no `fsShinraCount` or `fs*Count` memory key is set after its opening decisions.
 * 3. **The registrations are the ones the handoff lists**: the files under `src/` that name the chapter's id, its door or its modules are exactly the lane's own files plus the listed shared tables (an unlisted new reader or a
 *    forgotten registration fails here, so the integrator's list stays true).
 * 4. **Layering (hard rule 1) and the game case (hard rule 14)**: the battle files import no DOM and no three; no FFX file imports a file of this chapter; every new source file is under 400 lines (hard rule 7).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../../src/data/ffx2/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../../src/data/ffx/index.ts';
import * as ids from '../../../src/data/fiend-superbosses-ids.ts';
import { forcedAct, GIRLS } from '../helpers/fiendSuperbossDrive.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

/** Every `.ts` file under `dir`, recursively (forward slashes). */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') || p.endsWith('.mjs') ? [p.replace(/\\/g, '/')] : [];
  });
}

const SRC = files('src');
const read = (f: string): string => readFileSync(f, 'utf8');

describe('no list', () => {
  it('the board draws no tile for it: the tiles are the listed chapters only, and none is an experiment or says EXP', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(CHAPTERS.length);
    expect(tiles.some((t) => t.id === ids.FIEND_SUPERBOSSES_ID || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
  });

  it('it is in no listed table: not CHAPTERS, not CHAPTER_IDS, not UNLISTED_CHAPTERS, not the listed pause metadata; it is an experiment with unlisted metadata', () => {
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FIEND_SUPERBOSSES_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.FIEND_SUPERBOSSES_ID)).toBe(false);
    expect(UNLISTED_CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FIEND_SUPERBOSSES_ID);
    expect(CHAPTER_META.map((m) => m.id as string)).not.toContain(ids.FIEND_SUPERBOSSES_ID);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id as string)).toContain(ids.FIEND_SUPERBOSSES_ID);
    expect(UNLISTED_CHAPTER_META.map((m) => m.id as string)).toContain(ids.FIEND_SUPERBOSSES_ID);
  });
});

describe('no other battle gets its scripts, enemies or abilities', () => {
  const OWN_ENEMY_IDS = new Set<string>([ids.X2_ALMIGHTY_SHINRA_ID, ...ids.NUMERUS_HEAD_IDS, ids.X2_NUMERUS_BODY_ID, ids.X2_NUMERUS_POD_ID, ids.X2_NUMERUS_TAIL_ID]);
  const OWN_SCRIPTS = new Set<string>([ids.SHINRA_SCRIPT_ID, ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]);
  const own = (id: string): boolean => (ids.FIEND_SUPERBOSSES_GROUP_IDS as readonly string[]).includes(id);

  it('the five script ids and the eight enemy ids are named by this chapter\'s two groups and by no other group of either game', () => {
    const groups = [...Object.values(FFX2_GROUPS), ...Object.values(FFX_GROUPS)] as Array<{ id: string; enemies: Array<{ id: string; aiScriptId: string; forms?: Array<{ aiScriptId?: string }> }>; parts?: Array<{ id: string; aiScriptId: string }> }>;
    let others = 0;
    for (const g of groups) {
      if (own(g.id)) continue;
      others += 1;
      for (const e of [...g.enemies, ...(g.parts ?? [])]) {
        expect(OWN_ENEMY_IDS.has(e.id), `${g.id}: ${e.id}`).toBe(false);
        expect(OWN_SCRIPTS.has(e.aiScriptId), `${g.id}: ${e.id} script`).toBe(false);
      }
    }
    expect(others).toBeGreaterThan(60);
  });

  it('the x2-fs- ability ids are used by no other chapter\'s data file (they are defined here and read by the scripts and the story only)', () => {
    const DATA = SRC.filter((f) => f.startsWith('src/data/') && !f.includes('fiend-superbosses'));
    for (const f of DATA) expect(read(f), f).not.toMatch(/x2-fs-/);
  });

  it('every other FFX-2 chapter plays its opening decisions with none of the chapter\'s script memory set (the registry rows are inert elsewhere)', async () => {
    await registerBattleContent();
    const KEY = /^fs(Shinra|Unum|Duo|Tria|Quattour)Count$/;
    let looked = 0;
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((x) => x.game === 'ffx2' && x.id !== ids.FIEND_SUPERBOSSES_ID)) {
      const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
      engine.setSeed(7);
      engine.init(setupForChapter(c, 7));
      for (let step = 0; step < 40; step++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      looked += 1;
      const memory = Object.values(engine.state().combatants).flatMap((u) => Object.keys((u as unknown as { aiMemory?: Record<string, unknown> }).aiMemory ?? {}));
      expect(memory.filter((k) => KEY.test(k)), `${c.id}: the lane's script memory`).toEqual([]);
    }
    expect(looked).toBeGreaterThan(15);
  }, 120_000);
});

describe('the registrations are the ones the handoff lists', () => {
  /**
   * Every file under `src/` that names the chapter's id, its modules or its door, in the order of the lane: the lane's own files first, then the shared tables a one-line registration touches. A new reader fails this
   * list, so the integrator's merge list (`docs/handoff/ch-fiend-superbosses.md`) stays the truth.
   */
  const NAMES = /ffx2-fiend-superbosses|fiend-superbosses|fiendSuperboss|FIEND_SUPERBOSS|FS_ABILITY|legionDoor|LEGION_DOOR|shinraAlmightyScripts|numerusScripts/;
  const OWN = [
    'src/app/screens/frontend/legionDoor.ts',
    'src/battle/ffx2/ai/numerus.ts',
    'src/battle/ffx2/ai/shinra-almighty.ts',
    'src/data/chapter-ffx2-fiend-superbosses.ts',
    'src/data/chapter-meta-ffx2-fiend-superbosses.ts',
    'src/data/ffx2/builds/fiend-superbosses.ts',
    'src/data/ffx2/command-records/fiend-superbosses.ts',
    'src/data/ffx2/enemies/fiend-superbosses-abilities.ts',
    'src/data/ffx2/enemies/fiend-superbosses.ts',
    'src/data/ffx2/monster-records/records-fiend-superbosses.ts',
    'src/data/fiend-superbosses-ids.ts',
    'src/data/guides/docs/ffx2-fiend-superbosses.ts',
    'src/data/guides/ffx2-fiend-superbosses.ts',
    'src/engine/tactics/ffx2-fiend-superbosses.ts',
    'src/story/scripts/ffx2-fiend-superbosses.ts',
  ];
  const SHARED = [
    'src/app/screens/frontend/chapterDoors.ts', // the door row (one import, one row, two doc lines)
    'src/battle/ffx2/ai/index.ts', // the two script registrations
    'src/data/chapter-meta-hidden-r76.ts', // the pause metadata
    'src/data/chapters-experiments.ts', // the experiment table
    'src/data/encounters.ts', // the ChapterId union, ListedChapterId's Exclude, Chapter.number
    'src/data/ffx2/command-records/index.ts',
    'src/data/ffx2/enemies/index.ts',
    'src/data/ffx2/monster-records/kill-rewards.ts',
    'src/data/ffx2/monster-records/records.ts',
    'src/data/guides/docs/index.ts',
    'src/data/guides/index.ts',
    'src/engine/tactics/index.ts',
    'src/engine/tactics/lookup.ts',
  ];

  it('the files that name the chapter are the lane\'s own and the listed shared tables, no more', () => {
    const naming = SRC.filter((f) => NAMES.test(read(f))).sort();
    expect(naming).toEqual([...OWN, ...SHARED].sort());
  });

  it('every one of the lane\'s own source modules is imported by some other file (hard rule 4)', () => {
    for (const f of OWN) {
      const stem = f.split('/').at(-1)!.replace(/\.ts$/, '');
      const importers = SRC.filter((g) => g !== f && new RegExp(`from '[^']*/${stem}\\.ts'`).test(read(g)));
      expect(importers.length, f).toBeGreaterThan(0);
    }
  });
});

describe('layering (hard rule 1), the game case (hard rule 14) and the size (hard rule 7)', () => {
  const BATTLE = ['src/battle/ffx2/ai/numerus.ts', 'src/battle/ffx2/ai/shinra-almighty.ts'];

  it('the battle files import no DOM and no three, and read only the dependency-free ids file of src/data', () => {
    for (const f of BATTLE) {
      const text = read(f);
      expect(text, f).not.toMatch(/from 'three'/);
      expect(text, f).not.toMatch(/\bdocument\b|\bwindow\b/);
      for (const m of text.matchAll(/from '((?:\.\.\/)+data\/[^']+)'/g)) expect(m[1], f).toMatch(/fiend-superbosses-ids\.ts$/);
    }
  });

  it('no FFX file (src/battle/ffx, src/data/ffx) imports any file of this chapter', () => {
    const re = /from '[^']*(?:fiend-superbosses|legionDoor|ffx2-fiend-superbosses)[^']*'/;
    for (const f of [...files('src/battle/ffx'), ...files('src/data/ffx')]) expect(read(f), f).not.toMatch(re);
  });

  it('every new source file is under 400 lines', () => {
    for (const f of [...BATTLE, 'src/data/chapter-ffx2-fiend-superbosses.ts', 'src/data/chapter-meta-ffx2-fiend-superbosses.ts', 'src/data/ffx2/builds/fiend-superbosses.ts', 'src/data/guides/ffx2-fiend-superbosses.ts', 'src/data/guides/docs/ffx2-fiend-superbosses.ts', 'src/engine/tactics/ffx2-fiend-superbosses.ts', 'src/story/scripts/ffx2-fiend-superbosses.ts', 'src/app/screens/frontend/legionDoor.ts', 'src/data/fiend-superbosses-ids.ts']) {
      expect(read(f).split('\n').length, f).toBeLessThan(400);
    }
  });

  it('the forced rig used by the lane\'s helper names the girls (a smoke that the helper still opens both acts)', () => {
    expect(GIRLS).toEqual(['yuna', 'rikku', 'paine']);
    expect(forcedAct(1).group.id).toBe(ids.ACT_1_GROUP_ID);
    expect(forcedAct(2).group.id).toBe(ids.ACT_2_GROUP_ID);
  });
});
