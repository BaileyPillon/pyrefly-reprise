import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import {
  apPerMember,
  buildMemberRows,
  clearTimeMs,
  dropsLabel,
  FFX_MS_PER_TICK,
  formatClearTime,
  formatNumber,
  isGrimChapter,
  isNewBest,
  isSilentResultsChapter,
  pickVictoryQuip,
  RESULTS_HERO_FRAME,
  resultsDensity,
  resultsHeroBox,
} from '../../src/ui/common/resultsMath.ts';
import { portraitCrop } from '../../src/ui/common/portrait.ts';

describe('formatClearTime', () => {
  it('formats sub-minute times with a zero-padded seconds field', () => {
    expect(formatClearTime(5_000)).toBe('0:05');
  });

  it('formats minutes and seconds', () => {
    expect(formatClearTime(65_000)).toBe('1:05');
  });

  it('floors partial seconds rather than rounding', () => {
    expect(formatClearTime(65_999)).toBe('1:05');
  });

  it('clamps a negative duration to zero', () => {
    expect(formatClearTime(-500)).toBe('0:00');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1200)).toBe('1,200');
  });

  it('rounds a fractional value', () => {
    expect(formatNumber(999.6)).toBe('1,000');
  });
});

describe('isGrimChapter / isSilentResultsChapter', () => {
  it('flags E1, E2 and E4 as grim', () => {
    expect(isGrimChapter('seymour-flux')).toBe(true);
    expect(isGrimChapter('yunalesca')).toBe(true);
    expect(isGrimChapter('ffx2-bahamut')).toBe(true);
  });

  it('does not flag E3 or E5 as grim', () => {
    expect(isGrimChapter('braskas-final-aeon')).toBe(false);
    expect(isGrimChapter('ffx2-vegnagun-shuyin')).toBe(false);
  });

  it('only chapter 4 (Bahamut) suppresses the entire results flourish', () => {
    expect(isSilentResultsChapter('ffx2-bahamut')).toBe(true);
    expect(isSilentResultsChapter('seymour-flux')).toBe(false);
    expect(isSilentResultsChapter('yunalesca')).toBe(false);
  });
});

describe('pickVictoryQuip', () => {
  it('returns undefined for an empty or missing list', () => {
    expect(pickVictoryQuip(undefined)).toBeUndefined();
    expect(pickVictoryQuip([])).toBeUndefined();
  });

  it('is deterministic by default (index 0), for screenshot/e2e stability', () => {
    const lines = ['Hmph.', 'Adequate.', 'It isn’t over.'];
    expect(pickVictoryQuip(lines)).toBe('Hmph.');
    expect(pickVictoryQuip(lines)).toBe(pickVictoryQuip(lines));
  });

  it('wraps a positive index within the list length', () => {
    const lines = ['a', 'b', 'c'];
    expect(pickVictoryQuip(lines, 4)).toBe('b');
  });

  it('wraps a negative index into range instead of returning undefined', () => {
    const lines = ['a', 'b', 'c'];
    expect(pickVictoryQuip(lines, -1)).toBe('c');
  });
});

describe('isNewBest', () => {
  it('treats no previous record as always a new best', () => {
    expect(isNewBest(null, 999_999)).toBe(true);
  });

  it('is true only for a strictly faster time', () => {
    expect(isNewBest(60_000, 59_999)).toBe(true);
    expect(isNewBest(60_000, 60_000)).toBe(false);
    expect(isNewBest(60_000, 60_001)).toBe(false);
  });
});

describe('apPerMember', () => {
  it('credits the full AP total to every active member, not a split', () => {
    expect(apPerMember(36, ['tidus', 'yuna', 'auron'])).toEqual({
      tidus: 36,
      yuna: 36,
      auron: 36,
    });
  });

  it('returns an empty record for no members', () => {
    expect(apPerMember(36, [])).toEqual({});
  });
});

