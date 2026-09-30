# sfx-b: SFX balance b becomes the default (D-293)

Branch `sfx-b` (from `origin/main` 1a6fd3cc), worktree `D:/pyrefly-r29-text`. Not pushed, not merged,
not deployed. **Save-data class**: the deploy that ships it needs a DEEP review of the production
candidate first (AGENTS.md "Release"; `node tools/critic-plan.mjs` says DEEP before deploy).
Preflight: `docs/plans/sfx-b-review.md`.

## The words

Bailey, 2026-09-29 ~23:00 EDT, verbatim: "yes, all your recommendations", answering the driver's
five recommendations; number 2 was SFX balance b (effects +6 dB against the D-210 default, so a hit
lands level with the music's peaks) as the default. Decision D-293 (refines D-210). The friend's
playtest behind it: "no sound effects on attacks so doesn't feel like I did much"
(`docs/handoff/fb-0929-sfx.md`).

**Inferred, not named** (D-293's `where` marks it "ask before building one"): an existing save whose
SFX level is D-210's untouched 0.35 moves to the new default; a level the player set is kept. It is
built, as the brief asked, in its own module so it comes out with one line (the `migrateSfxBalance`
call in `SaveData.migrate`). Question for Bailey below.

## What changed

- **New profiles: SFX 0.70** (`defaultSettings().sfxVolume`, was 0.35). 0.70 = 0.35 x 2 = +6.02 dB, the
  same bus gain `?sfxmix=b` gave. The +6 dB lives in the saved volume, not in a bus trim, so a volume
  the player set is never doubled and the SOUND EFFECTS row shows what plays (70 %). The slider's
  top (100 %) is still bus 1.0.
- **Existing saves, once** (`src/app/saveSfxBalance.ts`, new): a blob without the new marker
  `settings.sfxBalanceMigrated` was written before D-293. Its `sfxVolume` exactly 0.35 -> 0.70; missing or
  not finite -> 0.9 (D-210's rule for saves older than the setting, unchanged); anything else is the
  player's and is kept exactly. Then the marker is set. A blob with the marker is never moved again, so
  a player who picks 0.35 after the upgrade keeps it (the slider steps 0.1 and rounds, so 0.45 -> 0.35
  lands on exactly 0.35; without the marker that player would be moved back on every load). New
  profiles carry the marker from the start. Precedent: `ffx2AtbMigrated` (D-029).
- **`SAVE_VERSION` unchanged (1).** The marker decides, as `ffx2AtbMigrated` and `seenCoach` do; a
  version bump adds nothing, and an older build (a rollback) reading a migrated blob just ignores the
  extra field and plays the stored 0.70.
- **`?sfxmix=` kept for comparison, re-based** (`src/audio/sfxMix.ts`): `a` = trim 0.5 (-6.02 dB: at
  the default slider exactly D-210's 0.35), `b` or no parameter = trim 1 (shipped), `c` = trim 1.581
  (at the default slider bus 1.107, what the old `c` gave). Never saved. `D210_SFX_VOLUME` and
  `SFX_DEFAULT_VOLUME` are the one source of both numbers; `AudioManager`'s pre-save default reads the
  latter.
- `docs/audio/THEMES.md` SFX rule 8 amended to the new balance, with D-293 and Bailey's words.
- `tools/audio/sfx-probe.mjs`: now also meters the master limiter (its `reduction` and the post-limiter
  peak every 25 ms), in the summary for the whole run and for the fight only (`summary.fight`), and
  lists every reduction sample past -0.5 dB (`limiterEvents`).
- `SaveData.ts` is over the house line cap: it did not grow (+4 / -4 lines).
- `docs/CONTRACTS.md` does not list `SaveData.ts`, so no CONTRACT-CHANGES entry.

## Proof

### Unit (all pass)

`tests/unit/save-sfx-balance-migration.test.ts` (new, 16 tests): new profile 0.70 + marker; untouched
0.35 -> 0.70 and idempotent; player-set 0, 0.1, 0.25, 0.3, 0.4, 0.45, 0.6, 0.65, 0.7, 0.9, 1 kept
exactly; missing / null / string / NaN / Infinity -> 0.9; 0.35 picked after the upgrade kept on three
reloads; two new-build tabs (one picks 0.35, the other records a clear) keep both; the first write
stores the move and the marker; and three fixtures written by the released builds' own SaveStore:

| Fixture | Written by | Stored SFX | Reads | Every other setting, chapter record, clear, best time, seen line, unlocked, flags |
|---|---|---|---|---|
| `release-29.json` (existing) | live release 29, 49005f73, `index-C73AJ1Ds.js` | 0.6 (player) | 0.6 | kept |
| `release-30-sfx-b.json` (new) | release 30 gate dist, 1475ff6b, `index-B0cfXTil.js` | 0.45 (player) | 0.45 | kept |
| `release-31a-sfx-b.json` (new) | release 31a gate dist, 52a431d0, `index-C_4T6wOX.js` | 0.35 (untouched) | **0.70** | kept |

The two new fixtures were written on 2026-09-30 by those builds' own `SaveStore` methods in a fresh
headless profile, served locally from their parked gate dists (`F:/pyrefly-parked/2026-09-29/rel30-dist-gate`,
`rel31a-dist-gate`; bundle names match `docs/deploys.log`), non-default values on purpose (FFX-2
Active + ATB speed, guide/advisor/intent off, reduce motion, hidden panels, battle help off, text
speed, volumes). Script: `D:/Tools/pyrefly-scratch/picks-0930/sfx-b/save-export.mjs`. Releases 29, 30
and 31a have byte-identical save modules (`git diff 49005f73 52a431d0 -- src/app/SaveData.ts
src/app/saveComfort.ts src/app/saveFfx2Atb.ts src/app/saveMerge.ts` is empty); release 32 (not live yet)
adds `textSize` only.

Updated: `save-sfx-default.test.ts` (the fresh default is 0.70, level with the music bus within
0.1 dB on round 13's peaks), `audio-sfx-mix.test.ts` (the re-base), `save-comfort-migration.test.ts`
(the release-29 upgrade now adds `sfxBalanceMigrated` beside `textSize`), and the e2e
`save-upgrade.spec.ts` truncated-save case (a fresh profile's mixer reads sfx 0.7; typechecked with
`npm run typecheck:e2e`, not run).

Checks: `npx tsc --noEmit` clean; `npm run typecheck:e2e` clean; 14 targeted save/audio/pause files
180 tests pass; `node tools/orphans.mjs` 24 orphans (unchanged; the new module is imported); the full
suite once: 674 files pass, 1 failed: `strategy-ffx2-bahamut.test.ts` "heal-only route ... clears Mega
Flare" took 28 s under the machine's load and failed; alone it passes (19/19, that case 10.3 s). It
touches no audio or save code (a load-dependent timeout).

### Measured on a production build, real clicks (agents cannot hear)

`npm run build` of this branch (`index-wIeQA4-T.js`), served on 127.0.0.1:8563,
`PYREFLY_BROWSER=gpu node tools/audio/sfx-probe.mjs`, fresh profile, default settings, **no URL
parameter**, 1600x900 mouse: Attack, Special/Skill, a spell, an item by clicks, then 45 s auto.
`audioDebug()`: volumes master 0.8 / music 0.7 / sfx 0.7, `sfxMix {b, 1, 0.70}`. No page errors.
Raw runs: `D:/Tools/pyrefly-scratch/picks-0930/sfx-b/runs/`; per cue: `node
D:/Tools/pyrefly-scratch/picks-0930/sfx-b/summarize.mjs <run.json>`.

Target: option b as measured on `?sfxmix=b` (fb-0929-sfx, Ch I mouse), `hit-1` RMS +7.6 dB, peak
+1.7 dB against the music; within 1 dB.

| Run | `hit-1` n | loudest 43 ms RMS vs music (median) | peak vs music peak (median) | within 1 dB |
|---|---|---|---|---|
| Ch I (FFX, Seymour Flux) run 1 | 14 | **+7.7 dB** | **+2.0 dB** | yes (+0.1 / +0.3) |
| Ch I run 2 | 7 | +7.4 dB | +0.9 dB | yes (-0.2 / -0.8) |
| Ch IV (FFX-2, Bahamut) | 18 | +7.0 dB | +1.4 dB | yes (-0.6 / -0.3) |
| Ch I, same build, `?sfxmix=a` (the old D-210 level) | 6 | +1.5 dB | -4.2 dB | (the handoff's a: +0.6 / -5.3) |

Same build, a -> b: +6.2 dB on both RMS and peak, as the arithmetic says. Other cues under b, Ch I
run 1 medians: `sword-slash-1` +6.5 / +1.6, `magic-charge` +7.1 / +0.8, `ko-fall` +8.5 / +2.1, `cure`
+8.4 / +1.5; `status-applied` stays under the music (-3.3 / -5.7).

**The limiter does not pump.** From the first battle event to the end of each run, the master
limiter's gain reduction never went past 0 dB: Ch I 0 of 2,895 samples, Ch IV 0 of 3,044 (25 ms
apart); loudest post-limiter peak -4.4 dBFS (Ch IV) and -5.5 dBFS (Ch I), 2.4 dB or more under the
-2 dBFS threshold (under `a`: -8.4 dBFS). The only reduction in any run is one reading at audio start,
before the title: about -11 to -12 dB decaying over ~1 s, at t ~1.8 s, with a 1.8 s synthesised
one-shot. It reads the same under `a` (-10.8 dB) as under `b` (-11.4 / -12.3 dB), so it is not this
change; it is recorded as an open item.

### Real input on the OPTIONS row

`D:/Tools/pyrefly-scratch/picks-0930/sfx-b/options-shot.mjs`: into Chapter I, the PAUSE chip and the
OPTIONS tab by real clicks. Screenshots in `docs/screenshots/sfx-b/`:

- `options-fresh.jpg`: a fresh profile, SOUND EFFECTS **70**; mixer sfx 0.7, marker set.
- `options-r31a-upgrade.jpg`: the release-31a save in the slot before boot: SOUND EFFECTS **70**
  (was 0.35 untouched), master 45 and music 60 kept, text speed 0.75x, low effects on.
- `options-r30-upgrade.jpg`: the release-30 save: SOUND EFFECTS **45** (the player's), master 60,
  music 50 kept.
- `b2-default-seymour-flux-mouse.jpg`, `b2-default-ffx2-bahamut-mouse.jpg`: the probe's end frames.

## Game case

**Both.** The SFX bus, the new-profile default and the save migration are shared plumbing (CHK-020);
Chapter I (FFX) and Chapter IV (FFX-2) measured the same within 0.7 dB. No research doc distinguishes
the two games' effect loudness.

## Files

- `src/audio/sfxMix.ts`: `D210_SFX_VOLUME`, `SFX_DEFAULT_VOLUME`, trims re-based, default `b`.
- `src/audio/AudioManager.ts`: pre-save default from `SFX_DEFAULT_VOLUME`; comment.
- `src/app/saveSfxBalance.ts` (new): the one-time migration.
- `src/app/SaveData.ts`: the default, the optional `sfxBalanceMigrated` field, the call in `migrate`.
- `tests/unit/save-sfx-balance-migration.test.ts` (new), `tests/fixtures/saves/release-30-sfx-b.json`,
  `release-31a-sfx-b.json` (new); `tests/unit/save-sfx-default.test.ts`, `audio-sfx-mix.test.ts`,
  `save-comfort-migration.test.ts`, `tests/e2e/save-upgrade.spec.ts` updated.
- `tools/audio/sfx-probe.mjs`: limiter meter.
- `docs/audio/THEMES.md` rule 8; `docs/plans/sfx-b-review.md` (preflight); `docs/handoff/fb-0929-sfx.md`
  (a superseded note at the top); this file; `docs/screenshots/sfx-b/`.

## Not done / open

- **Deep review before the deploy** (save-data class). Not run here.
- **Bailey's yes on the inferred half**: moving existing saves' untouched 0.35 (D-293 marks it
  inferred). If he says new profiles only, delete the `migrateSfxBalance` call's move branch (keep the
  0.9 rule) and the release-31a expectation flips to 0.35.
- A player who once moved the slider and came back to exactly 0.35 before this build is moved to 0.70
  once (indistinguishable from untouched in the old blob); one slider step undoes it.
- The boot-time limiter reading (about -11 dB for ~1 s at audio start, same under a and b): not
  investigated; whether it is audible (a pump on the first sound) or a reading artefact of the
  compressor's first render is unknown.
- The music on this branch is origin/main's (R1 at the old MP3 quality). Music O1 (V0 re-encode,
  branch `music-o1`) changes quality, not loudness; worth one probe run after the merge.
- The phone (tap) was not re-measured; fb-0929-sfx measured b on the phone at +8.3 / +1.8 dB.
- The e2e `save-upgrade.spec.ts` change is typechecked, not run.
- `decisions.json` D-293 `delivery` stays with the driver.
