/**
 * The shipped voice folder against itself: `public/audio/voice/` holds one manifest per chapter, the recordings they name, and an
 * index. This is what `tools/audio/qa.mjs --strict` (the deploy preflight) and `tests/unit/audio-voice-shipped.test.ts` run, so a
 * recording nothing names, a manifest line whose file is missing or the wrong size, an FFX-2 manifest, or a folder over the voice
 * budget fails before it ships. Pure file reads: no network, no ffmpeg.
 *
 * Game case: both (shared plumbing). `allowedGames` is the list of games with picked voices; today FFX alone.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { VOICE_BUDGET_BYTES } from './manifest-io.mjs';

const SAFE_FILE = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*\.mp3$/i;

function walk(dir, prefix = '') {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) out.push(...walk(path.join(dir, item.name), rel));
    else out.push(rel);
  }
  return out;
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/**
 * @param {string} dir `public/audio/voice` (or a build's copy). A folder that does not exist audits clean and `present: false`.
 * @returns {{ present: boolean, problems: string[], totals: { files: number, bytes: number, chapters: number, lines: number }, chapters: Record<string, { lines: number, bytes: number }> }}
 */
export function auditVoiceDir(dir, { budgetBytes = VOICE_BUDGET_BYTES, allowedGames = ['ffx'] } = {}) {
  const problems = [];
  const totals = { files: 0, bytes: 0, chapters: 0, lines: 0 };
  const chapters = {};
  if (!existsSync(dir)) return { present: false, problems, totals, chapters };

  const onDisk = walk(dir);
  const referenced = new Set();
  const manifests = onDisk.filter((f) => /^[^/]+\.json$/.test(f) && f !== 'index.json');
  for (const name of manifests) {
    let manifest;
    try {
      manifest = readJson(path.join(dir, name));
    } catch {
      problems.push(`voice manifest ${name} is not valid JSON`);
      continue;
    }
    const chapter = name.slice(0, -'.json'.length);
    if (manifest?.version !== 1) problems.push(`${name}: version must be 1`);
    if (manifest?.chapter !== chapter) problems.push(`${name}: names chapter "${manifest?.chapter}", not "${chapter}"`);
    if (!allowedGames.includes(manifest?.game)) problems.push(`${name}: game "${manifest?.game}" has no picked voices yet (allowed: ${allowedGames.join(', ')})`);
    const entries = Object.entries(manifest?.lines ?? {});
    if (!entries.length) problems.push(`${name}: no lines`);
    const own = new Set();
    for (const [key, entry] of entries) {
      if (!/^[0-9a-f]{14}$/.test(key) && typeof entry?.id !== 'string') problems.push(`${name}: odd key "${key}"`);
      if (typeof entry?.id !== 'string' || typeof entry?.who !== 'string') problems.push(`${name}: ${key} needs an id and a speaker`);
      if (typeof entry?.file !== 'string' || !SAFE_FILE.test(entry.file) || entry.file.includes('..')) {
        problems.push(`${name}: ${key} names an unsafe file "${entry?.file}"`);
        continue;
      }
      if (!Number.isFinite(entry.ms) || entry.ms < 80 || entry.ms > 60_000) problems.push(`${name}: ${entry.id} has an implausible length ${entry.ms} ms`);
      referenced.add(entry.file);
      own.add(entry.file);
      if (!onDisk.includes(entry.file)) {
        problems.push(`${name}: ${entry.id} names a missing file ${entry.file}`);
        continue;
      }
      const bytes = statSync(path.join(dir, entry.file)).size;
      if (entry.bytes !== undefined && entry.bytes !== bytes) problems.push(`${name}: ${entry.id} is ${bytes} bytes on disk but the manifest says ${entry.bytes}`);
    }
    chapters[chapter] = { lines: entries.length, bytes: [...own].reduce((a, f) => a + (onDisk.includes(f) ? statSync(path.join(dir, f)).size : 0), 0) };
    totals.chapters++;
    totals.lines += entries.length;
  }

  for (const file of onDisk) {
    if (file === 'index.json' || /^[^/]+\.json$/.test(file)) continue;
    if (!file.endsWith('.mp3')) {
      problems.push(`voice folder holds a file nothing names: ${file}`);
      continue;
    }
    if (!referenced.has(file)) problems.push(`orphan voice file not in any manifest: ${file}`);
  }
  for (const file of referenced) {
    if (!onDisk.includes(file)) continue;
    totals.files++;
    totals.bytes += statSync(path.join(dir, file)).size;
  }
  if (totals.bytes > budgetBytes) problems.push(`shipped voice is ${(totals.bytes / 1e6).toFixed(2)} MB, over the ${budgetBytes / 1e6} MB voice budget`);

  const indexFile = path.join(dir, 'index.json');
  if (existsSync(indexFile)) {
    try {
      const index = readJson(indexFile);
      if (index?.totals?.files !== totals.files || index?.totals?.bytes !== totals.bytes) {
        problems.push(`index.json says ${index?.totals?.files} files / ${index?.totals?.bytes} bytes, the folder holds ${totals.files} / ${totals.bytes}: run voice-ship again`);
      }
      for (const chapter of Object.keys(index?.chapters ?? {})) if (!(chapter in chapters)) problems.push(`index.json lists ${chapter}, which has no manifest`);
    } catch {
      problems.push('voice/index.json is not valid JSON');
    }
  } else if (manifests.length) {
    problems.push('voice/index.json is missing');
  }
  return { present: true, problems, totals, chapters };
}
