# Chapter — The Leblanc Syndicate, Chateau Leblanc (FFX-2): engine and data

**Game case: FFX-2 only** [AGENTS.md rule 14]. Every number comes from FFX-2
bestiary records #220 / #221 / #222 / #227 / #228 / #231; nothing in this
encounter exists in FFX. The three engine capabilities it adds land in
`src/battle/ffx2/**` only, `src/battle/ffx/**` and `src/data/ffx/**` are
untouched, and the absence tests are the last `describe` block of
`tests/unit/chapters/leblanc-engine.test.ts`.

Built to the paper preflight `docs/plans/chapter-leblanc-review.md` (verdict
PROCEED), against `research/ffx2-leblanc-syndicate.md`.

---

## Status: engine and data done, **not a playable chapter**

No scene, no story script, no art, no music, and none of §6's perceivable
assets has been through an options round — so `src/data/encounters.ts`,
`src/data/chapter-meta.ts`, `src/scenes/index.ts`, `src/engine/tactics/index.ts`,
`src/data/guides/index.ts`, `src/audio/tracks/index.ts` and
`src/data/ffx2/ids.ts` are **deliberately untouched** and chapter select keeps
showing the chapter as *Coming* (hard rule 9).

The three formations, the build and the tactic are reachable through the same
dev-only hook Macalania and Evrae use: `ENEMY_GROUPS_BY_ID['ffx2-leblanc-entrance']`
/ `['ffx2-leblanc-logos-room']` / `['ffx2-leblanc-last-room']`, and
`chateauBuild` imported directly. `node tools/orphans.mjs` lists
`src/engine/tactics/ffx2-leblanc.ts` and `src/data/ffx2/builds/chateau.ts` as
unimported from `src/`; that is expected and it is exactly where
`seymour-anima-macalania.ts` and `evrae.ts` sit — they register in the
integrator's single commit.

---

## 1. The headline numbers

Every number below came from **running** the real engine against the real data
[hard rule 3]. The three-act mission is walked with the same `setupForNextLink`
the real chapter screen uses, so the party arrives at Act III on whatever HP, MP
and inventory Acts I and II left it.

`D` is the modelled human decision time — an **input to a measurement, not game
data** — and the three arms are `tests/unit/ffx2-active-measure.test.ts`'s own.

| Case | D | Result | Median player turns | Median s |
|---|---|---|---|---|
| **A1** — the shipped line, whole three-act mission, 40 seeds | **0 ms** | **40/40 (100 %)** | 45 | 59.5 |
| A1 | 1 500 ms | **4/40** | 57 | 145.7 |
| A1 | 4 000 ms | **0/40** | 30 | 139.8 |
| A1b — Act III **alone**, from full, 20 seeds | 0 ms | 20/20 | 12 | — |
| **A2** — credible mistake (Leblanc and Logos first), Act III, 20 seeds | 0 ms | Huggles fires; **every run that saw one finished with fewer than three girls** | — | — |
| **A3** — careless mashing, whole mission, 12 seeds | 0 ms | **0/12** | — | — |
| A3b — careless mashing, Act III **alone**, from full | 0 ms | **6/12 wins** | — | — |
| The generic `intendedStrategy` with no tactic, whole mission | 0 ms | **3/40** | — | — |

**A1's bar is ≥ 90 % and the D = 0 arm clears it at 100 %.** D = 0 is the arm
every shipped chapter's evidence is measured at (`strategy-ffx2-bahamut.test.ts`
and `strategy-ffx2-vegnagun*.test.ts` drive no decision clock).

### The Active-ATB arms are a project-wide open item, not this chapter's defect

Measured in the same session, same harness, same forty seeds
(`PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts`):

| Chapter | D = 0 | D = 1 500 | D = 4 000 |
|---|---|---|---|
| ch4 Bahamut | 40/40 | 40/40 | 40/40 |
| **ch5 Vegnagun** | 40/40 | **0/40** | **0/40** |
| **this chapter** | 40/40 | 4/40 | 0/40 |

The shipped Chapter 5 is already 0/40 at both non-zero arms. This chapter sits
between the two, and **no boss number was touched to get there**
(`memory: boss-side-fix-needs-measured-options`). What the arms measure is that
a mission of three chained fights on one pool of HP, MP and items is very
sensitive to how much clock a menu burns — which is D-009's cost, and it is
Bailey's decision, not a builder's.

### Where the difficulty actually lives

