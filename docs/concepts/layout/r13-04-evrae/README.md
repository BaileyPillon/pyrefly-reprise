# Option sheet R13-04: Tidus hidden behind the FFX command stack in Evrae (Chapter VIII)

**Game case: FFX only.** Chapter VIII (Evrae, the Fahrenheit's deck) is an FFX chapter,
and the stack is the FFX Ink & Gold command cascade. FFX-2's ATB menu is not touched
(AGENTS.md rule 14).

**Status:** options only. Nothing under `src/`, `tests/` or `critic/` changed, and
nothing is built. The slot moves in the captures were staged at runtime through the debug
API (`window.__pyrefly.battle().stage.actor(id).position.set(...)`), after the menu was
up and staging had finished.

## The question

The release 13 focused review (`critic/reviews/a999d133-focused.md`, R13-04, major,
disclosed, the same on live) found this at Evrae's first menu: the approved 5-row FFX
command stack covers Tidus, whose frame visibility is about 0.23 at 1600x900 and
2000x1012. Bailey fixed the same defect for Yuna in chapters I and III with PR-0002
option A (D-041). That fix moved the party slot in the scene data, set `holdParty`, and
left the approved stack alone (`docs/concepts/layout/pr-0002/`).

**Which slot layout clears Tidus on the airship deck?** The deck is harder than chapters
I and III for two reasons. The deck ends at the rail (z -2.7), and Evrae rises beyond
the rail, right of the stack. So the free deck between the stack and Evrae is narrow.

## Evidence

- `sheet.jpg` composites the three options in three rows: NEAR at 1600x900, NEAR at
  2000x1012, and FAR at 1600x900. Look at this file first.
- `near-{c,a,b}-{1600x900,2000x1012}.jpg` and `far-{c,a,b}-{1600x900,2000x1012}.jpg` are
  the full-size captures.
- `data-*.json` holds the measurements: screen rects, `visibility()`,
  `visibilityInFrame()`, occluders, world positions and the flow steps.
- **How the captures were made.** Each viewport ran one real flow, with a Vite dev server
  on 127.0.0.1:5670 (HMR and watcher off) and `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX
  5070 Ti), seed as shipped.
  - Real keys only: title Enter, briefing Enter, arrows to the tile, Enter, prep Enter,
    then Enter held through the cutscenes.
  - At the first menu, Enter dismissed Auron's first-time hint. That frame is NEAR.
  - ORDERS, then PULL BACK. Rikku and Wakka each took ATTACK. Cid flew the order, and
    Tidus's next menu came up at FAR.
  - In this run, Evrae KO'd Rikku before FAR, so she lies on the deck in the FAR row.
- **The approved target** is the Evrae widget, option A (`docs/concepts/chapters/evrae/widget/a-near.png`).
  It draws the party as silhouettes behind the cascade, so it pins no party placement.
  The staging reading Bailey approved (option C's staging) says: NEAR is tight and low,
  with Evrae's head over the rail. Both A and B keep Evrae on its spot, and its head
  over the rail.

## Measurements (`visibilityInFrame`, 1 = fully clear)

| | Tidus | Wakka | Rikku | Evrae (whole-box) |
|---|---|---|---|---|
| **C** NEAR 1600 / 2000 | **0.23 / 0.23** | 0.95 / 0.92 | 0.61 / 0.86 | 0.94 / 0.92 |
| **A** NEAR 1600 / 2000 | 1.00 / 1.00 | 0.92 / 0.93 | 1.00 / 1.00 | 0.63 / 0.63 |
| **B** NEAR 1600 / 2000 | 1.00 / 1.00 | 1.00 / 1.00 | 1.00 / 1.00 | 0.56 / 0.57 |
| **C** FAR 1600 / 2000 | 0.89 / 0.87 | **0.14 / 0.14** | 1.00 / 1.00 | 1.00 / 1.00 |
| **A** FAR 1600 / 2000 | 1.00 / 1.00 | **0.14 / 0.14** | 0.98 / 1.00 | 1.00 / 1.00 |
| **B** FAR 1600 / 2000 | 1.00 / 1.00 | 0.95 / 0.93 | 0.97 / 0.98 | 1.00 / 1.00 |

**What Evrae's number means.** Evrae's figure is its whole 623x423 box. A party member
standing in front of any part of the lower coils counts against it. In every A and B
capture, Evrae's head, jaw and crest stay clear by eye. What the party covers is the neck
and the coils behind the rail.

**A new finding.** At FAR, the stack also hides **Wakka** on live (0.14). He stands at
frame-left, and the wider FAR camera brings him in under the stack.

## Options

The positions below are the world positions staged, as `[x, y, z]`. Live's are after
relaxation: Tidus [-1.8, 0, 1.55], Wakka [-4.1, 0, 0.25], Rikku [-1.1, 0, -1.1].

**A: Tidus steps right, Rikku along the rail.** Two slots move.
- Tidus moves to [-0.5, 0, 1.4], the open deck between the stack and Evrae's head.
- Rikku moves back and right to [1.3, 0, -1.9], so she is not behind Tidus. This also
  clears R13-03 (Rikku under the stack rows at 2000).
- Wakka stays at frame-left.
- Needs `holdParty` on the scene, as in D-041, or the relaxation walks the arc back.
- The cost: Tidus and Rikku now stand in front of Evrae's neck and lower coils. Wakka
  stays buried at FAR (0.14). Data-only (`src/scenes/evrae-airship-deck.ts` `PARTY_SLOTS`
  plus the `holdParty` switch).

**B: the D-041 arc, backed to the deck's edge.** All three move, in D-041's recipe. The
whole arc is re-solved right of the stack's footprint, and `holdParty` holds it. On the
airship, the arc cannot push right the way chapters I and III did, because Evrae is
there. So the back row stands at the rail instead, about 0.2 to 0.4 in front of the rail
line.
- Wakka moves to [-0.95, 0, -2.5], back-left at the rail.
- Tidus moves to [0.1, 0, 0.9], front-centre.
- Rikku moves to [2.2, 0, -2.3], back-right at the rail.
- Every party member is at least 0.93 at NEAR and at FAR, at both sizes. Only B also
  fixes Wakka at FAR.
- The cost: the party covers slightly more of Evrae's lower body than A does (0.56 against
  0.63), and the trio reads as a tight group at the rail.
- Data-only, in the same two places as A.

**C: Leave as is.** Nothing changes. Tidus stays 0.23 visible at NEAR, which is R13-04.
Rikku stays 0.61 to 0.86. Wakka stays 0.14 at FAR.

**Not measured, for A and B alike:**
- **The `party` and `victory` rigs.** Both aim at x -2.6, which was the old arc's centre
  (`evrae-airship-deck.ts` RIGS). A moved arc would sit right of centre in those shots,
  so they probably need a data-only re-aim when this is built.
- **The `action` and `enemy` rigs, and the targeting step.** These were not captured.
- **The stack.** Neither option touches the approved 5-row stack. This rules out a rule-9
  revert of the kind that `4b2cafc` fixed.

## The question for Bailey

**Evrae's deck: A (move Tidus and Rikku), B (re-lay all three at the rail, D-041 style), or
C (leave it)?** Recommendation: **B**. It is the only option that clears all three party
members at both ranges. It also fixes the FAR Wakka problem that the sweep had not
caught, and it follows the same data-only recipe Bailey already approved in D-041. A is
the cheaper fallback if Bailey wants the party to hold more of its old shape.
