// B1 option B: shader-style particles per element (drawn here with Canvas 2D;
// the build would be GPU point sprites + a few quads). Option C reuses these at
// S.dens = 0.6 and adds a glyph. Each fn(S, t, T) draws one effect at local t.
(function () {
  const { env, pulse, parts, draw, decal, ring, glow, bit, rgba, clamp, outCubic, rng, castMark } = FX;
  const B = (FX.B = {});
  const n = (S, k) => Math.max(1, Math.round(k * S.dens));

  B.fire = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 0.7);
    decal(ctx, T.fx, T.fy, 170 * sc, '#F2712E', 0.6 * env(t, 0.25, 1.75, 0.15, 0.5));
    ring(ctx, T.fx, T.fy, (60 + 260 * outCubic((t - 0.5) / 0.6)) * sc, 3, '#FFC070', 0.8 * env(t, 0.5, 1.1, 0.02, 0.5));
    ctx.globalCompositeOperation = 'lighter';
    parts(n(S, 190), 11, 0.28, 1.2, t, (p, age) => {
      const life = 0.45 + 0.45 * p.a, u = age / life;
      if (u > 1) return;
      const x = T.fx + (p.b - 0.5) * 90 * sc * (1 - u * 0.6) + Math.sin(age * 9 + p.c * 6) * 14 * sc;
      const y = T.fy - 10 * sc - age * (520 + 420 * p.d) * sc * (1 + age);
      const size = (46 + 56 * p.e) * sc * (u < 0.25 ? 0.4 + u * 2.4 : 1 - (u - 0.25) * 0.8);
      const col = u < 0.22 ? '#FFE7A0' : u < 0.55 ? '#F2712E' : '#C0301A';
      draw(ctx, glow(col), x, y, size, (1 - u) * 0.85);
    });
    parts(n(S, 60), 12, 0.5, 0.62, t, (p, age) => {
      if (age > 1) return;
      const ang = -Math.PI * (0.1 + 0.8 * p.a), sp = (300 + 500 * p.b) * sc;
      const x = T.fx + Math.cos(ang) * sp * age, y = T.cy + 60 * sc + Math.sin(ang) * sp * age + 700 * sc * age * age;
      draw(ctx, bit(S, '#FFB050'), x, y, (S.game === 'ffx2' ? 26 : 14) * sc, 1 - age, age * 4);
    });
    draw(ctx, glow('#FF9A3C'), T.cx, T.cy + T.h * 0.15, 380 * sc, 0.55 * env(t, 0.4, 1.4, 0.15, 0.6));
    ctx.globalCompositeOperation = 'source-over';
    parts(n(S, 26), 13, 0.7, 1.4, t, (p, age) => {
      const u = age / 0.9; if (u > 1) return;
      draw(ctx, glow('#1A0C0A'), T.fx + (p.a - 0.5) * 140 * sc, T.cy - 60 * sc - age * 260 * sc, (90 + 60 * p.b) * sc * (0.6 + u), 0.35 * (1 - u));
    });
    S.flash(0, '#FFB070', 0.22 * pulse(t, 0.5, 0.18));
  };

  B.ice = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 0.7);
    decal(ctx, T.fx, T.fy, 190 * sc, '#6EC8F0', 0.55 * env(t, 0.25, 1.85, 0.2, 0.5));
    const r = rng(21), shards = [];
    const count = S.dens < 1 ? 9 : 12;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + r() * 0.4;
      const rad = i === 0 ? 0 : (60 + 70 * r()) * sc;
      shards.push({ x: T.fx + Math.cos(ang) * rad, y: T.fy + Math.sin(ang) * rad * 0.28, h: (i === 0 ? 300 : 110 + 140 * r()) * sc, lean: (r() - 0.5) * 0.5 + Math.cos(ang) * 0.25, born: 0.3 + r() * 0.2 });
    }
    shards.sort((a, b) => a.y - b.y);
    const shatter = 1.15;
    const fade = clamp(1 - (t - shatter) / 0.08);
    for (const s of shards) {
      const g = outCubic((t - s.born) / 0.16);
      if (g <= 0 || fade <= 0) continue;
      const h = s.h * g, w = s.h * 0.2, tx = s.x + Math.sin(s.lean) * h, ty = s.y - Math.cos(s.lean) * h;
      const gr = ctx.createLinearGradient(s.x, s.y, tx, ty);
      gr.addColorStop(0, rgba('#1C4F8A', 0.9 * fade)); gr.addColorStop(0.55, rgba('#8FDCFA', 0.85 * fade)); gr.addColorStop(1, rgba('#FFFFFF', 0.95 * fade));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(s.x - w / 2, s.y); ctx.lineTo(s.x - w * 0.42 + (tx - s.x) * 0.7, s.y + (ty - s.y) * 0.7); ctx.lineTo(tx, ty);
      ctx.lineTo(s.x + w * 0.42 + (tx - s.x) * 0.7, s.y + (ty - s.y) * 0.7); ctx.lineTo(s.x + w / 2, s.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#FFFFFF', 0.7 * fade); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      draw(ctx, bit(S, '#BFEFFF'), tx, ty, (S.game === 'ffx2' ? 40 : 26) * sc, 0.8 * fade);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalCompositeOperation = 'lighter';
    parts(n(S, 90), 22, shatter, shatter + 0.05, t, (p, age) => {
      if (age > 0.75) return;
      const s = shards[p.i % shards.length];
      const ang = -Math.PI * p.a, sp = (250 + 550 * p.b) * sc;
      const x = s.x + Math.cos(ang) * sp * age, y = s.y - s.h * p.c + Math.sin(ang) * sp * age + 1400 * sc * age * age;
      ctx.save(); ctx.translate(x, y); ctx.rotate(age * 12 * (p.d - 0.5));
      ctx.fillStyle = rgba(p.e > 0.5 ? '#FFFFFF' : '#9EE4FF', 1 - age / 0.75);
      const z = (6 + 12 * p.e) * sc; ctx.beginPath(); ctx.moveTo(0, -z); ctx.lineTo(z * 0.4, z * 0.6); ctx.lineTo(-z * 0.4, z * 0.4); ctx.fill(); ctx.restore();
    });
    parts(n(S, 30), 23, 0.35, 1.6, t, (p, age) => {
      const u = age / 1.2; if (u > 1) return;
      draw(ctx, glow('#CFEFFF'), T.fx + (p.a - 0.5) * 300 * sc + age * 40 * sc, T.fy - 30 * sc - age * 60 * sc, (120 + 80 * p.b) * sc, 0.18 * Math.sin(u * Math.PI));
    });
    ctx.globalCompositeOperation = 'source-over';
    S.flash(0, '#E6F8FF', 0.2 * pulse(t, shatter, 0.15));
  };

  function bolt(ctx, x0, y0, x1, y1, seed, width, alpha, branches = 3) {
    const r = rng(seed), pts = [[x0, y0]], segs = 14;
    for (let i = 1; i < segs; i++) {
      const u = i / segs;
      pts.push([x0 + (x1 - x0) * u + (r() - 0.5) * 70, y0 + (y1 - y0) * u + (r() - 0.5) * 20]);
    }
    pts.push([x1, y1]);
    const paths = [pts];
    for (let b = 0; b < branches; b++) {
      const k = 3 + Math.floor(r() * 8), [bx, by] = pts[k], dir = r() < 0.5 ? -1 : 1, br = [[bx, by]];
      for (let j = 1; j < 6; j++) br.push([bx + dir * j * (20 + r() * 25), by + j * (18 + r() * 22)]);
      paths.push(br);
    }
    for (const [w, col, a] of [[width * 8, '#F2D24A', 0.14], [width * 3, '#FFE98A', 0.4], [width, '#FFFFFF', 1]]) {
      ctx.strokeStyle = rgba(col, a * alpha); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      paths.forEach((p, i) => { ctx.lineWidth = i ? w * 0.45 : w; ctx.beginPath(); p.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); });
    }
  }
  B.thunder = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 0.6);
    const strikes = S.reduce ? [0.42] : [0.42, 0.56, 0.78];
    ctx.globalCompositeOperation = 'lighter';
    decal(ctx, T.fx, T.fy, 220 * sc, '#F2D24A', 0.7 * env(t, 0.42, 1.6, 0.02, 0.8));
    strikes.forEach((s, i) => {
      const last = i === strikes.length - 1, vis = last ? (S.reduce ? 0.5 : 0.22) : 0.1;
      if (t < s || t > s + vis) return;
      const a = last ? 1 - (t - s) / vis : 1;
      bolt(ctx, T.cx + (i - 1) * 30, -40, T.fx, T.fy - 20 * sc, 31 + i, 5 * sc, a);
      S.flash(i, '#FFFFFF', 0.5 * pulse(t, s, 0.07));
    });
    parts(n(S, 50), 32, 0.42, 0.9, t, (p, age) => {
      if (age > 0.35) return;
      const ang = -Math.PI * p.a, sp = (400 + 600 * p.b) * sc, x = T.fx + Math.cos(ang) * sp * age, y = T.fy - 10 + Math.sin(ang) * sp * age * 0.6 + 900 * age * age;
      ctx.strokeStyle = rgba('#FFF4B0', 1 - age / 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * 16, y - Math.sin(ang) * 10); ctx.stroke();
    });
    // Arcs crawling over the target after the strike.
    for (let k = 0; k < n(S, 6); k++) {
      const tk = 0.6 + k * 0.12; if (t < tk || t > tk + 0.09) continue;
      const r = rng(40 + k), x = T.cx + (r() - 0.5) * T.w * 0.8, y = T.cy + (r() - 0.5) * T.h * 0.7;
      ctx.strokeStyle = rgba('#FFF4B0', 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 1; j < 5; j++) ctx.lineTo(x + j * 14 * (r() - 0.3), y + (r() - 0.5) * 30);
      ctx.stroke();
    }
    draw(ctx, glow('#FFF2A0'), T.cx, T.cy, 420 * sc, S.actorCap(0.6) * env(t, 0.42, 1.2, 0.02, 0.6));
    ctx.globalCompositeOperation = 'source-over';
  };

  B.water = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 0.7);
    decal(ctx, T.fx, T.fy, 180 * sc, '#3A8FD0', 0.6 * env(t, 0.3, 1.8, 0.2, 0.5));
    [0.35, 0.52, 0.7].forEach((s, i) => ring(ctx, T.fx, T.fy, (40 + 260 * outCubic((t - s) / 0.9)) * sc, 3, '#8FD8FF', 0.8 * env(t, s, s + 0.9, 0.02, 0.7)));
    ctx.globalCompositeOperation = 'lighter';
    // The orb over the target, then its burst.
    const orb = env(t, 0.3, 0.8, 0.15, 0.05), R = (40 + 110 * outCubic((t - 0.3) / 0.45)) * sc;
    if (orb > 0) {
      const gr = ctx.createRadialGradient(T.cx - R * 0.3, T.cy - R * 0.3, R * 0.1, T.cx, T.cy, R);
      gr.addColorStop(0, rgba('#FFFFFF', 0.8 * orb)); gr.addColorStop(0.35, rgba('#8FD8FF', 0.55 * orb)); gr.addColorStop(0.85, rgba('#3A8FD0', 0.45 * orb)); gr.addColorStop(1, rgba('#3A8FD0', 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(T.cx, T.cy, R, 0, Math.PI * 2); ctx.fill();
    }
    parts(n(S, 130), 41, 0.38, 0.62, t, (p, age) => {
      if (age > 1.1) return;
      const ang = p.a * Math.PI * 2, rx = 110 * sc * (1 + age * 0.9);
      const x = T.fx + Math.cos(ang) * rx, y = T.fy + Math.sin(ang) * rx * 0.28 - (700 + 400 * p.b) * sc * age + 1900 * sc * age * age;
      draw(ctx, glow('#5AB0F0'), x, y, (26 + 20 * p.c) * sc, 0.8 * (1 - age / 1.1));
      draw(ctx, bit(S, '#DDF4FF'), x, y, (S.game === 'ffx2' ? 18 : 8) * sc, 1 - age / 1.1);
    });
    parts(n(S, 70), 42, 0.8, 0.84, t, (p, age) => {
      if (age > 0.8) return;
      const ang = p.a * Math.PI * 2, sp = (300 + 500 * p.b) * sc;
      draw(ctx, glow('#8FD8FF'), T.cx + Math.cos(ang) * sp * age, T.cy + Math.sin(ang) * sp * age + 900 * sc * age * age, 22 * sc, 1 - age / 0.8);
    });
    ctx.globalCompositeOperation = 'source-over';
    S.flash(0, '#CFEFFF', 0.18 * pulse(t, 0.8, 0.15));
  };

  B.holy = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 1.2);
    ctx.globalCompositeOperation = 'lighter';
    decal(ctx, T.fx, T.fy, 200 * sc, '#FFF2C0', 0.55 * env(t, 0.2, 1.9, 0.2, 0.5));
    if (S.game === 'ffx2') {
      // FFX-2 Holy is eight hits of 12 (ffx2-combat-core §3), each its own strike.
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 - Math.PI / 2, tk = 0.55 + k * 0.11;
        const ox = T.cx + Math.cos(ang) * 190 * sc, oy = T.cy + Math.sin(ang) * 150 * sc;
        const u = clamp((t - tk + 0.12) / 0.12);
        if (t > 0.12 + k * 0.03 && t < tk) draw(ctx, S.game === 'ffx2' ? FX.spark4('#FFE6F4') : glow('#FFF2C0'), FX.lerp(ox, T.cx, u * u), FX.lerp(oy, T.cy, u * u), 44 * sc, 0.95);
        const a = env(t, tk, tk + 0.3, 0.01, 0.28);
        if (a) { draw(ctx, glow('#FFFFFF'), T.cx + (k % 3 - 1) * 20, T.cy + ((k * 7) % 5 - 2) * 14, 230 * sc, a * S.actorCap(0.8)); S.flash(k, '#FFF6FF', 0.28 * pulse(t, tk, 0.07)); }
        parts(n(S, 10), 50 + k, tk, tk + 0.02, t, (p, age) => {
          if (age > 0.45) return;
          const an = p.a * Math.PI * 2, sp = (200 + 300 * p.b) * sc;
          draw(ctx, FX.spark4('#F7B6D9'), T.cx + Math.cos(an) * sp * age, T.cy + Math.sin(an) * sp * age, 26 * sc, 1 - age / 0.45);
        });
      }
    } else {
      // FFX Holy is one hit (ffx-combat-core §2): pillars fall, converge, one burst.
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2, rx0 = 150 * sc;
        const conv = outCubic((t - 0.55) / 0.3), rx = rx0 * (1 - conv);
        const x = T.fx + Math.cos(ang) * rx, zy = Math.sin(ang) * rx * 0.28;
        const drop = outCubic((t - 0.15 - k * 0.04) / 0.25), bottom = FX.lerp(-60, T.fy + zy, drop);
        const a = env(t, 0.15 + k * 0.04, 0.95, 0.05, 0.12);
        if (!a) continue;
        const gr = ctx.createLinearGradient(0, -60, 0, bottom);
        gr.addColorStop(0, rgba('#FFF2C0', 0)); gr.addColorStop(0.7, rgba('#FFF2C0', 0.55 * a)); gr.addColorStop(1, rgba('#FFFFFF', 0.95 * a));
        ctx.fillStyle = gr; ctx.fillRect(x - 9 * sc, -60, 18 * sc, bottom + 60);
        draw(ctx, glow('#FFF2C0'), x, bottom, 60 * sc, a);
      }
      const R = 260 * sc * outCubic((t - 0.85) / 0.35);
      draw(ctx, glow('#FFFFFF'), T.cx, T.cy, R * 2.2, S.actorCap(0.95) * env(t, 0.85, 1.6, 0.02, 0.6));
      parts(n(S, 70), 51, 0.86, 0.95, t, (p, age) => {
        if (age > 1.1) return;
        const an = p.a * Math.PI * 2, sp = (120 + 240 * p.b) * sc;
        const x = T.cx + Math.cos(an) * sp * age * 1.4, y = T.cy + Math.sin(an) * sp * age - 80 * sc * age;
        ctx.save(); ctx.translate(x, y); ctx.rotate(an + age * 2); ctx.fillStyle = rgba('#FFF6D8', 0.9 * (1 - age / 1.1));
        ctx.beginPath(); ctx.ellipse(0, 0, 14 * sc, 4 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      S.flash(0, '#FFFFFF', 0.55 * pulse(t, 0.85, 0.25));
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  B.cure = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    castMark(S, T, t, 0, 1.3);
    ctx.globalCompositeOperation = 'lighter';
    decal(ctx, T.fx, T.fy, 160 * sc, '#7EE8B0', 0.55 * env(t, 0.2, 1.5, 0.2, 0.5));
    const col = env(t, 0.3, 1.3, 0.2, 0.4);
    if (col) {
      ctx.save(); ctx.translate(T.fx, T.fy - T.h * 0.45); ctx.scale(T.w * 0.9 / 128, T.h * 1.5 / 128);
      ctx.globalAlpha = 0.45 * col; ctx.drawImage(glow('#B8FFD8'), -64, -64); ctx.restore(); ctx.globalAlpha = 1;
    }
    const cols = S.game === 'ffx2' ? ['#B8FFD8', '#FFFFFF', '#F7B6D9'] : ['#B8FFD8', '#FFFFFF', '#E3F7A0'];
    parts(n(S, 100), 61, 0.25, 1.2, t, (p, age) => {
      const u = age / 0.9; if (u > 1) return;
      const ang = p.a * Math.PI * 2 + age * 4, rad = (60 + 50 * p.b) * sc * (1 - u * 0.4);
      const x = T.fx + Math.cos(ang) * rad, y = T.fy - age * (300 + 200 * p.c) * sc + Math.sin(ang) * rad * 0.28;
      draw(ctx, bit(S, cols[p.i % 3]), x, y, (S.game === 'ffx2' ? 30 : 18) * sc * (1 - u * 0.5), Math.sin(u * Math.PI));
    });
    draw(ctx, glow('#C8FFE0'), T.cx, T.cy, 360 * sc, S.actorCap(0.4) * env(t, 0.5, 1.4, 0.2, 0.5));
    ctx.globalCompositeOperation = 'source-over';
  };

  function slash(S, T, t, t0, dur, a0, a1, R, edge) {
    const { ctx } = S;
    const prog = clamp((t - t0) / dur), fade = env(t, t0, t0 + dur + 0.3, 0.001, 0.3);
    if (!prog || !fade) return;
    const aEnd = FX.lerp(a0, a1, outCubic(prog)), steps = 30;
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, col, al] of [[3.2, edge, 0.35], [1.6, edge, 0.8], [0.7, '#FFFFFF', 1]]) {
      ctx.fillStyle = rgba(col, al * fade);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) { const u = i / steps, a = FX.lerp(a0, aEnd, u), th = Math.sin(u * Math.PI) * 26 * T.sc * w; ctx.lineTo(T.cx + Math.cos(a) * (R + th / 2), T.cy + Math.sin(a) * (R + th / 2) * 0.55); }
      for (let i = steps; i >= 0; i--) { const u = i / steps, a = FX.lerp(a0, aEnd, u), th = Math.sin(u * Math.PI) * 26 * T.sc * w; ctx.lineTo(T.cx + Math.cos(a) * (R - th / 2), T.cy + Math.sin(a) * (R - th / 2) * 0.55); }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  B.hit = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    const edge = S.game === 'ffx2' ? '#F7B6D9' : '#E3B94A';
    slash(S, T, t, 0.22, 0.12, -2.5, 0.2, 150 * sc, edge);
    ctx.globalCompositeOperation = 'lighter';
    parts(n(S, 34), 71, 0.3, 0.33, t, (p, age) => {
      if (age > 0.4) return;
      const ang = p.a * Math.PI * 2, sp = (500 + 700 * p.b) * sc, x = T.cx + Math.cos(ang) * sp * age, y = T.cy + Math.sin(ang) * sp * age + 600 * age * age;
      if (S.game === 'ffx2') draw(ctx, FX.spark4(edge), x, y, 22 * sc, 1 - age / 0.4);
      else { ctx.strokeStyle = rgba(p.c > 0.5 ? '#FFFFFF' : edge, 1 - age / 0.4); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * 22, y - Math.sin(ang) * 22); ctx.stroke(); }
    });
    draw(ctx, glow('#FFFFFF'), T.cx, T.cy, 300 * sc, S.actorCap(0.7) * env(t, 0.3, 0.55, 0.01, 0.22));
    ctx.globalCompositeOperation = 'source-over';
    S.shake = Math.max(S.shake, 10 * pulse(t, 0.31, 0.15));
    S.flash(0, '#FFFFFF', 0.1 * pulse(t, 0.31, 0.1));
  };

  // FFX: Spiral Cut (Tidus's Overdrive). The look is ours; the research has no
  // description of the retail animation beyond its name.
  B.spiral = (S, t, T) => {
    const { ctx } = S, sc = T.sc;
    ctx.globalCompositeOperation = 'lighter';
    const va = env(t, 0.1, 1.55, 0.2, 0.15);
    for (let j = 0; j < 6; j++) {
      ctx.strokeStyle = rgba(j % 2 ? '#7FC6E8' : '#FFFFFF', 0.55 * va); ctx.lineWidth = (j % 2 ? 7 : 3) * sc; ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, y = T.fy - u * 620 * sc * outCubic((t - 0.1) / 0.5), th = u * 9 + t * 11 + (j * Math.PI * 2) / 6, r = (50 + 110 * u) * sc;
        ctx.lineTo(T.fx + Math.cos(th) * r, y + Math.sin(th) * r * 0.25);
      }
      ctx.stroke();
    }
    parts(n(S, 90), 81, 0.2, 1.4, t, (p, age) => {
      if (age > 0.6) return;
      const th = p.a * 7 + age * 10, r = (60 + 140 * p.b) * sc * (1 + age), y = T.fy - p.c * 560 * sc - age * 200 * sc;
      draw(ctx, bit(S, '#BFE8FF'), T.fx + Math.cos(th) * r, y, 16 * sc, 1 - age / 0.6);
    });
    decal(ctx, T.fx, T.fy, 240 * sc, '#7FC6E8', 0.6 * va);
    ctx.globalCompositeOperation = 'source-over';
    const big = { ...T, cy: T.cy - 20 * sc };
    slash(S, big, t, 1.3, 0.14, -1.75, 1.45, 210 * sc, '#E3B94A');
    ctx.globalCompositeOperation = 'lighter';
    draw(ctx, glow('#FFFFFF'), T.cx, T.cy, 520 * sc, S.actorCap(0.9) * env(t, 1.42, 2.2, 0.01, 0.7));
    ring(ctx, T.fx, T.fy, (80 + 420 * outCubic((t - 1.42) / 0.8)) * sc, 4, '#FFFFFF', 0.8 * env(t, 1.42, 2.3, 0.01, 0.8));
    parts(n(S, 80), 82, 1.42, 1.46, t, (p, age) => {
      if (age > 1) return;
      const an = -Math.PI * p.a, sp = (300 + 700 * p.b) * sc;
      draw(ctx, glow(p.c > 0.5 ? '#7FC6E8' : '#FFFFFF'), T.cx + Math.cos(an) * sp * age, T.cy + Math.sin(an) * sp * age + 900 * sc * age * age, 20 * sc, 1 - age);
    });
    ctx.globalCompositeOperation = 'source-over';
    S.shake = Math.max(S.shake, 16 * pulse(t, 1.43, 0.25));
    S.flash(0, '#FFFFFF', 0.5 * pulse(t, 1.43, 0.25));
  };

  // FFX-2: Mega Flare (Bahamut -> the party). Violet motes converging on the
  // chest (visual-bible §2 Bevelle particles) and a #B8E4FF -> white core
  // (visual-bible §1.21 aeon table, marked [estimate]).
  B.megaflare = (S, t, T) => {
    const { ctx } = S, sc = T.sc, P = S.T.party;
    const chest = { x: T.cx - 20 * sc, y: T.cy - T.h * 0.12 };
    ctx.globalCompositeOperation = 'lighter';
    parts(n(S, 140), 91, 0, 1.25, t, (p, age) => {
      const life = 0.55; if (age > life) return;
      const u = FX.inCubic(age / life), an = p.a * Math.PI * 2, r0 = (260 + 260 * p.b) * sc;
      draw(ctx, bit(S, p.c > 0.4 ? '#B048F0' : '#D8B8FF'), FX.lerp(chest.x + Math.cos(an) * r0, chest.x, u), FX.lerp(chest.y + Math.sin(an) * r0 * 0.7, chest.y, u), (S.game === 'ffx2' ? 30 : 14) * sc, 0.4 + u * 0.6);
    });
    const core = env(t, 0.1, 1.55, 0.3, 0.1), cr = (14 + 70 * outCubic(t / 1.3)) * sc;
    draw(ctx, glow('#B8E4FF'), chest.x, chest.y, cr * 5, core);
    draw(ctx, glow('#FFFFFF'), chest.x, chest.y, cr * 2.2, core);
    const beam = env(t, 1.3, 1.75, 0.03, 0.2);
    if (beam) {
      const u = outCubic((t - 1.3) / 0.12), ex = FX.lerp(chest.x, P.x, u), ey = FX.lerp(chest.y, P.y, u);
      for (const [w, col, a] of [[90, '#B048F0', 0.3], [48, '#B8E4FF', 0.6], [16, '#FFFFFF', 1]]) {
        ctx.strokeStyle = rgba(col, a * beam); ctx.lineWidth = w * sc; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(chest.x, chest.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    const boom = env(t, 1.42, 3.1, 0.02, 1.2), R = 420 * sc * outCubic((t - 1.42) / 0.5);
    if (boom) {
      const gr = ctx.createRadialGradient(P.x, P.y - R * 0.3, 0, P.x, P.y - R * 0.3, R);
      gr.addColorStop(0, rgba('#FFFFFF', S.actorCap(0.95) * boom)); gr.addColorStop(0.4, rgba('#B8E4FF', 0.6 * boom)); gr.addColorStop(0.8, rgba('#B048F0', 0.35 * boom)); gr.addColorStop(1, rgba('#B048F0', 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(P.x, P.y - R * 0.3, R, 0, Math.PI * 2); ctx.fill();
    }
    ring(ctx, P.x, P.y + 40, (100 + 900 * outCubic((t - 1.45) / 0.9)) * sc, 5, '#D8B8FF', 0.9 * env(t, 1.45, 2.6, 0.01, 1));
    parts(n(S, 90), 92, 1.45, 1.55, t, (p, age) => {
      if (age > 1.3) return;
      const an = -Math.PI * p.a, sp = (300 + 800 * p.b) * sc;
      draw(ctx, bit(S, p.c > 0.5 ? '#B8E4FF' : '#F7B6D9'), P.x + Math.cos(an) * sp * age, P.y + Math.sin(an) * sp * age * 0.8 + 700 * sc * age * age, (S.game === 'ffx2' ? 30 : 14) * sc, 1 - age / 1.3);
    });
    ctx.globalCompositeOperation = 'source-over';
    S.shake = Math.max(S.shake, 22 * pulse(t, 1.45, 0.4));
    S.flash(0, '#FFFFFF', 0.8 * pulse(t, 1.43, 0.35));
  };
})();
