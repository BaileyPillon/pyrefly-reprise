# Paper preflight: Chapter IX — Yojimbo, Cavern of the Stolen Fayth (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-evrae-review.md`. **Docs only: no code, no browser, no build, no render.**
Written 2026-09-24 by a sub-agent of the driver, after Bailey's words (verbatim, ~00:50 EDT):
*"I'll pick your recommendations plus Yojimbo. Let's add Yojimbo first please. He goes in next build!"*

**Verdict: PROCEED on engine, data, AI and story now; HOLD everything Bailey will see or hear
until the options rounds in §6 come back picked (hard rule 9).**

## 1. Game case and sources

**Game case: FFX only.** CTB, aeons, a boss Overdrive gauge, Ronso Rage Doom; research §0.3:
"None of these facts transfers across games" (FFX-2's Zanmato drops the party to 1 HP / 1 MP;
FFX's deals 9,999). The gauge widget and the AI live under `src/battle/ffx` and `src/ui/ffx`
only. The chapter registration in `src/data/encounters.ts` is shared plumbing, case "both"
(CHK-020). The FFX-2 Yojimbo (candidate C) belongs to the planned FFX-2 fallen-aeons chapter.

**Read in full:** `research/ffx-yojimbo.md` (b70358b7; "§n" below means its sections) and
`docs/plans/chapter-evrae-review.md`. **Read in part** (the files named in §4), plus
`research/ffx-seymour-flux.md` §6–§7, `research/writing-bible.md` §1.6, `research/visual-bible.md`,
`docs/target/*.json`, `public/art/characters/yojimbo/*.json`, `src/audio/tracks/`, `src/scenes/`.
**Carry the research's tags verbatim into the data files** (`docs/CONTRACTS.md`).

## 2. The encounter (research §1–§4; summary only, the data file cites the research)

| Item | Value | Tag |
|---|---|---|
| Which fight | **A: Lady Ginnem's Yojimbo**, last chamber of the Cavern of the Stolen Fayth, first Calm Lands visit, after Bevelle, before Gagazet | §1.2, §5.1 `[verified: 3 sources]` |
| Formation | `[mira (Ginnem), yojimbo, koma_inu (Daigoro)]`, normal start, no forced party, cannot flee | §2.5 `[decompiled]`; flee §4.3 `[single source]` |
| Yojimbo `m288` | HP 33,000 · MP 2,000 · Overkill 4,060 · STR 34 · **DEF 80** · MAG 35 · **MDEF 0** · AGI 32 · Luck 15 · EVA 0 · 0 AP/gil · no drops | §2.1 `[decompiled]` + wiki |
| Doom | landable, **count 5** | §2.3 `[verified: 4 sources]` |
| Immune | Death, Zombie, Petrify, Poison, all Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Dark, Slow, Scan, Distillers, Eject; % damage, Sensor, Scan, Delay, Bribe | §2.3 `[verified: 2 sources]` |
| Daigoro `m266` | HP 1 · **STR 25** · acts only when ordered; **Daigoro** Strength DC 20, one random character, crit bonus +20, shatter 10 % | §2.5, §3.1 `[verified: 2 sources]` |
| Kozuka / Wakizashi | Strength DC 16 / DC 28, **one random character each** (Y-2 resolved) | §3.1 `[verified: 2 sources]` |
| **Zanmato** | fixed, no variance, DC 200 → 10,000, capped **9,999**, whole party, special type (Protect does not apply) | §3.1 `[verified: 4 sources]` |
| Gauge | +3 % when targeted, +2 % when he acts `[single source]`; <25 Daigoro only, ≥25 +Kozuka, ≥50 +Wakizashi, ≥80 K/W "slightly" likelier, 100 Zanmato `[verified: 3 sources]` | §4.1 |
| Unsourced | odds inside each band, the ≥80 nudge, starting gauge, value after Zanmato, per-action vs per-hit counting | §9 Y-1 |

**The design fact (§2.1, `[derived]`):** physical hits land at about 52 % of their value into
Def 1; spells land at full value. Lulu is the best attacker in her own fight (§3.3). **The
thesis:** every action aimed at him fills the Zanmato gauge, so the fewer, bigger blows win:
magic, Doom, an aeon in front of the blade (§4.1, §5.3). Under the research's own reading of
three targetings a round (+11 %, `[derived]` §4.1) and a start at 0 (`[estimate]`), Zanmato
arrives on about his tenth turn, and Doom must land before the gauge passes about 45 % to kill
him first. T3 and T10 measure this; nobody tunes it by hand.

## 3. The party and builds

- **Build point:** the Calm Lands, after the Highbridge and Macalania Woods, before Mt. Gagazet
  (§5.1). New file `src/data/ffx/builds/cavern.ts`, derived from `gagazet.ts` **downward**:
  the research names Gagazet as the upper bound (§5.2).
- **Remove what Gagazet teaches.** `gagazet.ts` gives Kimahri Mighty Guard and White Wind,
  learned from Biran and Yenke Ronso on Gagazet itself (`ffx-seymour-flux.md` §7), so neither
  exists yet at the Cavern. T4 rebuilds his Ronso Rage list from sources, never memory.
- **Kimahri's Doom.** Learned by Lancet from a Ghost in this same cavern (§5.3 strategy 1,
  `[verified: 4 sources]`); the ability row already exists (`overdrive-kimahri-2.ts` `doom`).
  Learning a new Rage fills his gauge (`ffx-seymour-flux.md` §7.9.2, `[single source]`, the
  rule `gagazet.ts` already applies). Recommend: he arrives with Doom learned and a full gauge,
  tagged `[estimate]` for "the player took the Ghost" (question B8).
