# Chapter XIV ship layer: independent check

**Game case: FFX only.** Isaaru's contest of aeons in the Via Purifico (research §0.3; in FFX-2 nobody
summons). The one defect below that is not this chapter's own (the black fade over narration) is shared
plumbing, so it is "both".

- **Checked:** commit `4bed8e3e` on branch `chapter-isaaru-ship-0925`, in the worktree `D:/pyrefly-ch-isaaru-ship`.
- **When:** 2026-09-25.
- **How:** the checker built none of it and edited nothing under `src/` or `tests/`. This file is the only commit.
- **Verdict:** 0 blockers, 1 major (shared and already live, not introduced by this chapter), 9 minors. The
  chapter can stay on this branch **unlisted**, as the brief says.

## Mechanical checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| Full vitest (`--testTimeout=60000`) | 414 files passed, 3 skipped (417). 7,716 tests passed, 13 skipped, 1 todo. Exit 0, 75 s. |
| `node tools/orphans.mjs` | 763 modules, 24 orphaned: the same 24 as `main`. |
| The ship bench, inside the full suite | The shipped line wins 125/200 (63 %), and every loss is in link 3 (Spathi). The options: Shiva's rows give 142, Ixion's give 135, both give 153. These are the builder's numbers. |
| Seeds on the real engine (my own driver, the live `intended` strategy with the screen's own carry) | Seeds 1 to 12: 9 wins. Seeds 3, 8 and 11 are losses in link 3. `grothia-ready` fires after Grothia's first action and before his first Hellfire (seed 1). |
| Boss numbers | Since the engine commits (`250db015`, `12277daa`), the ship commit changed only the enemies' `spriteKey` values (`grothia`, `pterya`, `spathi`, plus Isaaru's comment). No stat, ability, AI row or RNG draw changed. Nothing under `isaaru*`, `aeon-duel.ts` or `via-purifico.ts` builds changed after `21502778`. |
| House style | Every new file is under 400 lines. The files over 400 that were touched hold their length or shrink, except `src/battle/common/types.ts`, the shared contract, which grew 2,612 → 2,651 (see minor 7). `dsl.ts` stays at 600, `scenes/index.ts` at 399 and `setup.ts` at 399. |
| Contracts | `docs/CONTRACT-CHANGES.md` has two new entries dated 2026-09-25. One covers `ChapterId`, `Chapter.number` up to 15, the short `activeSlots`, and `lockedAeons` / `aeonsOnly` / `victoryBonusAp`. The other covers `SpeakerId` `'isaaru'`. |
| Merge with current `main` (`937f894d`, 2 commits ahead: NOW and the Chapter XII e2e frames) | A `git merge-tree` dry run is clean. |
| Locked art: `verify-approved.mjs`, before and after every run | Main: 225 ok (approved 177, judge-locked 48), 0 mismatched, 0 missing. Worktree (`ROOT=`): the same. `public/art` is a junction to main's copy. |
| Worktree after the whole check | `git status` is clean before this commit. |

## In the browser: headless GPU Chromium, fresh load each run

- **Server:** a private Vite on port 5775, with HMR and the watcher off and its own cache dir. The preview
  ran on port 5776. Both were stopped by their port's PID, and 5760 to 5779 are free.
- **Reaching the chapter:** the debug API was used only to open the unlisted chapter:
  `gotoChapter('isaaru-via-purifico', { skipPrep: false, skipCutscenes: false, skipResults: false, seed: 1 })`.
  After that, every step was a real key or tap.
- **Page health:** no page errors, no console errors and no HTTP errors in any run. Every image the page
  loaded decoded in the page with `createImageBitmap`.

### The walk at four sizes

The walk is: party prep, Enter, the pre scene advanced line by line with Enter, then the first command
menu (Yuna). Then one real action with Enter: the first Enter clears Auron's first-time card, then Special,
then Pray, then the target. Yuna plays Pray on herself.

