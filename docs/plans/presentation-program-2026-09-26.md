# Presentation program, 2026-09-26

Bailey, 2026-09-26 about 18:00 EDT, verbatim: "full speed ahead please. I tried and beat Yojimbo but it was really easy, is it canon and faithful right now? Also the graphics are coming along really well but I need addition work in graphics, presentation, and polish for next release."

The Yojimbo half of that message is answered in `docs/plans/yojimbo-faithfulness-2026-09-26.md` (c728ac8a). This file covers the graphics, presentation and polish half.

**Inputs.** The live build is release 20 (ce05b02c). Two review lenses looked at it on 2026-09-26:
- the **art lens** covered paintings and 3D staging; its contact sheets are in `D:/Tools/pyrefly-scratch/pres-audit/_art/`;
- the **cinematics lens** covered camera, effects, transitions and timing; its sheets are in `D:/Tools/pyrefly-scratch/pres-audit/_cinematics/`.

Both lenses were checked against:
- the release-20 focused captures in `critic/reviews/ce05b02c-focused/`;
- round 13 (`critic/rounds/round-13.json`);
- `docs/target/targets.json`, `decisions.json` and the approved-hash lists;
- `research/visual-bible.md` and `research/ffx-vs-ffx2-presentation.md`.

**Relationship to the thresholds program.** This file extends `docs/plans/thresholds-program-2026-09-26.md`; it does not replace it.
- Known issues are cited by their id and are not re-filed.
- Batch ownership is §2 of that plan, and iteration 1's `t1-*` worktrees keep their files.
- Everything here joins **iteration 2** or later.

**Evidence warning.** The pres-audit harness wrote phone and desktop shots into the same chapter folder under the same file names. As a result, `pres-audit/seymour-flux/05..11` and `pres-audit/ffx2-bahamut/05..09` mix both kinds of frame. Tag the file names by viewport before citing any path there as evidence.

Classes are the same as the thresholds plan:
- **A:** restores an approved target or canon staging, or fixes a clear defect. Build it.
- **B:** new and perceivable. It needs an options round first (rule 9).
- **C:** needs Bailey's decision.
- **ART:** a ComfyUI job. It runs only while NOW.md says art generation is on (rule 12), and it needs Bailey's pick.

---

## 1. For Bailey: one screen

**Already strong, and staying as it is:**
- The painted figures are alive: they breathe, lunge, recoil and crossfade between poses.
- The approved title card and the arena sweep that opens each fight.
- Bosses leave the way their games have them leave (fall, yield, recall, held).
- The FFX-2 spherechange flourish and the chain counter.
- The Gagazet snow.
- The hit flash, shake and hit-stop on heavy blows.
- Every chapter card on the live board now renders, including the Omnis card that round 13 caught as black.

**The ten changes that would lift the look most** (the game each applies to is in brackets):

1. **Summons take the stage** [FFX]. The party leaves the field, a glyph draws on the floor, and the aeon rises centre-front, solid and at its own size. Today Valefor is see-through with Yuna standing in front of her. FFX's signature moment is not yet staged the way the game stages it.
2. **Battles open the way you already picked on 19 Sep** [split by game]:
   - FFX: a blur out of the cutscene, and the glass shatter on skip or retry.
   - FFX-2: its own shatter.
   - Vegnagun's parts: a black-hole implosion.

   Today every fight opens with a swirl, and neither game has one.
3. **No more black screen before the first fight** [both]. On a first visit there are 14 to 20 seconds of pure black before the battle card. Instead, the card goes up at once with a thin gold loading line, and the paintings start loading while you are still on the chapter board.
4. **Spells that look like their element** [both, a different set for each game]. Today Fire, Blizzard, Holy, a heal and a sword hit all make the same tinted glow. *Options first.*
5. **A camera that shows who hit whom** [both, staged per game]. The attacker and the target are in one shot. In FFX-2, the camera no longer loses the boss while the gauges fill (Vegnagun, Shiva and Trema drop out of frame today). *Options first for the attack camera; the FFX-2 boss framing is a plain fix.*
6. **Bosses that move** [both]. Bosses in seven chapters have no attack, hurt or KO painting, so every hit lands on a statue. Yojimbo comes first. Then the FFX-2 dressphere poses that are missing, and a fix for Yuna's White Mage: she changes costume on every action today.
7. **Vegnagun as a colossus** [FFX-2]. Today it is four small, mismatched props floating in the Farplane. The fix is part-scale staging, where a leg or the head fills the frame, plus the part rings and plates you already approved. *Options first for the staging.*
8. **Pyreflies** [both, only where the games put them]:
   - bosses that canonically dissolve (fiends, aeons, the unsent) break into pyreflies instead of fading;
   - motes drift at three depths;
   - Lady Ginnem gets her unsent glow.

   You approved all three on 19 Sep. None is built yet.
9. **Depth** [both]. Backdrops get a real floor and sky with parallax. Figures stand on their own shadows instead of floating over dark floors, and nobody is cut off at the frame edge in the wide shots.
10. **Moments that land** [both]:
    - FFX names enemy abilities in the help bar, as the real game does (confirmed in the Steam session today);
    - the Ink & Gold camera tilts slightly on every attack, as in the approved spec;
    - Overdrives and boss specials get a camera moment of their own. *Options first for this last one.*

