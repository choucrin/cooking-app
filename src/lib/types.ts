export type IngredientCategory =
  | "VEGETABLE"
  | "FRUIT"
  | "MEAT"
  | "DAIRY_EGG"
  | "OTHER"
  | "SEASONING";

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  VEGETABLE: "野菜",
  FRUIT: "果物",
  MEAT: "肉",
  DAIRY_EGG: "卵・乳製品",
  OTHER: "その他",
  SEASONING: "調味料",
};

// 食材選択画面（レシピ提案）に表示するカテゴリ。調味料は常に全て利用可能なため表示しない
export const FOOD_CATEGORIES: IngredientCategory[] = [
  "VEGETABLE",
  "FRUIT",
  "MEAT",
  "DAIRY_EGG",
  "OTHER",
];

export const ALL_CATEGORIES: IngredientCategory[] = [
  ...FOOD_CATEGORIES,
  "SEASONING",
];

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  stock: number;
  canBuy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredientItem {
  name: string;
  amount: string;
}

// 1人分の目安の栄養成分
export interface NutritionInfo {
  calories: number; // エネルギー (kcal)
  protein: number; // たんぱく質 (g)
  fat: number; // 脂質 (g)
  carbohydrates: number; // 炭水化物 (g)
  salt: number; // 食塩相当量 (g)
}

export const NUTRITION_LABELS: Record<keyof NutritionInfo, string> = {
  calories: "エネルギー",
  protein: "たんぱく質",
  fat: "脂質",
  carbohydrates: "炭水化物",
  salt: "食塩相当量",
};

export const NUTRITION_UNITS: Record<keyof NutritionInfo, string> = {
  calories: "kcal",
  protein: "g",
  fat: "g",
  carbohydrates: "g",
  salt: "g",
};

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredientItem[];
  ingredientNames: string[];
  instructions: string;
  nutrition: NutritionInfo;
  cookedAt: string;
  createdAt: string;
}

export interface SuggestedRecipe {
  title: string;
  ingredients: RecipeIngredientItem[];
  instructions: string;
  nutrition: NutritionInfo;
}
