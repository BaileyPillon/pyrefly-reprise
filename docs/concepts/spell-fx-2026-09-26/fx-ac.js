// B1 option A (painted flipbooks on a billboard) and option C (option B's
// particles at 60 % plus an element glyph). A's paintings are original ComfyUI
// pilot renders on black (additive blend drops the black); its 6 to 8 frames
// are DERIVED from one painting here (scale, reveal, jitter, dissolve), where a
// built sheet would have 6 to 8 painted frames. C's glyphs are drawn stand-ins.
(function () {
  const { env, pulse, draw, decal, glow, rgba, clamp, outCubic, rng, castMark } = FX;
  const A = (FX.A = {}), C = (FX.C = {});
  const SC = [0.5, 0.72, 0.9, 1, 1.05, 1.09, 1.13, 1.18];
  const REV = [0.35, 0.6, 0.85, 1, 1, 1, 1, 1];
  const AL = [0.75, 0.95, 1, 1, 0.95, 0.8, 0.55, 0.28];

  /** Radially masked copy of a painting, cached. */
  const masked = new Map();
  function soft(img) {
    if (masked.has(img)) return masked.get(img);
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 512, 512);
    // Subtract the painting's own background level (some came back navy, not
    // black), so the additive blend adds only the strokes.
    const d = g.getImageData(0, 0, 512, 512), px = d.data, bg = [0, 0, 0];
    for (const [cx, cy] of [[4, 4], [500, 4], [4, 500], [500, 500]]) for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const o = ((cy + j) * 512 + cx + i) * 4; bg[0] += px[o] / 256; bg[1] += px[o + 1] / 256; bg[2] += px[o + 2] / 256; }
    for (let o = 0; o < px.length; o += 4) for (let ch = 0; ch < 3; ch++) px[o + ch] = Math.max(0, ((px[o + ch] - bg[ch]) * 255) / (255 - bg[ch]));
    g.putImageData(d, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    const gr = g.createRadialGradient(256, 256, 120, 256, 256, 256);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    masked.set(img, c); return c;
  }

  /** One flipbook: o = { t0, fps, frames, anchor: feet|centre|sky, size, rot, x, y }. */
  function book(S, t, T, key, o) {
    const img = S.paint[key]; if (!img) return;
    const fps = o.fps ?? 12, frames = o.frames ?? 8, f = Math.floor((t - o.t0) * fps);
    if (f < 0 || f >= frames) return;
    const k = Math.min(7, Math.round((f / (frames - 1)) * 7));
    const r = rng(1000 + f * 7 + key.length), s = o.size * SC[k];
    const { ctx } = S, im = soft(img);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (k >= 6) ctx.filter = 'blur(2px)';
    let x, y, w = s, h = s;
    const ax = o.x ?? T.fx, ay = o.y;
    if (o.anchor === 'sky') { h = (ay ?? T.fy) + 60 - -40; w = h * 0.78 * SC[k]; x = ax - w / 2; y = -40; }
    else if (o.anchor === 'centre') { x = (o.x ?? T.cx) - s / 2; y = (ay ?? T.cy) - s / 2; }
    else { x = ax - s / 2; y = (ay ?? T.fy) - s * 0.9; }
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate((o.rot ?? 0) + (r() - 0.5) * 0.07); ctx.translate(-w / 2, -h / 2);
    // Reveal: rising effects grow from the bottom, the sky ones from the top.
    const rev = REV[k];
    ctx.beginPath();
    if (o.anchor === 'sky') ctx.rect(0, 0, w, h * rev); else if (o.anchor === 'centre') ctx.rect(0, 0, w * rev, h); else ctx.rect(0, h * (1 - rev), w, h * rev);
    ctx.clip();
    ctx.globalAlpha = AL[k] * (o.alpha ?? 1);
    ctx.drawImage(im, 0, 0, w, h);
    // FFX-2 stand-in skin: pink four-point sparkle stamps stepping with the frames.
    if (S.game === 'ffx2') {
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = AL[k]; ctx.drawImage(FX.spark4('#F7B6D9'), r() * w * 0.8, r() * h * 0.8, 44 + r() * 40, 44 + r() * 40); }
    }
    ctx.restore();
  }
  /** Today's bloom, which A keeps under the painting. */
  const bloom = (S, T, t, t0, col, a = 0.5) => { S.ctx.globalCompositeOperation = 'lighter'; draw(S.ctx, glow(col), T.cx, T.cy, 300 * T.sc, S.actorCap(a) * env(t, t0, t0 + 0.6, 0.05, 0.4)); S.ctx.globalCompositeOperation = 'source-over'; };

  A.fire = (S, t, T) => { castMark(S, T, t, 0, 0.7); decal(S.ctx, T.fx, T.fy, 160 * T.sc, '#F2712E', 0.5 * env(t, 0.3, 1.6, 0.1, 0.4)); bloom(S, T, t, 0.4, '#FF9A3C'); book(S, t, T, 'fire', { t0: 0.3, fps: 10, size: T.h * 1.45 }); S.flash(0, '#FFB070', 0.2 * pulse(t, 0.5, 0.18)); };
  A.ice = (S, t, T) => { castMark(S, T, t, 0, 0.7); decal(S.ctx, T.fx, T.fy, 170 * T.sc, '#6EC8F0', 0.5 * env(t, 0.3, 1.6, 0.1, 0.4)); bloom(S, T, t, 0.4, '#9EE4FF'); book(S, t, T, 'ice', { t0: 0.3, fps: 9, size: T.h * 1.25 }); S.flash(0, '#E6F8FF', 0.2 * pulse(t, 0.4, 0.15)); };
  A.thunder = (S, t, T) => {
    castMark(S, T, t, 0, 0.6); decal(S.ctx, T.fx, T.fy, 200 * T.sc, '#F2D24A', 0.6 * env(t, 0.42, 1.5, 0.02, 0.6)); bloom(S, T, t, 0.42, '#FFF2A0', 0.6);
    book(S, t, T, 'thunder', { t0: 0.4, fps: 14, anchor: 'sky', x: T.cx });
    S.flash(0, '#FFFFFF', 0.55 * pulse(t, 0.42, 0.12));
  };
  A.water = (S, t, T) => { castMark(S, T, t, 0, 0.7); decal(S.ctx, T.fx, T.fy, 170 * T.sc, '#3A8FD0', 0.5 * env(t, 0.3, 1.6, 0.1, 0.4)); bloom(S, T, t, 0.5, '#8FD8FF'); book(S, t, T, 'water', { t0: 0.35, fps: 10, size: T.h * 1.3 }); S.flash(0, '#CFEFFF', 0.18 * pulse(t, 0.6, 0.15)); };
  A.holy = (S, t, T) => {
    castMark(S, T, t, 0, 1.2);
    if (S.game === 'ffx2') {
      for (let k = 0; k < 8; k++) {
        const tk = 0.55 + k * 0.11, ang = (k / 8) * Math.PI * 2;
        book(S, t, T, 'holy', { t0: tk, fps: 24, frames: 4, anchor: 'centre', size: T.h * 0.7, x: T.cx + Math.cos(ang) * 60 * T.sc, y: T.cy + Math.sin(ang) * 50 * T.sc });
        S.flash(k, '#FFF6FF', 0.28 * pulse(t, tk, 0.07));
      }
    } else {
      book(S, t, T, 'holy', { t0: 0.45, fps: 9, anchor: 'sky', x: T.cx });
      S.flash(0, '#FFFFFF', 0.55 * pulse(t, 0.85, 0.25));
    }
    bloom(S, T, t, 0.8, '#FFF2C0', 0.7);
  };
  A.cure = (S, t, T) => { castMark(S, T, t, 0, 1.2); decal(S.ctx, T.fx, T.fy, 150 * T.sc, '#7EE8B0', 0.5 * env(t, 0.3, 1.4, 0.1, 0.4)); bloom(S, T, t, 0.5, '#C8FFE0', 0.35); book(S, t, T, 'cure', { t0: 0.3, fps: 8, size: T.h * 1.3 }); };
  A.hit = (S, t, T) => {
    bloom(S, T, t, 0.3, '#FFFFFF', 0.6);
    book(S, t, T, 'slash', { t0: 0.22, fps: 22, frames: 6, anchor: 'centre', size: T.h * 1.2, rot: -0.35 });
    S.shake = Math.max(S.shake, 10 * pulse(t, 0.31, 0.15)); S.flash(0, '#FFFFFF', 0.1 * pulse(t, 0.31, 0.1));
  };
  A.spiral = (S, t, T) => {
    book(S, t, T, 'spiral', { t0: 0.15, fps: 7, frames: 8, size: T.h * 1.9 });
    book(S, t, T, 'slash', { t0: 1.3, fps: 16, frames: 7, anchor: 'centre', size: T.h * 1.6, rot: 1.2 });
    bloom(S, T, t, 1.42, '#FFFFFF', 0.9);
    S.shake = Math.max(S.shake, 16 * pulse(t, 1.43, 0.25)); S.flash(0, '#FFFFFF', 0.5 * pulse(t, 1.43, 0.25));
  };
  A.megaflare = (S, t, T) => {
    const P = S.T.party, chest = { x: T.cx - 20 * T.sc, y: T.cy - T.h * 0.12 };
    if (t > 0.1 && t < 1.35) { const f = Math.floor(t * 10) % 4; book(S, 0.3 + (f + 0.5) / 12, T, 'megaflare', { t0: 0.3, fps: 12, frames: 8, anchor: 'centre', size: (90 + 200 * outCubic(t / 1.3)) * T.sc, x: chest.x, y: chest.y }); }
    book(S, t, T, 'megaflare', { t0: 1.4, fps: 8, frames: 8, anchor: 'centre', size: 900 * T.sc, x: P.x, y: P.y - 120 * T.sc });
    S.shake = Math.max(S.shake, 22 * pulse(t, 1.45, 0.4)); S.flash(0, '#FFFFFF', 0.8 * pulse(t, 1.43, 0.35));
  };

  // ---------------------------------------------------------------- option C
  const KANJI = { fire: '炎', ice: '氷', thunder: '雷', water: '水', holy: '聖', cure: '癒' };
  const WORD = { fire: 'FIRA', ice: 'BLIZZARA', thunder: 'THUNDARA', water: 'WATERA', holy: 'HOLY', cure: 'CURA' };
  const CHIP = { fire: '#F2712E', ice: '#6EC8F0', thunder: '#F2D24A', water: '#3A8FD0', holy: '#FFF2C0', cure: '#7EE8B0' };
  const IMPACT = { fire: 0.52, ice: 0.5, thunder: 0.44, water: 0.8, holy: 0.88, cure: 0.5 };
  C.glyph = (S, t, T, el) => {
    if (!KANJI[el]) return;
    const t0 = el === 'holy' && S.game === 'ffx2' ? 0.55 : IMPACT[el];
    const a = env(t, t0, t0 + 0.8, S.reduce ? 0.15 : 0.02, 0.28);
    if (!a) return;
    const pop = S.reduce ? 1 : 1 + 0.3 * (1 - outCubic((t - t0) / 0.14));
    const { ctx } = S;
    const gx = T.cx < 800 ? T.cx - T.w * 0.5 - 90 : Math.min(1480, T.cx + T.w * 0.5 + 70), gy = Math.max(150, T.cy - T.h * 0.28);
    ctx.save(); ctx.translate(gx, gy); ctx.scale(pop, pop);
    ctx.globalCompositeOperation = 'lighter';
    draw(ctx, glow(S.game === 'ffx2' ? '#F7B6D9' : '#E3B94A'), 0, 0, 260, S.actorCap(0.55) * a);
    ctx.globalCompositeOperation = 'source-over';
    if (S.game === 'ffx2') {
      ctx.rotate(Math.PI / 4);
      const gr = ctx.createLinearGradient(-52, -52, 52, 52);
      gr.addColorStop(0, rgba('#F7B6D9', 0.95 * a)); gr.addColorStop(1, rgba('#B048F0', 0.9 * a));
      ctx.fillStyle = gr; ctx.fillRect(-52, -52, 104, 104);
      ctx.strokeStyle = rgba('#0B0A12', a); ctx.lineWidth = 5; ctx.strokeRect(-52, -52, 104, 104);
      ctx.strokeStyle = rgba('#FFFFFF', 0.8 * a); ctx.lineWidth = 2; ctx.strokeRect(-42, -42, 84, 84);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = rgba(CHIP[el], a); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(30, 0); ctx.lineTo(0, 30); ctx.lineTo(-30, 0); ctx.fill();
      ctx.strokeStyle = rgba('#0B0A12', a); ctx.lineWidth = 3; ctx.stroke();
      draw(ctx, FX.spark4('#FFFFFF'), 56, -56, 60, a);
      ctx.font = 'italic 700 30px "Chakra Petch"'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = rgba('#0B0A12', a); ctx.fillStyle = rgba('#F7B6D9', a);
      ctx.strokeText(WORD[el], 0, 118); ctx.fillText(WORD[el], 0, 118);
    } else {
      // Ensō: a brush circle, thick to thin, ink under gold.
      for (const [dx, col, al] of [[4, '#0B0A12', 0.6], [0, '#E3B94A', 1]]) {
        for (let i = 0; i <= 90; i++) {
          const u = i / 90, an = -1.9 + u * 5.6, w = 13 * (1 - u) + 2.5;
          ctx.fillStyle = rgba(col, al * a); ctx.beginPath(); ctx.arc(Math.cos(an) * 82 + dx, Math.sin(an) * 82 + dx, w / 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.font = '700 100px "Yu Mincho", "MS Mincho", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 8; ctx.strokeStyle = rgba('#0B0A12', 0.85 * a); ctx.strokeText(KANJI[el], 0, 4);
      ctx.fillStyle = rgba('#F3D27A', a); ctx.fillText(KANJI[el], 0, 4);
    }
    ctx.restore();
  };
})();
