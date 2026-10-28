/**
 * PORTABLE SAVES (ChatGPT point 9): the save file's text, in and out (`src/app/savePort.ts`). Pure: no store, no DOM.
 *
 * Pinned: a round trip returns the same save; a damaged, truncated or hand-edited file is refused as `corrupt` or
 * `not-json`; an older save version is accepted and migrated; a newer one is refused before its checksum is looked
 * at; another game's file, a bare copy of the stored blob and a list are refused as not ours; a file over the size
 * cap is refused unread, and a hostile one (deep nesting, thousands of flags, a `__proto__` key) is refused without
 * throwing; every real save fixture of the last eighteen releases is accepted when put in a file and reads exactly as
 * the store reads it; and none of it can pollute `Object.prototype`.
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore, type SaveData } from '../../src/app/SaveData.ts';
import {
  CHECKSUM_PREFIX,
  MAX_SAVE_FILE_BYTES,
  SAVE_FILE_FORMAT,
  buildSaveFile,
  describeSummary,
  formatPlayTime,
  localDate,
  readSaveFile,
  saveFileName,
  summarizeSave,
  withinDepth,
  type Accepted,
  type Refusal,
} from '../../src/app/savePort.ts';
import { canonicalJson, sha256Hex } from '../../src/app/savePortSha256.ts';

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

/** A save with something in every part of it. */
function richSave(): SaveData {
  const store = new SaveStore(SAVE_KEY, new Slot());
  store.recordAttempt('seymour-flux');
  for (let i = 0; i < 8; i++) store.addPlayTime('seymour-flux', 1000);
  store.recordClear('seymour-flux', 91_500, 14);
  store.recordAttempt('ffx2-bahamut');
  store.addPlayTime('ffx2-bahamut', 700);
  store.unlock('bestiary-seymour');
  store.markCoachSeen('briefing');
  store.setFlag('seen-intro', true);
  store.setFlag('runs', 3);
  store.setFlag('name', 'Tidus');
  store.setSettings({ masterVolume: 0.5, ffx2Atb: 'active', textSpeed: 1.5, ffx2AtbSpeed: 'fast' });
  return store.snapshot();
}

const NOW = new Date(2026, 9, 28, 12, 0, 0).getTime();

/** An envelope around `save` with a CORRECT checksum, so a test reaches the check it means to reach. */
function wrap(save: unknown, over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: SAVE_FILE_FORMAT,
    formatVersion: 1,
    saveVersion: (save as { version?: number }).version ?? SAVE_VERSION,
    exportedAt: '2026-10-28T16:00:00.000Z',
    checksum: CHECKSUM_PREFIX + sha256Hex(canonicalJson(save)),
    save,
    ...over,
  });
}

const refused = (r: Accepted | Refusal): Refusal => {
  expect(r.ok).toBe(false);
  return r as Refusal;
};
const accepted = (r: Accepted | Refusal): Accepted => {
  if (!r.ok) throw new Error(`refused: ${r.code} ${r.detail ?? ''}`);
  return r;
};

describe('a save goes into a file and comes back the same', () => {
  it('round trip: every part of the save', () => {
    const save = richSave();
    const text = buildSaveFile(save, NOW);
    const back = accepted(readSaveFile(text));
    expect(back.save).toEqual(save);
    expect(back.older).toBe(false);
    expect(back.fileSaveVersion).toBe(SAVE_VERSION);
    expect(back.exportedAt).toBe(new Date(NOW).toISOString());
  });

  it('the file is a small, readable envelope with a version, a checksum and the save', () => {
    const text = buildSaveFile(richSave(), NOW);
    const file = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(file)).toEqual(['format', 'formatVersion', 'saveVersion', 'exportedAt', 'checksum', 'save']);
    expect(file['format']).toBe('echoes-of-spira-save');
    expect(file['formatVersion']).toBe(1);
    expect(file['saveVersion']).toBe(SAVE_VERSION);
    expect(file['checksum']).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(text.endsWith('}\n')).toBe(true);
    expect(text.length).toBeLessThan(20_000);
    // The checksum is the hash of the canonical text of the save, which anyone can recompute.
    expect(file['checksum']).toBe(CHECKSUM_PREFIX + sha256Hex(canonicalJson(file['save'])));
  });

  it('building a file does not change the save it was built from', () => {
    const save = richSave();
    const before = JSON.stringify(save);
    buildSaveFile(save, NOW);
    expect(JSON.stringify(save)).toBe(before);
  });

  it('survives being re-indented and having its keys re-ordered (the checksum is of the canonical text)', () => {
    const file = JSON.parse(buildSaveFile(richSave(), NOW)) as Record<string, unknown>;
    const reverse = (o: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(o).reverse());
    const edited = { ...reverse(file), save: reverse(file['save'] as Record<string, unknown>) };
    expect(readSaveFile(JSON.stringify(edited, null, '\t')).ok).toBe(true);
    expect(readSaveFile(JSON.stringify(edited)).ok).toBe(true);
  });

  it('a leading byte-order mark (an editor saved it) is allowed', () => {
    expect(readSaveFile('﻿' + buildSaveFile(richSave(), NOW)).ok).toBe(true);
  });

  it('the summary says what the save holds', () => {
    const r = accepted(readSaveFile(buildSaveFile(richSave(), NOW)));
    expect(r.summary.cleared).toBe(1);
    expect(r.summary.attempted).toBe(2);
    expect(r.summary.playTimeMs).toBe(8000 + 700);
    expect(r.summary.unlocked).toBe(1);
  });
});

