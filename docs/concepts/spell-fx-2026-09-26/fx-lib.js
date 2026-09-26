// B1 spell-effects mock: shared helpers. Canvas 2D in a 1600x900 design space,
// drawn over a real-engine plate. Everything is a pure function of time, so a
// frame can be rendered at any t and the clips are deterministic.
(function () {
  const FX = (window.FX = {});
  FX.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  FX.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  FX.lerp = (a, b, u) => a + (b - a) * u;
  FX.outCubic = (u) => 1 - Math.pow(1 - FX.clamp(u), 3);
  FX.inCubic = (u) => Math.pow(FX.clamp(u), 3);
  /** 0 before a, ramps in over fi, holds, ramps out over fo before b. */
  FX.env = (t, a, b, fi = 0.1, fo = 0.2) => (t < a || t > b ? 0 : Math.min(FX.clamp((t - a) / fi), FX.clamp((b - t) / fo)));
  /** A spike at t0 that decays over d. */
  FX.pulse = (t, t0, d) => (t < t0 ? 0 : Math.exp(-((t - t0) / d) * 3) * (t - t0 < d * 2 ? 1 : 0));
  FX.hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  FX.rgba = (h, a) => { const [r, g, b] = FX.hex(h); return `rgba(${r},${g},${b},${FX.clamp(a)})`; };

  const cache = new Map();
  function sprite(key, size, paint) {
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    paint(c.getContext('2d'), size);
    cache.set(key, c);
    return c;
  }
  /** Soft radial glow, bright core. */
  FX.glow = (col) => sprite('g' + col, 128, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, FX.rgba(col, 1)); gr.addColorStop(0.25, FX.rgba(col, 0.55)); gr.addColorStop(1, FX.rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  /** Hard mote with a white centre (FFX's round embers and motes). */
  FX.mote = (col) => sprite('m' + col, 64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, FX.rgba(col, 1)); gr.addColorStop(0.45, FX.rgba(col, 0.35)); gr.addColorStop(1, FX.rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  /** Four-point sparkle (FFX-2's cursor shape, used as its particle). */
  FX.spark4 = (col) => sprite('s' + col, 96, (g, s) => {
    const c = s / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c * 0.5);
    gr.addColorStop(0, FX.rgba(col, 0.9)); gr.addColorStop(1, FX.rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? c * 0.96 : c * 0.12;
      g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-atop';
    const g2 = g.createRadialGradient(c, c, 0, c, c, c);
    g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.35, col); g2.addColorStop(1, FX.rgba(col, 0.2));
    g.fillStyle = g2; g.fillRect(0, 0, s, s);
  });
  /** The particle sprite for this game: round motes (FFX) or four-point sparkles (FFX-2). */
  FX.bit = (S, col) => (S.game === 'ffx2' ? FX.spark4(col) : FX.mote(col));
  FX.draw = (ctx, img, x, y, size, alpha, rot = 0) => {
    if (alpha <= 0.003 || size <= 0.5) return;
    ctx.globalAlpha = FX.clamp(alpha);
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(img, -size / 2, -size / 2, size, size); ctx.restore(); }
    else ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = 1;
  };
  /** Ground decal: a flattened radial glow. */
  FX.decal = (ctx, x, y, rx, col, a, flat = 0.28) => {
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, flat);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, FX.rgba(col, a)); gr.addColorStop(0.6, FX.rgba(col, a * 0.35)); gr.addColorStop(1, FX.rgba(col, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  /** Ground ring (ellipse stroke with a soft halo). */
  FX.ring = (ctx, x, y, rx, w, col, a, flat = 0.28) => {
    if (a <= 0.003 || rx <= 1) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, flat);
    ctx.strokeStyle = FX.rgba(col, a * 0.35); ctx.lineWidth = w * 3; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = FX.rgba(col, a); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };
  /**
   * Stateless particles: n particles born between t0 and t1, each with five
   * random numbers; fn(p, age) draws one. Deterministic per seed.
   */
  FX.parts = (n, seed, t0, t1, t, fn) => {
    const r = FX.rng(seed);
    for (let i = 0; i < n; i++) {
      const p = { i, born: t0 + r() * (t1 - t0), a: r(), b: r(), c: r(), d: r(), e: r() };
      const age = t - p.born;
      if (age >= 0) fn(p, age);
    }
  };
  /**
   * The cast mark under the target, one per game [ours, from each game's chrome]:
   * FFX a gold ring with eight points (visual-bible §1.1's Yevon-glyph ring idea),
   * FFX-2 a pink ring with four-point sparkles at its quarters.
   */
  FX.castMark = (S, T, t, t0 = 0, t1 = 0.9) => {
    const { ctx } = S;
    const a = FX.env(t, t0, t1, 0.12, 0.3);
    if (!a) return;
    const u = FX.outCubic((t - t0) / 0.35);
    const rx = 120 * T.sc;
    const col = S.game === 'ffx2' ? '#F7B6D9' : '#E3B94A';
    ctx.save(); ctx.translate(T.fx, T.fy); ctx.scale(1, 0.28);
    ctx.strokeStyle = FX.rgba(col, a * 0.9); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, rx, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); ctx.stroke();
    ctx.strokeStyle = FX.rgba(col, a * 0.3); ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(0, 0, rx, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); ctx.stroke();
    ctx.restore();
    const pts = S.game === 'ffx2' ? 4 : 8;
    for (let i = 0; i < pts; i++) {
      const ang = -Math.PI / 2 + (i / pts) * Math.PI * 2;
      if (ang > -Math.PI / 2 + Math.PI * 2 * u) continue;
      const x = T.fx + Math.cos(ang) * rx, y = T.fy + Math.sin(ang) * rx * 0.28;
      FX.draw(ctx, FX.bit(S, col), x, y, (S.game === 'ffx2' ? 34 : 16) * T.sc, a);
    }
  };
})();
