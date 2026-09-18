# adv-art-manifest — the build-time art index

**Problem.** The live site discovered art by *asking the server*. Staging a
battle fired a HEAD probe per pose per figure (`BattlePresenterArt.probe`) and
`PaintedArt.loadSubject` then GET'd a PNG **and** a `.json` sidecar for every
state in `CHARACTER_STATES`. Every pose the art fleet has not painted —
`ready` and `defend` on all six party members, `cast`/`hurt`/`ko` on every
aeon, everything for the three Vegnagun parts — was a 404 on GitHub Pages, so
opening a chapter filled the network panel with red and the console with
`[painted] missing painting: …`.

**Fix.** `tools/gen/manifest.mjs` walks `public/art/` at build time and writes
`public/art/manifest.json`. The runtime loads it once and never requests a file
it does not list.

---

## What ships

| File | Role |
| --- | --- |
| `tools/gen/manifest.mjs` | the scanner; `buildManifest()` / `writeManifest()` are pure enough to point at a fixture dir |
| `tools/gen/manifest.d.mts` | types, so the TS unit tests can import the scanner directly |
| `src/engine/ArtManifest.ts` | the runtime half: load once, answer queries, **never throw** |
| `src/engine/PaintedArt.ts` | `loadSubject` only fetches listed states; `loadPainted` refuses a known-absent URL |
| `src/engine/BattlePresenterArt.ts` | `resolvePoseMap` / `resolveArt` consult the manifest instead of probing |
| `src/engine/PaintedActor.ts` | **one-line additive edit** (see *Edits outside my files*) |
| `src/ui/common/portrait.ts`, `src/ui/ffx/portraits.ts`, `src/ui/common/chapterPanel.ts` | **small additive gates** on the `<img>` builders (see *Edits outside my files*) |
| `package.json` | `art:manifest`, plus `prebuild` and `predev` hooks |
| `tools/deploy-pages.mjs` | **one added step** — regenerate the manifest before `vite build` |
| `tests/unit/art-manifest-build.test.ts` | the scanner, against throwaway fixture trees |
| `tests/unit/art-manifest-loader.test.ts` | the loader, including every fallback path |

`public/art/` is gitignored in full, so `manifest.json` is a build product and
never dirties the tree.

## The file

```jsonc
{
  "version": 1,
  "generatedAt": "2026-09-18T14:47:04.288Z",
  "subjects": {
    "tidus":  { "states": ["attack","cast","hurt","idle","item","ko","victory"],
                "portrait": true, "facing": "right" },
    "anima":  { "states": ["attack","idle","overdrive"], "portrait": true, "facing": "left" }
  },
  "portraits": ["anima", "auron", "…"],
  "backdrops": ["bevelle-underground", "…"],
  "pause":     ["ch1-seymour-flux", "…"]
}
```

Current scan: **47 subjects, 149 poses, 20 portraits, 7 backdrops, 19 pause
paintings** — 7.5 KB, fetched once per session with `cache: 'force-cache'`.
(The art fleet is writing while you read this, so the counts move.)

### What counts as art

- `characters/<id>/<state>.png` where `<state>` is a **bare** name. `idle.png`
  yes; `idle.2.png` (an un-promoted candidate) and `ko.raw.png` (a pre-cutout
  source) no. That rule is the one worth guarding in both directions — too
  strict and a real painting silently disappears from the game, too loose and
  the 404s come straight back.
- `facing` is copied through from `idle.json`, or the first state that declares
  one, lower-cased and otherwise untouched: `parseArtFacing` in
  `BattlePresenterActors.ts` still owns the vocabulary and its aliases, so a new
  alias needs no change in the generator.
- `portrait` is just `portraits/<id>.png` existing, so a caller with a subject
  entry never needs a second lookup.

## The runtime contract

Everything in `ArtManifest.ts` has three answers, and the third is the one that
keeps this safe:

| Answer | Meaning |
| --- | --- |
| `true` / a list of states | it exists — load it |
| `false` / `[]` | it does not — **do not request it**, fall back to `idle` silently |
| `null` | *no manifest* — probe and fetch exactly as before |

`null` happens on an old deploy, a hand-rolled static server, a `file://` open
or a unit test. A manifest that 404s, that a dev server answers with
`index.html`, or that is garbage all read as `null`. Nothing in the loading
path became load-bearing: `BattlePresenterArt.probe` and the fetch-everything
path in `loadSubject` are both still there and still exercised.

Three suppression points, because there are three ways to reach a PNG:

