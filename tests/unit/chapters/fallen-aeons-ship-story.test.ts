/**
 * Chapter XI (Fallen Aeons) ship layer: the story, and its triggers proved by **running the
 * engine** (AGENTS.md rule 3), not by reading the data: Shiva's entrance and KO, the Sisters'
 * entrance and their AI's first-fall callout, Anima's entrance, half HP and her AI's third Pain.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_FALLEN_AEONS } from '../../../src/data/chapter-ffx2-fallen-aeons.ts';
import { FFX2_FALLEN_AEONS_SHIPPED, withFallenAeonsShip } from '../../../src/data/chapter-fallen-aeons-ship.ts';
import { ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { lintScript, type StoryScript } from '../../../src/story/dsl.ts';
import {
  FALLEN_AEONS_AI_TRIGGERS,
  FALLEN_AEONS_LINKS_RIG,
  FALLEN_AEONS_SEAM,
  ffx2FallenAeonsScripts as S,
} from '../../../src/story/scripts/ffx2-fallen-aeons.ts';
import { SISTERS_FIRST_DOWN } from '../../../src/battle/ffx2/ai/magus-sisters.ts';
import { ANIMA_THIRD_PAIN } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { LINES, driveLink } from '../helpers/fallenAeonsDrive.ts';

const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);
/** Shiva's Stop lands about 7 times in 100 fights (all on Yuna, measured): enough seeds to see it. */
const SHIVA_SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

function allScripts(): Array<[string, StoryScript]> {
  return [['pre', S.pre], ['post', S.post], ...Object.entries(S.midScripts)];
}

function fired(log: readonly BattleEvent[]): string[] {
  return log.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
}

describe('the registered record', () => {
  it('is the engine track\'s record with the Road scene and the story on, listed (2026-09-26)', () => {
    expect(getChapter('ffx2-fallen-aeons')).toBe(FFX2_FALLEN_AEONS_SHIPPED);
    expect(CHAPTERS).toContain(FFX2_FALLEN_AEONS_SHIPPED);
    expect(FFX2_FALLEN_AEONS_SHIPPED.sceneKey).toBe('road-to-the-farplane');
    expect(FFX2_FALLEN_AEONS_SHIPPED.scriptsRef).toBe(S);
    // Everything else is the engine track's, untouched: the fight, the party, FA15's music.
    const { sceneKey: _a, scriptsRef: _b, ...rest } = FFX2_FALLEN_AEONS_SHIPPED;
    const { sceneKey: _c, scriptsRef: _d, ...base } = FFX2_FALLEN_AEONS;
    expect(rest).toEqual(base);
    expect(FFX2_FALLEN_AEONS_SHIPPED.music).toEqual({ scene: 'scene-farplane', battle: 'boss-ffx2-aeon', victory: 'victory-ffx2' });
    expect(withFallenAeonsShip(FFX2_FALLEN_AEONS)).toEqual(FFX2_FALLEN_AEONS_SHIPPED);
  });
});

describe('the story, on paper', () => {
  it('passes the house lint, opens the battle and shows results', () => {
    for (const [name, script] of allScripts()) expect(lintScript(script), name).toEqual([]);
    expect(S.pre.at(-1)?.type).toBe('battleStart');
    expect(S.post.some((s) => s.type === 'results')).toBe(true);
  });

  it('every trigger id is its script, unique, with a script behind it; every AI name has one too', () => {
    const ids = S.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
    }
    expect([...FALLEN_AEONS_AI_TRIGGERS]).toEqual([SISTERS_FIRST_DOWN, ANIMA_THIRD_PAIN]);
    for (const n of FALLEN_AEONS_AI_TRIGGERS) expect(S.midScripts[n], n).toBeDefined();
  });

  it('every mid script fits its budget and every line in one auto-advances; only the seam is a seam', () => {
    for (const [name, script] of Object.entries(S.midScripts)) {
      const cap = name === FALLEN_AEONS_SEAM ? SEAM_BUDGET_MS : MID_SCRIPT_BUDGET_MS;
      expect(scriptDurationMs(script, MID_LINE_HOLD_MS), name).toBeLessThanOrEqual(cap);
      for (const step of script) if (step.type === 'say') expect(step.auto, `${name}: ${step.text}`).toBeGreaterThan(0);
    }
  });

  it('the seam cuts to the road-links rig (plate B) and back to the fight\'s framing', () => {
    const cams = S.midScripts[FALLEN_AEONS_SEAM]!.filter((s) => s.type === 'camera').map((s) => (s as { rig: string }).rig);
    expect(cams).toEqual([FALLEN_AEONS_LINKS_RIG, 'idle']);
  });

  it('the one sincere exchange is four lines at most (writing-bible §2.2)', () => {
    const says = S.midScripts[FALLEN_AEONS_SEAM]!.filter((s) => s.type === 'say');
    expect(says.length).toBeLessThanOrEqual(4);
  });
});