- **Aeons:** Valefor, Ifrit, Ixion, Shiva, Bahamut; no Anima, Magus Sisters or Yojimbo (§5.2).
- **Opening line-up (`[estimate]`, the game forces none):** **Lulu, Kimahri, Yuna**: magic,
  Doom, and the aeon that takes Zanmato. Tidus, Auron, Wakka, Rikku on the bench.
- **Candle of Life:** the item exists (`cures-utility-3.ts`) but no source says the party holds
  one here (research §10 item 4). Recommend leaving it out; Kimahri's Doom is the sourced route.
- Stats: every cell `[estimate]` below the Gagazet values, as `gagazet.ts` labels its own.

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only, no engine change

| # | Need | Where it is |
|---:|---|---|
| 1 | Zanmato 200 → 10,000 | `formulas.ts#baseDamage` case `'fixed-no-variance'` returns `dmgCon * 50` |
| 2 | The 9,999 cap (no Break Damage Limit) | `equipment.ts#damageCapFor` returns 9999 unless `always-break-damage-limit` or the auto-ability |
| 3 | Protect does not reduce Zanmato; Shield does (÷4) | `formulas.ts` step 5 is physical-only; step 2/3 `shield` ÷4 applies to every type (wiki: Shield mitigates Zanmato, §4.3) |
| 4 | An aeon on the field takes the party-wide blow | `state.ts#friendlies` returns only the aeon while `state.aeonId` is set |
| 5 | Doom with count 5 on the boss | `statuses.ts:222` sets `turnsRemaining` from `EnemyFields.doomTurns` (the Yu Yevon fix) |
| 6 | Gauge +3 % per targeting, once per action | `overdrive.ts#onTargeted` reads `ActorRuntime.gaugePerTargeting`, called once per action from `abilities.ts#resolveAbility` (Anima uses it). Per action, not per hit, is `[estimate]` (Y-1) |
| 7 | Enemy gauge and its HUD event | `FFXCombatant.overdrive` on an enemy, `addGauge`, the `overdrive-gauge` event; `BattlePresenterVitals.ts` already tracks `gauge` for any combatant |
| 8 | Immunities, % damage, Scan, Sensor, Delay, Bribe | `immunityFlags` union in `types.ts` has each flag |
| 9 | Untargetable, and not a victory condition | `flags.untargetable` (`predicates.ts#targetable`) and `ActorRuntime.nonCombatant` (`engine.ts#checkEnd`, built for Cid) |
| 10 | Boss chrome, no flee | `flags.isBoss` |
| 11 | A "fire at full gauge" AI pattern | `ai/macalania-rules.ts` (Anima's Oblivion: gauge + per-turn gain + per-targeting gain) |

### 4.2 The real gaps (FFX only)

- **Y-G1: an actor on the field that never takes its own turn (Daigoro; Ginnem if she is a
  combatant).** `turnQueue.ts` admits anyone `onField && inTurnQueue`, and `inTurnQueue`
  (`predicates.ts:50`) checks only KO, Eject and Petrify. `hidden` also hides the painting.
  A CTB row for the dog would contradict §2.5 (it acts on Yojimbo's order).
  Smallest seam: an `ActorRuntime` field (`state.ts`, not a contract file) read where the queue
  is built. Needs a byte-identical event-log guard on Chapters 1–3, 7, 8.
- **Y-G2: an enemy turn that makes another actor act.** Yojimbo's row 4:134 orders slot M3,
  then the dog uses 4:177 with **its own** Strength 25 (§3.1). `ai/reactions.ts#BossCounter
  { actorId, command, cause }` already lets a named actor act for 0 CTB, but it is collected
  after *party* actions. T1 either feeds it from Yojimbo's own turn or adds a small order hook.
  The rank of the order row is **not in the research**: T2 reads it from the same decompiled
  row or labels it `[estimate]`.
- **Y-G3: the gauge is visible.** No FFX HUD element draws an enemy gauge today (the intent
  panel's `intent.ts#notesFor` mentions BFA's gauge in text only). **Perceivable, so not a
  builder's call:** O-5.
- **Y-G4: Threaten.** The byte says landable, the wiki says immune (Y-3). Ship it immune until
  checked, as Evrae's C-4.

**Not needed:** the payment mechanic (not part of fight A, §1.2, §7); Zanmato as instant death
(that is the *player's* Zanmato `3:226`; the enemy row is fixed damage, §3.2); a new `Side` or
`BattleEvent`. **Contract files touched:** `encounters.ts` (new `ChapterId`,
`number` widened from `1..8` to `1..9`) and `src/data/ffx/ids.ts` (new enemy and ability ids);
one `docs/CONTRACT-CHANGES.md` entry.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **B1** | Which Yojimbo fight is the chapter? | A Ginnem's Yojimbo (story) / B Dark Yojimbo (postgame, 1.6M HP ×5) / C FFX-2 "Tourist Trap" | **A.** The only story fight, best data; C goes to the fallen-aeons chapter |
| **B2** | Y-1: odds inside each gauge band are unsourced | a) even split, labelled `[estimate]`, the ≥80 "slightly" nudge left out and disclosed / b) hold the AI until a primary AI dump is found (a download needs your yes) / c) a weighted guess | **a.** No invented weights; start 0 and reset 0 after Zanmato, both `[estimate]` |
| **B3** | Lady Ginnem and Daigoro: can the party target them? (Y-5, Y-10: no source says) | a) both untargetable; Ginnem is scenery, the dog acts only on orders / b) targetable, as their HP 10 and 1 records might allow | **a.** Killing a 1-HP dog or a 10-HP summoner would be an unsourced shortcut |
| **B4** | Hiring Yojimbo (the haggle, 190,350 gil) | a) out of scope; the post scene ends as Yuna goes on to the fayth / b) a later epilogue beat (new idea, rule 10) | **a** for release 13 |
| **B5** | Chapter title | "Yojimbo" / "Lady Ginnem" / "The Stolen Fayth" | **"Yojimbo"** (`Chapter.title` is the encounter's name; Evrae precedent D-037); location "Cavern of the Stolen Fayth" |
| **B6** | Yojimbo's look | a) repaint in the wiki's gold/orange/purple (sourced, Y-7) / b) the existing navy painting | **a.** The existing painting is **not approved** (§6.1) and follows the visual bible's navy `[estimate]` |
| **B7** | Music | a) a new original cue in the slot "Lulu's Theme" holds (grief, restraint; the only place it plays) / b) reuse an FFX boss cue | **a**, auditioned first (O-6); a stand-in cue only if the sketch is not picked in time |
| **B8** | Kimahri's Doom | a) learned from the Cavern Ghost, full gauge / b) not learned; Doom only by item | **a** (§3) |
| **B9** | Threaten (Y-3) | immune until checked / landable per the byte | **immune** |
| **B10** | Chapter number | IX (registration order; the story order is Natus → Yojimbo) | **IX**; Seymour Natus becomes X |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory

