# Paper preflight: Chapter XIII (provisional) — Trema, Cloister 100 of the Via Infinito (FFX-2)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-natus-review.md` and the corrections its Review section made (phase edges
read as the source words them, "sourced" versus "our estimate" kept apart, option sheets that
must not invent a target or a percentage). **Docs only: no code, no browser, no build, no
render.** Written 2026-09-24 by a sub-agent of the driver after Bailey's words (verbatim):
*"I'll go with Seymour Omnis and Trema"* (D-134).

**Verdict: PROCEED on engine seams and data; HOLD everything perceivable until §5 and §6 are
picked (rule 9). Three source conflicts and one engine fact (TR-G2) decide whether the sourced
clear is possible at all, so T0 runs before any AI is written.**

## 1. Game case and sources

**Game case: FFX-2 only.** ATB (Active only, Bailey 2026-09-21), dresspheres, Garment Grids,
Spherechange, Mix, the chain. Research §0: Paragon shares a *model* with FFX's Nemesis and
Trema with FFX's unsent priest; neither shares FFX data. Everything lives under
`src/battle/ffx2`, `src/data/ffx2`. The registration in `src/data/encounters.ts` and the
retry plumbing are shared, case "both" (CHK-020).

**Read:** `research/ffx2-trema.md` (1930546d; "§n" = its sections) and both model plans in full;
the engine files cited in §4, writing-bible §1.14–1.16 and §2.2, THEMES.md, `approved-hashes.json`
and `public/art` in part. The research's wiki revids are carried, not re-fetched (the Review does).

## 2. The encounter (summary only; the data files cite the research)

| Item | Value | Tag |
|---|---|---|
| Where | Via Infinito, Cloister 100, under Bevelle; optional Chapter 5 dungeon; Trema is the superboss | §1.1 `[verified: 4]` |
| Shape | **Link 1 Paragon → link 2 Trema**, no heal and no gear change between; Spherechange still allowed | §1.1 `[verified: 5]` |
| Paragon (normal form) | Lv 99 · HP **200,000** · MP 9,999 · STR 244 · AGI 188 · MAG/DEF/MDEF **conflict T-6** · Gravity immune, Trema's status list minus Reflect | §3.2 |
| Paragon AI | 1/4 each Normal Attack 1–4 (Poison / Itchy / Poison + Confuse / ignores Defense), then 1/2 Normal Attack 5 (drain) or 1/2 **Genesis** (DC 44 magic; strips Auto-Life, Shell, Protect, Reflect, Regen, Haste, every stat change, Spellspring); **counter: hit by an attack Protect or Shell cannot reduce → Big Bang** (DC 250, party) | §4.1 `[SinirothX]`, prose agrees |
| Trema | Lv 99 · HP **999,999** · MP 999 · STR/MAG/DEF/MDEF **255** · AGI 129 · **Eva 99** · Luck 26 · immune to every status, every stat Up/Down, Gravity, Reflect · **Spellspring** (International/HD) | §3.1 `[verified: 2–6]` |
| Trema AI | 1/2 Dying Star → Falling Leaf → Thundering Wave (3 turns, own targets); 1/8 Demi (10 MP); 1/8 Flare (DC 55, 54 MP); 1/12 each Choking Mist (Poison), Beguiling Mire (Stop, 120), Waning Moon (3 × 5/16 of current MP) | §4.2 `[SinirothX]` |
| HP triggers, once each | **< 1/2 → Meteor**, **< 1/4 → Meteor**, **< 1/6 → Ultima** (DC 70, 90 MP). Meteor: 12 hits on random members, each 1/8 of max HP, **no MP cost** | §4.2 `[verified: 4]`; 1/6 `[verified: 2]` (T-1); 12 hits `[verified: 2]` (T-2) |
| Reward | Iron Duke (drop Dark Matter) | §1.1 `[verified: 4]` |
| Blocking conflicts | **T-3** Meteor physical or magical in International/HD; **T-5** does draining his MP still stop his spells under Spellspring; **T-6** Paragon's MAG and DEF | §10 |
| Unsourced | the pre-fight speech (two short lines exist), Cloister 100's look, the "illusion of Zanarkand" timing, the music (wiki only) | §2, §6, §7 |

