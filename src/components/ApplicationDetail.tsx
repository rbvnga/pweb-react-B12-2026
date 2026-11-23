import { useState } from "react";
import type { ReactNode } from "react";
import "./ApplicationDetail.css";
import type { Application, ApplicationStatus, WorkMode } from "../types";
import {
  canTransitionStatus,
  getAllowedNextStatuses,
} from "../utils/stateMachine";

interface ApplicationDetailProps {
  /** Lamaran yang sedang dibuka. Diambil App dari array `applications`,
   *  jadi setiap perubahan otomatis tampil di sini (satu sumber data). */
  application: Application;
  onUpdateApplication: (
    id: string,
    updater: (app: Application) => Application
  ) => void;
  onClose: () => void;
  /** Slot kosong untuk Fitur 5 (Interview Prep Timer). Anggota yang
   *  mengerjakan timer cukup mengirim komponennya lewat prop ini. */
  prepSlot?: ReactNode;
}

// Urutan tahap untuk indikator "Tahap Seleksi" di bagian atas
const STAGES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
];

const WORK_MODES: WorkMode[] = ["Remote", "Hybrid", "Onsite"];

/** Error validasi per-field untuk form perpindahan status. */
interface TransitionErrors {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tanggal hari ini format YYYY-MM-DD (nilai default input type="date"). */
function todayDateString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Komponen utama untuk menampilkan detail lamaran
export default function ApplicationDetail({
  application,
  onUpdateApplication,
  onClose,
  prepSlot,
}: ApplicationDetailProps) {
  /* ---- STATE form (hanya input mentah user) ---- */
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | null>(
    null
  );
  const [cvVersion, setCvVersion] = useState<string>(
    application.cvVersion ?? ""
  );
  const [appliedDate, setAppliedDate] = useState<string>(
    application.appliedDate ?? todayDateString()
  );
  const [interviewDateTime, setInterviewDateTime] = useState<string>(
    application.interviewDateTime ?? ""
  );
  const [salaryInput, setSalaryInput] = useState<string>("");
  const [offerWorkMode, setOfferWorkMode] = useState<WorkMode>(
    application.workMode
  );
  const [errors, setErrors] = useState<TransitionErrors>({});

  const [newChecklistText, setNewChecklistText] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");

  /* ---- DERIVED STATE (tidak disimpan di useState) ---- */
  // Tujuan yang sah ditentukan state machine, bukan ditulis manual di UI.
  const allowedNext = getAllowedNextStatuses(application.status);
  const isFinal = allowedNext.length === 0;

  const doneCount = application.checklist.filter((c) => c.done).length;
  const totalCount = application.checklist.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Riwayat ditampilkan terbaru di atas. [...array] = salinan, karena
  // .sort()/.reverse() mengubah array aslinya (itu mutasi yang dilarang).
  const sortedLogs = [...application.activityLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  /* ---- HELPER: bikin 1 entri log baru ---- */
  const makeLog = (message: string) => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    message,
  });


  // TRANSISI STATUS: reset semua input form ke nilai default (kosong)
  const resetTransitionForm = () => {
    setTargetStatus(null);
    setSalaryInput("");
    setErrors({});
  };

