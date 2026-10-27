// Which continuity harness read a run, and is it the release tree's own (post-conference motion plan, step 0; both games, critic plumbing).
//
// The continuity harness (CHK-026, CHK-027) drifted three times, and each time the tool moved a number, not the game: round 28 read a stale pose table
// (PR-0512), release 63 hashed a CRLF copy of the right one (R63-T1), and round 29 ran from an old tree (D:/pyrefly-r39-int, 2026-10-10) that cannot see the
// engine's planned smear cuts, so it called 0 snaps a minute 4.67 and 7.51. Nothing in a report said which tool had read it. Now:
//
//   1. Every continuity run STAMPS its own identity into its output (continuity.json per chapter, `harness` in continuity-summary.json):
//        - the git blob id of every file the harness runs (the import closure of continuity.mjs and route.mjs, CRLF read as LF, so a checkout with
//          core.autocrlf and the commit agree), the digest of those, and the tree's HEAD and which of those files differ from it;
//        - the hash of the policy's `continuity` block (what the thresholds were) and whether CONT_CFG, an experiment, changed it;
//        - the probe's version and blob, and the pose table's sha256 with CRLF read as LF (the table the run really read, as the harness loaded it).
//   2. `harnessIdentityErrors` is what critic-clear, critic-score and the deploy gate ask (through `validateReport`): a deep, focused or milestone report dated
//      on or after `continuity.harnessIdentity.requiredFrom` that carries a continuity aggregate must carry the stamp, the stamp must be consistent (its digest
//      is recomputed from its own file list), the run must not have changed its own files while it ran, CONT_CFG must not have been set, the harness id must be
//      the id of the release tree's own harness (the tree the tool is run in, or `--harness-tree`), and the pose table must be the table of the build's own commit.
//      A report that fails any of these is refused with a sentence that says what to run instead.
//   3. `node tools/continuity-id.mjs` prints the identity of a tree, `--check <file>` asks the same question of a summary, and `--embed <summary> --into <report>`
//      copies the summary into a report (the stamp is 3.5 KB of blob ids: nobody retypes it).
//   4. The stamp also carries `aggregateSha256`, the digest of the `checks`, `size` and `motion` objects the harness wrote under it, so a stamp pasted next to other
//      numbers (a graft, a hand edit) is refused (review F3).
//
// What is left out of the identity on purpose: this file, `tools/critic-policy.mjs` and `tools/critic-continuity-caps.mjs` (the verdict side: they change for
// reasons that do not move a measurement), the pose table (its own field, checked against the build's commit, because art installs change it), the tree's HEAD, and
// in the policy's `continuity` block every `note` and `*Note` key and the verdict-side keys (`caps`, `checks`, `requiredFrom`, `harnessIdentity`): rewording a note
// must not make every earlier stamp stale (review F2). Recorded but not part of the id: the pose-waiver ledger's hash and the run's PYREFLY_QUERY / ROUTE_SETART /
// PYREFLY_BROWSER (review F10).
// Pure apart from the file and git reads. Game case: both (shared critic plumbing).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const STAMP_SCHEMA = 'continuity-harness/1';
/** The two programs a continuity run starts: the harness (parent) and the route it spawns (child). The identity is their import closure. */
export const HARNESS_ENTRIES = ['critic/runner/lib/continuity.mjs', 'critic/runner/lib/route.mjs'];
/** Imported by the harness but not part of what it measures; never traversed. */
export const HARNESS_LEFT_OUT = ['tools/critic-harness-identity.mjs', 'tools/critic-policy.mjs', 'tools/critic-continuity-caps.mjs'];
const POLICY_REL = 'critic/policy.json';
const TABLE_REL = 'docs/target/pose-measure.json';
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)|import\s*['"](\.[^'"]+)['"]/g;

