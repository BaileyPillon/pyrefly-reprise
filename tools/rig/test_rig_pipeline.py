"""Quick self-checks of the rig pipeline's numerics (no art, no GPU, about 20 seconds with numba warm):

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/test_rig_pipeline.py

CMA-ES finds the minimum of a rotated quadratic inside a box; the chamfer distance is a distance; the predicate language cuts what it says; a rig of two rectangles skins and rasterises where the
maths says (rest pose, a bent arm, the whole figure's offset) and its skin matrices agree with the hand-computed rotation about the joint.
"""
from __future__ import annotations

import math
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, pathlib.Path(__file__).resolve().parent.as_posix())

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import rig_geom as R  # noqa: E402
from rig_cma import cma_es  # noqa: E402
from rig_pred import Pred  # noqa: E402
from rig_skin import RigModel, chamfer, iou  # noqa: E402


def two_rect_rig(tmp: pathlib.Path):
    """A torso (40 x 100) and an arm (16 x 60) hanging from its shoulder at (50, 30), in a 100 x 160 image; bones root, torso, arm."""
    def rect(name, x, y, w, h, bone):
        Image.fromarray(np.full((h, w, 4), 255, np.uint8), "RGBA").save(tmp / f"{name}.png")
        return {"name": name, "order": 0 if name == "torso" else 1, "png": f"{name}.png", "box": [x, y, w, h], "bone": bone,
                "verts": [x, y, x + w, y, x + w, y + h, x, y + h], "triangles": [0, 1, 2, 0, 2, 3]}
    return {
        "scale": 1, "image": {"w": 100, "h": 160}, "baselineY": 150,
        "bones": [{"name": "root", "parent": -1, "x": 50, "y": 150}, {"name": "torso", "parent": 0, "x": 50, "y": 100}, {"name": "arm", "parent": 1, "x": 50, "y": 30}],
        "parts": [rect("torso", 30, 20, 40, 100, "torso"), rect("arm", 50, 30, 16, 60, "arm")],
        "landmarks": {"head": {"bone": "torso", "x": 50, "y": 25}, "armtip": {"bone": "arm", "x": 58, "y": 90}},
    }


class Pipeline(unittest.TestCase):
    def test_cma_finds_a_rotated_quadratic(self):
        rng = np.random.default_rng(3)
        A = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, 0.5], [0.0, 0.5, 1.0]])
        target = np.array([0.4, -0.3, 0.2])
        x, f, evals = cma_es(lambda v: float((v - target) @ A @ (v - target)), np.zeros(3), 0.3, -np.ones(3), np.ones(3), 3000, rng)
        self.assertLess(f, 1e-5)
        self.assertLess(float(np.linalg.norm(x - target)), 0.01)
        self.assertLess(evals, 3001)

    def test_cma_respects_its_box(self):
        rng = np.random.default_rng(4)
        x, f, _ = cma_es(lambda v: float(np.sum((v - 2.0) ** 2)), np.zeros(4), 0.3, -np.ones(4), np.ones(4), 1500, rng)
        self.assertTrue(np.all(x <= 1.0 + 1e-9) and np.all(x >= -1.0 - 1e-9))
        self.assertGreater(float(x.min()), 0.95)  # pressed against the wall nearest the minimum

    def test_chamfer_is_a_distance(self):
        m = np.zeros((20, 30), np.uint8)
        m[10, 5] = 1
        out = np.zeros(m.shape, np.float32)
        chamfer(m, out)
        self.assertEqual(float(out[10, 5]), 0.0)
        self.assertAlmostEqual(float(out[10, 15]), 10.0, places=3)
        self.assertAlmostEqual(float(out[13, 8]), 3 * 1.4142, places=2)

    def test_predicates_cut_what_they_say(self):
        H, W = 40, 60
        rgba = np.zeros((H, W, 4), np.uint8)
        rgba[..., 3] = 255
        rgba[:, :30, :3] = (200, 30, 30)
        rgba[:, 30:, :3] = (30, 30, 200)
        p = Pred((H, W), 2, rgba, {}, {"box": R.poly_mask((H, W), [[[5, 5], [20, 5], [20, 15], [5, 15]]], 2)})
        self.assertEqual(int(p.ev({"colour": {"r_minus_b_gt": 0.3}}).sum()), 30 * H)
        self.assertEqual(int(p.ev({"x_ge": 10}).sum()), (W - 20) * H)  # x is in 1x px: 10 -> column 20 at scale 2
        both = p.ev({"all": [{"poly": "box"}, {"colour": {"r_minus_b_gt": 0.3}}]})
        self.assertEqual(int(both.sum()), int(p.ev({"poly": "box"}).sum()) - int((p.ev({"poly": "box"}) & p.ev({"x_ge": 15})).sum()))
        self.assertEqual(int(p.ev({"not": {"x_ge": 10}}).sum()), 20 * H)

    def test_a_bent_arm_goes_where_the_maths_says(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            m = RigModel(two_rect_rig(tmp), tmp, tex_downsample=1)
            m.pose()
            self.assertAlmostEqual(m.landmark("armtip")[0], 58.0, places=6)
            self.assertAlmostEqual(m.landmark("armtip")[1], 90.0, places=6)
            m.pose(rot={"arm": math.pi / 2})  # clockwise on screen, y down: the arm that hung down now points left
            x, y = m.landmark("armtip")
            self.assertAlmostEqual(x, 50 - 60.0, places=6)  # shoulder (50, 30), tip 60 below and 8 right of it, rotated 90 degrees clockwise
            self.assertAlmostEqual(y, 30 + 8.0, places=6)
            m.pose(root=(10.0, -5.0, 0.0))
            self.assertAlmostEqual(m.landmark("armtip")[0], 68.0, places=6)
            self.assertAlmostEqual(m.landmark("armtip")[1], 85.0, places=6)

    def test_the_raster_draws_the_silhouette(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            m = RigModel(two_rect_rig(tmp), tmp, tex_downsample=1)
            grid = {"GW": 100, "GH": 160}
            m.set_grid({"ax": 1.0, "bx": 0.0, "ay": 1.0, "by": 0.0}, grid)
            m.pose()
            rest = m.grid_mask().copy()
            self.assertAlmostEqual(float(rest.sum()), 40 * 100, delta=40)  # the arm hangs inside the torso at rest
            self.assertEqual(int(rest[25, 35]), 1)
            self.assertEqual(int(rest[25, 10]), 0)
            m.pose(rot={"arm": math.pi / 2})
            bent = m.grid_mask().copy()
            self.assertEqual(int(bent[34, 10]), 1)  # the arm now reaches out to the left of the torso
            self.assertLess(float(iou(rest, bent)), 0.95)
            m.pose()
            self.assertEqual(float(iou(rest, m.grid_mask())), 1.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
