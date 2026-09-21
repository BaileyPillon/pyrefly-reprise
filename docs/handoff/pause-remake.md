# Pause, remade on the Until Dawn character screen

**Status:** built on `main`, green, **one fix pass applied** (see "Fix pass,
21 Sep" at the end), not live and not yet reviewed.
**Owner of this track:** the pause session. **Game:** both — see "Game-aware" below.
**Approved target:** the tile *"Pause remade on the Until Dawn character screen"*
in [`docs/target/targets.json`](../target/targets.json); decision **D-021** in
[`docs/target/decisions.json`](../target/decisions.json).

---

## What Bailey said

> *"We need to remake the pause menus and please see here and carefully
> replicate it but with our art style and direction (ignore text on the
> screen)"* — Bailey, 21 Sep 2026, with a link to the Until Dawn character
> screen.

> *"This needs to be included in our next build as well."*

Shown [`docs/concepts/pause-until-dawn/`](../concepts/pause-until-dawn/)
(`sheet.png`, `grades.png`, `options.json`, `README.md`) with four questions,
Bailey answered, exactly:

> **"B, yes, yes, yes"**

1. Grade A "faithful" or grade B "ours"? → **B**, the warm ink-and-gold grade.
2. May the text block sit on whichever side of the painting is empty? → **yes**.
3. Are these the right meters? → **yes**.
4. May MUSIC be its own tab? → **yes**.

README questions 5 (merge `H` and `F`) and 6 (anything missing) were **not
asked and are not answered**: both keys stay as they are, and `options.json` →
`preservedFunctions` is the build checklist.

**One thing on this screen is an agent's guess, not Bailey's word:** weapon,
armour and Sphere Level live on the CHAPTER tab. README question 3 offered a
third column, the CHAPTER tab, or dropping them, and Bailey answered "yes" to
the meters without naming a home. It is recorded under `reaction.inferred` on
the target tile, along with the GUIDE tab's content and the member-tab order.
**Ask before treating any of the three as approved.**

---

## What is on screen

One full-bleed painted close-up per party member, graded dark. **No panels, no
boxes, no cards** — every line floats on the picture.

| where | what |
| --- | --- |
| top | a thin full-width tab strip: `Q`/`L1` at the left end, `R1`/`E` at the right; the members on the field first, then CHAPTER, GUIDE, OPTIONS, CONTROLS, MUSIC. A 2px HP hairline under each member, red below 30%; an accent dot on a tab with something live on it. |
| left (or right) | two columns of hairline meters: **BATTLE STATS** (HP, MP, Strength, Magic, Defence, Magic Def, Agility) and the game-aware **IN THIS FIGHT**. The five other tabs put their rows in exactly the same place. |
| bottom left | the chapter's current objective — the first of its three that is not done — as one big thin-serif line under a tiny `CHAPTER n · location — subtitle` eyebrow. |
| bottom right | `Esc RESUME`, with `H hide panels` under it. |

`H` still leaves the painting and one line bottom-left. `F` is still photo mode.

### Which side the chrome stands on

Whichever side of **this** painting is empty. `pause/plates.ts` carries one row
per plate — focal point, head size and side — and the two plates `options.json`
→ `art.perPlate` names *"subject left of centre — needs the mirrored chrome"*
(**FFX Yuna at 30%, Paine at 25%**) are the two that mirror. FFX-2 Yuna's focal
is further left than Tidus's and she keeps the chrome on the left, because her
plate takes a 1.9x crop with room to push her face right — which is what
approved frame (c) shows. A plate with no row falls back to focal x < 0.35.

### The framing is the composition

`plates.framePlate` is `build.mjs`'s own `plate()` arithmetic: cover, zoom until
the head reaches about three quarters of the frame's height, pan so the focal
point lands on the side the chrome is not on, clamp so no edge is empty page,
and refuse to magnify a master past 1.25x. **`object-fit: cover` cannot do
this** — a 1.75 plate on a 16:9 window covers with almost no overflow, so there
is nothing to pan and every face ends up dead centre whatever its sidecar says.
That was the first browser pass's main correction.

A portrait screen takes **no** extra zoom: cover already throws away three
quarters of the width, and zooming on top of it left one eye filling the phone.

---

## Game-aware (AGENTS.md rule 14)

| | FFX | FFX-2 | why |
| --- | --- | --- | --- |
| the layout, the strip, the seven stat rows, the objective line, `H` | yes | yes | shared plumbing, `critic/CHECKS.md` CHK-020 |
| Overdrive gauge, Overdrive mode | **yes** | no | Overdrive is FFX's limit system [ffx-combat-core §5.1] |
| statuses with their remaining duration | **yes** | no | the `battle-254` model that makes REST OF BATTLE true is FFX's [§4.1] |
| Turn order, "Nth of N" | **yes** | no | CTB has a queue to be Nth in; ATB has a clock |
| ATB, Active/Wait, Chain, Dressphere, Garment Grid, gates | no | **yes** | all six are X-2's own systems [ffx2-combat-core §1.1–1.5, §3, §4.1] |
| WEAPON / ARMOUR / S.Lv on CHAPTER | **yes** | no | FFX-2 gear is dresspheres and accessories; an empty `WEAPON --` would be a lie |
| gold accent / pyre pink accent | gold | pink | `presentation-ink-and-gold.md` |

Both directions are asserted with an **absence** test in
`tests/unit/pause-remake.test.ts`.

### Three things the mockup drew and this does not

1. **The dim bar extension** for what an FFX-2 Garment Grid and accessories add.
   `Combatant.stats` is the *effective* block with modifiers already applied and
   no base block is on the state, so the size of the bonus cannot be read, only
   guessed (hard rule 6).
2. **A status row in an FFX-2 chapter.** The approved frame (c) has none, and
   the duration wording this screen uses is FFX's model.
3. **A turn-order row without a forecast.** `predictTurnOrder` is on the
   engine's runtime, not on `BattleState`, so it is handed in through
   `PauseScreenOptions.turnOrder`. Absent (a cutscene, FFX-2, a test) the row is
   not printed. "Nth of N" counts the **actors in the queue**, not the depth the
   forecast was asked for — on **both** sides of the "of" (see the fix pass at
   the end; the first build counted tiles on one side and actors on the other).

---

## The files

| file | what |
| --- | --- |
| `src/app/screens/PauseScreen.ts` | lifecycle, the keyboard claim, what a press means |
| `src/app/screens/pause/PauseView.ts` | everything on screen, and the model behind it |
| `src/app/screens/pause/PortraitStage.ts` | the plate: which file, the framing, the push-in, the cross-fade, **and the living-portrait seam** |
| `src/app/screens/pause/plates.ts` | per-plate framing and the mirror side |
| `src/app/screens/pause/meters.ts` | the two meter columns, game-aware |
| `src/app/screens/pause/panels.ts` | the five fixed tabs' rows |
| `src/app/screens/pause/tabs.ts` | the strip's model |
| `src/app/screens/pause/markup.ts` | every string of HTML |
| `src/app/screens/pause/keys.ts` | the raw-key collision table |
| `src/app/screens/pause/actions.ts`, `settings.ts` | firing a row, nudging a setting |
| `src/app/screens/pause/PauseOverlays.ts` | photo mode and the replayed briefing |
| `src/app/screens/pause/options.ts`, `turnOrder.ts` | the host contract, and the CTB forecast |
| `src/app/screens/PauseScreenPanels.ts` | trimmed to the OPTIONS rows; the party cards and PARTY tab are gone |
| `src/ui/common/pause-screen.css` | rewritten |

Every one is under the house 400-line cap.

### The one file outside the track that changed

`src/app/screens/BattleScreen.ts` gains **one option** on the pause it opens:
`turnOrder: () => previewTurnOrder(this.engine)`. Without it the TURN ORDER row
could never exist, because the forecast is not on `BattleState`. Additive, one
line plus its comment, and `previewTurnOrder` is this track's own module.

### The living portrait

Another agent is prototyping an animated, gaze-controllable portrait
(`docs/concepts/pause-until-dawn/prototype/`,
`docs/plans/pause-living-portraits.md`). `PortraitStage` exposes
`PortraitDriver` — `mount(plate, plateId)`, `setGaze(x, y)`, `blink()`,
`setExpression(name)`, `dispose()` — and `attachDriver()` hands it the live
plate. With no driver attached the three verbs are no-ops that remember the last
request, so **the rig can be dropped in without touching the layout, the CSS or
any caller**. The screen's `snapshot()` reports gaze, expression and whether a
driver is attached.

---

## The keyboard, and why `pause/keys.ts` exists

`app/Input.ts` binds one key map for the whole product and three of its bindings
collide with this layout: `Q` is `triangle`, `E` is `start`, `F` is `l1`, `Tab`
is `triangle`. Here they mean previous tab, next tab, photo mode and next tab.
So the screen answers them **raw**, through its keyboard claim, and drops the
abstract button they also carry for that frame — otherwise one press of `E`
would change tab *and* close the menu. `pause/keys.ts` is that table, pure, and
the three collisions have a test each.

Everything else: arrows walk the strip (or the rows, in the body), `L1`/`R1`
walk it on a pad, Down or Confirm enters a tab's rows, Esc goes up one level and
then resumes, a click or a tap jumps straight to a tab, and the strip is one
horizontally scrollable row so a phone can swipe it.

---

## What was verified, and how

`npx tsc --noEmit` clean. `node tools/orphans.mjs` names no module of this
track. Full `npx vitest run`: **5208 passed, 1 file added, 0 failed.**

**Unit** (`tests/unit/pause-remake.test.ts`, 44 cases;
`pause-remake-css.test.ts`, 19; `pause-panels.test.ts`, 16) — real
`KeyboardEvent`s through a real `Input`, a real `SaveStore`, and **real engines**
built the way `BattleScreenWiring.createEngine` builds them. Tab order and
cycling on five input devices, the three key collisions, all twenty entries of
`preservedFunctions`, the game split both ways, the mirror, the framing at every
window the brief names, reduced motion, `H`, and the CSS floors evaluated as
arithmetic.

**Browser** — one pass on this session's own vite server (port 5617),
`PYREFLY_BROWSER=gpu`, chapter 1 and chapter 4 played to their first command
menu and paused for real. Captures under
[`docs/screenshots/pause-remake/`](../screenshots/pause-remake/), and
target-versus-build pairs for frames a, b, c and d beside them.

Measured in the browser, per state: **every text run at least 14 effective CSS
px** at 1280x720, 1600x900, 2000x1012 and 2560x1080 (43 runs, minimum 14 at
1600x900, 17 at 2000x1012), and **at least 12** at 390x844 (39 runs, minimum
12). Nothing clips at any of the five: the only element outside the viewport is
the painting itself, which is the crop, and the tab strip on the phone, which is
the swipe. No horizontal page scroll anywhere.

### What the browser pass changed

1. **The framing.** `object-fit: cover` put every face dead centre. Replaced
   with `build.mjs`'s own arithmetic — the single biggest difference between the
   first pair and the approved frames.
2. **The mirror.** FFX-2 Yuna was mirroring on a focal-x threshold; frame (c)
   does not mirror her. The side is now per-plate data from `options.json`.
3. **"1st of 10"** was reading out the forecast depth. Now counts actors.
4. **`RESTART ENCOU…`** — command rows were sharing the meters' fixed key
   column. They now take the width they need.
5. **The phone** overran its own objective line: five rows a column, a 20px
   line, and no extra zoom on a portrait screen.

---

## What is not done

- **Not live, not reviewed.** `node tools/critic-plan.mjs` will class this as a
  shared-system change (a whole screen, a new stylesheet, `BattleScreen` wiring):
  a focused review of the production candidate before the deploy and the deep
  review after it (D-016).
- **`tests/e2e/pause.spec.ts` has not been re-pointed** at the new DOM. It
  drives the old `.pause__row` menu and the old hint strip. It is the next thing
  anyone touching this should do.
- **The three inferred placements** (weapon/armour/S.Lv on CHAPTER, the GUIDE
  tab's content, the member-tab order) need a yes.
- **The MUSIC tab's "something new" dot** is never set: there is no unlock feed
  to read. Member tabs carry the dot.

---

## Fix pass, 21 Sep 2026

An adversarial verification of the build above refuted four claims. All four
were measured on a real browser (its own vite server on 127.0.0.1, Playwright,
`PYREFLY_BROWSER=gpu`), not read. Each is fixed at its root and pinned by a test
that fails on the old code with the exact symptom that was photographed. **Game
case: both** for all four — three are shared plumbing (input, stylesheet, the
chapter flow) and the fourth is an FFX-only *row* fixed inside an FFX-only
branch, so nothing about FFX-2 changes either way (AGENTS.md rule 14, CHK-020).

### 1. TURN ORDER printed an impossible position and dropped a live member

`pause/meters.ts`. The numerator was the index of the member's next **tile** in
the depth-10 forecast (0..9); the denominator was the number of distinct
**actors** in it. Two scales. A live chapter-1 forecast is ten tiles held by
four or five actors, so Tidus printed **"5th of 4"** and a run three turns in
printed **"8th of 5"**; and `findIndex` answering -1 dropped the row entirely,
so Yuna — slow enough that her next turn is past the tenth tile — was alive on
the field with the screen refusing to answer a question it had just asked.

Both halves now count **actors, in the order their next turn comes up**, so the
ordinal can never exceed the count. A member past the end of the forecast is
told so in words (`After 4 others`) rather than given a number the forecast
cannot support, and a member who is down says `Out of the queue`
(AGENTS.md rule 6: the forecast does not know, so the screen does not guess).

New export `turnOrderRow`. Pinned by `pause-remake.test.ts` — "prints *Nth of
N* on one scale, and gives every member on the field a row" (fails on the old
code with *`5th of 4: expected 5 to be less than or equal to 4`*) and "never
tells a downed member she is Nth in a queue she is not in".

### 2. Shift+Tab hid the whole screen instead of walking the strip back

`pause/keys.ts` + `PauseScreen.onClaimedKey`. `KEY_MAP` binds **both** Shift and
Tab to `triangle`, and `triangle` on this screen hides the chrome. Holding Shift
latched it, the chrome went down, and the Tab behind it hit
`if (this.panelsHidden) return;` and died. The affordance only ever looked like
it worked under a synthetic `press('Shift+Tab')`, which delivers both keys
inside one frame — which is exactly what the certifying test did, by calling the
claimed-key handler directly with `{shiftKey:true}` and never running the
`Input` layer where Shift means `triangle`.

Shift now answers `{ intent: null, suppress: 'triangle' }`: on this screen it is
a modifier and nothing else, and `onClaimedKey` drops the button before anything
looks at it. `H` and the pad's own triangle still hide — which is exactly the
pair the CONTROLS tab lists (`H / Triangle`); Shift was never advertised.

Pinned by "holding Shift does not hide the chrome, and Shift+Tab still walks
back", which walks the **real `Input`** frame by frame (Shift down, 450 ms of
frames, then Tab), and by "H and the pad still hide the chrome".

