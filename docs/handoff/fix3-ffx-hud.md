# fix3 — FFX battle HUD cleanup

Track `ffx-hud` of the fix-3 round. Bailey played the live build (main `88e5b64`)
and reported, from one Chapter 1 capture:

1. a **stale "Ronso Rage · CHOOSE A RAGE" title banner** still on screen during
   Tidus's turn, over the `G GUIDE` chip and the Mortiorchis name/HP header;
2. the **NEXT BEST MOVE card and its `N HIDE MOVES` chip on top of the party
   sprites**, and the **`E ENEMY MOVE` chip over the boss's painting**;
3. **CTB names truncating** — "Seymour F…";
4. carried over from round 2: telegraph/sensor collisions, guide chip collisions
   and edge clipping, damage numerals overlapping and clipping, fighters drawn
   over the party status window.

Everything below is measured on the **640x360 authoring grid** both FFX HUD
stages are letterboxed from, because that is the frame the CSS is written in and
the one the numbers stay constant in across viewports.

> **On the first half of this round.** Commits `0ac7f09` and `27530f5` landed
> the work described in sections 1, 3 and 4, and an earlier draft of this file
> claimed the Playwright matrix had verified it. It had not: every job of that
> matrix died on its fourth state, the run never completed, and no `after-*`
> screenshot was ever written. The section below marked **§5** is what the
> matrix found once it could actually run, and sections 2 and 5 are the parts of
> this file that have been rewritten since.

---

## 1. No title slab outlives its decision

**What it actually was.** `OverdriveOverlay` is only ever taken off the stage by
its own `close()`, and `close()` is only reached from a picker's `finish()`.
The three **untimed** pickers — Ronso Rage, Grand Summon, Mix — all opened with

```ts
if (settled || !rages.length) return;   // KimahriRage, before
```

