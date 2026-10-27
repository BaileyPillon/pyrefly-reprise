// The pure parts of the A/B clip factory (T-04 of the motion-fluidity pass, lane L5; both games, critic plumbing).
//
// A look variant of the pass is an address word on ONE candidate build whose default is today. Bailey judges motion by watching it (hard rule 9, "rigs are judged in motion"), so every B item is filmed as a phone
// card: the same moment, seed 1, the same real key presses, variants stacked A over B in a BLIND order (the key is stored in KEY.json, the panels carry only a letter). tools/ab-clip.mjs captures the variants
// on a virtual clock and tools/measure/ab-compose.mjs puts the card together; this module is what they decide with: the blind order, the crop, the window, the speed trace, the strip, the encoder budget,
// the file names. No browser, no ffmpeg, no files.

/** The phone card's geometry: each panel 720 x 405 (16:9), two stacked 720 x 810; the crop is at least 960 x 540 of a 2560 x 1440 capture (scaled with the viewport). */
export const PANEL = Object.freeze({ w: 720, h: 405 });
export const CARD = Object.freeze({ w: 720, h: 810 });
export const STILL_W = 1080;
export const BUDGET = Object.freeze({ maxBytes: 8 * 1024 * 1024, maxSeconds: 8, crf: 20, crfStep: 3, crfMax: 32 });
export const LETTERS = 'ABCDEFGH';

/** A small seeded generator (mulberry32), so a rebuild of a card keeps its blind order. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A stable numeric seed from a string. */
export const seedOf = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/**
 * The blind order of a card's variants: a seeded shuffle, the letters handed out in that order. The key (letter to variant) goes to KEY.json and the README, never into the picture.
 * @param {Array<{id: string, name?: string}>} variants
 * @param {string|number} seed a card id or a number
 * @returns {{order: Array<{letter: string, id: string, name?: string}>, key: Record<string, {id: string, name?: string}>}}
 */
