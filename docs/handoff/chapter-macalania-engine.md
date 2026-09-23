# Chapter: Seymour and Anima, Macalania Temple — engine + data track

**Status: engine and data complete and green. Not a playable chapter.**
No scene, no story script, no art, no music, so the chapter is deliberately
absent from `src/data/encounters.ts` and `src/data/chapter-meta.ts` and the
chapter-select grid keeps showing it as **Coming**. What exists is reachable
from the unit suites and the debug API through a dev-only registry entry in
`src/data/ffx/index.ts`.

**Game case: FFX only** [AGENTS.md rule 14]. FFX party, FFX CTB engine, FFX
aeons, FFX Nul spells, an FFX-only research document. The four engine
capabilities it added are **shared plumbing, so they are "both"**
(`critic/CHECKS.md` CHK-020) — they land in `src/battle/ffx/**`, the FFX-2 ATB
engine is untouched and gets no equivalent, and
`tests/unit/chapters/macalania-engine.test.ts` carries the absence test.

Spec: `docs/plans/chapter-macalania-review.md`. Every number:
`research/ffx-seymour-anima-macalania.md`.

---

## 1. The headline number

| Case | Seeds | Result |
|---|---:|---|
| **A-1**, before the 2026-09-21 Nul-targeting fix — the shipped `intendedStrategy` with `single-ally` Nuls | 40 | 32 wins, 80.0 % |
| **A-2** — the credible mistake (no Steal, no summon, no Nul) | 20 | **0 wins, 0.0 %**, all lost in act one |
| **A-1, current** — same tactic, Nul spells sourced to `all-allies` | 40 | **36 wins, 90.0 %** |

**A-1 now clears the 85 % target.** The number is reported, not engineered: no
boss number was touched (`memory/boss-side-fix-needs-measured-options`).

The gap between the first and third rows was **one `[estimate]` in a file this
track does not own** — see §6 question 1, now settled. Two independent,
structured web sources (Final Fantasy Wiki and GameFAQs' bover_87 walkthrough,
both accessed 2026-09-21) agree the four Nul spells are party-wide, so
`src/data/ffx/abilities/whitemagic-protect.ts` now ships
`targeting: 'all-allies'` for all four, sourced in
`research/ffx-combat-core.md` §7.5.1 and pinned by
`tests/unit/data-ffx-nul-targeting.test.ts`. This was a fidelity fix, not an
authored change: rule 6 was satisfied by the sourcing, not waived.

---

## 2. What was built

### Data (FFX only)

| File | What |
|---|---|
| `src/data/ffx/enemies/seymour-anima-macalania.ts` | The formation: Seymour `m124`, Guado Guardian `m141` ×2, Anima `m125`. 402 lines, mostly provenance. |
| `src/data/ffx/enemies/seymour-anima-macalania-abilities.ts` | 23 boss-only `AbilityDef`s. |
| `src/data/ffx/builds/macalania.ts` | The seven-character preset, four aeons, the loadout and the inventory. |
| `src/data/ffx/index.ts` | **Dev-only registry entry** — the formation, the abilities and the build, so the suites and `window.__pyrefly` can reach them. Nothing renders it. |

### Engine (`src/battle/ffx/**`)

| Seam | File | What changed |
|---|---|---|
| **Enemy Cover** | `targeting.ts` | `redirectTarget` used to early-return on any non-enemy attacker. It now has the symmetric branch: a party-side `physical` + `single-enemy` action aimed at an enemy is redirected to the first living enemy whose `ActorRuntime.coversAllyId` names it. **Magic is never covered.** |
| **Pre-summon clamp and HP floor** | `hp.ts`, `state.ts` | Two optional `ActorRuntime` numbers read at the top of `dealDamage`, the single funnel for every HP change from the damage chain. |
| **Mid-battle arrival** | `forms.ts`, `setup.ts` | `enemyToCombatant` reads `flags.hidden` as `removed: true`; new `revealEnemy(ctx, enemy, slot?)` clears both, zeroes CTB, re-normalises and emits. |
| **Gauge on being targeted** | `overdrive.ts`, `abilities.ts` | New `onTargeted(ctx, target, by)`, called once per action after the targets resolve. A heal or a debuff counts. |
| **Aeon elemental absorb** | `setup.ts` | New `AEON_INNATE_AFFINITIES` beside the existing `AEON_INNATE_IMMUNITIES`, same shape and same reason: **Shiva's hidden armour carries Ice Eater**. |
| **A petrified monster always shatters** | `abilities.ts` | Canon, `[verified: 2 sources]`, and previously a dead tool — see §4. |
| The Auto-Potion counter | `ai/reactions.ts` | One branch keyed on the Guardian script id. |
| The Talk table | `ai/index.ts` | One branch; **this chapter's own** Tidus / Yuna / Wakka set. |
| The act transitions | `engine.ts` | One call beside `runMortibsorptionIfDown`. |
| The encounter script | `ai/macalania-rules.ts`, `ai/seymour-anima-macalania.ts` | The three acts, the Guardians' branch table, Anima's three clocks, the scripted opening, the Trigger Command. Split in two for the 400-line house limit. |

