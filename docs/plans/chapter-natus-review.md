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

**Read in full:** `research/ffx-seymour-natus-highbridge.md` (0df4ba9e; "§n" = its sections),
`docs/plans/chapter-yojimbo-review.md`. **In part:** the engine files in §4, writing-bible §1.7,
§1.9, THEMES.md §3, `docs/target/*.json`, builds `fahrenheit.ts`, `gagazet.ts`. Carry the
research's tags verbatim. Its brief corrections stand: Mortibody has **no Full-Life**
(Mortiorchis does); **Total Annihilation** is Flux's, not this fight's.

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
**The thesis:** the fight punishes the obvious answers: hitting him moves the phases (Poison
does not), aeons get one turn, Hasting everyone calls Desperado, Petrify plus Claw deletes a
guardian. Sourced lines (§6.3): Poison and wait, Provoke + Reflect, the aeon relay, brute
force (Stone Ward, Esuna), Reflect on Natus, farming Mortibsorption, Haste only two.

## 3. The party and builds

- **Build point:** the Highbridge, before Macalania Woods and the Calm Lands. New
  `src/data/ffx/builds/highbridge.ts`, derived up from `fahrenheit.ts` (Chapter VIII, the
  lower bound) and down from `gagazet.ts` (the upper); Yuna from the lower half of the
  Gagazet row (§6.2). Every stat cell `[estimate]`, as both presets label their own.
