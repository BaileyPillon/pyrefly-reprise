// Phone-readable sheet parts for the Sin chapter concepts (FFX only). 1080 px wide, JPEG,
// each under 1 MB. Text only restates docs/concepts/chapters/sin-2026-09-27/README.md.
const FR = (id) => `../frame-${id}-1600.jpg`;

const CONCEPTS = {
  A: {
    eyebrow: 'Concept A · one chapter, four links · FFX only',
    title: 'The whole assault',
    notes: [
      'The four-link strip. Links I to III share one party state; the save comes before IV. <span class="k">[verified: 3 sources]</span>',
      'The Left Fin, bigger than the frame. Its core glows while it gathers energy.',
      'The warning: after "Core gathers energy." comes Gravija on the Fin\'s next turn. It takes 75% of current HP and cannot kill.',
      'Cid\'s order, the widget from Evrae. If Cid acts before the Fin, pulling back makes that Gravija do nothing. Unlike at Evrae, Cid fires no missiles.',
      'Party HP carries from Fin to Fin to Core.',
    ],
    plays: 'Left Fin, then Right Fin. Close in to Armor Break them (they are Armored, Defense 100), then pull back to stay safe. Up close, the Fin\'s Ram delays you and its Negation strips both sides. Then Sin\'s back: Genais shields the Core and soaks your magic, and the Core charges Gravija whenever Genais shells. Kill the Core and the link ends, Genais or not. Then a save beat on the deck (re-equip, Yuna\'s scene), then Overdrive Sin: three pulls, a slowly opening mouth, and Giga-Graviton ends the game.',
    teaches: 'Range buys safety, not damage. Armor Break opens every link. Kill order matters. Then you plan a burst against a clock.',
    faithful: 'The most faithful: every link, the carry-over and the break are the game\'s own. A Game Over at link IV restarts at IV, as the real save does (the retry rule is our estimate).',
    cost: 'The most. All eleven new mechanics in research §11, five colossal subjects (about 27 paintings), three backdrops, and one chapter slot (XVI; the chapter <i>number</i> type stops at 15, so that is an additive contract change, rule 2).',
    risks: 'Length. Each 65,000-HP Fin takes about 30 to 45 party actions at the Zanarkand party\'s damage (our estimate from §6.2), so this would be by far the longest chapter. The Fins can feel like Evrae twice over. Losing at link III means replaying two Fins. Negation\'s chance formulas (S-12) come from one source and need named tunables.',
    staging: 'Sin in parts. Sin is never whole on screen: each link shows the part you fight, bigger than the frame, and the strip says where you are.',
  },
  B: {
    eyebrow: 'Concept B · Overdrive Sin alone · FFX only',
    title: 'The countdown',
    notes: [
      'The clock: 13 of Sin\'s turns. 3 pulls (blue), 9 in reach (gold), then Giga-Graviton (red). The 13th turn is our default; the sources say 12 or 13 (S-1).',
      'The head at mouth stage 2 of 3. The painting and the clock tell the same time, so each stage is its own painting.',
      'Gaze. After six hits (three from an aeon), the whole party rolls one status at 30%: Petrify, Confuse or Zombie. Any Ward blocks it completely.',
      'The turn order marks each of Sin\'s turns with its clock number.',
      'Wards and Haste. Party B carries Stoneproof on Lulu.',
    ],
    plays: 'A short prologue of four or five painted plates: the Hymn plan, the ship\'s cannons tearing off both Fins, the jump onto Sin\'s back, and Sinfall into Bevelle. Then one fight. On turns 1 to 3 Sin pulls the ship in and only Wakka and magic reach it, so you Haste, Focus and Cheer. From turn 4 it is in reach: Armor Break, then everything you have. Save Overdrives and aeon Overdrives for the end. On turn 13, Giga-Graviton: Game Over, with no Auto-Life and no aeon shield.',
    teaches: 'Planning a burst: buff while it is far away, Armor Break the moment it comes near, Overdrives last. Wards against Gaze.',
    faithful: 'The fight is exact. But three of the four links are told, not played: Cid\'s range orders, Negation, Genais and the Core are all cut. The prologue has to say so plainly.',
    cost: 'The least. Three new mechanics (percent-of-max damage with Death, the turn clock with its scripted Game Over, and Gaze). One colossal subject (about 9 head paintings), one backdrop (the deck over Bevelle at dusk) and 4 or 5 prologue plates.',
    risks: 'The whole chapter rests on one number. 140,000 HP in 9 melee turns is out of reach without Overdrives at the party\'s damage (§6.2: about 85,000 to 100,000 from plain attacks), so it must be benched at human speed before anything else. S-1 moves the window by about six party actions. The chapter is short. The scripted Game Over has to read as the design, not as a bug.',
    staging: 'The face fills the sky. The head comes closer with each pull, and the mouth opens in stages: the mouth is the clock.',
  },
  C: {
    eyebrow: 'Concept C · two chapters · FFX only',
    title: 'Split where the game saves',
    notes: [
      'Two chapter cards on the select screen. The split falls where the game saves. The titles are working titles.',
      'Sin\'s Core, charging. It wakes only while Genais is in its shell, then fires Gravija at the party.',
      'Sinspawn Genais in its shell. It is Armored, immune to Gravija, and heals itself with Cura on every hit.',
      'While Genais lives, magic aimed at the Core is absorbed ("Magic absorbed.").',
      'HP, MP and statuses carry in from both Fins.',
    ],
    plays: 'Chapter one: Left Fin, Right Fin, then Genais and the Core, all on one party state, ending at Sinfall. Chapter two opens on the deck with Yuna\'s scene and a re-equip (the Right Fin\'s Stoneproof drop can change hands), then Overdrive Sin.',
    teaches: 'Chapter one is the range and kill-order puzzle, Evrae\'s big brother. Chapter two is the race.',
    faithful: 'As faithful as A. All four links are played, and the split is the game\'s own save.',
    cost: 'A\'s art plus a second chapter card and a second chapter slot (XVI and XVII).',
    risks: 'Chapter one is Evrae\'s mechanic twice more, and it may feel repetitive. The roster tilts further towards FFX (11 FFX : 7 FFX-2 with Ixion). Chapter two can be played without chapter one, which is fine because chapters are free to pick.',
    staging: 'The ship and Sin\'s back are the stage, and Sin is the landscape. The frame shows link III, the Genais shell moment.',
  },
};

