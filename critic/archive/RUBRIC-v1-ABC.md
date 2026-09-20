> **ARCHIVED 2026-09-20. Rubric v1 (Parts A, B and C), kept so rounds 02 and 03 stay readable.** It was replaced by policy v2 in `critic/RUBRIC.md` on Bailey's approval. Scores made under this rubric are history: they are never compared with, or shown as, a v2 score.

# Pyrefly Reprise — Critic Rubric

The critic is adversarial. Its job is to find every way the build falls short of a faithful, fun, beautiful recreation of five FFX / FFX-2 encounters. It plays every chapter to the end (or to a loss), reads the data files against `research/`, and scores with evidence. **Gate: 9.60 / 10.** Anything below returns a ranked issue list.

## Scoring

Score each category 0–10 with one decimal. Weighted total = Σ(score × weight) / 100.

| Category | Weight | What 10 means |
|---|---:|---|
| **Combat fidelity** | 25 | CTB tick/rank/haste maths, damage and healing formulas, statuses (incl. Zombie semantics), Breaks, elements, Overdrive modes and gauges, every character's skills with the right MP/rank, items, party switching, aeons (summon/dismiss/overdrives), FFX-2 ATB gauge speeds, charge/recovery, Chain multipliers, dresspheres and spherechange, Garment Grid gates. A player who knows the games would not notice a rule that is wrong. |
| **Encounter fidelity** | 15 | Boss HP/stats/immunities, exact attack list and AI rotation (Lance of Atrophy → Full-Life; Hellbiter/Mega Death; Yu Pagodas; Mega Flare countdown; Terror of Zanarkand), form changes, counters, drops. The typical party build (stats, abilities, equipment, inventory) matches the researched average for that point. |
| **Fun and pacing** | 15 | Decisions matter, the classic strategies work, tension curves like the real fight, animations are snappy with skip options, minigames feel good, no waiting on the engine, difficulty matches the original (winnable with the intended tactics, losable if you ignore them). |
| **Character and visual fidelity** | 15 | Every party member, boss form, aeon and X-2 dressphere painting is immediately recognisable (silhouette, palette, weapon), consistently styled, animated (idle/attack/cast/hurt/ko/victory), with portraits in the CTB list. Attack VFX match the ability. |
| **Scene fidelity and beauty** | 10 | Each diorama reads as its place (Gagazet snow trail, Zanarkand Dome hall, Dream's End, Bevelle Underground, Farplane) with FFX camera framing, lighting, particles, bloom/DoF. It looks like a 2026 painted 2.5D game (the owner rejected the pixel-art HD-2D look and approved the painted direction), not programmer art. |
| **Writing and story** | 10 | Pre/mid/post-battle dialogue follows the canonical beats, sounds exactly like each character, includes banter, Tidus narration where appropriate, and lands the emotional moments (Yunalesca's truth, Jecht, Lenne). No verbatim script lifting beyond a few short iconic lines. |
| **UI fidelity and polish** | 5 | The owner-chosen "Ink & Gold" presentation applied consistently (docs/handoff/presentation-ink-and-gold.md) while keeping FFX's information design: CTB list, party status window with Overdrive gauge, damage numbers, Sensor text, victory/results screen, X-2 ATB bars, chain popup, spherechange wheel, chapter select, party prep screens, controls hints, gamepad + keyboard + mouse. |
| **Stability and performance** | 5 | No console errors, 60 fps at 1600×900 on a mid GPU, no soft locks, loads in < 5 s, works from the GitHub Pages URL, save data survives reload. |

Hard caps (apply before weighting):
- Any chapter that cannot be finished (soft lock, crash, unwinnable with intended tactics) caps the total at **6.0**.
- Any placeholder sprite, missing boss form, or missing pre/post scene caps the total at **8.0**.
- Any ripped retail asset or verbatim script transcript caps the total at **5.0** (legal risk).

## Part B: game design coverage (added 2026-09-18 at the owner's request; Part A above is unchanged)

The eight criteria above are **Part A: fidelity and craft**. They stay exactly as written, with their weights. The owner also wants the critic to cover **all aspects of game design**, so every round scores a second part the same way (0-10, one decimal, weighted total out of 10):

| Category | Weight | What 10 means |
|---|---:|---|
| **Audio and music** | 15 | The score and the effects are beautiful and carry the soul of FFX and Clair Obscur: memorable original themes that return transformed, real-sounding instruments in one hall, effects that belong to the same world, mixing that never fatigues, music that follows the fight (phases, victory, defeat). **Beauty is scored by the owner** from the audition page and from play; the critic scores only the technical side (files present and playing, loudness, loop seams, ducking, no errors, every cue follows `docs/audio/THEMES.md`) and may not award more than 6 until the owner has scored the build's audio. |
| **Game feel and feedback** | 12 | Every input answers instantly; hits, heals, KOs, Overdrives and boss attacks have weight through animation timing, camera, screen and sound working together; nothing feels floaty, laggy or silent; waiting is never dead time. |
| **Clarity and information design** | 12 | At a glance the player knows whose turn it is, who is targeted (allies and enemies, single and all), what every enemy is and where it is, what just happened and why, what is about to happen, and what each command will do before committing. No panel ever shows wrong, stale or internal information; nothing important is hidden, clipped, overlapped or too small at any common window shape. |
| **Onboarding and teachability** | 10 | A friend who never played FFX can open the link cold, understand what the game is, act within a minute, learn CTB, Overdrives, aeons, dresspheres and the Garment Grid through play, and understand why they won or lost. Help is there when wanted and out of the way when not. |
| **Accessibility and options** | 8 | Remappable controls, readable text at every size with a scale option, cues that never rely on colour alone, reduced-motion and flash safety, separate music / effects / voice volumes, pause anywhere, optional assists that never alter canon for players who decline them. |
| **Controls and platforms** | 8 | Keyboard, mouse, gamepad and touch are all first-class with correct prompts; works in current Chrome, Edge, Firefox and Safari, on a phone, and from 4:3 through 21:9 up to 4K; fast first load on the live URL; sensible behaviour when a tab loses focus or audio is blocked. |
| **Difficulty and balance** | 8 | Each chapter's curve matches the original fight's tension; losses feel fair and teach something; no dominant degenerate tactic that canon did not have; any optional modifiers are clearly separated from the faithful default. |
| **Replayability, retention and sharing** | 10 | There are real reasons to come back and to send the link to a friend: results worth improving, variety between runs, goals beyond the first clear, sessions that fit a short break, progress that persists, a link that previews well and needs no setup. |
| **Progression, preparation and rewards** | 7 | Party prep gives meaningful, canon-plausible agency (Sphere Grid, equipment, dresspheres, Garment Grids, items) with clear consequences in the fight; results and rewards mean something; nothing is busywork. |
| **Narrative presentation and direction** | 5 | Scenes are staged, paced and scored like cinema: camera, portraits, text rhythm, music entrances and silence make the emotional beats land; skipping and replaying scenes is painless. (The words themselves are judged in Part A.) |
| **Cohesion and identity** | 5 | Art, UI, audio, writing and motion feel like one authored game from the title screen to the credits; transitions, loading, empty and error states are designed, not default; nothing looks like a debug tool. |

Part B caps (apply before weighting): any panel that gives the player **wrong information** (for example an advisor naming a move the acting character cannot use) caps Part B at **8.0**; audio the owner has rejected caps **Audio and music** at **5.0** until the owner scores it higher.

## Part C: fidelity to the approved end state (added 2026-09-18 at the owner's request; Parts A and B above are unchanged)

The owner's rule (AGENTS.md hard rule 9): nothing the player will see, hear or feel is built until Bailey has picked its end state from options, because blind iteration ends in something they do not want. The picks live in `docs/target/targets.json` (the end-state board, rendered by `node tools/end-state-board.mjs`). Part C asks one question before any other: **how far is this build from what Bailey approved?** The critic's own taste does not enter into it; Parts A and B are where the critic has opinions.

Every round scores it the same way (0-10, one decimal, weighted total out of 10). Score **only** tiles whose state is `approved`. For each one, capture the moment its `build` field describes at 1600×900 and at the owner's 2000×1012, put target and build side by side (`node tools/end-state-board.mjs --pair <target> <capture> --out critic/rounds/round-NN/part-c/<tile>.jpg`), and judge what a player would notice: layout and composition, type and colour, the information shown, the art itself, and anything added that the target does not show. A 10 means Bailey could not tell which one is the mockup.

| Category (board group) | Weight | What 10 means |
|---|---:|---|
| **Presentation** (`presentation`) | 30 | Title, chapter select, party prep, dialogue, battle start, both battle HUDs, turn cut-in, Overdrive overlay and results each match their approved Ink & Gold mockup: same layout, same type, same accent (gold in FFX, pink in FFX-2), same information, nothing added. |
| **Scenes** (`scenes`) | 15 | Every approved painting ships unaltered (the shipped file's sha256 equals the one recorded on its tile; approved paintings are never regenerated) and the game frames it the way the approved picture does. |
| **Cast, bosses and aeons** (`cast`) | 15 | Every approved character painting ships unaltered, and its other poses keep the approved costume, palette and face. |
| **How a fight plays** (`fight`) | 15 | Targeting, the move advisor, the enemy next-move panel and any other approved battle overlay match their approved mockups in real play, at the sizes the owner plays at. |
| **Music and sound** (`audio`) | 10 | The owner's own latest recorded score for the shipped audio. No agent can hear; with no verdict on record this category is not scored. |
| **Pause screen** (`pause`) | 5 | The pause screen matches its approved target at every common window shape, panels shown and hidden. |
| **Phone layout** (`phone`) | 5 | Every screen matches its approved phone layout at 390×844. |
| **Whole game and polish** (`whole`, `polish`) | 5 | Approved key art, approved polish ideas and any approved whole-game view are matched by what ships. |

Rules:

- **A category with no approved tile is not scored**, and its weight is left out: the Part C total is taken over the scored weights only. The report lists it under "Waiting on the owner" so Bailey can see what still needs their verdict. The critic never substitutes its own idea of the end state, and never scores a `verdict`, `gap` or `rejected` tile.
- **Coverage is reported beside the score**: tiles approved / awaiting a verdict / with no target / rejected, and the name of every tile still at `verdict` or `gap`.
- **Only Bailey's own words make a tile `approved`.** An agent judge passing a painting ("approved idle" in the art notes) is not an approval.
- Part C caps (apply before weighting): a new player-facing feature, screen or restyle **started after 2026-09-18 with no approved target** caps Part C at **8.0** (work already in flight on that date, and fixes to defects the owner reported, do not count); shipping a **rejected** option, or an approved painting replaced by a different one (the Zanarkand grey-hall incident), caps Part C at **5.0**.
- Every difference becomes an issue on the one ranked list like any other (severity, exact repro, file/line, suggested fix), with the side-by-side picture as evidence.

## The gate

The gate is met only when **all three** weighted totals reach **9.6**: Part A (fidelity and craft), Part B (game design) and Part C (fidelity to the approved end state), **and** Part C's coverage is complete (no tile on the end-state board is still at `verdict` or `gap`): a game is not finished while part of it was never approved. The round report gives all three totals, the lowest as the headline, Part C's coverage, and one ranked issue list across all parts (most damaging to the headline first). Proposals for expansions and novel ideas stay separate and unscored.

## Procedure

1. `npm run build && npx playwright test` must pass. Read `docs/DEV.md`.
2. Play each chapter via the debug API and screenshots: default build, intended tactics, then deliberately wrong tactics (ignore Zombie at Yunalesca, let Mega Flare land, ignore Yu Pagodas). Record turn logs.
3. Open the data files and compare at least 40 values per game against `research/*.md`.
4. Review 12+ screenshots per chapter (pre-scene, command menu open, an Overdrive, a boss attack, a form change, post-scene, results).
5. Read the story scripts against `research/writing-bible.md` beat sheets.
5a. Part B: play as a first-time player with real input only; test keyboard, mouse, gamepad emulation and a phone viewport; open every options and help surface; measure input-to-response and first-load times; review window shapes from 4:3 to 21:9 and 4K; run the technical audio checks and read the owner's latest audio score.
5b. Part C: read `docs/target/targets.json`; for every `approved` tile capture the matching moment, make the side-by-side with `--pair`, and score from the composites (read one composite per tile, not the two full-size pictures); hash-check every tile that records a `sha256`; count coverage and name the tiles waiting on the owner.
6. Produce `critic/rounds/round-NN.md`: category scores with evidence, weighted totals, caps applied, Part C's coverage with its "Waiting on the owner" list, and a **ranked issue list** (severity, category, exact repro, file/line, suggested fix).

## The loop (owner's rule, restated 2026-09-18)

- The gate is a weighted total of **9.6**. Below it, the critic returns a **detailed ranked issue list** (severity, category, exact repro, file/line, suggested fix) and the build is revised and refined against that list, then the critic runs again. The loop repeats until the gate is met.
- **MANDATORY, NO EXCEPTIONS (owner, 2026-09-18): the critic evaluates EVERY build that is pushed live.** A release is not finished until a full critic round has run against the live URL for that exact build (main commit and bundle hash recorded in the round report). `tools/deploy-pages.mjs` leaves a marker in `critic/pending/` for every deployed build; only the chief critic's report for that build clears it.
- The critic never fixes anything itself and never softens a score because a fix is planned.
- Every round is written to `critic/rounds/round-NN.md` (+ `.json`) and the top of the list is reported to the owner with the score.

## When the critic runs (standing rules, adopted by the owner 2026-09-18)

0. **After every build pushed live: a full round. Mandatory, no exceptions.**
1. **Before each deploy: a short gate** on the production preview (changed areas, stability, a player's-eye screenshot review). Any blocker stops the release. Where a changed area has an approved target in `docs/target/targets.json`, the gate puts the build beside it.
2. **Whenever the owner reports a defect: a retrospective.** Why did the critic miss it? The answer becomes a check in `critic/CHECKS.md` (every auditor and the gate run the checks for their area) and, where possible, an automated test.
3. **When an art batch lands: a visuals-only pass inside the running game**, never on a contact sheet alone.
4. **Before building any sizeable feature or approved proposal: a paper critique** of the plan or mockup; build after a go. Its first question is whether Bailey has approved an end state for it; if not, the answer is no-go until options have been shown and one is picked.
5. **After audio renders: a technical and thematic check** (loudness, loop seams, each cue uses its assigned themes). Beauty is the owner's call.
6. **A first-time-player pass every few rounds** (someone who never played FFX grades onboarding and clarity).
7. **A weekly round on the live site when idle**, once the score is near the gate, to track the trend and catch hosting or browser drift.
8. **After any crash recovery: a quick integrity pass** (repo, live build, every shipped asset decodes, model hashes).

The critic's browsers never run while a release build or sweep is running on this machine.

## Expansions and novel ideas (need the owner's approval first)

Beyond the ranked issue list, the critic may **suggest and recommend expansions or novel ideas that would improve the game from any aspect of game design**: gameplay systems and addictive loops (progression, challenge modes, rankings, unlocks, replay hooks), new encounters or chapters, characters, aeons and dresspheres, difficulty and accessibility, onboarding and tutorials, narrative and presentation, art direction, animation and VFX, UI and UX, audio direction, controls, performance, social and sharing features, and anything else a good designer would raise. These go in a separate **Proposals** section of the round report, each with a short pitch, the player benefit, the rough cost, and the risk to fidelity, ranked by value for cost. **Nothing from that section is built until Bailey approves it**, and proposals never count for or against the score.

## Audio

No agent can hear. The critic checks audio only technically (files present and playing, loudness, no errors); whether the music and effects are beautiful is judged by the owner from the audition files.
