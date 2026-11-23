import type { ApplicationStatus } from "../types";

export const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  WISHLIST: ["APPLIED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  GHOSTED: ["SCREENING"],
  OFFER: [],
  REJECTED: [],
};

export function getAllowedNextStatuses(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus];
}

export function canTransitionStatus(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
