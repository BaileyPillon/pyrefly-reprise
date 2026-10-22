# Expressive-keys tooling (rig-expressive lane; Bahamut pilot and the second lane: Ifrit, Grothia, Spathi, Shiva, Pterya; 2026-10-19)

Scratch-grade helpers that were written while cutting expressive keys. They read a rig folder under `D:/pyrefly-art-rigs` and its work folder under `D:/pyrefly-art-rigs-work`, write only where they are told, and take the subject from the
environment (`XID` = art id, `XWORK` = the work folder name, `XART` = art dir, default `D:/pyrefly-art-r55`). Run with `D:/Tools/ComfyUI/python_embeded/python.exe -I`.

| Script | What it does |
|---|---|
| `xl.py` | the library: a painting drawn into the idle's master frame, a posed rig model, renders |
| `gv.py`, `cp.py`, `ov.py`, `pp.py`, `pl.py`, `jm.py` | looking: a labelled-grid crop of a painting (with a polygon, with the rig beside it); painting / old rig / new rig per pose; silhouette difference; part silhouettes over the painting; every bone's posed pivot |
| `ha.py` | the head-area table per key (mesh area and opaque pixels against the idle's) |
| `ac.py`, `mkvar.py` | write `build.variants` + `fit.keys.<pose>.image` into a subject config from hand polygons (`ac.py`) or from masks (`mkvar.py`) |
| `autopart.py`, `autoseed.py` | partition a pose's PAINTING among the rig's parts: by where the baseline key puts each part (`autopart`) or from rough hand-drawn seed shapes (`autoseed`); dilated into the neighbours for the underlap; masks go to `rig_vcut`'s `mask` |
| `joints.mjs`, `jfit.py` | the joints the hole test watches and a least-squares nudge of a key's rotations and offsets so each sits deep inside its own pieces (the pieces register to whatever the bones are) |
| `rb.py`, `fin.sh`, `recomp.mjs` | variants -> export -> gate -> rewrite the key claims -> export -> gate; the finishing run (clean folder, optional lossless PNG recompression, gate json, tiers, `--verify` on a copy named for the subject, head table) |
| `mk_twin.py` | a twin's config with its registration shift applied (variants included) |
| `tw.py`, `mo.py`, `strip.py`, `mp4peek.py` | the three-way stills (painting set / today's rig / new rig) and the MOTION clips (mp4, 60 fps, same three panels) from the recorder's frames; `mp4peek.py` looks at a clip without a player |
