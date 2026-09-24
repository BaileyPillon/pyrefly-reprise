# Paper preflight: Chapter X — Seymour Natus, the Highbridge of Bevelle (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-yojimbo-review.md` and the corrections its Review section made.
**Docs only: no code, no browser, no build, no render.** Written 2026-09-24 by a sub-agent
of the driver, after Bailey's words (verbatim): *"I'll pick your recommendations plus
Yojimbo."* Chapter number X is already settled (D-058: registration order; story order is
Natus, then Yojimbo).

**Verdict: PROCEED on engine, data, AI and story now; HOLD everything Bailey will see or
hear until the options rounds in §6 come back picked (hard rule 9).**

## 1. Game case and sources

**Game case: FFX only.** CTB, aeons, Banish, Trigger Commands, the FFX status set.
Research §0.3: FFX-2 has no Natus, no Mortibody and no Highbridge boss; the Bevelle
Underground scene in the tree is the FFX-2 Bahamut arena and is **not** this arena. The
AI, data and build live under `src/battle/ffx`, `src/data/ffx`. Registration in
`src/data/encounters.ts` is shared plumbing, case "both" (CHK-020).

**Read in full:** `research/ffx-seymour-natus-highbridge.md` (commit 0df4ba9e; "§n" below
means its sections) and `docs/plans/chapter-yojimbo-review.md`. **Read in part:** the engine
files named in §4, `research/writing-bible.md` §1.7, §1.9, `docs/audio/THEMES.md` §3,
`docs/target/approved-hashes.json`, `docs/target/decisions.json`, `src/data/ffx/builds/`
`{fahrenheit,gagazet}.ts`. Carry the research's tags verbatim into the data files.

**Two corrections the research made to the brief stand:** Mortibody has **no Full-Life**
(that is Mortiorchis, Chapter I); **Total Annihilation is not in this fight** (Flux's).

## 2. The encounter (summary only; the data files cite the research)

| Item | Value | Tag |
|---|---|---|
| Which fight | Seymour Natus + Mortibody, north end of the Highbridge, before the Main Gate, straight after the Via Purifico | §0, §7 `[verified: 3]`; plaza `[single source]` |
| Formation | `[seymour_natus, mortibody]`, cannot flee, battle ends when Natus dies | §6.2, §4.5 (end rule `[derived]`, N-10) |
| Natus `m126` | HP **36,000** · Overkill 3,500 · **DEF 0 · MDEF 0** · MAG 25 · AGI 21 · Poison res 50, tick **4 % = 1,440** · Delay/Slow/Doom/Magic Break immune · steal Tetra Elemental | §1 `[decompiled]` + 3 sources |
| Mortibody `m127` | HP **4,000** · **DEF 50** · MAG 20 · AGI 28 (acts slightly more often) · Luck 20 (wiki 15, N-4) · Delay landable | §2 `[decompiled]` + wiki |
| Phase 1 (> 24,000) | Mortibody: tier-1 spell on the party (DC 16); Natus: **Multi-ra of the same element** on two members (DC 36 ×2) | §4.1 `[verified: 3]` |
| At 24,000 | Natus counters with **Protect on himself** | §4.1 `[verified: 3]` |
| Phase 2 (24,000–12,001) | Natus: **Break** (Petrify, chance 254); Mortibody: **Shattering Claw**, 90 % shatter on a petrified target | §3, §4.1 `[verified: 3]` |
| Phase 3 (≤ 12,000) | Natus: **Flare** DC 60 (rank 5); Mortibody: **Cura** 1,200 on Natus | §4.1 `[verified: 3]` |
| Phase rule | Changes only on damage from an action; Poison ticks never move it; Mortibsorption does | §4.2 `[verified: 2]` / drain half `[single source]` |
| Mortibsorption | On KO drains Natus for its max HP and revives: **4,000 → 3,000 → 2,000 → 1,000 floor**; fires even if lethal | §4.4 `[verified: 4]` |
| Banish | Natus removes an aeon after its **one** turn | §4.3 `[verified: 4]` |
| Desperado | All three active members Hasted → Mortibody's next action: 468–529 fixed to all, strips Shell, Protect, Reflect, Nul×4, Regen, Haste | §3.2, §4.3 `[verified: 3]` |
| Talk | **Tidus +10 STR, Auron +10 STR, Yuna +10 MDEF**, this fight's table only | §6.2 `[verified: 4]` |
| Unsourced | the element order (GameFAQs only, N-2); Natus's cast if he moves first (N-1); the buff-count Desperado ladder (N-5); line-up "tyk" (decompile only, N-11); Threaten (N-3); party stats; the battle music | §10 |

**The design fact (§1.1, `[derived]`):** DEF 0 and MDEF 0 behind 36,000 HP. Every point
lands at full value; the wall is the HP pool, Cura, the phases and the shatter threat.
**The thesis:** the fight punishes the obvious answers. Hitting him moves the phases
(Poison does not); summoning is cut to one turn; Hasting everyone calls Desperado;
Petrify plus Claw deletes a guardian. The sourced lines (§6.3) are Poison and wait,
Provoke + Reflect, the aeon relay, brute force with Stone Ward and Esuna, Reflect on
Natus in phase 3, farming Mortibsorption, and Hasting only two.

## 3. The party and builds

- **Build point:** the Highbridge, after the Via Purifico, before Macalania Woods and the
  Calm Lands. New file `src/data/ffx/builds/highbridge.ts`, derived **upward** from
  `fahrenheit.ts` (Chapter VIII, six guardians, the lower bound) and **downward** from
  `gagazet.ts` (the upper bound); Yuna from the lower half of the Gagazet row (§6.2).
  Every stat cell `[estimate]`, as both presets label their own.
- **Remove what Gagazet teaches:** Kimahri's Mighty Guard and White Wind (Biran and Yenke,
  on Gagazet). Carry forward what Chapter VIII already gave: Rikku's Stone Ward bracer and
  her Reflect (`fahrenheit.ts` C-14).
