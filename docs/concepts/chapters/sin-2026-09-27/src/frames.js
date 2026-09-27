// Rough layout frames for the Sin chapter concepts (FFX only). Greybox shapes over our own
// painted deck backdrop and our own party sprites. No retail image is used anywhere.
// Built by render.mjs: page.html#frame-A | #frame-B | #frame-C.
const ART = '../../../../../public/art/';

function el(tag, css, html, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  if (html != null) e.innerHTML = html;
  return e;
}
function frameRoot() {
  const f = el('div', '', '', ''); f.id = 'frame'; document.body.appendChild(f); return f;
}
function img(f, src, css, cls) { const i = el('img', css, null, cls); i.src = src; f.appendChild(i); return i; }
function add(f, css, html, cls) { const e = el('div', css, html, cls); f.appendChild(e); return e; }
function svg(f, body) { add(f, '', `<svg class="svg" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">${body}</svg>`); }
function num(f, n, x, y) { add(f, `left:${x}px;top:${y}px`, String(n), 'num'); }
function note(f, x, y, html, w) { add(f, `left:${x}px;top:${y}px;${w ? 'max-width:' + w + 'px' : ''}`, html, 'note'); }
function rough(f, concept) {
  add(f, '', `Rough layout · Concept ${concept} · <b>greybox, not art · nothing built</b>`, 'rough');
}
function party(f, names) {
  const xs = [40, 215, 385];
  names.forEach((n, i) => img(f, `${ART}characters/${n}/idle.png`, `left:${xs[i]}px`, 'sprite'));
}
function panel(f, rows) {
  rows.forEach((r, i) => add(f, `top:${645 + i * 78}px;right:${70 + i * 12}px`,
    `<span class="n">${r[0]}</span><span class="hp">${r[1]}<small>/${r[2]}</small></span>` +
    `<span class="mp">${r[3]}</span>${r[4] ? `<span class="tagc">${r[4]}</span>` : ''}`, 'pp'));
}
function forecast(f, rows, top) {
  rows.forEach((r, i) => {
    const [label, kind, extra] = r;
    const pic = kind === 'foe' ? `<div class="foe">${extra.face}</div>` : `<img class="pic" src="${ART}portraits/${kind}.png">`;
    const badge = kind === 'foe' && extra.badge ? `<span class="${extra.cls || 'warn'}">${extra.badge}</span>` : '';
    add(f, `top:${top + i * 64}px`, `${badge}<span class="lbl">${label}</span>${pic}`, 'fc' + (i === 0 ? ' now' : ''));
  });
}
function deck(f) {
  // Greybox deck floor and rail, in the Evrae build's arrangement.
  svg(f, `
    <polygon points="0,640 1600,610 1600,900 0,900" fill="#2b2e35" opacity=".92"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${i * 230}" y1="${640 - i * 4}" x2="${i * 330 - 300}" y2="900" stroke="#3b3f47" stroke-width="2"/>`).join('')}
    <rect x="0" y="520" width="1600" height="7" fill="#15171b"/>
    <rect x="0" y="585" width="1600" height="5" fill="#15171b"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${20 + i * 260}" y="520" width="9" height="120" fill="#15171b"/>`).join('')}`);
}

