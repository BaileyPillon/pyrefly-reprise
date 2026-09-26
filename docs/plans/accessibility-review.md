# Paper preflight: accessibility settings, option C (pause rows plus a one-time comfort card)

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, written **before any
product code**, 2026-09-26, by a sub-agent of the driver session. Track: `accessibility`
(PR-0032, reopens D-005). Nothing in `src/` is changed by this document.

`node tools/critic-plan.mjs --paths src/app/SaveData.ts,src/app/Input.ts,src/app/screens/TitleScreen.ts,src/engine/BattlePresenterStage.ts,src/app/screens/PauseScreenPanels.ts`
says **DEEP, before deploy** ("save data and settings is a shared system"), obligations
live + focused + deep, checks CHK-002 003 006 008 009 015 016 017 020 021 022 023 024,
targets fight, pause, phone, presentation. Settings are save data, so this is the one
class whose deep review runs on the candidate **before** the deploy, not after.

Bailey, verbatim, 2026-09-26 about 17:30 EDT, answering the driver's question ("I
recommend C: rows in the pause menu, plus a one-time comfort card at the title so
players can set text size and flashes before the first flash"):

> "Yes I'll go with your recommendations for all"

What that approves, and only that (rule 9: a pick approves what was named): **option C**
of `docs/concepts/accessibility-2026-09-26/` (README.md, sheet.jpg, `desk-C-prompt.jpg`,
`phone-C-prompt.jpg`, and A's rows `desk-A-options.jpg`, `desk-A-controls.jpg`,
`phone-A-options.jpg`), **the card wording as mocked** ("Before the first fight · Make it
comfortable · Three choices, all off unless you turn them on"), the four settings as the
README's table defines them, all off by default. The FFX 130 % frames (`desk-hud-130.jpg`,
`desk-dbox-130.jpg`, `phone-hud-130.jpg`, `phone-dbox-130.jpg`) are the target for the FFX
HUD, the dialogue card and the phone. **Not approved because nothing drew it:** the FFX-2
HUD at 130 %, the pause at 130 %, and every choice listed in §9 as inferred.

---

## 1. Game case (rule 14)

**Both.** The four settings, the pause rows, the comfort card, the key map, `SaveData`,
the presenter's ports and the dialogue card are shared plumbing (CHK-020); one setting
means the same thing in every chapter.

Per-game parts, decided from the code and the concept README, not from memory:

- **FFX only:** the desktop HUD's 130 % layout moves (command list capped at 4 rows with
  ▲ ▼, the CTB turn queue at 5 portraits, the enemy card up and left, the advisor right).
  The CTB queue does not exist in FFX-2.
- **FFX-2 only:** the `ffx2hud` 130 % layout pass (its own ATB rows, chain chip, telegraph
  plate). The concept README says "nothing here measures it". The FFX-2 raw-key readers
  (`src/ui/ffx2/CommandMenu.ts`, `SpherechangeWheel.ts`, `TriggerHappy.ts`,
  `LadyLuckReels.ts`) have to follow the remap. The flash sources in §5.2 marked X-2 are
  also FFX-2 only.
- **Both:** the save schema, the card, the pause rows, the CONTROLS tab, the dialogue
  card, the screen flash and actor flash ports, the camera.

---

## 2. What is true today (read from the code)

- `src/app/SaveData.ts` is **559 lines**, already over the house cap. `SAVE_VERSION = 1`,
  key `pyrefly-reprise:save:v1`. `migrate()` spreads `{...defaultSettings(), ...raw.settings}`,
  so a new settings field gets its default on an old save with **no version bump**. That
  is the precedent: `battleHelp`, `ffx2AtbMigrated` and `ffx2AtbSpeed` were all added this
  way. Unknown fields also survive: `...raw` and `...raw.settings` are both kept, so an
  older build that reads a newer blob and writes it back does not strip the new fields.
- `Settings.reduceMotion` exists, and its default is the OS `prefers-reduced-motion`
  query. Today it is followed by the title (motes, parallax), the pause (`PortraitStage`,
  smooth scroll), `Briefing` and `CoachLayer`/`CoachMark`. It is **not** followed by
  battle, `ui/inkgold/wipe.ts` `playWipe`, `ui/common/transitions/swirl.ts` or
  `cutsceneFx.ts`. Those three read only the OS query. The ten CSS
  `@media (prefers-reduced-motion)` blocks also follow only the OS query.
- `lowEffects` and `skipSeenCutscenes` exist in the save, but no pause row shows them.
  `optionRows()` (`PauseScreenPanels.ts`) shows 6 rows. Its comment says reduceMotion
  "belongs to a settings screen, not to a menu opened mid-fight". Bailey's pick
  supersedes that comment.
- **The key map is not one table. It is at least nine.**
  - `app/Input.ts` `KEY_MAP` (private; 11 abstract buttons).
  - `ui/ffx/rawInput.ts`: its own copy of `KEY_MAP`, used by every FFX menu and minigame
    and by `BattleScreen`, `Briefing`, `CoachMark`, `menuCancel`, `SensorPanel`,
    `TriggerPrompt` and `AirshipOrderWidget`.
  - `ui/ffx2/CommandMenu.ts` and `SpherechangeWheel.ts`: `KEY_CONFIRM`/`KEY_CANCEL`
    sets, arrows hard-coded.
  - `TriggerHappy.ts` and `SpherechangeWheel.ts`: `KeyR`/`PageDown`.
  - `LadyLuckReels.ts`: confirm codes.
  - `CoachMark.ts`: `CONFIRM_KEYS`.
  - `Briefing.ts`: `NEVER_KEY = 'KeyD'` and Tab.
  - `pause/keys.ts`: raw Q, E, F, Tab, Shift and H.
  - Single-letter raw toggles: `BattleScreen` P, `TitleScreen` B, `StrategyGuide` G,
    `MoveAdvisor` N, `EnemyIntent` E, `SensorPanel` I, `enemy-intent-overflow` J,
    `DemoScene` H.

  A remap that changes only `Input.ts` would do nothing inside a battle menu.
- **Flash and strobe sources.** The full inventory is in §5.2. None of them reads a
  setting, so nothing can switch them off today.