- **Talk:** the `talk` marker on Tidus, Auron and Yuna. Auron starts on the bench under the
  recommended line-up, so his Talk costs a switch: that is the point.
- **Aeons:** Valefor, Ifrit, Ixion, Shiva, **Bahamut** (just obtained in Bevelle);
  no Anima, Magus Sisters or Yojimbo (§6.2 `[verified: 2]`). Starting gauges: **B3**.
- **Opening line-up:** **B2** (the formation byte says Tidus, Yuna, Kimahri).
- **Yuna's Reflect:** **B4**. **Items and O'aka's stock:** **B5** (the research names the
  shop but not its list; T4 sources the list before any quantity is written).

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only, no engine change

| # | Need | Where it is |
|---:|---|---|
| 1 | **Petrify → shatter → the slot is lost for the battle.** The research calls this the largest new system; **it already ships** in Chapter VIII (Stone Gaze → Swooping Scythe) | `abilities.ts:354` (`shatter` flag + `shatterChance`), `hp.ts#ejectActor` ("a bench member cannot fill the slot"), `commands.ts:222` (no Switch row for an ejected member), `predicates.ts#canSwitchIn`, `evrae-abilities.ts` |
| 2 | Defeat when every active member is KO'd or petrified | `engine.ts:441` |
| 3 | The Mortibsorption drain, revive and the 4,000 → 1,000 floor (same constants) | `scripted.ts#mortibsorption`, `MORTIORCHIS_MIN_MAX_HP`, `MORTIORCHIS_DECAY` |
| 4 | Banish after the aeon's first turn; Banish overrides the aeon's Eject immunity; gauge zeroed | `aeons.ts#banishAeon`, `seymour-flux.ts:154` (`turnsTaken >= 1`), `hp.ts#ejectActor('banish')`, `seymour-flux-abilities.ts` `banish` |
| 5 | Thresholds that ignore Poison: counters are collected after actions only | `ai/reactions.ts#collectBossCounters`; `seymourThresholdCounters(ai, fromPoison)` pattern |
| 6 | A free 0-CTB counter (the Protect at 24,000) | `ai/reactions.ts#BossCounter` |
| 7 | Reflect bounce; Break into a Petrify-immune Natus misses | `abilities.ts:147` (`bouncesOffReflect`, `reflectBounceTarget`), status immunity 255 |
| 8 | Provoke redirection | `targeting.ts:219`, `statuses.ts:205`; Tidus has `provoke` in both presets |
| 9 | Enemy Poison tick as a percentage (4 %) | `ticks.ts:134` `poisonTickPercent` |
| 10 | Desperado: fixed damage with variance plus a strip list | `formulas.ts:209` `'fixed'`; `removes-statuses` flag; type `'other'` (the engine has no `'special'`) |
| 11 | Mortibsorption's HP-formula row; Claw's `can_target_dead` | `formulas.ts:217` `'user-max-hp'`; `targeting.ts:109` `'can-target-dead'` |
| 12 | The ice → lightning → water → fire cycle and a two-hit Multi-ra record | `seymour-anima-macalania-abilities.ts:99–135`, `ai/seymour-anima-macalania.ts#nextElement` |
| 13 | A per-boss Talk table | `ai/index.ts#applyTalkTrigger`, `talkAvailable` (Macalania and Flux each own one) |
| 14 | Immunities: delay, bribe, life, percentage damage, threaten | `common/types.ts` `ImmunityFlag`, status immunities |
| 15 | Aeon gauges from the build | `setup.ts:163` `overdriveGauge`; `gagazet.ts:401` precedent |
| 16 | No flee | `rt.canEscape`, false by default (`setup.ts`), set on the formation |
| 17 | Stone Ward / Stoneproof guard against Petrify | `equipment.ts:226, 241` |
| 18 | A registered but unlisted chapter | `chapters-unlisted.ts#UNLISTED_CHAPTERS` (Yojimbo precedent) |