### 3. Two BATTLE STATS labels clipped at 1280x720

`ui/common/pause-screen.css`. `--pu-fs` bottoms out at 14px on every desktop
window, so the labels keep the width they need whatever the viewport does —
`MAGIC DEF` is 89px and `STRENGTH` 87px at that floor — while `--pu-key` went on
shrinking with `6.25vw` and hit its 84px floor at 1280x720. The cell is
`overflow:hidden; text-overflow:ellipsis`, so both rows printed as `MAGIC D…`
and `STRENGT…` on the one laptop size in the set.

The floor is now **96px**: a floor that scales with the type, not with the
window. Pinned by `pause-remake-css.test.ts`, which evaluates `--pu-key` and
`--pu-fs` at all four desktop sizes and the phone and asserts the column fits
the measured label; it fails on the old sheet at 1280x720 and nowhere else.

### 4. RESTART ENCOUNTER did nothing on the path a player takes

`BattleScreenFlow.runChapter` — **pre-existing plumbing, not introduced by the
remake**, but preserved function 2 of `options.json` was not true, so it is
fixed here. Entered the way a player enters a chapter (board → prep → fight),
RESTART closed the pause and left the player on chapter select for good; through
the debug one-shot harness the same row restarted.

`GameFlow.owned` still pointed at the battle screen from the previous run, and
`main.ts` sends the player back to the board with `goto`, which is not a flow
navigation and never touched `owned` — so the next run's first `show` read a
fresh start as *"something navigated out from under us"*, set `handedOver` and
returned false. Under the debug harness there is no follow-up `goto`, `current`
still equalled `owned`, and it worked. A run started from outside `start`'s own
loop now says it owns the stack before `show` looks at `owned`; re-entrant calls
keep the guard, which is the case it was written for.

