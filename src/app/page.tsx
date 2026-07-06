import Link from "next/link";

const CARDS = [
  {
    href: "/ingredients",
    icon: "🥕",
    title: "食材・調味料を登録する",
    description: "自宅にある食材や調味料、在庫数、買い足し可否を管理します。",
  },
  {
    href: "/suggest",
    icon: "✨",
    title: "レシピを提案してもらう",
    description: "在庫のある食材から、Claudeが献立を1品考案します。",
  },
  {
    href: "/library",
    icon: "📚",
    title: "レシピライブラリ",
    description: "実際に作ったレシピを保存し、食材から検索できます。",
  },
  {
    href: "/calendar",
    icon: "📅",
    title: "カレンダー",
    description: "過去に作った料理をカレンダーから振り返れます。",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          今日、何作ろう？
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          自宅にある食材から、Claudeがぴったりのレシピを提案します。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
          >
            <span className="text-3xl">{card.icon}</span>
            <span className="text-lg font-semibold">{card.title}</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {card.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
