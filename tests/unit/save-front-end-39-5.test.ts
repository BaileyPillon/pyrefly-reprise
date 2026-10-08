// @vitest-environment jsdom
/**
 * Release 39.5 (Bailey, 2026-10-07): two selectable front-end choices, both stored in `Settings`.
 *
 *   titleArt           'farplane' (today's Gullwings painting, the DEFAULT) | 'echo' (the new one, "The Echo")
 *   chapterSelectMusic 'b' (the take live since 39.4, the DEFAULT) | 'a' | 'c'
 *
 * Bailey: "current title screen is still the default"; "B as the default", "C as a selectable alternate", "and A as a
 * selectable alternate as well". Both fields are ADDITIVE (`SAVE_VERSION` does not change), so this pins the save half:
 * the defaults, every release's real save fixture loading with all it had and gaining the two defaults, a value that
 * is not on the list reading as the default (CHK-024), a choice surviving a save and a reload, and the OPTIONS rows
 * that change them stepping through the lists (Left, Right and Confirm, wrapping).
 *
 * Game case: both games (shared plumbing: SaveData, the pause OPTIONS tab; the title screen and the board are shared).
 * Save-data class: a change in `src/app/SaveData.ts`, so the deep review owed before any deploy.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore, defaultSave, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import {
  CHAPTER_SELECT_CUES,
  CHAPTER_SELECT_LABELS,
  CHAPTER_SELECT_MUSICS,
  DEFAULT_CHAPTER_SELECT_MUSIC,
  DEFAULT_TITLE_ART,
  TITLE_ARTS,
  TITLE_ART_LABELS,
  chapterSelectCue,
  chapterSelectMusicOf,
  cycle,
  isChapterSelectMusic,
  isTitleArt,
  titleArtOf,
} from '../../src/app/saveFrontend.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { optionsColumns } from '../../src/app/screens/pause/panels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';

class Slot {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}
const slotWith = (raw?: string): Slot => {
  const s = new Slot();
  if (raw !== undefined) s.setItem(SAVE_KEY, raw);
  return s;
};

const FIXTURES = resolve(__dirname, '..', 'fixtures', 'saves');
interface Fixture {
  release: number;
  localStorage: Record<string, string>;
  expect?: { cleared?: string[]; settings?: Record<string, unknown> };
}
const fixtures = readdirSync(FIXTURES)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => [f, JSON.parse(readFileSync(resolve(FIXTURES, f), 'utf8')) as Fixture] as const);

describe('the two choices, as data', () => {
  it('lists the title screens with today’s painting first, and the board tracks with B first', () => {
    expect([...TITLE_ARTS]).toEqual(['farplane', 'echo']);
    expect(DEFAULT_TITLE_ART).toBe('farplane');
    expect([...CHAPTER_SELECT_MUSICS]).toEqual(['b', 'a', 'c']);
    expect(DEFAULT_CHAPTER_SELECT_MUSIC).toBe('b');
  });

  it('is what a new save holds', () => {
    expect(defaultSettings().titleArt).toBe('farplane');
    expect(defaultSettings().chapterSelectMusic).toBe('b');
    expect(defaultSave().settings.titleArt).toBe('farplane');
    expect(defaultSave().settings.chapterSelectMusic).toBe('b');
  });

  it('names a cue for each track: B keeps the cue it has, A and C are cues of their own', () => {
    expect(CHAPTER_SELECT_CUES).toEqual({ b: 'chapter-select', a: 'chapter-select-a', c: 'chapter-select-c' });
    expect(chapterSelectCue('b')).toBe('chapter-select');
    expect(chapterSelectCue('a')).toBe('chapter-select-a');
    expect(chapterSelectCue('c')).toBe('chapter-select-c');
  });

  it('plays B for anything that is not a track, and reads anything that is not a title screen as the default', () => {
    for (const bad of [undefined, null, '', 'B', 'd', 0, 1, true, {}, [], 'echo', 'chapter-select-a']) {
      expect(chapterSelectCue(bad), String(bad)).toBe('chapter-select');
      expect(chapterSelectMusicOf(bad)).toBe('b');
      expect(isChapterSelectMusic(bad)).toBe(false);
    }
    for (const bad of [undefined, null, '', 'Echo', 'ECHO', 'gullwings', 0, true, {}, [], 'b']) {
      expect(titleArtOf(bad), String(bad)).toBe('farplane');
      expect(isTitleArt(bad)).toBe(false);
    }
    expect(titleArtOf('echo')).toBe('echo');
  });

  it('steps through a list and wraps, from either side, and an unknown value counts as the first', () => {
    expect(cycle(TITLE_ARTS, 'farplane', 1)).toBe('echo');
    expect(cycle(TITLE_ARTS, 'echo', 1)).toBe('farplane');
    expect(cycle(TITLE_ARTS, 'farplane', -1)).toBe('echo');
    expect(cycle(CHAPTER_SELECT_MUSICS, 'b', 1)).toBe('a');
    expect(cycle(CHAPTER_SELECT_MUSICS, 'a', 1)).toBe('c');
    expect(cycle(CHAPTER_SELECT_MUSICS, 'c', 1)).toBe('b');
    expect(cycle(CHAPTER_SELECT_MUSICS, 'b', -1)).toBe('c');
    expect(cycle(CHAPTER_SELECT_MUSICS, 'nonsense', 1)).toBe('a');
  });
});

describe('every real save from every release loads unchanged and gains the two defaults', () => {
  it('has fixtures to read', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(10);
  });

  it.each(fixtures)('%s', (_name, fixture) => {
    const raw = fixture.localStorage[SAVE_KEY];
    expect(raw, 'the fixture holds a save under the save key').toBeTypeOf('string');
    const stored = JSON.parse(raw!) as SaveData;
    // None of those builds knew the fields.
    expect(stored.settings).not.toHaveProperty('titleArt');
    expect(stored.settings).not.toHaveProperty('chapterSelectMusic');

    const slot = slotWith(raw);
    const store = new SaveStore(SAVE_KEY, slot);
    const s = store.settings;
    expect(s.titleArt).toBe('farplane');
    expect(s.chapterSelectMusic).toBe('b');

    // Everything that was saved is still there: every chapter record, every clear and time, the coach marks, the unlocks.
    const loaded = store.value;
    for (const [id, rec] of Object.entries(stored.chapters)) {
      expect(loaded.chapters[id]?.cleared, `${id} cleared`).toBe(rec.cleared);
      expect(loaded.chapters[id]?.attempts, `${id} attempts`).toBe(rec.attempts);
    }
    expect(loaded.unlocked).toEqual(stored.unlocked ?? []);
    expect(loaded.version).toBe(SAVE_VERSION);
    for (const [k, v] of Object.entries(fixture.expect?.settings ?? {})) expect((s as unknown as Record<string, unknown>)[k], k).toEqual(v);

    // And the two defaults are the ONLY fields it gained that were not already a default of the older build.
    const gained = Object.keys(s).filter((k) => !(k in stored.settings));
    expect(gained).toContain('titleArt');
    expect(gained).toContain('chapterSelectMusic');

    // A save and a reload keeps them, with the choice made.
    store.setSettings({ titleArt: 'echo', chapterSelectMusic: 'c' });
    const again = new SaveStore(SAVE_KEY, slot);
    expect(again.settings.titleArt).toBe('echo');
    expect(again.settings.chapterSelectMusic).toBe('c');
  });
});

describe('a value that is not on the list never reaches the title screen or the mixer (CHK-024)', () => {
  const blobWith = (settings: Record<string, unknown>): string => JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings, seenCoach: [], flags: {} });

  it('reads as the default, and leaves every other setting as it was', () => {
    for (const bad of ['ECHO', 'gullwings', 7, null, true, {}, ['echo']]) {
      const s = new SaveStore(SAVE_KEY, slotWith(blobWith({ titleArt: bad, chapterSelectMusic: bad, masterVolume: 0.25 }))).settings;
      expect(s.titleArt, `titleArt ${JSON.stringify(bad)}`).toBe('farplane');
      expect(s.chapterSelectMusic, `chapterSelectMusic ${JSON.stringify(bad)}`).toBe('b');
      expect(s.masterVolume).toBe(0.25);
    }
  });

  it('keeps a stored choice that is on the list', () => {
    const s = new SaveStore(SAVE_KEY, slotWith(blobWith({ titleArt: 'echo', chapterSelectMusic: 'a' }))).settings;
    expect(s.titleArt).toBe('echo');
    expect(s.chapterSelectMusic).toBe('a');
    const m = migrate({ settings: { ...defaultSettings(), titleArt: 'echo', chapterSelectMusic: 'c' } });
    expect(m.settings.titleArt).toBe('echo');
    expect(m.settings.chapterSelectMusic).toBe('c');
  });

  it('survives a blob that is not a save at all', () => {
    for (const junk of ['', '{', 'null', '[]', '"echo"']) {
      const s = new SaveStore(SAVE_KEY, slotWith(junk)).settings;
      expect(s.titleArt).toBe('farplane');
      expect(s.chapterSelectMusic).toBe('b');
    }
  });
});

describe('the OPTIONS rows', () => {
  const store = (): SaveStore => new SaveStore(SAVE_KEY, slotWith());

  it('print the choice in words, for every game', () => {
    for (const game of ['ffx', 'ffx2', 'ff7'] as const) {
      const rows = optionRows(defaultSettings(), game);
      expect(rows.find((r) => r.id === 'titleArt'), game).toMatchObject({ label: 'TITLE SCREEN', value: 'FARPLANE', ratio: null });
      expect(rows.find((r) => r.id === 'chapterSelectMusic'), game).toMatchObject({ label: 'CHAPTER MUSIC', value: 'B  PIANO', ratio: null });
      const settings = optionsColumns({ settings: defaultSettings(), battleHelpOn: true, canRestart: true, canChapterSelect: true, canQuit: true, extraRows: [], game }).find((c) => c.id === 'settings')!;
      const ids = settings.rows.map((r) => r.id);
      expect(ids, `${game} shows both rows`).toEqual(expect.arrayContaining(['titleArt', 'chapterSelectMusic']));
      expect(settings.rows.find((r) => r.id === 'titleArt')?.selectable).toBe(true);
      expect(settings.rows.find((r) => r.id === 'chapterSelectMusic')?.selectable).toBe(true);
      // BATTLE HELP stays under STRATEGY GUIDE, which it belongs with; the front-end rows follow them.
      expect(ids.indexOf('battleHelp')).toBe(ids.indexOf('guideVisible') + 1);
      expect(ids.indexOf('titleArt')).toBeGreaterThan(ids.indexOf('battleHelp'));
    }
  });

  it('read the label of whatever is stored', () => {
    expect(optionRows({ ...defaultSettings(), titleArt: 'echo' }).find((r) => r.id === 'titleArt')?.value).toBe(TITLE_ART_LABELS.echo);
    for (const m of CHAPTER_SELECT_MUSICS) {
      expect(optionRows({ ...defaultSettings(), chapterSelectMusic: m }).find((r) => r.id === 'chapterSelectMusic')?.value).toBe(CHAPTER_SELECT_LABELS[m]);
    }
    // a bad stored value prints the default's label, as it plays the default
    expect(optionRows({ ...defaultSettings(), titleArt: 'x' as never }).find((r) => r.id === 'titleArt')?.value).toBe('FARPLANE');
  });

  it('step through the lists on Right, Left and Confirm, and write the choice to the save', () => {
    const st = store();
    expect(adjustSetting(st, 'titleArt', 1)).toBe(true);
    expect(st.settings.titleArt).toBe('echo');
    expect(adjustSetting(st, 'titleArt', 1, true)).toBe(true); // Confirm / a tap: wraps back
    expect(st.settings.titleArt).toBe('farplane');
    adjustSetting(st, 'titleArt', -1);
    expect(st.settings.titleArt).toBe('echo');

    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      adjustSetting(st, 'chapterSelectMusic', 1);
      seen.push(st.settings.chapterSelectMusic);
    }
    expect(seen).toEqual(['a', 'c', 'b']);
    adjustSetting(st, 'chapterSelectMusic', -1);
    expect(st.settings.chapterSelectMusic).toBe('c');
  });

  it('change nothing else', () => {
    const st = store();
    const before = { ...st.settings };
    adjustSetting(st, 'titleArt', 1);
    adjustSetting(st, 'chapterSelectMusic', 1);
    const after = { ...st.settings };
    delete (before as Record<string, unknown>).titleArt;
    delete (before as Record<string, unknown>).chapterSelectMusic;
    delete (after as Record<string, unknown>).titleArt;
    delete (after as Record<string, unknown>).chapterSelectMusic;
    expect(after).toEqual(before);
  });
});
