// In-page functions (Playwright serialises each one: no outer references).

/** Every visible painted figure: id, art file, and the four corners of its whole plane in drawing-buffer pixels (y down). */
export function figuresInPage() {
  const out = { ok: false, figures: [] };
  try {
    const api = window.__pyrefly;
    const scr = api && api.app && api.app.current;
    const stage = scr && scr.stage;
    if (!stage || !stage.opts) { out.error = 'no stage'; return out; }
    const cam = stage.opts.camera;
    const canvas = stage.opts.canvas;
    const W = canvas.width; const H = canvas.height;
    cam.updateMatrixWorld(true);
    const V = cam.matrixWorldInverse.elements; const P = cam.projectionMatrix.elements;
    out.canvas = { w: W, h: H, cssW: canvas.clientWidth, cssH: canvas.clientHeight, dpr: window.devicePixelRatio };
    out.screen = api.screen();
    const proj = (x, y, z) => {
      const vx = V[0] * x + V[4] * y + V[8] * z + V[12];
      const vy = V[1] * x + V[5] * y + V[9] * z + V[13];
      const vz = V[2] * x + V[6] * y + V[10] * z + V[14];
      const cx = P[0] * vx + P[4] * vy + P[8] * vz + P[12];
      const cy = P[1] * vx + P[5] * vy + P[9] * vz + P[13];
      const cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15];
      return { x: (cx / cw * 0.5 + 0.5) * W, y: (-(cy / cw) * 0.5 + 0.5) * H, d: -vz };
    };
    const toWorld = (M, lx, ly, lz) => [
      M[0] * lx + M[4] * ly + M[8] * lz + M[12],
      M[1] * lx + M[5] * ly + M[9] * lz + M[13],
      M[2] * lx + M[6] * ly + M[10] * lz + M[14],
    ];
    const c3 = (v) => (v && v.r !== undefined ? [+v.r.toFixed(3), +v.g.toFixed(3), +v.b.toFixed(3)] : null);
    for (const [id, s] of stage.actors) {
      const actor = s.actor;
      const poseTex = new Map();
      for (const [name, pt] of actor.poses) poseTex.set(pt.texture, { name, url: pt.url });
      actor.slots.forEach((sl, i) => {
        const mesh = sl.mesh;
        const u = sl.material.uniforms;
        const op = u.opacity ? u.opacity.value : 1;
        if (!mesh.visible || !(op > 0.02)) return;
        const tex = u.map.value; const img = tex && tex.image;
        const iw = img && (img.naturalWidth || img.width); const ih = img && (img.naturalHeight || img.height);
        if (!iw || !ih) return;
        mesh.updateWorldMatrix(true, false);
        const M = mesh.matrixWorld.elements;
        const meta = sl.meta;
        const L = (px, py) => [px / meta.width - 0.5, 0.5 - py / meta.height];
        const corners = [L(0, 0), L(meta.width, 0), L(meta.width, meta.height), L(0, meta.height)].map((l) => proj(...toWorld(M, l[0], l[1], 0)));
        const info = poseTex.get(tex) || {};
        figures_push: {
          out.figures.push({
            id, side: s.side, artId: s.artId, slot: i, active: actor.active === i, opacity: +op.toFixed(3),
            pose: sl.pose, poseName: info.name || null, url: info.url || (img && img.src) || null,
            imgW: iw, imgH: ih, metaW: meta.width, metaH: meta.height,
            quad: corners.map((p) => [p.x, p.y]), dist: corners[0].d,
            uni: {
              brightness: u.brightness ? u.brightness.value : null, tint: c3(u.tint && u.tint.value), rimStrength: u.rimStrength ? u.rimStrength.value : null,
              rimColor: c3(u.rimColor && u.rimColor.value), rimWidth: u.rimWidth ? u.rimWidth.value : null, bounceStrength: u.bounceStrength ? u.bounceStrength.value : null,
              groundShade: u.groundShade ? u.groundShade.value : null, desaturate: u.desaturate ? u.desaturate.value : null, flashAmount: u.flashAmount ? u.flashAmount.value : null,
              alphaCut: u.alphaCut ? u.alphaCut.value : null, erode: u.erode ? u.erode.value : null, edgeFade: u.edgeFade ? u.edgeFade.value : null,
              mixDefringe: u.mixDefringe ? u.mixDefringe.value : null, blending: sl.material.blending, premultipliedAlpha: sl.material.premultipliedAlpha,
            },
            texInfo: { colorSpace: tex.colorSpace, flipY: tex.flipY, premultiplyAlpha: tex.premultiplyAlpha, minFilter: tex.minFilter, generateMipmaps: tex.generateMipmaps, anisotropy: tex.anisotropy },
          });
        }
      });
    }
    out.ok = true;
  } catch (e) { out.error = String(e && e.stack ? e.stack : e).slice(0, 400); }
  return out;
}

/** Draw-state of the renderer and the post chain: the numbers that colour a figure after its own shader. */
export function chainInPage() {
  const out = {};
  try {
    const r = window.__pyrefly.app.renderer;
    const g = r.gradePass.uniforms;
    const v3 = (v) => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)];
    out.grade = {
      lift: v3(g.lift.value), gamma: v3(g.gamma.value), gain: v3(g.gain.value), saturation: g.saturation.value, vignette: g.vignette.value,
      vignetteRadius: g.vignetteRadius.value, grain: g.grain.value, shadowTint: v3(g.shadowTint.value), shadowTintAmount: g.shadowTintAmount.value,
      lookAmount: g.lookAmount.value, vignetteTint: v3(g.vignetteTint.value), dither: g.dither.value,
    };
    out.bloom = { strength: r.bloomPass.strength, radius: r.bloomPass.radius, threshold: r.bloomPass.threshold };
    out.tilt = { focus: r.tiltH.uniforms.focus.value, band: r.tiltH.uniforms.bandWidth.value, maxBlur: r.tiltH.uniforms.maxBlur.value };
    out.passes = r.composer.passes.map((p) => `${p.constructor.name}${p.enabled ? '' : '(off)'}`);
    out.palette = r.palette ? { name: r.palette.name, figureBloomMask: r.palette.figureBloomMask } : null;
    out.toneMapping = r.renderer.toneMapping; out.outputColorSpace = r.renderer.outputColorSpace;
    out.size = [r.renderer.domElement.width, r.renderer.domElement.height]; out.pixelRatio = r.renderer.getPixelRatio();
    try { out.crisp = window.__pyrefly.crisp ? window.__pyrefly.crisp.report() : null; } catch (e) { out.crisp = String(e); }
    try { out.fx = window.__pyrefly.fx ? window.__pyrefly.fx.snapshot() : null; } catch (e) { out.fx = String(e); }
  } catch (e) { out.error = String(e).slice(0, 300); }
  return out;
}

/** The canvas as a PNG data URL (the drawing buffer is preserved). */
export function canvasPngInPage() {
  const c = document.querySelector('canvas[data-role="game-canvas"]') || document.querySelector('canvas');
  return c.toDataURL('image/png');
}

/** Show or hide the painted figure planes (the frame without them is the backdrop the figures stand on). */
export function setFiguresVisible(on) {
  const stage = window.__pyrefly.app.current.stage;
  window.__figHidden = window.__figHidden || [];
  if (!on) {
    window.__figHidden.length = 0;
    for (const [, s] of stage.actors) for (const sl of s.actor.slots) { if (sl.mesh.visible) { window.__figHidden.push(sl.mesh); sl.mesh.visible = false; } }
  } else {
    for (const m of window.__figHidden) m.visible = true;
    window.__figHidden.length = 0;
  }
  return window.__figHidden.length;
}