describe('every real save of the last releases is accepted and reads as the store reads it', () => {
  const names = ['release-20', 'release-25-main', 'release-28-main', 'release-29', 'release-30-sfx-b', 'release-30', 'release-31a-sfx-b', 'release-31a', 'release-33', 'release-34', 'release-35', 'release-37.1'];
  for (const name of names) {
    it(name, () => {
      const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'saves', `${name}.json`), 'utf8')) as { localStorage: Record<string, string> };
      const raw = JSON.parse(fixture.localStorage[SAVE_KEY]!) as Record<string, unknown>;
      const viaFile = accepted(readSaveFile(wrap(raw)));
      const slot = new Slot();
      slot.setItem(SAVE_KEY, fixture.localStorage[SAVE_KEY]!);
      expect(viaFile.save).toEqual(new SaveStore(SAVE_KEY, slot).snapshot());
    });
  }
});

describe('a damaged file is refused', () => {
  it('one digit changed inside the save: corrupt', () => {
    const text = buildSaveFile(richSave(), NOW).replace('"attempts": 1', '"attempts": 9');
    expect(text).toContain('"attempts": 9');
    expect(refused(readSaveFile(text)).code).toBe('corrupt');
  });

  it('a chapter marked cleared by hand: corrupt', () => {
    const text = buildSaveFile(richSave(), NOW).replace('"cleared": false', '"cleared": true');
    expect(refused(readSaveFile(text)).code).toBe('corrupt');
  });

  it('one character of the checksum changed: corrupt', () => {
    const text = buildSaveFile(richSave(), NOW);
    const at = text.indexOf('sha256:') + 7;
    const flipped = text.slice(0, at) + (text[at] === 'a' ? 'b' : 'a') + text.slice(at + 1);
    expect(refused(readSaveFile(flipped)).code).toBe('corrupt');
  });

  it('cut off half way: not JSON', () => {
    const text = buildSaveFile(richSave(), NOW);
    expect(refused(readSaveFile(text.slice(0, text.length >> 1))).code).toBe('not-json');
  });

  it('empty, whitespace, binary-looking text, and JSON that is not an object', () => {
    for (const text of ['', '   \n', '\u0000\u0001\u0002PK\u0003\u0004', 'null', '42', '"save"', '[]', '[{"format":"echoes-of-spira-save"}]']) {
      expect(refused(readSaveFile(text)).code).toBe('not-json');
    }
  });
});

