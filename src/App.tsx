import { useState } from "react";
import "./App.css";
import type { Application, JobListing } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  inferWorkModeFromLocation,
  isDuplicateApplication,
} from "./utils/applicationHelpers";
import { calculateSkillMatch, getMatchBadgeTier } from "./utils/skillMatch";
import JobExploration from "./components/JobExploration";
import ManualApplicationForm from "./components/ManualApplicationForm";

const DEFAULT_KAPTEN_SKILLS: string[] = [
  "React",
  "TypeScript",
  "CSS",
  "Git",
  "REST API",
  "PostgreSQL",
];

type ActiveTab = "explore" | "pipeline" | "comparator";

export default function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "aku_mw_magang_skills",
    DEFAULT_KAPTEN_SKILLS
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "aku_mw_magang_applications",
    []
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");
  const [isManualFormOpen, setIsManualFormOpen] = useState<boolean>(false);

  const handleAddSkill = (rawSkill: string): boolean => {
    const clean = rawSkill.trim();
    if (!clean) return false;

    const isDuplicate = kaptenSkills.some(
      (s) => s.trim().toLowerCase() === clean.toLowerCase()
    );
    if (isDuplicate) return false;

    setKaptenSkills((prev) => [...prev, clean]);
    return true;
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setKaptenSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const handleSaveJobToWishlist = (job: JobListing) => {
    if (
      isDuplicateApplication(applications, job.company_name, job.title)
    ) {
      return;
    }

    const nowIso = new Date().toISOString();
    const newApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkModeFromLocation(job.candidate_required_location),
      status: "WISHLIST",
      requiredSkills: job.tags,
      lastUpdatedAt: nowIso,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowIso,
          message: "Disimpan ke Wishlist dari Katalog",
        },
      ],
      location: job.candidate_required_location,
      salaryText: job.salary,
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const handleAddManualApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const offerCount = applications.filter((a) => a.status === "OFFER").length;

  return (
    <div className="app-shell">
      <header className="top-navbar">
        <div className="navbar-inner">
          <div className="brand-group">
            <span className="brand-badge">AM</span>
            <span className="brand-title">Aku Mw Magang</span>
          </div>

          <nav className="nav-tabs">
            <button
              type="button"
              className={
                activeTab === "explore" ? "nav-tab-btn active" : "nav-tab-btn"
              }
              onClick={() => setActiveTab("explore")}
            >
              Eksplorasi Lowongan
            </button>
            <button
              type="button"
              className={
                activeTab === "pipeline" ? "nav-tab-btn active" : "nav-tab-btn"
              }
              onClick={() => setActiveTab("pipeline")}
            >
              Pipeline Lamaran ({applications.length})
            </button>
            <button
              type="button"
              className={
                activeTab === "comparator"
                  ? "nav-tab-btn active"
                  : "nav-tab-btn"
              }
              onClick={() => setActiveTab("comparator")}
            >
              Bandingkan Offer ({offerCount})
            </button>
          </nav>

          <button
            type="button"
            className="btn-open-manual"
            onClick={() => setIsManualFormOpen(true)}
          >
            + Catat Lamaran
          </button>
        </div>
      </header>

      <main className="main-container">
        {activeTab === "explore" && (
          <JobExploration
            kaptenSkills={kaptenSkills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            applications={applications}
            onSaveJobToWishlist={handleSaveJobToWishlist}
          />
        )}

        {activeTab === "pipeline" && (
          <section className="pipeline-placeholder-section">
            <div className="section-header-bar">
              <div>
                <h2>Daftar Lamaran Tersimpan ({applications.length})</h2>
                <p className="section-sub">
                  Bagian War Room Pipeline (Fitur 3–6) akan diintegrasikan oleh
                  anggota kelompok berikutnya.
                </p>
              </div>
              <button
                type="button"
                className="btn-submit-form"
                onClick={() => setIsManualFormOpen(true)}
              >
                + Tambah Lamaran Manual
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="state-box empty-box">
                <p className="state-title">Belum Ada Lamaran Tersimpan</p>
                <p className="state-desc">
                  Simpan lowongan dari katalog Eksplorasi atau klik tombol{" "}
                  <strong>+ Catat Lamaran</strong> di kanan atas.
                </p>
              </div>
            ) : (
              <div className="saved-apps-grid">
                {applications.map((app) => {
                  const match = calculateSkillMatch(
                    kaptenSkills,
                    app.requiredSkills
                  );
                  const tier = getMatchBadgeTier(match.score);

                  return (
                    <article key={app.id} className="saved-app-card">
                      <div className="saved-app-top">
                        <div>
                          <h3 className="saved-app-role">{app.role}</h3>
                          <p className="saved-app-company">
                            {app.company} • {app.workMode}
                          </p>
                        </div>
                        <span className={`match-badge match-${tier}`}>
                          ● {match.score}% Match
                        </span>
                      </div>

                      <div className="saved-app-meta">
                        <span className="status-pill">{app.status}</span>
                        {app.cvVersion && (
                          <span className="meta-text">CV: {app.cvVersion}</span>
                        )}
                        {app.appliedDate && (
                          <span className="meta-text">
                            Tgl Lamar: {app.appliedDate}
                          </span>
                        )}
                      </div>

                      <div className="job-tags-list">
                        {app.requiredSkills.map((skill) => (
                          <span key={skill} className="job-skill-tag matched">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "comparator" && (
          <section className="pipeline-placeholder-section">
            <div className="state-box empty-box">
              <p className="state-title">Offer Comparator (Fitur 7)</p>
              <p className="state-desc">
                Bagian perbandingan Offer akan diintegrasikan oleh anggota
                kelompok yang mengerjakan Fitur 7.
              </p>
            </div>
          </section>
        )}
      </main>

      {isManualFormOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsManualFormOpen(false);
            }
          }}
        >
          <div className="modal-content">
            <ManualApplicationForm
              existingApplications={applications}
              onAddApplication={handleAddManualApplication}
              onClose={() => setIsManualFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
