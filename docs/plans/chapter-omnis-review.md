# Paper preflight: Chapter XII — Seymour Omnis, the Garden of Pain inside Sin (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), modelled on
`docs/plans/chapter-natus-review.md` and the corrections its Review section made.
**Docs only: no code, no browser, no build, no render.** Written 2026-09-24 by a sub-agent of
the driver, after Bailey's words (verbatim): *"I'll go with Seymour Omnis and Trema"* (D-134).

**Verdict: PROCEED on engine, data, AI and story; lock the rules after B8. HOLD everything Bailey
will see or hear until §6's options are picked (rule 9).** The hard problem is making the discs read.

## 1. Game case, sources and lessons carried

**Game case: FFX only.** CTB, aeons, Nul spells, Focus, the FFX status set. Research §0.3:
*X-2* has no Seymour fight. The AI, data and build live under `src/battle/ffx`, `src/data/ffx`.
Registration in `src/data/encounters.ts` and any stage plumbing (`src/engine/PartAnchors.ts`)
are shared, case "both" (CHK-020), and must stay inert for every other scene.

**Read in full:** `research/ffx-seymour-omnis.md` (61f47fee; "§n" = its sections), `docs/plans/chapter-natus-review.md`.
**In part:** the engine files in §4, `dreams-end.ts`, `encounters.ts`, `approved-hashes.json`, THEMES.md §3, two story scripts.

**Brief corrections (research §0.4) stand:** he is fought **inside Sin**, not at Zanarkand
(D-134's note is wrong; not edited here, `decisions.json` is not this track's file); **Total
Annihilation** is Flux's; Omnis has **no Break**, he casts **Dispel**; HP **80,000** (GameFAQs'
60,000 outvoted 4 to 1).

**Natus review lessons applied:** thresholds as the sources say them ("below 20,000"); file:line
checked in the code; line-up, gear, items, callouts, "ship locked" are questions (§5); no sheet
invents a target or odds the engine does not know (O-4).

## 2. The encounter (summary only; the data files cite the research)

| Item | Value | Tag |
|---|---|---|
| Which fight | Omnis + Mortiphasm ×4, Garden of Pain, inside Sin, before Dream's End (Chapter III) | §0.4 `[verified: 4]` |
| Formation | `[seymour_omnis, mortiphasm ×4]`, **no forced party**, cannot flee; ends when Omnis dies | §0, §4.6 `[decompiled]`; end rule `[derived]` |
| Omnis `m131` | HP **80,000** · Overkill 15,000 · **DEF 180 · MDEF 100** · MAG 35 · AGI 40 (7 ticks) · Luck 20 · Armor/Mental Break land · Provoke, Slow, Doom, Delay, Silence, Petrify immune · steal Shining / Supreme Gem | §1 `[decompiled]` + wiki |
| Mortiphasm `m106` ×4 | 1 HP, **immune to all damage**, every status, Scan and Sensor; no turns; out of melee reach (only Wakka, Valefor, Anima, Mindy reach physically) | §2 `[decompiled]`; reach `[verified: 4]` |
| His turn | Four spells, one per disc: the colour facing him; **-ra** if it shows on 1–2 discs, **-ga** on 3–4; one per living member, the fourth random | §4.1 `[verified: 4]` (GameFAQs dissents, O-3) |
| Affinity | Per element: 1 disc half, 2 immune, 3 absorb, 4 absorb **and** the opposite weak; Holy never touched | §4.2 `[verified: 5]` |
| Opening | All four Fire → four Firaga, weak to Ice | §4.1 `[verified: 3]` |
| Turning | Physical hit on a disc: 90° left; magic: 90° right; the disc takes no damage | §4.3 `[verified: 6]` |
| Counter | **6** attacks on Omnis (**3** below 20,000 HP) → glows red → **Dispel** on the party (DEF → 100) → **Ultima** 6:240, DC 64, type Other (DEF → 150) → all four discs reset to the next element | §4.4 `[verified: 4–5]`; DEF values `[single source: wiki]` |
| Aeons | **No Banish**; Ifrit / Ixion / Shiva absorb their element; Shield cuts Ultima | §4.5 `[verified: 3]` |
| Talk | **None** | §4.6 `[verified: 2]` |
| **Unsourced** | **O-7 the colour order around a disc** and **O-11 the reset cycle** (block the lock); O-4 spell-to-member mapping; O-8 which spells turn a disc; O-9 whether disc hits count; O-10 reset timing; O-12 DEF writes vs Armor Break; O-2 Threaten; O-5 Thunder ↔ Water | §10 |