### Tactic, guide and tests

- `src/engine/tactics/seymour-anima-macalania.ts` — the intended line.
- `src/data/guides/seymour-anima-macalania.ts` — the written panel content.
- `tests/unit/chapters/macalania-engine.test.ts` — 15 cases (A-3 … A-9, A-11,
  plus the guide's citation check).
- `tests/unit/strategy-macalania.test.ts` — A-1 and A-2.

**Neither the tactic nor the guide is registered.** `src/engine/tactics/index.ts`
and `src/data/guides/index.ts` are integrator-only
[docs/plans/chapter-macalania-review.md §8.1], and registering the tactic there
also trips `tests/unit/strategy-guide.test.ts`'s hard `GUIDES` count — a shared
test this track does not own. Both files carry a comment saying where their line
goes, the verifiers drive the tactic directly (which is exactly what `tacticFor`
will do once the line is added), and the guide is held to the same citation
standard the shipped five are held to, in this chapter's own test file. The
integrator adds **two lines**, in the same commit as `src/data/encounters.ts`.

### No contract change

**`src/battle/common/types.ts` was not touched, and neither was
`docs/CONTRACT-CHANGES.md`.** The preflight proposed four additive optionals
(`CombatantFlags.coversAlly`, `EnemyDef.startsOffField`, `EnemyDef.statuses`,
`AeonBuild.affinities`); all four turned out to be reachable without a schema
change, which in a ten-agent tree is worth more than the symmetry:

- Cover, the clamp, the floor and the gauge hook live on `ActorRuntime`, which
  is engine-internal and invisible outside `src/battle/ffx/**`.
- "Starts off the field" is `flags.hidden`, already documented as "a form
  waiting off-stage" and already honoured by `predicates.ts`.
- The scripted opening is applied by `applyMacalaniaSetup`, which `setup.ts`
  calls once and which is a no-op in every other battle.
- Shiva's Ice Eater is a hidden-armour table beside the hidden-Ribbon table
  that was already there.

If a later chapter wants any of these as authored data rather than script, the
four optionals in the preflight are still the right shape.

---

## 3. What the presenter needs — **not built, and it is one item**

> **Closed 2026-09-22** by the chapter's fix pass (`docs/handoff/chapter-macalania.md`,
> "Fix pass"): neither option below; an optional `BattleStage.arrive` stages an
> unstaged reveal and plays the scene's arrival director. No event or contract change.

`src/engine/BattlePresenter.ts` and the stage belong to another agent, so this
track stopped short. Exactly one thing is owed:

> **Anima's arrival is emitted as `part-restored`** (`{ partId:
> 'anima-macalania', hp: 18000, ownerId: 'seymour-macalania' }`), preceded by a
> `message` telegraph. `BattlePresenterEvents.ts`'s `part-restored` handler
> does `ctx.stage.actor(event.partId)` and fades it in — which works for a
> Pagoda that was staged at battle start and then destroyed, and **does
> nothing** for a combatant that was never staged at all, because
> `PaintedStage.stage()` skips `removed` enemies.

Two ways to close it, in order of preference:

1. **Stage `removed` enemies as invisible actors** at battle start and let the
   existing `part-restored` fade-in do the work. One change, no new event.
2. Add an `enemy-arrival` member to the `BattleEvent` union with its own
   handler. Additive, but it is a contract change and a `CONTRACT-CHANGES.md`
   line, and `forms.ts#revealEnemy` would emit it instead.

