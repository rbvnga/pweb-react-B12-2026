import { useMemo, useState } from "react";
import "./PipelineView.css";
import type { Application, ApplicationStatus } from "../types";
import { calculateSkillMatch, getMatchBadgeTier } from "../utils/skillMatch";
import {
  detectInterviewConflicts,
  isGhostingRisk,
} from "../utils/applicationHelpers";
import { useDebounce } from "../hooks/useDebounce";

// Tipe untuk state filter/sort di PipelineView. Bukan bagian dari ApplicationStatus (Tipe Lokal Komponen).

type SortOption = "newest" | "interview" | "offer";
type StatusFilter = "ALL" | ApplicationStatus;

const ALL_STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

interface PipelineViewProps {
  /** SELURUH lamaran (belum difilter). Filter dilakukan di dalam komponen ini. */
  applications: Application[];
  kaptenSkills: string[];
  /**
   * Cara mengubah satu lamaran. Komponen ini TIDAK memegang data sendiri,
   * ia hanya meminta App mengubah lewat updater (fungsi murni app -> app baru).
   */
  onUpdateApplication: (
    id: string,
    updater: (app: Application) => Application
  ) => void;
  /** Dipakai Fitur 4: klik kartu -> buka Detail Lamaran. */
  onOpenDetail?: (id: string) => void;
  /** Dipakai Fitur 6 (Undo Delete). Tombol Hapus hanya muncul kalau prop ini ada. */
  onDelete?: (id: string) => void;
}


/** Ubah "YYYY-MM-DDTHH:mm" jadi angka ms. Kalau kosong/invalid -> Infinity
 *  supaya lamaran tanpa jadwal otomatis jatuh ke urutan paling bawah. */
function interviewTimeOrInfinity(app: Application): number {
  if (!app.interviewDateTime) return Number.POSITIVE_INFINITY;
  const t = new Date(app.interviewDateTime).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function formatInterviewTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}


