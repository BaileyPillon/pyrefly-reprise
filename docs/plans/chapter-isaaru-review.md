# Paper preflight: Chapter XIV (provisional) — Isaaru, the Via Purifico beneath Bevelle (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-natus-review.md` and its Review section's lessons ("sourced" and "our estimate"
kept apart; line-up, items, callouts, "ship locked" asked; no sheet invents a target or odds).
**Docs only: no code, no build, no render;** one read-only engine run in scratch (§4.2, rule 3).
Written 2026-09-24 by a sub-agent of the driver after Bailey's words (verbatim): *"I'll also add
Isaaru's contest of aeons at Beville and Gippal, in the Den of Woe as two additional chapters in
addition to the ones I selected already"* ("Beville" = Bevelle).

**Verdict: PROCEED on engine seams, data, AI and the story draft; HOLD everything Bailey will see
or hear until §6's options are picked (rule 9).** The hard part is a chapter where the player
commands only aeons.

## 1. Game case, sources, corrections

**Game case: FFX only.** CTB, Yuna's aeons, Grand Summon, Shield, the FFX status set; in FFX-2
Isaaru is a tour guide and nobody summons (research §0.3). AI, data, build under `src/battle/ffx`,
`src/data/ffx`; registration and chain plumbing are shared, case "both" (CHK-020), inert elsewhere.
**Read in full:** `research/ffx-isaaru-bevelle.md` (e557f28a; "§n" = its sections), the Natus
preflight. **In part:** the engine files in §4, `highbridge.ts`, `approved-hashes.json`,
`decisions.json`, THEMES.md, `natus-story-draft.md`, writing-bible §1. The older
`research/ffx-isaaru-aeon-contest.md` is superseded (research §0.4) and left untouched.

**Corrections carried from the research:** the duel is in the **Via Purifico** under Bevelle, the
maze's last chamber at the end of a red-lit hallway, not in the city `[verified: 4]`; **Yuna can be
attacked** when no aeon is out; **"A Contest Of Aeons"** scores Yu Yevon's aeons, not this fight;
**only Shiva is board-approved** (Valefor, Ifrit, Ixion, Bahamut ship under D-089; no Anima or
Yojimbo here). **D-090** (no Isaaru duel inside Chapter X) stands: this is its own chapter.

## 2. The encounter (summary only; the data files cite the research)

| Item | Value | Tag |
|---|---|---|
| Shape | Three formations back to back, **no healing between**: `[isaaru, grothia]` → `[isaaru, pterya]` → `[isaaru, spathi]`; forced party **Yuna alone** | §1.1 `[decompiled]` + GameFAQs; `"y"` `[verified: 3]` |
| Isaaru `m248` | 10 HP, **no actions**, Scan/Sensor immune; targetable or not is unsourced | §2.1 `[decompiled]` + wiki |
| Grothia `m284` (his Ifrit) | HP **8,000** · MP 600 · STR 23 · DEF 10 · MAG 21 · MDEF 0 · AGI 18 · **absorbs Fire** | §2.2 `[verified: 4]` on HP; §2.3 `[verified: 3]` |
| Pterya `m254` (his Valefor) | HP **12,000** · MP 1,000 · STR 20 · DEF 10 · MAG 18 · MDEF 10 · AGI 21 | §2.2 |
| Spathi `m287` (his Bahamut) | HP **20,000** · MP 1,500 · STR 31 · DEF 0 · **MAG 38** · MDEF 0 · AGI 20 | §2.2 |
| All three | Overkill 2,550; immune to Delay, Slow, Eject, Demi, Death, the Breaks; Threaten byte 0 vs wiki Immune (I-3) | §2.4 |
| Grothia | Attack on aeons (4:0) or **Fira** DC 24; **Hellfire** DC 70, Magic formula, type Other, Fire (MDEF applies, **Shell does not, NulBlaze does**); vs Yuna 4:127, accuracy 120 | §3.1 `[verified: 3]` |
| Grothia's gauge | **starts full, so turn one is Hellfire**; +5 per attack, +3 when targeted, none from hitting Yuna | §4.1 `[single source: wiki]` |
| Pterya | Attack (4:0), **Sonic Wings** DC 8; **Energy Ray** DC 26, **Magical** (Shell halves it); vs Yuna 4:92 (DC 8, accuracy 60); gauge +10 / +15 | §3.2, §4.2 (rates `[single source]`) |
| Spathi | **Countdown to Mega Flare** (DC 44, Magic formula, type Other); count **5** (wiki, GameFAQs) vs **4→1** (Jegged), I-5 | §3.3, §4.3 `[verified: 3]` on the countdown |
| Mirror lock | Yuna cannot summon the aeon she faces (no Ifrit vs Grothia, and so on) | §1.2 `[verified: 2]` |
| Loss | **Yuna KO'd, or no aeon left** | §1.2 `[single source: GameFAQs]` |
| Unsourced | items and escape (O-3); Isaaru targetable (O-4); move splits (O-5); Spathi vs Yuna (O-6); Pterya's start gauge (O-9); counters I-4; rewards I-1; music O-8; Yuna's stats and gauges (O-1, O-2) | §11 |