**The design fact (§3.3, `[derived]`):** a fresh Omnis shrugs off everything (a 40-STR attacker
does 297); Armor Break and Mental Break turn that into 2,000–3,000 a hit; the danger is four -ga
in one turn (about 4,200 on one member on turn one) and Ultima (about 3,500 at MDEF 25). **The
thesis:** read the discs, turn them, Nul what is left, break him, burst the Dispel window,
survive Ultima. Every guide calls him the weakest Seymour; that is not licence to tune him (rule 6).

## 3. The party and builds

- **Build point:** the Garden of Pain, one Save Sphere before Chapter III's Dream's End. New
  `src/data/ffx/builds/garden-of-pain.ts`, **derived from `dreams-end.ts`** (research §6.2: same
  dungeon, "reuse the BFA preset"); every stat cell `[estimate]`, as that file labels its own.
- **Abilities:** `dreams-end.ts` already grants Yuna the four Nul spells (lines 217–220) and
  Lulu Focus (line 308), so the research's "add Nul and Focus" is **already true**: no change.
- **Gear:** remove anything sourced to the City of Dying Dreams or the Nucleus (research §6.2:
  they come after Omnis; T4 checks each row); the Sea of Sorrow's **Phantom Ring** (Fire,
  Lightning, Water Eater) on Yuna is sourced but is a **difficulty lever**: **B6**.
