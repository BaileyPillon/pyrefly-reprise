# rigs-party-b2: the rest of the two parties as party rigs (Chapter I: Auron, Yuna, Kimahri; Chapter IV: Yuna in the White Mage dress, Paine in the Warrior dress), for Bailey's eye, nothing on

Branch `rigs-pilots-on`, 2026-11-06, a sub-agent of the release driver. Authority: Bailey, 2026-11-06, on the rigs v3 clips of Tidus and Rikku's Dark Knight, "so what are the benefits of the rigs? Those do look really good"; the driver's offer was to turn those two on and "make clips for the rest of the cast for you to judge". His standing rule (judged in motion before any rig goes on) stands: **nothing here is on, installed or deployed; no figure is a rig in any build.**

Game case (AGENTS.md rule 14): Auron, Yuna and Kimahri are FFX only (Chapter I, `seymour-flux`); Yuna (White Mage) and Paine (Warrior) are FFX-2 only (Chapter IV, `ffx2-bahamut`). The generator is shared plumbing (both games).

## Status: STOPPED at the machine's disk floor, before any rig was gated or recorded (read this first)

The brief said to stop and report if D: fell under 25 GB. It was 34 GB at the start and swung between 13 and 28 GB while this lane ran (nothing of this lane's: its work folders total about 260 MB; the drops of 5 GB a minute stopped when the lane's jobs were killed and came back up, so another lane's transient files). The lane killed its two running recuts by PID and made no clip.

| Figure | Chapter / game | Keypoints (hand-read, 1x px of each pose painting) | Recut (30 min a figure, CPU) | Gate | Clip |
|---|---|---|---|---|---|
| Paine, Warrior dress (`paine-warrior`) | IV, FFX-2 | 14 poses (13 keys + idle, both Overdrives) in `tools/rig/subjects/paine-warrior-b2.keypoints.json` | ran to the export (14 keys, 2.03 Mpx, 10.6 MB before the base-part shrink), then stopped on a folder mismatch (below) | not run | not made |
| Yuna, White Mage dress (`yuna-white-mage`) | IV, FFX-2 | 12 poses (11 keys + idle) | ran to the end of the variants step | not run | not made |
| Auron (`auron`) | I, FFX | 11 poses (10 keys + idle) | killed in the variants step | not run | not made |
| Yuna (`yuna`) | I, FFX | 12 poses (11 keys + idle, `summon` included: she is painted in it) | killed in the variants step | not run | not made |
| Kimahri (`kimahri`) | I, FFX | not read | not started | not run | not made |
| Lulu | (Gui chapter only; not in either party) | her rigs `lulu` (live) and `lulu-v2` exist, v1 / v2 files of the 2026-10-18 method | not touched | not re-run | not made |

Not seen in a browser: every claim about how these look is **unknown**. Only the keypoints were checked, by drawing them on the paintings (overlay sheets in the lane's scratch: a few points are guesses where a coat or robe hides a limb: Auron's and both Yunas' knees and far arms, Paine's idle far arm).

## What is in this commit

- `tools/rig/lane/party/gen_b2_cfg.py`: writes the source-only party config of the five figures (`<subject>-b2`; `FIGURES` holds what differs from the Rikku template: poses, hidden idle limbs, weapon radius and pivot, the robe/coat `hem` capsule for Auron, both Yunas; Paine has none). The maps folder comes from `PYREFLY_ART_MAPS`.
- `tools/rig/subjects/{paine-warrior,yuna-white-mage,auron,yuna}-b2.keypoints.json`: the hand-read points (`head` and `headTop` per pose are the registration table's head box, as in the pilots' files).
- The expanded configs (`<subject>-b2.json`, written by `prep.py` with absolute work paths in them) are local build state: not committed.

## How to resume (the order the pilots used, per figure)

1. `PYREFLY_ART_MAPS=<maps folder> <ComfyUI python> -I tools/rig/lane/party/gen_b2_cfg.py <subject>`, then `recut.py <subject>-b2 --art <live art mirror, read only>`; **do not point `PYREFLY_RIGS_DIR` / `RIG_WORK` anywhere else**: `pfin.py`, `pshrink.py` and `pfinish.py` read and write the dev rig folder and its work folder by fixed names, so a redirected run dies at the export step (it did, for Paine: `rig.json` was exported to the dev folder while the work stayed in the redirect).
2. Gate (`pfin.py` runs it), then `pfinish.py`; a figure that does not gate stays a painting and is reported with the gate's refusal.
3. Record each figure's rig and its painting set with one scripted key sequence (idle, ready, attack, follow, idle; cast; hurt; KO; revive), the painting side from a rig folder that lacks the figure (`record.mjs --rigs-dir`), not `?rig=off` (that paints the bosses too); cut a 1600x900 side-by-side per figure.
4. Nothing goes on by default: a figure gets a `rigs/<subject>/` folder in a release mirror only after Bailey's word on its clip.

## What the lane learned (for the next lane)

- Hand-reading 12 to 14 poses of a figure takes about 20 to 30 minutes with a grid overlay and one verification overlay; the recut is the long part (30 minutes of one core, four ran at once without trouble).
- The painted poses of these five figures differ from one another much more than Tidus's and Rikku's do (Auron's attack, follow and ready are three different outfits' worth of coat and cape; Kimahri's mane and tail and both Yunas' robes hide the joints), so the odd-frame counts of the move audit are the number to read first when the rigs exist; a coat or robe figure is the likeliest to fail the gate's hole test or to show stray pieces mid-move.
