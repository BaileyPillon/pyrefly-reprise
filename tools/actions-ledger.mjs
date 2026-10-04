#!/usr/bin/env node
/**
 * node tools/actions-ledger.mjs            render ACTIONS.md from docs/target/actions.json
 * node tools/actions-ledger.mjs --check    exit 1 when actions.json is malformed or ACTIONS.md is stale
 * node tools/actions-ledger.mjs --validate only validate the data (prints every problem)
 *
 * ACTIONS.md is the central ledger of everything built or carried out on the project since
 * 2026-09-15: implementations, art installs, deploys, reviews, records, infrastructure, account
 * moves, downloads, maintenance and process changes. The data is one entry per line in
 * docs/target/actions.json (the same pattern as docs/target/decisions.json); this tool is the only
 * thing that writes ACTIONS.md, so the Markdown never drifts from the data.
 *
 * The repository is public: validateActions refuses an email address, a 32-character hex id (the
 * shape of a Cloudflare account id) or anything that looks like card digits, in any field.
 *
 * Node built-ins only.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const KINDS = ['implementation', 'art', 'deploy', 'review', 'records', 'infrastructure', 'account', 'download', 'maintenance', 'process'];
export const GAMES = ['FFX', 'FFX-2', 'both', 'n/a'];
export const FIRST_DAY = '2026-09-15';
const FIELDS = ['id', 'date', 'kind', 'title', 'what', 'who', 'decisions', 'game', 'result', 'evidence', 'reversible'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const oneLine = (v, max) => typeof v === 'string' && v.trim() === v && v.length > 0 && v.length <= max && !/[\r\n]/.test(v);

/** Problems found in one string field (the privacy rules of this public repository). */
function privacyProblems(where, text) {
  const out = [];
  if (text.includes(String.fromCharCode(64))) out.push(`${where}: contains an at sign (no email addresses; write "account #1", "#2" or "#3")`);
  if (/\b[0-9a-f]{32}\b/i.test(text) || /\b[0-9a-f]{41,}\b/i.test(text)) out.push(`${where}: contains a long hex id (account ids, tokens and keys never go in the repository)`);
  if (/\b(?:visa|mastercard|amex|debit card|credit card|card ending|ending in|last four)\b[^.]{0,40}\b\d{4}\b/i.test(text) || /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b/.test(text)) out.push(`${where}: looks like payment card digits`);
  return out;
}

