/**
 * `window.__pyrefly.perf`: the frame-cost profiler (lane "perf-trim", the conference demo, 2026-10-23; captures and QA only, nothing the game reads).
 *
 * Nothing runs until `perf.start()`: this file only installs the API object, and `start()` wraps methods of the live objects (the composer's passes, the battle screen's systems) with timers,
 * so the production paths carry no probe and `perf.stop()` puts every original back. Both games (shared plumbing).
 *
 * - GPU: `EXT_disjoint_timer_query_webgl2` (a `TIME_ELAPSED` query around each composer pass; one query at a time, so a pass called inside another is counted in the outer one). The answer
 *   arrives a few frames later; `perf.data()` waits for it.
 * - CPU: `performance.now()` around the systems named in {@link SYSTEMS} and around the whole frame (`App.step`).
 * - Frame interval: the time between two frames' starts, the number the player feels when the page is not capped.
 * - `perf.mark(label)` opens a new segment: every frame belongs to the segment open when it started, so a run can flip a switch and compare the segments of one browser session.
 */
import type { App } from '../app/App.ts';

type Fn = (...a: unknown[]) => unknown;
interface Rec {
  seg: number;
  t: number;
  interval: number;
  step: number;
  cpu: Record<string, number>;
  gpu: Record<string, number>;
  /** What the harness's tagger said at the frame's start (for example "menu" or "act"). */
  tag: string;
  /** Draw calls and triangles the frame issued (all its renders added up: the shadow pass, the scene, every pass's quad). */
  calls: number;
  tris: number;
}
interface Pending {
  q: WebGLQuery;
  name: string;
  rec: Rec;
}

/** [label, path from the debug API's `battle()` / the renderer, method]. A system that does not exist in the running fight is skipped. */
const SYSTEMS: ReadonlyArray<readonly [string, string, string]> = [
  ['screen.update', 'battle', 'update'],
  ['scene.update', 'battle.scene', 'update'],
  ['camera.update', 'battle.scene.battleCamera', 'update'],
  ['stage.update', 'battle.stage', 'update'],
  ['spellFx.update', 'battle.stage.spellFx', 'update'],
  ['spectacle.update', 'battle.spectacle', 'update'],
  ['staging.update', 'battle.proStage', 'update'],
  ['hud.update', 'battle.hud', 'update'],
  ['cutscenes.update', 'battle.cutscenes', 'update'],
  ['look.update', 'renderer.look', 'update'],
  ['look.bold.update', 'renderer.look.bold', 'update'],
  ['look.drift.update', 'renderer.look.drift', 'update'],
  ['look.stage.update', 'renderer.look.stage', 'update'],
  ['crisp.before', 'renderer.crisp', 'beforeRender'],
  ['composer.render', 'renderer.composer', 'render'],
  ['renderer.render', 'renderer', 'render'],
];

const get = (root: unknown, path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o === null || o === undefined ? undefined : (o as Record<string, unknown>)[k]), root);

