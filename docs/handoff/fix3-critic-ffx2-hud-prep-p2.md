# Critic pass 2 — ffx2-hud-prep

Adversarial verification of the `ffx2-hud-prep` **fix** round (`b8e3889`,
`d9ec63e`, `2ecea63`) against its own handoff, `docs/handoff/fix3-ffx2-hud-prep.md`.

Driven live on two vite dev servers with real `page.keyboard` presses:

- **post** — the working tree, port 5541
- **pre** — a throwaway `git worktree` at `b8e3889^`, port 5802, so every
  before/after number below comes from the *same probe on both builds*, not from
  a previous round's notes

Evidence under `docs/screenshots/fix3/critic-ffx2-hud-prep-p2/`. `critic/scratch/`
and `critic/rounds/*/` are both gitignored, so the rigs are committed next to
the evidence as `.../critic-ffx2-hud-prep-p2/rigs/` — every number below can be
re-made from them, and the machine has crashed three times today.

**Verdict: REFUTED.** Two findings, both reproducible, both inside this track's
own files. The four fixes the round set out to make are real — three of them
verify cleanly and harder than the builder drove them. The refutation is that
fix 1 traded the defect it closed for a different one, and that its companion
claim ("Critic 1b") describes the opposite of what the code does.

---

## 1. The chain chip is no longer anywhere near the enemy it counts

`research/visual-bible.md` §4.6 anchors the chain popup "top-right of the enemy
being chained", and `ChainCounter`'s own doc comment promises it "keeps its
anchor when the spot is free and steps aside when it is not". After `b8e3889`
it **never** keeps it.

The same probe, same seed, same chapter, same viewport, on both builds — the
chip's placed rect against the chained enemy's projected head:

| | chip box | enemy head | vertical | horizontal |
|---|---|---|---|---|
| ch4 1280x720 **pre** | 167.2x94.5 @(627.7, 12.2) | (708.8, 123.2) | bottom **16.5 px above** the head | 81 px |
| ch4 1280x720 **post** | 243x138 @(376.7, 101.5) | (709.6, 122.7) | bottom **116.8 px below** the head | **333 px** |
| ch4 2560x1440 **pre** | 334.4x189 @(1255.6, 25.5) | (1417.7, 246.5) | 32 px above | 162 px |
| ch4 2560x1440 **post** | 485x275 @(757, 199.1) | (1417.8, 245.1) | **229 px below** | **661 px** |
| ch5 1280x720 **pre** | 167.2x94.5 @(574.1, 16.5) | (651.6, 127.5) | 16.5 px above | 77.5 px |
| ch5 1280x720 **post** | 243x138 @(315.3, 101.5) | (651.8, 127.4) | **112.1 px below** | **336 px** |
| ch5 2560x1440 **pre** | 334.4x189 @(1150.7, 34.5) | (1304.3, 255.5) | 32 px above | 153.6 px |
| ch5 2560x1440 **post** | 485x275 @(636.3, 199.1) | (1304.5, 253.6) | **220 px below** | **668 px** |

`anchor-pre-ch4-1280x720.png` and `anchor-post-ch4-1280x720.png` are the same
frame on the two builds: the chip goes from sitting on Bahamut's head to
floating in empty arena 250 px to his left and 90 px lower, reading as an
unrelated box. `rightOfEnemy && aboveEnemy` is **false in 32 of 32 cells**
(counts 3/7/12/22 x 4 viewports x 2 chapters); the full matrix is `chain.json`.

To be fair to the round: the **pre** placement was not strictly §4.6 either —
the chip's left edge sat left of the head, so it read as *over* the enemy rather
than top-**right** of it, and its top was clipped by the overlay, which is the
defect this round set out to close and did. But its centre was within ~2 px of
the head's x in every pre cell (711 vs 708.8 at ch4 1280x720), so it was
unmistakably that enemy's counter. Post, the centre is 211-500 px away and
below. The anchor was the thing that made the popup mean something, and the
reservation spent it.

### Why

The fix is right that the solver has to see the painted box. Where it goes wrong
is *when*. `show()` now reserves the 1.45x peak **permanently** — 2.1x the area
the chip occupies for all but 0.18 s of its 1.4 s life — and offsets the natural
spot by half the reserve on each axis:

```ts
const natural = { left: anchor.x + 12 * scale - padX, top: anchor.y - bh - 8 * scale - padY };
```

