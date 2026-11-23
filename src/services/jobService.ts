import type { JobDataSource, JobListing } from "../types";

export const REMOTIVE_API_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
export const LOCAL_FALLBACK_URL = "/magang-fallback.json";

interface RawJobItem {
  id?: unknown;
  title?: unknown;
  company_name?: unknown;
  category?: unknown;
  candidate_required_location?: unknown;
  salary?: unknown;
  tags?: unknown;
}

interface RawJobsPayload {
  jobs?: unknown;
}

const OFFLINE_FALLBACK_JOBS: JobListing[] = [
  {
    id: 1001,
    title: "Frontend Engineering Intern (React & TypeScript)",
    company_name: "Nusantara Cloud Tech",
    category: "Software Development",
    candidate_required_location: "Surabaya (Hybrid)",
    salary: "Rp 4.500.000",
    tags: ["React", "TypeScript", "CSS", "Git", "REST API"],
  },
  {
    id: 1002,
    title: "Full-Stack Web Developer Intern",
    company_name: "Garuda FinTech",
    category: "Software Development",
    candidate_required_location: "Jakarta (Remote)",
    salary: "Rp 5.500.000",
    tags: ["React", "TypeScript", "PostgreSQL", "Express", "Prisma"],
  },
  {
    id: 1003,
    title: "Software Engineer Intern — Web Platform",
    company_name: "Bintang Commerce",
    category: "Software Development",
    candidate_required_location: "Indonesia (Remote)",
    salary: "Rp 6.000.000",
    tags: ["React", "TypeScript", "CSS", "Git", "Testing"],
  },
  {
    id: 1004,
    title: "DevOps & Cloud Infrastructure Intern",
    company_name: "AwanMerdeka Cloud",
    category: "DevOps & Sysadmin",
    candidate_required_location: "Jakarta (Remote)",
    salary: "Rp 5.200.000",
    tags: ["Git", "PostgreSQL", "Linux", "Docker", "CI/CD"],
  },
  {
    id: 1005,
    title: "Frontend Web Developer Intern",
    company_name: "EduSpark Indonesia",
    category: "Software Development",
    candidate_required_location: "Bandung (Hybrid)",
    salary: "Rp 4.000.000",
    tags: ["React", "TypeScript", "CSS", "Tailwind"],
  },
  {
    id: 1006,
    title: "Backend Engineer Intern (Node.js & Docker)",
    company_name: "KaryaPay Digital",
    category: "Software Development",
    candidate_required_location: "Jakarta (Hybrid)",
    salary: "Rp 5.000.000",
    tags: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "REST API"],
  },
  {
    id: 1007,
    title: "Cloud & Container Platform Intern",
    company_name: "Merapi Infra Solusi",
    category: "DevOps & Sysadmin",
    candidate_required_location: "Yogyakarta (Remote)",
    salary: "Rp 4.800.000",
    tags: ["Docker", "Kubernetes", "Linux", "Git", "Bash"],
  },
  {
    id: 1008,
    title: "UI Engineer Intern (Design System)",
    company_name: "Kreativa Studio ID",
    category: "Software Development",
    candidate_required_location: "Surabaya (Onsite)",
    salary: "Rp 3.800.000",
    tags: ["React", "TypeScript", "CSS", "Figma"],
  },
  {
    id: 1009,
    title: "Data Analytics & BI Intern",
    company_name: "AgriTech Nusantara",
    category: "Data Analysis",
    candidate_required_location: "Malang (Hybrid)",
    salary: "Rp 4.200.000",
    tags: ["Python", "SQL", "PostgreSQL", "Tableau"],
  },
  {
    id: 1010,
    title: "QA Automation Engineer Intern",
    company_name: "SinarLogistik Tech",
    category: "QA & Testing",
    candidate_required_location: "Jakarta (Onsite)",
    salary: "Rp 4.300.000",
    tags: ["TypeScript", "Playwright", "Git", "REST API"],
  },
  {
    id: 1011,
    title: "Mobile Engineer Intern (React Native)",
    company_name: "SehatKita Healthtech",
    category: "Mobile Development",
    candidate_required_location: "Indonesia (Remote)",
    salary: "Rp 5.300.000",
    tags: ["React", "TypeScript", "React Native", "REST API", "Git"],
  },
  {
    id: 1012,
    title: "Machine Learning & AI Engineer Intern",
    company_name: "BahasaAI Labs",
    category: "Data & AI",
    candidate_required_location: "Bandung (Remote)",
    salary: "Rp 5.800.000",
    tags: ["Python", "PyTorch", "Docker", "FastAPI", "Git"],
  },
  {
    id: 1013,
    title: "Cyber Security & DevSecOps Intern",
    company_name: "PerisaiSiber Nusantara",
    category: "Cyber Security",
    candidate_required_location: "Jakarta (Hybrid)",
    salary: "Rp 5.100.000",
    tags: ["Linux", "Docker", "Networking", "OWASP", "Git"],
  },
  {
    id: 1014,
    title: "Product Frontend Intern",
    company_name: "PasarRakyat Digital",
    category: "Software Development",
    candidate_required_location: "Semarang (Remote)",
    salary: "Rp 4.100.000",
    tags: ["React", "CSS", "JavaScript", "Git"],
  },
  {
    id: 1015,
    title: "Full-Stack TypeScript Intern",
    company_name: "Samudra Maritim Tech",
    category: "Software Development",
    candidate_required_location: "Surabaya (Hybrid)",
    salary: "Rp 4.750.000",
    tags: ["React", "TypeScript", "CSS", "PostgreSQL", "Docker"],
  },
];

