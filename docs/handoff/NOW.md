# NOW — where Pyrefly Reprise stands

> **Snapshot: 2026-09-21 20:05 EDT (machine clock)**, written by the driver session ("FFX/FFX-2 2.5D game recreation").
> **USAGE MODE: NORMAL, set by Bailey's word** (2026-09-21 20:00 EDT, offered the spend order "1 release tonight, 2 living
> portrait round 2, 3 music audition, 4 art consistency pilot; chapters after the weekly reset", Bailey answered:
> **"1+2 and 1 new chapter finished. Don't hold back."**). **PROTECT from 2026-09-22 02:00 EDT: weekly all-models 94
> percent used (6 left), weekly Fable 79, 5-hour 8; the week resets 2026-09-26 07:00 EDT.** The three named tracks are
> finishing their last agents (deep review of release 08, the first-last-frame video judge, a rig re-capture); NO new
> workflow or agent starts before the reset unless Bailey says so by word. Release 09 (Leblanc) waits for Bailey's two
> answers and his word on spending the last points. Bailey sets the mode by word and agents may only tighten it (hard rule 15): the three
> tracks below run at full depth; anything else still waits.
> **RUNNING-LINE RULE (learned tonight):** when a workflow id below is listed as running, that line is ABOUT the agents of
> that workflow. If you are one of them, it is you: carry on with your brief. Nobody stopped for being "a duplicate".
> **DONE tonight: the pause remake is BUILT and VERIFIED** (`9af4e2c` target tile + D-021, `8cf1724` build, `921dfdb` fix
> pass after an adversarial pass with real input; `docs/handoff/pause-remake.md`). Owed: `tests/e2e/pause.spec.ts` still
> drives the old DOM; the plate does not follow the current dressphere; the FFX-2 grid-bonus bar is not built.
> **CHAPTER ART VERDICT (driver looked at the veto sheets 1:1):** painting quality is at Bailey's bar (Bailey on the Leblanc
> close-ups: "AMAZING ... exactly the kind of quality i expect") but the battle POSE SETS drift in identity (Leblanc's hair
> and dress change every state; Logos's helmet; Evrae's colours) because the monochrome guard in `4a41248` dropped `--ref`.
> The installed leblanc / ormi / logos / evrae sets are CANDIDATES, not approved: the `chapter:leblanc:2026-09-21` hash set
> is to be removed from `docs/target/approved-hashes.json`. Macalania art was not started.
> **TONIGHT'S THREE TRACKS:** (1) release 08 (pause remake + advisor v2 + Active ATB + onboarding on + restored art) after a
> tidy batch; (2) living portrait round 2 (study `wf_48a6ffff-8cc`, then the build); (3) the LEBLANC chapter finished end to
> end (art consistency pilot and re-render, scene, guide, registration, measured under Active ATB, verified) as release 09.
> **Art generation: ON** (Bailey, 2026-09-21: "Resume local art generation").
> **BAILEY'S DECISIONS TODAY, verbatim:** on the pause menu remake (Until Dawn character-screen layout in our art style,
> mockups in `docs/concepts/pause-until-dawn/`; asked grade A or B, may the text block move to the painting's empty
> side, are the meters right, may MUSIC be its own tab) — **"B, yes, yes, yes."** On scope: **"This needs to be
> included in our next build as well"**; **"The characters should be expressive and should be controllable by
> keyboard ... The characters need to be animated. In motion."** On release pacing: **"I'll go with your
> recommendation as usage becomes a concern. One chapter at a time is ok. I expect timely mockups for the pause menus
> please."** Build C scope, earlier the same day, still in force: **"you need to finish ALL chapters the new chapters
> need to be done"**; **"the move advisor needs to be way smarter and way more aware of what is going on turn by turn
> and what character you are controlling. music is too reminsicent of snes music instead of the more modern final
> fantasy titles and clair obscur. all of these next to be fixed very next build."**; on the music downloads and
> plan: **"yes you have my approvals there for music"**. A sub-agent that sees a status question relayed from the chat ("eta?") must NOT answer it: the driver
> answers the owner; agents do the task in their brief.

## Live: Build C.1 (release 08)

- https://baileypillon.github.io/pyrefly-reprise/ = `main 1b33971`, bundle `BvhtVfzJ`, deployed 2026-09-21 23:48 EDT under
  Bailey's owner override, verbatim: **"Push the live build now please"** (the override authorised the deploy agent; it
  settles no review obligation). Contents: the pause remake on the Until Dawn character screen, move advisor v2, FFX-2
  Active ATB, Auron's briefing switched on, art round 4 restored, the front-end type floor, and FOC-01 to FOC-04 fixed.
  The build before it was B.1 (`8f48237`).
