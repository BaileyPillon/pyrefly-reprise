// The score caps of the continuity checks CHK-026 and CHK-027 (Bailey, 2026-10-04, D-424; critic/RUBRIC.md section 6a).
// Split out of critic-policy.mjs, which imports it and re-exports it (validateReport calls it; the tests and critic-policy.d.mts see the
// same name there), to keep each file under the house limit of 400 lines. Pure: a function of the report and the policy block.

/**
 * THE SCORE CAPS OF THE CONTINUITY CHECKS (Bailey, 2026-10-04, D-424; RUBRIC section 6a).
 *
 * CHK-026 (a figure keeps its size and its feet across a pose change) and CHK-027 (continuity of motion) are measured by
 * `critic/runner/lib/continuity.mjs`. A critic that counts features, not breaks, can score animation 7.4 on a build full of
 * size jumps and snaps (rounds 19 to 21), so the sub-scores are capped by what the harness measured:
 *
 *   - while CHK-026 FAILS, `characterModels` and `animation` are at most `caps.sizeFails.max` (7.0);
 *   - while the snaps per minute of battle exceed `motion.snapsPerMinuteMax`, `animation` is at most `caps.snaps.max` (7.5).
 *
 * Applies to a deep or milestone report that carries `subScores` and is dated on or after `continuity.requiredFrom`; such a
 * report must also record both checks (UNVERIFIED needs its reason, like any check) and, when CHK-027 has a result, the
 * measured snaps per minute in `continuity.motion.snapsPerMinute` (the aggregate the harness writes). A report cannot record
 * PASS for a check its own harness output says FAILS. Older reports (rounds 19 to 21 carry subScores) are history. Returns
 * error strings; an empty list means the caps hold. The weighted score and every gate are untouched.
 */
export function continuityCaps(report, policy) {
  const c = policy?.continuity;
  const errors = [];
  if (!c || !report?.subScores || !['deep', 'milestone'].includes(report.review)) return errors;
  const day = new Date(`${c.requiredFrom}T00:00:00.000Z`).getTime();
  const when = new Date(report.date ?? '').getTime();
  if (Number.isNaN(day) || Number.isNaN(when) || when < day) return errors;
  const recorded = new Map((report.checks ?? []).map((k) => [k.id, k]));
  for (const id of c.checks) if (!recorded.has(id)) errors.push(`${id} must be recorded (any result; UNVERIFIED needs its reason) in a ${report.review} report with subScores dated ${c.requiredFrom} or later: the continuity harness is a required evidence step`);
  const harness = report.continuity?.checks ?? {};
  for (const id of c.checks) {
    const said = typeof harness[id] === 'string' ? harness[id] : harness[id]?.result;
    if (said === 'FAIL' && recorded.get(id)?.result === 'PASS') errors.push(`${id} is recorded PASS but the harness output in report.continuity says FAIL`);
  }
  const cap = (key, max, why) => {
    const v = report.subScores[key];
    if (typeof v === 'number' && v > max) errors.push(`subScores.${key} is ${v} but ${why}: it is capped at ${max}`);
  };
  const size = c.caps.sizeFails;
  if (recorded.get(size.check)?.result === 'FAIL') for (const key of size.subScores) cap(key, size.max, `${size.check} FAILS`);
  const motion = recorded.get('CHK-027');
  if (motion && (motion.result === 'PASS' || motion.result === 'FAIL')) {
    const spm = report.continuity?.motion?.snapsPerMinute;
    if (typeof spm !== 'number') errors.push('report.continuity.motion.snapsPerMinute must be the number the harness measured (copy the aggregate continuity-summary.json into report.continuity)');
    else if (spm > c.motion.snapsPerMinuteMax) cap(c.caps.snaps.subScore, c.caps.snaps.max, `snaps per minute (${spm}) exceed ${c.motion.snapsPerMinuteMax}`);
  }
  return errors;
}
