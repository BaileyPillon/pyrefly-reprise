# Iteration 2: the build plan as file-disjoint batches (2026-09-26)

Bailey, 2026-09-26 about 15:00 EDT, verbatim: "Focus on meeting all score thresholds iteratively.
Godspeed. I have plenty of usage." About 21:15 EDT: "just push the live build please and keep going".

Written by a sub-agent of the driver session, paper only. This file does not change a source file.
It extends `docs/plans/thresholds-program-2026-09-26.md` (called **thresholds** below) and
`docs/plans/presentation-program-2026-09-26.md` (called **presentation**). Neither is replaced.

**Inputs:**
- thresholds §2 (the iteration 1 batches), §3, §4, §8 (the iteration 2 additions, the FFX-2 sourced
  answers) and §9 (the Steam answers);
- `docs/target/decisions.json`, D-196 to D-231;
- presentation §2 to §8 (A-1 to A-17, B1 to B7, C-1 to C-8, the three picks);
- `docs/plans/accessibility-review.md` (the option C preflight);
- `docs/plans/yojimbo-faithfulness-2026-09-26.md`;
- `critic/rounds/round-13.json` (145 issues), with each issue's fix and acceptance check;
- the handoffs of every `t1-*` branch, and of `iter2-spellfx-b`, `iter2-vegnagun-a` and
  `iter2-attack-pose`;
- `git log main..<branch>` for every branch in flight, read at main `2cb00d5a`. While this file was
  being written, `iter2-attack-pose`, `iter2-spellfx-b` and `iter2-vegnagun-a` merged (main
  `2a9aa978`).

**Classes** (as in thresholds):
- **A**: build now.
- **B**: needs an options round first (rule 9).
- **C**: needs Bailey's word or his ear.
- **D**: needs a written method check first (rule 15).
- **X**: already built or decided; only evidence is owed.

**Effort** is agent time: **S** is 2 h or less, **M** is 2 to 5 h, **L** is more than 5 h.

**Game case** (rule 14):
- FFX chapters are I, II, III, VII, VIII, IX, X, XII and XIV.
- FFX-2 chapters are IV, V, VI, XI, XIII and XV.
- Shared plumbing and bug fixes are "both" (CHK-020).

---

## 0. At a glance

```
now (release 21 merging)      wave 1 (3 heavy + 1 medium)            wave 2 (3 heavy)
------------------------      ---------------------------            ----------------
L-0 finish t1-b2b (check)  -> B1 Combat engine and data (deep)    -> B5 FFX HUD, summons, targets, flow tail
L-1 critic tooling (play.mjs  B2 Camera, framing, transitions,       B6 Advisor, intent, FFX-2 HUD, pause, board
    first: unblocks t1-b4b)      scenes (presenter)                  B7 Accessibility C + PR-0203 (save data;
L-2 art lane (GPU)            B3 Actors, particles, light, Vegnagun     merges LAST, deep review BEFORE deploy)
L-3 options mocks (light)        parts (presenter)
L-4 research + method checks  B4 Story, results, title, coach (medium)
                              -> release 22                          -> release 23 (B5+B6), release 24 (B7)
```

- **Wave 1 starts** when release 21 is on `main` (the `iter2-*` branches and the seven boss poses)
  and L-0 has merged `t1-b2b`.
- **Wave 2 starts** when all of these have merged:
  - the three repairing batches, `t1-b2a`, `t1-b3b` and `t1-b4b`;
  - B2, B3 and B4, whose files hand over (§5).
- **Heavy** means a batch that builds and runs multi-chapter real-key sweeps or benches. At most three
  run at once (memory `feedback-parallel-load-limit`).
- B4 is medium: script and CSS edits, unit tests, and about ten captures at the end. It runs its
  capture pass only while no heavy batch is in a browser phase.
- A deep review's measurement runs want the host alone (thresholds §6). Nothing else captures while
  one runs.

---

## 1. Files reserved until their branch merges (no iteration 2 batch touches them)

| Branch | State at 2cb00d5a | Reserved files |
|---|---|---|
| `t1-b2a` (D:/pyrefly-t1-b2a, 811ef0d8) | Repairing. The re-check found a new blocker: on an upright phone the Overdrive plate (a8bb6434) collides with the slab. | `src/ui/ffx/**` (including `phone-hud-parts.css`); `src/engine/PaintedArt.ts`; `src/engine/fetchRetry.ts`; `src/ui/coach/CoachMark.ts`; the tests it added |
| `t1-b3b` (D:/pyrefly-t1-b3b, ecc08ab5) | Repairing. REG-keycol is fixed, PR-0171 is backed out, and PR-0117 stays open. | `src/app/screens/pause/**` except `keys.ts`; `src/app/screens/frontend/frontend.css` and `chapter-select-c.css`; `src/ui/common/portrait.ts`, `face-crops.json`, `pause-chapter.css`, `pause-screen.css` and `pause-slide.css`; `tests/e2e/portraits.spec.ts` |
| `t1-b4b` (D:/pyrefly-t1-b4b, 77d66c75) | Repairing. PR-0215 is backed out. **The merge is blocked** until `critic/runner/lib/play.mjs` stops counting ArrowRight presses (L-1 item 1). | `src/app/screens/BattleScreen.ts`, `ChapterSelectScreen.ts` and `frontend/boardFocus.ts`; `src/ui/common/pauseMusic.ts`; `docs/audio/THEMES.md`; `tools/audio/**`; `tools/deploy-pages.mjs`; `tools/dist-filter.mjs`; `vite.config.ts` |
| `t1-b2b` (D:/pyrefly-t1-b2b, f4280215) | **Killed mid-check**, not repairing. It has 6 commits and a handoff, but no independent check. The untracked `dist-chk-cand/` is the killed checker's candidate build. **Delete nothing there.** | `src/engine/ActorEdgeFeather.ts`, `BattlePresenter.ts`, `BattlePresenterStage.ts`, `PaintedActor.ts` and `shaders/PaintedShader.ts`; `src/scenes/cavern-stolen-fayth-arrival.ts`, `cavern-stolen-fayth-rigs.ts` and `leblanc-last-room.ts`; `src/app/screens/BattleEncounterChain.ts`; `src/battle/common/types.ts`; `src/data/ffx2/enemies/fallen-aeons-road.ts`. These are reserved until L-0 merges the branch, because wave 1 needs them. |

**Shared documents no batch owns:**
- `docs/CONTRACT-CHANGES.md`, `docs/handoff/NOW.md`, `docs/target/*.json` and `critic/ledger.json`.
- Each batch writes its contract entry and its records into its handoff note. The driver writes them
  at merge.

---

## 2. Inventory: every approved-but-unbuilt item, classified

Every item below lands in exactly one batch or lane. The batch tables in §3 and §4 carry the files,
the acceptance check and the effort for every A item.

### 2.1 Thresholds §8, iteration 2 additions (D-202 to D-226)

