/**
 * **Re-parity, Chapter X (1 of 2): Natus's and Mortibody's turns and the Desperado ladder** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 4 (tables 4.3 and 4.5); the rows that differ from the old AI are D-19, D-21
 * and D-22 of the note's section 6. The numbers are the interpreter's: the element index that Natus advances and Mortibody
 * reads, and the Desperado ladder `(total - 3) / 4`. The second half is `parity-ffx-ai-natus-hooks.test.ts`: the hit hooks,
 * the revive and the pair of party slots.
 */

import { describe, expect, it } from 'vitest';
import type { StatusId } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { summonAeon } from '../../src/battle/ffx/aeons.ts';
import { desperadoScore } from '../../src/battle/ffx/ai/seymour-natus-rules.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import { at, idOf, realCtx, status, withRng } from './helpers/seymourParity.ts';

const NATUS = 'seymour-natus';
const BODY = 'mortibody';
const PHASE = 'natus.phase';
const STEP = 'natus.elementStep';
const fresh = (seed = 1) => realCtx('seymour-natus', seed, highbridgeBuild);

describe('Natus\'s turn (m126 onTurn @0x258, table 4.3)', () => {
  it('phase 0: the Multi-ra of the element at the index, and the index moves on after the cast: Ice, Thunder, Water, Fire (rows 2, D-19)', () => {
    const { ctx } = fresh();
    const seq = Array.from({ length: 8 }, () => idOf(chooseAiCommand(ctx, at(ctx, NATUS))));
    expect(seq).toEqual([
      'natus-multi-blizzara', 'natus-multi-thundara', 'natus-multi-watera', 'natus-multi-fira',
      'natus-multi-blizzara', 'natus-multi-thundara', 'natus-multi-watera', 'natus-multi-fira',
    ]);
    expect(ctx.state.flags[STEP]).toBe(0);
  });

  it('the cast is two commands at two party slots, drawn the way the script draws: a mask draw, the left-out slot, the coin', () => {
    const { ctx } = fresh();
    const [t, y, k] = ctx.state.activeIds as [string, string, string];
    const rng = withRng(ctx, [0, 0, 75]); // mask picker (discarded), slot 1 left out, coin true: ascending
    const command = chooseAiCommand(ctx, at(ctx, NATUS));
    expect(rng.spent).toEqual({ script: 2, picker: 1, other: 0 });
    expect(command?.targets).toEqual([y, k]);
    withRng(ctx, [0, 1, 10]); // slot 2 left out, coin false: descending
    expect(chooseAiCommand(ctx, at(ctx, NATUS))?.targets).toEqual([k, t]);
  });

  it('phase 1 is Break on a random living member and phase 2 is Flare, one picker draw and no other (rows 3 and 4)', () => {
    for (const [phase, want] of [[2, 'natus-break'], [3, 'natus-flare']] as const) {
      const { ctx } = fresh();
      ctx.state.flags[PHASE] = phase;
      const rng = withRng(ctx, [4]);
      const command = chooseAiCommand(ctx, at(ctx, NATUS));
      expect(idOf(command), `phase ${phase}`).toBe(want);
      expect(rng.spent).toEqual({ script: 0, picker: 1, other: 0 });
      expect(command?.targets).toEqual([ctx.state.activeIds[4 % 3]]); // 4 mod 3 = 1: slot 2
      expect(ctx.state.flags[STEP] ?? 0).toBe(0); // only the phase-0 cast moves the index
    }
  });

  it('an aeon in the battle: Banish on it at once, in every phase, with no count of its turns; the index stays where it was (row 1, D-22)', () => {
    for (const phase of [1, 2, 3]) {
      const { ctx } = fresh();
      ctx.state.flags[PHASE] = phase;
      ctx.state.flags[STEP] = 2;
      summonAeon(ctx, 'yuna', 'valefor'); // no turn taken yet: the old AI waited for one
      const command = chooseAiCommand(ctx, at(ctx, NATUS));
      expect(idOf(command), `phase ${phase}`).toBe('banish');
      expect(command?.targets).toEqual(['valefor']);
      expect(ctx.state.flags[STEP]).toBe(2);
    }
  });
});

