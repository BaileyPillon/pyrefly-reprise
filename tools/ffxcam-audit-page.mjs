/**
 * The page-side half of the FFX camera tracking audit (`tools/ffxcam-audit.mjs`): a function the harness stringifies and runs inside the dev-server page of the hidden Fayth chapter. It is
 * self-contained (no closure over Node scope) and records, every rendered frame, what the camera showed and where every figure stood, so the report is computed afterwards in Node
 * (`tools/ffxcam-audit-report.mjs`) and can be recomputed with other thresholds, or replayed through the safety net, without playing the fight again.
 *
 * It reads only what the dev page already holds: the `__ffxcam` debug handle (FFX's programs: the director, the pose latch) or the `__ffxtable` one (the website's table camera), the battle's actors (the scene's children, named by combatant id, each carrying its model
 * under `inner`) and the lens. It imports the one in-frame definition from the game's own source (`src/engine/ffxcam/framing.ts`, served by the dev server) so the audit and the safety net can never
 * disagree about what "in frame" means. No retail data is here: the harness runs against Bailey's local models and camera folder and writes its records to `D:\Tools\ffx-parity\shots\tracking\`.
 *
 * **Two readings per figure.** The canvas reading (`framing.ts`, at the camera's own aspect) is what the safety net judges by. The **window reading** is what the player sees: the same lattice through the
 * three.js camera's own matrices, kept to the part of the canvas that lies inside the viewport (an upright phone shows a slice of a 16:9 canvas and slides it, `src/ui/common/phoneFraming.ts`), written as
 * extra columns at the end of every row (`tools/ffxcam-audit-lib.mjs`, `layout`). They are the same on any window the render fills.
 *
 * Game case: FFX only.
 */

/**
 * @param {{ strategy: string, boxEvery: number, ids: string[], keepFrames: boolean, sample?: boolean }} cfg `sample: false` only starts the fight and counts frames (a replay that takes pictures needs no record)
 * @returns {Promise<void>} resolves once the recorder is installed; `window.__audit` then fills in by itself
 */
