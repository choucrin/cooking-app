"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Recipe } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

function toIso(value: Timestamp | undefined): string {
  return value ? value.toDate().toISOString() : new Date().toISOString();
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setRecipes(
            snapshot.docs.map((d) => {
              const data = d.data();
              const cookedDates: Timestamp[] = data.cookedDates?.length
                ? data.cookedDates
                : data.cookedAt
                  ? [data.cookedAt]
                  : [];
              return {
                id: d.id,
                title: data.title,
                ingredients: data.ingredients ?? [],
                seasonings: data.seasonings ?? [],
                steps: data.steps ?? [],
                ingredientNames: data.ingredientNames ?? [],
                cookedDates: cookedDates
                  .map((ts) => toIso(ts))
                  .sort((a, b) => b.localeCompare(a)),
                createdAt: toIso(data.createdAt),
                updatedAt: toIso(data.updatedAt),
              } as Recipe;
            })
          );
          setLoading(false);
        },
        (err) => {
          console.warn("[recipes] 読み込みに失敗しました。", err);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (err) {
      // Firebase未設定（ダミー値）の場合、dbが正しく初期化されておらず
      // ここで例外が発生しうる。アプリ全体をクラッシュさせない。
      console.warn("[recipes] Firestoreへの接続に失敗しました。", err);
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  return { recipes, loading };
}
