import { describe, expect, it } from 'vitest';
import { CAVERN_STOLEN_FAYTH_SLOTS } from '../../../src/scenes/cavern-stolen-fayth.ts';
import { CAVERN_PHONE_PARTY_STEP, cavernPartySlots } from '../../../src/scenes/cavern-stolen-fayth-rigs.ts';

/**
 * r3941-heights (FFX only, Chapter IX): the heroes stand at their own heights, and on a phone the Zanmato gauge covers the top of the field, so Kimahri's head
 * (1.304 of Tidus's painting) stood 42 percent behind it where the party at one height had 16. The party steps toward the lens on a phone, measured at
 * 390x844 with the camera, the fiends and BOSS SCALE exactly where they were (`docs/handoff/r3941-heights.md`); the 16:9 field is untouched.
 * Held here: the step is a floor move of the three active slots only, on a portrait screen only.
 */

/** The scene's seven slots: the three active ones as published, then a reserve spot off frame-left. */
const SLOTS: Array<[number, number, number]> = [...CAVERN_STOLEN_FAYTH_SLOTS.party, [-9.6, 0, 2.6], [-10.5, 0, 1.0], [-11.4, 0, -0.6], [-12.3, 0, -2.2]];

describe("Chapter IX's party slots by the shape of the screen", () => {
  it('are the published slots on 16:9 and every landscape window', () => {
    for (const aspect of [16 / 9, 4 / 3, 16 / 10, 1]) {
      expect(cavernPartySlots(SLOTS, aspect), String(aspect)).toEqual(SLOTS);
    }
  });

  it('step toward the lens on a phone: z only, the three active slots, the reserve where it was', () => {
    const phone = cavernPartySlots(SLOTS, 390 / 844);
    expect(phone).toHaveLength(SLOTS.length);
    phone.forEach((s, i) => {
      expect(s[0], `x ${i}`).toBe(SLOTS[i]![0]);
      expect(s[1], `y ${i}`).toBe(SLOTS[i]![1]);
      expect(s[2], `z ${i}`).toBeCloseTo(SLOTS[i]![2] + (i < 3 ? CAVERN_PHONE_PARTY_STEP : 0), 12);
    });
    expect(CAVERN_PHONE_PARTY_STEP).toBeGreaterThan(0); // toward the lens (+z), never back under the gauge
  });

  it('never write into the table it is given or the published one', () => {
    const before = JSON.stringify(SLOTS);
    const published = JSON.stringify(CAVERN_STOLEN_FAYTH_SLOTS.party);
    cavernPartySlots(SLOTS, 390 / 844)[0]![2] += 5;
    expect(JSON.stringify(SLOTS)).toBe(before);
    expect(JSON.stringify(CAVERN_STOLEN_FAYTH_SLOTS.party)).toBe(published);
  });
});
