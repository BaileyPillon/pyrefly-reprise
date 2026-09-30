# fb-0929-sfx: "no sound effects on attacks"

Track of the 2026-09-29 feedback round. Branch `fb-0929-sfx` (from `origin/main` 1c313c17).
Nothing here is deployed.

## The words

Bailey, 2026-09-29 ~19:00 EDT, passing on a friend's feedback ("I concur"):
"no sound effects on attacks so doesn't feel like I did much".

## What was reproduced, and how

Agents cannot hear, so this is measured. `tools/audio/sfx-probe.mjs` (new; headless Playwright,
fresh profile, default settings, `PYREFLY_BROWSER=gpu`) hooks the Web Audio graph at the
prototype level. It puts an AnalyserNode after the **SFX bus** (the gain the hall convolver feeds)
and after the **music duck bus**, names every one-shot (sprite offset -> cue via `manifest.json`),
and wraps the presenter's audio port so each cue is logged with the event on screen and the ability
acting. It reaches the fight by real clicks (1600x900) or taps (390x844), plays Attack, a
Special/Skill, a spell and an item by clicks or taps, then auto-battles 40 s at normal speed for
hits taken and KOs.

Runs: the live site (release 31a) and a production build of `origin/main`, Chapter I (Seymour
Flux, FFX) and Chapter IV (Bahamut, FFX-2), mouse and tap: 8 runs plus 2 re-runs with named
cues. Raw JSON and end frames: `D:/Tools/pyrefly-scratch/fb-0929/sfx/runs/`
(`live-*`, `live2-*`, `main-*`, `opt-*`); per-cue medians via
`node D:/Tools/pyrefly-scratch/fb-0929/sfx/summarize.mjs <run.json>`. The end frames are in
`docs/screenshots/fb-0929/sfx/`.

### Which cue fires for each event (the same on live and main, both games, mouse and tap)

