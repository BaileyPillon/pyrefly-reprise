// Continuity harness: the NAMED CLASSES of a pose swap, why the presenter asked for it, and the designed blend (T-02 of the motion-fluidity pass, lane L5; both games, critic plumbing).
//
// post-flicker named ONE class (`ready>idle>ready`, the attack triple) and it fell from 22 to 0 in Chapter IV. Its siblings stayed unnamed and hid among 400 swaps: ready>idle then idle>cast or item within a tenth of a
// second (37 more, 111 net ghost frames), hurt>idle>hurt strings, and the stance swaps that MF-05 has to price apart (is `idle>ready` the menu opening, the attack's wind-up, or the end of a turn?). This module is how
// every class the pass touches is a number a regression can move, not a number found by reading swaps one by one (CHK-027). It is REPORTED, never gated: no verdict reads it except the one switchable rule below.
//
// WHAT IT READS
//   - the swaps the analysis already made (figure, from, to, tMs, ghost frames and ms, counted, smear);
//   - `meta.swapLog` when the build has it (`window.__pyrefly.swapReasons()`, engine/motion/SwapLog.ts, lane L1; the probe reads it in the probe's clock): `reasons` (why the presenter asked for each painting: menu,
//     turn-start, wind-up, cast, item, attack, after-action) and `designed` (every blend the planner chose on purpose, with its class and length in ms). A build without the log gets the neighbours' reading
//     (the figure's next swap and the gap to it), tagged `source: 'neighbours'` so a reader knows which it was.
// THE DESIGNED BLEND (switchable, `continuity.classes.designedBlend` in the policy)
//   A blend the planner declared (an entry of `designed` for the same figure and the same pair, with the swap's flip inside its window) is a DESIGNED blend, reported apart from an undesigned dissolve, as a planned
//   cut is reported apart from a snap (continuity-smear.mjs). `report` (on) adds the tally; `excuse` (OFF) additionally takes a designed blend out of `ghostOverFail`, so a deliberate 50 ms
//   three-frame blend does not fail CHK-027 on paper where a two-frame one would (25 of 39 cuts reach 0.40). WHAT IS EXCUSED (review M3: a first version excused severities up to 0.30 and the fail line is 0.40, so it
//   excused nothing the verdict reads): a blend the planner declared of at most `maxMs` (100) whose observed double image lasts no longer than the declared length plus two frames and slack (a blend that runs on
//   longer than it was designed to is a defect and stays counted), and, only if the policy lowers it from its default of 1, of at most `maxSeverity`. Turning `excuse` on is a policy decision; the default changes no verdict.
// Pure: plain objects in, plain objects out. Game case: both (shared critic plumbing); the FFX-2-only readings (ready, the interlude) simply find nothing in an FFX recording.

/** engine/motion/SwapLog.ts keeps this many entries per list and drops the oldest: a list this long has lost the start of the fight (review m14). */
export const SWAP_LOG_CAP = 600;
export const CLASS_DEFAULTS = Object.freeze({ interludeMs: 150, hurtStringMs: 600, windUpMs: 600, whyWindowMs: 400, slackMs: 12, designedBlend: Object.freeze({ report: true, excuse: false, maxMs: 100, maxSeverity: 1 }) });

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (x) => (num(x) ? Math.round(x * 10) / 10 : null);
const r3 = (x) => (num(x) ? Math.round(x * 1000) / 1000 : null);
const sum = (a) => a.reduce((s, x) => s + x, 0);

/** The policy's `continuity.classes` block over the defaults. */
export function classPolicy(cfg) {
  const p = cfg && cfg.classes && typeof cfg.classes === 'object' ? cfg.classes : {};
  const d = p.designedBlend && typeof p.designedBlend === 'object' ? p.designedBlend : {};
  const pos = (v, dflt) => (num(v) && v > 0 ? v : dflt);
  return {
    interludeMs: pos(p.interludeMs, CLASS_DEFAULTS.interludeMs), hurtStringMs: pos(p.hurtStringMs, CLASS_DEFAULTS.hurtStringMs), windUpMs: pos(p.windUpMs, CLASS_DEFAULTS.windUpMs),
    whyWindowMs: pos(p.whyWindowMs, CLASS_DEFAULTS.whyWindowMs), slackMs: pos(p.slackMs, CLASS_DEFAULTS.slackMs),
    designedBlend: { report: d.report !== false, excuse: d.excuse === true, maxMs: pos(d.maxMs, CLASS_DEFAULTS.designedBlend.maxMs), maxSeverity: pos(d.maxSeverity, CLASS_DEFAULTS.designedBlend.maxSeverity) },
  };
}

