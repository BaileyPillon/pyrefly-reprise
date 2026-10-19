"""Self-checks of the lane kit's Python parts (the rig program, 2026-10-18; no GPU, no art beyond a synthetic one, a few seconds):

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/test_lane.py

The fit slots (two, a dead owner's is taken over), the sweep plan, the selection by the gate's reading (with a fake gate), the claims rewrite, the merge, the table, the scaffold (a synthetic figure
in, a config that READS back and has a marks slot for every pose out), the twin's config and keys, the sheet helpers, and the dry fit.
"""
from __future__ import annotations

import json
import pathlib
import sys
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, HERE.as_posix())
sys.path.insert(0, HERE.parent.as_posix())

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import lane_common  # noqa: E402
import lane_fit  # noqa: E402
import lane_new  # noqa: E402
import lane_sheets  # noqa: E402
import lane_twin  # noqa: E402


def gate(iou_by_pose: dict, codes_by_pose: dict | None = None, **extra) -> dict:
    codes_by_pose = codes_by_pose or {}
    return {"subject": "zz", "status": "ok", "uncovered": [], "keys": [{"pose": "idle", "ok": True, "iou": 0.99, "flags": []}] + [
        {"pose": p, "ok": True, "iou": v, "landmarkMax": 0.02, "statureRead": 1.0, "feet": {"dx": 0.0, "dy": 0.0}, "flags": []} for p, v in iou_by_pose.items()],
        "failures": [{"code": c, "pose": p, "message": ""} for p, cs in codes_by_pose.items() for c in cs], "holes": {"rendered": 10, "joints": ["a"], "keysWithHoles": [], "blendsWithHoles": 0}, **extra}


class FitSlots(unittest.TestCase):
    def test_two_slots_and_a_dead_owner_is_taken_over(self):
        with tempfile.TemporaryDirectory() as d:
            alive = {111: True, 222: True, 333: True}
            s1, s2, s3 = (lane_common.FitSlots(d, alive=lambda p: alive.get(p, False)) for _ in range(3))
            self.assertIsNotNone(s1.acquire("a", 111))
            self.assertIsNotNone(s2.acquire("b", 222))
            self.assertIsNone(s3.acquire("c", 333))  # both slots are taken by live lanes
            self.assertEqual(s3.free(), 0)
            alive[111] = False  # lane a died without releasing
            self.assertIsNotNone(s3.acquire("c", 333))
            s2.release()
            s3.release()
            self.assertEqual(lane_common.FitSlots(d, alive=lambda p: False).free(), 2)


