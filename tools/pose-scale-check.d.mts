export const TOLERANCE: number;
export function poseFiles(artDir: string, subject: string): string[];
export interface PoseScaleCheckInput {
  records: { subjects: Record<string, any> };
  table: Record<string, Record<string, { scale?: number; stanceX?: number; feetRow?: number; upright?: true }>>;
  artDir: string;
  subjects?: string[];
  listNew?: boolean;
}
export function checkPoseScale(o: PoseScaleCheckInput): {
  failures: string[];
  notes: string[];
  summary: Array<{ subject: string; poses: number; reviewed: number; registered: number }>;
};
