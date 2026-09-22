/**
 * House-style and structural lint for the five chapters' cutscene scripts.
 *
 * These are the story agent's own guard rails [docs/CONTRACTS.md "Story
 * agents"]. They check the rules a reader cannot hold in their head:
 * `research/writing-bible.md` §2.1's 60-character line cap and ellipsis
 * discipline, `pre`/`post` markers, the mid-battle trigger wiring, and the two
 * chapter-specific rules the contract encodes (Chapter 4's suppressed
 * flourish, Chapter 5's scripted limb-pun Win lines).
 */

import { describe, expect, it } from 'vitest';

import type { ChapterScripts, Step, StoryScript } from '../../src/story/dsl.ts';
import { MAX_LINE_CHARS, MAX_QUIP_WORDS, lintScript } from '../../src/story/dsl.ts';

import { seymourFluxScripts } from '../../src/story/scripts/seymour-flux.ts';
import { yunalescaScripts } from '../../src/story/scripts/yunalesca.ts';
import { braskasFinalAeonScripts } from '../../src/story/scripts/braskas-final-aeon.ts';
import { ffx2BahamutScripts } from '../../src/story/scripts/ffx2-bahamut.ts';
import { ffx2VegnagunShuyinScripts } from '../../src/story/scripts/ffx2-vegnagun-shuyin.ts';
import { ffx2LeblancScripts } from '../../src/story/scripts/ffx2-leblanc.ts';
import { AI_EMITTED_TRIGGERS, type ChapterKey } from '../../src/story/registry.ts';

const CHAPTERS: ReadonlyArray<readonly [string, ChapterScripts]> = [
  ['seymour-flux', seymourFluxScripts],
  ['yunalesca', yunalescaScripts],
  ['braskas-final-aeon', braskasFinalAeonScripts],
  ['ffx2-bahamut', ffx2BahamutScripts],
  ['ffx2-vegnagun-shuyin', ffx2VegnagunShuyinScripts],
  ['ffx2-leblanc', ffx2LeblancScripts],
];

/** Every script a chapter owns: `pre`, `post` and each `midScripts` entry. */
function allScripts(chapter: ChapterScripts): Array<readonly [string, StoryScript]> {
  return [
    ['pre', chapter.pre] as const,
    ['post', chapter.post] as const,
    ...Object.entries(chapter.midScripts).map(([id, s]) => [`mid:${id}`, s] as const),
  ];
}

/** Flatten `parallel` and `ifFlag` so nested lines are linted too. */
function flatten(script: StoryScript): Step[] {
  const out: Step[] = [];
  for (const step of script) {
    out.push(step);
    if (step.type === 'parallel') out.push(...flatten(step.steps));
    if (step.type === 'ifFlag') {
      out.push(...flatten(step.then));
      if (step.else) out.push(...flatten(step.else));
    }
  }
  return out;
}

/** Every rendered string in a script: dialogue, narration and choice labels. */
function spokenText(script: StoryScript): Array<readonly [string, string]> {
  const out: Array<readonly [string, string]> = [];
  for (const step of flatten(script)) {
    if (step.type === 'say') out.push([step.who, step.text] as const);
    else if (step.type === 'narrate') out.push(['narrator', step.text] as const);
    else if (step.type === 'choice') {
      if (step.prompt !== undefined) out.push(['choice', step.prompt] as const);
      for (const opt of step.options) out.push(['choice', opt.label] as const);
    }
  }
  return out;
}

