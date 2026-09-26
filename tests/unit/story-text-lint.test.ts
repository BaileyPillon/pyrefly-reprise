/**
 * CHK-007 over every line the story layer can show, and CHK-021's FFX-2
 * speaker allow-list.
 *
 * Game case: both for the lint (the dialogue box is shared plumbing and prints
 * its text literally); FFX-2 only for the speaker allow-list (an FFX speaker in
 * an FFX-2 chapter is the rule-14 defect CHK-021 names).
 *
 * The thresholds program, batch 4 (`docs/plans/thresholds-program-2026-09-26.md`
 * §2): "lintScript or a unit test rejects `*`, `_`, `§`, `[`, file stems and raw
 * ids in every say, narrate and callout. Add an FFX-2 speaker allow-list test."
 */

import { describe, expect, it } from 'vitest';

import { lintScript, type ChapterScripts, type SpeakerId, type Step, type StoryScript } from '../../src/story/dsl.ts';
import { storyTextIssues } from '../../src/story/textLint.ts';
import { STORY_CHAPTERS, type ChapterKey } from '../../src/story/registry.ts';
import { CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

function flatten(script: StoryScript): Step[] {
  const out: Step[] = [];
  for (const step of script) {
    out.push(step);
    if (step.type === 'parallel') out.push(...flatten(step.steps));
    if (step.type === 'ifFlag') out.push(...flatten([...step.then, ...(step.else ?? [])]));
  }
  return out;
}

function scriptsOf(ch: ChapterScripts): Array<readonly [string, StoryScript]> {
  return [
    ['pre', ch.pre] as const,
    ['post', ch.post] as const,
    ...Object.entries(ch.midScripts).map(([id, s]) => [`mid:${id}`, s] as const),
  ];
}

/** Every chapter's story layer: the registry's, and whatever each listed or unlisted record carries. */
function everyChapter(): Array<readonly [string, ChapterScripts]> {
  const out: Array<readonly [string, ChapterScripts]> = Object.entries(STORY_CHAPTERS).map(([k, s]) => [k, s] as const);
  for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS]) {
    if (c.scriptsRef && !out.some(([, s]) => s === c.scriptsRef)) out.push([`${c.id} (record)`, c.scriptsRef]);
  }
  return out;
}

/** Every string the box, the choice menu or the victory tally can print. */
function shownText(ch: ChapterScripts): Array<readonly [string, string]> {
  const out: Array<readonly [string, string]> = [];
  for (const [where, script] of scriptsOf(ch)) {
    for (const step of flatten(script)) {
      if (step.type === 'say' || step.type === 'narrate') out.push([where, step.text]);
      if (step.type === 'choice') {
        if (step.prompt) out.push([where, step.prompt]);
        for (const o of step.options) out.push([where, o.label]);
      }
    }
  }
  for (const [who, quips] of Object.entries(ch.victoryQuips)) for (const q of quips) out.push([`quip:${who}`, q]);
  return out;
}

describe('story-text lint (CHK-007)', () => {
  it('rejects markup, citations, file stems and raw ids', () => {
    expect(storyTextIssues('I had the *better* half, dearie.')).not.toEqual([]);
    expect(storyTextIssues('See §9.2 for the beat.')).not.toEqual([]);
    expect(storyTextIssues('Load ffx2-leblanc first.')).not.toEqual([]);
    expect(storyTextIssues('It reads x2-leblanc-not-so-mighty-guard.')).not.toEqual([]);
    expect(storyTextIssues('The ormiActOne id.')).not.toEqual([]);
    expect(storyTextIssues('snake_case')).not.toEqual([]);
    expect(storyTextIssues('[ALBHED] Fryd?')).not.toEqual([]);
    expect(storyTextIssues('Open idle.png.')).not.toEqual([]);
  });

  it('passes ordinary English, hyphens and ellipses included', () => {
    for (const ok of [
      "That's for robbing our airship!",
      'Not-So-Mighty Guard, darlings. Do keep up.',
      'Dud sphere. Dud sphere. Dud— huh.',
      '...Okay. Round two.',
      'A thousand years. You get four minutes.',
      'Ormi + Dr. Goon + Fem-Goon',
    ]) {
      expect(storyTextIssues(ok), ok).toEqual([]);
    }
  });

  it('lintScript reports the same findings, so every story test that runs it enforces them', () => {
    const issues = lintScript([{ type: 'say', who: 'leblanc', text: 'I had the *better* half, dearie.' }]);
    expect(issues.map((i) => i.message).join(' ')).toMatch(/markup/);
  });

  it('no line in any chapter carries markup, a citation, a file stem or a raw id', () => {
    const bad: string[] = [];
    for (const [key, ch] of everyChapter()) {
      for (const [where, text] of shownText(ch)) {
        const issues = storyTextIssues(text);
        if (issues.length) bad.push(`${key} ${where}: "${text}" — ${issues.join('; ')}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

/**
 * Who may speak in an FFX-2 chapter (CHK-021).
 *
 * The FFX-2 cast, plus the one sourced exception: Chapter V's Farplane voices
 * (Braska, Auron, Jecht, `research/writing-bible.md` §3 E7 "the Farplane voice
 * system") and the fayth in the Glen coda (§3 E5-CODA, §1.23).
 */
const FFX2_SPEAKERS: ReadonlySet<SpeakerId> = new Set<SpeakerId>([
  'yuna-x2', 'rikku-x2', 'paine', 'brother-x2', 'buddy', 'shinra',
  'shuyin', 'lenne', 'nooj', 'baralai', 'gippal', 'leblanc', 'logos', 'ormi', 'trema', 'bahamut',
  'narrator', 'none',
]);
const FFX2_EXCEPTIONS: Partial<Record<ChapterKey, readonly SpeakerId[]>> = {
  'ffx2-vegnagun-shuyin': ['braska', 'auron', 'jecht', 'fayth-boy'],
};

describe('FFX-2 speaker allow-list (CHK-021)', () => {
  it('every FFX-2 chapter speaks only with FFX-2 speakers, plus its sourced exceptions', () => {
    const bad: string[] = [];
    let ffx2Chapters = 0;
    for (const [key, ch] of Object.entries(STORY_CHAPTERS) as Array<[ChapterKey, ChapterScripts]>) {
      if (getChapter(key)?.game !== 'ffx2') continue;
      ffx2Chapters++;
      const allowed = new Set<SpeakerId>([...FFX2_SPEAKERS, ...(FFX2_EXCEPTIONS[key] ?? [])]);
      for (const [where, script] of scriptsOf(ch)) {
        for (const step of flatten(script)) {
          if (step.type === 'say' && !allowed.has(step.who)) bad.push(`${key} ${where}: ${step.who}`);
        }
      }
    }
    expect(ffx2Chapters).toBeGreaterThanOrEqual(6);
    expect(bad).toEqual([]);
  });

  it('no FFX chapter speaks with an FFX-2-only speaker', () => {
    const x2Only: readonly SpeakerId[] = ['yuna-x2', 'rikku-x2', 'paine', 'brother-x2', 'buddy', 'shinra', 'shuyin', 'lenne', 'nooj', 'baralai', 'gippal', 'leblanc', 'logos', 'ormi', 'trema'];
    const bad: string[] = [];
    for (const [key, ch] of Object.entries(STORY_CHAPTERS) as Array<[ChapterKey, ChapterScripts]>) {
      if (getChapter(key)?.game !== 'ffx') continue;
      for (const [where, script] of scriptsOf(ch)) {
        for (const step of flatten(script)) {
          if (step.type === 'say' && x2Only.includes(step.who)) bad.push(`${key} ${where}: ${step.who}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
