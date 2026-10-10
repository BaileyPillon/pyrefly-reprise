# FINAL FANTASY X-2 — the Experiment: the machine, its three levels, and which fight is the chapter

**Target project:** Echoes of Spira (internal name pyrefly): TypeScript + Vite + Three.js, painted 2.5D, FFX-2 ATB engine in `src/battle/ffx2`
**Request:** Bailey, 2026-10-10 ~00:10 EDT: "If I were to add in 2 chapters what would they be?" The driver recommended FFX's Sinspawn Gui and FFX-2's Experiment, the latter with the line "you choose the machine's upgrades before battle, which works as a difficulty dial and a reason to come back for another try". Bailey: "I'll add in those 2 chapter recommendations". This file is the Experiment half. **Research and options only; nothing is built or wired** (AGENTS.md hard rules 9 and 10).
**Research date:** 2026-10-10
**Game case (AGENTS.md rule 14):** **FFX-2 only.** The Experiment, the Machine Faction, the Bikanel dig, dresspheres, Blue Bullets and the ATB are FFX-2 facts. Nothing here applies to an FFX chapter. (Shared plumbing a concept might need, such as an editable prep tab, is "both" and is named as such in `concepts.md`.)
**Companions:** `concepts.md` (four written end-state concepts and a recommendation), `art-brief.md` (what the pictures would be, with prompt-ready drafts).
**Recommendation (section 1.3):** the **two-act "Rematch"**, the game's own required pair of fights: the machine at Attack 1, Defense 1, Special 1, then rebuilt and out of control at 5, 5, 5. It is faithful, it needs no new prep screen, and it keeps "one more try" inside the fight. **The premise in the request needs correcting first (section 0, C-1 and C-2): the game has no pre-battle upgrade menu.**

---

## 0. Corrections to the brief

These change what the chapter is. Each is sourced in the sections below.

| # | The brief assumed | What the sources say | Sources |
|---|---|---|---|
| C-1 | The player **chooses the machine's upgrades before the battle** | There is no upgrade menu. The machine's levels come from the **Assembly pieces the player dug up in the Bikanel Desert** (a 60-second excavation mini-game, any time in Chapter 5). The type of each find (Attack, Defense or Special) and its grade (A, S or Z) are **random**; only the area dug in tilts the odds. Before the fight the Al Bhed technician **reads out the three levels** and offers two answers: take it on, or walk away. What the player really decides is when to fight, and whether to hand over a repair manual for a rematch. | Jegged (Djose and Bikanel pages), wiki *Experiment*, *Excavation minigame*, GameFAQs HD guides 81757 and 82362, StrategyWiki `[verified: 5 sources]`; the readout and the fight-or-walk prompt were also seen in a wiki screenshot |
| C-2 | A **difficulty dial** | Not one dial but **three independent ones**, each Level 1 to 5: **Attack** sets Strength and Magic, **Defense** sets Defense and Magic Defense, **Special** sets which actions it uses (its whole script). HP (18,324), Agility (68) and level (50) never change. Any mix is a real state (for example 1/1/5 or 5/1/1), so there are 125. | SinirothX (the two stat tables and the Special script), Jegged, wiki, KeyBlade999 `[verified: 4 sources]`; "HP never changes" is stated by KeyBlade999 / GamerGuides |
| C-3 | A **reason to come back** | It is built into the game's structure: **Episode Complete for Djose needs two wins**, one with the machine below its maximum and one at 5/5/5. It can be fought **up to six times** (the first fight plus five repair manuals); when the manuals run out it cannot be fought again until New Game+ (wiki), and Jegged adds that once the Episode is complete it is not fought again. | wiki *Episode Complete*, *Djose Temple*, *Experiment*; Jegged (both pages); GameFAQs HD guide 81757; Steam thread `[verified: 5 sources]` |
| C-4 | A **walking** weapon | No source says it walks. It is a bulky machina that **stands**: a squat armoured body on a wide footed base, with arms and, at high levels, rocket pods. The scan text calls it a prototype built to take on Vegnagun, assembled by the Machine Faction from parts dug up in the desert. | SinirothX scan; wiki; wiki screenshots seen in a browser pane (sections 6 and 7, and `art-brief.md`) |
| C-5 | "The Machine Faction's **grounds**" | The setting is **Djose Temple**, the Faction's headquarters. The fight is in the **Fayth Antechamber**, the room before the Chamber of the Fayth (GameFAQs HD guide 82362). SinirothX labels the formations "Djose Temple - Trial". The Chamber itself is Chapter XVI's Ixion arena, so this is a neighbouring room, not the same one. | GameFAQs HD guides 81757 and 82362; SinirothX formation table; wiki *Djose Temple* `[verified: 3 sources, one labelling difference]` |
| C-6 | A **multi-part** enemy, maybe | One targetable body. SinirothX's formation table lists **up to eight extra "Experiment" objects with 1 HP** next to it, and the monster list gives the name nine ids. They look like the rocket pods and similar props, not targets (section 3.4). | SinirothX (4d "Dummied/Battle Objects" section, monster list, formations 225 to 229) `[derived]` |
| C-7 | A **chapter-level story fight** | An **optional mission** ("Masterpiece Theatre") in Chapter 5, not needed to finish the game. It is a comic, low-stakes mission in FFX-2's buoyant register, with one sincere beat for Paine at the end. | wiki *Djose Temple* (mission box), Jegged, GameFAQs HD guide 82362 `[verified: 3 sources]` |

---

## 0.1 Provenance, method, and how to read this document

### Confidence tags

Same tags as `research/ffx2-gippal-den-of-woe.md` section 0.1.

| Tag | Meaning |
|---|---|
| `[SinirothX]` | SinirothX, *Enemy Encyclopedia* (GameFAQs FAQ 31807, v1.3, PS2 International + Last Mission): a stat, attack and AI dump extracted from the game data. Ranked first for FFX-2 in this repo (`research/ffx2-combat-core.md`, "Treat as decompile-grade; prefer over all others on conflict"). |
| `[verified: N sources]` | N independent sources agree. The Fandom wiki counts once however many of its pages say it. **GamerGuides' Djose page is the same text as KeyBlade999's FAQ with light edits, so the two count once.** |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed or inferred by me from sourced constants; the working is shown. |
| `[estimate]` | My own judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in section 11 with what to do. |
| `[RE note]` | Taken from this repo's own reverse-engineering notes in `research/re-ffx2-*.md` (the Steam HD build read by the project's lane). |

### What I did

1. Read the project's rules and format models: `AGENTS.md`, `docs/PRODUCT-BRIEF.md` (from the main tree; the release tree has no copy), `docs/ARCHITECTURE.md`, `src/data/encounters.ts`, `research/writing-bible.md` (sections 1.14 to 1.20, 2.2), `research/ffx2-gippal-den-of-woe.md` (the format model), `research/jegged-encounter-guides-ffx2.md`, `research/re-ffx2-ai-leblanc-den-ixion.md` (the format of the reverse-engineering notes), `DECISIONS.md` (E-023, D-005, D-410), and the engine and prep screens named in section 10. The release tree is `D:/pyrefly-r39-int` (branch `re-parity-rc1`).
2. Read the **Final Fantasy Wiki** through `api.php?action=parse&prop=wikitext` with a browser user agent (plain pages return HTTP 402 to WebFetch), by `curl`, not by WebFetch. Titles and revision ids are in Sources.
3. Read **GameFAQs**: SinirothX's encyclopedia, KeyBlade999's FAQ and two HD guides **in the built-in browser pane** (a plain `curl` of FAQ 31807 returned a bot-check page; the browser pane loaded it normally with no challenge shown, and I did not try to get round anything). Split_Infinity's boss guide was fetched with `curl` (it answered normally).
4. Read **Jegged** (the Chapter 5 Djose Temple and Bikanel Desert pages), GamerGuides, StrategyWiki, FFExodus, one Let's Play write-up and two Steam threads, all as page text by `curl` and checked against the page text itself, not a summariser.
5. Looked at six wiki screenshots in the browser pane **to describe the machine and the room in my own words**. Nothing was saved, nothing is in any output, and no retail image is used as a reference for anything (project rule 8; the brief).
6. Raw page text lives in scratch only: `D:/Tools/pyrefly-scratch/2026-10-10/new-chapters/_raw-ffx2-experiment/` (third-party text, outside every repo; safe to delete). No game file was read: that is the reverse-engineering session's job (section 12). No dev server, no build, no GPU, no repo write.

**Copy rules observed:** no dialogue and no game text is reproduced. The scan text and the story beats are paraphrased. Mission, item and ability names are used as names.

---

## 1. The answer: what the Experiment offers, and which fight is the chapter

### 1.1 The Experiment in one paragraph

