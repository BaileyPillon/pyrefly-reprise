// Two small readings for the FFX-2 timebase jobs (T-05 of the motion-fluidity pass, lane L5; FFX-2 only for the shimmer, both games for the allocation profile; critic plumbing). Pure.
//
// (1) THE READY SHIMMER (TB-03, shimmer half). Under an open FFX-2 command menu the party column is rebuilt with innerHTML about 16 times a second, so every CSS animation inside a rebuilt row restarts with each
// rebuild (a new element starts at 0). The audit could not settle whether the READY shimmer (`ffx2-shimmer` on a full gauge, `steps(2)` over 0.25 s) is such an animation: the first run read 433 ms as the longest
// currentTime of any shimmer in 4 s, which a row replaced every 62 ms should not reach, and the follow-up job never got the rig. tools/atb-shimmer.mjs logs, for three seconds of frames, which ELEMENT each
// `ffx2-shimmer` animation belongs to (a uid stamped on the element) and how long the same element lived; `shimmerVerdict` reads that: `persists` when one element carried its shimmer for most of the window,
// `restarts-with-rebuild` when the elements were replaced about as often as the column was rebuilt, `inconclusive` when no shimmer was seen at all (nothing was ready) or the data cannot say.
//
// (2) THE ALLOCATION PROFILE (PACE-09: Chapter IV allocates 31 MB a second at 60 Hz, 540 KB a frame; Chapter I 18 MB, 312 KB; 78 MB a second at 144 Hz if it stays per frame). tools/alloc-profile.mjs runs
// Chromium's sampling heap profiler (`HeapProfiler.startSampling`, garbage included) over a stretch of a fight; `aggregateAllocations` folds the profile's call tree into the top allocating FUNCTIONS by self
// size (the bytes each function's own allocations account for, not its callees'), with their share, a rate a second and a size a frame.

const r1 = (x) => Math.round(x * 10) / 10;

/**
 * @param {{lives: Array<{uid: string|null, firstT: number, lastT: number, maxCur: number, frames: number}>, mutations: number, windowMs: number}} d
 * @returns {{verdict: 'persists'|'restarts-with-rebuild'|'inconclusive', why: string, distinctElements: number, longestLifeMs: number, rebuildsPerSecond: number|null, expectedRestarts: number|null}}
 */
export function shimmerVerdict({ lives, mutations, windowMs }) {
  const real = lives.filter((l) => l.uid !== null);
  const rebuildsPerSecond = windowMs > 0 ? r1((mutations * 1000) / windowMs) : null;
  const longest = real.reduce((m, l) => Math.max(m, l.lastT - l.firstT), 0);
  const base = { distinctElements: real.length, longestLifeMs: longest, rebuildsPerSecond, expectedRestarts: rebuildsPerSecond === null ? null : r1((rebuildsPerSecond * windowMs) / 1000) };
  if (!real.length) return { verdict: 'inconclusive', why: 'no ffx2-shimmer animation was running in the window (no gauge was ready): open a command menu on a full gauge and run again', ...base };
  if (longest >= 0.8 * windowMs) return { verdict: 'persists', why: `one element carried its shimmer for ${longest} ms of the ${windowMs} ms window: a rebuild does not restart it`, ...base };
  if (mutations > 0 && real.length >= 0.5 * mutations) return { verdict: 'restarts-with-rebuild', why: `${real.length} different elements carried the shimmer in ${windowMs} ms, the longest for ${longest} ms, while the column was rebuilt ${mutations} times: it restarts on most rebuilds (an element that outlives several rebuilds kept it ${longest} ms; the rule is a majority, elements at least half the rebuilds)`, ...base };
  return { verdict: 'inconclusive', why: `${real.length} element(s), the longest ${longest} ms of ${windowMs} ms, ${mutations} rebuilds: neither a persistent animation nor one restarted by every rebuild`, ...base };
}

/**
 * Fold a V8 sampling heap profile into its top allocating functions.
 * @param {{head: {callFrame: {functionName: string, url: string, lineNumber: number, columnNumber: number}, selfSize: number, children?: any[]}}} profile `HeapProfiler.stopSampling`'s result
 * @param {{seconds: number, frames: number, top?: number}} o the stretch the profile covers and the frames the page drew in it
 */
export function aggregateAllocations(profile, { seconds, frames, top = 25 }) {
  const by = new Map();
  let total = 0;
  const walk = (n) => {
    const cf = n.callFrame ?? {};
    const size = n.selfSize ?? 0;
    total += size;
    if (size > 0) {
      const key = `${cf.functionName || '(anonymous)'} ${String(cf.url ?? '').split('/').slice(-1)[0]}:${(cf.lineNumber ?? 0) + 1}:${(cf.columnNumber ?? 0) + 1}`;
      const e = by.get(key) ?? { functionName: cf.functionName || '(anonymous)', script: String(cf.url ?? '').split('/').slice(-1)[0], line: (cf.lineNumber ?? 0) + 1, column: (cf.columnNumber ?? 0) + 1, bytes: 0 };
      e.bytes += size;
      by.set(key, e);
    }
    for (const c of n.children ?? []) walk(c);
  };
  if (profile?.head) walk(profile.head);
  const rows = [...by.values()].sort((a, b) => b.bytes - a.bytes).slice(0, top).map((e) => ({ ...e, share: total ? r1((100 * e.bytes) / total) : 0, kbPerSecond: seconds > 0 ? r1(e.bytes / 1024 / seconds) : null, bytesPerFrame: frames > 0 ? Math.round(e.bytes / frames) : null }));
  return {
    totalBytes: total, seconds, frames,
    mbPerSecond: seconds > 0 ? r1(total / 1048576 / seconds) : null,
    kbPerFrame: frames > 0 ? r1(total / 1024 / frames) : null,
    functionsSeen: by.size, top: rows,
    topThreeShare: rows.slice(0, 3).reduce((s, r) => s + r.share, 0),
  };
}