**Correction to the research (`[derived]`, not a Bailey call): T-4 is moot here.** One Meteor
hit is 1/8 of max HP, so it reaches the 9,999 cap only above 79,992 max HP. The research's
richest Lv 99 row (Mascot, 6,647) doubled by a Crystal Bangle is 13,294, a 1,661 hit.

**The design fact (`[derived]`):** 999,999 HP at the 9,999 cap is at least 101 capped hits
(§4.2); Split_Infinity's clear took about 30 minutes. The thesis is two opposite puzzles joined
by carry-over: **Paragon punishes the tools that beat Trema** (Darkness draws Big Bang), and
**Trema punishes a party that arrives spent** (two Meteors, an Ultima, MP-stripping hits).

## 3. The party and builds

- **Level 99** `[verified: 3]`, far above the Chapter V band (43–52). New
  `src/data/ffx2/builds/via-infinito.ts`.
- **Line-up (TR10):** Yuna Dark Knight, Paine Dark Knight, Rikku Alchemist: the clear three
  sources use, and the three paintings exist on disk (`yuna-dark-knight`, `paine-dark-knight`,
  `rikku-alchemist`; shipped in Chapters V and XI without a board verdict). The Mascot line
  (International) has no painting and needs the Higher Power grid the engine lacks (§4.2).
- **Kit (TR11):** only what the engine models: Crystal Bangle (`accessories.ts:87`), Rabite's
  Foot +100 Luck (`accessories.ts:69`), The End grid's Break Damage Limit
  (`garment-grids.ts:116`), Megalixir, Curtains, Remedy; counts `[estimate]`. Valiant Lustre,
  Higher Power and Stamina Tonic are **not** in the engine (an unknown grid id degrades to a
  gateless ring, `garment-grids.ts:133`); Soul Spring and Mana Spring were not found by name
  under `src/data/ffx2` (T0 confirms). Target MP (`gunner.ts:130`) exists.

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only

