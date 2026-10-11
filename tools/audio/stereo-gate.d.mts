/** Types for `tools/audio/stereo-gate.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import the measurer. */

export interface StereoGateThresholds {
  corr: [number, number];
  sideMid: [number, number];
  monoLossMin: number;
}

export interface StereoMeasure {
  corr: number;
  sideMid: number;
  monoLoss: number;
}

export interface StereoVerdict {
  ok: { corr: boolean; sideMid: boolean; monoLoss: boolean };
  pass: boolean;
}

export const FFMPEG: string;
export const SAMPLE_RATE: number;
export const STEREO_GATE: StereoGateThresholds;

export function decodeStereo(file: string, ffmpeg?: string): { left: Float32Array; right: Float32Array };
export function measureStereo(left: Float32Array, right: Float32Array): StereoMeasure;
export function judgeStereo(m: StereoMeasure, gate?: StereoGateThresholds): StereoVerdict;
export function measureFile(file: string, ffmpeg?: string): StereoMeasure & StereoVerdict & { samples: number };
