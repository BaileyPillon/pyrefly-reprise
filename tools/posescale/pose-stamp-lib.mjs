/**
 * **Stamp the generated registration tables** (pose continuity, W1; both games). `measure.py table` writes the numbers the engine draws a painting with
 * (`scale`, `stanceX`, `feetRow`, `upright`, `head`); this module adds what the INSTALL says about each painting (`status`, `class`, `stature`, `headReal`,
 * `lengthRatio`, `iou`, `sha`: `src/data/art/poseRegistrationTypes.ts`) by reading it with the one pose model (`pose-model.mjs`) and the bands
 * (`pose-bands.mjs`). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please."
 *
 * Which paintings get a row (a painting nobody registered must stay without one, or the gate could not say `unregistered`):
 *   - a painting with numbers in the table already, OR a record in `docs/target/pose-measure.json` (it was measured, even if its row has no number: a KO whose size
 *     comes from the sidecar), OR a waiver in the ledger bound to its sha (a legacy row for what nobody registered: it draws as it always did and says so);
 *   - never an exempt painting (an FFX-2 `twirl-*` key, an FF7 still).
 * The status is `proposeStatus` of the reading: `ok`, `held` (an install-written hold, in band), `blocked` (out of band, no waiver) or `waived` (the ledger has a row
 * for THIS sha: the table is generated from the ledger and never typed).
 *
 * The files are rewritten line by line: the base fields stay as the generator wrote them (number formatting included), the stamped fields replace any earlier ones
 * and go last, so the step is idempotent and the other generators (`measure.py table`, `tools/exp-install.mjs table`) can run it as their last step.
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { proposeStatus, bandVerdict } from './pose-bands.mjs';
import { rowFieldsFromReading } from './pose-rows.mjs';

/** The stamped fields, in the order they are written. */
export const STAMP_FIELDS = Object.freeze(['status', 'class', 'stature', 'headReal', 'lengthRatio', 'iou', 'sha']);

/** The table files by group (`src/data/art/poseRegistration<File>.ts`, the exported constant, the tag `loadModelInputs` calls it). */
export const TABLE_GROUPS = Object.freeze([
  { tag: 'ffx', file: 'poseRegistrationFfx.ts', name: 'POSE_REGISTRATION_FFX' },
  { tag: 'ffx2', file: 'poseRegistrationFfx2.ts', name: 'POSE_REGISTRATION_FFX2' },
  { tag: 'foes', file: 'poseRegistrationFoes.ts', name: 'POSE_REGISTRATION_FOES' },
  { tag: 'exp', file: 'poseRegistrationExp.ts', name: 'POSE_REGISTRATION_EXP' },
]);

const IDENT = /^[A-Za-z_$][\w$]*$/;
const keyText = (k) => (IDENT.test(k) ? k : `'${k}'`);
const unkey = (k) => (k.startsWith("'") ? k.slice(1, -1) : k);

