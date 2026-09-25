# Chapter XIII polish: FOC16-01 to FOC16-06 (release 16 focused review)

Source: `critic/reviews/fc7f1a20-focused.md`. Every frame here comes from real keys starting at the title
(headless Chromium on the GPU, Vite dev server with HMR off). Each pair shows **BEFORE** (the tree
without these fixes) on the left and **AFTER** on the right. The only debug step was the labelled
"Paragon HP to 1" setup used for the phone link-seam strip.

| Item | Game case | What changed | Evidence |
|---|---|---|---|
| FOC16-01 major: the reticle covered the enemy-move slab | FFX-2 only (only FFX-2 draws the flower reticle; FFX aims with the hand) | `src/ui/ffx2/intentBoard.ts` `reticleBoxes`: the `.ffx-target__flower` square counts as a *soft* obstacle, so the slab moves to a free spot and never onto the HUD | `foc16-01-06-target-step-{1600x900,2000x1012,1280x720,390x844}.jpg`; overlap with the flower is now 0 px at all three desktop sizes (A/B at 1280x720 using HEAD's `intentBoard.ts`: 21,300 px² before, 0 after) |
| FOC16-02 major: the dossier sat on Trema's eyes on plate B | both (shared pause plumbing); only `ch13-trema` has a chapter face box | `src/app/screens/pause/dossierPlace.ts` + `pause-chapter.css`: the placements run beside, then under the columns, then under without the snapshots, then the heading alone. The first one whose ink clears the face (with the pause's face margin, through the push-in) is used. The locked PNG is not edited. | `foc16-02-03-pause-chapter-*.jpg`: at 1600x900 and 2000x1012 the dossier wraps under on the empty left side. At 1280x720 it already cleared, so it stays beside. The phone stacks it as before. |
| FOC16-03 polish: DRESSPHE… on the CHAPTER tab | FFX-2 only (FFX's WEAPON / ARMOUR keys fit) | `pause-chapter.css`: the gear column holding a dressphere row widens its keys to 9 x `--pu-fs` and the bar gives the width back, so the values keep their places | the same `foc16-02-03-*` pairs |
| FOC16-03, found while checking every tab: GARMENT GR… on the member tab at 1280x720 | FFX-2 only | `pause-chapter.css`: the wide column holding the Garment Grid row takes keys at 11 x `--pu-fs`, again paid for by its bars | `foc16-03-pause-member-garment-grid-1280x720.jpg`. FFX (Chapter I) at 1280x720 cuts nothing on the member or CHAPTER tab. |
| FOC16-04 polish: results show only Trema's rewards | FFX-2 only | **Not changed.** `research/ffx2-trema.md` sources each fight's EXP / AP / gil (§3.1, §3.2). It does not source how the game pays out the two links: Trema kills Paragon in a cutscene, and no source says whether a victory tally follows Paragon (§2 steps 2 to 4). Per the brief and hard rule 6, the screen is left alone; this is a question for Bailey or for a source. | none |
| FOC16-05 polish: small fighters on the phone | FFX-2 only (Chapter XIII's scene) | `src/scenes/cloister-100-rigs.ts` `cloisterRenderAspect`: under the upright-phone battle HUD (`PHONE_BATTLE_QUERY`), the canvas is the 16:9 render that `phoneFraming.ts` slides (commit 0da9ce72), so the scene takes the wide rigs like every other FFX-2 scene. The portrait rigs remain only for a portrait window that the phone HUD does not take. Phone HUD B rules unchanged. | `foc16-05-phone-menu-390x844.jpg`; `foc16-05-phone-link-{before,after}.jpg` (the link seam: Trema walks in and the Trema link starts) |
| FOC16-06 polish: the guide said "Trema" during Paragon | both (shared guide plumbing); only Chapter XIII sets it | `ChapterGuide.linkTitles` (optional, additive) + `guideTitle` in `src/engine/tactics/lookup.ts`: the first standing boss in `bossIds` order names the headline | `foc16-06-first-menu-1600x900.jpg` and every target-step pair (guide headline "Paragon") |

**Another FFX-2 chapter, unchanged (Chapter IV, Bahamut):** `ch4-unchanged-*`. The menu and the pause CHAPTER
tab match at 1600x900 and 390x844 (the dossier stays beside; Bahamut's plate has no chapter face box). The
reticle rule leaves the slab at 399,184 at the Cure target step, where the flower sits on a girl, which is
the same spot as the White Magic list (401,184).

**Disclosed, not changed:**

- On the phone member tab, the **value** VALIANT LUSTRE prints as VALIANT LUS…. This happens with or without
  these fixes, and a longer grid name (PRIDE OF THE SWORD, Chapter IV to VI builds) would be cut too. The
  350 px column cannot hold key, bar and an 18-letter value at 12 px. Fixing it means shortening the ATB bar
  or letting the value wrap on the phone, which is a layout call for Bailey's phone frame (f).
- At the 1280x720 target step, the move advisor drops to its short rung, with the cap at 60 px under the
  girls' feet. HEAD's `intentBoard.ts` does the same (A/B above), so this is not caused by FOC16-01. The
  before frame's full card was a timing difference.
- In the "before" 390x844 link-seam run, the dev log showed `mid-battle script "paragon-falls" did not finish
  within 30000ms`. That run was the old tree. The after run logged no error.

Tests: `tests/unit/ui-ffx2-intent-reticle.test.ts` (01), `tests/unit/pause-dossier-place.test.ts` (02),
`tests/unit/chapters/trema-phone-rigs.test.ts` (05), `tests/unit/guide-link-title.test.ts` (06).
FOC16-03 is CSS only, and its evidence is the frames.
