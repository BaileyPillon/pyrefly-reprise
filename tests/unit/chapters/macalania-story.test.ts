/**
 * Chapter 6 (Macalania) — the story script's own guard rails.
 *
 * The shipped five are covered by `tests/unit/story-scripts.test.ts`, but that
 * file's `describe.each` list and its `AI_EMITTED_TRIGGERS` lookup are
 * integrator-owned [docs/plans/chapter-macalania-review.md §8.1], so this
 * chapter carries its own copy of the checks until it is registered. The
 * integrator should add `['seymour-anima-macalania', seymourAnimaMacalaniaScripts]`
 * to that file's `CHAPTERS` list and an empty `AI_EMITTED_TRIGGERS` entry in
 * the same commit as `src/data/encounters.ts`; the duplicated cases below can
 * then be deleted, but the three canon-order cases cannot — they are this
 * chapter's own.
 *
 * Game case: **FFX only** (hard rule 14). "names no FFX-2 speaker" is the
 * absence test.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { ChapterScripts, Step, StoryScript } from '../../../src/story/dsl.ts';
import { MAX_LINE_CHARS, MAX_QUIP_WORDS, lintScript } from '../../../src/story/dsl.ts';
import { seymourAnimaMacalaniaScripts } from '../../../src/story/scripts/seymour-anima-macalania.ts';

const chapter: ChapterScripts = seymourAnimaMacalaniaScripts;

/**
 * Every member of the `SpeakerId` union, read out of `src/story/dsl.ts` itself.
 * `SpeakerId` is a type, so `tsc` already rejects an unknown id — but this
 * chapter's speakers are also a **casting** claim ("only speakers present in
 * the scene"), and reading the union keeps the two in one place. If the union
 * is ever reshaped, this test fails loudly rather than silently passing.
 */
function speakerUnion(): Set<string> {
  const dsl = readFileSync(
    fileURLToPath(new URL('../../../src/story/dsl.ts', import.meta.url)),
    'utf8',
  );
  const start = dsl.indexOf('export type SpeakerId =');
  expect(start, 'SpeakerId union not found in dsl.ts').toBeGreaterThan(-1);
  const end = dsl.indexOf(';', dsl.indexOf("| 'none'", start));
  const block = dsl.slice(start, end);
  const ids = [...block.matchAll(/\|\s*'([a-z0-9-]+)'/g)].map((m) => m[1] as string);
  expect(ids.length, 'SpeakerId union parsed as empty').toBeGreaterThan(10);
  return new Set(ids);
}

/** Flatten `parallel` and `ifFlag` so nested steps are checked too. */
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

/** Every rendered string: dialogue, narration and choice labels. */
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

function allScripts(c: ChapterScripts): Array<readonly [string, StoryScript]> {
  return [
    ['pre', c.pre] as const,
    ['post', c.post] as const,
    ...Object.entries(c.midScripts).map(([id, s]) => [`mid:${id}`, s] as const),
  ];
}

/** Concatenated dialogue of one script, in order, for order assertions. */
function joined(script: StoryScript): string {
  return spokenText(script)
    .map(([, t]) => t)
    .join(' | ');
}

/** Index of the first line matching `re`, or -1. */
function at(script: StoryScript, re: RegExp): number {
  return spokenText(script).findIndex(([, t]) => re.test(t));
}

// ---------------------------------------------------------------------------
// 1. Speakers
// ---------------------------------------------------------------------------

