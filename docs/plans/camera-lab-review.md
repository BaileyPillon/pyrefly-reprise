# Camera Lab: paper preflight (2026-10-02)

**Bailey, 2026-10-02 ~00:10 EDT, verbatim:** "tell the other agents about this and let's build a playable
test of it before we incorporate it in the whole game please." ("this" = the Clair Obscur / Persona camera
research, https://claude.ai/artifact/V52VY4twA2KhnDEapQ9ZWi; decision D-318.)

**Goal.** Bailey plays Chapter I (FFX, Seymour Flux) and Chapter IV (FFX-2, Bahamut) with a Clair Obscur /
Persona battle camera and flips its parts live, then decides what, if anything, goes into the whole game.

**Done when**
1. On branch `camera-lab`, `?camera=lab` opens a lab panel, then the real battle with the lab camera. Without the
   flag the game is unchanged (proved, not assumed).
2. Live switches: STYLE (Persona / Clair Obscur), VIEWS (rear paintings / today's paintings only), MENU (at the
   hero / today's panel), TARGET CUT (on / off). "Play today's version" opens the same chapter without the flag.
3. Both chapters played to victory by real keys in both styles, a frame per beat, one short clip per chapter and
   style.
4. Bailey gets a private playable page; if the bundle cannot fit or run there, a launcher he double-clicks.

**Not in scope.** New paintings or ComfyUI jobs; settings rows or save data; main, releases, deploys; other
chapters; the MAX mix parts (D-316: colossus masters, Overdrive hero shot, spherechange shot); a phone layout
for the lab (the menu stays a panel on phones).

## Game case (rule 14)

Both, as a test; every camera placement is ours. FFX: the camera cutting between held shots on meaningful beats
is the one sourced shape (`research/battle-camera-perspectives.md` §A.2), and CTB's discrete turns let each turn
open on the actor's own shot. FFX-2: ATB and free positions; D-316 says the camera never cuts while a girl's menu
is open, so FFX-2 holds one wide over-the-shoulder master while any menu is open (P2h, the best FFX-2 still at
8.0) and cuts on actions only while no menu is open; no per-girl hand-off cuts.

## The grammar (from the two research notes and the perspectives round)

| Beat | Persona style | Clair Obscur style |
|---|---|---|
| FFX turn starts | hard cut to the HERO SHOT: behind and to the side of the actor, about 45-50° off the line to the target, hip height, slight up-tilt, wide lens; still | same place, chest height, normal lens, 2-3 m; slow drift |
| FFX-2, any menu open | held PARTY SHOULDER: high over the girls' shoulders, all three and the boss readable | same, slow drift |
| Skill or magic list | no camera change | cut to a closer, lower hero shot |
| Picking an enemy target | no change; the reticle does the work | cut to a close, slightly low view of that enemy from the party's side; a new cut when the cursor moves |
| Physical attack | cut: low side shot of the lunge, held through the hit | same, a short slow-down on the hit |
| Spell or skill | cut: low on the caster, then cut: wide three-quarter on the impact | same, drifting inside the shots |
| Item | cut: close on the actor | same |
| Enemy turn | cut: front three-quarter close on the enemy, from the party's side | cut: wide, low, behind the party, the boss large |
| Big attack (Overdrive, boss special) | cut: low colossus angle | same, slow-down on the hit |
| Victory | cut: low hero portrait of the finisher | same |
| After an action | the next HERO SHOT (FFX) or the PARTY SHOULDER (FFX-2) | same |

Rules for every shot: a cut is instant (never a flight); a shot holds at least 1.2 s unless its beat ends first;
at most one cut per beat (a caster/impact pair is one beat with two shots); the HUD lays out only after a cut
lands (fb2-0929); drift stays far inside D-291's limits and REDUCE MOTION turns drift and slow-downs off; no shake
on routine hits; every lab camera stays on the viewer's side of the party-to-boss line, so no painting is ever
mirrored (chiral subjects stay right).

## Paintings and staging

- Each party figure shows its front (today's) or rear three-quarter painting, chosen per shot from where the
  camera stands against the figure's facing; during lab shots the planes turn square to the lens.
- Rear candidates from the perspectives round (never installed): Chapter I Tidus, Yuna, Kimahri (+ a
  high-resolution Tidus); Chapter IV White Mage Yuna, Dark Knight Rikku, Warrior Paine (+ high-resolution Yuna),
  in `D:/pyrefly-mock-persp/public/mock-art/` with their baseline/scale data in that round's `art/READY.json`. They
  are copied into the lab's own `public/mock-art/`; `public/art` stays read-only. Known flaws (Tidus's red sleeve
  on the wrong arm, Yuna's staff upright) are named in the lab panel.
- A girl who spherechanges has no rear painting: she keeps her front painting and the lab avoids shots from
  behind her.
- The over-the-shoulder shots need the party-to-boss line to run into the painted set (the perspectives frames
  restaged the actors for this). The lab sets its formation once at battle start through the stage's own
  formation data, never by moving meshes behind the presenter's back, so lunges and returns stay right.

## Architecture

- New code under `src/engine/lab/` (director, shot choice, rigs, painting views) and `src/ui/lab/` (panel and
  chip). Shot choice is a pure function (beat, style, game, menu state) -> shot, unit-tested.
- The presenter reaches the lab only through an optional port (presenter files stay free of DOM and `three`,
  hard rule 1). If the port file is a shared contract, the change is additive with a `docs/CONTRACT-CHANGES.md`
  entry (rule 2).
- Without `?camera=lab` nothing of the lab is built or called: the optional port stays unset.
- The lab yields to the presenter's own authored camera moments (specials such as Mega Flare) instead of
  fighting them.
- The menu at the hero: the command list keeps its Ink & Gold look and moves beside the actor's projected
  torso, on the boss side, re-anchored only when a cut lands; it falls back to the panel if it would cover the
  boss or another party member.

## Verification and delivery

- `tsc --noEmit` clean; vitest for every new or touched file (shot choice per beat, style and game; FFX-2 never
  cuts with a menu open).
- Real keys only, headless Playwright: each chapter in each style to victory, a JPEG per beat; one run with every
  switch flipped; a flag-off run compared with main.
- Clips: one 30-60 s H.264 per chapter and style.
- Page: a `--base ./` build that boots straight into the lab with only the two chapters' files; must fit the
  artifact limits (at most 255 files, 64 MB, 15 MB a file) and run under a same-origin-only policy at a
  sub-path; the session publishes it. Fallback: `D:/pyrefly-camera-lab/play-camera-lab.cmd` (preview on port
  5270, opens the browser; Bailey closes it).

## When the MAX mix lands on main (driver's heads-up, 2026-10-02 ~00:40 EDT)

The MAX mix build (branch `mix-build`, c8e4cb09; with `eye-candy-page` 7a4bed7e; path to main: rel36, an
independent check, a deep review before deploy) wraps the battle camera at runtime: per-chapter framing masters
(`src/engine/.../framing.ts`), a lens shift that rides the camera's next move, colossus scale for Natus and FFX-2
Bahamut (Chapter IV is a lab chapter), held Overdrive (FFX) and dressphere (FFX-2) shots that hand back when a menu
opens, depth of field, fog, SMAA/defringe, all gated by `src/engine/fx/eyeCandyFlags.ts` and the EYE CANDY page.
It adds none of the Clair Obscur / Persona grammar. When the driver reports it merged, rebase `camera-lab` onto
it: in a lab battle the lab director owns the camera (framing masters and lens shift stand down while
`?camera=lab` is on; depth of field, fog and SMAA stay), the Chapter IV rigs are re-fitted to the colossus-scale
Bahamut, and the held Overdrive and dressphere shots count as the presenter's own authored moments the lab yields
to.

Update from the driver, 2026-10-03: release 36 is live (main c69de96a). Since the lab's base c19454eb, main gained
the MAX mix (8aee1e69) and the r36fix in `src/engine/fx/mix/` (Yunalesca out of COLOSSUS; a plate gate in plate.ts
and clearance.ts; stricter dressphere-shot rules in heldShots.ts; FFX-2 cards not fading with a menu open).
FFX-2 Bahamut keeps the colossus framing; Natus, BFA and Evrae keep today's rig. Release 37 (`r37-mix-polish`,
`r37-living-backdrops`, not merged on 2026-10-03) adds a `src/engine/fx/shotHold.ts` hook in
`BattlePresenter.play`, the HUD-free-area footprint in hudPanels.ts/clearance.ts, and a plate defocus driven by
camera drift (`DriftRig.ts`). The rebase must make the lab's Clair Obscur drift and that defocus agree, and let
shotHold's held shots count as authored moments. The rebase waits for Bailey's verdict on the lab.

## Budget and risks

- Weekly 71 % used (rule 15: conserve band; Bailey's "keep working" stands). One Opus builder for the
  judgement-heavy integration, the session validates; no judge panel (Bailey judges by playing); one repair
  cycle.
- Risks: restaged formation vs presenter animations (above); candidate paintings with flaws (labelled); FFX-2
  real time (no cuts with a menu open); artifact policy or size (fallback launcher); shared-tree hazards (sparse
  worktree, junctions unlinked before any removal, never `git worktree remove`, never write `public/art`).
