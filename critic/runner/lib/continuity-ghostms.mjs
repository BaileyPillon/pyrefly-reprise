// Continuity harness: the see-through ("ghost") time in MILLISECONDS, the unit the rest of the fluidity pass is measured in (T-01, lane L5; both games, critic plumbing).
//
// A swap's double image is the stretch in which both paintings show (`ghost.frames` frames of the recording, `ghost.ms` the time between the drawn frames that held it, each step capped at 100 ms). The frame
// count is a 60 Hz convenience: a 120 ms blend is 7 frames at 60 Hz and 17 at 144 Hz, so the same double image reads 2.4 times higher on Bailey's monitor if it is counted in frames (TB-12 of the timebase audit,
// correction 5 of the plan). The milliseconds do not depend on the display, so they are the PRIMARY number (Chapter I 1,719 ms and Chapter IV 2,483 ms of see-through a minute at release 64); the frames stay,
// and `ghostFrames60PerMinute` says what the milliseconds are worth in 60 Hz frames, so a 144 Hz capture can be compared with the 101.7 and 147.4 baselines without a conversion in somebody's head.
//
// Pure: plain objects in, plain numbers out. Reported, never gated (a gate needs its own policy word and Bailey's yes).

/** One 60 Hz frame in ms. */
export const FRAME_MS_60 = 1000 / 60;

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/**
 * The ghost block of a chapter's `motion` summary.
 * @param {Array<{ghost?: {frames?: number, ms?: number}}>} counted the counted swaps
 * @param {number} minutes battle minutes
 * @returns {{ghostMs: number, ghostMsPerMinute: number|null, ghostFramesPerMinute: number|null, ghostFrames60PerMinute: number|null}}
 */
export function ghostMsBlock(counted, minutes) {
  const ms = counted.reduce((n, s) => n + (s.ghost?.ms ?? 0), 0);
  const frames = counted.reduce((n, s) => n + (s.ghost?.frames ?? 0), 0);
  const per = (v, d = 1) => (minutes > 0 ? round(v / minutes, d) : null);
  return { ghostMs: Math.round(ms), ghostMsPerMinute: per(ms, 0), ghostFramesPerMinute: per(frames), ghostFrames60PerMinute: per(ms / FRAME_MS_60) };
}

/**
 * The same block for a whole run from its chapters' summaries (continuity.mjs `aggregate`): null when a chapter was summarised before the unit existed (its milliseconds are not zero, they are unknown).
 * @param {Array<{ghostMs?: number, ghostFrames?: number}>} motions the counted chapters' `motion` objects
 * @param {number} minutes
 */
export function aggregateGhostMs(motions, minutes) {
  if (!motions.length || motions.some((m) => typeof m.ghostMs !== 'number')) return null;
  const ms = motions.reduce((n, m) => n + m.ghostMs, 0);
  const frames = motions.reduce((n, m) => n + (m.ghostFrames ?? 0), 0);
  const per = (v, d = 1) => (minutes > 0 ? round(v / minutes, d) : null);
  return { ghostMs: Math.round(ms), ghostMsPerMinute: per(ms, 0), ghostFramesPerMinute: per(frames), ghostFrames60PerMinute: per(ms / FRAME_MS_60) };
}

/** The sentence a report line carries: "1,693 ms of see-through a minute (101.8 frames a minute at 60 Hz)", or '' when the run has no milliseconds. */
export function ghostRateText(motion) {
  if (!motion || typeof motion.ghostMsPerMinute !== 'number') return '';
  const f = motion.ghostFrames60PerMinute;
  return `${motion.ghostMsPerMinute.toLocaleString('en-US')} ms of see-through a minute${typeof f === 'number' ? ` (${f} frames a minute at 60 Hz)` : ''}`;
}
