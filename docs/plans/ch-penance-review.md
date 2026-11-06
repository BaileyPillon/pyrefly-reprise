# Paper preflight: Chapter XXXV (hidden) — Penance and its two Arms, on the airship deck (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no browser.** The only things run are the reverse-engineering program's Atel interpreter and the repo's own damage and clock kernels, for `research/re-ffx-penance.md`.

Written 2026-11-06 by a Sonnet sub-agent of the release driver, tree `ch-penance` (from `origin/r75-boss-art` b98906229). Authority (the driver's brief quotes Bailey): *"implement all unimplemented chapters please"* (2026-11-06 ~00:30 EST), *"yes on all these too"* to building Penance, the Dark Aeons and every researched boss he never picked (~00:55 EST), and *"you make the executive decisions for the next few days. i'll go with all of your recommendations."* (2026-10-31). Every pick below is therefore **"the driver's call, his to overturn"**, with the alternative named.

**Read:** `research/re-ffx-penance.md` ("RE §n" below), `research/re-ffx-yojimbo-sisters-feasibility.md` §7 (8892f8f6), `docs/handoff/ch-mirror-aeons.md` (the party and difficulty method of Chapter XXVII, D-884 and D-887) and `docs/plans/ch-mirror-aeons-bench.md`, `docs/plans/ch-keeper-review.md` and `docs/handoff/ch-keeper.md` (the multi-part template), `docs/handoff/ch-gui.md` (parts that grow back), `src/battle/ffx/{engine-end,hp,adapt/ctb,adapt/hit}.ts`, `src/battle/ffx/ai/{hooks,types,sinspawn-gui-rules,mount-revive}.ts`, the door table.

**Verdict: PROCEED on data, AI and plumbing; HOLD the paintings and the stage layout until the art route (§6) and the layout pick (§7) are taken as the driver's call and shown in a faked frame (rule 9); HOLD any claim about how hard the fight is until the bench (§9) has run.** One piece the sources call for is not in the repo: the Celestial weapons (§3 row 6, §12 risk 1). It is the fight's biggest risk and the only large data dependency.

## 1. Game case and sources

**Game case: FFX only.** Penance exists in the International and HD Remaster releases of FFX only (RE header, rule 14). The chapter's data live in `src/data/ffx`, its rules in `src/battle/ffx`; the shared plumbing (registry row, door row, scene row, one optional build field, one optional hook) is "both" in kind (CHK-020) but inert for every other chapter, with an absence test and the three goldens (`ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`) unchanged as the proof.

| Source | What it gives | Tag |
|---|---|---|
| `m344`, `m345`, `m346`, `hiku15_70`, `monmagic1.bin`, `monster3.bin`, `weapon.bin` | the records, the 14 rows, the formation and its start positions, the whole AI of the three actors, the Celestial weapon rows | [bytes] (RE §1) |
| Atel interpreter run | the AI's rules as exact tallies and timelines | [run] (RE §5) |
| The repo's damage and CTB kernels | damage on a capped party, the clock numbers | [derived] (RE §4.2, §5.3) |
| Jegged, GamerGuides, eip.gg, Game8 | the strategy, the figures to check against | [W] (RE §8; every figure agrees with the bytes) |
| GameFAQs | the walkthrough and boards were not fetchable (403); read only through a search summary | [W, summary only] |

## 2. What the player experiences, turn by turn (plain words)

Every rule below is the game's own (RE §3 to §6) unless tagged `[derived]` or `[inferred]`.

**The set-up.** The Fahrenheit's deck. Far off and high, Penance: a colossal armoured figure, 12,000,000 HP, Protect on. Left and right of it, a hand each, the **Right Arm** and the **Left Arm**, 500,000 HP apiece. All three absorb Fire, Ice, Thunder, Water and Holy (an elemental spell heals them); Break, Sleep, Slow, Petrify, Death and the rest do not land. Escape is open in the game; the chapter has none (§11, P6). The player's three stand on the deck.

**Phase 1.** Penance's turn is always **Obliteration**: a physical blow on all three, about 21,000 to 24,000 against full defence (about 10,500 to 11,800 under Auto-Protect, 7,000 to 7,900 with five Cheers on top) and Slow (Auto-Haste is immune). The arms take their own turns from the start: the Right Arm petrifies with a plain hit (about 31,000 to 35,500 unbuffed), inflicts a pile of ailments with Calamity (Poison, the four Breaks, Silence, Darkness, Curse) or **casts Mighty Guard** on Penance and itself (Shell, Protect, Regen: Penance then heals about 46,975 HP a tick until the Regen is dispelled); the Left Arm strips every buff and Auto-Life with its hit, takes three quarters of everyone's maximum HP with **Tera Graviton** (and Sleep, Silence, Darkness, Slow, Doom in five turns), or slows the party. Each arm picks one of three, evenly. On its first turn an arm raises Strength and Agility to 255, and from its second it takes Haste at the start of every turn.

**The change.** The first damaging action that leaves Penance **below three quarters** (9,000,000) makes it split: it uses Separation, the lower half falls away (the painting changes), **Protect comes off**, and it is **Hasted for one turn**.

**Phase 2.** Its turn is now **Immolation** on one random member: about 28,000 to 31,500 (14,000 to 15,800 under Auto-Protect), takes all that member's MP, and inflicts **Armor Break and Mental Break**. An Armor-Broken member takes the 99,999 cap from the next physical hit, so each Immolation wants a **Dispel** (Yuna's white magic).