### 4.2 The real gaps (FFX only)

- **N-G1: Mortibsorption is wired to Chapter I's ids.** `runMortibsorptionIfDown`
  (`ai/reactions.ts:145`) looks up `mortiorchis` and `seymour-flux` by name. It also
  **computes Seymour's threshold counters and then drops them** (`void command`, line 154).
  Natus needs the drain to move his phase **and** fire the Protect counter (§4.4
  pseudocode). Smallest seam: a mount → host table, with the counters returned to the
  engine's counter queue for the Natus pair. **Chapter I's event logs stay byte-identical.**
  Whether Chapter I's drop is itself a defect is **not** claimed here (rule 3): T1 runs the
  Flux engine across a threshold by a drain and reports what happens.
- **N-G2: the phase is state, not HP.** Natus's AI must read a stored phase that only the
  action hook (and the drain) moves, as `seymour-flux.ts` stores `PHASE`. The collector
  returns early for an **enemy-side** attacker (the Yu Yevon rule), so Natus's own spells
  bounced back by Reflect (the Provoke + Reflect line) move nothing today: **B8**.
- **N-G3: the combo.** Natus's Multi-ra reads **Mortibody's last element**: shared AI
  state between two actors (flags on the battle state). Small; T3.
- **N-G4: "two different members".** Chapter VII types Multi-ra `random-enemy`, `hits: 2`:
  two **independent** picks, which can land on one member twice (Macalania C-3). This
  research says two party members and the wiki "two allies". T2 reads the target byte; if
  it says distinct, add a `distinct-per-hit` flag (`AbilityFlag` is a contract file: one
  `CONTRACT-CHANGES.md` entry) with a byte-identical guard on Chapter VII. Folded into **B7**.
