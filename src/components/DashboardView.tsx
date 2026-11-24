import { useState } from "react";
import "./DashboardView.css";
import type { Application, OfferScoreBreakdown } from "../types";
import { calculateDashboardStats } from "../utils/dashboardStats";
import { calculateOfferComparison } from "../utils/applicationHelpers";

interface DashboardViewProps {
  applications: Application[];
  kaptenSkills: string[];
}

// untuk format uang, contoh 4500000 -> "Rp 4.500.000"
function formatRupiah(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

export default function DashboardView({
  applications,
  kaptenSkills,
}: DashboardViewProps) {
  // untuk menyimpan id offer yang dipilih di dropdown
  const [offerAId, setOfferAId] = useState("");
  const [offerBId, setOfferBId] = useState("");

  // untuk angka 5 kartu statistik (dihitung ulang setiap render)
  const stats = calculateDashboardStats(applications);

  // untuk mengambil lamaran yang statusnya OFFER saja
  const offers = applications.filter((app) => app.status === "OFFER");

  // untuk menentukan Offer A (default: offer pertama)
  let offerA = offers.find((o) => o.id === offerAId);
  if (!offerA) {
    offerA = offers[0];
  }

  // untuk menentukan Offer B (tidak boleh sama dengan Offer A)
  let offerB = offers.find((o) => o.id === offerBId && o.id !== offerA?.id);
  if (!offerB) {
    offerB = offers.find((o) => o.id !== offerA?.id);
  }

  return (
    <section className="dashboard">
      {/* untuk 5 kartu statistik */}
      <div className="dashboard-box">
        <h2 className="dashboard-title">Dashboard Statistik</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Lamaran</p>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Response Rate</p>
            <p className="stat-value">{stats.responseRate}%</p>
            <p className="stat-note">
              {stats.respondedCount} dari {stats.sentCount} lamaran dibalas
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Interview Rate</p>
            <p className="stat-value">{stats.interviewRate}%</p>
            <p className="stat-note">
              {stats.interviewCount} dari {stats.sentCount} lamaran sampai
              interview
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Rawan Ghosting</p>
            <p className="stat-value">{stats.ghostingCount}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Total Offer</p>
            <p className="stat-value">{stats.offerCount}</p>
          </div>
        </div>
      </div>

      {/* untuk Offer Comparator */}
      <div className="dashboard-box">
        <div className="comparator-top">
          <div>
            <h2 className="dashboard-title">Bandingkan Offer Magang</h2>
          </div>

          {/* untuk dropdown pilih Offer A dan Offer B */}
          {offerA && offerB && (
            <div className="comparator-selects">
              <select
                className="catalog-select"
                value={offerA.id}
                onChange={(e) => setOfferAId(e.target.value)}
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    Offer A: {o.company}
                  </option>
                ))}
              </select>

              <span>vs</span>

              <select
                className="catalog-select"
                value={offerB.id}
                onChange={(e) => setOfferBId(e.target.value)}
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id} disabled={o.id === offerA.id}>
                    Offer B: {o.company}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* untuk pesan kosong kalau offer kurang dari 2 */}
        {(!offerA || !offerB) && (
          <div className="state-box empty-box">
            <p className="state-title">Belum Bisa Membandingkan Offer</p>
            <p className="state-desc">
              Butuh minimal 2 lamaran berstatus OFFER. Saat ini baru ada{" "}
              {offers.length}.
            </p>
          </div>
        )}

        {/* untuk menampilkan perbandingan kalau offer sudah 2 */}
        {offerA && offerB && (
          <ComparisonResult
            offerA={offerA}
            offerB={offerB}
            kaptenSkills={kaptenSkills}
          />
        )}
      </div>
    </section>
  );
}

interface ComparisonResultProps {
  offerA: Application;
  offerB: Application;
  kaptenSkills: string[];
}

// untuk menghitung skor lalu menampilkan 2 kartu offer
function ComparisonResult({
  offerA,
  offerB,
  kaptenSkills,
}: ComparisonResultProps) {
  const result = calculateOfferComparison(offerA, offerB, kaptenSkills);

  return (
    <>
      {/* untuk info kalau skornya sama */}
      {result.recommendedId === null && (
        <p className="tie-note">Skor kedua offer sama.</p>
      )}

      <div className="comparator-grid">
        <OfferCard
          app={offerA}
          score={result.scoreA}
          isBest={result.recommendedId === offerA.id}
        />
        <OfferCard
          app={offerB}
          score={result.scoreB}
          isBest={result.recommendedId === offerB.id}
        />
      </div>
    </>
  );
}

interface OfferCardProps {
  app: Application;
  score: OfferScoreBreakdown;
  isBest: boolean;
}

// untuk menampilkan 1 kartu offer
function OfferCard({ app, score, isBest }: OfferCardProps) {
  let cardClass = "offer-card";
  if (isBest) {
    cardClass = "offer-card best";
  }

  return (
    <div className={cardClass}>
      <div className="offer-top">
        <div>
          <h3 className="offer-company">{app.company}</h3>
          <p className="offer-role">{app.role}</p>
        </div>
        {isBest && <span className="best-badge">Rekomendasi Terbaik</span>}
      </div>

      <table className="offer-table">
        <tbody>
          <tr>
            <td>Uang Saku / Bulan</td>
            <td>{formatRupiah(app.salaryOffer ?? 0)}</td>
            <td className="offer-score">{score.salaryScore.toFixed(1)} / 50</td>
          </tr>
          <tr>
            <td>Mode Kerja</td>
            <td>
              {app.workMode} ({score.workModeRaw})
            </td>
            <td className="offer-score">
              {score.workModeScore.toFixed(1)} / 25
            </td>
          </tr>
          <tr>
            <td>Kecocokan Skill</td>
            <td>
              {score.skillMatchPercent}% ({score.matchedCount} dari{" "}
              {score.totalRequired} skill)
            </td>
            <td className="offer-score">
              {score.skillMatchScore.toFixed(1)} / 25
            </td>
          </tr>
        </tbody>
      </table>

      <div className="offer-total">
        <span>Total Skor</span>
        <span className="offer-total-value">{score.totalScore.toFixed(1)}</span>
      </div>
    </div>
  );
}
