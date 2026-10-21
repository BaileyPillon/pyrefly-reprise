# Demo kit: running Echoes of Spira at a booth, offline

R61, for the conference on 2026-10-26 (Bailey, 2026-10-19: "I demo my game in a week at a huge gaming conference"; his picks: **"This PC"**, an offline copy so the demo does not need the venue's wifi, and **"Demo mode: party moves first"**). Game case: **both** (tooling and docs; the demo chapters are Chapter I, FFX, and Chapter IV, FFX-2). What to say at the booth is in [BOOTH-SCRIPT.md](BOOTH-SCRIPT.md).

The kit lives in `tools/demo-kit/`. It needs only Node (on this PC already) and Chrome or Edge. It builds nothing and installs nothing.

| File | What it does |
|---|---|
| `fetch-site.cmd` | Makes the offline copy: downloads the live site's own files and checks every one against release 60's manifest. **Needs internet. Do it at home.** |
| `start-demo.cmd` | Serves the copy on this PC only and opens it full screen (kiosk) at `?demo=1`. |
| `reset-demo.cmd` | A fresh visitor: closes the browser, wipes its save, opens it again. About five seconds. |
| `stop-demo.cmd` | Closes the browser and stops the server. |
| `status-demo.cmd` | Says whether the server and the browser are running. |

(Behind them: `fetch-site.mjs`, `serve-offline.mjs`, `demo-kit.mjs`, `demo-kit-lib.mjs`. Tests: `tests/unit/demo-kit.test.ts`.)

## 1. Make the offline copy (once, at home, with internet)

**It is big: 10.2 GiB, 6,160 files.** Release 60's manifest (`critic/artifacts/1cea6e937.json`) lists 6,161 files; `_headers` is read by the host and never served, so 6,160 are fetched. 9.9 GiB of it is the painted figures at 2x, 3x and 4x. **It will not fit on D: (about 9 GB free on 2026-10-20).** The default folder is `C:\Users\<you>\AppData\Local\EchoesDemoKit\site` (C: has about 130 GB free). To put it elsewhere, set `ECHOES_DEMO_SITE` or pass `--dir`.

```
fetch-site.cmd --dry-run            # says how many files, how many bytes, how much room there is. Writes nothing.
fetch-site.cmd                      # the whole copy: 10.2 GiB. Plan on 15 to 30 minutes on a good line.
fetch-site.cmd --max-tier 2         # leaves out the 3x and 4x figures: 3.0 GiB. See the note below.
fetch-site.cmd --verify-only        # no internet: re-checks every file in the folder against the manifest
```

- **Every file is checked.** A file is kept only if its bytes hash to the manifest's sha256. A file that is already there and right is kept, so running it again after a dropped line fetches only what is missing. A wrong file is deleted, never kept.
- **It checks which build is live first.** If the live site is not release 60 (a later deploy), it stops and says so. `--manifest live` copies whatever is live now; `--allow-newer` tries the old manifest anyway and fails the files that changed.
- **It checks the room first** and refuses a copy that does not fit (`--force-space` overrides).
- **`--max-tier 2` is a trade.** The game loads a figure's 3x or 4x master only when the figure is drawn bigger than the screen can show at 2x (a 4K screen, a close camera), and falls back one size when a master is missing (`src/engine/ArtTier.ts`). On a 1080p or 1440p screen the picture is the same. On a 4K booth screen you may see a soft figure now and then. If the booth screen is 4K, take the whole copy.
- A copy with fewer files than the manifest is marked **partial** (`.demo-kit-site.json` in the folder), and `start-demo.cmd` warns about it.
- Run `fetch-site.cmd --verify-only` the evening before you leave. It reads every file from the disk and takes a minute or two.

## 2. Start the demo

Double-click `start-demo.cmd` (or run it in a terminal; `--dir <folder>` names another copy).

It starts a small server for the folder on **127.0.0.1 only** (port 5173, or the next free one), so nothing on the venue network can reach it and nothing leaves this PC. Then it opens Chrome (else Edge) **full screen in kiosk mode** at `http://127.0.0.1:5173/?demo=1`, in a browser profile of its own, with sound allowed without a first click. The title screen is up in a few seconds.

- `--no-kiosk` opens a normal window instead (for a test on a laptop).
- `--browser edge` picks Edge. `--keep-profile` keeps the last visitor's save (the default is a fresh one at every start).
- **Close the browser:** Alt+F4. The server keeps running; `start-demo.cmd` again, or `reset-demo.cmd`, opens it once more.
- The game's save lives in that browser profile, **not** in the repository and not in your own Chrome. It is a different address from echoesofspira.com, so it does not touch your real save there.

## 3. Between visitors and at the end of the day

- **Next visitor, empty save:** Alt+F4, then `reset-demo.cmd`. It closes the kiosk browser, deletes its profile (the save, and the demo's own memory of which fight comes next), and opens it again on the title. The first fight after a reset is the cleanest seed (see "What demo mode does").
- **End of day:** `stop-demo.cmd`. `stop-demo.cmd --wipe` also deletes the browser profile.
- Nothing is stopped by name. The kit remembers the PIDs it started and checks each is still the same program before it closes it, so a leftover note from before a reboot can never close something else.

## 4. If something goes wrong

| What you see | Do this |
|---|---|
| A fight looks stuck or wrong | F5. It reloads on the title with the demo setting kept. That fight is lost; nothing else is. |
| The picture is frozen or black | F5 first (the game does not recover a lost graphics context by itself, a reload does). Still stuck: Alt+F4, then `reset-demo.cmd`. |
| The keyboard does nothing | Ctrl+Alt+Del, Task Manager, end the browser. Then `reset-demo.cmd`. |
| `reset-demo.cmd` says it could not delete the profile | A browser process still holds it. Close the browser window (Alt+F4) and run it again, or run `stop-demo.cmd --wipe` and then `start-demo.cmd`. |
| `start-demo.cmd` says there is no copy of the site | `fetch-site.cmd` has not run, or the folder is somewhere else: add `--dir <folder>`. |
| It says "No Chrome or Edge found" | The server is already up. Open the address it prints in any browser and press F11. |
| 5173 is busy | The kit takes the next free port by itself and prints the address. |
| No sound | Check the PC's volume and the browser's tab is not muted (kiosk: Alt+F4, `reset-demo.cmd`). The kit asks the browser to play without a click, but a venue PC can have its own policy. |
| Is it running? | `status-demo.cmd`. |
| The PC went to sleep | Set it not to sleep while plugged in (Windows Settings, System, Power) before the day starts. Not changed by the kit. |

The server's own log is `server.log` in the kit's folder (`%LOCALAPPDATA%\EchoesDemoKit`, or `ECHOES_DEMO_HOME`). A 404 in it is a file the copy does not have.

## What demo mode does (`?demo=1`)

The address `?demo=1` is the whole switch (`src/app/demoMode.ts`). The tab keeps it, so F5 keeps it; `?demo=0` turns it off. It changes presentation and which seed a fight uses. **It changes no rule, no number and no engine.**

1. **The party moves first** (Bailey's pick). Chapter I (FFX) uses seeds 7, 10 and 12 in turn: Tidus's menu opens before any enemy acts, with nobody down, and the intended line wins all three. Seed 7 (the first after a reset) loses no one. Chapter IV (FFX-2) uses seed 56: a clean win in about two minutes of fight, with Bahamut's one Mega Flare in it. A RETRY takes the next seed of the table. All of it is proved on the engines in `tests/unit/demo-mode.test.ts`.
2. **No teaching cards** (new in R61). Auron's briefing, the three guided-first-run cards, every first-use line and the Sphere Grid explainer are not shown. They are not marked as seen either, so nothing is written to the save for a card that never appeared. *Why skipped and not "once per session":* the demo runs in one tab all day, so "once" would hand the cards to the first visitor and take them from the other hundred, and Auron's first-command card holds the fight until a key is pressed, which is a dead screen for a stranger. You are standing beside the visitor; you are the guide.
3. **A win goes back to the board fast** (new in R61). Enter on the results panel returns to the board without the story scenes that follow the panel (Chapter I has two, Chapter IV one). The board then opens on the **other** demo chapter, so the next visitor's first Enter starts the other fight. The story scene before the fight is unchanged; hold Enter to skip it. A visitor who backs out of party prep lands where they were.
4. **Esc closes a card before it pauses** (R61, fixes the live r60 check). Outside demo mode, with a first-use card up, the first Esc takes the card down and the next Esc opens the pause. It used to do both at once. Same for the pad's B button.

## How it was checked (R61)

- `tests/unit/demo-kit.test.ts` (28 tests): the server on a real loopback port (types, cache rules, 304, Range, every way out of the folder refused, a busy port, the stop request), the downloader fetching from a stand-in "live" server (verify, keep, re-fetch, delete the wrong file, partial copies, `@` sent as `%40`), and `stopPid` leaving a process that is not the kit's alone.
- The downloader was run against the real site on 32 files (8.5 MB: the page, the bundle, the fonts, the manifests, a track, two `@2x` files): all hashes matched the manifest, a second run kept all 32, `--verify-only` agreed. The full 10.2 GiB was **not** downloaded (there is not the room on D:).
- The server and the start / status / stop commands ran against that 32-file folder (`--no-browser`). The kiosk window itself is not covered by a test: see the report for what was run on a screen.
