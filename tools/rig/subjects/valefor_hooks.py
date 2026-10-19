"""Hooks for valefor (FFX only: the aeon's painting set; the rig program, 2026-10-19). Nothing here: the config says everything (polygons, chains, rigid parts, the underlaps).

A neck cap (a disc of the painting's own pixels rigid on `neck0`, the recipe of the knee caps in rikku-dark-knight_hooks.py) was tried to close the wedge a 75 degree neck bend opens at `neck0` in
the Overdrive key: it closed the gate's hole at a radius of 80 px, and at that radius a bent neck sticks a rotated piece of the figure's outline out of the back (seen in the KO clip). The Overdrive key
keeps the neck's first joint to 45 degrees instead and bends the neck's second joint and the head further (see `fit.keys.overdrive.limits`).
"""
from __future__ import annotations