- **N-G5: Desperado's trigger** is a condition on Mortibody's own turn ("all three active
  members Hasted"), not a hit counter. A few lines in the AI; the ladder is **B6**.
- **N-G6: the guide lookup leaks across games.** The Yojimbo review found
  `engine/tactics/guide.ts#guideForState` picks the **FFX-2 Bahamut guide** when the party's
  own Bahamut is on the field. Chapter X has Bahamut, so it needs its own guide and tactic
  (T7) before it is listed; fixing the lookup is the Yojimbo track's, or a spawned task.
- **Threaten:** byte landable, wiki immune (N-3): ship immune until checked (**B10**).

**Not needed:** a new `Side`, `BattleEvent` or damage type; a new shatter system; the
Isaaru duel or Evrae Altana (**B14**). **Contract files touched:** `encounters.ts`
(`number` widened to `1..10`, new `ChapterId`), `src/data/ffx/ids.ts` (new enemy and
ability ids), perhaps `AbilityFlag` (N-G4); one `CONTRACT-CHANGES.md` entry.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **B1** | Chapter title and location | "Seymour Natus" / "The Highbridge" / "Natus" | **"Seymour Natus"** (the encounter's name, D-037 precedent); location "Highbridge of Bevelle — before the Main Gate". Number X is settled (D-058) |
| **B2** | Opening line-up | a) Tidus, Yuna, Kimahri (the formation byte, and the turn-back scene) / b) the player picks at prep / c) Lulu, Yuna, Auron (Bio and Talk) | **a**, every switch legal from turn one; "tyk" is `[single source]` until checked against footage (N-11) |
| **B3** | Aeon Overdrive gauges at the start | a) all five full / b) Bahamut full (the Isaaru duel just before), the other four at an `[estimate]` partial value / c) all empty | **b**. It keeps the sourced aeon relay alive without handing out five Overdrives |
| **B4** | Does Yuna know Reflect? | a) yes / b) no; Rikku keeps the Reflect Chapter VIII gave her | **b**. Jegged says a normal Yuna levels on the bridge to learn it; the Reflect lines stay reachable through Rikku |
| **B5** | Items | a) Chapter VIII's inventory carried forward, plus Softs at an `[estimate]` count / b) the Gagazet inventory / c) a minimal kit | **a**; O'aka's Highbridge list is sourced before any new item is added |
| **B6** | Desperado's buff-count ladder (4–7 buffs → 25–100 %, wiki only, count undefined) | a) Haste-on-all-three only / b) also the ladder, with a guessed count | **a**; disclose the ladder in the guide's notes |
| **B7** | Unsourced AI details: element order Ice → Thunder → Water → Fire (GameFAQs only; matches Chapter VII's sourced cycle), Natus's cast if he moves first, Multi-ra's two targets | a) build: that order, the rotation's current element, two different members; each labelled "our estimate" / b) hold the AI until a second source | **a** |
| **B8** | Natus's own reflected spells (the Provoke + Reflect line): do they move his phase? | a) yes, damage from an action / b) no, only the party's actions count | **a**, labelled estimate; the wiki's rule is "direct damage" |
| **B9** | Mid-battle callouts | the Protect counter at 24,000, the first Break, the first shatter, the Banish line, the three Talk exchanges, a warning when the third Haste lands | **in**, drafted in a story draft Bailey reads first (the Yojimbo precedent) |
| **B10** | Threaten on Natus (N-3) | immune until checked / landable per the byte | **immune** |
| **B11** | How the wedding is told | a) Tidus's past-tense narration covers the wedding, leap, trial and Via Purifico; the Highbridge is staged live / b) stage the wedding with Kinoc and Mika speaking (two new portraits) / c) open on the bridge, no recap | **a**; no new portraits, and it picks up where Chapter VIII's narration stops |
| **B12** | Seymour's face in dialogue | a) the approved Macalania portrait for every line / b) that portrait until he transforms, then a Natus portrait from the picked painting | **b**, if O-1 lands in time; otherwise a |
| **B13** | The painted party and aeons that ship without a verdict (Kimahri, Wakka, Lulu, Rikku, Valefor, Ifrit, Ixion, Bahamut) | a) use them as Chapters I, VII and VIII do / b) hold for a verdict | **a** |
| **B14** | Stage the Isaaru duel or Evrae Altana? | yes / no, narration only | **no** (separate fights, scope creep) |
| **B15** | Music | a) a new original cue from the "Noble Rot" family (`SEYMOUR_UNMOORED`), auditioned / b) reuse Chapter VII's `boss-seymour-macalania` / c) reuse Chapter I's `boss-seymour` | **a**; b is the stand-in if the sketch is not picked in time |
| **B16** | If the art picks are late | ship registered and **LOCKED** / hold the release | **LOCKED** (D-069 precedent); said to Bailey before the cut |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory (`approved-hashes.json` checked; `public/art` listed)

| Asset | State | Notes |
|---|---|---|
| **Seymour Natus billboard** | **NEW** | None anywhere. Not a variant of the approved Flux body |
| **Mortibody billboard** | **NEW** | A separate target: idle, hurt, KO-and-revive. "Mechanical, hovering", at Natus's left `[single source]` |
| **Backdrop: the Highbridge, north end** | **NEW** | A plaza before the Main Gate, over water, Bevelle's towers behind; light and colour `[estimate]`. The visual bible's Bevelle palette is FFX-2's and does not apply (rule 14) |
| Party: Tidus, Yuna, Auron | **approved** (`cast:*`) | Serve as is |
| Party: Kimahri, Wakka, Lulu, Rikku | ship, **no verdict** | B13 |
| Aeons: Shiva **approved**; Valefor, Ifrit, Ixion, Bahamut ship, **no verdict** | exist | B13 |
| Speaker portraits: seven FFX guardians; `seymour-macalania` (human form) | **approved** | Seymour's lines before the transformation (B12) |
| Pause plate `pause/seymour.png` | **approved** | Can be the chapter's Seymour plate as is |
| Natus speaker portrait; chapter card, hero plate, pause chapter plate, thumbnail | **NEW** | Derived from the O-1 and O-3 picks |
| VFX: Break's stone, shatter, Desperado, Mortibsorption | check | Petrify and shatter ship in Chapter VIII; the drain ships in Chapter I; T5 checks what each draws before assuming |
| **Music: `boss-seymour-natus`** | **NEW** | THEMES.md §3 is the source family |

