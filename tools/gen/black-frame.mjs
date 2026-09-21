/**
 * Black-frame detection — the pure half.
 *
 * On 2026-09-18 at 13:35 the GPU dropped into a NaN state mid-session: the
 * sampler kept running, ComfyUI's SaveImage kept writing PNGs, and every one of
 * them was 832x1216 pixels of zero. `nodes.py:1699: RuntimeWarning: invalid
 * value encountered in cast` is the tell — casting a NaN float tensor to uint8
 * gives 0 everywhere. Two of those files reached `public/art/` before a human
 * looked at a thumbnail. See `docs/handoff/art-ops.md`.
 *
 * Everything in this file is a pure function of its arguments, so the decisions
 * the pipeline makes under that failure (reject? restart? fail?) are unit
 * testable without a GPU, a ComfyUI, or a clock.
 *
 * Node built-ins only (`zlib`, `path`), same rule as the rest of `tools/`.
 *
 * Two callers, deliberately different ways of getting `maxRgb`:
 *
 *   - `tools/gen/comfy.mjs` shells out to ComfyUI's embedded python and asks
 *     PIL + numpy, because it is guarding the art pipeline itself and a
 *     battle-tested decoder is worth 1.2s per render. When that is not
 *     available it falls back to `maxRgbOfPng` below via `resolveMaxRgb`.
 *   - `tools/art-watch.mjs` uses `maxRgbOfPng` below, because it is an
 *     always-on web page that would otherwise spawn python on every 20s
 *     refresh.
 *
 * Both funnel into the same `isBlackFrame`, which is the actual policy.
 */

import { inflateSync } from 'node:zlib';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

/**
 * How long a black-frame ComfyUI restart is allowed to suppress the next one.
 *
 * A NaN'd GPU usually comes back from a process restart; a GPU that NaNs again
 * ten minutes later is a hardware/driver problem and restarting in a loop just
 * hides it from the operator while burning the art fleet's afternoon.
 */
export const BLACK_RESTART_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Is this render the NaN failure?
 *
 * **Exactly zero, not "dark".** `public/art/backdrops/` is full of legitimately
 * near-black paintings — Zanarkand at night, the inside of Sin — and a mean or
 * percentile threshold would throw those away. A painting always has at least
 * one non-zero sample somewhere; a NaN cast never does. So the test is the
 * strongest one that cannot produce a false positive: the maximum RGB sample
 * over the whole image is 0.
 *
 * `null` (the decoder could not read the file, python is missing, the format is
 * exotic) is deliberately NOT black. The guard fails open: an unreadable render
 * is a separate problem and rejecting it here would stop the fleet dead.
 *
 * @param {number|null|undefined} maxRgb largest R, G or B sample in the image
 * @returns {boolean}
 */
export function isBlackFrame(maxRgb) {
  return typeof maxRgb === 'number' && Number.isFinite(maxRgb) && maxRgb === 0;
}

/**
 * Read the restart sentinel's contents into an epoch in milliseconds.
 *
 * The file `D:/Tools/comfy-logs/last-black-restart.txt` holds epoch *seconds*
 * (one line, so an operator can read it with `type`), but this accepts
 * milliseconds too: anything past 1e11 is too far in the future to be seconds
 * and is obviously a JS `Date.now()` someone wrote by hand.
 *
 * Junk, an empty file and a missing file all mean the same thing — no restart
 * on record — and that is `null`, which `shouldRestartAfterBlack` treats as
 * permission to restart. Erring toward restarting is right: the alternative is
 * refusing to recover because a text file got corrupted.
 *
 * @param {string|null|undefined} text
 * @returns {number|null} epoch ms, or null when there is no usable stamp
 */
export function parseRestartSentinel(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.split(/\s+/)[0]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 1e11 ? Math.round(n * 1000) : Math.round(n);
}

/**
 * May the pipeline restart ComfyUI right now?
 *
 * ComfyUI is shared — other art agents have work queued on it — so a restart is
 * a rude thing to do and this is the throttle that keeps it rare.
 *
 * A stamp in the future means the clock moved (or another agent's machine wrote
 * it); refuse rather than restart, because the alternative is a restart loop
 * that never ages out.
 *
 * @param {number} nowMs
 * @param {number|null|undefined} lastRestartMs from `parseRestartSentinel`
 * @param {number} [minIntervalMs]
 * @returns {boolean}
 */
