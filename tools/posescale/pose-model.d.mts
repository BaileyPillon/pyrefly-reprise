import type { ModelGame, ModelPoseClass, SubjectKind } from './pose-kinds.mjs';

/** One row of the generated registration tables, as the model reads it (`src/data/art/poseRegistrationTypes.ts`). */
export interface ModelRow {
  scale?: number;
  stanceX?: number;
  feetRow?: number;
  upright?: true;
  head?: readonly [number, number, number, number];
  status?: 'ok' | 'held' | 'waived' | 'blocked';
  class?: string;
  stature?: number;
  headReal?: number;
  lengthRatio?: number;
  iou?: number;
  sha?: string;
}

export interface ModelInputs {
  root: string;
  artDir: string;
  table: Record<string, Record<string, ModelRow>>;
  tableSource: Record<string, string>;
  koScale: Record<string, number>;
  /** docs/target/pose-measure.json */
  records: { subjects?: Record<string, { poses?: Record<string, any> }> } & Record<string, any>;
  refs: Map<string, unknown>;
  /** Also check each painting's `@2x`/`@3x`/`@4x` masters against it (`pose-hires.mjs`). */
  hires?: boolean;
}

export interface PoseReading {
  subject: string;
  pose: string;
  kind: SubjectKind;
  game: ModelGame;
  class: ModelPoseClass;
  isRef: boolean;
  refPose: string;
  /** sha256 (64 hex) of the master PNG on disk. */
  sha: string;
  size: [number, number];
  /** Nothing opaque (no pixel over alpha 128) in the painting. */
  empty: boolean;
  /** Opaque pixels over the area of their bounding box (a rectangle is 1). */
  solidity: number | null;
  /** The painted area over the idle's, both at the size they are drawn. */
  areaOverIdle: number | null;
  /** Where the registered head box sits on the silhouette: its centre's height down the figure (0 top, 1 soles) and the share of the box that is painted. */
  headBox: { cy: number | null; coverage: number | null } | null;
  /** The idle has a registered head box. */
  refHasHead: boolean;
  /** The idle is itself wider than 1.15 times its height (a hull). */
  refWide: boolean;
  /** How far a recorded hold's `headRatio` is from its applied scale over its ruler reading. Null with no hold. */
  heldGap: number | null;
  /** The `@Nx` masters' problems, or null when not checked. */
  hires: Array<{ code: 'hires-size' | 'hires-differs' | 'hires-unreadable'; tier: number; message: string }> | null;
  hasRow: boolean;
  hasHead: boolean;
  hasStance: boolean;
  held: boolean;
  heldHeadRatio: number | null;
  status: 'ok' | 'held' | 'waived' | 'blocked' | null;
  rowSha: string | null;
  scale: number | null;
  scaleSrc: 'reg' | 'ko-table' | 'sidecar' | 'none';
  anchorRow: number;
  anchorSrc: 'feetRow' | 'sidecar-anchorY' | 'baseline';
  clamped: boolean;
  lock: number | null;
  prone: boolean;
  mirror: 1 | -1;
  /** The figure's height over the idle's, as drawn, head lock applied. */
  stature: number | null;
  statureTable: number | null;
  /** Head top to soles over the idle's (props left out). */
  bodyStature: number | null;
  /** The head the player sees over the idle's (a hold's real ratio). Null with no registered head. */
  headReal: number | null;
  headTable: number | null;
  /** A laid-down painting's length over the idle's height. */
  lengthRatio: number | null;
  massRatio: number | null;
  /** Overlap with the idle's silhouette as drawn (1 for the idle). */
  iou: number | null;
  /** The stance read from the pixels, in the painting's own pixels. */
  feetPx: { x: number; row: number } | null;
  /** Where the stance lands against the idle's, in idle heights. Null for the idle, a laid-down painting, or a missing stance. */
  feet: { dx: number; dy: number } | null;
  /** Fraction of the painting's height a registered `feetRow` sits above the alpha baseline (the Lady Luck defect when over 0.02); 0 with none. */
  feetRowGap: number | null;
  sinkIdle: number | null;
  stanceRegistered: number | null;
  stanceDiffPx: number | null;
  fromPixels: {
    size: [number, number];
    alphaBaseline: number | null;
    alphaBox: { x0: number; x1: number; y0: number; y1: number } | null;
    bbox: number[];
    stanceX: number | null;
    stanceRow: number | null;
    figureHeightPx: number | null;
    /** Height from the alpha baseline over the idle's, whatever the table's feetRow says. */
    heightOverIdle: number | null;
    feetRowGap: number | null;
    sinkIdle: number | null;
    stanceBothRead: boolean;
  };
  drawn: { upp: number; anchor: number; shift: number; mirror: number };
}

export function loadModelInputs(o?: {
  root?: string;
  artDir?: string;
  table?: ModelInputs['table'];
  tableSource?: Record<string, string>;
  koScale?: Record<string, number>;
  records?: ModelInputs['records'];
  hires?: boolean;
}): Promise<ModelInputs>;
export function listSubjects(inputs: ModelInputs): string[];
export function listPoses(inputs: ModelInputs, subject: string): string[];
export function readSubject(inputs: ModelInputs, subject: string, o?: { poses?: string[] }): Promise<PoseReading[]>;
export function readPose(subject: string, pose: string, opts?: { inputs?: ModelInputs; root?: string; artDir?: string }): Promise<PoseReading>;
export function readAll(inputs: ModelInputs, o?: { subjects?: string[]; concurrency?: number; onSubject?: (subject: string, readings: PoseReading[]) => void }): Promise<PoseReading[]>;

/** The idle's side of one subject (everything every other pose is read against), as `referenceOf` builds it; the rig gate reads a rig key against it. */
export interface ModelReference {
  subject: string;
  refName: string;
  kind: SubjectKind;
  game: ModelGame;
  poses: string[];
  /** The idle, as `pose-pixels.mjs#readPaint` read it. */
  M: { W: number; H: number; mass: number; area: number; proneRaw: boolean; stance: { x: number; row: number } | null; engineBox: { x0: number; x1: number; y0: number; y1: number } | null; [k: string]: any };
  row: Record<string, any>;
  /** Idle heights per painting pixel, as the idle is drawn. */
  upp: number;
  /** The row the idle is planted on, in its painting's pixels. */
  anchor: number;
  /** The idle's figure height as drawn (1 less its padding). */
  figH: number;
  mirror: 1 | -1;
  want: number;
  head: readonly number[] | null;
  headSize: number | null;
  stanceMeasured: number | null;
  stanceMeasuredOff: number | null;
  solesGap: number | null;
  bodyH: number | null;
  pixelFigH: number | null;
  /** The idle's silhouette on the common grid. */
  mask: Uint8Array;
  [k: string]: any;
}
export function referenceOf(inputs: ModelInputs, subject: string): Promise<ModelReference>;
