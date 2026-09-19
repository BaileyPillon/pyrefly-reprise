# fix3 — ffx2-hud-prep (round 3)

Track owner: `src/ui/ffx2/**`, `src/ui/ffx/party-prep/**`,
`src/ui/common/party-prep.css`, `src/ui/common/portrait.ts`, plus the new
`src/ui/ffx2/ChainCounter.ts`, `src/ui/ffx2/SpherechangeFlourish.ts`,
`src/ui/ffx2/spherechange-flourish.css` and
`tests/unit/ui-ffx2-chain-flourish.test.ts`.

The previous two passes of this track closed the four carried-over defects and
survived an adversarial verifier; that work is at `bf0e017` and its record is
in this file's git history. **This round is a different brief.** Bailey played
the live build, the chief critic ran round 02 on it (`critic/rounds/round-02.json`,
headline 3.5), and Bailey asked for a named list of presentation work — with
the standing rule that **a change true to one game is not applied to the
other**.

So this pass does three things:

1. the round-02 ranked issues that land in this track's files;
2. the items on Bailey's list that land in this track's files;
3. a re-verification of the four carried-over defects, live, rather than a
   re-do.

Every change below is labelled with which game it is true to.

---

## 1 — "Change" is one command, and it is FFX-2's (rank 26, FFX-2 only)

**What was live.** The FFX-2 command window read

```
Attack   Skill ◂   gunner   black-mage   Item ◂
```

Two internal ids, on the most player-facing surface in the game. Measured, not
inferred: `docs/screenshots/fix3/critic-ffx2-hud-prep/report-f.json` has the
row text off the live DOM at three viewports.

**Why it happened.** `battle/ffx2/targeting.ts:258` emits one `AvailableCommand`
per *reachable node* and sets `label: to` — the raw dressphere id — and
`CommandMenu.ts` gave each spherechange its own top-level row.

**Why it was also wrong about the game.** X-2 has no per-outfit command. You
press L1, the Garment Grid opens, and the destination is chosen *inside it*
(`research/visual-bible.md` §4.5.2). One row, one grid.

**What it is now.** Every spherechange collapses into one **Change** row with
the `.ig-cmd--overdrive` treatment (§4.5: it costs the whole turn), opening a
submenu that names each reachable dressphere and carries §4.5.4's gate-preview
line — `GRANTS: Red + Green` — which that section calls "the single most
valuable line on the screen". Curse seals the row outright
(`ffx2-combat-core.md` §Curse: the L1 menu is disabled) instead of opening a
submenu of dead ends.

Live after: rows read `["Attack","Skill◂","Change◂","Item◂"]`, submenu reads
`["Gunner GRANTS: Red","Black Mage GRANTS: Yellow"]`.

**FFX gets none of this.** `src/ui/ffx/CommandMenu.ts` is a different component
in a different track and was not touched. FFX has no Garment Grid.

## 2 — The spherechange gets its moment (Bailey's list, FFX-2 only)

`BattleEvent` has carried a `spherechange` variant all along.
`FFX2BattleHud.onEvent` fell through to `default:` and drew **nothing**. So the
most expensive action in X-2 — it costs her whole turn — read as a two-letter
monogram quietly changing in a 40 px party row, with no pause and no
acknowledgement. The price was paid and nothing happened.

`SpherechangeFlourish.ts` plays `research/visual-bible.md` §4.5.4's **Commit
VFX**, to the approved spec rather than invented:

> the transformation plays on the field — a vertical `#FFFFFF` light column
> over the girl for 12 frames while 8 `#F7B6D9` petal-motes orbit outward, the
> new outfit resolving on frame 9, and a `#FFD9EC` ring expanding from her feet
> to radius 90 px and fading

plus §4.5.4's gate-arrival line ("the earned effect's name rises 14 px above
her in the gate colour") and §3's budget ("Budget ~0.8 s"). It is **awaited**,
because §3's mechanic "halts time"; the party rows are redrawn as it settles so
§4.5.4's "Cost, made visible — her ATB bar is empty and begins refilling" lands
on screen while the light is still fading.

With no projected anchor it draws nothing and resolves at once: a spherechange
must never be able to wedge the battle loop on a missing projector.

**FFX gets none of this.** There is no spherechange in FFX and `FFXBattleHud`
never sees the event. Yuna's summons have their own approved moment and it is
not this one.

## 3 — The chain counter gets its numeral (Bailey's list, FFX-2 only)

