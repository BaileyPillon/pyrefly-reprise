/**
 * **The copy deck, read once, against Bailey's approved frames and the rules.**
 *
 * The one thing hard rule 14 asks of a per-game feature is a test that asserts
 * the feature is *absent* for the other game. That is what most of this file
 * is: FFX may never speak with Rikku's voice, FFX-2 may never be held, and
 * neither deck may leak into the other. The rest is CHK-007's grep over player
 * copy — no section marks, no research ids, no camelCase, and no bare "CTB" or
 * "ATB", which appear on none of Bailey's nine mocked frames
 * (`docs/plans/onboarding-review.md` REQUIRED 14).
 */

import { describe, expect, it } from 'vitest';
import {
  ALL_COACH_IDS,
  ALL_MARKS,
  BRIEFING_LINES,
  BRIEFING_MS,
  BRIEFING_WAIT_LINE,
  COACH_RUNNING_BADGE_ACTIVE,
  COACH_RUNNING_BADGE_WAIT,
  coachRunningBadge,
  FFX2_GAUGE_BODY_ACTIVE,
  FFX2_GAUGE_BODY_WAIT,
  ffx2GaugeBody,
  FFX2_MARKS,
  FFX_MARKS,
  markById,
  marksFor,
  speakerFor,
} from '../../src/ui/coach/coachCopy.ts';

/** Every word a player can read in the whole feature. */
function everyPlayerString(): string[] {
  const out: string[] = [];
  for (const l of [...BRIEFING_LINES, BRIEFING_WAIT_LINE]) out.push(l.lead, l.strong, l.tail);
  for (const m of ALL_MARKS) out.push(m.speaker, m.body);
  out.push(FFX2_GAUGE_BODY_WAIT);
  // Strip the badges' HTML entities before the vocabulary grep (they are markup,
  // not player-facing spelling) but still catch a stray research id or acronym.
  out.push(COACH_RUNNING_BADGE_ACTIVE.replace(/&\w+;/g, ' '), COACH_RUNNING_BADGE_WAIT.replace(/&\w+;/g, ' '));
  return out.filter((s) => s.length > 0);
}

