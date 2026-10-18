/**
 * **The pose gate's core** (pose continuity, W1; both games). One function judges one painting; `runGate` judges a folder of them; `listBuiltPaintings` and
 * `checkBuilt` judge a build's art list against that. The CLI is `tools/pose-gate.mjs`; the installer ends in it (`tools/art-install.mjs`); `npm test` runs it
 * (`tests/unit/tools/pose-gate-art.test.ts`); `tools/deploy-pages.mjs` runs it before the build and after it. Bailey, 2026-10-16: "pose continuity is the
 * strongest recurring issue we need a permanent fix for this please."
 *
 * A shipped character painting passes when it is exempt (an FFX-2 `twirl-*` costume-change painting, an FF7 still), OR when
 *   - its registration row is FRESH: `status` `ok` or `held`, and the row's `sha` is the file's (a re-installed painting is stale), and the numbers the row stores
 *     (class, stature, real head, KO length, overlap) are the ones recomputed from the pixels now (the second, independent reading: a table written from the old
 *     tool's record said Paine Lady Luck hurt stood at 0.85 of her idle's and the game drew her at 0.49), and the recompute is inside its class's bands; or
 *   - it is WAIVED: the ledger (`docs/target/pose-waivers.json`) has a row bound to this sha, the compiled table says `waived` (the runtime only trusts what the
 *     table says, and the table is generated from the ledger, never typed), and the stored numbers still equal the recompute.
 * Everything else fails with one line each (codes below). Bands and the model are `tools/posescale/pose-bands.mjs` and `pose-model.mjs`; nothing here invents a number.
 *
 *   empty                 nothing opaque in the painting (a transparent PNG), exempt or not
 *   unregistered          painted, no registration row at all (a new subject nobody measured: FOC501-01, the Dark Aeons)
 *   no-status / no-sha    a row written before the install did (no `status`, or no `sha`): run `node tools/art-install.mjs ... --register` (measure.py measure, table)
 *   stale-sha             the row's sha is not the file's: the painting was re-installed since it was measured (a waiver does not follow it)
 *   stale-reading         the row stores a class or a number the pixels do not give (the knee-planted Lady Luck rows)
 *   out-of-band           the recompute is outside the class's band and the row is not a waiver (a stature of 0.30 with a matched head)
 *   blocked               the row says `blocked`
 *   waived-by-hand        the row says `waived` and the ledger has no row for this sha
 *   waiver-not-compiled   the ledger waives it but the table does not say `waived` (the table was not regenerated)
 *   ledger-*              the ledger itself (`pose-gate-ledger.mjs`)
 *   hires-size / -differs the painting's `@2x`/`@3x`/`@4x` master is not N times its size, or its silhouette is not the 1x painting's (the 1x was replaced and the
 *                         hi-DPI master left behind); a waiver does not cover it
 *   ledger-base           `--base` names a ref git cannot read: the ratchet's comparison was asked for and cannot be made
 *   master-changed        a master changed between the gate reading it and the build shipping it
 *   unreadable            the painting does not decode (not a PNG, truncated): a painting the gate cannot read is one it cannot vouch for
 *   unknown-subject       `--subjects` names a folder that is not under characters/
 *   built-unvetted        the build ships a character painting the gate did not read from a master
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { BANDS, bandVerdict, proposeStatus } from './posescale/pose-bands.mjs';
import { listSubjects, loadModelInputs, readSubject } from './posescale/pose-model.mjs';
import { diffStored, shaMatches } from './posescale/pose-rows.mjs';
import { LEDGER_PATH, LEGACY_SEAL_DIGEST, loadDecisionWords, loadLedger, loadLedgerAtRef, validateLedger, waiverKey } from './pose-gate-ledger.mjs';
import { applyRigs } from './rig/rig-census.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** A message with this machine's art folder named `<art>` (the census is kept in the repository and the artifact record: no local path). */
export const scrubPath = (text, dir) => (dir ? String(text).split(dir).join('<art>').split(dir.split('\\').join('/')).join('<art>') : String(text));

