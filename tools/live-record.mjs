#!/usr/bin/env node
/**
 * node tools/live-record.mjs            writes docs/LIVE.md
 * node tools/live-record.mjs --check    exits 1 when docs/LIVE.md is stale or the data cannot be read
 * node tools/live-record.mjs --stdout   prints the record instead of writing it
 * node tools/live-record.mjs --branches compares docs/target/in-flight.json with the branch tips git knows (prints; writes nothing)
 *
 * "What is live", generated: one page that says which commit is on the site, which bundle and artifact, when it went
 * out, which review obligations are still open, which majors its focused review disclosed and which branches are in
 * flight (ChatGPT's point 8, adopted by Bailey on 2026-10-17: make the current release unmistakable).
 *
 * Sources, all inside the repository so the page can be regenerated and checked anywhere:
 *   docs/deploys.log                      the last line with status=ok is the live build
 *   critic/pending/<sha>.json, critic/cleared/<sha>.json   the build's marker (artifact hash, obligations)
 *   critic/reviews/<sha>-focused.json and -live.json       the review reports of that build (an 8-character prefix works too)
 *   CHANGELOG.md                          the entry whose Address line names the sha
 *   docs/target/in-flight.json            the branches in flight, kept by whoever records a pass (git is not read)
 *
 * Node built-ins only. Game case: both (records and tooling; no game behaviour).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SITE = 'https://echoesofspira.com/';
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const cell = (s) => oneLine(s).replace(/\|/g, '\\|');

/** The deploy log as rows: the header line and blank lines are skipped; `line` is the 1-based line number in the file. */
export function parseDeployLog(text) {
  const rows = [];
  text.replace(/\r\n/g, '\n').split('\n').forEach((raw, i) => {
    const parts = raw.split('\t');
    if (parts.length < 4 || !/^\d{4}-\d{2}-\d{2}T/.test(parts[0])) return;
    const kv = Object.fromEntries(parts.slice(1).map((p) => { const j = p.indexOf('='); return j < 0 ? [p, ''] : [p.slice(0, j), p.slice(j + 1)]; }));
    rows.push({ line: i + 1, at: parts[0], sha: kv.main ?? '', bundle: kv.bundle ?? '', artFiles: Number(kv.artFiles ?? 0), status: kv.status ?? '', override: kv.override ?? '', host: kv.host ?? '' });
  });
  return rows;
}

