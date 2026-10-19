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


class TestFitLandmarks(unittest.TestCase):
    """The fitter's landmark term (the driver's pose-intent rule, 2026-10-17): a painting's mark lands on the grid where the gate puts it, and the error is in idle heights."""

    def test_grid_point_is_the_gates_world_point_on_the_grid(self):
        import rig_fit

        place = {"W": 100, "upp": 0.5, "anchor": 150, "shift": 3.0, "mirror": -1}
        grid = {"GU0": -10.0, "GV1": 20.0, "GS": 2.0}
        x, y = rig_fit.grid_point(place, grid, 60.0, 100.0)  # u = (60 - 50) * 0.5 * -1 + 3 = -2, v = (150 - 100) * 0.5 = 25
        self.assertAlmostEqual(x, (-2.0 + 10.0) * 2.0, places=9)
        self.assertAlmostEqual(y, (20.0 - 25.0) * 2.0, places=9)

    def test_mark_errors_are_idle_heights_and_follow_the_pose(self):
        import types

        import rig_fit

        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            m = RigModel(two_rect_rig(tmp), tmp, tex_downsample=1)
            m.set_grid({"ax": 1.0, "bx": 0.0, "ay": 1.0, "by": 0.0}, {"GW": 100, "GH": 160})
            stub = types.SimpleNamespace(m=m, GS=1.0, figH=100.0)
            m.pose()
            self.assertAlmostEqual(rig_fit.Fitter.mark_errors(stub, [("armtip", 58.0, 90.0)])["armtip"], 0.0, places=9)
            self.assertAlmostEqual(rig_fit.Fitter.mark_errors(stub, [("armtip", 58.0, 40.0)])["armtip"], 0.5, places=9)  # 50 px of a 100 px figure
            m.pose(rot={"arm": math.pi / 2})  # the arm now points left: the tip is at (-10, 38)
            self.assertAlmostEqual(rig_fit.Fitter.mark_errors(stub, [("armtip", -10.0, 38.0)])["armtip"], 0.0, places=6)

    def test_grid_marks_keep_what_the_rig_has_and_the_painting_places(self):
        import types

        import rig_fit

        stub = types.SimpleNamespace(m=types.SimpleNamespace(landmarks={"armtip": {}}), T={"grid": {"GU0": 0.0, "GV1": 0.0, "GS": 1.0}})
        place = {"W": 10, "upp": 1.0, "anchor": 10, "shift": 0.0, "mirror": 1}
        got = rig_fit.Fitter.grid_marks(stub, {"place": place}, {"armtip": [5, 4], "nothere": [1, 1], "_note": [0, 0]})
        self.assertEqual([g[0] for g in got], ["armtip"])
        self.assertEqual(rig_fit.Fitter.grid_marks(stub, {}, {"armtip": [5, 4]}), [])  # targets made before `place` existed: no marks, the fit is as it was
        self.assertEqual(rig_fit.Fitter.grid_marks(stub, {"place": place}, None), [])

    def test_a_limb_block_takes_its_own_offset_and_scale(self):
        import types

        import rig_fit

        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            b = two_rect_rig(tmp)
            b["bones"][2]["parent"] = 0  # the arm hangs from the root, like a spear: its own limb
            m = RigModel(b, tmp, tex_downsample=1)
            stub = types.SimpleNamespace(m=m, free=[1, 2], off_idx=[2], scl_idx=[2], nr=2)
            stub.bone_of = lambda k: rig_fit.Fitter.bone_of(stub, k)
            # parameters: rot torso (0), rot arm (1), dx, dy of the arm (2, 3), the arm's scale (4), root dx, dy, rot (5, 6, 7)
            blocks = [list(map(int, x)) for x in rig_fit.Fitter.blocks(stub)]
            self.assertEqual(blocks[0], [5, 6, 7])  # the trunk first: only the whole-figure offset and rotation
            self.assertIn([1, 2, 3, 4], blocks)  # the arm: its angle, offset and scale together
            self.assertIn([0], blocks)
            self.assertEqual(sorted(sum(blocks, [])), list(range(8)))  # every parameter is in exactly one block
            self.assertEqual(rig_fit.Fitter.block_bones(stub, [1, 2, 3, 4]), [2, 2, 2, 2])
            self.assertIsNone(rig_fit.Fitter.block_bones(stub, [5, 6, 7]))  # the whole figure's offset moves everything

    def test_stance_is_the_middle_of_the_lowest_thick_part(self):
        import types

        import rig_fit

        mask = np.zeros((160, 100), np.uint8)
        mask[20:110, 20:70] = 1      # the body
        mask[110:150, 22:36] = 1     # one leg
        mask[110:150, 54:68] = 1     # the other
        mask[100:130, 80:82] = 1     # a thin spear that stops above the feet: not in the band, and too thin to be the lowest thick row anyway
        stub = types.SimpleNamespace(m=types.SimpleNamespace(win=(5, 0, 105, 160)))
        x = rig_fit.Fitter.stance_x(stub, mask)
        self.assertAlmostEqual(x, (22 + 67 + 1) / 2.0 + 5, delta=2.0)  # between the legs, in whole-grid cells (the window starts at 5)
        mask[130:158, 80:82] = 1     # the spear reaches the feet's band: the gate counts it (the idle's stance includes its tip), so the stance moves toward it
        self.assertGreater(rig_fit.Fitter.stance_x(stub, mask), x + 3)
        self.assertIsNone(rig_fit.Fitter.stance_x(stub, np.zeros((10, 10), np.uint8)))


