// Sin HUD mockups (FFX only). Builds one frame from ?id=<scene>&mode=desk|phone. The real HUD parts use the game's own
// class names and CSS (linked in hud.html); the mock-only parts are drawn in real pixels in .mk-over (mk.css).
// Every number on screen is either from research/ffx-sin.md (the 3+9+1 clock, the 13th turn as our estimate for S-1,
// the six-hit Gaze count, Gravija three-then-charge, Negation's removal list) or illustrative (party HP, the mouth stage
// for a turn), and the sheet says which. Art: our own plates and sprites only; the Fins are grey stand-in silhouettes.
const Q = new URLSearchParams(location.search);
const MODE = Q.get('mode') === 'phone' ? 'phone' : 'desk';
const PHONE = MODE === 'phone';
const ART = '../../../../../../public/art/';
const root = document.getElementById('root');
root.className = MODE;

const GG = 13; // Giga-Graviton turn: research/ffx-sin.md S-1, our estimate (the sources say 12 or 13)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rad = (d) => (d * Math.PI) / 180;

// ------------------------------------------------------------------ the party (illustrative HP, the D-264 preset's shape)
const P = {
  tidus: { k: 'tidus', n: 'Tidus', mp: 140, mmp: 140 },
  yuna: { k: 'yuna', n: 'Yuna', mp: 320, mmp: 320 },
  auron: { k: 'auron', n: 'Auron', mp: 100, mmp: 100 },
};
const partyRow = (i, p, hp, mx, od, acting, sts = 0) => {
  const st = sts ? `<span class="ffx-stat__statuses">${'<i></i>'.repeat(sts)}</span>` : '';
  return `<div class="ig-stat${acting ? ' ig-stat--acting' : ''}" style="margin-right:calc(var(--ig-stat-step) * ${i})">` +
    `<span class="ig-stat__face"><img src="${ART}portraits/${p.k}.png" alt="" style="object-position:50% 14%"></span>` +
    `<span class="ig-stat__name">${p.n}</span><span class="ig-stat__value">${hp}<small>/${mx}</small></span>` +
    `<span class="ig-stat__value ig-stat__value--mp">${p.mp}<small>/${p.mmp}</small></span>` +
    `<span class="ig-stat__od ffx-stat__od"><i style="width:${od}%"></i><em>OD</em></span>${st}</div>`;
};

// ------------------------------------------------------------------ the CTB list (the shipped .ig-ctb markup)
const sinFace = (stage) => `<span class="mk-foe" style="background-image:url(plates/sin-stage-${stage}.jpg);background-size:430% auto;background-position:63% 17%"></span>`;
const finFace = () => `<svg viewBox="0 0 40 40" style="position:absolute;inset:0;width:100%;height:100%"><rect width="40" height="40" fill="#2a0f12"/><path d="M40,8 C26,6 14,14 3,33 C14,35 27,29 40,26Z" fill="#a1a7b2"/><circle cx="14" cy="25" r="4.5" fill="#f3d36a"/></svg>`;
function ctbRow(i, r) {
  const face = r.foe === 'sin' ? sinFace(r.stage || 2) : r.foe === 'fin' ? finFace() : `<img src="${ART}portraits/${r.who}.png" alt="" style="object-position:50% 12%">`;
  const enemy = r.foe ? ' ig-ctb__tile--enemy' : '';
  const now = i === 0 ? ' ig-ctb__tile--now' : '';
  const tagText = r.tag || (r.chip && PHONE ? 'ORD' : '');
  const tag = tagText ? `<span class="ig-ctb__tag mk-turn${r.gg ? ' mk-turn--gg' : ''}">${esc(tagText)}</span>` : '';
  const charge = r.charge ? `<span class="ffx-ctb-charge" style="background:${r.charge === 2 ? '#e8412e' : '#f2a33a'}"></span>` : '';
  const chip = r.chip && !PHONE ? '<span class="ffx-airship-order__chip">ORDER</span>' : '';
  const ring = r.chip ? ';box-shadow:0 0 0 2px var(--ig-gold),0 0 14px rgba(227,185,74,.55)' : '';
  return `<div class="ig-ctb__row${r.gg ? ' mk-gg-row' : ''}" style="transform:translateX(calc(var(--ig-ctb-step) * ${i}))">${chip}<span class="ig-ctb__name">${esc(r.name)}</span><span class="ig-ctb__tile${enemy}${now}" style="${ring}">${face}${tag}${charge}</span></div>`;
}
const ctbHtml = (rows) => `<div class="ig-ctb">${rows.map((r, i) => ctbRow(i, r)).join('')}</div>`;

