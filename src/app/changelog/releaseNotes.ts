/**
 * What the title screen's CHANGELOG panel says: ONE short player note per release, newest first.
 *
 * Bailey, 2026-10-08: "Include a changelog button on the title screen and build number should be shown on the title
 * screen." He took option A of the measured mock-up and "all your recommendations": the panel lists releases newest
 * first, each line tagged FFX, FFX-2 or Both, and its text comes from THIS file and from nothing else. It is not
 * CHANGELOG.md. That file is written after a deploy, is engineering prose and, in places, names the hidden chapters'
 * secret words; this one is written BEFORE a deploy, in the words a player would use, three to six lines a release.
 *
 * The rules that keep it that way live in `validateReleaseNotes`, and `tests/unit/release-notes.test.ts` runs it over
 * the real list on every test run. `tools/deploy-pages.mjs` runs it too, and refuses to deploy a release whose note
 * is not the newest one here (`tools/release-notes.mjs`): write the note, commit it, then deploy with
 * `--release=<name>`. The name on the title screen's build number is that same `--release` (`buildInfo.ts`).
 *
 * Game case: both. The panel is on the title, the front door of FFX and FFX-2 alike; each LINE carries its own case
 * (AGENTS.md rule 14): `FFX` for a change only FFX chapters show, `FFX-2` for one only FFX-2 chapters show, `Both` for
 * shared plumbing or a change that is true of both.
 *
 * This is a leaf module on purpose (no imports, only syntax Node can strip): the deploy tool loads it straight from
 * the source tree to read the newest release and to run the validator before anything is built.
 */

/** Which game a line is about. Printed as a small chip in front of the line. */
export type NoteTag = 'FFX' | 'FFX-2' | 'Both';

export interface ReleaseNoteLine {
  readonly tag: NoteTag;
  /** Player words, one sentence, ending in a full stop. Plain text: the panel escapes it. */
  readonly text: string;
}

export interface ReleaseNote {
  /** The release's name, as `--release=` stamps it on the build: `39.4.2`. */
  readonly release: string;
  /** The day it went live, US Eastern (the changelog's own dates), `YYYY-MM-DD`. */
  readonly date: string;
  /** Three to six lines (`NOTE_LINES`). */
  readonly lines: readonly ReleaseNoteLine[];
}

export const NOTE_TAGS: readonly NoteTag[] = ['FFX', 'FFX-2', 'Both'];

/** How many lines a release's note may have: short enough to read at a glance on the title screen. */
export const NOTE_LINES = { min: 3, max: 6 } as const;

/** The longest a line may be, so the panel stays a list and not a report. */
export const NOTE_TEXT_MAX = 200;

/** A release name: `39.5`, `39.4.2`, `31a`. The same shape `tools/build-stamp.mjs` accepts for `--release`. */
export const RELEASE_NAME = /^[0-9]+(?:\.[0-9]+)*[a-z]?$/;

/**
 * Words a player note must never contain: the hidden chapters and their secret words stay hidden (Bailey, 2026-10-08:
 * "NEVER mention hidden chapters or secret words"). The Chapter VI group is named by its fiends and by its chapter
 * number in a note, never by the word that opens the hidden chapter on the board.
 */
export const FORBIDDEN_NOTE_WORDS: readonly RegExp[] = [
  /leblanc/i,
  /\blimit\b/i,
  /hidden/i,
  /secret/i,
  /experiment/i,
  /\bff\s?7\b/i,
  /final fantasy vii\b/i,
  /guard scorpion/i,
];

/**
 * Every release the panel lists, newest first. A new release adds its entry at the TOP before it is deployed.
 *
 * 39.4, 39.4.1 and 39.4.2 are written from CHANGELOG.md and the 39.4.2 commit messages, in player words, with the
 * hidden chapters left out. Older releases are not listed: the panel starts here.
 */
export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    release: '39.4.2',
    date: '2026-10-08',
    lines: [
      { tag: 'FFX-2', text: 'Chapter VI: the fiends stand back where they stood in 39.4, because standing right beside the party looked wrong.' },
      { tag: 'FFX-2', text: 'They keep the true sizes that 39.4.1 gave them, so each fiend is bigger than it was in 39.4.' },
      { tag: 'FFX-2', text: 'The move advisor’s card is back to its full size in this chapter, and the card that shows what a fiend does next still covers no fiend’s head.' },
      { tag: 'Both', text: 'Nothing else changed: the fights play exactly as they did.' },
    ],
  },
  {
    release: '39.4.1',
    date: '2026-10-07',
    lines: [
      { tag: 'FFX-2', text: 'Chapter VI: every fiend is drawn at the size the game’s own models give it, so the bosses no longer look tiny beside the three girls.' },
      { tag: 'FFX-2', text: 'The fiends stand closer to the party with their heads level, so a taller fiend stands nearer instead of further back.' },
      { tag: 'FFX-2', text: 'The card that shows what a fiend does next no longer covers Ormi’s head.' },
      { tag: 'FFX-2', text: 'The move advisor’s card is cut to three lines in this chapter so it clears the bigger fiends’ feet.' },
      { tag: 'Both', text: 'Nothing else changed: the fights play exactly as they did.' },
    ],
  },
  {
    release: '39.4',
    date: '2026-10-07',
    lines: [
      { tag: 'Both', text: '586 character and boss poses were cleaned up: the jagged white fringe on hair and cloth is gone, and where a figure ran off its painting’s edge a hard cut is now a soft fade.' },
      { tag: 'Both', text: 'A figure’s head keeps its size when it changes pose, a knock-out included.' },
      { tag: 'FFX-2', text: 'Paine’s Black Mage dress matches her idle colours in five poses.' },
      { tag: 'FFX', text: 'Yuna’s skirt matches her idle colours in four poses.' },
      { tag: 'Both', text: 'New music: a new title-screen track and a new track for the chapter select board.' },
      { tag: 'FFX', text: 'New battle music for Seymour Flux in Chapter I and Seymour Omnis in Chapter XII.' },
    ],
  },
];