/** A moment as UTC (as logged) and as US Eastern, which is how the project talks about time. */
export function eastern(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`;
}

/** The marker of a build: pending first (its obligations are open), then cleared. */
export function loadMarker(root, sha) {
  for (const state of ['pending', 'cleared']) {
    const file = join(root, 'critic', state, `${sha}.json`);
    if (existsSync(file)) return { state, data: readJson(file) };
  }
  return { state: 'missing', data: null };
}

/** Every marker in critic/pending: the builds that still owe the critic something. */
export function loadPending(root) {
  const dir = join(root, 'critic', 'pending');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => ({ sha: n.slice(0, -5), data: readJson(join(dir, n)) }));
}

function loadReport(root, sha, kind) {
  for (const stem of [sha, sha.slice(0, 8)]) {
    const file = join(root, 'critic', 'reviews', `${stem}-${kind}.json`);
    if (existsSync(file)) return { file: `critic/reviews/${stem}-${kind}.json`, data: readJson(file) };
  }
  return null;
}

/** The CHANGELOG entry whose Address line names the sha: its heading, or null. */
export function changelogEntry(text, sha) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('## ')) continue;
    const near = lines.slice(i + 1, i + 5).find((l) => l.startsWith('Address:'));
    if (near && new RegExp(`\\bmain ${sha}\\b`).test(near)) return lines[i].slice(3).trim();
  }
  return null;
}

/** Everything the page says, as plain data. `root` is a repository root. */
export function buildLive(root) {
  const log = parseDeployLog(readFileSync(join(root, 'docs', 'deploys.log'), 'utf8'));
  const okRows = log.filter((r) => r.status === 'ok');
  if (!okRows.length) throw new Error('docs/deploys.log has no deploy with status=ok');
  const live = okRows[okRows.length - 1];
  const after = log.filter((r) => r.line > live.line);
  const marker = loadMarker(root, live.sha);
  const focused = loadReport(root, live.sha, 'focused');
  const liveReport = loadReport(root, live.sha, 'live');
  const changelog = existsSync(join(root, 'CHANGELOG.md')) ? changelogEntry(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), live.sha) : null;
  const flightFile = join(root, 'docs', 'target', 'in-flight.json');
  const inFlight = existsSync(flightFile) ? readJson(flightFile) : { asOf: null, note: '', branches: [] };
  const ledgerFile = join(root, 'critic', 'ledger.json');
  const ledger = existsSync(ledgerFile) ? readJson(ledgerFile) : null;
  const majors = (focused?.data.issues ?? []).filter((i) => i.severity === 'major' || i.severity === 'critical');
  return { live, after, recent: log.slice(-6).reverse(), marker, pending: loadPending(root), focused, liveReport, majors, changelog, inFlight, deploysSinceDeep: ledger?.deploysSinceDeep?.length ?? null };
}

const yn = (v) => (v === true ? 'yes' : v === false ? 'no' : 'not recorded');

/** docs/LIVE.md for a model from buildLive. */
export function renderLive(m) {
  const { live, marker, focused, liveReport } = m;
  const d = marker.data ?? {};
  const L = [];
  L.push('# What is live', '');
  L.push('> Generated by `node tools/live-record.mjs` from `docs/deploys.log`, `critic/pending` and `critic/cleared`, the focused review of the live build, `CHANGELOG.md` and `docs/target/in-flight.json`.');
  L.push('> Do not edit it by hand: `tests/unit/live-record.test.ts` fails when it is stale. After a deploy, run the tool and commit the result with the deploy records.', '');
  L.push('## The live build', '');
  L.push('| | |', '|---|---|');
  L.push(`| Site | ${SITE} |`);
  L.push(`| Commit | \`${live.sha}\`${m.changelog ? ` (${cell(m.changelog.match(/Release [0-9.]+ \(r[0-9a-z.]+\)/)?.[0] ?? m.changelog.split(':')[0])})` : ''} |`);
  L.push(`| Bundle | \`${live.bundle}\` |`);
  L.push(`| Deployed | ${live.at} (${eastern(live.at)}) |`);
  L.push(`| Deploy log | \`docs/deploys.log\` line ${live.line}: ${live.host || 'host not recorded'}, ${live.artFiles} art files${live.override ? `, ${live.override} override` : ''} |`);
  L.push(`| Artifact (SHA-256) | ${d.artifactHash ? `\`${d.artifactHash}\`` : 'no marker found for this build'} |`);
  L.push(`| The deploy's own byte check | ${d.liveArtifact ? `${d.liveArtifact.result} (${d.liveArtifact.checked} files compared with the build)` : 'not recorded'} |`);
  L.push(`| Marker | ${marker.state === 'missing' ? 'none' : `\`critic/${marker.state}/${live.sha}.json\` (${marker.state})`} |`);
  L.push(`| Owner override | ${d.ownerOverride?.words ? `“${cell(d.ownerOverride.words)}”` : live.override ? 'recorded as owner in the log; the words are in the decisions ledger' : 'none'} |`);
  L.push(`| CHANGELOG entry | ${m.changelog ? cell(m.changelog) : 'none names this commit'} |`);
  L.push(`| Focused review | ${focused ? `${focused.file}: ship ${focused.data.verdicts?.ship ?? '?'}, changed area ${focused.data.verdicts?.changedArea ?? '?'}` : 'no report found'} |`);
  L.push(`| Live check | ${liveReport ? `${liveReport.file}: deployment ${liveReport.data.verdicts?.deployment ?? '?'}` : 'no report yet'} |`);
  if (m.after.length) L.push(`| Later log lines | ${m.after.length} line(s) after this one have a status other than ok (${m.after.map((r) => `${r.sha}: ${r.status}`).join(', ')}) |`);
  L.push('', 'Is this commit on main? `git merge-base --is-ancestor ' + live.sha + ' origin/main` exits 0 when it is.', '');
  L.push('## Review obligations still open', '');
  const open = m.pending.flatMap((p) => (p.data.obligations ?? []).filter((o) => o.status === 'pending').map((o) => ({ sha: p.sha, o })));
  if (!open.length) L.push('None: every marker in `critic/pending` is settled.', '');
  else {
    L.push('| Build | Obligation | What it needs |', '|---|---|---|');
    for (const { sha, o } of open) L.push(`| \`${sha}\` | ${o.kind}${o.kind === 'deep' && o.carriedFrom ? ` (carries ${o.carriedFrom.length} earlier builds)` : ''} | ${cell(o.requires)} |`);
    L.push('');
  }
  if (m.deploysSinceDeep !== null) L.push(`The ledger counts ${m.deploysSinceDeep} deploys since the last passing deep review (\`critic/ledger.json\`). \`npm run critic:status\` says what each live build still owes.`, '');
  L.push('## Majors disclosed by the focused review of this build', '');
  if (!focused) L.push('No focused report was found for this commit.', '');
  else if (!m.majors.length) L.push(`None: \`${focused.file}\` lists no major or critical issue.`, '');
  else {
    L.push(`From \`${focused.file}\` (a major that is not a regression is disclosed and carried into the next batch):`, '');
    L.push('| Issue | Severity | Introduced by this build | Regression against the previous live build | What |', '|---|---|---|---|---|');
    for (const i of m.majors) L.push(`| ${cell(i.id)} | ${cell(i.severity)} | ${yn(i.introducedByCandidate)} | ${yn(i.regressionVsLive)} | ${cell(i.title)} |`);
    L.push('');
  }
  L.push(`## Branches in flight${m.inFlight.asOf ? ` (as of ${cell(m.inFlight.asOf)})` : ''}`, '');
  if (m.inFlight.note) L.push(cell(m.inFlight.note), '');
  if (!m.inFlight.branches.length) L.push('None recorded.', '');
  else {
    L.push('| Branch | Tip | Game case | What it holds |', '|---|---|---|---|');
    for (const b of m.inFlight.branches) L.push(`| \`${cell(b.name)}\` | \`${cell(b.tip)}\` | ${cell(b.case)} | ${cell(b.what)} |`);
    L.push('', 'Nothing on this list is live. `node tools/live-record.mjs --branches` compares the tips with git.', '');
  }
  L.push('## The last deploys', '', '| Deployed (UTC) | Commit | Bundle | Log line |', '|---|---|---|---|');
  for (const r of m.recent) L.push(`| ${r.at} | \`${r.sha}\` | \`${r.bundle}\` | ${r.line}${r.status === 'ok' ? '' : ` (${r.status})`} |`);
  L.push('');
  return L.join('\n');
}