| Asset | State | Notes |
|---|---|---|
| **Yojimbo painting** | **exists, NOT approved** | `public/art/characters/yojimbo/{idle,attack,overdrive}.png` (Sep 18–19). No `yojimbo` entry in `approved-hashes.json` (hashes checked) or `targets.json`; the cast tile says aeons other than those shown "have no verdict yet". The prompt is navy coat and bone mask, with "dog" in the negative. **It cannot be the boss as is without Bailey's yes (B6)** |
| **Daigoro** | **NEW** | Only the visual bible's `[estimate]` palette exists. A dog at Yojimbo's side, runs for its attack |
| **Lady Ginnem, unsent** | **NEW** | Belgemine palette swap with white face make-up (§6.3 `[single source]`); Belgemine is not painted either |
| **Backdrop: the Cavern's last chamber** | **NEW** | Open cave room, dormant teleport pad in the middle (§6.1 `[verified: 2 sources]`); colour and light `[estimate]` |
| Yojimbo arrival | **option** | The aeon entrance (night dimension, one blue-flowered sakura, a bark, Daigoro first) is `[single source]` (visual-bible) |
| Party idles and portraits | **exist** | T5 checks each `public/art/characters/<id>/<state>.png` before assuming |
| Chapter card, pause plate, thumbnail | **NEW** | Derived from O-1 and O-4 picks |
| **Music: `boss-yojimbo`** (+ optional `scene-cavern`) | **NEW** | No Lulu motif in `src/audio/tracks/`; THEMES.md has no row |
| VFX: Zanmato, Daigoro lunge, Doom counter | **NEW** / check | Doom already ships in Chapter 3 (Yu Yevon); T5 checks what it draws. Zanmato's slash is new |

