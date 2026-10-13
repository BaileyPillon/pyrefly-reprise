/**
 * Every rendered cue has to be reachable, and every cue the game asks for has
 * to exist.
 *
 * Both halves had already failed silently. `victory-ffx`, `victory-ffx2` and
 * `ending-ffx` were composed, rendered, measured, shipped in
 * `public/audio/manifest.json` — and unreachable, because every chapter in
 * `encounters.ts` carried `victory: 'title'` and nothing anywhere named the
 * FFX ending. Three of the score's twenty-one cues could not be heard by
 * playing the game, and nothing said so, because a cue that is never asked for
 * throws no error: it just never plays.
 *
 * So the test walks the three places a cue can be named — chapter records,
 * story scripts, and the `playMusic('literal')` calls in the screens — and
 * compares that set against the manifest and the track index in both
 * directions.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { TRACKS, hasTrack, isRetiredMusic } from '../../src/audio/tracks/index.ts';
import { resultsCueFor, resultsScreenSilent } from '../../src/app/screens/resultsMusic.ts';
import type { ChapterScripts, Step, StoryScript } from '../../src/story/dsl.ts';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
/**
 * Where a cue can be named by a literal.
 *
 * `src/ui/common` joined `src/app/screens` when the pause hush landed
 * (`ui/common/pauseMusic.ts`): a screen is not the only thing that can start a
 * cue, and a shared helper called from two screens is still the game asking
 * for it.
 */
const SCREEN_DIRS = [join(REPO_ROOT, 'src', 'app', 'screens'), join(REPO_ROOT, 'src', 'ui', 'common')];
const MANIFEST = join(REPO_ROOT, 'public', 'audio', 'manifest.json');

/**
 * Cues that exist and are deliberately not wired to anything yet.
 *
 * `pause` used to be listed here. It is wired now — `src/ui/common/pauseMusic.ts`,
 * called from the `onPause` hook `BattleScreen` and `CutsceneScreen` already
 * hand the pause menu, so `PauseScreen.ts` itself did not have to be touched.
 *
 * The one that took its place is a **finding, not a to-do**. Once every boss
 * fight is scored with its own cue (critic round 02 #02), the five chapters
 * name five boss themes, five scene beds, two fanfares and two endings — and
 * nothing in a five-boss game is left for the generic FFX battle theme
 * (`battle-ffx`, "We can win this": there are no ordinary fights). It is still
 * heard from the pause menu's jukebox, which lists `trackNames()` in full.
 * Whether the FFX arc should gain a normal-battle cue is Bailey's call; parking
 * it on a chapter's `music` field to keep this test quiet would have hidden the
 * question. (`boss-dread`, the generic approach bed, left this list on 2026-10-10:
 * the hidden Sinspawn Gui chapter plays it, and the walk below now visits the
 * hidden experiments, which are reachable through `getChapter` like the unlisted ones.)
 */
const KNOWN_UNWIRED = new Set([
  'battle-ffx',
]);

// ---------------------------------------------------------------------------
// Walking the three places a cue can be named
// ---------------------------------------------------------------------------

/** Follows `ifFlag` branches, so a cue inside a player choice still counts. */
function collectFromScript(script: StoryScript | undefined, into: Set<string>): void {
  for (const step of script ?? []) {
    collectFromStep(step, into);
  }
}

function collectFromStep(step: Step, into: Set<string>): void {
  if (step.type === 'music' && step.track) into.add(step.track);
  if (step.type === 'ifFlag') {
    collectFromScript(step.then, into);
    collectFromScript(step.else, into);
  }
}

function collectFromScripts(scripts: ChapterScripts | undefined, into: Set<string>): void {
  if (!scripts) return;
  collectFromScript(scripts.pre, into);
  collectFromScript(scripts.post, into);
  for (const script of Object.values(scripts.midScripts ?? {})) collectFromScript(script, into);
}

/**
 * `playMusic('title', ...)` in a screen. Only string literals: a call that
 * passes a variable is passing a value that came from a chapter record or a
 * script, both of which are walked structurally above.
 */
function collectFromScreens(into: Set<string>): void {
  for (const dir of SCREEN_DIRS) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.ts')) continue;
      const source = readFileSync(join(dir, file), 'utf8');
      for (const match of source.matchAll(/playMusic\(\s*'([a-z0-9-]+)'/g)) into.add(match[1]!);
      // `DemoScene` names its cue through a module constant.
      for (const match of source.matchAll(/^const MUSIC_TRACK = '([a-z0-9-]+)'/gm)) into.add(match[1]!);
    }
  }
}

