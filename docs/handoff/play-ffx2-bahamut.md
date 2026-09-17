# Chapter 4 — Bahamut (Bevelle Underground): the winning line

**Status: winnable.** 200 wins in 200 contiguous seeds through the shipped
`intendedStrategy`, including the four measured seeds 1 / 7 / 42 / 20260916.
Nobody dies in any of the 200. Bahamut's HP, stats, abilities and AI script are
**unchanged**; the encounter is won by tactics, not by a nerf.

All section references are to `research/ffx2-bahamut.md`.

---

## 1. Where it stood

Driven by `src/engine/BattlePresenterStrategies.ts` with no encounter tactic
registered, Chapter 4 lost. Measured, seed 1:

```
outcome defeat   boss hp 6278/8400   42 player turns
command histogram: {"yuna:Cure":10,"paine:Attack":12,"rikku:Attack":8}
...
{"type":"action-start","actorId":"bahamut","abilityId":"mega-flare"}
{"type":"damage","targetId":"yuna","amount":840}   {"type":"ko","targetId":"yuna"}
{"type":"damage","targetId":"paine","amount":1133} {"type":"ko","targetId":"paine"}
{"type":"damage","targetId":"rikku","amount":803}  {"type":"ko","targetId":"rikku"}
```

That is exactly §2.4's arithmetic playing out: the generic ladder never casts
Shell, never casts a Break, and swings for ~90 a hit into 8,400 HP behind
Defense 160. The two Impulses soften the party and the first Mega Flare takes
all three. `src/engine/tactics/ffx2-bahamut.ts` exported `null`.

---

## 2. The line, in plain language

§3.1's canonical doctrine, with §3.1's own documented substitution — the
Alchemist is not in `src/data/ffx2/builds/bevelle.ts`, and §3.1 says "if
Alchemist isn't owned, a **White Mage with Shell, Protect and Curaga** covers
the role". The build already fields White Mage / Dark Knight / Warrior, so no
build change was needed and none was made.

| Girl | Dressphere | What she does, every turn |
|---|---|---|
| Yuna | White Mage | **Shell on the party first.** Then top anyone under 70% back up with Cura/Cure. Then Protect. Vigor is the 0-MP floor. |
| Paine | Warrior | **Magic Break x5 → Mental Break x5 → Armor Break x5**, then swing. Power Break is never cast. |
| Rikku | Dark Knight | **Darkness, every single turn**, down to 25% of her max HP. |

Why each of those, and the citation:

1. **Shell.** §3.3 tags it *Essential*; §2.4 quantifies it — unbuffed, the
   Impulse pair leaves everyone at 39.1% of max and the Mega Flare that follows
   is a "Total party wipe", but "under Shell *every* dressphere in the table
   survives from full HP". One cast covers all three (the White Mage's Shell is
   `all-allies`). It is re-cast the moment anyone is without it.

   **Correction to the first version of this document.** It said Shell was "the
   single action that converts a guaranteed wipe into a guaranteed survival".
   That is wrong, and §2.4's own "minimum survival budget" table says so: it
   lists **three** routes past Mega Flare — heal-only, Shell, and Magic Break
   ×5 — and calls the last two both sufficient. Measured in this engine over
   seeds 1–30 (`tests/unit/strategy-ffx2-bahamut.test.ts`, the "survival
   routes" block): Shell with **no Breaks at all** wins 30/30; Magic Break ×5
   with **no Shell and no cure spell** wins 30/30; heal-only wins 25/30, the
   marginal route, exactly as §2.4 implies. The line runs Shell *and* the Break
   ladder because §3.1's doctrine runs both, and because that combination is
   measurably the fastest and the only one with no deaths on any seed. What is
   **not** survivable is running none of them — see §5.
2. **Magic Break before Mental Break before Armor Break** is §3.3's *corrected*
   ranking, and §1.5 is the mechanic: a Break sets a stack level, not a stat —
   2 stacks a cast, cap 10, worth `(12 ± n)/12` as a multiplier inside the
   damage pipeline. Magic Break is "Best in fight": at the cap Mega Flare is
   ×0.167 and Impulse is 6.25% of current HP, which defuses the win condition
   outright. Mental Break is a flat ×1.833 on the party's magic that **does not
   care about MDef 10**. Armor Break is ×1.833 on physicals, "Good, not
   decisive". **Power Break is skipped on purpose** — §3.3 ranks it last because
   it neutralises turns 2–4, the threat that was never dangerous (~115–200 a
   hit). Each Break is itself a physical swing, so the fifteen casts are not
   lost damage.
3. **Darkness ignores Defense 160** (§3.2), hits all enemies, costs 12.5% of the
   user's own max HP and no MP. It is the single largest damage source in the
   measured runs — ~4,800–5,300 of Bahamut's 8,400 comes from Rikku. The game
   hands the player the Dark Knight sphere in this very dungeon, immediately
   before the test; §3.2 calls bypassing Defense 160 "the entire point".
4. **The countdown is the window.** §2.4: "survive → get five free turns → spend
   them on damage *and* on getting back above the Mega Flare threshold." The
   0.70 heal bar is set from §2.4's own table (under Shell the Impulse pair
   leaves 66.0%), so the top-up fires once a cycle, in the dead turns.