**Also small but canon:** nobody strikes a victory pose after Zanarkand (FFX Ch II), Bahamut (FFX-2 Ch IV) or Shuyin (FFX-2 Ch V). The sources withhold it there, and today the party poses after every win.

**Needs your word (§6):** six questions, each with a recommendation (C-3 and C-6 are listed only so nobody re-asks them).

---

## 2. Known issues this program extends (no new id)

These items are already scheduled in the thresholds plan. The presentation lenses add only the extra checks listed here. Build each one where §2 of the thresholds plan puts it.

| Id | Game | Scheduled in | Addition from this program |
|---|---|---|---|
| PR-0181 summon staging (method check `docs/plans/pr-0181-method-check.md`) | FFX only | Batch 2 | Aeon alpha is 1.0 on its first menu in I, III, X and XIV (the see-through Valefor may be an arrival fade that never completes). A rim or key lift so Bahamut reads against Dream's End's dark grade. The HUD party rows swap to the aeon. A procedural gold floor-glyph ring (research §7, single source): the glyph is canon, and its ring look reuses an existing Ink & Gold token. Painted per-aeon glyphs are ART job 5. |
| PR-0180 action names (sourced by Steam, thresholds §9 row 2) | FFX only | Batch 2 (`t1-b2a`) | Party non-Attack abilities are named in the same HELP bar. The ivory slab stays only on the moments that use it today (telegraphs, "SUMMONS ANIMA"), so each kind of moment has one voice. |
| PR-0031 + PR-0178 target cues (method check exists) | Plate FFX only; ring and dim both | Batch 2 | The yunalesca target-step frame (`pres-audit/yunalesca/07-07-target-step.jpg`) shows no ring, plate or dim. Include Ch II in the s1/s2 composites. |
| PR-0095 + PR-0094 Vegnagun parts (method check exists) | FFX-2 only | Batch 2 + batch 3; `farplane.ts` waits for `r21-road-phone` | Measure the anchors **once, on the final staging** from options round B3. Do not measure them on today's small props. |
| PR-0157 HUD over action cameras (method check exists) | Both. The FFX-2 half is new: the intent and guide cards sit on Bahamut's wing and on Vegnagun during actions (`_cinematics/x2-full.jpg` 33.0 s and 36.5 s) | FFX half batch 2; FFX-2 half batch 3 (`FFX2BattleHud.ts`) behind one HudPort signal from batch 2 | Acceptance covers IV and V as well as I and XII. Fade versus shift stays thresholds §3 item 10. |
| PR-0061 waits | Both | Batch 2 | **D-206 is answered:** the 2.2 s card and 3.8 s sweep are authored beats. This is now class A for the leftover. The seed-pinned addendum is still owed first. |
| PR-0164, PR-0212, PR-0137 edges | 0164 and 0212 FFX; 0137 FFX-2 | Batch 2 | Valefor's cut left wing (`_art/isaaru-mid.jpg`) is the same fault as PR-0212. |
| PR-0184, PR-0185, R15-02 (Ch IX) | FFX only | Batch 2 | Lady Ginnem's unsent glow is added as A-9 below, and reuses the A-5 emitter. |
| PR-0034, PR-0177, PR-0136, PR-0036, PR-0035 | 0034 and 0177 FFX; 0136, 0036 and 0035 FFX-2 | Batch 2 / thresholds §3 item 4 | Fold PR-0036's options round into B5 (boss presence), so the slots are moved once. D-167 already settles PR-0035. |
| PR-0201 phone framing | Both | `r21-road-phone` | After the merge, apply option A's fit rule to **every** chapter, not only XI. Ch IV Bahamut is a wing sliver at 390x844, and Ch I cuts Yuna. See A-12. |
| PR-0014 portrait crops | Both | Batch 3 | Yuna's chip hair colour is question C-5. |
| PR-0133 speakers on stage | FFX-2 (V, XI) | Batch 4 (D-211) | Check Ch IV's empty hall: keep it empty only if the script means the room to be empty. |
| PR-0072 Vegnagun contact shadow | FFX-2 only | Waits for `r21-road-phone` | Measure after B3's staging pick. |
| Ch IV pause plate | FFX-2 only | Thresholds §4 queue item 9 (no decision recorded yet) | Unchanged. It is a target-gate failure until Bailey answers. |

---

## 3. Class A fixes (new), in file-disjoint batches

Owners follow thresholds §2:
- **Batch 2** owns `src/engine/**` (except `tactics/`), `src/ui/ffx/**`, `src/ui/common/transitions/**`, `src/scenes/**` (except `farplane.ts`) and battlePreload.
- **Batch 3** owns `src/ui/ffx2/**`.
- **Batch 4** owns `BattleScreenFlow.ts`, `ChapterSelectScreen.ts`, `src/data/chapter-meta-*.ts`, `src/story/**` and `tools/deploy-pages.mjs`.

Where an item needs a file from two batches, the batch that owns the logic builds its side first, behind a default that keeps today's behaviour. The other batch adds its one-line side after both have merged.

**Unowned files.** Three files are not in §2's ownership table: `src/app/screens/TitleScreen.ts`, `src/app/screens/frontend/parallax.ts` and `src/app/screens/cutsceneFx.ts`. This plan assigns all three to **batch 4**. Add them to §2's batch 4 row before editing them.