/** Split `a: 1, b: [1, 2], c: 'x'` at the top-level commas. */
function splitEntries(body) {
  const out = [];
  let depth = 0;
  let quote = false;
  let cur = '';
  for (const ch of body) {
    if (ch === "'") quote = !quote;
    if (!quote && (ch === '[' || ch === '{')) depth++;
    if (!quote && (ch === ']' || ch === '}')) depth--;
    if (!quote && depth === 0 && ch === ',') { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Parse a generated table file into `{head, name, subjects: [{key, rows: [{key, entries: [[field, text]]}]}], tail}`. Throws on a line it does not know:
 * silently dropping one would lose a registration.
 */
export function parseTable(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'; // Python's write_text on Windows writes CRLF; keep whichever the file has
  const lines = text.split(eol);
  const start = lines.findIndex((l) => /^export const \w+: PoseRegistrationTable = \{$/.test(l));
  if (start < 0) throw new Error('pose-stamp: no `export const NAME: PoseRegistrationTable = {` line');
  const name = /^export const (\w+):/.exec(lines[start])[1];
  const subjects = [];
  let i = start + 1;
  let cur = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if (l === '};') break;
    if ((m = /^ {2}('?[\w-]+'?): \{$/.exec(l)) && !cur) { cur = { key: unkey(m[1]), rows: [] }; subjects.push(cur); continue; }
    if (cur && l === '  },') { cur = null; continue; }
    if (cur && (m = /^ {4}('?[\w-]+'?): \{ ?(.*?) ?\},$/.exec(l))) {
      const entries = splitEntries(m[2]).map((e) => {
        const j = e.indexOf(':');
        if (j < 0) throw new Error(`pose-stamp: cannot read the entry ${JSON.stringify(e)} in ${l.trim()}`);
        return [e.slice(0, j).trim(), e.slice(j + 1).trim()];
      });
      cur.rows.push({ key: unkey(m[1]), entries });
      continue;
    }
    throw new Error(`pose-stamp: line ${i + 1} is not part of the table grammar: ${l}`);
  }
  if (i >= lines.length) throw new Error('pose-stamp: the table has no closing `};`');
  return { eol, head: lines.slice(0, start + 1), name, subjects, tail: lines.slice(i) };
}

/** The inverse of {@link parseTable}: `renderTable(parseTable(text)) === text` for every generated file. */
export function renderTable(t) {
  const out = [...t.head];
  for (const s of t.subjects) {
    out.push(`  ${keyText(s.key)}: {`);
    for (const r of s.rows) out.push(`    ${keyText(r.key)}: { ${r.entries.map(([k, v]) => `${k}: ${v}`).join(', ')} },`);
    out.push('  },');
  }
  out.push(...t.tail);
  return out.join(t.eol);
}

/** A stamped field's value as TypeScript source. */
const literal = (v) => (typeof v === 'string' ? `'${v}'` : String(v));

/**
 * Which table file a subject that has no row anywhere belongs in: by its record's game (`foe` is the Foes table), else by the game the model read.
 * @param {string} subject @param {{game?: string}|undefined} record @param {string} modelGame `FFX | FFX-2 | unknown ...`
 */
export function groupFor(subject, record, modelGame) {
  if (subject.startsWith('exp-leblanc-')) return 'exp';
  if (record?.game === 'foe') return 'foes';
  if (record?.game === 'ffx2') return 'ffx2';
  if (record?.game === 'ffx') return 'ffx';
  if (modelGame === 'FFX-2') return 'ffx2';
  if (modelGame === 'FFX') return 'ffx';
  return 'foes';
}

const hasBaseFields = (row) => !!row && Object.keys(row).some((k) => !STAMP_FIELDS.includes(k));

/**
 * Compute the stamp of every painting of `readings` (from `readAll`/`readSubject`, read against `inputs.table`).
 * @param {object[]} readings @param {{table: object}} inputs @param {object} records `docs/target/pose-measure.json` @param {Map<string, object>} waivers by `subject/pose/sha`
 * @returns {Array<{subject: string, pose: string, fields: object, status: string, group: string|null}>}
 */
export function computeStamps(readings, inputs, records, waivers) {
  const out = [];
  for (const r of readings) {
    if (bandVerdict(r).exempt) continue;
    const row = inputs.table[r.subject]?.[r.pose];
    const rec = records?.subjects?.[r.subject]?.poses?.[r.pose];
    const waiver = waivers.get(`${r.subject}/${r.pose}/${r.sha}`);
    const registered = hasBaseFields(row) || (!!rec && !rec.skip) || !!waiver;
    if (!registered) continue;
    const status = proposeStatus({ ...r, hasRow: true }, { waived: !!waiver });
    if (!status) continue;
    out.push({ subject: r.subject, pose: r.pose, fields: rowFieldsFromReading(r, status), status, game: r.game, record: records?.subjects?.[r.subject] });
  }
  return out;
}

/**
 * Apply stamps to parsed tables. A row the stamps name gets its stamped fields replaced; a pose or subject with no row yet is added (sorted, as the generators write
 * them) to the file its subject belongs to. A row the stamps do not name loses nothing it had (the stamp of an unreadable painting stays as it was).
 * @param {Record<string, ReturnType<typeof parseTable>>} tables by group tag
 * @param {ReturnType<typeof computeStamps>} stamps @param {{only?: Set<string>}} [opt] `only`: leave every other subject exactly as it is
 * @returns {{changed: Set<string>, added: number, updated: number}}
 */
export function applyStamps(tables, stamps, { only } = {}) {
  const changed = new Set();
  let added = 0;
  let updated = 0;
  const index = new Map();
  for (const [tag, t] of Object.entries(tables)) for (const s of t.subjects) index.set(s.key, { tag, s });
  const sorted = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  for (const st of stamps) {
    if (only && !only.has(st.subject)) continue;
    let home = index.get(st.subject);
    if (!home) {
      const tag = groupFor(st.subject, st.record, st.game);
      const t = tables[tag];
      const s = { key: st.subject, rows: [] };
      const at = t.subjects.findIndex((x) => sorted(x.key, st.subject) > 0);
      if (at < 0) t.subjects.push(s); else t.subjects.splice(at, 0, s);
      home = { tag, s };
      index.set(st.subject, home);
    }
    let row = home.s.rows.find((r) => r.key === st.pose);
    if (!row) {
      row = { key: st.pose, entries: [] };
      const at = home.s.rows.findIndex((x) => sorted(x.key, st.pose) > 0);
      if (at < 0) home.s.rows.push(row); else home.s.rows.splice(at, 0, row);
      added++;
    } else updated++;
    const base = row.entries.filter(([k]) => !STAMP_FIELDS.includes(k));
    const stamped = STAMP_FIELDS.filter((k) => st.fields[k] !== undefined).map((k) => [k, literal(st.fields[k])]);
    const next = [...base, ...stamped];
    if (JSON.stringify(next) !== JSON.stringify(row.entries)) changed.add(home.tag);
    row.entries = next;
  }
  return { changed, added, updated };
}

/** Read the four generated tables from `root` (`src/data/art`). @returns {Record<string, ReturnType<typeof parseTable>>} */
export function readTables(root) {
  const out = {};
  for (const g of TABLE_GROUPS) out[g.tag] = parseTable(readFileSync(join(root, 'src', 'data', 'art', g.file), 'utf8'));
  return out;
}

/** Write the named groups back (each by a temporary file renamed into place). */
export function writeTables(root, tables, tags) {
  for (const g of TABLE_GROUPS) {
    if (!tags.has(g.tag)) continue;
    const path = join(root, 'src', 'data', 'art', g.file);
    const tmp = `${path}.tmp-${process.pid}`;
    writeFileSync(tmp, renderTable(tables[g.tag]));
    renameSync(tmp, path);
  }
}
