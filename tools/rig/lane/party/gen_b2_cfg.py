"""gen_b2_cfg.py <subject> : writes the party config of one more party figure (tools/rig/subjects/<subject>-b2.json): the `party` block only; prep.py derives the rest (the same split as gen_tidus_cfg.py,
gen_rikku_cfg.py and gen_v2_cfg.py). "b2" = the second batch of party rigs (2026-11-06): the rest of Chapter I's front line (FFX: Auron, Yuna, Kimahri) and Chapter IV's (FFX-2: Yuna in the White Mage dress,
Paine in the Warrior dress). Every figure is built the way rigs v3 built Tidus and Rikku (hand-read keypoints per pose, an exact retarget, a capsule partition snapped to the ink lines, every key a piece of its own
pose painting, underlap 28), from the keypoints file `tools/rig/subjects/<subject>-b2.keypoints.json`.

Game case (AGENTS.md rule 14): auron, yuna, kimahri are FFX only (Chapter I); yuna-white-mage and paine-warrior are FFX-2 only (Chapter IV). The tool is shared plumbing, both games.
Nothing here installs anything: the rig lands in the dev rig folder the party tools write to (`pfin.py`: `<dev rig folder>/<subject>-b2`) and is served to a recording by `record.mjs --alias <subject>=<subject>-b2`.
The normal-map folder (the maps lane's output) is named by the environment (`PYREFLY_ART_MAPS`), so no machine path is written into a committed file; the config this writes is the SOURCE only (prep.py expands it, and
writes the work folder's absolute mask paths into it: that expanded file is local build state, not for a commit).

    PYREFLY_ART_MAPS=<maps folder> <python> -I tools/rig/lane/party/gen_b2_cfg.py paine-warrior
"""
import json
import os
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parents[4]
SUBJECTS = REPO / "tools" / "rig" / "subjects"
RIGID = {"edge": 170, "inner": 340, "grow": 16}
LIMB = {"edge": 110, "inner": 220, "grow": 12}
HEAD_MESH = {"edge": 90, "inner": 180, "grow": 14}
KEY_MS = {"ready": 150, "attack": 70, "follow": 90, "hurt": 60, "cast": 150, "item": 140, "defend": 110, "victory": 220, "critical": 220, "sleep": 260, "ko": 420, "summon": 150, "jump": 120,
          "od-x2-warrior-armor-break": 80, "od-x2-warrior-power-break": 80}


def limb(side: str, radius: tuple, stub=None, bias: int = 6) -> dict:
    s = side
    d = {"caps": [[f"shoulder{s}", f"elbow{s}", radius[0]], [f"elbow{s}", f"hand{s}", radius[1]]], "bias": bias,
         "skin": {"type": "chain", "bones": [f"upperarm{s}", f"forearm{s}"], "joints": [f"shoulder{s}", f"elbow{s}", f"hand{s}"], "ramps": [26], "mesh": LIMB}}
    if stub:
        d["stub"] = stub
    return d


def leg(side: str, radius: tuple) -> dict:
    s = side
    return {"caps": [["pelvis", f"knee{s}", radius[0]], [f"knee{s}", f"foot{s}", radius[1]], [f"foot{s}", f"toe{s}", radius[2]]],
            "skin": {"type": "chain", "bones": [f"thigh{s}", f"shin{s}"], "joints": ["pelvis", f"knee{s}", f"toe{s}"], "ramps": [30], "mesh": LIMB}}


