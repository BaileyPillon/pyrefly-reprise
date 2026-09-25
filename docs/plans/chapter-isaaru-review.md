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
from full HP (1,765 to 1,898 at roll 16 against 1,146 to 1,515; review R9), and Mega Flare kills every available aeon
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
  **Build it whatever B6 becomes** (review E11): without it, the stalemate rule
  (`engine.ts:423-433`, `STALEMATE_TURNS = 400`) ends a Yuna-alone battle as `'escape'` ("The
  battle cannot be won from here"), not the sourced Game Over; B6 = b leads to the same end.
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
| **B6** | Yuna's own commands | a) Summon, Grand Summon, White Magic, Items, Defend; Attack, Talk, attack items **greyed** "Only an aeon can fight an aeon" / b) all open, enemy aeons take 0 from Yuna / c) Summon only | **a**, labelled estimate; the mirror-locked aeon greyed with its reason. Still a question: the O-5 frames are *shown with* a (review) |
| **B7** | Items | a) Chapter X's bag / b) healing only (no Grenade) / c) none | **a**, with attack items greyed under B6 = a. **Also: may an aeon use Items?** Today every aeon's menu has an Items row (`commands.ts:195` has no aeon check); no research line sources it, and combat-core §6.1 says party items cannot target aeons `[single source]` (review S5). Recommend: no Items row on an aeon, `[estimate]` |
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
| T3 AI | `src/battle/ffx/ai/isaaru{,-rules}.ts`; a new `enemyGaugeRules` tag value (it is only a string tag, read today by the Zanmato widget alone; review E6) | T1, T2, B9 | 1.0 | opus |
| T4 build | `src/data/ffx/builds/via-purifico.ts` | B2–B7 | 0.5 | sonnet |
| T5 scene | `src/scenes/via-purifico-*.ts` | O-1, O-3, O-4 picks | 1.25 | sonnet |
| T6 story | `docs/plans/isaaru-story-draft.md` first, then the script, `writing-bible.md` | B14–B17 | 1.0 | sonnet |
| T7 guide + tactic | `src/data/guides/isaaru.ts`, `src/engine/tactics/isaaru.ts` | T2, T3 | 1.0 | opus |
| T8 HUD + solo line-up | `src/ui/ffx/` (lock reason, count, a gauge sibling of the Zanmato widget that reads T3's new tag value), prep with one member | O-5 pick, T1 | 1.0 | sonnet |
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
  MP and gauges carried; defeat on Yuna's KO and on "no aeon left"; **a Yuna who heals through
  Pterya with no aeon left ends in defeat, never in the 400-turn stalemate `'escape'`** (review
  E11); Isaaru never acts, never listed.
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

## Review (adversarial pass, FFX only, 2026-09-24)

A sub-agent of the driver wrote this section; nothing else in the repository was changed. Main
was at `10c8888c`.

**Method:**
- Fetched again through `api.php?action=parse&prop=wikitext|revid` with a browser user agent:
  *Grothia*, *Pterya*, *Spathi*, *Isaaru (Final Fantasy X boss)*, *Isaaru* and *Final Fantasy X
  enemy abilities*. Also fetched Auronlu's Chapter X script page. All were read in scratch on D:.
- Read every engine line that §4.1 cites.
- Recomputed Hellfire and Mega Flare by hand with the magic-damage chain, on the aeon rows in
  `macalania.ts` and `gagazet.ts`.
- Viewed `isaaru/sheet.jpg`, `aeons/sheet.jpg` and `fight/sheet-phone.jpg`, and listed the
  folder.

**The engine was not re-run.** Verdicts that depend on the §4.2 run or on the options builder's
frames say so.

### Research claims (`research/ffx-isaaru-bevelle.md`)

| # | Claim | Verdict | Evidence |
|---:|---|---|---|
| R1 | Revids: Grothia 3979432, Pterya 3979322, Spathi 4005169, Isaaru boss 3963146, Isaaru 4026440, enemy abilities 4008011 | **CONFIRMED** | Today's fetch returns the same six revids, so the text is unchanged |
| R2 | HP 8,000 / 12,000 / 20,000; MP 600 / 1,000 / 1,500; Str, Def, Mag, MDef and Agi as in §2.2 (the wiki prints 1 for 0); Overkill 2,550; doom count 5; Pterya's "zanmato 4" | **CONFIRMED** | The three infoboxes match field for field |
| R3 | Isaaru: 10 HP / 1 MP, Overkill 10, Luck 15, Sleep/Dark/Silence 20, poison% 25; Sensor, Scan and Bribe immune; Threaten Immune on the wiki | **CONFIRMED** | Boss infobox. The research does not record two infobox entries: **doom count 3** and "Can only be fought by aeons". Both are moot, since he never acts |
| R4 | Grothia: absorbs Fire; casts Fira instead of Meteor Strike; does not heal himself; **starts with a full gauge**; +5 % when attacking, +3 % when targeted; his attack on Yuna has higher accuracy and gives no gauge | **CONFIRMED** (wiki, single source as tagged) | Grothia page, "Battle". The wiki's strategy puts Bahamut first but saves him for Pterya, then recommends Shiva. §6.3 reports this correctly |
| R5 | Pterya: +10 % when attacking, +15 % when targeted; her attack on Yuna has less power and accuracy and gives no gauge; "same aeon as Valefor" | **CONFIRMED** | Pterya page |
| R6 | Spathi: countdown **from 5** to Mega Flare; the mirror lock ("two aeons of the same type cannot fight each other"); Shield before Mega Flare; Ifrit or Ixion suggested; the wiki's 6,000 gil / 6,000 AP | **CONFIRMED** | Spathi page. The same lock sentence is on the Grothia page |
| R7 | Damage constants (DC): Fira 24, Hellfire 70, Energy Ray 26, Sonic Wings 8, Mega Flare 44. Energy Ray is Magical (Shell applies) | **CONFIRMED** | The enemy-abilities table gives 70 "Sp", 44 "Sp", 26 "Mag", 8 "Phy" with weak Delay, and 24 "Mag". The wiki's "Sp" is the decompile's "Other". The table also lists **Countdown for Belgemine's Remiem Bahamut**. This supports §3.0: the records are shared |
| R8 | Mega Flare about 2,200, and about 550 with Shield, reproduced | **CONFIRMED** | Ixion in P1 (MDef 46): 44 × (⌊38²/6⌋ + 44) / 4 = 3,124; × (730 − ⌊(46·51 − ⌊46²/11⌋)/10⌋) / 730 = **2,203**; ÷ 4 = 550. Both match §5.2 |
| R9 | Hellfire against the P1 aeons, "1,765 to 1,977" (§5.2 prose, repeated in plan §2) | **CORRECTED** | By hand at roll 16: Ixion 1,765, Bahamut 1,840, Shiva 1,885, Valefor 1,898, which is also what the §5.2 table says. **1,977 is in no cell.** The range is **1,765 to 1,898**. The conclusion stands: even Ixion's lowest roll is above 1,515 |
| R10 | §8.2 beat 3: **Maester Kinoc** gave the order to "deal with the traitors" | **CONFIRMED, with a conflict to record** | In Auronlu's Chapter X, Isaaru names Kinoc. The Personality section of the wiki's *Isaaru* page (revid 4026440) says **Mika**. Prefer the script. Add this as I-9 so that no writer "corrects" it to Mika |
| R11 | §8.1 costume: white robe; blue blouse with long white cuffs; wide sea-green belt with strings tied in a bow; **black knee-length jacket with sea-green edging**; brown hair; half-closed eyes | **CONFIRMED** | *Isaaru* page, "Appearance". The wiki does **not** say his hair is tied up |
| R12 | P1 aeon rows: Valefor 1,146, Ifrit 1,515, Ixion 1,513/40, Shiva 1,342, Bahamut 1,398/35 | **CONFIRMED** | `macalania.ts:276-282`, `gagazet.ts:432`, `highbridge.ts:100-165` (Bahamut at 100) |
| R13 | A KO'd aeon stays down for the rest of the chain | **CONFIRMED** (by the plan's run) | `aeons.ts:24-31` skips `hp <= 0`; plan P4 and P5 |