function normalizeJobItem(raw: RawJobItem, index: number): JobListing {
  const id = typeof raw.id === "number" ? raw.id : 1000 + index;
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "Software Engineer Intern";
  const company_name =
    typeof raw.company_name === "string" && raw.company_name.trim()
      ? raw.company_name.trim()
      : "Tech Company";
  const category =
    typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim()
      : "Software Development";
  const candidate_required_location =
    typeof raw.candidate_required_location === "string" &&
    raw.candidate_required_location.trim()
      ? raw.candidate_required_location.trim()
      : "Remote";
  const salary =
    typeof raw.salary === "string" && raw.salary.trim()
      ? raw.salary.trim()
      : "Kompetitif";

  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    id,
    title,
    company_name,
    category,
    candidate_required_location,
    salary,
    tags,
  };
}

function parseJobsPayload(data: unknown): JobListing[] {
  if (Array.isArray(data)) {
    return data.map((item, idx) =>
      normalizeJobItem((item ?? {}) as RawJobItem, idx)
    );
  }

  if (typeof data === "object" && data !== null && "jobs" in data) {
    const payload = data as RawJobsPayload;
    if (Array.isArray(payload.jobs)) {
      return payload.jobs.map((item, idx) =>
        normalizeJobItem((item ?? {}) as RawJobItem, idx)
      );
    }
  }

  throw new Error("Format data lowongan tidak valid.");
}

export async function fetchJobListings(
  source: JobDataSource,
  signal?: AbortSignal
): Promise<JobListing[]> {
  if (source === "api") {
    const response = await fetch(REMOTIVE_API_URL, {
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Gagal memuat lowongan dari Remotive API (HTTP ${response.status}).`
      );
    }

    const json: unknown = await response.json();
    return parseJobsPayload(json);
  }

  // Sumber: Fallback Lokal (/magang-fallback.json)
  try {
    const response = await fetch(LOCAL_FALLBACK_URL, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json: unknown = await response.json();
    return parseJobsPayload(json);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    // Jika browser sedang diset ke DevTools Offline penuh saat menekan tombol Fallback Lokal,
    // tetap kembalikan data magang-fallback.json agar aplikasi tidak gagal saat demo offline.
    return OFFLINE_FALLBACK_JOBS;
  }
}