class Sweep(unittest.TestCase):
    def test_plan_puts_seed_one_of_every_pose_first(self):
        self.assertEqual(lane_fit.plan_jobs(["a", "b"], 2), [("a", 1), ("b", 1), ("a", 2), ("b", 2)])
        self.assertEqual(lane_fit.job_name("od-fury", 3), "od-fury-s3")

    def test_failure_codes_count_a_blend_against_both_poses(self):
        g = gate({"a": 0.8, "b": 0.8}, {"a": ["key-iou"], "a>b": ["hole-blend"]})
        self.assertEqual(lane_fit.failure_codes_by_pose(g), {"a": ["key-iou", "hole-blend"], "b": ["hole-blend"]})
        j = lane_fit.judge(g)
        self.assertEqual(j["a"]["codes"], ["hole-blend"])  # the overlap bar itself is not "another flag"
        self.assertNotIn("idle", j)

    def test_select_takes_the_best_clean_candidate_a_pose_by_the_gates_reading(self):
        cands = {"a": [{"key": {"n": "a0"}, "from": "a-s1"}, {"key": {"n": "a1"}, "from": "a-s2"}, {"key": {"n": "a2"}, "from": "a-s3"}],
                 "b": [{"key": {"n": "b0"}, "from": "b-s1"}, {"key": {"n": "b1"}, "from": "b-s2"}]}
        readings = [gate({"a": 0.80, "b": 0.90}, {"b": ["key-feet-y"]}), gate({"a": 0.84, "b": 0.82}), gate({"a": 0.88, "b": 0.82}, {"a": ["hole-key"]})]
        calls = []

        def evaluate(keys):
            calls.append(keys)
            return readings[len(calls) - 1]

        chosen, detail = lane_fit.select_best(cands, evaluate)
        self.assertEqual(len(calls), 3)  # as many rigs as the most candidates a pose has
        self.assertEqual(calls[2], {"a": {"n": "a2"}, "b": {"n": "b1"}})  # a pose with fewer candidates repeats its last
        self.assertEqual(chosen["a"], {"n": "a1"})  # 0.88 has a hole; 0.84 is the best clean one
        self.assertEqual(chosen["b"], {"n": "b1"})  # 0.90 floats a foot; the clean 0.82 wins
        self.assertEqual(detail["a"]["candidate"], 1)

    def test_with_nothing_clean_the_highest_overlap_wins(self):
        self.assertEqual(lane_fit.pick([(0, {"iou": 0.7, "codes": ["x"]}), (1, {"iou": 0.8, "codes": ["y"]})]), 1)
        self.assertEqual(lane_fit.pick([(0, {"iou": None, "codes": []}), (1, {"iou": 0.1, "codes": []})]), 1)

    def test_claims_become_the_gates_readings_and_a_key_without_a_claim_stays_without(self):
        keys = {"a": {"fit": {"iou": 0.9, "stature": 1.0, "feetPx": 2}}, "b": {"bones": {}}, "c": {"fit": {"iou": 0.7, "stature": 1.0}}}
        g = gate({"a": 0.8123456, "b": 0.8, "c": 0.7})
        g["keys"][1]["statureRead"] = 0.97
        out, changes = lane_fit.rewrite_claims(keys, g)
        self.assertEqual(out["a"]["fit"], {"iou": 0.8123, "stature": 0.97, "feetPx": 2})
        self.assertNotIn("fit", out["b"])
        self.assertEqual(len(changes), 1)  # c already said what the gate reads

    def test_merge_keeps_the_poses_the_sweep_did_not_touch(self):
        self.assertEqual(lane_fit.merge_keys({"a": 1, "b": 2}, {"b": 3, "c": 4}), {"a": 1, "b": 3, "c": 4})

    def test_the_table_names_every_pose_with_its_source_overlap_and_holes(self):
        g = gate({"a": 0.8, "b": 0.5})
        g["keys"][2]["authored"] = True
        g["keys"][2]["turned"] = True
        g["holes"]["keysWithHoles"] = ["a"]
        rows = lane_fit.table_rows(g, {"keys": {"a": {"source": "characters/zz/a"}}})
        self.assertEqual([(r["pose"], r["source"], r["holes"]) for r in rows], [("idle", "costume", 0), ("a", "painted", 1), ("b", "authored (turned)", 0)])
        text = lane_fit.format_table(g)
        self.assertIn("rig zz  gate OK", text)
        self.assertIn("authored (turned)", text)


