# Portraits live: paper preflight (rule 15, 2026-10-03)

`node tools/critic-plan.mjs --paths` classes this change DEEP (a shared system: the pause screen, a new stylesheet).
Game case: **both** (shared plumbing, CHK-020; the parts are per plate: FFX plates Chapters I to III and the rest,
FFX-2 plates Chapters IV and V). Five minutes on what could hurt, before it is built:

| Risk | Why it could happen | What stops it |
|---|---|---|
| The face drifts off the plate | The plate is moved by an inline box, a CSS push-in/drift animation, a cross-fade, a slide mask and a reframe glide | The twin is a `div` with the plate's own class list and inline style, re-synced every frame, and its animation clock is copied at build; the canvas sits in it at a percent box |
| A pixel changes with the feature off | A canvas or a wrapper left behind | No driver is attached when LIVING PAINTINGS is off or REDUCE MOTION is on; `[data-living]` count 0; the canvas is cleared at rest (drawFace draws nothing); screenshots equal (`offrm.mjs`) |
| The face freezes or glitches on a member change | Two plates share one driver | A layer per plate; the old twin follows its fading plate and goes when the plate leaves the DOM |
| A mixed painting shows | Cross-fade of two paintings | Blinks are a cel snap of the closed lid (no fade); the press weight is shaped to spend little time half there; the smile is a gentle open of the plate's own mouth |
| Cost | A 60 fps canvas redraw | Redraw only when the quantized state changes; the canvas is the parts' bounding box (694 x 574 desktop, 347 x 287 phone) |
| Missing parts | The parts are local files | Manifest looked up in `art/portrait-parts/` then `portrait-parts/`; any miss is "no driver work" and the static plate stays; nothing throws |
| Size line | +3.06 MB in `dist` | See `docs/handoff/portraits-live.md`, install list |
| Save data | None touched | No setting added: it reads the existing LIVING PAINTINGS and REDUCE MOTION rows |

Not built (needs Bailey): a brow lift (A2's lift is a warp; no brow part was painted), a worried brow (D-143 says none),
and the Clair Obscur / Persona camera grammar (camera-lab owns it).