describe('clearTimeMs', () => {
  const ffxResult = { elapsedMs: 0, elapsedTicks: 140 };

  it('prefers the presenter wall clock over everything else', () => {
    expect(clearTimeMs({ elapsedMs: 5_000, elapsedTicks: 9_000 }, 14_200, 'ffx')).toBe(14_200);
  });

  it('falls back to the engine clock when no wall clock is supplied', () => {
    expect(clearTimeMs({ elapsedMs: 5_400, elapsedTicks: 9_000 }, undefined, 'ffx2')).toBe(5_400);
  });

  it('never reports 0:00 for an FFX clear, whose engine leaves elapsedMs at 0', () => {
    // The defect this screen was rebuilt for: a 14 s fight printed "RESULTS · 0:00".
    expect(clearTimeMs(ffxResult, 0, 'ffx')).toBe(140 * FFX_MS_PER_TICK);
    expect(formatClearTime(clearTimeMs(ffxResult, undefined, 'ffx'))).not.toBe('0:00');
  });

  it('converts FFX-2 ticks at the exact 3000/s rate', () => {
    expect(clearTimeMs({ elapsedMs: 0, elapsedTicks: 9_000 }, undefined, 'ffx2')).toBe(3_000);
  });

  it('ignores the sub-second wall clock of a `speed: skip` automated run', () => {
    // The critic and the gallery collapse every animation wait, so the wall
    // clock is a few hundred ms and would print "0:00" again.
    expect(clearTimeMs({ elapsedMs: 0, elapsedTicks: 140 }, 180, 'ffx')).toBe(140 * FFX_MS_PER_TICK);
  });
});

describe('buildMemberRows', () => {
  const base = {
    outcome: 'victory' as const,
    turns: 12,
    elapsedTicks: 0,
    elapsedMs: 0,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };

  it('returns nothing when the chapter is unknown', () => {
    expect(buildMemberRows(undefined, { ...base, ap: 36 })).toEqual([]);
  });

  /**
   * The row set now comes from `sphereLevelsGained`'s keys — every member who
   * earned this battle's AP (`ffx-combat-core.md §1.7`) — not the pre-battle
   * `build.activeSlots`, per round 03's gate major on a switched member's
   * row: see `tests/unit/ffx-results-ap.test.ts` for that scenario driven
   * through a real engine. The ordinary no-switch case still lists all three
   * active members, because in that case all three are `sphereLevelsGained`
   * keys too — Yuna and Kimahri simply gained no S.Lv (`levelDelta` 0) from
   * this battle's AP.
   */
  it('lists the three active FFX members and pays each the full AP', () => {
    const rows = buildMemberRows(getChapter('seymour-flux'), {
      ...base,
      ap: 36,
      sphereLevelsGained: { tidus: 1, yuna: 0, kimahri: 0 },
    });
    expect(rows.map((r) => r.id)).toEqual(['tidus', 'yuna', 'kimahri']);
    expect(rows.every((r) => r.award === 36 && r.awardUnit === 'AP')).toBe(true);
    expect(rows[0]?.levelDelta).toBe(1);
    expect(rows[0]?.levelUnit).toBe('S.Lv');
    expect(rows[0]?.detail).toMatch(/^S\.LV \d+ · [\d,]+\/[\d,]+ AP$/);
  });

  it('pays FFX-2 in EXP and names the dressphere the AP went to', () => {
    const rows = buildMemberRows(getChapter('ffx2-vegnagun-shuyin'), {
      ...base,
      ap: 180,
      exp: 1480,
      levelsGained: { yuna: 1 },
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]?.award).toBe(1480);
    expect(rows[0]?.awardUnit).toBe('EXP');
    expect(rows[0]?.levelUnit).toBe('Lv');
    expect(rows[0]?.detail.startsWith('WHITE MAGE')).toBe(true);
  });
});

/**
 * PR-0078: every results victory screen enlarged the leader's square face
 * portrait to the full stage height with `object-fit: cover`, so a win was
 * celebrated with one eye and hair strands — the browser's own
 * intrinsic-ratio sizing (no crop math ran at all) landed the image wherever
 * its native aspect fell, and `.rres__ink`'s `overflow: hidden` silently
 * clipped whatever missed the wedge.
 *
 * This pins the fix at the geometry level, before any browser is involved:
 * for every party portrait the game can put in the results wedge,
 * `resultsHeroBox` must place the measured eye line
 * ({@link https://../../src/ui/common/face-crops.json face-crops.json}) inside
 * `RESULTS_HERO_FRAME` with room around it — the same "eyes on the house line,
 * within the middle band, never bare frame at an edge" contract
 * `tests/unit/ui-portrait-face-crop.test.ts` already proves for a square tile,
 * carried over to the wedge's non-square box.
 */
