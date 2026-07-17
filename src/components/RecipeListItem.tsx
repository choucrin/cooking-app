"use client";

import Link from "next/link";
import type { Recipe } from "@/lib/types";
import RecipeDetail from "@/components/RecipeDetail";
import CookedDatesEditor from "@/components/CookedDatesEditor";

export default function RecipeListItem({
  recipe,
  open,
  onToggleOpen,
  onToggleBookmark,
  onDelete,
}: {
  recipe: Recipe;
  open: boolean;
  onToggleOpen: () => void;
  onToggleBookmark: () => void;
  onDelete: () => void;
}) {
  const r = recipe;
  return (
    <li className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-label={r.bookmarked ? "ブックマークを外す" : "ブックマークする"}
          title={r.bookmarked ? "ブックマークを外す" : "ブックマークする"}
          className="shrink-0 text-lg leading-none text-amber-500"
        >
          {r.bookmarked ? "★" : "☆"}
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex flex-1 items-center justify-between gap-2 text-left"
        >
          <div>
            <p className="font-semibold">{r.title}</p>
            <p className="text-xs text-neutral-500">
              {r.cookedDates.length > 0
                ? new Date(r.cookedDates[0]).toLocaleDateString("ja-JP")
                : "日付未設定"}
              {r.cookedDates.length > 1 &&
                `（他${r.cookedDates.length - 1}件）`}
              {" ・ "}
              {r.ingredientNames.join(", ")}
            </p>
          </div>
          <span className="text-neutral-400">{open ? "▲" : "▼"}</span>
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-black/10 pt-4 dark:border-white/10">
          <CookedDatesEditor recipeId={r.id} cookedDates={r.cookedDates} />
          <RecipeDetail recipe={r} />
          <div className="flex gap-3">
            <Link
              href={`/recipes/new?id=${r.id}`}
              className="text-xs text-neutral-500 hover:text-emerald-600"
            >
              編集する
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-neutral-400 hover:text-red-500"
            >
              ライブラリから削除
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
