# Sin as two chapters: the build plan (FFX only)

**Game case: FFX only** (AGENTS.md rule 14). Both chapters run on CTB, Cid's Trigger Command, the
airship range, aeons, Armor and Mental Break, and a boss with a turn clock that ends in a scripted
Game Over. FFX-2 has none of these (`research/ffx-sin.md` §0.3). Nothing in any FFX-2 chapter changes.
The engine seams below are FFX plumbing, and each one is inert in every other battle.

**What Bailey decided** (every item is in `docs/target/decisions.json`):

- **D-263** (2026-09-27, "all your recommendations"): concept A is the end state, reached through B.
  Link 4 comes first, is benched, and ships unlisted. Links 1 to 3 follow and reuse Evrae's range
  command.
- **D-264** (the same answer): the party is `garden-of-pain.ts` with Yuna's Tetra Ring back (S-29,
  our estimate). It is built as `src/data/ffx/builds/sin-fahrenheit.ts`.
- **D-270** (2026-09-27 ~15:20 EDT, "all your recommendations"): concept C, split where the game saves.
  Chapter one is "Sin: the Fins and the Core" (links I to III on one party state, ending at Sinfall).
  Chapter two is "Sin: the Face" (it opens on the deck with Yuna's scene and runs link IV).
- **D-266** (open): Giga-Graviton on Sin's 12th or 13th turn (S-1). The default is the **13th, labelled
  our estimate**, until Bailey schedules the Steam check.
- **Bailey, 2026-09-28 ~22:00 EDT:** "please work on implementing all remaining chapters that we
  decided upon". Tonight's rule 9 limit: **nothing new gets LISTED**. Both chapters stay unlisted behind
  the switch until Bailey picks the art, the HUD clock and the titles.

**Where the work lives:** branch `chapter-sin`, worktree `D:/pyrefly-ch-sin`. Origin/main (Chapter
XVI = Ixion at Djose, listed) was merged in at `56026029`. In that merge, Sin kept its id `sin` and
took the next number, **17**, and `Chapter.number` on main already widens to 17.

**Sources:** every number below is `research/ffx-sin.md`'s, with its tag. **§** refers to that file
unless a path is given. *Our estimate* marks anything we judged ourselves; each one is a named constant
in the code, listed in an `*_ASSUMPTIONS` array, and shown to Bailey. Nothing is tuned (hard rule 6).

---

## 1. The split

### 1.1 The two records

| | **Chapter XVII — "Sin: the Fins and the Core"** | **Chapter XVIII — "Sin: the Face"** |
|---|---|---|
| id | `sin-fins-core` (new) | `sin-face` (**renamed** from `sin`; see 1.4) |
| number | 17 | 18 (widens `Chapter.number` by `\| 18`, additive, rule 2) |
| file | `src/data/chapter-sin-fins-core.ts` (new) | `src/data/chapter-sin-face.ts` (`git mv` of `chapter-sin.ts`; CHECK finding 1) |
| title (card) | "Sin: the Fins and the Core". This is D-270's working title, and Bailey confirms it at listing | "Sin: the Face" (D-270, working title) |
| subtitle (our summary, one clause, no period) | "Two arms, a shield and a core, with no rest between them" (§1.2) | "Before the mouth is fully open" (kept; §5.4) |
| location | "Deck of the Fahrenheit, then Sin's back — in flight" (§9.1: links 1 to 2 are on the outer deck in flight, and link 3 is on Sin's back; `[single source]` for the back) | "Deck of the Fahrenheit — above Bevelle" (kept; §9.1 `[verified: 2 sources]`) |
| blurb | Our summary of §9.2 beats 1 to 7, with no line quoted | Kept (beats 8 to 10, summarised) |
| links | 1 Left Fin → 2 Right Fin → 3 Sinspawn Genais + Sin's Core, chained by `nextGroupId` | 4 Overdrive Sin (built, `overdriveSinGroup`) |
| formations (§ header, `[decompiled]`) | `sin-left-fin` = [left-fin, cid]; `sin-right-fin` = [right-fin, cid]; `sin-genais-core` = [sinspawn-genais, sin-core] | `overdrive-sin` = [overdrive-sin] (unchanged) |
| party | `sinFahrenheitBuild` (D-264). It starts rested, after Rin's shop (§7.3 item 5) | `sinFahrenheitBuild`, rested (§1.2 `[verified: 2 sources]`) |
| sceneKey | `evrae-airship-deck`, a **placeholder** labelled in the code (the same ship; see 3.1) | `evrae-airship-deck`, a **placeholder** (unchanged) |
| thumbnailKey | `chapter-sin-fins-core` (no card is drawn while unlisted) | `chapter-sin-face` |
| music | stand-ins, labelled (see 3.6) | stand-ins, labelled (unchanged) |
| sensorTexts | copied from the enemy records' own `sensorText` (writing-bible §5.3: 20 words or fewer, no stats, no Trigger Command) | unchanged |

### 1.2 What carries, and what does not

- **Inside Chapter XVII, links 1 → 2 → 3 carry everything.** That means HP, MP, statuses, Overdrive
  gauges, aeon HP and items. It is §1.2 `[verified: 3 sources]`, with buffs `[derived]`: nothing in the
  sources clears them, and Negation does.
  - The FFX chain carry today (`BattleScreenSetup.ts#carryFfx`) moves HP, MP, gauges, aeon HP and
    items, **not statuses**.
  - Package S adds the status carry behind the existing `EnemyGroupDef.carriesPartyState` flag, which
    today only FFX-2 reads. `sin-right-fin` and `sin-genais-core` set it, and no other FFX formation
    sets it, so Chapters II, III and every FFX chain carry exactly as before.
  - `FFXMemberBuild.statuses?` and `FFXAeonBuild.statuses?` already exist, so the carry fills a field
    that is already in the contract.
- **Between XVII and XVIII, nothing carries.** The game's own break sits here. After the Core falls,
  the player can save, shop and re-equip (§1.2 `[verified: 2 sources]`), so link 4 starts rested.
  - Chapters are free to pick in any order, and Chapter XVIII already opens rested on the same preset.
  - The save point *is* the split, so no save data crosses it. This follows D-270: "the split is the
    game's own save, not an invented break".
- **The retry inside XVII.** The game has no save between links 1 and 3 (§1.2), so the faithful retry
  starts again at the Left Fin, and that is the default.
  - The bench (5) measures how long that is.
  - A checkpoint at link 3 (the FFX-2 `checkpointOnEntry` shape) is an option for Bailey, not the
    default (open question Q3).
- **The re-equip at the top of XVIII.** The Right Fin's Stoneproof drop (§2.4) is **not built**:
  - which part of it drops is a coin the game rolls, and that is `[unsourced]`;
  - equipment drops are not modelled anywhere (S-7).

  The prep screen stays as every chapter has it (Q10).

### 1.3 The Garden of Pain preset (D-264)

- `sinFahrenheitBuild` is used unchanged for both chapters. It is `garden-of-pain.ts` with Yuna's
  Tetra Ring back.
- Its HP runs from 4,750 to 6,492. All seven members have Piercing.
- It blocks Gaze: Stoneproof on Yuna and Lulu, Confuse Ward on Tidus and Yuna.
- The opening line-up is Tidus, Yuna and Auron (§7.2).
- The five story aeons are in, with the preset's gauges.
- Every stat cell is `[estimate]` by construction (§7.2).
- Tidus is in front, which is also what the Trigger Command needs: Tidus and Rikku own the order
  (§4, `[verified: 4 sources]`).

### 1.4 Renaming `sin` to `sin-face` (CHECK finding 1)

- `sin` has only ever existed on this branch. It was never on main, never listed and never in a save.
  Renaming it therefore touches no player data.
- The union loses `'sin'` and gains `'sin-fins-core' | 'sin-face'`. That is a rename of an id that
  was never shipped, and it is recorded in `docs/CONTRACT-CHANGES.md` as exactly that.
- Everything that names it moves in the same commit:
  - `learn/atlas/cites.ts` (three records);
  - `tests/unit/learn-atlas-data.test.ts`;
  - `tests/unit/chapters/sin-engine.test.ts` and `sin-bench.test.ts`;
  - `docs/handoff/chapter-sin.md`.
- The old comment glued to the Den of Woe line (CHECK finding 3) was already fixed in merge
  `56026029`.
- CHECK finding 4 (the untracked `tests/unit/zz-scratch/sin-probe*.test.ts` break `tsc` here) is
  handled by filtering them out of each builder's `tsc` read-out. No deletes (tonight's rule).

---

## 2. Engine and data packages (FFX only; `src/battle/**` and `src/data/**` import no DOM and no `three`, and stay seeded-deterministic: hard rule 1)

### 2.1 How the hooks get in without growing files over 400 lines

`engine.ts` (465 lines), `setup.ts` (402), `abilities.ts` (419) and `simulate.ts` (531) are already over
the house limit. The rule is that they may change in place but may not grow. So every Sin hook enters
through **one existing line swapped for an aggregator call**, and the aggregators live in new small
files:

| Existing line | Becomes | New file |
|---|---|---|
| `setup.ts`: `applyOverdriveSinSetup(ctx);` | `applySinSetups(ctx);` | `src/battle/ffx/ai/sin-setup.ts` calls the Overdrive Sin, Fin and Genais/Core setups |
| `reactions.ts`: `for (const c of collectOverdriveSinCounters(ctx, attacker))` | `for (const c of collectSinCounters(ctx, attacker, def, damagedEnemyIds))` | `src/battle/ffx/ai/sin-counters.ts` collects all three |
| `simulate.ts`: `markEvraeRuntime(state.flags, rt.actors);` | `markAirshipRuntime(state.flags, rt.actors);` | `sin-setup.ts` calls `markEvraeRuntime` and then `markSinRuntime`, so a rebuilt runtime gets the Sin marks too (the `markEvraeRuntime` lesson) |
| `ai/index.ts`: `import './overdrive-sin.ts';` | `import './sin-scripts.ts';` | `sin-scripts.ts` imports `overdrive-sin.ts`, `sin-fins.ts` and `sin-genais-core.ts` (each file registers its own scripts) |

- **`engine.ts` does not change.**
  - "Victory when the Core dies with Genais standing" is done by marking Genais a non-combatant at
    that instant, which is the way Cid is not waited for.
  - "Magic absorbed." is done by toggling `immune-to-magical-damage` on the Core's own
    `immunityFlags` copy while Genais lives. `formulas.ts:269` already honours it.
- **Contract files touched:**
  - `encounters.ts`: the ids and `| 18`, both on existing lines, so the file stays at 399 lines.
  - `types.ts`: the `carriesPartyState` doc comment gains "FFX too, statuses only (Sin links 2 and 3)".
    The doc is edited in place, and the shape does not change.
  - Both get one `docs/CONTRACT-CHANGES.md` entry.

### 2.2 Package S — the spine

**Owner:** one Opus agent. It goes **first**, and everything else branches from it.

**Files (S owns all of them):**

- **Chapter records and ids:**
  - `src/data/encounters.ts` (ids and `| 18`);
  - `src/data/chapters-unlisted.ts` (both records);
  - `src/data/chapter-sin-face.ts` (the `git mv` from `chapter-sin.ts`: renamed, renumbered 18, and
    `title: 'Sin: the Face'`);
  - `src/data/chapter-sin-fins-core.ts` (new).
- **Enemy data:**
  - `src/data/ffx/enemies/sin-fins.ts` and `sin-fins-abilities.ts`;
  - `src/data/ffx/enemies/sin-genais-core.ts` and `sin-genais-core-abilities.ts`;
  - `src/data/ffx/index.ts` (the three groups in `ENEMY_GROUPS_BY_ID`, and the ability records).
- **Hooks and shared names:**
  - `src/battle/ffx/ai/sin-ids.ts`: every enemy id, formation id, script id and `state.flags` key
    the other packages share, with **constants only**.
  - `sin-setup.ts`, `sin-counters.ts` and `sin-scripts.ts` (the aggregators, 2.1).
  - **Stubs with their final signatures:** `sin-fins.ts`, `sin-fins-rules.ts`, `sin-genais-core.ts`
    and `sin-genais-core-rules.ts`. Each stub registers a script that returns `null` and exports a
    no-op setup and collector. Package F fills the Fin files and package G the Genais/Core files.
  - The four one-line swaps in `setup.ts`, `reactions.ts`, `simulate.ts` and `ai/index.ts`.
  - The two story stubs `src/story/scripts/sin-fins-core.ts` and `sin-face.ts`, each exporting
    `pre: [battleStart()]`, `post: [results()]` and so on, so the records can import them now and
    package P fills them.
- **The carry and the tests that follow it:**
  - `src/app/screens/BattleScreenSetup.ts#carryFfx`, which carries statuses when
    `nextGroup.carriesPartyState === true`;
  - `learn/atlas/cites.ts` and `tests/unit/learn-atlas-data.test.ts`;
  - the renames in `tests/unit/chapters/sin-engine.test.ts`, `sin-bench.test.ts`,
    `tests/unit/helpers/sinUnits.ts` and `sinPolicies.ts`.
- **Records:** `docs/CONTRACT-CHANGES.md` and `docs/handoff/chapter-sin.md` (the rename, and the Open
  list reworded to the D-270 split).

**Data, row by row.** Every row is `canMiss: false`: §3 says "Always hits" on every row, and rule 5
applies.

The stat blocks (§2.1, `[decompiled]` + 4 guides, `[verified: 5 sources]` for HP):

| | Left Fin | Right Fin | Genais | Core |
|---|---:|---:|---:|---:|
| HP | 65,000 | 65,000 | 20,000 | 36,000 |
| MP | 999 | 999 | 200 | 999 |
| Overkill | 10,000 | 10,000 | 2,000 | 3,000 |
| STR | 30 | 30 | 30 | 1 |
| DEF | 100 | 100 | 80 | 100 |
| MAG | 30 | 30 | 35 | 30 |
| MDEF | 50 | 50 | 50 | 100 |
| AGI | 20 | 20 | 25 (S-18: the decompile, not the wiki's 26) | 20 |
| Luck / Eva / Acc | 15 / 0 / 0 | the same | the same | the same |
| Armored | yes | yes | no; **yes inside its shell** (§5.3.1 item 4) | yes |
| Percentage-immune | yes | yes | no; yes inside its shell | yes |

- **Resistances and elements** follow the §2.2 and §2.3 tables cell for cell.
  - Genais is weak to Fire and absorbs Water.
  - Genais: Zombie 80, Silence 100, Power and Magic Break 0, Armor and Mental Break 255, Slow and
    Haste 0, Doom 0 (count 30).
  - Threaten is immune on all four (S-6, the Evrae C-4 shape, a labelled default).
  - The Core is Reflect-immune.
- **Rewards (§2.4):**
  - Gil 10,000 each.
  - AP: Left 16,000 (24,000); Right 17,000 (25,500), with S-4 resolved; Genais 1,800 (2,700); Core
    18,000 (27,000).
  - Steals and drops as the table gives them. Bribe is immune.
  - Equipment drops are not built (S-7, the same as link 4).
- **The Fin rows (§3.1):**

  | Row | Id | What it is |
  |---|---|---|
  | 6:146 | `sin-fin-ram` | Strength, base **28**, whole party, physical, `strong-delay` (the flag exists: `abilities.ts:351`), NEAR |
  | 6:147 | `sin-fin-smack` | Strength, base **34**, whole party, physical, `long-range`, FAR |
  | 6:144 / 6:182 | `sin-fin-gravija` | `percent-current` **12/16**, whole party, magical, `always-break-damage-limit` |
  | 6:166 / 6:184 | `sin-fin-gravija-far` | no damage, `long-range` |
  | 6:145 | `sin-fin-negation` | targeting `all` |
  | 6:167 | `sin-fin-negation-far` | targeting `self` |
  | 6:168 / 6:186 | `sin-fin-gathers` | "Core gathers energy." |
  | 6:188 | `sin-motionless` | "Sin remains motionless." |

  - **Negation's removal list** is §3.1's, verbatim: it removes 25 statuses. It does **not** remove
    Death, Doom, Curse, Auto-Life, Eject, or the Cheer and Focus stacks.
  - `[verified: 2 sources]` + `[decompiled]`.
- **The Genais rows (§3.2):**

  | Row | Id | What it is |
  |---|---|---|
  | 6:151 | `sin-genais-venom` | Magic formula, base **32**, one random member, **physical type**, Poison 100 % (S-3: Poison only) |
  | 6:152 | `sin-genais-thrashing` | Strength, base **32**, whole party, physical, `crit-eligible` |
  | 6:150 | `sin-genais-sigh` | Magic, base **24**, whole party, magical, Darkness 100 % for 3 turns |
  | 3:76 | `sin-genais-waterga` | Magic, base **42**, the caster, Water, reflectable, silenceable, shatter 10 |
  | 3:44 | `sin-genais-cura` | healing, base **40**, self, reflectable |
  | 6:154 / 6:153 | `sin-genais-shell-in` and `-shell-out` | system lines |
  | 6:155 | `sin-magic-absorbed` | a system line |

  Curaga and Watera are in the menu list but unassigned: they are not built (the Y-4 rule).
- **The Core rows (§3.3):**

  | Row | Id | What it is |
  |---|---|---|
  | 6:189 | `sin-core-inactive` | "Core is inactive." |
  | 6:196 | `sin-core-gathers` | "Core gathers energy." |
  | 6:148 | `sin-core-gravija` | `percent-current` 12/16, targeting `all`. It hits Genais only outside its shell, since the shell makes it percentage-immune, and the Core is percentage-immune |
  | 6:197 | `sin-core-negation` | "Counter All" |
  | 6:57 to 6:60 | `sin-core-fire`, `-blizzard`, `-thunder`, `-water` | Magic, base **16**, whole party, reflectable, silenceable (S-13: the decompile's party and 16, not SinirothX's 12) |

- **Cid** is the Evrae record (`m149`, §2.5, with the C-6 Agility conflict carried over as it is),
  with `aiScriptId: 'cid-fahrenheit-sin'` (package F). **He fires no missiles** (S-19, Gestahl, a
  GameFAQs guide; the others are silent).
- **Estimates in the data,** each named and listed:
  - rank 3 on every row (the Evrae precedent; the tables do not print rank);
  - Trigger Command rank 3, and a redundant order still burns Cid's turn (Evrae's approved C-7);
  - Venom's Poison duration, if the row does not carry one: the engine's default for the status.

**Tests that must fail first (package S):**

1. `sin-data.test.ts`:
   - `getChapter('sin-fins-core')` exists, has number 17, and `game: 'ffx'`.
   - It walks the chain `sin-left-fin → sin-right-fin → sin-genais-core` by `nextGroupId`.
   - `getChapter('sin-face')` has number 18.
   - `getChapter('sin')` is undefined.
   - Neither id is in `CHAPTER_IDS`.
2. A stat-by-stat table test of the four records against the numbers above.
3. Every Sin row has `canMiss === false`.
4. `sin-carry.test.ts` on the real engine:
   - Haste on Tidus at the Left Fin's KO is still on Tidus when the Right Fin link opens.
   - Chapter II's (Yunalesca's) chain carries **no** statuses, exactly as before.
