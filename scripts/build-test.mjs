#!/usr/bin/env node
// テスト用ビルド専用スクリプト。
//
// src/components/AuthGate.tsx を一時的にログインバイパス版
// (AuthGate.testmode.tsx) に差し替えてから `next build` を実行し、
// ビルドの成功・失敗・中断（Ctrl+C）を問わず必ず元のファイルに復元する。
//
// これにより、通常の `npm run build`（本番ビルド）が参照する
// src/components/AuthGate.tsx には、テストモードのコードが一切
// 含まれない状態が常に保たれる。

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const target = path.join(root, "src/components/AuthGate.tsx");
const testModeSource = path.join(root, "src/components/AuthGate.testmode.tsx");

if (!existsSync(testModeSource)) {
  console.error(`テストモード用ファイルが見つかりません: ${testModeSource}`);
  process.exit(1);
}

const original = readFileSync(target, "utf8");
let restored = false;

function restore() {
  if (restored) return;
  writeFileSync(target, original);
  restored = true;
  console.log("[build-test] AuthGate.tsx を本番版に復元しました。");
}

process.on("SIGINT", () => {
  restore();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restore();
  process.exit(143);
});

try {
  console.log("[build-test] AuthGate.tsx をテストモード版に差し替えます...");
  copyFileSync(testModeSource, target);

  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env },
    shell: process.platform === "win32",
  });

  process.exitCode = result.status ?? 1;
} finally {
  restore();
}