describe('versions', () => {
  it('an OLDER save version is accepted and migrated to this build', () => {
    const save = { ...richSave(), version: 0 };
    delete (save as Partial<SaveData>).seenCoach;
    const r = accepted(readSaveFile(wrap(save)));
    expect(r.older).toBe(true);
    expect(r.fileSaveVersion).toBe(0);
    expect(r.save.version).toBe(SAVE_VERSION);
    expect(Array.isArray(r.save.seenCoach)).toBe(true);
    expect(r.save.chapters['seymour-flux']?.cleared).toBe(true);
  });

  it('an older save without the fields that came later gets their defaults, as a stored one does', () => {
    const r = accepted(readSaveFile(wrap({ version: 0, chapters: { 'seymour-flux': { id: 'seymour-flux', cleared: true, bestTimeMs: 300000, bestTurns: 20, attempts: 1 } } })));
    expect(r.save.settings.masterVolume).toBe(0.8);
    expect(r.save.chapters['seymour-flux']?.playTimeMs).toBe(0);
    // The veteran rule a stored older save gets: it has a clear, so it is not coached on its own game.
    expect(r.save.settings.battleHelp).toBe(false);
  });

  it('a NEWER save version is refused, and before the checksum is looked at', () => {
    const newer = { ...richSave(), version: SAVE_VERSION + 1 };
    expect(refused(readSaveFile(wrap(newer))).code).toBe('newer-save');
    expect(refused(readSaveFile(wrap(newer, { checksum: 'md5:whatever-the-next-build-uses' }))).code).toBe('newer-save');
    expect(refused(readSaveFile(wrap(newer))).message).toMatch(/newer version/);
  });

  it('a NEWER file format is refused', () => {
    expect(refused(readSaveFile(wrap(richSave(), { formatVersion: 2 }))).code).toBe('newer-file');
  });

  it('a format or save version that is not a whole number is malformed', () => {
    for (const over of [{ formatVersion: 0 }, { formatVersion: 1.5 }, { formatVersion: '1' }, { saveVersion: -1 }, { saveVersion: 0.5 }, { saveVersion: '1' }, { saveVersion: null }]) {
      expect(refused(readSaveFile(wrap(richSave(), over))).code, JSON.stringify(over)).toBe('malformed');
    }
  });

  it('an envelope that disagrees with the save inside it is malformed', () => {
    expect(refused(readSaveFile(wrap(richSave(), { saveVersion: 0 }))).code).toBe('malformed');
  });
});

describe('a file from another game, or no game', () => {
  it('another game’s save file', () => {
    const other = JSON.stringify({ format: 'some-other-game-save', formatVersion: 1, saveVersion: 1, checksum: CHECKSUM_PREFIX + sha256Hex('{}'), save: { gold: 10 } });
    expect(refused(readSaveFile(other)).code).toBe('not-a-save-file');
    expect(refused(readSaveFile(other)).message).toBe('That is not an Echoes of Spira save file.');
  });

  it('a bare copy of the stored blob (no envelope, so no checksum)', () => {
    expect(refused(readSaveFile(JSON.stringify(richSave()))).code).toBe('not-a-save-file');
  });

  it('an object with no format word, or the wrong type of one', () => {
    for (const text of ['{}', '{"format":1}', '{"format":null}', '{"format":["echoes-of-spira-save"]}', '{"FORMAT":"echoes-of-spira-save"}']) {
      expect(refused(readSaveFile(text)).code).toBe('not-a-save-file');
    }
  });
});

