"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeForSearch } from "@/lib/kana";

export interface MaterialRow {
  mode: "select" | "custom";
  name: string;
  amount: string;
}

export function emptyMaterialRow(): MaterialRow {
  return { mode: "select", name: "", amount: "" };
}

export interface MaterialOption {
  name: string;
  // よみがな（ひらがな）。ひらがな入力で漢字・カタカナ名にヒットさせるための任意項目
  reading?: string;
}

export interface MaterialOptionGroup {
  label: string;
  options: MaterialOption[];
}

function MaterialCombobox({
  value,
  optionGroups,
  onSelect,
  onSelectCustom,
}: {
  value: string;
  optionGroups: MaterialOptionGroup[];
  onSelect: (name: string) => void;
  onSelectCustom: () => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // rows配列内での位置がずれて、既存のコンポーネントに別の行のvalueが
  // 渡された場合に表示を追従させる（Reactが推奨するレンダー中の状態調整）
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, []);

  const q = normalizeForSearch(query.trim());
  const matches = (option: MaterialOption): boolean => {
    if (!q) return true;
    if (normalizeForSearch(option.name).includes(q)) return true;
    if (option.reading && normalizeForSearch(option.reading).includes(q)) {
      return true;
    }
    return false;
  };
  const filteredGroups = optionGroups
    .map((g) => ({
      label: g.label,
      options: g.options.filter(matches),
    }))
    .filter((g) => g.options.length > 0);

  const cancelBlur = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  };

  const handleBlur = () => {
    // オプションのクリックがonBlurより先に処理されるよう、少し待ってから閉じる
    blurTimeout.current = setTimeout(() => {
      setQuery(value);
      setOpen(false);
    }, 150);
  };

  const handlePick = (name: string) => {
    cancelBlur();
    onSelect(name);
    setOpen(false);
  };

  const handlePickCustom = () => {
    cancelBlur();
    onSelectCustom();
    setOpen(false);
  };

  return (
    <div className="relative min-w-[140px] flex-1">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="材料名で検索"
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-800">
          {filteredGroups.length === 0 && (
            <p className="px-3 py-2 text-xs text-neutral-400">
              一致する材料がありません
            </p>
          )}
          {filteredGroups.map((group) => (
            <div key={group.label}>
              {filteredGroups.length > 1 && (
                <p className="px-3 pt-2 text-[11px] font-semibold text-neutral-400">
                  {group.label}
                </p>
              )}
              {group.options.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(option.name)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-neutral-700"
                >
                  {option.name}
                </button>
              ))}
            </div>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePickCustom}
            className="mt-1 block w-full border-t border-black/10 px-3 py-1.5 text-left text-sm text-emerald-600 dark:border-white/10"
          >
            ＋ その他（新しく登録する）
          </button>
        </div>
      )}
    </div>
  );
}

export default function MaterialRowsEditor({
  rows,
  onChange,
  optionGroups,
  addLabel,
  namePlaceholder,
}: {
  rows: MaterialRow[];
  onChange: (rows: MaterialRow[]) => void;
  optionGroups: MaterialOptionGroup[];
  addLabel: string;
  namePlaceholder: string;
}) {
  const updateRow = (index: number, patch: Partial<MaterialRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const addRow = () => onChange([...rows, emptyMaterialRow()]);
  const removeRow = (index: number) =>
    onChange(rows.length > 1 ? rows.filter((_, i) => i !== index) : rows);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap gap-2">
          {row.mode === "select" ? (
            <MaterialCombobox
              value={row.name}
              optionGroups={optionGroups}
              onSelect={(name) => updateRow(index, { name })}
              onSelectCustom={() =>
                updateRow(index, { mode: "custom", name: "" })
              }
            />
          ) : (
            <div className="flex min-w-[140px] flex-1 gap-1">
              <input
                value={row.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
                placeholder={namePlaceholder}
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
              />
              <button
                type="button"
                onClick={() => updateRow(index, { mode: "select", name: "" })}
                className="whitespace-nowrap rounded-lg border border-black/10 px-2 text-xs text-neutral-500 dark:border-white/20"
              >
                一覧から選ぶ
              </button>
            </div>
          )}
          <input
            value={row.amount}
            onChange={(e) => updateRow(index, { amount: e.target.value })}
            placeholder="分量（例: 200g）"
            className="w-32 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            disabled={rows.length === 1}
            className="rounded-lg px-2 text-sm text-neutral-400 hover:text-red-500 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-white/20 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {addLabel}
      </button>
    </div>
  );
}