describe('macalania story — speakers', () => {
  it('uses only ids that exist in the SpeakerId union', () => {
    const union = speakerUnion();
    for (const [name, script] of allScripts(chapter)) {
      for (const [who] of spokenText(script)) {
        expect(union.has(who), `${name}: unknown speaker "${who}"`).toBe(true);
      }
    }
  });

  it('casts only characters present in the antechamber [§9.6, §9.7]', () => {
    // Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku, Seymour — plus
    // `narrator` (Tidus retrospective) and `none` (Tromell, who has no
    // portrait and therefore no name plate; see the script header).
    const cast = new Set([
      'tidus',
      'yuna',
      'auron',
      'wakka',
      'lulu',
      'kimahri',
      'rikku',
      'seymour',
      'narrator',
      'none',
    ]);
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(cast.has(who), `${name}: "${who}" is not in this scene — ${text}`).toBe(true);
      }
    }
  });

  it('names no FFX-2 speaker or character [hard rule 14 — FFX only]', () => {
    const forbidden = /shuyin|lenne|paine|gullwing|vegnagun|leblanc|baralai|gippal|nooj/i;
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(forbidden.test(text), `${name} / ${who}: ${text}`).toBe(false);
        expect(forbidden.test(who), `${name}: ${who}`).toBe(false);
      }
    }
    for (const id of Object.keys(chapter.victoryQuips)) {
      expect(forbidden.test(id), id).toBe(false);
    }
  });

  it('gives Kimahri no more than three lines in a scene [writing-bible §1.7]', () => {
    for (const [name, script] of allScripts(chapter)) {
      const lines = spokenText(script).filter(([who]) => who === 'kimahri');
      expect(lines.length, `${name}: Kimahri has ${lines.length} lines`).toBeLessThanOrEqual(3);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. The dialogue card
// ---------------------------------------------------------------------------

describe('macalania story — lines fit the dialogue card', () => {
  it('passes lintScript() on every script it owns', () => {
    for (const [name, script] of allScripts(chapter)) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
    }
  });

  it('keeps every line inside the 60-character cap [writing-bible §2.1]', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(text.length, `${name} / ${who} (${text.length}): ${text}`).toBeLessThanOrEqual(
          MAX_LINE_CHARS,
        );
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

  it('keeps victory quips to 10 words and 60 characters [writing-bible §5.4]', () => {
    for (const [who, quips] of Object.entries(chapter.victoryQuips)) {
      expect(quips.length, `${who} has no quips`).toBeGreaterThan(0);
      for (const quip of quips) {
        expect(quip.split(/\s+/).length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_QUIP_WORDS);
        expect(quip.length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });

  it('allocates real time to every reaction-shot beat [writing-bible §2.1]', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const step of flatten(script)) {
        if (step.type !== 'wait') continue;
        expect(step.ms, `${name} wait`).toBeGreaterThanOrEqual(1200);
        expect(step.ms, `${name} wait`).toBeLessThanOrEqual(10000);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Structure
// ---------------------------------------------------------------------------

describe('macalania story — structure', () => {
  it('ends `pre` with battleStart() and nothing after it', () => {
    expect(chapter.pre.at(-1)?.type).toBe('battleStart');
    expect(chapter.pre.filter((s) => s.type === 'battleStart')).toHaveLength(1);
  });

  it('contains exactly one results() in `post` and none anywhere else', () => {
    expect(chapter.post.filter((s) => s.type === 'results')).toHaveLength(1);
    expect(chapter.pre.some((s) => s.type === 'results')).toBe(false);
    for (const script of Object.values(chapter.midScripts)) {
      expect(script.some((s) => s.type === 'results' || s.type === 'battleStart')).toBe(false);
    }
  });

  it('brings the results screen up with its flourish (this is not Chapter 4)', () => {
    const step = chapter.post.find((s) => s.type === 'results');
    expect(step?.type === 'results' && step.silent).toBeFalsy();
  });

  it('wires every trigger to a script and every script to a trigger', () => {
    const referenced = new Set(chapter.mid.map((t) => t.script));
    const defined = new Set(Object.keys(chapter.midScripts));
    expect([...referenced].sort()).toEqual([...defined].sort());
  });

  it('gives every trigger id === script and a unique id [registry.ts rule 1]', () => {
    for (const t of chapter.mid) expect(t.id, `trigger ${t.id}`).toBe(t.script);
    const ids = chapter.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every mid-battle line an explicit auto [registry.ts rule 2]', () => {
    for (const [id, script] of Object.entries(chapter.midScripts)) {
      for (const step of flatten(script)) {
        if (step.type !== 'say' && step.type !== 'narrate') continue;
        expect(step.auto, `mid:${id} — "${step.text}" has no auto`).toBeGreaterThan(0);
      }
    }
  });

  it('references only this chapter’s combatant ids in its triggers', () => {
    const known = new Set(['seymour-macalania', 'anima-macalania']);
    for (const t of chapter.mid) {
      if ('who' in t.when && typeof t.when.who === 'string') {
        expect(known.has(t.when.who), `${t.id} -> ${t.when.who}`).toBe(true);
      }
    }
  });

  it('names the preflight’s cue ids and routes nothing itself [plan §6.3]', () => {
    const tracks = chapter.pre
      .filter((s) => s.type === 'music')
      .map((s) => (s.type === 'music' ? s.track : null));
    expect(tracks).toEqual(['scene-macalania-temple', 'boss-seymour-macalania']);
    // `post` stops the music and lets the results screen own the fanfare.
    const postTracks = chapter.post
      .filter((s) => s.type === 'music')
      .map((s) => (s.type === 'music' ? s.track : 'x'));
    expect(postTracks).toEqual([null]);
  });
});

// ---------------------------------------------------------------------------
// 4. The beats, in canon order
// ---------------------------------------------------------------------------

describe('macalania story — canon beats in order', () => {
  it('runs the pre-battle beats in §9.6 order (4 -> 3 -> 5 -> 6 -> 7)', () => {
    const pre = chapter.pre;
    const gifts = at(pre, /Tromell gave us armor/);
    const sphere = at(pre, /watched the sphere/);
    const accusation = at(pre, /You killed your father/);
    const confession = at(pre, /In the spring/);
    const deduction = at(pre, /alone in a room with me/);
    const yunaArrives = at(pre, /Maester Seymour/);
    const turn = at(pre, /You came here to kill me/);
    const order = [gifts, sphere, accusation, confession, deduction, yunaArrives, turn];
    for (const [i, idx] of order.entries()) expect(idx, `beat ${i} missing`).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('keeps the patricide undenied and explained, not confessed under pressure', () => {
    const pre = joined(chapter.pre);
    expect(pre).toMatch(/You killed your father/);
    expect(pre).toMatch(/I would not let him leave like that/);
  });

  it('plays the "Yes." beat exactly once, unqualified, in the whole chapter', () => {
    const all = allScripts(chapter).flatMap(([, s]) => spokenText(s));
    const yeses = all.filter(([who, text]) => who === 'yuna' && text === 'Yes.');
    expect(yeses).toHaveLength(1);
    // It answers "You came here to kill me." and nothing follows it from her.
    const pre = spokenText(chapter.pre);
    const i = pre.findIndex(([who, t]) => who === 'yuna' && t === 'Yes.');
    expect(pre[i - 1]?.[1]).toMatch(/kill me/);
    // Climax rule: cut away within two lines [writing-bible §2.1].
    expect(pre.slice(i + 1, i + 3).some(([who]) => who === 'auron' || who === 'seymour')).toBe(true);
  });

  it('fires the three mid beats in act order: summon, Boost, restore', () => {
    expect(chapter.mid.map((t) => t.id)).toEqual([
      'mac-anima-summon',
      'mac-first-boost',
      'mac-seymour-restored',
    ]);
    // Act one -> two at 3,000 of 6,000 [§5.2].
    const summon = chapter.mid[0]!.when;
    expect(summon.type === 'hp-below' && summon.fraction).toBe(0.5);
    // Act two -> three when Anima reaches 0; she is removed, not KO'd, so
    // `hp-below` at 0 is the only hook that fires.
    const restore = chapter.mid[2]!.when;
    expect(restore.type === 'hp-below' && restore.fraction).toBe(0);
  });

  it('names the aeon only as "an aeon" — Yuna does not own Anima yet [§8.4]', () => {
    const all = allScripts(chapter)
      .flatMap(([, s]) => spokenText(s))
      .map(([, t]) => t)
      .join(' | ');
    expect(all).not.toMatch(/\bAnima\b/);
    expect(joined(chapter.midScripts['mac-anima-summon']!)).toMatch(/an aeon/i);
  });

  it('runs the post-battle beats in §9.7 order (9 -> 10 -> sphere -> 11 -> 12)', () => {
    const post = chapter.post;
    const dead = at(post, /That's it\?/);
    const sending = at(post, /Step away from Lord Seymour/);
    const refused = at(post, /He has to be sent/);
    const sphere = at(post, /This was never yours/);
    const proof = at(post, /destroyed the only proof/);
    const unsent = at(post, /didn't send him/);
    const flee = at(post, /Do not stop on the lake/);
    const order = [dead, sending, refused, sphere, proof, unsent, flee];
    for (const [i, idx] of order.entries()) expect(idx, `beat ${i} missing`).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('places the narration interlude last, past tense, 2-5 lines [§1.2]', () => {
    const narr = chapter.post.filter((s) => s.type === 'narrate');
    expect(narr.length).toBeGreaterThanOrEqual(2);
    expect(narr.length).toBeLessThanOrEqual(5);
    const firstNarr = chapter.post.findIndex((s) => s.type === 'narrate');
    const lastSay = chapter.post.map((s) => s.type).lastIndexOf('say');
    expect(firstNarr).toBeGreaterThan(lastSay);
  });

  it('ends on the chapter thesis: won cleanly, lost completely [§9.7]', () => {
    const post = joined(chapter.post);
    expect(post).toMatch(/We won that fight/);
    expect(post).toMatch(/took the body, the sphere and our names/);
  });
});