// ---------------- Concept A: the whole assault, one chapter, four links ----------------
function frameA() {
  const f = frameRoot();
  img(f, `${ART}backdrops/evrae-airship-deck.png`, 'filter:saturate(.55) brightness(.8)', 'bg');
  svg(f, `
    <defs><radialGradient id="core" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff7d6"/><stop offset=".35" stop-color="#e3b94a"/><stop offset=".7" stop-color="#8a5bd6" stop-opacity=".7"/><stop offset="1" stop-color="#8a5bd6" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="1700" cy="-60" rx="760" ry="470" fill="#50555e" stroke="#ddd" stroke-dasharray="10 8" stroke-width="2"/>
    <text x="1090" y="150" class="gb" style="fill:#f4f1e8">Sin's flank · continues off-frame</text>
    <path d="M1600,250 C1380,260 1150,330 960,420 C820,490 700,540 610,575 C700,610 860,610 1010,585 C1180,560 1400,560 1600,560 Z" fill="#9ba1ab" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    <path d="M1600,330 C1400,350 1180,420 1020,500" fill="none" stroke="#6d727b" stroke-width="5"/>
    <path d="M1600,450 C1420,460 1230,500 1080,545" fill="none" stroke="#6d727b" stroke-width="5"/>
    <circle cx="1060" cy="470" r="120" fill="url(#core)"/>
    <circle cx="1060" cy="470" r="40" fill="#fff4c9" stroke="#111" stroke-width="3"/>
    <text x="1130" y="508" class="gb">Left Fin (greybox) · Sin's left arm</text>`);
  deck(f);
  party(f, ['auron', 'tidus', 'wakka']);
  rough(f, 'A');
  // four-link strip
  add(f, 'left:20px;top:50px;display:flex;gap:8px;align-items:center',
    '<span class="chip on">I · Left Fin</span><span class="chip">II · Right Fin</span><span class="chip">III · Genais + Core</span>' +
    '<span class="chip rest">Save · re-equip</span><span class="chip">IV · Overdrive Sin</span>');
  add(f, 'left:20px;top:92px;width:600px;height:14px;border:3px solid #e3b94a;border-top:0');
  add(f, 'left:90px;top:110px', 'one party state: HP · MP · status · Overdrive carry', 'tag');
  forecast(f, [
    ['Tidus', 'tidus'],
    ['Cid', 'cid'],
    ['Left Fin', 'foe', { face: 'FIN', badge: 'GRAVIJA' }],
    ['Auron', 'auron'],
    ['Wakka', 'wakka'],
  ], 150);
  add(f, 'top:720px', '<span>PULL BACK<small>Cid moves before<br>the Fin: Gravija whiffs</small></span>', 'cmd');
  add(f, 'top:800px', '<span>CLOSE IN<small>already near</small></span>', 'cmd off');
  panel(f, [['Auron', 4400, 4400, 110], ['Tidus', 3020, 3410, 150, 'HASTE'], ['Wakka', 3520, 3520, 140, 'CARRIES ON']]);
  num(f, 1, 30, 104); num(f, 2, 1000, 520); num(f, 3, 1150, 272); num(f, 4, 486, 726); num(f, 5, 990, 648);
  note(f, 830, 250, '<em>Core gathers energy</em> · the telegraph: Gravija on the Fin\'s next turn', 300);
}

