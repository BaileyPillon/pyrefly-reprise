"""Measure every pose of a subject: the head against the idle's head, and where the figure stands.

    python -s tools/posescale/measure.py tiles tidus [yuna ...] [--poses a,b] --out DIR   the review sheets (ruler tiles, 6 poses each)
    python -s tools/posescale/measure.py measure tidus [yuna ...] [--out DIR] [--write]   the table; --write merges docs/target/pose-measure.json
    python -s tools/posescale/measure.py table                                            records -> src/data/art/poseRegistration*.ts

The head. The reference is the idle's head box (`head` in subjects.json: the hair or headgear mass and the face, hair top to
chin, outer side to side, thin tassels and hairpins left out), read off the painting by eye. A pose's head is judged against
rulers: `tiles` draws on every pose, at one fixed zoom, the idle's box grown or shrunk to ten sizes (0.60 to 1.85) and centred on
the head's centre (a proposal, the topmost thick part of the silhouette, or a hand centre in anchors.json read off the
overview sheet); the reviewer reads off the ruler the head fills snugly and writes its scale into reviews.json. That number is
the pose's `scale` (PaintedScale.ts): the idle's pixel scale times it brings the pose's head to the idle's. `measure` also
draws the normalised sheet (every head at its recorded scale in the idle's rectangle) to confirm the whole set by eye.

The stance. The middle of the lowest thick part of the silhouette (thin blades and staffs are opened away): automatic, shown
on the stance sheet, with a hand `stance` in overrides.json when a weapon's tip is lower than the boots.

Hand input (tools/posescale/): subjects.json (subject -> `game`, `face`), anchors.json (subject -> pose -> [x, y]), reviews.json
(subject -> pose -> scale), overrides.json (subject -> pose -> `stance` [x, row], `standing` true for a pose wider than tall that
is not lying down, `skip`). Run with ComfyUI's embedded python (numpy, scipy, PIL; see ps_lib.py).
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ps_lib as L  # noqa: E402
import ps_sheets as S  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
ANCHORS_JSON = HERE / "anchors.json"
SEEDS_JSON = HERE / "seeds.json"
REVIEWS_JSON = HERE / "reviews.json"


def engine_baseline(p: L.Painting) -> float:
    """The row the engine plants on the ground (PaintedArt.measureAlpha): the last row with a real run of opaque pixels."""
    need = max(2.0, p.w * 0.006)
    rows = np.nonzero((p.rgba[..., 3] >= 90).sum(1) >= need)[0]
    return float(rows.max() + 1) if len(rows) else float(p.h)


def r1(v) -> float:
    return round(float(v), 1)


def centre_of(p: L.Painting, hand: list | None, bh: float):
    """The head's centre: a hand centre (anchors.json, read off the overview sheet), else a proposal: the topmost thick part of an
    upright figure (its top plus half a head), else the far end of a body lying down."""
    if hand:
        return [float(hand[0]), float(hand[1])]
    if p.prone:
        x0, y0, x1, y1 = p.bbox
        return [x1 - 0.14 * (x1 - x0), y0 + 0.3 * (y1 - y0)]
    a = L.auto_top_anchor(p)
    return [a[0], a[1] + bh * 0.5] if a else None


def ref_box(subject: str, ann: dict):
    if not ann.get("face"):
        raise SystemExit(f"{subject}: give the idle's face box as `face` in subjects.json (read it off the idle sheet)")
    return [float(v) for v in ann["face"]]


def idle_seed(subject: str, ann: dict, seeds: dict):
    idle = L.Painting(subject, "idle")
    H = idle.bbox[3] - idle.bbox[1]
    sd = seeds.get("idle") or ann.get("seed")
    if sd:
        return idle, list(sd), 0.17 * H
    a = L.auto_idle_seed(idle)
    if a is None:
        raise SystemExit(f"{subject}: no automatic idle seed; give `idle` in seeds.json")
    return idle, [a["x"], a["y"]], a["wh"]


def sam_proposals(subject: str, ann: dict, seeds: dict, only: list | None) -> dict:
    """SAM's head mask (the hair mass and the upper face) of every pose from a seed inside the head (a hand seed in seeds.json, else the
    topmost thick part of an upright figure): the ratio of the idle's box to the pose's is the proposal, the spread of the prompt
    ensemble says how far to trust it."""
    idle, isd, wh = idle_seed(subject, ann, seeds)
    ih = L.sam_head(idle, isd, (wh, wh))
    if ih is None:
        raise SystemExit(f"{subject}: SAM found no head in the idle at {isd}")
    size0 = L.head_size(ih["box"])
    out = {"idle": {"box": ih["box"], "scale": 1.0, "spread": ih["spread"], "seed": isd}}
    for pose in L.pose_names(subject):
        if pose == "idle" or (only and pose not in only):
            continue
        p = L.Painting(subject, pose)
        sd = seeds.get(pose)
        if not sd:
            if p.prone:
                x0, y0, x1, y1 = p.bbox
                sd = [x1 - 0.14 * (x1 - x0), (y0 + y1) / 2]
            else:
                a = L.auto_top_anchor(p)
                sd = [a[0], a[1] + 0.5 * wh] if a else None
        r = L.sam_head(p, sd, (wh, wh)) if sd else None
        out[pose] = {"box": r["box"], "scale": size0 / r["size"], "spread": r["spread"], "seed": sd} if r else {"box": None, "scale": None, "spread": None, "seed": sd}
    return out


def cmd_props(subjects: list, out: pathlib.Path, only: list | None) -> None:
    ann_all = L.load_json(L.SUBJECTS_JSON, {})
    seeds_all = L.load_json(SEEDS_JSON, {})
    reviews_all = L.load_json(REVIEWS_JSON, {})
    out.mkdir(parents=True, exist_ok=True)
    for subject in subjects:
        props = sam_proposals(subject, ann_all.get(subject, {}), seeds_all.get(subject, {}), only)
        (out / f"{subject}-props.json").write_text(json.dumps(props, indent=1, default=float), encoding="utf8")
        rv = reviews_all.get(subject, {})
        boxes = {k: v["box"] for k, v in props.items() if v["box"]}
        facs = {k: (rv[k] if isinstance(rv.get(k), (int, float)) else v["scale"]) for k, v in props.items() if v["box"]}
        S.head_sheet(subject, boxes, str(out / f"{subject}-props.jpg"), cols=4, factors=facs)
        print(f"[{subject}] proposals (tile order: idle then alphabetical):", flush=True)
        for pose in ["idle"] + sorted(k for k in props if k != "idle"):
            v = props[pose]
            flag = "" if v["spread"] is not None and v["spread"] <= 0.08 else "  UNSTABLE"
            mark = f"  reviewed {rv[pose]}" if pose in rv else ""
            print(f"  {pose:22s} proposal {('%.3f' % v['scale']) if v['scale'] else '  -  '} spread {('%.3f' % v['spread']) if v['spread'] is not None else '-'}{flag}{mark}", flush=True)


def cmd_tiles(subjects: list, out: pathlib.Path, only: list | None) -> None:
    ann_all = L.load_json(L.SUBJECTS_JSON, {})
    anchors_all = L.load_json(ANCHORS_JSON, {})
    reviews_all = L.load_json(REVIEWS_JSON, {})
    out.mkdir(parents=True, exist_ok=True)
    for subject in subjects:
        hb = ref_box(subject, ann_all.get(subject, {}))
        wh = (hb[2] - hb[0], hb[3] - hb[1])
        anchors = anchors_all.get(subject, {})
        todo = {}
        for pose in L.pose_names(subject):
            if only and pose not in only:
                continue
            p = L.Painting(subject, pose)
            todo[pose] = [(hb[0] + hb[2]) / 2, (hb[1] + hb[3]) / 2] if pose == "idle" else centre_of(p, anchors.get(pose), wh[1])
        files = S.ruler_sheet(subject, todo, wh, str(out / f"{subject}-rulers"))
        print(f"[{subject}] ref box {hb} ({wh[0]:.0f}x{wh[1]:.0f}); reviewed {len(reviews_all.get(subject, {}))}/{len(todo)}; sheets {len(files)}: {', '.join(pathlib.Path(f).name for f in files)}", flush=True)
        print("   poses in sheet order:", [n for n in sorted(todo, key=lambda n: (n != 'idle', n)) if todo[n]], flush=True)


def measure_subject(subject: str, ann: dict, ov: dict, reviews: dict, anchors: dict, seeds: dict, only: list[str] | None, out: pathlib.Path | None) -> dict:
    hb = ref_box(subject, ann) if ann.get("face") else [0.0, 0.0, 1.0, 1.0]
    bw, bh = hb[2] - hb[0], hb[3] - hb[1]
    proposals_cache = sam_proposals(subject, ann, seeds, only) if any(v == "ok" for v in reviews.values()) else {}
    recs: dict = {}
    idle_width = [0.0]
    idle_prone = [L.Painting(subject, "idle").prone]
    for pose in sorted(L.pose_names(subject), key=lambda n: n != "idle"):
        if only and pose not in only:
            continue
        o = ov.get(pose, {})
        p = L.Painting(subject, pose)
        rec: dict = {"sha": L.sha256_file(p.path), "size": [p.w, p.h], "prone": p.prone, "baseline": r1(engine_baseline(p))}
        if o.get("skip"):
            rec["skip"] = o["skip"]
            recs[pose] = rec
            continue
        anchor = [(hb[0] + hb[2]) / 2, (hb[1] + hb[3]) / 2] if pose == "idle" else centre_of(p, anchors.get(pose), bh)
        review = reviews.get(pose)
        if pose == "idle":
            scale, src = 1.0, "reference"
        elif isinstance(review, (int, float)):
            scale, src = float(review), "reviewed"
        elif review == "keep":  # measured, the two readings (hair mass, face) disagree: the sidecar's own scale stays
            scale, src = None, "kept"
        elif review == "ok" and proposals_cache.get(pose, {}).get("scale"):
            scale, src = float(proposals_cache[pose]["scale"]), "accepted"
        else:
            scale, src = None, "unreviewed"
        rec["scale"], rec["scaleSrc"] = (round(scale, 3) if scale else None), src
        if anchor:
            rec["anchor"] = [r1(anchor[0]), r1(anchor[1])]
            if scale:
                rec["head"] = [r1(anchor[0] - bw / scale / 2), r1(anchor[1] - bh / scale / 2), r1(anchor[0] + bw / scale / 2), r1(anchor[1] + bh / scale / 2)]
        # ---- stance (standing poses only: a prone body rests by its own rule, PaintedRest.ts)
        # a pose wider than tall is lying down only when it is a KO: a standing lunge of a figure whose idle is upright is standing
        standing = (not p.prone) or o.get("standing") is True or (pose != "ko" and not idle_prone[0])
        rec["standing"] = bool(standing)
        if not standing:
            rec["stance"] = None
        elif "stance" in o:
            rec["stance"] = {"x": o["stance"][0], "row": o["stance"][1], "src": "hand"}
        else:
            st = L.stance_from_hem(p)
            rec["stance"] = {"x": r1(st["x"]), "row": r1(st["row"]), "x0": r1(st["x0"]), "x1": r1(st["x1"]), "src": "silhouette"} if st else None
            if rec["stance"] and pose == "idle":
                idle_width[0] = st["x1"] - st["x0"]
            elif rec["stance"] and idle_width[0]:
                ratio = (st["x1"] - st["x0"]) / idle_width[0]
                if ratio > 6.0:  # a ground glyph or an effect in the lowest band: the stance is not trusted (a narrow one, a spinning figure's, is fine)
                    rec["stance"]["flag"] = f"width x{ratio:.2f} of the idle's"
        recs[pose] = rec
        stn = rec["stance"]
        print(f"  {pose:22s} scale {('%.3f' % scale) if scale else '  -  '} [{src}]  stance {('x=%.0f row=%.0f' % (stn['x'], stn['row'])) if stn else 'n/a'}{('  FLAG ' + stn['flag']) if stn and stn.get('flag') else ''}  baseline {rec['baseline']}", flush=True)
    if out is not None:
        out.mkdir(parents=True, exist_ok=True)
        heads = {k: v["head"] for k, v in recs.items() if v.get("head")}
        facs = {k: v["scale"] for k, v in recs.items() if v.get("scale")}
        if "idle" in heads:
            S.head_sheet(subject, heads, str(out / f"{subject}-heads.jpg"), factors=facs)
            ss = {k: v["stance"] for k, v in recs.items() if v.get("stance")}
            if "idle" in ss:
                S.stance_sheet(subject, ss, facs, str(out / f"{subject}-stance.jpg"))
    return {"game": ann.get("game"), "idleHead": [r1(v) for v in hb], "poses": recs}


# ---------------------------------------------------------------- the engine table


def cmd_table() -> None:
    """docs/target/pose-measure.json -> the three generated tables the engine reads (src/data/art/poseRegistration*.ts)."""
    rec = L.load_json(L.RECORDS_JSON, None)
    if not rec:
        raise SystemExit("no records yet")
    groups: dict = {"Ffx": {}, "Ffx2": {}, "Foes": {}}
    for subject, sub in sorted(rec["subjects"].items()):
        game = sub.get("game") or "ffx"
        grp = "Foes" if game == "foe" else ("Ffx2" if game == "ffx2" else "Ffx")
        poses = sub["poses"]
        idle = poses.get("idle")
        if not idle:
            continue
        idle_stance = idle.get("stance")
        rows: dict = {}
        for pose, r in sorted(poses.items()):
            if r.get("skip"):
                continue
            row: dict = {}
            if pose != "idle" and r.get("scale"):
                row["scale"] = r["scale"]
            st = r.get("stance")
            if st and st.get("flag"):
                st = None
            if st and idle_stance:
                row["stanceX"] = round(st["x"], 1)
                if r["baseline"] - st["row"] >= 3.5:  # a weapon's tip hangs lower than the boots
                    row["feetRow"] = round(st["row"], 1)
            if r["prone"] and r.get("standing") and pose != "ko":
                row["upright"] = True
            if row:
                rows[pose] = row
        if rows:
            groups[grp][subject] = rows
    for grp, subs in groups.items():
        lines = [
            "import type { PoseRegistrationTable } from './poseRegistrationTypes.ts';",
            "",
            "/** Generated by `tools/posescale/measure.py table` from docs/target/pose-measure.json; do not edit by hand. */",
            f"export const POSE_REGISTRATION_{grp.upper()}: PoseRegistrationTable = {{",
        ]
        for subject, rows in subs.items():
            key = subject if subject.isidentifier() else f"'{subject}'"
            lines.append(f"  {key}: {{")
            for pose, row in rows.items():
                pk = pose if pose.isidentifier() else f"'{pose}'"
                body = ", ".join(f"{k}: {('true' if v is True else v)}" for k, v in row.items())
                lines.append(f"    {pk}: {{ {body} }},")
            lines.append("  },")
        lines.append("};")
        (L.REPO / "src" / "data" / "art" / f"poseRegistration{grp}.ts").write_text("\n".join(lines) + "\n", encoding="utf8")
        print(f"poseRegistration{grp}.ts: {len(subs)} subjects, {len(lines)} lines")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["measure", "tiles", "props", "table"])
    ap.add_argument("subjects", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--poses")
    ap.add_argument("--out")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    if a.cmd == "table":
        cmd_table()
        return
    subjects = L.load_json(L.SUBJECTS_JSON, {})
    overrides = L.load_json(L.OVERRIDES_JSON, {})
    reviews = L.load_json(REVIEWS_JSON, {})
    anchors = L.load_json(ANCHORS_JSON, {})
    seeds = L.load_json(SEEDS_JSON, {})
    out = pathlib.Path(a.out) if a.out else None
    only = a.poses.split(",") if a.poses else None
    names = list(subjects) if a.all else a.subjects
    if a.cmd == "tiles":
        cmd_tiles(names, out or pathlib.Path("."), only)
        return
    if a.cmd == "props":
        cmd_props(names, out or pathlib.Path("."), only)
        return
    result = {}
    for s in names:
        result[s] = measure_subject(s, subjects.get(s, {}), overrides.get(s, {}), reviews.get(s, {}), anchors.get(s, {}), seeds.get(s, {}), only, out)
    if a.write:
        rec = L.load_json(L.RECORDS_JSON, {"version": 1, "metric": "head box read against the idle's by rulers (sqrt(width*height)); stance from the silhouette", "subjects": {}})
        for s, v in result.items():
            old = rec["subjects"].get(s, {"poses": {}})
            if only:
                old["poses"].update(v["poses"])
                v = {**v, "poses": old["poses"]}
            rec["subjects"][s] = v
        L.RECORDS_JSON.parent.mkdir(parents=True, exist_ok=True)
        L.RECORDS_JSON.write_text(json.dumps(rec, indent=1, sort_keys=True) + "\n", encoding="utf8")
        print("wrote", L.RECORDS_JSON)


if __name__ == "__main__":
    main()