// ------------------------------------------------------------------ the command cascade (the shipped .ig-cmd markup)
const CURSOR = '<svg class="ig-cmd__cursor" viewBox="0 0 12 16"><path d="M1 1 L11 8 L1 15 Z" fill="#0B0A12"/></svg>';
function cmdRows(rows) {
  return rows.map((r, i) => {
    const cls = ['ig-cmd', r.sel ? 'ig-cmd--selected' : '', r.od ? 'ig-cmd--overdrive' : '', r.trig ? 'ffx-cmd--trigger' : '', r.off ? 'ig-cmd--disabled' : ''].filter(Boolean).join(' ');
    const sub = r.sub ? `<span class="ffx-cmd__badge ffx-cmd__badge--count">${esc(r.sub)}</span>` : '';
    const ready = r.tag ? `<span class="ig-cmd__ready">${esc(r.tag)}</span>` : '';
    return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${i})">${r.sel ? CURSOR : ''}<span class="ffx-cmd__label">${esc(r.t)}</span>${sub}${ready}</div>`;
  }).join('');
}
const cmdArea = (rows) => `<div class="ffx-cmd-area"><div class="ig-cmd-stack">${cmdRows(rows)}</div></div>`;

// ------------------------------------------------------------------ the real Trigger order widget (AirshipOrderWidget.ts#render, copied markup)
function orderWidget({ range = 'near', variant }) {
  const pull = `<div class="ig-cmd ffx-cmd--trigger ig-cmd--selected" style="margin-left:calc(var(--ig-cascade-step) * 0)"><span class="ffx-cmd--trigger__label">Pull back</span><span class="ffx-airship-order__tag">Trigger</span></div>`;
  const close = `<div class="ig-cmd ffx-cmd--trigger ig-cmd--disabled" style="margin-left:calc(var(--ig-cascade-step) * 1)"><span class="ffx-cmd--trigger__label">Close in</span><span class="ffx-airship-order__already">Already ${range}</span></div>`;
  const pips = (n) => Array.from({ length: 3 }, (_, i) => `<i class="${i < n ? 'ffx-airship-order__pip--live' : 'ffx-airship-order__pip--spent'}"></i>`).join('');
  let body;
  if (variant === 'pips') { // what an unpatched widget would show in a Fin fight: a missing flag reads as three volleys
    body = `<span class="ffx-airship-order__cost">Turn now &middot; Cid's next turn &middot; 1 volley</span><span class="ffx-airship-order__left"><span class="ffx-airship-order__pips">${pips(3)}</span>Volleys left 3</span>`;
  } else if (variant === 'plain') {
    body = `<span class="ffx-airship-order__cost">Turn now &middot; Cid's next turn</span>`;
  } else { // 'race'
    body = `<span class="ffx-airship-order__cost">Turn now &middot; Cid's next turn</span><span class="ffx-airship-order__race"><b>Cid moves before the Fin:</b> its Gravija whiffs</span>`;
  }
  return `<div class="ig-cmd-stack ffx-airship-order">${pull}${close}<div class="ffx-airship-order__slab"><span class="ffx-airship-order__slab-title">This order costs</span>${body}</div></div>`;
}

