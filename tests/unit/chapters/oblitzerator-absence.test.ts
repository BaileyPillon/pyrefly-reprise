/**
 * The hidden Oblitzerator chapter's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). The two scripts, their `oblitzerator.*` flags, the crane's state and Tidus's Use
 * crane are set up by this formation's own script ids and by nothing else. For every other formation in the data layer: no `oblitzerator.*` flag after the opening decisions, no Use crane row on any menu, no group using
 * either script, and no other enemy named like them. The layering is pinned too: no FFX-2 file imports any of the new files, and the battle layer imports no `src/data`, no DOM and no three.js. The full unit suite is the
 * proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { registeredTriggerIds } from '../../../src/battle/ffx/ai/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { defend } from '../helpers/oblitzeratorDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'oblitzerator');
const SCRIPTS = ['oblitzerator', 'luca-crane'];

describe('no other formation gets the Oblitzerator\'s or the crane\'s scripts', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('both script ids are registered (the crane with hooks, the Oblitzerator with hooks), Use crane is a registered trigger, and only this formation\'s two name the scripts', () => {
    for (const id of SCRIPTS) {
      expect(registeredAiScriptIds()).toContain(id);
      expect(registeredHookScriptIds()).toContain(id);
    }
    expect(registeredTriggerIds()).toContain('use-crane');
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(SCRIPTS, `${id}: ${e.id}`).not.toContain(e.aiScriptId);
        for (const f of e.forms) expect(SCRIPTS, `${id}: ${e.id} form`).not.toContain(f.aiScriptId);
        expect(['oblitzerator', 'luca-crane'], `${id}: ${e.id}`).not.toContain(e.id);
      }
    }
  });

  it('each plays its opening decisions with no oblitzerator.* flag set and no Use crane row on any menu', () => {
    let looked = 0;
    for (const [id, group] of others) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      for (let step = 0; step < 6; step++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        looked++;
        expect(d.commands.some((c) => c.command.kind === 'trigger' && c.command.id === 'use-crane'), `${id}: ${d.actorId} has Use crane`).toBe(false);
        engine.submit(defend());
      }
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('oblitzerator.')), `${id}: oblitzerator flags`).toEqual([]);
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
  const NEW_BATTLE = ['src/battle/ffx/ai/oblitzerator.ts', 'src/battle/ffx/ai/oblitzerator-rules.ts', 'src/battle/ffx/ai/luca-crane.ts'];

  it('the battle files import no src/data, no DOM and no three', () => {
    for (const f of NEW_BATTLE) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/from '(?:\.\.\/)+data\//);
      expect(text, f).not.toMatch(/from 'three'/);
      expect(text, f).not.toMatch(/\bdocument\b|\bwindow\b/);
    }
  });

  it('no FFX-2 file (src/battle/ffx2, src/data/ffx2) imports any of the new FFX-only files', () => {
    const names = ['oblitzerator', 'luca-crane', 'oblitzerator-abilities', 'oblitzerator-rules', 'oblitzerator-ids', 'chapter-oblitzerator', 'luca'];
    const re = new RegExp(`from '[^']*/(?:${names.join('|')})\\.ts'`);
    for (const f of [...files('src/battle/ffx2'), ...files('src/data/ffx2')]) expect(readFileSync(f, 'utf8'), f).not.toMatch(re);
  });

  it('no FF7 file imports them either (the golden suites stay unchanged)', () => {
    const names = ['oblitzerator', 'luca-crane', 'oblitzerator-abilities', 'oblitzerator-rules', 'oblitzerator-ids'];
    const re = new RegExp(`from '[^']*/(?:${names.join('|')})\\.ts'`);
    for (const f of files('src/battle/ff7')) expect(readFileSync(f, 'utf8'), f).not.toMatch(re);
  });

  it('every new source file is under 400 lines (hard rule 7)', () => {
    const NEW = [
      ...NEW_BATTLE, 'src/data/ffx/oblitzerator-ids.ts', 'src/data/ffx/enemies/oblitzerator.ts', 'src/data/ffx/enemies/oblitzerator-abilities.ts', 'src/data/ffx/builds/luca.ts', 'src/data/chapter-oblitzerator.ts',
      'src/data/chapter-meta-oblitzerator.ts', 'src/scenes/luca-dock.ts', 'src/engine/tactics/oblitzerator.ts', 'src/data/guides/oblitzerator.ts', 'src/data/guides/docs/oblitzerator.ts',
      'src/story/scripts/oblitzerator.ts', 'src/app/screens/frontend/blitzDoor.ts',
    ];
    for (const f of NEW) expect(readFileSync(f, 'utf8').split('\n').length, f).toBeLessThan(400);
  });
});