/** Every problem in a parsed actions.json; an empty array means the data is well formed. */
export function validateActions(data) {
  const problems = [];
  if (!isObj(data) || !Array.isArray(data.actions)) return ['top level must be an object with an "actions" array'];
  if (data.actions.length === 0) problems.push('the ledger has no rows');
  const seen = new Set();
  let last = 0;
  data.actions.forEach((row, i) => {
    const tag = isObj(row) && typeof row.id === 'string' ? row.id : `row #${i + 1}`;
    const bad = (msg) => problems.push(`${tag}: ${msg}`);
    if (!isObj(row)) { bad('not an object'); return; }
    for (const k of Object.keys(row)) if (!FIELDS.includes(k)) bad(`unknown field "${k}"`);
    for (const k of FIELDS) if (!(k in row)) bad(`missing field "${k}"`);
    const m = typeof row.id === 'string' ? /^A-(\d{4,})$/.exec(row.id) : null;
    if (!m) bad('id must look like A-0001');
    else {
      if (seen.has(row.id)) bad('duplicate id'); seen.add(row.id);
      const n = Number(m[1]);
      if (n <= last) bad('ids must increase down the file (append new rows at the end)');
      last = Math.max(last, n);
    }
    const d = typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? new Date(`${row.date}T12:00:00Z`) : null;
    if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== row.date) bad('date must be a real YYYY-MM-DD (Eastern)');
    else if (row.date < FIRST_DAY) bad(`date is before the project began (${FIRST_DAY})`);
    if (!KINDS.includes(row.kind)) bad(`kind must be one of ${KINDS.join(', ')}`);
    if (!oneLine(row.title, 220)) bad('title must be one non-empty line of at most 220 characters');
    if (!oneLine(row.what, 2400)) bad('what must be one non-empty line of at most 2400 characters');
    if (!oneLine(row.who, 300)) bad('who must be one non-empty line of at most 300 characters');
    if (!oneLine(row.result, 400)) bad('result must be one non-empty line of at most 400 characters');
    if (!GAMES.includes(row.game)) bad(`game must be one of ${GAMES.join(', ')}`);
    if (!Array.isArray(row.decisions) || row.decisions.some((x) => typeof x !== 'string' || !/^[DE]-\d{3,}$/.test(x)) || new Set(row.decisions).size !== row.decisions?.length) bad('decisions must be an array of unique D-nnn or E-nnn ids (empty if none)');
    if (!Array.isArray(row.evidence) || row.evidence.length === 0 || row.evidence.some((x) => !oneLine(x, 400))) bad('evidence must be a non-empty array of one-line strings');
    const r = row.reversible;
    if (!isObj(r) || typeof r.value !== 'boolean' || !oneLine(r.how, 400) || Object.keys(r).length !== 2) bad('reversible must be {"value": true|false, "how": "..."}');
    for (const k of ['title', 'what', 'who', 'result']) if (typeof row[k] === 'string') problems.push(...privacyProblems(`${tag}.${k}`, row[k]));
    if (Array.isArray(row.evidence)) row.evidence.forEach((e, j) => { if (typeof e === 'string') problems.push(...privacyProblems(`${tag}.evidence[${j}]`, e)); });
    if (isObj(r) && typeof r.how === 'string') problems.push(...privacyProblems(`${tag}.reversible.how`, r.how));
  });
  return problems;
}

const esc = (s) => String(s).replace(/`/g, "'").replace(/[\\*_<>[\]]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : `\\${c}`));
const code = (s) => `\`${String(s).replace(/`/g, "'")}\``;
const monthName = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const tally = (items) => { const t = {}; for (const x of items) t[x] = (t[x] || 0) + 1; return t; };
const fmtTally = (t) => Object.entries(t).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${v} ${k}`).join(', ') || 'none';

/** The verdict word a review row's result starts with (SHIP or HOLD; PASS, FAIL or UNVERIFIED for a live check). */
function reviewVerdict(row, words) {
  const m = new RegExp(`\\b(${words.join('|')})\\b`).exec(row.result);
  return m ? m[1] : 'no verdict';
}

function summaryLines(rows) {
  const first = rows[0], last = rows[rows.length - 1];
  const linked = new Set(rows.flatMap((r) => r.decisions));
  const L = [];
  L.push(`- **Rows:** ${rows.length}, from ${first.date} to ${last.date} (ids ${first.id} to ${last.id}), ${rows.filter((r) => r.decisions.length).length} of them linked to at least one decision (${linked.size} distinct decision ids).`);
  L.push('');
  const byKind = tally(rows.map((r) => r.kind));
  L.push('| Kind | Rows |', '|---|---|', ...KINDS.map((k) => `| ${k} | ${byKind[k] || 0} |`), '');
  const byMonth = tally(rows.map((r) => r.date.slice(0, 7)));
  L.push('| Month | Rows |', '|---|---|', ...Object.keys(byMonth).sort().map((m) => `| ${monthName(m)} | ${byMonth[m]} |`), '');
  const byGame = tally(rows.map((r) => r.game));
  L.push(`- **By game:** ${fmtTally(byGame)} (rule 14: FFX and FFX-2 are separate games; "n/a" is the hidden FF7 experiment and work that touches neither).`);
  const dep = rows.filter((r) => r.kind === 'deploy');
  const logged = dep.filter((r) => r.evidence.some((e) => e.startsWith('docs/deploys.log line')));
  const owner = logged.filter((r) => /owner override/i.test(r.result));
  const alphas = dep.filter((r) => /^Alpha /.test(r.title)).length;
  const previews = dep.filter((r) => /^Cloudflare preview/.test(r.title)).length;
  const label = (r) => (/\(([^)]+)\)/.exec(r.title) || [, r.id])[1];
  const span = logged.length ? ` The log runs from ${label(logged[0])} (${logged[0].date}) to ${label(logged[logged.length - 1])} (${logged[logged.length - 1].date}).` : '';
  L.push(`- **Deploys and releases:** ${dep.length} deploy rows: ${logged.length} lines of docs/deploys.log (${owner.length} of them under Bailey's owner override of the deep-review gate), ${alphas} early alphas that predate the log, and ${previews} Cloudflare preview.${span}`);
  const rev = rows.filter((r) => r.kind === 'review');
  const foc = rev.filter((r) => /^Focused review/.test(r.title)), live = rev.filter((r) => /^Live check/.test(r.title)), deep = rev.filter((r) => /^Deep review round/.test(r.title));
  const rest = rev.length - foc.length - live.length - deep.length;
  const ship = ['SHIP', 'HOLD'], liveWords = ['PASS', 'FAIL', 'UNVERIFIED'];
  L.push(`- **Reviews:** ${rev.length} rows: ${foc.length} focused reviews (${fmtTally(tally(foc.map((r) => reviewVerdict(r, ship))))}), ${live.length} live checks (${fmtTally(tally(live.map((r) => reviewVerdict(r, liveWords))))}), ${deep.length} deep rounds with a report (${fmtTally(tally(deep.map((r) => reviewVerdict(r, ship))))}) and ${rest} other reviews (critic rounds 02, 03 and 14, paper preflights, visual passes, real-game checks, round 21 in progress).`);
  const open = rows.filter((r) => /^(on branch|on branches|parked|pending|in progress|failed)/i.test(r.result));
  L.push(`- **Not finished or not shipped:** ${open.length} rows end as built on a branch and not merged, parked, pending, in progress or failed; the result line says which.`);
  return L;
}

