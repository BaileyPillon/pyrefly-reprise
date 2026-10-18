/**
 * The player's Zanmato against the game's own runs (re-parity lane FFX-K, the Zanmato fix of 2026-10-15; **FFX only**).
 *
 * Source: `research/re-ffx-zanmato-and-orders.md` Part 1 (branch `re-ffx-zanmato-and-orders`). The two fixtures are stratified subsets of that note's runs of the game's own
 * machine code (FFX.exe, Steam build 25501027) in the x86-32 emulator with only the random-number function scripted; the game was never run:
 *
 * - `zanmato_pick.json`: 300 of the 1,500 pick vectors. The auto-target (0x7996d0) on command 0x30E2 with the bytes the game's own lookup reads from its command record
 *   (`Cmd+0x1a` = 0xb7, `Cmd+0x1b` = 0x04), over 1 to 8 monsters with groups 0 to 2, battle distance 0 to 3, Targetable and dead flags; then the action itself (the
 *   calculator and the hit applier) on the mask it returned.
 * - `zanmato_outcomes.json`: 50 of the 1,800 mixed-state vectors. The calculator (0x7892e0) and the hit applier (0x78f060) on 1, 2, 3, 4 and 8 targets that are living,
 *   Zombie, Auto-Life, Zombie with Auto-Life, Doom or Scan, with Death resistance 0, 100, 254 or 255, HP 1 to 1,000,000 and random monster flag words (Slice included).
 *
 * The first is replayed through the kernel the engine's pick uses (`kernel/legal-set.ts#autoTargetMask`) AND through the oracle (`helpers/ffxZanmatoOracle.ts`, the note's
 * rule written again), and the second through the whole engine: a real Pay of the player's Yojimbo that buys a Zanmato against foes built from the vector.
 */

import { describe, expect, it } from 'vitest';
import type { ImmunityFlag } from '../../src/battle/common/types.ts';
import { autoTargetMask } from '../../src/battle/ffx/kernel/legal-set.ts';
import { YOJIMBO_COMMAND_B1A, YojimboCommand } from '../../src/battle/ffx/kernel/yojimbo.ts';
import { commandOfVector, inputOf, scriptedPick, targetFixture, worldOfVector } from './helpers/ffxTargetFixtures.ts';
import { type OracleFoe, pick } from './helpers/ffxZanmatoOracle.ts';
import { type Spec, STATUS_STREAM, kos, payForZanmato, types } from './helpers/ffxZanmatoRig.ts';

interface PickChr {
  inBattle?: number;
  removed?: number;
  dead?: number;
  targetable?: number;
  far?: number;
  group?: number;
}

