/**
 * Force full garbage collections from a test, when the runner lets it (`global.gc` under `--expose-gc`, else the V8 flag set at run time), and say whether `done()` held after them.
 * Returns `'no-gc'` when no collection can be forced (a test then falls back to its deterministic proof), else `true` or `false`.
 */
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

type Collect = () => void;

function collector(): Collect | null {
  const direct = (globalThis as { gc?: Collect }).gc;
  if (typeof direct === 'function') return direct;
  try {
    setFlagsFromString('--expose-gc');
    const viaVm = runInNewContext('gc') as unknown;
    return typeof viaVm === 'function' ? (viaVm as Collect) : null;
  } catch {
    return null;
  }
}

export async function forceGc(done: () => boolean, rounds = 8): Promise<boolean | 'no-gc'> {
  const gc = collector();
  if (!gc) return 'no-gc';
  for (let i = 0; i < rounds; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 5)); // let jsdom's own microtasks and finalizers settle
    gc();
    if (done()) return true;
  }
  return done();
}
