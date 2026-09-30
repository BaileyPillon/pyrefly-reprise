// Text helpers for build.mjs: escaping, a plain-words pass over the research copy,
// and the one-line "Evidence" summary built from the researchers' confidence tags.

// Typographic apostrophes, and a no-break space between a number and its unit (3 s, 2.5 m).
const typo = (s) =>
  s
    .replace(/'Em\b/g, '’Em')
    .replace(/(^|[\s(\[“])'(?=\S)/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/(\d) (s|m|px|ms)\b/g, '$1 $2');

// Escapes for HTML; text also gets typo(). URLs are left exactly as they are.
export const esc = (s) => {
  const t = String(s ?? '');
  return (/^https?:\/\//.test(t) ? t : typo(t))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// Footage codes used in the Clair Obscur notes, spelled out for readers.
const CODES = [
  [/\bFL\b/g, 'First Look'],
  [/\bDD\b/g, 'Developer_Direct'],
  [/\bSTEAM\b/g, 'Steam'],
];
export const expandCodes = (s) => CODES.reduce((t, [re, to]) => t.replace(re, to), String(s ?? ''));

// Drop bracket tags and swap film or engine jargon for plain words.
const SWAPS = [
  [/\s*\[(?:inference|derived)\]/gi, ''],
  [/\bQTEs\b/g, 'timing prompts'],
  [/\bQTE\b/g, 'timing prompt'],
  [/\bdutch[- ]tilted\b/gi, 'tilted'],
  [/\bdutch angles\b/gi, 'tilted angles'],
  [/\bdutch tilt\b/gi, 'tilt'],
  [/\bcanted\b/gi, 'tilted'],
  [/\banimated focal length\b/gi, 'a zooming lens'],
  [/\bFocal length\b/g, 'Lens zoom'],
  [/\bfocal length\b/g, 'lens zoom'],
  [/\bTime dilation\b/g, 'Slow motion'],
  [/\btime dilation\b/g, 'slow motion'],
  [/\bin world space\b/gi, 'in the scene'],
  [/\bworld-space\b/gi, 'in-scene'],
];
export const plain = (s) =>
  SWAPS.reduce((t, [re, to]) => t.replace(re, to), String(s ?? ''))
    .replace(/\s{2,}/g, ' ')
    .trim();

// "Evidence: seen in official footage or stills · 5 sources agree · ..."
export function evidenceLine(conf = '', extra = '') {
  const text = String(conf);
  const tags = [...text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim().toLowerCase());
  let official = 0;
  let unofficial = 0;
  let single = 0;
  let notFound = 0;
  let ours = /\[(?:inference|derived)\]/i.test(text + ' ' + extra);
  const verified = [];
  for (const t of tags) {
    if (t.startsWith('observed')) {
      // One tag can list several clips ("observed: official A; official B; unofficial capture C"): count each.
      const rest = t.replace(/^observed:?/, '').trim();
      if (!rest) official++;
      for (const part of rest ? rest.split(';') : []) {
        if (!part.trim()) continue;
        part.includes('unofficial') ? unofficial++ : official++;
      }
    }
    else if (t.startsWith('unofficial')) unofficial++;
    else if (t.startsWith('verified')) {
      const m = t.match(/verified:\s*(\d+)/);
      if (m) verified.push(Number(m[1]));
    } else if (t.startsWith('single source')) single++;
    else if (t.startsWith('not found')) notFound++;
    else if (t.startsWith('inference') || t.startsWith('derived')) ours = true;
  }
  const parts = [];
  if (official && unofficial) parts.push('seen in official footage and, for some details, in an unofficial capture');
  else if (official) parts.push('seen in official footage or stills');
  else if (unofficial) parts.push('seen only in an unofficial capture');
  for (const n of [...new Set(verified)]) parts.push(`${n} sources agree`);
  if (single) parts.push(single > 1 ? `${single} points rest on one source each` : 'one point rests on a single source');
  if (notFound) parts.push('part not found');
  if (ours) parts.push('part is our reading');
  if (/low confidence/i.test(text)) parts.push('low confidence');
  return parts.join(' · ');
}

// Settings carry their tags at the end of the source string; turn them into words.
export function sourcePhrase(s) {
  return String(s ?? '')
    .replace(/\s*\[verified:\s*(\d+) sources?([^\]]*)\]/gi, (_, n, rest) => ` (${n} sources agree${rest})`)
    .replace(/\s*\[single source([^\]]*)\]/gi, (_, rest) => ` (single source${rest})`)
    .trim();
}

// "1:18" -> 78
export const toSeconds = (t) => String(t).split(':').reduce((a, n) => a * 60 + Number(n), 0);
