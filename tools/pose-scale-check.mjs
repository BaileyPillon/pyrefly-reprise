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
 *  - a record the table does not agree with (a hand-edited table, or `measure.py table` not run after `measure.py measure --write`): its scale, its stance and, since r394, its head box;
 *  - a reviewed pose whose head, at the scale the engine will use, is not within the reading's resolution (8 percent) of its idle's: either the table
 *    does not carry the reading (it is more than 12 percent from the pose's own scale), or it was edited by hand;
 *  - a pose the W3 sizing rule sized (`ruled`; a recorded hold is one of them): its record must carry the rule's numbers and the scale must be what the rule gives from them (`ruleSize`: the geometric
 *    mean of its head and height scales, lifted to the stature floor, refused when no single size is in band), its head ratio the applied scale over its reading, and its registered head the idle's at the
 *    APPLIED scale (so the head lock does not undo the rule). The height scale itself is read from the pixels: `node tools/posescale/pose-ruler.mjs --check` recomputes it;
 *  - in a subject whose heads were fully reviewed (`headsComplete` in the record), a pose with no reading (a new key).
 * A subject whose heads are not (fully) reviewed yet is listed, not failed; its stances are registered either way.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { BANDS, SLACK, statureFloorOf } from './posescale/pose-bands.mjs';
