# Chapter X ship layer: independent check

**Game case: FFX only.** Seymour Natus on the Highbridge of Bevelle, research §0.3. FFX-2 has no Natus,
no Mortibody and no Highbridge boss. Shared plumbing: the `'returns'` departure kind, the dossier face
box mechanism and the guide lookup. They apply to both games, but only `mortibody` and
`ch10-seymour-natus` use them.

- **Checked:** commit `68f73e57` on branch `chapter-natus-ship-0925`, in the worktree `D:/pyrefly-ch-natus-ship`.
- **When:** 2026-09-25.
- **How:** the checker built none of it and edited nothing under `src/` or `tests/`.
- **Verdict:** 0 blockers, 1 major (pre-existing, not introduced here, and not in this chapter), 9 minors.
  The chapter can stay on this branch **unlisted**, as the brief says.

## Mechanical checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| Full vitest (`--testTimeout=60000`) | 399/399 files. 7,497 passed, 5 skipped, 1 todo. Exit 0, 102 s. |
| `node tools/orphans.mjs` | 736 modules, 24 orphaned. `main` also has 24. |
| Natus benches, inside the full suite | Shipped tactic 116/200 with 0 Desperados. Haste all three 153/200 with 2.12 Desperados a battle. Haste two (strategy 7) 169/200. Plan bench: intended 116, wrong 0, provoke-reflect 200, poison-wait 0. These are the builder's numbers. |
| Rewards on the results screen | AP 6,300 and Gil 3,500. Both match research §1 rows 66 and 67 (`[decompiled]` + wiki + GameFAQs). Natus's HP of 36,000 on retry matches row 512. |
| House style | No file over 400 lines grew. `BattlePresenterEvents.ts` stays at 421. `scenes/index.ts` went from 399 to 398. `BattlePresenterDepartures.ts` went from 376 to 386. Every new file is 252 lines or fewer. |
| Contracts | No file listed in `docs/CONTRACTS.md` changed. |
| Merge with current `main` (`5860a134`, 21 commits ahead) | Clean. On a temporary detached worktree of that merge (since removed): `tsc` exit 0; vitest 406 files passed and 2 skipped, 7,592 tests passed; orphans 24. The Natus bench numbers did not change. |
| Locked art: `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` | On main: 224 ok (176 approved and 48 judge-locked), 0 mismatched, 0 missing. On the worktree, with main's judge-locked list: 272 ok, 0 mismatched, 0 missing. No art was written. `public/art` in the worktree is a junction to main's copy. |
| Worktree after the whole check | Only the builder's untracked `.natus-vite-tmp.config.mjs` remains, and it was left alone. |

## In the browser: headless GPU Chromium, fresh load for each run

- **Server:** a private Vite on port 5735, with HMR and the watcher off and its own cache dir.
- **Reaching the chapter:** the debug API was used only to open the unlisted chapter with
  `gotoChapter('seymour-natus', { skipPrep: false, skipCutscenes: false, skipResults: false, seed: 1 })`.
  Every step after that was a real key.
- **Page health:** no page errors, no console errors, no HTTP errors and no `[painted] … placeholder`
  warnings in any run.