export function shouldRestartAfterBlack(
  nowMs,
  lastRestartMs,
  minIntervalMs = BLACK_RESTART_MIN_INTERVAL_MS,
) {
  if (typeof lastRestartMs !== 'number' || !Number.isFinite(lastRestartMs)) return true;
  const age = nowMs - lastRestartMs;
  if (age < 0) return false;
  return age >= minIntervalMs;
}

/**
 * May ComfyUI be restarted, given who else has work queued on it right now?
 *
 * 2026-09-21 correction: ComfyUI is shared with the rest of the art fleet —
 * several agent sessions can be queuing renders on the one GPU at once. A
 * black-frame restart kills whatever ANYONE has running or pending, not just
 * the caller's own job, so a restart that happens to land while another
 * session has work queued would blow that job away too. `ourPromptId` is the
 * prompt whose black frame triggered this restart; by the time `/queue` is
 * read that prompt has already finished (successfully or not) and left the
 * queue, so in practice this is close to "is the queue otherwise empty" — the
 * `!== ourPromptId` filter is kept for the (currently hypothetical, but
 * cheap-to-handle) case of a client with more than one prompt in flight at
 * once.
 *
 * `queueState` is the raw parsed JSON from ComfyUI's `GET /queue`:
 * `{queue_running: [...], queue_pending: [...]}`, each entry either
 * `[order, prompt_id, ...]` (the shape ComfyUI actually sends) or
 * `{prompt_id}` (accepted too, so a test or a future client shape does not
 * have to match ComfyUI's array-of-arrays exactly).
 *
 * Fails OPEN (returns `true`, allow the restart) when the queue could not be
 * read at all (`queueState` is `null`/not an object) — same policy as the
 * black-frame decoders: a checker that fails closed would strand a genuinely
 * solo session's GPU over its own bug reading `/queue`. It fails CLOSED
 * (refuses) only when it positively saw someone else's work queued.
 *
 * @param {{queue_running?: Array, queue_pending?: Array}|null|undefined} queueState
 * @param {string|null|undefined} ourPromptId
 * @returns {boolean}
 */
export function shouldRestartGivenQueue(queueState, ourPromptId) {
  if (!queueState || typeof queueState !== 'object') return true;
  const running = Array.isArray(queueState.queue_running) ? queueState.queue_running : [];
  const pending = Array.isArray(queueState.queue_pending) ? queueState.queue_pending : [];
  const idOf = (entry) => (Array.isArray(entry) ? entry[1] : entry?.prompt_id);
  const others = [...running, ...pending].filter((entry) => {
    const id = idOf(entry);
    return id != null && id !== ourPromptId;
  });
  return others.length === 0;
}

/**
 * Pick which decoder's answer the guard acts on.
 *
 * `comfy.mjs` prefers ComfyUI's embedded python (PIL + numpy), but that path is
 * only there when `COMFY_ROOT` points at a real bundle. Before this existed, a
 * wrong `COMFY_ROOT` or a moved `python_embeded/` turned the guard off entirely
 * and the pipeline went back to writing whatever came off the GPU — the exact
 * state that shipped two black frames on 2026-09-18. So python missing is a
 * *fallback*, not a surrender: `maxRgbOfPng` below agreed with PIL on 29 of 29
 * real renders, and a second opinion beats no opinion.
 *
 * The fallback is passed as a thunk so the cheap-but-not-free pure-JS inflate
 * only runs when it is actually needed.
 *
 * `source`:
 *   - `'python'`   — the authority answered; `maxRgb` is its number.
 *   - `'fallback'` — python could not, the built-in decoder could.
 *   - `'none'`     — neither could. `maxRgb` is null, which `isBlackFrame`
 *                    treats as *not* black: the render is unverified, and the
 *                    caller is expected to say so out loud.
 *
 * @param {number|null|undefined} pythonMax
 * @param {(() => number|null|undefined)|number|null|undefined} fallback
 * @returns {{maxRgb: number|null, source: 'python'|'fallback'|'none'}}
 */