// ------------------------------------------------------------------ the Fin stand-in (grey silhouette, not art)
function finSvg({ charged, flip, label }) {
  const glow = charged
    ? `<circle cx="330" cy="300" r="150" fill="url(#core)"/><circle cx="330" cy="300" r="96" fill="none" stroke="#c99bff" stroke-width="5" opacity=".85"/><circle cx="330" cy="300" r="120" fill="none" stroke="#c99bff" stroke-width="2.5" opacity=".55"/>`
    : `<circle cx="330" cy="300" r="90" fill="url(#core)" opacity=".7"/>`;
  return `<svg viewBox="0 0 900 600" width="900" height="600">
    <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5abb6"/><stop offset=".5" stop-color="#5f6571"/><stop offset="1" stop-color="#23262e"/></linearGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7d6"/><stop offset=".3" stop-color="#e3b94a"/><stop offset=".65" stop-color="#8a5bd6" stop-opacity=".7"/><stop offset="1" stop-color="#8a5bd6" stop-opacity="0"/></radialGradient></defs>
    <g style="${flip ? 'transform:scaleX(-1);transform-origin:450px 0' : ''}">
    <path d="M900,30 C760,0 560,40 380,140 C230,225 110,340 30,490 C120,530 260,530 380,480 C500,430 640,380 780,372 C840,368 880,372 900,378 Z" fill="url(#fg)" stroke="#e9ebef" stroke-opacity=".55" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${880 - i * 30},${60 + i * 8} C${700 - i * 70},${70 + i * 40} ${520 - i * 70},${150 + i * 55} ${380 - i * 40},${250 + i * 55}" fill="none" stroke="#3a3f49" stroke-opacity=".5" stroke-width="6"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<polygon points="${140 + i * 95},${330 - i * 42} ${170 + i * 95},${262 - i * 42} ${200 + i * 95},${318 - i * 44}" fill="#5b616c" opacity=".75"/>`).join('')}
    ${glow}<circle cx="330" cy="300" r="38" fill="#fff4c9" stroke="#111" stroke-width="4"/></g>
  </svg>`;
}

// ------------------------------------------------------------------ world (plate + boss + party), desk and phone
function sprite(id, left, feet, h) {
  return `<img class="mk-sprite" src="${ART}characters/${id}/idle.png" alt="" style="left:${left}px;top:${feet - h}px;height:${h}px;position:absolute">`;
}
function world(s) {
  let w = '';
  if (s.plate === 'sin') {
    w += `<img class="mk-plate" src="plates/sin-stage-${s.stage}.jpg" alt="">`;
    w += `<div style="left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35))"></div>`;
    if (!PHONE) w += sprite('yuna', 680, 800, 280) + sprite('auron', 550, 866, 318) + sprite('tidus', 800, 836, 300);
  } else {
    w += `<img class="mk-plate" src="plates/evrae-deck.jpg" alt="" style="transform:scale(1.1);object-position:55% 62%">`;
    w += `<div style="inset:0;background:radial-gradient(70% 55% at 56% 34%,rgba(255,196,120,.18) 0%,rgba(0,0,0,0) 70%),linear-gradient(to bottom,rgba(10,8,16,.28) 0%,rgba(0,0,0,0) 40%,rgba(6,5,10,.55) 100%)"></div>`;
    w += `<div class="mk-fin" style="left:${s.finLeft ?? 640}px;top:${s.finTop ?? 40}px;width:${s.finW ?? 900}px;height:${(s.finW ?? 900) * 2 / 3}px">${finSvg({ charged: s.charged, flip: s.flip, label: s.finLabel || 'Left Fin' }).replace('width="900" height="600"', 'width="100%" height="100%"')}</div>`;
    if (!PHONE) w += `<div class="mk-fin__label" style="left:1000px;top:${s.finLabelTop ?? 606}px;width:540px;text-align:right">${esc(s.finLabel || 'Left Fin')} &middot; stand-in silhouette, not art</div>`;
    w += `<div class="mk-rail" style="top:662px"><i></i><i></i></div><div class="mk-deckfloor"></div>`;
    if (!PHONE) w += sprite('yuna', 570, 800, 300) + sprite('tidus', 710, 838, 322) + sprite('auron', 850, 808, 300);
  }
  return w;
}

// ------------------------------------------------------------------ overdrive Sin's clock parts
const gazeHtml = (hits = 4) => `<div class="mk-slab mk-gaze"><b>Gaze in ${6 - hits}</b>${[1, 1, 1, 1, 0, 0].map((x, i) => `<i class="${i < hits ? '' : 'off'}"></i>`).join('')}</div>`;
function ringSvg(size, n, opts = {}) {
  const cx = size / 2, R = size / 2 - 4, th = size * 0.15, r0 = R - th, left = Math.max(0, GG - n);
  let segs = '';
  for (let i = 1; i <= 13; i++) {
    const a0 = -90 + (i - 1) * (360 / 13) + 1.6, a1 = a0 + 360 / 13 - 3.2;
    const p = (a, r) => `${cx + r * Math.cos(rad(a))},${cx + r * Math.sin(rad(a))}`;
    const col = i <= 3 ? '#f4f1e8' : i <= 12 ? '#e3b94a' : '#e8412e';
    const op = i <= n ? 1 : i === 13 ? 0.6 : 0.26;
    const cls = i === 13 && n >= 12 ? 'alarm' : '';
    segs += `<path class="${cls}" d="M${p(a0, R)} A${R},${R} 0 0 1 ${p(a1, R)} L${p(a1, r0)} A${r0},${r0} 0 0 0 ${p(a0, r0)} Z" fill="${col}" opacity="${op}" ${i === n ? 'stroke="#fff" stroke-width="3"' : ''}/>`;
  }
  const numCol = left <= 1 ? '#ff6b57' : '#fff';
  const cap = opts.cap ? `<text class="cap" x="${cx}" y="${cx + size * 0.2}" text-anchor="middle">TURNS LEFT</text>` : '';
  return `<svg class="mk-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cx}" r="${r0 - 4}" fill="rgba(11,10,18,.84)"/>${segs}` +
    `<text x="${cx}" y="${cx + size * (opts.cap ? 0.09 : 0.14)}" text-anchor="middle" style="font-size:${size * (opts.cap ? 0.34 : 0.4)}px;fill:${numCol}">${left}</text>${cap}</svg>`;
}
function pipsHtml(n) {
  let h = '';
  for (let i = 1; i <= 13; i++) {
    const c = i <= 3 ? 'p3' : i <= 12 ? 'p9' : 'p1';
    h += `<i class="${c}${i <= n ? ' on' : ''}${i === n ? ' now' : ''}${i === 13 && n >= 12 ? ' alarm' : ''}"></i>`;
    if (i === 3 || i === 12) h += '<i class="gap"></i>';
  }
  return `<div class="mk-pips">${h}</div>`;
}
const STAGE_WORD = ['SHUT', 'OPEN 1', 'OPEN 2', 'OPEN 3', 'FULLY OPEN'];
const S1 = 'Giga-Graviton on Sin\'s 13th turn: <b style="color:#f2c26b">our estimate</b> (the sources say 12 or 13)';

// ------------------------------------------------------------------ the scenes
const SC = {};
const RED = '#e8412e';

// ---- M1: link 4 clock. n = Sin's turns taken; stage = the painting's mouth stage (round 3)
function m1(opt, n) {
  const stage = n >= 12 ? 4 : 2;
  const left = GG - n;
  const word = STAGE_WORD[stage];
  const rows = [
    { name: 'Auron', who: 'auron' }, { name: 'Tidus', who: 'tidus' },
    { name: 'Sin', foe: 'sin', stage }, { name: 'Yuna', who: 'yuna' }, { name: 'Auron', who: 'auron' },
    n >= 12 ? { name: 'Tidus', who: 'tidus' } : { name: 'Sin', foe: 'sin', stage },
  ];
  let extra = '', desk = '', phone = '';
  const tel = `<div class="ffx-telegraph ffx-telegraph--visible ffx-telegraph--stage-${n >= 12 ? 2 : 1}"><div class="ffx-telegraph__content"><div class="ffx-telegraph__actor">SIN</div><div class="ffx-telegraph__state">${n >= 12 ? 'Sin\'s mouth is fully open' : 'Sin\'s mouth opens wider'}</div></div></div>`;
  if (opt === 'a') {
    desk = `<div style="left:420px;top:30px">${ringSvg(190, n, { cap: true })}</div>` +
      `<div style="left:420px;top:230px;width:236px"><span class="mk-chip mk-chip--gold"><span>Mouth ${stage === 4 ? 'fully open' : 'open ' + stage + ' of 3'}</span></span><div class="mk-slab mk-est" style="margin-top:8px;padding:6px 10px">${S1}</div></div>` +
      `<div style="left:420px;top:352px">${gazeHtml()}</div>`;
    phone = `<div class="mk-slab" style="left:10px;right:10px;top:250px;height:96px;display:flex;align-items:center;gap:10px;padding:6px 10px">${ringSvg(84, n)}` +
      `<div><span class="mk-chip mk-chip--gold"><span>${stage === 4 ? 'Fully open' : 'Open ' + stage + ' of 3'}</span></span><div style="margin-top:4px;font:700 15px 'Chakra Petch';letter-spacing:.08em">GIGA-GRAVITON IN ${left}</div><div class="mk-est" style="margin-top:1px">13th turn: our estimate (12 or 13)</div></div></div>` +
      `<div style="left:10px;top:68px">${gazeHtml()}</div>`;
  } else if (opt === 'b') {
    rows[2] = { name: n >= 12 ? 'Giga-Graviton' : 'Sin', foe: 'sin', stage, tag: String(n + 1), gg: n >= 12 };
    if (n < 12) rows[5] = { name: 'Sin', foe: 'sin', stage, tag: String(n + 2) };
    desk = `<div style="left:420px;top:34px">${gazeHtml()}</div>` +
      `<div style="right:20px;top:528px;width:330px;text-align:right" class="mk-slab mk-est"><div style="padding:6px 10px">Sin's clock: 13, <b style="color:#f2c26b">our estimate</b> (the sources say 12 or 13). The 13th row shows once it is in the list.</div></div>`;
    phone = `<div class="mk-slab mk-est" style="left:10px;right:10px;top:250px;padding:5px 10px">Sin's turn numbers ride the rail. 13: <b style="color:#f2c26b">our estimate</b> (12 or 13)</div>` +
      `<div style="left:10px;top:68px">${gazeHtml()}</div>`;
  } else {
    desk = `<div class="mk-slab" style="left:410px;top:30px;padding:12px 18px 14px;border-left:5px solid #b02a2a"><div style="display:flex;align-items:center;gap:14px"><span class="mk-jaw">Sin</span><span class="mk-chip mk-chip--gold"><span>${word}</span></span><span class="mk-note" style="margin-left:6px;font-size:16px">Giga-Graviton in <b>${left}</b></span></div>` +
      `<div style="margin-top:10px">${pipsHtml(n)}</div><div class="mk-est" style="margin-top:8px;max-width:500px">${S1}</div></div>` +
      `<div style="left:410px;top:196px">${gazeHtml()}</div>`;
    phone = `<div class="mk-slab" style="left:10px;right:10px;top:250px;padding:6px 8px 8px;border-left:3px solid #b02a2a"><div style="display:flex;align-items:center;gap:8px"><span class="mk-jaw" style="font-size:26px">Sin</span><span class="mk-chip mk-chip--gold"><span>${word}</span></span><span class="mk-note" style="margin-left:auto">In <b>${left}</b></span></div>` +
      `<div style="margin-top:6px" class="mk-pips-fit">${pipsHtml(n)}</div><div class="mk-est" style="margin-top:4px">13th turn: our estimate (12 or 13)</div></div>` +
      `<div style="left:10px;top:68px">${gazeHtml()}</div>`;
  }
  return {
    plate: 'sin', stage, ctb: rows, acting: 'auron',
    party: [['tidus', 6492, 6492, 55], ['yuna', 5130, 5130, 30], ['auron', 6212, 6492, 80]],
    cmds: [{ t: 'Attack' }, { t: 'Skill', sel: 1, sub: 'Armor Break' }, { t: 'Special' }, { t: 'Items', sub: '×27' }, { t: 'Overdrive', od: 1 }],
    stageHtml: '', over: PHONE ? phone : desk,
    tip: 'Armor Break &rarr; Sin &middot; Gaze in 2',
    label: [`M1-${opt.toUpperCase()}`, { a: 'The mouth ring', b: 'Tagged turn order', c: 'The painted jaw with a pip strip' }[opt] + ` · Sin's turn ${n}`],
  };
}
for (const o of ['a', 'b', 'c']) { SC[`m1${o}-t8`] = () => m1(o, 8); SC[`m1${o}-t12`] = () => m1(o, 12); }

