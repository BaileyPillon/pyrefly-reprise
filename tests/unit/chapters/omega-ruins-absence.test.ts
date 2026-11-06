/**
 * The hidden Omega Ruins' machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). The three scripts, their `uw.*`, `ow.*` and `nm.*` flags and the Nemesis reply hook are set up
 * by the Weapons' own formations and script ids and by nothing else. For every other formation in the data layer: no such flag after the opening decisions, no group using the scripts, no other enemy named like them, and no
 * other chapter's party carries the chapter's levers. The full unit suite is the proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite. FFX-2 and FF7 have no part in it.
 */

import { describe, expect, it } from 'vitest';

import type { Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { ENDGAME_PHOENIX_DOWNS } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { defend } from '../helpers/omegaRuinsDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const OWN = new Set<string>([ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]);
const SCRIPTS = ['ultima-weapon', 'omega-weapon', 'nemesis'];
const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => !OWN.has(id));

describe('no other formation gets the Weapons\' scripts', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('the script ids are registered once, Nemesis with hooks, and only these formations\' bodies name them', () => {
    for (const id of SCRIPTS) expect(registeredAiScriptIds(), id).toContain(id);
    expect(registeredHookScriptIds()).toContain('nemesis');
    expect(registeredHookScriptIds()).not.toContain('ultima-weapon');
    expect(registeredHookScriptIds()).not.toContain('omega-weapon');
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(SCRIPTS, `${id}: ${e.id}`).not.toContain(e.aiScriptId);
        for (const f of e.forms) expect(SCRIPTS, `${id}: ${e.id} form`).not.toContain(f.aiScriptId ?? '');
      }
    }
  });

  it('each plays its opening decisions with no uw.*, ow.* or nm.* flag set', () => {
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
      expect(Object.keys(engine.state().flags).filter((k) => /^(uw|ow|nm)\./.test(k)), `${id}: flags`).toEqual([]);
    }
    expect(looked).toBeGreaterThan(30);
  });
});

describe('the chapter\'s levers stay in the chapter', () => {
  it('the shared Mirror Aeons preset is untouched: its weapons carry no Piercing and its bag holds its own Phoenix Downs and Turbo Ethers', () => {
    for (const m of mirrorAeonsBuild.members) expect(m.equipment.weapon.autoAbilities, m.id).not.toContain('piercing');
    expect(mirrorAeonsBuild.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(ENDGAME_PHOENIX_DOWNS);
    expect(mirrorAeonsBuild.inventory.find((e) => e.itemId === 'turbo-ether')?.count).toBe(2);
    expect(omegaRuinsBuild).not.toBe(mirrorAeonsBuild);
  });

  it('the chapter\'s own party carries the three levers: Piercing on every weapon (four slots kept, First Strike kept), 26 Phoenix Downs, 6 Turbo Ethers', () => {
    for (const m of omegaRuinsBuild.members) {
      expect(m.equipment.weapon.autoAbilities, m.id).toContain('piercing');
      expect(m.equipment.weapon.autoAbilities, m.id).toHaveLength(m.equipment.weapon.slots);
      expect(m.equipment.weapon.autoAbilities, m.id).toContain('break-damage-limit');
    }
    expect(omegaRuinsBuild.members.find((m) => m.id === 'tidus')!.equipment.weapon.autoAbilities).toContain('first-strike');
    expect(omegaRuinsBuild.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(26);
    expect(omegaRuinsBuild.inventory.find((e) => e.itemId === 'turbo-ether')?.count).toBe(6);
    expect(omegaRuinsBuild.activeSlots).toEqual(['tidus', 'yuna', 'lulu']);
  });
});