- `saveMerge.ts` (the two-tab merge) compares settings **per key with `!==`**. A
  primitive setting merges correctly. An **object-valued** setting (a key map) differs
  from base on every write, because each parse makes a new object. The tab that writes
  last would then always clobber the other tab's remap.
- `Input._lastDevice` starts as `'keyboard'`, so "a touch-only phone hides the remap row
  until a keyboard or pad is used" cannot be read off `lastDevice` as it stands.
- `tests/fixtures/saves/` does not exist yet. `tests/e2e/save-upgrade.spec.ts` (PR-0195,
  the CHK-024 matrix) is batch 5's and is not written yet.
- A second save-data change is queued: PR-0203 / D-210, the lower SFX default for new
  profiles only (`docs/plans/thresholds-program-2026-09-26.md`). No batch owns
  `SaveData.ts`.

---

## 3. The save schema change and migration

### 3.1 Fields (all additive, all optional in the stored blob, all default OFF)

| field (in `Settings`) | type | default | what it records |
|---|---|---|---|
| `textSize` | `1 \| 1.15 \| 1.3` | `1` | TEXT SIZE 100 / 115 / 130 % |
| `reduceFlashes` | `boolean` | `false` | REDUCE FLASHES |
| `reduceMotion` | `boolean` | (exists) OS query | unchanged; battle now follows it |
| `keyBindings` | `Partial<Record<Button, string[]>>` | absent = the shipped map | only the buttons the player changed; each value is the full list of `KeyboardEvent.code`s for that button |
| `comfortAsked` | `boolean` | `false` | the comfort card has been answered (BEGIN or Esc) |

**Why `comfortAsked` lives in `settings`, not in `seenCoach` or at the top level:**

- `seenCoach` has the veteran rule. A save with a cleared chapter gets every coach id
  marked seen, which would hide the card from every returning player, Bailey's own save
  included. The README says "everyone sees the card once".
- A new top-level field is dropped by `mergeOtherTab`'s `...theirs` whenever the other
  tab's blob lacks it.
- Settings merge per key, and a boolean merges correctly.

**Why the key map is stored as a delta (only the changed buttons):**

- A save that never remapped carries nothing.
- A later change to the shipped defaults reaches every player who has not touched that
  button.
- RESET TO DEFAULTS deletes the field.

### 3.2 Migration: a new `src/app/saveComfort.ts`, the pattern of `saveFfx2Atb.ts`

`migrate()` gains one call, `migrateComfort(settings)`, after the spread and before
`migrateFfx2Atb`. It **coerces, never decides**. There is no one-time rule and no
veteran rule.

- `textSize`: anything but exactly `1`, `1.15` or `1.3` becomes `1`. That covers a
  string, `NaN`, `2`, `null`, or an absent value.
- `reduceFlashes`, `comfortAsked`: anything but a boolean becomes `false`.
- `reduceMotion`: a non-boolean becomes the default. Today a non-boolean passes
  unchecked, so this is a small hardening.
- `keyBindings`: `sanitizeKeyBindings()` in the new `src/app/keymap.ts` handles five
  cases:
  - a non-object becomes absent;
  - unknown buttons are dropped;
  - non-string, empty or unknown codes are dropped;
  - a code claimed by two buttons keeps only the first;
  - **if the result leaves any of up, down, left, right, confirm or cancel with no key,
    the whole override is dropped.**

  A corrupt blob can never lock a player out of the menus.
- **No `SAVE_VERSION` bump.** A bump buys nothing here, because every field defaults
  through the spread. The precedent keeps it at 1. And the version is not part of the
  key, so a bump would only change a number the previous build ignores.

`SaveData.ts` itself changes by the interface fields (one-line docs pointing to
`saveComfort.ts`), `defaultSettings()` entries and the one call. The target is **15 lines
or fewer, net**. Splitting the over-cap file is a separate chore and not part of this
build.

`saveMerge.ts`: `changedKeys` compares object values by `JSON.stringify`. This is a
three-line change and fixes the object-valued setting problem in §2. It is covered by a
new case in `tests/unit/save-two-tabs.test.ts`.

**Coordinate with PR-0203 (D-210).** It also touches `defaultSettings()` and needs the
same deep review and the same CHK-024 run. Land the two schema changes in one commit
series and review them once, or land PR-0203 first and rebase onto it. They must not
sit in two candidates that each owe a deep review (the "third deploy refuses" cap).

### 3.3 The CHK-024 upgrade matrix this change must pass

