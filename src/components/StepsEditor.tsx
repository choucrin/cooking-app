"use client";

import type { RecipeStep } from "@/lib/types";

export default function StepsEditor({
  steps,
  onChange,
}: {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}) {
  const updateStep = (index: number, patch: Partial<RecipeStep>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addStep = () => onChange([...steps, { headline: "", detail: "" }]);
  const removeStep = (index: number) =>
    onChange(steps.length > 1 ? steps.filter((_, i) => i !== index) : steps);

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-2">
          <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-neutral-400">
            {index + 1}.
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <input
              value={step.headline}
              onChange={(e) => updateStep(index, { headline: e.target.value })}
              placeholder="大まかな指示（任意。例: 下準備）"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-semibold dark:border-white/10 dark:bg-neutral-900"
            />
            <textarea
              value={step.detail}
              onChange={(e) => updateStep(index, { detail: e.target.value })}
              placeholder={`工程${index + 1}の詳細な指示`}
              rows={2}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
            />
          </div>
          <button
            type="button"
            onClick={() => removeStep(index)}
            disabled={steps.length === 1}
            className="rounded-lg px-2 text-sm text-neutral-400 hover:text-red-500 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="self-start rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-white/20 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        ＋ 工程を追加
      </button>
    </div>
  );
}
