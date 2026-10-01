import { describe, expect, it } from 'vitest';
import { armContact, CONTACT_HOLD_MAX_MS, meetContact, releaseContact } from '../../../src/engine/ContactBeat.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';

/**
 * VP-1001-06 (both games): the hit used to land ~390 ms after the lunge began, with the attacker
 * nearly home. The lunge now holds at its apex until the first hit or miss releases it, and a hit
 * that arrives early waits for the apex.
 */
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
function fakeCtx(): EventCtx {
  return { sleep: wait } as unknown as EventCtx;
}

describe('ContactBeat', () => {
  it('an early hit waits for the strike apex, then releases the hold', async () => {
    const ctx = fakeCtx();
    const c = armContact(ctx, 'tidus');
    const t0 = Date.now();
    setTimeout(() => c.reached(), 60);
    let released = 0;
    void c.hold.then(() => (released = Date.now() - t0));
    await meetContact(ctx, 'seymour-flux');
    const hitAt = Date.now() - t0;
    expect(hitAt).toBeGreaterThanOrEqual(50);
    await wait(5);
    expect(released).toBeGreaterThanOrEqual(50);
    expect(Math.abs(released - hitAt)).toBeLessThan(30); // apex to recoil within the frame budget
  });

  it('a late hit lands at once and the strike was held at the apex until then', async () => {
    const ctx = fakeCtx();
    const c = armContact(ctx, 'tidus');
    c.reached();
    let released = false;
    void c.hold.then(() => (released = true));
    await wait(80);
    expect(released).toBe(false); // still at the apex
    const t0 = Date.now();
    await meetContact(ctx, 'seymour-flux');
    expect(Date.now() - t0).toBeLessThan(30);
    await wait(1);
    expect(released).toBe(true);
  });

  it('the attacker own events and an unarmed ctx never wait', async () => {
    const ctx = fakeCtx();
    const t0 = Date.now();
    await meetContact(ctx, 'tidus');
    armContact(ctx, 'tidus');
    await meetContact(ctx, 'tidus');
    expect(Date.now() - t0).toBeLessThan(30);
    releaseContact(ctx);
  });

  it('the hold is capped when no hit ever comes', async () => {
    const ctx = { sleep: (ms: number) => wait(ms / 20) } as unknown as EventCtx; // a fast clock
    const c = armContact(ctx, 'tidus');
    c.reached();
    const t0 = Date.now();
    await c.hold;
    expect(Date.now() - t0).toBeLessThan(CONTACT_HOLD_MAX_MS / 20 + 40);
  });
});
