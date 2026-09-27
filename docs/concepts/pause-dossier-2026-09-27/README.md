# PR-0171: the pause CHAPTER tab over a painted face (options, nothing built)

**Status: options for Bailey (AGENTS.md rule 9). Nothing is built.**
The t1-b3b repair removed the Ch II and Ch IX face boxes and listed four placements
(`docs/handoff/t1-b3b.md`, "The question for Bailey", branch `t1-b3b`). This folder shows
those four placements on real frames.

**Game case (rule 14): FFX only.** The two plates are FFX paintings: Chapter II
(`ch2-yunalesca`, which shows Yuna) and Chapter IX (`ch9-yojimbo`). The pause chrome is
shared by both games. Whichever option is picked would apply to any plate whose face sits
in the text area, but today only these two FFX plates need it.

## How the frames were made (no browser, no engine)

- **The live frames (D).** These are the re-checker's base captures, which match live:
  `D:/pyrefly-t1-b3b/docs/screenshots/t1-b3b-recheck/base/pause-chapter-{yunalesca,yojimbo-cavern}-{1600x900,2000x1012}-battle.jpg`.
  The face box and plate rect come from the JSON files next to them. All frames are in the
  battle state, which is the worst case because THE PARTY is shown.
- **The options (A, B, C).** These were composited in PIL:
  - `_layers.py` splits each capture into two parts:
    - the text layer: every pixel is solved as paper ink or gold ink over a model of the
      painting;
    - the painting: the shipped master, re-graded with `pause-screen.css`'s own filter,
      tint, falloff and vignette. The grade is calibrated to the captures and matches them
      to about 3 to 4 levels.
  - `_compose.py` moves the real text blocks onto the re-framed painting and measures the
    face box against every placed block (`measure.json`).
  - `_sheet.py` builds the contact sheet.
- **The phone frame.** `ch9-390x844-all-options.jpg` is the live Ch IX capture from
  `docs/screenshots/yojimbo-ship/list-390x844-05-pause-chapter.jpg`, downscaled.
- **Known approximations.**
  - The text layout inside each column is the captured one, so it does not reflow. In A,
    the mirrored blocks keep their left-aligned lines.
  - Clearance is measured at the captured moment. A build must also sweep the 26 s push-in
    (`faceClear`), as the member tabs do.

## Files

- `sheet.jpg` is the overview: 4 cases x 4 options, the face box outlined in magenta, and the
  measured result under each frame. The phone frame is in its own column.
- `ch{2,9}-{1600,2000}-{a-mirror,b-stack,c-slide,d-leave}.jpg` are the frames at real size,
  with no overlay.
- `ch9-390x844-all-options.jpg` is the phone frame.

## The options (3 lines each)

**A. Mirror.** The face moves to the left. The brand, the objective and the prompts
mirror to the right (the `pause--mirror` the member tabs use), and the columns go
row-reversed on the right.
- The plate slides past its right edge into the near-black falloff, using the approved
  member-tab slide rule mirrored. It shrinks to 0.97x on Ch II at 1600 and 0.88x on Ch IX at
  1600; at 2000 it keeps full size.
- The face is clear by 16 px in all 4 cases. The dossier keeps its heading and quote under
  THIS ENCOUNTER, and the snapshots are dropped (the existing under-lean fallback). Yuna
  faces into the frame, toward the text.

**B. Stack.** The painting stays exactly as live.
- THIS ENCOUNTER moves above THE PARTY in one column on the empty left, under the tab
  strip (the member tabs' faceStack rule).
- This gives the most air: 161 to 234 px. The whole dossier is dropped, both the quote and
  the snapshots, because at 900 px tall there is no room left for it.
- It keeps the approved painting untouched but loses approved content.

**C. Slide.** The chrome stays exactly as live, and only the plate moves.
- The plate slides right past its left edge until the face clears THE PARTY. This is the
  rule Bailey picked on 2026-09-24 for the member tabs ("B as one rule"). It shrinks to
  0.97x on Ch II at 1600 and 0.88x on Ch IX at 1600, both above the 0.755x floor.
- The face is clear by 16 px in all 4 cases. The dossier keeps its heading and quote under
  THIS ENCOUNTER, and the snapshots are dropped.
- Yuna's face ends at the right edge and she looks out of the frame.

**D. Leave it.** This is the live frame. THE PARTY and the dossier sit on the face:
- 20 text boxes at 1600x900;
- 19 text boxes at 2000x1012.

**Phone (390x844): the same under A to D.** A portrait frame never mirrors or slides
(`faceSlide`), and it already stacks the columns under the face. On Ch IX the lower mask
still sits under THIS ENCOUNTER, heavily dimmed. That is a separate phone question and is
not part of this pick.

## The key-column squeeze (REG-keycol) and which options avoid it

The re-check found that when THIS ENCOUNTER wraps a long place name (PR-0168), the
column still takes its unwrapped width:
- it squeezes THE PARTY's values at 1280 to 1440 wide;
- it pushes THE PARTY about 62 px to the right, onto Yojimbo's mask.

How each option is affected:
- **B avoids it by construction.** The two columns no longer share a row, so THIS
  ENCOUNTER's width cannot squeeze or push THE PARTY. Each column gets the full stack width.
- **A and C depend on it.** THE PARTY's right edge decides how far the plate must slide
  and shrink. With the extra 62 px, Ch IX at 1600 would need about 0.78x instead of 0.88x.
  That is still above the 0.755x floor, but only barely, and it is not measured at 1280.
  Either option needs the THIS ENCOUNTER width cap (the re-check's "What a fix needs") to
  land first.
- **D keeps the regression as it is.**

## Recommendation: C, with A as the alternative

- **Why C.** It is the rule Bailey already picked for the member tabs, extended to the
  CHAPTER tab: the chrome and columns stay exactly as approved and only the painting moves.
  In code it is face boxes for the two chapter plates plus letting `faceSlide` run on the
  CHAPTER tab.
- **What it costs.** The snapshots drop on these two plates, and the THIS ENCOUNTER width
  cap has to land first.
- **Why A instead.** Pick A if Yuna looking off the right edge in C reads wrong. A gives
  the same clearance with her facing into the frame. The cost is a mirrored CHAPTER tab on
  those plates only, where today the code forces the mirror off.
- **Why not B first.** B is the safest for REG-keycol, but it removes the dossier quote,
  which Bailey approved.

## Questions for Bailey

1. Chapter II (Yuna): A, B, C or D? *Recommended: C (or A if she should face the text).*
2. Chapter IX (Yojimbo): A, B, C or D? *Recommended: C.*
3. Should the pick apply as one rule to any chapter plate whose face sits in the text area,
   or only to these two? *Recommended: one rule.*
