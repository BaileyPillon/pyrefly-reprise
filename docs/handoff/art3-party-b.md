# Art handoff — group `party-b` (contract v3)

**Round:** v3 facing re-render, 2026-09-17.
**Subjects:** `lulu`, `kimahri`, `rikku` — seven states each (`idle, attack, cast,
item, hurt, ko, victory`), plus `kimahri/jump` and `rikku/steal`, plus the three
HUD portraits.
**Read with:** `docs/ART-PIPELINE.md` §2a, `docs/handoff/art3-contract.md`,
`docs/handoff/art-ffx-party.md` (the v2 passes that produced the tag strings
this round inherits), `research/visual-bible.md` §1.5–§1.7.

Everything in this group was **v2 `straight-on`** before this round. Every file
listed below was replaced; nothing frontal survives for these three subjects.

---

## 1. Method

1. `idle` first, four variants at `--facing right`, judged on a contact sheet,
   the keeper mirrored with `tools/gen/flip.py --set-facing right` (the
   frame-left bias of §2a is real: it decided every batch in this round).
2. Every other state `--ref`'d at the promoted `idle.png`, 2–3 variants,
   `--refWeight` / `--refStart` per the state table in
   `docs/handoff/art-ffx-party.md` §7.4.
3. Portraits with `--composition portrait`, `--ref` at the same idle.
4. `tools/gen/qc.py` on every promoted cutout, then a per-subject contact sheet
   to `docs/screenshots/art/<id>.png`.

**Tag strings were inherited, not rewritten.** The identity and negative blocks
come from the approved v2 sidecars of these same three subjects — five fix
passes of canon corrections (Lulu's belt skirt, Kimahri's single horn, Rikku's
green shorts and claw) are encoded in them, and retyping them from the cast
manifest would have thrown that away. What changed this round is the camera.

---

## 2. Findings

*(filled in below as the round ran)*