- **Line-up B2** (Chapter III's `activeSlots` are forced for BFA; this formation forces nothing).
  **Wakka** is the only member who can turn a disc left (§2). **Aeons B3**; gauges **B4**; items **B7**.

## 4. Engine capabilities, found by reading the engine

### 4.1 Already there: data only, no engine change

| # | Need | Where it is |
|---:|---|---|
| 1 | Damage-immune combatants (the discs take 0) | `common/types.ts` `ImmunityFlag` `'immune-to-damage'`; `formulas.ts:267` `blockedByImmunity` |
| 2 | Victory when Omnis dies, discs ignored | `engine.ts:402` victory filters out `flags.isPart`; discs registered as parts |
| 3 | Discs with no turn of their own | `yojimbo-rules.ts:174` `rt.ordersOnly` (Chapter IX's passive combatant), read by `turnQueue.ts` |
| 4 | Affinity is a live, per-battle map, read at resolve time | `setup.ts:184` copies it per battle; `elements.ts:35` reads `target.affinities[e]` on every hit |
| 5 | Dispel's exact list: the four Breaks, Shell, Protect, Reflect, four Nuls, Regen, Haste, Curse | `statuses.ts:78` `DISPEL_REMOVES`, matches research §3.1 row 3:61 |
| 6 | Ultima type Other: Shell does not apply, Focus stacks do, Shield quarters it | `formulas.ts:320` (Shell only for `'magical'`), `:143` (Focus for the `magic` formula), `:301` (Shield, any type) |
| 7 | Armor Break and Mental Break set the defence term to 0 by status, whatever the stat says | `formulas.ts:116, 121`: so a scripted DEF write never overrides a Break (O-12's estimate holds by construction) |
| 8 | Reflect bounce of his -ra / -ga; Dispel and Ultima not reflectable | `abilities.ts:148` `bouncesOffReflect`, flag per row |
| 9 | Nul charges, Eater armour, element-strike weapons healing him | `statuses.ts` `consumeNulCharges`; `equipment.ts:264` (`fire-eater` …); `elements.ts` `resolveElements` |
| 10 | Stored fight state across turns | `ctx.state.flags` keys, as `seymour-natus-rules.ts` `NATUS_PHASE` (Chapter X's stored phase) |
| 11 | A counter that runs on the enemy's own reflected spells | `reactions.ts` `natusActionCounters` runs **above** the player-side guard (Chapter X, B8 precedent) |
| 12 | Aeon absorb affinities; no Banish | aeon data; Banish fires only from a row that carries it (`abilities.ts:336`, `scripted.ts:98`), and Omnis's rows have none |
| 13 | Threaten immune, Delay / bribe / life / percentage immune, no flee | `ImmunityFlag`, `rt.canEscape` false by default |
| 14 | Figure-less parts pinned to a parent painting (cursor, numbers, ring) | `src/engine/PartAnchors.ts` (Vegnagun's parts; both games, inert elsewhere) |
| 15 | A registered but unlisted chapter | `chapters-unlisted.ts:28` `UNLISTED_CHAPTERS` |

### 4.2 The real gaps (FFX only unless marked)

- **O-G1: a hit on a disc is invisible today.** `counter-inputs.ts:36` adds a target only for
  `damage` with `amount > 0`; a disc's damage is 0 (`formulas.ts:267`), and `abilities.ts` skips
  the HP path when the amount is 0. The turn needs a **"hit landed" set** (resolved, not missed),
  with the direction from `def.damageType` (physical left, magic right). Additive field on
  `CounterInputs`; every other battle byte-identical.
- **O-G2: per-target reach.** `targeting.ts:63` `reachesFoesAtRange` is keyed on the airship's
  `airship.range` flag and filters the **whole** foe list; the discs need a per-target "out of
  melee reach" rule: physical reaches only with `rangedWeapon` (`state.ts:126`, Wakka) or the
  listed aeons. Evrae's chapter must stay byte-identical.
- **O-G3: four spells in one turn.** `AiScript` returns one `Command` (`ai/types.ts:29`).
  Doublecast (`doublecast.ts`) resolves two rows in one party action; ordered actions
  (`orders.ts`) make **another** actor act with **its own** stats, and a disc's Magic is 1, so it
  is the wrong seam. Need an enemy **volley**: one turn, rank 3, up to four rows with their own
  elements and targets, cast with Omnis's MAG 35; the KO rule (2–3 casts) from research §4.1.
- **O-G4: affinity changes need an event.** Writing the map is data (#4 above), but nothing tells
  the presenter, the Sensor panel or the HUD. Additive `BattleEvent` (for example
  `'affinity-change'`), a contract entry. The two-Water bug (B9) sits behind one constant here.
- **O-G5: the attack counter and the states** (normal → red → dispelled → reset), stored as #10;
  counts counters and reflected spells (#11); threshold **below** 20,000; disc hits per B11.
- **O-G6: scripted DEF writes** 180 → 100 → 150. No AI writes a stat today (only `setup.ts:247`
  and the form-change path). Small; #7 settles the Armor Break interplay.
- **O-G7: random-target actions never pick a disc** (Slice & Dice, Attack Reels, research §2,
  `[single source]`). `targeting.ts:120/172` `random-enemy` draws from every targetable foe;
  needs an exclusion flag. What an **all-enemies** spell does to the discs is unsourced (B10).
- **O-G8: presentation (both, inert elsewhere):** a disc that visibly turns 90° with the facing
  colour lit; the red glow; the reset. Part anchors (#14) place the discs; the turn is new.
- **O-G9: guide and tactic.** Own guide in `src/data/guides/` and tactic in
  `src/engine/tactics/`; the advisor must know it can aim at a disc and why (T7).

**Not needed:** a new `Side`, damage type or form system; Talk; Banish. **Contracts:** `encounters.ts`
(`number` 1..12, new `ChapterId`), `ids.ts`, `common/types.ts` (O-G4 event, O-G2 / O-G7 flag); one entry.

## 5. Bailey's calls: one line each, with a recommendation

| # | Question | Options | Recommendation |
|---|---|---|---|
| **B1** | Title, number, location | "Seymour Omnis" / "The Garden of Pain" / "Omnis"; number by registration order (D-058) | **"Seymour Omnis"**, **XII** if registered before Trema; location "Inside Sin — the Garden of Pain" |
| **B2** | Opening line-up (nothing is forced) | a) Tidus, Yuna, Auron, as Chapter III / b) Tidus, Yuna, **Wakka** (the disc-turner up front) / c) the player picks at prep | **a**, every switch legal from turn one; finding Wakka is part of the puzzle and the guide says so |
| **B3** | Optional aeons | a) the five story aeons, as Chapter III / b) plus **Anima** (a story line; she reaches the discs) / c) plus Anima, Yojimbo, the Magus Sisters | **a**; b only if Bailey wants the Anima line (needs FFX Anima art) |
| **B4** | Aeon gauges at the start | a) as `dreams-end.ts` / b) empty / c) full | **a**, `[estimate]` as that file labels it |
| **B5** | Party stats | a) Chapter III's cells as they are / b) anything else | **a** (research §6.2: same dungeon) |
| **B6** | Gear | a) Chapter III's gear, less anything found after Omnis, **plus the Phantom Ring** on Yuna (sourced, in the Sea of Sorrow just before) / b) the same without the ring / c) Chapter III's gear unchanged | **a**; the ring eats three of his four elements, so it is a difficulty decision and yours |
| **B7** | Items | a) Chapter III's inventory, each row checked against where it is found / b) a trimmed kit | **a** |
| **B8** | **The two blocking unknowns**: the colour order around a disc (O-7) and the reset cycle (O-11) | a) Bailey confirms both from his own memory or a video he watches / b) build GameFAQs' cycle Fire → Water → Ice → Thunder and a ring order labelled "our estimate", and list the chapter only once confirmed | **b, then a** before the chapter is listed; no download (rule 11) |
| **B9** | The two-Water bug (two Water discs make him immune to **Fire**, not Water; `[single source]`) | faithful / fixed | **faithful**, one constant, disclosed in the guide's notes |
| **B10** | What turns a disc | a) damaging magic only, one disc / b) any spell, Nul and Haste included / c) a) plus all-enemies spells turning all four | **a**, `[estimate]` (the sources mean offensive spells) |
| **B11** | Do hits on the discs count toward the 6 / 3 | no / yes | **no**, `[estimate]` (the sources say "attacks on Seymour") |
| **B12** | Which disc's spell hits whom | a) discs left to right onto living members in slot order, the fourth random / b) all random | **a**, labelled estimate |
| **B13** | Threaten on Omnis (byte 0, wiki immune) | immune until checked / landable | **immune** (Natus B10 precedent) |
| **B14** | Show the attack counter? | a) the red glow only, as the game / b) glow plus a "3 of 6" pip read-out / c) glow plus an intent line ("Dispel, then Ultima") | **decide in O-4**; leaning **c**, faithful core with a readable surface |
| **B15** | Mid-battle callouts | the turn-one disc lesson, the first glow, before Dispel, before Ultima, the reset, below 20,000, the Anima line if B3 = b | **in**, drafted in a story draft Bailey reads first |
| **B16** | How the dive into Sin is told; stage the airship fight? | a) one line of narration, no airship battle / b) stage Sin's outer body | **a** (separate fights, research O-15) |
| **B17** | Seymour's face in dialogue | a) the approved Natus portrait / b) the approved Macalania (human) portrait / c) a new Omnis portrait (O-5) | **c** if O-5 lands; otherwise **b** |
| **B18** | Music | a) a new original cue that spends `SEYMOUR_UNMOORED` as his last statement / b) reuse Chapter I's `boss-seymour` | **a**, b as stand-in; if Chapter X's cue also claims the motif, the Omnis cue should have it |
| **B19** | Painted party and aeons shipping without a verdict (Wakka, Kimahri, Lulu, Rikku, Valefor, Ifrit, Ixion, Bahamut) | a) use them as Chapters I, VII, VIII, X / b) hold for a verdict | **a**; Wakka is on screen more here than anywhere |
| **B20** | If the art picks are late | ship registered and **LOCKED** / hold the release | **LOCKED** (D-069), said to Bailey before the cut |
| **B21** | The arena | a) a new Garden of Pain plate (O-3) / b) reuse Chapter III's Dream's End diorama | **a**; a different place (research §7) |

