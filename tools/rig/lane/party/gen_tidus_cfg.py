"""Writes the Tidus party config (tools/rig/subjects/tidus-x.json): the `party` block only; prep.py derives the rest. FFX only (Chapter I; the actor tidus)."""
import json, pathlib
REPO = pathlib.Path(__file__).resolve().parents[4]
RIGID = {"edge": 170, "inner": 340, "grow": 16}
LIMB = {"edge": 110, "inner": 220, "grow": 12}
cfg = {
 "_party": "party rig (tools/rig/lane/party/README.md): the `party` block is the source; prep.py writes cut/build/landmarks/fit/motion from it. FFX only (Chapter I).",
 "subject": "tidus", "scale": 2, "costume": {"pose": "idle"},
 "party": {
  "keypoints": "tools/rig/subjects/tidus-x.keypoints.json",
  "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "defend", "sleep", "ko", "od-energy-rain", "od-slice-and-dice"],
  "swordPivotD": 80, "idle_hidden": [], "underlap": 12, "underlap_idle": 5, "margin": 15, "pad": 600, "waistT": 0.25,
  "order": ["fx", "legB", "hips", "legA", "armB", "torso", "sword", "armA", "head"],
  "fx": {"cast": {
      "ring": {"ellipse": [265, 1047, 262, 72], "keep": [["kneeA", "footA", 60], ["footA", [400, 975], 52], ["kneeB", "footB", 58], ["footB", [178, 1032], 52], ["pommel", "tip", 44]]},
      "swirl": {"box": [360, 0, 709, 560], "keep": [["head", "crown", 105], ["neck", "shoulderB", 64], ["shoulderB", "elbowB", 52], ["elbowB", "handB", 46], ["handB", [588, 188], 30], ["handB", [505, 192], 22], ["neck", "pelvis", 66]]}}},
  "parts": {
   "fx": {"fx": True, "caps": [], "stub": "pelvis", "skin": {"type": "rigid", "bone": "root", "mesh": RIGID}, "variant": {"mesh": {"quad": True}, "tex": 0.4}},
   "head": {"caps": [["neck", "head", 60], ["head", "crown", 92]], "bias": 30, "skin": {"type": "rigid", "bone": "head", "mesh": {"edge": 90, "inner": 180, "grow": 14}},
            "variant": {"opaqueArea": 1.0, "meshArea": 1.0, "tex": 0.6, "growMax": 60}},
   "torso": {"caps": [["neck", "waist", 88]], "skin": {"type": "rigid", "bone": "chest", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
   "hips": {"caps": [["waist", "pelvis", 82], ["pelvis", 100]], "bias": 8, "skin": {"type": "rigid", "bone": "pelvis", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
   "armA": {"caps": [["shoulderA", "elbowA", 38], ["elbowA", "handA", 36]], "bias": 12, "skin": {"type": "chain", "bones": ["upperarmA", "forearmA"], "joints": ["shoulderA", "elbowA", "handA"], "ramps": [26], "mesh": LIMB}},
   "armB": {"caps": [["shoulderB", "elbowB", 36], ["elbowB", "handB", 34]], "bias": 6, "skin": {"type": "chain", "bones": ["upperarmB", "forearmB"], "joints": ["shoulderB", "elbowB", "handB"], "ramps": [26], "mesh": LIMB}},
   "legA": {"caps": [["pelvis", "kneeA", 58], ["kneeA", "footA", 44], ["footA", "toeA", 40]], "skin": {"type": "chain", "bones": ["thighA", "shinA"], "joints": ["pelvis", "kneeA", "toeA"], "ramps": [30], "mesh": LIMB}},
   "legB": {"caps": [["pelvis", "kneeB", 58], ["kneeB", "footB", 44], ["footB", "toeB", 40]], "skin": {"type": "chain", "bones": ["thighB", "shinB"], "joints": ["pelvis", "kneeB", "toeB"], "ramps": [30], "mesh": LIMB}},
   "sword": {"caps": [["pommel", "tip", 52]], "bias": 26, "base_tex": 0.25, "skin": {"type": "rigid", "bone": "sword", "mesh": {"edge": 220, "inner": 440, "grow": 16}}, "variant": {"tex": 0.25, "mesh": {"quad": True}}},
  },
  "normals": {"dir": "D:/pyrefly-art-maps", "scale": 0.26},
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
  "key_motion": {"ready": {"ms": 150, "fadeMs": 0}, "attack": {"ms": 70, "fadeMs": 0}, "follow": {"ms": 90, "fadeMs": 0}, "hurt": {"ms": 60, "fadeMs": 0}, "cast": {"ms": 150, "fadeMs": 0}, "item": {"ms": 140, "fadeMs": 0}, "defend": {"ms": 110, "fadeMs": 0}, "victory": {"ms": 220, "fadeMs": 0}, "critical": {"ms": 220, "fadeMs": 0}, "sleep": {"ms": 260, "fadeMs": 0}, "ko": {"ms": 420, "fadeMs": 0}, "od-energy-rain": {"ms": 120, "fadeMs": 0}, "od-slice-and-dice": {"ms": 80, "fadeMs": 0}},
  "idle_key": {"ms": 120, "fadeMs": 0},
  "joint_discs": [], "disc_margin": 14,
  "marks": ["pelvis", "handA", "pommel", "tip"],
  "motion": {"idle": {"hz": 0.5, "bones": {"pelvis": {"rot": 0.4, "dy": 3.0, "phase": 0.2}, "chest": {"rot": 1.2, "phase": -0.8}, "head": {"rot": 1.6, "phase": -1.5}, "upperarmA": {"rot": 1.0, "phase": -1.4}, "forearmA": {"rot": 0.8, "phase": -2.0}, "upperarmB": {"rot": 0.8, "phase": -1.0}, "sword": {"rot": 0.5, "phase": -1.2}}}}
 }
}
(REPO / "tools/rig/subjects/tidus-x.json").write_text(json.dumps(cfg, indent=1), encoding="utf8")
print("wrote tidus-x.json")
