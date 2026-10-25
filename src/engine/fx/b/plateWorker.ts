/**
 * The depth plates' cut, in a Web Worker (a Vite worker entry: `PlateCut.ts` starts it with `new Worker(new URL('./plateWorker.ts', import.meta.url), { type: 'module' })`). r63-play, the overnight fix of
 * the skeptic's M1 (both games; see `plateCutWork.ts`). It holds no state and sees no DOM: one request in, one reply out, the arrays that carry the result transferred, not copied.
 */
import { cutAndFlip, type CutReply, type CutRequest } from './plateCutWork.ts';

interface WorkerScope {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<{ id: number; req: CutRequest }>) => void) | null;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (e): void => {
  const { id, req } = e.data;
  try {
    const reply: CutReply = cutAndFlip(req);
    scope.postMessage({ id, ok: true, reply }, reply.flipped.map((f) => f.buffer));
  } catch (err) {
    scope.postMessage({ id, ok: false, error: String(err) });
  }
};
