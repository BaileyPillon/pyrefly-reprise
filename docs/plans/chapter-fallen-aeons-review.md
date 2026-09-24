# Paper preflight: Chapter XI — Fallen Aeons, the Road to the Farplane (FFX-2)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-yojimbo-review.md` and its Review section. **Docs only: no code, no build, no render.**
Written 2026-09-24 by a sub-agent of the driver, after Bailey's words (verbatim):
*"I'll pick your recommendations plus Yojimbo."* The third new chapter is the FFX-2 fallen aeons.

**Verdict: PROCEED on engine, data, AI and story once FA1 is answered. HOLD everything Bailey will
see or hear until the options rounds in §7 are picked (hard rule 9).**

## 1. Game case and sources

**Game case: FFX-2 only.** This is ATB, dresspheres and the aeons' action counter (AC). Research §0:
"None of it transfers to the FFX aeons". The AI, the data and any engine seam live under
`src/battle/ffx2`, `src/data/ffx2` and `src/ui/ffx2`. The chapter registration and any chain or
retry change in `src/app/screens` are shared plumbing, case "both" (CHK-020).

**Read in full:** `research/ffx2-fallen-aeons.md` (223c9586; "§n" below means its sections) and
`docs/plans/chapter-yojimbo-review.md`. **Read in part:** `src/battle/ffx2/*`,
`src/battle/common/types.ts`, `src/data/ffx2/builds/farplane.ts`, `src/data/encounters.ts`,
`src/app/screens/BattleScreen{Flow,Setup}.ts`, `BattleEncounterChain.ts`,
`docs/target/approved-hashes.json`, `public/art/characters/{shiva,anima}`,
`research/writing-bible.md` §1.14–1.16, §2.2, §2.3 and E7, and `docs/audio/THEMES.md`.
**Carry the research's tags verbatim into the data files.**

**Lessons carried from the Yojimbo review:** name the engine mechanism as it really is, not as
a type comment describes it. Label every derived number with its inputs. Put the line-up, the
items, the callouts and "ship locked" to Bailey as questions (§5), not as settled choices.

## 2. The encounter (research §2–§4; summary only)

| Link | Formation | HP | What it asks | Tag |
|---|---|---:|---|---|
| 1 **Shiva** | `Farplane - BOSS 229 Shiva 1` | 14,800 | AC 0–64 / 65–99; +3 on her own attack, +5 when attacked; Diamond Dust at 100, then back to 0. Heavenly Strike halves current HP and MP, Stop at chance 30. Fire weak, Ice absorb. Breaks and Slow land. | `[verified: 2 sources]` AI; HP `[verified: 5 sources]` |
| 2 **Magus Sisters** | `BOSS 228 Mindy 1 Sandy 1 Cindy 1` | 9,788 + 10,330 + 12,240 | Delta Attack (party to 1 HP) needs all three alive and every AC at 100. **The first kill disarms it for good.** Cindy: Not-So-Mighty Guard on turn 1, "Action 1" on turns 2–8, then the cycle repeats. Mindy has Eva 76. No Breaks, no Slow. | `[verified: 2 sources]` AI; the disarm `[verified: 4 sources]` |
| 3 **Anima** | `BOSS 227 Anima 1` | 36,000 | 4/5 Stare (ignores MDEF, Poison at 25), 1/5 Pain (Silence, Darkness and Itchy, plus −1 level on six stats, and the losses stack). +5 when she acts or is attacked; Oblivion (16 × DC 5) at 100. Fire, Ice, Lightning and Water halved; Holy weak. | `[verified: 2 sources]` |

The three fights run on three platforms, in this order `[verified: 3 sources]`. All five bodies are
immune to Gravity, Stop, Doom and the other statuses on the common list (§3). Cannot flee
(`canEscape: false`). The reward is the Immortal Soul Garment Grid (§2). **Unsourced or
conflicting:** F-1 (whether you can heal between links), F-4 (the Sisters' AP), F-5 (the
elements of Diamond Dust and Thor's Hammer), F-6 (Passado), F-7 (whether Oblivion is physical
or magical), F-9 (the MP half of Delta Attack), F-10 ("Thinking Period": never implement),
F-11 (whether the Anima painting is approved), F-12 (whether the aeons look recoloured).