In Chapter 5 the Machine Faction, which has made Djose Temple its headquarters (Gippal is away), boasts to the Gullwings of a prototype weapon meant to take on Vegnagun, built from parts dug up in the Bikanel Desert, and dares them to beat it. They do, easily, because the machine starts at Level 1 in everything (if the player has not dug). It breaks; the Faction says it can be rebuilt and asks for a repair manual (five exist, scattered across Spira). Every Assembly piece dug in the desert upgrades it at once. At Level 5 in all three stats the Faction admits it overbuilt the machine and cannot control it, the girls scold them and fight it a second time, and afterwards Rikku and Paine have a short exchange about where Paine learned Al Bhed, which turns into Paine's one sincere beat. `[verified: wiki Djose Temple, GameFAQs HD guide 82362, Jegged, LP write-up]`

### 1.2 The candidates at a glance

`concepts.md` develops these. The letters are the same.

| | **A. Out of Control** | **B. The Rematch** | **C. The Workbench** | **D. The Dig** |
|---|---|---|---|---|
| Fights | 1, at 5/5/5 | 2 in a chain: 1/1/1, then 5/5/5 (optional middle rung 3/3/3) | 1, at levels the player sets before the fight | 1, at levels set by a small dig the player plays first |
| HP | 18,324 | 18,324 each | 18,324 | 18,324 |
| What it teaches | A fixed 7-action cycle with an instant KO and an all-party hit; defence-ignoring damage; a Phoenix Down habit | A: the gentle first fight (Protect, heal rhythm). B: all of A | Whatever the dial gives: for example 1/1/5 shows every scary move with almost no damage behind it | As C, plus the dig |
| Story | The overbuilt machine only; the first fight is a one-line recap | **The game's own required pair**, with the rebuild as the story's hinge | Loses the rebuild beat unless the tab carries it | Loses the Faction's boast and the rebuild; gains the desert |
| Data quality | **Complete at 5/5/5** (SinirothX block and script; four other sources) | Complete: adds Special 1, which is one plain attack | Complete for all five Special levels, with the Special 3 HP trigger single-sourced | As C, but **the dig odds are in no source I read** |
| New engine needs | None beyond one enemy, four abilities, one AI script | Two enemy variants, one more AI script, one chain seam; all existing mechanisms | A chosen-levels channel from prep to battle, a level-parameterised enemy, an editable prep panel (the first) | C plus a mini-game screen, timers and a seeded random table |
| Art on disk | None for the machine or the Antechamber; the Chamber plate and the girls exist | Same | Same, plus the machine's builds | Same, plus the desert |

### 1.3 Recommendation: Candidate B, the two-act Rematch

`[estimate]`; each reason is sourced.

1. **It is the game's own shape.** Episode Complete needs one win below the maximum and one at 5/5/5 (wiki, Jegged, GameFAQs HD guide 81757 `[verified: 4 sources]`). The two fights are the chapter; the rebuild between them is the story.
2. **It honours the brief's "one more try from the fight itself" with no extra layer** (`DECISIONS.md` E-023, D-005). There is no dial, no medal and no unlock. The second fight is a hard, fair, learnable cycle; the first is the game's own on-ramp.
3. **Everything it needs already exists** in the engine: chained formations, a retry checkpoint, a scene between links, random-target multi-hit, fractional damage, magic that ignores Magic Defense (section 10).
4. **It is a superset of A.** Act II is exactly Candidate A, so building B means building A first. If time is short, A ships alone and Act I follows.
5. **The data is as strong as the Den of Woe chapter's** for the fight that matters (5/5/5), and trivial for the other.

**If Bailey wants the dial** (the request's wording), Candidate C is the honest version, but it is new gameplay, the first editable prep tab, and a modifier in spirit; it needs his explicit yes (rule 10, E-023). `concepts.md` lays out how it could honour the brief and where it cannot.

**Open design questions for Bailey (not decided here):** whether the dial is wanted at all now that the game's choice is known; whether Act I (a fight that cannot really be lost) is acceptable as an on-ramp; whether a middle 3/3/3 rung is wanted; which music; the chapter's id and number (it should not be called `ffx2-experiment`: section 10.4).

### 1.4 How our chapter would present the choice faithfully

The game's choice is **not made right before the battle** and is **not an upgrade menu**: it is a readout of three levels and a fight-or-walk-away prompt, with the real "upgrading" happening elsewhere (the dig, hours earlier). The faithful presentation, whichever concept is picked, is therefore:

1. **State the three levels as the technician does**: one line, *Attack n, Defense n, Special n*, on the pre-fight prompt and on the chapter's briefing, in our voice (Buddy's status reading; Shinra has no portrait).
2. **Offer the game's own two answers**: take it on, or not yet (back to the board). Not yet is only possible before the first fight.
3. **Show the upgrade as story, not as a menu**: the rebuild between two fights, with the three levels climbing and the crew bolting parts on. This compresses the dig and says so (it is ours, labelled).
4. **Do not model the dig, the repair manuals or the Assembly points.** None is needed for the fight, the odds are unsourced, and showing points would hit conflict G-2.
5. **If a player-set dial is ever wanted** (Candidate C), label it as a stand-in for the dig, keep every state a real state of the game's data, and attach nothing to a setting.

---

## 2. Where, when, and how the machine is made and fought

- **Where:** Djose Temple, the Machine Faction's headquarters in FFX-2. The first meeting is in the Great Hall; the fight itself is taken to the **Fayth Antechamber** `[GameFAQs HD guide 82362; guide 81757 agrees that the fight is toward the Cloister end of the temple]`. SinirothX tags the five formations "Djose Temple - Trial" `[SinirothX]`. The wiki calls the temple's FFX-2 role "the base of operations for the Machine Faction".
- **When:** **Chapter 5**, an optional mission, **Masterpiece Theatre** (the wiki spells it "Theater"). It unlocks at the start of Chapter 5; reward: an Al Bhed Primer; objective: defeat the Experiment `[wiki Djose Temple mission box; Jegged; GameFAQs HD guide 82362]`.
- **Who is there:** the Faction's Al Bhed crew, a mixed group (a lead technician, a kid, men and women in yellow, green, blue and red) standing around the hall like an audience; Gippal is **missing**, and the crew says the digging goes on without him `[GameFAQs HD guide 82362]`. The airship scenes are Rikku and Paine alone; no source puts Brother, Buddy or Shinra in this chapter.

### 2.1 What the player decides in the game

