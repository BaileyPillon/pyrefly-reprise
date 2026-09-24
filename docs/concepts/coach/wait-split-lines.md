# Wait split: replacement drafts for three lines (FFX-2 only)

**Status:** drafts for Bailey to pick from. Nothing here is built, and `src/` is unchanged.
Picture: [wait-split-lines.jpg](wait-split-lines.jpg) shows a 3x3 grid of real 1600x900 frames
(chapter 4 Bahamut, seed 5, first X-2 turn, and the first-launch briefing). Each frame has one
draft injected into the live DOM, and the recommended one in each row has a gold frame.

**Why.** On 2026-09-24 Bailey said "I'll go ahead with all your recommendations". That makes
(A) the faithful FFX-2 Wait split the default: the clock runs on the main command list and holds
once a list is open (`research/ffx2-combat-core.md` §1.5, single source). It also takes (B): aiming
at a target holds too. B is **our reading**, because the source only says "submenu". Under A, three
lines claim the clock holds the moment the menu opens, and that is now untrue on the main list.
The switch flips together with his picks from this sheet (hotfix 12.2, `?wait=split`, commits
`cde4b88f` and `dc2669ac`).

**Game case: FFX-2 only.** All three lines show only for X-2 under Wait. Under Active, his
approved lines stay as they are, and the FFX lines do not change.

**What every draft must be true of.** The clock runs on the main command list. It stops once a list
is open (the skill, Magic, Item or Change list) and while aiming. It runs again once the choice is
made. None of the drafts says the list is the *only* thing that holds the clock, so none of them
contradicts B.

**Constraints used.** For voice, `research/writing-bible.md`: §1.15 for X-2 Rikku (dense and
bright, gets the technical point right), §1.4 for Auron (fragments and imperatives, plain words),
§2.2 and §2.3 for X-2 register (3 to 10 words, faster). Callback-with-variation comes from the
§2.1 table. Rules: no "ATB" or "CTB" (CHK-007), and at most 60 characters per line. For length,
each draft matches the line it replaces. All fits below were measured in the browser.

---

## 1. Rikku's first-turn gauge line (coach bubble)

`src/ui/coach/coachCopy.ts` `FFX2_GAUGE_BODY_WAIT`. It shows as her bubble when the first X-2
command menu opens, which is the moment the clock is running under A.

**Now:** "Bar's full, she's up! Take your time, nobody moves while you're picking." This is
Bailey's pick, D-030. It is 72 characters and takes 2 lines in the bubble. It is untrue because
she is "picking" on the main list, where everybody moves.

| | Draft | Chars | Fit at 1600x900 |
|---|---|---|---|
| **1a (recommended)** | "Bar's full, she's up! Open a list and take your time, nobody moves." | 67 | 2 lines |
| 1b | "Bar's full, she's up! Clock's ticking out here, so duck into a list to think." | 77 | 2 lines |
| 1c | "Bar's full, she's up! This menu's live, but a list freezes everything!" | 70 | 2 lines |

**Recommendation: 1a.** It keeps every phrase Bailey picked in D-030 ("Bar's full, she's up!",
"take your time", "nobody moves") and only moves the calm to where it is now true: inside a list.

Notes:
- 1b is the most explicit warning that the main list is running.
- 1c is the most Rikku-the-mechanic.
- An earlier 1a ("...take your time, nobody moves in there.") wrapped to a third line with an
  orphaned word, so it was cut.

## 2. Auron's briefing, line 4

`BRIEFING_WAIT_LINE`. The gold half is the `strong` field (shown in [brackets] below). Lines 1 to 3
do not change.

**Now:** "In hers, [the clock holds while you choose]." This is an agent draft, still INFERRED on tile
C1. It is untrue because choosing on the main list does not hold the clock.

| | lead · [strong] · tail | Chars | Fit |
|---|---|---|---|
| **2a (recommended)** | In hers, · [the clock does not wait] · . A list stops it." | 50 | 1 line |
| 2b | In hers, · [the clock runs until you choose] · ." | 41 | 1 line |
| 2c | In hers, · [the clock runs] · — think inside a list." | 46 | 1 line |

**Recommendation: 2a.** Its gold half is Bailey's own approved C1 wording, word for word. Four
plain words then make it true under Wait. That is a callback with variation: the Active and Wait
briefings differ by one short sentence.

Notes:
- "A list" reuses line 3's own word ("read the list").
- 2b mirrors line 2 ("nothing moves until you move") and covers aiming too. Its weakness: "until
  you choose" can be misread as "until you have finished choosing".
- 2c is the most Auron: an instruction, not an explanation.

## 3. The running badge over the coach bubble

`COACH_RUNNING_BADGE_WAIT`. It is set in the uppercase pink badge above Rikku's bubble.

**Now:** "Menu's up · gauges holding". This is an agent draft, still INFERRED. It is untrue because
with the menu up on the main list, the gauges are running. Bailey's approved Active badge is
"Nothing paused · gauges running" (31 characters).

The badge stays up for its 5.2 s fade even if the player opens a list meanwhile. So each draft
states a rule that is true in both places, not a status that only fits the main list.

| | Draft | Chars | Width, desktop / phone |
|---|---|---|---|
| **3a (recommended)** | Gauges running · a list holds them | 34 | 331 px / ends at x 347 of 390 |
| 3b | Nothing paused · till a list opens | 34 | fits / ends at x 333 |
| 3c | Clock's live · a list stops it | 30 | fits / ends at x 284 |

**Recommendation: 3a.** It keeps "gauges running" from his approved Active badge. It names the
thing the player watches, and "holds" is the verb of the Wait chip the player sees next, over the
target cursor ("WAIT — ATB HELD").

Notes:
- 3b keeps the other half of his badge.
- 3c echoes 2a ("A list stops it"), so the briefing and the badge would use the same words.

---

**If Bailey takes all three recommendations**, the first X-2 turn under Wait reads:

- Badge: "GAUGES RUNNING · A LIST HOLDS THEM".
- Bubble: "Bar's full, she's up! Open a list and take your time, nobody moves."
- Briefing line 4: "In hers, **the clock does not wait**. A list stops it."

The badge and bubble together are the sheet's bottom-left frame (3a). The briefing is frame 2a.

**How the picture was made.** A private Vite server (port 5763, HMR off) ran the working tree in
headless Chromium (GPU) with a fresh profile. The first-launch briefing and chapter 4's first X-2
menu were captured as they appear. On the coach mark, a clone of the live mark kept the text from
fading, and the draft was set in it. The shots were composed with PIL. The scripts are in
`D:/Tools/pyrefly-scratch/wait-lines/`.
