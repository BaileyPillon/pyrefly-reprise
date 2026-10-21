/**
 * Release 61, the conference demo (decision 169: "A gamepad (Recommended)"); both games, input plumbing.
 *
 * `src/app/padMap.ts` is the one table every pad reader in the build shares: the standard-mapping button numbers, how a stick points a menu, how fast a
 * held direction repeats, and which family of button names (Xbox, PlayStation, Switch) a pad belongs to. Pure, so a scripted timeline stands in for a thumb.
 */
import { describe, expect, it } from 'vitest';
import {
  PAD,
  PAD_LABELS,
  PAD_REPEAT_DELAY_MS,
  PAD_REPEAT_INTERVAL_MS,
  STICK_ENGAGE,
  STICK_RELEASE,
  padFamilyOf,
  padTokenOf,
  padWord,
  stickDirection,
  type PadDirection,
} from '../../src/app/padMap.ts';

describe('the standard-mapping table', () => {
  it('names the 16 standard buttons by their W3C indices', () => {
    expect(PAD).toMatchObject({ A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 });
  });
});

/** Run a scripted stick timeline through `stickDirection`, as `Input` does: the last answer is next frame's `held`. */
function run(samples: ReadonlyArray<readonly [number, number]>): Array<PadDirection | null> {
  const out: Array<PadDirection | null> = [];
  let held: PadDirection | null = null;
  for (const [x, y] of samples) {
    held = stickDirection(x, y, held);
    out.push(held);
  }
  return out;
}

/** How many separate presses a timeline makes (a press is a change from none to a direction, or a direction to another). */
function presses(dirs: ReadonlyArray<PadDirection | null>): number {
  let n = 0;
  let prev: PadDirection | null = null;
  for (const d of dirs) {
    if (d !== null && d !== prev) n++;
    prev = d;
  }
  return n;
}

describe('the left stick points a menu one way at a time', () => {
  it('rests on nothing: a worn stick wandering under 0.3 never fires', () => {
    const wander: Array<[number, number]> = [[0.12, -0.2], [-0.25, 0.1], [0.28, 0.28], [-0.3, -0.2], [0.05, 0.31]];
    expect(run(wander).every((d) => d === null)).toBe(true);
  });

  it('a short push starts a direction at the engage length, and not under it', () => {
    expect(stickDirection(STICK_ENGAGE - 0.02, 0, null)).toBeNull();
    expect(stickDirection(STICK_ENGAGE + 0.02, 0, null)).toBe('right');
    expect(stickDirection(-0.9, 0.1, null)).toBe('left');
    expect(stickDirection(0.1, -0.9, null)).toBe('up'); // the browser's y is negative up
    expect(stickDirection(0.1, 0.9, null)).toBe('down');
  });

  it('a diagonal push is ONE direction, the longer axis, never two (the old per-axis dead zone moved a cursor twice)', () => {
    expect(stickDirection(0.8, 0.7, null)).toBe('right');
    expect(stickDirection(0.7, 0.8, null)).toBe('down');
    expect(stickDirection(-0.75, -0.74, null)).toBe('left');
  });

  it('a thumb resting near the edge of the dead zone is one press, not a flicker of three', () => {
    // 0.55 engages; the stick then sags to 0.4, bounces to 0.52, sags to 0.35, comes back to 0.6: still the one held push.
    const edge = run([[0.55, 0], [0.4, 0], [0.52, 0], [0.35, 0], [0.6, 0], [0.31, 0]]);
    expect(edge).toEqual(['right', 'right', 'right', 'right', 'right', 'right']);
    expect(presses(edge)).toBe(1);
  });

  it('releasing under the release length ends the push, and a new push is a new press', () => {
    const timeline = run([[0.7, 0], [0.5, 0], [STICK_RELEASE - 0.05, 0], [0.7, 0]]);
    expect(timeline).toEqual(['right', 'right', null, 'right']);
    expect(presses(timeline)).toBe(2);
  });

  it('rolling the thumb off a corner does not send a stray move on the other axis', () => {
    // right held at 0.8; the thumb drifts down to a 0.8 / 0.9 diagonal: still right (the other axis must be 1.3 x longer to take over)
    expect(run([[0.8, 0], [0.8, 0.9], [0.8, 0.95]])).toEqual(['right', 'right', 'right']);
    // ... but a clear change of mind is followed
    expect(run([[0.8, 0], [0.4, 0.9]])).toEqual(['right', 'down']);
  });

  it('a sweep through the dead zone, left to right, is two presses (one each way)', () => {
    const sweep = run([[-0.9, 0], [-0.6, 0], [-0.2, 0], [0.3, 0], [0.7, 0], [0.9, 0]]);
    expect(sweep).toEqual(['left', 'left', null, null, 'right', 'right']);
    expect(presses(sweep)).toBe(2);
  });

  it('NaN and missing axes are rest', () => {
    expect(stickDirection(Number.NaN, 0.9, null)).toBeNull();
    expect(stickDirection(0.9, Number.POSITIVE_INFINITY, null)).toBeNull();
  });
});

