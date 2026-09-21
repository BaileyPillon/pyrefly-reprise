/**
 * The critic's policy as code (policy v2, approved by Bailey on 2026-09-20).
 *
 * `critic/RUBRIC.md` explains the policy; `critic/policy.json` is its
 * machine-readable half; this module is the only place that turns the two into
 * decisions, so the release workflow, the deploy script, the status reader and
 * the tests all agree:
 *
 *   - which review a change needs (live only / focused / deep / milestone),
 *   - how the single weighted score is computed and when a milestone is accepted,
 *   - whether a critic report is well-formed enough to count as evidence.
 *
 * Everything here is a pure function of its arguments except `loadPolicy`.
 * Fail closed throughout: an unknown change set plans a deep review, a missing
 * category leaves the score provisional, an UNVERIFIED mandatory check blocks
 * acceptance. Types live in `critic-policy.d.mts`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const REVIEW_KINDS = ['live', 'focused', 'deep', 'milestone'];
export const RESULTS = ['PASS', 'FAIL', 'UNVERIFIED', 'NOT APPLICABLE'];
export const MILESTONE_STATES = ['incomplete', 'not assessed', 'accepted'];
const DEPTH_ORDER = { none: 0, focused: 1, deep: 2 };

export function loadPolicy(root) {
  return JSON.parse(readFileSync(join(root, 'critic', 'policy.json'), 'utf8'));
}

/**
 * The owner-override policy block (`critic/policy.json` `ownerOverride`,
 * RUBRIC section 10). Only Bailey's own quoted words, passed as
 * `--owner-override` to `tools/deploy-pages.mjs`, let a build ship past the
 * "no passing deep report" refusal; it never settles an obligation and never
 * changes a report's verdict. Defaults closed if the block is ever missing.
 */
export function ownerOverridePolicy(policy) {
  return policy.ownerOverride ?? { allowed: false, requiresOwnerWords: true, settlesObligations: false };
}

/** `**` crosses folders, `*` stays inside one path segment. */
export function globToRegExp(glob) {
  const DOUBLE = '<<double-star>>';
  const escaped = glob.split('**/').join(DOUBLE).split('**').join(DOUBLE).replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.split('*').join('[^/]*').split(DOUBLE).join('.*');
  return new RegExp(`^${pattern}$`);
}

const normalize = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');
const matches = (path, globs) => globs.some((g) => globToRegExp(g).test(path));

function expandChapters(spec, policy) {
  const ids = Object.keys(policy.chapters);
  if (spec === 'all' || spec === undefined) return ids;
  if (spec === 'ffx' || spec === 'ffx2') return ids.filter((id) => policy.chapters[id].game === spec);
  return spec;
}

/**
 * Which review does this change set need? `paths` are repo-relative paths that
 * differ between the previous verified build and the candidate (tracked files
 * from git, shipped art and audio from the artifact manifests). `null` or
 * `undefined` means the change set is unknown, which plans a deep review.
 */