// ---- M2: what Negation took (the Left Fin's counter just fired; the party has lost its buffs)
function m2(opt) {
  const base = {
    plate: 'deck', charged: false, acting: 'tidus', guideName: 'Left Fin', guideMove: 'Armor Break',
    ctb: [{ name: 'Tidus', who: 'tidus' }, { name: 'Cid', who: 'cid' }, { name: 'Left Fin', foe: 'fin' }, { name: 'Yuna', who: 'yuna' }, { name: 'Auron', who: 'auron' }, { name: 'Left Fin', foe: 'fin' }],
    party: [['tidus', 4210, 6492, 62], ['yuna', 3120, 5130, 40], ['auron', 5340, 6492, 88]],
    cmds: [{ t: 'Attack' }, { t: 'Skill', sel: 1 }, { t: 'Special' }, { t: 'Items', sub: '×27' }, { t: 'Orders', trig: 1, tag: 'Trigger' }],
    tip: 'Haste and Protect are gone &middot; Negation also took the Fin\'s Armor Break',
  };
  if (opt === 'a') {
    base.over = PHONE
      ? `<div class="mk-neg" style="left:10px;right:10px;top:70px;padding:6px 10px 8px 14px"><div class="mk-neg__head">Negation</div><div class="mk-neg__line" style="font-size:15px"><em class="lost">Party lost</em>Haste, Protect, Shell</div><div class="mk-neg__line" style="font-size:15px"><em class="fin">Fin lost</em>Armor Break</div><div class="mk-neg__line" style="font-size:15px"><em class="cured">Cured</em>Poison</div></div>`
      : `<div class="mk-neg" style="left:420px;top:44px;width:610px"><div class="mk-neg__head">Negation</div><div class="mk-neg__line"><em class="lost">Party lost</em>Haste, Protect &times;2, Shell</div><div class="mk-neg__line"><em class="fin">Fin lost</em>Armor Break</div><div class="mk-neg__line"><em class="cured">Cured</em>Poison</div></div>`;
  } else {
    base.over = PHONE
      ? `<div class="mk-ghost mk-ghost--v" style="left:8px;width:118px;bottom:362px"><span>Haste</span><span>Protect</span></div><div class="mk-ghost mk-ghost--v" style="left:136px;width:118px;bottom:362px"><span>Protect</span><span>Shell</span><span class="cure">Poison</span></div><div class="mk-ghost mk-ghost--v" style="left:264px;width:118px;bottom:362px"><span>Haste</span></div><div class="mk-ghost mk-ghost--v" style="left:10px;top:68px;width:250px"><span>Fin: Armor Break</span></div>`
      : `<div class="mk-ghost mk-ghost--h" style="right:625px;top:665px"><span>Haste</span><span class="faded">Protect</span></div><div class="mk-ghost mk-ghost--h" style="right:625px;top:741px"><span>Protect</span><span>Shell</span><span class="cure">Poison</span></div><div class="mk-ghost mk-ghost--h" style="right:625px;top:821px"><span>Haste</span></div><div class="mk-ghost mk-ghost--v" style="left:1010px;top:300px;width:250px"><span>Fin: Armor Break</span></div>`;
  }
  base.label = [`M2-${opt.toUpperCase()}`, opt === 'a' ? 'A one-line banner (three lines here)' : 'Ghost chips at each row'];
  return base;
}
SC['m2a'] = () => m2('a'); SC['m2b'] = () => m2('b');