**The clock that decides the fight.** A hidden counter adds 1 on each of Penance's phase-2 turns and 1 on every damaging action that reaches it. **At 20 or more, on a turn where both arms are up, Penance uses Judgment Day: 99,999 HP and all MP to everyone**, which no stat, buff or armour answers, and a member at 99,999 maximum HP dies too; only an Auto-Life revive keeps the party in the fight. If an arm is down at that moment, it uses Immolation instead and the counter stays spent-up, so **the first turn with both arms up is the Judgment Day.** The whole fight is the dance this makes: keep **at least one arm down at every Penance turn**.

**An arm that falls comes back.** At death an arm acts out Atrophy, is made whole again (full 500,000 HP, statuses gone) but hidden and untargetable; it comes back **12 ticks later** (RE §5.3, `[derived]` from its re-initialised Agility 150: tick speed 4, three times), with a Regeneration, and acts the turn after. Penance's own turn is 9 ticks (one Hasted turn at the change is 4). So an arm is down for one Penance turn, sometimes two. The tidy way: kill one arm, and just before it returns kill the other. Each arm pays its AP and drop again at every death, which is why the arms are the game's Master Sphere farm; this chapter keeps that quietly (§11, P9).

**The win.** Penance's HP reaching 0 ends it: it forces its own Death and both arms fall with it. It pays 60,000 AP (65,000 on an overkill of 99,999 or more in the killing action), no gil, three Master Spheres (six on an overkill), and a piece of gear that can be a Break Damage Limit weapon or a Ribbon (RE §7). **The loss** is the usual one: all three down.

**The design fact `[derived]`.** The fight has no HP puzzle and one timing puzzle. 12,000,000 HP is 121 capped hits and an arm is six; what the player manages is *which part to hit when*, the Dispels, the Cheers and the potions. The guides' "20 to 30 minutes" is that dance, not attrition.

## 3. Engine work

