"""Self-checks of format v2 in the rig pipeline (2026-10-18; no art, no GPU, a few seconds):

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/test_rig_v2.py

The key's part state (the same function as the gate's and the runtime's), the fitter's rasteriser drawing a key in its state (a hidden part leaves no pixels, a variant stands in for its part), the
exporter writing a version 2 file exactly when a v2 field is used (and a version 1 file, unchanged, when none is), and the pure core of `from_painting`.
"""
from __future__ import annotations

import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, pathlib.Path(__file__).resolve().parent.as_posix())

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import rig_v2  # noqa: E402
from rig_skin import RigModel  # noqa: E402


def png(tmp: pathlib.Path, name: str, w: int, h: int, rgba=(255, 255, 255, 255)) -> str:
    Image.fromarray(np.full((h, w, 4), rgba, np.uint8), "RGBA").save(tmp / name)
    return name


def rect(tmp, name, x, y, w, h, bone, order, **extra):
    return {"name": name, "order": order, "png": png(tmp, f"{name}.png", w, h), "box": [x, y, w, h], "bone": bone, "verts": [x, y, x + w, y, x + w, y + h, x, y + h], "triangles": [0, 1, 2, 0, 2, 3], **extra}


def figure(tmp: pathlib.Path) -> dict:
    """A torso, an arm, a head with a variant of its own mesh, and a hidden scar, in a 100 x 160 image."""
    head = rect(tmp, "head", 35, 0, 30, 24, "torso", 2)
    head["variants"] = {"big": {"png": png(tmp, "head.big.png", 40, 32), "box": [30, 0, 40, 32]}}
    return {
        "scale": 1, "image": {"w": 100, "h": 160}, "baselineY": 150,
        "bones": [{"name": "root", "parent": -1, "x": 50, "y": 150}, {"name": "torso", "parent": 0, "x": 50, "y": 100}],
        "parts": [rect(tmp, "torso", 30, 24, 40, 100, "torso", 0), rect(tmp, "arm", 70, 30, 16, 60, "torso", 1), head, rect(tmp, "scar", 40, 40, 10, 10, "torso", 3, hidden=True)],
        "landmarks": {"head": {"bone": "torso", "x": 50, "y": 10}},
    }


class KeyState(unittest.TestCase):
    def test_a_key_describes_its_state_and_names_what_it_must(self):
        self.assertEqual(rig_v2.key_parts({"show": ["scar"], "hide": ["arm"], "image": {"head": "big"}}), {"scar": {}, "arm": {"show": False}, "head": {"image": "big"}})
        self.assertIsNone(rig_v2.key_parts({"init": {"arm": 10}}))  # a fit-key entry with no part words says nothing about parts
        self.assertIsNone(rig_v2.key_parts(None))
        self.assertEqual(rig_v2.key_parts({"parts": {"scar": {"show": True}}, "hide": ["scar"]}), {"scar": {"show": False}})  # a hide wins

    def test_the_state_is_the_gates_and_the_runtimes(self):
        with tempfile.TemporaryDirectory() as d:
            parts = figure(pathlib.Path(d))["parts"]
            rest = rig_v2.rest_state(parts)
            self.assertEqual(rest["scar"], {"shown": False, "image": None})
            self.assertEqual(rest["head"], {"shown": True, "image": None})
            s = rig_v2.state_of(parts, {"scar": {}, "head": {"image": "big"}, "arm": {"show": False}})
            self.assertEqual(s["scar"], {"shown": True, "image": None})
            self.assertEqual(s["head"], {"shown": True, "image": "big"})
            self.assertEqual(s["arm"], {"shown": False, "image": None})
            self.assertEqual(s["torso"], rest["torso"])  # not named: the default
            with self.assertRaises(SystemExit):
                rig_v2.state_of(parts, {"ghost": {}})
            with self.assertRaises(SystemExit):
                rig_v2.state_of(parts, {"head": {"image": "nope"}})

    def test_a_variant_with_its_own_mesh_replaces_the_part_and_one_without_keeps_the_parts(self):
        with tempfile.TemporaryDirectory() as d:
            parts = figure(pathlib.Path(d))["parts"]
            head = next(p for p in parts if p["name"] == "head")
            big = rig_v2.effective(head, "big")
            self.assertEqual(big["png"], "head.big.png")
            self.assertEqual(big["box"], [30, 0, 40, 32])
            self.assertEqual(big["bone"], "torso")  # rigid on the part's bone
            self.assertEqual(big["verts"], [30, 0, 70, 0, 70, 32, 30, 32])  # a quad of its own box
            head["variants"]["same"] = {"png": "head.same.png"}
            same = rig_v2.effective(head, "same")
            self.assertEqual(same["verts"], head["verts"])
            self.assertEqual(same["png"], "head.same.png")
            self.assertEqual([s[:2] for s in rig_v2.slots(parts)], [("torso", None), ("arm", None), ("head", None), ("head", "big"), ("head", "same"), ("scar", None)])

    def test_the_build_config_marks_hidden_parts_and_attaches_variants(self):
        with tempfile.TemporaryDirectory() as d:
            parts = figure(pathlib.Path(d))["parts"]
            for p in parts:
                p.pop("hidden", None)
                p.pop("variants", None)
            self.assertFalse(rig_v2.apply_build_cfg(parts, {}))
            self.assertFalse(rig_v2.uses_v2({"parts": parts, "keys": {"idle": {}}}))
            self.assertTrue(rig_v2.apply_build_cfg(parts, {"hidden": ["scar"], "variants": {"head": {"big": {"png": "head.big.png", "from_painting": {"pose": "defend"}}}}}))
            self.assertTrue(next(p for p in parts if p["name"] == "scar")["hidden"])
            self.assertEqual(next(p for p in parts if p["name"] == "head")["variants"], {"big": {"png": "head.big.png"}})  # the op's own words stay in the config
            self.assertTrue(rig_v2.uses_v2({"parts": parts, "keys": {}}))
            self.assertTrue(rig_v2.uses_v2({"parts": [], "keys": {"hurt": {"parts": {"arm": {"show": False}}}}}))
            self.assertEqual(rig_v2.image_files(parts), ["torso.png", "arm.png", "head.png", "head.big.png", "scar.png"])


