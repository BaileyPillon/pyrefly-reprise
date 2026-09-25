# Paper preflight: Chapter XV (provisional) — Gippal, the Den of Woe (FFX-2)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-natus-review.md` and the lessons of its Review section: a threshold is read
the way the source words it ("below" is a strict `<`), "sourced" and "our estimate" stay apart,
and no option sheet invents a target or a percentage. **Docs only: no code, no build, no render.**
Two read-only engine runs were made in scratch (§4.2) because rule 3 asks for a run, not a grep.
Written 2026-09-24 by a sub-agent of the driver after Bailey's words (verbatim): *"I'll also add
Isaaru's contest of aeons at Beville and Gippal, in the Den of Woe as two additional chapters in
addition to the ones I selected already"*.

**Verdict: PROCEED on data, AI and the engine seams; HOLD everything perceivable until §5 and §6
are picked (rule 9). The chapter's scope (GP1) is Bailey's first answer; the rest follows it.**

## 1. Game case and sources

**Game case: FFX-2 only.** ATB (Active only, Bailey 2026-09-21), dresspheres, Garment Grids,
Blue Bullets, the FFX-2 status set. The Crimson Squad's day falls during FFX's Operation Mi'ihen,
but it is told only in FFX-2 and no FFX fight comes from it (research header). AI, data and build
live under `src/battle/ffx2`, `src/data/ffx2`. The registration in `src/data/encounters.ts` and the
chain plumbing in `src/app/screens/BattleScreenSetup.ts` are shared, case "both" (CHK-020); the
carry fix in §4.2 touches only the FFX-2 branch (`carryFfx2`).

**Read:** `research/ffx2-gippal-den-of-woe.md` (1ff8f78b, "§n"; supersedes 4d7230f6), the Natus
plan with its Review, Trema plan §4; in part the §4 engine files, writing-bible §1.14–1.16, §1.20,
THEMES.md §3, `approved-hashes.json`, D-043. Wiki revids are carried, not re-fetched.

## 2. The encounter (summary only; the data files cite the research)

