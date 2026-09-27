#!/usr/bin/env node
/**
 * Listening pack v2 (2026-09-27) for Bailey: Direction B, outside the repo.
 *
 *   node tools/audio/modern/pack-b.mjs [--out=D:/Tools/pyrefly-scratch/audio-pack-v2-0927]
 *
 * Cut from the lossless masters render-b-score.mjs leaves in its WORK folder
 * (never from the MP3s), each window gained to -16 LUFS integrated, limited
 * under -1 dBTP, 1 s fades, MP3 192 kbps CBR. The first four are the cues
 * Bailey criticised (title, Seymour, Shuyin, Yojimbo) at the SAME windows as
 * audio-pack-0926 tracks 1 to 4, so each can be compared with today's sound.
 * Game case: both (FFX and FFX-2 cues; the Macalania sketches are FFX only).
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const run = promisify(execFile);
const FFMPEG = process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const WORK = process.env.B_WORK || 'D:/Tools/pyrefly-scratch/direction-b-0927-work';
const OUT = process.argv.slice(2).find((a) => a.startsWith('--out='))?.slice(6) ?? 'D:/Tools/pyrefly-scratch/audio-pack-v2-0927';

/** [file stem, master WAV, start s, length s, what it is]. */
const TRACKS = [
  ['01-title-B', 'title', 0, 55, 'Title theme in Direction B (same window as pack 0926 track 1)'],
  ['02-boss-seymour-B', 'boss-seymour', 20, 55, 'Seymour boss cue in B, from 0:20 (same window as 0926 track 2)'],
  ['03-boss-shuyin-B', 'boss-shuyin', 15, 55, 'Shuyin boss cue in B, from 0:15 (same window as 0926 track 3)'],
  ['04-boss-yojimbo-B', 'boss-yojimbo', 0, 60, "Yojimbo boss cue \"The Summoner's Sorrow\" in B, from the top (same window as 0926 track 4)"],
  ['05-battle-ffx-B', 'battle-ffx', 6.4, 45, 'FFX ordinary battle in B, from the loop start (the full-length version of the clip you picked)'],
  ['06-boss-ffx2-aeon-B', 'boss-ffx2-aeon', 12, 45, 'FFX-2 battle (Bahamut and the aeons) in B, from the loop start'],
  ['07-scene-zanarkand-dome-B', 'scene-zanarkand-dome', 10, 45, 'A scene cue: Zanarkand Dome (Chapter II) in B, from the loop start'],
  ['08-macalania-a-B', 'macalania-a', 10, 35, 'Macalania scene sketch A, "The Frozen Temple", in B (from 0:10, same window as 0926 track 9)'],
  ['09-macalania-b-B', 'macalania-b', 10, 35, 'Macalania scene sketch B, "The Wedding Proposal", in B (from 0:10)'],
  ['10-macalania-c-B', 'macalania-c', 10, 35, 'Macalania scene sketch C, "Crystal and Pyreflies", in B (from 0:10)'],
];

async function ff(args) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-nostats', '-y', ...args], { maxBuffer: 64 << 20, windowsHide: true });
  return stderr;
}
async function measure(file, extra = []) {
  const err = await ff([...extra, '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const tail = err.slice(err.lastIndexOf('Summary:'));
  const num = (re) => Number((tail.match(re) || [])[1]);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), tp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

mkdirSync(OUT, { recursive: true });
const rows = [];
let total = 0;
for (const [stem, master, start, len, what] of TRACKS) {
  const src = path.join(WORK, 'master', `${master}.wav`);
  if (!existsSync(src)) { rows.push(`| - | ${stem} | MISSING (no master for ${master}) | - |`); continue; }
  const cut = ['-ss', String(start), '-t', String(len)];
  const pre = await measure(src, cut);
  // Iterate: the fades and the limiter move the level, so re-measure the MP3
  // and correct the gain (at most three passes, stop within 0.15 LU).
  let gain = -16 - pre.lufs;
  const out = path.join(OUT, `${stem}.mp3`);
  let post;
  for (let pass = 0; pass < 3; pass++) {
    const af = `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:level=false,afade=t=in:d=1,afade=t=out:st=${len - 1}:d=1`;
    await ff([...cut, '-i', src, '-af', af, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
    post = await measure(out);
    if (Math.abs(post.lufs + 16) <= 0.15) break;
    gain += -16 - post.lufs;
  }
  total += len;
  rows.push(`| ${rows.length + 1} | \`${stem}.mp3\` | ${what} | ${mmss(len)} | ${post.lufs.toFixed(1)} LUFS, ${post.tp.toFixed(1)} dBTP |`);
  process.stderr.write(`[pack] ${stem}: ${len} s, ${post.lufs} LUFS, ${post.tp} dBTP\n`);
}

const md = `# Pyrefly Reprise: listening pack v2 (2026-09-27), Direction B

You picked Direction B (the AI restyle, track 7 of the 26 September pack).
This pack is the whole score re-rendered that way: the same notes, tempo and
form as today's music, with the model changing the sound and the playing.
Standalone, outside the repo. ${TRACKS.length} clips, MP3 192 kbps, each
levelled to -16 LUFS so none is louder because of how it was mixed.
1 s fades in and out. **Total: ${mmss(total)}.**

Tracks 1 to 4 are the four cues you said sound like SNES music, cut at the
same points as tracks 1 to 4 of the 26 September pack, so you can play the
old and new versions one after the other.

## Listening order

| # | File | What it is | Length | Level |
|---|---|---|---|---|
${rows.join('\n')}

## Questions

1. Does each of these sound good enough to ship?
2. A number out of 10 for the new sound.
3. Macalania: A, B or C?

I cannot hear any of this (no agent can); every number here is a
measurement. Nothing in the game has changed yet: these are candidates.
`;
writeFileSync(path.join(OUT, 'pack.md'), md);
process.stderr.write(`[pack] total ${mmss(total)} -> ${OUT}\n`);
