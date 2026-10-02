# r36-art: the 2026-10-02 art installed and played in battle (D-322 to D-328, under the 800 MB line)

Branch `rel36` (worktree `D:/pyrefly-advisor-v3`), from `a4033fd9`. Decisions D-322 to D-328 and D-332, answered by
Bailey 2026-10-02 ~09:50 EDT, verbatim "All your recommendations" (the morning page
https://claude.ai/artifact/4vkdBe5GKuHJZswrdfZQh2), then "I'll go with all your recommendations, full speed ahead.
Godspeed." Not deployed.

## What went in

Package, README, backups, held files and the builder: `D:/Tools/pyrefly-art-backup/approved/2026-10-02-art/`
(`install.mjs --dry-run`, then `--apply`; `verify-approved.mjs`: 591 ok, 0 mismatched, 0 missing). The lock and the
decisions' deliveries are committed in the main tree on their own: `ad0b8973` (pushed; `approved-hashes.json`,
`judge-locked-hashes.json`, `decisions.json`).

122 images + 121 sidecars into the shared `public/art` (42 of them replace a painting, each backed up first, its
older lock moved to the new hash with a `supersedes` record):

| Decision | What | Files | Game |
|---|---|---|---|
| D-323 | Kimahri `ready` + `follow`, Yuna `follow`, Lulu `ready`, Yuna Dark Knight `cast` / `item` / `victory` | 7 new | Kimahri, Yuna, Lulu FFX; Yuna Dark Knight FFX-2 |
| D-324 | Kimahri's single broken horn on his 10 battle paintings, his speaker portrait and his pause painting (+ its 2x master) | 13 replace | FFX |
| D-326 | Valefor hurt, Pterya hurt, Yunalesca form 1 attack / hurt / cast, Vegnagun head KO (each carried on past its old canvas) | 6 replace | FFX; Vegnagun FFX-2 |
| D-325, its cut-off part | Valefor and Pterya whole wing: idle, attack (replace), KO, cast (new), Pterya's idle 2x master; Yu Yevon's size-matched idle and attack / hurt / cast; Yunalesca form 2's outpainted idle (scale 1.1316) and 2x master and the attack made from it | 12 replace, 4 new | FFX |
| D-322 | the dressphere twirl keys, 69 of 77 | 69 new | FFX-2 |
| D-327 | Braska's Final Aeon form 1 attack and cast, the hurts of LeBlanc, Ormi, Trema and the male goon, Anima's attack: each in its idle's design | 7 replace | BFA, Anima FFX; the rest FFX-2 |
| D-328 | Seymour Flux direction 1: attack, cast, hurt, KO painted from his crouched idle | 4 replace | FFX |

## What waits, and why: the 800 MB line (D-332)

The rule (the brief): the scratch vite build of rel36 stays under 800,000,000 bytes. Before: 758,237,680. After, with
this branch's code: 798,872,117 (room 1,127,883). The page's order (the cut-off fixes and party keys, then the
dressphere keys, then the boss keys, then the aeon extras) was followed and stopped at the line inside the dressphere
keys, whose own order was: Chapter IV's changes, the other first changes of the shipped chapters, the later ones, and
last the changes back into a girl's starting dressphere. D-327 and D-328 went in ahead of their group because they
only replace paintings and make the build 1.2 MB smaller. Waiting in the package `held/` (+33.0 MB): 8 twirl keys
(the forming and manifest of Rikku's Dark Knight, Thief and Alchemist and of Paine's Dark Knight: such a change plays
her start, going and ribbons, then the new outfit lands), D-325's other 40 boss keys and its 19 aeon extras. The
package README says how to install them when the line moves. Lossless PNG recompression would not make room (0.7
percent on a sample).

## Code (rel36; FFX-2 only: the spherechange)

`src/engine/fx/mix/twirl.ts`, the MAX mix's twirl-key slot, was built for keys under one figure (start, mid, end). The
picks are five parts painted per dressphere, so a change now composes two figures:

- `twirlPlan(from, to)`: the old dressphere's `twirl-start` and `twirl-going`, the girl's `twirl-mid` (installed
  under her Gunner figure), the new dressphere's `twirl-forming` and `twirl-end`, each that is installed;
