# fix3 — ffx2-hud-prep

Track: FFX-2 HUD and prep screens, plus the shared portrait crop logic.
Owns `src/ui/ffx2/**`, `src/ui/ffx/party-prep/**`, `src/ui/common/party-prep.css`,
`src/ui/common/portrait.ts`.

This round is the **fix pass** on the critic's pass 1 (`fba91ae`), which drove
the previous round live and refuted four things its own DOM matrix could not
see. Three of the four carried-over defects from the original brief were
confirmed closed by that critic pass and are not re-litigated here.

---

## What changed

### 1. The chain counter's pop is inside the placement solver now

`ChainCounter.show()` measured `el.offsetWidth/offsetHeight` — the **layout**
box — handed that to `placeSlab`, and *then* added `.ffx2chain--pop`, whose
keyframe scales the painted chip to 1.45 about its centre on every increment.
The solver had therefore never seen the box the player sees.

Measured by the critic at the 50% keyframe, 1280x720, chapter 4:

| | layout box | painted box |
|---|---|---|
| size | 167x95 | 242.4x137 |
| position | (665.9, 12) | (628.3, **-9.3**) |

9.3 px above the overlay, clipped away by `.ffx2hud`'s `overflow: hidden`;
166.8x5.2 onto Bahamut; 33.8x102.8 onto the enemy-intent slab — *larger* than
the 99x81 the previous handoff recorded as the **pre**-fix state. It reproduced
at counts 3/7/12/22, at all four viewports, in both FFX-2 chapters.

The fix is structural, not a fudge factor. `.ffx2-chain-chip` is now an **empty
reservation box** sized by `show()` to the pop's peak (`CHAIN_POP_SCALE`, 1.45),
and the ink slab is an inner `.ffx2chain__body` centred in it. The body is what
scales. So the box `placeSlab` places, the box
`FFX2BattleHud.intentObstacles()` measures as `.ffx2-chain-chip`, and the box
the player sees are the same rectangle at every point in the animation.

A second bug fell out with it: a transform makes an element the containing
block for `position: fixed` descendants, so while the pop was running
`.ffx2chain--flash::after`'s **full-screen** §4.6 flash had been collapsing to
the chip's own bounds and snapping back 0.18 s later. The chip is never
transformed now, so the flash is viewport-fixed throughout.

### 2. Cancelling out of target selection no longer commits the wrong command

`CommandMenu.ts` sent *every* cancel in the `target` view to
`renderSub(subCategory)`, whether or not the pending command had been reached
through a submenu. From a top-level leaf, `subItems`/`subCategory` still held
whatever submenu was opened last. The line predates this work, but the previous
round is what made the stale submenu able to be **Change** — the one submenu
whose rows cost the entire turn.

Driven live in chapter 4: open Change, Esc, arrow to Attack, Enter (reticle on
Bahamut), Esc — the window redrew the **Change** submenu *with the reticle
still up*, and the next Enter logged
`{"type":"spherechange","who":"paine","from":"warrior","to":"gunner"}`. The
player pressed Attack and spent Paine's whole turn on a spherechange. With no
submenu ever opened it was quieter and just as broken: an empty command window
that swallowed ArrowDown/ArrowUp/Enter until a second Esc.

The menu now records `pendingFrom` — the view the row was picked in — and goes
back *there*, clearing `targetLayer` and the pending command on the way. The
reticle-plus-menu state is gone because clearing the reticles was half the fix.

### 3. The Change submenu shows the outfit names it exists to show

`.ffx2cmd__grants` was `flex: none` inside `.ig-cmd`'s fixed 129.78x23.11 box,
so the **label** was the flex item that shrank: "Black Mage" got 27 of the 72 px
it needs and rendered "BL…", "Gunner" rendered "GUN…". `textContent` is
untouched by a CSS ellipsis, which is exactly why the previous round's evidence
(`["Gunner GRANTS: Red", "Black Mage GRANTS: Yellow"]`) said the names were
fine.

