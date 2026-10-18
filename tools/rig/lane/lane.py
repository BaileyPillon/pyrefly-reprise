"""The lane kit's Python commands (the rig program, 2026-10-18; both games, shared plumbing). One entry point for what a rigging lane repeated by hand for Kimahri and for Lulu.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/lane.py <command> ...

    new <name> --preset humanoid-side|creature-quadruped|creature-winged [--subject ID] [--art DIR] [--force]    scaffold tools/rig/subjects/<name>.json from the subject's paintings        lane_new.py
    fit --subject S [--poses all|a,b] [--seeds 3] [--procs 8] [--tag T] [--dry]                                 the sweep, in parallel, below-normal priority, under a fit slot             lane_fit.py
    select --subject S --tag T [--write]                                                                        the best candidate a pose by the gate; claims rewritten; the table          lane_fit.py
    eval --subject S --keys K.json [--out DIR] [--full]                                                         export a keys file and gate it; the table                                   lane_fit.py
    keytable --gate G.json --rig rig.json [--out T.txt]                                                         the per-key table                                                           lane_sheets.py
    clips --subject S --gate G.json --on DIR --off DIR --out DIR [--poses a,b]                                  the rig beside its painting, a clip a pose                                  lane_sheets.py
    sheets --subject S --clips DIR --out DIR [--before DIR] [--before-poses a,b]                                the sheets for Bailey (and the before/after sheet)                          lane_sheets.py
    twin <name> --of <rigged config> [--subject ID] [--art DIR] [--run]                                         a silhouette twin: the cut config and keys carried over                      lane_twin.py
    framediff --a DIR --b DIR [--floor DIR] [--poses a,b] [--every N] [--from FRAME] [--out report.json]                       compare two recordings (rig signature, pixels): before/after an engine change   lane_diff.py
    report --subject S --gate G.json [--rig rig.json]                                                           the handoff skeleton (the table, the files, the commands) on stdout

The recorder is Node: `node tools/rig/lane/record.mjs` (README). Subjects are the CONFIG names of `tools/rig/subjects/<name>.json`; the recorder's registry is `tools/rig/lane/lane-subjects.json`.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, HERE.as_posix())
sys.path.insert(0, HERE.parent.as_posix())  # `python -I` leaves the script's folder off sys.path


def report(sub_name: str, gate: dict, rig: dict | None) -> str:
    import lane_fit

    ok = sum(1 for k in gate["keys"] if k["ok"])
    out = [f"# The {sub_name} rig (branch `rig`)", "", f"State: the rig is on disk and gated `{gate['status']}`, {ok} of {len(gate['keys'])} keys, coverage {'partial: ' + ', '.join(gate['uncovered']) if gate.get('uncovered') else 'full'}.",
           "", "## The per-key table (the gate's own reading)", "", "```", lane_fit.format_table(gate, rig), "```", ""]
    if gate.get("authored"):
        out += ["## Authored keys (overlap waived, landmarks required)", "", ", ".join(gate["authored"]), ""]
    if gate.get("variants"):
        out += ["## Variants (format v2; a report, never a refusal)", "", *[f"- {v['part']}:{v['variant']} palette distance {v['distance']}" for v in gate["variants"]], ""]
    out += ["## Commands", "", f"```\nPY=D:/Tools/ComfyUI/python_embeded/python.exe\n$PY -I tools/rig/rig.py cut --subject {sub_name}\n$PY -I tools/rig/rig.py build --subject {sub_name}\n$PY -I tools/rig/lane/lane.py fit --subject {sub_name} --seeds 3\n$PY -I tools/rig/lane/lane.py select --subject {sub_name} --tag <tag> --write\n$PY -I tools/rig/rig.py export --subject {sub_name}\nnode tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<id> --art D:/pyrefly-art-r50\nnode tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/<id>\nnode tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<id> --verify --art D:/pyrefly-art-r50\nnode tools/rig/lane/record.mjs --subject <id> --out <dir> --modes poses,cast,hurtko --off\n```", "",
            "## Still to write by hand", "", "- the parts and the costume (what was cut, what is a prop), the marks by eye, which keys are authored and why, the KO, the thin margins, what the clips show that the gate cannot see.", ""]
    return "\n".join(out)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="lane.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    n = sp.add_parser("new"); n.add_argument("name"); n.add_argument("--preset", default="humanoid-side"); n.add_argument("--subject"); n.add_argument("--art"); n.add_argument("--out"); n.add_argument("--force", action="store_true")
    f = sp.add_parser("fit"); f.add_argument("--subject", required=True); f.add_argument("--poses", default="all"); f.add_argument("--seeds", type=int, default=3); f.add_argument("--procs", type=int, default=8); f.add_argument("--tag", default=None); f.add_argument("--dry", action="store_true")
    s = sp.add_parser("select"); s.add_argument("--subject", required=True); s.add_argument("--tag", required=True); s.add_argument("--write", action="store_true")
    e = sp.add_parser("eval"); e.add_argument("--subject", required=True); e.add_argument("--keys", required=True); e.add_argument("--out"); e.add_argument("--full", action="store_true")
    k = sp.add_parser("keytable"); k.add_argument("--gate", required=True); k.add_argument("--rig", required=True); k.add_argument("--out")
    c = sp.add_parser("clips"); c.add_argument("--subject", required=True); c.add_argument("--gate", required=True); c.add_argument("--on", required=True); c.add_argument("--off", required=True); c.add_argument("--out", required=True); c.add_argument("--poses")
    h = sp.add_parser("sheets"); h.add_argument("--subject", required=True); h.add_argument("--clips", required=True); h.add_argument("--out", required=True); h.add_argument("--before"); h.add_argument("--before-poses"); h.add_argument("--registry")
    t = sp.add_parser("twin"); t.add_argument("name"); t.add_argument("--of", required=True); t.add_argument("--subject"); t.add_argument("--art"); t.add_argument("--run", action="store_true")
    d = sp.add_parser("framediff"); d.add_argument("--a", required=True); d.add_argument("--b", required=True); d.add_argument("--poses"); d.add_argument("--every", type=int, default=1); d.add_argument("--out"); d.add_argument("--floor"); d.add_argument("--from", dest="start", type=int, default=0)
    r = sp.add_parser("report"); r.add_argument("--subject", required=True); r.add_argument("--gate", required=True); r.add_argument("--rig")
    a = ap.parse_args(argv)

    if a.cmd == "new":
        import lane_new
        return lane_new.run(a.name, a.preset, a.subject, a.art, a.out, a.force)
    if a.cmd in ("fit", "select", "eval"):
        import lane_fit
        from rig_common import Subject

        sub = Subject(a.subject)
        if a.cmd == "fit":
            import time
            return lane_fit.cmd_fit(sub, None if a.poses == "all" else [p for p in a.poses.split(",") if p], a.seeds, a.procs, a.tag or time.strftime("%m%d-%H%M"), a.dry)
        if a.cmd == "select":
            return lane_fit.cmd_select(sub, a.tag, a.write)
        return lane_fit.cmd_eval(sub, a.keys, a.out, a.full)
    if a.cmd == "keytable":
        import lane_sheets
        from lane_common import read_gate

        text = lane_sheets.keytable(read_gate(a.gate), json.loads(pathlib.Path(a.rig).read_text()))
        if a.out:
            pathlib.Path(a.out).write_text(text, encoding="utf8")
        print(text)
        return 0
    if a.cmd == "clips":
        import lane_sheets
        from lane_common import read_gate

        made = lane_sheets.make_clips(read_gate(a.gate), pathlib.Path(a.on), pathlib.Path(a.off), pathlib.Path(a.out), [p for p in (a.poses or "").split(",") if p] or None)
        print(f"lane clips: {len(made)} clip(s) in {a.out}")
        return 0
    if a.cmd == "sheets":
        import lane_sheets

        registry = json.loads(pathlib.Path(a.registry or HERE / "lane-subjects.json").read_text())
        spec = registry["subjects"].get(a.subject) or {}
        wrote = lane_sheets.make_sheets(spec, pathlib.Path(a.clips), pathlib.Path(a.out), pathlib.Path(a.before) if a.before else None, [p for p in (a.before_poses or "").split(",") if p] or None)
        print(f"lane sheets: {len(wrote)} sheet(s) in {a.out}")
        return 0
    if a.cmd == "twin":
        import lane_twin
        return lane_twin.run(a.name, a.of, a.subject, a.art, a.run)
    if a.cmd == "framediff":
        import lane_diff
        return lane_diff.run(a.a, a.b, a.poses, a.every, a.out, a.floor, a.start)
    if a.cmd == "report":
        from lane_common import read_gate

        print(report(a.subject, read_gate(a.gate), json.loads(pathlib.Path(a.rig).read_text()) if a.rig else None))
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
