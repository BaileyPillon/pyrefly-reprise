# Chapter XII ship layer: independent check

**Game case: FFX only.** Seymour Omnis inside Sin, research §0.3. Shared plumbing is the HUD tap, the
speaker id and the departure entry; these apply to both games but do nothing outside Chapter XII.

- **Checked:** commit `b14f9520` on branch `chapter-omnis-ship-0925`, in the worktree `D:/pyrefly-ch-omnis-ship`.
- **When:** 2026-09-25.
- **How:** the checker edited nothing under `src/` or `tests/`.
- **Verdict:** 0 blockers, 0 majors, 9 minors. The chapter can stay on this branch **unlisted**, as the brief says.
- **Still owed before listing:** the items in the builder's handoff, and B8.

## Mechanical checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| Full vitest (`--testTimeout=60000`) | 396/396 files. 7,524 passed, 5 skipped, 1 todo. Exit 0, 93 s. |
| `node tools/orphans.mjs` | 746 modules, 24 orphaned. `main` also has 24 orphans. |
| The Omnis bench, inside the full suite | intended 127/200, wrong 0/200, no-ring 0/200. The tactic alone wins 127/200. These are the numbers in `275109aa`. |
| Boss numbers | The diff against `chapter-omnis-0925` touches only the callout hooks: 2 calls in the AI, +8 lines in the rules and the new `seymour-omnis-callouts.ts`. No stat, no ability and no RNG draw changed. |
| House style | No file over 400 lines grew: `dsl.ts` 600→600, `scenes/index.ts` 399→399. `seymour-omnis-rules.ts` went from 383 to 391, still under 400. Every new file is 269 lines or fewer. |
| Contracts | `SpeakerId` has an entry in `docs/CONTRACT-CHANGES.md` dated 2026-09-25. `ChapterId` was already recorded by the engine commit. |
| Merge with current `main` (`33cb273f`, 9 commits ahead) | A `git merge-tree` dry run is clean. |
| Locked art: `verify-approved.mjs` | Run on main: 224 ok, 0 mismatched, 0 missing. Run on the worktree (`ROOT=`): 202 ok, 0 mismatched, 0 missing. `public/art` in the worktree is a junction to main's copy. |
| Worktree after the whole check | `git status` is clean. |

## In the browser: headless GPU Chromium, fresh load each run

- **Server:** a private Vite on port 5763 with HMR and the watcher off, and its own cache dir.
- **Reaching the chapter:** the debug API was used only to open the unlisted chapter:
  `gotoChapter('seymour-omnis', { skipPrep: false, skipCutscenes: false, skipResults: false, seed: 1 })`.
  After that, every step was a real key.
- **Page health:** no page errors, no console errors and no HTTP errors in any run. Every image the page
  loaded decoded in the page with `createImageBitmap`.

### The walk at four sizes

The walk is: party prep, Enter, the pre scene advanced line by line with Enter, then the first command
menu. Then one real action: Enter clears the first-time card, and Enter again plays Attack, which lands
on Seymour Omnis.

| Size | Prep | Pre scene (9 lines, in order, as in the draft) | First menu | Real action | Images, all decoded |
|---|---|---|---|---|---|
| 1600x900 | ok | ok; Seymour speaks with `portraits/seymour-omnis.png` | 6.2 s after the battle opened, Tidus | `tidus` Attack → `seymour-omnis` | 71 |
| 1280x720 | ok | ok | 6.2 s | same | 68 |
| 2000x1012 | ok | ok | 6.2 s | same | 68 |
| 390x844 (touch) | ok | ok | 6.2 s | same | 71 |

**Pause, CHAPTER tab.** At 1600x900 the tab was opened with Esc and then a click. At 390x844 it was
opened with a tap. At both sizes the plate is `ch12-seymour-omnis`: the `.2x.webp` loaded, 1982x1132 on
desktop and 1477x844 on the phone. The tab also shows the objectives, the quote (line 9) and the three
snapshots. The tab strip is `member:tidus, member:yuna, member:auron, chapter, guide, options, controls,
music`.

### Win, loss and retry

- **WIN, seed 1** (labelled). With the live `auto: 'intended'`, the first three seeds give 1 = win in 208
  turns, 2 = loss, 3 = win in 188 turns. That matches the bench's 63.5 %.
  - The run went from a fresh load through the pre scene (Enter) and the battle at skip speed.
  - The post scene played all ten lines (10 to 17, with line 12 "Yes.") on Enter, with pyreflies
    rising.
  - Results showed Victory, AP 24,000 and the Lv. 3 Key Sphere. Enter confirmed it, and the flow
    resolved `{ outcome: 'victory', turns: 208 }`.
- **LOSS and RETRY, seed 1** (`auto: 'attack'`, skip speed).
  - The fight ended in defeat after 29 turns. The defeat panel appeared with RETRY / CHAPTER SELECT,
    and the cursor was on RETRY.
  - Real Enter chose RETRY, and a new battle opened: seed 1001, boss 80,000 HP, party at full HP.
  - Script triggers seen live in the first fight: `omnis-disc-lesson`, `omnis-first-glow`,
    `omnis-before-dispel`, `omnis-before-ultima`, `omnis-first-reset`, `omnis-before-ultima`.
    `turned` and `low` did not fire, as expected: this line turns no disc and never gets him below
    20,000.