The file named in §8 of that plan, `src/app/SaveData.ts`, is not touched by anything here.

Every batch ends the way thresholds §2 says:
- tsc;
- the touched vitest files;
- orphans;
- real-key captures in `docs/screenshots/`;
- the game case in each commit;
- a handoff note.

Presenter changes get a focused review before deploy and a deep review after.

### Batch 2 additions (presenter, camera, transitions, scenes)

| # | Item | Class / game | Files | Work | Acceptance |
|---|---|---|---|---|---|
| A-1 | FFX-2 wait-state camera frames the boss out and cuts the party (new) | A. FFX-2 only: the ATB wait camera is FFX-2 presentation, and FFX's first-menu framing is fine | `src/engine/BattleCamera.ts`, `src/engine/BattlePresenterActive.ts`, new `tests/e2e/ffx2-wait-framing.spec.ts` | Probe which shot is active in the `23-midfight` moment, when no menu is open (rule 3). Add a fit rule to the FFX-2 wait shot: the acting or next-acting enemy's quad is at least 75% on screen and every party quad at least 90%, or the shot falls back to the first-menu master. `farplane.ts` slot edits wait for `r21-road-phone`. | 10 wait frames per FFX-2 chapter (IV, V, VI, XI, XIII, XV) at 1600x900 and 2000x1012. Every frame has a boss quad ≥ 75% and party quads ≥ 90% on screen. Evidence: `ce05b02c-focused/ffx2-{vegnagun-shuyin,fallen-aeons,trema}-win-w/23-midfight.png` today. |
| A-2 | Battle entry per Bailey's 19 Sep pick, "canon by situation" (approved tile "The pane breaks") | A. Split by game (research ffx-vs-ffx2-presentation §1.1 to 1.3): FFX blurs out of the cutscene, and uses the FFX shatter on skip or retry; FFX-2 uses its own shatter and then a hard cut; Vegnagun's parts get a black-hole implosion (FFX-2 only; visual-bible §1.18) | New `src/ui/common/transitions/shatter.ts`, `blur.ts` and `implosion.ts`, plus `transitions.css`. `swirl.ts` is kept as the reduced-motion/low tier. `BattleScreenFlow.ts` call site: batch 4, one line, after both merge. Vegnagun part seams: `src/engine/BattlePresenterBeats.ts` | Port the shard sweep from the concept's `shatter.html`: crack in place, then the shards leave right to left with a spin, a white flash and black behind (§1.1 steps 2 to 4). Cap the shard count. One transition owner per game (build-b-review REQUIRED 9). The implosion is a roughly 0.6 s radial pinch that desaturates to 0 and fades up. Shuyin gets the shatter. Reduced motion gets a cut. Debug speed "skip" collapses the transition to 0 s. Confirm interrupts it, and a RETRY does not replay the long form. **Before shipping, show the first implosion frames next to the tile** (target and build side by side): Bailey named the implosion in words, and there is no picture of it yet. | One capture sequence per class (FFX cutscene entry, FFX retry, FFX-2 entry, a Vegnagun part seam, reduced motion) at 1600x900. Re-shoot `docs/concepts/polish/glass-shatter-transition/before.png` (build-b REQUIRED 9). No swirl frame outside the low/reduced tier. |
| A-3 | 14 to 20 s of black on a cold first visit (new; related to PR-0061 and the Delivery "cold-cache load" item) | A. Both (shared loading plumbing) | `src/ui/common/transitions/swirl.ts` (and the A-2 transitions), `src/app/screens/battlePreload.ts`. Batch 4: `ChapterSelectScreen.ts` (warm the chapter on card focus) and, optionally, `tools/deploy-pages.mjs` | While the cover waits more than about 400 ms for the diorama and art, raise the approved battle-start card (`A-battle-start.jpg`) over the ink with a thin Ink & Gold progress hairline. Start `preloadBattle` on board focus or select, not only at prep (`BattleScreenFlow.ts:307`). Load the backdrop and boss idle first, poses after. Optional (delivery): ship WebP derivatives beside each PNG. The approved PNGs stay byte-identical and verify-approved stays green. If the driver judges the hairline new rather than a token of the approved card, show one frame (rule 9); the card itself is class A. | A fresh-profile cold run on the live URL, with real-key skip in I and IV, has no frame with luma below 12 for more than 500 ms between the scene and the card. Time to the card is logged. Warm-cache runs are unchanged. Evidence today: `pres-audit/videos/ffx/action-sequence.webm` frames 20 to 63, and `yunalesca/04-04-battle-start.jpg`. |
| A-4 | Victory pose withheld where the sources withhold it (new) | A. FFX Ch II Yunalesca (research §2.1, single source). FFX-2 Ch IV Bahamut and Ch V Shuyin (§2.2, single source; visual-bible line 668 agrees for Shuyin). **Trema stays "pose"** until sourced (question C-7). Every other chapter keeps the pose. | `src/engine/BattlePresenterBeats.ts` (`victory()`, lines 213 to 221), `src/engine/BattlePresenterPorts.ts` (a `victoryPose: 'pose' \| 'hold'` port, default `'pose'`, passed in and never read from the DOM), `tests/unit` presenter test. Batch 4: the three `src/data/chapter-meta-*.ts` values, after both merge | On `'hold'`, the figures keep their battle stance, the victory cue is held quiet, and the camera still settles on the victory rig. The Results screen is unchanged (`ffx2-bahamut.ts:114`'s `results(true)` already silences Results only). | A unit test covers both values. Real-key last-blow-to-results captures in II, IV and V at 1600x900 show no `victory` pose. Chapters I and IX still pose. |
| A-5 | Bosses dissolve into pyreflies (approved tile "Dissolved into pyreflies, not faded out") | A. Both, but only for things that canonically dissolve (fiends, aeons, the unsent). Humans (Leblanc, Logos, Ormi, Isaaru, the goons) never dissolve. | `src/engine/BattlePresenterDepartures.ts`, `src/engine/Particles.ts`, `src/engine/shaders/PaintedShader.ts` | Add a noise-erosion uniform that sweeps from the feet up with a gold burn edge, and spawn one mote per eroded band. The emitter must outlive the results wipe (build-b REQUIRED 13). Map this only onto the existing `'dissolve'` departures. Reduced motion gets a short erosion with no lingering motes. | One capture per departure classification per chapter. A regression test on emitter disposal. A composite against `docs/concepts/polish/pyrefly-death/after.png`. |
| A-6 | Air in the arena: pyreflies at three depths (approved tile, partly present) | A. Both, with a per-location canon row. Locations with no attested pyreflies get `none`. | `src/engine/Particles.ts`, `src/scenes/*.ts` (except `farplane.ts`, which waits for `r21-road-phone`) | Instance the A-5 emitter at a near-lens band, a mid band between billboards, and a far band. Write the canon table from research §8 with a citation per row. The three disputed locations (Gagazet, Leblanc's room, Macalania) keep today's value until C-4 is answered. | Frame cost is logged per effects tier. A composite against `pyrefly-atmosphere/after.png`. A unit test says every scene has a canon row. |
| A-7 | Backdrops with a floor and a sky (approved tile "Backdrops with a floor and a sky") | A. Both | `src/engine/Backdrop.ts`, `src/engine/Diorama.ts`, `src/scenes/*.ts` (plate splits; `farplane.ts` later) | Per build-b REQUIRED 8: extend the existing `ParallaxLayerSpec` bands and do not rewrite them. Split each plate into up to 5 bands with in-painted fill. Add a small camera pan budget, and a depth-of-field pass focused on the party plane. Keep a flat fallback at low effects. | The bands recomposited at pan 0 match the approved PNG under a perceptual threshold. `zanarkand-dome.png` keeps its hash. verify-approved stays green. A 2 s pan clip in I and IV. |
| A-8 | Contact shadows invisible on dark floors (new) | A. Both (shared PaintedActor plumbing) | `src/engine/PaintedActor.ts`, `src/engine/BlobShadow.ts`, `src/engine/Backdrop.ts` (read `BackdropPalette.ground`) | Derive the shadow's opacity and tint from the palette's ground band instead of a fixed 0.5. Add a tight foot-occlusion ellipse under each baseline. Hovering subjects keep no shadow. | In every chapter's first menu, the mean luma under the feet is at least 12% below the surrounding floor. `_art/feet.jpg` pairs are re-shot. |
| A-9 | Lady Ginnem's unsent glow (approved option O-3; targets.json note "not yet built") | A. FFX only (Ch IX) | `src/scenes/cavern-stolen-fayth.ts`, `src/engine/Particles.ts`. Batch 4: `src/app/screens/cutsceneFx.ts` (currently unowned, see above) | An additive mote shell on Ginnem's outline, plus slow alpha breathing. It reuses the A-5 emitter, so there is one pyrefly system. Build it after PR-0184, PR-0185 and R15-02. | The Ch IX pre and post scene captures match the tile. There is no hard outline (`regress/cand-yojimbo-cavern-...-10-post-scene-open.jpg` today). |
| A-10 | Dream's End framing: the red sun and the burning mound are cut (new; the Ch I half is PR-0034) | A. FFX only (Ch III) | `src/scenes/dreams-end.ts` | Change the backdrop plane's vertical offset or scale, or the rig pitch, so the sun and the mound's crest sit in the upper third behind BFA at 1600x900 and 2000x1012. The pagodas do not move. | A composite against the approved Dream's End tile. approved-hashes stays byte-identical, because only the render changes. |
| A-11 | Party inside the frame in master and push shots (new for the FFX desktop master) | A. Both (the rigs are per scene) | `src/engine/BattleMoments.ts` (push clamp), `src/engine/ScreenRects.ts`, `src/scenes/gagazet.ts` and the other rig tables | Clamp every rig move: every living party quad stays at least 85% inside the viewport minus the HUD safe rect, or the push stops short. Re-aim the Ch I idle rig. | An actor-projection sweep (batch 5's CHK-011 harness) over the idle, action and caption-push rigs at 1280, 1600 and 2000 finds no party quad cut by more than 15%. Evidence today: `pres-audit/seymour-flux/05-07`, `_cinematics/x2-full.jpg` at 29.0 s, `ffx2-vegnagun-shuyin-win-w/seq-seam-4/f03-f07.jpg`. |
| A-12 | Phone framing for every chapter (extends PR-0201; Ch IV and I are new) | A. Both. IV is FFX-2 and I is FFX | `src/scenes/*.ts` phone slots, once `r21-road-phone` has merged `phoneFraming.ts` | Apply option A's fit rule to all chapters: the boss quad is at least 75% visible and every party quad sits inside the frame. | A 390x844 first-menu and mid-fight capture per chapter, added to the framing spec. |
| A-13 | The approved Ink & Gold per-attack camera roll (spec, unused) | A. Both (the motion spec is shared) | `src/engine/BattleMoments.ts` (impact), `src/engine/BattlePresenterBeats.ts` | `rollTo(-4°)` on each attack's first hit, then release, scaled by playback speed and skipped under reduce-motion (`presentation-ink-and-gold.md:144`; `BattleCamera.roll()` exists and has no callers). **Not included:** the per-hit micro hit-stop. That belongs to the `hit-feel` concept, which Bailey did not approve on 19 Sep. | A before/after clip of a Ch I attack. The added time per action is 0 s. |
| A-14 | Tidus's attack pose jumps in saturation and scale against his graded idle (new) | A. Both (shared fog and grade); seen in FFX | `src/engine/PaintedActor.ts`, `src/engine/shaders/PaintedShader.ts` | Probe first (rule 3): log the fog factor and tint uniforms at the lunge peak against the idle. If fog explains it, compute fog and grade from the rest position, not the lunge position. If it does not, report the cause and stop. | The torso's mean hue and saturation differ by less than 8% between the idle and attack frames (`_art/y-party.jpg` today). |

### Batch 3 additions (FFX-2 HUD)

| # | Item | Class / game | Files | Work | Acceptance |
|---|---|---|---|---|---|
| A-15 | PR-0157's FFX-2 half: cards over the boss during actions | A once the fade/shift pick lands. Both (the cards are ours in both games) | `src/ui/ffx2/FFX2BattleHud.ts` (a new hudFade module; the file is over 400 lines), taking batch 2's HudPort signal | Same moment and same look as the FFX half. | In IV and V action sequences, no advisory card intersects the acting figure or the upper two thirds of the target. |

### Batch 4 additions (flow, story, front end)

| # | Item | Class / game | Files | Work | Acceptance |
|---|---|---|---|---|---|
| A-16 | The title's first frame is black before the key art decodes (new) | A. Both (shared front end) | `src/app/screens/TitleScreen.ts`, `src/app/screens/frontend/parallax.ts` (both currently unowned, assigned here), `index.html` (preload link) | `<link rel=preload>` for `keyart.2x.webp`, then `await decode()` before revealing the plate. Show a blurred 32 px LQIP (an inline data URI) instead of black. | No frame after "title" has mean luma below 10% at 1600x900 or 390x844. build-b acceptance (1) holds: every parallax layer is decoded when the title settles. |
| — | One-line sides of A-2 (call site in `BattleScreenFlow.ts`), A-3 (`ChapterSelectScreen.ts` warm on focus; optional WebP in `tools/deploy-pages.mjs`), A-4 (three chapter-meta values), A-9 (`cutsceneFx.ts`) | as the parent row | as named | These land after batch 2 merges. | As the parent row. |

### Art lane (local `public/art`, no source code; judge-locked and approved files never replaced)

| # | Item | Class / game | Work | Acceptance |
|---|---|---|---|---|
| A-17 | Yuna's White Mage action paintings show a different outfit from her White Mage idle (new) | A (interim, reversible). FFX-2 only (Ch IV, and any chapter where Yuna wears White Mage) | Route `yuna-white-mage`'s cast, attack, hurt, victory and item slots to the idle, the same way D-179 handles failed slots. This is a manifest or sidecar change. None of these files is approved-hashed. The re-render is ART job 3. | In a Ch IV real-key run, Yuna's White Mage outfit never changes between idle and action frames (`_cinematics/yuna-wm.jpg` today). verify-approved stays green. |
| — | PR-0137 Bahamut alpha repair | Already in batch 2's list (FFX-2) | Unchanged. | Unchanged. |

**Suggested merge order in iteration 2** (at most 4 to 5 heavy agents at once):
1. Batch 2 part 1: A-3, A-4, A-8, A-10, A-11, A-13, A-14. These are small and give the most visible gain per hour.
2. A-1 and A-2.
3. A-5, then A-9 and A-6, which reuse its emitter.
4. A-7 last, because it is L and deep-class.

Batch 3's A-15 follows the PR-0157 pick, and batch 4's one-liners follow their parents. A-12 follows `r21-road-phone`.

---

## 4. Class B options rounds, ordered by impact

★ marks the three to mock first.

**How to mock.** The rounds share one method: real-engine frames or short clips at 1600x900, and 390x844 where the item applies.
- Prototypes live in a **scratch worktree that is never merged**, with debug overrides for rigs and slots.
- Where a look can be judged on a still, use HTML or canvas painted over a real captured frame. That is cheaper.
- Each round ends with Bailey's pick, recorded in `targets.json` with liked / disliked / must remain / must change / undecided.
- Rule 11 applies to any download a prototype needs.

Two concepts were shown on 19 Sep and **not approved**: `overdrive-cinematic` and `clair-command-camera` (`targets.json`: "NOT approved, do not build"). They may appear as reference options only if the sheet says so plainly, and each round includes at least one fresh option.

| # | Round | Game | Options to mock | How |
|---|---|---|---|---|
| ★ B1 | **Spell and skill effects**: one tinted bloom today (`VFX.ts` has 3 primitives; `makeVfxPort` uses the element only to choose a colour) | Both, with two skins. FFX: black and white magic, Overdrives, boss specials. FFX-2: dressphere skills (Gunner, Black Mage -ra/-aga, Dark Knight Darkness, Songstress, Alchemist). Research §9 row 2 | (A) Painted flipbook sheets on a billboard: original ComfyUI renders, 6 to 8 frames per element. (B) Shader particles per element: a fire column, ice growing from the floor, a vertical lightning strike with a screen flash, a water ring, holy pillars. (C) A hybrid: particles plus a painted element-glyph flash. Show them on Fire on Seymour Flux (Ch I) and Fira on Bahamut (Ch IV). | Stills: a canvas over real mid-effect frames. One 2 s clip per option, overlaid on a real-engine capture. (A)'s frames need 1 to 2 pilot renders only if art generation is on; otherwise show (A) as a paintover sketch, labelled as such. **After the pick:** a registry keyed by ability id, falling back to the element and then to today's bloom. The low and reduced tiers keep the bloom. Build the six elements and heal first, then the telegraphed boss specials. Every castable ability resolves to an effect id (unit test). |
| ★ B2 | **An attack camera that frames the attacker and the target together**, and lets melee close the distance | Both, staged differently. FFX: whether the attacker runs to the target and back is **not in our research**. It goes to the next Steam session (D-205), and until then the FFX approach stays behind an OFF switch. FFX-2: "a character stays where it last acted" (ffx2-vegnagun-shuyin §4.3.3; the geometry is a labelled design decision). Ranged dresspheres never move. | (A) A computed over-the-shoulder shot: the camera sits behind the attacker, looking at the target, with both in frame. (B) A plus the approach (FFX: run in, strike, return; FFX-2: run in and stay). (C) Today's two cuts plus a hold frame on the hit. Show them on a Tidus Attack (Ch I) and a Paine Warrior attack (Ch IV). | Real-engine clips from a scratch worktree, using a debug shot solver built on `ScreenRects.ts`. The approved Battle HUD tile (`A-ink-and-gold-battle.jpg`, Tidus striking Seymour in one frame) sits beside each clip as the target. Acceptance after the pick: in a sweep of I, IV, V and XII, at least 90% of single-target hits show both quads at least 60% unoccluded. Pair with PR-0157. |
| ★ B3 | **Vegnagun as a colossus**: four small, mismatched props today | FFX-2 only. visual-bible §1.18 and §2.5 ("a leg fills the frame; the head is a cannon aimed out of frame"); the boss-size table is marked [estimate] | (A) Part-scale staging with the current paintings: the leg or head fills the frame, the girls sit small at lower left, and the Vegnagun silhouette sits on the horizon for the Shuyin link. (B) A plus one unified repaint of the head, body and leg as a single dark locust/moth machine. The approved **Tail A** stays as picked. (C) Today's scale with only a unifying grade. | HTML over real Ch V frames, scaling and cropping the existing paintings. That is cheap and needs no GPU. (B)'s repaint is shown as one pilot render (3 to 5 candidates) only if art generation is on; otherwise (B) is shown as (A)'s frame plus a written note. Show the research quotes on the sheet. The pick then fixes PR-0095, PR-0094 and PR-0072's anchors. |
| B4 | **Overdrives and boss specials get a camera moment**, not only a name slab (`BattleMoments.ts:395-416`) | Both. FFX: Overdrives and boss specials. FFX-2 has no Overdrives, so there it is the boss specials (Mega Flare, Acta est Fabula, Terror of Zanarkand) and the Special dresspheres | (A) Today plus a dolly and a hit-freeze on the last hit (fresh). (B) Three cuts in about 1.5 s: a low hero angle and the HUD wiped (fresh, shorter than the declined four-cut concept). (C) For boss specials only, the field drops to ink with one colour surviving (`clair-impact-feel`, **declined 19 Sep; shown only as a reference**). | Real-engine clips of Swordplay (Ch I) and Mega Flare (Ch IV), each shown twice: a first play and a repeat. The canon pacing rule is research §7: the full version the first time, short after, shared with the spherechange setting. The repeat adds at most 1.2 s (PR-0061 budget). |
| B5 | **Boss presence and FFX-2 staging depth**: bosses at or below party size (Yojimbo about Yuna's height; Natus smaller than Kimahri; Ormi and the goons about 40% of Yuna) and the girls crowding the front-left | Both, decided per chapter from the visual-bible boss-size table: FFX bosses from the FFX rows, FFX-2 bosses from the FFX-2 rows. Rows marked [estimate] guide only; where there is no row, the sheet says so. Folds in PR-0036 (thresholds §3 item 4), PR-0136 and PR-0177 | Per chapter (VI, IX, X, XV, plus IV for PR-0036): (A) the boss slot moved forward and scaled to the table; (B) the camera lowered and pushed so the boss looms; (C) today's. | Real-engine frames using debug slot and scale overrides, next to a table of on-screen height ratios (build versus table). One sheet covers all chapters, so the slots are moved once. |
| B6 | **Damage numerals**: the approved tiles show an ink splash (FFX gold with "1268"; FFX-2 pink with the chain tag riding "742"). An agent replaced the splash with white italic numerals, reasoning that "the glyph was an ink splash, not an FFX numeral" (`docs/handoff/polish-damage-numbers.md`). No Bailey decision was found. | Both. FFX gold, FFX-2 pink. The FFX-2 chain is a popup on the struck target (research §5.3) | (A) The approved splash, re-anchored at the target's chest with a centring transform, which fixes the offset that got it dropped. (B) The splash only on crits, big hits and Overdrive finishers, with plain numerals otherwise. (C) Today's numerals. The FFX-2 versions show the chain tag riding the numeral. | HTML over real hit frames, 3 frames per game, at 1600x900 and 390x844. The files are `src/ui/common/DamageNumbers.ts` and `damage-numbers.css`, which are **unowned in §2**: assign them to batch 3 when the pick lands. The multi-hit fan ladder stays in every option. |
| B7 | **Painted per-aeon summon glyphs**: the art step of PR-0181 | FFX only. Research §7: "one unique glyph per aeon" [single source] | (A) Gold line glyphs in the Ink & Gold hand. (B) Glyphs painted into the floor with a glow. (C) Keep the procedural ring from §2's PR-0181 row. | HTML over a real summon frame (Valefor, Ch XIV). If (A) or (B) wins, it becomes ART job 5. |

**Not re-offered unless Bailey asks.** These were declined on 19 Sep: `victory-poses-results` ("won where they fought"), `hit-feel` (the micro hit-stop), `aeon-arrival`, `depth-normal-lighting`, `cutout-animation` and `expressive-cutscene`.

---

## 5. ART jobs for the GPU (ComfyUI)

Art generation is **on** (NOW.md: "Art generation: ON"). Re-read NOW.md before each job.

**Method notes that bind every job:**
- **Identity** comes from the shipped approved idle's own sidecar (`public/art/characters/<id>/idle.json`), never from `tools/gen/cast.json`, which is stale against the approved idles (memory `art-pose-recipe-lessons-2026-09-21`).
- **Pose tags are body-only.** No effect words: "aura", "attacking", "dynamic pose", "magic circle", "sparks" and "muzzle flash" spray swirls that rembg keeps. Effects belong to the engine (B1).
- **OpenPose ControlNet** with the xinsir SDXL model, which is installed. Use a pilot of 3 to 5 poses and **look at it in game** before any batch. Never batch-render on an unpiloted recipe.
- **Weapons:** use `docs/concepts/art5/round2/METHOD-CHECK.md` method 1. Render the body with no weapon, then composite the approved idle's own weapon into the fist. The sword-free IP-Adapter reference square is part of this. The grip pass is optional, at denoise 0.3 to 0.35. The same method applies to Yuna Warrior's unheld sword and the Rikku mages' split staffs.
- **Head scale:** Rikku Thief poses are sized by body height, not head (METHOD-CHECK answer 1), unless Bailey chooses a repaint.
- **Queue and GPU:** keep fewer than 3 jobs pending. An all-black frame means a bad GPU state: restart via the `PyreflyComfyUI` scheduled task, never by re-rolling (rule 12).
- **Protected files:** judge-locked and approved-hashed files stay byte-identical. `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` (it checks both approved-hashes.json and judge-locked-hashes.json) is green before and after.
- **Storage:** candidates go to `D:/Tools/pyrefly-art-backup/candidates/<date>-<job>/` as JPEG sheets. Nothing goes to `main` (rule 8).

| # | Job | Game | Priority and slots | What Bailey picks |
|---|---|---|---|---|
| ART-1 | **Boss action poses** (attack, hurt, KO) for bosses that never leave their idle | Both. Each boss is painted from its own game's research | Priority is order of play:<br>1. IX: Yojimbo attack (Zanmato draw) and hurt; Daigoro.<br>2. X: Seymour Natus attack, hurt and KO; Mortibody hurt.<br>3. XII: Omnis attack and hurt; Mortiphasms.<br>4. XIII: Trema and Paragon attack and hurt.<br>5. VI: Leblanc, Logos and Ormi attack and hurt; the goons.<br>6. IV: FFX-2 Bahamut attack.<br>7. XV: the shades.<br>8. XIV: hurt and KO for Isaaru's aeons.<br>Source: `public/art/manifest.json`. | One sheet per chapter: 3 to 4 candidates per slot, shown in game over the real backdrop, plus the idle. Each pick becomes a tile. |
| ART-2 | **FFX-2 dressphere pose gaps** (13 slots) | FFX-2 only | Dark Knight first (V, XI and XV field it): rikku-dark-knight (all poses), yuna-dark-knight hurt and KO, paine-dark-knight hurt. Then paine-samurai, rikku-berserker, yuna-warrior (METHOD-CHECK weapon composite), paine-white-mage, paine-warrior, rikku-white-mage, rikku-thief (body-height sizing), and the missing hurt slots (paine-black-mage, paine-gunner, rikku-gunner, rikku-black-mage, yuna-songstress). Continues the approved 2026-09-25 and 2026-09-26 pose batches. | One sheet per girl. Never replace an approved or locked pose. |
| ART-3 | **Yuna White Mage re-render** of the action slots, matching the hooded idle | FFX-2 only | cast, attack, hurt, victory and item. After it lands, take A-17's interim routing out. Also sweep every FFX-2 dressphere folder, comparing idle and poses on hem, hood and palette, and list any other drift (yuna-songstress/cast differs in scale and style). | One sheet with the idle beside each candidate. |
| ART-4 | **Yu Pagoda** with a tiered, glyph-carved silhouette | FFX only (Ch III) | Idle, cast and hurt, in BFA's palette and light direction; visual-bible 56 px class, "flanking pillars". The current files stay until he picks (the art4 tile reaction lists this as undecided). | 3 candidates on one sheet beside BFA. |
| ART-5 | **Per-aeon summon glyphs** | FFX only | Only if B7 picks (A) or (B). Order: Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo, Anima. Original designs, no retail glyph traced (rule 8). | One sheet per 3 to 4 aeons. |
| ART-6 | **Vegnagun unified repaint** | FFX-2 only | Only if B3 picks (B). Head, body and leg are repainted as one dark locust/moth machine. The approved Tail A stays. | One sheet with the four parts composed together. |
| ART-7 | **B1 option A flipbooks** | Both | Only if B1 picks (A). 6 to 8 frames per element, pilot Fire first. Effect words are allowed here, because this is an effect sheet, not a pose. | The pilot sheet, then the batch. |

---

## 6. Questions for Bailey (class C), with recommendations

Send these as one plain sheet with a frame each. Do not send them in the same message as the audio pack (thresholds §4 item 1).

| # | Question | Game | Recommendation |
|---|---|---|---|
| C-1 | **Phase lighting** (approved tile "The arena turns when the boss does"). PaintedActors are unlit by design (build-b REQUIRED 10), so the promised key light on the party cannot land without new lighting work. Option (A): the reduced version. Grade, fog, floor glow and a rim/bounce tint on the cast, on canon phase beats only, with the tile's after.png re-shot to match. Option (B): the full promise, which first needs the declined `depth-normal-lighting` concept approved. | Both, on canon triggers only (research §9 row 4). FFX: Flux's Reflect at 50%, the Mortiorchis charge ladder, Yunalesca's forms, Anima, Cid moving the ship. FFX-2: the Mega Flare countdown and the Vegnagun part links. | **(A).** About 15 hand-tuned grades that change hue and exposure only, tweened over about 1.5 s. The reduce-flashes tier skips the tween. No more than 3 flashes a second. Build it in batch 2 (`Renderer.ts`, `ScenePalettes.ts`, a phase hook through the Ports). |
| C-2 | **Wakka's pause plate face pass.** You approved Wakka's pass as "clearly better" on 19 Sep. `public/art/pause/wakka.png` is hash-locked, so installing the pass needs your word on the exact file. | FFX only | **Yes**, shown 1:1 before and after. Record the new sha256 with your words. |
| C-3 | **Chapter IV pause plate.** This is thresholds queue item 9 and is carried, not new. Both plates are hash-locked. | FFX-2 only | Carried from the thresholds sheet. |
| C-4 | **Pyreflies where the sources do not put them.** Gagazet has 80 motes (research §8: none attested on the trail). Leblanc's room has magenta motes (§8: indoor, no particles). Macalania has motes by the Chamber door (§8, 2 sources: save pyreflies for Seymour's death). | Gagazet and Macalania FFX; Leblanc FFX-2 | **Follow the sources for Macalania and Leblanc.** Leave Gagazet to you, because that source is an absence. Our pick there is snow and glitter only. |
| C-5 | **Yuna's HUD portrait chip reads light brown or blonde**, against the dark brown of her battle idle (`_art/ffx-portraits.jpg`). `portraits:ffx-party` is approved-hashed. The crops (PR-0014) are fixed separately in batch 3. | FFX only | **A repaint of the chip only**, matched to the idle's hair, shown beside the current chip. Nothing changes without your yes. |
| C-6 | **FFX battle entry, strict or pane?** Answered on 19 Sep: "canon by situation" (a blur out of the scene; the shatter on skip or retry). A-2 builds exactly that. **This is not a question.** It is listed so nobody re-asks it. | FFX | None needed. |
| C-7 | **Trema's victory pose.** Research §2.2 withholds the pose after "Via Infinito special bosses on first defeat". Is Trema one of them? | FFX-2 only (Ch XIII) | Settle it from GameFAQs (D-214), labelled as our estimate, or in the Steam session. Keep the pose until then. |
| C-8 | **FFX melee approach.** Does the attacker run to the target and return? B2 needs the answer for FFX. | FFX only | Add it to the next Steam session (D-205). No retail frames are saved. |

---

## 7. What this program is worth (estimates, not scores)

These figures are the lenses' estimates. Round 14 and later rounds score the real change.

- **Visual (weight 15, 8.3 in round 13).** Closes three stalled majors: PR-0181, PR-0031 and PR-0095/0094. Delivers five approved polish tiles: the pane, pyrefly death, air in the arena, living backdrops and the Ginnem glow. Brings the target gate from 11 of 13 undelivered polish tiles to 6 (or 5, if C-1 lands). B1 and B2 are the largest single gains after that: about +0.2 to +0.3 and about +0.15.
- **Feel (weight 10, 7.8, stalled).** A-3 (the cold black), A-13, PR-0180 and the PR-0061 leftover. Then B1, B2 and B4, at about +0.2 to +0.3 each.
- **Delivery and Onboarding.** A-3 and A-16 remove the two dead-black first impressions.
