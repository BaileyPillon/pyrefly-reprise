# Re-parity CH-XVIII: our Chapter XVIII line and party, winnable on the game's 12-turn clock

Status: **built and committed on branch `re-parity-ch18` (from `origin/re-parity-w2`, `919f2c78`), pushed to `origin/re-parity-ch18`; not merged, not deployed.**
**Game case: FFX only** (AGENTS.md rule 14): Chapter XVIII is link 4 of Sin, a CTB boss with a turn clock and aeons. The FFX-2 and FF7 engines import none of
the files this batch touched; `ffx2-atb-golden` and `ff7-golden` are unchanged, and so is `ffx-engine-golden` (its 18 digests stop at Isaaru; the Sin chapters are not in it).

Bailey, 2026-10-09, his picked option label verbatim: **"Ship 12, retune our line later (Recommended)"**, whose approved description reads: "Ship the game-true turn 12 now. In a
separate batch, rework our own strategy line and party preset so the chapter is winnable again; boss numbers stay real." This is that batch. Boss numbers, Sin's AI and rules
(`src/battle/ffx/ai/overdrive-sin*.ts`), enemy data, command records and the 12-turn clock are **untouched**; no number of ours was added anywhere.

## 1. Result

| | Before (`919f2c78`) | After (this branch) |
|---|---|---|
| Chapter XVIII, the shipped line, 12 seeds (1 to 12) | 0 of 12 | **12 of 12** |
| 500 seeds (1 to 500) | 7 of 500 (1.4 %) | **500 of 500** |
| holdout 501 to 1000 | 7 of 500 | **500 of 500** |
| Sin's last turn when the fight ends (mean, of 12) | 12 (Giga-Graviton) | **8.2** |
| party KOs, Gaze statuses landed, party turns (a fight) | 2.9, 5.4, 57.3 | **0, 0, 47.2** |
| a card-follower (the move advisor's top card, seeds 1 to 100) | not measured | 100 of 100 |

The shipped pair is two changes, each one source-led and neither a number: **Lulu Doublecasts Firaga** (a line change; the ability is already in the preset) and **every armour
carries the Stone, Confuse and Zombie Wards** (a preset change; both Gaze sources and the guide's own page ask for them). The ladder in section 3 shows each alone: the line alone is
**371 of 500 (74 %)**, the Wards alone **102 of 500 (20 %)**, both **500 of 500**. See decision 1: the intended line now beats the chapter every time, which is a consequence of the sources'
own advice and not a target, and the lever that gives a race back is one line.

Commits (all on `re-parity-ch18`, each ends with the Co-Authored-By line):

| Commit | What |
|---|---|
| `82db827a` | `sinFaceBuild`: the rested Sin party re-equipped with the three Wards; Chapter XVIII's `buildRef`; Chapter XVII untouched |
| `58a051f4` | the line: Lulu Doublecasts, Turbo Ether first; `advisor-race.test.ts` reads the last turn off a held-back line |
| `40bf7b90` | the guide: the game's twelve, the Doublecast rule and hint, the Wards sentence, all cited; the dated update in the Jegged note |
| `f28eabca` | `re-parity-ch18.test.ts` (14 tests), the ladder test and the frozen old line |
| (this note) | `docs/handoff/re-parity-ch18.md` |

## 2. Diagnosis (hard rule 3: the engine, real seeds, the logs)

The old line (`sin-face.ts` at `919f2c78`), 500 seeds, the whole chapter through `setupForChapter`; scratch traces of seed 1 turn by turn.

- **The game's script, not the line, took the margin.** The chapter fell from 124 of 500 (13-turn placeholder, `re-parity-ai-evrae-yojimbo-isaaru-sin.md` section 4) to 3, 7 after the W2 merge: Giga-Graviton on Sin's **12th** turn and Sin acting first. The party gets
  about 4.8 actions per Sin turn, so the one turn is worth about five actions, and the old line had no five actions to give.
- **Where it ends.** It loses 493 of 500 and the losses are all Giga-Graviton (mean Sin turns at the end: 12.0). Sin's HP at the start of each of his turns, mean over 500 seeds:
  140,000, 136,118, 128,359, 115,535 (after the three pulls: 17.5 percent done), 102,231, 89,066, 76,807, 65,555, 53,589, 44,296, 33,310; the losses leave **23,367 on average
  (median 21,991, 10th percentile 8,134)**. Seed 1 loses with 8,795 left on Sin's last turn, one Auron swing short.
- **Who does the damage.** Per fight: Lulu 61,259, Auron 34,068, Wakka 21,657 (117,000 of the 140,000). Lulu's line is **one Firaga a turn, 16.9 casts a fight**, which is 270 of her 300 MP: she is the
  biggest hitter (research `ffx-sin.md` 6.2) and spends half of what a turn lets her cast, and the Ether branch (under 16 MP) is reached only on the last turns.
- **What the turns are spent on.** 57.3 party actions a fight: Lulu's casts 16.9, Wakka's swings 15.9, Auron's swings, Breaks and Dragon Fang 12.7, Tidus 3, and **6.9 on cures and potions**
  (Gaze fires 7 times a fight and lands **5.4 statuses**: Confuse 2.1, Zombie 1.9, Petrify 1.4; 2.9 party KOs a fight). Without a status landing the old line gains 95 wins of 500 (7 to 102) and has 0.5 fewer KOs a fight: Gaze is real, but it is not the whole gap.
- **The levers, one at a time** (section 3): Doublecast (Lulu's cast count is what the 12 turns pay for) is the big one, the Wards (no Gaze status, no cure turns, no KOs) the second.

## 3. The candidate pairs and the ladder

Every row plays Overdrive Sin from the chapter's own setup (`setupForChapter`) with the stated line and party, the same seeds, `autoResolveMinigames` on, the committed harness's
fallback for a tactic with no pick. **Rows 0, C1, C2 and C3 are the committed `tests/unit/re-parity-ch18-ladder.test.ts`, and C2 is also the plain `ffx-parity-measure` harness**
(they agree to the seed); rows C4, C4w, C5 and C5o are scratch-lab lines (copy in `D:\Tools\ffx-parity\ch18-scratch\`, outside the repo) and are described, not shipped. The lab reproduces the committed old line (7 of 500) and the shipped one (500 of 500) exactly.

| # | Line | Party | 12 seeds | 500 seeds (1 to 500) | holdout (501 to 1000) | mean Sin turn at the end (1 to 500) |
|---|---|---|---:|---:|---:|---:|
| 0 | the old line (one Firaga a turn) | rested (the old Chapter XVIII party) | 0 | 7 | 7 | 12.0 |
| C1 | **the Doublecast line** | rested | 5 | 371 (74.2 %) | 344 | 10.4 |
| **C2 (shipped)** | **the Doublecast line** | **Wards** | **12** | **500** | **500** | **8.2** |
| C3 | the old line | Wards (the sources' plan as written, no Doublecast) | 2 | 102 (20.4 %) | 110 | 11.8 |
| C4 | the richer line: Doublecast + a Zombie Lulu is cured before her Ether + the others hand her the Ethers + Tidus stays in as the third | rested | 12 | 497 | 499 | 9.0 |
| C4w | the richer line | Wards | 12 | 500 | 500 | 8.0 |
| C5 | the Doublecast line | Auto-Med on Tidus, Wakka, Lulu and Auron (Jegged's other answer, Remedies from the bag) | 12 | 470 (94 %) | 471 | 9.8 |
| C5o | the old line | Auto-Med | 0 | 10 | 9 | 12.0 |

Reading it:
- **Doublecast is worth 72.8 points alone** (7 to 371): Lulu's cast count, not a number, is what the clock buys. **The Wards are worth 19 points alone** (7 to 102) and 26 on top of the new line (371 to 500). Together they are 100:
  the Doublecast burns MP and turns, and a Gaze status each fight takes both back (a cure turn, a petrified or zombified Lulu).
- **C4 reaches 99 percent on the rested party by playing around Gaze** (cure the Zombie before the Ether, hand her the Ethers, keep Tidus, the fastest member, as the third); it is the line to use if Bailey wants the old,
  unprepared party. It is more code and is not what the sources ask for, so it is not shipped.
- **C5, Auto-Med**, is the middle rung: 94 percent, Gaze statuses still land and spend the 6 Remedies in the bag.
- Not built: Jegged's Frag Grenade for Armor Break (Rikku Mixes two Power or Ability Spheres; `sphereInventory` is empty) and the aeon Overdrive finish (`ffx-sin.md` 8 row 8); see open items.

Choice: **C2**. The rule I wrote down before choosing: ship the pair whose every step has a source line, whose line the guide can say in 3 to 5 rules, and take the rate it gives. C2 is the smallest change from the
shipped chapter that both sources' advice produces (one ability the preset has, one set of armour abilities both Gaze sources and the guide page name); C4 adds three unsourced behaviours to buy back what the Wards buy for free.

## 4. The shipped pair

### 4.1 The party (`sinFaceBuild`, `src/data/ffx/builds/sin-fahrenheit.ts`)

Only the armour's auto-abilities change; stats, weapons, abilities, Overdrives, gauges, aeons, bag and gil are `sinFahrenheitBuild` to the digit (a test strips the armour and compares). Four slots each (`dreams-end.ts`).
The rule: remove Death Ward and Auto-Med, then add whichever of Stone Ward, Confuse Ward, Zombie Ward the armour does not have (a Stoneproof counts as the Stone Ward).

| Member (armour) | Before | After |
|---|---|---|
| Tidus (Tetra Shield) | HP +20 %, Death Ward, Confuse Ward | HP +20 %, Confuse Ward, Stone Ward, Zombie Ward |
| Yuna (Tetra Ring) | Magic Def +20 %, Stoneproof, Death Ward, Confuse Ward | Magic Def +20 %, Stoneproof, Confuse Ward, Zombie Ward |
| Auron (Tetra Bracer) | HP +20 %, Death Ward, Auto-Med | HP +20 %, Stone Ward, Confuse Ward, Zombie Ward |
| Wakka (Tetra Armguard) | HP +20 %, Death Ward | HP +20 %, Stone Ward, Confuse Ward, Zombie Ward |
| Lulu (Tetra Bangle) | HP +20 %, Death Ward, Stoneproof | HP +20 %, Stoneproof, Confuse Ward, Zombie Ward |
| Rikku (Tetra Targe), Kimahri (Tetra Armlet) | HP +20 %, Death Ward | HP +20 %, Stone Ward, Confuse Ward, Zombie Ward |

Citation for every value (no value here is a number; each is an ability id the engine already had on these armours or in `AutoAbilityId`):

| Claim | Source |
|---|---|
| wear protection against Petrify, Confuse and Zombie before this fight; a Ward is enough | `research/ffx-sin.md` 1.2 (bover_87, single source for the advice) and 8 row 9 `[verified: 2 sources + derived]` |
| Stone, Confuse and Zombie Wards, or Auto-Med with a stock of Remedies | `research/jegged-encounter-guides-ffx-b.md` section 6 item 6 and section 7 |
| the guide's own page for the fight tells the player to wear Stoneproof or Stone Ward, Confuseproof or Confuse Ward, Zombieproof or Zombie Ward | `src/data/guides/docs/sin-face.ts` (and party prep has no equipment screen) |
| a Ward is resistance 50, subtracted from Gaze's 30 percent: it never lands | `ffx-sin.md` 5.4 `[verified: 2 sources + derived]`, `ffx-combat-core.md` 4.1 |
| link 4 is where the player re-equips | `ffx-sin.md` 1.2 `[verified: 2 sources]`, 7.3 item 3 |
| Death Ward is idle here (Gaze kills nobody; Giga-Graviton is Death 255 and a scripted Game Over) | `ffx-sin.md` 3.4 `[verified: 4 sources]` |
| four armour slots | `src/data/ffx/builds/dreams-end.ts` (`slots: 4`) |
| the Tetra armours at all | `ffx-sin.md` 7.3 (option B, Bailey's pick, `[estimate]`), unchanged |

Chapter XVII keeps the old armour: `sinFinsCoreBuild` is built from `sinFahrenheitBuild`, which is unchanged (a test pins both).

### 4.2 The line (`src/engine/tactics/sin-face.ts`)

The old line, with Lulu's cast changed and nothing else:

- Lulu's cast is a **Doublecast Firaga** (`{kind:'ability', id:'doublecast', wrappedId:'firaga'}`, the shape `braskas-final-aeon.ts` uses) while `mp >= 2 x Firaga's cost` (the cost is the menu row's own `mpCost`, 16
  when the row is disabled), else one Firaga or Fira; in reach it is `cast() ?? swing()`.
- Her Ether branch moves from "under one cast" (16) to "under two" (32) while the Doublecast row exists, and drinks the **Turbo Ether first** (one drink fills her), then the Ether. On the shipped pair the order does not move a win (1000 of 1000 either way); it saves
  two turns a fight (47.2 against 49.1).
- Unchanged: upkeep (Soft, Remedy, Phoenix Down, Holy Water, X-Potion under 35 %), Hastega/Haste first, an Overdrive whenever one reaches, the pulls (Tidus Cheers to five, Wakka swings, Yuna and Auron make way), Armor Break the moment Sin is in
  reach, then Mental Break. The two existing tests that pin the opening (Tidus' first call is Hastega; Auron's first call in reach is Armor Break) pass untouched.

## 5. The guide text, old to new (`src/data/guides/sin-face.ts`, `docs/sin-face.ts`, `chapter-sin-face.ts`)

| Where | Old | New |
|---|---|---|
| guide rule 1, text | "... when it is fully open Giga-Graviton ends the fight: no Auto-Life or aeon saves you. We use the 13th turn; the sources say 12th or 13th, and that is our estimate." | "Three turns pulling the ship in, eight more while the mouth opens, and on its twelfth turn Giga-Graviton ends the fight: no Auto-Life or aeon saves you. The game's own script fixes the twelfth." |
| guide rule 1, short | "Beat it before Sin's 13th turn (our estimate)" | "Beat it before Sin's 12th turn" |
| guide rule 1, cite | `ffx-sin §5.4, §3.4, §10 S-1` | `ffx-sin §5.4, §3.4 (the twelfth: re-ffx-ai-evrae-yojimbo-isaaru-sin §7.2)` |
| guide rule (new, fifth) | none | "Lulu is most of the damage: she Doublecasts Firaga on every turn she can pay for two, and drinks an Ether when she cannot. A Mental Break from Auron opens Sin to both casts." short "Lulu Doublecasts Firaga; Ether to refill", cite `ffx-sin §6.2, §8 row 8 (Doublecast is hers here: ffx-bfa-yu-yevon §4.2)` |
| guide Gaze rule | "... Any Ward blocks it completely." | "... Any Ward blocks it completely, and the party starts with all three." |
| guide hint (new) | none | Doublecast: "Two Firagas for one turn: the most damage Lulu has, at twice the MP, and magic reaches through the pulls" (cite `ffx-bfa-yu-yevon §4.2, ffx-sin §5.4`) |
| guide hint, Ether | "Lulu's Firaga is the burst's steadiest damage; keep her casting" | "Lulu's Doublecast Firagas are the burst's steadiest damage; refill her before she cannot pay for two" |
| walkthrough page | "after about thirteen turns Sin uses its Overdrive, Giga-Graviton" | "on its twelfth turn Sin uses its Overdrive, Giga-Graviton" |
| `chapter-sin-face.ts` header | "D-280 (Giga-Graviton on Sin's 13th turn, our estimate, until a Steam check)" | the same sentence, then "answered: the game's own script fires it on Sin's 12th turn ..., and Bailey's 2026-10-09 answer is this chapter's line and party" |
| `research/jegged-encounter-guides-ffx-b.md` | "our estimate is the 13th ... Keep 13 and label it" (2026-10-03, left as written) | a dated update under section 7 and the section 8 row: 12, the game's script |

`guide-doc.test.ts` now pins "on its twelfth turn" and that "thirteen" appears nowhere on the page.

## 6. Checks

- `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean (the six scratch tests of this lane were moved out of the tree first; `tests/unit/zz-diag-b.tmp.test.ts` and `zz-measure-b.tmp.test.ts` are another lane's and compile).
- Targeted (run before the last two commits; the full run below covers them): 86 files, 1,005 tests passed, 3 skipped: `advisor-*`, `strategy-guide*`, `guide-*`, `chapters/sin-*` (data, engine, tactic, bench, hud, listed, ship layer, story, phone staging, orders), `re-parity-ai-sin-*`, `re-parity-ch18`, `tactics-lookup`, `data-ffx-builds`, `ui-strategy-guide*`.
- Mutation checks of the new tests (each mutant restored, sha1 checked): the Doublecast branch off fails 4 tests; Chapter XVIII's `buildRef` back to the old build fails 2; Ether before Turbo Ether fails 1; no room made for the Wards makes `sinFaceBuild` refuse to load (the slot guard).
- Full suite, once, on the tip: section 9.
- `node tools/orphans.mjs`: nothing new (the frozen old line is imported by the ladder).
- Real-input browser check: the main session's (this worktree has no `public/art`). The visible changes to look at: Party Prep > Equipment for Chapter XVIII (the armour chips), the strategy guide panel (rules 1, 4 and the new 5th; "Doublecast: Firaga" NEXT lines), and the HUD clock (already 12).

## 7. How to re-run (on the merged tree, after W5)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
# the shipped pair, through the plain harness (12 seeds by default):
PYREFLY_MEASURE=1 PYREFLY_MEASURE_CHAPTERS=sin-face PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=sin-face-500.json \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts --testTimeout=600000
# the ladder: old/shipped line x rested/warded party (about 1 minute for 500 seeds):
PYREFLY_CH18_LADDER=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=ladder-500.json \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ch18-ladder.test.ts --testTimeout=3600000
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ch18.test.ts tests/unit/re-parity-ai-sin-face.test.ts tests/unit/chapters/sin-tactic.test.ts tests/unit/advisor-race.test.ts tests/unit/guide-doc.test.ts
```

Expected on this branch: the shipped pair 12 of 12 and 500 of 500; the ladder rows 7, 102, 371, 500 (1 to 500) and 0, 2, 5, 12 (1 to 12). A move in any of them after the merge is W5's to explain; the ladder says which lever moved.

## 8. Open items

1. **W5 (Overdrive gauge gains, aeon rules) may move this chapter.** Only Auron's gauge fills here today (Warrior mode; Tidus, Lulu, Kimahri are Stoic and fill from damage taken, Wakka is Victor: `docs/plans/sin-link4-bench.md`). If W5 fills Lulu's, the line's Overdrive pick is `commands.find(overdrive)`: Lulu's Fury expands into one row per spell
   and the first is Fire Fury; `braskas-final-aeon.ts#fury` picks the best. Not changed here (Lulu's rows were disabled in a forced-gauge probe, and the case is W5's to open).
2. **Aeon Overdrives to finish** (`ffx-sin.md` 8 row 8, `[verified: 4 sources]`): the line uses no aeons ("the preset's aeon gauges are not full", the bench plan). After pull 2 the game's reach table lets the aeon Overdrives of reach 1 land (Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Zanmato, Delta Attack) while melee does not
   (`re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 1.3). That is the next line change once W5 settles the gauges.
3. **Rikku's Luck and Mix** (Jegged: Luck in the first turns; two Power or Ability Spheres Mixed for a Frag Grenade as the Armor Break) are not in the line: Rikku is on the bench and `sphereInventory` is `{}`. Whether the bag could hold the spheres is not sourced.
4. **Jegged's "a stock of Remedies" and the 20 Remedies Auto-Med costs** (the walkthrough page) are not modelled; the bag keeps `dreams-end.ts`'s six Remedies. C5 (Auto-Med) is measured with them.
5. **`research/ffx-sin.md` 10 S-1** still says "default the 13th" (superseded by the script note, `re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 9 and this lane's guide); I added the dated update to the Jegged note only and left `ffx-sin.md` as the wiki's reading.
6. `docs/handoff/re-parity-ai-evrae-yojimbo-isaaru-sin.md` section 6 and `re-parity-rc1.md` still list the Sin face guide text as stale; it no longer is (this note, section 5). I did not edit them.
7. The ledgers (`DECISIONS.md`, `ACTIONS.md`), `NOW.md` and `CHANGELOG.md` are the main session's; the paragraph for the CHANGELOG is below.
8. Two Gaze decisions were left alone because they are Sin's script, not ours: which Gaze variant fires is the script's three-way draw (`GAZE_VARIANTS`), and a Ward blocks all three equally.

## 9. Full suite

One run of the whole unit suite on `f28eabca` plus this note (2026-10-10, `--fsModuleCache --fsModuleCachePath D:/Tools/ffx-parity/ch18-vitest-cache --testTimeout=60000 --maxWorkers=4`, 1,527 seconds on a loaded machine):
**1,020 files: 988 passed, 21 failed, 11 skipped; 15,466 tests: 15,179 passed, 181 failed, 105 skipped, 1 todo.**

**All 21 failing files are the art-only set this worktree has without `public/art`**, the same 21 files lane C listed (every failure is an ENOENT on `public/art/...`, a missing `public/art/manifest.json`, or "reference image not found"):
`ui-portrait-face-crop` 145 tests (125 on lane C's tree: more portrait rows now), `chapters/trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3,
`chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2,
`cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/den-of-woe-ship-scene` 1, and five files that fail on import because `public/art/manifest.json` is missing: `party-face-manifest`,
`chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`. Nothing else failed. `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden` passed unchanged
(the engine golden's 18 digests stop at Isaaru; the Sin chapters are not in it, so no digest moved and none was re-pinned).

## 10. Decisions for Bailey

1. **How hard should the capstone be? (the one that matters).** With the Wards and the Doublecast the intended line wins 500 of 500 and Sin is down by his 8.2th turn of twelve. That is what both Gaze sources and the guide's own page produce when followed, but it is the
   easiest chapter in the game for the line (lane C measured Chapter XVII at 87 percent, Isaaru 85, Yojimbo 97, Evrae 98; those are the other chapters' figures on that tree, not re-run here). A player who skips either lever still loses: the Wards alone are 20 percent, the Doublecast alone 74, a party that only Defends loses on turn 12.
   Options, each one line: **keep it (recommended)**; **take the Wards back** (Chapter XVIII's `buildRef` to `sinFahrenheitBuild`, 74 percent: a race again, the Gaze statuses are the pressure); **ship Jegged's other answer, Auto-Med** instead of the Wards (94 percent). Your call; I did not tune toward any of them.
2. **Party Prep shows the new armour** (Equipment panel: the chips read Stone Ward, Confuse Ward, Zombie Ward on every member, Death Ward and Auto-Med gone). A small visible change; no screenshot was possible here (no `public/art`). Say yes to keep it, or I revert `buildRef` and nothing else moves.
3. **The guide gets a fifth rule and a Doublecast hint** (section 5) and loses "our estimate". Visible text, cited. Yes to keep?
4. **Aeon Overdrives as the finisher** (open item 2) are the sources' fourth step in the plan and the next line change, after W5; they need your yes as new play (rule 10).

## 11. For the release CHANGELOG (plain words)

**Chapter XVIII, Sin: the Face (FFX).** Sin's last attack now comes on his twelfth turn, as in the game, so the old way of fighting him ran out of time. The suggested line now has Lulu cast two Firagas a turn with Doublecast (she already knew it) and
drink a Turbo Ether when she is low, and the party starts the fight in armour with the Stone, Confuse and Zombie Wards that the guide tells you to wear, so Sin's Gaze no longer petrifies, confuses or zombifies anyone. Following the card, the fight is won with a few
turns to spare; skip the Wards or the Doublecast and it is a real race again. The in-battle guide says twelve turns and explains the new steps. Sin's own numbers and his clock are unchanged.