/**
 * Read the subjects' paintings, `concurrency` subjects at a time. A subject whose painting cannot be read (a file that is not a PNG, a truncated one) is
 * not a crash: it is an `unreadable` failure, because a painting the gate cannot read is a painting it cannot vouch for.
 * @returns {Promise<{readings: object[], errors: Array<{subject: string, message: string}>}>}
 */
async function readSubjects(inp, names, { concurrency, onSubject }) {
  const results = new Array(names.length).fill(null);
  const errors = [];
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= names.length) return;
      try {
        results[i] = await readSubject(inp, names[i]);
      } catch (e) {
        errors.push({ subject: names[i], message: scrubPath(e instanceof Error ? e.message : String(e), inp.artDir) });
      }
      inp.refs.delete(names[i]); // a census does not keep a thousand silhouettes
      if (results[i]) onSubject?.(names[i], results[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return { readings: results.flat().filter(Boolean), errors };
}
export const STATUSES = ['ok', 'held', 'waived', 'blocked'];

const f2 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? 'n/a' : v.toFixed(2));
const pct = (v) => (v === null || v === undefined || !Number.isFinite(v) ? 'n/a' : `${(v * 100).toFixed(1)} percent`);

/** One flag in words, with the number the pixels gave. */
export function flagText(r, flag) {
  switch (flag) {
    case 'stature-low':
    case 'stature-high': return `stature ${f2(r.stature)} of its idle's height`;
    case 'head-small':
    case 'head-big': return `real head ${f2(r.headReal)} of its idle's`;
    case 'feet-x': return `feet ${f2(r.feet?.dx)} idle heights sideways of the idle's`;
    case 'feet-y': return `feet ${f2(r.feet?.dy)} idle heights above or below the idle's`;
    case 'mass-low':
    case 'mass-high': return `mass ${f2(r.massRatio)} of its idle's (the figure is not the idle's size)`;
    case 'no-stance': return 'no stance can be read from the silhouette (a bar, a blob: no feet)';
    case 'slab': return `the silhouette fills ${pct(r.solidity)} of its own bounding box: a rectangle, not a figure`;
    case 'props-only': return `body (head to soles) ${f2(r.bodyStature)} of its idle's against a silhouette of ${f2(r.stature)}: a prop carries the height`;
    case 'no-overlap': return `overlap ${f2(r.iou)} with its idle (nothing in common with it)`;
    case 'head-off': return `the head box (centre ${f2(r.headBox?.cy)} down the figure, ${pct(r.headBox?.coverage)} painted) is not on a head`;
    case 'no-head': return 'no head box, though its idle has one';
    case 'held-head': return `the hold's head ratio ${f2(r.heldHeadRatio)} is not its scale over its ruler reading (gap ${f2(r.heldGap)})`;
    case 'wide-pose': return 'wider than 1.15 times its height, and neither a KO nor a hull whose idle is wide: the engine lays it down unless the table marks it upright';
    case 'empty': return 'nothing opaque in the painting';
    case 'feet-sunk': return `feetRow ${pct(r.feetRowGap)} of the painting above its alpha baseline (the soles are planted at the knees)`;
    default: return flag;
  }
}

const flagsText = (r, flags) => flags.map((fl) => `${fl} (${flagText(r, fl)})`).join(', ');

/**
 * Judge one painting.
 * @param reading `readPose` result @param row the compiled table's row for it (or undefined) @param waiver the ledger row bound to its sha (or undefined)
 * @returns {{outcome: 'exempt'|'pass'|'waived'|'fail', failures: Array<{code: string, message: string}>, notes: string[], flags: string[], report: string[], proposed: string|null}}
 */
