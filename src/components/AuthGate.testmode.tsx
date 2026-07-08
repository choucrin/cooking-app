// テストビルド専用のログインバイパス版 AuthGate。
// scripts/build-test.mjs がビルド直前にのみ src/components/AuthGate.tsx へ一時的に
// コピーし、ビルド後に必ず元に戻す。通常の `npm run build` ではこのファイルは
// 一切参照されないため、本番ビルドにこのコードが含まれることはない。
export default function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-amber-500 px-4 py-1 text-center text-xs font-semibold text-white">
        ⚠ テストモード（ログイン不要）で表示しています。本番ビルドには含まれません。
      </div>
      {children}
    </>
  );
}