describe('the triggers, by running the engine (intended lines, bench speed)', () => {
  it('Shiva: her entrance once; her KO fires the seam once, only on a win; Stop on Rikku fires Rikku\'s line', () => {
    let wins = 0;
    let stops = 0;
    for (const seed of SHIVA_SEEDS) {
      const run = driveLink(ROAD_SHIVA, LINES.shivaIntended, seed, { triggers: S.mid });
      const names = fired(run.log);
      expect(names.filter((n) => n === 'shiva-entrance'), `seed ${seed}`).toHaveLength(1);
      expect(names.filter((n) => n === FALLEN_AEONS_SEAM), `seed ${seed}`).toHaveLength(run.outcome === 'victory' ? 1 : 0);
      if (run.outcome === 'victory') wins++;
      for (const [girl, trigger] of [['rikku', 'stop-lands'], ['yuna', 'stop-lands-yuna'], ['paine', 'stop-lands-paine']] as const) {
        const stopped = run.log.some((e) => e.type === 'status-add' && (e as { targetId?: string }).targetId === girl && (e as { status?: string }).status === 'stop');
        expect(names.filter((n) => n === trigger).length, `seed ${seed} ${girl}`).toBe(stopped ? 1 : 0);
        if (stopped) stops++;
      }
    }
    expect(wins).toBeGreaterThan(0);
    expect(stops).toBeGreaterThan(0);
    console.info(`[fallen-aeons story] Shiva: ${wins}/${SHIVA_SEEDS.length} wins; Stop landed in ${stops}`);
  });

  it('the Sisters: the entrance once; the first fall once, after the first KO, and only if one falls', () => {
    let falls = 0;
    for (const seed of SEEDS) {
      const run = driveLink(ROAD_SISTERS, LINES.sistersDarknessDispel, seed, { triggers: S.mid });
      const names = fired(run.log);
      expect(names.filter((n) => n === 'sisters-entrance'), `seed ${seed}`).toHaveLength(1);
      const firstKo = run.log.findIndex((e) => e.type === 'ko' && ['sandy', 'cindy', 'mindy'].includes((e as { targetId?: string }).targetId ?? ''));
      const down = run.log.findIndex((e) => e.type === 'script-trigger' && (e as { name: string }).name === SISTERS_FIRST_DOWN);
      const count = names.filter((n) => n === SISTERS_FIRST_DOWN).length;
      expect(count, `seed ${seed}`).toBeLessThanOrEqual(1);
      if (down >= 0) {
        expect(firstKo, `seed ${seed}`).toBeGreaterThanOrEqual(0);
        expect(down, `seed ${seed}`).toBeGreaterThan(firstKo);
        falls++;
      } else if (run.outcome !== 'victory') {
        // A loss before any sister fell: no callout.
        expect(firstKo < 0 || run.outcome === undefined, `seed ${seed}`).toBe(true);
      }
    }
    expect(falls).toBeGreaterThan(0);
    console.info(`[fallen-aeons story] Sisters: the first-fall callout in ${falls}/${SEEDS.length}`);
  });

  it('Anima: the entrance once; the third Pain once, as she picks it; half HP once when she crosses it', () => {
    let thirds = 0;
    for (const seed of SEEDS) {
      const run = driveLink(ROAD_ANIMA, LINES.animaIntended, seed, { triggers: S.mid });
      const names = fired(run.log);
      expect(names.filter((n) => n === 'anima-entrance'), `seed ${seed}`).toHaveLength(1);
      const pains = run.log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'x2-anima-pain');
      const third = names.filter((n) => n === ANIMA_THIRD_PAIN).length;
      // Emitted when she picks it, so a battle may end between the pick and the swing.
      expect(third, `seed ${seed}`).toBe(pains.length >= 3 ? 1 : third);
      expect(third, `seed ${seed}`).toBeLessThanOrEqual(1);
      if (third) {
        thirds++;
        const at = run.log.findIndex((e) => e.type === 'script-trigger' && (e as { name: string }).name === ANIMA_THIRD_PAIN);
        const before = run.log.slice(0, at).filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'x2-anima-pain');
        expect(before.length, `seed ${seed}`).toBe(2);
      }
      expect(names.filter((n) => n === 'anima-half').length, `seed ${seed}`).toBe(run.outcome === 'victory' ? 1 : names.includes('anima-half') ? 1 : 0);
    }
    expect(thirds).toBeGreaterThan(0);
    console.info(`[fallen-aeons story] Anima: the third-Pain callout in ${thirds}/${SEEDS.length}`);
  });
});