/** Problems with LIVE.md next to what the repository says; an empty list means it is current. */
export function checkLive(root) {
  let model;
  try { model = buildLive(root); } catch (e) { return [`cannot build the live record: ${e.message}`]; }
  const file = join(root, 'docs', 'LIVE.md');
  if (!existsSync(file)) return ['docs/LIVE.md is missing: run node tools/live-record.mjs'];
  const have = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return have === renderLive(model) ? [] : [`docs/LIVE.md is stale: the last live deploy is ${model.live.sha} (line ${model.live.line} of docs/deploys.log); run node tools/live-record.mjs and commit it`];
}

/** Prints, for each recorded branch, whether git still sees the recorded tip on origin. */
function compareBranches(root) {
  const flight = readJson(join(root, 'docs', 'target', 'in-flight.json'));
  for (const b of flight.branches) {
    let now = null;
    try { now = execFileSync('git', ['rev-parse', '--short=9', `origin/${b.name}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* unknown to git */ }
    const same = now !== null && now.startsWith(b.tip.slice(0, 7));
    console.log(`${same ? 'same ' : now ? 'MOVED' : 'GONE '} ${b.name}: recorded ${b.tip}${now && !same ? `, now ${now}` : ''}`);
  }
}

function main(argv) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (argv.includes('--branches')) { compareBranches(root); return 0; }
  if (argv.includes('--check')) {
    const problems = checkLive(root);
    for (const p of problems) console.error(p);
    if (problems.length) return 1;
    console.log('docs/LIVE.md is current.');
    return 0;
  }
  const text = renderLive(buildLive(root));
  if (argv.includes('--stdout')) { process.stdout.write(text); return 0; }
  writeFileSync(join(root, 'docs', 'LIVE.md'), text);
  console.log(`docs/LIVE.md written (${text.split('\n').length - 1} lines).`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