Each row is mapped onto `origin/r75-boss-art` b98906229, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`src/data/encounters.ts` 399, `src/data/chapter-meta.ts` 399, `src/battle/ffx/setup.ts` 399, `src/battle/ffx/engine.ts` 395): all new logic in new files, host edits net-zero or one-line.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Three `EnemyDef`s and one group: body (two forms: whole, split), two arms `flags.isPart` + `partOf`, `doomTurns: 200` on the arms, `zanmatoLevel` 6, immunity and affinity blocks from RE §3, `canMiss: false` on every row | **New data**, pattern: `enemies/dark-aeons.ts`, `sin-fins.ts`. The victory test already reads only non-part fighters (`engine-end.ts` 200 to 201), so marking the arms parts makes "Penance alone has to fall" with no engine change | new `data/ffx/enemies/penance.ts`, `penance-abilities.ts`, `penance-ids.ts` (ids only, no imports), joined in `enemies/hidden-ffx.ts`; `command-records/enemies.ts`; the two data tests (`data-ffx-command-records` counts: 9 new records) | M |
| 2 | The 13 rows the scripts call, with their command records word for word: 9 new (Obliteration, Immolation, Judgment Day, Separation, Death, Regeneration, Atrophy, Tera Graviton, Mighty Guard), 3 that already exist as Dark Aeon rows (Calamity, the 0x4127 Attack, the dispelling 0x412B; `dark-aeons-abilities.ts`), and Slowga, the player's row 0x3039 (the existing CTB-class `slowga` pattern). Attack 0x4000 and Appearance 0x4123 are in the lists and no hook calls them | **New data**, pinned to the kernel fixtures as the Mirror Aeons rows are | as row 1 | S |
| 3 | Penance's script: phase test (strict `< (max*3)/4` on the first damaging hit), Separation, Protect off, Haste counter 1, Obliteration / Immolation / Judgment Day, the counter (+1 per own phase-2 turn, +1 per damaging hit), the gate on the two down flags | **New**; hooks exist: `ScriptHooks.onHit` with `HitReport.lastDamage` and `lostHp` (`ai/hooks.ts` 41 to 56), `listensToHit`, pre-turn handlers; battle variables ride `state.flags` as the Gui chapter's do. The phase change is a **form switch** (`forms.ts`, as Natus and Yunalesca change form) so the painting follows | new `battle/ffx/ai/penance.ts`, `penance-rules.ts` (every constant with its RE row), registered in `ai/index.ts` | M |
| 4 | The arms' scripts: turn counter with the turn-1 and turn-2 writes, the three-way roll (stream 2, `mod 3`), the Regen test on Penance, Mighty Guard's group (all monsters minus the Left Arm while it is down), the Left Arm's "any member not slowed" test | **New**; `findMatchingChr`-style picks exist (`ai/game-rolls.ts`) | `penance.ts` | M |
| 5 | **The arms' revival**: a death hook that runs on every death (a hit, Doom), re-initialises the arm (HP, MP, statuses, stats back to the record: `restorePart`, `hp.ts` 384), hides it, makes it untargetable, **keeps it in the clock** with a 12-tick wait, and on its next turn shows it and clears the down flag | **Partly.** `restorePart` + the `part-restored` event + `flags.hidden` / `untargetable` exist; a hit death can ride `holdsDeath` plus `onHit` (`mount-revive.ts`, the Gui arms) but there is **no `onDeath` hook** and a Doom death never reaches `onHit`. Macalania polls after every action for the same reason (`ai/macalania-acts.ts` 7). Recommended: one additive optional `ScriptHooks.onDeath` called from `koActor` (contract note), the first user of which is this chapter; the clock part reuses the Keeper's idle-cycler path (`adapt/ctb.ts` `isIdleCycler`, `takesPart`) and needs a **live check that a hidden arm still takes its turn and is absent from the CTB list** (RE §10 item 2) | `ai/hooks.ts` (+1 optional member), `hp.ts` (+1 call), `adapt/ctb.ts`, a rules file; `ui/ffx/CtbList.ts` (hidden filter, if missing) | L |
| 6 | **Celestial weapons**: the seven final Celestial rows (RE §6.5: formulas 0x11, 0x12, 0x13, power 16, Break Damage Limit built in) as an additive optional `weapon: {formula, power}` per `FFXMemberBuild`, read by `adapt/hit.ts` 199 to 201 (today every weapon is formula 1, power 16) | **Partly.** The kernel already has 0x11 to 0x13 and tests (`kernel/damage.ts` 251 to 258); the build field and the data rows are new. Default stays 1 / 16, so every other chapter is byte-identical (the goldens prove it). Without this row the arms do not die in six hits (RE §0) and the fight is 5 to 10 times longer (§9 prediction J2) | `battle/common/types.ts` (+1 optional field, `CONTRACT-CHANGES.md`), `adapt/hit.ts` (net zero), new `data/ffx/builds/celestial-weapons.ts`, `tests/unit/celestial-weapon-rows.test.ts` | M |
| 7 | The chapter's party: Tidus, Yuna, Rikku; caps; Luck 85; Jegged's four armour abilities; Celestial weapons; the bag; five story aeons | **New data**, derived from `builds/mirror-aeons.ts` (`ENDGAME_CAPS`, `aeonStatsFromYuna`) with the roster and armour changed | new `data/ffx/builds/penance.ts` | S |
| 8 | Chapter plumbing: `ChapterId` `'penance'`, `ListedChapterId` excludes it, `Chapter.number` 35, meta, story, door word, guide, advisor line, scene row, `critic/runner/lib/route-pure.mjs` door word, `SCENE_BACKDROP_FILE` | **New**, the Keeper's list (`ch-keeper.md` §3). `encounters.ts` is at 399 lines: three edits on existing lines, so the number union (today ending at 32) is a **merge-conflict line shared with the two sibling lanes' numbers 33 and 34**: integrate them in order, one line each | `data/chapter-penance.ts`, `chapter-meta-penance.ts`, `story/scripts/penance.ts`, `scenes/penance.ts`, `app/screens/frontend/judgmentDoor.ts` + `chapterDoors.ts`, `engine/pyreflyCanon.ts`, `engine/tactics/lookup.ts` | M |
| 9 | The tests that force a decision for every new chapter (the Keeper handoff lists them: `chapter-doors`, `chapter-numbers`, `critic-route-doors`, the neighbour lists in `gagazet-door`, `summon-door`, `yojimbo-door`, `r62-auron-turn-order-tip`, `audio-music-batch2`, `scene-backdrop-file`, `party-stature-chapters`, `chapters/exp-fayth`, `parity-ffx-loot-data`, `data-ffx-command-records`) | **New answers**, each stated and pinned | the listed tests | M |
| 10 | Loot: Penance's and the arms' rewards (AP 60,000 / 10,000, Master Sphere x3 / Dark Matter or Master Sphere, steals) | **Partly.** The feasibility note has the drop and steal rows [bytes]; the loot-record digest of `m344` is not in the repo (the Keeper joined as a body without a loot record, rule 6): record what the files say, pay the rest from the data rows | `data/ffx/loot/records.ts` pattern | S |
| 11 | Escape and Flee | **Existing** (`rt.canEscape` defaults false): the chapter has no Escape, a departure from the game, which does not disable it (RE §2) | none | none |
| 12 | Presentation: three painted parts and their poses, the Separation beat, the arms' vanish and return, Judgment Day's full-screen effect, the CTB list with a hidden arm | **New**, see §6 and §7 | `scenes`, `engine`, `ui/ffx` | L |

