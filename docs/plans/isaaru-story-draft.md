# DRAFT for Bailey — Chapter XIV story beats: Isaaru in the Via Purifico (FFX only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, then results show, with no lines; see
`src/data/chapter-isaaru.ts`). No file under `src/story` was written. This page is here so you can
pick, cut or rewrite lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX only** (AGENTS.md rule 14). FFX cutscene grammar (`research/writing-bible.md`
  §2.1). In FFX-2 Isaaru is a tour guide; nothing here carries over.
- **The events are canon; the wording is ours.** Beats come from `research/ffx-isaaru-bevelle.md`
  §8.2 (paraphrased there from Auronlu's FFX script, Chapter X, and the wiki's *Isaaru*, *Via
  Purifico* and *Bevelle* pages). Every line below is `[ORIGINAL]`. No line quotes or reworks the
  game's script. Isaaru's three battle cries are only hooks in the sources; the three here are
  written fresh.
- **Who gave the order: Maester Kinoc** (research I-9). Auronlu's script names Kinoc; the wiki's
  Personality section says Mika. The script wins; please do not "correct" it to Mika.
- **Your picks this draft follows** (2026-09-25, "I'll go with all your recommendations"):
  - **B14 = a**: Yuna has found Auron, Lulu and Kimahri by the end of the maze. They stand in the
    scene; only Yuna fights (`forced_party "y"`).
  - **B15 = a**: Tidus's past-tense narration, as Yuna later told it to him (the anthology's
    frame), over black; the chamber itself is staged live.
  - **B16 = a**: Chapter X's interlude 2 (Tidus's side of the prison, `natus-story-draft.md`
    lines 6-9) stays as drafted. This chapter tells the other half and contradicts nothing.
  - **B17**: the mid-battle callouts are in (entry cries on the link cards, a Hellfire warning,
    the count, the lock line, a last-aeon warning).
- **Voices.** Yuna §1.3 (complete sentences, formal-plain, apologises for her own needs), Auron
  §1.4 (fragments, withholds), Lulu §1.6 (cool, answers before Yuna can), Kimahri §1.7 (3 to 8
  words, third person, after the silence), Tidus narrator §1.2. **Isaaru is new:** courteous,
  devout, treats everyone as an equal, sure the temple's word binds even Braska's daughter
  (research §8.1). He is not a villain, so he never states the theme; he states his orders.
- **Line limits.** No line is over 60 characters (§2.1 hard cap). The climax (the refused healing,
  post-battle) follows the §2.1 climax rule: understate, one unguarded line, cut within two.
- **Proposed bible tag: E14 — ISAARU (the Via Purifico).** E10 and E11 are claimed (Natus, Fallen
  Aeons, and a clash on E10), and the parallel Omnis, Trema and Gippal drafts may claim E12, E13 and
  E15; E14 matches the chapter number and avoids them. Tonal tier: grim, so the light victory
  quips are suppressed (§5.4). The bible's §0.1 table and its E-tag clashes are not this draft's
  call.

---

## Pre-battle

**Interlude — over black (B15 = a).**

| # | Speaker | Line |
|---:|---|---|
| 1 | Tidus (narr.) | "Yuna told me about the maze later. Some of it." |
| 2 | Tidus (narr.) | "They split us up and dropped her in the dark alone." |
| 3 | Tidus (narr.) | "The walls were cold, she said. The light was red." |
| 4 | Tidus (narr.) | "I figured she'd been waiting for someone to find her." |
| 5 | Tidus (narr.) | "She wasn't. She was the one doing the finding." |

**Beat 4 — the end of the maze, live.**
`[BEAT: the red-lit hallway. Yuna walks first. Kimahri, Lulu and Auron behind her, in the order she found them.]`

| # | Speaker | Line |
|---:|---|---|
| 6 | Kimahri | "Red light. Kimahri does not like it." |
| 7 | Auron | "The way out is ahead. Keep walking." |

**Beat 5 — the final chamber.**
`[BEAT: a man in a dark coat stands at the far end, alone, between them and the way up. He bows first.]`

| # | Speaker | Line |
|---:|---|---|
| 8 | Isaaru | "Lady Yuna. I prayed it would be anyone but you." |
| 9 | Yuna | "Isaaru... You're here to stop us." |
| 10 | Isaaru | "Maester Kinoc sent me. The traitors may not leave." |
| 11 | Yuna | "You know what they say we did." |
| 12 | Isaaru | "I know what the temple says. For me, that is enough." |
| 13 | Isaaru | "Even for Lord Braska's daughter. I am sorry." |

