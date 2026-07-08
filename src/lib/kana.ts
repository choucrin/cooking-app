// 全角カタカナをひらがなに変換する。よみの自動提案や、材料検索でひらがな入力と
// カタカナ表記の食材名を一致させるための正規化に使う（漢字はそのまま通過する）。
export function katakanaToHiragana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

// 検索・比較用の正規化（大文字小文字とカタカナ/ひらがなの違いを吸収する）
export function normalizeForSearch(value: string): string {
  return katakanaToHiragana(value.toLowerCase());
}