- **Remove what Gagazet teaches** (Kimahri's Mighty Guard, White Wind); **carry forward**
  Chapter VIII's Stone Ward bracer and Reflect on Rikku (`fahrenheit.ts` C-14).
- **Talk** on Tidus, Auron, Yuna; Auron starts benched under B2, so his Talk costs a switch.
- **Aeons:** Valefor, Ifrit, Ixion, Shiva, **Bahamut**; no Anima, Magus Sisters or Yojimbo
  (§6.2 `[verified: 2]`). Starting gauges **B3**; line-up **B2**; Yuna's Reflect **B4**;
  items **B5** (the research names O'aka's shop, not its list: T4 sources it first).

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
  (`ai/reactions.ts:145`) names `mortiorchis` and `seymour-flux`, and **computes Seymour's
  threshold counters then drops them** (`void command`, line 154). Natus needs the drain to
  move his phase **and** fire the Protect counter (§4.4). Seam: a mount → host table, the
  counters returned to the queue for the Natus pair; Chapter I byte-identical. Whether
  Chapter I's drop is a defect is **not** claimed (rule 3): T1 runs it and reports.
- **N-G2: the phase is state, not HP.** Natus's AI must read a stored phase that only the
  action hook (and the drain) moves, as `seymour-flux.ts` stores `PHASE`. The collector
  returns early for an **enemy-side** attacker (the Yu Yevon rule), so Natus's own spells
  bounced back by Reflect (the Provoke + Reflect line) move nothing today: **B8**.
- **N-G3: the combo.** Natus's Multi-ra reads **Mortibody's last element**: shared AI
  state between two actors (flags on the battle state). Small; T3.
- **N-G4: "two different members".** Chapter VII's Multi-ra is `random-enemy`, `hits: 2`:
  two **independent** picks (Macalania C-3); the wiki says "two allies". If the target byte
  says distinct, add a `distinct-per-hit` flag (contract `AbilityFlag`, one entry), with a
  byte-identical guard on Chapter VII. In **B7**.
- **N-G5: Desperado's trigger** is a condition on Mortibody's own turn ("all three active
  members Hasted"), not a hit counter. A few lines in the AI; the ladder is **B6**.
- **N-G6: the guide leak.** `engine/tactics/guide.ts#guideForState` shows the **FFX-2
  Bahamut guide** when the party's Bahamut is on the field (Yojimbo review). Chapter X
  needs its own guide and tactic (T7) before it is listed.
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

Method (`art-method-r3/METHOD-CHECK.md`): reference images before drawing (rule 6), original
output (rule 8), pilot one at 1:1 first. Only Seymour's face and hair may derive from approved
pixels (the Macalania portrait), and only if O-1 shows it reads right.

- **O-1 Seymour Natus:** 3 concepts at battle scale beside a party idle: (a) new paint in
  the house style, (b) the same with the face derived from the approved portrait, (c) a
  darker, more pyrefly-lit variant.
- **O-2 Mortibody:** 2–3 options beside O-1's pick, with a KO-and-revive strip.
- **O-3 The Highbridge:** 3 plates contrasting light (grey noon, storm dusk, night with the
  city lit), the Main Gate behind, the bridge running south.
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

- **Pre (B11 = a):** (1) Tidus's past-tense narration, about six lines: the steps, the kiss,
  the leap on Valefor, the trial, the Via Purifico; it opens where Chapter VIII's bells stop.
  (2) Live: the reunion. (3) Seymour arrives, Kinoc told of, not shown; death as mercy, the
  next Sin. (4) **Kimahri's stand**, one line. (5) Natus. (6) Auron orders the retreat; Yuna
  stops; Tidus: we are all guardians; they turn back together. `battleStart()`.
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

**GPU `[estimate]`:** options sheets ~50 min; finals (Natus and Mortibody poses, backdrop,
portrait) ~100 min; **~2½ hours** with rerolls, only while NOW.md says art generation is on.

```
NOW   Bailey answers B1–B16 (one sheet) · O-1…O-6 go out together
      T1 engine seams │ T2 enemy data │ T4 build │ T6 story draft   (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure (every sourced line and the advisor, 200 seeds)
      on the picks: art finals → T5 scene │ T8 HUD │ T9 audio │ T6 script from the draft
LAST  integrator wiring commit · node tools/orphans.mjs · real-input win and loss ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, one per research row:** combo element; Protect counter once at 24,000;
  a Poison tick across a line moves nothing until the next hit; a drain across a line moves
  the phase and fires the counter; drain 4,000/3,000/2,000/1,000/1,000, lethal drain wins;
  Banish after one aeon turn; Break + Claw shatters at 90 %, no Switch refills the slot;
  Desperado after the third Haste, 468–529, exact strip list, Shell ignored; the Talk table;
  Cura bounces off a Reflected Natus; reflected Break misses him; Delay lands only on
  Mortibody; Magic Break and Threaten fail; Poison ticks 1,440.
- **Absence (rule 14, CHK-021):** Chapters 1–3, 7, 8, 9 byte-identical at fixed seeds
  (Chapter I for N-G1, VII for N-G4); FFX-2 untouched.
- **Measure, never tune:** each sourced line and a credibly wrong one (Haste all three and
  swing), plus the advisor's top row. If a line is unwinnable, bring Bailey measured
  options; **never weaken the boss**.
- **Real input:** select → prep → pre scene → win and loss → results; screenshots
  `docs/screenshots/chapters/natus-*`.

## 10. Review, risks, verdict

`critic-plan --paths` (encounters, reactions, engine) returns **DEEP**: focused before deploy,
deep after on live; not save-data class unless the `ChapterId` needs a migration. A third
deploy while a deep review is owed needs Bailey's words.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | N-G1 changes Chapter I, a live chapter | byte-identical guard; a Chapter I finding is reported, not fixed in passing |
| R2 | Unsourced party stats decide whether Break + Claw is fair | B2–B5 answered, 200-seed measurement, no hand tuning |
| R3 | The guide leak shows the FFX-2 Bahamut guide here | own guide and tactic before listing (N-G6) |
| R4 | Two new billboards and a backdrop may miss the release | B16 (LOCKED) |
| R5 | Scope creep into the wedding, the trial, Isaaru, Evrae Altana | B11 = a, B14 = no |
| R6 | Copyright pull toward "Run!!" and the original script | original cue and lines; the audition page and the draft say so |

**Verdict: PROCEED.** Eighteen mechanics already work (§4.1), shatter included; new: the drain seam,
a stored phase, the combo, Desperado. Nothing perceivable until B1–B16 and O-1 to O-6 are picked.

## Review (adversarial, 2026-09-24, FFX only)

Checked by a sub-agent of the driver against (a) the FF Wiki re-fetched through `api.php`
(revids: *Seymour Natus* 4017136, *Mortibody* 4017446, *Trigger Command* 4004212,
*Final Fantasy X enemy abilities* 4008011; all four **match** the research's Sources list,
so the text is the text the research read), (b) `src/battle/**` on main at 20a97838,
(c) the option sheets in `docs/concepts/chapters/natus/`, looked at scaled to a 390 px
phone (1170 device px). The decompile was not re-run (no download, rule 11).

### Research claims against the sources

| Claim | Verdict | Evidence |
|---|---|---|
| Natus HP 36,000, MP 200, Overkill 3,500, AP 6,300/9,450, Gil 3,500, STR 30, MAG 25, AGI 21, Def/MDef printed 1, Luck 15 | CONFIRMED | wiki Natus infobox |
| Natus Poison 50, poison% 4 (1,440 a tick), zanmato 4; immune Petrify, Slow, Doom, Delay, Magic/Armor/Mental Break, Threaten, demi, bribe; cannot escape | CONFIRMED | same (Threaten immune is the N-3 conflict, as stated) |
| Mortibody HP 4,000, Def 50, MAG 20, AGI 28, Overkill 36,000, Armor Break 50, Provoke immune; wiki Luck 15 | CONFIRMED | wiki Mortibody infobox (N-4 as stated) |
| Multi-ra DC 36 "Two allies", reflectable; Flare 60 (Flux 80), rank 5; Break Petrify infinite, reflectable; Banish Eject, only on aeons, immunity removed first | CONFIRMED | enemy-abilities table |
| Desperado 468~529, strips Haste, Nul x4, Protect, Reflect, Regen, Shell; Shattering Claw 16 / 100 / 90 % PDR; Mortibsorption 4,000 / 3,000 / 2,000 / 1,000 onward | CONFIRMED | enemy-abilities table |
| Thresholds, phase actions, Poison does not move the phase but Mortibsorption does, fires even if lethal; Talk Tidus/Auron +10 STR, Yuna +10 MDEF | CONFIRMED | wiki Natus "Battle" and "Strategy"; Trigger Command row (Tidus, Yuna, Auron) |
| Phase boundaries "at 24,000" / "12,000 and below" (pseudocode `<=`) | CORRECTED | Both wiki pages say "drops **below** 24,000" and "**below** 12,000". The inclusive edge is ours, not sourced; T3 follows "below" or labels the edge `[estimate]` |
| B7 lists "Multi-ra's two targets" as unsourced; N-G4 cites only "two allies" | CORRECTED | wiki Natus: "targeting two **different** party members **if possible**" (single source). B7's third part is sourced: distinct per hit with a same-target fallback, not a Bailey call |
| N-5: what the Desperado ladder counts is unstated, "whether Protect or Regen count" | CORRECTED (partly) | wiki Mortibody names the counted statuses: Haste, Shell, Reflect, NulElement (Protect and Regen are not in the list). Per character vs party-wide is still unstated; single source. B6 = a still stands |
| Research §4.4 / §4.6: Mortibody "revives with that HP", pseudocode sets `mortibody.hp = mortiMax` **before** the decrement (4,000 back at 4,000) | CORRECTED | Contradicts research §2.1 ("then 3,000 / 2,000 / 1,000 / 1,000 after each") and the engine (`scripted.ts#mortibsorption`: drains the current max, then `maxHp = max(1000, max - 1000)`, `hp = maxHp`, so it returns at 3,000). The wiki sentence fits both. The O-2 strip shows "max 3,000" (the engine reading). Not a Bailey call: take the engine reading and label the revive HP `[derived]` |

### Plan engine claims against `src/battle/**`

| Claim | Verdict | Evidence |
|---|---|---|
| §4.1 #1 shatter ships: flag + `shatterChance`, eject, no Switch refill | CONFIRMED | `abilities.ts:354-358`, `hp.ts:251` comment and `ejectActor`, `commands.ts:222`, `predicates.ts:100 canSwitchIn`, Evrae Swooping Scythe `shatterChance: 50` |
| #2 defeat when every active member is KO'd or petrified | CONFIRMED | `engine.ts:437-446` |
| #3 drain, revive, 1,000 floor | CONFIRMED | `scripted.ts:35, 38, 131` (revive HP: see the Mortibsorption row above) |
| #4 Banish after one aeon turn, overrides eject immunity | CONFIRMED | `seymour-flux.ts:154` `aeonTurns >= 1`; `hp.ts:257` skips the immunity only for `'banish'` |
| #5, N-G2 counters after actions only; an enemy-side attacker returns early | CONFIRMED | `reactions.ts` `if (attacker.side === 'enemy') return out`; `seymourThresholdCounters(ai, fromPoison)` returns `[]` on Poison. Note for T1: Mortibsorption's damage has an **enemy** source, so the N-G1 seam cannot route it through `collectBossCounters` as it stands |
| N-G1 drain wired to `mortiorchis` / `seymour-flux`, counters computed then dropped | CONFIRMED | `reactions.ts:145-156`, `void command` |
| #8 Provoke at `targeting.ts:219` | CORRECTED | line 219 is enemy **Cover**; Provoke redirection is `targeting.ts:245-248` |
| #12 `ai/seymour-anima-macalania.ts#nextElement` | CORRECTED | defined in `ai/macalania-rules.ts:340` (`ELEMENT_CYCLE` line 87: ice, lightning, water, fire). It steps the shared flag `MAC_ELEMENT_STEP`, so Natus needs its own key |
| #10 type `'other'`, no `'special'`; `'fixed'`, `'user-max-hp'`, `can-target-dead`, `poisonTickPercent`, Stone Ward / Stoneproof, `canEscape` default false, `UNLISTED_CHAPTERS`, the Talk functions | CONFIRMED | `types.ts:1195`, `formulas.ts:209, 217`, `targeting.ts:109`, `ticks.ts:136`, `equipment.ts:226, 241`, `setup.ts:307`, `chapters-unlisted.ts:22`, `ai/index.ts:90, 107` |
| N-G6 guide leak | CONFIRMED (by reading) | `guideForState` returns the first guide whose `bossIds` is on the board, and `ffx2-bahamut` lists `bahamut`. Not run (rule 3): T7 proves it with the party's Bahamut summoned |
| Contract: `encounters.ts` `number` widened to 1..10 | CONFIRMED | today `1 ... 9` (`encounters.ts:117`) |

### Option sheets: they exist, a phone read, a match against the research

All seven sheets named by the options builder exist and are in 20a97838. At phone width the
sheet headings and captions read; the HUD text inside the engine frames needs a zoom, as
expected for a sheet. The per-frame `fight/*-phone.jpg` files are the legible phone read.

| Finding | Verdict |
|---|---|
| O-4 B phase 2 puts **"Claw → Kimahri"** on the queue, and B and C print **"90 %"** as the next-turn risk | REFUTED as drawn. Shattering Claw hits a **random** character (research §4.1; GameFAQs: "not necessarily" the petrified one). The target is not known in advance, and 90 % applies only if the Claw lands on him (about 1 in 3 with three members up). The chip invents a target; the label should read "if the Claw hits him: 90 %". A's sentence says "would", which is right |
| O-4 phone frames: Mortibody sits behind the "Kimahri COMMAND" plate and Natus | Flag: the second combatant hardly reads at 390 px (staging, not data) |
| Desktop frames (O-1 to O-4) still show **FLEE**, and the enemy-move panel says **"Physical damage"** | Flag: both are Chapter VII leftovers. The party cannot escape (sourced) and Natus has no physical action. The phone set already drops Flee |
| O-2 sheet: "at Natus's left" labelled sourced, with Mortibody at **screen**-left | Flag: Jegged's "left" (single source) does not say whose left; facing the camera, his left is screen-right. Check against the reference before the finals |
| O-2 KO strip "back weaker, max 3,000" | Matches the engine, not research §4.6 (see above) |
| O-3 C recommended, while the README says B matches the one FFX screenshot seen | Taste over fidelity is **Bailey's call** ("faithful core, showpiece surface"). C's plate is also a gate facade rather than a bridge, and no plate shows the green runner or the crimson canopies the README itself describes |
| O-5 A described as "O-1 A's look" | CORRECTED: portrait A has a gold spiked halo and facial marks that O-1 A does not; picking portrait A approves a different look |
| O-1 ring rotation, Natus at 1.3x, Mortibody's height | CONFIRMED labelled as ours |

### Presented as settled but actually Bailey's call

1. §3 "carry forward Chapter VIII's **Stone Ward** bracer and Reflect on Rikku" and "remove
   Mighty Guard / White Wind": Stone Ward blunts the Break + Claw threat (the brute-force
   line), so it is a difficulty decision, and it is not in B2 to B5. Add it to B5 or give it
   its own row.
2. B8's recommendation "a" (Natus's reflected spells move his phase) needs an exception to
   the engine's player-side-only rule and is an estimate: correctly asked, keep it asked.
3. Every O-4 frame uses the line-up Tidus / Yuna / Kimahri. That is B2 = a, still unpicked.

**No invented numbers found in the plan.** Every number traces to the wiki revisions above,
a decompile tag, or an `[estimate]` label. The sheet number that misreads (O-4's "90 %" as
next-turn odds) is presentation, not data.

**Review verdict: PROCEED**, with four corrections folded in before T1 and T3 start (the
phase edge, the sourced distinct targets, the revive-HP reading, a separate element-step key)
and the O-4 Claw chip and "90 %" label fixed before the sheet goes to Bailey.
