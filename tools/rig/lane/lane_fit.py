"""Fit, select and merge (the lane kit; the rig program, 2026-10-18; both games). What Lulu's lane did by hand in 103 batches and 14 rounds: `fitbatch.sh` (one work folder a batch, so batches do not
overwrite each other's `fit/keys.json`), `select_best.py` (a rig per candidate, exported and gated, the highest gate overlap with no other flag wins), `claims.py` (a key's recorded `fit` is a
claim the gate compares with its own reading: rewrite it to the reading), `mergekeys.py` and `evalrig.sh`. The pure functions here are unit-tested (`test_lane.py`); the rest runs the pipeline.

    lane.py fit    --subject S [--poses all|a,b] [--seeds 3] [--procs 8] [--tag T] [--dry]        the sweep: one batch a pose and seed, in parallel, at below-normal priority, under a fit slot
    lane.py select --subject S --tag T [--write]                                                   candidate i of every pose -> one rig -> the gate; the best a pose; claims rewritten; the table
    lane.py eval   --subject S --keys K.json [--out DIR] [--full]                                  export a keys file and gate it (evalrig / gaterun): the table

`--subject` is the CONFIG's name (`tools/rig/subjects/<name>.json`). Work folders: `<work>/lane/<tag>/<pose>-s<seed>/` (a copy of build and targets, the fitter's output) and
`<work>/lane/<tag>/` for the selection (`selected-keys.json`, `gate-<i>.json`, `table.txt`). Nothing is written under public/art or the rig root until `select --write` merges into `<work>/fit/keys.json`.
"""
from __future__ import annotations

import json
import pathlib
import shutil
import time

from lane_common import FitSlots, gate_cmd, popen_low, read_gate, rig_cmd, say, write_json

OTHER_THAN_OVERLAP = "key-iou"


# --------------------------------------------------------------------------------------------------------------------------------------------------------------- pure


def plan_jobs(poses: list[str], seeds: int) -> list[tuple[str, int]]:
    """One job a pose and seed, poses in the order given (seed 1 of every pose first, so a short run still covers every pose)."""
    return [(p, s) for s in range(1, seeds + 1) for p in poses]


def job_name(pose: str, seed: int) -> str:
    return f"{pose}-s{seed}"


def failure_codes_by_pose(gate: dict) -> dict[str, list[str]]:
    """The gate's failure codes by pose; a blend failure (`a>b`) counts against both poses."""
    out: dict[str, list[str]] = {}
    for f in gate.get("failures", []):
        for p in str(f.get("pose") or "").split(">"):
            if p:
                out.setdefault(p, []).append(f["code"])
    return out


def judge(gate: dict) -> dict[str, dict]:
    """Per pose, what the gate read: overlap, the failure codes other than the overlap bar, the worst landmark, the stature."""
    codes = failure_codes_by_pose(gate)
    out = {}
    for k in gate.get("keys", []):
        if k["pose"] == "idle":
            continue
        out[k["pose"]] = {"iou": k.get("iou"), "codes": [c for c in codes.get(k["pose"], []) if c != OTHER_THAN_OVERLAP], "landmarkMax": k.get("landmarkMax"), "stature": k.get("statureRead")}
    return out


def assemble(cands: dict[str, list[dict]], i: int) -> dict:
    """Rig number `i`: candidate `i` of every pose (a pose with fewer candidates repeats its last)."""
    return {p: lst[min(i, len(lst) - 1)]["key"] for p, lst in cands.items() if lst}


def pick(results: list[tuple[int, dict]]) -> int:
    """Among one pose's per-rig readings `(candidate index, judge entry)`: the highest overlap with no other flag; with none clean, the highest overlap."""
    clean = [r for r in results if not r[1]["codes"]]
    pool = clean or results
    return max(pool, key=lambda r: (r[1]["iou"] if r[1]["iou"] is not None else -1.0))[0]


def select_best(cands: dict[str, list[dict]], evaluate) -> tuple[dict, dict[str, dict]]:
    """For each pose the candidate the GATE reads best. `evaluate(keys) -> gate report` exports and gates one assembled rig. Returns the chosen keys and, a pose, `{candidate, readings}`."""
    n = max((len(v) for v in cands.values()), default=0)
    readings: dict[str, list[tuple[int, dict]]] = {p: [] for p in cands}
    for i in range(n):
        j = judge(evaluate(assemble(cands, i)))
        for p in cands:
            if p in j:
                readings[p].append((min(i, len(cands[p]) - 1), j[p]))
    chosen, detail = {}, {}
    for p, res in readings.items():
        if not res:
            continue
        c = pick(res)
        chosen[p] = cands[p][c]["key"]
        detail[p] = {"candidate": c, "source": cands[p][c].get("from"), "readings": [(i, r["iou"], r["codes"]) for i, r in res]}
    return chosen, detail