so with an **empty list** (Kimahri has Lancet-ed no Rage yet, Yuna has no aeon,
Rikku's pouch is empty) every button was swallowed, the promise never settled,
and the ivory title slab stayed on the field for the rest of the fight. That is
the blank "Ronso Rage" slab in Bailey's capture, printed across the `G GUIDE`
chip and the Sensor card. The second, quieter half was `.ig-banner`:
`setMessage` showed it and nothing ever hid it again, so the last line of one
actor's turn labelled the next actor's.

**Fixed at both ends.**

- *At source.* The three pickers now back out on `cancel`, and accept `confirm`
  as a way out when there is nothing to pick, by rejecting with
  `MinigameCancelled` (`src/ui/ffx/minigames/params.ts`). `askMinigame`
  (`engine/BattlePresenterUtil.ts`) has always caught a thrown overlay and
  re-submitted the command bare, so **no engine, command or battle-math path is
  new** — the rejection simply takes the branch that already existed. The empty
  list now also says why it is empty, and the head's instruction line says how
  to leave.
- *At the HUD.* `FFXBattleHud.clearTransientOverlays()` sweeps any `.ig-minigame`
  off the stage and hides `.ig-banner` at the four moments a decision ends: a new
  `chooseCommand` (submit, and the actor change with it), a `turn-start` for a
  **different** actor, a `sync` whose state carries a `result`, and `unmount`.
  `openMinigame` brackets its dispatch with the same sweep. Every picker awaits
  `overlay.close()` *before* it settles, so the sweep is a no-op on the happy
  path; it exists for the overlay that threw or was abandoned.

**Tested** in `tests/unit/ui-ffx-hud-safe-zones.test.ts` — a leaked slab is gone
by the next `chooseCommand`, gone when the turn passes to another actor, **not**
gone while the same actor is still deciding, gone once the battle has a result;
the banner goes with it; and an empty Ronso Rage picker rejects and removes
itself on both Esc and Enter while a non-empty one still resolves normally.

---

## 2. One tap of Esc means one thing

This is the defect that made the rest of the round unverifiable, and it would
have been the first thing Bailey hit the next time he opened a Skill list.

**Backing out of a submenu also opened the pause menu.** Six of six matrix jobs
died on it, at every viewport and in all three chapters, on the fourth of nine
states. In the game it reads as: press Esc in a Skill list, the list closes and
the pause menu is suddenly up over the battle.

The two halves of the Esc contract run off **different clocks**:

| | who | when |
|---|---|---|
| the menu's back button | `RawInputWatcher`, a `keydown` listener | the instant the key goes down, *between* frames |
| the pause menu's opener | `BattleScreen.handleInput`, polling `input.justPressed('cancel')` | once per frame, out of `App.step` |

So one press ran: keydown → the menu steps `sub → top` and publishes "Esc is
free now" through `ui/common/menuCancel.ts` → next frame, the screen polls the
**same still-fresh press**, is told Esc is nobody's back button, and pauses.

`src/ui/ffx/cancelClaim.ts` defers a release *caused by a cancel press* to the
next animation frame. `App.tick` re-queues itself as its first statement, so the
screen's next callback is always queued ahead of anything a between-frames
keydown can schedule: the poll sees the claim still up, the release lands
immediately after, and a **second** tap pauses, which is what it should do.
Releases with no press behind them — a menu opening at its top row, a command
taken with Enter, a teardown — stay immediate.

Nothing about what a menu resolves to moved; this is only who answers a key. The
three untimed pickers get the same treatment on their cancel path.

**Tested** in the same file (the claim survives the press and is gone a frame
later, for both the command menu and a picker) and in
`tests/unit/menu-cancel.test.ts`, whose two FFX cases used to assert the
synchronous release and now assert the frame of delay.

---

## 3. CTB names that fit

`.ffxhud .ig-ctb__name` kept `max-width: 48px` — that cap is what makes the HUD
safe area's right rail the **constant 0.843** every FFX scene solves against, and
raising it would drag the rail to 0.866 and cost every scene ~5% of its usable
width. What changed is what the cap does when a name is too long for it: it used
to ellipsise, and at this font size that caught "Seymour Flux", not just
"Braska's Final Aeon".

The plate now wraps (up to three lines) and `CtbList.fitNames()` steps the font
down `NAME_SIZES` only if three lines at the full 5.6px still overflow. Every
name in the five chapters fits at full size — "Seymour Flux" and "Yunalesca" on
one or two lines, "Braska's Final Aeon" on three — so **no name in the game is
abbreviated any more and the rail has not moved**. A three-line plate is 22px
against the 20.44px tile, so the column grows about 2px in the worst case. The
fit is measured once per name and cached, because the queue re-renders several
times a second while the cursor moves.

The matrix asserts every frame it captures that no `.ig-ctb__name` has
`scrollWidth > clientWidth`.

---

## 4. HUD safe zones

### Why a fixed zone cannot work

The party stands somewhere different in every encounter. Measured live through
the debug API at 1600x900, in grid px:

| chapter | party sprites (union) | boss |
|---|---|---|
| 1 Seymour Flux | x 65..286, y 152..314 | 340..491, 23..238 |
| 2 Yunalesca | x 207..374, y 185..341 | 348..480, 69..258 |
| 3 Braska's Final Aeon | x 68..285, y 185..339 | 310..501, 67..256 |

The always-on chrome, identical in all three:

| panel | rect |
|---|---|
| command area `.ffx-cmd-area` | 30.2..210.7, 204.5..334.2 (top rises to 177.8 with a submenu open) |
| party status `.ig-stat-list` | 402.7..616.9, 258.3..348 |
| CTB queue `.ig-ctb` | 547.6..620.5, 49.8..200.4 |
| strategy guide `.sgd__panel` | 21.3..153.3, 44..200 |
| Sensor card `.ffx-sensor` | 191.7..308.3, 24..102 |

The advisor card shipped in the band between the command area and the party
status column — x 211..403 — and the party's union is x 65..374. **No fixed
sub-rectangle of that band is free in all three chapters**, which is why the
card was printed across Tidus and Kimahri.

### The two zones

`src/ui/ffx/hudSafeZones.ts` is pure arithmetic on the grid and picks the first
that fits:

1. **the pocket** — bottom-anchored, between the rightmost party sprite and the
   party-status rail;
2. **the shelf** — above the party's heads, between the guide's rail and the
   boss column, dropped below the Sensor card when that is up, and below the
   command stack's top edge when a submenu has raised it into the same band.

`FFXBattleHud.placeAdvisor()` applies the winner **after** `MoveAdvisor.update`,
so the inline geometry the advisor writes for itself is the one that gets
overruled, and it places the chip whether the card is up or not.

### Measuring the party honestly

`HudPort`'s projector answers with **points** (`head` / `chest` / `feet`), so
the sprite rect is reconstructed. Three constants do it, and all three were
measured live across the nine party sprites of chapters 1-3 rather than guessed:

| constant | measured | set to | what it is |
|---|---|---|---|
| `SPRITE_HALF_WIDTH_RATIO` | 0.362..**0.453** | **0.50** | half the quad's width, over the head-to-feet span |
| `SPRITE_TOP_MARGIN_RATIO` | 0.1023..**0.1063** | **0.14** | how far the quad reaches above the head *point* |
| `SPRITE_FOOT_MARGIN_RATIO` | 0.0015..**0.0020** | **0.01** | how far it hangs below the feet point |

The first shipped at 0.45 — **under** the worst case, so Yuna's quad in
Chapter 1 reached 2.35 grid px past the rect claimed for her and the "no panel
on a fighter" rule could not see that part of her. The second did not exist:
the shelf cleared the head *point*, which is ~10 grid px below the top of the
painting, so the card's bottom edge sat about 4px inside Auron's hair. That is
the `SPRITE advisor x sprite:auron` row the matrix reported in 35 states.

The head anchor's x sits within 0.017 of the span of the quad's own centre in
all nine cases, so centring the reconstruction on it is sound.

**With an honest sprite rect the pocket measures 93.5 and 94.2 grid px** in
chapters 1 and 3 — not the 99..101 the previous round read — so it cannot hold a
card at a width worth reading, and **all three chapters take the shelf**.
`MIN_ADVISOR_WIDTH` therefore goes back to `MoveAdvisor.MIN_CARD_WIDTH`'s 132
and the two components stop disagreeing. The pocket arithmetic stays, with a
test, for an encounter whose party leaves one.

### The other two panels

- **`E ENEMY MOVE`** parks on the CTB queue's top-right corner while the panel
  is off, through a new opt-in `EnemyIntentMountOptions.chipDock`. With the
  panel up the slab still hangs over the boss's head, which is the relationship
  it is claiming; with the panel off there is no slab and the chip had simply
  inherited the same anchor, which is how it ended up in the middle of the
  painting. FFX-2 passes no `chipDock` and is unchanged.
- **`G GUIDE`** rides 11 grid px *above* the guide rail's top edge, and the rail
  anchors below the action banner (`.ig-banner`, y 17.8..48) — so the rail
  cleared the banner and the chip landed on it. `StrategyGuide.layout` now
  reserves `CHIP_RISE` under the `below` anchor.
- The enemy-intent slab's edge clamp was a flat **4 viewport px**, which is 1.6
  grid px at 1600x900 and 1.1 at 2560x1440: a slab pushed against the top of the
  frame sat flush on the edge and read as clipped. It is `EDGE_MARGIN * scale`
  now, 4 grid px at every viewport.

---

## 5. What the live matrix measured, and what it means

The matrix drives a real battle through `window.__pyrefly` with real
`page.keyboard` input against a vite dev server: **chapters 1-3 x 1280x720,
1600x900, 2000x1000, 2560x1440 x nine HUD states** (all panels open, a submenu,
that submenu cancelled, the Sensor card, a stage-2 telegraph, a five-hit numeral
burst on every combatant, an Overdrive picker, that picker cancelled, and every
optional panel switched off) — 108 measured states. Each one computes DOM
bounding boxes for fifteen HUD elements plus every party sprite's screen rect,
projected from the live `PaintedStage` actors through the render camera.

Three of the first run's findings were the **measurement** being wrong, not the
HUD, and saying so is part of the result:

- **Skewed slabs.** Every Ink & Gold panel carries the same `--ig-skew`
  (`matrix(1, 0, -0.2126, 1, 0, 0)`). A 96px-tall card's parallelogram juts
  ~10px past its bounding box on each side, so boxes overlap where the painted
  shapes have clear air between them — and since every slab shares one skew,
  parallel edges stay parallel and two slabs that do not overlap as laid out
  cannot overlap as painted. Panel-against-panel is now compared in the unskewed
  frame, recovered from the painted box and the element's own matrix. Anything
  measured against a **sprite** (not skewed) or against the frame's edge keeps
  the painted box, because there the jutting corner is exactly what matters.
- **Invisible numerals.** All 682 "clipped" numerals were glyphs whose target
  could not be projected — reserve members that this harness's synthetic burst
  hits and that no real battle can damage. They are parked at the layer origin
  at `opacity: 0` until they age out. Filtered by what the player can see, the
  count is zero.
- **The Overdrive picker is a modal.** It is *supposed* to cover the panels
  underneath while it asks its question. It is still checked for clipping, and
  §1 is what makes sure it leaves.

Two overlaps are declared rather than fixed, both quoting
`docs/ENGINE-API.md#hud-safe-area` back at itself: the **command stack** over
the party's lower third ("the party stands behind the command window and always
has") and the **strategy guide**, which that section calls a soft rail — "a
party slot left of 0.240 is behind it for as long as it is up", dismissible with
`G`. Moving either is a framing decision, not a HUD-layout one.

`docs/screenshots/fix3/ffx-hud/` holds `before-*` and `after-*` and the run's
`after-report.json`.

---

# Part two — the round-02 addendum (2026-09-19)

Critic round 02 ran on live build `5a82e71` *after* the brief above was written
and returned a headline of **3.5**. Seven of its issues land on this track, and
they are one screen: the forty minutes a player spends looking at a fight.

Everything above stands. Commits `0e1a970`, `2312d50` and `5a82e71` are built
on, not undone.

## 6. The enemy plate — one panel, with a lifetime and a rule

**The root cause of Chapter 1's crowded screen was four words long:
`SensorPanel.hide()` had no caller.** Not "was called at the wrong time" —
there was no call site anywhere in the repository. So a single Sensor in
Chapter 1 left a 100 x 78 grid-px card in the middle of the field for the rest
of the fight; `hudSafeZones` correctly refused to put the advisor card under it,
the shelf measured 24 px on five of seven decisions, and the advisor track spent
a whole pass fitting a card into a box that should never have been that small
(`docs/handoff/fix3-advisor.md` §1, "what is left", item 1).

It also explains round 02 **#28** — "enemy health is presented three different
ways and the boss's HP is invisible in two of three chapters". Chapter 1 showed
`HP 4000 / 4000` for the *mount* because that is what somebody Sensed once, and
the card never came down.

`SensorPanel` is now the **enemy plate**, and it has exactly one rule:

> Enemy health is printed if and only if Sensor has read that combatant in this
> battle.

Which is FFX's rule. An unscanned enemy has no HP bar in FFX, so the plate
prints its name, `? ? ?`, an empty bar and one line saying what Sensor would
tell you. A Sensed one keeps its numbers and its six element chips for the rest
of the battle, and the plate follows the **target** as well as the `sensor`
event — so the same panel in the same place answers "who am I aiming at" and
"what do I know about them", in every chapter.

Its lifetime: open on a reveal or a target change, fold to a one-line chip after
`SENSOR_OPEN_MS` (7 s), reopen on a click or `I`. A plate the player opened by
hand is pinned and never folds under them. `hide()` has a caller at last — a
battle that has a result, and `unmount`.

`I` is the one letter neither `app/Input.ts` nor `ffx/rawInput.ts` claims.

### And it moved

x 200..300, y 24..102 was inherited from the pre-restyle FFX layout and never
revisited. It is the **middle of the advisor's shelf** — the reason Chapter 1's
shelf measured 24 grid px is not only that the plate never came down, it is also
that the plate was standing exactly there. It is also where the enemy-intent
slab lands once §7 has pushed it off the boss, which the first browser pass
measured as 41,235 square px of slab printed over this plate's own name and HP
at 1280x720, and 64,430 at 1600x900, in **every state at both viewports**.

It is now **x 436..536, y 176..254**. Free of the party in all three chapters
(their union is x 65..374); clears the CTB rail's 547.6 by 3.6 even with the
house skew's 8 px shear; clears the party-status column's 258.3 by 4; sits 26
right of the advisor band's 414. It overlaps the **boss's legs** in all three,
which is the price and is paid knowingly: a 100x78 plate over a boss's feet for
seven seconds is a much smaller thing than a slab printed over another panel's
text.

**Chapter 1's advisor card takes the shelf at its full 104 px again** as a
direct consequence — `advisorZone` answers `shelf` for all three chapters now,
where Chapter 1 used to fall to the narrow pocket. That is the addendum's "the
advisor card should get its full measured slot again in Chapter 1", and it is
asserted both ways in `ui-ffx-hud-safe-zones.test.ts`: put a plate back in that
band (`SENSOR_IN_SHELF`) and the old answer returns, so nothing about the rule
was loosened.

## 7. The intent slab stops standing on the fight (#14)

`intentAvoidRects` named HUD panels and **nothing else** — exactly the gap
CHK-008 had asked about — so a slab that had dodged the queue and the command
stack was free to sit on the encounter. Round 02 measured it at 1000x562:
x 532–766, y 6–269, with Seymour Flux, the Mortiorchis *and* both target
reticles entirely behind it.

Four changes, in the order they matter:

1. **Every living fighter's projected quad is an obstacle**, party and enemy,
   reconstructed from the projector's head/feet points by the same three
   measured ratios §4 uses, snapped outwards to 4 px so an idle cycle cannot
   make the slab twitch. Every `.ig-reticle` is an obstacle too — that is a
   rectangle in the avoid list, not a change to how a reticle is drawn or
   aimed, which belongs to the targeting track (#08/#13).
2. **The slab's own subject is a special case, and has to be.** Its body counts
   from the head point *down*; the air above the head stays legal. Otherwise the
   rect would push the panel off the boss on every frame and delete the one
   relationship the design exists for — the tail pointing at the head, which is
   what makes "whose turn" answerable without reading a name.
3. **The dodge tries *above* before below.** Going down is right for the CTB
   queue and wrong for a fighter: pushed under the boss, the slab lands on the
   party. It also runs two passes, because clearing a rectangle on the right can
   slide it back onto one on the left.
4. **FFX mounts it at a new `brief` density** and caps its body at a third of
   the frame. Brief drops the odds table, the status list and the "Also" notes
   and keeps the move, what it does, the countdown, the damage per character and
   what it counters with. A panel that ships **on** may not be the thing hiding
   the encounter — but the answer is a default that is short enough to dodge,
   not a default that is off: Total Annihilation and Mega Death are both
   survivable and both unannounced. **FFX-2 passes no density and is
   unchanged**, per Bailey's rule of 2026-09-19.

## 8. No citation reaches the player from that slab (#26, FFX half)

The engines' intent builders attach the research section they derived a sentence
from — `"Counters an attack with Lance of Atrophy [ffx-seymour-flux §4.6]"` —
which is right for an audit trail and wrong on a slab hanging over a boss's
head. `stripCitations` takes them out of every player sentence, and the charge
row's and the footer's are simply not rendered. CHK-007 puts citations in the
strategy guide, which is the panel a player opens to ask *why*; this one is read
in the two seconds before a hit lands. `IntentView` still carries them.

`tests/unit/ui-enemy-intent.test.ts` used to assert the footer was **present**.
That assertion was wrong and is now its opposite.

## 9. The guide fits, and says when it does not (#29)

The rail already scrolled and already faded, and neither helped: a fade at the
foot of an ink panel on a dark painting is not an affordance, and a player on a
pad cannot scroll at all. So the panel gives text up in a fixed order —
rule citations, rule paragraphs, WATCH sentences, rules past the third — until
what is left fits. **Every rung hides whole elements**, which is what makes
"never cut a sentence" true rather than aspirational, and NEXT survives all four.

A fifth rung dropping the RULES section outright was written, and the browser
pass killed it: at 1600x900 with a menu open the rail is ~156 grid px and the
ladder reached the last rung in **every state**, so "kill Seymour, not the
mount" was gone from the panel for the whole of every decision. Past the fourth
rung the rail scrolls and `.sgd__more` says so — and that chip is also the
control, because a pad has no wheel.

The measured outcome: at both viewports and in all seven states the rail sits at
rung 4 with the MORE chip up. So the guide is **still** longer than its rail
with an FFX menu open, and it says so instead of stopping mid-word. Whether the
right end state is a shorter guide, a taller rail or a second page is a content
decision, not a layout one — see "what is left".

## 10. The Overdrive gauge is an event (#37)

A label (`OD`), a READY state that recolours it to `Overdrive` in gold with a
slow pulse, and a one-shot flash on the render that crosses 100. `prevGauge`
is what makes it one-shot: the class is written on the crossing render only, so
the animation cannot loop. The label rides inside `.ig-stat__od`'s own
`position: relative` box, so no row geometry moved.

Still missing: **a sound**. "A READY state on the party row with a one-shot
flash and a stinger" is the issue's own wording and the stinger is the audio
track's — see the requests below.

## 11. The command slab says what the command does (#27)

`AvailableCommand.help` is written by **exactly one producer in the whole
repo** — `battle/ffx/commands.ts:115`, for items, out of `ItemDef.description`.
Every ability row therefore arrived at the menu with `help: undefined`, which is
why CHEER, PROVOKE, DELAY ATTACK, DELAY BUSTER, FLEE and TALK rendered with an
MP chip and nothing else.

`src/ui/ffx/commandHelp.ts` derives the sentence from the move's own record
through the advisor's `describeAbility`, so the advisor card and the menu slab
cannot disagree about what Hastega does, and a data agent retuning a spell
cannot leave a stale sentence behind. A disabled row now says why *and* what it
would have done. A category row with one enabled entry describes that entry
rather than offering to open a list the player will never see.

**Two registries, and the browser pass is what found the second.** Attack and
Defend are structural — `battle/ffx/registry.ts`'s `CORE_ABILITIES`, not
`src/data` — so the first run had a blank slab on the row every FFX menu opens
on. `ABILITIES` is asked first, because a data file may override a core id.

Targeting no longer takes the slab over. It used to print the target's bare
name, so the one surface that could have said what the move does spent the whole
aim saying "Mortiorchis". The target has the enemy plate now.

## 12. How part two was verified

`npx tsc --noEmit` clean over `src/`. `ui-ffx-enemy-plate` (18 new cases),
`ui-ffx-hud`, `ui-ffx-hud-safe-zones`, `ui-enemy-intent`, `ui-strategy-guide`
and `strategy-guide` green.

**Real keys, real battle, real boxes.** `npx vite build` into a scratch dir and
`vite preview` on port 5688, headless Chromium with `tools/screenshot.mjs`'s own
SwiftShader flags, Chapter 1 at **1600x900** and **1280x720**, seven HUD states
each driven with `page.keyboard`. Every state computes the painted boxes of
thirteen HUD elements, every reticle, and every fighter's screen rect projected
through the live `PaintedStage`, and asserts zero overlap.

Two notes on the method, because both cost time:

- **A dev server is unusable in this tree.** Five other agents are editing files
  right now and vite's HMR full-reloaded the page mid-run, three times in ninety
  seconds. A built preview is static and is what the numbers below come from.
- **The battle never starts under SwiftShader.** `presenter.snapshot().phase`
  sits on `moment:battle-start` for ever at the 6 fps this renderer manages,
  because `App.maxDelta` is 1/20 s and in-game time advances 50 ms per rendered
  frame — critic round 02 **#19**, which is the stability track's, not this one's.
  `trigger('battle:skip')` drops the animation holds and hands the first decision
  straight to the player; the HUD, its panels and the projector are all exactly
  what a human gets. The same clamp is why the plate's seven-second auto-fold
  takes ~45 s of wall clock in this harness and ~7 s in a 60 fps game.

**The result, after four passes.** Of the 14 measured states, **12 are
completely clean** and the other two carry a 12 and a 6 square-pixel corner
between the intent slab and the raised command-info card — the dodge's own 4 px
gap, lost to rounding. Zero slab-on-fighter and zero slab-on-reticle overlaps at
either viewport, which is issue #14 answered; and zero slab-on-panel overlaps
otherwise. The first three passes are what found the four errors the previous
two commits fix, each of which was reasoning that the screen disagreed with.

The harness is `tools/hud-safe-area-check.mjs` and it is worth keeping: it is
the only thing in the repo that measures a HUD panel against a *fighter*. Its
output is `docs/screenshots/fix3/ffx-hud/after-report.json` and the shots are
`after-<viewport>-0N-*.png`, plus `after-1600x900-08-guide-more.png` for the
guide's affordance.

---

## Requests for other tracks

**To whoever owns `src/ui/ffx2/CommandMenu.ts`:** it has the **identical Esc
race** described in §2 — its `KEY_CANCEL` branch steps `target -> sub -> top`
and publishes the release inside the `keydown` handler, so the screen's poll on
the next frame sees a free Esc and opens the pause on the same press. The fix is
two lines: import `releaseCancelAfterPress` from `src/ui/ffx/cancelClaim.ts`
(or lift that module to `src/ui/common/`, which is probably where it belongs
now) and use it on the cancel path instead of `setMenuOwnsCancel(false)`. Not
done here because the file is not this track's.

**To whoever owns `src/engine/HudPort.ts` / `BattlePresenterStage.ts`:** the
projector answers with *points*, so a HUD that needs an actor's screen **rect**
has to reconstruct it, and this round spent three measured constants and one
shipped bug on that reconstruction. A `projectRect(id)` — the stage already has
`PaintedActor.poseSize`, and the matrix harness projects its four corners in
about ten lines — would delete `SPRITE_HALF_WIDTH_RATIO`,
`SPRITE_TOP_MARGIN_RATIO`, `SPRITE_FOOT_MARGIN_RATIO` and their safety margins
outright.

**To whoever owns `src/ui/common/MoveAdvisor.ts`:** `MoveAdvisorAnchors` can
only describe a horizontal band between two elements, which cannot express "the
shelf above the party's heads". Please take an optional
`zone?: () => { left, width, bottom, maxHeight } | null` that, when it answers,
wins over `layout()`'s own measurement; `FFXBattleHud.placeAdvisor()` then stops
being a post-hoc overwrite of another component's inline styles. *(The earlier
request to make `MIN_CARD_WIDTH` per-instance is withdrawn — FFX now uses the
advisor's own 132.)*

**To whoever owns `docs/ENGINE-API.md`:** its "HUD safe area" section still says
the CTB cap abbreviates the longest name — "Braska's Final Aeon reads
'Braska's F…'". That has not been true since `0ac7f09`; the plate wraps and no
name in the five chapters is abbreviated. The rail itself is unchanged at 0.843,
so only that paragraph is stale. **Two new entries for that section** while
someone is in there: the Sensor plate is `x 436..536, y 176..254` on the grid
(§6), and no HUD panel may be drawn over a fighter's projected quad, which is
now enforced for the intent slab (§7) and for the advisor card (§4).

### New with part two

**To whoever owns `src/ui/common/MoveAdvisor.ts` and
`src/engine/tactics/advisor.ts` — round 02 #38 is still open.** The card prints
its effect twice, once as a raw key: on the live Chapter 1 board this round's
own capture shows *"Speeds the party's turns up · inflicts Haste"* immediately
above *"Haste on the party."* The first is `describeAbility`'s derived sentence
(`suggestion.effect`); the second is `reasonFor`'s buff branch
(`advisor.ts:713`, `` `${list} on the party` ``), printed as the reason. Both
files are that track's, so this one did not touch them. The fix is one rule —
when the reason would only restate what the effect line already says, print the
effect and drop the reason, or print the reason and drop the effect. The same
shape produces "Inflicts Shell" / "Shell on the party." and "+ MAX HP X2" /
"Max Hp X2 on the party."

**To whoever owns the audio tracks — the Overdrive stinger.** Round 02 #37 asks
for "a READY state on the party row with a one-shot flash **and a stinger**".
The state, the label and the flash are done (§10) and the cue is not: nothing in
`src/ui/ffx/` may reach into the mixer, and the crossing is already detectable
in one place (`PartyStatusWindow.prevGauge`). A one-shot SFX id plus a
`onOverdriveReady?: (id) => void` hook on the party window would finish it.

**To whoever owns `src/ui/ffx2/FFX2BattleHud.ts` — the FFX-2 half of #14 and
#28.** `EnemyIntentMountOptions.density` and the `brief` body shipped with this
round and FFX-2 passes neither, deliberately: Bailey's rule of 2026-09-19 is
that a change true of one game is not applied to the other without checking.
If X-2's slab has the same problem — it is the same panel, mounted on the same
overlay at `FFX2BattleHud.ts:299` — the change is `density: 'brief'` plus a
fighter-rect `avoid` list built the way `FFXBattleHud.fighterViewportRects()`
builds its own. The citation strip (§8) is **not** opt-in and already applies to
both games, because a research key on screen is wrong in either.

---

## What is left

- The **Overdrive row is still offered when its picker has nothing to pick** —
  Kimahri with no Rage learned still gets an Overdrive row that opens an empty
  list. Backing out is now instant and harmless, but the row should not be
  enabled at all; whether it is offered is decided by the engine's
  `AvailableCommand[]`, which this track does not own.
- **The shelf's height moves with the Sensor card.** With the card up the shelf
  is ~39 grid px tall in Chapter 1 and the advisor scrolls; with it down the
  card grows back to its full 104. Correct, and visibly jumpy. A card that
  animated between the two, or a shelf that reserved the Sensor card's band
  unconditionally, would read better.
- **`.ffx-sensor` is still 84% opaque** over the boss art. It reads fine because
  it sits on dark backdrops in all three chapters, but it is the same class of
  problem as the party rows and would be worth the same treatment if a brighter
  scene ever lands behind it.
- The **`before-*` screenshots are 1280x720 only** and were taken at `88e5b64`
  by the first half of this round; the `after-*` set covers all four viewports.

### Left by part two

- **The shelf no longer moves with the Sensor card** — that entry above is
  settled by §6, which took the plate out of the band entirely. What replaces
  it: the plate now overlaps the **boss's legs**, and on a brighter backdrop
  than Chapters 1-3's that 84% ink panel will read as a sticker on the painting.
  The opacity note above still stands and now matters more.
- **The strategy guide is still longer than its rail** with an FFX command menu
  open: at both viewports and in all seven measured states it sits at the last
  fit rung with the MORE chip up. Nothing is cut mid-word and nothing is silent,
  which is what #29 asked for — but the right end state is a guide written to
  the rail it has, or a second page, and both are content decisions.
- **The plate's auto-fold is untested in a browser.** `SENSOR_OPEN_MS` is
  counted in game time, which this renderer advances at 50 ms per frame at 6
  fps, so seven seconds is ~45 s of wall clock in the harness and the pass
  proves the *toggle* rather than the *clock*. The clock is pinned in
  `ui-ffx-enemy-plate.test.ts` with a fake `dt`; a browser proof needs the
  stability track's fix for #19 first.
- **`commandEffectText` can still answer `''`** for an id neither `ABILITIES`
  nor `CORE_ABILITIES` holds — a chapter-local ability, if one is ever added.
  That is today's behaviour, not a regression, and it is deliberately a blank
  rather than a guess. A test asserting that every row every chapter offers
  produces a non-empty sentence would catch the first one; it belongs with
  round 02 #12's "every row the menu offers, submitted verbatim" test, which is
  the engine track's.
- **`#38` is untouched** — see the requests above. It is the one addendum item
  this track was asked for and did not do, because both files that could fix it
  belong to the advisor track.
