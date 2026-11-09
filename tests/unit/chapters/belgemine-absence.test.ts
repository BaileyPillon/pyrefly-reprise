/**
 * The hidden Belgemine's Challenge's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). Its scripts, its `belgemine.*` flags and its gauges are set up by the chapter's own
 * eight formations and script ids and by nothing else. For every other formation in the data layer: no `belgemine.*` flag after the opening decisions, no group using one of its scripts, no other enemy named like one of
 * its bodies, and no enemy carrying its gauge tag. Chapter XIV's Isaaru (whose three aeon files are shared with Belgemine's Ifrit, Valefor and Bahamut) and the Cavern's Yojimbo keep their own scripts and flags. The full unit
 * suite is the proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite. FFX-2 and FF7 have no part in it.
 */

import { describe, expect, it } from 'vitest';
import type { Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { BELG_ACTS, BELG_GAUGE_RULES, BELG_SCRIPTS, BELGEMINE_BYSTANDER_SCRIPT } from '../../../src/data/ffx/belgemine-ids.ts';
import { defend } from '../helpers/belgemineDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const mine = new Set<string>(BELG_ACTS.map((a) => a.groupId));
const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => !mine.has(id));
const SCRIPTS = new Set<string>([...Object.values(BELG_SCRIPTS), BELGEMINE_BYSTANDER_SCRIPT]);

describe('no other formation gets the chapter\'s scripts', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('every script id is registered, and each with hooks except Belgemine and the dog; only this chapter\'s eight formations name one', () => {
    for (const id of SCRIPTS) expect(registeredAiScriptIds(), id).toContain(id);
    for (const id of Object.values(BELG_SCRIPTS).filter((s) => s !== BELG_SCRIPTS.dog)) expect(registeredHookScriptIds(), id).toContain(id);
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(SCRIPTS.has(e.aiScriptId), `${id}: ${e.id}`).toBe(false);
        for (const f of e.forms) expect(SCRIPTS.has(f.aiScriptId ?? ''), `${id}: ${e.id} form`).toBe(false);
        expect(e.id.startsWith('belg'), `${id}: ${e.id}`).toBe(false);
      }
    }
  });

  it('Chapter XIV\'s Isaaru and the Cavern\'s Yojimbo (whose monster files these aeons share) keep their own scripts', () => {
    expect(ENEMY_GROUPS_BY_ID['isaaru-grothia']!.enemies.map((e) => e.aiScriptId)).toEqual(['isaaru-bystander', 'grothia']);
    expect(ENEMY_GROUPS_BY_ID['isaaru-spathi']!.enemies.map((e) => e.aiScriptId)).toEqual(['isaaru-bystander', 'spathi']);
    expect(ENEMY_GROUPS_BY_ID['yojimbo-cavern']!.enemies.some((e) => e.id === 'yojimbo')).toBe(true);
    expect(ENEMY_GROUPS_BY_ID['yojimbo-cavern']!.enemies.map((e) => e.id)).not.toContain('belg-yojimbo');
  });

  it('each plays its opening decisions with no belgemine.* flag set and no gauge of the chapter\'s tag', () => {
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
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('belgemine.')), `${id}: belgemine flags`).toEqual([]);
      for (const c of Object.values(engine.state().combatants)) {
        const od = (c as { overdrive?: { enemyGaugeRules?: string } }).overdrive;
        expect(od?.enemyGaugeRules, `${id}: ${c.id}`).not.toBe(BELG_GAUGE_RULES);
      }
    }
    expect(looked).toBeGreaterThan(30);
  }, 120_000);
});