**Design facts, `[derived]` from `[estimate]` inputs, for T10 to measure, never to quote:**
- **Shiva.** At about three party hits per Shiva turn, her AC gains about 18 a turn, so Diamond Dust comes on about her sixth turn. An all-out party brings it sooner.
- **The Sisters.** Every hit on a sister fills her counter. Darkness hits all three at once, so it fills all three counters at once. The fight's real tension is to focus one sister down before the three counters meet at 100.
- **Anima.** It is attrition: 36,000 HP, and Pain's losses pile up. Holy is the one weakness.

## 3. The party and builds

- **Build point:** Chapter 5, directly before the Heart of the Farplane. The bosses are Lv 41–46,
  inside `farplane.ts`'s 43–52 band. The research (§5) says: "Do not invent a separate level."
- **Line-up (FA4):** the Chapter V preset as it stands. Yuna is a White Mage (with Dispel and
  Gun Mage's Mighty Guard learned); Rikku and Paine are Dark Knights with Darkness. This is the
  sourced clear for all three fights `[verified: 3 sources]`. Levels 46 / 48 / 50, `[estimate]`
  as the file labels them.
- **Items (FA5):** the `farplane.ts` inventory is sized for five battles `[estimate]`: 15 Remedy,
  12 Light Curtains, 12 Lunar Curtains, 200,000 gil. Samurai Spare Change on Mindy needs about
  300,000 gil (§5, `[verified: 2 sources]`), so with this preset it is not an instant kill. The guide says so.
- **Stop protection (FA6):** `ffx2/accessories.ts:28` models **stats only** (Ribbon and the
  "-proof" status halves are not modelled). Remedy already cures Stop (`items/effects-status.ts`).

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only

| # | Need | Where it is |
|---:|---|---|
| 1 | An action counter in AI memory, bumped on the boss's own turn and when it is hit | `ai/vegnagun.ts:131` `bumpNodeCounter` via `mem`/`setMem` (`internal.ts`); `AiScript.onDamaged` called by `engineHooks.ts#notifyEnemiesDamaged` (`engine.ts:599`) |
| 2 | Group-level logic for a three-body boss | `EnemyGroupDef.aiScriptId` overrides each enemy's own script (`types.ts:2533`); `AiContext.allies()` lists living allies |
| 3 | Three links, no results screen between them | `EnemyGroupDef.nextGroupId`; `BattleEncounterChain.ts` re-inits with `setupForNextLink` (`BattleScreenSetup.ts:80`), carrying HP, MP, statuses and gauges; mid-chain scripts may play |
| 4 | Stop, Itchy, Regen, Protect, Shell, Poison, Silence, Darkness | `ffx2/statuses.ts` (`stop` at :205; Itchy cleared by spherechange) |
| 5 | Pain's −1 level on six stats, stacking | `str/mag/def/mdef/accu/eva-down` with `stacks` 0–10 (`statuses.ts:176`) |
| 6 | Demi (1/4 of current HP), Passado-type fractions | `formula: 'percent-current'` (`formulas.ts:178`) |
| 7 | Stare ignores MDEF | `formula: 'piercing-magic'` |
| 8 | Oblivion 16 hits on random targets | `targeting: 'random-ally'`/`'random-enemy'` re-picks per hit (`resolve.ts:117`) |
| 9 | Holy element and the four halvings | `ElementId` includes `holy` |
| 10 | White Highwind (3/8 of max HP and a cure) | `percent-total` + `heals` + `removesStatuses` |
| 11 | Spare Change, Dispel, Mighty Guard, Darkness | `formulas.ts` `'gil'`; the White Mage, Gun Mage and Dark Knight data files |

### 4.2 The real gaps (FFX-2 only unless marked)

- **FA-G1: "to 1 HP" (Delta Attack).** No formula leaves exactly 1 HP (a grep of `ffx2` and
  `data/ffx2` finds none), and `percent-current` at 16/16 would kill. The smallest seam is one
  documented `extra` key in `resolve.ts`, like `sequence` and `mpOnly`, plus an MP-to-0
  rider if FA9 keeps F-9.
- **FA-G2: a fraction of current MP (Heavenly Strike, Absorb).** `extra.mpOnly` exists
  (`resolve.ts:339`), but `percent-current` computes its base from `target.hp`
  (`formulas.ts:178`). One `extra` key is needed, and T1 confirms it with a unit test.
- **FA-G3: what counts as "attacked".** `notifyEnemiesDamaged` fires only on
  `damage > 0`, so a miss, an immune hit, an absorbed Ice spell or a status-only action
  (Dispel on Cindy) adds nothing. The sources say "when attacked" (FA8). It needs a
  per-action notice. It must stay byte-identical for Chapters 4–6.
- **FA-G4: the Sisters' "+5 when Regen heals her".** Regen ticks through
  `payStatusClocks` → `heal(…, 'regen')` (`engineHooks.ts:18`) with no AI hook. It needs a
  small `onHealed` hook, or the AI reads the tick in `onTurnResolved`.
- **FA-G5 (both): the between-links rule (FA2) and the retry point (FA3).** Today the chain
  carries everything, and a defeat restarts the chapter from link 1 (`BattleScreenFlow.ts`
  :333–393). A full restore needs a flag on the link. A retry from the failed link needs the
  flow to remember the link **in memory only**. Persisting it would make the change save-data class.
- **FA-G6: Darkness against evasion (FA7).** `x2-dark-knight-darkness` has
  `canMiss: true`, so `hit.ts#hitPercent` runs the points race against Mindy's Eva 76 + Luck 4.
  Research §4.2 says Darkness "cannot be evaded", but it does not say which sources say so. **T0
  measures the hit rate with the preset and finds the sources before anyone changes it.**
  Changing the field touches Chapters 4–6.
- **FA-G7: ids.** `guide.ts:145` picks the first guide whose `bossIds` names **any**
  combatant, which is the Yojimbo review's rule-14 leak. The FFX data already uses `shiva` and
  `anima`. **The new enemies get distinct ids** (`x2-shiva`, `x2-anima`, `sandy`, `cindy`,
  `mindy`), and T7 keys the lookup by game and enemy side.

**Not needed:** a new `BattleEvent` or `Side`, an AC widget (hidden in the game), Thinking Period. **Contract files touched:** `encounters.ts` (a new `ChapterId`
`'ffx2-fallen-aeons'`, with `number` widened to 11 after Natus takes 10) and `src/data/ffx2/ids.ts`.
Each gets one `docs/CONTRACT-CHANGES.md` entry.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **FA1** | Which fight is the chapter? | A the Road gauntlet (Shiva → Sisters → Anima) / B′ Ixion alone / B the temple trio / C the X-2 Yojimbo | **A** (§1.2 of the research): three different puzzles and the best data |
| **FA2** | Between links (F-1 `[conflict]`) | a) HP, MP and status carry over (PS2 reading; today's chain) / b) full restore at a Save Sphere beat (HD reading) | **b.** Delta Attack leaves the party at 1 HP, and carrying that into a 36,000-HP Anima turns a puzzle into a coin toss. Labelled `[conflict]` |
| **FA3** | Retry point after a loss | a) the whole chapter from Shiva (today) / b) from the link you lost (in memory, not saved) | **b** if FA2 = b, because a Save Sphere is a checkpoint; **a** otherwise |
| **FA4** | Line-up and dresspheres | a) the Chapter V preset as is (2 Dark Knights + White Mage) / b) a new Road preset | **a** `[verified: 3 sources]` clear |
| **FA5** | Items and gil | a) the Chapter V inventory as is / b) trimmed for three links | **a.** Same stretch of the story, one inventory |
| **FA6** | Stop protection (Ribbon, Stopproof: not modelled) | a) none; Remedy cures Stop, and the guide says so / b) build accessory status immunity (new engine work) | **a** |
| **FA7** | Darkness can miss Mindy in our engine; the guides say it cannot | a) T0 measures and finds the sources; change it only on ≥2 sources, as an FFX-2 data change with a deep review / b) leave it | **a** |
| **FA8** | What raises "when attacked" (FA-G3) | a) every hostile action aimed at her, hit or miss / b) only landed damage (today) | **a**, `[estimate]`; T10 measures both |
| **FA9** | The data conflicts | F-5 non-elemental (three observations) · F-6 SinirothX's 15 × 1/16 of current HP · F-7 physical (SinirothX) · F-4 AP 8 (three sources) · F-9 MP to 0 (wiki only) | **As listed**, each tagged `[conflict]` or `[single source]`; the guide quotes no percentages |
| **FA10** | Remedy and Pain's stat losses (one source says Remedy clears them) | a) leave Remedy as it is / b) add the losses to Remedy (shared X-2 item; Chapters 4–6) | **a** |
| **FA11** | Is `public/art/characters/anima/*` approved? (F-11) | yes, and derive from it / no, and run an options round | **Yes.** Chapter VII's tile already reuses it as "board-approved": **Bailey confirms** |
| **FA12** | The possessed look (F-12: canon unverified) | a) none / b) the Chapter IV Bahamut violet / c) a pyrefly edge only | **b** for consistency with Chapter IV, picked from O-2 |
| **FA13** | Scope of the Sisters' art | a) the Chapter VI precedent: one idle and one hero cast each, hurt = idle under the flinch / b) the full state set | **a** |
| **FA14** | The arena | a) the approved Farplane backdrop as is / b) a Road variant derived from its pixels / c) a new painting | **b**, per METHOD-CHECK |
| **FA15** | Music | a) `boss-ffx2-aeon` on all three links (the game plays one "Aeons" track for every aeon fight) / b) a new cue, auditioned | **a**; field bed `scene-farplane`. The cue's brief ("enjoying it") fights the mood, so audition **b** only if Bailey hears a clash |
| **FA16** | Callouts and voices | a) Yuna's opening line on each link plus four callouts (Stop lands, the first sister falls, the third Pain, Anima at half HP); no Farplane voices / b) add Farplane voices | **a.** The sources place the voices in Chapter 5's scripts only (E7); shown in the story draft |
| **FA17** | Title and number | "Fallen Aeons" / "The Road to the Farplane" · XI | **"Fallen Aeons", Chapter XI**; location "Road to the Farplane" |
| **FA18** | If the art is late | a) register the chapter LOCKED (Chapters VII and VIII precedent) and ship the engine behind it / b) hold everything | **a**, told to Bailey before the cut |
| **FA19** | The X-2 Yojimbo as an optional fourth link | yes / no | **No.** Different place; research §7.2 |