def rewrite_claims(keys: dict, gate: dict) -> tuple[dict, list[str]]:
    """A key's `fit` is a claim, not a reading (the gate fails `key-fit-stale` past 0.05 of overlap and 0.04 of stature): set each claim to the gate's reading. A key with no `fit` stays without."""
    read = {k["pose"]: k for k in gate.get("keys", [])}
    changes = []
    for pose, key in keys.items():
        r = read.get(pose)
        if not r or "fit" not in key or r.get("iou") is None:
            continue
        old = dict(key["fit"])
        key["fit"]["iou"] = round(float(r["iou"]), 4)
        if r.get("statureRead") is not None:
            key["fit"]["stature"] = round(float(r["statureRead"]), 4)
        if old != key["fit"]:
            changes.append(f"{pose}: claim {old} -> {key['fit']}")
    return keys, changes


def merge_keys(base: dict, chosen: dict) -> dict:
    """The chosen keys over the base keys (a pose the sweep did not touch keeps its key)."""
    out = {**base}
    out.update(chosen)
    return out


def table_rows(gate: dict, rig: dict | None = None) -> list[dict]:
    """The one table a fit returns: pose, source (painted or authored), gate overlap, worst landmark, stature, feet, holes."""
    bad = set((gate.get("holes") or {}).get("keysWithHoles") or [])
    rows = []
    for k in gate.get("keys", []):
        key = (rig or {}).get("keys", {}).get(k["pose"], {})
        if k["pose"] == "idle":
            src = "costume"
        elif k.get("authored") or key.get("source") == "authored":
            src = "authored" + (" (turned)" if k.get("turned") else "")
        else:
            src = "painted" + (" (turned)" if k.get("turned") else "")
        fe = k.get("feet") or {}
        rows.append({"pose": k["pose"], "source": src, "iou": k.get("iou"), "landmarkMax": k.get("landmarkMax"), "stature": k.get("statureRead"), "feetDx": fe.get("dx"), "feetDy": fe.get("dy"),
                     "holes": 1 if k["pose"] in bad else 0, "flags": list(k.get("flags") or []), "ok": bool(k.get("ok"))})
    return rows


def format_table(gate: dict, rig: dict | None = None) -> str:
    n = lambda v, w=7: f"{v:{w}.3f}" if isinstance(v, (int, float)) else f"{'-':>{w}}"  # noqa: E731
    head = f"rig {gate.get('subject')}  gate {str(gate.get('status')).upper()}  ({sum(1 for k in gate.get('keys', []) if k.get('ok'))} of {len(gate.get('keys', []))} keys pass)  uncovered: {gate.get('uncovered') or 'none'}"
    lines = [head, f"{'pose':9s} {'source':18s} {'overlap':>7s} {'lm worst':>8s} {'stature':>7s} {'feet dx':>7s} {'feet dy':>7s} {'holes':>5s}  flags"]
    for r in table_rows(gate, rig):
        lines.append(f"{r['pose']:9s} {r['source']:18s} {n(r['iou'])} {n(r['landmarkMax'], 8)} {n(r['stature'])} {n(r['feetDx'])} {n(r['feetDy'])} {r['holes']:5d}  {','.join(r['flags'])}{'' if r['ok'] else ' FAIL'}")
    h = gate.get("holes") or {}
    if h:
        lines.append(f"holes: {h.get('rendered')} poses scanned at {len(h.get('joints') or [])} joints; blends with a hole {h.get('blendsWithHoles')}")
    return "\n".join(lines)


# --------------------------------------------------------------------------------------------------------------------------------------------------------------- impure


def lane_root(sub, tag: str) -> pathlib.Path:
    return sub.work / "lane" / tag


def target_poses(sub) -> list[str]:
    """The poses the fitter has a target for (every pose the game paints the figure in), minus the costume pose: `<work>/targets/targets.json`, made by `rig.py fit-keys` or `rig-targets.mjs`."""
    f = sub.work / "targets" / "targets.json"
    if not f.exists():
        raise SystemExit(f"lane fit: {f} is missing: run `rig.py fit-keys --subject {sub.name} --poses {sub.costume_pose}` once to make the targets")
    return [p for p, info in json.loads(f.read_text())["poses"].items() if p != sub.costume_pose and info.get("class") not in ("part", "staged", "wide")]