// ---- M3: the link strip in Chapter XVII (link 2 opening; statuses carried)
function m3(opt) {
  const base = {
    plate: 'deck', charged: false, acting: 'tidus', flip: true, finLabel: 'Right Fin', guideName: 'Right Fin', guideMove: 'Armor Break', finLeft: 560,
    ctb: [{ name: 'Tidus', who: 'tidus' }, { name: 'Cid', who: 'cid' }, { name: 'Right Fin', foe: 'fin' }, { name: 'Yuna', who: 'yuna' }, { name: 'Auron', who: 'auron' }, { name: 'Right Fin', foe: 'fin' }],
    party: [['tidus', 3860, 6492, 78, 2], ['yuna', 2790, 5130, 46, 1], ['auron', 5010, 6492, 100, 2]],
    cmds: [{ t: 'Attack' }, { t: 'Skill', sel: 1 }, { t: 'Special' }, { t: 'Items', sub: '×26' }, { t: 'Orders', trig: 1, tag: 'Trigger' }],
    tip: 'The Left Fin is down &middot; nothing was restored',
  };
  if (opt === 'a') {
    base.over = PHONE
      ? `<div style="left:10px;right:10px;top:70px"><div class="mk-strip" style="gap:5px"><span class="step done"><span>I Left Fin</span></span><span class="step on"><span>II Right</span></span><span class="step"><span>III Core</span></span></div><div class="mk-bracket" style="margin-top:4px"></div><div class="mk-bracket-cap" style="font-size:14px">One party state carries</div></div>`
      : `<div style="left:410px;top:52px;width:640px"><div class="mk-strip"><span class="step done"><span>I &middot; Left Fin</span></span><span class="step on"><span>II &middot; Right Fin</span></span><span class="step"><span>III &middot; Genais + Core</span></span></div><div class="mk-bracket" style="margin-top:6px"></div><div class="mk-bracket-cap">One party state &middot; HP &middot; MP &middot; status &middot; Overdrive carry</div></div>`;
  } else {
    base.over = PHONE
      ? `<div class="mk-plate-name" style="left:10px;top:76px"><small>Opening</small><b style="font-size:34px">Right Fin</b></div>`
      : `<div class="mk-plate-name" style="left:420px;top:60px"><small>The reveal plate (EnemyGroupDef.headline)</small><b>Right Fin</b></div>`;
  }
  base.label = [`M3-${opt.toUpperCase()}`, opt === 'a' ? 'Three pips with the carry bracket' : 'Nothing new: the reveal plate names the link'];
  return base;
}
SC['m3a'] = () => m3('a'); SC['m3b'] = () => m3('b');

