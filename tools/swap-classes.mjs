#!/usr/bin/env node
// The swap classes of the motion-fluidity pass, read off a continuity run (lane L1; MF-01, MF-05, MF-06; both games; reads JSON only, no browser).
//
//   node tools/swap-classes.mjs <continuity.json> [<continuity.json> ...]        one class table per run
//   node tools/swap-classes.mjs --compare <before.json> <after.json>             the classes side by side, ghost frames and ghost ms a minute
//   node tools/swap-classes.mjs --price <continuity.json>                        what MF-05's stance forms would remove (the plan's "price V1a against V1b first")
//
// It is a READER of what the pinned harness (critic/runner/lib/continuity.mjs, stamped by tools/continuity-id.mjs) wrote: it adds no field to the harness and changes none of its numbers. The
// classes are the swaps audit's (D:/Tools/pyrefly-scratch/2026-10-26/fluidity/swaps/lib.mjs), the player's words first, so every table is comparable with the plan's. Two readings are new:
//   - the INTERLUDE (MF-01): a figure that goes `ready>idle` and, within `windowMs` (150 ms), `idle>X` for any X. post-flicker names the attack triple `ready>idle>ready`; the interlude is the whole family
//     (the cast and the item as well), the root fix MF-01 finishes. Reported, not gated.
//   - the STANCE split (MF-05): `idle>ready` is the MENU opening (alone, then the attack or the cast comes seconds later) or the WIND-UP (the swap sits right before the figure's own `ready>attack`);
//     `ready>idle` is the TURN START dropping her or the AFTER-ACTION idle. The harness cannot tell them from the pair alone, so they are read from the neighbours.
// Game case: both (shared critic plumbing); FFX Chapter I and FFX-2 Chapter IV are the chapters measured.
import fs from 'node:fs';

export const INTERLUDE_MS = 150;

const r1 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 10) / 10);
const r3 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
const sum = (a) => a.reduce((s, x) => s + x, 0);
const pct = (arr, p) => {
  const a = arr.filter((x) => x !== null && x !== undefined && Number.isFinite(x)).sort((x, y) => x - y);
  return a.length ? a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] : null;
};

/** The class of one swap: what the player is watching happen (the audit's names). */
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

