"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRecipes } from "@/lib/useRecipes";
import RecipeListItem from "@/components/RecipeListItem";

export default function BookmarksPage() {
  const { recipes, loading } = useRecipes();
  const [openId, setOpenId] = useState<string | null>(null);

  const bookmarked = useMemo(
    () => recipes.filter((r) => r.bookmarked),
    [recipes]
  );

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
        <h1 className="text-2xl font-bold tracking-tight">ブックマーク</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          ★を付けたレシピだけをすぐに確認できます。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">読み込み中...</p>
      ) : bookmarked.length === 0 ? (
        <p className="text-sm text-neutral-500">
          まだブックマークしたレシピがありません。ライブラリの☆マークから追加できます。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookmarked.map((r) => (
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