## 6. Assets, and the options rounds that come first

### 6.1 Inventory (`approved-hashes.json` checked; `public/art` listed)

| Asset | State | Notes |
|---|---|---|
| **Seymour Omnis billboard** | **NEW** | None anywhere. Not a variant of Natus or Flux. Sourced look: hovers before four discs, translucent (LP, single), glows red before Dispel / Ultima |
| **Mortiphasm discs** ×4 | **NEW** | Four coloured sections each: orange Fire, purple Ice, blue Water, yellow Thunder (§4.1 `[verified: 3]`). Gameplay, not decoration |
| **Backdrop: the Garden of Pain** | **NEW** | Steps up to a platform; the Sea of Sorrow's red-tinged sea, waterfalls, Yevon symbols; "the staves" undescribed (research §7). Dream's End (`scene:dreams-end`, approved) is **not** reused |
| Party: Tidus, Yuna, Auron | **approved** (`cast:*`) | Serve as is |
| Party: Wakka, Kimahri, Lulu, Rikku; aeons Valefor, Ifrit, Ixion, Bahamut | ship, **no verdict** | B19; Shiva **approved** |
| Speaker portraits: `portraits:ffx-party`; `seymour-macalania`, `seymour-natus` | **approved** | B17 |
| Pause plate `pause/seymour.png` | **approved** | Can be the chapter's Seymour plate |
| Omnis portrait; chapter card, hero plate, pause chapter plate, thumbnail | **NEW** | Derived from the O-1 and O-3 picks |
| VFX: Dispel, Ultima, the four -ra / -ga, the disc turn, the red glow, the sending | check | Spells and Dispel ship (Chapters I, III); the turn and the glow are new; T5 checks what each draws before assuming |
| **Music: `boss-seymour-omnis`** | **NEW** | THEMES.md §3 "Noble Rot" is the family |