describe('The element index belongs to Natus; Mortibody only reads it (D-19, m126 @0x29c to 0x2f1, m127 @0x46a to 0x4d6)', () => {
  it('Natus first: his Ice pair, then Mortibody\'s Thunder, Natus\'s Thunder pair, Mortibody\'s Water, ...', () => {
    const { ctx } = fresh();
    const seq: string[] = [];
    for (let i = 0; i < 4; i++) {
      seq.push(idOf(chooseAiCommand(ctx, at(ctx, NATUS))));
      seq.push(idOf(chooseAiCommand(ctx, at(ctx, BODY))));
    }
    expect(seq).toEqual([
      'natus-multi-blizzara', 'mortibody-thunder',
      'natus-multi-thundara', 'mortibody-water',
      'natus-multi-watera', 'mortibody-fire',
      'natus-multi-fira', 'mortibody-blizzard',
    ]);
  });

  it('Mortibody first: he casts Ice and Natus then casts the Ice pair; Mortibody twice in a row repeats his element', () => {
    const { ctx } = fresh();
    expect(idOf(chooseAiCommand(ctx, at(ctx, BODY)))).toBe('mortibody-blizzard');
    expect(idOf(chooseAiCommand(ctx, at(ctx, BODY)))).toBe('mortibody-blizzard');
    expect(ctx.state.flags[STEP] ?? 0).toBe(0);
    expect(idOf(chooseAiCommand(ctx, at(ctx, NATUS)))).toBe('natus-multi-blizzara');
    expect(idOf(chooseAiCommand(ctx, at(ctx, BODY)))).toBe('mortibody-thunder');
  });

  it('Mortibody\'s phase-0 turn spends a picker draw for a pick the script never reads, then casts at the whole front line', () => {
    const { ctx } = fresh();
    const rng = withRng(ctx, [0, 7]); // the Desperado draw, then the unused pick
    const command = chooseAiCommand(ctx, at(ctx, BODY));
    expect(rng.spent).toEqual({ script: 1, picker: 1, other: 0 });
    expect(idOf(command)).toBe('mortibody-blizzard');
    expect(command?.targets).toEqual([]); // empty: the ability's own target mode, all of the front line
  });
});

describe('Mortibody\'s other rows (m127 @0x431 to 0x455, table 4.5 rows 1, 3 and 4)', () => {
  it('Natus in phase 1: Shattering Claw on a random living member; in phase 2: Cura on Natus', () => {
    const one = fresh().ctx;
    one.state.flags[PHASE] = 2;
    const rng = withRng(one, [0, 2]);
    const claw = chooseAiCommand(one, at(one, BODY));
    expect(idOf(claw)).toBe('mortibody-shattering-claw');
    expect(rng.spent).toEqual({ script: 1, picker: 1, other: 0 });
    expect(claw?.targets).toEqual([one.state.activeIds[2 % 3]]);

    const two = fresh().ctx;
    two.state.flags[PHASE] = 3;
    const rng2 = withRng(two, [0]);
    const cura = chooseAiCommand(two, at(two, BODY));
    expect(idOf(cura)).toBe('mortibody-cura');
    expect(cura?.targets).toEqual([NATUS]);
    expect(rng2.spent).toEqual({ script: 1, picker: 0, other: 0 });
  });

  it('an aeon in the battle: Mortibody does nothing, and does not even spend the Desperado draw (row 1, D-22)', () => {
    const { ctx } = fresh();
    summonAeon(ctx, 'yuna', 'valefor');
    const rng = withRng(ctx, [0, 0, 0]);
    expect(chooseAiCommand(ctx, at(ctx, BODY))).toBeNull();
    expect(rng.calls).toHaveLength(0);
  });
});

