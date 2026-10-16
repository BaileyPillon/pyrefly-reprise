/**
 * The hidden Last Summoning's chain (FFX only): the formations as a pure function of what has been given up, the order the player picks, the locks on the real engine, the stat copy, and that Chapter III's own
 * formations are what they were. The chapter record, the story, the guide and the door have their own files; the bench has its own.
 */
import { describe, expect, it } from 'vitest';
import type { BattleEngine, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { findEnemyGroup, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { PAY_ABILITY_ID } from '../../../src/battle/ffx/aeon-commands.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../../src/data/ffx/index.ts';
import { lastSummoningGroup, lastSummoningOpener, possessionGroup, yuYevonLink } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { yuYevonGroup } from '../../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import {
  FULL_CHAIN_LENGTH,
  OFFERING_KEYS,
  OFFERING_NEXT_ID,
  OPENER_GROUP_ID,
  type OfferingKey,
  TAKEN_REASON,
  aeonIdsOf,
  groupIdForPick,
  heldAfter,
  linkGroupId,
  nextGroupIdAfter,
  parseGroupId,
  possessedIdsOf,
  yuYevonGroupId,
} from '../../../src/data/ffx/last-summoning-ids.ts';
import { ALL_KEYS, activeMembers, firstLinkSetup, newEngine, playOrder } from '../helpers/lastSummoningDrive.ts';

/** A small deterministic shuffle (no Math.random: the suite is reproducible). */
function permutation(seed: number): OfferingKey[] {
  const keys = [...ALL_KEYS];
  let s = seed * 2654435761 + 12345;
  for (let i = keys.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [keys[i], keys[j]] = [keys[j]!, keys[i]!];
  }
  return keys;
}

/** The ids of the formation of every link of `order`, first to last, followed through `groupIdForPick` and `nextGroupId`. */
function chainOf(order: readonly OfferingKey[]): string[] {
  const out: string[] = [];
  let id: string | undefined = linkGroupId([order[0]!]);
  let pos = 0;
  for (let guard = 0; id !== undefined && guard < 20; guard++) {
    out.push(id);
    const g = lastSummoningGroup(id);
    if (g === null) throw new Error(`no formation for ${id}`);
    let next = g.nextGroupId;
    if (next === OFFERING_NEXT_ID) {
      pos += 1;
      next = groupIdForPick(order.slice(0, pos), order[pos]!);
    }
    id = next;
  }
  return out;
}

describe('the ids say what has been given up', () => {
  it('lists the eight offerings in the game’s order, with the Sisters as one entry of three actors', () => {
    expect([...OFFERING_KEYS]).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters']);
    expect(aeonIdsOf('sisters')).toEqual(['cindy', 'sandy', 'mindy']);
    expect(possessedIdsOf('sisters')).toEqual(['possessed-cindy', 'possessed-sandy', 'possessed-mindy']);
    expect(aeonIdsOf('anima')).toEqual(['anima']);
    expect(FULL_CHAIN_LENGTH).toBe(9);
  });

  it('round-trips a link id and a Yu Yevon id, and answers nothing for any other id', () => {
    const order: OfferingKey[] = ['ifrit', 'sisters', 'anima'];
    expect(parseGroupId(linkGroupId(order))).toEqual({ order, yuYevon: false });
    expect(parseGroupId(yuYevonGroupId(order))).toEqual({ order, yuYevon: true });
    for (const other of ['braskas-final-aeon', 'possessed-valefor', 'yu-yevon', OPENER_GROUP_ID, OFFERING_NEXT_ID, 'last-summoning:nothing', '']) {
      expect(parseGroupId(other), other).toBeNull();
    }
  });

  it('knows what is still held and what comes next', () => {
    expect(heldAfter(['valefor', 'sisters'])).toEqual(['ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo']);
    expect(nextGroupIdAfter(['valefor'])).toBe(OFFERING_NEXT_ID);
    expect(nextGroupIdAfter([...ALL_KEYS])).toBe(yuYevonGroupId([...ALL_KEYS]));
  });
});

describe('the formations are resolved on demand, one id one object', () => {
  it('answers the opener, a link and Yu Yevon, caches them, and leaves every other id to the rest of the registry', async () => {
    expect(lastSummoningGroup(OPENER_GROUP_ID)).toBe(lastSummoningOpener);
    const link = lastSummoningGroup(linkGroupId(['shiva']));
    expect(link).not.toBeNull();
    expect(lastSummoningGroup(linkGroupId(['shiva']))).toBe(link);
    expect(lastSummoningGroup('braskas-final-aeon')).toBeNull();
    expect(lastSummoningGroup('yu-yevon')).toBeNull();
    // `findEnemyGroup` is the app's one resolver: Chapter III's ids still reach Chapter III's own objects, ours reach ours.
    expect(await findEnemyGroup('yu-yevon')).toBe(FFX_GROUPS['yu-yevon']);
    expect(await findEnemyGroup('possessed-ifrit')).toBe(FFX_GROUPS['possessed-ifrit']);
    expect(await findEnemyGroup(linkGroupId(['shiva']))).toBe(link);
    expect(await findEnemyGroup(OPENER_GROUP_ID)).toBe(lastSummoningOpener);
  });

  it('the opener is Yu Yevon’s formation as a stand-in, never fought: it offers the first pick and leads to the marker', () => {
    expect(lastSummoningOpener).toMatchObject({ id: OPENER_GROUP_ID, offersAeons: 'open', nextGroupId: OFFERING_NEXT_ID, chainLength: FULL_CHAIN_LENGTH });
    expect(lastSummoningOpener.lockedAeons ?? []).toEqual([]);
    expect(lastSummoningOpener.enemies.map((e) => e.id)).toEqual(yuYevonGroup.enemies.map((e) => e.id));
  });
});

describe('a possession link', () => {
  it('fields the twin of the aeon given up and the two Pagodas, under the fayth’s Auto-Life, with no way out', () => {
    const g = possessionGroup(['ifrit']);
    expect(g.enemies.map((e) => e.id)).toEqual(['possessed-ifrit', 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(g).toMatchObject({ game: 'ffx', canEscape: false, grantsPermanentAutoLife: true, chainLength: FULL_CHAIN_LENGTH, offersAeons: 'next', nextGroupId: OFFERING_NEXT_ID });
    expect(g.musicCues?.[0]).toMatchObject({ at: 'start', track: 'boss-yu-yevon' });
  });

  it('is built the way Chapter III builds one: the same enemy definitions, the Pagodas included', () => {
    const mine = possessionGroup(['ifrit']);
    const theirs = FFX_GROUPS['possessed-ifrit']!;
    expect(mine.enemies).toEqual(theirs.enemies);
  });

  it('puts the Magus Sisters in ONE battle with their three bodies (Mindy, Sandy, Cindy) and the Pagodas, headlined as the Sisters', () => {
    const g = possessionGroup(['sisters']);
    expect(g.enemies.map((e) => e.id)).toEqual(['possessed-mindy', 'possessed-sandy', 'possessed-cindy', 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(g.bossId).toBe('possessed-cindy');
    expect(g.headline).toBe('Magus Sisters');
    expect(g.enemies.slice(0, 3).map((e) => e.aiScriptId)).toEqual(['possessed-mindy', 'possessed-sandy', 'possessed-cindy']);
    expect(g.enemies.slice(0, 3).every((e) => typeof e.sensorText === 'string' && e.sensorText.length > 0)).toBe(true);
  });

  it('locks every aeon given up so far, the one fought included, with the words "Taken by Yu Yevon" and Yu Yevon as the mirror', () => {
    const order: OfferingKey[] = ['bahamut', 'sisters', 'valefor'];
    const g = possessionGroup(order);
    expect(g.lockedAeons).toEqual([
      { aeonId: 'bahamut', mirrorOf: 'yu-yevon', reason: TAKEN_REASON },
      { aeonId: 'cindy', mirrorOf: 'yu-yevon', reason: TAKEN_REASON },
      { aeonId: 'sandy', mirrorOf: 'yu-yevon', reason: TAKEN_REASON },
      { aeonId: 'mindy', mirrorOf: 'yu-yevon', reason: TAKEN_REASON },
      { aeonId: 'valefor', mirrorOf: 'yu-yevon', reason: TAKEN_REASON },
    ]);
  });

  it('refuses a link with nothing given up', () => {
    expect(() => possessionGroup([])).toThrow(/at least one aeon/);
  });
});

describe('every order of the roster is a valid chain', () => {
  const orders = [[...ALL_KEYS], [...ALL_KEYS].reverse(), ...Array.from({ length: 30 }, (_, i) => permutation(i + 1))];

  it('has nine formations: eight possessions, the Sisters in exactly one, and Yu Yevon last', () => {
    for (const order of orders) {
      const ids = chainOf(order);
      expect(ids, order.join()).toHaveLength(FULL_CHAIN_LENGTH);
      expect(ids.at(-1), order.join()).toBe(yuYevonGroupId(order));
      const groups = ids.map((id) => lastSummoningGroup(id)!);
      const sisters = groups.filter((g) => g.enemies.some((e) => e.id === 'possessed-cindy'));
      expect(sisters, order.join()).toHaveLength(1);
      // The aeon fought in link k is the k-th pick.
      order.forEach((key, k) => {
        const fought = groups[k]!.enemies.filter((e) => e.id.startsWith('possessed-')).map((e) => e.id);
        expect(fought, `${order.join()} link ${k + 1}`).toEqual(key === 'sisters' ? ['possessed-mindy', 'possessed-sandy', 'possessed-cindy'] : [`possessed-${key}`]);
      });
    }
  });

  it('grows the lock by what each link takes, never shrinks it, and ends with all ten aeon ids locked at Yu Yevon', () => {
    for (const order of orders) {
      const groups = chainOf(order).map((id) => lastSummoningGroup(id)!);
      let previous = 0;
      groups.forEach((g, k) => {
        const locked = (g.lockedAeons ?? []).map((l) => l.aeonId);
        expect(locked.length, `${order.join()} link ${k + 1}`).toBeGreaterThanOrEqual(previous);
        previous = locked.length;
        expect(new Set(locked).size).toBe(locked.length);
        if (k < 8) for (const id of aeonIdsOf(order[k]!)) expect(locked, `${order.join()} link ${k + 1} locks the aeon it fights`).toContain(id);
      });
      const last = groups.at(-1)!;
      expect(last.lockedAeons).toHaveLength(10);
      expect(last.enemies.map((e) => e.id)).toEqual(yuYevonGroup.enemies.map((e) => e.id));
    }
  });

  it('offers the next pick after every link but the last possession, whose seam leads straight to Yu Yevon', () => {
    for (const order of orders) {
      const groups = chainOf(order).map((id) => lastSummoningGroup(id)!);
      groups.slice(0, 7).forEach((g, k) => expect([g.nextGroupId, g.offersAeons], `${order.join()} link ${k + 1}`).toEqual([OFFERING_NEXT_ID, 'next']));
      expect(groups[7]!.nextGroupId).toBe(yuYevonGroupId(order));
      expect(groups[7]!.offersAeons).toBeUndefined();
      expect(groups[8]!.nextGroupId).toBeUndefined();
    }
  });
});

describe('Yu Yevon’s formation is Chapter III’s, a copy with the eight aeons locked', () => {
  it('differs from Chapter III’s only in its id, the locks and the chain length; Chapter III’s object is untouched', () => {
    const copy = yuYevonLink([...ALL_KEYS]);
    const { id, lockedAeons, chainLength, ...rest } = copy;
    const { id: theirId, ...theirs } = yuYevonGroup;
    expect(id).toBe(yuYevonGroupId([...ALL_KEYS]));
    expect(theirId).toBe('yu-yevon');
    expect(rest).toEqual(theirs);
    expect(lockedAeons).toHaveLength(10);
    expect(chainLength).toBe(FULL_CHAIN_LENGTH);
    expect(yuYevonGroup.lockedAeons).toBeUndefined();
    expect(yuYevonGroup.chainLength).toBeUndefined();
    expect(yuYevonGroup.offersAeons).toBeUndefined();
  });

  it('leaves every one of Chapter III’s formations without a lock, a chain length or an offering', () => {
    for (const id of ['braskas-final-aeon', 'possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon']) {
      const g = FFX_GROUPS[id]!;
      expect(g, id).toBeDefined();
      expect(g.lockedAeons, id).toBeUndefined();
      expect(g.chainLength, id).toBeUndefined();
      expect(g.offersAeons, id).toBeUndefined();
    }
  });
});

// ----------------------------------------------------------------------------------------------------- the real engine

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Advance to `who`'s next input (everyone else defends on the way). */
function inputFor(engine: BattleEngine, who: string): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      if (d.actorId === who) return d;
      engine.submit({ kind: 'defend', targets: [] });
    } else if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error(`no input for ${who}`);
}

describe('on the real engine, the locks hold', () => {
  it('greys the aeons taken so far with the reason, offers the rest, and offers the Sisters as one entry', async () => {
    const { setup } = await firstLinkSetup(['ifrit', 'sisters'], 1);
    // link 2 of the order ifrit, sisters: the Sisters' own link, Ifrit gone before it
    const second = lastSummoningGroup(linkGroupId(['ifrit', 'sisters']))!;
    const engine = newEngine({ ...setup, enemies: second });
    const d = inputFor(engine, 'yuna');
    const summons = d.commands.filter((c) => c.command.kind === 'summon');
    const byLabel = new Map(summons.map((c) => [c.label, c]));
    expect([...byLabel.keys()].sort()).toEqual(['Anima', 'Bahamut', 'Ifrit', 'Ixion', 'Magus Sisters', 'Shiva', 'Valefor', 'Yojimbo']);
    for (const taken of ['Ifrit', 'Magus Sisters']) {
      expect(byLabel.get(taken)!.enabled, taken).toBe(false);
      expect(byLabel.get(taken)!.disabledReason, taken).toBe(TAKEN_REASON);
    }
    for (const held of ['Anima', 'Bahamut', 'Ixion', 'Shiva', 'Valefor', 'Yojimbo']) expect(byLabel.get(held)!.enabled, held).toBe(true);
  });

  it('refuses a taken aeon even when the command is sent, and Grand Summon never offers one', async () => {
    const { setup } = await firstLinkSetup(['bahamut'], 2);
    const engine = newEngine(setup);
    const d = inputFor(engine, 'yuna');
    const grand = d.commands.find((c) => c.command.kind === 'overdrive' && c.label === 'Grand Summon');
    if (grand !== undefined) {
      // The choices a Grand Summon lists are the held aeons only.
      const state = engine.state();
      expect(state.flags['aeonDuel.lock:bahamut']).toBe('yu-yevon');
    }
    engine.submit({ kind: 'summon', id: 'bahamut', targets: [] });
    const after = engine.state();
    expect(after.aeonId, 'a taken aeon never takes the field').toBeNull();
  });

  it('summons a held aeon, and the pool that remains is the held ones only', async () => {
    const { setup } = await firstLinkSetup(['shiva'], 3);
    const engine = newEngine(setup);
    const d = inputFor(engine, 'yuna');
    const row = d.commands.find((c) => c.command.kind === 'summon' && c.label === 'Valefor')!;
    expect(row.enabled).toBe(true);
    engine.submit({ ...row.command, targets: [] });
    expect(engine.state().aeonId).toBe('valefor');
  });
});

describe('on the real engine, the twin is a copy of the player’s aeon at full HP', () => {
  it('copies Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy and maximum HP for every single aeon, with Luck 0 and MP 1', async () => {
    const build = buildLastSummoningParty();
    for (const key of OFFERING_KEYS.filter((k) => k !== 'sisters')) {
      const { setup } = await firstLinkSetup([key], 4);
      const engine = newEngine(setup);
      const twin = engine.state().combatants[`possessed-${key}`] as FFXCombatant;
      const mine = build.aeons.find((a) => a.id === key)!;
      expect(twin, key).toBeDefined();
      expect(twin.hp, key).toBe(mine.stats.maxHp);
      expect(twin.stats.maxHp, key).toBe(mine.stats.maxHp);
      for (const stat of ['str', 'def', 'mag', 'mdef', 'agi', 'eva', 'acc'] as const) expect(twin.stats[stat], `${key} ${stat}`).toBe(mine.stats[stat]);
      expect(twin.stats.luck, key).toBe(0);
      expect(twin.mp, key).toBe(1);
    }
  });

  it('copies each Sister’s own stats onto her own body', async () => {
    const build = buildLastSummoningParty();
    const { setup } = await firstLinkSetup(['sisters'], 5);
    const engine = newEngine(setup);
    for (const id of ['cindy', 'sandy', 'mindy']) {
      const twin = engine.state().combatants[`possessed-${id}`] as FFXCombatant;
      const mine = build.aeons.find((a) => a.id === id)!;
      expect(twin.stats.maxHp, id).toBe(mine.stats.maxHp);
      expect(twin.hp, id).toBe(mine.stats.maxHp);
      expect(twin.stats.str, id).toBe(mine.stats.str);
      expect(twin.stats.mag, id).toBe(mine.stats.mag);
    }
  });

  it('starts with the party at the front of the list and the player’s whole roster in the record (eight aeons, ten actors)', async () => {
    const { setup } = await firstLinkSetup(['valefor'], 6);
    const engine = newEngine(setup);
    expect(activeMembers(engine).map((c) => c.id)).toEqual(['tidus', 'yuna', 'auron']);
    const aeons = Object.values(engine.state().combatants).filter((c) => c.side === 'aeon');
    expect(aeons.map((c) => c.id).sort()).toEqual(['anima', 'bahamut', 'cindy', 'ifrit', 'ixion', 'mindy', 'sandy', 'shiva', 'valefor', 'yojimbo']);
  });
});

describe('what a link hands to the next', () => {
  it('carries the gil Pay spent and Yojimbo’s changed compatibility into the next link, and the locks grow by the link just fought', async () => {
    const { setup } = await firstLinkSetup(['valefor'], 11);
    const engine = newEngine(setup);
    const yuna = inputFor(engine, 'yuna');
    engine.submit({ ...yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo')!.command, targets: [] });
    const turn = inputFor(engine, 'yojimbo');
    const pay = turn.commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID)!;
    engine.submit({ ...pay.command, targets: [], gilSpent: 32_768 } as never);
    const flags = engine.state().flags as Record<string, number>;
    expect(flags['yojimbo:gil']).toBe(50_000 - 32_768);
    expect(flags['yojimbo:compatibility']).not.toBe(128); // the roll's command moved it (+3 for Wakizashi on all, +4 for Zanmato, and so on)
    const next = lastSummoningGroup(linkGroupId(['valefor', 'ifrit']))!;
    const carried = setupForNextLink(setup, next, engine.state(), 12);
    const second = newEngine(carried);
    const nextFlags = second.state().flags as Record<string, number>;
    expect(nextFlags['yojimbo:gil']).toBe(50_000 - 32_768);
    expect(nextFlags['yojimbo:compatibility']).toBe(flags['yojimbo:compatibility']);
    // The locks of the next link: Valefor, then Ifrit.
    expect(Object.keys(nextFlags).filter((k) => k.startsWith('aeonDuel.lock:')).sort()).toEqual(['aeonDuel.lock:ifrit', 'aeonDuel.lock:valefor']);
  });
});

describe('a whole chain plays through the loop’s own seams, deterministically', () => {
  it('fights nine formations in the order picked, Yu Yevon last, on the chapter’s own line, and the same seed gives the same run', async () => {
    const order: OfferingKey[] = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'];
    const a = await playOrder(order, 7, { maxTurns: 6000 });
    const b = await playOrder(order, 7, { maxTurns: 6000 });
    expect(a.links.map((l) => [l.group, l.outcome, l.turns, l.ticks])).toEqual(b.links.map((l) => [l.group, l.outcome, l.turns, l.ticks]));
    expect(a.links.map((l) => l.group)).toEqual(chainOf(order).slice(0, a.links.length));
    expect(a.links.length).toBeGreaterThan(0);
    for (const l of a.links.slice(0, -1)) expect(l.outcome, l.group).toBe('victory');
  }, 240_000);
});
