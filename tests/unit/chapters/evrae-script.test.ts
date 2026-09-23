/**
 * The Evrae chapter's story script — house style, cast, beats and wiring.
 *
 * **Game case: FFX only** [AGENTS.md rule 14], same case and same reasoning as
 * `docs/handoff/chapter-evrae-engine.md`: the encounter has no FFX-2
 * counterpart (`research/ffx-evrae-airship.md` §0.4), so no FFX-2 speaker, no
 * FFX-2 ability id and no FFX-2 chapter may appear in it. The last describe
 * block is the absence test.
 *
 * The script is not registered anywhere yet — `src/story/registry.ts` is the
 * integrator's file — so `tests/unit/story-scripts.test.ts` does not see it and
 * these are its guard rails until it is.
 */

import { describe, expect, it } from 'vitest';

import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MAX_LINE_CHARS, MAX_QUIP_WORDS, lintScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, midBattleDeadlineMs } from '../../../src/story/registry.ts';
import { evraeAirshipScripts } from '../../../src/story/scripts/evrae-airship.ts';
import { EVRAE_ABILITIES } from '../../../src/data/ffx/enemies/evrae-abilities.ts';
import { CID_ID, EVRAE_ID } from '../../../src/data/ffx/enemies/evrae.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';

const chapter = evraeAirshipScripts;

/**
 * Who is on the deck [`research/ffx-evrae-airship.md` §9.1, §12.4]: the six
 * guardians, plus Cid and Brother over the comms. **Yuna is in Bevelle** and
 * Seymour is beside her, so neither may speak here — that is the chapter.
 * `narrator` is Tidus's retrospective register and is always allowed.
 */
const PRESENT = new Set([
  'tidus',
  'wakka',
  'lulu',
  'kimahri',
  'auron',
  'rikku',
  'cid',
  'brother',
  'narrator',
  'none',
]);

/** Nobody in this set is on the *Fahrenheit* when this chapter plays. */
const ABSENT = ['yuna', 'seymour', 'yunalesca', 'jecht', 'braska', 'yu-yevon'];

function allScripts(): Array<readonly [string, StoryScript]> {
  return [
    ['pre', chapter.pre] as const,
    ['post', chapter.post] as const,
    ...Object.entries(chapter.midScripts).map(([id, s]) => [`mid:${id}`, s] as const),
  ];
}

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

/** Every rendered string, tagged with its speaker. */
function spoken(script: StoryScript): Array<readonly [string, string]> {
  const out: Array<readonly [string, string]> = [];
  for (const step of flatten(script)) {
    if (step.type === 'say') out.push([step.who, step.text] as const);
    else if (step.type === 'narrate') out.push(['narrator', step.text] as const);
    else if (step.type === 'choice') {
      for (const o of step.options) out.push(['choice', o.label] as const);
    }
  }
  return out;
}

/** Concatenation of every line in the chapter, for order assertions. */
function allLines(script: StoryScript): string[] {
  return spoken(script).map(([, text]) => text);
}

/** Index of the first line containing `needle`, or -1. */
function lineIndex(lines: string[], needle: string): number {
  return lines.findIndex((l) => l.toLowerCase().includes(needle.toLowerCase()));
}