export function blindOrder(variants, seed) {
  const rnd = seeded(typeof seed === 'number' ? seed : seedOf(seed));
  const shuffled = variants.map((v) => ({ v, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.v);
  const order = shuffled.map((v, i) => ({ letter: LETTERS[i] ?? String(i), ...v }));
  return { order, key: Object.fromEntries(order.map((o) => [o.letter, { id: o.id, ...(o.name ? { name: o.name } : {}) }])) };
}

/**
 * The 16:9 crop of the capture that holds the action: the union of the tracked points (head, feet, in viewport px, over the window and over EVERY variant, so the panels show the same region) plus a margin,
 * widened to 16:9, never smaller than `minW` x `minH` (960 x 540 at 2560 wide, scaled with the viewport) and clamped inside the viewport.
 * @param {Array<{x: number, y: number}>} points
 * @param {{w: number, h: number}} viewport
 * @param {{margin?: number, minW?: number, minH?: number}} [o] `margin` is a share of the box (0.2)
 * @returns {{x: number, y: number, w: number, h: number}}
 */
export function cropRegion(points, viewport, { margin = 0.2, minW = Math.round((960 / 2560) * viewport.w), minH = Math.round((540 / 1440) * viewport.h) } = {}) {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!pts.length) return { x: 0, y: 0, w: viewport.w, h: viewport.h };
  let x0 = Math.min(...pts.map((p) => p.x)), x1 = Math.max(...pts.map((p) => p.x));
  let y0 = Math.min(...pts.map((p) => p.y)), y1 = Math.max(...pts.map((p) => p.y));
  const mx = (x1 - x0) * margin, my = (y1 - y0) * margin;
  x0 -= mx; x1 += mx; y0 -= my; y1 += my;
  let w = Math.max(x1 - x0, minW), h = Math.max(y1 - y0, minH);
  if (w / h < 16 / 9) w = (h * 16) / 9; else h = (w * 9) / 16;
  w = Math.min(w, viewport.w); h = Math.min(h, viewport.h);
  if (w / h > 16 / 9) w = (h * 16) / 9; else h = (w * 9) / 16;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const x = Math.max(0, Math.min(viewport.w - w, cx - w / 2)), y = Math.max(0, Math.min(viewport.h - h, cy - h / 2));
  const even = (v) => Math.floor(v / 2) * 2;
  return { x: even(x), y: even(y), w: even(w), h: even(h) };
}

/** The tracked points of the focus actors over frames `[i0, i1]` of a recording: head and feet in viewport px (`hx hy fx fy`). */
export function trackPoints(frames, focus, i0, i1) {
  const out = [];
  for (let i = Math.max(0, i0); i <= Math.min(frames.length - 1, i1); i++) {
    for (const id of focus) {
      const a = frames[i]?.actors?.[id];
      if (!a) continue;
      if (Number.isFinite(a.hx) && Number.isFinite(a.hy)) out.push({ x: a.hx, y: a.hy });
      if (Number.isFinite(a.fx) && Number.isFinite(a.fy)) out.push({ x: a.fx, y: a.fy });
    }
  }
  return out;
}

/**
 * Is the presenter ACTING in this recorded frame (an action is playing, no command menu waiting)? The first real-game card showed that `playing` alone cannot say: in the booth build the presenter's `playing`
 * stays true while the next command menu is open (frame after frame of `menu: true, playing: true`), so "the action is over" never fired and every moment ran to its 14 s timeout. The phase says it: `play:*`
 * while an action or a turn start plays, `command:*` at a menu. A build with no phase falls back to `playing && !menu`.
 * @param {{phase?: string|null, playing?: boolean, menu?: boolean}} f a frame of the stepped recording (tools/measure/channels.mjs)
 */
export function isActing(f) {
  if (!f) return false;
  if (typeof f.phase === 'string' && f.phase) return f.phase.startsWith('play');
  return Boolean(f.playing) && !f.menu;
}

/**
 * The frame (index) of a VISUAL beat of one figure: the nth time its hit shake starts (`kind: 'shake'`: the contact of a blow on that figure) or the nth time its pose changes (`kind: 'pose'`, to `pose` when
 * given). The first real card showed why the log is not enough: in FFX the engine logs `damage` in the same instant as `action-start` (the key press), so an event anchor is the start, not the contact.
 * @param {Array<{actors?: Record<string, {shL?: number, pose?: string|null}>}>} frames
 * @param {{actor: string, kind: 'shake'|'pose', pose?: string, ordinal?: number}} want
 * @param {number} [from] the frame to start looking at
 * @returns {number} -1 when there is no such beat
 */
export function findBeatFrame(frames, want, from = 0) {
  if (!want?.actor || !['shake', 'pose'].includes(want.kind)) return -1;
  const nth = want.ordinal ?? 1;
  let seen = 0, prevOn = null, prevPose;
  for (let i = Math.max(0, from); i < frames.length; i++) {
    const a = frames[i]?.actors?.[want.actor];
    if (!a) continue;
    let hit = false;
    if (want.kind === 'shake') { const on = (a.shL ?? 0) > 0; hit = on && prevOn === false; prevOn = on; }
    else { hit = prevPose !== undefined && a.pose !== prevPose && (!want.pose || a.pose === want.pose); prevPose = a.pose; }
    if (hit && ++seen === nth) return i;
  }
  return -1;
}

/**
 * The nth log event (1-based `ordinal`, default 1) of a type, optionally about one figure (`who` matches the event's target, actor or source). The factory cuts by these, never by wall time.
 * @param {Array<{type: string, vt?: number, targetId?: string|null, actorId?: string|null, sourceId?: string|null}>} events
 * @param {{event?: string, type?: string, who?: string|null, ordinal?: number}} want `event` (or `type`) is the log event's type, e.g. "ko", "damage", "summon"
 */
export function findEvent(events, want) {
  const type = want?.event ?? want?.type;
  if (!type) return null;
  const hits = (events ?? []).filter((e) => e.type === type && (!want.who || e.targetId === want.who || e.actorId === want.who || e.sourceId === want.who));
  return hits[(want.ordinal ?? 1) - 1] ?? null;
}

/**
 * The window of a moment in a recording, by battle-log EVENT, never by wall time: from `lead` ms before the moment's start (the menu confirm, `t0`) to `settle` ms after the presenter finished the action
 * (the last frame it was playing, or the last log event of the action if it never reported playing), capped at `maxMs`. Frames carry `vt` (virtual ms).
 * `around` centres the window on a log event instead (`{ event, who, ordinal, beforeMs, afterMs }`: from `beforeMs` before it to `afterMs` after), for a moment that comes turns after the first key (the last blow
 * of a boss, a knock-out): the window is then the same length in every variant whatever the turns before it took. An event that never happened falls back to the plain window.
 * @param {{around?: {event: string, who?: string|null, ordinal?: number, beforeMs?: number, afterMs?: number}|null}} [o]
 * @returns {{i0: number, i1: number, startMs: number, endMs: number, lengthMs: number, truncated: boolean}|null}
 */
export function windowOf(frames, events, { t0, leadMs = 500, settleMs = 1000, maxMs = 8000, around = null } = {}) {
  if (!frames.length) return null;
  const hit = around ? findEvent(events, around) : null;
  if (hit && Number.isFinite(hit.vt)) {
    const startMs = hit.vt - (around.beforeMs ?? 1500), endMs = hit.vt + (around.afterMs ?? 1000);
    const i0 = Math.max(0, frames.findIndex((f) => f.vt >= startMs));
    let i1 = frames.length - 1;
    for (let i = i0; i < frames.length; i++) if (frames[i].vt > endMs) { i1 = i - 1; break; }
    return { i0, i1: Math.max(i0, i1), startMs, endMs, lengthMs: endMs - startMs, truncated: false, around: true };
  }
  const start = t0 - leadMs;
  let lastPlaying = -1;
  for (let i = 0; i < frames.length; i++) if (frames[i].vt >= t0 && isActing(frames[i])) lastPlaying = i;
  let endMs = lastPlaying >= 0 ? frames[lastPlaying].vt : t0;
  for (const e of events ?? []) if (e.vt >= t0 && e.vt > endMs && lastPlaying < 0) endMs = e.vt;
  endMs += settleMs;
  let truncated = false;
  if (endMs - start > maxMs) { endMs = start + maxMs; truncated = true; }
  const i0 = Math.max(0, frames.findIndex((f) => f.vt >= start));
  let i1 = frames.length - 1;
  for (let i = i0; i < frames.length; i++) if (frames[i].vt > endMs) { i1 = i - 1; break; }
  return { i0, i1: Math.max(i0, i1), startMs: start, endMs, lengthMs: endMs - start, truncated };
}

/**
 * A speed trace in px per 60 Hz frame, from one actor's tracked point: the position channel the curves lane's atlas used (world x and y times `pxPerUnit` times the viewport's scale to 2560), so two variants'
 * curves are drawn on one scale. Samples are `{t, v}`: t in ms from the window's start, v the speed over the step that ended there.
 */
export function speedTrace(frames, actorId, i0, i1, { pxPerUnit = 146, scale = 1 } = {}) {
  const out = [];
  let prev = null;
  for (let i = i0; i <= i1; i++) {
    const a = frames[i]?.actors?.[actorId];
    if (!a) { prev = null; continue; }
    const p = { t: frames[i].vt, x: ((a.gx ?? 0) + (a.ox ?? 0)) * pxPerUnit * scale, y: ((a.gy ?? 0) + (a.oy ?? 0)) * pxPerUnit * scale };
    if (prev && p.t > prev.t) out.push({ t: p.t - frames[i0].vt, v: (Math.hypot(p.x - prev.x, p.y - prev.y) / (p.t - prev.t)) * (1000 / 60), vx: ((p.x - prev.x) / (p.t - prev.t)) * (1000 / 60) });
    prev = p;
  }
  return out;
}

/** Which `count` frame indexes (of `n`, evenly spread, first and last included) make the strip. */
export function stripIndexes(n, count = 12) {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  return Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1)));
}

