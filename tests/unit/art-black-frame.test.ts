/**
 * `tools/gen/black-frame.mjs` — the guard that stands between a NaN'd GPU and
 * `public/art/`.
 *
 * On 2026-09-18 the GPU spent six minutes emitting 832x1216 rectangles of pure
 * zero while ComfyUI reported every one of them as a success. Thirteen were
 * rendered and two reached the repo. The guard's job is to make that
 * unshippable; these tests pin down every decision it gets to make: is this
 * frame black, which decoder's answer counts, may ComfyUI be restarted, and
 * where the rejected file goes.
 *
 * What is actually at stake in each direction:
 *
 * - **A false negative ships a black PNG.** So `isBlackFrame` has to fire on
 *   the exact shape of the failure, including a cutout whose alpha channel is
 *   full of 255s over dead RGB.
 * - **A false positive throws away a good painting.** The backdrops include
 *   deliberately near-black night scenes, so anything that rejects "dark" as
 *   well as "zero" is a bug — `dark night scene, not black` below is the test
 *   that would catch a mean-threshold rewrite.
 *
 * Nothing here spawns ComfyUI, python or a GPU. The PNG fixtures are built in
 * memory, including the filter types PIL actually emits, because an
 * unfiltering bug would silently turn every verdict into `null` (unknown) and
 * quietly switch the gallery's badge off.
 */

import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import {
  BLACK_RESTART_MIN_INTERVAL_MS,
  fileStamp,
  isBlackFrame,
  maxRgbOfPng,
  parseRestartSentinel,
  quarantineTargetFor,
  resolveMaxRgb,
  shouldRestartAfterBlack,
  shouldRestartGivenQueue,
} from '../../tools/gen/black-frame.mjs';

// --------------------------------------------------------------------------
// PNG fixtures
// --------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] as number) ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type: string, body: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

/** Wrap already-filtered scanlines (`filter byte + row`, repeated) as a PNG. */
function pngFromRaw(width: number, height: number, colorType: number, raw: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Build an 8-bit PNG from raw samples, applying one PNG row filter.
 *
 * `filterType` matters: PIL picks filters adaptively, so a real ComfyUI render
 * arrives with a mix of Sub/Up/Average/Paeth rows. A decoder that only handles
 * filter 0 passes a naive fixture and then reads live art as garbage.
 */
function makePng(
  width: number,
  height: number,
  colorType: number,
  pixel: number[],
  filterType = 0,
): Buffer {
  const channels = CHANNELS[colorType] as number;
  const stride = width * channels;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < channels; c++) row[x * channels + c] = pixel[c] as number;
    }
    rows.push(row);
  }

  const raw = Buffer.alloc((stride + 1) * height);
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = rows[y] as Buffer;
    const encoded = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? (row[i - channels] as number) : 0;
      const up = prev[i] as number;
      const upLeft = i >= channels ? (prev[i - channels] as number) : 0;
      const value = row[i] as number;
      if (filterType === 1) encoded[i] = (value - left) & 0xff;
      else if (filterType === 2) encoded[i] = (value - up) & 0xff;
      else if (filterType === 3) encoded[i] = (value - ((left + up) >> 1)) & 0xff;
      else if (filterType === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        encoded[i] = (value - pred) & 0xff;
      } else encoded[i] = value;
    }
    raw[y * (stride + 1)] = filterType;
    encoded.copy(raw, y * (stride + 1) + 1);
    row.copy(prev);
  }

  return pngFromRaw(width, height, colorType, raw);
}

/** An opaque black RGBA field with one non-zero pixel in the middle of it. */
function makePngWithSpeck(width: number, height: number, speck: number[]): Buffer {
  const channels = 4;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      raw[y * (stride + 1) + 1 + x * channels + 3] = 255;
    }
  }
  const mid = Math.floor(height / 2) * (stride + 1) + 1 + Math.floor(width / 2) * channels;
  raw[mid] = speck[0] as number;
  raw[mid + 1] = speck[1] as number;
  raw[mid + 2] = speck[2] as number;
  return pngFromRaw(width, height, 6, raw);
}

// --------------------------------------------------------------------------

describe('isBlackFrame', () => {
  it('fires only on an exactly-zero maximum', () => {
    expect(isBlackFrame(0)).toBe(true);
    expect(isBlackFrame(1)).toBe(false);
    expect(isBlackFrame(255)).toBe(false);
  });

  it('treats "could not decode" as not black, so the guard fails open', () => {
    expect(isBlackFrame(null)).toBe(false);
    expect(isBlackFrame(undefined)).toBe(false);
    expect(isBlackFrame(Number.NaN)).toBe(false);
  });
});