describe.each(CHAPTERS)('%s scripts', (id, chapter) => {
  it('passes lintScript() on every script it owns', () => {
    for (const [name, script] of allScripts(chapter)) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
    }
  });

  it('keeps every line inside the 60-character cap [writing-bible §2.1]', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(text.length, `${name} / ${who}: ${text}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });

  it('uses at most one ellipsis per line and never a space before one', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(text.split('...').length - 1, `${name} / ${who}: ${text}`).toBeLessThanOrEqual(1);
        expect(text.includes(' ...'), `${name} / ${who}: ${text}`).toBe(false);
      }
    }
  });

  it('ends `pre` with battleStart() and nothing after it', () => {
    const last = chapter.pre.at(-1);
    expect(last?.type).toBe('battleStart');
    expect(chapter.pre.filter((s) => s.type === 'battleStart')).toHaveLength(1);
  });

  it('contains exactly one results() in `post` and none anywhere else', () => {
    expect(chapter.post.filter((s) => s.type === 'results')).toHaveLength(1);
    expect(chapter.pre.some((s) => s.type === 'results')).toBe(false);
    for (const [, script] of Object.entries(chapter.midScripts)) {
      expect(script.some((s) => s.type === 'results' || s.type === 'battleStart')).toBe(false);
    }
  });

  it('wires every trigger to a script and every script to a trigger', () => {
    // A mid-battle script is reachable two ways: through a `MidBattleTrigger`,
    // or by an AI script emitting `script-trigger` with a name of its own and
    // no trigger at all. `src/story/registry.ts` owns the list of the second
    // kind, and `story-triggers.test.ts` checks the id/script/budget rules the
    // presenter actually depends on.
    const referenced = new Set<string>([
      ...chapter.mid.map((t) => t.script),
      ...AI_EMITTED_TRIGGERS[id as ChapterKey],
    ]);
    const defined = new Set(Object.keys(chapter.midScripts));
    for (const ref of referenced) expect(defined, `trigger -> ${ref}`).toContain(ref);
    for (const key of defined) expect(referenced, `script -> ${key}`).toContain(key);
  });

  it('gives every trigger a unique id', () => {
    const ids = chapter.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps victory quips to 10 words or fewer [writing-bible §5.4]', () => {
    for (const [who, quips] of Object.entries(chapter.victoryQuips)) {
      for (const quip of quips) {
        expect(quip.split(/\s+/).length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_QUIP_WORDS);
        expect(quip.length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });

  it('allocates real time to every reaction-shot beat [writing-bible §2.1]', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const step of flatten(script)) {
        if (step.type === 'wait') {
          expect(step.ms, `${name} wait`).toBeGreaterThanOrEqual(1200);
          expect(step.ms, `${name} wait`).toBeLessThanOrEqual(10000);
        }
      }
    }
  });
});

describe('chapter 4 — Bahamut suppresses the whole flourish [writing-bible §5.4]', () => {
  it('serves no victory quips', () => {
    expect(ffx2BahamutScripts.victoryQuips).toEqual({});
  });

  it('brings the results screen up silent', () => {
    const step = ffx2BahamutScripts.post.find((s) => s.type === 'results');
    expect(step).toBeDefined();
    expect(step?.type === 'results' && step.silent).toBe(true);
  });

  it('never names Shuyin, Lenne or the fayth [writing-bible §3 E6]', () => {
    const forbidden = /shuyin|lenne|fayth/i;
    for (const [, script] of allScripts(ffx2BahamutScripts)) {
      for (const [who, text] of spokenText(script)) {
        expect(forbidden.test(text), `${who}: ${text}`).toBe(false);
        expect(forbidden.test(who)).toBe(false);
      }
    }
  });
});

describe('chapter 1 — the five load-bearing E1 beats [writing-bible §6]', () => {
  const pre = spokenText(seymourFluxScripts.pre).map(([, t]) => t).join(' | ');
  const post = spokenText(seymourFluxScripts.post).map(([, t]) => t).join(' | ');

  it('keeps the Jecht-is-Sin reveal and the bargain in the pre-battle', () => {
    expect(pre).toContain('Your father is Sin.');
    expect(pre).toMatch(/free him|your father back/i);
  });

  it('tells Yuna after the fight, and reaches the fayth', () => {
    expect(post).toContain('Sin is Jecht.');
    expect(post).toMatch(/dream/i);
  });
});

describe('chapter 5 — the limb-pun Win lines are scripted, not sampled', () => {
  it('fires one scripted beat per Vegnagun part, in order', () => {
    const parts = ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head'];
    const kos = ffx2VegnagunShuyinScripts.mid
      .filter((t) => t.when.type === 'ko')
      .map((t) => (t.when.type === 'ko' ? t.when.who : ''));
    expect(kos).toEqual(parts);
  });

  it('opens its battles with the black-hole transition [visual-bible §1.18]', () => {
    const start = ffx2VegnagunShuyinScripts.pre.at(-1);
    expect(start?.type === 'battleStart' && start.transition).toBe('blackhole');
  });
});