Two deliberate omissions, both documented in the tactic:

* **Curse is never cured.** X-2 Curse is "cannot spherechange" (§2.3), not the
  FFX Curse. This line never spherechanges, so Esuna would be a wasted countdown
  turn.
* **Nobody spherechanges.** §3.1 step 5 only reaches for a second Dark Knight
  "if the fight is still going once all four stats are capped". It never is.

---

## 3. Measured

`tests/unit/strategy-ffx2-bahamut.test.ts` (the shipped `intendedStrategy`, the
real engine and the real data, headless — the ATB `'waiting'` branch driven the
way `BattleScreenWiring.ts` drives it).

| Seed | Outcome | Player turns | Boss HP left | Alive at end | Mega Flares survived | Chained hits |
|---|---|---|---|---|---|---|
| 1 | victory | 47 | 0 | 3 | 2 | 10 |
| 7 | victory | 48 | 0 | 3 | 2 | 8 |
| 42 | victory | 50 | 0 | 3 | 2 | 8 |
| 20260916 | victory | 47 | 0 | 3 | 2 | 10 |

Measured 2026-09-17 against a tree in which several other chapter agents were
mid-flight (`src/battle/ffx2/engine.ts`, `execute.ts`, `resolve.ts`, `setup.ts`
and a new `accessories.ts` all moved during this session). Turn counts shifted
by ~20% across that window; the outcome column did not.

Bench, shipped strategy, seeds 1–200:

```
BENCH200 wins=200 (100.0%) avgTurns=48.0 avgChainedHits=8.6 noDeaths=200
losses: none
```

MAG Down, MDEF Down and DEF Down all reach the stack cap of 10 on every one of
the four seeds, which is the test's proof that the win is the researched line
and not a fluke.

**The counter-tests, measured over seeds 1–30:**

| Line | Result | Where it ends |
|---|---|---|
| Mash **Attack** only (§1.2, §3.3 "Poor") | **0/30** | defeat at ~41 turns, 3,568–3,749 HP left |
| **Darkness every turn, no Shell, no Break, no heal** | **0/30** | defeat at ~26 turns, on the *first* Mega Flare, ~2,760–4,398 left |
| Shell route (no Breaks) | 30/30 | victory, ~55 turns |
| Magic Break route (no Shell, no cure spell) | 30/30 | victory, ~48 turns |
| heal-only route (no Shell, no Breaks) | 25/30 | the marginal route |
| **Shipped line** (both levers) | **30/30**, 200/200 on the bench | victory, ~48 turns, nobody dies |

The second row is the one that matters and the one the first round was missing:
**routing around Defense 160 is necessary and not sufficient.** That line plays
§3.1 step 3 and §3.2's entire argument — the best damage command in the fight,
every single turn — and dies *faster* than the mashing party, because better
damage without mitigation just means arriving at Mega Flare sooner.

Bahamut is a **standalone** encounter — no `nextGroupId`, already asserted in
`tests/unit/data-ffx2-vegnagun-chain.test.ts` — so the chain here is one link and
"the chain completes" means reaching `battle-over` inside that one group. The
FFX-2 **Chain multiplier** (`src/battle/ffx2/chain.ts`) does engage: 8.6 chained
hits a run on average, each at ×1.45 or better.

---

## 4. Two engine bugs found and fixed

Both are written up in `docs/CONTRACT-CHANGES.md` under
**2026-09-17 — FFX-2 `validTargets` is the legal pool…**, because other chapter
agents run against the same engine.

### 4.1 `validTargetIds` returned one target, not the pool

`src/battle/ffx2/targeting.ts`. `AvailableCommand.validTargets` is the cursor's
candidate list — `src/ui/ffx2/CommandMenu.ts:238` and
`src/ui/ffx/CommandMenuLogic.ts:153` both read it that way, and
`src/battle/ffx/commands.ts` fills it that way. The FFX-2 version computed it by
running `resolveTargets` with a stub RNG, which is correct for `self` and the
`all-*` modes and wrong for every `single-*` mode, because `resolveTargets`
exists to *choose*: it returned `[pool[0]]`.

What that looked like in play — the White Mage's first menu, seed 1, before the
fix:

```
[whitemagic] Cure   :: x2-white-mage-cure   targets=yuna
[whitemagic] Shell  :: x2-white-mage-shell  targets=yuna,rikku,paine
[whitemagic] Cura   :: x2-white-mage-cura   targets=yuna
```