| Size | Prep | Pre scene | First menu | Real action | Images, all decoded | Placeholder poses |
|---|---|---|---|---|---|---|
| 1600x900 | ok, "XIV · Isaaru" | 19 lines in draft order (1 to 17, then link 1's cry and lock line), each with its portrait | 9.9 s after the battle opened | `yuna` Pray → `yuna` | 59 | none |
| 1280x720 | ok | the same | 9.6 s | the same | 56 | none |
| 2000x1012 | ok | the same | 9.6 s | the same | 56 | none |
| 390x844 (touch) | ok | the same | 9.9 s | the same | 59 | none |

**Pause, CHAPTER tab.** At 1600x900 the tab was opened with Esc and then a click; at 390x844, with a tap.
- The plate is `ch14-isaaru-via-purifico` (hero plate B). Its `.2x.webp` loaded at 1982x1132 on desktop and
  1477x844 on the phone.
- The tab shows the three objectives, "Battle 1 of 3" and the scene "Via Purifico".
- On desktop it also shows the quote (line 12), the handwritten line and the three snapshots. On the phone
  the shared "lean" dossier rule drops the quote and the snapshots, as it does for other chapters.
- The tab strip is `member:yuna, chapter, guide, options, controls, music`.

**Every link on the stage.** In a separate run (seed 1, preview build, `intended`), every stage actor was
sampled every 150 ms until link 3 opened. The actors seen were Yuna; Isaaru; Grothia, Pterya and Spathi on
their own installed paintings; and Yuna's Shiva, Valefor, Bahamut, Ixion and Ifrit. Across 32
actor/pose pairs there were no placeholder poses and no warnings.

### Win, loss and retry

**WIN, seed 1** (labelled; the bench also wins seed 1).
- The run went from a fresh load through the pre scene (19 lines on Enter) and all three links at skip
  speed. Seed 2 was repeated and also won.
- The post scene played lines 18 to 22 with portraits, then the two narration lines 23 and 24.
- Results showed "Via Purifico — Beneath Bevelle · Cleared", Victory, the grim-tier quip "...I'm sorry,
  Isaaru.", AP 5,000 and Yuna +12 S.Lv. Enter confirmed it, and the flow resolved
  `{ outcome: 'victory', turns: 50 }`.
- Link 3's live trigger was `spathi-called`. The engine run shows `grothia-ready` and `pterya-called`
  firing in the earlier links.

**LOSS and RETRY, seed 1** (`auto: 'attack'`, skip speed).
- The contest ended in defeat after 153 turns. The defeat panel showed RETRY / CHAPTER SELECT, with the
  cursor on RETRY.
- A real Enter chose RETRY, and a new battle opened: seed 1001, Grothia at 8,000 HP, Yuna at 1,650/1,650,
  and the formation `isaaru, grothia`.

**Chapter select** (title, then Enter). There are 10 tiles: Seymour Flux, Lady Yunalesca, Braska's Final
Aeon, Evrae, Yojimbo, Seymour and Anima (VII, still "coming", not playable), Bahamut, Vegnagun, Leblanc and
Trema. No text on the screen mentions Isaaru or the Purifico. `ChapterSelectScreen`, `frontend/*` and
`chapter-select.css` are byte-identical to `main`. The only `encounters.ts` changes are the `ChapterId`
member, the `number` range and one comment.

### Production build

- **Build:** `vite build` into a scratch out dir (never the shared `dist/`), with base `/pyrefly-reprise/`.
  `prebuild` was skipped, so main's `public/art/manifest.json` was not rewritten through the junction.
- **Decoding:** `buildManifest(dir, { decode: true })` decoded all 1,068 shipped files with no problem.
  Every Chapter XIV image decoded "ok": the plate, the Isaaru idle and portrait, the pause plate PNG and
  `.2x.webp`, and each of Grothia's, Pterya's and Spathi's idle, attack and overdrive.
- **Serving:** `vite preview`, then `verifyLive(..., { full: true })` on 1,068 files: 0 mismatched, 0
  missing, 0 wrong type. It reports "UNVERIFIED" only because a local build publishes no
  `artifact-manifest.json`.
- **Repeat runs:** the 1600x900 and 390x844 walks, the pause plate, the seed-1 WIN and the placeholder
  sweep were repeated on the preview. The results were the same: 59 and 68 images, all decoded, no errors,
  no placeholders.

## The story against the writing bible and Bailey's picks

- **Lines match the draft.** Lines 1 to 24 play word for word from `docs/plans/isaaru-story-draft.md`,
  seen live, and so do the three cries and three lock lines. Maester Kinoc gives the order (I-9).
- **Line length.** The longest line is 53 characters (the cap is 60), and no line has more than one
  ellipsis.
- **The voices hold.**
  - Auron speaks in fragments and never says a name.
  - Kimahri's one line is in the third person and comes after the silence.
  - Lulu speaks for Yuna when they have to go.
  - Isaaru is courteous and states his orders, not the theme.
- **Grim tier.** There is one quiet victory quip, as the draft recommends.
- **Picks seen in the build:** B14 a (only Yuna fights), B15 a (the narration frame), B17 (link cries,
  lock lines and the Hellfire warning; the other two are disclosed as owed), B19 (the dissolve), hero
  plate B, and the stand-in cues.

## Findings

### Major (shared, already live; not introduced by this chapter)

1. **Narration after `fade('black')` cannot be read.** Lines 23 and 24 ("The stairs came out on the
   bridge…", "We were already there…") play on a fully black screen.
   - **Cause:** `CutsceneScreen` maps `fadeScreen` to `app.fade('opaque')`, the `#fade` layer (z-index 20,
     opacity 1). That layer sits above `#ui`, which holds the dialogue box. In the DOM the box is present
     with `dbox--narrate dbox--visible`, and the frames are pure black: seeds 1 and 2, 1600x900.
   - **Already live:** the same shared code does this in live Chapter I. Seymour Flux's epilogue ("We
     climbed the rest of the way in the dark." and the three lines after it) is also pure black, with
     `#fade` opaque. The same `fade('black')` then `narrate` pattern closes Yunalesca, Braska's Final Aeon,
     Seymour and Anima, and Evrae.
   - **Status:** `introducedByCandidate: false` (the chapter uses the existing pattern);
     `regressionVsLive: false`. It is shared plumbing ("both"), for the driver, not this branch.

### Minor

1. **Isaaru is off screen during the battle on the phone.** At 390x844 only the edge of a sleeve shows at
   the right edge, at every menu. The builder's own `link1-yuna-menu-390x844.jpg` shows the same. It is
   not disclosed.
2. **At 2000x1012 the advisor's "moves" panel covers Grothia's head.** The builder disclosed this overlap
   only at 1280x720. It is the toggleable advisor overlay.
3. **The pre narration (lines 1 to 5) plays over the lit chamber plate, not "over black".** The draft
   and B15 a say "over black". On the phone, the cutscene controls hint also covers the lower half of the
   narration plate. That hint is shared cutscene UI.
4. **B14 a: Auron, Lulu and Kimahri "stand in the scene", but no figure is staged for them or for Yuna.**
   They appear only as portraits, in both the pre and the post scene. Isaaru's missing kneel is
   disclosed; this is not.
5. **Bible §2.1 "Unanswered questions: at least one per FFX encounter" is not met.** Lulu's question
   (line 14) is answered. The opening interlude comes before the emotional high, which §2.1 says not to
   do. That is B15 a as picked, so it is only noted.
6. **The header of `src/data/chapter-isaaru.ts` still describes the scene and story as placeholders**
   ("nothing is in `src/story`"). The ship layer overrides both. This is the engine track's file.
7. **`src/battle/common/types.ts` (over 400 lines) grew by 39 lines.** These are additive contract fields
   with their `CONTRACT-CHANGES` entry, the same precedent as the earlier chapters. It is recorded here
   only because the house rule says files over 400 must not grow.
8. **At the first menu, Summon sits below the visible list (the ▼) at every desktop size**, even though
   only aeons can fight in this contest. The cursor rests on Special, and the guide points at Grand
   Summon, which is visible in Overdrive.
9. **The branch is 2 commits behind `main`** (NOW and the Chapter XII frames). The merge is clean.

Still owed before listing, as the builder disclosed:
- the listing itself;
- Kimahri's "count reads 1" line and Lulu's "last aeon" line;
- the "Still Water" cue;
- Isaaru's kneel;
- Bailey's verdict on the staging;
- the two player-side options (Shiva's rows, Ixion's rows), which need Bailey's yes.

Frames and raw results are in scratch and are not committed:

- `D:/Tools/pyrefly-scratch/chapters/isaaru-check/shots-dev/`: dev server, all four sizes.
- `D:/Tools/pyrefly-scratch/chapters/isaaru-check/shots/`: the preview repeats; `narr-*` (the black
  narration here and in Seymour Flux); `ph-first-*` (the first frame of each actor); `loss-*`; `win-*`.
- `res-*.json` and `dev-results/`: the raw results.
- `check.mjs`, `seeds.mts`, `ph.mjs` and `narr.mjs`: the scripts.

## Repair cycle 1 (ISA-CHK-M1 fixed; game case both, shared plumbing)

- **Fix:** a cutscene's `fade('black')` (and `'white'`, which has always drawn black on this screen) now
  goes to a veil on the cutscene stage (`CutsceneStage.veil`, `.cutscene__veil`, z-index 5), inside the
  shake layer just before the dialogue box (z-index 6), instead of `App.fade('opaque')`, whose `#fade`
  layer covers all of `#ui`. The chapter eyebrow goes under the veil too. `fade('clear')` clears both the
  veil and `#fade`, as before. A scene that ends under the veil sets `#fade` opaque at once, so the next
  screen fades in from black exactly as it did. `CutsceneScreen.ts` stays at 410 lines. The battle's
  mid-fight beats (`BattleScreenCutscenes`) were never affected and are untouched.
- **Scenes this changes (measured and pinned in `tests/unit/cutscene-veil.test.ts`):** every line after a
  fade used to be a blank black frame: I Seymour Flux post (4 lines), II Yunalesca (4), III Braska's Final
  Aeon (3), IV Bahamut (2), V Vegnagun and Shuyin (3), VI Leblanc (2), VII Seymour and Anima (4), VIII
  Evrae (3), XIV Isaaru (2). All are post scenes; nothing else changes.
- **Proof, real Enter presses, headless, dev server with HMR off (port 5760, stopped):** Chapter XIV seed 2
  at 1600x900 and seed 1 at 390x844, Chapter I seed 1 at 1600x900. For every line after the fade the box
  is the topmost element at its text (`elementFromPoint`), the veil is on at opacity 1 and `#fade` is clear;
  after the Isaaru scene the results screen comes up normally, and after the Flux epilogue `#fade` is
  opaque, as before. Frames: `repair1-post-narration-1600x900.jpg`, `repair1-post-narration-390x844.jpg`,
  `repair1-flux-epilogue-1600x900.jpg` here; the rest in `D:/Tools/pyrefly-scratch/chapters/isaaru-repair1/`.
- **Checks:** tsc clean; vitest 415 files passed, 3 skipped; orphans 24 (unchanged); approved and
  judge-locked hashes 225 ok, 0 mismatched.
- **Still for the driver:** on the phone the controls hint still covers the lower half of the narration
  plate (minor 3, shared hint, now visible over black instead of hidden). `fade('white')` still draws
  black in a cutscene, as it always has; the DSL says white is for the Sending (Chapter V uses it twice).

## Re-check after repair 1 (independent; nothing edited but this section)

**Verdict: ISA-CHK-M1 is fixed. 0 blockers, 0 majors open. The 9 minors are unchanged. Still unlisted.**

- **Code read (4bcb6de6):** `fadeScreen` in `CutsceneScreen.ts` sends `'clear'` to both `#fade` and the veil
  and everything else to `CutsceneStage.veil(true, ms)`. The veil is the last child of `.cutscene__shake`
  before the dialogue box. Its z-index is 5; the box's is 6 (`dialogue-box.css`). The backdrop is the
  root's own background and the scrim is `.cutscene::after`, both under it. Figures and fx have no
  z-index, so they are under it too. During a shake, the transform makes the shake layer its own stacking
  context, and the box still sits over the veil inside it. The eyebrow (z 7) is hidden by `.is-veiled`.
  The hint (z 8) and the flash (z 9) stay above it, which is expected. When a scene ends veiled, `#fade`
  goes opaque at 0 ms, so the next screen gets the same black hand-off as before. Mid-battle beats use
  their own ports and are unchanged. `CutsceneScreen.ts` is still 410 lines; `CutsceneStage.ts` is 260.
- **Re-run here:** `tsc --noEmit` is clean. `cutscene-veil` and `cutscene-stage` pass (18 tests). The
  full vitest run passes: 415 files, 3 skipped, 7721 tests (log at
  `D:/Tools/pyrefly-scratch/chapters/isaaru-recheck1-vitest.txt`).
- **Frames and raw results:** the three `repair1-*.jpg` frames show the lines on black, at 1600x900 and
  390x844 for Isaaru and at 1600x900 for Chapter I ("Nobody talked."). In `res-narr-*.json`, every line
  after the fade has `topAtText: dbox__text`, the veil at opacity 1 and `#fade` clear. The Isaaru results
  screen follows. Port 5760 is no longer listening. I did not re-drive a browser, because the repair's
  headless real-key results were enough together with the code read.
- **Still open, as disclosed:** on the phone the controls hint covers the lower part of the narration box
  (minor 3; the text line itself stays clear in the 390x844 frame). `fade('white')` still draws black,
  unchanged; that needs a decision from the driver and Bailey. The branch-behind-main minor may have
  grown.