describe('zanmato_pick.json: whom the player\'s Zanmato is aimed at (note section 2)', () => {
  const fx = targetFixture('zanmato_pick');

  it('the fixture is the game\'s: 300 vectors, the command bytes are 0xb7 and 0x04 (group type, reach 1), the user is Yojimbo\'s slot 14', () => {
    expect(fx.vectors).toHaveLength(300);
    for (const v of fx.vectors) {
      const input = inputOf(fx, v.in);
      expect(input['user']).toBe(14);
      expect(input['cmdId']).toBe(0x30e2);
      expect(input['cmd']).toEqual({ b1a: 0xb7, b1b: 0x04 });
    }
    // The engine hands the pick the same bytes: its table for Zanmato is the game's record.
    expect(YOJIMBO_COMMAND_B1A[YojimboCommand.Zanmato]).toBe(0xb7);
  });

  it('every vector: the kernel the engine\'s pick uses returns the game\'s mask and takes the game\'s draws (one stream-5 draw when any monster is legal, none otherwise)', () => {
    let withDraw = 0;
    let withoutDraw = 0;
    let multiGroup = 0;
    for (const v of fx.vectors) {
      const input = inputOf(fx, v.in);
      const world = worldOfVector(input['chrs'] as Record<string, Record<string, number>>);
      const { pick: scripted, used } = scriptedPick(v.rngDraws);
      const mask = autoTargetMask(world, input['user'] as number, input['cmdId'] as number, input['side'] as number, commandOfVector(input['cmd'] as Record<string, number>), scripted);
      expect(mask >>> 0, `vector ${v.id}`).toBe(v.out['mask']);
      expect(used(), `vector ${v.id} draws`).toBe(v.rngDraws?.length ?? 0);
      if (used() === 1) withDraw++;
      else withoutDraw++;
      const groups = new Set(Object.entries(input['chrs'] as Record<string, PickChr>).filter(([slot, c]) => Number(slot) >= 0x14 && (c.group ?? 0) > 0).map(([, c]) => c.group));
      if (groups.size > 0) multiGroup++;
    }
    expect(withDraw).toBe(268); // the stratified subset keeps the note's mix: 268 with a legal monster, 32 with none
    expect(withoutDraw).toBe(32);
    expect(multiGroup, 'vectors with more than one group in play').toBeGreaterThan(40);
  });

  it('every vector: the oracle (the note\'s rule written out again, no kernel imported) names the same mask and the same draw count', () => {
    for (const v of fx.vectors) {
      const input = inputOf(fx, v.in);
      const chrs = input['chrs'] as Record<string, PickChr>;
      const foes: OracleFoe[] = Object.entries(chrs)
        .filter(([slot]) => Number(slot) >= 0x14)
        .map(([slot, c]) => ({
          id: slot,
          order: Number(slot),
          group: c.group ?? 0,
          inBattle: c.inBattle === 1 && c.removed !== 1,
          targetable: (c.targetable ?? 0) !== 0,
          dead: c.dead === 1,
          distance: c.far ?? 0,
          maxHp: 1,
        }));
      const got = pick(foes, v.rngDraws?.[0]?.value);
      expect(got.draws, `vector ${v.id} draws`).toBe(v.rngDraws?.length ?? 0);
      expect(got.members.reduce((m, f) => m | (1 << f.order), 0) >>> 0, `vector ${v.id}`).toBe(v.out['mask']);
    }
  });

  it('what the game then did to the mask: every member died with HP 0, every other monster is exactly as it was, whatever its Death resistance or flag word', () => {
    let slice = 0;
    let members = 0;
    for (const v of fx.vectors) {
      const mask = v.out['mask'] as number;
      const fate = v.out['fate'] as Record<string, { hpBefore: number; deadBefore: number; hp: number; dead: number; resist: number; special: number }>;
      for (const [slot, f] of Object.entries(fate)) {
        if (((mask >>> Number(slot)) & 1) === 1) {
          members++;
          expect([f.dead, f.hp], `vector ${v.id} slot ${slot}`).toEqual([1, 0]);
          if ((f.special & 0x200) !== 0) slice++;
        } else {
          expect([f.dead, f.hp], `vector ${v.id} slot ${slot}`).toEqual([f.deadBefore, f.hpBefore]);
        }
      }
    }
    expect(members).toBeGreaterThan(300);
    expect(slice, 'Slice-immune targets in the masks, all killed').toBeGreaterThan(50);
  });
});

/** The game's monster flag word (`Chr+0x5B8`) as the engine's flags: every bit that has a field here (Slice, bit 9, has none: it does nothing in this build). */
const FLAG_BITS: ReadonlyArray<readonly [number, ImmunityFlag]> = [
  [0, 'armored'], [1, 'immune-to-percentage-damage'], [2, 'immune-to-life'], [3, 'immune-to-sensor'], [4, 'immune-to-scan'], [5, 'immune-to-physical-damage'],
  [6, 'immune-to-magical-damage'], [7, 'immune-to-damage'], [8, 'immune-to-delay'], [10, 'immune-to-bribe'],
];

interface OutTarget {
  slot: number;
  perm?: number;
  extra?: number;
  special?: number;
  deathResist?: number;
  hp: number;
}