## 6. Story, guide and tactic

**Story** (research §6.2; our own words; FFX-2 grammar from writing-bible §2.2: three-beat
banter, sincerity rationed to 4 lines or fewer, lines of 3–10 words). T6 adds an E-tag for this chapter.
- **Pre:** a briefing shape (Shinra's readout, Brother, Buddy, then Yuna's go-call). The drop
  through a fayth hole after Nooj, Gippal and Baralai. Rikku jokes about the road, and Paine ends it.
- **Link 1:** Shiva on the first platform. Yuna is caught off guard (SinirothX quote pattern).
- **Between 1 and 2:** the Save Sphere beat (if FA2 = b). One sincere exchange: these were *her* aeons.
- **Link 2:** Yuna's dismay that the Sisters fell too. **Between 2 and 3:** banter comes back.
- **Link 3:** Anima. Yuna asks her forgiveness. **Post:** the Glen, with Leblanc, Ormi and Logos
  waiting. `results()`. Then back to the *Celsius* (research §2).
- **Draft:** `docs/plans/fallen-aeons-story-draft.md` (T6) goes to Bailey with FA16's callouts.

**Guide** (`src/data/guides/ffx2-fallen-aeons.ts`) and **tactic** (`src/engine/tactics/…`), one
page per link. Shiva: Fire, the Breaks, Remedy on Stop, no reckless all-out attack. The Sisters: kill Mindy
first (the wiki and GamerGuides; Split_Infinity says Cindy: the guide names both), Dispel
Not-So-Mighty Guard, and do not let Darkness fill all three counters. Anima: Shell or Mighty Guard
early, Holy, Remedy after Pain. The advisor is measured against the intended line (T10).