const posix = (p) => p.split(path.sep).join('/');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/** CRLF read as LF (the same rule as `tableSha256`). */
function lfBytes(buf) {
  const out = Buffer.alloc(buf.length);
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (!(buf[i] === 0x0d && buf[i + 1] === 0x0a)) out[n++] = buf[i];
  return out.subarray(0, n);
}

/** The git blob id of a file's bytes with CRLF read as LF: what `git hash-object` says for the committed file. */
export function blobId(bytes) {
  const body = lfBytes(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
  return createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
}

/** JSON with sorted keys, so two copies of one block hash alike. */
export function canonicalJson(v) {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

/** Every file the harness runs, relative to `root`, sorted: the relative-import closure of the entries, minus HARNESS_LEFT_OUT. A missing entry is simply absent. */
export function harnessFiles(root, entries = HARNESS_ENTRIES, leftOut = HARNESS_LEFT_OUT) {
  const skip = new Set(leftOut.map((f) => path.resolve(root, f)));
  const seen = new Set();
  const queue = entries.map((f) => path.resolve(root, f)).filter((f) => fs.existsSync(f));
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || skip.has(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(IMPORT_RE)) {
      const target = path.resolve(path.dirname(file), m[1] ?? m[2] ?? m[3]);
      if (fs.existsSync(target) && fs.statSync(target).isFile()) queue.push(target);
    }
  }
  return [...seen].map((f) => posix(path.relative(root, f))).filter((f) => !f.startsWith('..')).sort();
}

/**
 * The pose table as commit `sha` has it (sha256 with CRLF read as LF, subject count), or null when git cannot give it. The same reading as `candidateTableAt` in
 * critic/runner/lib/continuity-table.mjs (tests/unit/critic-harness-identity.test.ts pins that they agree); it lives here so this file imports nothing from the harness's
 * own tree and works in a copy of tools/ alone (the deploy's dry-run tests copy it).
 */
export function tableAtCommit(root, sha, run = execFileSync) {
  if (!root || !sha || !/^[0-9a-f]{7,40}$/i.test(sha)) return null;
  try {
    const raw = run('git', ['-C', root, 'show', `${sha}:${TABLE_REL}`], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw));
    return { sha256: sha256(lfBytes(buf)), count: Object.keys(JSON.parse(buf.toString('utf8')).subjects ?? {}).length };
  } catch {
    return null;
  }
}

/** The digest the stamp is known by: the file list with blob ids, and the policy block's hash. */
export function harnessDigest(files, policySha256) {
  const lines = Object.keys(files).sort().map((f) => `${f}\t${files[f]}`);
  return sha256(`${STAMP_SCHEMA}\n${lines.join('\n')}\npolicy.continuity\t${policySha256 ?? 'none'}\n`);
}

/** Top-level keys of the policy's continuity block that are the verdict side (read by critic-continuity-caps, the gate itself), not what the harness measures with. */
const VERDICT_KEYS = new Set(['harnessIdentity', 'caps', 'checks', 'requiredFrom']);
const isNote = (k) => k === 'note' || k.endsWith('Note');
/** The continuity block as the harness measures with it: no notes at any depth, none of the verdict-side keys. */
export function measuredBlock(v, top = true) {
  if (Array.isArray(v)) return v.map((x) => measuredBlock(x, false));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !isNote(k) && !(top && VERDICT_KEYS.has(k))).map(([k, x]) => [k, measuredBlock(x, false)]));
  return v;
}

function policyBlock(root, env) {
  let file = null;
  let block = null;
  try {
    const raw = fs.readFileSync(path.join(root, POLICY_REL));
    file = sha256(lfBytes(raw));
    block = canonicalJson(measuredBlock(JSON.parse(raw.toString('utf8')).continuity ?? {}));
  } catch { /* no policy: recorded as none */ }
  return { continuitySha256: block === null ? null : sha256(block), fileSha256: file, override: Boolean(env.CONT_CFG), overrideSha256: env.CONT_CFG ? sha256(String(env.CONT_CFG)) : null };
}

