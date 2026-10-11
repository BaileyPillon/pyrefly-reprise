/**
 * Which pieces of guide data make up each review card in `re-parity-guide-shots.mjs`, and which game frames are joined.
 *
 * `items(data, tag)` reads the data captured from the dev server (`cards-<tag>.json`), by position or by a match on the label, never by
 * copied text, so the BEFORE and AFTER cards are the same slots of the guide on the two builds. `named` is true for what Bailey named
 * when he said "Draft, show me first" (2026-10-10); the rest are extras he can take or leave (docs/handoff/re-parity-guide.md).
 */

const guide = (d, id) => d.guides.find((g) => g.id === id);
const doc = (d, id) => d.docs.find((x) => x.id === id);

const rule = (id, i) => (d) => {
  const r = guide(d, id)?.rules[i];
  return r && { kind: `RULE ${i + 1}: ${r.short}`, text: r.text, cite: r.cite };
};
const phase = (id, i) => (d) => {
  const p = guide(d, id)?.phases[i];
  return p && { kind: `NOTE: ${p.label}`, text: p.note, cite: p.cite };
};
const hint = (id, label, nth = 0) => (d) => {
  const hs = guide(d, id)?.hints.filter((h) => (h.when.labels ?? []).includes(label)) ?? [];
  const h = hs[nth];
  return h && { kind: `HINT on ${label}`, text: h.text, cite: h.cite };
};
const hintKind = (id, kind, nth = 0) => (d) => {
  const h = (guide(d, id)?.hints.filter((x) => (x.when.kinds ?? []).includes(kind)) ?? [])[nth];
  return h && { kind: `HINT on any ${kind}`, text: h.text, cite: h.cite };
};
const watchAdvice = (id, name) => (d) => {
  const w = guide(d, id)?.watch.find((x) => x.name === name);
  return w && { kind: `WATCH: ${w.name}`, text: `${w.payload}. ${w.advice}`, cite: w.cite };
};
const phaseOf = (id, bossId) => (d) => {
  const p = guide(d, id)?.phases.find((x) => x.bossId === bossId);
  return p && { kind: `NOTE: ${p.label}`, text: p.note, cite: p.cite };
};
const docPara = (id, re, kind) => (d) => {
  const b = doc(d, id)?.blocks.find((x) => x.t === 'p' && re.test(x.text));
  return b && { kind, text: b.text, cite: '' };
};

