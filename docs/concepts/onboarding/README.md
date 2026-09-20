# Onboarding — three end-state options

**For Bailey. Pick one, or name the parts you want from each. Nothing is built.**

Start with **[`sheet.png`](sheet.png)** — all nine frames on one page. Then open the
full-size frames for whichever row interests you. The written notes are in
[`options.json`](options.json), five lines per frame.

Why this exists: the critic's number one issue on the live build is that nothing
teaches the game (round 03, onboarding **2.8 / 10**). You approved exactly one idea
for it — *cold open and taught chapter* — and AGENTS.md hard rule 9 says you see and
approve the end state before anything perceivable is built.

## The three

| | Option | In one line |
|---|---|---|
| **A** | [Taught first turn](a-taught-first-turn/) | A short cold open, then three coach marks on the real HUD, one at a time. |
| **B** | [Field notes](b-field-notes/) | No interruption at all: one line on the hint bar, and a HOW TO PLAY page whenever you want it. |
| **C** | [Auron's briefing](c-aurons-briefing/) | Twenty seconds in the game's own voice, then one whispered line the first time something is real. |

Each option has three frames: the very first screen after the title, the first
player turn being taught, and how help is reached again later. The third frame of
every option is the **FFX-2** one, because that is where the two games must differ.

## What every option already obeys

- **A visible skip and a visible "never show again"** on the first surface it puts
  on screen. A veteran never has to hunt for the off switch, and a save with a
  cleared chapter is treated as a veteran's — coaching off, every mark pre-seen.
- **One teaching surface at a time.** While a coaching surface is up, the move
  advisor card and the mid-battle barks are suppressed.
- **Player words, not wiki words.** "Turn order", "the gauge", "Overdrive", "aeon",
  "dressphere", "chain". The acronyms CTB and ATB appear on none of the nine frames.
- **Keyed by mechanic, not by chapter** — the first time turn order, an Overdrive,
  a gauge or a chain is actually real. Nothing here waits on the unbuilt Macalania
  or Leblanc chapters.

## Game-aware (hard rule 14)

Decided from `research/ffx-vs-ffx2-presentation.md`, not from memory.

- **FFX only** — a coach mark may *hold the turn* until one confirm press, and it may
  point at the turn-order list and its preview. §9 row 3: the turn-order preview is
  TRUE for FFX and NOT TRUE for FFX-2; FFX's engine waits for input by definition.
- **FFX-2 only** — teaching is **never** allowed to freeze a gauge. Marks render
  beside the running party rows and fade on their own; the thing they name is the
  gauge and its charge segment, never a queue. §4.2 / FC-4 (the gauge is a four-phase
  pipeline: green fill → command input → purple charge → execution and recovery) and
  §4.3 / FC-5 (that charge segment is canon's own answer to "what will this cost me").
  The Active/Wait choice is offered once, through the setting that already exists.
  One canon bonus: **Battle Help** is a real entry in FFX-2's Config list, so in the
  X-2 chapters the toggle can be labelled exactly as the game labels it.
- **Both** — the cold open slot, the START HERE ribbon, the seen-set, the off switch,
  the codex page, the "why you lost" line and the suppression hooks. Shared plumbing
  and bug fixes are "both" (CHK-020), same work in both games with different content.

## Four questions

1. Which option, or which parts of which? The frames are built so they mix — A's
   three marks with B's codex, or C's briefing with B's hint bar.
2. **Battle Help** is canon's own name in FFX-2. Our sources name no FFX equivalent.
   Same words in FFX (ours, honest but not canon), or a different FFX label?
3. Option C's FFX-2 voice: **Rikku** (warmer, inside the fight) or **Shinra** (canon's
   own tutorial voice, already cited in our shipped data)?
4. START HERE on the chapter board: yes or no? All three assume yes, no hard lock.

## How these were made

1600×900, HTML composited with the existing kit (`docs/concepts/polish/_kit/kit.css`)
over **real captures from the live build** (`main 7191674`) — so what you see sits on
the HUD as it really is today, not on an idealised one. Rendered with
`PYREFLY_BROWSER=gpu`. Every frame carries a CONCEPT tag and a slate naming the moment.

```
node docs/concepts/polish/_kit/shoot.mjs \
  docs/concepts/onboarding/a-taught-first-turn/a2-first-turn-ffx.html \
  docs/concepts/onboarding/a-taught-first-turn/a2-first-turn-ffx.png --w=1600 --h=900
```

## Before any of this is built

The paper critique ([`docs/plans/onboarding-review.md`](../../plans/onboarding-review.md),
verdict **revise**, 14 required changes) puts three things ahead of it, and they are
all cheaper than any option here: round-02 **#26** (research citations printing in the
enemy-intent panel), **#27** (the info slab is blank on every leaf row) and **#29** (the
strategy guide clips mid-sentence). Fixing those *is* teaching, and costs no new
approved target. **#30** — Chapter 1's 38.6-second opening scene cannot be
fast-forwarded — has to land before any cold open, or first input sits past two minutes.

A 390×844 phone variant of whichever option you pick still has to be drawn.

---

*Concept only. Nothing under `src/` was touched.*
