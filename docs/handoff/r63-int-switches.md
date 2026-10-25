# SWITCHES: the one switch map of the integrated build (r63-int)

Branch `r63-int` (playtest-1022 + pro-look + pro-camera + pro-staging + this lane), tree `D:/pyrefly-continuity`. Game case: BOTH games for the plumbing; every switch acts in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only (`engine/motion/DemoGate.ts`); every other chapter, screen and the address with no key at all are release 62.

## The address

| address | what it gives |
|---|---|
| (nothing) | release 62 / playtest-1022's default: every new piece OFF |
| `?demo=1&pack=demo` | everything new ON in the two demo chapters: the motion pack, the pro look, the pro camera, the pro staging |
| `...&switchboard=1` | the same, plus the keys below and the corner label (nothing is installed without both `pack=demo` and `switchboard=1`) |
| `...&pro=off` | **NEW (r63).** The three pro lanes (look, camera, staging) OFF at once, beating the pack and each lane's own key. The motion pack stays on. This is the quickest "the build before the pro lanes" |
| `...&pro=on` | **NEW (r63).** The three pro lanes ON without the pack (each lane's own key still wins: `?pro=on&camera=off`) |

## The keys (`?demo=1&pack=demo&switchboard=1`)

`=` shows a legend that names every key in plain words with its value; press `=` again to hide the board, once more to bring the label back. In a fight the label fades to a ghost and comes back for 4 s after any key of the board; the legend stays at full strength while it is up. Keys are read in the capture phase and swallowed (they work under the pause screen; a modified key or a key typed in a text field is left alone). None collides with the game's own keys (`app/Input.ts`; pinned by `demo-motion-int.test.ts` and `r63-int-switches.test.ts`).

| key | board name | what it flips | OFF form in the address | ON form in the address | default with `?pack=demo` | default without |
|---|---|---|---|---|---|---|
| `1` | smear | brush-stroke trail behind fast moves (paint, blur, off) | `?smear=off` | `?smear=paint` / `blur` | paint | off |
| `2` | punch | the small camera push on a hit | `?punch=today` | `?punch=new` | new | today |
| `3` | stop | the short freeze of the field on a heavy hit | `?hitstop=today` | `?hitstop=short` | short | today |
| `4` | rumble | gamepad rumble on heavy hits | `?rumble=off` | `?rumble=on` | on | off |
| `5` | sounds | motion sounds (footsteps, whooshes, landings) | `?motionsfx=off` | `?motionsfx=on` | on | off |
| `6` | fx | spell effects and the bosses' attack effects | `?fx=today` | `?fx=new` | new | today |
| `7` | curves | animation curves (strike, cast lift, recoil, squash) | `?curves=today` | `?curves=new` | new | today |
| `,` | real clips | timing taken from the real game's clips: off, snappy (1.1 s), real speed | (`?curves=new`) | `?curves=real-snappy` / `real` | off | off |
| `.` | party rigs | the animated party figures (Tidus Chapter I, Rikku Chapter IV); a flip plays from the NEXT fight | `?partyrigs=off` | `?partyrigs=on` | **off** (the pack alone never turns it on) | off |
| `8` | Tidus | Tidus's art T1 / T2 (reloads the page; the dev link only) | `?tidus=t1` | `?tidus=t2` | t1 | t1 |
| `9` | moments | the victory and knock-out moments | `?moments=today` | `?moments=new` | new | today |
| `/` | look | **pro look**: the arena's Cinematic contrast (Chapter I moon, Chapter IV skylight), the Chapter IV seam fix, Ink-and-light hits, glass damage numbers, glove / flower-ring markers, low-HP and KO marks | `?look=today` (or `?pro=off`); pieces: `?prooff=arena,seam,hits,numbers,markers` | `?look=pro` (or `?pro=on`) | pro | today |
| `-` | shadow | the contact shadow that follows the feet | `?shadow=today` | `?shadow=follow` | follow | today |
| `;` | camera | **pro camera**: the real FFX shots (caster close shots, landing shots, Total Annihilation / Flare / Banish / Full-Life, the killing blow, the victory close-up), Expedition 33 push-ins on plain attacks, the FFX-2 follow camera, the soft background | `?camera=off` or `?camera=today` (or `?pro=off`); soft background alone: `?camdof=off` | `?camera=pro` (or `?pro=on`); caster shot `?castshot=0..4` or `random` | pro | today |
| `\` | staging | **pro staging**: the held breath before Total Annihilation (FFX) and Mega Flare (FFX-2), the full-painting boss card, the victory freeze frame, the defeat retry card, the FFX Overdrive opening, the FFX-2 Change plate. A flip in a fight plays from the next beat | `?staging=today` or `?staging=off` (or `?pro=off`); pieces: `?stagingoff=breath,card,ending,opening` | `?staging=pro` (or `?pro=on`) | pro | today |
| `0` | all | master: if every piece is new, all go to today's; else all go to new (includes `/`, `;`, `\`) | | | | |
| `=` | legend | the legend, then hide the label, then the label again | | | | |

Notes:
- The three pro lanes are independent: flipping one leaves the other two as they were (`r63-int-switches.test.ts`). Each flip is read at the next beat; the look re-reads the arena at once; the camera ends a shot in flight in 320 ms; the staging layer is built as a fight begins.
- Console (`window.__pyrefly`): `pro('pro'|'today')`, `procam(on?)`, `staging('pro'|'today')`, `switchboard()`, `switchboardPress(code)`.
- Accessibility rules hold in every lane (REDUCE MOTION, REDUCE FLASHES, low effects), and the FFX-2 menu rules (D-357, D-441: nothing new plays over an open command menu) hold in the camera and the staging at every frame.
- `?look=hd2d|cinematic|anime|off` is the demo-looks key, not a lane switch: it picks a look by hand and wins for the ARENA piece only (hits, numbers, markers stay on). Use `?look=today` or `?pro=off` to turn the lane off.
