# Chapter VII decision sheets — Seymour, the Guado Guardians, Anima

Chapter 7 (Seymour and Anima, Macalania Temple), **FFX only**. Built the same way
`docs/concepts/chapters/art-r3-decisions/` was built for Chapter 6: from files
already on disk plus one real capture, nothing rendered, nothing installed,
nothing written to `approved-hashes.json`. Sources: `gen_crops.py` documents
every crop/composite and where its source file lives; the game-size panels and
the departure strips reuse a real in-battle capture (`img/ch7-capture.png`,
this session's own `npx vite --port 5750 --strictPort` with HMR off,
`PYREFLY_BROWSER=gpu`, `window.__pyrefly.gotoChapter('seymour-anima-macalania')`,
stopped by PID afterwards) as the background, plus the CANDIDATE paintings
already on disk under `public/art/characters/{seymour-macalania,guado-guardian,anima}/`
and the independent judge's scores in `production/judge.md`.

## decision-1-paintings.png

**Question for Bailey: how many paintings should Seymour and each Guado
Guardian get — A (fewest, recommended), B (+ attack paintings), or C (engine
only)?** This is the same Decision 1 METHOD-CHECK.md §4 already put to Bailey
for Chapter 6 (D-034: fewest paintings), asked here for Chapter 7's own
subjects, per `docs/plans/chapter-macalania-finish.md` item (b). Both subjects'
idle and cast paintings are CANDIDATE, independently judged 6/7 (facing flag
and a colour match are the only redos before either could ship); both attack
paintings are CANDIDATE but score below the bar of 7, and research
`§4.1`/`§4.2` shows neither Seymour nor the Guardians ever throw a physical
attack in this fight, so option B buys a pose the data never calls. Anima is
**out of scope** for this decision: METHOD-CHECK §4's own Q4 recommends
reusing the approved `anima/idle.png` at a smaller scale instead of a new
painting, and that is what this sheet assumes throughout.

## decision-2-exit.png

**Question for Bailey, framed the same way as D-035: (1) do the Guado
Guardians get the `'yields'` departure (stays standing, dims, steps back) that
Leblanc, Logos and Ormi already ship with, instead of today's stopgap pyrefly
dissolve? (2) does Seymour get the optional `'body'` painting (falls and stays
down) for the beat that ends the fight, instead of the same generic dissolve?**
The research is explicit and the two subjects are **not** the same case:

- Guado Guardians: *"Living Guado bodyguards. They lose."* and *"More of their
  fellows chase the party out of the temple"* afterwards
  (`research/ffx-vs-ffx2-presentation.md` row 140) &mdash; the same "living
  humans who lose and the scene continues" class D-035 already used for the
  Syndicate, so **Yields** is recommended, extending D-035's own `where` field
  (it already names the Guardians for this).
- Seymour: *"He dies and leaves a body."* (`presentation.md` row 142), matching
  `docs/plans/art-method-r3/METHOD-CHECK.md` line 195's *"Seymour at Macalania
  falls and stays down (`'body'`)"*. He does **not** survive the fight the way
  the Syndicate and the Guardians do, so **Yields is the wrong class for him**
  and the optional **`'body'`** painting is recommended instead. `'body'` is
  not yet a `DepartureKind` in `src/engine/BattlePresenterDepartures.ts`
  (today's type is `'dissolve' | 'falls-away' | 'yields'`) &mdash; adding it is
  part of what a yes here asks for.

Anima's row is **context, not a question**: her removal already runs through a
scripted battle-rule message (`'Seymour dismisses Anima'`,
`src/battle/ffx/ai/macalania-rules.ts`) and direct removal, never the
presenter's departure-kind table at all, and the research already calls this a
recall rather than a death (*"present the departure as a recall, not a
death,"* `presentation.md` row 141). Shown alongside the other two rows for
completeness only.

Reaction goes into the tile's `reaction` (liked / disliked / must remain /
must change / undecided) once Bailey answers; nothing here is built, wired, or
written to `approved-hashes.json` until he does.