/** The whole ACTIONS.md text for a parsed actions.json (rows must already be valid). */
export function renderActions(data) {
  const rows = data.actions;
  const L = [];
  L.push('# Echoes of Spira: actions and implementations ledger', '');
  L.push('<!-- Generated by tools/actions-ledger.mjs from docs/target/actions.json. Edit the data, not this file. -->', '');
  L.push('The central record of everything **done** on the project since it began on 2026-09-15: what was built (implementations, art installs), what was carried out (deploys, reviews, records, infrastructure, account moves, downloads, maintenance, process changes), who did it, which decisions it carried out, and the evidence. Its sibling ledgers are `CHANGELOG.md` (player-facing, one entry per live build) and `DECISIONS.md` (Bailey\'s decisions, `docs/target/decisions.json`). Dates are Eastern time. The project began as Pyrefly Reprise and is called Echoes of Spira since 2026-10-04; internal names keep "pyrefly".', '');
  L.push('Rows group sensible units of work, never one row per commit: a feature lane, a fix batch, an art install, one deploy, one review, one clean-up. "Who" names Bailey, the driver session (the main chat that plans and coordinates), a lane (a sub-agent doing one track), a side session or an outside session. Evidence that exists only in the driver\'s own notes is marked "(not in the repo)".', '');
  L.push('## How to add a row', '');
  L.push('1. Append one line to the `actions` array of `docs/target/actions.json` (one entry per line; never edit, reorder or renumber an old row; the next id is the last id plus one, even when the work is older):', '');
  L.push('   `{"id":"A-0000","date":"YYYY-MM-DD","kind":"deploy","title":"...","what":"...","who":"...","decisions":["D-000"],"game":"both","result":"...","evidence":["commit abc1234"],"reversible":{"value":true,"how":"..."}}`', '');
  L.push(`2. Run \`node tools/actions-ledger.mjs\` to regenerate this file. \`node tools/actions-ledger.mjs --check\` exits 1 when the data is malformed or this file is stale; \`tests/unit/actions-ledger.test.ts\` runs the same checks.`);
  L.push(`3. \`kind\` is one of ${KINDS.map(code).join(', ')}. \`game\` is ${GAMES.map(code).join(', ')} (decided from the sources, AGENTS.md rule 14). \`decisions\` links the D- (and early E-) ids the row carries out. \`result\` says whether it is done, shipped in which release, on a branch, parked, reverted or failed and why.`);
  L.push('4. The repository is public: no email addresses (write "account #1", "#2" or "#3"), no card or payment details, no account ids, tokens or keys, no other personal projects, nothing else private to the owner. The validator refuses an email address, a 32-character hex id and card-like digits.', '');
  L.push('## Summary', '', ...summaryLines(rows), '');
  const days = [...new Set(rows.map((r) => r.date))].sort().reverse();
  const count = (d) => rows.filter((r) => r.date === d).length;
  L.push('## Days', '', days.map((d) => `[${d.slice(5)}](#${d}) (${count(d)})`).join(' · '), '');
  L.push('## Ledger (newest first)', '');
  for (const d of days) {
    L.push(`### ${d}`, '');
    for (const r of rows.filter((x) => x.date === d).reverse()) {
      L.push(`- **${r.id}** · ${code(r.kind)} · ${r.game} · **${esc(r.title)}**`);
      L.push(`  - What: ${esc(r.what)}`);
      L.push(`  - Who: ${esc(r.who)}${r.decisions.length ? ` · Decisions: ${r.decisions.join(', ')}` : ''}`);
      L.push(`  - Result: ${esc(r.result)}`);
      L.push(`  - Evidence: ${r.evidence.map(code).join(' · ')}`);
      L.push(`  - Reversible: ${r.reversible.value ? 'yes' : 'no'}, ${esc(r.reversible.how)}`);
    }
    L.push('');
  }
  return `${L.join('\n').replace(/\n+$/, '')}\n`;
}

