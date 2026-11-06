# Paper preflight: hidden chapter 36 (provisional) — Evrae Altana in the Via Purifico and Geosgaeno at Baaj Temple, the three swimmers (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md` and `docs/plans/ch-maesters-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 2, FFX lane, program row 36). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/re-ffx-geosgaeno-evrae-altana.md` (the research note; "RE §n" below), the program plan of the hidden chapters 34 to 64 (row 36, sections 6 to 9), `docs/plans/ch-keeper-review.md` and `ch-maesters-review.md` at `origin/main` (format), `docs/plans/ch-dark-aeons-review.md` and `ch-penance-review.md` (today's wave-1 method, section 7 of the first), `docs/handoff/re-parity-rc10-ffx-script-command-locks.md` (the swallow's command locks were already read there and left unbuilt), `research/ffx-evrae-airship.md` (the airship Evrae's rows and the Evrae Altana appendix), `research/ffx-isaaru-bevelle.md` section 6 (the Via Purifico story position). **Engine claims were read at `origin/main` (not the stale working tree); nothing was run, so rule 3 ("prove it by running the engine") is owed by T0 and T10.**

**Verdict: PROCEED on data, AI and the small seams now; HOLD everything Bailey will see or hear (plates, paintings, the music, the swallow's look) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench.**

## 0. What changes against the plan (read first)

1. **Geosgaeno is the Baaj Temple boss, not a Via Purifico one.** The plan's row 36 ("Via Purifico: Geosgaeno and Evrae Altana", arena "via-purifico flooded-sewer variant") conflates two places. Geosgaeno's formations launch from the Baaj Temple event; its second fight is the optional one before Anima's chamber. Evrae Altana is the Via Purifico boss. What they share is real (the trio, water, the Petrify shatter, the Boss Theme), so the bundle stands, but **the chapter needs two plates, not one, and a name that does not say "Via Purifico" alone** (working title "The Flooded Ways"; Bailey names it, section 9 GV1). [RE §10]
2. **The AI is read in full and it is small** (3,011 bytes of code for Geosgaeno, 1,285 for Evrae Altana, 343 for each Gate Lock; the plan's "170 / 179 KB" are file sizes dominated by model data). R is finished; what remains is 2 hours of live checks (section 13).
3. **The first Geosgaeno fight (`bjyt02_01`) cannot be won** (Tidus alone, three scripted turns), so it is not part of this chapter's estimate (GV2).
4. **The sourced party for both fights is Tidus, Wakka and Rikku**, not a convention: Geosgaeno's formation bars Escape, Flee and Switch for exactly characters 0, 4, 6, the Via Purifico's third area sets those three in slots, and Jegged says "Tidus, Wakka, and Rikku are the only ones who can swim". One build file serves both links.
5. **Evrae Altana is one monster in three formations with its HP carried through a persistent script variable**, and its counter exists only in the first two. The "three areas" are a chain-act pattern with one new rule (carry the enemy's HP, bring the party back), not three fights.
6. **The size barely moves** (section 11: 42 hours against the plan's 41), but it lands differently: less research, more build (the swallow-hold, the water rule, the area chain).

## 1. Game case and sources

**Game case: FFX only.** The fights are FFX's; nothing is imported by `src/battle/ffx2/**` or `src/data/ffx2/**` (an absence test pins it, as for the Keeper). New logic lives in new files under `src/battle/ffx`, `src/data/ffx`; the chapter registration in `src/data/encounters.ts` and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, and are left to the wave-2 integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m109`, `m120`, `m162`/`m171`, `bjyt02_01/_02`, `stbv00_10/_11/_12`, events `bjyt0200`, `stbv0000`, command rows | the records, the formations, the whole AI of all four monsters, the launch flags | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 `[run]` | exact tallies of the scripts' behaviour in the Atel interpreter | [run] |
| Jegged "Baaj Temple" and "Via Purifico"; Gamer Guides; Samurai Gamers; Game8 | the guides' account, agrees with the files except where RE §7 says | [guide] |
| `src/data/ffx/builds/gagazet.ts`, `highbridge.ts`, `fahrenheit.ts` | the repo's stat cells for Tidus, Wakka, Rikku at the two bounds | [estimate], build point sourced |
| GameFAQs, StrategyWiki | not read (HTTP 403); the tie-break was never needed | [RE header] |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**Link I, the Via Purifico (Evrae Altana, three areas).** Tidus, Wakka and Rikku are in the flooded tunnel under Bevelle. Everyone has Escape and Flee off and Switch off; each of them has a new command, **Open lock**. Evrae Altana is the undead Evrae: **16,384 HP, DEF 0, MDEF 0, a permanent Zombie, weak to Holy, nearly every status immune but Slow and Darkness at half strength.** Its turns alternate: **Stone Gaze** on one random living character (Petrify 50 and Sleep 50; **underwater, a Petrify that lands removes the character from the fight on the spot**), then **Photon Spray** (eight small hits, each on a random member), then Stone Gaze again, and so on, while all three are on the field; once one is gone it only sprays. In the first two areas **whoever damages it takes a counter Attack** (about 850 to 1,000 against the Gagazet cells). Two Gate Locks (500 HP each, immune to magic and to everything else) stand in the area; **Open lock on one removes it, and a plain hit should kill it as well (500 HP, DEF 0, not magic-immune to physical: inferred from the flags, not seen in play); when both are gone the area ends, the party and its HP carry over to the next area, shattered members return, and Evrae Altana keeps the HP it had.** The third area has no locks and **no counter**; there it is fought out. Healing hurts a Zombie: **two Phoenix Downs (8,192 each) or two X-Potions (the 9,999 cap) end the fight**, which the guides all say and the preset's own bag (30 Phoenix Downs, 4 X-Potions) can do. [RE §4.3, §4.4, §6.4]

**Link II, Baaj Temple (Geosgaeno, second fight).** The same three, in the waterway of the hidden temple. **Geosgaeno: 32,767 HP, Armored (plain physical hits cut to a third), weak to all five elements, Poison lands (3,276 per tick), Slow and most statuses immune.** It hits three times (Stone Punch, 1,140 to 1,440 each against the cells, Petrify 50 which shatters underwater; below half HP, 69 percent of those become KO Punch, Death 50 and Curse), then **Swallows one living character who has no Doom**: that character is out of the fight, untargetable, has every command disabled but **Struggle**, and Geosgaeno copies their statuses. Next turn it **spits them out**: **every front-line character, the swallowed one included, takes (the swallowed one's HP minus 1)**, and the swallowed one is left at 1 HP; with the Gagazet cells a full-HP Tidus swallowed means 2,419 to everybody, which KOs Rikku. **If the swallowed one Struggles, only they take their own HP (a KO) and nobody else is hurt.** After the first cycle the next swallow comes after 3 or 2 attacks. **Killing Geosgaeno while it holds someone deals 9,999 to the whole front line.** Elements, Rikku's gems, Wakka's Element Reels and Poison are the answer; Hastega and Stoneproof armour are the preparation. [RE §4.1, §6.3]

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`src/data/encounters.ts`, `battle/ffx/setup.ts`, `data/chapter-meta.ts`) get net-zero edits or a one-line hook; `battle/common/types.ts` and `encounters.ts` are contract files (additive, one `CONTRACT-CHANGES.md` entry each).

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | The AI of Evrae Altana: Gaze/Spray toggle on a front-line count, counter on HP lost, area-3 variant | **Existing pattern** (airship Evrae's counters, Dark Ifrit's counter) | new `ai/evrae-altana.ts` + `-rules.ts` | S |
| 2 | Photon Spray eight hits, per-hit retarget | **Existing** (the airship row of the same name, `random-enemy`) | data rows in `data/ffx/enemies/evrae-altana.ts` | S |
| 3 | A permanent **Zombie** monster where healing is damage, and Phoenix Down on it | **Partly**: the kernel negates healing for a Zombie target (`kernel/damage.ts`), monster auto-statuses exist (`auto-status.ts`); not proved for an automatic Zombie boss end to end | `kernel/auto-status.ts`, a bench case | S (T0 check) |
| 4 | **Gate Locks**: two hittable props, 500 HP, immune to everything, no turns, **Open lock** (a party Trigger Command aimed at them) that sets their HP to 0 | **Partly**: trigger commands with target lists exist (`TriggerCommand.targets`, airship Evrae's orders, `triggers.ts`); a *prop target that is a monster without a turn* has the Omnis-disc precedent (`ordersOnly`) but not a hittable one | new `ai/gate-locks.ts`, `commands.ts` (342 lines) net-zero | M |
| 5 | **The area chain**: both locks dead ends the area, the party and its HP carry, **the enemy's HP carries too**, shattered members return, the scene changes | **Partly**: the chain pattern exists (`aeon-duel.ts`, the Mirror Aeons chain, heal-between-acts); *carry the enemy's HP and restore the ejected party* is new | new `ai/via-purifico-chain.ts` | M to L |
| 6 | **In-water Petrify = Death + Eject at landing** (RE §2.2) | **New**: shatter exists for a hit on a Petrified target (`adapt/status-apply.ts:201`, `hit-apply.ts:334`); the water flag does not exist. An optional `EnemyGroupDef.inWater` read in the status step | `types.ts` (+1 optional field), `adapt/status-apply.ts` | M |
| 7 | **Swallow-hold**: an actor out of the fight (untargetable, not a cover or an ally target), its commands disabled with Struggle granted, statuses copied to the monster, the monster's max HP rewritten for one formula-16 hit, a kill-while-holding rule | **New**, with parts that exist: per-actor command disables (`formation-commands.ts`, `commandDisables`; the RC10 handoff lists Geosgaeno's 33 mid-fight calls as "not built, nothing to decide until a chapter fights them"), `user-max-hp` (formula 0x10 in `adapt/command.ts:44`, built for Mortibsorption), `scripted.ts#mortibsorption`, which rewrites a host's HP from a mount's maximum HP | new `ai/geosgaeno.ts`, `ai/geosgaeno-hold.ts`, a mid-fight `scriptCommandDisables` trigger | L |
| 8 | Geosgaeno's cycle: 3 or 2 attacks, a Doom-skipping swallow pick, a KO Punch coin below half HP, Struggle on hit, death with someone inside | **New logic, existing hooks** (`ai/hooks.ts`) | `ai/geosgaeno-rules.ts` | M |
| 9 | KO Punch's **Curse** and Stone Punch/KO Punch rows | **Existing** (`curse` status in `types.ts`) | data rows | S |
| 10 | The stat/Armored/weak-to-all rows of Geosgaeno | **Existing** (Armored rule in the damage kernel, `elWeak` bits) | `data/ffx/enemies/geosgaeno.ts` | S |
| 11 | Loot records for m109, m120 | **New data**, `data/ffx/loot/records.ts` pattern | | S |
| 12 | Switch off for the trio, Escape/Flee off, Open lock granted per area | **Existing** (`formation-commands.ts`) | formation data | S |
| 13 | HUD: the Struggle prompt for the held character, the swallow/transfer banners, the Open-lock target picker, an area marker | **New UI, existing precedents** (the Omnis readout; the banner strings the formation prints) | `ui/ffx` | M |
| 14 | Presentation: three area plates/camera sets, the Baaj waterway, swim poses (or a bubble layer), the swallow animation, the shatter, the lock opening | **New** | `scenes`, `engine` | M to L |
| 15 | Chapter plumbing: new `ChapterId`, `Chapter.number` 36, meta, story, door word `geosgaeno`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 6 and 3 are T0 checks (small, independent); 4 and 5 before the Evrae AI is playable end to end; 7 before 8; 13 after 7.

## 4. The party

- **Sourced line-up:** Tidus, Wakka and Rikku in both links. **No bench**: Switch is off for all three and the game's party is exactly three. [RE §2.3, §2.5]
- **Build point:** the repo's Gagazet cells (`gagazet.ts`, the cells Chapter X's Highbridge copies as its measured upper bound), `[estimate]`: Tidus HP 2,420 DEF 20 MDEF 18 AGI 30, Wakka 2,530 / 20 / 16 / 17, Rikku 1,540 / 15 / 15 / 32; Rikku's MP pinned at Chapter VIII's 130 as in Chapter X. The Fahrenheit cells (Tidus 1,265, Wakka 1,430, Rikku 880) are the lower bound for the Via Purifico link. **Recommended: one new file `data/ffx/builds/swimmers.ts` as a spread of the Highbridge members 0, 4, 6 for both links**, because Baaj Temple's natural point is later than Gagazet and Chapter X measured its midpoint party at 8/200 wins and the upper-bound party at 116/200 (its header, `highbridge.ts`). Alternative: two builds (Fahrenheit cells for Link I). The bench decides within the sourced range.
- **The kit already carries the sourced answers:** Wakka's `element-reels`, Rikku's Use/Mix/Steal, Tidus's Haste and Hastega, Fire/Ice/Lightning/Water Gems x10, Poison Fang x5, **30 Phoenix Downs and 4 X-Potions** (the two-item kill), Al Bhed Potions x17, Holy Water, Remedy. **Stone Ward/Stoneproof armour is not in the cells' armour**: Chapter X carries Rikku's Stone Ward from Chapter VIII; Tidus and Wakka need it added (the guides' standing advice). `[estimate]` until measured.
- **Gaps, none of which this lane fills (rule 6):** the Overdrive gauges at each link, the exact bag, the armour abilities. All `[estimate]`, never tuned toward a result.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). Evrae Altana with 30 Phoenix Downs in the bag is a two-item fight: **the bench will say so and the chapter must not hide it** (options to Bailey: the bag's stock is the preset lever, as the Mirror Aeons chain's bag was; a lower bound for the Phoenix Down count is the guides' own "two").

## 5. The arena

- **Link I (Via Purifico).** `public/art/backdrops/via-purifico.png` (+`@2x`, sidecar) is Isaaru's dry chamber (red-lit stone, a colonnade), the picked option O-3 A of Chapter XIV; the flooded tunnels where Tidus's half goes are different rooms. Options (end state first, rule 9; a mockup at real resolution each, owed before building): **(a)** three variants *derived from the existing plate* (water line, caustics, blue-green grade, a gate in the middle ground), one per area, 0 new from-scratch plates; **(b)** three new plates, one per area (the gate-lock layout differs per area); **(c)** one new flooded plate reused for the three areas with a HUD area marker. **Recommendation (a), then (b) for any area whose derived frame fights the painting.** The three areas are different places in the game (the map centres and positions differ), so (c) is the cheap fallback only.
- **Link II (Baaj Temple).** **No plate exists.** Options: **(a)** one new plate "baaj-waterway" (an underwater ruin, pale stone and green light, the pool the guide describes); **(b)** the flooded Via Purifico variant with a different grade as a stand-in, flagged. **Recommendation (a)**; (b) if the lane is short of GPU time.
- **Rigs:** the existing scenes have camera rigs solved against a flat matte; a water battle with swimmers needs the characters to read as swimming (GV8). No phone rigs exist for `via-purifico`; the new plates need a 390 x 844 solve as part of the picks.
- **The in-water flag is a rule, not a look**: the engine change of row 6 applies whatever plate is drawn.

## 6. New art needed

Counts are images. Poses follow the repo's boss sets: idle, attack, cast and hurt; ko where the body stays.

| Asset | Images | Note |
|---|---:|---|
| **Evrae Altana** | 5 sets x scales | **Recolour of the existing `evrae` set** (`idle`, `idle-near/far`, `attack`, `breath-charge`, `hurt`, `ko`, each at 1x to 4x): desaturate to bone and green, add exposed-rib and rot overlays. A recolour keeps the airship Evrae's silhouette; the game's Altana is a different, skeletal model (`m120` is its own file), so this is a **flagged compromise** (GV5) |
| **Geosgaeno** | 5 to 6 | new: idle, attack (the punch), swallow (cast, jaws open), hurt, ko ("Boss": the body stays), and a closed-mouth "holding" idle |
| **Gate Lock** | 2 | one painting serves `m162` and `m171` (the same model word 0x10A2): closed, opened/broken |
| Tidus, Wakka, Rikku | 0 | exist (`characters/tidus`, `wakka`, `rikku`); swim poses are GV8 |
| Area plates | 3 derived (+1 new Baaj) or 4 new | section 5 |
| Swallow/spit-out and shatter effects | 2 | may be drawn in code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 12 to 14 images plus plates** | |

Retail references are allowed since 2026-10-18 (hard rule 8) but the painting that ships must match the approved painted look (rule 9). ComfyUI wall time serialises through RIG-RECORD; nobody queues a render here (rule 12). **Bailey alone approves a painting.**

## 7. Music (rule 13: only his ears judge)

The game plays the Boss Theme (BGM 12) for all five launches. Stand-ins (flagged, the driver's pick): `boss-evrae` for Link I (the same monster family; the airship cue is a ship figure that fits the airship, so this is the weaker pick), `battle-ffx` as the neutral fallback for both links; a scene bed from `scene-bevelle-underground` (FFX-2's cathedral, the wrong game) is **not** used. Recommendation: **`battle-ffx` for both links**, an audition page entry for Bailey. Alternative: one new ElevenLabs take per link under the standing delegation (needs the driver's spend note; rule 11).

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**Target (the chain's band):** the advisor's line wins **about 70 percent per link** (60 to 80 accepted), the Dark Aeons plan's wording. **Levers, in order:** the bag's Phoenix Down and X-Potion stock; the party's Evasion and Luck cells inside the sourced range; Stone Ward on the right pieces; the Overdrive gauges at arrival; Hastega at the start. **Never** the monsters' numbers.

**Predictions from the arithmetic (to be falsified by the bench, not promises):** Link I is **very easy for the informed line** (two Phoenix Downs end it; against an uninformed party, the Gaze coin-flips cost a member in each Gaze: 50 percent per Gaze to lose a member for the area, which the Open lock mends). Link II is the hard one: a physical party does a third damage (Armored), a swallowed Wakka at full HP spits 2,529 on each of three people with 1,540 to 2,530 HP, and the only safe responses are **Struggle at once** (a KO, then Phoenix Down) or having the swallowed character's HP below the others'. The bench must run both the Struggle line and the "wait" line and report each.

**Tests (T0 first, T10 last):** T0 the engine checks of section 3 rows 3, 6, 7 (the water shatter, an automatic-Zombie boss, a rewritten max HP in formula 0x10); T1 the data fixture (the RE note's tables); **T2 the AI rules with the interpreter's exact tallies as pins: Geosgaeno KO Punch 45,200 of 65,536 below half HP, 3 attacks on an even draw and 2 on an odd one, Doom skip, Struggle damage = victim HP, death-with-holder = 9,999; Evrae Altana Gaze/Spray alternation, the front-line-count rule, the counter in areas 1 and 2 only**; T3 the chain (HP carried, shattered returned, locks); T4 the HUD; T5 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, ablation for any mover); T10 the integration and the sources' check. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| GV1 | Shape and name | **One chapter, number 36, door word `geosgaeno`** (PLAN §8; checked against the 15 words and `pilgrim`), **two links in story order: Link I Evrae Altana (three areas, one HP), Link II Geosgaeno (Baaj, second fight).** Working title "The Flooded Ways" (Bailey names it) | Two chapters (an extra number from the planner); Geosgaeno first |
| GV2 | The scripted first Geosgaeno (`bjyt02_01`) | **Not built**; the guide and the card describe it (it is a three-turn scripted loss; RE §4.2) | A scripted prologue act (Tidus alone, three turns, Half HP twice, ends by script; about +4 hours) |
| GV3 | Party | **Tidus, Wakka, Rikku fixed, no bench** (sourced, RE §2.3) | none; the sources do not allow another trio |
| GV4 | Build | **One file `swimmers.ts`**, the Gagazet cells as Chapter X, Stone Ward added on Tidus and Wakka, the preset's bag; the bench may lower the Phoenix Down count if Link I is trivial | per-link builds (Fahrenheit cells for Link I) |
| GV5 | Evrae Altana's look | **Recolour/overlay of the `evrae` set** (cheap, flagged) | a new skeletal painting (5 poses, +3 hours of art) |
| GV6 | Geosgaeno's look | **New painting**, 5 to 6 poses | none |
| GV7 | Gate Lock | one prop painting, two states, hittable | an HUD-only icon (not faithful: the locks are targets) |
| GV8 | Underwater read | **Existing standing poses over the plate plus a bubble/caustic FX layer**, and the card says the party swims | swim-pose repaints of Tidus, Wakka, Rikku (+6 sets, a large art cost) |
| GV9 | The shatter | **Faithful**: Petrify underwater removes the character on landing; the card states it; Stone Ward is in the build | a softened version (not faithful; refused unless Bailey asks) |
| GV10 | Evrae Altana and the two-item kill | **Faithful and disclosed**: no nerf; the bag is the lever | a smaller bag |
| GV11 | Music | stand-ins of section 7 | new takes |
| GV12 | The areas | a chain act per area, the arena options of section 5 (a) | one scene with an area marker |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**,src/ui/ffx/**` was **not run** (treeless lane); by the Keeper preflight's reading (§10 there) the same rows apply: the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**, so expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship the wave-2 chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 3, 6, 7) and the shared hooks; T1 data + loot; T2 the Evrae Altana AI and the Gate Locks; T3 the area chain; T4 the Geosgaeno AI and the swallow-hold; T5 the build + bench; T6 scenes and plates (blocked on picks); T7 HUD; T8 art (blocked on picks, serialised); T9 guide/story/card; T10 the integrator (shared tables, tests, the door word re-check with `door-check.mjs`). **Host (PLAN §6):** a clean merged-and-live tree (its old `ch-maesters` branch), branched from `origin/r75-boss-art` until r75 merges; its `public/art` points at an older mirror, so the release-75 art tests fail there by design.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 9 | **2** | the AI is read; two hours of live checks (section 13) |
| B build | 18 | **22** | the swallow-hold (L), the water rule, the chain with carried enemy HP, the lock props and their trigger, three AIs and two chain links |
| A art | 6 | **10** | Evrae Altana recolour (2), Geosgaeno (3), lock (1), three derived plates and one new plate (3), cards and effects (1); ComfyUI wall time is separate |
| I integration and tests | 8 | **8** | the 12 to 15 shared tables (PLAN §7) |
| **Total** | **41** | **42** | no change to the wave order |

## 12. Top risks

| Risk | Answer |
|---|---|
| The swallow-hold touches targeting, commands, statuses and damage at once | slice it: T0 the max-HP-rewrite hit alone, then the hold, then the AI |
| Evrae Altana is trivial with the preset's bag | disclose; the bag is the lever; never tune the monster |
| Shatter-on-landing reads as unfair | the card says it; Stone Ward in the build; the guide teaches it |
| The area chain forgets the shattered members or the carried HP | pins on the area boundary (T3): HP before/after, members before/after |
| The two places need two plates and the GPU is serialised | derive three plates from the existing one; one new Baaj plate |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about 2 hours)

1. **Do the shattered members return at the next area, and with what HP?** (RE §4.3: the guides say they do; not traced.) Settle by reading the area-boundary party restore in `stbv0000` @0x433F to @0x4A29 and the game's roster restore, or by one captured playthrough.
2. **Does a Phoenix Down thrown at Evrae Altana draw its counter?** (the script tests HP lost, not the command.) A mock of the real bytecode with a Phoenix Down's hit record settles it.
3. **What do properties 128, 261 and 338 do?** Read the property table around their readers.
4. **Does the engine's Zombie rule treat an automatic Zombie boss the same as a status Zombie?** (T0.)
5. **The first-fight AP** (Samurai Gamers prints 1; the record says 4,200): irrelevant to the chapter, relevant to the guide.
6. **The camera/stage ids of each formation** (not read): needed only if a plate is matched to the game's own framing.

## Corrections and findings (what the mapping turned up)

- The plan's "D-090 is a scope line for Natus, not a rejection" is right: `docs/target/decisions.json` D-090 and `docs/plans/chapter-natus-review.md` B14 say only "do not stage Evrae Altana inside the Natus chapter"; the Via Purifico fight has no decision against it.
- `docs/handoff/re-parity-rc10-ffx-script-command-locks.md` already read Geosgaeno's 33 command-lock calls and left them "not built; no chapter fights it": this chapter is that chapter, so the generic path (`scriptCommandDisables` rows set mid-fight) is built here, for the held character.
- `research/ffx-evrae-airship.md` §3.5 holds an Evrae Altana appendix from the community tables ("Counter acc 90, Photon Spray MAG base 4 x8, Stone Gaze base 16"); the files agree on every number there.
