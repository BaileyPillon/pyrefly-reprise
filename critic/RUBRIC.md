# Pyrefly Reprise — Critic Rubric

The critic is adversarial. Its job is to find every way the build falls short of a faithful, fun, beautiful recreation of five FFX / FFX-2 encounters. It plays every chapter to the end (or to a loss), reads the data files against `research/`, and scores with evidence. **Gate: 9.60 / 10.** Anything below returns a ranked issue list.

## Scoring

Score each category 0–10 with one decimal. Weighted total = Σ(score × weight) / 100.

| Category | Weight | What 10 means |
|---|---:|---|
| **Combat fidelity** | 25 | CTB tick/rank/haste maths, damage and healing formulas, statuses (incl. Zombie semantics), Breaks, elements, Overdrive modes and gauges, every character's skills with the right MP/rank, items, party switching, aeons (summon/dismiss/overdrives), FFX-2 ATB gauge speeds, charge/recovery, Chain multipliers, dresspheres and spherechange, Garment Grid gates. A player who knows the games would not notice a rule that is wrong. |
| **Encounter fidelity** | 15 | Boss HP/stats/immunities, exact attack list and AI rotation (Lance of Atrophy → Full-Life; Hellbiter/Mega Death; Yu Pagodas; Mega Flare countdown; Terror of Zanarkand), form changes, counters, drops. The typical party build (stats, abilities, equipment, inventory) matches the researched average for that point. |
| **Fun and pacing** | 15 | Decisions matter, the classic strategies work, tension curves like the real fight, animations are snappy with skip options, minigames feel good, no waiting on the engine, difficulty matches the original (winnable with the intended tactics, losable if you ignore them). |
| **Character and visual fidelity** | 15 | Every party member, boss form, aeon and X-2 dressphere sprite is immediately recognisable (silhouette, palette, weapon), consistently styled, animated (idle/attack/cast/hurt/ko/victory), with portraits in the CTB list. Attack VFX match the ability. |
| **Scene fidelity and beauty** | 10 | Each diorama reads as its place (Gagazet snow trail, Zanarkand Dome hall, Dream's End, Bevelle Underground, Farplane) with FFX camera framing, lighting, particles, bloom/DoF. It looks like a 2026 HD-2D game, not programmer art. |
| **Writing and story** | 10 | Pre/mid/post-battle dialogue follows the canonical beats, sounds exactly like each character, includes banter, Tidus narration where appropriate, and lands the emotional moments (Yunalesca's truth, Jecht, Lenne). No verbatim script lifting beyond a few short iconic lines. |
| **UI fidelity and polish** | 5 | FFX window gradient/border/cursor, CTB list, party status window with Overdrive gauge, damage numbers, Sensor text, victory/results screen, X-2 ATB bars, chain popup, spherechange wheel, chapter select, party prep screens, controls hints, gamepad + keyboard + mouse. |
| **Stability and performance** | 5 | No console errors, 60 fps at 1600×900 on a mid GPU, no soft locks, loads in < 5 s, works from the GitHub Pages URL, save data survives reload. |

Hard caps (apply before weighting):
- Any chapter that cannot be finished (soft lock, crash, unwinnable with intended tactics) caps the total at **6.0**.
- Any placeholder sprite, missing boss form, or missing pre/post scene caps the total at **8.0**.
- Any ripped retail asset or verbatim script transcript caps the total at **5.0** (legal risk).

## Procedure

1. `npm run build && npx playwright test` must pass. Read `docs/DEV.md`.
2. Play each chapter via the debug API and screenshots: default build, intended tactics, then deliberately wrong tactics (ignore Zombie at Yunalesca, let Mega Flare land, ignore Yu Pagodas). Record turn logs.
3. Open the data files and compare at least 40 values per game against `research/*.md`.
4. Review 12+ screenshots per chapter (pre-scene, command menu open, an Overdrive, a boss attack, a form change, post-scene, results).
5. Read the story scripts against `research/writing-bible.md` beat sheets.
6. Produce `critic/rounds/round-NN.md`: category scores with evidence, weighted total, caps applied, and a **ranked issue list** (severity, category, exact repro, file/line, suggested fix).

## The loop (owner's rule, restated 2026-09-18)

- The gate is a weighted total of **9.6**. Below it, the critic returns a **detailed ranked issue list** (severity, category, exact repro, file/line, suggested fix) and the build is revised and refined against that list, then the critic runs again. The loop repeats until the gate is met.
- The critic never fixes anything itself and never softens a score because a fix is planned.
- Every round is written to `critic/rounds/round-NN.md` (+ `.json`) and the top of the list is reported to the owner with the score.

## New ideas (need the owner's approval first)

The critic may also propose **new ideas for addictive gameplay elements** (progression hooks, challenge modes, rankings, unlocks, quality-of-life that makes another run tempting). These go in a separate **Proposals** section of the round report, each with the player benefit, the cost, and the risk to fidelity. **Nothing from that section is built until Bailey approves it**; proposals never count for or against the score.

## Audio

No agent can hear. The critic checks audio only technically (files present and playing, loudness, no errors); whether the music and effects are beautiful is judged by the owner from the audition files.