### Plan engine claims (§4)

| # | Claim | Verdict | Evidence |
|---:|---|---|---|
| E1 | #1: Summon, Dismiss, Grand Summon | **CONFIRMED** | `aeons.ts:53` and `:85`, `execute.ts:238` |
| E2 | #2: the chain carries HP, MP, gauges and the bag | **CONFIRMED** | `BattleScreenSetup.ts:80`, `:112`, `:157` `carryInventory` |
| E3 | #4: a retry starts again at link 1 unless the formation sets `restoresPartyOnEntry` | **CONFIRMED** | `BattleChainCheckpoint.ts:45-47` |
| E4 | #5: Isaaru never blocks victory | **CONFIRMED** | `engine.ts:397-405`. With one non-combatant and one aeon, only the aeon counts |
| E5 | #6 and #7: `ordersOnly` and `untargetable` | **CONFIRMED** | `state.ts:138`, `turnQueue.ts:78`, `predicates.ts:76` |
| E6 | #8: the enemy gauge | **CONFIRMED, with one note** | `state.ts:106`, `overdrive.ts:154-157`, `yojimbo-rules.ts:66-72`. `enemyGaugeRules` (`types.ts:1015`) is only a **string tag**, and only the Zanmato widget reads it (`zanmatoGaugeModel.ts:139`). T3 must set a new tag value, and T8's sibling widget must read that value |
| E7 | #12: Shell applies only to `'magical'`; Shield quarters every type | **CONFIRMED** | `formulas.ts:301` and `:318-320` |
| E8 | #13: NulBlaze checks the element only, and beats Absorb | **CONFIRMED** | `abilities.ts:158-160` |
| E9 | #14: no escape by default | **CONFIRMED** | `setup.ts:307` |
| E10 | P1: `activeSlots` is a 3-tuple | **CONFIRMED** | `types.ts:2401` |
| E11 | I-G3: "no aeon left" is not a defeat today; the fix belongs in `checkEnd` (`engine.ts:437`) | **CONFIRMED; the plan misses a risk** | `engine.ts:437-449` ends the battle only when nobody is standing. **The stalemate rule** (`engine.ts:423-433`, `STALEMATE_TURNS = 400`) ends a battle whose enemy HP has stalled as **`'escape'`** ("The battle cannot be won from here"). So without I-G3, a Yuna with no aeon left who heals through Pterya's weak hits gets a withdrawal after 400 turns, not the sourced Game Over. B6 = b (Yuna deals 0) leads to the same outcome. **I-G3 must be built whatever B6 becomes, and T10 needs a test for this case** |
| E12 | I-G6: the enemy aeons' ids would clash with Yuna's roster | **CONFIRMED** | `setup.ts:319-333` keys every combatant and `aeonRoster` by id |