§9.4 of the research is emphatic that this is the chapter's money shot — "she
arrives from below, still bound, and the two Guardians die when she does; stage
it as a single continuous camera move and do not cut away" — so whoever takes
it should read that paragraph first. Nothing in the engine or data track waits
on it.

---

## 4. The one judgement call worth arguing with

**"A petrified monster always shatters"** is now an engine rule
(`abilities.ts`, after the existing `shatter`-flag block). §2.2 states it
`[verified: 2 sources]` and §7 row 2 is built on it.

Before it, Petrify against an enemy was a dead end. Rikku's Petrify Grenade and
Kimahri's Stone Breath both apply `petrify` at chance 254 and **neither carries
the `shatter` flag**, so a petrified Guado Guardian stood there: out of the turn
queue, but still *alive*, still Covering every physical aimed at Seymour and
still firing its 1,000 HP Auto-Potion counter. The tactic spent four turns a
fight discovering that.

It cannot fire in any shipped chapter — every other FFX enemy this project
ships carries `petrify: 255`, which the test pins — and it draws no RNG, so
seeded runs elsewhere are byte-identical. FFX-2 runs its own engine.

**It cost the chapter about two and a half points of win rate** (82.5 % without
it, 80.0 % with it, same forty seeds), because it shortens act one and act one
is where this party banks Haste, Cheer and Overdrive gauge. That is a fidelity
decision taken against a measured cost, not for one.

---

## 5. Owner-approved assumptions, each labelled AUTHORED in code

Bailey, 2026-09-21, "Yes to all recommendations". All five are one line from
being flipped, in `src/battle/ffx/ai/macalania-rules.ts`.

| # | Assumption | Constant |
|---|---|---|
| **C-2** | Seymour is **present but untargetable** while Anima is on the field | `SEYMOUR_UNTARGETABLE_IN_ACT_TWO` |
| **C-2b** | …and **nothing** may kill him while she is out, not only nothing the player can aim at — his HP floor of 1 is held through act two | same constant |
| **C-11** | The Guardians' Auto-Potion fires on **any** damage | `AUTO_POTION_ON_ANY_DAMAGE` |
| **C-14** | The ice → lightning → water → fire order **persists into act three** | `ACT_THREE_KEEPS_ELEMENT_ORDER` |
| **C-4 / G-1** | Anima's gauge: **+10 % per turn taken, +5 % per targeting** `[estimate]` | `ANIMA_GAUGE_PER_TURN`, `ANIMA_GAUGE_PER_TARGETING` |

**C-2b is the one that was not in the brief and had to be decided here.**
Measured without it on seeds 1-8: `untargetable` stops the player *aiming* at
him, but a Poison landed in act one keeps ticking 600 a turn on his own turns,
so he died in act two on **every seed** and the battle was won at turn 55 with
Anima still standing on ~14,000 HP. The middle third of the chapter never
happened. It follows from the same reading C-2 already makes, and it is
recorded here and in the code rather than buried.

Ships as a conflict recorded, not merged: **C-1** (the Guardian's rare steal —
decompile says Ether, wiki says Hi-Potion; we ship the decompile), **C-12** (the
Guardians' branch **order** is not sourced; only the set is), **C-13** (not
modelled), **G-8** (Anima's Tough/Heavy are `[single source]` and have no
member of `ImmunityFlag`; left out rather than widening a union).

---

## 6. Questions for Bailey

