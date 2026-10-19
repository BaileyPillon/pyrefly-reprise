"""The twin command (the lane kit; the rig program, 2026-10-18; both games). A silhouette TWIN is a subject whose paintings have the same silhouettes as an already-rigged subject's (the census:
Grothia/Ifrit, Pterya/Valefor, Spathi/Bahamut, X2 Shiva/Shiva, X2 Ixion/Ixion, X2 Anima/Anima, Seymour Macalania/Seymour Guest, and the hidden-chapter `exp-leblanc-*` copies of dresspheres: IoU 0.98
to 1.00 over idle, attack and KO). The cut config and the keys of the rigged subject carry over: the twin is the SAME cut re-run on its own idle (a new costume sha) with the keys copied, and the gate
re-measures all of it.

    lane.py twin <twin config name> --of <rigged config name> [--subject <twin art id>] [--art DIR] [--run]

Without `--run` it writes the config and prints what it would do. With `--run`: `cut`, `build`, the base keys into the twin's work folder (their `fit` claims dropped: a claim is the pipeline's, the gate
reads its own), `export` (which gates). A twin that the gate refuses is not a twin of that rig (its idle overlaps the rigged subject's rest pose by less than 0.95, or a key lands off its painting):
read the gate's words, then cut it as a subject of its own. A config that cut with SAM prompts needs masks of the twin's idle (`rig.py cut --sam`, the GPU): the twin command says so.
"""
from __future__ import annotations

import copy
import json
import pathlib

from lane_common import REPO, popen_low, rig_cmd, say, write_json


def twin_config(base: dict, twin_id: str, base_name: str, art: str | None = None) -> dict:
    """The twin's config: the base's, with its own subject id (and art folder when it has one of its own). The hooks, the cut, the build, the marks and the limits are the base's."""
    cfg = copy.deepcopy(base)
    cfg["_twin_of"] = base_name
    cfg["subject"] = twin_id
    if art:
        cfg["art"] = art
    if isinstance(cfg.get("hooks"), str) and cfg["hooks"].startswith(f"{base.get('subject')}_"):
        pass  # the base's hook module serves the twin: it reads the twin's own painting through `state.sub`, and names no subject
    return cfg


def twin_keys(keys: dict) -> dict:
    """The base's keys for the twin: every bone transform as it is; the recorded `fit` claims dropped (they are the base's readings, not the twin's)."""
    out = copy.deepcopy(keys)
    for k in out.values():
        k.pop("fit", None)
    return out


def needs_sam(cfg: dict) -> bool:
    return bool((cfg.get("sam") or {}).get("parts")) and any("sam" in json.dumps(p) for p in (cfg.get("cut") or {}).get("parts", {}).values())


def run(name: str, of: str, subject: str | None, art: str | None, do_run: bool, subjects_dir: pathlib.Path | None = None) -> int:
    from rig_common import SUBJECTS, WORK_ROOT, Subject

    sd = pathlib.Path(subjects_dir) if subjects_dir else SUBJECTS
    base_path = sd / f"{of}.json"
    if not base_path.exists():
        raise SystemExit(f"lane twin: no rigged config {base_path}")
    base = json.loads(base_path.read_text(encoding="utf8"))
    twin_id = subject or name
    cfg = twin_config(base, twin_id, of, art)
    dest = sd / f"{name}.json"
    if dest.exists():
        raise SystemExit(f"lane twin: {dest} exists")
    base_keys = WORK_ROOT / of / "fit" / "keys.json"
    plan = [f"write {dest}", f"cut --subject {name}{' --sam   (the base was cut with SAM prompts: the twin needs masks of its own idle)' if needs_sam(base) else ''}", f"build --subject {name}",
            f"copy {base_keys} (claims dropped) -> {WORK_ROOT / name / 'fit' / 'keys.json'}", f"export --subject {name}   (runs the gate)"]
    say(f"lane twin: {name} (art id {twin_id}) of {of}:")
    for p in plan:
        say("  - " + p)
    if not do_run:
        say("  (--run does it)")
        return 0
    if not base_keys.exists():
        raise SystemExit(f"lane twin: the base has no keys at {base_keys}")
    write_json(dest, cfg, indent=2)
    sub = Subject(name)
    for step in ("cut", "build"):
        args = [step, "--subject", name] + (["--sam"] if step == "cut" and needs_sam(base) else [])
        if popen_low(rig_cmd(*args), cwd=REPO).wait() != 0:
            raise SystemExit(f"lane twin: {step} failed")
    write_json(sub.work / "fit" / "keys.json", twin_keys(json.loads(base_keys.read_text())), indent=None)
    return popen_low(rig_cmd("export", "--subject", name), cwd=REPO).wait()
