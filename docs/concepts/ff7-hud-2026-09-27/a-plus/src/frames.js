// The five moments of the brief (+ 5b, the Limit window) and the build of every section.
// Party max HP / MP: the research preset (research/ff7-guard-scorpion.md §8.4, [derived]:
// Cloud 316 / 57, Barret 317 / 43). Current HP values are PLACEHOLDERS chosen to tell one
// consistent story; the Tail Laser damage (74 / 73) sits inside the derived range 72 to 77
// (same file §9), and the Limit fill after it follows §9 (a 77 hit fills about 52 % of Cloud's
// gauge, 56 % of Barret's). Hint line: the game's own text (same file §7.1), game spelling kept.
const C = (hp, lim, time, extra = {}) => ({ n: 'Cloud', hp, max: 316, mp: 57, mpMax: 57, lim, time, ...extra });
const B = (hp, lim, time, extra = {}) => ({ n: 'Barret', hp, max: 317, mp: 43, mpMax: 43, lim, time, ...extra });
const SLOTS = ['Attack', 'Magic', '', 'Item'];
const FRAMES = [
  { id: 'f1', title: "1 · Cloud's turn, cursor on Attack", msg: '“Attack while it\'s tail\'s up!',
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: SLOTS, cur: 0 }, marks: { ready: true } },
  { id: 'f2', title: '2 · Magic open, MP cost shown', msg: null,
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], magic: { spells: ['Ice', 'Bolt'], cur: 1, mp: [4, 57] }, marks: { ready: true } },
  { id: 'f3', title: '3 · Targeting Guard Scorpion', msg: 'Guard Scorpion',
    party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: SLOTS, cur: null }, marks: { ready: true, target: [500, 486] } },
  { id: 'f4', title: '4 · Tail Laser, damage on the party', msg: 'Tail Laser',
    party: [C(205, 1, 0.08, { limState: 'limitPeach' }), B(77, 0.96, 0.7)],
    marks: { laser: true, damage: [[990, 528, '74'], [1112, 528, '73']] } },
  { id: 'f5', title: '5 · Limit full: "Limit" replaces Attack', msg: null,
    party: [C(205, 1, 1, { limState: 'limitMint' }), B(77, 0.96, 0.78)], cmd: { slots: ['Limit', 'Magic', '', 'Item'], cur: 0, phase: 0 },
    marks: { ready: true } },
  { id: 'f5b', title: '5b · The Limit window (Braver)', msg: null, desktopOnly: true,
    party: [C(205, 1, 1, { limState: 'limitPeach' }), B(77, 0.96, 0.78)], cmd: { slots: ['Limit', 'Magic', '', 'Item'], cur: null, phase: 3 },
    limitWin: { name: 'Braver' }, marks: { ready: true } },
];

const CHIP = 'A+ TARGET · FF7 ONLY · PLACEHOLDER SCENE AND FIGURES · CURRENT HP ARE PLACEHOLDERS';
function section(id, cls, mode, f, fam) {
  const s = document.createElement('section');
  s.id = id;
  s.className = cls;
  const chip = mode === 'phone' ? 'A+ · PLACEHOLDER SCENE · HP PLACEHOLDERS' : CHIP;
  s.innerHTML = `<div class="stage${mode === 'pillar' ? ' pillar' : ''}">${scene(mode, f.marks)}</div>${hud(f, mode, fam)}` +
    `<div class="chip ${mode}">${chip}</div>`;
  document.getElementById('root').appendChild(s);
}

function build() {
  measureFonts();
  for (const f of FRAMES) section(`${f.id}-1600`, 'desk', 'desk', f, 'MPR');
  section('f1raj-1600', 'desk', 'desk', FRAMES[0], 'Raj');
  section('f1pillar-1600', 'desk', 'pillar', FRAMES[0], 'MPR');
  for (const f of FRAMES) if (!f.desktopOnly) section(`${f.id}-390`, 'phone', 'phone', f, 'MPR');
}

// Metrics for the checklist: window rectangles, and anything that spills out of a phone frame
// or out of its own window.
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
        const range = document.createRange();
        range.selectNodeContents(t);
        const tr = range.getBoundingClientRect();
        if (tr.left < wr.left - 0.5 || tr.right > wr.right + 0.5 || tr.top < wr.top - 0.5 || tr.bottom > wr.bottom + 0.5)
          spill.push({ win: w.dataset.name, text: t.textContent, rect: rel(tr) });
        if (tr.left < sr.left || tr.right > sr.right) spill.push({ offFrame: true, text: t.textContent, rect: rel(tr) });
      }
    }
    out.sections[s.id] = { w: sr.width, h: sr.height, wins, spill };
  }
  return out;
}
