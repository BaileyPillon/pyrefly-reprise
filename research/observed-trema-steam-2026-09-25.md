# FFX-2 real-game check of Paragon and Trema, Steam HD Remaster, 2026-09-25 (BLOCKED: nothing observed)

**Game case: FFX-2 only.** This file records the attempt and what is still open. No text, picture,
sound or game file from the retail game is in the repo (AGENTS.md rule 8). The status tag
"observed: FFX-2 Steam HD Remaster, 2026-09-25 (recorded, re-measured independently)" is **not
applied to anything here**, because nothing was recorded or measured. Every question below is
**open**, and every claim in `research/ffx2-trema.md` and `research/ffx2-combat-core.md` keeps its
existing source tag.

## Method (planned) and what happened

| Item | Planned | What happened |
|---|---|---|
| Game | FINAL FANTASY X/X-2 HD Remaster on Steam (app 359870), FFX-2.exe | Not launched. Steam was already running and was left alone. |
| Save | One community save at Via Infinito Cloister 100 (raw save file only), per Bailey: "just download a community save with trema" | **Not downloaded.** The save step refused the anonymous Google Drive link as an untrusted download. The save root (`Documents/SQUARE ENIX/FINAL FANTASY X&X-2 HD Remaster`) holds only `GameSetting.ini` (the launcher/graphics settings file) and an empty `FINAL FANTASY X` folder. There is no FFX-2 save of any kind. |
| Party levels, dresspheres, accessories | Read from the save | Unknown: there is no save. |
| Config ATB settings (mode, speed, spherechange length) | Recorded per clip | None: no clip was made. |
| Recording | ffmpeg, 60 fps, outside the repo under `D:/Tools/ffx-hd/observe-trema/video/` | Not started. The folder holds only the driver's `log.md`. |
| Error bar | At 60 fps, about ±1 frame (±17 ms) per edge, about ±33 ms per interval | Not applicable. |

Why no fallback: Paragon and Trema are reached only at Via Infinito Cloister 100, after the whole
story and 100 cloisters. That cannot be done inside the timebox, and cheats, trainers and save
editors are forbidden. An independent analyst re-checked the disk and confirmed the driver's
report (no save, no footage). The only other video on the machine,
`D:/Tools/ffx-hd/observe/video/ffx-01.mkv`, comes from the earlier run that played FFX by mistake
and is truncated to about 4.2 s, so it is not evidence for any question here.

## The questions, all open

| # | Question | Status |
|---|---|---|
| T1 | How many Paragon actions come before the first girl can act (Wait and Active)? Normal or Oversoul? | open (not observed) |
| T2 | E4: how long each kind of action takes (boss and girls), and whether other gauges fill during animations | open (not observed) |
| T3 | How long Beguiling Mire's Stop lasts (E1 estimates 100 units = 53.0 s), and other status durations | open (not observed) |
| T4 | What a hit does to a girl whose command menu is open (top list or submenu; Active and Wait) | open (not observed). Any FFX-2 battle would answer it; no save exists. |
| T5 | Wait mode: does the clock run at the top list and stop in a submenu and while aiming? | open (not observed). Any FFX-2 battle would answer it. |
| T6 | With one valid target, is there a target cursor to confirm? | open (not observed). Any FFX-2 battle would answer it. |
| T7 | Are action names shown on screen, and where? | open (not observed) |
| T8 | What happens between Paragon's defeat and the Trema battle? | open (not observed) |
| T9 | Anything that contradicts `research/ffx2-trema.md` | nothing compared; the file is neither confirmed nor contradicted |
| T10 | Config ATB settings per recording | none; no recording |

## To unblock

Bailey places an FFX-2 save at Cloister 100 in the save root himself, or names one specific source
he approves, and the run resumes from the same brief. T4, T5 and T6 need only an FFX-2 save that
can enter any battle; they do not need Cloister 100.