/** The address of a variant: the card's base query and the variant's own words joined with one `?` and `&`s (`?coach=off` + `&hit=ramp`; a base with nothing in it lets the variant's start the query). */
export function joinQuery(base = '', own = '') {
  const parts = [base, own].map((s) => String(s).replace(/^[?&]+/, '')).filter(Boolean);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** What is wrong with a card's spec (an empty list: nothing). The factory refuses a spec it cannot film the same way twice. */
export function checkSpec(spec) {
  const bad = [];
  if (!spec || typeof spec !== 'object') return ['the spec is not an object'];
  for (const k of ['id', 'chapter', 'move']) if (typeof spec[k] !== 'string' || !spec[k]) bad.push(`"${k}" is missing`);
  if (!/^[A-Za-z0-9._-]+$/.test(String(spec.id ?? ''))) bad.push('"id" may hold letters, digits, dot, dash and underscore only (it names a folder)');
  if (!Array.isArray(spec.variants) || spec.variants.length < 2) bad.push('a card needs at least two variants');
  else {
    const ids = spec.variants.map((v) => v && v.id);
    if (ids.some((i) => typeof i !== 'string' || !i)) bad.push('every variant needs an "id"');
    if (new Set(ids).size !== ids.length) bad.push('variant ids must be distinct');
    if (spec.variants.length > LETTERS.length) bad.push(`at most ${LETTERS.length} variants`);
  }
  const rates = spec.rates ?? [60];
  if (!Array.isArray(rates) || !rates.length || rates.some((r) => !(r >= 30 && r <= 240))) bad.push('"rates" is a list of capture rates between 30 and 240 Hz');
  if (spec.keys !== undefined && !(Array.isArray(spec.keys) && spec.keys.length && spec.keys.every((k) => typeof k === 'string' || (k && typeof k.key === 'string' && (k.afterMs === undefined || (k.afterMs >= 0 && k.afterMs <= 10000)))))) bad.push('"keys" is a list of key names, or { "key": name, "afterMs": 0 to 10000 } (the wait after that key)');
  if (spec.holdMenuMs !== undefined && !(spec.holdMenuMs >= 0 && spec.holdMenuMs <= 15000)) bad.push('"holdMenuMs" is 0 to 15000 (how long the first command menu stays open before the first key)');
  if (spec.turns !== undefined && !(Number.isInteger(spec.turns) && spec.turns >= 1 && spec.turns <= 12)) bad.push('"turns" is a whole number from 1 to 12 (how many times the keys are pressed, one per command menu)');
  if (spec.seconds !== undefined && !(spec.seconds > 0 && spec.seconds <= 90)) bad.push('"seconds" is the longest the play may run, 1 to 90 s of virtual time');
  if (spec.until !== undefined && !(spec.until && typeof spec.until.event === 'string' && spec.until.event)) bad.push('"until" is { "event": a battle-log event type (ko, damage, summon, ...), "who"?: a figure id, "ordinal"?: 1, "afterMs"?: 1000 }: play on until it has happened');
  if (spec.window !== undefined && !(spec.window && typeof spec.window.event === 'string' && spec.window.event)) bad.push('"window" is { "event", "who"?, "ordinal"?, "beforeMs"?, "afterMs"? }: the clip is cut around that log event');
  if (spec.setup !== undefined) {
    const okStep = (s) => s && ((s.hp && typeof s.hp.who === 'string' && (Number.isFinite(s.hp.set) || (s.hp.fraction > 0 && s.hp.fraction <= 1))) || (typeof s.eval === 'string' && s.eval));
    if (!(Array.isArray(spec.setup) && spec.setup.every(okStep))) bad.push('"setup" is a list of { "hp": { "who": "party" | "enemy" | a figure id, "set": n | "fraction": 0 to 1 } } or { "eval": "a debug-API expression" } steps, run once the first command menu is open');
  }
  const beatOk = (b) => Boolean(b && typeof b.actor === 'string' && b.actor && ['shake', 'pose'].includes(b.kind));
  if (spec.align !== undefined && !(spec.align && (spec.align.kind === 'start' || (spec.align.kind === 'event' && spec.align.type) || (spec.align.kind === 'beat' && beatOk(spec.align.beat))))) bad.push('"align" is { "kind": "start" } | { "kind": "event", "type", "actor"?, "ordinal"? } | { "kind": "beat", "beat": { "actor", "kind": "shake"|"pose", "pose"?, "ordinal"? } }');
  if (spec.strip !== undefined && spec.strip.beat !== undefined && !beatOk(spec.strip.beat)) bad.push('"strip.beat" is { "actor": a figure id, "kind": "shake" | "pose", "pose"?: a pose name, "ordinal"?: 1 }: the strip is built around that visual beat (the first blow on a figure: its shake starting)');
  if (spec.crop !== undefined && !(spec.crop && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(spec.crop[k])) && spec.crop.w > 0 && spec.crop.h > 0)) bad.push('"crop" is { x, y, w, h } in viewport pixels (a HUD region instead of the figures)');
  if (spec.focus !== undefined && !(Array.isArray(spec.focus) && spec.focus.length)) bad.push('"focus" is a non-empty list of actor ids');
  return bad;
}