| Decision | Where | What it does | Source |
|---|---|---|---|
| Dig or not, and where | Bikanel Desert, any time in Chapter 5 | Each successful dig yields **one Assembly piece** (the earlier chapters' digs find Scrap Metal instead). A piece is Attack, Defense or Special and grade A, S or Z at random; Jegged says the West Expanse leans Attack, the South Defense, the East, North and Central Special (the page says you can still get anything anywhere). | wiki *Excavation minigame*; Jegged Bikanel page `[single source for the lean]` |
| Fight now, or walk away | The prompt in the Great Hall or the technician at the stairs | Fights the machine at **the levels shown on the prompt** (Attack n, Defense n, Special n). Walking away costs nothing; a short airship exchange follows if the first fight is declined. | wiki screenshot; GameFAQs HD guide 82362 `[verified: 2 sources]` |
| Hand over a repair manual | The technician in the Antechamber, after a defeat | Rebuilds the machine for another fight. Both answers are offered; the refusal gets a joke line. | GameFAQs HD guide 82362 |
| Which levels to bring it to | Digging more, or less, before each fight | **Upgrades are installed the moment a piece is found, before or after the repair.** The levels in force at the prompt are the ones fought. | GameFAQs HD guide 82362; Jegged |

The player never sees an upgrade menu. The technician reads the levels, the player decides whether to go in.

### 2.2 How the three levels are reached (the dig)

Each Assembly piece is worth **A 1 point, S 3, Z 5**, tallied separately for Attack, Defense and Special (wiki, Jegged, StrategyWiki, FFExodus `[verified: 4 sources]`). Points to level:

| Level | Points (wiki, Jegged, StrategyWiki) | Points (KeyBlade999, GamerGuides) |
|---|---|---|
| 1 | 0 to 3 | 0 to 3 |
| 2 | 4 to 9 | 4 to 9 |
| 3 | 10 to 19 | 10 to 19 |
| 4 | 20 to 37 | 20 to 38 |
| 5 | **38 or more** | **39 or more** |

**`[conflict]`** by one point (FFExodus says more than 38, which is the 39 reading). It changes nothing in Candidates A to C, which show levels and never points. It matters only for a tally panel or for Candidate D, and the game's own script settles it (section 12, Q1). Nothing in this research depends on it.

The dig itself: 60 seconds to find a golden X and get back to the hover before the clock runs out; four silver Xs hold gil, items, Primers or fights; a red reticle brings a battle; in Chapter 5 the roaming fight is ordinary desert fiends (wiki *Excavation minigame*). Jegged adds that the pieces are not kept in the bag, so a player who loses count has to check the panel in Djose. **The odds of each type and grade are in no source I read.**

### 2.3 The repair manuals (the rematch tickets)

Five key items, each a rematch ticket: **How to Repair with Soul** (a seated man in the temple's side room), **The Spirit of Recycling** (a man in the Cloister of Trials, who wants a password), **Repairing for Dummies** (stand between three monkeys outside, press when all three jump), **The ABC's of Repair** (a chest in the Calm Lands Ruin Depths) and **Everyman's Repair Manual** (examine the machina on the Mi'ihen Highroad). Jegged, GamerGuides / KeyBlade999, StrategyWiki, FFExodus and the wiki agree on all five, though they describe the Highroad and Cloister ones a little differently `[verified: 5 sources]`. So the machine can be fought **at most six times**; a player who runs out of manuals without a 5/5/5 win has missed the Episode (wiki).

### 2.4 Rewards and what completing it pays

| Reward | What | Source |
|---|---|---|
| Per fight | **AP 40; EXP 0; Gil 0**; steal and drop in section 3.1; Pilfer Gil 5,000 | SinirothX, wiki, Jegged, StrategyWiki, FFExodus, Split_Infinity `[verified: 6 sources]` |
| Mission | An **Al Bhed Primer** (key item; also handed over after the first win) | wiki mission box; KeyBlade999 |
| First win below maximum | A short Paine-and-Yuna gag scene, one of two versions depending on how many Al Bhed Primers have been found; counts toward 100 percent story completion | Jegged Bikanel page; GameFAQs HD guide 82362 |
| Win at 5/5/5 | **Magical Dances, Vol. II** (a key item that teaches a Songstress dance; the "Dancing Queen" trophy), the **Paine character scene**, and **Episode Complete for Djose** | Jegged (both pages), wiki *Djose Temple*, KeyBlade999 `[verified: 4 sources]` |
| **Annihilator** | The **only** place in the story to learn this Gun Mage Blue Bullet (48 MP, hits all enemies, ignores Magic Defense). It is only used at **Special 5**, and a Gun Mage has to be hit by it. The Fiend Arena cannot teach it. | wiki *Blue Bullet*, Jegged Bikanel page, Split_Infinity, SinirothX Blue Bullet table `[verified: 4 sources]` |

### 2.5 The story beats, in our words

| # | Beat | Source |
|---|---|---|
| 1 | The girls enter the Great Hall. The crew says it built a weapon and that nobody, the Gullwings included, could beat it. Paine hears a dare. Rikku says they want the girls to take on their supposedly unbeatable machine. | GameFAQs HD guide 82362 |
| 2 | A short panel explains the rules: its power rises with the pieces found in the desert; it breaks if beaten; repair manuals bring it back; the three levels are shown. The crew asks if the girls are ready to lose. Prompt: fight or walk away. | GameFAQs HD guide 82362; wiki screenshot |
| 3 | If the first fight is declined: on the airship Rikku remarks that the Faction is fine without Gippal and Paine says she was looking forward to beating their machine. Bystanders in the hall comment on the challenge. | GameFAQs HD guide 82362 |
| 4 | **Act I** at 1/1/1 (or whatever the levels are). | all |
| 5 | After the win: Yuna says they trashed it. Paine whispers a line to Yuna, who strikes a pose and says it to the technician in Al Bhed (a cheeky one). He likes the attitude and says he will have to build something stronger. Yuna is surprised he understood her; Rikku tells her to watch her language. (If the player has all the Primers, a polite apology version plays instead.) | GameFAQs HD guide 82362; Jegged |
| 6 | A panel explains repair manuals and that upgrades install as soon as they are dug up. A tutorial on the Bikanel digs and the manuals follows. | GameFAQs HD guides 81757 and 82362 |
| 7 | Later wins below max: on the airship Rikku wonders what they will do with it and Paine guesses Gippal built it to counter Vegnagun. | GameFAQs HD guide 82362 |
| 8 | At 5/5/5 a scene in the Antechamber: the crew admits it got cocky and souped the machine up too far, and now it is out of control. Paine: you built it and cannot stop it? Rikku: shame on you. The crew is deeply sorry. Yuna: only one thing to do. Prompt: fight or walk away; if declined, a crew member begs the girls to stop it. | GameFAQs HD guide 82362; LP write-up |
| 9 | **Act II** at 5/5/5. | all |
| 10 | After the win the crew says if you think you can beat it easily you are mistaken (a callback to their first boast), Paine says whose side are you on, they cheer, Paine answers with a dry thank-you. | GameFAQs HD guide 82362 |
| 11 | On the way out Rikku asks who taught Paine Al Bhed. Paine: Gippal, a bit; she thought a language would broaden her horizons. Her real point, said in a few short lines: to expand your horizons you have to open yourself up, and running with Rikku and Yuna changed her, mostly by making her talk. Yuna: we thought we were bothering you. Paine: at first you were. Yuna and Rikku giggle and run; Paine chases. **Episode Complete.** | GameFAQs HD guide 82362; wiki *Djose Temple*; Jegged |
| 12 | Back on the airship, Rikku asks in Al Bhed to speak to Paine privately; Paine mock-complains that she opens up and Rikku only teases. Afterwards the crew in the hall say they will have to build something that out-does the girls in some other way, and have stopped military research. | GameFAQs HD guide 82362 |

Beat 11 is the one the writing bible's "sudden sincerity" rule (section 2.2: drop the jokes for one exchange, then restore them) would call for. It is the chapter's emotional point.

---

## 3. Stat blocks

Common facts: the machine is one targetable body. Gravity-immune; no bribe item (SinirothX).

### 3.1 The constant block

| Field | Value | Confidence |
|---|---:|---|
| Name / class | Experiment / Machina; bestiary #154 (wiki); Japanese name エクスペリメント (Ekusuperimento) | wiki |
| Level | **50** | SinirothX, wiki `[verified: 2 sources]` |
| **HP** | **18,324** at every level | SinirothX, wiki, Jegged, Split_Infinity (both entries), KeyBlade999 / GamerGuides, StrategyWiki, FFExodus `[verified: 7 sources]` |
| MP | 0 | all |
| Agility | **68** | SinirothX, wiki `[verified: 2 sources]` |
| Evasion / Luck / Accuracy | 0 / 0 / 0 as SinirothX prints them. **Caution:** the project's reverse-engineering note for the Leblanc and Den actors found real Accuracy 95 where SinirothX printed 0 (`research/re-ffx2-ai-leblanc-den-ixion.md`, finding 11), so these three must be re-read from the files (section 12, Q3). | `[SinirothX]` with a caveat |
| Thinking period | 0 (acts as soon as its gauge is full) | `[SinirothX]` |
| EXP / AP / Gil / Pilfer Gil | **0 / 40 / 0 / 5,000** | `[verified: 6 sources]` |
| Elements | all neutral; **Gravity immune** | SinirothX, Split_Infinity, KeyBlade999 / GamerGuides `[verified: 3 sources]`; wiki infobox says **Lightning: Absorb** `[conflict]` section 11 G-3 |
| Immune | Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, **Slow**, Stop, Doom, Delay, Interrupt Action, **fractional damage**, and **every stat Up and Down** (Strength, Magic, Defense, Magic Defense, Accuracy, Evasion, Luck) | `[SinirothX]`; Split_Infinity gives the same list (abbreviated) `[verified: 2 sources]`; the wiki infobox lists the same; its strategy paragraph disagrees on the Breaks `[conflict]` G-4 |
| Zantetsu | resistant, 180 | SinirothX, wiki |
| Drop / rare drop | **Elixir** / Elixir | SinirothX (100 percent both), wiki, Jegged, FFExodus, StrategyWiki `[verified: 5 sources]` |
| Steal / rare steal | **Turbo Ether** / **Turbo Ether x2** | SinirothX, Jegged `[verified: 2 sources]`; the wiki prints x2 for both, StrategyWiki x1 for both `[conflict, minor]` G-6 |
| Scan | A prototype weapon the Machine Faction built to take on Vegnagun, assembled from parts dug up in the desert (paraphrase) | SinirothX, wiki |
| Blue Bullet | **Annihilator** (section 2.4) | wiki, SinirothX table |

SinirothX also prints Oversoul values (level 76, HP 25,540, agility 105, no attacks). The machine cannot oversoul in the story and no guide mentions it, so they are left out, as the Den research left out the shades'.

### 3.2 The Attack and Defense levels (the two stat tables)

| Level | **Attack** sets Strength / Magic | **Defense** sets Defense / Magic Defense |
|---:|---|---|
| 1 | 112 / 1 | 1 / 1 |
| 2 | 130 / 20 | 50 / 50 |
| 3 | **155** / 45 | 100 / 100 |
| 4 | 180 / 72 | 150 / 150 |
| 5 | 215 / 100 | 205 / 205 |

Sources: SinirothX (both tables, printed beside the block), Jegged, wiki infobox `[verified: 3 sources]`. KeyBlade999 and GamerGuides print **144** at Attack 3 (their percentage column is built on it, so it is not a typo in one cell) `[conflict]` G-1; the dump's 155 stands (the repo ranks SinirothX first; the dump is also the GameFAQs reading Bailey prefers).

SinirothX's base row prints Strength **58**, Magic 100, Defense 205, Magic Defense 205: the Level 5 Defense and Magic Defense and Magic 100 equal the row, but Strength 58 is not on the Attack table at all, so **the battle script overwrites some of the row at the start of the fight** (section 12, Q3). Do not read 58 as a level.

Damage consequences are **not** taken from the sources (StrategyWiki says attacks do less than half of normal damage at Defense 5, KeyBlade999 says half a percent of the Level 1 damage: two different readings of a ratio of stats). Compute them from the project's own formula once a preset exists (`research/ffx2-combat-core.md` section 2).

### 3.3 The Special levels (which actions it uses)

| Special | Pattern | Sources |
|---:|---|---|
| 1 | Normal Attack, every action | SinirothX, Jegged, KeyBlade999 / GamerGuides, Split_Infinity `[verified: 4 sources]` |
| 2 | Normal Attack, Normal Attack, Normal Attack, **Rocket Launcher (4 hits)**, repeat | SinirothX, Jegged, KeyBlade999 `[verified: 3 sources]` |
| 3 | Normal Attack, Normal Attack, **Rocket Launcher (6 hits)**, repeat. **Extra:** the first time its HP is at or below 3/5, again at 2/5 and again at 1/5 of maximum, **Lifeslicer on the character with the most HP left** (once per line) | cycle `[verified: 3 sources]`; **the HP extra `[single source: SinirothX]`**, Jegged and GamerGuides do not mention it |
| 4 | No pattern. Each action at random: **Normal Attack 1/2, Rocket Launcher (8 hits) 1/3, Lifeslicer 1/6** | SinirothX (1/2, 1/3, 1/6), Jegged (50, 33, 17 percent), KeyBlade999 `[verified: 3 sources]` |
| 5 | **Rocket Launcher (10 hits), Normal Attack, Rocket Launcher (10), Normal Attack, Lifeslicer, Annihilator, Normal Attack**, repeat | SinirothX, Jegged, KeyBlade999 / GamerGuides `[verified: 3 sources]`; Split_Infinity gives a six-step version `[conflict]` G-5 |

### 3.4 The battle objects and the formations `[derived]`

SinirothX lists, in its "Dummied / Battle Objects" section, **eight separate "Experiment" entries with HP 1, MP 1, every stat 1, no attacks and no drops** (alphabetical list, next to Blitzball and Cactuar entries), beside the real entry (HP 18,324) in "Species Bosses". The monster id table gives the name to **ids 194 to 200 and 208, 209** (nine), and the weapon props after them. The formation table has five Djose "BOSS" rows:

| Formation | Contents `[SinirothX]` | Special level it matches `[derived]` | Rocket hits at that level |
|---:|---|---:|---:|
| 229 | one `Experiment[C2]` | 1 | none |
| 228 | `Experiment[C2]` x1 + `Experiment[C3]` x2 | 2 | 4 |
| 227 | `[C2]` x1 + `[C3]` x4 | 3 | 6 |
| 226 | `[C2]` x1 + `[C3]` x6 | 4 | 8 |
| 225 | `[C2]` x1 + `[C3]` x8 | 5 | 10 |

The pattern is exact: **rocket hits equal the number of `[C3]` objects plus two, and the objects rise by two a level.** The reading, `[derived]` and unconfirmed: the `[C3]` objects are the **rocket pods** that appear as Special rises (none at 1, then 2, 4, 6, 8), the extra two hits come from the body, and the Special level picks the formation. The `[C2]` and `[C3]` tags are SinirothX's and are not decoded (section 12, Q2). One consequence for presentation: **Special could be legible on the body** as a growing rack of pods, and Attack and Defense might show as other parts (a Let's Play write-up says the Level 1 machine has stumps where hands go; section 7).

