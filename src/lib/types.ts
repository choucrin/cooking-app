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

export interface Recipe {
  id: string;
  title: string;
  // 食材（調味料は含まない）
  ingredients: RecipeIngredientItem[];
  // 調味料
  seasonings: RecipeIngredientItem[];
  // 作り方。1工程ごとに1要素（表示時に1. 2. 3. ...と採番される）
  steps: string[];
  // 検索用に食材・調味料の名前だけを平坦化した配列
  ingredientNames: string[];
  // 作った（または記録したい）日付。複数指定可。カレンダー表示のキー
  cookedDates: string[];
  createdAt: string;
  updatedAt: string;
}
