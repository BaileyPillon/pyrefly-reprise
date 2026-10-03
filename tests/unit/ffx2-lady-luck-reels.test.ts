/**
 * Critic round 02 #05, the FFX-2 half — **Lady Luck's reels**.
 *
 * `x2-lady-luck-attack-reels` and `-magic-reels` shipped as `formula: 'none'`,
 * `power: 0`, `minigame: 'ladyluck-reels'`, and their own file header called
 * the pay table "minigame/UI content, not battle data". Nothing anywhere
 * resolved a spin, so a full Long-`CT` action did nothing at all: no damage, no
 * status, no heal, and — the half that mattered most — **no Dud**, which is the
 * whole reason §3.12 calls Lady Luck double-edged.
 *
 * These are X-2's reels, not Wakka's [ffx2-combat-core §3.12, verified: 2
 * sources]: six symbols a set, three pay tiers read **left to right** (three of
 * a kind, a pair in slots 1+2, a lone Cherry in slot 1), and everything else is
 * a Dud that takes 75% of current HP off the whole party, ignoring defence.
 * Every assertion below is made on the shipped data through the real engine,
 * and every one of them fails on the old code.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  resolveLadyLuckSpin,
} from '../../src/battle/ffx2/index.ts';
import type {
  BattleEvent,
  Command,
  FFX2PartyBuild,
  MinigameResult,
  ReelResult,
} from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { LADY_LUCK_DUD_ID, LADY_LUCK_REELS } from '../../src/data/ffx2/reels.ts';

const ATTACK_REELS = 'x2-lady-luck-attack-reels';
const MAGIC_REELS = 'x2-lady-luck-magic-reels';
const SPINNER = 'yuna';

/** Chapter 5's own build, with Yuna spherechanged into the Lady Luck she owns. */
function ladyLuckParty(): FFX2PartyBuild {
  const [yuna, rikku, paine] = farplaneBuild.members;
  return { ...farplaneBuild, members: [{ ...yuna, currentDressphere: 'lady-luck' }, rikku, paine] };
}

function newEngine(seed: number, groupId = 'vegnagun-tail'): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init({ game: 'ffx2', party: ladyLuckParty(), enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function spinOf(symbols: [string, string, string]): ReelResult {
  return { symbols, threeOfAKind: symbols[0] === symbols[1] && symbols[1] === symbols[2], timeRemainingMs: 0 };
}

function spin(symbols: [string, string, string]): MinigameResult {
  return { kind: 'ladyluck-reels', reels: spinOf(symbols) };
}

interface SpinRun {
  /** Every event from the spinner's submit to her `action-end`. */
  events: BattleEvent[];
  /** Party HP once the spinner's action has ended, keyed by id. */
  hpAfter: Record<string, number>;
  partyIds: string[];
  enemyIds: string[];
}

/**
 * Drive the battle until the spinner's turn, submit `reelId` **exactly as the
 * menu offers it** with `outcome` attached, and collect what the action did.
 * Everyone else passes the time with whatever the menu lists first.
 */
function runSpin(seed: number, reelId: string, outcome: MinigameResult | null, targetSide: 'enemy' | 'party' = 'enemy'): SpinRun {
  const engine = newEngine(seed);
  const everyone = () => Object.values(engine.state().combatants);
  const partyIds = everyone().filter((c) => c.side === 'party').map((c) => c.id);
  const enemyIds = everyone().filter((c) => c.side === 'enemy').map((c) => c.id);
  const run: SpinRun = { events: [], hpAfter: {}, partyIds, enemyIds };
  let submitted = false;

  const collect = (events: BattleEvent[]): boolean => {
    if (!submitted) return false;
    for (const e of events) {
      run.events.push(e);
      if (e.type === 'action-end' && (e as { actorId?: string }).actorId === SPINNER) return true;
    }
    return false;
  };

  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') {
      if (collect(d.events)) break;
      continue;
    }
    if (d.kind === 'waiting') {
      if (collect(engine.tick(d.nextEventMs))) break;
      continue;
    }
    if (d.kind !== 'player-input') break;

    if (d.actorId === SPINNER && !submitted) {
      const row = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === reelId);
      if (!row) throw new Error(`${reelId} was not offered to a Lady Luck`);
      expect(row.enabled, `${reelId} is greyed out: ${row.disabledReason ?? ''}`).toBe(true);
      const pool = targetSide === 'enemy' ? enemyIds : partyIds;
      const target = row.validTargets.find((id) => pool.includes(id)) ?? row.validTargets[0]!;
      submitted = true;
      const command = { ...row.command, targets: [target], ...(outcome ? { extra: outcome } : {}) } as Command;
      if (collect(engine.submit(command))) break;
      continue;
    }
    // Anyone else (or the spinner, after her spin is in flight): first legal row.
    const filler = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0)
      ?? d.commands.find((c) => c.enabled && c.validTargets.length > 0);
    if (!filler) break;
    if (collect(engine.submit({ ...filler.command, targets: [filler.validTargets[0]!] } as Command))) break;
  }
  for (const c of everyone()) if (c.side === 'party') run.hpAfter[c.id] = c.hp;
  return run;
}

