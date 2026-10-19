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


if __name__ == "__main__":
    unittest.main()
