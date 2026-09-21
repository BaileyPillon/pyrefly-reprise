# Learning sites: plan

**Owner's words.** Bailey, 2026-09-21: "build us an interactive learning website ... I want those
examples at Human Atlas and Model X studio ... adapted to our project." Shown three directions
(A a boss taken apart, B one turn of battle taken apart, C a game frame taken apart), Bailey
answered: **"A, B, C all separately please but please be mindful of delegation here so we dont
waste so many tokens and usage."**

So: three separate sites, one shared engine under them, built thriftily. The reference pattern is
in [docs/concepts/atlas/REFERENCE.md](../concepts/atlas/REFERENCE.md). The target pictures for
each site are the verified frames in `docs/concepts/atlas/<a|b|c>-*/` (end state first, hard rule
9): **the look of each site is built only to a frame Bailey has seen.**

**APPROVED, 2026-09-21.** On seeing the nine frames Bailey wrote: **"yes commit it, all three
looks are good  where can i actually view these websites?"** and later **"Links to all 3
websites please?"** The frames are the approved targets (nine approved tiles in
`docs/target/targets.json`, group `learning-sites`). What Bailey named: the three subjects, that
they are separate sites, and the look of each as shown on its frames. **The visible build is
authorised and wanted: Bailey is asking for links to sites that do not exist until they are built.**

Game case (hard rule 14): **both**, as a whole (it is a new surface over both games); each
specimen is FFX only or FFX-2 only and takes that game's accent and that game's rules. A turn
list is never shown for FFX-2; a gauge is never shown for FFX.

## Where it lives (default, reversible)

A new root folder `learn/` with its own Vite config. **The game's build, `src/`, `public/`,
`vite.config.ts`, `tsconfig.json` and `vitest.config.ts` are not edited**, so the in-flight
release (Build A.2, round 05) is untouched and `tools/critic-plan.mjs` sees no shared-system
change. `learn/` only *imports* from `src/battle/**` and `src/data/**` (both pure, no DOM).

```
learn/
  vite.config.ts     root = learn/, publicDir = ../public (art and fonts, served not copied in dev),
                     pages: index.html (hub), atlas/, studio/, exploded/; outDir = ../dist-learn;
                     dev port 5310 (strictPort); build base /pyrefly-reprise/learn/
  index.html         the hub: three doors
  shared/            the explorer engine, built once (below)
  atlas/             site A  "Pyrefly Atlas"            specimen = a boss chapter
  studio/            site B  "Pyrefly Studio"           specimen = one turn of battle, real engine live
  exploded/          site C  "Pyrefly Reprise, exploded" specimen = one finished frame of the game
tests/unit/learn-*.test.ts   picked up by the existing vitest include; no config change
```

Publishing is a separate decision for Bailey (a folder of the existing Pages site, or its own
site). Nothing is deployed by this plan.

## The shared explorer engine (`learn/shared/`)

Framework-free strict TypeScript and DOM, house style (explicit `.ts` imports, every file under
400 lines). Depth is CSS 3D transforms on DOM nodes, not WebGL: the pieces are painted cutouts,
cards and tiles, text stays crisp and searchable, and the target frames were made the same way,
so target and build can be compared like for like.

Pure modules (no DOM, unit tested):

| File | What it owns |
|---|---|
| `model.ts` | `Specimen { id, title, eyebrow, factsLine, game, systems[], pieces[] }`, `System { id, name, colour, count }`, `Piece { id, systemId, name, kind: 'painting' \| 'card' \| 'tile', art?, size, home: {x,y,z}, burst: {x,y,z}, card: PieceCard }`, `PieceCard { eyebrow, body, claimKind, facts[], cite, tabs: [{ id, label, body }], honesty? }`. Every `PieceCard` **must** carry `cite`; a piece without a source cannot be constructed. |
| `store.ts` | One state object and a reducer: `explode` 0 to 1, `selectedId`, `isolatedId`, `hiddenSystems`, `query`, `view`. Subscribe / dispatch. No framework. |
| `layout.ts` | For a piece and an `explode` value, the transform: 0 = `home`; up to about 0.6 it travels toward `burst` (pulled apart in depth); from 0.6 to 1 it travels to its inventory slot and the stage rotation eases to front-on. |
| `pack.ts` | The inventory grid: visible pieces only, largest first, grouped by system, no overlaps, for a given aspect ratio (desktop and 390 wide). |
| `search.ts` | Index over piece names, system names and cites; `/` focuses; returns ranked piece ids. |

