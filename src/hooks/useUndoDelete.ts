import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

// Data item yang baru dihapus dan masih bisa dikembalikan (Undo)
export interface PendingDelete<T> {
  // Salinan LENGKAP item (termasuk checklist & activityLogs) untuk dipulihkan
  item: T;
  // Posisi asli di array, supaya saat Undo item kembali ke urutan semula
  index: number;
  // Kapan jendela Undo habis (ms epoch). Dipakai Toast untuk hitung mundur
  expiresAt: number;
}

export function useUndoDelete<T extends { id: string }>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  delayMs: number = 5000
) {
  const [pending, setPending] = useState<PendingDelete<T> | null>(null);

  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup saat komponen di-unmount: jangan sisakan timer yatim.
  useEffect(() => clearTimer, [clearTimer]);

  const deleteItem = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const item = items[index];

    clearTimer();

    // Immutable: filter membuat array baru tanpa item itu.
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPending({ item, index, expiresAt: Date.now() + delayMs });

    timerRef.current = window.setTimeout(() => {
      setPending(null);
      timerRef.current = null;
    }, delayMs);
  };

  const undo = () => {
    if (!pending) return;
    clearTimer(); // jangan biarkan timer menutup toast yang sudah di-Undo

    const { item, index } = pending;
    setItems((prev) =>
      // Jaga-jaga klik Undo ganda: jangan sampai duplikat.
      prev.some((i) => i.id === item.id)
        ? prev
        : // Sisipkan di posisi asli tanpa memutasi array lama
          [...prev.slice(0, index), item, ...prev.slice(index)]
    );
    setPending(null);
  };

  return { pending, deleteItem, undo };
}