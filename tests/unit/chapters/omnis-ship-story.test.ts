/**
 * Chapter XII (Seymour Omnis) ship layer: the story, the callout hooks and the registered record.
 * The callouts are proved by **running the engine** (AGENTS.md rule 3), not by reading the data:
 * the chapter's own tactic plays the fight and the log is read for the `script-trigger` names,
 * where they sit against the actions they introduce, and whether the fight itself moved.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { OMNIS_CALLOUTS, OMNIS_CALLOUT_NAMES } from '../../../src/battle/ffx/ai/seymour-omnis-callouts.ts';
import { lintScript, type StoryScript } from '../../../src/story/dsl.ts';
import { OMNIS_ACTOR, OMNIS_STORY_TRIGGERS, seymourOmnisScripts } from '../../../src/story/scripts/seymour-omnis.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { seymourOmnis } from '../../../src/engine/tactics/seymour-omnis.ts';
import { OMNIS, newEngine } from '../helpers/omnisUnits.ts';

const S = seymourOmnisScripts;
const all = (): StoryScript[] => [S.pre, S.post, ...Object.values(S.midScripts)];
const lines = (script: StoryScript): string[] => script.flatMap((st) => (st.type === 'say' || st.type === 'narrate' ? [st.text] : []));

describe('the story (docs/plans/omnis-story-draft.md, every line [ORIGINAL])', () => {
  it('every line passes the house lint and the 60-character cap', () => {
    for (const script of all()) {
      expect(lintScript(script)).toEqual([]);
      for (const t of lines(script)) expect(t.length, t).toBeLessThanOrEqual(60);
    }
  });

  it('pre ends in battleStart, post holds results; no victory quips (E12 is grim tier)', () => {
    expect(S.pre.at(-1)?.type).toBe('battleStart');
    expect(S.post.some((st) => st.type === 'results')).toBe(true);
    expect(S.victoryQuips).toEqual({});
  });

  it('plays the draft\'s lines, in the draft\'s order, with its first choices (line 12 "Yes.", line 15 the bare goodbye)', () => {
    const draft = readFileSync('docs/plans/omnis-story-draft.md', 'utf8').replace(/\r\n/g, '\n');
    const numbered = [...draft.matchAll(/^\| (\d+) \| [^|]+\| "(.+)" \|$/gm)].map((m) => [Number(m[1]), m[2]!] as const);
    expect(numbered.map(([n]) => n)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    const played = [...lines(S.pre), ...lines(S.post)];
    expect(played).toEqual(numbered.map(([, t]) => t));
  });

  it('Seymour speaks with his own Omnis portrait (B17 = c), and the post scene sends him', () => {
    const who = [...S.pre, ...S.post].filter((st) => st.type === 'say' && /Lady Yuna|son of Jecht|outlive/.test(st.text));
    for (const st of who) expect(st.type === 'say' && st.who).toBe('seymour-omnis');
    const dance = S.post.findIndex((st) => st.type === 'fx' && st.key === 'sending-dance');
    const rise = S.post.findIndex((st) => st.type === 'fx' && st.key === 'pyreflies-rising' && st.at === OMNIS_ACTOR);
    const gone = S.post.findIndex((st) => st.type === 'hideActor' && st.actor === OMNIS_ACTOR);
    expect(dance).toBeGreaterThan(-1);
    expect(rise).toBeGreaterThan(dance);
    expect(gone).toBeGreaterThan(rise);
  });

});

describe('the callouts', () => {
  it('the story\'s names are the engine\'s names, and every one has a script', () => {
    expect(OMNIS_STORY_TRIGGERS).toEqual(OMNIS_CALLOUTS);
    for (const name of OMNIS_CALLOUT_NAMES) expect(S.midScripts[name], name).toBeDefined();
    expect(Object.keys(S.midScripts).sort()).toEqual([...OMNIS_CALLOUT_NAMES].sort());
    expect(S.mid).toEqual([]);
  });

  it('each is one line that fits the beat budget and advances on its own', () => {
    for (const [name, script] of Object.entries(S.midScripts)) {
      expect(scriptDurationMs(script, MID_LINE_HOLD_MS), name).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(script).toHaveLength(1);
      for (const st of script) if (st.type === 'say') expect(st.auto, name).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------- the engine, run (rule 3)

interface Played {
  log: readonly BattleEvent[];
  names: string[];
  outcome: string;
}

function play(seed: number, withTactic = true): Played {
  const engine = newEngine(seed);
  for (let i = 0; i < 8000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const pick = withTactic ? seymourOmnis(d.actorId, d.commands, engine) : null;
    engine.submit(pick ?? { kind: 'defend', targets: [] });
  }
  const st = engine.state();
  const log = st.log as readonly BattleEvent[];
  const names = log.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
  return { log, names, outcome: st.result?.outcome ?? 'unfinished' };
}

/** Index of the first `action-start` of `ability` by Omnis at or after `from`. */
function nextCast(log: readonly BattleEvent[], from: number, pred: (id: string) => boolean): number {
  for (let i = from; i < log.length; i++) {
    const e = log[i] as { type: string; actorId?: string; abilityId?: string };
    if (e.type === 'action-start' && e.actorId === OMNIS && pred(e.abilityId ?? '')) return i;
  }
  return -1;
}

