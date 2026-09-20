# Critic round 03 — Pyrefly Reprise

**Build under review:** main `9a56d80540663b261fcf1c9b8d30ea8175cdef02` (records the live deploy of
`7191674d9f405d4e830d780e527a89f58d8019b1`; the two commits differ only by `critic/pending/7191674.json`).
**Bundle:** `assets/index-hko3Xov1.js`. Verified served from <https://baileypillon.github.io/pyrefly-reprise/>
independently by the chief critic (`fetch` of the live index at round time) and by every category auditor.
`__pyrefly.version` 0.1.0, ready in 335–602 ms, **0 console errors, 0 responses ≥ 400** across every run.
**Browser mode:** `PYREFLY_BROWSER=gpu` for every browser run in this round (renderer reported in-page as
`ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)`). No auditor
needed the SwiftShader fallback; no black or blank canvas was seen.
**Round date:** 2026-09-19. **Evidence:** `critic/rounds/round-03/`. **Previous round:** `critic/rounds/round-02.md`.

---

## Headline

| Part | Weighted total | Round 02 | Gate |
|---|---:|---:|---:|
| **A — fidelity and craft** | **6.4** | 5.6 | 9.6 |
| **B — game design coverage** | **4.1** | 3.5 | 9.6 |
| **C — fidelity to the approved end state** | **5.8** | 5.3 | 9.6 |
| **HEADLINE (lowest)** | **4.1** | 3.5 | **not met** |

**Part C coverage: 50 approved / 0 awaiting a verdict / 9 with no target / 2 rejected.** Nine tiles have no
target at all, so the gate fails on coverage as well as on all three numbers.

### What stands between this build and 9.6, in one paragraph

Three things, in order. **First, nobody is taught anything and two panels lie.** There is no tutorial, no
how-to-play, no glossary, no controls screen and no remapping anywhere in the shipped bundle; the title
screen advertises three controls and honours one; the single-target Haste spell tells the player it hits the
whole party; and the party row shows a dead character alive at 711/1500 for 2.1 seconds after the engine
kills her. That is the 8.0 Part B cap and the two lowest scores on the board (onboarding 2.8, clarity 3.9),
and it is why Part B is the headline. **Second, the engine has two status bugs that hand the player a win
button and can remove a combatant from the fight for good**: `canAct()` is used both as "may act" and as "is
in the turn queue", so Threaten and Sleep delete their target from the CTB queue with no path back —
measured as *zero enemy turns in 120+ turns* after Threaten lands on Yunalesca. Meanwhile Chapter 1 wins only
17 of 30 (and 26 of 40) seeds with the game's own intended tactics while Chapter 4 wins 40 of 40: the
difficulty curve runs backwards. **Third, the build is a long way from what Bailey approved.** The pause
screen is a near-pixel match and every one of the 94 files behind the 16 approved art sets hashes clean —
real, creditable work — but the battle HUD the player stares at for forty minutes has grown three advisor
slabs, a FLEE row and count chips the approved mockup does not show, buries Yuna to 25% visible, and none of
the twelve polish moments Bailey picked exist at all. Fix the teaching layer and the two panels that lie,
then the two `canAct` bugs, and the headline moves further than anything else on this list.

---

## Part A — fidelity and craft: **6.37 → 6.4**

| Category | Weight | Score | Round 02 | Contribution |
|---|---:|---:|---:|---:|
| Combat fidelity | 25 | 7.4 | 5.8 | 185.0 |
| Encounter fidelity | 15 | 5.8 | 7.4 | 87.0 |
| Fun and pacing | 15 | 6.3 | 6.4 | 94.5 |
| Character and visual fidelity | 15 | 4.2 | 4.3 | 63.0 |
| Scene fidelity and beauty | 10 | 7.0 | 6.2 | 70.0 |
| Writing and story | 10 | 7.5 | 5.2 | 75.0 |
| UI fidelity and polish | 5 | 5.0 | 3.4 | 25.0 |
| Stability and performance | 5 | 7.5 | 2.8 | 37.5 |
| **Total** | **100** | | | **637.0 / 100 = 6.37** |

**Combat 7.4, encounter 5.8, fun 6.3, character/visual 4.2** are the category auditors' scores, accepted as
delivered. The other four are scored here by the chief critic from this round's own artifacts, justified below.

