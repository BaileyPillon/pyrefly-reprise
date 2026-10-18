/**
 * **Chapter XIV — the rules of the duel (FFX only)**: the mirror lock (I-G2),
 * "only aeons can fight them" (I-G4, B6 = a), no Items on an aeon (every FFX battle since PR-0155), the
 * loss (I-G3, B11 = a, review E11), the solo line-up (I-G1), Isaaru the
 * bystander (I-G5), the three-link chain and its carry, the 5,000 AP (B13 = a),
 * the registration (unlisted), and the absence of every rule elsewhere
 * (`docs/plans/chapter-isaaru-review.md` §9).
 */

import { describe, expect, it } from 'vitest';
import type { AeonBuild, Command, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { AEONS_ONLY_FLAG, AEON_LOCK_PREFIX, ONLY_AN_AEON } from '../../../src/battle/ffx/aeon-duel.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { viaPurificoBuild } from '../../../src/data/ffx/builds/via-purifico.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { checkpointAt } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import {
  GROTHIA, ISAARU, LINKS, actor, content, drive, enabledRow, grandSummon, newEngine, nextInput, pass, row, runChain, setupFor, summon,
} from '../helpers/isaaruUnits.ts';

/** The shipped build with some aeons' HP set (0 = KO'd before this link). */
function withAeonHp(hp: Partial<Record<AeonBuild['id'], number>>): FFXPartyBuild {
  return { ...viaPurificoBuild, aeons: viaPurificoBuild.aeons.map((a) => (a.id in hp ? { ...a, hp: hp[a.id]! } : a)) };
}

describe('the solo line-up (I-G1) and Isaaru (I-G5)', () => {
  it('Yuna alone on the field, no bench, no Switch row, no Flee', () => {
    const engine = newEngine('isaaru-grothia', 1);
    expect(engine.state().activeIds).toEqual(['yuna']);
    expect(engine.state().reserveIds).toEqual([]);
    const d = nextInput(engine)!;
    expect(d.actorId).toBe('yuna');
    expect(d.commands.some((c) => c.command.kind === 'switch' || c.command.kind === 'escape')).toBe(false);
  });

  it('Isaaru never blocks the victory: the link ends when the aeon falls', () => {
    const engine = newEngine('isaaru-grothia', 2);
    actor(engine, GROTHIA).hp = 1;
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('ixion') : { kind: 'attack', targets: [GROTHIA] }));
    expect(engine.state().result?.outcome).toBe('victory');
    expect(actor(engine, ISAARU).hp).toBe(10);
    expect(engine.state().result?.nextGroupId).toBe('isaaru-pterya');
  });
});

describe('the mirror lock (I-G2)', () => {
  it.each([
    ['isaaru-grothia', 'ifrit', 'Mirror of Grothia'],
    ['isaaru-pterya', 'valefor', 'Mirror of Pterya'],
    ['isaaru-spathi', 'bahamut', 'Mirror of Spathi'],
  ] as const)('%s: %s is greyed "%s", refused if submitted, and not a Grand Summon choice', (link, locked, reason) => {
    const engine = newEngine(link, 3);
    expect(engine.state().flags[AEON_LOCK_PREFIX + locked]).toBeDefined();
    const d = nextInput(engine)!;
    expect(d.actorId).toBe('yuna');
    const r = row(d.commands, 'summon', locked)!;
    expect(r).toMatchObject({ enabled: false, disabledReason: reason });
    const free = d.commands.filter((c) => c.enabled && c.command.kind === 'summon').map((c) => ('id' in c.command ? c.command.id : ''));
    expect(free).toHaveLength(4);
    expect(free).not.toContain(locked);
    const before = engine.state().log.length;
    const refused = engine.submit(summon(locked));
    expect(refused.some((e) => e.type === 'message' && e.text === reason)).toBe(true);
    expect(engine.state().aeonId).toBeNull();
    expect(engine.submit(grandSummon(locked)).some((e) => e.type === 'message' && e.text === reason)).toBe(true);
    expect(actor(engine, 'yuna').overdrive?.gauge).toBe(100); // the refusal spent nothing
    expect(engine.state().log.length).toBeGreaterThan(before);
  });
});

