# DRAFT for Bailey — Chapter XIII story beats: Trema, Cloister 100 of the Via Infinito (FFX-2 only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, results show, no lines; see
`src/data/chapter-ffx2-trema.ts`). No file under `src/story` was written. Pick, cut or rewrite
lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX-2 only** (AGENTS.md rule 14). FFX-2 cutscene grammar
  (`research/writing-bible.md` §2.2): Yuna narrates the chapter open, three-beat banter (Rikku
  sets up, Yuna reacts, Paine kills it), sincerity for one exchange at most and never past 4
  lines, lines of 3 to 10 words. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16.
- **The events are canon; the wording is ours.** Beats come from `research/ffx2-trema.md` §2 and
  §7: the stranger on Cloister 0 who told the children about a man who went down and never came
  back; Paine's floor-20 guess that he was already dead; Paragon on the last floor; the old man
  destroying Paragon himself and naming himself founder of New Yevon; why he destroyed the
  spheres (people must let go of the past to grow strong); his challenge; Yuna's answer (the
  memories she made with her friends); his last word on her, and his fading. **No game line is
  quoted or reworked** (the two short lines research §7.2 carries stay out), and **no Hymn of
  the Fayth lyric** is used anywhere (plan TR13, rule 8). Every line below is `[ORIGINAL]`.
- **Your picks this draft follows** (2026-09-25, "I'll go with all your recommendations"):
  **TR13** callouts at Paragon's first Big Bang, Trema's entrance, both Meteors, Ultima and the
  first Stop, in our words; **TR14 a** Yuna opens, the Cloister 0 stranger in two lines, Trema
  revealed only after Paragon, no Kinderguardian portraits; **TR15** no "illusion of Zanarkand";
  **O-2b** the link staged as a short scene between the links; **TR17** "Trema", Via Infinito —
  Cloister 100.
- **Trema's voice** (plan §7): courteous, certain, and he speaks of the past as a weight to put
  down. He never raises his voice; he approves of strength the way a teacher does. He is the
  founder of a movement and an unsent (research §7.1), so he is patient: he has had time.
- **Proposed bible tag: E13 — TREMA (Cloister 100).** The Omnis draft takes E12. Tonal tier:
  FFX-2 buoyant on the way down, one sincere seam at the end (Yuna's answer).
- **The engine already names the hooks.** Trema's AI emits `script-trigger` events
  `trema-meteor-1`, `trema-meteor-2` and `trema-ultima` when each HP trigger fires; the callouts
  below can key on those without touching the AI.

---

## Pre-battle — Yuna's narration, then the last floor

| # | Speaker | Line |
|---:|---|---|
| 1 | Yuna (narration) | Under Bevelle, a dungeon goes down a hundred floors. |
| 2 | Yuna (narration) | At the top, a stranger told the kids a story. |
| 3 | Yuna (narration) | A man walked down there a year ago. |
| 4 | Yuna (narration) | He never came back up. |
| 5 | Rikku | Floor one hundred! Rikku, still alive, reporting! |
| 6 | Yuna | Um... is that a good sign or a bad one? |
| 7 | Paine | Ask me after. Something's waiting. |

`battleStart()` on Paragon.

## Link 1 — Paragon

| # | Speaker | Line |
|---:|---|---|
| 8 | Yuna | That thing... it used to be somebody. |

**Callout — Paragon's first Big Bang (TR13):** Paine: "It hits back. Don't give it a reason."

## Between 1 and 2 — the link (O-2b: Paragon falls; the old man finishes it)

Staged as a short scene with no results screen between (research §1.1, `[verified: 5 sources]`:
no healing, no change of equipment). The party stays as the first fight left them.

| # | Speaker | Line |
|---:|---|---|
| 9 | Rikku | It's down! We did it! We... huh? |
| 10 | Trema | Forgive the interruption. It had served its purpose. |
| 11 | Yuna | You're the one from the top floor. |
| 12 | Trema | I founded New Yevon. You may call me Trema. |
| 13 | Paine | The man who never came back. |
| 14 | Trema | I came down with every sphere we gathered. |
| 15 | Trema | And I broke them. Every one. |
| 16 | Yuna | Why? They were people's memories. |
| 17 | Trema | Memories are weights. Put them down, and you rise. |
| 18 | Trema | You carried yours a hundred floors. Show me what they bought. |

**Callout — Trema's entrance (TR13), as his link opens:** Rikku: "Okay, new plan. Don't die."

## Link 2 — Trema

**Callout — the first Stop (TR13; Beguiling Mire):** Rikku: "Can't... move... not now!"

**Callout — first Meteor (`trema-meteor-1`, TR13):** Paine: "Heads up. Literally."

**Callout — second Meteor (`trema-meteor-2`, TR13):** Yuna: "Again? Everyone, hold on!"

**Callout — Ultima (`trema-ultima`, TR13):** Trema: "Let go. It is easier."

## Post — Yuna's answer, and he fades

The chapter's one sincere exchange (bible §2.2: exactly one, 4 lines at most), then the banter
comes back. `results()` sits after line 23, the house pattern (the scenes after the marker play
after the results screen).

| # | Speaker | Line |
|---:|---|---|
| 19 | Trema | Why do you fight, if not to forget? |
| 20 | Yuna | For what I made with them. Every day of it. |
| 21 | Trema | Then you are freer than I ever was. |
| 22 | Yuna (narration) | He smiled, I think. Then he was gone. |
| 23 | Rikku | So... is that a Garment Grid? Dibs! |
| 24 | Paine | Hole in the floor. Out. |

## Open questions for Bailey (not decided here)

1. **Line 21 stands in for his canonical last word** on Yuna (research §7.2 carries it; this
   draft does not quote it). Keep ours, or bring the sourced idea closer.
2. **Callout speakers** are our assignment; swap any of them freely.
3. **Trema's Ultima callout** gives him a mid-fight line. The sources list battle quotes for him
   (research §7.2, not used here); if you would rather he stay silent in battle, cut it.
4. **The Iron Duke** (the sourced reward, `[verified: 4 sources]`) is not an item the results
   screen can show today; line 23 nods at it.