export async function installAudit(cfg) {
  const framing = await import('/src/engine/ffxcam/framing.ts');
  const world = await import('/src/engine/ffx3d/ffxWorld.ts');
  const K = world.FFX_UNIT;
  /**
   * The stub scene's camera as a handle the sampler can read (`cfg.stub`: the scene the chapter had before the table camera, `?skin=classic`: Chapter VIII's camera, which the presenter's own shot grammar moves). There is
   * no director and no latch: the pose is read off the three.js camera each frame, in FFX's frame (the eye, a look-at 100 units ahead, the roll of its up vector against the horizon, its field of view), and the
   * beats are the stub shot director's, wrapped by the sampler like any other.
   */
  function stubHandle(loaded, V, K) {
    const cam = loaded.battleCamera.camera;
    const frame = { n: 0 };
    const toFfx = (v) => [v.x / K, -v.y / K, -v.z / K];
    const f = new V();
    const q = new V();
    return {
      camera: { shotDirector: loaded.slots.shotDirector, net: null, director: { get steps() { return frame.n; }, programId: undefined, vm: null } }, // the "steps" are the sampled frames
      net: null,
      target: () => cam,
      latch: {
        get shown() {
          frame.n++; // read once per sampled frame
          cam.updateMatrixWorld();
          cam.getWorldDirection(f);
          const pos = cam.getWorldPosition(q.clone());
          const up = new V(0, 1, 0).applyQuaternion(cam.quaternion);
          const flat = new V(0, 1, 0).addScaledVector(f, -f.y).normalize();
          const roll = Math.atan2(flat.clone().cross(up).dot(f), flat.dot(up));
          return { eye: toFfx(pos), ref: toFfx(pos.clone().addScaledVector(f, 100 * K)), roll, fovDeg: cam.fov };
        },
      },
    };
  }
  const loaded = window.__pyrefly.battle().scene;
  const scene = loaded.scene;
  const V = scene.position.constructor;
  const stub = cfg.stub === true;
  const h = stub ? stubHandle(loaded, V, K) : (globalThis.__ffxcam ?? globalThis.__ffxtable); // FFX's programs (`__ffxcam`), the website's table camera (`__ffxtable`), or the stub scene's own camera (`cfg.stub`)
  const dir = h.camera.director;
  const vm = dir.vm ?? null; // null for the table camera and the stub
  const latch = h.latch;
  if (!vm && !stub) {
    const [{ EVRAE_SHOTS }, { TableDirector }] = await Promise.all([import('/src/data/ffx/camera/evrae-shots.ts'), import('/src/engine/ffxcam/tableDirector.ts')]);
    cfg.wholeFight = [...TableDirector.wholeFightShots(EVRAE_SHOTS)]; // the shots that are views of the whole fight (the report's default rule)
  }

  const A = (window.__audit = {
    cfg,
    frames: [],
    beats: [],
    starts: [],
    programs: [],
    interventions: [],
    xcheck: { samples: 0, maxDiff: 0, sum: 0, bad: [] },
    net: h.camera.net ?? null, // the safety net (kept here: the page's handle is gone by the time the record is read)
    started: false,
    finished: false,
    frameNo: 0,
    aspect: 0,
    boxMs: 0,
    boxCount: 0,
    outcome: null,
  });
  const progIndex = new Map();
  const intern = (id) => {
    let i = progIndex.get(id);
    if (i === undefined) {
      i = A.programs.length;
      A.programs.push(id);
      progIndex.set(id, i);
    }
    return i;
  };

  // ---- beats: wrap the camera's shot director so each beat is logged with its actor and targets
  const sd = h.camera.shotDirector;
  const stepNow = () => dir.steps;
  for (const beat of ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory']) {
    const orig = sd[beat];
    sd[beat] = (ctx) => {
      const targets = ctx?.targets ? ctx.targets.map((t) => t.id) : ctx?.target ? [ctx.target.id] : [];
      A.beats.push({ i: A.beats.length, t: Math.round(performance.now()), step: stepNow(), beat, actor: ctx?.actor?.id ?? ctx?.enemy?.id ?? null, side: ctx?.actor?.side ?? null, targets, ability: ctx?.action?.abilityId ?? null, kind: ctx?.action?.commandKind ?? null, shape: ctx?.action?.kind ?? null });
      return orig.call(sd, ctx);
    };
  }

  // ---- program starts, with the request that caused each (a camReq tail call has none); the table camera's are its shot starts, with the beat that asked
  if (vm) {
    let lastReq = null;
    const origRequest = vm.request.bind(vm);
    vm.request = (req) => {
      lastReq = { tags: [...req.tags], command: req.command ?? null };
      try {
        return origRequest(req);
      } finally {
        lastReq = null;
      }
    };
    const origStart = vm.start.bind(vm);
    vm.start = (program) => {
      A.starts.push({ t: Math.round(performance.now()), step: stepNow(), program: program.id, req: lastReq, beat: A.beats.length - 1 });
      return origStart(program);
    };
  } else if (!stub) {
    const origStart = dir.start.bind(dir);
    dir.start = (id, why) => {
      A.starts.push({ t: Math.round(performance.now()), step: stepNow(), program: id, req: { why }, beat: A.beats.length - 1 });
      return origStart(id, why);
    };
  }

  // ---- the figures' boxes (the animated model, every vertex), cached between samples
  const cache = new Map();
  const find = (id) => scene.children.find((c) => c.name === id && c.pose !== undefined);
  /** A figure with no model (a painted billboard: Auron, Kimahri and Lulu in the `ffx` skin): a thin box from its feet over the plane's width and height. */
  const planeBox = (actor) => {
    if (!actor.visible || !(actor.alpha > 0.05)) return null;
    const w = (actor.poseSize?.[0] ?? 1) * actor.scale.x;
    const h = Math.max(actor.height * actor.scale.y, (actor.poseSize?.[1] ?? 0) * actor.scale.y);
    const p = actor.getWorldPosition(new V());
    return { min: [p.x - w / 2, p.y, p.z - 0.3], max: [p.x + w / 2, p.y + h, p.z + 0.3] };
  };
  const worldBox = (actor) => {
    const root = actor.inner?.children.find((c) => c.name && c.name.startsWith('ffx-'));
    if (!root) return planeBox(actor);
    root.updateWorldMatrix(true, true);
    const v = new V();
    const mn = [Infinity, Infinity, Infinity];
    const mx = [-Infinity, -Infinity, -Infinity];
    let n = 0;
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      let visible = true;
      for (let p = o; p; p = p.parent) if (p.visible === false) visible = false;
      if (!visible) return;
      const pos = o.geometry.attributes.position;
      const stride = Math.max(1, Math.floor(pos.count / 2500));
      for (let i = 0; i < pos.count; i += stride) {
        o.getVertexPosition(i, v);
        v.applyMatrix4(o.matrixWorld);
        n++;
        if (v.x < mn[0]) mn[0] = v.x;
        if (v.x > mx[0]) mx[0] = v.x;
        if (v.y < mn[1]) mn[1] = v.y;
        if (v.y > mx[1]) mx[1] = v.y;
        if (v.z < mn[2]) mn[2] = v.z;
        if (v.z > mx[2]) mx[2] = v.z;
      }
    });
    return n > 0 ? { min: mn, max: mx } : null;
  };
  // world (y up, z flipped, scaled) to FFX (y down): x / K, -y / K, -z / K, min and max swapped on the flipped axes
  const toFfx = (b) => ({ min: [b.min[0] / K, -b.max[1] / K, -b.max[2] / K], max: [b.max[0] / K, -b.min[1] / K, -b.min[2] / K] });
  const boxOf = (id, force) => {
    const hit = cache.get(id);
    if (hit && !force) return hit;
    const actor = find(id);
    if (!actor) return null;
    const t0 = performance.now();
    const wb = worldBox(actor);
    A.boxMs += performance.now() - t0;
    A.boxCount++;
    if (!wb) return null;
    const entry = { world: wb, ffx: toFfx(wb), alive: actor.visible && actor.alpha > 0.05, pose: actor.pose, life: actor.lifeState };
    cache.set(id, entry);
    return entry;
  };

  // ---- an independent in-frustum reading through the three.js camera's own matrices (a cross-check of framing.ts on sampled frames)
  const fractionThroughCamera = (cam, b, n) => {
    const e = cam.matrixWorldInverse.elements;
    const p = cam.projectionMatrix.elements;
    let inside = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          const x = b.min[0] + ((b.max[0] - b.min[0]) * (i + 0.5)) / n;
          const y = b.min[1] + ((b.max[1] - b.min[1]) * (j + 0.5)) / n;
          const z = b.min[2] + ((b.max[2] - b.min[2]) * (k + 0.5)) / n;
          const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
          const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
          const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
          const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
          const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
          const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
          if (cw > 1e-6 && Math.abs(cx) <= cw && Math.abs(cy) <= cw) inside++;
        }
    return inside / (n * n * n);
  };

  // ---- the WINDOW reading: what the player sees of the render, through the three.js camera's own matrices. On a desktop or tablet window the render fills the window and this equals the reading above; on an upright
  // phone the canvas is the 16:9 render at the field's height and the window shows a slice of it (`phone-battle.css`, `phoneFraming.ts`, which slides it at each command menu), so only this reading says whether
  // a figure is on the phone's screen. The window is read off the page each frame: the part of `#game`'s box that lies inside the viewport, as normalised device coordinates of the canvas.
  const gameEl = document.getElementById('game');
  const windowNdc = () => {
    const r = gameEl?.getBoundingClientRect();
    if (!r || !(r.width > 0) || !(r.height > 0)) return { x0: -1, x1: 1, y0: -1, y1: 1 };
    const fx0 = Math.max(0, -r.left) / r.width;
    const fx1 = Math.min(r.width, window.innerWidth - r.left) / r.width;
    const fy0 = Math.max(0, -r.top) / r.height;
    const fy1 = Math.min(r.height, window.innerHeight - r.top) / r.height;
    return { x0: 2 * fx0 - 1, x1: 2 * fx1 - 1, y0: 1 - 2 * fy1, y1: 1 - 2 * fy0 };
  };
  const fractionThroughWindow = (cam, b, n, win) => {
    const e = cam.matrixWorldInverse.elements;
    const p = cam.projectionMatrix.elements;
    let inside = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          const x = b.min[0] + ((b.max[0] - b.min[0]) * (i + 0.5)) / n;
          const y = b.min[1] + ((b.max[1] - b.min[1]) * (j + 0.5)) / n;
          const z = b.min[2] + ((b.max[2] - b.min[2]) * (k + 0.5)) / n;
          const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
          const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
          const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
          const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
          const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
          const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
          if (!(cw > 1e-6)) continue;
          const nx = cx / cw;
          const ny = cy / cw;
          if (nx >= win.x0 && nx <= win.x1 && ny >= win.y0 && ny <= win.y1) inside++;
        }
    return inside / (n * n * n);
  };

  // ---- the per-frame sampler (after the game's own frame callback, so the camera is as the frame drew it)
  const ids = cfg.ids;
  const sample = () => {
    const shown = latch.shown;
    const cam = h.target();
    if (!shown || !cam) return;
    A.aspect = cam.aspect;
    cam.updateMatrixWorld();
    const win = windowNdc();
    // The shape of what the window shows: the camera's own aspect on a window the render fills, a phone's slice of it otherwise. The in-frame definition (framing.ts) is asked for the window's shape, as the game asks it.
    const winAspect = cam.aspect * ((win.x1 - win.x0) / (win.y1 - win.y0));
    A.windowAspect = winAspect;
    const half = { x0: -(win.x1 - win.x0) / 2, x1: (win.x1 - win.x0) / 2, y0: -(win.y1 - win.y0) / 2, y1: (win.y1 - win.y0) / 2 }; // the window centred on the camera's axis: where the net's definition says the picture is
    const force = A.frameNo % cfg.boxEvery === 0;
    const fr = [];
    const winFr = [];
    const boxes = [];
    for (const id of ids) {
      const b = boxOf(id, force);
      if (!b) {
        fr.push(-1, -1);
        winFr.push(-1);
        boxes.push(0, 0, 0, 0, 0, 0);
        continue;
      }
      fr.push(+framing.visibleFraction(shown, b.ffx, winAspect).toFixed(3), +framing.apparentHeight(shown, b.ffx, winAspect).toFixed(3));
      winFr.push(+fractionThroughWindow(cam, b.world, framing.LATTICE, win).toFixed(3));
      boxes.push(...b.ffx.min.map((n) => +n.toFixed(2)), ...b.ffx.max.map((n) => +n.toFixed(2)));
    }
    if (A.frameNo % 25 === 0) {
      for (let q = 0; q < ids.length; q++) {
        const b = cache.get(ids[q]);
        if (!b) continue;
        const ours = framing.visibleFraction(shown, b.ffx, winAspect);
        const theirs = fractionThroughWindow(cam, b.world, framing.LATTICE, half);
        const d = Math.abs(ours - theirs);
        A.xcheck.samples++;
        A.xcheck.sum += d;
        if (d > A.xcheck.maxDiff) A.xcheck.maxDiff = d;
        if (d > 0.05 && A.xcheck.bad.length < 40) A.xcheck.bad.push({ frame: A.frameNo, id: ids[q], ours: +ours.toFixed(3), camera: +theirs.toFixed(3), steps: dir.steps, eye: shown.eye.map((n) => +n.toFixed(2)), camPos: cam.position.toArray().map((n) => +n.toFixed(3)), view: !!cam.view?.enabled, boxAge: A.frameNo % cfg.boxEvery });
      }
    }
    const netState = { idle: 0, in: 1, hold: 2, out: 3 }[A.net?.state ?? 'idle'] ?? 0;
    const range = window.__pyrefly.battleState()?.flags?.['airship.range'] === 'far' ? 1 : 0;
    const row = [A.frameNo, Math.round(performance.now()), dir.steps, intern(dir.programId ?? '-'), A.beats.length - 1, ...fr, ...shown.eye.map((n) => +n.toFixed(2)), ...shown.ref.map((n) => +n.toFixed(2)), +shown.roll.toFixed(4), +shown.fovDeg.toFixed(3), ...boxes, netState, range, ...winFr, +win.x0.toFixed(4), +win.x1.toFixed(4), +win.y0.toFixed(4), +win.y1.toFixed(4)];
    if (cfg.keepFrames) A.frames.push(row);
  };

  // ---- start the fight on the engine's own strategy at the first menu, then sample every frame until the scene is gone
  const loop = () => {
    A.frameNo++;
    try {
      const battle = window.__pyrefly.battle();
      if (!A.started && A.frameNo % 12 === 0 && battle?.presenter?.snapshot()?.awaitingMenu === true) {
        window.__pyrefly.autoBattle(cfg.strategy);
        A.started = true;
      }
      if (A.beats.length > 0 && cfg.sample !== false) sample();
      const state = window.__pyrefly.battleState();
      if (state?.outcome && A.outcome === null) A.outcome = state.outcome;
      const live = stub ? h : (globalThis.__ffxcam ?? globalThis.__ffxtable);
      if (stub ? !window.__pyrefly.battle()?.scene : !live || live.camera !== h.camera) {
        A.finished = true;
        return;
      }
    } catch (e) {
      A.error = String(e && e.stack ? e.stack : e);
      A.finished = true;
      return;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