### The options builder's four frame findings

| # | Finding | Verdict | Evidence |
|---:|---|---|---|
| F1 | While an aeon is out, the HUD shows Yuna's row and no aeon HP; "no research file says what FFX shows" | **CONFIRMED for the HUD; CORRECTED on the sources** | `ffx-combat-core.md` §6.1 `[verified: 2 sources]`: the aeon "replaces the entire active party; the party members are removed from the field". `visual-bible.md` §3.11.6 already puts "the arriving aeon's Overdrive gauge bar in the party-status window (§3.4)". So the aeon row is already in our own spec. The one unsourced part is whether Yuna's frozen row stays underneath it (option B's layout) |
| F2 | The aeons' turn-order tiles show a letter instead of a portrait | **CONFIRMED** | The "S" tiles in `isaaru/sheet.jpg` and `aeons/sheet.jpg`. The phone mockups draw portraits there, but only in the mockup |
| F3 | The move advisor suggests "Attack → Isaaru" | **PLAUSIBLE** (not re-run) | This is the I-G4/I-G5 seam. T7 must prove the fix by running the engine |
| F4 | Yuna stays on stage beside her aeon | **CONFIRMED, and it predates this chapter** | `BattlePresenterStage.ts:145-149` stages `activeIds` **and** `aeonId`, and the frozen party stays in `activeIds`. **Every live FFX chapter with a summon (I, VII, VIII, X) does this.** It contradicts §6.1 (sourced). It is an FFX-wide defect for the driver's queue, not only an Isaaru one |