export function resolveMaxRgb(pythonMax, fallback) {
  if (typeof pythonMax === 'number' && Number.isFinite(pythonMax)) {
    return { maxRgb: pythonMax, source: 'python' };
  }
  const second = typeof fallback === 'function' ? fallback() : fallback;
  if (typeof second === 'number' && Number.isFinite(second)) {
    return { maxRgb: second, source: 'fallback' };
  }
  return { maxRgb: null, source: 'none' };
}

/**
 * Where a black render's *server-side* copy lives, and where to move it.
 *
 * `comfy.mjs` never writes a black frame into the repo — but by the time it can
 * look at the bytes, ComfyUI's own `SaveImage` has already written the PNG into
 * `D:/Tools/ComfyUI/output/pyrefly/`, which is the first folder the art-watch
 * gallery scans and the folder an operator pulls "the latest render" out of by
 * hand. Leaving it there is how a rejected frame gets promoted anyway.
 *
 * Pure so the destination naming is pinned by a test rather than by a live
 * ComfyUI. Returns `null` — do nothing — rather than guessing, when:
 *
 *   - there is no usable `filename`;
 *   - `type` is present and is not `output` (a `temp`/`input` image does not
 *     live under the output dir at all);
 *   - the `filename`/`subfolder` would resolve outside `outputDir`. ComfyUI
 *     generates these names itself, but this function decides what gets moved
 *     on disk and it is not going to take `../../` on trust.
 *
 * The destination flattens the subfolder into the name (`pyrefly/x_00001_.png`
 * -> `<stamp>__pyrefly__x_00001_.png`) so one flat quarantine folder holds
 * everything without collisions, matching what the 2026-09-18 sweep did by hand.
 *
 * @param {{filename?: string, subfolder?: string, type?: string}|null|undefined} image
 *        a `/history` output entry
 * @param {{outputDir: string, quarantineDir: string, stamp?: string}} opts
 * @returns {{from: string, to: string}|null}
 */
export function quarantineTargetFor(image, { outputDir, quarantineDir, stamp = '' } = {}) {
  if (!image || typeof image !== 'object') return null;
  if (!outputDir || !quarantineDir) return null;

  const filename = typeof image.filename === 'string' ? image.filename.trim() : '';
  if (!filename || filename === '.' || filename === '..') return null;
  if (/[\\/]/.test(filename)) return null;
  if (typeof image.type === 'string' && image.type && image.type !== 'output') return null;

  const subfolder = typeof image.subfolder === 'string' ? image.subfolder.trim() : '';
  const parts = subfolder.split(/[\\/]+/).filter((p) => p && p !== '.');
  if (parts.some((p) => p === '..')) return null;
  if (parts.some((p) => isAbsolute(p) || /^[A-Za-z]:/.test(p))) return null;

  const from = normalize(join(outputDir, ...parts, filename));
  // Belt and braces: after normalize, the result must still be inside outputDir.
  const rootKey = resolve(outputDir).toLowerCase();
  const fromKey = resolve(from).toLowerCase();
  if (fromKey !== rootKey && !fromKey.startsWith(rootKey.endsWith(sep) ? rootKey : rootKey + sep)) {
    return null;
  }

  const flat = [...parts, filename].join('__');
  const to = normalize(join(quarantineDir, stamp ? `${stamp}__${flat}` : flat));
  return { from, to };
}

/**
 * `2026-09-18T13:35:01.123Z` -> `20260918T133501Z`, for quarantine filenames.
 *
 * Colons are illegal in Windows filenames and the milliseconds add nothing an
 * operator scanning the folder wants to read.
 *
 * @param {Date|number|string} when
 * @returns {string}
 */
export function fileStamp(when = Date.now()) {
  const d = when instanceof Date ? when : new Date(when);
  const iso = Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

// --------------------------------------------------------------------------
// A PNG decoder, for the gallery only
// --------------------------------------------------------------------------

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Undo one scanline's filter in place. Returns false for an unknown filter. */
function unfilterRow(filterType, cur, prev, bpp) {
  const n = cur.length;
  switch (filterType) {
    case 0:
      return true;
    case 1:
      for (let i = bpp; i < n; i++) cur[i] = (cur[i] + cur[i - bpp]) & 0xff;
      return true;
    case 2:
      for (let i = 0; i < n; i++) cur[i] = (cur[i] + prev[i]) & 0xff;
      return true;
    case 3:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        cur[i] = (cur[i] + ((left + prev[i]) >> 1)) & 0xff;
      }
      return true;
    case 4:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        const upLeft = i >= bpp ? prev[i - bpp] : 0;
        cur[i] = (cur[i] + paeth(left, prev[i], upLeft)) & 0xff;
      }
      return true;
    default:
      return false;
  }
}

