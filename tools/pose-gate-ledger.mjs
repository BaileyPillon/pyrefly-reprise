/**
 * **The waiver ledger** (`docs/target/pose-waivers.json`; pose continuity, W1; both games): the honest list of paintings that are out of their class's band and
 * ship anyway, one row per (subject, pose, painting sha256), with the reason and WHOSE WORDS say so. Bailey, 2026-10-16: "pose continuity is the strongest
 * recurring issue we need a permanent fix for this please."
 *
 * The shape (fixed by the contract entry in `docs/CONTRACT-CHANGES.md`, 2026-10-16):
 *
 *   { "version": 1,
 *     "legacySeal": ["<16 hex>", ...],                                   written ONCE by `node tools/pose-gate.mjs --write-legacy`; see the ratchet
 *     "rows": [ { "subject", "pose", "sha" (64 hex),
 *                "reason", "words" (whose words, quoted), "date" (ISO), "legacy"?: true } ] }
 *
 * THE RATCHET, in two halves, both checked by {@link validateLedger} on every run of the gate (the install, `npm test`, the deploy):
 *   1. A row without `legacy` must carry BAILEY'S OWN QUOTED WORDS, and the gate checks them against the record (`verifyBaileyWords`): a `source` naming the
 *      decision (`D-512`, or `E-014`) in `docs/target/decisions.json` or `decisions-early.json`, his name, and a passage in quotation marks that occurs VERBATIM in
 *      that decision's `words`. An agent's reason ("driver, under Bailey's request") is not a waiver, and neither is a sentence an agent made up: record his decision in
 *      the decisions ledger first (AGENTS.md), then quote it here.
 *   2. A `legacy` row is one of the rows `--write-legacy` wrote when the ledger was born, every out-of-band pose of the r50.1 art "drawn as live r50.1; awaiting
 *      the ruler pick (W3)". `legacySeal` lists their keys' hashes; a legacy row whose hash is not in the seal was ADDED later and fails. Legacy rows may only be
 *      removed (when a painting is repainted into its band, or re-installed: a new sha loses its waiver by construction). `--write-legacy` refuses to run twice.
 *      The seal itself is PINNED in this file (`LEGACY_SEAL_DIGEST`: a hash of all its entries), so adding a row and its seal entry together changes the digest and fails
 *      whatever git says. With a git `--base` the gate also compares the ledger with the one at that ref; a base that cannot be read is a FAILURE (`ledger-base`), never a
 *      skipped check, and a ref that has no ledger yet (the first deploy after the ledger was born) leaves the pinned digest as the check, said in a note.
 *
 * A waiver is bound to the painting's sha256: a re-installed painting (a new sha) has no waiver. Pure functions plus the file read and write; no pixel.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const LEDGER_PATH = 'docs/target/pose-waivers.json';
export const LEGACY_REASON = 'legacy: drawn as live r50.1; awaiting the ruler pick (W3)';
export const LEGACY_WORDS = "driver, under Bailey's 2026-10-16 permanent-fix request";

/**
 * The hash of the legacy seal as the bootstrap wrote it on 2026-10-17 (254 entries): the first 32 hex characters of sha256 over the sorted entries joined by a newline.
 * Changing it is a change to this file, in a diff somebody reads; a ledger whose `legacySeal` hashes to anything else carries a legacy row the bootstrap did not write.
 */
export const LEGACY_SEAL_DIGEST = '03c93b5a6cf73567da8fa5597177e843';

/** The digest of a seal (see {@link LEGACY_SEAL_DIGEST}). */
export const sealDigest = (seal) => createHash('sha256').update([...seal].sort().join('\n')).digest('hex').slice(0, 32);

/** `subject/pose/sha`: the key a waiver is bound to. */
export const waiverKey = (subject, pose, sha) => `${subject}/${pose}/${sha}`;

