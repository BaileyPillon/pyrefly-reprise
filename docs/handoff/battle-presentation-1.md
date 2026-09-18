# Battle presentation, round 1 — verification

**Key:** `verify`. Verifies the four battle-presentation rounds
(`portrait-basepath`, `actor-life`, `moments`, `strategy-guide`) against a
**production bundle served under the real deploy base**, not a dev server.

Wrote no source. The only files added are this document, the captures under
`docs/screenshots/90/`, and four harnesses under `critic/scratch/`.

| | |
|---|---|
| Bundle | `npx vite build --outDir critic/scratch/prod-verify` (449 modules, 1.60s) |
| Served | `npx vite preview --outDir critic/scratch/prod-verify --port 5310` at `/pyrefly-reprise/` |
| `npx tsc --noEmit` | clean |
| `npx vitest run` | **85 files, 2858 tests, all passing** |
| Five-chapter sweep | **5/5 victories, 0 console errors, 0 true 4xx/5xx** |

---

## 1. The three things that had to be true

### tsc and the suite are green

Both clean on the first run. Nothing from the four rounds needed fixing, so
this round changed no source at all.

The previous round flagged `tests/unit/pause-objectives.test.ts` as producing
two `tsc` errors and one failing assertion while a concurrent agent was editing
it. **That is resolved** — the file compiles and its assertions pass in the full
run. The other flagged leftover,
`src/ui/ffx/ffx-hud.css.tmp.26120.46696653a84f`, is gone from the working tree.
It is still in the `38b0723` commit's tree, so the next commit drops it; no
action needed beyond not re-adding it.

### The five chapters still win, in a production bundle, under the deploy base

`critic/scratch/sweep-verify.mjs`, a variant of `critic/scratch/sweep.mjs` with
the network log added. Fresh page per chapter, `auto:'intended'`,
`speed:'skip'`, seed 1.

| Chapter | Outcome | Turns | Links | Wall | Console errors |
|---|---|---|---|---|---|
| `seymour-flux` | victory | 82 | 1 | 254s | 0 |
| `yunalesca` | victory | 237 | 1 | 344s | 0 |
| `braskas-final-aeon` | victory | 97 | 7 | 464s | 0 |
| `ffx2-bahamut` | victory | 75 | 1 | 81s | 0 |
| `ffx2-vegnagun-shuyin` | victory | 58 | 5 | 495s | 0 |

### No 404s for art or portraits

**Zero true 4xx/5xx responses across all five chapters.** The portrait fix
holds under the real base: `docs/screenshots/90/44-battle-open.png` shows the
CTB list with Tidus, Kimahri, Yuna and Auron's actual faces, not the ink
monograms the live site had.

### The gallery

`node tools/gallery.mjs --url=http://localhost:5310/pyrefly-reprise/
--out-dir=docs/screenshots/90 --report=critic/scratch/gallery-90.json`

**15 frames, `errors: []`, `notes: []`.** Every chapter reported
`placeholder: false` and `preview: false` — real scenes and a real engine, not
stand-ins. Chapter 1 played the full flow to a `victory` (82 turns, +10,000 AP,
a Lv 4 Key Sphere). The `"outcome": "timeout"` on chapters 2–5 is only the
gallery's own 60-second race giving up on watching a chapter finish after it
has taken its shot; the sweep above played all five to victory.

The guide is **on by default**, so it is up in every battle frame
(`44`–`48`); `54-guide-on-ffx2.png` is the explicit FFX-2 guide-on capture
with the chip measurement in issue 3.

| | |
|---|---|
| Front end | `40-title`, `41-chapter-select` |
| Chapter 1 flow | `42-party-prep`, `42b-sphere-grid`, `43-pre-cutscene`, `44-battle-open`, `45-battle-skills`, `46-attack`, `47-boss-attack`, `48-overdrive`, `49-results` |
| Each chapter | `50-yunalesca`, `51-bfa`, `52-ffx2-bahamut`, `53-ffx2-vegnagun` |
| Guide | `54-guide-on-ffx2` |

One capture-timing note for whoever reads `50`–`53`: the battle-start moment
holds the HUD down for several seconds, and the gallery's `settle()` fires
inside that window, so those four frames are the camera intro **without
chrome**. They are good evidence about composition and art and say nothing
about the HUD. The same trap bit the first run of `measure-guide-chip.mjs`,
which measured all-zero rects because the HUD hides via `el.hidden`; it now
waits for real geometry before measuring.

---

## 2. The 404 check is weaker than it looks — read this before trusting one

The sweep recorded **265 non-OK responses**, every one `net::ERR_ABORTED` on an
`/art/characters/<id>/<pose>.png`. Both halves of that are traps, and a future
round that re-runs this check should know which is which.