1. `PaintedArt.loadSubject` filters `states` down to what the manifest lists
   before it fetches anything (`PaintedActor.fromSubject`, the scenes).
2. `BattlePresenterArt.resolvePoseMap` / `resolveArt` swap the HEAD probes for
   a set lookup (the battle stage).
3. `PaintedArt.loadPainted` refuses a URL the manifest positively denies. This
   is the one that catches the case the other two cannot: a figure with **no**
   art still gets a full pose map so `PaintedActor` has names to hang its
   stand-ins on, and without this every one of those names was a 404.

## Wiring

```
npm run art:manifest        # regenerate by hand
npm run art:manifest -- --check   # exit 1 if stale (nothing writes)
npm run build               # prebuild regenerates it first
npm run dev                 # predev regenerates it first
node tools/deploy-pages.mjs # regenerates it before vite build
```

The deploy hook matters most: it runs **after** the dirty-tree check and
**before** `vite build`, so a release always ships an index of whatever the art
fleet finished since the last one. That is what makes "art generated locally"
actually reach the site.

### How to check a build in thirty seconds

```
npx vite build --outDir critic/scratch/prod-<key>
npx vite preview --outDir critic/scratch/prod-<key> --port 5354 --strictPort
node critic/scratch/verify-manifest.mjs     # VERIFY_PORT= to point elsewhere
```

It drives the title, the chapter-select arc and both battles with real keys and
a real click, then exits non-zero if **any** `/art/**` response came back
without an image content type, or if a figure is grey while the manifest says it
has an `idle`. `vite preview` answers a miss with `index.html` and a 200, so the
content type is the signal — which is the same trap `BattlePresenterArt.probe`
documents for pose probes.

---

## Measured

A production build served under `/pyrefly-reprise/` on :5354, driven with real
keyboard and mouse input — Enter on the title, arrow keys along the
chapter-select arc, Enter to confirm, keys through party-prep and the cutscene,
then a real keypress on the live command menu before handing the fight to the
`intended` strategy. `vite preview` answers a missing file with `index.html` and
a **200**, so the miss test is the content type, not the status; on Pages each
of these is a real 404.

"Before" is the same script against `dist-release/` on :5355 — the bundle that
is live on Pages right now — so this is a measurement, not an estimate.

| Chapter 4 + Chapter 1, one session | before (live bundle) | after |
| --- | ---: | ---: |
| `/art/**` requests | 273 | **159** |
| of those, **misses** (404 on Pages) | **84** | **0** |
| HEAD probes for poses | 74 | **0** |
| console warnings | 12 | **3** |
| of those, `[painted] missing painting` | 9 | **0** |
| figures grey despite having an `idle` | 1 (`bahamut`) | **0** (9/9 painted) |
| requests to fetch the index | — | 1 (~6 KB, `force-cache`) |

The one grey figure in the "before" column is the second half of the brief
showing itself: Chapter 1's summoned Bahamut renders a procedural silhouette on
the live site and nine `missing painting` warnings, because
`characters/bahamut/` was painted *after* that build. It ships painted now.

Worst single offender, both halves of the problem in one line: `mortiorchis`
was 18 failed portrait requests in the before run, because the FFX CTB list
rebuilds its chips every turn and nothing remembered that the file is not there.

## For the art fleet — states that exist only as un-promoted variants

I did not touch a single file under `public/art/`. These need a promotion (a
`<state>.png` + `<state>.json` chosen from the numbered candidates); until then
the game draws a grey silhouette for them, now silently rather than with ten
404s each:

| Subject | What is there | What is missing |
| --- | --- | --- |
| `vegnagun-body` | `idle.1`, `idle.2` | `idle.png` — **whole subject is a silhouette** |
| `vegnagun-head` | `idle.1`, `idle.2` | `idle.png` — **whole subject is a silhouette** |
| `vegnagun-leg` | `idle.1`, `idle.2`, `idle.3` | `idle.png` — **whole subject is a silhouette** |
| `lenne` | `idle.png`, plus `sing.1`, `sing.2` | `sing.png` (nothing asks for `sing` yet) |

All three Vegnagun parts are Chapter 5 combatants, so Chapter 5 is the chapter
that still shows placeholders. `node tools/gen/manifest.mjs` prints this list on
every run — it is the fastest check of "did my art actually ship".

The generator also warns about a promoted PNG with no `.json` sidecar (the
loader fetches one next to every PNG, so a missing sidecar is still a 404). The
tree is clean on that front right now.

### Portraits the game asks for and nobody has painted