### 6.2 Options rounds: six, cheap and broad, a pick approves only what Bailey names

- **O-1 Yojimbo as the boss:** 3 options at real resolution: (a) repaint in the sourced palette,
  (b) the existing navy painting as is, (c) the existing painting recoloured from its own
  pixels. Each beside a party idle at battle scale.
- **O-2 Daigoro:** 2–3 options, seated beside O-1's pick.
- **O-3 Lady Ginnem:** 2–3 options of the unsent: solid, pyrefly-edged, half-formed.
- **O-4 The chamber:** 3 backdrop concepts contrasting light (cold cave, pyrefly glow, warm
  lamp) with the teleport pad dormant; one shows the night-sakura arrival as an overlay.
- **O-5 The Zanmato gauge (highest risk):** 3–4 HUD mockups at 1280×960 and phone width:
  a bar under his name, a ring on his CTB icon, a blade that draws as it fills. Each marks the
  25/50/80/100 thresholds and the "Zanmato next turn" state. A small interactive prototype if
  the stills do not settle it (R1).
- **O-6 Music:** 2 sketches in `docs/audio/audition.html` (Bailey judges by ear, rule 13).
  Brief: Lulu's grief under control, a slow minor line that a battle pulse joins, and one
  crack of feeling. Anti-brief: no quotation or imitation of the original melody (rule 8).

## 7. Story beats (research §6.2, `[verified: 2 sources]`; our own words)

The bible has **no E-tag** for this chapter; T6 adds one. Lulu's voice card (writing-bible §1.6) allows
"a raised voice… exactly once per arc when grief cracks through": this is that scene.

- **Pre:** (1) Gorge Bottom: Lulu names the place and hangs back. (2) Why the fayth was stolen;
  Rikku and Wakka side with the thief. (3) Pyreflies gather; Kimahri names an unsent; Lulu
  knows Lady Ginnem and says she was too young. (4) Yuna begins the sending; Ginnem breaks it;
  Lulu takes up her last duty as Ginnem's guardian. `battleStart()`.
- **Mid (one callout each):** gauge crosses 50 % (Lulu reads the blade); "Zanmato next turn";
  Doom lands; an aeon takes Zanmato.
- **Post:** (5) Yuna sends Ginnem; Lulu finds the farewell less sad than she feared; Wakka
  tells her she is stronger; she sends Yuna on to the fayth. `results()`. No haggle (B4).

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Size (agent hours, `[estimate]`) | Model |
|---|---|---|---:|---|
| Integrator | `encounters.ts`, `ids.ts`, `chapter-meta.ts`, registries, `CONTRACT-CHANGES.md`, `targets.json` | first and last | 1.0 | opus |
| T1 engine seams Y-G1, Y-G2 | `turnQueue.ts`/`predicates.ts`, `state.ts`, `ai/reactions.ts` or `engine.ts` | integrator's ids | 1.0 | opus |
| T2 enemy data | `src/data/ffx/enemies/yojimbo{,-abilities}.ts` | ids | 0.75 | sonnet |
| T3 AI script | `src/battle/ffx/ai/yojimbo.ts`, registration | T1, T2, B2 | 1.0 | opus |
| T4 party build | `src/data/ffx/builds/cavern.ts` | B8 | 0.75 | sonnet |
| T5 scene | `src/scenes/cavern-*.ts` | O-1…O-4 picks | 1.5 | sonnet |
| T6 story + E-tag | `src/story/scripts/yojimbo.ts`, `writing-bible.md` | B3, B4 | 0.75 | sonnet |
| T7 guide + tactic | `src/data/guides/yojimbo.ts`, `src/engine/tactics/yojimbo.ts` | T2, T3 | 1.0 | opus |
| T8 gauge widget | `src/ui/ffx/` (new file) | O-5 pick | 1.0 | sonnet |
| T9 audio | `src/audio/tracks/boss-yojimbo.ts`, `THEMES.md` row | O-6 pick | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/yojimbo-*.test.ts`, 40-seed harness | T1–T4, T7 | 1.5 | sonnet / opus |
| **Total** | | | **~11 agent hours**, plus judging and the review | |

**GPU `[estimate]`:** options sheets O-1 to O-4 about 45 minutes; finals (Yojimbo idle and
cast, Daigoro, Ginnem, the backdrop) about 90 minutes; **about 2¼ hours** with rerolls, only
while NOW.md says art generation is on.

```
NOW   Bailey answers B1–B10 (one sheet) · O-1…O-6 go out together
      T1 engine seams │ T2 enemy data │ T4 build │ T6 story   (nothing perceivable)