### The aborts are benign, and proving it took a second instrument

`critic/scratch/probe-art-aborts.mjs` re-ran chapter 1 recording, per URL, both
the failures *and* the successes. Result: **40 distinct aborted URLs, all 40 of
which were also served 200 in the same session, and none that were only ever
aborted** (`abortedNeverServed: []`). They are duplicate/superseded loads of
files that did load — the same subject is staged more than once (actor, CTB
body crop, party prep) and the loser of the race is cancelled. No art is lost.

### The real trap: a missing PNG is served as HTML with a **200**

`vite preview` answers an unknown path with the SPA fallback. So:

```
GET /pyrefly-reprise/art/characters/tidus/ready.png
200  2496 bytes  content-type: text/html      <-- this is index.html
```

**A missing texture cannot be found by looking for 404s on this server.** Of the
175 distinct aborted URLs across the sweep, 89 have no file behind them at all,
and every one of those answered 200. GitHub Pages returns a real 404 for these,
so the live site and the preview server disagree about this whole class.

Two things make this survivable, and both are already in the engine — neither
was added here:

* `BattlePresenterArt.probe()` gates on
  `res.ok && content-type.startsWith('image/')`, so the HTML body never passes
  as a texture and `resolveArt` falls through to the next candidate id.
* `PaintedArt.loadSubject()` falls a missing pose back to `idle`, and
  `POSE_FALLBACKS` resolves `defend → guard → ready → idle`.

`ready.png` and `defend.png` exist for **no** subject in the project; they are
requested by name and resolve to `idle` every time, by design.

**If you re-run this audit, assert on `content-type`, not on status.**

---

## 3. What the four rounds claimed, and whether it is there

All 21 files claimed across the four handoffs exist. Spot-verified beyond
existence:

* **`portrait-basepath`** — confirmed visually under the real base. The
  diagnosis in `bp1-portrait-basepath.md` (a z-index stacking bug, *not* a base
  path bug) matches what the production bundle does: every `/art/portraits/`
  request is 200 and the faces are on screen.
* **`actor-life`** — `tests/unit/engine/actor-life.test.ts` passes in the suite.
* **`moments`** — captures present under `docs/screenshots/bp1/moment-*.png`.
* **`strategy-guide`** — both test files pass; the panel draws in both HUDs;
  `G` is wired through `ControlsHint.GUIDE_HINT_ITEM`.

---

## 4. Remaining visible issues, ranked

Measured against the rails table in `docs/ENGINE-API.md` § HUD safe area. Both
HUDs are a 640x360 authoring stage scaled by `min(w/640, h/360)`, so at 1600x900
one stage px is 2.5 device px.

Nothing here is a crash, a lost battle or a missing file. They are all
"the frame is wrong", which is what this round was asked to look for.

### 1. The impact cut throws the fighters across the party HUD — `framing` + `moments`

`docs/screenshots/90/48-overdrive.png`, `47-boss-attack.png`.

`BattleMoments.impact()` cuts to `rigFor(target)` — `pick('party','action','idle')`
— and adds `cam.punch(0.11)` on a heavy hit. **The safe-area rule in
`docs/ENGINE-API.md` § HUD safe area is written for the `idle` and `action`
rigs only.** The `party` rig and the punched camera are a third and fourth
camera state that no scene's `ENEMY_SLOTS`/`PARTY_SLOTS` solution was ever
measured against, so `r2-framing-safe-area`'s guarantee simply does not cover
the frames the `moments` round added.

In `48-overdrive.png` Tidus's body and sword print straight across his own
row in the party status list (rail `0.629..0.964, 0.717..0.967`). In
`47-boss-attack.png` the same cut crops **Seymour Flux's head off the top of
the frame** — the boss of the chapter, unreadable for the length of the cut.

The same gap shows on the **boss reveal**, which uses `cam.push(MOMENT_PUSH.reveal)`:

* `51-bfa.png` — Braska's Final Aeon's shoulder and sword are cut off top-left.
* `53-ffx2-vegnagun.png` — Vegnagun is a very wide, near-horizontal subject, and
  the reveal pushes so far that the ship runs off the left edge while most of
  the frame is empty sky. The final boss's reveal is the worst-composed frame
  in the set.

This is the highest-ranked item because it is the one that undoes finished work
from another round, it fires on every heavy hit and every reveal, and neither
owner can see it from inside their own round.

Cheapest honest fix: extend the safe-area rule to name every rig
`BattleMoments` can cut to, then re-measure the five scenes against the `party`
rig the way `r2-framing-safe-area` §1 measured them against `idle`/`action`.

### 2. Six subjects have no painted art, and one of them already shows — `art fleet`

