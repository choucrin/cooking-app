"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useIngredients } from "@/lib/useIngredients";
import MaterialRowsEditor, {
  emptyMaterialRow,
  type MaterialRow,
} from "@/components/MaterialRowsEditor";
import StepsEditor from "@/components/StepsEditor";
import { CATEGORY_LABELS, FOOD_CATEGORIES } from "@/lib/types";
import type { RecipeIngredientItem } from "@/lib/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toMaterialRows(
  items: RecipeIngredientItem[] | undefined,
  knownNames: Set<string>
): MaterialRow[] {
  if (!items || items.length === 0) return [emptyMaterialRow()];
  return items.map((item) => ({
    mode: knownNames.has(item.name) ? "select" : "custom",
    name: item.name,
    amount: item.amount,
  }));
}

function cleanRows(rows: MaterialRow[]): RecipeIngredientItem[] {
  return rows
    .map((r) => ({ name: r.name.trim(), amount: r.amount.trim() }))
    .filter((r) => r.name.length > 0);
}

export default function RecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { ingredients: allIngredients } = useIngredients();

  const [title, setTitle] = useState("");
  const [ingredientRows, setIngredientRows] = useState<MaterialRow[]>([
    emptyMaterialRow(),
  ]);
  const [seasoningRows, setSeasoningRows] = useState<MaterialRow[]>([
    emptyMaterialRow(),
  ]);
  const [steps, setSteps] = useState<string[]>([""]);
  // まだ作っていないレシピだけを登録したい場合のため、作った日の記録は選択式にする
  const [recordCookedDate, setRecordCookedDate] = useState(true);
  const [cookedAt, setCookedAt] = useState(today());
  // 編集時、フォームの日付入力欄で扱う1件目以外の「作った日」
  // （2件目以降はライブラリ画面でまとめて管理する）
  const [extraCookedDates, setExtraCookedDates] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const snap = await getDoc(doc(db, "recipes", editId));
      if (snap.exists()) {
        const data = snap.data();
        const knownNames = new Set(allIngredients.map((i) => i.name));
        setTitle(data.title ?? "");
        setIngredientRows(toMaterialRows(data.ingredients, knownNames));
        setSeasoningRows(toMaterialRows(data.seasonings, knownNames));
        setSteps(data.steps?.length ? data.steps : [""]);
        const cookedDates: Timestamp[] = data.cookedDates?.length
          ? data.cookedDates
          : data.cookedAt
            ? [data.cookedAt]
            : [];
        if (cookedDates.length > 0) {
          const sorted = cookedDates
            .map((ts) => ts.toDate().toISOString().slice(0, 10))
            .sort((a, b) => b.localeCompare(a));
          setRecordCookedDate(true);
          setCookedAt(sorted[0]);
          setExtraCookedDates(sorted.slice(1));
        } else {
          setRecordCookedDate(false);
        }
      }
      setLoadingExisting(false);
    })();
    // 初回読み込み時のみ実行（allIngredientsの変動で再取得したくないため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const ingredientOptionGroups = useMemo(
    () =>
      FOOD_CATEGORIES.map((cat) => ({
        label: CATEGORY_LABELS[cat],
        names: allIngredients
          .filter((i) => i.category === cat)
          .map((i) => i.name),
      })),
    [allIngredients]
  );

  const seasoningOptionGroups = useMemo(
    () => [
      {
        label: CATEGORY_LABELS.SEASONING,
        names: allIngredients
          .filter((i) => i.category === "SEASONING")
          .map((i) => i.name),
      },
    ],
    [allIngredients]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("料理名を入力してください");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const cleanedIngredients = cleanRows(ingredientRows);
      const cleanedSeasonings = cleanRows(seasoningRows);
      const cleanedSteps = steps.map((s) => s.trim()).filter((s) => s.length > 0);

      // 「その他」タブから新規入力された材料・調味料を食材登録に自動保存する
      // （大文字・小文字の違いだけの重複や、同じ回の複数行での重複は登録しない）
      const existingNamesLower = new Set(
        allIngredients.map((i) => i.name.trim().toLowerCase())
      );
      const pickNewNames = (materialRows: MaterialRow[]): string[] => {
        const seen = new Set<string>();
        const result: string[] = [];
        for (const r of materialRows) {
          if (r.mode !== "custom") continue;
          const trimmed = r.name.trim();
          if (!trimmed) continue;
          const lower = trimmed.toLowerCase();
          if (existingNamesLower.has(lower) || seen.has(lower)) continue;
          seen.add(lower);
          result.push(trimmed);
        }
        return result;
      };
      const newFoodNames = pickNewNames(ingredientRows);
      const newSeasoningNames = pickNewNames(seasoningRows);

      await Promise.all([
        ...newFoodNames.map((name) =>
          addDoc(collection(db, "ingredients"), {
            name,
            category: "OTHER",
            stock: 0,
            canBuy: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        ),
        ...newSeasoningNames.map((name) =>
          addDoc(collection(db, "ingredients"), {
            name,
            category: "SEASONING",
            stock: 0,
            canBuy: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        ),
      ]);

      // チェックを外した場合でも、ライブラリ側で追加された記録日は消さずに残す
      const allCookedDates = Array.from(
        new Set(
          recordCookedDate ? [cookedAt, ...extraCookedDates] : extraCookedDates
        )
      );
      const payload = {
        title: title.trim(),
        ingredients: cleanedIngredients,
        seasonings: cleanedSeasonings,
        steps: cleanedSteps,
        ingredientNames: [...cleanedIngredients, ...cleanedSeasonings].map(
          (r) => r.name
        ),
        cookedDates: allCookedDates.map((d) =>
          Timestamp.fromDate(new Date(`${d}T00:00:00`))
        ),
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "recipes", editId), payload);
      } else {
        await addDoc(collection(db, "recipes"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      router.push("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return <p className="text-sm text-neutral-500">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {editId ? "レシピを編集" : "レシピを書く"}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          料理名・使った材料・作り方を記録しましょう。登録済みの食材・調味料から選べます（一覧にないものは「その他」から新しく登録できます）。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">
            料理名
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 豚肉と玉ねぎの生姜焼き"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recordCookedDate}
              onChange={(e) => setRecordCookedDate(e.target.checked)}
              className="h-4 w-4"
            />
            作った日を記録する（カレンダーに表示されます）
          </label>
          {!recordCookedDate && (
            <p className="text-xs text-neutral-500">
              まだ作っていないレシピとして、日付を記録せずに保存できます。作ったらライブラリ画面から日付を追加できます。
            </p>
          )}
          {recordCookedDate && (
            <>
              <input
                type="date"
                value={cookedAt}
                onChange={(e) => setCookedAt(e.target.value)}
                className="w-fit rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
              />
              {extraCookedDates.length > 0 && (
                <p className="text-xs text-neutral-500">
                  他{extraCookedDates.length}件の記録日があります（追加・削除はライブラリ画面から行えます）
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-500">食材</label>
          <MaterialRowsEditor
            rows={ingredientRows}
            onChange={setIngredientRows}
            optionGroups={ingredientOptionGroups}
            addLabel="＋ 食材を追加"
            namePlaceholder="新しい食材名"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-500">
            調味料
          </label>
          <MaterialRowsEditor
            rows={seasoningRows}
            onChange={setSeasoningRows}
            optionGroups={seasoningOptionGroups}
            addLabel="＋ 調味料を追加"
            namePlaceholder="新しい調味料名"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-500">
            作り方（工程ごとに分けて記録できます）
          </label>
          <StepsEditor steps={steps} onChange={setSteps} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "レシピを保存する"}
        </button>
      </form>
    </div>
  );
}
