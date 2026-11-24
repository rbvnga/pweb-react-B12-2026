import type { Application, DashboardStats } from "../types";
import { isGhostingRisk } from "./applicationHelpers";

// untuk mengubah angka jadi persen (dibulatkan)
function toPercent(part: number, whole: number): number {
  if (whole === 0) {
    return 0;
  }
  return Math.round((part / whole) * 100);
}

// untuk menghitung angka 5 kartu statistik dari daftar lamaran
export function calculateDashboardStats(
  applications: Application[]
): DashboardStats {
  // untuk menghitung lamaran yang sudah dikirim (selain WISHLIST)
  const sentCount = applications.filter(
    (app) => app.status !== "WISHLIST"
  ).length;

  // untuk menghitung lamaran yang sudah dibalas perusahaan
  const respondedCount = applications.filter(
    (app) =>
      app.status === "SCREENING" ||
      app.status === "INTERVIEW" ||
      app.status === "OFFER" ||
      app.status === "REJECTED"
  ).length;

  // untuk menghitung lamaran yang sudah sampai tahap interview
  const interviewCount = applications.filter(
    (app) => app.status === "INTERVIEW" || app.status === "OFFER"
  ).length;

  // untuk menghitung lamaran yang rawan ghosting (> 14 hari)
  const ghostingCount = applications.filter((app) =>
    isGhostingRisk(app)
  ).length;

  // untuk menghitung lamaran yang sudah dapat offer
  const offerCount = applications.filter(
    (app) => app.status === "OFFER"
  ).length;

  return {
    totalApplications: applications.length,
    sentCount: sentCount,
    respondedCount: respondedCount,
    interviewCount: interviewCount,
    responseRate: toPercent(respondedCount, sentCount),
    interviewRate: toPercent(interviewCount, sentCount),
    ghostingCount: ghostingCount,
    offerCount: offerCount,
  };
}