/** The class of one swap: what the player is watching happen (the swaps audit's names, the player's words first, so every table is comparable with the plan's). */
export function swapClass(w) {
  const f = w.fromPose, t = w.toPose;
  if (w.rig) return 'RIG key flip (boss)';
  if (/^od|^special|^overdrive|^summon/.test(t) || /^od-/.test(f)) return 'Overdrive / special (to or from)';
  if (t === 'victory') return 'Victory pose';
  if (t === 'ko' || t === 'dead') return 'KO (down)';
  if (f === 'ko' || f === 'dead') return 'Revive (up)';
  if (t === 'critical') return 'Critical (to low-HP stance)';
  if (f === 'critical') return 'Critical (out of low-HP stance)';
  if (t === 'hurt') return 'Hurt (hit lands)';
  if (f === 'hurt') return 'Hurt recovery';
  if (t === 'ready' && f === 'idle') return 'Stance up (idle to ready)';
  if (f === 'ready' && t === 'idle') return 'Stance down (ready to idle)';
  if (t === 'ready') return 'Back to ready after an action (cast/item/OD)';
  if (f === 'ready' && t === 'attack') return 'Run-in strike (ready to attack)';
  if (f === 'idle' && t === 'attack') return 'Strike from idle (no ready)';
  if (f === 'attack' && t === 'follow') return 'Strike follow-through (attack to follow)';
  if ((f === 'follow' || f === 'attack') && t === 'idle') return 'Return home (follow to idle)';
  if (t === 'cast' && f === 'ready') return 'Cast begins (ready to cast)';
  if (t === 'cast') return 'Cast begins (idle to cast)';
  if (f === 'cast' && t === 'idle') return 'Cast ends (cast to idle)';
  if (f === 'ready' && t === 'item') return 'Item begins (ready to item)';
  if (t === 'item') return 'Item begins (idle to item)';
  if (f === 'item') return 'Item ends (item to idle)';
  if (t === 'telegraph' || f === 'telegraph') return 'Telegraph (foe)';
  if (t === 'attack' || t === 'cast') return 'Foe action begins';
  if (f === 'attack' || f === 'cast') return 'Foe action ends';
  return `other ${f}>${t}`;
}

/** Each figure's swaps oldest first with their neighbours and the gaps to them (a swap not showing is left out). Mutates nothing. */
export function neighbours(swaps) {
  const by = new Map();
  for (const w of swaps) {
    if (w.notShowing) continue;
    if (!by.has(w.figure)) by.set(w.figure, []);
    by.get(w.figure).push(w);
  }
  const out = new Map();
  for (const list of by.values()) {
    list.sort((a, b) => a.tMs - b.tMs);
    list.forEach((w, i) => out.set(w, { prev: list[i - 1] ?? null, next: list[i + 1] ?? null, prevGapMs: i ? w.tMs - list[i - 1].tMs : null, nextGapMs: i + 1 < list.length ? list[i + 1].tMs - w.tMs : null }));
  }
  return out;
}

/**
 * Tag every swap with WHY the presenter asked for its painting, from the log (`why: { reason, ageMs, source: 'log' }`): the latest reason of the same figure for the same pose (or the painting it drew)
 * asked at most `whyWindowMs` before the flip (and at most a frame after it: the clocks are the probe's). Returns how many swaps got a reason.
 * @param {Array} swaps
 * @param {Array<{at: number, actor: string, pose: string, paint?: string, reason: string}>|null|undefined} reasons
 */