**Order of dependence:** 1 and 2 before 3 and 4; 5 before the arms' script can be tested end to end; 6 is independent and can land first (it is the byte-identity risk); 8 and 9 last.

## 4. The party

| Choice | Value | Source |
|---|---|---|
| Line-up | **Tidus, Yuna, Rikku** on the field; Auron, Wakka, Kimahri, Lulu on the bench, Switch open | the sources' actions, not a named trio: Quick Hit (Tidus) for every attack on the body, Dispel after each Immolation (Yuna), Ultra Nul-All and Quick Pockets (Rikku): Jegged, Game8, eip.gg `[W]`. **A driver's call** (alternatives: Tidus, Auron, Rikku; Tidus, Wakka, Yuna) the bench re-reads (§9). Lulu is left out because every black spell is elemental and Penance absorbs all five |
| Stats | HP 9,999, MP 999, the seven other stats 255 | Jegged Stat Maxing (`builds/mirror-aeons.ts` `ENDGAME_CAPS`), GamerGuides ("max stats") `[estimate]` for the whole party at the caps, `[W]` for the cap |
| Luck | **85** | Jegged, Penance page: about 85 in total is enough that plain attacks never miss `[W]` (the arms have Evasion 120) |
| Armour | Auto-Haste, Auto-Protect, Auto-Potion, Defense +20 percent on all three; **no Ribbon, no Break HP Limit** | Jegged `[W]` (neither Break HP Limit nor Ribbon is needed). Auto-Haste is Slow-proof; Defense +20 percent is the ability that takes 20 percent off incoming physical damage (`types.ts`), so Immolation under Auto-Protect, Defense +20 percent and five Cheers is 7,453 to 8,416, below 9,999 (RE §4.2). The alternative is the **Break HP Limit variant** (HP 99,999; eip.gg, GameFAQs boards) which survives three Immolations and still dies to Judgment Day and to an Armor-Broken hit: the bench's second lever |
| Weapons | **The Celestial weapons** (RE §6.5), Break Damage Limit built in | Jegged, Game8, eip.gg, GamerGuides `[W]` all say Celestial; the rows are `[bytes]` |
| Aeons | the five story aeons (as `dreams-end.ts`); **Yojimbo, Anima and the Magus Sisters left out** | the Dream's End default "assume absent". A landed Zanmato ends the fight (it needs no Death roll; GameFAQs summary, `research/re-ffx-zanmato-and-orders.md` §3) at about one Pay in four at 1,000,000 gil, so Yojimbo in is a coin flip around the arms and the Sisters bring Chapter XXVII's whole order machinery. **A driver's call, his to overturn.** Elemental aeon attacks heal Penance, so the aeons are mostly Bahamut's and a shield |
| Bag | `dreams-end.ts`'s bag with X-Potions raised, the weaker Potions out so Auto-Potion reaches for an X-Potion, and Three Stars | Jegged `[W]`; counts `[estimate]` (the bench's lever) |
| Pre-battle | five Cheers on the party, or Rikku's Ultra Nul-All Mix | Jegged, Game8 `[W]`; a Mix is existing (`data/ffx/mixes/abilities-wards.ts`) |

