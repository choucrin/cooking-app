"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRecipes } from "@/lib/useRecipes";
import RecipeListItem from "@/components/RecipeListItem";

export default function LibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { recipes, loading } = useRecipes();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const selectedIngredients = useMemo(() => {
    const raw = searchParams.get("ingredients");
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  const removeIngredientFilter = (name: string) => {
    const next = selectedIngredients.filter((n) => n !== name);
    if (next.length > 0) {
      router.push(`/library?ingredients=${encodeURIComponent(next.join(","))}`);
    } else {
      router.push("/library");
    }
  };

  const clearIngredientFilters = () => router.push("/library");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchesText =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.ingredientNames.some((n) => n.toLowerCase().includes(q));
      const matchesIngredients =
        selectedIngredients.length === 0 ||
        selectedIngredients.every((name) => r.ingredientNames.includes(name));
      return matchesText && matchesIngredients;
    });
  }, [recipes, query, selectedIngredients]);

  const remove = async (id: string) => {
    await deleteDoc(doc(db, "recipes", id));
  };

  const toggleBookmark = async (id: string, next: boolean) => {
    await updateDoc(doc(db, "recipes", id), {
      bookmarked: next,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">レシピライブラリ</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          書きためたレシピを保存しています。使用した食材で検索できます。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="食材名・料理名で検索（例: 玉ねぎ）"
            className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
          <Link
            href="/library/pick-ingredients"
            className="flex items-center whitespace-nowrap rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:border-white/20 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            🥕 食材から探す
          </Link>
        </div>

        {selectedIngredients.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedIngredients.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => removeIngredientFilter(name)}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
              >
                {name} ✕
              </button>
            ))}
            <button
              type="button"
              onClick={clearIngredientFilters}
              className="text-xs text-neutral-500 hover:text-red-500"
            >
              すべてクリア
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          該当するレシピが見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((r) => (
            <RecipeListItem
              key={r.id}
              recipe={r}
              open={openId === r.id}
              onToggleOpen={() => setOpenId(openId === r.id ? null : r.id)}
              onToggleBookmark={() => toggleBookmark(r.id, !r.bookmarked)}
              onDelete={() => remove(r.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
