/**
 * **Engine-level parity, the Overdrive results: the user's rank and the timing factor** (re-parity RC9, lane FFX-B; **FFX only**: Swordplay and Bushido do
 * not exist in FFX-2). Oracles: the vectors of the game's own machine code run in the Unicorn harness
 * (`tests/fixtures/parity/ffx/overdrive_rank.json` and `overdrive_scale.json`, made by the lane's `gen_od_results.py`) and numbers restated from the private
 * notes `FFX-G01` (sections 4.1, 5, 6.1 and rows 17, 22 and 22b of section 10) and `FFX-H01` (section 3.5), not read back from the engine.
 *
 * 1. **B2, the rank.** The user is charged the MENU command's rank whatever the grade: the rank is stored in `Chr+0xDE8` when the action is first calculated
 *    (`0x7892E0`), the result handler (`0x7B0470` / `0x7AFE00`) never writes it, and the action-done call (`0x7B20E0`) pays it. 456 vectors of that chain on
 *    the real code (every Overdrive x Fail / success / (Immune) row x agility x Haste / Slow) against the engine's `executeCommand` and `chargeForAction`.
 *    Tornado and Blitz Ace cost 7 on a Fail; the engine charged 6, the rank of the replacement row.
 * 2. **B3, the factor in the game's units.** `A` and `B` reach the scale override as float32 SECONDS, `A = float32(B - frame / 30)`; the engine fed it float32
 *    milliseconds, which differs by one point in about 1 percent of the (instant, damage) pairs the game can produce. 267 frames (every limit) x 64 damages
 *    on the real timer (`0x891AC0`) and the real override (`0x78BD90`) against the engine's `timingBonusFrom` -> `hitInputOf` -> `damageScaleOverride`.
 * 3. **B4 is NOT built** (gated on the animation script, `FFX-G01` open question 4). One test pins the reading the engine keeps, so that the later change
 *    is a decision and not an accident.
 *
 * Mutants (the old rules, written as oracles) must disagree with the vectors, so the comparisons are shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { AbilityDef, Command, EnemyDef, FFXCombatant, MinigameResult, StatusId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle } from '../../src/battle/ffx/index.ts';
import { resolveCommand } from '../../src/battle/ffx/adapt/command.ts';
import { hitInputOf } from '../../src/battle/ffx/adapt/hit.ts';
import { chargeForAction, executeCommand } from '../../src/battle/ffx/execute.ts';
import { damageScaleOverride } from '../../src/battle/ffx/kernel/modifiers.ts';
import { timingScale } from '../../src/battle/ffx/kernel/minigame-timer.ts';
import { rollDefaultMinigame, timingBonusFrom } from '../../src/battle/ffx/overdrive.ts';
import { rowFromExtra, shapeOverdrive } from '../../src/battle/ffx/overdriveShape.ts';
import { type Ctx, type EventInput, rtOf } from '../../src/battle/ffx/state.ts';
import { recoveryTicks } from '../../src/battle/ffx/turnQueue.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { ABILITIES as WAKKA_1 } from '../../src/data/ffx/abilities/overdrive-wakka-1.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { attackAbility, enemy, fighter, member, party, setup, stats } from './ffx-fixtures.test.ts';

// ---------------------------------------------------------------------------------------------------------------------- the note's numbers

type Who = 'tidus' | 'auron';

/** FFX-G01 section 4.1 / FFX-H01 section 3.5: [command id, ability id, user, the MENU row's rank, the limit in seconds]. */
const OVERDRIVES: ReadonlyArray<readonly [cmd: number, id: string, who: Who, rank: number, limit: number]> = [
  [0x3060, 'spiral-cut', 'tidus', 3, 3],
  [0x3061, 'slice-and-dice', 'tidus', 4, 3],
  [0x3062, 'energy-rain', 'tidus', 5, 3],
  [0x3063, 'blitz-ace', 'tidus', 7, 2],
  [0x3064, 'shooting-star', 'auron', 5, 4],
  [0x3065, 'dragon-fang', 'auron', 5, 4],
  [0x3066, 'banishing-blade', 'auron', 6, 4],
  [0x3067, 'tornado', 'auron', 7, 3],
];
const DEF_OF: Readonly<Record<string, AbilityDef>> = { ...TIDUS, ...AURON };

