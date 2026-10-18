/**
 * The title screen's CHANGELOG panel reads ONE typed file of short player notes (`src/app/changelog/releaseNotes.ts`;
 * Bailey, 2026-10-08: "Panel text comes from ONE typed data file of short PLAYER notes per release (3 to 6 lines, tagged).
 * NOT CHANGELOG.md ... and NEVER mention hidden chapters or secret words"). This pins the format of that file on every test
 * run, so a note that breaks a rule fails here before the deploy tool (which runs the same validator) ever sees it.
 *
 * Game case: both. Every line carries its own tag (FFX, FFX-2 or Both), and the notes for 39.4, 39.4.1 and 39.4.2 are
 * written from CHANGELOG.md and the 39.4.2 commit messages: 39.4.1 and 39.4.2 are FFX-2 only in their game lines.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FORBIDDEN_NOTE_WORDS,
  NOTE_LINES,
  NOTE_TAGS,
  NOTE_TEXT_MAX,
  RELEASE_NAME,
  RELEASE_NOTES,
  compareReleases,
  newestRelease,
  validateReleaseNotes,
  type ReleaseNote,
} from '../../src/app/changelog/releaseNotes.ts';

const REPO = resolve(__dirname, '..', '..');

const note = (over: Partial<ReleaseNote> = {}): ReleaseNote => ({
  release: '40',
  date: '2026-10-09',
  lines: [
    { tag: 'Both', text: 'A short line a player would write about a change.' },
    { tag: 'FFX', text: 'A second line, about the first game only.' },
    { tag: 'FFX-2', text: 'A third line, about the second game only.' },
  ],
  ...over,
});

describe('the real notes', () => {
  it('pass the validator: nothing wrong with the list the panel shows', () => {
    expect(validateReleaseNotes(RELEASE_NOTES)).toEqual([]);
  });

  it('list 39.4.2, 39.4.1 and 39.4, newest first, with the day each went live (US Eastern)', () => {
    expect(RELEASE_NOTES.map((n) => [n.release, n.date])).toEqual([
      ['39.4.2', '2026-10-08'],
      ['39.4.1', '2026-10-07'],
      ['39.4', '2026-10-07'],
    ]);
    expect(newestRelease()).toBe('39.4.2');
    expect(newestRelease(RELEASE_NOTES)).toBe(RELEASE_NOTES[0]?.release);
  });

  it('give every release three to six lines, each tagged FFX, FFX-2 or Both and short enough to read at a glance', () => {
    for (const n of RELEASE_NOTES) {
      expect(n.lines.length, n.release).toBeGreaterThanOrEqual(NOTE_LINES.min);
      expect(n.lines.length, n.release).toBeLessThanOrEqual(NOTE_LINES.max);
      for (const l of n.lines) {
        expect(NOTE_TAGS, `${n.release}: ${l.text}`).toContain(l.tag);
        expect(l.text.length, `${n.release}: ${l.text}`).toBeLessThanOrEqual(NOTE_TEXT_MAX);
        expect(l.text.endsWith('.'), l.text).toBe(true);
      }
    }
  });

  it('tag each line by game from the sources: the Chapter VI hotfixes are FFX-2, the music and colour lines say which game', () => {
    const lines = (r: string) => RELEASE_NOTES.find((n) => n.release === r)!.lines;
    // 39.4.1 and 39.4.2 changed Chapter VI (an FFX-2 chapter) and nothing else a player sees: every game line is FFX-2.
    for (const r of ['39.4.1', '39.4.2']) {
      for (const l of lines(r)) expect(['FFX-2', 'Both'], `${r}: ${l.text}`).toContain(l.tag);
      expect(lines(r).some((l) => l.tag === 'FFX'), r).toBe(false);
    }
    // 39.4: Paine's dress is FFX-2, Yuna's skirt is FFX, the battle music for Seymour is FFX.
    const l394 = lines('39.4');
    expect(l394.find((l) => /Paine/.test(l.text))?.tag).toBe('FFX-2');
    expect(l394.find((l) => /Yuna/.test(l.text))?.tag).toBe('FFX');
    expect(l394.find((l) => /Seymour/.test(l.text))?.tag).toBe('FFX');
  });

  it('never name a hidden chapter or a secret word (Bailey: NEVER mention them)', () => {
    const all = RELEASE_NOTES.flatMap((n) => n.lines.map((l) => l.text)).join('\n');
    for (const word of FORBIDDEN_NOTE_WORDS) expect(all, String(word)).not.toMatch(word);
    expect(all.toLowerCase()).not.toContain('leblanc');
    expect(all.toLowerCase()).not.toContain('limit');
    expect(all.toLowerCase()).not.toContain('ff7');
  });

  it('are a leaf module with no imports, so the deploy tool can load the file straight from the source tree', () => {
    const src = readFileSync(resolve(REPO, 'src/app/changelog/releaseNotes.ts'), 'utf8');
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/\benum\s/);
    expect(src).not.toMatch(/\bnamespace\s/);
  });

  it('are not CHANGELOG.md: the file does not read it and no note repeats its engineering prose', () => {
    const src = readFileSync(resolve(REPO, 'src/app/changelog/releaseNotes.ts'), 'utf8');
    expect(src).not.toMatch(/readFileSync|CHANGELOG\.md['"`]/);
    for (const l of RELEASE_NOTES.flatMap((n) => n.lines)) {
      expect(l.text, 'a player note is not a measurement dump').not.toMatch(/\b\d+(?:,\d{3})+ (?:files|pixels)\b|bundle|sha256|F39\d{2}-\d{2}|PR-\d{4}/);
    }
  });
});

describe('release names and their order', () => {
  it('compares dotted releases as numbers, with a trailing letter after the number', () => {
    const sorted = ['39.4.1', '39.10', '39.5', '40', '39.4', '31a', '31'].sort(compareReleases);
    expect(sorted).toEqual(['31', '31a', '39.4', '39.4.1', '39.5', '39.10', '40']);
    expect(compareReleases('39.4.2', '39.4.1')).toBeGreaterThan(0);
    expect(compareReleases('39.4', '39.4.0')).toBe(0);
  });

  it('accepts the names a release has had and refuses the ones it never will', () => {
    for (const ok of ['39', '39.5', '39.4.2', '31a', '22']) expect(RELEASE_NAME.test(ok), ok).toBe(true);
    for (const bad of ['', 'v39', '39.', '39..4', 'Preview', '39 .4', '39.4-rc1', 'release 39']) expect(RELEASE_NAME.test(bad), bad).toBe(false);
  });
});

describe('the validator sees every way a note can be wrong (controls)', () => {
  it('passes a well-formed note, newest first', () => {
    expect(validateReleaseNotes([note({ release: '40' }), note({ release: '39.5', date: '2026-10-08' })])).toEqual([]);
  });

  it('refuses an empty list', () => {
    expect(validateReleaseNotes([]).join(' ')).toMatch(/no release/);
  });

  it('refuses a note with too few or too many lines', () => {
    const few = note({ lines: note().lines.slice(0, 2) });
    const many = note({ lines: Array.from({ length: 7 }, (_, i) => ({ tag: 'Both' as const, text: `Line number ${i + 1} is long enough to count as one.` })) });
    expect(validateReleaseNotes([few]).join(' ')).toMatch(/2 line/);
    expect(validateReleaseNotes([many]).join(' ')).toMatch(/7 line/);
  });

  it('refuses a bad tag, a bad date, a bad name, a repeat and a wrong order', () => {
    const bad = note({ release: 'v1', date: '2026-02-30', lines: [{ tag: 'FFX2' as never, text: 'A line that is fine otherwise, with a full stop.' }, ...note().lines.slice(1)] });
    const problems = validateReleaseNotes([bad]).join(' | ');
    expect(problems).toMatch(/not a release name/);
    expect(problems).toMatch(/not a YYYY-MM-DD day/);
    expect(problems).toMatch(/not FFX, FFX-2 or Both/);
    expect(validateReleaseNotes([note(), note()]).join(' ')).toMatch(/listed twice/);
    expect(validateReleaseNotes([note({ release: '39.5' }), note({ release: '40' })]).join(' ')).toMatch(/must be newer/);
    expect(validateReleaseNotes([note({ release: '40', date: '2026-10-01' }), note({ release: '39.5', date: '2026-10-08' })]).join(' ')).toMatch(/before the release below/);
  });

  it('refuses a line with markup, no full stop, stray spaces, a duplicate or too many characters', () => {
    const mk = (text: string) => note({ lines: [{ tag: 'Both', text }, ...note().lines.slice(1)] });
    expect(validateReleaseNotes([mk('A line with <b>markup</b> in it, and a stop.')]).join(' ')).toMatch(/markup/);
    expect(validateReleaseNotes([mk('A line with no full stop at the end')]).join(' ')).toMatch(/full stop/);
    expect(validateReleaseNotes([mk(' A line that starts with a space.')]).join(' ')).toMatch(/stray spaces/);
    expect(validateReleaseNotes([mk(`${'A very long line. '.repeat(20)}`.trim())]).join(' ')).toMatch(/over 200/);
    const dup = note({ lines: [note().lines[0]!, note().lines[0]!, note().lines[2]!] });
    expect(validateReleaseNotes([dup]).join(' ')).toMatch(/repeated/);
  });

  it('refuses a hidden chapter or a secret word in a line, in any case', () => {
    const mk = (text: string) => validateReleaseNotes([note({ lines: [{ tag: 'FFX-2', text }, ...note().lines.slice(1)] })]).join(' ');
    expect(mk('Type LEBLANC on the board and the door opens.')).toMatch(/stays hidden/);
    expect(mk('The hidden chapter now holds its footing.')).toMatch(/stays hidden/);
    expect(mk('A secret word opens something new.')).toMatch(/stays hidden/);
    expect(mk('The experimental chapter was updated too.')).toMatch(/stays hidden/);
    expect(mk('The FF7 fight now opens from the board.')).toMatch(/stays hidden/);
    expect(mk('Final Fantasy VII has a new fight to try.')).toMatch(/stays hidden/);
    expect(mk('Guard Scorpion walks forward now.')).toMatch(/stays hidden/);
    expect(mk('The word limit opens the fight.')).toMatch(/stays hidden/);
    expect(mk('A limited number of fiends were moved.')).toBe('');
  });
});
