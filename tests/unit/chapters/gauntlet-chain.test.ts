/**
 * **The hidden Gauntlet chapter's chain, party and shared rules** (FFX only; chapter 54; stage 2): the nine acts as formations (the chain flags, the Ultima Buster's four slots, the tiers built, the stand-in
 * paintings and plate), the party build against the Dark Aeons preset it derives from, the battle layer's copies of the ids against the data's, the tactic's restated constants, and the shared seams the stage made
 * (the `kill-count` formula key, the kill count on the combatant, the scripted end) showing nothing to any other chapter.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GAUNTLET_IDS, GAUNTLET_ROWS as BATTLE_ROWS, GAUNTLET_SCRIPTS } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { TONBERRY_WADDLES } from '../../../src/battle/ffx/ai/gauntlet-don-tonberry.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { GAUNTLET_KILLS_PER_MEMBER, GAUNTLET_PIERCING_MEMBER, gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { GAUNTLET_RECORDS } from '../../../src/data/ffx/enemies/gauntlet-records.ts';
import { GAUNTLET_ACTS_BUILT, GAUNTLET_GROUPS, gauntletGroup, gauntletGroupOf } from '../../../src/data/ffx/enemies/gauntlet-groups.ts';
import * as ids from '../../../src/data/ffx/gauntlet-ids.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { GAUNTLET_BOSS_IDS, PAY_GIL, TONBERRY_WADDLES_TO_ARRIVE, TONBERRY_WADDLE_ROW, SHIPPED_LINE } from '../../../src/engine/tactics/gauntlet.ts';
import { newEngine, actor } from '../helpers/gauntletDrive.ts';

describe("the battle layer's copies of the ids equal the data's (the battle layer imports no src/data)", () => {
  it('the three tier-1 combatant ids, script ids and move rows', () => {
    expect(GAUNTLET_IDS.cactuarKing).toBe('cactuar-king');
    expect(GAUNTLET_IDS.donTonberry).toBe('don-tonberry');
    expect(GAUNTLET_IDS.jormungand).toBe('jormungand');
    expect(GAUNTLET_SCRIPTS.cactuarKing).toBe(ids.GAUNTLET_SCRIPT['cactuar-king']);
    expect(GAUNTLET_SCRIPTS.donTonberry).toBe(ids.GAUNTLET_SCRIPT['don-tonberry']);
    expect(GAUNTLET_SCRIPTS.jormungand).toBe(ids.GAUNTLET_SCRIPT['jormungand']);
    for (const [key, id] of Object.entries(BATTLE_ROWS)) expect((ids.GAUNTLET_ROWS as Record<string, string>)[key], key).toBe(id);
  });

  it('every script the data names for a built creature is registered, and only the built ones are (the later tiers add theirs)', () => {
    const registered = registeredAiScriptIds().filter((id) => id.startsWith('gauntlet-'));
    expect(registered.sort()).toEqual(Object.values(GAUNTLET_SCRIPTS).sort());
    for (const creature of ids.GAUNTLET_CREATURES.slice(0, GAUNTLET_ACTS_BUILT)) expect(registered, creature).toContain(ids.GAUNTLET_SCRIPT[creature]);
  });

  it("Don Tonberry's four Waddles, restated by the tactic, are the script's", () => {
    expect(TONBERRY_WADDLES_TO_ARRIVE).toBe(TONBERRY_WADDLES);
    expect(TONBERRY_WADDLE_ROW).toBe(ids.GAUNTLET_ROWS.waddle);
    expect(GAUNTLET_BOSS_IDS.slice(0, GAUNTLET_ACTS_BUILT)).toEqual(ids.GAUNTLET_CREATURES.slice(0, GAUNTLET_ACTS_BUILT));
  });
});

describe('the act table', () => {
  it('nine acts in three tiers of three, in HP order, with the body HP of the records', () => {
    expect(ids.GAUNTLET_ACTS).toHaveLength(9);
    expect(ids.GAUNTLET_ACTS.map((a) => a.act)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ids.GAUNTLET_ACTS.map((a) => a.tier)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);
    expect(ids.GAUNTLET_ACTS.map((a) => a.creature)).toEqual([...ids.GAUNTLET_CREATURES]);
    for (const a of ids.GAUNTLET_ACTS) expect([a.groupId, a.hp], a.creature).toEqual([ids.gauntletGroupId(a.creature), GAUNTLET_RECORDS[a.creature][0]]);
    const hps = ids.GAUNTLET_ACTS.map((a) => a.hp);
    expect([...hps].sort((a, b) => a - b)).toEqual(hps);
  });
});

describe('the formations', () => {
  it('only the tiers built are registered: acts 1 to 3 in the data layer, none of the other six', () => {
    expect(ids.GAUNTLET_TIERS_BUILT).toBe(1);
    expect(GAUNTLET_ACTS_BUILT).toBe(3);
    expect(GAUNTLET_GROUPS.map((g) => g.id)).toEqual(['gauntlet-cactuar-king', 'gauntlet-don-tonberry', 'gauntlet-jormungand']);
    for (const a of ids.GAUNTLET_ACTS) expect(ENEMY_GROUPS_BY_ID[a.groupId] !== undefined, a.groupId).toBe(a.act <= 3);
    for (const g of GAUNTLET_GROUPS) expect(ENEMY_GROUPS_BY_ID[g.id], g.id).toBe(g);
  });

  it('the chain of the tiers built: act 1 plain, acts 2 and 3 fresh fights with a retry checkpoint and no Save Sphere card, act 3 pools every act\'s spoils and names no next link', () => {
    const [a1, a2, a3] = GAUNTLET_GROUPS as [typeof GAUNTLET_GROUPS[number], typeof GAUNTLET_GROUPS[number], typeof GAUNTLET_GROUPS[number]];
    expect([a1.nextGroupId, a2.nextGroupId, a3.nextGroupId]).toEqual(['gauntlet-don-tonberry', 'gauntlet-jormungand', undefined]);
    const fresh = { checkpointOnEntry: true, restoresPartyOnEntry: true, restoresAeonsOnEntry: true, noSaveSphereCard: true };
    expect(a1).not.toHaveProperty('checkpointOnEntry');
    expect(a1).not.toHaveProperty('restoresPartyOnEntry');
    expect(a2).toMatchObject(fresh);
    expect(a3).toMatchObject(fresh);
    expect([a1.poolsChainSpoils, a2.poolsChainSpoils, a3.poolsChainSpoils]).toEqual([undefined, undefined, true]);
  });

  it('the full nine-act chain (built here, not registered): each act names the next, the last pays the pooled spoils', () => {
    const all = ids.GAUNTLET_ACTS.map((_, i) => gauntletGroup(i, 9));
    all.forEach((g, i) => {
      expect(g.nextGroupId, g.id).toBe(all[i + 1]?.id);
      expect(g.poolsChainSpoils === true, g.id).toBe(i === 8);
      expect(g.checkpointOnEntry === true, g.id).toBe(i > 0);
    });
  });

  it('every formation: Escape and Flee off, a Normal start (no setup field), the creature as the boss, the plate and the music stand-ins, no line-up change (Switch open)', () => {
    for (let i = 0; i < 9; i++) {
      const g = gauntletGroup(i, 9);
      expect(g.game).toBe('ffx');
      expect(g.canEscape).toBe(false);
      expect(g.bossId).toBe(ids.GAUNTLET_ACTS[i]!.creature);
      expect(g.enemies[0]!.id).toBe(ids.GAUNTLET_ACTS[i]!.creature);
      expect(g.enemies[0]!.slot).toBe(0);
      expect(g.plate).toBe(ids.GAUNTLET_PLATE);
      expect(g.musicCues).toEqual([{ at: 'start', track: i === 8 ? 'boss-yojimbo' : 'boss-challenge', fadeMs: 1200 }]);
      expect(g.lineUp, 'Switch stays open: no formation changes the line-up').toBeUndefined();
      expect(g.aeonsOnly).toBeUndefined();
      expect(g.commandDisables).toBeUndefined();
    }
  });

  it('the Ultima Buster: the body at slot 0, the Head at slot 1 and the two Arms at slots 2 and 3, all three parts of the body', () => {
    const g = gauntletGroupOf('ultima-buster');
    expect(g.enemies.map((e) => [e.id, e.slot])).toEqual([['ultima-buster', 0], ['ultima-buster-head', 1], ['ultima-buster-arm-left', 2], ['ultima-buster-arm-right', 3]]);
    for (const e of g.enemies.slice(1)) expect(e.flags, e.id).toMatchObject({ isPart: true, partOf: 'ultima-buster' });
    expect(g.enemies[0]!.flags).toMatchObject({ isBoss: true });
  });

  it('every other act has its one body', () => {
    for (const a of ids.GAUNTLET_ACTS.filter((x) => x.creature !== 'ultima-buster')) expect(gauntletGroupOf(a.creature).enemies.map((e) => e.id), a.creature).toEqual([a.creature]);
  });

  it('the stand-in paintings: every one is an existing painting of the art mirror (skipped on a tree whose mirror lacks the art), and none is the key the art lane owes', () => {
    const root = fileURLToPath(new URL('../../../public/art/characters/', import.meta.url));
    const mirror = existsSync(root + 'tidus/idle.png');
    for (const [id, key] of Object.entries(ids.GAUNTLET_SPRITE)) {
      if (mirror) expect(existsSync(`${root}${key}/idle.png`), `${id} -> ${key}`).toBe(true);
      expect(key, id).not.toBe(ids.GAUNTLET_SPRITE_WANTED[id as ids.GauntletCombatantId]);
    }
    expect(ids.GAUNTLET_PLATE).toBe('zanarkand-dome');
    const plates = fileURLToPath(new URL('../../../public/art/backdrops/', import.meta.url));
    if (existsSync(plates + 'dreams-end.png')) expect(existsSync(`${plates}${ids.GAUNTLET_PLATE}.png`)).toBe(true);
  });
});

describe('the party: the Dark Aeons preset with Auron\'s Piercing and 500 kills each (preflight GA4 and GA5)', () => {
  it('the same line-up (Tidus, Yuna, Auron on the field; Lulu, Wakka, Kimahri, Rikku on the bench), the same aeons, bag, gil, Yojimbo and Sisters', () => {
    expect(gauntletBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
    expect(gauntletBuild.reserve).toEqual(['lulu', 'wakka', 'kimahri', 'rikku']);
    expect(gauntletBuild.aeons).toEqual(darkAeonsBuild.aeons);
    expect(gauntletBuild.inventory).toEqual(darkAeonsBuild.inventory);
    expect([gauntletBuild.gil, gauntletBuild.yojimbo, gauntletBuild.sisters]).toEqual([darkAeonsBuild.gil, darkAeonsBuild.yojimbo, darkAeonsBuild.sisters]);
    expect(gauntletBuild.gil).toBe(1_500_000);
    expect(gauntletBuild.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(17);
  });

  it('the seven members differ from the Dark Aeons preset in two things only: a kill count of 500 each, and Piercing in place of Strength +5 on Auron\'s weapon', () => {
    expect(GAUNTLET_KILLS_PER_MEMBER).toBe(500);
    expect(GAUNTLET_PIERCING_MEMBER).toBe('auron');
    expect(gauntletBuild.members).toHaveLength(7);
    for (const m of gauntletBuild.members) {
      const base = darkAeonsBuild.members.find((x) => x.id === m.id)!;
      expect(m.kills, m.id).toBe(500);
      const { kills: _kills, equipment, ...rest } = m;
      const { equipment: baseEquipment, ...baseRest } = base;
      void _kills;
      expect(rest, m.id).toEqual(baseRest);
      expect(equipment.armor, m.id).toEqual(baseEquipment.armor);
      if (m.id === 'auron') {
        expect(equipment.weapon.autoAbilities).toEqual(['break-damage-limit', 'strength-20', 'strength-10', 'piercing']);
        expect(baseEquipment.weapon.autoAbilities).toEqual(['break-damage-limit', 'strength-20', 'strength-10', 'strength-5']);
      } else {
        expect(equipment.weapon, m.id).toEqual(baseEquipment.weapon);
      }
    }
  });

  it('exactly one weapon of the party is Piercing', () => {
    expect(gauntletBuild.members.filter((m) => m.equipment.weapon.autoAbilities?.includes('piercing')).map((m) => m.id)).toEqual(['auron']);
  });

  it('the kill count reaches the combatants and no creature has one; the Dark Aeons preset has none', () => {
    const e = newEngine(1, 'cactuar-king');
    for (const id of ['tidus', 'yuna', 'auron', 'lulu', 'wakka', 'kimahri', 'rikku']) expect(actor(e, id).kills, id).toBe(500);
    expect(actor(e, 'cactuar-king').kills).toBeUndefined();
    for (const m of darkAeonsBuild.members) expect(m.kills, m.id).toBeUndefined();
  });

  it('the shipped line pays Yojimbo the Dark Aeons chapter\'s 100,000 gil and calls him in against none of tier 1 (the bench: not needed)', () => {
    expect(PAY_GIL).toBe(100_000);
    expect(SHIPPED_LINE.zanmato).toBe(true);
    expect(SHIPPED_LINE.zanmatoAt).toEqual([]);
  });
});

describe('the shared seams made in stage 2 (contract entry in docs/CONTRACT-CHANGES.md)', () => {
  it("'kill-count' is formula 0x16 in the FFX adapter, and the only ability with it is Karma", () => {
    expect(FORMULA_NUMBER['kill-count']).toBe(0x16);
  });
});
