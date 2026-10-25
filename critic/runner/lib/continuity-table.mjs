// Continuity harness: WHICH pose-measure table CHK-026 is judged against, and whether it is the candidate's (release 62, PR-0512; both games, critic tooling).
//
// Round 28 (the deep review of release 61): the gap pass's continuity runs read the review tree's own `docs/target/pose-measure.json` (78 subjects) and not the candidate's (114),
// so four chapters failed CHK-026 on registrations the candidate had already replaced (24.2, 39.1, 32.6 and 37.6 percent), and the same chapters passed with the candidate's table.
// The harness took whichever table sat in the tree it was started from and never said which. Now:
//
//   1. The table is resolved in one place, in this order, and the SOURCE is recorded with the run (continuity.json and the summary):
//        --pose-measure=<file>          explicit
//        --candidate-root=<repo root>   the candidate's tree: its docs/target/pose-measure.json (the older spelling `--pose-measure-from=` is the same)
//        (nothing)                      the tree the harness was started from (the release runners start it in the candidate's tree, `deep.js`, `focused.js`)
//   2. The page tells the harness which commit the build is made from (the title's build tag, `Release 61 · 660c19bb`, `src/app/changelog/buildInfo.ts`). The candidate's own table is the
//      file as that commit has it (`git show <commit>:docs/target/pose-measure.json`, any worktree of the repository can read it). When the table the harness loaded is not that file, CHK-026
//      is UNVERIFIED with the reason in plain words, never a PASS or a FAIL read against someone else's table: the run still records everything it measured. `--allow-stale-pose-table`
//      keeps the verdict and records the mismatch (for a rerun whose table was chosen on purpose).
//   3. A build whose commit the table's repository does not know (a source archive, a tree of another clone) cannot be checked: the run says "not checked" and keeps the verdict.
//
// Pure apart from `candidateTableAt`, which runs `git`. Game case: both (shared critic plumbing).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** The table's place inside a repository. */
export const POSE_MEASURE_REL = ['docs', 'target', 'pose-measure.json'];

/**
 * The sha256 a table is known by: its bytes with every CRLF read as LF (R63-T1, the release 63 focused review). A worktree checked out with `core.autocrlf=true` holds the table with CRLF line
 * endings (sha e648ba9ec14f at release 63) while the commit has it with LF (9f168c0f1dc4): the same registrations, and the harness called it "not the candidate's table", made CHK-026 UNVERIFIED
 * and read the aggregate as 0 s of battle, so a run needed `--pose-measure=<LF copy>`. Both sides (the file loaded, `loadPoseMeasure`, and the commit's, `candidateTableAt`) are hashed here, so a
 * line ending can never make two copies of one table differ; any other byte that differs still does.
 * @param {Buffer|Uint8Array|string} bytes
 */
export function tableSha256(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const out = Buffer.alloc(buf.length);
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (!(buf[i] === 0x0d && buf[i + 1] === 0x0a)) out[n++] = buf[i];
  return createHash('sha256').update(out.subarray(0, n)).digest('hex');
}

/**
 * Which table file a run reads, and why.
 * @param {{ args: Record<string, unknown>, root: string, exists?: (file: string) => boolean }} input `root` is the tree the harness was started from.
 * @returns {{ path: string | null, source: 'explicit' | 'candidate-root' | 'harness-tree' | 'none', root: string | null }}
 */
export function resolvePoseMeasure({ args, root, exists = () => true }) {
  const explicit = args['pose-measure'];
  if (typeof explicit === 'string' && explicit) return { path: explicit, source: 'explicit', root: tableRootOf(explicit) };
  const cand = args['candidate-root'] ?? args['pose-measure-from'];
  if (typeof cand === 'string' && cand) return { path: path.join(cand, ...POSE_MEASURE_REL), source: 'candidate-root', root: cand };
  const own = path.join(root, ...POSE_MEASURE_REL);
  return exists(own) ? { path: own, source: 'harness-tree', root } : { path: null, source: 'none', root: null };
}

/** The repository root a table file sits in (`<root>/docs/target/pose-measure.json`), or null when the path is not shaped that way. */
export function tableRootOf(file) {
  const parts = path.resolve(file).split(path.sep);
  const n = POSE_MEASURE_REL.length;
  const tail = parts.slice(-n).join('/');
  return tail === POSE_MEASURE_REL.join('/') ? parts.slice(0, -n).join(path.sep) : null;
}

/** `Release 61 · 660c19bb` or `Preview · 660c19bb` or `660c19bb` -> { release, sha }; nulls when the text carries neither. */
export function parseBuildTag(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  const sha = /\b([0-9a-f]{7,40})\b/i.exec(t)?.[1]?.toLowerCase() ?? null;
  const release = /Release\s+([0-9][0-9a-z.]*)/i.exec(t)?.[1] ?? (/\bPreview\b/.test(t) ? 'Preview' : null);
  return { release, sha };
}

/**
 * The candidate's own table: `docs/target/pose-measure.json` as commit `sha` has it, read from the repository at `root`.
 * @returns {{ sha256: string, count: number } | null} null when git cannot give it (no repository, an unknown commit, no such file at that commit, not JSON).
 */
export function candidateTableAt(root, sha, run = execFileSync) {
  if (!root || !sha || !/^[0-9a-f]{7,40}$/i.test(sha)) return null;
  try {
    const raw = run('git', ['-C', root, 'show', `${sha}:${POSE_MEASURE_REL.join('/')}`], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw));
    const json = JSON.parse(buf.toString('utf8'));
    return { sha256: tableSha256(buf), count: Object.keys(json.subjects ?? {}).length };
  } catch {
    return null;
  }
}

/**
 * Is the table the run loaded the candidate's?
 * @param {{ loaded: { path?: string, sha256: string, count: number } | null, candidate: { sha256: string, count: number } | null, buildSha: string | null, source: string, allowStale?: boolean }} input
 * @returns {{ checked: boolean, stale: boolean, fail: boolean, reason: string | null }} `fail` is what turns CHK-026 UNVERIFIED: stale and not allowed. `reason` is a sentence for the report.
 */
export function judgeTable({ loaded, candidate, buildSha, source, allowStale = false }) {
  if (!loaded) return { checked: false, stale: false, fail: false, reason: 'no pose-measure table was loaded: every pose is judged by its silhouette alone' };
  if (!buildSha) return { checked: false, stale: false, fail: false, reason: 'not checked: the build shows no commit (a dev server or a build without git), so the candidate\'s table cannot be named' };
  if (!candidate) return { checked: false, stale: false, fail: false, reason: `not checked: the table's repository does not know commit ${buildSha}, so the candidate's table cannot be read from it` };
  if (candidate.sha256 === loaded.sha256) return { checked: true, stale: false, fail: false, reason: null };
  const reason = `the pose-measure table this run read (${loaded.path ?? 'unnamed'}, source ${source}: ${loaded.count} subjects, sha256 ${loaded.sha256.slice(0, 12)}) is not the candidate's (commit ${buildSha}: ${candidate.count} subjects, sha256 ${candidate.sha256.slice(0, 12)}): CHK-026 is read against someone else's registrations; run again with --candidate-root=<the candidate's tree> (PR-0512)`;
  return { checked: true, stale: true, fail: !allowStale, reason };
}