describe('maxRgbOfPng', () => {
  it('reads an all-zero render as 0 — the NaN-state signature', () => {
    const png = makePng(8, 6, 2, [0, 0, 0]);
    expect(maxRgbOfPng(png)).toBe(0);
    expect(isBlackFrame(maxRgbOfPng(png))).toBe(true);
  });

  it('ignores alpha: an opaque cutout over dead RGB is still black', () => {
    // This is what a black render looks like after rembg has had it: every
    // alpha byte is 255, and reading alpha as colour would call it healthy.
    const png = makePng(8, 6, 6, [0, 0, 0, 255]);
    expect(maxRgbOfPng(png)).toBe(0);
    expect(isBlackFrame(maxRgbOfPng(png))).toBe(true);
  });

  it('passes a dark night scene that is merely near-black', () => {
    // The whole reason the check is max-is-zero and not a mean threshold:
    // public/art/backdrops has paintings this dark and they are correct.
    const png = makePng(8, 6, 2, [3, 2, 4]);
    expect(maxRgbOfPng(png)).toBe(4);
    expect(isBlackFrame(maxRgbOfPng(png))).toBe(false);
  });

  it('passes a black field with a single non-zero speck', () => {
    const png = makePngWithSpeck(16, 12, [0, 0, 1]);
    expect(maxRgbOfPng(png)).toBe(1);
    expect(isBlackFrame(maxRgbOfPng(png))).toBe(false);
  });

  it('decodes every PNG row filter PIL emits', () => {
    for (const filterType of [0, 1, 2, 3, 4]) {
      expect(maxRgbOfPng(makePng(9, 7, 2, [0, 0, 0], filterType))).toBe(0);
      expect(maxRgbOfPng(makePng(9, 7, 2, [17, 5, 9], filterType))).toBe(17);
      expect(maxRgbOfPng(makePng(9, 7, 6, [0, 0, 0, 255], filterType))).toBe(0);
    }
  });

  it('reads greyscale and greyscale+alpha', () => {
    expect(maxRgbOfPng(makePng(4, 4, 0, [0], 4))).toBe(0);
    expect(maxRgbOfPng(makePng(4, 4, 0, [12], 4))).toBe(12);
    expect(maxRgbOfPng(makePng(4, 4, 4, [0, 255], 2))).toBe(0);
  });

  it('says "unknown" rather than "black" for bytes it cannot read', () => {
    expect(maxRgbOfPng(Buffer.from('not a png at all'))).toBeNull();
    expect(maxRgbOfPng(Buffer.alloc(0))).toBeNull();
    expect(maxRgbOfPng(null)).toBeNull();
    // Truncated mid-chunk: a half-written file the watcher caught in flight.
    expect(maxRgbOfPng(makePng(8, 6, 2, [0, 0, 0]).subarray(0, 20))).toBeNull();
  });
});

describe('resolveMaxRgb', () => {
  it('uses the embedded python when it answers, and does not decode twice', () => {
    const fallback = vi.fn(() => 42);
    expect(resolveMaxRgb(0, fallback)).toEqual({ maxRgb: 0, source: 'python' });
    expect(resolveMaxRgb(200, fallback)).toEqual({ maxRgb: 200, source: 'python' });
    // The authority answered; running the JS decoder as well would be pure cost
    // on every single render.
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back to the built-in decoder when there is no embedded python', () => {
    // `maxRgbOfPngFile` returns null when `COMFY_ROOT/python_embeded/python.exe`
    // is missing — a wrong COMFY_ROOT, a moved bundle. That used to switch the
    // guard off silently and let a NaN'd GPU write straight to public/art.
    const black = makePng(8, 6, 2, [0, 0, 0]);
    expect(resolveMaxRgb(null, () => maxRgbOfPng(black))).toEqual({
      maxRgb: 0,
      source: 'fallback',
    });
    expect(isBlackFrame(resolveMaxRgb(null, () => maxRgbOfPng(black)).maxRgb)).toBe(true);

    const painting = makePng(8, 6, 2, [3, 2, 4]);
    expect(resolveMaxRgb(null, () => maxRgbOfPng(painting))).toEqual({
      maxRgb: 4,
      source: 'fallback',
    });
  });

  it('treats a non-numeric python answer as no answer', () => {
    expect(resolveMaxRgb(undefined, () => 7)).toEqual({ maxRgb: 7, source: 'fallback' });
    expect(resolveMaxRgb(Number.NaN, () => 7)).toEqual({ maxRgb: 7, source: 'fallback' });
  });

  it('reports "none" — unverified, and NOT black — when neither can read it', () => {
    const verdict = resolveMaxRgb(null, () => maxRgbOfPng(Buffer.from('not a png')));
    expect(verdict).toEqual({ maxRgb: null, source: 'none' });
    // The point of the whole fail-open design: an unreadable render must not be
    // rejected as black. The caller's job is to say it is unverified.
    expect(isBlackFrame(verdict.maxRgb)).toBe(false);
  });

  it('accepts a plain value as well as a thunk', () => {
    expect(resolveMaxRgb(null, 9)).toEqual({ maxRgb: 9, source: 'fallback' });
    expect(resolveMaxRgb(null, null)).toEqual({ maxRgb: null, source: 'none' });
  });
});

