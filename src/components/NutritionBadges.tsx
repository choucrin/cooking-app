import {
  NUTRITION_LABELS,
  NUTRITION_UNITS,
  type NutritionInfo,
} from "@/lib/types";

const ORDER: (keyof NutritionInfo)[] = [
  "calories",
  "protein",
  "fat",
  "carbohydrates",
  "salt",
];

export default function NutritionBadges({
  nutrition,
}: {
  nutrition: NutritionInfo | null | undefined;
}) {
  if (!nutrition || typeof nutrition.calories !== "number") return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-neutral-500">
        栄養成分（1人分目安）
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ORDER.map((key) => (
          <div
            key={key}
            className="rounded-lg bg-neutral-50 px-3 py-2 text-center dark:bg-neutral-800"
          >
            <p className="text-[11px] text-neutral-500">
              {NUTRITION_LABELS[key]}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {nutrition[key]}
              <span className="ml-0.5 text-xs font-normal text-neutral-500">
                {NUTRITION_UNITS[key]}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
