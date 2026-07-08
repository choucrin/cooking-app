/**
 * next.config.ts の trailingSlash: true により、デプロイ後の実際のパスは
 * 末尾にスラッシュが付く（例: "/login/"）。pathname の完全一致比較はこれを
 * 考慮しないと常に不一致になってしまうため、比較前に正規化する。
 */
export function normalizePathname(pathname: string | null): string {
  if (!pathname) return "/";
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
