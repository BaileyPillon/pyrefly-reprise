# r43-delivery: three delivery improvements from round 25 (PR-0373, PR-0396, PR-0405)

Branch `r43-delivery`, built on origin/main 2868c195 (the code of the live a061e9dc; nothing in `src/`, `public/` or `tools/` differs).
Approved by Bailey on 2026-10-12 at about 17:50 EDT ("I'll go with all of your recommendations", the driver's list item 6,
decision items 59d, 59e, 59f). **Game case for all three: both (shared plumbing).** Not deployed; nothing here is live.
One commit per item. The deploy-time checks that only a deploy can answer are at the end of this file.

| Item | Issue | What it changes |
|---|---|---|
| 1 | PR-0373 (audio, polish) | The confirmed chapter's scene, boss and victory music is fetched and decoded behind party prep, and kept until played |
| 2 | PR-0396 (delivery, suggestion) | Content-hashed bundles get a year-long `immutable` cache header on the Cloudflare deploy; nothing else does |
| 3 | PR-0405 (delivery, suggestion) | The board's art that no screen needs yet waits for the player's first key or pointer press |

## 1. PR-0373: warm the chapter's music at the confirm

**Problem (round 25).** At about the fourth line of a chapter's opening scene the scene cue was not playing in 10 of 30 non-Ch-I runs
(round 23: 5 of 55): nothing asked for the 3 MB cue until the scene opened, so its fetch and decode stood in front of the first line.

**Change.**
- `BattleScreenFlow.runChapter` now starts `musicChapter(id, ...)` (`src/app/chapterMusicWarm.ts`) as the first thing a run does, beside
  `sfxChapter` and `preloadBattle`. The board hands the flow the confirmed card, the flow starts the run in the same task, so this is the
  moment of the confirm. Every route into a run (the board, the doors, `__pyrefly.gotoChapter`, a restart) goes through `runChapter`.
- `chapterWarmCues(chapter)` is the list: **the scene's bed (`Chapter.music.scene`), the first formation's theme (`cueForGroup(..., 'first')`,
  the rule the fight itself uses), the victory sting (`Chapter.music.victory`)**, in that order, without duplicates or silences. Chapter IV
  has no victory cue, so it warms two. A fight in several parts warms the first theme only (Yu Yevon, Shuyin are fetched when their part opens).
- `AudioManager.warmMusic(names)` fetches and decodes them **one at a time in that order** after the manifest is read, so the scene cue is
  never slowed by the cues behind it. It plays nothing, queues nothing, is never awaited, never throws, and does nothing while the audio is
  still locked or in a synth-only build. A cue with no rendered file in the manifest is left alone (synthesising early is a render, not a
  fetch). A play that arrives while its warm is in flight joins it (one fetch).
- **Why a hold (`src/audio/MusicWarm.ts`).** `playMusic` keeps the cue it starts and drops every other decoded buffer (35 MB each).
  Without a hold the scene cue's own start threw away the boss and victory cues fetched for it and the battle fetched the boss cue again.
  A warm now leaves the cues it asked for, until each is played, the run ends (`musicChapter`'s release, run in `runChapter`'s `finally`) or a
  newer run replaces them. `playMusic` passes the owed, decoded cues to the same `evictionPlan`, so the cap of three buffers after a play is
  unchanged and the caller's own `upcoming` list still comes first. `audio.debug().music.held` lists what is owed.
- **Memory.** At the confirm the board's cue is still playing, so up to four decoded cues (about 140 MB) are held until the scene cue starts;
  after that three at most, as before.

**Only that chapter's cues, only its own game's.** The list is built from the chapter's own record. `tests/unit/chapter-music-warm.test.ts`
pins it for all 18 listed chapters, the unlisted ones and the hidden experiments against the record, and against the lists of FFX-only and
FFX-2-only cues that `flow-encounter-chain.test.ts` uses: an FFX chapter warms no FFX-2 cue and the reverse.

**Tests.** `tests/unit/music-warm.test.ts` (14: the hold; order and one-at-a-time fetching; returns at once; no rendered file; locked and
synth-only; joining an in-flight warm; a newer run; the cues surviving the scene, fight and results plays with no fetch after the confirm;
the end of a run; an older run cannot end a newer hold; the cap of three), `tests/unit/chapter-music-warm.test.ts` (11, including the real
`GameFlow` calling the warm before prep, the scene and the fight and releasing at the end, FFX and FFX-2). Mutation check: with the hold
disabled three of the fourteen fail.

