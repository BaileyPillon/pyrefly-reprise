// Continuity harness: the pose waiver ledger, read by the critic (pose continuity, W4; both games).
//
// `docs/target/pose-waivers.json` is the gate's ledger (`tools/pose-gate.mjs`, CONTRACT-CHANGES 2026-10-16): one row per (subject, pose, painting sha),
// `{version: 1, rows: [{subject, pose, sha, reason, words, date, legacy?}]}`. A waived pose is one the owner (or, for a `legacy` row, the release driver
// under his 2026-10-16 request) has let stand outside its band. The critic judges it all the same and SHOWS it, but a reading of a waived pose is not a
// failure: the same rule the gate applies, so a live review and a deploy refusal cannot disagree about which poses are allowed to be off.
//
// What the critic cannot do is hash the painting: it fetches the shipped copy (a derived WebP), and the ledger binds the PNG master's sha256. So the
// match is by subject and pose, and the sha is compared against the one the registration record carries for the same painting (`anchors.sha`) when both
// exist; a record that names a different painting than the waiver does makes the waiver STALE (a re-installed painting loses its waiver) and it is not
// honoured. With no record to compare, the waiver stands and says `shaChecked: false`.
import { readFileSync } from 'node:fs';

/**
 * @returns {{path:string, count:number, rows:Map<string, object[]>}|{path:string, error:string}|null} null when there is no ledger file.
 */
export function loadPoseWaivers(path) {
  if (!path) return null;
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return null; }
  try {
    const json = JSON.parse(raw);
    const rows = new Map();
    for (const r of Array.isArray(json.rows) ? json.rows : []) {
      if (!r || typeof r.subject !== 'string' || typeof r.pose !== 'string') continue;
      const key = `${r.subject}/${r.pose}`;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(r);
    }
    return { path, count: [...rows.values()].reduce((n, l) => n + l.length, 0), rows };
  } catch (e) {
    return { path, error: String(e).slice(0, 160) };
  }
}

const hexPrefixMatch = (a, b) => {
  const x = String(a ?? '').toLowerCase(), y = String(b ?? '').toLowerCase();
  return x.length >= 8 && y.length >= 8 && (x.startsWith(y) || y.startsWith(x));
};

/**
 * The waiver that covers one painting's anchors (`anchors.subject`, `.pose`, `.sha`), or null.
 * @returns {{reason:string, words:string, date:string|null, legacy:boolean, shaChecked:boolean}|null}
 */
export function waiverFor(waivers, anchors) {
  if (!waivers || waivers.error || !anchors?.subject || !anchors?.pose) return null;
  const rows = waivers.rows.get(`${anchors.subject}/${anchors.pose}`);
  if (!rows) return null;
  for (const r of rows) {
    const shaChecked = Boolean(r.sha && anchors.sha);
    if (shaChecked && !hexPrefixMatch(r.sha, anchors.sha)) continue; // another painting than the one waived: stale
    return { reason: String(r.reason ?? ''), words: String(r.words ?? ''), date: r.date ?? null, legacy: r.legacy === true, shaChecked };
  }
  return null;
}