5. Golden check: `tests/unit/tools/ffx-chapter-hashes.test.ts` gives identical hashes for every
   listed FFX chapter before and after. That is the byte-identical event-log proof the link-4 build
   used.

### 2.3 Package F — the Fins' AI and Cid without missiles

**Owner:** one Opus agent, in parallel with G and P after S merges.

**Files:** `src/battle/ffx/ai/sin-fins.ts` (the Fin script and Cid's script) and
`src/battle/ffx/ai/sin-fins-rules.ts` (constants, flags, setup, counters, `SIN_FINS_ASSUMPTIONS`). If
the Negation tunables push `sin-fins-rules.ts` near 400 lines, they go in their own
`src/battle/ffx/ai/sin-negation.ts`.

**Behaviour (§4, §5.1, §5.2, step for step from the §5.1.4 pseudocode):**

- **The range.** The Fins open at **FAR**.
  - This is S-8: Gestahl says so explicitly, and bover_87 is consistent. Both are GameFAQs guides.
  - It is a labelled default.
  - The setup publishes `airship.range = 'far'`, `airship.order = ''` and
    `airship.countsTargetings = <fin id>`. That makes the Evrae gap, the reach gate
    (`targeting.ts#reachesFoesAtRange`) and Wakka's ranged blitzball work unchanged.
  - **The Evrae-only hooks must stay inert:** `applyEvraeSetup` returns early with no Evrae, and
    `collectEvraeCounters` keys on the Evrae id. A test pins this.
- **Cid** (`cid-fahrenheit-sin`, a new script):
  - He carries out a queued order on his turn and emits the same telegraph lines as Evrae's Cid.
  - Otherwise he does nothing, with no missile economy and no "out of missiles" line.
  - Orders are Tidus's and Rikku's (§4, `[verified: 4 sources]`). The last order wins.
  - The "cancel the previous order" option (S-20, wiki only) is **not built** (Q8).
- **The hit counter** (§5.1.1):
  - The Fin counts being **targeted**. An aeon's action counts 2 (S-27, `[single source: wiki]`,
    a labelled default).
  - Near and far share the counter, and it resets when the Fin attacks.
