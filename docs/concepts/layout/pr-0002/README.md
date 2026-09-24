# Option sheet PR-0002 — Yuna hidden behind the FFX command stack

**Game case: FFX only.** Chapters 1 and 3 are FFX chapters; the Ink & Gold command
cascade referenced here is the FFX 5-row mock (AGENTS.md rule 14). This does not
touch FFX-2's ATB command menu.

**Status:** options only. Nothing under `src/`, `tests/`, `critic/`, or `public/art`
was changed. Nothing is built or wired (AGENTS.md hard rules 9 and 10).

## The question

`critic/rounds/round-09.json` flags that the FFX command stack hides Yuna in
chapters 1 and 3 — her projected quad is more than one-third covered at 1600x900.
A 2-row cap fixed chapter 1 but cut the approved 5-row Ink & Gold command mock and
was reverted (`4b2cafc`) as a rule-9 violation: the command stack's proportions are
part of the approved end state, not a free variable.

**Which fix clears Yuna without touching the approved 5-row mock?**

## Evidence

- `_ch1-real.jpg`, `_ch3-real.jpg` — real in-battle captures at 1600x900
  (`npx vite --port 5560 --strictPort`, `PYREFLY_BROWSER=gpu`, chapter 1 vs.
  Mortiorchis/Seymour Flux), showing the command stack in its current, approved
  shape and Yuna's quad partly behind it.
- `a.jpg` / `b.jpg` / `c.jpg` / `d.jpg` — the four options, each a real capture of
  the same encounter with the labelled change applied (or, for D, unchanged),
  1600x900, game size (no scaling in the option image itself).
- `sheet.jpg` composites all four at 0.5 scale with captions (this is the file to
  look at first).

## Options

**A — Move party slot 0 (Yuna) right** *(recommended)*
Per-chapter scene layout data (`src/scenes`) repositions Yuna's slot so her quad
clears the stack's footprint. Cost: low, data-only. The command mock itself is
untouched, so this carries no rule-9 risk — it fixes the actual cause (party
placement) rather than reworking approved chrome.

**B — Shift or shrink the command stack**
Narrows/moves the stack, staying inside the approved mock's overall proportions.
Cost: medium. This is the same shape of change as the reverted 2-row cap —
smaller, but still a change to approved chrome — and would need Bailey's
sign-off on the narrowed mock before it could be treated as still "approved."

**C — Translucent stack while it is not the active window**
The stack drops to roughly 35% opacity except when it is the player's move to
choose, then returns to full. Cost: medium. Keeps the full 5 rows and their
proportions exactly as approved, but adds a new interaction/timing state (when
does it fade, how fast) that isn't in the approved mock and needs its own
in-motion check — a menu that reads fine in a still can feel wrong to click
(AGENTS.md rule 9, Progressive Target Resolution note).

**D — Leave as is**
No change. Yuna stays hidden behind the stack in chapters 1 and 3; the round-09
defect stays open. Cost: zero, but doesn't answer the question.

## Recommendation

**A.** It resolves the round-09 defect by moving the thing that's actually wrong
(Yuna's slot position) instead of touching the thing that's already approved (the
command stack). It carries no risk of a second rule-9 revert, needs no new
interaction state, and is the cheapest option that isn't "leave it broken." C is
the reasonable runner-up if Bailey wants the stack itself to feel more alive, but
it should get its own in-motion check before being treated as settled.

Nothing here is built. Waiting on Bailey's pick (or a mix) before any `src/`
change.