/**
 * The identity of the harness in the tree at `root`.
 * @param {string} root
 * @param {{ run?: typeof execFileSync, env?: Record<string, string | undefined>, poseTable?: object | null, waivers?: object | null }} [opts] `poseTable` is what the run really loaded: { path, sha256, subjects, source, buildSha, isCandidate }; `waivers` the ledger it read: { path, sha256, rows }.
 */
export function harnessIdentity(root, { run = execFileSync, env = process.env, poseTable = null, waivers = null } = {}) {
  const names = harnessFiles(root);
  const files = {};
  for (const f of names) files[f] = blobId(fs.readFileSync(path.join(root, f)));
  const git = (args) => { try { return String(run('git', ['-C', root, ...args], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 })); } catch { return null; } };
  const head = git(['rev-parse', 'HEAD'])?.trim() || null;
  const status = head ? git(['status', '--porcelain', '--', ...names]) : null;
  const policy = policyBlock(root, env);
  const probeSrc = fs.existsSync(path.join(root, 'critic/runner/lib/continuity-probe.mjs')) ? fs.readFileSync(path.join(root, 'critic/runner/lib/continuity-probe.mjs'), 'utf8') : '';
  return {
    schema: STAMP_SCHEMA,
    id: harnessDigest(files, policy.continuitySha256),
    tree: { root: posix(path.resolve(root)), head, dirty: status === null ? null : status.split(/\r?\n/).map((l) => l.slice(3).trim()).filter(Boolean) },
    files,
    policy,
    probe: { version: Number(/\bversion:\s*(\d+)/.exec(probeSrc)?.[1] ?? 0) || null, blob: files['critic/runner/lib/continuity-probe.mjs'] ?? null },
    poseTable,
    waivers,
    run: { query: env.PYREFLY_QUERY || null, setArt: env.ROUTE_SETART || null, browser: env.PYREFLY_BROWSER || null }, // recorded, not part of the id (review F10)
    changedDuringRun: false,
  };
}

/** sha256 of a file with CRLF read as LF, or null when it cannot be read (the pose-waiver ledger's hash for a stamp). */
export function fileSha256(file) {
  try { return sha256(lfBytes(fs.readFileSync(file))); } catch { return null; }
}

/** The digest of the numbers a stamp was made beside: the `checks`, `size` and `motion` objects of a summary (or of a report's `continuity`), read back from JSON so an in-memory object and a parsed file agree. */
export function aggregateDigest(agg) {
  return sha256(canonicalJson(JSON.parse(JSON.stringify({ checks: agg?.checks ?? null, size: agg?.size ?? null, motion: agg?.motion ?? null }))));
}

/**
 * The `harness` block of continuity-summary.json: the stamp taken before the first chapter, completed with what the chapters' own processes said, how the run ended and the digest of the numbers.
 * @param {{ stamp0: object, stampEnd: object, results: object[], tableStamp: object | null, staleChapters?: string[], aggregate: object }} p
 */
export function summaryStamp({ stamp0, stampEnd, results, tableStamp, staleChapters = [], aggregate }) {
  const stamped = results.filter((r) => r.harness?.id);
  const byOther = stamped.filter((r) => r.harness.id !== stamp0.id).map((r) => r.chapter);
  const builds = results.map((r) => r.poseMeasure?.buildSha).filter(Boolean);
  return {
    ...stamp0,
    policy: { ...stamp0.policy, override: Boolean(stamp0.policy.override || results.some((r) => r.harness?.policy?.override)) }, // a chapter run under CONT_CFG counts even if this process was clean (review F5)
    chapterIds: [...new Set(stamped.map((r) => r.harness.id))],
    unstamped: results.filter((r) => r.summary && !r.harness).map((r) => r.chapter),
    chaptersByOtherHarness: byOther,
    changedDuringRun: stampEnd.id !== stamp0.id || byOther.length > 0,
    poseTable: tableStamp ? { ...tableStamp, buildSha: builds[0] ?? null, isCandidate: staleChapters.length ? false : results.some((r) => r.poseMeasure?.isCandidate === true) ? true : null } : null,
    waivers: stamped.map((r) => r.harness.waivers).find(Boolean) ?? null,
    aggregateSha256: aggregateDigest(aggregate),
  };
}

