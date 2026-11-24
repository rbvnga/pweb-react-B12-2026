import { useEffect, useState } from "react";
import "./InterviewPrepTimer.css";

// untuk durasi tiap soal (2 menit = 120 detik)
const DURATION = 120;

// untuk daftar pertanyaan latihan interview
const QUESTIONS: string[] = [
  "Perkenalkan dirimu dan jelaskan kenapa kamu tertarik magang di bidang IT.",
  "Ceritakan satu proyek yang pernah kamu buat. Apa peranmu dan teknologi apa yang kamu pakai?",
  "Ceritakan bug tersulit yang pernah kamu temui dan cara kamu memperbaikinya.",
  "Apa bedanya state dan props di React?",
  "Bagaimana kamu memakai Git saat kerja dalam tim?",
  "Bagaimana cara kamu belajar teknologi baru?",
];

// untuk mengubah detik jadi format MM:SS, contoh 102 -> "01:42"
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return mm + ":" + ss;
}

export default function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(false);

  // untuk cek apakah waktu sudah habis
  const isTimeUp = secondsLeft === 0;

  // untuk cek apakah timer sedang jalan dan waktunya masih ada
  const isTicking = isRunning && !isTimeUp;

  // untuk mengurangi detik setiap 1 detik
  useEffect(() => {
    if (!isTicking) {
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    // untuk menghentikan interval saat dijeda atau modal ditutup
    return () => {
      clearInterval(intervalId);
    };
  }, [isTicking]);

  // untuk tombol Mulai / Jeda
  function handleStartPause() {
    setIsRunning(!isRunning);
  }

  // untuk tombol Reset
  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(DURATION);
  }

  // untuk tombol Soal Berikutnya
  function handleNext() {
    let nextIndex = questionIndex + 1;

    // untuk kembali ke soal pertama setelah soal terakhir
    if (nextIndex >= QUESTIONS.length) {
      nextIndex = 0;
    }

    setQuestionIndex(nextIndex);
    setIsRunning(false);
    setSecondsLeft(DURATION);
  }

  // untuk warna timer (merah kalau habis)
  let timerClass = "prep-timer";
  if (isTimeUp) {
    timerClass = "prep-timer time-up";
  }

  return (
    <div>
      <div className="prep-header">
        <h3 className="detail-section-title">Latihan Interview</h3>
        <span className="prep-counter">
          Soal {questionIndex + 1} / {QUESTIONS.length}
        </span>
      </div>

      <p className="prep-question">{QUESTIONS[questionIndex]}</p>

      <div className="prep-row">
        <span className={timerClass}>{formatTime(secondsLeft)}</span>

        <div className="prep-buttons">
          <button
            type="button"
            className="btn-submit-form"
            onClick={handleStartPause}
            disabled={isTimeUp}
          >
            {isTicking ? "Jeda" : "Mulai"}
          </button>
          <button type="button" className="btn-fallback" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="btn-fallback" onClick={handleNext}>
            Soal Berikutnya
          </button>
        </div>
      </div>

      {isTimeUp && <p className="prep-time-up">Waktu habis.</p>}
    </div>
  );
}