class FitterDrawsTheState(unittest.TestCase):
    def test_a_hidden_part_leaves_no_pixels_and_a_variant_stands_in_for_its_part(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            b = figure(tmp)
            m = RigModel(b, tmp, tex_downsample=1)
            grid = {"GW": 100, "GH": 160}
            aff = {"ax": 1.0, "bx": 0.0, "ay": 1.0, "by": 0.0}
            m.set_grid(aff, grid)
            m.pose()
            rest = m.grid_mask().copy()
            self.assertEqual(int(rest[45, 45]), 1)  # the torso is there
            self.assertEqual(int(rest[2, 30]), 0)  # the big head's left edge (x 30) is not drawn at rest: the own head spans x 35..65
            m.set_state(rig_v2.state_of(b["parts"], {"scar": {}}))
            m.pose()
            self.assertEqual(int(m.grid_mask()[45, 45]), 1)  # the scar sits on the torso (same alpha): nothing to see in a silhouette, but it is drawn
            self.assertTrue(m.active[[i for i, s in enumerate(m.slots) if s[0] == "scar"][0]])
            m.set_state(rig_v2.state_of(b["parts"], {"head": {"image": "big"}}))
            m.pose()
            swapped = m.grid_mask().copy()
            self.assertEqual(int(swapped[2, 31]), 1)  # the big head reaches x 30
            self.assertEqual(int(swapped[2, 36]), 1)
            m.set_state(rig_v2.state_of(b["parts"], {"torso": {"show": False}, "arm": {"show": False}, "head": {"show": False}}))
            m.pose()
            self.assertEqual(int(m.grid_mask().sum()), 0)  # nothing shown, nothing drawn
            m.set_state(None)
            m.pose()
            self.assertTrue(np.array_equal(m.grid_mask(), rest))  # the rest state again

    def test_a_block_redraws_only_the_active_slots(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = pathlib.Path(d)
            b = figure(tmp)
            m = RigModel(b, tmp, tex_downsample=1)
            m.set_grid({"ax": 1.0, "bx": 0.0, "ay": 1.0, "by": 0.0}, {"GW": 100, "GH": 160})
            m.set_state(rig_v2.state_of(b["parts"], {"arm": {"show": False}}))
            m.pose(rot={"torso": 0.0})
            m.begin_block([1])
            sizes = len(m.live)
            m.end_block()
            m.set_state(None)
            m.begin_block([1])
            self.assertGreater(len(m.live), sizes)  # the arm's two triangles are back in the block
            m.end_block()


class ExporterWritesTheVersion(unittest.TestCase):
    def _sub(self, d: pathlib.Path, extra: dict):
        from rig_common import Subject

        art = d / "art" / "characters" / "zz"
        art.mkdir(parents=True)
        Image.fromarray(np.full((20, 20, 4), 255, np.uint8), "RGBA").save(art / "idle.png")
        cfg = d / "zz.json"
        cfg.write_text(json.dumps({"subject": "zz", "scale": 1, "costume": {"pose": "idle"}, "art": str(d / "art"), **extra}))
        return Subject("zz", cfg)

    def test_version_two_exactly_when_a_v2_field_is_used(self):
        import rig_export

        build = {"scale": 1, "image": {"w": 20, "h": 20}, "baselineY": 20, "bones": [], "parts": [{"name": "a", "order": 0, "png": "a.png"}], "landmarks": {}}
        keys = {"hurt": {"bones": {}, "source": "characters/zz/hurt"}, "attack": {"bones": {}, "source": "characters/zz/attack"}}
        with tempfile.TemporaryDirectory() as d:
            plain = rig_export.build_rig(self._sub(pathlib.Path(d), {}), build, json.loads(json.dumps(keys)))
        self.assertEqual(plain["version"], 1)  # nothing v2 in the config: the version 1 file it always wrote
        self.assertTrue(all("parts" not in k for k in plain["keys"].values()))
        with tempfile.TemporaryDirectory() as d:
            sub = self._sub(pathlib.Path(d), {"fit": {"keys": {"hurt": {"hide": ["a"], "init": {"x": 1}}}}, "keys_extra": {"ko": {"bones": {}, "parts": {"a": {"show": False}}}}})
            rig = rig_export.build_rig(sub, build, json.loads(json.dumps(keys)))
        self.assertEqual(rig["version"], 2)
        self.assertEqual(rig["keys"]["hurt"]["parts"], {"a": {"show": False}})
        self.assertNotIn("parts", rig["keys"]["attack"])
        self.assertEqual(rig["keys"]["ko"]["parts"], {"a": {"show": False}})
        self.assertNotIn("parts", rig["keys"]["idle"])  # the idle is the rest

    def test_hidden_and_variant_files_are_copied(self):
        import rig_export

        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            sub = self._sub(d, {})
            sub.work = d / "work"
            (sub.work / "build").mkdir(parents=True)
            parts = [{"name": "a", "order": 0, "png": "a.png", "rim": "a.rim.png", "box": [0, 0, 4, 4], "hidden": True, "variants": {"b": {"png": "a.b.png", "rim": "a.b.rim.png"}}}]
            for f in ("a.png", "a.rim.png", "a.b.png", "a.b.rim.png"):
                png(sub.work / "build", f, 4, 4)
            (sub.work / "build" / "build.json").write_text(json.dumps({"scale": 1, "image": {"w": 20, "h": 20}, "baselineY": 20, "bones": [], "parts": parts, "landmarks": {}}))
            out = d / "rigs" / "zz"
            out.mkdir(parents=True)
            png(out, "stale.png", 2, 2)
            sub.out = out
            rig_export.run(sub, gate=False, out=out)
            self.assertEqual(sorted(p.name for p in out.glob("*.png")), ["a.b.png", "a.b.rim.png", "a.png", "a.rim.png"])  # the variants' files are wanted, the stale one goes
            self.assertEqual(json.loads((out / "rig.json").read_text())["version"], 2)


class FromPaintingCore(unittest.TestCase):
    def test_soft_cut_fades_the_waist_edge(self):
        a = np.full((10, 4), 255.0, np.float32)
        out = rig_v2.soft_cut(a, 8.0, 4.0)
        self.assertEqual(float(out[3, 0]), 255.0)  # above cut - feather
        self.assertAlmostEqual(float(out[6, 0]) / 255.0, (8.0 - 6.0) / 4.0, places=5)  # on the ramp
        self.assertEqual(float(out[9, 0]), 0.0)  # below the cut

    def test_placement_puts_the_paintings_stance_on_the_idles(self):
        # a crop whose top-left is 40 px left of and 100 px above the painting's feet, the painting drawn 1.1 x the idle, a 2x master
        x, y = rig_v2.placement((10.0, 20.0), (50.0, 120.0), (244.0, 1142.0), 1.1, 2.0)
        self.assertAlmostEqual(x, 2.0 * (244.0 + (10.0 - 50.0) * 1.1))
        self.assertAlmostEqual(y, 2.0 * (1142.0 + (20.0 - 120.0) * 1.1))
        self.assertEqual(rig_v2.placement((50.0, 120.0), (50.0, 120.0), (244.0, 1142.0), 1.3, 2.0), (488.0, 2284.0))  # the feet land on the feet


if __name__ == "__main__":
    unittest.main(verbosity=2)
