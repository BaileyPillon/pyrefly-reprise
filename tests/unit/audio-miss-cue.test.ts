/**
 * fb-0929-sfx (Bailey's friend, 2026-09-29: "no sound effects on attacks so doesn't feel like I
 * did much"). Measured on the live build (release 31a) with the probe `tools/audio/sfx-probe.mjs`:
 * a blow that misses played `cancel`, the menu's "back out" glass tone, at half volume. So a
 * missed swing sounded like the player had backed out of a menu, not like a swing.
 *
 * The bank has the cue for it: `whiff` ("A swing that hits nothing: cloth and air",
 * `src/audio/sfx/weapons.ts`), and docs/AUDIO-GUIDE.md's table names it for the miss
 * ("contact result ... `whiff` (miss)"). The presenter's fallback table sent `miss` to `cancel`.
 *
 * Game case: both (shared presenter plumbing; the `miss` event is the same in FFX and FFX-2).
 */
import { describe, expect, it } from 'vitest';

import { createEventCtx, playEvent } from '../../src/engine/BattlePresenterEvents.ts';
import { SFX_FALLBACKS } from '../../src/engine/BattlePresenterPorts.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { resolveSfx } from '../../src/audio/sfx/index.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';

describe('a miss sounds like a swing that hits nothing', () => {
  it('plays whiff, never the menu cancel tone', async () => {
    const audio = new FakeAudio();
    const ctx = createEventCtx({ stage: new FakeStage(), audio }, async () => {}, () => 'normal');
    const miss = { type: 'miss', targetId: 'seymour-flux', reason: 'evaded' } as unknown as BattleEvent;
    await playEvent(ctx, miss);
    expect(audio.cues).toEqual(['whiff']);
    expect(audio.cues).not.toContain('cancel');
  });

  it('the cue it names is in the bank', () => {
    expect(resolveSfx(SFX_FALLBACKS['miss']!)).toBe('whiff');
  });
});