With `padY = (1.45·bh - bh)/2`, the reserved box's bottom lands at
`anchor.y + 0.225·bh - 8·scale` — i.e. **below the head it is anchored to**, so
the chained enemy is now an obstacle to the chip's own anchor, and `natural.top`
goes negative at 1280x720 (measured: -9.8). `placeSlab` only ever searches
*downward* (`tops.add(Math.max(wanted, o.bottom + DODGE_GAP))`, and
`if (top < wanted - 0.5) continue`), so with the anchor unusable it falls to the
first free column it can find, which is the far side of the stage.

The round's own rig could not see this because it asserted only "painted box
does not overlap anything". It does not. It is also not where §4.6 puts it.

### What would close it

Reserve the peak only while the pop is running, or keep the anchor and let the
0.18 s peak overhang a *known-empty* margin, or teach `placeSlab` an upward
candidate so a top-anchored slab can be pushed up into the headroom instead of
being evicted sideways. Whatever the shape, the acceptance test has to assert
the anchor, not just the absence of overlap — `chain.json`'s `anchorCheck`
block is a ready-made assertion.

---

## 2. The chain-20 "flash" is a permanent full-screen veil, and 1b widened it

The handoff's **Critic 1b** claims the transform removal restored §4.6's
full-screen flash: *"the flash is viewport-fixed throughout"*. §4.6 asks for a
**one-frame** `#FFD9EC` flash at 15 % **on each increment**. The rule is:

```css
.ffx2-chain-chip.ffx2chain--flash::after {
  content: ''; position: fixed; inset: 0; background: #ffd9ec; opacity: 0.15;
}
```

Live computed style, all four runs: `animation-name: none`, `animation-duration:
0s`. There is no keyframe, so there is nothing to restore — the veil is simply
**on for as long as the chip carries the class**, which `CHAIN_HOLD_MS` makes
1.4 s and every further increment extends.

Measured rather than argued (`flash.mjs`): screenshot the same frame with no
chip at all, then 700 ms after a count-12 increment, then 700 ms after a
count-22 one — long after both the 0.18 s pop and the 0.42 s mote burst have
finished — and diff the four viewport corners, as far from the chip as the frame
allows:

| | corner shift vs no-chip (max abs, 0-255) |
|---|---|
| ch4 1280x720 count 12 | 0, 0, 0, 1 |
| ch4 1280x720 **count 22** | **35, 37, 36, 36** |
| ch4 2560x1440 count 12 | 0, 0, 0, 0 |
| ch4 2560x1440 **count 22** | **35, 36, 36, 36** |
| ch5 1280x720 count 12 | 0, 1, 0, 0 |
| ch5 1280x720 **count 22** | **32, 31, 32, 32** |
| ch5 2560x1440 count 12 | 0, 1, 0, 1 |
| ch5 2560x1440 **count 22** | **31, 29, 32, 32** |

`flash-ch5-1280x720-1-count12.png` next to `flash-ch5-1280x720-2-count22.png`
shows it plainly: at 22 the whole frame — boss, party, ink panels, portraits —
is washed milky pink, and stays that way.

The part that makes this a finding against *this* round rather than a
carried-over one: while the chip was transformed, the `position: fixed`
pseudo-element was clipped to the chip's own box, so for the 0.18 s of each pop
the veil was small. Removing the transform makes it cover the whole viewport
for **100 %** of the chip's life instead of ~87 %, and the handoff books that as
a fix. §4.6's flash needs a keyframe (one frame on, then off) before the
viewport-fixed positioning is an improvement.

---

## What verifies — and was driven harder than the round drove it

**Fix 2, cancelling out of target selection — holds.** Five consecutive turns
per cell, across both FFX-2 chapters at 1280x720 and 2560x1440, seeding *every*
submenu on each actor's row list before cancelling (the builder seeded Change
only, on one turn, for whichever girl the ATB happened to hand it to). Both
branches of `pendingFrom` are exercised by the data itself: chapter 4 gives
`Attack` as a top-level leaf, chapter 5 as a group row, and the three girls
carry different submenus (`Skill` / `White Magic` / a Dark Knight `Skill` set).
In every run the cancel landed exactly where the command was picked from,
reticles went to 0, the window was never empty, a row was always selected
afterwards, and **no run ever produced a `spherechange`** — the committed log
reads `turn-start, action-start, chain, damage, action-end`. A second Esc at the
top row still opens the pause menu, so the cancel claim is taken *and given
back*. `cancel2.json`.

**Fix 3, the gate rows — holds, for everything the shipped chapters can
reach.** `.ffx2cmd--gate` rows measure `label scrollWidth == clientWidth` with
zero paint outside the row box, for all three girls in both chapters at both
viewports: `Gunner` 96/96, `Black Mage` 107/107 (gated) and 72/72 (ungated),
gate lines unclipped, marker correctly absent on ungated rows. One caution for
whoever owns this next: `Black Mage` measures **107 against a 107 px content
line**. The fix has no headroom at all, and `dressphereLabel` derives names from
ids, so a grid state that makes `Dark Knight` or `Festivalist` reachable will
paint outside the row (`overflow: visible` on `.ffx2cmd--gate .ffx2cmd__label`
means it will *not* show as an ellipsis — `scrollWidth` will keep reporting
"fine"). Worth a width assertion with margin rather than an equality.

