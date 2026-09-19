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

Twelve hostile runs — 3 chapters x 1280x720, 1600x900, 2000x1000, 2560x1440,
13 states each, 156 states. The complete list of non-`DECLARED`,
non-`CITATION` findings across all 156:

```
braskas-final-aeon  x4 viewports   clean
seymour-flux        x4 viewports   sensor x seymour-flux  (§4, engine/art)
yunalesca           x4 viewports   party  x yunalesca     (§4, scene)
```

Raw output: `docs/screenshots/fix3/ffx-hud/hostile-*.json` and
`docs/screenshots/fix3/critic-ffx-hud/advisor-zone-live.json` (the gate's file,
rewritten by its own script on this build).

Screenshots: four states per chapter at 1280x720, committed as
`docs/screenshots/fix3/ffx-hud/<chapter>-1280x720-<state>.png` (the full
13x3x4 set is 585 MB and stays out of the repo; re-make any of it with the
command in §3). The three worth opening are `yunalesca-1280x720-01-menu.png`
(the shape of refutation 1, now clear), `seymour-flux-1280x720-01-menu.png` and
`braskas-final-aeon-1280x720-07-submenu.png`.

```
npx vite build --outDir <scratch>/dist-hud
npx vite preview --outDir <scratch>/dist-hud --port 5741 --strictPort
node critic/scratch/ffx-hud-hostile.mjs 5741 <out> <chapter> <w>x<h> --gpu --shots
node critic/scratch/advisor-zone-live.mjs 5741
```

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

---

## Pre-release pass (2026-09-19)

**Game case: FFX only.** Everything below is in `src/ui/ffx/FFXBattleHud.ts`,
which is the FFX HUD's own composer. FFX-2 has its own HUD (`src/ui/ffx2`), its
own enemy-intent placement and its own advisor anchors, and imports none of
this; the enemy-move read-out even *defaults differently* between the two games
(FFX ships it folded via `readVisible`/`writeVisible` overrides, FFX-2 keeps the
shared persisted default). Applying anything here to FFX-2 would change a
behaviour the sources put only in this HUD. Bailey's rule of 2026-09-19,
AGENTS.md hard rule 14.

### What was wrong

The second adversarial pass
(`docs/handoff/fix3-verify2-findings.json`, key `ffx-hud`, failure 1) refuted
this track on a **blocker**: in any FFX chapter, one press of `E` removed the
NEXT BEST MOVE card *for the rest of the turn*, and a second press did not bring
it back. Measured on the built app at 1280x720 and 1600x900 in all three FFX
chapters - `shelf` 132-141 wide with `.mad__card` painted, then `zone=null` and
no card, then `zone=null` and still no card after the read-out was folded again.
53 states of one Chapter 1 decision, every menu row, all six submenus, every
cancel. It came back only on the next actor's decision.

The cause was not the solver and not the read-out. `solveAdvisorPlacement` held
a declined solve against **the decision**: `advisorFreeSeq === advisorDecisionSeq`
forced `zone = null` without ever calling `advisorZone` again. So the one input
that mattered - the 150x168 read-out slab leaving the band - was never looked
at. The guard was there for a real reason (the card must not cross between a
measured zone and nothing at all while the player reads it, and the zone's
inputs move a quantum every frame), but "the decision" was far too coarse a
thing to hold it against.

The same file's docblock on `placeAdvisor` then stated the opposite of the code
it introduced - "**No zone means this method gets out of the way - it never
takes the card down**" above a branch that sets `card.hidden = true` and docks
the chip. That is the contract failure 1 turns on, so a later agent reading it
would have got the wrong answer twice over.

### What changed

* `FFXBattleHud.advisorFreeSeq` becomes `advisorFree: { seq, panels } | null`. A
  declined solve is now held against **which panels and fighters are on the
  screen** (new `panelPresence`: guide / sensor / intent slab / intent chip /
  CTB present-or-not, plus the party and enemy counts) as well as the decision.
  Frame noise never changes that string; the player pressing `E`, the Sensor
  card folding on its own clock, the guide being switched off and a KO all do,
  and every one of them is a real reason to ask the solver again. The decision
  seq stays in the latch, so a new decision still always starts fresh.