/** The bit pattern of a float32 (read the way a file would, not through the engine's own `Math.fround`). */
function bits(x: number): number {
  return new DataView(new Float32Array([x]).buffer).getUint32(0, true);
}
function floatOf(b: number): number {
  return new Float32Array(new Uint32Array([b]).buffer)[0] as number;
}
function status(id: StatusId): FFXCombatant['statuses'][StatusId] {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** A battle in which `who` holds a full gauge and stands at agility `agi`, with one dummy enemy (`foe` overrides it). */
function battle(who: Who, def: AbilityDef, agi: number, foe: Partial<EnemyDef> = {}, seed = 1): { ctx: Ctx; actor: FFXCombatant; target: FFXCombatant; events: EventInput[] } {
  const events: EventInput[] = [];
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  const ctx = buildBattle(
    setup({
      party: party({
        members: [
          member({ id: 'tidus', ...(who === 'tidus' ? { overdrive: od, stats: stats({ agi }) } : {}) }),
          member({ id: 'auron', ...(who === 'auron' ? { overdrive: od, stats: stats({ agi }) } : {}) }),
          member({ id: 'yuna' }),
        ],
        activeSlots: ['tidus', 'auron', 'yuna'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999, ...foe })] },
    }),
    new SeededRng(seed),
    reg,
    (e) => events.push(e),
  );
  return { ctx, actor: ctx.state.combatants[who] as FFXCombatant, target: ctx.state.combatants['dummy'] as FFXCombatant, events };
}

// ---------------------------------------------------------------------------------------------------------------------- B2: the rank

interface Fired {
  rank: number;
  ctb: number;
  immuneRow: boolean;
}

/** One Overdrive through the engine's own path: the agility and Haste / Slow set, the counter at 0, the command executed, the turn charged. */
function fire(cmd: number, grade: number, agi: number, haste: number, slow: number, foe: Partial<EnemyDef> = {}): Fired {
  const [, id, who, , limit] = OVERDRIVES.find((o) => o[0] === cmd)!;
  const def = DEF_OF[id] as AbilityDef;
  const { ctx, actor, target } = battle(who, def, agi, foe);
  if (haste !== 0) actor.statuses['haste'] = status('haste');
  if (slow !== 0) actor.statuses['slow'] = status('slow');
  const success = grade !== 0;
  const result: MinigameResult =
    who === 'tidus'
      ? { kind: 'tidus-timing', timing: { success, timeRemainingMs: success ? 1500 : 0, timerMs: limit * 1000 } }
      : { kind: 'auron-sequence', sequence: { success, correctInputs: success ? 7 : 2, timeRemainingMs: success ? 2500 : 0 } };
  const immuneRow = shapeOverdrive(ctx, actor, def, result).options.rowFor?.(target) !== undefined;
  const command: Command = { kind: 'overdrive', id, targets: ['dummy'], extra: result };
  const done = executeCommand(ctx, actor, command, true);
  rtOf(ctx, actor.id).ctb = 0;
  chargeForAction(ctx, actor.id, done.rank);
  return { rank: done.rank, ctb: rtOf(ctx, actor.id).ctb, immuneRow };
}

/** The foe a vector's target fields describe, in the engine's words (typed again from FFX-G01 section 4.3). */
function foeOf(target: Record<string, unknown> | undefined): Partial<EnemyDef> {
  if (!target) return {};
  const out: Partial<EnemyDef> = {};
  if (target['extraImmune'] === 0x100) out.immunities = { eject: 255 };
  if (target['delayImmune'] === 255) out.immunityFlags = ['immune-to-delay'];
  if (target['resist']) out.immunities = { 'power-break': 255, 'magic-break': 255, 'armor-break': 255, 'mental-break': 255 };
  return out;
}

