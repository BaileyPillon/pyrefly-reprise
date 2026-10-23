/**
 * THE AUDIO PASS, KEEPING THE MOTION SOUNDS OUT OF A BLOW'S WAY (conference demo sound pass, 2026-10-22; decision 184 (f): "the motion sounds kept at the measured levels unless they mask hits").
 *
 * Measured on the two traced fights (`measure/`, the mixer's own log): the strike's smear zip (`whiff` at 1.45, volume 0.28, a 2 to 5 kHz noise burst, peak -17.2 dBFS at the master) is asked 0 to 25 ms
 * after the blow's own cue on every blow: Chapter I 28 of its 29 hits, Chapter IV all 46 of 46. The recorded FFX-2 hits peak only -11.7 (gun), -12.7 (greatsword) and -15.1 dBFS (dagger), so the zip
 * sits 2.1 to 5.5 dB under them in the same band as the crack the pass lays on a hit (a texture layer sits 6.5 dB under its base, so the zip would be louder than the layer it covers).
 * A zip that lands on a blow is therefore turned down {@link MASK_DB} dB, and every other motion sound (the 105 smears that are not on a blow in Chapter I, the lunges, the landings, the cloth)
 * keeps the level the motion lane measured.
 *
 * The planner knows a blow is due before the cue is asked (the swing leads the contact by the strike beat; a spell's landing wait is known when it starts) and after (the cue was just asked), so the
 * window is {@link BEFORE_MS} before to {@link AFTER_MS} after the blow. Pure; times are the page's clock.
 */

/** dB the guard takes off a motion sound that lands on a blow. */
export const MASK_DB = -12;
/** The window around a blow, ms: a motion sound this much before or after it is "on" it. */
export const BEFORE_MS = 80;
export const AFTER_MS = 150;

const due: number[] = [];

/** A blow is (or was just) at `atMs` on the page's clock. */
export function noteBlowAt(atMs: number): void {
  due.push(atMs);
  if (due.length > 24) due.shift();
}

/** Is a motion sound at `atMs` on a blow? */
export function blowNear(atMs: number): boolean {
  for (const d of due) if (atMs >= d - BEFORE_MS && atMs <= d + AFTER_MS) return true;
  return false;
}

let gatherUntil = 0;
/** How long after an Overdrive's opening its gather lasts, ms: the landing that ends the gather is asked for about 1.5 s in (traced), 0.34 s before the stinger. */
export const GATHER_MS = 2600;

/**
 * An Overdrive's gather began at `atMs` (PC-18, decision 184). The figure's landing at the end of the gather is a thud at volume 0.26, about -37 dB at the master as a momentary level against the
 * stinger at -21.4: the quietest thing in the sequence, 0.34 s before the stinger and 0.75 s before the opening pulse, and nothing the sources ask for. The pass leaves it out under a gather and keeps
 * every other landing (the hop of a revive, a dodge, the FFX-2 run home).
 */
export function noteGather(atMs: number): void {
  gatherUntil = atMs + GATHER_MS;
}

/** Is a landing at `atMs` inside an Overdrive's gather? */
export function inGather(atMs: number): boolean {
  return atMs <= gatherUntil;
}

/** Tests: forget the blows and the gather. */
export function resetBlows(): void {
  due.length = 0;
  gatherUntil = 0;
}