**The design fact (§5.2, `[derived]`):** Hellfire kills every aeon of Chapter X's shipped set
from full HP (1,765 to 1,977 against 1,146 to 1,515), and Mega Flare kills every available aeon
in every preset. Our damage chain reproduces GameFAQs' "about 2,200, about 550 with Shield".
**The thesis:** three links, one threat each. Shield or NulBlaze on turn one. Pterya is the
breather where Bahamut fills his gauge. Shield when Spathi's count reads 1. The mirror lock
makes the five aeons a budget spent across all three links.

## 3. The party and builds

- **Build point:** the maze's end, a Save Sphere before the hallway (§6.2): full HP and MP. New
  `src/data/ffx/builds/via-purifico.ts`: **Yuna only** (forced; no bench, no Switch), five aeons
  (Valefor, Ifrit, Ixion, Shiva, Bahamut, §1.3 `[verified: 3]`), a bag; every cell `[estimate]`.
  Yuna B4–B6, aeons B2–B3, bag B7. **Hand-off:** `highbridge.ts` ships Bahamut at 100 "from the
  Isaaru duel"; chapters are standalone, so the two presets must *agree*, not carry (B3).

## 4. Engine capabilities, found by reading the engine and one run

### 4.1 Already there: data only, no engine change

| # | Need | Where it is |
|---:|---|---|
| 1 | Summon, Dismiss, Grand Summon (temporary gauge kept apart from the stored one) | `aeons.ts:53` `summonAeon(…, grand)`, `:85` `dismissAeon`, `execute.ts:238` |
| 2 | A three-link chain carrying HP, MP, statuses, gauges and the bag, no results between links | `BattleScreenSetup.ts:80` `setupForNextLink`, `:112` `carryFfx` (aeons at `:124`), `carryInventory` |
| 3 | An aeon KO'd in one link stays down in the next | proved by the run (§4.2 P4, P5): HP 0 carries, `aeons.ts:28` skips it |
| 4 | Retry from link 1 with no checkpoint (the default); a checkpoint only where a formation sets `restoresPartyOnEntry` | `BattleChainCheckpoint.ts:45` (Chapter XI only) |
| 5 | Isaaru never blocks victory; the link ends when the aeon dies | `engine.ts:397` non-combatant filter (Cid precedent, `state.ts:118` `nonCombatant`) |
| 6 | An actor with no CTB turn | `state.ts:138` `ordersOnly`, read by `turnQueue.ts:78` (Chapter IX's Daigoro) |
| 7 | Untargetable on the menu | `predicates.ts:76` `flags.untargetable` |
| 8 | An enemy Overdrive gauge with a per-targeting fill and a per-attack fill in the AI | `state.ts:106` `gaugePerTargeting`, `overdrive.ts:156`; `yojimbo-rules.ts:66-72, 146-170` (the pattern); `types.ts:1015` `enemyGaugeRules` |
| 9 | An enemy gauge widget | `src/ui/ffx/ZanmatoGauge.ts` + `zanmatoGaugeModel.ts` (Yojimbo's; a sibling, not a reuse, T8) |
| 10 | A stored counter across turns (the Countdown) | `ctx.state.flags` keys, as `seymour-natus-rules.ts` `NATUS_PHASE`, `braskas-final-aeon.ts` `bfa.gauge` |
| 11 | Telegraph text, a CTB charge pip and the dry-run intent of the next move | `message` kind `'telegraph'` (`types.ts:1735`), `ui/ffx/TelegraphBanner.ts`, `CtbList.ts:145` `chargeStage`, `intent.ts` |
| 12 | Hellfire / Mega Flare: Magic formula, type Other: Shell skipped, Shield quarters any type; Energy Ray Magical: Shell halves | `formulas.ts:318-320` (Shell only for `'magical'`), `:301` (Shield) |
| 13 | NulBlaze cancels Hellfire whatever its type; Grothia absorbs Fire | `abilities.ts:160` `consumeNulCharges` (element only), `elements.ts` affinities |
| 14 | Delay, Threaten, bribe, percentage immunities; no flee | `ImmunityFlag` (`types.ts:452`), `rt.canEscape` false by default |
| 15 | A registered but unlisted chapter | `chapters-unlisted.ts:28` `UNLISTED_CHAPTERS` |

### 4.2 The run (read-only, scratch, 2026-09-24, main at e557f28a)

A scratch vitest file outside the repo drove the real engine: a solo Yuna from `highbridgeBuild`
(HP raised so the stand-in Natus formation could not end it first).

| # | Probe | Result |
|---|---|---|
| P1 | `activeSlots: ['yuna']`, empty reserve | **initialises**; `activeIds ["yuna"]`. Runs, but the type is a 3-tuple (`types.ts:2401`): a cast today |
| P2 | Yuna's first menu | Attack, White Magic, Scan, Pray, **Talk**, **Summon ×5 (Ifrit included)**, the whole bag **incl. Grenade**, Defend |
| P3 | Summon Ifrit | `aeonId: ifrit` |
| P4 | Ifrit at 0 HP, `carryPartyForward` | Ifrit's HP 0 carries; `reviveCountdown` is **not** carried (HP 0 alone keeps him out) |
| P5 | Next link on the carried build | Yuna opens, no aeon on the field; Summon lists Valefor, Ixion, Shiva, Bahamut |
| P6 | Every aeon at 0 HP, Yuna standing | the battle **goes on**: Yuna gets a turn with no Summon row |

### 4.3 The real gaps (FFX only unless marked)

- **I-G1: a one-member line-up.** Works at run time (P1); widen `FFXPartyBuild.activeSlots` to
  one to three ids (contract, additive), and check the prep screen, HUD plates and stage slots
  with one member (T8 by real input; not claimed from reading).
- **I-G2: the mirror lock.** `availableAeons` (`aeons.ts:24`) and the menu (`commands.ts:179`)
  know nothing of the formation (P2, P5). Add `EnemyGroupDef.lockedAeonIds` (contract, additive),
  read in `availableAeons`; the row shows greyed with a reason (B6). Every other chapter byte-identical.
- **I-G3: the loss rule.** "No aeon left" is not a defeat today (P6). A formation flag read in
  `checkEnd` (`engine.ts:437`): no aeon on the field, none available after the lock → defeat.
- **I-G4: "only aeons can fight them".** P2 shows Attack, Talk and Grenade open. B6 picks the
  seam: menu rows greyed with a reason, or a new `ImmunityFlag` for damage from a non-aeon.
- **I-G5: Isaaru as a bystander.** `nonCombatant` + `ordersOnly` + `untargetable` on one actor
  has never been combined; T1 proves the victory rule, the empty CTB row and the menu by a run.
- **I-G6: ids.** The enemy aeons must **not** use the roster ids `ifrit`, `valefor`, `bahamut`:
  combatants are keyed by id (`setup.ts:319-333`), so a clash would overwrite Yuna's aeon, and
  `guideForState` would show the FFX-2 Bahamut guide for an enemy `bahamut` (the Natus N-G6
  leak). Ids `grothia`, `pterya`, `spathi`; only the sprite keys point at the aeon paintings.
- **I-G7: three small AIs** (T3): the gauge rules of #8 with Grothia's full start and "no fill
  from Yuna"; the move splits (B9); Spathi's count in a flag with a telegraph each turn (#10, #11).
- **I-G8: guide and tactic.** Own guide and tactic (T7); the advisor must know it commands only
  aeons, the lock, Shield at the count of 1, and NulBlaze before Hellfire.

**Not needed:** a new `Side`, damage type, `BattleEvent` or chain system. **Contracts:** `encounters.ts`
(`number` to 14, new `ChapterId`, serialised with XII, XIII, XV), `ids.ts`, `common/types.ts` (I-G1–I-G4); one entry.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **B1** | Title, number, location | "Isaaru" / "The Via Purifico" / "A Contest of Aeons" | **"Isaaru"** (the bestiary's boss name; the OST title belongs to other fights); **XIV** by registration (D-058) after Omnis and Trema; "Via Purifico — beneath Bevelle"; story order VIII → this → X |
| **B2** | Aeon stats | a) Chapter X's shipped set (P1) / b) the growth formula on an estimated Yuna (P2) / c) the story floor (P3) | **a**, the same aeons the next chapter fields |
| **B3** | Aeon gauges at the start | a) Chapter VII's carried values (Valefor 90, Ifrit 60, Ixion 60, Shiva 0), Bahamut 0 (just named) / b) the same, Bahamut at an `[estimate]` partial / c) all full | **b**; T10 reports how often the sourced line ends with Bahamut full, to match Chapter X |
| **B4** | Yuna's stats | a) Chapter X's Yuna (the Gagazet cells, D-natus-preset) / b) Chapter VII's | **a**, continuity with the next chapter |
| **B5** | Yuna's Grand Summon gauge | a) full (Jegged: charge it before the hallway) / b) empty / c) Chapter VII's | **a**; it opens the sourced Grand Summon line |
| **B6** | Yuna's own commands | a) Summon, Grand Summon, White Magic, Items, Defend; Attack, Talk, attack items **greyed** "Only an aeon can fight an aeon" / b) all open, enemy aeons take 0 from Yuna / c) Summon only | **a**, labelled estimate; the mirror-locked aeon greyed with its reason |
| **B7** | Items | a) Chapter X's bag / b) healing only (no Grenade) / c) none | **a**, with attack items greyed under B6 = a |
| **B8** | Isaaru | a) on the field, no turn, never targetable / b) targetable (10 HP) | **a** `[estimate]` (O-4) |
| **B9** | Unsourced AI | even Attack/Fira and Attack/Sonic Wings splits; Pterya's gauge starts at 0; count from **5** (I-5); Spathi keeps counting when Yuna stands alone and Mega Flares her at 0 (O-6); counter rows **not** built (I-4) | **build all, each "our estimate"**; footage check of the count before listing |
| **B10** | Threaten (Shiva's Heavenly Strike) | immune / landable per the byte | **immune** (2 sources vs 1 byte; the Natus rule) |
| **B11** | Loss rule | a) Yuna KO, or no aeon left (GameFAQs) / b) Yuna KO only | **a** |
| **B12** | Retry after a loss | a) from Grothia (the Save Sphere is before the hallway) / b) a checkpoint per link | **a**, faithful; no source heals between links |
| **B13** | Rewards (I-1) | a) 0 per aeon + a "5,000 AP" results line, labelled single source / b) nothing / c) the wiki's 6,000 | **a** |
| **B14** | The scene's cast | a) Yuna, Auron, Lulu, Kimahri all found (Lulu's line about his missing guardians) / b) Yuna and Auron (the only required one) | **a**; approved portraits, no new party art |
| **B15** | Narration | a) Tidus's past-tense narration, as Yuna later told it / b) Yuna narrates / c) live only | **a**, the anthology's frame; the bible's voice rules |
| **B16** | Chapter X's interlude 2 (Tidus's side of the prison) | a) keep as drafted / b) add one line pointing here | **a**; it tells the other half and contradicts nothing |
| **B17** | Mid-battle callouts | Isaaru's three entry cries (paraphrased) on link cards; a Hellfire warning on turn one; the count; the lock line; a "last aeon" warning | **in**, drafted in a story draft Bailey reads first |
| **B18** | How Isaaru's aeons are marked | a) the aeon paintings as they are / b) plus a name plate "Isaaru's Ifrit — Grothia" / c) plus a tint | **decide on O-4**; leaning **b** (the sources describe no visual difference) |
| **B19** | Hurt and KO poses (the aeon paintings have none) | a) paint hurt + KO for Ifrit, Valefor, Bahamut (Yuna's aeons gain them too) / b) the presenter's fallback | **decide on O-4**, which shows both |
| **B20** | Reading the fight | the count as numbers over Spathi, a gauge under each enemy aeon, or intent text only | **decide on O-5**; leaning count numbers plus intent text |
| **B21** | Music | a) a new original cue from the HYMN family ("Still Water": the fayth, one summoner per fayth) / b) reuse an existing boss cue | **a**; b as the stand-in if the sketch is late |
| **B22** | Art late | ship registered and **LOCKED** / hold the release | **LOCKED** (D-069 precedent), said before the cut |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory (`approved-hashes.json` checked; `public/art` listed)

