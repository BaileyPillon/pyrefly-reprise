# Paper preflight: hidden chapter 41 (provisional) — Spherimorph, the spring in Macalania Woods (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-beast-review.md`, `docs/plans/ch-keeper-review.md` and `docs/plans/ch-maesters-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 3, FFX lane, program row 41). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/re-ffx-spherimorph.md` (the sister note in this folder; "RE §n" below), the program plan (row 41, sections 6 to 9), `docs/plans/ch-beast-review.md` (format and the wave-2 numbers), `docs/plans/ch-dark-aeons-review.md` §7 (today's winnability method), `src/data/ffx/builds/macalania.ts` and `macalania-bench.ts` (the build point), `src/battle/ffx/ai/hooks.ts`, `hit-gates.ts`, `seymour-omnis-rules.ts` (the engine seams), all at `origin/main`. **Engine claims were read at `origin/main`; nothing was run, so rule 3 is owed by T0 and T7.**

**Verdict: PROCEED on data, AI and the small seams now; HOLD everything Bailey will see or hear (the Spherimorph painting, the plate choice, the music, any element tell) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench.**

## 0. What changes against the plan (read first)

1. **The AI is read in full: 3,277 bytes of code** (the plan's "51 KB script" is the file size, mostly model data). R is finished; what remains is a quarter of an hour of live checks (section 13).
2. **It is a puzzle fight.** Spherimorph has two turn actions only (an Attack, and Press below half HP); **every spell is a counter**. The weakness rule is a four-state machine that shifts **only when the weakness is hit** (a uniform draw over all four elements, the old one included). A blind caster loses by arithmetic: a wrong -ra cast heals it about 1,300, a right one hits for about 1,900 and then reshuffles. [RE §0, §4, §6]
3. **Armored.** A plain physical hit is divided by 3: Tidus does 42 to 47 a swing; Auron's Piercing katana 382 to 431; Lulu's spells (which pierce) 1,822 to 2,056 on the weakness. The party's roles are fixed by that: probe, nuke, heal. [RE §6]
4. **Three aeon entries and one area**: Valefor, Ifrit and Ixion (Shiva comes later), so the Woods build is the Macalania preset with Shiva removed. [RE §2]
5. **The size drops** (26 to 21 hours, section 11): the research is done, every spell is a row the engine has, and the affinity-rewriting precedent (Omnis) exists.

## 1. Game case and sources

**Game case: FFX only.** CTB, aeons, the FFX status set; the fight is the second-to-last boss before the temple of Macalania. New logic lives in new files under `src/battle/ffx` and `src/data/ffx` (an absence test pins that no ffx2 file imports it, as for the Keeper); the chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave-3 integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m121`, `mcfr03_00`, the command rows | the record, the formation, the whole AI, every number below | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 `[run]` | exact tallies of the script in the Atel interpreter: the four states, the reply matrix, the shift, Press | [run] |
| Jegged "Macalania Woods"; Gamer Guides; Samurai Gamers | the guides' account: agrees with the files except where RE §7 says | [guide] |
| `research/observed-ffx-steam-2026-09-26.md` | the Steam session: party Tidus, Auron, Lulu; the HELP-bar names; "Immune to sensors" | [observed] |
| `src/data/ffx/builds/macalania.ts`, `macalania-bench.ts` | the repo's stat cells and bag one region later | [estimate], build point sourced |
| GameFAQs, StrategyWiki, Final Fantasy wiki | not read (HTTP 403); the tie-break was never needed | [RE header] |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**The set-up.** The party walks up to the spring and the fight starts. Spherimorph (12,000 HP) stands at the far end; Escape and Flee are off; Switch and Summon work. A line from Lulu, and two banners, tell the player the one thing to learn: it takes damage from one element only and absorbs the rest.

**Its turns.** A plain Attack on a random living member (about 240 to 280). **Below half HP (6,000), half of its turns are Press**: everyone loses half of their current HP (Protect halves that). It never casts a spell on its own turn.

**Its replies.** Hit it with a plain physical attack: it answers with a tier-1 spell **of the element opposite to its weakness**, aimed at the attacker (about 170 to 230): that is the clue. Cast a spell of **its weakness** (the opposite of the clue): about 860 to 970 from a Fire, 1,800 to 2,050 from a Fira, and it **shifts** to a new state drawn from all four (one time in four the same). Cast a wrong element: **it heals by that much** and answers the whole front line with the opposite spell. Element-free magic and Scan are answered on the whole front line; Bio, Slow, Dispel and the like draw no reply. A Doublecast counts once (the first spell of a pair is ignored).

**The win.** HP 0; the body stays. 4,000 gil, 3,240 AP (4,860 overkill), a Lv. 2 Key Sphere, a steal of Ether or Turbo Ether, a piece of gear. [RE §1.3]

**The design fact `[derived]`.** The fight is about **reading one clue and acting on it**: probe with a plain attack, nuke the opposite element, and read the clue again after each hit that lands. Everything else (Nul spells, Magic Break, Protect against Press, Armor Break to unlock Tidus) is support.

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or a one-line hook.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Record, rows (Attack, Press f5 p8 physical class, the four monster spell rows f3 p16, the four player-side rows, Elemental Shift), loot, Armored and the Break bytes | **Existing** formulas (`kernel/damage.ts` has formula 5) and `armoredMod` in `kernel/hitdamage.ts`; new data | new `data/ffx/enemies/spherimorph.ts` + `loot/records.ts` entry | S |
| 2 | The four-state machine: rewrite absorb and weak flags and the two counter rows at start and on every shift | **Partly**: Omnis rewrites his affinities at run time (`ai/seymour-omnis-rules.ts` `withDiscAffinities`); the four-state table and the uniform draw are new | new `ai/spherimorph.ts` + `-rules.ts` | M |
| 3 | The hit classifier: damage type, HP class, five element bits of the command, **the attacker's weapon element for physical and special hits**, `LastDamageTakenHP` | **Partly**: `UsedCommand`, `HitReport.lastDamage` and `affectsHp` exist (`ai/hooks.ts`); `weaponElements(user)` exists (`equipment.ts`); the combination for a hit is new | rules file | S to M |
| 4 | Counters aimed at the attacker or at the front line, dropped if the attacker is gone | **Existing** (`queueReaction` with `requiresAlive`; Seymour's and Anima's counters) | none | none |
| 5 | The choice between the player-side and the monster-side spell row when an aeon is on the field | **New, tiny** (a front-line query: the Keeper and Evrae scripts ask the same) | rules file | S |
| 6 | Doublecast: the first spell of a pair is ignored | **Existing** (`ai/hit-gates.ts` already gates a Doublecast on a boss that answers every hit; reuse its test) | rules file | S |
| 7 | Scan reply | **New, tiny**; **T0 checks that onHit is raised for Scan against a Scan-immune target** (open, RE §8) | rules file | S |
| 8 | Press (half of current HP, physical class) on the front line below half HP, 50.03 percent per turn | **Existing** formula; new turn rule | rules file | S |
| 9 | Elemental Shift as a no-damage action with its HELP-bar name; Sensor-immune text | **Existing** (`ui/ffx/sensorImmune.ts`, the action banner); one new ability def | data | S |
| 10 | Formation: Escape and Flee off for all, Normal start, three party and three aeon entries | **Existing** (`formation-commands.ts`, `commandDisables`) | formation data | S |
| 11 | A monster cast of a player-side row: does it spend the monster's MP? | **Open** (RE §8); mirror the Seymour and Keeper rule | data | S |
| 12 | HUD | **None new** (no new command); the standard status icons; the banner shows Elemental Shift | | none |
| 13 | Presentation: a plate, Spherimorph's poses, the four spells, Press, the shift, three hint lines | **New** | `scenes`, `engine`, `story` | M |
| 14 | Chapter plumbing: new `ChapterId`, `Chapter.number` 41, meta, story, door word `spherimorph`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 3 and 5 to 7 are the only seams; 2 after 1; the rules after both.

## 4. The party

- **Build point:** the repo's Macalania preset (`macalania.ts` plus `macalania-bench.ts`, stat cells at the midpoint of the published ranges, `[estimate]`): Tidus HP 1,265 DEF 13 MDEF 11 AGI 21, Yuna 1,182 / 9 / 31 / 12, Rikku 850 / 11 / 11 / 23, Wakka 1,375 / 14 / 9 / 11, Auron 1,900 / 21 / 9 / 10, Lulu 850 / 11 / 36 / 9, Kimahri 1,200 / 17 / 9 / 11. That preset is the **Temple** (after Lake Macalania, with Shiva in the roster); the Woods come one region earlier, so **Shiva is removed** (three aeons: Valefor, Ifrit, Ixion; the formation has exactly three aeon entries) and the Temple's two gifts are irrelevant here. `[estimate]`, flagged; nothing is raised toward a result.
- **It already carries the sourced tactics:** Yuna has the four Nul spells, Shell, Protect, Scan and Pray; Auron the four Breaks, Threaten and Piercing; Lulu Fire, Fira, Blizzard, Blizzara, Thunder, Thundara, Water, Watera and Focus; Kimahri a Piercing spear; Tidus Haste and Delay Attack.
- **Recommended front line: Tidus (probe), Yuna (heal, Nul), Lulu (nuke)**, bench Auron, Wakka, Kimahri, Rikku (Auron's Armor Break and Magic Break one Switch away). This is the line the guides describe. Alternative: Tidus, Auron, Lulu (the line of the 2026-09-26 observed session). **The bench runs both and reports** (changing `activeSlots` is one line).
- **Gaps, none of which this lane fills (rule 6):** the exact bag, the Overdrive gauges on arrival, the armour abilities at this point. All `[estimate]`, never tuned toward a result.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers.

## 5. The arena

- **No Woods plate exists.** The formation puts the party in a line along x (35, 0, -35 at depth 85, 75, 85), the aeons behind, Spherimorph at (0, -14, 140), camera centre (-20, 0, 83); one area only. The nearest existing plate in the art mirror is `macalania-temple` (an icy blue hall: blue glass pillars, gold trim, a reflective floor), which reads as the Temple, not a forest spring.
- **Options (end state first, rule 9; a mockup at real resolution each, owed before building):** **(a)** the `macalania-temple` plate as is, with the existing Macalania rigs (0 new plates; risk: it reads as the next chapter's place); **(b)** a spring variant *derived from the existing plate* (greener light, mossy stone, a pool, no dome; 1 derived plate; the approved plate untouched); **(c)** a new `macalania-woods` plate (the spring clearing) with its own depth map and rigs. **Recommendation (a) for the first build with (b) and (c) mocked up beside it; (c) if the frame shows the Temple stand-in fights the story position.** (c) is the faithful but expensive pick.
- **No phone rigs exist for the Woods;** a 390 x 844 solve is part of the pick (the party is a line; Spherimorph small on a phone).

## 6. New art needed

Counts are images. Poses follow the repo's boss sets: idle, attack, cast, hurt; ko where the body stays.

| Asset | Images | Note |
|---|---:|---|
| **Spherimorph** (a floating orb creature that carries elemental spheres; the repo has no equivalent) | 6 to 7 | idle, attack (the plain Attack), cast (the counters), a press pose, hurt, the shift pose (Elemental Shift), ko ("Boss": the body stays) |
| **The four element tints** (red, blue, yellow, green) | 0 painted | by a code tint of the idle, **only if SP7 chooses to show the state**; the default hides it (the game's own clue is the counter spell) |
| Backdrop | 0, 1 or 1 new | (a) as is, (b) one derived variant, (c) one new plate with depth |
| Effects (four spell bursts, the shift ring, the press crush) | 2 to 3 | may be drawn in code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 9 to 14** | |

- **Recolour of existing paintings:** nothing is close: `shiva` (an ice maiden) and `anima` (chained) are different silhouettes; `seymour-macalania` is a humanoid. The orb is a new painting; the four element looks come from code tints of it (flagged: a tint of a painting is a compromise, not a new painting).
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). Retail references are allowed (hard rule 8); the painting that ships must match the approved painted look (rule 9). **Bailey alone approves a painting.**

## 7. Music (rule 13: only his ears judge)

The game plays its normal boss theme. Stand-ins (flagged, the driver's pick): scene bed `scene-macalania-temple` (exists), battle cue **`boss-challenge`** (the neutral FFX boss cue) with **`boss-seymour-macalania`** as the alternative (the next boss in the same region); an entry on the audition page for Bailey. Alternative: one new take under the standing delegation (needs the driver's spend note; rule 11).

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**This is a puzzle fight, so the target differs from the chain's 70 percent band:** the **advisor's probing line should win about 95 percent or more**, and a **blind line (casts a random element each turn) should lose almost always** (the arithmetic below says it cannot win). If the probing line sits far below 95, the levers are, in order: the Phoenix Down stock, Yuna's Nul spells and Protect (cheap), the front line (SP2), the bag's Potions and Ethers. **Never** Spherimorph's numbers.

**The sourced line the advisor carries (`engine/tactics/spherimorph.ts`, one named constant per rule):** Hastega or Haste; Protect before Press (below 6,000 HP); **Tidus probes with a plain Attack from an unelemented weapon** (an elemental weapon of the weakness would shift it, of another element would heal it); read the counter spell the attacker takes; **Lulu casts the opposite of the clue at the highest tier she has** (Fira and Blizzara and Thundara and Watera; Firaga if the grid has it); after every hit that lands, probe again unless the cast element is known to have repeated (a quarter of the time); Nul-element spells on the member the clue names; Auron's Magic Break or Armor Break only when it saves a turn.

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) a blind -ra cast has a quarter chance of being right: expected net about -500 HP of Spherimorph per cast (+1,900 x 0.25 against -1,300 x 0.75 healed), so a blind line never finishes; (2) the probing line needs 6 to 7 weakness hits and about 5 probes (one shift in four repeats), so about 12 to 14 actions of the pair, and the counters on Tidus total about 1,150 over the fight (heal him with Cure); (3) Press is the only pressure: below 6,000 HP it halves current HP about every other Spherimorph turn, and Protect halves that; (4) Lulu's MP (205) is not a limit: seven Fira casts cost 56; (5) a Doublecast Fira pair is two casts: the first is ignored, so it does not shift on the pair's first spell.

**Addendum after the build and its adversarial review (2026-11-06; the plan above is left as written).** The target above, "a blind line should lose almost always", held, and it was **incomplete**: two lines that never read the clue also win, and both are the game's own rules and not guesses. **Poison**: the bytes say it lands (the poison byte is 5, 5 percent of 12,000, 600 a turn), so one thrown Poison Fang and then Defend wins 200 of 200 with no healing at all (median 71 decisions) when the bag carries the Temple's two Fangs; the Woods' bag does not (`builds/spherimorph.ts`, a lever on an `[estimate]`, the driver's call). **The siege**: Armor Break once, then plain blows; a plain blow never shifts it and is only answered on the one who struck, and Armor Break takes the Armored division away; it wins 200 of 200 on the shipped front after a Switch for Auron (median 64 decisions against the puzzle's 23) and no preset lever removes it, because the numbers are the game's. The corrected target: **a line that guesses loses almost always; the puzzle is the fast and safe way (23 decisions, nobody falls); the siege is the slow way; the poison route is closed by the bag.** The measured table is `docs/handoff/ch-spherimorph.md` section 6.

**Tests (T0 first, T7 last):** T0 the engine checks (rows 3, 5 to 7 and 11, Press end to end); T1 the data fixture; **T2 the AI rules with the interpreter's exact tallies as pins: the four starting states (16,384 of 65,536 each), the state table of RE §4.1, the Press chance (32,786 of 65,536 below 6,000 HP, none at 6,000), the reply matrix of RE §4.3 for the four states and the 17 commands of the run (a table pinned cell by cell), the shift distribution (16,384 each from every state), the Threaten, HP 0 and counter-not-allowed gates, the Doublecast rule, the Scan reply, the aeon-on-the-field row choice**; T3 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, with the probing line, the blind line and the Auron-front-line variant); T4 the HUD (none new); T7 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| SP1 | Number and word | **41, door word `spherimorph`** (PLAN §8; checked against the 15 words and `pilgrim`) | none |
| SP2 | Front line | **Tidus, Yuna, Lulu**, bench Auron, Wakka, Kimahri, Rikku | Tidus, Auron, Lulu |
| SP3 | Build | the Macalania preset without Shiva (aeons Valefor, Ifrit, Ixion) | the full preset with Shiva (not owned at this point) |
| SP4 | Arena | **(a) the `macalania-temple` plate as is**, mock (b) a spring variant and (c) a new plate beside it | (c) as the first build |
| SP5 | Spherimorph's look | **New painting**, 6 to 7 poses | none close enough to recolour |
| SP6 | The hint lines | three short lines of our own words (one opening line from Lulu, two banners), the game's own texts are not copied | none (the game has them) |
| SP7 | Show the current element | **No** (the counter spell is the clue, as in the game; the guide teaches the probe) | a faint tint of the orb (a faithful-to-the-name addition that removes the puzzle: not recommended) |
| SP8 | Aeons | allowed (Summon is not disabled; with an aeon on the field the absorbed-spell counter uses the weaker player-side row: faithful) | barred (not faithful) |
| SP9 | Music | stand-ins of section 7 | a new take |
| SP10 | Start | Normal (the formation writes it) | none |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**` was **not run** (treeless lane); by the Keeper preflight's reading the same rows apply: the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**, so expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship the wave-3 chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 3, 5 to 7, 11); T1 data + loot; T2 the AI and rules; T3 the build + bench; T4 scene and plate (blocked on SP4); T5 art (blocked on SP5, serialised); T6 guide/story/card; T7 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`). **Host (PLAN §6, wave 3, driver's call):** the `pilgrim-proto` tree (merged and live, clean but for four untracked files, art r64), branched from `origin/r75-boss-art` until r75 merges; **repoint `public/art` to the newest mirror first** (the `macalania-temple` plate and its JSON are in it).

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 5 | **1** | the AI is read; a quarter of an hour of live checks |
| B build | 9 | **8** | the four-state machine (M), the hit classifier and the three tiny seams (S to M), data and loot (S), plumbing (M) |
| A art | 6 | **6** | Spherimorph (3), the plate decision (1 to 2), cards and effects (1) |
| I integration and tests | 6 | **6** | the 12 to 15 shared tables (PLAN §7) |
| **Total** | **26** | **21** | |