export function classifyChange(paths, policy) {
  if (!Array.isArray(paths)) {
    const u = policy.unclassified;
    return {
      depth: 'deep', deepBeforeDeploy: true, reasons: ['the change set is unknown, so nothing can be ruled out'],
      systems: ['unknown change set'], games: 'both', chapters: expandChapters('all', policy),
      checks: [...new Set([...policy.alwaysAtDeploy, ...u.checks])].sort(), targetGroups: [],
      productPaths: [], ignoredPaths: [], dataAudit: false, approvedArtCheck: false,
    };
  }
  const systems = new Set(), checks = new Set(policy.alwaysAtDeploy), chapters = new Set(), targetGroups = new Set();
  const games = new Set(), reasons = [], productPaths = [], ignoredPaths = [];
  let depth = 'none', deepBeforeDeploy = false, dataAudit = false, approvedArtCheck = false;

  for (const raw of paths) {
    const path = normalize(raw);
    let hit = policy.rules.filter((r) => matches(path, r.match));
    // A catch-all rule only speaks for a path no specific rule claims.
    if (hit.some((r) => r.depth !== 'none' && !r.fallback)) hit = hit.filter((r) => !r.fallback);
    if (!hit.some((r) => r.depth !== 'none') && matches(path, policy.unclassified.match)) {
      hit = [{ id: 'unclassified', ...policy.unclassified }];
    }
    const product = hit.filter((r) => r.depth !== 'none');
    if (!product.length) { ignoredPaths.push(path); continue; }
    productPaths.push(path);
    for (const r of product) {
      if (DEPTH_ORDER[r.depth] > DEPTH_ORDER[depth]) depth = r.depth;
      if (r.depth === 'deep') reasons.push(`${path}: ${r.system} is a shared system`);
      if (r.deepBeforeDeploy) deepBeforeDeploy = true;
      if (r.dataAudit) dataAudit = true;
      if (r.approvedArtCheck) approvedArtCheck = true;
      systems.add(r.system);
      games.add(r.games ?? 'both');
      for (const c of r.checks ?? []) checks.add(c);
      for (const c of expandChapters(r.chapters, policy)) chapters.add(c);
      for (const t of r.targetGroups ?? []) targetGroups.add(t);
    }
  }

  const esc = policy.escalation;
  if (depth === 'focused' && (systems.size >= esc.focusedSystemsForDeep || productPaths.length > esc.productFilesForDeep)) {
    depth = 'deep';
    deepBeforeDeploy = true;
    reasons.push(`${systems.size} systems and ${productPaths.length} product files changed: the batch crosses too much of the game for a focused pass`);
  }
  const game = games.has('both') || games.size > 1 ? 'both' : ([...games][0] ?? 'none');
  if (game === 'both' && depth !== 'none') checks.add('CHK-020');
  if (depth !== 'none') checks.add('CHK-021');
  return {
    depth, deepBeforeDeploy: depth === 'deep' && deepBeforeDeploy, reasons,
    systems: [...systems].sort(), games: game, chapters: [...chapters],
    checks: [...checks].sort(), targetGroups: [...targetGroups].sort(),
    productPaths, ignoredPaths, dataAudit, approvedArtCheck,
  };
}

/** Three substantial checkpoints or seven active days since the last deep review. */
export function accumulatedDeepDue({ substantialSinceDeep = 0, activeDaysSinceDeep = 0 }, policy) {
  const c = policy.cadence;
  if (substantialSinceDeep >= c.substantialCheckpoints) return `${substantialSinceDeep} substantial checkpoints since the last deep review`;
  if (activeDaysSinceDeep >= c.activeDays) return `${activeDaysSinceDeep} active development days with unreviewed changes`;
  return null;
}

/**
 * The review a candidate needs. `claim: 'milestone'` asks for final acceptance;
 * `minimum` may raise the depth and nothing can lower it. `carriedDeep` lists
 * builds that still owe a deep review: the debt moves to this build.
 */
export function planReview({ paths, policy, ledger = {}, carriedDeep = [], claim = null, minimum = null }) {
  const change = classifyChange(paths, policy);
  const reasons = [...change.reasons];
  let review = change.depth === 'none' ? 'live' : change.depth;
  const due = change.depth === 'none' ? null : accumulatedDeepDue(
    { substantialSinceDeep: (ledger.substantialSinceDeep ?? 0) + 1, activeDaysSinceDeep: ledger.activeDaysSinceDeep ?? 0 }, policy);
  if (due && review !== 'deep') { review = 'deep'; reasons.push(due); }
  if (carriedDeep.length && review !== 'deep') { review = 'deep'; reasons.push(`a deep review is still owed from ${carriedDeep.join(', ')}`); }
  for (const raise of [minimum, claim]) {
    if (raise && REVIEW_KINDS.indexOf(raise) > REVIEW_KINDS.indexOf(review)) { review = raise; reasons.push(`raised to ${raise} on request`); }
  }
  if (!reasons.length) reasons.push(review === 'live' ? 'no shipped file changed: deployment verification only' : 'local change: focused review of the changed flow');
  const obligations = ['live'];
  if (review !== 'live') obligations.push('focused');
  if (review === 'deep' || review === 'milestone') obligations.push('deep');
  if (review === 'milestone') obligations.push('milestone');
  return { ...change, review, obligations, reasons, carriedDeep, deepBeforeDeploy: change.deepBeforeDeploy || review === 'milestone' };
}

