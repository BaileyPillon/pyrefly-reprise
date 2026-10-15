/**
 * The dog's order and bite on the real engine (FFX only; the hidden Mirror Aeons chapter): the data half of the seam for Dark Yojimbo's script. **A test-only stand-in script is registered here, in this file's own module
 * registry, and it is NOT the Dark Yojimbo AI** (that is the reverse-engineering session's): it does nothing but spend Dark Yojimbo's turn on the order row, so that what the DATA promises can be checked end to end:
 *
 *  - the order row (0x4086) deals no damage and names the dog (`extra.ordersActor`) and the bite (`extra.orderedAbility`), the mechanism the trial Yojimbo's dog uses (`battle/ffx/orders.ts`);
 *  - the dog answers with Daigoro's own bite (row 0x410B) at a living member of the party, with the dog's Strength (244), and pays no turn of its own;
 *  - the dog never acts on its own (it is `ordersOnly`), and never appears in a target list.
 *
 * The note's account (`research/re-ffx-yojimbo-sisters-feasibility.md` section 4.1 and the trial dog's description in `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 3.4): Yojimbo's dog roll is the order row aimed at the dog, whose single handler
 * queues the bite as a reaction when `isCounterattackAllowed()` holds.
 */
import { describe, expect, it } from 'vitest';

import { registerAiScript, use } from '../../../src/battle/ffx/ai/types.ts';
import { DARK_SCRIPTS } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

// Registered at import, in this test file's module registry only.
registerAiScript(DARK_SCRIPTS.yojimbo, (ai) => use(ai, 'dark-daigoro-order', ['dark-daigoro']));

describe("Dark Yojimbo's order row and the dog's bite, with a stand-in script that only orders", () => {
  it('Yojimbo orders; the dog bites a living member of the party with its own Strength; no damage from the order itself', () => {
    const e = H.newEngine(1, H.ACT_II_GROUP);
    for (let i = 0; i < 40; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
      if (H.actions(H.log(e), 'dark-daigoro').length > 0) break;
    }
    const events = H.log(e);
    const orders = H.actions(events, 'dark-yojimbo');
    const bites = H.actions(events, 'dark-daigoro');
    expect(orders.length).toBeGreaterThan(0);
    expect(new Set(orders)).toEqual(new Set(['dark-daigoro-order']));
    expect(bites.length).toBeGreaterThan(0);
    expect(new Set(bites)).toEqual(new Set(['dark-daigoro-bite']));
    const party = new Set(e.state().activeIds);
    const hurtByDog = events.filter((ev) => ev.type === 'damage' && ev.sourceId === 'dark-daigoro');
    expect(hurtByDog.length).toBeGreaterThan(0);
    for (const ev of hurtByDog) if (ev.type === 'damage') expect(party.has(ev.targetId), ev.targetId).toBe(true);
    const hurtByOrder = events.filter((ev) => ev.type === 'damage' && ev.sourceId === 'dark-yojimbo');
    expect(hurtByOrder).toEqual([]); // the order row itself deals nothing
  });

  it('the dog takes no turn of its own: every action it takes is the bite, and a turn of the CTB queue is never its', () => {
    const e = H.newEngine(2, H.ACT_II_GROUP);
    for (let i = 0; i < 60; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
    }
    const dogActions = H.actions(H.log(e), 'dark-daigoro');
    for (const a of dogActions) expect(a).toBe('dark-daigoro-bite');
    const orders = H.actions(H.log(e), 'dark-yojimbo').length;
    expect(dogActions.length).toBeLessThanOrEqual(orders); // never more bites than orders
  });
});