### 3.5 Reading the three dials together

| Combination | What the player meets | Source |
|---|---|---|
| 1/1/1 | One plain strike per action against Defense 1. A pushover: Split_Infinity advises maximising the girls' Defense and HP beforehand, Protect at the start, then chipping away. | Split_Infinity, KeyBlade999, GameFAQs HD guide 81757 |
| 5/5/5 | The full 7-action cycle against Defense and Magic Defense 205, Strength 215. Every guide calls for Protect (or Mighty Guard, or Light Curtain) first, Dark Knight Darkness or a Gunner's defence-ignoring skills for damage, a healer, and a Phoenix Down for Lifeslicer. | all |
| 1/1/5 | The whole scary cycle with Magic 1 and Strength 112: every special move, little damage behind it. The Let's Play write-up suggests it as the safe way to learn Annihilator. | LP write-up `[single source]`; the combination follows from the tables `[derived]` |
| 5/1/1 | Heavy plain strikes, no defence to speak of: a damage race. | `[derived]` |

Difficulty reports disagree and are party-dependent: Split_Infinity calls 5/5/5 very easy with three Dark Knights and Light Curtain; KeyBlade999 calls it pretty difficult; a Steam poster at about level 70 took it down with maybe three Darknesses; Jegged says it needs well-levelled girls and no complex strategy. **None of this is data.** The project's own bench decides (D-410: difficulty is measured and recorded, never tuned).

---

## 4. Actions and AI

Damage constants (DC) are `[SinirothX]`; the formulas are in `research/ffx2-combat-core.md` section 2. Observed damage depends on the writer's party; do not ship it as data.

### 4.1 The attacks

| Action | Effect | DC / type | Sources |
|---|---|---|---|
| **Normal Attack** | one character, physical | 16; can break the damage limit | SinirothX; Split_Infinity calls it a punch; wiki / Jegged "Attack" |
| **Rocket Launcher** (four versions) | **random characters**, N hits, physical; each hit picks its own target, so ten hits can land on one girl; Evasion does not dodge it (Let's Play) | (1) 4 hits, DC 4 each; (2) 6 hits, DC 3; (3) 8 hits, DC 3; (4) 10 hits, DC 3; all can break the damage limit | SinirothX, wiki table `[verified: 2 sources]`; Jegged, Split_Infinity (target description) |
| **Lifeslicer** | **one character, damage equal to her maximum HP**; fractional, can break the damage limit; a certain KO unless Auto-Life or similar is up; no counter, a Phoenix Down is the answer | fractional | SinirothX, Split_Infinity, wiki, Jegged, StrategyWiki `[verified: 5 sources]` |
| **Annihilator** | **all characters**, magic, **ignores Magic Defense**, adds a **weak Delay**; the Blue Bullet source | DC 20; can break the damage limit | SinirothX, Split_Infinity, wiki, Jegged `[verified: 4 sources]` |

Observed Annihilator damage: **1,240 to 1,400** (wiki) and **about 1,500** (Jegged, Split_Infinity, Let's Play), against the girls those writers had. `[conflict, party-dependent]` G-9. **Weak Delay** is a flat **4,000 ATB units, about 1.4 seconds at normal speed**, set against each girl hit, and it closes her open menu `[RE note: research/re-ffx2-atb-status.md sections 1 and 5; measured on the running game]`.

### 4.2 The scripts, by Special level

See 3.3. In words:

- **Level 1.** One plain strike each time.
- **Level 2 and 3.** A fixed beat: strike, strike, (strike), volley. At Level 3 it also looks at its own HP and throws a Lifeslicer at the girl with the most HP three times in the fight (at 3/5, 2/5 and 1/5) `[single source]`.
- **Level 4.** No beat at all: a dice roll each action, so one action in six is a Lifeslicer. The only Special level where nothing can be learned by watching.
- **Level 5.** A seven-action loop with **one calm action** at the end of each loop (the last Normal Attack, after Annihilator) `[derived from the three-source order; absent in Split_Infinity's six-step order]`. Split_Infinity adds that after Annihilator the loop starts again.
- **Counters and hidden state.** None is mentioned by any source beyond the Level 3 HP extra. No counterattacks.

`[derived]` design facts: at Special 5 a Lifeslicer **and** an Annihilator land in every loop; Lifeslicer comes on the action after the second volley (Split_Infinity says the same: the second Rocket Launcher is the sign), which makes it the most readable tell in the fight; Annihilator's Delay followed by the next loop's volley is the most dangerous pair.

---

## 5. The party and builds at that point

- **Party:** Yuna, Rikku, Paine with Chapter 5 dresspheres and grids. No source gives a player level for the Djose visit (a first-visit player at Level 1/1/1 could be anywhere; the Steam anecdote had a party near 70; the Let's Play, a built-up Samurai and Songstress team). The **Chapter V preset** (`src/data/ffx2/builds/farplane.ts`: Yuna White Mage Lv 46, Rikku and Paine Dark Knight Lv 48 and 50, the Chapter 5 bag) is the nearest in-repo build, used for the Fallen Aeons, Trema and Den of Woe chapters; the machine is Lv 50. Do not invent a separate level: any raise (as the Den's +8) is an `[estimate]` for Bailey.
- **What the sources bring** (for the guide; section 9):
  - **Protect first**, from a White Mage's Protect, a Gun Mage's Mighty Guard or a **Light Curtain** (Split_Infinity: the first four attacks at half damage), at the opening of **both** fights `[verified: 3 sources: Split_Infinity, wiki, KeyBlade999 / GamerGuides]`.
  - **Damage that ignores Defense:** Dark Knight **Darkness** (Defense is irrelevant; costs HP), Gunner **Cheap Shot** or **Tableturner**, Samurai's defence-piercing skills (Let's Play), a creature with Break Damage Limit (wiki); the Breaks are listed in the wiki's strategy, but the data says the machine is immune to every stat change `[conflict]` G-4.
  - **A healer**: White Mage (Curaga), or an Alchemist timing Stash and Mega-Potions just after a big hit (Jegged) `[verified: 4 sources]`.
  - **An answer to Lifeslicer:** a **Phoenix Down** in hand (every source). The **Salvation Promised** grid's Auto-Life is Jegged's second answer; **that grid is not in this repo's data** (no Garment Grid grants Auto-Life; the status exists, as one Lady Luck reel payload), so the engine's answer is the Phoenix Down (the Den chapter has the same gap).
  - **A Gun Mage who survives Annihilator** to learn it (Jegged). The repo's Gun Mage already lists Annihilator at zero AP (`src/data/ffx2/dresspheres/gun-mage.ts`), so **learn-by-being-hit is not modelled**; it can only be a guide hint, exactly as the Den chapter's Mortar hint.
- **Hit rule:** FFX-2's accuracy model applies (`ffx2-combat-core.md`). Rocket Launcher is not dodged by Evasion (Let's Play `[single source]`); Evasion is 0 anyway.