| Event | Cue | Per-cue gain |
|---|---|---|
| Physical Attack, action start | `sword-slash-1` | 0.8 |
| Hit landing (`damage`) | `hit-1` (or the element's cue; `critical` on a crit) | 0.8 (1 on a crit) |
| Spell / Special / enemy magic, action start | `magic-charge` | 0.7 |
| Heal (Potion, Cure; negative damage) | `cure` | 0.7 |
| Item, action start | **none** (only the heal cue when it lands) | - |
| Status landing | `status-applied` | 0.5 |
| KO | `ko-fall` | 1 |
| **Miss** | **`cancel` (the menu "back out" glass tone)** | 0.5 |
| Boss reveal / summon | `boss-roar` / `summon` | 0.9 / 1 |

So attacks are **not** silent: every Attack, hit, spell, heal and KO fires a cue, the sprite is
fetched and decoded (`audioDebug().prerendered.spriteDecoded: true`), and no event goes unsent.
Two things are wrong.

### Cause 1 (the main one): level, the D-210 balance. Not changed; options built.

Measured on the SFX bus against the music bus (both before the shared master gain), live,
Chapter I, mouse, default settings (SFX 0.35, music 0.7):

| | Peak (43 ms window) | Loudest 43 ms RMS | Against the music |
|---|---|---|---|
| Music bed (1.2 s before each cue) | -9.3 to -9.7 dBFS | -21.5 to -22 dBFS (mean) | |
| Attack: `sword-slash-1` | -15.0 dBFS | -21.7 dBFS | RMS **-0.1 dB**, peak **-5.5 dB** |
| Hit: `hit-1` | -14.9 dBFS | -21.7 dBFS | RMS **+0.1 dB**, peak **-4.4 dB** |
| Spell: `magic-charge` | -14.7 dBFS | -21.7 dBFS | RMS -0.3 dB |
| KO: `ko-fall` | -13.7 dBFS | -19.8 dBFS | RMS +2.1 dB |

Chapter IV (FFX-2) and the phone (tap) read the same within about 1 dB (`hit-1` RMS +0.5 to
+1.4 dB over the music). The loudest instant of an attack is only level with the average of the
score playing under it, and its peaks sit 4 to 6 dB under the score's, so the orchestra masks it.
That is D-210 working as designed: its value came from THEMES.md SFX rule 8, "SFX peak 6 dB below
the music's ceiling". Release 31a's remaster did not move it (the music was -16 LUFS before too).

D-210 is Bailey's adopted decision ("I'll go with all of your recommendations", 2026-09-26), so it
is not changed. **The switch `?sfxmix=` offers three balances to hear side by side**, default off:

| Option | What | SFX bus at the default slider | Measured, Ch I mouse: attack/hit against the music | Arithmetic integrated loudness (manifest cue LUFS + gains), against the music at -19.1 LUFS |
|---|---|---|---|---|
| `?sfxmix=a` (= no parameter) | D-210 as shipped | 0.35 | RMS +0.6 / +0.7 dB, peak -5.2 / -5.3 dB | slash -29.0 LUFS (-9.9), hit -27.0 (-7.9), KO -25.1 (-6.0) |
| `?sfxmix=b` | Effects +6 dB (bus level with the music bus) | 0.70 | RMS +7.5 / +7.6 dB, peak +1.7 / +1.7 dB | slash -23.0 (-3.9), hit -21.0 (-1.9), KO -19.1 (0.0) |
| `?sfxmix=c` | Effects +10 dB | 1.11 | RMS +10.9 / +12.0 dB, peak +5.3 / +5.9 dB | slash -19.0 (+0.1), hit -17.0 (+2.1), KO -15.1 (+4.0) |

Chapter IV mouse: `b` hit-1 RMS +7.4 dB, peak +1.4 dB; `c` +11.1 dB, peak +4.7 dB. Phone
(Ch I tap) under `b`: hit-1 RMS +8.3 dB, peak +1.8 dB. The loudest cue under `c` (`boss-roar`)
peaks at -2.8 dBFS on the bus, before the 0.8 master and the -2 dBFS limiter.

The arithmetic column: music -16 LUFS x 0.7 bus = -19.1 LUFS; a cue is its manifest LUFS
(`sword-slash-1` -18, `hit-1` -16, `ko-fall` -16) + its per-cue gain + the bus. Integrated
loudness of a short cue is not how loud it feels against a steady bed; the measured columns are
the better guide, and the ear is the judge. Note that `b` and `c` break THEMES.md rule 8 as
written (peaks 6 dB under the music); choosing either means amending that rule too.

The trim multiplies the bus on top of the player's own slider, is never saved, and changes no
per-cue level. `audioDebug().sfxMix` reports `{ option, trim, busGain }`.

**To audition:** add `?sfxmix=b` (or `c`) to the page URL of a build that has this branch, start
Chapter I, attack. Compare with no parameter.

### Cause 2 (a defect, fixed): a miss played the menu's cancel tone

`SFX_FALLBACKS.miss` in `src/engine/BattlePresenterPorts.ts` sent a `miss` event to `cancel`,
the glass "back out of a menu" blip, at half gain (RMS 8 to 10 dB under the music). A swing that
misses sounded like backing out of a menu. The bank has the right cue, `whiff` ("A swing that
hits nothing: cloth and air", `src/audio/sfx/weapons.ts`, in the sprite at -18 LUFS), and
docs/AUDIO-GUIDE.md's key table names it for a miss. Fixed: `miss: 'whiff'`.

- Before (live, Ch I mouse, `live2-seymour-flux-mouse.json`): miss cues `cancel, cancel, cancel`.
- After (branch build, Ch I mouse and tap, `opt-b-seymour-flux-*.json`): miss cues
  `whiff x4` and `whiff`.
- Test: `tests/unit/audio-miss-cue.test.ts` failed before (`expected ['cancel'] to deeply equal
  ['whiff']`), passes after.

## Game case

**Both.** The mixer, the SFX bus and the presenter's fallback table are shared plumbing, the
`miss` event is the same in FFX and FFX-2, and both chapters measured the same (CHK-020). No
research doc distinguishes the two games' effect loudness.

## Files

- `src/audio/sfxMix.ts` (new): the `?sfxmix=` switch.
- `src/audio/AudioManager.ts`: the SFX bus gain goes through `sfxBusGain`; `debug().sfxMix`.
- `src/engine/BattlePresenterPorts.ts`: `miss` -> `whiff`.
- `tests/unit/audio-sfx-mix.test.ts`, `tests/unit/audio-miss-cue.test.ts` (new).
- `tools/audio/sfx-probe.mjs` (new): the measuring probe.

Checks: `npx tsc --noEmit` clean; the two new files plus `tests/unit/audio.test.ts` pass;
`node tools/orphans.mjs` 24 orphans (the new module is imported, no growth).

## Not done / open

- **Bailey's pick** between `a`, `b` and `c` (by ear). If `b` or `c`: change the new-profile
  default in `SaveData.ts` (save-data class: deep review before that deploy, as D-210 had) and
  amend THEMES.md rule 8. Existing saves stored 0.9 before D-210 or 0.35 after it.
- **Items have no cue at the start of the action** (the pose is `item`, and only `attack` and
  `cast` poses cue). The bank has `item-use`. Adding one changes the feel, so it is an option,
  not built.
- **The ability's authored `sfxKey` is never played.** 245 FFX ability, aeon and item rows carry
  one and `src/audio/sfx/aliases.ts` maps them, saying "a presenter can pass an ability's
  `sfxKey` straight through", but the presenter plays only the generic `sword-slash-1` /
  `magic-charge`. So Kimahri's spear, Auron's katana and Seymour's Anima (Energy Ray, Mega Flare:
  `sword-slash-1`, as an Overdrive-kind action) all sound like the same sword. Wiring it decides
  which cue replaces which (the damage event already plays the element), so it is an option for
  Bailey, not built. FFX-2 data has no `sfxKey` at all.
- The in-browser probe measures RMS and peak, not K-weighted LUFS; the LUFS column is arithmetic.

## CHECK (independent, 2026-09-29, did not build it)

Method: fresh `vite build` of the branch (preview :8300), `tools/audio/sfx-probe.mjs` by real mouse clicks at 1600x900, `PYREFLY_BROWSER=gpu`, Chapter I (FFX) and Chapter IV (FFX-2), against the live site (release 31a, which is the origin/main build; origin/main 1c313c17 only adds docs since). Raw runs: `D:/Tools/pyrefly-scratch/fb-0929/sfx/check/chk-*.json`.

- Default (no switch): `audioDebug().sfxMix` = `{a, 1, 0.35}`; the same cue names and per-cue gains as live (`sword-slash-1` 0.8, `hit-1` 0.8, `magic-charge` 0.7, `boss-roar` 0.9, `status-applied` 0.5); action-start to damage about 350 ms on both; levels against the music within run noise (Ch I `hit-1` RMS +1.7 dB branch, +1.2 live; `sword-slash-1` +1.6 / +0.3). The only cue difference is the miss: branch `whiff` x5 (Ch I), live `cancel`. Ch IV: same cue set, no misses in either run, its `cancel` cues are turn-start menu sounds at vol 1, unchanged. No errors in any run. Fights differ run to run (real-time RNG), so counts are not compared.
- Switch: `b` Ch I `hit-1` RMS +7.5 dB / peak +2.3 dB, `sword-slash-1` +7.2 / +1.6; `c` +11.9 / +5.8 and +9.9 / +5.2; bus 0.70 and 1.107. Matches the handoff table within 1 dB.
- Defect fix: with `miss: 'cancel'` restored, `audio-miss-cue.test.ts` fails 2 of 2 (`expected ['cancel'] to deeply equal ['whiff']`); restored to `whiff`, tree clean, passes.
- `npx tsc --noEmit` clean; `audio-miss-cue`, `audio-sfx-mix`, `audio` tests: 38 pass. `git diff origin/main HEAD` touches nothing under `src/battle` or `src/data`; src changes are only AudioManager (bus gain via `sfxBusGain`, debug field), the new `sfxMix.ts`, and the `miss` fallback. `git merge-tree` against origin/main: clean.
- Verdict: no blockers.