1. **SETTLED 2026-09-21 — the Nul spells are party-wide, sourced.** Was: "the
   Nul spells are single-target and the sources do not say whether that is
   wrong." `research/ffx-combat-core.md` §7.5 itself is still silent (no Target
   column), but two independent, structured web sources were checked and
   **agree**:

   | Source | Access date | What it says |
   |---|---|---|
   | Final Fantasy Wiki (Fandom), "Wht Magic (Final Fantasy X)" — <https://finalfantasy.fandom.com/wiki/Wht_Magic_(Final_Fantasy_X)> | 2026-09-21 | "NulBlaze ... Bestows NulBlaze status to **all members of a party**." Same wording for NulFrost/NulShock/NulTide; the same page correctly gives Shell/Protect/Reflect as single-target and Haste (one) vs Hastega (party) |
   | GameFAQs, *FFX/X-2 HD Remaster Walkthrough & Guide* (PC) by bover_87, "Abilities" — <https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/abilities> | 2026-09-21 | "NulBlaze ... Grants NulBlaze status to **all allies**." Same wording for the other three; Shell/Protect/Reflect explicitly "to one character" on the same page |

   A third, less structured source (jegged.com) was checked too: its own
   in-game-quoted description reads "on party" (agreeing), while only its
   paraphrased prose says "a team member" — an internal inconsistency in that
   one source, not a second reading on par with the two structured tables
   above. Full write-up: `research/ffx-combat-core.md` §7.5.1.

   **Applied, not just recommended.** `src/data/ffx/abilities/whitemagic-protect.ts`
   now ships `targeting: 'all-allies'` for `nulblaze` / `nulfrost` / `nulshock`
   / `nultide` (MP, rank and the one-charge/chance-254 application unchanged;
   they also stop being reflectable, matching Hastega/Slowga's treatment,
   since party-wide spells never bounce). `tests/unit/data-ffx-nul-targeting.test.ts`
   now pins `all-allies` instead of `single-ally`. Measured, same tactic, same
   forty seeds, nothing else changed: **32 wins → 36 wins (80 % → 90 %)**.

   This was shared plumbing (rule 14: "both" — the ability file is used by
   every FFX chapter; FFX-2 has its own Nul records, untouched), so every FFX
   strategy test was re-run after the change, not only Macalania's:

   | Chapter | Test | Seeds | Before | After |
   |---|---|---:|---|---|
   | 1 — Seymour Flux (Gagazet) | `tests/unit/strategy-seymour-flux.test.ts` | 40 | 26 wins, 65.0 % | 26 wins, 65.0 % (unchanged) |
   | 2 — Yunalesca (Zanarkand Dome) | `tests/unit/strategy-chapter2.test.ts` | 40 | 39 wins, 97.5 % | 39 wins, 97.5 % (unchanged) |
   | 3 — Braska's Final Aeon → Yu Yevon | `tests/unit/strategy-braskas-final-aeon.test.ts` | 40 | 39 wins, 97.5 % | 39 wins, 97.5 % (unchanged) |
   | Macalania (this track, not registered/playable) | `tests/unit/strategy-macalania.test.ts` | 40 | 32 wins, 80.0 % | **36 wins, 90.0 %** |
   | Evrae (airship deck) | `tests/unit/strategy-evrae.test.ts` | 40 | 39 wins, 97.5 % | 39 wins, 97.5 % (unchanged) |

   Only Macalania moves — Seymour's fixed, published rotation is the one
   place in the shipped tactics where a random-target elemental hit against a
   single-target Nul was costing wins; the other four chapters' intended
   tactics do not depend on Nul coverage the same way, so nothing regressed
   and nothing else improved. Chapters 1-3 and Evrae numbers above are the
   full 5-file FFX strategy-suite re-run this change owed, confirming no
   regression outside Macalania.
2. **The `blk-magic-sphere`, `special-sphere` and `ability-sphere` reward items
   have no `ItemDef` row**, so the Steal and Results banners print the raw id.
   Chapter 1 already ships `lv-4-key-sphere` the same way. Three small rows in
   `src/data/ffx/items/`, or drop the rewards. Which?
3. **SETTLED 2026-09-21 — A-1 now clears the 85 % bar.** Was: "five points
   short with the shipped data, question 1 needs a yes." Question 1's sourcing
   landed the fix instead (90.0 %, see §1 and question 1 above), so the Reflect-on-the-party
   and Auron-on-the-active-three levers this point used to point at are no
   longer needed to clear the bar.
4. **A-13, approved-target parity, is not startable.** The chapter's board tile
   is a gap. Nothing perceivable was built here, per hard rule 9.

---

## 7. Not done in this track

