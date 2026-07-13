"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useRecipes } from "@/lib/useRecipes";
import RecipeDetail from "@/components/RecipeDetail";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const { recipes, loading } = useRecipes();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);

  const recipesByDay = useMemo(() => {
    const map = new Map<string, typeof recipes>();
    for (const r of recipes) {
      for (const cookedAt of r.cookedDates) {
        const key = format(new Date(cookedAt), "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        list.push(r);
        map.set(key, list);
      }
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
          記録したレシピを日付から確認できます。
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
                onClick={() => {
                  setSelectedDate(day);
                  setOpenId(null);
                }}
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
          {format(selectedDate, "yyyy年M月d日", { locale: ja })}のレシピ
        </h3>
        {loading ? (
          <p className="text-sm text-neutral-500">読み込み中...</p>
        ) : selectedRecipes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            この日に記録されたレシピはありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {selectedRecipes.map((r) => {
              const open = openId === r.id;
              return (
                <li
                  key={r.id}
                  className="border-t border-black/10 pt-4 first:border-0 first:pt-0 dark:border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-xs text-neutral-500">
                        {r.ingredientNames.join(", ")}
                      </p>
                    </div>
                    <span className="text-neutral-400">
                      {open ? "▲" : "▼"}
                    </span>
                  </button>

                  {open && (
                    <div className="mt-3 flex flex-col gap-3">
                      <RecipeDetail recipe={r} />
                      <Link
                        href={`/recipes/new?id=${r.id}`}
                        className="self-start text-xs text-neutral-500 hover:text-emerald-600"
                      >
                        編集する
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
