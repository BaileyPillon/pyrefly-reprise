# Option sheet: Chapter VII's party under the FFX command stack (Macalania Temple)

**Game case: FFX only** (AGENTS.md rule 14). Chapter VII is an FFX chapter, and the
stack is the FFX Ink & Gold command cascade. No FFX-2 scene or HUD is touched.

**Status (repair cycle 1, 2026-09-25):** still Bailey's pick. All four options are now built as
data behind one constant (`src/scenes/macalania-temple-layout.ts`, still `'current'`) and B is
proved in the real build: `built/README.md`. **Original status:** options only. Nothing under `src/` changed for this sheet,
and nothing is built. The layouts were staged at runtime in the page
(`window.__pyrefly.battle().stage.actors.get(id).actor.position.set(...)`) after the
first menu was up and staging had finished, the way the R13-04 sheet was made
(`docs/concepts/layout/r13-04-evrae/`).

## The question

Chapter VII's party slots (`src/scenes/macalania-temple.ts` `PARTY_SLOTS`) are Chapter I's
arc from **before** D-041 (PR-0002 option A), and the scene does not set `holdParty`. At
the first menu, measured live at 1600x900, 1280x720 and 2000x1012, the approved 5-row
command stack covers **Yuna** (64 to 70% of her head and torso under the command rows,
frame visibility 0.24 to 0.27) and **Tidus** (40 to 47%, visibility 0.43 to 0.48). Round 12
counted the same defect as a major in Chapter VIII (R13-04) and in Chapters I and III
(PR-0002), and Bailey fixed both with a layout pick (D-041, D-144). The stack itself stays
as approved in every option here.

**Which layout clears the party in Macalania?** The field is fuller than Chapter I's: three
fiends stand across the middle (Guardian A, Seymour, Guardian B), so the free floor between
the stack and the fiends is narrow.

## Evidence

- `sheet.jpg`: one row per option (current, A, B, C), each at 1600x900, 2000x1012 and 390x844.
  Look at this first.
- `{current,a,b,c}-{1280x720,1600x900,2000x1012,390x844}.jpg`: the full-size captures.
- `data-*.json`: per figure, the world position, screen rect, the worst HUD panel over it,
  the share of its head and torso (top 45% of the figure) under the command rows, and
  `visibilityInFrame()` (1 = clear of every other figure and every declared panel).
- **How:** a private Vite on 127.0.0.1:5700 (HMR and watcher off), `PYREFLY_BROWSER=gpu`
  (ANGLE D3D11), a fresh page per size, `gotoChapter('seymour-anima-macalania', { seed: 1 })`
  (no key on the title; the chapter is locked on the board), Enter on the first-time hint,
  then the four layouts in one page in the order current, A, C, B (`layouts.json`; B pins the
  fiends, so it runs last). `probe.mjs` makes the captures and `data-*.json` (it writes
  `probe-<size>.json`, renamed here), and `sheet.py` composites the sheet.

## Measurements (first menu, 1600x900; 1280x720 and 2000x1012 agree within 4 points)

| | Tidus head+torso under rows / visibility | Yuna | Rikku | Guardian A | Seymour | Guardian B |
|---|---|---|---|---|---|---|
| **current** | **47% / 0.43** | **64% / 0.27** | 0% / 0.91 | 0.77 | 0.83 | 0.82 (18% under the party panel) |
| **A** | 0% / 1.00 | 0% / 0.42 | 0% / 1.00 | 0.45 | 0.63 | 0.83 (18%) |
| **B** | 0% / 1.00 | 0% / 0.65 | 0% / 0.95 | 0.56 | 0.44 | 0.86 (14%) |
| **C** | **26% / 0.63** | 0% / 1.00 | 0% / 0.50 | 0.40 | 0.74 | 0.83 (18%) |

A fiend's number is its whole box. A party member standing in front of a robe hem counts
against it. In every A and B capture the Guardians' and Seymour's heads and torsos are clear
by eye; what the party covers is the lower robes. Only Guardian B touches a panel (the party
status panel over its feet), in every option, the current one included.

**Phone (390x844):** the head-and-torso numbers are 0 in every option; the phone HUD has no
stack over the field. The current layout leaves Seymour and both Guardians partly off the
right edge (the shared `phoneFraming.ts` slide, a known phone-HUD finding in the handoff).
A and B bring Seymour and Guardian A whole into the frame; Guardian B stays part-off in
every option.

## Options

World positions `[x, y, z]`. The current ones are after the relaxation step, which moves
the party each run because the scene does not hold it: Tidus about [-1.55, 0, 1.55], Yuna
[-3.46, 0, 0.25], Rikku [-1.05, 0, -1.05]. The fiends stand where the formation solver puts
them: Guardian A [-0.1, 0, -3.15], Seymour [2.0, 0, -5.4], Guardian B [3.3, 0, -0.9].

**A: the party re-laid right of the stack; the fiends stay where the solver puts them.**
- Tidus [-0.3, 0, 1.6] (front), Yuna [-1.0, 0, -0.9] (back-left), Rikku [0.8, 0, 0.3] (right).
- Needs `holdParty` on the scene (the D-041 recipe), or the relaxation walks the arc back.
- The cost: Yuna stands directly in front of Guardian A, so both read as one cluster (Yuna 0.42,
  Guardian A 0.45).

**B (recommended): A's arc, spread, with the three fiends pinned one step right and back.**
- Tidus [0.0, 0, 1.8], Yuna [-0.9, 0, 0.2], Rikku [1.3, 0, 0.9].
- Guardian A [1.0, 0, -3.6], Seymour [2.5, 0, -5.8], Guardian B [3.6, 0, -1.8], pinned with
  `SceneSlots.enemySpots` (Chapter I's R13-02 recipe), plus `holdParty`.
- Why: every party face and torso is clear at all three desktop sizes, the figures no longer
  stand one directly behind another, Guardian B sits a little further from the party panel
  (14% against 18%), and on the phone Seymour comes whole into the frame.
- The cost: Rikku stands in front of Seymour's robe hem (his whole-box number drops to 0.44;
  his face, arms and upper robe stay clear). The formation is no longer the solver's.

**C: Chapter I's approved D-041 arc, copied as is.**
- Tidus [-1.31, 0, 1.55], Yuna [0.3, 0, 1.0], Rikku [-0.61, 0, -1.05], `holdParty`.
- The cheapest, and it matches Chapter I. But the fuller field leaves Tidus 26 to 29% under the
  command rows, and Rikku stands in front of Guardian A (0.50 / 0.40).

## Not measured before the pick

The picked layout also changes the other rigs, and these are checked when it is built:
Anima's arrival (`anima-low` and `anima` rigs, "behind the party"), act two (Seymour's
step-back spot `SEYMOUR_STEP_BACK` [0.55, 0, -5.2] and Anima on slot 3), the action and
victory shots (the victory rig keeps Seymour's body between the party and the turn list), and
the scene projection test `tests/unit/chapters/macalania-scene.test.ts`.

## Where the pick lands

`src/scenes/macalania-temple.ts`: `PARTY_SLOTS` rows 0 to 2 and a staging constant
(`holdParty`, plus `enemySpots` for B) spread into `MACALANIA_TEMPLE_SLOTS`, as
`gagazet.ts` and `evrae-airship-deck.ts` do. Staging only, no game data.
