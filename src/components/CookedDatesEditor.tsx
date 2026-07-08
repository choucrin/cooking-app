"use client";

import { useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CookedDatesEditor({
  recipeId,
  cookedDates,
}: {
  recipeId: string;
  cookedDates: string[];
}) {
  const [newDate, setNewDate] = useState("");

  const addDate = async () => {
    if (!newDate) return;
    const iso = new Date(`${newDate}T00:00:00`).toISOString();
    if (cookedDates.some((d) => d.slice(0, 10) === iso.slice(0, 10))) {
      setNewDate("");
      return;
    }
    const ts = Timestamp.fromDate(new Date(`${newDate}T00:00:00`));
    setNewDate("");
    await updateDoc(doc(db, "recipes", recipeId), {
      cookedDates: arrayUnion(ts),
      updatedAt: serverTimestamp(),
    });
  };

  const removeDate = async (isoDate: string) => {
    if (cookedDates.length <= 1) return;
    const ts = Timestamp.fromDate(new Date(isoDate));
    await updateDoc(doc(db, "recipes", recipeId), {
      cookedDates: arrayRemove(ts),
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold text-neutral-500">作った日</h3>
      <div className="flex flex-wrap items-center gap-2">
        {cookedDates.map((d) => (
          <span
            key={d}
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs dark:bg-neutral-800"
          >
            {new Date(d).toLocaleDateString("ja-JP")}
            <button
              type="button"
              onClick={() => removeDate(d)}
              disabled={cookedDates.length <= 1}
              className="text-neutral-400 hover:text-red-500 disabled:opacity-30"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-neutral-900"
        />
        <button
          type="button"
          onClick={addDate}
          disabled={!newDate}
          className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:border-white/20 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ＋ 追加
        </button>
      </div>
    </div>
  );
}