class Scaffold(unittest.TestCase):
    def test_joints_are_fractions_of_the_figure_box(self):
        j = lane_new.joints("humanoid-side", (100, 50, 300, 650))
        self.assertEqual(j["root"], (200.0, 650.0))  # the ground row, the box's bottom
        self.assertTrue(j["head"][1] < j["chest"][1] < j["pelvis"][1] < j["root"][1])  # head above chest above pelvis above the ground
        self.assertTrue(all(100 <= x <= 300 and 50 <= y <= 650 for x, y in j.values()))
        for preset in lane_new.PRESETS:
            self.assertEqual(lane_new.joints(preset, (0, 0, 100, 100))["root"][1], 100.0)

    def test_head_polygon_is_the_pose_models_box_padded(self):
        self.assertEqual(lane_new.head_polygon([0.4, 0.1, 0.6, 0.2], (1000, 2000), pad=0.25), [[350, 150], [650, 150], [650, 450], [350, 450]])

    def test_a_scaffolded_config_reads_back_and_has_a_marks_slot_for_every_pose(self):
        cfg = lane_new.scaffold("humanoid-side", "zz", 2, (400, 800), (100, 50, 300, 750), [0.45, 0.06, 0.55, 0.14], ["idle", "attack", "hurt", "ko"])
        cfg2 = json.loads(json.dumps(cfg))
        self.assertEqual(cfg2["landmarks"], {"attack": {}, "hurt": {}, "ko": {}})  # every registered pose but the costume's; the lane fills them in by eye
        self.assertEqual(cfg2["authored"], [])
        self.assertEqual(cfg2["fit"]["mirror"], [])
        self.assertEqual(cfg2["fit"]["limits"]["head"], [-25, 25])  # the limits that kept Lulu's body natural
        names = [b[0] for b in cfg2["build"]["bones"]]
        self.assertEqual(names[0], "root")
        self.assertIsNone(cfg2["build"]["bones"][0][1])
        self.assertTrue(all(b[1] in names for b in cfg2["build"]["bones"][1:]))  # parents come first and exist
        self.assertEqual(set(cfg2["build"]["skin"]), set(cfg2["cut"]["parts"]))  # a skin entry for every part
        self.assertIn("head", cfg2["build"]["landmarks"])
        self.assertEqual(cfg2["cut"]["order"], ["body", "head"])
        self.assertEqual(cfg2["_lane"].split(" ")[0], "scaffolded")
        with self.assertRaises(SystemExit):
            lane_new.scaffold("biped-spaceship", "zz", 2, (4, 8), (0, 0, 4, 8), None, [])

    def test_run_writes_the_config_from_a_painting_and_refuses_to_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            chars = d / "art" / "characters" / "zz"
            chars.mkdir(parents=True)
            a = np.zeros((200, 100, 4), np.uint8)
            a[20:190, 30:70] = 255
            Image.fromarray(a, "RGBA").save(chars / "idle.png")
            Image.fromarray(a, "RGBA").save(chars / "attack.png")
            self.assertEqual(lane_new.figure_box(chars / "idle.png"), (30, 20, 70, 190))
            out = d / "subjects"
            self.assertEqual(lane_new.run("zz", "humanoid-side", None, str(d / "art"), str(out)), 0)
            cfg = json.loads((out / "zz.json").read_text())
            self.assertEqual((cfg["subject"], cfg["scale"]), ("zz", 1))
            self.assertIn("attack", cfg["landmarks"])  # the poses came from the folder when the pose model had no table
            self.assertTrue((out / "zz_hooks.py").exists())
            with self.assertRaises(SystemExit):
                lane_new.run("zz", "humanoid-side", None, str(d / "art"), str(out))


class Twin(unittest.TestCase):
    def test_the_twins_config_is_the_bases_with_its_own_subject_and_its_keys_carry_no_claims(self):
        base = {"subject": "ifrit", "scale": 2, "hooks": "ifrit_hooks.py", "cut": {"parts": {"head": {"include": [{"poly": "h"}]}}}, "sam": {}}
        t = lane_twin.twin_config(base, "grothia", "ifrit")
        self.assertEqual((t["subject"], t["_twin_of"], t["cut"]), ("grothia", "ifrit", base["cut"]))
        self.assertEqual(base["subject"], "ifrit")  # the base is untouched
        self.assertFalse(lane_twin.needs_sam(base))
        self.assertTrue(lane_twin.needs_sam({"sam": {"parts": {"head": {}}}, "cut": {"parts": {"head": {"sam": ["head"]}}}}))
        keys = {"attack": {"bones": {"a": {"rot": 0.1}}, "fit": {"iou": 0.9}, "source": "characters/ifrit/attack"}}
        k = lane_twin.twin_keys(keys)
        self.assertNotIn("fit", k["attack"])
        self.assertEqual(k["attack"]["bones"], {"a": {"rot": 0.1}})
        self.assertIn("fit", keys["attack"])