# per figure: what differs from the common humanoid-with-a-weapon template. `poses` are the keys (not the idle); the twirl-* dress-change frames are exempt (the gate's `exempt`), a pose with no key makes the figure
# stay a painting (RigLoad: full coverage), so every painted pose of the figure is listed.
FIGURES = {
    "paine-warrior": {
        "note": "FFX-2 only (Chapter IV, Paine in the Warrior dress).",
        "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "defend", "sleep", "ko", "od-x2-warrior-armor-break", "od-x2-warrior-power-break"],
        "idle_hidden": ["shoulderB", "elbowB", "handB"], "swordPivotD": 100, "waistT": 0.3,
        "head": [[["neck", "head", 55], ["head", "crown", 85]], 30], "torso": [["neck", "waist", 85]], "hips": [[["waist", "pelvis", 85], ["pelvis", 100]], 8],
        "armA": (40, 38), "armB": (38, 36, [225, 330]), "legA": (55, 52, 48), "legB": (55, 52, 48), "sword": 70,
    },
    # a long robe with a hood: the hem point (the robe's lower edge, every pose) lets the hips piece carry the whole skirt (as Rikku's), the legs show only below it; the "staff" is her racket-headed weapon (pommel = the
    # handle's end, tip = the far end of the head), so its capsule is thick enough for the head's ellipse.
    "yuna-white-mage": {
        "note": "FFX-2 only (Chapter IV, Yuna in the White Mage dress).",
        "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "defend", "sleep", "ko"],
        "idle_hidden": ["shoulderB", "elbowB", "handB"], "swordPivotD": 90, "waistT": 0.35,
        "head": [[["neck", "head", 75], ["head", "crown", 105]], 30], "torso": [["neck", "waist", 105]], "hips": [[["waist", "pelvis", 100], ["pelvis", 115], ["pelvis", "hem", 165]], 8],
        "armA": (55, 50), "armB": (50, 45, [405, 330]), "legA": (50, 45, 45), "legB": (50, 45, 45), "sword": 95,
    },
    # a long coat (the hem point carries it with the hips piece); the katana's capsule runs from the hilt's end (or the sheath's, where the painting shows the sheath apart from the blade) to the blade's tip; the empty
    # left sleeve of the idle is drawn, so no arm is hidden there.
    "auron": {
        "note": "FFX only (Chapter I, Auron).",
        "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "sleep", "ko"],
        "idle_hidden": [], "swordPivotD": 150, "waistT": 0.4,
        "head": [[["neck", "head", 65], ["head", "crown", 90]], 30], "torso": [["neck", "waist", 100]], "hips": [[["waist", "pelvis", 100], ["pelvis", 115], ["pelvis", "hem", 150]], 8],
        "armA": (55, 50), "armB": (50, 45), "legA": (50, 45, 45), "legB": (50, 45, 45), "sword": 55,
    },
    # Yuna's long hakama skirt (the hem point) and detached sleeves; her staff (ring head at one end, pointed butt at the other): pommel = the butt, tip = the head. `summon` is painted for her in FFX, so it is a key too.
    "yuna": {
        "note": "FFX only (Chapter I, Yuna).",
        "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "sleep", "summon", "ko"],
        "idle_hidden": [], "swordPivotD": 120, "waistT": 0.4,
        "head": [[["neck", "head", 60], ["head", "crown", 85]], 30], "torso": [["neck", "waist", 95]], "hips": [[["waist", "pelvis", 95], ["pelvis", 115], ["pelvis", "hem", 150]], 8],
        "armA": (50, 45), "armB": (50, 45), "legA": (50, 45, 45), "legB": (50, 45, 45), "sword": 90,
    },
}


