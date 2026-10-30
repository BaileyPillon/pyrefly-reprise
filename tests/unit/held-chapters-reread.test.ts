/**
 * `tools/continuity-reread.mjs --gated` and `--cuts` (held-chapters lane, 2026-10-29; both games, critic tooling only): the two readings a `SCOPE_EXCEPTIONS` "Lifts when" is written in, as pure functions of a re-read
 * run. The tool itself is run against a kept recording by hand (`node tools/continuity-reread.mjs <raw.json.gz> --gated --cuts`).
 */
import { describe, expect, it } from 'vitest';
import { gatedSwapJerks, plannedCutJerks, type RereadJerk, type RereadResult, type RereadSwap } from '../../tools/continuity-reread.mjs';

const jerk = (over: Partial<RereadJerk>): RereadJerk => ({ n: 100, px: 60, part: 'head', figure: 'auron', fi: 0, atSwap: true, ...over });
const swap = (over: Partial<RereadSwap>): RereadSwap => ({ fi: 0, fromPose: 'follow', toPose: 'idle', n: 100, startFrame: 98, smear: { style: 'paint' }, hardCut: true, figurePx: 300, ...over });

describe('gatedSwapJerks: what CHK-027 counts', () => {
  const res = {
    jerks: [
      jerk({ n: 10, px: 224 }), // a swap jerk nobody excused: gated
      jerk({ n: 20, px: 150, smeared: { style: 'paint' } }), // inside a planned smear's cap: excused
      jerk({ n: 30, px: 50, commonMode: true }), // the figure travelling
      jerk({ n: 40, px: 50, covered: true }), // under the wash
      jerk({ n: 50, px: 50, dissolveTravel: { shareStep: 0.2 } }), // a dissolve's own travel
      jerk({ n: 60, px: 50, stagedExcused: true }), // a twirl step
      jerk({ n: 70, px: 50, atSwap: false }), // mid-move: a dash, not a swap
    ],
    swaps: [],
  } as RereadResult;

  it('keeps the unexcused swap jerks and nothing else', () => {
    expect(gatedSwapJerks(res).map((j) => j.n)).toEqual([10]);
  });
});

describe('plannedCutJerks: the jerks at a planned smear, excused or not', () => {
  const res = {
    jerks: [
      jerk({ n: 100, px: 134, fi: 3, figure: 'yunalesca' }), // over its cap: not excused
      jerk({ n: 200, px: 125, fi: 1, figure: 'tidus', smeared: { style: 'paint' } }), // excused
      jerk({ n: 300, px: 90, fi: 1, figure: 'tidus', smeared: { style: 'paint' } }), // under the line
      jerk({ n: 400, px: 130, fi: 2, figure: 'kimahri' }), // a swap with no planned smear: not a planned cut
    ],
    swaps: [
      swap({ fi: 3, n: 100, startFrame: 99, fromPose: 'attack', toPose: 'cast' }),
      swap({ fi: 1, n: 200, startFrame: 199, fromPose: 'ready', toPose: 'attack' }),
      swap({ fi: 1, n: 300, startFrame: 299, fromPose: 'attack', toPose: 'follow' }),
      swap({ fi: 2, n: 400, startFrame: 399, smear: undefined, hardCut: false }),
    ],
    summary: { battleSeconds: 120 },
  } as RereadResult;

  it('counts 120 px or more by default, with its rate and which were excused', () => {
    const c = plannedCutJerks(res);
    expect(c.rows.map((r) => [r.jerk.figure, r.excused])).toEqual([['yunalesca', false], ['tidus', true]]);
    expect(c.perMinute).toBe(1);
    expect(plannedCutJerks(res, 80).rows).toHaveLength(3);
  });

  it('a run with no battle seconds has no rate', () => {
    expect(plannedCutJerks({ ...res, summary: {} }).perMinute).toBeNull();
  });
});
