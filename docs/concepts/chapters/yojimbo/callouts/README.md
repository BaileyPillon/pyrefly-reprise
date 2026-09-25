# Chapter IX callouts in play (D-068, item 8). FFX only

The four mid-battle callouts from `docs/plans/yojimbo-story-draft.md` (lines 86-99), as written,
each photographed as it played. Every frame comes from a run driven with real keys from the title
(title, chapter select, Chapter IX, party prep, the pre scene, then the fight). Each run went through
all four lines and ended when Doom took Yojimbo into the post scene.

| Frame (1600x900 and 390x844) | Speaker | Line | Moment | Gauge when shown |
|---|---|---|---|---|
| `lulu-long-blade-*.jpg` | Lulu | "He draws the long blade now. Be quick." | the gauge crosses 50 % | 52 / 51 |
| `auron-zanmato-next-*.jpg` | Auron | "Next turn, he kills us all. Move." | the gauge is full | 100 |
| `yuna-aeon-takes-zanmato-*.jpg` | Yuna | "Thank you. Rest now." | Zanmato lands on an aeon (Ixion at 1600x900, Ifrit at 390x844) | 0 (reset) |
| `kimahri-doomed-*.jpg` | Kimahri | "Five breaths. Then gone." | Kimahri's Doom lands on Yojimbo (the 5 above him) | 6 |

Browser: Playwright Chromium, `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX 5070 Ti). No console errors
in either run. Seen in passing and not caused by this change: after Zanmato takes an aeon, the
turn-order strip still lists that aeon with an "I" placeholder portrait, and on the phone layout the
queue line still reads "Yojimbo acts next · Zanmato · Ifrit" while Yuna's line plays.
