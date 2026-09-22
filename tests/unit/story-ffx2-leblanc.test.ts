/**
 * Chapter 6 — the Leblanc Syndicate. House-style, cast and beat-order lint.
 *
 * This is the story agent's own guard rail for a chapter that is **not yet
 * registered** in `src/story/registry.ts` or `src/data/encounters.ts` (an
 * integrator does that), so `tests/unit/story-scripts.test.ts` does not see it
 * yet. Everything that file checks for the five shipped chapters is checked
 * here for this one, plus three things specific to this chapter:
 *
 * 1. **Only speakers who are physically in the scene speak.** A previous
 *    critic round flagged absent speakers elsewhere; every script here is
 *    checked against an explicit present-cast list.
 * 2. **The canonical beat order** of `research/ffx2-leblanc-syndicate.md` §9.2
 *    (beats 3 → 7 pre-battle, 9 and 11 between the acts, 13 → 15 after).
 * 3. **Game case: FFX-2 only** (AGENTS.md rule 14, `critic/CHECKS.md` CHK-021)
 *    — the absence test. No FFX speaker, no FFX party member, no FFX chapter
 *    or boss id occurs anywhere in the chapter.
 */

import { describe, expect, it } from 'vitest';

import type { ChapterScripts, SpeakerId, Step, StoryScript } from '../../src/story/dsl.ts';
import { MAX_LINE_CHARS, MAX_QUIP_WORDS, lintScript } from '../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS } from '../../src/story/registry.ts';
import {
  LEBLANC_ABILITY_IDS,
  LEBLANC_COMBATANT_IDS,
  ffx2LeblancScripts,
} from '../../src/story/scripts/ffx2-leblanc.ts';

const chapter: ChapterScripts = ffx2LeblancScripts;

/**
 * Every `SpeakerId` the DSL declares. Kept as a literal list so a typo in a
 * `say()` is caught as data, not silently accepted because `who` is a union
 * member somewhere else in the file.
 */
const SPEAKER_IDS: readonly SpeakerId[] = [
  'tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku',
  'seymour', 'yunalesca', 'jecht', 'braska', 'yu-yevon', 'fayth-boy',
  'zaon', 'young-auron', 'kelk', 'biran', 'yenke', 'wantz',
  'yuna-x2', 'rikku-x2', 'paine',
  'brother', 'buddy', 'shinra',
  'shuyin', 'lenne', 'nooj', 'baralai', 'gippal', 'leblanc', 'logos', 'ormi',
  'bahamut', 'narrator', 'none',
];

/** Who is physically (or, for Brother, audibly) in each scene [§9.1, §9.2]. */
const PRESENT: Record<string, readonly SpeakerId[]> = {
  // Upstairs and the corridor: the trio hand out duties, Leblanc is massaged,
  // and Brother is on the comm at full volume (beat 7 — that is the point).
  pre: ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi', 'brother'],
  // Logos' room. The Syndicate has run; only the girls are there.
  'mid:act-one-cleared': ['yuna-x2', 'rikku-x2', 'paine'],
  // The treasure room, before Leblanc is found. Still only the girls.
  'mid:act-two-cleared': ['yuna-x2', 'rikku-x2', 'paine'],
  // Act III and the aftermath: all six, and nobody else.
  'mid:first-not-so-mighty-guard': ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi'],
  'mid:first-no-love-lost': ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi'],
  'mid:logos-down': ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi'],
  'mid:ormi-down': ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi'],
  post: ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi'],
};