Shell is `all-allies` and offered all three; Cure and Cura are `single-ally` and
could only ever be aimed at Yuna. **The healer could not heal anybody else**,
through the menu or through any tactic, because both read this list. On a
multi-part boss the same bug pins every single-enemy row to the first part. Now
`single-enemy` / `single-ally` / `single-any` return their full pools.

### 4.2 Bahamut's party-wide magic could be evaded

`src/battle/ffx2/abilities-core.ts`. The engine's guard is `canMiss !== false`,
so an absent flag means "can miss". `src/data/ffx2/enemies/bahamut-abilities.ts`
carries `canMiss: false` on Curse, Impulse and Mega Flare — but
`src/battle/ffx2/ai/bahamut.ts` submits the **engine-side** ids
(`bahamut-curse`, `impulse`, `mega-flare`), so the record actually consulted was
the fallback table, which omitted the flag. Measured, seed 1:

```
{"type":"action-start","actorId":"bahamut","abilityId":"impulse"}
{"type":"miss","targetId":"yuna","sourceId":"bahamut","reason":"evaded"}
```

Party-wide fractional magic, dodged. §2.2 gives Impulse and Mega Flare
`Targets: All 3` with no accuracy term, and §1.1 is explicit that the evadable
move is the *physical* one — it is the whole reason his Accuracy is implemented
as 0 and Thief's Evasion 19 matters. The three fallback entries now carry
`canMiss: false`. **This made the fight harder, not easier**, and the line still
wins 200/200.

---

## 5. Open items this chapter did not fix

Not load-bearing on the win, but they cap how good the line can get, and none of
them is Chapter 4's file to change.

1. ~~**The FFX-2 command menu offers no Item rows at all.**~~ **CLOSED — this
   was true when the first round measured it and is false now.** An Item
   submenu landed in `src/battle/ffx2/targeting.ts buildCommands` while this
   chapter was in flight (wired in `engine.ts` as
   `inventory: inventoryCounts(this.battleState)`, cited there to
   ffx2-vegnagun-shuyin §7.2 / ffx2-combat-core §3.15). Measured now, every
   seat's first menu carries eight enabled item rows with full target pools —
   Potion, Hi-Potion, Phoenix Down, Ether, Remedy, Holy Water, Lunar Curtain,
   Light Curtain. So §3.3's "Potions / Hi-Potions … Core sustain" is playable,
   and **there is a revive**: with Yuna and Rikku down the shipped tactic
   answers `{"kind":"item","id":"x2-phoenix-down","targets":["yuna"]}`
   (`critic/scratch/bahamut-r2-revive.test.ts`). The tactic now also reaches for
   a Hi-Potion when the White Mage is out of MP and when the Dark Knight is
   under the Darkness HP floor. Neither ever fires in a shipped run — nobody
   dies and nobody runs dry — so the win does not depend on the inventory.
2. **Silver Hourglass is still not in the build.** §3.3 calls it "the strongest
   single item in the fight" — Slow lands on Bahamut, and because his script is
   action-counted it stretches the whole 12-action loop (§3.4). `bevelleBuild`'s
   inventory is §4.7's `[estimate]` baseline and does not include one; adding it
   would be a build *change*, not a researched-loadout *correction*, so this
   chapter left it alone. Whoever owns the FFX-2 item tables may want it.
3. **`'bahamut'` is not a unique combatant id across the two games.** FFX's aeon
   Bahamut is also `'bahamut'` (`src/data/ffx/aeons/index.ts:108`), so
   `tacticFor` could in principle match an FFX battle in which Yuna summons him.
   Every FFX boss id sits ahead of this entry in `TACTICS`, so the lookup is
   correct today; the tactic additionally returns `null` unless the `'bahamut'`
   it found is on the enemy side. A registry keyed by encounter id rather than
   by boss combatant id would remove the hazard.
