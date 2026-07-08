"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIngredients } from "@/lib/useIngredients";
import { ALL_CATEGORIES, CATEGORY_LABELS, type Ingredient, type IngredientCategory } from "@/lib/types";

export default function PickIngredientsPage() {
  const router = useRouter();
  const { ingredients, loading } = useIngredients();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const c of ALL_CATEGORIES) map.set(c, []);
    for (const ing of ingredients) map.get(ing.category)?.push(ing);
    return map;
  }, [ingredients]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSearch = () => {
    const names = Array.from(selected);
    const query =
      names.length > 0
        ? `?ingredients=${encodeURIComponent(names.join(","))}`
        : "";
    router.push(`/library${query}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">食材から探す</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          登録済みの食材・調味料から選ぶと、選んだものをすべて使ったレシピに絞り込めます。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">読み込み中...</p>
      ) : ingredients.length === 0 ? (
        <p className="text-sm text-neutral-500">
          まだ食材が登録されていません。
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {ALL_CATEGORIES.map((category) => {
            const items = grouped.get(category) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-2 text-sm font-semibold text-neutral-500">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {items.map((ing) => {
                    const active = selected.has(ing.name);
                    return (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => toggle(ing.name)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-black/10 bg-white hover:border-emerald-400 dark:border-white/10 dark:bg-neutral-900"
                        }`}
                      >
                        {ing.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={handleSearch}
          disabled={selected.size === 0}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {selected.size > 0
            ? `選んだ${selected.size}個の食材で絞り込む`
            : "食材を選んでください"}
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-neutral-500 hover:text-red-500"
          >
            選択をクリア
          </button>
        )}
      </div>
    </div>
  );
}