### 6.2 Options rounds: six, cheap and broad; a pick approves only what Bailey names

Method (`docs/plans/art-method-r3/METHOD-CHECK.md`): look at reference images before
drawing (rule 6), keep the output original (rule 8), pilot one and look at 1:1 first.
Only Seymour's face and hair may derive from approved pixels (the Macalania portrait), and
only if O-1 shows the reuse reads right.

- **O-1 Seymour Natus:** 3 concepts at battle scale beside a party idle: (a) new paint in
  the house style, (b) the same with the face derived from the approved portrait, (c) a
  darker, more pyrefly-lit variant.
- **O-2 Mortibody:** 2–3 options beside O-1's pick: how it hovers, how it reads at its
  size, how its KO and revive look (one strip).
- **O-3 The Highbridge:** 3 backdrop plates contrasting light (grey noon, storm dusk,
  night with the city lit), the Main Gate behind, the bridge running away to the south.
- **O-4 Reading the fight:** 2–3 mockups at 1600×900 **and** 390 px phone width of (i) the
  element combo telegraph, (ii) a Haste count warning before Desperado, (iii) a petrified
  member under threat of the Claw. One option is "intent text only". Bands and labels
  legible at phone width (the Yojimbo O-5 review finding).
- **O-5 Natus's portrait:** 2 options, only if B12 = b.
- **O-6 Music:** 2 sketches on `docs/audio/audition.html` (rule 13). Brief: the Noble Rot
  motif unmoored, a courtesy that has stopped pretending. Anti-brief: no quotation or
  imitation of "Run!!" or any original cue (rule 8).

## 7. Story beats (research §8.2, paraphrased; our own words, writing-bible voice)

