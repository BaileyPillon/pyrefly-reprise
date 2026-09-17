# fix-midbattle-hud — a mid-battle beat runs *over* the fight

**Key:** `midbattle-hud`
**Screenshot:** `docs/screenshots/polish/midbattle-hud.png` (Ch. 4 Bahamut,
`first-mega-flare-countdown`, captured live on port 5221)

## The defect, in one picture

Chapter 4 opened on Bahamut, the party got a few turns in, Bahamut began his
Mega Flare countdown — and the screen went blank for thirty seconds. No CTB
chrome, no party panels, no enemy bar, no dialogue, no clue. Then the fight
resumed as if nothing had happened.

Two separate faults met there.

1. **`runMidBattleScript` hid the entire HUD** for the length of a beat
   (`deps.hud?.setVisible(false)` … `setVisible(true)`). Bahamut's beat is Paine
   saying *"It stopped. That's not mercy." / "That's a timer."* — a line **about
   the countdown badge the HUD was drawing**, delivered with that badge switched
   off.
2. **Nothing capped the beat except the presenter's 30 s abandon budget**, and an
   automated run (auto-battle, a screenshot capture, the critic) swapped the
   dialogue box for a silent no-op port. So an overrunning beat showed no line
   *and* no HUD, for the full `SCRIPT_BUDGET_MS`. `yunalesca-form-2` was the
   first one in the log; `first-mega-flare-countdown` was the second.

## What a mid-battle beat is now

A beat is a line spoken **over** a fight the player is still in the middle of.
It is not a cutscene, and the difference is now written down in three places.

### 1. The HUD stays up; the scene dims

`runMidBattleScript` no longer touches `HudPort.setVisible` at all. Instead the
runner puts `.battle-midbeat` on the battle root for the length of the beat, and
`src/ui/common/cutscene.css` dims the HUD roots (`.ffxhud`, `.ffx2hud`) to
**0.65**.

35 % is the dim the bible already uses for a UI laid over a scene that has to
stay readable: the FFX-2 Switch roster strip "dims the scene by 35 %"
[`research/visual-bible.md` §3.3] and Wantz's shop leaves "the scene … visible,
dimmed 35 %" [§3.14]. The one place the bible authors the battle chrome
*leaving* is the Overdrive overlay, where the CTB list, command window and party
status slide off together over 0.12 s [§3.11.0] — a spoken line is not that.

### 2. The line is really shown, and never waits on input

`setAutoAdvance` now takes three states instead of two:

| mode | when | what the player sees |
| --- | --- | --- |
| `manual` | a human is playing | the box, advancing on Confirm or the line's own `auto` |
| `auto` | auto-battle, a capture, the critic | the box, with an `auto` forced onto every line and a per-line deadline |
| `instant` | `speed: 'skip'` | nothing — there is no viewer, and an e2e chapter has a 60 s budget |

`auto` used to be `instant`, which is why an automated Bahamut run showed no
dialogue at all. A line with no authored `auto` is given `MID_LINE_HOLD_MS`
(1.2 s) — the floor the writing bible gives a beat that has to read as
deliberate, "allocate real time (1.2–2.0 s)"
[`research/writing-bible.md` §2.1] — and a mid-battle callout is capped at ten
words [§3 E6], so that covers the reading. Each line is additionally raced
against `typing + hold + LINE_GRACE_MS`, so a stalled frame loop cannot park the
beat on one line.

Measured live at 640×360 (a normal frame rate), the Bahamut beat reads:
line 1 fully typed at 3.0 s, line 2 at 4.3 s, beat ends at 6.4 s.

### 3. The beat is capped, cut short, and logged once

`midBattleDeadlineMs(script)` in `src/story/registry.ts` is the budget the
runner actually enforces:

- an ordinary beat: a flat **`MID_SCRIPT_BUDGET_MS` = 8 000 ms**, which is the
  cap `tests/unit/story-triggers.test.ts` already holds the *authored* scripts
  to;
- a **chain seam** (Jecht's goodbye, the Vegnagun links): its own authored
  length + `OVERRUN_GRACE_MS`, capped at `SEAM_BUDGET_MS` (26 s). The function
  reads the script rather than the seam list because the runner is handed a
  script, not a name — and a seam is exactly a script authored past 8 s.

On an overrun the runner is **skipped**, not merely abandoned: `CutsceneRunner.skip()`
unblocks the step in flight and lets the rest resolve at once, so the remaining
poses, flags and music still land and the box does not keep typing behind a
fight that has resumed without it. One `console.error` is emitted **per script
name** (`overrunLogged`), so a repeating trigger like `farplane-voice` cannot
flood the console.

The presenter's own `SCRIPT_BUDGET_MS` (30 s) stays where it is and is now
documented as what it really is: the backstop for a runner that has stopped
answering at all. `SEAM_BUDGET_MS` has to fit under it.

## Files

| File | Change |
| --- | --- |
| `src/app/screens/BattleScreenCutscenes.ts` | owns the beat: `.battle-midbeat`, the three advance modes, per-line and per-beat deadlines, log-once |
| `src/ui/common/cutscene.css` | the 35 % dim, and hiding a portrait plate whose painting 404s |
| `src/story/registry.ts` | `MID_LINE_HOLD_MS`, `OVERRUN_GRACE_MS`, `midBattleDeadlineMs`, and `scriptDurationMs(script, untimedLineMs)` |
| `src/engine/BattlePresenterUtil.ts` | stopped hiding the HUD; passes the trigger `name` to the runner |
| `src/engine/BattlePresenterPorts.ts` | `play(script, { midBattle, name })`, `setAutoAdvance(on, { instant })` |
| `src/engine/BattlePresenter.ts` | `instant` only for `speed: 'skip'` |
| `tests/unit/midbattle-hud.test.ts` | new — 12 tests |
| `tests/unit/presenter-playback.test.ts` | comment only: the HUD is no longer hidden for a beat |

`src/story/runner/CutsceneRunner.ts` needed **no change**: `skip()` already did
exactly what a fail-safe wants, and the mid-battle policy belongs in the adapter
that knows it is mid-battle.

## One more thing the capture found

`fx` no longer blocks the script. `VfxPort.play` resolves when the *effect*
ends, so awaiting `fx('mega-flare-charge', 'bahamut')` charged the beat for
Bahamut's entire charge animation — while the duration model in `registry.ts`
charges an `fx` step nothing, on the grounds that it "resolves as soon as the
effect is handed to the stage". The runtime now matches the model. The effect
still plays; the line just stops waiting for it.

## Notes for other agents

- **Art fleet:** `public/art/portraits/paine.png` does not exist (only
  `paine.1.raw.png`), so Paine's portrait plate was rendering as a grey slab cut
  out of the dialogue box — `portraitImgHtml` removes the `<img>` on a 404, but
  `.dbox--no-portrait` cannot fire because the speaker *has* a portrait id.
  `cutscene.css` now hides an empty plate during a beat; delete that rule when
  the roster is complete.
- **Whoever owns `src/engine/BattlePresenterTactics.ts`:** `npx tsc --noEmit`
  reports two pre-existing `TS6133` errors there (`ZOMBIE_TOPUP_III`,
  `ZOMBIE_TOPUP_II` declared and unused). Not touched here.
- **Frame rate under capture:** a 1600×900 headless SwiftShader page runs this
  scene at **~2 fps**, and the camera tweens are frame-driven, so the same beat
  takes >8 s there and trips the fail-safe (which is the fail-safe working, and
  is what the screenshot shows). At 640×360 it runs comfortably inside budget.
  If the gallery wants a beat capture without the log line, shoot it small.
