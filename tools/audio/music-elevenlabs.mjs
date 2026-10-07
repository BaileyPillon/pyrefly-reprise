#!/usr/bin/env node
/**
 * Install and measure the ElevenLabs takes that ship under existing cue names (2026-10-07).
 *
 *   node tools/audio/music-elevenlabs.mjs install [--variant=wide|narrow] [--cue=a,b]
 *   node tools/audio/music-elevenlabs.mjs measure
 *
 * `docs/audio/music-elevenlabs-2026-10-07.json` is the record. It holds two kinds of content. What a person wrote
 * down: the pick, the prompt, the raw take's hash, where the mastered files are staged
 * (`D:/Tools/elevenlabs/install/<cue>/`, outside the repo), the tempo and key, and both stereo variants' hashes
 * and manifest entries. And what this tool measures from the files that are in `public/audio` right now: every
 * `after`, the stereo gate, which variant is installed.
 * `tests/unit/audio-music-elevenlabs.test.ts` holds the shipped files to the record, so a file swapped without
 * `measure` fails it.
 *
 * install   Copies each cue's staged file (`stage/`, the stereo image Bailey heard, or `stage-narrow/`, the same
 *           file with the project's width stage added) to `public/audio/music/<cue>.mp3` after checking its
 *           hash against the record, and rewrites that cue's manifest entry from the record (loop points and
 *           all) with `source` set, under the manifest lock, touching no other byte of the manifest.
 * measure   Runs qa.mjs on the whole shipped set and quality-measure.py on the record's files, writes the
 *           measured fields back into the record and prints the figures the THEMES.md rows must show. About a
 *           minute.
 *
 * To swap the stereo variant:  install --variant=narrow, then measure, then correct the THEMES.md rows.
 * To swap in a re-cut loop: add it to the cue's `variants` in the record (`dir` of its staging folder, `sha256`, `bytes`,
 *   `manifestEntry`, `stereo`, and `file` when the staged file is not named like the cue's `install.stageFile`), then
 *   install --cue=<cue> --variant=<its name>, then measure, then correct the THEMES.md row.
 * To add a cue (the title, say): add its entry to the record by hand, then install and measure.
 *
 * Game case: both (shared plumbing; the record says which cue is which game's).
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AUDIO_BUDGET_BYTES, setMusicEntryText, withManifestLock } from './manifest-io.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO = join(ROOT, 'public/audio');
const MANIFEST = join(AUDIO, 'manifest.json');
const RECORD = join(ROOT, 'docs/audio/music-elevenlabs-2026-10-07.json');
const PY = process.env.PYREFLY_PYTHON ?? 'python'; // not PYTHON: some shells set it to a quoted path
const RATE = 44100;

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const round = (n, digits) => Number(n.toFixed(digits));
const readRecord = () => JSON.parse(readFileSync(RECORD, 'utf8'));
const writeRecord = (record) => writeFileSync(RECORD, `${JSON.stringify(record, null, 2)}\n`);
const inRange = (x, [low, high]) => x >= low && x <= high;

async function install(variant, only) {
  const record = readRecord();
  for (const cue of record.cues) {
    if (only && !only.includes(cue.cue)) continue;
    const v = cue.variants[variant];
    if (!v) throw new Error(`${cue.cue}: the record has no "${variant}" variant`);
    const staged = join(cue.install.dir, v.dir, 'music', v.file ?? cue.install.stageFile);
    if (statSync(staged).size !== v.bytes || sha256(staged) !== v.sha256) {
      throw new Error(`${staged} is not the ${variant} file the record names (sha256 ${v.sha256}, ${v.bytes} bytes)`);
    }
    copyFileSync(staged, join(AUDIO, 'music', `${cue.cue}.mp3`));
    // The manifest is edited as text under its lock, like every other writer: one entry changes and no other byte does.
    await withManifestLock(AUDIO, () => {
      const entry = { file: `music/${cue.cue}.mp3`, ...v.manifestEntry, source: record.source };
      const next = setMusicEntryText(readFileSync(MANIFEST, 'utf8'), cue.cue, entry);
      const temp = `${MANIFEST}.tmp-${process.pid}`;
      writeFileSync(temp, next);
      renameSync(temp, MANIFEST);
    });
    console.log(`installed ${cue.cue} (${variant}) from ${staged}`);
  }
  console.log('Next: node tools/audio/music-elevenlabs.mjs measure');
}

function measure() {
  const record = readRecord();
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const temp = mkdtempSync(join(tmpdir(), 'elevenlabs-'));
  try {
    // qa.mjs over the whole shipped set: the per-cue gates, the manifest-versus-disk check and the budget.
    const qaPath = join(temp, 'qa.json');
    execFileSync(process.execPath, [join(ROOT, 'tools/audio/qa.mjs'), `--json=${qaPath}`, '--quiet'], { stdio: 'inherit' });
    const qa = JSON.parse(readFileSync(qaPath, 'utf8'));

    // quality-measure.py on the record's files: stereo, loudness range, rise time, the encoder wall.
    const files = record.cues.map((cue) => join(AUDIO, manifest.music[cue.cue].file));
    const qualityPath = join(temp, 'quality.json');
    execFileSync(PY, [join(ROOT, 'tools/audio/quality-measure.py'), ...files, '--json', qualityPath], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    const quality = JSON.parse(readFileSync(qualityPath, 'utf8'));

    const gate = record.stereoGate.thresholds;
    for (const cue of record.cues) {
      const file = join(AUDIO, manifest.music[cue.cue].file);
      const row = qa.cues.find((r) => r.name === cue.cue);
      const q = quality.find((r) => r.file === basename(file));
      if (!row || !q) throw new Error(`${cue.cue}: no qa or quality row for ${file}`);
      const sha = sha256(file);
      cue.installedVariant = Object.entries(cue.variants).find(([, v]) => v.sha256 === sha)?.[0] ?? null;
      cue.after = {
        bytes: statSync(file).size,
        sha256: sha,
        decodedSamples: Math.round(row.duration * RATE),
        qa: {
          lufs: round(row.lufs, 2),
          truePeakDb: round(row.truePeakDb, 2),
          seamOk: row.seamOk,
          seamStep: round(row.seamStep, 5),
          seamAllowed: round(row.seamAllowed, 5),
          seamFluxRatio: round(row.seamFluxRatio, 2),
          tilt: round(row.tilt, 1),
          failures: row.failures,
        },
        measure: {
          corr: q.corr,
          sideMid: q.sideMid,
          monoLoss: q.monoLoss,
          lra: q.lra,
          riseMs: q.riseMs,
          crispDb: q.crispDb,
          hfFlatnessDb: q.hfFlatnessDb,
          topEdge70: q.topEdge70,
          cliff: q.cliff,
        },
      };
      cue.themesStereoGate = {
        corr: inRange(q.corr, gate.corr),
        sideMid: inRange(q.sideMid, gate.sideMid),
        monoLoss: q.monoLoss >= gate.monoLossMin,
      };
    }

    record.gates = {
      ...record.gates,
      qaStrictFindings: qa.cues.filter((c) => c.failures.length > 0).length + qa.manifest.problems.length,
    };
    writeRecord(record);

    // The totals are not stored in the record (they change with every cue added or taken out, and the test works
    // them out from the manifest and the chain of records instead); they are printed here for the notes.
    const musicBytes = Object.values(manifest.music).reduce((sum, entry) => sum + entry.bytes, 0);
    const shippedBytes = musicBytes + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0);
    console.log(`wrote ${RECORD}`);
    console.log(`qa findings ${record.gates.qaStrictFindings}; music ${musicBytes} bytes, shipped audio ${shippedBytes} of ${AUDIO_BUDGET_BYTES}`);
    console.log('\nThe THEMES.md "How each cue ships" rows must show:');
    for (const cue of record.cues) {
      const m = cue.after.measure;
      const failed = Object.entries(cue.themesStereoGate).filter(([, ok]) => !ok).map(([name]) => name);
      console.log(
        `  ${cue.cue.padEnd(24)} ${cue.installedVariant ?? 'UNKNOWN FILE'}: corr ${m.corr} | side/mid ${m.sideMid} | mono loss ${m.monoLoss}` +
          `  (stereo gate ${failed.length ? `fails ${failed.join(', ')}` : 'passes'})`,
      );
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

const [command, ...args] = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

if (command === 'install') {
  const variant = flag('variant') ?? 'wide';
  await install(variant, flag('cue')?.split(','));
} else if (command === 'measure') {
  measure();
} else {
  console.log('usage: node tools/audio/music-elevenlabs.mjs install [--variant=wide|narrow] [--cue=a,b]\n       node tools/audio/music-elevenlabs.mjs measure');
  process.exit(command ? 1 : 0);
}
