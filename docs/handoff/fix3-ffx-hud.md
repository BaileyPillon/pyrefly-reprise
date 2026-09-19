# fix3 — FFX battle HUD

Round 03, second pass. The first pass was refuted by the adversarial gate
(`critic/rounds/round-02.md` plus the gate's own harnesses under
`critic/scratch/`), which drove the **built** build with real keyboard input on
the real GPU and measured every panel against every fighter. This pass answers
its four reproducible failures and re-verifies with the gate's own harnesses,
unchanged, at four viewports.

Commits: `b2e4130`, `215c619`, and the E-chip fix that follows them.

---

## 1. What the gate refuted, and what each fix was

### (1) Chapter 2's card was printed across the whole party — BLOCKER

`advisorZone` answered `null` at all four viewports, and `placeAdvisor`'s null
branch **did not take the card down**: it cleared the inline box and handed the
card back to `MoveAdvisor`'s own unguarded anchor, which in Chapter 2 is the
middle of the party. Measured at 1600x900: 7 465 grid px² of the card on Tidus,
4 125 on Yuna, 1 781 on Auron, with the `N HIDE MOVES` chip on Yuna's head.
`hudSafeZones.ts`'s own header had promised the opposite behaviour the whole
time.

Both halves are fixed:

* `null` now means what the header says. The card comes down and the chip is
  docked by `advisorChipDock`, which is the same search that failed to find a
  card-sized box, so the chip lands on ground that is genuinely clear.
* `null` is a much rarer answer, and the three shipped chapters never reach it
  — see §2.

### (2) All three chapters took a narrow pocket, on the boss — BLOCKER

Chapters 1 and 3 took `pocket-narrow` at 83 and 85 grid px — 49 under the width
`MoveAdvisor` was designed at — and the pocket ran from the party's right edge
to the party-status column, which in every chapter is straight through the
boss: 773 grid px² of Seymour Flux, 1 626 of Braska's Final Aeon, 358 of the
right-hand Yu Pagoda, plus 44-85 of Kimahri.

Three things were wrong and all three are now arithmetic rather than prose:

* **Enemies were never an input.** `AdvisorZoneInput.enemies` exists now and
  `FFXBattleHud.enemySpriteRects` fills it from the same projector and the same
  three measured ratios the party's rects use.
* **Three hand-written placements cannot see a fourth.** Each of the pocket,
  the shelf and the narrow pocket was a *sentence about the screen*, and
  Chapter 1's real answer is a sentence nobody wrote: *between the strategy
  guide's rail and Seymour Flux, above the command window's help slab*.
  `solveBox` cuts the stage at every obstacle edge (plus `GAP`) and takes the
  best free rectangle instead. Cost is a few hundred strips swept once, when a
  decision opens.
* **The shear is paid for inside the box.** `getBoundingClientRect` on a
  `skewX`-ed element returns the bounds of the sheared shape, which is what
  every harness that has measured this HUD reported; the old file reasoned
  about which corner reached which neighbour at which height and was 44 grid
  px² of Kimahri wrong. `cardBoxInside` insets the card inside the solved box
  by `SKEW * height / 2` on each side, so "the box is clear" and "the painting
  is clear" are one statement at any height the density ladder settles on.

One consequence worth naming: the card's painted width is
`width + SKEW * height`, so in a band that is only just wide enough a **shorter
card is a wider one**. Chapter 1's band is 152.4 grid px; at the full 104 of
height the widest card that fits is 130.3, under the 132 minimum — which is
exactly why the old solver declined and fell to the pocket — and at 93 it is
132. `solveCard` caps the height at `(boxWidth - minWidth) / SKEW` for that
reason.

### (3) A new always-on slab was printed over the party — BLOCKER