`docs/screenshots/90/47-boss-attack.png`: **Bahamut sits in the CTB queue as a
bare `B` monogram** while every other row carries a face.

`public/art/characters/bahamut/` holds `idle.1.png` and nothing else. The art
pipeline writes numbered candidates and a promotion step copies the chosen one
to the plain `<pose>.png` the engine loads; for **bahamut, ifrit, ixion, shiva,
vegnagun-body, vegnagun-head, vegnagun-leg** that promotion never ran.
`anima` and `yojimbo` are empty directories.

This is **not** crash damage from the restart: no snapshot under
`D:\Tools\pyrefly-art-backup\` (back to `20260915-1929`) has a promoted
`idle.png` for any of them either. It is unfinished work, and `public/art/` is
gitignored so no diff shows it.

Confirmed from the engine's own mouth, not inferred from the filesystem. The
probes caught `[painted] missing painting … — using a procedural placeholder`
for every pose of **bahamut, ifrit, ixion, shiva, vegnagun-leg and
vegnagun-node**.

**Scope it honestly, because the filesystem overstates this.** `resolveArt`
tries `[artIdFor(c), c.spriteKey, c.id]` and only falls back to a silhouette
when *every* candidate misses, so "no `public/art/characters/<id>/idle.png`"
does not by itself mean "renders grey". `probe-actor-placeholders.mjs` asked
the running game instead, and at battle-open:

| Chapter | Staged actors | Placeholders |
|---|---|---|
| all five | 4–6 each | **0** |

So the bosses and the party are all painted — Vegnagun included, which is why
`53-ffx2-vegnagun.png` shows a real ship. What is actually broken is narrower
and still real:

* **Seen, in a production frame:** Bahamut's CTB row is a bare `B` monogram in
  `47-boss-attack.png`. The portrait path has no candidate-id fallback, so the
  gap shows there first.
* **Not seen, because the intended tactics never trigger it:** the *stage*
  silhouette only appears once one of those six is actually staged — a summoned
  aeon, or Vegnagun's Nodes and legs in the later phases of chapter 5 that the
  auto-battle resolves before they are drawn. The art is missing either way.

### Also worth an art pass

Three files still carry an un-cut white studio background and are being matted
at load time, each with its own warning: `seymour-flux-body/ko.png`,
`yunalesca-1/attack.png`, `yunalesca-1/cast.png`.

### 3. The guide's toggle chip overlaps the block it just cleared — `strategy-guide`

`StrategyGuide.layout()` (`src/ui/common/StrategyGuide.ts:289-315`):

```ts
const top = below.offsetTop + below.offsetHeight + CLEARANCE_GAP;  // gap = 5
this.toggleEl.style.top = `${Math.max(0, top - 11)}px`;            // 11 back up
```

The panel clears the `below` anchor by 5px and the chip is then placed 11px
above the panel — i.e. **6 stage-px above the bottom edge of the anchor the
panel just cleared**, every time that anchor is laid out.

Measured live rather than derived, by `critic/scratch/measure-guide-chip.mjs`
against chapter 5 in the production bundle (1600x900, so 2.5 device px per
stage px):

```
below (.ffx2hud__enemies)  top  44.4   bottom 91.9   left  53.3  right 650.7
chip  (.sgd__toggle)       top  77.5   bottom 96.3   left  51.3  right 177.4
panel top 105.0            verticalOverlapPx 14.4
```

which is the formula exactly: `panelTop = 91.9 + 5x2.5 = 105`,
`chipTop = 105 - 11x2.5 = 77.5`, overlap `91.9 - 77.5 = 14.4` device px =
**5.76 stage px**. The boxes overlap horizontally too, so it is a real 2-D
collision, not a near miss.

Captured in `docs/screenshots/90/54-guide-on-ffx2.png`, and visible in
`docs/screenshots/r2/framing-ffx2-vegnagun-shuyin.png` (the chip over the
`Vegnagun … SCAN` bar) and `docs/screenshots/bp1/guide-ffx-watch.png` (against
FFX's action banner).

The fix is to make the panel leave room for its own chip rather than have the
chip reach back over the anchor:

```ts
const CHIP_CLEARANCE = 11;
const top = below && below.offsetHeight > 0
  ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_CLEARANCE
  : anchors.top;