Each of these now costs **nothing** — the manifest suppresses the request — but
each is also a face that renders as an ink monogram or is simply absent. In
request order of how often they came up in one Chapter 4 + Chapter 1 session:

| `portraits/<id>.png` | asked | where |
| --- | ---: | --- |
| `mortiorchis` | 21x | the FFX CTB chip, rebuilt every turn |
| `paine` | 5x | chapter-select party tiles, party-prep, dialogue |
| `yuna-x2` | 4x | FFX-2 cutscene speaker |
| `rikku-x2` | 3x | FFX-2 cutscene speaker |
| `ormi`, `leblanc` | 1x each | Chapter 4 cutscene speakers |

`mortiorchis` and `paine` are the two worth painting first.

### Two paintings still carrying a white studio background

The loader cleans these at load time and says so; they should be re-cut with a
proper alpha matte:

- `characters/tidus/ko.png`
- `characters/seymour-flux-body/cast.png`

Those two warnings are the **only** art-related console output left in a full
two-chapter session.

## The UI's `<img>` misses — the other half of the 404s

The UI builds its portraits as HTML strings with `onerror="this.remove()"`,
which makes a miss *invisible* but not *free*: it is still a 404. The gate is
one helper in each file, three lines:

```ts
manifestKnowsAssetNow(artUrl(`art/portraits/${id}.png`)) === false  // skip it
```

`=== false` and not `!== true` is the whole safety argument: the sync query
answers `null` until the manifest has landed, and `null` must mean *"emit the
`<img>` and let `onerror` clean up"*, exactly as before. Nothing here can hide
art that is really there, and in a unit test (where no manifest ever loads) the
output is byte-identical to what it was.

To close the race that `null` implies, `ArtManifest.ts` fires the fetch at
**module init** — every module that touches painted art imports it, so that is
the earliest guaranteed point, well before a screen renders. `main.ts` needed
no change.

## Edits outside my files

Each is a gate on a request, additive, and a no-op without a manifest:

| File | Change |
| --- | --- |
| `src/engine/PaintedActor.ts` | `reloadPose` passes `{ ignoreManifest: true }` — the dev hot-swap watcher calls it for a file it has just watched appear, which is by definition newer than a build-time manifest, and gating it would make fresh art invisible until a rebuild |
| `src/ui/common/portrait.ts` | `portraitImgHtml` / `backdropImgHtml` / `faceImgHtml` skip a known-absent file (`paine`, `rikku-x2`, `yuna-x2`, `ormi`, `leblanc`, `mortiorchis`) |
| `src/ui/ffx/portraits.ts` | `portraitChipHtml` skips its portrait and body-crop layers the same way, and `loadBodyAspect` stops fetching a sidecar for a painting that is not there |
| `src/ui/common/chapterPanel.ts` | `heroArtCandidates` filters the list once, which fixes both consumers — `mountHeroArt`'s error-driven chain **and** the party-prep panel, which stacks all three candidates as CSS `background-image` layers and therefore fetches every one of them |
| `tools/deploy-pages.mjs` | the manifest regeneration step above |

The `.webp` arm of `heroArtCandidates` is the interesting one: it exists only
because the hero-art format was once undecided, nothing in `public/art/**` has
ever shipped as a `.webp`, and the CSS-layer consumer meant it was fetched (and
404'd) on every chapter panel. `manifestKnowsAsset` therefore answers `false`
for *any* non-PNG encoding of an indexed asset, not merely for an unlisted name.

## One thing I saw and did not chase

Calling `__pyrefly.goto('chapter-select')` while the chapter **flow** is still
running leaves the previous screen's DOM mounted: the next battle's HUD then
draws on top of the chapter-select panels
(`docs/screenshots/art-manifest/07-ch1-late.png` is what that looks like). My
verification harness does this to get from Chapter 4 back to Chapter 1, so it
may be nothing more than a debug-API misuse — `goto` replaces the *active*
screen and the flow keeps its own. But if there is now a real "quit to chapter
select" path out of a battle, whoever owns the flow should check that it
unmounts. Reached only through the debug API here, never through a key press.

## Known edges

- A dev session started before new art landed keeps the stale manifest until
  the next `npm run dev` (hence `predev`). The hot-swap watcher still picks up
  new files mid-session; a *cold* `PaintedArt.load` of a brand-new subject in a
  running dev session will not, until the manifest is regenerated.
- The manifest is `false` only about the four folders it indexes
  (`characters/`, `portraits/`, `backdrops/`, `pause/`) and only about bare
  names. A `.raw` intermediate, a numbered candidate or any other path answers
  `null`, so no other loader in the app is affected by any of this.
