/**
 * R13-02 (release 13 focused review, FFX only, Chapter I): with `holdParty` the
 * relax no longer moved Seymour and Mortiorchis the way live e3b8c2a3's did,
 * so both stood 0.7-0.8 units further left and Mortiorchis's target bracket
 * crossed the NEXT BEST MOVE card's text at 1600x900. The two bosses are pinned
 * back on the spots live measured (Seymour x 985 / 1211 px, Mortiorchis x 709 /
 * 901 px at 1600x900 / 2000x1012), and Yuna's PR-0002 A slot is untouched.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */
import { describe, expect, it } from 'vitest';
import { GAGAZET_STAGING } from '../../../src/scenes/gagazet.ts';

describe("R13-02: Chapter I's bosses stand on live e3b8c2a3's spots (FFX only)", () => {
  it('keeps the party held (PR-0002 A, D-041)', () => {
    expect(GAGAZET_STAGING.holdParty).toBe(true);
  });

  it('pins Seymour at the measured spot and Mortiorchis at the depth the formation gave them', () => {
    expect(GAGAZET_STAGING.enemySpots['seymour-flux']).toEqual([3.54, 0, -7.6]);
    // r3942-giants-ffx: Mortiorchis was (1.03, 1.01) at live's 4.1-unit Flux; at his 6.017 units it keeps its place against him (its offset grows by 6.017 / 4.1) and stands 0.22 further back,
    // so that it is no nearer the party than live (Bailey, 2026-10-08, "original spacing, real sizes"): see ffx-giant-stature.test.ts
    expect(GAGAZET_STAGING.enemySpots.mortiorchis).toEqual([-0.143, 1.482, -7.82]);
  });

  // A pinned figure is never prone-slid (ProneLay), so Mortiorchis's spot carries the -1.52 slide live gave him.
  it('keeps Mortiorchis left of and above Seymour, at his depth or behind it', () => {
    const s = GAGAZET_STAGING.enemySpots['seymour-flux'];
    const m = GAGAZET_STAGING.enemySpots.mortiorchis;
    expect(m[0]).toBeLessThan(s[0]);
    expect(m[2]).toBeLessThanOrEqual(s[2]);
    expect(m[1]).toBeGreaterThan(s[1]);
  });
});
