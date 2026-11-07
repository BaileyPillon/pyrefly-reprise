"""gen_v2_cfg.py <tidus|rikku-dark-knight> : writes the rigs-v2 party config (tools/rig/subjects/<id>-v2.json) from the 2026-10-22 pilot's `party` block (`<id>-x.json`, written by gen_tidus_cfg.py / gen_rikku_cfg.py)
plus the v2 changes below. The file it writes holds ONLY the source (`_party`, `subject`, `scale`, `costume`, `party`): `prep.py` derives everything else (cut, build, landmarks, fit, motion), exactly as it does for the
first pilots, so a v2 config is a few hundred lines and not three thousand.

rigs-v2 (2026-10-29; Tidus FFX only, Rikku Dark Knight FFX-2 only; the tool is shared plumbing, both games). The v2 changes (`V2`), each one a number the offline audit (`move_audit.py`) measures, never a taste:
  - `key_motion`: the move length into each key (`ms`) and the part flip's cross-fade (`fadeMs`, 0 = a cut), chosen from `move_audit.py`'s numbers (see docs/handoff/rigs-v2.md), not guessed.
  - `keypoints`: the same hand-read points as the first pilots (the paintings' geometry is the same: r61 against r64 alpha masks agree to the pixel, the colour changed; checked by `D:/Tools/pyrefly-scratch/2026-10-29/rigs-v2/cmp_art.py`).

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/gen_v2_cfg.py tidus
"""
import json
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parents[4]
SUBJECTS = REPO / "tools" / "rig" / "subjects"

# per subject: the pilot config the party block starts from, and what v2 changes in it. `{}` is "the first pilot's value stands".
V2 = {
    # underlap 28 (1x px; the pilot had 12): the pieces of a pose reach further under their neighbours, so a joint turning mid-move opens less. The IDLE pieces keep underlap_idle 5: at 10 the pieces enclose six joints, the gate then
    # watches them and REFUSES the rig (experiment tidus-v2y), and at 24 nine keys carry a hole at a joint (tidus-v2u). Measured on Tidus (tidus-v2x): stray frames 22 to 15, worst stray 24 to 11 percent of the area, gate OK, 7.70 of 9 Mpx.
    # Variant underlaps of 20 (tidus-v2w) gave 20 stray frames. The first pilots' value (12) is what `{}` here would keep.
    "tidus": {"base": "tidus-x", "party": {"underlap": 28}},
    "rikku-dark-knight": {"base": "rikku-dark-knight-x", "party": {"underlap": 28}},
}


def build(subject: str) -> dict:
    spec = V2[subject]
    base = json.loads((SUBJECTS / f"{spec['base']}.json").read_text(encoding="utf8"))
    party = json.loads(json.dumps(base["party"]))
    for k, v in spec["party"].items():
        if isinstance(v, dict) and isinstance(party.get(k), dict):
            party[k] = {**party[k], **v}
        else:
            party[k] = v
    return {
        "_party": "rigs-v2 party rig (tools/rig/lane/party/gen_v2_cfg.py; the `party` block is the source, prep.py writes cut/build/landmarks/fit/motion from it). "
        + ("FFX only (Chapter I)." if subject == "tidus" else "FFX-2 only (Chapter IV)."),
        "subject": base["subject"],
        "scale": base["scale"],
        "costume": base["costume"],
        "party": party,
    }


def main(argv: list[str]) -> int:
    subject = argv[0]
    cfg = build(subject)
    out = SUBJECTS / f"{subject}-v2.json"
    out.write_text(json.dumps(cfg, indent=1), encoding="utf8")
    print(f"wrote {out} ({len(json.dumps(cfg))} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
