# Pyrefly Reprise — the critic (policy v2)

**In force since 2026-09-20.** Bailey approved the consolidated critic that day ("this message is my approval of the proposed scoring, gates, cadence, and resource controls"). It replaces the three-part rubric, which is archived at [archive/RUBRIC-v1-ABC.md](archive/RUBRIC-v1-ABC.md): rounds 02 and 03 were scored under it, keep their numbers, and are never compared with a score made here.

This file is the one scoring definition and the one schedule. Its machine-readable half is [policy.json](policy.json); `tools/critic-policy.mjs` enforces exactly that file, so a rule changes in both or it has not changed. The check library is [CHECKS.md](CHECKS.md).

## 1. Purpose

Protect the game Bailey actually wants: a beautiful, emotionally engaging, browser-based collection of memorable FFX and FFX-2 encounters, with faithful game-specific mechanics, convincing characters and environments, cinematic presentation and enjoyable replay.

The critic is independent of the builder. It reports observable player problems, their causes where established, and the smallest useful corrections. It does not write product code, redesign approved work, inflate scores or manufacture defects to sound severe. Scrutiny means stronger evidence, consistent standards and useful prioritisation.

**Every deployed build is evaluated. The depth of evaluation follows what changed. The finished-game standard remains 9.6 / 10.**

## 2. Governing scope and decisions

The project is `D:\Final Fantasy`, a TypeScript / Vite / Three.js browser game. Other projects inform lessons, never requirements.

- FFX and FFX-2 stay distinct collections with their own rules, tone, characters, presentation conventions and progression. Faithful CTB and ATB, encounter mechanics, abilities, equipment and preparation, from the project's cited research; conflicting or missing evidence is reported, never invented (AGENTS.md hard rules 6 and 14). An ordinary party preset is a justified authored approximation, not a claimed average of all players.
- Painted 2.5D and the approved Ink & Gold direction. A generated mockup is a target, never proof of implementation or performance.
- Clair Obscur informs atmosphere and cinematic presentation; its parry / dodge mechanic is excluded. The games' own timed inputs (Overdrives) are canon and are not that mechanic. Persona influence is limited to specifically approved treatments.
- The pause screen centres expressive character close-ups (Until Dawn), sharp, with usable controls and hideable panels.
- Context, dialogue, banter, climax, aftermath and retry matter alongside the fight. A scene counts only when the player can reach it.
- The strategy guide, the move advisor and the enemy-intent display are separate capabilities. The advisor offers legal, useful actions, says where they are in the menu and what they cost, handles recovery, and separates certainty from conditional or random outcomes.
- **Approved artwork is protected.** Check its identity, crop, resolution, framing, staging and integration. Never replace it because a reviewer prefers something else (`docs/target/approved-hashes.json`). A separately approved face pass authorises only that named change.
- Record every feature as **FFX only / FFX-2 only / both** with its source, and verify both the intended presence and the intended absence (CHK-021).