## 2. PR-0396: the year-long cache for content-hashed files

**Problem (round 25).** `curl -I https://echoesofspira.com/assets/index-CvOwYJX5.js` read `public, max-age=0, must-revalidate`: every
return visit asked the server about every file, including bundles whose names change with their content.

**What was already built (release 39, 44dc6dca) and what was missing.** The upload gate already accepted exactly one `_headers`
(`checkHeadersFile`, `VETTED_HEADERS` in `tools/deploy-host.mjs`: the pattern `/assets/*` with `Cache-Control: public, max-age=31536000,
immutable`, nothing else), listed it in the artifact and skipped it in the live byte check (`HOST_READ_FILES` in
`tools/artifact-manifest.mjs`). The file itself was never added ("here is the proposed file for the driver to review", r39-int.md), so
the live site never had the rule. Cloudflare's Workers static assets have no header setting in the wrangler config (`assets` takes a
directory, `html_handling`, `not_found_handling`, `run_worker_first`); `_headers` in the assets directory is the supported way, and the
Worker stays assets-only (no script, no per-request cost).

**Change.**
- `public/_headers` (new): the vetted rule, with comments. `.gitattributes` pins it to LF, so its bytes (which the artifact hashes) do not
  depend on the machine that checks it out.
- `tools/cache-class.mjs` (+ `.d.mts`, new): the classification. A file is **content-hashed** only when it sits under `assets/` **and**
  is named `<name>-<8 base64url characters>.<ext>`, the way Vite names what it emits. Both conditions are needed: the live art has 23
  names that end in a dash and eight characters (`art/backdrops/road-to-the-farplane.webp`, `via-infinito`, `od-slice-and-dice`) and
  must not be cached for a year. `classifyCache(path)` gives `immutable` or `revalidate` (the host's default: `index.html`, the art, audio,
  fonts, depth maps, the artifact manifest); `cacheFromHeaders` reads a `_headers` text the way Cloudflare does (`*` is a splat that
  matches slashes too); `unhashedUnderRule` lists what the rule would cache that is not hashed.
- `prepareCloudflareUpload` (`tools/deploy-cloudflare.mjs`): a shipped `_headers` must still be the vetted one, and now every file its rule
  matches must be content-hashed, or the deploy stops ("would cache 1 file(s) for a year whose names carry no content hash, e.g.
  assets/logo.svg"). So a `public/assets/logo.svg` can never be pinned for a year to a visitor.

**How the byte-for-byte check is unaffected** (read before the change, `tools/artifact-manifest.mjs` `verifyLive`): it fetches each
selected file from the live address with a cache-busting `?v=<time>` and compares the sha256 with the artifact manifest; headers do not
change a file's bytes, and a fetch from Node has no cache. `_headers` is listed and hashed in the artifact like any file, never counted
as an uploaded file, and never downloaded (`HOST_READ_FILES`; no address serves it). The hashed files cannot be stale under `immutable`:
a new build changes their names, and `index.html`, which names them, keeps the default. `verifyLive` already reports what the first
hashed bundle was served with (`assetCacheControl`), so the next live check records whether the rule applied.

**Proof without a deploy (the real Cloudflare asset runtime, locally).** `wrangler dev` 4.147.0 (the pinned one, workerd, no login, state
and logs on D:) on a probe directory holding this `_headers`: it printed "Parsed 1 valid header rule", and
`/` and `/art/backdrops/road-to-the-farplane.webp` came back `public, max-age=0, must-revalidate`; `/assets/index-Chs9J3OY.js` came back
`public, max-age=31536000, immutable`, also with a `?v=` query; `/_headers` was 404; with CRLF line endings the result was the same. The one
unhashed file placed under `assets/` (`logo.svg`) was cached for a year too: that is exactly the case the new gate check stops.
The deploy itself is the proof that counts: the checks are below.

**Tests.** `tests/unit/cache-class.test.ts` (43): the classification table (the four live hashed files; 24 real plain paths including the
look-alike art names; the path forms; folder and shape both needed), the splat matching, `public/_headers` being the vetted file and making
exactly the classifier's immutable files immutable, and a **real Vite build** (a page with a script, a style sheet, a lazy chunk, a worker
and an imported image) whose five emitted files are all under `assets/`, all hashed, and all matched by the shipped rule, with
`index.html` the one file outside. `tests/unit/deploy-headers.test.ts` (+3, fixture hash lengthened to a real 8 characters): the gate
refuses an unhashed file under the rule, passes the live names and the look-alike art, and does not care without a `_headers`.