describe('a file that is too big, or built to hurt', () => {
  it('over the cap is refused unread', () => {
    const big = ' '.repeat(MAX_SAVE_FILE_BYTES + 1);
    expect(refused(readSaveFile(big)).code).toBe('too-large');
    const real = buildSaveFile(richSave(), NOW);
    expect(refused(readSaveFile(real + ' '.repeat(MAX_SAVE_FILE_BYTES))).code).toBe('too-large');
  });

  it('exactly at the cap it is read (and refused for what it is, not its size)', () => {
    expect(refused(readSaveFile(' '.repeat(MAX_SAVE_FILE_BYTES))).code).toBe('not-json');
  });

  it('a very deeply nested file is refused without throwing', () => {
    const depth = 200_000;
    expect(['not-json', 'not-a-save-file', 'malformed']).toContain(refused(readSaveFile('['.repeat(depth) + ']'.repeat(depth))).code);
    const nested = '{"format":"echoes-of-spira-save","formatVersion":1,"saveVersion":1,"checksum":"sha256:' + '0'.repeat(64) + '","save":' + '{"a":'.repeat(60_000) + '1' + '}'.repeat(60_000) + '}';
    expect(nested.length).toBeLessThan(MAX_SAVE_FILE_BYTES);
    expect(refused(readSaveFile(nested)).code).toBe('malformed');
  });

  it('thousands of flags, chapters or list entries are refused', () => {
    const flags = Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`f${i}`, i]));
    expect(refused(readSaveFile(wrap({ ...richSave(), flags }))).code).toBe('malformed');
    const chapters = Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`c${i}`, { id: `c${i}`, cleared: false, bestTimeMs: null, bestTurns: null, attempts: 0, playTimeMs: 0 }]));
    expect(refused(readSaveFile(wrap({ ...richSave(), chapters }))).code).toBe('malformed');
    expect(refused(readSaveFile(wrap({ ...richSave(), unlocked: Array.from({ length: 2500 }, (_, i) => `u${i}`) }))).code).toBe('malformed');
  });

  it('withinDepth is iterative and counts levels', () => {
    expect(withinDepth({ a: [{ b: 1 }] }, 3)).toBe(true);
    expect(withinDepth({ a: [{ b: 1 }] }, 2)).toBe(false);
    let deep: unknown = 1;
    for (let i = 0; i < 100_000; i++) deep = [deep];
    expect(withinDepth(deep, 12)).toBe(false);
  });

  it('a __proto__, constructor or prototype key in a map the game writes into is refused, and nothing is polluted', () => {
    const base = richSave() as unknown as Record<string, unknown>;
    const record = { cleared: true, bestTimeMs: null, bestTurns: null, attempts: 1, playTimeMs: 0 };
    const texts = [
      wrap({ ...base, chapters: JSON.parse('{"__proto__":' + JSON.stringify(record) + '}') as unknown }),
      wrap({ ...base, chapters: JSON.parse('{"constructor":' + JSON.stringify(record) + '}') as unknown }),
      wrap({ ...base, flags: JSON.parse('{"__proto__":true}') as unknown }),
      wrap({ ...base, flags: JSON.parse('{"prototype":1}') as unknown }),
      wrap({ ...base, settings: JSON.parse('{"__proto__":true}') as unknown }),
    ];
    for (const text of texts) expect(refused(readSaveFile(text)).code).toBe('malformed');
    expect(({} as Record<string, unknown>)['cleared']).toBeUndefined();
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});

describe('a file whose save is the wrong shape is refused as malformed (strict where migrate is lenient)', () => {
  const base = (): Record<string, unknown> => richSave() as unknown as Record<string, unknown>;
  const rec = { id: 'x', cleared: true, bestTimeMs: 100_000, bestTurns: 9, attempts: 1, playTimeMs: 5 };
  const mutate = (fn: (s: Record<string, unknown>) => void): string => {
    const s = JSON.parse(JSON.stringify(base())) as Record<string, unknown>;
    fn(s);
    return wrap(s);
  };
  const cases: Array<[string, (s: Record<string, unknown>) => void]> = [
    ['chapters is a string', (s) => (s['chapters'] = 'seymour-flux')],
    ['chapters is null', (s) => (s['chapters'] = null)],
    ['chapters is a list', (s) => (s['chapters'] = [rec])],
    ['chapters is missing', (s) => delete s['chapters']],
    ['a chapter record is null', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = null)],
    ['a chapter record is a number', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = 7)],
    ['cleared is a word', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, cleared: 'yes' })],
    ['attempts is negative', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, attempts: -1 })],
    ['attempts is missing', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, attempts: undefined })],
    ['bestTimeMs is a string', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, bestTimeMs: 'fast' })],
    ['bestTurns is undefined', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, bestTurns: undefined })],
    ['playTimeMs is infinite (null in JSON)', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, playTimeMs: null })],
    ['a chapter record carries a nested value', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, extra: { deep: [1] } })],
    ['a chapter record id is a number', (s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, id: 5 })],
    ['unlocked is a string', (s) => (s['unlocked'] = 'bestiary')],
    ['unlocked holds a number', (s) => (s['unlocked'] = ['a', 1])],
    ['unlocked is null', (s) => (s['unlocked'] = null)],
    ['seenCoach holds an object', (s) => (s['seenCoach'] = [{ id: 'briefing' }])],
    ['settings is a list', (s) => (s['settings'] = [])],
    ['settings is null', (s) => (s['settings'] = null)],
    ['a volume is out of range', (s) => ((s['settings'] as Record<string, unknown>)['masterVolume'] = 7)],
    ['a volume is a word', (s) => ((s['settings'] as Record<string, unknown>)['musicVolume'] = 'loud')],
    ['a toggle is a number', (s) => ((s['settings'] as Record<string, unknown>)['lowEffects'] = 1)],
    ['ffx2Atb is not a mode', (s) => ((s['settings'] as Record<string, unknown>)['ffx2Atb'] = 'banana')],
    ['ffx2AtbSpeed is not a speed', (s) => ((s['settings'] as Record<string, unknown>)['ffx2AtbSpeed'] = 'ludicrous')],
    ['textSpeed is zero', (s) => ((s['settings'] as Record<string, unknown>)['textSpeed'] = 0)],
    ['a setting is nested', (s) => ((s['settings'] as Record<string, unknown>)['theme'] = { dark: true })],
    ['flags is a list', (s) => (s['flags'] = ['a'])],
    ['a flag is nested', (s) => (s['flags'] = { a: { b: 1 } })],
    ['a flag is null', (s) => (s['flags'] = { a: null })],
    ['updatedAt is a string', (s) => (s['updatedAt'] = 'now')],
    ['updatedAt is negative', (s) => (s['updatedAt'] = -5)],
  ];
  for (const [name, fn] of cases) {
    it(name, () => {
      const r = readSaveFile(mutate(fn));
      expect(r.ok, name).toBe(false);
      expect((r as Refusal).code, name).toBe('malformed');
      expect((r as Refusal).detail, name).toMatch(/^save/);
    });
  }

  it('the save inside is a list, a string or null', () => {
    for (const save of [[], 'x', null, 5]) {
      expect(refused(readSaveFile(JSON.stringify({ format: SAVE_FILE_FORMAT, formatVersion: 1, saveVersion: 1, checksum: CHECKSUM_PREFIX + sha256Hex('x'), save }))).code).toBe('malformed');
    }
  });

  it('a checksum that is not sha256:<64 hex> is malformed', () => {
    for (const checksum of ['', 'sha256:abc', 'md5:' + '0'.repeat(32), 'sha256:' + 'G'.repeat(64), 7, null]) {
      expect(refused(readSaveFile(wrap(richSave(), { checksum }))).code, String(checksum)).toBe('malformed');
    }
  });

  it('the refusal always names a field path for the debug line, never the player’s data', () => {
    const r = refused(readSaveFile(mutate((s) => ((s['chapters'] as Record<string, unknown>)['x'] = { ...rec, cleared: 'yes' }))));
    expect(r.detail).toBe('save.chapters.x.cleared');
  });
});