describe('resultsHeroBox (PR-0078: the victory portrait must keep the whole head)', () => {
  // The playable human roster's portrait ids (face-crops.json's `portraits`
  // table minus the bosses/aeons/aeon-fights, which never stand in the
  // results wedge — only a party member can be `leaderId`'s answer).
  const PARTY_PORTRAIT_IDS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku', 'paine', 'yuna-x2', 'rikku-x2'];

  const { width: frameW, height: frameH } = RESULTS_HERO_FRAME;

  it.each(PARTY_PORTRAIT_IDS)('%s: the rendered box fully covers the frame', (id) => {
    const box = resultsHeroBox(id);
    // No bare paper at any edge of the frame — the wedge showing background
    // instead of a face is the same class of defect as showing the wrong
    // slice of one.
    expect(box.left, `${id} left edge`).toBeLessThanOrEqual(0.01);
    expect(box.top, `${id} top edge`).toBeLessThanOrEqual(0.01);
    expect(box.left + box.width, `${id} right edge`).toBeGreaterThanOrEqual(frameW - 0.01);
    expect(box.top + box.height, `${id} bottom edge`).toBeGreaterThanOrEqual(frameH - 0.01);
  });

  it.each(PARTY_PORTRAIT_IDS)('%s: the measured eye line lands inside the frame with a head-height margin', (id) => {
    const crop = portraitCrop(id);
    const box = resultsHeroBox(id);
    const eyeX = box.left + crop.fx * box.width;
    const eyeY = box.top + crop.fy * box.height;
    // The face-crop rect: the eyes plus a margin scaled from the measured
    // eye-to-eye distance (ipd), the same scale handle `cropStyle` zooms by —
    // a generous stand-in for "the whole head", since no test can read a
    // painting. This is the "rendered box contains the face-crop rect" check.
    const ipdPx = crop.ipd * box.width;
    const rect = {
      left: eyeX - ipdPx * 1.1,
      right: eyeX + ipdPx * 1.1,
      top: eyeY - ipdPx * 1.3,
      bottom: eyeY + ipdPx * 2.1,
    };
    expect(rect.left, `${id} face rect left`).toBeGreaterThanOrEqual(-0.5);
    expect(rect.right, `${id} face rect right`).toBeLessThanOrEqual(frameW + 0.5);
    expect(rect.top, `${id} face rect top`).toBeGreaterThanOrEqual(-0.5);
    expect(rect.bottom, `${id} face rect bottom`).toBeLessThanOrEqual(frameH + 0.5);
  });
});

/**
 * PR-0078, second pass (release-09 verifier): the first fix kept the head but ended
 * the frame at x 584 of 640, a hard vertical line through the hair and a black band
 * down the right, where the approved tile (docs/screenshots/mockups/A-results.jpg)
 * runs the painting full-bleed. The wedge is `.rres__ink`'s polygon
 * (62% 0, 100% 0, 100% 100%, 48% 100%) on the 640x360 stage.
 */
describe('resultsHeroBox is full-bleed inside the wedge (PR-0078, approved tile A-results)', () => {
  const STAGE_W = 640;
  const STAGE_H = 360;
  /** x of the wedge's leading (diagonal) edge at stage height y. */
  const wedgeLeftAt = (y: number): number => STAGE_W * (0.62 - 0.14 * (y / STAGE_H));
  const IDS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku', 'paine', 'yuna-x2', 'rikku-x2'];

  it('the frame spans from the wedge foot to the right edge and the full height', () => {
    const f = RESULTS_HERO_FRAME;
    expect(f.left).toBeLessThanOrEqual(STAGE_W * 0.48 + 0.01);
    expect(f.left + f.width).toBeGreaterThanOrEqual(STAGE_W - 0.01);
    expect(f.top).toBeLessThanOrEqual(0);
    expect(f.top + f.height).toBeGreaterThanOrEqual(STAGE_H);
    expect(f.top + f.height).toBeLessThanOrEqual(STAGE_H + 60); // bleeds off the bottom, not a second stage
  });

  it.each(IDS)('%s: the painting covers every visible wedge pixel and the face stays right of the diagonal', (id) => {
    const f = RESULTS_HERO_FRAME;
    const box = resultsHeroBox(id);
    // Covers the frame, so no bare ink shows anywhere in the wedge.
    expect(box.left).toBeLessThanOrEqual(0.01);
    expect(box.left + box.width).toBeGreaterThanOrEqual(f.width - 0.01);
    const crop = portraitCrop(id);
    const ipd = crop.ipd * box.width;
    const eyeX = f.left + box.left + crop.fx * box.width;
    const eyeY = f.top + box.top + crop.fy * box.height;
    // The critic's acceptance: eyes, mouth and chin all inside the wedge. The far
    // eye's outer corner (half the eye gap plus half an eye) at the eye line, and the
    // jaw (0.6 ipd either side) at the chin; hair may run into the stripe, as it
    // does in the approved tile.
    expect(eyeX - ipd * 0.75, `${id} far eye clears the diagonal`).toBeGreaterThan(wedgeLeftAt(eyeY));
    const chinY = eyeY + ipd * 1.6;
    expect(eyeX - ipd * 0.6, `${id} jaw clears the diagonal`).toBeGreaterThan(wedgeLeftAt(chinY));
    expect(eyeX + ipd * 1.1).toBeLessThanOrEqual(STAGE_W);
    expect(eyeY - ipd * 1.3, `${id} crown`).toBeGreaterThanOrEqual(0);
    expect(chinY, `${id} chin`).toBeLessThanOrEqual(STAGE_H);
  });
});