| Item | Value | Tag |
|---|---|---|
| Where / when | A sealed cave under **Mushroom Rock Road** (not Djose); Chapter 5, optional, all ten Crimson Spheres | §0 C-1, C-2 `[verified: 3–4]` |
| Shape (the game) | Five bosses, no break: possessed Rikku, possessed Paine (Yuna alone), then shades of **Baralai → Gippal → Nooj** with the full party; HP carried | §2 `[verified: 4]` |
| Gippal (shade) | Lv 56 · HP **14,800** · MP 235 · STR 73 · MAG 55 · DEF 68 · MDEF 33 · AGI 118 · Eva 23 · Luck 6 · Acc 0 | §3.1 `[verified: 2–5]` |
| Gippal immunities | Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Slow, Stop, Doom, Delay, fractional, Gravity; **the Breaks land** | §3.1 `[verified: 3]`; Breaks `[derived]` |
| Gippal AI, HP ≥ 1/3 | 15/16 next cycle step **Grinder → Attack → Grinder → Attack → Bullseye**; 1/32 Flash Bomb; 1/32 Hush Grenade | §4.1 `[verified: 2]` |
| Gippal AI, HP < 1/3 | 1/5 each Attack, Bullseye, Grinder, **Mortar**; 1/15 each Potion Plus, Flash Bomb, Hush Grenade. Strict `<`: 4,933 HP or less `[derived]` | §4.1; trigger `[conflict]` G-2 |
| Gippal actions | Attack DC 16 · Grinder DC 14 ignores DEF · **Bullseye 9/16 of current HP** in a 140° arc, cannot kill · **Mortar DC 22** ignores DEF, same arc · Potion Plus +600 self · Flash Bomb / Hush Grenade 46–52 to all + Darkness / Silence (chance 50) | §4.1 `[SinirothX]`, 2–4 sources each |
| Baralai (shade) | HP **12,220** (wiki 1,220 is a dropped digit, G-1) · MP 720 · DEF 67 · MDEF 26 · AGI 112 · six-step cycle; below 1/3 a 1/4 Regen / Guard branch; **+1 per hit or HP change, at 8 Drill Shot (3/4 of max HP) the last attacker** | §3.2, §4.2 `[verified: 2]`; 8 vs 10 G-5 |
| Nooj (shade) | HP **23,800** · MP 720 · **DEF 144 · MDEF 103** · AGI 121 · cycle Attack 1, Attack 1, Attack 2 (ignores MDEF), Attack 1, Greedy Aura (3/16 of max HP and MP); **HP ≤ 2,999: Lightfall, 5,000 to all, once** | §3.2, §4.3 `[verified: 3]`; trigger G-2 |
| Rewards | Kaiser Knuckles (Gippal; FFExodus's Magical Dances is a copy error, G-4); Nooj gil 30,000 (wiki 3,000, G-3); Supreme Light for all five | §3, §2 |
| Unsourced | the shades' battle music (G-11), party level (G-12), how shades look (G-13), the `Weapon[..]` formation entries (G-10, props `[estimate]`), whether the shades speak | §9 |

**The design fact (`[derived]`):** three shapes under one carried HP bar. Baralai punishes MP and
counts hits; Gippal is a readable five-step cycle that turns random and adds Mortar below 1/3;
Nooj is attrition behind DEF 144 / MDEF 103 with one 5,000 hit near the end. **The thesis:** win
each link without spending what the next one needs. All four guides converge on one line: **two
Dark Knights on Darkness plus a healer**, Protect first, more than 5,000 max HP (or Invincible)
before Lightfall (§5 `[verified: 4]`).

## 3. The party and builds

- **The Chapter V preset already is the sourced line.** `src/data/ffx2/builds/farplane.ts`
  (Chapter V, reused by XI under FA4 a): Yuna White Mage (Lv 46), Rikku and Paine **Dark
  Knight** (Lv 48, 50), band 43–52 `[estimate]` in its own header. Run on the engine (scratch,
  `buildState`): max HP **Yuna 2,488 · Rikku 5,652 · Paine 5,862**. So from full HP the two Dark
  Knights survive Lightfall and Yuna does not `[derived by run]`.
- **Level:** the bosses are Lv 52–63 and the Den opens after at least 20 Via Infinito floors
  (§2 `[derived]`); no source gives a party level (G-12). Any higher preset is an `[estimate]`
  for Bailey (**GP5**), decided with measured numbers, never by tuning a boss.
- **Bag:** the Chapter V bag carries Light and Lunar Curtains, Phoenix Downs, Megalixirs; it has
  **no Dark Matter or Hero Drink**, the two sourced Invincible answers to Lightfall (**GP6**).
- **Hit check `[derived by reading, from the run's stats]`:** Darkness (`canMiss: true`, FA-G6)
  from a Lv 48 Dark Knight, Acc 104 + Luck 12 = 116, against Gippal 23 + 6 → **87 %**; Baralai
  98 %; Nooj 100 %. Not a blocker (Trema's TR-G2 is); T0 runs it.

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only

| # | Need | Where it is |
|---:|---|---|
| 1 | Three links back to back, no results between, HP / MP / KO / items carried | `EnemyGroupDef.nextGroupId`, `setupForNextLink` + `carryFfx2` (`BattleScreenSetup.ts:80–150`); leave `restoresPartyOnEntry` **unset** (Chapter XI sets it, `fallen-aeons-road.ts:164`) |
| 2 | Per-link music cue | `EnemyGroupDef.musicCues` (`common/types.ts:2536`) |
| 3 | A fixed cycle across turns, weighted branches | AI memory `mem` / `setMem` (`internal.ts`); intent sampler for rotations (`intent.ts`, Bahamut's loop, Shuyin's cycle) |
| 4 | One-shot HP triggers (Lightfall; Gippal's set switch) | `ai/vegnagun.ts:47` `hpTriggerFired` pattern, strict `<` for "below"; Lightfall's `<= 2,999` as the dump words it |
| 5 | Baralai's hit counter and "last attacker" | `engineHooks.ts#notifyEnemiesDamaged` → `AiScript.onDamaged(ctx, sourceId, amount)`; precedent Vegnagun Head `hitsTaken` → Odi Et Amo (`ai/vegnagun-head.ts:40, 166`) |
| 6 | Bullseye 9/16 of current HP; Drill Shot 3/4 of max; Greedy Aura's HP half 3/16 of max | `percent-current`, `percent-total` (power / 16) (`formulas.ts:171–179`) |
| 7 | Grinder, Mortar ignore DEF; Nooj's Attack 2 ignores MDEF | `piercing-strength`, `piercing-magic` (`formulas.ts:152, 157`) |
| 8 | Absorb 3/16 of current HP **and** MP; Looming Glacier MP to 0 + Stop | `percent-current` + `drains` + `extra.mpFractionOfCurrent: 3` (Cindy precedent) and `extra.setMpTo: 0` (`aeon-effects.ts:10–21`) + `stop` |
| 9 | Lightfall 5,000; Flash Bomb 46–52; Potion Plus 600 | `fixed` = power × 50 (`formulas.ts:167`); power 1 under the roll [240, 271] / 256 gives 46–52 `[derived]` |
| 10 | Silence, Darkness, Stop, Regen, Protect, Shell; status immunities; fractional immunity | `statuses.ts`; `immune-to-percentage-damage` (`formulas.ts:322–338`) |
| 11 | "Highest MP not in Stop" and other script-picked targets | the AI returns its own `targets` (Leblanc Supercollider precedent, `ai/leblanc-syndicate.ts:33`) |
| 12 | Steal, Pilfer Gil / MP (Split_Infinity's Thief line on Baralai) | `steal.ts`; `x2-thief-pilfer-mp` (`abilities/thief.ts:99`) |
| 13 | The player's Mortar, Mighty Guard, Drill Shot | `abilities/gun-mage.ts:194`, listed in `dresspheres/gun-mage.ts:52` |
| 14 | Guide per chapter with no cross-game leak | `engine/tactics/guide.ts:142` (enemy-side boss ids; the shades get new ids, so Chapter V's people never match) |
| 15 | Registered but unlisted chapter; Scan texts | `chapters-unlisted.ts:28`; `Chapter.sensorTexts` |

### 4.2 The real gaps (FFX-2 only unless marked)

- **GP-G1: the chain drops statuses and the current dressphere.** `carryFfx2` copies HP, MP
  and the bag only; `setup.ts#applyCarriedState` (statuses, dresspheres, `passedGates`) runs only
  for `options.carriedParty`, which nothing in `src/` passes (found by reading; T0 proves it with a
  two-link run, rule 3). Faithful "no break" means Protect, Darkness and a Spherechange ride into
  the next shade (**GP3**). Chapter XI's links restore at Save Spheres but would also start
  carrying statuses: guard it byte-identical or scope the carry to groups without a restore.
- **GP-G2: nothing in FFX-2 is exempt from the randomiser. Measured by running `computeDamage`:**
  `fixed-no-variance` power 100 at rolls 240 / 256 / 271 → **4,687 / 5,000 / 5,292**; `fixed`
  the same; `percent-current` 9 on 6,000 HP → 3,164 / 3,375 / 3,572. The research calls
  Lightfall "constant" `[SinirothX]`; the engine would roll it, and a 5,292 Lightfall breaks the
  sourced "more than 5,000 HP" answer. `fixed-no-variance` does not do what its name says, and
  the Alchemist's shipped mixes use it (`abilities/alchemist.ts:70, 89, 108`): **GP10**, and a
  finding for the driver whatever Bailey picks.
- **GP-G3: Greedy Aura's MP half is 3/16 of max MP.** `mpFractionOfCurrent` reads current MP and
  `mpOnly` bases on max **HP**. One documented `extra` key (`mpFractionOfMax`) beside the
  existing two in `aeon-effects.ts`, taking no RNG draw.
- **GP-G4: when Drill Shot fires.** The counter exists (#5); the FFX-2 engine has no enemy
  out-of-turn path (Trema TR-G5), so "at 8, Drill Shot" lands on Baralai's next turn unless the
  seam Trema's TR12 may build is shared. Per action or per hit is unsourced (**GP11**).
- **GP-G5: arcs and radii are not modelled.** Bullseye and Mortar hit a 140° arc, Glint a 5 m
  radius; `Ffx2Unit` has only `slot`, and the Bulwarks' `extra.radiusMetres` is recorded with
  no reader (`abilities-vegnagun.ts:207`): they hit the whole party. **GP8.**
- **GP-G6: Blue Bullets are not learned.** The Gun Mage offers every listed Blue Bullet when
  `abilitiesLearned` is empty (`targeting.ts:250`), Mortar included; there is no learn-on-hit.
  Teaching Mortar would be a new FFX-2 system touching Chapters 4–6 and XI. **GP7.**
- **GP-G7 (only if GP1 = C): a one-girl party.** `FFX2PartyBuild.members` is a 3-tuple
  (`common/types.ts:2445`): a contract change, plus possessed Rikku and Paine as enemies.

**Not needed:** a new `Side`, `BattleEvent` or damage type; positions (GP8 = a). **Contract
files touched:** `encounters.ts` (new `ChapterId` `'ffx2-den-of-woe'`, `number` widened: the same
union Omnis, Trema and Isaaru widen, so one integrator serialises all four), `src/data/ffx2/ids.ts`
(three shade ids, ability ids); one `CONTRACT-CHANGES.md` entry each.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **GP1** | Scope | a) Gippal alone, 14,800 HP / b) the three shades Baralai → Gippal → Nooj, carried / c) all five, Yuna's solo duels first (GP-G7) | **b**: how the game stages him; sorrow, anger, despair as one idea (§1.3). a is the small fully sourced fallback |
| **GP2** | Title, location, number | "The Den of Woe" / "Gippal" / "Crimson Squad" | **"The Den of Woe"** for b ("Gippal" for a); location "Den of Woe — under Mushroom Rock Road"; number by registration (D-058), **XV** after Isaaru's XIV |
| **GP3** | What carries between links | a) everything: HP, MP, KO, statuses, dressphere (GP-G1) / b) HP, MP, KO, items only (today) / c) a restore before each link (Chapter XI) | **a**, the faithful "no break" |
| **GP4** | Retry after a loss on Gippal or Nooj | a) from Baralai (faithful; today's behaviour) / b) from the lost link, carried state in memory (Trema TR5 seam) / c) measure first, then ask once | **c**, with a as the build until the numbers exist |
| **GP5** | Line-up and level | a) the Chapter V preset as is: Yuna White Mage, Rikku and Paine Dark Knight, Lv 46–50 / b) a higher `[estimate]` level nearer the bosses' 52–63 | **a**, measured on 200 seeds; b only if Bailey sees the numbers first |
| **GP6** | Items | a) the Chapter V bag as is / b) plus Dark Matter or Hero Drinks at an `[estimate]` count (the sourced Invincible line) | **a**; Yuna's Lightfall answer is a Phoenix Down, disclosed in the guide |
| **GP7** | Mortar, the Blue Bullet | a) no learning; the Gun Mage already lists it; a callout names Gippal as its source / b) build learn-on-hit (GP-G6) | **a** |
| **GP8** | The 140° arc and 5 m radius | a) whole party, labelled (Vegnagun Bulwark precedent) / b) a slot stand-in (Supercollider precedent) / c) build positions | **a**; the guide says it is harsher than the arc |
| **GP9** | Source conflicts | Mortar below 1/3 and Lightfall at ≤ 2,999 (dump) vs 75 % (two guides), G-2; Baralai 12,220 (G-1); Drill Shot at 8 (G-5); Nooj gil 30,000 (G-3); Greedy Aura damage only (G-7) | **the dump's values**, each tagged; a PCSX2 check only if Bailey wants certainty |
| **GP10** | Lightfall exact or rolled (GP-G2) | a) exact 5,000 for Lightfall only, shipped chapters untouched / b) make `fixed-no-variance` skip the roll everywhere (changes shipped mixes; deep review) / c) leave the roll, labelled | **a** now; b raised separately as a disclosed finding |
| **GP11** | Baralai's counter granularity | a) +1 per action that damages him (engine hook, Vegnagun Head precedent) / b) +1 per hit | **a**, labelled estimate |
| **GP12** | `Weapon[..]` entries in the formations (G-10) | props, not built / targets | **props**; no source names a second target |
| **GP13** | Do the shades speak? (unsourced) | a) silent; Yuna, Rikku, Paine carry the lines / b) one line each in the bible's voices (§1.20) | **a**; nothing in the sources gives them lines |
| **GP14** | How the story opens | a) Yuna's narration: the ten spheres, the door, Shuyin's memory in three or four lines, over the approved Shuyin portrait / b) stage the vision live / c) no vision | **a** |
| **GP15** | Mid-battle callouts | each link's entrance, Gippal's turn to the random set, the first Mortar (Gun Mage aside), Baralai's counter nearing 8, Lightfall, the last shade falling | **in**, drafted in a story draft Bailey reads first, our words (rule 8) |
| **GP16** | Music | a) a new original cue `boss-den-of-woe` from the SONGSTRESS_DARK / Shuyin family, auditioned / b) reuse `boss-shuyin` / c) reuse `boss-ffx2-aeon` | **a**; b is the stand-in if the sketch is not picked in time |
| **GP17** | Painted party with no verdict (`yuna-white-mage`, `rikku-dark-knight`, `paine-dark-knight`) | a) use as Chapters V and XI do / b) hold for a verdict | **a** |
| **GP18** | If the art picks are late | ship registered and **LOCKED** / hold the release | **LOCKED** (D-069 precedent), said before the cut |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory (`approved-hashes.json` checked; `public/art` listed)