`commandHelp.ts` (round-02 #27) gave every ability row a help sentence, so
`.ffx-cmd-info` went from "up for items only" to "up on every decision" — and
it rode `GAP` above the command stack, whose height swings 90 grid px between
the top-level menu (top 166.4), a submenu (258) and targeting (231). The one
panel up on every decision travelled with it: 1 366 grid px² on Yuna in Chapter
3 at 1280x720 in ten of thirteen states, and 1 900 + 3 140 on Tidus and Yuna in
Chapter 1 with a White Magic list open.

It has a **fixed slot** now: grid x 24..196, y 121..154, written once in
`ffx-hud.css` and repeated as `CMD_INFO_SLOT` for the solver. The numbers:

| constraint | value | margin |
|---|---|---|
| highest party head in this column (Yuna, Ch.1) | y 158.4 | 4.4 grid px |
| leftmost party member who stands this high (Kimahri, Ch.1) | x 200.8 | 4.8 grid px |
| strategy guide's rail, new floor | y 115 | `GAP` |
| command stack at its tallest (`MAX_VISIBLE_ROWS` rows) | y 166.4 | `GAP` + 6 |

The slab is also a **fixed width** (160px, painted 25..194). It was
`max-width: 240px` and sized itself to its sentence, which is refutation (4).

Two knock-on changes this needed:

* The slab is no longer a child of `.ffx-cmd-area` — that element is
  `position: absolute` and therefore its children's offset parent, so a
  bottom-anchored `column-reverse` flow was the only thing holding the slab up.
  It is a direct child of the stage with its own anchor.
* The **strategy guide's floor is a constant** (`anchors.bottom`) instead of
  `.ffx-cmd-area`'s travelling top edge. The rail used to be y 44..126 on the
  top-level menu and y 44..202 with a Skill list open, in the same fight; it is
  y 44..115 in every state now. It is 11 grid px shorter than its best previous
  state, which its own `MORE` affordance already covers.

### (4) The help slab ran under the enemy-intent slab

SWITCH's sentence — "Swap in a reserve member (L1 / Q). The member coming in
takes this turn." — grew the old `max-width: 240px` slab from 81 grid px to
248 and ran it 11 830 grid px² under the intent slab, from one keypress, and
the gate measured the same slab at five different widths in five consecutive
states of one menu. Fixed width plus a two-line clamp with an ellipsis; it
wraps rather than grows, and a longer sentence a later encounter brings says so
rather than reaching across the frame.

---

## 2. The change that made the rest possible: FFX ships the read-out folded

Round 02 #14 asked for "a default that does not hide the fight". The previous
answer was a shorter *body* (`density: 'brief'`). The gate measured what that
ships: **150 x 119 grid px**, at x 165..315 in Chapter 1 and x 176..326 in
Chapter 2 — the band directly above the party's heads, which on a 640x360 stage
is also the only ground wide enough for the advisor card.

Two opaque slabs, one band. The one that explains *the decision the player is
making right now* is the one to keep, so FFX opens a battle with the enemy-move
read-out folded to its chip and `E` opens it for that fight. With it folded all
three chapters solve a 132px card in clear sky; with it open the solver still
answers honestly (a clear box or `null` and a docked chip), which the test file
exercises.

**FFX-2 is untouched.** `Settings.intentVisible` is shared and still defaults
on; FFX overrides `readVisible`/`writeVisible` so its choice is session-local
and cannot leak across games. That is Bailey's rule of 2026-09-19 — a change
true of one game is not applied to the other — applied literally.

---

## 3. How it was verified

**Not by grep, and not with my own harness.** The build was made with
`npx vite build`, served with `vite preview --port 5741 --strictPort` (a built
preview, so a concurrent agent's HMR cannot reload the page), and driven with
real `page.keyboard` input in headless Chromium on the real GPU. The harnesses
are the **gate's own**, unchanged:

* `critic/scratch/advisor-zone-live.mjs` — 12 chapter x viewport combinations,
  reads the live `advisorZone` result and `dataset.zone`.
* `critic/scratch/ffx-hud-hostile.mjs` — 13 states per run; every panel against
  every projected fighter, panel-vs-panel at a 1 px² threshold, frame-edge
  clipping, CTB `scrollWidth`, a citation regex over all player text.

### Before and after, the gate's own numbers

| | gate build (`e68c21d`) | this build |
|---|---|---|
| Ch.1 zone | `pocket-narrow`, 83 wide | **`shelf`, 132 wide** |
| Ch.2 zone | **`null`**, card drawn anyway | **`shelf`, 137-141 wide** |
| Ch.3 zone | `pocket-narrow`, 81-85 wide | **`shelf`, 133 wide** |
| advisor card on a fighter | 44-7 465 grid px², 12/12 combinations | **0, 12/12** |
| `N` chip on a fighter | 116-2 457 grid px² | **0** |
| help slab on a fighter | 26-1 416 grid px² | **0** |
| help slab under the intent slab | 748-11 830 grid px² | **0** |
| panel-on-panel, any pair | present | **0** |

Raw output: `docs/screenshots/fix3/ffx-hud/hostile-*.json` and
`docs/screenshots/fix3/critic-ffx-hud/advisor-zone-live.json` (the gate's file,
rewritten by its own script on this build).

Screenshots, 13 states x 3 chapters x 4 viewports, in
`docs/screenshots/fix3/ffx-hud/<chapter>-<viewport>-<state>.png`. The three
worth opening are `yunalesca-1280x720-01-menu.png` (the shape of refutation 1,
now clear), `seymour-flux-1280x720-01-menu.png` and
`braskas-final-aeon-1280x720-07-submenu.png`.

### Tests

`npx tsc --noEmit` clean. `tests/unit/ui-ffx-hud-safe-zones.test.ts` (63),
`ui-ffx-hud.test.ts` (38), `ui-enemy-intent.test.ts` (34),
`ui-ffx-enemy-plate.test.ts`, `ui-strategy-guide.test.ts`,
`ui-move-advisor.test.ts` — 209 green.

Every refuted number is pinned rather than described. The fixture the old tests
passed against had the intent slab at x 344..494, which is where it sits on a
*mock* screen; on the real one it is at x 165..326, and that one stale rect is
why a file full of green assertions shipped a card across Chapter 2's party.
The fixtures are now the gate's own measurements, and the three chapters'
solved boxes are asserted **by number**:

```
seymour-flux        { kind: 'shelf', width: 132, height: 93 }
yunalesca           { kind: 'shelf', width: 143, height: 98 }
braskas-final-aeon  { kind: 'shelf', width: 134, height: 98 }
```

---

## 4. What is left, and who owns it

* **The enemy plate sits on Seymour Flux** — 6 400 grid px² in Chapter 1, in
  every state until it folds (which it does, on its own clock, to a 54x8 chip;
  the gate verified that lifetime). It is not a placement bug: the plate is
  100x87 painted, and with Seymour Flux 197x226 and the CTB, party-status and
  command columns where they are, **there is no 100x87 free rectangle anywhere
  on that frame** — I ran the same solver over it. Genuine fixes are a narrower
  plate, or a narrower staging for a boss that is 30% of the stage. **Engine /
  art track**, with this note as the measurement.
* **The advisor card still prints its effect twice** — "Speeds the party's
  turns up · inflicts Haste" and then "Haste on the party." (round-02 #38).
  Visible in `yunalesca-1280x720-01-menu.png`. The body is
  `src/ui/common/MoveAdvisor.ts`, which this track does not own. **Advisor
  track.**
* **The party-status column clips Yunalesca's quad** by 70-90 grid px². Her
  painted right edge including aura margin crosses the column's left rail. Her
  *figure* is inside the safe area. **Scene / engine track.**
* **Citations in the strategy guide** (`§4.2`, `§1.6`, `§10.2`) are flagged by
  the gate's regex and are **correct**: CHK-007 puts them in the guide — the
  panel a player opens to ask *why* — and `EnemyIntent.stripCitations` keeps
  them out of everything else. No change.
* **The help slab is visually orphaned** when the command stack is short: its
  slot is fixed at y 121..154 and a targeting-state stack starts at 231, so
  there is up to 77 grid px of air between them. That gap is the price of a
  slab that never lands on the party, and 154 is a hard floor (Yuna's head in
  Chapter 1 is at 158.4). If it reads badly to Bailey the alternative is
  moving Chapter 1's Yuna, which is the engine track's constant.