class Sheets(unittest.TestCase):
    def test_crop_holds_every_rect_and_stays_in_the_frame(self):
        r = [{"x": 855, "y": 591, "w": 96, "h": 225}, {"x": 836, "y": 585, "w": 121, "h": 240}]
        x0, y0, w, h = lane_sheets.crop_box(r)
        self.assertTrue(x0 >= 0 and y0 >= 0 and x0 + w <= 1600 and y0 + h <= 900)
        self.assertTrue(x0 <= 836 and x0 + w >= 957 and y0 <= 585 and y0 + h >= 825)
        far = lane_sheets.crop_box([{"x": 1590, "y": 890, "w": 5, "h": 5}])
        self.assertTrue(far[0] + far[2] <= 1600 and far[1] + far[3] <= 900)

    def test_caption_says_what_the_gate_read(self):
        c = lane_sheets.caption("defend", {"authored": True, "iou": 0.617, "landmarkMax": 0.0})
        self.assertIn("AUTHORED", c)
        self.assertIn("0.617", c)
        self.assertIn("painting faces LEFT", lane_sheets.caption("ready", {"iou": 0.5, "turned": True}))

    def test_sheet_groups_follow_the_registry_or_take_three_a_sheet(self):
        spec = {"labels": {"od-fury": "OVERDRIVE"}, "sheets": [["s1", ["defend", "od-fury"]], ["s2", ["gone"]]]}
        self.assertEqual(lane_sheets.sheet_groups(spec, ["defend", "od-fury"]), [("s1", [("defend", "DEFEND"), ("od-fury", "OVERDRIVE")])])
        auto = lane_sheets.sheet_groups({"sheetPrefix": "x"}, ["a", "b", "c", "d"])
        self.assertEqual([(n, [p for p, _ in rows]) for n, rows in auto], [("x-sheet-1", ["a", "b", "c"]), ("x-sheet-2", ["d"])])
        self.assertEqual(lane_sheets.row_title("DEFEND", ["left = a", "right = b"]), "DEFEND      left = a      right = b")

    def test_a_row_and_a_sheet_are_made_from_last_frames(self):
        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            Image.new("RGB", (2 * 300 + 4, 2 * 400 + 44), (30, 40, 50)).save(d / "defend-last.png")
            wrote = lane_sheets.make_sheets({"sheets": [["one", ["defend"]]], "labels": {"defend": "DEFEND"}}, d, d / "out", before=d, before_poses=["defend"])
            self.assertEqual(sorted(p.name for p in wrote), ["one.png", "rig-before-after.png"])
            self.assertEqual(Image.open(d / "out" / "one.png").size[0], 2 * lane_sheets.PANEL + 4)
            self.assertEqual(Image.open(d / "out" / "rig-before-after.png").size[0], 3 * 500 + 8)


class FrameDiff(unittest.TestCase):
    def test_two_frames_and_two_signature_files(self):
        import lane_diff

        a = np.zeros((4, 5, 3), np.uint8)
        b = a.copy()
        self.assertEqual(lane_diff.diff_frames(a, b), {"pixels": 0, "maxChannel": 0, "mean": 0.0})
        b[1, 1] = (3, 0, 0)
        d = lane_diff.diff_frames(a, b)
        self.assertEqual((d["pixels"], d["maxChannel"]), (1, 3))
        self.assertEqual(lane_diff.diff_frames(a, np.zeros((5, 5, 3), np.uint8))["maxChannel"], 255)  # another shape is not the same picture
        with tempfile.TemporaryDirectory() as d_:
            d_ = pathlib.Path(d_)
            for n, sig in (("a", {"defend": [1, 2, 3], "ko": [4, 5]}), ("b", {"defend": [1, 2, 3], "ko": [4, 9]}), ("c", {"defend": [1, 2, None]})):
                (d_ / n).mkdir()
                (d_ / n / "rig-signature.json").write_text(json.dumps(sig))
            ab = lane_diff.compare_signatures(d_ / "a", d_ / "b")
            self.assertEqual(ab["defend"]["mismatched"], 0)
            self.assertEqual((ab["ko"]["mismatched"], ab["ko"]["firstMismatch"]), (1, 1))
            self.assertEqual(lane_diff.compare_signatures(d_ / "a", d_ / "c", ["defend"])["defend"]["mismatched"], 1)  # an unreadable frame is a mismatch, not a pass
            self.assertEqual(lane_diff.compare_signatures(d_ / "a", d_ / "nothing"), {})
            self.assertEqual(lane_diff.figure_rect({"poses": {"p": {"rectPose": {"x": 10, "y": 20, "w": 5, "h": 6}, "rectIdle": {"x": 8, "y": 22, "w": 5, "h": 9}}}}, "p", 2), (6, 18, 17, 33))


class DryFit(unittest.TestCase):
    def test_dry_fit_lists_the_jobs_and_touches_nothing(self):
        import types

        with tempfile.TemporaryDirectory() as d:
            sub = types.SimpleNamespace(name="zz", work=pathlib.Path(d) / "zz", costume_pose="idle")
            self.assertEqual(lane_fit.cmd_fit(sub, ["a", "b"], 2, 4, "t", dry=True), 0)
            self.assertFalse(sub.work.exists())
            with self.assertRaises(SystemExit):
                lane_fit.target_poses(sub)  # no targets yet: it says how to make them


if __name__ == "__main__":
    unittest.main(verbosity=2)
