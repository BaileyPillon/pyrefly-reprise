/**
 * **Probe version 3** (PR-0459; pc-residues lane, 2026-10-28; both games, shared critic plumbing): per figure, `pl` beside the slots, each plane's size in WORLD units and the head lock's factor, from which the
 * harness reads the head as the CARD carries it (`continuity-card.mjs`). Split out of `critic-continuity-probe.test.ts` (house rule 7); the fake page is `critic-continuity-probe-rig.ts`.
 */
import { describe, expect, it } from 'vitest';
import { fades, rig } from './critic-continuity-probe-rig.ts';

describe('what the probe records from version 3', () => {
  it('records, from probe version 3, each plane size in WORLD units and the head lock factor, beside the slots and not inside them (PR-0459)', async () => {
    const r = rig();
    (r.actor.slots[0] as { lock?: number }).lock = 1.1;
    r.probe.start();
    await r.step(); await r.step();
    const f = r.probe.records.at(-1)!.f[0]! as unknown as { s: unknown[]; pl?: unknown[] };
    expect((f.s[0] as number[]).length).toBe(11); // the slot record keeps its layout: version 2 readers are unaffected
    expect(f.pl).toEqual([[200, 400, 1.1], 0]); // the plane mesh is 200 x 400 world units; the other plane is not recorded
    (r.actor.slots[1] as { lock?: number }).lock = 0.9;
    fades(r, 0.5, 0.5);
    await r.step();
    expect((r.probe.records.at(-1)!.f[0]! as unknown as { pl?: unknown[] }).pl).toEqual([[200, 400, 1.1], [200, 400, 0.9]]);
  });

  it('reads a plane with no lock field as lock 1 (an actor that has none)', async () => {
    const r = rig();
    r.probe.start();
    await r.step();
    expect((r.probe.records.at(-1)!.f[0]! as unknown as { pl?: unknown[] }).pl![0]).toEqual([200, 400, 1]);
  });
});