What shipped was one rotated tag reading `CHAIN ×2.00`: the *multiplier*, on
one line, with no numeral and no `CHAIN` label — so the mechanic X-2's whole
damage output is built on had no readout of its own length.

`ChainCounter.ts` is §4.6: **the count big, `CHAIN` beneath it**, a scale-pop
and a burst of six petal-motes per increment, the three escalation tiers
(5 → gold glow, 10 → `#FFF0A8`→`#F2712E` fill, 20 → the full-screen flash) and
§4.6's decay when the chain breaks, which the old chip did not have at all —
it just vanished. The multiplier rides along on the label, because §4.6 draws
the count big but the multiplier is what the count buys.

It also pulls ~40 lines back out of the 830-line `FFX2BattleHud`.

**FFX gets none of this.** FFX has no chain mechanic and emits no `chain`
event.

### 3a — and it is *placed*, not just pinned

This is the defect the new spec created, found live and fixed in the same
round. §4.6's anchor ("top-right of the enemy being chained") was written for
an 11 px tag. At §4.6's real size — a 28 px numeral over a 10 px label, about
100 px tall at a 1280x720 letterbox — the same anchor put the counter across
Bahamut's body (112x14) and across the enemy-intent slab (99x81).

The chip now goes through `placeSlab` from `intentPlacement.ts`, the solver the
intent slab already steers with: it keeps its §4.6 spot when that spot is free
and steps aside when it is not. Its obstacle list is the slab's list **plus the
slab itself** (that list exists to place the slab, so it necessarily leaves it
out) and **minus the chip** (it must not dodge its own last rectangle). The
chip is a 1.4 s transient and the slab is standing furniture, so the chip is
what moves.

The old chip's `-8deg` tilt went with the change: a 50-grid-px block on a slant
is harder to read, §4.6 does not ask for one, and a rotated box is not where
its layout rect says it is, which is what a placement solver needs.

## 4 — The FFX ITEMS tab reads as items (rank 40, FFX only)

`src/ui/ffx/party-prep/panels.ts:171` printed `entry.itemId` — `hi-potion`,
`mega-phoenix` — straight onto the screen, and its 88 px well showed six of 28
kinds with nothing saying there were twenty-two more. Names now come from
`itemLabel()`, the registry lookup the results ledger already used.