export function judgePainting(reading, row, waiver) {
  const verdict = bandVerdict(reading);
  const flags = verdict.flags.filter((x) => x !== 'unregistered');
  if (reading.solidity > BANDS.solidityMax) {
    return { outcome: 'fail', failures: [{ code: 'slab', message: 'the silhouette fills ' + (reading.solidity * 100).toFixed(0) + ' percent of its own bounding box: a rectangle is not a figure, whatever row it has' }], notes: [], flags, report: [], proposed: null };
  }
  if (reading.empty) {
    return { outcome: 'fail', failures: [{ code: 'empty', message: 'the painting has nothing opaque in it (no pixel over alpha 128): a transparent PNG is not art, whatever row it has' }], notes: [], flags, report: [], proposed: null };
  }
  // what a fresh install would write: it registers the painting first, so a missing row is not itself a reason for `blocked`
  const proposed = proposeStatus({ ...reading, hasRow: true }, { waived: !!waiver });
  const out = { outcome: 'pass', failures: [], notes: [], flags, report: verdict.report, proposed };
  const fail = (code, message) => out.failures.push({ code, message });
  // the hi-DPI masters beside the painting are part of it: a waiver covers a band, never a master left behind by a replaced painting
  for (const h of reading.hires ?? []) fail(h.code, h.message);
  if (verdict.exempt) return { ...out, outcome: out.failures.length ? 'fail' : 'exempt', flags: [], report: [] };
  const would = proposed ? ` (a fresh install would write status ${proposed}${flags.length ? `: ${flagsText(reading, flags)}` : ''})` : '';
  if (!reading.hasRow || !row) {
    if (waiver) fail('waiver-not-compiled', 'the ledger waives this painting but the compiled table has no row for it: run measure.py table (it writes a waived row from the ledger)');
    else fail('unregistered', `painted but not registered: no row in src/data/art/poseRegistration*.ts${would}`);
    return { ...out, outcome: 'fail' };
  }
  const { stale, missing } = diffStored(row, reading);
  if (missing.includes('status')) fail('no-status', `the registration row has no status${missing.includes('sha') ? ' and no sha' : ''} (written before the install did)${would}`);
  else if (!STATUSES.includes(row.status)) fail('no-status', `the registration row's status ${JSON.stringify(row.status)} is not one of ${STATUSES.join(', ')}`);
  if (missing.includes('sha') && !missing.includes('status')) fail('no-sha', 'the registration row has no sha of the painting it describes');
  const shaStale = !!row.sha && !shaMatches(row.sha, reading.sha);
  if (shaStale) fail('stale-sha', `the painting changed since the row was written (row ${row.sha}, file ${reading.sha.slice(0, 16)}): a re-installed painting is measured again and loses its waiver`);
  else for (const s of stale) fail('stale-reading', `the row stores what the pixels do not give: ${s}`);
  if (!out.failures.length || out.failures.every((x) => x.code === 'stale-reading')) {
    const inBand = flags.length === 0;
    if (row.status === 'blocked') {
      if (waiver) fail('waiver-not-compiled', 'the ledger waives this painting but the table still says blocked: run measure.py table');
      else fail('blocked', `blocked, not waived: ${flagsText(reading, flags) || 'out of band'}; repaint it, or a waiver row with Bailey's own quoted words`);
    } else if (row.status === 'waived') {
      if (!waiver) fail('waived-by-hand', `the table says waived but ${LEDGER_PATH} has no row for this sha: a waiver is generated from the ledger, never typed into a table`);
      else out.notes.push(inBand ? 'waiver no longer needed (the pose is in its band)' : `waived: ${flagsText(reading, flags)}`);
    } else if (!inBand) {
      fail('out-of-band', `${flagsText(reading, flags)}; the table says ${row.status}${waiver ? ' though the ledger waives it (regenerate the table)' : ''}`);
    }
  }
  return { ...out, outcome: out.failures.length ? 'fail' : row.status === 'waived' ? 'waived' : 'pass' };
}

