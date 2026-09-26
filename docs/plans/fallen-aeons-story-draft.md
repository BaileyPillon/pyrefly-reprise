# DRAFT for Bailey — Chapter XI story beats: the fallen aeons on the Road to the Farplane (FFX-2 only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, results show, no lines; see
`src/data/chapter-ffx2-fallen-aeons.ts`). No file under `src/story` was written. Pick, cut or
rewrite lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX-2 only** (AGENTS.md rule 14). FFX-2 cutscene grammar
  (`research/writing-bible.md` §2.2): three-beat banter (Rikku sets up, Yuna reacts, Paine kills
  it), sincerity for one exchange at most and never past 4 lines, lines of 3 to 10 words. The FFX
  register does not apply.
- **The events are canon; the wording is ours.** Beats come from
  `research/ffx2-fallen-aeons.md` §2 and §6.2 (the drop through a fayth hole after Nooj, Gippal and
  the possessed Baralai; three platforms; Yuna caught off guard by Shiva, dismayed that the Sisters
  fell too, asking Anima's forgiveness; the Farplane Glen with Leblanc, Ormi and Logos; back to the
  *Celsius*). The "caught off guard / dismay / forgiveness" shapes are SinirothX quote *patterns*;
  no game line is quoted or reworked. Every line below is `[ORIGINAL]`.
- **Your picks this draft follows** (2026-09-24, "I'll go with your recommendations for all"):
  **FA16 a** Yuna's opening line on each link plus four callouts (Stop lands, the first sister
  falls, the third Pain, Anima at half HP), no Farplane voices; **FA2 b / O-4 C** a Save Sphere
  fade between links with "HP and MP restored"; **FA17** "Fallen Aeons", Chapter XI, Road to the
  Farplane; **FA19** no Yojimbo.
- **Proposed bible tag: E11 — FALLEN AEONS (the Road to the Farplane).** The Yojimbo draft
  proposes E9 and the Natus draft E10. Tonal tier: FFX-2 buoyant with one mournful seam (these
  were Yuna's aeons), so the victory quips stay but stay short.

---

## Pre-battle — the briefing shape, then the drop

| # | Speaker | Line |
|---:|---|---|
| 1 | Shinra | Readings under the temple. The fayth are gone. |
| 2 | Brother | Nooj! Gippal! They went down there! |
| 3 | Buddy | Hole's under the statue. Straight down. |
| 4 | Yuna | Then that's our way in. Let's go. |
| 5 | Rikku | A road made of floating rocks. Cozy. |
| 6 | Yuna | It's the road to the Farplane. |
| 7 | Paine | Then walk. Don't look down. |

## Link 1 — Shiva, the first platform

| # | Speaker | Line |
|---:|---|---|
| 8 | Yuna | Shiva? No... not you too. |

**Callout — Stop lands (FA16):** Rikku: "Can't... move... Yunie!"

## Between 1 and 2 — the Save Sphere (O-4 C: fade to white, "HP and MP restored")

The one sincere exchange of the chapter (bible §2.2: exactly one, under 4 lines).

| # | Speaker | Line |
|---:|---|---|
| 9 | Yuna | She used to come when I called. |
| 10 | Paine | She didn't choose this. |
| 11 | Yuna | I know. That's what hurts. |
| 12 | Rikku | Okay. Hugs later. Road now. |

## Link 2 — the Magus Sisters, the second platform

| # | Speaker | Line |
|---:|---|---|
| 13 | Yuna | All three of you? Even you... |

**Callout — the first sister falls (FA16; Delta Attack is gone from here):**
Paine: "One down. They can't combine now."

## Between 2 and 3 — the banter comes back (Save Sphere fade again)

| # | Speaker | Line |
|---:|---|---|
| 14 | Rikku | Three sisters. Totally unfair. |
| 15 | Yuna | We're three sisters too, sort of. |
| 16 | Paine | We don't hover. |

## Link 3 — Anima, the third platform

| # | Speaker | Line |
|---:|---|---|
| 17 | Yuna | Anima... forgive me. Please. |

**Callout — the third Pain (FA16):** Yuna: "Remedy! Don't let it pile up!"

**Callout — Anima at half HP (FA16):** Paine: "She's breaking. Keep going."

## Post — the Farplane Glen

`results()` sits after line 19, the house pattern (the scenes after the marker play after the
results screen).

| # | Speaker | Line |
|---:|---|---|
| 18 | Yuna | Rest now. All of you. |
| 19 | Rikku | Flowers? Down here? |
| 20 | Leblanc | Took you long enough, Gullwings. |
| 21 | Ormi | Boss, they look tired. |
| 22 | Logos | Supplies. For a price, naturally. |
| 23 | Paine | Back to the ship. Then down. |

## Open questions for Bailey (not decided here)

1. **Statuses at the Save Sphere.** The O-4 C card promises "HP and MP restored" and the engine
   does exactly that. No source says whether a Save Sphere also clears Stop, Pain's losses or
   Itchy (plan Review R4 item 4); today nothing carries a status across a link anyway.
2. **Leblanc's shop in the Glen** is sourced (research §2); whether our Glen shows it is yours.
3. **Callout speakers** are our assignment; swap any of them freely.

---

## Built (2026-09-25, the ship layer, still unlisted)

`src/story/scripts/ffx2-fallen-aeons.ts` carries every line above, numbered the same, with these
changes. **Game case: FFX-2 only.**

- **Stop lands** plays for whichever girl Stop lands on. Measured on the intended line (100 seeds of
  Shiva, `driveLink`): Stop landed on Yuna 7 times and never on a Dark Knight, so Rikku's line alone
  would almost never play. Rikku's own line keeps the draft ("Can't move... Yunie!", one ellipsis:
  the house lint allows one a line). **Added, ours, for your yes or a rewrite:** Rikku, when Yuna is
  stopped: "Yunie's frozen! Remedy, now!"; Paine, when she is: "Can't move. Get me a Remedy."
- **Between 1 and 2** (lines 9 to 12) is a seam on Shiva's KO, before the Save Sphere card, on the
  O-3 B plate (the scene shows plate B while the camera stands on the `road-links` rig).
- **Between 2 and 3** (lines 14 to 16) cannot be a seam: the Sisters' link ends on whichever sister
  falls last, and no trigger can name her. The banter opens Anima's link instead, ahead of line 17,
  after the Save Sphere card; holds of 1.2 to 1.4 s keep the four lines inside the 8 s beat budget.
- **The first sister falls** and **the third Pain** are emitted by the Chapter XI AIs
  (`sisters-first-down`, `anima-third-pain`), the Trema precedent for moments only the AI can count.
- **Open:** the pre and post scenes play over plate A (the cutscene screen draws the chapter's own
  plate). The post scene is the Glen (research §2, the flower meadow); showing the approved Farplane
  plate there would need a per-scene backdrop, which the cutscene screen does not have.