## 7. Assets, and the options rounds that come first

### 7.1 Inventory

| Asset | State | Notes |
|---|---|---|
| **Shiva** idle, attack, overdrive | **approved** (`cast:shiva`, hashed) | Sidecar `facing: left`. **Needs** hurt and ko (Chapter VI rule: hurt = idle under the flinch), plus the possessed treatment derived from the approved pixels |
| **Anima** idle, attack, hurt, ko, overdrive | on disk; **approval unclear** (FA11) | Not in `approved-hashes.json`. Needs the possessed treatment |
| **Sandy, Cindy, Mindy** | **NEW** | Looks per `visual-bible.md` §1.22.6 `[single source]`: Sandy tall, red mantis armour; Cindy rotund, blue-and-red ladybug; Mindy smallest, orange bee, hovering |
| **Backdrop** | `scene:farplane` **approved** (`backdrops/farplane.png`) | The Road variant is derived from it (FA14). `src/scenes/farplane.ts` is the scene base |
| Link transition, Delta Attack, Diamond Dust, Oblivion, Heavenly Strike VFX | **NEW** / check | T8 lists what `src/engine` already draws before adding anything |
| Chapter card, thumbnail, pause plate | **NEW** | Derived from the O-1 and O-3 picks |
| Music | `boss-ffx2-aeon`, `scene-farplane`, `victory-ffx2` **exist** | FA15 |