// ---- M4: the Fin's charge and range read (link 1, NEAR, core charged; plus one FAR frame for option B)
function m4(opt, far) {
  const charged = !far;
  const base = {
    plate: 'deck', charged, acting: 'tidus', finLabel: 'Left Fin', guideName: 'Left Fin', guideMove: 'Pull back',
    finW: far ? 420 : 900, finLeft: far ? 1000 : 640, finTop: far ? 190 : 40, finLabelTop: far ? 400 : 606,
    ctb: [{ name: 'Tidus', who: 'tidus' }, { name: 'Cid', who: 'cid' }, { name: 'Left Fin', foe: 'fin', charge: charged ? 2 : 0 }, { name: 'Yuna', who: 'yuna' }, { name: 'Auron', who: 'auron' }, { name: 'Left Fin', foe: 'fin' }],
    party: [['tidus', 5980, 6492, 62], ['yuna', 4610, 5130, 40], ['auron', 6100, 6492, 88]],
    cmds: [{ t: 'Attack' }, { t: 'Skill' }, { t: 'Special' }, { t: 'Items', sub: '×27' }, { t: 'Orders', sel: 1, trig: 1, tag: 'Trigger' }],
    edge: charged, tip: charged ? 'Pull back &rarr; Tidus &middot; the core is charged' : 'The core stays quiet at range',
  };
  const plate = (w) => `<div class="mk-fplate" style="${w}"><div class="mk-fplate__top"><span class="mk-fplate__name">Left Fin</span><span class="mk-range mk-range--${far ? 'far' : 'near'}">${far ? 'FAR' : 'NEAR'}</span></div>` +
    (charged ? `<div class="mk-charge"><i></i><span class="lg">Core charged &middot; Gravija on its next turn</span><span class="sm">Core charged &middot; Gravija next</span></div>` : `<div class="mk-calm">The core does not charge at range</div>`);
  const counts = `<div class="mk-counts"><span>Targeted</span><span class="meter">${[1, 1, 0, 0, 0, 0, 0].map((x) => `<i class="${x ? 'on' : ''}"></i>`).join('')}</span><span>Regular acts</span><span class="meter">${[1, 1, 1].map(() => '<i class="hot"></i>').join('')}</span></div>`;
  if (opt === 'a') base.over = '';
  else if (opt === 'b') base.over = PHONE ? plate('left:10px;top:70px;right:10px') + '</div>' : plate('left:820px;top:56px;width:470px') + '</div>';
  else base.over = PHONE ? plate('left:10px;top:70px;right:10px') + counts + '</div>' : plate('left:820px;top:56px;width:470px') + counts + '</div>';
  base.label = [`M4-${opt.toUpperCase()}${far ? ' FAR' : ''}`, { a: 'The shipped surfaces only', b: 'A Fin plate: range and charge', c: 'A Fin plate that also shows its counters' }[opt]];
  return base;
}
for (const o of ['a', 'b', 'c']) SC[`m4${o}`] = () => m4(o, false);
SC['m4b-far'] = () => m4('b', true);

