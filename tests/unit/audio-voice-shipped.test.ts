/**
 * The shipped voice folder (`public/audio/voice/`) against the game: every manifest line is a line the game can say, in the right
 * chapter, by the right voice; every line of the FFX pass is recorded or listed as muted; the voiced mid-battle beats fit (or are
 * extended by the documented policy); the folder is inside its budget. It runs only once recordings are installed
 * (`node tools/audio/voice-ship.mjs --install`); until then the voice is absent and there is nothing to check but that no FFX-2
 * chapter has any (`voice-chapter-wiring.test.ts`). Game case: FFX only for the recordings.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../src/data/encounters.ts';
import {
  CHAPTER_KEYS, MID_LINE_HOLD_MS, STORY_CHAPTERS, budgetFor, scriptDurationMs, SEAM_BUDGET_MS,
} from '../../src/story/registry.ts';
import type { SayStep, Step } from '../../src/story/dsl.ts';
import { beatVerdict } from '../../src/story/voice/voiceBudget.ts';
import { lineKey } from '../../src/story/voice/voiceKey.ts';
import { parseChapterVoiceManifest } from '../../src/story/voice/voiceManifest.ts';
import { VOICE_TAIL_MS } from '../../src/story/voice/voicePort.ts';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import { auditVoiceDir } from '../../tools/audio/voice-audit.mjs';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as V from '../../tools/audio/voice-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VOICE_DIR = path.join(ROOT, 'public/audio/voice');
const present = existsSync(path.join(VOICE_DIR, 'index.json'));
const inventory = JSON.parse(readFileSync(path.join(ROOT, 'docs/audio/voice-line-inventory.json'), 'utf8'));

/** Every (speaker, text) a chapter's scripts can put in the box: say, narrate, authored stand-ins, victory quips. */
function sayable(chapter: (typeof CHAPTER_KEYS)[number]): Set<string> {
  const keys = new Set<string>();
  const story = STORY_CHAPTERS[chapter];
  const walk = (steps: readonly Step[]): void => {
    for (const s of steps) {
      if (s.type === 'say') {
        keys.add(lineKey(s.who, s.text));
        for (const alt of s.fallback ?? []) keys.add(lineKey(alt.who, alt.text ?? s.text));
      } else if (s.type === 'narrate') keys.add(lineKey('narrator', s.text));
      else if (s.type === 'parallel') walk(s.steps);
      else if (s.type === 'ifFlag') { walk(s.then); walk(s.else ?? []); }
    }
  };
  walk(story.pre);
  walk(story.post);
  for (const script of Object.values(story.midScripts)) walk(script);
  for (const [member, bank] of Object.entries(story.victoryQuips)) for (const text of bank) keys.add(lineKey(member, text));
  return keys;
}

describe.skipIf(!present)('the installed voice', () => {
  const report = present ? JSON.parse(readFileSync(path.join(ROOT, 'docs/audio/voice-ffx-ship-report.json'), 'utf8')) : null;
  const manifests = present
    ? readdirSync(VOICE_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => [f.slice(0, -5), JSON.parse(readFileSync(path.join(VOICE_DIR, f), 'utf8'))] as const)
    : [];

  it('is a clean folder: every file named, every size right, inside the voice budget', () => {
    expect(auditVoiceDir(VOICE_DIR).problems).toEqual([]);
  });

  it('has manifests for FFX chapters only, each parsing as the game reads it', () => {
    expect(manifests.length).toBeGreaterThan(0);
    for (const [chapter, raw] of manifests) {
      expect(getChapter(chapter)?.game, chapter).toBe('ffx');
      expect(parseChapterVoiceManifest(raw, chapter), chapter).not.toBeNull();
    }
  });

  it('names only lines the game can say, by the speaker the entry says, and only the picked voices', () => {
    const picked = new Set(V.FFX_VOICES as string[]);
    for (const [chapter, raw] of manifests) {
      const can = sayable(chapter as (typeof CHAPTER_KEYS)[number]);
      for (const [key, entry] of Object.entries(raw.lines as Record<string, { id: string; who: string }>)) {
        expect(can.has(key), `${chapter}: ${entry.id} (${key}) is not a line this chapter can say any more: record it again or retire it`).toBe(true);
        expect(picked.has(entry.who), `${entry.id} is spoken by ${entry.who}, whose voice is not picked`).toBe(true);
      }
    }
  });

  it('has a recording for every line of the pass, except the ones the report lists as muted or missing', () => {
    const selected = V.selectLines(inventory) as Array<{ id: string; chapter: string; textHash: string }>;
    const { recordingOf } = V.planRecordings(selected) as { recordingOf: Map<string, string> };
    const left = new Set<string>([...report.muted, ...report.missing]);
    const byChapter = new Map(manifests);
    const absent = selected.filter((l) => !left.has(recordingOf.get(l.id) as string) && !byChapter.get(l.chapter)?.lines?.[l.textHash]).map((l) => l.id);
    expect(absent, `lines of the pass with no recording and no note: ${absent.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('keeps every voiced mid-battle beat inside its budget, or extended by the documented allowance, never over', () => {
    const extended: string[] = [];
    for (const [chapter, raw] of manifests) {
      const lines = raw.lines as Record<string, { ms: number }>;
      const spoken = (step: SayStep | { type: 'narrate'; text: string }): number => {
        const alts = [step, ...(step.type === 'say' ? (step.fallback ?? []).map((a) => ({ ...step, who: a.who, text: a.text ?? step.text })) : [])];
        return Math.max(0, ...alts.map((s) => { const e = lines[lineKey(s.type === 'say' ? s.who : 'narrator', s.text)]; return e ? e.ms + VOICE_TAIL_MS : 0; }));
      };
      for (const [name, script] of Object.entries(STORY_CHAPTERS[chapter as (typeof CHAPTER_KEYS)[number]].midScripts)) {
        const voiced = scriptDurationMs(script, MID_LINE_HOLD_MS, spoken);
        const budget = budgetFor(chapter as (typeof CHAPTER_KEYS)[number], name);
        const verdict = beatVerdict(voiced, budget, budget === SEAM_BUDGET_MS);
        expect(verdict, `${chapter}.mid-${name}: ${Math.round(voiced)} ms voiced against ${budget} ms`).not.toBe('over');
        if (verdict === 'extended') extended.push(`${chapter}.mid-${name}`);
      }
    }
    // the report names the same beats, so a re-record that changes a beat's verdict is a visible diff
    expect(extended.sort()).toEqual(((report.beats as Array<{ id: string; verdict: string }>).filter((b) => b.verdict === 'extended').map((b) => b.id)).sort());
  });
});

describe('before any recording is installed', () => {
  it('the game plays exactly as it did: no voice folder means no voice, not an error', () => {
    if (present) return;
    expect(existsSync(VOICE_DIR)).toBe(false);
    expect(auditVoiceDir(VOICE_DIR)).toMatchObject({ present: false, problems: [] });
  });
});
