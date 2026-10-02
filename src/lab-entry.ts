/**
 * CAMERA LAB bundle entry (`lab.html`, `tools/lab/build-lab.mjs`; a test harness, D-318): the
 * page boots straight into the lab panel. The flag module runs first (ES modules evaluate in
 * import order), then the game's own boot reads it. Not part of the game's build.
 */
import './engine/lab/forceLab.ts';
import './main.ts';
