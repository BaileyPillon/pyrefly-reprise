"""Writes the Rikku Dark Knight party config (tools/rig/subjects/rikku-dark-knight-x.json): the `party` block only; prep.py derives the rest. FFX-2 only (Chapter IV; the actor rikku in the dark-knight dressphere).
The dressphere's cast, item and ko fall to the idle when unpainted (D-179); all three are painted here, and the twirl-* dressphere-change frames stay exempt (the gate's `exempt`)."""
import json, pathlib
REPO = pathlib.Path(__file__).resolve().parents[4]
RIGID = {"edge": 170, "inner": 340, "grow": 16}
LIMB = {"edge": 110, "inner": 220, "grow": 12}
cfg = {
 "_party": "party rig (tools/rig/lane/party/README.md): the `party` block is the source; prep.py writes cut/build/landmarks/fit/motion from it. FFX-2 only (Chapter IV, the Dark Knight dressphere).",
 "subject": "rikku-dark-knight", "scale": 2, "costume": {"pose": "idle"},
 "party": {
  "keypoints": "tools/rig/subjects/rikku-dark-knight-x.keypoints.json",
  "poses": ["ready", "attack", "follow", "victory", "cast", "item", "hurt", "critical", "sleep", "ko"],
  "swordPivotD": 120, "idle_hidden": ["shoulderB", "elbowB", "handB"], "underlap": 8, "underlap_idle": 5, "margin": 15, "pad": 600, "waistT": 0.25,
  "order": ["legB", "hips", "legA", "armB", "torso", "sword", "armA", "head"],
  "parts": {
   "head": {"caps": [["neck", "head", 55], ["head", "crown", 85], ["head", "hairTip", 42]], "bias": 30, "skin": {"type": "rigid", "bone": "head", "mesh": {"edge": 90, "inner": 180, "grow": 14}},
            "variant": {"opaqueArea": 1.0, "meshArea": 1.0, "tex": 0.6, "growMax": 60}},
   "torso": {"caps": [["neck", "waist", 85]], "skin": {"type": "rigid", "bone": "chest", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
   "hips": {"caps": [["waist", "pelvis", 85], ["pelvis", 100], ["pelvis", "hem", 55]], "bias": 8, "skin": {"type": "rigid", "bone": "pelvis", "mesh": RIGID}, "variant": {"mesh": {"quad": True}}},
   "armA": {"caps": [["shoulderA", "elbowA", 40], ["elbowA", "handA", 38]], "bias": 12, "skin": {"type": "chain", "bones": ["upperarmA", "forearmA"], "joints": ["shoulderA", "elbowA", "handA"], "ramps": [26], "mesh": LIMB}},
   "armB": {"stub": [250, 350], "caps": [["shoulderB", "elbowB", 38], ["elbowB", "handB", 36]], "bias": 6, "skin": {"type": "chain", "bones": ["upperarmB", "forearmB"], "joints": ["shoulderB", "elbowB", "handB"], "ramps": [26], "mesh": LIMB}},
   "legA": {"caps": [["pelvis", "kneeA", 52], ["kneeA", "footA", 44], ["footA", "toeA", 40]], "skin": {"type": "chain", "bones": ["thighA", "shinA"], "joints": ["pelvis", "kneeA", "toeA"], "ramps": [30], "mesh": LIMB}},
   "legB": {"caps": [["pelvis", "kneeB", 52], ["kneeB", "footB", 44], ["footB", "toeB", 40]], "skin": {"type": "chain", "bones": ["thighB", "shinB"], "joints": ["pelvis", "kneeB", "toeB"], "ramps": [30], "mesh": LIMB}},
   "sword": {"caps": [["pommel", "tip", 85]], "bias": 28, "base_tex": 0.25, "skin": {"type": "rigid", "bone": "sword", "mesh": {"edge": 220, "inner": 440, "grow": 16}}, "variant": {"tex": 0.25, "mesh": {"quad": True}}},
  },
  "variant_defaults": {"tex": 0.4}, "base_tex": 0.4,
  "skeleton": [["root", None, "ground"], ["pelvis", "root", "pelvis"], ["chest", "pelvis", "waist"], ["head", "chest", "neck"],
               ["upperarmA", "chest", "shoulderA"], ["forearmA", "upperarmA", "elbowA"], ["upperarmB", "chest", "shoulderB"], ["forearmB", "upperarmB", "elbowB"],
               ["thighA", "pelvis", "pelvis"], ["shinA", "thighA", "kneeA"], ["thighB", "pelvis", "pelvis"], ["shinB", "thighB", "kneeB"], ["sword", "root", "swordPivot"]],
  "aim": {"pelvis": "neck", "chest": "neck", "head": "headTop", "upperarmA": "elbowA", "forearmA": "handA", "upperarmB": "elbowB", "forearmB": "handB", "thighA": "kneeA", "shinA": "footA", "thighB": "kneeB", "shinB": "footB", "sword": "tip"},
  "place": {"pelvis": "pelvis", "chest": "waist", "upperarmA": "shoulderA", "upperarmB": "shoulderB", "head": "neck", "sword": "swordPivot"},
  "noscale": ["head", "pelvis", "chest"], "exact_aim": ["head"],
  "joint_points": {"pelvis": "pelvis", "chest": "waist", "head": "neck", "upperarmA": "shoulderA", "forearmA": "elbowA", "upperarmB": "shoulderB", "forearmB": "elbowB", "thighA": "pelvis", "shinA": "kneeA", "thighB": "pelvis", "shinB": "kneeB", "sword": "swordPivot"},
  "scales": {"chest": [0.7, 1.4], "upperarmA": [0.7, 1.45], "forearmA": [0.7, 1.45], "upperarmB": [0.7, 1.45], "forearmB": [0.7, 1.45], "thighA": [0.7, 1.45], "shinA": [0.7, 1.45], "thighB": [0.7, 1.45], "shinB": [0.7, 1.45], "sword": [0.3, 3.0]},
  "landmarks": {"head": ["head", "head"], "crown": ["head", "crown"], "neck": ["head", "neck"], "pelvis": ["pelvis", "pelvis"], "handA": ["forearmA", "handA"], "handB": ["forearmB", "handB"], "pommel": ["sword", "pommel"], "tip": ["sword", "tip"]},
  "key_motion": {"ready": {"ms": 150, "fadeMs": 90}, "attack": {"ms": 70, "fadeMs": 0}, "follow": {"ms": 90, "fadeMs": 0}, "hurt": {"ms": 60, "fadeMs": 0}, "cast": {"ms": 150, "fadeMs": 70}, "item": {"ms": 140, "fadeMs": 70}, "defend": {"ms": 110, "fadeMs": 60}, "victory": {"ms": 220, "fadeMs": 110}, "critical": {"ms": 220, "fadeMs": 110}, "sleep": {"ms": 260, "fadeMs": 130}, "ko": {"ms": 420, "fadeMs": 160}, "od-energy-rain": {"ms": 120, "fadeMs": 60}, "od-slice-and-dice": {"ms": 80, "fadeMs": 0}},
  "joint_discs": [["head", ["head", "torso"]], ["chest", ["torso", "hips"]], ["upperarmA", ["armA", "torso"]], ["upperarmB", ["armB", "torso"]], ["forearmA", ["armA"]], ["forearmB", ["armB"]], ["thighA", ["hips", "legA", "legB"]], ["thighB", ["hips", "legA", "legB"]], ["shinA", ["legA"]], ["shinB", ["legB"]], ["pelvis", ["hips"]]],
  "marks": ["pelvis", "handA", "pommel", "tip"],
  "motion": {"idle": {"hz": 0.5, "bones": {"pelvis": {"rot": 0.3, "phase": 0.4}, "chest": {"rot": 0.8, "phase": -0.9}, "head": {"rot": 1.0, "phase": -1.6}, "upperarmA": {"rot": 0.5, "phase": -1.4}, "forearmA": {"rot": 0.4, "phase": -2.0}}}}
 }
}
(REPO / "tools/rig/subjects/rikku-dark-knight-x.json").write_text(json.dumps(cfg, indent=1), encoding="utf8")
print("wrote rikku-dark-knight-x.json")