The same stale `owned` sat under **every second chapter of a session**, not only
under RESTART. New file `tests/unit/pause-restart-flow.test.ts` pins both, on
the same `FakeApp` shape `flow-post-scene.test.ts` uses; both cases fail on the
old code with *"expected null not to be null"*.

### Verified

`npx tsc --noEmit` clean. Full `npx vitest run`: **216 files, 5223 passed, 2
skipped, 0 failed.**

Browser pass, own vite server on 127.0.0.1:5743, `PYREFLY_BROWSER=gpu`
(`.pause-fixes-verify-tmp.mjs`, `.pause-fixes-pairs-tmp.mjs`; server stopped by
its own listening PID afterwards):

| | measured |
|---|---|
| **A** turn order | chapter 1, seed 1, ~9 s of `autoBattle('intended')`, then `P`. Live forecast = 5 distinct actors; Tidus **5th of 5**, Yuna **3rd of 5**, Kimahri **2nd of 5** — every member on the field has a row and no ordinal exceeds its count. |
| **B** Shift+Tab | `keyboard.down('Shift')`, 450 ms, `press('Tab')`. Stage class stays `pause__stage lb-stage` throughout (never `pause--bare`), and the tab goes Tidus → **Music**: the backwards wrap. |
| **C** clipping | 0 truncated labels at 1280x720, 1600x900, 2560x1080 and 390x844, measured as `scrollWidth > clientWidth` on every `.pause__k`. At 1280 the column is 96px and every label is 96. |
| **D** restart | Board → prep → fight, played to **turn 4 / 42 log entries**, Esc → OPTIONS → RESTART. Ends on `battle`, pause closed, **turn 1 / 3 log entries**: a fresh fight, not the old one resumed. |

Captures re-taken under [`docs/screenshots/pause-remake/`](../screenshots/pause-remake/):
`a-ffx-tidus.png`, `b-ffx-yuna.png`, `size-1280x720.png`, `shift-tab.png`, and
the target-versus-build pairs `pair-a-ffx-tidus.jpg` and `pair-b-ffx-yuna.jpg`.

### Still not done

`tests/e2e/pause.spec.ts` is still pointed at the old DOM (unchanged by this
pass), and the three inferred placements still need Bailey's yes.