/**
 * The single weighted score. Scores carry one decimal, so the sum is done in
 * integers (score x10 times weight) and compared unrounded: 9.595 is not 9.60.
 * A missing or UNVERIFIED category leaves the total null; it is never averaged
 * away and never counted as zero.
 */
export function weightedTotal(categories, policy) {
  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const missing = [], belowFloor = [];
  let sum = 0;
  for (const def of policy.categories) {
    const c = byId.get(def.id);
    const ok = c && c.status !== 'UNVERIFIED' && Number.isFinite(c.score) && c.score >= 0 && c.score <= 10;
    if (!ok) { missing.push(def.id); continue; }
    const tenths = Math.round(c.score * 10);
    if (Math.abs(tenths - c.score * 10) > 1e-9) { missing.push(`${def.id} (more than one decimal)`); continue; }
    if (tenths < Math.round(policy.acceptance.categoryFloor * 10)) belowFloor.push(def.id);
    sum += tenths * def.weight;
  }
  if (missing.length) return { total: null, display: 'provisional', provisional: true, missing, belowFloor, meetsTotal: false };
  return {
    total: sum / 1000, display: (Math.floor(sum / 10) / 100).toFixed(2), provisional: false, missing, belowFloor,
    meetsTotal: sum >= Math.round(policy.acceptance.total * 1000),
  };
}

/** Every gate of final acceptance. `accepted` only when no reason is left. */
export function milestoneVerdict(report, policy) {
  const reasons = [];
  if (report.rubricVersion !== policy.rubricVersion) reasons.push(`report is rubric v${report.rubricVersion ?? '?'}, the gate is v${policy.rubricVersion}`);
  if (report.review !== 'milestone') reasons.push(`a ${report.review ?? 'missing'} review cannot accept a milestone`);
  const b = report.build ?? {};
  if (!b.mainSha || !b.bundle || !b.artifactHash) reasons.push('build identity is incomplete (main sha, bundle and artifact hash are all required)');
  const score = weightedTotal(report.categories, policy);
  if (score.provisional) reasons.push(`score is provisional: no verified score for ${score.missing.join(', ')}`);
  else if (!score.meetsTotal) reasons.push(`weighted score ${score.total} is below ${policy.acceptance.total}`);
  for (const id of score.belowFloor) reasons.push(`category ${id} is below the ${policy.acceptance.categoryFloor} floor`);
  for (const c of report.checks ?? []) {
    if (c.mandatory && c.result !== 'PASS' && c.result !== 'NOT APPLICABLE') reasons.push(`mandatory check ${c.id} is ${c.result ?? 'missing'}`);
  }
  const open = (report.issues ?? []).filter((i) => (i.severity === 'critical' || i.severity === 'major') && i.status !== 'fixed-verified');
  if (open.length) reasons.push(`${open.length} critical or major issue(s) remain open`);
  const enc = report.encounters ?? [];
  if (!enc.length) reasons.push('no encounter completion evidence recorded');
  for (const e of enc) if (e.completedRealFlow !== true) reasons.push(`encounter ${e.id} has no complete real-input flow`);
  const t = report.targets;
  if (!t) reasons.push('approved-target comparison is missing');
  else {
    for (const k of ['failing', 'unverified', 'waiting']) if (t[k] !== 0) reasons.push(`${t[k] ?? 'unknown'} required target(s) ${k}`);
    if (!(t.required > 0) || t.matched !== t.required) reasons.push(`only ${t.matched ?? 0} of ${t.required ?? 0} required targets matched`);
  }
  for (const h of report.humanJudgments ?? [{ what: 'required human judgments', recorded: false }]) {
    if (h.recorded !== true) reasons.push(`human judgment not recorded: ${h.what}`);
  }
  if (report.verdicts?.deployment !== 'PASS') reasons.push(`live verification of the exact artifact is ${report.verdicts?.deployment ?? 'missing'}`);
  return { accepted: reasons.length === 0, reasons, score };
}