function allScripts(c: ChapterScripts): Array<readonly [string, StoryScript]> {
  return [
    ['pre', c.pre] as const,
    ['post', c.post] as const,
    ...Object.entries(c.midScripts).map(([id, s]) => [`mid:${id}`, s] as const),
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

/** Everything anyone says in a script, joined, for beat-order assertions. */
function joined(script: StoryScript): string {
  return spokenText(script).map(([, t]) => t).join(' | ');
}

// ---------------------------------------------------------------------------
// House style
// ---------------------------------------------------------------------------

describe('ffx2-leblanc — house style [writing-bible §2.1]', () => {
  it('has something to lint (the walk itself works)', () => {
    const lines = allScripts(chapter).flatMap(([, s]) => spokenText(s));
    expect(lines.length).toBeGreaterThan(40);
  });

  it('passes lintScript() on every script it owns', () => {
    for (const [name, script] of allScripts(chapter)) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
    }
  });

  it('keeps every line inside the 60-character cap', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(text.length, `${name} / ${who}: ${text}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });

  it('uses at most one ellipsis per line and never a space before one', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        expect(text.split('...').length - 1, `${name} / ${who}`).toBeLessThanOrEqual(1);
        expect(text.includes(' ...'), `${name} / ${who}`).toBe(false);
      }
    }
  });

  it('allocates real time to every reaction-shot beat', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const step of flatten(script)) {
        if (step.type === 'wait') {
          expect(step.ms, `${name} wait`).toBeGreaterThanOrEqual(1200);
          expect(step.ms, `${name} wait`).toBeLessThanOrEqual(10_000);
        }
      }
    }
  });

  it('keeps victory quips to 10 words and 60 characters [writing-bible §5.4]', () => {
    const quips = Object.entries(chapter.victoryQuips);
    expect(quips.length).toBe(3);
    for (const [who, bank] of quips) {
      expect(bank.length, who).toBeGreaterThanOrEqual(3);
      for (const quip of bank) {
        expect(quip.split(/\s+/).length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_QUIP_WORDS);
        expect(quip.length, `${who}: ${quip}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Structure and wiring
// ---------------------------------------------------------------------------

describe('ffx2-leblanc — structure', () => {
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

  it('restores the flourish — this is the inverse of Chapter 4 [§10.3]', () => {
    const step = chapter.post.find((s) => s.type === 'results');
    expect(step?.type === 'results' && step.silent).toBeFalsy();
    expect(chapter.post.some((s) => s.type === 'camera' && s.rig === 'victory')).toBe(true);
  });

  it('wires every trigger to a script and every script to a trigger', () => {
    const referenced = new Set(chapter.mid.map((t) => t.script));
    const defined = new Set(Object.keys(chapter.midScripts));
    for (const ref of referenced) expect(defined, `trigger -> ${ref}`).toContain(ref);
    for (const key of defined) expect(referenced, `script -> ${key}`).toContain(key);
  });

  it('gives every trigger a unique id equal to its script [registry rule]', () => {
    const ids = chapter.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of chapter.mid) expect(t.id, 'id === script').toBe(t.script);
    for (const t of chapter.mid) expect(t.once, `${t.id} once`).toBe(true);
  });

  it('keys every trigger to a combatant or ability id this file declares', () => {
    const known = new Set<string>(Object.values(LEBLANC_COMBATANT_IDS));
    const abilities = new Set<string>(Object.values(LEBLANC_ABILITY_IDS));
    for (const t of chapter.mid) {
      if (t.when.type === 'ko') expect(known, t.id).toContain(t.when.who);
      else if (t.when.type === 'ability-used') {
        expect(known, t.id).toContain(t.when.who);
        expect(abilities, t.id).toContain(t.when.ability);
      } else throw new Error(`${t.id}: unexpected trigger type ${t.when.type}`);
    }
  });

  it('gives every mid-battle line an auto so no beat sits on a Confirm', () => {
    for (const [name, script] of allScripts(chapter)) {
      if (!name.startsWith('mid:')) continue;
      for (const step of flatten(script)) {
        if (step.type === 'say') expect(step.auto, `${name}: ${step.text}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps in-fight beats under the 8 s budget and seams under the seam budget', () => {
    // The two between-act beats are chain seams (a group boundary, the scene
    // IS the point); the four Act III beats interrupt a live fight.
    const seams = new Set(['act-one-cleared', 'act-two-cleared']);
    for (const [id, script] of Object.entries(chapter.midScripts)) {
      const ms = flatten(script).reduce((total, step) => {
        if (step.type === 'say') return total + (step.auto ?? 0);
        if (step.type === 'wait') return total + step.ms;
        if (step.type === 'camera') return total + step.ms;
        return total;
      }, 0);
      const budget = seams.has(id) ? SEAM_BUDGET_MS : MID_SCRIPT_BUDGET_MS;
      expect(ms, `${id} runs ${ms} ms`).toBeLessThanOrEqual(budget);
    }
  });
});

// ---------------------------------------------------------------------------
// Cast — only speakers who are in the scene
// ---------------------------------------------------------------------------

describe('ffx2-leblanc — cast', () => {
  it('uses only speaker ids the DSL declares', () => {
    const known = new Set<string>(SPEAKER_IDS);
    for (const [name, script] of allScripts(chapter)) {
      for (const [who] of spokenText(script)) {
        expect(known, `${name}: unknown speaker "${who}"`).toContain(who);
      }
    }
  });

  it('gives every script a declared present cast', () => {
    for (const [name] of allScripts(chapter)) {
      expect(Object.keys(PRESENT), `no present-cast list for ${name}`).toContain(name);
    }
  });

  it('never lets a speaker talk who is not in the scene', () => {
    for (const [name, script] of allScripts(chapter)) {
      const present = new Set<string>(PRESENT[name] ?? []);
      for (const [who, text] of spokenText(script)) {
        expect(present, `${name}: "${who}" is not in the scene — ${text}`).toContain(who);
      }
    }
  });

  it('keeps the Syndicate out of the two rooms they have fled [§9.2 beats 9, 11]', () => {
    for (const name of ['mid:act-one-cleared', 'mid:act-two-cleared']) {
      const script = chapter.midScripts[name.slice(4)];
      expect(script, name).toBeDefined();
      for (const [who] of spokenText(script!)) {
        expect(['leblanc', 'logos', 'ormi']).not.toContain(who);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// The canonical beats, in order [§9.2]
// ---------------------------------------------------------------------------

describe('ffx2-leblanc — beats in canon order [ffx2-leblanc-syndicate §9.2]', () => {
  const pre = joined(chapter.pre);
  const post = joined(chapter.post);

  /** Assert that each needle occurs, and occurs after the one before it. */
  function inOrder(haystack: string, needles: RegExp[], label: string): void {
    let cursor = 0;
    for (const needle of needles) {
      const rest = haystack.slice(cursor);
      const at = rest.search(needle);
      expect(at, `${label}: ${needle} not found after index ${cursor}`).toBeGreaterThanOrEqual(0);
      cursor += at + 1;
    }
  }

  it('runs pre-battle beats 3 -> 4 -> 5 -> 6 -> 7 in order', () => {
    inOrder(
      pre,
      [
        /pink/i, // beat 3 — the stolen uniforms
        /duties|shoulders seen to/i, // beat 4 — duties assigned
        /Lower, pet/i, // beat 5 — the massage
        /switch/i, // beat 6 — sent to the switch
        /Brother/i, // beat 7 — the comm blows the cover
        /cheating/i, // Ormi recognises them
      ],
      'pre',
    );
  });

  it('plays the Crimson Sphere before the treasure room [beats 9, 11]', () => {
    const nine = joined(chapter.midScripts['act-one-cleared']!);
    const eleven = joined(chapter.midScripts['act-two-cleared']!);
    expect(nine).toMatch(/Dud sphere/i);
    expect(nine).toMatch(/Turn it off/i);
    expect(eleven).toMatch(/our half/i);
    expect(eleven).toMatch(/whole time/i);
    // Beat 9 is the chapter's one sincere exchange and it explains nothing:
    // Paine's Crimson Squad reckoning is chapters away [writing-bible §0.3].
    expect(nine).not.toMatch(/crimson|squad|den of woe/i);
  });

  it('runs post-battle beats 13 -> 14 -> 15 in order', () => {
    inOrder(
      post,
      [
        /Take it/i, // beat 13 — she gives up the sphere
        /Vegnagun/i, // beat 14 — the reveal
        /goes down there/i, // beat 15 — the truce
        /Noo—/, // Nooj, named obliquely and cut off [§9.3]
      ],
      'post',
    );
  });

  it('lands beat 14 without a joke [§9.2 note, preflight §7]', () => {
    // From the Vegnagun reveal to "Something woke it up", nobody quips.
    const lines = spokenText(chapter.post).map(([, t]) => t);
    const start = lines.findIndex((t) => /Vegnagun/i.test(t));
    const end = lines.findIndex((t) => /woke it up/i.test(t));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    for (const line of lines.slice(start, end + 1)) {
      expect(line, `a joke landed inside beat 14: ${line}`).not.toMatch(/!|ha|pose/i);
    }
  });

  it('switches the cue at beat 14, away from whatever the pre-battle cue was [§10.3]', () => {
    // Updated by the integrator, 2026-09-22: no dedicated `scene-disquiet` /
    // `scene-chateau-leblanc` / `boss-leblanc` cues exist, so this chapter
    // reuses real, already-registered `MUSIC_KEYS` (Chapter 4's cues, plus
    // `scene-farplane` for this beat) — see `docs/CONTRACT-CHANGES.md`. The
    // beat-14 switch itself is still the thing being pinned: the cue changes
    // and is not one the pre-battle scene already used.
    const tracks = chapter.post.filter((s) => s.type === 'music').map((s) => s.track);
    expect(tracks).toContain('scene-farplane');
    const preTracks = chapter.pre.filter((s) => s.type === 'music').map((s) => s.track);
    expect(preTracks).toEqual(['scene-bevelle-underground', 'boss-ffx2-aeon']);
    expect(preTracks).not.toContain('scene-farplane');
  });

  it('never moralises the trio or makes Leblanc pathetic [§9.4]', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who, text] of spokenText(script)) {
        // Nobody pities them and nobody offers them a redemption arc: they are
        // beaten and then pragmatically allied with [§9.4].
        expect(text, `${name} / ${who}`).not.toMatch(/forgive|redeem|pathetic|pity|deserve/i);
        // And the trio never apologise — Leblanc explicitly never does [§9.3],
        // which is why she loses four times and is never humiliated by us.
        if (['leblanc', 'logos', 'ormi'].includes(who)) {
          expect(text, `${name} / ${who}`).not.toMatch(/sorry|apolog/i);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Game case: FFX-2 only (AGENTS.md rule 14, CHK-021)
// ---------------------------------------------------------------------------

describe('ffx2-leblanc — FFX-2 only, absence test [AGENTS.md rule 14]', () => {
  const FFX_ONLY_SPEAKERS = [
    'tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku',
    'seymour', 'yunalesca', 'jecht', 'braska', 'yu-yevon', 'fayth-boy',
    'zaon', 'young-auron', 'kelk', 'biran', 'yenke', 'wantz', 'narrator',
  ];

  it('gives no line to an FFX-only speaker', () => {
    for (const [name, script] of allScripts(chapter)) {
      for (const [who] of spokenText(script)) {
        expect(FFX_ONLY_SPEAKERS, `${name}: ${who}`).not.toContain(who);
      }
    }
  });

  it('keys no trigger to an FFX boss or an FFX chapter id', () => {
    const ffx = /seymour|mortiorchis|yunalesca|braska|jecht|yu-yevon|bfa|aeon/i;
    for (const t of chapter.mid) {
      expect(t.id).not.toMatch(ffx);
      const who = t.when.type === 'ko' || t.when.type === 'ability-used' ? t.when.who : '';
      expect(who).not.toMatch(ffx);
    }
  });

  it('names no FFX music cue', () => {
    // Updated by the integrator, 2026-09-22: this chapter reuses real FFX-2
    // cues from Chapter 4 (`scene-bevelle-underground`, `boss-ffx2-aeon`) and
    // Chapter 5 (`scene-farplane`) rather than inventing its own — see
    // `docs/CONTRACT-CHANGES.md`. None of those names contain "ffx2" or
    // "leblanc", so the check is against the actual FFX-only cue keys rather
    // than a naming pattern.
    const ffxOnlyCues = new Set([
      'scene-gagazet',
      'boss-seymour',
      'scene-zanarkand-dome',
      'boss-yunalesca',
      'scene-dreams-end',
      'boss-jecht',
      'boss-yu-yevon',
      'victory-ffx',
      'ending-ffx',
    ]);
    for (const [, script] of allScripts(chapter)) {
      for (const step of flatten(script)) {
        if (step.type === 'music' && step.track !== null) {
          expect(ffxOnlyCues.has(step.track), `FFX cue "${step.track}" in an FFX-2 chapter`).toBe(false);
        }
      }
    }
  });

  it('keys every victory quip to an FFX-2 party member', () => {
    expect(Object.keys(chapter.victoryQuips).sort()).toEqual(['paine', 'rikku', 'yuna']);
  });
});
