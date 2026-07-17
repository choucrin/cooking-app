// ジャンルは固定の列挙型ではなく自由入力の文字列。値そのものが表示ラベルになる
// （例: "野菜", "肉", ユーザーが追加した任意のジャンル名）。
export type IngredientCategory = string;

// 「調味料」だけは特別扱い（在庫/買い足し可を持たず、レシピ作成画面でも別枠になる）
export const SEASONING_CATEGORY = "調味料";

// 新規インストール時など、食材が1件も登録されていなくても最初から選べるジャンル。
// ここにない値も、食材登録画面からユーザーが自由に追加できる。
export const DEFAULT_FOOD_CATEGORIES: IngredientCategory[] = [
  "野菜",
  "果物",
  "肉",
  "卵・乳製品",
  "その他",
];

/**
 * 現在登録されている食材から、実際に使われている食材ジャンル（調味料を除く）を集める。
 * デフォルトのジャンルを先頭に、ユーザーが追加した独自ジャンルを登場順で後ろに続ける。
 */
export function collectFoodCategories(
  ingredients: Pick<Ingredient, "category">[]
): IngredientCategory[] {
  const set = new Set<IngredientCategory>(DEFAULT_FOOD_CATEGORIES);
  for (const i of ingredients) {
    if (i.category !== SEASONING_CATEGORY) set.add(i.category);
  }
  return Array.from(set);
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  // よみがな（ひらがな）。レシピ作成画面でひらがな入力から検索できるようにするための任意項目
  reading: string;
  stock: number;
  // 買い足しが必要かどうか
  canBuy: boolean;
  // 買い足しが必要な個数（canBuyがtrueのときのみ意味を持つ）
  buyQuantity: number;
  createdAt: string;
  updatedAt: string;
}

// 手順内で「★の調味料をあわせておく」のように参照するための目印記号の候補
export const MATERIAL_MARKS = ["★", "●", "▲", "■", "◆"] as const;

export interface RecipeIngredientItem {
  name: string;
  amount: string;
  // 手順で参照するための目印記号（未設定は空文字）
  mark: string;
}

// 作り方の1工程。「大まかな指示（見出し）」と「詳細な指示」の2階層を持つ。
// headlineが空の場合は見出しなしの単一階層としてdetailだけが表示される
export interface RecipeStep {
  headline: string;
  detail: string;
}

// 階層導入前の旧データ（string[]の1工程1文字列）との互換のため、
// 読み込み時に正規化する
export function normalizeStep(raw: unknown): RecipeStep {
  if (typeof raw === "string") return { headline: "", detail: raw };
  const obj = (raw ?? {}) as Partial<RecipeStep>;
  return { headline: obj.headline ?? "", detail: obj.detail ?? "" };
}

export interface Recipe {
  id: string;
  title: string;
  // 食材（調味料は含まない）
  ingredients: RecipeIngredientItem[];
  // 調味料
  seasonings: RecipeIngredientItem[];
  // 作り方。1工程ごとに1要素（表示時に1. 2. 3. ...と採番される）
  steps: RecipeStep[];
  // 検索用に食材・調味料の名前だけを平坦化した配列
  ingredientNames: string[];
  // 作った（または記録したい）日付。複数指定可。カレンダー表示のキー
  cookedDates: string[];
  // ブックマーク（お気に入り）に登録されているか
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}
