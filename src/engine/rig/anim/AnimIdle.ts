/**
 * The living layer of a stance: a breath and a slow weight shift laid over whatever pose the figure holds (`?anim=proto`; both games, presentation only; erasable TS, no `three`).
 *
 * Two loops that do not line up: the BREATH (about a third of a hertz: the chest and shoulders lift, the head and the arms follow a beat later) and the WEIGHT SHIFT (a tenth of a hertz: the
 * hips slide a few pixels from one foot to the other, the shoulders and the head lean the other way to keep the balance, the skirt and the doll swing in time). Because the two are
 * incommensurate the figure never repeats exactly within a minute. Authored amplitudes per bone (`IdleSpec`, degrees and painting px at `amp` 1), a style's hertz and gain; every term is a
 * sine, so the same time gives the same pose to the last bit. It adds to the pose, so a figure with `amount` 0 is exactly the key.
 */
import { CH, C_OX, C_OY, C_ROT, C_SX, C_SY } from './AnimClip.ts';

/** One bone's sine: rotation in degrees, offsets in painting px, scale added (sy 0.01 = one percent taller at the top of the breath), and a phase in radians (a later bone lags). */
export interface IdleTerm {
  rot?: number;
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
  phase?: number;
}

export interface IdleSpec {
  breath: Readonly<Record<string, IdleTerm>>;
  shift: Readonly<Record<string, IdleTerm>>;
}

export interface IdleTuning {
  breathHz: number;
  shiftHz: number;
  /** Scale on the breath terms. */
  amp: number;
  /** Scale on the shift terms. */
  shift: number;
}

const DEG = Math.PI / 180;

/** Add the breath and the shift to `pose` at `tSec` seconds, `amount` (0..1) of them. Bones the rig does not have are skipped. */
export function applyIdleLayer(pose: Float64Array, boneIndex: ReadonlyMap<string, number>, spec: IdleSpec, tune: IdleTuning, tSec: number, amount: number): void {
  if (!(amount > 0)) return;
  const wb = 2 * Math.PI * tune.breathHz * tSec;
  const ws = 2 * Math.PI * tune.shiftHz * tSec + 1.3;
  const lay = (terms: Readonly<Record<string, IdleTerm>>, w: number, gain: number): void => {
    const k = gain * amount;
    for (const [bone, t] of Object.entries(terms)) {
      const i = boneIndex.get(bone);
      if (i === undefined) continue;
      const s = Math.sin(w + (t.phase ?? 0)) * k;
      const o = i * CH;
      pose[o + C_ROT] = pose[o + C_ROT]! + (t.rot ?? 0) * DEG * s;
      pose[o + C_OX] = pose[o + C_OX]! + (t.dx ?? 0) * s;
      pose[o + C_OY] = pose[o + C_OY]! + (t.dy ?? 0) * s;
      pose[o + C_SX] = pose[o + C_SX]! + (t.sx ?? 0) * s;
      pose[o + C_SY] = pose[o + C_SY]! + (t.sy ?? 0) * s;
    }
  };
  lay(spec.breath, wb, tune.amp);
  lay(spec.shift, ws, tune.shift);
}