// KOMPONEN UTAMA
export default function PipelineView({
  applications,
  kaptenSkills,
  onUpdateApplication,
  onOpenDetail,
  onDelete,
}: PipelineViewProps) {
  /* ---- STATE ----
   * Hanya input mentah dari user yang disimpan di useState.
   * Hasil filter / sort / jumlah ghosting / konflik TIDAK disimpan di state
   * (itu "derived state", dihitung ulang dari data di bawah). */
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [onlyGhosting, setOnlyGhosting] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Debounce 400ms memakai custom hook buatan sendiri, sama seperti di
  // Eksplorasi Lowongan, supaya list tidak di-filter di setiap ketikan.
  const debouncedSearch = useDebounce(searchText, 400);

  /* ---- DERIVED STATE: BANNER BENTROK ----
   * PENTING (Testcase 7): yang dikirim ke detectInterviewConflicts adalah
   * `applications` (SELURUH data dari props), BUKAN `visibleApplications`.
   * Jadi walau user memfilter status "WISHLIST", banner tetap muncul. */
  const conflicts = useMemo(
    () => detectInterviewConflicts(applications),
    [applications]
  );

  /* ---- DERIVED STATE: FILTER + SORT ---- */
  const visibleApplications = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    // 1) FILTER. .filter() menghasilkan array baru, array asli tidak disentuh.
    const filtered = applications.filter((app) => {
      // a) pencarian teks pada nama perusahaan ATAU posisi (tak peka huruf besar/kecil)
      if (
        keyword &&
        !app.company.toLowerCase().includes(keyword) &&
        !app.role.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      // b) filter status
      if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
      // c) toggle "Hanya Rawan Ghosting" (aturan 14 hari ada di isGhostingRisk)
      if (onlyGhosting && !isGhostingRisk(app)) return false;
      return true;
    });

    // 2) SORT. .sort() mengubah array yang dipanggilnya, jadi kita pakai
    //    array baru hasil filter (filtered) supaya tidak mengubah props asli.
    if (sortBy === "interview") {
      // Jadwal interview terdekat dulu; yang tanpa jadwal di paling bawah.
      filtered.sort(
        (a, b) => interviewTimeOrInfinity(a) - interviewTimeOrInfinity(b)
      );
    } else if (sortBy === "offer") {
      // Gaji offer tertinggi dulu; yang tanpa offer dianggap 0.
      filtered.sort((a, b) => (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0));
    }
    // Default: "newest" (terbaru dulu) -> tidak perlu sort, karena array

    return filtered;
  }, [applications, debouncedSearch, statusFilter, onlyGhosting, sortBy]);

  /* ---- AKSI: SIMULASI +15 HARI ---- */
  const handleSimulate15Days = (id: string) => {
    onUpdateApplication(id, (app) => {
      const base = new Date(app.lastUpdatedAt).getTime();
      // Mundurkan lastUpdatedAt 15 hari. Date dibuat baru; tidak ada mutasi.
      const shifted = new Date(base - FIFTEEN_DAYS_MS).toISOString();

      // Immutable: kembalikan OBJEK BARU lewat spread, activityLogs juga
      // diganti array baru (bukan .push()).
      return {
        ...app,
        lastUpdatedAt: shifted,
        activityLogs: [
          ...app.activityLogs,
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: "Simulasi +15 hari (untuk uji Rawan Ghosting)",
          },
        ],
      };
    });
  };

  const hasActiveFilter =
    searchText.trim() !== "" || statusFilter !== "ALL" || onlyGhosting;

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setOnlyGhosting(false);
  };

  /* ---- RENDER ---- */
  return (
    <section className="pipeline-section">
      {/* Banner bentrok: bergantung pada `conflicts` (data penuh), bukan filter */}
      {conflicts.length > 0 && (
        <div className="conflict-banner" role="alert">
          <strong>⚠ Jadwal Interview Bentrok:</strong>
          <ul className="conflict-list">
            {conflicts.map((c) => (
              <li key={`${c.appA.id}-${c.appB.id}`}>
                {c.appA.company} (
                {formatInterviewTime(c.appA.interviewDateTime ?? "")}) dan{" "}
                {c.appB.company} (
                {formatInterviewTime(c.appB.interviewDateTime ?? "")}) berselisih
                hanya {c.diffMinutes} menit (kurang dari 60 menit).
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="section-header-bar">
        <div>
          <h2>War Room Pipeline</h2>
          <p className="section-sub">
            Menampilkan {visibleApplications.length} dari {applications.length}{" "}
            lamaran
          </p>
        </div>
      </div>

      {/* Toolbar filter gabungan */}
      <div className="pipeline-toolbar">
        <input
          type="text"
          className="catalog-search-input pipeline-search"
          placeholder="Cari perusahaan atau posisi..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="catalog-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">Semua Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="catalog-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="newest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>

        <label className="ghost-toggle">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>
      </div>

      {/* Empty state: ada 2 jenis (belum ada data vs tidak ada yang cocok filter) */}
      {applications.length === 0 ? (
        <div className="state-box empty-box">
          <p className="state-title">Belum Ada Lamaran Tersimpan</p>
          <p className="state-desc">
            Simpan lowongan dari katalog Eksplorasi atau klik{" "}
            <strong>+ Catat Lamaran</strong>.
          </p>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="state-box empty-box">
          <p className="state-title">Tidak Ada Lamaran yang Cocok</p>
          <p className="state-desc">Coba ubah kata kunci atau filter.</p>
          {hasActiveFilter && (
            <button type="button" className="btn-retry" onClick={resetFilters}>
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="pipeline-list">
          {visibleApplications.map((app) => {
            const match = calculateSkillMatch(kaptenSkills, app.requiredSkills);
            const tier = getMatchBadgeTier(match.score);

            // Progress checklist (derived): "3/4"
            const doneCount = app.checklist.filter((c) => c.done).length;
            const totalCount = app.checklist.length;
            const percent =
              totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

            const ghosting = isGhostingRisk(app);
            const canSimulate =
              app.status === "APPLIED" || app.status === "SCREENING";

            return (
              <article key={app.id} className="pipeline-card">
                <div className="pipeline-card-main">
                  <div className="pipeline-card-title">
                    <h3 className="saved-app-role">{app.role}</h3>
                    <p className="saved-app-company">
                      {app.company} • {app.workMode}
                    </p>
                  </div>

                  <div className="pipeline-badges">
                    <span className="status-pill">{app.status}</span>
                    {ghosting && (
                      <span className="ghost-badge"> Rawan Ghosting</span>
                    )}
                    <span className={`match-badge match-${tier}`}>
                      ● {match.score}% Match
                    </span>
                  </div>
                </div>

                <div className="pipeline-meta">
                  <span className="meta-text">
                    CV: {app.cvVersion ?? "-"}
                  </span>
                  {app.interviewDateTime && (
                    <span className="meta-text">
                      Interview: {formatInterviewTime(app.interviewDateTime)}
                    </span>
                  )}
                  {app.salaryOffer !== undefined && app.salaryOffer > 0 && (
                    <span className="meta-text">
                      Offer: {formatRupiah(app.salaryOffer)}
                    </span>
                  )}
                  {match.missingSkills.length > 0 && (
                    <span className="meta-text missing-text">
                      Missing: {match.missingSkills.join(", ")}
                    </span>
                  )}
                </div>

                <div className="pipeline-progress">
                  <div className="progress-label">
                    <span>Checklist</span>
                    <span>
                      {doneCount}/{totalCount} selesai
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="pipeline-actions">
                  {onOpenDetail && (
                    <button
                      type="button"
                      className="btn-submit-form"
                      onClick={() => onOpenDetail(app.id)}
                    >
                      Detail
                    </button>
                  )}
                  {canSimulate && (
                    <button
                      type="button"
                      className="btn-fallback"
                      onClick={() => handleSimulate15Days(app.id)}
                    >
                      Simulasi +15 Hari
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="btn-delete-app"
                      onClick={() => onDelete(app.id)}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}