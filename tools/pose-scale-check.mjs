#!/usr/bin/env node
/**
 * Does every painted pose of a measured figure come out at its idle's head size and stand where its idle stands? (r39-posescale; both games.)
 *
 *   node tools/pose-scale-check.mjs                      every subject in docs/target/pose-measure.json against public/art
 *   node tools/pose-scale-check.mjs --subjects tidus,yuna-gunner
 *   node tools/pose-scale-check.mjs --art D:/somewhere/art --new          also list painted subjects nobody has measured yet
 *
 * Exit 0 = PASS, 1 = FAIL (every reason is printed). It reads no pixels but the files' bytes (sha256): the measuring is
 * tools/posescale/measure.py's (head scale read against the idle's face by rulers, stance from the silhouette), the record is
 * docs/target/pose-measure.json, the tables the engine reads are src/data/art/poseRegistration*.ts. What fails:
 *
 *  - a painting of a measured subject with no record: a new key landed (the art lane's new poses); measure it (the command is printed);
 *  - a record whose painting's bytes changed (re-rendered or re-installed): measure it again;
 *  - a record the table does not agree with (a hand-edited table, or `measure.py table` not run after `measure.py measure --write`);
 *  - a reviewed pose whose head, drawn at the table's scale, is not within 3 percent of its idle's (the rule: the same head in every pose);
 *  - in a subject whose heads are reviewed, a pose with a head and no reviewed scale.
 * A subject whose heads are not reviewed yet (only its stance is registered) is listed, not failed.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TOLERANCE = 0.03;

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** The paintings the game can ask for: no `@2x` masters, no `.1` candidates, no `.raw` cutouts. */
export function poseFiles(artDir, subject) {
  const dir = join(artDir, 'characters', subject);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .map((f) => f.slice(0, -4))
    .filter((n) => !n.includes('@') && !n.includes('.'))
    .sort();
}

const size = (b) => Math.sqrt(Math.max(1e-9, b[2] - b[0]) * Math.max(1e-9, b[3] - b[1]));

/**
 * @param {{records: any, table: Record<string, Record<string, {scale?: number, stanceX?: number, feetRow?: number, upright?: true}>>, artDir: string, subjects?: string[], listNew?: boolean}} o
 * @returns {{failures: string[], notes: string[], summary: Array<{subject: string, poses: number, reviewed: number, registered: number}>}}
 */
export function checkPoseScale({ records, table, artDir, subjects, listNew = false }) {
  const failures = [];
  const notes = [];
  const summary = [];
  const names = subjects ?? Object.keys(records.subjects).sort();
  for (const subject of names) {
    const sub = records.subjects[subject];
    if (!sub) {
      failures.push(`${subject}: not in docs/target/pose-measure.json (python -s tools/posescale/measure.py measure ${subject} --write; then ... table)`);
      continue;
    }
    const files = poseFiles(artDir, subject);
    if (!files.length) {
      notes.push(`${subject}: no paintings under ${artDir}; skipped`);
      continue;
    }
    const idle = sub.poses.idle;
    const idleBox = sub.idleHead;
    let reviewed = 0;
    let registered = 0;
    let withHead = 0;
    for (const pose of files) {
      const rec = sub.poses[pose];
      const key = `${subject}/${pose}`;
      if (!rec) {
        failures.push(`${key}: painted but never measured (python -s tools/posescale/measure.py measure ${subject} --write, review its head, then ... table)`);
        continue;
      }
      if (rec.skip) continue;
      const sha = sha256(join(artDir, 'characters', subject, `${pose}.png`));
      if (sha !== rec.sha) {
        failures.push(`${key}: the painting changed since it was measured (sha256 differs); measure it again`);
        continue;
      }
      const row = table[subject]?.[pose];
      if (rec.stance && !rec.stance.flag && idle?.stance) {
        registered++;
        if (!row || row.stanceX === undefined || Math.abs(row.stanceX - rec.stance.x) > 0.06) failures.push(`${key}: the table's stanceX (${row?.stanceX}) is not the record's (${rec.stance.x}); run measure.py table`);
      }
      if (rec.scaleSrc === 'reviewed' || rec.scaleSrc === 'accepted') {
        reviewed++;
        if (!row || row.scale === undefined || Math.abs(row.scale - rec.scale) > 0.0006) {
          failures.push(`${key}: the table's scale (${row?.scale}) is not the record's (${rec.scale}); run measure.py table`);
        } else if (rec.head && idleBox) {
          const ratio = (size(rec.head) * row.scale) / size(idleBox);
          if (Math.abs(ratio - 1) > TOLERANCE) failures.push(`${key}: head at the table's scale is x${ratio.toFixed(3)} of the idle's (limit ${TOLERANCE * 100} percent)`);
        }
      } else if (pose !== 'idle' && rec.head === undefined && rec.scaleSrc === 'unreviewed') {
        /* head not reviewed: listed through the subject's summary */
      }
      if (rec.prone && rec.standing && pose !== 'ko' && !row?.upright) failures.push(`${key}: a standing pose wider than tall must be marked upright in the table`);
      if (pose !== 'idle' && rec.scaleSrc !== 'unreviewed') withHead++;
    }
    const nonIdle = files.filter((p) => p !== 'idle' && !sub.poses[p]?.skip).length;
    if (withHead > 0 && withHead < nonIdle) failures.push(`${subject}: heads reviewed for ${withHead} of ${nonIdle} poses; review the rest (or none)`);
    summary.push({ subject, poses: files.length, reviewed, registered });
    if (withHead === 0) notes.push(`${subject}: heads not reviewed yet (${registered} of ${files.length} stances registered)`);
  }
  if (listNew) {
    const dir = join(artDir, 'characters');
    if (existsSync(dir)) for (const s of readdirSync(dir).sort()) if (!records.subjects[s] && !s.startsWith('ff7')) notes.push(`${s}: painted, not measured (${poseFiles(artDir, s).length} poses)`);
  }
  return { failures, notes, summary };
}

async function main(argv) {
  const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const artDir = resolve(get('--art', join(ROOT, 'public', 'art')));
  const subjects = (get('--subjects', '') || '').split(',').filter(Boolean);
  const recPath = join(ROOT, 'docs', 'target', 'pose-measure.json');
  if (!existsSync(recPath)) { console.error('no docs/target/pose-measure.json'); return 1; }
  const records = JSON.parse(readFileSync(recPath, 'utf8'));
  const { POSE_REGISTRATION } = await import('../src/engine/PoseRegistration.ts');
  const r = checkPoseScale({ records, table: POSE_REGISTRATION, artDir, subjects: subjects.length ? subjects : undefined, listNew: argv.includes('--new') });
  for (const s of r.summary) console.log(`${s.subject.padEnd(22)} ${String(s.poses).padStart(3)} poses  heads reviewed ${String(s.reviewed).padStart(3)}  stances registered ${String(s.registered).padStart(3)}`);
  for (const n of r.notes) console.log(`note: ${n}`);
  for (const f of r.failures) console.log(`FAIL: ${f}`);
  console.log(r.failures.length ? `FAIL (${r.failures.length})` : 'PASS');
  return r.failures.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e); process.exit(1); });
}
