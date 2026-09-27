// The three HUD options, as HTML strings over the placeholder scene.
// Values on the party rows are PLACEHOLDERS (unsourced, our recollection);
// see README "Sources". Hint line: GameFAQs boss guides and the FF wiki both
// describe Cloud's in-battle advice to attack while the tail is up.
const P = [
  { n: 'Cloud', hp: [281, 314], mp: [54, 54], lim: 0.42, atb: 1, act: true, mono: 'CL' },
  { n: 'Barret', hp: [376, 446], mp: [18, 18], lim: 0.3, atb: 0.55, act: false, mono: 'BA' },
];
const CMDS = ['Attack', 'Magic', 'Item'];
const SEL = 1; // cursor on Magic (the boss is weak to lightning)
const HINT = 'Attack while its tail’s up!';
const bar = (cls, f) => `<i class="${cls}"><b style="width:${Math.round(f * 100)}%"></b></i>`;
const tag = (t) => `<div class="tag"><span class="long">${t}</span><span class="short">${t.split(' · ')[0]} · PLACEHOLDER VALUES</span></div>`;
const PH = 'PARTY VALUES ARE PLACEHOLDERS';

// ---------- A: FF7's blue windows and layout, redrawn ----------
function hudA(phone) {
  const rows = P.map((p) => `<div class="a-row${p.act ? ' act' : ''}">
    <span class="a-name">${p.n}</span>
    <span class="a-num">${p.hp[0]}<small>/</small>${p.hp[1]}${bar('a-thin hp', p.hp[0] / p.hp[1])}</span>
    <span class="a-num mp">${p.mp[0]}<small>/</small>${p.mp[1]}${bar('a-thin mpb', p.mp[0] / p.mp[1])}</span>
    <span class="a-bars"><em>LIMIT</em>${bar('a-bar lim', p.lim)}<em>TIME</em>${bar('a-bar atb' + (p.atb >= 1 ? ' full' : ''), p.atb)}</span>
  </div>`).join('');
  const cmds = CMDS.map((c, i) => `<div class="a-cmd${i === SEL ? ' sel' : ''}">${i === SEL ? '<span class="ptr"></span>' : ''}${c}</div>`).join('');
  return `<div class="hud A ${phone ? 'ph' : 'dk'}">
    <div class="win a-msg"><span class="who">Cloud</span> ${HINT}</div>
    <div class="win a-enemy"><div class="a-ename">Guard Scorpion</div></div>
    <div class="win a-cmds">${cmds}</div>
    <div class="win a-party"><div class="a-head"><span>NAME</span><span>HP</span><span>MP</span><span>LIMIT &nbsp;/&nbsp; TIME</span></div>${rows}</div>
    ${tag('A · FF7 CLASSIC, REDRAWN · ' + PH)}
  </div>`;
}

// ---------- B: Ink & Gold with a mako-green skin ----------
function hudB(phone) {
  const rows = P.map((p, i) => `<div class="b-row${p.act ? ' act' : ''}" style="--i:${i}">
    <div class="b-por">${p.mono}<small>PORTRAIT</small></div>
    <div class="b-name">${p.n}</div>
    <div class="b-vals"><span class="hpv">${p.hp[0]}<small>/${p.hp[1]}</small></span><span class="mpv">${p.mp[0]}<small>/${p.mp[1]}</small></span></div>
    <div class="b-bars"><em>LIMIT</em>${bar('b-bar lim', p.lim)}<em>ATB</em>${bar('b-bar atb' + (p.atb >= 1 ? ' full' : ''), p.atb)}</div>
  </div>`).join('');
  const cmds = CMDS.map((c, i) => `<div class="b-cmd${i === SEL ? ' sel' : ''}" style="--i:${i}"><span>${i === SEL ? '<i class="tri"></i>' : ''}${c.toUpperCase()}</span></div>`).join('');
  const br = phone ? { x: 6, y: 100, w: 250, h: 275 } : { x: 490, y: 110, w: 480, h: 520 };
  return `<div class="hud B ${phone ? 'ph' : 'dk'}">
    <div class="shade"></div>
    <div class="bracket" style="left:${br.x}px;top:${br.y}px;width:${br.w}px;height:${br.h}px"><i></i><i></i><i></i><i></i>
      <div class="b-plate"><span>Guard Scorpion</span></div></div>
    <div class="b-banner"><span><b>Tail raised</b><i>GUARD SCORPION</i></span></div>
    <div class="b-hint"><span><em>CLOUD</em>“${HINT}”</span></div>
    <div class="b-cmds">${cmds}</div>
    <div class="b-party">${rows}</div>
    ${tag('B · INK &amp; GOLD, MAKO SKIN · ' + PH)}
  </div>`;
}

// ---------- C: FF7's layout and window shapes, Ink & Gold type and materials ----------
function hudC(phone) {
  const rows = P.map((p) => `<div class="c-row${p.act ? ' act' : ''}">
    <span class="c-name">${p.n}</span>
    <span class="c-num">${p.hp[0]}<small>/${p.hp[1]}</small>${bar('c-thin hp', p.hp[0] / p.hp[1])}</span>
    <span class="c-num mp">${p.mp[0]}<small>/${p.mp[1]}</small>${bar('c-thin mpb', p.mp[0] / p.mp[1])}</span>
    <span class="c-bars"><em>LIMIT</em>${bar('c-bar lim', p.lim)}<em>TIME</em>${bar('c-bar atb' + (p.atb >= 1 ? ' full' : ''), p.atb)}</span>
  </div>`).join('');
  const cmds = CMDS.map((c, i) => `<div class="c-cmd${i === SEL ? ' sel' : ''}">${c.toUpperCase()}</div>`).join('');
  return `<div class="hud C ${phone ? 'ph' : 'dk'}">
    <div class="shade"></div>
    <div class="cw c-msg"><em>CLOUD</em><span>${HINT}</span><b class="c-state">TAIL RAISED</b></div>
    <div class="cw c-enemy"><em>ENEMY</em><div class="c-ename">Guard Scorpion</div></div>
    <div class="cw c-cmds">${cmds}</div>
    <div class="cw c-party"><div class="c-head"><span>NAME</span><span>HP</span><span>MP</span><span>LIMIT &nbsp;/&nbsp; TIME</span></div>${rows}</div>
    ${tag('C · FF7 LAYOUT, INK &amp; GOLD MATERIALS · ' + PH)}
  </div>`;
}

const DESK_VB = '0 0 1600 900';
const PHONE_VB = '520 20 680 900';
function build() {
  const root = document.getElementById('root');
  for (const [id, fn] of [['a', hudA], ['b', hudB], ['c', hudC]]) {
    for (const phone of [false, true]) {
      const s = document.createElement('section');
      s.id = `${id}-${phone ? 390 : 1600}`;
      s.className = phone ? 'phone' : 'desk';
      s.innerHTML = `<div class="stage">${scene(phone ? PHONE_VB : DESK_VB, phone)}</div>${fn(phone)}`;
      root.appendChild(s);
    }
  }
}
