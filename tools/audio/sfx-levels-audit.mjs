#!/usr/bin/env node
/**
 * SFX: how loud is each new recorded take against the sound it replaces on a base build, as the game plays it? (r46-fix, FOC46-03)
 *
 *   node tools/audio/sfx-levels-audit.mjs --base=<git ref> --work=<empty dir> [--out=<levels.json>]
 *
 * A "new" take is a parity pack cue that the base build's pack lacks or holds on another take. The sound it replaces is what the REAL mixer answered the
 * same ask with on the base manifest (`tests/unit/helpers/sfxAnswer.ts`): a v2 slice (with its play-time P1 trim, `parityTrims.ts`), another pack cue
 * or the first bank. The asks are those of both games' scripted fights, the menu keys, and the three the fights never reach (Ether, Grenade, Petrify).
 * Each slice is cut out of the decoded file by sample index (offset and length as the game plays it; ffmpeg's `-ss` on a VBR MP3 starts a few tens of ms
 * off and misses the first part of a menu tick) and measured with ffmpeg: EBU R128 integrated loudness of the slice padded with 1 s of silence, true peak,
 * overall RMS and peak. The base files are read from git into `--work`. Needs ffmpeg (FFMPEG_PATH or the project's). Game case: both.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (!process.execArgv.includes('--experimental-transform-types')) {
  const r = spawnSync(process.execPath, ['--experimental-transform-types', '--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const ROOT = new URL('../../', import.meta.url);
const ROOT_PATH = ROOT.pathname.replace(/^\/(\w:)/, '$1');
const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? '').slice(name.length + 3);
const base = arg('base');
const work = arg('work');
if (!base || !work) {
  console.error('usage: node tools/audio/sfx-levels-audit.mjs --base=<git ref> --work=<empty dir> [--out=<levels.json>]');
  process.exit(2);
}
const FFMPEG = process.env.FFMPEG_PATH ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const SR = 44100;
const imp = (p) => import(new URL(p, ROOT).href);
const { answer, parseAudioManifest } = await imp('tests/unit/helpers/sfxAnswer.ts');
const { packsFor, BOSS_PACKS } = await imp('src/audio/sfxV2/packs.ts');
const { scenarios, playScenario } = await imp('tests/unit/helpers/sfxFight.ts');

mkdirSync(work, { recursive: true });
const gitShow = (path, dest) => {
  const r = spawnSync('git', ['-C', ROOT_PATH, 'show', `${base}:${path}`], { maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git show ${base}:${path}: ${r.stderr}`);
  if (dest) writeFileSync(dest, r.stdout);
  return r.stdout;
};
const baseRaw = JSON.parse(gitShow('public/audio/manifest.json').toString('utf8'));
const treeRaw = JSON.parse(readFileSync(new URL('public/audio/manifest.json', ROOT), 'utf8'));
const files = { base: {}, tree: {} };
const need = (raw, state) => {
  const dir = state === 'tree' ? `${ROOT_PATH}public/audio/` : null;
  const get = (rel) => (state === 'tree' ? dir + rel : (gitShow(`public/audio/${rel}`, join(work, rel.replace(/\//g, '_'))), join(work, rel.replace(/\//g, '_'))));
  files[state].v1 = get(raw.sfx.file);
  files[state].v2 = get(raw.sfxV2.file);
  for (const [name, p] of Object.entries(raw.sfxParity.packs)) files[state][name] = get(p.file);
};
need(baseRaw, 'base');
need(treeRaw, 'tree');
const manifests = { base: parseAudioManifest(baseRaw), tree: parseAudioManifest(treeRaw) };

// the new takes
const news = [];
for (const [pack, p] of Object.entries(treeRaw.sfxParity.packs)) {
  for (const [cue, c] of Object.entries(p.cues)) {
    const was = baseRaw.sfxParity.packs[pack]?.cues[cue];
    if (!was || was.take !== c.take) news.push({ pack, cue, game: pack.split('-')[0], specRow: c.specRow, take: c.take });
  }
}

// the asks that reach them
const pairs = new Map();
const note = (n, baseAns, count, label) => {
  const m = pairs.get(`${n.pack}|${n.cue}`) ?? new Map();
  const k = JSON.stringify([baseAns.via, baseAns.played, baseAns.buffer, baseAns.offset, baseAns.duration, baseAns.trimDb]);
  const e = m.get(k) ?? { ans: baseAns, n: 0, asks: [] };
  e.n += count;
  if (e.asks.length < 3 && !e.asks.includes(label)) e.asks.push(label);
  m.set(k, e);
  pairs.set(`${n.pack}|${n.cue}`, m);
};
const cueOf = (a) => String(a.played).replace(/^v2:/, '');
const seenAsk = new Set();
// every pack set a chapter of the game loads (a boss pack answers only in its own chapter)
const setsOf = (game) => [...new Map([null, ...Object.keys(BOSS_PACKS)].map((id) => packsFor(game, id)).map((s) => [s.join('+'), s])).values()];
const ask = (game, a, count) => {
  const sets = setsOf(game);
  for (const set of sets) {
    const t = answer(manifests.tree, game, set, a);
    if (t.via !== 'parity') continue;
    const n = news.find((x) => x.pack === t.buffer && x.cue === cueOf(t) && x.game === game);
    if (n) note(n, answer(manifests.base, game, set, a), count / sets.length, `${a.key}${a.events ? ` [${a.events.join(',')}]` : ''}`);
  }
};
for (const game of ['ffx', 'ffx2']) {
  for (const scenario of scenarios(game)) {
    for (const cue of await playScenario(game, scenario)) {
      const id = `${game}|${scenario.id}|${cue.key}|${(cue.events ?? []).join(',')}`;
      if (seenAsk.has(id)) continue;
      seenAsk.add(id);
      ask(game, cue, 1);
    }
  }
  for (const key of ['cursor-move', 'confirm', 'cancel', 'error', 'menu-open', 'menu-close', 'menu-page', 'turn-ready']) ask(game, { key }, 1);
}
// the asks the scripted fights never reach, as the real presenter makes them
ask('ffx', { key: 'v2:item-use', events: ['item-ether'] }, 1);
ask('ffx', { key: 'v2:explosion', events: ['item-grenade', 'explosion'] }, 1);
ask('ffx', { key: 'v2:petrify-shatter', events: ['petrify-shatter'] }, 1);

// the meter
const decoded = new Map();
const decodeAll = (file) => {
  if (!decoded.has(file)) {
    const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1024 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`decode ${file}: ${r.stderr}`);
    decoded.set(file, r.stdout);
  }
  return decoded.get(file);
};
const ff = (buf, af) => spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-v', 'info', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', '-', '-af', af, '-f', 'null', '-'], { input: buf, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stderr || '';
const num = (m) => (m ? Number(m[1]) : null);
const r2 = (x) => (x === null ? null : Math.round(x * 100) / 100);
function measure(file, offset, duration, trim = 0) {
  const all = decodeAll(file);
  const slice = all.subarray(Math.round(offset * SR) * 8, Math.min(Math.round((offset + duration) * SR) * 8, all.length));
  const a = ff(slice, 'apad=pad_dur=1,ebur128=peak=true');
  const b = ff(slice, 'astats=measure_perchannel=none:measure_overall=RMS_level+Peak_level');
  return {
    lufs: r2(num(/Integrated loudness:[\s\S]*?I:\s+(-?[\d.]+|-inf)\s+LUFS/.exec(a)) + trim),
    tp: r2(num(/True peak:[\s\S]*?Peak:\s+(-?[\d.]+|-inf)\s+dBFS/.exec(a)) + trim),
    rms: r2(num(/Overall[\s\S]*?RMS level dB:\s+(-?[\d.]+|-inf)/.exec(b)) + trim),
    peak: r2(num(/Overall[\s\S]*?Peak level dB:\s+(-?[\d.]+|-inf)/.exec(b)) + trim),
  };
}

const rows = [];
for (const n of news) {
  const tc = treeRaw.sfxParity.packs[n.pack].cues[n.cue];
  const fresh = measure(files.tree[n.pack], tc.offset, tc.duration);
  const stand = [...(pairs.get(`${n.pack}|${n.cue}`)?.values() ?? [])]
    .sort((a, b) => b.n - a.n)
    .map((e) => ({
      desc: `${e.ans.via}:${cueOf(e.ans)}${e.ans.buffer ? `@${e.ans.buffer}` : ''}${e.ans.trimDb ? ` ${e.ans.trimDb > 0 ? '+' : ''}${e.ans.trimDb} dB trim` : ''}`,
      n: e.n,
      asks: e.asks,
      old: e.ans.offset === null || !e.ans.buffer ? null : measure(files.base[e.ans.buffer], e.ans.offset, e.ans.duration, e.ans.trimDb || 0),
    }));
  rows.push({ ...n, dur: tc.duration, new: fresh, stand });
}
if (arg('out')) writeFileSync(arg('out'), `${JSON.stringify(rows, null, 1)}\n`);
const pad = (s, w) => String(s).padEnd(w);
for (const r of rows) {
  const p = r.stand[0];
  const d = p?.old ? r2(r.new.lufs - p.old.lufs) : null;
  console.log(`${pad(r.game, 5)} ${pad(`${r.pack}:${r.cue}`, 34)} new ${pad(r.new.lufs, 7)} LUFS ${pad(r.new.tp, 6)} TP | replaces ${pad(p?.old?.lufs ?? '-', 7)} LUFS | delta ${pad(d ?? '-', 6)} | ${p?.desc ?? 'no base stand-in found'}`);
}
const out = rows.filter((r) => r.stand[0]?.old && Math.abs(r.new.lufs - r.stand[0].old.lufs) > 1.5);
console.log(`# ${rows.length} new takes; ${out.length} more than 1.5 dB from the sound they replace (first stand-in)`);