- **Left Fin (link 1):**
  - At NEAR it attacks on 33 %, 67 % or 100 % after 0, 1 or 2+ hits.
  - At FAR it attacks only after 7+ hits.
  - The NEAR attack is Ram (strong Delay) and the FAR attack is Smack.
  - Otherwise it uses "Sin remains motionless." (§5.1.1, `[verified: 2 sources]`).
- **The Gravija cycle, NEAR only** (§5.1.2, `[verified: 3 sources]`):
  - After 3 regular NEAR actions the Fin uses "Core gathers energy.", and Gravija follows on its next
    turn.
  - It never charges at FAR.
  - A charge that resolves at FAR is the no-damage row, which is the dodge. It is a race between the
    Fin (Agility 20) and Cid in the CTB order.
  - Whether the Gravija turn counts toward the next three is S-25. Default: **it does not**, and it is
    labelled.
- **Right Fin (link 2)** (§5.2):
  - At NEAR it attacks only after 4+ hits.
  - At FAR it attacks after 5+ hits.
  - Below **16,250 HP** it latches: it always attacks at NEAR on turns without a special, FAR needs 3
    hits, and the latch holds if it is healed back above the line.
  - The latch is `[verified: 2 sources]` for the line. The FAR 3 and the "stays" rule are
    `[single source: wiki]`, and labelled.
- **Negation** (§5.1.3, S-12 **open**, so it ships behind named tunables and is never silent):
  - **NEAR:** a counter each time the Fin is targeted.
    - The chance is `max(0, c − 3) / D`.
    - `c` starts at 2. The first Break on the Fin adds 2 and the second adds 1. Each Shell, Reflect
      and Haste on the party adds 1. Protect on the rightmost member adds 1, and on the leftmost
      member adds 2.
    - `D` is **16** for the Left Fin and **12** for the Right Fin.
    - It strips both sides.
  - **FAR:** an **80 %** chance, and only while the Fin has Mental Break. It cleanses the Fin only.
  - Every number is `NEGATION_*` in the rules file, tagged `[single source: wiki]`, and in
    `SIN_FINS_ASSUMPTIONS`.
  - "Rightmost" and "leftmost" read as the last and first living party slot. That is our estimate,
    and it may be a bitfield artefact (S-12).
- **Gravija cannot kill.** `percent-current` 12/16 floors, so it always leaves a quarter, and 1 HP
  takes 0 (§3.1, `[derived]`). The engine's `percent-current` already floors. The test pins it.
- **Flags published for the HUD** (names in `sin-ids.ts`):
  - `sin.fin.hits`, `sin.fin.regularActs`, `sin.fin.charged` and `sin.fin.latched`;
  - `sin.negation.lastTaken` (the status ids the last Negation removed, per combatant). §11 item 4
    says the HUD must show what Negation took away, and that the Negation mercy is also shown: it
    cures Poison, Petrify, Slow and Darkness.

**Tests that must fail first (package F), on the real engine with fixed seeds:**

- Link 1 opens FAR. Cid has no missile turn. A Tidus order moves the ship on Cid's next turn, and the
  last order wins.
