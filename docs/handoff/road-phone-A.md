# Road phone camera (PR-0201 option A), branch r21-road-phone

**Game case: FFX-2 only** (Chapter XI, the Road to the Farplane, `src/scenes/road-to-the-farplane.ts`).
The one shared line (`SceneBuild.bindCamera`, called once in `src/scenes/index.ts`) is optional and
additive plumbing ("both"); no other scene sets it, so nothing else changes.

**On whose word.** Bailey, 2026-09-26 ~13:00 EDT: "I'll go with all of your recommendations", picking
A on `docs/concepts/phone-2026-09-26/sheet-pr0201.jpg`: "the phone camera pulls back per link so
everyone stays whole; smaller fighters; desktop untouched".

## What was built

- `src/scenes/road-to-the-farplane-phone.ts`: on an upright phone (`PHONE_BATTLE_QUERY`, read once when
  the scene is built) the `idle` rig is the desktop's dollied straight back in z. Shiva and Anima go to
  z 13.2 and the Sisters to z 15.5. The look point, the height, the fov and every other rig stay the
  same. Each frame the scene reads which link is staged (the stage names figures by combatant id). The
  latest link in chain order wins. When the link changes, the scene replaces the camera's `idle` rig.
  If the camera is resting on idle, it glides there in 600 ms.
- The option's frames record only z ("camera z 13.2 / 15.5"). No script from the options round
  survives, so z alone is dollied.
- Tests: `tests/unit/chapters/road-phone-camera.test.ts`. It pins the z values and projects every
  link's fighters: today's idle is wider than one phone slice, and each link's phone idle fits inside
  one. It also covers link following, a Sister's KO keeping the Sisters' framing, and `loadScene` on
  phone vs desktop.

## Evidence (`docs/screenshots/road-phone-A/`, production build, headless GPU, 390x844 touch, DPR 2, seed 1)

- `compare-{shiva,sisters,anima}-target-vs-build.jpg`: the option A frame next to the build.
  - All six fighters are whole at each link's first command menu.
  - Yuna stands 139 px vs 185 today in the Shiva link (75%), and 116 vs 191 in the Sisters link (61%).
  - The figures stand about 15 CSS px higher than in the target frames. Today's live frame vs main
    already differs by about 10 px.
- `build-*-next-actor.jpg`: a real tap on the first command, then the next actor's menu. The slide
  still runs (Shiva link −204 → −198 px). All fighters stay whole.
- `build-anima-ko-fall.jpg`: Anima's fall on the `enemy` rig (the unchanged action close-up), then the
  chapter ends (`build-anima-after-victory.jpg`).
- `build-sisters-ko-fall.jpg` and `build-sisters-after-ko-menu.jpg`: Sandy falls, and the framing stays
  the Sisters' (z 15.5).
- `desktop-{link}-before-vs-after.jpg`: 1600x900, main vs branch. Idle z is 9.8 in both, and the
  figure rects match within the breathing sway.

## Open (for the driver / Bailey; not built)

- With a KO'd girl **lying** at the left (a wider pose), the next menu's slide keeps the fallen girl
  (party weight 6) and lets Mindy (enemy weight 1) slip 80% off the right edge. Seen with Yuna and Sandy
  down, Paine acting. The cause is the shared slide weights in `src/ui/common/phoneFraming.ts` (both
  games), not this camera. Two possible answers, neither built:
  - (a) weight a KO'd party member lower in `framedIds` (shared; needs a game-case decision);
  - (b) pull the Sisters link back a little further (about z 16.3, smaller than the approved 60%).
