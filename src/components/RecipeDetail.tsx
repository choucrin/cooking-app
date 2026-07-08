import type { Recipe } from "@/lib/types";

function MaterialList({
  title,
  items,
}: {
  title: string;
  items: Recipe["ingredients"];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold text-neutral-500">{title}</h3>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1 text-sm dark:bg-neutral-800"
          >
            <span>{item.name}</span>
            <span className="text-neutral-500">{item.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-col gap-4">
      <MaterialList title="食材" items={recipe.ingredients} />
      <MaterialList title="調味料" items={recipe.seasonings} />
      {recipe.steps.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold text-neutral-500">
            作り方
          </h3>
          <ol className="flex flex-col gap-2">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="flex gap-2 text-sm leading-relaxed">
                <span className="shrink-0 font-semibold text-neutral-400">
                  {idx + 1}.
                </span>
                <span className="whitespace-pre-wrap">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