describe('repeat', () => {
  it('a held direction waits long enough that a quick tap is one move, then steps at a rate a frame cannot double', () => {
    expect(PAD_REPEAT_DELAY_MS).toBeGreaterThanOrEqual(300);
    expect(PAD_REPEAT_DELAY_MS).toBeLessThanOrEqual(450);
    expect(PAD_REPEAT_INTERVAL_MS).toBeGreaterThanOrEqual(90);
    expect(PAD_REPEAT_INTERVAL_MS).toBeLessThanOrEqual(160);
    expect(PAD_REPEAT_INTERVAL_MS).toBeGreaterThan(2 * (1000 / 60)); // never two steps inside two 60 Hz frames
  });
});

describe('which family of names a pad uses', () => {
  const cases: Array<[string, string]> = [
    ['Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', 'xbox'],
    ['Xbox 360 Controller (XInput STANDARD GAMEPAD)', 'xbox'],
    ['45e-b13-Xbox Wireless Controller', 'xbox'],
    ['Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)', 'playstation'],
    ['DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', 'playstation'],
    ['054c-09cc-Wireless Controller', 'playstation'],
    ['PS4 Controller', 'playstation'],
    ['Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)', 'nintendo'],
    ['057e-2009-Pro Controller', 'nintendo'],
    ['8BitDo Pro 2 (STANDARD GAMEPAD Vendor: 2dc8 Product: 6003)', 'xbox'],
    ['Logitech Gamepad F310 (STANDARD GAMEPAD Vendor: 046d Product: c21d)', 'xbox'],
    ['', 'xbox'],
  ];
  it.each(cases)('%s -> %s', (id, family) => {
    expect(padFamilyOf(id)).toBe(family);
  });
  it('null and undefined are an Xbox pad (the most common labels on a PC)', () => {
    expect(padFamilyOf(null)).toBe('xbox');
    expect(padFamilyOf(undefined)).toBe('xbox');
  });
});

describe('the glyph names', () => {
  it('the same standard index reads A / cross / B in the three families: the bottom face button confirms on all of them', () => {
    expect(PAD_LABELS.xbox.cross).toBe('A');
    expect(PAD_LABELS.playstation.cross).toBe('✕');
    expect(PAD_LABELS.nintendo.cross).toBe('B');
    expect(PAD_LABELS.xbox.circle).toBe('B');
    expect(PAD_LABELS.playstation.circle).toBe('○');
    expect(PAD_LABELS.nintendo.circle).toBe('A');
    expect(PAD_LABELS.xbox.l2).toBe('LT');
    expect(PAD_LABELS.playstation.l2).toBe('L2');
    expect(PAD_LABELS.nintendo.l2).toBe('ZL');
  });

  it('every token has a label in every family', () => {
    for (const family of ['xbox', 'playstation', 'nintendo'] as const) {
      for (const label of Object.values(PAD_LABELS[family])) expect(label.length).toBeGreaterThan(0);
    }
    expect(Object.keys(PAD_LABELS.xbox).sort()).toEqual(Object.keys(PAD_LABELS.playstation).sort());
    expect(Object.keys(PAD_LABELS.xbox).sort()).toEqual(Object.keys(PAD_LABELS.nintendo).sort());
  });

  it('reads the build\'s legacy hint words as tokens', () => {
    expect(padTokenOf('Cross')).toBe('cross');
    expect(padTokenOf('circle')).toBe('circle');
    expect(padTokenOf('Square')).toBe('square');
    expect(padTokenOf('Triangle')).toBe('triangle');
    expect(padTokenOf('L1')).toBe('l1');
    expect(padTokenOf('R2')).toBe('r2');
    expect(padTokenOf('Select')).toBe('select');
    expect(padTokenOf('Back')).toBe('select');
    expect(padTokenOf('Start')).toBe('start');
    expect(padTokenOf('D-pad')).toBe('dpad');
    expect(padTokenOf('R-Stick')).toBe('rstick');
    expect(padTokenOf('Hold')).toBeNull();
    expect(padTokenOf('Enter')).toBeNull();
  });

  it('speaks a button the way its pad does', () => {
    expect(padWord('cross', 'xbox')).toBe('A');
    expect(padWord('cross', 'playstation')).toBe('Cross');
    expect(padWord('start', 'xbox')).toBe('Menu button');
    expect(padWord('l2', 'xbox')).toBe('LT');
  });
});