---

## 6. Arena, beats, and music

### 6.1 The arena

The Fayth Antechamber, Djose Temple: a **large round hall under a coffered dome**. From a wiki battle screenshot and two others (viewed, described in our words; none saved): a dark teal dome with a leaf-vine carved band; walls of tall **teal-green panels each holding a round glowing emblem with radiating petals**, flanked by **pale cyan glass columns**; recessed side alcoves with leaf-lattice screens and pale shafts of light; a **dark metal floor inlaid with concentric rings and straight rail-like lines**; **blue lightning arcs** running up the walls (the temple is lightning-powered; the wiki says so). In the pre-battle shot the **Al Bhed crew stand around the hall's edge** like an audience. The Faction's own dressing (work lamps, cables, crates) is what the Chapter XVI Chamber plate already carries. `[single source: three wiki screenshots; GameFAQs HD guide 82362 for the room's name]`.

**Where the camera and sides stand** `[wiki battle screenshot]`: the three girls stand in the foreground in a loose row with their backs to the viewer, and the machine fills the middle distance facing them, **about 2.2 to 2.6 times a girl's height** (rough, from one screenshot; to be replaced by the real model measurement, section 12, Q7). The formation positions are not in any source I read.

**No scene in `src/scenes/` fits.** `djose-chamber.ts` is the neighbouring room (the Chamber with the hole where the fayth stood). This needs end-state options first (rule 9). `art-brief.md` carries the written options.

### 6.2 Beat sheet

See section 2.5. The chapter-shaped version for Candidate B is: boast, readout and prompt, **Act I**, the Paine-and-Yuna gag, the rebuild (in the game: hours of digging; in ours: a montage), the overbuilt reveal, **Act II**, the crew's reaction, Paine's beat.

### 6.3 Music