// ---------------- Concept B: the countdown, Overdrive Sin alone ----------------
function frameB() {
  const f = frameRoot();
  img(f, `${ART}backdrops/evrae-airship-deck.png`, 'filter:sepia(.7) saturate(1.5) hue-rotate(-25deg) brightness(.55)', 'bg');
  add(f, 'inset:0;background:linear-gradient(180deg,rgba(60,20,70,.55),rgba(210,110,50,.35) 70%,rgba(20,10,20,.6))');
  const segs = [];
  for (let i = 0; i < 13; i++) {
    const a0 = -90 + i * (360 / 13) + 1.5, a1 = a0 + 360 / 13 - 3;
    const r = 78, cx = 800, cy = 118, rad = (d) => d * Math.PI / 180;
    const p = (a, rr) => `${cx + rr * Math.cos(rad(a))},${cy + rr * Math.sin(rad(a))}`;
    const col = i < 3 ? '#7fc6e8' : i < 12 ? '#e3b94a' : '#b02a2a';
    const op = i < 6 ? 1 : i === 6 ? 1 : 0.28;
    segs.push(`<path d="M${p(a0, r)} A${r},${r} 0 0 1 ${p(a1, r)} L${p(a1, r - 22)} A${r - 22},${r - 22} 0 0 0 ${p(a0, r - 22)} Z" fill="${col}" opacity="${op}" ${i === 6 ? 'stroke="#fff" stroke-width="3"' : ''}/>`);
  }
  svg(f, `
    <defs><radialGradient id="maw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6e7ff"/><stop offset=".4" stop-color="#9a6bff"/><stop offset="1" stop-color="#1a0b2a"/></radialGradient></defs>
    <g fill="#2a2330" opacity=".95">
      <rect x="0" y="700" width="1600" height="200"/>
      ${[[60, 560, 70], [180, 600, 50], [320, 520, 60], [470, 610, 45], [1330, 590, 55], [1470, 540, 70]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${900 - y}"/><polygon points="${x},${y} ${x + w / 2},${y - 70} ${x + w},${y}"/>`).join('')}
    </g>
    <rect x="1060" y="540" width="120" height="360" fill="#3a3340" stroke="#ccc" stroke-dasharray="8 6" stroke-width="2"/>
    <text x="1170" y="860" class="gb" style="fill:#ddd">Bevelle tower</text>
    <path d="M960,300 L640,40 L700,170 L560,160 L660,250 L520,260 L900,380 Z" fill="#6d727b" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    <path d="M1300,290 L1560,20 L1600,20 L1600,120 L1520,160 L1600,190 L1600,260 L1400,380 Z" fill="#6d727b" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    <path d="M850,360 L960,190 L1110,140 L1260,180 L1380,330 L1350,500 L1240,560 L960,560 L870,500 Z" fill="#a3a9b3" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    <path d="M905,310 L1110,275 L1330,300" fill="none" stroke="#5a5f68" stroke-width="10"/>
    <path d="M960,190 L1110,240 L1260,180" fill="none" stroke="#7a808a" stroke-width="6"/>
    <ellipse cx="1010" cy="335" rx="30" ry="8" fill="#f3d36a"/><ellipse cx="1225" cy="332" rx="30" ry="8" fill="#f3d36a"/>
    <path d="M905,405 L1335,400 L1290,488 L955,492 Z" fill="url(#maw)" stroke="#111" stroke-width="4"/>
    ${[0,1,2,3,4,5,6,7,8].map((i)=>`<polygon points="${930+i*45},403 ${952+i*45},403 ${941+i*45},426" fill="#e8e4da"/>`).join('')}
    <text x="1115" y="225" text-anchor="middle" class="gb">Overdrive Sin (greybox)</text><text x="1115" y="250" text-anchor="middle" class="gbs">mouth stage 2 of 3 · the mouth is the clock</text>
    
    ${segs.join('')}
    <text x="800" y="128" text-anchor="middle" style="font:700 54px Raj;fill:#fff">6</text>
    <text x="800" y="152" text-anchor="middle" style="font:700 13px Chakra;fill:#fff;letter-spacing:.12em">SIN TURNS</text>`);
  deck(f);
  party(f, ['lulu', 'auron', 'wakka']);
  rough(f, 'B');
  add(f, 'left:895px;top:52px', 'Giga-Graviton → Game Over', 'tag');
  add(f, 'left:895px;top:92px;background:rgba(11,10,18,.8);color:#ddd;font:500 16px Chakra;padding:5px 10px', 'Auto-Life and aeons cannot stop it · turn 13 = our estimate (S-1: 12 or 13)');
  add(f, 'left:455px;top:52px;text-align:right;line-height:1.5', '<span class="tag" style="background:#7fc6e8;color:#0b0a12">1–3 pulls</span><br><span class="tag" style="background:#e3b94a;color:#0b0a12">4–12 in reach</span><br><span class="tag" style="background:#b02a2a">13 the end</span>');
  add(f, 'left:880px;top:590px;display:flex;gap:6px;align-items:center',
    '<span class="tag">Gaze in 2 hits</span>' + [1, 1, 1, 1, 0, 0].map((x) => `<span style="width:22px;height:22px;display:inline-block;transform:rotate(45deg);background:${x ? '#b02a2a' : 'rgba(255,255,255,.25)'};border:2px solid #fff"></span>`).join(''));
  forecast(f, [
    ['Wakka', 'wakka'],
    ['Lulu', 'lulu'],
    ['Sin', 'foe', { face: 'SIN', badge: 'TURN 8', cls: 'clk' }],
    ['Auron', 'auron'],
    ['Wakka', 'wakka'],
    ['Sin', 'foe', { face: 'SIN', badge: 'TURN 9', cls: 'clk' }],
  ], 200);
  add(f, 'top:720px', '<span>ARMOR BREAK<small>in reach since<br>turn 4</small></span>', 'cmd');
  add(f, 'top:800px', '<span>OVERDRIVE<small>save it for<br>the last turns</small></span>', 'cmd off');
  panel(f, [['Wakka', 5810, 6492, 110, 'HASTE'], ['Lulu', 5700, 5700, 300, 'STONEPROOF'], ['Auron', 6100, 6492, 100, 'HASTE']]);
  num(f, 1, 690, 30); num(f, 2, 1345, 420); num(f, 3, 830, 588); num(f, 4, 1310, 332); num(f, 5, 1470, 792);
}

// ---------------- Concept C: two chapters; frame shows link 3 on Sin's back ----------------
function frameC() {
  const f = frameRoot();
  img(f, `${ART}backdrops/evrae-airship-deck.png`, 'object-position:0% 0%;transform:scale(1.7);transform-origin:0 0;filter:saturate(.5) brightness(.85)', 'bg');
  svg(f, `
    <defs><radialGradient id="core2" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff7d6"/><stop offset=".3" stop-color="#e3b94a"/><stop offset=".65" stop-color="#8a5bd6" stop-opacity=".75"/><stop offset="1" stop-color="#8a5bd6" stop-opacity="0"/></radialGradient></defs>
    <path d="M0,560 C300,500 700,470 1000,480 C1250,490 1450,520 1600,560 L1600,900 L0,900 Z" fill="#5c6068" stroke="#ddd" stroke-dasharray="10 8" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M0,${610 + i * 60} C400,${560 + i * 62} 1100,${550 + i * 62} 1600,${610 + i * 60}" fill="none" stroke="#474a51" stroke-width="6"/>`).join('')}
    <text x="40" y="880" class="gb" style="fill:#ddd">Sin's back (greybox)</text>
    <circle cx="1080" cy="290" r="190" fill="url(#core2)"/>
    <circle cx="1080" cy="290" r="95" fill="#9ba1ab" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    <circle cx="1080" cy="290" r="42" fill="#fff4c9" stroke="#111" stroke-width="3"/>
    <text x="960" y="430" class="gb" style="fill:#f4f1e8">Sin's Core · charging</text>
    <path d="M780,560 C780,440 1060,420 1080,560 Z" fill="#a9afb8" stroke="#eee" stroke-dasharray="10 8" stroke-width="2"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${800 + i * 70},560 C${810 + i * 70},480 ${850 + i * 70},465 ${870 + i * 70},470" fill="none" stroke="#6d727b" stroke-width="5"/>`).join('')}
    <text x="760" y="600" class="gb" style="fill:#f4f1e8">Sinspawn Genais · in its shell</text>
    <path d="M175,410 C400,250 800,240 985,285" fill="none" stroke="#7fc6e8" stroke-width="4" stroke-dasharray="14 10"/>
    <path d="M985,285 C950,360 930,420 925,470" fill="none" stroke="#7fc6e8" stroke-width="4" stroke-dasharray="4 8"/>
    <text x="560" y="262" class="gbs" style="fill:#fff;font-size:18px">Lulu's spell at the Core → "Magic absorbed."</text>`);
  party(f, ['lulu', 'kimahri', 'tidus']);
  rough(f, 'C');
  // two chapter cards
  const card = (x, k, t, s) => add(f, `left:${x}px;top:52px;width:300px;height:130px;background:#f4f1e8;color:#0b0a12;padding:12px 16px;border-top:6px solid #e3b94a`,
    `<div style="font:700 14px Chakra;letter-spacing:.16em;color:#a67c16">CHAPTER · ${k}</div><div style="font:700 30px/1.05 Corm;margin-top:4px">${t}</div><div style="font:italic 500 18px/1.15 Corm;margin-top:6px">${s}</div>`);
  card(20, '1 OF 2', 'Sin: the Fins and the Core', 'Links 1–3, one party state');
  card(335, '2 OF 2', 'Sin: the Face', 'Prep on the deck, then the race');
  add(f, 'left:20px;top:188px;border:3px solid #e3b94a;border-top:0;width:300px;height:12px');
  add(f, 'left:30px;top:206px', 'you are here · titles are working titles', 'tag');
  forecast(f, [
    ['Kimahri', 'kimahri'],
    ['Core', 'foe', { face: 'CORE', badge: 'GRAVIJA' }],
    ['Genais', 'foe', { face: 'GEN', badge: 'SIGH' }],
    ['Tidus', 'tidus'],
    ['Lulu', 'lulu'],
  ], 150);
  panel(f, [['Lulu', 1620, 2530, 300, 'CARRIED'], ['Kimahri', 2840, 3300, 160], ['Tidus', 2210, 3410, 170, 'POISON']]);
  num(f, 1, 650, 120); num(f, 2, 1170, 120); num(f, 3, 860, 610); num(f, 4, 500, 330); num(f, 5, 990, 652);
}

window.buildFrame = (id) => ({ A: frameA, B: frameB, C: frameC })[id]();
