"use client";

import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useIngredients } from "@/lib/useIngredients";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type Ingredient,
  type IngredientCategory,
} from "@/lib/types";

const emptyForm = {
  name: "",
  category: "VEGETABLE" as IngredientCategory,
  stock: 1,
  canBuy: false,
};

export default function IngredientsPage() {
  const { ingredients, loading } = useIngredients();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const grouped = useMemo(() => {
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const c of ALL_CATEGORIES) map.set(c, []);
    for (const ing of ingredients) {
      map.get(ing.category)?.push(ing);
    }
    return map;
  }, [ingredients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    const isDuplicate = ingredients.some(
      (i) => i.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError("すでに同じ名前の食材・調味料が登録されています");
      return;
    }

    setError(null);
    const { category, canBuy } = form;
    const stock = Math.max(0, form.stock);

    // 保存の完了を待たずにフォームをリセットし、連続して登録できるようにする
    setForm({ ...emptyForm, category });

    addDoc(collection(db, "ingredients"), {
      name: trimmedName,
      category,
      stock,
      canBuy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    });
  };

  const updateIngredient = async (
    id: string,
    data: Partial<Pick<Ingredient, "stock" | "canBuy">>
  ) => {
    await updateDoc(doc(db, "ingredients", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteIngredient = async (id: string) => {
    await deleteDoc(doc(db, "ingredients", id));
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">食材・調味料の登録</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          在庫数と「買い足し可」を管理します。レシピを書くときの材料名の候補にも使われます。
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:flex-row sm:items-end sm:flex-wrap"
      >
        <div className="flex flex-1 flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-medium text-neutral-500">材料名</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="例: 玉ねぎ"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">分類</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value as IngredientCategory,
              }))
            }
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">在庫数</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) =>
              setForm((f) => ({ ...f, stock: Number(e.target.value) }))
            }
            className="w-20 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={form.canBuy}
            onChange={(e) =>
              setForm((f) => ({ ...f, canBuy: e.target.checked }))
            }
            className="h-4 w-4"
          />
          買い足し可
        </label>
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          追加する
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-6">
          {ALL_CATEGORIES.map((category) => {
            const items = grouped.get(category) ?? [];
            return (
              <section key={category}>
                <h2 className="mb-2 text-sm font-semibold text-neutral-500">
                  {CATEGORY_LABELS[category]}（{items.length}）
                </h2>
                {items.length === 0 ? (
                  <p className="text-sm text-neutral-400">未登録</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((ing) => (
                      <li
                        key={ing.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-neutral-900"
                      >
                        <span className="min-w-[80px] flex-1 font-medium">
                          {ing.name}
                        </span>

                        {category !== "SEASONING" && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateIngredient(ing.id, {
                                  stock: Math.max(0, ing.stock - 1),
                                })
                              }
                              className="h-7 w-7 rounded-full border border-black/10 text-sm dark:border-white/20"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">
                              {ing.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateIngredient(ing.id, {
                                  stock: ing.stock + 1,
                                })
                              }
                              className="h-7 w-7 rounded-full border border-black/10 text-sm dark:border-white/20"
                            >
                              ＋
                            </button>
                          </div>
                        )}

                        {category !== "SEASONING" && (
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                            <input
                              type="checkbox"
                              checked={ing.canBuy}
                              onChange={(e) =>
                                updateIngredient(ing.id, {
                                  canBuy: e.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5"
                            />
                            買い足し可
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteIngredient(ing.id)}
                          className="ml-auto text-xs text-neutral-400 hover:text-red-500"
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
