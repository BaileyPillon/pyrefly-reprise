/**
 * FFX only — the four Nul spells' targeting, pinned with its evidence.
 *
 * Game case (AGENTS.md rule 14): **FFX only.** These are Yuna's FFX Wht Magic
 * rows 46-49 (`research/ffx-combat-core.md` §7.5). FFX-2 has its own Nul
 * records in `src/battle/ffx2/abilities.ts`; nothing here touches them, and the
 * absence case is asserted below.
 *
 * Why this file exists: `docs/handoff/chapter-macalania-engine.md` question 1
 * asks for these four to be made party-wide, which its engine builder measured
 * at +10 points of that chapter's win rate (80 % → 90 %, 40 seeds). The sources
 * were searched on 2026-09-21 and **none of them rules on the target**: §7.5
 * has no Target column at all (§7.1's does, and marks Hastega/Slowga "whole
 * party"), §4.2's status table describes only the effect, §5.8's Mighty Guard
 * row is the one sourced whole-party Nul application and it is a Ronso Rage,
 * not Yuna's spell, and `research/ffx-seymour-anima-macalania.md` §7 row 5 is
 * silent too. Under AGENTS.md rule 6 the shipped `single-ally` stands and the
 * change went to Bailey as a question.
 *
 * So this test is not "single-ally is correct". It is "single-ally is the
 * deliberate, unsourced default": flipping it is fine once Bailey says yes, and
 * whoever flips it has to come through here and update the handoff.
 */

import { describe, expect, it } from 'vitest';

import ABILITIES from '../../src/data/ffx/abilities/whitemagic-protect.ts';
import { defaultAbilities as FFX2_ABILITIES } from '../../src/battle/ffx2/abilities.ts';

const NUL_IDS = ['nulblaze', 'nulfrost', 'nulshock', 'nultide'] as const;

describe('FFX Nul spells — targeting decision of 2026-09-21', () => {
  it.each(NUL_IDS)('%s ships single-target, unsourced and on purpose', (id) => {
    const def = ABILITIES[id];
    expect(def, `${id} is missing from whitemagic-protect.ts`).toBeDefined();
    expect(
      def?.targeting,
      `${id}'s target is an [estimate]: no source in research/ffx-combat-core.md ` +
        '§7.5 gives one. If this is being changed to a party-wide value, it needs ' +
        "Bailey's yes on question 1 of docs/handoff/chapter-macalania-engine.md, " +
        'and that handoff plus this test have to be updated with the new win rates.',
    ).toBe('single-ally');
  });

  it('the four cost 2 MP each, which a party-wide flip must not change', () => {
    for (const id of NUL_IDS) {
      expect(ABILITIES[id]?.mpCost, `${id} MP (§7.5 rows 46-49)`).toBe(2);
    }
  });

  it('applies the matching one-charge status and removes nothing', () => {
    for (const id of NUL_IDS) {
      const def = ABILITIES[id];
      expect(def?.statusEffects).toEqual([{ status: id, chance: 254, duration: 1 }]);
      expect(def?.removesStatuses).toEqual([]);
    }
  });

  it('absence test — no FFX-2 ability was given an FFX Nul id', () => {
    for (const id of NUL_IDS) {
      expect(
        FFX2_ABILITIES.get(id),
        `${id} is an FFX-only record; FFX-2 must not carry it`,
      ).toBeUndefined();
    }
  });
});