THEN  T3 AI → T7 guide/tactic → T10 measure (intended line and advisor, 40 seeds each)
      on the picks: art finals → T5 scene │ T8 gauge widget │ T9 audio
LAST  integrator wiring commit · node tools/orphans.mjs · real-input win and loss ·
      screenshots · focused review → deploy → live check → deep review on live
```

## 9. Acceptance cases (T10)

- **Mechanic units, each pinning a research row:** Zanmato 9,999 to each of three members;
  Shield ÷4 on an aeon; Protect ignored; Daigoro uses the dog's Strength 25 and never Yojimbo's;
  Doom kills on his fifth turn; gauge +3 per action (not per hit) and +2 per his action; the
  25/50/100 gates; Scan and Sensor show nothing; Gravity does nothing; Threaten fails.
- **Absence tests (rule 14, CHK-021):** no FFX-2 chapter builds an enemy gauge widget; FFX-2
  chapters' event logs are byte-identical at fixed seeds; so are Chapters 1–3, 7, 8 (Y-G1).
- **Measure, never tune:** win rate of the intended line (Lulu magic, Doom early, an aeon
  before Zanmato) and of the advisor's top row. If a line is unwinnable, bring Bailey measured
  options; **never weaken the boss** (`boss-side-fix-needs-measured-options`).
- **Real input:** chapter select → prep → pre scene → win and loss → results, screenshots under
  `docs/screenshots/chapters/yojimbo-*`.

## 10. Review, risks, verdict

`critic-plan --paths src/data/encounters.ts,src/battle/ffx/engine.ts` returns **DEEP**
(chapter registry, FFX CTB engine), focused before deploy, deep after on live. Not save-data
class unless the new `ChapterId` needs a `SaveData.chapters` migration (T1 checks the Evrae
precedent). **Deploy cap:** NOW.md shows deep reviews still owed; release 13 may be the third
deploy while one is owed, which needs Bailey's words or a settled deep review.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | The gauge widget looks right and feels wrong | O-5 prototype if the stills do not settle it |
| R2 | "Next build" versus hard rule 9 | Engine, data, AI, story and tests run now; the chapter can ship registered and LOCKED (Chapters VII, VIII precedent) if the art picks arrive late: say so to Bailey before the cut |
| R3 | Unsourced AI odds shape difficulty | B2 answer, named tunables, measured |
| R4 | Y-G1 leaks into other chapters | byte-identical event-log guards |
| R5 | The painting is unapproved and off-palette | O-1; approved files hashed only after Bailey's yes |
| R6 | Copyright pull toward "Lulu's Theme" | original cue; the audition page says so |

**Verdict: PROCEED.** Eleven needed mechanics already work (§4.1); the new surface is two small
FFX-only seams, one AI script and one widget. Before the first perceivable line: Bailey answers
B1–B10 and picks O-1 to O-6. *Preflight only; the only file this work commits is this one.*

## Review (adversarial, 2026-09-24)

Written by a review sub-agent. It re-fetched three FF Wiki pages through
`api.php?action=parse&prop=wikitext` with a browser user agent: **Yojimbo (Final Fantasy X
boss)** revid 3980332, **Final Fantasy X enemy abilities** revid 4008011, **Ginnem (boss)**
revid 3963152. All three revids match the research's Sources list, so the text is the same
text the research read. It then checked the §4 engine claims against `src/battle/ffx` and
looked at the options sheets under `docs/concepts/chapters/yojimbo/` (commit e4464ea3) at
phone width (390 CSS px). Scratch: `D:/Tools/pyrefly-scratch/yojimbo/review/`.

### Research claims against the sources

| Claim (research §) | Verdict | Evidence |
|---|---|---|
| HP 33,000, Overkill 4,060, MP 2,000, STR 34, DEF 80, MAG 35, AGI 32, Luck 15, EVA 0, 0 AP/gil (§2.1) | **CONFIRMED** | boss infobox, section 1 (the wiki prints MDef 1 and ACC 1, as the research says) |
| Doom count 5; only works in this encounter; Doom from the cavern's Ghosts or a Candle of Life (§2.3, §5.3) | **CONFIRMED** | boss page "Strategy" |
| Cannot flee; Eject immune (§4.3) | **CONFIRMED** | boss infobox `info` line |
| Threaten: the wiki says Immune (Y-3) | **CONFIRMED** | boss infobox `threaten = Immune` |
| Immunity list `[verified: 2 sources]` (§2.3) | **CORRECTED** | The wiki infobox has no Confuse row, and it lists neither Auto-Life nor Slice. Those three are `[decompiled]` only, `[single source]`. The rest agree. |
| Gauge +3 % targeted, +2 % "when he acts" (§4.1, plan §2) | **CORRECTED** | The wiki says "2% when **attacking**". Whether the Daigoro *order* turn and the Zanmato turn pay the +2 is not sourced. Add it to Y-1, and make the "+2 per his action" test in §9 an `[estimate]` pin. |
| Band gates 25 / 50 / 80 "slightly", Zanmato 9,999 to all (§4.1) | **CONFIRMED** | boss page "Battle" |
| Daigoro DC 20, crit, 10 % PDR; Kozuka 16; Wakizashi 28 "One ally"; Zanmato 200, "All allies", `Sp`, "Inflicts 10,000 damage" (§3.1) | **CONFIRMED** | enemy-ability tables. The "random" in "one random character" comes from the decompile alone; the wiki says only "One ally". |
| Lulu's Theme is the battle music (§6.4) | **CONFIRMED** | boss page "Musical themes" (the "only place" half rests on the Lulu and OST pages, not re-fetched) |
| Ginnem HP 10, STR 7, ACC 10, EVA 2, Luck 15, Sleep/Silence/Dark 20, Doom count 3; "internally programmed as an enemy" (§2.5) | **CONFIRMED** | Ginnem (boss) infobox. It adds Threaten, Bribe, Sensor and Scan immune, which the research leaves out (harmless while B3 = untargetable). |
| Physical ≈ 52 % into Def 80; Fira ≈ 1,358 at Magic 35 (§3.3) | **CONFIRMED** | recomputed: 730 − ⌊(80·51 − ⌊6400/11⌋)/10⌋ = 381; 381/725 = 0.526. Fira: 24·(204+24)/4 = 1,368 × 725/730 = 1,358 |

### Plan §4.1 engine claims against the code

| # | Verdict | Evidence |
|---:|---|---|
| 1 Zanmato `dmgCon * 50` | **CONFIRMED** | `formulas.ts:211` |
| 2 9,999 cap | **CONFIRMED** | `equipment.ts:301` |
| 3 Protect ignored, Shield ÷4 | **CONFIRMED, with a CORRECTION** | Step 5 is physical-only and Shield (step 2/3) applies to every type. **The engine has no `'special'` damage type**: `DamageType` is `physical`, `magical` or `other` (`common/types.ts:1195`). T2 must type Zanmato `'other'`; "special" in §2 is the wiki's label. |
| 4 an aeon takes the party-wide blow | **CONFIRMED** | `state.ts:327` |
| 5 Doom count from `doomTurns` | **CONFIRMED** | `statuses.ts:222` |
| 6 +3 once per action | **CONFIRMED** | `abilities.ts:137` calls `onTargeted` once per target before the hit loop; `overdrive.ts:152` counts party-side and aeon users only |
| 7 enemy gauge and HUD event | **CONFIRMED** | `overdrive.ts#addGauge`, `BattlePresenterVitals.ts:86` |
| 8 immunity flags | **CONFIRMED** | `common/types.ts:452` has delay, bribe, threaten, percentage, sensor and scan |
| 9 untargetable, non-combatant | **CONFIRMED** | `predicates.ts:76`, `engine.ts:397` |
| 10 "`flags.isBoss`: no flee" | **CORRECTED** | The type comment says so, but the FFX engine reads `ctx.rt.canEscape` (`commands.ts:113`, `execute.ts:56`), which defaults to false (`setup.ts:306`). The outcome is right; the mechanism is `canEscape`. |
| 11 fire-at-full-gauge pattern | **CONFIRMED** | `ai/macalania-rules.ts:153, 243` |
| Y-G1 queue admits `onField && inTurnQueue` | **CONFIRMED** | `turnQueue.ts:72`, `predicates.ts:50`. Cid (`nonCombatant`) still takes CTB turns, so no existing field covers "on the field, never in the queue". |
| Y-G2 counters collected only after party actions | **CONFIRMED** | `ai/reactions.ts:56`, `engine.ts:334` |
| Contract files: `number` is `1..8`; `ids.ts` is a contract | **CONFIRMED** | `encounters.ts:110`, `docs/CONTRACTS.md:11` |
| Gagazet build has Mighty Guard and White Wind; Kimahri's `doom` row exists | **CONFIRMED** | `gagazet.ts:180`, `overdrive-kimahri-2.ts:68` |
| Yojimbo art is unapproved | **CONFIRMED** | 0 hits in `approved-hashes.json` and `targets.json` |

