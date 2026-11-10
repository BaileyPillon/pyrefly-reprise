# Special part masks (fixtures)

FFX-2 only: the three Special dresspheres exist only in FFX-2.

`<special>/<pose>/{whole,main,right,left}.png` are alpha silhouettes of one Special figure (a pixel is drawn when its alpha is above 16): `main` is the girl's own body, `right` and `left`
are the two parts, `whole` is their union. They are the **model-render** masks of the three reference views, not of any painting yet (`provisional: true` in `src/data/art/specialParts.ts`).
`meta.json` carries the size of the full-size render they were cut from (`width`, `height`), the scale of these files (`scale`, 1/4), the render frame (`frame`), the figure's lowest and
highest drawn row at full size (`baselineY`, `contentTop`) and its full-size box (`wholeBbox`, `[x0, y0, x1, y1]`, edges).

Poses and frames (the preflight's picks): `idle` = idle-1, `attack` = attack-2, `cast` = cast-3, `hurt` = hurt-2. `victory` is not here: its render is owed. No pose of the four was missing.

Cut from the mask lane's full-size masks (1536 x 1536): each 4 x 4 block goes to the layer that owns most of its pixels when at least half of the block is drawn, so the three part
masks partition `whole`. `tools/special-part-anchors.mjs` reads this folder (`--masks`) and writes `src/data/art/specialParts.ts`; at stage 2 the painting's own masks and sidecars replace
these (`--sidecars`) and the table is regenerated.
