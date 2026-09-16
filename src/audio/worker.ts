/**
 * Music + SFX render worker.
 *
 * The AudioManager posts music requests `{ id, name, sampleRate }` and gets
 * back the finished Float32 channels plus loop points, transferred (not
 * copied). It also posts a single batched SFX warm-up request
 * `{ id, kind: 'sfx', names, sampleRate }` and gets back one response per cue,
 * so warming the whole bank costs one round trip instead of one per cue.
 * Keeping this off the main thread means a 90 second track — or the full SFX
 * bank — can be synthesised while the title screen is already fading in.
 *
 * The actual message handling lives in `handleRequest`, a pure function with
 * no `self`/`postMessage` inside it, so it can be unit-tested from Node; this
 * file only wires it to the worker's global scope.
 *
 * Typed against a minimal worker-scope shape rather than `DedicatedWorkerGlobalScope`
 * so the module still type-checks under the project's DOM-only lib set.
 */

import { renderTrack } from './render.ts';
import { getTrack } from './tracks/index.ts';
import { renderSfx } from './sfx/index.ts';

export interface RenderRequest {
  id: number;
  /** Absent (or 'music') for a track render — kept optional for backward compatibility. */
  kind?: 'music';
  name: string;
  sampleRate: number;
}

export interface RenderResponse {
  id: number;
  kind?: 'music';
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

/** Warm up many SFX cues with one message instead of one request per cue. */
export interface SfxRequest {
  id: number;
  kind: 'sfx';
  names: string[];
  sampleRate: number;
}

/** One cue's result. Posted as its own message so the caller can start caching
 *  buffers as they finish instead of waiting for the whole batch. */
export interface SfxResponse {
  id: number;
  kind: 'sfx';
  ok: boolean;
  name: string;
  error?: string;
  left?: Float32Array;
  right?: Float32Array;
}

export type WorkerRequest = RenderRequest | SfxRequest;
export type WorkerResponse = RenderResponse | SfxResponse;

/** A response message paired with the buffers it should transfer (empty on error). */
export interface WorkerReply {
  response: WorkerResponse;
  transfer: ArrayBufferLike[];
}

function renderMusic(request: RenderRequest): WorkerReply {
  try {
    const rendered = renderTrack(getTrack(request.name), request.sampleRate);
    return {
      response: {
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
      transfer: [rendered.left.buffer, rendered.right.buffer],
    };
  } catch (error) {
    return {
      response: { id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) },
      transfer: [],
    };
  }
}

function renderSfxCue(id: number, name: string, sampleRate: number): WorkerReply {
  try {
    const rendered = renderSfx(name, sampleRate);
    return {
      response: { id, kind: 'sfx', ok: true, name, left: rendered.left, right: rendered.right },
      transfer: [rendered.left.buffer, rendered.right.buffer],
    };
  } catch (error) {
    return {
      response: { id, kind: 'sfx', ok: false, name, error: error instanceof Error ? error.message : String(error) },
      transfer: [],
    };
  }
}

/**
 * Pure request handler: no `self`, no `postMessage`, so it can run in a test
 * runner exactly as it runs in the worker. A music request yields one reply;
 * an SFX batch yields one reply per cue, in request order, and a bad name
 * anywhere in the batch produces an `ok: false` reply for that cue only —
 * the rest of the bank still renders.
 */
export function handleRequest(request: WorkerRequest): WorkerReply[] {
  if (request.kind === 'sfx') {
    return request.names.map((name) => renderSfxCue(request.id, name, request.sampleRate));
  }
  return [renderMusic(request)];
}

interface WorkerScope {
  onmessage: ((event: { data: WorkerRequest }) => void) | null;
  postMessage(message: WorkerResponse, transfer?: ArrayBufferLike[]): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.onmessage = (event) => {
  for (const reply of handleRequest(event.data)) {
    scope.postMessage(reply.response, reply.transfer);
  }
};
