# Round 2 — Chapter 3: the two verifier objections, answered

Owner key `bfa-verifiers`. Files owned and touched:

* `src/engine/tactics/braskas-final-aeon.ts`
* `tests/unit/strategy-braskas-final-aeon.test.ts`
* `src/data/ffx/builds/dreams-end.ts` (the researched-loadout revert; already
  on disk when this round opened — see §1.3)

Two verifiers had objected to the line described in
`docs/handoff/play-braskas-final-aeon.md`:

1. **canon check `pass=false`** — Yuna's Strength had been raised 20 → 28 and
   defended with a `[verified: 2 sources]` citation to
   `research/ffx-bfa-yu-yevon.md` §4.4.
2. **robustness 5/8** — seeds 5, 13 and 99 lost, all of them on link 1 against
   the 120,000-HP second form.

Both are closed. **The verifier's eight seeds are 8/8, the four gate seeds are
4/4, and the chapter now wins 972 of 1,000 contiguous seeds (97.2 %)** against
91.6 % when the objections were filed.

---

## 1. The canon objection: Yuna's Strength is §4.1's published 20

### 1.1 The two sentences, side by side

§4.1 is the section that answers *"what does a typical party have at Dream's
End?"*. Its table says **Yuna STR 20**, and it labels the whole block
`[estimate]`.

§4.4's sentence is a different question and says so in its own words:

> *"Aeon stats scale off **Yuna's** Strength/Magic, **which is why the wiki
> singles out** 'Yuna's Strength at least 28' **as the threshold** for Bahamut's
> Mega Flare plus a couple of attacks to finish the job."*
> — §4.4 `[verified: 2 sources]`

That is a **recommended floor for one particular finish** — what a player needs
if they intend to end the fight with an aeon — reported as a threshold. It is
not a statement about the typical build. `[verified: 2 sources]` attaches to
*the wiki says this threshold exists*, not to *the average party has it*.

**The verifier was right and the citation does not hold.** Reading a recommended
floor as a published typical is exactly how a preset drifts upward one citation
at a time, and it is the same move — smaller — as the ×1.5 Strength the round
before had to take back.

### 1.2 It would not even have bought what it was cited for

The sentence is about aeons scaling off Yuna. In this codebase they do not:
`dreamsEndBuild.aeons` carries its own published stat block
(`research/ffx-yunalesca.md` §12, the N=300–329 battle-count band), and nothing
in the engine derives an aeon's Strength or Magic from Yuna's. The stat's only
effect in Chapter 3 is on Yuna's own idle swing — about 490 damage against a
180,000-HP chapter, and she spends almost every turn healing anyway.

### 1.3 State on disk

`src/data/ffx/builds/dreams-end.ts:204` reads `str: 20`, with the reasoning
above in the file header. **Every offensive stat in the build is now §4.1 as
published, with no exception** — Tidus 32, Auron 42, Lulu MAG 42, Yuna 20.

Two non-damage deviations remain, both of them §4.1's own invitation
(*"the preset should be tuned so the fight is winnable"*), both unchanged this
round and both documented in that file: the **HP column** (scaled to clear
§1.5's published Ultimate Jecht Shot band, then clamped to the shared
`hp ≤ 6000 / maxHp ≤ 6500` band the whole game is held to) and **Auron's
Agility 22 → 29** (linear in turns taken, changes no damage number).

**Measured cost of the revert: none.** 12/12 on the four gate seeds plus the
verifier's eight either way.

> **Stale doc, for the orchestrator.**
> `docs/handoff/play-braskas-final-aeon.md` still describes the 28 and still
> quotes 91.6 %. It is not in this task's owned-file list, so it was left
> alone; it wants the §1 and §4.4 paragraphs and the headline number replaced
> with what is in this file.

---

## 2. The robustness objection: 5/8 → 8/8, and 91.6 % → 97.2 %

Nothing about the boss moved, and no player stat moved. The whole gain is in
**how the aeon roster is spent** — `summonNow`, and where that decision sits
inside `supportTurn`.

### 2.1 What the losing population actually looked like

The link-1 census of losing seeds (`critic/scratch/bfa-r5-autopsy.test.ts`,
outputs `bfa-r5-loss.out` / `bfa-r5-loss2.out`) says the losses were not burst
deaths and not a sustain race. They were **runs that never spent their
answers**:

* three of ten sampled losing seeds summoned **zero** aeons in battles of 900
  to 1,300 ticks;
* seed 20 died after 996 ticks and sixteen KOs with the boss still at
  **85,667 of 120,000**, five aeons unspent and both Talk charges unspent with
  them.

Round 4's rule was *hold the whole roster for the Ultimate Jecht Shot phase*
(`ultimateJechtShotPhase`, i.e. form 2 below half). That is a gate on **the
boss's** HP — and a party that is losing never gets him there. It held its
entire answer in reserve for a phase it was never going to reach.

The second half of the same bug was **ordering**. The summon branch sat *below*
`repair(HEAL_FLOOR)` in `supportTurn`, and in a chaotic link somebody is always
under 70 % of their bar, so the heal answered every one of Yuna's turns and the
summon branch was barely reachable at all. Seed 111 reached the Ultimate Jecht
Shot phase, ate three of them, and summoned nothing.

### 2.2 The change

```ts
function summonNow(engine: BattleEngine, boss: AnyCombatant): boolean {
  if (engine.state().aeonId !== null) return false;
  return bossGauge(engine, boss) >= SUMMON_GAUGE;   // 55
}
```

read **above** the routine Protect and the routine top-up in `supportTurn`, and
again in its old position below them.

Why above: anything actually about to die has already been answered —
`braskasLine` runs `repair(EMERGENCY)` before `supportTurn` is ever called — so
what the summon preempts here is a Protect and a heal of a member who is above
50 %. Both are worth nothing for the stretch an aeon holds the field, because
**§1.6's branch table is checked in order and its first row is "an Aeon is on
the field"**: no party member is targetable at all while it stands, and whatever
the charge would have been comes out as a single-target Jecht Bomber at the
summon.

Why still on the gauge: an aeon that arrives early is an aeon that is already
dead when the charge lands, and `rt.frozenPartyCtb` means the party's own CTB is
frozen for the whole time it stands, so an early summon is also a stretch of
turns the party does not get.

### 2.3 The sweep, seeds 1–400

| Rule | seeds 1–400 |
|---|---:|
| round 4: gate on the Ultimate Jecht Shot phase, summon *below* `repair` | 374/400 |
| summon *above* `repair`, still gated on the phase | 380/400 |
| **summon above `repair`, on the gauge alone (shipped)** | **387/400** |
| summon above `repair`, on distress, ignoring the gauge | 374/400 |

Rows 1 and 3 were re-measured from scratch this session and are exactly
reproducible: row 1 is `critic/scratch/bfa-r5-w1.out` + `bfa-r5-w201.out`
(188 + 186), row 3 is `critic/scratch/r5v-w1.out` + `r5v-w201.out`
(193 + 194). Rows 2 and 4 are from the round-5 variant sweep and were **not**
re-run this session.

Note what row 1 vs row 2 means: round 4 measured the phase gate on twelve seeds
and it won there, 12/12 against 9/12. But that comparison was made while the
summon sat below `repair`, so what it was really comparing was two flavours of
"almost never summon". With the ordering fixed, the gate reverses and costs
seven wins in four hundred.

### 2.4 One negative result, kept because it is counter-intuitive

**Power Break under distress was tried in the breaker's rotation and is worse.**
`formulas.ts` step 8 halves every physical hit the boss lands, and the loss
census says physical hits are what kills the party (44 Blade Blitzes on seed
34) — so "when the party is losing turns to KOs, buy fewer KOs" reads like the
obvious answer. Over seeds 1–400 it cost **five wins** (381/400 against
386/400) and lost two of the four gate seeds outright (13 and 20260916). A Power
Wave strips it every ~20 ticks against Auron's ~12-tick cadence, so it is a turn
bought back at roughly half price — and the turn it displaces is the **Zombie
swing**, which deals his damage *and* flips a pillar's next Power Wave from
+1,500 to −1,500. The comment sits at the site in
`src/engine/tactics/braskas-final-aeon.ts` so it is not re-tried.

### 2.5 The rest of the task's checklist, already in the line

Everything else the round was asked to consider was already implemented and was
re-read rather than re-invented:

