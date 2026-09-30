# Handoff: first run O2 "Guided first run" + the calm camera as the default

Branch `firstrun-o2` (worktree `D:/pyrefly-fb-onboard`), 2026-09-30, from `origin/main` 888a7578.
Not merged, not pushed, not deployed (the driver does those). Paper preflight:
`docs/plans/firstrun-o2-review.md` (critic-plan: DEEP; not the save-data class).

Bailey's words, 2026-09-29 ~21:00 EDT: "I'll go with all of your recommendations please"
(recommendations 3 and 5; `docs/target/decisions.json` D-289 and D-291).

## Game case (rule 14)

- **Both:** the board step, the party-prep step, the skip path and the seen-ids; the calm camera
  (shared presenter camera).
- **FFX only:** step 3 (the first command). It is Auron's approved `ffx-turn-order` line in the
  guide's dress, so it exists only in FFX. A first battle in FFX-2 ends the guide when its HUD mounts
  (nothing drew Rikku's version).

## (A) Guided first run

After Auron's briefing plays on a first launch, a three-step pointer in his voice: a gold spot (steps
1-2, the rest dimmed) or ring (step 3) on the exact control, a chevron, and one ink slab.

| step | target | words |
|---|---|---|
| 1 board | `.fe-hero` (the chosen chapter's picture; Chapter I on a first run) | "Start with the first one." Click/Tap its picture to begin. ... |
| 2 party prep | `.prep__start` (START BATTLE) | "Your party is ready." The tabs are for later. ... |
| 3 first command (FFX) | the ATTACK row | Auron's approved line word for word, "Your turn.", "Pick/Tap ATTACK, then pick/tap who it hits." |

Files: `src/ui/coach/firstRunCopy.ts` (words, ids), `firstRunView.ts` (markup, placement),
`firstRunGuide.ts` (state, per-frame loop while armed, Esc), `first-run.css`. Hooks:
`app/screens/raiseBriefing.ts` (arm after the briefing, resume on a later boot), `CoachLayer.ts`
(battle mounted; step 3's dress on `ffx-turn-order`), `CoachMark.ts` (the `guide` option),
`coachActorAvoid.ts` (the guide places its own line), `coachState.ts` (`markAllSeen` covers the ids).

Seen-state: three ids (`firstrun-board`, `firstrun-prep`, `firstrun-battle`) in the save's existing
`seenCoach` list. **No SaveData field, version or migration change.** Step 1 counts as done when party
prep appears, step 2 when a battle HUD mounts, step 3 when the line is answered or skipped. A started,
unfinished guide resumes on the next boot; a returning player or veteran never sees it.

Never blocks the highlighted control: the drawn layer is `pointer-events: none` except the slab, which
sits beside the target. A click or tap on ATTACK takes the line down and goes through (the existing
pointer rule). **Behaviour change inside the guide only:** Enter with the cursor on ATTACK reaches the
menu (the approved line alone swallows the first bare Enter, PR-0051); with the cursor elsewhere
(Kimahri's first menu opens on TALK on some seeds) the approved rule stands. Esc or the skip words end
the guide for good; the Esc is taken back from `Input` (a claim released at once runs `absorbEdges`),
so it does not also go BACK on the board or prep, or open the pause in battle.

Evidence: `docs/concepts/fb2-0929/onboard/final/` (sheets, build frames, README),
`docs/screenshots/picks-0929/firstrun-o2/`. Walks in `D:/Tools/pyrefly-scratch/picks-0929/firstrun/`
(`guide-walk.mjs` modes mouse, keys, skip1, tapskip1, skip3, reload2; desktop and phone): every ringed
control acted on the first press; no page errors.

## (B) Calm camera as the default

`CameraPreset.ts`: `DEFAULT_CAMERA_PRESET = 'calm'`; no parameter plays calm in both games,
`?cam=current` (or `__pyrefly.cam('current')`) the old camera. REDUCE MOTION's `StillCamera` still wraps
whatever plays. The stage's own fallback (`BattlePresenterStage`, used only when a caller passes no
preset) is left at `current`; `BattleScreen` always passes the preset. Clips and measurements in
`docs/concepts/fb2-0929/camera/final/`: Ch. I peak 102 → 42 °/s, largest cut 17.3° → 7.1°, roll and
shakes 0; Ch. IV peak 62 → 20 °/s, largest cut 11.3° → 4.9°. Frame time unchanged (16.6 ms).

## Checks

`npx tsc --noEmit` clean; `tests/unit/ui-coach-first-run.test.ts` (new, 16) and
`tests/unit/camera-presets.test.ts` (updated for the new default, 12) pass with the other coach
and camera files; full suite once (result in the commit body); `node tools/orphans.mjs`: nothing new.

## Open

- The phone step-3 quote wraps before "it." where the mockup's fits on one line (the slab stays
  inside 390 px).
- On the board, if the player selects another card first, the spot follows the picture, which then
  shows that chapter while the line still says "Start with the first one." Not drawn by the mockup.
- A reload between the story scene and the first command leaves step 3 unseen until the next battle
  mount, which then closes the guide (the line it rides was already shown).
- FF7 (hidden experiment) has no coach layer, so a first battle there would not advance the guide.
