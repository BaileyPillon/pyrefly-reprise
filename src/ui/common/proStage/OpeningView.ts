import type { OpeningCue } from '../../../engine/pro/staging/StagingPort.ts';
import type { ProStageOptions } from './ProStageLayer.ts';

/** The Overdrive opening and the Change plate (filled in by the opening step). */
export class OpeningView {
  constructor(readonly host: HTMLElement, readonly o: ProStageOptions) {}
  cue(_cue: OpeningCue): void {}
  update(_now: number): void {}
  clear(): void {}
  dispose(): void {}
}