| Asset | State | Notes |
|---|---|---|
| **Isaaru billboard + speaker portrait** | **NEW** | No art anywhere (§10.2). Costume in words only (§8.1); reference images first (rule 6), original output (rule 8); portrait after the billboard pick |
| **The chamber** | **NEW** | Stone prison, red light, a way up (§7). `bevelle-underground.ts` is the FFX-2 arena, not this (rule 14) |
| Yuna | **approved** (`cast:yuna`, idle to victory incl. summon, hurt, KO) | Serves as is |
| Grothia / Pterya / Spathi | the **Ifrit / Valefor / Bahamut** paintings (D-089, no verdict), on the enemy side | Mirror lock: the same painting is never on both sides (§10.2). `facing: left` in every sidecar, as the boss paintings: T5 checks the facing rule. Never altered in place |
| Yuna's aeons | Shiva **approved**; the other four under D-089 | idle, attack, overdrive only: **no hurt / KO pose** (B19) |
| Portraits: Yuna, Auron, Lulu, Kimahri | **approved** (`portraits:ffx-party`) | B14 |
| Chapter card, thumbnail, pause plate; **music `boss-isaaru`** | **NEW** | From the O-1 and O-3 picks; B21 |

### 6.2 Options rounds: six, cheap and broad; a pick approves only what Bailey names