- **Chapter select** (title, then Enter). There are 10 tiles: Seymour Flux, Lady Yunalesca, Braska's
  Final Aeon, Evrae, Yojimbo, Seymour and Anima ("coming"), Bahamut, Vegnagun, Leblanc and Trema.
  - Omnis is not on the screen, and no text on it mentions Omnis.
  - Every file that feeds chapter select is the same as on `main`: `CHAPTERS`, `frontend/*` and
    `ChapterSelectScreen`. The only difference is the `UNLISTED_*` additions and one comment and type
    line in `encounters.ts`. So the other chapters are unchanged there.

### Production build

- **Build:** `vite build` into a scratch out dir, never the shared `dist/`, with base `/pyrefly-reprise/`.
  `prebuild` was skipped so that main's `public/art/manifest.json` was not rewritten through the
  junction.
- **Decoding:** `buildManifest(dir, { decode: true })` decoded all 1,070 shipped files with no problem.
  All eight Omnis images decoded "ok": the plate PNG, the plate `.2x.webp`, the portrait, the idle,
  the cast, the disc, the facing layer and the backdrop.
- **Serving:** `vite preview` on port 5764. `verifyLive(..., { full: true })` checked 1,070 files: 0
  mismatched, 0 missing, 0 wrong type. Its only "UNVERIFIED" note is that a local build publishes no
  `artifact-manifest.json`, which is expected.
- **Walk and win:** the 1600x900 walk (prep, the 9 pre lines, menu, a real Attack, the pause plate) and
  the seed-1 WIN through the post scene and results were repeated on the preview. They gave the same
  results: 71 and 74 images, all decoded, no errors.
- **Servers:** both were stopped by their port's PID. Ports 5763 and 5764 are free.

## The story against the writing bible and Bailey's picks

- **Unchanged lines.** The lines match `docs/plans/omnis-story-draft.md` 1 to 17 and the callout table
  word for word. The first choices are kept (line 1 alone, line 12 "Yes.", line 15 the bare goodbye).
- **Tidus variant.** The one addition is Tidus's variant of the first-disc line. The script and the
  draft header both say so.
- **Line length.** Every line is under the §2.1 cap of 60 characters; the longest is 55. No line has more
  than one ellipsis.
- **Seymour's voice (§1.9).** He says "Lady Yuna" and "son of Jecht". Death is framed as rest and a gift
  ("Rest now", "Pain is a gift"). There is no slang, and the iconic battle line is not reused.
- **The climax (§2.1).** The sending understates, then plays the one "Yes." beat, then cuts within two
  lines.
- **Grim tier.** The chapter is grim tier, like E1, so it has no victory quips (§5.4).
- **Bailey's picks as seen in the build:**
  - B2 a: Tidus, Yuna, Auron.
  - B3 a: no Anima line.
  - B8: unlisted.
  - B15: callouts in.
  - B16 a: one narration line, no airship fight.
  - B17 c: portrait A, byte-locked.
  - B18: stand-ins, disclosed.
  - B21 a: the Garden plate.
  - B22 a: the CTB list shows no disc tiles.
  - Hero plate A: on the CHAPTER tab.

## Findings (all minor)

1. **Tidus's sword still touches the command stack at every desktop size**, not only at 1280x720. The
   tip meets the right end of FLEE or SWITCH at 1280x720, at 1600x900 on Auron's shorter 4-row stack, and
   at 2000x1012. Frames: `menu-*`, `after-action-1600x900`.
2. **At the first menu, the first-time coaching card covers the upper-left disc.** On the phone it
   covers most of Omnis. It goes away on the first Enter. It is shared coaching behaviour, not this
   chapter's code.
3. **No discs in the cutscenes.** The pre scene's beat ("four great discs stand at the top… they begin
   to turn") and the post scene's "the discs stop" are not staged: only Omnis stands there. The handoff
   does not say this.
4. **Yuna is not on stage for the sending.** `fx('sending-dance', 'yuna')` plays with no Yuna figure. The
   Kimahri "looks away" beat also has no figure. His missing kneel is disclosed; these two are not.
5. **Bible §2.1 "Unanswered questions: at least one per FFX encounter" is not met.** Tidus's one
   question (line 3) is answered.
6. **Bible §2.1 says the narration interlude is placed after an emotional high, never before.** Line 1
   opens the chapter. This is B16 = a as picked, so it is only noted.
7. **E12 is still only a proposed tag.** It is not registered in `research/writing-bible.md`. E8 to E11
   are not registered either.
8. **The disc HUD strip (O-2 B), the intent line (O-4 C), the live red glow (O-8) and B18's own cue are
   not built.** The builder disclosed all four. They are owed before listing, together with B8.
9. **The branch is 9 commits behind `main`.** Among them is `33cb273f`, the art index no-cache fix. The
   merge is clean; merge before listing.

Frames and raw results are in scratch and are not committed:

- `D:/Tools/pyrefly-scratch/omnis-ship/check/shots-dev/`: dev server, all four sizes.
- `D:/Tools/pyrefly-scratch/omnis-ship/check/shots/`: the preview repeats of the 1600x900 walk and the WIN, plus `select-1600x900`, `loss-defeat-seed1` and `loss-retry-battle-seed1`.
- `res-*.json` and `dev-results/`: the raw results.
- `check.mjs`: the script.
