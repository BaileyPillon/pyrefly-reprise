// The fluidity pass's measuring thresholds, from critic/policy.json `fluidity` over defaults (motion-fluidity pass, lane L5; both games, critic plumbing).
//
// The matrix and the jolt probe REPORT by default. A standing gate (exit code 1 on a failure that a release acts on) needs its own policy word, a RUBRIC line and Bailey's yes, so `mode` stays
// 'report' here until somebody with that authority writes 'gate' into the policy; the tools' `--gate` flag is for a person asking the question once, not for the release.
// Every threshold a tool reads from here is also written into its stamp (`stampThresholds`), so a changed threshold makes an older run incomparable (review M2).
import fs from 'node:fs';
import path from 'node:path';

export const FLUIDITY_DEFAULTS = Object.freeze({
  hz: Object.freeze({ rates: [60, 120, 144], wallTolerance: 0.05, beatFrames: 1, minIntervalMs: 200, mode: 'report' }),
  jolts: Object.freeze({ minJumpPx: 2.5, minShare: 0.3, windowMs: 333, gridMs: 1000 / 60, maxRise: 0.1, mode: 'report', baselines: {} }),
});

/** The policy's `fluidity` block over the defaults (a policy without one gives the defaults: report, never gate). */
export function fluidityPolicy(root) {
  let p = {};
  try { p = JSON.parse(fs.readFileSync(path.join(root, 'critic/policy.json'), 'utf8')).fluidity ?? {}; } catch { /* no policy: defaults */ }
  const pick = (k) => ({ ...FLUIDITY_DEFAULTS[k], ...(p[k] && typeof p[k] === 'object' ? p[k] : {}) });
  const out = { hz: pick('hz'), jolts: pick('jolts') };
  for (const k of ['hz', 'jolts']) if (out[k].mode !== 'gate') out[k].mode = 'report';
  return out;
}

/** The thresholds of one block that change a tool's numbers (not the notes, the baselines or the mode): what the stamp digests. */
export function stampThresholds(policyBlock) {
  const { note, baselines, mode, ...numbers } = policyBlock ?? {};
  return numbers;
}
