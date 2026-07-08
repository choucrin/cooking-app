"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ingredient } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

function toIso(value: Timestamp | undefined): string {
  return value ? value.toDate().toISOString() : new Date().toISOString();
}

// ジャンルを固定enum(VEGETABLE等)から自由入力文字列に変更する前に保存された
// データとの互換性のため、旧コードを新しい表示ラベルに読み替える
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  VEGETABLE: "野菜",
  FRUIT: "果物",
  MEAT: "肉",
  DAIRY_EGG: "卵・乳製品",
  OTHER: "その他",
  SEASONING: "調味料",
};

function normalizeCategory(raw: string): string {
  return LEGACY_CATEGORY_LABELS[raw] ?? raw;
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(
        collection(db, "ingredients"),
        orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setIngredients(
            snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name,
                category: normalizeCategory(data.category),
                stock: data.stock ?? 0,
                canBuy: data.canBuy ?? false,
                createdAt: toIso(data.createdAt),
                updatedAt: toIso(data.updatedAt),
              } as Ingredient;
            })
          );
          setLoading(false);
        },
        (err) => {
          console.warn("[ingredients] 読み込みに失敗しました。", err);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (err) {
      // Firebase未設定（ダミー値）の場合、dbが正しく初期化されておらず
      // ここで例外が発生しうる。アプリ全体をクラッシュさせない。
      console.warn("[ingredients] Firestoreへの接続に失敗しました。", err);
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  return { ingredients, loading };
}