### 7.2 Options rounds: cheap and broad; a pick approves only what Bailey names

- **O-1 The Magus Sisters (highest art risk):** 3 trio options at real battle scale beside the
  Yuna, Rikku and Paine idles. Pilot one sister first and LOOK at 1:1
  (`art-pose-recipe-lessons`: pilot, then batch). House style from the approved cast.
- **O-2 The possessed treatment:** Shiva first, from her approved idle: none, the Chapter IV
  violet, and a pyrefly edge. Each is **derived from approved pixels** (METHOD-CHECK: repair only
  what must change; no re-render rounds). Anima follows the pick.
- **O-3 The Road:** 3 plates derived from the approved Farplane backdrop: a stone platform in the
  foreground over the bright void, contrasted by light. One shows all three platforms in depth.
- **O-4 Link transitions:** 2–3 storyboards (a cut to a title card per link; a camera pan up the
  road; a fade with the HP restore shown). They are perceivable, so they are Bailey's pick.
- **O-5 Story and callouts:** the T6 draft, text only, with FA16's lines in context.
- **O-6 Music:** only if FA15 = b. Two sketches in `docs/audio/audition.html` (rule 13), with no
  quotation of the original "Aeons" (rule 8).

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Hours `[estimate]` | Model |
|---|---|---|---:|---|
| T0 checks | none (scratch): measure Darkness hit % against Mindy, re-read the sources for FA-G6 | — | 0.25 | sonnet |
| Integrator | `encounters.ts`, `ffx2/ids.ts`, `chapter-meta-*`, `chapters-unlisted.ts`, `CONTRACT-CHANGES.md` | first and last; after Natus's registration | 1.0 | opus |
| T1 engine seams FA-G1–G5 | `ffx2/resolve.ts`, `engineHooks.ts`, `internal.ts`; `BattleEncounterChain.ts`/`BattleScreenFlow.ts` for G5 | FA2, FA3, FA8 | 1.5 | opus |
| T2 enemy data | `src/data/ffx2/enemies/{x2-shiva,magus-sisters,x2-anima}{,-abilities}.ts` | ids, FA9 | 1.0 | sonnet |
| T3 AI scripts | `src/battle/ffx2/ai/{x2-shiva,magus-sisters,x2-anima}.ts` | T1, T2 | 1.5 | opus |
| T4 build | none if FA4 = a (`farplaneBuild` reused) | FA4, FA5 | 0.25 | sonnet |
| T5 scene | `src/scenes/farplane-road.ts` (or a dressing of `farplane.ts`) | O-3 pick | 1.5 | sonnet |
| T6 story + E-tag | `src/story/scripts/ffx2-fallen-aeons.ts`, `writing-bible.md`, the draft | FA16, O-5 | 1.0 | sonnet |
| T7 guide + tactic + lookup fix | `src/data/guides/ffx2-fallen-aeons.ts`, `src/engine/tactics/ffx2-fallen-aeons.ts`, `guide.ts` | T2, T3 | 1.25 | opus |
| T8 presentation | link transition, three-body layout, VFX | O-4 pick | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/fallen-aeons-*.test.ts`, 40-seed bench per link and chain | T1–T4, T7 | 1.5 | sonnet / opus |
| **Total** | | | **~11.75 agent hours**, plus judging and review | |

**GPU `[estimate]`**, only while NOW.md says art generation is on: O-1 about 45 minutes, O-2 about
20, O-3 about 30. Finals take about 2 hours (three Sisters × idle and cast; Shiva's hurt, ko and
possessed set; Anima possessed; the Road plate). **About 3½ hours** with rerolls.

```
NOW   Bailey answers FA1–FA19 (one sheet) · O-1, O-2, O-3 go out together · T0 checks
      T1 seams │ T2 data │ T6 story draft                (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure (intended line and advisor, 40 seeds a link)
      on the picks: art finals → T5 scene │ T8 transitions and VFX
LAST  integrator wiring · node tools/orphans.mjs · real-input win and loss on every link ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, each pinned to a research row.** Shiva: AC +3 own / +5 attacked, the two bands, Diamond Dust at 100 then 0, Heavenly Strike halves current HP **and** MP, Stop at 30, Fire weak, Ice absorb, the Breaks land. Sisters: Delta Attack only with all three alive and at 100; the first kill disarms it forever; Cindy's 1 + 7 cycle; White Highwind only when all three are below 1/4; Regen ticks raise AC; no Breaks or Slow. Anima: Pain's losses stack on six stats; Oblivion 16 random hits; Stare ignores MDEF; Holy weak, four halvings.
- **Absence tests (rule 14, CHK-021):** FFX Chapters 1–3 and 7–10 and FFX-2 Chapters 4–6 keep
  byte-identical event logs at fixed seeds after FA-G1 to G4. No FFX-2 guide appears in an FFX chapter (FA-G7).
- **Measure, never tune:** win rates for each link and for the chain, for the intended line, the
  advisor's top row and a credibly wrong line (Darkness spam on the Sisters; all-out attacks on
  Shiva), at bench speed and at human speed (Chapter VI's 0/40 at human speed is the warning). If
  a line is unwinnable, bring Bailey measured options; **never weaken a boss**.
- **Real input:** chapter select → prep → pre → three links → win, and a loss on link 3 with the
  FA3 retry. Screenshots go under `docs/screenshots/chapters/fallen-aeons-*`.

## 10. Review, risks, verdict

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/ffx2/engine.ts,src/battle/ffx2/resolve.ts`
returns **DEEP** (the FFX-2 ATB engine and the chapter registry): a focused review before
deploy, and the deep review after, on the live build. It is **not save-data class** unless the
FA3 checkpoint is persisted (keep it in memory) or the new `ChapterId` needs a `SaveData`
migration (T1 checks the Evrae precedent). **Deploy cap:** deep reviews are still owed on live
builds, so this may be the third deploy while one is owed. That needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | Delta Attack's 1 HP carried into Anima feels unfair | FA2, FA3; measured |
| R2 | Darkness misses Mindy, so the sourced clear fails in our engine | T0 before T3 (FA7) |
| R3 | Three new subjects on a pose pipeline with known misses | FA13 scope; pilot one, look at 1:1 |
| R4 | `shiva`/`anima` ids collide with FFX data, and the guide leaks | distinct ids; T7 lookup fix (FA-G7) |
| R5 | The cue's playful brief against a mournful road | FA15 audition fallback |
| R6 | Three links run long at human speed | measured in T10; FA3 shortens the retry |
| R7 | Conflicted data (F-5, F-6, F-7) shapes damage | FA9; tagged, and changed by one edit |

**Verdict: PROCEED.** Eleven of the needed mechanics already work (§4.1). The new surface is two
small `extra` keys, one hook widening, one chain flag, three AI scripts and the art. Before the
first perceivable line: Bailey answers FA1–FA19 and picks O-1 to O-4 (O-5 and O-6 as needed).
*Preflight only; the only file this work commits is this one.*

## Review

Owed: an adversarial reviewer re-fetches the revids (Shiva 3980319, Anima 3980331, Cindy 3980350,
Mindy 3980352, Sandy 3980354) and checks §4 against the code, the Yojimbo review's method.