- Focused review of the candidate: SHIP, with disclosed majors FOC-05 (the FFX first-turn coach mark overlaps the advisor
  card, first time only) and FOC-06 (the advisor card's type sits under 12 px, inherited from the live build). live
  verification PASS (settled 2026-09-22 00:45 EDT, 863 files, real-input smoke, reload smoke, 0 console errors); deep
  review round 08 ran on the live build (critic/rounds/round-08.md): deployment PASS, changed area FAIL, ship verdict
  HOLD recorded against the NEXT candidate because of PR-0076 (chapter 5's intended line falls from 40/40 wins to 0/40
  at any human decision time because Active ATB runs the clock under an open menu; a regression against the previous
  live build) and PR-0080 (an open command menu is replaced in place by another character's list with no keypress, in
  262 ms, under the player's thumb); the critic's player-side correction: let a chain-locked character keep her queued
  command (four in five lost menus are chain locks), never tune a boss; disclosed majors PR-0077 (pause CHAPTER tab: 15
  hand-written art paths miss their art/ segment, 84 404s, one-line fix at src/app/screens/pause/markup.ts:130, do not
  prefix heroArtFallback), FOC-05, FOC-06, PR-0075 (FFX-2 healing items roll the enemy hit check against the ally's own
  Evasion and are consumed on a miss; FFX's accuracy.ts has the carve-out FFX-2 lacks), PR-0078 (victory results screen
  crops the leader's portrait to one eye with object-fit cover, both games); the deep obligation is STILL PENDING
  (carried from `fd0ae96` and `8f48237`): it needs Bailey's audio audition verdict (CHK-001/CHK-B1, third round asking),
  one real-input victory through to results per game (CHK-022), the advisor's on-screen checks CHK-004/005, the
  CHK-002/007/009 sweeps and a chapter 3 in-battle capture; score provisional, audio unscored, every category under 9,
  13 of 30 required targets matched.

## In flight: Build C (the next live build)

- Scope: earlier today's directive still stands — all three new chapters finished (Leblanc at the Chateau, Seymour and
  Anima at Macalania, Evrae on the airship), move advisor v2, modern-sounding music, FFX-2 Active ATB (built and
  verified: `45f98b9`, `bf19c37`, `33dba4d`, `073f678`) and onboarding switched on. Bailey has now also folded the pause
  menu remake into this build (see decisions above) and set the release pace to one chapter at a time as usage requires.
- Done: engine and data for Macalania (`074a198`, 80 percent) and Evrae (`dc1979f`, `959fade`, 97.5 percent); quick wins
  (`c7f5be4`, `71059ae`, `8fe4f99`, `de99ba4`); three story scripts; decision records (`26ee387`); music plan
  `docs/plans/music-modern-sound.md` (`fe11c60`).
- **Move advisor v2 is BUILT and measured** (`55540b9`, `f0ff68a`; `docs/handoff/advisor-v2.md`). Forty seeds a chapter,
  a bot pressing the card's top row every turn: ch1 62.5 to **67.5** percent (the chapter line itself wins 65), ch2 82.5
  to 85 (line 97.5), **ch3 0.0 to 97.5** (line 97.5), ch4 100, ch5 100 to 97.5. Chapter 3's median falls from 448 turns
  to 216. Latency p50 1.4-3.6 ms, p95 2.3-5.1 ms. Three defects, all found by running the engine: a switch's incoming
  member was not part of its command identity, so "put Lulu in" picked Wakka; the ownership gate refused Doublecast's aim
  at the boss, so ch3's line was thrown away on every Lulu turn; and a status the preview answered at its median was
  charged as a wasted turn, so ch3's Slow sorted behind Cheer. `MoveAdvisor.ts` untouched, nothing in `src/battle/**`
  changed. **Chapter 2 cannot reach its bar and the reason is measured, not tunable:** all 319 of its 319 divergences over
  eight seeds are the chapter line calling for Defend, which the FFX command window does not paint at all - so the
  auto-battler wins ch2 with a move no player can press. Bailey's call (handoff section 7).
- **DONE today: pause-remake options picked.** Bailey graded the Until Dawn options round "B, yes, yes, yes" — grade B,
  the text block may move to the painting's empty side, the meters are right, and MUSIC gets its own tab.
- **DONE today: living-portrait research and prototype** (`f1729e3`: `docs/plans/pause-living-portraits.md`,
  `docs/concepts/pause-until-dawn/prototype/`; run `npx vite --port 5477`, open
  `/docs/concepts/pause-until-dawn/prototype/`). Recommendation: procedural head-depth shader parallax plus blink and
  expression patches inpainted with our own Animagine model, zero downloads (rejects LivePortrait: its InsightFace
  buffalo_l dependency is non-commercial). GPU draw p50 0.036 ms. Awaits Bailey's verdict **by feel** on which reading
  of the gaze to keep (head, eyes or camera) before it is ported into the pause screen's PortraitStage; blink and the
  expression toggle are faked in the prototype and want inpainted patches; Wakka's tilted eye line and the one-eyed
  plates (Auron, Kimahri) are not handled yet. Optional download needing a yes: `depth_anything_v2_vits.pth`, 99.2 MB,
  Apache-2.0.
- **DONE today: the music downloads Bailey approved** ("yes you have my approvals there for music") are on disk under
  `D:/Tools/audio-libs` (vsco2-ce 3.2 GB, vcsl 6.2 GB, `_dl/sfizz-1.2.3-win64.zip`) and
  `D:/Tools/ComfyUI/ComfyUI/models/checkpoints/ace_step_v1_3.5b.safetensors` (7.7 GB); the VSCO 2 CE SFZ patches branch
  is cloning into `D:/Tools/audio-libs/vsco2-ce-sfz`. Checksums: `D:/Tools/audio-libs/_dl/fetch-music-2026-09-21.DONE.txt`.
  Still needing a per-item yes: hall impulse responses, any ACE-Step custom nodes.

## State of the three tracks (2026-09-22 02:40 EDT)

(a) Release 08 LIVE as above; next batch must lead with PR-0076/PR-0080 (or Bailey's word that the Active trade is what
he wants at this price) and PR-0077.

(b) LEBLANC = Chapter 6, registered end to end (`c473de8` registration, `68b8b6b` scene, `e226a5a` guide/meta, `5e22dfb`
data findings, `597e304` fixed a critical: the painted enemies never appeared because of an 'ffx2-' spriteKey prefix;
`8c646c4` measured under Active ATB: 40/40 at zero decision time, 4/40 at 1.5 s, 0/40 at 4 s, chapter 4 control 40/40
everywhere); ART for leblanc/ormi/logos re-rendered with the pilot's method A (forceRef 0.35 from the idle; pilot
`9e08955`; sets `9621f0e`, `1b33971`, `66e3e83`, `177396e`, `920dac8`, `2e5672d`) and STILL CANDIDATE, below the bar
(Leblanc attack reads as a flourish, hurt wears a different robe and does not read hurt after two attempts, Logos
headgear changes between states, Ormi shield/heart inconsistent); no approved-hash entries; three music cues owed
(chapter 4's reused), Paine art missing (stand-in), Act I/II dioramas reuse the Last Room. Waiting on Bailey: art 1A
ship as disclosed candidates / 1B hold; ATB 2A ship disclosed like chapter 5 / 2B build the sourced Config ATB speed
lever first; release 09 now or after the reset.

(c) LIVING PORTRAIT: rig v2 (`docs/concepts/pause-until-dawn/prototype-v2/`, commits `6000edf` keys, `572e18f` patches,
`63021ac` layers, `ebb71b0` runtime, `17b960e`, `98ff595` fix, `8d5c611` re-capture, handoff
`docs/handoff/living-portrait-v2-fix.md`): motion passes the measured spec; the assembly does not: box-edged layer
cut-ins, a collar seam in every still, a doubled iris and hair box edge at -40 degrees, patch rectangles; next round =
silhouette-true masks (segmentation model download to propose), hidden-region inpainting, per-triangle mesh warp,
colour-matched patches, profile-right by flip + iris swap, closed eyes and blink intermediates, brows via the fringe
layer. Video route (`docs/concepts/pause-until-dawn/video-preview/` round 1 on the 5B model: identity holds on subtle
motion, lost on turns, stitched preview REJECTED by Bailey; `video-flf/` round 2 on Wan 2.1 FLF2V 14B: identity 9, no
framing drift, joins 19x better, but the END frame is not anchored because WanFirstLastFrameToVideo masks a phantom
slot; fix = feed end_image as a 4-frame batch via RepeatImageBatch, motion peak earlier, 24 fps; ~72 min per clip; VAE
floor face MAD 3.85; no earring on this plate, the markers are the braid and clasp); rule: nothing with a visible join
is shown to Bailey.
- Next, in order: (1) pause remake verified, then the living portrait ported for the main party; (2) one tidy pass:
  advisor v2 bench harness fallback and three test defects (`docs/handoff/advisor-v2.md`), Leblanc provenance labels,
  front-end phone type floor FE-001; (3) first incremental release, round 08, launched **top-level** with
  `critic/runner/release.js` from the clean worktree: pause remake + advisor v2 + Active ATB + onboarding switched on +
  restored art + quick wins; (4) music workflow, after the 20:30 EDT reset and once the GPU is free: SFZ
  multi-velocity renderer, ACE-Step restyle, A/B/C audition on `docs/audio/audition.html` for Bailey's ear; (5)
  chapters one at a time (Leblanc, Macalania, Evrae): scenes, staging, guides, registration, release each.
- Open with Bailey: the gaze reading by feel (prototype: head, eyes or camera); Evrae order widget (rec. A + C's
  staging) and Anima arrival (rec. A then B's tag); Macalania cue mood A or B and the music audition; chapter 5 under
  Active ATB (0 of 40 wins at human decision times: measured options owed); Nul spells party-wide if sourced; the
  items already listed in "Waiting on Bailey" below that these facts do not close.

## Waiting on Bailey (none of these blocks the release)

Whether Active mode includes "an enemy hit closes the open menu and delays that character" (asked 2026-09-21, not yet
answered); the cost of a denied turn (marked `[estimate]`); whether FFX-2 letters a boss's same-named parts;
whether the advisor may overrule the guide's pinned pick when a revive scores far higher; a mute row in OPTIONS;
whether the never-wired "Turn cut-in" tile still stands; options rounds for the defeat screen, the advisor card, the
enemy-move panel and the phone layout; an audio score out of ten; Chapter 5 length and Chapter 1 difficulty (bring
measured options).

## Machine

- D: is flagged dirty and RAM runs XMP 6400 past AMD's 5200 limit: crashes and in-place file corruption. Boot-time
  chkdsk is scheduled for C: and D:. Bailey is turning XMP off in the BIOS, then updating the BIOS (FA2 to FC4c) and
  trying 6000. Guides: `C:\PyreflyBackup\BIOS-quick-guide.pdf` (2 pages), `PC-stability-guide.pdf` (full).
  After the repair: run `git fsck`, re-hash the ComfyUI models (ART-PIPELINE section 9), re-run the approved-art check.
- Never run `npm ci` in this tree while dev servers are up (it half-deleted `node_modules` on 2026-09-19;
  `npm ci --offline` restored it). Releases are cut from `D:\pyrefly-release`; delete its `dist-gate/` before deploying.

---
*Older snapshot (2026-09-19 08:05 EDT) kept below for the track tables; where it disagrees with the block above, the block above wins.*

> **Snapshot: 2026-09-19 08:05 EDT**, written by a side session from `git`,
> `docs/deploys.log` and the driver session's 22:15 notes. Whoever drives the project
> refreshes this file at the end of every work block. If this date is more than a
> day old, trust `git log -15` and `tail docs/deploys.log` over anything below.

## Live

- https://baileypillon.github.io/pyrefly-reprise/ = `main 5a82e71`, bundle `CF_L2xLd`, deployed
  2026-09-19 04:52 EDT (recorded in `97b1e56`), verified live with real key presses (Esc, P, H, N, E),
  prerendered audio playing, 0 console errors, 0 404s. Refreshed by the driver session 08:05 EDT.
- **Critic round 02 is complete** on that build: [critic/rounds/round-02.md](../../critic/rounds/round-02.md).
  Headline **3.5** (Part A 5.6, Part B 3.5, Part C 5.3; gate 9.6; Part C coverage incomplete). 45 ranked
  issues (26 blockers) and 5 proposals that need Bailey's yes. `critic/pending/` is clear.
- **Bailey's standing instruction (2026-09-19): everything is PAUSED except the concept boards**
  (`docs/concepts/polish/`, workflow running in the driver session). Do not start fixes from the critic's
  list, the fix-round-3 tracks, targeting, the audio fix pass or art until Bailey says resume.

## Who is active

- The Claude Code driver session "FFX/FFX-2 2.5D game recreation" runs the fix-round-3
  workflows. Its agents leave uncommitted work in the tree. At this snapshot:
  ~370 files under `docs/screenshots`, 60 under `tools/gen`, 21 under `src/audio`, and
  a few each in `src/ui`, `tests/unit`, `public/audio`, `src/app`, `src/data`, `src/story`.
- **If Claude's weekly allowance has run out, those agents are dead and their edits
  are still here.** Do not clean up. Before touching a modified file, read the matching
  `docs/handoff/fix3-*.md` and continue that work.

## In flight: fix round 3 (Bailey's criticisms of the `822ae16` build)

States are the driver's 22:15 notes plus `git log`; confirm before relying on one.

| Track | Fixes | State | Handoff |
|---|---|---|---|
| advisor | Never names a move the acting character lacks; state-aware revive; plain-words card | `01d4f6c`, `3aa5440`; verifier refuted 3 points once, fix pass under way | [fix3-advisor](fix3-advisor.md) |
| ffx-hud | Stale "Ronso Rage" banner, card and chips over sprites, CTB names truncated | `ffc516b`; builder still running | [fix3-ffx-hud](fix3-ffx-hud.md) |
| ffx2-hud-prep | FFX-2 party-row portraits, measured face crops, prep tabs | fix pass 2 (`bf0e017`) | [fix3-ffx2-hud-prep](fix3-ffx2-hud-prep.md) |
| pause | Full-bleed 2x plates, viewport-relative type | in verification; `PauseScreen.ts` modified, uncommitted | [fix3-pause](fix3-pause.md) |
| audio | Sampled-orchestra prerender: 21 cues + 134 SFX (`e7a6ed5`); fix pass for QA's 7 findings (`6e8c145`) under way | **Bailey judges by ear**: `docs/audio/audition.html` | [AUDIO-GUIDE](../AUDIO-GUIDE.md), [THEMES](../audio/THEMES.md) |
| targeting | Bailey's criticism 8, built to the approved option B (`docs/concepts/targeting/b-ring-and-dim/`): bracket scaled to the figure, ink name plate with its letter tag, FFX's hand / FFX-2's flower, accent pool + quiet dim, spread formation measured against the camera | **done**, `83ea60a` `177c0ac` `8653b63` `764528e`; verified live in all five chapters (107/109 checks, GPU mode), two open questions for Bailey | [fix3-targeting](fix3-targeting.md) |
| art track 3 | X-2 cast and the X-2 bosses fix remain | Earlier art was painted with a corrupt checkpoint and IP-Adapter (replaced 21:43, checksums in `811682d`): check the A/B before spending GPU on re-rolls | `art3-*.md`, [ART-PIPELINE](../ART-PIPELINE.md) |
| concept boards | 22 polish ideas as mockups in `docs/concepts/polish/` | **mockups only**; nothing is built until Bailey picks | |

## Next tasks any agent can take (no GPU, each one testable)

From the pre-deploy gate at 22:15. **Reproduce each one first**; another agent may
have fixed it since.

1. Party prep ITEMS / EQUIPMENT print raw ids (`strength-10` reads as a penalty): show display names.
2. Sphere Grid shows `K1`-`K4` labels and a debug zoom readout to players: hide them.
3. The polaroid caption still ships with an ellipsis.
4. Chapter select's hint says LEFT/RIGHT for a vertical list and overflows at 390 px wide.
5. Phone viewport (390x844) is a letterboxed strip with unreadable text on every screen
   except pause. Needs a layout decision: mockup first, then Bailey.
6. Chapter 1 did not reach a first player turn within 40 s on a saturated machine
   (unproven). Re-test on a quiet machine before calling it a bug.

Then, in the owner's order: advisor correctness → pause screen → audio → layout
collisions → targeting.

## Closed recently (do not redo)

All four engine follow-ups from 09-16 are done and verified in this snapshot: the timed
Overdrive bare re-submit loop in both engines, the possessed-aeon data (Passado is
15 hits), the `effectiveStats` export (`src/battle/ffx/effectiveStats.ts`), and the
`PartyPrepScreen.ts` split (372 lines). Details: [play-engine-followups](play-engine-followups.md).

## Owner decisions in force

- **Critic policy v2 (Bailey, 2026-09-20): every deployed build is evaluated, and the depth of the review
  follows what changed.** Deployment verification, changed-area acceptance and milestone acceptance are
  separate verdicts; one weighted score (9.60 unrounded, every category at least 9.0) plus gates;
  approved-target comparison is a gate; unknown or stale evidence is never a pass; an old score never
  certifies a new build. `critic/RUBRIC.md`; `node tools/critic-plan.mjs` says which review a change needs.
  The "full round after every deploy" rule is replaced by this; rounds 02 and 03 stay as rubric v1 history.

- **Standing rule from 2026-09-19 (Bailey): every change is specific and game-aware.**
  True to FFX but not FFX-2: it does not apply to FFX-2. True to FFX-2 but not FFX: it
  does not apply to FFX. True to both: it applies to both. Decide from the sources
  (`research/*.md`, `research/ffx-vs-ffx2-presentation.md`), write the case in the plan,
  handoff and commit. AGENTS.md hard rule 14; the critic checks it as CHK-021.

- Release order: the gameplay-fix build first, the audio build second, then **pause all
  work** until Bailey says go.
- Local art generation is **on** (resumed the evening of 09-18) until that pause.
- Run two or three workflows at a time, and the release gate alone on a quiet machine.
  Six at once exhausted the 5-hour allowance at 21:45 and killed every agent mid-work.
- A release gate stops only for regressions; pre-existing defects get labelled and listed.

## Log (newest first; keep the last ten)

Template:

```
### YYYY-MM-DD HH:MM — <tool / session>
- Did:
- Verified by:
- Left uncommitted:
- Next:
```

### 2026-09-21 (evening) — Claude Code sub-agent (decisions index on the end-state board; nothing deployed)
- Did: game case **both** (records and tooling, no game behaviour). `tools/end-state-board.mjs` now renders `docs/target/decisions.json` under the tiles (new sibling module `tools/end-state-board-decisions.mjs`, 132 lines; board script 346 lines): proposed decisions first under "Awaiting Bailey's verdict", then adopted newest first, superseded last and muted; counts computed from the data; a missing or malformed `decisions.json` warns and the board still builds. `--decisions <path>` overrides the file. `decisions.json` gained D-022 to D-028: Bailey's project decisions that were on record only in an agent's private memory (deploy every green checkpoint and announce it; delegation and the top model's three jobs; never weaken a boss / measured options; release pacing; modern music; the Leblanc renders as the painting quality bar; a pick is never reopened). Every `words` value was checked verbatim against a source file; D-024 has none and is null.
- Verified by: the main session — board rebuilt (84 tiles, 28 decisions: 24 adopted, 1 superseded, 3 proposed), all 28 ids present in `docs/target/board.html`, screenshot `docs/screenshots/board-decisions.png`.
- Left uncommitted: `tools/end-state-board.mjs`, `tools/end-state-board-decisions.mjs`, `docs/target/decisions.json`, this entry. Nothing committed by this session.
- Next: D-011 still says "Braska's headdress repaint goes past Bailey first", which D-028 records as closed — the owner of D-011 should correct that clause. Still awaiting Bailey's verdict: D-010, D-012, D-013. The new module has never been committed; the published board artifact has not been republished.

### 2026-09-21 15:30–21:00 EDT — Claude Code side session "learning sites" (all three sites BUILT and running locally; committed, not pushed, nothing deployed)
- Did: Bailey approved the nine frames ("yes commit it, all three looks are good", then "Links to all 3 websites please?"); verdict written into `docs/concepts/atlas/README.md`, `options.json`, `docs/plans/learning-sites.md`, nine approved tiles in `targets.json` (group `learning-sites`). Built, one agent at a time in conserve mode (Sonnet for the shell and narrow fixes, Opus where the look had to match a frame): `learn/vite.config.ts` + `learn/tsconfig.json` (own Vite entry, dev port 5310, `publicDir ../public` so art and fonts are served and never copied, `dist-learn/` with `copyPublicDir: false`), the DOM shell `learn/shared/shell.ts` `mountExplorer` (systems panel, explode slider, cited detail card, search, view rail, switcher, CSS 3D stage; a site may bring its own stage painter), three themes, and the three pages: **A `/atlas/`** (all five chapters from the real data; Vegnagun ported from its frames: assembled machine with battle pins and the chain card, stacks of up to three cards beside their own part on threads, named flow inventory of 119), **B `/studio/`** (one FFX turn; dragging Tidus's Agility re-runs the real `FFXEngine` and the on-page turn list equals the engine's under node; FFX-2 switch shown disabled, no FFX-2 data invented), **C `/exploded/`** (the Yunalesca frame from the real seed-1 engine run, eight glass sheets plus three rails, 141-piece inventory with 119 WebP thumbnails in `learn/exploded/thumbs/`, 1.3 MB). Commits `0f8fb0f`, `94021a8`, `5216520` (after `21a753b`). **Nothing under `src/`, `public/` or the root configs changed**; game case: both as a surface, each specimen FFX only or FFX-2 only with its accent from the chapter's `game`.
- **View them:** preview entry `learning-sites` in `.claude/launch.json` (`npx vite --config learn/vite.config.ts --port 5320 --strictPort`) → `http://localhost:5320/atlas/`, `/studio/`, `/exploded/`. Local only. **Publishing needs Bailey's decision** (a folder of the existing Pages site, which then goes through the release process, or a site of its own); nothing was deployed.
- Verified by: the main session re-ran `npx tsc --noEmit -p learn/tsconfig.json` (clean) and `npx vitest run tests/unit/learn-` (19 files, 199 tests) after every stage, read every target-beside-build pair (`docs/screenshots/learn/pair-a1..c3.jpg`), and drove site A by hand in the browser pane (select, keyboard slider, 0 console errors; the pane's simulated mouse could not drag the native range, the builders' Playwright mouse could). Each builder's real-input Playwright pass: 0 console errors, 0 failed requests on all three. Full `npm test` NOT run (nothing under `src/` changed).
- Lessons: a workflow launched while Bailey's last message was a question built nothing, twice in effect (agents answered the question; see memory `subagents-see-last-user-message`: quote the message as already answered, quote the approvals, and record the verdict ON DISK first, because agents check). A Sonnet first pass got the chrome right and the stage wrong (no on-stage size in the model); `Piece.stage / parentId / badge` and `Specimen.idle` fixed it at the contract.
- Open (polish, none blocks viewing): B's backdrop has a hard edge where the frame fades it; B and C stages are fitted to the shell's chrome-free box, narrower than their frames; C's switcher chips are cramped and its card is headed by the component name; inventories pan by drag instead of fitting one screen; chapters I to IV of site A use a procedural arrangement (no approved frame); no phone layout (no target); the Vegnagun head/tail/leg art at `public/art` has changed since the frames were shot (art track's call). Waiting on Bailey: where to publish, how plainly site C says the art is AI-generated, phone layout yes/no, whether `learn/exploded/thumbs/` may stay on `main`.

### 2026-09-21 01:00–03:10 EDT — Claude Code side session "learning sites" (new track; targets shown, plumbing built, nothing visible built, nothing deployed)
- Did: Bailey asked for "an interactive learning website" adapted from Human Atlas and Model X Studio (section 16 of https://youtu.be/ifz8NGHuHtY; both sites used first-hand, write-up `docs/concepts/atlas/REFERENCE.md`: one specimen on a stage, a systems panel with counts, the explode slider from assembled to a flat inventory, a sourced detail card with two tabs, isolate, search; pattern only, no code or asset copied, hard rule 8). Options round `docs/concepts/atlas/` (README, `options.json`, `sheet.png`, nine 1600x900 frames, each set adversarially fact-checked and repaired: 7 wrong numbers corrected, all "ready with caveats", no blockers). Bailey, before the frames existed: **"A, B, C all separately please but please be mindful of delegation"** = three separate sites: A "Pyrefly Atlas" (a boss taken apart; Vegnagun, 119 sourced pieces), B "Pyrefly Studio" (one turn taken apart, the real FFX engine computing the numbers live), C "Pyrefly Reprise, exploded" (one battle frame taken apart into layers). **The looks are NOT approved: the frames are with Bailey awaiting a verdict.** Plan: `docs/plans/learning-sites.md`. Built (plumbing only, no DOM/CSS): new root folder `learn/` = `learn/shared` (model that refuses a piece with no cite, store, layout, inventory packer, search), `learn/atlas` (any of the five chapters → specimen from `src/data/**` + the guide text with per-sentence cites), `learn/studio` (`runExampleTurn` on the real `FFXEngine`, seed-1 numbers identical to the mockup's engine probe; 137 cited rules), `learn/exploded` (nine layers + asset inventory from the art manifest passed in at runtime; party/enemy role from the data, not from `facing`). 3,900-odd lines, 9 test files. **The game's `src/`, `public/`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts` are untouched; `learn/` only imports `src/battle/**` and `src/data/**`**, so `critic-plan` sees no shared-system change and the Build A.2 release is unaffected. Game case: **both** as a surface; every specimen is FFX only or FFX-2 only with that game's accent (derived from the chapter's `game`, never set by hand); a turn list is FFX only.
- **Bailey restated the delegation rule in capitals ("DO NOT FORGET THIS NO MATTER WHAT"):** mechanical implementation, file searches, tests and routine execution go to sub-agents on Opus / Sonnet / Haiku; Fable is reserved for planning, architecture review and final validation. It now opens `~/.claude/CLAUDE.md` verbatim. **Set `model` on every `Agent` call and every workflow `agent()`**; omitting it inherits Fable. This session's first workflow (the mockup round, 7 agents) omitted it and cost about 11 weekly points and 19 Fable-weekly points; everything after ran on Sonnet.
- Side findings from the fact-checkers, flagged as task chips, not fixed here: (1) Bulwark record blocks Str/Mag breaks against its own comment and research §3.3 (a separate session is on it); (2) the chapter 5 guide says "cast Reflect on the Leg" while §3.2 and the data make the Leg Reflect-immune, and several researched steals are missing from the data; (3) `docs/ARCHITECTURE.md` lags the code (about 22 battle events listed, 36 in the union; music described as synthesis). Also: painted subjects `jecht` and `lenne` are named by no party or enemy record (story-only), so site C lists them as unclassified.
- Verified by: the main session re-ran everything itself: `npx tsc --noEmit` exit 0; `npx vitest run tests/unit/learn-` = 9 files, 107 tests green; no file over 400 lines; the nine frames looked at on the sheet and A2 at full size. Full `npm test` NOT run (nothing under `src/` changed; run it before any push). Usage: 5-hour 19 → 59, weekly 21 → 32, Fable weekly 22 → 41 across the mockup round.
- Left uncommitted: `learn/`, `tests/unit/learn-*.test.ts` (9), `docs/concepts/atlas/`, `docs/plans/learning-sites.md`, this entry. Asked Bailey whether to commit to `main` without pushing.
- Next: **wait for Bailey's verdict on each look (A, B, C)**, how plainly site C says the art is AI-generated, where the sites are published, and whether a phone layout is in the first build. Then: the DOM shell to the approved looks (Opus), the three pages wired to it (Sonnet), one real-input browser check per site with target beside build, targets recorded in `docs/target/targets.json`. Nothing visible is built before the verdict (hard rule 9).

### 2026-09-21 (late evening) — Claude Code side session (six process rules adopted from `project-scaffolding`; nothing deployed)
- Did: read Bailey's private repo `BaileyPillon/project-scaffolding` (read-only, GitHub API), wrote six proposals (`docs/plans/scaffold-proposals.md`), and on Bailey's **"adopt all six"** put them in force. (1) Stagnation: RUBRIC §8, `cadence.stalledAfterReviews`, `stalledIssues` in `tools/critic-policy.mjs`, `npm run critic:status` prints `STALLED:` (information only). (2) Repair counting and a cap per release candidate (2 / 1 / 0 cycles by usage mode; "take the failing change out and ship what passed"), `attempts` validated in reports. (3) Usage modes normal / conserve / protect in RUBRIC §9 and `policy.json`, the mode line at the top of this file; "protect at 80 percent used" replaces "ask above 85". (4) `delivery` / `verifiedBy` on target tiles (24 filled: 15 verified and 5 failing copied from round 04 by exact label, the three onboarding tiles, the Turn cut-in) and `docs/target/decisions.json` (14 decisions with their state). (5) `reaction` on tiles: what Bailey named versus what an agent inferred (targeting B, onboarding C, Ink & Gold, Braska's portrait). (6) `critic/calibration/cases.json` (four confirmed should-fail cases from CHECKS.md, four candidates to confirm) and a paper-preflight row in RUBRIC §4. AGENTS.md rule 15 summarises it. Game case: **both** (process only; every path is `no-product-effect`, so no review is owed).
- Verified by: `npx tsc --noEmit` clean; `tests/unit/critic-policy-adoptions.test.ts` (12 new tests) plus the five other test files that read `policy.json` / `targets.json`: 165 green; `node tools/critic-status.mjs` and `node tools/end-state-board.mjs` still run (73 tiles). The full `npm test` was not run.
- Committed as `62f4cbb` (not pushed): only this session's paths, staged one by one. Left uncommitted: this file, because it also carries another session's edits. Releases are cut from the clean worktree, so push `main` before the next cut for these rules to apply there.
- Not done, on purpose: no calibration run (size it and show Bailey first); delivery status is not shown on the board (needs a mockup and Bailey's pick, hard rule 9); 49 tiles have no `delivery` yet because no report names them by exact label.
- Next: run the paper preflight on the FFX-2 Active-only ATB build before it starts (RUBRIC §4); fill `attempts` and per-tile results in the round 05 report so `delivery` and `STALLED:` have data.

### 2026-09-20 (afternoon) — Claude Code sub-agent (onboarding option C: adversarial fix pass; nothing deployed)
- Did: an adversarial verifier refuted four properties of the onboarding build `b8a905f` on the running game, and this pass fixed each at its root. (1)+(2) Enter and Escape skipped Auron's briefing **and** were acted on by the screen behind it one frame later — first launch went title → briefing → party prep with the chapter board never seen, Escape backed the board out to the title, and the pause replay re-raised itself on every confirm, forever. The cause was in `src/app/Input.ts`: `claimKeyboard` stopped the DOM event in the capture phase but `onKeyDown` still latched the abstract button. `claimKeyboard` now takes `{ exclusive: true }`: a swallowed key latches no button, screens behind read no button/axis/action while the claim is up, and the frame after it is handed back drops every pending edge (which also settles the gamepad, where the two poll loops' order used to decide the outcome). `PauseScreen` forwards the briefing nothing; `Briefing.handleInput` and the `driven` option are gone; the briefing's pad watcher ignores the HUD mute (`RawInputWatcher { ignoreSuspend }`) so the pause replay is still dismissible by pad. (3) The FFX-2 line's badge claimed "Nothing paused · gauges running" while the gauges were measurably frozen (8189 ticks → 8189 across 1.5 s in both X-2 chapters, **identical with `?coach=off`** — `BattlePresenter` awaits `HudPort.chooseCommand` and ticks the FFX-2 engine only in its `waiting` branch). The badge now reads "Keep playing · nothing to press", which is what the line itself does. (4) The test meant to prove the clock kept running ticked the engine itself and then asserted it had moved; replaced by two mutation-checked assertions that can fail. Commits `e30ea5e` (code + tests) and `6cd337e` (handoff, the C3 target tile's knowing departure from the mockup's badge label, re-captured shots and pairs). Game case: **both** — `Input.ts` is shared plumbing and these are bug fixes (CHK-020); the badge wording is FFX-2 only.
- Verified by: `npx tsc --noEmit` clean; full suite **158 files / 4 229 tests green** (4 221 before); `node tools/orphans.mjs` clean for `src/ui/coach/`. New `tests/unit/ui-coach-input-leak.test.ts` (7) drives a real `Input`, a real `Briefing`, real `KeyboardEvent`s and a stubbed `getGamepads`. One browser pass on my own Vite server (port 5731, `--strictPort`, stopped afterwards), `PYREFLY_BROWSER=gpu` throughout, **re-running the verifier's own probes unchanged**: first-launch Enter now lands on `chapter-select` (was `party-prep`), Escape/click/wait-out all `chapter-select` (Escape was `title`), title replay stays on `title`, the pause replay's first Enter dismisses with `created 0` (was an endless loop) and Escape leaves `.pause__row` 12 → 12 with `screen: pause` (was the pause menu closed). Shots and the three target-versus-build pairs rebuilt under `docs/screenshots/onboarding/` and looked at.
- Left uncommitted: nothing of mine.
- Next: **a question for Bailey before anything else here** — should the FFX-2 ATB run while you are choosing a command? It does not today, teaching or no teaching; that is the Active/Wait setting (`research/ffx-vs-ffx2-presentation.md` §4.2, row "Command input"), which the build does not implement. FFX-2 only, combat-core, changes every X-2 fight's difficulty, so hard rule 10 applies. Then: this is a shared-system change (`src/app/Input.ts`), so `tools/critic-plan.mjs` will ask for a **deep review before going public**, and the first-time-player pass is still unrun.

### 2026-09-20 01:45 EDT — Claude Code side session (critic policy v2 integrated; nothing deployed, the pause stands)
- Did: Bailey approved the consolidated critic ("my approval of the proposed scoring, gates, cadence, and resource controls"). Integrated it: `critic/RUBRIC.md` is now policy v2 (three verdicts, a schedule where review depth follows the change, ONE weighted score over ten categories, acceptance gates, the approved-target gate that replaces Part C as a number); the old rubric is `critic/archive/RUBRIC-v1-ABC.md` and rounds 02 and 03 stay rubric v1 history. `critic/policy.json` holds the same rules as data. `critic/CHECKS.md` keeps CHK-001 to CHK-021 and B1 to B4 and adds CHK-022 (outcomes reach their destination), CHK-023 (subsystems are invoked through the real path), CHK-024 (saves survive an upgrade). New tools: `tools/critic-policy.mjs` (plan, score, gates, report validation), `critic-plan.mjs`, `critic-clear.mjs` (the only way an obligation is settled), `critic-score.mjs`, `artifact-manifest.mjs` (identity of every shipped file + byte-for-byte live verification); `critic-pending.mjs`, `critic-status.mjs` and `deploy-pages.mjs` reworked: a deploy now plans its review, refuses a shared-system change with no passing deep report, verifies the exact live artifact, and records separate `live` / `focused` / `deep` / `milestone` obligations; a replaced build's unsettled deep review moves to the new build. Review workflows: `critic/runner/release.js`, `focused.js`, `live.js`, `deep.js`; the driver's `pyrefly-release-clean.js` is now a copy of `release.js`, and the old `pyrefly-critic-round-2.js` and `pyrefly-critic-gate.js` refuse to run for a new build (backups beside them as `.pre-policy-v2.bak`). Seeded `critic/ledger.json` (baseline: round 03 on `7191674`, evidence only) and `critic/artifacts/7191674.json` (720 files, 367.7 MB, all media decode).
- Verified by: `tests/unit/critic-policy-v2.test.ts` (51) and `tests/unit/artifact-manifest.test.ts` (10) plus the 19 existing marker tests, `npx tsc --noEmit` clean; `node tools/critic-plan.mjs` on the real tree (docs-only since `7191674`: LIVE; a pause caption: FOCUSED; `src/battle/ffx/ctb.ts`: DEEP before deploy); `verify-live` against the real site compared 48 files byte-identical and still answered UNVERIFIED because build `7191674` published no manifest (fail closed, as designed); `deploy-pages.mjs --dry-run` prints the plan; all workflow scripts pass a syntax check. **Not executed: the four review workflows and a real deploy with the new script** (paused, allowance at 99 percent).
- Left uncommitted: everything above. **The release worktree is cut from committed `main`, so none of this applies to a release until it is committed;** `release.js` stops at the cut with that message if the tools are missing.
- Next: commit the critic integration; at the next release watch the first `live.js` and `focused.js` runs and tune the time budgets after three real runs (RUBRIC §4).

### 2026-09-19 (afternoon) — Claude Code side session (targeting pick on the board)
- Did: at the driver session's request, recorded Bailey's targeting pick ("B: hand, ring and a quiet dim") in `docs/target/targets.json` as three approved tiles (`docs/concepts/targeting/b-ring-and-dim/s1..s3.png`) with their game-aware cases and build hints; updated the Leblanc tile (Chateau Leblanc), the battle-transition tile (canon by situation) and the chapters note (they wait for the 25 Sep allowance reset). Board republished: 50 approved, 0 awaiting a verdict, 9 gaps, 2 rejected.
- Verified by: the three pictures viewed on a contact sheet before publishing.
- Left uncommitted: `docs/target/targets.json`, this entry.
- Next: remaining gaps are the move advisor card, the enemy next-move panel, the defeat screen, the cold open, the phone layout, the three chapters' concept sheets and one finished minute of play.

### 2026-09-19 (afternoon) — Claude Code side session (game-aware rule)
- Did: recorded Bailey's new standing rule (every change is FFX-only, FFX-2-only or both; see "Owner decisions in force") as `AGENTS.md` hard rule 14, `critic/CHECKS.md` CHK-021, a note in `docs/PRODUCT-BRIEF.md`, and memory `game-aware-changes`; told the busy driver session by message.
- Verified by: nothing to run; docs only. CHK-021 is written to sit beside CHK-020 (shared plumbing and bug fixes are "both").
- Left uncommitted: those four files and this entry.
- Next: every plan, handoff note and commit states its case and its source.

### 2026-09-19 (afternoon) — Claude Code side session (Bailey approved the end-state board)
- Did: Bailey said "i approve everything you listed in the end state board and please let the other agents know". `docs/target/targets.json` now has 47 approved tiles, 0 awaiting a verdict, 10 gaps, 2 rejected. Newly approved: the four other scene backdrops, ten cast tiles (FFX party portraits, Tidus, Yuna, Auron, Seymour Flux, Yunalesca 1, Braska's Final Aeon 1, Shiva, Yuna Gunner, Shuyin), the rebuilt pause screen and every pause plate, the concept key art, and audio as a direction ("Right direction, keep refining" still stands). Also filed the 12 concept boards Bailey picked as approved tiles (with their FFX-only / FFX-2-only notes), and the three new chapters and the cold open as gaps. Board republished (same URL, version 3).
- **What it means for every agent:** an approved painting is never replaced on an agent judge's say-so; a change needs Bailey's yes (the approved face pass on the weak close-ups is such a yes for the close-ups it names). sha256 of the 94 shipped files behind the approved tiles: `docs/target/approved-hashes.json`; backup copy: `D:\Tools\pyrefly-art-backup\approved\2026-09-19-board` (public/art has no git history). Part C of the rubric scores every approved tile from its `build` hint. **Targeting is still a gap: Bailey has not picked a look**, so a cheap options round comes before the staged targeting track builds.
- Also new: `docs/PRODUCT-BRIEF.md`, a draft from Bailey's picks (faithful recreation + 2026 showpiece; "faithful core, showpiece surface" settles conflicts; seasons; "one more try" from the fight itself), waiting for Bailey's yes.
- Verified by: none of the board's pictures or the shipped files behind them changed after the board Bailey looked at was generated (mtime check); the 12 concept mockups viewed on a contact sheet before publishing.
- Left uncommitted: `docs/target/targets.json`, `docs/target/approved-hashes.json`, `docs/PRODUCT-BRIEF.md`, `AGENTS.md`, `critic/RUBRIC.md`, `tools/end-state-board.mjs`, this entry.
- Next: when Bailey picks a new target, record it in `targets.json` (state, their words, date, `build` hint), run `node tools/end-state-board.mjs`, republish to the same artifact URL.

### 2026-09-18 23:40 — Claude Code side session (rubric Part C)
- Did: on Bailey's word ("you can add that to the rubric as part C") added **Part C: fidelity to the approved end state** to `critic/RUBRIC.md` (Parts A and B untouched). It scores only `approved` tiles in `docs/target/targets.json`, from target-vs-build composites; the gate is now 9.6 on all three parts plus complete coverage of the board. The staged round script `pyrefly-critic-round-2.js` gained one Part C auditor (sonnet, medium effort), three totals in the chief's report and a "Waiting on the owner" list; backup beside it as `.pre-partc.bak`. `tools/end-state-board.mjs --pair <target> <build> --out <file.jpg>` makes the side-by-side; approved tiles carry a `build` hint and the Zanarkand tile its `sha256`.
- Verified by: the script's body passes `node --check` (wrapped in an async function) and its `meta` still evaluates as a literal; `--pair` run on the title mockup vs the live title frame; `targets.json` parses. **The edited round script has not been run yet.**
- Left uncommitted: `critic/RUBRIC.md`, `AGENTS.md`, `docs/target/targets.json`, `tools/end-state-board.mjs`, this entry.
- Next: the next full critic round is the first with Part C; check its `part-c/` composites and the chief's three totals.

### 2026-09-18 23:15 — Claude Code side session (end-state board)
- Did: Bailey approved "end state first" as a standing rule (AGENTS.md hard rule 9). Added `docs/target/targets.json` (approved targets, pictures awaiting Bailey's verdict, gaps) and `tools/end-state-board.mjs`, which renders it to `docs/target/board.html` (gitignored). Published copy for Bailey: https://claude.ai/artifact/2qt2ZqrrdjRDwa5crZ4ifg
- Verified by: every picture on the board viewed on a contact sheet; one desktop and one phone screenshot of the page (no sideways scroll at 400 px); the game's Zanarkand backdrop has the same sha256 as the approved copy.
- Left uncommitted: `AGENTS.md` (rule 9 + map row), `.gitignore` (one line), `docs/target/targets.json`, `tools/end-state-board.mjs`, this entry. No product code touched.
- Next: **targeting needs an options round before its track launches** (it exists only in words). When Bailey gives a verdict, record it in `targets.json` with their words and the date, then rerun the script.

### 2026-09-18 22:55 — Claude Code side session
- Did: wrote `AGENTS.md`, `CLAUDE.md` (imports it) and this file so any agent can start cold.
- Verified by: every path and command in `AGENTS.md` checked against the repo; the four closed follow-ups checked in the source.
- Left uncommitted: `AGENTS.md`, `CLAUDE.md`, `docs/handoff/NOW.md` (docs only; nothing else touched).
- Next: the driver session owns this file from here.