export function tagWhy(swaps, reasons, policy = CLASS_DEFAULTS) {
  if (!Array.isArray(reasons) || !reasons.length) return 0;
  let tagged = 0;
  for (const w of swaps) {
    if (w.notShowing) continue;
    let best = null;
    for (const r of reasons) {
      if (r.actor !== w.figure || !num(r.at)) continue;
      if (r.pose !== w.toPose && r.paint !== w.toPose) continue;
      const age = w.tMs - r.at;
      if (age < -policy.slackMs - 17 || age > policy.whyWindowMs) continue;
      if (!best || r.at > best.at) best = r;
    }
    if (best) { w.why = { reason: best.reason, ageMs: r1(w.tMs - best.at), source: 'log' }; tagged++; }
  }
  return tagged;
}

/**
 * The stance reading of MF-05 for one swap. For a change INTO `ready` (stance up): `menu` (the command menu opened on whatever she showed), `wind-up` (the painting is the strike's own wind-up), or
 * `after-action` (back to ready after an action). For `ready>idle` (stance down): `turn-start` (the drop before her action) or `after-action`. From the log's reason when the swap has one; otherwise from the
 * neighbours (a figure's own `ready>attack` within `windUpMs` after an `idle>ready` is its wind-up; an `idle>X` within the interlude window after a `ready>idle` is the turn start). Null for any other pair.
 */
export function stanceReading(w, nb, policy = CLASS_DEFAULTS) {
  const up = w.toPose === 'ready' && w.fromPose !== 'ready';
  const down = w.fromPose === 'ready' && w.toPose === 'idle';
  if (!up && !down) return null;
  const r = w.why?.reason;
  if (up && (r === 'menu' || r === 'wind-up' || r === 'after-action')) return { kind: 'up', reading: r, source: 'log' };
  if (down && (r === 'turn-start' || r === 'after-action')) return { kind: 'down', reading: r, source: 'log' };
  const n = nb.get(w);
  if (up) return { kind: 'up', reading: w.fromPose === 'idle' ? (n?.next && n.next.fromPose === 'ready' && n.next.toPose === 'attack' && n.nextGapMs <= policy.windUpMs ? 'wind-up' : 'menu') : 'after-action', source: 'neighbours' };
  return { kind: 'down', reading: n?.next && n.next.fromPose === 'idle' && n.nextGapMs <= policy.interludeMs ? 'turn-start' : 'after-action', source: 'neighbours' };
}

/**
 * Tag every interlude (`interlude: { n, role, gapMs, to }` on both swaps): `ready>idle` followed within `interludeMs` by `idle>X` of the same figure, X any painting (the attack triple is X = ready).
 * A swap belongs to at most one. Returns `[{ n, figure, to, gapMs, ids, ghostFrames, ghostMs, counted }]`.
 */
export function findInterludes(swaps, policy = CLASS_DEFAULTS, nb = neighbours(swaps)) {
  const used = new Set();
  const found = [];
  for (const a of [...nb.keys()].sort((x, y) => x.tMs - y.tMs)) {
    if (used.has(a) || a.fromPose !== 'ready' || a.toPose !== 'idle') continue;
    const b = nb.get(a).next;
    if (!b || used.has(b) || b.fromPose !== 'idle' || b.figure !== a.figure) continue;
    const gapMs = b.tMs - a.tMs;
    if (!(gapMs >= 0 && gapMs <= policy.interludeMs)) continue;
    used.add(a); used.add(b);
    const n = found.length + 1, gap = r1(gapMs);
    a.interlude = { n, role: 'out', gapMs: gap, to: b.toPose };
    b.interlude = { n, role: 'back', gapMs: gap, to: b.toPose };
    const g = (s, k) => (s.counted ? s.ghost?.[k] ?? 0 : 0);
    found.push({ n, figure: a.figure, to: b.toPose, gapMs: gap, ids: [a.id, b.id], ghostFrames: g(a, 'frames') + g(b, 'frames'), ghostMs: g(a, 'ms') + g(b, 'ms'), counted: Boolean(a.counted && b.counted) });
  }
  return found;
}

