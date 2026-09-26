/**
 * Chapter XV (the Den of Woe) ship layer: the record, the story, and its triggers proved by
 * **running the engine** (AGENTS.md rule 3), not by reading the data: each shade's entrance,
 * Baralai's count-seven callout (his AI's emit), Gippal's third and first Mortar, Lightfall.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_DEN_OF_WOE } from '../../../src/data/chapter-ffx2-den-of-woe.ts';
import { FFX2_DEN_OF_WOE_SHIPPED, withDenOfWoeShip } from '../../../src/data/chapter-den-of-woe-ship.ts';
import { lintScript, type StoryScript } from '../../../src/story/dsl.ts';
import { DEN_OF_WOE_AI_TRIGGERS, ffx2DenOfWoeScripts as S } from '../../../src/story/scripts/ffx2-den-of-woe.ts';
import { BARALAI_COUNT_SEVEN, DRILL_SHOT_AT } from '../../../src/battle/ffx2/ai/den-of-woe.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { LINES, driveDen, driveLink } from '../helpers/denOfWoeDrive.ts';
import { DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ } from '../../../src/data/ffx2/enemies/den-of-woe.ts';

const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);

function allScripts(): Array<[string, StoryScript]> {
  return [['pre', S.pre], ['post', S.post], ...Object.entries(S.midScripts)];
}

function fired(log: readonly BattleEvent[]): string[] {
  return log.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
}

function started(log: readonly BattleEvent[], ability: string): number {
  return log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === ability).length;
}

describe('the registered record', () => {
  it("is the engine track's record with the Den scene and the story on, listed (2026-09-26)", () => {
    expect(getChapter('ffx2-den-of-woe')).toBe(FFX2_DEN_OF_WOE_SHIPPED);
    expect(CHAPTERS).toContain(FFX2_DEN_OF_WOE_SHIPPED);
    expect(FFX2_DEN_OF_WOE_SHIPPED.sceneKey).toBe('den-of-woe');
    expect(FFX2_DEN_OF_WOE_SHIPPED.scriptsRef).toBe(S);
    const { sceneKey: _a, scriptsRef: _b, ...rest } = FFX2_DEN_OF_WOE_SHIPPED;
    const { sceneKey: _c, scriptsRef: _d, ...base } = FFX2_DEN_OF_WOE;
    expect(rest).toEqual(base);
    // GP16 as the record has it: the stand-in cue until a Den cue is picked by ear (rule 13).
    expect(FFX2_DEN_OF_WOE_SHIPPED.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-shuyin', victory: 'victory-ffx2' });
    expect(withDenOfWoeShip(FFX2_DEN_OF_WOE)).toEqual(FFX2_DEN_OF_WOE_SHIPPED);
  });
});

describe('the story, on paper', () => {
  it('passes the house lint, opens the battle and shows results', () => {
    for (const [name, script] of allScripts()) expect(lintScript(script), name).toEqual([]);
    expect(S.pre.at(-1)?.type).toBe('battleStart');
    expect(S.post.some((s) => s.type === 'results')).toBe(true);
  });

  it('the shades never speak (GP13 a): only the girls and the narration carry lines', () => {
    for (const [name, script] of allScripts()) {
      for (const s of script) if (s.type === 'say') expect(['yuna-x2', 'rikku-x2', 'paine'], name).toContain(s.who);
    }
    expect(S.pre.filter((s) => s.type === 'narrate')).toHaveLength(4); // GP14 a
  });

  it('every trigger id is its script, unique, with a script behind it; the AI name has one too', () => {
    const ids = S.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
    }
    expect([...DEN_OF_WOE_AI_TRIGGERS]).toEqual([BARALAI_COUNT_SEVEN]);
    for (const n of DEN_OF_WOE_AI_TRIGGERS) expect(S.midScripts[n], n).toBeDefined();
  });

  it('every mid script fits the in-fight budget and every line in one auto-advances', () => {
    for (const [name, script] of Object.entries(S.midScripts)) {
      expect(scriptDurationMs(script, MID_LINE_HOLD_MS), name).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      for (const step of script) if (step.type === 'say') expect(step.auto, `${name}: ${step.text}`).toBeGreaterThan(0);
    }
  });
});

describe('the triggers, by running the engine (the intended line, bench speed)', () => {
  it('Baralai: his entrance once; the count-seven callout once, before his first Drill Shot', () => {
    let calls = 0;
    for (const seed of SEEDS) {
      let log: readonly BattleEvent[] = [];
      driveLink(DEN_BARALAI, LINES.intended, seed, { triggers: S.mid, inspect: (e) => (log = e.state().log) });
      const names = fired(log);
      expect(names.filter((n) => n === 'baralai-entrance'), `seed ${seed}`).toHaveLength(1);
      const count = names.filter((n) => n === BARALAI_COUNT_SEVEN).length;
      expect(count, `seed ${seed}`).toBeLessThanOrEqual(1);
      const drills = started(log, 'x2-den-baralai-drill-shot');
      if (drills > 0) expect(count, `seed ${seed}`).toBe(1);
      if (count) {
        calls++;
        const at = log.findIndex((e) => e.type === 'script-trigger' && (e as { name: string }).name === BARALAI_COUNT_SEVEN);
        const firstDrill = log.findIndex((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'x2-den-baralai-drill-shot');
        if (firstDrill >= 0) expect(at, `seed ${seed}`).toBeLessThan(firstDrill);
      }
    }
    expect(calls).toBeGreaterThan(0);
    expect(DRILL_SHOT_AT - 1).toBe(7);
    console.info(`[den story] Baralai: the count-seven callout in ${calls}/${SEEDS.length}`);
  });

  it("Gippal: his entrance once; below a third once when he crosses it; the first Mortar's line once", () => {
    let thirds = 0;
    let mortars = 0;
    for (const seed of SEEDS) {
      let log: readonly BattleEvent[] = [];
      const run = driveLink(DEN_GIPPAL, LINES.intended, seed, { triggers: S.mid, inspect: (e) => (log = e.state().log) });
      const names = fired(log);
      expect(names.filter((n) => n === 'gippal-entrance'), `seed ${seed}`).toHaveLength(1);
      const third = names.filter((n) => n === 'gippal-third').length;
      expect(third, `seed ${seed}`).toBe(run.outcome === 'victory' ? 1 : third);
      expect(third).toBeLessThanOrEqual(1);
      thirds += third;
      const m = started(log, 'x2-den-gippal-mortar');
      expect(names.filter((n) => n === 'gippal-mortar').length, `seed ${seed}`).toBe(m > 0 ? 1 : 0);
      if (m > 0) mortars++;
    }
    expect(thirds).toBeGreaterThan(0);
    expect(mortars).toBeGreaterThan(0);
    console.info(`[den story] Gippal: below a third in ${thirds}, Mortar in ${mortars} of ${SEEDS.length}`);
  });

  it("Nooj: his entrance once; Lightfall's line once, exactly when Lightfall starts", () => {
    let falls = 0;
    for (const seed of SEEDS) {
      let log: readonly BattleEvent[] = [];
      driveLink(DEN_NOOJ, LINES.intended, seed, { triggers: S.mid, inspect: (e) => (log = e.state().log) });
      const names = fired(log);
      expect(names.filter((n) => n === 'nooj-entrance'), `seed ${seed}`).toHaveLength(1);
      const l = started(log, 'x2-den-nooj-lightfall');
      expect(names.filter((n) => n === 'nooj-lightfall').length, `seed ${seed}`).toBe(l > 0 ? 1 : 0);
      if (l > 0) falls++;
    }
    expect(falls).toBeGreaterThan(0);
    console.info(`[den story] Nooj: Lightfall's line in ${falls}/${SEEDS.length}`);
  });

  it('the whole Den: each entrance fires once, in its own link, in order', () => {
    for (const seed of SEEDS.slice(0, 6)) {
      const perLink: string[][] = [];
      const run = driveDen(LINES.intended, seed, { triggers: S.mid, inspect: (e) => perLink.push(fired(e.state().log)) });
      const entrances = ['baralai-entrance', 'gippal-entrance', 'nooj-entrance'];
      perLink.forEach((names, i) => {
        for (const [j, id] of entrances.entries()) {
          expect(names.filter((n) => n === id).length, `seed ${seed} link ${i + 1} ${id}`).toBe(i === j ? 1 : 0);
        }
      });
      expect(perLink.length, `seed ${seed}`).toBe(run.links.length);
    }
  });
});