class TestExportAcceptance(unittest.TestCase):
    """The config's `acceptance`, `landmarks` and `authored` reach the rig file (the driver's pose-intent rule, 2026-10-17): each marked pose's key carries its `expect`, an authored one says so."""

    def test_acceptance_landmarks_authored(self):
        import json

        from rig_common import Subject
        import rig_export

        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            art = d / "art" / "characters" / "zz"
            art.mkdir(parents=True)
            Image.fromarray(np.full((20, 20, 4), 255, np.uint8), "RGBA").save(art / "idle.png")
            cfg = d / "zz.json"
            cfg.write_text(json.dumps({"subject": "zz", "scale": 1, "costume": {"pose": "idle"}, "art": str(d / "art"), "acceptance": {"iou": 0.75, "landmarkPct": 0.06},
                                       "landmarks": {"attack": {"head": [1, 2]}, "idle": {"head": [9, 9]}}, "authored": ["attack", "nothere"],
                                       "fit": {"mirror": ["attack", "nothere"]}}))
            sub = Subject("zz", cfg)
            build = {"scale": 1, "image": {"w": 20, "h": 20}, "baselineY": 20, "bones": [], "parts": [], "landmarks": {}}
            rig = rig_export.build_rig(sub, build, {"attack": {"bones": {}, "source": "characters/zz/attack"}, "hurt": {"bones": {}, "source": "characters/zz/hurt"}})
            self.assertEqual(rig["acceptance"], {"iou": 0.75, "landmarkPct": 0.06})
            self.assertEqual(rig["keys"]["attack"]["expect"], {"head": [1, 2]})
            self.assertEqual(rig["keys"]["attack"]["source"], "authored")
            self.assertIs(rig["keys"]["attack"]["turn"], True)  # fit.mirror: the painting faces the other way, the gate reads it turned
            self.assertNotIn("turn", rig["keys"]["hurt"])
            self.assertNotIn("expect", rig["keys"]["idle"])  # the costume painting at rest has no marks
            self.assertEqual(rig["keys"]["hurt"]["source"], "characters/zz/hurt")  # not listed: a painted key
            self.assertNotIn("expect", rig["keys"]["hurt"])
            self.assertNotIn("nothere", rig["keys"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