describe('quarantineTargetFor', () => {
  const outputDir = 'D:/Tools/ComfyUI/output';
  const quarantineDir = 'D:/Tools/comfy-logs/black-quarantine';
  const opts = { outputDir, quarantineDir, stamp: '20260918T133501Z' };

  /** Compare against a path built the same way the platform builds them. */
  const p = (...parts: string[]) => path.normalize(path.join(...parts));

  it('finds the copy SaveImage already wrote, under the output dir', () => {
    // This is the gap the guard had: the repo stays clean, but ComfyUI's own
    // PNG is sitting in the first folder art-watch scans.
    expect(
      quarantineTargetFor({ filename: 'hero_ch1_00013_.png', subfolder: 'pyrefly', type: 'output' }, opts),
    ).toEqual({
      from: p(outputDir, 'pyrefly', 'hero_ch1_00013_.png'),
      to: p(quarantineDir, '20260918T133501Z__pyrefly__hero_ch1_00013_.png'),
    });
  });

  it('flattens the subfolder into the name so one folder holds everything', () => {
    const target = quarantineTargetFor(
      { filename: 'x_00001_.png', subfolder: 'pyrefly/ch2' },
      opts,
    );
    expect(path.basename(target?.to ?? '')).toBe('20260918T133501Z__pyrefly__ch2__x_00001_.png');
  });

  it('handles a flat output image and a missing stamp', () => {
    expect(quarantineTargetFor({ filename: 'x_00001_.png' }, { outputDir, quarantineDir })).toEqual({
      from: p(outputDir, 'x_00001_.png'),
      to: p(quarantineDir, 'x_00001_.png'),
    });
  });

  it('refuses to move anything it cannot place inside the output dir', () => {
    // It decides what gets renamed on disk, so it does not take ComfyUI's
    // strings on trust.
    expect(quarantineTargetFor({ filename: 'x.png', subfolder: '../../..' }, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: '../x.png' }, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: 'sub/x.png' }, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: 'x.png', subfolder: 'C:/Windows' }, opts)).toBeNull();
  });

  it('does nothing for an image that is not in the output tree at all', () => {
    expect(quarantineTargetFor({ filename: 'x.png', type: 'temp' }, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: 'x.png', type: 'input' }, opts)).toBeNull();
  });

  it('does nothing without a usable history entry', () => {
    expect(quarantineTargetFor(null, opts)).toBeNull();
    expect(quarantineTargetFor({}, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: '   ' }, opts)).toBeNull();
    expect(quarantineTargetFor({ filename: '..' }, opts)).toBeNull();
  });
});