- **O-1 Isaaru:** 3 concepts at battle scale beside Yuna's idle and one enemy aeon, after a look
  at reference images: (a) the costume as the wiki words it, in the house style, (b) the same with
  a summoner's staff raised, (c) a quieter, kneeling-then-standing pose.
- **O-2 His portrait:** 2 options from the O-1 pick.
- **O-3 The chamber:** 3 plates: (a) red-lit stone, the hallway behind, (b) a round prison
  chamber with the way up lit above, (c) darker, pyreflies in the red.
- **O-4 The enemy aeons:** the Ifrit painting on the enemy side three ways (as is, name plate,
  tint), and a strip with the fallback KO beside a painted KO frame (B18, B19).
- **O-5 Reading the fight:** 2–3 mockups at 1600×900 **and** 390 px phone of (i) the Summon list
  with the locked aeon greyed and its reason, (ii) Spathi at "count 1" with the Shield hint,
  (iii) Grothia's gauge before Hellfire, (iv) a "link 2 of 3" card. One option is intent text only.
  The sheet shows only what the engine knows: no invented odds, no Flee row (the Natus O-4 lessons).
- **O-6 Music:** 2 sketches on `docs/audio/audition.html` (rule 13). Brief: devotion, a duel
  neither side wants. Anti-brief: no quotation or imitation of any original cue (rule 8).

