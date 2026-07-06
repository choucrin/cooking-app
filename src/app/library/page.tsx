"use client";

import { useEffect, useState } from "react";
import type { Recipe } from "@/lib/types";
import NutritionBadges from "@/components/NutritionBadges";

export default function LibraryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchRecipes = async (q: string) => {
    const url = q
      ? `/api/recipes?ingredient=${encodeURIComponent(q)}`
      : "/api/recipes";
    const res = await fetch(url);
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchRecipes("");
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    void fetchRecipes(query);
  };

  const remove = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">レシピライブラリ</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          実際に作ったレシピを保存しています。使用した食材で検索できます。
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="食材名で検索（例: 玉ねぎ）"
          className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          検索
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-500">読み込み中...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-neutral-500">
          該当するレシピが見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recipes.map((r) => {
            const open = openId === r.id;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(r.cookedAt).toLocaleDateString("ja-JP")} ・{" "}
                      {r.ingredientNames.join(", ")}
                    </p>
                  </div>
                  <span className="text-neutral-400">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-black/10 pt-4 dark:border-white/10">
                    <div>
                      <h3 className="mb-1 text-xs font-semibold text-neutral-500">
                        材料
                      </h3>
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {r.ingredients.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1 text-sm dark:bg-neutral-800"
                          >
                            <span>{item.name}</span>
                            <span className="text-neutral-500">
                              {item.amount}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-1 text-xs font-semibold text-neutral-500">
                        作り方
                      </h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {r.instructions}
                      </p>
                    </div>
                    <NutritionBadges nutrition={r.nutrition} />
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="self-start text-xs text-neutral-400 hover:text-red-500"
                    >
                      ライブラリから削除
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