| Asset | State | Notes |
|---|---|---|
| **Gippal shade** billboard (idle, attack, cast, hurt, ko) | **NEW** | visual bible §1.23.5: patch over the right eye, blond spikes, blue jumpsuit, purple overalls, machina mortar with a saw blade `[single source]`; the shade treatment is ours (G-13) |
| **Baralai shade** billboard | **NEW** (b, c) | nothing on disk |
| **Nooj shade** billboard | **NEW** (b, c) | identity from the D-043 portrait (`portraits/nooj.png`, picked, not hashed) |
| **The Den of Woe** backdrop | **NEW** | a rectangular clearing in a pyrefly-lit cave `[single source: GamerGuides]`; no scene in `src/scenes` fits |
| Party: `yuna-white-mage`, `rikku-dark-knight`, `paine-dark-knight` | on disk, **no verdict** | GP17 |
| Speaker portraits `yuna-x2`, `rikku-x2`, `paine`, `shuyin` | **approved** | serve as is; `lenne.png` is on disk with no hash |
| Chapter card, thumbnail, pause plate | **NEW** | from the O-1 and O-3 picks |
| VFX: Bullseye, Mortar, Lightfall, the shade's departure | check | T8 lists what `src/engine` draws first |
| Music `boss-den-of-woe` | **NEW** | THEMES.md §3 family |