- At NEAR with no hits the Fin runs R R R, then the charge, then Gravija. Four HP pins show 75 % of
  current HP, floored, and 1 HP takes 0.
- At FAR it never charges. A charge followed by Pull Back resolving before the Fin's turn gives the
  whiff row and 0 damage.
- The FAR attack needs 7 hits (Left) or 5 (Right). An aeon's action counts 2.
- The Right Fin under 16,250 HP always attacks at NEAR and stays latched after a Cura.
- Near Negation over 400 targeted actions:
  - it fires at the tunable rate within binomial noise;
  - it removes the full list from both sides;
  - it leaves Auto-Life and Doom.
- Far Negation: 0 without Mental Break, about 80 % with it, and the Fin is its only target.
- `evrae-engine.test.ts` and the FFX golden hashes are unchanged.

### 2.4 Package G — Sinspawn Genais and Sin's Core

**Owner:** one Opus agent, in parallel with F and P.

**Files:** `src/battle/ffx/ai/sin-genais-core.ts` (both scripts) and
`src/battle/ffx/ai/sin-genais-core-rules.ts` (constants, setup, counters, runtime marks,
`SIN_CORE_ASSUMPTIONS`).

**Behaviour (§5.3, `[verified: 3-4 sources]` unless noted):**

- **Genais out of its shell:**
  - Its turns run Venom, Venom, Thrashing, and repeat.
  - It counters magic aimed at it with Waterga on the caster (SinirothX: "excluding Demi").
- **Genais going in:** on its next turn after falling to **≤ 10,000 HP**, it enters its shell. The
  code:
  - adds `armored` and `immune-to-percentage-damage` to its own `immunityFlags`;
  - emits "Enters shell.".
- **Genais in its shell:**
  - It uses Sigh on its turns.
  - It counters **every hit** with Cura on itself (about 1,480 per cast, §6).
  - It leaves the shell on its next turn once it is back at **12,000 HP or more** (S-2).
- **S-2, which way Genais leaves.** The default is the wiki reading and the in-game Scan text: Cura
  heals it and it leaves on its next turn.
  - bover_87 (GameFAQs) reads "below 12,000, it will emerge".
  - Bailey prefers GameFAQs only where nothing in-game settles a conflict. The Scan text *is*
    in-game, so the default stands, labelled.
- **Genais leaving under a charged Core** eats the Core's Gravija, because it is outside the shell and
  no longer immune.
- **The Core while Genais lives:**
  - **Magic aimed at the Core is absorbed.** Setup gives the Core `immune-to-magical-damage`, and the
    targeted hook emits "Magic absorbed." whenever a spell targets the Core.
  - Genais absorbs magic even while shelled: that is the default (S-15; three sources against
    Gestahl).
  - **The Core is out of melee range.** It uses `CombatantFlags.outOfMeleeReach = true`, which
    exists (Chapter XII), so Wakka, Valefor and magic still reach it.
- **The Core's turns:**
  - While Genais is out of its shell: "Core is inactive.".
  - While Genais is shelled: "Core gathers energy.", then Gravija on its next turn. Gravija is
    targeting `all`, so the party and an unshelled Genais take it.
  - Once Genais is dead: charge, Gravija, and repeat ("freely", §5.3.2 item 3).
- **The Core's counters when targeted:**
  - Negation comes first. Its chance per the wiki is a count: 3 for each of Armor and Mental Break
    on the Core, 1 for each Shell and Reflect on the party, 2 for each Haste, and 1 or 2 for Protect
    on the rightmost or leftmost member. Subtract 3 and divide by 8.
  - S-12 covers this formula: its units are unclear, it is recalculated on each Core turn, and it
    runs "one to six times in a row". It ships behind named tunables and is **labelled**.
  - Otherwise the Core counters with Fire, Blizzard, Thunder and Water, in that order, cycling.
  - How often the Core counters at all is S-13 and `[unsourced]` as a curve. The default is Gestahl
    (GameFAQs): it counters **every time it is targeted**. Labelled.
- **When Genais dies:**
  - the Core loses `outOfMeleeReach` and `immune-to-magical-damage`;
  - it starts its free Gravija cycle.
- **When the Core dies,** the battle ends even with Genais standing (§5.3.2 item 5,
  `[verified: 2 sources]`).
  - The code publishes `sin.core.down = true`.
  - `markSinRuntime` then marks Genais `ActorRuntime.nonCombatant`, exactly as Cid is marked, so
    `engine.ts#checkEnd` awards the victory with no engine change.
  - Genais's own rewards are not paid when it was not killed. The existing reward rule pays for
    defeated enemies only; a test pins it.
- **The Core is never hurt by its own Gravija:** it is percentage-immune (S-14, resolved).
- **Flags for the HUD:** `sin.genais.shelled`, `sin.core.state` (`inactive`, `charging`, `ready` or
  `free`), `sin.core.counterStep`, and `sin.negation.lastTaken` (shared with F; package S defines the
  name).

**Tests that must fail first (package G):**

- Genais runs V V T with the Venom target random under the seed. Venom is physical type, so Protect
  halves it.
- The shell happens on its turn at 10,000 HP or less and not before. In the shell, Cura answers every
  hit. It leaves the shell at 12,000 or more on its next turn.
- Waterga answers a Fire from Lulu, and nothing answers Auron's Attack.
- Lulu's Firaga at the Core deals 0 and shows "Magic absorbed." while Genais lives, and lands after
  Genais dies.
- Auron's Attack cannot target the Core while Genais lives, and Wakka's can.
- The Core is inactive while Genais is out. It runs charge then Gravija while Genais is shelled, and
  that Gravija hurts an unshelled Genais and never the Core.
- The Core's counter order is Negation first, then F, B, T, W, cycling.
- Killing the Core with Genais at full HP is a **victory**. The results pay the Core's rewards and
  not Genais's.
- The FFX golden hashes are unchanged.

### 2.5 The layering rule for every package

- `src/battle/**` and `src/data/**` import nothing from `src/app`, `src/ui`, `src/engine` (the
  presentation), `src/scenes` or `three`.
- The AI reads and writes only `ctx.state`, `ctx.rt` and the seeded RNG.
- Presentation reads the published `state.flags` keys and never calls into the AI.
- `docs/CONTRACTS.md` files change only as 2.1 says.

---

## 3. Presentation packages

### 3.1 Scenes (placeholders until the art is picked)

- **Links 1 and 2** stay on `evrae-airship-deck`, as a placeholder. It is the same *Fahrenheit*
  deck.
  - Its range director (`evrae-airship-director.ts`) follows `airship.range` already, but it binds
    Evrae's actor by id (`BattleScreenAirship.ts:66`, `bindEvrae(stage.actor(EVRAE_ID))`).
  - Package P changes that one call to bind the formation's counted foe. That is `left-fin` or
    `right-fin` through `airship.countsTargetings`, falling back to Evrae.
  - The Fins then take the NEAR and FAR spots with the grey boss silhouette, until they are painted.
- **Link 3 (Sin's back)** also stays on the deck, labelled. The engine's chain restages the same
  scene for every link, and a per-formation scene swap is a new presentation seam (`EnemyGroupDef`
  has no scene key).
  - It is **not built tonight**.
  - It is built only once the Sin's-back backdrop is painted and picked (Q6).
- **Link 4** is unchanged: the deck placeholder. Round 3's plate `p6` (the deck over Bevelle at dusk)
  is an option on disk, not installed.

### 3.2 The HUD flags, and the clock that needs a mockup

- The flags already exist:
  - for link 4: `sin.turn`, `sin.turnsLeft`, `sin.gigaGravitonTurn`, `sin.gazeCounter` and
    `sin.mouthStage`;
  - for links 1 to 3: the ones listed in 2.3 and 2.4.
- **No HUD element is built before Bailey picks** (rule 9). The existing generic surfaces already
  show every sourced system message ("Core gathers energy.", "Magic absorbed.", "Enters shell.") and
  the Trigger Command widget.
- **Mockups to render tonight** (package M; options only, at 1600 × 900 and 390 × 844, on the
  round-3 plate with the stand-in Ink & Gold HUD):

| # | Subject | Option | What it looks like |
|---|---|---|---|
| M1 | **Link 4 clock** | **A. The mouth ring** | A 13-segment ring on Sin's plate, grouped 3 + 9 + 1 (concept B's frame), with the current segment lit and "turns left" in the centre |
| | | **B. Tagged turn order** | No new widget. Each of Sin's rows in the CTB list carries its clock number (4, 5 ... 13), and the 13th row reads GIGA-GRAVITON in the alarm colour |
| | | **C. The painted jaw with a pip strip** | The rig's jaw *is* the clock (round 3), with a thin strip of 13 pips and the stage word (SHUT, OPEN 1 to 3, FULLY OPEN) under the boss name |
| M2 | **"What Negation took"** (§11 item 4) | a. A one-line banner | For example "Negation: Haste, Protect — and cured Poison" |
| | | b. Ghost chips | Each member's removed status chips fade out in place |
| M3 | **The link strip in Chapter XVII** | a. Three pips, I II III, with the carry bracket | Concept A's frame |
| | | b. Nothing new | Each link's reveal plate names it (`EnemyGroupDef.headline` exists) |

