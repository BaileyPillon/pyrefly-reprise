#!/usr/bin/env node
/**
 * Record the FFX voice set (Tidus, Yuna, Auron) with ElevenLabs text to speech: one take per line, written to
 * `D:/Tools/elevenlabs/candidates/voice-ffx-<date>/<line id>.mp3` (never inside the repo, never under public/).
 *
 *   node tools/audio/voice-generate.mjs                       DRY RUN (the default): the plan and the credit estimate. No key is read, nothing is sent.
 *   node tools/audio/voice-generate.mjs --list                the dry run, plus every recording (id, characters, text)
 *   node tools/audio/voice-generate.mjs --plan-md docs/audio/voice-ffx-plan.md   write the plan document
 *   node tools/audio/voice-generate.mjs --yes --max-credits 7000                 LIVE: send every recording that is not on disk yet
 *
 * Narrowing: --speaker tidus,yuna   --ids a,b,c   --ids-file list.txt   --limit N (the first N, for a canary)
 * A retake of lines Bailey flagged: --ids a,b --take 2 [--tags] [--stitch]   (writes <id>.take2.mp3 beside take 1, with a new seed)
 *   --tags     put the script's emotion in as an audio tag ([sadly], [angrily]...), which v3 and v4 read
 *   --stitch   send the previous and next line of the scene as context, which helps a one-word or interrupted line
 *   --no-seed  leave the per-line seed out of the request (the comparison Bailey heard sent none; use it if the service ever rejects a seed)
 * Other: --out DIR  --model eleven_v4  --force (record again over a file)  --include-unserved-quips  --format mp3_44100_128
 *
 * Safety (docs/audio/elevenlabs-plan.md section 2): a live run needs BOTH --yes and --max-credits N, refuses a batch whose
 * estimate is over N before anything is sent, sends the key only to api.elevenlabs.io (or a loopback server for the tests),
 * stops at the first failure, skips every file already on disk (so a rerun after a failure costs only what is missing), and
 * logs each call to D:/Tools/elevenlabs/usage.jsonl. The voice ids come from voices.json (outside the repo) and are never printed.
 *
 * Game case: FFX only (see voice-lib.mjs). The model is eleven_v4 with the default voice settings, as in Bailey's side-by-side.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as L from './elevenlabs-lib.mjs';
import * as V from './voice-lib.mjs';

const [, , ...argv] = process.argv;
const flags = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const [k, v] = argv[i].slice(2).split(/=(.*)/s);
  flags[k] = v !== undefined ? v : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
}
const die = (msg) => { console.error(`voice-generate: ${msg}`); process.exit(1); };
const text = (name) => (typeof flags[name] === 'string' ? flags[name] : undefined);

const live = flags.yes === true && flags['dry-run'] !== true;
const model = text('model') ?? V.DEFAULT_MODEL;
const take = flags.take === undefined ? 1 : Number(flags.take);
if (!Number.isInteger(take) || take < 1 || take > 9) die('--take must be a whole number from 1 to 9');
// The pass is named for the day Bailey asked for it, not the day a command happens to run, so the folder is the same on every run
// (a rerun after a failure finds its files) and the commands below can be pasted as printed.
const PASS = 'voice-ffx-2026-10-07';
const OUT = path.resolve(text('out') ?? path.join(L.HOME, 'candidates', PASS));
if (L.insideRepo(OUT) || L.underPublic(OUT)) die(`candidates stay outside the repo and never under public/ (got ${OUT})`);
const FORMAT = text('format') ?? 'mp3_44100_128';
const OUT_ARG = `--out ${L.HOME.replace(/\\/g, '/')}/candidates/${PASS}`;
const ask = (cmd) => `node tools/audio/voice-generate.mjs ${cmd}`.trim();

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

const inventory = L.loadInventory();
const all = V.selectLines(inventory.doc, { includeUnservedQuips: flags['include-unserved-quips'] === true });
const skippedQuips = V.selectLines(inventory.doc, { includeUnservedQuips: true }).length - V.selectLines(inventory.doc).length;
const { recordings: allRecordings, recordingOf } = V.planRecordings(all);

let recordings = allRecordings;
if (text('speaker')) {
  const speakers = text('speaker').split(',').map((s) => s.trim());
  const unknown = speakers.filter((s) => !V.FFX_VOICES.includes(s));
  if (unknown.length) die(`--speaker takes ${V.FFX_VOICES.join(', ')} (got ${unknown.join(', ')}); every other voice is not picked yet`);
  recordings = recordings.filter((r) => speakers.includes(r.voice));
}
const idList = [...(text('ids') ? text('ids').split(',') : []), ...(text('ids-file') ? readFileSync(path.resolve(text('ids-file')), 'utf8').split(/\s+/) : [])].map((s) => s.trim()).filter(Boolean);
if (idList.length) {
  const known = new Set(allRecordings.map((r) => r.id));
  const missing = idList.filter((id) => !known.has(id));
  if (missing.length) die(`not a recording in this pass: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5})` : ''} (a repeated line shares the first occurrence's id)`);
  recordings = recordings.filter((r) => idList.includes(r.id));
}
if (text('limit')) recordings = recordings.slice(0, Number(text('limit')));

const jobs = recordings.map((line) => {
  const { previous, next } = flags.stitch === true ? V.neighbours(inventory.doc, line) : {};
  const { text: sent, chars, body } = L.buildTtsBody(line, { model, tags: flags.tags === true, seed: flags['no-seed'] === true ? undefined : V.seedFor(line, take), previous, next });
  const file = V.takeFile(OUT, line.id, take);
  return { line, sent, chars, body, file, held: existsSync(file) && flags.force !== true, credits: L.creditsForTts(chars, model), usd: L.usdForTts(chars, model) };
});
const todo = jobs.filter((j) => !j.held);
const credits = todo.reduce((a, j) => a + j.credits, 0);
const usd = todo.reduce((a, j) => a + j.usd, 0);

const fullCredits = allRecordings.reduce((a, r) => a + L.creditsForTts(r.chars, model), 0);
const fullUsd = allRecordings.reduce((a, r) => a + L.usdForTts(r.chars, model), 0);
const cap = Math.ceil(fullCredits * 1.1 / 100) * 100;
const commands = [
  '# dry run (no key read, nothing sent)', ask(''),
  '# optional canary: the first 6 recordings, then listen before the rest', ask(`--limit 6 ${OUT_ARG} --yes --max-credits 400`),
  '# the whole set (skips what is already on disk; stops at the first failure)', ask(`${OUT_ARG} --yes --max-credits ${cap}`),
  '# then: check the files (writes nothing), and install them into public/audio/voice', `node tools/audio/voice-ship.mjs --dir ${L.HOME.replace(/\\/g, '/')}/candidates/${PASS}`, `node tools/audio/voice-ship.mjs --dir ${L.HOME.replace(/\\/g, '/')}/candidates/${PASS} --install`,
  '# later: a retake of lines Bailey flagged (new seed, kept beside take 1; then picks.json in the folder says which take ships)', ask(`--ids <id>,<id> --take 2 --tags --stitch ${OUT_ARG} --yes --max-credits 300`),
];

if (text('plan-md')) {
  const file = path.resolve(text('plan-md'));
  mkdirSync(path.dirname(file), { recursive: true });
  const md = V.planMarkdown({ selected: all, recordings: allRecordings, recordingOf, skippedQuips, model, credits: fullCredits, usd: L.money(fullUsd), commands, generated: 'Generated by `node tools/audio/voice-generate.mjs --plan-md`' });
  writeFileSync(file, md);
  console.log(`wrote ${path.relative(process.cwd(), file)} (${allRecordings.length} recordings)`);
}

const s = V.summarise(all, allRecordings);
console.log(`FFX voice pass: ${s.lines} lines -> ${s.recordings} recordings (${s.lines - s.recordings} repeats share a take), ${s.recordedChars} characters; ${skippedQuips} unseen victory quips left out`);
for (const [v, x] of Object.entries(s.byVoice)) console.log(`  ${v.padEnd(6)} ${String(x.lines).padStart(3)} lines  ${String(x.recordings).padStart(3)} recordings  ${String(x.recordedChars).padStart(5)} characters`);
console.log(`this run: ${recordings.length} recording(s) selected, ${jobs.length - todo.length} already on disk, ${todo.length} to send: ${credits} credits (about ${L.money(usd)} at the API list price), model ${model}, take ${take}${flags.tags ? ', audio tags' : ''}${flags.stitch ? ', scene context' : ''}`);
console.log(`output: ${OUT}`);
if (flags.list === true) for (const j of jobs) console.log(`  ${j.held ? 'HAVE ' : '     '}${j.line.id.padEnd(46)} ${String(j.chars).padStart(3)}  ${j.line.voice.padEnd(6)} ${j.line.text}`);

if (!live) {
  console.log('\nDRY RUN: nothing was sent and no key was read. Commands for the driver:');
  for (const c of commands) console.log(`  ${c}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Live: one request per recording, sequential, stop at the first failure
// ---------------------------------------------------------------------------

const maxCredits = Number(text('max-credits'));
if (!(maxCredits > 0)) die('a live run needs --max-credits N (a hard cap; the batch is refused when its estimate is over it)');
if (credits > maxCredits) die(`the batch is estimated at ${credits} credits, over the cap of ${maxCredits}; nothing was sent`);
if (!todo.length) { console.log('nothing to send: every selected recording is already on disk (--force records again)'); process.exit(0); }
const found = L.loadKey();
if (!found) die(`no key: set ELEVENLABS_API_KEY or save it in ${path.join(L.HOME, 'key.txt')} (outside the repo, never committed)`);
const voices = V.pickedVoices(L.HOME, [...new Set(todo.map((j) => j.line.voice))]);
const base = L.apiBase();
console.log(`key loaded from ${found.source === 'ELEVENLABS_API_KEY' ? 'the environment' : 'its file'}; sending to ${base}`);

async function speak(job) {
  const url = new URL(`${base}/v1/text-to-speech/${voices[job.line.voice].id}`);
  url.searchParams.set('output_format', FORMAT);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'xi-api-key': found.key, 'content-type': 'application/json' }, body: JSON.stringify(job.body) });
    if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 2 ** (attempt + 1)) * 1000)); continue; }
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`), { status: res.status });
    return { requestId: res.headers.get('request-id'), audio: Buffer.from(await res.arrayBuffer()) };
  }
}

let spent = 0;
let done = 0;
for (const job of todo) {
  if (spent + job.credits > maxCredits) die(`stopping before ${job.line.id}: ${spent} spent, ${job.credits} more would pass the cap of ${maxCredits}`);
  try {
    const { requestId, audio } = await speak(job);
    if (audio.length < 1000) throw new Error(`the response for ${job.line.id} is only ${audio.length} bytes: not audio`);
    mkdirSync(path.dirname(job.file), { recursive: true });
    writeFileSync(job.file, audio);
    writeFileSync(job.file.replace(/\.mp3$/, '.json'), JSON.stringify({ lineId: job.line.id, textHash: job.line.textHash, voice: job.line.voice, option: voices[job.line.voice].option, take, model, sent: job.sent, chars: job.chars, seed: job.body.seed, stitched: flags.stitch === true, requestId, bytes: audio.length, sha256: L.sha256(audio) }, null, 1));
    spent += job.credits;
    done++;
    L.appendUsage({ mode: 'voice-ffx', label: `tts ${job.line.id} as ${job.line.voice} (take ${take})`, credits: job.credits, usd: Number(job.usd.toFixed(4)), requestId, out: path.relative(OUT, job.file), status: 'ok' });
    if (done % 20 === 0 || done === todo.length) console.log(`  ${done}/${todo.length} recorded, ${spent} credits estimated spent`);
  } catch (err) {
    L.appendUsage({ mode: 'voice-ffx', label: `tts ${job.line.id} (take ${take})`, credits: 0, status: `failed ${err.status ?? ''}` });
    die(`${job.line.id} failed (${err.message}); stopped after ${done} recordings and ${spent} credits. Run the same command again: files already on disk are skipped.`);
  }
}
console.log(`done: ${done} recording(s), ${spent} credits estimated spent; run "node tools/audio/elevenlabs.mjs balance --yes" for the real figure. Next: node tools/audio/voice-ship.mjs --dir ${OUT}`);