/** Is this report well-formed enough to count as evidence? Returns error strings. */
export function validateReport(report, policy) {
  const errors = [];
  if (!report || typeof report !== 'object') return ['report is not an object'];
  if (report.rubricVersion !== policy.rubricVersion) errors.push(`rubricVersion must be ${policy.rubricVersion}`);
  if (!REVIEW_KINDS.includes(report.review)) errors.push(`review must be one of ${REVIEW_KINDS.join(', ')}`);
  if (!report.build?.mainSha) errors.push('build.mainSha is required: a report without a build certifies nothing');
  if (['live', 'milestone'].includes(report.review) && !report.build?.artifactHash) errors.push('build.artifactHash is required for a live or milestone review');
  if (!report.date || Number.isNaN(new Date(report.date).getTime())) errors.push('date must be an ISO timestamp');
  const v = report.verdicts ?? {};
  for (const k of ['deployment', 'changedArea']) if (!RESULTS.includes(v[k])) errors.push(`verdicts.${k} must be one of ${RESULTS.join(' / ')}`);
  if (!MILESTONE_STATES.includes(v.milestone)) errors.push(`verdicts.milestone must be one of ${MILESTONE_STATES.join(' / ')}`);
  const known = new Set(policy.checks.map((c) => c.id));
  for (const c of report.checks ?? []) {
    if (!known.has(c.id)) errors.push(`unknown check id ${c.id}`);
    if (!RESULTS.includes(c.result)) errors.push(`${c.id}: result must be one of ${RESULTS.join(' / ')}`);
    if ((c.result === 'NOT APPLICABLE' || c.result === 'UNVERIFIED') && !c.reason) errors.push(`${c.id}: ${c.result} needs a reason`);
    if (c.result === 'PASS' && !(c.evidence?.length || c.reusedFrom)) errors.push(`${c.id}: a PASS needs evidence or a named reused result`);
    if (c.reusedFrom && !c.dependencyArgument) errors.push(`${c.id}: reused evidence needs its dependency argument`);
  }
  if (v.deployment === 'PASS' && !(report.checks ?? []).some((c) => c.id === 'CHK-017' && c.result === 'PASS')) {
    errors.push('deployment PASS needs CHK-017 (exact live artifact) recorded as PASS');
  }
  if (v.milestone === 'accepted') {
    const verdict = milestoneVerdict(report, policy);
    if (!verdict.accepted) errors.push(`report claims the milestone is accepted but the gates disagree: ${verdict.reasons.join('; ')}`);
  }
  // Optional repair count per issue (RUBRIC §8); old reports carry none and stay valid.
  for (const i of report.issues ?? []) {
    if (i.attempts !== undefined && !(Number.isInteger(i.attempts) && i.attempts >= 0)) errors.push(`${i.id ?? 'issue'}: attempts must be a whole number of repair attempts`);
  }
  return errors;
}

const isOpen = (issue) => !/^(fixed|closed|verified|withdrawn|refuted)/i.test(String(issue.status ?? 'open'));

/**
 * The stagnation rule (RUBRIC §8): issue IDs that the last N consecutive deep or
 * milestone reports (N = `cadence.stalledAfterReviews`) all leave open at the same
 * severity, plus any issue at or past `cadence.repairAttemptsBeforeEscalation`.
 * `reports` are oldest first: `{ id, rubricVersion, review, issues }`. Information
 * for the next plan; it never blocks a deploy.
 */
export function stalledIssues(reports, policy) {
  const n = policy.cadence?.stalledAfterReviews ?? 2;
  const cap = policy.cadence?.repairAttemptsBeforeEscalation ?? 2;
  const full = reports.filter((r) => (r.rubricVersion ?? 1) >= policy.rubricVersion && ['deep', 'milestone'].includes(r.review) && Array.isArray(r.issues));
  const out = [];
  const window = full.slice(-n);
  if (window.length === n) {
    for (const issue of window[n - 1].issues.filter(isOpen)) {
      const same = window.every((r) => r.issues.some((i) => i.id === issue.id && isOpen(i) && i.severity === issue.severity));
      if (same) out.push({ id: issue.id, severity: issue.severity, title: issue.title ?? '', reason: `open in ${window.map((r) => r.id).join(', ')}`, attempts: issue.attempts ?? null });
    }
  }
  const last = full[full.length - 1];
  for (const issue of last?.issues.filter(isOpen) ?? []) {
    if ((issue.attempts ?? 0) >= cap && !out.some((o) => o.id === issue.id)) out.push({ id: issue.id, severity: issue.severity, title: issue.title ?? '', reason: `${issue.attempts} repair attempts`, attempts: issue.attempts });
  }
  return out;
}