describe('only aeons can fight them (B6 = a); aeons carry no items (every FFX battle, PR-0155)', () => {
  it("Yuna's menu is Summon and Grand Summon (RC10: the script switches off her Attack, Item, Skill, Special and both magics); Talk, which no script touches, keeps its older greyed row; no Defend row", () => {
    const d = nextInput(newEngine('isaaru-grothia', 4))!;
    // Only these kinds of row exist for her: five Summon rows (one locked, greyed), Grand Summon, and Talk (greyed by the older B6 = a estimate, `aeon-duel.ts`; no Isaaru script touches command 0x3105).
    const kinds = d.commands.map((c) => c.command.kind);
    expect(kinds.filter((k) => k === 'summon')).toHaveLength(5);
    expect(new Set(kinds)).toEqual(new Set(['summon', 'overdrive', 'trigger']));
    expect(row(d.commands, 'trigger', 'talk')).toMatchObject({ enabled: false, disabledReason: ONLY_AN_AEON });
    for (const [kind, id] of [['overdrive', 'grand-summon'], ['summon', 'shiva']] as const) {
      expect(enabledRow(d.commands, kind, id), `${kind}:${id}`).toBeDefined();
    }
    // Gone, not greyed: the Attack, the White Magic list (Cura, NulBlaze), the Special list (Pray, Scan) and every Item row (a potion, a Phoenix Down, a Grenade).
    for (const [kind, id] of [['attack', undefined], ['ability', 'cura'], ['ability', 'nulblaze'], ['ability', 'pray'], ['ability', 'scan'], ['item', 'hi-potion'], ['item', 'phoenix-down'],
      ['item', 'grenade']] as const) {
      expect(row(d.commands, kind, id), `${kind}:${id}`).toBeUndefined();
    }
    const menuCategories = d.commands.filter((c) => c.command.kind !== 'trigger').map((c) => c.category);
    expect(new Set(menuCategories)).toEqual(new Set(['summon', 'overdrive']));
    // The formation script calls setDefendingEnabled(0): the party's Defend control does nothing here (formation-flags.ts, RC10).
    expect(row(d.commands, 'defend')).toBeUndefined();
  });

  it('every command the script switched off is refused if it is submitted: no event, the turn stays open; an aeon has no Items row and an item from it is refused', () => {
    const engine = newEngine('isaaru-grothia', 5);
    let d = nextInput(engine)!;
    const before = engine.state().log.length;
    for (const refused of [
      { kind: 'attack', targets: [GROTHIA] }, { kind: 'ability', id: 'cura', targets: ['yuna'] }, { kind: 'ability', id: 'pray', targets: ['yuna'] },
      { kind: 'item', id: 'hi-potion', targets: ['yuna'] }, { kind: 'item', id: 'grenade', targets: [GROTHIA] },
    ] as Command[]) {
      expect(engine.submit(refused), JSON.stringify(refused)).toEqual([]);
    }
    expect(engine.state().log.length).toBe(before); // nothing was spent, said or drawn
    d = nextInput(engine)!;
    expect(d.actorId).toBe('yuna');
    engine.submit(summon('shiva'));
    d = nextInput(engine)!;
    expect(d.actorId).toBe('shiva');
    expect(d.commands.some((c) => c.command.kind === 'item')).toBe(false);
    expect(engine.submit({ kind: 'item', id: 'potion', targets: ['shiva'] }).some((e) => e.type === 'message' && e.text === 'Shiva cannot use items')).toBe(true);
  });

  it('Threaten fails on them (B10): Heavenly Strike lands no Threaten', () => {
    const engine = newEngine('isaaru-grothia', 6);
    drive(engine, (d) => (d.actorId === 'yuna' ? grandSummon('shiva') : d.actorId === 'shiva' && actor(engine, GROTHIA).overdrive!.gauge >= 97
      ? { kind: 'ability', id: 'shield', targets: ['shiva'] } : { kind: 'ability', id: 'heavenly-strike', targets: [GROTHIA] }),
    (e) => e.state().log.filter((x) => x.type === 'action-start' && x.abilityId === 'heavenly-strike').length >= 3);
    expect(engine.state().log.some((e) => e.type === 'status-add' && e.targetId === GROTHIA)).toBe(false);
  });

  it('NulBlaze cancels Hellfire (§3.1, a Fire element on a NulBlazed aeon)', () => {
    const engine = newEngine('isaaru-grothia', 8);
    drive(engine, (d) => {
      if (d.actorId === 'yuna') return summon('ixion');
      actor(engine, 'ixion').statuses.nulblaze = { id: 'nulblaze', turnsRemaining: null, ticksRemaining: null, charges: 1, stacks: 0, permanent: false };
      return pass(d);
    }, (e) => e.state().log.some((x) => x.type === 'action-start' && x.abilityId === 'grothia-hellfire'));
    drive(engine, (d) => pass(d), (e) => e.state().log.some((x) => x.type === 'miss' && x.sourceId === GROTHIA));
    const log = engine.state().log;
    const hf = log.findIndex((e) => e.type === 'action-start' && e.abilityId === 'grothia-hellfire');
    const after = log.slice(hf, hf + 4);
    expect(after.some((e) => e.type === 'miss' && e.reason === 'nullified')).toBe(true);
    expect(after.some((e) => e.type === 'damage' && e.targetId === 'ixion')).toBe(false);
  });
});