| Lever | Where it lives | Status |
|---|---|---|
| Yu Pagoda handling that delays Ultimate Jecht Shot | `PILLARS_ARE_NOT_THE_FIGHT`, `tidusExclusive` | Slow both, kill neither. Slow halves the +20 %-per-Power-Wave gauge feed for the rest of the battle, which *is* the delay. |
| Overdrive / charge timing | `SUMMON_GAUGE` 55, `TALK_GAUGE` 90 | Aeon on the gauge; Talk only in the Ultimate Jecht Shot phase with no aeon standing (§1.6 saves the charges for it by name). |
| Hastega | `tidusExclusive` | Hastega for the party, single-target Haste for one revived member (140 MP will not pay for a re-Hastega per KO). |
| Cheer | `tidusExclusive` | The five-cast ladder exactly once, gated on *every* living member being short. |
| Aeon bursts with full gauges | `nextAeon` | Grand Summon when it is ready (full gauge on arrival), plain Summon when it is not. |
| Auto-Life / Life on the survivor | `dreams-end.ts` | **Auto-Life is deliberately not granted** — §4.2's own recommendation is to *"make Auto-Life a coin-flip the preset explicitly does not grant"*. `life` is granted and the line uses it. |
| Stoneproof / Softs for Jecht Beam | `dreams-end.ts`, `repair` | §4.4's *"exactly one or two"* — two pieces, Yuna and Lulu; plus four Softs, six Remedies and Esuna. `repair` cures Petrify before anything but Zombie. |
| Zombie cure after Triumphant Grasp | `repair` | First branch in the function: a Zombie is cured with Holy Water or Remedy *before* any heal, because a `heals` action on a Zombie resolves as damage. |

---

## 3. Measured, this session

Every number below was produced by a run in this session, on the shipped line,
with no overrides.

### 3.1 Robustness