### 6.2 Options rounds: cheap and broad; a pick approves only what Bailey names

References viewed read-only (rules 6, 11); original output (rule 8); pilot one at 1:1, LOOK, then
batch. Sheets in `docs/concepts/chapters/gippal/`, JPEG.
- **O-1 Gippal shade:** 3 concepts at battle scale beside the Dark Knight idles: (a) the man in
  house paint, pyreflies at the edges; (b) the same, translucent, lit from within; (c) an
  anger-red pyrefly body holding his shape.
- **O-2 Baralai and Nooj shades:** 2 each in O-1's picked treatment (only if GP1 = b or c).
- **O-3 The Den:** 3 plates contrasting light (cold blue pyreflies; crimson; near-dark with one
  shaft from the ravine).
- **O-4 Reading the fight:** mockups at 1600×900 **and** 390 px: the link count ("shade 2 of 3",
  our label), Gippal's next cycle step, Baralai's counter toward 8, a Lightfall warning as Nooj
  nears 2,999. One option is "intent text only". No invented target or odds; **no FLEE** (cannot
  escape, §3).
- **O-5 Music:** 2 sketches on `docs/audio/audition.html` (rule 13). Brief: Shuyin's grief
  wearing three men's faces. Anti-brief: no quotation of "The Crimson Squad", "Nightmare in the
  Den" or "Yuna's Ballad".