function sheetRoot() { const s = document.createElement('div'); s.id = 'sheet'; document.body.appendChild(s); return s; }

function overview(s) {
  s.innerHTML = `
  <div class="eyebrow">Pyrefly Reprise · new chapter · FFX only · 2026-09-27</div>
  <h1>Sin, the assault from the Fahrenheit: three chapter concepts</h1>
  <p class="lede">These are the first rungs of the options ladder: written concepts, plus rough greybox layouts over our own deck painting. Nothing is built. Pick one or mix them; a pick approves only what you name. Every number comes from research/ffx-sin.md.</p>
  ${['A', 'B', 'C'].map((k) => `<div class="row"><img src="${FR(k)}"><div><div class="t">${k} · ${CONCEPTS[k].title}</div>${{
    A: 'One chapter with all four links. Left Fin, Right Fin, then Genais and the Core, back to back on one party state. Then the game\'s own save-and-re-equip break, then Overdrive Sin.',
    B: 'Overdrive Sin alone. A painted prologue covers the Fins and the jump, then one 13-turn race against Giga-Graviton, with the mouth as the clock.',
    C: 'Two chapters, split where the game saves: first the Fins and the Core (range and kill order), then the Face (the race).',
  }[k]}</div></div>`).join('')}
  <div class="box"><h3 style="margin-top:0">Recommended: A as the end state, reached through B</h3>
  <ul>
  <li>Build link IV first. It carries the two biggest risks: painting a colossal head, and the 140,000-HP race. A painting pilot and a bench at human speed test both cheaply.</li>
  <li>Ship it unlisted behind a switch, then add links I to III in front. They reuse Evrae's range command.</li>
  <li>One chapter slot keeps the roster at 10 FFX : 7 FFX-2 with Ixion, as the plan sheet proposed.</li>
  <li>If the bench shows A is too long for one sitting, split it at the save and it becomes C: the same content, plus one card.</li>
  </ul></div>
  <h3>Two questions that come with any pick</h3>
  <ol>
  <li><b>Which party?</b> (S-29) Party A: the Zanarkand party as it ships (Chapter II). Party B: the Garden of Pain party with Yuna's Tetra Ring back. The research recommends B: it runs straight on into Omnis, and it already carries Stoneproof against Gaze.</li>
  <li><b>Does Giga-Graviton come on Sin's 12th or 13th turn?</b> (S-1) The guides split. We default to the 13th (bover_87) and mark it as a default. It moves the window by about six party actions, so it needs a check in the Steam copy. We will ask before anyone takes over your screen.</li>
  </ol>
  <p class="foot">Parts: 1 overview · 2 concept A · 3 concept B · 4 concept C · 5 the paintings each concept needs. Frames are rough layouts: grey shapes stand in for paintings that do not exist yet. The party sprites and deck painting are our own, and no retail image is used.</p>`;
}