def build(subject: str) -> dict:
    MAPS = os.environ.get("PYREFLY_ART_MAPS")
    if not MAPS:
        raise SystemExit("gen_b2_cfg: set PYREFLY_ART_MAPS to the normal-map folder (the maps lane's output)")
    f = FIGURES[subject]
    ab = f["armB"]
    parts = {
        "head": {"caps": f["head"][0], "bias": f["head"][1], "skin": {"type": "rigid", "bone": "head", "mesh": HEAD_MESH}, "variant": {"opaqueArea": 1.0, "meshArea": 1.0, "tex": 0.6, "growMax": 60}},
        "torso": {"caps": f["torso"], "skin": {"type": "rigid", "bone": "chest", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
        "hips": {"caps": f["hips"][0], "bias": f["hips"][1], "skin": {"type": "rigid", "bone": "pelvis", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
        "armA": limb("A", f["armA"], bias=12),
        "armB": limb("B", ab[:2], stub=ab[2] if len(ab) > 2 else None),
        "legA": leg("A", f["legA"]),
        "legB": leg("B", f["legB"]),
        "sword": {"caps": [["pommel", "tip", f["sword"]]], "bias": 28, "base_tex": 0.25, "skin": {"type": "rigid", "bone": "sword", "mesh": {"edge": 220, "inner": 440, "grow": 16}}, "variant": {"tex": 0.25, "mesh": {"quad": True}}},
    }
    party = {
        "keypoints": f"tools/rig/subjects/{subject}-b2.keypoints.json",
        "poses": f["poses"],
        "swordPivotD": f["swordPivotD"], "idle_hidden": f["idle_hidden"], "underlap": 28, "underlap_idle": 5, "margin": 15, "pad": 600, "waistT": f.get("waistT", 0.25),
        "order": ["legB", "hips", "legA", "armB", "torso", "sword", "armA", "head"],
        "parts": parts,
        "normals": {"dir": MAPS, "scale": 0.26},
        "variant_defaults": {"tex": 0.4}, "base_tex": 0.4,
        "skeleton": [["root", None, "ground"], ["pelvis", "root", "pelvis", ["hips", "legA", "legB"]], ["chest", "pelvis", "waist", ["torso", "hips"]], ["head", "chest", "neck", ["head", "torso"]],
                     ["upperarmA", "chest", "shoulderA", ["armA", "torso"]], ["forearmA", "upperarmA", "elbowA", ["armA"]], ["upperarmB", "chest", "shoulderB", ["armB", "torso"]], ["forearmB", "upperarmB", "elbowB", ["armB"]],
                     ["thighA", "pelvis", "pelvis", ["hips", "legA", "legB"]], ["shinA", "thighA", "kneeA", ["legA"]], ["thighB", "pelvis", "pelvis", ["hips", "legA", "legB"]], ["shinB", "thighB", "kneeB", ["legB"]], ["sword", "root", "swordPivot"]],
        "aim": {"pelvis": "neck", "chest": "neck", "head": "headTop", "upperarmA": "elbowA", "forearmA": "handA", "upperarmB": "elbowB", "forearmB": "handB", "thighA": "kneeA", "shinA": "footA", "thighB": "kneeB", "shinB": "footB", "sword": "tip"},
        "place": {"pelvis": "pelvis", "chest": "waist", "forearmA": "elbowA", "forearmB": "elbowB", "shinA": "kneeA", "shinB": "kneeB", "upperarmA": "shoulderA", "upperarmB": "shoulderB", "head": "neck", "sword": "swordPivot"},
        "noscale": ["head", "pelvis", "chest"], "exact_aim": ["head"],
        "joint_points": {"pelvis": "pelvis", "chest": "waist", "head": "neck", "upperarmA": "shoulderA", "forearmA": "elbowA", "upperarmB": "shoulderB", "forearmB": "elbowB", "thighA": "pelvis", "shinA": "kneeA", "thighB": "pelvis", "shinB": "kneeB", "sword": "swordPivot"},
        "scales": {"chest": [0.7, 1.4], "upperarmA": [0.4, 2.2], "forearmA": [0.4, 2.2], "upperarmB": [0.4, 2.2], "forearmB": [0.4, 2.2], "thighA": [0.5, 1.9], "shinA": [0.5, 1.9], "thighB": [0.5, 1.9], "shinB": [0.5, 1.9], "sword": [0.3, 3.0]},
        "landmarks": {"head": ["head", "head"], "crown": ["head", "crown"], "neck": ["head", "neck"], "pelvis": ["pelvis", "pelvis"], "handA": ["forearmA", "handA"], "handB": ["forearmB", "handB"], "pommel": ["sword", "pommel"], "tip": ["sword", "tip"]},
        "key_motion": {p: {"ms": KEY_MS.get(p, 120), "fadeMs": 0} for p in f["poses"]},
        "idle_key": {"ms": 120, "fadeMs": 0},
        "joint_discs": [], "disc_margin": 14,
        "marks": ["pelvis", "handA", "pommel", "tip"],
        "motion": {"idle": {"hz": 0.5, "bones": {"pelvis": {"rot": 0.4, "dy": 3.0, "phase": 0.2}, "chest": {"rot": 1.2, "phase": -0.8}, "head": {"rot": 1.6, "phase": -1.5}, "upperarmA": {"rot": 1.0, "phase": -1.4},
                                                  "forearmA": {"rot": 0.8, "phase": -2.0}, "sword": {"rot": 0.5, "phase": -1.2}}}},
    }
    return {"_party": f"party rig, batch 2 (tools/rig/lane/party/gen_b2_cfg.py; the `party` block is the source, prep.py writes cut/build/landmarks/fit/motion from it). {f['note']}",
            "subject": subject, "scale": 2, "costume": {"pose": "idle"}, "party": party}


def main(argv: list[str]) -> int:
    subject = argv[0]
    cfg = build(subject)
    out = SUBJECTS / f"{subject}-b2.json"
    out.write_text(json.dumps(cfg, indent=1), encoding="utf8")
    print(f"wrote {out} ({len(json.dumps(cfg))} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
