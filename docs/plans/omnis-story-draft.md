# DRAFT for Bailey — Chapter XII story beats: Seymour Omnis in the Garden of Pain (FFX only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, then results show, with no lines; see
`src/data/chapter-seymour-omnis.ts`). No file under `src/story` was written. This page is here so
you can pick, cut or rewrite lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX only** (AGENTS.md rule 14). FFX cutscene grammar (`research/writing-bible.md`
  §2.1). The FFX-2 register does not apply.
- **The events are canon; the wording is ours.** Beats come from `research/ffx-seymour-omnis.md`
  §8.2 (paraphrased there from Auronlu's FFX script, Chapter XV, and the wiki's Seymour pages).
  Every line below is `[ORIGINAL]`. No line quotes or reworks the game's script, and none reuses
  Seymour's iconic battle line (bible §1.9 keeps it out of cutscenes).
- **Your picks this draft follows** (2026-09-25, "I'll go with all your recommendations"):
  **B15** the mid-battle callouts are in; **B16 = a** one line of narration covers the dive into
  Sin, and the airship fight is not staged; **B3 = a** no Anima, so her line is not drafted (one
  is sketched at the end in case you ever add her); **B17 = c if O-5 lands, otherwise b**: Seymour
  speaks with a new Omnis portrait once one is painted, and with the approved Macalania portrait
  until then.
- **Must not repeat Chapter I.** Chapter I's post ends on Seymour saying Spira's sorrow is patient
  (`src/story/scripts/seymour-flux.ts`). His last words here say the same thing in other words (the
  two chapters rhyme, research §8.1); no line below repeats it. Chapter I's failed sending ("You
  can't send what refuses to go") is offered one callback with variation (bible §2.1), as the alternative for line 15 (see
  Alternatives).
- **Voices.** Seymour §1.9 (long, courteous, "Lady Yuna", "son of Jecht", death as mercy; correct
  about the diagnosis, monstrous about the cure). Tidus in scene §1.1 and as narrator §1.2. Yuna
  §1.3 (the one "Yes." beat is spent here). Auron §1.4. Wakka §1.5 (he tells her to send him, as
  the source has it). Lulu and Kimahri briefly.
- **Line limits.** No line is over 60 characters (§2.1 hard cap). The climax (the sending)
  follows the §2.1 rule: understate for 3 to 4 lines, one unguarded line, cut within two.
- **Proposed bible tag: E12 — SEYMOUR OMNIS (the Garden of Pain).** The Yojimbo, Natus and Fallen
  Aeons drafts propose E9, E10 and E11; E12 is the next free tag. Tonal tier: grim, like E1, so
  the light victory quips are suppressed (§5.4). The Trema, Isaaru and Gippal drafts written the
  same night may also reach for E12; whoever registers first keeps it.

---

## Pre-battle

**Interlude — over black, the dive (B16 = a, one line).**

| # | Speaker | Line |
|---:|---|---|
| 1 | Tidus (narr.) | "We flew into its mouth. The sea inside was red." |

**Beat 3 — the Garden of Pain. Live.**
`[BEAT: a long flight of steps. The party climbs. Four great discs stand at the top, still.]`
`[BEAT: laughter from above. Seymour hovers before the discs, and they begin to turn.]`

| # | Speaker | Line |
|---:|---|---|
| 2 | Seymour | "Welcome, Lady Yuna. Welcome into Sin." |
| 3 | Tidus | "You. Again. How are you even still here?" |
| 4 | Seymour | "Sin chose me. I am part of it now, and I am learning it." |
| 5 | Seymour | "You struck down Yunalesca. There is no Final Aeon now." |
| 6 | Seymour | "Nothing is left in Spira that can end Sin. Only me." |

`[BEAT: cut to Yuna. She does not answer.]`

| # | Speaker | Line |
|---:|---|---|
| 7 | Tidus | "We can. That's what we came here to do." |
| 8 | Seymour | "Then understand the price, son of Jecht." |
| 9 | Seymour | "Your death is your father's life. Come and pay it." |

`battleStart()` — opening line-up Tidus, Yuna, Auron (B2 = a), every switch legal from turn one.

---

## Mid-battle callouts (B15)

