# PR-0104: method check (rule 15), written before a third try

Written 2026-10-03 by a Sonnet sub-agent of the driver session, branch `r37-ui-floor`. **Game case (rule 14): FFX-2 only.**
Only FFX-2's ATB lets a command sit on its purple charge bar while the menu is already answered and the next girl's
menu is open [research/ffx2-combat-core.md section 1.1]; FFX's CTB resolves a chosen command before the next turn opens
[research/ffx-combat-core.md section 1.1]. No product code was changed to write this note.

## 1. The issue as the critic states it (round 19, `critic/rounds/round-19.json`, STALLED, 4th review)

Under Wait, a confirmed FFX-2 support command (White Magic > Shell > All allies) shows **nothing but a cast pose**:
frames every 100 ms from 0 to 2.2 s show no "Shell" anywhere; the Shell visual lands about 2.36 s after the sequence
starts and the next menu opens at 2.27 s (round 17: 1.8 s). FFX-2's charge time itself is canon; the defect is the
missing acknowledgement. Acceptance: a frame within 300 ms of the confirm shows the command name on or next to the
actor, at 1600x900 and 390x844.

## 2. What was tried, and why it did not move the issue

| Attempt | What it changed | Result |
|---|---|---|
| Release 14, `5c3de74c` (batch B2), `docs/handoff/iter2-b2.md` | The next girl's decorative **turn cut-in** waits for the charging action to play (`TurnCutIn.ts`: hold while another girl's command charges, then 300 ms, dropped if her menu was answered, shown anyway after 5 s) | Built as described. The check found the hold ran into the next menu (CHK-B2-1, a major); repaired so the hold is never awaited. It moved **a different thing later** (the cut-in). It added nothing at the moment of confirm |
| Repair of CHK-B2-1 (`iter2-b2.md` "Blocker fixed") | The hold no longer delays the next menu | Fixed the regression it introduced; the symptom the critic keeps filing (no name until the action starts) was untouched |
| Rounds 15 to 19 (re-reviews, "carried") | nothing | The same frames: the name appears only when the charge clears |

**Why it stalled.** Both builds treated PR-0104 as "something plays too early or too late" and spent the work on the
cut-in's timing. The critic's frame sequence says something else: for the whole charge the screen shows no sign of
**which** command the girl chose. The first place the name exists is the effect tag at the action's first event, which
is the end of the canonical charge (about 2.3 s for Shell). Hold-and-reorder cannot fix that, because there is nothing
earlier to reorder.

## 3. The new method

**Acknowledge at the confirm, from the state the HUD already has; change no timing.** The engine already holds the
queued command: `AtbState.charging.commandRef` (`src/battle/common/types.ts`), set when the command is submitted
(`gauges.ts` line 145) and cleared when the action starts (`engine-core.ts` line 296). The FFX-2 HUD receives that state
on every `sync`. A small presenter-side module reads it and draws a **name chip over the girl's head** (the critic's
own fix: "show the queued command's name chip over the actor at confirm, kept until the action starts") through the
HUD's own projector, on the unscaled overlay in real px (the same layer the damage numerals and the intent slab use).

- **Not changed:** the cut-in, the menu, the ATB clock, the engine, the RNG. Rule 1 holds (HUD module, DOM only).
- **Not invented:** the chip's text is the ability's or item's own name from `src/data/ffx2` (the menu's label); no
  number, no new data (rule 6). Attack, Defend and the like carry their kind's name; Spherechange and Switch are not
  charges and get no chip.
- **Phone and desktop:** real px, 14 px floor at every viewport, clamped inside the window.
- **Why it can work where the last two did not:** it adds the one thing the frames lack, at the moment they lack it, and
  it has a direct test: a frame inside 300 ms of the confirm either shows the name beside the figure or it does not.

## 4. What would send this back (the stop rule)

If the chip does not show within 300 ms of the confirm in a real-key capture at both sizes, the HUD's `sync` is not the
carrier of the charge state in time and the next step is to read it from the presenter's own `action-queued`
signal, not to add a third layer of timing. If the chip covers a face or a menu at 1600x900 or 390x844 it is moved by
the existing `fighterBoxes`-style rule, not hidden. Two failed attempts at this method means the item goes to Bailey
as a question (does the acknowledgement belong in the party row instead of over the figure?), not a fourth build.