| Item | Decision | Game | Class | Where |
|---|---|---|---|---|
| Natus Talk lines (PR-0204) | D-203 | FFX | A | B4 |
| Banter rotation re-test (PR-0021) | D-204 | both | X. e26c77aa is on main; the re-test is at attempts 0, 1 and 2 on one profile. | round 15 (§10) |
| SFX lower for new profiles (PR-0203) | D-210 | both | A, save-data class | B7 |
| XI epilogue staging (PR-0133 XI half) | D-211 | FFX-2 | A | B4 |
| Fielded-only speakers with an authored fallback (PR-0037) | D-212 | both | A | B4 |
| Chapter VIII Rikku reword (PR-0160) | D-213 | FFX | A | B4 |
| GameFAQs-labelled data: GP-G2, PR-0054 | D-214 | FFX-2 | A | B1 |
| GameFAQs-labelled data: PR-0217 | D-214 | FFX (round 13 tags it FFX: the FFX engine keeps Zombie through KO) | D: read first (L-4), then A | L-4, then B1 |
| H legend rename (PR-0028) | D-215 | both | A | B6 (wave 2: `pause/**` is `t1-b3b`'s until it merges) |
| Chapter XII disc-turning coach line | D-216 | FFX | A | B4 |
| Chapter V checkpoint at Shuyin, labelled an adaptation | D-217 | FFX-2 | A | B1 |
| Critic policy: coach copy is reviewed focused | D-219 | both (process) | A | L-1 |
| Accessibility option C (PR-0032) | D-220 | both | A, save-data class | B7 |
| FFX Sensor line "Immune to sensors." | D-221 | FFX | A | B5 |
| Yojimbo P-1 and P-2 | D-222, D-223 | FFX | X (merged at 2cb00d5a) | round 15 |
| Phase lighting, option A | D-224 | both | A | B3, with B2's hook |
| Pyreflies per the sources | D-225 | FFX (Macalania, Gagazet) and FFX-2 (Leblanc) | A | B2 (scene level); B3's canon test |
| Trema: no victory pose | D-226 (settled `'hold'` in dd9d0a78) | FFX-2 | A | B2 port, B5 value |
| Each chapter's own cue (PR-0099) | D-209 | per chapter | C (waits on the audio pick) | §8 |

### 2.2 FFX-2 sourced answers (research ca5bdde3): measured OFF switches for Bailey

| Item | Game | Class | Where |
|---|---|---|---|
| IC-1 / PR-0209: an immune hit opens no chain. `IMMUNE_HITS_SKIP_CHAIN` already exists, OFF, in `constants.ts:101`. What is owed: the Split_Infinity G1032 source label, and the measurement. | FFX-2 | A (measure) then C | B1 |
| PR-0124: the dressphere carries across a linked battle; gates and unlocks do not | FFX-2 | A (switch OFF, measure) then C | B1 |
| PR-0106: the failsafe fires once (turn 25, plus No Love Lost), and turn 5 is Fan Slap. The conflict with research §5.3 and the wiki is flagged. | FFX-2 | A (switch OFF, measure) then C | B1 |
| NEW-C1: a lone White Mage plays Esuna first, then a spherechange, items or a Garment Grid spell. Advisor only. | FFX-2 | A | B6 (`src/engine/tactics/ffx2-bahamut.ts`) |
| NEW-C1 follow-up: an FFX-2 stalemate watch | FFX-2 | C (a new rule; see §8 Q15) | none |

### 2.3 Steam answers (thresholds §9)

| Item | Game | Class | Where |
|---|---|---|---|
| PR-0170: the target step opens even with one valid target (`CommandMenuLogic.ts:176` is `mode: 'auto'` today) | FFX. The FFX-2 half is unsourced and goes to the Steam part 2. | A | B5 |
| PR-0180: the enemy ability name shows centred in the top HELP bar for the span of the action; a plain Attack shows nothing | FFX | A | B5 |
| PR-0180 party half: presentation §2 says party abilities are named too. `research/ffx-combat-core.md` does not record that yet. | FFX | D: source it first (L-4) | L-4, then B5 |

### 2.4 Presentation A-1 to A-17 (the old assignment, then the iteration 2 batch)

| A | Item | Game | Old | Now |
|---|---|---|---|---|
| A-1 | FFX-2 wait camera frames the boss out | FFX-2 | batch 2 | B2 |
| A-2 | Battle entry per the 19 Sep pick (blur, shatter, implosion) | split by game | batch 2 + batch 4 line | B2 (modules, Vegnagun seams); B5 (the `BattleScreenFlow.ts` call site) |
| A-3 | 14 to 20 s of black on a cold first visit | both | batch 2 + batch 4 | B2 (card, hairline, load order); B6 (board-focus warm-up in `ChapterSelectScreen.ts`). The WebP half is optional and deferred (`deploy-pages.mjs` is `t1-b4b`'s). |
| A-4 | No victory pose where the sources withhold it | FFX II; FFX-2 IV, V, XIII | batch 2 + batch 4 | B2 (the port); B5 (the four values and the `BattleScreen.ts` wiring) |
| A-5 | Bosses dissolve into pyreflies | both | batch 2 | B3 |
| A-6 | Pyreflies at three depths, from a canon table | both | batch 2 | B3 |
| A-7 | Backdrops with a floor and a sky | both | batch 2 | B2, as its last and droppable part (L, deep-class). The DoF pass needs `Renderer.ts` (B3's), so it lands after B3 merges or moves to iteration 3. |
| A-8 | Contact shadows on dark floors | both | batch 2 | B3 |
| A-9 | Lady Ginnem's unsent glow | FFX (IX) | batch 2 + batch 4 | B3, including `cutsceneFx.ts` |
| A-10 | Dream's End framing | FFX (III) | batch 2 | B2 |
| A-11 | The party inside the frame in master and push shots | both | batch 2 | B2 |
| A-12 | Phone framing for every chapter, plus **the Chapter I phone defect**: Seymour Flux goes off the right edge when hit; Chapter IV's Bahamut does the same (spell-fx check) | both | batch 2 | B2 |
| A-13 | The Ink & Gold per-attack camera roll | both | batch 2 | B2 |
| A-14 | Tidus's attack pose jumps in saturation (probe first) | both (seen in FFX) | batch 2 | B3 |
| A-15 | PR-0157's FFX-2 half: fade the cards during actions | FFX-2 | batch 3 | B6 (reads B2's acting-state signal) |
| A-16 | The title's first frame is black | both | batch 4 | B4 |
| A-17 | Yuna's White Mage actions change outfit (interim routing) | FFX-2 | art lane | L-2 |

### 2.5 Thresholds §2 items that the iteration 1 batches did not take

| Item | Game | Class | Where |
|---|---|---|---|
| Batch 1, entirely (it never ran): PR-0083 split, PR-0145, PR-0108, PR-0107, PR-0138, the Acta F4 guard, the PR-0106/0054/0069 labels, PR-0174, the PR-0179 arms (OFF) | per row | A (arms OFF, then C) | B1 |
| PR-0181 summon staging (the method check says: restored canon) | FFX | A | B5 |
| PR-0031 + PR-0178 target cues. Ring and dim first; the TARGET plate is built behind an OFF switch until §8 Q5 is answered. | ring/dim both; plate FFX | A (+C) | B5 |
| PR-0095 + PR-0094 Vegnagun parts, measured on the D-228 staging, plus the round Bulwark rings flattened to the picked frame and the Charge Core slab moved off the core's rim (vegnagun-a check) | FFX-2 | A | B3 |
| PR-0157 HUD over action cameras: B2 builds the signal, B5 the FFX fade, B6 the FFX-2 fade | both | A | B2, B5, B6 |
| PR-0061 leftover: option (a) of the addendum. Auto-advance the opening callout under the action, and run the sensor line under the push. D-206 has answered. | both | A | B2 |
| PR-0104: hold the decorative FFX-2 cut-in until the action's first effect, at most 0.8 s | FFX-2 | A (one before/after frame with the progress note) | B2 |
| PR-0137: repair Bahamut's alpha, only if the file is not approved-hashed or judge-locked | FFX-2 | A | L-2 |
| PR-0146 and PR-0193, FFX halves (stopped by `t1-b3a`: the files are `src/ui/ffx`) | FFX | A | B5 |
| PR-0206 (method check: probe first, with the pinned seed from PR-0202) | FFX | D done, then A | B5 |
| FOC-06 (method check: probe first, then one 14 px token) | both | D done, then A | B6 |
| PR-0131 (two failed attempts in `t1-b3a`) | FFX | **D** (method check), then A | L-4, then B6 |
| PR-0197 win-rate half (stopped: it depends on Bailey's 2026-09-21 advisor policy) | FFX | C | §8 |
| PR-0014 remainder (`t1-b3b` found the rows accurate and needs the exact repro) | both | **D** (a repro-first paragraph) | L-4, then B6 |
| PR-0117 (open after `t1-b3b`: the grid name is still ellipsised at 390x844) | FFX-2 | A | B6 |
| PR-0171 (backed out in `t1-b3b`'s repair) | FFX data; shared layout | A (D-234: option C picked 2026-09-26) | B6, after the width cap |
| PR-0211 (reverted at 717dece6) | both | A (D-232: option A picked 2026-09-26) | B4 |
| PR-0215 (routing backed out; the card needs wording) | FFX rule; shared screen | C, then A (revert 7d3d9081, plus the copy) | §8 Q6, then B5 |
| PR-0127 (stopped in `t1-b4a`: what gives way on the prep card) | FFX-2 | C/B | §7, §8 |
| PR-0186 (stopped in `t1-b2a`: no slot clears the Pagodas and BFA) | FFX | C (a pick of (a) to (c)) | §8 Q7, then B5 |
| PR-0128 tick labels (stopped by rule 6) | FFX | C | §8 Q8, then B5 |
| PR-0216 (not reproduced in 20 runs) | both | X (re-probe on an idle host in round 15) | §10 |

### 2.6 Round-13 class-A items that no plan scheduled

| Item | Game | Class | Where |
|---|---|---|---|
| PR-0019: help sentence truncated; the ALL chip covers the slab | both (FFX half and FFX-2 half) | A | B5 (FFX), B6 (FFX-2) |
| PR-0018: the selected command row reads 1.74:1 | both | X (re-measure), then A | B5 (FFX), B6 (FFX-2) |
| FOC18-04: selecting a card nudges the cards below by 2 px | both | A | B6 |
| PR-0071: autoBattle 'intended' loses Chapter I on seed 1 and stalls at the Chapter V Tail | both (tactics) | A | B6 |
| PR-0062: the per-link seed is not reachable from the debug API | FFX-2 (tooling) | A | L-1 |
| PR-0166: run.json must read the bundle from the page | both (tooling) | A | L-1 |
| PR-0053: restate or withdraw the lost Berserk record | FFX-2 | A (paper) | B1 |
| PR-0044: 16 manifest subjects carry no facing | both (15 are FFX-2) | A | L-2 |
| PR-0188: the Daigoro order reads "damage to itself" | FFX | X (capture), then A | B6 |
| PR-0063, PR-0113, PR-0114 | both | X (capture), then A | B4 (0063), B6 (0113, 0114) |
| PR-0140 (a commit without a game case), PR-0210 (settled by D-198) | none | X, close as records | round 15 |
| FOC18-06: the Chapter XIV pause copy is an agent's inference | FFX | C | §8 |

### 2.7 Found by iteration 1 checks, owed now

| Item | Found by | Game | Class | Where |
|---|---|---|---|---|
| `t1-b2b`: independent check of its six items, and PR-0136 at 2000x1012 (never measured) | killed checker | per item | A | L-0 |
| PR-0185 remainder: a 4:3 rig for IX (1280x960); tween frames disclosed only | `t1-b2b` | FFX | A | B2 |
| PR-0034: the Chapter I grade. The cause is the linear-light output, a whole-game colour-pipeline change. | `t1-b2b` | both (pipeline) | **D**, then C | L-4, then §8 Q11 |
| PR-0177: Evrae's FAR scale. D-032's "distant streak" conflicts with the A-FAR concept. | `t1-b2b` | FFX | C | §8 Q9 |
| The coach layer takes taps meant for an enemy reticle at 390x844 | `t1-b5` | both | A | B4 |
| The Chapter II FFX coach line sits over the intent slab's IF YOU ATTACK list | `t1-b3a` | FFX | A | B4 |
| The FFX-2 `statusWord` prints "Hp" | `t1-b3a` | FFX-2 | A | B6 |
| `advisor-revive.ts` still weights FFX-2 Yuna as a Summoner | `t1-b3a` | FFX-2 | A (bench) | B6 |
| The mouse hint "Hold click skip" names a hold that `Input` never reports (CHK-015) | `t1-b4a` | both | A | B4 |
| Lenne is still unstaged in the Chapter V post | `t1-b4a` | FFX-2 | B (folded into the PR-0161 round) | §7 |
| `art/title/keyart.png` logs an aborted request on the title | `t1-b2b` | both | A (with A-16) | B4 |
| Chapter VIII: Rikku's Special, a one-item group, fires Steal on Enter | `t1-b5` | FFX | A (with PR-0170; the target step then follows) | B5 |
| Route drivers assume a lone target auto-fires; PR-0170 will change that | this plan | both (tooling) | A | L-1 |
| Spell effects: the effect clock ignores held fast-forward | spellfx check | both | A | B3 |
| Spell effects: FFX-2 Holy numerals trail the strikes; crits lose the bigger bloom | spellfx check | FFX-2 / both | A (S) | B3 (move to B5 if the timing lives in `BattlePresenterBeats.ts`) |
| Spell effects: heals now cut the camera; Full-Life on a Zombie draws Cure motes | spellfx check | both | X (disclosed; leave) | none |
| The phone intent strip covers the Vegnagun leg's lens | vegnagun check | FFX-2 | A (HUD-side avoidance keeps the picked frame) | B6 |
| After a party KO on a phone, Mindy slips about 80% off the right edge (D-201's disclosed major) | road-phone check | FFX-2 | C ((a) or (b)) | §8 Q12, then B2 |
| Chapter IX's scene borrows `scene-gagazet`, and no decision names an owed IX cue | `t1-b4b` | FFX | C | §8 |
| The boss lunge distance on the new attack poses | attack-pose | both | X (left as it is, disclosed) | none |

---

## 3. Wave 1

Every batch runs in its own worktree, with the two junctions described in memory
`pyrefly-worktree-tooling`. Every batch finishes with:
- `npx tsc --noEmit`;
- the vitest files it touched, and the full suite before merge;
- `node tools/orphans.mjs`;
- real-key captures in `docs/screenshots/<batch>/`;
- the game case in each commit;
- a handoff note;
- its own servers stopped by PID.

After that comes one independent check and at most one repair cycle (rule 15). An item that fails its
check twice is backed out, not tuned a third time.

### L-0: finish `t1-b2b` (light; before wave 1)

- **Owns:** `t1-b2b`'s reserved files (§1), in its own worktree.
- **Work:** the independent check the killed checker never finished. Build a production candidate
  (`vite build`, stopping any preview it starts). Then check with real keys each item's own round-13
  acceptance:
  - PR-0205;
  - PR-0164 and PR-0212 (`verify-approved` included);
  - PR-0184;
  - PR-0185 (held frames);
  - R15-02;
  - PR-0136, at both 1600x900 and **2000x1012**.
- **Then:** one repair cycle if needed, then merge.
- **Stays open after it:** PR-0034 (§8 Q11), PR-0177 (§8 Q9) and PR-0185's 4:3 rig (B2).
- **Effort:** M.

### L-1: critic tooling (light; starts now)

**Owns:**
- `critic/runner/**`, `critic/policy.json`, `critic/calibration/**`;
- `tools/critic-*.mjs`;
- `tests/unit/critic-*.test.ts`;
- `tests/e2e/hud-collision.spec.ts`, `enemy-visibility.spec.ts` and `tests/e2e/support/**`;
- `src/debug/api.ts` (wave 1 only; it goes to B7 in wave 2).

| # | Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|---|
| 1 | **Unblock `t1-b4b`.** `play.mjs:68-70`, `supp.mjs` and `gap-audio.mjs` navigate the board to a target chapter id, not by a count of ArrowRight presses. | both | `critic/runner/lib/*.mjs` | After a prep Esc, each driver lands on the chapter it asked for in all 14 listed chapters, on a board that reopens on the last chapter (t1-b4b's PR-0109). `selftest.mjs` passes. | S |
| 2 | D-219: a coach-copy-only change is focused, never deep | both | `tools/critic-plan.mjs`, `critic/policy.json`, `tests/unit/critic-release-rules.test.ts` | A unit test: a diff of only `src/ui/coach/coachCopy.ts` (or another coach copy module) returns `focusedBeforeDeploy`; a diff that touches coach logic keeps its current class. | S |
| 3 | PR-0166: the bundle identity comes from the page | both | `critic/runner/**` | Every run.json of the next review carries the bundle name read from the page, matching the reviewed sha's artifact record. | S |
| 4 | PR-0062: the per-link seed is reachable | FFX-2 | `src/debug/api.ts` | A named seed makes Chapter V link 2 land Berserk on Yuna in White Mage, captured at 1600x900 (round-13 acceptance). | S |
| 5 | PR-0213: the guard also covers `makeSnap` | both | `critic/runner/**` | A capture whose asserted state differs from its root screen is refused on the `makeSnap` path too (unit test). | S |
| 6 | CHK-011 third rule (every targetable enemy has an always-on marker), `CHK_CHAPTERS` slices, and CHK-008 states 7 to 9 driven | both | specs and support | Each rule and state produces a report. Run off-peak: a full CHK-011 pass takes about 3 hours. | M |
| 7 | PR-0170 readiness: route drivers accept a target step on a lone target (a confirm press), as well as today's auto-fire | both | `critic/runner/**` | The Chapter II and XII routes pass on main today and on B5's candidate later. | S |

### L-2: art lane (GPU; `public/art` is local; art generation is ON per NOW.md)

**Owns:**
- `public/art/**` (local only);
- new sheets under `docs/concepts/**`;
- `tests/unit/actor-facing.test.ts` (new).

**Leave alone:** the `tools/gen/*.json` files. They show as modified in the main tree and belong to
another agent (shared-tree rule).

**Rules:**
- keep fewer than 3 ComfyUI jobs pending;
- `verify-approved.mjs` is green before and after;
- apply the art method notes in presentation §5.

| Item | Game | Class | Work / acceptance | Effort |
|---|---|---|---|---|
| A-17: Yuna White Mage interim routing | FFX-2 | A | Route the cast, attack, hurt, victory and item slots to the idle (D-179 pattern). In a Chapter IV real-key run the outfit never changes. `verify-approved` stays green. | S |
| PR-0137: Bahamut's alpha | FFX-2 | A (only if unlocked) | Judged in game against its tile (CHK-013). | S |
| PR-0044: facing for 16 subjects | both | A | Every manifest subject carries a facing, and a per-formation sign test passes. | M |
| ART-1 continued (the Natus, Omnis, Trema/Paragon, Syndicate-attack, FFX-2 Bahamut, shades and Isaaru-aeon slots), ART-2 (Dark Knight first), ART-3 (Yuna WM re-render; then take A-17 out) | per boss | C (pick sheets) | Render candidates and send pick sheets. Install only a pick. | GPU hours |

### L-3 and L-4

- **L-3** is the options mocks in §7.
- **L-4** is paper and research.

**L-4 owns:**
- new files: `research/gamefaqs-reads-2026-09-27.md`, `docs/plans/pr-0034-method-check.md`,
  `docs/plans/pr-0131-method-check.md`, `docs/plans/steam-session-part2.md`;
- the P-3 note in `research/ffx-yojimbo.md` §9 Y-1.

**L-4 does not edit** a research file that B1 owns (§3, B1). B1 copies each labelled line in when it
builds the item.

**GameFAQs reads (D-214):**
- PR-0217: FFX, Zombie through KO;
- the FFX HELP bar naming party abilities (PR-0180's party half);
- FOC19-04: do the Den's per-shade rewards add up;
- the exact GP-G2 Alchemist values;
- PR-0054's Break branch.

Each is labelled "our estimate". Anything GameFAQs does not settle goes to the Steam part 2 (§8 Q14).

### B1: Combat engine and data (heavy; deep-class)

**Review:** focused before deploy, deep after (thresholds §2 batch 1). The preflight is written:
`docs/plans/combat-polish-0926-review.md`.

**Owns:**
- `src/battle/ffx2/**` except `intent.ts` and `intentRandom.ts`;
- `src/battle/ffx/**` except `intent.ts` and `ai/seymour-natus-rules.ts`;
- `src/battle/common/**` (contract, additive);
- `src/data/ffx2/**` and `src/data/ffx/**`, including both `ids.ts` (contract);
- `src/data/encounters.ts` (contract, 399 lines: do not grow it);
- `src/app/screens/BattleScreenCarry.ts`, `BattleScreenSetup.ts`, `BattleEncounterChain.ts` and
  `BattleChainCheckpoint.ts`;
- `research/ffx2-combat-core.md`, `ffx2-leblanc-syndicate.md`, `ffx2-vegnagun-shuyin.md`,
  `ffx-combat-core.md`, `ffx-bfa-yu-yevon.md` and `ffx-seymour-anima-macalania.md`;
- `docs/plans/pr-0179-method-check.md`.

**Benches, before and after:**
- the six FFX-2 chapters (IV, V, VI, XI, XIII, XV) at Wait split 1.5 s, at Active 1.5 s, and at bench
  speed;
- FFX I, IX, X and XIV for the data items.

**Never tune a boss number.**

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| PR-0083 / F3 split, **first** | FFX-2 | `resolve.ts` into a new `resolve-targets.ts`; `engine.ts` outcome and stalemate into a new module | Seeded battle logs on IV, V, VI, XI, XIII and XV are byte-identical before and after, and both files are under 400 lines. | M |
| PR-0145: all petrified is a defeat | FFX-2 | `results.ts` | A probe shows defeat with 0 enemy actions once all three are petrified; V and VI re-benched. | S |
| PR-0108: Sleep has no expiry at Fast | FFX-2 | `statuses.ts` (label: single source) | A unit test at Fast shows Sleep outlasting its Normal duration. | S |
| PR-0107: Acts II and III open with random gauges | FFX-2 (VI) | a flag on the FFX-2 group data or a new module | A Chapter VI first-try and within-five bench stays inside the accepted band; otherwise stop and ask. | M |
| PR-0138: FFX-2 chain spoils | FFX-2 | `results.ts`, `BattleEncounterChain.ts` | A ledger unit test: V sums its sourced rows, and XI includes Shiva's 8,000 EXP and 2,000 gil. FFX II and III are unchanged. The real-key Chapter V win follows; if it needs a `BattleScreenFlow.ts` line, that line is B5's. | M |
| Acta F4 guard | FFX-2 | `shuyin-abilities.ts` | A unit test. | S |
| PR-0106, PR-0054, PR-0069 labels | FFX-2 / FFX | comments and test names | Comment, test name and code agree and cite their research lines. PR-0054 uses GameFAQs' reading if L-4 finds one, labelled. | S |
| PR-0106 switch: failsafe once, turn 5 Fan Slap | FFX-2 (VI) | `ai/leblanc-syndicate.ts`, the data row | OFF equals today byte for byte. The measurement table (on against off, three paces, fight length, damage taken) carries the turn-5 conflict. | M |
| IC-1 / PR-0209 measurement and label | FFX-2 | `constants.ts` comment (G1032, our estimate) | Chain length and turn-count deltas on IV, V, VI, XI, XIII and XV, on against off, at three paces. OFF logs are unchanged. | M |
| PR-0124 switch: dressphere carry | FFX-2 | `BattleScreenSetup.ts`, `BattleScreenCarry.ts` | OFF equals today. Measured on V, VI, XI, XIII and XV at three paces. Gate and unlock state never carries in either mode (a test). | M |
| GP-G2: Alchemist fixed damage, labelled | FFX-2 | `src/data/ffx2/**` | Each value cites GameFAQs and says "our estimate". A unit test asserts it. | S |
| PR-0217: Zombie through KO, after L-4 | FFX | `src/battle/ffx/**` status rules | As GP-G2. If GameFAQs is silent, it waits for the Steam part 2. | S |
| PR-0174: Rikku's S.LV 53 | FFX | `builds/fahrenheit.ts` | VIII and X show a consistent S.LV with its source tag. VIII re-benched. | S |
| PR-0179 arms (a), (b) and (c), OFF | FFX | a new module the Gagazet build reads | Each arm equals its sourced rows. OFF equals today byte for byte. I, IX, X and XIV benched per arm. The table goes to §8 Q3. | M |
| D-217: Chapter V checkpoint at Shuyin | FFX-2 (V) | `BattleChainCheckpoint.ts`, `BattleEncounterChain.ts` | A real-key Chapter V run reaches the Shuyin checkpoint. The handoff and code label it an adaptation (rule 6). | M |
| PR-0053 | FFX-2 | paper, in the handoff | The record is restated with expected, observed, repro and evidence, or closed as withdrawn. | S |

**Merge:** B1 merges **last** in wave 1.
**Measurement table:** the three switches and the PR-0179 arms go to the driver as one table for §8 Q3
and Q4.

### B2: Camera, framing, transitions and scenes (heavy; presenter)

**Review:** focused before deploy, deep after.

**Owns:**
- in `src/engine/`: `BattleCamera.ts`, `BattleMoments.ts`, `ScreenRects.ts`, `OpeningSkip.ts`,
  `TurnCutIn.ts`, `BattlePresenter.ts`, `BattlePresenterActive.ts`, `BattlePresenterBeats.ts`,
  `BattlePresenterEvents.ts`, `BattlePresenterPorts.ts`, `HudPort.ts`, `Backdrop.ts`, `Diorama.ts`,
  `StageAnchors.ts`, `Formation.ts` and `TargetFrameHold.ts`;
- `src/scenes/**` (all, `farplane*.ts` included);
- `src/ui/common/transitions/**`, `phoneFraming.ts`, `BattleStartBanner.ts` and
  `battle-start-banner.css`;
- `src/app/screens/battlePreload.ts` and `BattleScreenFlow.ts`;
- new: `transitions/shatter.ts`, `blur.ts`, `implosion.ts`, and `tests/e2e/ffx2-wait-framing.spec.ts`.

**Part 1 merges first**, within about a day. It is small, and B3, B5 and B6 build against it:
- the acting-state HudPort signal (`action-start` and `action-end`, cancel included; a no-op default);
- D-224's phase port (`lighting.phase(id)`, a no-op default) and its canon triggers;
- A-4's `victoryPose: 'pose' | 'hold'` port, defaulting to `'pose'`;
- an exported `BackdropPalette.ground` for A-8.

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| Part 1 hooks (above) | both | Ports, Beats, Events, `HudPort.ts`, `Backdrop.ts` | Unit tests: the signal is set and cleared on start, end and cancel; the phase port fires on each canon trigger; `victoryPose` covers both values. No visible change. | S |
| A-4, the presenter side | FFX II; FFX-2 IV, V, XIII | Beats `victory()`, Ports | On `'hold'` the figures keep their stance, the victory cue is quiet, and the rig still settles. The values land in B5. | S |
| A-13: camera roll | both | `BattleMoments.ts` (impact) | `rollTo(-4°)` on an attack's first hit, then release, scaled by speed and skipped under reduce-motion. A before/after clip of a Chapter I attack. 0 s added per action. | S |
| A-10: Dream's End framing | FFX (III) | `dreams-end.ts` | The sun and the mound crest sit in the upper third behind BFA at 1600x900 and 2000x1012. Approved hashes are unchanged. | S |
| A-11: the party inside the frame | both | `BattleMoments.ts`, `ScreenRects.ts`, scene rigs | An actor-projection sweep (L-1's CHK-011 stick) over the idle, action and push rigs at 1280, 1600 and 2000: no party quad is cut by more than 15%. | M |
| A-12 and the Chapter I phone defect | both | scene phone slots, `phoneFraming.ts`, the impact rig | At 390x844, per chapter: a first-menu and a mid-fight capture, the boss at least 75% visible, and every party quad inside the frame. **Fire on Seymour Flux (I) and Fira on Bahamut (IV), cast by real keys: the struck enemy is at least 75% on screen in the impact cut.** Mindy (XI) waits for §8 Q12. | M |
| PR-0185 remainder | FFX (IX) | `cavern-stolen-fayth-rigs.ts` | A 4:3 rig: no held frame cuts a party head at 1280x960. Tween frames are disclosed. | S |
| A-1: FFX-2 wait camera | FFX-2 | `BattleCamera.ts`, `BattlePresenterActive.ts`, scene slots | 10 wait frames per FFX-2 chapter at 1600x900 and 2000x1012: the boss quad is at least 75% on screen and the party quads at least 90%. | M |
| PR-0061(a): opening waits | both | `BattlePresenter.ts` (script-trigger hold), `BattlePresenterEvents.ts` (sensor beat) | A presenter test: the first menu can open while an opening callout is still up. Per chapter on a pinned seed (CAL-005 form): the first menu within about 4 s with Confirm presses, and passive time at most 6.0 + 1.5 s. Approved beats untouched (D-206). | M |
| A-3: no cold black | both | `swirl.ts`, the A-2 modules, `BattleStartBanner.ts`, `battlePreload.ts` | The card goes up over the ink after about 400 ms, with the hairline. The backdrop and boss idle load first. A cold fresh-profile run with real-key skip in I and IV has no frame with luma under 12 for more than 500 ms. The time to the card is logged. Warm runs are unchanged. The hairline gets one frame for Bailey if the driver judges it new (rule 9). | M |
| A-2: battle entry | FFX blur and shatter; FFX-2 shatter; Vegnagun implosion (FFX-2) | new transition modules, `transitions.css`, and the Vegnagun seams in Beats | One capture sequence per class (FFX cutscene entry, FFX retry, FFX-2 entry, a Vegnagun seam, reduced motion) at 1600x900. No swirl outside the low or reduced tier. Skip gives 0 s. Confirm interrupts. Re-shoot the concept's `before.png`. **The implosion ships only after Bailey sees its first frames beside the tile.** The call site is B5's one line. | L |
| PR-0104: FFX-2 cut-in hold | FFX-2 | `TurnCutIn.ts`, `transitions/TurnCutInLayer.ts`, `BattlePresenterActive.ts` | In XI and IV, the SHL tag or the effect shows before the next cut-in. The time to the next menu is not longer. One before/after frame in the progress note. | M |
| PR-0072: Vegnagun contact shadow | FFX-2 (V) | `farplane-colossus.ts` (the existing BlobShadow API; no edit to `BlobShadow.ts`) | At 1600x900 a contact shadow shows under Vegnagun, and no party billboard intersects it, at the first menu and at target selection. | S |
| D-225: pyreflies per the sources | Macalania FFX; Leblanc FFX-2; Gagazet FFX (unchanged) | `leblanc-last-room.ts` (the motes at line 238), `macalania-temple*.ts` | Leblanc's magenta and cyan motes are gone. Macalania's Chamber-door motes wait for Seymour's death. Gagazet keeps snow and glitter. B3's canon test covers all three. | S |
| A-7: floor and sky (**droppable**, last) | both | `Backdrop.ts`, `Diorama.ts`, `ParallaxLayerSpec` bands | The bands recompose at pan 0 to the approved PNG. `zanarkand-dome.png` keeps its hash. A 2 s pan clip in I and IV. The DoF pass waits for B3's merge, or goes to iteration 3. | L |

### B3: Actors, particles, light and Vegnagun parts (heavy; presenter)

**Review:** focused before deploy, deep after.

**Owns:**
- in `src/engine/`: `PaintedActor.ts`, `shaders/PaintedShader.ts`, `shaders/GradeShader.ts`,
  `BlobShadow.ts`, `Particles.ts`, `BattlePresenterDepartures.ts`, `BattlePresenterStage.ts`,
  `BattlePresenterSpellFx.ts`, `Renderer.ts`, `ScenePalettes.ts`, `Lighting.ts`, `VFX.ts`,
  `BloomMask.ts`, `ActorEdgeFeather.ts`, `PartAnchors.ts` and `spellfx/**`;
- new: `pyreflyCanon.ts` and `unsentGlow.ts`;
- `src/ui/ffx2/intentPlacement.ts`, `TargetPlates.ts`, `target-plates.css`, `targetPlateGeometry.ts`,
  `nodeEdgeMarkers.ts` and `node-edge-markers.css`;
- `src/app/screens/cutsceneFx.ts`.

**Order:** A-5 first; then A-6 and A-9, which reuse its emitter. D-224 lands after B2's part 1.

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| A-14: probe | both | `PaintedActor.ts`, `PaintedShader.ts` | Log the fog and tint uniforms at the lunge peak against the idle. If fog explains the jump, the torso's hue and saturation differ by less than 8% between idle and attack frames. If it does not, report the cause and stop. | S |
| A-8: contact shadows | both | `PaintedActor.ts`, `BlobShadow.ts` (reads B2's export) | At each chapter's first menu, the mean luma under the feet is at least 12% below the floor around it. Hovering subjects keep no shadow. | M |
| A-5: pyrefly dissolve | both; only what canonically dissolves, never humans | `BattlePresenterDepartures.ts`, `Particles.ts`, `PaintedShader.ts` | One capture per departure class per chapter. A regression test that the emitter is disposed and outlives the results wipe. A composite against `pyrefly-death/after.png`. | M |
| A-6: air at three depths | both, per location | `Particles.ts`, `pyreflyCanon.ts` (read by the stage; no scene edits) | A unit test that every scene has a cited canon row, including D-225's three rows. Frame cost logged per tier. A composite against `pyrefly-atmosphere/after.png`. | M |
| A-9: Ginnem's unsent glow | FFX (IX) | `unsentGlow.ts` (keyed by actor id), `Particles.ts`, `cutsceneFx.ts` | The Chapter IX pre and post scene captures match the tile, with no hard outline. If a scene-file edit proves necessary, it waits for B2's merge. | S |
| D-224: phase lighting A | both, canon triggers only | `Renderer.ts`, `ScenePalettes.ts`, `PaintedShader.ts` (rim and bounce tint), and the port implementation registered in `BattlePresenterStage.ts` | On each canon trigger, a real-key capture shows the grade, fog, floor glow and rim tint, tweened over about 1.5 s, at most 3 flashes a second. A `reduceFlashes` getter (default false; B7 wires it) skips the tween. The tile's `after.png` is re-shot before the tile is called delivered. | L |
| PR-0095, plus the flat Bulwark rings | FFX-2 (V) | `PartAnchors.ts`, `TargetPlates.ts` | First probe `partRingSnapshot()` at links 3 and 4. Then, at 1600 and 2000, the link-3 and link-4 first menus show a ring and a plate on each part, unoccluded, and the Bulwark rings squashed as in the picked frame. | M |
| PR-0094, plus the Charge Core slab | FFX-2 (V) | `intentPlacement.ts` | A link-4 rule with a unit test that treats the head quad as an obstacle. At 1600 and 2000 the link-4 card misses the head, and the Charge Core slab misses the core's rim. One Chapter V capture closes both with PR-0095. | S |
| Spell-effect minors | both / FFX-2 | `spellfx/**`, `VFX.ts` | The effect layer's `dt` scales with playback speed: under held fast-forward a Fire column lands with its numeral. A crit keeps its 1.3x bloom. The Holy numeral pacing goes to B5 if it lives in Beats. | S |
| OR-2 / D-233: Spiral Cut and Mega Flare, option A | Spiral Cut FFX; Mega Flare FFX-2 | `spellfx/**` | A dolly and a hit-freeze on the last hit, in the new-spells particle language (D-227). One capture per game as a first play and as a repeat (the repeat at most 1.2 s longer). `docs/concepts/specials-2026-09-27/` is the picked frame. | M |

### B4: Story, results, title and coach (medium)

**Review:** focused. D-219 makes coach copy focused too.

**Owns:**
- `src/story/**` (`dsl.ts` is a contract);
- `src/battle/ffx/ai/seymour-natus-rules.ts`;
- `src/data/guides/seymour-natus.ts`;
- `src/app/screens/cutsceneFigures.ts`, `CutsceneScreen.ts`, `CutsceneStage.ts` and
  `BattleScreenCutscenes.ts`;
- `src/app/screens/ResultsScreen.ts`, plus `src/ui/common/results*.{ts,css}` and `victoryLine.ts`;
- `src/app/screens/TitleScreen.ts`, `frontend/parallax.ts`, `frontend/titleMarkup.ts`,
  `frontend/chapterCards.ts` and `index.html`;
- `src/ui/coach/**` except `CoachMark.ts`;
- `src/ui/common/ControlsHint.ts`, `controls-hint.css`, `DialogueBox.ts`, `dialogue-box.css`,
  `cutscene.css` and `speaker-roles.ts`.

**Not** `frontend.css`: it is `t1-b3b`'s. A-16's placeholder style goes inline or in a new CSS file.

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| PR-0204: Natus Talk lines (D-203) | FFX (X) | `scripts/seymour-natus.ts`, `seymour-natus-rules.ts` (no SPEAKS tag), guide callouts | The three drafted lines (`docs/plans/natus-story-draft.md`) and their callouts appear in a real-key Chapter X run. A story unit test. The lint (CHK-007) passes. | S |
| PR-0133 XI half (D-211) | FFX-2 (XI) | `scripts/ffx2-fallen-aeons.ts`, `cutsceneFigures.ts` | The Chapter XI epilogue by real keys stands Leblanc, Ormi and Logos for their lines, as XII and XIV do. Also check Chapter IV's empty hall against its script. | S |
| PR-0037: fielded-only speakers (D-212) | both | `dsl.ts` (additive; a contract entry), the runner, midScripts, `BattleScreenCutscenes.ts` | A unit test per game: a benched character never speaks a mid-battle line, and the authored fallback fires. Every mid-battle beat in every chapter is spoken by someone on the field. | M |
| PR-0160: Rikku reword (D-213) | FFX (VIII) | `scripts/evrae-airship.ts` | Rikku no longer repeats Brother's line; she carries "Bevelle" and "within the hour". The lint and a names-hidden re-read pass. FFX-2 `brother-x2` lines are unchanged. | S |
| D-216: Chapter XII disc coach line | FFX (XII) | `coachCopy.ts`, `CoachLayer.ts` (it reads `advisor-omnis.ts`) | Over the 40-seed advisor-top-row bench, the line appears when a disc turn is the top move, and never contradicts the advisor's top row. | M |
| PR-0172: the Defeat title overlaps CHAPTER SELECT | both | results files | No overlap for the longest chapter title at 1600x900. | S |
| PR-0120: the results painting stops short | both | results files | No cream strip at the right edge at 2000x1012, in either game. | S |
| A-16: the title's first frame | both | `TitleScreen.ts`, `parallax.ts`, `index.html` | A `<link rel=preload>`, `decode()` before the reveal, and a 32 px inline placeholder. No frame after "title" has mean luma under 10% at 1600x900 or 390x844. Every parallax layer is decoded. No aborted `keyart` request. | M |
| "Hold click skip" wording | both | `ControlsHint.ts` | The mouse hint names only what `Input` reports (CHK-015). | S |
| The coach eats reticle taps on a phone | both | coach layer | At 390x844 with a coach mark up, a tap on an enemy reticle targets it. | S |
| The Chapter II coach line over the intent slab | FFX (II) | coach placement | At 1600x900 on a fresh profile the coach rect misses the IF YOU ATTACK list. | S |
| PR-0063: capture first | FFX-2 cards | `chapterCards.ts` (only if the capture fails) | An FFX-2 card shows `yuna-x2`, `rikku-x2` and `paine`. An FFX card shows its own party. | S |
| OR-1 / D-232: mid-battle line card, option A | both | `DialogueBox.ts`, `dialogue-box.css`, `cutscene.css` | A compact card takes whichever of four slots is clear of the party and the speaker, chosen once per beat; falls back to option B's bottom band when no slot is clear. III and V at 1600, 2000 and 390 show no boss occlusion. `docs/concepts/line-card-2026-09-27/` is the picked frame. | M |

---

## 4. Wave 2

Wave 2 starts only after `t1-b2a`, `t1-b3b`, `t1-b4b`, B2, B3 and B4 have merged. B1 may still be
finishing.

### B5: FFX HUD, summons, targets and the flow tail (heavy)

**Review:** focused before deploy, deep after (presenter and HUD).

**Owns:**
- `src/ui/ffx/**` (all);
- in `src/engine/`: `PaintedArt.ts`, `fetchRetry.ts`, `TargetHighlight.ts`, `BattlePresenterActors.ts`,
  `BattlePresenterArrivals.ts`, `BattlePresenterRecall.ts` and `BattlePresenterReturns.ts`;
- handed over (§5): `BattlePresenterStage.ts`, `BattlePresenterBeats.ts` and `BattlePresenterEvents.ts`;
  `src/app/screens/BattleScreen.ts` and `BattleScreenFlow.ts`; `ResultsScreen.ts` with the results
  files; `src/data/chapter-meta.ts` and `chapter-meta-trema.ts`.

`FFXBattleHud.ts` is 1,544 lines, so every item's logic goes into a new module.

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| PR-0170: one-target cursor | FFX | `CommandMenuLogic.ts:176` | In II and XII, Enter on Attack shows the bracket on the boss, and Escape returns to the command menu. VIII's one-item Special group opens its target step. | S |
| PR-0180: enemy ability names | FFX | new `actionBanner.ts` (or the top help band), wired into `FFXBattleHud.ts` | In X and XII the enemy ability name is in the DOM and on screen, centred in the top HELP bar, within 200 ms of action-start and for the action's span. A plain Attack shows nothing. The ivory slab stays only on the moments that use it today. The party half follows only if L-4 sources it. | M |
| D-221: "Immune to sensors." | FFX | `SensorPanel.ts` | On a Sensor-immune target (Isaaru, Yojimbo, Daigoro, Mortiphasm, Yu Yevon), the panel shows the name with "Immune to sensors." A unit test covers one. FFX-2 Trema is untouched. | S |
| PR-0181: summon staging | FFX | Stage, Actors, Arrivals, Recall and Returns; a HUD row swap in a new module | In I, X and XIV, at the aeon's first menu: the aeon is at least 75% unoccluded, at alpha 1.0, with no party overlap, and the party rows are replaced by the aeon's. A procedural gold floor-glyph ring. A rim lift for Bahamut against Dream's End. On dismiss or KO the party returns. | L |
| PR-0031 + PR-0178: target cues | ring/dim both; plate FFX | `TargetHighlight.ts`, `src/ui/ffx/**` | The probe first. In III and X, and II (presentation), at 1600 and 2560, the s1/s2 composites show a legible ring and dim, the ally accent, and brackets behind the command stack. The TARGET plate stays behind an OFF switch until §8 Q5. | M |
| PR-0157, FFX half | FFX | new fade module plus CSS, on B2's signal | In I and XII action sequences, no HUD box intersects a party quad's upper two thirds or the acting boss. | S |
| PR-0146 FFX half, PR-0193 FFX half | FFX | reuse `intentOpeningHold` and `allLabelClear` | No FFX HUD panel before the boss caption in I. The Chapter III ALL label is at least 14 px and misses the intent card at 1280x720 and 2560x1440. | S |
| PR-0019 FFX half, PR-0018 FFX half | FFX | `commandHelp.ts`, `ffx-hud.css` | Help `scrollWidth <= clientWidth + 1` with the chip, at 1280 and 3840, with a terminator between fragments. Every row state is at 4.5:1 or better (re-measure first). | S |
| PR-0206 | FFX | `placeAdvisor` in a new module; `ui-ffx-hud-safe-zones.test.ts` | Replay the round-13 board on the PR-0202 seed. At 2000x1012 the first-menu card is visible with a non-zero rect and on no face; N toggles it and the chip text matches. The 2000x1012 test case fails first. A "no room" line needs §8. | M |
| The A-2 call site; A-4 values and wiring | both | `BattleScreenFlow.ts`; `chapter-meta.ts` (II, IV, V) and `chapter-meta-trema.ts` (XIII, D-226, our estimate); `BattleScreen.ts` | A-2's capture classes pass live. From the last blow to results in II, IV, V and XIII: no victory pose. I and IX still pose. | S |
| PR-0215 (after §8 Q6) | FFX rule; shared screen | `BattleScreenFlow.ts` (revert 7d3d9081) and the results copy | Trip the stalemate: a results card explains it and RETRY re-enters. | S |
| PR-0033 + PR-0007 (after the §7 pick) | both; II is FFX | results files | After a IX Zanmato wipe or a XII loss, the Defeat card names the finishing move, as picked. | M |
| PR-0186 and PR-0128 ticks (after §8 Q7 and Q8) | FFX | Sensor card; Swordplay overlay | The card misses both Pagodas and BFA at 1600 and 2000. The ticks read as picked. | S |
| PR-0138's flow line, if B1 needed one | FFX-2 | `BattleScreenFlow.ts` | A real-key Chapter V win shows the summed spoils. | S |

### B6: Advisor, intent, FFX-2 HUD, pause and board (heavy)

**Review:** focused.

**Owns:**
- in `src/ui/common/`: `MoveAdvisor.ts`, `advisor*.ts`, `move-advisor.css`, `EnemyIntent.ts`,
  `enemy-intent*.{ts,css}`, `StrategyGuide.ts`, `strategy-guide.css`, `phone-battle*.css`,
  `phoneBattle*.ts`, `pause-*.css`, `portrait.ts`, `portraitHost.ts`, `face-crops.json` and
  `partyFace.ts`;
- `src/ui/ffx2/**`, with the B3 files handed over;
- `src/engine/tactics/**`;
- `src/data/guides/**`;
- `src/battle/ffx/intent.ts`, `src/battle/ffx2/intent.ts` and `intentRandom.ts`;
- `src/app/screens/pause/**` except `keys.ts` and the new `rebind.ts`;
- `frontend/frontend.css`, `chapter-select-c.css`, `chapterGrid.ts` and `chapterPlates.ts`;
- `ChapterSelectScreen.ts` and `frontend/boardFocus.ts`;
- `PartyPrep*.ts` and the party-prep CSS;
- `tests/e2e/portraits.spec.ts`.

| Item | Game | Files | Acceptance | Effort |
|---|---|---|---|---|
| FOC-06 | both | `move-advisor.css`, `enemy-intent*.css` (one 14 px token), the density ladder | The probe first. `advisorMinEffPx >= 14` at 1600x900 and 2000x1012 in every chapter of both games. `advisor-card-css-type-floor.test.ts` moves to 14 and fails first. A rotation sweep finds no leaf under 14 px. If 1280x720 cannot hold, §8. | M |
| NEW-C1: lone White Mage tactic | FFX-2 (IV) | `tactics/ffx2-bahamut.ts` | Unit tests: Esuna first when Cursed, then a spherechange, items or a Garment Grid spell. The decision cap is kept. The intended line still wins 200/200. | S |
| PR-0071 | both | the tactics intended lines | `gotoChapter` auto 'intended' wins Chapter I and passes the Chapter V Tail on seed 1. 40 seeds re-measured. | M |
| FFX-2 revive weighting; `statusWord` "Hp" | FFX-2 | `advisor-revive.ts`; `src/battle/ffx2/intent.ts` | FFX-2 ranking carries no Summoner weight. The advisor top row on IV, V and VI over 40 seeds is not lower. No "Hp" in any FFX-2 intent (unit test). | S |
| PR-0131 (after L-4's method check) | FFX (I) | advisor revive rules | As the method check sets it. The Chapter I bench stays at 20/40 or better. | M |
| PR-0188: capture first | FFX (IX) | `describeAbility` | The Daigoro order sentence has no "damage to itself" and no lower-case start. | S |
| PR-0019 FFX-2 half, PR-0018 FFX-2 half | FFX-2 | `src/ui/ffx2/commandHelp*.ts`, `ffx2-hud.css` | As the FFX halves in B5. | S |
| A-15: the FFX-2 action fade | FFX-2 | a new module beside `FFX2BattleHud.ts`, on B2's signal | In IV and V action sequences no advisory card intersects the acting figure or the target's upper two thirds. | S |
| The phone intent strip over the Vegnagun leg's lens | FFX-2 (V) | phone strip placement | At 390x844, link 2: the strip misses the leg's lens, and the picked staging is unchanged. | S |
| PR-0028: the H legend (D-215) | both | `pause/markup.ts`, `pause/panels.ts` | Each legend names exactly what H does on its screen (battle and pause). | S |
| The pause's two live defects (accessibility §7 step 1) | both | pause CSS | The four CONTROLS labels are whole at 1600x900. MASTER VOLUME is whole at 390x844 (key column 118 to 140 px, as `phone-A-options.jpg`). `scrollWidth <= clientWidth` on every pause label at all four viewports. | S |
| PR-0117 | FFX-2 (IV, VI) | `pause/phoneFit.ts`, `pause-phone.css` | At 390x844 there is no overlap between the eyebrow and any stat row, and no ellipsis on the grid name. | S |
| FOC18-04 | both | `chapter-select-c.css` | A card-move probe: only the selected and previously selected cards change, with 0 px of height change. | S |
| PR-0113, PR-0114: capture first | both / FFX | board phone CSS, z-order | The name boxes do not touch, and BEST sits above the hint bar. The Coming badge is unobstructed. | S |
| A-3: warm the board | both | `ChapterSelectScreen.ts` | `preloadBattle` starts on card focus. Cold time to the card falls, and a warm run is unchanged. | S |
| PR-0014 (after L-4's repro) | both | `face-crops.json`, `portraits.spec.ts` | Every chip's head box is inside its visible rect, on the screen the repro names. | S |
| PR-0171, PR-0127 (after their picks) | FFX data / FFX-2 | pause dossier; prep card | As picked in §7. | S |
| OR-3 / D-234: pause CHAPTER dossier, option C | FFX data (II, IX); shared pause chrome | `pause/**` (needs the THIS ENCOUNTER width cap first, this batch's own REG-keycol fix) | The plate slides right under the member-tab rule (2026-09-24), at most to 0.88x, never below the 0.755x floor. II and IX plates at 1600 and 2000, in battle and over a scene, show the in-battle case fixed. `docs/concepts/pause-dossier-2026-09-27/` is the picked frame. | M |

### B7: Accessibility option C, plus PR-0203 (heavy; save-data class; merges LAST)

**Review:** `critic-plan` says DEEP **before** deploy. The CHK-024 upgrade matrix is refreshed with a
release-21 fixture: t1-b5 noted that its fixture exercises a real upgrade only after the next
persistence change, which is this one.

**Plan of record:** `docs/plans/accessibility-review.md`, steps 2 to 11 (step 1 is B6's). Q1, Q2, Q3,
Q5 and Q6 are answered. **Q4 and Q7 need pictures first** (§7, OR-13).

**Owns:**
- `src/app/SaveData.ts`, `saveMerge.ts`, and the new `saveComfort.ts` and `keymap.ts`;
- `src/app/Input.ts` (it shrinks);
- `src/app/comfort/**`;
- `src/ui/common/comfort.css` and `hudTextSize.ts`;
- `src/engine/ComfortPorts.ts` (no DOM and no `three`);
- `frontend/ComfortCard.ts` and its CSS;
- `pause/rebind.ts` and `pause/keys.ts`;
- `PauseScreen.ts` and `PauseScreenPanels.ts`;
- `src/audio/AudioManager.ts`;
- `src/ui/inkgold/wipe.ts` and `raiseBriefing.ts`;
- `tests/fixtures/saves/**`, `tests/e2e/save-upgrade.spec.ts` and `playwright.config.ts`;
- `src/debug/api.ts` (handed over from L-1).

**Tail edits**, each a named one-line edit made after that file's wave 2 owner has merged:
- the readers in `src/ui/ffx/**` and `src/ui/ffx2/**` (menus, minigames, the wheel, Trigger Happy,
  Lady Luck);
- `CoachMark.ts`, `Briefing.ts` and `DialogueBox.ts`;
- `BattlePresenterStage.ts` (to wrap its ports), `MomentOverlay.ts`, the A-2 transitions and `swirl.ts`;
- `CutsceneStage.ts`, `cutsceneFx.ts`, `BattleScreen.ts` and `BattleScreenCutscenes.ts`;
- `pause/settings.ts`, `pause/panels.ts` and `PauseView.ts`;
- `TitleScreen.ts`;
- the D-224 `reduceFlashes` getter, and A-5's reduced-motion path.

| Item | Game | Acceptance | Effort |
|---|---|---|---|
| PR-0032 / D-220, option C | both, with the per-game parts in the preflight §1 | AC-1 to AC-12 of the preflight: the U1 to U10 upgrade rows; all four settings off by default; the card once per profile, with the approved copy word for word; remap in every reader with no lock-out; flashes softened or proved unreachable; golden logs identical with the settings on and off; no clipped text at 130% where it is in scope; FFX-2 HUD and pause at 130% only after Q4's look (until then they stay at 100%, disclosed). | L (several days) |
| PR-0203 / D-210: SFX lower for new profiles | both | A fresh profile's default `sfxVolume` puts the SFX peak at or below the music peak minus 6 dB (about 0.35 by round 13's arithmetic). A release-21 save keeps its stored level (CHK-024). It lands in one commit series with B7's schema change and is reviewed once (preflight §3.2). | S |

---

## 5. File hand-overs between waves (ownership passes only after the earlier owner merges)

| File or folder | Wave 1 owner | Wave 2 owner |
|---|---|---|
| `BattlePresenterStage.ts` | B3 | B5, then B7's tail |
| `BattlePresenterBeats.ts`, `BattlePresenterEvents.ts` | B2 | B5 |
| `BattleScreenFlow.ts` | B2 (B1 takes one line after B2 merges, only if PR-0138 must land in wave 1) | B5 |
| `ResultsScreen.ts`, `results*.{ts,css}` | B4 | B5 |
| `src/data/chapter-meta.ts`, `chapter-meta-trema.ts` | nobody | B5 |
| `src/ui/ffx2/intentPlacement.ts`, `TargetPlates.ts` and related files | B3 | B6 |
| `src/data/guides/seymour-natus.ts` | B4 | B6 |
| `src/debug/api.ts` | L-1 | B7 |
| `cutsceneFx.ts`, `CutsceneStage.ts`, `DialogueBox.ts`, `src/ui/coach/**`, `TitleScreen.ts` | B3 / B4 | B7 (tail) |
| `src/ui/ffx/**`, `PaintedArt.ts`, `fetchRetry.ts` | `t1-b2a` (reserved) | B5 |
| `CoachMark.ts` | `t1-b2a` (reserved) | B7 (tail) |
| `pause/**`, `frontend.css`, `chapter-select-c.css`, pause CSS, `portrait.ts`, `face-crops.json` | `t1-b3b` (reserved) | B6 |
| `BattleScreen.ts`, `ChapterSelectScreen.ts`, `boardFocus.ts` | `t1-b4b` (reserved) | B5 (`BattleScreen.ts`), B6 (board) |

---

## 6. Merge order, releases and reviews

1. **Now, while release 21 merges:**
   - L-1 item 1, so `t1-b4b` can merge;
   - L-0's check of `t1-b2b`;
   - L-3 mocks, L-4 reads, L-2 renders;
   - the audio pack (§8 Q1), alone.
2. **The deep obligation.** Round 14 (deep) has never run. Live ce05b02c's `critic/pending` still owes
   it, carried from 18 builds. Release 21 deploys on Bailey's words. Release 22 needs his words again,
   unless round 14 settles first.
   - **Recommendation:** run round 14 on live release 21 right after that deploy, before wave 1's
     browser-heavy phases. Its captures want the host alone.
3. **Wave 1 merge order.** The candidate for release 22 is cut from `D:/pyrefly-release`. Then a focused
   review, the deploy, and round 15 (deep, on live).
   1. L-0 (`t1-b2b`);
   2. B2 part 1;
   3. B4;
   4. B3;
   5. B2's remaining parts;
   6. B1, last (its deep-class benches in the handoff).
   Any of `t1-b2a`, `t1-b3b` or `t1-b4b` that has merged by then rides along.
4. **Wave 2 merge order.** B5 and B6 make release 23: a focused review, then the deploy. At most two
   deploys may go out while a deep review is owed, so round 15 must have settled.
5. **B7 merges last** and is release 24. Its deep review runs on the candidate **before** the deploy,
   with the CHK-024 matrix. It must also cover whatever deep obligation release 23 still owes
   (`node tools/critic-plan.mjs` says which).
6. **Stop rule.** An item that fails its check twice is backed out and written up. It is not tried a
   third time without a method check (rule 15).

---

## 7. Options rounds to mock in parallel (class B; light; L-3)

**Method:** real-engine frames or short clips at 1600x900, and at 390x844 where the item applies.
Prototypes live in a scratch worktree that is never merged. A still is judged as HTML painted over a
real frame. Each round ends with Bailey's pick in `targets.json`, recorded as liked / disliked / must
remain / must change / undecided.

★ marks the three to mock first.

| # | Round | Game | Options | Unblocks |
|---|---|---|---|---|
| OR-1 ★ | **PR-0211: mid-battle line card placement.** `t1-b4a`'s top band covered the boss in III and failed at 2000 in V. **Picked 2026-09-26 (D-232): option A.** | both | (a) the left column the dimmed HUD leaves free; (b) a narrower top card that clears the boss quad; (c) a card anchored beside the speaker's own figure. III and V at 1600, 2000 and 390. | B4 |
| OR-2 ★ | **Spiral Cut and Mega Flare: the special moments** (presentation B4, plus their effects in D-227's particle language). **Picked 2026-09-26 (D-233): option A.** | Spiral Cut FFX; Mega Flare FFX-2 | (A) today, plus a dolly and a hit-freeze on the last hit; (B) three cuts in about 1.5 s with the HUD wiped; (C) `clair-impact-feel`, shown only as the declined reference. Each shown as a first play and as a repeat (the repeat adds at most 1.2 s). | B3 |
| OR-3 ★ | **PR-0171: the pause CHAPTER dossier placement** (backed out of `t1-b3b`). **Picked 2026-09-26 (D-234): option C.** | FFX data (II, IX); shared layout | (a) the text column moves to the side away from the face; (b) dimmed and inset; (c) under the columns, with the in-battle case fixed. II and IX plates at 1600 and 2000, in battle and over a scene. | B6, after the width cap |
| OR-4 | PR-0033 + PR-0007 Defeat cause line, with **PR-0215's withdrawal card** | both; II is FFX; the stalemate rule is FFX | Defeat: (a) the finishing move; (b) the move plus its set-up status; (c) the move plus a one-line sourced tip. Withdrawal: `t1-b4b`'s A, B and C. | B5 |
| OR-5 | Attack camera (presentation B2) | both; the FFX approach stays OFF until C-8 | (A) over the shoulder; (B) A plus the approach; (C) today plus a hold frame on the hit. Tidus in I, Paine Warrior in IV. | iteration 3 |
| OR-6 | Boss presence (presentation B5), with PR-0036 and PR-0177's FAR scale | per chapter from the boss-size table | (A) the slot forward and scaled; (B) the camera lower and pushed; (C) today. VI, IX, X, XV, IV (PR-0036), and VIII FAR (the streak today against 1.3x to 1.7x). | B2 or B3, iteration 3 |
| OR-7 | PR-0161 Farplane voice card, with the Lenne staging | FFX-2 (V) | (a) an italic line and a FROM THE FARPLANE plate; (b) a pyrefly veil over the portrait; (c) a floating centred line. Plus where Lenne stands. | B4 successor |
| OR-8 | PR-0058 comm and off-stage speakers | FFX-2 Shinra; FFX Brother (VIII) | A COMM plate against D-043's Brother A re-used. **New content: it needs his yes first (rule 10).** | later |
| OR-9 | Damage numerals: the approved ink splash (presentation B6) | both | (A) the splash, re-anchored; (B) the splash on crits and big hits only; (C) today. **The approved tiles show the splash; today's build departs from them.** | iteration 3 |
| OR-10 | Per-aeon summon glyphs (presentation B7) | FFX | (A) gold line glyphs; (B) glyphs painted into the floor; (C) PR-0181's procedural ring. | ART-5 |
| OR-11 | PR-0186: the Chapter III Sensor card | FFX | (a) fold it while an enemy is aimed at; (b) a smaller card; (c) a tight fit on the silhouette. | B5 (or answer §8 Q7 directly) |
| OR-12 | PR-0127: Chapter VI prep captions | FFX-2 (VI) | Smaller photo tiles; a shorter blurb for VI; or 12 px at 1280x720 only. | B6 |
| OR-13 | **Accessibility pictures owed before B7's steps 6 and 8:** Q4 (the FFX-2 HUD at 130% and the pause at 130%) and Q7 (flash softness before and after, on the Braska form change) | both | Made the round's way (`inject.js` on the live page). | B7 |
| OR-14 | PR-0029: Yu Pagoda letters on the field | FFX (III) | A letter chip under each Pagoda, against a letter on the plate only. | B5 |
| OR-15 | PR-0034: the whole-game colour pipeline | both | A four-scene sheet (I, III, IV, XI) of today's linear output against an sRGB-encoded output, after L-4's method check. | §8 Q11 |

---

## 8. Questions for Bailey (class C), with recommendations

**Send Q1 on its own**, as a standalone phone listening pack (the PR-0148 method check). **Send the
rest as one plain sheet** with a frame each. ★ marks an item that blocks a category from 9.0, or
blocks a gate, until he answers.

| # | Question | Game | Recommendation | Status |
|---|---|---|---|---|
| Q1 ★ | **Audio.** Give today's music a number out of 10, and pick control, A, B or C (PR-0148, D-168). May the AI-restyle layers ship? Also: the Macalania scene cue (D-190, Chapter VII scope), and whether IX needs its own scene cue (it borrows `scene-gagazet`; not in D-209). | both | No recommendation by ear (rule 13). PR-0099's cues, PR-0039 and the D-209 renders all wait on this answer. | still open (D-253) |
| Q2 ★ | **Story read** of the as-built lines in IX, XI, XII, XIII, XIV and XV (the narrative gate; D-203 settled only Natus). | per chapter | Keep as built. Mark any line to cut. | answered 2026-09-27 (D-241) |
| Q3 ★ | **PR-0179: aeon HP**, sent with B1's bench table. Arm (a), the sourced Gagazet rows that X and XIV inherit; arm (b), sourced at Gagazet with X and XIV kept at D-186; or arm (c). | FFX | Arm (a). | answered 2026-09-27 (D-243) |
| Q4 ★ | **Three FFX-2 switches**, sent with B1's measurements: IC-1 (an immune hit opens no chain; Split_Infinity), PR-0124 (the dressphere carries over; KADFC), PR-0106 (the failsafe fires once, and turn 5 is Fan Slap; SinirothX, which conflicts with the wiki). | FFX-2 | Turn on each switch whose benches stay inside the chapter's accepted band (D-214 prefers GameFAQs). Keep a switch off, and ask again, if it pushes a chapter outside the band. | answered 2026-09-27 (D-242) |
| Q5 | **PR-0031.** Both approved target frames show a TARGET plate. Build it for FFX? | FFX | Yes. It is built OFF, so the answer costs one flag. | answered 2026-09-27 (D-249) |
| Q6 | **PR-0215.** The FFX stalemate card: A (the caption reads WITHDREW), B (A plus the engine's own line, "The battle cannot be won from here."), or C (a Withdrawn heading)? | FFX rule; shared screen | B: the only new words are the engine's own. | answered 2026-09-27 (D-249) |
| Q7 | **PR-0186.** The Chapter III Sensor card: (a) fold it while aiming, (b) a smaller card, or (c) a tight fit? | FFX | (a). It uses the card's existing folded state. | answered 2026-09-27 (D-249) |
| Q8 | **PR-0128.** The Swordplay ticks: the tile prints MISS / HIT ×2 / ×4 / ×6, but no source gives a position-based hit count. | FFX | Keep MISS / HIT (rule 6), and note on the tile that its labels are unsourced. | answered 2026-09-27 (D-249) |
| Q9 | **PR-0177.** Evrae at the far range: keep the streak (your D-032 words, "a distant streak") or scale it 1.3x to 1.7x? | FFX (VIII) | Keep the streak, and close the issue as intended. | answered 2026-09-27 (D-249) |
| Q10 | **PR-0197.** Keep your 2026-09-21 advisor rules (a refused revive, and saves-from-lethal first), although the Omnis advisor wins 25 of 40 against the line's 27? | FFX (XII) | Keep them. The disc half is fixed. | answered 2026-09-27 (D-249) |
| Q11 | **PR-0034.** The Chapter I grade is dark because the whole game renders in linear light. May we show a four-scene before/after sheet (OR-15) before touching the pipeline? | both | Yes to the sheet. No blind pipeline change. | answered 2026-09-27 (D-249) |
| Q12 | **D-201 follow-up.** After a KO on a phone, Mindy slips off the right edge in XI: (a) weight a KO'd member lower in the framing, or (b) pull the Sisters link back? | FFX-2 (XI) | (a), as a Chapter XI option only, so the approved 60% framing stays. | answered 2026-09-27 (D-249) |
| Q13 | **Vegnagun, from your picked frame.** Flat Bulwark rings as in the pick. The HUD cards dodge the parts rather than the staging changing. | FFX-2 (V) | Informational. Both are class A and keep your pick exactly. | informational only, no answer required |
| Q14 | **Steam part 2**, about 20 minutes on a different FFX-2 save (the Via Infinito gave no encounter). It covers: the PR-0170 FFX-2 half; the NEW-C1 retail check; C-8 (does the FFX melee attacker run in and back?); the PR-0180 party half; Yojimbo's Wakizashi (Y-2); PR-0217 if GameFAQs is silent. | both | Yes, at a time you pick. No retail frames are saved. | yes already recorded (D-205); the time is still open (D-258) |
| Q15 | **NEW-C1.** A lone White Mage can stall Bahamut forever by healing. Add an FFX-2 stalemate watch (a new rule)? | FFX-2 (IV) | No. Record it as faithful information, unless Q14 shows retail ends the fight. | answered 2026-09-27 (D-251) |
| Q16 | **Carried from earlier sheets:** C-3, the Chapter IV pause plate; C-2, Wakka's pause-plate face pass; C-5, a repaint of Yuna's chip only; FOC18-06, the trimmed Chapter XIV pause copy; the inferred Wait briefing line; D-200's inferred results choices; FOC-06 at 1280x720, if the probe lands there; PR-0206's "no room" line, if the probe lands there. | per item | C-3: your pick. C-2: yes, shown 1:1. C-5: repaint the chip only. FOC18-06: keep it. Wait line: approve. D-200 choices: accept. FOC-06: fewer rows at 14 px. PR-0206: yes. | C-2/C-5/FOC18-06/Wait line/D-200 choices answered 2026-09-27 (D-250); C-3 still open (D-257); FOC-06 and PR-0206 not part of this reply, still open |

---

## 9. Method checks before building (class D; paper; L-4)

| File | Item | The crux |
|---|---|---|
| `docs/plans/pr-0131-method-check.md` (new) | PR-0131 | Two attempts failed. The chapter tactic raises into a Zombie on purpose, and the card places the tactic first by policy. Decide whether the fix is in the card order or in the forecast. |
| `docs/plans/pr-0034-method-check.md` (new) | PR-0034 | Output colour space: sRGB-encode the grade pass, or add an OutputPass, against a re-tune of each scene. What is the smallest test that tells them apart, and how many approved scenes must be re-looked? This feeds OR-15 and Q11. |
| A paragraph in B6's brief | PR-0014 | `t1-b3b` found every row accurate. Find the exact screen, dressphere and chapter behind round 13's frames before changing anything. |
| A paragraph in B5's brief | the party half of PR-0180 | Source it (L-4) or leave it out. |

Method checks that already exist and are acted on above: PR-0179, PR-0181, PR-0031, PR-0095/0094,
PR-0157, PR-0061 (with the round-13 addendum), FOC-06, PR-0206, PR-0180 and PR-0148.

---

## 10. Evidence only (class X), for round 14 or 15

- **PR-0021:** the rotation re-test at attempts 0, 1 and 2 (D-204).
- **Chapter IX:** Yojimbo P-1 and P-2 (D-222, D-223), and the seven boss poses (D-229, D-230).
- **Release 21's picks:** spell effects B (D-227), Vegnagun A (D-228), the attack pose (D-231),
  PR-0001, PR-0201.
- **Merged iteration 1 batches:** every item in `t1-b3a`, `t1-b4a` and `t1-b5`.
- **Releases 19 and 20:** PR-0198, 0207, 0208, 0153, 0123, 0199, 0200 and D-198.
- **Captures of issues probably already fixed:** PR-0144, 0057, 0063, 0113, 0114, 0188, 0018, 0127
  and 0081.
- **PR-0216:** re-probed on an idle host.
- **Records to close:** PR-0060 (no Yu Yevon portrait, D-208), PR-0167 (D-207), PR-0140, PR-0210.
- **Accepted and disclosed:** FOC18-01 (D-197) and PR-0035 (D-167).

---

## 11. What iteration 2 is worth (estimates, not scores)

| Category (weight) | Round 13 | Main lifts in this plan | Estimate after release 23 |
|---|---|---|---|
| Combat (20) | 8.7 | B1 (the engine polish, PR-0179 answered, the switches answered) | 9.1 to 9.3 |
| Visual (15) | 8.3 | B2, B3 and B5 (PR-0181, 0031, 0095/0094, 0157; A-1 to A-14) | 9.0 to 9.2 |
| Feel (10) | 7.8 (stalled) | PR-0061(a), PR-0180, PR-0104, A-3, A-13, and the spell effects | 8.8 to 9.1 |
| Narrative (10) | 8.1 | B4, plus the Q2 story read | 8.8 to 9.1 (Q2 is the gate) |
| Interface (10) | 7.2 provisional | FOC-06, PR-0206, 0018, 0019, 0170, the pause and board items | 8.8 to 9.1 |
| Onboarding (5) | 7.1 | B7 (release 24), A-16, and the phone-tap coach fix | 8.8 to 9.2 after release 24 |
| Prep (5) | 8.5 | PR-0138, 0174, and PR-0109 (`t1-b4b`) | 9.0 to 9.2 |
| Delivery (5) | 8.2 | A-3, A-16, `t1-b4b`'s dist filter, and real-key wins | 8.9 to 9.1 |
| Audio (10) | UNVERIFIED | Only Q1 moves it | none until Q1 |

The 9.60 total still needs audio near 9.6 (thresholds §1). Iteration 2 aims at every floor at 9.0 or
more.