**Fix 1's overlap claim — holds.** Painted body *and* the reserved box clear
of every living fighter and of `.eint__panel`, `.eint__toggle`, `.mad__card`,
`.ffx2hud__enemies`, `.sgd__panel`, `.ffx2hud__party`, `.ffx2hud__command` and
the spherechange wheel, and inside the overlay, in all 32 cells.

**Fix 4 —** `npx tsc --noEmit` clean; the five targeted files 145/145 green.

**The three carried-over defects from the original brief — re-checked on this
build, not taken on pass 1's word** (`portraits-prep.mjs`, zero failures):

- *(1) FFX-2 party portraits.* Every row in chapters 4 and 5 resolves a real
  painting with a non-zero natural size and no fallback chip: Yuna
  `yuna-white-mage/idle.png` 581x1183, Rikku `rikku-dark-knight/idle.png`
  787x1205, Paine `paine-warrior/idle.png` 408x1180 (ch4) and
  `paine-dark-knight/idle.png` 609x1208 (ch5) — per current dressphere, as the
  brief asked.
- *(2) the FFX-2 prep tab set.* `CHAPTER / DRESSPHERES / STATS / ACCESSORIES /
  ITEMS` against FFX's `CHAPTER / STATS / SPHERE GRID / EQUIPMENT / ITEMS /
  OVERDRIVE`, at 1280x720 and 2560x1440, in both X-2 chapters, reading real
  loadout data (7 chips in ch4, 11 in ch5). No raw kebab id appears on any chip
  or in any panel body, on either game's prep screen — the FFX-side fix 4 has no
  X-2 twin left to find.
- *(3) portrait crops.* Checked off the pixels rather than off the table:
  extracting a head-sized box at each row's measured eye point gives six clean
  faces — Auron (his glasses on the eye line), Tidus, Yuna, Kimahri, Seymour,
  Yunalesca — in `facecrops-ffx-portraits.png`.

**`yuna-white-mage`'s re-measured row is right.** Verified off the pixels, not
from the table: the new `fx 0.6333, fy 0.1079, ipd 0.0861` puts a head-sized
box squarely on her face (`facecrop-yuna-white-mage.png`). The old row's box
(`-OLDROW.png`) does not. Note the guard test only proves the row is
self-consistent — `px` matches the file and the derived eye line hits the house
target — so a wrong `fx`/`fy` would still pass it.

**The red test really is not this round's.** `tests/unit/menu-cancel.test.ts:195`
fails identically in a clean worktree at `b8e3889^`: `expected true to be false`
at the same line, 1 failed / 9 passed both times.

---

## Also found, not this round's, but in this track's lane

The FFX-2 command window's submenus **overflow their own scroll box** with no
visible affordance, at both viewports in both chapters:

- `Item` — `scrollHeight 227` against `clientHeight 220` (the 8th row, "Light
  Curtain", is below the fold)
- ch5 `White Magic` — `scrollHeight 440` against `clientHeight 220`: sixteen
  rows, **more than half of them off-screen**, including `Full-Cure` and the
  `White Magic Lv. 2 / Lv. 3` rows

No gate rows are involved, so this predates `b8e3889` — but `.ffx2hud__command`'s
`max-height` is this track's file, and `CommandMenu.ts`'s module comment claims
the stack "scrolls ... rather than clipping silently". It scrolls; nothing on
screen says so.

---

## Re-running any of it

```
npx vite --port 5541 --strictPort                       # the build under test
node docs/screenshots/fix3/critic-ffx2-hud-prep-p2/rigs/flash.mjs     # finding 2
node docs/screenshots/fix3/critic-ffx2-hud-prep-p2/rigs/chain.mjs     # finding 1, full matrix
node docs/screenshots/fix3/critic-ffx2-hud-prep-p2/rigs/cancel2.mjs   # fixes 2 and 3, hostile
node docs/screenshots/fix3/critic-ffx2-hud-prep-p2/rigs/portraits-prep.mjs
```

`rigs/anchor.mjs` additionally needs the pre-fix server. A worktree at `b8e3889^`
whose `node_modules` is a junction needs its own `cacheDir`, or vite's optimizer
fails every request — `vite.pre.config.mts` in that worktree is the two-line
override.