describe('the hooks fire on the real engine, at their moments', () => {
  const runs = [1, 2, 3].map((seed) => play(seed));

  it('the lesson plays once, before his first volley; the lines before Dispel and each Ultima come before those spells', () => {
    for (const { log, names } of runs) {
      const lessons = names.filter((n) => n === OMNIS_CALLOUTS.lesson || n === OMNIS_CALLOUTS.lessonLulu);
      expect(lessons.length).toBeLessThanOrEqual(1);
      const trig = (name: string): number[] => log.flatMap((e, i) => (e.type === 'script-trigger' && (e as { name: string }).name === name ? [i] : []));
      for (const at of trig(OMNIS_CALLOUTS.lesson)) expect(nextCast(log, at, (id) => id === 'omnis-volley' || /^omnis-(fir|bliz|thund|water)/.test(id))).toBeGreaterThan(at);
      const dispel = trig(OMNIS_CALLOUTS.dispel);
      expect(dispel.length).toBeLessThanOrEqual(1);
      for (const at of dispel) expect(nextCast(log, at, (id) => id === 'omnis-dispel')).toBe(nextCast(log, at, () => true));
      const ultimas = log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'omnis-ultima').length;
      expect(trig(OMNIS_CALLOUTS.ultima)).toHaveLength(ultimas);
      for (const at of trig(OMNIS_CALLOUTS.ultima)) expect(nextCast(log, at, (id) => id === 'omnis-ultima')).toBe(nextCast(log, at, () => true));
    }
  });

  it('on the chapter\'s line, Wakka turns the first disc and says so; the glow, the reset and the 20,000 line each speak once', () => {
    let lows = 0;
    for (const { names } of runs) {
      expect(names).toContain(OMNIS_CALLOUTS.turnedWakka);
      expect(names).not.toContain(OMNIS_CALLOUTS.turned);
      for (const once of [OMNIS_CALLOUTS.glow, OMNIS_CALLOUTS.reset, OMNIS_CALLOUTS.low, OMNIS_CALLOUTS.turnedWakka]) {
        expect(names.filter((n) => n === once).length, once).toBeLessThanOrEqual(1);
      }
      expect(names).toContain(OMNIS_CALLOUTS.glow);
      if (names.includes(OMNIS_CALLOUTS.low)) lows++;
    }
    expect(lows).toBeGreaterThan(0);
  });

  it('plays the same fight twice, event for event, with the hooks in (they draw no RNG)', () => {
    // The stronger check is the bench: `omnis-bench.test.ts` prints the same 127/200 and the same
    // key moments before and after the hooks (recorded in the ship commit's message).
    for (const seed of [1, 4]) {
      const a = play(seed);
      const b = play(seed);
      expect(b.names).toEqual(a.names);
      expect(b.log.length).toBe(a.log.length);
      const kinds = (log: readonly BattleEvent[]): string => log.filter((e) => e.type !== 'script-trigger').map((e) => e.type).join(',');
      expect(kinds(b.log)).toBe(kinds(a.log));
    }
  });

  it('a fight where nobody touches a disc never hears the disc lines', () => {
    const { names } = play(7, false);
    expect(names).not.toContain(OMNIS_CALLOUTS.turned);
    expect(names).not.toContain(OMNIS_CALLOUTS.turnedWakka);
    expect(names).toContain(OMNIS_CALLOUTS.lesson);
  });
});