The bible has no E-tag for this chapter; T6 adds the next free one. Voices: Seymour long,
courteous, "Lady Yuna", death as mercy (§1.9, "correct about the diagnosis, monstrous about
the cure"); Kimahri 3–8 words, third person, after the silence (§1.7).

- **Pre (under B11 = a):** (1) Tidus's past-tense narration: the steps, the kiss, Yuna's
  leap on Valefor, the trial, the Via Purifico, in about six lines; it opens where Chapter
  VIII's bells stop. (2) Live: the reunion on the bridge. (3) Seymour arrives; Kinoc is
  told of, not shown; his argument (death as mercy, the next Sin). (4) **Kimahri's stand**:
  one line, the spear. (5) Seymour becomes Natus. (6) Auron orders the retreat; Yuna stops;
  Tidus: we are all guardians; they turn back together. `battleStart()`.
- **Mid (B9):** the three Talk exchanges; the Protect counter at 24,000; the first Break;
  the first shatter; Natus's Banish line; the Haste warning.
- **Post:** Tidus's narration at the Macalania Woods campsite: they escaped, Yuna's faith
  is shaken, Bevelle is closed to them; the road to the Calm Lands (Chapter IX). `results()`.

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Size (agent hours, `[estimate]`) | Model |
|---|---|---|---:|---|
| Integrator | `encounters.ts`, `ids.ts`, `chapter-*` meta, registries, `CONTRACT-CHANGES.md`, `targets.json` | first and last | 1.0 | opus |
| T1 engine seams N-G1, N-G2 (+ N-G4 if B7) | `ai/reactions.ts`, `engine.ts` hook, `common/types.ts` flag | ids | 1.0 | opus |
| T2 enemy data | `src/data/ffx/enemies/seymour-natus{,-abilities}.ts` | ids | 0.75 | sonnet |
| T3 AI script | `src/battle/ffx/ai/seymour-natus{,-rules}.ts`, Talk table, registration | T1, T2, B6–B8 | 1.25 | opus |
| T4 party build | `src/data/ffx/builds/highbridge.ts` | B2–B5 | 0.75 | sonnet |
| T5 scene | `src/scenes/highbridge-*.ts` | O-1…O-3 picks | 1.5 | sonnet |
| T6 story + E-tag | `docs/plans/natus-story-draft.md` first, then `src/story/scripts/seymour-natus.ts`, `writing-bible.md` | B9, B11, B12 | 1.0 | sonnet |
| T7 guide + tactic | `src/data/guides/seymour-natus.ts`, `src/engine/tactics/seymour-natus.ts` | T2, T3 | 1.0 | opus |
| T8 HUD reads | `src/ui/ffx/` (only if O-4 picks more than intent text) | O-4 pick | 0.75 | sonnet |
| T9 audio | `src/audio/tracks/boss-seymour-natus.ts`, THEMES.md row | O-6 pick | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/natus-*.test.ts`, 200-seed bench | T1–T4, T7 | 1.5 | sonnet / opus |
| **Total** | | | **~11.5 agent hours**, plus judging and the review | |

**GPU `[estimate]`:** options sheets O-1 to O-3 and O-5 about 50 minutes; finals (Natus
idle, cast, hurt; Mortibody idle, hurt, KO; the backdrop; a portrait) about 100 minutes;
**about 2½ hours** with rerolls, only while NOW.md says art generation is on.

```
NOW   Bailey answers B1–B16 (one sheet) · O-1…O-6 go out together
      T1 engine seams │ T2 enemy data │ T4 build │ T6 story draft   (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure (every sourced line and the advisor, 200 seeds)
      on the picks: art finals → T5 scene │ T8 HUD │ T9 audio │ T6 script from the draft
LAST  integrator wiring commit · node tools/orphans.mjs · real-input win and loss ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, each pinning a research row:** the combo uses Mortibody's element;
  the Protect counter fires once at 24,000; a Poison tick across 24,000 moves nothing until
  the next hit; a Mortibsorption across a line moves the phase and fires the counter; the
  drain goes 4,000 / 3,000 / 2,000 / 1,000 / 1,000 and wins when lethal; Banish after one
  aeon turn; Break then Claw shatters at 90 % and no Switch refills the slot; Desperado
  after the third Haste, 468–529, strip list exact, Shell ignored; Talk exactly Tidus,
  Auron (STR) and Yuna (MDEF); Cura bounces off a Reflected Natus; Break reflected misses
  him; Delay lands on Mortibody and fails on Natus; Magic Break fails on both; Threaten
  fails; Poison ticks 1,440.
- **Absence tests (rule 14, CHK-021):** Chapter I's event logs byte-identical (N-G1),
  Chapter VII's too if N-G4 lands; Chapters 1–3, 7, 8, 9 at fixed seeds; FFX-2 untouched.
- **Measure, never tune:** win rate of each sourced line (Poison and wait, aeon relay,
  Mortibsorption farming, Haste two, brute force) and of a credibly wrong one (Haste all
  three and swing); the advisor's top row. If a line is unwinnable, bring Bailey measured
  options; **never weaken the boss**.
- **Real input:** chapter select → prep → pre scene → win and loss → results; screenshots
  under `docs/screenshots/chapters/natus-*`.

## 10. Review, risks, verdict

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/ffx/ai/reactions.ts,src/battle/ffx/engine.ts`
returns **DEEP** (chapter registry, FFX CTB engine): focused before deploy, deep after, on
live. Not save-data class unless the new `ChapterId` needs a `SaveData` migration (T1
checks the Yojimbo precedent). **Deploy cap:** check NOW.md for owed deep reviews at the
cut; a third deploy while one is owed needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | N-G1 changes Chapter I, a live chapter | byte-identical guard; a Chapter I finding is reported, not fixed in passing |
| R2 | Unsourced party stats decide whether Break + Claw is fair | B2–B5 answered, 200-seed measurement, no hand tuning |
| R3 | The guide leak shows the FFX-2 Bahamut guide here | own guide and tactic before listing (N-G6) |
| R4 | Two new billboards and a backdrop may miss the release | B16 (LOCKED) |
| R5 | Scope creep into the wedding, the trial, Isaaru, Evrae Altana | B11 = a, B14 = no |
| R6 | Copyright pull toward "Run!!" and the original script | original cue and lines; the audition page and the draft say so |

**Verdict: PROCEED.** Eighteen needed mechanics already work (§4.1), including the
shatter that the research expected to be new; the new surface is the Mortibsorption seam,
a stored phase, the combo and the Desperado trigger. Before the first perceivable line:
Bailey answers B1–B16 and picks O-1 to O-6. *Preflight only; the only file this work
commits is this one.*