`[BEAT: cut to Lulu, looking past him at the empty chamber.]`

| # | Speaker | Line |
|---:|---|---|
| 14 | Lulu | "Where are your brothers?" |
| 15 | Isaaru | "Far from here. This, I will do alone." |

`[BEAT: silence. Kimahri's grip tightens on his spear. Auron does not move.]`

| # | Speaker | Line |
|---:|---|---|
| 16 | Auron | "Summoner against summoner. We stand back." |
| 17 | Isaaru | "Forgive me, Lady Yuna." |

`[BEAT: Yuna does not answer. She raises her staff. So does he.]`

`battleStart()` — Yuna alone; the others watch from the edge of the chamber.

---

## Mid-battle callouts (B17)

**Link cards** (Isaaru calls each aeon as it enters; one line on the card, shown once).

| Link | Speaker | Line |
|---|---|---|
| 1 Grothia | Isaaru | "Grothia! Close the way!" |
| 2 Pterya | Isaaru | "Pterya. Rise, and hold her here." |
| 3 Spathi | Isaaru | "Spathi... let this be the last." |

**The lock line** (once per link, the first time Yuna opens Summon; the HUD greys the row "Mirror
of Grothia", Bailey's O-5 pick, and this is the one spoken line about it).

| Link | Speaker | Line |
|---|---|---|
| 1 | Yuna | "His Ifrit answers the same fayth. Mine won't come." |
| 2 | Yuna | "Valefor... You can't come to me while he holds you." |
| 3 | Yuna | "Not Bahamut. Not against himself." |

**Telegraphs** (battle-text register, bible §5.2; one party callout each, shown once).

| Moment | Speaker | Line |
|---|---|---|
| Link 1, the first aeon comes out and Grothia's gauge is full (Hellfire next) | Lulu | "Yuna. His aeon is ready. Guard first." |
| Link 3, Spathi's count reads 1 (Mega Flare next) | Kimahri | "One left. Then fire from the sky." |
| Only one aeon is left to summon | Lulu | "Yuna. That is the last one." |

Notes for the script track: none of the callouts names a number or a command beyond "guard" (the
HUD owns the count and the gauge, B20 = O-5 B). The Hellfire line fires when the first aeon takes
the field while Grothia's gauge is full, not when Hellfire lands. The watchers speak from the
edge; they never act.

---

## Post-battle

**Beat 7 — after Spathi falls.**
`[BEAT: Isaaru kneels. The last pyreflies thin out. Yuna goes to him, staff lowered, hands already glowing.]`

| # | Speaker | Line |
|---:|---|---|
| 18 | Isaaru | "No. Please. Keep that for the road ahead." |
| 19 | Yuna | "Isaaru..." |
| 20 | Lulu | "Yuna. We have to go." |
| 21 | Isaaru | "The way up is behind me. Go quickly." |

`[BEAT: Yuna bows to him, deep and slow, the prayer gesture. He returns it from his knees.]`

| # | Speaker | Line |
|---:|---|---|
| 22 | Auron | "Go home, summoner. Your road ends here." |

`[BEAT: Isaaru does not answer. They climb toward the light.]`

**Interlude — over the stairs (hand-off to the Highbridge, Chapter X).**

| # | Speaker | Line |
|---:|---|---|
| 23 | Tidus (narr.) | "The stairs came out on the bridge, in the wind." |
| 24 | Tidus (narr.) | "We were already there. I didn't ask what it cost her." |

`results()` — then Chapter X (Seymour Natus) is next in story order (D-058: numbers follow
registration; the story runs VIII, this chapter, then X).

**Victory quip.** Grim tier: the light and warm quips are suppressed. One line for Yuna, the only
one fighting: "...I'm sorry, Isaaru." (≤ 10 words, §5.4).

---

## What to react to

1. **Isaaru's voice (lines 8-17).** He apologises twice before summoning (13 and 17). The source
   has him ask forgiveness once; line 13 is our addition to show the courtesy. Keep both, or cut 13?
2. **Line 16**, Auron's "Summoner against summoner", is the only in-scene explanation of why
   nobody else fights. Keep, or let the silence carry it?
3. **Line 22**, Auron telling him his road ends here, is the sourced beat in our own words. Is
   "Go home, summoner" too warm for Auron (bible §1.4), or right?
4. **The entry cries** are written fresh as hooks. If you would rather Isaaru say nothing and the
   card show only the aeon's name, say so.
5. **The victory quip**: one quiet line from Yuna, or no quip at all?
