// Key presses from "the OPTIONS tab is open, focus on the tab strip" to flip one switch, per option and game.
// The model is the one the shipped pause uses (checked with real keys by presses.mjs): the selectable rows of both
// columns form ONE flat list; Down from the strip lands on row 0; Up from row 0 wraps to the last row; Left, Right and
// Confirm all flip a toggle. Option B's Confirm unfolds a header (Left/Right flip its master); A and C's Confirm opens.
const todayRows = (g) => g === 'ffx'
  ? ['masterVolume', 'musicVolume', 'sfxVolume', 'textSpeed', 'textSize', 'reduceMotion', 'lowEffects', 'fxLight', 'fxLiving', 'fxSpectacle', 'guideVisible', 'battleHelp', 'briefing', 'restart', 'chapter-select', 'quit', 'credits']
  : ['masterVolume', 'musicVolume', 'sfxVolume', 'textSpeed', 'textSize', 'reduceMotion', 'lowEffects', 'fxLight', 'fxLiving', 'fxSpectacle', 'ffx2Atb', 'ffx2AtbSpeed', 'guideVisible', 'battleHelp', 'briefing', 'restart', 'chapter-select', 'quit', 'credits'];
const reach = (n, from, to) => Math.min(Math.abs(to - from), n - Math.abs(to - from));   // Down or Up (wrapping)
const shot = (g) => (g === 'ffx' ? 'fxHero' : 'fxSphere');
const PAGE = (g) => ['top', 'fxLight', 'fxDof', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxFraming', shot(g), 'fxSplash'];
const out = {};
for (const g of ['ffx', 'ffx2']) {
  const today = todayRows(g);
  const idx = (rows, id) => rows.indexOf(id);
  const res = { today: {}, A: {}, B: {}, C: {} };
  // today: enter (1) + walk + flip (1)
  for (const id of ['fxLight', 'fxLiving', 'fxSpectacle']) res.today[id] = 1 + reach(today.length, 0, idx(today, id)) + 1;
  // A: the three rows become one row at the same place
  const A = today.filter((r) => !['fxLiving', 'fxSpectacle'].includes(r)).map((r) => (r === 'fxLight' ? 'eyeCandy' : r));
  const openA = 1 + reach(A.length, 0, idx(A, 'eyeCandy')) + 1;               // enter + walk + Confirm opens the page
  const P = PAGE(g);
  res.A.open = openA;
  for (const id of P) res.A[id] = openA + reach(P.length, 0, idx(P, id)) + 1;
  // B: same list as today while folded; a part needs: walk to its header, Confirm (unfold), Down k, flip
  const kids = { fxLight: ['fxDof', 'fxFog', 'fxEdges'], fxLiving: ['fxBreath', 'fxKo'], fxSpectacle: ['fxFraming', shot(g), 'fxSplash'] };
  for (const m of Object.keys(kids)) {
    res.B[m] = 1 + reach(today.length, 0, idx(today, m)) + 1;                  // flip the master: Left/Right on the header
    kids[m].forEach((k, i) => { res.B[k] = 1 + reach(today.length, 0, idx(today, m)) + 1 + (i + 1) + 1; });
  }
  res.B.allThreeOff = res.B.fxLight + 2 + 2;                                  // Right, Down, Right, Down, Right
  // C: preset row + CUSTOMIZE replace the three rows
  const C = today.filter((r) => !['fxLiving', 'fxSpectacle'].includes(r)).flatMap((r) => (r === 'fxLight' ? ['fxPreset', 'fxCustomize'] : [r]));
  const presetAt = 1 + reach(C.length, 0, idx(C, 'fxPreset'));
  res.C.presetCycle = presetAt + 1;                                           // Right = next preset, Left = previous (OFF is one Left from FULL)
  const openC = 1 + reach(C.length, 0, idx(C, 'fxCustomize')) + 1;
  res.C.open = openC;
  const PC = ['preset', ...P.slice(1)];
  for (const id of PC) res.C[id] = openC + reach(PC.length, 0, idx(PC, id)) + 1;
  res.rows = { today: today.length, A: A.length, B_folded: today.length, B_allOpen: today.length + 8, C: C.length };
  out[g] = res;
}
console.log(JSON.stringify(out, null, 1));