describe('B2: the user is charged the menu command\'s rank, whatever the grade (FFX-G01 row 17, FFX-H01 section 3.5)', () => {
  const fixture = loadFfxParityFixture('overdrive_rank');
  const chain = (fixture?.vectors ?? []).filter((v) => v.class !== 'table');

  it('the fixture is there: 476 vectors of the real chain (20 table rows, 192 fails, 192 successes, 72 (Immune) rows)', () => {
    expect(fixture).not.toBeNull();
    expect(fixture!.vectors).toHaveLength(476);
    const count: Record<string, number> = {};
    for (const v of fixture!.vectors) count[v.class] = (count[v.class] ?? 0) + 1;
    expect(count).toEqual({ table: 20, fail: 192, success: 192, immune: 72 });
  });

  it('the game\'s command table: the eight menu ranks are the engine\'s data ranks; the replacement rows\' ranks are the ones that never reach the user', () => {
    const table = new Map(fixture!.vectors.filter((v) => v.class === 'table').map((v) => [v.in['cmd'] as number, v.out['rank'] as number]));
    for (const [cmd, id, , rank] of OVERDRIVES) {
      expect(table.get(cmd), `the game's menu rank of ${id}`).toBe(rank); // typed again above, and read from the real table
      expect(DEF_OF[id]!.rank, `the engine's data rank of ${id}`).toBe(rank);
      expect(DEF_OF[id]!.extra?.['failRank'], `${id} carries no failRank any more`).toBeUndefined();
    }
    // the Fail rows 0x30EB..0x30ED are 3, 4, 5 and 0x310A..0x310D are 5, 5, 6, 6; the (Immune) rows 0x310E..0x3111 are 5, 5, 6, 6; the finisher 0x3112 is 6
    expect([0x30eb, 0x30ec, 0x30ed, 0x310a, 0x310b, 0x310c, 0x310d, 0x310e, 0x310f, 0x3110, 0x3111, 0x3112].map((c) => table.get(c))).toEqual([3, 4, 5, 5, 5, 6, 6, 5, 5, 6, 6, 6]);
  });

  it('the result handler never writes the rank, whichever row it picks: the byte is the same before and after it in every vector', () => {
    for (const v of chain) {
      expect(v.out['rankAfter'], `vector ${v.id}`).toBe(v.out['rankFirst']);
      expect(v.out['armedCleared'], `vector ${v.id}: the handler ran`).toBe(true);
    }
    const variants = (cls: string): Set<unknown> => new Set(chain.filter((x) => x.class === cls).map((x) => x.out['variant']));
    expect(variants('fail')).toEqual(new Set([0])); // the Fail rows
    expect(variants('immune')).toEqual(new Set([2])); // the (Immune) rows
    expect(variants('success')).toEqual(new Set([1, 2])); // Tornado's ordinary success is its 20 x 2 row, which the game files under the (Immune) variant
  });

  it('every vector: the engine\'s executeCommand returns the rank the game stored, and its turn charge equals the game\'s recovery (agility 5 to 255, Haste, Slow)', () => {
    const wrong: string[] = [];
    let immuneRows = 0;
    for (const v of chain) {
      const i = expandVectorInput(fixture!.defaults, v.in);
      const got = fire(i['cmd'] as number, i['grade'] as number, i['agi'] as number, i['haste'] as number, i['slow'] as number, v.class === 'immune' ? foeOf(i['target'] as Record<string, unknown>) : {});
      if (got.rank !== v.out['rankAfter'] || got.ctb !== v.out['ctb']) {
        wrong.push(`vector ${v.id} (${v.class}, cmd ${(i['cmd'] as number).toString(16)}, grade ${i['grade']}, agi ${i['agi']}, haste ${i['haste']}, slow ${i['slow']}): engine rank ${got.rank} ctb ${got.ctb}, game rank ${v.out['rankAfter']} ctb ${v.out['ctb']}`);
      }
      if (v.class === 'immune' && got.immuneRow) immuneRows++;
    }
    expect(wrong).toEqual([]);
    expect(chain).toHaveLength(456);
    expect(immuneRows, 'the engine took the (Immune) row on every vector where the game did').toBe(72);
  });

  it('every Fail and (Immune) row the engine builds carries its move\'s MENU rank: the replacement rows\' own ranks (3 to 6) never reach the engine\'s charge either', () => {
    for (const [, id, , rank] of OVERDRIVES) {
      const def = DEF_OF[id] as AbilityDef;
      for (const row of ['fail', 'immune'] as const) {
        const built = rowFromExtra(def, row);
        if (built !== undefined) expect(built.rank, `${id} ${row} row`).toBe(rank); // Tornado and Blitz Ace have no (Immune) row, the Swordplay moves none either
      }
    }
    expect(rowFromExtra(DEF_OF['tornado'] as AbilityDef, 'fail')?.rank).toBe(7);
    expect(rowFromExtra(DEF_OF['blitz-ace'] as AbilityDef, 'fail')?.rank).toBe(7);
    expect(rowFromExtra(DEF_OF['banishing-blade'] as AbilityDef, 'immune')?.rank).toBe(6);
  });

  it('a Fail costs the menu rank, a success costs the menu rank: Tornado and Blitz Ace pay 7 either way (13 ticks a point at agility 14)', () => {
    for (const [cmd, id, , rank] of OVERDRIVES) {
      expect(fire(cmd, 0, 14, 0, 0).rank, `${id} fails`).toBe(rank);
      expect(fire(cmd, 1, 14, 0, 0).rank, `${id} succeeds`).toBe(rank);
    }
    expect(fire(0x3067, 0, 14, 0, 0).ctb).toBe(13 * 7);
    expect(fire(0x3063, 0, 14, 0, 0).ctb).toBe(13 * 7);
  });

  it('mutant "the replacement row\'s rank on a Fail" (the old engine) disagrees with the game on all 48 Fail vectors of Tornado and Blitz Ace', () => {
    const fails = chain.filter((v) => v.class === 'fail' && ([0x3063, 0x3067] as unknown[]).includes(v.in['cmd']));
    expect(fails).toHaveLength(48); // 2 moves x 8 agilities x 3 Haste / Slow settings
    let differ = 0;
    for (const v of fails) {
      const i = expandVectorInput(fixture!.defaults, v.in);
      const user = fighter({ id: 'u', stats: stats({ agi: i['agi'] as number }) });
      if ((i['haste'] as number) !== 0) user.statuses['haste'] = status('haste');
      if ((i['slow'] as number) !== 0) user.statuses['slow'] = status('slow');
      if (recoveryTicks(user, 6) !== v.out['ctb']) differ++; // rank 6: what the old `failRank` charged
      expect(recoveryTicks(user, 7), `vector ${v.id}`).toBe(v.out['ctb']); // rank 7 is the game's
    }
    expect(differ).toBe(48);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- B3: the factor in the game's units

describe('B3: A and B reach the scale override as float32 seconds, A = float32(B - frame / 30) (FFX-G01 section 5, row 22)', () => {
  const fixture = loadFfxParityFixture('overdrive_scale');
  const damages = (fixture?.defaults['damages'] ?? []) as number[];
  const frames = (fixture?.vectors ?? []).map((v) => ({ limit: v.in['limit'] as number, frame: v.in['frame'] as number, aBits: v.out['aBits'] as number, scaled: v.out['scaled'] as number[] }));

  it('the fixture is there: every frame of the three limits whose input is still accepted (59 + 89 + 119 frames) x 64 damages', () => {
    expect(fixture).not.toBeNull();
    expect(damages).toHaveLength(64);
    expect(frames).toHaveLength(59 + 89 + 119);
    for (const limit of [2, 3, 4]) expect(frames.filter((f) => f.limit === limit)).toHaveLength(limit * 30 - 1); // the frame that finds A at 0 is not listed
  });

  it('timingScale gives the A and B of the real timer, bit for bit, at every frame', () => {
    const wrong = frames.filter((f) => {
      const s = timingScale(f.limit * 1000, 0, f.frame);
      return bits(s.a) !== f.aBits || bits(s.b) !== bits(f.limit);
    });
    expect(wrong).toEqual([]);
  });

  it('through the engine\'s own path (timingBonusFrom -> HitRequest -> hitInputOf -> the override): the damage equals the real override\'s for all 22,784 pairs (four Overdrives)', () => {
    const wrong: string[] = [];
    let compared = 0;
    for (const [id, who, limit] of [['spiral-cut', 'tidus', 3], ['blitz-ace', 'tidus', 2], ['dragon-fang', 'auron', 4], ['tornado', 'auron', 3]] as const) {
      const def = DEF_OF[id] as AbilityDef;
      const { actor, target } = battle(who, def, 20);
      for (const f of frames.filter((x) => x.limit === limit)) {
        // the result as the overlay builds it: the timer's A in milliseconds, and the controller frame
        const ms = floatOf(f.aBits) * 1000;
        const result: MinigameResult =
          who === 'tidus'
            ? { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: ms, timerMs: limit * 1000, frame: f.frame } }
            : { kind: 'auron-sequence', sequence: { success: true, correctInputs: 7, timeRemainingMs: ms, frame: f.frame } };
        const timing = timingBonusFrom(result, def);
        const input = hitInputOf({ actor, statsUser: actor, target, row: def, timing, targetCtb: 0, targetTick: 10, isCounter: false }, resolveCommand(def, actor));
        for (let k = 0; k < damages.length; k++) {
          compared++;
          const got = damageScaleOverride(input.user.scale, damages[k] as number);
          if (got !== f.scaled[k]) wrong.push(`${id} frame ${f.frame} damage ${damages[k]}: engine ${got}, game ${f.scaled[k]}`);
        }
      }
    }
    expect(wrong.slice(0, 10)).toEqual([]);
    expect(compared).toBe((89 + 59 + 119 + 89) * 64); // Spiral Cut 89 frames, Blitz Ace 59, Dragon Fang 119, Tornado 89
  });

  it('a result with no frame (the overlay\'s milliseconds alone, the headless stand-in) is read as the float32 of its seconds: the same A at every game instant', () => {
    for (const f of frames) expect(bits(timingScale(f.limit * 1000, floatOf(f.aBits) * 1000).a), `limit ${f.limit}, frame ${f.frame}`).toBe(f.aBits);
    // an instant the game cannot produce (the stand-in rolls whole milliseconds) is still read in seconds, clamped to 0..limit
    expect(timingScale(3000, 2994)).toEqual({ a: Math.fround(2.994), b: 3 });
    expect(timingScale(3000, 9999).a).toBe(3);
    expect(timingScale(3000, -5).a).toBe(0);
  });

  it('the frame, not the milliseconds, makes A when a result carries both (the game\'s A is the timer\'s value at that frame)', () => {
    const at = (limit: number, frame: number): number => (frames.find((f) => f.limit === limit && f.frame === frame) as (typeof frames)[number]).aBits;
    const swordplay: MinigameResult = { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 1234, timerMs: 3000, frame: 20 } };
    const bushido: MinigameResult = { kind: 'auron-sequence', sequence: { success: true, correctInputs: 8, timeRemainingMs: 1234, frame: 20 } };
    expect(bits(timingBonusFrom(swordplay, TIDUS['spiral-cut'] as AbilityDef)!.scale!.a)).toBe(at(3, 20));
    expect(bits(timingBonusFrom(bushido, AURON['dragon-fang'] as AbilityDef)!.scale!.a)).toBe(at(4, 20));
  });

  it('a failure earns A = 0 (a factor of exactly 1) however much time the clock showed and whichever frame it carries', () => {
    const def = TIDUS['spiral-cut'] as AbilityDef;
    for (const frame of [91, 10]) {
      const failed: MinigameResult = { kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 2900, timerMs: 3000, frame } };
      expect(timingBonusFrom(failed, def)?.scale, `frame ${frame}`).toEqual({ a: 0, b: 3 });
    }
    const bushido: MinigameResult = { kind: 'auron-sequence', sequence: { success: false, correctInputs: 2, timeRemainingMs: 3900, frame: 10 } };
    expect(timingBonusFrom(bushido, AURON['dragon-fang'] as AbilityDef)?.scale).toEqual({ a: 0, b: 4 });
    expect(damageScaleOverride({ a: 0, b: 3 }, 1234)).toBe(1234);
  });

  it('Wakka\'s reels are untouched: no scale, so the override is fed the two milliseconds as before (what his script passes is unread)', () => {
    const reel = WAKKA_1['element-reels'] as AbilityDef;
    const result: MinigameResult = { kind: 'wakka-reels', reels: { symbols: ['fire', 'fire', 'fire'], threeOfAKind: true, timeRemainingMs: 12345 } };
    const bonus = timingBonusFrom(result, reel);
    expect(bonus).toEqual({ timeRemainingMs: 12345, timerMs: 20000 });
    expect(bonus?.scale).toBeUndefined();
    const { actor, target } = battle('tidus', reel, 20);
    const input = hitInputOf({ actor, statsUser: actor, target, row: reel, timing: bonus, targetCtb: 0, targetTick: 10, isCounter: false }, resolveCommand(reel, actor));
    expect(input.user.scale).toEqual({ a: 12345, b: 20000 });
  });

  it('the headless stand-in keeps its draws and now reads its whole milliseconds as float32 seconds (200 seeds)', () => {
    const def = TIDUS['spiral-cut'] as AbilityDef;
    for (let seed = 1; seed <= 200; seed++) {
      const { ctx, actor } = battle('tidus', def, 20, {}, seed);
      const roll = rollDefaultMinigame(ctx, 'tidus-timing', def, actor);
      if (roll.kind !== 'tidus-timing') throw new Error('the stand-in rolled another kind');
      const left = roll.timing.success ? roll.timing.timeRemainingMs : 0;
      expect(Number.isInteger(left)).toBe(true); // whole milliseconds, as before
      expect(timingBonusFrom(roll, def)?.scale).toEqual({ a: Math.fround(left / 1000), b: 3 });
    }
  });

  // The comparisons can fail: three wrong readings, each shown to disagree with the real override on many pairs.
  const differing = (read: (f: (typeof frames)[number]) => { a: number; b: number }): number => {
    let n = 0;
    for (const f of frames) {
      const s = read(f);
      for (let k = 0; k < damages.length; k++) if (damageScaleOverride(s, damages[k] as number) !== f.scaled[k]) n++;
    }
    return n;
  };
  it('mutant "float32 milliseconds" (the old engine) disagrees with the game on about 1 percent of the pairs', () => {
    const n = differing((f) => ({ a: floatOf(f.aBits) * 1000, b: f.limit * 1000 }));
    expect(n).toBeGreaterThan(100);
    expect(n).toBeLessThan(400);
  });
  it('mutant "a frame early" and mutant "25 ticks a second" disagree on most pairs', () => {
    expect(differing((f) => ({ a: timingScale(f.limit * 1000, 0, f.frame - 1).a, b: f.limit }))).toBeGreaterThan(5000);
    expect(differing((f) => ({ a: Math.fround(f.limit - f.frame / 25), b: f.limit }))).toBeGreaterThan(5000);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- B4: not built

describe('B4 is OPEN (not built; FFX-G01 row 22b and open question 4): the factor still reaches every hit of an ability', () => {
  it('Blitz Ace: the eight kicks and the finisher all carry the timing factor, as the engine has always read it (the game\'s reach for Blitz Ace is the last hit only [I])', () => {
    const def = TIDUS['blitz-ace'] as AbilityDef;
    const run = (timeRemainingMs: number): number[] => {
      const { ctx, actor, events } = battle('tidus', def, 20);
      const result: MinigameResult = { kind: 'tidus-timing', timing: { success: true, timeRemainingMs, timerMs: 2000 } };
      executeCommand(ctx, actor, { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result }, true);
      return events.flatMap((e) => (e.type === 'damage' && e.sourceId === 'tidus' ? [e.amount] : []));
    };
    const none = run(0); // A = 0: a factor of exactly 1
    const quick = run(1900); // about +47 percent
    expect(none).toHaveLength(9);
    expect(quick).toHaveLength(9);
    // when B4 is built, hits 1 to 8 stop growing and this test is changed on purpose, with the new total next to it
    for (let k = 0; k < 9; k++) expect(quick[k], `hit ${k + 1} of 9`).toBeGreaterThan(none[k] as number);
  });
});
