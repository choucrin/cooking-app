"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { normalizePathname } from "@/lib/paths";

const NAV_ITEMS = [
  { href: "/ingredients", label: "食材登録", icon: "🥕" },
  { href: "/recipes/new", label: "レシピを書く", icon: "📝" },
  { href: "/library", label: "ライブラリ", icon: "📚" },
  { href: "/calendar", label: "カレンダー", icon: "📅" },
];

export default function NavBar() {
  const pathname = normalizePathname(usePathname());
  const router = useRouter();

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-900/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            🍳 今日の献立
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* モバイル用ボトムナビゲーション */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 backdrop-blur sm:hidden dark:border-white/10 dark:bg-neutral-900/95">
        <div className="mx-auto flex max-w-4xl">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