## 12. Top risks

| Risk | Answer |
|---|---|
| The probe is not understood by a new player | the opening line and the banners say it, the guide teaches it; the counter spell shows in the HELP bar |
| The weapon-element read for physical hits is wrong, so the shift fires on the wrong hits | T2 pins the 17-command matrix; T0 reads the real equipment bits |
| A weakness hit in the engine raises no onHit for the shift (Scan has the same doubt) | T0 checks both |
| A Doublecast shifts on its first spell | the gate of `ai/hit-gates.ts` is reused and pinned |
| Tidus (Armored: 42 to 47) feels useless | by design (the game's own number); Armor Break and Auron are the fix; the guide says so |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about a quarter of an hour)

1. **Does a monster's cast of a player-side row spend its MP?** Read how the Keeper script's player rows are charged in the engine; mirror it.
2. **Is onHit raised for Scan on a Scan-immune target?** One engine test.
3. **Does the model show the current element?** Only the model data can say; irrelevant to the mechanics (SP7).
4. **The launch details** (the field-event gate, the defeat flag): not read; the chapter treats a defeat as the normal result screen.

## Corrections and findings (what the mapping turned up)

- The plan's "weakness that changes when hit": it changes **only when its weakness is hit**, to a uniform draw over all four (a quarter of the time the same).
- The plan's "the counter shows the weakness": exact, and it is the opposite element; the guides' "it counters every attack" is slightly off: a weakness hit draws no counter, it shifts.
- **Armored**, **Press below half HP**, the **Scan reply**, the **Doublecast rule** and the **aeon-on-the-field spell row** are in no guide and not in the plan.
- Samurai Gamers' MDEF 1, Evasion 1 and overkill AP 4,680 differ from the file's 0, 0 and 4,860 (RE §7).