const entryOf = (reading, row, waiver, j) => ({
  subject: reading.subject, pose: reading.pose, key: `${reading.subject}/${reading.pose}`, class: reading.class, kind: reading.kind, game: reading.game,
  outcome: j.outcome, status: row?.status ?? null, proposed: j.proposed, flags: j.flags, report: j.report, codes: j.failures.map((x) => x.code),
  stature: reading.stature, headReal: reading.headReal, lengthRatio: reading.lengthRatio, iou: reading.iou, held: reading.held,
  waived: !!waiver, legacy: waiver?.legacy === true, sha: reading.sha,
});

/**
 * Judge the paintings of an art folder.
 * @param {object} o
 * @param {string} [o.root] the repository (tables, records, the ledger) @param {string} [o.artDir] the art folder (default `<root>/public/art`)
 * @param {object} [o.inputs] model inputs (tests pass a synthetic table) @param {string[]} [o.subjects] only these subjects
 * @param {object|null} [o.ledger] the parsed ledger (default: read from `root`) @param {object|null} [o.ledgerBase] the ledger at a base ref (default: from `baseRef`)
 * @param {string} [o.baseRef] a git ref to compare the ledger with (a ref git cannot read is a `ledger-base` failure, never a skipped check)
 * @param {{dir?: string, mode?: 'full'|'stamp'}} [o.rigs] the rig root: a pose a gate-ok rig serves is reported `rigged` (`rig/rig-census.mjs`); the painting row stays the fallback and is judged as always
 * @param {Map<string,string>} [o.decisions] the decisions ledger's words by id (default: read from `root`), against which a waiver's quotation is verified
 * @returns {Promise<{artDir: string, subjects: number, paintings: number, entries: object[], failures: Array<{subject?: string, pose?: string, code: string, message: string}>, notes: Array<{subject?: string, pose?: string, message: string}>, ledger: object}>}
 */
