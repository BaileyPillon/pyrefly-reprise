# SWITCHES: the one switch map of tonight's playtest build (r63-play)

Branch `r63-play` (r63-int + perf-trim + hud-f1 + audio-pass + boss-matte + this lane's extras), tree `D:/pyrefly-continuity`. Game case: BOTH games for the plumbing; every switch acts in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only (`engine/motion/DemoGate.ts`); every other chapter, screen and the address with no key at all are release 62. This file extends [r63-int-switches.md](r63-int-switches.md) (the motion pack and the three pro lanes, unchanged) with the lanes merged tonight and one new key.

## The address

`http://127.0.0.1:5410/?demo=1&pack=demo&switchboard=1` is the playtest address: everything new ON, the keys and the corner label installed. (`switchboard=1` is needed for the keys; without it the build plays the same, with no keys.)

| address word | what it does | default with `?pack=demo` |
|---|---|---|
| `?pro=off` | the three pro lanes (look, camera, staging) OFF at once (r63-int; the motion pack stays on) | on |
| `?hud=today` (`?hud=f1` forces it on) | the HUD: **F1 Brushed slab** on the Clear Stage layout (lane hud-f1) against today's Ink and Gold HUD | f1 |
| `?audio=today` (`?audio=new` forces it on) | the sound: the audio pass (layered hits, the dip before big blows, the menu family, spell sounds on the effects' marks, the mix, voice over music, the results, nine voiced lines) against today's sound | new |
| `?boss=today` (`?boss=clean` forces it on) | the bosses' edges: the re-cut Bahamut and Seymour Flux (no rim, shadow under the footprint, the card cut-out) and Mortiorchis's rim off, against today's | clean |
| `?partyrim=off` | **NEW (r63-play).** the party's and the aeons' pale screen-space rim OFF, the way the bosses' is | **on** (today's rim: the pack does not change it) |
| `?govern=off` | the frame-budget governor never acts (perf-trim; `?govern=on` always; `?govbudget=<ms>` names the display's budget) | decides by itself |
| everything off | `?pro=off&hud=today&audio=today&boss=today` plus the motion pack's own off keys (`0` on the board) | |

## The keys (`?demo=1&pack=demo&switchboard=1`)

`=` shows a legend that names every key in plain words with its value; press `=` again to hide the board, once more to bring the label back. Everything in the r63-int table stands unchanged (`1` smear, `2` punch, `3` stop, `4` rumble, `5` sounds, `6` fx, `7` curves, `,` real clips, `.` party rigs, `8` Tidus, `9` moments, `/` look, `-` shadow, `;` camera, `\` staging, `0` master, `=` legend). One key is new:

| key | board name | what it flips | OFF in the address | default |
|---|---|---|---|---|
| `'` (apostrophe) | party rim | the pale key-coloured edge light on the party and the aeons: **on** is today's, **off** draws them with none, the way the bosses are drawn. A playtest judgement switch: Bailey has not decided the party's rim | `?partyrim=off` | on |

The party rim is not a "new" piece: it has no master setting, so `0` leaves it where it is and the label does not count it as new. The HUD, the sound and the boss edges have no board key (the apostrophe was the last key I could confirm the game and its screens do not use); flip them by the address, or live from the console (below).

Console (`window.__pyrefly`): everything in r63-int's list, plus `partyRim('on' | 'off' | null)` and `partyRimOff()` (the party rim), `hudF1('f1' | 'today')` and `hudF1On()` (the HUD), `audioNew(true | false | null)`, `audioPass()` and `audioPassLog(reset?)` (the sound pass), `bossClean('clean' | 'today' | null)` and `bossCleanOn()` (the boss edges), `govern()` (the governor's state, `govern(level)` holds a level), `perf` (the frame profiler).
