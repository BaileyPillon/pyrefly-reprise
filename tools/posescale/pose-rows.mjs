/**
 * The additive fields of a registration row (`src/data/art/poseRegistrationTypes.ts`: `status`, `class`, `stature`, `headReal`, `lengthRatio`, `iou`, `sha`) and
 * how they relate to a reading of the painting (`pose-model.mjs`). Pure: no file, no pixel. Pose continuity, W1; both games.
 *
 * The installer writes the fields with {@link rowFieldsFromReading}; the gate reads them back with {@link diffStored}, which is the SECOND, independent
 * reading: it recomputes the numbers from the pixels and refuses a row that carries other ones (a table written from the old tool's record said Paine Lady
 * Luck hurt stood at 0.85 of her idle; the game drew 0.49).
 */

/** Characters of the painting's sha256 a row carries (the compiled table ships to every player; a full hash would add 70 KB for nothing). */
export const SHA_PREFIX = 16;

/** How far a stored reading may sit from the recompute before the row is stale (the model is deterministic; this is rounding to three decimals and then some). */
export const STORED_TOLERANCE = Object.freeze({ stature: 0.01, headReal: 0.01, lengthRatio: 0.01, iou: 0.02 });

const round3 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? undefined : Math.round(v * 1000) / 1000);

/** The row fields a reading writes (undefined fields are left out, so a row stays as small as its facts). */
export function rowFieldsFromReading(reading, status) {
  const out = { status, class: reading.class };
  for (const k of ['stature', 'headReal', 'lengthRatio', 'iou']) {
    const v = round3(reading[k]);
    if (v !== undefined) out[k] = v;
  }
  out.sha = reading.sha.slice(0, SHA_PREFIX);
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && v !== null));
}

/** Does a row's `sha` (any prefix of 12 characters or more, or the whole hash) describe this painting? */
export function shaMatches(rowSha, fullSha) {
  return typeof rowSha === 'string' && rowSha.length >= 12 && typeof fullSha === 'string' && fullSha.startsWith(rowSha.toLowerCase());
}

/**
 * What the stored row says that the recompute from the pixels does not, as human sentences (empty when it agrees). A row with no `sha` or no
 * `status` is not stale, it is unfinished: `missing` lists what an `ok` or `held` row must carry.
 * @returns {{stale: string[], missing: string[]}}
 */
export function diffStored(row, reading) {
  const stale = [];
  const missing = [];
  if (!row) return { stale, missing: ['row'] };
  if (!row.status) missing.push('status');
  if (!row.sha) missing.push('sha');
  else if (!shaMatches(row.sha, reading.sha)) stale.push(`the painting changed since the row was written (row sha ${row.sha}, file ${reading.sha.slice(0, SHA_PREFIX)})`);
  if (row.class && row.class !== reading.class) stale.push(`class ${row.class} stored, ${reading.class} recomputed`);
  for (const k of Object.keys(STORED_TOLERANCE)) {
    const stored = row[k];
    if (stored === undefined) continue;
    const now = reading[k];
    if (now === null || now === undefined || Math.abs(now - stored) > STORED_TOLERANCE[k]) {
      stale.push(`${k} ${stored} stored, ${now === null || now === undefined ? 'none' : round3(now)} recomputed from the pixels`);
    }
  }
  return { stale, missing };
}

/**
 * The old tool's record (`docs/target/pose-measure.json`) says a pose's `stature`; the game draws `reading.stature`. 335 of 341 agree within 0.05; the six
 * that do not are the `feetRow` defect (five Lady Luck rows) and a sword tip by design. Returns the gap, or null when the record has none to compare.
 */
export function recordStatureGap(reading, rec) {
  if (!rec || typeof rec.stature !== 'number' || reading.stature === null) return null;
  return reading.stature - rec.stature;
}