export const CARDS = [
  // ---- named by Bailey ----------------------------------------------------------------------------------------------------
  {
    name: 'evrae-stone-gaze',
    named: true,
    chapter: 'Chapter VIII, Evrae (FFX only)',
    title: "Evrae's Stone Gaze counter",
    items: (d) => [phase('evrae-airship', 0)(d), phase('evrae-airship', 1)(d)],
  },
  {
    name: 'yojimbo-odds',
    named: true,
    chapter: 'Chapter IX, Yojimbo (FFX only)',
    title: "Yojimbo's odds inside each band",
    items: (d) => [phase('yojimbo-cavern', 0)(d), rule('yojimbo-cavern', 4)(d)],
  },
  {
    name: 'fins-genais-core',
    named: true,
    chapter: 'Chapter XVII, Sin: the Fins and the Core (FFX only)',
    title: 'Negation, and how Genais leaves its shell',
    items: (d) => [rule('sin-fins-core', 2)(d), rule('sin-fins-core', 3)(d)],
  },
  {
    name: 'fins-genais-page',
    named: true,
    chapter: 'Chapter XVII, the guide page for Sinspawn Genais (FFX only)',
    title: 'Where Genais starts (the page the guide sheet prints)',
    items: (d) => [docPara('sin-fins-core', /Begin by killing Sinspawn Genais/, 'GUIDE PAGE')(d)],
  },
  // ---- extras: one card each, added by the extras commits ---------------------------------------------------------------
  {
    name: 'extra-seymour-flux',
    named: false,
    chapter: 'Chapter I, Seymour Flux (FFX only): EXTRA, not named',
    title: "The lines that still describe the old fight",
    items: (d) => [
      rule('seymour-flux', 4)(d),
      hint('seymour-flux', 'Dispel')(d),
      phase('seymour-flux', 1)(d),
      watchAdvice('seymour-flux', 'Auto-Attack Mode')(d),
      watchAdvice('seymour-flux', 'Ready To Annihilate')(d),
      hintKind('seymour-flux', 'summon')(d),
    ],
  },
  {
    name: 'extra-seymour-macalania',
    named: false,
    chapter: 'Chapter VII, Seymour and Anima (FFX only): EXTRA, not named',
    title: "Anima's gauge, the element order, the Shell, the Poison and Magic Break",
    items: (d) => [
      watchAdvice('seymour-anima-macalania', '#')(d),
      phase('seymour-anima-macalania', 2)(d),
      hint('seymour-anima-macalania', 'Aerospark')(d),
      hint('seymour-anima-macalania', 'Poison Fang')(d),
      hint('seymour-anima-macalania', 'Magic Break')(d),
    ],
  },
  {
    name: 'extra-seymour-omnis',
    named: false,
    chapter: 'Chapter XII, Seymour Omnis (FFX only): EXTRA, not named',
    title: 'Four spells a volley, who they aim at, the two-Water quirk',
    items: (d) => [rule('seymour-omnis', 0)(d), rule('seymour-omnis', 4)(d), hint('seymour-omnis', 'Curaga', 1)(d)],
  },
  {
    name: 'extra-yunalesca',
    named: false,
    chapter: 'Chapter II, Yunalesca (FFX only): EXTRA, not named',
    title: "Form I's Blind and Silence counters",
    items: (d) => [rule('yunalesca', 3)(d), hint('yunalesca', 'Eye Drops')(d), phase('yunalesca', 0)(d)],
  },
  {
    name: 'extra-braskas-final-aeon',
    named: false,
    chapter: "Chapter III, Braska's Final Aeon (FFX only): EXTRA, not named",
    title: "Yu Yevon, the Pagodas' gauge, Jecht Beam",
    items: (d) => [
      rule('braskas-final-aeon', 2)(d),
      rule('braskas-final-aeon', 4)(d),
      phase('braskas-final-aeon', 0)(d),
      phaseOf('braskas-final-aeon', 'yu-yevon')(d),
    ],
  },
  {
    name: 'extra-evrae-pull-back',
    named: false,
    chapter: 'Chapter VIII, Evrae (FFX only): EXTRA, found while photographing',
    title: 'The Pull back line on the NEXT BEST MOVE card',
    items: (d) => [hint('evrae-airship', 'Pull back')(d)],
  },
];

/** Game frames that are joined into one picture: the whole frame is cut to `crop(captureBefore, captureAfter)`. */
export const FRAME_PAIRS = [
  {
    name: 'evrae-next-card',
    frame: 'evrae-next-card',
    title: 'Chapter VIII, Evrae: the NEXT BEST MOVE card on the first menu (Pull back)',
    crop: () => ({ before: { left: 40, top: 44, width: 980, height: 260 }, after: { left: 40, top: 44, width: 980, height: 260 } }),
  },
  {
    name: 'genais-sheet',
    frame: 'genais-sheet',
    title: "Chapter XVII, the guide sheet at Sinspawn Genais's opening paragraph (the game frame, cut and enlarged 2x)",
    scale: 2,
    crop: (cb, ca) => {
      const of = (cap) => {
        const r = cap.find((c) => c.shot.startsWith('genais-sheet')).panelRect;
        const left = Math.max(0, Math.floor(r.x) - 14);
        const top = Math.max(0, Math.floor(r.y) - 38);
        return { left, top, width: Math.ceil(r.width) + 28, height: Math.ceil(r.height) + 38 + 14 };
      };
      return { before: of(cb), after: of(ca) };
    },
  },
];