export function loadActions(root) {
  const file = join(root, 'docs', 'target', 'actions.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Problems with the data, or with an existing ACTIONS.md text that no longer matches it (line endings ignored). */
export function compareLedger(data, existing) {
  const problems = validateActions(data);
  if (problems.length) return problems;
  if (existing.replace(/\r\n/g, '\n') !== renderActions(data)) return ['ACTIONS.md is stale: run node tools/actions-ledger.mjs and commit the result'];
  return [];
}

/** Validates docs/target/actions.json and compares the rendered text with ACTIONS.md. */
export function checkLedger(root) {
  let data;
  try { data = loadActions(root); } catch (e) { return { ok: false, problems: [`docs/target/actions.json: ${e.message}`] }; }
  const target = join(root, 'ACTIONS.md');
  if (!existsSync(target)) return { ok: false, problems: validateActions(data).concat('ACTIONS.md is missing: run node tools/actions-ledger.mjs') };
  const problems = compareLedger(data, readFileSync(target, 'utf8'));
  return { ok: problems.length === 0, problems };
}

function main(argv) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const check = argv.includes('--check'), validateOnly = argv.includes('--validate');
  if (check || validateOnly) {
    const res = validateOnly ? (() => { try { return { problems: validateActions(loadActions(root)) }; } catch (e) { return { problems: [e.message] }; } })() : checkLedger(root);
    for (const p of res.problems) console.error(p);
    if (res.problems.length) return 1;
    console.log(check ? 'ACTIONS.md is current.' : 'actions.json is well formed.');
    return 0;
  }
  const data = loadActions(root);
  const problems = validateActions(data);
  if (problems.length) { for (const p of problems) console.error(p); return 1; }
  writeFileSync(join(root, 'ACTIONS.md'), renderActions(data));
  console.log(`ACTIONS.md written: ${data.actions.length} rows.`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
