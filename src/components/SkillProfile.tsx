import { useState } from "react";
import type { JobDataSource } from "../types";

interface SkillProfileProps {
  skills: string[];
  onAddSkill: (newSkill: string) => boolean;
  onRemoveSkill: (skillToRemove: string) => void;
  dataSource: JobDataSource;
  onChangeDataSource: (source: JobDataSource) => void;
  onRefreshJobs: () => void;
}

export default function SkillProfile({
  skills,
  onAddSkill,
  onRemoveSkill,
  dataSource,
  onChangeDataSource,
  onRefreshJobs,
}: SkillProfileProps) {
  const [skillInput, setSkillInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = skillInput.trim();

    if (!trimmed) {
      setErrorMsg("Nama skill tidak boleh kosong.");
      return;
    }

    const added = onAddSkill(trimmed);
    if (!added) {
      setErrorMsg(`Skill "${trimmed}" sudah ada di profil.`);
      return;
    }

    setSkillInput("");
    setErrorMsg(null);
  };

  return (
    <aside className="skill-sidebar-card">
      <div className="skill-section">
        <h2 className="sidebar-title">Profil Skill Kapten</h2>
        <p className="sidebar-subtitle">
          Digunakan untuk menghitung persentase kecocokan tiap lowongan.
        </p>

        <form className="skill-add-form" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            className="skill-input"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Tambah skill..."
          />
          <button type="submit" className="btn-add-skill">
            Tambah
          </button>
        </form>

        {errorMsg && <p className="field-error-text">{errorMsg}</p>}

        {skills.length === 0 ? (
          <p className="empty-skill-hint">
            Belum ada skill. Tambahkan minimal 1 skill untuk melihat kecocokan.
          </p>
        ) : (
          <div className="skill-chips-wrap">
            {skills.map((skill) => (
              <span key={skill} className="kapten-skill-chip">
                {skill}
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => onRemoveSkill(skill)}
                  aria-label={`Hapus skill ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <hr className="sidebar-divider" />

      <div className="source-section">
        <div className="source-header-row">
          <h3 className="source-title">Sumber Data Lowongan</h3>
          <button
            type="button"
            className="btn-refresh-link"
            onClick={onRefreshJobs}
            title="Muat ulang data lowongan"
          >
            Retry
          </button>
        </div>

        <label className="radio-option">
          <input
            type="radio"
            name="jobDataSource"
            value="api"
            checked={dataSource === "api"}
            onChange={() => onChangeDataSource("api")}
          />
          <span>Remotive API (Live)</span>
        </label>

        <label className="radio-option">
          <input
            type="radio"
            name="jobDataSource"
            value="fallback"
            checked={dataSource === "fallback"}
            onChange={() => onChangeDataSource("fallback")}
          />
          <span>Dataset Magang ID (Lokal)</span>
        </label>
      </div>
    </aside>
  );
}