/** Group the swaps by figure, oldest first, with each swap's neighbours (`prev`, `next`) and the gaps to them. Mutates nothing. */
function neighbours(swaps) {
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
 * Tag every interlude: `ready>idle` followed within `windowMs` by `idle>X`, X any painting. Returns `[{ figure, to, gapMs, ids, ghostFrames, counted }]` (a swap belongs to at most one).
 * @param {Array} swaps  continuity.json `swaps`
 */
export function findInterludes(swaps, windowMs = INTERLUDE_MS) {
  const nb = neighbours(swaps);
  const used = new Set();
  const found = [];
  for (const a of [...nb.keys()].sort((x, y) => x.tMs - y.tMs)) {
    if (used.has(a) || a.fromPose !== 'ready' || a.toPose !== 'idle') continue;
    const b = nb.get(a).next;
    if (!b || used.has(b) || b.fromPose !== 'idle' || b.figure !== a.figure) continue;
    const gapMs = b.tMs - a.tMs;
    if (!(gapMs >= 0 && gapMs <= windowMs)) continue;
    used.add(a);
    used.add(b);
    found.push({ figure: a.figure, to: b.toPose, gapMs: Math.round(gapMs * 10) / 10, ids: [a.id, b.id], ghostFrames: (a.counted ? a.ghost?.frames ?? 0 : 0) + (b.counted ? b.ghost?.frames ?? 0 : 0), counted: Boolean(a.counted && b.counted) });
  }
  return found;
}

/** The interlude summary: how many, how many see-through frames, a minute, by what the figure went to. */
export function interludeSummary(found, { battleSeconds, totalGhostFrames }) {
  const minutes = battleSeconds / 60;
  const frames = sum(found.map((f) => f.ghostFrames));
  const by = {};
  for (const f of found) by[f.to] = (by[f.to] ?? 0) + 1;
  return { count: found.length, perMinute: r1(found.length / minutes), ghostFrames: frames, ghostFramesPerMinute: r1(frames / minutes), ghostShare: totalGhostFrames > 0 ? r3(frames / totalGhostFrames) : 0, byTo: by, medianGapMs: found.length ? pct(found.map((f) => f.gapMs), 50) : null };
}

/**
 * The stance reading of MF-05 for one swap, from its neighbours: for `idle>ready`: `wind-up` when the figure's own `ready>attack` follows within `windUpMs` (the swap sits right before the strike), else `menu`;
 * for `ready>idle`: `turn-start` when an `idle>X` follows within the interlude window (the drop before her action), else `after-action`. Null for any other pair.
 */
export function stanceReading(w, nb, windUpMs = 600) {
  const n = nb.get(w);
  if (w.fromPose === 'idle' && w.toPose === 'ready') return n?.next && n.next.fromPose === 'ready' && n.next.toPose === 'attack' && n.nextGapMs <= windUpMs ? 'wind-up' : 'menu';
  if (w.fromPose === 'ready' && w.toPose === 'idle') return n?.next && n.next.fromPose === 'idle' && n.nextGapMs <= INTERLUDE_MS ? 'turn-start' : 'after-action';
  return null;
}

/** One group of counted swaps summed. */
export function stats(sel, minutes) {
  const ghosts = sel.filter((w) => w.ghost && w.ghost.frames > 0);
  const gf = sum(sel.map((w) => (w.ghost ? w.ghost.frames : 0)));
  const gms = sum(sel.map((w) => (w.ghost ? w.ghost.ms : 0)));
  const sev = ghosts.map((w) => w.ghost.severity);
  const jerks = sel.map((w) => (w.jerk ? w.jerk.px : null)).filter((x) => x !== null);
  return {
    swaps: sel.length, perMin: r1(sel.length / minutes), planned: sel.filter((w) => w.smear).length,
    ghostFrames: gf, ghostFramesPerMin: r1(gf / minutes), ghostMs: Math.round(gms), ghostMsPerMin: r1(gms / minutes),
    sevMedian: r3(pct(sev, 50)), sevMax: r3(sev.length ? Math.max(...sev) : 0), snaps: sel.filter((w) => w.snap).length, swapJerks: jerks.length,
  };
}

/** Read a continuity.json and class every counted swap. */
export function loadRun(file) {
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  return analyse(c, file);
}

export function analyse(c, label = '') {
  const seconds = c.summary?.battleSeconds ?? c.summary?.run?.battleSeconds ?? 0;
  const minutes = seconds / 60;
  const swaps = c.swaps ?? [];
  const nb = neighbours(swaps);
  for (const w of swaps) {
    w.cls = swapClass(w);
    w.stance = stanceReading(w, nb);
  }
  const counted = swaps.filter((w) => w.counted);
  const total = stats(counted, minutes);
  const classes = {};
  for (const w of counted) (classes[w.cls] ??= []).push(w);
  const rows = Object.entries(classes).map(([cls, sel]) => ({ cls, ...stats(sel, minutes) })).sort((a, b) => b.ghostFrames - a.ghostFrames || b.swaps - a.swaps);
  const stance = {};
  for (const w of counted) if (w.stance) (stance[w.stance] ??= []).push(w);
  const stanceRows = Object.entries(stance).map(([k, sel]) => ({ reading: k, ...stats(sel, minutes) }));
  const interludes = findInterludes(swaps);
  return { label, chapter: c.chapter, game: c.game, battleSeconds: seconds, minutes, countedSwaps: counted.length, total, rows, stanceRows, interludes, interludeSummary: interludeSummary(interludes, { battleSeconds: seconds, totalGhostFrames: total.ghostFrames }), swaps };
}

/**
 * What the two forms of MF-05 would remove, priced from the run's own swaps (the plan: "price the two forms from the harness BEFORE FILMING").
 *  - V1b (no ready painting anywhere): every swap into or out of `ready` that is an idle pair goes (stance up, stance down, back to ready after an action); the strike's ready>attack and the cast's
 *    ready>cast become idle>attack and idle>cast, which are swaps of the same count (a cut at speed, a blend at rest), so nothing is added.
 *  - V1a (ready only as an attack's wind-up painting): the same, less one idle>ready blend per strike that opened on the ready painting (the count of `ready>attack` swaps), each costing the class's mean
 *    ghost frames and ms per swap.
 */
export function priceStance(run) {
  const counted = run.swaps.filter((w) => w.counted);
  const stanceCls = new Set(['Stance up (idle to ready)', 'Stance down (ready to idle)', 'Back to ready after an action (cast/item/OD)']);
  const sel = counted.filter((w) => stanceCls.has(swapClass(w)));
  const up = counted.filter((w) => swapClass(w) === 'Stance up (idle to ready)');
  const strikes = run.swaps.filter((w) => !w.notShowing && w.fromPose === 'ready' && w.toPose === 'attack').length;
  const meanF = up.length ? sum(up.map((w) => w.ghost?.frames ?? 0)) / up.length : 0;
  const meanMs = up.length ? sum(up.map((w) => w.ghost?.ms ?? 0)) / up.length : 0;
  const gf = sum(sel.map((w) => w.ghost?.frames ?? 0));
  const gms = sum(sel.map((w) => w.ghost?.ms ?? 0));
  const m = run.minutes || 1;
  const row = (frames, ms, left = 0) => ({ ghostFramesPerMin: r1(frames / m), ghostMsPerMin: r1(ms / m), chapterAfterFramesPerMin: r1((run.total.ghostFrames - frames + left) / m) });
  return {
    stanceSwaps: sel.length,
    strikesOnReady: strikes,
    v0: row(0, 0),
    v1b: { removes: row(gf, gms), chapterAfterFramesPerMin: r1((run.total.ghostFrames - gf) / m), chapterAfterMsPerMin: r1((run.total.ghostMs - gms) / m) },
    v1a: { removes: row(gf - strikes * meanF, gms - strikes * meanMs), chapterAfterFramesPerMin: r1((run.total.ghostFrames - gf + strikes * meanF) / m), chapterAfterMsPerMin: r1((run.total.ghostMs - gms + strikes * meanMs) / m) },
    meanGhostFramesPerStanceUp: r1(meanF),
  };
}

// ------------------------------------------------------------------------------------------------ the command line

function printRun(run) {
  console.log(`\n== ${run.label} | ${run.chapter ?? ''} ${run.game ?? ''} | ${run.battleSeconds}s | counted ${run.countedSwaps} | ghost frames ${run.total.ghostFrames} = ${run.total.ghostFramesPerMin}/min | ghost ms ${run.total.ghostMsPerMin}/min | snaps ${run.total.snaps} | planned ${run.total.planned}`);
  console.log('class | swaps | /min | planned | ghost frames | /min | ghost ms/min | sev med | sev max');
  for (const r of run.rows) console.log([r.cls, r.swaps, r.perMin, r.planned, r.ghostFrames, r.ghostFramesPerMin, r.ghostMsPerMin, r.sevMedian, r.sevMax].join(' | '));
  console.log(`interludes (ready>idle then idle>X within ${INTERLUDE_MS} ms): ${JSON.stringify(run.interludeSummary)}`);
  console.log(`stance readings: ${run.stanceRows.map((s) => `${s.reading} ${s.swaps} swaps ${s.ghostFrames} frames (${s.ghostFramesPerMin}/min)`).join('; ')}`);
}

function printCompare(a, b) {
  console.log(`\nbefore: ${a.label} | ${a.battleSeconds}s | ${a.total.ghostFramesPerMin} f/min | ${a.total.ghostMsPerMin} ms/min`);
  console.log(`after : ${b.label} | ${b.battleSeconds}s | ${b.total.ghostFramesPerMin} f/min | ${b.total.ghostMsPerMin} ms/min`);
  const names = [...new Set([...a.rows.map((r) => r.cls), ...b.rows.map((r) => r.cls)])];
  console.log('class | before f/min | after f/min | before ms/min | after ms/min | before swaps | after swaps');
  for (const n of names) {
    const x = a.rows.find((r) => r.cls === n), y = b.rows.find((r) => r.cls === n);
    console.log([n, x?.ghostFramesPerMin ?? 0, y?.ghostFramesPerMin ?? 0, x?.ghostMsPerMin ?? 0, y?.ghostMsPerMin ?? 0, x?.swaps ?? 0, y?.swaps ?? 0].join(' | '));
  }
  console.log(`interludes before ${JSON.stringify(a.interludeSummary)}\ninterludes after  ${JSON.stringify(b.interludeSummary)}`);
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  const args = process.argv.slice(2);
  if (args[0] === '--compare') printCompare(loadRun(args[1]), loadRun(args[2]));
  else if (args[0] === '--price') {
    const run = loadRun(args[1]);
    printRun(run);
    console.log(JSON.stringify(priceStance(run), null, 1));
  } else if (args.length) for (const f of args) printRun(loadRun(f));
  else console.log('usage: node tools/swap-classes.mjs <continuity.json>... | --compare <before> <after> | --price <continuity.json>');
}
