# Onboarding — option C, Auron's briefing

**Status: built, refuted in four places, repaired, green, not deployed.** Commits
`5e8eca5` (the target), `b8a905f` (the build) and the fix-pass commit that follows.
Live verification and the critic review are still owed.

## The fix pass (2026-09-20) — what an adversarial verifier refuted, and the repair

Four findings, none of them cosmetic. Each repair is pinned by a test that fails
without it; the first three were re-measured on the running game afterwards.

### 1–2. Confirm and cancel leaked through the briefing — **root cause, one bug, three symptoms**

Measured before: first launch → Enter on the title → briefing → Enter again left
`__pyrefly.screen() === 'party-prep'`, so a first-timer never saw the chapter board;
Escape left `'title'`, backing the board out; the pause replay re-raised itself on
every confirm, forever; the title replay started the flow. The two keys printed on the
briefing's own foot were exactly the two that misbehaved.

The cause was **not** in the briefing. `Input.claimKeyboard` stopped the DOM **event**
in the capture phase but `Input.onKeyDown` then still ran `this.press(button)`, so the
abstract `confirm` / `cancel` button was latched and the next screen's `handleInput`
saw `justPressed()`. The gamepad had a worse version: the pad is polled both in
`Input.update()` and in the overlay's own `requestAnimationFrame`, and whichever ran
first decided whether the screen behind also acted.

The repair (`src/app/Input.ts`) is a second kind of claim:
`claimKeyboard(onKey, { exclusive: true })`.

- a key an exclusive claimant swallows latches **no** abstract button;
- while the claim is up every screen behind reads no button, no axis and no queued
  `data-action` at all (`Input.blind`);
- the frame **after** the claim is handed back drops every pending edge
  (`absorbEdges`, `swallowFrames`), so the two poll loops' order stops mattering;
- a still-held button never produces a second edge, and a genuinely new press after
  the overlay is live input again — both asserted.

Three consequences in the callers:

- `raiseBriefing.ts` takes the exclusive claim. `Briefing.onClick` now
  `stopPropagation()`s, so a `briefing:skip` click cannot be queued for the screen
  behind either.
- `PauseScreen` no longer forwards input to the briefing at all — forwarding is what
  made the replay unskippable, because confirm reached `handleAction` a moment after
  the briefing had resolved and re-activated the still-selected REPLAY BRIEFING row.
  `Briefing.handleInput` and the `driven` option are gone with it.
- The briefing's own pad watcher now sets `ignoreSuspend`
  (`src/ui/ffx/rawInput.ts`): the pause overlay mutes every HUD watcher, and the
  briefing is the overlay that mute protects the fight *from*, so it has to keep
  reading the pad when it is replayed from pause.

### 3. The FFX-2 badge asserted something the running game does not do

The badge read **NOTHING PAUSED · GAUGES RUNNING**. Measured: Chapter 4,
`state.ticks` 8189 → 8189 across 1 502 ms with the line up, per-actor ATB identical,
rendered bar widths identical to four decimals; Chapter 5 the same. And the control
run with `?coach=off` at the same moment is identical — **the coach layer is not the
cause**. `BattlePresenter` awaits `HudPort.chooseCommand` and the FFX-2 engine is
ticked only in its `waiting` branch, so the X-2 clock does not advance during command
input in this build at all, with or without teaching.

The verifier's own framing: either the badge goes or the X-2 input model runs the
clock. The second is a combat-core change, it is an Active-vs-Wait question, and
under hard rule 10 it needs Bailey's yes — so it is written up under "Open" and the
badge went instead. It now reads **KEEP PLAYING · NOTHING TO PRESS**: two things that
are measurably true of the line (the menu is open underneath it, the arrows move the
cursor while it fades, and it asks for no key). Bailey named the property *"FFX-2
lines come from Rikku with nothing paused"* — that is about the line, and it holds.
The mockup's badge text was an incidental label in the image, not a named property,
and the departure is recorded on the C3 tile in `docs/target/targets.json`.

### 4. The test that was supposed to prove the clock keeps running proved nothing

`ui-coach-layer.test.ts` read the engine's gauges, then ticked the engine **itself**,
then asserted the gauges had grown. They always had. The coach layer never touches
the engine, so the assertion could not fail. Replaced by two that can:

1. the inner HUD is asked for the menu **before a single `await`** — the X-2 line and
   the menu go up in the same turn of the event loop;
2. a driver shaped like the presenter's own loop ticks a **real `FFX2Engine`** once
   per turn while the HUD's promise is outstanding, and counts the turns; a held line
   only resolves when its 5.2 s fade timer fires, which in that loop is never.

Both were mutation-checked: adding `await shown` to the FFX-2 branch turns (1) red,
and flipping `ffx2-gauge` to `holds: true` turns both red.

## What Bailey approved

On **2026-09-20**, from three mocked options (`docs/concepts/onboarding/sheet.png`,
`options.json`, `README.md`), Bailey picked, verbatim:

> **C: Auron's briefing** — "Twenty skippable seconds in the game's own voice (Auron's
> painting, four lines framing both clocks), then one whispered line the first time
> something is real; FFX-2 lines come from Rikku with nothing paused; replayable from
> pause."

The approved end state is the three frames under
`docs/concepts/onboarding/c-aurons-briefing/`. They are now registered as approved
tiles in `docs/target/targets.json` (group `fight`), each carrying Bailey's words and
the date. Options **A** (taught first turn) and **B** (field notes) are kept on the
board as **"Not chosen"** — they were never rejected, they simply were not picked.
A pick approves what Bailey named, so the incidental `D` key label printed on the C1
frame was **not** treated as approved: `D` is already Move Right in `app/Input.ts`, so
"never show this again" is on Shift / pad Y, and the foot says so.

## Game case (hard rule 14)

Decided from `research/ffx-vs-ffx2-presentation.md`, not from memory.

| piece | case | why |
|---|---|---|
| the briefing, the seen-set, the off switch, the replay rows | **both** | shared plumbing, CHK-020. It is also the one surface where the two clocks are named side by side, which is why it is shared. |
| Auron's voice, and a line that **holds** the decision | **FFX only** | §9 row 3: the turn-order preview is true for FFX and not true for FFX-2, and FFX's engine is already parked waiting for a command, so one confirm press freezes nothing that was running. |
| Rikku's voice, and a line that **never** holds | **FFX-2 only** | §4.2 / FC-4: the gauge is a four-phase pipeline that is filling the whole time. §4.3 / FC-5: its purple charge segment is canon's own cost preview. Stopping it to teach is the one thing X-2 never does. |
| the pause row worded **BATTLE HELP** | **FFX-2's wording, used in both** | `research/ffx-vs-ffx2-presentation.md:278` — Battle Help is a real entry in FFX-2's Config list. The switch itself is shared; only the label is borrowed. |

`tests/unit/ui-coach-copy.test.ts` asserts the absence in both directions: no FFX id is
offered to FFX-2 and no FFX-2 id to FFX.

## What was built

| file | what |
|---|---|
| `src/ui/coach/coachCopy.ts` | the whole copy deck, one file, reviewed once (OPTIONAL 18) |
| `src/ui/coach/coachState.ts` | is help on, has this been seen, and the `?coach=off` suppression |
| `src/ui/coach/Briefing.ts` | C1: twenty seconds, skippable from frame one, "never show this again" |
| `src/ui/coach/CoachMark.ts` | C2 / C3: one line, FFX holds it, FFX-2 fades it |
| `src/ui/coach/CoachLayer.ts` | `withCoach(game, hud)` — a `HudPort` decorator, not an edit to either HUD |
| `src/ui/coach/coach.css` | Ink & Gold tokens only; sizes in real CSS px, never on the letterbox grid |
| `src/app/screens/raiseBriefing.ts` | the one join between `App` and the briefing |
| `src/app/SaveData.ts` | `Settings.battleHelp`, `SaveData.seenCoach`, and the veteran migration |
| wiring | `BattleScreenWiring.createHud` (the lines), `BattleScreenFlow.start` (the briefing), `PauseScreen` (two rows), `TitleScreen` (`B` and a chip), `debug/api.ts` (`setCoaching`, `markCoachSeen`, `coaching`) |

Triggers are keyed by **mechanic**, not by chapter, so a first-timer who opens the
board and picks Chapter 3 is taught the same things as one who starts at Chapter 1:

| id | fires | game |
|---|---|---|
| `ffx-turn-order` | the first command menu of the run | FFX |
| `ffx-overdrive` | an Overdrive row is first offered and enabled | FFX |
| `ffx-aeon` | a Summon row is first offered and enabled | FFX |
| `ffx2-gauge` | the first command menu of the run | FFX-2 |
| `ffx2-dressphere` | the first `spherechange` event | FFX-2 |
| `ffx2-chain` | the first `chain` event above 1 | FFX-2 |

Art: the briefing uses `public/art/characters/auron/idle.png` and
`public/art/backdrops/dreams-end.png` — the same approved paintings the mockup used,
framed with CSS only. **Nothing was generated, recropped or regraded.**

## The paper critique, item by item

`docs/plans/onboarding-review.md` lists 14 required changes for the approved idea.

**Applied in full**

- **R1 — key by mechanic, not by chapter.** Done, table above. Nothing is authored
  against Macalania or Leblanc.
- **R3 — no turn queue in FFX-2.** No line mentions a queue; the X-2 line names the
  gauge, which is what X-2 has.
- **R4 — one teaching surface at a time.** The layer holds at most one live line, and
  `coach.css` takes the advisor card down under it (measured: advisor card opacity 0
  at every viewport, below). Every surface measured at 1280x720, 1600x900, 2000x1012
  and 390x844: no text under 14 css px, nothing clipped, zero overlap with the command
  menu, the party rows or the target cursor.
- **R6 — coaching differs per game.** The whole point of `CoachLayer`; see the table.
- **R7 — off switch, seen-set, and the veteran migration.** `battleHelp` and
  `seenCoach` added; a pre-onboarding save with a cleared chapter is marked a veteran
  (every id seen, help off) and one with nothing cleared is not. With no storage the
  briefing plays once per **session**, not per navigation.
- **R8 — suppression shipped with the feature.** `?coach=off` plus
  `__pyrefly.setCoaching(false)` / `markCoachSeen()` / `coaching()`. Verified: a fresh
  profile with the flag shows nothing in either game.
- **R9 — approved target first.** Registered before a line of `src/` was written, in
  its own commit.
- **R11 — the phone and the glyphs.** Every surface is clickable and tappable (a tap
  fires `click`), so no copy is key-only. The briefing's foot names real keys that
  exist on this build's own map, and the pause row is reachable with a pad.
- **R14 — name what is on screen.** "turn order", "the gauge", "Overdrive", "aeon",
  "dressphere". A test greps every player-facing string for `§`, research ids,
  camelCase and bare CTB / ATB.
- **OPTIONAL 18 — one copy file, reviewed once.** `coachCopy.ts`, with the grep in CI.

**Applied in part, deliberately**

- **R2 (an ability help line on every leaf row)** and **R15 / R17 (the reference and
  glossary pages, the spherechange and chain moments)** are separate tracks, not
  option C. Bailey picked "twenty seconds, then one line" — a help string on several
  hundred ability rows is a different feature with its own end state and its own
  approval, and building it here would be shipping something nobody picked (rule 10).
- **R13 (teach a loss)** — the defeat screen is still a **gap tile** on the board with
  no approved picture. Writing the loss line before Bailey has seen options for that
  screen is exactly what rule 9 forbids. It stays on the board as a gap.

**Does not apply to option C**