export async function runGate({ root = ROOT, artDir, inputs, subjects, ledger, ledgerBase, baseRef, concurrency = 3, onSubject, decisions, pin, rigs } = {}) {
  const inp = inputs ?? (await loadModelInputs({ root, artDir, hires: true }));
  const failures = [];
  const notes = [];
  // ---- the ledger
  let parsed = ledger;
  const ledgerInfo = { exists: ledger !== undefined ? ledger !== null : false, rows: 0, legacy: 0, bailey: 0, problems: 0, stale: 0, base: 'none' };
  if (ledger === undefined) {
    const L = loadLedger(root);
    ledgerInfo.exists = L.exists;
    parsed = L.ledger;
    if (L.error) failures.push({ code: 'ledger-shape', message: L.error });
  }
  let index = new Map();
  if (parsed) {
    let base = null;
    if (ledgerBase !== undefined) {
      base = ledgerBase;
      ledgerInfo.base = ledgerBase ? 'ref' : 'none';
    } else if (baseRef) {
      const at = loadLedgerAtRef(root, baseRef);
      ledgerInfo.base = at.state;
      base = at.ledger;
      if (at.state === 'error') failures.push({ code: 'ledger-base', message: `${at.message}: the ledger cannot be compared with the one at ${baseRef}, so the ratchet's second half was not checked` });
      else if (at.state === 'absent') notes.push({ message: `${LEDGER_PATH} does not exist at ${baseRef} (the first build with a ledger): nothing to compare with; the legacy seal pinned in tools/pose-gate-ledger.mjs is the check` });
    }
    if (ledgerInfo.base === 'none') notes.push({ message: 'no base ref was given: the ledger was not compared with the one that is live; the legacy seal pinned in tools/pose-gate-ledger.mjs still holds (give --base <ref>, or POSE_GATE_BASE)' });
    // the legacy seal is pinned for THIS repository's ledger; another root (a test's fake repository) is judged by its own seal
    const sealPin = pin !== undefined ? pin : resolve(root) === ROOT ? LEGACY_SEAL_DIGEST : null;
    const v = validateLedger(parsed, { base, decisions: decisions !== undefined ? decisions : loadDecisionWords(root), pin: sealPin });
    index = v.index;
    Object.assign(ledgerInfo, v.counts, { problems: v.problems.length });
    for (const p of v.problems) failures.push(p);
  } else if (!ledgerInfo.exists) {
    notes.push({ message: `${LEDGER_PATH} does not exist: nothing is waived (node tools/pose-gate.mjs --write-legacy writes it once)` });
  }
  // ---- the paintings
  const all = listSubjects(inp);
  const wanted = subjects ?? all;
  for (const s of wanted) if (!all.includes(s)) failures.push({ subject: s, code: 'unknown-subject', message: `no characters/${s} folder under the art folder` });
  const read = await readSubjects(inp, wanted.filter((s) => all.includes(s)), { concurrency, onSubject });
  const readings = read.readings;
  for (const e of read.errors.sort((a, b) => (a.subject < b.subject ? -1 : 1))) failures.push({ subject: e.subject, pose: '*', code: 'unreadable', message: `the paintings of ${e.subject} cannot be read, so the gate cannot vouch for them: ${e.message}` });
  const entries = [];
  const seen = new Set();
  for (const r of readings) {
    const row = inp.table[r.subject]?.[r.pose];
    const k = waiverKey(r.subject, r.pose, r.sha);
    seen.add(k);
    const waiver = index.get(k);
    const j = judgePainting(r, row, waiver);
    entries.push(entryOf(r, row, waiver, j));
    for (const x of j.failures) failures.push({ subject: r.subject, pose: r.pose, ...x });
    for (const n of j.notes) notes.push({ subject: r.subject, pose: r.pose, message: n });
  }
  if (!subjects) {
    for (const [k, row] of index) if (!seen.has(k)) { ledgerInfo.stale++; notes.push({ subject: row.subject, pose: row.pose, message: `stale waiver: no painting of ${row.subject}/${row.pose} has sha ${row.sha.slice(0, 16)} any more (remove the row)` }); }
  }
  const rigReport = await applyRigs({ entries, inputs: inp, ...(rigs ?? {}) });
  for (const r of rigReport) if (!r.ok) notes.push({ subject: r.subject, message: `rig not counted (${r.why}): its poses stay paintings` });
  return { artDir: inp.artDir, subjects: new Set(entries.map((e) => e.subject)).size, paintings: entries.length, entries, failures, notes, ledger: ledgerInfo, rigs: rigReport };
}

/** One line per failure: `subject/pose  code  message` (or `ledger  code  message`). */
export function formatFailure(x) {
  return `${x.subject ? `${x.subject}/${x.pose ?? '*'}` : 'ledger'}  ${x.code}  ${x.message}`;
}

/** `{code: n}` over a list of failures. */
export function countByCode(failures) {
  const by = {};
  for (const x of failures) by[x.code] = (by[x.code] ?? 0) + 1;
  return by;
}

/**
 * The census: totals, the out-of-band list, what is report-only, per subject, the ledger. JSON-safe and free of local paths (the critic and the artifact record keep it).
 * `full` adds one entry per painting.
 */