### 6.2 Options rounds: six, cheap and broad; a pick approves only what Bailey names

Method (`art-method-r3/METHOD-CHECK.md`): references first (rule 6), original output (rule 8), a 1:1
pilot first; only Seymour's face and hair may derive from approved pixels, if O-1 shows it reads.

- **O-2 first: the discs at game size**, because readability decides the rest. Three treatments
  at 1600×900 **and** 390 px: (a) painted discs behind him, the facing section lit; (b) the same
  plus a HUD strip of four chips (facing colour) and his affinity row; (c) Ink & Gold rings drawn
  as 3D meshes that physically turn. Each with a four-frame storyboard of one 90° turn. The ring
  order shown is **our estimate** until B8, and says so on the sheet.
- **O-1 Seymour Omnis:** 3 concepts at battle scale beside a party idle and O-2's discs:
  (a) house style, (b) face from the approved portrait, (c) translucent, pyrefly-lit; each with the red-glow state.
- **O-3 The Garden of Pain:** 3 plates contrasting light (red sea at dusk, pale noon, deep
  violet), the steps and platform, waterfalls behind.
- **O-4 Reading the fight** (B14): mockups at both sizes of (i) the turn-one lesson (four
  Firaga, weak to Ice), (ii) the glow and the Dispel → Ultima telegraph, (iii) a turned disc and
  his affinity updating. **No chip names a spell's target** (the mapping is B12, an estimate);
  no FLEE; no Chapter VII leftovers (the Natus review's findings).
- **O-5 Omnis portrait:** 2 options, only if B17 = c.
- **O-6 Music:** 2 sketches on `docs/audio/audition.html` (rule 13). Brief: the Noble Rot motif
  at its last statement, courtesy become appetite. Anti-brief: no quotation or imitation of
  "Fight With Seymour" or any original cue (rule 8).

## 7. Story beats (research §8.2, paraphrased; our own words, writing-bible voice)

T6 adds the next free E-tag. Seymour long, courteous, "Lady Yuna", death as mercy (§1.9); Wakka
blunt. **Must not repeat** Chapter I's "Spira's sorrow is patient" (`seymour-flux.ts:169`): they rhyme.

- **Pre (B16 = a):** (1) one narration line: the dive into Sin, the Sea of Sorrow. (2) Seymour at
  the top of the steps: Sin chose him; with Yunalesca gone, nothing can end Sin now. (3) Tidus:
  we can. (4) Seymour: your death is your father's life. `battleStart()`.
- **Mid (B15):** the turn-one disc lesson; the first glow; lines before Dispel and before Ultima;
  the Anima line if B3 = b.
- **Post:** he kneels; Wakka tells Yuna to send him; **she sends him**, the pay-off of all four
  Seymour chapters, staged as that; his last words that sorrow outlives him; Tidus: Sin is next,
  pointing at Chapter III. `results()`.

## 8. Tracks and order of work

| Track | Files (single owner) | Depends on | Size (agent hours, `[estimate]`) | Model |
|---|---|---|---:|---|
| Integrator | `encounters.ts`, `ids.ts`, chapter meta, registries, `CONTRACT-CHANGES.md`, `targets.json` | first and last | 1.0 | opus |
| T1 engine seams O-G1, O-G2, O-G3, O-G4, O-G7 | `counter-inputs.ts`, `targeting.ts`, a new `volley.ts`, `common/types.ts` | ids | 2.5 | opus |
| T2 enemy data | `src/data/ffx/enemies/seymour-omnis{,-abilities}.ts` | ids | 0.75 | sonnet |
| T3 AI script O-G5, O-G6 | `src/battle/ffx/ai/seymour-omnis{,-rules}.ts`, registration | T1, T2, B8–B12 | 1.5 | opus |
| T4 party build | `src/data/ffx/builds/garden-of-pain.ts` | B2–B7 | 0.5 | sonnet |
| T5 scene + disc stage (O-G8) | `src/scenes/garden-of-pain-*.ts`, a disc actor beside `PartAnchors.ts` | O-1…O-3 picks | 2.0 | sonnet |
| T6 story + E-tag | `docs/plans/omnis-story-draft.md` first, then `src/story/scripts/seymour-omnis.ts`, `writing-bible.md` | B15–B17 | 1.0 | sonnet |
| T7 guide + tactic (O-G9) | `src/data/guides/seymour-omnis.ts`, `src/engine/tactics/seymour-omnis.ts` | T2, T3 | 1.25 | opus |
| T8 HUD disc read | `src/ui/ffx/` (required here: the discs must read) | O-2, O-4 picks | 1.0 | sonnet |
| T9 audio | `src/audio/tracks/boss-seymour-omnis.ts`, THEMES.md row | O-6 pick | 1.0 | sonnet |
| T10 tests + measure | `tests/unit/chapters/omnis-*.test.ts`, 200-seed bench | T1–T4, T7 | 1.5 | sonnet / opus |
| **Total** | | | **~14 agent hours**, plus judging and the review | |

**GPU `[estimate]`:** options ~60 min; finals (Omnis, disc sheet, backdrop, portrait) ~100 min; **~2¾ h** with rerolls.

**Order.** NOW: Bailey answers B1–B21 on one sheet; O-2 first, then O-1, O-3…O-6; T1, T2, T4 and
the T6 draft (nothing perceivable). THEN: B8 → T3 → T7 → T10 (200 seeds); on the picks, art finals →
T5, T8, T9, T6 script. LAST: wiring commit, `node tools/orphans.mjs`, real-input win and loss,
screenshots, focused review → deploy → live check → deep review on live.

## 9. Acceptance cases (T10)

- **Mechanic units, one per research row:** opening four Firaga, weak to Ice; the -ra / -ga
  tier by count; the affinity ladder half / immune / absorb / absorb + weak; Holy untouched; a
  physical hit from Wakka turns a disc left, a Firaga right, Tidus cannot reach a disc, Slice &
  Dice never picks one; a disc takes 0 and never dies; 6 attacks then glow, 3 below 20,000, a
  reflected spell counts; Dispel strips the exact list; DEF 100 then 150, Armor Break still 0;
  Ultima ignores Shell, respects Focus and Shield, not reflectable; reset to the next element;
  2–3 casts with KO'd members; no Banish; absorbing aeons healed; the two-Water constant both ways.
- **Absence (rule 14, CHK-021):** Chapters 1–3, 7–11 byte-identical at fixed seeds; FFX-2 untouched.
- **Measure, never tune:** each §5 line of research (Break first, scramble, Nul, Phantom Ring,
  the weakness, the Dispel burst, absorbing aeons, Auto-Reflect, Hastega) and a credibly wrong one
  (Firaga into a Fire-absorbing Omnis), plus the advisor's top row. If a line is unwinnable,
  bring Bailey measured options; **never weaken or strengthen the boss**.
- **Real input:** select → prep → pre → win and loss → results; a disc aimed by mouse and keys;
  screenshots `docs/screenshots/chapters/omnis-*`, desktop and 390 px.

## 10. Review, risks, verdict

`critic-plan --paths` (encounters, reactions, targeting, PartAnchors), run for this plan: **DEEP**:
focused before deploy, deep after on live. Not save-data class unless `ChapterId` needs a migration.

| # | Risk | Mitigation |
|---:|---|---|
| R1 | O-G1 and O-G3 touch every FFX battle's action path | additive fields, byte-identical event logs for Chapters 1–3, 7–11 at fixed seeds |
| R2 | The discs do not read at phone width, and the fight becomes guesswork | O-2 goes first; T8 is required, not optional; real-input check at 390 px |
| R3 | O-7 / O-11 turn out different from the estimates after the art and guide name them | B8: the ring order lives in one constant, the guide prints "our estimate" until confirmed; listing waits |
| R4 | The Phantom Ring or the Nul spells make the fight trivial | measured (T10), reported, never tuned (B6 is Bailey's) |
| R5 | A new billboard, four discs and a backdrop miss the release | B20 (LOCKED) |
| R6 | Scope creep into the airship battle, the Sea of Sorrow, Anima | B16 = a, B3 = a |
| R7 | Copyright pull toward "Fight With Seymour" and the original lines | original cue and lines; the audition page and the draft say so |

**Verdict: PROCEED.** Fifteen needs already work (§4.1); new: the hit-landed set, per-target reach,
the volley, the affinity event, the disc stage. Nothing perceivable before B1–B21 and O-1…O-6.