/** Is a stamp internally consistent (the digest is the digest of its own file list and policy hash)? Returns problems. */
export function verifyStamp(h) {
  if (!h || typeof h !== 'object') return ['the stamp is not an object'];
  if (h.schema !== STAMP_SCHEMA) return [`the stamp's schema is ${JSON.stringify(h.schema)}, not ${STAMP_SCHEMA}`];
  if (!h.files || typeof h.files !== 'object' || !Object.keys(h.files).length) return ['the stamp lists no harness files'];
  if (typeof h.id !== 'string' || h.id !== harnessDigest(h.files, h.policy?.continuitySha256)) return ['the stamp\'s id is not the digest of its own file list and policy hash (edited or mis-copied)'];
  // the id does not cover these fields, and the rules below read them: a wrong shape is a refusal, never a TypeError out of validateReport (review F7)
  const shape = [];
  if (!h.policy || typeof h.policy !== 'object') shape.push('"policy" is not an object');
  if (h.tree != null && typeof h.tree !== 'object') shape.push('"tree" is not an object');
  if (h.poseTable != null && typeof h.poseTable !== 'object') shape.push('"poseTable" is not an object');
  for (const k of ['unstamped', 'chapterIds', 'chaptersByOtherHarness']) if (h[k] != null && !(Array.isArray(h[k]) && h[k].every((x) => typeof x === 'string'))) shape.push(`"${k}" is not a list of chapter ids`);
  if (h.changedDuringRun != null && typeof h.changedDuringRun !== 'boolean') shape.push('"changedDuringRun" is not true or false');
  return shape.length ? [`the stamp is malformed: ${shape.join('; ')}`] : [];
}

/** How two stamps differ: the files whose blob ids differ (or are on one side only), and the policy hash. */
export function compareIdentity(stamped, expected) {
  const paths = [...new Set([...Object.keys(stamped?.files ?? {}), ...Object.keys(expected?.files ?? {})])].sort();
  const files = paths.filter((p) => stamped?.files?.[p] !== expected?.files?.[p]).map((p) => ({ path: p, stamped: stamped?.files?.[p] ?? null, expected: expected?.files?.[p] ?? null }));
  const policy = (stamped?.policy?.continuitySha256 ?? null) !== (expected?.policy?.continuitySha256 ?? null);
  return { same: stamped?.id === expected?.id, files, policy };
}

const short = (s, n = 9) => (typeof s === 'string' ? s.slice(0, n) : 'none');
const dirtyNote = (h) => (h?.tree?.dirty?.length ? ` (${h.tree.dirty.length} harness file(s) modified since HEAD)` : '');

/** One line that names the tool, for a report line and for the CLI. */
export function describeIdentity(h) {
  const t = h.poseTable;
  return `harness ${short(h.id, 12)} (${Object.keys(h.files ?? {}).length} files; tree ${h.tree?.root ?? '?'} at ${short(h.tree?.head, 9)}${dirtyNote(h)}; policy ${short(h.policy?.continuitySha256, 8)}${h.policy?.override ? ' OVERRIDDEN BY CONT_CFG' : ''}; probe v${h.probe?.version ?? '?'} ${short(h.probe?.blob, 8)}; pose table ${t ? `${short(t.sha256, 8)} (${t.subjects ?? '?'} subjects)` : 'not loaded'}${h.waivers?.sha256 ? `; waivers ${short(h.waivers.sha256, 8)} (${h.waivers.rows ?? '?'} rows)` : ''}${h.run?.query ? `; PYREFLY_QUERY=${h.run.query}` : ''})`;
}