**Scene fidelity and beauty — 7.0** (was 6.2). Up for two reasons that are both measured, not impressions.
(a) Round 02's worst scene defect is fixed: both Yu Pagodas are now visible and separately identifiable
beside Braska's Final Aeon (`critic/rounds/round-03/shots/x-battle-ch3.png`), so CHK-011 passes for that
formation. (b) I hash-checked all 94 files behind the 16 approved art sets in
`docs/target/approved-hashes.json`: **94 match, 0 changed, 0 missing** — the Zanarkand grey-hall incident
has not recurred and no approved painting was regenerated. Held back by: the camera framing in real play is
pushed far closer than the approved arena shot, so in Chapter 3 the three party members fill the middle of
the frame and Braska's Final Aeon sits half-hidden behind Auron at the right edge
(`critic/rounds/round-03/part-c/fight-pagoda.jpg`); three Yunalesca paintings ship with an opaque white
studio background that the loader mattes at runtime and warns about on the live console (issue #31); and the
Zanarkand Dome plate is still an open-air lavender colonnade rather than the sealed hall (issue #41 — raised
as a **question for Bailey**, not an action, because that painting is approved and approved paintings are not
replaced on an agent's say-so).

**Writing and story — 7.5** (was 5.2). Round 02's blocker is fixed. The five chapters now deliver their post
scenes and results: `w5-yunalesca.json` records `battle → cutscene (205.7 s) → results (206.0 s) →
cutscene (207.8 s)`, and the same shape in Chapter 5. `analyse.mjs` reports pre/post line counts of 26/28,
34/20, 19/18, 12/12, 22/21 with **zero** lint issues, no missing or unreachable mid-scripts, and no verbatim
transcript lifting (the 5.0 legal cap is not triggered). The prose itself is good and in voice. Docked
because the delivery is poor in ways that belong to the words' presentation: **eight speakers have no
portrait at all** — `braska`, `yu-yevon`, `fayth-boy`, `young-auron`, `yuna-x2`, `rikku-x2`, `paine`,
`shuyin` all return 404 on the live site (`w3-portraits.json`), so every line in both FFX-2 chapters and
Braska's, the fayth boy's and young Auron's lines in FFX play against an empty plate; and those FFX-2 plates
print the internal id ("Rikku X2").

**UI fidelity and polish — 5.0** (was 3.4). Genuine gains: the pause screen is the best-executed screen in
the game and matches its approved target almost exactly (`part-c/pause-2000.jpg`); CTB names print in full;
the Overdrive gauge carries a label and a READY state with its own command row; Esc opens the full-bleed
pause from battle and from inside targeting. Against: the battle HUD does not match the approved mockup
(#27), the battle-start and results rosters draw monogram letter tiles over portraits that exist (#20), the
strategy guide clips mid-word and prints its own "▾ MORE" chip on top of the clipped line, the enemy-intent
panel truncates with no affordance, no controls hint is mounted on either battle HUD, the PAUSE chip stays a
fixed 12 px all the way to 3840×2160 (the owner's 2026-09-18 complaint, unfixed), and effective type falls
below the 14 px floor across the HUD at the two commonest window sizes.

**Stability and performance — 7.5** (was 2.8). The largest single improvement in the round. Round 02's
"chapter is won and never ends" is gone: all five chapters were played to VICTORY on the live site this round
(Ch1 74 turns/12 s, Ch2 194 turns/20 s, Ch3 7 links/45 s, Ch4 77 turns/58 s, Ch5 5 links/381 s). 0 console
errors and 0 responses ≥ 400 across every run, boot 335–602 ms, 60.2 fps sustained at 1280×720, heap flat at
11.3 MB across a full chapter, save survives reload. Docked for the Yu Yevon stalemate that terminates a
battle with a bogus `escape` outcome in a formation flagged `canEscape: false` (#14), and for the presenter
running 2.1–4.5 s behind engine state (#9), which is a correctness problem as much as a feel one.

### Part A caps — what applied and why

| Cap | Ruling | Why |
|---|---|---|
| **8.0** — placeholder sprite / missing form / missing scene | **TRIGGERED** (non-binding at 6.37) | `portraits/paine.png` returns **404** on the live site and Paine's face renders as an ink "P" monogram in both FFX-2 party-prep surfaces (`z-paine-card.png`, `z-paine-monogram.png`), confirmed independently by the portrait HTTP probe (`w3-portraits.json`) and the DOM audit (`.prep__face` with `imgs: []`). Seven further speaker portraits 404 the same way. |
| **6.0** — a chapter cannot be finished | **NOT triggered.** Chief critic's ruling. | All five chapters reached VICTORY on the live build with the intended tactics, and headlessly at 17/30, 29/30, 29/30, 15/15, 15/15. The encounter auditor asked me to rule on the Yu Yevon `escape` terminus: it occurs only on deliberately-wrong attack-only or defend-only lines, so it is a blocker **issue** (#14) and not an unfinishable chapter. I am not softening this because a fix is planned — it genuinely does not meet the cap's wording. |
| **5.0** — ripped asset or verbatim transcript | **NOT triggered.** | `analyse.mjs` found no verbatim lifting in any of the five scripts; no retail asset was found in `public/art/` or the shipped bundle. |

---

## Part B — game design coverage: **4.09 → 4.1**

| Category | Weight | Score | Round 02 | Contribution |
|---|---:|---:|---:|---:|
| Audio and music | 15 | 6.0 | 2.0 | 90.0 |
| Game feel and feedback | 12 | 5.8 | 3.6 | 69.6 |
| Clarity and information design | 12 | 3.9 | 2.9 | 46.8 |
| Onboarding and teachability | 10 | 2.8 | 1.5 | 28.0 |
| Accessibility and options | 8 | 2.6 | 2.1 | 20.8 |
| Controls and platforms | 8 | 4.2 | 3.6 | 33.6 |
| Difficulty and balance | 8 | 3.2 | 4.4 | 25.6 |
| Replayability, retention and sharing | 10 | 3.6 | 3.3 | 36.0 |
| Progression, preparation and rewards | 7 | 3.0 | 3.8 | 21.0 |
| Narrative presentation and direction | 5 | 3.2 | 2.6 | 16.0 |
| Cohesion and identity | 5 | 4.4 | 4.0 | 22.0 |
| **Total** | **100** | | | **409.4 / 100 = 4.09** |

Audio, game feel, clarity and onboarding are the Part B auditors' delivered scores. The other seven are
scored here by the chief critic from this round's artifacts and from the auditors' own issue evidence:

- **Accessibility 2.6.** No control remapping exists anywhere (`Input.ts` KEY_MAP/PAD_MAP are module
  constants with no setter); no text-size option and type under the 14 px floor at 1280×720, 1600×900 and
  390×844; saved audio settings are never applied at load, so a player who mutes the game gets full volume
  back next visit; the OPTIONS panel prints a master volume the mixer is not using; OPTIONS cannot be reached
  at all until a chapter and its 43-second cutscene have been started. Credit for three separate volume
  sliders that are genuinely wired to the mixer's gain nodes, a text-speed setting, and pause anywhere in battle.
- **Controls and platforms 4.2.** Keyboard, mouse and gamepad all drive the game to a confirmed target
  (`part-b-controls/screens/kb-*`, `mouse-*`, `pad-*`); first load on the live URL is 335–602 ms with zero
  errors; 16:9, 2:1, 21:9 and 4K all render. Against: at 390×844 with touch the smallest rendered text is
  3.9 px and the ATTACK row is 95.6 × 14.1 CSS px — untappable and illegible; the title screen advertises
  "ARROWS / WASD MOVE · ENTER CONFIRM · ESC CANCEL" and honours only Enter; no browser other than Chromium
  was exercised this round, so Firefox and Safari are unmeasured rather than passing.
- **Difficulty and balance 3.2** (down from 4.4). The curve runs backwards — Chapter 1 65%, Chapter 4 100%
  over 40 seeds with the shipped intended tactics — Chapter 1's signature mechanic has literally zero player
  turns of counter-play in 47 of 47 observed kills while the game's own objectives panel instructs the player
  to react to it, and the Threaten and Sleep bugs are exactly the "dominant degenerate tactic canon did not
  have" this category exists to catch.
- **Replayability, retention and sharing 3.6.** A BEST time per chapter is recorded and shown on both the
  results card and chapter select, and saves survive reload — that is a real hook. Against: nothing to chase
  beyond the first clear, no variety between runs (the AI is the same script every time), a single session is
  15–77 minutes with no checkpoint so it does not fit a short break, all earned progression is discarded
  (#22, #23), and the live page ships **no `og:` or `twitter:` metadata at all** — I fetched the live index:
  the only meta tags are charset, viewport, color-scheme and a description. A shared link previews as bare text.
- **Progression 3.0** (down from 3.8). Every reward surface in the game reports growth that the next screen
  denies, and the two surfaces that name the next ability disagree with each other.
- **Narrative presentation 3.2.** Post scenes now reach the player (a real gain), but 97 authored camera and
  staging beats are dropped on the floor, eight speakers have no portrait, and the cutscene is a static
  wallpaper with a text box for 43 seconds.
- **Cohesion 4.4.** Ink & Gold is genuinely one authored system across title, chapter select, prep and pause.
  Against: "Rikku X2" on the name plate, developer vocabulary on the glass (`SCRIPTED`, `CTB`, `S.LV 180`,
  "stacks multiplicatively with Magic Break down to ×0.083"), letter-tile faces on the battle-start and
  results rosters, chapter-select cards that are five flat black rectangles for seconds with no designed
  loading state, and a live page description that calls the game **"an unofficial HD-2D fan tribute"** — the
  direction Bailey rejected.

### Part B caps

| Cap | Ruling | Why |
|---|---|---|
| **8.0** — a panel gives the player wrong information | **TRIGGERED** (non-binding at 4.09) | Two independent proofs on the live build. (a) `src/engine/tactics/advisor.ts:441` — I read the line myself: `def.targeting.startsWith('all-all') \|\| heals ? 'Speeds the party's turns up' : …`. With the cursor on single-target HASTE (8 MP) the description bar reads "Speeds the party's turns up" and the next confirm targets one ally. (b) The party status row reports "Yuna 711 /1500" in living colours for 2145 ms after the engine logs her `ko` event (`ko2.json`, sampled every 200 ms). |
| **5.0** — audio the owner rejected | **NOT triggered.** | The owner's only recorded verdict (2026-09-19) is "Right direction, keep refining" — not a rejection. |
| **Audio ≤ 6.0** — no owner numeric score | **APPLIED.** | `docs/audio/OWNER-VERDICT.md` records a direction check, not a score, and the `audio` board tile is unscored in Part C for the same reason. The technical side would have scored higher: all 21 cues at −16.0 ± 0.2 LUFS, true peaks −1.1 to −2.9 dBTP, every loop seam ok, boss-cue routing fixed. |

---

## Part C — fidelity to the approved end state: **5.83 → 5.8**

| Category (board group) | Weight | Score | Contribution | Evidence |
|---|---:|---:|---:|---|
| Presentation | 30 | 5.5 | 165.0 | `part-c/presentation-battle.jpg`, `shots/ch1-seymour-flux-menu.png` |
| Scenes | 15 | 7.5 | 112.5 | sha256 of `zanarkand-dome.png` matches its tile; 94/94 approved files hash clean |
| Cast, bosses and aeons | 15 | 5.8 | 87.0 | hash pass + `character-visual/audit2-1600.json`, `w3-portraits.json` |
| How a fight plays | 15 | 4.5 | 67.5 | `part-c/fight-pagoda.jpg` |
| Pause screen | 5 | 9.0 | 45.0 | `part-c/pause-2000.jpg` |
| Phone layout | 5 | 8.5 | 42.5 | `part-c/phone-pause.jpg` (captured by the chief critic this round) |
| Whole game and polish | 5 | 1.0 | 5.0 | `docs/handoff/NOW.md`; none of the 12 polish moments ship |
| Music and sound | 10 | **not scored** | — | no owner numeric score on record (rubric rule) |
| **Total over scored weights** | **90** | | **524.5 / 90 = 5.83** |

The Part C auditor scored presentation, scenes and "whole" and left cast, fight, pause and phone unscored for
time. Those four groups **do** have approved tiles, and the rubric only permits dropping a category that has
none, so the chief critic scored them here rather than let their weight vanish: cast from the live character
audit plus my own hash check, fight and pause from side-by-side composites I built this round, and phone from
a live 390×844 capture I took myself (`part-c/phone-pause.mjs`, bundle re-verified as `index-hko3Xov1.js`).
I lowered presentation from the auditor's 6.0 to **5.5** on evidence they did not have: the battle-HUD
composite below.

**Presentation 5.5.** The title screen is a near-pixel match to `A-title.jpg`. Everything after it drifts.
Against `A-ink-and-gold-battle.jpg`, the shipped Chapter 1 battle adds two large advisor slabs across the top
third and a floating "Physical damage" tooltip that the approved mockup does not contain; replaces the
approved command list (ATTACK / SKILLS / MAGIC / ITEMS / OVERDRIVE READY) with ATTACK / SPECIAL ×4 /
WHITE MAGIC ×3 / ITEMS ×27 / FLEE, adding count chips and a FLEE row and dropping the OVERDRIVE row from
view; drops the boss name plate; and renders the CTB list as a plain text column instead of the mockup's slab
rows. The party status rows are the one part that matches well. Chapter select diverges from
`A-chapter-select.jpg` in four ways (single column instead of a 2-column grid; a new right-hand
LOCATION/BOSS/PARTY/BEST panel the mockup does not show; the mockup's cream info bar split in two;
captions by boss name instead of location). The battle-start banner draws monogram letter tiles where the
mockup shows faces.

**Scenes 7.5.** Every approved painting ships unaltered — I verified all 94 files behind the 16 sets, not
just the one tile that records a sha256 in `targets.json`. Docked for framing: the game does not frame the
paintings the way the approved pictures do (see fight, below).

**Cast 5.8.** Paintings unaltered (hash pass). But three of the ten approved tiles fall short in play: the
"portraits in the FFX turn list and party status window" tile ships monogram letter tiles on the battle-start
and results rosters; "Shuyin on the field in chapter 5" declares `states: ["idle"]` only, so the final boss of
the game never animates; and "Yuna as Gunner" is missing item/hurt/ko/victory. Three Yunalesca plates also
ship with an opaque white background matted at load.

**Fight 4.5.** `part-c/fight-pagoda.jpg` puts the approved targeting frame beside the build. The approved
picture is a wide arena shot: party in a small left arc, the Final Aeon and both Pagodas readable at middle
distance, a bracket reticle and hand cursor on the targeted Pagoda, a "TARGET Yu Pagoda C ENEMY" banner,
the command list bottom-left and a bottom control strip reading "ENTER CONFIRM ← → CHANGE TARGET ESC BACK".
The build pushes the camera in until the party fills the centre, leaves the boss half-occluded at the right
edge, has no target banner and no bottom control strip, and clips the advisor card with its own "▾ MORE"
chip. **Honest caveat:** the build frame carries a "Tidus SPEAKS" state, so it may not be a targeting frame —
the reticle's absence is *not* confirmed, and the targeting track's own self-verification claims 107/109.
Composition, camera distance, the missing banner and the missing control strip are moment-independent and are
what this score rests on. Round 04 must capture all three fight tiles in a confirmed targeting state.

**Pause 9.0.** The best-matched screen in the game: menu list, type, gold rules, encounter card, objectives,
tip slab, party rows and control strip all match `v5-2000x1012.png`. Only live state differs (play time,
current HP). Two of the six pause tiles (panels hidden, PARTY panel open) were not captured this round.

**Phone 8.5.** The one approved phone tile matches closely: menu, type, gold rules and control strip are
right, and the smallest rendered text on that screen is 12 px (the PAUSE chip) with everything else at 14 px.
The party block differs: the target stacks Tidus/Yuna/Kimahri as three full-width rows, the build puts Tidus
and Yuna side by side in a two-up grid with HP/MP wrapping to a second line.

**Whole and polish 1.0.** `docs/handoff/NOW.md` states it plainly: the 22 polish concept boards, twelve of
them approved tiles, are "mockups only; nothing is built until Bailey picks." None of the twelve approved
polish moments occur in the shipped build, so the distance from target to build is maximal for twelve of the
thirteen tiles in this group.

### Part C caps

| Cap | Ruling | Why |
|---|---|---|
| **5.0** — rejected option shipped, or an approved painting replaced | **NOT triggered.** | All 94 files behind the 16 approved sets in `docs/target/approved-hashes.json` hash clean: **0 changed, 0 missing**. The Zanarkand grey-hall failure mode did not recur. This is the strongest single piece of good news in the round. |
| **8.0** — a player-facing feature started after 2026-09-18 with no approved target | **NOT claimed.** | The chapter-select right-hand panel and the battle HUD's guide / next-move / enemy-move slabs have no approved target, but I could not date them to after 2026-09-18 from the repo, and the rule exempts work already in flight. Raised as a question for the owner below rather than asserted. Non-binding either way at 5.83. |

### Coverage — waiting on the owner

**50 approved · 0 awaiting a verdict · 9 with no target · 2 rejected.** No tile is sitting at `verdict`, which
is an improvement — every picture that exists has Bailey's yes or no on it. Nine tiles have **no target at
all**, and the gate cannot be met until they do:

1. **Move advisor card** (`fight` group) — no target.
2. **Defeat screen** (`fight`) — no target.
3. **Enemy next-move panel** (`fight`) — no target.
4. **Cold open and taught first chapter** (`fight`) — no target. *This is the same hole as the round's second-worst score (onboarding 2.8): there is nothing to build against.*
5. **Phone layout: every screen except pause** (`phone`) — no target. Pause is the only approved phone tile, and it is the only phone screen that works.
6. **Seymour and Anima, Macalania Temple (FFX)** — new chapter concept sheets.
7. **Evrae on the airship (FFX)** — new chapter concept sheets.
8. **The Leblanc Syndicate (FFX-2)** — new chapter concept sheets.
9. **One finished minute of play** (`whole`) — no target.

---

## What changed since round 02

**Fixed — verified on the live build this round:**

- **Chapters finish.** Round 02's blocker (Chapter 4 won at 0 HP and never reaching results, Chapter 1 not
  finishing in 300 s at skip speed) is gone. All five chapters reached VICTORY live.
- **Boss music routing.** Round 02's blocker #2 — every boss fight playing the generic `battle-ffx` cue — is
  fixed; each chapter settles on its own cue, verified in five fresh browser contexts. The pause cue plays too.
- **Post-battle scenes reach the player.** Round 02 measured 0 of 28 post lines reachable in Chapter 1 and 0
  of 18 in Chapter 3. This round every chapter runs battle → post scene → results → scene.
- **Both Yu Pagodas are visible** beside Braska's Final Aeon (round 02's CHK-011 blocker; the owner's
  2026-09-18 report).
- **Overdrive gauge** has a label, a READY state and its own command row.
- **Esc opens the full-bleed pause** from battle and from inside targeting (CHK-015 passes in both games).
- **CTB names print in full** at 1600×900 (CHK-009).

**Not fixed — carried straight over from round 02:** no onboarding or help of any kind (round 02 asked);
no control remapping (round 02 issue 18, not started); no text-scale option; no battle-speed control in the
pause options (round 02 issue #03); no phone layout; the battle HUD still does not match the approved mockup;
the 12 px PAUSE chip at 4K (the owner's own 2026-09-18 complaint).

**New or newly measured this round:** the two `canAct` status bugs (#3, #4); the Chapter 1 win-rate
regression to 57–65% against its own test file's claimed 73%; the presenter lagging the engine by 2.1–4.5 s;
the rewards that are printed and never banked; the missing `og:` metadata; the three white-background
Yunalesca plates.

---

## Ranked issue list

Ranked by how much each costs the headline (Part B, 4.09), with Part A weight and Part C distance as
tie-breakers. **Coverage note, stated plainly:** the category auditors logged 353 findings this round; the
issue list delivered to the chief critic was truncated in transit at 41 entries. The list below is those
entries plus the chief critic's own findings, de-duplicated and merged. The remainder live in each auditor's
evidence folder under `critic/rounds/round-03/` and must be folded in by whoever works this list.

| # | Sev | Category | Issue | Costs |
|---:|---|---|---|---|

**1. BLOCKER — onboarding.** *Nothing in the game teaches any system.*
Repro: live URL, cold profile. On the title press F1, H, /, O, C — nothing. Walk title → chapter select →
party prep → cutscene → battle; the pause root menu has no HELP or HOW TO PLAY row. A string search of the
shipped bundle for "HOW TO PLAY", "TUTORIAL", "GLOSSARY", "HELP", "CONTROLS" and "seenTutorials" returns
absent for all six. Party prep offers CHAPTER / STATS / SPHERE GRID / EQUIPMENT / ITEMS / OVERDRIVE tabs to
someone taught none of those words.
Where: `src/app/screens/` has no help screen; `src/ui/common/registerFlowScreens.ts` registers none;
`PauseScreen.ts`'s row list has no help entry.
Fix: two opt-out layers — a HOW TO PLAY entry on the title and in pause (one page per system: CTB, Overdrive,
aeons, spherechange, Garment Grid; a still and three sentences each), and first-encounter teaching cards
fired once per system per save behind a `seenTutorials` set in `SaveData`. **Case: both** (shared plumbing,
CHK-020), with per-game pages. **This needs an approved end state first — board tile "Cold open and taught
first chapter" is a gap.**
Costs: onboarding 2.8 (w10) — the single largest drag on the headline, ≈ 0.72 of Part B.

**2. BLOCKER — clarity.** *Single-target HASTE is described as hitting the whole party.*
Repro: live, Chapter 1, Tidus's first turn. ArrowDown ×2 to WHITE MAGIC, Enter. Cursor lands on HASTE (8 MP);
the description bar reads "Speeds the party's turns up — inflicts Haste". Enter: targeting resolves to one
ally. The same sentence is printed for HASTEGA, so the two are indistinguishable from their text.
`shots/c-19-white-magic-open-ch1.png`, `clarity-ch1.json` steps 19–20.
Where: `src/engine/tactics/advisor.ts:441` — read and confirmed by the chief critic:
`def.targeting.startsWith('all-all') || heals ? 'Speeds the party's turns up' : 'Pushes the target's turn back'`.
`heals` is set on every CTB ability including single-target Haste.
Fix: drop `|| heals`; `scope` is already computed ten lines above from `def.targeting` — use it, and take the
direction from the ability's own CTB sign. Unit-test that for every CTB-formula ability the blurb's target
noun matches `def.targeting`, in both games. **Case: both.**
Costs: triggers the Part B 8.0 cap; clarity 3.9 (w12).

**3. BLOCKER — combat fidelity.** *Threaten permanently deletes an enemy from the CTB queue — a one-command
win button on Chapter 2.*
Repro: `npx vitest run --config critic/rounds/round-03/vitest.combat.config.ts critic/rounds/round-03/cf-probes-ffx.test.ts`
(PROBE-1). Chapter 2, drive Auron's real `threaten` command through `engine.submit` until it lands. Seeds
1/2/3/5: landed at turns 16/9/9/29, then **Yunalesca took zero turns for the next 120+ turns**,
`threatenStillOn=true`, boss HP unchanged at 24000. Auron is in the shipped `zanarkandBuild`, so a player
reaches this in two menu presses.
Where: `src/battle/ffx/state.ts:244` (`canAct()` returns false for `threaten`) feeding
`src/battle/ffx/turnQueue.ts:64` (`queueMembers` filters on `canAct`) — both read and confirmed by the chief
critic. The only removal is `src/battle/ffx/ticks.ts:98-99` inside `onTurnStart`, which a Threatened actor can
never reach.
Fix: `canAct()` is doing two jobs — "may act" and "is in the turn queue". Split them. Keep Threatened actors
in `queueMembers`/`nextActor`, let the turn arrive, and have `onTurnStart` drop the status and skip the
action; better still, schedule the target's counter off the Threatening user's next turn as §4.4 describes.
Add `tests/unit/ffx-ctb-locks.test.ts` asserting a Threatened enemy acts again within one user turn, for every
enemy with `threatenChance > 0`. **Case: FFX only for Threaten** (`research/ffx-combat-core.md` §4.4; FFX-2
has no Threaten), **but the `canAct` split is shared plumbing and must be done once for both.**
Costs: combat 7.4 (w25); difficulty 3.2 (w8) as a degenerate tactic canon did not have.

**4. BLOCKER — combat fidelity.** *Sleep never expires; a slept combatant is out for good unless something
hits it physically.*
Repro: PROBE-2, same file. Chapter 3, put Sleep `{turnsRemaining: 3}` on Tidus, play 53 turns of Defend:
`tidusTurnsTaken=0`, sleep still on, `turnsRemaining` still 3 — never decremented once. Reachable in real play
from Yunalesca's Form-I Sleep counter (`yunalesca-abilities.ts:300-320`, chance 100 / 3 turns, `canMiss`
false) and the Yu Pagoda's Curse (`braskas-final-aeon-abilities.ts:508`).
Where: same `state.ts:244` exclusion; `statuses.ts:29` `DURATION_STATUSES` is ticked only by
`tickDurationStatuses`, called from `ticks.ts:104` `onTurnEnd` — i.e. only for an actor that got a turn. The
partial fix at `abilities.ts:272` (a physical hit wakes the sleeper) names this gap in its own comment.
Fix: same shape as #3 — keep sleepers in the queue, let the turn arrive, skip the action and tick the duration
in `onTurnStart`. Fixture: sleep an actor, assert it acts again on turn 4 with no incoming damage.
**Case: both** (shared status plumbing; FFX §4.2 sets Sleep at 3 turns).
Costs: combat 7.4 (w25); encounter 5.8 (w15).

**5. BLOCKER — accessibility.** *Audio settings are never applied at load: a player who mutes the game gets
full volume back on the next visit.*
Repro: live URL, fresh profile. Reach a battle, Esc, OPTIONS, ArrowLeft ×12 on MASTER VOLUME. Panel reads 0
and `audioDebug().volumes.master` is 0. Reload: `app.save.settings.masterVolume` is still 0 but
`audioDebug().volumes.master` is **0.9**. Script `b-run10-volume.mjs`.
Where: `src/audio/AudioManager.ts:587` constructs the singleton with no options (defaults 0.9/0.7/0.9 at
:101-103); the only callers of `setMasterVolume`/`setMusicVolume`/`setSfxVolume` in all of `src/` are
`PauseScreen.ts:797`, `:803`, `:809`, so no boot path pushes the saved values into the mixer.
Fix: give `AudioManager` an `applySettings(settings)` and call it from `App`'s constructor and from
`SaveStore.setSettings`. Unit-test that a store loaded with masterVolume 0 leaves the mixer at 0, plus an e2e
case that sets a volume, reloads and re-reads `audioDebug()`. **Case: both.**
Costs: accessibility 2.6 (w8).

**6. BLOCKER — accessibility.** *The OPTIONS panel shows a master volume the mixer is not using.*
Repro: any battle, Esc, OPTIONS: "MASTER VOLUME 80". Same instant `audioDebug().volumes = {master:0.9,
music:0.7, sfx:0.9}`. Wrong before the player touches anything.
Where: `src/app/SaveData.ts:142` (`masterVolume` 0.8) against `src/audio/AudioManager.ts:101`
(`?? 0.9`); the rows render from Settings at `src/app/screens/PauseScreenPanels.ts:209`.
Fix: delete one of the two defaults (have `AudioManager` take its initial volumes from `defaultSettings()`)
and render the OPTIONS rows from the mixer's live values. Unit-test that the two are equal field for field.
**Case: both.**
Costs: contributes to the Part B 8.0 wrong-information cap; accessibility 2.6 (w8).

**7. BLOCKER — accessibility.** *No control remapping exists anywhere in the game.*
Repro: any battle, Esc, OPTIONS: six rows, no controls section; no CONTROLS row on the pause root. A string
search of `index-hko3Xov1.js` for "REMAP" and "CONTROLS" returns nothing.
Where: `src/app/Input.ts:38` (KEY_MAP) and `:72` (PAD_MAP) are module constants with no setter and no
persistence; `PauseScreenPanels.ts:206` is the only options surface.
Fix: move the maps into Settings as `bindings: Record<Button, string[]>`; add a CONTROLS panel that captures
one raw keydown or pad button per binding, refuses to leave confirm and cancel unbound, offers RESET TO
DEFAULTS, and persists through `SaveData`. **Unchanged from round 02 issue 18 — still not started. Case: both.**
Costs: accessibility 2.6 (w8).

**8. BLOCKER — accessibility.** *No text-size option, and type is under the 14 px legibility floor at every
size except 2560.*
Repro: fresh context per viewport, walk title → chapter select → party prep with real keys, measure every
visible text node's computed font-size through every ancestor transform (`b-run4-a11y.mjs`). 1280×720: title
9/11 nodes under 14 px (min 10.66), chapter select 30/66 (min 9.78), party prep 11/13 (min 8.00). 1600×900:
title 6/11 (min 13.32), prep 10/13 (min 9.92). 2560×1440: prep 8/13 (min 12.00). 390×844: title min 3.25 px.
Where: fixed px inside the 640×360 `LetterboxStage` transform, e.g. `TitleScreen.ts:81,90-95`; the same
contract in chapter select, party prep and the cutscene strip.
Fix: a UI SCALE row in OPTIONS (90/100/115/130%) driving a CSS custom property, text tokens outside the
letterbox transform authored in `clamp()`/`rem`, and the live legibility sweep CHK-003 asks for
(`tests/e2e/legibility.spec.ts`) failing on the first node under 14 css px at each of six viewports.
**Case: both.**
Costs: accessibility 2.6 (w8); clarity 3.9 (w12); UI polish 5.0 (w5).

**9. BLOCKER — game feel / clarity.** *The party row shows a dead character alive at 711/1500 for 2.1 s, and
lags ordinary damage by 4.5 s.*
Repro: live, Chapter 1, Enter (ATTACK) then Enter (confirm). Sampling every 200 ms, `battleLog()` records
`{type:'ko', targetId:'yuna'}` while the rendered row still matches `/Yuna\s*711\s*\/1500/` in living colours
for **2145 ms**. Separately the 789 damage numeral is on screen at 1901 ms while the row still reads
1500/1500, and does not show 711 until 6395 ms. `b-ko2.mjs`, `ko2.json`, `feel-ch1.json`.
Where: the party-status port in `src/engine/BattlePresenter*.ts` — the row is driven by the presenter's
animation-queue drain, not by the engine event.
Fix: apply hp and ko to the rows on the engine event, in the same frame as the numeral, and paint the down
state (grey, 0, an explicit DOWN word) on `ko` rather than on `action-end`. Unit-test that the row model
equals the engine's hp/alive for every combatant after every drained event; e2e-sample the rendered row
against `battleLog()` every animation frame through a KO. **Case: both.**
Costs: triggers the Part B 8.0 cap; game feel 5.8 (w12); clarity 3.9 (w12).

**10. BLOCKER — fun and pacing.** *Chapter 5 is a 43–77 minute unbroken fight and a defeat on the last link
throws the whole run away.*
Repro: the shipped intended line needs 723 / 930 / 981 / 1291 decisions on seeds 1 / 7 / 42 / 20260916
(`npx vitest run tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`); measured live median decision-to-decision
at default speed is 3.60 s over 16 real-key decisions (`fun-and-pacing/61-ch4-probe8.log`) ⇒ 43.4–77.5 min.
Five links; losing on link 5 re-enters at link 1 with no save and no results between links.
Where: `src/app/screens/BattleScreenFlow.ts:289-370` (the `for(;;)` attempt loop, no per-link checkpoint).
Fix: per-link checkpoint — on each link victory write the link index and party state into
`SaveData.ChapterRecord` and offer RESUME AT \<part\> beside RETRY on the defeat panel. Ship #11 at the same
time so 43 minutes becomes ~15. **Case: both** — Chapter 3 (FFX, 7 links) has the identical shape, so this is
shared plumbing (AGENTS rule 14 / CHK-020).
Costs: fun 6.3 (w15); replayability 3.6 (w10).

**11. BLOCKER — fun and pacing.** *The only battle-speed control is hold-R, printed nowhere, with no pause option.*
Repro: live, Chapter 1. Hold KeyR: speed normal → fast, turn 1 → turn 9 in 10.5 s (1.05 s/turn against
3.0 s/turn), back to normal on keyup (`probe7.log`). Now scrape the whole live battle page: `/\bR\b/` false,
`/speed/i` false, `/fast/i` false. Open pause with a real Escape: RESUME / RESTART ENCOUNTER / STRATEGY GUIDE
/ HIDE PANELS / OPTIONS / ENCOUNTER DETAILS / PARTY / MUSIC PLAYER / CHAPTER SELECT / QUIT TO TITLE — **no
BATTLE SPEED row** (`probe2.log`).
Where: `src/app/screens/BattleScreen.ts:756-757`; `src/app/screens/PauseScreenPanels.ts:200-221`; no
`ControlsHint` is constructed by `src/ui/ffx/FFXBattleHud.ts` or `src/ui/ffx2/FFX2BattleHud.ts`.
Fix: a persisted BATTLE SPEED row (1×/2×/4×) in the pause OPTIONS group driving presenter timeScale, and a
`ControlsHint` mounted on both battle HUDs listing the keys that already exist (R, G, N, E, I, Esc), worded
per device. **Round 02 issue #03's fix has not shipped. Case: both** (CHK-020).
Costs: fun 6.3 (w15); accessibility 2.6 (w8); onboarding 2.8 (w10).

**12. BLOCKER — controls and platforms / Part C phone.** *Phone/touch UI is illegible and untappable at 390×844.*
Repro: Playwright, 390×844, hasTouch+isMobile, live URL. Title: minimum computed font-size **5.33 px**
(7 nodes under 14). Battle command menu: minimum **3.9 px**; the ATTACK row measures **95.6 × 14.1 CSS px**.
`part-b-controls/screens/touch-01-title.png`, `touch-06-battle-menu.png`.
Where: `TitleScreen.ts` `layout()` and the shared Ink & Gold letterbox pattern (`scale = min(w/640, h/360)`);
`src/ui/ffx/CommandMenu.ts` row sizing — both author to a fixed landscape canvas and letterbox-scale it.
Fix: **this needs an approved end state before it is built** — board tile "Phone layout: every screen except
pause" is a gap, and the one approved phone tile (pause) is also the one phone screen that works, which is not
a coincidence. Options round first, then a portrait-aware composition or a minimum-scale floor plus reflow.
**Case: both.**
Costs: controls 4.2 (w8); Part C phone 8.5 (w5) is high only because the sole approved tile is the one that works.

**13. BLOCKER — encounter fidelity / difficulty.** *Chapter 1 wins 17/30 (57%) and 26/40 (65%) with the game's
own intended tactics, and the curve runs backwards.*
Repro: `npx vitest run --config critic/rounds/round-03/vitest.bench.config.ts encounter-bench -t 'ffx chapters, intended'`
→ `seymour-flux / intended wins=17/30 avgTurns=53.8`. Over 40 contiguous seeds
(`winrate.bench.test.ts`, `winrate.json`): seymour-flux 26/40 (65%), yunalesca 39/40, braskas-final-aeon
39/40, ffx2-bahamut **40/40**, ffx2-vegnagun-shuyin 35/40. `tests/unit/strategy-seymour-flux.test.ts`'s own
header still claims 146/200 (73%) after the last fix pass, so this is a regression as well as a miss.
Where: `src/engine/tactics/seymour-flux.ts` against `src/battle/ffx/ai/seymour-flux.ts`;
`src/data/ffx2/enemies/bahamut.ts` for the other end.
Fix: **do not tune the boss** (`research/ffx-seymour-flux.md` §4.2 is decompiled). Fix it on the player's side
where the real fight's answer is — §6 row 4 ("Holy Water the Zombie before the mount's Full-Life") and §7
(a Zombie Ward member in the front slot), plus Hastega first so the party out-ticks the pair. Write the
intended per-chapter win-rate band down, add a standing bench test that fails when a chapter leaves it, and
re-measure over 200 contiguous seeds. **Case: per chapter — FFX only for 1–3, FFX-2 only for 4–5.**
Costs: encounter 5.8 (w15); difficulty 3.2 (w8). *(Merged: the auditors filed this twice, once as a Chapter 1
win rate and once as an inverted curve. Same measurement, one fix programme.)*

**14. BLOCKER — difficulty.** *Chapter 1's signature mechanic has no counter-play: every Full-Life kill lands
with zero player turns after the Zombie.*
Repro: `window.bench.test.ts -t "Zombie"`, 40 seeds under the shipped intendedStrategy: Zombie applied 82
times, Full-Life instant-kills a zombified ally 47 times, histogram of player turns between the two is
`{"0": 47}` — zero, every time. The party-prep OBJECTIVES panel for this chapter reads "Holy Water a Zombie
before Full-Life lands" (`shots/05-prep-tab-chapter.png`).
Where: `src/battle/ffx/ai/seymour-flux.ts` (§4.2 phase-1 cycle) against `ticks.ts`/`turnQueue.ts`; the
instruction is in `src/data/encounters.ts` via `src/ui/common/chapterObjectives.ts`.
Fix: either make the window real (verify the CTB rank/delay of Lance of Atrophy 6/120 and Full-Life 6/245 let
a hasted party interleave a turn, and unit-test that with Hastega up at least one party turn falls between
Zombie and the next Full-Life in at least N% of seeds) **or stop promising it** and rewrite the objective and
the guide line to name what the player *can* do. **Case: FFX only** — FFX-2 has no Zombie/Full-Life pairing
(`research/ffx-seymour-flux.md` §3.2, §4.2).
Costs: difficulty 3.2 (w8); clarity 3.9 (w12) — the game instructs a reaction it does not permit.

**15. BLOCKER — encounter fidelity.** *Yu Yevon's Curaga counter fires off the Yu Pagodas' own Power Wave.*
Repro: `vitest ... probes.test -t 'P5 '`. Every `ACT yu-pagoda-left -> power-wave-aeon @ ["yu-yevon"]` is
followed by `COUNTER yu-yevon curaga` and a 9,999 heal. `research/ffx-bfa-yu-yevon.md` §3.4.1 sets that row to
**0 Curagas fired**.
Where: `src/battle/ffx/ai/reactions.ts:37-45` — read and confirmed by the chief critic: `collectBossCounters()`
loops `damagedEnemyIds` and skips only `enemy.id === attacker.id`; it never checks `attacker.side`.
Fix: gate on `attacker.side !== 'enemy'`. Unit-test that a Pagoda Power Wave does not move the Curaga count.
**Case: FFX only** (the formation is FFX; the `attacker.side` guard is shared plumbing and should be audited
in the FFX-2 reaction path too).
Costs: encounter 5.8 (w15).

**16. BLOCKER — encounter fidelity / stability.** *Yu Yevon's documented attrition win route is unreachable
and the fight ends on a stalemate guard with a bogus `escape`.*
Repro: `probes3 -t 'R2 '` — defend-only, seed 4: outcome `escape`, Yu Yevon on 4,801/99,999 after 57 Gravijas
and 172 Pagoda Power Waves. Attack-only (`probes.test P5`): `escape` with Yu Yevon on a full 99,999.
`research/ffx-bfa-yu-yevon.md` §3.5 names attrition as a win route; the group record says "Cannot be lost".
Where: `src/battle/ffx/ai/yu-yevon.ts:47` (`use(ai,'gravija',[...party, ai.self.id])` — the Pagodas are never
targets) plus `src/battle/ffx/engine.ts:397` (stalemate guard finishes as `escape`).
Fix: (a) let Gravija hit everything on the field — the record already carries `targeting: 'all'` and
`extra.includesUser` (`braskas-final-aeon-abilities.ts:531-548`), so pass an empty target list and let
`targeting.ts` expand it; (b) a battle that hits the stalemate guard in a formation with `canEscape: false`
(`braskas-final-aeon.ts:415`) must report a distinct outcome the results screen can name. Regression-test that
a defend-only Yu Yevon run reaches 0 HP. **Case: FFX only for Gravija; the stalemate-outcome fix is both.**
Costs: encounter 5.8 (w15); stability 7.5 (w5).

**17. BLOCKER — encounter fidelity.** *Yunalesca's aeon sub-cycles target the off-stage party, so summoning no
longer protects it.* **Verdict: PLAUSIBLE, not confirmed.**
Repro: `probes.test -t 'P4 '`, seed 11, Form III with Shiva on the field:
`ACT yunalesca -> mind-blast-aeon @ ["tidus","yuna","auron"]` lands 568 damage plus Curse on Tidus, who is
off-stage behind the summon; `ACT yunalesca -> osmose @ [...]` produces no mp-damage event at all.
`research/ffx-yunalesca.md` §5.3 aims both at the aeon's side and calls the Form-III summon "a sacrificial timer".
Where: `src/battle/ffx/ai/yunalesca.ts:128,146-147` — every party-wide action uses
`ai.ctx.state.activeIds.slice()`.
Fix: use `livingFriendlies(ctx)` exactly as `src/battle/ffx/ai/seymour-flux.ts:117-134` already does and
documents; that file records this as a fix made there and never mirrored here. Test: stage Form III with an
aeon out, assert no party member takes damage or a status from her aeon branch. **Case: FFX only.**
**Why PLAUSIBLE:** the confirmation pass received this finding truncated and could not reproduce it. The
repro, file and line above come from the original audit and were not re-run. Re-verify before and after the fix.
Costs: encounter 5.8 (w15).

**18. BLOCKER — character and visual fidelity.** *Paine ships as a "P" ink monogram, and eight speakers have
no portrait at all.*
Repro: live, 1600×900, `gotoChapter('ffx2-vegnagun-shuyin', {skipPrep:false})`. Paine's face is a dark navy
square with a white "P" in **both** roster surfaces; DOM shows two `.prep__face` elements with `imgs: []`.
Same on Chapter 4. Independently, the live portrait probe (`w3-portraits.json`) returns **404** for `paine`,
`shuyin`, `yuna-x2`, `rikku-x2`, `braska`, `yu-yevon`, `fayth-boy`, `young-auron` — all 200 for the ten FFX
portraits. `z-paine-card.png`, `z-paine-monogram.png`, `prep-c5-1600.png`.
Where: `src/app/screens/PartyPrepContent.ts:25` returns the letter span plus `faceImgHtml(id,'')`, which
returns '' when the file is missing; used at :42 and :80.
Fix: short term, use the stacked-layer helper the FFX-2 battle rows already use
(`faceLayersHtml([...], artIdFor(member))` from `src/ui/common/portrait.ts:296`) so Paine falls through to the
head of her own dressphere painting. Properly: paint the eight missing portraits. Add a case to
`tests/e2e/portraits.spec.ts` that stages both prep screens for all five chapters and fails on any
`.prep__face` with an empty img list, and a test that every speaker id used by a shipped script resolves a
portrait. **Case: FFX-2 only for Paine and the two X2 ids; FFX only for Braska / Yu Yevon / fayth boy / young
Auron; the prep fallback is both.**
Costs: **triggers the Part A 8.0 cap**; character/visual 4.2 (w15); writing 7.5 (w10); Part C cast 5.8 (w15).

**19. BLOCKER — character and visual fidelity.** *Two of the three FFX-2 party members have only an idle
painting — they never react in Chapters 4 or 5.*
Repro: live `art/manifest.json`: `rikku-dark-knight`, `rikku-thief`, `paine-warrior`, `paine-dark-knight` each
declare `states: ["idle"]`. `POSE_FALLBACKS` collapses attack/cast/item/hurt/ko/victory to idle, so Rikku and
Paine stand in the same painting whether they swing a greatsword, take 1,300 damage or die
(`character-visual/audit2-1600.json`).
Where: `public/art/manifest.json`; pose fallbacks at `src/engine/BattlePresenterArt.ts:113-126`.
Fix: queue the missing poses for the four dressphere ids `bevelleBuild` and `farplaneBuild` actually stage,
plus `yuna-gunner`'s item/hurt/ko/victory. Until they exist, add a manifest gate: a unit test that every art id
a shipped build can stage declares at least idle+attack+hurt+ko. **Case: FFX-2 only.**
Costs: character/visual 4.2 (w15); Part C cast 5.8 (w15).

**20. BLOCKER — character and visual fidelity.** *Chapter 5's boss has no attack, hurt or KO poses across three
of its four parts, and Shuyin has only an idle.*
Repro: live manifest — `vegnagun-leg`, `vegnagun-body`, `vegnagun-head`, `shuyin` all `states: ["idle"]`;
`vegnagun-tail` and `ffx2-bahamut` `["hurt","idle","ko"]` with no attack or cast. In play the tail fires Noli
Me Tangere for 1,171–1,323 on all three girls and the painting does not move; destroying a part shows no KO
pose; the final boss of the game never animates.
Where: `public/art/manifest.json`; `ENEMY_POSES` at `src/engine/BattlePresenterArt.ts:36`.
Fix: render attack/cast/hurt/ko for all four Vegnagun parts, `ffx2-bahamut` and `shuyin`. **Case: FFX-2 only**
— FFX's nine boss art ids are complete, so nothing changes in Chapters 1–3
(`research/ffx2-vegnagun-shuyin.md`, `research/ffx2-bahamut.md`).
Costs: character/visual 4.2 (w15); Part C cast 5.8 (w15) — "Shuyin on the field in chapter 5" is an approved tile.

**21. BLOCKER — character and visual / Part C presentation.** *FFX party members are 66–75% buried under the
command stack — well past the ~48% the approved mockup shows.*
Repro: live, 1600×900, Chapter 1, command menu open. `PaintedStage.visibilityInFrame()` returns yuna
**0.253**; Chapter 3 returns tidus 0.340, yuna 0.300. `z-c1-yuna.png`: of Yuna only a sliver of cheek, her
staff head and a corner of skirt survive between the slabs. Chapters 4 and 5 measure 0.96–1.00.
Where: `src/engine/BattlePresenterStage.ts:495-512` — the `relaxFormation` panel clause is scoped
`if (this.actors.get(id)?.kind !== 'enemy') continue;`, and its own comment records the approved frame as
"Yuna is ~48% behind it there"; `src/scenes/gagazet.ts:129` `PARTY_SLOTS[1] = [-2.95, 0, 0.25]` against the
command rail at 0.047–0.329 x (docs/ENGINE-API.md line 810).
Fix: add a party clause to `relaxFormation` with a floor of 0.52 visibleFraction against `this.panels`,
lane-limited so the arc keeps its shape. Cheaper first step: move `PARTY_SLOTS[1]` from x −2.95 to about −2.2
in `gagazet.ts` and `dreams-end.ts`. **Case: FFX only** — FFX-2's command window is on the right and its party
measures clear.
Costs: character/visual 4.2 (w15); Part C presentation 5.5 (w30).

**22. BLOCKER — fun and pacing.** *The FFX-2 advisor repeats the same three picks for every decision and never
reacts to the party collapsing.*
Repro: live, Chapter 4, seed 7, 16 consecutive real-key decisions (`61-ch4-probe8.log`). The card reads
"Magic Break → Bahamut" / "Darkness" / "Shell" at D0 with the party at full HP, and is **byte-identical** at
D15 when the party is at 38% / 34% / 38%. No cure, no item, no sentence about the board. The FFX side on a
broken board says "Leave Yuna down for now — a raise brings Yuna back still a Zombie, and Full-Life kills a
Zombie outright".
Where: `src/engine/tactics/advisor-revive.ts` header ("FFX-2 has no `learnedAbilityIds` and falls through to
the base value…"); `src/engine/tactics/advisor.ts` scoring; `src/engine/tactics/ffx2-bahamut.ts`.
Fix: give the FFX-2 side the same board reading — a party-HP floor that outranks the scripted line once anyone
is below ~40%, a keystone/role reading built from dressphere abilities instead of `learnedAbilityIds`, and a
one-sentence reason tied to the current board. Extend `tests/unit/advisor-degenerate-boards.test.ts` (CHK-005)
to chapters 4 and 5. **Case: both** — a bug fix to the one panel the two games share (AGENTS rule 14, CHK-020).
Costs: fun 6.3 (w15); clarity 3.9 (w12).

**23. BLOCKER — progression.** *The FFX victory card reports Sphere Levels and AP the game throws away one
screen later.*
Repro: live, clear Chapter 1 (seed 2). Results: "AP 10,000 ×3 PARTY", "Tidus +9 S.Lv · S.LV 39 ·
1,231/1,386 AP · +10,000 AP" (`shots/pi-i1-ffx-results.png`). Enter, re-enter the same chapter's prep, open
SPHERE GRID: "Tidus S.LV 30 · AP 0 / 695". The defeat card agrees with prep — the victory card is the outlier.
Where: `src/ui/common/resultsMath.ts:177-183` composes a post-battle S.Lv and AP nothing persists;
`src/app/SaveData.ts:128-138` has no AP/party fields; `BattleScreenFlow.ts:353` records only time and turns.
Fix: pick one and make it true — persist AP and S.Lv into `SaveData` and hydrate `PartyPrepScreen` from it, or
stop printing growth the next screen denies and print what the run earned. **Case: both** (the FFX-2 twin is #24).
Costs: progression 3.0 (w7); clarity 3.9 (w12).

**24. BLOCKER — progression.** *FFX-2 rewards are printed on every clear and banked on none.*
Repro: live, clear Chapter 4 (seed 7), CONFIRM, clear again (seed 11). Both cards read exactly "EXP 1,300 ×3
PARTY / AP 15 PER DRESSPHERE / GIL 1,000 / … Rikku DARK KNIGHT · CONFUSE 30/30 AP" (`pg-g1-results-1.png` vs
`pg-g3-results-2.png`). 30 AP awarded across two clears and the ladder did not move; Rikku's row is a completed
30/30 bar for an ability that is never learned.
Where: `src/app/screens/ResultsScreen.ts:296-306`, `src/ui/common/resultsMath.ts:160-175`; no writer anywhere
for `FFX2MemberBuild.abilitiesLearned[*].ap`.
Fix: persist per-dressphere AP and EXP into `SaveData` keyed by chapter, apply it in `PartyPrepContent` before
the build reaches the engine, and let the ladder complete and unlock. If persistence is out of scope for a
single-encounter format, remove the counters and ship a per-run scorecard instead. **Case: FFX-2 only for the
dressphere ladder; the decision must be taken for FFX's Sphere Grid row at the same time.**
Costs: progression 3.0 (w7).

**25. MAJOR — progression / clarity.** *Results and party prep name a different "next ability" for the same
character and dressphere.*
Repro: clear Chapter 4 — card reads "Yuna · WHITE MAGE · CURAGA 55/80 AP" (`pf-ffx2-bahamut-final.png`). Open
Chapter 4 prep, DRESSPHERES tab — "LEARNED 7/16 · 40 AP banked · next Life 30 AP" (`ph-h2-x2-dresspheres.png`).
Where: `src/ui/common/resultsMath.ts:169` takes the **first** unlearned ability in table order;
`src/ui/ffx2/party-prep/panels.ts:160-162` takes the **cheapest**.
Fix: one exported `nextDressphereAbility(def, learned)` called from both; unit-test that the two surfaces
return the same abilityId and apCost for every shipped dressphere. **Case: FFX-2 only** (FFX's S.Lv row needs
the same single-source treatment).
Costs: progression 3.0 (w7); contributes to the Part B wrong-information cap.

**26. MAJOR — narrative presentation.** *97 authored camera and staging beats never reach the screen — every
cutscene is a static wallpaper with a text box.*
Repro: play Chapter 1's pre-scene live and step it with Enter. `shots/04-cutscene-0.png` and `04-cutscene-3.png`
(five lines apart) have pixel-identical backdrops, no actor on stage and no camera move, while the script asks
for `camera('idle')`, `showActor('seymour', …)`, `setPose('kimahri','kneel')`, `setPose('kimahri','attack')`,
`camera('action',240)` and `setPose('auron','point')`. Across the five scripts: 52 `camera()`, 9 `showActor()`,
11 `hideActor()`, 25 `setPose()`.
Where: `src/app/screens/CutsceneScreen.ts:379` (`camera: () => {}`), `:386` (`moveActor: () => {}`);
`showActor`/`hideActor`/`setPose` are optional on `CutscenePorts` (`src/story/runner/CutsceneRunner.ts:73-75`)
and supplied by nobody because `src/ui/common/registerFlowScreens.ts:44-56` passes no `ports`.
Fix: wire the real scene/presenter ports into the cutscene factory — a camera port driving the same rig system
`shot(rig)` uses, and show/hide/pose ports that stage the painted billboards on the diorama already on screen.
Fail the build (or a unit test) when a script calls a port the factory does not supply, so this cannot recur
silently. **Case: both.**
Costs: narrative 3.2 (w5); cohesion 4.4 (w5); writing 7.5 (w10).

**27. MAJOR — Part C presentation.** *The battle HUD — the screen the player looks at for forty minutes — is
not the approved mockup.*
Repro: `critic/rounds/round-03/part-c/presentation-battle.jpg` (built this round; target
`docs/screenshots/mockups/A-ink-and-gold-battle.jpg`, build `character-visual/shots/seymour-flux-board-1600.png`).
The build adds two large advisor slabs across the top third and a floating "Physical damage" tooltip that the
mockup does not contain; the command list reads ATTACK / SPECIAL ×4 / WHITE MAGIC ×3 / ITEMS ×27 / FLEE against
the approved ATTACK / SKILLS / MAGIC / ITEMS / OVERDRIVE READY; the boss name plate is gone; the CTB list is a
plain text column instead of slab rows; three `G`/`N`/`E` toggle chips sit on the glass.
Where: `src/ui/ffx/FFXBattleHud.ts` and the guide/next-move/enemy-move panels mounted beside it.
Fix: put the build beside the mockup and close the list, or take the changed HUD to Bailey as an options round
under hard rule 9. Do not keep shipping a HUD that no approved picture shows. **Case: both** — the FFX-2 HUD
needs the same comparison against `A-ffx2-battle.jpg`.
Costs: Part C presentation 5.5 (w30) — the largest single weight on the board.

**28. MAJOR — Part C whole and polish.** *None of the twelve approved polish moments ship.*
Repro: `docs/handoff/NOW.md` states the 22 polish concept boards are "mockups only; nothing is built until
Bailey picks" — but twelve of them are `approved` tiles on the end-state board. Parallax title, moving ink
interface, close-up face pass, living backdrops, CTB queue preview, phase lighting, atmosphere, arena camera
sweep, glass-shatter transition, pyrefly-death dissolve, X-2 chain/mission card and spherechange sequence: none
occur in the shipped build.
Fix: these are approved targets, not proposals — they need a build order, not another yes. Rank them by cost
and start with the two that also fix defects on this list (CTB queue preview → clarity; phase lighting → the
form-change moment). **Case: decide per item; the X-2 chain/mission card is FFX-2 only, spherechange is FFX-2
only, the rest are both.**
Costs: Part C whole 1.0 (w5).

**29. MAJOR — Part C presentation.** *Chapter select diverges from its approved mockup in four ways.*
Repro: live chapter select against `docs/screenshots/mockups/A-chapter-select.jpg`: (1) the four other-chapter
thumbnails render as one vertical column instead of the mockup's 2-column grid; (2) a right-hand
LOCATION / BOSS / PARTY / BEST panel the mockup does not show at all; (3) the mockup's single bottom cream
info bar is split into a smaller bottom-left card plus that panel; (4) uncleared captions read by boss name
("II Lady Yunalesca") instead of the mockup's location names ("II Yunalesca", "III Dream's End").
Fix: restore the approved layout, or take the right-hand panel to Bailey as an option. **Case: both.**
Costs: Part C presentation 5.5 (w30).

**30. MAJOR — Part C presentation / cohesion.** *The battle-start and results rosters draw monogram letter
tiles over portraits that exist.*
Repro: `shots/ch1-seymour-flux-menu.png` — the Chapter 1 battle-start card's bottom strip reads
"**T** TIDUS · [Yuna's painted face] · **K** KIMAHRI". `shots/ch2-yunalesca-menu.png` — "**T** TIDUS ·
**Y** YUNA · **A** AURON", all three letters. The results text scrape shows the same "T Tidus / Y Yuna /
A Auron". But `w3-portraits.json` returns **200** for all four of those portraits, and `clip.json` shows the
letter is a `span` clipped *underneath* the face layer (`.ig-ctb__tile`, `.ig-stat__face`).
Diagnosis (this is a correction to two auditors who read it as missing art): the portraits are **not**
missing — the face layer has not decoded by the time the battle-start card animates in, so the fallback letter
is what the player sees. Yuna wins the race in Chapter 1 and loses it in Chapter 2.
Where: the face fallback in `src/ui/common/portrait.ts` and the battle-start/results roster strips.
Fix: preload and `decode()` every party portrait during the chapter load, before the battle-start card is
allowed to animate; and make the letter fallback visibly a loading state rather than a finished tile. An e2e
case should fail if any roster face is still showing its letter 500 ms after the card settles. **Case: both.**
Costs: Part C presentation 5.5 (w30); cohesion 4.4 (w5); UI polish 5.0 (w5).

**31. MAJOR — character and visual.** *Three shipped Yunalesca paintings have an opaque white studio background
that the loader mattes at runtime, and says so on the live console.*
Repro: play Chapter 2 on the live site and read the console (`writing-story/w5-yunalesca.json` `warn`):
`[painted] /pyrefly-reprise/art/characters/yunalesca-1/ko.png still had an opaque white studio background;
cleaned it at load time. Regenerate the PNG with a proper alpha matte.` — same for `yunalesca-3/idle.png` and
`yunalesca-3/hurt.png`. Yunalesca's third form is the climax of the chapter.
Fix: regenerate the three plates with a proper alpha matte through `tools/gen`, or re-run the matting step
offline and ship the cleaned files. **Note for the owner:** `yunalesca-1` is behind an approved tile, so the
replacement must keep the approved costume, palette and face exactly — this is a matte fix, not a repaint.
Add a build-time check that fails when a shipped character PNG has an opaque background. **Case: FFX only.**
Costs: character/visual 4.2 (w15); scene 7.0 (w10); Part C cast 5.8 (w15).

**32. MAJOR — audio.** *The sound bible's ducking rule is written, checkable, and implemented nowhere.*
Repro: `docs/audio/THEMES.md` rule 7 — "duck, do not fight — music drops 3.5 dB under dialogue". A repo-wide
search finds `audio.duck()` / `unduck()` called only from `src/app/screens/PauseScreen.ts`. No cutscene, no
mid-battle beat and no dialogue box ever ducks the score, so every pre/post scene in all five chapters plays
dialogue over full-volume music.
Fix: call `duck()`/`unduck()` from the dialogue box's line-start/line-end and from the mid-battle story beats,
with the 3.5 dB figure read from one constant. Unit-test that a rendered dialogue line ducks the music bus.
**Case: both.**
Costs: audio 6.0 (w15) — this is why the technical half is not a clean pass even setting the owner-score cap aside.

**33. MAJOR — replayability / cohesion.** *The live page has no link preview, and its description calls the
game "HD-2D" — the direction Bailey rejected.*
Repro: `fetch('https://baileypillon.github.io/pyrefly-reprise/')` (run this round). The only meta tags are
charset, viewport, color-scheme and
`<meta name="description" content="Pyrefly Reprise - an unofficial HD-2D fan tribute to Final Fantasy X and X-2.">`.
No `og:title`, `og:description`, `og:image`, no twitter card.
Where: `index.html`.
Fix: add `og:` and `twitter:` tags with a 1200×630 card cut from an approved painting, and change "HD-2D" to
the approved painted 2.5D wording. "A link that previews well and needs no setup" is written into the
replayability criterion, and a rejected direction naming the game on its own front door is a cohesion defect.
**Case: both.**
Costs: replayability 3.6 (w10); cohesion 4.4 (w5).

**34. MAJOR — accessibility.** *OPTIONS cannot be reached until a chapter and its cutscene have been started.*
Repro: live. On the title press Escape and P: nothing. Chapter select, Escape: goes back to title; P: nothing.
Party prep, P: nothing. Only a running cutscene or battle opens pause, the sole route to OPTIONS.
Where: `TitleScreen.ts:98` handles only confirm/start; `ChapterSelectScreen.ts` and `PartyPrepScreen.ts` treat
cancel as "back"; the pause overlay is opened only from `BattleScreen`/`CutsceneScreen`.
Fix: an OPTIONS entry on the title and on chapter select (and allow P there) mounting the same panel. A player
who needs the volume down must not sit through a loud title and 43 s of dialogue to find it. **Case: both.**
Costs: accessibility 2.6 (w8).

**35. MAJOR — cohesion.** *The dialogue box prints internal speaker ids: every FFX-2 line is spoken by
"Rikku X2" / "Yuna X2".*
Repro: live → `trigger('select:ffx2-bahamut')` → Enter at prep. First line of Chapter IV: name plate
**"Rikku X2"**, role SPHERE HUNTER, "Creepy hole, creepy ladder, creepy hallway." Same in Chapter V
("Yuna X2"). 48 `say()` lines across the two FFX-2 scripts use these ids. `shots/18-x2-name-plate.png`,
`writing-story/w4-ffx2-bahamut.json`.
Where: `src/ui/common/DialogueBox.ts:53-58` (`defaultName` splits the id on `-` and title-cases it), reached
because `src/ui/common/registerFlowScreens.ts:44-56` constructs `CutsceneScreen` with no `nameFor`; ids at
`src/story/dsl.ts:61,64`.
Fix: a display-name table beside `src/ui/common/speaker-roles.ts` mapping `yuna-x2`→"Yuna", `rikku-x2`→"Rikku",
`fayth-boy`→"Fayth"; pass it as `nameFor`. Make `defaultName` throw in dev rather than title-casing. Unit-test
that no rendered name plate matches `/\bX2\b|-/`. **Case: FFX-2 only for the two ids; the plumbing fix is both.**
Costs: cohesion 4.4 (w5); writing 7.5 (w10).

**36. MAJOR — clarity.** *The strategy guide clips mid-word and prints its own "▾ MORE" chip on top of the
clipped line; the enemy-intent panel truncates with no affordance.*
Repro: live, any chapter. Guide: "…the CTB margin the Holy / Water rhythm need[s to beat] the mount's Full-".
Intent panel, Chapter 1: third bullet ends at "Below 50% HP Seymour answers with Reflect and" with no ellipsis,
no scroll and no affordance.
Fix: make both panels scrollable with a visible affordance, or budget the copy to the box. Add a check to
CHK-009's sweep that fails on any panel whose `scrollHeight > clientHeight` with `overflow: hidden`.
**Case: both.**
Costs: clarity 3.9 (w12); UI polish 5.0 (w5).

**37. MAJOR — clarity / cohesion (CHK-007).** *Developer vocabulary is on the glass in both games.*
Repro: live. FFX: a "SCRIPTED" chip on the intent panel; "Haste is ctb × 8/16"; "stacks multiplicatively with
Magic Break down to ×0.083"; "S.LV 180"; a bare "CTB" chip on the chapter-select card a first-timer meets
before anything else. FFX-2: a boss bar with no numbers, a dim "SCAN" with no key, unexplained WM/DK/WR
dressphere codes badged over each face's chin, a lone "CRS" chip, and three ATB bars drawn on three different
left baselines so their fills cannot be compared.
Fix: one pass over every player-facing string replacing engine vocabulary with the words the games use, and a
lint that fails on a shipped string matching a known internal token list. **Case: both** — FFX-2 is the weaker
half again (CHK-020).
Costs: clarity 3.9 (w12); cohesion 4.4 (w5); onboarding 2.8 (w10).

**38. MINOR — clarity / cohesion.** *On a cold load the chapter-select cards are five flat black rectangles and
the party tiles are letter monograms for seconds, with no designed loading state.*
Repro: live, cold profile: measured pixel stdev of the card area 0.9/255 at 300 ms and at 1500 ms, 31.8 at
5000 ms (`t-cs-300.png`, `t-cs-1500.png`, `t-cs-5000.png`).
Fix: a designed skeleton in the Ink & Gold language (slab + gold rule + a shimmer), and decode the five card
images before the screen animates in — the same preload fix as #30. **Case: both.**
Costs: cohesion 4.4 (w5); clarity 3.9 (w12).

**39. MINOR — onboarding / controls.** *The title screen advertises three controls and honours one.*
Repro: live title. The strip reads "ARROWS / WASD MOVE · ENTER CONFIRM · ESC CANCEL". ArrowDown, ArrowRight,
W, A, S, D and Escape all do nothing; a mouse click at 800,700 does nothing.
Where: `src/app/screens/TitleScreen.ts:81` prints the strip; `handleInput` at `:98` handles only confirm/start.
Fix: either honour the keys (give the title a focusable PRESS ENTER / OPTIONS pair) or print only the control
that works. **Case: both.**
Costs: onboarding 2.8 (w10); controls 4.2 (w8).

**40. MINOR — encounter / harness.** *Escape backs out of the command menu in the FFX chapters but leaves both
FFX-2 chapters sitting on `screen() === 'pause'`.* **Needs confirmation.**
Repro: the encounter auditor's live harness used one key sequence for all five chapters; in Chapters 4 and 5 it
left the game paused with `logLen 1` and the boss at full HP for a 4-minute budget, so those two fights were
judged headlessly. The clarity auditor separately reports Esc working in both games (CHK-015 pass), so this may
be a harness fault rather than a game defect.
Fix: reproduce deliberately in Chapter 4 — open the command menu, press Escape once, and record `screen()` and
`overlayDepth` — before filing it against the game. **Case: to be decided once confirmed.**
Costs: nothing yet; listed so round 04 resolves it.

**41. QUESTION FOR THE OWNER — scene fidelity.** *Zanarkand Dome ships as an open-air lavender colonnade, not
Yunalesca's sealed hall.*
Repro: `shots/ch2-yunalesca-menu.png` — pale lavender sky, open columns, mist. The research describes a sealed
dark chamber.
**No action proposed.** The painting is behind an approved tile and its sha256 matches; AGENTS.md is explicit
that approved paintings are never replaced on an agent judge's say-so. Round 02 scored this against the build;
this round it is raised as a question: **Bailey, is this the Zanarkand Dome you want?** If yes, it stops being
an issue permanently and the research note should record the deliberate divergence.

---

## Proposals (need Bailey's approval; nothing here is built without a yes)

The category auditors returned **no** design proposals this round — every one of them stayed on defects, which
is the right instinct when the headline is 4.1. The chief critic adds none either, for the same reason: this
build does not need new ideas, it needs the teaching layer, two honest panels and two engine fixes. The one
thing that *does* need Bailey's attention is not a proposal but a gap:

- **Nine board tiles have no target.** Four of them (move advisor card, defeat screen, enemy next-move panel,
  cold open and taught first chapter) are surfaces that already exist in the build and are being iterated on
  blind, which is exactly what the End State First rule was adopted to stop. One options round covering those
  four would unblock issues #1, #11 and #22 and close four of the nine coverage holes at once.

---

*Round 03 written by the chief critic. No product code was changed. Throwaway harnesses, composites and
captures for this round are under `critic/rounds/round-03/`; the chief critic's own additions are
`critic/rounds/round-03/part-c/` (`phone-pause.mjs`, `build-phone-pause-390x844.png`, `pause-2000.jpg`,
`fight-pagoda.jpg`, `presentation-battle.jpg`, `phone-pause.jpg`). `critic/pending/7191674.json` is cleared by
this report.*