| # | Need | Where it is |
|---:|---|---|
| 1 | Two links, HP/MP/status/KO carried, no results between | `EnemyGroupDef.nextGroupId`; `BattleEncounterChain` `setupForNextLink` (Chapter XI §4.1 #3); leave `restoresPartyOnEntry` (`common/types.ts:2565`) **unset** |
| 2 | HP-triggered one-shot actions | `ai/vegnagun.ts` Tail: `mem(self,'hpTriggerFired')` + `self.hp < maxHp / 4` (strict `<`, matching "below") |
| 3 | Dying Star → Falling Leaf → Thundering Wave over three turns | AI memory `mem`/`setMem` (`internal.ts`); **not** `extra.sequence`, which packs stages into one turn (`resolve.ts:431`) |
| 4 | Meteor's 12 hits on random members | `random-*` targeting re-picks per hit (`resolve.ts:117`) |
| 5 | 1/8 of max HP; Demi 1/4 of current HP | `percent-total` (power/16 of max HP) and `percent-current` (`formulas.ts:171–179`) |
| 6 | Spellspring: spells cost no MP | status in `statuses.ts:47`; `resolve.ts:204` |
| 7 | Genesis strip list incl. Auto-Life, Spellspring, stat changes | `removesStatuses` (precedent `vegnagun-body-abilities.ts:260`) |
| 8 | "An attack Protect or Shell cannot reduce" | `execute.ts:67` `attackClass` writes `flags.lastAttackClass` (line 210); `onDamaged` reads it (Vegnagun Core, `ai/vegnagun-body.ts:78`). **Darkness is `damageType: 'other'`** (`dark-knight.ts:56`), so it classes as "none": the sourced Big Bang trigger. Research §8 item 6's "new flag" is not needed |
| 9 | Gravity immune, status and stat immunities | `immune-to-percentage-damage` (`formulas.ts` step 20); status immunities |
| 10 | Caps 9,999 / 99,999; Break Damage Limit | `constants.ts:165`; `engine.ts:499`; The End grid |
| 11 | "Cross gates while he cannot act" | a chained target cannot start its action (`chain.ts:54`, `CHAIN_LOCKS_ACTIONS`) |
| 12 | Stop, Poison, Confuse, Itchy; Remedy/Esuna lists | `statuses.ts` `ESUNA_CURES` |
| 13 | Sourced player tools | Mix (`alchemist.ts:39`), Mighty Guard (`gun-mage.ts:95`), Sentinel (`warrior.ts:39`), Trigger Happy, Cactling Gun |
| 14 | Boss HP numerals, Scan-gated | `ui/ffx2/BossGauges.ts:58` |
| 15 | Guide lookup by game, then an enemy-side boss id (no rule-14 leak) | `engine/tactics/guide.ts:142–145` |
| 16 | Registered but unlisted chapter | `chapters-unlisted.ts` (Chapters IX–XI precedent) |

### 4.2 The real gaps (FFX-2 only unless marked)

- **TR-G1: Lv 99 stats.** `dressphere-stats.ts` anchors stop at Lv 50 and extrapolate
  linearly. Dark Knight at 99 would come out `[derived]` HP about 5,508 and STR about 204 against
  the research's table (§5, wiki, `[single source]`) of 5,355 and 175. Add Lv 99 rows for the
  dresspheres the preset uses. Every shipped build is at Lv 50 or below
  (`bevelle.ts`, `chateau.ts`, `farplane.ts`), so Chapters 4–6 and XI stay byte-identical.
  Gun Mage has no anchor at all (falls back to Gunner).
- **TR-G2: Darkness cannot hit Trema today.** `x2-dark-knight-darkness` has `canMiss: true`
  (FA-G6, still open after a999d133), and `hit.ts#hitPercent` is Acc + Luck − (Eva + Luck).
  Lv 99 Dark Knight 105 + 11 = 116 against Trema 99 + 26 = 125 → **0 %** `[derived by
  reading; T0 runs it, rule 3]`. The sourced main damage line (`[verified: 3]`) would never
  land. With a Rabite's Foot, 216 − 125 = 91 %. **TR9.**
- **TR-G3: the MP gate.** Enemy spells resolve at 0 MP today (`resolve.ts:204` clamps at 0;
  only Leblanc's AI checks MP). The sourced "drain his MP" line needs an AI-side check (Demi 10,
  Flare 54, Ultima 90; Meteor free). Under Spellspring the cost is 0, so drain does nothing:
  that is T-5. **TR4.**
- **TR-G4: Waning Moon** (3 × 5/16 of current MP, no HP). `extra.mpOnly` bases on
  `percent-current`, which reads HP; `extra.mpFractionOfCurrent` (`aeon-effects.ts:78`) rides
  after an HP hit. T1 tries a zero-HP carrier first, else one documented `extra` key.
- **TR-G5: counter timing.** The class is readable (§4.1 #8), but the FFX-2 engine has no enemy
  out-of-turn path: the Vegnagun Bulwarks answer on their **next** turn; `isCounter` in
  `resolve.ts:457` only labels the event. SinirothX writes "Counter". **TR12.**
- **TR-G6 (both): retry after losing to Trema.** Today a chain restarts from link 1 unless the
  link restores the party (`restartCarry.ts`, Chapter XI). A checkpoint at Trema with *no*
  restore means holding Paragon's end state in memory (never saved, D-100); persisting it would
  make it save-data class. **TR5.**
- **TR-G7: seven-digit numerals.** `BossGauges` prints `999999<small>/999999</small>`; check
  the width at 390 px (T8).

**Not modelled, and not needed unless picked:** Genesis's 150°/180° arc (no positions in the
FFX-2 engine: whole party, `[estimate]`); Oversoul (TR7); Valiant Lustre, Higher Power, Stamina
Tonic (TR11). **Contract files touched:** `encounters.ts` (new `ChapterId` `'ffx2-trema'`,
`number` widened), `src/data/ffx2/ids.ts` (`trema`, `paragon` and ability ids), `common/types.ts`
only if TR-G6 needs a link field; one `CONTRACT-CHANGES.md` entry each. The Omnis chapter widens
the same union: the integrator serialises the two.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **TR1** | Chapter shape | a) Paragon → Trema, carried over / b) Trema alone, Fiend Arena block, full HP (no story) | **a** (the game's staging; Trema's entrance is the story beat) |
| **TR2** | Version | a) International/HD (Spellspring, Cat Nip nerfed) / b) Original (Cat Nip + Trigger Happy decides it) | **a** |
| **TR3** | Meteor's type in International/HD (T-3) | a) magical, Shell halves it (wiki) / b) physical, Protect and Sentinel (GamerGuides HD) / c) hold for a third source | **a**, labelled `[conflict]`, unless T0 finds a data source first |
| **TR4** | MP drain against Spellspring (T-5) | a) Spellspring wins: drain does nothing / b) his AI still needs the MP (GamerGuides HD: drained, he "can't use most of his magic") / c) hold | **b**, `[single source]` + `[conflict]`, disclosed in the guide; it keeps a sourced line alive |
| **TR5** | Retry after a loss to Trema | a) whole chapter from Paragon / b) from Trema, in Paragon's end state, in memory only | **b**; a 30-minute fight should not replay Paragon |
| **TR6** | Length (about 30 min faithful; never tune) | a) faithful as is / b) plus a checkpoint at each Meteor / c) measure first, then ask once with numbers | **c** (the Acta Est Fabula method) |
| **TR7** | Paragon's form | Normal (Big Bang counter) / Oversoul (ten Omega kills first; easier) | **Normal** |
| **TR8** | Paragon's MAG and DEF (T-6) | a) SinirothX 244 / 88 / 88 / b) wiki 88 / 244 / 89 / c) hold link 1 | **a** (the repo's ranked-first source), `[conflict]`, if T0 finds no third data source |
| **TR9** | Darkness against Eva 99 (TR-G2) | a) T0 runs it and looks for sources; change `canMiss` only on ≥ 2 (touches Chapters 4–6 and XI: deep review) / b) leave it; the Dark Knights carry Rabite's Feet / c) both | **a**, with **b** as the build until a source lands |
| **TR10** | Line-up, level, paintings | a) Yuna DK, Paine DK, Rikku Alchemist, Lv 99, the on-disk paintings as Chapters V/XI use them / b) three Mascots (no art, no grid) | **a** |
| **TR11** | Items, accessories, grids | a) the modelled kit in §3, counts `[estimate]` / b) the Chapter V bag / c) also model Valiant Lustre and Stamina Tonic | **a** |
| **TR12** | Big Bang timing (TR-G5) | a) on Paragon's next turn (Vegnagun pattern) / b) an immediate counter (new seam) | **b** if T1 keeps it under 1 hour; **a** otherwise, labelled |
| **TR13** | Callouts | Paragon's first Big Bang, Trema's entrance, both Meteors, Ultima, the first Stop, at his sourced moments, in **our** words | **in**, in a story draft first; **no** game line and **no** Hymn lyric quoted (rule 8) |
| **TR14** | How the story is told | a) Yuna opens (FFX-2 grammar); the Cloister 0 stranger in two lines; Trema revealed after Paragon / b) stage Cloister 0 and Paine's floor-20 line | **a**; no Kinderguardian portraits |
| **TR15** | The "illusion of Zanarkand" | stage it / leave it out | **out** (no source places it) |
| **TR16** | Music | a) Paragon on `scene-bevelle-underground`, a new `boss-trema` as `phase2` / b) `boss-ffx2-aeon`, then a new cue / c) reuse throughout | **a**; `boss-ffx2-aeon` is the stand-in if the sketch is not picked |
| **TR17** | Title, location, number | "Trema" / "Via Infinito" / "The Final Cloister" | **"Trema"**, "Via Infinito — Cloister 100"; number by registration (D-058): **XIII** after Omnis (XII, dab6f148's plan) |
| **TR18** | If the art is late | ship registered and **LOCKED** / hold | **LOCKED**, said before the cut |
| **TR19** | The other Great Cloister bosses (20–80) | a later chapter / no | **no** (research §1.3) |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory

| Asset | State | Notes |
|---|---|---|
| **Trema** billboard (idle, attack, cast, hurt, ko) | **NEW** | Old priest in a torn Yevon robe, quick for his age (`[single source]`); original work |
| **Paragon** billboard (idle, attack, cast, hurt, ko-by-Trema) | **NEW** | Zaon's fiend form; nothing on disk is close |
| **Cloister 100** backdrop | **NEW** | Sourced details: upside-down banners with Yu Yevon's likeness, pyreflies, one large room. `scene:bevelle-underground` is **approved** (same underworld family) |
| Party: Yuna/Paine DK, Rikku Alchemist | on disk, **no verdict** | TR10 |
| Speaker portraits Yuna, Rikku, Paine (X-2) | **approved** | Serve as is |
| Trema portrait; chapter card, thumbnail, pause plate | **NEW** | From the O-1 and O-3 picks |
| VFX: Meteor, Genesis, Big Bang, Ultima, the link kill | check | T8 lists what `src/engine` draws first |
| Music `boss-trema` | **NEW** | `scene-bevelle-underground` exists |

### 6.2 Options rounds: cheap and broad; a pick approves only what Bailey names

References first, viewed read-only (rules 6, 11): the wiki's Trema idles and "Final Cloister"
picture. Original output (rule 8); pilot one at 1:1, LOOK, then batch.
- **O-1 Trema:** 3 concepts at battle scale beside the Dark Knight idles (plain priest; unsent
  pallor; a "dark puppeteer" with pyrefly threads).
- **O-2 Paragon:** 2–3 concepts beside O-1's pick, with a ko-by-Trema strip.
- **O-3 Cloister 100:** 3 plates, two derived from the approved Bevelle Underground pixels
  (METHOD-CHECK), one new; light contrasted.
- **O-4 Reading the fight:** mockups at 1600×900 **and** 390 px: seven-digit numerals, the
  Meteor telegraph at 1/2 and 1/4, which commands draw Big Bang, the link transition. One option
  is "intent text only". No invented target or odds on a chip (the Natus O-4 lesson); no FLEE.
- **O-5 Trema portrait:** 2 options from the O-1 pick.
- **O-6 Music:** 2 sketches of `boss-trema` on `docs/audio/audition.html` (rule 13). Brief: our
  HYMN motif turned against itself, FFX-2 harmony. Anti-brief: no quotation of "New Yevon" or
  the game's Hymn.

## 7. Story beats (research §2, §7; our own words, writing-bible §2.2)

Next free E-tag, added by T6. Voices: Yuna §1.14, Rikku §1.15, Paine §1.16; three-beat
banter, sincerity at most 4 lines. Trema: courteous, certain, speaks of the past as a weight.
- **Pre (TR14 = a):** Yuna's narration (the dungeon under Bevelle, a hundred floors, the
  stranger at the top who spoke of a man who never came back); banter at the bottom; Paine ends
  it. `battleStart()` on Paragon.
