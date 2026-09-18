# Portraits under the deployed base path

**Key:** `portrait-basepath`. Owns `src/ui/ffx/portraits.ts`,
`src/ui/ffx/CtbList.ts` (URL resolution only), `src/ui/common/portrait.ts`,
`src/engine/PaintedArt.ts` (URL helpers only), `src/ui/ffx2/PartyRows.ts`
(portrait URLs only), and the tests below.

Fixes the live-site bug: on <https://baileypillon.github.io/pyrefly-reprise/>
the FFX CTB list showed ink monograms — `T`, `K`, `Y` — where Tidus, Kimahri
and Yuna's faces belong, while Seymour Flux and Mortiorchis showed real crops.

---

## 1. The diagnosis, and why the obvious answer was wrong

The ticket's own hypothesis was a base-path mistake: a hand-written
`/art/portraits/tidus.png` that works at `vite` (base `/`) and 404s on Pages
(base `/pyrefly-reprise/`). That is the right *class* of bug to suspect from
the symptom, and it is worth writing down that it is **not what this was**,
because the difference decides what the regression test has to assert.

Two facts rule it out:

* **Every art URL in `src/` already goes through one helper.**
  `engine/PaintedArt.ts`'s `artUrl()` prefixes `import.meta.env.BASE_URL` and
  strips the seam at both ends, and `characterUrl` / `portraitUrl` /
  `backdropUrl`, `ui/common/portrait.ts`, `ui/ffx/portraits.ts`,
  `ui/common/chapterPanel.ts`, `ui/ffx2/dressphereIcons.ts`, all five
  `src/scenes/*` backdrops and every screen's wash are callers of it. A
  repo-wide search for a bare `'art/…'` string outside that helper returns
  two doc comments and no code. `src/ui/ffx2/PartyRows.ts` builds no art URL
  at all — FFX-2's faces come from `dressphereIcons.ts`, which is already a
  caller.
* **A production build served under the real base serves them.** Against
  `npx vite preview --outDir critic/scratch/prod-portrait-basepath` at
  `http://127.0.0.1:5301/pyrefly-reprise/`, every chip's `src` reads
  `/pyrefly-reprise/art/portraits/<id>.png`, every one returns 200, and every
  one reports `naturalWidth === 832`. **Zero 4xx/5xx on any `/art/` request**
  across the battle, chapter-select, party-prep, results and cutscene screens.

The party's PNGs were loading perfectly on the live site the whole time. They
were being **painted over**.

`.ffx-portrait-fallback` (the monogram) is `position: absolute` in
`ffx-hud.css`; the portrait `<img>` was left in flow with no `z-index`. A
positioned element paints above a non-positioned one whatever the DOM order
says, so the letter sat on top of a fully loaded face. The enemies looked
*right* for the same reason the party looked wrong: their body-crop layer
(`characters/<id>/idle.png`, added in round 2) carries its own inline
`position: absolute`, so it won the stack — and, on an enemy that also has a
dedicated portrait, it was covering that too.

### The fix

`portraits.ts` now pins all three layers with an explicit `z-index` —
monogram `0`, body crop `1`, dedicated portrait `2` — and gives the face layer
the measured head crop from `common/portrait.ts`'s `CROPS` table (the same
geometry party-prep and chapter select already use) rather than leaving it to
the frame CSS's `object-fit: cover`, which at a 46px tile is mostly hair and
sky. `wirePortraitFallbacks`' async sidecar refinement re-states `z-index: 1`
because it writes `style.cssText`, which would otherwise drop it and float the
body crop back in front. (Landed in `38b0723`; not yet deployed — see §4.)

---

## 2. Tests

### `tests/e2e/portraits.spec.ts` (new)

Playwright, against `vite preview` — which serves the **built** bundle under
the production base (`playwright.config.ts`), so this file is the only place
in the repo that exercises the URLs that actually ship.

1. *the FFX CTB queue shows a real portrait for every party member and enemy* —
   reads every row's layers back out of the DOM with `naturalWidth`, the
   computed `z-index` and the real bounding box, and asserts, per row: a
   painted layer exists at all; its `src` starts with the deployed base plus
   `art/`; it loaded; it occupies a non-zero box; and a loaded layer out-ranks
   the monogram. Those five are deliberately separate assertions with separate
   messages, because "a letter where a face should be" is the same screenshot
   for a missing id, a 404 and a stacking bug, and the next person to hit it
   should not have to guess which.
2. *the party status window, results, chapter select, party prep and cutscene
   portraits all resolve* — the same base/load check over every `<img>` and
   every computed `background-image` on the five screens that build art URLs
   of their own.

Both tests fail the run on any `/art/` response of 400 or worse, which is the
cheap screen-agnostic half of the base-path guard, and both assert the base
read from the config's `baseURL` rather than the literal `/pyrefly-reprise/`,
so a `BASE_PATH=/` build (a user page or a custom domain) tests itself
correctly instead of going red on a string.