**GPU `[estimate]`:** sheets ~45 min, finals ~90 min: **~2¼ hours**, only while art is on.

## 7. Story beats (research §8.2, paraphrased; our own words, writing-bible voice)

T6 adds the next free E-tag. Voices: Yuna §1.3, Auron §1.4, Lulu §1.6, Kimahri §1.7 (3–8 words);
Isaaru new: courteous, devout, sure the temple's word binds even Braska's daughter. **No
transcribed line** (rule 8); the three battle cries are hooks, written fresh.

- **Pre:** (1) Tidus's narration (B15 = a): the trial, the drop into the dark, the two halves of
  the party; this is Yuna's half. (2) Live: the maze's end, the red hallway, the ones she found.
  (3) Isaaru waits; his orders; Lulu notices he stands alone; he asks her pardon. `battleStart()`.
- **Mid (B17):** a cry and a link card per aeon; the Hellfire warning; the count; the lock line.
- **Post:** he refuses her healing; he points the way up; Yuna bows; Auron: his pilgrimage is
  over. Narration hands off to the Highbridge (Chapter X). `results()`.

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Size (agent hours, `[estimate]`) | Model |
|---|---|---|---:|---|
| Integrator | `encounters.ts`, `ids.ts`, `chapter-*` meta, `chapters-unlisted.ts`, `CONTRACT-CHANGES.md` | first and last; serialised with XII, XIII, XV | 1.0 | opus |
| T1 engine seams I-G1…I-G5 | `common/types.ts`, `aeons.ts`, `commands.ts`, `engine.ts` | ids | 1.25 | opus |
| T2 enemy data | `src/data/ffx/enemies/isaaru{,-abilities}.ts` (three formations) | ids | 0.75 | sonnet |
| T3 AI | `src/battle/ffx/ai/isaaru{,-rules}.ts` | T1, T2, B9 | 1.0 | opus |
| T4 build | `src/data/ffx/builds/via-purifico.ts` | B2–B7 | 0.5 | sonnet |
| T5 scene | `src/scenes/via-purifico-*.ts` | O-1, O-3, O-4 picks | 1.25 | sonnet |
| T6 story | `docs/plans/isaaru-story-draft.md` first, then the script, `writing-bible.md` | B14–B17 | 1.0 | sonnet |
| T7 guide + tactic | `src/data/guides/isaaru.ts`, `src/engine/tactics/isaaru.ts` | T2, T3 | 1.0 | opus |
| T8 HUD + solo line-up | `src/ui/ffx/` (lock reason, count, gauge sibling), prep with one member | O-5 pick, T1 | 1.0 | sonnet |
| T9 audio | `src/audio/tracks/boss-isaaru.ts`, THEMES.md row | O-6 pick | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/isaaru-*.test.ts`, 200-seed bench | T1–T4, T7 | 1.5 | sonnet / opus |
| **Total** | | | **~11.25 agent hours**, plus judging and the review | |

```
NOW   Bailey answers B1–B22 (one sheet) · O-1…O-6 go out together
      T1 seams │ T2 data │ T4 build │ T6 story draft          (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure (every sourced line and the advisor, 200 seeds)
      on the picks: art finals → T5 scene │ T8 HUD │ T9 audio │ T6 script from the draft
LAST  integrator commit · node tools/orphans.mjs · real-input win and loss ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, one per research row:** the three stat blocks and immunities; Grothia's turn
  one is Hellfire; +5 per attack, +3 when targeted, nothing from hitting Yuna; Pterya +10 / +15;
  Spathi 5 → 0 → Mega Flare → 5; Shield quarters Mega Flare (537–617 band at roll 16, §5.3);
  Shell halves Energy Ray only; NulBlaze eats Hellfire; Fira on Grothia heals, his own does not
  target him; Delay and Threaten fail; the lock per link; a KO'd aeon absent in later links; HP,
  MP and gauges carried; defeat on Yuna's KO and on "no aeon left"; Isaaru never acts, never listed.
- **Absence (rule 14, CHK-021):** Chapters 1–3 and 7–10 byte-identical at fixed seeds (I-G2, I-G3
  are inert without the flags); FFX-2 untouched.
- **Measure, never tune:** the sourced lines (Shiva with NulBlaze into Grothia; a Grand-Summoned
  Bahamut opener; Bahamut tanks Pterya; Shield at 1 against Spathi), a credibly wrong one (Valefor
  first, no Shield), and the advisor's top row. If a line cannot win, bring Bailey measured
  options; **never weaken a boss**.
- **Real input:** select → prep (one member) → pre scene → three links → win and loss → results;
  screenshots `docs/screenshots/chapters/isaaru-*`.

## 10. Review, risks, verdict

`critic-plan --paths` (encounters, aeons, engine, common/types, BattleScreenSetup) returns
**DEEP**: focused before deploy, deep after on live; not save-data class unless the new
`ChapterId` needs a migration. A third deploy while a deep review is owed needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | A one-member line-up breaks shared UI (prep, plates, stage slots) | T8 by real input; screenshots at phone width |
| R2 | Enemy ids clash with the aeon roster or the Bahamut guide | I-G6: new ids, sprite keys only |
| R3 | Hellfire on turn one feels unfair to a first-timer | B17 warning, O-5 read, measured (T10); no tuning |
| R4 | Thin AI (single-source rates, count 5 vs 4) | labelled estimates; footage check before listing |
| R5 | Isaaru's art and the chamber miss the release | B22 (LOCKED) |
| R6 | Copyright pull toward the script's lines and the original cues | paraphrase only; original cue; the draft and the audition page say so |

**Verdict: PROCEED.** Fifteen needs already work (§4.1); the run found four seams (solo line-up
type, the lock, the loss rule, aeon-only commands). Nothing perceivable until B1–B22 and O-1 to
O-6 are picked. An adversarial review pass is still owed.