| Set | Result |
|---|---|
| The verifier's eight seeds `2, 3, 5, 11, 13, 99, 1234, 7777` | **8/8**, seven links each |
| The four gate seeds `1, 7, 42, 20260916` | **4/4**, seven links each |
| Seeds 1–40 (the shipping test's net) | **39/40** (only seed 17) |
| **Seeds 1–1000** | **972/1000 = 97.2 %** |

Per 200-seed window: 193, 194, 191, 199, 195.
Before round 5, same windows: 188, 186, 187, 179, 190 → **930/1000 = 93.0 %**.
At the time the objections were filed: **91.6 %**.

**All 28 remaining losses are link 1**, which is the only losable fight in the
chapter — from the possessed aeons onward the party carries the fayth's
permanent Auto-Life (§2.3). The losing seeds are
17, 41, 43, 68, 102, 121, 168, 203, 276, 321, 354, 364, 366, 404, 407, 456,
463, 503, 554, 570, 573, 594, 730, 848, 849, 901, 923, 992.

They are grind-outs, not blowouts: mean over the sampled losses is 212,298
damage dealt to a 180,000-HP chapter against 83,571 healed back by the pillars
and 266,846 taken. The chapter is still a fight.

### 3.2 The chapter still punishes wrong tactics

`critic/scratch/verify-bfa-wrong-lines.test.ts`, four canonical seeds:

| Line | Full-chain wins |
|---|---:|
| A — shipped (control) | **4/4** |
| B — plain attack, always | 0/4 |
| C — plain attack, allowed to heal and revive | 0/4 |
| D — shipped minus the two canon lessons (ignore the Pagodas, never cure Zombie) | 0/4 |

`critic/scratch/verify-bfa-ablations.test.ts`, seeds 1–20:

| Line | Wins |
|---|---:|
| shipped | 19/20 |
| naive plain attack | 0/20 |
| ignore the Yu Pagodas only | 0/20 |
| never cure Zombie only | 10/20 |
| both wrong at once | 0/20 |

Each half of the canon lesson is load-bearing on its own, and the Pagoda half is
absolutely so.

### 3.3 Gates

* `npx tsc --noEmit` — clean.
* `tests/unit/strategy-braskas-final-aeon.test.ts` — 8/8. The 40-seed bar moved
  34 → **36** and the eight-seed block stays at **7 of 8**, so one seed of
  headroom survives an unrelated tuning change without the file going green on
  a regression.
* The three verifier harnesses plus `verify-bfa-canon`, `-preset`, `-pagoda`,
  `-hp` — 26 tests, all green.

---

## 4. Reproducing it

```sh
# the verifier harnesses
npx vitest run --config critic/scratch/vitest.scratch.config.ts \
  critic/scratch/verify-bfa-wrong-lines.test.ts \
  critic/scratch/verify-bfa-ablations.test.ts \
  critic/scratch/braskas-final-aeon-extra-seeds.test.ts

# the gate seeds, the verifier's eight, or a contiguous window
SET=gate   OUT=r5v-gate.out   npx vitest run --config critic/scratch/vitest.scratch.config.ts critic/scratch/bfa-r5-verify.test.ts
SET=verify OUT=r5v-verify.out npx vitest run --config critic/scratch/vitest.scratch.config.ts critic/scratch/bfa-r5-verify.test.ts
SET=window FROM=1 N=200 OUT=r5v-w1.out npx vitest run --config critic/scratch/vitest.scratch.config.ts critic/scratch/bfa-r5-verify.test.ts

# a link-1 census of any seed list, winning or losing
SEEDS=17,41,43 OUT=x.out npx vitest run --config critic/scratch/vitest.scratch.config.ts critic/scratch/bfa-r5-autopsy.test.ts
```

The thousand-seed sweep is five windows (`FROM=1,201,401,601,801`) and runs in
about ten seconds each; they can go in parallel.

**Capture note for anyone screenshotting a battle.** `page.screenshot` times
out mid-battle under SwiftShader: the live rAF loop starves the compositor and
no frame is produced. `critic/scratch/bfa-r5-shots2.mjs` does what
`tools/gallery.mjs freezeShot` does — `window.__pyrefly.app.stop()`, capture,
`app.start()` — which is the only thing that made a mid-fight frame land.

---

## 5. Still open, for other owners

Unchanged from the previous round, none of them this task's files:

* **Lulu's Overdrive is a dead row.** `dreams-end` lists the generic `'fury'`
  menu marker, which `execute.ts` refuses; the tactic re-shapes it the way it
  re-shapes Talk, but the builds/UI fix is still owed. (Firing it is not worth a
  turn here anyway: every `<spell>-fury` record is `targeting: 'random-enemy'`
  at a fraction of the spell's power, against 3,810 for the Doublecast it would
  displace.)
* **The enemy Overdrive gauge is not a first-class engine resource** — it lives
  on `ctx.state.flags['bfa.gauge']`, so the HUD cannot draw it.
* **Mid-chain statuses do not carry.** `setupForNextLink` carries HP, MP,
  Overdrive gauges and item counts but not statuses;
  `BattleSetup.carriedStatuses` exists in the contract and nothing writes it.
* **A sleeper nobody hits and nobody cures is asleep for ever**, at source:
  `state.ts canAct` drops a sleeper out of the CTB queue and `ticks.ts
  onTurnEnd` is the only caller of `tickDurationStatuses`.
* **The Stoneproof cross-document conflict** between this chapter's §4.4
  (*"exactly one or two"*) and `research/ffx-seymour-flux.md` §7.7.2 loadout C
  (seven) is real and still wants a research ruling. This chapter's own
  `[verified: 2 sources]` section won for this chapter's build.

---

## 6. Re-verified from a clean boot, 2026-09-18

The machine restarted mid-round, in the middle of the screenshot pass. Nothing
in §1–§5 was re-derived from notes: **every number below was re-measured from
scratch on the committed tree** (`38b0723`, working tree clean), and all of them
reproduce exactly.

| Check | Re-run result |
|---|---|
| `npx tsc --noEmit` | clean |
| `verify-bfa-wrong-lines.test.ts` + `verify-bfa-ablations.test.ts` + `braskas-final-aeon-extra-seeds.test.ts` | **19 tests, all green** |
| The verifier's eight seeds `2, 3, 5, 11, 13, 99, 1234, 7777` | **8/8**, seven links each |
| The four gate seeds `1, 7, 42, 20260916` | **4/4**, seven links each |
| Seed windows 1 / 201 / 401 / 601 / 801 | 193, 194, 191, 199, 195 |
| **Seeds 1–1000** | **972/1000 = 97.2 %** |
| `tests/unit/strategy-braskas-final-aeon.test.ts` | 8/8 |
| **`npx vitest run` (whole repo)** | **84 files, 2,854 tests, 0 failures** |

The three seeds the robustness objection named — **5, 13 and 99** — each win the
full seven-link chain (turns 472, 534 and 417).

### 6.1 The canon ruling, re-read independently

§4.1 and §4.4 were re-read from `research/ffx-bfa-yu-yevon.md` rather than from
the previous section's summary of them, and the ruling stands:

* §4.1 is the section that answers *"what does a typical party have at Dream's
  End?"*; its table says **Yuna STR 20**, and the section header labels the
  whole block **"explicitly an authored estimate"**.
* §4.4's sentence is about a different thing and says so inside itself: *"Aeon
  stats scale off **Yuna's** Strength/Magic, **which is why the wiki singles
  out** 'Yuna's Strength at least 28' **as the threshold** for Bahamut's Mega
  Flare plus a couple of attacks to finish the job."* That is a **threshold for
  one particular finish**, not the typical build.

Confirmed at source this session: nothing in the engine derives an aeon's
Strength or Magic from Yuna's — `dreamsEndBuild.aeons` carries its own published
stat block — so the 28 would not have bought even the thing it was cited for.
`src/data/ffx/builds/dreams-end.ts:204` reads `str: 20`. **Every offensive stat
in the build is §4.1 as published.**

### 6.2 The screenshot pass, and why it kept failing

This is the part the restart interrupted, and it needed two fixes that are
worth writing down for the next owner who screenshots a battle.

1. **HMR reloads the page out from under a long capture.** `bfa-r7-shots.mjs`
   died with *"Execution context was destroyed, most likely because of a
   navigation"* — an art-fleet save elsewhere in the tree reloading the dev
   server's page. Run the server with
   `npx vite --config critic/scratch/vite.nohmr-5246.config.ts` (`hmr: false`,
   `watch.ignored: ['**/*']`). `tools/screenshot.mjs` already blocks HMR by
   default for exactly this reason; the scratch capture scripts did not.
2. **Do not advance a battle on the wall clock.** `bfa-r7-shots.mjs` used
   `page.waitForTimeout` between shots, but while the page is blocked inside a
   90-second `page.screenshot` under SwiftShader the battle loop does not run
   either — so every frame that landed was `turn: 0`, including the ones that
   looked fine. Advance with `window.__pyrefly.frames(n)` in small chunks and
   poll `battleState().turn`, the way `tools/gallery.mjs` does.
   Poll tolerantly: `battleState()` is briefly null when the screen flips and
   between links, which is not a reason to stop capturing.

Two things stayed flaky even then and are worth knowing: the renderer crashes
outright (`Target crashed`) at 1280x720 — 960x540 with `--disable-dev-shm-usage`
survives — and it tends to crash *after* the first successful capture, so
**one shot per browser launch** is the reliable shape. Reaching a late turn
(~150) by pumping frames never landed inside a useful budget.

The working script is `critic/scratch/bfa-r8-shots.mjs`:

```sh
npx vite --config critic/scratch/vite.nohmr-5246.config.ts --port 5246 --strictPort &
node critic/scratch/bfa-r8-shots.mjs --seed=13 --stops=10 --width=960 --height=540 \
  --out-dir=docs/screenshots/r2-bfa-verifiers
```

**Captured** (`docs/screenshots/r2-bfa-verifiers/`):

* `02-seed13.png` — the form-1 reveal: Jecht as Braska's Final Aeon, the
  greatsword, the Dream's End sky.
* `01-seed13-turn12.png` — **the line actually running**, and the one frame that
  is evidence rather than art. Turn 12 of seed 13: **Bahamut standing**
  (`aeon: "bahamut"`), the boss at **58,889/60,000**, and **both Yu Pagodas
  alive at 5,000/5,000** — which is the "slow both, kill neither" decision of
  §1.4 visible on screen. The Ink & Gold guide panel, the CTB rail with
  portraits and the three-member party HUD all render correctly.

`01-link1-form1.png` (6 KB) and `01-seed13.png` are earlier, pre-fix captures
kept only so the failure modes above are reproducible; the first is a blank
frame and the second is a `turn: 0` frame mislabelled by the wall-clock bug.