Scope today: five chapters (Seymour Flux, Yunalesca, Braska's Final Aeon, FFX-2 Bahamut, Vegnagun and Shuyin). Bailey has also approved three more (Seymour and Anima at Macalania, Evrae, the Leblanc Syndicate at Chateau Leblanc) and twelve presentation changes; approval does not mean implemented, and their season is undecided. **Every review freezes a short release manifest**: included chapters and features, supported platforms and controls, changed files and assets, approved targets, known defects, the previous verified build and this candidate's identity. Future work does not block an unrelated interim release; a final milestone cannot silently drop promised scope to pass.

Platform goals carry over: keyboard, mouse, gamepad and touch; Chrome, Edge, Firefox and Safari; phone and 4:3 to 21:9 and 4K; 60 fps at 1600×900 and a load under five seconds, measured on named hardware, browser, network and cache conditions, reporting frame-time spikes and first-ability stalls as well as the average. Missing hardware or native-browser evidence is UNVERIFIED, not a pass.

Use the latest explicit owner decision on the same subject. `docs/PRODUCT-BRIEF.md` is a draft: its inferred lines are not orders. An approved adaptation is an exception with its exact scope, and is not penalised again for differing from the reference it adapts; it does not erase an observed usability defect.

## 3. Three separate verdicts

Every report distinguishes:

1. **Deployment verification** — did this exact artifact load and behave as checked on the live URL?
2. **Change acceptance** — did the changed area meet its approved target and avoid regressions?
3. **Milestone quality** — does the complete declared milestone meet the 9.6 standard?

Results are `PASS`, `FAIL`, `UNVERIFIED` or `NOT APPLICABLE` with a reason. A deployment can be verified while the milestone is unfinished. A failed test, an unavailable environment or missing evidence is never a pass. An old full score keeps its old build and date; a focused pass cannot make it the current build's score.

## 4. When the critic runs

Budgets are starting review-overhead budgets, not guarantees; they exclude builds, uploads and any uninterrupted playthrough a check requires. Tune them after three real runs. Required work never becomes optional because a budget ran out.

| Trigger | Required review | Budget / stop rule |
|---|---|---|
| New screen, major presentation choice, mechanic or encounter | Plan / target check: source-game fit, explicit approval, feasibility, acceptance cases, scope | 5–10 min; ask only for the missing decision |
| Ordinary local edit | Builder runs the relevant automated checks; no separate critic | No score ceremony |
| Completed feature or defect batch, before deployment | **Focused** review on the immutable production preview: changed flow, dependencies, owner-reported regressions, applicable target comparisons | 5–15 min; extend only for a named risk |
| **Every deployment** | **Live**: the exact artifact at the real URL (CHK-017), asset loading, real-input smoke, the changed flow | 2–5 min for a small change |
| Changed artwork or audio batch | Subject-specific review in the running game; technical and listening checks for changed audio | Folded into the focused pass, same capture session |
| Shared combat timing, battle presenter / lifecycle, save schema, asset loader, global layout, broad audio routing, new chapter, major integration, or a finished-milestone claim | **Deep** review of every affected chapter and system, **before public deployment**; a full **milestone** review when the change crosses most systems or is final acceptance | Checkpointed 30-minute blocks; complete the required coverage |
| Three substantial checkpoints since the last deep review, or seven active development days with unreviewed changes | One accumulated-change deep review, sampling unchanged areas | One combined review, never one per commit |
| Bailey finds a defect | Reproduce, explain the escape, strengthen the smallest relevant permanent check, verify the repair | Immediate focused retrospective; no unrelated rescore |
| Onboarding / help changes, or every third deep review | Cold-start walkthrough with only visible instructions and ordinary controls | Inside the deep review; say whether the newcomer was simulated or real |
| Crash or corruption touching the project or its assets | Integrity check of the affected files, build and media; model hashes when generation is implicated | Widen only on evidence |
| No product change | Nothing scheduled | No automatic regrade |

`node tools/critic-plan.mjs` decides which row applies from the changed paths (git, plus shipped art and audio from the artifact manifests, because `public/art` is not in git). Its rules are the `rules` list in policy.json. It fails closed: an unknown change set or an unclassified product path is a deep review; four focused systems or more than forty shipped files in one batch is a deep review; a request may raise the depth and nothing can lower it. The evidence baseline for reuse is round 03 on build `7191674`; its numbers stay history.

A full review need not replay an unchanged chapter on the live site when the deployed artifact is verified identical to the production candidate, the chapter's evidence is still valid, and live smoke covers hosting risks. Example: a pause-caption repair needs real pause / hide / show input, clipping checks, a target comparison and live verification, not another combat audit. A CTB scheduler change needs the sourced engine regression cases and the affected FFX encounters; it is never a cosmetic fix. An asset-loader change needs every chapter's assets, FFX-2 included.

## 5. Evidence

- **Match proof to the claim.** Mechanics: seeded executable tests against sourced expectations. Interaction: real keyboard, pointer, touch or controller events and the resulting state. Appearance: validated in-game captures at actual display size. Motion: clips or timed sequences. Audio: decoded shipping files, runtime routing, measurements and listening. A hash needs no screenshot; a screenshot proves no key.
- Debug hooks may set up a state. They cannot prove a player can reach it, win it, pause it or leave it. Milestone acceptance needs, for each included chapter, one continuous legal-input route from normal entry to outcome, reachable aftermath and results, and retry / return (CHK-022).
- Exercise intended tactics and credible mistakes, defeat and recovery, cancel / back, scene skip, phase and actor changes, low resources, statuses, summons and game-specific commands. Never assume a boss pattern from memory or punish a canonical tactic for being strong.
- Audit every changed data value against its source and run its dependent tests. Deep reviews also sample unchanged high-risk mechanics and documented boundary cases. The old quotas (forty values per game, twelve screenshots per chapter) are replaced by an explicit coverage matrix in the report.
- Confirm screen, chapter, phase, actor and state before each capture (CHK-016). A failed wait throws or records `UNVERIFIED`; it never screenshots the title screen. Separate harness failures, a saturated host and product failures.
- Compare target and build in the same context. A still approves the named visual properties; interaction and motion need their own criteria. Responsive adaptations that keep the approved composition and function are fine; pixel identity is not the goal.
- Focused layout reviews use 1600×900 and Bailey's 2000×1012, plus 390×844 when phone or shared layout is touched. Deep coverage rotates the 4:3, wide, 1440p and 4K shapes. Emulation is not proof of a real controller, a real phone or Safari.
- Check effective rendered text size, clipping and contrast, including transforms. An approved close-up may crop a head on purpose; accidental crop damage is the defect. Battle-facing rules do not apply to a viewer-facing pause portrait.
- Record commit, **full artifact manifest hash** (art and audio ship separately from the bundle), target version, test version, seed, URL, device, browser, renderer and input path.
- **Reuse evidence only with a recorded dependency argument**: relevant code, assets, settings, targets and test assumptions unchanged, compatible environment, no open related defect. A shared-system change invalidates what depends on it. Carried-forward evidence is shown as carried forward. Required untested items remain unknown.
- A load succeeded when the content type is right and the file decodes, not when the server said 200. Undecodable or blank media is quarantined and cannot pass; intentional black or silence is listed as intentional (`intentionalFlatImages` in policy.json).
- Say which tool heard what. No agent claims to have listened when it read data. Approving an audio direction approves neither every future cue nor a numeric beauty score.

## 6. One quality score, plus gates that do not average

| Category (`id`) | Weight | What the critic judges |
|---|---:|---|
| Combat correctness (`combat`) | 20 | CTB versus ATB; formulas, resources, statuses, timing, switching, aeons and Overdrives or chains, dresspheres and Garment Grids |
| Encounter authenticity and balance (`encounter`) | 10 | Party presets, boss phases, AI and counters, signature mechanics, intended strategy, fair wins and losses, correct difficulty |
| Characters, environments and visual craft (`visual`) | 15 | Recognisability, expressions, costume, poses, facing, silhouettes, composition, staging, ground contact, lighting, consistency, correct rendering of approved art |
| Game feel, animation and cinematic direction (`feel`) | 10 | Responsive input, action and reaction timing, coherent camera, impactful but readable effects, smooth transitions, respectful skip and replay |
| Narrative, emotion and character voice (`narrative`) | 10 | Context, faithful beats, banter, stakes, reachable scenes, the right tone for each game, a satisfying aftermath |
| Music, sound and audio direction (`audio`) | 10 | Technical health and routing, thematic coherence, phase transitions, mix, useful feedback, Bailey's listening assessment |
| Interface, information and controls (`interface`) | 10 | Clear target sets, readable names and values, reliable input, legal and useful advice, honest intent, cleanup, pause and prep usability |
| Onboarding, accessibility and options (`onboarding`) | 5 | Optional help that teaches the faithful rules, usable settings, text and input access, non-colour cues, motion and flash accommodations, device usability |
| Preparation, rewards and replay value (`prep`) | 5 | Meaningful sourced prep, learning and mastery, fast retry, understandable results, reliable progress; no deduction for unapproved meta-systems |
| Stability, performance and delivery (`delivery`) | 5 | Complete flows, valid media, save and reload, stable frame times, measured loading, browser and device coverage, the exact live artifact |

Category scores run 0–10 with one decimal; total = Σ(score × weight) / 100, **tested unrounded against 9.60** (9.595 is not acceptance). Anchors: 5 = substantial gaps or placeholder delivery; 7 = functional with conspicuous weaknesses; 9 = polished with minor issues; 9.6 = the declared target delivered with only negligible defects; 10 = no material gap found in the complete tested scope. These are project acceptance judgments calibrated on Bailey's accepted and rejected examples, not an objective certification.

A final milestone is accepted only when **all** of these hold (`milestoneVerdict` in `tools/critic-policy.mjs`; a report that claims acceptance while a gate fails is rejected as evidence):

- the weighted score is at least **9.60** and **every category is at least 9.0**;
- the required evidence is complete: no `UNVERIFIED` category and no `UNVERIFIED` mandatory check;
- no critical or major defect is open, every included encounter completes through its real flow, and no required form, scene or final asset is missing;
- every required target in the milestone passes its acceptance criteria, protected assets are intact or explicitly revised, and the required human judgments are recorded;
- the exact deployment passes live verification.

Unknown categories are never averaged away and never scored zero: the assessment is provisional. An interim improvement may ship below 9.6 when its release checks pass, it adds no unaccepted major regression or unauthorised change, and inherited defects are disclosed. Save or progress corruption, a broken entry flow, an invalid release identity or an unapproved asset replacement are never waived by an improvement elsewhere. Score a defect where it belongs; cross-reference a separate demonstrated consequence; never multiply one issue across categories to push the total down. The gates replace the old numeric caps.

## 7. Approved-target acceptance (the old Part C, now a gate)

Each required target has an owner decision, a reference and version, a game and release scope, the selected properties, the matching build state and concrete acceptance cases. `docs/target/targets.json` records the **design status** (approved / awaiting decision / rejected / superseded); the **delivery status** (not scheduled / in progress / implemented / verified) is tracked separately, in the review's release manifest. Approved tiles are decision counts, not verified implementations; tiles that approve an audio direction or key art are not scored as screenshot matches.

A rejected candidate does not block completion when the chosen alternative passes. A missing target for a future chapter does not block today's repair batch. A missing target for a feature the final milestone requires blocks that milestone. Frozen originals are hash-protected; an authorised compression, crop or responsive variant is recorded with its transformation; arbitrary lossy regeneration is not an optimisation. A new subjective direction needs a new decision (AGENTS.md hard rule 9); correcting the build to match an existing decision uses the existing approval.

Compare with `node tools/end-state-board.mjs --pair <target> <capture> --out <file.jpg>` and read the composite. The report counts targets **required / matched / failing / unverified / waiting on a decision**; for a milestone, anything but `matched` blocks acceptance.

## 8. Findings, repair and reporting

One deduplicated issue list with stable IDs. Critical first (crash, lock, lost progress, failed outcome), then major (wrong mechanics or information, unusable controls, severe visual or target deviation, missing required content), then polish, then suggestions. Within a severity: Bailey's reported problems, frequency, player impact, coverage and effort. Never whatever most cheaply lifts a decimal.

Every finding carries: build; game, chapter and state; expected versus observed; reproducible steps and seed; evidence; confidence and verification status; the requirement; file and line only if actually traced; the smallest proposed fix; its acceptance check. A suspected root cause says "suspected". One root defect across several chapters is one ticket.

The builder gets the whole relevant batch once. Verification checks the repair and its neighbours. **After two unsuccessful attempts on the same failure, stop repeating the approach**: diagnose or escalate the blocker and continue independent authorised work. That is an operating limit, not permission to call the task done below the bar. Bailey's pause instructions are honoured.

Proposals live in a separate unscored section (idea, benefit, cost, source-game fit and risk, a concrete preview) and nothing is built without Bailey's yes. A concept image's incidental labels are not scope.

Every report starts with:

```text
Build / artifact / target version:
Review: focused | live | deep | milestone
Deployment: PASS / FAIL / UNVERIFIED
Changed area: PASS / FAIL / UNVERIFIED
Milestone: incomplete | not assessed | accepted
Quality: current full score, or last full score + its original build and date
Targets: required / matched / failing / unverified / waiting on decision
Top issues: stable ID, impact, evidence, next correction
Coverage: tested, reused with reason, not tested
Next required review and why:
Elapsed review time / repeated work avoided:
```

and is saved as JSON beside the prose: `critic/reviews/<sha>-focused.json`, `critic/reviews/<sha>-live.json`, `critic/rounds/round-NN.json` for deep and milestone reviews. `validateReport` requires: `rubricVersion: 2`; `review`; `build.mainSha` (plus `bundle` and `artifactHash` for live and milestone); `date`; `verdicts.deployment`, `verdicts.changedArea`, `verdicts.milestone`; and for each entry of `checks` an `id` from the library, a `result`, `mandatory` when it is, `evidence` for a PASS (or `reusedFrom` with its `dependencyArgument`), and a `reason` for UNVERIFIED or NOT APPLICABLE. Deep and milestone reports add `categories`, `issues`, `encounters`, `targets`, `humanJudgments` and `coverage.requiredNotTested`. A check record also names the game, chapter and state, artifact and target versions, environment, whether it was automated or manual, and the time it took.

At a visible milestone show a little useful real-game evidence. Announce each live build with what changed and what to try, and the usage readings Bailey asked for. Do not make Bailey certify basic function by replaying every small deploy; ask for judgment when feel, sound or a subjective choice materially changed.

## 9. Keep it affordable and consistent

Build one immutable candidate. **One process owns browser capture on this machine**; other reviewers reuse its validated evidence. Serialise capture with release builds and sweeps, and check GPU contention with art rendering. A resource-contention timeout is investigated before it is called a game defect. GPU captures (`PYREFLY_BROWSER=gpu`) and software-renderer goldens serve different purposes; say which was used.

Use bounded specialist help only where it replaces distinct work, within the task's delegation authority and the usage readings (check the 5-hour and weekly allowance before any fan-out). Independent judgment matters more than agent count. Share a compact brief, the relevant sources, the evidence and the acceptance criteria, not whole histories. No recursive review swarm, no duplicated full playthroughs, no indefinite polling, no perpetual worker reactivation.

Record review time and escaped owner-found defects to judge the critic itself. More checks or lower scores are not success if the same visible bugs keep reaching Bailey.

## 10. How this is enforced (and what still is not)

| Rule | Where it lives |
|---|---|
| Which review a change needs | `node tools/critic-plan.mjs`, rules in `policy.json`; `tools/deploy-pages.mjs` runs the same code and prints the plan even on `--dry-run` |
| Shared-system change needs deep evidence before going public | `tools/deploy-pages.mjs` refuses unless a validated deep report with a passing changed area exists for that commit |
| Exact-artifact identity, media that decodes (CHK-017, CHK-019) | `tools/artifact-manifest.mjs`: the deploy hashes and decode-checks every shipped file, publishes `artifact-manifest.json`, compares the live bytes, and stores the manifest in `critic/artifacts/<sha>.json` |
| Separate obligations per live build | `critic/pending/<sha>.json` lists `live`, `focused`, `deep`, `milestone`; `npm run critic:status` shows them and fails while any is pending |
| Only evidence settles an obligation | `node tools/critic-clear.mjs --report <file>`: validates the report, refuses another build's report, never lets a focused or live report settle a deep review, leaves UNVERIFIED pending. Reviewers never delete markers; settled ones move to `critic/cleared/` |
| A replaced build's debt is not forgotten | the deploy moves an unsettled deep review to the new build and records what was never verified |
| Accumulated-change trigger | `critic/ledger.json`, restarted by a settled deep review |
| Score and acceptance gates | `weightedTotal`, `milestoneVerdict`; the status reader recomputes a v2 score from the categories and always names the build it belongs to |
| The reviews themselves | workflow scripts in `critic/runner/` (`focused.js`, `live.js`, `deep.js`), launched by the release workflow according to the plan |

Proved by `tests/unit/critic-policy-v2.test.ts` and `tests/unit/artifact-manifest.test.ts`. **Not automated yet** (each check's `automation` field in policy.json says planned / implemented / human): most CHK checks are still performed by a reviewer rather than by a test; delivery status per target is not tracked in `targets.json`; there is no physical-device, Safari or real-controller evidence path; review time and escaped-defect counts are recorded by hand in reports. Say so in a report instead of implying coverage that does not exist.
