"""Self-checks of the `variants` step (rig_vcut.py: pieces cut from other paintings, registered to a key's bones; 2026-10-19; no art, no GPU, a second or two):

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/test_rig_vcut.py

The registration of a painting to the idle frame, the rest positions of a chain-skinned piece (the pose through the key's bones must land every vertex exactly on the painting), the cut's alpha (the polygon and
the fade toward a cut line) and the mesh area the head's size rule is measured with.
"""
from __future__ import annotations

import pathlib
import sys
import unittest

sys.path.insert(0, pathlib.Path(__file__).resolve().parent.as_posix())

import numpy as np  # noqa: E402

import rig_normals  # noqa: E402
import rig_vcut  # noqa: E402


def rot(a: float, about=(0.0, 0.0), s: float = 1.0, t=(0.0, 0.0)) -> np.ndarray:
    """A 3x3 rest -> posed matrix: rotate by `a` radians (and scale `s`) about a point, then translate."""
    c, n = np.cos(a) * s, np.sin(a) * s
    m = np.array([[c, -n, 0], [n, c, 0], [0, 0, 1]], float)
    off = np.array(about) - m[:2, :2] @ np.array(about)
    m[:2, 2] = off + np.array(t)
    return m


class VariantCut(unittest.TestCase):
    def test_a_painting_registered_with_a_plain_shift_maps_by_that_shift(self):
        T = {"costume": {"upp": 0.001, "mirror": -1, "shift": 0.0, "size": [1000, 900], "anchor1": 900},
             "poses": {"attack": {"place": {"W": 920, "upp": 0.001, "mirror": -1, "shift": 0.04, "anchor": 960}}}}
        ax, bx, ay, by = rig_vcut.painting_map(T, "attack", 2)
        self.assertAlmostEqual(ax, 1.0)
        self.assertAlmostEqual(ay, 1.0)
        self.assertAlmostEqual(bx, 0.0)  # the painting is 80 px narrower (1x) and 0.04 to the side: 40 px each way cancel
        self.assertAlmostEqual(by, 2 * (900 - 960))

    def test_a_chain_skinned_piece_lands_every_vertex_on_the_painting(self):
        names = ["a", "b", "c"]
        joints = [[0, 0], [100, 0], [200, 50], [300, 100]]
        Ks = {"a": rot(0.2, (0, 0)), "b": rot(-0.5, (100, 0), t=(3, 4)), "c": rot(0.3, (200, 50), s=1.1)}
        rng = np.random.default_rng(3)
        M = rng.uniform([-20, -60], [330, 160], (40, 2))
        r, pairs, resid = rig_vcut.skinned_rest(M, names, joints, [30.0, 40.0], Ks)
        self.assertLess(resid, 1e-6)
        for v, ps in enumerate(pairs):
            self.assertLessEqual(len(ps), 2)
            self.assertAlmostEqual(sum(w for _, w in ps), 1.0, places=6)
            B = sum(w * Ks[n] for n, w in ps)
            self.assertTrue(np.allclose(B[:2, :2] @ r[v] + B[:2, 2], M[v], atol=1e-6))

    def test_one_bone_chain_is_the_bones_own_inverse(self):
        K = rot(0.7, (10, 20), s=1.2, t=(5, -3))
        M = np.array([[50.0, 60.0], [-10.0, 4.0]])
        r, pairs, resid = rig_vcut.skinned_rest(M, ["only"], [[0, 0], [10, 10]], [30.0], {"only": K})
        self.assertLess(resid, 1e-9)
        self.assertEqual(pairs, [[("only", 1.0)]] * 2)
        self.assertTrue(np.allclose((K[:2, :2] @ r.T).T + K[:2, 2], M))

    def test_the_cut_keeps_the_inside_of_the_polygon_and_fades_toward_a_cut_line(self):
        a = np.full((60, 60), 255, np.uint8)
        poly = [(10, 10), (50, 10), (50, 50), (10, 50)]
        out = rig_vcut.cut_alpha(a, poly, [[(10, 30), (50, 30)]], 8.0)
        self.assertEqual(out[0, 0], 0)  # outside the polygon
        self.assertGreater(out[15, 20], 250)  # well inside, far from the line... (15 rows above the line)
        self.assertLess(out[30, 30], 10)  # on the cut line
        self.assertTrue(0 < out[34, 30] < 255)  # inside the fade
        plain = rig_vcut.cut_alpha(a, poly, [], 8.0)
        self.assertEqual(plain[30, 30], 255)  # no cut line, no fade

    def test_mesh_area_is_the_triangles_and_scales_with_the_square_of_the_size(self):
        v = np.array([[0.0, 0.0], [10.0, 0.0], [10.0, 10.0], [0.0, 10.0]])
        t = np.array([[0, 1, 2], [0, 2, 3]])
        self.assertAlmostEqual(rig_vcut.mesh_area(v, t), 100.0)
        self.assertAlmostEqual(rig_vcut.mesh_area(v * 1.5, t), 225.0)