// ---- M5: the Trigger order widget in a Fin fight
function m5(variant) {
  return {
    plate: 'deck', charged: true, acting: 'tidus', finLabel: 'Left Fin', guideName: 'Left Fin', guideMove: 'Pull back',
    ctb: [{ name: 'Tidus', who: 'tidus' }, { name: 'Cid', who: 'cid', chip: 1 }, { name: 'Left Fin', foe: 'fin', charge: 2 }, { name: 'Yuna', who: 'yuna' }, { name: 'Auron', who: 'auron' }, { name: 'Left Fin', foe: 'fin' }],
    party: [['tidus', 5980, 6492, 62], ['yuna', 4610, 5130, 40], ['auron', 6100, 6492, 88]],
    widget: orderWidget({ range: 'near', variant }), over: '', edge: true,
    tip: 'Pull back &rarr; Tidus',
    label: [`M5-${{ pips: 'BEFORE', plain: 'A', race: 'B' }[variant]}`, { pips: 'What the shipped widget would show in a Fin fight (three volley pips)', plain: 'The pips and the volley go: cost line only', race: 'The pips go, and a race line says who moves first' }[variant]],
  };
}
SC['m5-before'] = () => m5('pips'); SC['m5a'] = () => m5('plain'); SC['m5b'] = () => m5('race');