* `placeAdvisor`'s docblock rewritten to the contract the code actually keeps,
  in two halves that are both now true: *no zone takes the card down and docks
  the chip* (the round-02 gate's finding, with its measurements kept) *and the
  card comes back on the first frame the room does* (this pass). The stale
  "never takes the card down" sentence is gone.

Behaviour is unchanged on every frame where a zone exists, which is all three
shipped chapters in every state the gate measured. No battle math, no AI, no
targeting, no `PaintedActor`, no CSS.

### The test that pins it

`tests/unit/ui-ffx-hud-intent-toggle.test.ts` (new, 4 tests). A real
`FFXBattleHud` mounted in jsdom, real `KeyboardEvent`s with `code: 'KeyE'`
dispatched at `window` so the real `EnemyIntentPanel` listener takes them, and
the real `advisorZone` solver deciding what fits. The one thing stubbed is the
**painted box of `.eint__panel`** - jsdom lays nothing out, so the read-out slab
is given the band the browser measured it in (grid y 60..300, which leaves a
clear strip too short for a card and roomy for the chip, the shape of the real
frame). Three of the four failed on the old code and one passed, which is the
point of the fourth: it pins that the card does **not** flap while the read-out
stays open, for 60 frames.

* gives the card back, in the same box, when a second `E` folds the read-out
* survives `E` pressed four times inside one decision
* does not flap while the read-out stays open, however many frames pass
* still hands the next decision a fresh solve

No existing test was widened, skipped or deleted; none needed rewriting, and the
63 tests of `ui-ffx-hud-safe-zones.test.ts` - including the whole "with no zone
the card fits in" block that pins the decline behaviour - pass unchanged.

### Still open (not touched in this pass, and why)

Ranked by what the verifier measured, for whoever picks this up next week.

1. **`.ffx-cmd-breadcrumb` sits inside the help slab's fixed slot** - "ITEMS"
   printed under "Cures Zombie and Curse.", 815-2 202 grid px2 in *every* state
   of a submenu at 1600x900, both elements at `z-index: auto`. This is not a
   placement bug either: `.ffx-cmd-area` is bottom-anchored `column-reverse` at
   y 334, the command stack with `MAX_VISIBLE_ROWS = 6` reaches a top edge of
   ~155, and the slab's floor is 154 - so **there is no room left in that column
   for the breadcrumb at all**. The honest fixes are (a) `MAX_VISIBLE_ROWS` 5
   one level down, where a breadcrumb exists, and 6 at the top level, where it
   does not, or (b) folding the breadcrumb into the slab as its own row. Both
   change something Bailey sees, so both want an end-state option under hard
   rule 9 rather than a quiet edit in a time-boxed pass. The breadcrumb should
   also join the overlap harness's panel list - its absence is why the "0
   panel-on-panel overlap in all 156 states" claim was false.
2. **The `E ENEMY MOVE` chip is parked at a constant** ([1416.9, 96.9,
   1547.1, 115.6] at 1600x900) that the action camera pushes bosses into,
   247-2 442 px2 on `seymour-flux` and `mortiorchis` over eight frames of one
   fight. The fix asked for - hide it while no decision is pending - needs the
   chip's own component (`src/ui/common/EnemyIntent.ts`, which writes
   `this.el.hidden` from its own view state) to take a "no decision pending"
   input. That is not this track's file and it is not a one-line change.
3. **The Sensor plate re-opens across Seymour Flux at decision time.** The 7 s
   auto-fold works (the verifier measured the idle timeline), but every target
   change calls `SensorPanel.focus` then `open()` with `openMs = 7000`, so in
   real play the plate is up over the boss most of the fight. Folding it while a
   command menu awaits input takes the scan card away at exactly the moment the
   player aimed at the enemy to read it, so this is a design question for
   Bailey, not a bug fix. The measurement in section 4 stands: no 100x87 free
   rectangle exists on that frame, so the real answer is a narrower plate.
4. **Damage numerals overlap each other** - "609" by "618" = 925 viewport px2 in
   a 320-numeral auto-played Chapter 1. Frame-edge clipping is *not*
   reproducible once pooled/invisible `.dnum` nodes are excluded (0 of 320).
   `DamageNumbers.ts` is this track's file but the fix is a spawn-time
   separation pass, not a placement tweak, and it needs the live probe rig to
   verify.
5. **The strategy guide's rail lost 87 grid px in submenu states** (y 44..202 to
   y 44..115) and overflows in 12 of 13 states with `.sgd__more` painted over
   the cut line. The 87 px came from this track's `anchors.bottom` constant
   (`CMD_INFO_TOP - GAP`), but `StrategyGuide` itself is another track's file
   and the two have to move together.
6. **The `N HIDE MOVES` chip reads wrong while a decline is in force** - the
   player hid nothing, and `N` / `N` flips `advisorIsVisible` without putting a
   card back, because the HUD's decline outranks the preference. The chip's text
   is `src/ui/common/MoveAdvisor.ts`, the advisor track's file. With this pass's
   fix the window in which this is visible is much shorter (it ends when the
   read-out folds rather than when the turn does), but it is still wrong.
7. **The telegraph banner** remains unverified in either direction: 700 live
   frames of an auto-played Chapter 1 never caught `.ffx-telegraph` painted.
