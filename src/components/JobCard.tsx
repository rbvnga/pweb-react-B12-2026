import type { JobListing } from "../types";
import { calculateSkillMatch, getMatchBadgeTier } from "../utils/skillMatch";

interface JobCardProps {
  job: JobListing;
  kaptenSkills: string[];
  isAlreadyApplied: boolean;
  onSaveToWishlist: (job: JobListing) => void;
}

function getCompanyInitials(companyName: string): string {
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatLocationLabel(rawLocation: string): string {
  return rawLocation.replace(/\s*\(([^)]+)\)/, " • $1");
}

export default function JobCard({
  job,
  kaptenSkills,
  isAlreadyApplied,
  onSaveToWishlist,
}: JobCardProps) {
  const match = calculateSkillMatch(kaptenSkills, job.tags);
  const badgeTier = getMatchBadgeTier(match.score);

  const ownedSkillSet = new Set(
    kaptenSkills.map((s) => s.trim().toLowerCase()).filter(Boolean)
  );

  const initials = getCompanyInitials(job.company_name);
  const formattedLocation = formatLocationLabel(
    job.candidate_required_location
  );
  const showPerMonth = job.salary.toLowerCase().startsWith("rp");

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-info">
          <div className="company-avatar">{initials}</div>
          <div>
            <h4 className="company-name">{job.company_name}</h4>
            <p className="company-location">{formattedLocation}</p>
          </div>
        </div>

        <span className={`match-badge match-${badgeTier}`}>
          ● {match.score}% Match
        </span>
      </div>

      <h3 className="job-title">{job.title}</h3>

      <div className="job-tags-list">
        {job.tags.length === 0 ? (
          <span className="job-skill-tag matched">Umum</span>
        ) : (
          job.tags.map((tag) => {
            const isMatched = ownedSkillSet.has(tag.trim().toLowerCase());
            return (
              <span
                key={tag}
                className={
                  isMatched ? "job-skill-tag matched" : "job-skill-tag missing"
                }
                title={
                  isMatched
                    ? "Skill sudah dikuasai Kapten"
                    : "Missing skill (belum dikuasai)"
                }
              >
                {tag}
              </span>
            );
          })
        )}
      </div>

      <div className="job-card-footer">
        <div className="job-salary">
          <strong>{job.salary || "Kompetitif"}</strong>
          {showPerMonth && <span className="salary-unit"> / bulan</span>}
        </div>

        <button
          type="button"
          className={
            isAlreadyApplied ? "btn-wishlist btn-applied" : "btn-wishlist"
          }
          disabled={isAlreadyApplied}
          onClick={() => onSaveToWishlist(job)}
        >
          {isAlreadyApplied ? "Sudah Dilamar" : "Simpan ke Wishlist"}
        </button>
      </div>
    </article>
  );
}