describe('fileStamp', () => {
  it('is a filename, so no colons', () => {
    expect(fileStamp(new Date('2026-09-18T13:35:01.123Z'))).toBe('20260918T133501Z');
    expect(fileStamp('2026-09-18T13:35:01.000Z')).toBe('20260918T133501Z');
    expect(fileStamp(new Date('2026-09-18T13:35:01.123Z'))).not.toMatch(/[:*?"<>|]/);
  });

  it('does not throw on a bad date', () => {
    expect(typeof fileStamp('nonsense')).toBe('string');
  });
});

describe('parseRestartSentinel', () => {
  it('reads epoch seconds, which is what the file holds', () => {
    expect(parseRestartSentinel('1789000000\n')).toBe(1789000000000);
  });

  it('accepts a hand-written millisecond stamp too', () => {
    expect(parseRestartSentinel('1789000000000')).toBe(1789000000000);
  });

  it('has no restart on record for junk, empty or missing contents', () => {
    expect(parseRestartSentinel('')).toBeNull();
    expect(parseRestartSentinel('   \n')).toBeNull();
    expect(parseRestartSentinel('not a number')).toBeNull();
    expect(parseRestartSentinel('-5')).toBeNull();
    expect(parseRestartSentinel(null)).toBeNull();
  });
});

describe('shouldRestartAfterBlack', () => {
  const now = 1_789_000_000_000;

  it('restarts when nothing is on record', () => {
    expect(shouldRestartAfterBlack(now, null)).toBe(true);
    expect(shouldRestartAfterBlack(now, undefined)).toBe(true);
  });

  it('refuses a second restart inside the throttle window', () => {
    expect(shouldRestartAfterBlack(now, now - 5 * 60_000)).toBe(false);
    expect(shouldRestartAfterBlack(now, now - 1000)).toBe(false);
  });

  it('allows one again once the window has passed', () => {
    expect(shouldRestartAfterBlack(now, now - BLACK_RESTART_MIN_INTERVAL_MS)).toBe(true);
    expect(shouldRestartAfterBlack(now, now - 11 * 60_000)).toBe(true);
  });

  it('refuses a stamp from the future rather than looping on a bad clock', () => {
    expect(shouldRestartAfterBlack(now, now + 60_000)).toBe(false);
  });

  it('throttles on ten minutes', () => {
    expect(BLACK_RESTART_MIN_INTERVAL_MS).toBe(10 * 60 * 1000);
  });
});

describe('shouldRestartGivenQueue', () => {
  // 2026-09-21 correction: ComfyUI is shared with the rest of the art fleet.
  // A black-frame restart kills whatever ANYONE has running or queued, not
  // just this session's own job, so a restart must not happen while another
  // session's prompt is on the queue.

  it('allows the restart when the queue is empty', () => {
    expect(shouldRestartGivenQueue({ queue_running: [], queue_pending: [] }, 'my-prompt')).toBe(true);
  });

  it('allows the restart when only our own (already-finished) prompt shows up', () => {
    // ComfyUI's actual shape: [order, prompt_id, prompt, extra_data, outputs].
    expect(
      shouldRestartGivenQueue(
        { queue_running: [[0, 'my-prompt', {}, {}, []]], queue_pending: [] },
        'my-prompt',
      ),
    ).toBe(true);
  });

  it('refuses when another prompt is running', () => {
    expect(
      shouldRestartGivenQueue(
        { queue_running: [[0, 'someone-elses-prompt', {}, {}, []]], queue_pending: [] },
        'my-prompt',
      ),
    ).toBe(false);
  });

  it('refuses when another prompt is only pending, not yet running', () => {
    expect(
      shouldRestartGivenQueue(
        { queue_running: [], queue_pending: [[1, 'queued-elsewhere', {}, {}, []]] },
        'my-prompt',
      ),
    ).toBe(false);
  });

  it('accepts an object-shaped queue entry too, not only ComfyUI’s array-of-arrays', () => {
    expect(
      shouldRestartGivenQueue(
        { queue_running: [{ prompt_id: 'someone-elses-prompt' }], queue_pending: [] },
        'my-prompt',
      ),
    ).toBe(false);
    expect(
      shouldRestartGivenQueue({ queue_running: [{ prompt_id: 'my-prompt' }], queue_pending: [] }, 'my-prompt'),
    ).toBe(true);
  });

  it('fails OPEN — allows the restart — when the queue could not be read at all', () => {
    // A checker that fails closed here would strand a genuinely solo
    // session's GPU over its own bug reading /queue, same policy as every
    // other guard in this file.
    expect(shouldRestartGivenQueue(null, 'my-prompt')).toBe(true);
    expect(shouldRestartGivenQueue(undefined, 'my-prompt')).toBe(true);
    expect(shouldRestartGivenQueue({}, 'my-prompt')).toBe(true);
  });

  it('is not confused by a missing prompt id on either side', () => {
    expect(
      shouldRestartGivenQueue({ queue_running: [[0, null, {}, {}, []]], queue_pending: [] }, 'my-prompt'),
    ).toBe(true);
    expect(shouldRestartGivenQueue({ queue_running: [[0, 'someone', {}, {}, []]], queue_pending: [] }, null)).toBe(
      false,
    );
  });
});
