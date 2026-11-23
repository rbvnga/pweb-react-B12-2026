import type {
  Application,
  InterviewConflict,
  OfferScoreBreakdown,
  WorkMode,
} from "../types";
import { calculateSkillMatch } from "./skillMatch";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SIXTY_MINUTES_MS = 60 * 60 * 1000;

export function isDuplicateApplication(
  applications: Application[],
  company: string,
  role: string
): boolean {
  const targetCompany = company.trim().toLowerCase();
  const targetRole = role.trim().toLowerCase();

  if (!targetCompany || !targetRole) return false;

  return applications.some(
    (app) =>
      app.company.trim().toLowerCase() === targetCompany &&
      app.role.trim().toLowerCase() === targetRole
  );
}

export function inferWorkModeFromLocation(locationText: string): WorkMode {
  const lower = locationText.toLowerCase();
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("onsite") || lower.includes("on-site")) return "Onsite";
  return "Remote";
}

export function isGhostingRisk(
  app: Application,
  nowMs: number = Date.now()
): boolean {
  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }
  const updatedTime = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(updatedTime)) return false;

  return nowMs - updatedTime > FOURTEEN_DAYS_MS;
}

export function detectInterviewConflicts(
  applications: Application[]
): InterviewConflict[] {
  const interviewApps = applications.filter(
    (app) => app.status === "INTERVIEW" && Boolean(app.interviewDateTime)
  );

  const conflicts: InterviewConflict[] = [];

  for (let i = 0; i < interviewApps.length; i++) {
    for (let j = i + 1; j < interviewApps.length; j++) {
      const appA = interviewApps[i];
      const appB = interviewApps[j];
      const timeA = new Date(appA.interviewDateTime ?? "").getTime();
      const timeB = new Date(appB.interviewDateTime ?? "").getTime();

      if (Number.isNaN(timeA) || Number.isNaN(timeB)) continue;

      const diffMs = Math.abs(timeA - timeB);
      if (diffMs < SIXTY_MINUTES_MS) {
        conflicts.push({
          appA,
          appB,
          diffMinutes: Math.round(diffMs / (60 * 1000)),
        });
      }
    }
  }

  return conflicts;
}

const WORK_MODE_SCORES: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export function calculateOfferComparison(
  offerA: Application,
  offerB: Application,
  kaptenSkills: string[]
): {
  scoreA: OfferScoreBreakdown;
  scoreB: OfferScoreBreakdown;
  recommendedId: string | null;
} {
  const salaryA = offerA.salaryOffer ?? 0;
  const salaryB = offerB.salaryOffer ?? 0;
  const maxSalary = Math.max(salaryA, salaryB, 1);

  const buildBreakdown = (app: Application): OfferScoreBreakdown => {
    const salary = app.salaryOffer ?? 0;
    const normalizedSalary = (salary / maxSalary) * 100;
    const salaryScore = Number(((normalizedSalary * 50) / 100).toFixed(1));

    const workModeRaw = WORK_MODE_SCORES[app.workMode];
    const workModeScore = Number(((workModeRaw * 25) / 100).toFixed(1));

    const matchResult = calculateSkillMatch(kaptenSkills, app.requiredSkills);
    const skillMatchScore = Number(((matchResult.score * 25) / 100).toFixed(1));

    const totalScore = Number(
      (
        (normalizedSalary * 50) / 100 +
        (workModeRaw * 25) / 100 +
        (matchResult.score * 25) / 100
      ).toFixed(1)
    );

    return {
      salaryScore,
      workModeScore,
      workModeRaw,
      skillMatchPercent: matchResult.score,
      skillMatchScore,
      matchedCount: matchResult.matchedSkills.length,
      totalRequired: app.requiredSkills.length,
      totalScore,
    };
  };

  const scoreA = buildBreakdown(offerA);
  const scoreB = buildBreakdown(offerB);

  let recommendedId: string | null = null;
  if (scoreA.totalScore > scoreB.totalScore) {
    recommendedId = offerA.id;
  } else if (scoreB.totalScore > scoreA.totalScore) {
    recommendedId = offerB.id;
  }

  return { scoreA, scoreB, recommendedId };
}