### Derived numbers

- **"Zanmato on about his tenth turn"**: **CONFIRMED** under the plan's own assumptions
  (start at 0, +11 a round): 9 + 11(k−1) ≥ 100 gives k = 10.
- **"Doom must land before the gauge passes about 45 %"**: **CORRECTED.** In the engine,
  Doom kills him *as his fifth turn opens* (`ticks.ts:82–88`, `engine.ts:213`), so he acts
  only four more times. Under the same assumptions the threshold is **about 55 %, not 45 %**.
  It also holds only if the party keeps hitting him after Doom lands. It is `[derived]` from
  `[estimate]` inputs: T10 should measure it, and it should not be quoted as a fact.
- **No invented game data found.** Every stat and damage constant in the plan traces to a
  tagged research row. The unsourced values (the band odds, the start and reset values, and
  per-action counting) are labelled `[estimate]` and put to Bailey as B2.

### Presented as settled but actually Bailey's call

1. **§3 opening line-up (Lulu, Kimahri, Yuna)** and **leaving out the Candle of Life** are
   agent guesses, not B-questions. Either add them to the B sheet or record them under
   `inferred` (rule 15). The research itself calls "Lulu leads" a presentation choice.
2. **§7 the four mid-battle callouts** (gauge at 50 %, "Zanmato next turn", Doom lands, an
   aeon takes Zanmato) are new perceivable content with no option or question attached.
   **PLAUSIBLE** risk under rules 9 and 10: show them in T6's story options, or fold them
   into the O-5 gauge pick.
