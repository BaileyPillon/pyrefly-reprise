"""Head readings, release 39.1 (r391-posescale; both games, art tooling only). Replaces the ten-ruler by-eye pass of `measure.py tiles` for new readings.

    python -s tools/posescale/fine.py list <subject>                              prior scale, anchor and where it came from, for every pose
    python -s tools/posescale/fine.py sheets <subject> [...] --out DIR [--poses a,b]   review sheets: each pose beside the idle's face at the same scale, with 5-percent ticks
    python -s tools/posescale/fine.py apply <subject> --rulers '{"ready": 1.08}'  a ruler reading -> reviews.json (scale = s0 / ruler)
    python -s tools/posescale/fine.py cues <subject> [...] --out cues.json [--verify DIR]   MEASURE the eye spacing of every pose (ps_eyes.py), no reading involved
    python -s tools/posescale/fine.py apply-cues cues.json [--weight 0.7]          fold the measured spacing into reviews.json

The measurement (`cues`): the idle's two irises are found by their hue (subjects.json `iris`, degrees; `eyes` = the idle's two iris centres by hand when the finder is wrong) and
their spacing and size are the reference. In every other pose the irises of that hue inside a window around the face anchor (anchors.json) that are the right size and about the
idle's spacing apart are the eyes; the pose's head is the idle's times (idle spacing / pose spacing) at the same scale, so `scale = s0 / (1 + weight * (spacing - 1))` for the spacing
the pose shows at its prior scale `s0` (`spacing` x1.00 = the eyes are as far apart as the idle's at the scale the engine would draw: leave it). A pose with fewer than two irises found,
or a spacing outside 0.80 to 1.25 (a turned head, a closed eye, a wrong blob), keeps its prior scale. `--verify DIR` draws every iris pair it used on a tile for a by-eye check.
Hand inputs stay in subjects.json (face box, iris hue, eyes), anchors.json (face centre per pose, read off `thumb` sheets) and reviews.json (the scales). `measure.py measure --write` then
makes docs/target/pose-measure.json and `measure.py table` the engine's tables. See docs/handoff/r391-posescale.md for how well it works.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import measure as M  # noqa: E402
import ps_eyes as E  # noqa: E402
import ps_fine as F  # noqa: E402
import ps_lib as L  # noqa: E402

SPACING_MIN, SPACING_MAX = 0.80, 1.25


def prior_scale(subject: str, pose: str, reviews: dict) -> float:
    rv = reviews.get(pose)
    return float(rv) if isinstance(rv, (int, float)) else M.current_scale(subject, pose)


def priors(subject: str, only: list | None) -> tuple:
    ann = L.load_json(L.SUBJECTS_JSON, {})[subject]
    face = M.ref_box(subject, ann)
    anchors = L.load_json(M.ANCHORS_JSON, {}).get(subject, {})
    reviews = L.load_json(M.REVIEWS_JSON, {}).get(subject, {})
    items = []
    for pose in L.pose_names(subject):
        if pose == "idle" or pose.startswith("twirl-") or (only and pose not in only):
            continue
        s0 = prior_scale(subject, pose, reviews)
        hand = anchors.get(pose)
        c = [float(hand[0]), float(hand[1])] if hand else F.proposal_anchor(subject, pose, face, s0)
        if c is not None:
            items.append((pose, c, s0, bool(hand)))
    return ann, face, items


def measure_cues(subject: str, verify: pathlib.Path | None) -> dict:
    ann, face, items = priors(subject, None)
    eyes = E.Eyes(subject, face, ann.get("iris"), ann.get("eyes"))
    rows, tiles = {}, []
    for pose, c, s0, hand in items:
        got, n, cue = eyes.locate(pose, c, s0)
        row = {"s0": round(s0, 3), "n": n, **{k: v for k, v in cue.items() if k != "pts"}}
        rows[pose] = row
        if verify is not None:
            pm = [((x - c[0]) * s0, (y - c[1]) * s0, (255, 40, 40), "") for (x, y) in cue.get("pts", [])]
            tiles.append(F.point_tile(subject, pose, c, face, s0, marks=pm, label=f"{subject}/{pose} n={n}"))
    if verify is not None and tiles:
        import math

        from PIL import Image

        verify.mkdir(parents=True, exist_ok=True)
        cell = tiles[0].width
        cols = 4
        for bi in range(0, len(tiles), 12):
            part = tiles[bi: bi + 12]
            sheet = Image.new("RGB", (cols * (cell + 2), math.ceil(len(part) / cols) * (cell + 2)), (20, 20, 24))
            for i, t in enumerate(part):
                sheet.paste(t, ((i % cols) * (cell + 2), (i // cols) * (cell + 2)))
            sheet.save(verify / f"{subject}-irises-{bi // 12 + 1}.jpg", quality=85)
    return rows


def apply_cues(cues: dict, weight: float) -> dict:
    reviews = L.load_json(M.REVIEWS_JSON, {})
    done, kept = {}, {}
    for subject, rows in cues.items():
        sub = reviews.setdefault(subject, {})
        for pose, r in rows.items():
            sp, s0 = r.get("spacing"), r.get("s0")
            if s0 is None:
                continue
            if sp and SPACING_MIN <= sp <= SPACING_MAX and r.get("n") == 2:
                sub[pose] = round(s0 / (1 + weight * (sp - 1)), 3)
                done.setdefault(subject, {})[pose] = sub[pose]
            else:
                sub.setdefault(pose, "=")
                kept.setdefault(subject, []).append(pose)
    M.REVIEWS_JSON.write_text(json.dumps(reviews, indent=1, sort_keys=True) + "\n", encoding="utf8")
    return {"applied": sum(len(v) for v in done.values()), "kept": {k: v for k, v in kept.items()}}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["list", "sheets", "apply", "cues", "apply-cues"])
    ap.add_argument("subjects", nargs="*")
    ap.add_argument("--out")
    ap.add_argument("--poses")
    ap.add_argument("--cell", type=int, default=420)
    ap.add_argument("--per", type=int, default=6)
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--window", type=float, default=2.8)
    ap.add_argument("--rulers")
    ap.add_argument("--s0")
    ap.add_argument("--verify")
    ap.add_argument("--weight", type=float, default=0.7, help="how far a measured eye spacing moves a scale (1 = all the way, 0 = not at all)")
    a = ap.parse_args()
    only = a.poses.split(",") if a.poses else None
    if a.cmd == "apply-cues":
        print(apply_cues(json.loads(pathlib.Path(a.subjects[0]).read_text(encoding="utf8")), a.weight))
        return
    if a.cmd == "apply":
        subject = a.subjects[0]
        rulers, s0 = json.loads(a.rulers or "{}"), json.loads(a.s0 or "{}")
        reviews = L.load_json(M.REVIEWS_JSON, {})
        sub = reviews.setdefault(subject, {})
        _, _, items = priors(subject, None)
        prior = {p: v for p, _, v, _ in items}
        for pose, r in rulers.items():
            base = float(s0.get(pose, prior.get(pose, 1.0)))
            sub[pose] = round(base / float(r), 3)
            print(f"{subject}/{pose}: s0 {base:.3f} / ruler {float(r):.3f} = {sub[pose]:.3f}")
        M.REVIEWS_JSON.write_text(json.dumps(reviews, indent=1, sort_keys=True) + "\n", encoding="utf8")
        return
    if a.cmd == "cues":
        out = {s: measure_cues(s, pathlib.Path(a.verify) if a.verify else None) for s in a.subjects}
        pathlib.Path(a.out or "cues.json").write_text(json.dumps(out, indent=1), encoding="utf8")
        for s, rows in out.items():
            print(f"{s}: " + " ".join(f"{p}={r.get('spacing', '-')}" for p, r in rows.items()))
        return
    for subject in a.subjects:
        ann, face, items = priors(subject, only)
        if a.cmd == "list":
            print(subject, "face", face, "iris", ann.get("iris"), "eyes", ann.get("eyes"))
            for pose, c, s0, hand in items:
                print(f"  {pose:30s} s0 {s0:.3f}  anchor {c[0]:.0f},{c[1]:.0f} {'(hand)' if hand else '(proposal)'}")
            continue
        out = pathlib.Path(a.out or ".")
        out.mkdir(parents=True, exist_ok=True)
        files = F.fine_sheet(subject, [(p, c, s0) for p, c, s0, _ in items], face, out, per=a.per, cols=a.cols, cell=a.cell, window=a.window)
        print(subject, "sheets:", [pathlib.Path(f).name for f in files], "poses:", [p for p, *_ in items])


if __name__ == "__main__":
    main()
