"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { Recipe } from "@/lib/types";
import NutritionBadges from "@/components/NutritionBadges";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const monthKey = format(month, "yyyy-MM");
      const res = await fetch(`/api/recipes?month=${monthKey}`);
      const data = await res.json();
      setRecipes(data);
      setLoading(false);
    })();
  }, [month]);

  const recipesByDay = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    for (const r of recipes) {
      const key = format(new Date(r.cookedAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [recipes]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedRecipes =
    recipesByDay.get(format(selectedDate, "yyyy-MM-dd")) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">カレンダー</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          実際に作った料理を日付から確認できます。
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/20"
          >
            ←
          </button>
          <h2 className="font-semibold">
            {format(month, "yyyy年 M月", { locale: ja })}
          </h2>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/20"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayRecipes = recipesByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const selected = isSameDay(day, selectedDate);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition ${
                  selected
                    ? "bg-emerald-600 text-white"
                    : inMonth
                    ? "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    : "text-neutral-300 dark:text-neutral-700"
                }`}
              >
                <span>{format(day, "d")}</span>
                {dayRecipes.length > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? "bg-white" : "bg-emerald-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h3 className="mb-3 font-semibold">
          {format(selectedDate, "yyyy年M月d日", { locale: ja })}に作った料理
        </h3>
        {loading ? (
          <p className="text-sm text-neutral-500">読み込み中...</p>
        ) : selectedRecipes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            この日に作った料理はありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {selectedRecipes.map((r) => (
              <li key={r.id} className="border-t border-black/10 pt-4 first:border-0 first:pt-0 dark:border-white/10">
                <p className="font-semibold">{r.title}</p>
                <p className="mb-2 text-xs text-neutral-500">
                  {r.ingredientNames.join(", ")}
                </p>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {r.instructions}
                </p>
                <NutritionBadges nutrition={r.nutrition} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
