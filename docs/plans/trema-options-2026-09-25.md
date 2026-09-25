# Chapter XIII (Trema): options for Bailey's word, 2026-09-25 (measured)

**Game case: FFX-2 only.** Evidence on branch `chapter-trema-0925` (`D:/pyrefly-ch-trema`, c69cafeb):
research §12 (ea2664d2), `docs/plans/trema-bench.md` (fourth pass), an independent re-run. No boss
number changed. Every option below is **built and switched OFF**. With every switch off, the chapter
and every other chapter replay byte-identically (176 Chapter XIII hashes, Chapters 4, 5, 6, XI, FFX 1, 3).

## The short version

1. As you picked it (Normal Paragon, TR10, TR11 a), Chapter XIII wins 0/200. Normal Paragon is the wall.
2. Oversoul Paragon with Split_Infinity's kit is the only option that wins at all.
3. **No option reaches 1 win in 4 for a human.** The best measured row is 31/200 (15.5 %), and it
   rests on two of our estimates. At the default (harder) estimates the best is 13/200 (6.5 %).

## How to read the numbers

- "Bench" = perfect instant play, 200 seeds. "Human" = the live default, Wait split (0.5 s top list,
  1.0 s held). Human rows are 200 seeds where re-run, else 40.
- "Trema" = the story Trema with a fresh party. The chapter rate is always lower: the party arrives hurt.
- **Split's kit** = Split_Infinity's clear (Defense Bracers, Adamantite, Rabite's Feet, Valiant Lustre,
  Megalixirs, Stamina Tonic, Soul Spring, Three Stars). "+ Ribbon" adds the wiki's one Ribbon.

## The options

### 1. Oversoul Paragon, with Split's kit (TR7 to Oversoul, TR11 to Split's kit)

- **What changes:** link 1 becomes Oversoul Paragon. It waits to be hit, answers, never opens with
  Big Bang, and its physicals can miss. Trema stays the story Trema.
- **Sources:** stats and AI script, one source (SinirothX), checked line by line. Behaviour, three
  sources. Kit, three sources. **Estimates (labelled, harder reading by default):** physical hit
  rate 50 %, when it answers (`'immediate'`), the 4/10 and 1/10 HP thresholds (SinirothX).
- **Measured, Split's kit:** Paragon 22/200 bench, 34/200 human. Trema 30/200, 1/40.
  **Chapter 5/200 bench, 3/200 human (1.5 %).**
- **Measured, + Ribbon:** Paragon 34/200, 34/200. Trema 49/200, 4/40. Chapter 11/200, 3/200.
- **The estimates decide it (+ Ribbon rows).** Answer timing `'next-turn'` (SinirothX's literal words): Paragon 82/200,
  chapter 21/200 bench, 4/40 human. Thresholds at the observed 55 % / 20 %: chapter 11 falls to 1/200.
- **Else it changes:** nothing outside Chapter XIII.

### 2. Trema alone, Fiend Arena block (TR1 b)

- **What changes:** no Paragon. Trema at full HP with his arena block (Agility 95, Luck 128).
  The story beat of Trema killing Paragon is lost.
- **Sources:** block and full-HP start, 2 sources. AI weights, 1 source (text breaks off).
- **Measured:** 0/200 bench, 0/40 human, with every kit (NightMare185's too). 0/100 with 1.5 s or
  3 s of action time. Luck 128 makes Darkness miss. Worse than the story Trema, not better.
- **Else it changes:** nothing outside Chapter XIII.

### 3. Action time (E4), an estimate of how long an action takes

- **What changes:** after an action the actor's gauge waits N seconds before refilling.
- **Sources:** that actions take time, 2 sources. **The length N is unsourced**, an estimate in your name.
- **Measured on your picks (Normal Paragon):** 0/200 bench and 0/40 human at 1.5 s and at 3 s.
  Paragon still wins. It does help Trema: story Trema fresh 140/200 bench and 25/40 human at
  1.5 s, 88/100 and 34/40 at 3 s (against 30/200 and 1/40 off).
- **Stacked on option 1 (chapter, Split's kit):** 8/200 bench, 10/200 human at 1.5 s;
  15/200 bench, 13/200 human at 3 s.
- **Else it changes:** as built it covers the Cloister links only, so nothing else moves. Turned on
  for every FFX-2 chapter it moves them all, both ways: Chapter XI 30 to 81/100 bench at 1.5 s,
  Chapters 5 and 6 up or down by line. That wider switch would need its own review.

### 4. NightMare185's line-up against Normal Paragon (TR10 changes, TR7 stays Normal)

- **What changes:** three Dark Knights on Valiant Lustre, Oath Veil and Crystal Bangle, Megalixir
  every turn, plain Attacks.
- **Sources:** one source (FAQ 27609, Strategy 3, "tested in 10 battles" against Normal Paragon).
  **Kit gap:** the build carries 99 Mega-Potions (source says 55) and lacks his Remedies,
  X-Potions, Light Curtains and Stamina Tonics.
- **Measured:** 0/200 bench, 0/40 human on Paragon, Trema and the chapter. The party dies in 10 to
  60 s. The kit gaps would not change that.
- **Else it changes:** nothing outside Chapter XIII.

### 5. Keep Chapter XIII unlisted and ship Omnis, Isaaru and Gippal first

- Nothing new ships. Trema's art and engine wait. Each other chapter follows Yojimbo's path.

## Top three combinations (human, chapter, 200 seeds)

| Combination | Human | Bench | What rests on an estimate |
|---|---:|---:|---|
| 1 + Split's kit + action time 1.5 s + `'next-turn'` answers | 31/200 | 33/200 | action time length; answer timing |
| 1 + Split's kit + action time 3 s | 13/200 | 15/200 | action time length |
| 1 + Split's kit + Ribbon + action time 3 s | 12/200 | 9/200 | action time length; Ribbon is wiki advice |

All Oversoul rows also rest on the hit-rate and threshold estimates. No bench line yet plays
Split's own Oversoul opening (Star Curtain, all three attack at once), so option 1 is a floor.

## To ship, once you pick

Every option is built. What is left: flip the switch, then the chapter's ship stage (scene, content,
listing): about 2 to 3 hours, then the focused review and the deploy. Action time touches combat,
so it also owes a deep review after the deploy.

## Recommendation: option 1 with option 3 at 3 s, Split's kit

Nothing reaches 1 in 4. Plainly: at the default estimates the best faithful line wins about
**1 time in 15 for a human (13/200)**. Option 1 is the only sourced form of Paragon anyone clears
with this kit. The engine's current zero action time is known to be wrong, so a labelled 3 s is
closer to the game than none. If you also accept SinirothX's literal reading of when Oversoul
Paragon answers, the best row is **about 1 in 6 (31/200, at 1.5 s)**.

**Also found (not proposed):** Paragon's Normal Attack reads about 5.9 % low against the wiki.

## Replies you can send

- "Trema: 1 and 3 at 3 s" (the recommendation, about 1 in 15)
- "Trema: 1 and 3 at 1.5 s, next-turn" (the best measured row, about 1 in 6; two estimates)
- "Trema: 1" (Oversoul only, no action time, about 1 in 70)
- "Trema: 2" / "Trema: 4" (both measured 0 wins)
- "Trema: 5" (park it; Omnis, Isaaru, Gippal next)