**One gotcha worth knowing before you write another HUD e2e test.**
`__pyrefly.goto('battle')` stages the encounter but leaves the HUD *down*:
FFX's opening (`engine/BattleMoments.ts` `battleStart`) keeps the CTB list and
command window off-screen for the party slide and boss reveal and raises them
on the way out, and a `goto()` straight to the screen never runs that opening,
so `FFXBattleHud.el.hidden` stays `true` indefinitely. A hidden ancestor gives
every tile a 0x0 box — which reads exactly like a portrait that failed to
paint. The spec's `raiseHud()` helper uses `BattleScreen`'s own `hud:on` debug
trigger, so this stays a test of the portrait chips rather than of the opening
cinematic (which under SwiftShader is minutes of animation before a tile is
legible; `gotoChapter('seymour-flux', …)` never got the HUD up inside 60s
headless).

### `tests/unit/ui-portrait-urls.test.ts` (new)

jsdom, 7 tests, the cheap guards for both halves. Under vitest
`import.meta.env.BASE_URL` is `/`, so nothing here can prove the deployed base
works — what it pins is the *shape* every builder must have. The base check is
`src.indexOf('art/') === BASE.length`, not `toContain('art/')`: the latter
passes on a hand-written `/art/…` literal under a `/` base, which is precisely
the deployed bug in source form. Plus the alias table
(`seymour-flux` → `seymour.png`), the three-layer `z-index` order, the fact
that the face layer is positioned at all, and that a key-less chip still
renders a monogram and no `<img>`.

---

## 3. Verification

* `npx tsc --noEmit` — clean for every file in this round. Two errors in
  `tests/unit/pause-objectives.test.ts` (`actorId`/`targetId` not on
  `Omit<BattleEvent,'seq'>`) appeared mid-session and their line numbers moved
  between two consecutive runs: another agent is editing that file right now.
  Not this round's, and not fixed here.
* `npx vitest run` — **2,851 passed, 2 failed, 84 files.** Both failures are
  the concurrent-edit fallout above: `pause-objectives.test.ts` (the same file
  tsc is complaining about) and a 15s hook timeout importing `PartyPrepScreen`
  in `party-prep-panels.test.ts`. Re-run together in isolation immediately
  afterwards, **both pass (56/56)** — the tree was being written under the
  run, not broken by it.
* `npx playwright test tests/e2e/portraits.spec.ts` with `PREVIEW_PORT=5301`
  against the production bundle — **2 passed**.
* Screenshots from that same production preview:
  `docs/screenshots/bp1/ctb-portraits-prod.png` (full frame) and
  `ctb-portraits-prod-zoom.png` (the CTB column). Tidus, Kimahri and Yuna show
  their measured portraits; Seymour Flux shows `portraits/seymour.png` through
  the alias; Mortiorchis, which has no dedicated portrait, shows the crop of
  its own idle painting. No monograms anywhere in the queue.

Build and preview used, per this round's rules (no `npm run build`):

```
npx vite build --outDir critic/scratch/prod-portrait-basepath
npx vite preview --outDir critic/scratch/prod-portrait-basepath --port 5301 --strictPort --host 127.0.0.1
PREVIEW_PORT=5301 npx playwright test tests/e2e/portraits.spec.ts
```

The e2e suite reuses an already-running preview on `PREVIEW_PORT`
(`reuseExistingServer`), which is how it was pointed at the scratch bundle
instead of `dist/`.

---

## 4. For the deployer

**The fix is in the tree but not on the live site.** `38b0723` is a local
checkpoint; `docs/screenshots/bp1/ctb-portraits-prod.png` is what Pages will
look like after the next deploy, and the letters the report saw are still what
is served until then. Nothing about the deploy procedure needs to change — the
base was never the problem.

## 5. Files

* `tests/e2e/portraits.spec.ts` — new (this pass: the `raiseHud` helper, the
  split per-layer assertions, `trigger` on the local `PyreflyApi` shape).
* `tests/unit/ui-portrait-urls.test.ts` — new.
* `src/ui/ffx/portraits.ts` — the three `z-index` layers and the measured face
  crop.
* `docs/screenshots/bp1/ctb-portraits-prod.png`,
  `ctb-portraits-prod-zoom.png` — re-captured from the production preview.
* Scratch (not part of the deliverable):
  `critic/scratch/probe*-portrait-basepath.mjs`,
  `critic/scratch/shot-portrait-basepath.mjs`,
  `critic/scratch/prod-portrait-basepath/`.

### Noticed in passing, not touched

`src/ui/ffx/ffx-hud.css.tmp.26120.46696653a84f` is an untracked leftover from
an interrupted edit (the machine restart). `ffx-hud.css` belongs to the
framing agent, so it was left alone — but it is junk and should be deleted by
whoever owns that file.