```

**This moves an assertion the guide's own suite pins**:
`tests/unit/ui-strategy-guide.test.ts`, "starts below its top anchor and stops
above its bottom one", expects `panel.style.top` ≈ `49` and `maxHeight` ≈ `186`;
they become `60` and `175`. Left unapplied here because the file and its test
belong to the `strategy-guide` agent and the change is theirs to make
deliberately.

### 4. The sensor panel prints through the top-centre banners — `framing`

Two instances of one collision, already reported by `moments` and re-measured
here:

* **Telegraph banner** (`docs/screenshots/bp1/moment-17-telegraph-banner.png`):
  `.ffx-telegraph` spans x `0.315..0.685`, `.ffx-sensor` sits at
  `0.300..0.482`. The banner overprints the sensor's name, its HP readout
  *and* its HP bar, and clips the affinity chips.
* **Action banner** (`docs/screenshots/bp1/guide-ffx-watch.png`): the sensor
  cuts the banner's own text — it reads `ENTERS AUTO-ATT_CK MODE`.

So it is not specifically a telegraph bug: **`.ffx-sensor`'s rail overlaps the
top-centre banner zone**, and whichever of the two is up loses. Fixing it once,
for the zone, beats fixing it twice. `ffx-hud.css` is the framing agent's.

### 5. The guide panel clips its own last line, and covers a party member — `strategy-guide` + `framing`

`docs/screenshots/90/44-battle-open.png`: with the command stack open the rail
shrinks until the panel renders the **`RULES` heading with nothing under it**,
which reads as a broken panel rather than a short one. In
`45-battle-skills.png` and `47-boss-attack.png` the last rule is cut
mid-sentence (`…guaranteed Death.` faded out at the panel edge).

Separately, in `44`/`45` the leftmost party member — Yuna — is painted
**behind** the guide panel and is largely hidden by it. The panel is
`0.033..0.240`; the party's left slot reaches into it. Default-on chrome
covering a party member is worth one of the two owners moving.

A `sgd--compact` mode already exists for the squeezed case; the gap is that it
does not drop a section heading whose body does not fit.

### 6. Damage numerals sit flush against the frame edge — `numerals`

To be fair to the round that built it: the clamp **is** there and it is working.
`DamageNumbers.ts` builds a safe rect (`safeAreaFrom`/`placeInSafeArea`) and
`deflectFromRects` clamps into it, which is why no numeral in any of these
captures collides with the CTB column or the party list. The gap is that the
safe rect's outer edge is the raw canvas edge, so "inside the safe area" still
permits a numeral sitting flush against — and therefore half over — the frame
boundary:

* `47-boss-attack.png`: `578` / `604` at y≈`0.01`, touching the top edge.
* `46-attack.png`: **`+1500` and `371` are cut by the left and bottom edges.**

The second one is the telling case, and it is really issue 1 wearing a
different hat: during the impact cut the party is off-frame to the left, so
their numerals clamp to the frame edge and land half outside it. A few px of
inset on the safe rect fixes the cosmetic half; the numerals only pile up at
the edge at all because the cut took their owners off-screen.

### 7. Two portrait crops are tight — `art fleet`, cosmetic

`docs/screenshots/90/42-party-prep.png`: Auron's crop is mostly sunglasses and
Wakka's mostly bandana, where Tidus/Yuna/Kimahri/Rikku are framed on the face.
A `CROPS` entry each in `src/ui/common/portrait.ts`.

---

## 5. Harnesses left behind

| File | What it does |
|---|---|
| `critic/scratch/sweep-verify.mjs` | the five-chapter sweep **plus** the network log; fails the run on a lost chapter, an art failure or a console error |
| `critic/scratch/probe-art-aborts.mjs` | separates a real missing texture from a cancelled duplicate load, by recording successes alongside failures and reading the engine's own `[painted]` warnings |
| `critic/scratch/probe-actor-placeholders.mjs` | asks the running game which staged actors are procedural silhouettes, via `BattlePresenterStage.snapshot()`'s per-actor `placeholder` flag |
| `critic/scratch/measure-guide-chip.mjs` | measures the strategy-guide toggle chip against the anchor it is meant to clear, in either HUD |

Reports: `critic/scratch/sweep-verify-report.json`,
`critic/scratch/gallery-90.json`, `critic/scratch/placeholders.json`.

`tsc` and the full suite were run again after all of the above and are still
clean: **85 files, 2858 tests, 0 failures.** This round wrote no source, so
that is a statement about the tree, not about anything done here.

## 6. Housekeeping for other owners

* `src/ui/ffx/ffx-hud.css.tmp.26120.46696653a84f` — deleted from the working
  tree, still in `38b0723`'s tree, so the next commit removes it. Nothing to do
  beyond not re-adding it.
* `tools/zz-probe-resume.tmp.mjs` and `tools/zz-verify-pause.tmp.mjs` are new
  untracked scratch files from a concurrent agent (pause/resume work). Left
  alone — not this round's to delete.
* `docs/screenshots/bp1/moment-09-overdrive-slab.png` and
  `moment-12-telegraph-vignette.png` are superseded by `moment-16` and
  `moment-18`/`19`, as `bp1-moments.md` already records.
