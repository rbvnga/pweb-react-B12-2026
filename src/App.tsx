import { useState } from "react";
import "./App.css";
import "./theme.css";
import type { Application, JobListing } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  inferWorkModeFromLocation,
  isDuplicateApplication,
} from "./utils/applicationHelpers";
import JobExploration from "./components/JobExploration";
import ManualApplicationForm from "./components/ManualApplicationForm";
import PipelineView from "./components/PipelineView";
import ApplicationDetail from "./components/ApplicationDetail";
import InterviewPrepTimer from "./components/InterviewPrepTimer";
import DashboardView from "./components/DashboardView";

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
  // Simpan HANYA id lamaran yang dibuka, bukan objeknya. Objeknya dicari
  // ulang dari `applications` (derived) supaya detail selalu menampilkan
  // data terbaru setelah status/checklist berubah.
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

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

  // Ubah SATU lamaran secara immutable: map() membuat array baru, hanya item
  // dengan id yang cocok diganti hasil updater (objek baru), sisanya dipakai ulang.
  const handleUpdateApplication = (
    id: string,
    updater: (app: Application) => Application
  ) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? updater(app) : app))
    );
  };

  const selectedApplication =
    applications.find((a) => a.id === selectedApplicationId) ?? null;

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
              Dashboard & Offer ({offerCount})
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
          <PipelineView
            applications={applications}
            kaptenSkills={kaptenSkills}
            onUpdateApplication={handleUpdateApplication}
            onOpenDetail={setSelectedApplicationId}
          />
        )}

        {activeTab === "comparator" && (
          <DashboardView
            applications={applications}
            kaptenSkills={kaptenSkills}
          />
        )}
      </main>

      {selectedApplication && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApplicationId(null);
          }}
        >
          <div className="modal-content modal-wide">
            {/* key = id: pindah ke lamaran lain akan me-reset state form */}
            <ApplicationDetail
              key={selectedApplication.id}
              application={selectedApplication}
              onUpdateApplication={handleUpdateApplication}
              onClose={() => setSelectedApplicationId(null)}
              // untuk menampilkan Latihan Interview (Fitur 5)
              prepSlot={<InterviewPrepTimer />}
            />
          </div>
        </div>
      )}

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