// Mockup generator for the status-display options round (2026-09-29).
// Reads frames/<game>-<size>.json (screen rects captured from a production build
// of origin/main 1c313c17) and writes one static HTML overlay per option, game
// and size into this folder. Every icon and effect below is drawn fresh in SVG;
// no retail icon, frame or model is used (AGENTS.md rule 8). The background of
// each page is OUR game's own frame (frames/<game>-<size>-base.jpg).
//
//   node gen.mjs            -> writes o1-ffx-desktop.html ... o3-x2-phone.html
//
// The frames are captured by the scratch script capture.mjs (see README.md).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRAMES = join(HERE, '..', 'frames');

// ---------------------------------------------------------------- icons
// 24x24 glyphs, our own drawings keyed to the sourced *idea* of each look
// (research/status-display.md): bubbles for Poison, smoke for Zombie, Z's for
// Sleep, an ellipsis bubble for Silence, a shield for Protect, and so on.
const GLYPHS = {
  zombie: `<circle cx="7" cy="5" r="2.4" fill="#2a2a30"/><circle cx="11.5" cy="3.6" r="2.8" fill="#2a2a30"/><circle cx="16" cy="5" r="2.2" fill="#2a2a30"/>
    <circle cx="12" cy="13" r="7" fill="#9fe38a" stroke="#1d3d17" stroke-width="1.4"/>
    <circle cx="9.4" cy="12" r="1.5" fill="#12200f"/><circle cx="14.6" cy="12" r="1.5" fill="#12200f"/>
    <path d="M8.3 16.2l1.2-1 1.2 1 1.3-1 1.2 1 1.2-1 1.2 1" fill="none" stroke="#12200f" stroke-width="1.2" stroke-linecap="round"/>`,
  poison: `<circle cx="8.5" cy="15" r="5" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.3"/><circle cx="7" cy="13.3" r="1.4" fill="#effff0"/>
    <circle cx="16" cy="8.5" r="3.6" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.2"/><circle cx="15" cy="7.4" r="1" fill="#effff0"/>
    <circle cx="17" cy="17.5" r="2.4" fill="#7fe36b" stroke="#1c4d18" stroke-width="1.1"/>`,
  protect: `<path d="M12 2.8l7.2 3v5.4c0 4.9-3.2 8.3-7.2 10-4-1.7-7.2-5.1-7.2-10V5.8z" fill="#7fc6e8" stroke="#123a52" stroke-width="1.4"/>
    <path d="M12 5.2v14" stroke="#e8f7ff" stroke-width="1.6"/>`,
  shell: `<path d="M12 2.8l7.2 3v5.4c0 4.9-3.2 8.3-7.2 10-4-1.7-7.2-5.1-7.2-10V5.8z" fill="#c3a6ff" stroke="#2e1d5a" stroke-width="1.4"/>
    <circle cx="12" cy="11.5" r="3.4" fill="none" stroke="#f3ecff" stroke-width="1.6"/>`,
  reflect: `<path d="M12 2.5l8.5 9.5-8.5 9.5-8.5-9.5z" fill="#d7f3ff" stroke="#1d4b66" stroke-width="1.4"/>
    <path d="M9 8.5l6 7M8 12l3 3.4" stroke="#5aa9d6" stroke-width="1.4"/>`,
  slow: `<path d="M6.5 3.5h11M6.5 20.5h11" stroke="#f3dc8c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M7.5 4.2h9L12 12zM12 12l4.5 7.8h-9z" fill="#e3b94a" stroke="#5a3f0c" stroke-width="1.2" stroke-linejoin="round"/>`,
  haste: `<path d="M4.5 5.5l6.5 6.5-6.5 6.5M12 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="#ff7a5c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  sleep: `<text x="3" y="19" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="15" fill="#cfe0ff" stroke="#1c2a55" stroke-width="0.8">Z</text>
    <text x="13" y="11" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="10" fill="#cfe0ff" stroke="#1c2a55" stroke-width="0.6">z</text>`,
  silence: `<path d="M4 5.5h16a1.8 1.8 0 0 1 1.8 1.8v8a1.8 1.8 0 0 1-1.8 1.8H11l-4.5 3.6.8-3.6H4a1.8 1.8 0 0 1-1.8-1.8v-8A1.8 1.8 0 0 1 4 5.5z" fill="#f4f1e8" stroke="#0b0a12" stroke-width="1.2"/>
    <circle cx="8" cy="11.4" r="1.4" fill="#0b0a12"/><circle cx="12" cy="11.4" r="1.4" fill="#0b0a12"/><circle cx="16" cy="11.4" r="1.4" fill="#0b0a12"/>`,
  doom: `<circle cx="12" cy="12" r="8.6" fill="#3a0d12" stroke="#ff5a5a" stroke-width="1.8"/><path d="M12 12V6.5" stroke="#ff9a9a" stroke-width="1.6" stroke-linecap="round"/>`,
  curse: `<path d="M12 12.5a1.2 1.2 0 1 1 1.6-1.1 3 3 0 1 1-4.9-1.9 5 5 0 1 1 7.3 6.4" fill="none" stroke="#c09ae0" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="#6b4a86" stroke-width="1"/>`,
};
const HARM = new Set(['zombie', 'poison', 'slow', 'sleep', 'silence', 'doom', 'curse']);
const NAMES = { zombie: 'Zombie', poison: 'Poison', protect: 'Protect', shell: 'Shell', reflect: 'Reflect', slow: 'Slow', haste: 'Haste', sleep: 'Sleep', silence: 'Silence', doom: 'Doom', curse: 'Curse' };

const symbols = () => `<svg width="0" height="0" style="position:absolute"><defs>${Object.entries(GLYPHS)
  .map(([k, g]) => `<symbol id="g-${k}" viewBox="0 0 24 24">${g}</symbol>`).join('')}
  <radialGradient id="bub" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#d9ffc9"/><stop offset=".45" stop-color="#7fe36b"/><stop offset="1" stop-color="#2f8f2a"/></radialGradient>
  <filter id="smoke" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="smokeS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs></svg>`;

/** One status icon tile. `shape` is 'round' for FFX (our medallion), 'tag' for FFX-2. */
function icon(id, size, shape, count) {
  const cls = `ic ic--${shape} ${HARM.has(id) ? 'ic--harm' : 'ic--help'}`;
  const num = count != null ? `<b class="ic__n">${count}</b>` : '';
  return `<span class="${cls}" style="width:${size}px;height:${size}px" title="${NAMES[id]}"><svg viewBox="0 0 24 24"><use href="#g-${id}"/></svg>${num}</span>`;
}
function iconRow(ids, { x, y, size, shape, align = 'left', gap = 3, counts = {} }) {
  const w = ids.length * size + (ids.length - 1) * gap;
  const left = align === 'right' ? x - w : x;
  return `<div class="row" style="left:${left}px;top:${y}px;gap:${gap}px">${ids.map((id) => icon(id, size, shape, counts[id])).join('')}</div>`;
}

// ---------------------------------------------------------------- on-model effects (SVG, frame coordinates)
function smoke(hx, hy, k) {
  // Zombie: "black smoke clouds around their heads" (FFX, research §2).
  const puffs = [[-44, -6, 20, 14], [-30, -34, 18, 13], [-2, -50, 22, 14], [30, -38, 19, 13], [46, -8, 17, 12], [-50, 20, 14, 10], [44, 22, 13, 9]];
  const f = `url(#${k < 0.6 ? 'smokeS' : 'smoke'})`;
  return puffs.map(([dx, dy, rx, ry]) => `<ellipse cx="${hx + dx * k}" cy="${hy + dy * k}" rx="${rx * k * 1.35}" ry="${ry * k * 1.35}" fill="#9fb59a" opacity=".32" filter="${f}"/>`).join('')
    + puffs.map(([dx, dy, rx, ry], i) => `<ellipse cx="${hx + dx * k}" cy="${hy + dy * k}" rx="${rx * k}" ry="${ry * k}" fill="#050507" opacity="${0.8 + (i % 3) * 0.06}" filter="${f}"/>`).join('')
    + puffs.slice(0, 5).map(([dx, dy, rx, ry]) => `<ellipse cx="${hx + dx * k * 1.05}" cy="${hy + dy * k * 1.05}" rx="${rx * k * 0.55}" ry="${ry * k * 0.5}" fill="#000" opacity=".9" filter="${f}"/>`).join('');
}
function bubbles(hx, hy, k) {
  // Poison: "green bubbles above the afflicted target's head" (both games, research §2 and §3).
  const bs = [[-6, -62, 9], [10, -84, 7], [-2, -104, 5.5], [18, -60, 4.5], [-16, -86, 4]];
  return bs.map(([dx, dy, r]) => `<circle cx="${hx + dx * k}" cy="${hy + dy * k}" r="${r * k}" fill="url(#bub)" stroke="#1c4d18" stroke-width="${1.2 * k}"/>`
    + `<circle cx="${hx + (dx - r * 0.35) * k}" cy="${hy + (dy - r * 0.35) * k}" r="${r * 0.28 * k}" fill="#f5fff2"/>`).join('');
}
function zzz(hx, hy, k) {
  // Sleep: "Z's appear above their head" (FFX-2, research §3). The hunch needs a new painting and is not drawn.
  const zs = [[16, -26, 34], [38, -56, 27], [56, -82, 20]];
  return zs.map(([dx, dy, s]) => `<text x="${hx + dx * k}" y="${hy + dy * k}" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="${s * k}" fill="#e6efff" stroke="#1a2552" stroke-width="${3.2 * k}" paint-order="stroke" transform="rotate(-12 ${hx + dx * k} ${hy + dy * k})">Z</text>`).join('');
}
function speech(hx, hy, k) {
  // Silence (FFX-2): "a speech bubble with an ellipsis above their head" (research §3).
  const x = hx + 16 * k, y = hy - 66 * k, w = 50 * k, h = 30 * k;
  return `<g><path d="M${x} ${y + 6 * k}q0-${6 * k} ${6 * k}-${6 * k}h${w - 12 * k}q${6 * k} 0 ${6 * k} ${6 * k}v${h - 12 * k}q0 ${6 * k}-${6 * k} ${6 * k}h-${w - 30 * k}l-${12 * k} ${11 * k} ${2 * k}-${11 * k}h-${2 * k}q-${6 * k} 0-${6 * k}-${6 * k}z" fill="#f4f1e8" stroke="#0b0a12" stroke-width="${2 * k}"/>`
    + [0, 1, 2].map((i) => `<circle cx="${x + (14 + i * 11) * k}" cy="${y + h / 2}" r="${2.8 * k}" fill="#0b0a12"/>`).join('') + '</g>';
}

// ---------------------------------------------------------------- page shell
function page({ tag, W, H, body, fx, font = 1 }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${tag}</title>
<style>
@font-face{font-family:'Rajdhani';font-weight:700;src:url('../../../../../public/fonts/rajdhani/Rajdhani-Bold-700.woff2') format('woff2')}
@font-face{font-family:'Rajdhani';font-weight:600;src:url('../../../../../public/fonts/rajdhani/Rajdhani-SemiBold-600.woff2') format('woff2')}
@font-face{font-family:'Chakra Petch';font-weight:700;src:url('../../../../../public/fonts/chakra-petch/ChakraPetch-Bold-700.woff2') format('woff2')}
@font-face{font-family:'Cormorant Garamond';font-style:italic;src:url('../../../../../public/fonts/cormorant-garamond/CormorantGaramond-Italic-Variable-wght.woff2') format('woff2')}
@font-face{font-family:'Exo 2';src:url('../../../../../public/fonts/exo2/Exo2-Variable-wght.woff2') format('woff2')}
:root{--ink:#0b0a12;--paper:#f4f1e8;--gold:#e3b94a;--pink:#f7b6d9;--harm:#ff4f64;--help:#49d8b4;--f:${font}}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}
.stage{position:relative;width:${W}px;height:${H}px;background:url('../frames/${tag}-base.jpg') 0 0/100% 100% no-repeat}
.fx{position:absolute;inset:0;pointer-events:none}
.row{position:absolute;display:flex;align-items:center}
.ic{position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;background:rgba(11,10,18,.9);border:calc(2px*var(--f)) solid;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 2px 6px rgba(0,0,0,.55)}
.ic svg{width:84%;height:84%}
.ic--round{border-radius:50%}
.ic--tag{border-radius:calc(4px*var(--f))}
.ic--harm{border-color:var(--harm);background:linear-gradient(#3a0f18,#1a070c)}
.ic--help{border-color:var(--help);background:linear-gradient(#0d3a31,#06170f)}
.ic__n{position:absolute;right:-30%;bottom:-30%;min-width:62%;padding:0 14%;box-sizing:border-box;border-radius:3px;background:#fff;color:#b0102a;border:1px solid var(--harm);font:700 calc(14px*var(--f))/1.1 Rajdhani,sans-serif;text-align:center}
.abs{position:absolute}
.pill{position:absolute;display:inline-flex;align-items:center;gap:calc(5px*var(--f));padding:calc(2px*var(--f)) calc(9px*var(--f));font:700 calc(14px*var(--f))/1.2 'Chakra Petch',sans-serif;letter-spacing:.14em;color:#fff;background:var(--harm);transform:skewX(-12deg);box-shadow:0 2px 8px rgba(0,0,0,.6)}
.pill>*{transform:skewX(12deg)}
.x2 .pill{transform:skewX(12deg)}.x2 .pill>*{transform:skewX(-12deg)}
.warnpanel{position:absolute;box-sizing:border-box;background:rgb(40,6,14);border-left:calc(4px*var(--f)) solid var(--harm);color:#ffe3e6;font:600 calc(17px*var(--f))/1.25 'Exo 2',sans-serif;padding:calc(6px*var(--f)) calc(14px*var(--f))}
.warnpanel b{color:#ff8a98;font-weight:800}
.card{position:absolute;box-sizing:border-box;background:rgba(11,10,18,.92);border-left:calc(3px*var(--f)) solid var(--gold);color:#efeae0;font:500 calc(15px*var(--f))/1.35 'Exo 2',sans-serif;padding:calc(10px*var(--f)) calc(14px*var(--f))}
.x2 .card{border-left:0;border-right:calc(3px*var(--f)) solid var(--pink)}
.card h4{margin:0 0 calc(6px*var(--f));font:700 calc(12px*var(--f))/1 'Chakra Petch',sans-serif;letter-spacing:.22em;color:var(--gold);display:flex;gap:calc(8px*var(--f));align-items:center}
.x2 .card h4{color:var(--pink)}
.card h4 i{font-style:normal;background:var(--harm);color:#fff;padding:calc(2px*var(--f)) calc(6px*var(--f))}
.card b{color:#fff}
.msg{position:absolute;box-sizing:border-box;display:flex;align-items:center;gap:calc(8px*var(--f));padding:calc(5px*var(--f)) calc(18px*var(--f));background:linear-gradient(90deg,rgba(11,10,18,0),rgba(11,10,18,.9) 12%,rgba(11,10,18,.9) 88%,rgba(11,10,18,0));color:#fff;font:italic 600 calc(22px*var(--f))/1.1 'Cormorant Garamond',serif;white-space:nowrap}
.fore{position:absolute;font:700 calc(46px*var(--f))/1 Rajdhani,sans-serif;color:#ff5a6a;text-shadow:0 0 2px #000,0 2px 0 #000,0 0 14px rgba(255,40,70,.55);-webkit-text-stroke:calc(1.5px*var(--f)) #2a0008;white-space:nowrap}
.fore small{display:block;font:700 calc(12px*var(--f))/1.3 'Chakra Petch',sans-serif;letter-spacing:.2em;color:#ffd0d6;-webkit-text-stroke:0;text-shadow:0 1px 2px #000}
.helpline{position:absolute;display:flex;align-items:center;gap:calc(8px*var(--f));color:#fff;font:italic 600 calc(20px*var(--f))/1 'Cormorant Garamond',serif}
.helpline::before{content:'';width:1px;height:calc(20px*var(--f));background:rgba(247,182,217,.6);margin-right:calc(6px*var(--f))}
</style></head><body class="${tag.startsWith('x2') ? 'x2' : 'ffx'}">${symbols()}
<div class="stage">
<svg class="fx" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fx}</svg>
${body}
</div></body></html>
`;
}

// ---------------------------------------------------------------- scenes
const load = (tag) => JSON.parse(readFileSync(join(FRAMES, `${tag}.json`), 'utf8'));
const head = (m, id, fx, fy) => { const a = m.actors[id]; return [a.x + a.w * fx, a.y + a.h * fy]; };

function ffx(opt, phone) {
  const tag = `ffx-${phone ? 'phone' : 'desktop'}`;
  const m = load(tag);
  const { W, H } = m.size;
  const k = m.actors.kimahri.h / 261;
  const [kx, ky] = head(m, 'kimahri', 0.6, 0.2);
  // O1: Kimahri's green body is in the base frame (engine tint); add the smoke and the Poison bubbles.
  let fx = smoke(kx, ky, k) + bubbles(kx + 10 * k, ky + 10 * k, k);
  let body = '';
  const sz = phone ? 15 : 22;
  if (opt >= 2) {
    const r = m.rows;
    if (!phone) {
      // Under the Overdrive gauge, right-aligned: the one empty band of the FFX plate.
      const under = (id, ids) => iconRow(ids, { x: r[id].gauge.x + r[id].gauge.w - 18, y: r[id].gauge.y + r[id].gauge.h + 3, size: 26, shape: 'round', align: 'right', gap: 4 });
      body += under('kimahri', ['zombie', 'poison', 'protect']) + under('yuna', ['slow']);
      // Turn list: the enemy's row lives here in FFX (the Sensor folds away while aiming at an ally).
      const t = m.ctb;
      body += iconRow(['shell', 'reflect'], { x: t[1].x - 132, y: t[1].y + t[1].h / 2 - 12, size: 24, shape: 'round', align: 'right' });
      body += iconRow(['zombie', 'poison', 'protect'], { x: t[3].x - 92, y: t[3].y + t[3].h / 2 - 12, size: 24, shape: 'round', align: 'right' });
      body += iconRow(['slow'], { x: t[4].x - 76, y: t[4].y + t[4].h / 2 - 12, size: 24, shape: 'round', align: 'right' });
    } else {
      const r2 = m.rows;
      body += iconRow(['zombie', 'poison', 'protect'], { x: r2.kimahri.row.x + r2.kimahri.row.w - 4, y: r2.kimahri.row.y - 9, size: sz, shape: 'round', align: 'right', gap: 2 });
      body += iconRow(['slow'], { x: r2.yuna.row.x + r2.yuna.row.w - 4, y: r2.yuna.row.y - 9, size: sz, shape: 'round', align: 'right', gap: 2 });
      const t = m.ctb;
      body += iconRow(['shell', 'reflect'], { x: t[1].x + t[1].w + 2, y: t[1].y + t[1].h - 11, size: 13, shape: 'round', align: 'right', gap: 1 });
      body += iconRow(['zombie', 'poison', 'protect'], { x: t[3].x + t[3].w + 2, y: t[3].y + t[3].h - 11, size: 13, shape: 'round', align: 'right', gap: 1 });
      body += iconRow(['slow'], { x: t[4].x + t[4].w + 2, y: t[4].y + t[4].h - 11, size: 13, shape: 'round', align: 'right', gap: 1 });
    }
  }
  if (opt >= 3) {
    const a = m.actors.kimahri;
    const tp = m.targetPlate;
    if (!phone) {
      body += `<span class="pill" style="left:${tp.x + tp.w + 8}px;top:${tp.y + 5}px"><span>ZOMBIE</span></span>`;
      body += `<div class="fore" style="left:${a.x + a.w + 6}px;top:${a.y + 70}px"><small>HI-POTION ON A ZOMBIE</small>−1000 <span style="font-size:.55em;vertical-align:.35em">KO</span></div>`;
      const h = m.help;
      body += `<div class="warnpanel" style="left:${h.x}px;top:${h.y - 12}px;width:${h.w + 40}px;min-height:${h.h + 12}px"><b>Kimahri is a Zombie.</b> A Hi-Potion hurts him for 1000, and he has 840 HP left: it would KO him.</div>`;
      body += `<span class="pill" style="left:370px;top:527px;font-size:12px"><span>✕ HURTS</span></span>`;
      body += `<div class="card" style="left:53px;top:78px;width:340px"><h4>GUIDE <i>ZOMBIE</i></h4>Healing turns into damage on a Zombie, and a <b>Phoenix Down</b> would KO him outright. <b>Holy Water</b> or a <b>Remedy</b> cures it; Esuna does not.</div>`;
      body += `<div class="msg" style="left:${W / 2 - 230}px;top:74px;width:460px;justify-content:center">${icon('zombie', 24, 'round')}Kimahri became a Zombie.</div>`;
    } else {
      body += `<span class="pill" style="left:152px;top:574px;font-size:10px;padding:1px 6px"><span>ZOMBIE</span></span>`;
      body += `<div class="fore" style="left:${a.x + a.w + 2}px;top:${a.y + 20}px;--f:.62"><small>HI-POTION</small>−1000 <span style="font-size:.55em;vertical-align:.35em">KO</span></div>`;
      body += `<div class="warnpanel" style="left:18px;top:620px;width:356px;--f:.78;background:rgb(40,6,14)"><b>Kimahri is a Zombie.</b> A Hi-Potion hurts him for 1000; at 840 HP it would KO him.</div>`;
      body += `<div class="card" style="left:8px;top:676px;width:374px;--f:.74"><h4>GUIDE <i>ZOMBIE</i></h4>Healing hurts a Zombie. <b>Holy Water</b> or a <b>Remedy</b> cures it; Esuna does not.</div>`;
      body += `<div class="abs" style="left:113px;top:755px;width:270px;height:50px;box-sizing:border-box;border:3px solid var(--harm);transform:skewX(-12deg);box-shadow:0 0 14px rgba(255,79,100,.6)"></div>`;
      body += `<div class="msg" style="left:40px;top:134px;width:310px;justify-content:center;--f:.7">${icon('zombie', 17, 'round')}Kimahri became a Zombie.</div>`;
    }
  }
  return { tag, W, H, fx, body, font: phone ? 0.75 : 1 };
}

function x2(opt, phone) {
  const tag = `x2-${phone ? 'phone' : 'desktop'}`;
  const m = load(tag);
  const { W, H } = m.size;
  const k = m.actors.yuna.h / 330;
  const [yx, yy] = head(m, 'yuna', 0.63, 0.106);
  const [rx, ry] = head(m, 'rikku', 0.35, 0.135);
  // O1: Rikku's bubbles and Silence bubble, Yuna's Z's; Paine's darkened (Curse) body is in the base frame;
  // Paine's red (Haste) gauge is already ours.
  let fx = bubbles(rx - 18 * k, ry, k) + speech(rx + 6 * k, ry, k) + zzz(yx, yy, k);
  let body = '';
  // The help line (desktop) / target card (phone) lists the targeted unit's status icons: FFX-2's own place for them.
  if (!phone) {
    body += `<div class="helpline" style="left:380px;top:9px">Bahamut ${icon('doom', 24, 'tag', opt >= 2 ? 3 : null)}</div>`;
  } else {
    body += `<div class="row" style="left:104px;top:571px">${icon('doom', 20, 'tag', opt >= 2 ? 3 : null)}</div>`;
  }
  const r = m.rows;
  if (opt >= 2) {
    if (!phone) {
      const at = (id, ids) => iconRow(ids, { x: r[id].row.x + r[id].row.w - 28, y: r[id].statuses.y - 3, size: 28, shape: 'tag', align: 'right', gap: 4 });
      body += at('yuna', ['sleep']) + at('rikku', ['poison', 'silence']) + at('paine', ['curse', 'haste']);
      const b = m.bossHead;
      body += `<div class="abs" style="left:${b.x + 22}px;top:${b.y + b.h + 2}px;padding:5px 10px 5px 10px;background:rgba(11,10,18,.88);border-bottom:2px solid var(--pink);display:flex;gap:6px;align-items:center;font:700 12px 'Chakra Petch';letter-spacing:.2em;color:var(--pink)">STATUS ${icon('doom', 24, 'tag', 3)}</div>`;
    } else {
      const at = (id, ids) => iconRow(ids, { x: r[id].row.x + r[id].row.w - 4, y: r[id].row.y - 9, size: 16, shape: 'tag', align: 'right', gap: 2 });
      body += at('yuna', ['sleep']) + at('rikku', ['poison', 'silence']) + at('paine', ['curse', 'haste']);
      body += `<div class="row" style="left:218px;top:22px">${icon('doom', 17, 'tag', 3)}</div>`;
    }
  }
  if (opt >= 3) {
    if (!phone) {
      const t = m.tplate;
      body += `<span class="pill" style="left:${t.x + t.w + 10}px;top:${t.y + 10}px"><span>DOOM 3</span></span>`;
      body += `<div class="msg" style="left:${W / 2 - 220}px;top:112px;width:440px;justify-content:center">${icon('sleep', 24, 'tag')}Yuna fell asleep.</div>`;
      body += `<div class="card" style="left:53px;top:230px;width:350px"><h4>GUIDE <i>SLEEP</i></h4><b>Yuna is asleep:</b> her gauge is frozen and she cannot act. A hit, <b>Esuna</b> or a <b>Remedy</b> wakes her. Rikku is silenced: <b>Echo Screen</b> cures it.</div>`;
      body += `<div class="abs" style="left:${r.yuna.row.x + 72}px;top:${r.yuna.row.y + 46}px;font:700 12px 'Chakra Petch';letter-spacing:.16em;color:#ff8a98;text-shadow:0 1px 2px #000">ASLEEP</div>`;
    } else {
      body += `<span class="pill" style="left:132px;top:573px;font-size:10px;padding:1px 6px"><span>DOOM 3</span></span>`;
      body += `<div class="card" style="left:8px;top:648px;width:374px;--f:.74"><h4>GUIDE <i>SLEEP</i></h4><b>Yuna is asleep:</b> gauge frozen, no turns. A hit, Esuna or a Remedy wakes her.</div>`;
      body += `<div class="msg" style="left:40px;top:420px;width:310px;justify-content:center;--f:.7">${icon('sleep', 17, 'tag')}Yuna fell asleep.</div>`;
    }
  }
  return { tag, W, H, fx, body, font: phone ? 0.75 : 1 };
}

const outs = [];
for (const opt of [1, 2, 3]) {
  for (const [game, fn] of [['ffx', ffx], ['x2', x2]]) {
    for (const phone of [false, true]) {
      const s = fn(opt, phone);
      const name = `o${opt}-${game}-${phone ? 'phone' : 'desktop'}`;
      writeFileSync(join(HERE, `${name}.html`), page(s));
      outs.push(name);
    }
  }
}
console.log(outs.join('\n'));
