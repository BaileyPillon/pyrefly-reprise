/**
 * SFZ patches built from VCSL WAVs, for the instruments VSCO 2 CE lacks.
 *
 * VCSL (CC0, D:/Tools/audio-libs/vcsl) ships WAVs named by articulation,
 * dynamic and take — `HiHat_HitC_v3_rr2_Mid.wav` — but no SFZ files. This
 * module reads those names and writes the SFZ a sampler needs: one velocity
 * layer per recorded dynamic (`_vN`), one round robin per take (`_rrN`), so
 * the counts in the handoff are the recorded ones and nothing is invented.
 *
 * VSCO 2 CE already covers kick (BDrumNewhit, 7 layers x 2 takes), snare,
 * crash and timpani in GM-StylePerc.sfz / Timpani.sfz. What it lacks for the
 * battle kits is a hi-hat and a pair of toms; those come from here.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { LIB_ROOT } from '../libs.mjs';
import { parseSfzText } from './sfz.mjs';

export const VCSL_ROOT = join(LIB_ROOT, 'vcsl').replace(/\\/g, '/');

/**
 * Group `files` matching `re` (which captures v and rr) into velocity layers
 * and round robins, and emit regions for [lokey..hikey] around `center`.
 */
function zoneRegions(dir, re, { lokey, hikey, center, keytrack = 0, volume = 0 }) {
  const files = readdirSync(dir).filter((f) => re.test(f));
  const takes = files.map((f) => {
    const m = f.match(re);
    return { f, v: Number(m.groups?.v ?? 1), rr: Number(m.groups?.rr ?? 1) };
  });
  const dyn = [...new Set(takes.map((t) => t.v))].sort((a, b) => a - b);
  const out = [];
  dyn.forEach((v, i) => {
    const lovel = i === 0 ? 1 : Math.round((127 * i) / dyn.length) + 1;
    const hivel = Math.round((127 * (i + 1)) / dyn.length);
    const rrs = takes.filter((t) => t.v === v).sort((a, b) => a.rr - b.rr);
    rrs.forEach((t, k) => {
      out.push(
        [
          '<region>',
          `sample=${join(dir, t.f).replace(/\\/g, '/')}`,
          `lokey=${lokey}`,
          `hikey=${hikey}`,
          `pitch_keycenter=${center}`,
          `pitch_keytrack=${keytrack}`,
          `lovel=${lovel}`,
          `hivel=${hivel}`,
          `seq_length=${rrs.length}`,
          `seq_position=${k + 1}`,
          `volume=${volume}`,
          'ampeg_release=0.4',
          'ampeg_dynamic=1',
        ].join('\n'),
      );
    });
  });
  return out;
}

/** Hi-hat: closed hits (4 dynamics x 2 takes) on key 42, open (2 takes) on 46. */
export function vcslHiHat() {
  const dir = `${VCSL_ROOT}/Idiophones/Struck Idiophones/Hi-Hat Cymbal`;
  const text = [
    '<global>',
    ...zoneRegions(dir, /^HiHat_HitC_v(?<v>\d)_rr(?<rr>\d)_Mid\.wav$/, { lokey: 42, hikey: 42, center: 42 }),
    ...zoneRegions(dir, /^HiHat_HitO_rr(?<rr>\d)_Mid\.wav$/, { lokey: 46, hikey: 46, center: 46 }),
  ].join('\n');
  return { path: `${dir}/(generated hi-hat)`, ...parseSfzText(text, dir, 'vcsl hi-hat') };
}

/**
 * Toms: the low tom (3 dynamics x 2 takes) below A2 and the high tom above,
 * each following the score's pitch at 60 cents a semitone so a written fill
 * still falls or climbs, as the old `tom` preset's pitchFollow did.
 */
export function vcslToms() {
  const base = `${VCSL_ROOT}/Membranophones/Struck Membranophones`;
  const lo = `${base}/Tom 2/Stick`;
  const hi = `${base}/Tom 1/Stick`;
  const text = [
    '<global>',
    ...zoneRegions(lo, /^TomL_HitS_v(?<v>\d)_rr(?<rr>\d)_Mid\.wav$/, { lokey: 0, hikey: 44, center: 41, keytrack: 60 }),
    ...zoneRegions(hi, /^TomH_HitS_v(?<v>\d)_rr(?<rr>\d)_Mid\.wav$/, { lokey: 45, hikey: 127, center: 48, keytrack: 60 }),
  ].join('\n');
  return { path: `${base}/(generated toms)`, ...parseSfzText(text, base, 'vcsl toms') };
}
