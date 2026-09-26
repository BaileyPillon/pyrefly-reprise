# Seymour Natus hurt and KO: method check before a third try (FFX only, Chapter X, 2026-09-26)

AGENTS.md rule 15. Two pilots of 8 renders each failed the same way. Agent look only.

| Try | What changed | Renders | Result |
|---|---|---|---|
| 1 | The standard recipe; identity from the idle sidecar, plus "two large curved violet lattice blades rising from his forearms" | hurt 1-4, ko 1-4 (7 guard rejects) | Feathers and wing fans explode across the canvas, a halo-like lattice disc behind him, a second figure in ko 2. |
| 2 | METHOD-CHECK method 1: blades erased from the reference square and negated, to be composited from the idle | hurt 5-8, ko 5-8 (6 guard rejects) | The blades are gone, but the wing fans stay: spiky feathered wings grow from the shoulders and arms in 8 of 8. |

## Cause

The word that survives both tries is the idle's own skirt line, **"long skirt of grey lavender
blade-shaped feathers fanning down to a wide jagged hem"**. The idle was rendered with no ControlNet
and no IP-Adapter, standing still, so "feathers fanning" stayed in the skirt. With OpenPose spreading
or dropping the arms and the IP-Adapter square carrying the idle's two big lattice fins, the model
reads "feathers ... fanning" as wings and puts them wherever there is space: behind the shoulders and
along the arms. Removing the blades removed only one of the two sources.

## Options

| # | Method | Cost | Risk |
|---|---|---|---|
| 1 | **Describe the skirt without the word "feathers"** ("long tattered grey lavender skirt of jagged strips to a wide ragged hem"), and put wings and feathers in the negative with weight. Keep the blade-free reference and the blade composite. | 4 + 4 renders. | The skirt may come out as plain cloth strips, a small identity loss the composite does not fix. |
| 2 | Lower the IP-Adapter weight for Natus only. | Same. | Leaves the proven recipe; identity drifts further (the art5 lesson). Not tried. |
| 3 | Stop Natus and move to the next boss. | Free. | Chapter X keeps its statue. |

**Picked: 1, once.** If it fails, Natus stops here (option 3) and the result is reported.