4. **Nine failures elsewhere in the suite, none of them Chapter 4's — proven,
   not assumed.** `tests/unit/presenter-playback.test.ts` (2: "the intended
   strategy spends a ready Overdrive", "beats the enemy faster than mashing
   attack") and `tests/unit/strategy-braskas-final-aeon.test.ts` (7, all on the
   chain's `links` count — 3 or 6 where the file expects 7). Chapter 1's
   `src/engine/tactics/seymour-flux.ts` and Chapter 3's
   `src/battle/ffx/ai/braskas-final-aeon.ts` / `src/data/ffx/enemies/braskas-final-aeon.ts`
   are both being edited concurrently. **Verified**: with
   `src/engine/tactics/ffx2-bahamut.ts` replaced by `export const ffx2Bahamut =
   null` and the file re-run, the same 9 fail. `tacticFor` also cannot pick this
   chapter's tactic in a Braska chain — every chain boss id is registered ahead
   of `'bahamut'` in `src/engine/tactics/index.ts`, and this tactic additionally
   bails unless the `'bahamut'` it found is an enemy.
5. **A transient `npx tsc --noEmit` error that is not this chapter's.**
   `src/engine/tactics/seymour-flux.ts(237,11): error TS6133: 'cureInHand' is
   declared but its value is never read` appeared mid-session while that file
   was being written (its mtime moves between runs). `tsc` was clean before it
   and this chapter's files are clean in isolation.

---

## 6. Files

| File | Change |
|---|---|
| `src/engine/tactics/ffx2-bahamut.ts` | the line, replacing the `null` placeholder; round 2 corrected its Shell claim, its stale "no item rows" comment, and added the §3.3 Hi-Potion sustain floor |
| `tests/unit/strategy-ffx2-bahamut.test.ts` | new — 4 seeds, 40 contiguous seeds, **two** losing-tactic counter-tests and the three-survival-route census |
| `src/battle/ffx2/targeting.ts` | `validTargetIds` returns the pool for `single-*` |
| `src/battle/ffx2/abilities-core.ts` | `canMiss: false` on Curse / Impulse / Mega Flare |
| `docs/CONTRACT-CHANGES.md` | both engine changes recorded |
| `critic/scratch/bahamut-*.test.ts` | the autopsy, line-search, counter and bench harnesses |
| `critic/scratch/bahamut-r2-*.test.ts` | round 2: the damage/ATB-cadence probe, the variant sweep, the menu-row dump and the revive probe (each writes a `.out` beside itself) |

`src/data/ffx2/enemies/bahamut.ts`, `bahamut-abilities.ts`,
`src/battle/ffx2/ai/bahamut.ts` and `src/data/ffx2/builds/bevelle.ts` are
**untouched**.

---

## 7. Round 2 — what the verifier escalated, and what it turned out to be

The verifier raised three blockers. All three are answered here, two of them by
agreeing with the verifier and fixing what was wrong.

### 7.1 "The named canonically-wrong line wins" — half right, and the half that
was right is now tested

The verifier measured a line that caps the Break ladder, spams Darkness and
never casts Shell, and found it winning 4/4 and 40/40. **That is not a hole**:
§2.4's survival table lists Magic Break ×5 as one of its three routes and says
"everyone survives trivially". The verifier's own note concedes this — "these
lines still run the full Break ladder, which §3.3 itself calls *best in fight*".

What *was* wrong was this document, which claimed Shell was the unique answer.
§2 is corrected, and §3 now tests all three routes and both losing lines instead
of a single counter-example.

**One measurement worth passing on, because it bit both harnesses.** A driver
that falls back to "any enabled row" when its line declines will now pick an
**item**, because the item rows exist (§5.1). The White Mage dressphere has no
Attack row at all, so a "healer does nothing" variant quietly ends up drinking
Potions and casting Vigor. Re-measured with items excluded from the fallback,
the Break-only line with a genuinely idle White Mage drops from 30/30 to 9/30.
The harness in `tests/unit/strategy-ffx2-bahamut.test.ts` excludes item and
sustain rows from its fallback for exactly this reason, and says so in a comment
at the `filler`.

### 7.2 "The Item menu exists, so two blockers are stale" — agreed, and fixed

Confirmed and closed; see §5.1. The tactic's source comment, this document and
the tactic's behaviour have all been brought into line with the engine as it
stands.

### 7.3 Nothing in the encounter data or the engine changed this round

`src/data/ffx2/enemies/bahamut.ts`, `bahamut-abilities.ts`,
`src/battle/ffx2/ai/bahamut.ts` and `src/data/ffx2/builds/bevelle.ts` remain
untouched, and no new engine edit was made — the two recorded in §4 are the
only ones this chapter has ever made. Bahamut's output was re-verified against
the research instead:

| Ability | §2.2/§2.3 prediction for this party | Measured, unbuffed, seed 1 |
|---|---|---|
| Mega Flare → Paine (MDef 8) | ~1,165 | **1,133** |
| Mega Flare → Rikku (MDef 92) | ~792 | **825** |
| Mega Flare → Yuna (MDef 146) | ~551 | **570** |
| Impulse | 35.2–39.7% of *current* HP | **36.1%, 36.2%** |
| Attack | ~115–200 | **98–178** |
| 12-action loop | Curse, 3 × Attack, 2 × Impulse, 5 × countdown, Mega Flare | census per cycle: `{curse:1, attack:3, impulse:2, countdown:6, mega-flare:1}` |

(The countdown census reads 6 per cycle because step 12 emits a `charge` event
with the value 0 immediately before Mega Flare, which is the UI badge, not a
sixth dead turn.) The damage model is the researched one; the fight is hard in
the way §2.4 says it is hard.
