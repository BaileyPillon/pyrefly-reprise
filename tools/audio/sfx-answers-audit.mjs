#!/usr/bin/env node
/**
 * SFX: what does the game answer each sound ask with, on a base build and on this tree? (r46-fix, FOC46-02)
 *
 *   node tools/audio/sfx-answers-audit.mjs --base=<git ref> [--out=<file.json>] [--names=a,b,c]
 *
 * The asks are those of both games' scripted fights (the real presenter and chapter voice, `tests/unit/helpers/sfxFight.ts`); the answers come from
 * the REAL `AudioManager.playSfx` (`tests/unit/helpers/sfxAnswer.ts`) with every sprite and pack of a manifest "decoded", once per pack set a chapter
 * loads, for the manifest at `<git ref>:public/audio/manifest.json` and for this tree's. The code under `src/audio` must be the same on both sides
 * (the command says so when it is not): then a difference is the manifest's. Prints every ask whose recording was lost (a recorded sound on the base,
 * the first bank or the synth here) and, for `--names` (default: the retired list), what each of those cues is answered with in each game. Exits 1
 * when a recording was lost. Game case: both, each game its own.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

if (!process.execArgv.includes('--experimental-transform-types')) {
  const r = spawnSync(process.execPath, ['--experimental-transform-types', '--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const ROOT = new URL('../../', import.meta.url);
const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback ?? ''}`).slice(name.length + 3);
const base = arg('base');
if (!base) {
  console.error('usage: node tools/audio/sfx-answers-audit.mjs --base=<git ref> [--out=<file.json>] [--names=a,b]');
  process.exit(2);
}
const imp = (p) => import(new URL(p, ROOT).href);
const { answer, parseAudioManifest, isRecording } = await imp('tests/unit/helpers/sfxAnswer.ts');
const { packsFor, BOSS_PACKS } = await imp('src/audio/sfxV2/packs.ts');
const { RETIRED_V2_CUES } = await imp('src/audio/sfxV2/retired.ts');
const { scenarios, playScenario } = await imp('tests/unit/helpers/sfxFight.ts');

const git = (...a) => spawnSync('git', ['-C', ROOT.pathname.replace(/^\/(\w:)/, '$1'), ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const changed = git('diff', '--name-only', base, 'HEAD', '--', 'src/audio').stdout.split('\n').filter(Boolean);
if (changed.length > 0) console.log(`NOTE: src/audio differs from ${base} (${changed.join(', ')}): the answers below mix code and manifest changes`);
const baseJson = git('show', `${base}:public/audio/manifest.json`);
if (baseJson.status !== 0) throw new Error(`git show ${base}:public/audio/manifest.json failed: ${baseJson.stderr}`);
const manifests = {
  base: parseAudioManifest(JSON.parse(baseJson.stdout)),
  tree: parseAudioManifest(JSON.parse(readFileSync(new URL('public/audio/manifest.json', ROOT), 'utf8'))),
};

const nameOf = (key) => (key.startsWith('v2:') ? key.slice(3) : key);
const sets = (game) => [...new Map([null, ...Object.keys(BOSS_PACKS)].map((id) => packsFor(game, id)).map((s) => [s.join('+'), s])).values()];
const sig = (a) => `${a.via}:${a.played}${a.buffer && a.via === 'parity' ? `@${a.buffer}` : ''}${a.trimDb ? ` (${a.trimDb} dB)` : ''}`;
const names = arg('names', RETIRED_V2_CUES.join(',')).split(',').filter(Boolean);

const lost = [];
const table = [];
const out = { base, games: {} };
for (const game of ['ffx', 'ffx2']) {
  const asks = new Map();
  for (const scenario of scenarios(game)) {
    for (const cue of await playScenario(game, scenario)) asks.set(JSON.stringify([cue.key, cue.events ?? null, cue.coveredBy ?? null]), cue);
  }
  out.games[game] = [];
  for (const ask of asks.values()) {
    for (const set of sets(game)) {
      const b = answer(manifests.base, game, set, ask);
      const t = answer(manifests.tree, game, set, ask);
      out.games[game].push({ key: ask.key, events: ask.events ?? null, set: set.join('+'), base: b, tree: t });
      if ((isRecording(b) || b.via === 'covered') && !isRecording(t) && t.via !== 'covered') lost.push(`${game} ${ask.key}${ask.events ? ` events[${ask.events.join(',')}]` : ''} with packs [${set.join(', ')}]: base ${sig(b)} -> tree ${sig(t)}`);
      if (names.includes(nameOf(ask.key))) table.push({ game, name: nameOf(ask.key), events: ask.events ? `[${ask.events.join(',')}]` : '-', base: sig(b), tree: sig(t) });
    }
  }
}
if (arg('out')) writeFileSync(arg('out'), `${JSON.stringify(out, null, 1)}\n`);

const seen = new Set();
console.log(`# ${names.length} cue name(s), asked in the scripted fights: base ${base} -> this tree`);
for (const name of names) {
  for (const game of ['ffx', 'ffx2']) {
    const rows = table.filter((r) => r.game === game && r.name === name);
    const lines = [...new Set(rows.map((r) => `events ${r.events}: ${r.base} -> ${r.tree}`))];
    if (lines.length === 0) console.log(`- ${name} / ${game}: never asked as a v2 key`);
    for (const l of lines) if (!seen.has(`${game}|${name}|${l}`)) { seen.add(`${game}|${name}|${l}`); console.log(`- ${name} / ${game}: ${l}`); }
  }
}
console.log(`# recordings lost since ${base}: ${lost.length}`);
for (const l of [...new Set(lost)]) console.log(`- ${l}`);
process.exit(lost.length > 0 ? 1 : 0);
void pathToFileURL;