- **Link:** Paragon falls; the stranger returns, finishes it, names himself founder of New
  Yevon, says why he destroyed the spheres, and asks to see their strength. Trema's link opens.
- **Mid (TR13):** the callouts, in our words.
- **Post:** Yuna answers with the memories she made with her friends; he calls her free of the
  past, in our words, and fades. Iron Duke. `results()`.

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Hours `[estimate]` | Model |
|---|---|---|---:|---|
| T0 checks | scratch only: run Darkness vs Eva 99 at Lv 99; third sources for T-3, T-5, T-6 (read-only); confirm Soul Spring, Stamina Tonic, Mix's Dark Matter recipe | — | 0.5 | sonnet |
| Integrator | `encounters.ts`, `ffx2/ids.ts`, `chapter-ffx2-trema.ts`, `chapters-unlisted.ts`, `CONTRACT-CHANGES.md` | after Omnis's registration | 1.0 | opus |
| T1 seams TR-G1, G3, G4, G5, G6 | `dressphere-stats.ts`, `resolve.ts`/`aeon-effects.ts`, `engine.ts`, `pause/restartCarry.ts` | T0, TR4, TR5, TR12 | 2.0 | opus |
| T2 enemy data | `src/data/ffx2/enemies/{paragon,trema}{,-abilities}.ts` | ids, TR3, TR8 | 1.0 | sonnet |
| T3 AI | `src/battle/ffx2/ai/{paragon,trema}.ts` | T1, T2 | 1.25 | opus |
| T4 build | `src/data/ffx2/builds/via-infinito.ts` | TR10, TR11, TR-G1 | 0.75 | sonnet |
| T5 scene | `src/scenes/via-infinito.ts` | O-3 | 1.5 | sonnet |
| T6 story | `docs/plans/trema-story-draft.md`, then `src/story/scripts/ffx2-trema.ts`, bible E-tag | TR13, TR14 | 1.0 | sonnet |
| T7 guide + tactic | `src/data/guides/ffx2-trema.ts`, `src/engine/tactics/ffx2-trema.ts` | T2, T3 | 1.25 | opus |
| T8 HUD + VFX | `src/ui/ffx2/` (numerals, telegraph), link kill | O-4 | 1.0 | sonnet |
| T9 audio | `src/audio/tracks/boss-trema.ts`, THEMES.md row | O-6 | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/trema-*.test.ts`, benches | T1–T4, T7 | 2.0 | sonnet / opus |
| **Total** | | | **~14.25 agent hours**, plus judging and review | |

**GPU `[estimate]`** (only while art is on): options ~1½ h, finals ~2½ h: **~4 hours** with rerolls.

```
NOW   Bailey answers TR1–TR19 (one sheet) · O-1, O-2, O-3 go out together · T0 checks
      T1 seams │ T2 data │ T4 build │ T6 story draft          (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure → TR6 asked once, with the numbers
      on the picks: art finals → T5 scene │ T8 HUD │ T9 audio │ T6 script
LAST  integrator wiring · node tools/orphans.mjs · real-input win and loss on both links ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, one per research row:** the chain's three turns in order; the 1/2, 1/8,
  1/8, 1/12 ×3 weights over many seeds; Meteor exactly twice (below 1/2, below 1/4) and Ultima
  once (below 1/6), each a strict `<`; Meteor 12 random hits of 1/8 max HP, no MP; Demi 1/4 of
  current HP; Waning Moon 3 × 5/16 current MP; every status, stat change and Gravity fails on
  both bosses; Spellspring and the MP gate per TR4; Big Bang only after a "none"-class hit
  (Darkness yes, Attack and Fire no); Genesis's exact strip list; carry-over (no heal, KO
  stays) into Trema; the Lv 99 rows equal the research table.