describe('dropsLabel', () => {
  it('prints names, with a count only where there is more than one', () => {
    expect(
      dropsLabel([
        { itemId: 'phoenix-down', count: 2 },
        { itemId: 'elixir', count: 1 },
      ]),
    ).toBe('Phoenix Down \u00d72, Elixir');
  });

  // Critic pass on 62b4927 (Macalania, four drops): 'Ability Sphere, Blk Magic
  // Sphere, Ability Sphere, Ability Sphere' wrapped onto a second line and ran
  // into Tidus's row. The engine lists one drop per enemy, so a repeated item
  // is one line item with a count, the way the ledger already prints ×2.
  it('prints a repeated item once, with its counts added up, in first-seen order', () => {
    expect(
      dropsLabel([
        { itemId: 'ability-sphere', count: 1 },
        { itemId: 'blk-magic-sphere', count: 1 },
        { itemId: 'ability-sphere', count: 1 },
        { itemId: 'ability-sphere', count: 1 },
      ]),
    ).toBe('Ability Sphere ×3, Blk Magic Sphere');
  });

  it('is empty for no drops, so the ITEMS row can be dropped entirely', () => {
    expect(dropsLabel([])).toBe('');
  });
});

// Critic pass on 62b4927 (Macalania): with a fourth member switched in, the
// bottom-anchored party list climbed into the ledger and Tidus's row ran through
// the ITEMS line (seen again after the drops were merged: ledger bottom 621 px,
// party top 585 px at 1600x900). The ledger and the list are two absolute
// blocks in 640x360 design units, so the density is chosen from both counts:
// the ledger ends at 152 + its rows, the list starts at 335.11 minus its rows.
describe('resultsDensity', () => {
  const LEDGER_TOP = 152;
  const PARTY_BOTTOM = 360 - 24.89;
  const ledgerRow = { normal: 36, compact: 25.34 } as const;
  const member = { normal: [21.33, 5.33], compact: [16, 2.67], tight: [13.33, 1.78] } as const;
  const clear = (ledgerRows: number, members: number): number => {
    const d = resultsDensity(ledgerRows, members);
    const [face, gap] = member[d.party];
    const partyTop = PARTY_BOTTOM - (face * members + gap * (members - 1));
    return partyTop - (LEDGER_TOP + ledgerRow[d.ledger] * ledgerRows);
  };

  it('keeps the approved layout for three rows and three members', () => {
    expect(resultsDensity(3, 3)).toEqual({ ledger: 'normal', party: 'normal' });
  });

  it('tightens the ledger when a fourth member joins the list', () => {
    expect(resultsDensity(3, 4).ledger).toBe('compact');
  });

  // FFX pays AP to everyone who fought (up to seven, three ledger rows); only
  // FFX-2 has a fourth row (EXP and AP), and its party is at most three.
  it('never lets the party list reach the ledger, one to seven members', () => {
    for (const [rows, most] of [[2, 7], [3, 7], [4, 5]] as const) {
      for (let members = 1; members <= most; members++) {
        expect(clear(rows, members), `${rows} rows, ${members} members`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