Every row runs from a **stored fixture**, never from a clean profile ("a pass produced
from a clean test profile is not a pass"). Fixtures go in `tests/fixtures/saves/`:

- `release-20.json`: captured from the live ce05b02c build on a real profile with two
  cleared chapters, changed volumes, Active ATB and ATB speed fast;
- `release-08-pre-wait.json`: no `ffx2AtbMigrated`;
- `pre-onboarding.json`: no `seenCoach`, one chapter cleared;
- `first-timer.json`: nothing cleared;
- `garbage.json`: a set of invalid blobs.

| # | row | pass condition |
|---|---|---|
| U1 | **Fresh player** | `textSize 1`, `reduceFlashes false`, no `keyBindings`, `comfortAsked false`, `reduceMotion` = the OS query. The card shows on the first Enter at the title and never on a second boot of the same profile. |
| U2 | **Returning player, the release-20 save** | After `migrate()`, every pre-existing field is deep-equal to the fixture: chapters, best times, attempts, play time, `seenCoach`, `battleHelp`, `ffx2Atb`, `ffx2AtbSpeed`, volumes, `textSpeed`, `unlocked`, flags. The only additions are the four defaults. The volumes reach the mixer at boot. The veteran still sees the card once. |
| U3 | **Older saves** | The release-08 and pre-onboarding fixtures produce exactly what today's `migrate()` produces, plus the four defaults. The Wait migration and the veteran rule still fire once. |
| U4 | **A save written by this build, opened by the previous live build** (rollback, or a stale second tab on the old bundle) | The previous build's `migrate` and `save()` round-trip keeps `textSize`, `reduceFlashes`, `keyBindings` and `comfortAsked`. This is proved by e2e against the live release-20 URL with the new blob injected before boot and one setting changed there. |
| U5 | **Two tabs** | Tab A remaps confirm to `KeyK` and sets 130 %. Tab B is in battle and flushes play time three times. After both tabs write, the slot holds A's remap and text size and B's play time. The reverse direction is also tested. |
| U6 | **Invalid or truncated storage** | Every blob in `garbage.json` loads without throwing and yields a playable save. The blobs cover: `textSize` of `"130"`, `NaN`, `2` and `null`; `reduceFlashes` of `"yes"`; `keyBindings` of `[]`, `"x"`, `{confirm: []}`, `{confirm: ["KeyZ"], cancel: ["KeyZ"]}` and `{up: ["NotAKey"]}`; a JSON string cut mid-way; and `null`. Menus stay operable with real Enter, Esc and arrows. |
| U7 | **Reload in every allowed state** | Reload with the card open and unanswered: it shows again. Reload after BEGIN or Esc: it never shows again. Reload mid-rebind, before the key is pressed: nothing was written. Reload after each of the four settings changes: the value is kept **and applied on the first frame**, meaning title text, card sample, first dialogue line and first battle flash all follow it without the pause being opened. That is the round-03 blocker-5 lesson (`audio.applySettings` in the constructor). |
| U8 | **Reset** | `SaveStore.reset()` (debug API and tests; no player-facing reset exists) brings back the defaults and the card. RESET TO DEFAULTS on the CONTROLS tab removes `keyBindings` and nothing else. |
| U9 | **Storage blocked** (private window, `safeStorage()` returns null) | The card shows once per **session**, not once per navigation. Settings hold in memory. Nothing throws. |
| U10 | **Determinism** | With every setting ON, each chapter's golden event log is byte-identical to the log with every setting OFF. The settings touch presentation only (hard rule 1). |

---

## 4. Module plan

### 4.1 New modules (each under 400 lines; the estimate is in brackets)

| module | what it holds | layer |
|---|---|---|
| `src/app/saveComfort.ts` [≈60] | `migrateComfort()`, the text-size ladder `TEXT_SIZES = [1, 1.15, 1.3]` | app |
| `src/app/keymap.ts` [≈220] | the **one** key table: `DEFAULT_KEY_MAP` (moved out of `Input.ts` byte for byte), `resolveKeyMap(overrides)`, `buttonForCode()`, `codesFor(button)`, `rebind(map, button, code)` (swap on collision), `RESERVED_CODES` (the raw toggles and the fixed fallbacks, §6.1), `sanitizeKeyBindings()`, `keyLabel(code)` for the CONTROLS tab, and a change listener. Pure: no DOM | app, pure |
| `src/app/comfort/applyComfort.ts` [≈90] | sets `document.documentElement.dataset.textSize / reduceFlashes / reduceMotion` at boot (called from the `SaveStore` constructor path, next to `audio.applySettings`) and on every `setSettings`; tells `keymap.ts` the live overrides | app, DOM |
| `src/ui/common/comfort.css` [≈250] | attribute-selector overrides: the CSS flashes (§5.2) softened under `[data-reduce-flashes]`; the ten `prefers-reduced-motion` blocks mirrored under `[data-reduce-motion]`; the `--pu-fs` scale for the pause; the dialogue card's text variables. It is one file, so the owning batches' stylesheets are not edited for the switches | ui |
| `src/engine/ComfortPorts.ts` [≈180] | pure port decorators with no DOM and no `three` (hard rule 1): `comfortCamera(inner, flags)`, `comfortVfx(inner, flags)`, `comfortActor(handle, flags)`, `comfortMoments(inner, flags)`. `flags` is a **getter**, so a change made in the pause applies on resume without rebuilding the stage | engine |
| `src/ui/common/hudTextSize.ts` [≈200] | the 130 % layout: each HUD panel's pinned corner and scale, the FFX layout moves, the phone party-card cap at 115 %, the FFX-2 table (filled once its frame is approved, §7 step 8) | ui |
| `src/app/screens/frontend/ComfortCard.ts` [≈230] and `comfort-card.css` [≈150] | the one-time card: the approved copy verbatim; TEXT SIZE with an "Aa" sample at each size, applied live; REDUCE MOTION; REDUCE FLASHES; BEGIN. Exclusive keyboard claim; pointer and touch targets | app/ui |
| `src/app/screens/pause/rebind.ts` [≈180] | the CONTROLS tab's capture flow: Enter on a row, "Press a key", Esc cancels, swap-on-collision notice, RESET TO DEFAULTS. Holds an exclusive claim while capturing | app |

### 4.2 Existing files that change, and who owns them now

Ownership is from `docs/plans/thresholds-program-2026-09-26.md` §2. **Unowned** means no
batch lists the file, so this track claims it in NOW.md before touching it.

| file | change | owner now |
|---|---|---|
| `src/app/SaveData.ts` (559, over cap) | fields, defaults, one call | **unowned** (shared with PR-0203) |
| `src/app/saveMerge.ts` | JSON compare for object values | unowned |
| `src/app/Input.ts` (523, over cap) | read `keymap.ts`; clear held buttons when the map changes; add a `sawKeyboard` flag; **shrinks**, because `KEY_MAP` moves out | unowned |
| `src/app/screens/PauseScreenPanels.ts` | four rows, stale comment | unowned (not under `pause/`) |
| `src/app/screens/PauseScreen.ts` (398) | route the remap rows to `rebind.ts`; no net growth (it sits at the cap) | unowned |
| `src/app/screens/pause/settings.ts`, `panels.ts` (CONTROLS from the live map), `PauseView.ts` (live reduce motion) | rows and CONTROLS tab | **batch 3** |
| `src/app/screens/pause/keys.ts` | take the live map (§6.1) | **batch 4** |
| `src/ui/common/pause-chapter.css` / `pause-screen.css` | the two live defects (§7 step 1) | unowned (the pause CSS sits in `src/ui/common/`, outside batch 3's `pause/**`) |
| `src/app/screens/TitleScreen.ts` | raise the card before the wipe | unowned |
| `src/app/screens/raiseBriefing.ts` | nothing, or a shared `canDriveInput` export | unowned |
| `src/ui/ffx/rawInput.ts`, `SensorPanel.ts`, `CommandMenu.ts`, minigames' CSS flashes, `CtbList.ts` (5 portraits) | read `keymap.ts`; the FFX layout moves | **batch 2** |
| `src/ui/ffx2/CommandMenu.ts`, `SpherechangeWheel.ts`, `TriggerHappy.ts`, `LadyLuckReels.ts`, `FFX2BattleHud.ts` (1,212, over cap: new logic in `hudTextSize.ts`) | read `keymap.ts`; the FFX-2 130 % pass | **batch 3** |
| `src/ui/coach/CoachMark.ts`, `Briefing.ts`, `src/ui/common/DialogueBox.ts` + `dialogue-box.css` | confirm keys from `keymap.ts`; the dialogue card text variables | **batch 4** |
| `src/engine/BattlePresenterStage.ts` (719, over cap) | wrap the ports it builds (`makeVfxPort`, the `HoldableCamera`, actor handles) with `ComfortPorts.ts`; a constructor option `comfort?: () => ComfortFlags`; about 10 lines | **batch 2** |
| `src/ui/common/transitions/MomentOverlay.ts`, `swirl.ts` | vignette pulse and swirl follow the settings | **batch 2** |
| `src/ui/inkgold/wipe.ts` | `prefersReducedMotion()` also reads the setting | unowned |
| `src/app/screens/CutsceneStage.ts`, `cutsceneFx.ts` | flash and shake follow the settings | unowned |
| `src/app/screens/BattleScreen.ts`, `BattleScreenCutscenes.ts` | pass `comfort` to the stage; raw `KeyP` stays | **batch 4** |
| `src/ui/common/StrategyGuide.ts`, `MoveAdvisor.ts`, `EnemyIntent.ts`, `enemy-intent-overflow.ts` | none this build (their raw letters become `RESERVED_CODES`) | batch 3 / unowned |
| `src/debug/api.ts`, `critic/runner/**` | card suppression (§6.4) | **batch 5** |
| `playwright.config.ts` | card suppression for every spec | unowned |

Consequence for scheduling: steps 2 to 4 of §7 touch only unowned files and new modules,
so they can start now. Every step that edits a batch-owned file waits until that batch
has merged (release 21: batches 3 and 4 and the class-A part of batch 2), then takes a
small, named edit. This track does not rewrite those files.

---

## 5. Risks

### 5.1 The remap versus `pause/keys.ts` and the other raw readers (the riskiest part)

1. **Nine tables** (§2). Remapping `Input.ts` alone would leave every FFX battle menu,
   every minigame, the FFX-2 command menu, the Spherechange wheel, Trigger Happy, Lady
   Luck, the coach marks and the briefing on the old keys. Step 3 moves every reader to
   `keymap.ts` **with no behaviour change first**. A unit test asserts that the resolved
   default map equals today's `Input.ts` and `rawInput.ts` tables code for code, and that
   the X-2 sets equal `codesFor('confirm')` and `codesFor('cancel')`. Only after that
   refactor passes does rebinding go live.
2. **`pause/keys.ts` hard-codes which button to drop.** Today it answers Q with
   `triangle`, E with `start`, F with `l1`, Tab with `triangle` and Shift with
   `triangle`. After a remap, E might carry `confirm`, and one press would both change
   tab and confirm a row. Rule: `pauseKeyIntent(code, shift, map)` drops **whatever
   button the live map gives that code**. A raw pause intent (tab-prev, tab-next, photo)
   fires only while the code still carries its default button or none. If the player
   moved E to confirm, E confirms and no longer changes tab; R1, L1 and the arrows still
   do. Pinned by a **property test** over every one of the 11 buttons crossed with every
   bindable code: no single press ever produces both a pause intent and a surviving
   button.
3. **The raw single-letter toggles are not in any map**: G guide, N advisor, E intent,
   I sensor, J overflow, H hide, P pause, F photo, B briefing at the title, D "never" in
   the briefing. Binding confirm to G would also toggle the guide on every confirm. They
   go into `RESERVED_CODES`. The capture refuses them with one line naming the panel
   that uses the key, and they are not remappable in this build (§9 Q6).
4. **A held key across a map change.** `Input.onKeyUp` looks the code up in the *current*
   map. A key held while the map changes then releases the wrong button, or none, and
   the old button sticks. On every map change, `Input` clears `heldKeys` and releases
   every button. The capture also ends on keyup, not keydown.
5. **The capture leaks.** The key pressed to rebind must not reach the pause (H hides,
   Esc closes, Q/E change tab) or the frame after. `rebind.ts` takes the **exclusive**
   claim, which is the same mechanism and the same edge drop as the briefing
   (`raiseBriefing.ts`). This is tested the way `tests/unit/ui-coach-input-leak.test.ts`
   tests the briefing.
6. **Lock-out.** Esc cancels the capture, and Esc is also cancel and pause. Enter
   confirms. The arrows drive every menu. If any of these can be rebound away, a player
   can strand themselves. Recommendation (§9 Q1): arrows, Enter and Escape stay bound as
   **fixed fallbacks**, shown on the CONTROLS tab as "always". The rebind moves the
   letter keys (WASD, Z, X, Space, Q, E, C, V, M, R, F, Shift, Tab, Backspace, PageUp,
   PageDown). `sanitizeKeyBindings` enforces the same thing on load (§3.2).
7. **The gamepad keeps its layout.** `PAD_MAP` is untouched.
8. **A touch-only phone.** `Input._lastDevice` starts as `'keyboard'`. The remap row
   shows only after a real `keydown` or a pad button this session (a new `sawKeyboard`
   flag), and never on a first boot under `pointer: coarse`.
9. **Two tabs** (§3.3 U5, the merge fix).

### 5.2 Flash reduction coverage: every flash and strobe source

REDUCE FLASHES "softens". It does not remove, because the moment still has to read. The
proposed levels are in §9 Q7: a full-screen wash is capped at 35 % peak with pure white
tinted to warm ivory, an actor flash is capped at 0.35 peak, and a CSS flash becomes a
single low-contrast fade. **No duration changes** (see 5.3).

**Through the presenter ports (both games; one decorator covers all of them):**

| source | where | what |
|---|---|---|
| `vfx.screenFlash('#ffffff', 260)` | `BattlePresenterBeats.ts:160` | KO / defeat beat |
| `vfx.screenFlash('#ffffff', 220)` + camera shake 0.2 | `BattlePresenterBeats.ts:181-182` | boss form change |
| `vfx.screenFlash('rgba(255,70,50,0.28)', 420)` | `BattlePresenterBeats.ts:201` | imminent telegraph |
| `vfx.screenFlash('rgba(0,0,0,0.55)', 900)` | `BattlePresenterBeats.ts:225` | dark wash (a dimming, not a flash; left alone) |
| `vfx.screenFlash('#ffffff', 180)` + actor flash white peak 1 | `BattlePresenterEvents.ts:357-358` | |
| `impactAt('screen')` element-coloured wash, 220 ms | `BattlePresenterStage.ts:548` | every `'screen'` VFX key |
| `hits.flash.play` (the `ImpactFlash` bloom, 260 / 320 ms crit) | `BattlePresenterStage.ts:561` | every hit, inside the Stage's own port factory, **so the decorator must sit in the Stage, not only in the presenter** |
| actor `flash()` | `BattlePresenterBeats.ts:58, 81, 103` (crit white, peak 1), `155, 199`; `BattlePresenterEvents.ts:212, 250, 357`; `BattlePresenterArrivals.ts:111, 115`; `BattlePresenterDepartures.ts:264, 319, 340`; `PaintedActor.ts:1428` (internal) | |
| `moments.vignette` heartbeat pulse at 84 / 132 bpm | `BattleMoments.ts:444`, `MomentOverlay.ts:157` | 1.4 / 2.2 Hz |
| cutscene `flash` step routed to `stage.vfx.screenFlash` | `BattleScreenCutscenes.ts:353, 358` | covered by the Stage decorator |

**Outside the ports:**

| source | where | game |
|---|---|---|
| `CutsceneStage.flash()` | `CutsceneStage.ts:144` | both |
| the 90 ms fallback flash for any unstaged `fx()` key | `CutsceneStage.ts:135` | both |
| DSL `flash` steps | 5 scripts: `evrae-airship`, `ffx2-vegnagun-shuyin`, `seymour-anima-macalania`, `seymour-natus`, `yojimbo-cavern` | both |
| `.cutscene__flash` | `cutscene.css` | both |
| `ffx-hurt-flash` | `ffx-hud.css:233` | FFX |
| `ffx-target-flash`, 0.9 s infinite, multi-target | `ffx-hud.css:771` | FFX |
| `ffx-mg-flash-success` / `-fail` | `overdrive-minigames.css:32-45` | FFX |
| `OverdriveOverlay.flashSuccess` / `flashFail` | 7 minigames | FFX |
| `ffx2-telegraph-flash`, 0.45 s alternate infinite | `ffx2-hud.css:185, 257` | X-2 |
| `ffx2-hit-flash` | `ffx2-hud.css:1082`, `FFX2BattleHud.ts:1178` | X-2 |
| the chain chip's white numeral at chain ≥ 20 | `ChainCounter.ts:245`, `ffx2-hud.css:1047` | X-2 |
| `Lighting.flicker()` | `src/scenes/*` attack hooks (`demo`, `farplane`, `leblanc-last-room-painted`, `evrae-airship-painted`, two `*-debug` scenes) | both |
| scene actor flashes | `src/scenes/demo.ts`, `farplane.ts`, `evrae-airship-painted.ts`, `leblanc-last-room-painted.ts` | both |

The last two rows look like preview and demo-reel hooks, not chapter play. **The build
proves which by grepping their callers, then running them.** If any is reachable in a
chapter or the demo reel, it follows the setting.

**Not flashes, but on the same checklist:** battle-start banner, turn cut-in slam, name
slab, `playWipe` / swirl. These are motion and belong under REDUCE MOTION.

**A pre-existing strobe to measure whatever the setting.** A twelve-hit Attack Reels
fires an actor flash and an `ImpactFlash` per hit. At the hit spacing that can pass 3
flashes a second (WCAG 2.3.1). `BattleMoments.impact` already avoids strobing the *cut*,
but not the flash. Step 9 logs flash timestamps per second in the chapters with
multi-hit Overdrives and FFX-2 20+ chains. If the default path exceeds 3 per second,
that is a separate issue to disclose, because it predates this build. With REDUCE
FLASHES on, flashes after the first in one action are dropped.

The remaining infinite CSS pulses (0.9 s target flash, 0.45 s alternate telegraph,
vignette) are all under 3 Hz. REDUCE FLASHES turns them into a steady highlight.

### 5.3 REDUCE MOTION in battle, and timing

- "Holds the camera still in battle: no sweeps, shakes or parallax."
  `comfortCamera` turns `moveTo(rig, ms)` into `snapTo(rig)` **followed by a sleep of
  `ms`**. It no-ops `shake`, `punch`, `push`, `roll` and rig sway. Whether a snap
  counts as "still" is §9 Q2.
- **Timing must not change.** In FFX-2 Active the ATB fills in real time while the
  presenter animates. A camera move that resolves instantly would make every X-2 fight
  run at a different pace under REDUCE MOTION, which changes the game and not only its
  look. Every decorator therefore resolves when the original would. U10 (identical logs)
  and a timing test pin this: the presenter's total awaited time for a scripted turn is
  equal with the settings on and off.
- Actor shakes (`BattlePresenterBeats.ts:104`, `Departures.ts:263, 341`), DOM shakes
  (FFX `CommandMenu` disabled-row shake, minigame fail shake, `CutsceneStage.shake`) and
  the vignette pulse stop under REDUCE MOTION. Lunges and hops stay, because they are
  the characters acting, not the camera.
- `PortraitStage.setReduceMotion` is called live when the row changes in the pause
  (today it is read once at mount). `playWipe`, `swirl` and `cutsceneFx` read the
  setting as well as the OS query.

### 5.4 Text size reflow

- **FFX desktop HUD** (a fixed 640x360 grid, scaled by `min(w/640, h/360)`). Each panel
  scales **as a unit from its pinned corner**; nothing inside a panel re-wraps. There
  are four layout moves (§1). `desk-hud-130-naive.jpg` is the failure to avoid, and
  `hudSafeZones.ts` is the collision reference. At 1280x720 the 640x360 grid is at 2x
  and the 130 % panels are largest relative to the gaps, so that is the tightest case.
- **FFX-2 HUD**: its own pass. No frame exists (§9 Q4).
- **Phone** (flow layout): type grows and reflows. The fixed-width party card caps the
  name and numbers at 115 %; otherwise "Kimahri" becomes "Kima…" and HP runs into MP,
  as drawn in `phone-hud-130.jpg`.
- **Dialogue card**: the line, name, GUARDIAN tag, chapter eyebrow and key strip grow;
  the card keeps its size. The risk is the **longest line** in every script at 130 % at
  1280x720 and 390x844. It is checked by a sweep over every line of every
  `src/story/scripts/*` file for `scrollHeight <= clientHeight`, not by eye.
- **Pause**: scales `--pu-fs` and its siblings. There is no frame (§9 Q4). The pause
  already sits at its 14 px desktop and 12 px phone floors, so 130 % pushes the
  two-column OPTIONS tab. The phone column already scrolls under its fade (PR-0098).
- **The two live defects the round found** are fixed first (§7 step 1). At 130 % they
  would get worse, not better.
- **TEXT SPEED and TEXT SIZE sit on adjacent rows** and differ by one word. The value
  column (`1x` against `100 %`) is what separates them. Kept as mocked.
- **Surfaces outside "battle HUD, dialogue and menus"**: chapter select, party prep,
  results, coach marks, the briefing, damage numbers and banners. §9 Q3 recommends 100 %
  for these in this build.

### 5.5 The one-time card against the briefing and the first-run flow

- **Order on a first launch:** title, then Enter, then **the comfort card** (over the
  title, before the wipe), then BEGIN or Esc, then the ivory wipe, then Auron's
  briefing (`runBriefingIfDue` in `GameFlow.start`), then the chapter board. The card
  comes first so that the wipe, the briefing's fades and the first scene already follow
  what the player chose. `TitleScreen.advance()` awaits the card before
  `holdForNextScreen`.
- **Input.** The card takes an **exclusive** claim (the `raiseBriefing` rule). The press
  that dismisses it must not also start the flow, replay the briefing (B) or reach the
  board. The title's `handleInput` returns while the card is up, as it does for the
  briefing.
- **Evidence poisoning** (onboarding review REQUIRED 8). Every Playwright spec, the
  screenshot tool and the critic's captures boot on fresh profiles, which is exactly the
  card's trigger. Suppression ships **with** the card: `?comfort=off` in the URL, and
  `__pyrefly.setComfortAsked(true)` in `src/debug/api.ts` (batch 5's file). These are
  set in `playwright.config.ts` and `critic/runner/**`. `?coach=off` implies
  `?comfort=off`, so every existing capture URL stays clean with no edit. One spec boots
  a real profile twice with suppression off and asserts: card on boot 1, never on boot 2.
- **Veterans.** The card shows once to every save, Bailey's included. It is not tied to
  the coaching veteran rule or to BATTLE HELP. The README says "everyone sees the card
  once". Turning BATTLE HELP off does not suppress it.
- **"All off unless you turn them on"** is not true for a player whose OS asks for
  reduced motion: `reduceMotion` defaults to the OS query, so the card would show
  REDUCE MOTION already ON. §9 Q5.
- **The text-size sample.** Each size's "Aa" is applied to the card live, so the
  player sees the choice. The card's own text is 14 px or larger at 100 % and must fit
  at 130 % in 390x844 (the `phone-C-prompt.jpg` target).

---

## 6. Details the build must not improvise

1. **Reserved and fixed keys**: the list in §5.1 items 3 and 6, recorded in
   `keymap.ts` with one comment per entry saying why.
2. **Where the settings are read.** Battle reads them through a getter, so they apply on
   resume after the pause without rebuilding the stage. The title and card read them
   live. The CSS reads the `<html>` data attributes.
3. **The CONTROLS tab is generated from the live map** (`keyLabel`), never typed out, so
   it cannot drift from the bindings. This fixes the four cut labels at 1600x900: they
   are rebuilt at full width, as in `desk-A-controls.jpg`.
4. **Suppression hooks** as in §5.5.
5. **No new pause tab.** The rows go under TEXT SPEED in the Settings column, in this
   order: TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, REMAP CONTROLS. That is 6 rows
   becoming 10, as in `desk-A-options.jpg`. REMAP CONTROLS opens the CONTROLS tab. The
   X-2 rows keep their per-game rule (FFX chapters never print them).

---

## 7. Order of work

Each step lands green on its own. The check at the end of each step is `tsc` + the vitest
files it touched + `node tools/orphans.mjs`, plus a real-key capture for anything visible.

1. **The two live defects** (both games), which are independent and can ship earlier on
   a focused review:
   - CONTROLS labels cut at 1600x900 ("Move down a menu", "Adjust a setting", "Resume
     the fight", "Hide everything but the painting");
   - "MASTER VOLUM…" at 390x844. The phone key column goes from 118 to 140 px and the
     meter shrinks, as drawn in `phone-A-options.jpg`.

   Measured by `scrollWidth <= clientWidth` on every pause label at all four viewports.
   The CSS is unowned; if it lands before step 5, it does not wait.
2. **Save schema:**
   - `saveComfort.ts`, the `SaveData.ts` fields and the merge fix;
   - the fixtures in `tests/fixtures/saves/`;
   - the U1 to U3, U5, U6, U8 and U9 unit rows.

   Agree the PR-0203 sequencing first (§3.2).
3. **`keymap.ts` extraction with no behaviour change:**
   - every one of the nine readers reads it;
   - the equality tests pass;
   - the golden logs and all input tests are unchanged.

   This step and step 2 touch unowned files, except the reader edits inside batch 2, 3
   and 4 files, which wait for those merges and are one-line imports.
4. **Pause rows and CONTROLS:**
   - `optionRows` and `adjustSetting` cases;
   - `applyComfort.ts` and the `<html>` attributes;
   - `rebind.ts`;
   - the live-map `keys.ts` with its property test;
   - `Input` held-key reset and `sawKeyboard`.
5. **`comfort.css`**: the CSS flashes and the reduced-motion mirror; `wipe.ts`, `swirl`
   and `cutsceneFx` read the setting.
6. **`ComfortPorts.ts`** wired in `PaintedStage`, plus `CutsceneStage` and DSL flash and
   shake. This is the flash and motion audit of §5.2 and §5.3, with the timing test and
   U10.
7. **Text size, FFX and shared:**
   - the dialogue card, then the FFX desktop HUD anchors and four moves, then the phone
     caps;
   - each compared side by side with `desk-hud-130.jpg`, `desk-dbox-130.jpg`,
     `phone-hud-130.jpg` and `phone-dbox-130.jpg`.
8. **The FFX-2 HUD and the pause at 130 %.** First an **FFX-2 130 % frame and a pause
   130 % frame**, made the round's way (`inject.js` on the live page). The driver shows
   them to Bailey (§9 Q4). Build only after his look. Until then, TEXT SIZE leaves the
   FFX-2 HUD and the pause at 100 %, which is disclosed.
9. **The comfort card** and its suppression hooks (§5.5) after `debug/api.ts` is free
   (batch 5).
10. **Verification** (§8), then the U4 and U7 e2e rows, then target-and-build pairs in
    `docs/screenshots/accessibility/`, then the handoff `docs/handoff/accessibility.md`.
11. **Deep review of the production candidate before the deploy** (save-data class).
    The deploy cap applies: at most two deploys while a deep review is owed.

---

## 8. Tests

### 8.1 Unit tests (vitest; each written to fail on today's code first where that makes sense)

- `save-comfort-migration.test.ts`: U1, U2, U3, U6, U8 and U9 against the fixtures;
  idempotence (`migrate(migrate(x))` deep-equals `migrate(x)`).
- `save-two-tabs.test.ts` (+ cases): U5, and an object-valued setting survives the other
  tab.
- `keymap.test.ts`:
  - defaults equal today's two tables;
  - swap on collision;
  - reserved codes refused;
  - RESET;
  - sanitizer cases;
  - no lock-out for any sequence of rebinds (a randomized sequence of 500, seeded).
- `pause-keys-remap.test.ts`: the property test in §5.1 item 2; Shift still does
  nothing.
- `input-remap.test.ts`:
  - `Input` and `rawInput` both follow a rebind;
  - a key held across a map change releases cleanly;
  - `sawKeyboard` starts false.
- `pause-accessibility-rows.test.ts`:
  - 10 rows in order, X-2 rows only in FFX-2 chapters;
  - Left and Right step `textSize` 1 → 1.15 → 1.3 and clamp;
  - the toggles flip on Confirm;
  - REMAP CONTROLS opens CONTROLS.
- `comfort-ports.test.ts`:
  - the decorators with fakes: peaks capped, shakes dropped, `moveTo` resolves at the
    original `ms`;
  - a headless presenter run of a scripted chapter-3 form change and a multi-hit
    Overdrive, with a spy on the ports: no screen flash over the cap, and at most one
    flash per action;
  - awaited time equal with the settings on and off.
- `comfort-card.test.ts`:
  - shows once;
  - once per session with storage blocked;
  - exclusive claim, with the dismiss press not leaking to the title (the
    `ui-coach-input-leak` pattern);
  - `?comfort=off` and `?coach=off` suppress it;
  - it never shows while the briefing is up.
- `hud-text-size.test.ts`: at 1, 1.15 and 1.3, each FFX panel's box stays inside
  640x360 and clear of the `hudSafeZones.ts` zones; the phone party card cap at 115 %.
- The golden-log suites unchanged (U10).
- `node tools/orphans.mjs`: `ComfortPorts`, `keymap`, `saveComfort`, `applyComfort`,
  `rebind`, `ComfortCard` and `hudTextSize` each have an importer.

### 8.2 E2E (Playwright, real keys through `page.keyboard`, never the debug triggers)

- `comfort-card.spec.ts`: a real profile, boot twice, with suppression off.
- `accessibility-remap.spec.ts`:
  - Rebind confirm to `KeyK`, reload, then in **FFX ch I** open the command menu and
    choose Attack with K, and cancel with X.
  - In **FFX-2 ch IV**, choose a command with K and open and close the Spherechange
    wheel.
  - In the pause, Q, E and Tab still change tab, and H still hides.
  - Rebind E to confirm and prove E no longer changes tab and does not close the menu.
  - RESET TO DEFAULTS.
  - A pad does not change (skipped if no pad emulation).
- `accessibility-text-size.spec.ts`:
  - At 1280x720, 1600x900, 2000x1012 and 390x844 (touch, DPR 2), times 100, 115 and 130
    %, times FFX ch I and FFX-2 ch IV, capture the HUD, the dialogue card and the pause.
  - Assert on every text node `scrollWidth <= clientWidth` and `scrollHeight <=
    clientHeight`.
  - Assert no panel box intersects another (batch 5's `hud-collision.spec.ts` rule, run
    at 130 %).
  - Every story line at 130 % in the dialogue card at 1280x720 and 390x844.
- `accessibility-flashes.spec.ts`: with a debug hook that logs every screen-flash
  opacity and every actor-flash peak, run FFX ch III (form change) and FFX-2 ch V
  (Vegnagun) scripted. With flashes on: no wash above the cap and at most one flash per
  action. With flashes off: today's numbers exactly. Also report the flashes per second
  on the default path (§5.2 strobe measurement).
- `accessibility-motion.spec.ts`: camera position variance through one enemy turn is 0
  between cuts with REDUCE MOTION on; the title parallax, wipe and briefing fades are
  still.
- `save-upgrade.spec.ts` (batch 5's PR-0195 spec, extended or co-authored): U2, U4, U5
  and U7 with the fixtures loaded before boot, including U4 against the live release-20
  URL.

### 8.3 Real-key playthrough (CHK-016 and CHK-017)

A GPU Chromium on a fresh profile, real keys only, with all four settings on (130 %,
motion and flashes reduced, confirm moved to K):

- **FFX ch I** from the title (card answered) to results;
- **FFX-2 ch IV** from the title to results;
- **one chained chapter** (ch V) through a seam.

Screenshots at each viewport go under `docs/screenshots/accessibility/`, beside the
target frames.

---

## 9. Inferred choices: ask before building (rule 15)

Each item is a guess. Recommendations are marked. The driver puts them to Bailey in one
short list (a line each) before the step that needs them. **Updated 2026-09-26: Q1, Q2,
Q3, Q5 and Q6 are answered (see each item below, and D-220's `followUp` in
`docs/target/decisions.json`); Q4 and Q7 are still open and need pictures first.**

- **Q1. Fixed fallbacks.** Arrows, Enter and Escape always stay bound, shown as
  "always", so no remap can lock the player out. *Recommend yes.*
  **ANSWERED 2026-09-26: yes (Bailey, verbatim above).**
- **Q2. What "holds the camera still" means.** (a) Rig changes become **cuts**, and
  shakes, pushes, rolls and sway are gone. (b) The camera is pinned on the wide frame
  for the whole fight. *Recommend (a):* FFX itself hard-cuts to the target, and a pinned
  wide frame loses the boss reveals. Actor and menu shakes also stop; lunges and hops
  stay.
  **ANSWERED 2026-09-26: yes (Bailey, verbatim above) — option (a).**
- **Q3. TEXT SIZE scope.** This build covers the battle HUD, the dialogue card and the
  pause. Chapter select, party prep, results, the coach marks and the briefing stay at
  100 %. *Recommend yes;* the others can follow with their own frames.
  **ANSWERED 2026-09-26: yes (Bailey, verbatim above).**
- **Q4. FFX-2 HUD and pause at 130 %.** Two frames, made the way the round made its
  frames, shown before those passes are built. Until then those two stay at 100 % and
  the build says so.
  **open: pictures owed before the step.**
- **Q5. A player whose OS asks for reduced motion** sees REDUCE MOTION already ON under
  "all off unless you turn them on". *Recommend:* keep Bailey's approved wording and
  show the true value. The alternative is to default `reduceMotion` to off and ignore
  the OS, which would be a regression for exactly the players the setting exists for.
  **ANSWERED 2026-09-26: yes (Bailey, verbatim above).**
- **Q6. The single-letter panel keys** (G, N, E intent, I, J, H, P, F, B) stay fixed in
  this build. Binding a game key onto one is refused with a line naming the panel.
  *Recommend yes.*
  **ANSWERED 2026-09-26: yes (Bailey, verbatim above).**
- **Q7. How soft "softens" is.** *Recommend:*
  - screen washes capped at 35 % peak, with pure white tinted to warm ivory;
  - actor flashes capped at 0.35 peak;
  - one flash per multi-hit action;
  - CSS pulses become a steady highlight.

  Shown to Bailey as a before/after pair of the Braska form change. He judges by eye.
  **open: pictures owed before the step.**

---

## 10. Acceptance checks for the deep review

The candidate passes when every item holds on the **production build**, with evidence
attached (CHK-016: a screenshot counts only when the harness asserted what is in it).

- **AC-1 (save, CHK-024).** Every row U1 to U10 passes from stored fixtures, U4 against
  the live previous build. No progress field changes. No throw on any garbage blob.
- **AC-2 (applied at boot).** A saved 130 %, REDUCE FLASHES or remap is in force on the
  first title frame, the card and the first dialogue line, without the pause being
  opened.
- **AC-3 (card).** Shows once per profile, and once per session with storage blocked.
  Holds the exclusive claim; the dismiss press reaches nothing behind it. Appears before
  the wipe and the briefing. The copy matches the approved mock word for word. Absent
  under `?comfort=off`, `?coach=off` and the debug hook. Every capture in the round was
  taken with it suppressed.
- **AC-4 (rows).** The pause Settings column shows TEXT SIZE, REDUCE MOTION, REDUCE
  FLASHES and REMAP CONTROLS under TEXT SPEED, reachable by real keys, pointer and touch
  at all four viewports. The X-2 rows appear only in FFX-2 chapters.
- **AC-5 (remap).** A rebind works in every input reader (FFX menus and minigames, the
  FFX-2 menu, wheel, Trigger Happy, Lady Luck, the pause, the coach marks, the
  briefing). The pause key property test passes. No lock-out is possible. The CONTROLS
  tab reads the live map. The gamepad is unchanged. The row is hidden on a touch-only
  phone.
- **AC-6 (flashes).** Every source in §5.2 is either softened under the setting or
  proved unreachable in play. The per-action flash cap holds in ch III and ch V. With
  the setting off, the behaviour is byte-for-byte today's. The default-path strobe
  measurement is reported (disclosed if over 3 per second; pre-existing).
- **AC-7 (motion).** The battle camera holds still under REDUCE MOTION. The wipe, the
  swirl, the cutscene fx and the pause portraits follow the setting, not only the OS
  query.
- **AC-8 (timing and determinism).** Golden logs are identical with the settings on and
  off. The presenter's awaited time is equal. FFX-2 Active chapters are measured
  unchanged.
- **AC-9 (text size).** No clipped text node and no panel collision at any viewport,
  size or game in scope. The FFX HUD matches `desk-hud-130.jpg` and does not match the
  naive frame. The phone party card is capped at 115 %. Every story line fits the
  dialogue card at 130 %.
- **AC-10 (live defects).** The four CONTROLS labels are whole at 1600x900 and MASTER
  VOLUME is whole at 390x844.
- **AC-11 (house).**
  - `tsc` is clean;
  - the full `npm test` passes;
  - every new module is under 400 lines and has an importer;
  - `SaveData.ts`, `PauseScreen.ts` and `BattlePresenterStage.ts` did not grow by more
    than the lines named in §4.2, and `Input.ts` shrank;
  - hard rule 1 holds (no DOM or `three` in `ComfortPorts.ts`);
  - the game case is written in every commit.
- **AC-12 (target).** A target-and-build pair for each approved frame (`desk-C-prompt`,
  `phone-C-prompt`, `desk-A-options`, `desk-A-controls`, `phone-A-options`, and the four
  130 % frames). Every §9 item built is recorded as named (with Bailey's words) or as
  inferred on its tile, never silently.