describe('Mortibody\'s Desperado test (m127 @0x1ab to 0x429; D-21)', () => {
  /** Give each of the three active slots the listed statuses. */
  function wear(ctx: ReturnType<typeof fresh>['ctx'], rows: readonly (readonly string[])[]): void {
    rows.forEach((statuses, i) => {
      const member = at(ctx, ctx.state.activeIds[i] as string);
      for (const s of statuses) member.statuses[s as StatusId] = status(s as StatusId);
    });
  }
  /** What Mortibody does for each of the four residues of the threshold draw. */
  function desperadoByResidue(rows: readonly (readonly string[])[], phase: number): boolean[] {
    return [0, 1, 2, 3].map((r) => {
      const { ctx } = fresh();
      ctx.state.flags[PHASE] = phase;
      wear(ctx, rows);
      withRng(ctx, [r + 4 * 7, 5]); // a value with that residue, then the pick
      return idOf(chooseAiCommand(ctx, at(ctx, BODY))) === 'mortibody-desperado';
    });
  }

  it('each of the three active slots scores one point for Shell, Haste, Reflect and the four Nuls; Protect and Regen are not counted', () => {
    const { ctx } = fresh();
    wear(ctx, [['protect', 'regen'], ['protect', 'regen'], ['protect', 'regen']]);
    expect(desperadoScore(ctx)).toEqual({ total: 0, allHasted: false });
    for (const m of ctx.state.activeIds) for (const s of Object.keys(at(ctx, m).statuses) as StatusId[]) delete at(ctx, m).statuses[s];
    wear(ctx, [['shell', 'haste', 'reflect'], ['nultide', 'nulblaze'], ['nulshock', 'nulfrost']]);
    expect(desperadoScore(ctx)).toEqual({ total: 7, allHasted: false });
    // a reserve member does not count
    at(ctx, ctx.state.reserveIds[0] as string).statuses['shell'] = status('shell');
    expect(desperadoScore(ctx).total).toBe(7);
  });

  it('the threshold is "mod 4 + 4": Desperado with probability (total - 3) / 4 for totals 4 to 7, none at 3, always from 7', () => {
    const rows: Record<number, string[][]> = {
      3: [['shell', 'haste'], ['shell'], []],
      4: [['shell', 'reflect'], ['nulblaze', 'nulfrost'], []],
      5: [['shell', 'reflect', 'nultide'], ['nulblaze', 'nulfrost'], []],
      6: [['shell', 'reflect', 'nultide'], ['nulblaze', 'nulfrost', 'nulshock'], []],
      7: [['shell', 'reflect', 'nultide'], ['nulblaze', 'nulfrost', 'nulshock'], ['shell']],
    };
    const want: Record<number, boolean[]> = {
      3: [false, false, false, false],
      4: [true, false, false, false], // threshold 4 only
      5: [true, true, false, false],
      6: [true, true, true, false],
      7: [true, true, true, true],
    };
    for (const total of [3, 4, 5, 6, 7]) expect(desperadoByResidue(rows[total] as string[][], 1), `total ${total}`).toEqual(want[total]);
    // 65,536 is a multiple of four, so each residue is 16,384 of the values: 0 %, 25 %, 50 %, 75 %, 100 %
    expect(want[5]!.filter(Boolean).length / 4).toBe(0.5);
  });

  it('one level easier while Natus is in his last phase: the threshold is 3 to 6', () => {
    const three = [['shell', 'reflect', 'nultide'], [], []];
    expect(desperadoByResidue(three, 1)).toEqual([false, false, false, false]);
    expect(desperadoByResidue(three, 3)).toEqual([true, false, false, false]); // stored phase 3 = the game's phase 2
    const two = [['shell', 'reflect'], [], []];
    expect(desperadoByResidue(two, 3)).toEqual([false, false, false, false]);
  });

  it('Haste on all three slots drops the threshold to 0: Desperado with a total of 3, in any phase, and the draw is still spent', () => {
    for (const phase of [1, 2, 3]) {
      const { ctx } = fresh();
      ctx.state.flags[PHASE] = phase;
      wear(ctx, [['haste'], ['haste'], ['haste']]);
      const rng = withRng(ctx, [3]);
      expect(idOf(chooseAiCommand(ctx, at(ctx, BODY))), `phase ${phase}`).toBe('mortibody-desperado');
      expect(rng.spent.script).toBe(1);
    }
    const two = fresh().ctx;
    wear(two, [['haste'], ['haste'], []]);
    withRng(two, [3, 0]);
    expect(idOf(chooseAiCommand(two, at(two, BODY)))).toBe('mortibody-blizzard'); // two Hastes are a total of 2
  });

  it('Desperado is aimed at the whole front line: no named target', () => {
    const { ctx } = fresh();
    wear(ctx, [['haste'], ['haste'], ['haste']]);
    expect(chooseAiCommand(ctx, at(ctx, BODY))?.targets).toEqual([]);
  });
});