const PREFIX = 'continuity harness identity';
const CONTINUITY_CHECKS = /^CHK-02[67]$/;

/**
 * Refuse a continuity aggregate read by a tool that is not the release tree's own. Returns error strings; empty means the report is fine (or the rule does not apply).
 * Never throws: a stamp it cannot read is itself a refusal (review F7).
 * @param {object} report a critic report
 * @param {object} policy the loaded critic policy
 * @param {{ root?: string | null, explicitTree?: boolean, chapterStamp?: boolean, identity?: object | null, candidateTable?: (root: string, sha: string) => ({ sha256: string, count: number } | null) }} [opts]
 *   `root` is the release tree whose harness is the reference (when absent only the stamp's own consistency is checked); `explicitTree` says it was named with --harness-tree, which
 *   must then be a tree whose harness files match its HEAD; `chapterStamp` asks about a per-chapter continuity.json (no aggregate digest in it); `identity` and `candidateTable` are for tests.
 */
export function harnessIdentityErrors(report, policy, opts = {}) {
  try {
    return identityErrors(report, policy, opts);
  } catch (e) {
    return [`${PREFIX}: the stamp could not be read (${String(e?.message ?? e).slice(0, 120)}). Copy the "harness" object of continuity-summary.json unchanged (node tools/continuity-id.mjs --embed does it).`];
  }
}