/** Every cue the game can actually ask for, with where it was asked for. */
function referencedCues(): Map<string, string[]> {
  const sources = new Map<string, string[]>();
  const note = (key: string, where: string): void => {
    sources.set(key, [...(sources.get(key) ?? []), where]);
  };

  // Unlisted chapters (registered, reachable through getChapter) count too, and so do the hidden experiments (typed words; also reachable through
  // getChapter): since 2026-10-10 the FFX-2 Experiment's Act I is the last chapter that plays `boss-ffx2-aeon` (batch 1 moved the others off it).
  for (const chapter of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS]) {
    for (const [field, key] of Object.entries(chapter.music)) {
      if (typeof key === 'string') note(key, `${chapter.id}.music.${field}`);
    }
    const fromScripts = new Set<string>();
    collectFromScripts(chapter.scriptsRef, fromScripts);
    for (const key of fromScripts) note(key, `${chapter.id} script`);
    // The results screen's own cue for a loss (music batch 2): named by `resultsMusic.ts`, not by a literal `playMusic` call.
    const defeat = resultsCueFor(chapter, 'defeat');
    if (defeat) note(defeat.cue, `${chapter.id} results (defeat)`);
  }

  const fromScreens = new Set<string>();
  collectFromScreens(fromScreens);
  for (const key of fromScreens) note(key, 'screen');

  return sources;
}

const REFERENCED = referencedCues();
const MANIFEST_CUES = Object.keys(
  (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { music: Record<string, unknown> }).music,
);

describe('every shipped cue is reachable', () => {
  it('renders exactly the cues the track index composes, except the retired compositions (batch 2, 2026-10-12): composed, unshipped, and only a synth fallback now', () => {
    expect(MANIFEST_CUES.slice().sort()).toEqual(Object.keys(TRACKS).filter((key) => !isRetiredMusic(key)).sort());
    for (const key of Object.keys(TRACKS).filter(isRetiredMusic)) {
      expect(MANIFEST_CUES, `${key} is retired but still in the manifest`).not.toContain(key);
      expect(REFERENCED.has(key), `${key} is retired but ${REFERENCED.get(key)?.join(', ')} still asks for it`).toBe(false);
    }
  });

  it('names every cue in the manifest from an encounter, a script or a screen', () => {
    const unreachable = MANIFEST_CUES.filter((key) => !REFERENCED.has(key) && !KNOWN_UNWIRED.has(key));
    expect(
      unreachable,
      `rendered but unreachable — nothing in src/ asks for ${unreachable.join(', ')}`,
    ).toEqual([]);
  });

  it('keeps the unwired list honest — an entry that got wired must be deleted', () => {
    for (const key of KNOWN_UNWIRED) {
      expect(TRACKS[key], `${key} is listed as unwired but no longer exists`).toBeDefined();
      expect(
        REFERENCED.has(key),
        `${key} is wired now (${REFERENCED.get(key)?.join(', ')}) — delete it from KNOWN_UNWIRED`,
      ).toBe(false);
    }
  });
});

describe('every cue the game asks for exists', () => {
  it.each([...REFERENCED].map(([key, where]) => [key, where.join(', ')]))(
    '%s (%s) is a real track',
    (key) => {
      expect(hasTrack(key), `${key} is played but is not in the track index`).toBe(true);
    },
  );

  it('has a rendered file for every referenced cue', () => {
    const missing = [...REFERENCED.keys()].filter((key) => !MANIFEST_CUES.includes(key));
    expect(missing, `referenced but never rendered: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('the victory fanfares are wired per game', () => {
  it.each(CHAPTERS.filter((c) => c.music.victory !== undefined))(
    '$id plays its own game\'s fanfare (Chapter IV, the quiet resolve of its own)',
    (chapter) => {
      const fanfare = chapter.game === 'ffx' ? 'victory-ffx' : 'victory-ffx2';
      expect(chapter.music.victory).toBe(chapter.id === 'ffx2-bahamut' ? 'victory-bahamut' : fanfare);
    },
  );

  it("keeps chapter 4's results screen silent, and only chapter 4's: a quiet cue of its own since 2026-10-12 (batch 2), but no pose, no tally flourish, no quips", () => {
    expect(CHAPTERS.filter((c) => c.music.victory === undefined).map((c) => c.id)).toEqual([]);
    expect(CHAPTERS.filter((c) => resultsScreenSilent(c)).map((c) => c.id)).toEqual(['ffx2-bahamut']);
    expect(resultsCueFor(CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!, 'victory')?.cue).toBe('victory-bahamut');
  });

  it('plays the FFX ending where the FFX story ends, as chapter 5 does for FFX-2', () => {
    const ffxEnd = CHAPTERS.find((c) => c.id === 'braskas-final-aeon')!;
    const ffx2End = CHAPTERS.find((c) => c.id === 'ffx2-vegnagun-shuyin')!;
    const cues = (chapter: (typeof CHAPTERS)[number]): Set<string> => {
      const found = new Set<string>();
      collectFromScript(chapter.scriptsRef.post, found);
      return found;
    };
    expect(cues(ffxEnd)).toContain('ending-ffx');
    expect(cues(ffx2End)).toContain('ending-ffx2');
  });
});