/** `[39, 4, 1]` and the trailing letter of a release name; null when it is not a release name. */
function parseRelease(name: string): { parts: number[]; letter: string } | null {
  const m = /^([0-9]+(?:\.[0-9]+)*)([a-z]?)$/.exec(name);
  if (!m) return null;
  return { parts: (m[1] ?? '').split('.').map(Number), letter: m[2] ?? '' };
}

/** Negative when `a` is the older release, positive when it is the newer: `39.4 < 39.4.1 < 39.5 < 40`. */
export function compareReleases(a: string, b: string): number {
  const pa = parseRelease(a);
  const pb = parseRelease(b);
  if (!pa || !pb) return a < b ? -1 : a > b ? 1 : 0;
  const n = Math.max(pa.parts.length, pb.parts.length);
  for (let i = 0; i < n; i++) {
    const d = (pa.parts[i] ?? 0) - (pb.parts[i] ?? 0);
    if (d !== 0) return d;
  }
  return pa.letter < pb.letter ? -1 : pa.letter > pb.letter ? 1 : 0;
}

/** The name of the newest release in the list (the first entry), or null for an empty list. */
export function newestRelease(notes: readonly ReleaseNote[] = RELEASE_NOTES): string | null {
  return notes[0]?.release ?? null;
}

function isCalendarDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/**
 * Everything wrong with a list of notes, as sentences a person can act on (empty when it is fine): the shape the
 * panel needs, the three-to-six-line rule, and the words that must never reach a player.
 */
export function validateReleaseNotes(notes: readonly ReleaseNote[]): string[] {
  const problems: string[] = [];
  if (notes.length === 0) problems.push('the list has no release at all');
  const seen = new Set<string>();
  notes.forEach((note, i) => {
    const at = `release ${JSON.stringify(note.release)}`;
    if (!RELEASE_NAME.test(note.release)) problems.push(`${at}: not a release name (digits and dots, like 39.4.2)`);
    if (seen.has(note.release)) problems.push(`${at}: listed twice`);
    seen.add(note.release);
    const next = notes[i + 1];
    if (next && compareReleases(note.release, next.release) <= 0) {
      problems.push(`${at}: must be newer than the release below it (${next.release}); the list is newest first`);
    }
    if (!isCalendarDate(note.date)) problems.push(`${at}: the date ${JSON.stringify(note.date)} is not a YYYY-MM-DD day`);
    if (next && isCalendarDate(note.date) && isCalendarDate(next.date) && note.date < next.date) {
      problems.push(`${at}: dated ${note.date}, before the release below it (${next.release}, ${next.date})`);
    }
    if (note.lines.length < NOTE_LINES.min || note.lines.length > NOTE_LINES.max) {
      problems.push(`${at}: has ${note.lines.length} line(s); a note is ${NOTE_LINES.min} to ${NOTE_LINES.max}`);
    }
    const texts = new Set<string>();
    for (const line of note.lines) {
      if (!NOTE_TAGS.includes(line.tag)) problems.push(`${at}: the tag ${JSON.stringify(line.tag)} is not FFX, FFX-2 or Both`);
      const text = line.text;
      if (text !== text.trim() || text.length < 12) problems.push(`${at}: a line is empty, too short or has stray spaces: ${JSON.stringify(text)}`);
      if (text.length > NOTE_TEXT_MAX) problems.push(`${at}: a line is ${text.length} characters, over ${NOTE_TEXT_MAX}: ${JSON.stringify(text.slice(0, 40))}...`);
      if (!text.endsWith('.')) problems.push(`${at}: a line does not end with a full stop: ${JSON.stringify(text.slice(-30))}`);
      if (/[<>]/.test(text)) problems.push(`${at}: a line has markup characters (the text is plain): ${JSON.stringify(text.slice(0, 40))}`);
      if (texts.has(text)) problems.push(`${at}: a line is repeated: ${JSON.stringify(text.slice(0, 40))}`);
      texts.add(text);
      for (const word of FORBIDDEN_NOTE_WORDS) {
        if (word.test(text)) problems.push(`${at}: a line names something that stays hidden (${word}): ${JSON.stringify(text.slice(0, 50))}`);
      }
    }
  });
  return problems;
}