**Two columns, because FFX's own item menu is two columns** — and that turns
six visible rows into twelve. **FFX-2's bag stays one column**: `ui/ffx2/
party-prep/panels.ts` already used real item names and X-2's item list is a
single column. This is one of the places the games genuinely differ and the
difference is kept.

The Overdrive tab was the same class of leak: the mode rows printed the
`OverdriveModeId` (`stoic`, `daredevil`) with a CSS `text-transform` hiding it
on screen but not in the DOM, so CHK-007's copy grep would have caught it.
FFX names its modes Stoic, Warrior, Comrade — proper nouns — and now so does
the row. **FFX-2 has no Overdrive modes and no such tab.**

## 4a — One Esc, one meaning (found live; **not** caused by this round, FFX-2 only)

Driving the new Change submenu with real keys turned up something worse than
what I was looking for: **one tap of Esc in an FFX-2 submenu stepped back to
the top row *and* opened the pause screen.** The probe
(`critic/scratch/fix3-ffx2/esc-probe.mjs`) reproduces it on the *ability*
submenu too, so it is not the Change row's doing — it has been in every FFX-2
fight since the pause screen landed, and Bailey would have hit it the first
time he pressed Esc in a Skill list.

It is the exact race `src/ui/ffx/cancelClaim.ts` was written for during the FFX
track's fix-3 round. The menu is a DOM `keydown` listener firing *between*
frames; `BattleScreen.handleInput` polls `justPressed('cancel')` once *per*
frame. Releasing the Esc claim the instant the menu steps back lets the screen
find that same press still fresh as an edge a frame later and take it as its
own. FFX-2's menu simply never adopted that module.

It does now — the same module, not a copy. Before: both submenus ended on
`screen() === 'pause'`. After: both end on `'battle'`.

## 5 — A STATS tab for FFX-2 prep (rank 40's parity half, FFX-2 only)

Of FFX's two extra tabs, one has a real X-2 counterpart and one does not.

- **STATS does.** Added.
- **EQUIPMENT and OVERDRIVE do not, and stay absent on purpose.** X-2 has no
  weapons and no armour — the dressphere *is* the equipment and accessories are
  the only slots, which the Accessories tab already covers — and it has no
  Overdrive modes at all. This is rank 40's "written exception list".

The tab earns more than parity. [ffx2-combat-core §5.1]: **a girl's stats are a
function of (dressphere × level) only.** Yuna, Rikku and Paine are identical in
the same sphere at the same level, which is why `FFX2MemberBuild` carries no
stat block and the engine derives one. A player arriving from FFX will assume
the exact opposite — that the character has the stats and the outfit is
cosmetic — and nothing in the game has ever told them otherwise. So the tab
prints her worn block and then every sphere she owns as a *delta* against it,
the same comparison §4.5.4 puts on the Garment Grid, and the rule becomes
self-evident rather than merely true.

Read-only like every tab here; every figure comes from the engine's own
`dressphereStats()`.

## 6 — The four carried-over defects, re-verified

Not re-done — re-measured live on this build, because §1–§3 touch the same
surfaces.

| defect | state |
|---|---|
| FFX-2 party rows show no painted portraits | closed at `7cb8417`/`bf0e017`; live rows carry `art/characters/<girl>-<dressphere>/idle.png` under `art/portraits/<girl>.png`, per the current dressphere, with the monogram as the floor. Re-measured this round. |
| FFX-2 prep has only the Chapter tab | closed; **five** tabs as of this round (CHAPTER / DRESSPHERES / STATS / ACCESSORIES / ITEMS), all reading the real build — see §5. |
| Auron's HUD portrait is badly cropped | closed at `bf0e017`; every row in `src/ui/common/face-crops.json` is measured off the painting and pinned by `tests/unit/ui-portrait-face-crop.test.ts` (84 cases, including the file-size check that broke Auron in the first place). |
| FFX-2 HUD overlap at four viewports | re-measured; §3a is the one new overlap this round introduced and closed. |

`faceLayersHtml` was also exported from `ui/common/portrait.ts` and adopted by
`PartyRows`, so the prep screen's roster can take it in one line — see the
request below.

---

## Answers to two critic findings this track deliberately did **not** act on

**Rank 28 — "Chapter 4 shows an unnumbered pink bar" for enemy HP.** This is
correct FFX-2 and should stay. X-2 keeps an enemy's HP secret until it is
scanned; `FFX2BattleHud.revealed` already gates the numerals on a `sensor`
event and the strip prints a `SCAN` hint until then. Making the boss's HP
always numeric would be truer to the rubric's clarity criterion and **false to
the game**, which is the trade Bailey's standing rule resolves in the game's
favour. If clarity is judged to win here, it is a design decision, not a bug
fix, and it needs Bailey — the FFX half of that finding is a different track's
anyway.

**Rank 41 — "Party prep ships an extra CHAPTER tab as the default".** Left
alone, and flagged as a question rather than a fix: the approved mockup's first
tab is STATS, but Bailey's own list for this round asks to "show me the room
before you ask me to fight in it", which is an argument *for* leading with the
chapter briefing. Changing the default tab is a change to an approved mockup
and the house rule is a mockup before integrating a screen. **Question for
Bailey below.**

---

## Requests to other tracks

**To the FFX-2 battle track (`src/battle/ffx2/**`) — expose the Garment Grid.**
The **Change** row should open the real node graph in
`src/ui/ffx2/SpherechangeWheel.ts` (§4.5.2: the ring of nodes, the gate orbs,
the travelled links in blue, the `R1 SPECIAL DRESS UP` pill). That component is
built, tested and today **only reachable from the HUD mock screen** — no real
fight has ever shown it. It cannot be wired from this side because its input is
the grid's *node contents*, which live in `Ffx2Engine.gridNodes` (private) and
are never handed to a HUD. What is needed is either that map on the snapshot,
or the whole `GarmentGridDef` for the acting girl on `AvailableCommand`. Until
then the Change submenu is the honest degradation: it names every destination
the engine offers and the gate each one crosses, but it cannot draw the route.

**To the FFX-2 battle track — label spherechange rows.**
`battle/ffx2/targeting.ts:258` sets `label: to` (a raw id). The UI works around
it via `command.extra.toDressphere`, which is authoritative anyway, but the
`label` field is still wrong for any other consumer.

**To the shell track (`src/app/screens/PartyPrepContent.ts`) — one line.**
Its roster and slot cards call `faceImgHtml(id)` alone, so **Paine** — who has
no `portraits/paine.png` — gets her name initial on the prep screen where the
battle gives her a painted face. `faceLayersHtml` is now exported for exactly
this:

```ts
faceLayersHtml([`${id}-${dressphere}`, `${id}-x2`, id], `${id}-${dressphere}`, name)
```

Not done here because the call site is the shell's, and changing
`faceImgHtml`'s own semantics would silently push body crops into the pause
screen and chapter select mid-round.

**To the FFX HUD track — check `ui/ffx/CommandMenu.ts` for the Esc race.**
FFX-2's menu had it and FFX's `cancelClaim.ts` is the cure, so the FFX menu is
presumably already using it — but it was not verified from this side, and §4a
shows how easy it is for one menu to be left behind. One run of
`critic/scratch/fix3-ffx2/esc-probe.mjs` pointed at a Chapter 1–3 fight settles
it.

**To the move-advisor track (`src/ui/common/MoveAdvisor.ts`) — the card
overruns its band.** This is the one overlap left in the FFX-2 battle matrix
and it is not the fence's. Measured on the `menu` state at 2000x1000:
`advisor-card X fighter:paine 82.4x13.5` and `advisor-chip X fighter:paine
61.5x20.9`. The fence this HUD publishes is right — it is parked past Paine's
shoulder, it now includes the toggle chip's band above the card and the card's
own skew lean, and every other state in the same run measures zero. What
happens is that `layout()` is handed a band narrower than the card's minimum
width (the girls on one side, the party column on the other) and resolves it by
spilling *left*, back over the girl the fence was protecting. It needs to
shrink, wrap or move up instead, and only that file can decide which. It is
intermittent because it depends on where the formation is standing on the frame
the card lays out: clean at 1280x720 and 1600x900 in the same run.

**To `src/ui/common/EnemyIntent.ts`'s track — a real placement pass.**
`intentPlacement.ts` exists only because `layout()` dodges obstacles in one
greedy pass. Two components now steer through that module from the outside
(the slab and, as of this round, the chain counter). A real candidate search
inside `layout()` would let the whole module be deleted.

**To the art fleet.** `portrait.portraitFocal` reads
`public/art/portraits/<id>.json` for a `focal: { fx, fy, ipd }` block and it
wins over the measured table. The pipeline already writes that sidecar with
`width`/`height`; adding the three focal numbers at render time is what would
let `face-crops.json` be deleted and stop a re-roll ever needing a human.

---

## Questions for Bailey

1. **Prep's first tab.** The critic wants STATS (the approved mockup's first
   tab); your own list wants the room shown before the fight, which is what the
   CHAPTER tab does. Keep CHAPTER as the default, move it to the end, or get a
   new mockup approved?
2. **FFX-2 boss HP.** X-2 hides enemy HP until Scan, and the game currently
   does. The critic reads that as a clarity blocker. Stay true to X-2 (hint
   until scanned) or always show the boss's bar with numbers?
3. **Chain counter size.** §4.6's numeral is 28 px in the 640x360 grid — big
   enough that it has to be steered around the boss rather than sitting beside
   him. Is that the spectacle you want, or should it be smaller and always in
   its §4.6 spot?

---

## How it was verified

Real Chromium (Playwright, the repo's SwiftShader flags) on a `vite` dev server
on port **5748**, driven through `window.__pyrefly` into the actual Chapter 4
and Chapter 5 fights and both prep screens with real `page.keyboard` input —
including walking to the **Change** row by its text and opening it with Enter —
then reading `getBoundingClientRect` for every panel and the painted stage's own
`project(id, 'head'|'feet')` for every living fighter. The chain counter was
driven at every escalation tier (3 / 7 / 12 / 22) and the spherechange
transformation on a real girl at her real projected position, both through the
HUD's own event port exactly as the engine drives it. Server stopped at the end.

The rig is `critic/scratch/fix3-ffx2/drive3.mjs`. Vite's HMR socket is stubbed
(`ctx.routeWebSocket`) because other tracks are editing this working tree and a
save of theirs mid-run reloads the page and throws the measurement away.

The measurement also greps every player-facing label element for anything still
shaped like an internal kebab id, so the rank-26 class of defect fails the run
rather than needing to be noticed.

### Two holes in the rig, found and closed

Worth recording, because the previous round's screenshots have the first one
too and nobody noticed.

1. **A transient outlived by its own screenshot.** The chain counter lives
   1.4 s and the spherechange light 0.8 s; a `page.screenshot` of a SwiftShader
   frame takes longer than either. So the rig measured the chip in the DOM,
   wrote "19 boxes, 0 overlaps" — and photographed a frame it had already
   expired out of. The first version of this round's evidence showed an empty
   patch of sky where the counter had been, and the report said it was there.
   The rig now re-fires the event through the HUD's own port on an interval
   until the shutter closes, and freezes the flourish's animations 420 ms in so
   the captured frame is the same beat every time instead of whatever was
   caught.
2. **A skewed box is not an overflowing one.** The rig flags `.prep__sheet` as
   overflowing horizontally (`scrollWidth` 373 vs `clientWidth` 364) on every
   tab of both games. That 9 units is the `skewX` the sheet is drawn with
   painting past its layout box; `overflow` is `visible` and nothing is
   clipped. It is a false positive, not a defect — noted so the next reader
   does not chase it.

### What the matrix said

Chapters 4 and 5, 1280x720 / 1600x900 / 2000x1000 / 2560x1440, across the
command menu, the Change submenu, the chain counter at every escalation tier
(3 / 7 / 12 / 22) and the spherechange transformation:

- **zero panel-on-panel and panel-on-fighter overlaps**, including the two this
  round introduced and then closed (§3a) — before the fix the counter wore
  Bahamut (112x14) and the intent slab (99x81) at 1280x720;
- **zero raw ids** on any player-facing label, in either game;
- the command rows read `Attack / Skill / Change / Item`, and the Change
  submenu `Gunner — GRANTS: Red` / `Black Mage — GRANTS: Yellow`;
- the counter reads its count, its label and its multiplier, with six motes and
  the right tier at each threshold;
- the flourish names the outfit, prints the gate and draws its eight motes.

Prep, both games, same four viewports, every tab and every member: **zero
overlaps**; FFX-2 now reports five tabs
(`CHAPTER / DRESSPHERES / STATS / ACCESSORIES / ITEMS`) against FFX's six.

**The exact number.** The final matrix is eight battle contexts — Chapters 4
and 5 at all four viewports — of nine measured states each. **One** of the
seventy-two carries an overlap: Chapter 4 at 2000x1000, on the `menu` state
only, `advisor-card X fighter:paine 82.4x13.5` and `advisor-chip X
fighter:paine 61.5x20.9`. Every other state of every other context is zero,
including all four chain tiers, the transformation, and 2560x1440 where the
counter is at its largest.

That one is the move-advisor card overrunning the band this HUD gives it, not
the band being wrong — the request, with the numbers, is in the handoff section
above. It is intermittent because it depends on where the formation is standing
on the frame the card lays out; an earlier run showed the same class at
1280x720 (16x31 on Rikku) and the runs either side of it measured zero at that
viewport. It is written down rather than rounded away.

---

## Left / known residue

- **The Garment Grid wheel is still unreachable in a real fight.** See the
  request above. This is the biggest thing left in this track.
- **Yuna's and Rikku's face tiles are the same painting in every dressphere.**
  Only the monogram and its colour change, because no `<girl>-<dressphere>`
  portrait exists. The lookup is in place; this is a request to the art fleet.
- **`yojimbo`'s crop is measured off one lit eye** under a hat brim — the least
  confident row in `face-crops.json`.
- **Boss idle paintings still use the generic body estimate.** Only the FFX-2
  dresspheres are measured.
- **The spherechange flourish is not in the obstacle list.** It is a
  transformation playing *on* the girl, deliberately over her, for 0.8 s — the
  same reason `.ffx2sc` is excluded. If it should dodge the chrome, say so.
- **§4.5.4's gate-arrival "orb flies from the link to the girl"** is not drawn:
  there is no link on screen to fly from until the wheel is wired. The gate is
  named on the plate instead.
- **The Stats tab shows two of twelve spheres at a time.** The panel gets
  334x113.3 units and the comparison table gets what is left after the worn
  block and the rule; the rest scroll behind a masked edge. A girl with
  thirteen dresspheres wants a wider sheet or a second page, and both are the
  shell's call.
- **The chain counter is the loudest thing in the frame at 2560x1440.** §4.6's
  28 px numeral scales with the letterbox, so at 4x it is a 112 px figure. It
  is placed clear of everything, but whether that is the spectacle Bailey wants
  is question 3 below, not something to decide from here.