### Option sheets (`docs/concepts/chapters/isaaru/`)

| # | Claim | Verdict | Evidence |
|---:|---|---|---|
| S1 | Every file the README lists exists | **CONFIRMED** | All 8 sheets are there, with their frames, cards, `.html`, CSS, `recipes.json` and the withdrawn renders |
| S2 | "Every sheet is one column, 1,200 px wide", readable on a phone | **CORRECTED** | Headings and captions read at phone width. But `fight/sheet-phone.jpg` has **three phone mockups side by side**. On a 390 px phone each is about 110 CSS px wide, and its "12 px" labels come out at about 4 px. Only the individual 390×844 files meet the 12 px claim. The HUD text inside the 1600×900 frames is also unreadable on a phone, so those sheets rely on their captions |
| S3 | O-1: all three "wear the costume the wiki describes in words (brown hair tied up, long dark coat with sea-green lapels, blue-violet robe, white under-robe, turquoise cord)"; C is "closest to the coat the wiki describes (full-length sea-green lapels)" | **REFUTED as worded** | The wiki (R11) describes a **black knee-length** jacket edged in sea green, a **blue blouse with long white cuffs**, and a **wide sea-green belt tied in a bow**. It says nothing of tied-up hair, a blue-violet robe or a cord. C's coat reaches the ankles, and its waist is a blue knot, not a sea-green belt. The README's list mixes the wiki's words with what the images show. C may still be the right pick for its pose and mood, but "closest to the wiki" does not hold. O-2 inherits the problem, because both portraits were painted from C |
| S4 | O-4 KO: "Pterya_defeated.jpg shows the aeon breaking into light" | **PLAUSIBLE** | One agent's reading of one image. It is correctly labelled as looked at, but it does not show that the dissolve is canon |
| S5 | O-5 shows only sourced rules and Chapter X values; no invented numbers | **CONFIRMED, with two caveats** | Ixion 1,513/40, Bahamut 1,398/35 and Yuna 1,650/270 match the builds, and no odds or damage figures appear. (i) The **turn order** in the frames (Yuna twice before Grothia) comes from the interception that set enemy Agility to 1. The README says so, but the sheets carry no caption about it. (ii) Every frame shows an **Items** row on the aeon's own menu. That is today's engine (`commands.ts:195` has no aeon check), but no research line sources an Item command for aeons, and §6.1 says party items cannot target aeons `[single source]`. B6/B7 should ask whether that row should exist |

### Shown as settled, but Bailey's call

- **B6** is built into O-5. Every option greys the locked row "the same way (plan B6 = a)", and every frame shows B6 = a's menu. The sheet should say "shown with the recommended B6 = a".
- **B2 (P1)** supplies every HUD number in O-5. The README labels it "plan B2 = a", but that is still only the recommendation, not Bailey's pick.
- **No invented game number** was found in the research, the plan or the sheets. R9 is an arithmetic slip, not a sourced figure.

### Verdict

- **Research:** it stands. Fix R9 and add I-9 (Kinoc against Mika).
- **Plan engine map:** it stands. Add E11 (a stalemate ends as an escape) to I-G3 and T10, and E6 (the tag) to T3 and T8.
- **Sheets, before they go to Bailey:**
  - Rewrite the O-1 rationale (S3) against the wiki's actual words.
  - Re-cut the phone sheet with one mockup per row (S2).
  - Add the Agility caption (S5).
  - Disclose B6 on the O-5 sheet.
- **F4** is a live FFX-wide defect for the driver.

**Corrections applied (2026-09-24, after this review):** R9 (1,898) in research §5.2 and §2 here; R10 → research
I-9; R3's two infobox notes in research §2.1; E11 → I-G3 and §9; E6 → T3 and T8; S5 (ii) → B7; S2, S3, S5 (i), F1
and the B6 disclosure on the sheets and README in `docs/concepts/chapters/isaaru/`.