**Telegraphs and lessons** (battle-text register, bible §5.2; one line each, shown once). None
names a number or says which member a spell will hit (that mapping is our estimate, B12).

| Moment | Speaker | Line |
|---|---|---|
| Turn one, before his first four Firaga (the disc lesson) | Lulu *(if active)* / Auron | "The discs. Every one of them faces him with fire." |
| The first disc a member turns | Wakka *(if he turned it)* / Tidus | "It moved! Hit 'em, and they turn, ya?" |
| The first red glow | Auron | "He's gathering himself. Brace." |
| Before his first Dispel | Seymour | "Your little blessings. Let me take them from you." |
| Before each Ultima | Seymour | "Rest now. All of you, together." |
| The first reset after Ultima | Tidus | "They all changed colour. Start again!" |
| He falls below 20,000 HP | Seymour | "Pain is a gift, Lady Yuna. I give it back to you." |

Notes for the script track: the turn-one line is the only place the chapter teaches the disc read
in dialogue (the HUD strip, O-2 B, carries it from then on); it must fire before the first
volley resolves, not after. The first-turn line credits Wakka only if Wakka turned the disc: the
point is that the player found him. Seymour's two lines before Dispel and Ultima follow the
source, which has him speak before each (research §4.4, verified: 2 sources); the words are ours.

---

## Post-battle

**Beat 5 — the sending (the climax, the pay-off of four Seymour chapters).**
`[BEAT: the discs stop. Seymour sinks to his knees on the top step. He is fading.]`

| # | Speaker | Line |
|---:|---|---|
| 10 | Seymour | "So. This is how it ends for me." |
| 11 | Wakka | "Yuna. Send him. Now, while he can't fight it." |

`[BEAT: cut to Yuna. She looks at Seymour for a long moment.]`

| # | Speaker | Line |
|---:|---|---|
| 12 | Yuna | "Yes." |

`[BEAT: she raises her staff and begins the sending dance. Pyreflies lift from him.]`

| # | Speaker | Line |
|---:|---|---|
| 13 | Seymour | "You think this ends the sorrow? It will outlive me." |
| 14 | Seymour | "It outlives everyone, Lady Yuna. Even you." |

`[BEAT: he does not resist. He is gone. The dance ends. Silence (1.8 s).]`

| # | Speaker | Line |
|---:|---|---|
| 15 | Yuna | "...Goodbye, Seymour." |

`[BEAT: nobody speaks. Kimahri looks away from where he was.]`

| # | Speaker | Line |
|---:|---|---|
| 16 | Tidus | "Sin's next. My old man's waiting." |
| 17 | Auron | "Then don't keep him waiting." |

`results()` — then Chapter III (Braska's Final Aeon, Dream's End) is next in story order.

**Victory quips:** none. E12 is grim tier (§5.4 suppresses the light ones), and a quip after the
sending would step on it.

---

## Alternative lines (pick one or keep the first)

- **Line 12**, the climax. The draft spends Yuna's one "Yes." beat here (bible §2.1: a pause, one
  affirmative, nothing else). The alternative drops the word and lets the staff speak: she says
  nothing and begins the dance.
- **Line 15.** In Chapter I Yuna fails to send him and Seymour says she cannot send what refuses to
  go. The callback with variation would be Yuna: **"You didn't refuse this time."** It points back
  at Chapter I directly; it also says more than a bare goodbye. Pick one.
- **Line 1.** One line, as B16 = a says. If you want the interlude's usual shape (bible §1.2, two
  to five lines), a second line would be: "I kept thinking I heard him laughing."

## Not drafted

- **Anima's line** (B3 = a, she is not in the preset). If Anima is ever added, the source has
  Seymour say his mother opposes him too (research §4.5); ours would be Seymour: "Mother. You would
  stand against me, even here?"
- **The airship battle with Sin** (B16 = a, research O-15): separate fights, not staged.

## What to react to

1. **Lines 4 to 6** carry his reversal (he lost, so he claims Sin itself). Three lines, or cut one?
2. **Line 12**, "Yes." or silence (see Alternatives).
3. **Line 15**, the bare goodbye or the Chapter I callback.
4. **The turn-one lesson line.** It names the discs and fire outright. Too much hand-holding for
   the fight's puzzle, or the right amount alongside the HUD strip?