export function censusReport(result, { full = false } = {}) {
  const count = (key) => result.entries.reduce((m, e) => ((m[e[key] ?? 'none'] = (m[e[key] ?? 'none'] ?? 0) + 1), m), {});
  const bySubject = {};
  for (const e of result.entries) {
    const s = (bySubject[e.subject] ??= { game: e.game, kind: e.kind, paintings: 0, pass: 0, waived: 0, rigged: 0, fail: 0, exempt: 0 });
    s.paintings++;
    s[e.outcome]++;
  }
  const reportOnly = {};
  for (const e of result.entries) for (const t of e.report) (reportOnly[t] ??= []).push(e.key);
  const slim = (e) => ({ key: e.key, class: e.class, status: e.status, proposed: e.proposed, flags: e.flags, stature: e.stature, headReal: e.headReal, waived: e.waived, legacy: e.legacy, game: e.game });
  return {
    schema: 'pose-gate-report/1',
    tool: 'tools/pose-gate.mjs',
    bands: BANDS,
    totals: {
      subjects: result.subjects, paintings: result.paintings,
      pass: result.entries.filter((e) => e.outcome === 'pass').length, waived: result.entries.filter((e) => e.outcome === 'waived').length, rigged: result.entries.filter((e) => e.outcome === 'rigged').length,
      fail: result.entries.filter((e) => e.outcome === 'fail').length, exempt: result.entries.filter((e) => e.outcome === 'exempt').length,
      byClass: count('class'), byGame: count('game'), byRowStatus: count('status'),
    },
    failuresByCode: countByCode(result.failures),
    failures: result.failures.map((x) => ({ key: x.subject ? `${x.subject}/${x.pose}` : 'ledger', code: x.code, message: scrubPath(x.message, result.artDir) })),
    outOfBand: result.entries.filter((e) => e.flags.length).map(slim),
    reportOnly,
    ledger: result.ledger,
    rigs: result.rigs ?? [],
    subjects: bySubject,
    ...(full ? { entries: result.entries } : {}),
  };
}

/**
 * The paintings `--write-legacy` waives: every non-exempt painting that is out of its band (or that nobody registered) in this census, except the subjects named.
 * @returns {Array<{subject: string, pose: string, sha: string, flags: string[]}>}
 */
export function legacyPaintings(result, { except = [] } = {}) {
  return result.entries
    .filter((e) => e.outcome !== 'exempt' && !except.includes(e.subject) && (e.flags.length > 0 || e.codes.includes('unregistered')))
    .map((e) => ({ subject: e.subject, pose: e.pose, sha: e.sha, flags: e.codes.includes('unregistered') ? ['unregistered', ...e.flags] : e.flags }));
}

/** The `characters/<subject>/<pose>` paintings a build ships (`<dist>/art/characters/<subject>/<pose>.png|.webp`; no `@2x` masters, no sidecars). */
export function listBuiltPaintings(distDir) {
  const base = join(distDir, 'art', 'characters');
  const out = [];
  if (!existsSync(base)) return out;
  for (const d of readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const file of readdirSync(join(base, d.name))) {
      const m = /^([^@.]+)\.(png|webp)$/.exec(file);
      if (m) out.push({ subject: d.name, pose: m[1], file: `art/characters/${d.name}/${file}` });
    }
  }
  return out.sort((a, b) => (a.file < b.file ? -1 : 1));
}

/**
 * The build's art list against a gate result: a character painting the build ships must be one the gate read from a master and found passing or waived. (The
 * result must come from the whole art folder; a failing painting is already in `result.failures`, so it is not counted twice.)
 * @returns {Array<{subject: string, pose: string, code: string, message: string}>}
 */
export function checkBuilt(built, result) {
  const byKey = new Map(result.entries.map((e) => [e.key, e]));
  const out = [];
  for (const b of built) {
    const e = byKey.get(`${b.subject}/${b.pose}`);
    if (!e) out.push({ subject: b.subject, pose: b.pose, code: 'built-unvetted', message: `the build ships ${b.file} but the gate read no master for it under ${'public/art'}` });
  }
  return out;
}

/**
 * The masters of the paintings the build ships are still the files the gate read: `public/art` is shared with the art fleet and the build copies it minutes after
 * stage one, so a master written in between would ship unjudged. The build's pixels are proved equal to the master's by `verifyShippedArt` (at about this time); this
 * proves the master is the one that was gated.
 * @returns {Array<{subject: string, pose: string, code: string, message: string}>}
 */