Rows that carry a gate line now get `.ffx2cmd--gate`, which wraps the row and
drops `GRANTS:` onto its own line beneath the name, right-aligned under the
right-anchored stack. **The row is deliberately not widened**: the command
window's left edge is the wall the scene has to stand its boss clear of
(`.ffx2hud__command`'s `right: 12px` note, `docs/ENGINE-API.md#hud-safe-area`),
and moving it outboard costs the stage more than the gate line is worth.

### 4. The FFX Equipment tab names its auto-abilities

It printed `def.autoAbilities` raw — `strength-10`, `hp-10`, `zombie-ward` —
three lines from the Items tab the same round had routed through `itemLabel()`.
New `src/ui/ffx/party-prep/autoAbilityLabels.ts` transcribes FFX's own names for
the whole `AutoAbilityId` union.

Transcribed, not derived, and the module comment says why: a `kebab -> Title
Case` helper gets a handful right and the rest wrong. FFX writes the percentage
families as `Strength +10%`, the counter as `Evade & Counter`, the auto-status
family hyphenated (`Auto-Haste`) but the SOS family not (`SOS Haste`), the
elemental nulls in medial caps (`SOS NulBlaze`), strike/touch/proof as one
closed word (`Zombiestrike`, `Stoneproof`) but wards as two (`Zombie Ward`).
The map is typed `Record<AutoAbilityId, string>`, so a new id in the union fails
`tsc` rather than leaking onto the screen.

### Also: `yuna-white-mage`'s face-crop row was stale

Not one of the four, and not caused by this track: the art fleet re-rolled and
**horizontally mirrored** `public/art/characters/yuna-white-mage/idle.png` at
14:41 today (758x1172 -> 581x1183; `idle.json` carries `flipped: true` and a
`flipNote`). The measured row in `face-crops.json` still described the old
painting, so her eye line landed at 0.766 against the house 0.42 — on her
collarbone — and `ui-portrait-face-crop.test.ts` was red before this round
touched anything.

Re-measured off the pixels with the project's own rig
(`tools/portraits/measure-face-crops.mjs sheet yuna-white-mage`), not from
memory: `fx 0.6333, fy 0.1079, ipd 0.0861, px [581, 1183]`. Note the rig's
`detectHead` reports `headCentreX` 0.702 for this file — that is the raised
**hood**, not her face, which is why the row is measured by hand off the
contact sheet.

---

## FFX vs FFX-2

Bailey's standing rule for this round: a change true to one game does not get
applied to the other. This track kept them apart by construction.

- 1, 2 and 3 are `src/ui/ffx2/` only. FFX has no chain mechanic and emits no
  `chain` event; it has no spherechange; and it has its own
  `src/ui/ffx/CommandMenu.ts`, which is untouched.
- 4 is `src/ui/ffx/` only. FFX-2 has **no auto-abilities** — its equivalent is
  the accessory table plus dressphere skillsets, which
  `src/ui/ffx2/party-prep/panels.ts` already names through `abilityName()` and
  `accessoryEffect()`. Giving X-2 an auto-ability list would be inventing a
  mechanic it does not have.

---

## How it was verified

`npx tsc --noEmit` clean. Targeted vitest 145/145 green across
`ui-ffx2-chain-flourish`, `ui-ffx2-command-menu`, `ui-ffx-party-prep`,
`ui-ffx2-prep-stats`, `ui-portrait-face-crop`.

The full suite was run once: **3928 of 3929 green**. The one failure is
`tests/unit/menu-cancel.test.ts:195` and it is **not from this round** — it
reproduces identically with `CommandMenu.ts` checked out at `b8e3889^`. See
"What is left".

Live on a vite dev server (port 5732) with real `page.keyboard` presses,
chapters 4 and 5, at 1280x720 / 1600x900 / 2000x1000 / 2560x1440 — the full
2 x 4 matrix green on all three FFX-2 defects, plus the FFX Equipment tab.
Rig: `critic/scratch/fix3-ffx2-hud-prep-fix/verify.mjs`; output
`docs/screenshots/fix3/ffx2-hud-prep/verify.json`, screenshots
`pop-*`, `change-submenu-*`, `cancel-*`, `ffx-equipment-tab-*` in the same
directory.

The rig deliberately measures what the critic measured, not what the fix makes
easy. In particular it freezes **`.ffx2chain__body`** at the 50% keyframe and
measures the body — freezing `.ffx2-chain-chip` the way the critic's
`pop-overflow.mjs` did would now freeze nothing and report "inside" trivially.

Representative numbers, chapter 4 at 1280x720, all four tiers:

```
count  3: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count  7: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count 12: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count 22: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
```

The painted size is byte-identical to the critic's 242.4x137 — the same box,
now placed instead of clipped, with zero fighter and zero panel overlaps.

Submenu labels, measured as `scrollWidth`/`clientWidth` (what `textContent`
could not see):

```
"Gunner"     gate=true  label 96/96  not clipped  grants "GRANTS: Red"    107/107 not clipped
"Black Mage" gate=true  label 107/107 not clipped grants "GRANTS: Yellow" 107/107 not clipped
"White Mage" gate=false label 71/71  not clipped   (no gate crossed -> no marker, no second line)
```

Cancel path, real key presses. Both branches of `pendingFrom` are driven,
one per chapter, because **`Attack` is a top-level leaf in chapter 4 but a
group row in chapter 5** (its category carries two commands there, so
`groupRows` opens a submenu). Chapter 4 therefore exercises
target -> top and chapter 5 exercises target -> the submenu it came from:

```
ch4  cancel (picked from a top-level leaf): reticles 1 -> 0; title ""; rows ["Attack","Skill","Change","Item"]
     committed after cancel: ["turn-start","action-start","chain","damage","action-end",...]
```

An attack, and no `spherechange` anywhere in the log.

The first version of this rig reported chapter 5 as a failure at every
viewport. It was the rig, not the build: it assumed `Attack` was a leaf, so
its Enter opened the Attack submenu, no reticle appeared and it concluded the
cancel path was broken. The diagnostic that settled it is
`critic/scratch/fix3-ffx2-hud-prep-fix/ch5diag.mjs`:

```
2 after Enter  {"screen":"battle","title":"Attack","rows":[{"t":"Attack"},{"t":"Attack"}],"reticles":0}
3 after Esc    {"screen":"battle","title":"","rows":["Attack","Skill","Change","Item"],"reticles":0}
```

Worth recording for whoever owns FFX-2 targeting: that submenu has **two rows
both reading "Attack"**. The HUD groups by `category` and labels each row with
the command's own `label`, so two `attack`-category commands with the same
label render as two identical rows. Whether chapter 5 should be offering two
attack commands at all is an engine/data question, not a HUD one —
`window.__pyrefly` exposes no accessor for the raw `AvailableCommand[]`, so
this is reported from the DOM rather than guessed at.

---

The FFX Equipment tab, chapter 1, Tidus (`ffx-equipment-tab-1600x900.png`):

```
FFX prep tabs: ["CHAPTER","STATS","SPHERE GRID","EQUIPMENT","ITEMS","OVERDRIVE"]
equipment chips: ["Strength +10%","HP +10%","Zombie Ward"]
```

Those are the same three the critic reported as `strength-10`, `hp-10`,
`zombie-ward`.

Two notes for anyone re-running the rig, both of which cost a run each here:

- `gotoChapter`'s `skipPrep` **defaults to true**, so reaching the prep screen
  needs `{ skipPrep: false }` explicitly.
- the prep screen's name is `party-prep`, not `prep`.

The rig drives at `setBattleSpeed('normal')`, not the critic rig's `'fast'`.
The cancel sequence is a dozen real key presses inside one actor's turn, and
at `'fast'` the turn can lapse mid-sequence — which surfaces as "never reached
target selection", a rig artefact that says nothing about the build. The rig
reports that case as an explicit failure rather than a pass, and retries up to
six times before doing so.

---

## What is left

**For the art track.** `public/art` is gitignored, so a re-roll silently
invalidates a `face-crops.json` row and the guard test is the only thing that
notices. When a character's `idle.png` or portrait is re-rolled, please
re-measure that row in the same change:

```
node tools/portraits/measure-face-crops.mjs sheet <id> out.png   # read the eye line off the grid
node tools/portraits/measure-face-crops.mjs detect               # head-top / head-centre cross-check
```

`yuna-white-mage` is current as of 2026-09-19 14:41. If the sweep that produced
`idle-c.*` picks a different candidate, the row needs re-measuring again — the
guard test will say so.

**For the FFX-HUD / cancel-claim track — one red test, not ours.**
`tests/unit/menu-cancel.test.ts:195` ("takes Esc in a submenu and gives it back
on the way out", FFX-2 block) expects `menuOwnsCancel()` to be `false`
synchronously after the `Escape` that leaves a submenu. It is `true`.

It is not this round's: checking `src/ui/ffx2/CommandMenu.ts` out at
`b8e3889^` and re-running gives the identical failure. The cause looks like a
timing contract rather than a logic bug — `releaseCancelAfterPress()`
(`src/ui/ffx/cancelClaim.ts:93`) defers `setMenuOwnsCancel(false)` to
`nextFrame()` **by design**, because the claim has to outlive the press that
caused it, and the test asserts on the same tick. Both files belong to that
track, so this round did not touch either.

While you are in there: that module's header still describes FFX-2's cancel as
stepping "`target -> sub -> top`". As of this round it steps
`target -> wherever the command was picked from -> top`, which is the point of
defect 2 above.

**Standing request, unchanged from the previous round.** `EnemyIntent.layout`
(another track's file) still resolves its obstacle list in a single greedy pass,
which is why `src/ui/ffx2/intentPlacement.ts` exists to steer it from the
outside. A real placement pass in `layout()` would make that whole module
unnecessary.

**Standing request, new.** `Ffx2Engine.gridNodes` is private, so the Change
submenu can only list *reachable* destinations, not open the full Garment Grid
the way `SpherechangeWheel.ts` is built to. If that data is ever handed to a
HUD, the Change row should open the grid proper (§4.5.2).

**Not done, and out of this track's lane.** The `.ig-cmd` row box
(129.78x23.11, `src/ui/inkgold/slabs.css`) is tight enough that any row wanting
a label plus a trailing chip has this same collision waiting. Fixed here only
for gate rows, from `ffx2-hud.css`. If the Ink & Gold track ever revisits that
slab, a variant with room for a secondary line would let `.ffx2cmd--gate` go
away.

---

## Pre-release pass (2026-09-19)

**Game case: FFX-2 only, in all three changes.** The §4.6 chain counter and its
chain-20 veil exist only on the FFX-2 side — FFX has no chain mechanic and emits
no `chain` event (`research/visual-bible.md` §4.6) — and `.ffx2hud__command`'s
scroll box is the FFX-2 command window's own: FFX never overflows, because
`computeMenuWindow` (`src/ui/ffx/CommandMenuLogic.ts`) renders a scrolling
*window* of rows instead of the whole list. Nothing here touches an FFX file,
and `ui-ffx2-chain-flourish.test.ts` now asserts that no module or stylesheet
under `src/ui/ffx/` can reach the chip or the veil, and that every chain rule in
`ffx2-hud.css` is `ffx2`-scoped — the veil especially, since it is
`position: fixed` and would otherwise wash an FFX battle too.

Commits: `e530364` (anchor, veil, the red cancel test), `e70cc1c` (scroll
affordance).

### 1. The chain counter had been evicted from its §4.6 anchor (pass-2 finding 1)

**What was wrong.** `b8e3889` made `.ffx2-chain-chip` an empty box the size of
the pop's 1.45x peak with the slab centred inside it. That box is 2.1x the
slab's area, it was reserved for the chip's whole 1.4 s life rather than the
0.18 s of the pop, and — because it is *centred* — its bottom edge lands
`0.225 * bh - 8 * scale` px **below the head it anchors to**. The chained enemy
therefore became an obstacle to the chip's own anchor, and `placeSlab`, which
only ever searches downward, evicted the counter across the stage: 116.8 px
below Bahamut's head and 333 px to its left at 1280x720, 229 px and 661 px at
2560x1440, in 32 of 32 of the critic's cells.

**What changed.** The chip is the slab's own layout box again, so `placeSlab`
solves the problem §4.6 describes and the anchor is the pre-regression one. The
peak is allowed to overhang, and a new pure `choosePopOrigin()` picks the
`transform-origin` that makes it overhang into whatever room the placement left:
never off the overlay — the clipping `b8e3889` fixed, which is weighted a
thousand to one above everything else because `.ffx2hud { overflow: hidden }`
simply erases what leaves it — and over as little of the board as the geometry
allows. At 1280x720 the peak is 137 px tall against 107 px of headroom above
Bahamut's head, so *some* transient overhang is arithmetic, not a choice; where
it goes is the choice.

**The test that pins it.** `tests/unit/ui-ffx2-chain-flourish.test.ts`, "sits by
the enemy it counts", four boards. The boards are rebuilt from the critic's own
`anchor.json` and `chain.json` rather than invented: the boss's left edge is the
one the evicted chip parked against (376.7 + 243 + 4 = 623.7 in chapter 4,
315.3 + 247 = 562.3 in chapter 5), the intent slab is the recorded rect, and the
top strip's bottom edge is 97.5 because the evicted chip's top was 101.5 = 97.5
+ the solver's 4 px dodge gap. Replaying the pass-2 arithmetic on them
reproduces the critic's live placements to the pixel — (376.7, 101.5) and
(315.3, 101.5) — and replaying this build's reproduces the pre-regression ones,
(627.8, 12.2) against a measured (627.7, 12.2) and (574.8, 16.5) against
(574.1, 16.5). All four boards are red on the pass-2 geometry.

**Confirmed live**, by the critic's own `rigs/chain.mjs` pointed at a dev server
on 5473, `PYREFLY_BROWSER=gpu`, chapters 4 and 5 at 1280x720 and 1600x900, 16
cells (`docs/screenshots/fix3/prerelease/ffx2-hud/chain.json`):

| | pass 2 | now | pre-regression |
|---|---|---|---|
| ch4 1280x720, chip bottom vs head y | **+116.8** | **-15.1** | -16.5 |
| ch4 1600x900 | +144.7 | -20.0 | — |
| ch5 1280x720 | +112.1 | -16.0 | -16.5 |
| ch5 1600x900 | +139.0 | -20.0 | — |
| chip left vs head x (ch4 1280x720) | -333 | -80.9 | -81.1 |
| painted outside the overlay | 0 | **0** | 0 |

The rig still prints 40 failures, and they are worth reading rather than
counting. Half are its `rightOfEnemy` flag, which is `chip.left >= head.x - 1` —
a criterion the **pre-regression build never met either** (its own
`anchor.json` records `rightOfHead: false, dxLeftMinusHead: -81.1`), because the
enemy-intent slab occupies §4.6's literal top-right spot and the chip straddles
the head instead. The other half are `painted on fighter` / `painted on panel`
readings taken with the pop **paused at its 50% keyframe**: 16.5 px onto the top
of Bahamut's sprite in chapter 4, 19.1 px onto the gauge strip in chapter 5.
That is the transient described above, and it is the trade this fix makes
deliberately.

### 2. The chain-20 "flash" was a permanent veil (pass-2 finding 2)

**What was wrong.** `.ffx2chain--flash::after` was `position: fixed; inset: 0;
background: #ffd9ec; opacity: 0.15` with no keyframe at all. §4.6 asks for "a
1-frame full-screen #FFD9EC flash at 15% **on each increment**"; what shipped
was a filter. Measured live by the critic, every viewport corner lifted
+29..+37/255 in R and stayed there for the whole 1400 ms hold, re-extended by
every further hit — a 15% pink wash over the entire game from chain 20 until the
chain broke.

**What changed.** The veil rests at `opacity: 0` and runs an 80 ms animation
that holds 15% for 32 ms (two frames at 60 Hz — §4.6's "one frame" rounded up so
it cannot fall between two) and ends transparent, with `forwards` so the end
state sticks. `ChainCounter.show()` now assigns the class list *without*
`--pop` or `--flash`, and adds both after the reflow it already forces, because
re-assigning a list that already contains a class restarts no animation — which
is how a flash became a state.

**The tests that pin it.** Same file: "flashes the chain-20 veil and clears it"
asserts the rest opacity, the animation's existence, a duration under half a
second, `forwards`, and a 100% keyframe at opacity 0; "re-arms the veil on every
increment past 20" observes the class actually being dropped and re-added via
`MutationObserver.takeRecords()`; "takes the veil with it when the chain lapses"
advances past the hold and the decay and finds no host left. jsdom runs no
animations, so the CSS facts are asserted from the stylesheet rather than
pretended at.

**Confirmed live** with the critic's `rigs/flash.mjs`: the corner deltas at
1280x720 are now within ±4/255 in both chapters, against +29..+37 before. The
rig prints one remaining failure, ch4 at 2560x1440, and it is not the veil: the
lift is **negative** (darker, -56..-63 in R and G, ~0 in B — a pink wash is
positive in R), it is at the `midL` sample point only, and it is the same -56 at
**count 12**, where no flash exists at all. That sample point lands on the chip
itself at that viewport.

### 3. `tests/unit/menu-cancel.test.ts` was red for asking for the bug

Not a behaviour fix. The FFX-2 "takes Esc in a submenu and gives it back on the
way out" case asserted `menuOwnsCancel() === false` **synchronously** after the
Esc. `src/ui/ffx/cancelClaim.ts` defers that release to the next animation frame
by design, and the file's own FFX sibling test has always waited a frame for it:
`BattleScreen.handleInput` polls `justPressed('cancel')` once per frame, so a
claim dropped inside the `keydown` handler leaves that poll seeing a free Esc,
and one tap both backs out of the submenu and opens the pause menu. The FFX-2
half of the file predates that module being wired into this menu and was never
updated, so it had been red — and red for the wrong answer — since
`renderTop(true)` landed in `cancelTargets()`.

**This is the only expectation in this pass that was changed rather than
satisfied**, and the reason is written into the test itself. It was not weakened
in the process: it now also asserts that the cancel lands back on the list the
command was picked from (`.ffx2cmd__title` gone, both top rows back, a row
selected) and that the promise never resolves — a cancel must never commit a
command.

### 4. The command window scrolls and nothing said so (pass-2 secondary)

Taken because it was small and CSS-plus-twenty-lines. `.ffx2hud__command` is
`max-height: 220px; overflow-y: auto`: measured at 1280x720 and 2560x1440 in
both chapters, `Item` runs 227 px (Light Curtain below the fold), chapter 5's
`Skill` 360 px and its `White Magic` 440 px — sixteen rows with Full-Cure and
the Lv. 2 / Lv. 3 rows off-screen, and Windows' overlay scrollbars fade out, so
the box read as the whole list.

`markFold()` adds a sticky ink-pill chevron at whichever edge has rows past it —
`position: sticky`, because `.ffx2hud__command` is itself the scroller and a
pseudo-element on it would scroll away with the last row — and scrolls the
selected row into view, which is the second half of the same defect: arrowing
past the 7th Item row took the cursor out of the frame with it. The thresholds
live in a pure `scrollAffordance()` and are tested there, because jsdom reports
every scroll metric as 0 and a DOM-only test would be asserting nothing.

### Still open

- **The peak still overhangs at the pop.** 16.5 px onto the top of Bahamut's
  sprite (ch4) and 19.1 px onto the gauge strip (ch5), for 0.18 s per increment,
  at the 50% keyframe. It cannot be removed by placement at 1280x720 — the peak
  is 137 px tall and there are 107 px above the head. The way to remove it is to
  pop **the numeral** rather than the whole slab, which is what §4.6's wording
  actually says ("numeral scale-pops 1.0 to 1.45 to 1.0"); the slab's padding
  would absorb almost all of the growth. That is a visible change to a
  transient, so it wants Bailey's eye before it is made, not an agent's.
- **`rightOfEnemy` as the critic's rig defines it** (`chip.left >= head.x`) is
  not reachable in either chapter at 1280x720 or 1600x900 while the enemy-intent
  slab sits in §4.6's literal top-right spot. The pre-regression build did not
  reach it either. Either the rig's criterion should become "above the head line
  and horizontally on the enemy" (what the unit test asserts), or §4.6 and the
  intent slab need to be reconciled — a spec question for Bailey, not a fix.
- **Not mine, unchanged:** `src/ui/common/menuCancel.ts`'s header still
  describes FFX-2's cancel as stepping `target -> sub -> top`; it steps
  `target -> wherever the command was picked from -> top`. Stale comment only,
  and the file belongs to the FFX-HUD / cancel-claim track.
- **Not mine, unchanged:** chapter 5's Attack submenu shows two rows both
  reading "Attack" (reported from the DOM by the pass-2 critic). Whether the
  chapter should offer two attack commands is an engine/data question.
- **Not mine, unchanged:** `.ig-cmd`'s fixed 129.78x23.11 box
  (`src/ui/inkgold/slabs.css`) still has the label-vs-trailing-chip collision
  waiting for any future row.
