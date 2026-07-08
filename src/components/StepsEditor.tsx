"use client";

export default function StepsEditor({
  steps,
  onChange,
}: {
  steps: string[];
  onChange: (steps: string[]) => void;
}) {
  const updateStep = (index: number, value: string) => {
    onChange(steps.map((s, i) => (i === index ? value : s)));
  };
  const addStep = () => onChange([...steps, ""]);
  const removeStep = (index: number) =>
    onChange(steps.length > 1 ? steps.filter((_, i) => i !== index) : steps);

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-2">
          <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-neutral-400">
            {index + 1}.
          </span>
          <textarea
            value={step}
            onChange={(e) => updateStep(index, e.target.value)}
            placeholder={`工程${index + 1}の内容`}
            rows={2}
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
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