DOM modules: `shell.ts` (mounts the nine pattern elements and wires the store), `panel.ts`
(systems with counts and toggles, presets, "N pieces visible · Hide all"), `slider.ts`
(the explode slider: label, track, percent, Reset, state caption), `card.ts` (detail card: tabs,
fact row with the cite, honesty chip, Isolate / Show everything, Clear selection, an optional
secondary action), `rail.ts` (views, zoom, reset, labels), `switcher.ts` (specimens), `stage.ts`
(CSS 3D stage: drag to orbit, wheel or pinch to zoom, tap to inspect, drag to pan at 100 percent),
`hint.ts`. Themes: `themes/tokens.css` (Ink & Gold tokens and the local fonts) plus one file per
look; a site picks a theme and an accent (`gold` or `pink`) per specimen.

Keyboard and pointer are both first class: Tab order through panel, stage pieces, card; arrow
keys on the slider; Esc clears selection, then isolation; `/` searches.

## The three sites (each is data plus a stage arrangement)

- **A · atlas/** `data.ts` turns a chapter (`src/data/encounters.ts`, the enemy and ability
  files, `src/data/guides/*.ts`) into a `Specimen`: parts and forms, attacks, statuses inflicted,
  immunities, affinities, turn pattern, rewards. The second tab, "How to answer it", is the
  strategy guide's own cited text. All five chapters, Vegnagun first. Counts are computed from
  the data at build time, never typed.
- **B · studio/** `trace.ts` runs the real FFX engine on a seeded example turn and returns the
  steps with the engine's own numbers; `rules.ts` lists every status, element, formula and
  command the research docs document, each with its section. The live control re-runs the engine.
  FFX first; the FFX-2 variant (gauges) only from `research/ffx2-combat-core.md`.
- **C · exploded/** `layers.ts` describes one battle frame as planes (backdrop, light, boss,
  party, effects, HUD) plus the non-visual layers (engine events, presenter, music), each citing
  `docs/ARCHITECTURE.md` / `docs/ART-PIPELINE.md` / `docs/AUDIO-GUIDE.md`; `assets.ts` turns
  `public/art/manifest.json` into the inventory.

## Rules that bind every track

Hard rules 3 (prove by running the engine), 6 (no invented data: a fact with no source is left
off), 7 (house style), 8 (original art only; nothing copied from the reference sites), 14
(game-aware). Shared tree: stage only your own paths; never `git add -A`, checkout, restore,
reset, stash or clean. No `npm run build` of the game, no `npm ci`, no downloads, no ComfyUI.
Your own dev server on the port given to you, `--strictPort`, stopped by its own PID.

## Thrift (Bailey's instruction)

1. The shell is built **once**; A, B and C are thin. No site re-implements a shared part.
2. The mockup round's verified facts, counts and B's engine probe are inputs; nobody re-derives them.
3. Well-specified tracks run on Sonnet. One agent per track, this file as the brief, no fan-out
   inside a track.
4. One verification per site, by real input in a browser, target frame beside the build.
   One browser-capture owner at a time.
5. Usage is read before each phase and reported to Bailey with each milestone.

## Order

0. Targets: frames verified, shown to Bailey. *(running)*
1. Shell: pure modules and tests first (plumbing), then the DOM parts to the approved look.
2. A, B, C data layers (plumbing, parallel, Sonnet), each with tests against the sources.
3. A, B, C pages wired to the shell, to their target frames.
4. One real-input check per site, side-by-side pictures to Bailey, handoff note, NOW.md.

## Done means

`npx tsc --noEmit` clean; `tests/unit/learn-*.test.ts` green and the full suite still green;
`node tools/orphans.mjs` clean for anything added under `src/` (nothing should be); each site
driven by real mouse and keyboard in a browser with 0 console errors and 0 404s; a
target-beside-build picture per site under `docs/screenshots/learn/`; `docs/handoff/learning-sites.md`
and NOW.md updated.