- `keyRescale`: a key painted for another figure than the one on stage is resized by the two idles' sidecars, so it
  stands as tall as it was painted (the stage sizes every pose by the idle it stands in); each key's own sidecar keeps
  the art run's head-match `scale` and its foot line as `anchorY` (ribbons hang below the feet);
- `twirlTimes(n, beat, weights)`: the parts share today's 0.64 s by the art run's step clock (2, 2, 3, 2, 3);
- `twirlStepMs`: one frame moves the twirl clock two frames at most. Found in battle: the change's first frames upload
  the new outfit, and one long frame let the start key show for a single frame (15 to 74 ms instead of 107). After
  the fix, a real change by keys shows start 4 frames, going 6, ribbons 10, forming 6 (`ch4frames-desk`).

Tests: `tests/unit/fx-mix-parts.test.ts` (the plan with the installed layout, never another girl's ribbons, a part
that is not painted is skipped, the rescale, the weights, the step); `tests/unit/engine/pose-install-bosses-0926.test.ts`
(the four 09-26 hurts that D-327 replaced: the 09-26 lock records what they replaced, their sidecars carry the idle's
scale and facing). `docs/target/approved-hashes.json` and `judge-locked-hashes.json` on rel36 are main's `ad0b8973`
(they were identical at the base), so the hash tests read the lock the installed files match. Main's own copy of
`pose-install-bosses-0926.test.ts` fails 2 tests against the installed art until rel36 lands (the fix is here only;
the main commit was the lock alone, as briefed).

## In battle (rel36 dev server on 5790, headless Chromium on the GPU, seed 1; 0 page errors, 0 console errors, 0 HTTP errors in every run)

Scripts, every frame (JPEG), a `record.json` per run (per shot: pose, painting URL, the texture drawn, the sidecar
numbers, the plane height, the screen box) and contact sheets: `D:/Tools/pyrefly-scratch/2026-10-02-install/verify/`
(`verify.mjs`, `lib.mjs`, `sheets.py`, `strips.py`, `heads.py`, `numbers.py`; `out/<plan>-<device>/`). REAL = by real
keys in the chapter; STAGED = `setPose(pose, {force, immediate})` with the battle parked by `__pyrefly.fx.freeze`, or
`stage.setArt` to put a figure on an actor of the chapter that fields it later, or a spherechange staged through the
figure's own `loadPoses` (the call the presenter makes); every record says which. Capture aids, labelled: each twirl
key frozen the frame it goes up; a turn cut-in hidden for that shot; KO COLLAPSE off for a KO shot (a parked battle
would hold the collapse's first frame); the HUD hidden for the wing-tip shots (`-clean` runs). Screenshots:
`docs/screenshots/r36-art/`.

| Check | Where | Result |
|---|---|---|
| The dressphere twirl plays in Chapter IV under DRESSPHERE SHOT | `ch4-desk`, `ch4-phone`: Yuna White Mage, Rikku Dark Knight, Paine Warrior to Gunner by real keys (Change, Gunner, Enter) | all 5 keys of each change in order, inside the held close shot on the desktop whenever the shot holds (`ch4time-desk`, real time: 5 of 5 keys inside it for Yuna and Rikku; once Paine's change came while another girl's menu was open and, as D-316 rules, no cut was made); no white column; the new outfit after the last key. `r36-art-ch4-twirl-real-1600x900.jpg`, `-390x844.jpg` |
| Every other installed twirl key | `ch4-desk`, 16 staged changes along each girl's dresspheres | all 69 installed keys shown (checked against the package's hashes), each change playing the old figure's start and going, her ribbons, the new figure's forming and manifest. `r36-art-ch4-twirl-staged-1600x900.jpg` |
| A single cut under REDUCE MOTION | `ch4rm-desk`: REDUCE MOTION on by the OPTIONS row with real keys, then a real change | no twirl key (`twirlKeysOn` false), the held shot one static cut in and one back (2 camera jumps over 331 frames); today's flourish plays |
| Kimahri has one horn everywhere, the pause included | `ch1-desk`, `ch1-phone` (his Attack by real keys: `ready` at the menu, `attack`, `follow`; then every painting staged, Sleep and low HP injected so the rest paintings answer), `ch1story-desk`, `-phone` (the opening scene by real Enter presses to his line; the pause by real keys to his tab) | one short broken stub on all 12 (the 2x pause master on the desktop, the 1x on the phone); `jump` is shipped but no game code shows it (loaded as a pose for one staged frame). `r36-art-ch1-kimahri-horn-heads.jpg`, `r36-art-ch1-kimahri-portrait-pause.jpg` |
| Flux keeps one design | `ch1-desk`, `-phone` | idle, attack, cast, hurt, KO are one crouched man with the fan crest; heights within 5 percent (KO 1.12x box). `r36-art-ch1-flux-and-kimahri-attack.jpg` |
| Yu Yevon no longer grows on a hit | `ch3-desk` (staged on the chapter's boss spot) | his hurt, attack and cast keep the idle's body size (the dome matches; the boxes are 1.17x to 1.23x taller only because the outpainted legs reach the ground), where the old idle made every key about 47 percent bigger. `r36-art-ch3-yu-yevon-valefor-bfa.jpg` |
| Valefor's wing is whole on every key | `ch3-desk-clean` (Chapter III, HUD hidden), `ch14-desk-clean` (Pterya, Chapter XIV) | the far wing ends in feather tips on idle, hurt, attack, cast and KO, for both; Pterya's idle draws its new 2x master on the desktop (3570x1900). `r36-art-ch14-pterya-ch5-vegnagun-head.jpg` |
| Yunalesca's carried-on paintings | `ch2-desk` | form 1 attack, hurt, cast: no straight edge left; form 2: the outpainted idle (new 2x master) with scale 1.1316 keeps her old hurt, cast and KO at their size; the new attack is her idle's design. `r36-art-ch2-yunalesca.jpg` |
| Vegnagun's head KO | `ch5-desk` (staged on the tail's actor) | the approved KO's design and size; at this staging the muzzle sits under the command list at the frame's edge |
| D-327 designs | `ch3` (BFA), `ch6-desk` (Ormi, LeBlanc, the goon), `ch7-desk` (Anima), `ch13-desk` (Trema) | each key in its idle's design, box heights 0.99x to 1.05x of the idle. `r36-art-ch6-ch7-ch13-d327-ydk.jpg` |
| Party re-rolls | `ch1` (Kimahri, Yuna, Lulu), `ch4` and `ch13-desk` (Yuna Dark Knight in her own Chapter XIII) | each on its slot; Yuna Dark Knight's helmet on cast, item, victory, her body as tall as the idle (the boxes are taller by the greatsword) |

