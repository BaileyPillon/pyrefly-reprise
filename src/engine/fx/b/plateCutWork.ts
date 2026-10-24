import { cutPlates, type PlateCut } from './plateMaths.ts';

/**
 * The arithmetic of the depth plates' cut as one pure function of typed arrays, so the same code runs on the page (when there is no Worker) and in `plateWorker.ts` (r63-play, the overnight fix of the skeptic's
 * M1; both games: Chapter I's Gagazet is FFX, Chapter IV's Bevelle underground is FFX-2). Measured in headless GPU Chromium at 2560 x 1440: the cut is one 0.22 to 0.30 s task of the main thread behind the picker
 * (`plateMaths.cutPlates`: the feather blurs and the push-pull fill), and a player who presses A inside it never has the press seen by the page's gamepad poll. In a worker the page does not wait for it at all.
 *
 * The result is the cut's own: plates flipped bottom-up for the GL upload (a data texture is never flipped by the driver) and how much of the frame each owns. Nothing about the arithmetic changed.
 */

export interface CutRequest {
  paint: Uint8ClampedArray;
  depth: Float32Array;
  w: number;
  h: number;
  cut: PlateCut;
  solid: number;
  topRows?: Float32Array | undefined;
}

export interface CutReply {
  flipped: Uint8Array[];
  coverage: number[];
}

/** Cut the painting into plates and flip each one's rows for the upload. */
export function cutAndFlip(req: CutRequest): CutReply {
  const { w, h } = req;
  const plates = cutPlates(req.paint, req.depth, w, h, req.cut, req.solid, req.topRows);
  const flipped = plates.map((plate) => {
    const out = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) out.set(plate.rgba.subarray(y * w * 4, (y + 1) * w * 4), (h - 1 - y) * w * 4);
    return out;
  });
  return { flipped, coverage: plates.map((plate) => plate.coverage) };
}