3. **R2 "ship registered and LOCKED"** sets Bailey's "he goes in next build" against rule 9.
   The plan already says to tell Bailey before the cut; it must be a question, not a default.

### Options sheets

- **CONFIRMED:** they exist. O-1 to O-5 are in `docs/concepts/chapters/yojimbo/` with a README
  and one question per round. O-6 music is deliberately absent (rule 13) and is still owed on
  `docs/audio/audition.html`.
- **Phone reading: PARTLY.** At 390 CSS px the O-1 sheet reads well: its titles, captions
  and the three paintings are all clear. On the O-5 gauge sheet the titles and captions read,
  but the band labels (25/50/80) and the intent text inside each mockup are too small to
  read without zooming.
- **CORRECTED against §6.2:** O-5 promised mockups "at 1280×960 and phone width". The
  mockups were delivered at **1600×900 only, with no phone-width mockup**. O-4 promised one
  plate with the night-sakura arrival overlay, and **none was made**. The chamber plates also
  have no teleport pad; the README discloses this.

**Review verdict: the preflight stands (PROCEED on engine, data, AI and story; HOLD on anything
perceivable).** Before it drives any build, fix four things: the `'other'` damage type, the
`canEscape` mechanism, the ~55 % Doom figure, and "+2 when attacking" added to Y-1. Add the
line-up, Candle and callouts to Bailey's sheet. Owe a phone-width O-5 mockup.

## Built on assumptions (yojimbo-core track, 2026-09-24)

Bailey's picks on §5 are pending, so the engine, data, AI and registration were built **only
where they do not depend on them**, on the driver's recommended assumptions. Each is one named
constant or one data field, labelled in the code, and changes with one edit when Bailey picks.

| # | Assumption (pending Bailey) | Where it lives |
|---|---|---|
| **B1** | The chapter is Lady Ginnem's Yojimbo in the Cavern of the Stolen Fayth (candidate A) | `src/data/ffx/enemies/yojimbo.ts` (formation `[ginnem, yojimbo, daigoro]`, research §2.5) |
| **B2** | The odds inside each gauge band are unsourced: an **even split**, labelled "our estimate"; the ≥80 "slightly likelier" nudge is **not modelled** (the band is exposed, it changes no odds); gauge starts at 0 and returns to 0 after Zanmato | `src/battle/ffx/ai/yojimbo-rules.ts` (`yojimboPool`, `YOJIMBO_GAUGE_START`, `YOJIMBO_GAUGE_AFTER_ZANMATO`, `YOJIMBO_ODDS_NOTE`, `YOJIMBO_ASSUMPTIONS`) |
| **B3** | Lady Ginnem and Daigoro cannot be targeted; neither is a victory condition; neither owns a CTB turn | `flags.untargetable` in the data; `ActorRuntime.nonCombatant` + `ordersOnly` from the setup hook |
| **B4** | No hiring or haggling | nothing built (research §7 stays unused) |
| **B8** | Kimahri starts with Doom learned (the Cavern Ghost) and a full gauge | `src/data/ffx/builds/yojimbo-cavern.ts` |
| **B9** | Threaten fails on him until Y-3 is sourced | `threatenChance: 0` on Yojimbo |
| **B10** | It is Chapter IX | `Chapter.number: 9` in `src/data/chapter-yojimbo-cavern.ts` |