## 7. Story beats (research §6.2, paraphrased; our own words, writing-bible voice)

Next free E-tag, added by T6. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16 (this is Paine's
past: she speaks least and last); the shades silent under GP13 = a.
- **Pre (GP14 = a):** Yuna's narration: ten recordings, a door in the ravine, the cave that took
  the Crimson Squad; Shuyin's memory in three or four lines. Live: Paine says it is dangerous;
  the pyreflies rise into three men she knows. `battleStart()` on Baralai.
- **Links:** one line at each shade's arrival (sorrow, anger, despair, as the scan texts frame
  them, §3.2), in our words.
- **Mid (GP15):** the callouts.
- **Post:** the three escape; they name Shuyin's feelings as the cause of the deaths; Paine
  promises to save Baralai from him (§6.2 beat 7). `results()`.

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Hours `[estimate]` | Model |
|---|---|---|---:|---|
| T0 checks | scratch only: a two-link run for GP-G1; Darkness hit rates; the combat-core source on the roll for constant and fractional damage | — | 0.75 | sonnet |
| Integrator | `encounters.ts`, `ffx2/ids.ts`, `chapter-ffx2-den-of-woe.ts`, `chapters-unlisted.ts`, `CONTRACT-CHANGES.md` | after Omnis, Trema, Isaaru | 1.0 | opus |
| T1 seams GP-G1–G4 | `BattleScreenSetup.ts#carryFfx2`, `ffx2/setup.ts`, `formulas.ts`, `aeon-effects.ts` | T0, GP3, GP10, GP11 | 1.5 | opus |
| T2 enemy data | `src/data/ffx2/enemies/den-of-woe{,-abilities}.ts` | ids, GP9 | 1.0 | sonnet |
| T3 AI | `src/battle/ffx2/ai/den-of-woe.ts` (three scripts) | T1, T2 | 1.5 | opus |
| T4 build | reuse `farplane.ts`; a `den-of-woe.ts` build only if GP5 = b or GP6 = b | GP5, GP6 | 0.25 | sonnet |
| T5 scene | `src/scenes/den-of-woe.ts` | O-3 | 1.5 | sonnet |
| T6 story | `docs/plans/den-of-woe-story-draft.md`, then `src/story/scripts/ffx2-den-of-woe.ts` | GP13–GP15 | 1.0 | sonnet |
| T7 guide + tactic | `src/data/guides/ffx2-den-of-woe.ts`, `src/engine/tactics/ffx2-den-of-woe.ts` | T2, T3 | 1.0 | opus |
| T8 HUD + VFX | `src/ui/ffx2/` (O-4 pick), the three attacks | O-4 | 0.75 | sonnet |
| T9 audio | `src/audio/tracks/boss-den-of-woe.ts`, THEMES.md row | O-5 | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/den-of-woe-*.test.ts`, bench | T1–T4, T7 | 1.75 | sonnet / opus |
| **Total** | | | **~13 agent hours**, plus judging and review | |

**GPU `[estimate]`** (only while NOW.md says art is on): options ~1½ h; finals (three shades,
backdrop, plates) ~2 h: **~3½ hours** with rerolls. Candidate A drops about half of it.

```
NOW   Bailey answers GP1–GP18 (one sheet) · O-1, O-3 go out together (O-2 after GP1) · T0
      T1 seams │ T2 data │ T6 story draft                     (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure → GP4 asked once, with the numbers
      on the picks: art finals → T5 scene │ T8 HUD │ T9 audio │ T6 script
LAST  integrator wiring · node tools/orphans.mjs · real-input win and loss across the links ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, one per research row:** Gippal's five-step cycle in order and the 15/16,
  1/32, 1/32 weights over many seeds; the random set only below 1/3 (4,934 keeps the cycle,
  4,933 switches); Bullseye takes 9/16 of current HP and never kills; Mortar and Grinder ignore
  DEF; Potion Plus 600; Baralai's six steps, Looming Glacier on the highest-MP girl not in Stop,
  Drill Shot at 8 on the last attacker, then reset; Nooj's five steps, Attack 2 ignoring MDEF,
  Greedy Aura 3/16 of max HP **and** max MP, Lightfall once at ≤ 2,999 per GP10; every immunity
  row; carried HP, MP, KO (and statuses per GP3) from Baralai to Gippal to Nooj, no results.
- **Absence (rule 14, CHK-021):** FFX-2 Chapters 4–6 and XI byte-identical event logs at fixed
  seeds after GP-G1 to G3; FFX chapters untouched.
- **Measure, never tune:** the sourced line (two Darkness, White Mage heals, Curtains first), the
  advisor's top row, and a credibly wrong one (magic into Baralai), 200 seeds at bench speed and
  40 at human speed under Active ATB; wins, minutes and the link where losses happen. If a line
  is unwinnable, bring Bailey measured options; **never weaken a boss**.
- **Real input:** select → prep → pre → Baralai → Gippal → Nooj → results; a loss on Nooj and
  the GP4 retry. Screenshots `docs/screenshots/chapters/den-of-woe-*`.

## 10. Review, risks, verdict

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/ffx2/setup.ts,src/app/screens/BattleScreenSetup.ts,src/battle/ffx2/aeon-effects.ts`
(run 2026-09-24 on 1ff8f78b) returns **DEEP**: focused before deploy, deep after on live. Not
save-data class: the carried state never reaches `SaveData.ts`. A third deploy while a deep review
is owed needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | GP-G1 changes what Chapter XI's chain carries | byte-identical guard or a scoped carry; run first |
| R2 | GP-G2's fix reaches shipped Alchemist mixes | GP10 = a keeps it to Lightfall; b is a separate, disclosed change |
| R3 | Lightfall kills Yuna from full (2,488 max HP, measured) | sourced; the guide says so; GP6 |
| R4 | Three links at human speed may run long (Chapter VI measured 0/40 there) | GP4 = measure first |
| R5 | Three new subjects on a pose pipeline with known misses | pilot one, LOOK at 1:1; GP1 = a halves it; GP18 LOCKED |
| R6 | Four chapters widen `ChapterId` at once | one integrator, serialised |
| R7 | Copyright pull toward the game's cues and lines | original cue and words; the draft and audition page say so |

**Verdict: PROCEED.** Fifteen needs already work (§4.1) and the Chapter V preset is the sourced
party. New: the full carry, an exact Lightfall, a max-MP fraction, the counter's timing.