describe('onboarding copy deck', () => {
  it('FFX speaks as Auron and FFX-2 as Rikku, and neither deck reaches the other game', () => {
    expect(speakerFor('ffx')).toBe('Auron');
    expect(speakerFor('ffx2')).toBe('Rikku');

    for (const mark of marksFor('ffx')) {
      expect(mark.game, `${mark.id} is offered to FFX`).toBe('ffx');
      expect(mark.speaker, `${mark.id} speaks in an FFX chapter`).toBe('Auron');
    }
    for (const mark of marksFor('ffx2')) {
      expect(mark.game, `${mark.id} is offered to FFX-2`).toBe('ffx2');
      expect(mark.speaker, `${mark.id} speaks in an FFX-2 chapter`).toBe('Rikku');
    }

    // The absence assertion, both directions.
    const ffxIds = marksFor('ffx').map((m) => m.id);
    const ffx2Ids = marksFor('ffx2').map((m) => m.id);
    for (const id of ffx2Ids) expect(ffxIds, `${id} must never be offered to FFX`).not.toContain(id);
    for (const id of ffxIds) expect(ffx2Ids, `${id} must never be offered to FFX-2`).not.toContain(id);
  });

  it('only FFX lines hold, and every FFX-2 line fades on its own', () => {
    // research/ffx-vs-ffx2-presentation.md section 9 row 3 and section 4.2 /
    // FC-4: FFX's engine waits for input by definition, FFX-2's gauge does not
    // stop for anything. This is the rule the whole feature turns on.
    for (const mark of FFX_MARKS) {
      expect(mark.holds, `${mark.id} holds the decision`).toBe(true);
    }
    for (const mark of FFX2_MARKS) {
      expect(mark.holds, `${mark.id} must never hold an FFX-2 fight`).toBe(false);
      expect(mark.fadeMs, `${mark.id} needs a fade of its own`).toBeGreaterThan(0);
    }
  });

  it('the briefing is Bailey’s four lines and twenty seconds', () => {
    expect(BRIEFING_LINES).toHaveLength(4);
    expect(BRIEFING_MS).toBe(20_000);
    const whole = BRIEFING_LINES.map((l) => l.lead + l.strong + l.tail).join(' ');
    // Both clocks, named once, which is the entire reason the briefing is the
    // one surface shared by two games.
    expect(whole).toContain('nothing moves until you move');
    expect(whole).toContain('the clock does not wait');
  });

  /**
   * PR-0047. FFX-2 only: dresspheres exist in no other game here.
   *
   * `research/ffx2-combat-core.md` §4.2, `[verified: 2 sources]`: the
   * spherechange "**consumes the whole turn**. The ATB gauge is spent and
   * refills from empty", and the destination must be "one link away". The line
   * shipped in the candidate said "Swap any time — it costs her nothing",
   * which is true only of MP and teaches a first-timer to throw turns away in
   * the two hardest chapters. This pins the teaching to the research.
   */
  it('Rikku’s dressphere line teaches the sourced cost: a whole turn, one step', () => {
    const line = markById('ffx2-dressphere');
    expect(line?.game, 'the lesson exists only where dresspheres do').toBe('ffx2');
    const body = (line?.body ?? '').toLowerCase();

    // What the research says it costs.
    expect(body, 'the turn is the price and the line has to say so').toMatch(/turn/);
    expect(body, 'the bar is spent and refills from empty').toMatch(/empty|zero/);
    // And the restriction the research puts on where she may go.
    expect(body, 'one link away, not anywhere').toMatch(/one step|one link/);

    // What it may never say again.
    expect(body, 'the change is not free').not.toMatch(/costs (her|you|them) nothing|for free/);
    expect(body, 'and it is not unrestricted').not.toMatch(/any\s?time|whenever/);

    // Still Rikku, and still a line and not a rules table.
    expect(line?.speaker).toBe('Rikku');
    expect(line?.holds, 'no FFX-2 line holds the fight').toBe(false);
    expect(line?.body.length ?? 0, 'one line, not a paragraph').toBeLessThan(160);
  });

  it('the FFX-2 running badge only claims the clock runs under Active, and states the Wait truth instead (round 09 PR-0046, reopened)', () => {
    // Active: Bailey's approved C3 words, unchanged (D-009, 2026-09-21;
    // measured true on the running engine in CoachMark.ts's own comment).
    expect(coachRunningBadge('active')).toBe(COACH_RUNNING_BADGE_ACTIVE);
    expect(COACH_RUNNING_BADGE_ACTIVE).toMatch(/nothing paused/i);
    expect(COACH_RUNNING_BADGE_ACTIVE).toMatch(/running/i);

    // Wait (the default since D-029) with its split (the default since D-029
    // follow-up 2): the gauges run on the top-level list and hold once a list
    // is open (tests/unit/ffx2-wait-split.test.ts). Bailey's pick, verbatim
    // (2026-09-24, draft 3a, D-121): a rule true in both places, not a status.
    expect(coachRunningBadge('wait')).toBe(COACH_RUNNING_BADGE_WAIT);
    expect(COACH_RUNNING_BADGE_WAIT).toBe('Gauges running &middot; a list holds them');
    expect(COACH_RUNNING_BADGE_WAIT).not.toMatch(/nothing paused/i);
    expect(COACH_RUNNING_BADGE_WAIT.toLowerCase()).toMatch(/a list holds/);

    // Still the same badge shape: two short phrases joined by a middle dot.
    for (const badge of [COACH_RUNNING_BADGE_ACTIVE, COACH_RUNNING_BADGE_WAIT]) {
      expect(badge).toMatch(/&middot;/);
      expect(badge.replace(/&\w+;/g, ' ').length).toBeLessThan(48);
    }
  });

  it('the FFX-2 gauge line is Bailey’s words in each mode: D-030 under Active, draft 1a under Wait (D-121)', () => {
    expect(ffx2GaugeBody('active')).toBe(FFX2_GAUGE_BODY_ACTIVE);
    expect(FFX2_GAUGE_BODY_ACTIVE).toBe("“Bar's full, she's up — don't wait for me, we all go at once!”");
    expect(ffx2GaugeBody('wait')).toBe(FFX2_GAUGE_BODY_WAIT);
    expect(FFX2_GAUGE_BODY_WAIT).toBe("“Bar's full, she's up! Open a list and take your time, nobody moves.”");
    // The old Wait body claimed a hold on the top-level list, untrue under the split.
    expect(FFX2_GAUGE_BODY_WAIT).not.toMatch(/while you're picking/);
  });

  it('no player-facing string carries developer or wiki vocabulary (CHK-007, REQUIRED 14)', () => {
    for (const text of everyPlayerString()) {
      expect(text, `section mark in: ${text}`).not.toMatch(/§/);
      expect(text, `research id in: ${text}`).not.toMatch(/\bffx2?-[a-z-]+\b/);
      expect(text, `camelCase in: ${text}`).not.toMatch(/[a-z][A-Z]/);
      expect(text, `bare acronym in: ${text}`).not.toMatch(/\b(CTB|ATB)\b/);
    }
  });

  it('every id is unique and the seen-set knows all of them', () => {
    const ids = ALL_MARKS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ALL_COACH_IDS).toContain('briefing');
    for (const id of ids) expect(ALL_COACH_IDS).toContain(id);
    expect(markById('ffx-turn-order')?.game).toBe('ffx');
    expect(markById('nothing-like-this')).toBeNull();
  });
});
