# Camera references, 2026-09-30
A static page showing how Clair Obscur: Expedition 33, Persona 5 and Persona 5 Royal frame each moment of a battle: 29 numbered shot cards with a top-down camera sketch and frame-checked watch links, a side-by-side against our own perspectives-round mockups, camera settings, thin spots and numbered sources.
All content comes from `research/battle-camera-clair-obscur.json` and `research/battle-camera-persona5.json` (plus the Sources lists in their `.md` notes); nothing here is invented, and it shows no game footage.
Rebuild: `node docs/concepts/camera-references-2026-09-30/build.mjs` from the repo root (or `node build.mjs` inside this folder). It rewrites `index.html` and prints any warnings.
Parts: `build.mjs` (page), `diagram.mjs` (camera sketches and per-shot overrides), `copy.mjs` (hand-written lines), `text.mjs` (helpers), `page.css`, `page.js` (nav highlight only).
`our/*.jpg` are 960 px copies (the M4 strip is 1200 px) of frames from `docs/concepts/perspectives-2026-09-27/`, made with Python PIL at quality 85.
The design is the project's Ink & Gold tokens; the page works with JavaScript off and stays under 1.5 MB with the thumbnails.
It is published as an artifact by the main session, not from this folder; the builder does not commit, push or deploy.
Game case (AGENTS.md rule 14): reference for both FFX and FFX-2 decisions; no FFX or FFX-2 game data.
