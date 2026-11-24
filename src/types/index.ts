export type WorkMode = "Remote" | "Hybrid" | "Onsite";

export type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  lastUpdatedAt: string;
  checklist: ChecklistItem[];
  activityLogs: ActivityLog[];
  location?: string;
  salaryText?: string;
}

export interface JobListing {
  id: number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}

export type JobDataSource = "api" | "fallback";

export interface SkillMatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface InterviewConflict {
  appA: Application;
  appB: Application;
  diffMinutes: number;
}

// untuk angka di 5 kartu statistik Dashboard (Fitur 7)
export interface DashboardStats {
  totalApplications: number;
  sentCount: number;
  respondedCount: number;
  interviewCount: number;
  responseRate: number;
  interviewRate: number;
  ghostingCount: number;
  offerCount: number;
}

export interface OfferScoreBreakdown {
  salaryScore: number;
  workModeScore: number;
  workModeRaw: number;
  skillMatchPercent: number;
  skillMatchScore: number;
  matchedCount: number;
  totalRequired: number;
  totalScore: number;
}
