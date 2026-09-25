/**
 * **Chapter XII — Seymour Omnis: registration, data and the discs.** One case
 * per research row (`research/ffx-seymour-omnis.md`, the preflight's §9
 * acceptance list): the opening four Firaga and the Ice weakness, the -ra /
 * -ga tier by count, one spell per living member plus a random one, the discs
 * turning left and right, who reaches a disc, and the discs owning no turn.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { gardenOfPainBuild } from '../../../src/data/ffx/builds/garden-of-pain.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import * as data from '../../../src/data/ffx/enemies/seymour-omnis.ts';
import * as rules from '../../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { planOmnisVolley } from '../../../src/battle/ffx/ai/seymour-omnis.ts';
import {
  DISCS, OMNIS, actor, defend, discs, drive, inputFor, lineUp, makeInvincible, newEngine, nextInput,
} from '../helpers/omnisUnits.ts';

describe('Chapter XII registration (FFX only)', () => {
  it('is registered, reachable by id and UNLISTED', () => {
    const ch = getChapter('seymour-omnis');
    expect(ch?.number).toBe(12);
    expect(ch?.game).toBe('ffx');
    expect(ch?.title).toBe('Seymour Omnis');
    expect(ch?.location).toBe('Inside Sin — the Garden of Pain');
    expect(CHAPTERS.some((c) => c.id === 'seymour-omnis')).toBe(false);
    expect(CHAPTER_IDS).not.toContain('seymour-omnis');
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toContain('seymour-omnis');
    expect(ch?.buildRef).toBe(gardenOfPainBuild);
    expect(ch?.enemyGroupRef).toBe(ENEMY_GROUPS_BY_ID['seymour-omnis']);
  });

  it('the data ids and the rules ids agree', () => {
    expect(rules.OMNIS_ID).toBe(data.OMNIS_ID);
    expect(rules.OMNIS_SCRIPT).toBe(data.OMNIS_SCRIPT);
    expect(rules.MORTIPHASM_SCRIPT).toBe(data.MORTIPHASM_SCRIPT);
    expect([...rules.MORTIPHASM_IDS]).toEqual([...data.MORTIPHASM_IDS]);
  });
});

describe('the stat blocks (research §1, §2)', () => {
  const group = ENEMY_GROUPS_BY_ID['seymour-omnis']!;
  const omnis = group.enemies.find((e) => e.id === OMNIS)!;
  it('Omnis: 80,000 HP, Defense 180, Magic Defense 100, Magic 35, Agility 40, Overkill 15,000', () => {
    expect(omnis.stats).toMatchObject({ hp: 80_000, def: 180, mdef: 100, mag: 35, agi: 40, luck: 20 });
    expect(omnis.rewards).toMatchObject({ ap: 24_000, apOverkill: 36_000, gil: 12_000, overkillThreshold: 15_000 });
    expect(omnis.rewards.steal?.common.itemId).toBe('shining-gem');
    expect(omnis.rewards.steal?.rare.itemId).toBe('supreme-gem');
    expect(group.canEscape).toBe(false);
  });
  it('Armor Break and Mental Break land; Provoke, Slow, Doom, Silence, Petrify do not; Threaten is immune (B13)', () => {
    expect(omnis.immunities['armor-break'] ?? 0).toBe(0);
    expect(omnis.immunities['mental-break'] ?? 0).toBe(0);
    for (const s of ['provoke', 'slow', 'doom', 'silence', 'petrify', 'power-break', 'magic-break'] as const) {
      expect(omnis.immunities[s]).toBe(255);
    }
    expect(omnis.threatenChance).toBe(0);
    expect(omnis.immunityFlags).toEqual(expect.arrayContaining(['immune-to-delay', 'immune-to-life', 'immune-to-percentage-damage']));
  });
  it('four discs: 1 HP parts, immune to all damage, Scan and Sensor, out of reach, never a random pick', () => {
    const d = group.enemies.filter((e) => e.id.startsWith('mortiphasm'));
    expect(d.map((e) => e.id)).toEqual([...DISCS]);
    for (const e of d) {
      expect(e.hp).toBe(1);
      expect(e.immunityFlags).toEqual(expect.arrayContaining(['immune-to-damage', 'immune-to-scan', 'immune-to-sensor']));
      expect(e.flags).toMatchObject({ isPart: true, partOf: OMNIS, outOfMeleeReach: true, neverRandomTarget: true });
    }
  });
});

describe('the party (B2-B7)', () => {
  const yuna = gardenOfPainBuild.members.find((m) => m.id === 'yuna')!;
  const lulu = gardenOfPainBuild.members.find((m) => m.id === 'lulu')!;
  it('Tidus, Yuna, Auron open; the five story aeons; Chapter III stats and bag', () => {
    expect(gardenOfPainBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
    expect(gardenOfPainBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    for (const m of gardenOfPainBuild.members) {
      expect(m.stats).toEqual(dreamsEndBuild.members.find((x) => x.id === m.id)!.stats);
    }
    expect(gardenOfPainBuild.inventory).toEqual(dreamsEndBuild.inventory);
  });
  it('Yuna wears the Phantom Ring (B6 = a); Lulu has no One MP Cost (found after Omnis); no Talk', () => {
    expect(yuna.equipment.armor.autoAbilities).toEqual(['fire-eater', 'lightning-eater', 'water-eater']);
    expect(yuna.learnedAbilityIds).toEqual(expect.arrayContaining(['nulblaze', 'nulfrost', 'nulshock', 'nultide']));
    expect(lulu.equipment.weapon.autoAbilities).not.toContain('one-mp-cost');
    expect(lulu.learnedAbilityIds).toContain('focus');
    for (const m of gardenOfPainBuild.members) expect(m.learnedAbilityIds).not.toContain('talk');
  });
});

describe('the opening (research §4.1, §4.2)', () => {
  it('all four discs show Fire: he absorbs Fire, is weak to Ice, Holy untouched', () => {
    const e = newEngine(1);
    expect(discs(e)).toEqual(['fire', 'fire', 'fire', 'fire']);
    expect(actor(e, OMNIS).affinities).toEqual({ fire: 'absorb', ice: 'weak' });
  });

  it('his first turn is four Firaga: one on each member in slot order, the fourth on a random one', () => {
    const e = newEngine(3);
    makeInvincible(e);
    drive(e, () => defend(), (x) => x.state().log.filter((ev) => ev.type === 'action-start' && ev.actorId === OMNIS).length >= 4);
    const log = e.state().log;
    const casts = log.filter((ev): ev is Extract<BattleEvent, { type: 'action-start' }> => ev.type === 'action-start' && ev.actorId === OMNIS);
    expect(casts.slice(0, 4).map((c) => c.abilityId)).toEqual(['omnis-firaga', 'omnis-firaga', 'omnis-firaga', 'omnis-firaga']);
    expect(casts.slice(0, 3).map((c) => c.targets[0])).toEqual(['tidus', 'yuna', 'auron']);
    expect(['tidus', 'yuna', 'auron']).toContain(casts[3]!.targets[0]);
  });
});

describe('the volley planner (§4.1; B12 = a)', () => {
  const plan = (layout: string, down: string[] = []): string[] => {
    const e = newEngine(5);
    const st = e.state();
    st.flags['omnis.discs'] = layout;
    for (const id of down) {
      const c = actor(e, id);
      c.hp = 0;
      c.alive = false;
      c.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    const ctx = (e as unknown as { ctx: Parameters<typeof planOmnisVolley>[0] }).ctx;
    return planOmnisVolley(ctx).map((c) => c.abilityId);
  };
  it('-ra on 1-2 matching discs, -ga on 3-4', () => {
    expect(plan('fire,fire,fire,ice')).toEqual(['omnis-firaga', 'omnis-firaga', 'omnis-firaga', 'omnis-blizzara']);
    expect(plan('fire,fire,ice,ice')).toEqual(['omnis-fira', 'omnis-fira', 'omnis-blizzara', 'omnis-blizzara']);
    expect(plan('fire,water,ice,lightning')).toEqual(['omnis-fira', 'omnis-watera', 'omnis-blizzara', 'omnis-thundara']);
    expect(plan('water,water,water,water')).toEqual(['omnis-waterga', 'omnis-waterga', 'omnis-waterga', 'omnis-waterga']);
  });
  it('with members down he casts one per living member plus one: 3, then 2; the first discs keep their spells', () => {
    expect(plan('fire,ice,water,lightning', ['yuna'])).toEqual(['omnis-fira', 'omnis-blizzara', 'omnis-watera']);
    expect(plan('fire,ice,water,lightning', ['yuna', 'auron'])).toEqual(['omnis-fira', 'omnis-blizzara']);
  });
});

describe('turning the discs (§4.3; the ring is our estimate, B8 = b)', () => {
  it('Wakka reaches a disc and his hit turns it left (Fire -> Water); the disc takes 0 and stands', () => {
    const e = newEngine(2, lineUp(['wakka', 'lulu', 'tidus']));
    makeInvincible(e);
    const d = inputFor(e, 'wakka');
    const attack = d.commands.find((c) => c.command.kind === 'attack')!;
    expect(attack.validTargets).toEqual(expect.arrayContaining([OMNIS, ...DISCS]));
    const events = e.submit({ kind: 'attack', targets: ['mortiphasm-2'] });
    const hit = events.find((ev) => ev.type === 'damage' && ev.targetId === 'mortiphasm-2');
    expect(hit && hit.type === 'damage' ? hit.amount : -1).toBe(0);
    expect(discs(e)).toEqual(['fire', 'water', 'fire', 'fire']);
    expect(actor(e, 'mortiphasm-2').hp).toBe(1);
    const change = events.find((ev) => ev.type === 'affinity-change');
    expect(change).toMatchObject({ targetId: OMNIS, cause: 'part-turn', partId: 'mortiphasm-2', direction: 'left' });
    // three Fire discs absorb Fire, one Water disc halves Water; no weakness any more
    expect(actor(e, OMNIS).affinities).toEqual({ fire: 'absorb', water: 'resist' });
  });

  it("Lulu's Blizzara turns a disc right (Fire -> Thunder)", () => {
    const e = newEngine(2, lineUp(['wakka', 'lulu', 'tidus']));
    makeInvincible(e);
    inputFor(e, 'lulu');
    e.submit({ kind: 'ability', id: 'blizzara', targets: ['mortiphasm-4'] });
    expect(discs(e)).toEqual(['fire', 'fire', 'fire', 'lightning']);
    expect(actor(e, OMNIS).affinities).toEqual({ fire: 'absorb', lightning: 'resist' });
  });

  it('Tidus and Auron cannot reach a disc; their menus offer only Omnis', () => {
    const e = newEngine(2);
    for (const who of ['tidus', 'auron']) {
      const d = inputFor(e, who);
      expect(d.commands.find((c) => c.command.kind === 'attack')!.validTargets).toEqual([OMNIS]);
      e.submit(defend());
    }
  });

  it('a random-target action never picks a disc (Slice & Dice class, §2)', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const e = newEngine(seed, lineUp(['wakka', 'lulu', 'tidus']));
      makeInvincible(e);
      inputFor(e, 'wakka');
      const events = e.submit({ kind: 'ability', id: 'test-random-hit', targets: [] } as Command);
      const hits = events.filter((ev) => ev.type === 'damage' && ev.sourceId === 'wakka');
      expect(hits.length).toBe(8);
      for (const h of hits) expect(h.type === 'damage' && h.targetId).toBe(OMNIS);
    }
  });

  it('the discs own no turn and never appear in the turn order', () => {
    const e = newEngine(4);
    makeInvincible(e);
    const order = e.predictTurnOrder(16).map((p) => p.actorId);
    for (const id of DISCS) expect(order).not.toContain(id);
    drive(e, () => defend(), (x) => x.state().turn > 60);
    for (const id of DISCS) {
      expect(e.state().log.some((ev) => ev.type === 'turn-start' && ev.actorId === id)).toBe(false);
    }
  });

  it('an all-enemies action touches the discs for 0 and turns none (B10 = a)', () => {
    const e = newEngine(6);
    makeInvincible(e);
    nextInput(e);
    const before = discs(e).join();
    const events = e.submit({ kind: 'ability', id: 'test-all-spell', targets: [] });
    const onDiscs = events.filter((ev) => ev.type === 'damage' && (DISCS as readonly string[]).includes(ev.targetId));
    expect(onDiscs.length).toBe(4);
    for (const h of onDiscs) expect(h.type === 'damage' && h.amount).toBe(0);
    expect(discs(e).join()).toBe(before);
  });
});

describe('asking about his next move moves nothing (intent dry-run)', () => {
  it('reads the volley, then Dispel once he glows, without touching the live discs, counter or Defense', () => {
    const e = newEngine(8) as ReturnType<typeof newEngine> & { intent(): { abilityId?: string } | null };
    nextInput(e);
    const before = JSON.stringify(e.state().flags);
    const first = e.intent();
    expect(first).not.toBeNull();
    e.state().flags['omnis.state'] = 'red';
    const glowing = JSON.stringify(e.intent());
    expect(glowing).toContain('omnis-dispel');
    expect(actor(e, OMNIS).stats.def).toBe(180);
    e.state().flags['omnis.state'] = 'normal';
    expect(JSON.stringify(e.state().flags)).toBe(before);
  });
});
