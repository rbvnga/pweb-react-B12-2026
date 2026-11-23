import type { SkillMatchResult } from "../types";

export function calculateSkillMatch(
  kaptenSkills: string[],
  requiredSkills: string[]
): SkillMatchResult {
  if (requiredSkills.length === 0) {
    return {
      score: 100,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const ownedSet = new Set(
    kaptenSkills.map((s) => s.trim().toLowerCase()).filter(Boolean)
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of requiredSkills) {
    const clean = skill.trim();
    if (!clean) continue;

    if (ownedSet.has(clean.toLowerCase())) {
      matchedSkills.push(clean);
    } else {
      missingSkills.push(clean);
    }
  }

  const totalRequired = matchedSkills.length + missingSkills.length;
  const score =
    totalRequired === 0
      ? 100
      : Math.round((matchedSkills.length / totalRequired) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}

export function getMatchBadgeTier(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