/** Bytes per pixel-ish stride unit, per PNG colour type, at bit depth 8. */
const CHANNELS_BY_COLOR_TYPE = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/**
 * Largest R, G or B sample in an 8-bit PNG, or `null` if it cannot be read.
 *
 * Alpha is skipped on purpose. A rembg cutout is mostly transparent and its
 * alpha channel says nothing about whether the *painting* came back black.
 *
 * Scope is deliberately narrow: 8-bit, non-interlaced, which is every PNG this
 * pipeline produces (ComfyUI's SaveImage, and `tools/gen/png.mjs`). Anything
 * else returns `null` — unknown, not black — rather than guessing.
 *
 * Bails out the moment it sees a 255, which is the common case for a healthy
 * render and makes the gallery's scan of a fresh painting a partial inflate
 * plus a few hundred bytes of scanning.
 *
 * @param {Buffer|Uint8Array} buf raw PNG bytes
 * @returns {number|null}
 */
export function maxRgbOfPng(buf) {
  const png = Buffer.isBuffer(buf) ? buf : buf ? Buffer.from(buf) : null;
  if (!png || png.length < 8) return null;
  if (png.readUInt32BE(0) !== 0x89504e47 || png.readUInt32BE(4) !== 0x0d0a1a0a) return null;

  let ihdr = null;
  let palette = null;
  const idat = [];
  let off = 8;
  while (off + 8 <= png.length) {
    const len = png.readUInt32BE(off);
    if (off + 12 + len > png.length) return null;
    const type = png.toString('latin1', off + 4, off + 8);
    const body = png.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      if (len < 13) return null;
      ihdr = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        color: body[9],
        compression: body[10],
        filter: body[11],
        interlace: body[12],
      };
    } else if (type === 'PLTE') palette = Buffer.from(body);
    else if (type === 'IDAT') idat.push(Buffer.from(body));
    else if (type === 'IEND') break;
    off += 12 + len;
  }

  if (!ihdr || !idat.length) return null;
  if (ihdr.depth !== 8 || ihdr.interlace !== 0 || ihdr.compression !== 0 || ihdr.filter !== 0) {
    return null;
  }
  if (!ihdr.width || !ihdr.height) return null;
  const channels = CHANNELS_BY_COLOR_TYPE[ihdr.color];
  if (!channels) return null;
  if (ihdr.color === 3 && (!palette || palette.length < 3)) return null;

  let raw;
  try {
    raw = inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }

  const stride = channels * ihdr.width;
  if (raw.length < (stride + 1) * ihdr.height) return null;

  const cur = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);
  let max = 0;
  let p = 0;
  for (let y = 0; y < ihdr.height; y++) {
    const filterType = raw[p++];
    raw.copy(cur, 0, p, p + stride);
    p += stride;
    if (!unfilterRow(filterType, cur, prev, channels)) return null;

    if (ihdr.color === 3) {
      for (let i = 0; i < stride; i++) {
        const base = cur[i] * 3;
        if (base + 2 < palette.length) {
          if (palette[base] > max) max = palette[base];
          if (palette[base + 1] > max) max = palette[base + 1];
          if (palette[base + 2] > max) max = palette[base + 2];
        }
      }
    } else if (ihdr.color === 6) {
      for (let i = 0; i < stride; i++) {
        if (i % 4 === 3) continue; // alpha
        if (cur[i] > max) max = cur[i];
      }
    } else if (ihdr.color === 4) {
      for (let i = 0; i < stride; i += 2) {
        if (cur[i] > max) max = cur[i];
      }
    } else {
      for (let i = 0; i < stride; i++) {
        if (cur[i] > max) max = cur[i];
      }
    }

    if (max === 255) return 255;
    cur.copy(prev);
  }
  return max;
}