export function installPerfDebug(api: Record<string, unknown>, app: App): void {
  let on = false;
  let seg = 0;
  const labels: string[] = ['start'];
  const frames: Rec[] = [];
  const restore: Array<() => void> = [];
  const pending: Pending[] = [];
  const pool: WebGLQuery[] = [];
  let gl: WebGL2RenderingContext | null = null;
  let ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null;
  let cur: Rec | null = null;
  let active = false;
  let lastStart = 0;
  let disjoint = 0;
  let passNames = new Map<unknown, string>();
  let tagger: (() => string) | null = null;
  let autoReset = true;
  let burnN = 0;
  let gpuOn = true;
  let burnWrapped = false;

  const ctx = (): { renderer: unknown; battle: unknown } => ({ renderer: app.renderer, battle: (api['battle'] as () => unknown)() });
  const resolve = (path: string): unknown => {
    const c = ctx();
    const [head, ...rest] = path.split('.');
    const root = head === 'battle' ? c.battle : head === 'renderer' ? c.renderer : undefined;
    return rest.length ? get(root, rest.join('.')) : root;
  };

  function nameOf(pass: unknown, i: number): string {
    const r = app.renderer as unknown as Record<string, unknown>;
    const look = r['look'] as Record<string, unknown> | null;
    if (pass === r['gradePass']) return 'grade';
    if (pass === r['tiltH']) return 'tiltH';
    if (pass === r['tiltV']) return 'tiltV';
    if (pass === r['bloomPass']) return 'bloom';
    if (pass === r['renderPass']) return 'scene';
    if (pass === r['msaaPass']) return 'scene.msaa';
    const crisp = r['crisp'] as Record<string, unknown>;
    if (pass === crisp['ssaa']) return 'scene.ssaa';
    if (pass === crisp['cas']) return 'cas';
    if (look) {
      if (pass === look['blurH']) return 'look.blurH';
      if (pass === look['blurV']) return 'look.blurV';
      const bold = look['bold'] as { pass: unknown } | null;
      if (bold && pass === bold.pass) return 'look.bold';
      for (const v of (look['main'] as Map<string, unknown>).values()) if (pass === v) return 'look.main';
    }
    return `${i}:${(pass as { constructor: { name: string } }).constructor.name}`;
  }

  function begin(name: string, rec: Rec): boolean {
    if (!gl || !ext || !gpuOn || active) return false;
    const q = pool.pop() ?? gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    active = true;
    pending.push({ q, name, rec });
    return true;
  }
  function end(): void {
    if (!gl || !ext || !active) return;
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    active = false;
  }
  function poll(): void {
    if (!gl || !ext || (!gpuOn && pending.length === 0)) return;
    while (pending.length) {
      const p = pending[0]!;
      if (p.q === (pending[pending.length - 1]!.q) && active) break; // the open query is last in the list
      if (!gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE)) break;
      if (gl.getParameter(ext.GPU_DISJOINT_EXT)) disjoint++;
      const ns = gl.getQueryParameter(p.q, gl.QUERY_RESULT) as number;
      p.rec.gpu[p.name] = (p.rec.gpu[p.name] ?? 0) + ns / 1e6;
      pool.push(p.q);
      pending.shift();
    }
  }

  /** Install `w` over `obj[key]` and remember how to undo it: a method that came from the prototype is undone by dropping our own copy, one that was the object's own is put back. */
  function putBack(obj: Record<string, unknown>, key: string, w: unknown, orig: unknown): void {
    const own = Object.prototype.hasOwnProperty.call(obj, key);
    obj[key] = w;
    restore.push(() => {
      if (obj[key] !== w) return;
      if (own) obj[key] = orig;
      else delete obj[key];
    });
  }

  function wrap(obj: Record<string, unknown>, key: string, label: string): void {
    const orig = obj[key];
    if (typeof orig !== 'function' || (orig as { __perf?: boolean }).__perf) return;
    const w = function (this: unknown, ...a: unknown[]): unknown {
      const t = performance.now();
      try {
        return (orig as Fn).apply(this, a);
      } finally {
        if (cur) cur.cpu[label] = (cur.cpu[label] ?? 0) + (performance.now() - t);
      }
    };
    (w as unknown as { __perf: boolean }).__perf = true;
    putBack(obj, key, w, orig);
  }

  /** Wrap every composer pass not yet wrapped (a pass built later, by the look or the mix, is picked up at the next frame). */
  function wrapPasses(): void {
    const passes = (app.renderer.composer as unknown as { passes: Array<Record<string, unknown>> }).passes;
    passes.forEach((p, i) => {
      if ((p['render'] as { __perfPass?: boolean }).__perfPass) return;
      const orig = p['render'] as Fn;
      const label = nameOf(p, i);
      passNames.set(p, label);
      const w = function (this: unknown, ...a: unknown[]): unknown {
        const rec = cur;
        const opened = rec ? begin(label, rec) : false;
        const t = performance.now();
        try {
          return orig.apply(this, a);
        } finally {
          if (rec) rec.cpu['pass.' + label] = (rec.cpu['pass.' + label] ?? 0) + (performance.now() - t);
          if (opened) end();
        }
      };
      (w as unknown as { __perfPass: boolean }).__perfPass = true;
      putBack(p, 'render', w, orig);
    });
  }

  function wrapSystems(): void {
    for (const [label, path, key] of SYSTEMS) {
      const o = resolve(path);
      if (o && typeof o === 'object') wrap(o as Record<string, unknown>, key, label);
    }
  }

  function wrapStep(): void {
    const a = app as unknown as Record<string, unknown>;
    const orig = a['step'] as Fn;
    const w = function (this: unknown, ...args: unknown[]): unknown {
      poll();
      const t = performance.now();
      const rec: Rec = { seg, t, interval: lastStart ? t - lastStart : 0, step: 0, cpu: {}, gpu: {}, tag: tagger ? tagger() : '', calls: 0, tris: 0 };
      lastStart = t;
      cur = rec;
      wrapPasses();
      wrapSystems();
      try {
        return orig.apply(this, args);
      } finally {
        rec.step = performance.now() - t;
        const info = (app.renderer.renderer as unknown as { info: { render: { calls: number; triangles: number }; reset(): void } }).info;
        rec.calls = info.render.calls;
        rec.tris = info.render.triangles;
        info.reset();
        frames.push(rec);
        cur = null;
      }
    };
    putBack(a, 'step', w, orig);
  }

  api['perf'] = {
    /** True when the GPU can time passes here. */
    supported: (): boolean => {
      const g = (app.renderer.renderer.getContext() as WebGL2RenderingContext);
      return Boolean(g.getExtension('EXT_disjoint_timer_query_webgl2'));
    },
    start: (): { gpu: boolean } => {
      if (on) return { gpu: Boolean(ext) };
      on = true;
      gl = app.renderer.renderer.getContext() as WebGL2RenderingContext;
      ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as typeof ext;
      frames.length = 0;
      seg = 0;
      labels.length = 1;
      lastStart = 0;
      passNames = new Map();
      autoReset = (app.renderer.renderer as unknown as { info: { autoReset: boolean } }).info.autoReset;
      (app.renderer.renderer as unknown as { info: { autoReset: boolean } }).info.autoReset = false; // the frame's own counts: reset once per step, not once per render call
      wrapStep();
      return { gpu: Boolean(ext) };
    },
    stop: (): void => {
      if (!on) return;
      on = false;
      burnN = 0;
      burnWrapped = false;
      (app.renderer.renderer as unknown as { info: { autoReset: boolean } }).info.autoReset = autoReset;
      for (const r of restore.splice(0)) r();
    },
    /** Open a new segment: the frames from now on belong to it. Returns its index. */
    mark: (label: string): number => {
      labels.push(label);
      return ++seg;
    },
    /** The frames recorded so far, each with its segment, interval, step time and the per-system / per-pass milliseconds (GPU values are filled when the query answers: call again if `pendingGpu` is above 0). */
    data: (from = 0): { labels: string[]; frames: Rec[]; pendingGpu: number; disjoint: number; passes: string[] } => {
      poll();
      return { labels: [...labels], frames: frames.slice(from), pendingGpu: pending.length, disjoint, passes: [...passNames.values()] };
    },
    /** A function called once per frame (outside the timed step) that names what the frame is doing; null stops it. */
    setTagger: (fn: (() => string) | null): void => {
      tagger = fn;
    },
    /** Extra load for the governor's proof: `n` more supersampled scene passes drawn into the composer's read buffer before each frame's chain (same pixels, more GPU work); 0 stops it. Works only while perf is on. */
    burn: (n: number): void => {
      burnN = Math.max(0, Math.floor(n));
      if (burnN > 0 && !burnWrapped && on) {
        burnWrapped = true;
        const composer = app.renderer.composer as unknown as Record<string, unknown> & { readBuffer: unknown };
        const orig = composer['render'] as Fn;
        const w = function (this: unknown, ...a: unknown[]): unknown {
          const ss = app.renderer.crisp.ssaa;
          if (burnN > 0 && ss.enabled) for (let i = 0; i < burnN; i++) (ss as unknown as { render(r: unknown, w: unknown, rb: unknown): void }).render(app.renderer.renderer, composer.readBuffer, composer.readBuffer);
          return orig.apply(this, a);
        };
        putBack(composer, 'render', w, orig);
      }
    },
    /** Timer queries on or off (a harness switch: the queries themselves must not be what is measured). */
    gpu: (on: boolean): void => {
      gpuOn = on;
    },
    count: (): number => frames.length,
    clear: (): void => {
      frames.length = 0;
    },
  };
}