  const handleConfirmTransition = () => {
    if (!targetStatus) return;

    // Pengaman ganda: walau UI hanya menampilkan tombol yang sah,
    // tetap cek ke state machine sebelum mengubah data.
    if (!canTransitionStatus(application.status, targetStatus)) return;

    // --- Validasi syarat pindah status (Aturan Main) ---
    const nextErrors: TransitionErrors = {};

    if (targetStatus === "APPLIED") {
      if (!cvVersion.trim()) nextErrors.cvVersion = "Versi CV wajib diisi.";
      if (!appliedDate) nextErrors.appliedDate = "Tanggal lamar wajib diisi.";
    }

    if (targetStatus === "INTERVIEW" && !interviewDateTime) {
      nextErrors.interviewDateTime = "Jadwal interview wajib diisi.";
    }

    const salaryNumber = Number(salaryInput);
    if (targetStatus === "OFFER") {
      if (!salaryInput.trim() || Number.isNaN(salaryNumber) || salaryNumber <= 0) {
        nextErrors.salaryOffer = "Gaji offer harus angka lebih dari 0.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return; // gagal validasi: status TIDAK berubah
    }

    const from = application.status;
    const nowIso = new Date().toISOString();

    // Updater murni: menerima app lama, mengembalikan objek BARU.
    onUpdateApplication(application.id, (app) => {
      // Field kondisional hanya diisi sesuai tujuan; sisanya tetap.
      const conditionalFields: Partial<Application> = {};
      if (targetStatus === "APPLIED") {
        conditionalFields.cvVersion = cvVersion.trim();
        conditionalFields.appliedDate = appliedDate;
      }
      if (targetStatus === "INTERVIEW") {
        conditionalFields.interviewDateTime = interviewDateTime;
      }
      if (targetStatus === "OFFER") {
        conditionalFields.salaryOffer = salaryNumber;
        conditionalFields.workMode = offerWorkMode;
      }

      return {
        ...app,
        ...conditionalFields,
        status: targetStatus,
        lastUpdatedAt: nowIso, // reset hitungan Rawan Ghosting
        activityLogs: [
          ...app.activityLogs,
          {
            id: crypto.randomUUID(),
            timestamp: nowIso,
            message: `Status berubah: ${from} → ${targetStatus}`,
          },
        ],
      };
    });

    resetTransitionForm();
  };

  // CHECKLIST: tambah item baru ke array checklist lamaran

  const handleAddChecklist = () => {
    const text = newChecklistText.trim();
    if (!text) return;

    onUpdateApplication(application.id, (app) => ({
      ...app,
      checklist: [
        ...app.checklist,
        { id: crypto.randomUUID(), text, done: false },
      ],
    }));
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    onUpdateApplication(application.id, (app) => ({
      ...app,
      // map: item yang cocok diganti OBJEK BARU ({...item, done: !item.done}),
      // item lain dipakai ulang apa adanya.
      checklist: app.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const handleDeleteChecklist = (itemId: string) => {
    onUpdateApplication(application.id, (app) => ({
      ...app,
      checklist: app.checklist.filter((item) => item.id !== itemId),
    }));
  };

  // CATATAN MANUAL: tambah catatan baru ke activityLogs lamaran

  const handleAddNote = () => {
    const text = noteText.trim();
    if (!text) return;

    onUpdateApplication(application.id, (app) => ({
      ...app,
      activityLogs: [...app.activityLogs, makeLog(`Catatan: ${text}`)],
    }));
    setNoteText("");
  };

  /* ---- RENDER ---- */
  const currentStageIndex = STAGES.indexOf(application.status);

  return (
    <div className="detail-card">
      <header className="detail-header">
        <div>
          <h2 className="detail-title">{application.role}</h2>
          <p className="detail-subtitle">
            {application.company} • {application.workMode}
            {application.cvVersion ? ` • CV: ${application.cvVersion}` : ""}
            {application.interviewDateTime
              ? ` • Interview: ${formatTimestamp(application.interviewDateTime)}`
              : ""}
          </p>
        </div>
        <div className="detail-header-right">
          <span className="status-pill">{application.status}</span>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Tutup detail"
          >
            ×
          </button>
        </div>
      </header>

      <div className="detail-body">
        {/* ============ KOLOM KIRI: status + checklist ============ */}
        <div className="detail-col">
          {/* ---- Tahap seleksi ---- */}
          <section className="detail-section">
            <h3 className="detail-section-title">Tahap Seleksi</h3>
            <ol className="stage-track">
              {STAGES.map((stage, index) => {
                // Status di luar jalur utama (REJECTED/GHOSTED) -> index -1,
                // jadi tidak ada tahap yang ditandai "aktif".
                const cls =
                  index < currentStageIndex
                    ? "stage-item done"
                    : index === currentStageIndex
                      ? "stage-item active"
                      : "stage-item";
                return (
                  <li key={stage} className={cls}>
                    {stage}
                  </li>
                );
              })}
            </ol>

            {/* ---- Form pindah status ---- */}
            {isFinal ? (
              <p className="detail-final-note">
                Status <strong>{application.status}</strong> bersifat final dan
                tidak dapat diubah lagi.
              </p>
            ) : (
              <div className="transition-box">
                <p className="transition-label">Pindahkan status ke:</p>
                <div className="transition-options">
                  {allowedNext.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={
                        targetStatus === status
                          ? "transition-btn selected"
                          : "transition-btn"
                      }
                      onClick={() => {
                        setTargetStatus(status);
                        setErrors({});
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Input kondisional: muncul hanya untuk tujuan yang butuh */}
                {targetStatus === "APPLIED" && (
                  <div className="conditional-fields">
                    <div className="form-group">
                      <label>Versi CV *</label>
                      <input
                        type="text"
                        className={
                          errors.cvVersion ? "form-input input-error" : "form-input"
                        }
                        placeholder="Contoh: Kapten-CV-v2.pdf"
                        value={cvVersion}
                        onChange={(e) => setCvVersion(e.target.value)}
                      />
                      {errors.cvVersion && (
                        <span className="field-error-text">{errors.cvVersion}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Tanggal Lamar *</label>
                      <input
                        type="date"
                        className={
                          errors.appliedDate
                            ? "form-input input-error"
                            : "form-input"
                        }
                        value={appliedDate}
                        onChange={(e) => setAppliedDate(e.target.value)}
                      />
                      {errors.appliedDate && (
                        <span className="field-error-text">
                          {errors.appliedDate}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {targetStatus === "INTERVIEW" && (
                  <div className="conditional-fields">
                    <div className="form-group">
                      <label>Jadwal Interview *</label>
                      <input
                        type="datetime-local"
                        className={
                          errors.interviewDateTime
                            ? "form-input input-error"
                            : "form-input"
                        }
                        value={interviewDateTime}
                        onChange={(e) => setInterviewDateTime(e.target.value)}
                      />
                      {errors.interviewDateTime && (
                        <span className="field-error-text">
                          {errors.interviewDateTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {targetStatus === "OFFER" && (
                  <div className="conditional-fields">
                    <div className="form-group">
                      <label>Uang Saku / Gaji per Bulan (Rp) *</label>
                      <input
                        type="number"
                        min={0}
                        className={
                          errors.salaryOffer
                            ? "form-input input-error"
                            : "form-input"
                        }
                        placeholder="Contoh: 4500000"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                      />
                      {errors.salaryOffer && (
                        <span className="field-error-text">
                          {errors.salaryOffer}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Mode Kerja *</label>
                      <select
                        className="form-input"
                        value={offerWorkMode}
                        onChange={(e) =>
                          setOfferWorkMode(e.target.value as WorkMode)
                        }
                      >
                        {WORK_MODES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-submit-form"
                  disabled={targetStatus === null}
                  onClick={handleConfirmTransition}
                >
                  Konfirmasi
                </button>
              </div>
            )}
          </section>

          {/* ---- Checklist ---- */}
          <section className="detail-section">
            <div className="checklist-header">
              <h3 className="detail-section-title">Daftar Persiapan</h3>
              <span className="meta-text">
                {doneCount} / {totalCount} selesai
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {totalCount === 0 ? (
              <p className="detail-empty">Belum ada tugas persiapan.</p>
            ) : (
              <ul className="checklist-list">
                {application.checklist.map((item) => (
                  <li key={item.id} className="checklist-item">
                    <label className={item.done ? "check-label done" : "check-label"}>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(item.id)}
                      />
                      <span>{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => handleDeleteChecklist(item.id)}
                      aria-label={`Hapus tugas ${item.text}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="inline-add-row">
              <input
                type="text"
                className="form-input"
                placeholder="Tambah tugas persiapan baru..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddChecklist();
                }}
              />
              <button
                type="button"
                className="btn-submit-form"
                onClick={handleAddChecklist}
              >
                Tambah
              </button>
            </div>
          </section>
        </div>

        {/* KOLOM KANAN: prep timer + activity log */}
        <div className="detail-col">
          {prepSlot && <section className="detail-section">{prepSlot}</section>}

          <section className="detail-section">
            <h3 className="detail-section-title">Riwayat Aktivitas</h3>

            <div className="inline-add-row">
              <input
                type="text"
                className="form-input"
                placeholder="Tulis catatan manual..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote();
                }}
              />
              <button
                type="button"
                className="btn-submit-form"
                onClick={handleAddNote}
              >
                Catat
              </button>
            </div>

            {sortedLogs.length === 0 ? (
              <p className="detail-empty">Belum ada aktivitas.</p>
            ) : (
              <ul className="log-list">
                {sortedLogs.map((log) => (
                  <li key={log.id} className="log-item">
                    <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                    <span className="log-message">{log.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}