describe('Evrae script — house style [writing-bible §2.1]', () => {
  for (const [name, script] of allScripts()) {
    it(`${name}: every line fits the dialogue card`, () => {
      for (const [who, text] of spoken(script)) {
        expect(text.length, `${name} / ${who}: ${text}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    });

    it(`${name}: at most one ellipsis per line, never a space before it`, () => {
      expect(lintScript(script)).toEqual([]);
      for (const [who, text] of spoken(script)) {
        expect(text.split('...').length - 1, `${name} / ${who}: ${text}`).toBeLessThanOrEqual(1);
        expect(text.includes(' ...'), `${name} / ${who}: ${text}`).toBe(false);
      }
    });
  }

  it('victory quips are short enough and few enough words', () => {
    for (const [who, quips] of Object.entries(chapter.victoryQuips)) {
      expect(quips.length, who).toBeGreaterThan(0);
      for (const quip of quips) {
        expect(quip.split(/\s+/).length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_QUIP_WORDS);
        expect(quip.length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });
});

describe('Evrae script — only speakers who are on the deck', () => {
  it('every speaker id is one of the people present [§9.1]', () => {
    for (const [name, script] of allScripts()) {
      for (const [who] of spoken(script)) {
        if (who === 'choice') continue;
        expect(PRESENT.has(who), `${name}: "${who}" is not on the Fahrenheit`).toBe(true);
      }
    }
  });

  it('Yuna and Seymour never speak — her absence is the chapter [§9.1]', () => {
    const everyWho = allScripts().flatMap(([, s]) => spoken(s).map(([who]) => who));
    for (const who of ABSENT) expect(everyWho).not.toContain(who);
  });

  it('every guardian who speaks is actually in the party build', () => {
    const members = new Set(fahrenheitBuild.members.map((m) => m.id));
    const crew = new Set(['cid', 'brother', 'narrator', 'none']);
    for (const [, script] of allScripts()) {
      for (const [who] of spoken(script)) {
        if (who === 'choice' || crew.has(who)) continue;
        expect(members.has(who), `${who} is not in fahrenheitBuild`).toBe(true);
      }
    }
  });

  it('every victory quip is keyed to a real party member', () => {
    const members = new Set(fahrenheitBuild.members.map((m) => m.id));
    for (const who of Object.keys(chapter.victoryQuips)) {
      expect(members.has(who), `quip owner ${who}`).toBe(true);
    }
    // Yuna is not in this build, so she cannot have a Win line here.
    expect(Object.keys(chapter.victoryQuips)).not.toContain('yuna');
  });
});

describe('Evrae script — the beats appear in canon order [preflight §7]', () => {
  const pre = allLines(chapter.pre);
  const post = allLines(chapter.post);

  it('pre: ship → Bevelle found → the thesis → the city → the guard → Auron → Cid', () => {
    const ship = lineIndex(pre, 'thousand years under the sea');
    const found = lineIndex(pre, 'Bevelle! They are marrying');
    const thesis = lineIndex(pre, 'can heal anything');
    const city = lineIndex(pre, 'built that on purpose');
    const guard = lineIndex(pre, 'already up here');
    const named = lineIndex(pre, 'dog on the step');
    const tutorial = lineIndex(pre, 'move this ship, or I can shoot');
    for (const [label, i] of Object.entries({ ship, found, thesis, city, guard, named, tutorial })) {
      expect(i, `beat "${label}" is missing`).toBeGreaterThanOrEqual(0);
    }
    expect([ship, found, thesis, city, guard, named, tutorial]).toEqual(
      [ship, found, thesis, city, guard, named, tutorial].slice().sort((a, b) => a - b),
    );
  });

  it('pre ends with battleStart and nothing after it [docs/CONTRACTS.md]', () => {
    const last = chapter.pre[chapter.pre.length - 1];
    expect(last?.type).toBe('battleStart');
    expect(chapter.pre.filter((s) => s.type === 'battleStart')).toHaveLength(1);
  });

  it('post: results → it falls → the guns → the chains → the wedding', () => {
    const resultsAt = chapter.post.findIndex((s) => s.type === 'results');
    expect(resultsAt).toBeGreaterThanOrEqual(0);
    const falls = lineIndex(post, 'just... dropped');
    const guns = lineIndex(post, 'city shooting at us');
    const chains = lineIndex(post, 'over the roof');
    const wedding = lineIndex(post, 'ringing its bells');
    for (const [label, i] of Object.entries({ falls, guns, chains, wedding })) {
      expect(i, `beat "${label}" is missing`).toBeGreaterThanOrEqual(0);
    }
    expect([falls, guns, chains, wedding]).toEqual([falls, guns, chains, wedding].slice().sort((a, b) => a - b));
  });

  it('the results card is not silent — Chapter 4 is the only silent one [§5.4]', () => {
    const step = chapter.post.find((s) => s.type === 'results');
    expect(step && step.type === 'results' ? step.silent : undefined).toBeUndefined();
  });

  it('the wedding is narration, not dialogue — nobody in that room is present', () => {
    const tail = chapter.post.slice(chapter.post.findIndex((s) => s.type === 'fade' && s.to === 'black'));
    expect(tail.filter((s) => s.type === 'narrate').length).toBeGreaterThanOrEqual(3);
    expect(tail.filter((s) => s.type === 'say')).toHaveLength(0);
  });
});

describe('Evrae script — mid-battle wiring [src/story/registry.ts]', () => {
  it('id === script, and every trigger resolves to a registered mid script', () => {
    for (const trigger of chapter.mid) {
      expect(trigger.script, `trigger ${trigger.id}`).toBe(trigger.id);
      expect(chapter.midScripts[trigger.id], `no script for ${trigger.id}`).toBeDefined();
    }
  });

  it('no mid script is unreachable', () => {
    const wired = new Set(chapter.mid.map((t) => t.id));
    for (const name of Object.keys(chapter.midScripts)) {
      expect(wired.has(name), `${name} has no trigger`).toBe(true);
    }
  });

  it('every say in a mid script carries an explicit auto', () => {
    for (const [name, script] of Object.entries(chapter.midScripts)) {
      for (const step of flatten(script)) {
        if (step.type === 'say') expect(step.auto, `${name}: ${step.text}`).toBeGreaterThan(0);
      }
    }
  });

  it('every mid script fits the presenter budget', () => {
    for (const [name, script] of Object.entries(chapter.midScripts)) {
      expect(midBattleDeadlineMs(script), name).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    }
  });

  it('every trigger names a combatant and an ability the chapter actually has', () => {
    const combatants = new Set<string>([
      EVRAE_ID,
      CID_ID,
      ...fahrenheitBuild.members.map((m) => m.id),
    ]);
    for (const trigger of chapter.mid) {
      const when = trigger.when;
      if ('who' in when && when.who) {
        expect(combatants.has(when.who), `${trigger.id}: unknown combatant ${when.who}`).toBe(true);
      }
      if (when.type === 'ability-used') {
        expect(EVRAE_ABILITIES[when.ability], `${trigger.id}: unknown ability ${when.ability}`).toBeDefined();
      }
    }
  });

  it('the phase-2 beat fires at the Haste threshold, 1/3 of 32,000 HP', () => {
    const phase = chapter.mid.find((t) => t.id === 'evrae-haste-phase');
    expect(phase?.when.type).toBe('hp-below');
    if (phase?.when.type === 'hp-below') {
      expect(phase.when.fraction).toBeCloseTo(1 / 3, 5);
      expect(Math.floor(32_000 * phase.when.fraction)).toBe(10_666);
    }
  });

  it('every trigger fires once — none of these beats repeats', () => {
    for (const trigger of chapter.mid) expect(trigger.once, trigger.id).toBe(true);
  });
});

describe('Evrae script — absence test: FFX only [AGENTS.md rule 14]', () => {
  it('no FFX-2 speaker appears anywhere in the chapter', () => {
    const ffx2 = ['yuna-x2', 'rikku-x2', 'paine', 'buddy', 'shinra', 'shuyin', 'lenne', 'nooj', 'baralai', 'gippal', 'leblanc', 'logos', 'ormi', 'bahamut'];
    const everyWho = allScripts().flatMap(([, s]) => spoken(s).map(([who]) => who));
    for (const who of ffx2) expect(everyWho).not.toContain(who);
  });

  it('no music or sfx cue borrows an FFX-2 chapter track', () => {
    for (const [, script] of allScripts()) {
      for (const step of flatten(script)) {
        if (step.type === 'music' && step.track) expect(step.track).not.toMatch(/ffx2|x2/);
      }
    }
  });

  // The preflight reserves `scene-fahrenheit` / `boss-evrae` [§6, §12.6]; both
  // were composed 2026-09-23 (docs/audio/THEMES.md cue map rows 22-23).
  it('the only music cues are the two the preflight reserves', () => {
    const cues = new Set<string>();
    for (const [, script] of allScripts()) {
      for (const step of flatten(script)) {
        if (step.type === 'music' && step.track) cues.add(step.track);
      }
    }
    expect([...cues].sort()).toEqual(['boss-evrae', 'scene-fahrenheit']);
  });
});