No sidecar needed a fix and nothing was uninstalled.

## Game case (rule 14)

Code: FFX-2 only (the spherechange; FFX has none). Art: per figure, as in the table. Tests: both (the art inventory).

## Open, for the driver and Bailey

1. 33.0 MB of adopted art waits for the 800 MB line (8 twirl keys, 40 boss keys, 19 aeon extras). The line read as
   800 MiB (838.9 MB) would take all of it; release 35 measured the shipped public files (771.0 MB now), the brief
   measures the whole build. Bailey's word moves the line; nothing else frees enough.
2. REDUCE MOTION plays no twirl key (rel36's gate), so today's flourish, white column included, still plays there. The
   art run's proposal "REDUCE MOTION: the manifest as a single cut" and "a pair seen before in the fight: only the
   manifest" are not built: they change the rel36 gate, a call for the driver.
3. The first change of a battle fetches its keys then (about 2 MB); on a cold cache the new outfit can land before the
   keys and the twirl plays over it. A prewarm at battle start is a follow-up (it adds downloads to every FFX-2 fight).
4. Pterya's idle and attack were judge-locked (`chapter:isaaru:2026-09-25`) though the morning page counted them as
   unpinned; Bailey's 6A yes names the Pterya whole-wing idle and keys; superseded like the rest.
5. The new keys of figures whose idle has a 2x master (Pterya, Yunalesca, Braska's Final Aeon) draw at 1x on a
   desktop while the idle draws at 2x, as release 35's keys do; their masters (about 150 MB) are not packaged.
6. research/visual-bible.md 1.6's pixel-art note still asks for two horns (flagged by the art run); a one-line fix
   there would stop the drift coming back.
7. Gates on rel36 at the hand-off: `tsc --noEmit` clean; the full `vitest run --testTimeout=60000` 746 files passed,
   5 skipped (11,036 tests). One earlier full run had a load-sensitive failure in `audio-manifest-io` ("loses
   nothing when four separate renders write at once"; it passes 3 of 3 alone, no audio file touched here).
   `orphans`: 24, as before.
