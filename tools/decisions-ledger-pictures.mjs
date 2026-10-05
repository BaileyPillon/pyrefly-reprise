/**
 * Picture decisions for the central ledger (DECISIONS.md): every approved or rejected tile of
 * docs/target/targets.json becomes one ledger entry, so Bailey's picks sit in the same list as his
 * non-picture decisions. Read-only: this module never writes targets.json.
 *
 * Date of a tile, first hit wins: its recorded reaction date, the date inside its `approved` text
 * ("Bailey, 19 Sep 2026" or "2026-09-29"), then the first date the group's `evidence` names.
 * Quote of a tile: the reaction words, a quotation inside `approved`, then the group's evidence quote.
 */

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

/** First calendar date in a text, as YYYY-MM-DD, or null. Understands 2026-09-19 and "19 Sep 2026". */
export function firstDate(text) {
  const s = String(text ?? '');
  const iso = s.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
  const long = s.match(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (20\d\d)\b/);
  const hits = [iso && { at: iso.index, v: `${iso[1]}-${iso[2]}-${iso[3]}` }, long && { at: long.index, v: `${long[3]}-${MONTHS[long[2]]}-${long[1].padStart(2, '0')}` }].filter(Boolean);
  hits.sort((a, b) => a.at - b.at);
  return hits[0]?.v ?? null;
}

/** First quotation (curly or straight double quotes) in a text, or null. */
export function firstQuote(text) {
  const s = String(text ?? '');
  const m = s.match(/[“"]([^”"]{4,})[”"]/);
  return m ? m[1].trim() : null;
}

const GROUP_AREA = {
  presentation: 'ui', scenes: 'art', cast: 'art', pause: 'ui', fight: 'ui', audio: 'audio', phone: 'ui',
  chapters: 'chapters', polish: 'visuals', whole: 'art', 'learning-sites': 'site', 'picks-0929': 'ui', 'picks-0930': 'ui', 'picks-1003': 'camera',
};

/** Area of a tile: the group's default, refined by what the label says. */
export function tileArea(groupId, label) {
  const l = String(label).toLowerCase();
  if (/target/.test(l)) return 'combat';
  if (/camera|perspective/.test(l)) return 'camera';
  if (/eye candy|effects|lighting|backdrops with|air in the arena|pane breaks|dissolved|spherechange|arena turns/.test(l)) return 'visuals';
  if (/music|sound|audio|score/.test(l)) return 'audio';
  if (/front end|interface stops|chain counter|queue answers|status display|first run|sphere grid|credits|onboarding|chapter select/.test(l)) return 'ui';
  return GROUP_AREA[groupId] ?? 'ui';
}

// Tiles whose record does not state a game case: the case follows the subject (FFX characters and chapters 1 to 3 are FFX, FFX-2
// characters and chapters 4 and 5 are FFX-2, AGENTS.md rule 14); anything shared (Ink & Gold chrome, pause, audio, phone, the
// polish boards, the learning sites) is both games.
const GAME_RULES = [
  [/\bVegnagun|Shuyin|Paine|Trema|Logos|Leblanc|Ormi|Syndicate|Chain counter|spherechange|Hero plate, chapter 4/i, 'ffx2'],
  [/FFX party|Tidus|Yuna, battle|Auron|Seymour|Yunalesca|Braska|Shiva|Fayth|Yu Yevon|Yojimbo|Swordplay|Hero plate, chapter 1|Yu Pagoda|queue answers|Party prep|Cutscene dialogue|Battle start|Turn cut-in|PR-0002|PR-0005/i, 'ffx'],
];

/** Game case of a tile: its own field, else the label's "FFX-2", "FFX" or "(both)" hint, else the subject rules above, else both. */
export function tileGame(tile) {
  if (tile.game) return tile.game;
  const label = String(tile.label);
  if (/\bFFX-2\b/.test(label)) return 'ffx2';
  if (/\(both\)/i.test(label)) return 'both';
  if (/\bFFX\b/.test(label)) return 'ffx';
  const ch = label.match(/^Ch\. (\d)/);
  if (ch) return Number(ch[1]) <= 3 ? 'ffx' : 'ffx2';
  for (const [re, game] of GAME_RULES) if (re.test(label)) return game;
  return 'both';
}

/** What the tile says about the build, most delivered first: its delivery note, the moment it targets, or its note. */
function tileChange(t) {
  const pick = [['Delivery', t.deliveryNote], ['Target', t.build], ['Note', t.note]].find(([, v]) => v && String(v).trim());
  return pick ? { changed: String(pick[1]).replace(/\s+/g, ' ').trim().slice(0, 420), changedLabel: pick[0] } : { changed: null, changedLabel: 'Target' };
}

/** Decision ids a tile's own text names ("D-227"), so a picture row points at its written twin. */
function relatedDecisions(t) {
  const ids = [];
  const r = t.reaction ?? {};
  const text = [t.note, t.build, t.deliveryNote, r.how, ...(Array.isArray(r.mustChange) ? r.mustChange : []), ...(Array.isArray(r.mustRemain) ? r.mustRemain : [])].map((x) => String(x ?? '')).join(' ');
  for (const m of text.matchAll(/\bD-\d{3}\b/g)) if (!ids.includes(m[0])) ids.push(m[0]);
  return ids.slice(0, 5);
}

const STATE = { approved: 'adopted', rejected: 'rejected', verdict: 'proposed' };

/** One ledger entry per approved, rejected or awaiting-verdict tile; gaps (no picture, no decision) are skipped. */
export function pictureEntries(targets) {
  const out = [];
  let n = 0;
  for (const g of targets.groups ?? []) {
    for (const t of g.tiles ?? []) {
      n += 1;
      if (!STATE[t.state]) continue;
      const date = t.reaction?.date ?? firstDate(t.approved) ?? firstDate(g.evidence) ?? null;
      const quoted = firstQuote(t.approved);
      const own = t.reaction?.words ?? quoted ?? null;
      const words = own ?? firstQuote(g.evidence) ?? null;
      const verb = t.state === 'rejected' ? 'Rejected' : t.state === 'verdict' ? 'Verdict recorded, no yes yet' : 'Approved';
      out.push({
        id: null,
        seq: n,
        kind: 'picture',
        date,
        title: `${verb}: ${t.label}`,
        words,
        state: t.supersededBy ? 'superseded' : STATE[t.state],
        supersededByLabel: t.supersededBy ?? null,
        game: tileGame(t),
        delivery: t.delivery ?? null,
        area: tileArea(g.id, t.label),
        ...tileChange(t),
        seeAlso: relatedDecisions(t),
        where: `docs/target/targets.json, group ${g.id}, tile "${t.label}"`,
        group: g.id,
        wordsOfGroup: own === null && words !== null,
      });
    }
  }
  return out;
}

/** Tiles with no picture and no decision yet: listed once at the end of the ledger. */
export function waitingTiles(targets) {
  const out = [];
  for (const g of targets.groups ?? []) for (const t of g.tiles ?? []) if (t.state === 'gap') out.push(`${t.label} (${g.id})`);
  return out;
}