class HeadSizeAndNormals(unittest.TestCase):
    """The head's two readings (r61-rigs): the opaque pixels the player sees and the mesh area the gate reads agree when the mesh margin is chosen for it; and the normal pieces are windows of the map."""

    def test_fit_grow_picks_the_margin_whose_mesh_area_is_nearest_and_never_below_zero(self):
        mesh = lambda g: (None, None, 1000.0 + 100.0 * g)  # noqa: E731
        self.assertEqual(rig_vcut.fit_grow(mesh, 1300.0), 3)  # exactly reached
        self.assertEqual(rig_vcut.fit_grow(mesh, 1340.0), 3)  # nearer 3 (1300) than 4 (1400)
        self.assertEqual(rig_vcut.fit_grow(mesh, 1360.0), 4)  # nearer 4
        self.assertEqual(rig_vcut.fit_grow(mesh, 900.0), 0)  # already over at 0: the margin is not negative
        self.assertEqual(rig_vcut.fit_grow(mesh, 1e9, hi=40), 40)  # not enough
        self.assertEqual(rig_vcut.fit_grow(mesh, 1000.0), 0)

    def test_fit_grow_finds_a_step_function_s_smallest_margin_that_reaches_it(self):
        mesh = lambda g: (None, None, [100, 100, 100, 250, 250, 600][min(g, 5)] * 1.0)  # noqa: E731
        self.assertEqual(rig_vcut.fit_grow(mesh, 240.0), 3)
        self.assertEqual(rig_vcut.fit_grow(mesh, 600.0, hi=5), 5)

    def test_a_normal_piece_is_the_same_window_of_the_map_flat_where_the_window_leaves_it(self):
        nrm = np.zeros((40, 60, 3), np.uint8)
        nrm[..., 0] = np.arange(60, dtype=np.uint8)[None, :]
        w = rig_normals.window(nrm, 5, 15, 10, 30)
        self.assertEqual(w.shape, (10, 20, 3))
        self.assertEqual(int(w[0, 0, 0]), 10)
        self.assertEqual(int(w[0, 19, 0]), 29)
        off = rig_normals.window(nrm, -3, 5, 55, 65)  # runs off the top and the right edge
        self.assertEqual(tuple(off[0, 0]), rig_normals.FLAT)  # above the map
        self.assertEqual(tuple(off[0, 9]), rig_normals.FLAT)  # right of the map
        self.assertEqual(int(off[3, 0, 0]), 55)  # inside the map

    def test_a_piece_is_the_configs_scale_or_the_colours_when_that_is_smaller(self):
        cfg = {"scale": 0.3}
        self.assertEqual(rig_normals.piece_size((400, 200), cfg), (120, 60))
        self.assertEqual(rig_normals.piece_size((400, 200), cfg, 0.2), (80, 40))  # a variant at tex 0.2 has a piece at 0.2
        self.assertEqual(rig_normals.piece_size((400, 200), cfg, 0.55), (120, 60))
        self.assertEqual(rig_normals.piece_size((3, 3), cfg), (1, 1))  # never empty

    def test_the_resize_of_a_pose_registered_at_another_scale_is_the_paintings(self):
        nrm = np.full((100, 200, 3), 77, np.uint8)
        self.assertIs(rig_normals.register(nrm, 1.0, 1.0), nrm)
        r = rig_normals.register(nrm, 1.011, 1.011)
        self.assertEqual(r.shape, (round(100 * 1.011), round(200 * 1.011), 3))
        self.assertTrue((r == 77).all())

    def test_a_piece_is_written_opaque_rgb_and_the_normal_pieces_are_off_without_the_config(self):
        import tempfile

        nrm = np.zeros((8, 8, 3), np.uint8)
        nrm[..., 2] = 255
        with tempfile.TemporaryDirectory() as d:
            out = pathlib.Path(d) / "p.normal.png"
            size = rig_normals.save_piece(out, nrm, (4, 4))
            self.assertEqual(size, (4, 4))
            from PIL import Image

            with Image.open(out) as im:
                im.load()
                self.assertEqual((im.mode, im.size), ("RGB", (4, 4)))

        class Sub:
            cfg = {"build": {}}

        self.assertIsNone(rig_normals.settings(Sub))
        Sub.cfg = {"build": {"normals": "D:/maps"}}
        self.assertEqual(rig_normals.settings(Sub), {"dir": "D:/maps", "scale": 0.3})


if __name__ == "__main__":
    unittest.main()