describe('the loss (I-G3, B11 = a, review E11)', () => {
  it('no aeon left to summon is a defeat at once, never the 400-turn stalemate escape', () => {
    // Pterya's link with every free aeon already down: before RC10 Yuna could heal
    // through her weak hits for ever; the duel ends her instead.
    const engine = newEngine('isaaru-pterya', 9, withAeonHp({ ifrit: 0, ixion: 0, shiva: 0, bahamut: 0 }));
    // Yuna never gets a menu: the loss is called before her first turn (and, RC10, she has no Cura to wait with in any case).
    expect(nextInput(engine)).toBeNull();
    expect(engine.state().result?.outcome).toBe('defeat');
    expect(engine.state().turn).toBeLessThan(5);
  });

  it('the last free aeon falling mid-link is a defeat', () => {
    const engine = newEngine('isaaru-grothia', 10, withAeonHp({ valefor: 0, ixion: 0, bahamut: 0 }));
    drive(engine, (d) => (d.actorId === 'yuna' ? summon('shiva') : { kind: 'attack', targets: [GROTHIA] }));
    const st = engine.state();
    expect(st.result?.outcome).toBe('defeat');
    expect(st.log.some((e) => e.type === 'dismiss' && e.reason === 'ko')).toBe(true);
    expect(actor(engine, 'yuna').hp).toBeGreaterThan(0);
  });

  it("Yuna's KO is a defeat", () => {
    // RC10: Yuna must summon at her first turn (her menu is Summon and Grand Summon), so Grothia's attack on a lone Yuna no longer comes before an aeon is out; the rule
    // under test is the engine's end check, so she is KO'd directly. (Her aeon's falling is "the last free aeon falling mid-link", above.)
    const engine = newEngine('isaaru-grothia', 11);
    actor(engine, 'yuna').hp = 0;
    actor(engine, 'yuna').alive = false;
    expect(nextInput(engine)).toBeNull();
    expect(engine.state().result?.outcome).toBe('defeat');
    expect(actor(engine, 'yuna').hp).toBe(0);
  });
});

