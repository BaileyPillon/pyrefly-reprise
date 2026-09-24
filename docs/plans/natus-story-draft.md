# DRAFT for Bailey — Chapter X story beats: Seymour Natus on the Highbridge (FFX only)

**Status: a draft to read and react to. Nothing here is built.** The chapter runs today on a
placeholder story layer (the battle opens, then results show, with no lines; see
`src/data/chapter-seymour-natus.ts`). No file under `src/story` was written. This page is here so
you can pick, cut or rewrite lines before anyone scripts them (AGENTS.md hard rules 9 and 10).

- **Game case: FFX only** (AGENTS.md rule 14). FFX cutscene grammar (`research/writing-bible.md`
  §2.1). The FFX-2 register does not apply.
- **The events are canon; the wording is ours.** Beats come from
  `research/ffx-seymour-natus-highbridge.md` §8.2 (paraphrased there from Auronlu's FFX script,
  Chapter X, and the wiki's Bevelle, Via Purifico and Wedding pages). Every line below is
  `[ORIGINAL]`. No line quotes or reworks the game's script, and none reuses Seymour's iconic
  battle line (bible §1.9 keeps it out of cutscenes anyway).
- **Your picks this draft follows** (2026-09-24, "I'll go with your recommendations for all"):
  **B9** the mid-battle callouts are in; **B11 = a** Tidus's past-tense narration covers the
  wedding, the leap, the trial and the Via Purifico, and only the Highbridge is staged live; **B12
  = b** Seymour speaks with the approved Macalania portrait until he transforms, then with the
  Natus portrait (O-5 A) once it is painted; **B14 = no** the Isaaru duel and Evrae Altana are
  told, not staged.
- **Voices.** Seymour §1.9 (long, courteous, "Lady Yuna", death as mercy; correct about the
  diagnosis, monstrous about the cure). Kimahri §1.7 (3 to 8 words, third person, after the
  silence). Tidus narrator §1.2 (past tense, one sensory detail, one admission). Tidus in scene
  §1.1, Yuna §1.3, Auron §1.4, Rikku §1.8 (the one light line), Wakka and Lulu briefly.
- **Line limits.** No line is over 60 characters (§2.1 hard cap). The climax (the turn-back)
  follows the §2.1 rule: understate for 3 to 4 lines, one unguarded line, cut within two.
- **Proposed bible tag: E10 — SEYMOUR NATUS (the Highbridge of Bevelle).** E8 is already used
  three times (Macalania, Evrae and Leblanc each claim it in their script headers) and the
  Yojimbo draft proposes E9; E10 is the next free tag. Tonal tier: grim, like E1, so the light
  victory quips are suppressed (§5.4). **The bible's §0.1 table still needs the E8 clash
  resolved; that is not this draft's call.**

---

## Pre-battle

**Interlude 1 — over black, where Chapter VIII's bells stop (B11 = a).**

| # | Speaker | Line |
|---:|---|---|
| 1 | Tidus (narr.) | "The bells were still going when we reached the steps." |
| 2 | Tidus (narr.) | "They had rifles on us. She put her staff down." |
| 3 | Tidus (narr.) | "He kissed her. Then he told them to shoot us." |
| 4 | Tidus (narr.) | "She stepped off the edge, and Valefor caught her." |
| 5 | Tidus (narr.) | "I thought that was the end of it. It wasn't close." |

**Interlude 2 — over the prison water (the trial and the Via Purifico, told).**

| # | Speaker | Line |
|---:|---|---|
| 6 | Tidus (narr.) | "They tried us in a room full of the dead." |
| 7 | Tidus (narr.) | "Then they dropped us in the dark to get rid of us." |
| 8 | Tidus (narr.) | "The water tasted like rust. We swam out anyway." |
| 9 | Tidus (narr.) | "We found each other at the bridge. All of us." |

**Beat 7 — the Highbridge, north end, before the Main Gate. Live.**
`[BEAT: the two groups meet. Rikku runs the last few steps.]`

| # | Speaker | Line |
|---:|---|---|
| 10 | Rikku | "Yunie! You're okay! You're okay, right?" |
| 11 | Yuna | "I'm all right. I'm sorry I made you worry." |
| 12 | Wakka | "Nobody's okay. But everybody's here, ya?" |

`[BEAT: footsteps from the gate. Seymour, unhurried, attendants behind him. He carries something.]`
`[BEAT: he lets it fall. It is Maester Kinoc. Nobody moves.]`

| # | Speaker | Line |
|---:|---|---|
| 13 | Auron | "Kinoc." |
| 14 | Seymour | "He was afraid, so I gave him rest. It was a kindness." |
| 15 | Seymour | "Spira only knows how to hurt, Lady Yuna." |
| 16 | Seymour | "Come to Zanarkand with me. I will end all of it." |
| 17 | Tidus | "End it how? By becoming the thing that eats it?" |
| 18 | Seymour | "By becoming the only mercy Spira has left." |

**Beat 8 — Kimahri's stand.**
`[BEAT: silence. Kimahri steps forward alone and plants his spear.]`

| # | Speaker | Line |
|---:|---|---|
| 19 | Kimahri | "Yuna goes. Kimahri stays." |

`[BEAT: Seymour turns on his own attendants. Their pyreflies, and Kinoc's, pour into him.]`
`[BEAT: what stands up is no longer shaped like a man. Portrait switches here (B12 = b).]`

**Beat 9 — the retreat that turns round (the climax).**

| # | Speaker | Line |
|---:|---|---|
| 20 | Auron | "Go. Now." |
| 21 | Lulu | "Yuna. Come." |

`[BEAT: they run. Yuna slows, then stops. The others stop because she did.]`

| # | Speaker | Line |
|---:|---|---|
| 22 | Yuna | "He is my guardian." |
| 23 | Tidus | "Then so are we. All of us." |

`[BEAT: they turn back together. Lulu looks at Auron; he almost smiles.]`

| # | Speaker | Line |
|---:|---|---|
| 24 | Auron | "Hmph." |

`battleStart()` — opening line-up Tidus, Yuna, Kimahri (B2 = a): the three who went back first.

---

## Mid-battle callouts (B9)

**The three Talk exchanges** (the Trigger Command; each fires once and grants the sourced bonus).

| Trigger | Speaker | Line |
|---|---|---|
| Tidus talks (+10 Strength) | Tidus | "Stop talking. You never say anything." |
| | Seymour | "Then listen, son of Jecht. It is almost over." |
| Auron talks (+10 Strength) | Auron | "Kinoc was my friend once. Fool that he was." |
| | Seymour | "He thanked me, at the end. Ask him yourself." |
| Yuna talks (+10 Magic Defense) | Yuna | "You belong on the Farplane. I'll send you there." |
| | Seymour | "Then you will have to catch me, Lady Yuna." |

**Telegraphs** (battle-text register, bible §5.2; one line each, shown once).

| Moment | Speaker | Line |
|---|---|---|
| The Protect counter as he drops below 24,000 | Seymour | "Is that all the pain you have? I have more." |
| The first Break lands | Kimahri *(if active)* / Auron | "Stone. Get it off before the claw." |
| The first shatter | Tidus | "No! ...It's gone. They're gone." *(names the lost member in the build)* |
| Natus Banishes an aeon | Seymour | "Rest. You have served your summoner enough." |
| The third Haste lands on the party | Lulu *(if active)* / Auron | "Too quick. The body is watching." |

Notes for the script track: the Break line is the one place the chapter teaches the Soft / Esuna
answer in dialogue; the Haste line is the only warning before Desperado, and it must fire when the
third Haste lands, not when Desperado does. Neither names a number (the HUD reads O-4 B own the
numbers).

---

## Post-battle

**Interlude 3 — the Macalania Woods campsite, night (beat 10).**

| # | Speaker | Line |
|---:|---|---|
| 25 | Tidus (narr.) | "We made camp under the trees, far from the city." |
| 26 | Tidus (narr.) | "Nobody said much. The fire kept going out." |
| 27 | Tidus (narr.) | "Yuna prayed like always. I don't think it helped." |
| 28 | Tidus (narr.) | "Bevelle was shut to us after that." |
| 29 | Tidus (narr.) | "So we went the only way left. The Calm Lands." |

`results()` — then Chapter IX (Yojimbo) is next in story order (D-058: numbers follow
registration; the story runs Natus, then Yojimbo).

---

## What to react to

1. **The two interludes (lines 1-9)** cover the wedding to the Via Purifico in nine lines. Too
   much, too little, or the right amount?
2. **Line 22**, Yuna stopping for Kimahri, carries the climax. The alternative is Tidus saying it
   and Yuna answering "Yes." (bible §2.1; used at most once per encounter). Which?
3. **Auron's Talk line** puts a word on his old friendship with Kinoc; the source says the
   exchange is about that friendship, not what either said. Keep, soften, or cut?
4. **The shatter line** reads the lost member's name from the build. If you would rather it stay
   silent (a beat, no words), say so.
