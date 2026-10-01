# Options round captures (2026-10-01), release 33 (today) vs candy-max-proto options A, B, C, D

Branch candy-max-proto (D:/pyrefly-r29-plate), dev server 5350 (stopped). Headless GPU Playwright, seed 1, gotoChapter(skipCutscenes). `option` in manifest = today (no ?candy flag) | A | B | C | D.
- still__<option>__<moment>__<desktop|phone>.jpg: 1600x900 / 390x844 (dpr 2). Dynamic moments (KO, cast, attack pose, lunge) are driven by direct actor calls (setPose / lunge) and the screencast frame nearest the stated ms is kept; rest moments are page screenshots at the first command menu. Flow moments (ffx-I-od, ffx2-IV-sc) use real keys; Tidus Overdrive gauge was INJECTED to 100 (labelled in manifest note). `-strike` / `-late` suffix = a later frame of the same flow.
- strip__<option>__<ffx|ffx2>__<char|boss>.jpg: today on top, option below. Real keys: FFX Ch I Tidus Attack and first boss action (Mortiorchis cast); FFX-2 Ch IV Yuna White Magic (she has no Attack as White Mage) and Bahamut cast. Canvas only (HUD hidden by CSS once the menu is used).
- wide__<option>__<chapter>.jpg: resting camera, HUD hidden, 1600x900.
- clip__<option>__<game>.webm: 8 s (B FFX-2 spherechange 4.5 s), 1280x720. A/C/D: 1 s rest, real Attack, then autoBattle; B: the real Overdrive input / spherechange flows.
- onoff__<option>__desktop.jpg: each flag alone vs ALL OFF vs ALL ON, Ch I Tidus Attack at +300 ms. Flags that react only to presenter events (C cuts/herocut, B odchoreo/herocut/splashart/sckeys) cannot show in this direct-call moment, so those tiles look like ALL OFF; the real flows show them.
- frame-times.md / .json.
Caveats: the 'today' stills for a given moment are shared by every option that uses that moment. FFX-2 Active/Wait timing makes boss-action moments differ slightly between runs.