def cmd_fit(sub, poses: list[str] | None, seeds: int, procs: int, tag: str, dry: bool = False) -> int:
    poses = poses or target_poses(sub)
    jobs = plan_jobs(poses, seeds)
    root = lane_root(sub, tag)
    say(f"lane fit: {len(jobs)} job(s) ({len(poses)} pose(s) x {seeds} seed(s)), {procs} at a time, in {root}")
    if dry:
        for p, s in jobs:
            say(f"  {job_name(p, s)}")
        return 0
    slots = FitSlots()
    slot = slots.acquire(f"{sub.name} fit {tag}")
    if slot is None:
        raise SystemExit("lane fit: both fit slots are taken (two lanes are already fitting): wait for one to finish; a fit phase takes the whole machine")
    try:
        running: list[tuple[str, int, object]] = []
        queue = list(jobs)
        done = failed = 0
        t0 = time.time()
        while queue or running:
            while queue and len(running) < procs:
                pose, seed = queue.pop(0)
                jr = root / job_name(pose, seed)
                (jr / sub.name).mkdir(parents=True, exist_ok=True)
                for part in ("build", "targets"):
                    if (sub.work / part).exists() and not (jr / sub.name / part).exists():
                        shutil.copytree(sub.work / part, jr / sub.name / part)
                log = open(jr / "fit.log", "w")
                running.append((pose, seed, popen_low(rig_cmd("fit-keys", "--subject", sub.name, "--poses", pose, "--seed", str(seed)), env={"RIG_WORK": str(jr)}, stdout=log)))
            time.sleep(2)
            for item in list(running):
                if item[2].poll() is not None:
                    running.remove(item)
                    done += 1
                    ok = (root / job_name(item[0], item[1]) / sub.name / "fit" / "keys.json").exists()
                    failed += 0 if ok else 1
                    say(f"  {job_name(item[0], item[1]):24s} {'kept' if ok else 'no key (under the bar, or failed: see fit.log)'}  [{done}/{len(jobs)}, {time.time() - t0:.0f} s]")
        say(f"lane fit: done, {failed} job(s) kept no key. Next: lane.py select --subject {sub.name} --tag {tag}")
        return 0
    finally:
        slots.release()


def candidates(sub, tag: str) -> dict[str, list[dict]]:
    """Every kept key of the sweep: `{pose: [{key, report, from}]}`."""
    out: dict[str, list[dict]] = {}
    for d in sorted(lane_root(sub, tag).glob(f"*/{sub.name}/fit")):
        if not (d / "keys.json").exists():
            continue
        keys = json.loads((d / "keys.json").read_text())
        rep = json.loads((d / "fit_report.json").read_text()) if (d / "fit_report.json").exists() else {}
        for pose, key in keys.items():
            out.setdefault(pose, []).append({"key": key, "report": rep.get(pose, {}), "from": d.parent.parent.name})
    return out


def evaluate_rig(sub, keys: dict, out: pathlib.Path, partial: bool = True) -> dict:
    """Export `keys` with the CURRENT build to `out/rig` and gate it (`out/gate.json`): the old evalrig.sh / gaterun.sh. Returns the gate report."""
    work = out / "work"
    (work / sub.name / "fit").mkdir(parents=True, exist_ok=True)
    if not (work / sub.name / "build").exists():
        shutil.copytree(sub.work / "build", work / sub.name / "build")
    write_json(work / sub.name / "fit" / "keys.json", keys, indent=None)
    rigdir = out / "rig"
    env = {"RIG_WORK": str(work)}
    p = popen_low(rig_cmd("export", "--subject", sub.name, "--no-gate", "--out", str(rigdir)), env=env)
    if p.wait() != 0:
        raise SystemExit(f"lane: export of {sub.name} failed")
    report = out / "gate.json"
    args = gate_cmd(rigdir, sub.art, "--json", str(report), "--max", "200", *(["--allow-partial"] if partial else []))
    popen_low(args).wait()  # exit 1 is a refusal: the report says why
    return read_gate(report)


def cmd_select(sub, tag: str, write: bool) -> int:
    cands = candidates(sub, tag)
    if not cands:
        raise SystemExit(f"lane select: no kept key under {lane_root(sub, tag)} (run lane.py fit first)")
    root = lane_root(sub, tag)
    n = [0]

    def evaluate(keys: dict) -> dict:
        n[0] += 1
        return evaluate_rig(sub, keys, root / f"sel{n[0] - 1}", partial=True)

    say(f"lane select: {sum(len(v) for v in cands.values())} candidate(s) over {len(cands)} pose(s)")
    chosen, detail = select_best(cands, evaluate)
    final = evaluate_rig(sub, chosen, root / "final", partial=True)
    chosen, changes = rewrite_claims(chosen, final)
    for c in changes:
        say("  " + c)
    for p, d in sorted(detail.items()):
        say(f"  {p:9s} candidate {d['candidate']} from {d['source']}  (all: {d['readings']})")
    write_json(root / "selected-keys.json", chosen)
    table = format_table(final)
    (root / "table.txt").write_text(table + "\n", encoding="utf8")
    say(table)
    if write:
        keys_file = sub.work / "fit" / "keys.json"
        base = json.loads(keys_file.read_text()) if keys_file.exists() else {}
        write_json(keys_file, merge_keys(base, chosen), indent=None)
        say(f"lane select: merged {len(chosen)} key(s) into {keys_file}")
    else:
        say(f"lane select: not merged (--write merges into {sub.work / 'fit' / 'keys.json'}); the choice is {root / 'selected-keys.json'}")
    return 0


def cmd_eval(sub, keys_file: str, out: str | None, full: bool) -> int:
    keys = json.loads(pathlib.Path(keys_file).read_text())
    o = pathlib.Path(out) if out else sub.work / "lane" / "eval"
    g = evaluate_rig(sub, keys, o, partial=not full)
    rig = json.loads((o / "rig" / "rig.json").read_text())
    table = format_table(g, rig)
    (o / "table.txt").write_text(table + "\n", encoding="utf8")
    say(table)
    return 0 if g.get("status") == "ok" else 1