// ------------------------------------------------------------------ assemble
function build(s) {
  const scale = PHONE ? 520 / 900 : 1;
  const x0 = PHONE ? (s.plate === 'sin' ? 640 : 560) : 0;
  const worldHtml = `<div class="mk-world" style="transform:${PHONE ? `translate(${-x0 * scale}px,0) ` : ''}scale(${scale})">${world(s)}</div>`;
  let phoneSprites = '';
  if (PHONE) {
    const h = 148, feet = 494;
    phoneSprites = [['auron', 6], ['yuna', 62], ['tidus', 122]].map(([id, x]) => `<img class="mk-sprite" src="${ART}characters/${id}/idle.png" alt="" style="position:absolute;left:${x}px;top:${feet - h}px;height:${h}px">`).join('');
    if (s.plate !== 'sin') phoneSprites = [['yuna', 6], ['tidus', 62], ['auron', 128]].map(([id, x]) => `<img class="mk-sprite" src="${ART}characters/${id}/idle.png" alt="" style="position:absolute;left:${x}px;top:${feet - h}px;height:${h}px">`).join('');
  }
  const game = PHONE ? `<div id="game">${worldHtml}${phoneSprites}</div><div class="phud-panel"></div><div class="phud-shade"></div>` : worldHtml;
  const acting = s.acting;
  const stat = s.party.map(([k, hp, mx, od, sts], i) => partyRow(i, P[k], hp, mx, od, k === acting, sts || 0)).join('');
  const stage =
    `<div class="ffxhud"><div class="ffxhud__stage" style="${PHONE ? '' : 'transform:scale(2.5)'}">` +
    `${ctbHtml(s.ctb)}<div class="ig-stat-list">${stat}</div>${s.widget ? `<div class="ffx-cmd-area">${s.widget}</div>` : s.cmds ? cmdArea(s.cmds) : ''}${s.stageHtml || ''}</div></div>`;
  const [code, title] = s.label;
  const guide = PHONE ? '' : `<div class="mk-guide"><div class="mk-guide__tog"><b>G</b> HIDE GUIDE</div><div class="mk-guide__card"><i>${esc(s.guideName || 'Sin')}</i><span class="mk-chip mk-chip--gold"><span>Next</span></span><small>${esc((s.acting || 'auron').toUpperCase())}</small><b>${esc(s.guideMove || 'Armor Break')} &rarr; ${esc(s.guideName || 'Sin')}</b><em>&#9662; MORE</em></div><div class="mk-guide__lab">The shipped guide rail (stand-in): the new slabs sit beside it</div></div>`;
  const tag = `<div class="mk-tag"><b>${esc(code)}</b><span>${esc(title)}</span><em>Mockup &middot; nothing built &middot; our own plate</em></div>`;
  const tip = PHONE ? `<div class="mk-tip"><b>Tip</b><span>${s.tip}</span></div>` : '';
  root.classList.add('ig');
  root.innerHTML = `${game}${s.edge ? '<div class="mk-edge"></div>' : ''}${stage}${tip}<div class="mk-over">${guide}${s.over || ''}</div>${tag}`;
}
const scene = SC[Q.get('id')];
if (!scene) { root.textContent = 'unknown scene: ' + Q.get('id') + ' (known: ' + Object.keys(SC).join(', ') + ')'; }
else build(scene());
window.SCENE_IDS = Object.keys(SC);