/** `AB-<chapter>-<move>-<hz>[-slow4x]` + extension, the core lane's naming (`AB-ch4-attack-120-slow4x.mp4`). */
export function clipName({ chapter, move, hz, slow = false, ext = 'mp4' }) {
  return `AB-${chapter}-${move}-${hz}${slow ? '-slow4x' : ''}.${ext}`;
}

/** The next CRF to try when a clip is over budget (null when there is none left): +3 up to 32. */
export function nextCrf(crf, bytes, budget = BUDGET) {
  if (bytes <= budget.maxBytes) return null;
  const next = crf + budget.crfStep;
  return next > budget.crfMax ? null : next;
}

/** Playback frames per second of the real-time clip (the capture's own rate, capped at 60: a phone cannot show more) and of the quarter-speed copy (a quarter of the capture rate, 30 at 120 Hz). */
export function clipFps(hz, slow = false) {
  return slow ? hz / 4 : Math.min(60, hz);
}

/** The index of the frame whose virtual time `vt` is nearest `t` (frames are in time order; binary search). A real-time clip of a capture faster than 60 Hz picks its frames by TIME with this, so 144 Hz plays at true speed (2, 3, 2, 2, 3 ... captured frames apart) instead of 20 percent fast. */
export function nearestFrame(frames, t) {
  let lo = 0, hi = frames.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (frames[mid].vt < t) lo = mid + 1; else hi = mid; }
  return lo > 0 && Math.abs(frames[lo - 1].vt - t) <= Math.abs(frames[lo].vt - t) ? lo - 1 : lo;
}
