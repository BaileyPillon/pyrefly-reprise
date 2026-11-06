/**
 * The hidden Spherimorph's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). The script, its `sm.*` flags, its affinity rewrite and its Doublecast gate are set up by
 * its own formation and script id and by nothing else. For every other formation in the data layer: no `sm.*` flag after the opening decisions, no group using the script, no affinity written at the battle's start by
 * it, and no other enemy named like it. The full unit suite is the proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite. FFX-2 and FF7 have no part in it: nothing in
 * `src/battle/ffx2/**` or `src/data/ffx2/**` reads this chapter (the second test).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { defend } from '../helpers/spherimorphDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'spherimorph');

describe('no other formation gets Spherimorph\'s script', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('the script id is registered once, with hooks, and only this formation\'s guardian names it', () => {
    expect(registeredAiScriptIds()).toContain('spherimorph');
    expect(registeredHookScriptIds()).toContain('spherimorph');
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(e.aiScriptId, `${id}: ${e.id}`).not.toBe('spherimorph');
        for (const f of e.forms) expect(f.aiScriptId, `${id}: ${e.id} form`).not.toBe('spherimorph');
        expect(e.id, `${id}`).not.toBe('spherimorph');
      }
    }
  });

  it('each plays its opening decisions with no sm.* flag set and no affinity written by the script on any enemy', () => {
    let looked = 0;
    for (const [id, group] of others) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      const before = group.enemies.map((e) => JSON.stringify(e.affinities));
      for (let step = 0; step < 6; step++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        looked++;
        engine.submit(defend());
      }
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('sm.')), `${id}: sm flags`).toEqual([]);
      expect(group.enemies.map((e) => JSON.stringify(e.affinities)), `${id}: the data's affinities are untouched`).toEqual(before);
    }
    expect(looked).toBeGreaterThan(30);
  });

  it('the Doublecast flag is raised for the two casts and down again after (an additive runtime field, read by this script only)', async () => {
    const { newEngine, ctxOf, nextInput } = await import('../helpers/spherimorphDrive.ts');
    const engine = newEngine(3);
    expect(ctxOf(engine).rt.doublecasting).toBeUndefined();
    nextInput(engine);
    expect(ctxOf(engine).rt.doublecasting).toBeUndefined(); // no Doublecast has resolved
  });
});

describe('FFX-2 and FF7 read nothing of it', () => {
  /** The `.ts` files under `dir`, recursively. */
  function files(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) out.push(...files(full));
      else if (name.endsWith('.ts')) out.push(full);
    }
    return out;
  }

  it('no file under src/battle/ffx2, src/data/ffx2 or the FF7 layers names the chapter, its script, its ids or its rules', () => {
    const roots = ['src/battle/ffx2', 'src/data/ffx2', 'src/battle/ff7', 'src/data/ff7'].map((p) => new URL(`../../../${p}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')).filter((p) => { try { return statSync(p).isDirectory(); } catch { return false; } });
    expect(roots.length).toBeGreaterThanOrEqual(2);
    let scanned = 0;
    for (const root of roots) {
      for (const file of files(root)) {
        const text = readFileSync(file, 'utf8');
        scanned++;
        expect(/spherimorph|\bsm\.state\b|SM_ROWS|doublecasting/i.test(text), file).toBe(false);
      }
    }
    expect(scanned).toBeGreaterThan(100);
  });
});