/** Only what the spinner's own action produced — enemies act during her charge. */
function ownEvents(run: SpinRun): BattleEvent[] {
  const start = run.events.findIndex(
    (e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === SPINNER,
  );
  // A charged action announces itself once, at the wind-up; what it does comes
  // in the burst that ends with her `action-end`.
  const end = run.events.length;
  let from = start < 0 ? 0 : start;
  for (let i = end - 1; i >= 0; i--) {
    const e = run.events[i]!;
    if (e.type === 'action-end' && (e as { actorId?: string }).actorId !== SPINNER) {
      from = Math.max(from, i + 1);
      break;
    }
  }
  return run.events.slice(from);
}

function damageTo(events: BattleEvent[], ids: string[]): Array<{ targetId: string; amount: number }> {
  return events
    .filter((e) => e.type === 'damage' && ids.includes((e as { targetId: string }).targetId))
    .map((e) => ({ targetId: (e as { targetId: string }).targetId, amount: (e as { amount: number }).amount }));
}

describe('#05 (X-2) the pay table [ffx2-combat-core §3.12]', () => {
  it('has a table for every reel command the data ships, and every payload is a real ability', () => {
    const reelCommands = Object.values(data.ABILITIES).filter((a) => a.minigame === 'ladyluck-reels');
    expect(reelCommands.map((a) => a.id).sort()).toEqual([ATTACK_REELS, MAGIC_REELS]);
    for (const command of reelCommands) {
      const set = command.extra?.['reelSet'];
      expect(typeof set === 'string' && set in LADY_LUCK_REELS, `${command.id} names no table`).toBe(true);
    }
    for (const [set, table] of Object.entries(LADY_LUCK_REELS)) {
      const ids = [...Object.values(table.three), ...Object.values(table.pair), table.cherry, LADY_LUCK_DUD_ID];
      for (const id of ids) expect(data.ABILITIES[id], `${set} reels pay out '${id}', which does not exist`).toBeDefined();
      // §3.12: six symbols a set — Red 7, BAR, Cherry and the set's own three.
      expect(table.symbols).toHaveLength(6);
      expect(Object.keys(table.three).sort()).toEqual([...table.symbols].sort());
      // Pairs pay on Cherry and the three suit symbols only: 7-7-x and BAR-BAR-x are Duds.
      expect(Object.keys(table.pair).sort()).toEqual(table.symbols.filter((s) => s !== 'red7' && s !== 'bar').sort());
    }
  });

  it('reads left to right: three of a kind, then slots 1+2, then a lone Cherry in slot 1, else a Dud', () => {
    const magic = data.ABILITIES[MAGIC_REELS]!;
    const pays = (symbols: [string, string, string]) => {
      const o = resolveLadyLuckSpin(magic, spinOf(symbols));
      return o ? `${o.tier}:${o.abilityId}` : 'no table';
    };
    expect(pays(['red7', 'red7', 'red7'])).toBe('three:x2-shared-ultima');
    expect(pays(['bar', 'bar', 'bar'])).toBe('three:x2-dark-knight-black-sky');
    expect(pays(['cherry', 'cherry', 'cherry'])).toBe('three:x2-shared-flare');
    expect(pays(['staff', 'staff', 'staff'])).toBe('three:x2-lady-luck-reel-auto-life');
    expect(pays(['skull', 'skull', 'hat'])).toBe('pair:x2-dark-knight-break');
    expect(pays(['cherry', 'cherry', 'bar'])).toBe('pair:x2-dark-knight-bio');
    expect(pays(['cherry', 'bar', 'skull'])).toBe('cherry:x2-white-mage-cura');
    // Slots 1+2 only: a pair anywhere else is nothing, and so are 7-7-x and BAR-BAR-x.
    const duds: Array<[string, string, string]> = [
      ['hat', 'skull', 'skull'], ['skull', 'hat', 'skull'], ['red7', 'red7', 'bar'], ['bar', 'bar', 'cherry'], ['bar', 'cherry', 'cherry'],
    ];
    for (const dud of duds) expect(pays(dud), dud.join('-')).toBe(`dud:${LADY_LUCK_DUD_ID}`);
    // A symbol off another set's strip is not a win on this one...
    expect(pays(['sword', 'sword', 'sword'])).toBe(`dud:${LADY_LUCK_DUD_ID}`);
    // ...and it is on its own.
    const attack = data.ABILITIES[ATTACK_REELS]!;
    expect(resolveLadyLuckSpin(attack, spinOf(['sword', 'sword', 'sword']))?.abilityId).toBe('x2-warrior-delay-buster');
    expect(resolveLadyLuckSpin(attack, spinOf(['cherry', 'cherry', 'paw']))).toEqual({ tier: 'pair', abilityId: 'x2-samurai-clean-slate', friendly: true });
  });
});

describe('#05 (X-2) a spin does what it paid [engine-level]', () => {
  it('a Dud takes 75% of current HP off the WHOLE party — each girl once, and it kills nobody', () => {
    // Seed 3 is the hard case on purpose: the Tail's Noli Me Tangere lands on
    // Rikku and Paine during the reels' wind-up, so both are inside a Chain
    // window when the Dud arrives. Before `noChain`, that was 75% x 1.45 and a KO.
    for (const seed of [3, 5, 8]) {
      const run = runSpin(seed, ATTACK_REELS, spin(['sword', 'helmet', 'paw']));
      const own = ownEvents(run);
      const hits = damageTo(own, run.partyIds);
      expect(hits.map((h) => h.targetId).sort(), `seed ${seed}: every girl once, the spinner included`).toEqual([...run.partyIds].sort());
      expect(own.filter((e) => e.type === 'ko'), `seed ${seed}: 75% of current HP cannot kill`).toEqual([]);
      for (const hit of hits) {
        // The Dud is the last thing to touch the party before her `action-end`.
        const before = run.hpAfter[hit.targetId]! + hit.amount;
        // 12/16 of current HP through step 7's randomiser (240..271 / 256), and
        // nothing else: no Defence, no Protect, no Chain. §2.1, §2.3
        expect(hit.amount, `${hit.targetId}: ${hit.amount} of ${before}`).toBeGreaterThanOrEqual(Math.floor(before * 0.75 * (240 / 256)) - 1);
        expect(hit.amount, `${hit.targetId}: ${hit.amount} of ${before}`).toBeLessThanOrEqual(Math.ceil(before * 0.75 * (271 / 256)) + 1);
      }
      expect(damageTo(own, run.enemyIds), 'a Dud never touches the enemy').toEqual([]);
      expect(own.some((e) => e.type === 'message' && (e as { text: string }).text === 'Dud!'), 'nothing said it was a Dud').toBe(true);
    }
  });

  it('Attack Reels 7-7-7 resolves Shin-Zantetsu on every enemy, not a swing at the chosen one', () => {
    const run = runSpin(3, ATTACK_REELS, spin(['red7', 'red7', 'red7']));
    const own = ownEvents(run);
    // Every part of the Tail is flagged death-immune (Zantetsu 255), so the
    // payoff here is the attempt landing on each of them — and no Dud.
    expect(damageTo(own, run.partyIds), 'three Red 7s is the jackpot, not a Dud').toEqual([]);
    const touched = own.filter((e) => (e.type === 'miss' || e.type === 'status-add' || e.type === 'ko') && run.enemyIds.includes((e as { targetId: string }).targetId));
    expect(touched.length, 'Shin-Zantetsu rolled against nobody').toBeGreaterThan(0);
  });

  it('Magic Reels cherry-cherry-cherry casts Flare: real magic damage on the enemy she picked', () => {
    const run = runSpin(3, MAGIC_REELS, spin(['cherry', 'cherry', 'cherry']));
    const hits = damageTo(ownEvents(run), run.enemyIds);
    expect(hits.length, 'Flare dealt nothing').toBeGreaterThan(0);
    expect(hits[0]!.amount).toBeGreaterThan(0);
    expect(damageTo(ownEvents(run), run.partyIds)).toEqual([]);
  });

  it('a lone Cherry on the Magic Reels is a Cura for her own side, whoever she aimed at', () => {
    const run = runSpin(3, MAGIC_REELS, spin(['cherry', 'bar', 'skull']), 'enemy');
    const own = ownEvents(run);
    const heals = own.filter((e) => e.type === 'damage' && (e as { amount: number }).amount < 0);
    expect(heals.length, 'Cura healed nobody').toBeGreaterThan(0);
    for (const h of heals) expect(run.partyIds, 'the reels healed the boss').toContain((h as { targetId: string }).targetId);
  });

  it('with nobody at the overlay the engine rolls a real spin off the right strip, and it always does something', () => {
    let duds = 0;
    let wins = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      for (const reel of [ATTACK_REELS, MAGIC_REELS]) {
        const run = runSpin(seed, reel, null);
        const own = ownEvents(run);
        const partyHits = damageTo(own, run.partyIds).filter((h) => h.amount > 0);
        if (partyHits.length === run.partyIds.length) duds++;
        else wins++;
        const did = own.some((e) => ['damage', 'miss', 'status-add', 'status-remove', 'mp-damage', 'heal', 'ko'].includes(e.type));
        expect(did, `seed ${seed} ${reel}: a full-charge action that emitted nothing`).toBe(true);
      }
    }
    console.log(`Lady Luck, 24 unattended spins: ${wins} paid, ${duds} Dud`);
    // Six symbols a reel: most blind spins are Duds. That is the mechanic.
    expect(duds).toBeGreaterThan(0);
  });
});
