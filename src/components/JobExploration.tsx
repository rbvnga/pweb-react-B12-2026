import { useState, useEffect, useRef } from "react";
import type { Application, JobDataSource, JobListing } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { fetchJobListings } from "../services/jobService";
import { calculateSkillMatch } from "../utils/skillMatch";
import { isDuplicateApplication } from "../utils/applicationHelpers";
import SkillProfile from "./SkillProfile";
import JobCard from "./JobCard";

interface JobExplorationProps {
  kaptenSkills: string[];
  onAddSkill: (skill: string) => boolean;
  onRemoveSkill: (skill: string) => void;
  applications: Application[];
  onSaveJobToWishlist: (job: JobListing) => void;
}

type SortOption = "match_desc" | "match_asc" | "company_asc";

export default function JobExploration({
  kaptenSkills,
  onAddSkill,
  onRemoveSkill,
  applications,
  onSaveJobToWishlist,
}: JobExplorationProps) {
  const [dataSource, setDataSource] = useState<JobDataSource>("api");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const debouncedKeyword = useDebounce(searchKeyword, 400);

  const [selectedCategory, setSelectedCategory] =
    useState<string>("Semua Kategori");
  const [sortBy, setSortBy] = useState<SortOption>("match_desc");

  /* ---- BONUS: SHORTCUT "/" UNTUK FOKUS KE KOLOM PENCARIAN ----
   * useRef menyimpan referensi ke elemen <input> tanpa memicu re-render.
   * useEffect memasang listener keydown di window; fungsi cleanup-nya
   * melepas listener saat komponen unmount agar tidak menumpuk. */
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchJobListings(dataSource, controller.signal);
        setJobs(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Gagal terhubung ke server lowongan.";
        setErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      controller.abort();
    };
  }, [dataSource, reloadTrigger]);

  const handleRetry = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const handleUseFallback = () => {
    if (dataSource === "fallback") {
      setReloadTrigger((prev) => prev + 1);
    } else {
      setDataSource("fallback");
    }
  };

  const handleChangeDataSource = (nextSource: JobDataSource) => {
    setSelectedCategory("Semua Kategori");
    setDataSource(nextSource);
  };

  const categories = [
    "Semua Kategori",
    ...Array.from(new Set(jobs.map((item) => item.category))).filter(Boolean),
  ];

  const normalizedQuery = debouncedKeyword.trim().toLowerCase();

  const filteredAndSortedJobs = jobs
    .filter((job) => {
      const matchCategory =
        selectedCategory === "Semua Kategori" ||
        job.category === selectedCategory;

      if (!matchCategory) return false;
      if (!normalizedQuery) return true;

      const inTitle = job.title.toLowerCase().includes(normalizedQuery);
      const inCompany = job.company_name
        .toLowerCase()
        .includes(normalizedQuery);
      const inTags = job.tags.some((t) =>
        t.toLowerCase().includes(normalizedQuery)
      );

      return inTitle || inCompany || inTags;
    })
    .sort((a, b) => {
      if (sortBy === "company_asc") {
        return a.company_name.localeCompare(b.company_name);
      }

      const scoreA = calculateSkillMatch(kaptenSkills, a.tags).score;
      const scoreB = calculateSkillMatch(kaptenSkills, b.tags).score;

      if (sortBy === "match_asc") {
        return scoreA - scoreB;
      }
      return scoreB - scoreA;
    });

  return (
    <div className="exploration-layout">
      <SkillProfile
        skills={kaptenSkills}
        onAddSkill={onAddSkill}
        onRemoveSkill={onRemoveSkill}
        dataSource={dataSource}
        onChangeDataSource={handleChangeDataSource}
        onRefreshJobs={handleRetry}
      />

      <section className="catalog-panel">
        <div className="catalog-toolbar">
          <div className="search-box-wrap">
            <input
              ref={searchRef}
              type="text"
              className="catalog-search-input"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari posisi atau perusahaan... (tekan /)"
            />
          </div>

          <select
            className="catalog-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter Kategori"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="catalog-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Urutkan Lowongan"
          >
            <option value="match_desc">Match Tertinggi</option>
            <option value="match_asc">Match Terendah</option>
            <option value="company_asc">Nama Perusahaan (A-Z)</option>
          </select>
        </div>

        {isLoading ? (
          <div className="state-box loading-box">
            <div className="spinner" />
            <p className="state-title">Memuat daftar lowongan magang...</p>
            <p className="state-desc">
              Mengambil data dari{" "}
              {dataSource === "api"
                ? "Remotive Live API"
                : "Dataset Magang ID Lokal"}
              .
            </p>
          </div>
        ) : errorMessage ? (
          <div className="state-box error-box">
            <p className="state-title error-text">
              Gagal Memuat Data Lowongan
            </p>
            <p className="state-desc">{errorMessage}</p>
            <div className="error-actions">
              <button
                type="button"
                className="btn-retry"
                onClick={handleRetry}
              >
                Coba Lagi (Retry)
              </button>
              <button
                type="button"
                className="btn-fallback"
                onClick={handleUseFallback}
              >
                Gunakan Fallback Lokal
              </button>
            </div>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="state-box empty-box">
            <p className="state-title">Tidak Ada Lowongan Ditemukan</p>
            <p className="state-desc">
              Coba ubah kata kunci pencarian atau pilih kategori lowongan yang
              lain.
            </p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredAndSortedJobs.map((job) => {
              const alreadySaved = isDuplicateApplication(
                applications,
                job.company_name,
                job.title
              );

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  kaptenSkills={kaptenSkills}
                  isAlreadyApplied={alreadySaved}
                  onSaveToWishlist={onSaveJobToWishlist}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}