#!/usr/bin/env node
/**
 * Turn the recordings Bailey picked into what the game plays: trim, loudness-match, encode, install, and write the manifests.
 *
 *   node tools/audio/voice-ship.mjs --dir D:/Tools/elevenlabs/candidates/voice-ffx-2026-10-07            CHECK: process everything in memory, print the findings, write nothing
 *   node tools/audio/voice-ship.mjs --dir <candidates> --install                                         INSTALL into public/audio/voice/ (mp3s, one manifest per chapter, index.json) and write the report
 *
 * For every recording of the FFX voice pass (the same selection as `voice-generate.mjs`): take the candidate (`<id>.mp3`, or the
 * take named in `<dir>/picks.json`), cut its silence to a fixed 35 ms head and 90 ms tail, bring it to -19 LUFS integrated (dual mono,
 * the design's dialogue target) without its true peak passing -1 dBTP, encode mono 24 kHz 64 kbps MP3 (the music's format; about 8 KB
 * a second), then measure the SHIPPED file the way a browser decodes it. A true peak over the ceiling, clipping, 400 ms of silence
 * inside a line or a line under 150 ms FAILS the ship (`--accept id,id` passes a line whose finding was reviewed); loudness off the
 * target and a length 30 percent off the planning estimate are warnings for Bailey's ear and the retake pass.
 *
 * Mid-battle beats are re-costed with the recorded lengths (`registry.scriptDurationMs` with the voice, the worst of a line's written
 * speaker and its stand-ins): a beat that fits keeps its budget, one that overruns by no more than 3 s (a seam: 1.5 s) is EXTENDED (the
 * runtime gives it its voiced length plus the grace instead of cutting a sentence), one beyond that FAILS with the lines to mute:
 * `--mute id,id` leaves those recordings out, so their lines stay text only.
 *
 * Output is deterministic (the same candidates give byte-identical files and manifests), so a rerun is a clean diff. Voice budget:
 * `VOICE_BUDGET_BYTES` (a separate line beside the 90 MB audio cap, proposed in the design, awaiting Bailey).
 * Other flags: --out public/audio/voice  --report docs/audio/voice-ffx-ship-report.json  --partial (lines with no candidate stay silent)
 *   --bitrate 64k  --target-lufs -19  --clean (delete voice files this run does not name)  --include-unserved-quips
 * Game case: FFX only (see voice-lib.mjs).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as L from './elevenlabs-lib.mjs';
import { VOICE_BUDGET_BYTES } from './manifest-io.mjs';
import { auditVoiceDir } from './voice-audit.mjs';
import * as S from './voice-ship-lib.mjs';
import * as V from './voice-lib.mjs';

const registry = await import('../../src/story/registry.ts');
const { lineKey } = await import('../../src/story/voice/voiceKey.ts');
const { VOICE_TAIL_MS } = await import('../../src/story/voice/voicePort.ts');
const { beatVerdict, VOICED_EXTEND_MS, VOICED_EXTEND_SEAM_MS } = await import('../../src/story/voice/voiceBudget.ts');

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const [k, v] = argv[i].slice(2).split(/=(.*)/s);
  flags[k] = v !== undefined ? v : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
}
const die = (msg) => { console.error(`voice-ship: ${msg}`); process.exit(1); };
const text = (n) => (typeof flags[n] === 'string' ? flags[n] : undefined);
const list = (n) => new Set((text(n) ?? '').split(',').map((s) => s.trim()).filter(Boolean));

const dirs = (text('dir') ?? die('--dir <candidates folder>[,<older folder>] is required')).split(',').map((d) => path.resolve(d.trim()));
for (const d of dirs) if (!existsSync(d)) die(`no such folder: ${d}`);
if (dirs.some((d) => L.insideRepo(d))) die('candidates live outside the repo');
const OUT = path.resolve(text('out') ?? path.join(L.ROOT, V.VOICE_PUBLIC_DIR));
const REPORT = path.resolve(text('report') ?? path.join(L.ROOT, 'docs/audio/voice-ffx-ship-report.json'));
const install = flags.install === true;
const opts = { targetLufs: Number(text('target-lufs') ?? S.TARGET_LUFS), ceilingDb: S.CEILING_DBTP, bitrate: text('bitrate') ?? S.ENCODE.bitrate };
const mute = list('mute');
const accept = list('accept');
if (!S.ffmpegAvailable()) die(`ffmpeg not found at ${S.FFMPEG} (set FFMPEG_PATH)`);

// ---------------------------------------------------------------------------
// What is recorded, and the candidate for each
// ---------------------------------------------------------------------------

const inventory = L.loadInventory();
const selected = V.selectLines(inventory.doc, { includeUnservedQuips: flags['include-unserved-quips'] === true });
const { recordings, recordingOf } = V.planRecordings(selected);
const picks = existsSync(path.join(dirs[0], 'picks.json')) ? JSON.parse(readFileSync(path.join(dirs[0], 'picks.json'), 'utf8')) : {};
const found = (id) => dirs.map((d) => V.takeFile(d, id, V.pickedTake(picks, id))).find((f) => existsSync(f));

const results = new Map(); // recording id -> processed
const missing = [];
const t0 = Date.now();
for (const rec of recordings) {
  if (mute.has(rec.id)) continue;
  const file = found(rec.id);
  if (!file) { missing.push(rec.id); continue; }
  const r = S.processLine(file, opts);
  if (r.error) { results.set(rec.id, { rec, error: r.error, fail: [r.error], warn: [] }); continue; }
  const f = S.findings(r, rec.estSpeechMs, opts);
  const accepted = accept.has(rec.id) && f.fail.length > 0;
  results.set(rec.id, { rec, ...r, sha256: createHash('sha256').update(r.bytes).digest('hex'), fail: accepted ? [] : f.fail, warn: accepted ? [...f.warn, ...f.fail.map((x) => `ACCEPTED: ${x}`)] : f.warn });
}
console.log(`processed ${results.size} of ${recordings.length} recordings in ${((Date.now() - t0) / 1000).toFixed(1)} s (${mute.size} muted, ${missing.length} without a candidate)`);
if (missing.length && flags.partial !== true) die(`${missing.length} recording(s) have no candidate yet (${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ', ...' : ''}): run voice-generate.mjs, or --partial to ship what exists (the rest stay text only)`);

const failed = [...results.values()].filter((r) => r.fail.length);
for (const r of failed) console.error(`  FAIL ${r.rec.id}: ${r.fail.join('; ')}`);
const warned = [...results.values()].filter((r) => r.warn.length);
for (const r of warned) console.log(`  warn ${r.rec.id}: ${r.warn.join('; ')}`);

// ---------------------------------------------------------------------------
// The manifests, keyed by what the dialogue box holds
// ---------------------------------------------------------------------------

const manifests = {};
const recordingById = new Map(recordings.map((r) => [r.id, r]));
for (const line of selected) {
  const rec = recordingOf.get(line.id);
  const r = results.get(rec);
  if (!r || r.error) continue;
  const key = lineKey(line.speaker, line.text);
  if (key !== line.textHash) die(`${line.id}: the game's key (${key}) is not the inventory's textHash (${line.textHash}); regenerate the inventory`);
  const m = (manifests[line.chapter] ??= { version: 1, chapter: line.chapter, game: line.game, lines: {} });
  m.lines[key] = { id: rec, file: `${recordingById.get(rec).chapter}/${rec}.mp3`, ms: r.ms, bytes: r.bytes.length, who: line.speaker };
}

// Mid-battle beats re-costed with the recorded lengths. A line's cost is the worst of its written speaker and its stand-ins
// (who speaks is decided line by line, from the party on the field); the policy is `voiceBudget.ts`, shared with the tests.
const beats = [];
for (const chapter of registry.CHAPTER_KEYS) {
  if (!manifests[chapter]) continue;
  const lines = manifests[chapter].lines;
  const spokenMs = (step) => {
    const alts = [step, ...(step.fallback ?? []).map((a) => ({ ...step, who: a.who, text: a.text ?? step.text }))];
    return Math.max(0, ...alts.map((s) => { const e = lines[lineKey(s.type === 'say' ? s.who : 'narrator', s.text)]; return e ? e.ms + VOICE_TAIL_MS : 0; }));
  };
  for (const [name, script] of Object.entries(registry.STORY_CHAPTERS[chapter].midScripts)) {
    const authoredMs = Math.round(registry.scriptDurationMs(script, registry.MID_LINE_HOLD_MS));
    const voicedMs = Math.round(registry.scriptDurationMs(script, registry.MID_LINE_HOLD_MS, spokenMs));
    if (voicedMs === authoredMs) continue; // no spoken line changes this beat's length
    const budgetMs = registry.budgetFor(chapter, name);
    const seam = budgetMs === registry.SEAM_BUDGET_MS;
    beats.push({ id: `${chapter}.mid-${name}`, seam, budgetMs, authoredMs, voicedMs, verdict: beatVerdict(voicedMs, budgetMs, seam) });
  }
}
const over = beats.filter((b) => b.verdict === 'over');
for (const b of beats.filter((x) => x.verdict !== 'fits')) console.log(`  beat ${b.id}: ${(b.voicedMs / 1000).toFixed(1)} s voiced against ${(b.budgetMs / 1000).toFixed(1)} s: ${b.verdict.toUpperCase()}`);
for (const b of over) {
  // The recordings this beat plays, longest first: the lines to leave out (--mute) if the script is not shortened.
  const chapter = b.id.slice(0, b.id.indexOf('.mid-'));
  const name = b.id.slice(b.id.indexOf('.mid-') + 5);
  const keys = new Set();
  const collect = (steps) => { for (const s of steps) { if (s.type === 'say' || s.type === 'narrate') for (const alt of [s, ...(s.fallback ?? []).map((a) => ({ ...s, who: a.who, text: a.text ?? s.text }))]) keys.add(lineKey(alt.type === 'say' ? alt.who : 'narrator', alt.text)); if (s.type === 'parallel') collect(s.steps); if (s.type === 'ifFlag') { collect(s.then); collect(s.else ?? []); } } };
  collect(registry.STORY_CHAPTERS[chapter].midScripts[name]);
  const spoken = [...keys].map((k) => manifests[chapter].lines[k]).filter(Boolean).sort((a, c) => c.ms - a.ms);
  console.error(`  FAIL beat ${b.id}: ${(b.voicedMs / 1000).toFixed(1)} s voiced is more than ${((b.seam ? VOICED_EXTEND_SEAM_MS : VOICED_EXTEND_MS) / 1000).toFixed(1)} s past its ${(b.budgetMs / 1000).toFixed(1)} s budget.`);
  console.error(`       Shorten the script, or leave lines of this beat text only: --mute ${[...new Set(spoken.map((e) => e.id))].slice(0, 3).join(',')}  (its spoken lines, longest first: ${spoken.map((e) => `${e.id} ${(e.ms / 1000).toFixed(1)} s`).join(', ')})`);
}

// ---------------------------------------------------------------------------
// Totals, the gates, and (with --install) the files
// ---------------------------------------------------------------------------

const files = new Map(); // relative file -> bytes
for (const m of Object.values(manifests)) for (const e of Object.values(m.lines)) files.set(e.file, e.bytes);
const totalBytes = [...files.values()].reduce((a, b) => a + b, 0);
const totalMs = [...results.values()].filter((r) => !r.error).reduce((a, r) => a + r.ms, 0);
const lufs = [...results.values()].filter((r) => !r.error).map((r) => r.after.lufs);
console.log(`${files.size} files, ${(totalBytes / 1e6).toFixed(2)} MB of the ${VOICE_BUDGET_BYTES / 1e6} MB voice budget (the 90 MB music and effects cap is untouched), ${(totalMs / 1000).toFixed(0)} s of speech; loudness ${Math.min(...lufs).toFixed(1)} to ${Math.max(...lufs).toFixed(1)} LUFS (target ${opts.targetLufs}); ${warned.length} warning(s), ${beats.filter((b) => b.verdict === 'extended').length} beat(s) extended`);
if (totalBytes > VOICE_BUDGET_BYTES) die(`the voice is over its ${VOICE_BUDGET_BYTES / 1e6} MB budget`);
if (failed.length || over.length) die(`${failed.length} recording(s) and ${over.length} beat(s) fail the gates; nothing was installed`);
if (!install) {
  console.log('CHECK ONLY: nothing was written. Add --install to install into public/audio/voice/ and write the report.');
  process.exit(0);
}

const put = (file, bytes) => {
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file) || !readFileSync(file).equals(bytes)) writeFileSync(file, bytes);
};
const json = (value) => `${JSON.stringify(value, null, 1)}\n`;
for (const r of results.values()) if (!r.error) put(path.join(OUT, r.rec.chapter, `${r.rec.id}.mp3`), r.bytes);
const index = {
  version: 1, game: V.FFX_GAME, voices: V.FFX_VOICES,
  encode: S.ENCODE, targetLufs: opts.targetLufs, ceilingDbtp: opts.ceilingDb,
  chapters: Object.fromEntries(Object.entries(manifests).map(([c, m]) => [c, { lines: Object.keys(m.lines).length, bytes: [...new Set(Object.values(m.lines).map((e) => e.file))].reduce((a, f) => a + files.get(f), 0) }])),
  totals: { files: files.size, bytes: totalBytes, ms: totalMs, lines: Object.values(manifests).reduce((a, m) => a + Object.keys(m.lines).length, 0) },
};
for (const [chapter, m] of Object.entries(manifests)) writeFileSync(path.join(OUT, `${chapter}.json`), json(m));
writeFileSync(path.join(OUT, 'index.json'), json(index));
if (flags.clean === true) {
  const keep = new Set([...files.keys(), 'index.json', ...Object.keys(manifests).map((c) => `${c}.json`)]);
  const walk = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]));
  for (const f of walk(OUT)) if (!keep.has(f)) { rmSync(path.join(OUT, f)); console.log(`  removed ${f}`); }
}

mkdirSync(path.dirname(REPORT), { recursive: true });
writeFileSync(REPORT, json({
  about: 'Written by tools/audio/voice-ship.mjs. Measurements of the shipped files (agents cannot hear: Bailey judges by ear). Do not edit by hand.',
  encode: S.ENCODE, targetLufs: opts.targetLufs, ceilingDbtp: opts.ceilingDb, voiceBudgetBytes: VOICE_BUDGET_BYTES, totals: index.totals,
  muted: [...mute], accepted: [...accept], missing,
  recordings: [...results.values()].filter((r) => !r.error).map((r) => ({ id: r.rec.id, voice: r.rec.voice, chars: r.rec.chars, ms: r.ms, bytes: r.bytes.length, sha256: r.sha256, lufs: r.after.lufs, truePeakDb: r.after.truePeakDb, gainDb: r.gainDb, limited: r.limited, innerSilenceMs: r.innerSilenceMs, take: V.pickedTake(picks, r.rec.id), warn: r.warn })),
  beats,
}));
const audit = auditVoiceDir(OUT);
for (const p of audit.problems) console.error(`  audit: ${p}`);
if (audit.problems.length) die('the installed folder fails its audit');
console.log(`installed ${files.size} files and ${Object.keys(manifests).length} chapter manifests into ${path.relative(L.ROOT, OUT)}; report ${path.relative(L.ROOT, REPORT)}`);
