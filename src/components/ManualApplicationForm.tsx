import { useState, useRef } from "react";
import type { Application, WorkMode } from "../types";
import { isDuplicateApplication } from "../utils/applicationHelpers";

type InitialApplicationStatus = "WISHLIST" | "APPLIED";

interface ManualApplicationFormProps {
  existingApplications: Application[];
  onAddApplication: (newApp: Application) => void;
  onClose?: () => void;
}

interface FormErrors {
  company?: string;
  role?: string;
  skills?: string;
  cvVersion?: string;
  appliedDate?: string;
}

export default function ManualApplicationForm({
  existingApplications,
  onAddApplication,
  onClose,
}: ManualApplicationFormProps) {
  const [company, setCompany] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [initialStatus, setInitialStatus] =
    useState<InitialApplicationStatus>("WISHLIST");
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [cvVersion, setCvVersion] = useState<string>("");
  const [appliedDate, setAppliedDate] = useState<string>("");

  const [errors, setErrors] = useState<FormErrors>({});

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvVersionRef = useRef<HTMLInputElement>(null);
  const appliedDateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedCompany = company.trim();
    const trimmedRole = role.trim();
    const parsedSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const trimmedCv = cvVersion.trim();
    const trimmedDate = appliedDate.trim();

    const nextErrors: FormErrors = {};
    let firstInvalidRef: React.RefObject<HTMLInputElement | null> | null = null;

    if (!trimmedCompany) {
      nextErrors.company = "Nama perusahaan wajib diisi.";
      firstInvalidRef = firstInvalidRef ?? companyRef;
    }

    if (!trimmedRole) {
      nextErrors.role = "Posisi / role yang dilamar wajib diisi.";
      firstInvalidRef = firstInvalidRef ?? roleRef;
    }

    if (
      trimmedCompany &&
      trimmedRole &&
      isDuplicateApplication(existingApplications, trimmedCompany, trimmedRole)
    ) {
      nextErrors.company = `Lamaran untuk "${trimmedRole}" di "${trimmedCompany}" sudah terdaftar.`;
      firstInvalidRef = firstInvalidRef ?? companyRef;
    }

    if (parsedSkills.length === 0) {
      nextErrors.skills =
        "Masukkan minimal 1 required skill (pisahkan dengan koma).";
      firstInvalidRef = firstInvalidRef ?? skillsRef;
    }

    if (initialStatus === "APPLIED") {
      if (!trimmedCv) {
        nextErrors.cvVersion =
          "Versi CV wajib diisi ketika status awal adalah APPLIED.";
        firstInvalidRef = firstInvalidRef ?? cvVersionRef;
      }

      if (!trimmedDate) {
        nextErrors.appliedDate =
          "Tanggal melamar wajib diisi ketika status awal adalah APPLIED.";
        firstInvalidRef = firstInvalidRef ?? appliedDateRef;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      firstInvalidRef?.current?.focus();
      return;
    }

    const nowIso = new Date().toISOString();
    const initialLogMessage =
      initialStatus === "APPLIED"
        ? `Lamaran dikirim (CV: ${trimmedCv})`
        : "Ditambahkan manual ke Wishlist";

    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: trimmedCompany,
      role: trimmedRole,
      workMode,
      status: initialStatus,
      requiredSkills: parsedSkills,
      ...(initialStatus === "APPLIED"
        ? {
            cvVersion: trimmedCv,
            appliedDate: trimmedDate,
          }
        : {}),
      lastUpdatedAt: nowIso,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowIso,
          message: initialLogMessage,
        },
      ],
    };

    onAddApplication(newApplication);

    setCompany("");
    setRole("");
    setWorkMode("Remote");
    setInitialStatus("WISHLIST");
    setSkillsInput("");
    setCvVersion("");
    setAppliedDate("");
    setErrors({});

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="manual-form-card">
      <div className="manual-form-header">
        <div>
          <h2 className="manual-form-title">Tambah Lamaran Manual</h2>
          <p className="manual-form-subtitle">
            Catat lamaran di luar katalog lowongan ke dalam War Room Kapten.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Tutup form"
          >
            ×
          </button>
        )}
      </div>

      <form className="manual-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="manual-company">Perusahaan *</label>
            <input
              ref={companyRef}
              id="manual-company"
              type="text"
              className={errors.company ? "form-input input-error" : "form-input"}
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (errors.company) {
                  setErrors((prev) => ({ ...prev, company: undefined }));
                }
              }}
              placeholder="Contoh: Nusantara Cloud Tech"
            />
            {errors.company && (
              <span className="field-error-text">{errors.company}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="manual-role">Posisi / Role *</label>
            <input
              ref={roleRef}
              id="manual-role"
              type="text"
              className={errors.role ? "form-input input-error" : "form-input"}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (errors.role) {
                  setErrors((prev) => ({ ...prev, role: undefined }));
                }
              }}
              placeholder="Contoh: Frontend Engineering Intern"
            />
            {errors.role && (
              <span className="field-error-text">{errors.role}</span>
            )}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="manual-workmode">Mode Kerja</label>
            <select
              id="manual-workmode"
              className="form-input"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manual-status">Status Awal</label>
            <select
              id="manual-status"
              className="form-input"
              value={initialStatus}
              onChange={(e) =>
                setInitialStatus(e.target.value as InitialApplicationStatus)
              }
            >
              <option value="WISHLIST">WISHLIST</option>
              <option value="APPLIED">APPLIED</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="manual-skills">
            Required Skills (pisahkan dengan koma) *
          </label>
          <input
            ref={skillsRef}
            id="manual-skills"
            type="text"
            className={errors.skills ? "form-input input-error" : "form-input"}
            value={skillsInput}
            onChange={(e) => {
              setSkillsInput(e.target.value);
              if (errors.skills) {
                setErrors((prev) => ({ ...prev, skills: undefined }));
              }
            }}
            placeholder="Contoh: React, TypeScript, CSS, Docker"
          />
          {errors.skills && (
            <span className="field-error-text">{errors.skills}</span>
          )}
        </div>

        {initialStatus === "APPLIED" && (
          <div className="conditional-applied-box">
            <p className="conditional-box-label">
              Detail Pengiriman Lamaran (Wajib untuk status APPLIED)
            </p>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="manual-cv">Versi CV *</label>
                <input
                  ref={cvVersionRef}
                  id="manual-cv"
                  type="text"
                  className={
                    errors.cvVersion ? "form-input input-error" : "form-input"
                  }
                  value={cvVersion}
                  onChange={(e) => {
                    setCvVersion(e.target.value);
                    if (errors.cvVersion) {
                      setErrors((prev) => ({ ...prev, cvVersion: undefined }));
                    }
                  }}
                  placeholder="Contoh: Kapten-CV-v2.pdf"
                />
                {errors.cvVersion && (
                  <span className="field-error-text">{errors.cvVersion}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="manual-date">Tanggal Melamar *</label>
                <input
                  ref={appliedDateRef}
                  id="manual-date"
                  type="date"
                  className={
                    errors.appliedDate ? "form-input input-error" : "form-input"
                  }
                  value={appliedDate}
                  onChange={(e) => {
                    setAppliedDate(e.target.value);
                    if (errors.appliedDate) {
                      setErrors((prev) => ({
                        ...prev,
                        appliedDate: undefined,
                      }));
                    }
                  }}
                />
                {errors.appliedDate && (
                  <span className="field-error-text">{errors.appliedDate}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="manual-form-actions">
          {onClose && (
            <button
              type="button"
              className="btn-cancel-form"
              onClick={onClose}
            >
              Batal
            </button>
          )}
          <button type="submit" className="btn-submit-form">
            Simpan Lamaran
          </button>
        </div>
      </form>
    </div>
  );
}
