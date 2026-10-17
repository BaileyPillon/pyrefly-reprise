/**
 * **Rigged poses in the pose gate's census** (the rig program; both games). A subject with a rig the rig gate says `ok` has its painting-per-pose rows reported as `rigged`
 * (outcome `rigged`, entry `rigged: true`) for every pose the rig has a passing key for. The paintings STAY the fallback: a row that FAILS still fails (its codes are unchanged);
 * only a row that would pass or be waived is relabelled. A rig never weakens the pose gate.
 *
 * `ok` is not taken on trust. A rig counts only when BOTH hold: its `gate` stamp is ok, by `tools/rig-gate.mjs`, and bound to exactly this content (`verifyStamp`: the runtime draws a rig
 * whose `gate.status` is `ok`, so the stamp is what the player gets), AND in `full` mode (the default; the deploy's) the gate is run again now (`gateRig`, blends included) and agrees;
 * `stamp` mode checks the stamp only (quick, for a dev loop). A rig that is not ok is a note, never a failure: its poses are paintings, as they always were.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gateRig, riggedPoses, verifyStamp } from './rig-gate-lib.mjs';
import { costumeParts, readRigFile } from './rig-format.mjs';

/**
 * Relabel the entries a gate-ok rig serves. Mutates `entries`.
 * @param {{entries: object[], inputs: object, dir?: string, mode?: 'full'|'stamp'}} o `dir`: the rig root (`<dir>/<subject>/rig.json`); none or a missing folder: nothing is done
 * @returns {Promise<Array<{subject: string, ok: boolean, mode: string, keys: string[], why: string|null}>>}
 */
export async function applyRigs({ entries, inputs, dir, mode = 'full' }) {
  const out = [];
  if (!dir || !existsSync(dir)) return out;
  const subjects = new Set(entries.map((e) => e.subject));
  for (const d of readdirSync(dir, { withFileTypes: true }).filter((x) => x.isDirectory()).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const folder = join(dir, d.name);
    if (!existsSync(join(folder, 'rig.json'))) continue;
    let name;
    try { name = readRigFile(folder).raw.name; } catch { out.push({ subject: d.name, ok: false, mode, keys: [], why: 'rig.json does not parse' }); continue; }
    if (!subjects.has(name)) continue;
    const rec = { subject: name, ok: false, mode, keys: [], why: null };
    out.push(rec);
    const v = verifyStamp(folder);
    if (!v.ok) { rec.why = `${v.code}: ${v.message}`; continue; }
    const pose = costumeParts(v.raw.costume?.painting)?.pose ?? 'idle';
    const costume = entries.find((e) => e.subject === name && e.pose === pose);
    if (!costume || !costume.sha.startsWith(String(v.raw.costume.sha).toLowerCase())) { rec.why = `costume-stale: the ${pose} painting is not the master the rig was cut from`; continue; }
    let served = v.raw.gate.keys ?? [];
    if (mode === 'full') {
      const g = await gateRig({ rig: folder, inputs, blends: true });
      if (g.status !== 'ok') { rec.why = `the rig gate refuses it now: ${[...new Set(g.failures.map((f) => f.code))].join(', ')}`; continue; }
      served = riggedPoses(g);
    }
    rec.ok = true;
    rec.keys = served;
    for (const e of entries) {
      if (e.subject === name && served.includes(e.pose) && (e.outcome === 'pass' || e.outcome === 'waived')) { e.was = e.outcome; e.outcome = 'rigged'; e.rigged = true; }
    }
  }
  return out;
}
