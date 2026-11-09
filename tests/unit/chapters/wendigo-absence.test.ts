/**
 * The hidden Wendigo chapter's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). The two scripts, their `wendigo.*` flags and their state are set up by this formation's
 * own script ids and by nothing else. For every other formation in the data layer: no `wendigo.*` flag after the opening decisions, no group using either script, and no other enemy named like them. The Temple's Guardians
 * (`m141`, Chapter VII) are a different monster: their script and flags are untouched. The new layering is pinned too: no FFX-2 file imports any of the new files, and the battle layer imports no `src/data`, no DOM and no
 * three.js. The full unit suite is the proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite.
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
import { defend } from '../helpers/wendigoDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'wendigo');
const SCRIPTS = ['wendigo', 'lake-guardian'];

describe('no other formation gets Wendigo\'s or the Lake Guardians\' scripts', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('both script ids are registered, with hooks, and only this formation\'s three name them', () => {
    for (const id of SCRIPTS) {
      expect(registeredAiScriptIds()).toContain(id);
      expect(registeredHookScriptIds()).toContain(id);
    }
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(SCRIPTS, `${id}: ${e.id}`).not.toContain(e.aiScriptId);
        for (const f of e.forms) expect(SCRIPTS, `${id}: ${e.id} form`).not.toContain(f.aiScriptId);
      }
    }
  });

  it('the Temple\'s Guardians (Chapter VII) keep their own script and ids: another record\'s', () => {
    const temple = ENEMY_GROUPS_BY_ID['seymour-anima-macalania'] ?? Object.values(ENEMY_GROUPS_BY_ID).find((g) => g.enemies.some((e) => e.id === 'guado-guardian-a'));
    expect(temple).toBeDefined();
    const guardian = temple!.enemies.find((e) => e.id === 'guado-guardian-a')!;
    expect(guardian.aiScriptId).toBe('guado-guardian-macalania');
    expect(guardian.threatenChance).toBe(100); // m141; the Lake Guardians' is 0
    expect(temple!.enemies.map((e) => e.id)).not.toContain('wendigo');
  });

  it('each plays its opening decisions with no wendigo.* flag set', () => {
    let looked = 0;
    for (const [id, group] of others) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      for (let step = 0; step < 6; step++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        looked++;
        engine.submit(defend());
      }
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('wendigo.')), `${id}: wendigo flags`).toEqual([]);
    }
    expect(looked).toBeGreaterThan(30);
  });
});

/** Every `.ts` file under `dir`, recursively. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('layering (hard rule 1) and the game case (hard rule 14)', () => {
  const NEW_BATTLE = ['src/battle/ffx/ai/wendigo.ts', 'src/battle/ffx/ai/wendigo-rules.ts', 'src/battle/ffx/ai/lake-guardian.ts'];

  it('the battle files import no src/data, no DOM and no three', () => {
    for (const f of NEW_BATTLE) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/from '(?:\.\.\/)+data\//);
      expect(text, f).not.toMatch(/from 'three'/);
      expect(text, f).not.toMatch(/\bdocument\b|\bwindow\b/);
    }
  });

  it('no FFX-2 file (src/battle/ffx2, src/data/ffx2) imports any of the new FFX-only files', () => {
    const names = ['wendigo', 'lake-guardian', 'wendigo-abilities', 'wendigo-rules', 'wendigo-ids', 'chapter-wendigo'];
    const re = new RegExp(`from '[^']*/(?:${names.join('|')})\\.ts'`);
    for (const f of [...files('src/battle/ffx2'), ...files('src/data/ffx2')]) expect(readFileSync(f, 'utf8'), f).not.toMatch(re);
  });

  it('every new source file is under 400 lines (hard rule 7)', () => {
    const NEW = [
      ...NEW_BATTLE, 'src/data/ffx/wendigo-ids.ts', 'src/data/ffx/enemies/wendigo.ts', 'src/data/ffx/enemies/wendigo-abilities.ts', 'src/data/ffx/builds/wendigo.ts', 'src/data/chapter-wendigo.ts',
      'src/data/chapter-meta-wendigo.ts', 'src/scenes/wendigo-lake.ts', 'src/engine/tactics/wendigo.ts', 'src/data/guides/wendigo.ts', 'src/data/guides/docs/wendigo.ts',
      'src/story/scripts/wendigo.ts', 'src/app/screens/frontend/wendigoDoor.ts',
    ];
    for (const f of NEW) expect(readFileSync(f, 'utf8').split('\n').length, f).toBeLessThan(400);
  });
});