- **Decoding:** every image the page loaded decoded in the page with `createImageBitmap`.
- **No placeholder figures:** checked on every fighter on the stage, by the current pose and by every
  loaded pose (`PaintedActor.isPlaceholder` and each pose's `placeholder` flag). None was a placeholder:
  at the first menu, after the action, in 49 samples across the 97-turn win, and in about 450 samples
  across the Mortibody probe.
- **The scene:** `scenes()` reports `bevelle-highbridge` as real, not a placeholder.

### The walk at four sizes

The walk goes from party prep, through Enter, to the pre scene. The pre scene is advanced line by line
with Enter until the first command menu. Then comes one real action. The first Enter clears the
first-time card. The second Enter plays the menu's first command, Talk, which is also the guide's pick.

| Size | Prep | Pre scene | First menu | Real action | Images, all decoded |
|---|---|---|---|---|---|
| 1600x900 | ok | 9 interlude lines, then lines 10 to 24 in order | 7.8 s, Tidus | `tidus` Trigger Talk | 73 |
| 1280x720 | ok | same | 8.0 s | same | 70 |
| 2000x1012 | ok | same | 8.0 s | same | 70 |
| 390x844 (touch) | ok | same | 7.5 s | same | 73 |

- **Speakers:** Seymour speaks lines 14 to 18 with `portraits/seymour-macalania.png`, as B12 b wants
  before he transforms. He has no line after the transformation. The Natus idle
  (`characters/seymour-natus/idle.png`) stands on the cutscene stage from the transformation onwards.
- **Pause, CHAPTER tab:** at 1600x900 it was opened with Esc and a click. At 390x844 it was opened with
  a tap. At both sizes the plate is `ch10-seymour-natus` from the `.2x.webp`: 1982x1132 on desktop and
  1477x844 on the phone. The tab strip is `member:tidus, member:yuna, member:kimahri, chapter, guide,
  options, controls, music`. The objectives are "Soften the stone", "Survive Flare" and "Defeat Seymour
  Natus". The quote is line 19, Kimahri's.

### Win, loss and retry

- **WIN, live seed 2 (labelled).** Under the live `auto: 'intended'`, seeds 1 to 3 give: 1 a loss in 57
  turns, 2 a win in 97 turns, 3 a win in 100 turns. That is in line with the bench's 58 %.
  - The run went from a fresh load, through the pre scene on Enter, into the battle at skip speed.
  - The post scene played lines 25 to 29 on Enter.
  - The results screen showed Victory, New Best, AP 6,300 x4 and Gil 3,500.
  - Enter confirmed it, and the flow resolved `{ outcome: 'victory', turns: 97 }`.
- **LOSS and RETRY, seed 1** (`auto: 'attack'`, skip speed).
  - The fight ended in defeat after 11 turns.
  - The defeat panel read "Defeat · Turns 11 · Attempts 1 · Never cleared", with RETRY and CHAPTER
    SELECT. The cursor started on RETRY.
  - A real Enter chose RETRY. A new battle opened on seed 1001, with Natus at 36,000 HP and the party
    at full HP (2420 / 1650 / 2310).
- **Mortibody returns (the builder's deep-class fix), checked independently in the browser.**
  - The line was the intended one with its attacks aimed at Mortibody, seed 1, fast speed. That is the
    same line as the builder's unit test, but it ran on the real stage.
  - There were 7 KOs, each answered by a `heal` with cause `mortibsorption`.
  - After every KO, the figure stayed on the stage and visible. It dissolved to 1, then was reset to
    alpha 0 and faded back to about 1.0.
  - It was never unstaged. No sample showed it gone while it had HP, apart from the fade-in window.
  - Neither the shipped intended line nor a plain attack line ever KOs Mortibody (0 KOs on seeds 1 to
    4), so most players will not see this path.
- **Chapter select** (title, then Enter). It shows 10 tiles: Seymour Flux, Lady Yunalesca, Braska's
  Final Aeon, Evrae, Yojimbo, Seymour and Anima, Bahamut, Vegnagun, Leblanc and Trema.
  - Seymour and Anima (VII) is "coming" and not playable, so VII stays locked.
  - Natus is not on the screen. No text on it says Natus or Highbridge.
  - Every file that feeds chapter select is the same as on `main`: `encounters.ts`,
    `chapters-unlisted.ts`, `ChapterSelectScreen.ts` and the frontend. The only change is
    `chapter-meta.ts`, which imports `NATUS_META` and puts it in `UNLISTED_CHAPTER_META`. So every other
    chapter is unchanged there.

### Production build

- **Build:** `vite build` into a scratch out dir, with base `/pyrefly-reprise/`. It did not go to the
  shared `dist/`. `prebuild` was skipped, so main's `public/art/manifest.json` was not rewritten through
  the junction.
  - The shipped art manifest lists every Natus file: `mortibody` idle, `seymour-natus` cast and idle
    plus the portrait, `seymour-natus-ring` idle, the `bevelle-highbridge` backdrop and
    `ch10-seymour-natus` at 1x and 2x.
  - That matters because a file the manifest does not list falls back to a placeholder without a
    warning.
- **Decoding:** `buildManifest(dir, { decode: true })` decoded all 1,070 shipped files with 0 problems.
  All eight Natus images decoded "ok".
- **Serving:** `vite preview` on port 5736. `verifyLive(..., { full: true })` checked 1,070 files and
  found 0 mismatched, 0 missing and 0 of the wrong type. Its only UNVERIFIED note is that a local build
  publishes no `artifact-manifest.json`, which is expected.
- **Walks and win:** the 1600x900 and 390x844 walks and the seed-2 WIN were repeated on the preview.
  - The walks covered prep, the pre scene, the menu, a real Talk and the pause plate.
  - The WIN went through the post scene and results, to 97 turns and victory.
  - The results were the same as on the dev server: 73, 73 and 84 images, all decoded, no placeholder
    and no errors.
- **Servers:** both were stopped by their port's PID. Nothing is listening on 5720 to 5739.

## The story against the writing bible and Bailey's picks

- **Unchanged lines.** The script plays the draft's lines 1 to 29 unchanged, which the builder's
  line-for-line test pins. Every line is under the 60-character cap; the longest is 53. No line has an
  ellipsis.
- **Seymour (§1.9).** He says "Lady Yuna". Death is framed as kindness ("I gave him rest. It was a
  kindness.", "the only mercy Spira has left"). He uses no contractions and no slang, and he does not
  reuse the iconic battle line.
- **Kimahri (§1.7).** He refers to himself in the third person ("Yuna goes. Kimahri stays.") and speaks
  after a 1.8 s silence, never into one.
- **Rikku and Wakka.** Rikku says "Yunie!" and Wakka says "ya?", both in voice.
- **Narration (§1.2).** Tidus speaks in the past tense. The post interlude has a sensory detail ("The
  fire kept going out.") and one admission ("I don't think it helped.").
- **Grim tier.** There are no victory quips, as §5.4 requires.
- **Bailey's picks as seen in the build:**
  - B2 a: Tidus, Yuna, Kimahri open.
  - B11 a: the wedding is told in narration.
  - B12 b: the Macalania face before the transformation, with no line after it.
  - B15: stand-in cue `boss-seymour-macalania`.
  - B8/B16: unlisted.
  - D-156: hero plate B on the CHAPTER tab.
  - D-097: portrait A, used in the HUD only, because Natus has no dialogue line.
  - The B9 callouts are held, as disclosed.

## Findings

**Blockers: 0.**

**Major (pre-existing, not introduced by this candidate, not a regression, outside Chapter X).**

- **M1. Chapter I's Mortiorchis still vanishes after its first KO and fights on unseen.** The builder
  proved this and pins it in `natus-ship-content.test.ts` ("Chapter I did not move"), which passed in
  this run. It is live in a listed chapter. The fix the builder names is the one table line
  `mortiorchis: 'returns'`. That is the driver's call and needs a focused check of Chapter I.

**Minors.**

1. **At the first menu, the first-time coaching card covers Natus and Mortibody completely at
   1280x720.** On the phone it covers the top third. One Enter clears it. This is shared coaching
   behaviour, as in Chapter XII. Frames: `menu-1280x720`, `menu-390x844`.
2. **Tidus's sword tip reaches the right end of the ITEMS/FLEE rows at 2000x1012.** This is shared, as
   in Chapter XII.
3. **FLEE is still offered in a fight that cannot be escaped.** Research §4.5 says "the party cannot
   escape". FLEE is dimmed on desktop and shown as a dark tile on the phone. The builder disclosed it.
   It is HUD-wide.
4. **In the cutscene, Natus stands without his ring.** The O-1 A ring layer is on the battle stage
   only. There is also no Seymour figure before the transformation, no party figures, and Kinoc's body
   is not staged. This matches the house pattern, but the handoff does not say it.
5. **Bible §2.1 "Unanswered questions: at least one per FFX encounter" is not met.** Tidus's one
   question (line 17) is answered by line 18.
6. **The narration runs 9 lines back to back over black** (5, then a 1.2 s beat, then 4). The bible
   says 2 to 5 lines an interlude, placed after an emotional high and never explaining what happened.
   These lines open the chapter and retell the wedding. That is B11 = a as picked and the draft's open
   question, built as drafted, so it is only noted.
7. **On the phone, the CHAPTER tab's party column shows only Tidus and Yuna's weapon, and "Boss HP 100…"
   is cut off.** Kimahri is not reached. This is probably the shared phone pause layout; it was not
   compared against the other chapters here.
8. **The branch is 21 commits behind `main` (`5860a134`).** The merge is clean and its suite is green
   (see above). Merge before listing.
9. **Integration: a dry-run merge with `chapter-omnis-ship-0925` conflicts in 10 files.** All of them
   are one-line registry additions at the same spot:
   - `chapter-meta.ts` `UNLISTED_CHAPTER_META`
   - `cutsceneFigures.ts`
   - `guides/index.ts`
   - `tactics/index.ts`
   - `scenes/index.ts`
   - `BattlePresenterDepartures.ts`
   - four test files

   The second chapter to land needs a hand merge that keeps both entries. `scenes/index.ts` sits at 398
   and 399 lines on the two branches, so the merged file must stay under 400.

**For Bailey (measured, not a defect):** the Haste-two line (research strategy 7) wins 169/200 and the
shipped no-Haste line wins 116/200 (the builder's table, reproduced on the merge). Switching the tactic
needs his yes.

Frames and raw results are in scratch and are not committed:

- `D:/Tools/pyrefly-scratch/chapters/natus-check/shots-dev/`: dev server, all four sizes, the win and the loss.
- `D:/Tools/pyrefly-scratch/chapters/natus-check/shots/`: the preview repeats, `select-1600x900`, and the probe frames.
- `res-*.json`, `dev-results/`, `res-probe-return.json`: the raw results.
- `check.mjs` and `probe-return.mjs`: the scripts.
- `tsc.txt`, `vitest.txt`, `orphans.txt`, `merged-*.txt`, `decode.txt` and `verify.txt`: the logs.