- The S-1 note is on M1 in every option: "13 (our estimate; the sources say 12 or 13)".

### 3.3 Story scenes (writing-bible voice; §9.2 beats paraphrased, no line quoted, no invented lore)

- **The files:** `src/story/scripts/sin-fins-core.ts` and `sin-face.ts` (package P; package S creates
  them as stubs).
- **The rules for every line:**
  - FFX grammar (bible §2.1): one thought per line, at most 60 characters times 2 lines, and at most
    one ellipsis per line.
  - The climax rule and one tension-release line per scene.
  - Brother follows the bible's §1.17 guide.
  - `lintScript` and the story-text lint (CHK-007) must pass.

**Chapter XVII**

| Slot | Beats (§9.2) | Speakers (existing portraits only) |
|---|---|---|
| pre | 1 the Hymn plan (Lulu reasons; Wakka and Rikku both claim it; Shelinda is told of, not staged); 2 setting out (the Hymn broadcast, Brother's halting request to Tidus); 3 the deck (Spira singing; Tidus throws Yuna's Gagazet sphere overboard, and she smiles, as a stage beat); 4 Sin answers (the shockwave, as a narrated stage beat); 5 Cid spots the shine at the arm's base, and Brother says they are being pulled in; then `battleStart()` | tidus, yuna, lulu, wakka, rikku, auron, kimahri, cid; **brother on the name plate only** (the FFX Brother has no portrait, as in Chapter VIII's `say('brother', ...)`) |
| mid | `ko left-fin` → beat 6 (the ship's cannon takes the first fin; Cid: "now the other side"); `hp-below right-fin 1` → one entry line; `ko right-fin` → beat 7 (the main gun is broken, Cid calls everyone in, Tidus refuses with his "you have the ball" line in his own words, a party member jumps, and all follow) | the same |
| victoryQuips | Grim tier only (bible §5.4: this is not a victory; Sin will rise) | party |
| post | beat 8, Sinfall: Sin plows into Bevelle's outskirts at sunset; on the bridge Yuna says it will come back, Tidus says they must beat the one inside, and Cid goes to fix the gun; then `results()` | yuna, tidus, cid |

The Trigger Command lines follow Chapter VIII's pattern: Tidus asks, Rikku asks her father, Cid says
wait and whoops. They are original copy.

**Chapter XVIII**

| Slot | Beats | Speakers |
|---|---|---|
| pre | 9, Yuna on the deck: does Jecht hurt; Yu Yevon joins a summoned aeon, small at first, so they might win without the Final Summoning; she asks Tidus not to go away (**the "Yes." beat is not used here**, since it is her request); Rikku calls them; 10, Evenfall: Sin rises winged over Bevelle; Auron says Jecht is waiting; the gun is still broken, Tidus says take us in, Brother promises; a party member's last line; Tidus calls to his father; then `battleStart()` | yuna, tidus, rikku, auron, cid, brother (name plate), a party member |
| mid | The mouth telegraph lines already built (`overdrive-sin.ts` `MOUTH_LINES`); **one** party callout at stage 3 (bible §5.2: one per state line) | tidus or auron |
| victoryQuips | Grim tier | party |
| post | 11, Breaking Through: the ship dives into the open mouth; a Farplane-like passage with a glimpse of Seymour, as a narrated stage beat, with Seymour not speaking; then `results()`. It hands off to Chapter XII (the Garden of Pain) in story order | narration (Tidus, past tense, 2 to 5 lines, after the high) |

**Story plates** (the cannon tearing off a fin, the jump, Sinfall, Evenfall) are on the art list.
Until they are picked, each beat is staged on the deck plate with text, and labelled a stand-in (the
Ixion listing's stand-in-plate pattern, `src/app/screens/cutscenePlate.ts`).

### 3.4 Cards, meta, guide, tactic and advisor rows

These are all package P. None of them is wired into a listed surface until the listing step (6).

| Piece | File | Content |
|---|---|---|
| Chapter meta, both | `src/data/chapter-meta-sin.ts` | The briefing count, the sensor lines and the teach lines: "Range buys safety, not damage", "Armor Break opens every link", "Kill order is yours", "A burst against a clock", "Wards against Gaze" (concept sheet "What it teaches"). `chapter-meta.ts` is at 399 lines, so the listing step imports this file with a one-line spread and moves an older entry out if it has to |
| Guides | `src/data/guides/sin-fins-core.ts` and `sin-face.ts` | Research §8 strategies 1 to 9, one card each. Each estimate is labelled on the page, with S-1, S-12 and S-2 named in plain words |
| Tactics (move advisor) | `src/engine/tactics/sin-fins-core.ts` and `sin-face.ts`, plus one line each in `tactics/index.ts` and `lookup.ts` | Fins: Armor Break and Mental Break at NEAR, then Pull Back; **Pull Back when `sin.fin.charged`**, unless Cid's forecast turn comes after the Fin's (the Evrae airship-order helpers `tactics/airship-orders.ts` are reused); Wakka and Lulu at FAR. Genais: physicals until it shells, then Fire and Piercing into the shell; Silence Grenade for Waterga. Core: kill order. Face: Hastega, Focus and Cheer during the pulls, Break on turn 4, Overdrives banked for the end, Soft or Remedy after a Gaze. The advisor v3 core (`advisor-*.ts`) is **not** changed tonight: a DEEP-class shared system |
| Chapter cards | `src/app/screens/frontend/chapterPlates.ts` entries | **Listing step only**: they need the picked card art |
| Pause CHAPTER dossier | reads `CHAPTERS` and the meta | Nothing to do until listing |

### 3.5 Portraits

Existing portraits only: tidus, yuna, auron, wakka, lulu, kimahri, rikku and cid.

- Brother (FFX) speaks with a name plate and no portrait. That is Chapter VIII's precedent, with the
  `dsl.ts` note "FFX Brother ... No portrait".
- The FFX-2 `brother-x2` portrait is **not** reused (rule 14).
- An FFX Brother portrait goes on the art list (4).

### 3.6 Jukebox entries (stand-ins, labelled; PR-0099 / D-209: a stand-in does not count as finished)

| Chapter | scene | battle | victory | Owed cue (THEMES.md row, to be composed and judged by ear, rules 8 and 13) |
|---|---|---|---|---|
| XVII | `scene-fahrenheit` (stand-in) | `boss-evrae` (stand-in) | `victory-ffx` | the **assault** cue for links I to III. §9.4 names "Assault" for every link but the head `[single source]`; a hymn-derived motif is canon ground because the Hymn is the plan; written fresh and never quoted |
| XVIII | `scene-fahrenheit` (stand-in) | `boss-evrae` (stand-in) | `victory-ffx` | the **countdown** cue for link IV. No source names the head's track (S-21) |

The jukebox lists `CHAPTERS` only, so neither chapter appears in it until listing.
`docs/audio/THEMES.md` gains the two owed rows (package P) marked "owed, stand-in in use".

---

## 4. The art list for Bailey's morning pick

Everything is original (rule 8), with no retail image as input, reference or IP-Adapter. The sibling
art agent owns tonight's renders (`D:/Tools/pyrefly-scratch/overnight-0929/sin-art/`), under the GPU
rule: queue only while fewer than 3 prompts are pending in ComfyUI's `/queue` in total, and pilot 3 to
5 before any batch and LOOK. **Nothing is installed or listed.**

| Subject | Already on disk (options) | To render tonight (pilot only) |
|---|---|---|
| **Overdrive Sin, the head** | Round 1 (`docs/concepts/chapters/sin-2026-09-27/head-pilot/`, frames A to D); round 2 (`head-round2/`, stages s0 to s4); **round 3** (`head-round3/`, the layered jaw rig, five stages, `42cc759a`; raw at `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/`). Round 3 asks Bailey two questions: does the jaw clock read, and is this the head | Nothing new until Bailey answers round 3. After a pick: repair the static layers once, then add the approach, Gaze and defeat states on the same rig |
| **Left Fin** (NEAR idle, FAR idle, gathering energy, hurt, torn off) | Only concept frame A's grey stand-in | 3 pilots of the NEAR idle with the core on the fin visibly charging (§9.3: "the core on the fin charges visibly"; "Sin's Left Arm") |
| **Right Fin** | none | Nothing until the Left Fin is picked. It is painted as its own arm by default; a mirror is cheaper but needs Bailey's yes |
| **Sinspawn Genais** (out, in shell, hurt, death) | Only concept frame C's stand-in | 3 pilots, out of the shell and in it as a pair (§9.3: a shelled Sinspawn, whose shell must read at a glance) |
| **Sin's Core** (inactive, gathering, hurt, death) | Only frame C's stand-in | 2 to 3 pilots, inactive and gathering as a pair |
| **Backdrop: the deck in flight, Sin alongside** | the Evrae deck (installed, Chapter VIII) as a base | 2 pilots |
| **Backdrop: Sin's back** | none | 2 pilots |
| **Backdrop: the deck over Bevelle at dusk** | round 3's `plate/p6` (dressed) | none |
| **Story plates** (the cannon on a fin, the jump, Sinfall, Evenfall) | none | none tonight (they come after the subjects are picked) |
| **Chapter cards ×2** | none | none tonight (they come after the subjects) |
| **Brother, FFX look (portrait)** | none (`brother-x2` is FFX-2's) | 2 pilots, from our own FFX-era sprite if one exists, otherwise words only |
| **HUD mockups M1 to M3** | none | package M, rendered as frames with no GPU (headless Playwright on our own plates) |

---

## 5. The bench plan

**The method** is `docs/plans/sin-link4-bench.md`'s:

- the real FFX engine and the chapter's own data;
- seeds 1 to 200 per line;
- first try;
- human pace equals bench speed, because in CTB the clock moves only on turns (the house rule in
  `docs/plans/yojimbo-faithfulness-2026-09-26.md` §3);
- measure, never tune.

**Where it lives:**

- `tests/unit/chapters/sin-fins-core-bench.test.ts` and the policies in
  `tests/unit/helpers/sinFinsPolicies.ts` (package B);
- the Face bench already exists (`sin-bench.test.ts`) and gains the advisor line.

**Three lines, per link and for the whole chain** (the chain is links 1 to 3 in one run on the
carried state):

1. **Sensible.** Research §8 rows 1 to 4, 6 and 9 for XVII:
   - close in, Armor Break and Mental Break, then pull back;
   - Wakka and Lulu at FAR;
   - pull back when the core charges;
   - Protect the centre and Haste one member;
   - Genais first with physicals, then Fire into the shell, with the Silence Grenade;
   - kill the Core early when it pays.

   For XVIII it is row 8 (the existing sensible line).
2. **Naive.** Attack whatever is in reach and Defend otherwise. No orders to Cid, no Breaks and no
   status care; Curaga under 40 %, and a Phoenix Down on a KO.
3. **The advisor card.** Each turn, play the move advisor's top card: the v3 driver in
   `critic/bench/advisor-v3/drive.ts`, the same harness the advisor scorecards use.

**What is reported, per link and for the chain:**

- wins out of 200, and losses by cause;
- mean engine turns and party actions (**the length check against Chapter III's first link, about
  195 turns**, the longest intended line);
- Negation count, Gravija count, and Gravija whiffs at FAR;
- how many members reach link 3 alive, and their HP;
- how many Genais shells there were;
- victories with Genais standing.

**The switches measured both ways:**

- **S-1** for XVIII: Giga-Graviton on the 13th turn (the default) and the 12th. It is already built as
  `sin.gigaGravitonTurn`.
- **S-8** for XVII: opening FAR (the default) and NEAR.
- **S-12:** the wiki Negation tunables as built, and "Negation off". The second is a bound, not a
  proposal: it shows how much of the chapter's weight rests on a single-source formula.

**The bands the project reads.**

- The intended line should clear **90 % or more** (`docs/plans/chapter-evrae-review.md` A4, the
  project's bar). Chapter I shipped at 73 % and was reported as short.
- The naive line should lose clearly.
- Link 4 is already measured below the bar: **31 %** on the 13th turn and **3.5 %** on the 12th
  (`sin-link4-bench.md`).
- That is reported, never tuned (memory `boss-side-fix-needs-measured-options`: never weaken a boss).
  The player-side levers Bailey can weigh are:
  - an aeon-Overdrive line in the bench, since the preset's gauges are 50 to 70;
  - the S-1 Steam check;
  - listing the Face with its difficulty disclosed.
- If XVII's chain lands far from the band, the same holds: **report it**, name what caps it, and
  offer measured player-side options once (Q3 includes the link-3 checkpoint).

---

## 6. The listing switch (one step, after Bailey's picks)

Only after Bailey has picked the head (round 3), the Fin, Genais and Core art, the three backdrops,
the HUD clock (M1), M2 and M3, the titles, and S-1 (or a yes to list with the default), one agent in
one commit (the Ixion listing `925ec32a` is the template):

1. Moves both records from `UNLISTED_CHAPTERS` into `CHAPTERS` and both ids into `CHAPTER_IDS`,
   after Chapter XVI.
2. Wires `chapter-meta-sin.ts`, the story registry (`src/story/registry.ts` is at 392 lines, so an
   entry moves out if needed), `guides/index.ts`, `chapterPlates.ts`, the scenes and the installed
   art.
3. Adds the e2e spec (keys and taps, a win and a loss, RETRY, skips), a save fixture test (listing
   must not break an older save), the board and grid tests' counts, and screenshots under
   `docs/screenshots/sin/`.
4. Deploys only through the Release section of AGENTS.md: `critic-plan` says DEEP after the deploy,
   and focused before it.

---

## 7. The order of work: packages with disjoint files

Each package runs on its own sub-branch of `chapter-sin` (`chapter-sin-<pkg>`). It merges back into
`chapter-sin` only, never into main, and the driver merges. **At most 3 builders at once.**

| Order | Package | Owner (model) | Owns (nobody else edits these) | Needs |
|---:|---|---|---|---|
| 1 | **S — the spine** | Opus | everything in 2.2: the records, ids, enemy data, `sin-ids.ts`, the aggregators, the stubs, the four one-line swaps, the FFX status carry, cites, CONTRACT-CHANGES, the renames, the handoff | the merge `56026029` |
| 1 (parallel, no code) | **M — HUD mockups** | Sonnet | `docs/concepts/chapters/sin-2026-09-27/hud/**` (the frames and the sheet, rendered by headless Playwright on its own port) | nothing |
| 2 | **F — the Fins and Cid** | Opus | `src/battle/ffx/ai/sin-fins.ts`, `sin-fins-rules.ts`, `sin-negation.ts`, `tests/unit/chapters/sin-fins-engine.test.ts` | S |
| 2 | **G — Genais and the Core** | Opus | `src/battle/ffx/ai/sin-genais-core.ts`, `sin-genais-core-rules.ts`, `tests/unit/chapters/sin-core-engine.test.ts` | S |
| 2 | **P — the story and ship layer** | Opus (story voice needs judgement) | `src/story/scripts/sin-fins-core.ts`, `sin-face.ts`, `src/data/chapter-meta-sin.ts`, `src/data/guides/sin-*.ts`, `src/engine/tactics/sin-*.ts` plus one line each in `tactics/index.ts` and `lookup.ts`, `src/app/screens/BattleScreenAirship.ts` (the bound foe), `docs/audio/THEMES.md` (the two owed rows), `tests/unit/chapters/sin-story.test.ts` and `sin-tactic.test.ts` | S (the flag names) |
| 3 | **B — the bench** | Sonnet | `tests/unit/chapters/sin-fins-core-bench.test.ts`, `tests/unit/helpers/sinFinsPolicies.ts`, the advisor line in `sin-bench.test.ts`, `docs/plans/sin-fins-core-bench.md`, and the handoff's bench section | F, G and P merged into `chapter-sin` |
| 4 | **CHECK** | Opus, independent | a review record only (`docs/handoff/chapter-sin.md` §CHECK) | B |
| after Bailey | **L — the listing** | Opus | section 6 | Bailey's picks |

**Why this order:**

- S is the only package that touches shared lines. Doing it first and alone keeps F, G and P on
  disjoint files: each one fills stubs whose signatures S fixed.
- M uses no GPU and touches no source, so it can run from the start.
- B measures the merged whole, so it goes last.

**The checks every builder runs:**

- `npx tsc --noEmit`, ignoring `tests/unit/zz-scratch/**`;
- its own tests;
- the FFX golden hashes;
- `evrae-engine.test.ts`;
- `node tools/orphans.mjs`, which must show no new orphan;
- **the full suite at most once per agent.**

---

## 8. Risks and open questions (each with a recommended default)

**Risks**

| # | Risk | Guard |
|---|---|---|
| R1 | **The D: drive is full** (0 bytes free at 23:30 on 2026-09-28 and again at 23:45). Writes, builds and commits fail at random | Every agent checks free space before writing. The driver clears space (Bailey runs any deletion; the disk-cleanup plan is in `D:/Tools/disk-cleanup`) |
| R2 | **Length.** XVII is estimated at about 140 to 190 engine turns before measuring. The longest intended line today is about 195 | Bench B measures it. Q3 is the lever |
| R3 | **"Evrae twice over."** The Fins reuse the range game | The Fins differ in kind: the charge telegraph, Negation, and range as safety rather than damage (§4). The guide says so |
| R4 | **S-12:** a single-source Negation formula with unclear units carries much of the chapter's weight | Named tunables; the bench measures it on and off; it is labelled in the guide |
| R5 | **Shared FFX engine files** (`reactions.ts`, `setup.ts`, `simulate.ts`, `ai/index.ts`, `BattleScreenSetup.ts`) put this in the **DEEP** class (see `sin-two-chapters-review.md`) | One-line aggregator swaps, no growth; golden hashes before and after; every hook is inert without the Sin flags |
| R6 | Files at the 400-line cap: `encounters.ts` 399, `chapter-meta.ts` 399, `registry.ts` 392, `scenes/index.ts` 398 | Edit on existing lines. New content goes into new files. The listing step moves entries out when it has to |
| R7 | The FFX status carry changes a chain that should not change | It is gated on `carriesPartyState`, which no other FFX formation sets. A test pins Yunalesca's chain unchanged |
| R8 | **Link 4 stays below the bar** (31 % first try) | Disclosed and never tuned (5) |
| R9 | The advisor card line may play the Fins poorly (it does not know `sin.fin.charged`) | The tactic file carries the rule. The advisor core is not changed tonight. The bench reports the gap |
| R10 | Parallel merges in `chapter-sin` | Disjoint files (7); only the driver merges; no reset, rebase, stash or amend |

**Open questions** (the recommended default is built, labelled, and shown to Bailey; GameFAQs is
Bailey's preferred source where sources conflict and nothing in-game settles it):

| # | Question | Recommended default |
|---|---|---|
| Q1 | **S-1:** is Giga-Graviton on the 12th or the 13th turn? | **13th, labelled our estimate.** This is bover_87's reading (GameFAQs, the Remaster-era guide). Gestahl, also on GameFAQs, says 12, so GameFAQs does not settle it. The Steam HD Remaster check (D-266) does, and only Bailey schedules it |
| Q2 | Ids: rename `sin` to `sin-face`? | **Yes** (it was only ever on the branch; 1.4) |
| Q3 | Chapter XVII's retry: back to the Left Fin, or a checkpoint at link 3? | **Back to the Left Fin** (the game has no save there, §1.2). Revisit with bench B's length |
| Q4 | S-8: do the Fins open FAR or NEAR? | **FAR** (Gestahl explicitly; bover_87 consistent; both GameFAQs) |
| Q5 | S-12: which Negation chance? | **The wiki formulas as named tunables**, labelled `[single source]`. The GameFAQs guides give only the direction (bover_87) or "random" (Gestahl) |
| Q6 | Link 3's scene: a per-link scene swap (a new seam) or the deck? | **The deck placeholder** until the Sin's-back backdrop is picked. Then build the swap |
| Q7 | S-2: how does Genais leave its shell? | **The wiki and the in-game Scan text** (heal to 12,000 or more, leave next turn). In-game text outranks the GameFAQs reading here |
| Q8 | S-20: a "cancel the order" option? | **Not built** (wiki only). If the Steam check confirms it, it applies to Evrae too |
| Q9 | S-13: how often does the Core counter? | **Every time it is targeted** (Gestahl, GameFAQs), labelled |
| Q10 | The Right Fin's Stoneproof changing hands at XVIII's re-equip | **Not built** (the drop coin is `[unsourced]`; drops are not modelled) |
| Q11 | S-27: an aeon's action counts 2 on the Fins' counters (and the link-4 Gaze reading, CHECK finding 2)? | **Yes, labelled** (wiki single source); both counters say so in their assumptions |
| Q12 | S-25: does the Gravija turn count toward the next three? | **No**, labelled |
| Q13 | Titles "Sin: the Fins and the Core" and "Sin: the Face" | Keep D-270's working titles. Bailey confirms at listing |
| Q14 | The Right Fin painted as a mirror of the Left? | **No, its own painting** (a mirror needs Bailey's yes) |
| Q15 | Music | Stand-ins labelled. Two owed cues, sketched and judged by Bailey's ear (D-209; Chapter VII's D-190 is separate and still waits) |
| Q16 | The seam line-up (REVIEW 6): do links 2 and 3 reopen with the build's front row (Tidus, Yuna, Auron) or with whoever ended the last link in front? | **The build's front row**, our estimate (`seam-lineup` in `SIN_FINS_ASSUMPTIONS`). Bench B measured both: within noise for the sensible line (8 % against 6.5 %). Added 2026-09-29 (CHECK 2 finding 5) |
| Q17 | Link 3's reveal plate: `sin-genais-core` has no `headline`, so the plate names its first enemy, Sinspawn Genais; the Core's in-game name is "Sin" (`m138`) | **As built** (Genais on the plate, the Core named "Sin" on its record) until the listing pass (package P or L) picks the plate. Added 2026-09-29 (CHECK 2 finding 5) |
| Q18 | Aeon reach at FAR (REVIEW 13): bench B found no aeon row (Attack, ability or Overdrive, all five aeons, gauge full) reaches either Fin at FAR; at NEAR every row reaches. §7.2's guides summon Bahamut on the Fins | **As built** (Evrae's FAR rule: only Wakka, Blk and Wht Magic, Lancet and long-range rows reach), so summoning on the Fins means NEAR. Unreconciled with the guides; the Steam check (D-266) could settle it. Added 2026-09-29 (CHECK 2 finding 5) |

---

## REVIEW (adversarial, 2026-09-29, independent reviewer; FFX only)

**Verdict: GO-WITH-CHANGES.** The architecture holds, checked against the code on `c64814f7`:

- The four swap lines exist exactly as quoted (`setup.ts:400`, `reactions.ts:154`, `simulate.ts:321`,
  `ai/index.ts:40`), and `def` and `damagedEnemyIds` are in scope at the reactions line.
- `immunityFlags` and `flags` are per-battle copies (the enemy build in `setup.ts`), so toggling them
  cannot leak into the data or across bench seeds.
- `checkEnd` already skips `nonCombatant` foes, and `results.ts` pays defeated enemies only.
- `'all'` targeting, `outOfMeleeReach` and the data-driven `removesStatuses` all exist, and
  `removesStatuses` already spares `permanent` statuses.
- No FFX group sets `carriesPartyState` today.
- `critic/bench/advisor-v3/drive.ts#runChapter` takes a `Chapter` record, so an unlisted chapter can
  be driven.

The numbers in 2.2 match `research/ffx-sin.md` §2.1 to §3.3, except items 7 and 11 below. Each
change below lands before, or inside, the package it names. None of them reopens the split or the
package order.

**Must change**

1. **Waterga cannot reach the caster through the swapped line (package S, then G).**
   - The body under the reactions line pushes `command: { kind: 'ability', id, targets: [] }`.
     `targeting.ts#resolveTargets` turns an empty aim on a `single-enemy` row into a random party
     member.
   - §3.2 says Waterga targets "the caster" `[verified: 4 sources]`.
   - The aggregator must return the target (or the whole `Command`), and the push line must use it
     (`targets: c.targets ?? []`). That edit keeps `reactions.ts` at the same line count.
   - Test: Waterga lands on the caster on every seed, including when the caster is an aeon.
2. **The link-3 state changes cannot hang off the player-side collector alone (S and G).**
   `collectBossCounters` runs only for a command with an ability def (attack, ability, overdrive or
   item), and it returns early for enemy-side actions and for counters. Three cases slip through:
   - the Core dies to some other command kind;
   - Genais dies to Doom at the start of its own turn (the count is 30 and Doom lands, §2.1);
   - Genais kills itself with its own Cura counter while Zombied (Zombie resistance 80, so Zombie
     Attack lands 20 % of the time, §2.3).

   In each case the Core stays out of melee reach and magic-immune, or the victory waits for a later
   action while Genais takes a turn.
   - **The fix:** recompute the marks that depend on Genais and the Core from `isAlive`, in a hook
     that runs for every action. `reactions.ts#runMortibsorptionIfDown` is already called at the top
     of every `afterAction`, so one added line there keeps `engine.ts` unchanged.
   - **Not the fix:** marking Genais `nonCombatant` at setup. The stalemate watch would then stop
     counting Genais's HP as progress.
   - **Tests:** Doom on Genais, Zombie plus Cura, and the Core killed by each command kind.
3. **The director rebind would also move link 4 (package P).**
   - `applyOverdriveSinSetup` already publishes `airship.countsTargetings = 'overdrive-sin'` on the
     same deck scene.
   - Binding "the formation's counted foe" would therefore hand the head's actor to Evrae's NEAR/FAR
     director. That changes the staging of a link that is already benched, and nobody has seen the
     change (rule 9).
   - Scope the bind to the two Fin ids, or to a flag of their own. Pin the Chapter VIII and link-4
     staging unchanged in a test.
4. **The Trigger Command widget would show Evrae's missile pips in the Fin fights (packages P and
   M).**
   - `AirshipOrders.ts#openWidget` reads a missing `airship.missiles` as `MISSILE_COUNT`, so the
     widget shows three full pips. That contradicts S-19: Cid fires no missiles here.
   - P owns `src/ui/ffx/AirshipOrders.ts` and `AirshipOrderWidget.ts`, and shows no pip strip when
     the flag is absent. Evrae always sets the flag, so its widget does not change.
   - M adds "the widget without pips" to its sheet, because it changes a surface Bailey approved.
   - P also lists every other Evrae-only reader that runs once `airship.range` is set, and decides
     each one: `engine/phaseCanon.ts#phaseForFlags` (the `evrae-far` grade and its "Ch VIII" canon
     beat), and the director's readers for the breath and the missiles. Each is either labelled a
     placeholder or scoped to Evrae.
5. **`sin-carry.test.ts` pins a chain that does not exist.** Chapter II (Yunalesca) has no
   `nextGroupId`. The only FFX chains are:
   - Chapter III: Braska's Final Aeon, then the possessed aeons, then Yu Yevon;
   - Chapter XIV: Isaaru.

   Pin both of these as carrying no statuses.
6. **The line-up at a seam is undecided.**
   - `carryFfx` keeps the build's `activeIds`. Links 2 and 3 therefore reopen with Tidus, Yuna and
     Auron in front, whoever ended the last link there.
   - That decides three things: who stands in front at FAR, which members Negation's leftmost and
     rightmost Protect weights read, and who is in front to give Cid orders.
   - Research §1.2 is silent on it. Name it as a labelled estimate in `SIN_FINS_ASSUMPTIONS` and the
     Q list, and have bench B measure both readings.
7. **Negation's list, not a count.**
   - 2.2 says Negation removes "25 statuses", but §3.1's list has **24**. The data copies the list,
     and the test compares against the list.
   - State that `permanent` auto-statuses survive (the engine's `'dispelled'` path already spares
     them), and test it.
8. **S-13 is wider than its source (package G).**
   - Gestahl's "counters 100 % of the time" is about the Core **after Genais dies**. Before that, the
     counter chance is `[unsourced]`; the wiki says it grows as the Core's HP falls.
   - Give the pre-death chance a tunable of its own, labelled our extrapolation.
   - Also say whether a spell that is absorbed ("Magic absorbed.") still draws the Core's counter.
     That is unsourced too: label it, and have the bench measure it.
9. **D-270's re-equip is a deviation, not a default.**
   - Adopted D-270 says Chapter XVIII opens with "a re-equip (the Right Fin's Stoneproof drop ... can
     change hands here)".
   - Q10 does not build it, and the FFX prep screen (`src/app/screens/party-prep/`) cannot change
     equipment at all.
   - Record it in the handoff and in `decisions.json` as a deviation from D-270 that waits for
     Bailey, so that Q10's default does not quietly settle it.
10. **The golden hashes are a two-tree procedure.** `ffx-chapter-hashes.test.ts` only writes JSON: it
    is skipped unless `FFX_HASH_OUT` is set. It also walks the unlisted chapters.
    - S writes the base once, from `56026029`, extracted with `git archive` into
      `D:/Tools/pyrefly-scratch/overnight-0929/<label>/`. No worktree. Check free space first: D: had
      6.1 GB free at review time.
    - F, G and P diff against that base, with `FFX_HASH_SKIP=sin,sin-face,sin-fins-core` on both
      sides.
11. **Venom can crit.** §3.2 gives it as "Physical, can crit", so the row needs `crit-eligible`. The
    stat-table test also covers Reflect 255 on Genais and the Core, and Delay immunity on all four.
12. **New orphans.** `chapter-meta-sin.ts` and `guides/sin-*.ts` have no importer until listing, and
    the plan's own check says "no new orphan". Pick one:
    - wire them now through the unlisted records;
    - move them to package L;
    - or name them in the handoff as expected orphans.
13. **Bench cost and loss causes (package B).**
    - `sin-bench.test.ts` has no environment-variable gate, so its 200 seeds run in every `npm test`.
      Put the XVII chain runs (× 3 lines × the S-8 and S-12 variants) behind an environment variable,
      and keep a small smoke test in the suite.
    - Report the 400-turn stalemate (`'escape'`) as its own loss cause.
    - Add **aeon reach at FAR** to the Q list, and have the bench report it:
      - Evrae's fight had no Yuna, so it never had to decide this;
      - `reachesFoesAtRange` refuses an aeon's physical attack at FAR, while `REACHES_OUT_OF_MELEE`
        lets Valefor reach the Core;
      - the sources say nothing about aeons reaching the Fins, yet §7.2 has the guides summoning
        Bahamut on them.

**Should change**

- **Re-run `critic-plan --paths` with the final file list.** Include `simulate.ts`, the three
  aggregators, `chapter-sin-face.ts`, `BattleScreenAirship.ts` and `AirshipOrders.ts`. The class
  stays DEEP, but the checks it lists should be the real ones.
- **Genais's Cura counter answers once per action, not "every hit".** The engine collects counters
  once per action. Write "per action" and label it; Attack Reels is where the two readings differ.
- **Fix the dangling cite and pin the Reflect bounce.**
  - `sin-two-chapters-review.md` row 5 cites "§5.2.3", which the research does not have. The Reflect
    note in §2.3 carries the same dangling cite.
  - Say where a Reflect bounce lands in link 3. The engine picks a random foe, which can be Genais,
    who is weak to Fire. Pin it with a test.
- **Keep Tidus's "ball" line a paraphrase.** Chapter XVII's pre scene uses it. It stays a paraphrase
  in our own words: §9.2 says "all dialogue is paraphrased on purpose".