function concept(s, k) {
  const c = CONCEPTS[k];
  s.innerHTML = `
  <div class="eyebrow">${c.eyebrow}</div>
  <h1>${k} · ${c.title}</h1>
  <img class="fr" src="${FR(k)}">
  <p class="k">Rough layout at 1600 × 900. The grey shapes are placeholders; the numbers match the list below.</p>
  <ol>${c.notes.map((n) => `<li>${n}</li>`).join('')}</ol>
  <h3>How it plays</h3><p>${c.plays}</p>
  <h3>What it teaches</h3><p>${c.teaches}</p>
  <h3>Faithfulness</h3><p>${c.faithful}</p>
  <h3>Cost</h3><p>${c.cost}</p>
  <h3>Risks</h3><p>${c.risks}</p>
  <h3>Staging the colossus</h3><p>${c.staging}</p>`;
}

function paintings(s) {
  const rows = [
    ['Overdrive Sin, the head', 'far, mid and near approach; mouth stages 1, 2, 3 and fully open; Gaze; defeat', '9', '9', '9'],
    ['Left Fin', 'near idle, far idle, gathering energy, hurt, torn off', '5', '—', '5'],
    ['Right Fin', 'the same five, as its own arm (a mirror of the Left Fin is cheaper, but only if you allow it)', '5', '—', '5'],
    ['Sinspawn Genais', 'out of its shell, in its shell, hurt, death', '4', '—', '4'],
    ['Sin\'s Core', 'inactive, gathering energy, hurt, death', '4', '—', '4'],
    ['Backdrop: deck in flight', 'the Evrae deck repainted with Sin\'s flank filling the far sky', '1', '—', '1'],
    ['Backdrop: Sin\'s back', 'the ridged hide around the Core', '1', '—', '1'],
    ['Backdrop: deck over Bevelle', 'dusk, Sin winged and propped on a tower', '1', '1', '1'],
    ['Story plates', 'the Hymn plan, a cannon tearing off a Fin, the jump, Sinfall, Evenfall', '3', '5', '3'],
    ['Chapter card', '', '1', '1', '2'],
    ['Portrait: Brother, FFX look', 'the existing one is his FFX-2 look (rule 14)', '1', '1', '1'],
  ];
  s.innerHTML = `
  <div class="eyebrow">Part 5 · FFX only</div>
  <h1>The paintings each concept needs</h1>
  <p class="lede">All original, from our own pipeline (rule 8). A pilot comes before any batch, and the first pilot is the head at colossal scale.</p>
  <table><tr><th>Subject</th><th>States</th><th>A</th><th>B</th><th>C</th></tr>
  ${rows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}
  <tr><td><b>Total</b></td><td></td><td><b>35</b></td><td><b>17</b></td><td><b>36</b></td></tr></table>
  <h3>Already on disk, reused</h3>
  <p>All seven party members with every pose, Yuna's summon pose, the five story aeons, Cid's portrait, the Evrae deck painting as the base for the new deck, and the Trigger Command widget. The turn-order icons for each Sin part are crops, not new paintings.</p>
  <h3>Music (by ear, rule 13)</h3>
  <p>Two original cues: an assault cue for the Fins and the Core, and a countdown cue for the head. The research sources no track for the head (S-21). The Hymn is part of the plan in the story, so a motif grounded in it is canon ground. It must be written fresh, not quoted.</p>
  <p class="foot">Sources: research/ffx-sin.md §1.1, §2, §5.4, §6.2, §7.3, §9, §10 and §11; docs/plans/next-content-2026-09-27.md.</p>`;
}

window.sheetParts = () => ['part-1-overview', 'part-2-concept-A', 'part-3-concept-B', 'part-4-concept-C', 'part-5-paintings'];
window.buildSheet = (name) => {
  const s = sheetRoot();
  if (name === 'part-1-overview') overview(s);
  else if (name === 'part-5-paintings') paintings(s);
  else concept(s, name.slice(-1));
};