import { LOW_POSES } from './posescale/pose-kinds.mjs';
import { RULE_ID, ruleSize } from './posescale/pose-rule.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** What a ruler reading can resolve (records carry it as `resolution`): a reviewed pose's head, at the table's scale, must be within it of its idle's. */
export const TOLERANCE = 0.08;

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
 * @param {{records: any, table: Record<string, Record<string, {scale?: number, stanceX?: number, feetRow?: number, upright?: true, head?: readonly number[]}>>, artDir: string, subjects?: string[], listNew?: boolean}} o
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
      // r394 (D-510): the head box the engine holds to the idle's size on screen (`HeadLock.ts`) is the record's, as fractions of the painting; a foe with no face box has the 1 px stand-in and registers none
      if (rec.size && !(idleBox?.length === 4 && idleBox[0] === 0 && idleBox[1] === 0 && idleBox[2] === 1 && idleBox[3] === 1)) {
        const want = rec.head ? [rec.head[0] / rec.size[0], rec.head[1] / rec.size[1], rec.head[2] / rec.size[0], rec.head[3] / rec.size[1]] : null;
        const got = row?.head;
        if (want && (!got || got.length !== 4 || got.some((v, i) => Math.abs(v - want[i]) > 6e-5))) failures.push(`${key}: the table's head box (${got ? got.join(', ') : 'none'}) is not the record's (${want.map((v) => v.toFixed(4)).join(', ')}); run measure.py table`);
        else if (!want && got) failures.push(`${key}: the table has a head box (${got.join(', ')}) that the record does not; run measure.py table`);
      }
      if (['reviewed', 'accepted', 'gated', 'held', 'noise', 'ruled'].includes(rec.scaleSrc)) {
        reviewed++;
        const koLike = pose === 'ko' && rec.prone && !rec.standing; // a KO's table scale is the reading over the lying plane's projection (measure.py KO_PROJECTION)
        const proj = koLike ? (records.koProjection ?? 1) : 1;
        const allow = rec.allow?.scale ?? 1; // r392: a camera allowance (measure.py, overrides.json `allow`): a factor the table carries over the reading, with its reason in the record
        if (rec.allow && !(rec.allow.why && allow > 0.9 && allow < 1.1)) failures.push(`${key}: its camera allowance (${allow}) needs a reason and a factor between 0.9 and 1.1`);
        const applied = rec.scaleSrc !== 'noise' || koLike || allow !== 1;
        const effective = applied ? (row?.scale ?? NaN) * proj : rec.current; // 'noise': the pose keeps the scale it has (the sidecar's, or the KO table's)
        if (applied && (!row || row.scale === undefined || Math.abs(row.scale * proj - rec.scale * allow) > 0.0006 * Math.max(1, proj > 0 ? 1 / proj : 1))) {
          failures.push(`${key}: the table's scale (${row?.scale}) is not the record's (${rec.scale}${koLike ? ` over the KO projection ${proj}` : ''}${allow !== 1 ? ` times its camera allowance ${allow}` : ''}); run measure.py table`);
        } else if (!applied && row?.scale !== undefined) {
          failures.push(`${key}: the record keeps the pose's own scale but the table has one (${row.scale}); run measure.py table`);
        } else if (!applied) {
          const res = records.resolution ?? TOLERANCE;
          if (!(rec.reading > 0) || !(rec.current > 0) || Math.abs(rec.reading / rec.current - 1) > res + 1e-6) failures.push(`${key}: the reading (${rec.reading}) is not within ${res * 100} percent of the pose's own scale (${rec.current}); it must be applied (measure.py measure --write)`);
        } else if (rec.scaleSrc === 'gated') {
          if (!(rec.stature >= 0.595)) failures.push(`${key}: gated to the stature floor but its stature is ${rec.stature}`);
        } else if (rec.scaleSrc === 'ruled' || (rec.scaleSrc === 'held' && rec.ruled)) {
          // W3 (2026-10-17): the sizing rule's result. The record names the rule and its readings; the scale is the rule's answer for them, the head box is the idle's over the applied scale.
          const u = rec.ruled;
          if (!u || u.rule !== RULE_ID || !(u.head > 0) || !(u.height > 0)) failures.push(`${key}: a ruled pose needs the rule's record (ruled.rule ${RULE_ID}, ruled.head, ruled.height); run measure.py table`);
          else {
            const band = rec.statureBand ?? {}; // pc-residues (PR-0531): a margin for one pose, carried on the record with its reason
            const floor = band.floor ?? statureFloorOf(LOW_POSES.has(pose) ? 'low' : 'standing', pose);
            const want = ruleSize({ head: u.head, height: u.height, floor, ...(band.ceiling ? { ceiling: band.ceiling } : {}) });
            if (rec.reading > 0 && Math.abs(rec.reading - u.head) > 0.0006) failures.push(`${key}: the rule's head scale (${u.head}) is not the record's reading (${rec.reading}); run measure.py table`);
            else if (Math.abs(rec.scale - want.scale) > 0.0015 || (u.lift ?? null) !== want.lift) failures.push(`${key}: the rule gives scale ${want.scale} (${want.lift ?? 'the mean'}) for head ${u.head} and height ${u.height}, the record has ${rec.scale} (${u.lift ?? 'the mean'}); run measure.py table`);
            else if (Math.abs(rec.scale / u.head - u.headRatio) > 0.002) failures.push(`${key}: its head ratio (${u.headRatio}) is not the applied scale (${rec.scale}) over the reading (${u.head})`);
            else if (want.held !== Boolean(rec.held)) failures.push(`${key}: ${want.held ? 'the rule records a hold here (the head cost leaves 0.85 to 1.15 or the stature was lifted) and the record has none' : 'the record carries a hold the rule does not make'}`);
            else if (rec.held && (!rec.held.by || !(Math.abs(rec.held.headRatio - u.headRatio) < 0.002) || !(rec.held.headRatio >= BANDS.heldHead[0] - SLACK && rec.held.headRatio <= BANDS.heldHead[1] + SLACK))) failures.push(`${key}: a recorded hold needs held.by, and a head ratio the rule's (${u.headRatio}) inside x0.8 to x1.45`);
            if (rec.head && idleBox && effective) {
              const ratio = (size(rec.head) * effective) / size(idleBox);
              if (Math.abs(ratio - 1) > 0.02) failures.push(`${key}: the ruled pose's registered head, at the scale the engine uses (${effective}), is x${ratio.toFixed(3)} of the idle's; run measure.py table`);
            }
          }
        } else if (rec.scaleSrc === 'held') {
          // r50.1: a stature hold (measure.py, overrides.json `stature`): drawn at its hold's height, not its head's. The record names whose word it is, what the ruler read and what the hold cost the head; the head box it registers is the one the lock must hold at the APPLIED scale, so the head at that scale is the idle's by construction.
          const h = rec.held;
          if (!h || !h.by || !(h.reading > 0) || !(h.headRatio > 0) || !(h.stature > 0)) failures.push(`${key}: a stature hold needs held.by, held.reading, held.headRatio and held.stature in its record`);
          else if (Math.abs(rec.scale / h.reading - h.headRatio) > 0.002) failures.push(`${key}: its held head ratio (${h.headRatio}) is not the applied scale (${rec.scale}) over the ruler's reading (${h.reading})`);
          else if (!(h.headRatio >= BANDS.heldHead[0] - SLACK && h.headRatio <= BANDS.heldHead[1] + SLACK)) failures.push(`${key}: a hold may move the head to between x0.8 and x1.45 of the idle's, this one is x${h.headRatio}`);
          if (rec.head && idleBox && effective) {
            const ratio = (size(rec.head) * effective) / size(idleBox);
            if (Math.abs(ratio - 1) > 0.02) failures.push(`${key}: the held pose's registered head, at the scale the engine uses (${effective}), is x${ratio.toFixed(3)} of the idle's; run measure.py measure --write, then table`);
          }
        } else if (rec.head && idleBox && effective) {
          const ratio = (size(rec.head) * effective) / allow / size(idleBox); // the allowance is on purpose: the head at the reading's scale is the idle's
          if (Math.abs(ratio - 1) > 0.02) failures.push(`${key}: head at the scale the engine uses (${effective}) is x${ratio.toFixed(3)} of the idle's (the record's own reading says it should be x1.0)`);
        }
      }
      if (rec.scaleSrc === 'kept') reviewed++;
      if (rec.prone && rec.standing && pose !== 'ko' && !row?.upright) failures.push(`${key}: a standing pose wider than tall must be marked upright in the table`);
      if (pose !== 'idle' && rec.scaleSrc !== 'unreviewed') withHead++;
    }
    const nonIdle = files.filter((p) => p !== 'idle' && !sub.poses[p]?.skip).length;
    if (sub.headsComplete === true && withHead < nonIdle) failures.push(`${subject}: its heads were fully reviewed and ${nonIdle - withHead} pose(s) are not (a new key?): read them, then measure.py measure --write`);
    else if (withHead > 0 && withHead < nonIdle) notes.push(`${subject}: heads reviewed for ${withHead} of ${nonIdle} poses`);
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
