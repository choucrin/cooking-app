import Link from "next/link";

const CARDS = [
  {
    href: "/ingredients",
    icon: "🥕",
    title: "食材・調味料を登録する",
    description: "自宅にある食材や調味料、在庫数、買い足しを管理します。",
  },
  {
    href: "/recipes/new",
    icon: "📝",
    title: "レシピを書く",
    description: "自分で考えたレシピをエディタで記録し、使った材料をタグ付けします。",
  },
  {
    href: "/library",
    icon: "📚",
    title: "レシピライブラリ",
    description: "書きためたレシピを保存し、使用した食材から検索できます。",
  },
  {
    href: "/bookmarks",
    icon: "⭐",
    title: "ブックマーク",
    description: "☆を付けたお気に入りのレシピだけをすぐ確認できます。",
  },
  {
    href: "/calendar",
    icon: "📅",
    title: "カレンダー",
    description: "作った料理をカレンダーから振り返れます。",
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
          自宅の食材を管理しながら、自分だけのレシピノートを育てましょう。
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