- **R5 and R12 (dependencies: Chapter 4 reaching results, post-battle scenes, #26 /
  #27 / #29 / #30)** — those gate the *first-time-player verification pass*, not the
  build. They are other tracks' work and several have since landed; the pass itself is
  still owed and is listed under "Open" below.
- **R10 (a RECOMMENDED / START HERE card on chapter select)** — option C teaches by
  mechanic, in every chapter, so a player who jumps to Chapter 3 is coached anyway.
  That was R10's own stated purpose. Flagging a card is also a visible change to an
  approved board tile with no picture of its own, so it needs Bailey first.
- **R16 (reuse the cold open as the link preview / OG card)** — a metadata fix, not a
  perceivable screen; it belongs with round-02 #33.

## How the fix pass was verified (2026-09-20)

`npx tsc --noEmit` clean. **Full suite: 158 files, 4 229 tests, all green** (4 221
before; +8 new). `node tools/orphans.mjs`: nothing in `src/ui/coach/` is an orphan.

New and rewritten tests, each of which fails without its repair:

- `tests/unit/ui-coach-input-leak.test.ts` (new, 7 tests) — a **real `Input`** attached
  to a real `window`, a **real `Briefing`**, real `KeyboardEvent`s and a stubbed
  `navigator.getGamepads`. Enter and Escape are dismissed and then *not* delivered on
  that frame or the next; a click on the foot queues no action; the pad is swallowed
  whichever way the two poll loops are ordered, and a fresh press afterwards still
  arrives; an ordinary (non-exclusive) claim still reads its own keys, so the pause
  menu is untouched; the briefing's watcher still hears input while every other one is
  muted.
- `tests/unit/ui-coach-layer.test.ts` — the two real FFX-2 assertions above, plus the
  badge pin: the line must not contain "gauges running" or "nothing paused".
- `tests/unit/ui-coach-briefing.test.ts` — the `driven` test replaced by one that
  dismisses the replayed briefing while `setRawInputSuspended(true)`.

**One browser pass**, my own Vite server on **port 5731** (`--strictPort`, stopped
afterwards — the port is no longer listening), `PYREFLY_BROWSER=gpu` for every run.
The verifier's own probes were re-run unchanged, so the numbers are comparable:

| probe | before | after |
|---|---|---|
| first launch, Enter to skip (`probe3.mjs`) | `screen: party-prep` | **`chapter-select`** |
| first launch, Escape / click / wait-out (`probe4.mjs`) | Escape → `title` | **all three → `chapter-select`** |
| title replay, `B` then Enter (`probe3.mjs`) | `chapter-select` (flow started) | **`title`** (second Enter then starts the flow, correctly) |
| pause replay, Enter (`probe2.mjs`) | briefing re-created on every press, forever | **first Enter dismisses it, `created 0`** (a later Enter replays it, because REPLAY BRIEFING is still the selected row — ordinary menu behaviour) |
| pause replay, Escape (`fix-verify.mjs`) | briefing gone **and the pause menu closed** (`.pause__row` 0) | **briefing gone, `.pause__row` 12 → 12, `screen: pause`** |
| FFX-2 badge, chapters 4 and 5 (`fix-verify.mjs`) | `NOTHING PAUSED · GAUGES RUNNING` | **`KEEP PLAYING · NOTHING TO PRESS`**, 3 command rows live under it, still up after an ArrowDown |
| FFX line (`fix-verify.mjs`) | unchanged | 0 command rows under the held line, 6 after one Enter, line gone |

Scratch scripts (not product code): `critic/scratch/onboarding/fix-verify.mjs` plus
the verifier's existing `probe2.mjs`, `probe3.mjs`, `probe4.mjs`.

Captures re-taken at 1600x900 and 390x844 after the fix, and the three
target-versus-build pairs rebuilt and looked at:
`docs/screenshots/onboarding/c{1,2,3}-*.png`,
`docs/screenshots/onboarding/pairs/{c1-briefing,c2-first-use-ffx,c3-ffx2-replay}.jpg`.
C1 and C2 read as the approved frames. C3 reads as the approved frame with the one
badge departure above.

## How it was verified (first build)

- `npx tsc --noEmit` clean. `node tools/orphans.mjs`: nothing in `src/ui/coach/` is an
  orphan.
- **30 new unit / jsdom tests**, all of which fail without the feature. Proven, not
  assumed: flipping `ffx2-gauge` to `holds: true` turns
  `ui-coach-layer.test.ts > FFX-2 never holds the fight` red — it times out at 15 s,
  which is precisely the failure a held X-2 fight would be.
  - `tests/unit/ui-coach-copy.test.ts` — the deck, both absence directions, CHK-007.
  - `tests/unit/save-coach-migration.test.ts` — the veteran rule, a corrupt
    `seenCoach`, a rubbish save blob, a real `SaveStore` over a real storage double.
  - `tests/unit/ui-coach-layer.test.ts` — a **real `FFX2Engine`** for Chapter 4 and
    real `KeyboardEvent`s for the FFX hold. **Superseded:** its gauge before/after
    assertions were tautological and were replaced in the fix pass — see item 4 above.
  - `tests/unit/ui-coach-briefing.test.ts` — a fake clock for the twenty seconds, a
    real key press before the opening fade, a real click, the keyboard claim.
- **Full suite: `npx vitest run` → 157 files, 4221 tests, all passing** (4191 before).
- **One browser pass**, own Vite server on port 5644, `PYREFLY_BROWSER=gpu`
  throughout, server stopped afterwards. Zero console errors, zero page errors.
  Measured live at **1280x720, 1600x900, 2000x1012 and 390x844**, both games:

  | | min font | under 14 px | clipped | overlap with command menu / party rows / target cursor | advisor card |
  |---|---|---|---|---|---|
  | briefing | 14–15 px | 0 | 0 | none | n/a |
  | FFX line | 14 px | 0 | 0 | none | opacity 0 |
  | FFX-2 line | 14 px | 0 | 0 | none | opacity 0 |

  Two real defects were found by that measurement and fixed: at 1280x720 the X-2 slab
  met the party rows (1 174 px² — moved from 42 % to 38 %), and on a phone the
  "nothing paused" badge overran the slab by 9 px (tracking gave way, the 14 px floor
  did not).
- Pause rows read back from the live DOM in **both** games:
  `… HIDE PANELS, REPLAY BRIEFING, BATTLE HELP ON, OPTIONS …`, and replaying from the
  row with real arrow and Enter presses puts the briefing back up. Captures:
  `docs/screenshots/onboarding/pause-rows-{ffx,ffx2}-1600x900.png`,
  `briefing-replay-{ffx,ffx2}-1600x900.png`.
- **Target versus build pairs, looked at**:
  `docs/screenshots/onboarding/pairs/c1-briefing.jpg`, `c2-first-use-ffx.jpg`,
  `c3-ffx2-replay.jpg`. All three read as the approved frame. Known, deliberate
  differences from the mockups: the skip/never-again keys (see above), and the mockups'
  concept slate and tag, which are not part of the game.

## Open

0. **A question for Bailey, not a defect to fix quietly: should the FFX-2 ATB run
   while you are choosing a command?** Today it does not — `BattlePresenter` awaits
   `HudPort.chooseCommand` and ticks the FFX-2 engine only in its `waiting` branch, so
   every gauge stands still during command input, measured at 0 ticks across 1.5 s in
   both X-2 chapters, with teaching on and off alike. The sources
   (`research/ffx-vs-ffx2-presentation.md` §4.2, row "Command input": *Active mode:
   time runs. Wait mode: time freezes on entering a submenu*; §4.3 / §14 FC-4) say
   this is the **Active / Wait setting**, which the build does not implement at all —
   and §4.2 also notes the real game shows an on-screen indicator when it toggles
   itself, which we do not have either. Game case if it is taken on: **FFX-2 only**
   (chapters 4-5); FFX is turn-based and has no such clock. This is a combat-core
   change that would alter every X-2 fight's difficulty, so under hard rule 10 it
   builds nothing without an explicit yes, and it would need a deep review. The
   onboarding badge no longer depends on the answer either way.
1. **Not deployed and not reviewed.** `node tools/critic-plan.mjs` will call this a
   shared-system change (save schema, `HudPort` wrapper, global layout), so it needs a
   **deep review before going public**.
2. **The first-time-player pass (rubric rule 6, R11 of the critique) has not been run.**
   Nobody has yet played each chapter cold and said in their own words what turn order,
   an Overdrive and a dressphere are.
3. **Not wired into `playwright.config.ts` or `tools/screenshot.mjs`.** They do not
   need it today — every e2e spec reaches its screen through `__pyrefly.goto()` /
   `gotoChapter()`, which bypass `GameFlow.start()` where the briefing lives — but a
   future spec that presses Enter on the title will meet it. Add `?coach=off` there.
4. **Still on the board as gaps:** the defeat line (R13) and the RECOMMENDED card
   (R10), both of which want Bailey's pick first.
5. `docs/CONTRACTS.md` was **not** touched — `src/app/SaveData.ts` is not a listed
   contract file and both additions are optional-by-migration — so there is no
   `CONTRACT-CHANGES.md` entry. Worth a second opinion at the deep review.