- **Everything the player sees or hears**: scene, story script, guide,
  portraits, backdrop, the two new audio cues. The tile is a gap and hard rule
  9 applies; the options round in the preflight's §6.4 comes first.
- **Chapter registration**: `src/data/encounters.ts`, `src/data/chapter-meta.ts`,
  `src/engine/tactics/index.ts`, `src/data/guides/index.ts`, `src/scenes/index.ts`
  and `src/audio/tracks/index.ts` stay untouched, and
  `tests/unit/strategy-guide.test.ts`'s `GUIDES` count will need bumping with
  them. That is the integrator's single commit, last, once the chapter is
  playable. The only shared file this track edited is `src/data/ffx/index.ts`,
  for the dev-only formation / abilities / build entry the suites need.
- **A-10**, the real-input browser route, and **A-12**, `tools/orphans.mjs`
  after the integrator's commit. Both belong to the integration step; until
  then this chapter's modules are imported by the data index and the tests.

  `node tools/orphans.mjs` currently names **two** of them —
  `src/data/guides/seymour-anima-macalania.ts` and
  `src/engine/tactics/seymour-anima-macalania.ts` — because it counts importers
  in `src/` and both are reached only from `tests/`. That is the two
  integrator-only registry lines and nothing else; the preflight's A-12
  anticipates it ("nine new modules, and hard rule 4 has been violated four
  times in this subsystem already"), and the two lines close it. The other
  three names in that report (`src/battle/ffx2/fixtures.ts`,
  `src/engine/shaders/SpriteShader.ts`, `src/scenes/placeholder-sprites.ts`)
  were already there.
- **A-13**, approved-target parity — see question 4.

## 7b. Fix pass, 2026-09-21 — two cases that were pinning nothing

**Game case: FFX only** [rule 14]. Both are test-integrity repairs on this
chapter's own unit file; **no product code changed** for either, and both new
cases were mutation-checked against the real code rather than assumed.

**A-7 was half tautology.** The "leaves both Remedy branches firing" half read
`learnedAbilityIds`, which is static data copied off `EnemyDef.abilityIds` and
which no code path can remove an id from — true before the Steal, after it, and
true even if both Remedy branches *had* been gated on `hasPotions`, the exact
regression §2.3 / §14 row 1 calls out. The "stops Auto-Potion" half only read
the mirrored `macalania.hasPotions.<id>` flag, not that the counter stopped. It
now measures behaviour on both sides: the robbed Guardian is beaten on for 40
decisions and fires **zero** `guardian-auto-potion` counters, then is poisoned
and reaches for a Remedy on its next turn. Checked by mutation — deleting
`macalaniaGuardianCounter`'s steal gate fails the first half (13 counters),
adding `&& hasPotions` to the Remedy branch fails the second.

**A-3 never exercised the damage cap**, and the reason it could not is worth
having on the record: **on the shipped board the cap cannot bind at all.**
`PRE_SUMMON_DAMAGE_CAP` is 5,999, Seymour's pool is 6,000 and
`PRE_SUMMON_HP_FLOOR` is 1, so `hpBefore - floor` is *also* 5,999 and the floor
alone clamps every oversized blow to the same number — deleting the
`damageCapPerHit` assignment changes no observable value in this encounter
(measured). The cap is belt-and-braces here, and any test that only swings at
the real 6,000 pool cannot tell the two clamps apart, which is how the
capability shipped untested. The case now swings a real, manufactured blow
(Strength 400, both Guardians off the board so the Cover does not eat it) twice:
once at a widened pool, where the amount comes out **exactly 5,999** and the
mutation is caught, and once at the shipped 6,000, where the board-level
consequence — alive, on exactly 1 — is what is asserted. The older A-3 is kept
and renamed to what it actually measures: the floor holding across a whole real
drive to the summon.

## 8. How it was verified

- `npx tsc --noEmit` clean of anything this track owns.
- `npx vitest run tests/unit/chapters/macalania-engine.test.ts` — 15 passed
  (13 at first writing, 15 after the 2026-09-21 fix pass).
- `npx vitest run tests/unit/strategy-macalania.test.ts` — 2 passed.
- One full `npx vitest run`.
- Every behavioural claim above was **run**, not grepped [AGENTS.md hard rule 3].