describe('zanmato_outcomes.json: what a landed Zanmato does, the whole engine against the game\'s runs (note section 3)', () => {
  const fx = targetFixture('zanmato_outcomes');

  it('50 vectors on 1, 2, 3, 4 and 8 targets: every target the game killed dies in the engine, the Auto-Life holders are the ones revived, and the draws are one per target', () => {
    expect(fx.vectors).toHaveLength(50);
    let targets = 0;
    let holders = 0;
    let zombies = 0;
    let slice = 0;
    for (const v of fx.vectors) {
      const list = (v.in['targets'] as OutTarget[]) ?? [];
      const specs: Spec[] = list.map((t) => ({
        id: `m${t.slot}`,
        hp: t.hp,
        res: t.deathResist ?? 0,
        autoLife: ((t.extra ?? 0) & 0x200) !== 0,
        has: [...(((t.perm ?? 0) & 2) !== 0 ? (['zombie'] as const) : []), ...(((t.extra ?? 0) & 0x4000) !== 0 ? (['doom'] as const) : []), ...(((t.extra ?? 0) & 0x1) !== 0 ? (['scan'] as const) : [])],
        flags: FLAG_BITS.filter(([bit]) => (((t.special ?? 0) >> bit) & 1) === 1).map(([, flag]) => flag),
      }));
      const run = payForZanmato(specs, { seed: 1 + v.id });
      const fate = v.out['fate'] as Record<string, { hp: number; dead: number }>;
      const revive = (v.out['revive'] as number[]).map((slot) => `m${slot}`);

      // The game killed every target (all 1,800 vectors do); the engine's Zanmato is aimed at all of them, in slot order, and kills them in that order.
      expect(Object.values(fate).every((f) => f.dead === 1 && f.hp === 0), `vector ${v.id} (the game)`).toBe(true);
      expect(run.events.find((e) => e.type === 'action-start' && e.abilityId === 'zanmato'), `vector ${v.id}`).toBeDefined();
      const revived = types(run.events, 'revive').map((e) => (e.type === 'revive' ? e.targetId : ''));
      expect([...revived].sort(), `vector ${v.id} revives`).toEqual([...revive].sort());
      for (const t of list) {
        const c = run.rig.fighter(`m${t.slot}`);
        const holder = revive.includes(`m${t.slot}`);
        if (holder) {
          expect([c.alive, c.hp, c.statuses['auto-life']], `vector ${v.id} slot ${t.slot} (Auto-Life stripped, revived at a quarter)`).toEqual([true, Math.max(1, Math.floor(t.hp / 4)), undefined]);
          holders++;
        } else {
          expect([c.alive, c.hp, Object.keys(c.statuses)], `vector ${v.id} slot ${t.slot}`).toEqual([false, 0, ['ko']]);
        }
        targets++;
        if (((t.perm ?? 0) & 2) !== 0) zombies++;
        if (((t.special ?? 0) & 0x200) !== 0) slice++;
      }
      expect(kos(run.events).length + revived.length, `vector ${v.id}: every target died once`).toBe(list.length);

      // The draws: the game's hit took one status draw per target, all on the user's one status stream (the harness's user is a party-style slot, so its stream is 66; the
      // engine's user is an aeon, so 59: the same mode-2 stream of the same kind of user, and the same count). The engine adds the script's roll and ONE group draw.
      expect(new Set(v.rngDraws?.map((d) => d.stream)).size, `vector ${v.id}`).toBe(1);
      expect(v.rngDraws, `vector ${v.id}`).toHaveLength(list.length);
      expect(run.streams, `vector ${v.id}`).toEqual([17, 5, ...Array<number>(list.length).fill(STATUS_STREAM)]);
    }
    expect(targets).toBe(10 * (1 + 2 + 3 + 4 + 8));
    expect(holders, 'Auto-Life holders in the sample').toBeGreaterThan(20);
    expect(zombies, 'Zombies in the sample').toBeGreaterThan(20);
    expect(slice, 'Slice-flagged targets in the sample').toBeGreaterThan(40);
  });
});
