/**
 * Chapter X (Seymour Natus) story: the scripts are the draft Bailey's picks follow
 * (`docs/plans/natus-story-draft.md`, lines 1 to 29), line for line and in order, in the house
 * style; the pre scene ends on the battle, the post scene on the results; the registered record
 * plays them. Our words only (AGENTS.md rule 8): the draft marks every line `[ORIGINAL]`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript, type Step } from '../../../src/story/dsl.ts';
import { seymourNatusScripts } from '../../../src/story/scripts/seymour-natus.ts';
import { cutsceneFigure, figuresIn } from '../../../src/app/screens/cutsceneFigures.ts';

const { pre, post } = seymourNatusScripts;

/** The draft's numbered rows: `| n | Speaker | "line" |`. */
function draftLines(): { n: number; speaker: string; text: string }[] {
  const md = readFileSync(new URL('../../../docs/plans/natus-story-draft.md', import.meta.url), 'utf8');
  const rows = [...md.matchAll(/^\| (\d+) \| ([^|]+?) \| "(.+)" \|\s*$/gm)];
  return rows.map((m) => ({ n: Number(m[1]), speaker: m[2]!.trim(), text: m[3]! }));
}

/** Every spoken or narrated line in the two scenes, in order. */
function scriptLines(steps: readonly Step[]): { speaker: string; text: string }[] {
  return steps.flatMap((s) => {
    if (s.type === 'narrate') return [{ speaker: 'narr', text: s.text }];
    if (s.type === 'say') return [{ speaker: s.who, text: s.text }];
    return [];
  });
}

describe('the draft, line for line', () => {
  it('29 lines, the same text in the same order, narration where the draft narrates', () => {
    const draft = draftLines();
    expect(draft.map((d) => d.n)).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
    const played = scriptLines([...pre, ...post]);
    expect(played.map((l) => l.text)).toEqual(draft.map((d) => d.text));
    played.forEach((l, i) => {
      const narrated = draft[i]!.speaker.includes('(narr.)');
      expect(l.speaker === 'narr', `line ${i + 1}`).toBe(narrated);
    });
  });

  it('Seymour speaks only through the approved Macalania portrait (B12: he has no line after he transforms)', () => {
    const lines = scriptLines(pre);
    const seymour = lines.filter((l) => l.speaker.startsWith('seymour'));
    expect(seymour.length).toBe(4);
    expect(seymour.every((l) => l.speaker === 'seymour-macalania')).toBe(true);
    const shown = pre.findIndex((s) => s.type === 'showActor');
    const afterShown = scriptLines(pre.slice(shown));
    expect(afterShown.some((l) => l.speaker.startsWith('seymour'))).toBe(false);
  });

  it('house style: every line passes the lint (60 characters, no banned words)', () => {
    expect(lintScript(pre)).toEqual([]);
    expect(lintScript(post)).toEqual([]);
  });
});

describe('the scenes', () => {
  it('the pre scene ends on the battle and the post scene on the results', () => {
    expect(pre.at(-1)?.type).toBe('battleStart');
    expect(post.at(-1)?.type).toBe('results');
    expect(pre.filter((s) => s.type === 'battleStart')).toHaveLength(1);
  });

  it('Natus stands up on the cutscene stage from his installed idle, once, in the pre scene', () => {
    expect(figuresIn(pre)).toEqual(['seymour-natus']);
    expect(figuresIn(post)).toEqual([]);
    expect(cutsceneFigure('seymour-natus')?.art).toBe('art/characters/seymour-natus/idle.png');
  });

  it('no mid-battle callouts and no victory quips yet (B9 held for Bailey\'s read; grim tier)', () => {
    expect(seymourNatusScripts.mid).toEqual([]);
    expect(seymourNatusScripts.midScripts).toEqual({});
    expect(seymourNatusScripts.victoryQuips).toEqual({});
  });

  it('the registered chapter plays these scripts', () => {
    expect(getChapter('seymour-natus')?.scriptsRef).toBe(seymourNatusScripts);
  });
});
