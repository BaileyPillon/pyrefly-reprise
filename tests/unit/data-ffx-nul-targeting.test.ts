/**
 * FFX only — the four Nul spells' targeting, sourced 2026-09-21.
 *
 * Game case (AGENTS.md rule 14): **FFX only.** These are Yuna's FFX Wht Magic
 * rows 46-49 (`research/ffx-combat-core.md` §7.5, §7.5.1). FFX-2 has its own
 * Nul records in `src/battle/ffx2/abilities.ts`; nothing here touches them,
 * and the absence case is asserted below.
 *
 * Why this file exists: `docs/handoff/chapter-macalania-engine.md` question 1
 * asked whether these four should be party-wide, which its engine builder
 * measured at +10 points of that chapter's win rate (80 % → 90 %, 40 seeds).
 * §7.5 itself has no Target column, so on 2026-09-21 two independent,
 * structured sources were checked and **both agree**: Final Fantasy Wiki
 * (Fandom) and GameFAQs' *FFX/X-2 HD Remaster* walkthrough (bover_87) each say
 * NulBlaze/NulFrost/NulShock/NulTide are bestowed on "all members of a
 * party" / "all allies", and both correctly distinguish this from
 * Shell/Protect/Reflect (single-target) and Haste (single) vs Hastega
 * (party) on the very same page — see `research/ffx-combat-core.md` §7.5.1
 * for the full citations, URLs and access date.
 *
 * Per AGENTS.md rule 6, `targeting` is now `all-allies` in
 * `src/data/ffx/abilities/whitemagic-protect.ts`, matching Hastega/Slowga's
 * treatment in the sibling file: not reflectable (party-wide spells never
 * bounce, `bouncesOffReflect` in `src/battle/ffx/statuses.ts`), same MP cost,
 * same one-charge status application.
 */

import { describe, expect, it } from 'vitest';

import ABILITIES from '../../src/data/ffx/abilities/whitemagic-protect.ts';
import { defaultAbilities as FFX2_ABILITIES } from '../../src/battle/ffx2/abilities.ts';

const NUL_IDS = ['nulblaze', 'nulfrost', 'nulshock', 'nultide'] as const;

describe('FFX Nul spells — targeting sourced 2026-09-21 (research/ffx-combat-core.md §7.5.1)', () => {
  it.each(NUL_IDS)('%s is party-wide (all-allies), per two independent sources', (id) => {
    const def = ABILITIES[id];
    expect(def, `${id} is missing from whitemagic-protect.ts`).toBeDefined();
    expect(
      def?.targeting,
      `${id}'s target is sourced in research/ffx-combat-core.md §7.5.1 (Final ` +
        'Fantasy Wiki + GameFAQs bover_87, both "all allies"/"all members of a ' +
        'party", accessed 2026-09-21). If this is being reverted to single-ally, ' +
        'that needs a source that outweighs both, recorded in §7.5.1 and this test.',
    ).toBe('all-allies');
  });

  it('the four are not reflectable — party-wide spells never bounce', () => {
    for (const id of NUL_IDS) {
      expect(ABILITIES[id]?.canReflect, `${id} canReflect`).toBe(false);
      expect(ABILITIES[id]?.flags.includes('reflectable'), `${id} flags`).toBe(false);
    }
  });

  it('the four cost 2 MP each, which the party-wide sourcing did not change', () => {
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