- **Absence (rule 14, CHK-021):** FFX-2 Chapters 4–6 and XI byte-identical event logs at fixed
  seeds after TR-G1, G3, G4 and G5; FFX chapters untouched; Chapter XI's restart unchanged by G6.
- **Measure, never tune:** intended line (TR10 party, drain first, Darkness on Trema only), the
  advisor's top row, and a credibly wrong line (Darkness on Paragon), 40 seeds a link, at bench
  **and** human speed under Active ATB; report wins **and minutes**. If a line is unwinnable,
  bring Bailey measured options; **never weaken a boss**.
- **Real input:** select → prep → pre → Paragon → the link → Trema → win; a loss on Trema and
  the TR5 retry. Screenshots `docs/screenshots/chapters/trema-*`.

## 10. Review, risks, verdict

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/ffx2/engine.ts,src/battle/ffx2/resolve.ts,src/battle/ffx2/dressphere-stats.ts,src/app/screens/BattleScreenFlow.ts`
(run 2026-09-24 on 61f47fee) returns **DEEP**: focused before deploy, deep after on live. Not
save-data class while TR5's checkpoint stays in memory. Deploy cap: a third deploy while a deep
review is owed needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | Darkness never lands on Eva 99, so the sourced clear fails | T0 first; TR9 |
| R2 | A 30-minute fight under Active ATB at human speed (Chapter VI measured 0/40 there) | TR6 = measure first; TR5 retry |
| R3 | T-3, T-5, T-6 decide the answers (Shell or Protect; drain or not; Paragon's bulk) | TR3, TR4, TR8; each tagged and changed by one edit |
| R4 | Two new subjects on a pose pipeline with known misses | pilot one, LOOK at 1:1; TR18 LOCKED |
| R5 | Copyright pull toward the Hymn chant, "New Yevon" and the script | our lines and cue; the draft and audition page say so |
| R6 | Lv 99 rows are a single source (wiki tables) | tagged; T0 looks for a second |
| R7 | Omnis and Trema both widen `ChapterId` and `number` | one integrator, serialised |

**Verdict: PROCEED.** Sixteen mechanics already work (§4.1); new: Lv 99 rows, an MP gate, an
MP-fraction key, the counter timing, a checkpoint without a restore. Nothing perceivable first.