/** The seal's entry for a legacy row (16 hex characters of a hash of its key). */
export const sealOf = (subject, pose, sha) => createHash('sha256').update(`${subject}|${pose}|${sha}`).digest('hex').slice(0, 16);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const QUOTED = /["“][^"“”]{10,}["”]/;

/**
 * Do these words LOOK like Bailey's own quoted words? His name and a quoted passage of at least ten characters (straight or curly quotation marks); never the
 * legacy phrase. ("driver, under Bailey's 2026-10-16 permanent-fix request" names him and quotes nothing.) The shape only: {@link verifyBaileyWords} is the
 * check that the passage is his.
 */
export function isBaileyWords(words) {
  return typeof words === 'string' && words !== LEGACY_WORDS && /\bBailey\b/.test(words) && QUOTED.test(words);
}

/** Straight quotes, one space: the form a quotation is compared in. */
export const normalizeQuote = (s) => String(s).replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();

/** The quoted passages of at least ten characters in some words, normalized. */
export function quotedPassages(words) {
  const text = normalizeQuote(words);
  return [...text.matchAll(/"([^"]{10,})"/g)].map((m) => (m[1] ?? '').trim()).filter((q) => q.length >= 10);
}

/**
 * Are these words Bailey's? A row names the decision it quotes (`source`: `D-512`, `E-014`), the decision must exist in the decisions ledger, and every quoted
 * passage in `words` must occur verbatim (straight quotes, one space) in that decision's `words`. `decisions` is `loadDecisionWords`'s map (id to his words); without
 * it nothing can be verified, and nothing is believed.
 * @returns {string|null} why not, or null when they are his
 */
export function verifyBaileyWords(row, decisions) {
  if (!isBaileyWords(row?.words)) return 'the words do not name him and quote a sentence of his';
  if (!decisions || !decisions.size) return 'the decisions ledger (docs/target/decisions.json) could not be read, so a quotation cannot be checked against it';
  const source = row.source;
  if (typeof source !== 'string' || !/^[DE]-\d{3,4}$/.test(source)) return 'a waiver names the decision that holds his words in "source" (D-512, E-014)';
  const spoken = decisions.get(source);
  if (spoken === undefined) return `${source} is not in the decisions ledger`;
  if (!spoken) return `${source} records no words of Bailey's (its "words" are empty)`;
  for (const q of quotedPassages(row.words)) if (!spoken.includes(q)) return `the quoted passage ${JSON.stringify(q.slice(0, 60))} is not in ${source}'s words, which are the only words of his the ledger vouches for`;
  return null;
}

/**
 * The decisions ledger's words, by id: `docs/target/decisions.json` (D-nnn) and `decisions-early.json` (E-nnn), each `words` normalized for comparison.
 * @returns {Map<string, string>} empty when neither file can be read
 */
export function loadDecisionWords(root) {
  const out = new Map();
  for (const f of ['decisions.json', 'decisions-early.json']) {
    const path = join(root, 'docs', 'target', f);
    if (!existsSync(path)) continue;
    try {
      const j = JSON.parse(readFileSync(path, 'utf8'));
      for (const d of Array.isArray(j?.decisions) ? j.decisions : []) if (d && typeof d.id === 'string') out.set(d.id, typeof d.words === 'string' ? normalizeQuote(d.words) : '');
    } catch { /* an unreadable file contributes nothing: every quotation then fails closed */ }
  }
  return out;
}

export function ledgerFile(root) {
  return join(root, ...LEDGER_PATH.split('/'));
}

/** @returns {{exists: boolean, path: string, ledger: object|null, error: string|null}} */
export function loadLedger(root) {
  const path = ledgerFile(root);
  if (!existsSync(path)) return { exists: false, path, ledger: null, error: null };
  try {
    return { exists: true, path, ledger: JSON.parse(readFileSync(path, 'utf8')), error: null };
  } catch (e) {
    return { exists: true, path, ledger: null, error: `${LEDGER_PATH} is not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * The ledger at a git ref (`git show <ref>:docs/target/pose-waivers.json`), told apart three ways: `ref` (read), `absent` (the ref is fine and has no ledger yet:
 * the first deploy after the ledger was born), `error` (git failed, the ref is not a commit, the file at it is not JSON): a comparison that cannot be made must not
 * look like one that passed.
 * @returns {{state: 'ref'|'absent'|'error', ledger: object|null, message: string|null}}
 */
export function loadLedgerAtRef(root, ref) {
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  } catch (e) {
    return { state: 'error', ledger: null, message: `git cannot resolve the base ref ${JSON.stringify(ref)} to a commit (${firstLine(e)})` };
  }
  try {
    git(['cat-file', '-e', `${ref}:${LEDGER_PATH}`]);
  } catch {
    return { state: 'absent', ledger: null, message: null };
  }
  try {
    return { state: 'ref', ledger: JSON.parse(git(['show', `${ref}:${LEDGER_PATH}`])), message: null };
  } catch (e) {
    return { state: 'error', ledger: null, message: `${LEDGER_PATH} at ${ref} cannot be read (${firstLine(e)})` };
  }
}

const firstLine = (e) => String((e && (e.stderr || e.message)) || e).split(/\r?\n/).find((l) => l.trim())?.trim().slice(0, 160) ?? 'no message';

/**
 * Check a parsed ledger. `base` (optional) is the ledger at a git ref, for the second half of the ratchet; `decisions` is {@link loadDecisionWords}'s map, for the
 * check that a waiver's words are his; `pin` is the seal's expected digest ({@link LEGACY_SEAL_DIGEST}; a test that builds its own ledger passes its own).
 * @returns {{problems: Array<{code: string, message: string}>, index: Map<string, object>, counts: {rows: number, legacy: number, bailey: number}}}
 */
export function validateLedger(ledger, { base = null, decisions = null, pin = LEGACY_SEAL_DIGEST } = {}) {
  const problems = [];
  const index = new Map();
  const counts = { rows: 0, legacy: 0, bailey: 0 };
  const add = (code, message) => problems.push({ code, message });
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    add('ledger-shape', `${LEDGER_PATH} must be an object { version: 1, rows: [...] }`);
    return { problems, index, counts };
  }
  if (ledger.version !== 1) add('ledger-shape', `${LEDGER_PATH}: version must be 1, it is ${JSON.stringify(ledger.version)}`);
  if (!Array.isArray(ledger.rows)) {
    add('ledger-shape', `${LEDGER_PATH}: rows must be an array`);
    return { problems, index, counts };
  }
  const seal = new Set(Array.isArray(ledger.legacySeal) ? ledger.legacySeal : []);
  // the seal is pinned in code: a legacy row added together with its seal entry changes the digest
  const sealPinned = pin === null || sealDigest(seal) === pin;
  if (!sealPinned && ledger.rows.some((r) => r?.legacy === true)) add('ledger-legacy-added', `${LEDGER_PATH}: legacySeal is not the seal pinned in tools/pose-gate-ledger.mjs (LEGACY_SEAL_DIGEST ${pin}): a legacy row was added with its seal entry, and legacy rows may only be removed`);
  const baseKeys = base && Array.isArray(base.rows) ? new Set(base.rows.map((r) => waiverKey(r?.subject, r?.pose, r?.sha))) : null;
  ledger.rows.forEach((r, i) => {
    const where = `${LEDGER_PATH} row ${i}${r && typeof r === 'object' && r.subject ? ` (${r.subject}/${r.pose})` : ''}`;
    if (!r || typeof r !== 'object') return add('ledger-row', `${where}: not an object`);
    counts.rows++;
    const before = problems.length;
    for (const f of ['subject', 'pose', 'reason', 'words']) if (typeof r[f] !== 'string' || !r[f].trim()) add('ledger-row', `${where}: "${f}" must be a non-empty string`);
    if (typeof r.sha !== 'string' || !/^[0-9a-f]{64}$/.test(r.sha)) add('ledger-row', `${where}: "sha" must be the painting's 64 hex characters (a waiver is bound to the file, not to a pose name)`);
    if (typeof r.date !== 'string' || !ISO_DATE.test(r.date)) add('ledger-row', `${where}: "date" must be an ISO date`);
    if (r.legacy !== undefined && r.legacy !== true) add('ledger-row', `${where}: "legacy" is true or absent`);
    const k = waiverKey(r.subject, r.pose, r.sha);
    if (index.has(k)) add('ledger-row', `${where}: a second row for the same painting (${k})`);
    if (r.legacy === true) {
      counts.legacy++;
      if (r.reason !== LEGACY_REASON || r.words !== LEGACY_WORDS) add('ledger-legacy-added', `${where}: a legacy row carries the bootstrap's reason and words exactly; this one does not`);
      else if (!sealPinned) { /* said once above */ }
      else if (!seal.has(sealOf(r.subject, r.pose, r.sha))) add('ledger-legacy-added', `${where}: a legacy row that the bootstrap did not write (not in legacySeal): legacy rows may only be removed, a new waiver needs Bailey's own quoted words`);
      else if (baseKeys && !baseKeys.has(k)) add('ledger-legacy-added', `${where}: a legacy row that the ledger at the base ref does not have: legacy rows may only be removed`);
    } else {
      const why = verifyBaileyWords(r, decisions);
      if (why === null) counts.bailey++;
      else add('ledger-words', `${where}: the words are not Bailey's own quoted words (${JSON.stringify(String(r.words).slice(0, 80))}): ${why}. A waiver that is not legacy needs the decision that records his sentence ("source": "D-nnn") and his sentence in quotation marks, verbatim`);
    }
    if (problems.length === before) index.set(k, r); // only a row that passed every check waives anything
  });
  return { problems, index, counts };
}

/**
 * The no-pixel half of "the table is generated from the ledger": every `waived` row of a compiled registration table (`{subject: {pose: row}}`) must have a ledger
 * row that passed {@link validateLedger} and is bound to the row's `sha` (the row carries its first 16 hex characters). A `waived` typed into a
 * `poseRegistration*.ts` file, or left there after its ledger row was removed, is listed. Runs where the art is not (a clean checkout).
 * @param {object} table @param {{index: Map<string, object>}} validated the result of validateLedger (or an empty index with no ledger)
 * @returns {string[]} `subject/pose` of each waived row with no ledger row behind it
 */
export function waivedRowsWithoutLedger(table, validated) {
  const rows = [...validated.index.values()];
  const out = [];
  for (const [subject, poses] of Object.entries(table)) {
    for (const [pose, row] of Object.entries(poses)) {
      if (row.status !== 'waived') continue;
      const bound = typeof row.sha === 'string' && row.sha.length >= 12 && rows.some((r) => r.subject === subject && r.pose === pose && r.sha.startsWith(row.sha));
      if (!bound) out.push(`${subject}/${pose}`);
    }
  }
  return out.sort();
}

/**
 * The legacy ledger for a census: one row per painting that is out of band, with the bootstrap's reason and words, and the seal of them all.
 * @param {Array<{subject: string, pose: string, sha: string}>} paintings @param {string} date ISO date
 */
export function buildLegacyLedger(paintings, date) {
  const rows = [...paintings]
    .sort((a, b) => (a.subject === b.subject ? (a.pose < b.pose ? -1 : 1) : a.subject < b.subject ? -1 : 1))
    .map((p) => ({ subject: p.subject, pose: p.pose, sha: p.sha, reason: LEGACY_REASON, words: LEGACY_WORDS, date, legacy: true }));
  return { version: 1, legacySeal: rows.map((r) => sealOf(r.subject, r.pose, r.sha)).sort(), rows };
}

/** The ledger as text: one row to a line, so a diff shows one waiver as one line. */
export function formatLedger(ledger) {
  const seal = (ledger.legacySeal ?? []).map((s) => `  ${JSON.stringify(s)}`).join(',\n');
  const rows = ledger.rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n');
  const parts = [' "version": 1'];
  if (ledger.legacySeal) parts.push(` "legacySeal": [${seal ? `\n${seal}\n ` : ''}]`);
  parts.push(` "rows": [${rows ? `\n${rows}\n ` : ''}]`);
  return `{\n${parts.join(',\n')}\n}\n`;
}

/** Write a ledger, once: refuses when the file is there. @returns {string} the path */
export function writeNewLedger(root, ledger) {
  const path = ledgerFile(root);
  if (existsSync(path)) throw new Error(`${LEDGER_PATH} exists already: the legacy rows are written once (remove a legacy row by editing the file; never add one)`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, formatLedger(ledger), { flag: 'wx' });
  return path;
}