## 5. The arena

**The deck.** The formation is in the airship map `hiku15` next to the Evrae fight, with the party where the Evrae party stands and the giant 125 units off and 63 above (RE §2). The preflight reuses **Chapter VIII's deck plate** (`scenes/evrae-airship-deck.ts`, scene key `evrae-airship-deck`): 0 new plates, `SCENE_BACKDROP_FILE` maps the new scene key onto the existing file. One guide has Penance spawn in the Calm Lands; the files say the airship map, and the repo has no Calm Lands plate. `[inferred]` — the arena identity is not proved (RE §10 item 1).

**Enemy staging** (`scenes/penance.ts`, `enemySpots`, `figureHeights`): the body far and high on the right, the arms either side of it at the party's depth, per the start positions (RE §2: Penance (-150.8, 63, 90.1), Right Arm (-146, -8, 40.1), Left Arm (-150.7, -8, 138.9)). The on-screen size is `[estimate]` until a stature read of `m344` to `m346` (the Keeper's note asked the same; ask RE with the live checks).

**Multi-part targeting.** The engine already finds figures that are not in the usual arc: the Sin fins and core are parts with positions, the Omnis discs are figure-less combatants on floor anchors that the cursor still finds (`scenes/garden-of-pain-discs.ts`, `engine/OmnisDiscTap.ts`), the Keeper's platforms are places people stand. Penance needs **none of the new machinery**: three visible, targetable enemies is an ordinary group; the one new rule is that a reviving arm is hidden and untargetable (`flags.hidden`, `untargetable`, which `predicates.ts` 93 and `targeting.ts` honour) and returns. What must be seen: the cursor skips a hidden arm; an all-enemies spell does not reach it; the target card names the part ("Penance", "Right Arm", "Left Arm"); Scan on an arm works.

## 6. New art needed

Counts are images. The painted set follows the Keeper's and the Maesters' (idle, attack, cast, hurt, ko; idle@2x).

