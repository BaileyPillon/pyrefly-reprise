"""Unit tests of the party tools' pure parts: the skeleton retarget, the capsule partition and the synthesized marks. No art, no game.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/test_party.py
"""
import math
import pathlib
import sys
import types
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np  # noqa: E402

import pcommon as P  # noqa: E402
import retarget as RT  # noqa: E402

SKEL = [["root", None, "ground"], ["pelvis", "root", "pelvis"], ["chest", "pelvis", "neck"], ["arm", "chest", "shoulder"], ["fore", "arm", "elbow"]]
REST = {"ground": (0.0, 1000.0), "pelvis": (0.0, 600.0), "neck": (0.0, 300.0), "shoulder": (50.0, 320.0), "elbow": (50.0, 420.0), "hand": (50.0, 520.0)}


def party(**kw):
    pp = {"skeleton": SKEL, "aim": {"chest": "neck", "arm": "elbow", "fore": "hand"}, "place": {"pelvis": "pelvis", "arm": "shoulder"}, "scales": {}, "noscale": []}
    pp.update(kw)
    return types.SimpleNamespace(party=pp)


class Retarget(unittest.TestCase):
    def test_rest_marks_give_the_rest_pose(self):
        bones, _rep, joints = RT.solve_pose(party(), REST, dict(REST))
        self.assertEqual(bones, {})
        self.assertAlmostEqual(joints["fore"][0], 50.0)

    def test_a_moved_pelvis_is_an_offset_and_the_rest_follows(self):
        marks = {k: (x + 100, y + 50) for k, (x, y) in REST.items()}
        bones, _rep, joints = RT.solve_pose(party(), REST, marks)
        self.assertAlmostEqual(bones["pelvis"]["dx"], 100.0, places=1)
        self.assertAlmostEqual(bones["pelvis"]["dy"], 50.0, places=1)
        self.assertNotIn("rot", bones.get("chest", {}))
        self.assertAlmostEqual(joints["fore"][0], 150.0, places=1)
        self.assertAlmostEqual(joints["fore"][1], 470.0, places=1)

    def test_a_turned_arm_lands_its_aim_point_exactly(self):
        ang = math.radians(40)
        c, s = math.cos(ang), math.sin(ang)
        sh = np.array(REST["shoulder"])
        rot = lambda p: tuple(sh + np.array([c * (p[0] - sh[0]) - s * (p[1] - sh[1]), s * (p[0] - sh[0]) + c * (p[1] - sh[1])]))  # noqa: E731
        marks = dict(REST)
        marks["elbow"], marks["hand"] = rot(REST["elbow"]), rot(REST["hand"])
        bones, rep, _j = RT.solve_pose(party(), REST, marks)
        self.assertAlmostEqual(bones["arm"]["rot"], ang, places=3)
        self.assertLess(rep["fore"]["miss"], 0.5)

    def test_scale_is_clamped_and_the_miss_is_reported(self):
        marks = dict(REST)
        marks["hand"] = (50.0, 920.0)  # a forearm four times as long
        _b, rep, _j = RT.solve_pose(party(scales={"fore": [0.5, 1.5]}), REST, marks)
        self.assertAlmostEqual(rep["fore"]["scale"], 1.5)
        self.assertGreater(rep["fore"]["miss"], 100)

    def test_noscale_keeps_a_head_the_size_it_is(self):
        sk = SKEL + [["head", "chest", "neck"]]
        rest = {**REST, "headTop": (0.0, 200.0)}
        marks = {**rest, "headTop": (0.0, 100.0)}
        bones, _r, _j = RT.solve_pose(party(skeleton=sk, aim={"head": "headTop"}, noscale=["head"], place={"pelvis": "pelvis"}), rest, marks)
        self.assertNotIn("sx", bones.get("head", {}))


class Partition(unittest.TestCase):
    def test_nearest_capsule_wins_and_a_bias_breaks_a_tie(self):
        h, w = 200, 400
        rgba = np.zeros((h, w, 4), np.uint8)
        rgba[40:160, 40:360] = (200, 100, 50, 255)
        pts = {"a": (60.0, 100.0), "b": (140.0, 100.0), "c": (340.0, 100.0)}
        parts = {"L": {"caps": [["a", "b", 30]]}, "R": {"caps": [["c", 30]]}}
        lab, present = P.partition(rgba, pts, parts, ["L", "R"], 1, margin=10.0, snap=False)
        self.assertTrue(present["L"] and present["R"])
        self.assertEqual(int(lab[100, 100]), 0)
        self.assertEqual(int(lab[100, 330]), 1)
        self.assertEqual(int(lab[10, 10]), -1)

    def test_a_part_without_points_is_absent(self):
        rgba = np.zeros((50, 50, 4), np.uint8)
        rgba[10:40, 10:40] = 255
        _lab, present = P.partition(rgba, {"a": (20.0, 20.0)}, {"X": {"caps": [["a", 10]]}, "Y": {"caps": [["nope", 10]]}}, ["X", "Y"], 1, snap=False)
        self.assertEqual(present, {"X": True, "Y": False})


class Synth(unittest.TestCase):
    def test_a_hidden_limb_is_carried_with_the_torso(self):
        rest = {"pelvis": (0.0, 600.0), "neck": (0.0, 300.0), "elbowB": (-50.0, 420.0)}
        marks = {"pelvis": (100.0, 600.0), "neck": (100.0, 300.0)}
        out = P.synth_missing(types.SimpleNamespace(), rest, marks)
        self.assertAlmostEqual(out["elbowB"][0], 50.0, places=3)
        self.assertAlmostEqual(out["elbowB"][1], 420.0, places=3)


if __name__ == "__main__":
    unittest.main(verbosity=1)