export function checkMastersUnchanged(built, result) {
  const byKey = new Map(result.entries.map((e) => [e.key, e]));
  const out = [];
  for (const b of built) {
    const e = byKey.get(`${b.subject}/${b.pose}`);
    if (!e) continue; // built-unvetted already
    const file = join(result.artDir, 'characters', b.subject, `${b.pose}.png`);
    const now = existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null;
    if (now !== e.sha) out.push({ subject: b.subject, pose: b.pose, code: 'master-changed', message: `${b.subject}/${b.pose}.png is not the painting the gate read (gated ${e.sha.slice(0, 12)}, now ${now ? now.slice(0, 12) : 'missing'}): it changed after stage one, so the build ships a painting nobody judged` });
  }
  return out;
}

/**
 * The deploy's first stage: judge every character painting of `public/art` and end the deploy (`fail` throws or exits) on any failure. `tools/deploy-pages.mjs`
 * calls it before the build, outside the `--skip-tests` branch and before the release gate that `--owner-override` reaches, so neither flag covers it.
 * `baseRef` (the last deployed sha) lets the ledger's ratchet compare with the ledger that was live.
 * @returns {Promise<object>} the gate result (stage two reads it)
 */
export async function enforcePoseGate({ root = ROOT, artDir, baseRef, log = console.log, fail, rigs } = {}) {
  let result;
  try {
    result = await runGate({ root, artDir, baseRef: baseRef ?? undefined, rigs });
  } finally {
    sharp.concurrency(0); // the pose model throttles the decoder and turns its cache off; the deploy's own decode-checks later in this process get the defaults back
    sharp.cache(true);
  }
  const waived = result.entries.filter((e) => e.outcome === 'waived').length;
  log(`pose gate: ${result.paintings} paintings of ${result.subjects} subjects, ${waived} waived${rigs ? `, ${result.entries.filter((e) => e.outcome === 'rigged').length} rigged` : ''}, ${result.failures.length} failure(s); ledger ${result.ledger.exists ? `${result.ledger.rows} row(s) (${result.ledger.legacy} legacy)` : 'absent'}`);
  if (!result.paintings) fail(`the pose gate read no character painting under ${result.artDir}: it cannot vouch for an empty art folder (is public/art the art folder, with characters/ in it?)`);
  if (result.failures.length) {
    for (const x of result.failures.slice(0, 25)) log(`  ${formatFailure(x)}`);
    if (result.failures.length > 25) log(`  ... and ${result.failures.length - 25} more (node tools/pose-gate.mjs --check lists them all)`);
    fail(poseGateRefusal(result.failures, 'before the build, on public/art'));
  }
  return result;
}

/**
 * The deploy's second stage: the art list of the build (`<dist>/art/characters`) holds only paintings stage one read from a master and passed or found waived.
 * @returns {Array<{subject: string, pose: string, file: string}>} the character paintings the build ships
 */
export function enforceBuiltPaintings({ dist, result, log = console.log, fail }) {
  const built = listBuiltPaintings(dist);
  const unvetted = [...checkBuilt(built, result), ...checkMastersUnchanged(built, result)];
  log(`pose gate (the build): ${built.length} character paintings shipped, ${unvetted.length} the gate did not read or that changed since it did`);
  if (unvetted.length) {
    for (const x of unvetted.slice(0, 25)) log(`  ${formatFailure(x)}`);
    fail(poseGateRefusal(unvetted, 'on the built art list'));
  }
  return built;
}

/** What the deploy says when the gate refuses. `--owner-override` and `--skip-tests` do not cover it. */
export function poseGateRefusal(failures, stage) {
  const by = Object.entries(countByCode(failures)).map(([c, n]) => `${n} ${c}`).join(', ');
  return `the pose gate refuses this deploy (${stage}): ${failures.length} failure(s) (${by}). No painting ships without a fresh pose record or a waiver: a row in ${LEDGER_PATH} that carries Bailey's own quoted words is the only way through; --owner-override and --skip-tests do not cover it. Run: node tools/pose-gate.mjs --check`;
}