Act III **from full** is a 12-turn win for the shipped line and a **6/12 win for
mashing Attack**. The mission is hard because it is three fights on one pool,
not because the last room's stat blocks are hard. Anyone tuning the chapter's
pacing should start from that number rather than from the enemy records.

---

## 2. What was built

### Data (FFX-2 only)

| File | What |
|---|---|
| `src/data/ffx2/enemies/leblanc-syndicate.ts` | Act III: Leblanc #231, Logos #228, Ormi #222, every cell cited to §3 with its confidence tag, plus §3.4's stat-shape reading verbatim |
| `src/data/ffx2/enemies/leblanc-syndicate-acts.ts` | Acts I and II (#220, #221, #227), the two goons, and the assembled three-act chain |
| `src/data/ffx2/enemies/leblanc-syndicate-abilities.ts` | Ormi's four, Logos' three, the goons' ten |
| `src/data/ffx2/enemies/leblanc-syndicate-leblanc-abilities.ts` | Leblanc's twelve and the three No Love Lost stages |
| `src/data/ffx2/builds/chateau.ts` | Yuna 20 Gunner / Rikku 21 Thief / Paine 22 Warrior, §7's grids, accessories, abilities and bag |
| `src/data/ffx2/enemies/index.ts` | **the only shared file this track edited** — the dev-only registry entry, five lines |

### Engine — three additive changes, **no contract file touched**

`src/battle/common/types.ts` was not touched and neither was
`docs/CONTRACT-CHANGES.md`. All three preflight capabilities turned out to be
reachable through `AbilityDef.extra`, which `docs/CONTRACTS.md` explicitly
sanctions for one-off scripted rules, or through a flag `Ffx2Unit` already had.

| # | Capability | Where | Preflight |
|---|---|---|---|
| 1 | **Eject removes a character.** `applyRiders` sets `target.removed = true` beside the `ko` case; `clearAfterBattle` clears it. `targeting.ts::isTargetable`, `engine.ts`'s `party()`, `gauges.ts` and `results.ts` all already tested `!u.removed`, so untargetability, a frozen gauge and "all three gone = defeat" fell out for free | `resolve.ts`, `statuses.ts` | E1 |
| 2 | **"Exactly one of six".** `extra.statusRollOneOf` makes `applyRiders` draw one application instead of rolling each | `resolve.ts` | E2 |
| 3 | **One action, three stages.** `extra.sequence` resolves the named abilities in order from the same user, once, with a recursion guard | `resolve.ts` | E5 |
| — | **E4, the positional target**, is **not** an engine change: Ormi's AI picks the highest `slot`, labelled AUTHORED | `ai/leblanc-syndicate.ts` | E4 |
| — | **E3, petrify-shatter**, is deliberately **not** built (owner, 2026-09-21) | — | E3 |
| — | **E-G1** needed no change at all: the project's `ENEMY_BASE_ACCURACY` fallback already is the answer | — | E-G1 |

`src/battle/ffx2/ai/index.ts` gained the five scripts (one import, one spread) —
without it every Syndicate enemy falls back to `idleScript` and the fight does
not happen.

### AI scripts

`src/battle/ffx2/ai/leblanc-syndicate.ts` — Leblanc and Ormi transcribed
verbatim from §5.3's decompile-derived tables, Logos **AUTHORED** per §13 G3,
and the two goons AUTHORED (§4.6 publishes their ability lists and nothing about
how they choose).

### Tactic and tests

- `src/engine/tactics/ffx2-leblanc.ts` — the Logos → Ormi → Leblanc line.
- `tests/unit/chapters/leblanc-engine.test.ts` — 24 cases (A4-A9, A11, the data
  transcription and the G1 pin).
- `tests/unit/strategy-ffx2-leblanc.test.ts` — 8 cases (A1, A2, A3, the three
  arms, and the control that the generic strategy is not a substitute).

---

## 3. Owner-approved authored values, each labelled in code

Bailey, 2026-09-21, by name in this track's brief.

| # | Value | Constant | Gap |
|---|---|---|---|
| Q2 | **Mach Fan 106** | `MACH_FAN_BASE` | G2 |
| Q2 | **Hail of Bullets 106** | `HAIL_OF_BULLETS_BASE` | G2 |
| Q2 | **Russian Roulette 200** | `RUSSIAN_ROULETTE_BASE` | G2 |
| Q3 | Supercollider targets the **back of the formation** (highest `slot`) | `SUPERCOLLIDER_TARGETS_BACK_OF_FORMATION` | — |
| Q4 | **No petrify-shatter permanence** in this chapter | (nothing built) | — |
| G10 | Huggles **is** accuracy-checked and Darkness blunts it | `HUGGLES_IS_ACCURACY_CHECKED` | G10 |
| G3 | Logos' 3-turn loop | `LOGOS_SCRIPT_IS_AUTHORED` | G3 |

All three of the Q2 numbers are interpolated **inside the fight's own published
Constant band** (24 / 50 / 106 / 200 / 300, §4.1), not chosen by feel, and
§4.1's band-inversion method closes them the moment any band is published.

## 4. Authored values this track had to decide, which the brief did not name

Each of these is a question for Bailey (§8).

| # | Decision | Where | Why it had to be decided |
|---|---|---|---|
| **N1** | **Acts I and II carry their own character's Act III Str/Mag/Agi/Luck.** The #220 / #221 / #227 records publish only Lv / HP / Def / MDef / Eva | `leblanc-syndicate-acts.ts`, `earlierRecord()` | The brief says deliver three acts; the alternative was inventing five numbers per enemy rather than reusing the same person's own published ones |
| **N2** | **Not-So-Mighty Guard lasts 40 units (21.2 s), not the project's usual 127 (67.3 s)** | `SYNDICATE_BUFF_DURATION` | No source publishes a duration. §4.4 says the script recasts it "roughly every 21 s"; at 67 s two of Leblanc's six looped turns would be pure waste and Protect + Shell would simply always be up, which makes Dispel — the only counter-play the research names — an unwinnable treadmill |
| **N3** | **Party-wide Constant-type moves ship `canMiss: false`; single-target physicals roll** | `PARTY_WIDE_CONSTANTS_ALWAYS_LAND` | No source gives a hit column for any of them, and G1 says the enemy hit model is the part nobody understands. §6.1 lists them as flat numbers landing on the whole party |
| **N4** | **Flash Bomb / Hush Grenade ship status power 40, not 50** | `FLASH_STATUS_POWER` | The published **50 %** is a landing chance; §2.6a's linear formula carries level terms, and 40 is the byte that reproduces 50 % against this chapter's Lv 20-22 party |
| **N5** | **Dr. Goon ships `acc: 0`, though his record publishes Accuracy 3** | `leblanc-syndicate-acts.ts` | A literal 3 routes *past* `ENEMY_BASE_ACCURACY` (which fires only at 0) and gives him a 0 % hit rate — the exact G1 contradiction. Shipping 0 takes the documented fallback |
| **N6** | **`zantetsu` resistance (Leblanc 60, the boys 50) is not modelled** | `leblanc-syndicate.ts` | There is no `zantetsu` member of `StatusId`, and the only thing that would read it is the Samurai, a Chapter 3 dressphere §7.2 says is not owned here |
| **N7** | **Ormi's two overrides are taken in the order the source prints them** — HP < 25 % before the last-enemy branch | `ai/leblanc-syndicate.ts` | §5.3 lists them sequentially and states no precedence. This order keeps both of §5.4's facts true |

## 5. The one measured decision worth arguing with

**The shipped line does not spherechange into the mage dresspheres, and it does
not open with Darkness Dance.** Both are what the research recommends, and both
are worse in this engine. Measured, same forty seeds, nothing else changed:

| Line | Wins (whole mission, D = 0) | Median player turns |
|---|---|---|
| **no spherechange** | **40/40** | **45** |
| White Mage only | 18/40 | 98 |
| Black Mage only | 14/40 | 74 |
| both | 4/40 | 88 |

§6.2's damage table is right about the numbers — a Black Mage's Fira really does
302 through Ormi's MDef 16 where a Warrior's sword does 121 through his Def 84 —
and it is silent about the thing that decides a three-fight mission:
`spherechange.ts::refreshDerivedStats` keeps the HP **ratio** and swaps the
**pool**, so putting Rikku in Black Mage and Paine in White Mage takes the party
from 1,034 / 934 / 1,089 to 1,034 / 618 / 664. That is **741 HP, a quarter of
the party's total pool**, thrown away in a fight whose real damage is party-wide
constants no Defense stat reduces [§6.1].

Darkness Dance is a second case of the same thing: in this engine a Dance lasts
only *while she keeps dancing* (`extra.sustainedWhileDancing`), so holding the
trio blind costs one of three actions for the whole mission, and what it blunts
is the ordinary attacks §6.1 already calls minor.

Both are **one line from being flipped** (`SPHERECHANGE_INTO_MAGES`), both
branches are kept in the file, and no boss number was touched.

## 6. Where the growth went (rule 7, honestly)

| File | Before | After |
|---|---|---|
| `src/battle/ffx2/resolve.ts` | 403 | 461 |

Every new file is under the 400-line limit; `leblanc-syndicate.ts` was split at
486 to get there. `resolve.ts` was **already over** before this track and this
track added 58 lines, most of them the provenance comments the two new `extra`
keys require. Splitting it is a shared-file movement several agents are editing
around, so it is **not** done here and is listed as debt this track added to,
the same way `docs/handoff/ffx2-active-atb.md` §7b lists its four files.

## 7. Not done in this track

- **Everything the player sees or hears**: scene, story script, guide, the
  Leblanc / Logos / Ormi battle paintings and speaker portraits, the Chateau
  backdrop, the chapter card, the pause plate, the VFX and the three music cues.
  §6 of the preflight lists all of it as a `gap` in `docs/target/targets.json`
  and hard rule 9 applies — options rounds O1-O5 come first.
  (`src/story/scripts/ffx2-leblanc.ts` exists and belongs to the story track,
  not to this one.)
- **Chapter registration** — the nine integrator-only files listed above. The
  tactic's module comment carries the exact line to add.
- **A10**, the real-input browser route, and **A12**, the target-versus-build
  pairs: both belong to the integration step and A12 is not startable while the
  tile is a gap.
- **The guide** (`src/data/guides/ffx2-leblanc.ts`) — the preflight puts it in
  track G with the tactic; only the tactic was in this brief.
- **Delay.** Supercollider, each Huggles hit and Mach Fan carry the
  `weak-delay` `ActionFlag` for provenance, but **the FFX-2 engine has no reader
  for it** (only `src/battle/ffx/abilities.ts` reads it) and G4 leaves the
  magnitude unpublished. Recorded, not invented.
- **`x2-budget-grenade`** (the Dr. Goon's common steal) has no `ItemDef` row, so
  the Steal banner would print the raw id — the same convention `bahamut.ts`
  ships `x2-mute-shock` under, and Macalania's three sphere rewards.
- **Splitting `resolve.ts`** — see §6.

## 8. Questions for Bailey

1. **May Acts I and II carry the Act III stat blocks' unpublished fields?** (N1.)
   The earlier records publish only Lv / HP / Def / MDef / Eva. The alternative
   is to ship Act III alone and leave the mission one fight long.
2. **Is 21 s the right life for Not-So-Mighty Guard?** (N2.) No source says.
   At the project's usual 67 s the buff is permanent and Dispel cannot win.
3. **The engine models no status-guard accessory at all.** Silver Glasses,
   White Cape, Beaded Brooch and Star Pendant are §7.5's named counters to
   Flash Bomb, Hush Grenade and Russian Roulette's Poison roll, and
   `src/battle/ffx2/accessories.ts` is a pure stat table — an unknown id is a
   silent no-op. `chateauBuild` therefore equips none of them, and the chapter
   is *more* exposed to status than a canonical Chapter 2 party would be. Worth
   a small additive capability, or leave it?
4. **Active ATB costs this mission 40/40 → 4/40 at a 1.5 s decision time**, and
   the shipped Chapter 5 is already 0/40 at the same arm. That is a
   chapter-independent pacing decision (D-009) and it needs an owner's answer
   before any chapter is tuned for it. Bringing measured options, not a fix.
5. **Chapter number and select order** (preflight Q1) is still unanswered; it
   blocks only the integrator.
6. **Does Dr. Goon's published Accuracy of 3 stand?** (N5.) Under the decoded
   hit model it means he never connects.

## 9. How it was verified

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/chapters/leblanc-engine.test.ts` — **24 passed**.
- `npx vitest run tests/unit/strategy-ffx2-leblanc.test.ts` — **8 passed**.
- `npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts tests/unit/ffx2-active-measure.test.ts tests/unit/ffx2-active-atb.test.ts tests/unit/ffx-no-active-clock.test.ts`
  — 46 passed, 2 skipped. **Chapters 4 and 5 did not move**: Chapter 4 is still
  40/40 on its canonical seeds with zero decision time, the D = 0 control still
  reproduces the shipped numbers, and every enemy in both shipped X-2 chapters
  is Eject-immune, which the new absence case pins.
- `PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts` —
  the ch4 / ch5 baseline table in §1.
- One full `npm test` — **200 files, 4 967 passed, 2 skipped**.
- `node tools/orphans.mjs` — the two expected integrator-only names.
- Every behavioural claim above was **run**, not grepped [hard rule 3].

## 10. Verifier findings, closed 2026-09-21/22 (data and tests only, FFX-2 only)

Four open findings from this track's verifier, all fixed inside the files this
track owns (`src/data/ffx2/enemies/leblanc-syndicate-abilities.ts`,
`leblanc-syndicate-acts.ts`, `tests/unit/chapters/leblanc-engine.test.ts`); no
boss number was touched.

1. **Supercollider's hit check versus Darkness.** §4.2 types Supercollider
   "Fractional + Delay," not Physical, so `damageType: 'other'` (no Defense
   term) stands and it is genuinely not a physical attack. But
   `formula: 'percent-current'` is not `'none'` and the row carried no
   `canMiss: false`, so `hitPercent()` already rolled a hit check for it —
   it just never carried `affected-by-darkness`, so the party's Darkness
   Dance opener silently did nothing against it. Fixed by adding
   `affected-by-darkness` to the ability's flags, per §5.1's reading that the
   Darkness-quarters-Accuracy term covers the trio's hit-checked actions in
   general. New coverage: `tests/unit/chapters/leblanc-engine.test.ts`'s
   "Supercollider rolls a hit check and Darkness quarters it" describe block,
   proven on the real engine over 200 seeds. The A1/A2/A3 win-rate numbers in
   §1 did not move (re-run, byte-identical: 40/40, 4/40, 0/40; Act III
   mashing 6/12).
2. **Russian Roulette's "canon" label corrected.** The code comment claimed
   "canon is that the roulette always lands *something*"; §4.3 verifies the
   six outcomes but says nothing about whether the ability can ever land
   none of them, so "always lands something" is this project's AUTHORED
   reading of "plus one of: ...", not a sourced fact. Label corrected in
   place; the number (`chance: 254`, guaranteed application) is unchanged.
3. **Three tautological tests, rewritten against the sourced/real value:**
   - "a sequenced stage does not recurse" built two separate `ctxFor`
     contexts and asserted on the `events` array from the one that was never
     passed to `resolveAbility` — it could only ever read 0, by
     construction. Now one context, asserting the real cap: 2 damage events
     (depth 1, depth 2, then the guard).
   - "every enemy resolves an AI script that is not the idle fallback"
     asserted `typeof a === 'string'` over an array built with
     `e.abilityId ?? ''`, which TypeScript guarantees is a `string`
     regardless of behaviour. Now asserts each recorded action is a
     non-empty id present in the shipped ability registry.
   - "the `25 + uses` failsafe forces Not-So-Mighty Guard" recomputed
     `turn % 8 === 3` inline — the exact predicate `leblancScript` itself
     evaluates — and compared the AI's picks against a second copy of the
     same formula, so a wrong period or phase in the script would have moved
     both sides together. Now asserts the concrete turn-30-to-40 sequence by
     name (only turn 35 fires No Love Lost).
4. **The goon stats' source notes.** `leblanc-syndicate-acts.ts`'s Dr. Goon
   and Fem-Goon carried one paragraph ("scaled to nothing") covering every
   field, published and authored alike, with no per-field citation. Now the
   file header and each stat line say which fields §4.6's table publishes
   (HP, MP, EXP, gil, steal, drop, abilities — no Level, no
   Str/Def/Mag/MDef/Agi/Luck/Eva column for either goon) and which are
   AUTHORED, including why Dr. Goon's `acc: 0` is a routing decision around
   his published Accuracy 3 (question 6, above) while the Fem-Goon's `acc: 0`
   is the ordinary blank-field convention because her Accuracy is not
   published at all.

Re-verified after all four fixes: `npx tsc --noEmit` clean;
`npx vitest run tests/unit/chapters/leblanc-engine.test.ts` — **26 passed**
(24 + 2 new Supercollider cases); `npx vitest run
tests/unit/strategy-ffx2-leblanc.test.ts` — **8 passed**, numbers unchanged;
`npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts
tests/unit/ffx2-active-atb.test.ts tests/unit/ffx-no-active-clock.test.ts` —
green; one full `npm test` — **225 files, 5 308 passed, 2 skipped**;
`node tools/orphans.mjs` — same expected integrator-only names, nothing new.
