/**
 * **Chapter XIV — the rules of the duel (FFX only)**: the mirror lock (I-G2),
 * "only aeons can fight them" (I-G4, B6 = a), no Items on an aeon (every FFX battle since PR-0155), the
 * loss (I-G3, B11 = a, review E11), the solo line-up (I-G1), Isaaru the
 * bystander (I-G5), the three-link chain and its carry, the 5,000 AP (B13 = a),
 * the registration (unlisted), and the absence of every rule elsewhere
 * (`docs/plans/chapter-isaaru-review.md` §9).
 */

import { describe, expect, it } from 'vitest';
import type { AeonBuild, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { AEONS_ONLY_FLAG, AEON_LOCK_PREFIX, ONLY_AN_AEON } from '../../../src/battle/ffx/aeon-duel.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { viaPurificoBuild } from '../../../src/data/ffx/builds/via-purifico.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { checkpointAt } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import {
  GROTHIA, ISAARU, LINKS, actor, content, defend, drive, enabledRow, grandSummon, newEngine, nextInput, row, runChain, setupFor, summon,
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
  it("Yuna's Attack, Talk, Scan and Grenade are greyed with the reason; heals, Nul spells, Pray, Summon, Grand Summon and Defend stay open", () => {
    const d = nextInput(newEngine('isaaru-grothia', 4))!;
    for (const [kind, id] of [['attack', undefined], ['trigger', 'talk'], ['ability', 'scan'], ['item', 'grenade']] as const) {
      expect(row(d.commands, kind, id), `${kind}:${id}`).toMatchObject({ enabled: false, disabledReason: ONLY_AN_AEON });
    }
    for (const [kind, id] of [['ability', 'cura'], ['ability', 'nulblaze'], ['ability', 'pray'], ['item', 'hi-potion'], ['item', 'phoenix-down'],
      ['overdrive', 'grand-summon'], ['summon', 'shiva'], ['defend', undefined]] as const) {
      expect(enabledRow(d.commands, kind, id), `${kind}:${id}`).toBeDefined();
    }
  });

  it('a submitted Attack from Yuna is refused and the turn stays open; an aeon has no Items row and an item from it is refused', () => {
    const engine = newEngine('isaaru-grothia', 5);
    let d = nextInput(engine)!;
    const out = engine.submit({ kind: 'attack', targets: [GROTHIA] });
    expect(out.some((e) => e.type === 'message' && e.text === ONLY_AN_AEON)).toBe(true);
    expect(out.some((e) => e.type === 'damage')).toBe(false);
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
      return defend();
    }, (e) => e.state().log.some((x) => x.type === 'action-start' && x.abilityId === 'grothia-hellfire'));
    drive(engine, () => defend(), (e) => e.state().log.some((x) => x.type === 'miss' && x.sourceId === GROTHIA));
    const log = engine.state().log;
    const hf = log.findIndex((e) => e.type === 'action-start' && e.abilityId === 'grothia-hellfire');
    const after = log.slice(hf, hf + 4);
    expect(after.some((e) => e.type === 'miss' && e.reason === 'nullified')).toBe(true);
    expect(after.some((e) => e.type === 'damage' && e.targetId === 'ixion')).toBe(false);
  });
});

describe('the loss (I-G3, B11 = a, review E11)', () => {
  it('no aeon left to summon is a defeat at once, never the 400-turn stalemate escape', () => {
    // Pterya's link with every free aeon already down: Yuna could heal through
    // her weak hits for ever; the duel ends her instead.
    const engine = newEngine('isaaru-pterya', 9, withAeonHp({ ifrit: 0, ixion: 0, shiva: 0, bahamut: 0 }));
    drive(engine, () => ({ kind: 'ability', id: 'cura', targets: ['yuna'] }));
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
    const engine = newEngine('isaaru-grothia', 11);
    actor(engine, 'yuna').hp = 1;
    drive(engine, () => defend());
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
        if (d.actorId === 'valefor') { lost = true; return defend(); } // no Shield: Hellfire kills him
        actor(engine, GROTHIA).hp = 1;
        return { kind: 'attack', targets: [GROTHIA] };
      }
      return d.actorId === 'yuna' ? summon('ixion') : defend();
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
      const engine = newEngine(link, 14);
      const foe = engine.state().enemyIds.find((id) => id !== ISAARU)!;
      actor(engine, foe).hp = 1;
      drive(engine, (d) => (d.actorId === 'yuna' ? summon(link === 'isaaru-grothia' ? 'ixion' : 'shiva') : { kind: 'attack', targets: [foe] }));
      expect(engine.state().result?.outcome).toBe('victory');
      expect(engine.state().result?.ap).toBe(i === 2 ? 5_000 : 0);
      expect(checkpointAt(i + 1, ENEMY_GROUPS_BY_ID[link]!, setupFor(link, 1))).toBeNull();
    }
  });
});

describe('registration: Chapter XIV, unlisted', () => {
  it('reachable by id, not on chapter select, number 14, FFX, opens on Grothia with the solo build', () => {
    const ch = getChapter('isaaru-via-purifico');
    expect(ch).toMatchObject({ game: 'ffx', number: 14, title: 'Isaaru' });
    expect(ch?.enemyGroupRef.id).toBe('isaaru-grothia');
    expect(ch?.buildRef).toBe(viaPurificoBuild);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toContain('isaaru-via-purifico');
    expect(CHAPTERS.map((c) => c.id)).not.toContain('isaaru-via-purifico');
    expect(CHAPTER_IDS).not.toContain('isaaru-via-purifico');
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