- **"The Machina Faction"** (1:56): the Faction's theme, which plays **at Djose Temple** `[single source: wiki OST]`.
- **"Yuripa, Fight! No. 2"** (2:00): the game's boss theme (also used in the Fiend Arena); **"Yuripa, Fight! No. 3"** is the normal battle theme `[single source: wiki OST]`.
- **The fight's own track is in no source I read.** The wiki lists the Faction theme for the temple and nothing for the Experiment. Do not guess it; our game uses original cues anyway, and which cue this chapter gets is Bailey's call by ear (rule 13).
- **Cues already in the repo that could stand in** (`docs/audio/THEMES.md`): `boss-ffx2-aeon` (row 17: "A pop star fighting a god, and enjoying it"), `boss-vegnagun` (row 18: "Something enormous, and nobody is driving": the out-of-control act's mood almost word for word), `victory-ffx2` (row 20: "That was fun"). No new cue exists for this chapter.

---

## 7. Art: what exists and what is new

Nothing was generated for this file. `art-brief.md` has the descriptions.

| Subject | On disk (main tree `public/art`) | For the chapter |
|---|---|---|
| **The Experiment**, any build | nothing | **New**: the boss (idle, attack, cast, hurt, ko), at least two builds |
| **The Fayth Antechamber** plate | nothing | **New** arena. The neighbouring Chamber plates (`backdrops/djose-chamber-provisional`, C2 "the Faction's lamps", approved 2026-09-28, D-273) set the stone, lamp and blue-spark vocabulary |
| Yuna, Rikku, Paine | `yuna-white-mage`, `rikku-dark-knight`, `paine-dark-knight` and the other dressphere sets; portraits `yuna-x2`, `rikku-x2`, `paine` | reuse, no new painting |
| The Al Bhed crew and the technician | **nothing** (no crew art exists; `gippal`, `baralai`, `nooj` portraits exist) | **New**: a technician portrait and two or three crew figures for the cutscene plates |
| Brother, Buddy, Shinra | portraits `brother-x2`, `buddy`; **no `shinra` portrait** | Buddy can voice the readout; a Shinra portrait would be new |
| Chapter card, pause plate, prep wash | none | New (the card composes the boss on its scene, `frontend/chapterPlates.ts`) |

**The look changes with the levels, in the sources I could see** `[single source for each]`: the Let's Play write-up says Level 1 has **stumps instead of hands**; the wiki's battle screenshot (no pods, so probably a low-level machine) shows a **grey-violet body with long pole arms, a stern face plate with a grille mouth, a mane of dark hoses, two small "ears" on the shoulders and bronze cone-shaped feet on a drawer-fronted pedestal**; the wiki's infobox render (with pods and claws, so probably a high-level machine) is a **bronze and navy body with a horned helm, glowing multicoloured eyes, great claw hands, thin side arms and two tall stacks of round-holed pods behind the shoulders**. The formation tables suggest the pod count follows Special (section 3.4). **Which model belongs to which level is not sourced** (section 12, Q2).

---

## 8. Relationship to the other chapters

- **Chapter XVI, Ixion at Djose** (`research/ffx2-ixion-djose.md`): same temple, the next room along. That research deliberately left the Chapter 5 Djose content out (section 5 point 4: the Experiment, BOSS 225 to 229). The Chamber plates and the scene factory pattern in `src/scenes/djose-chamber.ts` are the nearest art and staging.
- **Chapter V, Vegnagun** and **Chapter XV, the Den of Woe:** the machine's scan text ties it to Vegnagun, and Paine's guess in beat 7 (Gippal built it as a countermeasure) fits the Den's Gippal and Shuyin story. The **Chapter V preset** is the party. The Den of Woe's kit options (Hero Drinks, +8 levels) are the precedent if the bench says the preset cannot win.
- **The Den of Woe chapter's Paine and Gippal material:** Paine's Al Bhed beat is the same character thread that chapter touches; it lands with more weight after the Den of Woe (Chapter XV), which already sits earlier on the board.
- **Chapter XI** (`ffx2-fallen-aeons.md`) already plans the Save-Sphere checkpoint between links; Chapter XIII (Trema) and the Vegnagun chain use a retry checkpoint with no Save Sphere. Both mechanisms are what Act II needs.
- **Naming:** the repo already uses "experiment" for something else (the hidden preview chapters, `Chapter.experimental`, `EXPERIMENT_CHAPTERS`, `BattleScreenExperiment.ts`, `app/experiments/`). A chapter id `ffx2-experiment` would collide in meaning. See section 10.4.

---

## 9. Jegged's plan, in our words (the guide follows Jegged: Bailey, 2026-10-03)

**Sources.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/57-Djose-Temple.html (the mission, the fight, the manuals) and https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/58-Bikanel-Desert.html (the pieces, the points, the rematch). Read 2026-10-10 as page text. Jegged is read for advice; the numbers below are from section 3 with their own tags.

**Jegged's plan.**
- *First fight.* It begins when the mission is accepted and the machine is at its weakest; no preparation is needed. Do not dig first: keep it at Attack, Defense and Special 1 so the first win counts. Paine has a line that only plays if the machine is below max, and it is needed for 100 percent story completion; Rikku and Paine have lines after the maximum win, so the plan is: beat it low, dig, beat it at max.
- *What each level does.* Attack: how hard it hits. Defense: how hard it is to hurt. Special: **which attacks it uses and in what order** (the five patterns of section 3.3). Annihilator is the unique Gun Mage Blue Bullet and **appears only at Special 5**, so the rematch is the only chance to teach it: bring a Gun Mage and keep her alive through the hit.
- *Fight advice.* No complex strategy: well-levelled girls who survive its damage and deal enough damage quickly. If they are struggling, swap into Dark Knight (more Strength and Defense). With an Alchemist, time Stash and Mega-Potions right after a heavy attack. Bring non-healers' Phoenix Downs, Mega Phoenix, X-Potions and Mega-Potions. Lifeslicer is the main danger; the **Auto-Life** buff (the Salvation Promised grid) survives it. Rocket Launcher can stack its random hits on one girl.
- *Rematch.* A repair manual is a rematch ticket; five exist (listed with their finds); only one is needed for the usual two-fight plan, and the first is in the temple. Pieces are random and not stored; you can check the level at the temple. Chocobo-riding the Central Expanse avoids fights.
- *Numbers.* HP 18,324. Steal Turbo Ether (x2 rare). Drop Elixir. Clearing at max pays Magical Dances, Vol. II and the Dancing Queen trophy.

**Our chapter (the Candidate B shape).** Yuna White Mage, Rikku and Paine Dark Knight on the Chapter V preset, with its bag (Light Curtain x12, Phoenix Down x25, Mega Phoenix x5, Mega-Potion-class items; `farplane.ts`, `research/jegged-encounter-guides-ffx2.md` section 3).

**Fit.**
- *As written:* the five Special patterns and their order; the Attack and Defense tables; Protect first; Dark Knight as the damage dressphere; Lifeslicer's answer (Phoenix Down); Annihilator as the Gun Mage's one chance; HP 18,324; steal and drop.
- *Our adaptation of Jegged:* **dig and manuals are not modelled**, so "do not dig first" and "find a manual" become the chapter's own two acts (Act I at 1/1/1, a rebuild montage, Act II at 5/5/5). **Auto-Life is not in the data** (no Salvation Promised grid), so the guide names the Phoenix Down only. **Learn-by-hit is not modelled**, so the Annihilator note is a hint, not a mechanic.
- *Does not apply:* the digging advice (Charm Bangle, Chocobo, areas, counting pieces); the Primer and trophy notes; Jegged's "swap into Dark Knight" if the preset already runs two.
- *Not covered by Jegged, and left to our research:* the Special 3 HP-triggered Lifeslicer (single source), the Level 5 order's disputed seventh step, the immunities (Breaks), and the Annihilator damage figure.

**Proposed guide lines (not written; each needs the data module first).** NEXT: Protect first, then defence-ignoring damage. WATCH: after the second volley comes Lifeslicer, then Annihilator, then one plain strike. RULES: keep a Phoenix Down in hand; healing before the Annihilator; the Breaks do nothing (once confirmed). Tag the Annihilator hint "your only chance" as the Den guide tags Mortar.

---

## 10. How our engine and prep screens would carry it: what exists, what is missing

All paths are in the release tree `D:/pyrefly-r39-int/src` (read only).

### 10.1 What exists

| Need | What exists | Where |
|---|---|---|
| A chapter record and board card | `Chapter`, `ChapterId`, `CHAPTERS` (18 listed; `Chapter.number` allows up to 19 and **19 is already the hidden Leblanc preview's number** (`chapter-exp-leblanc.ts:59`, "after the eighteen"), so listing a XIX and a XX means extending the union and moving the preview's number: a contract change); the board is "a fixed list in chapter-number order per game", each card a boss painted on its scene | `data/encounters.ts`; `app/screens/frontend/chapterGrid.ts`, `chapterPlates.ts` |
| A boss with stats, abilities and an AI script | one `EnemyDef` per boss, `*-abilities.ts`, an `AiScript` registered in `ai/index.ts`; `EnemyDef.level`, `thinkingPeriod`, `autoStatuses`, `ffx2Record` (the game's own monster row, re-parity W3) | `data/ffx2/enemies/*.ts`; `battle/ffx2/ai/*.ts`, `index.ts`; `battle/common/types.ts` (`EnemyDef` line 2675) |
| The mechanics the machine needs | **random-target multi-hit** (`targeting: 'random-enemy'`; Anima's Oblivion is 16 random hits; the kernel spreads hits over random targets, `kernel/hit.ts`), **fractional damage** (Drill Shot, Bullseye), **magic that ignores Magic Defense** (`formula: 'piercing-magic'`: the party's Annihilator, Nooj's shot), a counter and a "once" flag in AI memory (`mem`, `setMem`), HP-threshold triggers (Gippal, Nooj) | `data/ffx2/enemies/fallen-aeons-abilities.ts`, `den-of-woe-abilities.ts`; `ai/ixion.ts`, `den-of-woe.ts` |
| **Weak Delay** | the re-parity kernel carries the game's flat Delay (4,000 weak, 8,000 strong ATB units: `FFX2_DELAY_COUNT` in `kernel/atb-clock.ts`, formula 0x18 in `kernel/damage.ts`, `kernel/atb-interrupt.ts`) and `menu-cancel.ts` reads the `weak-delay` flag. **That the Annihilator row routes through it should be checked at build time**: an older comment in `leblanc-syndicate-abilities.ts` says no FFX-2 ability reader existed, and the RE note's difference row 12 says no ability called the old percentage helper | `battle/ffx2/kernel/*`, `menu-cancel.ts`; `research/re-ffx2-atb-status.md` |
| Two links in one chapter | `nextGroupId`; `checkpointOnEntry` (a retry checkpoint with no Save Sphere: Trema, Shuyin), `restoresPartyOnEntry` (a Save Sphere's rule), `opensAsSeparateBattle` (Chapter VI's acts), `carriesFullPartyState` (the Den) | `battle/common/types.ts` (`EnemyGroupDef`, lines 2752 to 2864) |
| A scene between two links | `CHAIN_SEAMS` in the story registry: scripts that play between links with the player's hands off, **a budget of 26 seconds** (`SEAM_BUDGET_MS`); Chapters III, V, VI, XI, XIII, XIV and XVII use them | `story/registry.ts` |
| Multi-part enemies | `EnemyGroupDef.parts` ("drawn and targeted separately"), used for Vegnagun's nodes, bulwarks and redoubts and the Yu Pagodas. The Experiment's pods, if drawn, would be **props, not targets** (HP 1 objects), so `parts` is not needed | `battle/common/types.ts` |
| A retry at a checkpoint | `BattleScreenOptions.resumeAt: ChainCheckpoint` | `app/screens/BattleScreen.ts` (line 89) |
| A choice in a cutscene | the DSL's `choice` step stores a value under `resultKey` in the script's flags; Chapter XVI uses it for the whistles | `story/dsl.ts` (line 204); `story/runner/CutsceneRunner.ts` |
| A guide, an advisor line, a "told move" banner | `data/guides/docs/*.ts`, `engine/tactics/ffx2-*.ts`, `ui/ffx2/toldMoves.ts` (Chapter XVI's Recharge banner) | as named |
| The party | the Chapter V preset (`data/ffx2/builds/farplane.ts`) and the Den's kit helpers (`withHeroDrinks`, `withLevelBonus`) | `data/ffx2/builds/` |
| Staging a boss at its real height | `data/ffx2/fiend-stature.ts` rows keyed by model `m<id>` and a ratio to the girls' mean height | `data/ffx2/fiend-stature.ts` |

### 10.2 What is missing

| Need | Why it is missing | Which concepts need it |
|---|---|---|
| **A way for the player to change the enemy before the fight** | **Every FFX-2 prep panel is read-only by design** ("nothing here is editable": `ui/ffx2/party-prep/panels.ts`); panels get only `{chapter, memberId}` (`PrepPanelContext`); `BattleScreenOptions` has no slot for a variant (`chapter, seed, auto, speed, resumeAt, openingHurry`); and `Chapter.enemyGroupRef` is a fixed object. | C, D |
| **A level-parameterised enemy** | Formations are fixed objects registered by id (`ENEMY_GROUPS`, `ENEMY_GROUPS_BY_ID`); compile-time switches exist (`TREMA_PARAGON_FORM`, `TREMA_CHAPTER_SHAPE`) but nothing is chosen at run time | C, D |
| **Painted variants of one boss** | The pipeline paints one state per file (`idle`, `attack`, `cast`, `hurt`, `ko`); there is no layered or part-swappable painted actor | B (two builds), C, D |
| **A dig mini-game** | No non-battle input screen exists beyond the story's whistle prompts and the Lady Luck reels | D |
| **Learn-by-being-hit** for Blue Bullets | The Gun Mage lists all 16 bullets at zero AP (`dresspheres/gun-mage.ts`); Mortar's Den hint is guide text only | none needs it; a guide hint covers it |
| **Auto-Life from a Garment Grid** | No Salvation Promised grid in `data/ffx2/garment-grids`; the `auto-life` status exists (one Lady Luck reel payload, `abilities/lady-luck.ts`) but nothing else grants it | none needs it; the Phoenix Down covers Lifeslicer |
| **A Shinra portrait, an Al Bhed crew and a technician speaker** | `portraits/` has Brother, Buddy, Gippal, no Shinra; no crew art at all | all |
| **Saving the dial** | `SaveData` has no such field. A save-schema change is the "save-data class" that owes a deep review before the build goes public (AGENTS.md "Release") | C, D, only if the dial is remembered |

### 10.3 What a pick would touch (contract files)

`src/data/encounters.ts` (`ChapterId`, `Chapter.number` extended past 19, and the hidden preview's number 19 moved: additive in spirit, with an entry in `docs/CONTRACT-CHANGES.md`, and the same edit serves Sinspawn Gui); `src/data/ffx2/ids.ts` (new id literals); `src/battle/common/types.ts` only if a variant channel is added (C, D). Candidates A and B need **no** contract change beyond the new chapter id and number. Rule 4 applies after every new module (`node tools/orphans.mjs`).

### 10.4 Naming

Do not call the chapter's id `ffx2-experiment`. The project already means "hidden preview" by that word (`Chapter.experimental`, `EXPERIMENT_CHAPTERS`, `exp-leblanc`, the experiments' own store). Names that carry the mission instead: `ffx2-masterpiece-theatre` (the mission), `ffx2-djose-machine`. The player-facing title can stay "The Experiment".

---

## 11. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **G-1** | **Attack Level 3 Strength:** 155 (SinirothX, Jegged, wiki) vs **144** (KeyBlade999, GamerGuides, whose percentage column is built on it). | Use **155**: the dump ranks first in this repo, and Bailey prefers GameFAQs where they conflict (the dump is GameFAQs too). Re-read from the files (Q3). |
| **G-2** | **Points for Level 5:** 38 (wiki, Jegged, StrategyWiki) vs 39 (KeyBlade999 / GamerGuides; FFExodus says more than 38). | **Unresolved**; changes nothing for A to C (levels, not points). Applying Bailey's GameFAQs rule literally gives 39; Jegged (the guide's authority) gives 38. Settle from the script (Q1) before any tally is shown. |
| **G-3** | **Lightning:** the wiki infobox says **Absorb**; SinirothX, Split_Infinity and KeyBlade999 / GamerGuides say neutral (only Gravity is immune). | Use **neutral**: three GameFAQs-family sources against one wiki field. Re-read (Q3). |
| **G-4** | **The Breaks:** the wiki's strategy paragraph recommends Armor Break and Power Break (and notes that Power Break is immune in the European version); SinirothX, Split_Infinity and the wiki's own infobox say every stat Up and Down is **immune**. | Treat the machine as **immune to the Breaks**; keep the Breaks out of the guide until Q3 confirms the immunity bytes. |
| **G-5** | **The Level 5 order:** Rocket Launcher first and a seventh action (Normal Attack) after Annihilator (SinirothX, Jegged, KeyBlade999 / GamerGuides) vs punch first, six steps, restart after Annihilator (Split_Infinity). | Use the **seven-step order** (three sources, one the data dump). Q4 settles it. |
| G-6 | **Steal quantity:** Turbo Ether and Turbo Ether x2 (SinirothX, Jegged) vs x2 and x2 (wiki infobox) vs x1 and x1 (StrategyWiki) vs rare "none" (KeyBlade999 / GamerGuides). | Use SinirothX + Jegged. |
| G-7 | **Special 3's HP-triggered Lifeslicer** (at 3/5, 2/5, 1/5 of maximum HP, once each, on the girl with the most HP): SinirothX only. | `[single source]`; Q4 confirms or removes it. |
| G-8 | **Where the fight is staged:** Fayth Antechamber (GameFAQs HD guide 82362) vs the "Djose Temple - Trial" label (SinirothX) vs the Cloister end of the temple (GameFAQs HD guide 81757). | Treat as the Antechamber at the top of the Cloister of Trials. Q6. |
| G-9 | **Observed Annihilator damage:** 1,240 to 1,400 (wiki) vs about 1,500 (Jegged, Split_Infinity, Let's Play). | Party-dependent. Compute from DC 20 and Magic 100 with the project's formula. |
| G-10 | **Whether a first win at 5/5/5 counts:** the wiki, Jegged and GameFAQs HD guide 81757 all say a lower-level win **and** a max win are required. A search summary hinted otherwise; none of the pages I read says so. | Two wins are required. Not data we need. |
| G-11 | **The dig odds** (type and grade): in no source I read. | Needed only for Candidate D. Q1. |
| G-12 | **A player level for the visit:** unsourced. | The Chapter V preset is an `[estimate]`; the bench decides (D-410). |
| G-13 | **The fight's music:** unsourced (section 6.3). | Bailey's call by ear. |
| G-14 | **How the levels change the body:** unsourced beyond two screenshots and one write-up (section 7). | Q2, Q7. |
| G-15 | **SinirothX's Accuracy, Evasion and Luck:** printed 0, but the RE lane found Accuracy 95 where SinirothX printed 0 for the Leblanc and Den actors. | Re-read (Q3). |
| G-16 | **Mission name:** "Masterpiece Theatre" (Jegged, GameFAQs) vs "Theater" (wiki). | Trivial. |

---

## 12. Open questions for the game data (for the reverse-engineering session)

The project's lane reads the Steam HD build (FFX-2 build 25501027) through `D:/Tools/rea` and Ghidra; its notes (`research/re-ffx2-ai-*.md`) show the layout: AI scripts as `m<id>.src` under `ffx_ps2/ffx2/master/jppc/battle/mon/` with a compiled twin, ability rows in `battle/kernel/monmagic.bin` and `command.bin`, stats and rewards in `monster.bin`, formations in `btl.txt`, start positions in `btl/<map>/pos_<map>.psc` (when the scene ships one), model heights from the `.chr` params block. In FFX-2 the model number equals the monster id for almost every boss, and SinirothX's numbering matches (Ixion 166, Baralai 176, Gippal 177). A folder `D:/Tools/ffx-parity/new-chapters/ffx2-experiment/` (empty when I looked) exists, apparently for those outputs. **No game text, file or decompiled code goes in the repo** (the brief to the lanes, rule 8): facts in our own words.

| # | Question | Where to look | What it settles |
|---|---|---|---|
| **Q1** | **Where the three levels live and how they are set:** the variables that hold Attack, Defense and Special; the **points-to-level thresholds** (38 or 39 for Level 5); the grade values (A 1, S 3, Z 5); whether a level can exceed 5; whether a repair resets anything; the Djose event script that shows the readout and the fight-or-walk prompt; the dig's piece table (the odds of type and grade, the regional lean). | the Djose Temple field and event scripts; the Bikanel dig scripts | G-2, G-11; whether a tally panel is ever honest; Candidate D |
| **Q2** | **The nine "Experiment" monster ids (194 to 200, 208, 209):** which is the body and which are the eight HP-1 objects; what `[C2]` and `[C3]` mean in the formation table; **whether formations 225 to 229 are chosen by Special level** (5 to 1) and what the objects are (rocket pods?); **whether the body's model changes with Attack, Defense or Special** (hands, plating, colour) and how | `monster.bin` rows; `btl.txt` rows 225 to 229; the model files m194 to m209; the monster scripts | the art brief's builds; whether `parts` or props are needed; G-14 |
| **Q3** | **The body's monster row at each level:** HP at every level (18,324 each?), MP, Level 50, Agility 68, **true Accuracy, Evasion, Luck**, thinking period, auto-statuses, **element bytes** (Lightning neutral or Absorb), **status-immunity bytes** (the stat-change immunities, so the Breaks), Zantetsu 180, steal and drop items and rates, EXP, AP, Gil, Pilfer Gil; **which fields the battle script overwrites** at the start of the fight (Strength 58 against the 112 to 215 table) and **exactly where the Attack and Defense tables live** (Attack 3 Strength: 155 or 144) | `monster.bin`; the script's start-of-battle block | G-1, G-3, G-4, G-15; the whole stat block |
| **Q4** | **The AI script for each Special level:** the **order at Special 5** (seven steps, which first, what comes after Annihilator: G-5); **Special 3's HP extra** (3/5, 2/5, 1/5 of maximum, once each, the highest-HP girl: G-7); Special 4's roll (a `% 6` split?); **target rules** for the Normal Attack, the Lifeslicer at Specials 4 and 5, and the Rocket Launcher (random per hit?); any counter, any "battle too long" block (the inert one the Bahamut note describes), anything that reads the party's HP or statuses | `m<id>.src` for the body; the compiled twin | G-5, G-7; the AI module; the advisor |
| **Q5** | **The ability rows:** Normal Attack (DC 16), Rocket Launcher x4 (hits 4, 6, 8, 10; DC 4, 3, 3, 3; random target per hit; whether Evasion applies), **Lifeslicer** (formula, damage equal to maximum HP, whether Protect, Shell, Reflect or Auto-Life matter, whether it can hit a KO'd girl), **Annihilator** (DC 20, ignores Magic Defense, weak Delay = 4,000 ATB units, whether Shell applies, whether it can miss, the Blue Bullet learn flag and the player-side 48 MP / power 60), and **each one's charge and rest numbers** so the pace can be reproduced | `monmagic.bin`, `command.bin` | the abilities module; the pacing (the Den note's section 6) |
| **Q6** | **Staging:** the battle map the fight uses (Antechamber or Trial), its **start positions** if the scene ships any (the Ixion note found one position file, "the other scenes ship none"), the **music id**, any scripted line or camera at the start of the fight or at its death (the data lists a "Die" animation), and whether the max-level fight differs from the others | the map folder; the monster script's init | the scene rigs; G-8, G-13 |
| **Q7** | **Size:** the body's mesh height at each model and the engine scale `C` (the lane's size law, `research/ffx2-gippal-den-of-woe.md` section 12.1), against the girls' mean for the Chapter V preset's dresspheres (**17.73** from that table); idle against attack heights; the pods' size and placement | the `.chr` params and meshes | a `fiend-stature.ts` row; the sprite sizes in the art brief |
| **Q8** | **The wrap-up:** what a defeat does to the repair state (is a manual used when the machine is beaten, or when the Faction repairs it?), the "out of control" flag at 5/5/5, what ends the mission, how Episode Complete is set, and the New Game+ behaviour | the Djose event scripts | the chain's seam and retry design; nothing in the engine |

Order of use: Q3, Q4, Q5 block the data module; Q6 and Q7 block the scene and the sprite sizes; Q1 blocks only Candidate D and any tally; Q2 and Q8 shape the art and the seam.

---

## Sources

**Final Fantasy Wiki (Fandom)**, read through `api.php?action=parse&prop=wikitext` with a browser user agent, 2026-10-10:

- Experiment (Final Fantasy X-2), revid 4032406: https://finalfantasy.fandom.com/wiki/Experiment_(Final_Fantasy_X-2)
- Djose Temple, revid 4034469: https://finalfantasy.fandom.com/wiki/Djose_Temple (the mission box, the Chapter 5 story summary, the Episode Complete line)
- Excavation minigame, revid 3931682: https://finalfantasy.fandom.com/wiki/Excavation_minigame
- Episode Complete, revid 3989315: https://finalfantasy.fandom.com/wiki/Episode_Complete
- Machine Faction, revid 3739302: https://finalfantasy.fandom.com/wiki/Machine_Faction
- Blue Bullet, revid 3998597: https://finalfantasy.fandom.com/wiki/Blue_Bullet (the Annihilator row; "Annihilator" redirects here)
- Final Fantasy X-2 enemy abilities, revid 3998493: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Final Fantasy X-2: Original Soundtrack, revid 3984616: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack
- Djose, revid 3989778: https://finalfantasy.fandom.com/wiki/Djose
- Six file pages viewed (not saved): `File:Experiment_from_FFX-2.png`, `File:Djose_Experiment.png`, `File:Fight_the_Experiment.jpg`, `File:Experiment.jpg`, `File:Rocket_Launcher_FFX-2.jpg`, `File:Annihilator_ffx-2.jpg`

**GameFAQs** (read 2026-10-10; the built-in browser pane for the first, third, fourth and fifth, `curl` for the second):

- SinirothX, *Final Fantasy X-2 Enemy Encyclopedia* (PS2, International + Last Mission), FAQ 31807, v1.3: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807 (the "Experiment" entry in 5b Species Bosses, the eight battle-object entries in 4d, the bestiary table, the Blue Bullet table, the monster list, the Djose formations 225 to 229)
- Split_Infinity, *Final Fantasy X-2 Boss Guide* (PS2), FAQ 26832: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26832 (sections G0636 "first" and G0637 "at maximum Lv5")
- KeyBlade999, *FFX-2 FAQ/Walkthrough* (HD Remaster, Vita page), FAQ 69206, page 6: https://gamefaqs.gamespot.com/vita/708347-final-fantasy-x-2-hd-remaster/faqs/69206?page=6
- *Djose Temple Ch 5*, HD Remaster Walkthrough & Guide, FAQ 81757: https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/81757/djose-temple-ch-5
- *Chp 5, Djose, Episode Complete*, HD Remaster Walkthrough & Guide, FAQ 82362: https://gamefaqs.gamespot.com/ps3/643146-final-fantasy-x-x-2-hd-remaster/faqs/82362/chp-5-djose-episode-complete

**Jegged.com** (page text, read 2026-10-10):

- Chapter 5, Djose Temple: https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/57-Djose-Temple.html
- Chapter 5, Bikanel Desert: https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/58-Bikanel-Desert.html

**Other walkthroughs**

- GamerGuides, *Final Fantasy X-2 HD Remaster*, Chapter 5, Djose: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/djose (the same text as KeyBlade999's FAQ)
- StrategyWiki, *Final Fantasy X-2/Chapter 5/Djose Temple*: https://strategywiki.org/wiki/Final_Fantasy_X-2/Chapter_5/Djose_Temple
- FFExodus, FFX-2 walkthrough, Chapter 5 Djose Temple and Moonflow: http://www.ffexodus.com/ffx2/walkthrough44.php ; Bikanel and the Experiment: http://www.ffexodus.com/ffx2/mini4.php
- BrainWeasel, *Final Fantasy X-2* Let's Play, Part 50: https://lparchive.org/Final-Fantasy-X-2/Update%2050/
- Steam community threads (two, read for the six-fights and Annihilator-only remarks): https://steamcommunity.com/app/359870/discussions/0/358415206092189451 and https://steamcommunity.com/app/359870/discussions/0/364042262887738690

**Local files consulted (read only):** `AGENTS.md`; `docs/PRODUCT-BRIEF.md` (main tree); `docs/ARCHITECTURE.md`; `docs/CONTRACTS.md`; `docs/ART-PIPELINE.md`; `docs/audio/THEMES.md` (the cue map); `research/writing-bible.md` (1.14 to 1.20, 2.2); `research/visual-bible.md` (1.18, 1.23.5, 2.0, 2.4, 2.5); `research/ffx2-gippal-den-of-woe.md`; `research/ffx2-combat-core.md` (the source ranking, line 1384 on Annihilator); `research/ffx2-ixion-djose.md`; `research/jegged-encounter-guides-ffx2.md`; `research/re-ffx2-ai-leblanc-den-ixion.md`; `research/re-ffx2-atb-status.md` (the Delay values); `DECISIONS.md` (E-023, D-005, D-410); `docs/concepts/chapters/ixion-djose-2026-09-27/README.md` (the options format); `src/data/encounters.ts`; `src/battle/common/types.ts`; `src/battle/ffx2/ai/ixion.ts`, `index.ts`; `src/data/ffx2/enemies/trema-options.ts`, `den-of-woe-abilities.ts`, `fallen-aeons-abilities.ts`; `src/data/ffx2/builds/farplane.ts`, `den-of-woe.ts`, `djose.ts`; `src/data/ffx2/dresspheres/gun-mage.ts`; `src/data/ffx2/abilities/gun-mage.ts`; `src/data/ffx2/fiend-stature.ts`; `src/app/screens/PartyPrepScreen.ts`, `BattleScreen.ts`, `frontend/chapterGrid.ts`; `src/ui/ffx2/party-prep/index.ts`, `panels.ts`; `src/story/dsl.ts`, `registry.ts`; `src/scenes/djose-chamber.ts`; `public/art` listings and two approved paintings in the main tree.

---

## Verification log (2026-10-10)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | HP 18,324 at every level | SinirothX, wiki, Jegged, both Split_Infinity entries, KeyBlade999, StrategyWiki, FFExodus; KeyBlade999 says HP never changes | agree |
| 2 | The three level tables | SinirothX vs Jegged vs wiki vs KeyBlade999 | agree except Attack 3 Strength (155 / 144), G-1 |
| 3 | The five Special patterns | SinirothX vs Jegged vs KeyBlade999 vs Split_Infinity | agree on 1 to 4; Level 5 order differs in Split_Infinity, G-5; Level 3 HP extra is SinirothX only, G-7 |
| 4 | The levels come from the dig; no upgrade menu | Jegged x2, wiki x2, GameFAQs HD guides, StrategyWiki, wiki screenshot | agree |
| 5 | A prompt shows the three levels and offers fight or walk away | wiki screenshot (Level 1), GameFAQs HD guide 82362, StrategyWiki | agree |
| 6 | Up to six fights; two wins needed for Episode Complete | wiki x2, Jegged x2, GameFAQs HD guide 81757, Steam | agree |
| 7 | Five repair manuals and where | Jegged, GamerGuides / KeyBlade999, StrategyWiki, FFExodus, wiki | agree on the five (descriptions vary) |
| 8 | Annihilator only from the Experiment, at Special 5, 48 MP | wiki Blue Bullet, Jegged, Split_Infinity, SinirothX table, Steam | agree |
| 9 | Weak Delay is 4,000 ATB units | `research/re-ffx2-atb-status.md` (measured) | the project's own measurement |
| 10 | Eight HP-1 "Experiment" objects and formations 225 to 229 with 8, 6, 4, 2, 0 `[C3]` objects | SinirothX (4d section, formation table) | read directly; the Special-level reading is `[derived]` |
| 11 | Pod count follows Special | formation table plus rocket hits (4, 6, 8, 10 = objects + 2) | consistent; not stated by any source |
| 12 | The look changes with level | wiki infobox render vs wiki battle screenshot; Let's Play "stumps for hands" | two images and one sentence; which is which level is not sourced |
| 13 | The fight is in the Fayth Antechamber | GameFAQs HD guide 82362; SinirothX label "Trial"; HD guide 81757 | one source for the name, G-8 |
| 14 | The battle music | wiki OST | not sourced for this fight |
| 15 | Repo facts (prep read-only, no variant slot, chain seams, parts, mechanics) | files named in section 10, read directly | confirmed in the release tree |