/** Tag every hurt string (`hurtString: { n, role, gapMs }`): `hurt>idle` then `idle>hurt` of the same figure within `hurtStringMs` (the figure goes back to the idle between two blows of one move and is struck again). */
export function findHurtStrings(swaps, policy = CLASS_DEFAULTS, nb = neighbours(swaps)) {
  const used = new Set();
  const found = [];
  for (const a of [...nb.keys()].sort((x, y) => x.tMs - y.tMs)) {
    if (used.has(a) || a.fromPose !== 'hurt' || a.toPose !== 'idle') continue;
    const b = nb.get(a).next;
    if (!b || used.has(b) || b.fromPose !== 'idle' || b.toPose !== 'hurt') continue;
    const gapMs = b.tMs - a.tMs;
    if (!(gapMs >= 0 && gapMs <= policy.hurtStringMs)) continue;
    used.add(a); used.add(b);
    const n = found.length + 1, gap = r1(gapMs);
    a.hurtString = { n, role: 'out', gapMs: gap }; b.hurtString = { n, role: 'back', gapMs: gap };
    const g = (s, k) => (s.counted ? s.ghost?.[k] ?? 0 : 0);
    found.push({ n, figure: a.figure, gapMs: gap, ids: [a.id, b.id], ghostFrames: g(a, 'frames') + g(b, 'frames'), ghostMs: g(a, 'ms') + g(b, 'ms'), counted: Boolean(a.counted && b.counted) });
  }
  return found;
}

/**
 * Tag the swaps that are DESIGNED blends (`designed: { cls, ms }`, and `designedExcused` when the policy excuses them): an entry of the planner's `designed` log for the same figure and the same pair whose window
 * (its start less slack and a frame, to its length plus slack and two frames) holds the swap's flip. One entry per swap. Returns the number matched.
 * @param {Array<{at: number, actor: string, from: string, to: string, cls: string, ms: number}>|null|undefined} designed
 */
export function tagDesigned(swaps, designed, policy = CLASS_DEFAULTS, frameMs = 1000 / 60) {
  if (!Array.isArray(designed) || !designed.length) return 0;
  const used = new Set();
  let n = 0;
  for (const w of swaps) {
    if (w.notShowing || !num(w.tMs)) continue;
    for (let i = 0; i < designed.length; i++) {
      const e = designed[i];
      if (used.has(i) || e.actor !== w.figure || e.from !== w.fromPose || e.to !== w.toPose || !num(e.at) || !num(e.ms)) continue;
      if (w.tMs < e.at - policy.slackMs - frameMs || w.tMs > e.at + e.ms + policy.slackMs + 2 * frameMs) continue;
      used.add(i);
      w.designed = { cls: e.cls ?? null, ms: e.ms };
      const db = policy.designedBlend;
      if (db.excuse && w.counted && num(w.ghost?.severity) && e.ms <= db.maxMs && w.ghost.severity <= db.maxSeverity && (!num(w.ghost.ms) || w.ghost.ms <= e.ms + 2 * frameMs + policy.slackMs)) w.designedExcused = true;
      n++;
      break;
    }
  }
  return n;
}

/** One group of counted swaps summed (the numbers every table of the pass carries). */
export function groupStats(sel, minutes) {
  const ghosts = sel.filter((w) => w.ghost && w.ghost.frames > 0);
  const gf = sum(sel.map((w) => w.ghost?.frames ?? 0)), gms = sum(sel.map((w) => w.ghost?.ms ?? 0));
  const per = (v, d = 1) => (minutes > 0 ? (Math.round((v / minutes) * 10 ** d) / 10 ** d) : null);
  return { swaps: sel.length, perMinute: per(sel.length, 2), ghostFrames: gf, ghostMs: Math.round(gms), ghostMsPerMinute: per(gms, 0), ghostFramesPerMinute: per(gf), severityMax: r3(ghosts.reduce((m, w) => Math.max(m, w.ghost.severity), 0)) };
}

const medianOf = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);

/**
 * The tags the SUMMARY depends on, put on the swaps BEFORE it is made: why the presenter asked (the stance reading uses it) and which swaps are designed blends (an excused one leaves `ghostOverFail`).
 * @returns {{policy: object, whyTagged: number, designedN: number}}
 */
export function prepareClasses(swaps, swapLog, cfg) {
  const policy = classPolicy(cfg);
  return { policy, whyTagged: tagWhy(swaps, swapLog?.reasons, policy), designedN: policy.designedBlend.report ? tagDesigned(swaps, swapLog?.designed, policy) : 0 };
}

