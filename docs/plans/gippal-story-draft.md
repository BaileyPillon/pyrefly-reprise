# DRAFT for Bailey — Chapter XV story beats: the Den of Woe, the three shades (FFX-2 only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, results show, no lines; see
`src/data/chapter-ffx2-den-of-woe.ts`). No file under `src/story` was written. Pick, cut or rewrite
lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX-2 only** (AGENTS.md rule 14). FFX-2 cutscene grammar
  (`research/writing-bible.md` §2.2): three-beat banter (Rikku sets up, Yuna reacts, Paine kills
  it), sincerity for one exchange at most and never past 4 lines, lines of 3 to 10 words, Yuna as
  the chapter narrator. The FFX register does not apply.
- **The events are canon; the wording is ours.** Beats come from
  `research/ffx2-gippal-den-of-woe.md` §1.1, §2, §3 (the scan texts' sorrow, anger and despair) and
  §6.2 (the ten recordings open the door; Paine warns it is dangerous; the pyreflies show Shuyin's
  memory; the shades of Baralai, Gippal and Nooj rise; the three escape and name Shuyin's feelings as
  the cause of the deaths; Paine promises to save Baralai from him). No game line is quoted or
  reworked, and none of the wiki's battle lines for Baralai or Nooj is used (rule 8). Every line
  below is `[ORIGINAL]`.
- **Your picks this draft follows** (2026-09-25, "I'll go with all your recommendations",
  `docs/plans/chapter-gippal-review.md`): **GP1 b** the three shades, no solo duels (so the
  possessed Rikku and Paine of beat 4 are told in one line, not fought); **GP13 a** the shades are
  silent, Yuna, Rikku and Paine carry every line; **GP14 a** Yuna's narration opens it, the ten
  spheres, the door, and Shuyin's memory in three or four lines over the approved Shuyin portrait;
  **GP15** the callouts below; **GP2** "The Den of Woe", Chapter XV.
- **Voices** (bible §1.14–§1.16): this is **Paine's past, so she speaks least and last** in every
  exchange that touches the Crimson Squad, and she never states her feelings unprompted. Rikku says
  what Yuna feels before Yuna does. Yuna's seam shows once.
- **Proposed bible tag: E15 — THE DEN OF WOE.** The drafts for Chapters X and XI propose E10 and
  E11; Omnis, Trema and Isaaru take the tags between on their own branches. Tonal tier: FFX-2 with
  the jokes rationed down, the most mournful FFX-2 chapter we have; the victory quips stay short.
- **Where each callout would hang** (nothing is wired; the AI emits no `script-trigger`, because an
  AI-emitted name must resolve to a script in `src/story/registry.ts`): the first Mortar and
  Lightfall on `ability-used` (`x2-den-gippal-mortar`, `x2-den-nooj-lightfall`); Gippal's turn on
  `hp-below` a third of 14,800; Baralai's counter at 7 needs a new emit from
  `src/battle/ffx2/ai/den-of-woe.ts` when the script is written. The link entrances and the last
  shade falling are the chain's own moments.

---

## Pre-battle — Yuna's narration, then the door (GP14 a)

Narration, over black, then the approved Shuyin portrait for lines 3 and 4:

| # | Speaker | Line |
|---:|---|---|
| 1 | Yuna (narration) | Ten old spheres. Paine's recordings, every one. |
| 2 | Yuna (narration) | Together they opened a door in the ravine. |
| 3 | Yuna (narration) | Inside, the pyreflies remembered someone else. |
| 4 | Yuna (narration) | A boy, a machine, and a song cut short. |

Live, at the centre of the cave:

| # | Speaker | Line |
|---:|---|---|
| 5 | Paine | This place is dangerous. Stay close. |
| 6 | Rikku | Um, the glowy things are staring. |
| 7 | Yuna | They're not just pyreflies. They're... feelings. |
| 8 | Paine | Theirs. I know those shapes. |

`battleStart()` on Baralai.

## Link 1 — Baralai (sorrow)

**Entrance:** Rikku: "That's Baralai! ...Isn't it?" / Paine: "What's left of him."

**Callout — his counter at 7 (a new AI emit):** Rikku: "He's counting us! One more and—"

## Link 2 — Gippal (anger)

**Entrance (no results between, the chain carries everything, GP3 a):**
Rikku: "Gippal? He'd never pick a fight with me." / Paine: "This one would."

**Callout — below a third, the cycle breaks (`hp-below`):** Yuna: "His pattern's gone.
Watch everything now!"

**Callout — the first Mortar (`ability-used`), the Gun Mage aside (GP7 a: nothing is
learned, the Gun Mage already has it):** Rikku: "Ooh, Mortar! A Gun Mage could use that."

## Link 3 — Nooj (despair)

**Entrance:** Yuna: "Nooj too. All three of them." / Paine: "...Of course. He'd go first."

**Callout — Lightfall (`ability-used`):** Rikku: "Big light! Big, big light! Hold on!"

**Callout — the last shade falls:** Paine: "Enough. Let them rest."

## Post — out of the Den, beat 7

The one sincere exchange of the chapter (bible §2.2: exactly one, under 4 lines), lines 12 to 14.
`results()` sits after line 15, the house pattern.

| # | Speaker | Line |
|---:|---|---|
| 9 | Rikku | We're out! Everybody's out, right? |
| 10 | Yuna | Those weren't them. It was Shuyin, feeling through them. |
| 11 | Rikku | So the squad didn't hate each other. |
| 12 | Yuna | Paine... are you okay? |
| 13 | Paine | Two years I thought they chose it. |
| 14 | Paine | Baralai's still carrying him. I'll get him back. |
| 15 | Rikku | Okay. Team hug. Paine, you're in the middle. |
| 16 | Paine | No. |

## Open questions for Bailey (not decided here)

1. **Beat 4 in one line or none.** GP1 b leaves out the possessed Rikku and Paine duels. Line 6
   could become "Something just tried to get inside my head" to nod to it, or stay as it is.
2. **Narration over the Shuyin portrait** (GP14 a) uses the approved `shuyin` speaker portrait;
   `lenne.png` is on disk with no verdict, so she is named in no line and shown in no frame.
3. **Callout speakers** are our assignment; swap any of them freely. Each callout plays once
   (a mid trigger's once-flag); Baralai's counter reaches 7 again after every Drill Shot, so
   his emit needs the same once-flag.
4. **Line 13's "two years"** is the research's timing (§1.1, the massacre two years before
   FFX-2, `[single source]` on the Ultimania's detail); cut it if you would rather not date it.