describe('what a newer build at the same version may add', () => {
  it('an unknown top-level key is dropped, an unknown plain setting and chapter field are kept', () => {
    const s = JSON.parse(JSON.stringify(richSave())) as Record<string, unknown>;
    s['futureThing'] = { anything: [1, 2, 3] };
    (s['settings'] as Record<string, unknown>)['newSetting'] = 'on';
    (s['chapters'] as Record<string, Record<string, unknown>>)['seymour-flux']!['newField'] = 7;
    const r = accepted(readSaveFile(wrap(s)));
    expect(r.save).not.toHaveProperty('futureThing');
    expect((r.save.settings as unknown as Record<string, unknown>)['newSetting']).toBe('on');
    expect((r.save.chapters['seymour-flux'] as unknown as Record<string, unknown>)['newField']).toBe(7);
  });
});

describe('the words a player sees', () => {
  it('play time', () => {
    expect(formatPlayTime(0)).toBe('UNDER A MINUTE');
    expect(formatPlayTime(59_999)).toBe('UNDER A MINUTE');
    expect(formatPlayTime(60_000)).toBe('1 M');
    expect(formatPlayTime(42 * 60_000)).toBe('42 M');
    expect(formatPlayTime(72 * 60_000)).toBe('1 H 12 M');
    expect(formatPlayTime(120 * 60_000)).toBe('2 H 0 M');
    expect(formatPlayTime(-5)).toBe('UNDER A MINUTE');
  });

  it('the line that compares two saves', () => {
    const s = summarizeSave(richSave());
    expect(describeSummary({ ...s, cleared: 3, playTimeMs: 72 * 60_000, updatedAt: NOW })).toBe('3 CLEARED · 1 H 12 M PLAYED · LAST SAVED 2026-10-28');
    expect(describeSummary({ ...s, updatedAt: 0 })).toMatch(/NEVER SAVED$/);
  });

  it('the file name carries the player’s local date', () => {
    expect(localDate(NOW)).toBe('2026-10-28');
    expect(saveFileName(NOW)).toBe('echoes-of-spira-save-2026-10-28.json');
  });
});