/**
 * Build the `summary.classes` block (after `prepareClasses` and the summary; tags the interludes and hurt strings in place).
 * @param {Array} swaps  the analysed swaps
 * @param {{battleSeconds: number, totalGhostFrames: number, prepared: ReturnType<typeof prepareClasses>, swapLog?: {reasons?: Array, designed?: Array}|null}} o
 */
export function classReport(swaps, { battleSeconds, totalGhostFrames, prepared, swapLog = null }) {
  const { policy, whyTagged, designedN } = prepared;
  const minutes = battleSeconds / 60;
  const nb = neighbours(swaps);
  const interludes = findInterludes(swaps, policy, nb);
  const hurt = findHurtStrings(swaps, policy, nb);
  const counted = swaps.filter((w) => w.counted);
  const classes = {};
  for (const w of counted) (classes[swapClass(w)] ??= []).push(w);
  const byClass = Object.entries(classes).map(([cls, sel]) => ({ cls, ...groupStats(sel, minutes), planned: sel.filter((w) => w.smear).length, designed: sel.filter((w) => w.designed).length })).sort((a, b) => b.ghostMs - a.ghostMs || b.swaps - a.swaps);
  const stance = { up: {}, down: {} };
  const sources = new Set();
  const readings = new Map();
  for (const w of swaps) { const s = stanceReading(w, nb, policy); if (s) readings.set(w, s); }
  for (const [w, s] of readings) { if (!w.counted) continue; sources.add(s.source); (stance[s.kind][s.reading] ??= []).push(w); }
  const stanceOut = Object.fromEntries(Object.entries(stance).map(([k, groups]) => [k, Object.fromEntries(Object.entries(groups).map(([reading, sel]) => [reading, groupStats(sel, minutes)]))]));
  const sumGroup = (list) => ({ ghostFrames: sum(list.map((f) => f.ghostFrames)), ghostMs: Math.round(sum(list.map((f) => f.ghostMs))) });
  const ig = sumGroup(interludes), hg = sumGroup(hurt);
  const byTo = {};
  for (const f of interludes) byTo[f.to] = (byTo[f.to] ?? 0) + 1;
  const desSel = counted.filter((w) => w.designed);
  const des = groupStats(desSel, minutes);
  const allMs = sum(counted.map((w) => w.ghost?.ms ?? 0));
  return {
    windowMs: { interlude: policy.interludeMs, hurtString: policy.hurtStringMs, windUp: policy.windUpMs, why: policy.whyWindowMs },
    source: { why: whyTagged ? 'log' : sources.has('neighbours') ? 'neighbours' : 'none', whyTagged, designed: designedN ? 'log' : 'none', logCapped: { reasons: (swapLog?.reasons?.length ?? 0) >= SWAP_LOG_CAP, designed: (swapLog?.designed?.length ?? 0) >= SWAP_LOG_CAP } },
    byClass,
    stance: { source: sources.size === 1 ? [...sources][0] : sources.size ? 'mixed' : 'none', ...stanceOut },
    interludes: { count: interludes.length, perMinute: minutes > 0 ? r1(interludes.length / minutes) : null, countedPairs: interludes.filter((f) => f.counted).length, ...ig, ghostMsPerMinute: minutes > 0 ? Math.round(ig.ghostMs / minutes) : null, ghostFramesPerMinute: minutes > 0 ? r1(ig.ghostFrames / minutes) : null, ghostShare: totalGhostFrames > 0 ? r3(ig.ghostFrames / totalGhostFrames) : 0, byTo, medianGapMs: medianOf(interludes.map((f) => f.gapMs)) },
    hurtStrings: { count: hurt.length, perMinute: minutes > 0 ? r1(hurt.length / minutes) : null, ...hg, ghostMsPerMinute: minutes > 0 ? Math.round(hg.ghostMs / minutes) : null, medianGapMs: medianOf(hurt.map((f) => f.gapMs)) },
    designedBlend: { ...policy.designedBlend, logged: Array.isArray(swapLog?.designed) ? swapLog.designed.length : 0, matched: designedN, ...des, excused: desSel.filter((w) => w.designedExcused).length, undesignedGhostMsPerMinute: minutes > 0 ? Math.round((allMs - sum(desSel.map((w) => w.ghost?.ms ?? 0))) / minutes) : null },
  };
}
