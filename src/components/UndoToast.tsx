import { useEffect, useState } from "react";
import "./UndoToast.css";

interface UndoToastProps {
  title: string;        // nama perusahaan yang dihapus
  expiresAt: number;    // kapan jendela Undo habis (dari useUndoDelete)
  onUndo: () => void;
}

function calcSecondsLeft(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export default function UndoToast({ title, expiresAt, onUndo }: UndoToastProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    calcSecondsLeft(expiresAt)
  );

  useEffect(() => {
    // Hitung dari `expiresAt` (bukan "kurangi 1 tiap detik") supaya akurat
    // walau tab sempat tertahan di background.
    const intervalId = window.setInterval(() => {
      setSecondsLeft(calcSecondsLeft(expiresAt));
    }, 250);

    // Cleanup wajib: interval berhenti saat toast hilang.
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        Lamaran <strong>{title}</strong> telah dihapus.
      </span>
      <button type="button" className="undo-toast-btn" onClick={onUndo}>
        Undo ({secondsLeft}d)
      </button>
    </div>
  );
}