describe('the chain (research §1.2, §4.4)', () => {
  it('a KO carries: an aeon lost to Grothia is not offered against Pterya; HP, MP and gauges carry', () => {
    let lost = false;
    const runs = runChain(12, (link, engine, d) => {
      if (link === 'isaaru-grothia') {
        if (d.actorId === 'yuna') return lost ? summon('ixion') : summon('valefor');
        if (d.actorId === 'valefor') { lost = true; return pass(d); } // no Shield: Hellfire kills him
        actor(engine, GROTHIA).hp = 1;
        return { kind: 'attack', targets: [GROTHIA] };
      }
      return d.actorId === 'yuna' ? summon('ixion') : pass(d);
    });
    expect(runs[0]!.outcome).toBe('victory');
    const end1 = runs[0]!.state;
    expect(end1.combatants['valefor']!.hp).toBe(0);
    const carried = setupForNextLink(setupFor('isaaru-grothia', 12), ENEMY_GROUPS_BY_ID['isaaru-pterya']!, end1, 13).party as FFXPartyBuild;
    const aeon = (id: string) => carried.aeons.find((a) => a.id === id)!;
    expect(aeon('valefor').hp).toBe(0);
    expect(aeon('ixion').hp).toBe(end1.combatants['ixion']!.hp);
    expect(aeon('ixion').overdriveGauge).toBe((end1.combatants['ixion'] as FFXCombatant).overdrive?.gauge);
    expect(carried.members[0]!.hp).toBe(end1.combatants['yuna']!.hp);
    // Link 2 never offers the fallen Valefor (he is also Pterya's mirror) and never summons him.
    const link2 = runs[1]!.state;
    expect(link2.log.some((e) => e.type === 'summon' && e.aeonId === 'valefor')).toBe(false);
    expect(link2.combatants['valefor']!.hp).toBe(0);
  });

  it('link 2 opens with the carried state: Valefor is locked, Ifrit free, a KO stays down', () => {
    const party = withAeonHp({ shiva: 0 });
    const engine = newEngine('isaaru-pterya', 13, party);
    const d = nextInput(engine)!;
    const summons = d.commands.filter((c) => c.command.kind === 'summon').map((c) => [('id' in c.command ? c.command.id : ''), c.enabled]);
    expect(summons).toEqual([['valefor', false], ['ifrit', true], ['ixion', true], ['bahamut', true]]);
  });

  it('the 5,000 AP is paid on the last link only; no link has a retry checkpoint (B12 = a)', () => {
    for (const [i, link] of LINKS.entries()) {
      // Seed 14 -> 15 on 2026-10-08 (re-parity W1, FFX only): the engine now draws hit, variance and critical in the
      // game's order, so seed 14's Ixion misses Grothia once and Hellfire ends the duel; seed 15 is the first that wins
      // all three links with the aeon's plain Attack.
      const engine = newEngine(link, 15);
      const foe = engine.state().enemyIds.find((id) => id !== ISAARU)!;
      actor(engine, foe).hp = 1;
      drive(engine, (d) => (d.actorId === 'yuna' ? summon(link === 'isaaru-grothia' ? 'ixion' : 'shiva') : { kind: 'attack', targets: [foe] }));
      expect(engine.state().result?.outcome).toBe('victory');
      expect(engine.state().result?.ap).toBe(i === 2 ? 5_000 : 0);
      expect(checkpointAt(i + 1, ENEMY_GROUPS_BY_ID[link]!, setupFor(link, 1))).toBeNull();
    }
  });
});

describe('registration: Chapter XIV, listed 2026-09-25', () => {
  it('reachable by id, on chapter select after Chapter XIII, number 14, FFX, opens on Grothia with the solo build', () => {
    const ch = getChapter('isaaru-via-purifico');
    expect(ch).toMatchObject({ game: 'ffx', number: 14, title: 'Isaaru' });
    expect(ch?.enemyGroupRef.id).toBe('isaaru-grothia');
    expect(ch?.buildRef).toBe(viaPurificoBuild);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).not.toContain('isaaru-via-purifico');
    expect(CHAPTERS.map((c) => c.id).at(-6)).toBe('isaaru-via-purifico'); // XV follows (listed 2026-09-26), XVI (2026-09-27), XVII and XVIII (2026-09-29)
    expect(CHAPTER_IDS.at(-6)).toBe('isaaru-via-purifico');
    expect(ch?.scriptsRef.pre.at(-1)).toEqual({ type: 'battleStart' });
  });
});

describe('absence (rule 14, CHK-021): no other formation carries a duel rule', () => {
  it('every other FFX formation leaves the flags off, and a battle of it publishes none', () => {
    const others = Object.values(ENEMY_GROUPS_BY_ID).filter((g: EnemyGroupDef) => !g.id.startsWith('isaaru-'));
    expect(others.length).toBeGreaterThan(8);
    for (const g of others) {
      expect(g.aeonsOnly, g.id).toBeUndefined();
      expect(g.lockedAeons, g.id).toBeUndefined();
      expect(g.victoryBonusAp, g.id).toBeUndefined();
    }
    for (const id of ['seymour-flux', 'seymour-anima-macalania', 'seymour-natus'] as const) {
      const ch = getChapter(id)!;
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: ch.buildRef, enemies: ch.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      nextInput(engine);
      const keys = Object.keys(engine.state().flags);
      expect(keys.filter((k) => k.startsWith('aeonDuel') || k === AEONS_ONLY_FLAG || k.startsWith('victory.')), id).toEqual([]);
    }
  });
});