| Asset | Images | Note |
|---|---:|---|
| **Penance, whole** (phase 1) | 5 | idle, attack (Obliteration), cast (Judgment Day charge), hurt, idle@2x. Look = the pick in §7 (P7) |
| **Penance, split** (phase 2, lower half gone) | 4 | idle, attack (Immolation), hurt, ko ("Boss" death: the body stays), idle@2x |
| The Separation beat | 1 | the lower half falling away, one prop sprite; the swap itself is a form change |
| **An arm** (one set, mirrored for the other: both share model 4441) | 6 | idle, attack, cast (Tera Graviton / Mighty Guard / Calamity), hurt, ko (Atrophy), regen (the return) |
| Portrait (target card, results), pause hero plate, chapter card, thumbnail | 4 | from the same pick; the card and thumbnail are unread by code today (`thumbnailKey` is a dead field) |
| Backdrop | 0 | the Evrae deck plate |
| Effects | 0 to 2 | Judgment Day's full-screen effect and Immolation / Obliteration read from the existing FX library (`public/fx`); a painted decal only if the frame needs it |
| **Total** | **about 20 to 22** | plus 2 if the effects want decals |

- **Route (the driver's call):** painted billboards generated on the local ComfyUI (port 8188, art generation is ON for this program), the game's own model renders as pose references (retail references are allowed since 2026-10-18), then a pose-gate pass (`node tools/pose-gate.mjs --report`) because the pose-swap classes CHK-026 and 027 fail in 7 of 19 chapters today. The painting that ships must match the approved painted look (hard rule 9; "new art matches the game's art"). **The alternative** is the real FFX model through the 3D teardown (`ffx3d`), as the Fayth and Bahamut hidden chapters do: it would be desktop-only (`chapterDoors.ts` `desktopOnly`), and Bailey judges a rig in motion before it goes on (D-1378, D-1401). Not recommended for a first build of a giant that mostly stands still.
- **Stand-ins until the paintings are installed:** the boss-silhouette placeholder the Keeper used on r74, so the chapter can ship hidden with grey figures if the art is late (the Keeper's live check logged the cost: two console errors for the missing idle).

## 7. Presentation needs, and three layouts for the faked frame

**What is new on screen** (perceivable, so a pick first, rule 9): (1) a giant and two hands as three targets, (2) the split at the change, (3) an arm that vanishes and returns, (4) Judgment Day, (5) a readout of the one thing that matters, **whether Penance may use Judgment Day now**. The game shows none of it; a player learns the arms by dying once. The Omnis discs' readout strip (`ui/ffx/OmnisReadout.ts`, a landscape and a phone variant) is the precedent for a small strip; the 1600 x 900 HUD safe areas of the Keeper plan apply unchanged.

- **Layout A, "The giant over the bow" (the game's geometry).** The body fills the upper right of the frame, the arms are two large hands rising from below and beside it, the party in its usual arc on the deck. No new panel; the arms' states are on the CTB list and the cursor. Strengths: it looks like the game. Risks: a large painting under the HUD rails, the hidden arm leaves a hole in the frame.
- **Layout B, "Three columns".** Body in the middle, arms flanking at equal size, the party below. Reads at any size, the phone fits; not the game's geometry.
- **Layout C, A plus a two-pip strip.** A with a small strip ("arm up / arm down", Judgment Day armed or not) under the CTB list, the Omnis strip transposed. Teaches the central rule; one more panel in a busy HUD.
- **My lean, for Bailey to overrule:** draw A as the target and C as the optional strip, B as the phone fallback. The faked frame to draw: phase 2, the Right Arm down (hidden), the Left Arm up and hurt, Tidus mid Quick Hit, Penance's turn next on the CTB list, the counter strip armed.

## 8. Open questions, and the live checks that settle them

Live checks need the Steam FFX; the RE session runs them. None blocks the build; each can move one constant.

1. **How the battle is launched, and the arena it uses** (RE §10 item 1): confirm the airship deck; cheap if the RE session is already in the game at the airship.
2. **A hidden arm keeps its turn** (RE §10 item 2, label B): with VisibleOnCTB 0 the arm should come back 12 ticks after death; verify by watching the CTB list and the arm's reappearance.
3. **Initial CTB** of the three monsters and the first turns' order (RE §10 item 3); changes only the opening.
4. **Regen's duration** (row 254 against the guide's 10 turns, RE §10 item 5): does the Regen from Mighty Guard last until dispelled?
5. **Haste on the arms** (counter 1 rewritten each turn) and whether the delay of the action sees it (RE §10 item 4); changes the arms' pace by a factor of two.
6. **Model heights** for the stage framing (RE §10 item 6).
7. **Does a Doom kill revive an arm the same way?** (the arms are Doom-able, counter 200): the Final Fantasy Wiki is reported (search summary only) to say an arm killed by Doom takes longer to come back.

## 9. How the fight is proved winnable (the method, and predictions written first)

The Chapter XXVII method (`docs/plans/ch-mirror-aeons-bench.md`): scripted players on the real engine, 200 seeds a line, no god mode, **the boss never tuned**; the levers are the party preset only (the potion stock, Luck, the Cheers at the start, the roster, the Break HP Limit variant). Target (the same as D-887's "appropriate, not too easy, not too hard"): the advisor's line wins **60 to 80 percent**, a careless line under 20 percent.

**Lines:** (1) the advisor's line, from Jegged's tactics: five Cheers or Ultra Nul-All first, Quick Hit on the arms (alternate, the second arm just before the first returns), Dispel Penance's Haste and Regen, Dispel after every Immolation, Quick Hit on the body otherwise, X-Potions through Auto-Potion; (2) the same without arm control (hits Penance only); (3) the same with the Break HP Limit variant; (4) a careless line (Attack the first living enemy); (5) attack only the arms.

**Predictions (written before any run, `[estimate]`):**
- **J1.** Line 4 and line 2 win **0 of 200**: the counter reaches 20 within a handful of Penance turns once the party acts three or more times a turn, and the first Judgment Day with both arms up takes everyone (Auto-Phoenix revives one at most; the next turn kills again). Line 5 never wins (Penance's Regen never stops).
- **J2.** With the Celestial rows the advisor's line wins **45 to 85 percent**; **without them** (plain weapons with Break Damage Limit, about 10,000 to 22,000 a hit and half that under Protect) it wins **under 10 percent** because 12,000,000 HP takes 600 to 1,200 hits and Mighty Guard's Regen heals 46,975 a tick, and the engine's stalemate watch (400 turns without a new minimum of Penance's HP, `engine-end.ts` 50) ends it with "the battle cannot be won from here".
- **J3.** Most losses are Armor-Broken members killed by the next hit, not Judgment Day, once line 1 manages the arms.
- **J4.** Break HP Limit (line 3) wins a few points more than line 1 and loses the rest to the same cause.

Pinned bounds follow the Keeper's rule: a tripwire, not a target; if a change moves them, re-measure and say so.

**Browser / real-input checks (job specs, predictions first; the lock and the headless-only rules apply):** B1 type `judgment` on the board and reach party prep (prediction: the word opens, nothing else does; the phone long-press field works). B2 play the opening through the real keys to phase 2 with the debug API (`window.__pyrefly`) (prediction: the split frame appears exactly once, at a hit that crosses 9,000,000). B3 kill an arm and watch it return (prediction: it is gone from the list and the cursor for 12 ticks, then back with Regeneration). B4 a Judgment Day on the screen (prediction: a party wipe beat, the retry offered).

## 10. Review class

`node tools/critic-plan.mjs --paths src/battle/ffx/ai/penance.ts,src/battle/ffx/adapt/hit.ts,src/battle/common/types.ts,src/data/encounters.ts,src/data/chapter-penance.ts,src/battle/ffx/adapt/ctb.ts,…` says **DEEP**: a **focused review of the production candidate before the deploy**, then live verification and the **deep review on the live build** (the FFX CTB engine, the shared combat core and the chapter registry are shared systems). Checks: CHK-002, 003, 009, 011, 015, 016, 017, 020, 021, 022, 023, 026, 027; targets chapters, fight, pause, phone, presentation, scenes, and "audit every changed data value against research/". The chapter is hidden, so it ships behind its word; the deep review stays the build's obligation (`critic/RUBRIC.md` §10; round 34b lifted the third-deploy refusal, so the cap does not stop a release, it only lengthens the list of owed reviews).

## 11. The picks (the driver's calls, his to overturn) and what is still his

| # | Pick | Alternative |
|---|---|---|
| P1 | **Number 35**, id `penance`, word **`judgment`** (Judgment Day; 8 letters; clear of every door rule: `tests/unit/chapter-doors.test.ts` forbids a word that ends where another begins, and the word `penance` fails twice: `yrp` ends in P and `experiment` starts with E) | `penance` after an exemption in that test |
| P2 | Hidden behind the typed word, FFX only, listed nowhere, **not** desktop-only (painted 2D) | list it on the board later on Bailey's word (D-848) |
| P3 | Arena = Chapter VIII's deck plate | a new plate (not recommended: nothing sourced) |
| P4 | Party Tidus, Yuna, Rikku; caps; Luck 85; Jegged's four armour abilities; HP 9,999 | Break HP Limit variant; other trios |
| P5 | **Celestial weapon rows in** (additive build field, sourced from `weapon.bin`) | plain weapons (the fight is then not winnable, J2) |
| P6 | No Escape row (the game allows it) | an Escape that ends the chapter as a retreat |
| P7 | Painted billboards on local ComfyUI, mirrored arm | the real FFX model through the 3D route (desktop-only) |
| P8 | Music stand-ins: scene `scene-fahrenheit`, battle `boss-challenge`, victory `victory-ffx`; the guides' name for the sourced track is "A Contest of Aeons" (`research/ffx-isaaru-bevelle.md` §9), which Bailey's ears judge (rule 13); an original per-encounter cue is D-685 (open) | `boss-yu-yevon` for phase 2 |
| P9 | Arm rewards keep paying at every death and the results screen never mentions it (the Gui chapter's rule) | pay once |
| P10 | Yojimbo, Anima, the Sisters out of the roster | in, with the Pay ladder (Chapter XXVII's machinery) |
| P11 | The loss is the usual one; retry from the start (one fight, no chain) | a checkpoint at phase 2 |
| P12 | Difficulty: the preset only; the boss never touched | none (rule 6) |

## 12. Top risks

1. **The Celestial rows** (P5): the one large data dependency, a contract field and a damage-adapter line. If it is declined, the fight is not winnable by J2's arithmetic and the chapter must not ship. Byte-identity for the other chapters is proved by the goldens.
2. **The arms' revival in the clock** (row 5): a hidden actor that still takes turns and a death hook the engine does not have; the largest engine row. Fallback: a poll after every action, as Macalania does, at the cost of a Doom death waiting for the next action.
3. **The 400-turn stalemate watch against Mighty Guard's Regen**: a party that does not Dispel Penance's Regen can sit at no new minimum; the advisor's line must dispel it, and the chapter's tip must say so.
4. **Fight length**: 121 capped hits plus the arm dance is long for a hidden chapter with a fast-speed option; check the pacing at a human speed (a live check).
5. **Art**: a giant and a mirrored hand must read on a 390-wide phone and under the HUD rails; an unpainted build ships grey figures.
6. **Merge**: `encounters.ts` (399 lines) and `chapter-doors.test.ts` are shared with the two sibling lanes' numbers 33 and 34 and their words.

## Corrections and findings (what the mapping turned up)

- **The feasibility note's "sets two shared battle variables the arms can read"** is half right: Penance writes battle variables 0x20 and 0x24, which none of the three scripts reads; what the arms and Penance share are the two **down flags** (0x04, 0x08) the arms write and Penance reads (RE §5.1). The Judgment Day gate is "both arms up", not "the two shared variables read 0" in the sense the note guessed.
- **"Haste for one turn"** at the change, not a permanent Haste: the script writes a counter of 1 (RE §5.2); Penance's turn stays 9 ticks except that one.
- **Judgment Day is neither physical nor magical** (flag word 2 = 0x80): no Protect, Shell or Defense ability touches it, and it is always the 99,999 cap.
- **No hook runs on the arms' death in the engine**; the revival needs one (row 5).
