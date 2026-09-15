/**
 * Music render worker.
 *
 * The AudioManager posts `{ id, name, sampleRate }` and gets back the finished
 * Float32 channels plus loop points, transferred (not copied). Keeping this off
 * the main thread means a 90 second track can be synthesised while the title
 * screen is already fading in.
 *
 * Typed against a minimal worker-scope shape rather than `DedicatedWorkerGlobalScope`
 * so the module still type-checks under the project's DOM-only lib set.
 */

import { renderTrack } from './render.ts';
import { getTrack } from './tracks/index.ts';

export interface RenderRequest {
  id: number;
  name: string;
  sampleRate: number;
}

export interface RenderResponse {
  id: number;
  ok: boolean;
  error?: string;
  name?: string;
  left?: Float32Array;
  right?: Float32Array;
  sampleRate?: number;
  loopStartSample?: number;
  loopEndSample?: number;
  renderMs?: number;
}

interface WorkerScope {
  onmessage: ((event: { data: RenderRequest }) => void) | null;
  postMessage(message: RenderResponse, transfer?: ArrayBufferLike[]): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.onmessage = (event) => {
  const request = event.data;
  try {
    const rendered = renderTrack(getTrack(request.name), request.sampleRate);
    scope.postMessage(
      {
        id: request.id,
        ok: true,
        name: rendered.name,
        left: rendered.left,
        right: rendered.right,
        sampleRate: rendered.sampleRate,
        loopStartSample: rendered.loopStartSample,
        loopEndSample: rendered.loopEndSample,
        renderMs: rendered.renderMs,
      },
      [rendered.left.buffer, rendered.right.buffer],
    );
  } catch (error) {
    scope.postMessage({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
