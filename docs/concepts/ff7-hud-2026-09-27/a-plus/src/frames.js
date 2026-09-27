// The five moments of the brief (+ 3b the help variant, 5b the Limit window) and the build of
// every section. Party max HP / MP: the research preset (research/ff7-guard-scorpion.md §8.4,
// [derived]: Cloud 316 / 57, Barret 317 / 43). Current HP values are PLACEHOLDERS chosen to tell
// one consistent story; the Tail Laser damage (74 / 73) sits inside the derived range 72 to 77
// (same file §9), and the Limit fill after it follows §9. Hint line: the game's own text (same
// file §7.1), game spelling kept.
const C = (hp, lim, time, extra = {}) => ({ n: 'Cloud', hp, max: 316, mp: 57, mpMax: 57, lim, time, ...extra });
const B = (hp, lim, time, extra = {}) => ({ n: 'Barret', hp, max: 317, mp: 43, mpMax: 43, lim, time, ...extra });
const SLOTS = ['Attack', 'Magic', '', 'Item'];
const FRAMES = [
  { id: 'f1', msg: '“Attack while it\'s tail\'s up!',
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: SLOTS, cur: 0 }, marks: { ready: true } },
  { id: 'f2', msg: null, est: 'MAGIC LIST LAYOUT AND MP WINDOW: OUR ESTIMATE',
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], magic: { spells: ['Ice', 'Bolt'], cur: 1, mp: [4, 57] }, marks: { ready: true } },
  { id: 'f3', msg: null, // top window empty: FF7 shows a monster's name on SELECT (manual), not by default
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: SLOTS, cur: null }, marks: { ready: true, target: [500, 486] } },
  { id: 'f3b', msg: 'Guard Scorpion', desktopOnly: true, est: 'VARIANT: NAME SHOWN AS THE SELECT HELP (OUR ESTIMATE)',
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: SLOTS, cur: null }, marks: { ready: true, target: [500, 486] } },
  { id: 'f4', msg: 'Tail Laser',
    party: [C(205, 1, 0.08, { limState: 'limitPeach' }), B(77, 0.96, 0.7)],
    marks: { laser: true, damage: [[990, 528, '74'], [1112, 528, '73']] } },
  { id: 'f5', msg: null,
    party: [C(205, 1, 1, { limState: 'limitMint' }), B(77, 0.96, 0.78)], cmd: { slots: ['Limit', 'Magic', '', 'Item'], cur: 0, phase: 0 },
    marks: { ready: true } },
  { id: 'f5b', msg: null, desktopOnly: true,
    party: [C(205, 1, 1, { limState: 'limitPeach' }), B(77, 0.96, 0.78)], cmd: { slots: ['Limit', 'Magic', '', 'Item'], cur: null, phase: 1 },
    limitWin: { name: 'Braver' }, marks: { ready: true } },
];

const CHIP = 'A+ TARGET · FF7 ONLY · PLACEHOLDER SCENE AND FIGURES · CURRENT HP ARE PLACEHOLDERS';
function section(id, cls, mode, f, fam) {
  const s = document.createElement('section');
  s.id = id;
  s.className = cls;
  const phone = mode.startsWith('phone');
  const chip = phone ? `A+ · ${mode === 'phoneB' ? 'PHONE B · ' : ''}PLACEHOLDER SCENE · HP PLACEHOLDERS` : CHIP;
  const safe = phone ? '<div class="safe">SIMULATED SAFE AREA · 47 PX · NOT HUD</div>' : '';
  const est = f.est ? `<div class="chip est ${phone ? 'phone' : ''}">${f.est}</div>` : '';
  s.innerHTML = `<div class="stage${mode === 'pillar' ? ' pillar' : ''}">${scene(phone ? 'phone' : mode, f.marks)}</div>${hud(f, mode, fam)}` +
    `${safe}<div class="chip ${phone ? 'phone' : mode}">${chip}</div>${est}`;
  document.getElementById('root').appendChild(s);
}

const TYPE_CANDIDATES = ['MPR', 'Raj', 'Exo', 'Chk']; // PR7 (ours) is the default on every frame
function build() {
  measureFonts();
  for (const f of FRAMES) section(`${f.id}-1600`, 'desk', 'desk', f, 'PR7');
  for (const k of TYPE_CANDIDATES) section(`f1${k}-1600`, 'desk', 'desk', FRAMES[0], k);
  section('f1pillar-1600', 'desk', 'pillar', FRAMES[0], 'PR7');
  const f5 = FRAMES.find((f) => f.id === 'f5'); // the next step of the Limit letter colours, for the detail sheet
  section('f5p1-1600', 'desk', 'desk', { ...f5, cmd: { ...f5.cmd, phase: 1 } }, 'PR7');
  for (const f of FRAMES) if (!f.desktopOnly) section(`${f.id}-390`, 'phone', 'phone', f, 'PR7');
  for (const f of FRAMES) if (!f.desktopOnly) section(`${f.id}B-390`, 'phone', 'phoneB', f, 'PR7');
}

// Metrics for the checklist: window rectangles, and anything that spills out of a phone frame
// or out of its own window. Glyph-set text is measured by its ink box, not its padded SVG.
function metrics() {
  const out = { fonts: FM, sections: {} };
  for (const s of document.querySelectorAll('section')) {
    const sr = s.getBoundingClientRect();
    const rel = (r) => ({ x: +(r.left - sr.left).toFixed(1), y: +(r.top - sr.top).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    const wins = {}, spill = [];
    for (const w of s.querySelectorAll('.w')) {
      const wr = w.getBoundingClientRect();
      wins[w.dataset.name] = rel(wr);
      for (const t of w.querySelectorAll('.t')) {
        let tr;
        if (t.dataset.pad) {
          const r = t.getBoundingClientRect(), p = +t.dataset.pad;
          tr = { left: r.left + p, top: r.top + p, right: r.left + p + +t.dataset.w, bottom: r.bottom - p };
          tr.width = tr.right - tr.left; tr.height = tr.bottom - tr.top;
        } else {
          const range = document.createRange();
          range.selectNodeContents(t);
          tr = range.getBoundingClientRect();
        }
        if (tr.left < wr.left - 0.5 || tr.right > wr.right + 0.5 || tr.top < wr.top - 0.5 || tr.bottom > wr.bottom + 0.5)
          spill.push({ win: w.dataset.name, text: t.dataset.s || t.textContent, rect: rel(tr) });
        if (tr.left < sr.left || tr.right > sr.right) spill.push({ offFrame: true, text: t.dataset.s || t.textContent, rect: rel(tr) });
      }
    }
    out.sections[s.id] = { w: sr.width, h: sr.height, wins, spill };
  }
  return out;
}