Also built on the review's four corrections: Zanmato is `damageType: 'other'`; no flee rides on
`rt.canEscape` (`canEscape: false` on the formation); Doom kills as his **fifth** turn opens (four
more actions; pinned by a test); the gauge pays "+2 % when **attacking**", on every non-Zanmato turn
**including the Daigoro order** (Y-1: not sourced either way; the research's own pseudocode).

Further `[estimate]`s, each labelled where it stands: every row's `rank: 3` (no rank byte in the
research); +3 per targeting **per action, not per hit**; the Cavern build is the Gagazet preset (the
research's named upper bound, §5.2) minus Mighty Guard, White Wind, Talk, two Mega-Potions and the
mountain's 20,000 gil; the opening line-up Lulu / Kimahri / Yuna (INFERRED); no Candle of Life. Ginnem's
and Daigoro's stats the research does not give are 0 and never read.

### What exists now

- **Three additive engine capabilities, FFX only, deterministic, DOM-free:** (1) `ActorRuntime.ordersOnly`,
  a combatant on the field that owns no CTB turn (`turnQueue.ts#queueMembers`); (2) `src/battle/ffx/orders.ts`,
  a row whose `extra.ordersActor` / `extra.orderedAbility` makes another actor act on the orderer's turn,
  with its own stats (hooked at the end of `execute.ts#executeCommand`); (3) Yojimbo's gauge on the
  published state (`combatants.yojimbo.overdrive`, `enemyGaugeRules: 'yojimbo'`), moving through ordinary
  `overdrive-gauge` events with causes `targeted` / `attacking` / `zanmato`, plus `yojimboBand()` and the
  band constants for the widget O-5 will pick.
- **Sourced data:** `src/data/ffx/enemies/yojimbo{,-abilities}.ts`, every number with its research note.
- **Registration, unlisted:** `getChapter('yojimbo-cavern')` and `window.__pyrefly.gotoChapter('yojimbo-cavern')`
  reach it; chapter select shows **no card** (`UNLISTED_CHAPTERS`, `docs/CONTRACT-CHANGES.md`). Scene
  (`gagazet`), music (Chapter 1's cues) and story (battle start + results only) are **placeholders**.
- **Story draft for Bailey:** `docs/plans/yojimbo-story-draft.md`.

### Measured (200 seeds each, `tests/unit/chapters/yojimbo-bench.test.ts`, real engine, Cavern build)

| Line | Wins | Mean turns | Zanmatos per battle | Doom kills |
|---|---:|---:|---:|---:|
| **Intended** (Kimahri's Doom first, Lulu's Fira, Yuna heals and summons in front of Zanmato at ≥80 %) | **200 / 200** | 18.7 | 0.00 | 200 |
| Magic race (the same without Doom) | 139 / 200 (69.5 %) | 110.6 | 0.94 | 0 |
| **Credibly wrong** (everyone swings Attack every turn, Yuna heals, no Doom, no aeon) | **0 / 200** | 52.9 | 0.99 | 0 |

Read with care: the party is the upper bound and the odds are B2's even split. With B8 (Doom learned,
full gauge) the Doom route is a **certain** win, as the sources describe it ("works only for this
encounter"); without Doom the fight is a real race; the swing-at-it habit never survives the first
Zanmato, because 9,999 to the whole party is fatal at every preset HP (research §3.3). Nobody tuned
anything to get these numbers.

### Proof

- FFX Chapters 1, 2, 3, 7 and 8: event logs byte-identical before and after the engine change (sha-256 of
  `state().log`, seeds 1 / 7 / 42 × attack / defend / the shipped `intended` strategy, 45 runs).
- `tests/unit/chapters/yojimbo-engine.test.ts`: 29 mechanic, capability, data, registration and absence
  units. `node tools/orphans.mjs`: 24 orphans before and after, none of them new.
- Browser (own Vite :5520, GPU, NVIDIA RTX 5070 Ti via ANGLE D3D11): the board shows no Yojimbo card;
  `gotoChapter('yojimbo-cavern')` opens the battle with `[ginnem, yojimbo, daigoro]` and the gauge on
  state; a real Enter submits a command; in the live battle Yojimbo's orders made the dog bite (2 orders,
  2 bites, 0 dog turns).

### Found on the way (not this track's files)

- **The FFX-2 Bahamut guide shows up in this FFX fight.** `src/engine/tactics/guide.ts#guideForState`
  picks the first guide whose `bossIds` names **any** combatant on the board, and the party's own aeon
  Bahamut is a combatant, so an FFX chapter without its own guide gets the FFX-2 Bahamut guide
  (a rule 14 leak; seen in the browser). `tacticFor` keys the same way. Chapter IX needs its own guide and
  tactic (T7) before it is listed, and the lookup should match the enemy side and the game.
- Headless `autoBattle` stalls at `play:action-end` right after a party Overdrive, in Chapter VIII too
  (measured with the same script), so it is not Yojimbo's; `gotoChapter` from chapter select leaves the
  title card drawn under the battle HUD in both chapters.