function identityErrors(report, policy, opts) {
  const gate = policy?.continuity?.harnessIdentity;
  if (!gate) return [];
  const from = new Date(`${gate.requiredFrom}T00:00:00.000Z`).getTime();
  const when = new Date(report?.date ?? '').getTime();
  if (Number.isNaN(from) || Number.isNaN(when) || when < from) return [];
  const agg = report?.continuity;
  if (!agg || typeof agg !== 'object') {
    // CHK-026 and CHK-027 come only from the harness: a PASS or FAIL with no aggregate has no tool behind it (review F4)
    const recorded = (Array.isArray(report?.checks) ? report.checks : []).filter((c) => CONTINUITY_CHECKS.test(String(c?.id)) && /^(PASS|FAIL)$/.test(String(c?.result)));
    return recorded.length ? [`${PREFIX}: the report records ${recorded.map((c) => `${c.id} ${c.result}`).join(' and ')} but carries no continuity aggregate (report.continuity), so nothing says which tool measured it. Since ${gate.requiredFrom} those two checks come only from the harness: put its summary and "harness" stamp in report.continuity (node tools/continuity-id.mjs --embed <continuity-summary.json> --into <report.json>), or record both UNVERIFIED with the reason.`] : [];
  }
  const h = agg.harness;
  if (!h) return [`${PREFIX}: report.continuity carries no "harness" block. Since ${gate.requiredFrom} every continuity aggregate must say which tool read the run: copy the "harness" object of continuity-summary.json into report.continuity unchanged (node tools/continuity-id.mjs --embed <continuity-summary.json> --into <report.json> does it). A summary from a harness older than this rule has no stamp: run the harness again from the release tree (node tools/continuity-id.mjs prints its identity).`];
  const bad = verifyStamp(h);
  if (bad.length) return bad.map((b) => `${PREFIX}: ${b}. Copy the "harness" object of continuity-summary.json unchanged (node tools/continuity-id.mjs --embed does it).`);
  const errors = [];
  if (h.changedDuringRun) {
    errors.push(h.chaptersByOtherHarness?.length
      ? `${PREFIX}: ${h.chaptersByOtherHarness.join(', ')} ${h.chaptersByOtherHarness.length === 1 ? 'was' : 'were'} measured by another harness than the one that started the run (${short(h.id, 12)}; the chapters' own stamps say ${(h.chapterIds ?? []).map((i) => short(i, 12)).join(', ')}), so no single tool read this summary. Run those chapters again from the release tree.`
      : `${PREFIX}: the harness's own files changed while the run was going (the run began with ${short(h.id, 12)}), so no single tool read it. Run it again without editing the tree.`);
  }
  if (h.unstamped?.length) errors.push(`${PREFIX}: ${h.unstamped.join(', ')} ${h.unstamped.length === 1 ? 'was' : 'were'} measured by a run that left no stamp (an older harness, re-aggregated here), so this summary's numbers were not all read by the tool it names. Run those chapters again from the release tree.`);
  if (h.policy?.override) errors.push(`${PREFIX}: the run was made with CONT_CFG set, which is an experiment (a review never sets it). Run it again without CONT_CFG.`);
  const root = opts.root ?? null;
  if (root || opts.identity) {
    const expected = opts.identity ?? harnessIdentity(root);
    if (opts.explicitTree && expected.tree?.dirty?.length) errors.push(`${PREFIX}: REFUSED. The tree named with --harness-tree (${expected.tree.root}) has harness files that differ from its HEAD (${expected.tree.dirty.slice(0, 4).join(', ')}${expected.tree.dirty.length > 4 ? ', and more' : ''}): it is not a reference. Name a clean release tree, or run the harness again.`);
    const diff = compareIdentity(h, expected);
    if (!diff.same) {
      const names = diff.files.slice(0, 8).map((f) => `${f.path} (stamped ${short(f.stamped, 8)}, release tree ${short(f.expected, 8)})`).join('; ');
      errors.push(`${PREFIX}: REFUSED. The harness that read this run is not the release tree's own. It ran from ${h.tree?.root ?? '?'} at ${short(h.tree?.head)}${dirtyNote(h)} (id ${short(h.id, 12)}); the release tree ${expected.tree?.root ?? '?'} at ${short(expected.tree?.head)}${dirtyNote(expected)} has id ${short(expected.id, 12)}. ${diff.files.length ? `${diff.files.length} harness file(s) differ: ${names}${diff.files.length > 8 ? '; and more' : ''}.` : ''}${diff.policy ? ' The policy continuity block differs.' : ''} Run node critic/runner/lib/continuity.mjs from the release tree (add --candidate-root=<the candidate's tree> when the candidate is another tree) and embed its summary (node tools/continuity-id.mjs --embed); never copy a stamp from another tree's output or retype one. Only when it is the release tree that is behind may the report be settled from the clean tree that ran the harness (--harness-tree <dir>). Round 29 (2026-10-25) read a build with a 2026-10-10 harness and reported 4.67 and 7.51 snaps a minute where the release tree's reads 0.`);
    }
    const t = h.poseTable;
    const sha = report.build?.mainSha;
    if (t?.sha256 && sha && root) {
      const mine = (opts.candidateTable ?? tableAtCommit)(root, sha);
      if (mine && mine.sha256 !== t.sha256) errors.push(`${PREFIX}: the pose-measure table this run read (sha256 ${short(t.sha256, 12)}, ${t.subjects ?? '?'} subjects, CRLF read as LF) is not the table of build commit ${short(sha)} (sha256 ${short(mine.sha256, 12)}, ${mine.count} subjects), so CHK-026 was read against someone else's registrations. Run the harness again with --candidate-root=<a tree at that commit>.`);
    }
  }
  if (!opts.chapterStamp) {
    const mine = aggregateDigest(agg);
    if (typeof h.aggregateSha256 !== 'string') errors.push(`${PREFIX}: the stamp carries no digest of the numbers it was made beside (aggregateSha256): it comes from a harness older than the digest, or the block was built by hand. Run the harness again from the release tree.`);
    else if (h.aggregateSha256 !== mine) errors.push(`${PREFIX}: the checks, size and motion in this report are not the numbers the harness wrote under this stamp (their digest is ${short(mine, 12)}, the stamp says ${short(h.aggregateSha256, 12)}): the stamp was pasted beside other numbers, or the numbers were edited. Copy the summary unchanged (node tools/continuity-id.mjs --embed <continuity-summary.json> --into <report.json>).`);
  }
  return errors;
}
