"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FOOD_CATEGORIES,
  CATEGORY_LABELS,
  type Ingredient,
  type IngredientCategory,
  type SuggestedRecipe,
} from "@/lib/types";
import NutritionBadges from "@/components/NutritionBadges";

type Phase = "idle" | "loading" | "result" | "saved";

export default function SuggestPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("idle");
  const [recipe, setRecipe] = useState<SuggestedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingIngredients(true);
      const res = await fetch("/api/ingredients");
      const data: Ingredient[] = await res.json();
      // 選択画面には「在庫あり」または「買い足し可」の食材のみ表示する（調味料は除く）
      setIngredients(
        data.filter(
          (i) => i.category !== "SEASONING" && (i.stock > 0 || i.canBuy)
        )
      );
      setLoadingIngredients(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const c of FOOD_CATEGORIES) map.set(c, []);
    for (const ing of ingredients) map.get(ing.category)?.push(ing);
    return map;
  }, [ingredients]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const requestSuggestion = async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提案に失敗しました");
      setRecipe(data);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提案に失敗しました");
      setPhase("idle");
    }
  };

  const markCooked = async () => {
    if (!recipe) return;
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    setPhase("saved");
  };

  const reset = () => {
    setRecipe(null);
    setPhase("idle");
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">レシピ提案</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          使いたい食材を選んでください。調味料は登録済みのものが自動的にすべて使用可能です。
        </p>
      </div>

      {(phase === "idle" || phase === "loading") && (
        <>
          {loadingIngredients ? (
            <p className="text-sm text-neutral-500">読み込み中...</p>
          ) : ingredients.length === 0 ? (
            <p className="text-sm text-neutral-500">
              選択できる食材がありません。まず
              <a href="/ingredients" className="underline">
                食材登録
              </a>
              を行ってください（在庫ありまたは買い足し可の食材が対象です）。
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {FOOD_CATEGORIES.map((category) => {
                const items = grouped.get(category) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={category}>
                    <h2 className="mb-2 text-sm font-semibold text-neutral-500">
                      {CATEGORY_LABELS[category]}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {items.map((ing) => {
                        const active = selected.has(ing.id);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => toggle(ing.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              active
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-black/10 bg-white hover:border-emerald-400 dark:border-white/10 dark:bg-neutral-900"
                            }`}
                          >
                            {ing.name}
                            {ing.stock === 0 && (
                              <span className="ml-1 text-xs opacity-70">
                                (買い足し)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={selected.size === 0 || phase === "loading"}
            onClick={requestSuggestion}
            className="self-start rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {phase === "loading"
              ? "考案中..."
              : `選んだ${selected.size}個の食材でレシピを提案してもらう`}
          </button>
        </>
      )}

      {phase === "result" && recipe && (
        <div className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-xl font-bold">{recipe.title}</h2>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-500">
              使用する材料と分量
            </h3>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {recipe.ingredients.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:bg-neutral-800"
                >
                  <span>{item.name}</span>
                  <span className="text-neutral-500">{item.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-500">
              作り方
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {recipe.instructions}
            </p>
          </div>

          <NutritionBadges nutrition={recipe.nutrition} />

          <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <span className="text-sm font-medium">
              実際にこのレシピを作りましたか？
            </span>
            <button
              type="button"
              onClick={markCooked}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              作った（ライブラリに保存）
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm dark:border-white/20"
            >
              作らなかった
            </button>
          </div>
        </div>
      )}

      {phase === "saved" && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            ライブラリとカレンダーに保存しました！
          </p>
          <div className="flex gap-3 text-sm">
            <a href="/library" className="underline">
              ライブラリを見る
            </a>
            <a href="/calendar" className="underline">
              カレンダーを見る
            </a>
            <button type="button" onClick={reset} className="underline">
              もう一度提案してもらう
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
