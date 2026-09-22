/**
 * Delivered dynamics, measured by ffmpeg (plan cause 1.10).
 *
 *   ebur128  -> integrated loudness I (LUFS), loudness range LRA (LU),
 *               true peak (dBTP)
 *   astats   -> overall peak and RMS level (dBFS); crest = peak - RMS (dB)
 *
 * ffmpeg rather than our own meters so the before/after numbers come from a
 * tool nobody on this project wrote.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const FFMPEG =
  process.env.PYREFLY_FFMPEG ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';

export async function measureDynamics(file) {
  const { stderr } = await run(
    FFMPEG,
    ['-hide_banner', '-nostats', '-i', file, '-filter_complex', 'ebur128=peak=true,astats=measure_perchannel=none', '-f', 'null', '-'],
    { maxBuffer: 1 << 26, windowsHide: true },
  );
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const num = (re, text = summary) => {
    const m = text.match(re);
    return m ? Number(m[1]) : NaN;
  };
  const I = num(/I:\s+(-?[\d.]+) LUFS/);
  const LRA = num(/LRA:\s+(-?[\d.]+) LU/);
  const TP = num(/Peak:\s+(-?[\d.]+) dBFS/);
  const overall = stderr.slice(stderr.lastIndexOf('Overall'));
  const peak = num(/Peak level dB:\s+(-?[\d.]+)/, overall);
  const rms = num(/RMS level dB:\s+(-?[\d.]+)/, overall);
  return {
    lufs: I,
    lra: LRA,
    truePeakDb: TP,
    peakDb: peak,
    rmsDb: rms,
    crestDb: Number((peak - rms).toFixed(2)),
  };
}

/** Encode a float WAV to Ogg Vorbis (q6, ~190 kbps: transparent enough for an audition). */
export async function toOgg(wav, ogg, { start, duration, fadeSec = 0.4, quality = '6', gainDb = 0 } = {}) {
  const args = ['-y', '-loglevel', 'error'];
  if (start !== undefined) args.push('-ss', String(start));
  if (duration !== undefined) args.push('-t', String(duration));
  args.push('-i', wav);
  const filters = [];
  if (gainDb) filters.push(`volume=${gainDb}dB`);
  if (duration !== undefined) filters.push(`afade=t=in:d=${fadeSec}`, `afade=t=out:st=${duration - fadeSec}:d=${fadeSec}`);
  if (filters.length) args.push('-af', filters.join(','));
  args.push('-codec:a', 'libvorbis', '-q:a', quality, ogg);
  await run(FFMPEG, args, { windowsHide: true });
}
