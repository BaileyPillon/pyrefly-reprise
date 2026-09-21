# The reference: what "interactive learning website" means here

Bailey's request (2026-09-21): build an interactive learning website for this project,
adapted from the examples in section 16, "Interactive Learning Websites" (1:09:24 to
1:13:12), of Riley Brown's video https://youtu.be/ifz8NGHuHtY.

That section shows two X posts by Ashe Magalhaes (@ashebytes, "we are in a renaissance of
learning"). Both sites are live. Observed first-hand on 2026-09-21 in a browser:

| Site | Live | Code | Licence |
|---|---|---|---|
| Human Atlas | https://human-atlas-seven.vercel.app | github.com/ashemag/human-atlas | MIT (code), CC BY 4.0 (BodyParts3D data) |
| Model X Studio | https://model-x-studio.vercel.app | github.com/ashemag/model-x-studio | none stated; the car model is a licensed BlendKit asset |
| Fly Brain Atlas (not in the video, same author, "built from Human Atlas") | | github.com/ashemag/fly-brain-atlas | MIT |

The video's own words for the pattern: "separates every part ... into parts and you can
actually hover over it, you can learn about it"; "take this 3D asset, make it so I can pull
it apart and see all parts".

**We take the interaction pattern only. No code, model, texture, text or layout file is
copied from any of them** (AGENTS.md hard rule 8; Model X Studio has no licence at all).

## The pattern both sites share

1. **One hero specimen on a stage.** A single object, centred, on a circular plinth, lit
   like a product shot. Drag to orbit, pinch or wheel to zoom, tap to inspect. A one-line
   hint strip at the bottom left says exactly that.
2. **A title block, top left.** A small tracked eyebrow ("INTERACTIVE ANATOMY"), the name
   in large type, then one quiet line of facts: "2,234 modeled pieces · BodyParts3D".
3. **A systems / components panel, left.**
   - Human Atlas: "Systems 15", preset tabs (All / Skeleton / Organs), then one row per
     system: colour dot, name, piece count, an on/off toggle. Footer: "2,229 pieces
     visible · Hide all".
   - Model X: "Components", eight numbered rows (01 Body & structure ... 08 Wheels &
     brakes). Clicking a row selects that component and opens its card.
4. **The explode slider, bottom centre. This is the signature.** A labelled track from
   "Assembled" to "Every piece" (Model X: "Assemble" to "All parts") with a percentage
   readout and Reset. Around 50 percent the pieces drift outward from the body, still in
   3D ("SEPARATED STRUCTURES"). At 100 percent they settle into a flat, evenly spaced
   grid of every visible piece, largest first ("ANATOMICAL INVENTORY"; Model X shows
   "334 pieces"), the view locks to the front and drag changes from orbit to pan. Only
   the visible systems are packed into the grid.
5. **Select a piece, get a detail card, right.** Colour bar and category eyebrow
   ("Muscles"), the piece's name large ("Right External Oblique"), a short plain-words
   paragraph, a small grey line saying what kind of claim that paragraph is ("System
   overview · structure identified from source anatomy"), a two-column fact row ("Atlas
   reference FMA13336", "Selected pieces 1"), a link out to the source ("View anatomical
   source"), a primary button **Isolate structure**, and "Clear selection". The selected
   piece is tinted on the model.
   - Model X adds two tabs on the card, **Overview** and **How it works**, a key/value
     spec list (Chemistry: Lithium-ion, Cooling: Liquid-cooled), and an honesty chip
     beside the category: "Illustrative" where the geometry is not verified.
6. **Isolate.** Everything else disappears; the chosen piece fills the stage alone; the
   button becomes "Show everything".
7. **Search, top right.** "Find a structure", focus with "/". Human Atlas searches 3,432
   named concepts and source identifiers.
8. **A slim view rail, right edge.** Three-quarter / Front / Side / Back, rotate, reset
   (Human Atlas); layers, zoom in/out, reset, auto-rotate, fullscreen, help (Model X).
   Model X also has a **Labels** toggle beside the slider.
9. **Provenance is part of the design.** "Source & credits" bottom right, a source id on
   every card, and plain statements of what is and is not verified.
10. **Two looks.** Human Atlas is light and clinical: near-white ground, white rounded
    cards with soft shadows, dark slate primary button, tiny coloured system dots. Model X
    is a dark studio: black to blue-grey gradient, a lit turntable, glassy dark panels,
    thin white type, tracked caps.
11. **It works on a phone.** Compact controls, and the detail panel moves below or beside
    the isolated piece.

## What carries over to Pyrefly Reprise, and what cannot

- We have **painted 2.5D art, not 3D meshes**: 51 painted subjects in
  `public/art/characters/` (bosses, forms and parts such as `vegnagun-body`, `-head`,
  `-leg`, `-tail`, `seymour-flux`, `mortiorchis`, `yunalesca-1..3`,
  `braskas-final-aeon-1..2`, `yu-yevon`, `yu-pagoda`, the party, aeons, dresspheres),
  7 backdrops, 25 portraits. "Pulling apart" therefore means separating painted cutouts,
  cards and layers in depth, not exploding a mesh.
- We have something the references do not: **every number in the game is sourced**
  (`research/*.md` with section citations, mirrored in `src/data/**` and
  `src/data/guides/*.ts`), and the **battle engines are pure, deterministic TypeScript
  with no DOM** (`src/battle/**`), so a web page can run the real rules live.
- The project's interface direction is **Ink & Gold**
  (`docs/handoff/presentation-ink-and-gold.md`): ink `#0B0A12`, paper `#F4F1E8`, one
  accent per context (Yevon gold `#E3B94A` in FFX chapters, pyre pink `#F7B6D9` in FFX-2
  chapters), Cormorant Garamond italic for names, Chakra Petch tracked caps for labels,
  Rajdhani for numerals, Exo 2 for body text. Fonts are local in `public/fonts/`.
